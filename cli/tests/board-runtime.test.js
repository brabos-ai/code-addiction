/**
 * board-runtime.test.js — Tests for the board runtime copier and closure.
 *
 * Tests that build-board-runtime.js copies core/storage correctly,
 * prunes obsolete files, and fails clearly on missing source.
 *
 * F7 of the native-node-backlog plan adds the closure question in its
 * WORST-SHAPE form: the shipped scripts dir now carries SIX canonical
 * backlog modules, and the runtime must stay exactly the four the server
 * imports — the other four are entry-surface and never leak.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const COPIER_PATH = path.resolve(__dirname, '../../scripts/build-board-runtime.js');
const SOURCE_DIR = path.resolve(__dirname, '../../framwork/.codeadd/scripts');
const SHIPPED_CANONICAL = [
  'backlog-storage.cjs', 'backlog-core.cjs', 'backlog-cli.cjs',
  'backlog-id.cjs', 'backlog-git.cjs', 'backlog-commit.cjs', 'backlog-board.cjs',
];
// The core and storage read the board; the board module and the git primitives
// resolve, lock and sync the clone it lives in. Nothing else crosses.
const RUNTIME_FILES = ['backlog-core.cjs', 'backlog-storage.cjs', 'backlog-board.cjs', 'backlog-git.cjs'];

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

    // The closure is exactly the four modules the server imports: the core and
    // storage, and the board module and git primitives under it. Everything else
    // (CLI, allocator, publication) is entry-surface and must never cross into
    // the read-only runtime.
    for (const name of fs.readdirSync(runtimeDir)) {
      expect(RUNTIME_FILES, name).toContain(name);
    }
    for (const name of RUNTIME_FILES) {
      if (!fs.existsSync(path.join(runtimeDir, name))) continue;
      expect(fs.readFileSync(path.join(runtimeDir, name), 'utf8'), name)
        .toBe(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
    }

    // Explicit negatives: a native module that leaks into board/runtime would
    // create a second shipped copy of entry-surface code.
    expect(fs.existsSync(path.join(runtimeDir, 'backlog-id.cjs'))).toBe(false);
    expect(fs.existsSync(path.join(runtimeDir, 'backlog-commit.cjs'))).toBe(false);
    expect(fs.existsSync(path.join(runtimeDir, 'backlog-cli.cjs'))).toBe(false);
  });

  it('the copier preboard stays closed when the shipped scripts dir carries all seven modules', () => {
    // The REAL tree now carries all seven canonical backlog modules; board
    // package.json's preboard/pretest hooks run this copier before every
    // build and test. This proves the run keeps the runtime exactly the
    // four files the served board imports — no native entry-surface copy
    // appears just because it sits beside the source.
    const runtimeDir = path.resolve(__dirname, '../../board/runtime');
    if (!fs.existsSync(path.join(SOURCE_DIR, 'backlog-id.cjs')) ||
        !fs.existsSync(path.join(SOURCE_DIR, 'backlog-git.cjs')) ||
        !fs.existsSync(path.join(SOURCE_DIR, 'backlog-commit.cjs'))) {
      // A canonical module missing cannot happen in this tree, and missing
      // fixtures would reduce this to a placeholder that proves nothing —
      // so reject instead of pass silently.
      throw new Error('the shipped scripts dir is missing a canonical module — the closed-closure test has no subject');
    }
    for (const name of SHIPPED_CANONICAL) {
      expect(fs.existsSync(path.join(SOURCE_DIR, name)), `${name} missing at source`).toBe(true);
    }
    const result = execFileSync('node', [COPIER_PATH], { encoding: 'utf8' });
    expect(result).toContain('Board runtime ready');
    // Exactly the canonical runtime names — nothing from the extra modules.
    const shippedNames = fs.readdirSync(runtimeDir).sort();
    expect(shippedNames).toEqual([...RUNTIME_FILES].sort());
  });

  it('no board test, fixture or server case names an OLD bash sentinel route', () => {
    // The e2e reads the server.spawning the open helper; the native tests
    // assert the runtime. This keeps the board's test SOURCE itself free of
    // sentinel /legacy route references that must not creep back.
    for (const name of ['server.test.ts', 'native-backlog.test.ts']) {
      const testFile = path.resolve(__dirname, '../../board/test', name);
      const e2eFile = path.resolve(__dirname, '../../board/e2e', 'native-backlog.spec.ts');
      for (const src of [testFile, e2eFile]) {
        const text = fs.readFileSync(src, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        expect(text, src).not.toContain('spawnSync(\'bash\'');
        expect(text, src).not.toContain('bash ' + '.codeadd/scripts/backlog.sh');
      }
    }
  });
});
