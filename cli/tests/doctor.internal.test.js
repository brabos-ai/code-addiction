import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { doctor } from '../src/doctor.js';

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
});

describe('doctor internal functions', () => {
  it('handles .fnd with only subdirectories', async () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    fs.mkdirSync(path.join(fndDir, 'commands'));
    fs.mkdirSync(path.join(fndDir, 'scripts'));
    fs.mkdirSync(path.join(fndDir, 'skills'));

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles manifest.json that is valid JSON but not object', async () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    
    const longManifest = {
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      providers: Array(50).fill('claude'),
      files: Array(200).fill('.fnd/commands/fnd.md'),
      hashes: {}
    };
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
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
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0 🎉',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files: ['.fnd/commands/日本語.md'],
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

  it('handles .fnd directory with hidden files only', async () => {
    const fndDir = path.join(tmpDir, '.fnd');
    fs.mkdirSync(fndDir);
    fs.writeFileSync(path.join(fndDir, '.hidden'), 'hidden', 'utf8');

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1); // Still needs manifest.json
  });

  it('handles deeply nested .fnd structure', async () => {
    const fndDir = path.join(tmpDir, '.fnd');
    const deepDir = path.join(fndDir, 'level1', 'level2', 'level3', 'level4');
    fs.mkdirSync(deepDir, { recursive: true });
    fs.writeFileSync(path.join(deepDir, 'deep.txt'), 'deep content', 'utf8');
    
    fs.writeFileSync(
      path.join(fndDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        installedAt: new Date().toISOString(),
        providers: [],
        files: ['.fnd/level1/level2/level3/level4/deep.txt'],
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
