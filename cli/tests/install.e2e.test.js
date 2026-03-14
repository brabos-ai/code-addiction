import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  downloadReleaseAsset: vi.fn(),
  promptProviders: vi.fn(),
  promptConfirm: vi.fn(),
  promptFeatures: vi.fn(),
  promptGitignore: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
}));

vi.mock('../src/prompt.js', () => ({
  promptProviders: mocks.promptProviders,
  promptConfirm: mocks.promptConfirm,
  promptFeatures: mocks.promptFeatures,
  promptGitignore: mocks.promptGitignore,
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn() },
}));

import { install } from '../src/installer.js';

/**
 * Build a release asset zip (framwork/ prefix, no commands in .codeadd/).
 */
function buildInstallZip() {
  const zip = new AdmZip();
  zip.addFile(`framwork/.codeadd/scripts/health.sh`, Buffer.from('echo ok\r\n'));
  zip.addFile(`framwork/.agent/workflows/add.md`, Buffer.from('name: add\n'));
  zip.addFile(`framwork/.agent/skills/backend-development/SKILL.md`, Buffer.from('---\nname: backend-development\n---\n'));
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
  mocks.promptConfirm.mockResolvedValue(undefined);
  mocks.promptFeatures.mockResolvedValue(['tdd', 'startup-test']);
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
    expect(fs.existsSync(path.join(tmpDir, '.agent', 'workflows', 'add.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.agent', 'skills', 'backend-development', 'SKILL.md'))).toBe(true);

    const sh = fs.readFileSync(path.join(tmpDir, '.codeadd', 'scripts', 'health.sh'), 'utf8');
    expect(sh).toBe('echo ok\n');

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

  it('writes selected features to manifest based on user choice', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());
    mocks.promptFeatures.mockResolvedValue(['tdd']);

    await install(tmpDir);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.features.tdd).toBe(true);
    expect(manifest.features['startup-test']).toBe(false);
  });

  it('writes all features disabled when user selects none', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(buildInstallZip());
    mocks.promptFeatures.mockResolvedValue([]);

    await install(tmpDir);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.features.tdd).toBe(false);
    expect(manifest.features['startup-test']).toBe(false);
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
});
