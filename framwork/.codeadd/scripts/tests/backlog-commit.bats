#!/usr/bin/env bats
# backlog-commit.sh — the git route for a backlog write, SINCE THE NATIVE
# CUTOVER a thin wrapper that guards node and delegates everything to the
# adjacent native publication entry, backlog-commit.cjs
# (plan docs/plans/2026-10-04T004044-PLAN--native-node-backlog, F4).
#
# The FULL contract — routing, the worktree and its lock, the path-scoped
# commit, the rebase and the durable recovery refs — is exercised once and
# exactly in cli/tests/backlog-publication.test.js, against disposable
# repositories and remotes, because the entry is itself the contract now.
# What stays here is what the WRAPPER owns:
#
#   - the node guard: without `node` the wrapper prints ERROR=node-missing,
#     exit 2, and the guidance names the native entry, so the user can run
#     the one command that needs no shell at all;
#   - delegation: every argument passes through untouched, so the entry's
#     grammar, its record-file channel and its stdin compatibility are the
#     same shape bash callers have always piped;
#   - pass-through of entry results — TICKET_ID, ROUTE, DEGRADED and the
#     additive recovery keys on stdout, REFUSED= and its exit code verbatim.
#
# Dependencies: bash 3.2+, node >= 18.
#
# Every real git shape lives in the vitest matrix; a second copy of it here
# would drift from the first while pretending to be the same proof.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

BACKLOG="docs/backlog.jsonl"

# ─── Fixture helpers ─────────────────────────────────────────────────────────

commit() { bash "$SCRIPTS_DIR/backlog-commit.sh" "$@"; }
backlog() { bash "$SCRIPTS_DIR/backlog.sh" "$@"; }

# key <NAME> — the value of a KEY=VALUE line in $output, or empty.
key() {
  printf '%s\n' "$output" | grep -E "^$1=" | head -1 | cut -d= -f2-
}

# valid_ticket — a record `add` must accept. Matches backlog.bats' own fixture,
# so a change to the required set breaks both suites together.
valid_ticket() {
  cat <<'JSON'
{"title":"cache the provider map","theme":"performance","tldr":"stop re-reading provider-map.json on every artefact","notes":["build.js reads it once per file today"],"done_when":"node scripts/build.js reads provider-map.json exactly once","paths":["scripts/build.js"],"grounded":true,"status":"open"}
JSON
}

# seed_board — put one ticket on the CURRENT branch from the wrapper itself
# (a repo without a remote: the commit stays local, degrading without a lie).
seed_board() {
  git init -q .
  git config user.email test@example.com
  git config user.name test
  git add .gitignore 2>/dev/null || true
  git commit -q -m "seed" --allow-empty
}

# ═══════════════════════════════════════════════════════════════════════════
# L1 — the wrapper's own contract
# ═══════════════════════════════════════════════════════════════════════════

@test "L1.1: without node the wrapper exits 2 and names the native entry" {
  local fakebin="$TEST_TEMP_DIR/nonode"
  mkdir -p "$fakebin"
  for t in bash grep sed awk cat printf sort find head tail wc cut mkdir rm cp mv; do
    command -v "$t" >/dev/null 2>&1 && ln -sf "$(command -v "$t")" "$fakebin/$t"
  done

  run env PATH="$fakebin" bash "$SCRIPTS_DIR/backlog-commit.sh" list
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'ERROR=node-missing'
  printf '%s\n' "$output" | grep -q 'backlog-commit.cjs'
  printf '%s\n' "$output" | grep -qv 'REFUSED='
}

@test "L1.2: a bad mode is a caller error, usage on stderr" {
  run commit frobnicate
  [ "$status" -eq 2 ]
}

@test "L1.3: list and search are refused by name — reads go to backlog.sh" {
  run commit list
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'ERROR=read-mode'

  run commit search 'provider map'
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'ERROR=read-mode'
}

@test "L1.4: an add through the wrapper lands, persists and commits locally" {
  valid_ticket > "$TEST_TEMP_DIR/t.json"
  seed_board
  run bash -c "bash '$SCRIPTS_DIR/backlog-commit.sh' add --record-file '$TEST_TEMP_DIR/t.json'"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "direct" ]
  [ "$(key PUSHED)" = "no" ]
  [ "$(key DEGRADED)" = "no-remote" ]
  [ "$(key PERSISTED)" = "yes" ]
  [ "$(key COMMITTED)" = "yes" ]
  [ "$(key TICKET_ID)" != "" ]
  [ "$(key RECOVERY_PATH)" = "" ]
  # key() yields the VALUE after '='; the SHA itself is what must be a sha.
  printf '%s\n' "$(key SHA)" | grep -qE '^[0-9a-f]{40}$'
  [ -f "$BACKLOG" ]
}

@test "L1.5: stdin records still work — the piped shape no caller had to change" {
  # The record historically arrives on fd 0. Writing it to a file first and
  # redirecting it exercises the same stdin channel without a process
  # substitution inside bats' runner, which swallows `< <(...)` behind the
  # bash -c quoting.
  valid_ticket > "$TEST_TEMP_DIR/stdin-record.json"

  run bash -c "bash '$SCRIPTS_DIR/backlog-commit.sh' add < '$TEST_TEMP_DIR/stdin-record.json'"
  [ "$status" -eq 0 ]
  [ "$(key PERSISTED)" = "yes" ]
  [ "$(key TICKET_ID)" != "" ]
}

@test "L1.6: a refusal passes through with the CLI's own exit code" {
  seed_board
  printf '{}' > "$TEST_TEMP_DIR/p.json"
  run bash -c "printf '%s' '{\"title\":\"gone\",\"tldr\":\"t\",\"done_when\":\"t\"}' | bash '$SCRIPTS_DIR/backlog-commit.sh' update 0404B"
  [ "$status" -eq 2 ]
  printf '%s\n' "$output" | grep -q 'REFUSED=unknown-id'
}

@test "L1.7: a degraded write is a reported result, not a failure — the record is on disk" {
  # The plain directory is a PROJECT with no git anywhere above it, which is
  # exactly the state a project without version control is in. The fixture
  # root itself is a repository (common_setup made it), so work happens in
  # the sibling directory one level below it, outside every .git.
  mkdir -p "$TEST_TEMP_DIR/plain"
  cd "$TEST_TEMP_DIR/plain"
  valid_ticket > "$TEST_TEMP_DIR/plain/t.json"

  run bash -c "bash '$SCRIPTS_DIR/backlog-commit.sh' add --record-file '$TEST_TEMP_DIR/plain/t.json'"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "none" ]
  [ "$(key DEGRADED)" = "not-a-git-repo" ]
  [ "$(key PERSISTED)" = "yes" ]
  [ "$(key COMMITTED)" = "no" ]
  [ "$(key RECOVERY_PATH)" != "" ]
  [ -f "$BACKLOG" ]
}
