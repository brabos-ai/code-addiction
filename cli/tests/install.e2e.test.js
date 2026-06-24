import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  getLatestPrerelease: vi.fn(),
  downloadReleaseAsset: vi.fn(),
  promptProviders: vi.fn(),
  promptScope: vi.fn(),
  promptConfirm: vi.fn(),
  promptFeatures: vi.fn(),
  promptGitignore: vi.fn(),
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
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

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

beforeEach(() => {
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
});

afterEach(() => {
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
    // tdd is the only registered feature and defaults true.
    expect(manifest.features).toEqual({ tdd: true });
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
