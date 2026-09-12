#!/usr/bin/env bats
# build-ledger.sh — the append-only build ledger writer (plan
# 0078-PLAN--superpowers-adoption-002-durable-executor, F1). RED-FIRST: the
# script under test does not exist yet — every test below is expected to fail
# until F1 lands. That failure IS the point.
#
# Contract under test:
#   Usage: bash build-ledger.sh <LEDGER_FILE> <LINE> [FEATURE_ID] [PLAN_PATH]
#   - Appends EXACTLY ONE line. Creates the file with its identity header
#     `# Build ledger — feature: <ID> — plan: <path>` when absent, then a blank
#     line, then entries.
#   - It is a LOG, not a set: called twice with the same line it appends twice.
#     A ledger that de-duplicates cannot record "fix round 1" then "fix round 2"
#     of the same finding, and cannot show that a task was re-entered.
#   - Prints LEDGER=<path>, plus CREATED=true|false and LINES=<n>.
#   - exit 0 on success. exit 2 ONLY on CLI misuse. exit 1 only when the
#     filesystem refuses the write — a silent success would lose the ruling.
#   - The line is written VERBATIM: backticks, %s, leading dashes and percent
#     signs are ledger content, never format directives.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

LEDGER="docs/features/0003F-signup/build-ledger.md"

ledger_path() {
  printf '%s\n' "$output" | grep '^LEDGER=' | sed 's/^LEDGER=//'
}

# ─── L2.1 — create, then append ──────────────────────────────────────────────

@test "L2.1: a missing ledger is created with its identity header" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T01: complete (commits a1b2c3d..a1b2c3d, review clean)" "0003F" "docs/features/0003F-signup/plan.md"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LEDGER=$LEDGER"* ]]
  [ -f "$LEDGER" ]
  [ "$(sed -n '1p' "$LEDGER")" = "# Build ledger — feature: 0003F — plan: docs/features/0003F-signup/plan.md" ]
  [ "$(sed -n '2p' "$LEDGER")" = "" ]
  [ "$(sed -n '3p' "$LEDGER")" = "T01: complete (commits a1b2c3d..a1b2c3d, review clean)" ]
}

@test "L2.1: creating reports CREATED=true, appending reports CREATED=false" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "first" "0003F" "docs/features/0003F-signup/plan.md"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CREATED=true"* ]]

  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "second" "0003F" "docs/features/0003F-signup/plan.md"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CREATED=false"* ]]
}

@test "L2.1: an existing ledger gains only the line — the header is written once" {
  bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T01: complete" "0003F" "docs/features/0003F-signup/plan.md"
  bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T02: fix round 1/3 (2 addressed, 0 open)" "0003F" "docs/features/0003F-signup/plan.md"
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T02: complete" "0003F" "docs/features/0003F-signup/plan.md"
  [ "$status" -eq 0 ]
  [ "$(grep -c '^# Build ledger' "$LEDGER")" -eq 1 ]
  [ "$(sed -n '1p' "$LEDGER")" = "# Build ledger — feature: 0003F — plan: docs/features/0003F-signup/plan.md" ]
  [ "$(sed -n '3p' "$LEDGER")" = "T01: complete" ]
  [ "$(sed -n '4p' "$LEDGER")" = "T02: fix round 1/3 (2 addressed, 0 open)" ]
  [ "$(sed -n '5p' "$LEDGER")" = "T02: complete" ]
}

@test "L2.1: the same line twice appends twice — it is a log, not a set" {
  LINE="T02: fix round 1/3 (1 addressed, 1 open)"
  bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "$LINE" "0003F" "docs/features/0003F-signup/plan.md"
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "$LINE" "0003F" "docs/features/0003F-signup/plan.md"
  [ "$status" -eq 0 ]
  [ "$(grep -cF "$LINE" "$LEDGER")" -eq 2 ]
  [[ "$output" == *"LINES=2"* ]]
}

@test "L2.1: LINES counts entries, not the header or its blank line" {
  bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "one" "0003F" "p.md"
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "two" "0003F" "p.md"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LINES=2"* ]]
}

# ─── The line is content, never a format string ──────────────────────────────

@test "a line carrying backticks, %s and a leading dash is written verbatim" {
  LINE='Preflight: Ruling: T02 wins — 100% of `UserDto.name` uses %s — costs a rename in T05'
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "$LINE" "0003F" "p.md"
  [ "$status" -eq 0 ]
  [ "$(sed -n '3p' "$LEDGER")" = "$LINE" ]
}

@test "a line starting with a dash is an entry, not an option" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "-n T03: minor (deferred): magic number" "0003F" "p.md"
  [ "$status" -eq 0 ]
  [ "$(sed -n '3p' "$LEDGER")" = "-n T03: minor (deferred): magic number" ]
}

# ─── Directory creation and header derivation ────────────────────────────────

@test "the parent directory is created when absent" {
  DEEP="docs/features/0004F-epic/subfeatures/SF02-billing/build-ledger.md"
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$DEEP" "T01: complete" "0004F" "docs/features/0004F-epic/subfeatures/SF02-billing/plan.md"
  [ "$status" -eq 0 ]
  [ -f "$DEEP" ]
}

@test "FEATURE_ID and PLAN_PATH omitted: the header is derived from the ledger's own directory" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T01: complete"
  [ "$status" -eq 0 ]
  [ "$(sed -n '1p' "$LEDGER")" = "# Build ledger — feature: 0003F-signup — plan: docs/features/0003F-signup/plan.md" ]
}

@test "identity arguments are ignored once the ledger exists — the header is never rewritten" {
  bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T01: complete" "0003F" "docs/features/0003F-signup/plan.md"
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T02: complete" "WRONG" "wrong/path.md"
  [ "$status" -eq 0 ]
  [ "$(sed -n '1p' "$LEDGER")" = "# Build ledger — feature: 0003F — plan: docs/features/0003F-signup/plan.md" ]
  [ "$(grep -c 'WRONG' "$LEDGER")" -eq 0 ]
}

# ─── CLI misuse — exit 2, and nothing written ────────────────────────────────

@test "misuse: no arguments → exit 2" {
  run bash "$SCRIPTS_DIR/build-ledger.sh"
  [ "$status" -eq 2 ]
}

@test "misuse: one argument → exit 2" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER"
  [ "$status" -eq 2 ]
  [ ! -f "$LEDGER" ]
}

@test "misuse: five arguments → exit 2" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "line" "0003F" "p.md" "extra"
  [ "$status" -eq 2 ]
}

@test "misuse: an empty LEDGER_FILE → exit 2" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "" "T01: complete"
  [ "$status" -eq 2 ]
}

@test "misuse: an empty LINE → exit 2, and no blank entry is appended" {
  bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T01: complete" "0003F" "p.md"
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" ""
  [ "$status" -eq 2 ]
  [ "$(wc -l < "$LEDGER")" -eq 3 ]
}

@test "misuse: a LINE carrying a newline → exit 2 (one line per event is the shape)" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER" "T02: fix round 1/3
T02: complete" "0003F" "p.md"
  [ "$status" -eq 2 ]
  [ ! -f "$LEDGER" ]
}

@test "misuse prints a usage line to stderr, never a LEDGER= line" {
  run bash "$SCRIPTS_DIR/build-ledger.sh" "$LEDGER"
  [ "$status" -eq 2 ]
  [[ "$output" == *"Usage:"* ]]
  [[ "$output" != *"LEDGER="* ]]
}
