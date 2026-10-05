'use strict';
// =============================================================================
// done.test.cjs — native port of framwork/.codeadd/scripts/tests/done.bats (F27)
// =============================================================================
// Target: framwork/.codeadd/scripts/done.cjs (F15, product). RED-FIRST: the
// .cjs entry does not exist yet, so every assertion below is intentionally Red
// until F15 lands.
//
// The old Bats case id is kept in the test name (`done#NNN`) so the tracked case
// map can be reconciled one-to-one.
//
// CONTRACT UNDER TEST (from the shell source):
//   - context/default prints CURRENT_BRANCH/MAIN_BRANCH/BRANCH_TYPE/FEATURE_NUMBER,
//     the pending-change counts, CHANGED_COUNT/CHANGED_FILES and the route probes;
//     none of the probes is a gate and the mode exits 0.
//   - --commit-push commits the working tree and pushes the branch, and does NOT
//     switch to main.
//   - --merge runs the whole local sequence (commit-push, dry-run, checkout,
//     squash-or-direct, push, cleanup) deterministically — never by catching a
//     conflict and retrying.
//   - --cleanup <MERGE_SHA> REQUIRES its merge sha: absent it refuses every
//     deletion rather than guessing, and a refused deletion still exits 0.
//   - a linked worktree start guard refuses to run, but a subdirectory of the
//     primary checkout must not false-positive.
//   - failure codes: caller/guard failures exit 1; probes never gate.
//
// ⛔ PORTABLE `gh` SEAM (test-owned contract; F15 must honour it): the route
//    probes consult gh only when `GH_BIN` is unset. When `GH_BIN` is set it is
//    the ONLY gh considered, invoked as `process.execPath <GH_BIN> <gh args>`.
//    This is what makes "no gh", "open PR", "merged PR" and "no PR" testable
//    without a shell stub and without touching the real `gh` on the machine.
//    `runDone` therefore sets GH_BIN to a nonexistent path by default, so every
//    context test reports PR_STATE=no-gh deterministically.
//
// Run: node --test scripts/tests/done.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers.cjs');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// --- fixture helpers ---------------------------------------------------------

function src(repo, rel, content) {
  return h.write(path.join(repo, rel), content);
}
function commitAll(repo, msg) {
  h.git(repo, ['add', '-A']);
  h.git(repo, ['commit', '-q', '-m', msg || 'fixture']);
}
function branchCreate(repo, name) {
  return h.git(repo, ['checkout', '-b', name, '-q']);
}
/** A disposable bare remote, exactly like the Bats common_setup `setup_remote`. */
function setupRemote(r) {
  const remote = path.join(r.base, 'remote');
  h.git(r.base, ['init', '--bare', '-q', remote]);
  h.git(r.repo, ['remote', 'add', 'origin', remote]);
  h.git(r.repo, ['push', '-u', 'origin', 'main', '-q']);
  return remote;
}
function noGhPath(r) {
  return path.join(r.base, '__no_gh__');
}
/**
 * Run the native entry with the default no-gh seam. `opts.env` overrides it,
 * which is how the PR probes inject their stub.
 */
function runDone(repo, args = [], opts = {}) {
  const env = Object.assign({ GH_BIN: path.join(repo, '__no_gh__') }, opts.env);
  return h.runScript('done', args, { cwd: repo, env });
}
/**
 * A stub gh. `body` empty means "no PR": `pr view` exits 1. Otherwise the body
 * is printed for `pr view`. `auth status` always succeeds. The seam contract
 * runs it as `node <stub> <args>`.
 */
function stubGh(base, body) {
  const p = path.join(base, 'gh-stub.cjs');
  const lines = [
    "'use strict';",
    "const args = process.argv.slice(2);",
    "if (args[0] === 'auth' && args[1] === 'status') process.exit(0);",
    "if (args[0] === 'pr' && args[1] === 'view') {",
    body ? '  process.stdout.write(' + JSON.stringify(body + '\n') + ');' : '  process.exit(1);',
    '  process.exit(0);',
    '}',
    'process.exit(0);',
    '',
  ];
  return h.write(p, lines.join('\n'));
}
function gitInput(cwd, args, input) {
  const res = spawnSync('git', args, { cwd, input, encoding: 'utf8', env: h.cleanEnv(), shell: false });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}
function withRepo(fn) {
  const r = h.makeRepo();
  try {
    return fn(r);
  } finally {
    r.cleanup();
  }
}

// --- Context mode (default) -------------------------------------------------

test('done#001 context mode: shows feature branch info', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CURRENT_BRANCH=feature\/0001F-test/);
    assert.match(res.output, /MAIN_BRANCH=main/);
    assert.match(res.output, /BRANCH_TYPE=feature/);
    assert.match(res.output, /FEATURE_NUMBER=0001F/);
  }));

test('done#002 context mode: detects hotfix', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'hotfix/0001H-urgent');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /BRANCH_TYPE=hotfix/);
    assert.match(res.output, /FEATURE_NUMBER=0001H/);
  }));

test('done#003 context mode: detects fix', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'fix/0001H-bugfix');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /BRANCH_TYPE=fix/);
  }));

test('done#004 context mode: reports pending changes', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'newfile.txt', 'change\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /HAS_UNCOMMITTED=true/);
    assert.match(res.output, /UNTRACKED_COUNT=1/);
  }));

test('done#005 context mode: reports no pending changes', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /HAS_UNCOMMITTED=false/);
  }));

// --- Errors -----------------------------------------------------------------

test('done#006 fails in detached HEAD', () =>
  withRepo((r) => {
    h.git(r.repo, ['checkout', '--detach', '-q']);
    const res = runDone(r.repo);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /STATUS=ERROR/);
    assert.match(res.output, /detached/);
  }));

test('done#007 context mode: fails on branch without ID', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'random-branch');
    const res = runDone(r.repo);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /STATUS=ERROR/);
    assert.match(res.output, /No feature\/hotfix ID found/);
  }));

// --- Generic branch prefixes (PRD0007) --------------------------------------

test('done#008 context mode: refactor/0002R-cleanup detected as refactor', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'refactor/0002R-cleanup');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /BRANCH_TYPE=refactor/);
    assert.match(res.output, /FEATURE_NUMBER=0002R/);
  }));

test('done#009 context mode: chore/0003C-deps detected as chore', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'chore/0003C-deps');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /BRANCH_TYPE=chore/);
    assert.match(res.output, /FEATURE_NUMBER=0003C/);
  }));

test('done#010 context mode: docs/0004D-readme detected as docs', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'docs/0004D-readme');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /BRANCH_TYPE=docs/);
    assert.match(res.output, /FEATURE_NUMBER=0004D/);
  }));

// --- Merge mode guards ------------------------------------------------------

test('done#011 merge mode: fails when already on main (no ID)', () =>
  withRepo((r) => {
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /STATUS=ERROR/);
  }));

test('done#012 merge mode: fails on branch without ID', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'random-branch');
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /No feature\/hotfix ID found/);
  }));

// --- Context mode: edge cases -----------------------------------------------

test('done#013 context mode: reports multiple simultaneous changes (modified + staged + untracked)', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'existing.txt', 'original\n');
    commitAll(r.repo, 'add file');
    src(r.repo, 'existing.txt', 'modified\n');
    src(r.repo, 'staged.txt', 'staged content\n');
    h.git(r.repo, ['add', 'staged.txt']);
    src(r.repo, 'newfile.txt', 'untracked\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MODIFIED_COUNT=1/);
    assert.match(res.output, /STAGED_COUNT=1/);
    assert.match(res.output, /UNTRACKED_COUNT=1/);
    assert.match(res.output, /HAS_UNCOMMITTED=true/);
  }));

test('done#014 context mode: emits WARNING when origin/main does not exist on remote', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /WARNING=Remote branch origin\/main not found/);
  }));

// --- Merge mode: execution scenarios ----------------------------------------

test('done#015 merge mode: fails without remote configured (push failure)', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo, ['--merge']);
    assert.notEqual(res.status, 0, res.output);
    // The merge phase ran, and a push that never reached a remote must not be
    // reported as a success.
    assert.match(res.output, /BRANCH=feature\/0001F-test/);
    assert.match(res.output, /COMMIT=SKIPPED/);
    assert.doesNotMatch(res.output, /PUSH_BRANCH=OK/);
    assert.doesNotMatch(res.output, /STATUS=SUCCESS/);
  }));

test('done#016 merge mode: detects merge conflict on squash', () =>
  withRepo((r) => {
    setupRemote(r);
    src(r.repo, 'shared.txt', 'original content\n');
    commitAll(r.repo, 'add shared file');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    branchCreate(r.repo, 'feature/0001F-conflict');
    src(r.repo, 'shared.txt', 'feature version\n');
    commitAll(r.repo, 'feature change');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-conflict', '-q']);
    h.git(r.repo, ['checkout', 'main', '-q']);
    src(r.repo, 'shared.txt', 'main conflicting version\n');
    commitAll(r.repo, 'main change');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    h.git(r.repo, ['checkout', 'feature/0001F-conflict', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /Merge conflict detected/);
  }));

test('done#017 merge mode: skips commit when branch has no commits beyond main', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGE_COMMIT=SKIPPED/);
  }));

// --- Feature-scoped staging -------------------------------------------------

test('done#018 merge mode: does not sweep another feature\'s untracked docs into the commit', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/about.md', 'own\n');
    src(r.repo, 'docs/features/0002F-other/about.md', 'other\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.notEqual(h.git(r.repo, ['ls-files', 'docs/features/0001F-test/about.md']).stdout.trim(), '');
    assert.equal(h.git(r.repo, ['ls-files', 'docs/features/0002F-other/about.md']).stdout.trim(), '');
    assert.equal(fs.existsSync(path.join(r.repo, 'docs/features/0002F-other/about.md')), true);
  }));

test('done#019 merge mode: commits final QA snapshots and leaves ignored working runs local', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/_tests/run-001/qa-validation-001.md', 'working\n');
    src(r.repo, 'docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md', 'final\n');
    src(r.repo, '.gitignore', '# ADD QA evidence - managed by add.qa-setup\ndocs/features/**/_tests/run-*/\n# END ADD QA evidence\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.notEqual(h.git(r.repo, ['ls-files', 'docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md']).stdout.trim(), '');
    assert.equal(h.git(r.repo, ['ls-files', 'docs/features/0001F-test/_tests/run-001/qa-validation-001.md']).stdout.trim(), '');
    assert.equal(fs.existsSync(path.join(r.repo, 'docs/features/0001F-test/_tests/run-001/qa-validation-001.md')), true);
  }));

test('done#020 merge mode: blocks when a broad ignore rule would omit final QA evidence', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md', 'final\n');
    src(r.repo, '.gitignore', 'docs/features/**/_tests/\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /Final QA snapshot is ignored/);
  }));

test('done#021 merge mode: blocks modification of an already tracked final snapshot', () =>
  withRepo((r) => {
    setupRemote(r);
    src(r.repo, 'docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md', 'original\n');
    commitAll(r.repo, 'add final evidence');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md', 'modified\n');
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /Immutable final QA snapshot differs from HEAD/);
  }));

test('done#022 merge mode: blocks deletion of an already tracked final snapshot', () =>
  withRepo((r) => {
    setupRemote(r);
    src(r.repo, 'docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md', 'original\n');
    commitAll(r.repo, 'add final evidence');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    branchCreate(r.repo, 'feature/0001F-test');
    fs.rmSync(path.join(r.repo, 'docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md'), { force: true });
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /Immutable final QA snapshot differs from HEAD/);
  }));

// --- Worktree awareness -----------------------------------------------------

test('done#023 start guard: fails when run from inside a linked worktree', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['worktree', 'add', '-b', 'feature/0002F-wt', '.worktrees/0002F-wt', '-q']);
    const wt = path.join(r.repo, '.worktrees', '0002F-wt');
    const res = runDone(wt);
    assert.notEqual(res.status, 0, res.output);
    assert.match(res.output, /primary checkout/);
  }));

test('done#024 start guard: does not false-positive from a subdirectory of the primary checkout', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'sub/dir/.keep', '');
    const sub = path.join(r.repo, 'sub', 'dir');
    const res = runDone(sub);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CURRENT_BRANCH=feature\/0001F-test/);
    assert.doesNotMatch(res.output, /linked worktree/);
    assert.doesNotMatch(res.output, /primary checkout/);
  }));

test('done#025 merge mode: worktree-cleanup step does not break a normal (no-worktree) merge', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'src.txt', 'code\n');
    commitAll(r.repo, 'feat');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CLEANUP=OK/);
  }));

// --- Merge-mode selection: the /add-pull-request route ----------------------

test('done#026 merge mode: main already carries the branch -> direct mode, entry lands once', () =>
  withRepo((r) => {
    setupRemote(r);
    src(r.repo, 'app.txt', 'base\n');
    commitAll(r.repo, 'base');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    branchCreate(r.repo, 'feature/0001F-index');
    src(r.repo, 'app.txt', 'feature\n');
    commitAll(r.repo, 'feat');
    h.git(r.repo, ['checkout', 'main', '-q']);
    src(r.repo, 'app.txt', 'feature\n');
    commitAll(r.repo, 'squash from PR');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    h.git(r.repo, ['checkout', 'feature/0001F-index', '-q']);
    src(r.repo, 'docs/features/0001F-index/changelog.md', '# changelog\n');
    src(r.repo, 'docs/delivered.jsonl', '{"v":1,"id":"0001F"}\n');
    commitAll(r.repo, 'docs');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-index', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGE_MODE=direct/);
    assert.match(res.output, /MERGE_COMMIT=OK/);
    assert.doesNotMatch(res.output, /ERROR=Merge conflict detected/);
    assert.equal(h.git(r.repo, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim(), 'main');
    assert.equal(fs.existsSync(path.join(r.repo, 'docs/delivered.jsonl')), true);
    assert.equal(h.read(path.join(r.repo, 'docs/delivered.jsonl')).split('\n').filter(Boolean).length, 1);
    assert.equal(h.read(path.join(r.repo, 'app.txt')).trim(), 'feature');
  }));

test('done#027 merge mode: a normal branch still takes the squash route', () =>
  withRepo((r) => {
    setupRemote(r);
    src(r.repo, 'app.txt', 'base\n');
    commitAll(r.repo, 'base');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    branchCreate(r.repo, 'feature/0002F-normal');
    src(r.repo, 'app.txt', 'feature\n');
    commitAll(r.repo, 'feat');
    src(r.repo, 'docs/delivered.jsonl', '{"v":1,"id":"0002F"}\n');
    commitAll(r.repo, 'docs');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0002F-normal', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGE_MODE=squash/);
    assert.match(res.output, /SQUASH=OK/);
    assert.equal(fs.existsSync(path.join(r.repo, 'docs/delivered.jsonl')), true);
    assert.equal(h.read(path.join(r.repo, 'app.txt')).trim(), 'feature');
  }));

test('done#028 merge mode: direct mode carries a STEP 6 DELETION, not just additions', () =>
  withRepo((r) => {
    setupRemote(r);
    src(r.repo, 'app.txt', 'base\n');
    src(r.repo, 'docs/features/0003F-prune/discovery.md', 'scaffolding\n');
    commitAll(r.repo, 'docs scaffolding');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    branchCreate(r.repo, 'feature/0003F-prune');
    src(r.repo, 'app.txt', 'feature\n');
    commitAll(r.repo, 'feat');
    h.git(r.repo, ['checkout', 'main', '-q']);
    src(r.repo, 'app.txt', 'feature\n');
    commitAll(r.repo, 'squash from PR');
    h.git(r.repo, ['push', 'origin', 'main', '-q']);
    h.git(r.repo, ['checkout', 'feature/0003F-prune', '-q']);
    fs.rmSync(path.join(r.repo, 'docs/features/0003F-prune/discovery.md'), { force: true });
    src(r.repo, 'docs/delivered.jsonl', '{"v":1,"id":"0003F"}\n');
    commitAll(r.repo, 'docs');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0003F-prune', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGE_MODE=direct/);
    assert.equal(fs.existsSync(path.join(r.repo, 'docs/delivered.jsonl')), true);
    assert.equal(fs.existsSync(path.join(r.repo, 'docs/features/0003F-prune/discovery.md')), false);
  }));

// --- Mode split -------------------------------------------------------------

test('done#029 commit-push: commits and pushes the branch, and does NOT switch to main', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/about.md', 'own\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /COMMIT=OK/);
    assert.match(res.output, /PUSH_BRANCH=OK/);
    assert.doesNotMatch(res.output, /CHECKOUT_MAIN=OK/);
    assert.doesNotMatch(res.output, /PUSH_MAIN=OK/);
    assert.equal(h.git(r.repo, ['branch', '--show-current']).stdout.trim(), 'feature/0001F-test');
  }));

test('done#030 commit-push: a clean tree still pushes and reports COMMIT=SKIPPED', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /COMMIT=SKIPPED/);
    assert.match(res.output, /PUSH_BRANCH=OK/);
  }));

test('done#031 every mode refuses on main, for the reason that actually fires', () =>
  withRepo((r) => {
    setupRemote(r);
    for (const mode of ['--merge', '--commit-push', '--cleanup']) {
      const res = runDone(r.repo, [mode]);
      assert.equal(res.status, 1, mode + '\n' + res.output);
      assert.match(res.output, /No feature\/hotfix ID found/, mode);
    }
  }));

test('done#032 cleanup: run from the feature branch, it switches to main and deletes it', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['checkout', 'main', '-q']);
    h.git(r.repo, ['merge', '--no-edit', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['push', 'origin', 'HEAD', '-q']);
    h.git(r.repo, ['checkout', 'feature/0001F-test', '-q']);
    const sha = h.git(r.repo, ['rev-parse', 'main']).stdout.trim();
    const res = runDone(r.repo, ['--cleanup', sha]);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CLEANUP=OK/);
    assert.equal(h.git(r.repo, ['branch', '--show-current']).stdout.trim(), 'main');
    assert.notEqual(h.git(r.repo, ['rev-parse', '--verify', 'feature/0001F-test']).status, 0);
  }));

test('done#033 an unknown flag is NOT a mode — it falls through to context', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--not-a-mode']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CHANGED_COUNT=/);
    assert.doesNotMatch(res.output, /PUSH_BRANCH=OK/);
  }));

test('done#034 merge: still emits every key of the whole sequence', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/about.md', 'own\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /COMMIT=OK/);
    assert.match(res.output, /PUSH_BRANCH=OK/);
    assert.match(res.output, /CHECKOUT_MAIN=OK/);
    assert.match(res.output, /PUSH_MAIN=OK/);
    assert.match(res.output, /CLEANUP=OK/);
    assert.match(res.output, /STATUS=SUCCESS/);
  }));

// --- Context-mode probes ----------------------------------------------------

test('done#035 probe: no gh on PATH -> PR_STATE=no-gh, and the script still exits 0', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo, [], { env: { GH_BIN: noGhPath(r) } });
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PR_STATE=no-gh/);
  }));

test('done#036 probe: an open PR -> PR_STATE=open with its url and head sha', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const stub = stubGh(r.base, JSON.stringify({ state: 'OPEN', url: 'https://example.test/pr/7', headRefOid: 'deadbeef', mergeCommit: null }));
    const res = runDone(r.repo, [], { env: { GH_BIN: stub } });
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PR_STATE=open/);
    assert.match(res.output, /PR_URL=https:\/\/example\.test\/pr\/7/);
    assert.match(res.output, /PR_HEAD_SHA=deadbeef/);
  }));

test('done#037 probe: a merged PR -> PR_STATE=merged with its merge commit', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const stub = stubGh(r.base, JSON.stringify({ state: 'MERGED', url: 'https://example.test/pr/7', headRefOid: 'deadbeef', mergeCommit: { oid: 'cafebabe' } }));
    const res = runDone(r.repo, [], { env: { GH_BIN: stub } });
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PR_STATE=merged/);
    assert.match(res.output, /PR_MERGE_COMMIT=cafebabe/);
  }));

test('done#038 probe: gh present but no PR for this branch -> PR_STATE=none', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const stub = stubGh(r.base, '');
    const res = runDone(r.repo, [], { env: { GH_BIN: stub } });
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PR_STATE=none/);
  }));

test('done#039 probe: no delivered.jsonl at all -> INDEX_ENTRY=no-index', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /INDEX_ENTRY=no-index/);
  }));

test('done#040 probe: delivered.jsonl without this id -> INDEX_ENTRY=absent', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/delivered.jsonl', '{"v":1,"id":"0099F","name":"other"}\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /INDEX_ENTRY=absent/);
  }));

test('done#041 probe: an UNCOMMITTED entry for this id still reads present', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/delivered.jsonl', '{"v":1,"id":"0001F","name":"this one"}\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /INDEX_ENTRY=present/);
  }));

test('done#042 probe: MERGED_ON_MAIN=no on a branch main has not taken', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'f.txt', 'x\n');
    commitAll(r.repo, 'work');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGED_ON_MAIN=no/);
  }));

test('done#043 probe: MERGED_ON_MAIN=unknown when origin/main does not resolve', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGED_ON_MAIN=unknown/);
  }));

test('done#044 probe: LEDGER_PATH points at the feature\'s build-ledger.md', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/about.md', '# about\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /LEDGER_PATH=docs\/features\/0001F-test\/build-ledger\.md/);
  }));

test('done#045 probe: no ledger -> PUBLISH_RECORD=none', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PUBLISH_RECORD=none/);
  }));

test('done#046 probe: the LAST Publish line wins — the ledger is a log, not a set', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/build-ledger.md',
      '# Build ledger\nPublish: declined — local merge\nT01: complete (commits a..b)\nPublish: pr-opened https://example.test/pr/9\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PUBLISH_RECORD=pr-opened/);
    assert.match(res.output, /PUBLISH_RECORD_URL=https:\/\/example\.test\/pr\/9/);
  }));

test('done#047 probe: a declined record carries no url', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/build-ledger.md', '# Build ledger\nPublish: declined — local merge\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PUBLISH_RECORD=declined/);
    assert.equal((res.stdout.match(/^PUBLISH_RECORD_URL=$/gm) || []).length, 1, res.output);
  }));

test('done#048 probe: every pre-existing context field still reports', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    for (const key of [
      'CURRENT_BRANCH', 'MAIN_BRANCH', 'BRANCH_TYPE', 'FEATURE_NUMBER',
      'MODIFIED_COUNT', 'STAGED_COUNT', 'UNTRACKED_COUNT', 'HAS_UNCOMMITTED',
      'CHANGED_COUNT', 'CHANGED_FILES',
    ]) {
      assert.match(res.output, new RegExp(key + '='), key + ' missing');
    }
  }));

// --- Post-merge proof + push dry-run ----------------------------------------

test('done#049 dry-run: an unpushable main stops BEFORE any local merge commit exists', () =>
  withRepo((r) => {
    const remote = setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'f.txt', 'x\n');
    commitAll(r.repo, 'work');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const mainBefore = h.git(r.repo, ['rev-parse', 'main']).stdout.trim();

    // main's remote ref advances behind our back: a push of main is a
    // non-fast-forward. This is what a client-side dry-run CAN see.
    const clone = path.join(r.base, 'other');
    h.git(r.base, ['clone', '-q', remote, clone]);
    h.git(clone, ['config', 'user.email', 't@t.t']);
    h.git(clone, ['config', 'user.name', 't']);
    h.git(clone, ['checkout', '-B', 'main', 'origin/main', '-q']);
    h.git(clone, ['commit', '--allow-empty', '-m', 'someone else', '-q']);
    h.git(clone, ['push', 'origin', 'main', '-q']);

    const res = runDone(r.repo, ['--merge']);
    assert.notEqual(res.status, 0, res.output);
    assert.match(res.output, /PUSH_MAIN=REFUSED/);
    // The point: nothing local was written.
    assert.equal(h.git(r.repo, ['rev-parse', 'main']).stdout.trim(), mainBefore);
  }));

test('done#050 dry-run: a server-side pre-receive hook is NOT what this catches', () =>
  withRepo((r) => {
    const remote = setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'f.txt', 'x\n');
    commitAll(r.repo, 'work');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    h.write(path.join(remote, 'hooks', 'pre-receive'),
      '#!/bin/bash\nwhile read -r _old _new ref; do\n  case "$ref" in refs/heads/main) echo "protected branch" >&2; exit 1 ;; esac\ndone\nexit 0\n');
    const res = runDone(r.repo, ['--merge']);
    // The dry-run reports main pushable, because the hook never ran for it.
    assert.match(res.output, /PUSH_MAIN=PUSHABLE/);
  }));

test('done#051 cleanup: a fetch that fails refuses every deletion and still exits 0', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['checkout', 'main', '-q']);
    h.git(r.repo, ['merge', '--no-edit', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['push', 'origin', 'HEAD', '-q']);
    const mergeSha = h.git(r.repo, ['rev-parse', 'HEAD']).stdout.trim();
    h.git(r.repo, ['checkout', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['remote', 'set-url', 'origin', path.join(r.base, 'nowhere.git')]);

    const res = runDone(r.repo, ['--cleanup', mergeSha]);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CLEANUP=SKIPPED/);
    assert.match(res.output, /CHECK=1/);
    assert.equal(h.git(r.repo, ['rev-parse', '--verify', 'feature/0001F-test']).status, 0);
  }));

test('done#052 cleanup: a merge sha origin/main does not contain refuses every deletion', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'f.txt', 'x\n');
    commitAll(r.repo, 'work');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const unmerged = h.git(r.repo, ['rev-parse', 'HEAD']).stdout.trim();
    const res = runDone(r.repo, ['--cleanup', unmerged]);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CLEANUP=SKIPPED/);
    assert.match(res.output, /CHECK=2/);
    assert.equal(h.git(r.repo, ['rev-parse', '--verify', 'feature/0001F-test']).status, 0);
  }));

test('done#053 cleanup: both checks passing deletes the branch', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['checkout', 'main', '-q']);
    h.git(r.repo, ['merge', '--no-edit', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['push', 'origin', 'HEAD', '-q']);
    const mergeSha = h.git(r.repo, ['rev-parse', 'HEAD']).stdout.trim();
    h.git(r.repo, ['checkout', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--cleanup', mergeSha]);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CLEANUP=OK/);
    assert.notEqual(h.git(r.repo, ['rev-parse', '--verify', 'feature/0001F-test']).status, 0);
  }));

test('done#054 cleanup: no resolvable merge sha refuses the deletions rather than guessing', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--cleanup'], { env: { GH_BIN: noGhPath(r) } });
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CLEANUP=SKIPPED/);
    assert.equal(h.git(r.repo, ['rev-parse', '--verify', 'feature/0001F-test']).status, 0);
  }));

// --- The commit body (regression net) ---------------------------------------

test('done#055 commit body: the co-author trailer sits at column 0, not indented', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/about.md', 'own\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    const body = h.git(r.repo, ['log', '-1', '--format=%B']).stdout;
    assert.match(body, /^Co-Authored-By: /m);
    assert.doesNotMatch(body, /^[ \t]+Co-Authored-By: /m);
  }));

test('done#056 commit body: git itself parses the trailer', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, 'docs/features/0001F-test/about.md', 'own\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    const body = h.git(r.repo, ['log', '-1', '--format=%B']).stdout;
    const parsed = gitInput(r.repo, ['interpret-trailers', '--parse'], body).stdout;
    assert.match(parsed, /Co-Authored-By: ADD/);
  }));
