import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  downloadReleaseAsset: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
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
  mocks.downloadReleaseAsset.mockReset();
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
});
