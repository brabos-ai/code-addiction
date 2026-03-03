import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { validate } from '../src/validator.js';

let tmpDir;
let originalExit;
let exitCode;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-test-'));
  originalExit = process.exit;
  exitCode = null;
  process.exit = (code) => {
    exitCode = code;
    throw new Error(`EXIT_${code}`);
  };
});

afterEach(() => {
  process.exit = originalExit;
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

describe('validate command', () => {
  it('exits 0 when all files are valid', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    const content = 'test content';
    fs.writeFileSync(path.join(addDir, 'test.txt'), content, 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/test.txt'],
        hashes: { '.add/test.txt': calculateHash(content) },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('exits 1 when file is missing', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/missing.txt'],
        hashes: { '.add/missing.txt': 'abc123' },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 1 when file is modified', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    const originalContent = 'original';
    fs.writeFileSync(path.join(addDir, 'test.txt'), 'modified', 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/test.txt'],
        hashes: { '.add/test.txt': calculateHash(originalContent) },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 0 when manifest has no hashes (backward compat)', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        providers: [],
        files: [],
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('exits 1 when manifest is missing', async () => {
    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles multiple files with mixed status', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.mkdirSync(path.join(addDir, 'commands'));
    
    // File 1: OK
    const content1 = 'valid content';
    fs.writeFileSync(path.join(addDir, 'ok.txt'), content1, 'utf8');
    
    // File 2: Missing (not created)
    
    // File 3: Modified
    fs.writeFileSync(path.join(addDir, 'commands', 'modified.txt'), 'wrong content', 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/ok.txt', '.add/missing.txt', '.add/commands/modified.txt'],
        hashes: {
          '.add/ok.txt': calculateHash(content1),
          '.add/missing.txt': calculateHash('missing'),
          '.add/commands/modified.txt': calculateHash('correct content')
        },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles empty hashes object', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: [],
        hashes: {},
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles binary files correctly', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE]);
    fs.writeFileSync(path.join(addDir, 'binary.dat'), binaryContent);
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/binary.dat'],
        hashes: { '.add/binary.dat': calculateHash(binaryContent) },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles files in nested directories', async () => {
    const addDir = path.join(tmpDir, '.add');
    const deepDir = path.join(addDir, 'commands', 'deep', 'nested');
    fs.mkdirSync(deepDir, { recursive: true });
    
    const content = 'deep content';
    fs.writeFileSync(path.join(deepDir, 'file.txt'), content, 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/commands/deep/nested/file.txt'],
        hashes: { '.add/commands/deep/nested/file.txt': calculateHash(content) },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles repair mode without releaseTag', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(path.join(addDir, 'test.txt'), 'modified', 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        providers: [],
        files: ['.add/test.txt'],
        hashes: { '.add/test.txt': calculateHash('original') },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, true);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles files with special characters in paths', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    const content = 'special content';
    fs.writeFileSync(path.join(addDir, 'file-with-dashes.txt'), content, 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/file-with-dashes.txt'],
        hashes: { '.add/file-with-dashes.txt': calculateHash(content) },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles large files correctly', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    const largeContent = 'x'.repeat(100000);
    fs.writeFileSync(path.join(addDir, 'large.txt'), largeContent, 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.add/large.txt'],
        hashes: { '.add/large.txt': calculateHash(largeContent) },
      }),
      'utf8'
    );

    try {
      await validate(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });
});
