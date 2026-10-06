'use strict';
// =============================================================================
// backlog-commit — native port of framwork/.codeadd/scripts/tests/backlog-commit.bats (6)
// =============================================================================
// Case map: scripts/tests/native-script-cases.json → backlog-commit#001..#006.
// Target entry: framwork/.codeadd/scripts/backlog-commit.cjs.
//
// The full routing/worktree/rebase/push matrix is exercised in
// cli/tests/backlog-publication.test.js; this suite retains the grammar,
// record-file/stdin and result-contract cases, exactly as the Bats suite did.
//
// Run: node --test scripts/tests/backlog-commit.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const BACKLOG = 'docs/backlog.jsonl';

/** A throwaway directory used as the child's cwd; cleaned via t.after. */
function project(t, prefix = 'codeadd-backlog-commit-') {
  const dir = h.mkTmp(prefix);
  t.after(() => h.rmrf(dir));
  return dir;
}

/** A throwaway repo on main with one commit — the direct-route fixture. */
function repo(t) {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  return r;
}

/** The record `add` must accept; identical to backlog.test.cjs' fixture. */
function validTicket() {
  return JSON.stringify({
    title: 'cache the provider map',
    theme: 'performance',
    tldr: 'stop re-reading provider-map.json on every artefact',
    notes: ['build.js reads it once per file today'],
    done_when: 'node scripts/build.js reads provider-map.json exactly once',
    paths: ['scripts/build.js'],
    grounded: true,
    status: 'open',
  });
}

const commit = (dir, args, opts = {}) => h.runScript('backlog-commit', args, { ...opts, cwd: dir });
const key = (stdout, name) => h.parseKV(stdout)[name];

// ─── L1 — the native entry's contract ────────────────────────────────────────

test('backlog-commit#001 — L1.2: a bad mode is a caller error, usage on stderr', (t) => {
  const dir = project(t);
  const res = commit(dir, ['frobnicate']);
  assert.equal(res.status, 2, res.output);
});

test('backlog-commit#002 — L1.3: list, search and get are refused by name', (t) => {
  const dir = project(t);

  const list = commit(dir, ['list']);
  assert.equal(list.status, 2, list.output);
  assert.match(list.output, /ERROR=read-mode/);

  const search = commit(dir, ['search', 'provider map']);
  assert.equal(search.status, 2, search.output);
  assert.match(search.output, /ERROR=read-mode/);

  const get = commit(dir, ['get', '0001B']);
  assert.equal(get.status, 2, get.output);
  assert.match(get.output, /ERROR=read-mode/);
});

test('backlog-commit#003 — L1.4: a native add lands, persists and commits locally', (t) => {
  const r = repo(t);
  const record = h.write(path.join(r.base, 't.json'), validTicket());

  const res = commit(r.repo, ['add', '--record-file', record]);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'ROUTE'), 'direct');
  assert.equal(key(res.stdout, 'PUSHED'), 'no');
  assert.equal(key(res.stdout, 'DEGRADED'), 'no-remote');
  assert.equal(key(res.stdout, 'PERSISTED'), 'yes');
  assert.equal(key(res.stdout, 'COMMITTED'), 'yes');
  assert.notEqual(key(res.stdout, 'TICKET_ID'), '');
  assert.equal(key(res.stdout, 'RECOVERY_PATH'), undefined);
  assert.match(key(res.stdout, 'SHA'), /^[0-9a-f]{40}$/);
  assert.equal(fs.existsSync(path.join(r.repo, BACKLOG)), true);
});

test('backlog-commit#004 — L1.5: stdin records still work', (t) => {
  const r = repo(t);
  const res = commit(r.repo, ['add'], { input: validTicket() });
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'PERSISTED'), 'yes');
  assert.notEqual(key(res.stdout, 'TICKET_ID'), '');
});

test('backlog-commit#005 — L1.6: a refusal passes through with the CLI own exit code', (t) => {
  const r = repo(t);
  const patch = h.write(path.join(r.base, 'p.json'), '{"title":"gone","tldr":"t","done_when":"t"}');

  const res = commit(r.repo, ['update', '0404B', '--record-file', patch]);
  assert.equal(res.status, 2, res.output);
  assert.match(res.output, /REFUSED=unknown-id/);
});

test('backlog-commit#006 — L1.7: a degraded write is a result, and the record is on disk', (t) => {
  // A plain directory with no git anywhere above it — a project without
  // version control. h.mkTmp() lands outside every repository.
  const plain = project(t, 'codeadd-plain-');
  const record = h.write(path.join(plain, 't.json'), validTicket());

  const res = commit(plain, ['add', '--record-file', record]);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'ROUTE'), 'none');
  assert.equal(key(res.stdout, 'DEGRADED'), 'not-a-git-repo');
  assert.equal(key(res.stdout, 'PERSISTED'), 'yes');
  assert.equal(key(res.stdout, 'COMMITTED'), 'no');
  assert.notEqual(key(res.stdout, 'RECOVERY_PATH'), '');
  assert.equal(fs.existsSync(path.join(plain, BACKLOG)), true);
});
