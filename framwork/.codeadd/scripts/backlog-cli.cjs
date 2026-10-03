/**
 * backlog-cli.cjs — Positional grammar, stdin, stdout/stderr, exit codes.
 *
 * Reads BACKLOG_NEW_ID from environment for add. Consumes stdin only for
 * add/update/comment. Renders KEY=VALUE lines then raw JSONL rows.
 * Exit codes: 0 success, 1 write failure, 2 caller error.
 */

const fs = require('node:fs');
const path = require('node:path');
const core = require('./backlog-core.cjs');

const USAGE = `USAGE: bash .codeadd/scripts/backlog.sh <mode> [args]
  add                       < ticket.json
  update  <id>              < patch.json
  comment <id>              < comment.json
  move    <id> --top | --after <id> | --bottom
  remove  <id>
  list    [--all | --status <name>]
  search  <query>
`;

function usage() {
  process.stderr.write(USAGE);
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '';

  // Validate mode
  if (!['add', 'update', 'comment', 'move', 'remove', 'list', 'search'].includes(mode)) {
    process.stdout.write('ERROR=bad-mode\n');
    usage();
    process.exit(2);
  }

  // Parse arguments per mode
  let targetId = '';
  let moveDir = '';
  let moveAnchor = '';
  let filter = 'open';
  let query = '';

  const rest = args.slice(1);

  if (['update', 'comment', 'remove'].includes(mode)) {
    targetId = rest[0] || '';
    if (!targetId) {
      process.stdout.write('ERROR=missing-id\n');
      usage();
      process.exit(2);
    }
  } else if (mode === 'move') {
    targetId = rest[0] || '';
    if (!targetId) {
      process.stdout.write('ERROR=missing-id\n');
      usage();
      process.exit(2);
    }
    const dir = rest[1] || '';
    if (dir === '--top') {
      moveDir = 'top';
    } else if (dir === '--bottom') {
      moveDir = 'bottom';
    } else if (dir === '--after') {
      moveDir = 'after';
      moveAnchor = rest[2] || '';
      if (!moveAnchor) {
        process.stdout.write('ERROR=missing-anchor\n');
        usage();
        process.exit(2);
      }
    } else {
      process.stdout.write('ERROR=missing-direction\n');
      usage();
      process.exit(2);
    }
  } else if (mode === 'list') {
    const opt = rest[0] || '';
    if (opt === '') {
      filter = 'open';
    } else if (opt === '--all') {
      filter = '*';
    } else if (opt === '--status') {
      filter = rest[1] || '';
      if (!filter) {
        process.stdout.write('ERROR=missing-status\n');
        usage();
        process.exit(2);
      }
    } else {
      process.stdout.write('ERROR=bad-argument\n');
      usage();
      process.exit(2);
    }
  } else if (mode === 'search') {
    query = rest[0] || '';
    if (!query) {
      process.stdout.write('ERROR=missing-query\n');
      usage();
      process.exit(2);
    }
  }

  // Validate allocation metadata before consuming stdin.
  if (mode === 'add' && !/^[0-9]{4}B$/.test(process.env.BACKLOG_NEW_ID || '')) {
    process.stdout.write('ERROR=id-allocation-failed\n');
    process.exit(1);
  }

  // Read stdin for record modes
  let rawRecord = '';
  if (['add', 'update', 'comment'].includes(mode)) {
    try {
      rawRecord = fs.readFileSync(0, 'utf8');
    } catch (e) {
      // stdin read failure — treat as empty
    }
  }

  // Get new ID from environment for add
  let newId = '';
  if (mode === 'add') {
    newId = process.env.BACKLOG_NEW_ID || '';
    if (!/^[0-9]{4}B$/.test(newId)) {
      process.stdout.write('ERROR=id-allocation-failed\n');
      process.exit(1);
    }
  }

  // Resolve root from the script's location
  // SCRIPT_DIR = framwork/.codeadd/scripts/
  // root = framwork/.codeadd/scripts/../../../ = repo root
  const SCRIPT_DIR = path.resolve(__dirname);
  const root = process.cwd();

  // Execute
  const result = core.executeBacklog({
    root,
    mode,
    targetId,
    moveDir,
    moveAnchor,
    filter,
    query,
    rawRecord,
    newId
  });

  // Render output
  const out = [];
  const key = (k, v) => out.push(k + '=' + v);

  if (!result.ok) {
    if (result.writeFailure) {
      process.stdout.write('ERROR=write-failed:' + result.writeFailure + '\n');
      process.exit(1);
    }
    // Refusal or write failure — discard buffered diagnostics
    process.stdout.write('REFUSED=' + result.refusal + '\n');
    process.exit(2);
  }

  for (const d of result.diagnostics) key(d.key, d.value);

  if (result.read) {
    // Read result
    key('BACKLOG_PRESENT', result.present ? 'yes' : 'no');
    key('TICKETS_TOTAL', String(result.total));
    key('TICKETS_RETURNED', String(result.returned));
    key('DAMAGED_LINES', String(result.damaged.length));
    for (const n of result.damaged) key('DAMAGED_LINE', String(n));
    for (const u of result.undefinedStatuses) key('UNDEFINED_STATUS', u);
  } else {
    // Write result
    key('TICKET_ID', result.ticketId);
  }

  // Diagnostics

  if (out.length) process.stdout.write(out.join('\n') + '\n');

  // Raw rows for reads
  if (result.read) {
    for (const row of result.rows) process.stdout.write(row + '\n');
  }

  process.exit(0);
}

main();
