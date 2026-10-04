/**
 * backlog-id.cjs — Global [NNNN][L] ID calculation from raw text.
 *
 * The number is global across every work letter: it is the max over BOTH
 * sources the shell allocators scan — the immediate `docs/features/` slugs
 * (`[NNNN][L]-<name>`, one level, basename only) and the ids already on the
 * raw backlog text, docs/backlog.jsonl. Counting only the first would hand out a number a
 * ticket already holds.
 *
 * THE BACKLOG IS READ BY RAW-TEXT ANCHOR, NEVER PARSED. The exact anchor is
 * next-id.sh's and status.sh next-id's `"id":"[0-9]{4}[A-Z]"` grep — and
 * nothing else, deliberately. The allocators' own header comment claims the
 * anchor also catches `"work_id":"..."` substrings, and the probe on a row
 * carrying `"work_id":"0043F"` shows both shells allocating 0002F while a
 * work_id-aware scanner would give 0044F: the claim is false, and parity with
 * what the allocators DO decides. Damaged rows included — a hand-broken board
 * can never block an allocation — and an id quoted inside a title or a note,
 * which carries no anchor, is not counted.
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
 * At 9999 the sequence is refused rather than emitted as five digits — the
 * effective rejection the old wrapper's `^[0-9]{4}B$` filter produced.
 *
 * NO IMPORT-TIME I/O. Everything happens inside calculate(); requiring this
 * module reads nothing, so the publication entry and the CLI can both load it
 * before any operation root is selected.
 *
 * Dependencies: Node >= 18 built-ins only. No argv, stdin, stdout, exit,
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

// The raw-text anchor, verbatim what the two shell calculators grep. Valid
// rows and damaged rows both carry it; a bare `[0-9]{4}[A-Z]` in a title or
// note does not, and neither does a work_id value — the shells demonstrably
// do not count that, and parity decides. The trailing quote is only present
// on a well-formed value and is not required, so a truncated row keeps its id.
const RAW_ID_RE = /"id":"([0-9]{4}[A-Z])/g;

const MAX_NUMBER = 9999;

/**
 * Calculate the next free id for `letter` under the operation root.
 *
 * @param {string} root - absolute path to the project root
 * @param {string} letter - a single uppercase letter (the work type suffix)
 * @returns {{ok: true, id: string} |
 *           {ok: false, reason: 'features-unreadable'|'backlog-unreadable'|'id-exhausted'}}
 */
function calculate(root, letter) {
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

  let max = 0;
  for (const id of ids) {
    const n = parseInt(id.slice(0, 4), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  if (max >= MAX_NUMBER) return { ok: false, reason: 'id-exhausted' };
  return { ok: true, id: String(max + 1).padStart(4, '0') + letter };
}

module.exports = { calculate, RAW_ID_RE, DIR_ID_RE, MAX_NUMBER };
