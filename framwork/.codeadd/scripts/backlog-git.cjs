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
 * changes survive every commit — an isolated index carries only the board
 * operation's delta, never the caller's index — and a dirty caller tree degrades the rebase
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
const os = require('node:os');

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
  if (abort.status !== 0 || !scan.readable || scan.rebasing || scan.unmerged) {
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

/** Normalize working bytes through Git's path-specific clean filters. */
function workingContent(root, rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return null;
  const blob = run(['hash-object', '-w', '--path', rel, '--stdin'], root, {
    input: fs.readFileSync(file),
  }).stdout.trim();
  return run(['cat-file', 'blob', blob], root).stdout;
}

/** Capture BEFORE the domain mutation, without modifying the caller index. */
function snapshotBoard(root) {
  try {
    const cond = conditionsAt(root);
    if (!cond.readable || cond.rebasing || cond.unmerged) return { ok: false };
    const files = {};
    for (const rel of [BACKLOG_FILE, DEFS_FILE]) {
      const head = run(['show', `HEAD:${rel}`], root, { allowFailure: true });
      const index = run(['show', `:${rel}`], root, { allowFailure: true });
      const entry = run(['ls-files', '--stage', '--', rel], root);
      files[rel] = {
        head: head.status === 0 ? head.stdout : null,
        index: index.status === 0 ? index.stdout : null,
        working: workingContent(root, rel),
        mode: entry.stdout.match(/^(\d+) /)?.[1] || '100644',
      };
    }
    return { ok: true, sha: headSha(root), files };
  } catch {
    return { ok: false };
  }
}

/** Three-way merge; conflicts produce no file/index edits in the caller. */
function mergeContent(root, temp, current, base, incoming) {
  if (current === base) return { ok: true, content: incoming };
  if (incoming === base || current === incoming) return { ok: true, content: current };
  // Creation/deletion overlap cannot be safely inferred from an empty file.
  if ([current, base, incoming].some((value) => value === null)) return { ok: false };
  const names = ['current', 'base', 'incoming'].map((name) => path.join(temp, name));
  [current, base, incoming].forEach((value, i) => fs.writeFileSync(names[i], value));
  const merge = run(['merge-file', '-p', ...names], root, { allowFailure: true });
  return merge.status === 0 ? { ok: true, content: merge.stdout } : { ok: false };
}

function setIndexContent(root, indexFile, rel, content, mode) {
  const env = { GIT_INDEX_FILE: indexFile };
  if (content === null) {
    run(['update-index', '--force-remove', '--', rel], root, { env });
  } else {
    const blob = run(['hash-object', '-w', '--stdin'], root, { input: content }).stdout.trim();
    run(['update-index', '--add', '--cacheinfo', `${mode},${blob},${rel}`], root, { env });
  }
}

/**
 * Publish only the operation delta onto HEAD through a temporary index.
 * A second index keeps all caller entries, with staged board changes merged
 * onto the new board HEAD. Both merges are verified BEFORE committing.
 * The real index lock is held throughout, then replaced atomically on success.
 * Neither the caller working bytes nor its unrelated index entries are edited.
 */
function commitBoard(root, paths, message, snapshot) {
  if (!snapshot?.ok || headSha(root) !== snapshot.sha) {
    return { committed: false, degraded: 'caller-worktree-dirty', sha: headSha(root) };
  }
  let temp; let lock; let lockFd; let committed = false;
  try {
    const cond = conditionsAt(root);
    if (!cond.readable || cond.rebasing || cond.unmerged) {
      return { committed: false, degraded: 'caller-worktree-dirty', sha: headSha(root) };
    }
    temp = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-backlog-index-'));
    const updates = [];
    for (const rel of paths) {
      const before = snapshot.files[rel];
      const after = workingContent(root, rel);
      if (before.working === after) continue;
      const publication = mergeContent(root, temp, before.head, before.working, after);
      if (!publication.ok) return { committed: false, degraded: 'caller-worktree-dirty' };
      if (publication.content === before.head) continue;
      const staged = mergeContent(root, temp, before.index, before.head, publication.content);
      if (!staged.ok) return { committed: false, degraded: 'caller-worktree-dirty' };
      updates.push({ rel, content: publication.content, staged: staged.content, mode: before.mode });
    }
    if (!updates.length) return { committed: false, sha: headSha(root) };

    const indexPath = path.resolve(root, run(['rev-parse', '--git-path', 'index'], root).stdout.trim());
    const lockPath = indexPath + '.lock';
    lockFd = fs.openSync(lockPath, 'wx');
    lock = lockPath; // Only a lock created by this invocation is ever removed.
    const publishIndex = path.join(temp, 'publication-index');
    const callerIndex = path.join(temp, 'caller-index');
    if (fs.existsSync(indexPath)) fs.copyFileSync(indexPath, callerIndex);
    else run(['read-tree', 'HEAD'], root, { env: { GIT_INDEX_FILE: callerIndex } });
    run(['read-tree', 'HEAD'], root, { env: { GIT_INDEX_FILE: publishIndex } });
    for (const update of updates) {
      setIndexContent(root, publishIndex, update.rel, update.content, update.mode);
      setIndexContent(root, callerIndex, update.rel, update.staged, update.mode);
    }
    const commit = run(['commit', '-m', message], root, {
      allowFailure: true, env: { GIT_INDEX_FILE: publishIndex },
    });
    if (commit.status !== 0) return { committed: false, sha: headSha(root), failed: true };
    committed = true;
    fs.writeFileSync(lockFd, fs.readFileSync(callerIndex));
    fs.closeSync(lockFd); lockFd = undefined;
    fs.renameSync(lock, indexPath); lock = undefined;
    return { committed: true, sha: headSha(root) };
  } catch {
    return { committed, sha: headSha(root), failed: true };
  } finally {
    if (lockFd !== undefined) fs.closeSync(lockFd);
    if (lock) fs.rmSync(lock, { force: true });
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
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
 * - an unlocked clean registration with durably reachable HEAD is swept,
 *   then the tree is created
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
    const sha = leftOverSha(abs);
    const refs = sha ? run(['for-each-ref', '--contains', sha, '--format=%(refname)',
      'refs/heads', 'refs/remotes', RECOVERY_NS], root, { allowFailure: true }) : null;
    const protectedHead = refs?.status === 0 && Boolean(refs.stdout.trim());
    const unsafe = !cond.readable || cond.rebasing || cond.unmerged || cond.dirty || cond.staged || !protectedHead;
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
 * Tear the capture down. Normal exit releases the active capture lock;
 * unsafe retained data is refused by the next sweep. Removal is
 * never forced: a tree that carries anything is retained and reported.
 * `canRemove` is the caller's verified answer, not an assumption.
 */
function teardownWorktree(root, canRemove) {
  const abs = ourWorktreePath(root);
  const unlock = run(['worktree', 'unlock', abs], root, { allowFailure: true });
  if (!canRemove) {
    return { removed: false, path: abs, unlocked: unlock.status === 0 };
  }
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
  snapshotBoard,
  commitBoard,
  ourWorktreePath,
  setupWorktree,
  teardownWorktree,
  WORKTREE,
  RECOVERY_NS,
  BACKLOG_FILE,
  DEFS_FILE,
};
