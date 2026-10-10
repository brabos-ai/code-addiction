'use strict';
// =============================================================================
// backlog-commit — the publication entry, on the board route
// =============================================================================
// Case map: scripts/tests/native-script-cases.json → backlog-commit#001..#006
// (#003 and #006 rewritten for the board route), then #007.. for the route's
// own contract. Target entry: framwork/.codeadd/scripts/backlog-commit.cjs.
//
// Every fixture is a temp bare remote holding the `board` branch, a temp code
// repository whose committed config points at it, and a temp CODEADD_BOARD_DIR
// (helpers.makeBoard). No test reads or writes the real ~/.codeadd/.
//
// The recovery-ref, fetch-failed, push-refused and rebase-conflict matrix on a
// fixture clone lives in cli/tests/backlog-publication.test.js.
//
// Run: node --test scripts/tests/backlog-commit.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const BACKLOG = 'docs/backlog.jsonl';

/** A board fixture, cleaned up by the test. */
function board(t, opts) {
  const b = h.makeBoard(opts);
  t.after(() => b.cleanup());
  return b;
}

/** The record `add` must accept; identical to backlog.test.cjs' fixture. */
function validTicket(title = 'cache the provider map') {
  return JSON.stringify({
    title,
    theme: 'performance',
    tldr: 'stop re-reading provider-map.json on every artefact',
    notes: ['build.js reads it once per file today'],
    done_when: 'node scripts/build.js reads provider-map.json exactly once',
    paths: ['scripts/build.js'],
    grounded: true,
    status: 'open',
  });
}

const commit = (cwd, args, opts = {}) => h.runScript('backlog-commit', args, { ...opts, cwd });
const key = (stdout, name) => h.parseKV(stdout)[name];

/** The board file as it stands on the remote's board branch. */
const remoteBoard = (b) => h.git(b.bare, ['show', `board:${BACKLOG}`]).stdout;
const remoteIds = (b) => [...remoteBoard(b).matchAll(/"id":"(\d{4}B)"/g)].map((m) => m[1]);

// ─── L1 — the native entry's contract ────────────────────────────────────────

test('backlog-commit#001 — L1.2: a bad mode is a caller error, usage on stderr', (t) => {
  const b = board(t);
  const res = commit(b.repo, ['frobnicate'], { env: b.env });
  assert.equal(res.status, 2, res.output);
});

test('backlog-commit#002 — L1.3: list, search and get are refused by name', (t) => {
  const b = board(t);
  for (const args of [['list'], ['search', 'provider map'], ['get', '0001B'], ['changes']]) {
    const res = commit(b.repo, args, { env: b.env });
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /ERROR=read-mode/);
  }
});

test('backlog-commit#003 — L1.4: a native add lands on the board branch and nowhere else', (t) => {
  const b = board(t);
  const record = h.write(path.join(b.base, 't.json'), validTicket());
  const codeHead = h.git(b.repo, ['rev-parse', 'HEAD']).stdout;

  const res = commit(b.repo, ['add', '--record-file', record], { env: b.env });
  assert.equal(res.status, 0, res.output);
  const kv = h.parseKV(res.stdout);
  assert.equal(kv.ROUTE, 'board');
  assert.equal(kv.BOARD_DIR, b.boardDir);
  assert.equal(kv.BASE_BRANCH, undefined);
  assert.equal(kv.PUSHED, 'yes');
  assert.equal(kv.DEGRADED, undefined);
  assert.equal(kv.PERSISTED, 'yes');
  assert.equal(kv.COMMITTED, 'yes');
  assert.equal(kv.RECOVERY_PATH, undefined);
  assert.equal(kv.RECOVERY_REF, undefined);
  assert.match(kv.SHA, /^[0-9a-f]{40}$/);
  assert.deepEqual(remoteIds(b), [kv.TICKET_ID]);

  // The code repository: same commit, clean tree, no board file.
  assert.equal(h.git(b.repo, ['rev-parse', 'HEAD']).stdout, codeHead);
  assert.equal(h.git(b.repo, ['status', '--porcelain']).stdout, '');
  assert.equal(fs.existsSync(path.join(b.repo, BACKLOG)), false);
});

test('backlog-commit#004 — L1.5: stdin records still work', (t) => {
  const b = board(t);
  const res = commit(b.repo, ['add'], { input: validTicket(), env: b.env });
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'PERSISTED'), 'yes');
  assert.notEqual(key(res.stdout, 'TICKET_ID'), '');
});

test('backlog-commit#005 — L1.6: a refusal passes through with the CLI own exit code', (t) => {
  const b = board(t);
  const patch = h.write(path.join(b.base, 'p.json'), '{"title":"gone","tldr":"t","done_when":"t"}');

  const res = commit(b.repo, ['update', '0404B', '--record-file', patch], { env: b.env });
  assert.equal(res.status, 2, res.output);
  assert.match(res.output, /REFUSED=unknown-id/);
  assert.equal(remoteIds(b).length, 0, 'nothing reached the remote');
});

test('backlog-commit#006 — L1.7: a project with no board is refused, nothing is written', (t) => {
  // A plain directory with no git anywhere above it.
  const plain = h.mkTmp('codeadd-plain-');
  t.after(() => h.rmrf(plain));
  const record = h.write(path.join(plain, 't.json'), validTicket());

  const res = commit(plain, ['add', '--record-file', record], { env: { CODEADD_BOARD_DIR: '' } });
  assert.equal(res.status, 2, res.output);
  assert.equal(key(res.stdout, 'REFUSED'), 'board-not-configured');
  assert.equal(fs.existsSync(path.join(plain, BACKLOG)), false);
});

// ─── L2 — the one route ──────────────────────────────────────────────────────

test('backlog-commit#007 — L2.1: a write from a feature branch and from a linked worktree lands only on board', (t) => {
  const b = board(t);
  h.git(b.repo, ['checkout', '-q', '-b', 'feat/x']);
  h.write(path.join(b.repo, 'code.txt'), 'wip\n');
  h.git(b.repo, ['add', 'code.txt']);
  h.git(b.repo, ['commit', '-q', '-m', 'wip']);
  const branchHead = h.git(b.repo, ['rev-parse', 'HEAD']).stdout;

  const first = commit(b.repo, ['add'], { input: validTicket('from feature'), env: b.env });
  assert.equal(first.status, 0, first.output);
  assert.equal(key(first.stdout, 'ROUTE'), 'board');

  const wt = path.join(b.base, 'linked');
  h.git(b.repo, ['worktree', 'add', '-q', '-b', 'feat/y', wt]);
  const second = commit(wt, ['add'], { input: validTicket('from worktree'), env: b.env });
  assert.equal(second.status, 0, second.output);
  assert.equal(key(second.stdout, 'ROUTE'), 'board');
  assert.equal(key(second.stdout, 'BOARD_DIR'), b.boardDir);

  assert.deepEqual(remoteIds(b), [key(first.stdout, 'TICKET_ID'), key(second.stdout, 'TICKET_ID')]);
  assert.notEqual(key(first.stdout, 'TICKET_ID'), key(second.stdout, 'TICKET_ID'));
  assert.equal(h.git(b.repo, ['rev-parse', 'feat/x']).stdout, branchHead, 'the feature branch is untouched');
  assert.equal(h.git(b.repo, ['status', '--porcelain']).stdout, '');
  assert.equal(h.git(b.repo, ['ls-remote', '--heads', b.bare]).stdout.includes('refs/heads/main'), false, 'main never reached the remote');
  assert.equal(fs.existsSync(path.join(b.repo, '.worktrees')), false, 'no capture worktree is made');
});

test('backlog-commit#008 — L2.3: the board states that need a human exit 1 with ERROR=board-<state>, nothing written', (t) => {
  // migration-required: no config, the file still in the checkout.
  const b = board(t);
  h.git(b.repo, ['rm', '-q', '-f', '.codeadd/board.json']);
  h.git(b.repo, ['commit', '-q', '-m', 'drop config']);
  h.write(path.join(b.repo, BACKLOG), '{"id":"0001B"}\n');
  let res = commit(b.repo, ['add'], { input: validTicket(), env: { ...b.env, CODEADD_BOARD_DIR: '' } });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /ERROR=board-migration-required/);
  assert.equal(h.read(path.join(b.repo, BACKLOG)), '{"id":"0001B"}\n', 'the checkout file is untouched');

  // branch-missing: config names a branch the remote does not have.
  const c = board(t);
  h.write(path.join(c.repo, '.codeadd', 'board.json'), JSON.stringify({ remote: c.bare, branch: 'nope' }));
  res = commit(c.repo, ['add'], { input: validTicket(), env: c.env });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /ERROR=board-branch-missing/);

  // checkout-missing: no clone and the remote is unreachable.
  const d = board(t);
  h.write(path.join(d.repo, '.codeadd', 'board.json'), JSON.stringify({ remote: path.join(d.base, 'gone.git'), branch: 'board' }));
  res = commit(d.repo, ['add'], { input: validTicket(), env: d.env });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /ERROR=board-checkout-missing/);
  assert.equal(fs.existsSync(d.boardDir), false);
});

/** Run the entry asynchronously so two can overlap. */
function commitAsync(cwd, args, { input, env }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(h.SCRIPTS_DIR, 'backlog-commit.cjs'), ...args], {
      cwd, env: h.cleanEnv(env), shell: false,
    });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.on('close', (status) => resolve({ status, stdout }));
    child.stdin.end(input);
  });
}

test('backlog-commit#009 — L2.2: two concurrent adds get different ids and both land', async (t) => {
  const b = board(t);
  // Make the clone first so both runs find the same one.
  const warm = commit(b.repo, ['add'], { input: validTicket('warm'), env: b.env });
  assert.equal(warm.status, 0, warm.output);

  const [x, y] = await Promise.all([
    commitAsync(b.repo, ['add'], { input: validTicket('x'), env: b.env }),
    commitAsync(b.repo, ['add'], { input: validTicket('y'), env: b.env }),
  ]);
  assert.equal(x.status, 0, x.stdout);
  assert.equal(y.status, 0, y.stdout);
  const ids = [key(x.stdout, 'TICKET_ID'), key(y.stdout, 'TICKET_ID')];
  assert.notEqual(ids[0], ids[1]);
  assert.equal(new Set(remoteIds(b)).size, 3);
  for (const id of ids) assert.ok(remoteIds(b).includes(id), id);
});

test('backlog-commit#010 — L2.4: push refused twice degrades with a recovery ref; the next write pushes it', (t) => {
  const b = board(t);
  const warm = commit(b.repo, ['add'], { input: validTicket('warm'), env: b.env });
  assert.equal(warm.status, 0, warm.output);

  const hook = path.join(b.bare, 'hooks', 'pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const refused = commit(b.repo, ['add'], { input: validTicket('refused'), env: b.env });
  assert.equal(refused.status, 0, refused.output);
  assert.equal(key(refused.stdout, 'PUSHED'), 'no');
  assert.equal(key(refused.stdout, 'DEGRADED'), 'push-refused');
  assert.match(key(refused.stdout, 'RECOVERY_REF'), /^refs\/codeadd\/backlog-recovery\/[0-9a-f]{40}$/);
  assert.equal(key(refused.stdout, 'PERSISTED'), 'yes');
  assert.equal(remoteIds(b).length, 1, 'only the first reached the remote');
  assert.equal(h.git(b.boardDir, ['rev-parse', '--verify', '-q', key(refused.stdout, 'RECOVERY_REF')]).status, 0);

  fs.rmSync(hook);
  const next = commit(b.repo, ['add'], { input: validTicket('next'), env: b.env });
  assert.equal(next.status, 0, next.output);
  assert.equal(key(next.stdout, 'PUSHED'), 'yes');
  assert.equal(key(next.stdout, 'DEGRADED'), undefined);
  assert.equal(remoteIds(b).length, 3, 'the earlier write went out with the next one');
});

test('backlog-commit#011 — L1.3: a writer waits for a live lock, then exits 1 with ERROR=board-locked and writes nothing', async (t) => {
  const b = board(t);
  const warm = commit(b.repo, ['add'], { input: validTicket('warm'), env: b.env });
  assert.equal(warm.status, 0, warm.output);

  const holder = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { stdio: 'ignore' });
  t.after(() => holder.kill());
  fs.writeFileSync(path.join(b.boardDir, '.git', 'codeadd-board.lock'), JSON.stringify({ pid: holder.pid, ts: Date.now() }));

  const before = remoteBoard(b);
  const t0 = Date.now();
  const res = commit(b.repo, ['add'], { input: validTicket('blocked'), env: { ...b.env, CODEADD_BOARD_LOCK_WAIT_MS: '400' } });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /ERROR=board-locked/);
  assert.ok(Date.now() - t0 >= 350, 'the writer waited');
  assert.equal(remoteBoard(b), before);
  assert.equal(h.read(path.join(b.boardDir, BACKLOG)), before, 'the clone was not written either');
});

test('backlog-commit#012 — L1.7: a dead lock is reclaimed and reported', (t) => {
  const b = board(t);
  commit(b.repo, ['add'], { input: validTicket('warm'), env: b.env });
  fs.writeFileSync(path.join(b.boardDir, '.git', 'codeadd-board.lock'), JSON.stringify({ pid: 99999999, ts: Date.now() }));
  const res = commit(b.repo, ['add'], { input: validTicket('after'), env: b.env });
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'LOCK_RECLAIMED'), '99999999');
  assert.equal(key(res.stdout, 'PUSHED'), 'yes');
});

test('backlog-commit#013 — L2.1: an id is allocated after the fast-forward, past a ticket another machine pushed', (t) => {
  const b = board(t);
  const warm = commit(b.repo, ['add'], { input: validTicket('warm'), env: b.env });
  assert.equal(key(warm.stdout, 'TICKET_ID'), '0001B');

  // Another machine pushes 0002B and 0003B; this clone has not fetched yet.
  const other = path.join(b.base, 'other');
  h.git(b.base, ['clone', '-q', '--branch', 'board', b.bare, other]);
  h.git(other, ['config', 'user.email', 'o@o.com']);
  h.git(other, ['config', 'user.name', 'O']);
  h.git(other, ['config', 'commit.gpgsign', 'false']);
  const rows = h.read(path.join(other, BACKLOG)).trimEnd().split('\n');
  const base = JSON.parse(rows[0]);
  const extra = ['0002B', '0003B'].map((id) => JSON.stringify({ ...base, id, title: id }));
  fs.writeFileSync(path.join(other, BACKLOG), [...rows, ...extra].join('\n') + '\n');
  h.git(other, ['commit', '-q', '-am', 'other machine']);
  h.git(other, ['push', '-q', 'origin', 'board']);

  const res = commit(b.repo, ['add'], { input: validTicket('mine'), env: b.env });
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'TICKET_ID'), '0004B');
  assert.deepEqual(remoteIds(b), ['0001B', '0002B', '0003B', '0004B']);
});
