/**
 * backlog-cli.cjs — Local backlog entry: positional grammar, record capture,
 * stdout rendering, exit codes.
 *
 * Reads BACKLOG_NEW_ID from the environment for add — the legacy allocation
 * path. When it is absent, the id is calculated natively from the chosen
 * operation root by backlog-id.cjs; at 9999 the sequence is refused with
 * ERROR=id-allocation-failed, exit 1, and never a five-digit ticket. Malformed
 * or empty metadata EXPLICITLY supplied fails with the same error.
 *
 * For record modes (add/update/comment) only, a trailing `--record-file
 * <path>` pair supplies the record; no pair means stdin. The file is read
 * from the caller's cwd, before allocation, and is authoritative: when one
 * is supplied, stdin is never touched — not inspected, not drained. A
 * file-read failure exits 1 with ERROR=record-read-failed before allocation
 * or any persistence. Non-record modes never consume stdin.
 *
 * Consumes stdin only for add/update/comment. Renders KEY=VALUE lines then
 * raw JSONL rows. Exit codes: 0 success, 1 write failure, 2 caller error.
 *
 * Reusable exports: parseInvocation (argv grammar — never interprets an
 * option-looking target ID or search text as a flag), captureRecord (file
 * capture, authoritative over stdin), and renderOperation (result to the
 * KEY=VALUE/JSONL shape). They are exported as functions and guarded against
 * import-time execution, so the native publication entry can parse once,
 * capture the record once and render through the same code instead of
 * shelling to this module or duplicating the grammar.
 */

const fs = require('node:fs');
const path = require('node:path');
const core = require('./backlog-core.cjs');
const idc = require('./backlog-id.cjs');

const USAGE = `USAGE: node .codeadd/scripts/backlog-cli.cjs <mode> [args]
  add                       --record-file ticket.json
  update  <id>              --record-file patch.json
  comment <id>              --record-file comment.json
  move    <id> --top | --after <id> | --bottom
  remove  <id>
  list    [--all | --status <name>]
  search  <query>
Compatibility: bash .codeadd/scripts/backlog.sh <mode> [args] < record.json
`;

const MODES = ['add', 'update', 'comment', 'move', 'remove', 'list', 'search'];
const RECORD_MODES = ['add', 'update', 'comment'];
const RECORD_FILE_FLAG = '--record-file';

function usage() {
  process.stderr.write(USAGE);
}

/**
 * Parse the positional grammar. Surplus arguments are ignored exactly as
 * today; the target position is reserved before a trailing record-file pair
 * is removed, so an option-looking ID or search text keeps its literal
 * meaning. `--record-file` is the only flag this parser knows.
 *
 * @param {string[]} argv - arguments after the mode... INCLUDING the mode
 * @returns {object} invocation — { mode, targetId, moveDir, moveAnchor,
 *   filter, query, recordSource, ok: true } or { ok: false, error, usage }
 */
function parseInvocation(argv) {
  const args = [...argv];
  const mode = args[0] || '';
  args.shift();

  if (!MODES.includes(mode)) {
    return { ok: false, error: 'bad-mode', usage: true };
  }

  const rest = args;
  const isRecordMode = RECORD_MODES.includes(mode);

  // Only the surplus portion of a record invocation may carry the trailing
  // file pair. Missing/repeated/nontrailing options are caller errors.
  let recordSource = null;
  if (isRecordMode) {
    // The first update/comment argument is always a literal target, even if
    // it is spelled --record-file. Only surplus arguments can carry the pair.
    const optionStart = mode === 'add' ? 0 : 1;
    const occurrences = rest.slice(optionStart).filter((a) => a === RECORD_FILE_FLAG).length;
    if (occurrences > 1) {
      return { ok: false, error: 'bad-argument', usage: true };
    }
    const idx = rest.indexOf(RECORD_FILE_FLAG, optionStart);
    if (idx === -1) {
      recordSource = { kind: 'stdin' };
    } else {
      const value = rest[idx + 1];
      if (value === undefined || value === '' || idx !== rest.length - 2) {
        return { ok: false, error: 'bad-argument', usage: true };
      }
      recordSource = { kind: 'file', path: value };
      rest.splice(idx, 2);
    }
  }

  let targetId = '';
  let moveDir = '';
  let moveAnchor = '';
  let filter = 'open';
  let query = '';

  if (['update', 'comment', 'remove'].includes(mode)) {
    targetId = rest[0] || '';
    if (!targetId) return { ok: false, error: 'missing-id', usage: true };
  } else if (mode === 'move') {
    targetId = rest[0] || '';
    if (!targetId) return { ok: false, error: 'missing-id', usage: true };
    const dir = rest[1] || '';
    if (dir === '--top') {
      moveDir = 'top';
    } else if (dir === '--bottom') {
      moveDir = 'bottom';
    } else if (dir === '--after') {
      moveDir = 'after';
      moveAnchor = rest[2] || '';
      if (!moveAnchor) return { ok: false, error: 'missing-anchor', usage: true };
    } else {
      return { ok: false, error: 'missing-direction', usage: true };
    }
  } else if (mode === 'list') {
    const opt = rest[0] || '';
    if (opt === '') {
      filter = 'open';
    } else if (opt === '--all') {
      filter = '*';
    } else if (opt === '--status') {
      filter = rest[1] || '';
      if (!filter) return { ok: false, error: 'missing-status', usage: true };
    } else {
      return { ok: false, error: 'bad-argument', usage: true };
    }
  } else if (mode === 'search') {
    query = rest[0] || '';
    if (!query) return { ok: false, error: 'missing-query', usage: true };
  }

  return { ok: true, mode, targetId, moveDir, moveAnchor, filter, query, recordSource };
}

/**
 * Read the record for a record mode. A file source wins: resolved against
 * the caller's cwd (absolute paths stay absolute), read whole, and stdin is
 * never touched. A failed read is an explicit caller-visible failure. A
 * stdin source reads fd 0 once, exactly as today; a failed stdin read keeps
 * the legacy empty-string result.
 *
 * @param {{kind: 'stdin'}|{kind: 'file', path: string}} recordSource
 * @returns {{ok: true, raw: string}|{ok: false, error: 'record-read-failed'}}
 */
function captureRecord(recordSource) {
  if (!recordSource) return { ok: true, raw: '' };
  if (recordSource.kind === 'file') {
    let raw;
    try {
      raw = fs.readFileSync(path.resolve(process.cwd(), recordSource.path), 'utf8');
    } catch (e) {
      return { ok: false, error: 'record-read-failed' };
    }
    return { ok: true, raw };
  }
  try {
    return { ok: true, raw: fs.readFileSync(0, 'utf8') };
  } catch (e) {
    return { ok: true, raw: '' };
  }
}

/**
 * Resolve the new id for `add`. When BACKLOG_NEW_ID carries the metadata the
 * shell used to provide, it keeps the legacy contract: valid four-digit B
 * metadata is used as-is; explicitly-supplied malformed or empty metadata
 * fails. When the metadata is absent, the id is calculated natively from the
 * operation root; exhaustion or an unreadable source refuses the allocation.
 *
 * @param {string} root - the operation root
 * @returns {{ok: true, id: string}|{ok: false}}
 */
function resolveNewId(root) {
  const hasMetadata = Object.prototype.hasOwnProperty.call(process.env, 'BACKLOG_NEW_ID');
  if (hasMetadata) {
    const given = process.env.BACKLOG_NEW_ID || '';
    if (!/^[0-9]{4}B$/.test(given)) return { ok: false };
    return { ok: true, id: given };
  }
  const native = idc.calculate(root, 'B');
  if (!native.ok) return { ok: false };
  return { ok: true, id: native.id };
}

/**
 * Turn a core result into the local output: KEY=VALUE lines, then raw JSONL
 * rows for reads. Failed results are handled by the caller the way today's
 * caller handles them — refusals on stdout, write failures distinguished.
 *
 * @param {object} result - a core executeBacklog result with ok: true
 * @returns {string} the output text, trailing newline included
 */
function renderOperation(result) {
  const out = [];
  const key = (k, v) => out.push(k + '=' + v);

  for (const d of result.diagnostics) key(d.key, d.value);

  if (result.read) {
    key('BACKLOG_PRESENT', result.present ? 'yes' : 'no');
    key('TICKETS_TOTAL', String(result.total));
    key('TICKETS_RETURNED', String(result.returned));
    key('DAMAGED_LINES', String(result.damaged.length));
    for (const n of result.damaged) key('DAMAGED_LINE', String(n));
    for (const u of result.undefinedStatuses) key('UNDEFINED_STATUS', u);
    for (const row of result.rows) out.push(row);
  } else {
    key('TICKET_ID', result.ticketId);
  }

  if (!out.length) return '';
  return out.join('\n') + '\n';
}

/**
 * Execute one local invocation. argv defaults to the process arguments.
 *
 * @param {string[]} [argv]
 */
function main(argv) {
  const invocation = parseInvocation(argv !== undefined ? argv : process.argv.slice(2));

  if (!invocation.ok) {
    process.stdout.write('ERROR=' + invocation.error + '\n');
    if (invocation.usage) usage();
    process.exit(2);
  }

  const { mode } = invocation;
  const root = process.cwd();

  // Mode-order note: a file read failure exits BEFORE allocation and
  // persistence; on the stdin path the allocation carries the metadata
  // check that today precedes the stdin read, and stays there.
  let record = null;
  if (invocation.recordSource && invocation.recordSource.kind === 'file') {
    record = captureRecord(invocation.recordSource);
    if (!record.ok) {
      process.stdout.write('ERROR=' + record.error + '\n');
      process.exit(1);
    }
  }

  let newId = '';
  if (mode === 'add') {
    const resolved = resolveNewId(root);
    if (!resolved.ok) {
      process.stdout.write('ERROR=id-allocation-failed\n');
      process.exit(1);
    }
    newId = resolved.id;
  }

  // Stdin capture stays exactly where the legacy contract had it.
  let rawRecord = '';
  if (invocation.recordSource && invocation.recordSource.kind === 'stdin') {
    record = captureRecord(invocation.recordSource);
    rawRecord = record.raw;
  } else if (record) {
    rawRecord = record.raw;
  }

  const result = core.executeBacklog({
    root,
    mode,
    targetId: invocation.targetId,
    moveDir: invocation.moveDir,
    moveAnchor: invocation.moveAnchor,
    filter: invocation.filter,
    query: invocation.query,
    rawRecord,
    newId
  });

  if (!result.ok) {
    if (result.writeFailure) {
      process.stdout.write('ERROR=write-failed:' + result.writeFailure + '\n');
      process.exit(1);
    }
    process.stdout.write('REFUSED=' + result.refusal + '\n');
    process.exit(2);
  }

  process.stdout.write(renderOperation(result));
  process.exit(0);
}

module.exports = { parseInvocation, captureRecord, resolveNewId, renderOperation, USAGE };

if (require.main === module) {
  main();
}
