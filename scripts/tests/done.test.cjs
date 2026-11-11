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
const { DOCS_ROOT, DOCS_LAYOUT, DOCS_BRANCH } = require(path.join(h.SCRIPTS_DIR, 'docs-root.cjs'));
const { DOCS_BRANCH_TYPE } = require(path.join(h.SCRIPTS_DIR, 'get-branch-metadata.cjs'));

// The docs root is a worktree of another branch, never part of the code tree.
// A close-out output the CODE tree still carries is the wiki, so the tests that
// need "a pending file the delivery owns" use a wiki page.
const OWN = '.codeadd/wiki/own.md';

// --- fixture helpers ---------------------------------------------------------

function src(repo, rel, content) {
  return h.write(path.join(repo, rel), content);
}
function commitAll(repo, msg) {
  h.git(repo, ['add', '-A']);
  h.git(repo, ['commit', '-q', '-m', msg || 'fixture']);
}
/** Commit exactly these paths, leaving the rest of the tree as it is. */
function commitOnly(repo, files, msg) {
  h.git(repo, ['add', '--', ...files]);
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
/** A project with a real bare remote and a prepared docs worktree (`p.docs`). */
function withProject(fn) {
  const p = h.makeProject();
  try {
    return fn(p);
  } finally {
    p.cleanup();
  }
}
function docsFile(root, rel) {
  return path.join(root, ...rel.split('/'));
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

test('done#010 context mode: a documentation-type branch is detected as that type', () =>
  withRepo((r) => {
    branchCreate(r.repo, `${DOCS_BRANCH_TYPE}/0004D-readme`);
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.equal(h.parseKV(res.stdout).BRANCH_TYPE, DOCS_BRANCH_TYPE);
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

test('done#018 merge mode: another feature\'s docs never enter the code commit — the docs root is not in the code tree', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    src(p.repo, OWN, 'own\n');
    h.write(docsFile(p.docs, 'features/0001F-test/about.md'), 'own\n');
    h.write(docsFile(p.docs, 'features/0002F-other/about.md'), 'other\n');
    const res = runDone(p.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.equal(h.git(p.repo, ['ls-files', '--', DOCS_ROOT]).stdout.trim(), '');
    assert.notEqual(h.git(p.repo, ['ls-files', OWN]).stdout.trim(), '');
    assert.equal(fs.existsSync(docsFile(p.docs, 'features/0002F-other/about.md')), true);
  }));

test('done#019 commit-push: final QA snapshots are committed on the docs branch, working runs stay local', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    const tests = 'features/0001F-test/_tests';
    h.write(docsFile(p.docs, tests + '/run-001/qa-validation-001.md'), 'working\n');
    h.write(docsFile(p.docs, tests + '/final/run-001/qa-validation-001.md'), 'final\n');
    const res = runDone(p.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /DOCS_COMMIT=committed/);
    assert.notEqual(h.git(p.docs, ['ls-files', tests + '/final/run-001/qa-validation-001.md']).stdout.trim(), '');
    assert.equal(h.git(p.docs, ['ls-files', tests + '/run-001/qa-validation-001.md']).stdout.trim(), '');
    assert.equal(fs.existsSync(docsFile(p.docs, tests + '/run-001/qa-validation-001.md')), true);
  }));

test('done#020 commit-push: blocks when a broad ignore rule in the docs branch would omit final QA evidence', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    h.write(docsFile(p.docs, '.gitignore'), 'features/**/_tests/\n');
    h.git(p.docs, ['add', '.gitignore']);
    h.git(p.docs, ['commit', '-q', '-m', 'ignore rules']);
    h.write(docsFile(p.docs, 'features/0001F-test/_tests/final/run-001/qa-validation-001.md'), 'final\n');
    const res = runDone(p.repo, ['--commit-push']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /Final QA snapshot is ignored/);
  }));

test('done#021 commit-push: blocks modification of an already committed final snapshot', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    const snap = 'features/0001F-test/_tests/final/run-001/qa-validation-001.md';
    h.write(docsFile(p.docs, snap), 'original\n');
    h.git(p.docs, ['add', '-A']);
    h.git(p.docs, ['commit', '-q', '-m', 'add final evidence']);
    h.write(docsFile(p.docs, snap), 'modified\n');
    const res = runDone(p.repo, ['--commit-push']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /Immutable final QA snapshot differs from HEAD/);
  }));

test('done#022 commit-push: blocks deletion of an already committed final snapshot', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    const snap = 'features/0001F-test/_tests/final/run-001/qa-validation-001.md';
    h.write(docsFile(p.docs, snap), 'original\n');
    h.git(p.docs, ['add', '-A']);
    h.git(p.docs, ['commit', '-q', '-m', 'add final evidence']);
    fs.rmSync(docsFile(p.docs, snap), { force: true });
    const res = runDone(p.repo, ['--commit-push']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /Immutable final QA snapshot differs from HEAD/);
  }));

// --- Worktree awareness -----------------------------------------------------

test('done#023 start guard: fails when run from inside a linked worktree', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    h.git(r.repo, ['worktree', 'add', '-b', 'scratch-wt', '.worktrees/scratch-wt', '-q']);
    const wt = path.join(r.repo, '.worktrees', 'scratch-wt');
    const res = runDone(wt);
    assert.notEqual(res.status, 0, res.output);
    assert.match(res.output, /linked worktree not on a feature branch/);
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
    src(r.repo, '.codeadd/wiki/changelog-note.md', '# changelog\n');
    src(r.repo, '.codeadd/wiki/delivered-note.md', 'one line\n');
    commitAll(r.repo, 'wiki notes');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-index', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGE_MODE=direct/);
    assert.match(res.output, /MERGE_COMMIT=OK/);
    assert.doesNotMatch(res.output, /ERROR=Merge conflict detected/);
    assert.equal(h.git(r.repo, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim(), 'main');
    assert.equal(fs.existsSync(path.join(r.repo, '.codeadd/wiki/delivered-note.md')), true);
    assert.equal(h.read(path.join(r.repo, '.codeadd/wiki/delivered-note.md')).split('\n').filter(Boolean).length, 1);
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
    src(r.repo, '.codeadd/wiki/delivered-note.md', 'two\n');
    commitAll(r.repo, 'wiki notes');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0002F-normal', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGE_MODE=squash/);
    assert.match(res.output, /SQUASH=OK/);
    assert.equal(fs.existsSync(path.join(r.repo, '.codeadd/wiki/delivered-note.md')), true);
    assert.equal(h.read(path.join(r.repo, 'app.txt')).trim(), 'feature');
  }));

test('done#028 merge mode: direct mode carries a STEP 6 DELETION, not just additions', () =>
  withRepo((r) => {
    setupRemote(r);
    src(r.repo, 'app.txt', 'base\n');
    src(r.repo, '.codeadd/wiki/prune/discovery.md', 'scaffolding\n');
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
    fs.rmSync(path.join(r.repo, '.codeadd/wiki/prune/discovery.md'), { force: true });
    src(r.repo, '.codeadd/wiki/delivered-note.md', 'three\n');
    commitAll(r.repo, 'wiki notes');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0003F-prune', '-q']);
    const res = runDone(r.repo, ['--merge']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MERGE_MODE=direct/);
    assert.equal(fs.existsSync(path.join(r.repo, '.codeadd/wiki/delivered-note.md')), true);
    assert.equal(fs.existsSync(path.join(r.repo, '.codeadd/wiki/prune/discovery.md')), false);
  }));

// --- Mode split -------------------------------------------------------------

test('done#029 commit-push: commits and pushes the branch, and does NOT switch to main', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, OWN, 'own\n');
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
    src(r.repo, OWN, 'own\n');
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
    src(r.repo, `${DOCS_ROOT}/${DOCS_LAYOUT.delivered}`, '{"v":1,"id":"0099F","name":"other"}\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /INDEX_ENTRY=absent/);
  }));

test('done#041 probe: an UNCOMMITTED entry for this id still reads present', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, `${DOCS_ROOT}/${DOCS_LAYOUT.delivered}`, '{"v":1,"id":"0001F","name":"this one"}\n');
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
    src(r.repo, `${DOCS_ROOT}/features/0001F-test/about.md`, '# about\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.equal(h.parseKV(res.stdout).LEDGER_PATH, `${DOCS_ROOT}/features/0001F-test/build-ledger.md`);
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
    src(r.repo, `${DOCS_ROOT}/features/0001F-test/build-ledger.md`,
      '# Build ledger\nPublish: declined — local merge\nT01: complete (commits a..b)\nPublish: pr-opened https://example.test/pr/9\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /PUBLISH_RECORD=pr-opened/);
    assert.match(res.output, /PUBLISH_RECORD_URL=https:\/\/example\.test\/pr\/9/);
  }));

test('done#047 probe: a declined record carries no url', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, `${DOCS_ROOT}/features/0001F-test/build-ledger.md`, '# Build ledger\nPublish: declined — local merge\n');
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
    src(r.repo, OWN, 'own\n');
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
    src(r.repo, OWN, 'own\n');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    const body = h.git(r.repo, ['log', '-1', '--format=%B']).stdout;
    const parsed = gitInput(r.repo, ['interpret-trailers', '--parse'], body).stdout;
    assert.match(parsed, /Co-Authored-By: ADD/);
  }));

// --- Hotfix branch-name hints (ticket 0048B) ---------------------------------

test('done#057 context: a hotfix branch with no ID is told the exact hotfix shape', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'hotfix/remove-turnstile');
    const res = runDone(r.repo);
    assert.notEqual(res.status, 0, res.output);
    assert.match(res.output, /ERROR=No feature\/hotfix ID found/);
    assert.match(res.output, /HINT=.*hotfix\/\[NNNN\]H-<slug>/);
    assert.match(res.output, /hotfix\/0043H-remove-turnstile/);
  }));

test('done#058 context: a non-hotfix branch with no ID keeps the generic hint', () =>
  withRepo((r) => {
    branchCreate(r.repo, 'feature/foo');
    const res = runDone(r.repo);
    assert.notEqual(res.status, 0, res.output);
    assert.match(res.output, /HINT=Branch must contain \/\[NNNN\]\[L\]-\* \(e\.g\. feature\/0001F-name, refactor\/0002R-cleanup\)/);
    assert.doesNotMatch(res.output, /hotfix\/\[NNNN\]H-<slug>/);
  }));

test('done#059 hints: the Expected example is a hotfix branch, never fix/0002H', () => {
  const source = fs.readFileSync(path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'scripts', 'done.cjs'), 'utf8');
  const expected = source.split('\n').filter((line) => line.includes('HINT=Expected:'));
  assert.equal(expected.length, 2, 'both Expected hints present');
  for (const line of expected) assert.match(line, /hotfix\/0002H-urgent/);
  assert.equal(source.split('\n').some((line) => line.includes('HINT=') && /(^|[^t])fix[/]0002H/.test(line)), false);
});

// --- Linked worktree on the feature branch (ticket 0058B) --------------------

/** A remote, a pushed feature branch, and a linked worktree checked out on it. */
function linkedFixture(r, branch = 'feature/0002F-wt') {
  setupRemote(r);
  const wt = path.join(r.base, 'wt');
  h.git(r.repo, ['worktree', 'add', '-b', branch, wt, '-q']);
  h.git(wt, ['push', '-u', 'origin', branch, '-q']);
  return wt;
}
function remoteTip(r, branch) {
  return h.git(r.repo, ['ls-remote', 'origin', 'refs/heads/' + branch]).stdout.split(/\s+/)[0];
}

test('done#060 worktree: context runs in a linked worktree on the feature branch and says CHECKOUT=linked', () =>
  withRepo((r) => {
    const wt = linkedFixture(r);
    const res = runDone(wt);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CHECKOUT=linked/);
    assert.match(res.output, /CURRENT_BRANCH=feature\/0002F-wt/);
    branchCreate(r.repo, 'feature/0001F-test');
    const primary = runDone(r.repo);
    assert.equal(primary.status, 0, primary.output);
    assert.match(primary.output, /CHECKOUT=primary/);
  }));

test('done#061 worktree: commit-push in the matching linked worktree lands on the branch and the remote', () =>
  withRepo((r) => {
    const wt = linkedFixture(r);
    src(wt, OWN, 'own\n');
    const res = runDone(wt, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /COMMIT=OK/);
    assert.match(res.output, /PUSH_BRANCH=OK/);
    const tip = h.git(wt, ['rev-parse', 'HEAD']).stdout.trim();
    assert.equal(remoteTip(r, 'feature/0002F-wt'), tip);
    assert.notEqual(h.git(wt, ['ls-files', OWN]).stdout.trim(), '');
    assert.equal(h.git(r.repo, ['branch', '--show-current']).stdout.trim(), 'main');
  }));

test('done#062 worktree: --merge refuses in a linked worktree and changes nothing', () =>
  withRepo((r) => {
    const wt = linkedFixture(r);
    src(wt, OWN, 'own\n');
    const head = h.git(wt, ['rev-parse', 'HEAD']).stdout.trim();
    const mainTip = h.git(r.repo, ['rev-parse', 'main']).stdout.trim();
    const res = runDone(wt, ['--merge']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /STATUS=ERROR/);
    assert.match(res.output, /local squash onto main needs the primary checkout/);
    assert.match(res.output, /HINT=.*pull request/);
    assert.doesNotMatch(res.output, /COMMIT=OK|PUSH_BRANCH=OK/);
    assert.equal(h.git(wt, ['rev-parse', 'HEAD']).stdout.trim(), head);
    assert.equal(h.git(wt, ['branch', '--show-current']).stdout.trim(), 'feature/0002F-wt');
    assert.equal(remoteTip(r, 'feature/0002F-wt'), head);
    assert.equal(h.git(r.repo, ['rev-parse', 'main']).stdout.trim(), mainTip);
  }));

test('done#063 worktree: a linked worktree checked out on main refuses', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    const wt = path.join(r.base, 'wt-main');
    h.git(r.repo, ['worktree', 'add', wt, 'main', '-q']);
    const res = runDone(wt);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /linked worktree not on a feature branch/);
  }));

test('done#064 worktree: --cleanup in the linked worktree defers the worktree and local branch deletes', () =>
  withRepo((r) => {
    const wt = linkedFixture(r);
    h.git(r.repo, ['merge', '--no-edit', 'feature/0002F-wt', '-q']);
    h.git(r.repo, ['push', 'origin', 'HEAD', '-q']);
    const sha = h.git(r.repo, ['rev-parse', 'main']).stdout.trim();
    const res = runDone(wt, ['--cleanup', sha]);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /CHECKOUT_MAIN=SKIPPED \(linked worktree\)/);
    assert.match(res.output, /WORKTREE_CLEANUP=DEFERRED/);
    assert.match(res.output, /LOCAL_DELETE=DEFERRED/);
    assert.match(res.output, /HINT=.*git pull origin main.*git worktree remove .*git branch -d feature\/0002F-wt/);
    assert.match(res.output, /CLEANUP=OK/);
    assert.match(res.output, /CURRENT_BRANCH=feature\/0002F-wt/);
    assert.equal(remoteTip(r, 'feature/0002F-wt'), '');
    assert.equal(fs.existsSync(wt), true);
    assert.equal(h.git(r.repo, ['rev-parse', '--verify', 'feature/0002F-wt']).status, 0);
  }));

// --- Scoped staging (ticket 0058B) -------------------------------------------

/** main carries four files; the branch commits to three of them. */
function scopedFixture(r) {
  setupRemote(r);
  src(r.repo, 'a.txt', 'a1\n');
  src(r.repo, 'd.txt', 'd1\n');
  src(r.repo, 'other.txt', 'o1\n');
  src(r.repo, 'src/keep.js', 'k1\n');
  commitAll(r.repo, 'base');
  h.git(r.repo, ['push', 'origin', 'main', '-q']);
  branchCreate(r.repo, 'feature/0001F-test');
  src(r.repo, 'a.txt', 'a2\n');
  src(r.repo, 'd.txt', 'd2\n');
  src(r.repo, 'src/keep.js', 'k2\n');
  commitOnly(r.repo, ['a.txt', 'd.txt', 'src/keep.js'], 'branch work');
  h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
}
function dirtyLines(output) {
  return output.split('\n')
    .filter((l) => l.startsWith('DIRTY_UNRELATED='))
    .map((l) => l.slice('DIRTY_UNRELATED='.length).replace(/\r$/, ''))
    .sort();
}

test('done#065 scoped staging: unrelated dirty files are listed, never staged, and nothing is committed', () =>
  withRepo((r) => {
    scopedFixture(r);
    src(r.repo, 'stray.txt', 'stray\n');
    src(r.repo, 'other.txt', 'o2\n');
    src(r.repo, OWN, 'own\n');
    const head = h.git(r.repo, ['rev-parse', 'HEAD']).stdout.trim();
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /STATUS=ERROR/);
    assert.match(res.output, /DIRTY_UNRELATED_COUNT=2/);
    assert.deepEqual(dirtyLines(res.output), ['other.txt', 'stray.txt']);
    assert.match(res.output, /HINT=.*[Cc]ommit or stash/);
    assert.equal(h.git(r.repo, ['diff', '--cached', '--name-only']).stdout.trim(), '');
    assert.equal(h.git(r.repo, ['rev-parse', 'HEAD']).stdout.trim(), head);
  }));

test('done#066 scoped staging: a file staged by hand outside the delivery is refused', () =>
  withRepo((r) => {
    scopedFixture(r);
    src(r.repo, 'stray.txt', 'stray\n');
    h.git(r.repo, ['add', 'stray.txt']);
    src(r.repo, OWN, 'own\n');
    const head = h.git(r.repo, ['rev-parse', 'HEAD']).stdout.trim();
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 1, res.output);
    assert.deepEqual(dirtyLines(res.output), ['stray.txt']);
    assert.equal(h.git(r.repo, ['diff', '--cached', '--name-only']).stdout.trim(), 'stray.txt');
    assert.equal(h.git(r.repo, ['rev-parse', 'HEAD']).stdout.trim(), head);
  }));

test('done#067 scoped staging: branch-diff files, siblings and the wiki are committed', () =>
  withRepo((r) => {
    scopedFixture(r);
    src(r.repo, 'a.txt', 'a3\n');
    fs.rmSync(path.join(r.repo, 'd.txt'), { force: true });
    src(r.repo, 'src/new.js', 'n\n');
    src(r.repo, OWN, 'own\n');
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /COMMIT=OK/);
    const shown = h.git(r.repo, ['show', '--name-status', '--format=', 'HEAD']).stdout.replace(/\r/g, '');
    assert.match(shown, /^M\ta\.txt$/m);
    assert.match(shown, /^D\td\.txt$/m);
    assert.match(shown, /^A\tsrc\/new\.js$/m);
    assert.match(shown, /^A\t\.codeadd\/wiki\/own\.md$/m);
    assert.equal(h.git(r.repo, ['status', '--porcelain']).stdout.trim(), '');
  }));

test('done#068 scoped staging: context lists the same unrelated paths and still exits 0', () =>
  withRepo((r) => {
    scopedFixture(r);
    src(r.repo, 'stray.txt', 'stray\n');
    src(r.repo, 'other.txt', 'o2\n');
    const res = runDone(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /DIRTY_UNRELATED_COUNT=2/);
    assert.deepEqual(dirtyLines(res.output), ['other.txt', 'stray.txt']);
  }));

test('done#069 scoped staging: with no merge base context says unknown and commit-push stops', () =>
  withRepo((r) => {
    setupRemote(r);
    h.git(r.repo, ['checkout', '--orphan', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['rm', '-rf', '-q', '--ignore-unmatch', '.']);
    h.git(r.repo, ['commit', '--allow-empty', '-q', '-m', 'unrelated history']);
    src(r.repo, 'stray.txt', 'stray\n');
    const ctx = runDone(r.repo);
    assert.equal(ctx.status, 0, ctx.output);
    assert.match(ctx.output, /DIRTY_UNRELATED_COUNT=unknown/);
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 1, res.output);
    assert.match(res.output, /STATUS=ERROR/);
    assert.match(res.output, /HINT=.*fetch/);
    assert.equal(h.git(r.repo, ['diff', '--cached', '--name-only']).stdout.trim(), '');
  }));

test('done#070 scoped staging: commit-push run from a subdirectory stages root-relative paths', () =>
  withRepo((r) => {
    scopedFixture(r);
    src(r.repo, 'a.txt', 'a3\n');
    src(r.repo, 'src/new.js', 'n\n');
    const res = runDone(path.join(r.repo, 'src'), ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /COMMIT=OK/);
    const shown = h.git(r.repo, ['show', '--name-status', '--format=', 'HEAD']).stdout.replace(/\r/g, '');
    assert.match(shown, /^M\ta\.txt$/m);
    assert.match(shown, /^A\tsrc\/new\.js$/m);
  }));

test('done#071 commit-push: a wiki page removed with git rm is committed, not handed to git add', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, OWN, 'own\n');
    src(r.repo, '.codeadd/wiki/gone.md', 'gone\n');
    commitAll(r.repo, 'wiki pages');
    h.git(r.repo, ['push', '-u', 'origin', 'feature/0001F-test', '-q']);
    h.git(r.repo, ['rm', '-q', '.codeadd/wiki/gone.md']);
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.doesNotMatch(res.output, /did not match/);
    assert.match(res.output, /COMMIT=OK/);
    assert.match(res.output, /PUSH_BRANCH=OK/);
    const shown = h.git(r.repo, ['show', '--name-status', '--format=', 'HEAD']).stdout.replace(/\r/g, '');
    assert.match(shown, /^D\t\.codeadd\/wiki\/gone\.md$/m);
  }));

// --- The docs branch at close-out (L2.4) -------------------------------------
//
// The docs root is a worktree of `codeadd-docs`. The code commit never carries it;
// after the code commit the delivery-index entry records `code_sha` and `pr`, and
// the docs worktree is committed and pushed to its own branch.

function deliveryRecord() {
  return JSON.stringify({
    id: '0001F', layer: 'product', by: 'done', status: 'live', name: 'the delivery',
    words: 'delivery words', commits: ['a1b2c3d'], origin: `${DOCS_ROOT}/features/0001F-test/`,
    items: [{ what: 'app entry', at: 'src/app.js', find: 'appMarker' }],
  });
}
function bareLines(p, file) {
  const shown = h.git(p.bare, ['show', `${DOCS_BRANCH}:${file}`]);
  assert.equal(shown.status, 0, shown.output);
  return shown.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

test('done#072 L2.4 commit-push: the code commit holds no docs path; the docs branch holds the index line with code_sha and pr', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    src(p.repo, 'src/app.js', 'const appMarker = 1;\n');
    commitAll(p.repo, 'feat: app');
    h.write(docsFile(p.docs, 'features/0001F-test/about.md'), '# about\n');
    const wrote = h.runScript('delivered', ['write'], { cwd: p.repo, input: deliveryRecord() });
    assert.equal(wrote.status, 0, wrote.output);
    src(p.repo, OWN, 'own\n');
    const gh = stubGh(p.base, JSON.stringify({ number: 42 }));

    const res = runDone(p.repo, ['--commit-push'], { env: { GH_BIN: gh } });
    assert.equal(res.status, 0, res.output);
    const kv = h.parseKV(res.stdout);
    assert.equal(kv.DOCS_GUARD, 'clean');
    assert.equal(kv.INDEX_STAMP, 'stamped');
    assert.equal(kv.DOCS_COMMIT, 'committed');
    assert.equal(kv.DOCS_PUSH, 'pushed');
    assert.equal(kv.PUSH_BRANCH, 'OK');
    assert.equal(kv.STATUS, 'SUCCESS');

    // The code side: nothing under the docs root, no gitlink, nothing left staged.
    const codeSha = h.git(p.repo, ['rev-parse', 'HEAD']).stdout.trim();
    const names = h.git(p.repo, ['diff', '--name-only', 'main...HEAD']).stdout;
    assert.doesNotMatch(names, new RegExp(DOCS_ROOT.replace(/\./g, '\\.')));
    assert.match(names, /\.codeadd\/wiki\/own\.md/);
    assert.equal(h.git(p.repo, ['ls-files', '-s']).stdout.split('\n').filter((l) => l.startsWith('160000')).length, 0);
    assert.equal(h.git(p.repo, ['ls-files', '--', DOCS_ROOT]).stdout.trim(), '');
    assert.equal(h.git(p.repo, ['diff', '--cached', '--name-only']).stdout.trim(), '');

    // The docs side, read from the REMOTE: the entry, its code_sha and pr, v still 1.
    const lines = bareLines(p, DOCS_LAYOUT.delivered);
    const last = lines[lines.length - 1];
    assert.equal(last.id, '0001F');
    assert.equal(last.code_sha, codeSha);
    assert.equal(last.pr, 42);
    assert.equal(last.v, 1);
    assert.equal(h.git(p.bare, ['show', `${DOCS_BRANCH}:features/0001F-test/about.md`]).stdout, '# about\n');
    assert.equal(h.git(p.docs, ['status', '--porcelain']).stdout.trim(), '');
  }));

test('done#073 commit-push: `git add -A` can never stage the docs worktree', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    h.write(docsFile(p.docs, 'features/0001F-test/about.md'), '# about\n');
    h.git(p.repo, ['add', '-A']);
    const staged = h.git(p.repo, ['diff', '--cached', '--name-only']).stdout;
    assert.doesNotMatch(staged, new RegExp(DOCS_ROOT.replace(/\./g, '\\.')));
    assert.equal(h.git(p.repo, ['ls-files', '-s']).stdout.split('\n').filter((l) => l.startsWith('160000')).length, 0);
  }));

test('done#074 commit-push: a misplaced Code Addiction output is filed under the docs root before the code commit', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    src(p.repo, 'stray/spec.md', '---\ntype: feature\nid: 0001F\n---\n# spec\n');
    src(p.repo, OWN, 'own\n');
    const res = runDone(p.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    assert.equal(h.parseKV(res.stdout).DOCS_GUARD, 'moved:1');
    assert.equal(fs.existsSync(path.join(p.repo, 'stray', 'spec.md')), false);
    assert.equal(fs.existsSync(docsFile(p.docs, 'features/spec.md')), true);
    assert.doesNotMatch(h.git(p.repo, ['show', '--name-only', '--format=', 'HEAD']).stdout, /spec\.md/);
    assert.equal(h.parseKV(res.stdout).DOCS_COMMIT, 'committed');
  }));

test('done#075 commit-push: a docs push the remote rejects is reported, the local docs commit is kept, the close-out still succeeds', () =>
  withProject((p) => {
    branchCreate(p.repo, 'feature/0001F-test');
    const hook = path.join(p.bare, 'hooks', 'pre-receive');
    h.write(hook, `#!/bin/sh\nwhile read old new ref; do\n  case "$ref" in refs/heads/${DOCS_BRANCH}) echo "no docs here" >&2; exit 1;; esac\ndone\nexit 0\n`);
    fs.chmodSync(hook, 0o755);
    h.write(docsFile(p.docs, 'features/0001F-test/about.md'), '# about\n');
    src(p.repo, OWN, 'own\n');
    const res = runDone(p.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    const kv = h.parseKV(res.stdout);
    assert.equal(kv.DOCS_COMMIT, 'committed');
    assert.equal(kv.DOCS_PUSH, 'rejected');
    assert.equal(kv.PUSH_BRANCH, 'OK');
    assert.equal(kv.STATUS, 'SUCCESS');
    assert.match(h.git(p.docs, ['log', '-1', '--format=%s']).stdout, /close-out/);
  }));

test('done#076 commit-push: with no docs root the close-out still succeeds and says so on the docs lines', () =>
  withRepo((r) => {
    setupRemote(r);
    branchCreate(r.repo, 'feature/0001F-test');
    src(r.repo, OWN, 'own\n');
    const res = runDone(r.repo, ['--commit-push']);
    assert.equal(res.status, 0, res.output);
    const kv = h.parseKV(res.stdout);
    assert.equal(kv.DOCS_GUARD, 'clean');
    assert.equal(kv.INDEX_STAMP, 'skipped');
    assert.equal(kv.DOCS_COMMIT, 'failed');
    assert.equal(kv.STATUS, 'SUCCESS');
  }));
