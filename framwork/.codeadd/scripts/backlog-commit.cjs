/**
 * backlog-commit.cjs — The native publication entry: one parse, one record
 * capture, one operation root, the same domain operation as the local CLI,
 * and the publication report.
 *
 * WRITE MODES ONLY. `list` and `search` commit nothing and are refused by
 * name (ERROR=read-mode), exactly as the wrapper refused them.
 *
 * THE ORDER THAT KEEPS DATA RECOVERABLE:
 *   1. Parse once — the local CLI's grammar, verbatim.
 *   2. A record FILE is read in the caller cwd BEFORE any git setup,
 *      allocation or persistence; a failed read exits 1 with
 *      ERROR=record-read-failed before anything else can happen to it.
 *   3. Routing picks the operation root: direct, the locked detached
 *      `.worktrees/backlog`, or the caller tree itself when no base branch
 *      exists. Refused worktree states stop BEFORE any write, naming the
 *      path to recover.
 *   4. `add` allocates at the CHOSEN root — the worktree's board is the
 *      board the ticket lands on, and the id counts from it.
 *   5. Only then is stdin captured, once, and the domain operation runs —
 *      the same executeBacklog the local CLI calls, never a subprocess of
 *      it and never a second validation.
 *
 * THE WRITE IS NEVER DISCARDED. Every failure past it degrades: the report
 * says what did not happen and why. A failed staging or commit keeps the
 * tree with its data and reports RECOVERY_PATH; a safely finishable capture
 * removes its tree after verified protection; the caller's own staged and
 * unstaged work is never staged, committed, stashed or reset by this run.
 *
 * THE REPORT. Old keys first, unchanged: ROUTE, BASE_BRANCH, TICKET_ID,
 * SHA, PUSHED, and DEGRADED when one applies. New keys, additive: PERSISTED
 * and COMMITTED on every completed write; RECOVERY_PATH when a tree is
 * retained and carries bytes; RECOVERY_REF when a commit is only
 * ref-protected. At most one DEGRADED value is printed, the most fatal one
 * by fixed precedence — a compound reason would break every one-word
 * consumer of today's format.
 *
 * Exit: 0 for a result, a DEGRADED one INCLUDED. 1 when the write or the
 * commit itself failed. 2 for caller error: a bad mode, a READ mode, the
 * local CLI's own REFUSED=, or REFUSED=worktree-locked /
 * worktree-recovery-required.
 *
 * Dependencies: node >= 18 built-ins, git; the adjacent local CLI modules.
 * No bash, no WSL, no shell anywhere in between.
 */

const fs = require('node:fs');
const path = require('node:path');
const core = require('./backlog-core.cjs');
const cli = require('./backlog-cli.cjs');
const git = require('./backlog-git.cjs');

const USAGE = `USAGE: node .codeadd/scripts/backlog-commit.cjs <write-mode> [args]
  add                       --record-file ticket.json
  update  <id>              --record-file patch.json
  comment <id>              --record-file comment.json
  move    <id> --top | --after <id> | --bottom
  remove  <id>

\`list\` and \`search\` are reads. Call backlog-cli.cjs directly for those.
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
  'not-a-git-repo', 'no-base-branch', 'worktree-failed', 'worktree-lock-failed',
  'worktree-recovery-required', 'caller-worktree-dirty', 'rebase-conflict',
  'fetch-failed', 'base-advance-failed', 'base-checked-out-elsewhere',
  'push-refused', 'no-remote', 'recovery-ref-failed', 'recovery-ref-moved',
  'recovery-ref-delete-failed', 'cleanup-failed',
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

function baseShaOf(root, branch) {
  const out = git.run(['rev-parse', 'refs/heads/' + branch], root, { allowFailure: true });
  return out.status === 0 ? out.stdout.trim().toLowerCase() : null;
}

/**
 * Routing, before anything is written. `refused` stops the run with the
 * old refusal names; degraded setups fall back to the caller tree, which is
 * the degraded write the wrapper always produced.
 */
function chooseOperationRoot(callerRoot) {
  const base = git.discoverBase(callerRoot);
  if (!base.ok) {
    return { kind: 'none', opRoot: callerRoot, baseBranch: '', degraded: base.reason };
  }
  if (git.currentBranch(callerRoot) === base.branch) {
    return {
      kind: 'direct', opRoot: callerRoot, baseBranch: base.branch,
      degraded: null, baseSha: baseShaOf(callerRoot, base.branch),
    };
  }

  const setup = git.setupWorktree(callerRoot, base.branch);
  if (setup.refusal) {
    return { kind: 'refused', refusal: setup.refusal, path: setup.path, sha: setup.sha || null };
  }
  if (setup.degraded) {
    return { kind: 'none', opRoot: callerRoot, baseBranch: base.branch, degraded: setup.degraded };
  }
  return {
    kind: 'worktree', opRoot: setup.path, callerRoot,
    locked: setup.locked, lockDegraded: setup.locked ? null : setup.degraded,
    baseBranch: base.branch, baseSha: baseShaOf(callerRoot, base.branch),
  };
}

/** Refusal shapes the wrapper printed, on stdout, exit 2. */
function refuse(refusal, absPath, sha) {
  process.stdout.write('REFUSED=' + refusal + '\n');
  if (refusal === 'worktree-locked') {
    process.stdout.write('A capture is holding ' + absPath + ', or one crashed while holding it.\n');
    process.stdout.write('Clear it with: git worktree unlock ' + absPath + '\n');
  } else if (refusal === 'worktree-recovery-required') {
    process.stdout.write('An earlier capture left recoverable work in ' + absPath + ' — it is not safe to discard or reuse.\n');
    if (sha) process.stdout.write('SHA=' + sha + '\n');
    process.stdout.write('Recover it, then remove it: git worktree remove ' + absPath + '\n');
  }
  process.exit(2);
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

/**
 * Protect sha and track ref ownership. Fails loudly as a degradation when
 * the verifier cannot confirm the ref names this commit.
 */
function protectOrDegrade(callerRoot, sha, report, state) {
  const protection = git.protectCommit(callerRoot, sha);
  if (protection.ok) {
    if (protection.owned) state.owned.push({ ref: protection.ref, value: sha });
    report.set('RECOVERY_REF', protection.ref);
    return true;
  }
  return false;
}

function main(argv) {
  const args = argv !== undefined ? argv : process.argv.slice(2);
  // Reads are refused BY NAME before any parsing, exactly as the wrapper
  // refused them: `list`/`search` never reach the grammar's argument rules.
  if (['list', 'search'].includes((args[0] || ''))) {
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

  const callerRoot = process.cwd();
  const report = new Report();

  // ── 1. The record FILE, before any git setup ─────────────────────────────
  let fileCaptured = null;
  if (parsed.recordSource && parsed.recordSource.kind === 'file') {
    fileCaptured = cli.captureRecord(parsed.recordSource);
    if (!fileCaptured.ok) {
      process.stdout.write('ERROR=' + fileCaptured.error + '\n');
      process.exit(1);
    }
  }

  // ── 2. Routing ───────────────────────────────────────────────────────────
  const routing = chooseOperationRoot(callerRoot);
  if (routing.kind === 'refused') refuse(routing.refusal, routing.path, routing.sha);

  let opRoot = routing.opRoot;
  let isWorktree = routing.kind === 'worktree';
  let degraded = routing.degraded || null;

  // The lock could not be taken: the capture cannot be marked live, so the
  // freshly created tree is released and the write falls back to the caller
  // tree, exactly the shape a failed worktree creation takes.
  if (isWorktree && !routing.locked) {
    degraded = mergeDegraded(degraded, 'worktree-lock-failed');
    git.teardownWorktree(callerRoot, true);
    opRoot = callerRoot;
    isWorktree = false;
  }
  const isDirect = routing.kind === 'direct' && !isWorktree;
  const isCapture = isWorktree;

  report.set('ROUTE', isDirect ? 'direct' : isWorktree ? 'worktree' : 'none');
  if (routing.baseBranch) report.set('BASE_BRANCH', routing.baseBranch);

  // ── 3. Allocation happens at the chosen root ─────────────────────────────
  let newId = '';
  if (mode === 'add') {
    const resolved = cli.resolveNewId(opRoot);
    if (!resolved.ok) {
      if (isWorktree) git.teardownWorktree(callerRoot, true);
      process.stdout.write('ERROR=id-allocation-failed\n');
      process.exit(1);
    }
    newId = resolved.id;
  }

  // ── 4. stdin capture: once, only now ─────────────────────────────────────
  let rawRecord = '';
  if (fileCaptured) {
    rawRecord = fileCaptured.raw;
  } else if (parsed.recordSource && parsed.recordSource.kind === 'stdin') {
    const captured = cli.captureRecord(parsed.recordSource);
    rawRecord = captured.raw || '';
  }

  const snapshot = (isDirect || isCapture) ? git.snapshotBoard(opRoot) : null;

  // ── 5. The domain operation — the same one the local CLI calls ───────────
  const result = core.executeBacklog({
    root: opRoot,
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
    // Nothing was persisted; a prepared worktree holds nothing and is
    // released. Refusals carry no publication keys, as the wrapper's never did.
    if (isWorktree) git.teardownWorktree(callerRoot, true);
    domainExit(result);
  }

  report.set('TICKET_ID', result.ticketId);
  report.set('PERSISTED', 'yes');
  report.set('COMMITTED', 'no');

  const recoveryState = { owned: [] };

  if (isDirect === false && isCapture === false) {
    // Route none: the caller tree carries the bytes, uncommitted. A result,
    // with the degradation named and the recovery path pointed at.
    report.set('RECOVERY_PATH', path.resolve(opRoot));
    report.set('PUSHED', 'no');
    // A capture tree created but never marked live is released here, so an
    // unmarkable leftover is never the sweep's problem.
    if (degraded === 'worktree-lock-failed') git.teardownWorktree(callerRoot, true);
    finish(report, degraded, 0);
  }

  // ── 6. Commit: the two board paths by name, never the caller's index ────
  const paths = boardPaths(opRoot);
  const commit = git.commitBoard(opRoot, paths, `chore(backlog): ${mode} ${result.ticketId}`, snapshot);

  if (commit.degraded) {
    report.set('RECOVERY_PATH', path.resolve(opRoot));
    report.set('PUSHED', 'no');
    if (isCapture) git.teardownWorktree(callerRoot, false);
    finish(report, mergeDegraded(degraded, commit.degraded), 0);
  }

  if (commit.failed) {
    // The bytes survived. A normal exit releases the capture lock but retains
    // the data; the next sweep refuses unsafe recovery state.
    report.set('COMMITTED', commit.committed ? 'yes' : 'no');
    if (commit.committed) report.set('SHA', commit.sha);
    report.set('RECOVERY_PATH', path.resolve(opRoot));
    report.set('PUSHED', 'no');
    if (isCapture) git.teardownWorktree(callerRoot, false);
    process.stdout.write('ERROR=commit-failed\n');
    finish(report, degraded, 1);
  }

  report.set('COMMITTED', commit.committed ? 'yes' : 'no');
  let sha = commit.sha;
  if (sha) report.set('SHA', sha);

  // ── 7. Protect OUR commit BEFORE any rebase or cleanup ───────────────────
  let protectionReady = true;
  if (isCapture && commit.committed && sha) {
    const held = protectOrDegrade(callerRoot, sha, report, recoveryState);
    protectionReady = held;
    if (!held) degraded = mergeDegraded(degraded, 'recovery-ref-failed');
  }

  let pushed = false;
  let rebaseBlocked = false;

  const remote = git.run(['remote', 'get-url', 'origin'], opRoot, { allowFailure: true });
  if (!protectionReady) {
    // Do not rewrite or publish an unprotected detached commit. Keep its
    // worktree as the recovery location instead of entering reconciliation.
    rebaseBlocked = true;
  } else if (remote.status !== 0) {
    degraded = mergeDegraded(degraded, 'no-remote');
  } else {
    const fetch = git.fetchBase(opRoot, routing.baseBranch);
    if (!fetch.fetched) {
      // A fetch must succeed before any of its stale state is used — no
      // rebase, and no push on top of it.
      degraded = mergeDegraded(degraded, fetch.reason);
      rebaseBlocked = true;
    } else {
      const needsRebase = !git.isAncestor(opRoot, fetch.fetchHead, git.headSha(opRoot));
      if (needsRebase) {
        // Caller bytes and staged intent are preserved, whatever happens.
        const cond = git.conditionsAt(opRoot);
        if (!cond.readable || cond.dirty || cond.staged || cond.unmerged || cond.rebasing) {
          degraded = mergeDegraded(degraded, 'caller-worktree-dirty');
          rebaseBlocked = true;
        } else {
          const rebase = git.rebaseOntoFetchHead(opRoot);
          if (rebase.ok) {
            sha = rebase.sha;
            report.set('SHA', sha);
            if (isCapture && commit.committed && sha !== commit.sha) {
              if (!protectOrDegrade(callerRoot, sha, report, recoveryState)) {
                degraded = mergeDegraded(degraded, 'recovery-ref-failed');
              }
            }
          } else if (rebase.reason === 'abort-failed') {
            // The repository is mid-rebase and could not be aborted: the
            // tree stays, the old DEGRADED name stays, and on the DIRECT
            // route the tree the run is standing in IS the recovery
            // location — the rebase state and the caller's tree are one.
            degraded = mergeDegraded(degraded, 'rebase-conflict');
            rebaseBlocked = true;
            report.set('RECOVERY_PATH', path.resolve(opRoot));
          } else {
            degraded = mergeDegraded(degraded, rebase.reason);
            rebaseBlocked = true;
          }
        }
      }
      if (!rebaseBlocked) {
        const push = git.pushToBase(opRoot, routing.baseBranch);
        if (push.pushed) {
          pushed = true;
        } else {
          degraded = mergeDegraded(degraded, push.reason);
        }
      }
    }
  }

  report.set('PUSHED', pushed ? 'yes' : 'no');

  // ── 8. Recovery release, base advance, cleanup ───────────────────────────
  const protectedRef = sha ? git.RECOVERY_NS + '/' + sha : null;
  const protectedHeld = protectedRef ? git.readRef(callerRoot, protectedRef) === sha : false;

  let baseDiverged = false;
  if (isCapture && commit.committed && sha && routing.baseSha && protectionReady) {
    // Advance the local base only once, only through this run's commit:
    // unchecked-out, verified fast-forward, CAS. Normal commits in the
    // direct route advance their checked-out branch by construction.
    const advance = git.advanceBaseIfUnlocked(callerRoot, routing.baseBranch, sha, routing.baseSha);
    baseDiverged = !advance.advanced && advance.reason === 'base-advance-failed';
    if (!advance.advanced && ((pushed && baseDiverged) || (!pushed && !degraded))) {
      degraded = mergeDegraded(degraded, advance.reason);
    }
  }

  if (isCapture && pushed && protectedHeld && !baseDiverged) {
    // After verified push, delete only refs this invocation created, and
    // only whose value still matches; a moved ref stays and is reported.
    let releasedAll = true;
    for (const own of recoveryState.owned) {
      const release = git.releaseOwnedRef(callerRoot, own.ref, own.value);
      if (!release.deleted) {
        releasedAll = false;
        degraded = mergeDegraded(degraded, release.reason || 'recovery-ref-delete-failed');
        report.set('RECOVERY_REF', own.ref);
      }
    }
    if (releasedAll && recoveryState.owned.length) report.clear('RECOVERY_REF');
  }

  if (isCapture) {
    const cond = git.conditionsAt(opRoot);
    const safe = cond.readable && !(cond.dirty || cond.staged || cond.unmerged || cond.rebasing);
    // A no-op write carries no new data; any too-large cleanup false
    // positive is worse than a retained empty tree, so no data means
    // removable without the protection question.
    const carriesData = commit.committed;
    const verified = !carriesData || pushed || protectedHeld;
    const canRemove = safe && verified;
    const teardown = git.teardownWorktree(callerRoot, canRemove);
    if (!teardown.removed) {
      report.set('RECOVERY_PATH', path.resolve(teardown.path));
      if (protectedHeld) report.set('RECOVERY_REF', protectedRef);
      if (canRemove) degraded = mergeDegraded(degraded, 'cleanup-failed');
    }
  }

  finish(report, degraded, 0);
}

/** The closing print. `code` carries the final exit: 0, or 1 for a commit
 *  failure the write itself survived. */
function finish(report, degraded, code = 0) {
  if (degraded) report.set('DEGRADED', degraded);
  const out = report.raw();
  if (out) process.stdout.write(out + '\n');
  process.exit(code);
}

module.exports = { main, Report, mergeDegraded, DEGRADED_PRIORITY, boardPaths };

if (require.main === module) {
  main();
}
