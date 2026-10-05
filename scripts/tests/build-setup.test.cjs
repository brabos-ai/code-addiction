'use strict';
// =============================================================================
// build-setup.test.cjs — native port of framwork/.codeadd/scripts/tests/
// build-setup.bats (22 cases, build-setup#001…#022). Target entry:
// framwork/.codeadd/scripts/build-setup.cjs.
//
// Exit codes from the header:
//   0 success / 2 feature dir not found|ambiguous / 3 invalid branch or
//   slug != dirname / 4 no verifiable main / 5 dirty tracked tree (in-place
//   only, and only when a checkout will happen).
//
// Run: node --test scripts/tests/build-setup.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const h = require('./helpers.cjs');

function has(res, needle) {
  assert.ok(
    res.output.includes(needle),
    `expected output to include ${JSON.stringify(needle)}\n--- status ${res.status} ---\n${res.output}`,
  );
}

function hasNot(res, needle) {
  assert.ok(
    !res.output.includes(needle),
    `expected output NOT to include ${JSON.stringify(needle)}\n--- status ${res.status} ---\n${res.output}`,
  );
}

function repo(t) {
  const r = h.makeRepo({ prefix: 'codeadd-bset-' });
  t.after(r.cleanup);
  return r;
}

const run = (r, args) => h.runScript('build-setup', args, { cwd: r.repo });

/** docs/features/<dir>/about.md with optional `branch:` frontmatter. */
function makeFeature(r, dir, branch = '') {
  let body = `---\nid: ${dir}\n`;
  if (branch) body += `branch: ${branch}\n`;
  body += '---\n# about\n';
  h.write(path.join(r.repo, 'docs', 'features', dir, 'about.md'), body);
}

/** A tracked file is committed once, then modified. */
function dirtyTracked(r) {
  h.write(path.join(r.repo, 'tracked.txt'), 'tracked\n');
  r.git('add', 'tracked.txt');
  r.git('commit', '-m', 'add tracked', '-q');
  h.write(path.join(r.repo, 'tracked.txt'), 'tracked\nmodified\n');
}

// ─── FEATURE_DIR resolution ──────────────────────────────────────────

test('build-setup#001 resolves feature dir by ID (glob)', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth-system', 'feature/0042F-auth-system');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:feature/0042F-auth-system');
});

test('build-setup#002 resolves feature dir by full slug', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth-system', 'feature/0042F-auth-system');
  const res = run(r, ['0042F-auth-system']);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:feature/0042F-auth-system');
});

test('build-setup#003 not-found feature dir exits 2 with stderr', (t) => {
  const r = repo(t);
  const res = run(r, ['9999F']);
  assert.equal(res.status, 2);
  has(res, '9999F');
  assert.match(res.stderr, /no feature docs match/);
});

test('build-setup#004 ambiguous ID glob exits 2 and lists matches', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth-one', 'feature/0042F-auth-one');
  makeFeature(r, '0042F-auth-two', 'feature/0042F-auth-two');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 2);
  has(res, '0042F-auth-one');
  has(res, '0042F-auth-two');
});

// ─── branch: reading + legacy fallback ───────────────────────────────

test('build-setup#005 reads branch: from about.md frontmatter', (t) => {
  const r = repo(t);
  makeFeature(r, '0007F-billing', 'feature/0007F-billing');
  const res = run(r, ['0007F']);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:feature/0007F-billing');
  hasNot(res, 'DERIVED:true');
});

test('build-setup#006 legacy docs without branch: derive from ID letter (F->feature)', (t) => {
  const r = repo(t);
  makeFeature(r, '0011F-legacy');
  const res = run(r, ['0011F']);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:feature/0011F-legacy');
  has(res, 'DERIVED:true');
});

test('build-setup#007 legacy hotfix docs derive H->hotfix', (t) => {
  const r = repo(t);
  makeFeature(r, '0011H-legacy-fix');
  const res = run(r, ['0011H']);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:hotfix/0011H-legacy-fix');
  has(res, 'DERIVED:true');
});

// ─── Validation (Hard Invariant) ─────────────────────────────────────

test('build-setup#008 invalid branch: format exits 3', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'not-a-valid-branch');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 3);
  assert.match(res.stderr, /invalid branch value/);
});

test('build-setup#009 branch slug not equal to dirname exits 3', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-different');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 3);
  assert.match(res.stderr, /Hard Invariant/);
});

// ─── Idempotent create-or-checkout ───────────────────────────────────

test('build-setup#010 creates new branch (STATE:created)', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 0);
  has(res, 'STATE:created');
  has(res, 'MODE:in-place');
  assert.equal(r.git('branch', '--show-current').stdout.trim(), 'feature/0042F-auth');
});

test('build-setup#011 checks out existing branch (STATE:existing)', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  r.git('branch', 'feature/0042F-auth');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 0);
  has(res, 'STATE:existing');
});

test('build-setup#012 already on target branch (STATE:current)', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  r.git('checkout', '-b', 'feature/0042F-auth', '-q');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 0);
  has(res, 'STATE:current');
});

// ─── Dirty-tree guard (in-place only) ────────────────────────────────

test('build-setup#013 dirty tracked tree exits 5', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  dirtyTracked(r);
  const res = run(r, ['0042F']);
  assert.equal(res.status, 5);
  assert.match(res.stderr, /tracked modifications/);
});

test('build-setup#014 dirty tracked tree on the target branch is allowed (resume)', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  dirtyTracked(r);
  r.git('checkout', '-b', 'feature/0042F-auth', '-q');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 0);
  has(res, 'STATE:current');
});

test('build-setup#015 untracked-only tree is allowed', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  h.write(path.join(r.repo, 'untracked.txt'), 'untracked\n');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 0);
  has(res, 'STATE:created');
});

// ─── Base resolution ─────────────────────────────────────────────────

test('build-setup#016 no verifiable main exits 4', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  r.git('branch', '-m', 'develop');
  const res = run(r, ['0042F']);
  assert.equal(res.status, 4);
  assert.match(res.stderr, /no verifiable main branch/);
});

// ─── Worktree mode ───────────────────────────────────────────────────

test('build-setup#017 worktree mode adds worktree and prints WORKTREE', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  const res = run(r, ['0042F', '--worktree']);
  assert.equal(res.status, 0);
  has(res, 'MODE:worktree');
  has(res, 'WORKTREE:');
  assert.ok(fs.existsSync(path.join(r.repo, '.worktrees', '0042F-auth')), 'worktree dir exists');
});

test('build-setup#018 worktree mode appends .worktrees/ to .gitignore', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  const res = run(r, ['0042F', '--worktree']);
  assert.equal(res.status, 0);
  assert.ok(h.read(path.join(r.repo, '.gitignore')).includes('.worktrees/'));
});

test('build-setup#019 worktree mode copies untracked feature docs into worktree', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  const res = run(r, ['0042F', '--worktree']);
  assert.equal(res.status, 0);
  assert.ok(
    fs.existsSync(
      path.join(r.repo, '.worktrees', '0042F-auth', 'docs', 'features', '0042F-auth', 'about.md'),
    ),
    'feature docs copied into the worktree',
  );
});

test('build-setup#020 worktree mode does not run dirty-tree guard', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  dirtyTracked(r);
  const res = run(r, ['0042F', '--worktree']);
  assert.equal(res.status, 0);
  has(res, 'MODE:worktree');
});

test('build-setup#021 worktree mode over a pre-existing branch reports STATE:existing', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  r.git('branch', 'feature/0042F-auth');
  const res = run(r, ['0042F', '--worktree']);
  assert.equal(res.status, 0);
  has(res, 'MODE:worktree');
  has(res, 'STATE:existing');
  assert.ok(fs.existsSync(path.join(r.repo, '.worktrees', '0042F-auth')), 'worktree dir exists');
});

test('build-setup#022 worktree idempotency (STATE:current when already registered)', (t) => {
  const r = repo(t);
  makeFeature(r, '0042F-auth', 'feature/0042F-auth');
  const first = run(r, ['0042F', '--worktree']);
  assert.equal(first.status, 0);
  const second = run(r, ['0042F', '--worktree']);
  assert.equal(second.status, 0);
  has(second, 'STATE:current');
});
