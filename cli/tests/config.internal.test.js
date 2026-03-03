import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { config } from '../src/config.js';

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

describe('config internal functions', () => {
  it('handles manifest with undefined fields', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: undefined,
        releaseTag: undefined,
        installedAt: undefined,
        providers: undefined,
        files: undefined,
        hashes: undefined,
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

  it('handles very long providers list', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: ['claude', 'kilocode', 'codex', 'opencode', 'gemini', 'grok', 'llama'],
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

  it('handles ISO date string correctly', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: '2024-12-25T10:30:00.000Z',
        providers: ['claude'],
        files: ['.add/test.md'],
        hashes: { '.add/test.md': 'hash123' },
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

  it('handles partial hashes object', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files: ['.add/file1.txt', '.add/file2.txt'],
        hashes: {
          '.add/file1.txt': 'hash1',
          // file2.txt intentionally missing from hashes
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

  it('handles whitespace-only providers array', async () => {
    const addDir = path.join(tmpDir, '.add');
    fs.mkdirSync(addDir);
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: [],
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
});
