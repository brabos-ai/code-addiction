/**
 * backlog-commit.cjs — The native publication entry: ONE write route.
 *
 * Resolve the board clone, take its lock, bring it level with the remote,
 * allocate the id (for `add`), run the same domain operation as the local
 * CLI, commit, and push the `board` branch. A write from any branch or any
 * worktree lands on `board` and nowhere else — never on the caller's branch,
 * never on `main`, so it triggers no code CI.
 *
 * WRITE MODES ONLY. `list`, `search` and `get` commit nothing and are
 * refused by name (ERROR=read-mode). backlog-cli.cjs is the read entry, and it
 * refuses writes in turn (ERROR=write-mode) naming this one.
 *
 * THE ORDER THAT KEEPS DATA RECOVERABLE:
 *   1. Parse once — the local CLI's grammar, verbatim.
 *   2. A record FILE is read in the caller cwd BEFORE any git work or
 *      allocation; a failed read exits 1 with ERROR=record-read-failed.
 *   3. Resolve the board (backlog-board.cjs). A state other than `ready`
 *      stops BEFORE any write, see the exit codes.
 *   4. Take the clone's lock, waiting up to 30 s. Still held after that:
 *      ERROR=board-locked, exit 1, nothing written.
 *   5. Fetch and fast-forward (a clone left ahead by an earlier unpushed
 *      write is rebased once). `add` allocates AFTER this, inside the lock,
 *      so two writers on one machine never compute the same id: the ticket
 *      ids are counted in the clone, the feature directories in the code repo.
 *   6. Only then is stdin captured, once, and the domain operation runs —
 *      the same executeBacklog the local CLI uses, never a second validation.
 *   7. Commit to the clone, protect the commit with a recovery ref, push.
 *      A rejected push re-fetches, rebases once and retries; a second
 *      failure degrades and keeps the recovery ref. The next write pushes it.
 *
 * THE WRITE IS NEVER DISCARDED. Every failure past step 6 degrades: the report
 * says what did not happen and why. The commit lives in the clone.
 *
 * THE REPORT (KEY=VALUE lines, in this order):
 *   ROUTE=board           the only value there is
 *   BOARD_DIR=<clone>     where the board lives
 *   LOCK_RECLAIMED=<pid>  only when a dead or very old lock was taken over
 *   TICKET_ID, PERSISTED=yes, COMMITTED=yes|no, SHA, PUSHED=yes|no
 *   RECOVERY_REF          when a commit is only ref-protected (not pushed)
 *   DEGRADED=<reason>     at most one, the most fatal by fixed precedence:
 *                         rebase-conflict, fetch-failed, push-refused,
 *                         recovery-ref-failed, recovery-ref-moved,
 *                         recovery-ref-delete-failed
 *
 * EXIT CODES. 0 for a result, a DEGRADED one INCLUDED. 1 when the write or the
 * commit itself failed, and for the board states that need a human:
 * ERROR=board-migration-required (the checkout still holds docs/backlog.jsonl
 * and no config), ERROR=board-branch-missing (config, but the remote has no
 * such branch), ERROR=board-checkout-missing (no clone and no network),
 * ERROR=board-locked. 2 for caller error: a bad mode, a READ mode, the domain
 * REFUSED= values, and REFUSED=board-not-configured (this project has no
 * board).
 *
 * Dependencies: Node built-ins and git; the adjacent backlog modules.
 * No bash, no WSL, no shell anywhere in between.
 */

const fs = require('node:fs');
const path = require('node:path');
const core = require('./backlog-core.cjs');
const cli = require('./backlog-cli.cjs');
const git = require('./backlog-git.cjs');
const board = require('./backlog-board.cjs');

const USAGE = `USAGE: node .codeadd/scripts/backlog-commit.cjs <write-mode> [args]
  add                       --record-file ticket.json
  update  <id>              --record-file patch.json
  comment <id>              --record-file comment.json
  move    <id> --top | --after <id> | --bottom
  remove  <id>

\`list\`, \`search\`, \`get\` and \`changes\` are reads. Call backlog-cli.cjs directly for those.
Records also accept stdin when --record-file is absent.
`;

function usage() {
  process.stderr.write(USAGE);
}

/** The report: first-set order, single occurrence, key clearance. */
class Report {
  constructor() {
    this.order = [];
    this.values = {};
  }

  set(key, value) {
    if (value === null || value === undefined || value === '' || value === false) return;
    if (!(key in this.values)) this.order.push(key);
    this.values[key] = value;
  }

  clear(key) {
    delete this.values[key];
    this.order = this.order.filter((k) => k !== key);
  }

  raw() {
    return this.order.map((key) => `${key}=${this.values[key]}`).join('\n');
  }
}

/** Downgrade precedence: the first match wins when several landed in one run. */
const DEGRADED_PRIORITY = [
  'rebase-conflict', 'fetch-failed', 'push-refused',
  'recovery-ref-failed', 'recovery-ref-moved', 'recovery-ref-delete-failed',
];

function mergeDegraded(current, incoming) {
  if (!incoming) return current;
  if (!current) return incoming;
  return DEGRADED_PRIORITY.indexOf(incoming) < DEGRADED_PRIORITY.indexOf(current)
    ? incoming
    : current;
}

/** The board paths the commit may touch, only where they exist. */
function boardPaths(root) {
  const paths = [];
  for (const rel of [git.BACKLOG_FILE, git.DEFS_FILE]) {
    if (fs.existsSync(path.join(root, rel))) paths.push(rel);
  }
  return paths;
}

/** Domain errors, exactly the way the local entry prints them. */
function domainExit(result) {
  if (result.writeFailure) {
    process.stdout.write('ERROR=write-failed:' + result.writeFailure + '\n');
    process.exit(1);
  }
  process.stdout.write('REFUSED=' + result.refusal + '\n');
  process.exit(2);
}

/** The board is not usable: print why and exit with the state's own code. */
function boardStateExit(res) {
  if (res.state === 'none') {
    process.stdout.write('REFUSED=board-not-configured\n');
    process.stdout.write('This project has no board: there is no .codeadd/board.json and no docs/backlog.jsonl.\n');
    process.exit(2);
  }
  process.stdout.write('ERROR=board-' + res.state + '\n');
  if (res.state === 'migration-required') {
    process.stdout.write('docs/backlog.jsonl is still in the checkout and no .codeadd/board.json says where the board moved. Ask the framework maintainer to migrate this project to the board branch.\n');
  } else if (res.state === 'branch-missing') {
    process.stdout.write('.codeadd/board.json names the branch ' + res.branch + ' but the remote has no such branch. Ask the framework maintainer to migrate this project to the board branch.\n');
  } else if (res.state === 'checkout-missing') {
    process.stdout.write('The board clone for ' + (res.key || 'this project') + ' is not on this machine and the remote could not be reached. Connect to the network and retry.\n');
  }
  process.exit(1);
}

/**
 * Bring the locked clone level with the remote before the write: fetch, then
 * fast-forward when behind, rebase once when an earlier write is still
 * unpushed. Returns the DEGRADED reason it hit, or null.
 */
function levelWithRemote(boardDir, branch) {
  const fetched = git.fetchBranch(boardDir, branch);
  if (!fetched.fetched) return 'fetch-failed';
  if (!git.resolveSha(boardDir, `refs/remotes/origin/${branch}`)) return null;
  const ab = git.aheadBehind(boardDir, branch);
  if (!ab.ok || ab.behind === 0) return null;
  if (ab.ahead === 0) return git.fastForward(boardDir, branch).ok ? null : 'rebase-conflict';
  return git.rebaseOnBranch(boardDir, branch).ok ? null : 'rebase-conflict';
}

function main(argv) {
  const args = argv !== undefined ? argv : process.argv.slice(2);
  // Reads are refused BY NAME before any parsing: `list`/`search`/`get` never
  // reach the grammar's argument rules, so a read with a record-file spelling
  // never captures a file.
  if (['list', 'search', 'get', 'changes'].includes((args[0] || ''))) {
    process.stdout.write('ERROR=read-mode\n');
    usage();
    process.exit(2);
  }

  const parsed = cli.parseInvocation(args);
  if (!parsed.ok) {
    process.stdout.write('ERROR=' + parsed.error + '\n');
    if (parsed.usage) usage();
    process.exit(2);
  }
  const { mode } = parsed;
  const report = new Report();

  // ── 1. The record FILE, before any git work ──────────────────────────────
  let fileCaptured = null;
  if (parsed.recordSource && parsed.recordSource.kind === 'file') {
    fileCaptured = cli.captureRecord(parsed.recordSource);
    if (!fileCaptured.ok) {
      process.stdout.write('ERROR=' + fileCaptured.error + '\n');
      process.exit(1);
    }
  }

  // ── 2. Resolve the board ─────────────────────────────────────────────────
  const res = board.resolve(process.cwd());
  if (res.state !== 'ready') boardStateExit(res);
  const { boardDir } = res;
  const branch = res.branch || board.DEFAULT_BRANCH;
  report.set('ROUTE', 'board');
  report.set('BOARD_DIR', boardDir);

  // ── 3. The lock: the writer waits, then gives up having written nothing ──
  const lock = board.acquireLock(boardDir, { waitMs: board.writerWaitMs() });
  if (!lock.ok) {
    process.stdout.write('ERROR=' + (lock.reason === 'held' ? 'board-locked' : 'board-lock-failed') + '\n');
    process.exit(1);
  }
  if (lock.reclaimed !== undefined) report.set('LOCK_RECLAIMED', lock.reclaimed);
  let degraded = null;

  const leave = (code) => {
    lock.release();
    if (degraded) report.set('DEGRADED', degraded);
    const out = report.raw();
    if (out) process.stdout.write(out + '\n');
    process.exit(code);
  };

  // ── 4. Fetch and fast-forward, THEN allocate ─────────────────────────────
  degraded = mergeDegraded(degraded, levelWithRemote(boardDir, branch));

  let newId = '';
  if (mode === 'add') {
    const resolved = cli.resolveNewId(res.codeRoot || process.cwd(), boardDir);
    if (!resolved.ok) {
      lock.release();
      process.stdout.write('ERROR=id-allocation-failed\n');
      process.exit(1);
    }
    newId = resolved.id;
  }

  // ── 5. stdin capture: once, only now ─────────────────────────────────────
  let rawRecord = '';
  if (fileCaptured) {
    rawRecord = fileCaptured.raw;
  } else if (parsed.recordSource && parsed.recordSource.kind === 'stdin') {
    const captured = cli.captureRecord(parsed.recordSource);
    rawRecord = captured.raw || '';
  }

  // ── 6. The domain operation — the same one the local CLI calls ───────────
  const result = core.executeBacklog({
    root: boardDir,
    mode,
    targetId: parsed.targetId,
    moveDir: parsed.moveDir,
    moveAnchor: parsed.moveAnchor,
    filter: parsed.filter,
    query: parsed.query,
    rawRecord,
    newId,
  });

  if (!result.ok) {
    // Nothing was persisted. Refusals carry no publication keys.
    lock.release();
    domainExit(result);
  }

  report.set('TICKET_ID', result.ticketId);
  report.set('PERSISTED', 'yes');
  report.set('COMMITTED', 'no');

  // ── 7. Commit to the clone ───────────────────────────────────────────────
  const commit = git.commitFiles(boardDir, boardPaths(boardDir), `backlog: ${mode} ${result.ticketId}`);
  if (commit.failed) {
    report.set('RECOVERY_PATH', boardDir);
    report.set('PUSHED', 'no');
    process.stdout.write('ERROR=commit-failed\n');
    leave(1);
  }
  report.set('COMMITTED', commit.committed ? 'yes' : 'no');
  let sha = commit.sha;
  if (sha) report.set('SHA', sha);

  // ── 8. Protect OUR commit BEFORE any rebase, then push ───────────────────
  const owned = [];
  const protectNow = (target) => {
    const protection = git.protectCommit(boardDir, target);
    if (!protection.ok) {
      degraded = mergeDegraded(degraded, 'recovery-ref-failed');
      return false;
    }
    if (protection.owned) owned.push({ ref: protection.ref, value: target });
    return true;
  };

  let pushed = false;
  let protectedOk = true;
  if (commit.committed && sha) protectedOk = protectNow(sha);

  if (protectedOk && !(degraded === 'fetch-failed')) {
    let push = git.pushBranch(boardDir, branch);
    if (!push.pushed) {
      // Rejected: re-fetch, rebase once, retry once.
      const refetched = git.fetchBranch(boardDir, branch);
      if (!refetched.fetched) {
        degraded = mergeDegraded(degraded, 'fetch-failed');
      } else {
        const rebased = git.rebaseOnBranch(boardDir, branch);
        if (!rebased.ok) {
          degraded = mergeDegraded(degraded, 'rebase-conflict');
        } else {
          sha = rebased.sha;
          report.set('SHA', sha);
          if (commit.committed && !protectNow(sha)) protectedOk = false;
          push = protectedOk ? git.pushBranch(boardDir, branch) : { pushed: false, reason: 'recovery-ref-failed' };
        }
      }
      if (!push.pushed && !degraded) degraded = mergeDegraded(degraded, push.reason || 'push-refused');
      if (!push.pushed && degraded === null) degraded = 'push-refused';
    }
    pushed = push.pushed === true;
  } else if (!protectedOk) {
    // An unprotected commit is never rewritten or published.
    degraded = mergeDegraded(degraded, 'recovery-ref-failed');
  }
  report.set('PUSHED', pushed ? 'yes' : 'no');
  if (!pushed && !degraded) degraded = 'push-refused';

  // ── 9. Release what this run created, once the push is verified ──────────
  if (pushed) {
    board.touchStamp(boardDir);
    for (const own of owned) {
      const release = git.releaseOwnedRef(boardDir, own.ref, own.value);
      if (!release.deleted) {
        degraded = mergeDegraded(degraded, release.reason || 'recovery-ref-delete-failed');
        report.set('RECOVERY_REF', own.ref);
      }
    }
  } else if (sha && git.readRef(boardDir, git.RECOVERY_NS + '/' + sha) === sha) {
    report.set('RECOVERY_REF', git.RECOVERY_NS + '/' + sha);
  }

  leave(0);
}

module.exports = { main, Report, mergeDegraded, DEGRADED_PRIORITY, boardPaths, levelWithRemote };

if (require.main === module) {
  main();
}
