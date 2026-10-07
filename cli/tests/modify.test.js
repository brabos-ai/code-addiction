import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  getLatestPrerelease: vi.fn(),
  downloadReleaseAsset: vi.fn(),
  promptConfirm: vi.fn(),
  promptModify: vi.fn(),
  promptApplyDiff: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  getLatestPrerelease: mocks.getLatestPrerelease,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
}));

vi.mock('../src/prompt.js', () => ({
  promptProviders: vi.fn(),
  promptScope: vi.fn(),
  promptGitignore: vi.fn(),
  promptConfirm: mocks.promptConfirm,
  promptModify: mocks.promptModify,
  promptApplyDiff: mocks.promptApplyDiff,
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

import { log } from '@clack/prompts';
import { applyDesiredState, diffState, providers, modify } from '../src/modify.js';
import { writeManifest } from '../src/installer.js';
import { copyRelease } from '../src/release-copy.js';
import { resolveSelected } from '../src/providers.js';
import { captureBaselines } from '../src/injection-core.js';
import { applyEnabledFeatures, enableFeature } from '../src/features.js';
import { enablePlugin } from '../src/plugins.js';
import { getInstalledDirs, writeGitignoreBlock } from '../src/gitignore.js';

// ---------------------------------------------------------------------------
// Fixture: a release zip carrying every provider, a v2 injection sidecar with a
// feature slot per feature and one plugin slot, and the fragments they inject.
// ---------------------------------------------------------------------------

const ANCHORS = { tdd: '<<add-new:tdd>>', qa: '<<add-new:qa>>', gx: '<<add-new:gx>>' };
const PRISTINE_CMD = `# add-new\n\n${ANCHORS.tdd}\n\n${ANCHORS.qa}\n\n${ANCHORS.gx}\n\n## End\n`;
const frag = (section, body) => `<!-- section:${section} -->\n${body}\n<!-- /section:${section} -->\n`;

const slot = (id, namespace, name, section) => ({
  id,
  fallback: '',
  members: [{ namespace, name, section }],
  resource: { name: 'add-new', kind: 'command' },
  anchor: { text: ANCHORS[section], ordinal: 1, position: 'after', next: null },
});

const SIDECAR = {
  version: 2,
  slots: [
    slot('tdd-pipeline.tdd', 'feature', 'tdd-pipeline', 'tdd'),
    slot('qa-pipeline.qa', 'feature', 'qa-pipeline', 'qa'),
    slot('gx.gx', 'plugin', 'gx', 'gx'),
  ],
};

function releaseZip() {
  const zip = new AdmZip();
  const add = (p, c) => zip.addFile(p, Buffer.from(c));
  for (const d of ['.claude', '.cursor', '.opencode']) add(`framwork/${d}/commands/add-new.md`, PRISTINE_CMD);
  add('framwork/.cursor/skills/base/SKILL.md', 'base');
  add('framwork/.agents/skills/base/SKILL.md', 'base');
  add('framwork/.codex/agents/a.toml', 'a');
  add('framwork/.zcode/agents/a.md', 'a');
  add('framwork/.codeadd/injection-points.json', JSON.stringify(SIDECAR));
  add('framwork/.codeadd/fragments/tdd-pipeline/add-new.md', frag('tdd', 'TDD-CONTENT'));
  add('framwork/.codeadd/fragments/qa-pipeline/add-new.md', frag('qa', 'QA-CONTENT'));
  add('framwork/.codeadd/plugins/gx/fragments/add-new.md', frag('gx', 'GX-CONTENT'));
  add('framwork/.codeadd/plugins/gx/skills/gx-skill/SKILL.md', 'skill');
  add('framwork/.codeadd/scripts/x.sh', 'echo ok\n');
  return zip;
}

let dir;
let catalogFile;

const writeCatalog = (detect) => {
  fs.writeFileSync(
    catalogFile,
    JSON.stringify({ gx: { type: 'mcp', description: 'g', detect, injects: ['add-new'], skills: ['gx-skill'] } }),
  );
  process.env.CODEADD_PLUGINS_CATALOG = catalogFile;
};

/** Everything `install` leaves behind for these providers, built from the real helpers. */
function seed(keys, { features = {}, plugins = false, scope = 'project', gitignore = false } = {}) {
  const providers = resolveSelected(keys, scope);
  const files = copyRelease(releaseZip(), dir, providers);
  writeManifest(dir, '1.0.0', keys, files, 'v1.0.0', {
    source: 'release',
    ref: null,
    channel: 'stable',
    scope,
    features: { 'tdd-pipeline': true, 'qa-pipeline': false, 'docs-pruning': false, board: false, ...features },
    plugins: {},
    gitignore,
    migrations: ['m1'],
  });
  captureBaselines(dir);
  applyEnabledFeatures(dir);
  if (plugins) enablePlugin(dir, 'gx');
  if (scope === 'project' && gitignore) writeGitignoreBlock(dir, getInstalledDirs(keys));
}

const abs = (rel) => path.join(dir, rel);
const read = (rel) => fs.readFileSync(abs(rel), 'utf8');
const manifest = () => JSON.parse(read('.codeadd/manifest.json'));
const count = (text, sub) => text.split(sub).length - 1;

/** Every file under the tree, mapped to its bytes — for "nothing was written" checks. */
function snapshot() {
  const out = {};
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else out[path.relative(dir, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8');
    }
  };
  walk(dir);
  return out;
}

const baselines = () =>
  Object.fromEntries(Object.entries(snapshot()).filter(([k]) => k.startsWith('.codeadd/baselines/')));

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-modify-'));
  catalogFile = path.join(dir, '..', `catalog-${path.basename(dir)}.json`);
  writeCatalog('node -e "process.exit(0)"');
  mocks.getLatestTag.mockReset();
  mocks.downloadReleaseAsset.mockReset();
  mocks.promptConfirm.mockReset().mockResolvedValue(true);
  mocks.promptModify.mockReset();
  mocks.promptApplyDiff.mockReset().mockResolvedValue(true);
  mocks.downloadReleaseAsset.mockImplementation(async () => releaseZip().toBuffer());
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.CODEADD_PLUGINS_CATALOG;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(catalogFile, { force: true });
});

// ---------------------------------------------------------------------------

describe('diffState', () => {
  const base = {
    providers: ['claude'],
    features: { 'tdd-pipeline': true, 'qa-pipeline': false },
    plugins: { gx: { enabled: true } },
  };

  it('reports providers added and removed', () => {
    const diff = diffState(base, { providers: ['cursor', 'claude'] });
    expect(diff.providers).toEqual({ add: ['cursor'], remove: [] });
    expect(diffState(base, { providers: [] }).providers).toEqual({ add: [], remove: ['claude'] });
  });

  it('reports features and plugins to enable and disable, ignoring what is unchanged', () => {
    const diff = diffState(base, {
      providers: ['claude'],
      features: { 'tdd-pipeline': true, 'qa-pipeline': true },
      plugins: { gx: false },
    });
    expect(diff.features).toEqual({ enable: ['qa-pipeline'], disable: [] });
    expect(diff.plugins).toEqual({ enable: [], disable: ['gx'] });
  });

  it('treats a feature missing from the manifest as its registry default', () => {
    expect(diffState({ providers: [] }, { providers: [], features: { 'tdd-pipeline': true } }).features).toEqual({
      enable: [],
      disable: [],
    });
  });

  it('is empty when desired matches the manifest', () => {
    const diff = diffState(base, { providers: ['claude'] });
    expect(diff.isEmpty).toBe(true);
  });
});

describe('applyDesiredState — add a provider (L2.1, L2.2, L2.9, L2.11)', () => {
  it('L2.1 downloads the installed releaseTag, composes every slot once, and baselines are pristine', async () => {
    seed(['claude'], { plugins: true });
    const claudeBefore = read('.claude/commands/add-new.md');

    await applyDesiredState(dir, { providers: ['claude', 'cursor'] });

    expect(mocks.downloadReleaseAsset).toHaveBeenCalledWith('v1.0.0');
    expect(mocks.getLatestTag).not.toHaveBeenCalled();
    for (const p of ['.claude', '.cursor']) {
      const text = read(`${p}/commands/add-new.md`);
      expect(count(text, 'TDD-CONTENT'), p).toBe(1);
      expect(count(text, 'GX-CONTENT'), p).toBe(1);
      expect(text, p).not.toContain('QA-CONTENT');
    }
    expect(read('.claude/commands/add-new.md')).toBe(claudeBefore);
    for (const key of ['claude', 'cursor']) {
      expect(read(`.codeadd/baselines/${key}/commands/add-new.md`), key).toBe(PRISTINE_CMD);
    }
    expect(fs.existsSync(abs('.cursor/skills/gx-skill/SKILL.md'))).toBe(true);
    expect(manifest().providers).toEqual(['claude', 'cursor']);
  });

  it('L2.2 keeps features, plugins, migrations, channel, scope and gitignore as they were', async () => {
    seed(['claude'], { plugins: true, gitignore: true, features: { 'qa-pipeline': true } });
    const before = manifest();

    await applyDesiredState(dir, { providers: ['claude', 'cursor'] });

    const after = manifest();
    for (const field of ['features', 'plugins', 'migrations', 'channel', 'scope', 'gitignore', 'source', 'ref']) {
      expect(after[field], field).toEqual(before[field]);
    }
    expect(after.releaseTag).toBe('v1.0.0');
    expect(read('.gitignore')).toContain('.cursor/');
  });

  it('L2.9 names a plugin whose tool is not detected and keeps it enabled', async () => {
    seed(['claude'], { plugins: true });
    writeCatalog('false');

    await applyDesiredState(dir, { providers: ['claude', 'cursor'] });

    expect(log.warn).toHaveBeenCalledWith('plugin gx is enabled but not applied to any provider (tool not detected)');
    expect(manifest().plugins.gx).toEqual({ enabled: true });
  });

  it('L2.11 adds a provider and enables a feature in one run — every provider carries both, once', async () => {
    seed(['claude'], { plugins: true });

    await applyDesiredState(dir, { providers: ['claude', 'cursor'], features: { 'qa-pipeline': true } });

    for (const p of ['.claude', '.cursor']) {
      const text = read(`${p}/commands/add-new.md`);
      expect(count(text, 'TDD-CONTENT'), p).toBe(1);
      expect(count(text, 'QA-CONTENT'), p).toBe(1);
    }
    expect(manifest().features['qa-pipeline']).toBe(true);
  });

  it('L2.8 a failed download leaves every file and the manifest as they were', async () => {
    seed(['claude'], { plugins: true });
    const before = snapshot();
    mocks.downloadReleaseAsset.mockRejectedValue(new Error('404 not found'));

    await expect(applyDesiredState(dir, { providers: ['claude', 'cursor'] })).rejects.toThrow(/codeadd update/);

    expect(snapshot()).toEqual(before);
  });
});

describe('applyDesiredState — remove providers (L2.3, L2.7, L2.12)', () => {
  it('L2.3 removes codex without a download, keeping the .agents tree zcode still owns', async () => {
    seed(['claude', 'codex', 'zcode'], { gitignore: true });
    // codex hosts no commands so it has no real baselines; plant one so the cleanup is observable.
    fs.mkdirSync(abs('.codeadd/baselines/codex/commands'), { recursive: true });
    fs.writeFileSync(abs('.codeadd/baselines/codex/commands/x.md'), 'x');
    const seeded = manifest();
    seeded.baselineHashes['.codeadd/baselines/codex/commands/x.md'] = 'deadbeef';
    fs.writeFileSync(abs('.codeadd/manifest.json'), JSON.stringify(seeded, null, 2));
    fs.writeFileSync(abs('.codex/config.toml'), '[mine]\n');
    const before = manifest();
    const baselinesBefore = baselines();

    await applyDesiredState(dir, { providers: ['claude', 'zcode'] }, { force: true });

    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
    expect(fs.existsSync(abs('.codex/agents/a.toml'))).toBe(false);
    expect(fs.existsSync(abs('.codeadd/baselines/codex'))).toBe(false);
    const after = manifest();
    expect(after.providers).toEqual(['claude', 'zcode']);
    expect(after.files.some((f) => f.startsWith('.codex/'))).toBe(false);
    expect(Object.keys(after.hashes).some((f) => f.startsWith('.codex/'))).toBe(false);
    expect(Object.keys(after.baselineHashes).some((f) => f.startsWith('.codeadd/baselines/codex/'))).toBe(false);
    for (const [k, v] of Object.entries(before.baselineHashes)) {
      if (!k.startsWith('.codeadd/baselines/codex/')) expect(after.baselineHashes[k], k).toBe(v);
    }
    expect(after.installedAt).toBe(before.installedAt);
    expect(fs.existsSync(abs('.agents/skills/base/SKILL.md'))).toBe(true);
    expect(fs.existsSync(abs('.zcode/agents/a.md'))).toBe(true);
    expect(read('.codex/config.toml')).toBe('[mine]\n');
    const { ['.codeadd/baselines/codex/commands/x.md']: _gone, ...keptBefore } = baselinesBefore;
    expect(baselines()).toEqual(keptBefore);
    expect(read('.gitignore')).not.toContain('.codex/');
    expect(read('.gitignore')).toContain('.zcode/');
  });

  it('L2.3 writes no .gitignore when the install did not opt in', async () => {
    seed(['claude', 'cursor'], { gitignore: false });

    await applyDesiredState(dir, { providers: ['claude'] }, { force: true });

    expect(fs.existsSync(abs('.gitignore'))).toBe(false);
  });

  it('L2.3 removing cursor deletes its files and baselines and leaves claude byte-identical', async () => {
    seed(['claude', 'cursor'], { plugins: true });
    const claudeBefore = read('.claude/commands/add-new.md');
    const claudeBaseline = read('.codeadd/baselines/claude/commands/add-new.md');

    await applyDesiredState(dir, { providers: ['claude'] }, { force: true });

    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
    expect(fs.existsSync(abs('.cursor'))).toBe(false);
    expect(fs.existsSync(abs('.codeadd/baselines/cursor'))).toBe(false);
    expect(read('.claude/commands/add-new.md')).toBe(claudeBefore);
    expect(read('.codeadd/baselines/claude/commands/add-new.md')).toBe(claudeBaseline);
    expect(manifest().providers).toEqual(['claude']);
    expect(manifest().plugins.gx).toEqual({ enabled: true });
  });

  it('L2.7 a declined confirmation surfaces USER_CANCEL and writes nothing', async () => {
    seed(['claude', 'cursor']);
    const before = snapshot();
    mocks.promptConfirm.mockRejectedValue(new Error('USER_CANCEL'));

    await expect(applyDesiredState(dir, { providers: ['claude'] })).rejects.toThrow('USER_CANCEL');

    expect(snapshot()).toEqual(before);
  });

  it('L2.7 force skips the confirmation', async () => {
    seed(['claude', 'cursor']);

    await applyDesiredState(dir, { providers: ['claude'] }, { force: true });

    expect(mocks.promptConfirm).not.toHaveBeenCalled();
  });

  it('L2.7 an add never asks for confirmation', async () => {
    seed(['claude']);

    await applyDesiredState(dir, { providers: ['claude', 'cursor'] });

    expect(mocks.promptConfirm).not.toHaveBeenCalled();
  });

  it('L2.12 removing the last provider succeeds, warns, and leaves .codeadd/ intact', async () => {
    seed(['claude']);

    await applyDesiredState(dir, { providers: [] }, { force: true });

    expect(manifest().providers).toEqual([]);
    expect(fs.existsSync(abs('.claude'))).toBe(false);
    expect(fs.existsSync(abs('.codeadd/scripts/x.sh'))).toBe(true);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('only .codeadd/ remains'));
  });
});

describe('applyDesiredState — features and plugins only (L2.4)', () => {
  it('L2.4 downloads nothing and equals `features enable` of the same feature', async () => {
    seed(['claude', 'cursor']);
    await applyDesiredState(dir, { providers: ['claude', 'cursor'], features: { 'qa-pipeline': true } });
    const viaCore = { claude: read('.claude/commands/add-new.md'), cursor: read('.cursor/commands/add-new.md'), features: manifest().features };
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();

    fs.rmSync(abs('.'), { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    seed(['claude', 'cursor']);
    enableFeature(dir, 'qa-pipeline');

    expect(read('.claude/commands/add-new.md')).toBe(viaCore.claude);
    expect(read('.cursor/commands/add-new.md')).toBe(viaCore.cursor);
    expect(manifest().features).toEqual(viaCore.features);
  });

  it('enables and disables a plugin through the existing plugin functions', async () => {
    seed(['claude']);

    await applyDesiredState(dir, { providers: ['claude'], plugins: { gx: true } });
    expect(count(read('.claude/commands/add-new.md'), 'GX-CONTENT')).toBe(1);
    expect(fs.existsSync(abs('.claude/skills/gx-skill/SKILL.md'))).toBe(true);

    await applyDesiredState(dir, { providers: ['claude'], plugins: { gx: false } });
    expect(read('.claude/commands/add-new.md')).not.toContain('GX-CONTENT');
    expect(fs.existsSync(abs('.claude/skills/gx-skill'))).toBe(false);
    expect(manifest().plugins.gx).toEqual({ enabled: false });
  });
});

describe('applyDesiredState — refusals', () => {
  it('refuses a provider with no global destination in global scope, and writes nothing', async () => {
    seed(['claude'], { scope: 'global' });
    const before = snapshot();

    await expect(applyDesiredState(dir, { providers: ['claude', 'cursor'] })).rejects.toThrow(/cursor/);

    expect(snapshot()).toEqual(before);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });

  it('refuses an unknown provider, feature or plugin before touching anything', async () => {
    seed(['claude']);
    const before = snapshot();

    await expect(applyDesiredState(dir, { providers: ['claude', 'nope'] })).rejects.toThrow(/nope/);
    await expect(applyDesiredState(dir, { providers: ['claude'], features: { nope: true } })).rejects.toThrow(/nope/);
    await expect(applyDesiredState(dir, { providers: ['claude'], plugins: { nope: true } })).rejects.toThrow(/nope/);

    expect(snapshot()).toEqual(before);
  });

  it('refuses when there is no installation', async () => {
    await expect(applyDesiredState(dir, { providers: ['claude'] })).rejects.toThrow(/codeadd install/);
  });

  it('does nothing and says so when desired matches the manifest', async () => {
    seed(['claude']);
    const before = snapshot();

    await applyDesiredState(dir, { providers: ['claude'] });

    expect(snapshot()).toEqual(before);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });
});

describe('round trip (L3.2)', () => {
  it('add opencode then remove it returns the installation to where it started', async () => {
    seed(['claude'], { plugins: true, features: { 'qa-pipeline': true } });
    const before = manifest();
    const claudeBefore = Object.fromEntries(Object.entries(snapshot()).filter(([k]) => k.startsWith('.claude/')));

    await providers(dir, ['add', 'opencode'], 'project');
    expect(read('opencode.json')).toContain('codeadd-docs');
    await providers(dir, ['remove', 'opencode', '--force'], 'project');

    const after = manifest();
    expect(after.providers).toEqual(before.providers);
    expect(after.features).toEqual(before.features);
    expect(after.plugins).toEqual(before.plugins);
    expect(Object.fromEntries(Object.entries(snapshot()).filter(([k]) => k.startsWith('.claude/')))).toEqual(claudeBefore);
    expect(fs.existsSync(abs('.opencode'))).toBe(false);
    expect(JSON.parse(read('opencode.json')).mcp?.['codeadd-docs']).toBeUndefined();
  });
});

describe('import order (L3.4)', () => {
  // installer.js imports modify.js and updater.js, and both import it back. The
  // cycle is safe only while every import is used at call time, never at load.
  const srcDir = path.resolve(__dirname, '../src');

  it.each([
    ['installer.js', 'install'],
    ['modify.js', 'applyDesiredState'],
    ['updater.js', 'update'],
  ])('a fresh process importing %s first loads it and exposes %s', (file, exported) => {
    const url = pathToFileURL(path.join(srcDir, file)).href;
    const script =
      `const m = await import(${JSON.stringify(url)});` +
      `if (typeof m.${exported} !== 'function') { console.error('missing ${exported}'); process.exit(3); }`;

    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '' },
    });

    expect(result.status, result.stderr).toBe(0);
  });
});

describe('codeadd providers (L2.5)', () => {
  it('list shows every provider, marking the installed ones', async () => {
    seed(['claude', 'cursor']);

    await providers(dir, ['list'], 'project');

    const printed = log.message.mock.calls.map((c) => c[0]).join('\n');
    expect(printed).toMatch(/● claude/);
    expect(printed).toMatch(/● cursor/);
    expect(printed).toMatch(/○ codex/);
  });

  it('list in global scope leaves out the providers that have no global destination', async () => {
    seed(['claude'], { scope: 'global' });

    await providers(dir, ['list'], 'global');

    const printed = log.message.mock.calls.map((c) => c[0]).join('\n');
    expect(printed).toMatch(/● claude/);
    expect(printed).not.toMatch(/cursor/);
  });

  it('add installs the provider from the installed release', async () => {
    seed(['claude'], { plugins: true });

    await providers(dir, ['add', 'cursor'], 'project');

    expect(mocks.downloadReleaseAsset).toHaveBeenCalledWith('v1.0.0');
    expect(manifest().providers).toEqual(['claude', 'cursor']);
    expect(count(read('.cursor/commands/add-new.md'), 'GX-CONTENT')).toBe(1);
  });

  it('add of a provider already installed says there is nothing to change and downloads nothing', async () => {
    seed(['claude']);
    const before = snapshot();

    await providers(dir, ['add', 'claude'], 'project');

    expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/nothing to change/i));
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
    expect(snapshot()).toEqual(before);
  });

  it('remove asks for confirmation unless --force', async () => {
    seed(['claude', 'cursor']);
    await providers(dir, ['remove', 'cursor'], 'project');
    expect(mocks.promptConfirm).toHaveBeenCalledTimes(1);
    expect(manifest().providers).toEqual(['claude']);

    seed(['claude', 'cursor']);
    mocks.promptConfirm.mockClear();
    await providers(dir, ['remove', 'cursor', '--force'], 'project');
    expect(mocks.promptConfirm).not.toHaveBeenCalled();
  });

  it.each([
    ['no installation', ['add', 'cursor'], null, /codeadd install/],
    ['an unknown provider', ['add', 'nope'], ['claude'], /Unknown provider "nope"/],
    ['removing a provider that is not installed', ['remove', 'cursor'], ['claude'], /"cursor" is not installed/],
    ['a missing provider name', ['add'], ['claude'], /Usage: codeadd providers add <name>/],
    ['an unknown action', ['frobnicate'], ['claude'], /Unknown action "frobnicate"/],
  ])('refuses %s and writes nothing', async (_label, args, installed, message) => {
    if (installed) seed(installed);
    const before = snapshot();

    await expect(providers(dir, args, 'project')).rejects.toThrow(message);

    expect(snapshot()).toEqual(before);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });

  it('add of a provider with no global destination fails in a global install, and writes nothing', async () => {
    seed(['claude'], { scope: 'global' });
    const before = snapshot();

    await expect(providers(dir, ['add', 'cursor'], 'global')).rejects.toThrow(/cursor/);

    expect(snapshot()).toEqual(before);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });
});

describe('codeadd modify (L2.5, L2.7)', () => {
  it('refuses when there is no installation', async () => {
    await expect(modify(dir, [], 'project')).rejects.toThrow(/codeadd install/);
    expect(fs.existsSync(abs('.codeadd'))).toBe(false);
  });

  it('shows the diff once, then applies it with no second confirmation when a provider is removed', async () => {
    seed(['claude', 'cursor']);
    mocks.promptModify.mockResolvedValue({ providers: ['claude'], features: {}, plugins: {} });

    await modify(dir, [], 'project');

    expect(mocks.promptApplyDiff).toHaveBeenCalledTimes(1);
    expect(mocks.promptConfirm).not.toHaveBeenCalled();
    expect(manifest().providers).toEqual(['claude']);
  });

  it('hands the prompt the current state and the installation scope', async () => {
    seed(['claude'], { scope: 'global', plugins: true });
    mocks.promptModify.mockResolvedValue({ providers: ['claude'], features: {}, plugins: {} });

    await modify(dir, [], 'project');

    const [current, scope] = mocks.promptModify.mock.calls[0];
    expect(scope).toBe('global');
    expect(current.providers).toEqual(['claude']);
    expect(current.features.find((f) => f.name === 'tdd-pipeline')).toMatchObject({ enabled: true });
    expect(current.plugins.find((p) => p.name === 'gx')).toMatchObject({ enabled: true });
  });

  it('writes nothing when the user declines the diff', async () => {
    seed(['claude']);
    const before = snapshot();
    mocks.promptModify.mockResolvedValue({ providers: ['claude', 'cursor'], features: {}, plugins: {} });
    mocks.promptApplyDiff.mockResolvedValue(false);

    await modify(dir, [], 'project');

    expect(snapshot()).toEqual(before);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });

  it('applies a feature toggle chosen in the prompt', async () => {
    seed(['claude']);
    mocks.promptModify.mockResolvedValue({
      providers: ['claude'],
      features: { 'tdd-pipeline': true, 'qa-pipeline': true },
      plugins: {},
    });

    await modify(dir, [], 'project');

    expect(count(read('.claude/commands/add-new.md'), 'QA-CONTENT')).toBe(1);
    expect(manifest().features['qa-pipeline']).toBe(true);
  });
});
