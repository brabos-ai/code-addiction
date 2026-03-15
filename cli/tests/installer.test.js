import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {
  fixLineEndings,
  writeManifest,
  resolveInstallSource,
} from '../src/installer.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('fixLineEndings', () => {
  it('converts CRLF to LF in .sh files', () => {
    const scriptsDir = path.join(tmpDir, 'scripts');
    fs.mkdirSync(scriptsDir);
    const file = path.join(scriptsDir, 'test.sh');
    fs.writeFileSync(file, 'echo hello\r\necho world\r\n', 'utf8');

    fixLineEndings(scriptsDir);

    const result = fs.readFileSync(file, 'utf8');
    expect(result).toBe('echo hello\necho world\n');
    expect(result).not.toContain('\r\n');
  });

  it('leaves LF-only files unchanged', () => {
    const scriptsDir = path.join(tmpDir, 'scripts');
    fs.mkdirSync(scriptsDir);
    const file = path.join(scriptsDir, 'test.sh');
    const original = 'echo hello\necho world\n';
    fs.writeFileSync(file, original, 'utf8');

    fixLineEndings(scriptsDir);

    expect(fs.readFileSync(file, 'utf8')).toBe(original);
  });

  it('does not touch non-.sh files', () => {
    const dir = path.join(tmpDir, 'scripts');
    fs.mkdirSync(dir);
    const mdFile = path.join(dir, 'README.md');
    const original = 'hello\r\nworld\r\n';
    fs.writeFileSync(mdFile, original, 'utf8');

    fixLineEndings(dir);

    expect(fs.readFileSync(mdFile, 'utf8')).toBe(original);
  });

  it('processes .sh files recursively in subdirectories', () => {
    const subDir = path.join(tmpDir, 'scripts', 'sub');
    fs.mkdirSync(subDir, { recursive: true });
    const file = path.join(subDir, 'deep.sh');
    fs.writeFileSync(file, 'cmd\r\n', 'utf8');

    fixLineEndings(path.join(tmpDir, 'scripts'));

    expect(fs.readFileSync(file, 'utf8')).toBe('cmd\n');
  });

  it('is a no-op if directory does not exist', () => {
    expect(() => fixLineEndings(path.join(tmpDir, 'nonexistent'))).not.toThrow();
  });
});

describe('writeManifest', () => {
  it('creates .codeadd/manifest.json with correct structure', () => {
    fs.mkdirSync(path.join(tmpDir, '.codeadd'));

    writeManifest(tmpDir, 'v2.0.1', ['claude', 'kilocode'], [
      '.claude/commands/add.md',
    ]);

    const manifestPath = path.join(tmpDir, '.codeadd', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.version).toBe('2.0.1');
    expect(manifest.providers).toEqual(['claude', 'kilocode']);
    expect(manifest.files).toContain('.claude/commands/add.md');
    expect(manifest.installedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('strips leading v from version', () => {
    fs.mkdirSync(path.join(tmpDir, '.codeadd'));
    writeManifest(tmpDir, 'v1.0.0', [], []);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('1.0.0');
  });

  it('overwrites existing manifest', () => {
    const addDir = path.join(tmpDir, '.codeadd');
    fs.mkdirSync(addDir);

    writeManifest(tmpDir, 'v1.0.0', ['claude'], ['.claude/commands/add.md']);
    writeManifest(tmpDir, 'v2.0.0', ['codex'], ['.agent/workflows/add.md']);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(addDir, 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.providers).toEqual(['codex']);
  });

  it('creates manifest with releaseTag', () => {
    fs.mkdirSync(path.join(tmpDir, '.codeadd'));

    writeManifest(tmpDir, 'v2.0.1', ['claude'], [
      '.claude/commands/add.md',
    ], 'v2.0.1');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );
    expect(manifest.releaseTag).toBe('v2.0.1');
  });

  it('calculates SHA-256 hashes for all files', () => {
    const addDir = path.join(tmpDir, '.codeadd');
    fs.mkdirSync(addDir);

    const content1 = 'test content 1';
    const content2 = 'test content 2';
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'file1.txt'), content1, 'utf8');
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'file2.txt'), content2, 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], [
      '.codeadd/file1.txt',
      '.codeadd/file2.txt',
    ], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(addDir, 'manifest.json'), 'utf8')
    );

    expect(manifest.hashes).toBeDefined();
    expect(manifest.hashes['.codeadd/file1.txt']).toBe(
      crypto.createHash('sha256').update(content1).digest('hex')
    );
    expect(manifest.hashes['.codeadd/file2.txt']).toBe(
      crypto.createHash('sha256').update(content2).digest('hex')
    );
  });

  it('handles missing files gracefully (no hash entry)', () => {
    const addDir = path.join(tmpDir, '.codeadd');
    fs.mkdirSync(addDir);

    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'exists.txt'), 'content', 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], [
      '.codeadd/exists.txt',
      '.codeadd/missing.txt',
    ], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(addDir, 'manifest.json'), 'utf8')
    );

    expect(manifest.hashes['.codeadd/exists.txt']).toBeDefined();
    expect(manifest.hashes['.codeadd/missing.txt']).toBeUndefined();
  });

  it('calculates correct hash for binary files', () => {
    const addDir = path.join(tmpDir, '.codeadd');
    fs.mkdirSync(addDir);

    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF]);
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'binary.dat'), binaryContent);

    writeManifest(tmpDir, 'v1.0.0', [], ['.codeadd/binary.dat'], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(addDir, 'manifest.json'), 'utf8')
    );

    expect(manifest.hashes['.codeadd/binary.dat']).toBe(
      crypto.createHash('sha256').update(binaryContent).digest('hex')
    );
  });

  it('calculates correct hash for large files', () => {
    const addDir = path.join(tmpDir, '.codeadd');
    fs.mkdirSync(addDir);

    const largeContent = 'x'.repeat(100000);
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'large.txt'), largeContent, 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], ['.codeadd/large.txt'], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(addDir, 'manifest.json'), 'utf8')
    );

    expect(manifest.hashes['.codeadd/large.txt']).toBe(
      crypto.createHash('sha256').update(largeContent).digest('hex')
    );
  });

  it('handles empty files array', () => {
    fs.mkdirSync(path.join(tmpDir, '.codeadd'));

    writeManifest(tmpDir, 'v1.0.0', [], [], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );

    expect(manifest.hashes).toEqual({});
    expect(manifest.files).toEqual([]);
  });

  it('uses version as fallback when releaseTag not provided', () => {
    fs.mkdirSync(path.join(tmpDir, '.codeadd'));

    writeManifest(tmpDir, 'v2.0.0', [], []);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')
    );

    expect(manifest.releaseTag).toBe('v2.0.0');
    expect(manifest.version).toBe('2.0.0');
  });

  it('handles files in nested directories', () => {
    const addDir = path.join(tmpDir, '.codeadd');
    const nestedDir = path.join(addDir, 'scripts', 'deep');
    fs.mkdirSync(nestedDir, { recursive: true });

    const content = 'nested content';
    fs.writeFileSync(path.join(nestedDir, 'file.sh'), content, 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], ['.codeadd/scripts/deep/file.sh'], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(addDir, 'manifest.json'), 'utf8')
    );

    expect(manifest.hashes['.codeadd/scripts/deep/file.sh']).toBe(
      crypto.createHash('sha256').update(content).digest('hex')
    );
  });
});

describe('resolveInstallSource', () => {
  it('uses latest release when version is not provided', async () => {
    const latestTagResolver = async () => 'v9.9.9';

    const source = await resolveInstallSource(undefined, latestTagResolver);

    expect(source).toEqual({
      source: 'release',
      manifestVersion: 'v9.9.9',
      releaseTag: 'v9.9.9',
      ref: null,
      downloadValue: 'v9.9.9',
    });
  });

  it('throws when repository has no releases', async () => {
    const latestTagResolver = async () => {
      throw new Error('Repository brabos-ai/code-addiction not found or has no releases.');
    };

    await expect(resolveInstallSource(undefined, latestTagResolver)).rejects.toThrow(
      'not found or has no releases'
    );
  });

  it('rethrows unexpected errors from latest tag resolver', async () => {
    const latestTagResolver = async () => {
      throw new Error('GitHub API error: 500 Internal Server Error');
    };

    await expect(resolveInstallSource(undefined, latestTagResolver)).rejects.toThrow(
      'GitHub API error: 500'
    );
  });

  it('normalizes explicit tag when version does not start with v', async () => {
    const source = await resolveInstallSource('2.3.4');

    expect(source).toEqual({
      source: 'tag',
      manifestVersion: 'v2.3.4',
      releaseTag: 'v2.3.4',
      ref: null,
      downloadValue: 'v2.3.4',
    });
  });

  it('uses explicit version tag as-is when prefixed with v', async () => {
    const source = await resolveInstallSource('v2.3.4');

    expect(source).toEqual({
      source: 'tag',
      manifestVersion: 'v2.3.4',
      releaseTag: 'v2.3.4',
      ref: null,
      downloadValue: 'v2.3.4',
    });
  });
});
