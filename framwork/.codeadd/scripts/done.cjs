#!/usr/bin/env node
/**
 * done.cjs — Branch finalization: context collection, commit-push, merge and
 * cleanup. Native port of done.sh (F15, product).
 *
 * Usage:
 *   node .codeadd/scripts/done.cjs                       # Context mode (default)
 *   node .codeadd/scripts/done.cjs --commit-push         # Commit the delivery's files, push the branch
 *   node .codeadd/scripts/done.cjs --merge               # The whole local sequence: commit-push, squash, cleanup
 *   node .codeadd/scripts/done.cjs --cleanup <MERGE_SHA> # Post-merge checks, then tags, worktree and branch
 *
 * Where each mode runs: the primary checkout runs all four. A linked worktree
 * runs context, --commit-push and --cleanup when its checked-out branch is the
 * feature branch (a branch with a feature id, not main); any other linked
 * worktree refuses. --merge needs the primary checkout, because it checks out
 * main. Context prints CHECKOUT=primary|linked so the caller routes before
 * running --merge. --cleanup in a linked worktree does everything git allows
 * from there and defers the two things it cannot — removing that worktree and
 * deleting its checked-out branch — printing WORKTREE_CLEANUP=DEFERRED,
 * LOCAL_DELETE=DEFERRED and a HINT= with the commands for the primary checkout.
 *
 * Staging is scoped to the delivery. A pending path (modified, staged, deleted,
 * untracked) is in scope when the branch already touches it (diff against the
 * merge base with main), sits untracked beside one that it touches, lies under
 * the delivery folder, or is a close-out output (CLOSE_OUT_PATHS). Anything
 * else is reported as DIRTY_UNRELATED=<path> with DIRTY_UNRELATED_COUNT=<n>;
 * --commit-push then stops with STATUS=ERROR before staging a single file, and
 * context reports the same list and still exits 0. Another feature's folder
 * under docs/features/ is neither staged nor reported. With no merge base,
 * context prints DIRTY_UNRELATED_COUNT=unknown and --commit-push stops.
 *
 * --cleanup REQUIRES the merge commit it proves against. A squash creates a new
 * commit, so the branch tip is never an ancestor of main and nothing can derive
 * it locally; --merge passes the commit it just made, the PR route passes what
 * gh reports. Without it, CHECK=2 refuses every deletion rather than guessing.
 *
 * The route probes consult gh only when GH_BIN is unset; when GH_BIN is set it
 * is the ONLY gh considered and is invoked as `node <GH_BIN> <args>`. That seam
 * is what makes the four probe outcomes testable without a shell stub and
 * without touching the real gh on the machine.
 *
 * Exit codes:
 *   0  success (context always; commit-push/merge/cleanup when the work lands)
 *   1  caller/guard failure, an unstaged immutable snapshot, an unpushable main,
 *      a merge conflict, or a failed commit/push/checkout
 *
 * Mutation boundary: commits, pushes, checks out, merges and deletes branches
 * and tags in the current repository. Nothing is rolled back after the work has
 * landed; a refused cleanup reports CLEANUP=SKIPPED and still exits 0.
 *
 * Dependencies: Node >= 22.19.0 built-ins, git, and the sibling native helpers
 * get-main-branch.cjs / get-branch-metadata.cjs. No shell, no WSL, no stdin.
 */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { discoverMainBranch } = require('./get-main-branch.cjs');
const { branchMetadata } = require('./get-branch-metadata.cjs');

const CWD = process.cwd();
const GH_BIN = process.env.GH_BIN || '';

const CREDITS = 'Generated with ADD by https://brabos.ai';
const COAUTHOR = 'Co-Authored-By: ADD <noreply@brabos.ai>';

// Assigned once detection runs; the mode bodies read them as module state, the
// same way the shell's globals were visible inside its functions.
let CURRENT_BRANCH = '';
let MAIN_BRANCH = '';
let BRANCH_TYPE = '';
let COMMIT_TYPE = '';
let FEATURE_NUMBER = '';
let FEATURE_SLUG = '';
let DOCS_DIR = '';
let CLEANUP_SHA = '';
let IS_LINKED = false;

// --- output -----------------------------------------------------------------
// fs.writeSync on the raw descriptor is synchronous even when stdout is a pipe,
// so a later process.exit() can never truncate a line.

function out(line) {
  fs.writeSync(1, `${line}\n`);
}
function outLines(lines) {
  for (const line of lines) out(line);
}
function err(text) {
  if (text) fs.writeSync(2, text);
}
function fail(lines) {
  outLines(lines);
  process.exit(1);
}

// --- git plumbing -----------------------------------------------------------

function git(args, opts = {}) {
  const res = spawnSync('git', args, {
    cwd: CWD,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    input: opts.input,
  });
  const status = res.status === null || res.status === undefined ? 1 : res.status;
  return { status, stdout: res.stdout || '', stderr: res.stderr || '', error: res.error || null };
}

/** The shell's `set -e`: a mutated-tree command that fails aborts the run. */
function gitOrFail(args, opts = {}) {
  const res = git(args, opts);
  if (res.status !== 0) {
    err(res.stderr);
    process.exit(res.status || 1);
  }
  return res;
}

// --- gh seam ----------------------------------------------------------------

/**
 * Run gh. When GH_BIN is set it is the only gh consulted, reached as
 * `node <GH_BIN> <args>`. Otherwise the `gh` on PATH is used; its absence is a
 * non-zero observation, never an error.
 */
function runGh(args) {
  const cmd = GH_BIN !== '' ? process.execPath : 'gh';
  const argv = GH_BIN !== '' ? [GH_BIN, ...args] : args;
  const res = spawnSync(cmd, argv, {
    cwd: CWD,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  const status = res.status === null || res.status === undefined ? 1 : res.status;
  return { status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

// --- small helpers ----------------------------------------------------------

/** Non-blank, CR-stripped lines — the shell's `grep -c '[^[:space:]]'` counts. */
function lines(text) {
  return String(text)
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.trim() !== '');
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Absolute file paths under `dir`, best-effort (a missing tree yields none). */
function walkFiles(dir) {
  const found = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const p = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(p);
      else if (entry.isFile()) found.push(p);
    }
  }
  return found;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- args + detection -------------------------------------------------------

function parseArgs(argv) {
  let mode = 'context';
  let cleanupSha = '';
  for (const arg of argv) {
    if (arg === '--merge') mode = 'merge';
    else if (arg === '--commit-push') mode = 'commit-push';
    else if (arg === '--cleanup') mode = 'cleanup';
    else if (arg.startsWith('-')) {
      // An unknown flag is not a mode; it is ignored, exactly as the shell's
      // `-*) shift ;;` did.
    } else if (cleanupSha === '') {
      cleanupSha = arg;
    }
  }
  return { mode, cleanupSha };
}

/** `cd <path> && pwd` for a git path, physical-path resolved, or ''. */
function physicalGitPath(flag) {
  const res = git(['rev-parse', flag]);
  if (res.status !== 0) return '';
  const raw = res.stdout.trim();
  if (raw === '') return '';
  try {
    const resolved = fs.realpathSync.native(path.resolve(CWD, raw));
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  } catch {
    return '';
  }
}

// --- scoped staging ---------------------------------------------------------

/**
 * What /add-done writes itself before commit-push. `docs/features` is listed
 * whole because runMerge's trees compare excludes the whole folder; the
 * classifier narrows it to DOCS_DIR. runMerge builds both its pathspec lists
 * from this one constant so the lists cannot drift from the classifier.
 */
const CLOSE_OUT_PATHS = [
  'docs/features',
  'docs/delivered.jsonl',
  '.codeadd/wiki',
  '.codeadd/project/decisions.jsonl',
];

/** NUL-separated git output (`-z`) as a list of raw paths. */
function nulList(text) {
  return String(text).split('\0').filter((p) => p !== '');
}

function underPath(p, dir) {
  return p === dir || p.startsWith(`${dir}/`);
}

/** The merge base with main, or '' when neither origin/<main> nor <main> has one. */
function mergeBase() {
  for (const ref of [`origin/${MAIN_BRANCH}`, MAIN_BRANCH]) {
    const res = git(['merge-base', 'HEAD', ref]);
    if (res.status === 0 && res.stdout.trim() !== '') return res.stdout.trim();
  }
  return '';
}

/** Every pending path, deduplicated: modified, deleted, staged, untracked. */
function pendingPaths() {
  const modified = nulList(git(['diff', '--name-only', '--no-renames', '-z']).stdout);
  const staged = nulList(git(['diff', '--cached', '--name-only', '--no-renames', '-z']).stdout);
  const untracked = nulList(git(['ls-files', '--others', '--exclude-standard', '--full-name', '-z']).stdout);
  return { modified, staged, untracked, all: [...new Set([...modified, ...staged, ...untracked])] };
}

/**
 * Split the pending paths into the delivery's own and the rest. Returns null
 * when there is no merge base to judge against. `stage` is what commit-push
 * adds; `unrelated` is what stops it.
 */
function classifyPending() {
  const base = mergeBase();
  if (base === '') return null;
  const branchSet = new Set(nulList(git(['diff', '--name-only', '--no-renames', '-z', base, 'HEAD']).stdout));
  const touchedDirs = [];
  for (const p of branchSet) {
    const i = p.lastIndexOf('/');
    if (i > 0) touchedDirs.push(p.slice(0, i));
  }
  const pending = pendingPaths();
  const staged = new Set(pending.staged);
  const untracked = new Set(pending.untracked);
  const stage = [];
  const unrelated = [];
  for (const p of pending.all) {
    if (underPath(p, 'docs/features')) {
      // Only the current delivery folder is ever in scope here. Another
      // feature's folder stays out of the commit and out of the report — unless
      // it was staged by hand, which git commit would carry anyway.
      if (DOCS_DIR !== '' && underPath(p, DOCS_DIR)) stage.push(p);
      else if (staged.has(p)) unrelated.push(p);
      continue;
    }
    const inScope =
      branchSet.has(p) ||
      (untracked.has(p) && touchedDirs.some((d) => underPath(p, d))) ||
      (DOCS_DIR !== '' && underPath(p, DOCS_DIR)) ||
      CLOSE_OUT_PATHS.some((c) => c !== 'docs/features' && underPath(p, c));
    if (inScope) stage.push(p);
    else unrelated.push(p);
  }
  return { stage, unrelated };
}

/** A path as one output line: a newline inside it would forge a second key. */
function printable(p) {
  return p.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

function dirtyUnrelatedLines(unrelated) {
  return [`DIRTY_UNRELATED_COUNT=${unrelated.length}`, ...unrelated.map((p) => `DIRTY_UNRELATED=${printable(p)}`)];
}

// --- immutable final snapshots ----------------------------------------------

/**
 * A promoted final snapshot is permanent delivery evidence. Refuse before
 * commit if an ignore rule or staging regression would silently omit it. Only
 * feature branches carry the convention. Errors exit 1 (the shell returned 1
 * from the function into a `set -e` body).
 */
function verifyFinalSnapshots() {
  if (BRANCH_TYPE !== 'feature') return;
  if (DOCS_DIR === '' || !isDir(path.join(CWD, DOCS_DIR))) return;

  const tree = git(['ls-tree', '-r', '--name-only', 'HEAD', '--', DOCS_DIR]).stdout;
  const snapshots = new Set();
  for (const raw of tree.split('\n')) {
    const line = raw.replace(/\r$/, '');
    const m = /^(.*\/_tests\/final\/run-[0-9]{3})\/.*$/.exec(line);
    if (m) snapshots.add(m[1]);
  }
  for (const snapshot of snapshots) {
    const staged = git(['diff', '--cached', '--quiet', 'HEAD', '--', snapshot]).status !== 0;
    const worktree = git(['diff', '--quiet', '--', snapshot]).status !== 0;
    if (staged || worktree) {
      fail(['STATUS=ERROR', `ERROR=Immutable final QA snapshot differs from HEAD: ${snapshot}`]);
    }
  }

  for (const file of walkFiles(path.join(CWD, DOCS_DIR))) {
    const rel = path.relative(CWD, file).split(path.sep).join('/');
    if (!/_tests\/final\/run-[0-9]{3}\//.test(rel)) continue;
    if (git(['check-ignore', '-q', '--', rel]).status === 0) {
      fail(['STATUS=ERROR', `ERROR=Final QA snapshot is ignored and cannot enter finalization: ${rel}`]);
    }
    if (git(['ls-files', '--error-unmatch', '--', rel]).status !== 0) {
      fail(['STATUS=ERROR', `ERROR=Final QA snapshot was not staged for finalization: ${rel}`]);
    }
  }
}

// --- mode bodies (extracted from --merge; never re-implemented beside it) ----

function mergeGuards() {
  out('========================================');
  out('MERGE');
  out('========================================');
  out(`BRANCH=${CURRENT_BRANCH}`);
  out(`TARGET=${MAIN_BRANCH}`);
  out(`TYPE=${BRANCH_TYPE}`);
  out('');

  if (CURRENT_BRANCH === MAIN_BRANCH) {
    fail(['STATUS=ERROR', `ERROR=Already on ${MAIN_BRANCH}. Checkout a feature/fix branch first.`]);
  }
  if (BRANCH_TYPE === 'unknown') {
    fail([
      'STATUS=ERROR',
      `ERROR=Unsupported branch type: ${CURRENT_BRANCH}`,
      'HINT=Expected: [type]/[NNNN][L]-* (e.g. feature/0001F-name, hotfix/0002H-urgent)',
    ]);
  }
}

function doCommitPush() {
  const pending = pendingPaths();
  let hasUncommitted = pending.all.length > 0;

  if (hasUncommitted) {
    // Scoped staging: the check runs BEFORE the first git add, so a refusal
    // leaves the index exactly as the caller left it.
    const classified = classifyPending();
    if (classified === null) {
      fail([
        'STATUS=ERROR',
        `ERROR=No merge base with ${MAIN_BRANCH}; cannot tell which uncommitted files belong to this delivery.`,
        `HINT=Run git fetch origin ${MAIN_BRANCH} and re-run.`,
      ]);
    }
    if (classified.unrelated.length > 0) {
      fail([
        'STATUS=ERROR',
        'ERROR=Uncommitted files outside this delivery.',
        ...dirtyUnrelatedLines(classified.unrelated),
        'HINT=Commit or stash them, then re-run. None of them was staged.',
      ]);
    }
    hasUncommitted = classified.stage.length > 0;
    if (hasUncommitted) {
      out('STEP=Committing pending changes...');
      // Literal pathspecs from stdin: no glob surprise in a file name, and no
      // argv length limit on a long list.
      gitOrFail(['-C', git(['rev-parse', '--show-toplevel']).stdout.trim() || CWD, '--literal-pathspecs', 'add', '-A', '--pathspec-from-file=-', '--pathspec-file-nul'], {
        input: `${classified.stage.join('\0')}\0`,
      });
    }
  }

  verifyFinalSnapshots();

  if (hasUncommitted) {
    gitOrFail(['commit', '-m', `${COMMIT_TYPE}(${FEATURE_NUMBER}): finalize before merge\n\n${CREDITS}\n\n${COAUTHOR}`]);
    out('COMMIT=OK');
  } else {
    out('COMMIT=SKIPPED');
  }

  out('STEP=Pushing to branch...');
  gitOrFail(['push', '-u', 'origin', CURRENT_BRANCH]);
  out('PUSH_BRANCH=OK');
}

function doCleanup() {
  // The FETCH is check 1, not a preamble. origin/<main> is a LOCAL ref and a
  // forge-side merge does not move it here, so a failing fetch — offline,
  // expired auth — leaves it at the branch point and check 2 would pass against
  // a main that never saw the merge.
  if (git(['fetch', 'origin', MAIN_BRANCH]).status !== 0) {
    out(`CHECK=1 FAILED — could not fetch origin/${MAIN_BRANCH}`);
    out('CLEANUP=SKIPPED');
    out('HINT=Nothing was deleted. The merge stands; re-run --cleanup once the remote is reachable.');
    return;
  }
  out(`CHECK=1 ok (fetched origin/${MAIN_BRANCH})`);

  if (CLEANUP_SHA === '') {
    out('CHECK=2 FAILED — no merge commit to prove against');
    out('CLEANUP=SKIPPED');
    out('HINT=Pass it: node .codeadd/scripts/done.cjs --cleanup <merge-sha>. Nothing was deleted.');
    return;
  }
  if (git(['merge-base', '--is-ancestor', CLEANUP_SHA, `origin/${MAIN_BRANCH}`]).status !== 0) {
    out(`CHECK=2 FAILED — origin/${MAIN_BRANCH} does not contain ${CLEANUP_SHA}`);
    out('CLEANUP=SKIPPED');
    out('HINT=Nothing was deleted. The merge has not reached the remote.');
    return;
  }
  out(`CHECK=2 ok (origin/${MAIN_BRANCH} contains ${CLEANUP_SHA})`);

  // Standalone, this runs from the feature branch: gh merged server-side and
  // nothing moved the local HEAD. Inside --merge it runs already on main, where
  // the switch is a no-op. One implementation, both callers.
  const currentRes = git(['branch', '--show-current']);
  const current = currentRes.status === 0 ? currentRes.stdout.trim() : '';
  if (IS_LINKED) {
    // Main belongs to the primary checkout; git refuses to check it out here.
    out('CHECKOUT_MAIN=SKIPPED (linked worktree)');
  } else if (current !== MAIN_BRANCH) {
    out(`STEP=Switching to ${MAIN_BRANCH}...`);
    gitOrFail(['checkout', MAIN_BRANCH]);
    gitOrFail(['pull', 'origin', MAIN_BRANCH]);
    out('CHECKOUT_MAIN=OK');
  }

  out('STEP=Cleaning up checkpoint tags...');
  const tags = lines(git(['tag', '-l', `checkpoint/${FEATURE_NUMBER}-*`]).stdout);
  if (tags.length > 0) {
    for (const tag of tags) {
      git(['tag', '-d', tag]);
      git(['push', 'origin', '--delete', tag]);
    }
    out(`CHECKPOINT_CLEANUP=${tags.length} tags removed`);
  } else {
    out('CHECKPOINT_CLEANUP=SKIPPED (no checkpoint tags found)');
  }

  out('STEP=Cleaning up branches...');
  if (IS_LINKED) {
    // This worktree cannot remove itself and git refuses to delete the branch
    // it has checked out. Delete what is remote, defer the rest. The pull comes
    // first in the hint: `branch -d` refuses a branch the local main has not
    // seen merged.
    if (git(['push', 'origin', '--delete', CURRENT_BRANCH]).status !== 0) out('REMOTE_DELETE=SKIPPED');
    const top = git(['rev-parse', '--show-toplevel']).stdout.trim() || CWD;
    out('WORKTREE_CLEANUP=DEFERRED');
    out('LOCAL_DELETE=DEFERRED');
    out(
      `HINT=From the primary checkout run, in order: git pull origin ${MAIN_BRANCH} && git worktree remove "${top}" && git branch -d ${CURRENT_BRANCH} (use -D if the PR was squash-merged)`,
    );
    out('CLEANUP=OK');
    return;
  }
  // Remove the feature's worktree first: `git branch -d` fails while the branch
  // is checked out in a linked worktree. No --force — fail loud if dirty.
  if (FEATURE_SLUG !== '') {
    const worktrees = git(['worktree', 'list', '--porcelain']).stdout
      .split('\n')
      .map((l) => l.replace(/\r$/, '').replace(/\\/g, '/'));
    const target = new RegExp(`^worktree .*/\\.worktrees/${escapeRegExp(FEATURE_SLUG)}$`);
    if (worktrees.some((l) => target.test(l))) {
      out(`STEP=Removing worktree .worktrees/${FEATURE_SLUG}...`);
      gitOrFail(['worktree', 'remove', `.worktrees/${FEATURE_SLUG}`]);
      out('WORKTREE_CLEANUP=OK');
    }
  }
  if (git(['branch', '-d', CURRENT_BRANCH]).status !== 0) out('LOCAL_DELETE=SKIPPED');
  if (git(['push', 'origin', '--delete', CURRENT_BRANCH]).status !== 0) out('REMOTE_DELETE=SKIPPED');
  out('CLEANUP=OK');
}

// --- modes ------------------------------------------------------------------

function runContext() {
  out('========================================');
  out('CONTEXT');
  out('========================================');
  out(`CURRENT_BRANCH=${CURRENT_BRANCH}`);
  out(`MAIN_BRANCH=${MAIN_BRANCH}`);
  out(`BRANCH_TYPE=${BRANCH_TYPE}`);
  out(`FEATURE_NUMBER=${FEATURE_NUMBER}`);
  out(`CHECKOUT=${IS_LINKED ? 'linked' : 'primary'}`);
  out('');

  if (BRANCH_TYPE === 'unknown') {
    fail([
      'STATUS=ERROR',
      `ERROR=Unsupported branch type: ${CURRENT_BRANCH}`,
      'HINT=Expected: [type]/[NNNN][L]-* (e.g. feature/0001F-name, hotfix/0002H-urgent)',
    ]);
  }

  // --- Pending changes ---
  const modified = lines(git(['diff', '--name-only']).stdout);
  const staged = lines(git(['diff', '--cached', '--name-only']).stdout);
  const untracked = lines(git(['ls-files', '--others', '--exclude-standard']).stdout);

  out('========================================');
  out('PENDING_CHANGES');
  out('========================================');
  out(`MODIFIED_COUNT=${modified.length}`);
  out(`STAGED_COUNT=${staged.length}`);
  out(`UNTRACKED_COUNT=${untracked.length}`);

  const hasUncommitted = modified.length + staged.length + untracked.length > 0;
  out(`HAS_UNCOMMITTED=${hasUncommitted ? 'true' : 'false'}`);
  // Judged only when something is pending; no merge base means no judgement.
  const classified = hasUncommitted ? classifyPending() : { unrelated: [] };
  if (classified === null) out('DIRTY_UNRELATED_COUNT=unknown');
  else outLines(dirtyUnrelatedLines(classified.unrelated));
  if (hasUncommitted) {
    out('');
    out('UNCOMMITTED_FILES=[');
    for (const f of modified) out(`  "${f}" (modified)`);
    for (const f of staged) out(`  "${f}" (staged)`);
    for (const f of untracked) out(`  "${f}" (untracked)`);
    out(']');
  }

  // --- Branch changes ---
  out('');
  out('========================================');
  out('BRANCH_CHANGES');
  out('========================================');

  let changedFiles = [];
  if (git(['rev-parse', '--verify', `origin/${MAIN_BRANCH}`]).status !== 0) {
    out('STATUS=WARNING');
    out(`WARNING=Remote branch origin/${MAIN_BRANCH} not found. BRANCH_CHANGES may be incomplete.`);
  } else {
    changedFiles = lines(git(['diff', '--name-only', `${MAIN_BRANCH}...${CURRENT_BRANCH}`]).stdout);
  }
  out(`CHANGED_COUNT=${changedFiles.length}`);
  out('CHANGED_FILES=[');
  for (const f of changedFiles) out(`  "${f}"`);
  out(']');

  // --- Route probes (NOT gates: gh missing, no PR, no index, no ledger are
  // ordinary values and the probe still exits 0) ---
  out('');
  out('========================================');
  out('ROUTE');
  out('========================================');

  let prState = 'no-gh';
  let prUrl = '';
  let prHeadSha = '';
  let prMergeCommit = '';

  if (runGh(['auth', 'status']).status === 0) {
    const view = runGh(['pr', 'view', '--json', 'state,url,headRefOid,mergeCommit']);
    const raw = view.stdout || '';
    if (raw.trim() === '') {
      prState = 'none';
    } else {
      try {
        const j = JSON.parse(raw);
        const mc = (j.mergeCommit && j.mergeCommit.oid) || '';
        prState = String(j.state || 'none').toLowerCase();
        prUrl = j.url || '';
        prHeadSha = j.headRefOid || '';
        prMergeCommit = mc;
      } catch {
        prState = 'none';
      }
      if (prState === '') prState = 'none';
    }
  }

  out(`PR_STATE=${prState}`);
  out(`PR_URL=${prUrl}`);
  out(`PR_HEAD_SHA=${prHeadSha}`);
  out(`PR_MERGE_COMMIT=${prMergeCommit}`);

  // The FILE, committed or not: the duplicate this probe catches is born in the
  // working tree, so a check reading only commits would be blind to it.
  const indexFile = path.join(CWD, 'docs/delivered.jsonl');
  let indexEntry;
  if (!isFile(indexFile)) indexEntry = 'no-index';
  else if (fs.readFileSync(indexFile, 'utf8').includes(`"id":"${FEATURE_NUMBER}"`)) indexEntry = 'present';
  else indexEntry = 'absent';
  out(`INDEX_ENTRY=${indexEntry}`);

  // `unknown` is a real answer: an unfetched origin/<main> cannot say whether
  // this branch landed, and reporting `no` there would be a guess.
  let mergedOnMain;
  if (git(['rev-parse', '--verify', `origin/${MAIN_BRANCH}`]).status !== 0) mergedOnMain = 'unknown';
  else if (git(['merge-base', '--is-ancestor', 'HEAD', `origin/${MAIN_BRANCH}`]).status === 0) mergedOnMain = 'yes';
  else mergedOnMain = 'no';
  out(`MERGED_ON_MAIN=${mergedOnMain}`);

  const ledgerPath = DOCS_DIR !== '' ? `${DOCS_DIR}/build-ledger.md` : '';
  out(`LEDGER_PATH=${ledgerPath}`);

  // The LAST Publish line wins. The ledger is a log, not a set.
  let publishRecord = 'none';
  let publishUrl = '';
  if (ledgerPath !== '' && isFile(path.join(CWD, ledgerPath))) {
    const raw = fs.readFileSync(path.join(CWD, ledgerPath), 'utf8');
    const publishLines = raw
      .split('\n')
      .map((l) => l.replace(/\r$/, ''))
      .filter((l) => /^Publish:/.test(l));
    if (publishLines.length > 0) {
      const lastPublish = publishLines[publishLines.length - 1];
      const rest = lastPublish.replace(/^Publish:[ \t]*/, '');
      publishRecord = rest.split(/\s+/)[0] || '';
      const urlMatch = lastPublish.match(/https?:\/\/\S+/);
      publishUrl = urlMatch ? urlMatch[0] : '';
    }
  }
  out(`PUBLISH_RECORD=${publishRecord}`);
  out(`PUBLISH_RECORD_URL=${publishUrl}`);

  process.exit(0);
}

function runCommitPush() {
  mergeGuards();
  doCommitPush();
  out('');
  out('STATUS=SUCCESS');
  out(`BRANCH=${CURRENT_BRANCH}`);
  process.exit(0);
}

function runCleanupMode() {
  mergeGuards();
  doCleanup();
  out('');
  out('STATUS=SUCCESS');
  out(`CURRENT_BRANCH=${IS_LINKED ? CURRENT_BRANCH : MAIN_BRANCH}`);
  process.exit(0);
}

function runMerge() {
  mergeGuards();
  // The local squash checks out main, which the primary checkout holds. Refuse
  // before doCommitPush: nothing is committed, pushed or checked out.
  if (IS_LINKED) {
    fail([
      'STATUS=ERROR',
      'ERROR=The local squash onto main needs the primary checkout; this is a linked worktree.',
      'HINT=Take the pull request route from here, or re-run --merge from the primary checkout.',
    ]);
  }
  doCommitPush();

  // Prove main is pushable BEFORE anything local is written. A client-side
  // dry-run cannot see server-side branch protection; that is why the PR route
  // exists, not a gap to close.
  out(`STEP=Checking ${MAIN_BRANCH} is pushable...`);
  if (git(['push', '--dry-run', 'origin', MAIN_BRANCH]).status !== 0) {
    out('PUSH_MAIN=REFUSED');
    out('STATUS=ERROR');
    out(`ERROR=origin/${MAIN_BRANCH} refuses a push. Branch protection, or no permission.`);
    out('HINT=Open a PR instead — /add-done takes the PR route when one exists.');
    process.exit(1);
  }
  out('PUSH_MAIN=PUSHABLE');

  out(`STEP=Switching to ${MAIN_BRANCH}...`);
  gitOrFail(['checkout', MAIN_BRANCH]);
  gitOrFail(['pull', 'origin', MAIN_BRANCH]);
  out('CHECKOUT_MAIN=OK');

  // Deterministic merge choice: two dots compare the two TREES, which is the
  // actual question ("does main already carry everything but STEP 6's output").
  const treesMatch = git([
    'diff', '--quiet', MAIN_BRANCH, CURRENT_BRANCH, '--', '.',
    ...CLOSE_OUT_PATHS.map((p) => `:(exclude)${p}`),
  ]).status === 0;
  const mergeMode = treesMatch ? 'direct' : 'squash';
  out(`MERGE_MODE=${mergeMode}`);

  if (mergeMode === 'direct') {
    out(`STEP=Committing STEP 6 output directly onto ${MAIN_BRANCH}...`);
    const step6Diff = git(['diff', MAIN_BRANCH, CURRENT_BRANCH, '--', ...CLOSE_OUT_PATHS]).stdout;
    if (step6Diff.trim() === '') {
      out(`MERGE_COMMIT=SKIPPED (nothing to commit: ${MAIN_BRANCH} already carries the branch)`);
    } else {
      const patch = step6Diff.endsWith('\n') ? step6Diff : `${step6Diff}\n`;
      if (git(['apply', '--index', '--whitespace=nowarn'], { input: patch }).status !== 0) {
        out('STATUS=ERROR');
        out(`ERROR=Could not apply STEP 6 output onto ${MAIN_BRANCH}`);
        out('HINT=Resolve manually, then run: git add . && git commit');
        git(['reset', 'HEAD']);
        process.exit(1);
      }
      gitOrFail(['commit', '-m', `${COMMIT_TYPE}(${FEATURE_NUMBER}): docs from ${CURRENT_BRANCH}\n\n${CREDITS}\n\n${COAUTHOR}`]);
      out('MERGE_COMMIT=OK');
    }
  } else {
    out('STEP=Squash merging...');
    // `git merge --squash` leaves no merge in progress and accepts no --abort;
    // a failure is cleaned from the index only.
    if (git(['merge', '--squash', CURRENT_BRANCH]).status !== 0) {
      out('STATUS=ERROR');
      out('ERROR=Merge conflict detected');
      out('HINT=Resolve conflicts manually, then run: git add . && git commit');
      git(['reset', 'HEAD']);
      process.exit(1);
    }
    out('SQUASH=OK');

    out('STEP=Creating merge commit...');
    if (git(['diff', '--cached', '--quiet']).status === 0) {
      out('MERGE_COMMIT=SKIPPED (nothing to commit after squash)');
    } else {
      gitOrFail(['commit', '-m', `${COMMIT_TYPE}(${FEATURE_NUMBER}): merge from ${CURRENT_BRANCH}\n\n${CREDITS}\n\n${COAUTHOR}`]);
      out('MERGE_COMMIT=OK');
    }
  }

  out(`STEP=Pushing to ${MAIN_BRANCH}...`);
  gitOrFail(['push', 'origin', MAIN_BRANCH]);
  out('PUSH_MAIN=OK');

  // The merge commit this run just created on main. doCleanup proves against it
  // rather than re-deriving it, which a squash makes impossible.
  CLEANUP_SHA = git(['rev-parse', 'HEAD']).stdout.trim();
  doCleanup();

  out('');
  out('========================================');
  out('DONE');
  out('========================================');
  out('STATUS=SUCCESS');
  out(`MERGED_TO=${MAIN_BRANCH}`);
  out(`CURRENT_BRANCH=${MAIN_BRANCH}`);
  process.exit(0);
}

// --- entry ------------------------------------------------------------------

function main(argv) {
  const { mode, cleanupSha } = parseArgs(argv);
  CLEANUP_SHA = cleanupSha;

  const branchRes = git(['branch', '--show-current']);
  CURRENT_BRANCH = branchRes.status === 0 ? branchRes.stdout.trim() : '';
  if (CURRENT_BRANCH === '') {
    fail(['STATUS=ERROR', 'ERROR=HEAD is detached. Checkout a named branch before running this script.']);
  }

  // Resolve both git paths physically before comparing — git returns one
  // absolute and one cwd-relative from a subdir, so a raw compare
  // false-positives.
  const gitDir = physicalGitPath('--git-dir');
  const gitCommonDir = physicalGitPath('--git-common-dir');
  IS_LINKED = gitDir !== '' && gitDir !== gitCommonDir;

  const mainResult = discoverMainBranch(CWD);
  MAIN_BRANCH = mainResult.ok ? mainResult.branch : '';
  if (MAIN_BRANCH === '') {
    fail(['STATUS=ERROR', 'ERROR=Could not determine main branch.']);
  }

  const meta = branchMetadata(CURRENT_BRANCH);
  BRANCH_TYPE = meta.BRANCH_TYPE;
  COMMIT_TYPE = meta.COMMIT_TYPE;
  FEATURE_NUMBER = meta.FEATURE_ID;
  FEATURE_SLUG = meta.FEATURE_SLUG;
  DOCS_DIR = meta.DOCS_DIR;

  // Start guard: a linked worktree runs only when its checked-out branch is a
  // supported feature branch. In a linked worktree that branch IS the current
  // one, so the branch is the whole test — a path rule would refuse the
  // worktrees bots create elsewhere. Fires before the generic no-ID refusal;
  // the primary checkout never reaches it.
  if (IS_LINKED && (CURRENT_BRANCH === MAIN_BRANCH || FEATURE_NUMBER === '' || BRANCH_TYPE === 'unknown')) {
    fail([
      'STATUS=ERROR',
      `ERROR=Running inside a linked worktree not on a feature branch (checked out: ${CURRENT_BRANCH}).`,
      'HINT=Run /add-done from the worktree checked out on the feature branch, or from the primary checkout.',
    ]);
  }

  if (FEATURE_NUMBER === '') {
    fail([
      'STATUS=ERROR',
      `ERROR=No feature/hotfix ID found in branch: ${CURRENT_BRANCH}`,
      CURRENT_BRANCH.startsWith('hotfix/')
        ? 'HINT=Hotfix branches must be named hotfix/[NNNN]H-<slug> (e.g. hotfix/0043H-remove-turnstile)'
        : 'HINT=Branch must contain /[NNNN][L]-* (e.g. feature/0001F-name, refactor/0002R-cleanup)',
    ]);
  }

  if (mode === 'merge') return runMerge();
  if (mode === 'commit-push') return runCommitPush();
  if (mode === 'cleanup') return runCleanupMode();
  return runContext();
}

main(process.argv.slice(2));
