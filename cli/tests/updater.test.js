import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  downloadTagZip: vi.fn(),
  downloadBranchZip: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  downloadTagZip: mocks.downloadTagZip,
  downloadBranchZip: mocks.downloadBranchZip,
}));

vi.mock('../src/prompt.js', () => ({
  promptProviders: vi.fn(),
  promptConfirm: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn() },
}));

import { update } from '../src/updater.js';

function buildZip(zipRoot) {
  const zip = new AdmZip();
  zip.addFile(`${zipRoot}/framwork/.codeadd/commands/add.md`, Buffer.from('# add\n'));
  zip.addFile(`${zipRoot}/framwork/.codeadd/scripts/health.sh`, Buffer.from('echo ok\r\n'));
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
  mocks.downloadTagZip.mockReset();
  mocks.downloadBranchZip.mockReset();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('update command', () => {
  it('throws when no manifest exists', async () => {
    await expect(update(tmpDir)).rejects.toThrow('No ADD installation found');
  });

  it('updates from release to latest release', async () => {
    writeManifestFile(tmpDir, { version: '1.0.0', source: 'release', ref: null, providers: [] });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadTagZip.mockResolvedValue(buildZip('code-addiction-2.0.0'));

    await update(tmpDir);

    expect(mocks.downloadTagZip).toHaveBeenCalledWith('v2.0.0');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.source).toBe('release');
    expect(manifest.releaseTag).toBe('v2.0.0');
  });

  it('skips update when already on latest release', async () => {
    writeManifestFile(tmpDir, { version: '2.0.0', source: 'release', ref: null, providers: [] });
    mocks.getLatestTag.mockResolvedValue('v2.0.0');

    await update(tmpDir);

    expect(mocks.downloadTagZip).not.toHaveBeenCalled();
    expect(mocks.downloadBranchZip).not.toHaveBeenCalled();
  });

  it('re-pulls current branch when no flags given and installed from branch', async () => {
    writeManifestFile(tmpDir, { version: 'main', source: 'branch', ref: 'main', providers: [] });
    mocks.downloadBranchZip.mockResolvedValue(buildZip('code-addiction-main'));

    await update(tmpDir);

    expect(mocks.getLatestTag).not.toHaveBeenCalled();
    expect(mocks.downloadBranchZip).toHaveBeenCalledWith('main');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.source).toBe('branch');
    expect(manifest.ref).toBe('main');
  });

  it('re-pulls a custom branch when installed from that branch', async () => {
    writeManifestFile(tmpDir, { version: 'feature-xyz', source: 'branch', ref: 'feature-xyz', providers: [] });
    mocks.downloadBranchZip.mockResolvedValue(buildZip('code-addiction-feature-xyz'));

    await update(tmpDir);

    expect(mocks.downloadBranchZip).toHaveBeenCalledWith('feature-xyz');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.ref).toBe('feature-xyz');
  });

  it('migrates from release to branch via --branch flag', async () => {
    writeManifestFile(tmpDir, { version: '1.0.0', source: 'release', ref: null, providers: [] });
    mocks.downloadBranchZip.mockResolvedValue(buildZip('code-addiction-main'));

    await update(tmpDir, { branch: 'main' });

    expect(mocks.getLatestTag).not.toHaveBeenCalled();
    expect(mocks.downloadBranchZip).toHaveBeenCalledWith('main');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.source).toBe('branch');
    expect(manifest.ref).toBe('main');
    expect(manifest.releaseTag).toBeNull();
  });

  it('migrates from branch to release via --version flag', async () => {
    writeManifestFile(tmpDir, { version: 'main', source: 'branch', ref: 'main', providers: [] });
    mocks.downloadTagZip.mockResolvedValue(buildZip('code-addiction-2.0.0'));

    await update(tmpDir, { version: 'v2.0.0' });

    expect(mocks.downloadTagZip).toHaveBeenCalledWith('v2.0.0');
    expect(mocks.downloadBranchZip).not.toHaveBeenCalled();
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.source).toBe('tag');
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.releaseTag).toBe('v2.0.0');
  });

  it('updates to explicit branch via --branch flag', async () => {
    writeManifestFile(tmpDir, { version: 'main', source: 'branch', ref: 'main', providers: [] });
    mocks.downloadBranchZip.mockResolvedValue(buildZip('code-addiction-feature-new'));

    await update(tmpDir, { branch: 'feature-new' });

    expect(mocks.downloadBranchZip).toHaveBeenCalledWith('feature-new');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.ref).toBe('feature-new');
    expect(manifest.source).toBe('branch');
  });

  it('updates to specific tag via --version flag', async () => {
    writeManifestFile(tmpDir, { version: '1.0.0', source: 'release', ref: null, providers: [] });
    mocks.downloadTagZip.mockResolvedValue(buildZip('code-addiction-1.5.0'));

    await update(tmpDir, { version: 'v1.5.0' });

    expect(mocks.downloadTagZip).toHaveBeenCalledWith('v1.5.0');
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.version).toBe('1.5.0');
    expect(manifest.source).toBe('tag');
  });

  it('removes obsolete files that existed in old manifest but not in new zip', async () => {
    // Create an orphan file that was installed by a previous version
    const orphanPath = path.join(tmpDir, '.codeadd', 'commands', 'old-command.md');
    fs.mkdirSync(path.dirname(orphanPath), { recursive: true });
    fs.writeFileSync(orphanPath, '# old command');

    // Manifest lists the orphan as an installed file
    writeManifestFile(tmpDir, {
      version: '1.0.0',
      source: 'release',
      ref: null,
      providers: [],
      files: ['.codeadd/commands/old-command.md'],
    });

    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    // New zip does NOT contain old-command.md
    mocks.downloadTagZip.mockResolvedValue(buildZip('code-addiction-2.0.0'));

    await update(tmpDir);

    expect(fs.existsSync(orphanPath)).toBe(false);
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8'));
    expect(manifest.files).not.toContain('.codeadd/commands/old-command.md');
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
    mocks.downloadTagZip.mockResolvedValue(buildZip('code-addiction-2.0.0'));

    await update(tmpDir);

    expect(fs.existsSync(historyFile)).toBe(true);
    expect(fs.existsSync(localFile)).toBe(true);
  });

  it('does not skip update when targeting branch (always re-pulls)', async () => {
    writeManifestFile(tmpDir, { version: 'main', source: 'branch', ref: 'main', providers: [] });
    mocks.downloadBranchZip.mockResolvedValue(buildZip('code-addiction-main'));

    await update(tmpDir);

    // Should always download, even if version matches, because branches can have new commits
    expect(mocks.downloadBranchZip).toHaveBeenCalledTimes(1);
  });
});
