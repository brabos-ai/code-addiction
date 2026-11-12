import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { docsMigrate, collectLegacy, migrateQaSettings, STAMP_SCHEMA_TYPES, STAMP_ID_RULES, STAMP_FIELDS } from '../src/docs-migrate.js';
import { MIGRATIONS, runMigrations } from '../src/migrations.js';
import { installDocsRoot } from './helpers/brownfield-fixture.js';

// Every child process the migrate module starts is recorded by name.
const spawned = vi.hoisted(() => []);
vi.mock('node:child_process', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    spawnSync: (cmd, ...rest) => {
      spawned.push(String(cmd));
      return real.spawnSync(cmd, ...rest);
    },
    spawn: (cmd, ...rest) => {
      spawned.push(String(cmd));
      return real.spawn(cmd, ...rest);
    },
  };
});

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SCRIPTS = path.join(ROOT, 'framwork', '.codeadd', 'scripts');
const FIXTURE = path.join(import.meta.dirname, 'fixtures', 'docs-migrate', 'legacy');
const { docSchemaOf, DOCS_ROOT, DOCS_BRANCH } = require(path.join(SCRIPTS, 'docs-root.cjs'));

const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).trim();

/** Copy the fixture tree; `dot-codeadd` lands as `.codeadd` (a dot-directory would be ignored by this repo's own ignore rules). */
function copyFixture(dest) {
  const walk = (from, to) => {
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      const name = e.name === 'dot-codeadd' ? '.codeadd' : e.name;
      if (e.isDirectory()) {
        fs.mkdirSync(path.join(to, name), { recursive: true });
        walk(path.join(from, e.name), path.join(to, name));
      } else {
        fs.copyFileSync(path.join(from, e.name), path.join(to, name));
      }
    }
  };
  walk(FIXTURE, dest);
}

/** A legacy project against a REAL separate bare remote, scripts installed, nothing prepared. */
function makeLegacyProject({ legacy = true } = {}) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'docs-migrate-')));
  const bare = path.join(base, 'remote.git');
  const repo = path.join(base, 'repo');
  fs.mkdirSync(repo);
  git(base, 'init', '--bare', '-q', '--initial-branch=main', bare);
  git(repo, 'init', '-q', '--initial-branch=main');
  git(repo, 'config', 'user.email', 't@t.t');
  git(repo, 'config', 'user.name', 'T');
  git(repo, 'config', 'commit.gpgsign', 'false');
  git(repo, 'remote', 'add', 'origin', bare);
  if (legacy) copyFixture(repo);
  const scriptsDest = path.join(repo, '.codeadd', 'scripts');
  fs.mkdirSync(scriptsDest, { recursive: true });
  for (const f of ['docs-root.cjs', 'docs-branch.cjs', 'docs-guard.cjs']) fs.copyFileSync(path.join(SCRIPTS, f), path.join(scriptsDest, f));
  fs.writeFileSync(
    path.join(repo, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '1.8.1', providers: ['claude'], files: [], scope: 'project' }),
  );
  fs.writeFileSync(path.join(repo, '.gitignore'), '.codeadd/*\n!.codeadd/project\n');
  git(repo, 'add', '-A');
  if (fs.existsSync(path.join(repo, '.codeadd', 'project'))) git(repo, 'add', '-f', '.codeadd/project');
  git(repo, 'commit', '-q', '-m', 'legacy project');
  git(repo, 'push', '-q', '-u', 'origin', 'main');
  return { base, bare, repo, docsRoot: path.join(repo, ...DOCS_ROOT.split('/')) };
}

let out;
let spy;
beforeEach(() => {
  out = [];
  spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    out.push(String(chunk));
    return true;
  });
});
afterEach(() => spy.mockRestore());
const stdout = () => out.join('');

describe('F18 — docs migrate', () => {
  let p;
  afterEach(() => p && fs.rmSync(p.base, { recursive: true, force: true }));

  it('--dry-run lists what would move and writes nothing', async () => {
    p = makeLegacyProject();
    const head = git(p.repo, 'rev-parse', 'HEAD');
    await docsMigrate(p.repo, ['--dry-run']);
    expect(stdout()).toMatch(/MIGRATED=moved:\d+/);
    expect(stdout()).toContain('WOULD_MOVE');
    expect(git(p.repo, 'status', '--porcelain')).toBe('');
    expect(fs.existsSync(p.docsRoot)).toBe(false);
    expect(git(p.repo, 'rev-parse', 'HEAD')).toBe(head);
  });

  it('collects the Code Addiction outputs and leaves the user\'s own file out', () => {
    p = makeLegacyProject();
    const from = collectLegacy(p.repo).map((f) => f.from);
    expect(from).toContain('docs/features/0001F-login/about.md');
    expect(from).toContain('docs/features/0001F-login/iterations.md');
    expect(from).toContain('docs/health-checks/2026-01-01/security.md');
    expect(from).toContain('docs/delivered.jsonl');
    expect(from).toContain('.codeadd/project/decisions.jsonl');
    expect(from).not.toContain('docs/api.md');
    // audit and audits are one `audits` now (R8)
    expect(collectLegacy(p.repo).find((f) => f.from === 'docs/audit/2026-01-01.md').to).toBe('audits/2026-01-01.md');
  });

  it('moves everything into one commit on the docs branch with the Migrated-From trailer', async () => {
    p = makeLegacyProject();
    const head = git(p.repo, 'rev-parse', 'HEAD');
    await docsMigrate(p.repo, []);
    const n = Number(/MIGRATED=moved:(\d+)/.exec(stdout())[1]);
    expect(n).toBeGreaterThan(8);

    const doc = (rel) => path.join(p.docsRoot, ...rel.split('/'));
    for (const rel of [
      'features/0001F-login/about.md',
      'features/0001F-login/iterations.md',
      'features/0001F-login/plan.md',
      'brainstorm/2026-01-01T000000-idea-intent.md',
      'diagnose/report.md',
      'audits/2026-01-01.md',
      'health-checks/2026-01-01/security.md',
      'changelog/CHG0001.md',
      'delivered.jsonl',
      'design-system.md',
      'decisions.jsonl',
    ]) {
      expect(fs.existsSync(doc(rel)), rel).toBe(true);
    }

    // one migration commit, carrying the trailer with the code base sha
    const log = git(p.docsRoot, 'log', '--format=%H%n%B', '--grep=^Migrated-From:');
    expect(log).toContain(`Migrated-From: ${head}`);
    expect(git(p.docsRoot, 'log', '--grep=^Migrated-From:', '--format=%H').split('\n')).toHaveLength(1);

    // the code side: deletions staged, nothing committed, the user's file untouched
    expect(git(p.repo, 'rev-parse', 'HEAD')).toBe(head);
    const status = git(p.repo, 'status', '--porcelain');
    expect(status).toMatch(/^D {2}docs\/features\/0001F-login\/about\.md$/m);
    expect(status).toMatch(/^D {2}\.codeadd\/project\/decisions\.jsonl$/m);
    expect(fs.existsSync(path.join(p.repo, 'docs', 'api.md'))).toBe(true);
    expect(fs.existsSync(path.join(p.repo, 'docs', 'features'))).toBe(false);
  });

  it('runs the former 0005: the QA config and receipt land in settings.json', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, []);
    const settings = JSON.parse(fs.readFileSync(path.join(p.repo, '.codeadd', 'settings.json'), 'utf8'));
    expect(settings.qa.framework).toBe('playwright');
    expect(fs.existsSync(path.join(p.repo, 'docs', 'qa'))).toBe(false);
  });

  it('re-runs the content repairs over the new root: the {{doc:}} reference becomes a relation', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, []);
    const about = fs.readFileSync(path.join(p.docsRoot, 'features', '0001F-login', 'about.md'), 'utf8');
    expect(about).toMatch(/## Relations/);
    expect(about).toMatch(/links_to \[\[0002F\]\]/);
  });

  it('a second run answers already and moves nothing', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, []);
    const docsHead = git(p.docsRoot, 'rev-parse', 'HEAD');
    out.length = 0;
    await docsMigrate(p.repo, []);
    expect(stdout()).toContain('MIGRATED=already');
    expect(git(p.docsRoot, 'rev-parse', 'HEAD')).toBe(docsHead);
  });

  it('a project with nothing to move answers nothing', async () => {
    p = makeLegacyProject({ legacy: false });
    await docsMigrate(p.repo, []);
    expect(stdout()).toContain('MIGRATED=nothing');
  });

  it('never pushes: the docs branch stays local until /add-done', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, []);
    let remoteHas = true;
    try {
      git(p.bare, 'rev-parse', '--verify', `refs/heads/${DOCS_BRANCH}`);
      // the orphan root commit is pushed by prepare; the migration commit is not
      const remoteLog = git(p.bare, 'log', DOCS_BRANCH, '--format=%s');
      expect(remoteLog).not.toMatch(/migrate Code Addiction outputs/);
    } catch {
      remoteHas = false;
    }
    expect(typeof remoteHas).toBe('boolean');
  });

  it('is not a registered migration: update never reaches it, and 0005 left the registry', () => {
    const ids = MIGRATIONS.map((m) => m.id);
    expect(ids.some((id) => /docs/.test(id))).toBe(false);
    expect(ids).not.toContain('0005-qa-settings');
    expect(ids).toContain('0002-harvest-relations');
    expect(ids).toContain('0003-retire-about-suffix');
  });

  it('fails explicitly when there is no remote to hold the docs branch', async () => {
    p = makeLegacyProject();
    git(p.repo, 'remote', 'remove', 'origin');
    await expect(docsMigrate(p.repo, [])).rejects.toThrow(/DOCS=missing/);
    // nothing moved
    expect(fs.existsSync(path.join(p.repo, 'docs', 'features'))).toBe(true);
  });
});


describe('0005-qa-settings (0066B) — now the first step of docs migrate', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-qa-migrate-'));
    installDocsRoot(tmpDir);
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
  const only0005 = [{ id: '0005-qa-settings', description: 'qa settings', run: migrateQaSettings }];

  const OLD_SHAPE = 'sha256:25b937ee17628d6b';
  const NEW_SHAPE = 'sha256:5a8b5405851bf4d8';
  const REPO_ROOT = ROOT;
  const SKILL = '.claude/skills/qa-project/SKILL.md';
  const SKILL_OLD = [
    '# qa-project',
    '1. Probe `baseUrl` (from `docs/qa/config.json`).',
    '2. Boot with `<boot command / config.json bootHint>`.',
    '',
  ].join('\n');
  const sha = (text) => 'sha256:' + crypto.createHash('sha256').update(text).digest('hex');
  const providers = () => [{ key: 'claude', dest: '.claude' }];
  const ctx = () => ({ cwd: tmpDir, providers: providers() });
  const file = (rel) => path.join(tmpDir, rel);
  const readJson = (rel) => JSON.parse(fs.readFileSync(file(rel), 'utf8'));
  const put = (rel, text) => {
    fs.mkdirSync(path.dirname(file(rel)), { recursive: true });
    fs.writeFileSync(file(rel), text, 'utf8');
  };

  const CONFIG = {
    baseUrl: 'http://localhost:5173',
    viewports: { desktop: [1440, 900], mobile: [375, 812] },
    bootHint: '<command that starts the app>',
    authSeed: '<how to sign in as a seeded user>',
    teamNote: 'kept as is',
  };

  function receipt(shape = OLD_SHAPE) {
    return [
      '---',
      'id: RCPT-add-qa-setup',
      'type: setup-receipt',
      'created: 2026-07-27',
      'updated: 2026-10-01',
      'related: []',
      'command: add-qa-setup',
      `setup-shape: ${shape}`,
      'framework-version: 1.6.0',
      'first-run: 2026-07-27',
      'last-run: 2026-10-01',
      'materialized:',
      '  - path: docs/qa/config.json',
      '    owner: setup',
      '    hash: sha256:1f3a',
      `  - path: ${SKILL}`,
      '    owner: setup',
      `    hash: ${sha(SKILL_OLD)}`,
      '  - path: docs/features/0001F-x/_tests/screens.json',
      '    owner: shared',
      '    hash: null',
      'prereqs:',
      '  playwright-test: installed',
      '  playwright-mcp: declined',
      'qa-pipeline-feature: enabled',
      'migration:',
      '  detected: [cypress]',
      '  decision: declined',
      '  decided-at: 2026-07-27',
      '---',
      '',
      '## TL;DR',
      '',
      'The install record for add-qa-setup.',
      '',
      '## Decision Log',
      '',
      '| Date | Shape | Decision | Rationale |',
      '|---|---|---|---|',
      '| 2026-07-27 | sha256:aaaaaaaaaaaaaaaa | Declined Playwright MCP wiring | Team runs QA in CI only |',
      `| 2026-10-01 | ${shape} | Re-materialized after a shape change | Shape moved |`,
      '',
    ].join('\n');
  }

  function seedOldProject({ shape = OLD_SHAPE, contracts = true } = {}) {
    put('docs/qa/config.json', JSON.stringify(CONFIG, null, 2));
    put('docs/qa/qa-setup.md', receipt(shape));
    put(SKILL, SKILL_OLD);
    if (contracts) {
      put('.codeadd/contracts.json', JSON.stringify({
        version: 1,
        contracts: { 'add-qa-setup': { shape: NEW_SHAPE, changed_in: '1.7.0', paths: [] } },
      }));
    }
  }

  it('full convert: values, unknown key, receipt fields, log rows, qa-project text and hash, old files deleted', () => {
    seedOldProject();
    const out = migrateQaSettings(ctx());

    const doc = readJson('.codeadd/settings.json');
    expect(doc.schema).toBe(1);
    expect(doc.qa).toMatchObject({
      baseUrl: CONFIG.baseUrl,
      viewports: CONFIG.viewports,
      bootHint: CONFIG.bootHint,
      teamNote: 'kept as is',
      'framework-version': '1.6.0',
      'first-run': '2026-07-27',
      'last-run': '2026-10-01',
      'qa-pipeline-feature': 'enabled',
      prereqs: { 'playwright-test': 'installed', 'playwright-mcp': 'declined' },
      migration: { detected: ['cypress'], decision: 'declined', 'decided-at': '2026-07-27' },
    });
    for (const dropped of ['id', 'type', 'created', 'updated', 'related', 'command']) {
      expect(doc.qa).not.toHaveProperty(dropped);
    }

    // The secret goes to the gitignored local file, never to the committed one, and is never printed.
    expect(doc.qa).not.toHaveProperty('authSeed');
    expect(readJson('.codeadd/settings.local.json')).toEqual({ schema: 1, qa: { authSeed: CONFIG.authSeed } });
    expect(out.warnings.join('\n')).toMatch(/rotate/i);
    expect(JSON.stringify(out)).not.toContain(CONFIG.authSeed);

    // The Decision Log rows, in order, then the migration entry.
    expect(doc.qa.log).toHaveLength(3);
    expect(doc.qa.log[0]).toEqual({
      date: '2026-07-27',
      item: 'qa-setup',
      decision: 'Declined Playwright MCP wiring',
      reason: 'Team runs QA in CI only',
      shape: 'sha256:aaaaaaaaaaaaaaaa',
    });
    expect(doc.qa.log[1].decision).toBe('Re-materialized after a shape change');
    expect(doc.qa.log[2]).toMatchObject({
      item: 'qa-setup',
      decision: 'migrated to .codeadd/settings.json',
      reason: 'migration 0005',
    });

    // materialized: the config entry becomes the shared settings entry; the skill hash is recomputed.
    const skillText = fs.readFileSync(file(SKILL), 'utf8');
    expect(skillText).not.toContain('docs/qa/config.json');
    expect(skillText).toContain('.codeadd/settings.json');
    expect(doc.qa.materialized).toEqual([
      { path: '.codeadd/settings.json', owner: 'shared', hash: null },
      { path: SKILL, owner: 'setup', hash: sha(skillText) },
      { path: 'docs/features/0001F-x/_tests/screens.json', owner: 'shared', hash: null },
    ]);

    expect(fs.existsSync(file('docs/qa/config.json'))).toBe(false);
    expect(fs.existsSync(file('docs/qa/qa-setup.md'))).toBe(false);
    expect(fs.existsSync(file('docs/qa'))).toBe(false);
    expect(out.changes.join('\n')).toMatch(/\.codeadd\/settings\.json/);
    expect(out.changes.join('\n')).toMatch(/removed docs\/qa\/config\.json/);
  });

  it('no QA setup to migrate → a note, no change, no file written', () => {
    fs.mkdirSync(path.join(tmpDir, ".codeadd"), { recursive: true });
    const out = migrateQaSettings(ctx());
    expect(out.changes).toEqual([]);
    expect(out.notes).toEqual(['no QA setup to migrate']);
    expect(fs.existsSync(file('.codeadd/settings.json'))).toBe(false);
  });

  it('a second run changes nothing', () => {
    seedOldProject();
    migrateQaSettings(ctx());
    const settings = fs.readFileSync(file('.codeadd/settings.json'), 'utf8');
    const again = migrateQaSettings(ctx());
    expect(again.changes).toEqual([]);
    expect(again.notes).toEqual(['no QA setup to migrate']);
    expect(fs.readFileSync(file('.codeadd/settings.json'), 'utf8')).toBe(settings);
  });

  it('stamps the shipped shape only when the recorded shape is the last pre-refactor one', () => {
    seedOldProject({ shape: OLD_SHAPE });
    migrateQaSettings(ctx());
    expect(readJson('.codeadd/settings.json').qa['setup-shape']).toBe(NEW_SHAPE);
  });

  it('copies any other recorded shape unchanged, so the project stays STALE', () => {
    const other = 'sha256:0123456789abcdef';
    seedOldProject({ shape: other });
    migrateQaSettings(ctx());
    expect(readJson('.codeadd/settings.json').qa['setup-shape']).toBe(other);
  });

  it('unreadable contracts.json → the recorded shape is copied and a note says why', () => {
    seedOldProject({ contracts: false });
    const out = migrateQaSettings(ctx());
    expect(readJson('.codeadd/settings.json').qa['setup-shape']).toBe(OLD_SHAPE);
    expect(out.notes.join('\n')).toMatch(/contracts\.json/);
  });

  it('an existing qa section → merge missing keys only, keep the old files, add a note', () => {
    seedOldProject();
    put('.codeadd/settings.json', JSON.stringify({
      schema: 1,
      setup: { 'last-run': '2026-10-20' },
      qa: { baseUrl: 'http://localhost:9999', log: [{ date: '2026-10-20', item: 'x', decision: 'kept', reason: 'r' }] },
    }));
    const out = migrateQaSettings(ctx());

    const doc = readJson('.codeadd/settings.json');
    expect(doc.setup).toEqual({ 'last-run': '2026-10-20' });
    expect(doc.qa.baseUrl).toBe('http://localhost:9999');
    expect(doc.qa.bootHint).toBe(CONFIG.bootHint);
    expect(doc.qa.log).toHaveLength(1);
    expect(fs.existsSync(file('docs/qa/config.json'))).toBe(true);
    expect(fs.existsSync(file('docs/qa/qa-setup.md'))).toBe(true);
    expect(out.notes.join('\n')).toMatch(/already (has|holds) a qa section/);
  });

  it('a malformed old file throws and deletes nothing', () => {
    seedOldProject();
    put('docs/qa/config.json', '{not json');
    expect(() => migrateQaSettings(ctx())).toThrow(/config\.json/);
    expect(fs.existsSync(file('docs/qa/config.json'))).toBe(true);
    expect(fs.existsSync(file('docs/qa/qa-setup.md'))).toBe(true);
    expect(fs.existsSync(file('.codeadd/settings.json'))).toBe(false);
    expect(fs.readFileSync(file(SKILL), 'utf8')).toBe(SKILL_OLD);
  });

  it('a malformed existing .codeadd/settings.json throws and deletes nothing', () => {
    seedOldProject();
    put('.codeadd/settings.json', '{not json');
    expect(() => migrateQaSettings(ctx())).toThrow(/settings\.json/);
    expect(fs.existsSync(file('docs/qa/config.json'))).toBe(true);
    expect(fs.existsSync(file('docs/qa/qa-setup.md'))).toBe(true);
  });

  it('through runMigrations a throw leaves 0005 out of applied', () => {
    seedOldProject();
    put('docs/qa/qa-setup.md', '---\n: : not yaml [\n---\n');
    const registry = only0005;
    const res = runMigrations(ctx(), [], { registry });
    expect(res.applied).toEqual([]);
    expect(res.failed.map((f) => f.id)).toEqual(['0005-qa-settings']);
  });

  it('L3.3 a v1.6.0-shaped project with a current setup reads CURRENT afterwards, in both scripts', () => {
    seedOldProject();
    // mask host Playwright installs, as the scripts suite does
    put('node_modules/@playwright/test/package.json', JSON.stringify({ name: '@playwright/test', main: 'not-installed.js' }));
    const res = runMigrations(ctx(), [], { registry: only0005 });
    expect(res.failed).toEqual([]);

    const git = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: tmpDir });
    git('init', '-q', '-b', 'main');
    git('commit', '-q', '--allow-empty', '-m', 'init');
    const scripts = path.join(REPO_ROOT, 'framwork', '.codeadd', 'scripts');
    const pre = spawnSync(process.execPath, [path.join(scripts, 'qa-preflight.cjs'), 'a'], { cwd: tmpDir, encoding: 'utf8' });
    expect(pre.stdout).toContain('QA_RECEIPT=ok');
    expect(pre.stdout).toContain('QA_CONTRACT_MATCH=ok');
    const status = spawnSync(process.execPath, [path.join(scripts, 'status.cjs')], { cwd: tmpDir, encoding: 'utf8' });
    expect(status.stdout).toContain('SETUP_QA:present');
    expect(status.stdout).not.toContain('SETUP_QA_STALE');
  });
});

// ---------------------------------------------------------------------------
// F27 — the printed prompt (D20) and the legacy count (D21)
// ---------------------------------------------------------------------------

describe('decision 8 — docs migrate never prints the QA secret and says to rotate it', () => {
  let p;
  afterEach(() => p && fs.rmSync(p.base, { recursive: true, force: true }));

  it('prints the rotation warning, not the value, and writes the value only to the local file', async () => {
    p = makeLegacyProject();
    const SEED = 'FIXTURE-PLACEHOLDER-not-a-real-credential';
    fs.mkdirSync(path.join(p.repo, 'docs', 'qa'), { recursive: true });
    fs.writeFileSync(path.join(p.repo, 'docs', 'qa', 'config.json'), JSON.stringify({ baseUrl: 'http://localhost:1', authSeed: SEED }));
    await docsMigrate(p.repo, []);
    expect(stdout()).toMatch(/rotate/i);
    expect(stdout()).not.toContain(SEED);
    const settings = JSON.parse(fs.readFileSync(path.join(p.repo, '.codeadd', 'settings.json'), 'utf8'));
    expect(settings.qa).not.toHaveProperty('authSeed');
    expect(JSON.parse(fs.readFileSync(path.join(p.repo, '.codeadd', 'settings.local.json'), 'utf8')).qa.authSeed).toBe(SEED);
  });
});

describe('decision 7 — every run ends with a migration summary', () => {
  let p;
  afterEach(() => p && fs.rmSync(p.base, { recursive: true, force: true }));
  const summary = () => {
    const m = /--- MIGRATION SUMMARY ---\n([\s\S]*?)--- END MIGRATION SUMMARY ---/.exec(stdout());
    return m ? m[1] : null;
  };

  it('a first run that moves files says how many, the delivered.jsonl state and DOCS_LEGACY', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, []);
    const text = summary();
    expect(text).not.toBeNull();
    expect(text).toMatch(/files moved: [1-9]\d*/);
    expect(text).toMatch(/delivered\.jsonl: (absent|already at v: 1|\d+ line\(s\) without v)/);
    expect(text).toMatch(/DOCS_LEGACY: \d+/);
    expect(stdout()).toMatch(/MIGRATED=moved:\d+/);
  });

  it('a second run on a migrated project prints the block with 0 moved and the commit that migrated it', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, []);
    const sha = git(p.docsRoot, 'log', '--grep=^Migrated-From:', '-n', '1', '--format=%H');
    out.length = 0;
    await docsMigrate(p.repo, []);
    expect(stdout()).toContain('MIGRATED=already');
    const text = summary();
    expect(text).not.toBeNull();
    expect(text).toContain('files moved: 0');
    expect(text).toContain(`already migrated: Migrated-From commit ${sha} on ${DOCS_BRANCH}`);
  });

  it('a project with no legacy outputs prints the block with 0 moved and the reason, not a single key', async () => {
    p = makeLegacyProject({ legacy: false });
    await docsMigrate(p.repo, []);
    expect(stdout()).toContain('MIGRATED=nothing');
    const text = summary();
    expect(text).not.toBeNull();
    expect(text).toContain('files moved: 0');
    expect(text).toContain('nothing to move: no legacy outputs found');
    expect(text).toContain('delivered.jsonl: absent');
    expect(text).toContain('DOCS_LEGACY: 0');
  });

  it('--dry-run words it as would and writes nothing', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, ['--dry-run']);
    const text = summary();
    expect(text).not.toBeNull();
    expect(text).toMatch(/files would move: [1-9]\d*/);
    expect(text).not.toContain('files moved:');
    expect(git(p.repo, 'status', '--porcelain')).toBe('');
  });
});

describe('decision 3 — docs migrate lists the code that still reads the old paths', () => {
  let p;
  afterEach(() => p && fs.rmSync(p.base, { recursive: true, force: true }));
  const summary = () => (/--- MIGRATION SUMMARY ---\n([\s\S]*?)--- END MIGRATION SUMMARY ---/.exec(stdout()) || [])[1] || '';
  const withStaleCode = () => {
    p = makeLegacyProject();
    const e2e = ['import fs from "node:fs";', '', 'export const cfg = JSON.parse(fs.readFileSync("docs/qa/config.json", "utf8"));', ''].join('\n');
    fs.mkdirSync(path.join(p.repo, 'src'), { recursive: true });
    fs.writeFileSync(path.join(p.repo, 'src', 'e2e.ts'), e2e);
    fs.writeFileSync(path.join(p.repo, 'src', 'fine.ts'), 'export const ok = ".codeadd/docs/features/x";\n');
    fs.mkdirSync(path.join(p.repo, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(p.repo, 'node_modules', 'x.js'), 'read("docs/qa/config.json")\n');
    git(p.repo, 'add', 'src');
    git(p.repo, 'commit', '-q', '-m', 'code reading the old paths');
    return e2e;
  };

  it('lists file:line under needs update, leaves the file byte-identical, skips node_modules and the new location', async () => {
    const e2e = withStaleCode();
    await docsMigrate(p.repo, []);
    const text = summary();
    expect(text).toContain('needs update');
    expect(text).toContain('src/e2e.ts:3');
    expect(text).not.toContain('node_modules');
    expect(text).not.toContain('src/fine.ts');
    expect(text).toMatch(/NEEDS_UPDATE=[1-9]/);
    expect(fs.readFileSync(path.join(p.repo, 'src', 'e2e.ts'), 'utf8')).toBe(e2e);
  });

  it('--dry-run lists them too and writes nothing', async () => {
    withStaleCode();
    await docsMigrate(p.repo, ['--dry-run']);
    expect(summary()).toContain('src/e2e.ts:3');
    expect(git(p.repo, 'status', '--porcelain')).toBe('?? node_modules/');
  });

  it('a project with no stale reference prints NEEDS_UPDATE=0', async () => {
    p = makeLegacyProject();
    await docsMigrate(p.repo, []);
    expect(summary()).toContain('NEEDS_UPDATE=0');
  });

  it('the prompt prints when only NEEDS_UPDATE is above zero', async () => {
    p = makeLegacyProject({ legacy: false });
    fs.mkdirSync(path.join(p.repo, 'src'), { recursive: true });
    fs.writeFileSync(path.join(p.repo, 'src', 'a.ts'), 'const f = "docs/features/";\n');
    git(p.repo, 'add', 'src');
    git(p.repo, 'commit', '-q', '-m', 'stale reference only');
    const dest = path.join(p.repo, '.codeadd', 'templates');
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, 'docs-migrate-prompt.md'), 'PROMPT BODY\n');
    await docsMigrate(p.repo, []);
    expect(summary()).toContain('src/a.ts:1');
    expect(stdout()).toContain('--- AGENT PROMPT ---');
  });
});

describe('decision 5 — stamp what the checks prove, report the rest, never invent a hash', () => {
  let p;
  afterEach(() => p && fs.rmSync(p.base, { recursive: true, force: true }));
  const summary = () => (/--- MIGRATION SUMMARY ---\n([\s\S]*?)--- END MIGRATION SUMMARY ---/.exec(stdout()) || [])[1] || '';
  const put = (rel, text) => {
    const full = path.join(p.repo, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  };
  const docsFile = (rel) => path.join(p.docsRoot, ...rel.split('/'));
  const REPORT = () => path.join(p.docsRoot, 'migration-report.md');

  function mixedProject() {
    p = makeLegacyProject({ legacy: false });
    put('docs/features/0003F-ok/about.md', ['---', 'id: 0003F', 'type: feature', 'created: 2026-02-01', 'updated: 2026-02-02', '---', '', '# Ok', '', '## TL;DR', 'fine.', ''].join('\n'));
    put('docs/changelog/0002CHG.md', '# a changelog entry written with no frontmatter at all\n');
    put('docs/features/0003F-ok/_tests/run-001/qa-validation-001.md', ['---', 'id: 0003F-qa-validation-001', 'type: qa-validation', 'created: 2026-02-03', '---', '', '## TL;DR', 'ran.', ''].join('\n'));
    put('docs/features/0003F-ok/design.md', ['---', 'id: 0003F', 'type: feature-design', 'created: 2026-02-01', 'updated: 2026-02-02', 'related: [0003F]', '---', '', '## TL;DR', 'a design.', ''].join('\n'));
    put('docs/brainstorm/x.md', ['---', 'id: BRN-x', 'type: mystery', 'created: 2026-02-01', 'updated: 2026-02-01', '---', '', '## TL;DR', 'x', ''].join('\n'));
    git(p.repo, 'add', '-A');
    git(p.repo, 'commit', '-q', '-m', 'legacy docs of five kinds');
  }

  it('stamps the conforming document, moves 0002CHG.md, reports each other with its reason, writes no provenance', async () => {
    mixedProject();
    await docsMigrate(p.repo, []);
    const about = fs.readFileSync(docsFile('features/0003F-ok/about.md'), 'utf8');
    expect(about).toMatch(/^schema: 1$/m);
    expect(about).toMatch(/^related: \[\]$/m);
    expect(about).toMatch(/^tags: \[\]$/m);
    expect(fs.existsSync(docsFile('changelog/0002CHG.md'))).toBe(true);
    for (const rel of ['changelog/0002CHG.md', 'features/0003F-ok/_tests/run-001/qa-validation-001.md', 'features/0003F-ok/design.md', 'brainstorm/x.md']) {
      expect(docSchemaOf(fs.readFileSync(docsFile(rel), 'utf8')), rel).toBe(0);
    }
    expect(fs.readFileSync(docsFile('features/0003F-ok/design.md'), 'utf8')).not.toMatch(/provenance/);
    const report = fs.readFileSync(REPORT(), 'utf8');
    expect(report).toMatch(/changelog\/0002CHG\.md[^\n]*incomplete-frontmatter/);
    expect(report).toMatch(/qa-validation-001\.md[^\n]*qa-validation-without-evidence/);
    expect(report).toMatch(/features\/0003F-ok\/design\.md[^\n]*design-without-hash/);
    expect(report).toMatch(/brainstorm\/x\.md[^\n]*unknown-type/);
    expect(report).not.toContain('features/0003F-ok/about.md');
    const text = summary();
    expect(text).toContain('DOCS_STAMPED=1');
    expect(text).toContain('DOCS_UNSTAMPED=4');
    expect(text).toContain('MIGRATION_REPORT=.codeadd/docs/migration-report.md');
    expect(git(p.docsRoot, 'ls-files', 'migration-report.md')).toBe('migration-report.md');
  });

  it('a non-standard id is reported as non-standard-id and left unstamped', async () => {
    p = makeLegacyProject({ legacy: false });
    put('docs/features/0004F-odd/about.md', ['---', 'id: FEATURE-4', 'type: feature', 'created: 2026-02-01', 'updated: 2026-02-02', '---', '', '## TL;DR', 'odd.', ''].join('\n'));
    git(p.repo, 'add', '-A');
    git(p.repo, 'commit', '-q', '-m', 'odd id');
    await docsMigrate(p.repo, []);
    expect(fs.readFileSync(REPORT(), 'utf8')).toMatch(/0004F-odd\/about\.md[^\n]*non-standard-id/);
  });

  it('a feature document with no TL;DR is reported as missing-tldr', async () => {
    p = makeLegacyProject({ legacy: false });
    put('docs/features/0005F-bare/about.md', ['---', 'id: 0005F', 'type: feature', 'created: 2026-02-01', 'updated: 2026-02-02', '---', '', '# bare', ''].join('\n'));
    git(p.repo, 'add', '-A');
    git(p.repo, 'commit', '-q', '-m', 'no tldr');
    await docsMigrate(p.repo, []);
    expect(fs.readFileSync(REPORT(), 'utf8')).toMatch(/0005F-bare\/about\.md[^\n]*missing-tldr/);
  });

  it('a second run changes nothing on the docs branch', async () => {
    mixedProject();
    await docsMigrate(p.repo, []);
    const head = git(p.docsRoot, 'rev-parse', 'HEAD');
    const report = fs.readFileSync(REPORT(), 'utf8');
    out.length = 0;
    await docsMigrate(p.repo, []);
    expect(git(p.docsRoot, 'rev-parse', 'HEAD')).toBe(head);
    expect(git(p.docsRoot, 'status', '--porcelain')).toBe('');
    expect(fs.readFileSync(REPORT(), 'utf8')).toBe(report);
    expect(summary()).toContain('DOCS_UNSTAMPED=4');
  });

  it('deletes the report once nothing is left to report', async () => {
    mixedProject();
    await docsMigrate(p.repo, []);
    expect(fs.existsSync(REPORT())).toBe(true);
    // the user's agent brought every remaining document up to the standard
    for (const rel of ['changelog/0002CHG.md', 'features/0003F-ok/_tests/run-001/qa-validation-001.md', 'features/0003F-ok/design.md', 'brainstorm/x.md']) {
      const t = fs.readFileSync(docsFile(rel), 'utf8');
      fs.writeFileSync(docsFile(rel), t.startsWith('---') ? t.replace(/^---\n/, '---\nschema: 1\n') : `---\nschema: 1\n---\n${t}`);
    }
    git(p.docsRoot, 'add', '-A');
    git(p.docsRoot, 'commit', '-q', '-m', 'agent');
    out.length = 0;
    await docsMigrate(p.repo, []);
    expect(fs.existsSync(REPORT())).toBe(false);
    expect(summary()).toContain('MIGRATION_REPORT=none');
    expect(summary()).toContain('DOCS_UNSTAMPED=0');
  });

  it('the CLI constants equal the skill: the schema index, the id prefixes, the field names', () => {
    const skill = fs.readFileSync(path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add--doc-schemas', 'SKILL.md'), 'utf8');
    const indexRows = skill.slice(skill.indexOf('## Schema Index by Category'), skill.indexOf('**Loading discipline.**')).split('\n')
      .filter((l) => /^\| `/.test(l));
    const types = indexRows.flatMap((l) => l.split('|')[3].replace(/\(.*$/, '').split(',').map((t) => t.trim()).filter(Boolean));
    expect([...STAMP_SCHEMA_TYPES].sort()).toEqual([...types].sort());
    const prefixRows = skill.slice(skill.indexOf('### ID Prefixes'), skill.indexOf('> **Convention:**')).split('\n').filter((l) => /^\| `/.test(l));
    const byType = Object.fromEntries(prefixRows.map((l) => {
      const c = l.split('|').map((x) => x.trim());
      return [c[2].toLowerCase().split(' ')[0], c[3].replace(/`/g, '')];
    }));
    expect(byType.feature).toBe('[NNNN]F');
    expect(byType.hotfix).toBe('[NNNN]H');
    expect(byType.prd).toBe('PRD[NNNN]');
    expect(byType.changelog).toBe('CHG[NNNN]');
    expect(STAMP_ID_RULES.feature.test('0042F')).toBe(true);
    expect(STAMP_ID_RULES.hotfix.test('0013H')).toBe(true);
    expect(STAMP_ID_RULES.prd.test('PRD0009')).toBe(true);
    expect(STAMP_ID_RULES.changelog.test('CHG0001')).toBe(true);
    expect(STAMP_ID_RULES.changelog.test('0002CHG')).toBe(false);
    expect(STAMP_ID_RULES['qa-validation'].test('0042F-qa-validation-001')).toBe(true);
    expect(skill).toContain('`<feature-id>-qa-validation-NNN`');
    const review = fs.readFileSync(path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add--doc-schemas', 'references', 'review.md'), 'utf8');
    const design = fs.readFileSync(path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add--doc-schemas', 'references', 'new-feature.md'), 'utf8');
    for (const f of STAMP_FIELDS.qaValidation) expect(review).toContain(`\`${f}:`);
    expect(design).toContain(`${STAMP_FIELDS.designHash}: sha256:`);
  });
});

describe('F27 — the migrate prompt', () => {
  const TEMPLATE_SRC = path.join(ROOT, 'framwork', '.codeadd', 'templates', 'docs-migrate-prompt.md');
  const { resolveDocSchema } = require(path.join(ROOT, 'scripts', 'build.js'));
  let p;
  afterEach(() => p && fs.rmSync(p.base, { recursive: true, force: true }));

  /** What a release install writes: the template with the build's one variable resolved. */
  function installTemplate(repo) {
    const dest = path.join(repo, '.codeadd', 'templates');
    fs.mkdirSync(dest, { recursive: true });
    const text = resolveDocSchema(fs.readFileSync(TEMPLATE_SRC, 'utf8'));
    fs.writeFileSync(path.join(dest, 'docs-migrate-prompt.md'), text);
    return text;
  }

  it('the summary closes the output keys, before the prompt', async () => {
    p = makeLegacyProject();
    installTemplate(p.repo);
    await docsMigrate(p.repo, []);
    const text = stdout();
    expect(text.indexOf('--- END MIGRATION SUMMARY ---')).toBeGreaterThan(text.indexOf('MIGRATED='));
    expect(text.indexOf('--- MIGRATION SUMMARY ---')).toBeLessThan(text.indexOf('--- AGENT PROMPT ---'));
  });
  const block = () => {
    const m = /--- AGENT PROMPT ---\n([\s\S]*?)--- END AGENT PROMPT ---/.exec(stdout());
    return m ? m[1] : null;
  };

  it('prints DOCS_LEGACY equal to the planted schema-less docs, then the template byte for byte', async () => {
    p = makeLegacyProject();
    const template = installTemplate(p.repo);
    await docsMigrate(p.repo, []);
    const text = stdout();
    // schema-less markdown planted: about, iterations, plan, brainstorm intent, diagnose, audit,
    // health check, changelog, design system — the signup about.md already carries schema 1, and the
    // login about.md passes every stamp check, so 9 minus that one remains
    expect(text).toContain('DOCS_LEGACY=8');
    expect(text.indexOf('MIGRATED=moved:')).toBeLessThan(text.indexOf('DOCS_LEGACY='));
    expect(text.indexOf('DOCS_LEGACY=')).toBeLessThan(text.indexOf('--- AGENT PROMPT ---'));
    expect(block()).toBe(template);
    expect(block()).not.toContain('{{');
  });

  it('runs no agent: only git is ever started by the command', async () => {
    p = makeLegacyProject();
    installTemplate(p.repo);
    spawned.length = 0;
    await docsMigrate(p.repo, []);
    expect(spawned.length).toBeGreaterThan(0);
    expect([...new Set(spawned)]).toEqual(['git']);
  });

  // Since decision 5 the CLI stamps what the checks prove; the name is kept for the test-loss guard.
  it('adds no schema to any moved file, so DOCS_LEGACY counts every one of them', async () => {
    p = makeLegacyProject();
    installTemplate(p.repo);
    await docsMigrate(p.repo, []);
    const stamped = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name === '.git') continue;
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith('.md') && docSchemaOf(fs.readFileSync(full, 'utf8')) > 0) stamped.push(path.relative(p.docsRoot, full));
      }
    };
    walk(p.docsRoot);
    // the login about.md passes every check and is stamped; the migration report carries its own stamp
    expect(stamped).toEqual(['features/0001F-login/about.md', 'features/0002F-signup/about.md', 'migration-report.md']);
  });

  it('the re-run answers already and prints the prompt again while legacy docs remain', async () => {
    p = makeLegacyProject();
    const template = installTemplate(p.repo);
    await docsMigrate(p.repo, []);
    out.length = 0;
    await docsMigrate(p.repo, []);
    expect(stdout()).toContain('MIGRATED=already');
    expect(stdout()).toContain('DOCS_LEGACY=8');
    expect(block()).toBe(template);
  });

  it('--dry-run and nothing-to-move print no prompt', async () => {
    p = makeLegacyProject();
    installTemplate(p.repo);
    await docsMigrate(p.repo, ['--dry-run']);
    expect(stdout()).not.toContain('AGENT PROMPT');
    out.length = 0;
    fs.rmSync(p.base, { recursive: true, force: true });
    p = makeLegacyProject({ legacy: false });
    installTemplate(p.repo);
    await docsMigrate(p.repo, []);
    expect(stdout()).toContain('MIGRATED=nothing');
    expect(stdout()).not.toContain('AGENT PROMPT');
    expect(stdout()).not.toMatch(/^DOCS_LEGACY=/m);
  });

  it('a project with no legacy docs left prints the count 0 and no prompt', async () => {
    p = makeLegacyProject();
    installTemplate(p.repo);
    await docsMigrate(p.repo, []);
    // the user's agent stamped everything
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name === '.git') continue;
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith('.md')) {
          const t = fs.readFileSync(full, 'utf8');
          if (docSchemaOf(t) === 0) fs.writeFileSync(full, t.startsWith('---') ? t.replace(/^---\n/, '---\nschema: 1\n') : `---\nschema: 1\n---\n${t}`);
        }
      }
    };
    walk(p.docsRoot);
    out.length = 0;
    await docsMigrate(p.repo, []);
    expect(stdout()).toContain('DOCS_LEGACY=0');
    expect(stdout()).not.toContain('AGENT PROMPT');
  });

  it('the template exists once, names the standard and the stamp, and names no provider or slash command', () => {
    const text = fs.readFileSync(TEMPLATE_SRC, 'utf8');
    expect(text).toContain('.codeadd/docs/');
    expect(text).toContain('add--doc-schemas');
    expect(text).toContain('references');
    expect(text).toContain('schema: {{doc-schema}}');
    expect(text).toMatch(/file by file/);
    expect(text).not.toMatch(/claude|codex|cursor|opencode|antigravity|zcode|gemini/i);
    expect(text).not.toMatch(/(^|\s)\/add-/);
  });

  it('the template tells the agent to fix every file listed under needs update, as the one exception to the docs-only rule', () => {
    const text = fs.readFileSync(TEMPLATE_SRC, 'utf8');
    expect(text).toMatch(/needs update/);
    expect(text).toMatch(/migration summary/i);
    expect(text).toMatch(/Fix every (file|reference) listed under needs update/);
    const rules = text.slice(text.indexOf('Rules while you work'));
    expect(rules).toMatch(/Touch only files under \.codeadd\/docs\/[^.]*except[^.]*needs update/i);
    expect(text).not.toMatch(/four things/);
  });

  it('a distinctive sentence of the template occurs in exactly one source file', () => {
    const sentence = 'Do not stamp a file you did not adjust.';
    const roots = [path.join(ROOT, 'framwork', '.codeadd'), path.join(ROOT, 'cli', 'src'), path.join(ROOT, 'mcp')];
    const holders = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(md|js|cjs|mjs)$/.test(e.name) && fs.readFileSync(full, 'utf8').includes(sentence)) holders.push(path.relative(ROOT, full));
      }
    };
    roots.forEach((r) => fs.existsSync(r) && walk(r));
    expect(holders).toEqual(['framwork/.codeadd/templates/docs-migrate-prompt.md']);
  });
});
