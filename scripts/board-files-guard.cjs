#!/usr/bin/env node
/**
 * board-files-guard.cjs — Fail when the board comes back into the code branches.
 *
 * The board lives on its own `board` branch. A project that has moved there
 * tracks `.codeadd/board.json` (the config that says where) and tracks NO board
 * file. This guard fails when both are tracked at once: `docs/backlog.jsonl` or
 * `docs/backlog.definitions.json` next to the config means a write went through
 * the old route, or a merge brought the files back, and every reader would
 * silently disagree with the writer.
 *
 * Usage:
 *   node scripts/board-files-guard.cjs [--root <dir>]
 *
 *   --root   the repository to check; default: the current directory.
 *
 * Only tracked files count (`git ls-files`): an untracked or ignored copy in a
 * working tree is invisible here, and so is a repository that never adopted the
 * config. Nothing is fetched, nothing is written.
 *
 * Output (KEY=VALUE, one per line):
 *   GUARD=pass|fail
 *   CONFIG=tracked|absent
 *   BOARD_FILE=<path>        one per tracked board file, on fail only
 *
 * Exit codes:
 *   0 — pass
 *   1 — fail: the config and a board file are both tracked
 *   2 — caller error (bad argument, not a git repository)
 *
 * Plain Node because the CI job rejects Bash. Dependencies: Node built-ins and git.
 */
'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const CONFIG = '.codeadd/board.json';
const BOARD_FILES = ['docs/backlog.jsonl', 'docs/backlog.definitions.json'];

function fail(code, message) {
  process.stderr.write(message + '\n');
  process.exit(code);
}

function main(argv) {
  let root = process.cwd();
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--root' && args[i + 1]) {
      root = path.resolve(args[i + 1]);
      i += 1;
    } else {
      fail(2, 'USAGE: node scripts/board-files-guard.cjs [--root <dir>]');
    }
  }

  const listed = spawnSync('git', ['-c', 'core.quotepath=off', 'ls-files', '--', CONFIG, ...BOARD_FILES], {
    cwd: root, encoding: 'utf8', shell: false,
  });
  if (listed.error || listed.status !== 0) fail(2, `not a git repository, or git cannot run: ${root}`);

  const tracked = new Set(listed.stdout.split('\n').map((l) => l.trim()).filter(Boolean));
  const hasConfig = tracked.has(CONFIG);
  const boardFiles = BOARD_FILES.filter((f) => tracked.has(f));
  const failed = hasConfig && boardFiles.length > 0;

  const out = [`GUARD=${failed ? 'fail' : 'pass'}`, `CONFIG=${hasConfig ? 'tracked' : 'absent'}`];
  if (failed) for (const f of boardFiles) out.push(`BOARD_FILE=${f}`);
  process.stdout.write(out.join('\n') + '\n');
  process.exit(failed ? 1 : 0);
}

main(process.argv);
