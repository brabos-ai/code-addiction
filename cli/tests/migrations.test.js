import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

import {
  MIGRATIONS,
  LEGACY_ORPHANS,
  allMigrationIds,
  pendingMigrations,
  runMigrations,
  migrate,
  retireBoard,
  migrateQaSettings,
} from '../src/migrations.js';

let tmpDir;

/** Minimal installed project: .codeadd plus the given provider dests. */
function seedProject(dests = ['.claude', '.opencode']) {
  fs.mkdirSync(path.join(tmpDir, '.codeadd'), { recursive: true });
  return dests.map((dest, i) => ({ key: `p${i}`, dest }));
}

function writeManifestFile(dir, data) {
  const addDir = path.join(dir, '.codeadd');
  fs.mkdirSync(addDir, { recursive: true });
  fs.writeFileSync(path.join(addDir, 'manifest.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function readManifestFile(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8'));
}

/** Plant the legacy orphan under .codeadd and every provider dest. */
function plantOrphan(dests) {
  const planted = [];
  for (const base of ['.codeadd', ...dests]) {
    const full = path.join(tmpDir, base, LEGACY_ORPHANS[0]);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '// orphan');
    planted.push(full);
  }
  return planted;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-migrations-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// L1 — Unit
// ---------------------------------------------------------------------------

describe('pendingMigrations (L1.2)', () => {
  it('returns every registry id when the ledger is absent', () => {
    expect(pendingMigrations(undefined).map((m) => m.id)).toEqual(allMigrationIds());
  });

  it('returns every registry id when the ledger is empty', () => {
    expect(pendingMigrations([]).map((m) => m.id)).toEqual(allMigrationIds());
  });

  it('returns every registry id when the ledger is an unknown shape', () => {
    for (const junk of [null, 'nope', 42, {}]) {
      expect(pendingMigrations(junk).map((m) => m.id)).toEqual(allMigrationIds());
    }
  });

  it('returns nothing when every id is already recorded', () => {
    expect(pendingMigrations(allMigrationIds())).toEqual([]);
  });

  it('ignores unknown ids in the ledger without dropping real pending ones', () => {
    expect(pendingMigrations(['9999-not-a-migration']).map((m) => m.id)).toEqual(allMigrationIds());
  });
});

describe('execution order (L1.3)', () => {
  it('follows id order regardless of registry array order', () => {
    const shuffled = [
      { id: '0003-c', description: 'c', run: () => ({}) },
      { id: '0001-a', description: 'a', run: () => ({}) },
      { id: '0002-b', description: 'b', run: () => ({}) },
    ];
    const ran = [];
    const registry = shuffled.map((m) => ({ ...m, run: () => { ran.push(m.id); return {}; } }));
    runMigrations({ cwd: tmpDir, providers: [] }, [], { registry });
    expect(ran).toEqual(['0001-a', '0002-b', '0003-c']);
  });
});

describe('dry run (L1.4)', () => {
  it('reports the same pending set and writes nothing to disk', () => {
    const providers = seedProject();
    const planted = plantOrphan(providers.map((p) => p.dest));

    const result = runMigrations({ cwd: tmpDir, providers }, [], { dryRun: true });

    expect(result.pending).toEqual(allMigrationIds());
    expect(result.applied).toEqual([]);
    for (const file of planted) expect(fs.existsSync(file)).toBe(true);
  });
});

describe('failure isolation (L1.5)', () => {
  it('reports a throwing migration as failed, does not record it, and keeps going', () => {
    const ran = [];
    const registry = [
      { id: '0001-boom', description: 'throws', run: () => { throw new Error('boom'); } },
      { id: '0002-ok', description: 'fine', run: () => { ran.push('0002-ok'); return {}; } },
    ];

    const result = runMigrations({ cwd: tmpDir, providers: [] }, [], { registry });

    expect(result.failed.map((f) => f.id)).toEqual(['0001-boom']);
    expect(result.applied).toEqual(['0002-ok']);
    expect(result.applied).not.toContain('0001-boom');
    expect(ran).toEqual(['0002-ok']);
  });

  it('never throws out of runMigrations even when every migration throws', () => {
    const registry = [{ id: '0001-boom', description: 'x', run: () => { throw new Error('boom'); } }];
    expect(() => runMigrations({ cwd: tmpDir, providers: [] }, [], { registry })).not.toThrow();
  });
});

describe('0001-prune-legacy-orphans (L1.6, L1.7)', () => {
  it('removes the legacy orphan from .codeadd and from each provider dir', () => {
    const providers = seedProject(['.claude', '.opencode', '.cursor']);
    const planted = plantOrphan(providers.map((p) => p.dest));

    const result = runMigrations({ cwd: tmpDir, providers }, []);

    for (const file of planted) expect(fs.existsSync(file)).toBe(false);
    expect(result.applied).toContain('0001-prune-legacy-orphans');
  });

  it('is a no-op that still records as applied when the file is already absent', () => {
    const providers = seedProject();
    const result = runMigrations({ cwd: tmpDir, providers }, []);
    expect(result.applied).toContain('0001-prune-legacy-orphans');
    expect(result.failed).toEqual([]);
  });

  it('performs work only on the first pass (L1.7)', () => {
    const providers = seedProject();
    plantOrphan(providers.map((p) => p.dest));

    const first = runMigrations({ cwd: tmpDir, providers }, []);
    const second = runMigrations({ cwd: tmpDir, providers }, first.applied);

    expect(first.changes.length).toBeGreaterThan(0);
    expect(second.applied).toEqual([]);
    expect(second.changes).toEqual([]);
  });

  it('targets an explicit path list, never a glob', () => {
    expect(Array.isArray(LEGACY_ORPHANS)).toBe(true);
    for (const p of LEGACY_ORPHANS) {
      expect(p).not.toMatch(/[*?[\]]/);
    }
  });

  it('leaves neighbouring files in the same directory untouched', () => {
    const providers = seedProject();
    plantOrphan(providers.map((p) => p.dest));
    const neighbour = path.join(tmpDir, '.claude', 'skills', 'add-skill-creator', 'SKILL.md');
    fs.writeFileSync(neighbour, '# keep me');

    runMigrations({ cwd: tmpDir, providers }, []);

    expect(fs.existsSync(neighbour)).toBe(true);
  });
});

describe('allMigrationIds (L1.8)', () => {
  it('matches the registry exactly', () => {
    expect(allMigrationIds()).toEqual(MIGRATIONS.map((m) => m.id));
  });

  it('is sorted, so ledger order never depends on array order', () => {
    expect(allMigrationIds()).toEqual([...allMigrationIds()].sort());
  });

  it('has no duplicate ids', () => {
    expect(new Set(allMigrationIds()).size).toBe(allMigrationIds().length);
  });
});

describe('ctx contract (L1.9)', () => {
  it('passes exactly { cwd, providers } to each migration', () => {
    let seen = null;
    const registry = [{ id: '0001-x', description: 'x', run: (ctx) => { seen = ctx; return {}; } }];
    const providers = seedProject();

    runMigrations({ cwd: tmpDir, providers }, [], { registry });

    expect(Object.keys(seen).sort()).toEqual(['cwd', 'providers']);
    expect(seen.cwd).toBe(tmpDir);
    expect(seen.providers).toBe(providers);
  });
});

// ---------------------------------------------------------------------------
// L2.9 / L2.10 — the manual command path
// ---------------------------------------------------------------------------

describe('migrate command (L2.9, L2.10)', () => {
  it('--list reports without mutating the manifest (L2.9)', async () => {
    const providers = seedProject();
    plantOrphan(providers.map((p) => p.dest));
    writeManifestFile(tmpDir, { version: '0.7.2', providers: [], files: [] });
    const before = fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8');

    await migrate(tmpDir, ['--list']);

    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')).toBe(before);
  });

  it('--dry-run leaves the orphan and the ledger alone', async () => {
    const providers = seedProject();
    const planted = plantOrphan(providers.map((p) => p.dest));
    writeManifestFile(tmpDir, { version: '0.7.2', providers: [], files: [] });

    await migrate(tmpDir, ['--dry-run']);

    for (const f of planted) expect(fs.existsSync(f)).toBe(true);
    expect(readManifestFile(tmpDir).migrations ?? []).toEqual([]);
  });

  it('runs pending migrations on a project already at the latest version (L2.10)', async () => {
    const providers = seedProject(['.claude']);
    const planted = plantOrphan(['.claude']);
    // Version matches the newest release: `update` would early-return here.
    writeManifestFile(tmpDir, { version: '0.7.2', providers: ['claude'], files: [] });

    await migrate(tmpDir, []);

    for (const f of planted) expect(fs.existsSync(f)).toBe(false);
    expect(readManifestFile(tmpDir).migrations).toContain('0001-prune-legacy-orphans');
    void providers;
  });

  it('records the ledger without dropping other manifest fields', async () => {
    seedProject(['.claude']);
    writeManifestFile(tmpDir, {
      version: '0.7.2',
      providers: ['claude'],
      files: ['a'],
      features: { 'tdd-pipeline': true },
      plugins: { gitnexus: true },
    });

    await migrate(tmpDir, []);

    const m = readManifestFile(tmpDir);
    expect(m.features).toEqual({ 'tdd-pipeline': true });
    expect(m.plugins).toEqual({ gitnexus: true });
    expect(m.files).toEqual(['a']);
  });

  it('refuses to run when no installation exists', async () => {
    await expect(migrate(tmpDir, [])).rejects.toThrow(/no add installation/i);
  });
});

// ---------------------------------------------------------------------------
// L3 — Behavioural acceptance
// ---------------------------------------------------------------------------

describe('behavioural acceptance (L3)', () => {
  it('L3.1 — cleans an orphan that is on disk but absent from manifest.files', async () => {
    seedProject(['.claude', '.opencode']);
    const planted = plantOrphan(['.claude', '.opencode']);
    // The install-path blind spot: on disk, invisible to any manifest diff.
    writeManifestFile(tmpDir, {
      version: '0.7.2',
      providers: ['claude', 'opencode'],
      files: ['.codeadd/scripts/status.sh'],
    });

    await migrate(tmpDir, []);

    for (const f of planted) expect(fs.existsSync(f)).toBe(false);
    expect(readManifestFile(tmpDir).migrations).toContain('0001-prune-legacy-orphans');
  });

  it('L3.2 — re-running reports nothing pending and touches no file', async () => {
    seedProject(['.claude']);
    writeManifestFile(tmpDir, { version: '0.7.2', providers: ['claude'], files: [] });
    await migrate(tmpDir, []);

    const keeper = path.join(tmpDir, '.claude', 'keep.md');
    fs.mkdirSync(path.dirname(keeper), { recursive: true });
    fs.writeFileSync(keeper, 'x');
    const snapshot = readManifestFile(tmpDir);

    await migrate(tmpDir, []);

    expect(fs.existsSync(keeper)).toBe(true);
    expect(readManifestFile(tmpDir).migrations).toEqual(snapshot.migrations);
  });
});

// ---------------------------------------------------------------------------
// 0006-retire-board (0075B) — the board feature is gone; the user's board data is not touched
// ---------------------------------------------------------------------------

describe('0006-retire-board (0075B)', () => {
  const BOARD_JSON = JSON.stringify({ remote: 'x', branch: 'board' });

  /** An install that had the board feature on, with its data around it. */
  function seedBoardInstall({ boardJson = true, features = { board: true, 'tdd-pipeline': true } } = {}) {
    writeManifestFile(tmpDir, { version: '1.0.0', providers: [], files: [], features });
    if (boardJson) fs.writeFileSync(path.join(tmpDir, '.codeadd', 'board.json'), BOARD_JSON, 'utf8');
  }

  it('the registry reads exactly 0001, 0002, 0003, 0005, 0006 — 0004 is gone', () => {
    expect(MIGRATIONS.map((m) => m.id)).toEqual([
      '0001-prune-legacy-orphans',
      '0002-harvest-relations',
      '0003-retire-about-suffix',
      '0005-qa-settings',
      '0006-retire-board',
    ]);
    expect(allMigrationIds()).toEqual([...allMigrationIds()].sort());
    expect(MIGRATIONS.find((m) => m.id === '0006-retire-board').description).toMatch(/board/i);
  });

  it('a ledger that already holds 0004 gives no error and no pending entry for it', () => {
    const ledger = ['0004-sync-board-definitions', ...allMigrationIds()];
    expect(pendingMigrations(ledger).map((m) => m.id)).toEqual([]);
    const run = runMigrations({ cwd: tmpDir, providers: [] }, ledger);
    expect(run.failed).toEqual([]);
    expect(run.applied).toEqual([]);
    const partial = pendingMigrations(['0004-sync-board-definitions']);
    expect(partial.map((m) => m.id)).not.toContain('0004-sync-board-definitions');
    expect(partial.map((m) => m.id)).toContain('0006-retire-board');
  });

  it('with the flag on and board.json present: the flag goes, one note, board.json byte-identical', () => {
    seedBoardInstall();
    const out = retireBoard({ cwd: tmpDir });
    expect(readManifestFile(tmpDir).features).toEqual({ 'tdd-pipeline': true });
    expect(out.changes).toHaveLength(1);
    expect(out.notes).toHaveLength(1);
    expect(out.notes[0]).toMatch(/board was removed from the framework/);
    expect(out.notes[0]).toMatch(/untouched/);
    expect(out.notes[0]).toMatch(/board.{0,10}branch/);
    expect(out.notes[0]).toMatch(/\.codeadd\/board\.json/);
    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'board.json'), 'utf8')).toBe(BOARD_JSON);
  });

  it('never touches the board branch or the board clone', () => {
    seedBoardInstall();
    const git = (...args) => spawnSync('git', args, { cwd: tmpDir, encoding: 'utf8' });
    git('init', '-q', '-b', 'main');
    git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
    git('branch', 'board');
    const clone = path.join(tmpDir, 'board-clone');
    fs.mkdirSync(path.join(clone, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(clone, 'docs', 'backlog.jsonl'), '{"id":"0001B"}\n');
    const prior = process.env.CODEADD_BOARD_DIR;
    process.env.CODEADD_BOARD_DIR = clone;
    try {
      retireBoard({ cwd: tmpDir });
    } finally {
      if (prior === undefined) delete process.env.CODEADD_BOARD_DIR;
      else process.env.CODEADD_BOARD_DIR = prior;
    }
    expect(git('branch', '--list', 'board').stdout).toContain('board');
    expect(fs.readFileSync(path.join(clone, 'docs', 'backlog.jsonl'), 'utf8')).toBe('{"id":"0001B"}\n');
  });

  it('with no board.json the flag goes and notes is empty', () => {
    seedBoardInstall({ boardJson: false });
    const out = retireBoard({ cwd: tmpDir });
    expect(readManifestFile(tmpDir).features).toEqual({ 'tdd-pipeline': true });
    expect(out.notes).toEqual([]);
    expect(fs.existsSync(path.join(tmpDir, '.codeadd', 'board.json'))).toBe(false);
  });

  it('a second run changes nothing', () => {
    seedBoardInstall();
    retireBoard({ cwd: tmpDir });
    const manifestAfterFirst = fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8');
    const again = retireBoard({ cwd: tmpDir });
    expect(again.changes).toEqual([]);
    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')).toBe(manifestAfterFirst);
    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'board.json'), 'utf8')).toBe(BOARD_JSON);
  });

  it('a project with no manifest, or no board flag, is applied with no change', () => {
    expect(retireBoard({ cwd: tmpDir })).toEqual({ changes: [], notes: [] });
    seedBoardInstall({ boardJson: false, features: { 'tdd-pipeline': true } });
    expect(retireBoard({ cwd: tmpDir }).changes).toEqual([]);
  });

  it('through runMigrations 0006 is recorded as applied', () => {
    seedBoardInstall();
    const done = runMigrations({ cwd: tmpDir, providers: [] }, allMigrationIds().filter((id) => id !== '0006-retire-board'));
    expect(done.failed).toEqual([]);
    expect(done.applied).toEqual(['0006-retire-board']);
    expect(done.notes).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 0005-qa-settings (0066B)
// ---------------------------------------------------------------------------

describe('0005-qa-settings (0066B)', () => {
  const OLD_SHAPE = 'sha256:25b937ee17628d6b';
  const NEW_SHAPE = 'sha256:5a8b5405851bf4d8';
  const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
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

  it('L2.8 is registered after 0003 and allMigrationIds includes it, sorted', () => {
    const ids = allMigrationIds();
    expect(ids).toContain('0005-qa-settings');
    expect(ids).toEqual([...ids].sort());
    expect(ids.indexOf('0005-qa-settings')).toBeGreaterThan(ids.indexOf('0003-retire-about-suffix'));
    expect(MIGRATIONS.find((m) => m.id === '0005-qa-settings').description).toMatch(/settings/i);
  });

  it('full convert: values, unknown key, receipt fields, log rows, qa-project text and hash, old files deleted', () => {
    seedOldProject();
    const out = migrateQaSettings(ctx());

    const doc = readJson('.codeadd/settings.json');
    expect(doc.schema).toBe(1);
    expect(doc.qa).toMatchObject({
      baseUrl: CONFIG.baseUrl,
      viewports: CONFIG.viewports,
      bootHint: CONFIG.bootHint,
      authSeed: CONFIG.authSeed,
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
    seedProject();
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
    const registry = MIGRATIONS.filter((m) => m.id === '0005-qa-settings');
    const res = runMigrations(ctx(), [], { registry });
    expect(res.applied).toEqual([]);
    expect(res.failed.map((f) => f.id)).toEqual(['0005-qa-settings']);
  });

  it('L3.3 a v1.6.0-shaped project with a current setup reads CURRENT afterwards, in both scripts', () => {
    seedOldProject();
    // mask host Playwright installs, as the scripts suite does
    put('node_modules/@playwright/test/package.json', JSON.stringify({ name: '@playwright/test', main: 'not-installed.js' }));
    const res = runMigrations(ctx(), [], { registry: MIGRATIONS.filter((m) => m.id === '0005-qa-settings') });
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
