#!/usr/bin/env node
/**
 * board-init.cjs — Create the board for a project that has none.
 *
 * Usage (project root, any branch):
 *   node .codeadd/scripts/board-init.cjs
 *
 * It acts on the state backlog-board.cjs resolves for the project:
 *   ready               BOARD=ready. Nothing is written, anywhere.
 *   none                The full create: write `.codeadd/board.json`, push an
 *                       orphan `board` branch, make the clone, stage the config.
 *   branch-missing      `.codeadd/board.json` exists but its remote has no branch:
 *                       create the branch on that remote, make the clone, stage the
 *                       config. The config is not rewritten.
 *   migration-required  ERROR=board-migration-required, with the README pointer.
 *   checkout-missing    ERROR=board-unavailable.
 *
 * The create needs an `origin` and a pushed base branch (origin/HEAD, then main,
 * then master). A base branch is required because on an empty GitHub repository
 * the first branch pushed becomes the default one: pushing `board` first would
 * make it the repository's default.
 *
 * The root commit of `board` is "Create the board", with the trailers
 * `Migrated-From: <origin/<base> sha>`, `Backlog-Blob: none` and
 * `Definitions-Blob: none`, so the internal migration tool still recognises it.
 * It holds an empty docs/backlog.jsonl and no definitions file: the first write
 * seeds the default definitions. A rejected push means another machine created the
 * branch first, and the run carries on as "present" (BOARD_BRANCH_CREATED=raced).
 *
 * THE CODE REPOSITORY IS NEVER COMMITTED OR PUSHED. The only push is the `board`
 * branch. The only code-side act is `git add -f -- .codeadd/board.json`.
 * `.gitignore` is not edited.
 *
 * Output: KEY=value lines. BOARD=created|ready, BOARD_DIR, BASE_BRANCH,
 * BOARD_BRANCH_CREATED=yes|raced|no (no: the branch was already on the remote),
 * CODE_CHANGES=staged and STAGED=.codeadd/board.json (and a line saying to commit
 * it), IGNORE_WARNING=board-json-ignored and IGNORE_RULE=<rule>.
 * Errors: ERROR=not-a-git-repository | bad-argument | no-remote | no-base-branch |
 * board-migration-required | board-unavailable.
 *
 * Exit codes: 0 created or already there, 1 the environment refused (no origin, no
 * base branch, migration needed, board unavailable), 2 caller error (bad argument,
 * not a git repository).
 *
 * Dependencies: Node built-ins, git, and the siblings backlog-board.cjs and
 * backlog-git.cjs.
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const board = require('./backlog-board.cjs');
const git = require('./backlog-git.cjs');

const BACKLOG = 'docs/backlog.jsonl';
const BRANCH = board.DEFAULT_BRANCH;
const README_BOARD = 'https://github.com/brabos-ai/code-addiction#board';

const out = [];
const say = (key, value) => out.push(`${key}=${value}`);

function finish(code) {
  process.stdout.write(out.join('\n') + '\n');
  process.exit(code);
}

function stop(code, key, value, detail) {
  say(key, value);
  if (detail) out.push(detail);
  finish(code);
}

const g = (args, cwd) => git.run(args, cwd, { allowFailure: true });

/** The base branch: origin/HEAD, then origin/main, then origin/master. Its ref must resolve. */
function discoverBase(root) {
  const exists = (name) => g(['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${name}`], root).status === 0;
  const head = g(['symbolic-ref', 'refs/remotes/origin/HEAD'], root);
  if (head.status === 0) {
    const name = head.stdout.trim().replace(/^refs\/remotes\/origin\//, '');
    if (name && exists(name)) return name;
  }
  for (const name of ['main', 'master']) if (exists(name)) return name;
  return null;
}

/** Build the orphan root in a temp repository and push it to `remote` as `branch`. */
function createBoardBranch(remote, branch, baseSha) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-board-init-'));
  try {
    g(['init', '-q', '--initial-branch=' + branch], tmp);
    fs.mkdirSync(path.join(tmp, 'docs'));
    fs.writeFileSync(path.join(tmp, BACKLOG), '');
    g(['add', '--all'], tmp);
    const message = [
      'Create the board',
      '',
      `Migrated-From: ${baseSha}`,
      'Backlog-Blob: none',
      'Definitions-Blob: none',
    ].join('\n');
    const commit = g([...git.identityArgs(tmp), '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', message], tmp);
    if (commit.status !== 0) return { ok: false };
    const push = g(['push', '-q', remote, `HEAD:refs/heads/${branch}`], tmp);
    // A rejected push means another machine created the branch first: carry on.
    return { ok: true, pushed: push.status === 0 };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** The rule that still ignores .codeadd/board.json, or null when none does. */
function ignoringRule(root) {
  if (g(['check-ignore', '--no-index', '-q', '--', board.CONFIG_FILE], root).status !== 0) return null;
  const named = g(['check-ignore', '--no-index', '-v', '--', board.CONFIG_FILE], root);
  return named.stdout.trim().split('\t')[0] || 'an ignore rule';
}

function main(argv) {
  if (argv.slice(2).length) stop(2, 'ERROR', 'bad-argument', 'USAGE: node .codeadd/scripts/board-init.cjs');

  const root = board.codeRootOf(process.cwd());
  if (!root) stop(2, 'ERROR', 'not-a-git-repository');

  const res = board.resolve(root);
  if (res.state === 'ready') {
    say('BOARD', 'ready');
    if (res.boardDir) say('BOARD_DIR', res.boardDir);
    finish(0);
  }
  if (res.state === 'migration-required') {
    stop(1, 'ERROR', 'board-migration-required', `This project still keeps its board in docs/backlog.jsonl, or .codeadd/board.json is invalid. See ${README_BOARD}`);
  }
  if (res.state === 'checkout-missing') {
    stop(1, 'ERROR', 'board-unavailable', 'The board clone is not on this machine and the remote could not be reached. Connect to the network and run again.');
  }

  // state is `none` or `branch-missing`: the branch has to be created.
  const fresh = res.state === 'none';
  let remote;
  let branch = BRANCH;
  if (fresh) {
    const origin = g(['remote', 'get-url', 'origin'], root);
    if (origin.status !== 0 || !origin.stdout.trim()) {
      stop(1, 'ERROR', 'no-remote', 'This project has no `origin` remote. Add one, push the main branch, then run this again.');
    }
    remote = origin.stdout.trim();
  } else {
    remote = res.remote;
    branch = res.branch;
  }

  g(['fetch', '-q', 'origin'], root);
  const has = git.remoteHasBranch(remote, branch, root);
  if (!has.ok) stop(1, 'ERROR', 'board-unavailable', 'The remote could not be reached.');

  const base = discoverBase(root);
  let created = 'no';
  if (!has.exists) {
    if (!base) {
      stop(1, 'ERROR', 'no-base-branch', 'The remote has no main branch yet. Push it first (an empty repository would take `board` as its default branch), then run this again.');
    }
    const baseSha = g(['rev-parse', `refs/remotes/origin/${base}`], root).stdout.trim();
    const made = createBoardBranch(remote, branch, baseSha);
    if (!made.ok) stop(1, 'ERROR', 'board-unavailable', 'The first board commit could not be made.');
    created = made.pushed ? 'yes' : 'raced';
  }

  const configFile = path.join(root, board.CONFIG_FILE);
  if (fresh) {
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify({ remote, branch }, null, 2) + '\n');
  }

  const after = board.resolve(root);
  if (after.state !== 'ready') {
    if (fresh) fs.rmSync(configFile, { force: true });
    stop(1, 'ERROR', 'board-unavailable', `The board clone could not be made (state ${after.state}).`);
  }

  say('BOARD', 'created');
  say('BOARD_DIR', after.boardDir);
  if (base) say('BASE_BRANCH', base);
  say('BOARD_BRANCH_CREATED', created);

  g(['add', '-f', '--', board.CONFIG_FILE], root);
  say('CODE_CHANGES', 'staged');
  say('STAGED', board.CONFIG_FILE);
  out.push('Next: commit .codeadd/board.json so the team shares the board. The board branch is already on the remote.');

  const rule = ignoringRule(root);
  if (rule) {
    say('IGNORE_WARNING', 'board-json-ignored');
    say('IGNORE_RULE', rule);
  }
  finish(0);
}

main(process.argv);
