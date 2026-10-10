import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';

// Non-interactive install, modify and update, in-process with stdin not a TTY.
// Every prompt is a mock that fails the test when it is called: a prompt in
// these paths is a hang for a bot. The cases that need no download and no
// mocks live in bin-entrypoint.integration.test.js, through a real child process.

const mocks = vi.hoisted(() => {
  const noPrompt = (name) =>
    vi.fn(() => {
      throw new Error(`PROMPT CALLED: ${name}`);
    });
  return {
    getLatestTag: vi.fn(),
    getLatestPrerelease: vi.fn(),
    downloadReleaseAsset: vi.fn(),
    prompts: {
      promptProviders: noPrompt('promptProviders'),
      promptScope: noPrompt('promptScope'),
      promptConfirm: noPrompt('promptConfirm'),
      promptFeatures: noPrompt('promptFeatures'),
      promptGitignore: noPrompt('promptGitignore'),
      promptExistingInstall: noPrompt('promptExistingInstall'),
      promptModify: noPrompt('promptModify'),
      promptApplyDiff: noPrompt('promptApplyDiff'),
      promptUninstallScope: noPrompt('promptUninstallScope'),
    },
  };
});

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  getLatestPrerelease: mocks.getLatestPrerelease,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
}));

vi.mock('../src/prompt.js', () => mocks.prompts);

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

import { install, writeManifest } from '../src/installer.js';
import { modify, providers as providersCmd } from '../src/modify.js';
import { update } from '../src/updater.js';
import { copyRelease } from '../src/release-copy.js';
import { resolveSelected } from '../src/providers.js';

function releaseZip(extra = '') {
  const zip = new AdmZip();
  const add = (p, c) => zip.addFile(p, Buffer.from(c));
  add('framwork/.codeadd/scripts/health.sh', 'echo ok\n');
  add('framwork/.codeadd/injection-points.json', '{"version":1,"points":[]}\n');
  add('framwork/.claude/commands/add-help.md', `# add-help${extra}\n`);
  add('framwork/.agents/skills/add/SKILL.md', '---\nname: add\n---\n');
  add('framwork/.codex/agents/a.toml', 'a');
  return zip;
}

let dir;
let catalogFile;
const realIsTTY = process.stdin.isTTY;

const manifest = () => JSON.parse(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(dir, rel));

/** Everything `install` leaves behind for these providers, built from the real helpers. */
function seed(keys, { features = {} } = {}) {
  const files = copyRelease(releaseZip(), dir, resolveSelected(keys, 'project'));
  writeManifest(dir, '1.0.0', keys, files, 'v1.0.0', {
    source: 'release',
    ref: null,
    channel: 'stable',
    scope: 'project',
    features: { 'tdd-pipeline': true, 'qa-pipeline': false, 'docs-pruning': false, board: false, ...features },
    plugins: {},
    gitignore: false,
    migrations: [],
  });
}

const useFailingPlugin = () => {
  fs.writeFileSync(
    catalogFile,
    JSON.stringify({ gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(1)"', injects: ['add-help'], skills: [] } }),
  );
  process.env.CODEADD_PLUGINS_CATALOG = catalogFile;
};

beforeEach(() => {
  process.stdin.isTTY = false;
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-noninteractive-'));
  catalogFile = path.join(dir, '..', `catalog-${path.basename(dir)}.json`);
  mocks.getLatestTag.mockReset().mockResolvedValue('v1.2.3');
  mocks.downloadReleaseAsset.mockReset().mockImplementation(async () => releaseZip().toBuffer());
  for (const prompt of Object.values(mocks.prompts)) prompt.mockClear();
  delete process.env.CODEADD_PLUGINS_CATALOG;
});

afterEach(() => {
  process.stdin.isTTY = realIsTTY;
  delete process.env.CODEADD_PLUGINS_CATALOG;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(catalogFile, { force: true });
});

const promptsCalled = () => Object.entries(mocks.prompts).filter(([, fn]) => fn.mock.calls.length > 0).map(([name]) => name);

describe('install with no TTY (L2.1-L2.5, L2.9)', () => {
  it('L2.1 installs the asked providers with a feature delta and no prompt', async () => {
    await install(dir, { args: ['--providers', 'claude,codex', '--enable-feature', 'board'] });

    expect(promptsCalled()).toEqual([]);
    const m = manifest();
    expect(m.providers).toEqual(['claude', 'codex']);
    expect(m.features.board).toBe(true);
    expect(m.features['tdd-pipeline']).toBe(true);
    expect(m.scope).toBe('project');
    expect(m.gitignore).toBe(true);
    expect(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8')).toMatch(/codeadd/i);
    expect(exists('.claude/commands/add-help.md')).toBe(true);
  });

  it('L2.1 a feature disable delta lands on top of the registry defaults', async () => {
    await install(dir, { args: ['--providers', 'claude', '--disable-feature', 'tdd-pipeline'] });
    expect(manifest().features['tdd-pipeline']).toBe(false);
  });

  it('L2.2 --providers none installs the core only', async () => {
    await install(dir, { args: ['--providers', 'none'] });

    expect(manifest().providers).toEqual([]);
    expect(exists('.codeadd/scripts/health.sh')).toBe(true);
    expect(exists('.claude')).toBe(false);
    expect(promptsCalled()).toEqual([]);
  });

  it('L2.3 --no-gitignore writes no .gitignore block', async () => {
    await install(dir, { args: ['--providers', 'claude', '--no-gitignore'] });

    expect(manifest().gitignore).toBe(false);
    expect(exists('.gitignore')).toBe(false);
  });

  it('L2.4 an existing provider dir needs --force, and nothing is downloaded or written without it', async () => {
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'mine.md'), 'mine');

    await expect(install(dir, { args: ['--providers', 'claude'] })).rejects.toThrow(/--force/);

    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
    expect(exists('.codeadd')).toBe(false);
    expect(fs.readFileSync(path.join(dir, '.claude', 'mine.md'), 'utf8')).toBe('mine');

    await install(dir, { args: ['--providers', 'claude', '--force'] });
    expect(manifest().providers).toEqual(['claude']);
    expect(promptsCalled()).toEqual([]);
  });

  it('a .codeadd/ holding only the committed board.json is a fresh clone, not a clash', async () => {
    fs.mkdirSync(path.join(dir, '.codeadd'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.codeadd', 'board.json'), '{"remote":"x","branch":"board"}');

    await install(dir, { args: ['--providers', 'none'] });

    expect(promptsCalled()).toEqual([]);
    expect(exists('.codeadd/manifest.json')).toBe(true);
    expect(fs.readFileSync(path.join(dir, '.codeadd', 'board.json'), 'utf8')).toBe('{"remote":"x","branch":"board"}');
  });

  it('L2.4 an existing .codeadd/ needs --force', async () => {
    fs.mkdirSync(path.join(dir, '.codeadd'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.codeadd', 'other.txt'), 'x');

    await expect(install(dir, { args: ['--providers', 'none'] })).rejects.toThrow(/--force/);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });

  it('L2.5 an unknown feature, plugin or provider is refused before the download', async () => {
    await expect(install(dir, { args: ['--providers', 'claude', '--enable-feature', 'nope'] })).rejects.toThrow(/Unknown feature/);
    await expect(install(dir, { args: ['--providers', 'claude', '--enable-plugin', 'nope'] })).rejects.toThrow(/Unknown plugin/);
    await expect(install(dir, { args: ['--providers', 'nope'] })).rejects.toThrow(/Unknown provider/);

    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
    expect(exists('.codeadd')).toBe(false);
  });

  it('refuses without --providers, before any download, and says how to pass it', async () => {
    await expect(install(dir, { args: [] })).rejects.toThrow(/--providers/);
    expect(mocks.downloadReleaseAsset).not.toHaveBeenCalled();
  });

  it('L2.9 a requested plugin whose tool is not detected fails AFTER the install is written', async () => {
    useFailingPlugin();

    await expect(
      install(dir, { args: ['--providers', 'claude', '--enable-plugin', 'gx', '--enable-feature', 'board'] }),
    ).rejects.toThrow(/gx/);

    const m = manifest();
    expect(m.providers).toEqual(['claude']);
    expect(m.features.board).toBe(true);
    expect(m.plugins?.gx?.enabled).not.toBe(true);
    expect(promptsCalled()).toEqual([]);
  });
});

describe('modify with flags and no TTY (L2.6, L2.8)', () => {
  it('L2.6 applies the diff with --force and no prompt', async () => {
    seed(['claude', 'codex']);

    await modify(dir, ['--providers', 'claude', '--force', '--disable-feature', 'tdd-pipeline'], 'project');

    expect(promptsCalled()).toEqual([]);
    const m = manifest();
    expect(m.providers).toEqual(['claude']);
    expect(m.features['tdd-pipeline']).toBe(false);
    expect(exists('.claude/commands/add-help.md')).toBe(true);
    expect(exists('.agents/skills/add/SKILL.md')).toBe(false);
  });

  it('L2.6 feature and plugin flags are deltas: what is not named stays as it was', async () => {
    seed(['claude'], { features: { 'qa-pipeline': true } });

    await modify(dir, ['--enable-feature', 'board'], 'project');

    const m = manifest();
    expect(m.features.board).toBe(true);
    expect(m.features['tdd-pipeline']).toBe(true);
    expect(m.features['qa-pipeline']).toBe(true);
    expect(m.providers).toEqual(['claude']);
  });

  it('L2.6 a removal without --force is refused and changes nothing', async () => {
    seed(['claude', 'codex']);
    const before = fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8');

    await expect(modify(dir, ['--providers', 'claude'], 'project')).rejects.toThrow(/--force/);

    expect(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8')).toBe(before);
    expect(exists('.agents/skills/add/SKILL.md')).toBe(true);
    expect(promptsCalled()).toEqual([]);
  });

  it('P2 providers remove without --force and no TTY is refused with the same message', async () => {
    seed(['claude', 'codex']);

    await expect(providersCmd(dir, ['remove', 'codex'], 'project')).rejects.toThrow(/--force/);
    expect(manifest().providers).toEqual(['claude', 'codex']);
    expect(promptsCalled()).toEqual([]);
  });

  it('modify with no flags and no TTY refuses instead of opening the editor', async () => {
    seed(['claude']);

    await expect(modify(dir, [], 'project')).rejects.toThrow(/--providers|--enable-feature/);
    expect(promptsCalled()).toEqual([]);
  });

  it('L2.8 a plugin that cannot be enabled fails after the rest is applied', async () => {
    seed(['claude']);
    useFailingPlugin();

    await expect(modify(dir, ['--enable-plugin', 'gx', '--enable-feature', 'board'], 'project')).rejects.toThrow(/gx/);

    const m = manifest();
    expect(m.features.board).toBe(true);
    expect(m.plugins?.gx?.enabled).not.toBe(true);
  });

  it('an alias and its canonical feature name asked for opposite states is a conflict', async () => {
    seed(['claude']);
    const before = fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8');

    await expect(modify(dir, ['--enable-feature', 'tdd', '--disable-feature', 'tdd-pipeline'], 'project')).rejects.toThrow(/same feature/);
    expect(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8')).toBe(before);
  });

  it('refuses an unknown name before changing anything', async () => {
    seed(['claude']);
    const before = fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8');

    await expect(modify(dir, ['--enable-feature', 'nope'], 'project')).rejects.toThrow(/Unknown feature/);
    expect(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8')).toBe(before);
  });
});

describe('update with no TTY (L2.7)', () => {
  it('finishes with no prompt', async () => {
    seed(['claude']);
    mocks.getLatestTag.mockResolvedValue('v1.2.4');
    mocks.downloadReleaseAsset.mockImplementation(async () => releaseZip(' v2').toBuffer());

    await update(dir, {}, 'project');

    expect(promptsCalled()).toEqual([]);
    expect(manifest().version).toBe('1.2.4');
    expect(fs.readFileSync(path.join(dir, '.claude', 'commands', 'add-help.md'), 'utf8')).toContain('v2');
  });
});

describe('the interactive path is unchanged (L2.10)', () => {
  it('with a TTY and no flags, modify still opens the editor once', async () => {
    process.stdin.isTTY = true;
    seed(['claude']);
    mocks.prompts.promptModify.mockReset().mockResolvedValue({ providers: ['claude'], features: {}, plugins: {} });
    mocks.prompts.promptApplyDiff.mockReset().mockResolvedValue(true);

    await modify(dir, [], 'project');

    expect(mocks.prompts.promptModify).toHaveBeenCalledTimes(1);
    mocks.prompts.promptModify.mockImplementation(() => {
      throw new Error('PROMPT CALLED: promptModify');
    });
    mocks.prompts.promptApplyDiff.mockImplementation(() => {
      throw new Error('PROMPT CALLED: promptApplyDiff');
    });
  });
});
