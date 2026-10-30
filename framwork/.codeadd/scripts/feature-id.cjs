/**
 * feature-id.cjs — THE canonical global [NNNN][L] ID allocator.
 *
 * This is the one allocator. Two public entries delegate here and differ only
 * in their argument validation and exits:
 *   - `next-id.cjs`  — one uppercase A–Z letter, exit 1 on a bad argument.
 *   - `status next-id` — named prefixes F|H|PRD|CHG, exit 2 on a bad prefix.
 * `init.cjs` allocates through the same `calculate`. Keeping the scan in one
 * place is the whole point: a second copy is how two allocators drift apart.
 *
 * The number is global across every work letter: it is the max over the
 * immediate `docs/features/` folders (`[NNNN][L]-<name>`, one level, basename
 * only). Nothing else is counted — no ticket file, no board.
 *
 * THE MATCH IS ON THE DIRECTORY BASENAME, NEVER THE PATH ABOVE IT. A parent
 * directory carrying four digits, or a slug with a year (`0001F-auth-2024`),
 * does not count; only an immediate declaration matches `^[0-9]{4}[A-Z]-`.
 * The letter is read as any A–Z, so folders from older work keep counting.
 *
 * An absent `docs/features` is a no-op: a fresh project gets exactly 0001. An
 * EXISTING one that cannot be read is an explicit failure — silently dropping
 * it would hand out a number already in use. The rejection happens BEFORE
 * persistence by the caller, and no reservation is made here: calculate is
 * max+1 by definition, stateless, with no concurrency protocol.
 *
 * `calculate` refuses at 9999. Public next-id/status/init adapters opt into
 * allowOverflow to keep the minimum-width output: 10000F. The scan is shared;
 * only the public adapter's exhaustion policy differs.
 *
 * NO IMPORT-TIME I/O. Everything happens inside scanIds()/calculate();
 * requiring this module reads nothing.
 *
 * Dependencies: Node >= 22.19.0 built-ins only. No argv, stdin, stdout, exit,
 * shell, or Git.
 */

const fs = require('node:fs');
const path = require('node:path');

const FEATURES_DIR = 'docs/features';

// One basename each: the id is the first five characters of a directory name
// that starts with four digits and one letter, discounting the exact '-' a
// feature slug carries after it (dirname `[0-9]{4}[A-Z]-<slug>`, max depth 1).
const DIR_ID_RE = /^[0-9]{4}[A-Z]-/;

const MAX_NUMBER = 9999;

/**
 * The canonical scan. Collects every id the feature folders expose as a Set of
 * `"%04d%s"` strings, or refuses an existing-but-unreadable folder. This is
 * the single implementation of the scan; `calculate` renders its result and
 * every public adapter calls `calculate`.
 *
 * @param {string} root - absolute path to the project root
 * @returns {{ok: true, ids: Set<string>} |
 *           {ok: false, reason: 'features-unreadable'}}
 */
function scanIds(root) {
  const ids = new Set();

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

  return { ok: true, ids };
}

/**
 * Calculate the next free id for `letter` under the operation root.
 *
 * `letter` is appended verbatim: a single work suffix (next-id.cjs) or a named
 * prefix (status next-id's `PRD`/`CHG`). No validation happens here — each
 * public adapter owns its own contract and exit codes.
 *
 * @param {string} root - absolute path to the project root
 * @param {string} letter - the work type suffix
 * @param {{allowOverflow?: boolean}} options - allowOverflow preserves a
 *   public adapter's minimum-width output
 * @returns {{ok: true, id: string} |
 *           {ok: false, reason: 'features-unreadable'|'id-exhausted'}}
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

module.exports = { calculate, scanIds, DIR_ID_RE, MAX_NUMBER };
