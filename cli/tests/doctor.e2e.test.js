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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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

  it('exits 1 when .pff/ is missing', async () => {
    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 1 when manifest is missing', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 1 when manifest is corrupted', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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

  it('exits 1 when .pff/ is empty', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('detects Node.js version correctly', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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

  it('handles partial .pff directory (exists but empty)', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles .pff directory with subdirectories but no files', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.mkdirSync(path.join(pffDir, 'commands'));
    fs.mkdirSync(path.join(pffDir, 'scripts'));

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles valid manifest with multiple providers', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '2.0.0',
        providers: ['claude', 'kilocode', 'codex'],
        files: ['.pff/commands/pff.md', '.claude/commands/pff.md'],
        hashes: {
          '.pff/commands/pff.md': 'abc123',
          '.claude/commands/pff.md': 'def456'
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
  it('detects missing .pff directory', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    expect(fs.existsSync(pffDir)).toBe(false);

    try {
      await doctor(tmpDir);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('detects corrupted JSON in manifest', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
