import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  downloadTagZip: vi.fn(),
  downloadBranchZip: vi.fn(),
  promptProviders: vi.fn(),
  promptConfirm: vi.fn(),
  promptFeatures: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  downloadTagZip: mocks.downloadTagZip,
  downloadBranchZip: mocks.downloadBranchZip,
}));

vi.mock('../src/prompt.js', () => ({
  promptProviders: mocks.promptProviders,
  promptConfirm: mocks.promptConfirm,
  promptFeatures: mocks.promptFeatures,
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn() },
}));

import { install } from '../src/installer.js';

function buildInstallZip(zipRoot) {
  const zip = new AdmZip();
  zip.addFile(`${zipRoot}/framwork/.codeadd/commands/add.md`, Buffer.from('# add\n'));
  zip.addFile(`${zipRoot}/framwork/.codeadd/scripts/health.sh`, Buffer.from('echo ok\r\n'));
  zip.addFile(`${zipRoot}/framwork/.agent/workflows/add.md`, Buffer.from('name: add\n'));
  return zip.toBuffer();
}

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-e2e-'));
  mocks.getLatestTag.mockReset();
  mocks.downloadTagZip.mockReset();
  mocks.downloadBranchZip.mockReset();
  mocks.promptProviders.mockReset();
  mocks.promptConfirm.mockReset();
  mocks.promptProviders.mockResolvedValue(['codex']);
  mocks.promptConfirm.mockResolvedValue(undefined);
  mocks.promptFeatures.mockResolvedValue(['tdd', 'startup-test']);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('install command e2e', () => {
  it('installs from latest release and writes release manifest', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadTagZip.mockResolvedValue(buildInstallZip('code-addiction-1.2.3'));

    await install(tmpDir);

    expect(mocks.downloadTagZip).toHaveBeenCalledWith('v1.2.3');
    expect(fs.existsSync(path.join(tmpDir, '.codeadd', 'commands', 'add.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.agent', 'workflows', 'add.md'))).toBe(true);

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

  it('falls back to main branch when repository has no releases', async () => {
    mocks.getLatestTag.mockRejectedValue(
      new Error('Repository brabos-ai/code-addiction not found or has no releases.')
    );
    mocks.downloadBranchZip.mockResolvedValue(buildInstallZip('code-addiction-main'));

    await install(tmpDir);

    expect(mocks.downloadBranchZip).toHaveBeenCalledWith('main');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('main');
    expect(manifest.releaseTag).toBeNull();
    expect(manifest.source).toBe('branch');
    expect(manifest.ref).toBe('main');
  });

  it('installs from explicit branch via --branch flag', async () => {
    mocks.downloadBranchZip.mockResolvedValue(buildInstallZip('code-addiction-feature-xyz'));

    await install(tmpDir, { branch: 'feature-xyz' });

    expect(mocks.getLatestTag).not.toHaveBeenCalled();
    expect(mocks.downloadBranchZip).toHaveBeenCalledWith('feature-xyz');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('feature-xyz');
    expect(manifest.releaseTag).toBeNull();
    expect(manifest.source).toBe('branch');
    expect(manifest.ref).toBe('feature-xyz');
  });

  it('writes selected features to manifest based on user choice', async () => {
    mocks.getLatestTag.mockResolvedValue('v1.0.0');
    mocks.downloadTagZip.mockResolvedValue(buildInstallZip('code-addiction-1.0.0'));
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
    mocks.downloadTagZip.mockResolvedValue(buildInstallZip('code-addiction-1.0.0'));
    mocks.promptFeatures.mockResolvedValue([]);

    await install(tmpDir);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.features.tdd).toBe(false);
    expect(manifest.features['startup-test']).toBe(false);
  });

  it('installs from explicit tag via --version flag', async () => {
    mocks.downloadTagZip.mockResolvedValue(buildInstallZip('code-addiction-2.0.0'));

    await install(tmpDir, { version: 'v2.0.0' });

    expect(mocks.getLatestTag).not.toHaveBeenCalled();
    expect(mocks.downloadTagZip).toHaveBeenCalledWith('v2.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.releaseTag).toBe('v2.0.0');
    expect(manifest.source).toBe('tag');
  });
});
