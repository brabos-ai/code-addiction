#!/bin/bash
# ============================================
# TASK-BRIEF
# Extract ONE `## Execution` task's full block from a tasks.md into its own
# file, so a dispatched agent is handed a PATH instead of pasted content.
# ============================================
# Usage: bash .codeadd/scripts/task-brief.sh <TASKS_FILE> <TASK_ID> <OUT_DIR>
# Dependencies: bash, awk, grep (POSIX).
# Output: KEY=VALUE lines — BRIEF=<path>, TASK=<id>, SUBBULLETS=<n>.
# Exit:   0 on success. 2 ONLY on CLI misuse, which includes a TASK_ID that is
#         not an Execution task: an empty brief is how an agent gets dispatched
#         against nothing and reports success. 1 only on a refused write.
#
# WHAT A BLOCK IS (the add-tasks-checklist skill owns this shape):
#   - [ ] T02 Implement signup endpoint
#     - Service: backend
#     - Files: `src/api/users.ts`, `src/services/users.ts`
#     - Deps: T01
#     - Consumes: `UserRepository.insert(row: NewUser): Promise<User>` (T01)
#     - Produces: `UsersService.create(dto: CreateUserDto): Promise<UserDto>`
#     - Verify: `npm test -- users`
# All six sub-bullets travel or the brief is worthless: an agent implementing
# T02 never sees T01's code, so `Consumes` / `Produces` are the only thing
# making both tasks build against the same name.
#
# SCOPED TO `## Execution`, DELIBERATELY. `## TDD` carries `T-TEST-01`, whose id
# starts with the same letter and would match a loose scan; `## Acceptance
# Checklist` follows the last task and would be swallowed by an extractor that
# only stops at the next task line. Both are real defects this scan avoids by
# tracking the section, not just the bullet.
#
# SUBBULLETS is reported, never enforced. /add.plan STEP 12 is the gate that
# refuses a task with a missing `Consumes`; this script's job is to say what it
# found so the caller can see a thin task rather than be handed a padded one.
# ============================================

set -u

usage() {
  {
    echo "Usage: task-brief.sh <TASKS_FILE> <TASK_ID> <OUT_DIR>"
    echo "  TASKS_FILE  the feature's or subfeature's tasks.md"
    echo "  TASK_ID     an ## Execution task id, TNN (T-TEST-nn is not one)"
    echo "  OUT_DIR     scratch dir, typically <FEATURE_DIR>/_build — created, and self-ignored"
  } >&2
  exit 2
}

fail() {
  echo "ERROR=$1" >&2
  exit 1
}

[ "$#" -eq 3 ] || usage

TASKS_FILE="$1"
TASK_ID="$2"
OUT_DIR="$3"

[ -n "$TASKS_FILE" ] && [ -n "$TASK_ID" ] && [ -n "$OUT_DIR" ] || usage
[ -f "$TASKS_FILE" ] || usage

# TNN only. `T-TEST-01` is a TDD id, not an Execution task, and accepting it
# would hand a reviewer a brief for a test line with no Files and no Verify.
printf '%s' "$TASK_ID" | grep -qE '^T[0-9][0-9]*$' || usage

# A tasks.md with no ## Execution section cannot answer this call at all. That
# is a broken input, not an empty result, and must not read as "task absent".
grep -qE '^##[[:space:]]+[Ee]xecution[[:space:]]*$' "$TASKS_FILE" || {
  echo "ERROR=No ## Execution section in $TASKS_FILE" >&2
  exit 2
}

# The scan. Section state (`inexec`) and block state (`intask`) are separate:
# any other H2 closes both, a new task line closes the previous block, and a
# line that is not an indented bullet ends the block without consuming it.
# `sub(/\r$/, "")` is not decorative — tasks.md is authored on Windows too, and
# a trailing CR makes every anchored match miss.
BLOCK=$(awk -v id="$TASK_ID" '
  BEGIN {
    taskre = "^[ \t]*[-*][ \t]+\\[.\\][ \t]+" id "([ \t]|$)"
    anytask = "^[ \t]*[-*][ \t]+\\[.\\][ \t]+"
    subre = "^[ \t]+[-*][ \t]+(Service|Files|Deps|Consumes|Produces|Verify)[ \t]*:"
    inexec = 0; intask = 0
  }
  { sub(/\r$/, "") }
  /^##[[:space:]]/ {
    hdr = tolower($0)
    sub(/[[:space:]]+$/, "", hdr)
    inexec = (hdr ~ /^##[[:space:]]+execution$/) ? 1 : 0
    intask = 0
    next
  }
  inexec && $0 ~ anytask {
    intask = ($0 ~ taskre) ? 1 : 0
    if (intask) print
    next
  }
  intask {
    if ($0 ~ /^[ \t]+[-*][ \t]+/) { print; next }
    intask = 0
    next
  }
' "$TASKS_FILE")

# Not found is misuse, on purpose. Returning 0 with an empty brief is exactly
# how a dispatch happens against nothing.
if [ -z "$BLOCK" ]; then
  echo "ERROR=No $TASK_ID in the ## Execution section of $TASKS_FILE" >&2
  exit 2
fi

SUBBULLETS=$(printf '%s\n' "$BLOCK" \
  | grep -cE '^[[:space:]]+[-*][[:space:]]+(Service|Files|Deps|Consumes|Produces|Verify)[[:space:]]*:' || true)

[ -d "$OUT_DIR" ] || mkdir -p "$OUT_DIR" 2>/dev/null || fail "Cannot create directory $OUT_DIR"

# F4's scratch contract: the directory ignores itself, so briefs, reports and
# diff packages never reach a commit and the installer needs no change to make
# that true. Written only when absent — a project that edited it owns it.
[ -f "$OUT_DIR/.gitignore" ] || printf '*\n' > "$OUT_DIR/.gitignore" 2>/dev/null \
  || fail "Cannot write $OUT_DIR/.gitignore"

BRIEF="$OUT_DIR/$TASK_ID-brief.md"
{
  printf '# Task brief — %s\n\n' "$TASK_ID"
  printf '> Source: %s\n\n' "$TASKS_FILE"
  printf '%s\n' "$BLOCK"
} > "$BRIEF" 2>/dev/null || fail "Cannot write $BRIEF"

echo "BRIEF=$BRIEF"
echo "TASK=$TASK_ID"
echo "SUBBULLETS=${SUBBULLETS:-0}"

exit 0
