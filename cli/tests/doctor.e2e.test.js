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

  // Mock process.exit
  process.exit = (code) => {
    exitCode = code;
    throw new Error(`EXIT_${code}`);
  };
});

afterEach(() => {
  process.exit = originalExit;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('doctor command', () => {
  it('exits 0 when all checks pass', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({ version: '1.0.0', providers: [], files: [] }),
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('exits 1 when .add/ is missing', async () => {
    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 1 when manifest is missing', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 1 when manifest is corrupted', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      'not valid json',
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 1 when .add/ is empty', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('detects Node.js version correctly', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({ version: '1.0.0', providers: [], files: [] }),
      'utf8'
    );

    const majorVersion = parseInt(process.version.slice(1).split('.')[0], 10);
    expect(majorVersion).toBeGreaterThanOrEqual(18);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles partial .add directory (exists but empty)', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles .add directory with subdirectories but no files', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.mkdirSync(path.join(addDir, 'commands'));
    fs.mkdirSync(path.join(addDir, 'scripts'));

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles valid manifest with multiple providers', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '2.0.0',
        providers: ['claude', 'kilocode', 'codex'],
        files: ['.add/commands/add.md', '.claude/commands/add.md'],
        hashes: {
          '.add/commands/add.md': 'abc123',
          '.claude/commands/add.md': 'def456'
        }
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

describe('doctor edge cases', () => {
  it('detects missing .add directory', async () => {
    const addDir = path.join(tmpDir, '.add');
    expect(fs.existsSync(addDir)).toBe(false);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('detects corrupted JSON in manifest', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      '{ "version": "broken", "files": [}',
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles manifest with only whitespace', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      '   \n\n   ',
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles manifest with empty object', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      '{}',
      'utf8'
    );

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles manifest with null values', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: null,
        providers: null,
        files: null
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
