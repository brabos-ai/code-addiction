import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { builtinModules } from 'node:module';
import AdmZip from 'adm-zip';
import { loadCorpus, actions } from '../../mcp/engine.mjs';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  getLatestPrerelease: vi.fn(),
  downloadReleaseAsset: vi.fn(),
  promptProviders: vi.fn(),
  promptScope: vi.fn(),
  promptConfirm: vi.fn(),
  promptFeatures: vi.fn(),
  promptGitignore: vi.fn(),
  promptExistingInstall: vi.fn(),
  promptModify: vi.fn(),
  promptApplyDiff: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  getLatestPrerelease: mocks.getLatestPrerelease,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
}));

vi.mock('../src/prompt.js', () => ({
  promptProviders: mocks.promptProviders,
  promptScope: mocks.promptScope,
  promptConfirm: mocks.promptConfirm,
  promptFeatures: mocks.promptFeatures,
  promptGitignore: mocks.promptGitignore,
  promptExistingInstall: mocks.promptExistingInstall,
  promptModify: mocks.promptModify,
  promptApplyDiff: mocks.promptApplyDiff,
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { log } from '@clack/prompts';
import { install } from '../src/installer.js';

/**
 * Build a release asset zip (framwork/ prefix, no commands in .codeadd/).
 */
function buildInstallZip() {
  const zip = new AdmZip();
  zip.addFile(`framwork/.codeadd/scripts/health.sh`, Buffer.from('echo ok\r\n'));
  zip.addFile(`framwork/.codeadd/injection-points.json`, Buffer.from('{"version":1,"points":[]}\n'));
  zip.addFile(`framwork/.agents/skills/add/SKILL.md`, Buffer.from('---\nname: add\n---\n'));
  zip.addFile(`framwork/.agents/skills/backend-development/SKILL.md`, Buffer.from('---\nname: backend-development\n---\n'));
  return zip.toBuffer();
}

/**
 * Release zip carrying OpenCode content, whose global dest (.config/opencode)
 * differs from its project dest (.opencode) — proves scope-correct path mapping.
 */
function buildOpencodeZip() {
  const zip = new AdmZip();
  zip.addFile(`framwork/.codeadd/scripts/health.sh`, Buffer.from('echo ok\n'));
  zip.addFile(`framwork/.codeadd/injection-points.json`, Buffer.from('{"version":1,"points":[]}\n'));
  zip.addFile(`framwork/.opencode/skills/add/SKILL.md`, Buffer.from('---\nname: add\n---\n'));
  zip.addFile(`framwork/.opencode/commands/add.md`, Buffer.from('# add\n'));
  return zip.toBuffer();
}

let tmpDir;
const realIsTTY = process.stdin.isTTY;

beforeEach(() => {
  // install refuses to run without a TTY; these tests answer its prompts through mocks.
  process.stdin.isTTY = true;
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-e2e-'));
  mocks.getLatestTag.mockReset();
  mocks.downloadReleaseAsset.mockReset();
  mocks.promptProviders.mockReset();
  mocks.promptConfirm.mockReset();
  mocks.promptProviders.mockResolvedValue(['codex']);
  mocks.promptScope.mockReset();
  mocks.promptScope.mockResolvedValue('project');
  mocks.promptConfirm.mockResolvedValue(undefined);
  mocks.promptGitignore.mockResolvedValue(true);
  // Over an existing installation `install` now opens a menu. The tests below that
  // install twice are about what a REINSTALL does, so they answer it that way; with
  // no manifest the menu is never reached.
  mocks.promptExistingInstall.mockReset();
  mocks.promptExistingInstall.mockResolvedValue('reinstall');
});

afterEach(() => {
  process.stdin.isTTY = realIsTTY;
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('install command e2e', () => {
  it('installs from latest release and writes release manifest', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(mocks.downloadReleaseAsset).toHaveBeenCalledWith('v1.2.3');
    expect(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'add', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'backend-development', 'SKILL.md'))).toBe(true);

    const sh = fs.readFileSync(path.join(tmpDir, '.codeadd', 'scripts', 'health.sh'), 'utf8');
    expect(sh).toBe('echo ok\n');

    // The build-emitted injection sidecar must land in the installed project so
    // post-install feature/plugin injection can resolve anchors.
    expect(fs.existsSync(path.join(tmpDir, '.codeadd', 'injection-points.json'))).toBe(true);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('1.2.3');
    expect(manifest.releaseTag).toBe('v1.2.3');
    expect(manifest.source).toBe('release');
    expect(manifest.ref).toBeNull();
    expect(manifest.providers).toEqual(['codex']);
  });

  it('throws when repository has no releases', async () => {
    mocks.getLatestTag.mockRejectedValue(
      new Error('Repository brabos-ai/code-addiction not found or has no releases.')
    );

    await expect(install(tmpDir)).rejects.toThrow('not found or has no releases');
  });

  it('initializes manifest.features from registry defaults without prompting', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    // No install-time feature prompt — opt-in lives in `codeadd features`.
    expect(mocks.promptFeatures).not.toHaveBeenCalled();

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    // tdd defaults true; qa-pipeline and docs-pruning default false (opt-in,
    // registered in features.js). docs-pruning is off by default deliberately —
    // it deletes the user's documentation, which is their call
    // (plan 2026-09-07T160328-PLAN--delivery-index, F12).
    expect(manifest.features).toEqual({
      'tdd-pipeline': true,
      'qa-pipeline': false,
      'docs-pruning': false,
      // board is opt-in: no project uses the board yet (2026-09-23T193550-PLAN--board-pipeline-phase-statuses).
      board: false,
    });
    // Removing the feature prompt must not disturb the plugin path:
    // plugins stay disabled (empty) by default on a fresh install.
    expect(manifest.plugins).toEqual({});
  });

  it('installs from explicit tag via --version flag', async () => {
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir, { version: 'v2.0.0' });

    expect(mocks.getLatestTag).not.toHaveBeenCalled();
    expect(mocks.downloadReleaseAsset).toHaveBeenCalledWith('v2.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.releaseTag).toBe('v2.0.0');
    expect(manifest.source).toBe('tag');
  });

  // The six canonical backlog modules are what let an installed project's
  // agents reach the shared core, run the local needs natively, and publish
  // (plan 2026-10-04T004044-PLAN--native-node-backlog, F4). They are packaged
  // as ordinary scripts siblings, so this proves the entry point actually
  // carries them — a helper-only test would pass even if the release never
  // shipped them.
  describe('backlog canonical modules (L4.2)', () => {
    const CANONICAL = [
      'backlog-storage.cjs', 'backlog-core.cjs', 'backlog-cli.cjs',
      'backlog-id.cjs', 'backlog-git.cjs', 'backlog-commit.cjs',
    ];
    const WRAPPERS = ['backlog.sh', 'backlog-commit.sh'];
    const SCRIPTS_DIR = path.resolve(__dirname, '../../framwork/.codeadd/scripts');

    function realBytes(name) {
      return fs.readFileSync(path.join(SCRIPTS_DIR, name));
    }

    /** Package the real backlog family from disk, so a retirement assertion
     *  fails if a removed entry is accidentally shipped again. */
    function buildBacklogZip() {
      const zip = new AdmZip();
      zip.addFile('framwork/.codeadd/injection-points.json', Buffer.from('{"version":1,"points":[]}\n'));
      zip.addFile('framwork/.codeadd/scripts/health.sh', Buffer.from('echo ok\n'));
      for (const name of fs.readdirSync(SCRIPTS_DIR).filter((n) => /^backlog(?:-.*)?\.(?:cjs|sh)$/.test(n))) {
        zip.addFile(`framwork/.codeadd/scripts/${name}`, realBytes(name));
      }
      return zip.toBuffer();
    }

    it.each([true, false])('reinstall retires only manifest-owned wrappers (tracked=%s)', async (tracked) => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());
      await install(tmpDir);

      // Old installation fixture, independent of retired source files.
      const manifestPath = path.join(tmpDir, '.codeadd', 'manifest.json');
      const old = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      for (const name of WRAPPERS) {
        fs.writeFileSync(path.join(tmpDir, '.codeadd', 'scripts', name), '# user or old installed entry\n');
        if (tracked) old.files.push(`.codeadd/scripts/${name}`);
      }
      fs.writeFileSync(manifestPath, JSON.stringify(old));
      mocks.getLatestTag.mockResolvedValue('v2.0.0');
      await install(tmpDir);

      const current = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      for (const name of WRAPPERS) {
        const file = path.join(tmpDir, '.codeadd', 'scripts', name);
        expect(fs.existsSync(file), name).toBe(!tracked);
        expect(current.files).not.toContain(`.codeadd/scripts/${name}`);
        if (!tracked) expect(fs.readFileSync(file, 'utf8')).toBe('# user or old installed entry\n');
      }
      for (const name of CANONICAL) {
        expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'scripts', name))).toEqual(realBytes(name));
      }
      const result = execFileSync(process.execPath, ['.codeadd/scripts/backlog-cli.cjs', 'list', '--all'],
        { cwd: tmpDir, encoding: 'utf8' });
      expect(result).toContain('BACKLOG_PRESENT=no');
    });

    it('ships only the six Node modules, preserving their bytes and retiring shell entries', async () => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());

      await install(tmpDir);

      for (const name of CANONICAL) {
        const installed = path.join(tmpDir, '.codeadd', 'scripts', name);
        expect(fs.existsSync(installed), `${name} was not installed`).toBe(true);
        // Byte-for-byte for the CJS modules: fixLineEndings normalizes CRLF for
        // .sh only, and these are read by Node directly. A rewrite is a bug.
        expect(fs.readFileSync(installed)).toEqual(realBytes(name));
      }
      const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
      for (const name of WRAPPERS) {
        expect(fs.existsSync(path.join(tmpDir, '.codeadd', 'scripts', name)), name).toBe(false);
        expect(manifest.files).not.toContain(`.codeadd/scripts/${name}`);
      }
      const zip = new AdmZip(buildBacklogZip());
      expect(zip.getEntries().map((e) => e.entryName).filter((n) => /\/backlog[^/]*\.(cjs|sh)$/.test(n)).sort())
        .toEqual(CANONICAL.map((n) => `framwork/.codeadd/scripts/${n}`).sort());
    });

    it('an installed project runs the native LOCAL entry with no source checkout', async () => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());
      await install(tmpDir);

      const { spawnSync } = await import('node:child_process');
      const result = spawnSync(process.execPath, ['.codeadd/scripts/backlog-cli.cjs', 'list', '--all'], {
        cwd: tmpDir, encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('BACKLOG_PRESENT=no');
      expect(result.stdout).toContain('TICKETS_TOTAL=0');
      // The summary protocol ships with the entry: READ_VIEW on every read,
      // get as the exact detail read, --full restoring raw rows.
      expect(result.stdout).toContain('READ_VIEW=summary');
      expect(result.stdout).toContain('STATUS_COUNTS={}');
    });

    it('an installed project reads summary, full and get through the shipped protocol', async () => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());
      await install(tmpDir);

      fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'docs', 'backlog.jsonl'),
        JSON.stringify({
          id: '0001B', title: 'installed read', theme: '', labels: [], tldr: 'installed body',
          notes: ['body note'], done_when: 'works', paths: [], grounded: false, status: 'open',
          created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z',
          comments: [], feature: null, work_id: null,
        }) + '\n');

      const { spawnSync } = await import('node:child_process');
      const run = (args) => spawnSync(process.execPath, ['.codeadd/scripts/backlog-cli.cjs', ...args], {
        cwd: tmpDir, encoding: 'utf8',
      });

      const summary = run(['list', '--all']);
      expect(summary.status).toBe(0);
      expect(summary.stdout).toContain('READ_VIEW=summary');
      expect(summary.stdout).toContain('"id":"0001B"');
      expect(summary.stdout).not.toContain('"notes"');

      const got = run(['get', '0001B']);
      expect(got.status).toBe(0);
      expect(got.stdout).toContain('"notes":["body note"]');

      const full = run(['list', '--all', '--full']);
      expect(full.stdout).toContain('"notes":["body note"]');
    });

    it('an installed project runs the native PUBLICATION entry — reads refused by name', async () => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());
      await install(tmpDir);

      const { spawnSync } = await import('node:child_process');
      const result = spawnSync(process.execPath, ['.codeadd/scripts/backlog-commit.cjs', 'list'], {
        cwd: tmpDir, encoding: 'utf8',
      });
      expect(result.status).toBe(2);
      expect(result.stdout).toContain('ERROR=read-mode');
    });

    it('an installed project runs the native PUBLICATION entry — a local write lands', async () => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());
      await install(tmpDir);

      // The installed project runs git + the installed publication entry,
      // with no source checkout anywhere on the import path. No remote: the
      // write lands locally and the report says it did.
      execFileSync('git', ['init', '-b', 'main', '.'], { cwd: tmpDir });
      execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpDir });
      execFileSync('git', ['config', 'user.name', 'test'], { cwd: tmpDir });
      execFileSync('git', ['commit', '--allow-empty', '-m', 'seed'], { cwd: tmpDir });

      const record = path.join(tmpDir, 'installed-publish.json');
      fs.writeFileSync(record, JSON.stringify({ title: 'installed write', tldr: 't', done_when: 't' }));

      const { spawnSync } = await import('node:child_process');
      const result = spawnSync(process.execPath, [
        '.codeadd/scripts/backlog-commit.cjs', 'add', '--record-file', path.join('installed-publish.json'),
      ], { cwd: tmpDir, encoding: 'utf8' });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('ROUTE=direct');
      expect(result.stdout).toContain('COMMITTED=yes');
      expect(result.stdout).toContain('DEGRADED=no-remote');
      expect(result.stdout).toContain('TICKET_ID=0001B');
      const board = fs.readFileSync(path.join(tmpDir, 'docs', 'backlog.jsonl'), 'utf8');
      expect(board).toContain('"title":"installed write"');
    });

    it('a solved-native write in the installed project lands through its own files', async () => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());
      await install(tmpDir);

      const record = path.join(tmpDir, 'fixture-ticket.json');
      fs.writeFileSync(record, JSON.stringify({ title: 'installed native write', tldr: 't', done_when: 't' }));

      const { spawnSync } = await import('node:child_process');
      const result = spawnSync(process.execPath, [
        '.codeadd/scripts/backlog-cli.cjs', 'add',
        '--record-file', path.join('fixture-ticket.json'),
      ], {
        cwd: tmpDir, encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('TICKET_ID=0001B');
      const board = fs.readFileSync(path.join(tmpDir, 'docs', 'backlog.jsonl'), 'utf8');
      expect(board).toContain('"title":"installed native write"');
    });

    it('refreshes every module together on update, never one at a time', async () => {
      mocks.getLatestTag.mockResolvedValue('v1.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(buildBacklogZip());
      await install(tmpDir);

      // A newer release changes the module bodies. An
      // update that refreshed only part of the runtime would leave the rest
      // on the old contract — the exact half-refreshed runtime the plan's
      // risks table calls out.
      const marker = (name) => `// refreshed ${name} v2\n`;
      const zip2 = new AdmZip();
      zip2.addFile('framwork/.codeadd/injection-points.json', Buffer.from('{"version":1,"points":[]}\n'));
      zip2.addFile('framwork/.codeadd/scripts/health.sh', Buffer.from('echo ok\n'));
      for (const name of CANONICAL) {
        zip2.addFile(`framwork/.codeadd/scripts/${name}`, Buffer.from(marker(name)));
      }
      mocks.getLatestTag.mockResolvedValue('v2.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(zip2.toBuffer());
      await (await import('../src/updater.js')).update(tmpDir);

      for (const name of CANONICAL) {
        const installed = path.join(tmpDir, '.codeadd', 'scripts', name);
        expect(fs.readFileSync(installed, 'utf8'), `${name} was not refreshed`).toBe(marker(name));
      }
    });
  });

  it('writes gitignore: true to manifest and creates .gitignore block when user opts in', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());
    mocks.promptProviders.mockResolvedValue(['claude']);
    mocks.promptGitignore.mockResolvedValue(true);

    await install(tmpDir);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.gitignore).toBe(true);

    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('# ADD - managed by code-addiction');
    expect(gitignore).toContain('.codeadd/');
    expect(gitignore).toContain('.claude/');
    expect(gitignore).toContain('# END ADD');
  });

  it('writes gitignore: false to manifest and does not create .gitignore when user opts out', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());
    mocks.promptGitignore.mockResolvedValue(false);

    await install(tmpDir);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.gitignore).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.gitignore'))).toBe(false);
  });

  it('project install still records scope:project (backward-compatible)', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.scope).toBe('project');
  });
});

/**
 * Release zip carrying content for both codex (framwork/.agents) and zcode's
 * own agents dir (framwork/.zcode) — proves the shared-tree reuse at install
 * time, not just at build time.
 */
function buildZcodeZip() {
  const zip = new AdmZip();
  zip.addFile(`framwork/.codeadd/scripts/health.sh`, Buffer.from('echo ok\n'));
  zip.addFile(`framwork/.codeadd/injection-points.json`, Buffer.from('{"version":1,"points":[]}\n'));
  zip.addFile(`framwork/.agents/skills/add-plan/SKILL.md`, Buffer.from('---\nname: add-plan\n---\n'));
  zip.addFile(`framwork/.agents/skills/backend-development/SKILL.md`, Buffer.from('---\nname: backend-development\n---\n'));
  zip.addFile(`framwork/.zcode/agents/reviewer-agent.md`, Buffer.from('---\nname: reviewer-agent\n---\n'));
  return zip.toBuffer();
}

describe('install command e2e — zcode reuses the codex tree (L3.1, L3.2)', () => {
  it('installing zcode alone writes .agents (shared) and .zcode (its own agents)', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZcodeZip());
    mocks.promptProviders.mockResolvedValue(['zcode']);

    await install(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'add-plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.zcode', 'agents', 'reviewer-agent.md'))).toBe(true);
    // No independent .zcode/skills or .zcode/commands tree — those are absent
    // on purpose, the reused .agents tree is where ZCode reads them from.
    expect(fs.existsSync(path.join(tmpDir, '.zcode', 'skills'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.zcode', 'commands'))).toBe(false);
  });

  it('installing codex and zcode together writes exactly one .agents tree, never twice', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZcodeZip());
    mocks.promptProviders.mockResolvedValue(['codex', 'zcode']);

    await install(tmpDir);

    const skillFile = path.join(tmpDir, '.agents', 'skills', 'add-plan', 'SKILL.md');
    expect(fs.readFileSync(skillFile, 'utf8')).toBe('---\nname: add-plan\n---\n');
    expect(fs.existsSync(path.join(tmpDir, '.zcode', 'agents', 'reviewer-agent.md'))).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.providers.sort()).toEqual(['codex', 'zcode']);
  });
});

describe('install command e2e — global scope', () => {
  let homeDir;

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-home-'));
    vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
  });

  afterEach(() => {
    os.homedir.mockRestore();
    fs.rmSync(homeDir, { recursive: true, force: true });
  });

  it('global install lands under home, records scope:global, skips gitignore', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildOpencodeZip());
    mocks.promptProviders.mockResolvedValue(['opencode']);

    await install(tmpDir, { global: true });

    // OpenCode global dest is .config/opencode (NOT .opencode)
    expect(fs.existsSync(path.join(homeDir, '.config', 'opencode', 'skills', 'add', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.config', 'opencode', 'commands', 'add.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.opencode'))).toBe(false);

    // Core files land at ~/.codeadd, not the project cwd
    expect(fs.existsSync(path.join(homeDir, '.codeadd', 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.codeadd', 'manifest.json'))).toBe(false);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(homeDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.scope).toBe('global');
    expect(manifest.gitignore).toBe(false);

    // No gitignore noise in the home dir; scope prompt never shown (flag forces it)
    expect(fs.existsSync(path.join(homeDir, '.gitignore'))).toBe(false);
    expect(mocks.promptScope).not.toHaveBeenCalled();
    expect(mocks.promptGitignore).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Install-path orphan prune (F1) and migration ledger (F4)
// ---------------------------------------------------------------------------

import { allMigrationIds } from '../src/migrations.js';

function seedManifest(dir, data) {
  const addDir = path.join(dir, '.codeadd');
  fs.mkdirSync(addDir, { recursive: true });
  fs.writeFileSync(path.join(addDir, 'manifest.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function seedFile(dir, rel, body = 'x') {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body);
  return full;
}

function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8'));
}

describe('install-path orphan prune (L2.1, L2.3, L2.4)', () => {
  it('L2.1 — unlinks a file the prior manifest listed and the new install did not write', async () => {
    const orphan = seedFile(tmpDir, '.agents/skills/obsolete/SKILL.md');
    seedManifest(tmpDir, {
      version: '0.7.0',
      providers: ['codex'],
      files: ['.agents/skills/obsolete/SKILL.md'],
    });

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(fs.existsSync(orphan)).toBe(false);
    expect(readManifest(tmpDir).files).not.toContain('.agents/skills/obsolete/SKILL.md');
  });

  it('L2.1b — never unlinks a file the new install DID write', async () => {
    seedManifest(tmpDir, {
      version: '0.7.0',
      providers: ['codex'],
      files: ['.codeadd/scripts/health.sh'],
    });

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.codeadd', 'scripts', 'health.sh'))).toBe(true);
  });

  it('L2.1c — honours the shared preservation rules', async () => {
    const hist = seedFile(tmpDir, '.codeadd/history/session.json', '{}');
    const local = seedFile(tmpDir, '.codeadd/my.local.json', '{}');
    seedManifest(tmpDir, {
      version: '0.7.0',
      providers: ['codex'],
      files: ['.codeadd/history/session.json', '.codeadd/my.local.json'],
    });

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(fs.existsSync(hist)).toBe(true);
    expect(fs.existsSync(local)).toBe(true);
  });

  it('L2.3 — a first-time install with no prior manifest deletes nothing', async () => {
    const bystander = seedFile(tmpDir, 'src/app.ts', 'export const a = 1;');

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(fs.existsSync(bystander)).toBe(true);
  });

  it('L2.4 — an unparseable prior manifest prunes nothing rather than throwing', async () => {
    const bystander = seedFile(tmpDir, '.agents/skills/obsolete/SKILL.md');
    fs.mkdirSync(path.join(tmpDir, '.codeadd'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), '{ not json', 'utf8');

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await expect(install(tmpDir)).resolves.not.toThrow();
    expect(fs.existsSync(bystander)).toBe(true);
  });
});

describe('install-path migration ledger (L2.7, L2.8)', () => {
  it('L2.7 — a fresh install records every known id and executes no migration', async () => {
    // The legacy orphan is present but must NOT be touched: a pristine project
    // has nothing to migrate, so the back-catalogue is stamped, not executed.
    const planted = seedFile(tmpDir, '.agents/skills/add--skill-creator/render-graphs.js', '// x');

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(readManifest(tmpDir).migrations).toEqual(allMigrationIds());
    expect(fs.existsSync(planted)).toBe(true);
  });

  it('L2.8 — a re-install over an existing manifest preserves its ledger', async () => {
    seedManifest(tmpDir, {
      version: '0.7.0',
      providers: ['codex'],
      files: [],
      migrations: [],
    });

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    // Empty, not baseline-stamped: this project still needs those migrations.
    expect(readManifest(tmpDir).migrations).toEqual([]);
  });

  it('L2.8b — a re-install carries a partially applied ledger forward verbatim', async () => {
    seedManifest(tmpDir, {
      version: '0.7.0',
      providers: ['codex'],
      files: [],
      migrations: ['0001-prune-legacy-orphans'],
    });

    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(readManifest(tmpDir).migrations).toEqual(['0001-prune-legacy-orphans']);
  });
});

// ---------------------------------------------------------------------------
// F23 — the installed native runtime closure (L6)
//
// The shipped runtime is native `.cjs` all the way down: the 19 entries, their
// shared cores and the six backlog modules. F20 removed the shells and F21 the
// root release/tag routes; these cases prove the RELEASE LAYOUT at the install
// boundary, which unit tests over `installer.js` cannot:
//
//   1. a fresh install carries every native entry and core, byte-exact, and no
//      shell entry at the runtime root — the ZIP is derived from the real
//      shipped dir's top-level `.cjs`, so a reintroduced `.sh` there would
//      appear in `installed` and fail. (The `scripts/tests/` transport subtree
//      is a development asset and belongs to F31, not to this closure.)
//   2. a manifest-owned update/reinstall retires the old managed shells while
//      leaving a manual, untracked file alone;
//   3. a relocated install runs the delivery, status and QA entries where no
//      source checkout and no development `node_modules` are on the resolution
//      path;
//   4. the packaged MCP reader resolves `.codeadd/scripts/delivered.cjs` and
//      loads `delivery-index-core.cjs` from beside it;
//   5. every shipped entry requires only Node built-ins and its relative
//      siblings, so executing it needs no development dependency.
// ---------------------------------------------------------------------------

const SHIPPED_SCRIPTS_DIR = path.resolve(__dirname, '../../framwork/.codeadd/scripts');
const NATIVE_ENTRIES = fs
  .readdirSync(SHIPPED_SCRIPTS_DIR)
  .filter((n) => n.endsWith('.cjs'))
  .sort();

/** Package the REAL shipped scripts (top-level `.cjs` only) as a release ZIP. */
function buildNativeZip() {
  const zip = new AdmZip();
  zip.addFile('framwork/.codeadd/injection-points.json', Buffer.from('{"version":1,"points":[]}\n'));
  for (const name of NATIVE_ENTRIES) {
    zip.addFile(`framwork/.codeadd/scripts/${name}`, fs.readFileSync(path.join(SHIPPED_SCRIPTS_DIR, name)));
  }
  return zip.toBuffer();
}

const installedScriptsDir = (dir) => path.join(dir, '.codeadd', 'scripts');

describe('F23 — the installed native runtime closure (L6)', () => {
  beforeEach(() => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildNativeZip());
  });

  it('a fresh install writes every native entry and core, byte-exact, and no shell entry', async () => {
    await install(tmpDir);

    const scripts = installedScriptsDir(tmpDir);
    const installed = fs.readdirSync(scripts).sort();
    // Exact equality: an extra file — a reintroduced shell entry above all —
    // fails here without needing a second, weaker negative assertion.
    expect(installed).toEqual(NATIVE_ENTRIES);
    expect(installed.filter((n) => n.endsWith('.sh'))).toEqual([]);

    // Both halves of the MCP reader are entries in the closure, never extras.
    expect(installed).toContain('delivered.cjs');
    expect(installed).toContain('delivery-index-core.cjs');

    for (const name of NATIVE_ENTRIES) {
      expect(fs.readFileSync(path.join(scripts, name))).toEqual(
        fs.readFileSync(path.join(SHIPPED_SCRIPTS_DIR, name)),
      );
    }

    // The source the release is built from carries no top-level shell entry;
    // a reintroduced one would land in the ZIP above and fail `installed`.
    expect(fs.readdirSync(SHIPPED_SCRIPTS_DIR).filter((n) => n.endsWith('.sh'))).toEqual([]);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'),
    );
    for (const name of NATIVE_ENTRIES) {
      expect(manifest.files).toContain(`.codeadd/scripts/${name}`);
    }
  });

  it.each([true, false])(
    'a manifest-owned update retires old managed shell entries and keeps untracked files (tracked=%s)',
    async (tracked) => {
      await install(tmpDir);

      // The pre-migration installation: the shell runtime sat where the native
      // entries sit now. Some shells were manifest-owned; one was the user's.
      const scripts = installedScriptsDir(tmpDir);
      const managed = ['status.sh', 'delivered.sh', 'qa-evidence.sh'];
      const manual = path.join(scripts, 'my-local-helper.sh');
      fs.writeFileSync(manual, '# mine, never in a manifest\n');
      for (const name of managed) fs.writeFileSync(path.join(scripts, name), '# old shell entry\n');

      const manifestPath = path.join(tmpDir, '.codeadd', 'manifest.json');
      if (tracked) {
        const old = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        for (const name of managed) old.files.push(`.codeadd/scripts/${name}`);
        fs.writeFileSync(manifestPath, JSON.stringify(old));
      }

      mocks.getLatestTag.mockResolvedValue('v2.0.0');
      await install(tmpDir); // reinstall over the same project

      for (const name of managed) {
        // Manifest-owned → pruned; untracked → preserved, byte for byte.
        expect(fs.existsSync(path.join(scripts, name)), name).toBe(!tracked);
      }
      expect(fs.readFileSync(manual, 'utf8')).toBe('# mine, never in a manifest\n');

      const current = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      for (const name of NATIVE_ENTRIES) {
        expect(current.files).toContain(`.codeadd/scripts/${name}`);
        expect(fs.existsSync(path.join(scripts, name)), name).toBe(true);
      }
    },
  );

  it('a relocated install runs the delivery, status and QA entries with no source checkout and no dev node_modules', async () => {
    await install(tmpDir);

    // Move the installed tree somewhere with no repository source above it —
    // the closure a user's project actually has, at a path the framework never
    // sees. `git init` gives the entries the repository they document.
    const relocated = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-relocated-'));
    fs.cpSync(path.join(tmpDir, '.codeadd'), path.join(relocated, '.codeadd'), { recursive: true });
    try {
      execFileSync('git', ['init', '-q', '-b', 'main', '.'], { cwd: relocated });
      execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: relocated });
      execFileSync('git', ['config', 'user.name', 'test'], { cwd: relocated });
      execFileSync('git', ['commit', '--allow-empty', '-m', 'seed'], { cwd: relocated });

      // NODE_PATH is emptied and no `node_modules` exists anywhere under the
      // relocated root. Anything the entries reach must be built-in or relative.
      const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' };
      const run = (entry, args = []) =>
        spawnSync(process.execPath, [path.join('.codeadd', 'scripts', entry), ...args], {
          cwd: relocated,
          encoding: 'utf8',
          env,
        });

      const delivered = run('delivered.cjs', ['verify']);
      expect(delivered.status).toBe(0);
      expect(delivered.stdout).toContain('REPAIRED=0');

      const status = run('status.cjs');
      expect(status.status).toBe(0);
      expect(status.stdout).toContain('BRANCH:main');

      const qa = run('qa-preflight.cjs', ['a']);
      expect(qa.status).toBe(0);
      expect(qa.stdout).toContain('QA_FEATURE_STATE=');

      expect(fs.existsSync(path.join(relocated, 'node_modules'))).toBe(false);
    } finally {
      fs.rmSync(relocated, { recursive: true, force: true });
    }
  });

  it('the packaged MCP reader resolves the installed delivered.cjs and loads its core', async () => {
    await install(tmpDir);

    // A delivery index in the installed project, then a git repository so the
    // reader's `git rev-parse` root probe succeeds. `src/auth.ts` carries the
    // marker the index entry verifies against.
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'auth.ts'), 'const marker = 1;\n');
    fs.writeFileSync(
      path.join(tmpDir, 'docs', 'delivered.jsonl'),
      JSON.stringify({
        v: 1, ts: '2026-01-01T00:00:00Z', id: 'E1', layer: 'product', by: 'done',
        status: 'live', name: 'the auth file', words: 'auth', commits: [],
        origin: 'docs/plans/E1.md',
        items: [{ what: 'auth', at: 'src/auth.ts', find: 'marker' }],
      }) + '\n',
    );
    execFileSync('git', ['init', '-q', '-b', 'main', '.'], { cwd: tmpDir });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpDir });
    execFileSync('git', ['config', 'user.name', 'test'], { cwd: tmpDir });
    execFileSync('git', ['commit', '--allow-empty', '-m', 'seed'], { cwd: tmpDir });

    // The docs corpus lists `.codeadd/scripts/delivered.cjs` as its installed
    // reader; the engine loads `delivery-index-core.cjs` from beside it.
    const data = loadCorpus('docs', tmpDir);
    const result = actions.touched_by(data, { files: ['src/auth.ts'] }, { root: tmpDir });
    expect(result.unavailable).toBeUndefined();
    expect(result.workItems.map((w) => w.id)).toEqual(['E1']);
    expect(result.workItems[0].answer).toBe('curated');

    // Contrast: without the install, the same query degrades by name rather
    // than pretending the reader ran — the resolution is what the install fed.
    const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-noruntime-'));
    try {
      fs.mkdirSync(path.join(bare, 'docs'), { recursive: true });
      const missing = actions.touched_by(
        loadCorpus('docs', bare),
        { files: ['src/auth.ts'] },
        { root: bare },
      );
      expect(missing.unavailable.reason).toBe('script-missing');
    } finally {
      fs.rmSync(bare, { recursive: true, force: true });
    }
  });

  it('every shipped entry requires only Node built-ins and its relative siblings', async () => {
    await install(tmpDir);

    const builtins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);
    const scripts = installedScriptsDir(tmpDir);
    for (const name of NATIVE_ENTRIES) {
      const source = fs.readFileSync(path.join(scripts, name), 'utf8');
      const specs = [...source.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]);
      for (const spec of specs) {
        expect(builtins.has(spec) || spec.startsWith('.'), `${name} requires "${spec}"`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// `install` over an existing installation opens a menu instead of resetting (L2.6)
// ---------------------------------------------------------------------------
describe('install over an existing installation (L2.6)', () => {
  const manifestPath = () => path.join(tmpDir, '.codeadd', 'manifest.json');
  const readManifest = () => JSON.parse(fs.readFileSync(manifestPath(), 'utf8'));

  /** Every file under the project, mapped to its bytes. */
  function snapshot() {
    const out = {};
    const walk = (d) => {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) walk(full);
        else out[path.relative(tmpDir, full)] = fs.readFileSync(full, 'utf8');
      }
    };
    walk(tmpDir);
    return out;
  }

  /** A first install, with a non-default feature turned on so a reset is visible. */
  async function installOnce() {
    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());
    await install(tmpDir);
    const manifest = readManifest();
    manifest.features['qa-pipeline'] = true;
    manifest.plugins = { demo: { enabled: true } };
    fs.writeFileSync(manifestPath(), JSON.stringify(manifest, null, 2));
    vi.clearAllMocks();
    mocks.promptExistingInstall.mockReset();
    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());
    mocks.promptConfirm.mockResolvedValue(undefined);
  }

  it('never opens the menu when there is no manifest', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());

    await install(tmpDir);

    expect(mocks.promptExistingInstall).not.toHaveBeenCalled();
  });

  it('shows the menu with the installed state, before resolving any release', async () => {
    await installOnce();
    mocks.promptExistingInstall.mockResolvedValue('cancel');

    await install(tmpDir);

    expect(mocks.promptExistingInstall).toHaveBeenCalledTimes(1);
    const state = mocks.promptExistingInstall.mock.calls[0][0];
    expect(state).toMatchObject({ version: '1.2.3', scope: 'project', providers: ['codex'] });
    expect(state.features).toContain('qa-pipeline');
    expect(state.plugins).toEqual(['demo']);
    expect(mocks.getLatestTag).not.toHaveBeenCalled();
  });

  it('cancel leaves every file and the manifest byte-equal and downloads nothing', async () => {
    await installOnce();
    const before = snapshot();
    mocks.promptExistingInstall.mockResolvedValue('cancel');

    await install(tmpDir);

    expect(snapshot()).toEqual(before);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
    expect(mocks.promptProviders).not.toHaveBeenCalled();
  });

  it('modify keeps features and plugins and asks none of the reinstall questions', async () => {
    await installOnce();
    mocks.promptExistingInstall.mockResolvedValue('modify');
    mocks.promptModify.mockResolvedValue({ providers: ['codex'], features: { 'qa-pipeline': true }, plugins: {} });
    mocks.promptApplyDiff.mockResolvedValue(true);

    await install(tmpDir);

    expect(mocks.promptModify).toHaveBeenCalledTimes(1);
    expect(mocks.promptProviders).not.toHaveBeenCalled();
    expect(mocks.promptScope).toHaveBeenCalledTimes(1); // scope is still resolved first
    const manifest = readManifest();
    expect(manifest.features['qa-pipeline']).toBe(true);
    expect(manifest.plugins).toEqual({ demo: { enabled: true } });
  });

  it('modify ignores --version and --channel and says so', async () => {
    await installOnce();
    mocks.promptExistingInstall.mockResolvedValue('modify');
    mocks.promptModify.mockResolvedValue({ providers: ['codex'], features: {}, plugins: {} });
    mocks.promptApplyDiff.mockResolvedValue(false);

    await install(tmpDir, { version: 'v9.9.9', channel: 'beta' });

    expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/--version.*--channel.*ignored|ignored.*--version/));
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });

  it('update runs the update flow with the flags and keeps features and plugins', async () => {
    await installOnce();
    mocks.promptExistingInstall.mockResolvedValue('update');

    await install(tmpDir, { version: 'v2.0.0' });

    expect(mocks.downloadReleaseAsset).toHaveBeenCalledWith('v2.0.0');
    const manifest = readManifest();
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.features['qa-pipeline']).toBe(true);
    expect(manifest.plugins).toEqual({ demo: { enabled: true } });
    expect(mocks.promptProviders).not.toHaveBeenCalled();
  });

  it('reinstall, after the overwrite confirmation, reproduces today\'s reset', async () => {
    await installOnce();
    mocks.promptExistingInstall.mockResolvedValue('reinstall');
    mocks.promptProviders.mockResolvedValue(['codex']);

    await install(tmpDir);

    expect(mocks.promptConfirm).toHaveBeenCalledWith(expect.stringMatching(/already exists/));
    expect(mocks.promptProviders).toHaveBeenCalledTimes(1);
    const manifest = readManifest();
    expect(manifest.features['qa-pipeline']).toBe(false);
    expect(manifest.plugins).toEqual({});
  });

  it('reinstall declined at the overwrite confirmation writes nothing', async () => {
    await installOnce();
    const before = snapshot();
    mocks.promptExistingInstall.mockResolvedValue('reinstall');
    mocks.promptConfirm.mockRejectedValue(new Error('USER_CANCEL'));

    await expect(install(tmpDir)).rejects.toThrow('USER_CANCEL');

    expect(snapshot()).toEqual(before);
  });
});
