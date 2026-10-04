/**
 * backlog-git.cjs — Native Git routing, publication and durable recovery.
 *
 * Chooses the operation root for a write the way backlog-commit.sh did: base
 * discovery mirrors get-main-branch.sh (origin/HEAD, remote main/master,
 * local main/master); the current branch equal to the base commits
 * DIRECTLY, and everything else — a feature branch, a detached HEAD, a
 * linked-worktree caller — captures through a DETACHED, LOCKED
 * `.worktrees/backlog` created at the base. Not being a git repository or
 * having no base branch is a result, not a failure: the caller tree carries
 * the write uncommitted, and the caller of this module reports it.
 *
 * CORE AND STORAGE REMAIN PROCESS- AND GIT-FREE. Everything here runs one
 * binary: git, through argument arrays with no shell — native git with
 * shell:false, never bash, never WSL. Reads go through the local CLI alone
 * and need nothing in this module.
 *
 * THE DURABLE RECOVERY CONTRACT. Every commit prepared for publication gets
 * a recovery ref `refs/codeadd/backlog-recovery/<sha>` created atomically
 * (expected-absent) BEFORE any rebase or cleanup, and the invocation
 * remembers exactly which refs IT created. A ref that already matched
 * protects the commit but is not owned. After a verified push, only owned
 * refs whose value still matches are deleted; a moved ref stays and is
 * reported. A rebased commit is protected at its new sha before any
 * discard. An unchecked-out base advances only through a verified
 * fast-forward (compare-and-swap update-ref); a checked-out base is never
 * advanced out-of-band. The caller tree's unrelated staged and unstaged
 * changes survive every commit — the commit is the two board paths by name,
 * never the caller's index — and a dirty caller tree degrades the rebase
 * instead of stashing anything away.
 *
 * THE OLD CONTRACT IS PRESERVED: ROUTE / BASE_BRANCH / TICKET_ID / SHA /
 * PUSHED / DEGRADED keep their names and meanings, the named old degradation
 * reasons keep their spellings (not-a-git-repo, no-base-branch,
 * worktree-failed, no-remote, push-refused, rebase-conflict,
 * base-checked-out-elsewhere), and new failure classes get specific new
 * reasons (fetch-failed, caller-worktree-dirty, base-advance-failed,
 * recovery-ref-failed, recovery-ref-moved, recovery-ref-delete-failed,
 * worktree-lock-failed) rather than claiming a push that did not happen.
 *
 * THIS MODULE IS NOT ALL-FROM-SCRATCH SAFE FOR EVERY COMBINATION — the
 * combinations route through backlog-commit.cjs, which owns the
 * orchestration: parse once, capture the record once, choose an operation
 * root, call the same domain operation as the local CLI, and render the
 * publication result. The functions here are the git primitives it composes.
 *
 * Dependencies: Node >= 18 built-ins and git. No bash, no WSL, no stdin.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const BACKLOG_FILE = 'docs/backlog.jsonl';
const DEFS_FILE = 'docs/backlog.definitions.json';
const WORKTREE = '.worktrees/backlog';
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
function run(args, cwd, { allowFailure = false, input } = {}) {
  let proc;
  try {
    proc = execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      input,
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
// Discovery and routing probes
// ---------------------------------------------------------------------------

/**
 * Mirror of get-main-branch.sh: origin/HEAD, then origin/main, then
 * origin/master, then local main, then local master. Nothing else.
 */
function discoverBase(root) {
  const repo = run(['rev-parse', '--git-dir'], root, { allowFailure: true });
  if (repo.status !== 0) return { ok: false, reason: 'not-a-git-repo' };

  const originHead = run(['symbolic-ref', 'refs/remotes/origin/HEAD'], root, { allowFailure: true });
  if (originHead.status === 0) {
    const branch = originHead.stdout.trim().replace(/^refs\/remotes\/origin\//, '');
    if (branch) return { ok: true, branch };
  }
  for (const remote of ['main', 'master']) {
    if (run(['show-ref', '--verify', `refs/remotes/origin/${remote}`], root, { allowFailure: true }).status === 0) {
      return { ok: true, branch: remote };
    }
  }
  for (const local of ['main', 'master']) {
    if (run(['show-ref', '--verify', `refs/heads/${local}`], root, { allowFailure: true }).status === 0) {
      return { ok: true, branch: local };
    }
  }
  return { ok: false, reason: 'no-base-branch' };
}

/** The current branch name, or '' when HEAD is detached. */
function currentBranch(root) {
  const out = run(['rev-parse', '--abbrev-ref', 'HEAD'], root, { allowFailure: true });
  if (out.status !== 0) return '';
  const name = out.stdout.trim();
  return name === 'HEAD' ? '' : name;
}

/** `worktree list --porcelain`, parsed. */
function listWorktrees(root) {
  const listing = run(['worktree', 'list', '--porcelain'], root, { allowFailure: true });
  if (listing.status !== 0) return [];
  const trees = [];
  let tree = {};
  const flush = () => {
    if (Object.keys(tree).length) { trees.push(tree); tree = {}; }
  };
  for (const line of (listing.stdout || '').split('\n')) {
    const sep = line.indexOf(' ');
    const key = sep === -1 ? line : line.slice(0, sep);
    const value = sep === -1 ? '' : line.slice(sep + 1);
    if (key === 'worktree') { flush(); tree.worktree = value; }
    else if (key === 'head' || key === 'branch') tree[key] = value;
    else if (key === 'locked') tree.locked = value || true;
    else if (key === 'prunable') tree.prunable = value || true;
    else if (key === 'bare') tree.bare = true;
    else if (key === 'detached') tree.detached = true;
  }
  flush();
  return trees;
}

/** Our fixed capture worktree's registration, or null when absent. */
function findOurWorktree(root) {
  const abs = path.resolve(path.join(root, WORKTREE));
  for (const tree of listWorktrees(root)) {
    if (path.resolve(tree.worktree) === abs) return tree;
  }
  return null;
}

/**
 * Names for the base branch across every registered worktree — the one test
 * that decides whether the base may move out-of-band.
 */
function worktreesCheckedOutAt(root, baseBranch) {
  return listWorktrees(root).filter((t) => t.branch === `refs/heads/${baseBranch}`);
}

/**
 * The working-tree conditions that decide safety. `staged` counts index-only
 * entries, `dirty` counts work-tree edits and untracked files. `rebasing`
 * reads the rebase marker files; it is cheap and it decides a destructive
 * policy, so it is never skipped.
 */
function conditionsAt(root) {
  const rebasing = fs.existsSync(path.join(root, '.git', 'REBASE_HEAD')) ||
    fs.existsSync(path.join(root, 'REBASE_HEAD'));
  const out = run(['status', '--porcelain'], root, { allowFailure: true });
  if (out.status !== 0) {
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
// The verified fast-forward: the only way a base branch moves here
// ---------------------------------------------------------------------------

/** merge-base --is-ancestor, as a plain boolean probe. */
function isAncestor(root, a, b) {
  return run(['merge-base', '--is-ancestor', a, b], root, { allowFailure: true }).status === 0;
}

/**
 * Advance an UNCHECKED-OUT base branch to newSha only when that is a
 * fast-forward from expectedOld, through one compare-and-swap update-ref.
 * Divergence moves nothing and answers why — the caller keeps a recovery
 * ref and reports the degradation.
 */
function advanceBaseIfUnlocked(root, baseBranch, newSha, expectedOld) {
  if (worktreesCheckedOutAt(root, baseBranch).length) {
    return { advanced: false, reason: 'base-checked-out-elsewhere' };
  }
  if (!isAncestor(root, expectedOld, newSha)) {
    return { advanced: false, reason: 'base-advance-failed' };
  }
  const updated = run(['update-ref', `refs/heads/${baseBranch}`, newSha, expectedOld], root, { allowFailure: true });
  if (updated.status !== 0) return { advanced: false, reason: 'base-advance-failed' };
  return { advanced: true, reason: null };
}

// ---------------------------------------------------------------------------
// Fetch / rebase / push
// ---------------------------------------------------------------------------

/** Fetch the base branch; every failure is an answer, never a rebase trigger. */
function fetchBase(root, baseBranch) {
  const fetch = run(['fetch', 'origin', baseBranch], root, { allowFailure: true });
  if (fetch.status !== 0) return { fetched: false, reason: 'fetch-failed' };
  const head = run(['rev-parse', '--verify', '--quiet', 'FETCH_HEAD'], root, { allowFailure: true });
  if (head.status !== 0) return { fetched: false, reason: 'fetch-failed' };
  return { fetched: true, fetchHead: head.stdout.trim() };
}

/**
 * Rebase the operation root onto FETCH_HEAD. A conflict is ABORTED, never
 * resolved, and the abort is verified: a repository left mid-rebase is
 * worse than an unpushed commit. An abort failure moves nothing and names
 * the recovery state it left.
 */
function rebaseOntoFetchHead(root) {
  const rebase = run(['rebase', 'FETCH_HEAD'], root, { allowFailure: true });
  if (rebase.status === 0) return { ok: true, sha: headSha(root) };
  const cond = conditionsAt(root);
  const abort = run(['rebase', '--abort'], root, { allowFailure: true });
  const scan = conditionsAt(root);
  if (abort.status !== 0) {
    return { ok: false, reason: 'abort-failed', conflicted: true, cond: scan, preCond: cond };
  }
  return { ok: false, reason: 'rebase-conflict', conflicted: true };
}

function headSha(root) {
  const out = run(['rev-parse', 'HEAD'], root, { allowFailure: true });
  if (out.status !== 0) return null;
  return out.stdout.trim().toLowerCase();
}

/** push HEAD:refs/heads/<base>; a refusal is an answer. */
function pushToBase(root, baseBranch) {
  const push = run(['push', 'origin', `HEAD:refs/heads/${baseBranch}`], root, { allowFailure: true });
  if (push.status !== 0) return { pushed: false, reason: 'push-refused' };
  return { pushed: true };
}

// ---------------------------------------------------------------------------
// Commit: the two board paths by name, never the caller's index
// ---------------------------------------------------------------------------

/** Whether anything under the named paths differs, against HEAD or index. */
function pathsDirty(root, paths) {
  const st = run(['status', '--porcelain', '--', ...paths], root, { allowFailure: true });
  if (st.status !== 0) return false;
  return Boolean((st.stdout || '').trim());
}

/**
 * Commit ONLY the board paths. Preserves unrelated staged and unstaged
 * caller work: explicit paths, per-path, never `-A` and never `.`, never
 * the caller's whole index. Returns the new HEAD, or the existing one when
 * the bytes did not move — a no-op mutation is distinguished by COMMITTED.
 *
 * A board path that is still UNTRACKED (the first write on a fresh
 * repository) must be staged before the commit can carry it — `--only`
 * commits the named paths' content, but an untracked path skips the
 * stage step and a bare `--only` alone leaves it out.
 */
function commitBoard(root, paths, message) {
  if (!pathsDirty(root, paths)) {
    return { committed: false, sha: headSha(root) };
  }
  // Stage exactly these paths — this is the only staging this module ever
  // does, and it can never reach a caller path it was not handed.
  run(['add', '--', ...paths], root);
  const commit = run(['commit', '--only', ...paths, '-m', message], root, { allowFailure: true });
  if (commit.status !== 0) {
    return { committed: false, sha: headSha(root), failed: true };
  }
  return { committed: true, sha: headSha(root) };
}

// ---------------------------------------------------------------------------
// The capture worktree: set up, inspect, tear down
// ---------------------------------------------------------------------------

/** Our tree's absolute path. */
function ourWorktreePath(root) {
  return path.resolve(path.join(root, WORKTREE));
}

/** The leftover tree's own HEAD, when it carries one — the SHA the recovery
 *  refusal names, so the data can be reached by sha after the tree is gone. */
function leftOverSha(abs) {
  const head = run(['rev-parse', 'HEAD'], abs, { allowFailure: true });
  return head.status === 0 ? head.stdout.trim().toLowerCase() : null;
}

/**
 * Everything the sweep-and-create step needs, BEFORE any write happens:
 * - a LOCKED registration refuses: a live capture or a crash holding the
 *   lock — nothing here removes it;
 * - an unlocked registration carrying unsafe conditions refuses with its
 *   path/sha so the data is recoverable the way the run says;
 * - an unlocked clean registration is swept, then the tree is created
 *   DETACHED at the base and LOCKED for the whole capture;
 * - `.worktrees/` lands in .gitignore only when absent, matching
 *   build-setup.sh's convention.
 */
function setupWorktree(root, baseBranch) {
  const abs = ourWorktreePath(root);
  const existing = findOurWorktree(root);
  if (existing) {
    if (existing.locked) {
      return { ok: false, refusal: 'worktree-locked', path: abs };
    }
    const cond = conditionsAt(abs);
    const unsafe = cond.rebasing || cond.unmerged || cond.dirty || cond.staged;
    if (unsafe) {
      return { ok: false, refusal: 'worktree-recovery-required', path: abs, cond, sha: leftOverSha(abs) };
    }
    run(['worktree', 'remove', abs], root, { allowFailure: true });
    if (findOurWorktree(root)) run(['worktree', 'prune'], root, { allowFailure: true });
    if (findOurWorktree(root)) {
      return { ok: false, refusal: 'worktree-recovery-required', path: abs, cond, sha: leftOverSha(abs) };
    }
  }

  const gitignore = path.join(root, '.gitignore');
  if (!fs.existsSync(gitignore)) {
    fs.writeFileSync(gitignore, '.worktrees/\n', 'utf8');
  } else if (!fs.readFileSync(gitignore, 'utf8').split('\n').some((l) => l.trim() === '.worktrees/')) {
    const current = fs.readFileSync(gitignore, 'utf8');
    fs.writeFileSync(gitignore, (current.endsWith('\n') || current === '' ? current : current + '\n') + '.worktrees/\n', 'utf8');
  }

  if (run(['worktree', 'add', '--detach', abs, baseBranch], root, { allowFailure: true }).status !== 0) {
    return { ok: false, degraded: 'worktree-failed', path: abs };
  }
  const lock = run(['worktree', 'lock', abs], root, { allowFailure: true });
  if (lock.status !== 0) {
    return { ok: true, path: abs, locked: false, degraded: 'worktree-lock-failed' };
  }
  return { ok: true, path: abs, locked: true };
}

/**
 * Tear the capture down. A retained tree keeps its lock — the next run
 * refuses reuse with the recovery path, and the data stays put. Removal is
 * never forced: a tree that carries anything is retained and reported.
 * `canRemove` is the caller's verified answer, not an assumption.
 */
function teardownWorktree(root, canRemove) {
  const abs = ourWorktreePath(root);
  if (!canRemove) {
    return { removed: false, path: abs };
  }
  run(['worktree', 'unlock', abs], root, { allowFailure: true });
  const removed = run(['worktree', 'remove', abs], root, { allowFailure: true }).status === 0;
  return { removed, path: abs };
}

module.exports = {
  GitError,
  run,
  discoverBase,
  currentBranch,
  listWorktrees,
  findOurWorktree,
  worktreesCheckedOutAt,
  conditionsAt,
  readRef,
  protectCommit,
  releaseOwnedRef,
  isAncestor,
  advanceBaseIfUnlocked,
  fetchBase,
  rebaseOntoFetchHead,
  headSha,
  pushToBase,
  pathsDirty,
  commitBoard,
  ourWorktreePath,
  setupWorktree,
  teardownWorktree,
  WORKTREE,
  RECOVERY_NS,
  BACKLOG_FILE,
  DEFS_FILE,
};
