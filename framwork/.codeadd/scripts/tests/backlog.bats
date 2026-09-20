#!/usr/bin/env bats
# backlog.sh — the project backlog: a prioritised ticket board a script owns
# (plan docs/plans/2026-09-20T111051-PLAN--project-backlog-001-format-and-script.md,
# F1). RED-FIRST: the script under test does not exist yet, and neither
# allocator reads the backlog — every test below except the two regression
# guards is expected to fail until F2–F8 land. That failure IS the point, and
# this file is committed BEFORE them.
#
# Contract under test (add-doc-schemas/references/backlog.md, F5):
#   Usage: backlog.sh add                < ticket.json
#          backlog.sh update  <id>       < patch.json
#          backlog.sh comment <id>       < comment.json
#          backlog.sh move    <id> --top | --after <id> | --bottom
#          backlog.sh remove  <id>
#          backlog.sh list   [--status <name>|--all]
#          backlog.sh search  <query>
#
#   - TWO FILES, one script. docs/backlog.jsonl is the board; one minified JSON
#     object per line, UTF-8, LF, and THE ORDER OF THE LINES IS THE PRIORITY.
#     docs/backlog.definitions.json is the status vocabulary, created when
#     absent and NEVER rewritten thereafter — it holds user customisation, and
#     build-ledger.sh and task-brief.sh each restate their own version of that
#     rule locally because no shared convention document exists.
#
#   - `set -u` only, NEVER -e: -e would turn a probe result into an exit code,
#     which is the reason delivered.sh and qa-preflight.sh both state.
#   - node is a HARD dependency, checked before any file I/O, because bash has
#     no safe JSON primitive. Missing node prints ERROR=node-missing, exit 2.
#   - exit 0 for every probe result INCLUDING an absent backlog — an absent
#     board is a result, not a failure. exit 1 ONLY when the filesystem refuses
#     a write. exit 2 for caller error: a bad mode, bad arguments, a hard ban
#     (REFUSED=<name>), or ERROR=node-missing.
#   - Output is KEY=VALUE lines, then raw JSONL entries. A line starting with
#     `{` is a ticket; anything else is a key.
#
#   - ADD IS A PURE APPEND AT THE END. A new ticket is the lowest priority
#     until someone moves it. `move` is the ONLY mode that reorders, and the
#     only one that rewrites the whole file. Every other write leaves all
#     other lines BYTE-IDENTICAL — that is what LINES_BYTE_STABLE asserts, and
#     it is the testable form of the one-line-diff argument the design makes.
#
#   - THE ID COMES FROM THE SHARED GLOBAL COUNTER, as [NNNN][L] with letter B.
#     Both next-id.sh and status.sh next-id must return the SAME string for the
#     same tree — status.sh reimplements the scan rather than calling next-id.sh
#     and ALREADY DIVERGES today (allowlist F|H|PRD|CHG, exit 2 on anything
#     else). NEXT_ID_AGREE is the only thing that will hold them equal.
#   - THE ALLOCATORS NEVER PARSE JSON. They grep the raw file for [0-9]{4}[A-Z],
#     exactly as next-id.sh already greps directory names. Neither gains a node
#     dependency, and a line whose JSON is damaged still yields its id — so a
#     damaged board can never block /add.new.
#
#   - A damaged line is REPORTED BY NUMBER and skipped by list/search; every
#     other ticket still answers. A status present on a ticket that the
#     definitions no longer define is REPORTED, never a reason to refuse a
#     read — refusing would lock a user out of their own board over a config
#     edit they are allowed to make. On a WRITE, an undefined status is refused.
#
#   - Hard bans, each with its REFUSED= name:
#       1 id is generated, never supplied            REFUSED=reserved-field
#       2 created_at / updated_at are generated      REFUSED=reserved-field
#       3 status must be defined in definitions      REFUSED=unknown-status
#       4 an id already on the board is never re-added  REFUSED=duplicate-id
#       5 title, tldr and done_when are required     REFUSED=missing-field
#       6 stdin must be exactly one JSON object      REFUSED=invalid-json
#       7 an id named by update/comment/move/remove must exist  REFUSED=unknown-id
#
#   - backlog.sh WRITES FILES AND NEVER COMMITS. The git route to the base
#     branch belongs to the skill in subtopic 002, not here.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

BACKLOG="docs/backlog.jsonl"
DEFS="docs/backlog.definitions.json"

# ─── Fixture helpers ─────────────────────────────────────────────────────────

# feature_dir <id-slug> — create a docs/features/ entry the allocators scan.
feature_dir() {
  mkdir -p "docs/features/$1"
  echo "# $1" > "docs/features/$1/about.md"
}

# backlog_line <id> <title> [status] — append one minified ticket by hand.
# Used to build a board WITHOUT going through the script, so allocator tests
# do not depend on the script existing.
backlog_line() {
  local id=$1 title=$2 status=${3:-open}
  mkdir -p docs
  printf '{"id":"%s","title":"%s","theme":"general","tldr":"%s","notes":[],"done_when":"it works","paths":[],"grounded":false,"status":"%s","created_at":"2026-09-20T00:00:00Z","updated_at":"2026-09-20T00:00:00Z","comments":[],"work_id":null}\n' \
    "$id" "$title" "$title" "$status" >> "$BACKLOG"
}

# valid_ticket — a record `add` must accept. A test needing a BROKEN record
# writes its own inline, so the break is visible at the point of use.
valid_ticket() {
  cat <<'JSON'
{"title":"cache the provider map","theme":"performance","tldr":"stop re-reading provider-map.json on every artefact","notes":["build.js reads it once per file today"],"done_when":"node scripts/build.js reads provider-map.json exactly once","paths":["scripts/build.js"],"grounded":true,"status":"open"}
JSON
}

nextid()  { bash "$SCRIPTS_DIR/next-id.sh" "$@"; }
statusid() { bash "$SCRIPTS_DIR/status.sh" next-id "$@"; }
backlog() { bash "$SCRIPTS_DIR/backlog.sh" "$@"; }

# key <NAME> — the value of a KEY=VALUE line in $output, or empty.
key() {
  printf '%s\n' "$output" | grep -E "^$1=" | head -1 | cut -d= -f2-
}

# tickets — only the JSONL entry lines of $output.
tickets() {
  printf '%s\n' "$output" | grep '^{' || true
}

# ═══════════════════════════════════════════════════════════════════════════
# L1 — Unit / script-side
# ═══════════════════════════════════════════════════════════════════════════

# L1.1 — next-id.sh counts the backlog as well as docs/features/.
@test "L1.1: next-id.sh B exceeds every id in docs/features AND docs/backlog.jsonl" {
  feature_dir "0003F-login"
  backlog_line "0007B" "cache the provider map"

  run nextid B
  [ "$status" -eq 0 ]
  [ "$output" = "0008B" ]
}

@test "L1.1b: next-id.sh F is raised by a backlog id too — one counter, not two" {
  feature_dir "0002F-login"
  backlog_line "0009B" "something"

  run nextid F
  [ "$status" -eq 0 ]
  [ "$output" = "0010F" ]
}

# L1.2 — status.sh next-id accepts B.
@test "L1.2: status.sh next-id B exits 0 and returns an id" {
  feature_dir "0004F-login"

  run statusid B
  [ "$status" -eq 0 ]
  [ "$output" = "0005B" ]
}

# L1.3 — REGRESSION GUARD. This passes today and must keep passing: the
# allowlist stays an allowlist, it merely gains one member.
@test "L1.3: status.sh next-id Z still exits 2 — B joins the allowlist, it does not open it" {
  run statusid Z
  [ "$status" -eq 2 ]
}

@test "L1.3b: the four original prefixes still resolve" {
  feature_dir "0001F-x"
  for p in F H PRD CHG; do
    run statusid "$p"
    [ "$status" -eq 0 ]
    [ "$output" = "0002$p" ]
  done
}

# L1.4 — the reference and the script cannot disagree about the vocabulary.
# The script builds its refusals as refuse("<name>") and the reference lists
# them as rows of a table whose first column is the name. Neither carries the
# literal string "REFUSED=<name>", so each side is read in its own shape.
@test "L1.4: every REFUSED= name backlog.sh can emit appears in references/backlog.md" {
  local ref="$SCRIPTS_DIR/../skills/add-doc-schemas/references/backlog.md"
  [ -f "$ref" ]

  local names
  names=$(grep -oE 'refuse\("[a-z-]+"\)' "$SCRIPTS_DIR/backlog.sh" |           grep -oE '"[a-z-]+"' | tr -d '"' | sort -u)
  [ -n "$names" ]

  local missing=""
  while IFS= read -r n; do
    grep -qE "^\| \`$n\` \|" "$ref" || missing="$missing $n"
  done <<< "$names"
  [ -z "$missing" ]
}

# Both directions. A name the reference documents but the script can no
# longer emit is worse than a missing one: a consumer writes a branch for it
# and that branch is dead from the day it ships.
@test "L1.4b: the documented vocabulary and the emittable one are the same set" {
  local ref="$SCRIPTS_DIR/../skills/add-doc-schemas/references/backlog.md"
  for n in invalid-json missing-field reserved-field unknown-status duplicate-id unknown-id; do
    grep -qE "^\| \`$n\` \|" "$ref"
    grep -qF "refuse(\"$n\")" "$SCRIPTS_DIR/backlog.sh"
  done
}

# L1.5 — the two structural rules delivered.sh states, restated here as tests.
@test "L1.5: backlog.sh sets -u, never -e, and checks node before any file I/O" {
  [ -f "$SCRIPTS_DIR/backlog.sh" ]

  # No `set -e` in any form.
  run grep -nE '^[[:space:]]*set[[:space:]]+-[a-z]*e' "$SCRIPTS_DIR/backlog.sh"
  [ "$status" -ne 0 ]

  # `set -u` is present.
  grep -qE '^[[:space:]]*set[[:space:]]+-u' "$SCRIPTS_DIR/backlog.sh"

  # The node guard comes before the first read of either owned file.
  local guard first_io
  guard=$(grep -nE 'command -v node' "$SCRIPTS_DIR/backlog.sh" | head -1 | cut -d: -f1)
  first_io=$(grep -nE 'backlog\.jsonl|backlog\.definitions\.json' "$SCRIPTS_DIR/backlog.sh" | head -1 | cut -d: -f1)
  [ -n "$guard" ]
  [ -n "$first_io" ]
  [ "$guard" -lt "$first_io" ]
}

@test "L1.5b: backlog.sh never invokes git — the git route belongs to subtopic 002" {
  [ -f "$SCRIPTS_DIR/backlog.sh" ]
  run grep -nE '(^|[^a-z])git[[:space:]]+(add|commit|push|worktree|checkout)' "$SCRIPTS_DIR/backlog.sh"
  [ "$status" -ne 0 ]
}

@test "L1.5c: neither allocator gained a node dependency — both stay pure bash" {
  # Comment lines are stripped first. Both scripts EXPLAIN in their headers
  # why they do not call node, and an assertion that reads prose would fail
  # on the explanation of the very rule it is checking.
  for s in next-id.sh status.sh; do
    run bash -c "grep -vE '^[[:space:]]*#' '$SCRIPTS_DIR/$s' | grep -nE 'command -v node|(^|[^a-zA-Z_-])node([[:space:]]|\$)'"
    [ "$status" -ne 0 ]
  done
}

# ═══════════════════════════════════════════════════════════════════════════
# L2 — NEXT_ID_AGREE: the two allocators return the same string
# ═══════════════════════════════════════════════════════════════════════════

# L2.1 — with a backlog present. This is the assertion that exists because
# status.sh reimplements next-id.sh's scan instead of calling it.
@test "L2.1: NEXT_ID_AGREE with a backlog present, for F, H and B" {
  feature_dir "0003F-login"
  feature_dir "0005H-timeout"
  backlog_line "0011B" "cache the provider map"
  backlog_line "0012B" "prune the wiki"

  for p in F H B; do
    run nextid "$p"
    [ "$status" -eq 0 ]
    local from_nextid="$output"

    run statusid "$p"
    [ "$status" -eq 0 ]
    [ "$output" = "$from_nextid" ]
    [ "$output" = "0013$p" ]
  done
}

# L2.2 — with NO backlog. Every existing caller of status.sh next-id must be
# unaffected: the scan is a no-op on an absent file.
@test "L2.2: NEXT_ID_AGREE with no backlog, and the id is what it is today" {
  feature_dir "0003F-login"
  feature_dir "0007H-timeout"
  [ ! -f "$BACKLOG" ]

  for p in F H; do
    run nextid "$p"
    [ "$status" -eq 0 ]
    local from_nextid="$output"

    run statusid "$p"
    [ "$status" -eq 0 ]
    [ "$output" = "$from_nextid" ]
    [ "$output" = "0008$p" ]
  done
}

# L2.1b — the divergence this block was written to close, in its worst form.
# A slug ending in a year made status.sh return 2025F where next-id.sh
# returned 0002F: two thousand ids burnt, silently, by every command that
# allocates — and they all allocate through status.sh.
@test "L2.1b: NEXT_ID_AGREE when a slug carries four digits of its own" {
  feature_dir "0001F-auth-2024"

  run nextid F
  [ "$status" -eq 0 ]
  [ "$output" = "0002F" ]

  run statusid F
  [ "$status" -eq 0 ]
  [ "$output" = "0002F" ]
}

@test "L2.1c: NEXT_ID_AGREE is not disturbed by digits in the path ABOVE docs/" {
  # TEST_TEMP_DIR is a mktemp name and can carry four digits of its own. An
  # id lives in the directory basename; nothing above it counts.
  feature_dir "0003F-login"

  run nextid F
  local a="$output"
  run statusid F
  [ "$output" = "$a" ]
  [ "$output" = "0004F" ]
}

@test "L2.2b: an EMPTY docs/backlog.jsonl changes nothing either" {
  feature_dir "0004F-login"
  mkdir -p docs && : > "$BACKLOG"

  run nextid F
  [ "$output" = "0005F" ]
  run statusid F
  [ "$output" = "0005F" ]
}

# L2.3 — the allocator greps raw text, so damaged JSON cannot hide an id.
@test "L2.3: a damaged backlog line still contributes its id to the max" {
  feature_dir "0002F-login"
  backlog_line "0006B" "fine"
  printf '{"id":"0014B","title":"truncated\n' >> "$BACKLOG"

  run nextid B
  [ "$status" -eq 0 ]
  [ "$output" = "0015B" ]

  run statusid B
  [ "$status" -eq 0 ]
  [ "$output" = "0015B" ]
}

# ═══════════════════════════════════════════════════════════════════════════
# L3 — Behavioural acceptance
# ═══════════════════════════════════════════════════════════════════════════

# L3.1 — first use creates both files.
@test "L3.1: add on an absent board creates it, writes one line, and seeds the definitions" {
  [ ! -f "$BACKLOG" ]
  [ ! -f "$DEFS" ]

  valid_ticket > /tmp/t.$$
  run bash -c "bash '$SCRIPTS_DIR/backlog.sh' add < /tmp/t.$$"
  rm -f /tmp/t.$$
  [ "$status" -eq 0 ]

  [ -f "$BACKLOG" ]
  [ "$(wc -l < "$BACKLOG")" -eq 1 ]

  [ -f "$DEFS" ]
  for s in open doing done dropped; do
    grep -q "\"$s\"" "$DEFS"
  done
}

@test "L3.1b: the ticket's id is allocated, not supplied, and is a B id" {
  valid_ticket | backlog add
  run backlog list
  [ "$status" -eq 0 ]
  tickets | grep -qE '"id":"[0-9]{4}B"'
}

@test "L3.1c: add is a PURE APPEND — a new ticket lands last, never first" {
  valid_ticket | backlog add
  printf '%s' "$(valid_ticket | sed 's/cache the provider map/second thing/')" | backlog add

  [ "$(wc -l < "$BACKLOG")" -eq 2 ]
  head -1 "$BACKLOG" | grep -q "cache the provider map"
  tail -1 "$BACKLOG" | grep -q "second thing"
}

# L3.2 — DEFS_PRESERVED. The file is created once and never rewritten.
@test "L3.2: DEFS_PRESERVED — a hand-edited definitions file survives further writes byte-for-byte" {
  valid_ticket | backlog add

  # The user renames a status and adds a fifth.
  cat > "$DEFS" <<'JSON'
{
  "statuses": [
    { "name": "open",     "order": 1, "means": "decided, not started" },
    { "name": "doing",    "order": 2, "means": "work is in progress" },
    { "name": "blocked",  "order": 3, "means": "waiting on something else" },
    { "name": "done",     "order": 4, "means": "delivered" },
    { "name": "dropped",  "order": 5, "means": "decided against" }
  ]
}
JSON
  local before
  before=$(cat "$DEFS")

  printf '%s' "$(valid_ticket | sed 's/cache the provider map/second thing/')" | backlog add
  printf '%s' "$(valid_ticket | sed 's/cache the provider map/third thing/')"  | backlog add

  [ "$(cat "$DEFS")" = "$before" ]
}

@test "L3.2b: a status the user ADDED is accepted on a write" {
  valid_ticket | backlog add
  cat > "$DEFS" <<'JSON'
{"statuses":[{"name":"open","order":1,"means":"x"},{"name":"blocked","order":2,"means":"y"}]}
JSON
  local id
  id=$(grep -oE '"id":"[0-9]{4}B"' "$BACKLOG" | head -1 | cut -d'"' -f4)

  run bash -c "printf '{\"status\":\"blocked\"}' | '$SCRIPTS_DIR/backlog.sh' update $id"
  [ "$status" -eq 0 ]
  grep -q '"status":"blocked"' "$BACKLOG"
}

# L3.3 — LINES_BYTE_STABLE under update and comment.
@test "L3.3: update rewrites ONLY its own line; every other line is byte-identical" {
  backlog_line "0001B" "first"
  backlog_line "0002B" "second"
  backlog_line "0003B" "third"
  cp "$BACKLOG" /tmp/before.$$

  printf '{"title":"second, revised"}' | backlog update 0002B

  [ "$(wc -l < "$BACKLOG")" -eq 3 ]
  [ "$(sed -n 1p "$BACKLOG")" = "$(sed -n 1p /tmp/before.$$)" ]
  [ "$(sed -n 3p "$BACKLOG")" = "$(sed -n 3p /tmp/before.$$)" ]
  [ "$(sed -n 2p "$BACKLOG")" != "$(sed -n 2p /tmp/before.$$)" ]
  sed -n 2p "$BACKLOG" | grep -q "second, revised"
  rm -f /tmp/before.$$
}

@test "L3.3b: comment appends to comments[] on one line and touches nothing else" {
  backlog_line "0001B" "first"
  backlog_line "0002B" "second"
  cp "$BACKLOG" /tmp/before.$$

  printf '{"content":"turns out build.js reads it twice"}' | backlog comment 0001B

  [ "$(wc -l < "$BACKLOG")" -eq 2 ]
  [ "$(sed -n 2p "$BACKLOG")" = "$(sed -n 2p /tmp/before.$$)" ]
  sed -n 1p "$BACKLOG" | grep -q "turns out build.js reads it twice"
  sed -n 1p "$BACKLOG" | grep -q '"created_at"'
  rm -f /tmp/before.$$
}

@test "L3.3c: update bumps updated_at but never created_at" {
  backlog_line "0001B" "first"
  local created_before
  created_before=$(grep -oE '"created_at":"[^"]+"' "$BACKLOG")

  printf '{"title":"renamed"}' | backlog update 0001B

  [ "$(grep -oE '"created_at":"[^"]+"' "$BACKLOG")" = "$created_before" ]
  grep -qE '"updated_at":"[0-9]{4}-' "$BACKLOG"
}

# L3.4 — a damaged line is reported, not fatal.
@test "L3.4: a damaged line is reported by its number, exit stays 0, every other ticket answers" {
  backlog_line "0001B" "first"
  printf '{"id":"0002B","title":"truncated\n' >> "$BACKLOG"
  backlog_line "0003B" "third"

  run backlog list
  [ "$status" -eq 0 ]
  [ "$(key DAMAGED_LINES)" = "1" ]
  printf '%s\n' "$output" | grep -qE '^DAMAGED_LINE=2$'
  [ "$(tickets | wc -l)" -eq 2 ]
  tickets | grep -q '"id":"0001B"'
  tickets | grep -q '"id":"0003B"'
}

# L3.5 — LINES_BYTE_STABLE under move and remove.
@test "L3.5: move --top reorders and changes nothing else — same lines, different order" {
  backlog_line "0001B" "first"
  backlog_line "0002B" "second"
  backlog_line "0003B" "third"
  local sorted_before
  sorted_before=$(sort "$BACKLOG")

  run backlog move 0003B --top
  [ "$status" -eq 0 ]

  [ "$(sort "$BACKLOG")" = "$sorted_before" ]
  sed -n 1p "$BACKLOG" | grep -q '"id":"0003B"'
  sed -n 2p "$BACKLOG" | grep -q '"id":"0001B"'
  sed -n 3p "$BACKLOG" | grep -q '"id":"0002B"'
}

@test "L3.5b: move --after places the ticket directly below its anchor" {
  backlog_line "0001B" "first"
  backlog_line "0002B" "second"
  backlog_line "0003B" "third"

  run backlog move 0001B --after 0002B
  [ "$status" -eq 0 ]
  sed -n 1p "$BACKLOG" | grep -q '"id":"0002B"'
  sed -n 2p "$BACKLOG" | grep -q '"id":"0001B"'
  sed -n 3p "$BACKLOG" | grep -q '"id":"0003B"'
}

@test "L3.5c: move --bottom sends it last" {
  backlog_line "0001B" "first"
  backlog_line "0002B" "second"

  run backlog move 0001B --bottom
  [ "$status" -eq 0 ]
  tail -1 "$BACKLOG" | grep -q '"id":"0001B"'
}

@test "L3.5d: remove deletes exactly one line; every survivor is byte-identical" {
  backlog_line "0001B" "first"
  backlog_line "0002B" "second"
  backlog_line "0003B" "third"
  local l1 l3
  l1=$(sed -n 1p "$BACKLOG"); l3=$(sed -n 3p "$BACKLOG")

  run backlog remove 0002B
  [ "$status" -eq 0 ]

  [ "$(wc -l < "$BACKLOG")" -eq 2 ]
  [ "$(sed -n 1p "$BACKLOG")" = "$l1" ]
  [ "$(sed -n 2p "$BACKLOG")" = "$l3" ]
}

@test "L3.5e: an id is NEVER reused after a remove" {
  feature_dir "0001F-x"
  backlog_line "0002B" "second"
  run backlog remove 0002B
  [ "$status" -eq 0 ]

  # The allocator still counts docs/features, and the removed id is gone from
  # the board — but the counter must not hand 0002 back out.
  feature_dir "0002F-y"
  run nextid B
  [ "$output" = "0003B" ]
}

# L3.6 — an undefined status is refused on a WRITE.
@test "L3.6: a write carrying an undefined status exits 2 with REFUSED=unknown-status, file unchanged" {
  valid_ticket | backlog add
  local before
  before=$(cat "$BACKLOG")

  run bash -c "printf '%s' '$(valid_ticket | sed 's/"status":"open"/"status":"invented"/')' | '$SCRIPTS_DIR/backlog.sh' add"
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=unknown-status'
  [ "$(cat "$BACKLOG")" = "$before" ]
}

# L3.7 — an undefined status already on the board is REPORTED, never refused.
@test "L3.7: list over a status the definitions no longer define exits 0 and reports it" {
  valid_ticket | backlog add
  backlog_line "0099B" "legacy" "retired"

  run backlog list --all
  [ "$status" -eq 0 ]
  printf '%s\n' "$output" | grep -qE '^UNDEFINED_STATUS=retired$'
  [ "$(tickets | wc -l)" -eq 2 ]
}

# L3.8 — an absent board is a result, not a failure.
@test "L3.8: list on an absent backlog exits 0 and reports it empty" {
  [ ! -f "$BACKLOG" ]
  run backlog list
  [ "$status" -eq 0 ]
  [ "$(key BACKLOG_PRESENT)" = "no" ]
  [ "$(key TICKETS_TOTAL)" = "0" ]
  [ "$(tickets | wc -l)" -eq 0 ]
}

@test "L3.8b: search on an absent backlog exits 0 and returns nothing" {
  run backlog search "anything"
  [ "$status" -eq 0 ]
  [ "$(tickets | wc -l)" -eq 0 ]
}

@test "L3.8c: list defaults to open tickets; --all returns every one" {
  valid_ticket | backlog add
  backlog_line "0098B" "finished thing" "done"

  run backlog list
  [ "$status" -eq 0 ]
  [ "$(tickets | wc -l)" -eq 1 ]

  run backlog list --all
  [ "$(tickets | wc -l)" -eq 2 ]
}

@test "L3.8d: search matches title, tldr and notes" {
  valid_ticket | backlog add

  run backlog search "provider map"
  [ "$status" -eq 0 ]
  [ "$(tickets | wc -l)" -eq 1 ]

  run backlog search "nothing-like-this-exists"
  [ "$status" -eq 0 ]
  [ "$(tickets | wc -l)" -eq 0 ]
}

# L3.9 — LF, no CR, one object per line.
@test "L3.9: written lines use LF and contain no CR byte" {
  valid_ticket | backlog add
  printf '%s' "$(valid_ticket | sed 's/cache the provider map/second thing/')" | backlog add

  run grep -c $'\r' "$BACKLOG"
  [ "$status" -ne 0 ]
  [ "$(wc -l < "$BACKLOG")" -eq 2 ]
}

@test "L3.9b: each line is exactly one minified JSON object" {
  valid_ticket | backlog add
  run node -e 'const l=require("fs").readFileSync("docs/backlog.jsonl","utf8").trim().split("\n"); l.forEach(x=>JSON.parse(x)); console.log(l.length)'
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]
}

# ═══════════════════════════════════════════════════════════════════════════
# The remaining hard bans
# ═══════════════════════════════════════════════════════════════════════════

@test "ban 1+2: a caller-supplied id, created_at or updated_at is refused" {
  for field in '"id":"0005B"' '"created_at":"2020-01-01T00:00:00Z"' '"updated_at":"2020-01-01T00:00:00Z"'; do
    run bash -c "printf '{%s,\"title\":\"t\",\"tldr\":\"t\",\"done_when\":\"t\",\"status\":\"open\"}' '$field' | '$SCRIPTS_DIR/backlog.sh' add"
    [ "$status" -eq 2 ]
    printf '%s\n' "$output" | grep -q 'REFUSED=reserved-field'
  done
}

@test "ban 4: an id already on the board is never re-added" {
  backlog_line "0001B" "first"
  run bash -c "printf '{\"title\":\"dup\"}' | '$SCRIPTS_DIR/backlog.sh' update 0001B"
  [ "$status" -eq 0 ]
  # The board cannot end up with two lines carrying one id, by any route.
  [ "$(grep -c '"id":"0001B"' "$BACKLOG")" -eq 1 ]
}

@test "ban 5: title, tldr and done_when are required and non-empty" {
  run bash -c "printf '{\"tldr\":\"t\",\"done_when\":\"t\",\"status\":\"open\"}' | '$SCRIPTS_DIR/backlog.sh' add"
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=missing-field'

  run bash -c "printf '{\"title\":\"\",\"tldr\":\"t\",\"done_when\":\"t\",\"status\":\"open\"}' | '$SCRIPTS_DIR/backlog.sh' add"
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=missing-field'
}

@test "ban 6: stdin that is not one JSON object is refused" {
  run bash -c "printf 'not json at all' | '$SCRIPTS_DIR/backlog.sh' add"
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=invalid-json'
}

@test "ban 7: update, comment, move and remove refuse an id that is not on the board" {
  backlog_line "0001B" "first"

  run bash -c "printf '{\"title\":\"x\"}' | '$SCRIPTS_DIR/backlog.sh' update 0404B"
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=unknown-id'

  run backlog remove 0404B
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=unknown-id'

  run backlog move 0404B --top
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=unknown-id'

  run backlog move 0001B --after 0404B
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=unknown-id'
}

# ═══════════════════════════════════════════════════════════════════════════
# Caller errors and the exit-code contract
# ═══════════════════════════════════════════════════════════════════════════

@test "a bad mode exits 2 and prints usage" {
  run backlog frobnicate
  [ "$status" -eq 2 ]
}

@test "no mode at all exits 2" {
  run backlog
  [ "$status" -eq 2 ]
}

@test "move with no direction exits 2" {
  backlog_line "0001B" "first"
  run backlog move 0001B
  [ "$status" -eq 2 ]
}

@test "ERROR=node-missing exits 2 and is distinguishable from a REFUSED=" {
  # Hide node from PATH, leaving the rest of the toolchain intact.
  local fakebin="$TEST_TEMP_DIR/nonode"
  mkdir -p "$fakebin"
  for t in bash grep sed awk cat printf sort find head tail wc cut mkdir rm cp mv; do
    command -v "$t" >/dev/null 2>&1 && ln -sf "$(command -v "$t")" "$fakebin/$t"
  done

  run env PATH="$fakebin" bash "$SCRIPTS_DIR/backlog.sh" list
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'ERROR=node-missing'
  printf '%s\n' "$output" | grep -qv 'REFUSED='
}
