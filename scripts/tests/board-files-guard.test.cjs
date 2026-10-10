'use strict';
// =============================================================================
// board-files-guard — the CI guard that keeps the board files off the code branches
// =============================================================================
// Target entry: scripts/board-files-guard.cjs. Every fixture is a temp git repo.
//
// Run: node --test scripts/tests/board-files-guard.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const guard = (cwd, args = []) => h.runRootScript('board-files-guard', args, { cwd });

/** A repo tracking the given files. */
function repo(t, files) {
  const r = h.makeRepo({ prefix: 'codeadd-board-guard-' });
  t.after(r.cleanup);
  for (const rel of files) h.write(path.join(r.repo, rel), '{}\n');
  r.git('add', '-f', '-A');
  r.git('commit', '-q', '-m', 'files', '--allow-empty');
  return r;
}

test('board-files-guard#001 — the config and a board file both tracked fails, naming the file', (t) => {
  for (const file of ['docs/backlog.jsonl', 'docs/backlog.definitions.json']) {
    const r = repo(t, ['.codeadd/board.json', file]);
    const res = guard(r.repo);
    assert.equal(res.status, 1, res.output);
    const kv = h.parseKV(res.stdout);
    assert.equal(kv.GUARD, 'fail');
    assert.equal(kv.CONFIG, 'tracked');
    assert.equal(kv.BOARD_FILE, file);
  }
});

test('board-files-guard#002 — both board files with the config lists both', (t) => {
  const r = repo(t, ['.codeadd/board.json', 'docs/backlog.jsonl', 'docs/backlog.definitions.json']);
  const res = guard(r.repo);
  assert.equal(res.status, 1, res.output);
  assert.match(res.stdout, /BOARD_FILE=docs\/backlog\.jsonl/);
  assert.match(res.stdout, /BOARD_FILE=docs\/backlog\.definitions\.json/);
});

test('board-files-guard#003 — the config alone passes; a board file alone passes (not migrated yet)', (t) => {
  const configOnly = guard(repo(t, ['.codeadd/board.json']).repo);
  assert.equal(configOnly.status, 0, configOnly.output);
  assert.equal(h.parseKV(configOnly.stdout).GUARD, 'pass');

  const fileOnly = guard(repo(t, ['docs/backlog.jsonl']).repo);
  assert.equal(fileOnly.status, 0, fileOnly.output);
  assert.equal(h.parseKV(fileOnly.stdout).CONFIG, 'absent');
});

test('board-files-guard#004 — an untracked board file next to the tracked config does not count', (t) => {
  const r = repo(t, ['.codeadd/board.json']);
  h.write(path.join(r.repo, 'docs', 'backlog.jsonl'), '{}\n');
  assert.equal(guard(r.repo).status, 0);
});

test('board-files-guard#005 — --root checks another repository; a bad argument or a non-repository is exit 2', (t) => {
  const r = repo(t, ['.codeadd/board.json', 'docs/backlog.jsonl']);
  const other = h.mkTmp('codeadd-cwd-');
  t.after(() => h.rmrf(other));
  assert.equal(guard(other, ['--root', r.repo]).status, 1);
  assert.equal(guard(other, ['--bogus']).status, 2);
  assert.equal(guard(other).status, 2);
});

test('board-files-guard#006 — this repository passes after the migration', () => {
  const res = guard(h.REPO_ROOT);
  assert.equal(res.status, 0, res.output);
  assert.equal(h.parseKV(res.stdout).CONFIG, 'tracked');
});

test('board-files-guard#007 — CI runs the guard', () => {
  const ci = fs.readFileSync(path.join(h.REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(ci, /node scripts\/board-files-guard\.cjs/);
});
