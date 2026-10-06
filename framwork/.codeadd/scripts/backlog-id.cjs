/**
 * backlog-id.cjs — THE canonical global [NNNN][L] ID allocator, from raw text.
 *
 * This is the one allocator. Two public entries delegate here and differ only
 * in their argument validation and exits, exactly as the two shells did:
 *   - `next-id.cjs`  — one uppercase A–Z letter, exit 1 on a bad argument.
 *   - `status next-id` (native in F8) — named prefixes F|H|PRD|CHG|B, exit 2
 *     on a bad prefix.
 * `backlog-cli.cjs` also allocates through `calculate(root, 'B')`. Keeping the
 * scan in one place is the whole point: a second copy is how the old
 * next-id.sh / status.sh pair drifted apart.
 *
 * The number is global across every work letter: it is the max over BOTH
 * sources the shell allocators scan — the immediate `docs/features/` slugs
 * (`[NNNN][L]-<name>`, one level, basename only) and the ids already on the
 * raw backlog text, docs/backlog.jsonl. Counting only the first would hand out
 * a number a ticket already holds.
 *
 * THE BACKLOG IS READ BY RAW-TEXT ANCHOR, NEVER PARSED. The exact anchor is
 * next-id.sh's and status.sh next-id's `"id":"[0-9]{4}[A-Z]"` grep, closing
 * quote included — and nothing else, deliberately. The allocators' own header
 * comment claims the anchor also catches `"work_id":"..."` substrings, and the
 * probe on a row carrying `"work_id":"0043F"` shows both shells allocating
 * 0002F while a work_id-aware scanner would give 0044F: the claim is false,
 * and parity with what the allocators DO decides. A title quoting an id, a
 * work_id value and parent-path digits are all never counted. Whitespace is
 * NOT normalized away either: `"id": "0042B"` (a space after the colon) counts
 * nothing, in both the shells and here.
 *
 * THE MATCH IS ON THE DIRECTORY BASENAME, NEVER THE PATH ABOVE IT. A parent
 * directory carrying four digits, or a slug with a year (`0001F-auth-2024`),
 * does not count; only an immediate declaration matches `^[0-9]{4}[A-Z]-`.
 *
 * An absent source is a no-op: a fresh project gets exactly 0001. An EXISTING
 * source that cannot be read is an explicit failure — silently dropping one
 * would hand out a number already on the board, which is the worst outcome
 * an allocator can have. The rejection happens BEFORE persistence by the
 * caller, and no reservation is made here: calculate is max+1 by definition,
 * stateless, with no concurrency protocol.
 *
 * Backlog allocation refuses at 9999. Public next-id/status/init adapters opt
 * into allowOverflow to preserve the old printf's minimum-width output: 10000F.
 * The scan remains shared; only the public adapter's exhaustion policy differs.
 *
 * NO IMPORT-TIME I/O. Everything happens inside scanIds()/calculate();
 * requiring this module reads nothing, so the publication entry and the CLI
 * can both load it before any operation root is selected.
 *
 * Dependencies: Node >= 22.19.0 built-ins only. No argv, stdin, stdout, exit,
 * shell, or Git.
 */

const fs = require('node:fs');
const path = require('node:path');

const FEATURES_DIR = 'docs/features';
const BACKLOG_FILE = 'docs/backlog.jsonl';

// One basename each: the id is the first five characters of a directory name
// that starts with four digits and one letter, discounting the exact '-' a
// feature slug carries after it (dirname `[0-9]{4}[A]-<slug>`, max depth 1).
const DIR_ID_RE = /^[0-9]{4}[A-Z]-/;

// The raw-text anchor, verbatim what the two shell calculators grep — closing
// quote included. Valid rows and damaged rows both yield ids when the anchor
// still resolves; a truncated row whose value lost its closing quote yields
// NOTHING, in the native code and in both shell calculators alike (both are
// grep-shaped on raw text), and parity decides that. A bare `[0-9]{4}[A-Z]`
// in a title or note never matches, and neither does a work_id value — what
// the shells actually do decides, as the fixture pins. The trailing quote was
// the plan's literal "exact raw-text expression" reading: the probe on a row
// carrying `"id":"0042B` (no closing quote) showed the shells returning base
// and the loose match handing out base+1.
const RAW_ID_RE = /"id":"([0-9]{4}[A-Z])"/g;

const MAX_NUMBER = 9999;

/**
 * The canonical scan. Collects every id both sources expose and reports them
 * as a Set of `"%04d%s"` strings, or refuses an existing-but-unreadable
 * source. This is the single implementation of the scan; `calculate` renders
 * its result and every public adapter calls `calculate`.
 *
 * @param {string} root - absolute path to the project root
 * @returns {{ok: true, ids: Set<string>} |
 *           {ok: false, reason: 'features-unreadable'|'backlog-unreadable'}}
 */
function scanIds(root) {
  const ids = new Set();

  // Source 1 — the immediate docs/features/ directory basenames.
  const featuresDir = path.join(root, FEATURES_DIR);
  if (fs.existsSync(featuresDir)) {
    let entries;
    try {
      entries = fs.readdirSync(featuresDir, { withFileTypes: true });
    } catch (e) {
      return { ok: false, reason: 'features-unreadable' };
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const match = DIR_ID_RE.exec(entry.name);
      if (match) ids.add(entry.name.slice(0, 4) + entry.name.charAt(4));
    }
  }

  // Source 2 — the raw backlog text, anchored. Damaged rows included.
  const backlogFile = path.join(root, BACKLOG_FILE);
  if (fs.existsSync(backlogFile)) {
    let raw;
    try {
      raw = fs.readFileSync(backlogFile, 'utf8');
    } catch (e) {
      return { ok: false, reason: 'backlog-unreadable' };
    }
    for (const match of raw.matchAll(RAW_ID_RE)) {
      ids.add(match[1]);
    }
  }

  return { ok: true, ids };
}

/**
 * Calculate the next free id for `letter` under the operation root.
 *
 * `letter` is appended verbatim: a single work suffix (next-id.cjs, `B` for a
 * ticket) or a named prefix (status next-id's `PRD`/`CHG`). No validation
 * happens here — each public adapter owns its own contract and exit codes.
 *
 * @param {string} root - absolute path to the project root
 * @param {string} letter - a single uppercase letter (the work type suffix)
 * @param {{allowOverflow?: boolean}} options - preserve a public adapter's minimum-width output
 * @returns {{ok: true, id: string} |
 *           {ok: false, reason: 'features-unreadable'|'backlog-unreadable'|'id-exhausted'}}
 */
function calculate(root, letter, { allowOverflow = false } = {}) {
  const scanned = scanIds(root);
  if (!scanned.ok) return { ok: false, reason: scanned.reason };

  let max = 0;
  for (const id of scanned.ids) {
    const n = parseInt(id.slice(0, 4), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  if (max >= MAX_NUMBER && !allowOverflow) return { ok: false, reason: 'id-exhausted' };
  return { ok: true, id: String(max + 1).padStart(4, '0') + letter };
}

module.exports = { calculate, scanIds, RAW_ID_RE, DIR_ID_RE, MAX_NUMBER };
