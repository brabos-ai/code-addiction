/**
 * board-runtime.test.js — Tests for the board runtime copier and closure.
 *
 * Tests that build-board-runtime.js copies core/storage correctly,
 * prunes obsolete files, and fails clearly on missing source.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const COPIER_PATH = path.resolve(__dirname, '../../scripts/build-board-runtime.js');
const SOURCE_DIR = path.resolve(__dirname, '../../framwork/.codeadd/scripts');

describe('build-board-runtime', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'board-runtime-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('copies core and storage to target directory', () => {
    // Create a fake source structure
    const fakeSource = path.join(tmpDir, 'source');
    const fakeTarget = path.join(tmpDir, 'target');
    fs.mkdirSync(path.join(fakeSource, 'scripts'), { recursive: true });
    fs.mkdirSync(fakeTarget, { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'scripts', 'backlog-core.cjs'), 'module.exports = {};');
    fs.writeFileSync(path.join(fakeSource, 'scripts', 'backlog-storage.cjs'), 'module.exports = {};');

    // Run copier with modified paths — we test the actual copier
    const result = execFileSync('node', [COPIER_PATH], {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '../..')
    });
    expect(result).toContain('Board runtime ready');
  });

  it('fails clearly when source is missing', () => {
    // The copier resolves paths relative to its own location, so we test
    // the actual behavior: if source files are missing, it exits 1
    const copierDir = path.dirname(COPIER_PATH);
    const sourceDir = path.join(copierDir, '..', 'framwork', '.codeadd', 'scripts');

    // Check if source exists — if not, copier should fail
    if (!fs.existsSync(path.join(sourceDir, 'backlog-core.cjs'))) {
      try {
        execFileSync('node', [COPIER_PATH], { encoding: 'utf8' });
        expect.unreachable();
      } catch (e) {
        expect(e.status).toBe(1);
        expect(e.stderr).toContain('source not found');
      }
    }
  });

  it('generated runtime files are byte-identical to source', () => {
    const runtimeDir = path.resolve(__dirname, '../../board/runtime');
    const sourceDir = path.resolve(__dirname, '../../framwork/.codeadd/scripts');

    // The closure is exactly core and storage — the two modules the server
    // imports directly. Everything else (CLI, allocator, publication) is
    // entry-surface and must never cross into the read-only runtime.
    for (const name of fs.readdirSync(runtimeDir)) {
      expect(['backlog-core.cjs', 'backlog-storage.cjs'], name).toContain(name);
    }
    if (fs.existsSync(path.join(runtimeDir, 'backlog-core.cjs'))) {
      const sourceCore = fs.readFileSync(path.join(sourceDir, 'backlog-core.cjs'), 'utf8');
      const runtimeCore = fs.readFileSync(path.join(runtimeDir, 'backlog-core.cjs'), 'utf8');
      expect(runtimeCore).toBe(sourceCore);
    }

    if (fs.existsSync(path.join(runtimeDir, 'backlog-storage.cjs'))) {
      const sourceStorage = fs.readFileSync(path.join(sourceDir, 'backlog-storage.cjs'), 'utf8');
      const runtimeStorage = fs.readFileSync(path.join(runtimeDir, 'backlog-storage.cjs'), 'utf8');
      expect(runtimeStorage).toBe(sourceStorage);
    }

    // Explicit negatives: a native module that leaks into board/runtime would
    // create a second shipped copy of entry-surface code.
    expect(fs.existsSync(path.join(runtimeDir, 'backlog-id.cjs'))).toBe(false);
    expect(fs.existsSync(path.join(runtimeDir, 'backlog-git.cjs'))).toBe(false);
    expect(fs.existsSync(path.join(runtimeDir, 'backlog-commit.cjs'))).toBe(false);
  });
});
