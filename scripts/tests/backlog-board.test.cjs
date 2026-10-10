'use strict';
// =============================================================================
// backlog-board — the board module and the clone-side git primitives
// =============================================================================
// Target entries: framwork/.codeadd/scripts/backlog-board.cjs and the
// clone-side half of backlog-git.cjs. Every fixture is a temp bare remote, a
// temp code repository and a temp CODEADD_BOARD_DIR. No test reads or writes
// the real ~/.codeadd/ (L1.6 asserts it).
//
// Run: node --test scripts/tests/backlog-board.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const h = require('./helpers.cjs');
const git = require(path.join(h.SCRIPTS_DIR, 'backlog-git.cjs'));

/** A bare remote holding an orphan `board` branch with one commit. */
function remoteWithBoard(t, { trailer = '' } = {}) {
  const base = h.mkTmp('codeadd-board-remote-');
  t.after(() => h.rmrf(base));
  const bare = path.join(base, 'remote.git');
  h.git(base, ['init', '--bare', '-q', '--initial-branch=main', bare]);
  const seed = path.join(base, 'seed');
  fs.mkdirSync(seed);
  h.git(seed, ['init', '-q', '--initial-branch=board']);
  h.git(seed, ['config', 'user.email', 'test@test.com']);
  h.git(seed, ['config', 'user.name', 'Test']);
  h.git(seed, ['config', 'commit.gpgsign', 'false']);
  h.write(path.join(seed, 'docs', 'backlog.jsonl'), '{"id":"0001B"}\n');
  h.git(seed, ['add', '.']);
  h.git(seed, ['commit', '-q', '-m', 'seed' + (trailer ? '\n\n' + trailer : '')]);
  h.git(seed, ['push', '-q', bare, 'board']);
  return { base, bare, seed };
}

function cloneOf(t, remote, name = 'clone') {
  const dir = path.join(remote.base, name);
  const res = git.cloneBranch(remote.bare, dir, 'board');
  assert.equal(res.ok, true, JSON.stringify(res));
  h.git(dir, ['config', 'user.email', 'test@test.com']);
  h.git(dir, ['config', 'user.name', 'Test']);
  h.git(dir, ['config', 'commit.gpgsign', 'false']);
  return dir;
}

// ─── F2 — the clone-side git primitives ──────────────────────────────────────

test('backlog-board#001 — F2: clone, remoteHasBranch, showAt and the root trailers', (t) => {
  const remote = remoteWithBoard(t, { trailer: 'Migrated-From: abc123' });
  assert.deepEqual(git.remoteHasBranch(remote.bare, 'board', remote.base), { ok: true, exists: true });
  assert.deepEqual(git.remoteHasBranch(remote.bare, 'nope', remote.base), { ok: true, exists: false });
  assert.equal(git.remoteHasBranch(path.join(remote.base, 'missing.git'), 'board', remote.base).ok, false);

  const clone = cloneOf(t, remote);
  const head = git.headSha(clone);
  assert.equal(git.showAt(clone, head, 'docs/backlog.jsonl'), '{"id":"0001B"}\n');
  assert.equal(git.showAt(clone, head, 'docs/none'), null);
  const root = git.rootCommit(clone, 'HEAD');
  assert.equal(root, head);
  assert.equal(git.commitTrailers(clone, root)['Migrated-From'], 'abc123');
  assert.equal(git.cloneBranch(remote.bare, path.join(remote.base, 'bad'), 'nope').ok, false);
});

test('backlog-board#002 — F2: fetch, ahead/behind, fast-forward, push and rebase-once', (t) => {
  const remote = remoteWithBoard(t);
  const a = cloneOf(t, remote, 'a');
  const b = cloneOf(t, remote, 'b');

  // b commits and pushes; a is now behind.
  h.write(path.join(b, 'docs', 'backlog.jsonl'), '{"id":"0001B"}\n{"id":"0002B"}\n');
  assert.equal(git.commitFiles(b, ['docs/backlog.jsonl'], 'b adds').committed, true);
  assert.deepEqual(git.pushBranch(b, 'board'), { pushed: true });

  assert.deepEqual(git.fetchBranch(a, 'board'), { fetched: true });
  assert.deepEqual(git.aheadBehind(a, 'board'), { ok: true, ahead: 0, behind: 1 });
  assert.equal(git.fastForward(a, 'board').ok, true);
  assert.deepEqual(git.aheadBehind(a, 'board'), { ok: true, ahead: 0, behind: 0 });

  // a commits locally, b pushes again: diverged. Rebase once, then push.
  h.write(path.join(a, 'docs', 'other.txt'), 'a\n');
  assert.equal(git.commitFiles(a, ['docs/other.txt'], 'a adds').committed, true);
  h.write(path.join(b, 'docs', 'more.txt'), 'b\n');
  git.commitFiles(b, ['docs/more.txt'], 'b adds more');
  git.pushBranch(b, 'board');
  git.fetchBranch(a, 'board');
  assert.deepEqual(git.aheadBehind(a, 'board'), { ok: true, ahead: 1, behind: 1 });
  assert.equal(git.fastForward(a, 'board').ok, false);
  assert.equal(git.rebaseOnBranch(a, 'board').ok, true);
  assert.deepEqual(git.pushBranch(a, 'board'), { pushed: true });
});

test('backlog-board#003 — F2: a conflicting rebase aborts cleanly; a refused push is an answer', (t) => {
  const remote = remoteWithBoard(t);
  const a = cloneOf(t, remote, 'a');
  const b = cloneOf(t, remote, 'b');
  h.write(path.join(b, 'docs', 'backlog.jsonl'), 'from b\n');
  git.commitFiles(b, ['docs/backlog.jsonl'], 'b');
  git.pushBranch(b, 'board');
  h.write(path.join(a, 'docs', 'backlog.jsonl'), 'from a\n');
  git.commitFiles(a, ['docs/backlog.jsonl'], 'a');

  assert.deepEqual(git.pushBranch(a, 'board'), { pushed: false, reason: 'push-refused' });
  git.fetchBranch(a, 'board');
  const res = git.rebaseOnBranch(a, 'board');
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'rebase-conflict');
  assert.equal(git.conditionsAt(a).rebasing, false);
  assert.equal(git.fetchBranch(path.join(remote.base, 'nowhere'), 'board').fetched, false);
});
