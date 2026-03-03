import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readManifest } from '../src/uninstaller.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-test-'));
  fs.mkdirSync(path.join(tmpDir, '.add'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readManifest', () => {
  it('returns null when manifest does not exist', () => {
    expect(readManifest(path.join(tmpDir, 'empty'))).toBeNull();
  });

  it('parses a valid manifest', () => {
    const manifest = {
      version: '2.0.1',
      installedAt: '2026-03-01T00:00:00Z',
      providers: ['claude'],
      files: ['.add/commands/add.md'],
    };
    fs.writeFileSync(
      path.join(tmpDir, '.add', 'manifest.json'),
      JSON.stringify(manifest),
      'utf8'
    );

    const result = readManifest(tmpDir);
    expect(result).toMatchObject({
      version: '2.0.1',
      providers: ['claude'],
      files: ['.add/commands/add.md'],
    });
    expect(result.corrupted).toBeUndefined();
  });

  it('returns corrupted=true for invalid JSON', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.add', 'manifest.json'),
      'not valid json{{{',
      'utf8'
    );

    const result = readManifest(tmpDir);
    expect(result).not.toBeNull();
    expect(result.corrupted).toBe(true);
    expect(result.files).toEqual([]);
  });
});

describe('uninstall', () => {
  it('throws if manifest does not exist', async () => {
    // Mock prompt to avoid interactive input
    vi.mock('../src/prompt.js', () => ({
      promptConfirm: vi.fn().mockResolvedValue(undefined),
    }));

    const { uninstall } = await import('../src/uninstaller.js');
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-empty-'));

    try {
      await expect(uninstall(emptyDir, true)).rejects.toThrow(
        'No ADD installation found'
      );
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('removes files listed in manifest (--force)', async () => {
    vi.mock('../src/prompt.js', () => ({
      promptConfirm: vi.fn().mockResolvedValue(undefined),
    }));
    vi.mock('@clack/prompts', () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
      log: { info: vi.fn(), warn: vi.fn(), success: vi.fn() },
    }));

    // Create fake ADD files
    const addDir = path.join(tmpDir, '.add');
    const commandsDir = path.join(addDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    fs.writeFileSync(path.join(commandsDir, 'add.md'), '# add');

    const manifest = {
      version: '2.0.1',
      installedAt: '2026-03-01T00:00:00Z',
      providers: ['claude'],
      files: ['.add/commands/add.md'],
    };
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify(manifest),
      'utf8'
    );

    const { uninstall } = await import('../src/uninstaller.js');
    await uninstall(tmpDir, true);

    expect(fs.existsSync(path.join(commandsDir, 'add.md'))).toBe(false);
    expect(fs.existsSync(path.join(addDir, 'manifest.json'))).toBe(false);
  });
});
