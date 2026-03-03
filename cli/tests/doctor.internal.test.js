import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { doctor } from '../src/doctor.js';

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
});

describe('doctor internal functions', () => {
  it('handles .add with only subdirectories', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.mkdirSync(path.join(addDir, 'commands'));
    fs.mkdirSync(path.join(addDir, 'scripts'));
    fs.mkdirSync(path.join(addDir, 'skills'));

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles manifest.json that is valid JSON but not object', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      '"just a string"',
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0); // Valid JSON, just unusual
  });

  it('handles manifest.json as array', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      '[1, 2, 3]',
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0); // Valid JSON
  });

  it('handles manifest.json with very long content', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    
    const longManifest = {
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      providers: Array(50).fill('claude'),
      files: Array(200).fill('.add/commands/add.md'),
      hashes: {}
    };
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify(longManifest),
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles manifest with unicode content', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0 🎉',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files: ['.add/commands/日本語.md'],
      }),
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles .add directory with hidden files only', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(path.join(addDir, '.hidden'), 'hidden', 'utf8');

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1); // Still needs manifest.json
  });

  it('handles deeply nested .add structure', async () => {
    const addDir = path.join(tmpDir, '.add');
    const deepDir = path.join(addDir, 'level1', 'level2', 'level3', 'level4');
    fs.mkdirSync(deepDir, { recursive: true });
    fs.writeFileSync(path.join(deepDir, 'deep.txt'), 'deep content', 'utf8');
    
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        installedAt: new Date().toISOString(),
        providers: [],
        files: ['.add/level1/level2/level3/level4/deep.txt'],
      }),
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });
});
