/**
 * log-jsonl.cjs — Append one JSON line to any JSONL file (fire & forget).
 *
 * Native port of framwork/.codeadd/scripts/log-jsonl.sh, preserving its exact
 * contract: <file> <type> <agent> '<raw-extra-fields>'.
 *
 * WHAT IS PRESERVED, AND WHY IT MATTERS:
 *
 *   APPEND, NEVER REWRITE. The shell opened the target with `>>`, so an absent
 *   file is created and an existing one gains exactly one line at the end.
 *   Intermediate directories are created first (`mkdir -p`); the parent of a
 *   bare filename is `.` and is a no-op here too.
 *
 *   RAW EXTRA FIELDS. The fourth argument is spliced into the object verbatim,
 *   exactly as `printf '...%s}'` did. There is NO validation and NO escaping:
 *   malformed or hostile input produces malformed JSON, which is the old
 *   behavior. Callers own the quotes, the commas and the colons. Adding a
 *   parser here would be an unapproved behavior correction — do not.
 *
 *   TIMESTAMP PRECISION. UTC ISO-8601 to the SECOND with a literal `Z`, no
 *   milliseconds: `YYYY-MM-DDTHH:MM:SSZ`. `Date#toISOString()` yields
 *   milliseconds, so the fractional part is sliced off, never rounded.
 *
 *   OUTPUT KEYS. The emitted object is `{"ts":...,"agent":...,"type":...,<raw>}`;
 *   the shell printed `LOGGED:<file>`, `TYPE:<type>`, `AGENT:<agent>` on stdout.
 *
 *   EXIT CODES. Fewer than four arguments is a misuse exit 1, as are empty
 *   file/type/agent/fields arguments. Any extra arguments beyond the fourth are
 *   ignored, matching the shell's positional read. Success exits 0.
 *
 * Dependencies: Node >= 18 built-ins only. No shell.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const USAGE = "USAGE: node .codeadd/scripts/log-jsonl.cjs <file> <type> <agent> '<extra-fields>'";

function fail(slug) {
  process.stdout.write(`ERROR:${slug}\n`);
  process.exitCode = 1;
}

function main(argv) {
  if (argv.length < 4) {
    process.stdout.write('ERROR:missing_args\n');
    process.stdout.write(`${USAGE}\n`);
    process.exitCode = 1;
    return;
  }

  const file = argv[0];
  const type = argv[1];
  const agent = argv[2];
  const fields = argv[3];

  if (file === '') return fail('empty_file');
  if (type === '') return fail('empty_type');
  if (agent === '') return fail('empty_agent');
  if (fields === '') return fail('empty_fields');

  fs.mkdirSync(path.dirname(file), { recursive: true });

  const ts = new Date().toISOString().slice(0, 19) + 'Z';
  const line = `{"ts":"${ts}","agent":"${agent}","type":"${type}",${fields}}\n`;

  fs.appendFileSync(file, line);

  process.stdout.write(`LOGGED:${file}\n`);
  process.stdout.write(`TYPE:${type}\n`);
  process.stdout.write(`AGENT:${agent}\n`);
}

main(process.argv.slice(2));
