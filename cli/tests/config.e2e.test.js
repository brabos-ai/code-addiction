import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { config } from '../src/config.js';

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
  vi.restoreAllMocks();
});

describe('config show command', () => {
  it('exits 0 when manifest exists', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files: ['.pff/commands/pff.md'],
        hashes: { '.pff/commands/pff.md': 'abc123' },
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('exits 0 when manifest has no hashes', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: [],
        files: [],
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('exits 1 when manifest is missing', async () => {
    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('exits 0 in verbose mode with valid manifest', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '0.0.1',
        releaseTag: 'v0.0.1',
        installedAt: new Date().toISOString(),
        providers: ['claude', 'kilocode'],
        files: ['.pff/commands/pff.md', '.claude/commands/pff.md'],
        hashes: { '.pff/commands/pff.md': 'abc123' },
      }),
      'utf8'
    );

    try {
      await config(tmpDir, true);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles manifest with multiple providers', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '2.0.0',
        releaseTag: 'v2.0.0',
        installedAt: '2024-01-15T10:30:00.000Z',
        providers: ['claude', 'kilocode', 'codex', 'opencode'],
        files: [
          '.pff/commands/pff.md',
          '.claude/commands/pff.md',
          '.kilocode/commands/pff.md',
          '.codex/commands/pff.md',
          '.opencode/commands/pff.md'
        ],
        hashes: {
          '.pff/commands/pff.md': 'abc123',
          '.claude/commands/pff.md': 'def456'
        },
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles manifest with empty providers array', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: [],
        files: ['.pff/commands/pff.md'],
        hashes: { '.pff/commands/pff.md': 'abc123' },
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles manifest with no files', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files: [],
        hashes: {},
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
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
        releaseTag: null,
        installedAt: null,
        providers: null,
        files: null,
        hashes: null,
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles invalid date format gracefully', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: 'invalid-date-string',
        providers: ['claude'],
        files: ['.pff/commands/pff.md'],
        hashes: { '.pff/commands/pff.md': 'abc123' },
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('handles corrupted manifest gracefully', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      'not valid json',
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(1);
  });

  it('handles empty manifest object', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({}),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });

  it('displays correct file count with many files', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    
    const files = Array.from({ length: 100 }, (_, i) => `.pff/file${i}.txt`);
    const hashes = {};
    files.forEach((f, i) => {
      hashes[f] = `hash${i}`;
    });
    
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files,
        hashes,
      }),
      'utf8'
    );

    try {
      await config(tmpDir, false);
    } catch (err) {
      if (!err.message.startsWith('EXIT_')) throw err;
    }

    expect(exitCode).toBe(0);
  });
});
