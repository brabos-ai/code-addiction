'use strict';
// =============================================================================
// get-main-branch.test.cjs — native port of framwork/.codeadd/scripts/tests/
// get-main-branch.bats (8 cases, get-main-branch#001…#008). Target entry:
// framwork/.codeadd/scripts/get-main-branch.cjs.
//
// Contract (from the shell header):
//   exit 0 — branch found with certainty (verified in repository)
//   exit 1 — not a git repository
//   exit 2 — no default branch found (no hardcoded fallback)
//
// Run: node --test scripts/tests/get-main-branch.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const h = require('./helpers.cjs');

function has(res, needle) {
  assert.ok(
    res.output.includes(needle),
    `expected output to include ${JSON.stringify(needle)}\n--- status ${res.status} ---\n${res.output}`,
  );
}

/**
 * makeRepo with a bare `origin` remote, the fixture the "cloned repo" cases
 * need. `branch` is pushed and tracked as origin/<branch>.
 */
function remoteRepo(branch = 'main') {
  const src = h.makeRepo({ branch, prefix: 'codeadd-gmb-' });
  const remoteBase = h.mkTmp('codeadd-gmb-remote-');
  h.git(remoteBase, ['init', '--bare', '-q', 'origin.git']);
  const remote = path.join(remoteBase, 'origin.git').split(path.sep).join('/');
  h.git(src.repo, ['remote', 'add', 'origin', remote]);
  h.git(src.repo, ['push', '-q', '-u', 'origin', branch]);
  return {
    repo: src.repo,
    src,
    cleanup: () => {
      src.cleanup();
      h.rmrf(remoteBase);
    },
  };
}

// ─── Detection via remote ────────────────────────────────────────────

test('get-main-branch#001 detects main via origin/HEAD (cloned repo)', (t) => {
  const r = remoteRepo('main');
  t.after(r.cleanup);
  // A clone sets refs/remotes/origin/HEAD; reproduce it explicitly.
  assert.equal(
    h.git(r.repo, ['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main']).status,
    0,
  );
  const res = h.runScript('get-main-branch', [], { cwd: r.repo });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), 'main');
});

test('get-main-branch#002 detects main via refs/remotes/origin/main', (t) => {
  const r = remoteRepo('main');
  t.after(r.cleanup);
  // Force the fallback past origin/HEAD.
  h.git(r.repo, ['symbolic-ref', '-d', 'refs/remotes/origin/HEAD']);
  const res = h.runScript('get-main-branch', [], { cwd: r.repo });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), 'main');
});

test('get-main-branch#003 detects master via remote when main does not exist', (t) => {
  const r = remoteRepo('master');
  t.after(r.cleanup);
  h.git(r.repo, ['symbolic-ref', '-d', 'refs/remotes/origin/HEAD']);
  const res = h.runScript('get-main-branch', [], { cwd: r.repo });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), 'master');
});

// ─── Detection via local branch (no remote) ─────────────────────────

test('get-main-branch#004 detects local main when there is no remote', (t) => {
  const r = h.makeRepo({ prefix: 'codeadd-gmb-' });
  t.after(r.cleanup);
  const res = h.runScript('get-main-branch', [], { cwd: r.repo });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), 'main');
});

test('get-main-branch#005 detects local master when there is no remote and branch is master', (t) => {
  const r = h.makeRepo({ prefix: 'codeadd-gmb-' });
  t.after(r.cleanup);
  assert.equal(r.git('branch', '-m', 'master').status, 0);
  const res = h.runScript('get-main-branch', [], { cwd: r.repo });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), 'master');
});

// ─── Error cases ─────────────────────────────────────────────────────

test('get-main-branch#006 fails with exit 1 outside of a git repository', (t) => {
  const dir = h.mkTmp('codeadd-gmb-notrepo-');
  t.after(() => h.rmrf(dir));
  const res = h.runScript('get-main-branch', [], { cwd: dir });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /not a git repository/);
});

test('get-main-branch#007 fails with exit 2 when neither main nor master exists', (t) => {
  const r = h.makeRepo({ prefix: 'codeadd-gmb-' });
  t.after(r.cleanup);
  assert.equal(r.git('branch', '-m', 'develop').status, 0);
  const res = h.runScript('get-main-branch', [], { cwd: r.repo });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /no main branch found/);
});

test('get-main-branch#008 error message goes to stderr on failure', (t) => {
  const r = h.makeRepo({ prefix: 'codeadd-gmb-' });
  t.after(r.cleanup);
  assert.equal(r.git('branch', '-m', 'develop').status, 0);
  const res = h.runScript('get-main-branch', [], { cwd: r.repo });
  assert.equal(res.status, 2);
  // The diagnostic must not pollute stdout: callers capture stdout as the name.
  assert.equal(res.stdout.trim(), '');
  has(res, 'ERROR');
});
