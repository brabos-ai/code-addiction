#!/bin/bash
# ============================================
# BACKLOG
# The project backlog: a prioritised ticket board the repository carries.
# Work that is decided but not started — the gap between the pipeline and
# the delivery index.
# ============================================
# Usage: bash .codeadd/scripts/backlog.sh add                < ticket.json
#        bash .codeadd/scripts/backlog.sh update  <id>       < patch.json
#        bash .codeadd/scripts/backlog.sh comment <id>       < comment.json
#        bash .codeadd/scripts/backlog.sh move    <id> --top | --after <id> | --bottom
#        bash .codeadd/scripts/backlog.sh remove  <id>
#        bash .codeadd/scripts/backlog.sh list   [--all | --status <name>]
#        bash .codeadd/scripts/backlog.sh search  <query>
#
# Dependencies: bash 3.2+, node >= 18 (JSON parse/emit — bash has no safe JSON
#               primitive, and this is a hard dependency, not a degradation)
#
# Output: KEY=VALUE lines, then raw JSONL entries. A line starting with `{` is
#         a ticket; anything else is a key. Same shape delivered.sh emits, so
#         one consumer parses both.
#
# Exit:   0 for probe results, INCLUDING an absent board — an absent board is
#         a result, not a failure. 1 ONLY when the filesystem refuses a write.
#         2 for caller error: a bad mode, bad arguments, a hard ban
#         (REFUSED=<name>), or an unmet hard dependency (ERROR=node-missing).
#         The two exit-2 causes are distinguishable by output, never by code.
#
# `set -u` ONLY, NEVER -e. With -e a probe result becomes an exit code, which
# is the reason delivered.sh and qa-preflight.sh both state in their own
# headers.
#
# THIS SCRIPT WRITES FILES AND NEVER COMMITS. It runs no git command at all.
# Getting a ticket onto the base branch belongs to the skill that calls this,
# not here — a script that commits cannot be called from the middle of a
# build without disturbing that build's own history.
#
# THE FORMAT IS NOT DEFINED HERE. The two files, the thirteen ticket fields,
# the status vocabulary, the seven hard bans and the REFUSED= names live in
# add-doc-schemas/references/backlog.md. This script implements that
# reference; it does not extend it. Its bats suite pins both.
#
# THE STATUS VOCABULARY BELONGS TO THE USER. The definitions file is created
# when absent and NEVER rewritten after that, the way build-ledger.sh and
# task-brief.sh each restate for their own one-time file. An undefined status
# is refused on a WRITE and merely reported on a READ: enforcing it is what
# makes the file mean something, and refusing to read would lock a user out
# of their own board over an edit they are entitled to make.
#
# THE ID COMES FROM THE SHARED GLOBAL COUNTER, via status.sh next-id B. It is
# never supplied by the caller and never reused, including after a remove.
# ============================================

set -u

# --- Guards -------------------------------------------------------------
#
# node is checked BEFORE anything reads or writes, so a machine without it
# gets one clear line instead of a half-written file.
command -v node >/dev/null 2>&1 || { echo "ERROR=node-missing"; exit 2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
    cat >&2 <<'USAGE'
USAGE: bash .codeadd/scripts/backlog.sh <mode> [args]
  add                       < ticket.json
  update  <id>              < patch.json
  comment <id>              < comment.json
  move    <id> --top | --after <id> | --bottom
  remove  <id>
  list    [--all | --status <name>]
  search  <query>
USAGE
}

MODE="${1:-}"
case "$MODE" in
    add|update|comment|move|remove|list|search) ;;
    *) echo "ERROR=bad-mode"; usage; exit 2 ;;
esac
shift

# --- Argument shape, per mode -------------------------------------------
#
# Checked in bash so a caller error never reaches the JSON layer, where it
# would be reported as a record problem instead of an argument one.
TARGET_ID=""
MOVE_DIR=""
MOVE_ANCHOR=""
FILTER="open"
QUERY=""

case "$MODE" in
    update|comment|remove)
        TARGET_ID="${1:-}"
        [ -n "$TARGET_ID" ] || { echo "ERROR=missing-id"; usage; exit 2; }
        ;;
    move)
        TARGET_ID="${1:-}"
        [ -n "$TARGET_ID" ] || { echo "ERROR=missing-id"; usage; exit 2; }
        shift
        # A move with no direction is a caller error, not a default. Guessing
        # one would silently reprioritise a board the caller only meant to
        # look at.
        case "${1:-}" in
            --top)    MOVE_DIR="top" ;;
            --bottom) MOVE_DIR="bottom" ;;
            --after)
                MOVE_DIR="after"
                MOVE_ANCHOR="${2:-}"
                [ -n "$MOVE_ANCHOR" ] || { echo "ERROR=missing-anchor"; usage; exit 2; }
                ;;
            *) echo "ERROR=missing-direction"; usage; exit 2 ;;
        esac
        ;;
    list)
        case "${1:-}" in
            "")        FILTER="open" ;;
            --all)     FILTER="*" ;;
            --status)
                FILTER="${2:-}"
                [ -n "$FILTER" ] || { echo "ERROR=missing-status"; usage; exit 2; }
                ;;
            *) echo "ERROR=bad-argument"; usage; exit 2 ;;
        esac
        ;;
    search)
        QUERY="${1:-}"
        [ -n "$QUERY" ] || { echo "ERROR=missing-query"; usage; exit 2; }
        ;;
esac

# --- The id, for `add` only ---------------------------------------------
#
# Allocated through status.sh, which is the allocator every command uses.
# Asking it here rather than counting ids in node keeps ONE authority for the
# global counter — see add-id-convention.
NEW_ID=""
if [ "$MODE" = "add" ]; then
    NEW_ID=$(bash "$SCRIPT_DIR/status.sh" next-id B 2>/dev/null || true)
    if ! printf '%s' "$NEW_ID" | grep -qE '^[0-9]{4}B$'; then
        echo "ERROR=id-allocation-failed"
        exit 1
    fi
fi

# --- stdin, for the three write modes that take a record ----------------
STDIN_JSON=""
case "$MODE" in
    add|update|comment) STDIN_JSON=$(cat) ;;
esac

# --- The JSON layer ------------------------------------------------------
#
# One program, a fixed argv, and the record on an environment variable rather
# than interpolated into the source — a title carrying a quote would otherwise
# end the program early.
NODE_PROG='
const fs = require("fs");
const [mode, targetId, moveDir, moveAnchor, filter, query, newId] = process.argv.slice(1);

const BACKLOG = "docs/backlog.jsonl";
const DEFS    = "docs/backlog.definitions.json";

const DEFAULT_DEFS = {
  statuses: [
    { name: "open",    order: 1, means: "decided, not started" },
    { name: "doing",   order: 2, means: "work is in progress" },
    { name: "done",    order: 3, means: "delivered" },
    { name: "dropped", order: 4, means: "decided against" }
  ]
};

const out = [];
const key = (k, v) => out.push(k + "=" + v);
const flush = (code) => { if (out.length) process.stdout.write(out.join("\n") + "\n"); process.exit(code); };
const refuse = (name) => { process.stdout.write("REFUSED=" + name + "\n"); process.exit(2); };
const cannotWrite = (why) => { process.stdout.write("ERROR=write-failed:" + why + "\n"); process.exit(1); };

const isWrite = ["add", "update", "comment", "move", "remove"].includes(mode);

// ── The definitions file ────────────────────────────────────────────────
// Created when absent, on a WRITE only — a read never brings a file into
// existence. Never rewritten once it is there: it holds user customisation,
// and the installer never touches docs/, so nothing else will restore it.
function loadDefs() {
  if (!fs.existsSync(DEFS)) {
    if (!isWrite) return DEFAULT_DEFS;
    try {
      fs.mkdirSync("docs", { recursive: true });
      fs.writeFileSync(DEFS, JSON.stringify(DEFAULT_DEFS, null, 2) + "\n", "utf8");
    } catch (e) { cannotWrite("definitions"); }
    return DEFAULT_DEFS;
  }
  try {
    const d = JSON.parse(fs.readFileSync(DEFS, "utf8"));
    if (!d || !Array.isArray(d.statuses)) return DEFAULT_DEFS;
    return d;
  } catch (e) {
    // A definitions file the user broke is not a reason to refuse. Fall back
    // to the shipped vocabulary and say so.
    key("DEFS_UNREADABLE", "yes");
    return DEFAULT_DEFS;
  }
}

// ── The board ───────────────────────────────────────────────────────────
// A damaged line keeps its raw text and its number. It is skipped by every
// reader and carried verbatim by every writer, so a rewrite never destroys
// a line this script could not understand.
function loadBoard() {
  if (!fs.existsSync(BACKLOG)) return { present: false, rows: [] };
  const raw = fs.readFileSync(BACKLOG, "utf8");
  const lines = raw.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  const rows = lines.map((text, i) => {
    try {
      const t = JSON.parse(text);
      if (!t || typeof t !== "object" || Array.isArray(t)) throw new Error("not an object");
      return { n: i + 1, text, ticket: t };
    } catch (e) {
      return { n: i + 1, text, ticket: null };
    }
  });
  return { present: true, rows };
}

function writeBoard(rows) {
  try {
    fs.mkdirSync("docs", { recursive: true });
    fs.writeFileSync(BACKLOG, rows.map(r => r.text).join("\n") + "\n", "utf8");
  } catch (e) { cannotWrite("backlog"); }
}

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

function readStdinRecord() {
  const raw = process.env.BACKLOG_STDIN || "";
  let rec;
  try { rec = JSON.parse(raw); } catch (e) { refuse("invalid-json"); }
  if (!rec || typeof rec !== "object" || Array.isArray(rec)) refuse("invalid-json");
  return rec;
}

const RESERVED = ["id", "created_at", "updated_at"];
function rejectReserved(rec) {
  for (const f of RESERVED) if (Object.prototype.hasOwnProperty.call(rec, f)) refuse("reserved-field");
}

const REQUIRED = ["title", "tldr", "done_when"];
function rejectMissing(rec) {
  for (const f of REQUIRED) {
    if (typeof rec[f] !== "string" || rec[f].trim() === "") refuse("missing-field");
  }
}

function rejectUnknownStatus(status, defs) {
  if (!defs.statuses.some(s => s.name === status)) refuse("unknown-status");
}

function findRow(rows, id) {
  return rows.find(r => r.ticket && r.ticket.id === id) || null;
}

const board = loadBoard();
const defs  = loadDefs();

// ── Writes ──────────────────────────────────────────────────────────────

if (mode === "add") {
  const rec = readStdinRecord();
  rejectReserved(rec);
  rejectMissing(rec);
  const status = typeof rec.status === "string" && rec.status !== "" ? rec.status : "open";
  rejectUnknownStatus(status, defs);
  if (findRow(board.rows, newId)) refuse("duplicate-id");

  const ts = now();
  const ticket = {
    id: newId,
    title: rec.title,
    theme: typeof rec.theme === "string" ? rec.theme : "",
    tldr: rec.tldr,
    notes: Array.isArray(rec.notes) ? rec.notes : [],
    done_when: rec.done_when,
    paths: Array.isArray(rec.paths) ? rec.paths : [],
    grounded: rec.grounded === true,
    status,
    created_at: ts,
    updated_at: ts,
    comments: [],
    work_id: typeof rec.work_id === "string" ? rec.work_id : null
  };

  // A PURE APPEND. Every existing line keeps its bytes and its position, and
  // the new ticket lands last — lowest priority until someone moves it.
  board.rows.push({ n: board.rows.length + 1, text: JSON.stringify(ticket), ticket });
  writeBoard(board.rows);
  key("TICKET_ID", ticket.id);
  flush(0);
}

if (mode === "update" || mode === "comment") {
  const row = findRow(board.rows, targetId);
  if (!row) refuse("unknown-id");
  const rec = readStdinRecord();
  const t = row.ticket;

  if (mode === "update") {
    rejectReserved(rec);
    for (const f of REQUIRED) {
      if (Object.prototype.hasOwnProperty.call(rec, f)) {
        if (typeof rec[f] !== "string" || rec[f].trim() === "") refuse("missing-field");
      }
    }
    if (Object.prototype.hasOwnProperty.call(rec, "status")) rejectUnknownStatus(rec.status, defs);
    if (Object.prototype.hasOwnProperty.call(rec, "comments")) refuse("reserved-field");
    for (const k of Object.keys(rec)) t[k] = rec[k];
  } else {
    if (typeof rec.content !== "string" || rec.content.trim() === "") refuse("missing-field");
    t.comments = Array.isArray(t.comments) ? t.comments : [];
    t.comments.push({ content: rec.content, created_at: now() });
  }

  // created_at is never bumped; updated_at always is.
  t.updated_at = now();
  row.text = JSON.stringify(t);
  writeBoard(board.rows);
  key("TICKET_ID", t.id);
  flush(0);
}

if (mode === "remove") {
  const row = findRow(board.rows, targetId);
  if (!row) refuse("unknown-id");
  // Exactly one line goes. Nothing is renumbered — ids are stable and are
  // never reused, which is why the global counter is not rewound either.
  writeBoard(board.rows.filter(r => r !== row));
  key("TICKET_ID", targetId);
  flush(0);
}

if (mode === "move") {
  const row = findRow(board.rows, targetId);
  if (!row) refuse("unknown-id");
  const rest = board.rows.filter(r => r !== row);
  let next;
  if (moveDir === "top") {
    next = [row].concat(rest);
  } else if (moveDir === "bottom") {
    next = rest.concat([row]);
  } else {
    const anchor = findRow(rest, moveAnchor);
    if (!anchor) refuse("unknown-id");
    const at = rest.indexOf(anchor);
    next = rest.slice(0, at + 1).concat([row], rest.slice(at + 1));
  }
  // THE ONLY MODE THAT REWRITES THE FILE, and the only one whose
  // correctness is about the whole board rather than one line. Every line
  // keeps its bytes — a damaged one included, which is why rows carry their
  // raw text — and only the order changes. That is what LINES_BYTE_STABLE
  // checks under move: the multiset of lines before and after is equal.
  writeBoard(next);
  key("TICKET_ID", targetId);
  flush(0);
}

// ── Reads ───────────────────────────────────────────────────────────────

const parsed  = board.rows.filter(r => r.ticket);
const damaged = board.rows.filter(r => !r.ticket);

key("BACKLOG_PRESENT", board.present ? "yes" : "no");
key("TICKETS_TOTAL", String(parsed.length));

let hits = parsed;
if (mode === "list") {
  if (filter !== "*") hits = parsed.filter(r => r.ticket.status === filter);
} else {
  const q = String(query).toLowerCase();
  hits = parsed.filter(r => {
    const t = r.ticket;
    const hay = [t.title || "", t.tldr || ""].concat(Array.isArray(t.notes) ? t.notes : []).join(" ").toLowerCase();
    return hay.includes(q);
  });
}

key("TICKETS_RETURNED", String(hits.length));
key("DAMAGED_LINES", String(damaged.length));
for (const d of damaged) key("DAMAGED_LINE", String(d.n));

// A status in use that the definitions no longer define is REPORTED, never a
// reason to refuse a read.
const defined = new Set(defs.statuses.map(s => s.name));
const undef = [];
for (const r of parsed) if (!defined.has(r.ticket.status) && !undef.includes(r.ticket.status)) undef.push(r.ticket.status);
for (const u of undef) key("UNDEFINED_STATUS", u);

if (out.length) process.stdout.write(out.join("\n") + "\n");
// Board order is priority order, and it survives every filter.
for (const r of hits) process.stdout.write(r.text + "\n");
process.exit(0);
'

BACKLOG_STDIN="$STDIN_JSON" node -e "$NODE_PROG" -- \
    "$MODE" "$TARGET_ID" "$MOVE_DIR" "$MOVE_ANCHOR" "$FILTER" "$QUERY" "$NEW_ID"
