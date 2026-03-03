import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
});

describe('config internal functions', () => {
  it('handles manifest with undefined fields', async () => {
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: '2024-12-25T10:30:00.000Z',
        providers: ['claude'],
        files: ['.pff/test.md'],
        hashes: { '.pff/test.md': 'hash123' },
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
    const pffDir = path.join(tmpDir, '.pff');
    fs.mkdirSync(pffDir);
    fs.writeFileSync(
      path.join(pffDir, 'manifest.json'),
      JSON.stringify({
        version: '1.0.0',
        releaseTag: 'v1.0.0',
        installedAt: new Date().toISOString(),
        providers: ['claude'],
        files: ['.pff/file1.txt', '.pff/file2.txt'],
        hashes: {
          '.pff/file1.txt': 'hash1',
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
