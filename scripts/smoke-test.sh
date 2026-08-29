#!/bin/bash
# =============================================================================
# SMOKE-TEST — end-to-end check of the delivery-loop mechanics
# =============================================================================
# Usage:        bash scripts/smoke-test.sh
# Exit:         0 = every scenario passed · 1 = at least one failed
# Dependencies: bash, git, awk. No network. No node.
# Scope:        INTERNAL layer (not shipped to users). Validates the scripts and
#               the shell mechanics that framwork/.codeadd/ ships.
#
# -----------------------------------------------------------------------------
# WHY THIS FILE EXISTS — read this before changing anything below
# -----------------------------------------------------------------------------
# The bats suites under framwork/.codeadd/scripts/tests/ are UNIT tests. They
# call one script with one fixture and assert one output. That is the right
# shape for a gate's decision table, and it is structurally blind to a whole
# class of defect: the SEAM between pieces.
#
# This file exists because a suite of 54 green unit tests missed three real
# bugs that a single run against a throwaway git repo found in minutes:
#
#   1. `git push --follow-tags` pushes ANNOTATED tags only. The checkpoint tag
#      was lightweight, so it silently never reached the remote — the exact
#      failure the instruction was written to prevent, since a local-only tag
#      is invisible to a fresh-clone resume. No unit test creates a remote.
#
#   2. `git add` fails the WHOLE invocation on the first non-matching pathspec
#      (exit 128, nothing staged). The checkpoint staged four paths in one
#      command, and on an epic one of them does not exist — so the epic.md row
#      flip never reached the commit that the next step then tagged. No unit
#      test runs `git add`.
#
#   3. Gate 4 reported `missing` on every healthy epic, because an epic keeps
#      its plan.md at SUBFEATURE level and the gate read the feature root. No
#      unit test built a realistic epic tree with plans where they really live.
#
# Each scenario below is named for the defect it guards. If you delete one,
# you are re-opening that bug.
#
# -----------------------------------------------------------------------------
# WHAT THIS CAN AND CANNOT PROVE — do not overstate it
# -----------------------------------------------------------------------------
# CAN:    the shell the commands prescribe, executed for real — staging, commit,
#         tag, push, and the two readers of epic.md agreeing on the same tree.
#
# CANNOT: whether an AI coordinator FOLLOWS an instruction. Commands like
#         /add.plan-to-ready are prose an agent reads; there is no harness that
#         executes them. This file tests the mechanics those instructions
#         prescribe, never the obedience of the reader.
#
#         So a green run here does NOT mean "the epic loop works". It means
#         "if the loop does what the file says, the underlying git and script
#         behaviour holds".
#
# -----------------------------------------------------------------------------
# FOR AN LLM PICKING THIS UP LATER
# -----------------------------------------------------------------------------
# - Every scenario is self-contained: it builds its own repo under a temp dir
#   and never touches the working tree you are in. Safe to run at any time.
# - Add a scenario when a defect escapes the unit suites because it lives in a
#   seam — several files, a git operation, or a real directory layout. Do NOT
#   add one for a decision table; that belongs in a .bats file next to the
#   script it tests.
# - Name the scenario after the defect, not after the function. `S2` reads as
#   "the tag reaches the remote", which is what a future reader needs to know.
# - Keep it dependency-free. It runs before/without npm install by design.
# =============================================================================

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS="$REPO_ROOT/framwork/.codeadd/scripts"
WORK="$(mktemp -d)"
PASS=0; FAIL=0

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ $# -gt 1 ] && printf '        %s\n' "$2"; }
head_() { printf '\n%s\n' "$1"; }

# Builds a realistic epic feature tree and prints its FEATURE_DIR (relative).
# Mirrors where /add.new and /add.plan really put things: epic.md at the feature
# root, plan.md and tasks.md inside each subfeature.
build_epic() {
  local root=$1 id=$2 sf_status=$3 covered=$4
  local fd="docs/features/$id"
  mkdir -p "$root/$fd/subfeatures/SF01-alpha" "$root/$fd/subfeatures/SF02-beta"
  {
    echo "# Epic"; echo
    echo "| SF | Name | Objective | Status | checkpoint |"
    echo "|----|------|-----------|--------|-----------|"
    echo "| SF01 | Alpha | a | done | $id-SF01-done |"
    echo "| SF02 | Beta | b | $sf_status | |"
  } > "$root/$fd/epic.md"
  {
    echo "| ID | Requirement | Covered? |"
    echo "|----|-------------|----------|"
    echo "| RF01 | alpha thing | YES |"
  } > "$root/$fd/subfeatures/SF01-alpha/plan.md"
  {
    echo "| ID | Requirement | Covered? |"
    echo "|----|-------------|----------|"
    echo "| RF02 | beta thing | $covered |"
  } > "$root/$fd/subfeatures/SF02-beta/plan.md"
  printf '# Tasks\n\n## Acceptance Checklist\n- [x] one\n* [x] two\n' \
    > "$root/$fd/subfeatures/SF02-beta/tasks.md"
  {
    echo "# Review"; echo
    echo "> **QA baseline:** none"; echo
    echo "| Gate | Status | Details |"
    echo "|---|---|---|"
    echo "| **Overall** | **PASSED** | 6/6 gates PASSED |"
    echo; echo "## Fix Routing"; echo "none"
  } > "$root/$fd/review-001.md"
  printf '%s' "$fd"
}

new_repo() {
  local d="$WORK/$1"; mkdir -p "$d"; cd "$d"
  git init -q --initial-branch=main .
  git config user.email smoke@test; git config user.name Smoke
  git config core.autocrlf false   # keep the output free of CRLF warnings
}

# =============================================================================
head_ "S1 — the checkpoint stages epic.md even when a declared path is absent"
# Guards: the multi-pathspec `git add` that aborted the whole invocation and
# silently lost the epic.md row flip, while the commit and tag still happened.
# =============================================================================
new_repo s1
FD=$(build_epic "$PWD" 0099F-smoke pending YES)
git add -A && git commit -qm seed

# The BROKEN form: one add, four pathspecs, one of them absent on an epic.
git add -A -- . ':(exclude)docs/features/*' 2>/dev/null
git add -A -- "$FD/subfeatures/SF02"-* "$FD/epic.md" "$FD/review-001.md" "$FD/_tests/run-001/" 2>/dev/null
if [ "$(git diff --cached --name-only -- "$FD/epic.md" | wc -l)" -eq 0 ]; then
  ok "the old single-add form still fails, and still loses epic.md (the defect reproduces)"
else
  bad "the old form staged epic.md — this scenario no longer reproduces the defect it guards"
fi
git reset -q

# The FIXED form: one add per path, absent paths skipped, present-path failure fatal.
sed -i 's/| SF02 | Beta | b | pending |/| SF02 | Beta | b | done |/' "$FD/epic.md"
git add -A -- . ':(exclude)docs/features/*' 2>/dev/null
STAGE_RC=0
for p in "$FD/subfeatures/SF02"-* "$FD/epic.md" "$FD/review-001.md" "$FD/_tests/run-001/"; do
  [ -e "$p" ] || continue
  git add -A -- "$p" 2>/dev/null || STAGE_RC=1
done
[ "$STAGE_RC" -eq 0 ] || bad "the guarded loop failed on a path that exists"
if [ "$(git diff --cached --name-only -- "$FD/epic.md" | wc -l)" -eq 1 ]; then
  ok "the guarded loop stages epic.md and skips the absent path"
else
  bad "the guarded loop did not stage epic.md"
fi

# =============================================================================
head_ "S2 — the checkpoint tag reaches the remote"
# Guards: `git push --follow-tags` silently skipping a LIGHTWEIGHT tag, leaving
# the checkpoint invisible to a fresh clone with no error reported anywhere.
# =============================================================================
git commit -q -m "feat(0099F-smoke-SF02): checkpoint

GATE_REVIEW=ok
GATE_QA_BASELINE=ok
GATE_EPIC=ok
GATE_COVERAGE=ok
GATES_OK=4/4"
git init -q --bare "$WORK/s1-remote"
git remote add origin "$WORK/s1-remote"
git push -q -u origin main

git tag "checkpoint/lightweight-probe"
git push -q origin main --follow-tags 2>/dev/null
if [ "$(git ls-remote --tags origin 2>/dev/null | grep -c lightweight-probe)" -eq 0 ]; then
  ok "--follow-tags still skips a lightweight tag (the trap this guards is real)"
else
  bad "--follow-tags pushed a lightweight tag — git behaviour changed; revisit the tag step"
fi

git tag -a "checkpoint/0099F-smoke-SF02-done" -m checkpoint
git push -q origin main "checkpoint/0099F-smoke-SF02-done" 2>/dev/null
if [ "$(git ls-remote --tags origin 2>/dev/null | grep -c 'SF02-done')" -ge 1 ]; then
  ok "an annotated tag pushed BY NAME reaches the remote"
else
  bad "the checkpoint tag did not reach the remote"
fi

# =============================================================================
head_ "S3 — the epic.md row flip is INSIDE the commit the tag points at"
# Guards: a checkpoint whose commit does not carry the status change, so the
# next invocation re-runs a subfeature that is already done.
# =============================================================================
if git show --stat --name-only HEAD | grep -q 'epic.md'; then
  ok "epic.md is part of the checkpoint commit"
else
  bad "epic.md is not in the checkpoint commit"
fi
if git show "HEAD:$FD/epic.md" | grep -q '| SF02 | Beta | b | done |'; then
  ok "the row reads done in that commit's own tree, not only in the working tree"
else
  bad "the row does not read done inside the commit"
fi
if [ "$(git log --grep=GATES_OK --oneline | wc -l)" -ge 1 ]; then
  ok "git log --grep=GATES_OK reconstructs the checkpoint from git alone"
else
  bad "the gate receipt is not greppable from the commit message"
fi

# =============================================================================
head_ "S4 — converge-gates passes a well-formed subfeature-scoped tree"
# Guards: a gate that reads a path where the artefact does not live. Gate 4 once
# returned `missing` on every scoped run because it read the feature-level
# plan.md, which an epic does not have.
# =============================================================================
new_repo s4
FD=$(build_epic "$PWD" 0098F-scoped done YES)
OUT=$(bash "$SCRIPTS/converge-gates.sh" "$FD" SF02 2>&1)
printf '%s' "$OUT" | grep -q 'GATE_COVERAGE=ok' \
  && ok "gate 4 finds the SUBFEATURE plan.md on a scoped run" \
  || bad "gate 4 did not find the subfeature plan" "$(printf '%s' "$OUT" | grep COVERAGE)"
printf '%s' "$OUT" | grep -q 'GATE_EPIC=ok' \
  && ok "gate 3 accepts a complete acceptance checklist on a scoped run" \
  || bad "gate 3 rejected a complete scoped subfeature"

# =============================================================================
head_ "S5 — an epic-wide run aggregates coverage from the subfeature plans"
# Guards: GATES_OK reading 2/4 on a perfectly healthy epic because the gate
# looked only at the feature root.
# =============================================================================
OUT=$(bash "$SCRIPTS/converge-gates.sh" "$FD" 2>&1)
printf '%s' "$OUT" | grep -q 'GATE_COVERAGE=ok' \
  && ok "epic-wide coverage aggregates the SF plans" \
  || bad "epic-wide coverage did not aggregate" "$(printf '%s' "$OUT" | grep COVERAGE)"

new_repo s5b
FD=$(build_epic "$PWD" 0097F-uncov done NO)
OUT=$(bash "$SCRIPTS/converge-gates.sh" "$FD" 2>&1)
printf '%s' "$OUT" | grep -q 'GATE_COVERAGE=broken' \
  && ok "an uncovered requirement in ANY subfeature plan is reported" \
  || bad "an uncovered requirement was missed"

# =============================================================================
head_ "S6 — status.sh and converge-gates.sh agree about the same epic.md"
# Guards: two readers of one file disagreeing about whether an epic is done.
# The blind spot: a Notes cell whose text happens to read `done`.
# =============================================================================
new_repo s6
FD=$(build_epic "$PWD" 0096F-agree pending YES)
# Poison the row the way only a string matcher would fall for.
sed -i 's/| SF02 | Beta | b | pending | |/| SF02 | Beta | b | pending | done |/' "$FD/epic.md"
git add -A && git commit -qm seed
git checkout -q -b "feature/0096F-agree"

ST=$(bash "$SCRIPTS/status.sh" 2>/dev/null)
CG=$(bash "$SCRIPTS/converge-gates.sh" "$FD" 2>&1)
PROG=$(printf '%s' "$ST" | grep -o 'EPIC_PROGRESS:[0-9]*/[0-9]*' | head -1)
PEND=$(printf '%s' "$CG" | grep -o 'EPIC_PENDING=.*' | head -1)
if [ "$PROG" = "EPIC_PROGRESS:1/2" ] && printf '%s' "$PEND" | grep -q 'SF02'; then
  ok "both readers call SF02 pending despite a Notes cell reading done ($PROG · $PEND)"
else
  bad "the two readers disagree" "$PROG · $PEND"
fi

# =============================================================================
printf '\n%s\n' "-----------------------------------------------------------"
printf 'smoke-test: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || printf '%s\n' "A failure here is a SEAM defect — the unit suites will not catch it."
if [ "$FAIL" -eq 0 ]; then exit 0; else exit 1; fi
