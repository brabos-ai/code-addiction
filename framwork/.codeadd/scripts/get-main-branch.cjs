#!/usr/bin/env node
/**
 * get-main-branch.cjs — Detect the project's main branch with cascading fallback.
 *
 * Native port of get-main-branch.sh. Every git call is one binary through an
 * argument array — no shell, no WSL, no stdin. The detection order is unchanged:
 *
 *   1. refs/remotes/origin/HEAD (works in correctly cloned repositories)
 *   2. refs/remotes/origin/main
 *   3. refs/remotes/origin/master
 *   4. refs/heads/main (repository without a remote, or without a fetch)
 *   5. refs/heads/master
 *
 * Unlike the shell original, step 1 takes the symbolic ref's target directly
 * instead of piping through sed; a symbolic ref that resolves to an empty name
 * falls through exactly as the empty `MAIN` did.
 *
 * Exit codes:
 *   0 — branch found with certainty (verified in the repository)
 *   1 — not a git repository
 *   2 — no default branch found (no hardcoded fallback)
 *
 * Dependencies: Node >= 18 built-ins and git. No bash, no WSL, no stdin.
 */

'use strict';

const { spawnSync } = require('node:child_process');

/** One git invocation, shell-free; a spawn failure is a non-zero status. */
function git(cwd, args) {
  const res = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    status: res.status === null || res.status === undefined ? 1 : res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

/**
 * The main branch, or a typed failure. `reason` is 'not-a-git-repo' when the
 * guard fails and 'no-base-branch' when every probe misses; the entry maps
 * those to exit 1 and exit 2 respectively.
 */
function discoverMainBranch(cwd = process.cwd()) {
  if (git(cwd, ['rev-parse', '--git-dir']).status !== 0) {
    return { ok: false, reason: 'not-a-git-repo' };
  }

  const originHead = git(cwd, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
  if (originHead.status === 0) {
    const branch = originHead.stdout.trim().replace(/^refs\/remotes\/origin\//, '');
    if (branch) return { ok: true, branch };
  }

  for (const remote of ['main', 'master']) {
    if (git(cwd, ['show-ref', '--verify', `refs/remotes/origin/${remote}`]).status === 0) {
      return { ok: true, branch: remote };
    }
  }

  for (const local of ['main', 'master']) {
    if (git(cwd, ['show-ref', '--verify', `refs/heads/${local}`]).status === 0) {
      return { ok: true, branch: local };
    }
  }

  return { ok: false, reason: 'no-base-branch' };
}

function main() {
  const result = discoverMainBranch(process.cwd());
  if (result.ok) {
    process.stdout.write(`${result.branch}\n`);
    process.exit(0);
  }
  if (result.reason === 'not-a-git-repo') {
    process.stderr.write('ERROR: current directory is not a git repository.\n');
    process.exit(1);
  }
  process.stderr.write('ERROR: no main branch found (main/master absent locally and remotely).\n');
  process.exit(2);
}

module.exports = { git, discoverMainBranch };

if (require.main === module) main();
