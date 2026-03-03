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
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  downloadTagZip: mocks.downloadTagZip,
  downloadBranchZip: mocks.downloadBranchZip,
}));

vi.mock('../src/prompt.js', () => ({
  promptProviders: mocks.promptProviders,
  promptConfirm: mocks.promptConfirm,
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn() },
}));

import { install } from '../src/installer.js';

function buildInstallZip(zipRoot) {
  const zip = new AdmZip();
  zip.addFile(`${zipRoot}/framwork/.add/commands/add.md`, Buffer.from('# add\n'));
  zip.addFile(`${zipRoot}/framwork/.add/scripts/health.sh`, Buffer.from('echo ok\r\n'));
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
    expect(fs.existsSync(path.join(tmpDir, '.add', 'commands', 'add.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.agent', 'workflows', 'add.md'))).toBe(true);

    const sh = fs.readFileSync(path.join(tmpDir, '.add', 'scripts', 'health.sh'), 'utf8');
    expect(sh).toBe('echo ok\n');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.add', 'manifest.json'), 'utf8')
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
      fs.readFileSync(path.join(tmpDir, '.add', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('main');
    expect(manifest.releaseTag).toBeNull();
    expect(manifest.source).toBe('branch');
    expect(manifest.ref).toBe('main');
  });
});
