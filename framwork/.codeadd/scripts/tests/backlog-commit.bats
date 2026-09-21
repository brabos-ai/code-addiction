#!/usr/bin/env bats
# backlog-commit.sh — the git route for a backlog write: it wraps backlog.sh so
# the ticket reaches the BASE branch whatever branch the caller stood on
# (plan docs/plans/2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename.md,
# F1). RED-FIRST: the script under test does not exist yet. Every test below is
# expected to fail until F2 lands. That failure IS the point, and this file is
# committed BEFORE it.
#
# WHY A SECOND SCRIPT AT ALL. backlog.sh runs no git command — its own header
# says so twice and backlog.bats L1.5b asserts it, with the comment "the git
# route belongs to subtopic 002". That promise is delivered and is not reopened
# here. A trap also needs a process, and the skill that calls this is not one.
#
# Contract under test (design docs/brainstorming/2026-09-20T104517-project-backlog-002-capture-skill.md):
#   Usage: backlog-commit.sh add                < ticket.json
#          backlog-commit.sh update  <id>       < patch.json
#          backlog-commit.sh comment <id>       < comment.json
#          backlog-commit.sh move    <id> --top | --after <id> | --bottom
#          backlog-commit.sh remove  <id>
#
#   - WRITE MODES ONLY. list and search are reads, commit nothing, and go
#     straight to backlog.sh — routing them through a script that resolves a
#     base branch and may open a worktree is pure cost, and it would break the
#     read path in a directory that is not a git repository at all.
#
#   - THE ROUTE IS CHOSEN BY ONE TEST: the current branch name equals the name
#     get-main-branch.sh returned. Equal -> direct. Anything else, a detached
#     HEAD included, -> worktree. F11 of the same plan depends on the direct
#     route by name, because after a merge the tree is already on the base
#     branch; a test left to the builder is a test that F-block cannot rely on.
#
#   - THE WORKTREE IS .worktrees/backlog, ONE FIXED NAME, NEVER PARALLEL, and
#     .worktrees/ is appended to .gitignore when absent — the same convention
#     build-setup.sh already ships. It is created DETACHED at the base branch,
#     so it works even when the base branch is checked out in another worktree,
#     which is exactly the case a capture launched from a linked worktree hits.
#
#   - IT IS LOCKED FOR THE WHOLE CAPTURE (git worktree lock). The lock is what
#     tells a live capture from a leaked one. The sweep that runs before every
#     write removes an UNLOCKED .worktrees/backlog and, on a LOCKED one,
#     removes NOTHING and refuses loudly. Without that, a second capture would
#     delete the first one's tree mid-commit — the silent loss this whole
#     design is written against.
#
#   - Removal is `git worktree remove` with NO --force, matching done.sh: a
#     dirty tree fails loud instead of being silently discarded.
#
#   - STAGING IS THE TWO PATHS BY NAME, never -A and never `.`, because this
#     commit goes to the base branch and the caller's tree may carry unrelated
#     work. The framework's own internal backlog command carries the same stop
#     block for the same reason.
#
#   - THE WRITE IS NEVER DISCARDED. Four degradation CATEGORIES, each carrying
#     a precise DEGRADED= reason so a report can say which:
#       get-main-branch.sh exit 1   DEGRADED=not-a-git-repo
#       get-main-branch.sh exit 2   DEGRADED=no-base-branch
#       the push could not land     DEGRADED=no-remote | push-refused
#                                   DEGRADED=base-checked-out-elsewhere
#       the rebase conflicted       DEGRADED=rebase-conflict
#     In every one of them the ticket is still written and the caller is told.
#     A rebase conflict is ABORTED, never resolved — the repository is never
#     left mid-rebase.
#
#   - Output is KEY=VALUE lines: ROUTE, BASE_BRANCH, TICKET_ID, SHA, PUSHED,
#     and DEGRADED when one applies. Same shape backlog.sh and delivered.sh
#     emit, so one consumer parses all three.
#
#   - Exit: 0 for a result, a degraded one INCLUDED — the write happened and
#     that is the result. 1 when the write itself failed. 2 for caller error
#     (bad mode, a read mode, bad arguments) and for REFUSED=worktree-locked,
#     which is a state the caller must clear before this can run.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  # A leaked lock would otherwise make the temp dir un-removable on some
  # platforms, and a leaked worktree registration outlives the test.
  git worktree unlock .worktrees/backlog 2>/dev/null || true
  git worktree remove --force .worktrees/backlog 2>/dev/null || true
  common_teardown
}

BACKLOG="docs/backlog.jsonl"
DEFS="docs/backlog.definitions.json"
WT=".worktrees/backlog"

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

# seed_board — put one ticket on the CURRENT branch and commit it, so later
# tests have a board to rebase against. Goes through backlog.sh directly:
# these fixtures must not depend on the script under test.
seed_board() {
  valid_ticket | backlog add >/dev/null
  git add "$BACKLOG" "$DEFS"
  git commit -q -m "seed board"
}

# on_feature — leave the caller standing on a branch that is not the base one.
on_feature() { git checkout -q -b feat/somewhere; }

# base_file_lines — how many tickets the BASE branch carries, read without
# checking it out.
base_file_lines() {
  git show "main:$BACKLOG" 2>/dev/null | grep -c '^{' || echo 0
}

# ═══════════════════════════════════════════════════════════════════════════
# L1 — the route
# ═══════════════════════════════════════════════════════════════════════════

# L1.1 — the direct route, and the proof that it opened nothing.
@test "L1.1: on the base branch the route is direct and no worktree is created" {
  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "direct" ]
  [ "$(key BASE_BRANCH)" = "main" ]
  [ ! -d "$WT" ]
  # The commit is on main, and it is the one this call made.
  run git log -1 --format=%s main
  [[ "$output" == *backlog* ]]
}

# L1.2 — the worktree route: the ticket must land on the BASE branch, not on
# the branch the caller was standing on. This is the whole reason the script
# exists, so it is asserted from the base branch's side rather than from the
# working tree's.
@test "L1.2: from a feature branch the ticket lands on the base branch and the worktree is gone" {
  seed_board
  on_feature

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "worktree" ]
  [ "$(key BASE_BRANCH)" = "main" ]

  # Two tickets on main: the seeded one and this one.
  [ "$(base_file_lines)" -eq 2 ]
  # The feature branch is untouched — still the one seeded ticket.
  [ "$(grep -c '^{' "$BACKLOG")" -eq 1 ]
  # Nothing left behind.
  [ ! -d "$WT" ]
  run git worktree list
  [[ "$output" != *"$WT"* ]]
}

@test "L1.2b: the worktree route appends .worktrees/ to .gitignore when absent" {
  seed_board
  on_feature
  [ ! -f .gitignore ] || ! grep -qF '.worktrees/' .gitignore

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  grep -qF '.worktrees/' .gitignore
}

# L1.3 — a detached HEAD is NOT the base branch. Taking the worktree route is
# the safe side of the only ambiguous case the route test has.
@test "L1.3: a detached HEAD takes the worktree route" {
  seed_board
  git checkout -q --detach

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "worktree" ]
  [ "$(base_file_lines)" -eq 2 ]
}

# ═══════════════════════════════════════════════════════════════════════════
# L1 — the lock and the sweep
# ═══════════════════════════════════════════════════════════════════════════

# L1.4 — THE ASSERTION THE WHOLE LOCK EXISTS FOR. A sweep that cannot tell a
# live capture from a leaked one would delete the live one's tree mid-commit.
@test "L1.4: a locked worktree is refused, and NOTHING is removed" {
  seed_board
  on_feature
  git worktree add -q --detach "$WT" main
  git worktree lock "$WT"
  echo "someone else is working here" > "$WT/marker.txt"

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 2 ]
  [[ "$output" == *"REFUSED=worktree-locked"* ]]
  # The refusal names the path and the way out — a stuck state reported
  # without its remedy leaves the operator to work it out.
  [[ "$output" == *"$WT"* ]]
  [[ "$output" == *"git worktree unlock"* ]]
  # Removed nothing.
  [ -f "$WT/marker.txt" ]
}

# L1.4b — the other half of the same rule: an UNLOCKED leftover is swept, so a
# crash that died before its trap does not block every later write.
@test "L1.4b: an unlocked leftover worktree is swept and the write proceeds" {
  seed_board
  on_feature
  git worktree add -q --detach "$WT" main

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "worktree" ]
  [ "$(base_file_lines)" -eq 2 ]
  [ ! -d "$WT" ]
}

# ═══════════════════════════════════════════════════════════════════════════
# L1 — the degradations. In every one the write survives.
# ═══════════════════════════════════════════════════════════════════════════

# L1.5 — no remote at all. Common in a fresh project, and the commit is still
# durable across the session.
@test "L1.5: with no remote the commit lands locally and DEGRADED says why" {
  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key PUSHED)" = "no" ]
  [ "$(key DEGRADED)" = "no-remote" ]
  [ -n "$(key SHA)" ]
  [ "$(base_file_lines)" -eq 1 ]
}

# L1.5b — the push reaches a remote that REFUSES it. Distinct from L1.5: there
# IS a remote, the fetch and the rebase succeed, and only the push fails —
# what a protected branch or a ruleset does. Added at review: the plan's F1
# named "the refused push" and the first cut of this suite covered only the
# no-remote case, leaving the push-refused branch of the script with no test.
@test "L1.5b: a refused push keeps the commit on the local base branch and says push-refused" {
  setup_remote
  seed_board
  git push -q origin main

  # Every push is refused, as a branch protection rule would.
  printf '#!/bin/sh\necho "protected branch" >&2\nexit 1\n' > "$TEST_TEMP_DIR/remote/hooks/pre-receive"
  chmod +x "$TEST_TEMP_DIR/remote/hooks/pre-receive"

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key PUSHED)" = "no" ]
  [ "$(key DEGRADED)" = "push-refused" ]
  [ -n "$(key SHA)" ]
  # Durable on the local base branch although the remote refused it.
  [ "$(base_file_lines)" -eq 2 ]
  # And the remote really did not take it.
  [ "$(git --git-dir="$TEST_TEMP_DIR/remote" rev-parse main)" != "$(git rev-parse main)" ]
}

# L1.6 — the rebase conflicts with nobody present to resolve it. The one
# outcome worse than an unpushed commit is a repository left mid-rebase.
@test "L1.6: a conflicting rebase is ABORTED, the commit survives, nothing is left mid-rebase" {
  setup_remote
  seed_board
  git push -q origin main

  # Someone else appends a different ticket to the same file, at the same
  # place, and gets there first.
  #
  # The clone checks out `main` EXPLICITLY. `setup_remote` inits the bare repo
  # with git's own default branch name, so its HEAD points at a ref that was
  # never pushed — a plain clone then lands on no branch at all and every
  # command below runs in the wrong place. That produced a RED for the wrong
  # reason on this test's first run.
  local other="$TEST_TEMP_DIR/other"
  git clone -q "$TEST_TEMP_DIR/remote" "$other" 2>/dev/null
  ( cd "$other"
    git checkout -q -B main origin/main
    git config user.email t@t.com; git config user.name T
    printf '{"id":"0099B","title":"theirs","theme":"","tldr":"theirs","notes":[],"done_when":"x","paths":[],"grounded":false,"status":"open","created_at":"2026-09-20T00:00:00Z","updated_at":"2026-09-20T00:00:00Z","comments":[],"work_id":null}\n' >> "$BACKLOG"
    git add "$BACKLOG"; git commit -q -m "theirs"; git push -q origin main )

  on_feature
  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key PUSHED)" = "no" ]
  [ "$(key DEGRADED)" = "rebase-conflict" ]
  [ -n "$(key SHA)" ]
  # No repository, primary or worktree, is left mid-rebase.
  [ ! -d "$(git rev-parse --git-dir)/rebase-merge" ]
  [ ! -d "$(git rev-parse --git-dir)/rebase-apply" ]
  [ ! -d "$WT" ]
}

# L1.7 — get-main-branch.sh has TWO failure exits and they mean different
# things. The ticket is written either way; the report must say which.
@test "L1.7: no base branch — the ticket is written, uncommitted, DEGRADED=no-base-branch" {
  git branch -m trunk

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key DEGRADED)" = "no-base-branch" ]
  [ "$(key PUSHED)" = "no" ]
  # Written to the working tree, and NOT committed.
  [ "$(grep -c '^{' "$BACKLOG")" -eq 1 ]
  run git status --porcelain "$BACKLOG"
  [ -n "$output" ]
}

@test "L1.7b: not a git repository — the ticket is written, DEGRADED=not-a-git-repo" {
  local plain="$TEST_TEMP_DIR/plain"
  mkdir -p "$plain"
  cd "$plain"

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key DEGRADED)" = "not-a-git-repo" ]
  [ "$(grep -c '^{' "$BACKLOG")" -eq 1 ]
}

# L1.8 — done.sh REFUSES to run from inside a linked worktree. This script must
# not: a capture is exactly the thing someone does mid-work, and mid-work is
# where a linked worktree is. It is also the case that forces the detached
# worktree, because the base branch is checked out in the primary tree.
@test "L1.8: a capture launched from inside a linked worktree still succeeds" {
  seed_board
  git branch -q feat/elsewhere
  git worktree add -q .worktrees/elsewhere feat/elsewhere
  cd .worktrees/elsewhere

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "worktree" ]
  [ -n "$(key SHA)" ]
}

# ═══════════════════════════════════════════════════════════════════════════
# L1 — staging, modes and the report
# ═══════════════════════════════════════════════════════════════════════════

# L1.9 — this commit goes to the BASE branch. Sweeping the caller's unrelated
# work into it is the failure the staging rule exists to prevent.
@test "L1.9: only the two board files are committed, with unrelated work dirty in the tree" {
  echo "work in progress" > unrelated.txt
  mkdir -p src && echo "more" > src/thing.js

  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]

  run git show --name-only --format= HEAD
  [[ "$output" == *"$BACKLOG"* ]]
  [[ "$output" == *"$DEFS"* ]]
  [[ "$output" != *"unrelated.txt"* ]]
  [[ "$output" != *"src/thing.js"* ]]
  # Still dirty, still the caller's.
  [ -f unrelated.txt ]
}

# L1.10 — a read commits nothing, so routing it here is pure cost and it would
# break the read path in a directory that is not a git repository at all.
@test "L1.10: list and search are refused — reads go straight to backlog.sh" {
  for mode in list search; do
    run commit "$mode"
    [ "$status" -eq 2 ]
    [[ "$output" == *"ERROR=read-mode"* ]]
  done
}

@test "L1.10b: an unknown mode is caller error, distinguishable from a read mode" {
  run commit frobnicate
  [ "$status" -eq 2 ]
  [[ "$output" == *"ERROR=bad-mode"* ]]
}

# L1.11 — on an `add` the id does not exist before the write, so the report is
# the ONLY way the caller learns which ticket they just created. A report
# carrying the sha alone leaves them nothing to address it by.
@test "L1.11: TICKET_ID is reported on add, and it is the id actually on the board" {
  run bash -c "$(declare -f valid_ticket); valid_ticket | bash '$SCRIPTS_DIR/backlog-commit.sh' add"
  [ "$status" -eq 0 ]
  local id
  id="$(key TICKET_ID)"
  [[ "$id" =~ ^[0-9]{4}B$ ]]
  grep -q "\"id\":\"$id\"" "$BACKLOG"
}

@test "L1.11b: a write mode against an unknown id passes backlog.sh's refusal through" {
  seed_board

  run commit remove 9999B
  [ "$status" -eq 2 ]
  [[ "$output" == *"REFUSED=unknown-id"* ]]
  # Nothing was committed for a write that never happened.
  [ "$(base_file_lines)" -eq 1 ]
}

# L1.12 — update and move reach the base branch the same way add does. The
# route is a property of the script, not of the mode.
@test "L1.12: update from a feature branch changes the ticket on the base branch" {
  seed_board
  local id
  id="$(grep -o '"id":"[0-9]\{4\}B"' "$BACKLOG" | head -1 | cut -d'"' -f4)"
  on_feature

  run bash -c "echo '{\"status\":\"doing\"}' | bash '$SCRIPTS_DIR/backlog-commit.sh' update $id"
  [ "$status" -eq 0 ]
  [ "$(key ROUTE)" = "worktree" ]
  [ "$(key TICKET_ID)" = "$id" ]
  run git show "main:$BACKLOG"
  [[ "$output" == *'"status":"doing"'* ]]
}
