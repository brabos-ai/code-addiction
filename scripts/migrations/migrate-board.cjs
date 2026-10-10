#!/usr/bin/env node
/**
 * migrate-board.cjs — Move one project's board from `docs/backlog.jsonl` on its
 * code branches to the orphan `board` branch and the fixed clone.
 *
 * INTERNAL. It lives under scripts/migrations/ and ships nowhere: not under
 * framwork/, not in the npm package, not in the release ZIP, not in
 * provider-map.json and not in the product inventory. It is run by a person, in
 * the target project, once. The shipped product only says that a migration is
 * needed (ERROR=board-migration-required); it names no path to this file.
 *
 * Usage (cwd = the target project, any branch):
 *   node <this repository>/scripts/migrations/migrate-board.cjs [--reimport]
 *
 * It requires the board module by path from this repository's
 * framwork/.codeadd/scripts/, so the project being migrated needs no copy of it.
 *
 * THE STEPS (each checks the state first and does nothing when it is already
 * done; a finished migration prints MIGRATED=already and exits 0):
 *   1. Config. `.codeadd/board.json` absent -> written with `remote` = the
 *      `origin` URL and branch `board`. No `origin` -> ERROR=no-remote. An
 *      ignore line `.codeadd/` (or `/.codeadd/`) in .gitignore becomes the
 *      `.codeadd/*` + `!.codeadd/board.json` pair; a .gitignore that already
 *      holds the pair is left alone and is not staged.
 *   2. Board branch. `origin/board` absent -> its first commit is built from
 *      the BASE branch's COMMITTED files (`git show origin/<base>:docs/...`,
 *      never the working copy, which on a feature branch is stale), or an empty
 *      board when the base has none. Its message carries `Migrated-From: <base
 *      sha>` and the source blob ids. A rejected push (another machine got
 *      there first) continues as "present". Creating the branch prints the
 *      FREEZE rule.
 *   3. Clone. The fixed clone exists and is level with the remote.
 *   4. Divergence check. The root commit of `origin/board` must carry
 *      `Migrated-From:`; without it the branch was not made by this script and
 *      the run stops with ERROR=board-unrecognised, nothing changed. If the
 *      base branch still carries docs/backlog.jsonl and its blob differs from
 *      the recorded one (the latest `Reimported-From: <sha>:<blob>` trailer wins
 *      over the root's), somebody wrote through the old route after the
 *      migration: ERROR=board-diverged, with BASE_ONLY= and BOTH= ticket ids.
 *      THE RULE IS A FREEZE: from the first run until the code side is merged,
 *      no write goes through the old route.
 *   5. Code side. `git rm` of the two board files when tracked; the config and
 *      the .gitignore change are staged. THE CODE REPOSITORY IS NEVER COMMITTED
 *      OR PUSHED HERE: the run reports CODE_CHANGES=staged and the paths.
 *   6. Leftovers. A clean `.worktrees/backlog` with no unpushed commit is
 *      unlocked and removed; otherwise it is reported with RECOVERY_PATH and
 *      left alone. Recovery refs `refs/codeadd/backlog-recovery/*` are counted
 *      and reported (RECOVERY_REFS=<n>), never deleted.
 *
 * --reimport: re-runs the divergence check and applies every ticket changed on
 * the base ONLY onto `board` as one commit, moving the recorded blob forward
 * with `Reimported-From: <base sha>:<blob>`. A ticket changed on both sides is
 * never merged: ERROR=board-diverged lists those ids, and they are fixed by hand
 * with backlog-commit.cjs before running again.
 *
 * Output: KEY=value lines. MIGRATED=done|already, BOARD_DIR, BASE_BRANCH,
 * BASE_SHA, BOARD_BRANCH_CREATED=yes, REIMPORTED=<n>, CODE_CHANGES=staged and
 * one STAGED=<path> per path, RECOVERY_REFS, LEFTOVER / RECOVERY_PATH.
 * Errors: ERROR=no-remote | board-unrecognised | board-diverged |
 * code-side-dirty | not-a-git-repository | board-unavailable | bad-argument.
 *
 * Exit codes: 0 done or already done, 1 failure, 2 caller error (bad argument,
 * not a git repository).
 *
 * Dependencies: Node built-ins, git, and framwork/.codeadd/scripts/backlog-board.cjs
 * with its siblings.
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const SCRIPTS = path.join(REPO, 'framwork', '.codeadd', 'scripts');
const board = require(path.join(SCRIPTS, 'backlog-board.cjs'));
const git = require(path.join(SCRIPTS, 'backlog-git.cjs'));

const BACKLOG = 'docs/backlog.jsonl';
const DEFS = 'docs/backlog.definitions.json';
const BRANCH = 'board';
const DIR_LINE = '.codeadd/';
const PAIR = ['.codeadd/*', '!.codeadd/board.json'];

const out = [];
const say = (key, value) => out.push(`${key}=${value}`);
const flush = () => { if (out.length) process.stdout.write(out.join('\n') + '\n'); };

function stop(code, key, value, detail) {
  say(key, value);
  if (detail) out.push(detail);
  flush();
  process.exit(code);
}

const g = (args, cwd, opts) => git.run(args, cwd, { allowFailure: true, ...opts });

// ---------------------------------------------------------------------------
// Small readers
// ---------------------------------------------------------------------------

/** The base branch: origin/HEAD, then origin/main, then origin/master. */
function discoverBase(root) {
  const head = g(['symbolic-ref', 'refs/remotes/origin/HEAD'], root);
  if (head.status === 0) {
    const name = head.stdout.trim().replace(/^refs\/remotes\/origin\//, '');
    if (name) return name;
  }
  for (const name of ['main', 'master']) {
    if (g(['show-ref', '--verify', '--quiet', `refs/remotes/origin/${name}`], root).status === 0) return name;
  }
  return null;
}

/** A file's committed text at a ref, or null. */
function showFile(root, ref, file) {
  const r = g(['show', `${ref}:${file}`], root);
  return r.status === 0 ? r.stdout : null;
}

/** The blob id of a committed file, or null. */
function blobId(root, ref, file) {
  const r = g(['rev-parse', '--verify', '--quiet', `${ref}:${file}`], root);
  return r.status === 0 ? r.stdout.trim() : null;
}

/** Rows of a board file keyed by id; a row without an id gets a positional key. */
function rowsById(text) {
  const map = new Map();
  if (!text) return map;
  text.split('\n').filter((l) => l.length > 0).forEach((line, i) => {
    const m = /"id":"([0-9]{4}[A-Z])"/.exec(line);
    map.set(m ? m[1] : `line-${i + 1}`, line);
  });
  return map;
}

// ---------------------------------------------------------------------------
// Step 1 (code side, in memory) — the ignore line
// ---------------------------------------------------------------------------

/** The rewritten .gitignore text, or null when nothing needs to change. */
function rewriteIgnore(text) {
  if (text === null) return null;
  const lines = text.split('\n');
  const hasPair = lines.some((l) => l.trim() === PAIR[1] || l.trim() === '!/' + PAIR[1]);
  if (hasPair) return null;
  let changed = false;
  const next = [];
  for (const line of lines) {
    const t = line.trim();
    if (t === DIR_LINE) { next.push(...PAIR); changed = true; } else if (t === '/' + DIR_LINE) {
      next.push('/' + PAIR[0], '!/' + PAIR[1]); changed = true;
    } else next.push(line);
  }
  return changed ? next.join('\n') : null;
}

// ---------------------------------------------------------------------------
// Step 2 — create the board branch from the base branch's committed files
// ---------------------------------------------------------------------------

function createBoardBranch(root, remote, base) {
  const baseRef = base ? `refs/remotes/origin/${base}` : null;
  const baseSha = baseRef ? (g(['rev-parse', '--verify', '--quiet', baseRef], root).stdout || '').trim() : '';
  const files = { [BACKLOG]: baseRef ? showFile(root, baseRef, BACKLOG) : null, [DEFS]: baseRef ? showFile(root, baseRef, DEFS) : null };
  const blobs = { [BACKLOG]: baseRef ? blobId(root, baseRef, BACKLOG) : null, [DEFS]: baseRef ? blobId(root, baseRef, DEFS) : null };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-migrate-board-'));
  try {
    g(['init', '-q', '--initial-branch=' + BRANCH], tmp);
    fs.mkdirSync(path.join(tmp, 'docs'));
    fs.writeFileSync(path.join(tmp, BACKLOG), files[BACKLOG] === null ? '' : files[BACKLOG]);
    if (files[DEFS] !== null) fs.writeFileSync(path.join(tmp, DEFS), files[DEFS]);
    g(['add', '--all'], tmp);
    const message = [
      `Migrate the board from ${base || 'no base branch'}`,
      '',
      `Migrated-From: ${baseSha || 'none'}`,
      `Backlog-Blob: ${blobs[BACKLOG] || 'none'}`,
      `Definitions-Blob: ${blobs[DEFS] || 'none'}`,
    ].join('\n');
    const id = git.identityArgs(tmp);
    const commit = g([...id, 'commit', '-q', '-m', message], tmp);
    if (commit.status !== 0) return { ok: false, reason: 'commit-failed' };
    const push = g(['push', '-q', remote, `HEAD:refs/heads/${BRANCH}`], tmp);
    // A rejected push means another machine created the branch first: carry on.
    return { ok: true, pushed: push.status === 0, baseSha };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Step 4 — the recorded source of the board, and the divergence check
// ---------------------------------------------------------------------------

/** What the board was last known to equal on the base branch. */
function recordedSource(clone) {
  const rootSha = git.rootCommit(clone, `refs/remotes/origin/${BRANCH}`);
  if (!rootSha) return null;
  const rootTrailers = git.commitTrailers(clone, rootSha);
  if (!rootTrailers || !rootTrailers['Migrated-From']) return null;
  let backlog = rootTrailers['Backlog-Blob'] || 'none';
  let defs = rootTrailers['Definitions-Blob'] || 'none';
  const re = g(['log', `refs/remotes/origin/${BRANCH}`, '-1', '--format=%H', '--grep=^Reimported-From:'], clone);
  const reSha = re.status === 0 ? re.stdout.trim() : '';
  if (reSha) {
    const t = git.commitTrailers(clone, reSha) || {};
    const m = /^([0-9a-f]+):([0-9a-f]+|none)$/.exec(t['Reimported-From'] || '');
    if (m) backlog = m[2];
    if (t['Reimported-Definitions']) defs = t['Reimported-Definitions'];
  }
  return { backlog: backlog === 'none' ? null : backlog, defs: defs === 'none' ? null : defs };
}

/** Text of a blob in the clone's object store (fetched from the base through it). */
function blobText(root, blob) {
  if (!blob) return null;
  const r = g(['cat-file', 'blob', blob], root);
  return r.status === 0 ? r.stdout : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv) {
  const args = argv.slice(2);
  let reimport = false;
  for (const a of args) {
    if (a === '--reimport') reimport = true;
    else stop(2, 'ERROR', 'bad-argument', 'USAGE: node scripts/migrations/migrate-board.cjs [--reimport]');
  }

  const root = board.codeRootOf(process.cwd());
  if (!root) stop(2, 'ERROR', 'not-a-git-repository');

  let changed = false;
  const staged = [];

  // ── 1. Config (decided now, written only once the checks have passed) ─────
  const configFile = path.join(root, board.CONFIG_FILE);
  const existing = board.readConfig(root);
  let remote;
  let branch = BRANCH;
  if (existing.present && existing.valid) {
    remote = existing.remote;
    branch = existing.branch;
  } else {
    const origin = g(['remote', 'get-url', 'origin'], root);
    if (origin.status !== 0 || !origin.stdout.trim()) stop(1, 'ERROR', 'no-remote', 'This project has no `origin` remote to hold the board branch.');
    remote = origin.stdout.trim();
  }
  if (branch !== BRANCH) stop(1, 'ERROR', 'board-unrecognised', `.codeadd/board.json names the branch ${branch}, this script only migrates to ${BRANCH}.`);

  // ── 2. The board branch ──────────────────────────────────────────────────
  const base = discoverBase(root);
  if (base) g(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], root);
  const has = git.remoteHasBranch(remote, BRANCH, root);
  if (!has.ok) stop(1, 'ERROR', 'board-unavailable', 'The remote could not be reached.');
  let created = false;
  if (!has.exists) {
    const made = createBoardBranch(root, remote, base);
    if (!made.ok) stop(1, 'ERROR', 'board-unavailable', 'The first board commit could not be made.');
    created = true;
    changed = true;
    say('BOARD_BRANCH_CREATED', made.pushed ? 'yes' : 'raced');
    out.push('FREEZE=From now until this branch is merged, no board write goes through the old route (docs/backlog.jsonl on main). Run this script again right before the merge.');
  }

  // ── 3. The clone (the resolver needs the config on disk) ─────────────────
  const wroteConfig = !(existing.present && existing.valid);
  if (wroteConfig) {
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify({ remote, branch: BRANCH }, null, 2) + '\n');
  }
  const undoConfig = () => { if (wroteConfig) fs.rmSync(configFile, { force: true }); };

  const res = board.resolve(root);
  if (res.state !== 'ready') {
    undoConfig();
    stop(1, 'ERROR', 'board-unavailable', `The board clone could not be made (state ${res.state}).`);
  }
  const clone = res.boardDir;
  const synced = board.sync(res, { force: true });
  if (synced.sync === 'degraded' && synced.reason === 'fetch-failed') {
    undoConfig();
    stop(1, 'ERROR', 'board-unavailable', 'The board clone could not be brought level with the remote.');
  }
  say('BOARD_DIR', clone);
  if (base) say('BASE_BRANCH', base);

  // ── 4. Divergence check ──────────────────────────────────────────────────
  const recorded = recordedSource(clone);
  if (!recorded) {
    undoConfig();
    stop(1, 'ERROR', 'board-unrecognised', `The root commit of origin/${BRANCH} carries no Migrated-From trailer: it was not made by this script. Nothing was changed.`);
  }
  const baseRef = base ? `refs/remotes/origin/${base}` : null;
  const baseSha = baseRef ? (g(['rev-parse', '--verify', '--quiet', baseRef], root).stdout || '').trim() : '';
  if (baseSha) say('BASE_SHA', baseSha);

  let reimported = 0;
  if (baseRef) {
    const baseBacklog = blobId(root, baseRef, BACKLOG);
    const baseDefs = blobId(root, baseRef, DEFS);
    const backlogMoved = baseBacklog !== null && baseBacklog !== recorded.backlog;
    const defsMoved = baseDefs !== null && baseDefs !== recorded.defs;
    if (backlogMoved || defsMoved) {
      const sourceBacklog = rowsById(blobText(root, recorded.backlog));
      const baseRows = rowsById(showFile(root, baseRef, BACKLOG));
      const boardRows = rowsById(fs.existsSync(path.join(clone, BACKLOG)) ? fs.readFileSync(path.join(clone, BACKLOG), 'utf8') : '');
      const baseOnly = [];
      const both = [];
      const ids = new Set([...baseRows.keys(), ...sourceBacklog.keys()]);
      for (const id of ids) {
        const src = sourceBacklog.get(id);
        const onBase = baseRows.get(id);
        if (onBase === src) continue;
        if (boardRows.get(id) === src) baseOnly.push(id); else both.push(id);
      }
      let defsBoth = false;
      if (defsMoved) {
        const boardDefs = fs.existsSync(path.join(clone, DEFS)) ? fs.readFileSync(path.join(clone, DEFS), 'utf8') : null;
        const srcDefs = blobText(root, recorded.defs);
        if (boardDefs === srcDefs) baseOnly.push('definitions'); else { both.push('definitions'); defsBoth = true; }
      }

      if (!reimport || both.length) {
        undoConfig();
        say('ERROR', 'board-diverged');
        say('BASE_ONLY', baseOnly.join(','));
        say('BOTH', both.join(','));
        out.push(both.length
          ? 'A ticket changed on both sides is never merged by this script: fix it by hand with backlog-commit.cjs, then run again.'
          : 'Somebody wrote through the old route after the migration. Run again with --reimport to apply those changes to the board branch.');
        void defsBoth;
        flush();
        process.exit(1);
      }

      // --reimport: apply every ticket changed on the base ONLY, as one commit.
      const lines = fs.existsSync(path.join(clone, BACKLOG))
        ? fs.readFileSync(path.join(clone, BACKLOG), 'utf8').split('\n').filter((l) => l.length > 0) : [];
      const indexOfId = (id) => lines.findIndex((l) => rowsById(l).has(id));
      for (const id of baseOnly) {
        if (id === 'definitions') continue;
        const onBase = baseRows.get(id);
        const at = indexOfId(id);
        if (onBase === undefined) { if (at !== -1) lines.splice(at, 1); } else if (at === -1) lines.push(onBase); else lines[at] = onBase;
        reimported += 1;
      }
      fs.mkdirSync(path.join(clone, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(clone, BACKLOG), lines.length ? lines.join('\n') + '\n' : '');
      const files = [BACKLOG];
      if (baseOnly.includes('definitions')) {
        fs.writeFileSync(path.join(clone, DEFS), showFile(root, baseRef, DEFS));
        files.push(DEFS);
        reimported += 1;
      }
      const message = [
        `Reimport ${reimported} change(s) written through the old route`,
        '',
        `Reimported-From: ${baseSha}:${baseBacklog || 'none'}`,
        `Reimported-Definitions: ${baseDefs || 'none'}`,
      ].join('\n');
      const lock = board.acquireLock(clone, { waitMs: board.writerWaitMs() });
      if (!lock.ok) stop(1, 'ERROR', 'board-locked');
      try {
        const made = git.commitFiles(clone, files, message);
        if (made.failed) stop(1, 'ERROR', 'board-unavailable', 'The reimport commit could not be made.');
        const pushed = git.pushBranch(clone, BRANCH);
        if (!pushed.pushed) stop(1, 'ERROR', 'board-unavailable', 'The reimport commit could not be pushed.');
      } finally {
        lock.release();
      }
      changed = true;
      say('REIMPORTED', String(reimported));
    }
  }

  // ── 5. The code side: stage, never commit ────────────────────────────────
  if (wroteConfig) {
    g(['add', '-f', '--', board.CONFIG_FILE], root);
    staged.push(board.CONFIG_FILE);
    changed = true;
  }
  const ignoreFile = path.join(root, '.gitignore');
  const ignoreText = fs.existsSync(ignoreFile) ? fs.readFileSync(ignoreFile, 'utf8') : null;
  const rewritten = rewriteIgnore(ignoreText);
  if (rewritten !== null) {
    fs.writeFileSync(ignoreFile, rewritten);
    g(['add', '--', '.gitignore'], root);
    staged.push('.gitignore');
    changed = true;
  }
  for (const file of [BACKLOG, DEFS]) {
    const tracked = g(['ls-files', '--error-unmatch', '--', file], root).status === 0;
    if (!tracked) continue;
    const removed = g(['rm', '-q', '--', file], root);
    if (removed.status !== 0) {
      stop(1, 'ERROR', 'code-side-dirty', `${file} has local edits: commit or stash them, they are already on the board branch from the base branch's committed copy, then run again.`);
    }
    staged.push(file);
    changed = true;
  }

  // ── 6. Leftovers ─────────────────────────────────────────────────────────
  const leftover = path.join(root, '.worktrees', 'backlog');
  const registered = g(['worktree', 'list', '--porcelain'], root).stdout || '';
  if (fs.existsSync(leftover) || registered.includes('.worktrees/backlog')) {
    const cond = git.conditionsAt(leftover);
    const sha = g(['rev-parse', 'HEAD'], leftover).stdout.trim();
    const safeRef = sha && (g(['for-each-ref', '--contains', sha, '--format=%(refname)', 'refs/heads', 'refs/remotes', git.RECOVERY_NS], root).stdout || '').trim();
    if (cond.readable && !cond.dirty && !cond.staged && !cond.unmerged && !cond.rebasing && safeRef) {
      g(['worktree', 'unlock', leftover], root);
      if (g(['worktree', 'remove', leftover], root).status === 0) {
        say('LEFTOVER', 'removed');
        changed = true;
      } else {
        say('LEFTOVER', 'kept');
        say('RECOVERY_PATH', leftover);
      }
    } else {
      say('LEFTOVER', 'kept');
      say('RECOVERY_PATH', leftover);
    }
  }
  const refs = (g(['for-each-ref', '--format=%(refname)', git.RECOVERY_NS], root).stdout || '').split('\n').filter(Boolean);
  if (refs.length) say('RECOVERY_REFS', String(refs.length));

  if (staged.length) {
    say('CODE_CHANGES', 'staged');
    for (const p of staged) say('STAGED', p);
  }
  say('MIGRATED', changed ? 'done' : 'already');
  void created;
  flush();
  process.exit(0);
}

main(process.argv);
