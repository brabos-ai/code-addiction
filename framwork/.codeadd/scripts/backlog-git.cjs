/**
 * backlog-git.cjs — Git primitives for the board clone: clone, fetch, ahead /
 * behind, fast-forward, rebase-once, push of one named branch, `git show` at a
 * sha, the root commit and its trailers, and the durable recovery refs.
 *
 * The board is one branch (`board`) of the project's own remote, checked out
 * once per project outside every code branch. backlog-board.cjs resolves that
 * clone, locks it and syncs it; backlog-commit.cjs writes to it. This module
 * is the git underneath both. It knows nothing about tickets and nothing about
 * where the clone lives.
 *
 * CORE AND STORAGE REMAIN PROCESS- AND GIT-FREE. Everything here runs one
 * binary: git, through argument arrays with no shell — native git with
 * shell:false, never bash, never WSL. Reads go through backlog-cli.cjs and the
 * board module; none of it needs a write primitive.
 *
 * THE DURABLE RECOVERY CONTRACT. Every commit prepared for publication gets a
 * recovery ref `refs/codeadd/backlog-recovery/<sha>` created atomically
 * (expected-absent) BEFORE any rebase, and the invocation remembers exactly
 * which refs IT created. A ref that already matched protects the commit but is
 * not owned. After a verified push, only owned refs whose value still matches
 * are deleted; a moved ref stays and is reported. A rebased commit is
 * protected at its new sha. The refs live in the clone.
 *
 * Failures that are answers rather than crashes come back as `{ ok: false,
 * reason }` or `{ fetched|pushed: false, reason }`: clone-failed,
 * remote-unreachable, fetch-failed, not-fast-forward, rebase-conflict,
 * abort-failed, push-refused, recovery-ref-failed, recovery-ref-moved,
 * recovery-ref-delete-failed.
 *
 * Dependencies: Node >= 22.19.0 built-ins and git. No bash, no WSL, no stdin.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const BACKLOG_FILE = 'docs/backlog.jsonl';
const DEFS_FILE = 'docs/backlog.definitions.json';
const RECOVERY_NS = 'refs/codeadd/backlog-recovery';
const ZERO_SHA = '0'.repeat(40);

// ---------------------------------------------------------------------------
// The git runner
// ---------------------------------------------------------------------------

class GitError extends Error {
  constructor(message, detail = {}) {
    super(message);
    this.name = 'GitError';
    Object.assign(this, detail);
  }
}

/**
 * Run one git command with an explicit cwd and no shell anywhere in between.
 * Throws GitError on a non-zero exit; `{ allowFailure: true }` returns a
 * { status, stdout, stderr } result instead, for the probes that treat a
 * failure as an answer.
 */
function run(args, cwd, { allowFailure = false, input, env } = {}) {
  let proc;
  try {
    proc = execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      input,
      env: env ? { ...process.env, ...env } : process.env,
    });
  } catch (e) {
    const outcome = {
      status: (e.status === null || e.status === undefined) ? 1 : e.status,
      stdout: e.stdout || '',
      stderr: (e.stderr || '') + (e.message ? '\n' + String(e.message) : ''),
      args,
      cwd,
    };
    if (allowFailure) return outcome;
    throw new GitError(
      `git ${args[0]} failed in ${cwd}: ${((e.stderr || e.message || '') + '').trim()}`,
      outcome,
    );
  }
  return { status: 0, stdout: proc, stderr: '', args, cwd };
}

// ---------------------------------------------------------------------------
// Working-tree conditions
// ---------------------------------------------------------------------------

/**
 * The working-tree conditions that decide safety. `staged` counts index-only
 * entries, `dirty` counts work-tree edits and untracked files. `rebasing`
 * reads the rebase marker files; it is cheap and it decides a destructive
 * policy, so it is never skipped.
 */
function conditionsAt(root) {
  const gitDir = run(['rev-parse', '--absolute-git-dir'], root, { allowFailure: true });
  const rebasing = gitDir.status === 0 && ['REBASE_HEAD', 'rebase-merge', 'rebase-apply']
    .some((marker) => fs.existsSync(path.join(gitDir.stdout.trim(), marker)));
  const out = run(['status', '--porcelain'], root, { allowFailure: true });
  if (out.status !== 0 || gitDir.status !== 0) {
    return { readable: false, dirty: false, staged: false, unmerged: false, rebasing, entries: [] };
  }
  const entries = [];
  let dirty = false; let staged = false; let unmerged = false;
  for (const line of (out.stdout || '').split('\n')) {
    if (!line.trim()) continue;
    const xy = line.slice(0, 2);
    entries.push(line);
    if (xy === 'UU' || xy === 'AA' || xy === 'DD' || xy.charAt(0) === 'U' || xy.charAt(1) === 'U') {
      unmerged = true;
      continue;
    }
    if (xy.charAt(0) !== ' ' && !(xy.charAt(0) === '?' && xy.charAt(1) === '?')) staged = true;
    if (xy.charAt(1) !== ' ' || (xy.charAt(0) === '?' && xy.charAt(1) === '?')) dirty = true;
  }
  return { readable: true, dirty, staged, unmerged, rebasing, entries };
}

// ---------------------------------------------------------------------------
// Refs: the durable recovery layer
// ---------------------------------------------------------------------------

/** The ref's current value, or null when it does not resolve. */
function readRef(root, ref) {
  const out = run(['rev-parse', '--verify', '--quiet', ref], root, { allowFailure: true });
  return out.status === 0 ? out.stdout.trim() : null;
}

/**
 * Atomically protect one commit: create the recovery ref with an expected
 * ABSENT value, then verify what landed. Returns the ref name and whether
 * THIS call created it — a previously-matching ref protects the commit but
 * is never owned, and never deleted by the invocation that finds it.
 */
function protectCommit(root, sha) {
  const ref = `${RECOVERY_NS}/${sha}`;
  const create = run(['update-ref', ref, sha, ZERO_SHA], root, { allowFailure: true });
  const created = create.status === 0;
  const settled = readRef(root, ref);
  // The verifier decides: the ref must name this commit, whatever wrote it.
  if (settled !== sha) return { ok: false, ref, reason: 'recovery-ref-failed' };
  return { ok: true, ref, created, owned: created };
}

/**
 * Delete an owned recovery ref through its expected value. A ref whose value
 * changed after creation stays put and is reported; a plain delete failure
 * is reported too. Nothing here deletes a ref this invocation did not own.
 */
function releaseOwnedRef(root, ref, expected) {
  const del = run(['update-ref', '-d', ref, expected], root, { allowFailure: true });
  if (del.status === 0) return { ok: true, deleted: true, ref };
  const now = readRef(root, ref);
  if (now !== null && now !== expected) return { ok: true, deleted: false, moved: true, ref, reason: 'recovery-ref-moved' };
  return { ok: true, deleted: false, ref, reason: 'recovery-ref-delete-failed' };
}

// ---------------------------------------------------------------------------
// Ancestry
// ---------------------------------------------------------------------------

/** merge-base --is-ancestor, as a plain boolean probe. */
function isAncestor(root, a, b) {
  return run(['merge-base', '--is-ancestor', a, b], root, { allowFailure: true }).status === 0;
}

function headSha(root) {
  const out = run(['rev-parse', 'HEAD'], root, { allowFailure: true });
  if (out.status !== 0) return null;
  return out.stdout.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// The board clone: primitives for ONE named branch of a single-branch clone
// ---------------------------------------------------------------------------
// backlog-board.cjs composes these. Every failure is an answer (`ok: false`
// plus a reason), never a throw, because the callers degrade instead of dying.

/** `git clone --single-branch --branch <branch> <url> <dir>`. */
function cloneBranch(url, dir, branch) {
  const parent = path.dirname(dir);
  fs.mkdirSync(parent, { recursive: true });
  const out = run(['clone', '--quiet', '--single-branch', '--branch', branch, url, dir], parent, { allowFailure: true });
  return out.status === 0 ? { ok: true } : { ok: false, reason: 'clone-failed', detail: out.stderr.trim() };
}

/** Does `<branch>` exist on `url`? `unknown` when the remote cannot be asked. */
function remoteHasBranch(url, branch, cwd) {
  const out = run(['ls-remote', '--exit-code', '--heads', url, `refs/heads/${branch}`], cwd, { allowFailure: true });
  if (out.status === 0) return { ok: true, exists: true };
  if (out.status === 2) return { ok: true, exists: false };
  return { ok: false, reason: 'remote-unreachable' };
}

/** Fetch one branch into `refs/remotes/origin/<branch>`. */
function fetchBranch(clone, branch) {
  const out = run(['fetch', '--quiet', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], clone, { allowFailure: true });
  return out.status === 0 ? { fetched: true } : { fetched: false, reason: 'fetch-failed' };
}

/** Commits HEAD has that `origin/<branch>` lacks (ahead) and the reverse (behind). */
function aheadBehind(clone, branch) {
  const out = run(['rev-list', '--left-right', '--count', `HEAD...refs/remotes/origin/${branch}`], clone, { allowFailure: true });
  if (out.status !== 0) return { ok: false };
  const [ahead, behind] = out.stdout.trim().split(/\s+/).map(Number);
  return { ok: true, ahead, behind };
}

/** Move the checked-out branch to `origin/<branch>`; only a fast-forward. */
function fastForward(clone, branch) {
  const out = run(['merge', '--ff-only', '--quiet', `refs/remotes/origin/${branch}`], clone, { allowFailure: true });
  return out.status === 0 ? { ok: true, sha: headSha(clone) } : { ok: false, reason: 'not-fast-forward' };
}

/**
 * Rebase the clone's commits onto `origin/<branch>`, once. A conflict is
 * aborted and verified, as in rebaseOntoFetchHead.
 */
function rebaseOnBranch(clone, branch) {
  const rebase = run(['rebase', `refs/remotes/origin/${branch}`], clone, { allowFailure: true });
  if (rebase.status === 0) return { ok: true, sha: headSha(clone) };
  const abort = run(['rebase', '--abort'], clone, { allowFailure: true });
  const scan = conditionsAt(clone);
  if (abort.status !== 0 || !scan.readable || scan.rebasing || scan.unmerged) {
    return { ok: false, reason: 'abort-failed', conflicted: true };
  }
  return { ok: false, reason: 'rebase-conflict', conflicted: true };
}

/** push HEAD:refs/heads/<branch> of the clone; a refusal is an answer. */
function pushBranch(clone, branch) {
  const out = run(['push', '--quiet', 'origin', `HEAD:refs/heads/${branch}`], clone, { allowFailure: true });
  return out.status === 0 ? { pushed: true } : { pushed: false, reason: 'push-refused' };
}

/** `git show <sha>:<file>` — the file's text at a commit, or null when absent. */
function showAt(clone, sha, file) {
  const out = run(['show', `${sha}:${file}`], clone, { allowFailure: true });
  return out.status === 0 ? out.stdout : null;
}

/** The sha a ref resolves to, or null. */
function resolveSha(clone, ref) {
  return readRef(clone, ref);
}

/** The first root commit reachable from `ref`, or null. */
function rootCommit(clone, ref) {
  const out = run(['rev-list', '--max-parents=0', ref], clone, { allowFailure: true });
  if (out.status !== 0) return null;
  const roots = out.stdout.trim().split('\n').filter(Boolean);
  return roots.length ? roots[roots.length - 1] : null;
}

/**
 * The trailers of one commit message as { Key: value }, last one winning.
 * A trailer is a `Key: value` line in the final paragraph.
 */
function commitTrailers(clone, ref) {
  const out = run(['log', '-1', '--format=%B', ref], clone, { allowFailure: true });
  if (out.status !== 0) return null;
  const paragraphs = out.stdout.replace(/\s+$/, '').split(/\n\s*\n/);
  const last = paragraphs[paragraphs.length - 1] || '';
  const trailers = {};
  for (const line of last.split('\n')) {
    const m = /^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/.exec(line);
    if (m) trailers[m[1]] = m[2];
  }
  return trailers;
}

/**
 * Commit identity fallback for a clone made on a machine with no git user:
 * `-c` arguments to put before the subcommand, empty when one is configured.
 */
function identityArgs(clone) {
  const name = run(['config', 'user.name'], clone, { allowFailure: true });
  const email = run(['config', 'user.email'], clone, { allowFailure: true });
  const args = [];
  if (name.status !== 0 || !name.stdout.trim()) args.push('-c', 'user.name=codeadd-board');
  if (email.status !== 0 || !email.stdout.trim()) args.push('-c', 'user.email=board@codeadd.invalid');
  return args;
}

/** Stage the named files and commit them in the clone. */
function commitFiles(clone, files, message) {
  const id = identityArgs(clone);
  const add = run(['add', '--', ...files], clone, { allowFailure: true });
  if (add.status !== 0) return { committed: false, failed: true, sha: headSha(clone) };
  const staged = run(['diff', '--cached', '--quiet'], clone, { allowFailure: true });
  if (staged.status === 0) return { committed: false, sha: headSha(clone) };
  const commit = run([...id, 'commit', '--quiet', '-m', message], clone, { allowFailure: true });
  if (commit.status !== 0) return { committed: false, failed: true, sha: headSha(clone) };
  return { committed: true, sha: headSha(clone) };
}

module.exports = {
  GitError,
  run,
  conditionsAt,
  readRef,
  protectCommit,
  releaseOwnedRef,
  isAncestor,
  headSha,
  cloneBranch,
  remoteHasBranch,
  fetchBranch,
  aheadBehind,
  fastForward,
  rebaseOnBranch,
  pushBranch,
  showAt,
  resolveSha,
  rootCommit,
  commitTrailers,
  identityArgs,
  commitFiles,
  RECOVERY_NS,
  BACKLOG_FILE,
  DEFS_FILE,
};
