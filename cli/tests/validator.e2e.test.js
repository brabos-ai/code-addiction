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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fnd-test-'));
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const content = 'test content';
    fs.writeFileSync(path.join(fndDir, 'test.txt'), content, 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/test.txt'],
        hashes: { '.fnd/test.txt': calculateHash(content) },
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/missing.txt'],
        hashes: { '.fnd/missing.txt': 'abc123' },
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const originalContent = 'original';
    fs.writeFileSync(path.join(fndDir, 'test.txt'), 'modified', 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/test.txt'],
        hashes: { '.fnd/test.txt': calculateHash(originalContent) },
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    fs.mkdirSync(path.join(fndDir, 'commands'));
    
    // File 1: OK
    const content1 = 'valid content';
    fs.writeFileSync(path.join(fndDir, 'ok.txt'), content1, 'utf8');
    
    // File 2: Missing (not created)
    
    // File 3: Modified
    fs.writeFileSync(path.join(fndDir, 'commands', 'modified.txt'), 'wrong content', 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/ok.txt', '.fnd/missing.txt', '.fnd/commands/modified.txt'],
        hashes: {
          '.fnd/ok.txt': calculateHash(content1),
          '.fnd/missing.txt': calculateHash('missing'),
          '.fnd/commands/modified.txt': calculateHash('correct content')
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE]);
    fs.writeFileSync(path.join(fndDir, 'binary.dat'), binaryContent);
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/binary.dat'],
        hashes: { '.fnd/binary.dat': calculateHash(binaryContent) },
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
    const fndDir = path.join(tmpDir, '.fnd');
    const deepDir = path.join(fndDir, 'commands', 'deep', 'nested');
    fs.mkdirSync(deepDir, { recursive: true });
    
    const content = 'deep content';
    fs.writeFileSync(path.join(deepDir, 'file.txt'), content, 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/commands/deep/nested/file.txt'],
        hashes: { '.fnd/commands/deep/nested/file.txt': calculateHash(content) },
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    fs.writeFileSync(path.join(fndDir, 'test.txt'), 'modified', 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        providers: [],
        files: ['.fnd/test.txt'],
        hashes: { '.fnd/test.txt': calculateHash('original') },
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const content = 'special content';
    fs.writeFileSync(path.join(fndDir, 'file-with-dashes.txt'), content, 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/file-with-dashes.txt'],
        hashes: { '.fnd/file-with-dashes.txt': calculateHash(content) },
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const largeContent = 'x'.repeat(100000);
    fs.writeFileSync(path.join(fndDir, 'large.txt'), largeContent, 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        providers: [],
        files: ['.fnd/large.txt'],
        hashes: { '.fnd/large.txt': calculateHash(largeContent) },
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
