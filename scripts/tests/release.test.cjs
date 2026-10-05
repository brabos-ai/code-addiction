'use strict';
// =============================================================================
// scripts/release.cjs — native characterization (F27 red → F21 green)
// =============================================================================
// Characterizes `scripts/release.sh` (read in full) against the intended native
// entry `scripts/release.cjs`. The shell entry takes NO arguments and operates
// on the current repository, in this order:
//
//   1. refuse outside a git repository
//   2. refuse a dirty worktree (`git diff-index --quiet HEAD --`)
//   3. remember the current branch
//   4. `git fetch origin`
//   5. `git checkout main` then `git pull origin main`
//   6. `git checkout production` (create from main when absent), pull when present
//   7. `git merge main` into production
//   8. `git push origin production`
//   9. restore the remembered branch
//
// The native entry must preserve every transition and exit code. Version/lock
// checks and the annotated tag/notes/push belong to the companion
// `create-release-tag` entry and are characterized in
// create-release-tag.test.cjs — release.cjs does not create tags.
//
// ⛔ NO REAL REMOTE. Every fixture is a disposable local bare repository under
//    a temp dir. The child's git is pinned to the disposable repository via
//    GIT_DIR/GIT_WORK_TREE so that even a cwd bug cannot reach this checkout's
//    origin. The real production release is never run here.
//
// ⛔ RED TODAY: scripts/release.cjs does not exist yet (F21). These assertions
//    are the contract F21 implements against, not a claim that the migration
//    is complete.
//
// Run: node --test scripts/tests/release.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const h = require('./helpers.cjs');

// --- disposable remote fixture ----------------------------------------------

/** Pin every git process the child spawns to `repo`, whatever cwd it chooses. */
function pinnedEnv(repo) {
  return {
    GIT_DIR: path.join(repo, '.git'),
    GIT_WORK_TREE: repo,
  };
}

/**
 * A throwaway repo on `main` with one tracked file, plus a local bare `origin`
 * that already carries `main`. Nothing here can reach a real remote.
 */
function makeRemoteRepo() {
  const r = h.makeRepo({ prefix: 'codeadd-release-' });
  h.write(path.join(r.repo, 'README.md'), 'seed\n');
  r.git('add', '-A');
  r.git('commit', '-q', '-m', 'seed file');

  const remote = path.join(r.base, 'origin.git');
  h.git(r.base, ['init', '--bare', '--initial-branch=main', '-q', remote]);
  r.git('remote', 'add', 'origin', remote);
  r.git('push', '-q', '-u', 'origin', 'main');
  return { ...r, remote };
}

/** The ref names a bare remote advertises, e.g. `refs/heads/production`. */
function remoteRefs(remote) {
  const res = h.git(path.dirname(remote), ['ls-remote', remote]);
  return res.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t')[1]);
}

function runRelease(repo) {
  return h.runRootScript('release', [], { cwd: repo, env: pinnedEnv(repo) });
}

// --- contract ---------------------------------------------------------------

test('release refuses a dirty worktree and never creates production', () => {
  const r = makeRemoteRepo();
  try {
    h.write(path.join(r.repo, 'README.md'), 'changed but not committed\n');
    const res = runRelease(r.repo);
    assert.notEqual(res.status, 0, 'a dirty worktree must be refused');
    assert.match(h.stripAnsi(res.output), /uncommitted/i);
    assert.equal(
      remoteRefs(r.remote).includes('refs/heads/production'),
      false,
      'production must not be pushed when the worktree is dirty',
    );
  } finally {
    r.cleanup();
  }
});

test('release refuses a directory that is not a git repository', () => {
  const dir = h.mkTmp('codeadd-norepo-');
  try {
    const res = h.runRootScript('release', [], { cwd: dir });
    assert.notEqual(res.status, 0, 'a non-repository must be refused');
    assert.match(h.stripAnsi(res.output), /not a git repository/i);
  } finally {
    h.rmrf(dir);
  }
});

test('release creates production from main when the branch is absent and pushes it', () => {
  const r = makeRemoteRepo();
  try {
    const res = runRelease(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.ok(
      remoteRefs(r.remote).includes('refs/heads/production'),
      'production must reach origin',
    );
    const mainSha = r.git('rev-parse', 'main').stdout.trim();
    const prodSha = r.git('rev-parse', 'production').stdout.trim();
    assert.equal(prodSha, mainSha, 'production starts from main');
  } finally {
    r.cleanup();
  }
});

test('release merges main into an existing production and pushes the result', () => {
  const r = makeRemoteRepo();
  try {
    r.git('checkout', '-q', '-b', 'production');
    r.git('push', '-q', '-u', 'origin', 'production');
    r.git('checkout', '-q', 'main');
    h.write(path.join(r.repo, 'README.md'), 'seed\nsecond\n');
    r.git('commit', '-q', '-am', 'second');

    const res = runRelease(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    const mainSha = r.git('rev-parse', 'main').stdout.trim();
    const prodSha = r.git('rev-parse', 'production').stdout.trim();
    assert.equal(prodSha, mainSha, 'main is merged into production');
    assert.ok(remoteRefs(r.remote).includes('refs/heads/production'));
  } finally {
    r.cleanup();
  }
});

test('release restores the branch it started on', () => {
  const r = makeRemoteRepo();
  try {
    r.git('checkout', '-q', '-b', 'feature/restore-me');
    const res = runRelease(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    const branch = r.git('branch', '--show-current').stdout.trim();
    assert.equal(branch, 'feature/restore-me', 'the original branch is restored');
    assert.ok(remoteRefs(r.remote).includes('refs/heads/production'));
  } finally {
    r.cleanup();
  }
});

test('release creates no tag: tag publication is the tag entry own route', () => {
  const r = makeRemoteRepo();
  try {
    const res = runRelease(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    const tags = remoteRefs(r.remote).filter((ref) => ref.startsWith('refs/tags/'));
    assert.deepEqual(tags, [], 'release.cjs must not publish tags');
  } finally {
    r.cleanup();
  }
});
