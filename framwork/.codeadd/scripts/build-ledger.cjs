#!/usr/bin/env node
'use strict';
/**
 * build-ledger.cjs — Append ONE line to a feature's build ledger, creating the
 * file with its identity header when absent.
 *
 * Native port of build-ledger.sh (F10, product layer). Dependencies: Node
 * built-ins only. No shell, no git.
 *
 * Usage: node .codeadd/scripts/build-ledger.cjs <LEDGER_FILE> <LINE> [FEATURE_ID] [PLAN_PATH]
 * Output: KEY=VALUE lines — LEDGER=<path exactly as given>, CREATED=true|false,
 *         LINES=<entries after the header>.
 * Exit:   0 on success. 2 ONLY on CLI misuse. 1 only when the filesystem
 *         refuses the write — a ruling that silently fails to land is worse
 *         than a loud failure, so this one case does not exit 0.
 *
 * IT IS A LOG, NOT A SET: the same line twice appends twice. De-duplicating
 * would erase "fix round 1" followed by "fix round 2" of the same finding, and
 * would hide that a task was re-entered after a crash.
 *
 * THE IDENTITY HEADER is written once, on creation only. FEATURE_ID and
 * PLAN_PATH are optional; when omitted they are derived from the ledger's own
 * directory (`docs/features/<ID>/build-ledger.md` → id `0003F-signup`, plan
 * `<dir>/plan.md`). Once the file exists they are IGNORED: the header is never
 * rewritten, because a ledger whose identity changes mid-build is a ledger
 * that cannot be trusted.
 *
 * THE PATH IS DERIVED POSIX-STYLE. `LEDGER=` prints the argument verbatim, and
 * the default PLAN_PATH is `<dirname as posix>/plan.md`, matching what the
 * shell emitted under the documented forward-slash form. Backslashes are only
 * normalised for that derivation, never in the printed contract.
 *
 * NO IMPORT-TIME I/O OR EXIT: every side effect lives inside run(), reached
 * only when this file is executed as the entry point.
 */

const fs = require('node:fs');
const path = require('node:path');

const USAGE = [
  'Usage: build-ledger.cjs <LEDGER_FILE> <LINE> [FEATURE_ID] [PLAN_PATH]',
  '  LEDGER_FILE  docs/features/<ID>/build-ledger.md, or <SF_DIR>/build-ledger.md on an epic',
  '  LINE         one event, one line — must not be empty and must not contain a newline',
  '  FEATURE_ID   optional; defaults to the ledger directory\'s name',
  '  PLAN_PATH    optional; defaults to <ledger directory>/plan.md',
];

/** Misuse: print usage to stderr and exit 2. No success contract is printed. */
function usage() {
  process.stderr.write(USAGE.join('\n') + '\n');
  process.exit(2);
}

/** A refused filesystem write is loud: `ERROR=` to stderr and exit 1. */
function fail(reason) {
  process.stderr.write(`ERROR=${reason}\n`);
  process.exit(1);
}

/**
 * POSIX dirname over a path whose separators were normalised to `/`, so the
 * derived default identity stays forward-slash on every platform.
 */
function posixDirname(p) {
  return path.posix.dirname(p.replace(/\\/g, '/'));
}

function posixBasename(p) {
  return path.posix.basename(p);
}

/**
 * Count entries only: line 1 is the header, line 2 is the blank line under it.
 * Mirrors `awk 'NR > 2 && $0 != "" { n++ } END { print n + 0 }'`; an unreadable
 * file yields 0 rather than a failure (the shell swallowed awk's stderr too).
 */
function countEntries(content) {
  const lines = String(content).split('\n');
  let n = 0;
  for (let i = 2; i < lines.length; i += 1) {
    if (lines[i] !== '') n += 1;
  }
  return n;
}

function run(argv) {
  const args = argv.slice(2);

  // [ "$#" -ge 2 ] && [ "$#" -le 4 ] || usage
  if (args.length < 2 || args.length > 4) usage();

  const LEDGER_FILE = args[0];
  const LINE = args[1];
  const FEATURE_ID = args[2] !== undefined ? args[2] : '';
  const PLAN_PATH = args[3] !== undefined ? args[3] : '';

  // An empty ledger path is not a target, and an empty line is not an event:
  // appending it would put a blank row in an append-only log.
  if (LEDGER_FILE === '') usage();
  if (LINE === '') usage();

  // One line per event is the whole shape. A multi-line LINE would break every
  // reader that counts entries or resumes from the last one — misuse, refused
  // BEFORE any directory or file is touched.
  if (LINE.includes('\n')) usage();

  const LEDGER_DIR = posixDirname(LEDGER_FILE);

  // mkdir -p, then fail loudly if the directory still cannot exist.
  try {
    fs.mkdirSync(LEDGER_DIR, { recursive: true });
  } catch (err) {
    fail(`Cannot create directory ${LEDGER_DIR}`);
  }

  let created = false;

  // Creation-only identity: only consulted when the file is absent.
  if (!fs.existsSync(LEDGER_FILE) || !fs.statSync(LEDGER_FILE).isFile()) {
    const id = FEATURE_ID !== '' ? FEATURE_ID : posixBasename(LEDGER_DIR);
    const plan = PLAN_PATH !== '' ? PLAN_PATH : `${LEDGER_DIR}/plan.md`;

    try {
      fs.writeFileSync(LEDGER_FILE, `# Build ledger — feature: ${id} — plan: ${plan}\n\n`);
    } catch (err) {
      fail(`Cannot write ${LEDGER_FILE}`);
    }
    created = true;
  }

  // appendFileSync never builds a format string from the line: a ruling reads
  // "100% of `UserDto.name` uses %s", and the line is content byte-for-byte.
  try {
    fs.appendFileSync(LEDGER_FILE, `${LINE}\n`);
  } catch (err) {
    fail(`Cannot append to ${LEDGER_FILE}`);
  }

  let lines = 0;
  try {
    lines = countEntries(fs.readFileSync(LEDGER_FILE, 'utf8'));
  } catch (err) {
    lines = 0;
  }

  process.stdout.write(
    `LEDGER=${LEDGER_FILE}\nCREATED=${created ? 'true' : 'false'}\nLINES=${lines}\n`,
  );
  process.exit(0);
}

if (require.main === module) {
  run(process.argv);
}

module.exports = { run, usage, fail, countEntries, posixDirname };
