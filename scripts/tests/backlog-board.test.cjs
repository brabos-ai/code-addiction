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
const board = require(path.join(h.SCRIPTS_DIR, 'backlog-board.cjs'));
const { spawnSync } = require('node:child_process');

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

// ─── L1 — the board module ───────────────────────────────────────────────────

/** A code repository whose committed config points at `remote`. */
function codeRepo(t, remote, { config = true, branch = 'board', file = false } = {}) {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  if (config) h.write(path.join(r.repo, '.codeadd', 'board.json'), JSON.stringify({ remote: remote.bare, branch }));
  if (file) h.write(path.join(r.repo, 'docs', 'backlog.jsonl'), '{"id":"0001B"}\n');
  return r.repo;
}

const envFor = (dir) => ({ ...process.env, CODEADD_BOARD_DIR: dir });

test('backlog-board#004 — L1.1: every URL spelling of one project gives one key', () => {
  for (const url of [
    'https://github.com/A/b.git',
    'git@github.com:A/b.git',
    'ssh://git@GitHub.com/A/b',
    'https://user@github.com/A/b',
    'https://github.com/A/b/',
  ]) {
    assert.equal(board.normalizeKey(url), 'github.com/A/b', url);
  }
  assert.equal(board.normalizeKey('ssh://git@host.example:2222/A/b.git'), 'host.example:2222/A/b');
  assert.equal(board.normalizeKey(''), '');
  assert.match(board.normalizeKey('C:\\tmp\\x\\remote.git'), /^local\/C\/tmp\/x\/remote$/);
  assert.equal(board.keyToPath('host.example:2222/A/b'), ['host.example_2222', 'A', 'b'].join(path.sep));
});

test('backlog-board#005 — L1.2: the five resolver states and the override', (t) => {
  const remote = remoteWithBoard(t);
  const empty = h.mkTmp('codeadd-board-clone-');
  t.after(() => h.rmrf(empty));

  // none: outside a git repository, and a repository with neither config nor file.
  const plain = h.mkTmp('codeadd-plain-');
  t.after(() => h.rmrf(plain));
  assert.equal(board.resolve(plain, { env: {} }).state, 'none');
  const bare = h.makeRepo();
  t.after(() => bare.cleanup());
  assert.equal(board.resolve(bare.repo, { env: {} }).state, 'none');

  // migration-required: no config, the file is in the checkout.
  assert.equal(board.resolve(codeRepo(t, remote, { config: false, file: true }), { env: {} }).state, 'migration-required');

  // branch-missing: config, remote reachable, no such branch.
  assert.equal(board.resolve(codeRepo(t, remote, { branch: 'nope' }), { env: envFor(path.join(empty, 'b1')) }).state, 'branch-missing');

  // checkout-missing: config, no clone, remote unreachable.
  const dead = { bare: path.join(remote.base, 'gone.git') };
  assert.equal(board.resolve(codeRepo(t, dead), { env: envFor(path.join(empty, 'b2')) }).state, 'checkout-missing');

  // ready: clone made on first use at the override path; the second call reuses it.
  const repo = codeRepo(t, remote);
  const dir = path.join(empty, 'b3');
  const first = board.resolve(repo, { env: envFor(dir) });
  assert.equal(first.state, 'ready');
  assert.equal(first.boardDir, dir);
  assert.equal(first.cloned, true);
  assert.equal(fs.existsSync(path.join(dir, 'docs', 'backlog.jsonl')), true);
  assert.equal(board.resolve(repo, { env: envFor(dir) }).cloned, undefined);

  // A subdirectory of the code repository resolves to the same config.
  const sub = path.join(repo, 'src');
  fs.mkdirSync(sub);
  assert.equal(board.resolve(sub, { env: envFor(dir) }).state, 'ready');

  // The override wins over the home path even with no config at all.
  assert.equal(board.resolve(bare.repo, { env: envFor(dir) }).state, 'ready');
});

test('backlog-board#006 — L1.3: the lock — live holder, dead holder, old lock, release', (t) => {
  const remote = remoteWithBoard(t);
  const clone = cloneOf(t, remote);
  const lockFile = board.lockPathOf(clone);

  const a = board.acquireLock(clone);
  assert.equal(a.ok, true);
  assert.equal(fs.existsSync(lockFile), true);

  // A live holder (this process): a reader gives up at once, a writer after its wait.
  assert.deepEqual(board.acquireLock(clone, { waitMs: 0 }), { ok: false, reason: 'held' });
  const t0 = Date.now();
  assert.equal(board.acquireLock(clone, { waitMs: 300 }).reason, 'held');
  assert.ok(Date.now() - t0 >= 250, 'the writer waited');
  a.release();
  assert.equal(fs.existsSync(lockFile), false);

  // A dead PID is reclaimed and reported.
  const done = spawnSync(process.execPath, ['-e', '0']);
  fs.writeFileSync(lockFile, JSON.stringify({ pid: done.pid || 99999999, ts: Date.now() }));
  const b = board.acquireLock(clone);
  assert.equal(b.ok, true);
  assert.ok(b.reclaimed !== undefined);
  b.release();

  // A live PID with a lock older than 10 minutes is reclaimed too.
  fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, ts: Date.now() - 11 * 60 * 1000 }));
  const c = board.acquireLock(clone);
  assert.equal(c.ok, true);
  assert.equal(c.reclaimed, process.pid);
  c.release();
});

test('backlog-board#007 — L1.4: the sync matrix and the 30 s throttle', (t) => {
  const remote = remoteWithBoard(t);
  const a = cloneOf(t, remote, 'a');
  const b = cloneOf(t, remote, 'b');
  const res = { state: 'ready', boardDir: a, branch: 'board' };
  const commitFile = (dir, file, text) => {
    h.write(path.join(dir, 'docs', file), text);
    git.commitFiles(dir, ['docs/' + file], 'add ' + file);
  };

  // first sync runs, the second within the window is fresh with no fetch
  assert.deepEqual(board.sync(res), { sync: 'synced' });
  assert.deepEqual(board.sync(res), { sync: 'fresh' });

  // behind → fast-forward
  commitFile(b, 'one.txt', '1');
  git.pushBranch(b, 'board');
  assert.deepEqual(board.sync(res, { force: true }), { sync: 'synced' });
  assert.equal(fs.existsSync(path.join(a, 'docs', 'one.txt')), true);

  // ahead → push
  commitFile(a, 'two.txt', '2');
  assert.deepEqual(board.sync(res, { force: true }), { sync: 'synced' });
  git.fetchBranch(b, 'board');
  assert.equal(git.resolveSha(b, 'refs/remotes/origin/board'), git.headSha(a));

  // diverged → rebase once and push
  commitFile(a, 'three.txt', '3');
  git.fastForward(b, 'board');
  commitFile(b, 'four.txt', '4');
  git.pushBranch(b, 'board');
  assert.deepEqual(board.sync(res, { force: true }), { sync: 'synced' });
  assert.equal(fs.existsSync(path.join(a, 'docs', 'four.txt')), true);
  assert.deepEqual(git.aheadBehind(a, 'board'), { ok: true, ahead: 0, behind: 0 });

  // lock held by a live process → skipped, and the read still has the clone
  const lock = board.acquireLock(a);
  assert.deepEqual(board.sync(res, { force: true }), { sync: 'skipped' });
  lock.release();

  // fetch failure → degraded with the reason
  h.git(a, ['remote', 'set-url', 'origin', path.join(remote.base, 'gone.git')]);
  assert.deepEqual(board.sync(res, { force: true }), { sync: 'degraded', reason: 'fetch-failed' });
  h.git(a, ['remote', 'set-url', 'origin', remote.bare]);

  // push refused: a pre-receive hook on the remote says no
  commitFile(a, 'five.txt', '5');
  fs.writeFileSync(path.join(remote.bare, 'hooks', 'pre-receive'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  assert.deepEqual(board.sync(res, { force: true }), { sync: 'degraded', reason: 'push-refused' });
  assert.deepEqual(board.syncLines({ boardDir: a }, { sync: 'degraded', reason: 'push-refused' }),
    [`BOARD_DIR=${a}`, 'SYNC=degraded', 'SYNC_REASON=push-refused']);
});

test('backlog-board#008 — L1.6: no real ~/.codeadd/ is touched', (t) => {
  const fakeHome = h.mkTmp('codeadd-home-');
  t.after(() => h.rmrf(fakeHome));
  const remote = remoteWithBoard(t);
  const repo = codeRepo(t, remote);
  const real = path.join(os.homedir(), '.codeadd');
  const before = fs.existsSync(real) ? fs.readdirSync(real).sort() : null;

  // No override: the clone must land under the (fake) home, never the real one.
  const child = h.runNode(['-e', `
    const b = require(${JSON.stringify(path.join(h.SCRIPTS_DIR, 'backlog-board.cjs'))});
    const r = b.resolve(${JSON.stringify(repo)}, { env: { HOME: ${JSON.stringify(fakeHome)}, USERPROFILE: ${JSON.stringify(fakeHome)} } });
    console.log(r.state + '|' + r.boardDir);
  `], { env: { HOME: fakeHome, USERPROFILE: fakeHome, CODEADD_BOARD_DIR: '' } });
  assert.equal(child.status, 0, child.output);
  const [state, dir] = child.stdout.trim().split('|');
  assert.equal(state, 'ready');
  assert.ok(dir.startsWith(fakeHome), dir);
  assert.equal(fs.existsSync(path.join(fakeHome, '.codeadd')), true);

  const after = fs.existsSync(real) ? fs.readdirSync(real).sort() : null;
  assert.deepEqual(after, before, 'the real ~/.codeadd/ did not change');
});
