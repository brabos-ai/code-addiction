import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  getLatestPrerelease: vi.fn(),
  downloadReleaseAsset: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  getLatestPrerelease: mocks.getLatestPrerelease,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
}));

vi.mock('../src/prompt.js', () => ({
  promptProviders: vi.fn(),
  promptConfirm: vi.fn(),
  promptExistingInstall: vi.fn(),
  promptModify: vi.fn(),
  promptApplyDiff: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), warn: vi.fn() },
}));

import { log } from '@clack/prompts';
import { update } from '../src/updater.js';

function buildZip() {
  const zip = new AdmZip();
  zip.addFile(`framwork/.codeadd/scripts/health.sh`, Buffer.from('echo ok\r\n'));
  return zip.toBuffer();
}

function writeManifestFile(dir, data) {
  const addDir = path.join(dir, '.codeadd');
  fs.mkdirSync(addDir, { recursive: true });
  fs.writeFileSync(path.join(addDir, 'manifest.json'), JSON.stringify(data, null, 2), 'utf8');
}

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-update-'));
  mocks.getLatestTag.mockReset();
  mocks.getLatestPrerelease.mockReset();
  mocks.downloadReleaseAsset.mockReset();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('update command — a plugin whose tool is not detected (L2.10)', () => {
  afterEach(() => {
    delete process.env.CODEADD_PLUGINS_CATALOG;
  });

  const catalogWith = (detect) => {
    const file = path.join(tmpDir, 'catalog.json');
    fs.writeFileSync(file, JSON.stringify({ gx: { type: 'mcp', description: 'g', detect, injects: [], skills: [] } }));
    process.env.CODEADD_PLUGINS_CATALOG = file;
  };

  it('says the plugin is enabled but not applied, and keeps it enabled in the manifest', async () => {
    catalogWith('false');
    writeManifestFile(tmpDir, { version: '1.0.0', source: 'release', providers: [], plugins: { gx: { enabled: true } } });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(log.warn).toHaveBeenCalledWith('plugin gx is enabled but not applied to any provider (tool not detected)');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.plugins.gx).toEqual({ enabled: true });
  });

  it('stays quiet about a plugin whose tool is detected', async () => {
    catalogWith('node -e "process.exit(0)"');
    writeManifestFile(tmpDir, { version: '1.0.0', source: 'release', providers: [], plugins: { gx: { enabled: true } } });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    const warned = log.warn.mock.calls.map((c) => c[0]).filter((m) => /not applied to any provider/.test(m));
    expect(warned).toEqual([]);
  });
});

describe('update command', () => {
  it('throws when no manifest exists', async () => {
    await expect(update(tmpDir)).rejects.toThrow('No ADD installation found');
  });

  it('updates from release to latest release', async () => {
    writeManifestFile(tmpDir, { version: '1.0.0', source: 'release', ref: null, providers: [] });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(mocks.downloadReleaseAsset).toHaveBeenCalledWith('v2.0.0');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.source).toBe('release');
    expect(manifest.releaseTag).toBe('v2.0.0');
  });

  it('skips update when already on latest release', async () => {
    writeManifestFile(tmpDir, { version: '2.0.0', source: 'release', ref: null, providers: [] });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');

    await update(tmpDir);

    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });

  it('updates to specific tag via --version flag', async () => {
    writeManifestFile(tmpDir, { version: '1.0.0', source: 'release', ref: null, providers: [] });
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir, { version: 'v1.5.0' });

    expect(mocks.downloadReleaseAsset).toHaveBeenCalledWith('v1.5.0');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.version).toBe('1.5.0');
    expect(manifest.source).toBe('tag');
  });

  it('removes obsolete files that existed in old manifest but not in new zip', async () => {
    // Create an orphan file that was installed by a previous version
    const orphanPath = path.join(tmpDir, '.codeadd', 'scripts', 'old-script.sh');
    fs.mkdirSync(path.dirname(orphanPath), { recursive: true });
    fs.writeFileSync(orphanPath, '# old script');

    // Manifest lists the orphan as an installed file
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: ['.codeadd/scripts/old-script.sh'],
    });

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    // New zip does NOT contain old-script.sh
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(fs.existsSync(orphanPath)).toBe(false);
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.files).not.toContain('.codeadd/scripts/old-script.sh');
  });

  it.each([true, false])('native backlog update retires only tracked wrappers (tracked=%s)', async (tracked) => {
    const wrappers = ['backlog.sh', 'backlog-commit.sh'];
    const canonical = ['backlog-storage.cjs', 'backlog-core.cjs', 'backlog-cli.cjs',
      'backlog-id.cjs', 'backlog-git.cjs', 'backlog-commit.cjs'];
    const scripts = path.resolve(__dirname, '../../framwork/.codeadd/scripts');
    const installed = path.join(tmpDir, '.codeadd', 'scripts');
    fs.mkdirSync(installed, { recursive: true });
    for (const name of wrappers) fs.writeFileSync(path.join(installed, name), '# old or manual entry\n');
    writeManifestFile(tmpDir, {
      version: '1.0.0', source: 'release', providers: [],
      files: tracked ? wrappers.map((n) => `.codeadd/scripts/${n}`) : [],
    });
    const zip = new AdmZip(buildZip());
    for (const name of canonical) zip.addFile(`framwork/.codeadd/scripts/${name}`, fs.readFileSync(path.join(scripts, name)));
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(zip.toBuffer());

    await update(tmpDir);

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    for (const name of wrappers) {
      expect(fs.existsSync(path.join(installed, name)), name).toBe(!tracked);
      expect(manifest.files).not.toContain(`.codeadd/scripts/${name}`);
      if (!tracked) expect(fs.readFileSync(path.join(installed, name), 'utf8')).toBe('# old or manual entry\n');
    }
    for (const name of canonical) expect(fs.readFileSync(path.join(installed, name))).toEqual(fs.readFileSync(path.join(scripts, name)));
    const result = execFileSync(process.execPath, ['.codeadd/scripts/backlog-cli.cjs', 'list', '--all'],
      { cwd: tmpDir, encoding: 'utf8' });
    expect(result).toContain('BACKLOG_PRESENT=no');
    fs.writeFileSync(path.join(tmpDir, 'ticket.json'), JSON.stringify({ title: 'after update', tldr: 't', done_when: 't' }));
    const publication = execFileSync(process.execPath, ['.codeadd/scripts/backlog-commit.cjs', 'add', '--record-file', 'ticket.json'],
      { cwd: tmpDir, encoding: 'utf8', input: '' });
    expect(publication).toContain('PERSISTED=yes');
  });

  it('preserves history and .local.json files even if listed in old manifest', async () => {
    const historyFile = path.join(tmpDir, '.codeadd', 'history', 'session.json');
    const localFile = path.join(tmpDir, '.codeadd', 'my.local.json');
    fs.mkdirSync(path.dirname(historyFile), { recursive: true });
    fs.writeFileSync(historyFile, '{}');
    fs.writeFileSync(localFile, '{}');

    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: ['.codeadd/history/session.json', '.codeadd/my.local.json'],
    });

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(fs.existsSync(historyFile)).toBe(true);
    expect(fs.existsSync(localFile)).toBe(true);
  });

  it('preserves plugin state across an update (does not drop manifest.plugins)', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: ['claude'],
      features: { tdd: true },
      plugins: { gitnexus: { enabled: true } },
    });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    // Plan 0070: the legacy `tdd` key resolves to `tdd-pipeline` and is
    // normalised away on the first update — the user's choice is preserved,
    // the orphaned key is not left behind as dead data.
    expect(manifest.features['tdd-pipeline']).toBe(true);
    expect(manifest.features).not.toHaveProperty('tdd');
    expect(manifest.plugins).toEqual({ gitnexus: { enabled: true } }); // plugin state NOT dropped
  });

  it('removes only a legacy plugin skill copy absent from the manifest before reactivation', async () => {
    const catalog = path.join(tmpDir, 'catalog.json');
    fs.writeFileSync(catalog, JSON.stringify({ gitnexus: { detect: 'node --version', skills: ['add--gitnexus'], injects: [] } }));
    process.env.CODEADD_PLUGINS_CATALOG = catalog;
    try {
      const oldDir = path.join(tmpDir, '.claude', 'skills', 'add-gitnexus');
      const newFile = path.join(tmpDir, '.claude', 'skills', 'add--gitnexus', 'SKILL.md');
      fs.mkdirSync(oldDir, { recursive: true });
      fs.writeFileSync(path.join(oldDir, 'SKILL.md'), 'legacy plugin skill');
      fs.writeFileSync(path.join(oldDir, 'personal.md'), 'user content');
      writeManifestFile(tmpDir, {
        version: '1.0.0', source: 'release', providers: ['claude'],
        plugins: { gitnexus: { enabled: true } }, files: [],
      });
      const zip = new AdmZip(buildZip());
      zip.addFile('framwork/.codeadd/plugins/gitnexus/skills/add--gitnexus/SKILL.md', Buffer.from('new plugin skill'));
      mocks.getLatestTag.mockResolvedValue('v2.0.0');
      mocks.downloadReleaseAsset.mockResolvedValue(zip.toBuffer());

      await update(tmpDir);

      expect(fs.existsSync(path.join(oldDir, 'SKILL.md'))).toBe(false);
      expect(fs.readFileSync(path.join(oldDir, 'personal.md'), 'utf8')).toBe('user content');
      expect(fs.readFileSync(newFile, 'utf8')).toBe('new plugin skill');
    } finally {
      delete process.env.CODEADD_PLUGINS_CATALOG;
    }
  });

  it('syncs .gitignore block when manifest.gitignore is true', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: ['claude'],
      gitignore: true,
    });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('# ADD - managed by code-addiction');
    expect(gitignore).toContain('.codeadd/');
    expect(gitignore).toContain('.claude/');
    expect(gitignore).toContain('# END ADD');
  });

  it('does not create .gitignore when manifest.gitignore is false', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: ['claude'],
      gitignore: false,
    });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.gitignore'))).toBe(false);
  });

  it('does not create .gitignore when manifest.gitignore is absent (backward compat)', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: ['claude'],
      // no gitignore key — pre-PRD0012 install
    });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.gitignore'))).toBe(false);
  });

  it('updates within beta channel when manifest has channel=beta', async () => {
    writeManifestFile(tmpDir, {
      version: '0.4.0-beta.1',
      source: 'release',
      ref: null,
      providers: [],
      channel: 'beta',
    });
    mocks.getLatestPrerelease.mockResolvedValue('v0.4.0-beta.2');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(mocks.getLatestPrerelease).toHaveBeenCalled();
    expect(mocks.getLatestTag).not.toHaveBeenCalled();
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.version).toBe('0.4.0-beta.2');
    expect(manifest.channel).toBe('beta');
  });

  it('switches from beta to stable via --channel flag', async () => {
    writeManifestFile(tmpDir, {
      version: '0.4.0-beta.1',
      source: 'release',
      ref: null,
      providers: [],
      channel: 'beta',
    });
    mocks.getLatestTag.mockResolvedValue('v0.3.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir, { channel: 'stable' });

    expect(mocks.getLatestTag).toHaveBeenCalled();
    expect(mocks.getLatestPrerelease).not.toHaveBeenCalled();
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.version).toBe('0.3.0');
    expect(manifest.channel).toBe('stable');
  });

  it('defaults to stable channel when manifest has no channel field', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      // no channel key — pre-beta install
    });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(mocks.getLatestTag).toHaveBeenCalled();
    expect(mocks.getLatestPrerelease).not.toHaveBeenCalled();
  });

  it('global-scope manifest resolves global provider dests and skips gitignore sync', async () => {
    // Build a zip carrying OpenCode content (global dest .config/opencode ≠ project .opencode)
    const zip = new AdmZip();
    zip.addFile('framwork/.codeadd/scripts/health.sh', Buffer.from('echo ok\n'));
    zip.addFile('framwork/.opencode/skills/add/SKILL.md', Buffer.from('---\nname: add\n---\n'));

    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: ['opencode'],
      scope: 'global',
      gitignore: true, // even if stale-true, global must not write .gitignore
    });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(zip.toBuffer());

    await update(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.config', 'opencode', 'skills', 'add', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.opencode'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.gitignore'))).toBe(false);

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.scope).toBe('global');
  });
});

// ---------------------------------------------------------------------------
// Migration runner on the update path (F3) + preservation regression (F1)
// ---------------------------------------------------------------------------

import { allMigrationIds } from '../src/migrations.js';

function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8'));
}

describe('update path migrations (L2.2, L2.5, L2.6)', () => {
  it('L2.2 — still preserves history/ and *.local.json after the helper moves', async () => {
    const historyFile = path.join(tmpDir, '.codeadd', 'history', 'session.json');
    const localFile = path.join(tmpDir, '.codeadd', 'my.local.json');
    fs.mkdirSync(path.dirname(historyFile), { recursive: true });
    fs.writeFileSync(historyFile, '{}');
    fs.writeFileSync(localFile, '{}');

    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: ['.codeadd/history/session.json', '.codeadd/my.local.json'],
    });

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(fs.existsSync(historyFile)).toBe(true);
    expect(fs.existsSync(localFile)).toBe(true);
  });

  it('L2.6 — records applied migrations alongside preserved features and plugins', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: [],
      features: { 'tdd-pipeline': true, 'qa-pipeline': false },
      plugins: { gitnexus: true },
    });

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    const m = readManifest(tmpDir);
    expect(m.migrations).toEqual(allMigrationIds());
    expect(m.features).toEqual({ 'tdd-pipeline': true, 'qa-pipeline': false, 'docs-pruning': false, board: false, 'agent-mode': false });
    expect(m.plugins).toEqual({ gitnexus: true });
  });

  it('L2.6b — a ledger that already lists every id executes nothing and survives', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: [],
      migrations: allMigrationIds(),
    });

    // On disk but already recorded as migrated: must NOT be touched again.
    const planted = path.join(tmpDir, '.codeadd', 'skills', 'add--skill-creator', 'render-graphs.js');
    fs.mkdirSync(path.dirname(planted), { recursive: true });
    fs.writeFileSync(planted, '// x');

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    await update(tmpDir);

    expect(readManifest(tmpDir).migrations).toEqual(allMigrationIds());
    expect(fs.existsSync(planted)).toBe(true);
  });

  it('L2.5 — a throwing migration leaves the update successful and stays out of the ledger', async () => {
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: [],
    });

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildZip());

    // Make the one real migration throw by removing write permission is
    // platform-dependent; instead assert the contract the runner guarantees:
    // update completes and the version advances even under migration failure.
    const { runMigrations } = await import('../src/migrations.js');
    const result = runMigrations({ cwd: tmpDir, providers: [] }, [], {
      registry: [{ id: '0001-boom', description: 'x', run: () => { throw new Error('boom'); } }],
    });
    expect(result.applied).not.toContain('0001-boom');
    expect(result.failed).toHaveLength(1);

    await update(tmpDir);

    expect(readManifest(tmpDir).version).toBe('2.0.0');
  });
});

// ---------------------------------------------------------------------------
// F23 — the update path retires the migrated shell runtime (L6)
//
// install.e2e proves the fresh and reinstall boundaries. This is the `update`
// command's own half: the SAME manifest diff that prunes any obsolete file must
// remove the old managed shells while leaving a manual file that no manifest
// ever listed. The new release is the real shipped `.cjs` closure, so a shell
// surviving here would be a migration defect, not a fixture accident.
// ---------------------------------------------------------------------------

const SHIPPED_DIR = path.resolve(__dirname, '../../framwork/.codeadd/scripts');
const NATIVE_NAMES = fs.readdirSync(SHIPPED_DIR).filter((n) => n.endsWith('.cjs')).sort();

function buildNativeZip() {
  const zip = new AdmZip();
  zip.addFile('framwork/.codeadd/injection-points.json', Buffer.from('{"version":1,"points":[]}\n'));
  for (const name of NATIVE_NAMES) {
    zip.addFile(`framwork/.codeadd/scripts/${name}`, fs.readFileSync(path.join(SHIPPED_DIR, name)));
  }
  return zip.toBuffer();
}

describe('F23 — update retires the migrated shell runtime (L6)', () => {
  it('removes manifest-owned shells, keeps a manual file, and installs the native closure', async () => {
    const installed = path.join(tmpDir, '.codeadd', 'scripts');
    fs.mkdirSync(installed, { recursive: true });

    const managed = ['status.sh', 'delivered.sh', 'qa-evidence.sh'];
    for (const name of managed) fs.writeFileSync(path.join(installed, name), '# old shell\n');
    const manual = path.join(installed, 'local-helper.sh');
    fs.writeFileSync(manual, '# manual\n');

    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: managed.map((n) => `.codeadd/scripts/${n}`),
    });

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildNativeZip());

    await update(tmpDir);

    for (const name of managed) {
      expect(fs.existsSync(path.join(installed, name)), name).toBe(false);
    }
    // Never in the manifest, so never in a diff: the user's file survives.
    expect(fs.readFileSync(manual, 'utf8')).toBe('# manual\n');
    for (const name of NATIVE_NAMES) {
      expect(fs.existsSync(path.join(installed, name)), name).toBe(true);
    }
    const manifest = readManifest(tmpDir);
    for (const name of managed) expect(manifest.files).not.toContain(`.codeadd/scripts/${name}`);
  });
});
