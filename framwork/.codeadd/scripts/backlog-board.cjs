/**
 * backlog-board.cjs — The one module that knows where the board lives.
 *
 * The board is a git branch (`board`, an orphan) of the project's own remote,
 * checked out once per project on the machine, outside every code branch and
 * worktree: <home>/.codeadd/<project-key>/board/. Every reader and writer —
 * backlog-cli.cjs, backlog-commit.cjs, status.cjs, next-id.cjs, init.cjs and
 * the board server — asks this module for that clone, so none of them can
 * answer differently from another.
 *
 * USAGE (as a library):
 *   const board = require('./backlog-board.cjs');
 *   const res = board.resolve(process.cwd());   // { state, boardDir, ... }
 *   const sync = board.sync(res);               // { sync, reason? }
 *
 * THE RESOLVER. Finds the code repository's top level with
 * `git rev-parse --show-toplevel` (a worktree or a subdirectory resolves to
 * its own top level, which carries the committed config), reads
 * `.codeadd/board.json` ({ "remote": "<url>", "branch": "board" }), computes
 * the project key from the config's `remote` — never from `origin` — and
 * returns the clone path, cloning it on first use. `CODEADD_BOARD_DIR`
 * replaces the clone path (tests, unusual setups); the config still supplies
 * the remote and the branch when the clone has to be made. There is NO
 * in-repo fallback: nothing here ever opens docs/backlog.jsonl in the code
 * checkout except to notice that it is still there.
 *
 * STATES (resolve().state):
 *   ready             the clone exists and is the board
 *   none              no config and no board file: this project has no board
 *   migration-required  no config, but docs/backlog.jsonl is in the checkout
 *   branch-missing    config present, the remote has no such branch
 *   checkout-missing  config present, no clone and the remote cannot be reached
 *
 * THE LOCK. `<clone>/.git/codeadd-board.lock`, created exclusively, holding
 * the PID and a timestamp. A lock whose PID is dead, or older than 10
 * minutes (PID reuse), is reclaimed and reported as LOCK_RECLAIMED=<pid>.
 * A lock held by a live process makes a READ or a timer tick skip; a WRITER
 * waits up to 30 s, then fails with ERROR=board-locked and writes nothing.
 *
 * THE READ SYNC. Skipped (SYNC=fresh) when the last one is under 30 s old —
 * the stamp is `<clone>/.git/codeadd-board-sync`. Otherwise, under the lock:
 * fetch; behind → fast-forward; ahead → push; diverged → rebase once and
 * push. SYNC is one of:
 *   fresh     the last sync was under 30 s ago; nothing ran
 *   synced    the sync ran and the clone matches the remote (or was pushed)
 *   skipped   the lock is held by a live process; the read answers from the clone
 *   degraded  SYNC_REASON=fetch-failed | push-refused | rebase-conflict; the
 *             read still answers from the clone
 * A failed sync never blocks a read.
 *
 * EXIT CODES belong to the entries that call this module; the module itself
 * never exits and never prints.
 *
 * Environment: CODEADD_BOARD_DIR (clone path), CODEADD_BOARD_LOCK_WAIT_MS
 * (writer wait, default 30000 — tests lower it), CODEADD_BOARD_SYNC_TTL_MS
 * (read throttle, default 30000).
 *
 * Dependencies: Node built-ins, ./backlog-git.cjs and ./backlog-storage.cjs.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const git = require('./backlog-git.cjs');
const storage = require('./backlog-storage.cjs');

const CONFIG_FILE = '.codeadd/board.json';
const DEFAULT_BRANCH = 'board';
const LOCK_NAME = 'codeadd-board.lock';
const STAMP_NAME = 'codeadd-board-sync';
const LOCK_MAX_AGE_MS = 10 * 60 * 1000;
const DEFAULT_WAIT_MS = 30 * 1000;
const DEFAULT_TTL_MS = 30 * 1000;
const STATES = ['ready', 'none', 'migration-required', 'branch-missing', 'checkout-missing'];

function envNumber(name, fallback, env = process.env) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// ---------------------------------------------------------------------------
// The project key
// ---------------------------------------------------------------------------

/**
 * Normalise a remote URL to the key every clone and worktree of the project
 * computes the same way: drop the scheme and `user@`, turn an SSH `host:path`
 * into `host/path`, drop a trailing `.git`, lowercase the host only.
 * A local path (a bare repository on disk) becomes `local/<path>`.
 */
function normalizeKey(remote) {
  let url = String(remote || '').trim();
  if (!url) return '';
  if (/^[a-zA-Z]:[\\/]/.test(url) || url.startsWith('/') || url.startsWith('.') || url.startsWith('file://')) {
    const p = url.replace(/^file:\/\//, '').replace(/\\/g, '/').replace(/^([a-zA-Z]):/, '$1').replace(/^\/+/, '');
    return 'local/' + p.replace(/\.git\/?$/, '').replace(/\/+$/, '');
  }
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url);
  url = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
  url = url.replace(/^[^@/]*@/, '');
  if (!hasScheme) url = url.replace(/^([^/:]+):/, '$1/');
  url = url.replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/+$/, '');
  const slash = url.indexOf('/');
  const host = slash === -1 ? url : url.slice(0, slash);
  const rest = slash === -1 ? '' : url.slice(slash);
  return host.toLowerCase() + rest;
}

/** The key as a relative directory path: characters a filesystem refuses become `_`. */
function keyToPath(key) {
  return key.split('/').filter((part) => part && part !== '.' && part !== '..')
    .map((part) => part.replace(/[^A-Za-z0-9._-]/g, '_')).join(path.sep);
}

// ---------------------------------------------------------------------------
// The resolver
// ---------------------------------------------------------------------------

function codeRootOf(cwd) {
  const out = git.run(['rev-parse', '--show-toplevel'], cwd, { allowFailure: true });
  if (out.status !== 0) return null;
  return path.resolve(out.stdout.trim());
}

function readConfig(codeRoot) {
  const file = path.join(codeRoot, CONFIG_FILE);
  if (!fs.existsSync(file)) return { present: false };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const remote = parsed && typeof parsed.remote === 'string' ? parsed.remote.trim() : '';
    if (!remote) return { present: true, valid: false };
    const branch = typeof parsed.branch === 'string' && parsed.branch.trim() ? parsed.branch.trim() : DEFAULT_BRANCH;
    return { present: true, valid: true, remote, branch };
  } catch {
    return { present: true, valid: false };
  }
}

function isClone(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

/**
 * Resolve the board for a working directory.
 *
 * @param {string} cwd
 * @param {{env?: object}} [options]
 * @returns {{state: string, boardDir: string|null, codeRoot: string|null,
 *            remote?: string, branch?: string, key?: string, cloned?: boolean}}
 */
function resolve(cwd, { env = process.env } = {}) {
  const override = env.CODEADD_BOARD_DIR ? path.resolve(env.CODEADD_BOARD_DIR) : null;
  const codeRoot = codeRootOf(cwd);
  const config = codeRoot ? readConfig(codeRoot) : { present: false };

  if (!config.present || !config.valid) {
    // An existing clone named by the override is a board with no config at all.
    if (override && isClone(override)) {
      return { state: 'ready', boardDir: override, codeRoot, branch: DEFAULT_BRANCH, key: null };
    }
    if (codeRoot && (config.present || fs.existsSync(path.join(codeRoot, storage.BACKLOG_FILE)))) {
      return { state: 'migration-required', boardDir: null, codeRoot };
    }
    return { state: 'none', boardDir: null, codeRoot };
  }

  const key = normalizeKey(config.remote);
  const boardDir = override || path.join(os.homedir(), '.codeadd', keyToPath(key), 'board');
  const base = { boardDir, codeRoot, remote: config.remote, branch: config.branch, key };
  if (isClone(boardDir)) return { ...base, state: 'ready' };

  // First use: make the clone, or say why it cannot be made.
  const parent = fs.existsSync(boardDir) ? boardDir : path.dirname(boardDir);
  const probeCwd = fs.existsSync(parent) ? parent : (codeRoot || cwd);
  const has = git.remoteHasBranch(config.remote, config.branch, probeCwd);
  if (!has.ok) return { ...base, state: 'checkout-missing' };
  if (!has.exists) return { ...base, state: 'branch-missing' };
  const cloned = git.cloneBranch(config.remote, boardDir, config.branch);
  if (!cloned.ok) return { ...base, state: 'checkout-missing' };
  return { ...base, state: 'ready', cloned: true };
}

// ---------------------------------------------------------------------------
// The lock
// ---------------------------------------------------------------------------

function lockPathOf(boardDir) {
  return path.join(boardDir, '.git', LOCK_NAME);
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Take the clone's exclusive lock.
 *
 * @param {string} boardDir
 * @param {{waitMs?: number}} [options] waitMs 0 = do not wait (reads, timer ticks)
 * @returns {{ok: true, release: function, reclaimed?: number} |
 *           {ok: false, reason: 'held'|'lock-failed'}}
 */
function acquireLock(boardDir, { waitMs = 0 } = {}) {
  const file = lockPathOf(boardDir);
  const deadline = Date.now() + waitMs;
  let reclaimed;
  for (;;) {
    try {
      const fd = fs.openSync(file, 'wx');
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, ts: Date.now() }));
      fs.closeSync(fd);
      const release = () => { try { fs.rmSync(file, { force: true }); } catch { /* already gone */ } };
      return reclaimed === undefined ? { ok: true, release } : { ok: true, release, reclaimed };
    } catch (e) {
      if (e.code !== 'EEXIST') return { ok: false, reason: 'lock-failed' };
    }
    let holder = null;
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); holder = JSON.parse(text); } catch { /* empty, half-written or gone */ }
    // A lock file that is not readable YET is a lock being made: the creator opens it
    // exclusively and writes its PID a moment later. Only an unreadable file that has
    // sat there for seconds is a corpse.
    let young = false;
    if (!holder) {
      try { young = Date.now() - fs.statSync(file).mtimeMs < 5000; } catch { young = false; }
      if (!fs.existsSync(file)) continue;
    }
    const stale = !young && (!holder || !pidAlive(holder.pid) || (Date.now() - Number(holder.ts || 0)) > LOCK_MAX_AGE_MS);
    if (stale) {
      // Re-read just before removing: if the file changed since we judged it, somebody else
      // reclaimed it first and what is there now is THEIR fresh lock.
      let again = '';
      try { again = fs.readFileSync(file, 'utf8'); } catch { continue; }
      if (again !== text) continue;
      reclaimed = holder && holder.pid ? holder.pid : 0;
      try { fs.rmSync(file, { force: true }); } catch { /* the other reclaimer won */ }
      continue;
    }
    if (Date.now() >= deadline) return { ok: false, reason: 'held' };
    sleepMs(50);
  }
}

/** The writer's wait, in ms (default 30 s). */
function writerWaitMs(env = process.env) {
  return envNumber('CODEADD_BOARD_LOCK_WAIT_MS', DEFAULT_WAIT_MS, env);
}

// ---------------------------------------------------------------------------
// The sync
// ---------------------------------------------------------------------------

function stampPath(boardDir) {
  return path.join(boardDir, '.git', STAMP_NAME);
}

function touchStamp(boardDir) {
  try { fs.writeFileSync(stampPath(boardDir), String(Date.now())); } catch { /* best effort */ }
}

function stampAgeMs(boardDir) {
  try {
    const at = Number(fs.readFileSync(stampPath(boardDir), 'utf8'));
    return Number.isFinite(at) ? Date.now() - at : Infinity;
  } catch {
    return Infinity;
  }
}

/**
 * Bring the clone level with the remote. Caller holds the lock.
 * Behind → fast-forward. Ahead → push. Diverged → rebase once, then push.
 *
 * @returns {{sync: 'synced'} | {sync: 'degraded', reason: string}}
 */
function reconcile(boardDir, branch) {
  const fetched = git.fetchBranch(boardDir, branch);
  if (!fetched.fetched) return { sync: 'degraded', reason: 'fetch-failed' };
  const remoteTip = git.resolveSha(boardDir, `refs/remotes/origin/${branch}`);
  if (!remoteTip) return { sync: 'synced' };
  const ab = git.aheadBehind(boardDir, branch);
  if (!ab.ok) return { sync: 'degraded', reason: 'fetch-failed' };

  if (ab.behind > 0 && ab.ahead === 0) {
    return git.fastForward(boardDir, branch).ok ? { sync: 'synced' } : { sync: 'degraded', reason: 'rebase-conflict' };
  }
  if (ab.behind > 0 && ab.ahead > 0) {
    const rebased = git.rebaseOnBranch(boardDir, branch);
    if (!rebased.ok) return { sync: 'degraded', reason: 'rebase-conflict' };
  }
  const now = git.aheadBehind(boardDir, branch);
  if (now.ok && now.ahead > 0) {
    const pushed = git.pushBranch(boardDir, branch);
    if (!pushed.pushed) return { sync: 'degraded', reason: 'push-refused' };
  }
  return { sync: 'synced' };
}

/**
 * The throttled read sync. Never throws and never blocks a read.
 *
 * @param {{boardDir: string, branch: string}} res a `ready` resolution
 * @param {{force?: boolean, env?: object}} [options] force ignores the 30 s stamp
 * @returns {{sync: string, reason?: string, reclaimed?: number}}
 */
function sync(res, { force = false, env = process.env } = {}) {
  if (!res || res.state !== 'ready') return { sync: 'skipped' };
  const ttl = envNumber('CODEADD_BOARD_SYNC_TTL_MS', DEFAULT_TTL_MS, env);
  if (!force && stampAgeMs(res.boardDir) < ttl) return { sync: 'fresh' };
  const lock = acquireLock(res.boardDir, { waitMs: 0 });
  if (!lock.ok) return lock.reason === 'held' ? { sync: 'skipped' } : { sync: 'degraded', reason: 'lock-failed' };
  try {
    const out = reconcile(res.boardDir, res.branch || DEFAULT_BRANCH);
    if (out.sync === 'synced') touchStamp(res.boardDir);
    return lock.reclaimed === undefined ? out : { ...out, reclaimed: lock.reclaimed };
  } finally {
    lock.release();
  }
}

/**
 * What an id allocator needs: the root the ticket ids are counted under.
 * `ready` → the clone (synced first when asked, throttled like a read);
 * any other state → null, so only the feature directories count. There is no
 * in-repo fallback.
 *
 * @returns {{state: string, boardRoot: string|null}}
 */
function allocationRoot(cwd, { sync: doSync = false, env = process.env } = {}) {
  const res = resolve(cwd, { env });
  if (res.state !== 'ready') return { state: res.state, boardRoot: null };
  if (doSync) sync(res, { env });
  return { state: 'ready', boardRoot: res.boardDir };
}

// ---------------------------------------------------------------------------
// The changes read
// ---------------------------------------------------------------------------

/** Ticket rows of a board file keyed by id, in file order. A row with no id gets a positional key. */
function rowsById(text) {
  const map = new Map();
  if (!text) return map;
  text.split('\n').map((line) => line.replace(/\r$/, '')).filter((line) => line.length > 0).forEach((line, i) => {
    const m = /"id":"([0-9]{4}[A-Z])"/.exec(line);
    map.set(m ? m[1] : `line-${i + 1}`, line);
  });
  return map;
}

/**
 * Which tickets changed on the board branch since a commit.
 *
 * The comparison is between `since` and the REMOTE tip `origin/<branch>` —
 * never the clone's local HEAD, which may hold an unpushed commit that a later
 * rebase rewrites. The remote tip is returned as `head`, the next cursor, and
 * `unpushed` counts the commits the clone is ahead by. No `since` lists every
 * ticket as added (the bootstrap). A `since` that is not an ancestor of the tip
 * is `cursor-unknown`. Caller syncs first.
 *
 * @param {{boardDir: string, branch?: string}} res a `ready` resolution
 * @param {string} [since]
 * @returns {{ok: true, head: string, unpushed: number, added: string[], updated: string[], removed: string[]} |
 *           {ok: false, reason: 'cursor-unknown'|'board-unreadable'}}
 */
function changes(res, since) {
  const branch = res.branch || DEFAULT_BRANCH;
  const dir = res.boardDir;
  const remoteRef = `refs/remotes/origin/${branch}`;
  const head = git.resolveSha(dir, remoteRef) || git.headSha(dir);
  if (!head) return { ok: false, reason: 'board-unreadable' };
  const ab = git.resolveSha(dir, remoteRef) ? git.aheadBehind(dir, branch) : { ok: false };
  const unpushed = ab.ok ? ab.ahead : 0;

  const tipRows = rowsById(git.showAt(dir, head, git.BACKLOG_FILE));
  if (since === undefined || since === '') {
    return { ok: true, head, unpushed, added: [...tipRows.keys()], updated: [], removed: [] };
  }
  const base = git.resolveSha(dir, `${since}^{commit}`);
  if (!base || !git.isAncestor(dir, base, head)) return { ok: false, reason: 'cursor-unknown' };

  const baseRows = rowsById(git.showAt(dir, base, git.BACKLOG_FILE));
  const added = [];
  const updated = [];
  for (const [id, text] of tipRows) {
    if (!baseRows.has(id)) added.push(id);
    else if (baseRows.get(id) !== text) updated.push(id);
  }
  const removed = [...baseRows.keys()].filter((id) => !tipRows.has(id));
  return { ok: true, head, unpushed, added, updated, removed };
}

/** KEY=value lines for a read's header: BOARD_DIR, SYNC, SYNC_REASON, LOCK_RECLAIMED. */
function syncLines(res, result) {
  const lines = [`BOARD_DIR=${res.boardDir}`, `SYNC=${result.sync}`];
  if (result.reason) lines.push(`SYNC_REASON=${result.reason}`);
  if (result.reclaimed !== undefined) lines.push(`LOCK_RECLAIMED=${result.reclaimed}`);
  return lines;
}

module.exports = {
  resolve,
  normalizeKey,
  keyToPath,
  acquireLock,
  writerWaitMs,
  reconcile,
  sync,
  syncLines,
  allocationRoot,
  changes,
  rowsById,
  touchStamp,
  stampAgeMs,
  lockPathOf,
  readConfig,
  codeRootOf,
  CONFIG_FILE,
  DEFAULT_BRANCH,
  STATES,
};
