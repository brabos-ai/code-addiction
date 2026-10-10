/**
 * next-id.cjs — Public CLI adapter over the one canonical ID allocator.
 *
 * Replaces `next-id.sh` with the SAME public contract:
 *   Usage: node .codeadd/scripts/next-id.cjs <TYPE_LETTER>
 *   - exactly one argument is read, a single uppercase A–Z letter;
 *     a missing argument or anything that is not one uppercase letter
 *     exits 1 with an ERROR line on stderr.
 *   - on success it prints %04d + letter (e.g. 0001F) on stdout, exit 0.
 *
 * THE ALLOCATION IS NOT HERE. The global counter over
 * `docs/features/[NNNN][L]-*` directories AND the raw `docs/backlog.jsonl`
 * text of the board clone (backlog-board.cjs) lives in `backlog-id.cjs`; this entry only validates its own argument
 * and renders the result. `status.sh next-id` reimplements the SAME scan for
 * its own named-prefix contract (F|H|PRD|CHG|B, exit 2 on a bad prefix) and
 * delegates to the same core once it is native (F8). There is one allocator,
 * `backlog-id.cjs`; the two entries differ only in their public argument
 * validation and exit codes, exactly as the two shells did.
 *
 * An unreadable source is reported on stderr with exit 1. At 9999 this adapter
 * preserves the old printf's minimum-width behavior and emits a five-digit
 * number. Backlog allocation has its own four-digit refusal policy in the same
 * canonical core; it does not change this public entry's output contract.
 *
 * Built-ins only: no dependency beyond the canonical core beside it. No
 * import-time I/O and no import-time exit — requiring this module allocates
 * nothing.
 */

'use strict';

const idc = require('./backlog-id.cjs');
const board = require('./backlog-board.cjs');

const TYPE_LETTER_RE = /^[A-Z]$/;

/** One human-readable stderr line per canonical-core refusal. */
const REFUSAL_MESSAGE = {
  'id-exhausted': 'ERROR: ID sequence exhausted (no number above 9999)',
  'features-unreadable': 'ERROR: docs/features is unreadable',
  'backlog-unreadable': 'ERROR: docs/backlog.jsonl is unreadable',
};

/**
 * Run the entry. argv is the full process argv; argv[2] is the type letter.
 * Surplus arguments are ignored, exactly as `next-id.sh` read only `$1`.
 *
 * @param {string[]} [argv]
 * @returns {number} the process exit code
 */
function main(argv) {
  const typeLetter = argv !== undefined ? argv[2] : process.argv[2];

  if (typeLetter === undefined || typeLetter === '') {
    process.stderr.write('ERROR: TYPE_LETTER required (F|H|R|C|D)\n');
    return 1;
  }

  if (!TYPE_LETTER_RE.test(typeLetter)) {
    process.stderr.write(
      `ERROR: TYPE_LETTER must be a single uppercase letter (got: ${typeLetter})\n`,
    );
    return 1;
  }

  // The ticket ids are counted in the board clone (synced, throttled); with no
  // board, only the feature directories count.
  const { boardRoot } = board.allocationRoot(process.cwd(), { sync: true });
  const result = idc.calculate(process.cwd(), typeLetter, { allowOverflow: true, boardRoot });
  if (!result.ok) {
    process.stderr.write(`${REFUSAL_MESSAGE[result.reason] || 'ERROR: id-allocation-failed'}\n`);
    return 1;
  }

  process.stdout.write(result.id + '\n');
  return 0;
}

module.exports = { main };

if (require.main === module) {
  process.exitCode = main(process.argv);
}
