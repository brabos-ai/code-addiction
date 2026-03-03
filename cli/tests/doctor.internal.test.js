import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { doctor } from '../src/doctor.js';

let tmpDir;
let originalExit;
let exitCode;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pff-test-'));
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
  it('handles .pff with only subdirectories', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.mkdirSync(path.join(pffDir, 'commands'));
    fs.mkdirSync(path.join(pffDir, 'scripts'));
    fs.mkdirSync(path.join(pffDir, 'skills'));

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles manifest.json that is valid JSON but not object', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    
    const longManifest = {
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      providers: Array(50).fill('claude'),
      files: Array(200).fill('.pff/commands/pff.md'),
      hashes: {}
    };
    
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0 🎉',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files: ['.pff/commands/日本語.md'],
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

  it('handles .pff directory with hidden files only', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(path.join(pffDir, '.hidden'), 'hidden', 'utf8');

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1); // Still needs manifest.json
  });

  it('handles deeply nested .pff structure', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    const deepDir = path.join(pffDir, 'level1', 'level2', 'level3', 'level4');
    fs.mkdirSync(deepDir, { recursive: true });
    fs.writeFileSync(path.join(deepDir, 'deep.txt'), 'deep content', 'utf8');
    
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        installedAt: new Date().toISOString(),
        providers: [],
        files: ['.pff/level1/level2/level3/level4/deep.txt'],
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
