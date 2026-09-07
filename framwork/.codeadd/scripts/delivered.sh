#!/bin/bash
# ============================================
# DELIVERED
# The per-project delivery index: write an entry, read the index, verify and
# repair its anchors.
# ============================================
# Usage: bash .codeadd/scripts/delivered.sh write < record.json
#        bash .codeadd/scripts/delivered.sh read <query> [--layer product|internal] [--limit N] [--no-verify]
#        bash .codeadd/scripts/delivered.sh verify [<id>] [--repair]
# Dependencies: bash 3.2+, git, node >= 18 (JSON parse/emit; guaranteed by the
#               CLI, the same declaration qa-preflight.sh makes)
# Output: KEY=VALUE lines, plus JSONL entries on `read`. A line starting with
#         `{` is an entry; anything else is a key.
# Exit:   0 for probe results — `read` and `verify` always exit 0, including on
#         an absent index. 1 ONLY when the filesystem refuses a write. 2 for
#         caller error: a bad mode, bad arguments, a record breaking a hard ban
#         (REFUSED=<name>), or a missing node (ERROR=node-missing).
#
# THE FORMAT IS NOT DEFINED HERE. The record, the {what, at, find} anchor, the
# four statuses, the corpus rule, the nine hard bans and the REFUSED= vocabulary
# live in add-doc-schemas/references/delivery-index.md. This script implements
# that reference; it does not extend it.
#
# THE CORPUS IS THE WHOLE DESIGN. It is every file git does not ignore
# (`git ls-files --cached --others --exclude-standard`), minus docs/, minus the
# index. Two opposite failures are avoided by that one rule:
#   - a filesystem walk finds build output and stale local copies of DELETED
#     artefacts, and reports a deleted thing alive — the failure this index
#     exists to fix, reproduced by its own implementation;
#   - a tracked-files-only scan reports uncommitted work dead, because
#     `git ls-files` without --others omits a source file created an hour ago.
# The project already declared what it considers noise, in its .gitignore. This
# script takes that at face value and adds nothing of its own.
#
# -u only, NEVER -e. `-e` would turn a probe result into an exit code, which is
# qa-preflight.sh's stated reason. The exit-1-on-refused-write departure is
# build-ledger.sh's, for its stated reason: a write that silently fails to land
# is the one case where exit 0 would be a lie.
# ============================================

set -u

usage() {
  {
    echo "Usage: delivered.sh write < record.json"
    echo "       delivered.sh read <query> [--layer product|internal] [--limit N] [--no-verify]"
    echo "       delivered.sh verify [<id>] [--repair]"
  } >&2
  exit 2
}

# node is a HARD dependency, not a degradation. Checked first, and reported with
# its own key: a caller must be able to tell "your record is invalid"
# (REFUSED=) from "this machine cannot run me" (ERROR=) without parsing prose.
command -v node >/dev/null 2>&1 || { echo "ERROR=node-missing"; exit 2; }

MODE="${1:-}"
[ -n "$MODE" ] || usage
shift

QUERY=""
LAYER=""
LIMIT="10"
NO_VERIFY=""
ENTRY_ID=""
REPAIR=""

case "$MODE" in
  write)
    [ "$#" -eq 0 ] || usage
    ;;
  read)
    QUERY="${1:-}"
    [ -n "$QUERY" ] || usage
    shift
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --layer)      LAYER="${2:-}"; [ -n "$LAYER" ] || usage; shift 2 ;;
        --limit)      LIMIT="${2:-}"; shift 2 ;;
        --no-verify)  NO_VERIFY=1; shift ;;
        *)            usage ;;
      esac
    done
    case "$LAYER" in ""|product|internal) ;; *) usage ;; esac
    case "$LIMIT" in ''|*[!0-9]*) usage ;; esac
    [ "$LIMIT" -gt 0 ] || usage
    ;;
  verify)
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --repair) REPAIR=1; shift ;;
        --*)      usage ;;
        *)        [ -z "$ENTRY_ID" ] || usage; ENTRY_ID="$1"; shift ;;
      esac
    done
    ;;
  *)
    usage
    ;;
esac

ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
[ -n "$ROOT" ] || { echo "ERROR=not-a-git-repository" >&2; exit 2; }

INDEX="$ROOT/docs/delivered.jsonl"

# The corpus, computed once and handed to node as a file so a repository with
# thousands of paths does not travel through an argument list.
CORPUS_FILE=$(mktemp 2>/dev/null) || { echo "ERROR=cannot-create-tempfile"; exit 1; }
trap 'rm -f "$CORPUS_FILE"' EXIT

# `docs/` is subtracted here rather than in node because it is part of the
# corpus RULE, not of any one mode: a find string quoted in the documentation
# being audited would otherwise keep its own item alive forever — the index
# validating itself from its own citations. The index lives under docs/, so
# this subtraction removes it too.
( cd "$ROOT" && git -c core.quotePath=false ls-files --cached --others --exclude-standard ) 2>/dev/null \
  | grep -v '^docs/' > "$CORPUS_FILE"

# The heredoc is QUOTED. Without the quotes bash would expand every `$` in the
# JavaScript below — `${...}` template literals and `$1` capture groups first.
NODE_PROG=$(cat <<'NODE'
'use strict';
const fs = require('fs');
const path = require('path');

const [MODE, INDEX, CORPUS_FILE, ROOT, QUERY, LAYER, LIMIT, NO_VERIFY, ENTRY_ID, REPAIR] =
  process.argv.slice(1);

const STATUSES = ['live', 'changed', 'gone', 'superseded'];
const RANK = { live: 0, changed: 1, superseded: 2, gone: 3 };
const REQUIRED = ['id', 'layer', 'by', 'status', 'name', 'words', 'commits', 'origin', 'items'];
const MAX_BYTES = 5 * 1024 * 1024;

function out(k, v) { process.stdout.write(k + '=' + v + '\n'); }
function refuse(name) { out('REFUSED', name); process.exit(2); }

function nowTs() { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); }
function norm(p) { return String(p).replace(/\\/g, '/').replace(/^\.\//, ''); }

// ─── The corpus ──────────────────────────────────────────────────────────────

let CORPUS = null;
let CORPUS_SET = null;
function corpus() {
  if (CORPUS) return CORPUS;
  let raw = '';
  try { raw = fs.readFileSync(CORPUS_FILE, 'utf8'); } catch (e) { raw = ''; }
  CORPUS = raw.split('\n').map(norm).filter(Boolean);
  CORPUS_SET = new Set(CORPUS);
  return CORPUS;
}
function inCorpus(rel) { corpus(); return CORPUS_SET.has(norm(rel)); }

// Byte-exact, case-sensitive matching over a Buffer, because that is what the
// anchor rule says and because a Buffer read does not throw on a binary file.
// Files carrying a NUL in their first 8KB are skipped the way `grep -I` skips
// them: an identifier does not live inside a PNG, and a coincidental byte run
// there would report a deleted thing alive.
function fileHas(rel, needle) {
  try {
    const abs = path.join(ROOT, norm(rel));
    const st = fs.statSync(abs);
    if (!st.isFile() || st.size > MAX_BYTES) return false;
    const buf = fs.readFileSync(abs);
    if (buf.subarray(0, 8192).includes(0)) return false;
    return buf.includes(needle);
  } catch (e) {
    return false;
  }
}

// Files in the corpus containing `needle`. `cap` stops the scan early, which is
// what keeps the over-match check from reading a whole monorepo to learn that
// the answer is "more than 20".
function filesMatching(needle, cap) {
  const hits = [];
  for (const rel of corpus()) {
    if (fileHas(rel, needle)) {
      hits.push(rel);
      if (cap && hits.length >= cap) break;
    }
  }
  return hits;
}

// ─── The index ───────────────────────────────────────────────────────────────

// Returns the last line per id, in first-seen order, plus the numbers of the
// lines that would not parse. A corrupt line is skipped and REPORTED, never
// fatal: an index that refuses to answer because one line is broken is worse
// than one that answers about the rest and says so.
function loadIndex() {
  const byId = new Map();
  const skipped = [];
  let raw;
  try { raw = fs.readFileSync(INDEX, 'utf8'); } catch (e) { return { byId, skipped }; }
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); } catch (e) { skipped.push(i + 1); continue; }
    if (!rec || typeof rec !== 'object' || !rec.id) { skipped.push(i + 1); continue; }
    byId.set(rec.id, rec);
  }
  return { byId, skipped };
}

function serialize(rec) {
  const o = {
    v: 1,
    ts: rec.ts,
    id: rec.id,
    layer: rec.layer,
    by: rec.by,
    status: rec.status,
    name: rec.name,
    words: rec.words,
    commits: rec.commits,
    origin: rec.origin,
    items: rec.items.map((it) => ({ what: it.what, at: it.at, find: it.find })),
  };
  if (rec.status === 'superseded') o.superseded_by = rec.superseded_by;
  if (rec.node) o.node = rec.node;
  return JSON.stringify(o);
}

function append(lines) {
  try {
    fs.mkdirSync(path.dirname(INDEX), { recursive: true });
    fs.appendFileSync(INDEX, lines.map((l) => l + '\n').join(''));
  } catch (e) {
    out('ERROR', 'cannot-write-index');
    process.exit(1);
  }
}

function countLines() {
  try {
    return fs.readFileSync(INDEX, 'utf8').split('\n').filter((l) => l.trim()).length;
  } catch (e) {
    return 0;
  }
}

// ─── Verification ────────────────────────────────────────────────────────────

// Two tiers, and the split is what keeps a read cheap: ONE file read at the
// item's recorded `at` settles the common `live` case; only an item that fails
// that first read costs the corpus-wide search that separates `changed` from
// `gone`.
//
// The aggregation is the rule the design left open and the plan then fixed:
// `superseded` (declared) wins; else ALL items gone -> gone; else ANY item gone
// or changed -> changed; else live. "ANY gone -> gone" is WRONG — an entry with
// four live items is not absent from the source, it is a feature that lost one
// capability, which is exactly what `changed` says.
function verifyEntry(rec) {
  if (rec.status === 'superseded') return { status: 'superseded', repairs: [] };

  const items = Array.isArray(rec.items) ? rec.items : [];
  if (items.length === 0) return { status: rec.status, repairs: [] };

  let gone = 0;
  let changed = 0;
  const repairs = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || !it.find) continue;
    if (inCorpus(it.at) && fileHas(it.at, it.find)) continue;

    const hits = filesMatching(it.find);
    if (hits.length === 0) { gone++; continue; }
    changed++;
    // No automatic repair without a unique match. Repointing `at` at the wrong
    // file is worse than an admittedly stale pointer, because a wrong pointer
    // looks freshly verified.
    if (hits.length === 1) repairs.push({ index: i, to: hits[0] });
  }

  let status = 'live';
  if (gone === items.length) status = 'gone';
  else if (gone > 0 || changed > 0) status = 'changed';
  return { status, repairs };
}

// ─── write ───────────────────────────────────────────────────────────────────

function doWrite() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch (e) { raw = ''; }

  let rec;
  try { rec = JSON.parse(raw); } catch (e) { refuse('invalid-json'); }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) refuse('invalid-json');

  for (const f of REQUIRED) {
    const v = rec[f];
    if (v === undefined || v === null || v === '') refuse('missing-field');
  }
  if (typeof rec.layer !== 'string' || ['product', 'internal'].indexOf(rec.layer) === -1) refuse('missing-field');
  if (typeof rec.by !== 'string' || ['done', 'verify', 'human'].indexOf(rec.by) === -1) refuse('missing-field');
  if (!Array.isArray(rec.commits) || rec.commits.length < 1) refuse('no-commits');
  if (STATUSES.indexOf(rec.status) === -1) refuse('bad-status');
  if (rec.status === 'superseded' && !rec.superseded_by) refuse('superseded-without-by');

  if (!Array.isArray(rec.items)) refuse('missing-field');
  if (rec.items.length === 0) refuse('no-items');
  if (rec.items.length > 5) refuse('too-many-items');

  const loose = [];
  for (const it of rec.items) {
    if (!it || typeof it !== 'object') refuse('missing-field');
    for (const f of ['what', 'at', 'find']) {
      if (it[f] === undefined || it[f] === null || it[f] === '') refuse('missing-field');
    }
    if (/\s/.test(it.find)) refuse('find-whitespace');

    const at = norm(it.at);
    if (at === 'docs' || at.indexOf('docs/') === 0) refuse('item-in-docs');
    // "Exists but excluded" is what `ignored` means. A path that simply is not
    // there yet is not a ban — ban 3 only demands the FIND string resolve, and
    // such an item is born `changed`, which is honest.
    if (fs.existsSync(path.join(ROOT, at)) && !inCorpus(at)) refuse('item-ignored');

    const hits = filesMatching(it.find, 21);
    if (hits.length === 0) refuse('find-absent');
    if (hits.length > 20) refuse('find-over-matched');
    if (hits.length >= 6) loose.push(it.find);
  }

  const created = !fs.existsSync(INDEX);
  rec.ts = nowTs();
  append([serialize(rec)]);

  out('ENTRY', rec.id);
  out('CREATED', String(created));
  out('LINES', String(countLines()));
  for (const f of loose) out('LOOSE', f);
}

// ─── read ────────────────────────────────────────────────────────────────────

function doRead() {
  const { byId, skipped } = loadIndex();
  const q = String(QUERY).toLowerCase();

  let list = Array.from(byId.values());
  if (LAYER) list = list.filter((e) => e.layer === LAYER);

  list = list.filter((e) => {
    const items = Array.isArray(e.items) ? e.items : [];
    const hay = [e.id, e.name, e.words]
      .concat(items.map((it) => (it && it.what) || ''))
      .concat(items.map((it) => (it && it.find) || ''))
      .join(' ')
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  });

  const matched = list.length;

  // Verification is bounded to what is being RETURNED, never to the file. That
  // is what makes stale confidence structurally impossible without a scheduler.
  // --no-verify returns the stored status and opens no source file: /add.hotfix
  // STEP 4 forbids grepping code before its history agents are dispatched, and
  // a verifying read greps source.
  if (!NO_VERIFY) {
    for (const e of list) e.status = verifyEntry(e).status;
  }

  // Ordering belongs to the read contract, not to callers: several consumers
  // each sorting one shared structure is how two of them come to disagree.
  // Dead entries rank last and are NEVER dropped — a `gone` result is often the
  // most valuable answer, because it says this was tried and abandoned.
  list.sort((a, b) => {
    const ra = RANK[a.status] === undefined ? 9 : RANK[a.status];
    const rb = RANK[b.status] === undefined ? 9 : RANK[b.status];
    if (ra !== rb) return ra - rb;
    if (a.ts !== b.ts) return a.ts < b.ts ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const limit = parseInt(LIMIT, 10);
  const returned = list.slice(0, limit);

  out('MATCHED', String(matched));
  out('RETURNED', String(returned.length));
  out('LIMIT', String(limit));
  out('SKIPPED_LINES', skipped.join(','));
  for (const e of returned) process.stdout.write(JSON.stringify(e) + '\n');
}

// ─── verify ──────────────────────────────────────────────────────────────────

function doVerify() {
  const { byId, skipped } = loadIndex();
  let list = Array.from(byId.values());
  if (ENTRY_ID) list = list.filter((e) => e.id === ENTRY_ID);

  const newLines = [];
  let repaired = 0;

  for (const e of list) {
    const r = verifyEntry(e);
    out(e.id, r.status);
    if (!REPAIR || r.repairs.length === 0) continue;

    // A repair is a NEW LINE. Nothing is ever rewritten in place — corrections
    // are appends, and the last line for an id wins.
    const copy = JSON.parse(JSON.stringify(e));
    for (const rep of r.repairs) copy.items[rep.index].at = rep.to;
    copy.ts = nowTs();
    copy.by = 'verify';
    // `changed` is deliberate on a repaired line: it does not mean "something
    // is broken here", it means "a pointer was just repaired, and documentation
    // elsewhere probably still points at the old path".
    copy.status = 'changed';
    newLines.push(serialize(copy));
    repaired++;
  }

  if (newLines.length) append(newLines);
  out('REPAIRED', String(repaired));
  out('SKIPPED_LINES', skipped.join(','));
}

if (MODE === 'write') doWrite();
else if (MODE === 'read') doRead();
else if (MODE === 'verify') doVerify();
else process.exit(2);
NODE
)

node -e "$NODE_PROG" \
  "$MODE" "$INDEX" "$CORPUS_FILE" "$ROOT" \
  "$QUERY" "$LAYER" "$LIMIT" "$NO_VERIFY" "$ENTRY_ID" "$REPAIR"

exit $?
