/**
 * backlog-storage.cjs — Raw row reading, definitions, and persistence.
 *
 * Reads ordered rows and definitions; seeds missing definitions when
 * explicitly requested; persists rows preserving existing bytes/serialization.
 * Node built-ins only. No argv/stdin/stdout, no process exit, no shell/Git.
 */

const fs = require('node:fs');
const path = require('node:path');

const BACKLOG_FILE = 'docs/backlog.jsonl';
const DEFS_FILE = 'docs/backlog.definitions.json';

/**
 * Read the backlog file. Returns presence and ordered rows.
 * A damaged line keeps its raw text and its number.
 */
function readBoard(root) {
  const full = path.join(root, BACKLOG_FILE);
  if (!fs.existsSync(full)) return { present: false, rows: [] };
  const raw = fs.readFileSync(full, 'utf8');
  const lines = raw.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  const rows = lines.map((text, i) => {
    try {
      const t = JSON.parse(text);
      if (!t || typeof t !== 'object' || Array.isArray(t)) throw new Error('not an object');
      return { n: i + 1, text, ticket: t };
    } catch (e) {
      return { n: i + 1, text, ticket: null };
    }
  });
  return { present: true, rows };
}

/**
 * Read the definitions file. Returns { status: 'absent'|'invalid'|'usable', defs, diagnostic }.
 * - absent: file does not exist
 * - invalid: file exists but JSON is broken or shape is wrong
 * - usable: file exists and has a valid shape
 */
function readDefs(root) {
  const full = path.join(root, DEFS_FILE);
  if (!fs.existsSync(full)) return { status: 'absent', defs: null, diagnostic: null };
  try {
    const d = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (!d || !Array.isArray(d.statuses)) {
      return { status: 'invalid', defs: null, diagnostic: 'wrong-shape' };
    }
    return { status: 'usable', defs: d, diagnostic: null };
  } catch (e) {
    return { status: 'invalid', defs: null, diagnostic: 'json-error' };
  }
}

/**
 * Write the definitions file. Only called when core explicitly requests seeding.
 */
function writeDefs(root, defs) {
  const docsDir = path.join(root, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(root, DEFS_FILE), JSON.stringify(defs, null, 2) + '\n', 'utf8');
}

/**
 * Write the backlog file. Every existing line keeps its bytes and its position.
 */
function writeBoard(root, rows) {
  const docsDir = path.join(root, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(root, BACKLOG_FILE), rows.map(r => r.text).join('\n') + '\n', 'utf8');
}

module.exports = { readBoard, readDefs, writeDefs, writeBoard, BACKLOG_FILE, DEFS_FILE };
