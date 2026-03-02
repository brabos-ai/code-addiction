import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fixLineEndings, writeManifest } from '../src/installer.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fnd-test-'));
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
  it('creates .fnd/manifest.json with correct structure', () => {
    fs.mkdirSync(path.join(tmpDir, '.fnd'));

    writeManifest(tmpDir, 'v2.0.1', ['claude', 'kilocode'], [
      '.fnd/commands/fnd.md',
      '.claude/commands/fnd.md',
    ]);

    const manifestPath = path.join(tmpDir, '.fnd', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.version).toBe('2.0.1');
    expect(manifest.providers).toEqual(['claude', 'kilocode']);
    expect(manifest.files).toContain('.fnd/commands/fnd.md');
    expect(manifest.installedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('strips leading v from version', () => {
    fs.mkdirSync(path.join(tmpDir, '.fnd'));
    writeManifest(tmpDir, 'v1.0.0', [], []);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.fnd', 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('1.0.0');
  });

  it('overwrites existing manifest', () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);

    writeManifest(tmpDir, 'v1.0.0', ['claude'], ['.fnd/commands/fnd.md']);
    writeManifest(tmpDir, 'v2.0.0', ['codex'], ['.agent/workflows/fnd.md']);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(fndDir, 'manifest.json'), 'utf8')
    );
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.providers).toEqual(['codex']);
  });

  it('creates manifest with releaseTag', () => {
    fs.mkdirSync(path.join(tmpDir, '.fnd'));

    writeManifest(tmpDir, 'v2.0.1', ['claude'], [
      '.fnd/commands/fnd.md',
    ], 'v2.0.1');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.fnd', 'manifest.json'), 'utf8')
    );
    expect(manifest.releaseTag).toBe('v2.0.1');
  });

  it('calculates SHA-256 hashes for all files', () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const content1 = 'test content 1';
    const content2 = 'test content 2';
    fs.writeFileSync(path.join(tmpDir, '.fnd', 'file1.txt'), content1, 'utf8');
    fs.writeFileSync(path.join(tmpDir, '.fnd', 'file2.txt'), content2, 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], [
      '.fnd/file1.txt',
      '.fnd/file2.txt',
    ], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(fndDir, 'manifest.json'), 'utf8')
    );
    
    expect(manifest.hashes).toBeDefined();
    expect(manifest.hashes['.fnd/file1.txt']).toBe(
      crypto.createHash('sha256').update(content1).digest('hex')
    );
    expect(manifest.hashes['.fnd/file2.txt']).toBe(
      crypto.createHash('sha256').update(content2).digest('hex')
    );
  });

  it('handles missing files gracefully (no hash entry)', () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    fs.writeFileSync(path.join(tmpDir, '.fnd', 'exists.txt'), 'content', 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], [
      '.fnd/exists.txt',
      '.fnd/missing.txt',
    ], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(fndDir, 'manifest.json'), 'utf8')
    );
    
    expect(manifest.hashes['.fnd/exists.txt']).toBeDefined();
    expect(manifest.hashes['.fnd/missing.txt']).toBeUndefined();
  });

  it('calculates correct hash for binary files', () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF]);
    fs.writeFileSync(path.join(tmpDir, '.fnd', 'binary.dat'), binaryContent);

    writeManifest(tmpDir, 'v1.0.0', [], ['.fnd/binary.dat'], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(fndDir, 'manifest.json'), 'utf8')
    );
    
    expect(manifest.hashes['.fnd/binary.dat']).toBe(
      crypto.createHash('sha256').update(binaryContent).digest('hex')
    );
  });

  it('calculates correct hash for large files', () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const largeContent = 'x'.repeat(100000);
    fs.writeFileSync(path.join(tmpDir, '.fnd', 'large.txt'), largeContent, 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], ['.fnd/large.txt'], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(fndDir, 'manifest.json'), 'utf8')
    );
    
    expect(manifest.hashes['.fnd/large.txt']).toBe(
      crypto.createHash('sha256').update(largeContent).digest('hex')
    );
  });

  it('handles empty files array', () => {
    fs.mkdirSync(path.join(tmpDir, '.fnd'));

    writeManifest(tmpDir, 'v1.0.0', [], [], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.fnd', 'manifest.json'), 'utf8')
    );
    
    expect(manifest.hashes).toEqual({});
    expect(manifest.files).toEqual([]);
  });

  it('uses version as fallback when releaseTag not provided', () => {
    fs.mkdirSync(path.join(tmpDir, '.fnd'));

    writeManifest(tmpDir, 'v2.0.0', [], []);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.fnd', 'manifest.json'), 'utf8')
    );
    
    expect(manifest.releaseTag).toBe('v2.0.0');
    expect(manifest.version).toBe('2.0.0');
  });

  it('handles files in nested directories', () => {
    const fndDir = path.join(tmpDir, '.fnd');
    const nestedDir = path.join(fndDir, 'commands', 'deep');
    fs.mkdirSync(nestedDir, { recursive: true });
    
    const content = 'nested content';
    fs.writeFileSync(path.join(nestedDir, 'file.txt'), content, 'utf8');

    writeManifest(tmpDir, 'v1.0.0', [], ['.fnd/commands/deep/file.txt'], 'v1.0.0');

    const manifest = JSON.parse(
      fs.readFileSync(path.join(fndDir, 'manifest.json'), 'utf8')
    );
    
    expect(manifest.hashes['.fnd/commands/deep/file.txt']).toBe(
      crypto.createHash('sha256').update(content).digest('hex')
    );
  });
});
