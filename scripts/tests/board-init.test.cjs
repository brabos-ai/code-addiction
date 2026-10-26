'use strict';
// =============================================================================
// board-init — the shipped script that creates a project's board
// =============================================================================
// Target entry: framwork/.codeadd/scripts/board-init.cjs.
// Every fixture is a temp bare remote, a temp project with `origin` pointing at
// it and a temp CODEADD_BOARD_DIR. Nothing touches the real ~/.codeadd/ or this
// checkout.
//
// Run: node --test scripts/tests/board-init.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const BACKLOG = 'docs/backlog.jsonl';
const CONFIG = '.codeadd/board.json';

/**
 * A project on `main` with a bare `origin`. `origin: false` leaves the remote out;
 * `push: false` adds the remote but pushes nothing, so the remote stays empty.
 */
function project(t, { origin = true, push = true } = {}) {
  const base = h.mkTmp('codeadd-boardinit-');
  t.after(() => h.rmrf(base));
  const bare = path.join(base, 'remote.git');
  h.git(base, ['init', '--bare', '-q', '--initial-branch=main', bare]);
  const repo = path.join(base, 'proj');
  fs.mkdirSync(repo);
  h.git(repo, ['init', '-q', '--initial-branch=main']);
  h.git(repo, ['config', 'user.email', 'test@test.com']);
  h.git(repo, ['config', 'user.name', 'Test']);
  h.git(repo, ['config', 'commit.gpgsign', 'false']);
  h.write(path.join(repo, 'code.txt'), 'code\n');
  h.git(repo, ['add', '-A']);
  assert.equal(h.git(repo, ['commit', '-q', '-m', 'seed']).status, 0);
  if (origin) {
    h.git(repo, ['remote', 'add', 'origin', bare]);
    if (push) {
      h.git(repo, ['push', '-q', 'origin', 'main']);
      h.git(repo, ['remote', 'set-head', 'origin', 'main']);
    }
  }
  const boardDir = path.join(base, 'clone');
  const env = { CODEADD_BOARD_DIR: boardDir, HOME: base, USERPROFILE: base };
  return { base, bare, repo, boardDir, env };
}

const init = (p, args = [], opts = {}) => h.runScript('board-init', args, { cwd: p.repo, env: p.env, ...opts });
const kv = (res) => h.parseKV(res.stdout);
const staged = (p) => h.git(p.repo, ['diff', '--cached', '--name-status']).stdout.trim().split('\n').filter(Boolean).sort();
const refs = (p) => h.git(p.bare, ['for-each-ref', '--format=%(refname) %(objectname)']).stdout.trim();
const refsExceptBoard = (p) => refs(p).split('\n').filter((l) => l && !l.startsWith('refs/heads/board ')).join('\n');
const codeHead = (p) => h.git(p.repo, ['rev-parse', 'HEAD']).stdout.trim();
const configOf = (p) => JSON.parse(fs.readFileSync(path.join(p.repo, CONFIG), 'utf8'));

test('board-init#001 — a project with no board gets one: branch, trailers, config, clone, staged file, no code commit', (t) => {
  const p = project(t);
  const head = codeHead(p);
  const before = refsExceptBoard(p);

  const res = init(p);
  assert.equal(res.status, 0, res.output);
  const out = kv(res);
  assert.equal(out.BOARD, 'created');
  assert.equal(out.BOARD_BRANCH_CREATED, 'yes');
  assert.equal(out.BOARD_DIR, p.boardDir);
  assert.equal(out.BASE_BRANCH, 'main');
  assert.equal(out.CODE_CHANGES, 'staged');
  assert.equal(out.STAGED, CONFIG);
  assert.match(res.stdout, /commit \.codeadd\/board\.json/);

  // The board branch and its root commit.
  const baseSha = h.git(p.bare, ['rev-parse', 'main']).stdout.trim();
  const rootSha = h.git(p.bare, ['rev-list', '--max-parents=0', 'board']).stdout.trim();
  assert.match(rootSha, /^[0-9a-f]{40}$/);
  const message = h.git(p.bare, ['log', '-1', '--format=%B', rootSha]).stdout;
  assert.equal(message.split('\n')[0], 'Create the board');
  assert.match(message, new RegExp('^Migrated-From: ' + baseSha + '$', 'm'));
  assert.match(message, /^Backlog-Blob: none$/m);
  assert.match(message, /^Definitions-Blob: none$/m);
  assert.equal(h.git(p.bare, ['show', `board:${BACKLOG}`]).stdout, '');
  assert.notEqual(h.git(p.bare, ['cat-file', '-e', 'board:docs/backlog.definitions.json']).status, 0);

  // The config and the clone.
  assert.deepEqual(configOf(p), { remote: p.bare, branch: 'board' });
  assert.equal(fs.existsSync(path.join(p.boardDir, '.git')), true);

  // The code side: staged, never committed; no other ref moved on the remote.
  assert.deepEqual(staged(p), ['A\t' + CONFIG]);
  assert.equal(codeHead(p), head);
  assert.equal(refsExceptBoard(p), before);
});

test('board-init#002 — a second run reports BOARD=ready and changes nothing', (t) => {
  const p = project(t);
  assert.equal(init(p).status, 0);
  const snapshot = () => ({
    remote: refs(p),
    status: h.git(p.repo, ['status', '--porcelain']).stdout,
    index: h.git(p.repo, ['ls-files', '-s']).stdout,
    config: fs.readFileSync(path.join(p.repo, CONFIG), 'utf8'),
    head: codeHead(p),
  });
  const before = snapshot();

  const again = init(p);
  assert.equal(again.status, 0, again.output);
  assert.equal(kv(again).BOARD, 'ready');
  assert.equal(kv(again).CODE_CHANGES, undefined);
  assert.deepEqual(snapshot(), before);
});

test('board-init#003 — branch-missing: the branch is created from the existing config, the config is not rewritten, the file is staged', (t) => {
  const p = project(t);
  const text = JSON.stringify({ remote: p.bare, branch: 'board' });
  h.write(path.join(p.repo, CONFIG), text);

  const res = init(p);
  assert.equal(res.status, 0, res.output);
  const out = kv(res);
  assert.equal(out.BOARD, 'created');
  assert.equal(out.BOARD_BRANCH_CREATED, 'yes');
  assert.equal(out.CODE_CHANGES, 'staged');
  assert.equal(fs.readFileSync(path.join(p.repo, CONFIG), 'utf8'), text);
  assert.deepEqual(staged(p), ['A\t' + CONFIG]);
  assert.equal(h.git(p.bare, ['rev-parse', '--verify', '--quiet', 'refs/heads/board']).status, 0);
  assert.equal(fs.existsSync(path.join(p.boardDir, '.git')), true);
});

test('board-init#004 — no origin: ERROR=no-remote, exit 1, no config, nothing staged', (t) => {
  const p = project(t, { origin: false });
  const res = init(p);
  assert.equal(res.status, 1, res.output);
  assert.equal(kv(res).ERROR, 'no-remote');
  assert.equal(fs.existsSync(path.join(p.repo, CONFIG)), false);
  assert.deepEqual(staged(p), []);
});

test('board-init#005 — an empty remote: ERROR=no-base-branch, exit 1, the remote keeps zero refs', (t) => {
  const p = project(t, { push: false });
  const res = init(p);
  assert.equal(res.status, 1, res.output);
  assert.equal(kv(res).ERROR, 'no-base-branch');
  assert.equal(refs(p), '');
  assert.equal(fs.existsSync(path.join(p.repo, CONFIG)), false);
  assert.deepEqual(staged(p), []);
});

test('board-init#006 — docs/backlog.jsonl in the checkout: ERROR=board-migration-required, nothing written or pushed', (t) => {
  const p = project(t);
  h.write(path.join(p.repo, BACKLOG), '{"id":"0001B"}\n');
  const before = refs(p);

  const res = init(p);
  assert.equal(res.status, 1, res.output);
  assert.equal(kv(res).ERROR, 'board-migration-required');
  assert.match(res.stdout, /https:\/\/github\.com\/brabos-ai\/code-addiction#board/);
  assert.equal(refs(p), before);
  assert.equal(fs.existsSync(path.join(p.repo, CONFIG)), false);
  assert.deepEqual(staged(p), []);
});

test('board-init#007 — not a git repository: ERROR=not-a-git-repository, exit 2', (t) => {
  const plain = h.mkTmp('codeadd-plain-');
  t.after(() => h.rmrf(plain));
  const res = h.runScript('board-init', [], { cwd: plain, env: { CODEADD_BOARD_DIR: '' } });
  assert.equal(res.status, 2, res.output);
  assert.equal(kv(res).ERROR, 'not-a-git-repository');
});

test('board-init#008 — a bad argument is a caller error, exit 2', (t) => {
  const p = project(t);
  const res = init(p, ['--frobnicate']);
  assert.equal(res.status, 2, res.output);
  assert.equal(fs.existsSync(path.join(p.repo, CONFIG)), false);
});

test('board-init#009 — acceptance: after a create, backlog-commit add writes a ticket that backlog-cli get reads', (t) => {
  const p = project(t);
  assert.equal(init(p).status, 0);
  const record = h.write(path.join(p.base, 't.json'), JSON.stringify({
    title: 'first ticket', theme: 'general', tldr: 'proves the new board takes a write',
    notes: [], done_when: 'the ticket reads back', paths: [], grounded: false, status: 'open',
  }));

  const add = h.runScript('backlog-commit', ['add', '--record-file', record], { cwd: p.repo, env: p.env });
  assert.equal(add.status, 0, add.output);
  const id = kv(add).TICKET_ID;
  assert.match(id, /^\d{4}B$/);
  assert.equal(kv(add).PUSHED, 'yes');

  const got = h.runScript('backlog-cli', ['get', id], { cwd: p.repo, env: p.env });
  assert.equal(got.status, 0, got.output);
  assert.match(got.stdout, /first ticket/);
});

test('board-init#010 — a refused push leaves no clone to make: the config this run wrote is removed, ERROR=board-unavailable', (t) => {
  const p = project(t);
  // A pre-receive hook on the remote refuses the push of `board`; the push is then
  // read as "another machine got there first", and the clone finds no branch.
  const hook = path.join(p.bare, 'hooks', 'pre-receive');
  h.write(hook, '#!/bin/sh\nwhile read old new ref; do [ "$ref" = "refs/heads/board" ] && exit 1; done\nexit 0\n');
  fs.chmodSync(hook, 0o755);
  const res = init(p);
  assert.equal(res.status, 1, res.output);
  assert.equal(kv(res).ERROR, 'board-unavailable');
  assert.equal(fs.existsSync(path.join(p.repo, CONFIG)), false, 'the config this run wrote is removed');
});
