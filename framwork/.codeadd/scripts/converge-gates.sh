#!/bin/bash
# ============================================
# CONVERGE-GATES
# Deterministic, read-only probe for the four /add.done convergence gates
# ============================================
# Usage: bash .codeadd/scripts/converge-gates.sh <FEATURE_DIR> [SFxx]
# Dependencies: bash, node >= 18 (manifest read only; guaranteed by the CLI)
# Output: KEY=VALUE lines. Gate statuses: ok | missing | broken | not-probed.
#         QA_FEATURE_STATE is the RAW manifest value (true|false|unset|no-manifest);
#         the calling command applies default semantics — the defaults registry
#         lives in the CLI (cli/src/features.js) and is not duplicated here.
# Exit: always 0 — this is a diagnosis, never a gate. Exit 2 only on CLI misuse.
#
# WHY THIS SCRIPT EXISTS: /add.plan-to-ready STEP 6 and /add.done STEP 4 used to
# evaluate the same four gates as prose, each in its own words. A coordinator
# graded its own work, reported CONVERGED, and /add.done rejected the tree a
# second later. One script now backs both verdicts so they cannot drift apart.
#
# READ-ONLY IS LOAD-BEARING: this runs inside a step that forbids side effects.
# It never writes, and it never calls `qa-evidence.sh promote`.
# ============================================

# -u only: -e would defeat the always-exit-0 diagnosis contract, and every
# probe reports its own failure as a STATUS rather than a non-zero exit.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage: converge-gates.sh <FEATURE_DIR> [SFxx]"
  exit 2
}

[ "$#" -ge 1 ] && [ "$#" -le 2 ] || usage
FEATURE_DIR_ARG="$1"
SF_ARG="${2:-}"

# A second argument that is present but not a well-formed SFxx is misuse, not a
# silent fall-through to the epic-wide rule. An empty ${EPIC_CURRENT_SF} in the
# caller would otherwise swap gate 3's form without saying so.
if [ "$#" -eq 2 ] && ! printf '%s' "$SF_ARG" | grep -qE '^SF[0-9][0-9]$'; then
  usage
fi

[ -d "$FEATURE_DIR_ARG" ] || usage
FEATURE_DIR="$(cd "$FEATURE_DIR_ARG" && pwd)"

# Single source of the manifest feature key. cli/src/features.js owns the
# registry; this mirrors qa-preflight.sh so a rename has one line per script.
QA_FEATURE_KEY="qa-pipeline"

emit() { printf '%s\n' "$1"; }

# Collapse a multi-line message into one KEY=VALUE-safe line.
flatten() { printf '%s' "$1" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//'; }

GATES_OK=0
pass() { GATES_OK=$((GATES_OK + 1)); }

# ─── Gate 1: review verdict ──────────────────────────────────────────────────
# The highest-numbered review-NNN.md exists and its `| **Overall** |` row reads
# PASSED. Numbering is the review sequence /add.review allocates; the highest is
# always the operative one.

REVIEW_PATH=""
REVIEW_NNN=""
for candidate in "$FEATURE_DIR"/review-[0-9][0-9][0-9].md; do
  [ -f "$candidate" ] || continue
  REVIEW_PATH="$candidate"
done
[ -n "$REVIEW_PATH" ] && REVIEW_NNN=$(basename "$REVIEW_PATH" .md | sed 's/^review-//')

if [ -z "$REVIEW_PATH" ]; then
  emit "GATE_REVIEW=missing"
  emit "GATE_REVIEW_DETAIL=No review-NNN.md under $FEATURE_DIR_ARG"
else
  # The verdict is a CELL, not a substring of the row. Grepping the whole row
  # for PASSED passes a BLOCKED review whose Details cell happens to read
  # "5/6 gates PASSED", and passes "NOT PASSED", which contains its own
  # negation. Anchoring to `^|` also stops a prose sentence mentioning
  # **Overall** from being read as the verdict row.
  OVERALL_ROW=$(grep -m1 -E '^\|.*\*\*Overall\*\*' "$REVIEW_PATH" 2>/dev/null || true)
  OVERALL_CELL=$(printf '%s' "$OVERALL_ROW" | awk '
    function trim(v) { gsub(/^[ 	]+|[ 	]+$/, "", v); return v }
    BEGIN { FS = "|" }
    {
      for (i = 2; i <= NF; i++) {
        cell = trim($i); gsub(/\*/, "", cell)
        if (cell == "Overall" && i < NF) {
          v = trim($(i+1)); gsub(/\*/, "", v); print trim(v); exit
        }
      }
    }')
  if [ -z "$OVERALL_ROW" ]; then
    emit "GATE_REVIEW=broken"
    emit "GATE_REVIEW_DETAIL=No | **Overall** | table row in $(basename "$REVIEW_PATH")"
  elif printf '%s' "$OVERALL_CELL" | grep -qE '(^|[^A-Z])PASSED$' && ! printf '%s' "$OVERALL_CELL" | grep -qE 'NOT[[:space:]]+PASSED'; then
    emit "GATE_REVIEW=ok"
    pass
  else
    emit "GATE_REVIEW=broken"
    emit "GATE_REVIEW_DETAIL=Overall verdict cell is not PASSED: $(flatten "$OVERALL_CELL")"
  fi
fi
emit "REVIEW_PATH=$REVIEW_PATH"

# ─── Gate 2: QA baseline ─────────────────────────────────────────────────────
# The review's `> **QA baseline:**` line, handed verbatim to qa-evidence.sh
# validate. That script runs `set -euo pipefail` and its fail() prints
# STATUS=ERROR and exits 1 — capture both, translate to `broken`, and NEVER
# propagate the exit code. Letting it escape would break the exit-0 contract on
# exactly the cases this gate exists to catch.

BASELINE=""
if [ -z "$REVIEW_PATH" ]; then
  emit "GATE_QA_BASELINE=missing"
  emit "GATE_QA_BASELINE_DETAIL=No review document to read a baseline from"
else
  BASELINE_LINE=$(grep -m1 -E '^>[[:space:]]*\*\*QA baseline:\*\*' "$REVIEW_PATH" 2>/dev/null || true)
  if [ -z "$BASELINE_LINE" ]; then
    emit "GATE_QA_BASELINE=missing"
    emit "GATE_QA_BASELINE_DETAIL=No > **QA baseline:** line in $(basename "$REVIEW_PATH")"
  else
    BASELINE=$(printf '%s' "$BASELINE_LINE" \
      | sed -E 's/^>[[:space:]]*\*\*QA baseline:\*\*[[:space:]]*//; s/[[:space:]]+$//')
    VALIDATE_OUT=$(bash "$SCRIPT_DIR/qa-evidence.sh" validate "$FEATURE_DIR" "$BASELINE" 2>&1)
    VALIDATE_RC=$?
    if [ "$VALIDATE_RC" -eq 0 ]; then
      emit "GATE_QA_BASELINE=ok"
      pass
    else
      DETAIL=$(printf '%s\n' "$VALIDATE_OUT" | grep -m1 '^ERROR=' | sed 's/^ERROR=//' || true)
      [ -n "$DETAIL" ] || DETAIL=$(flatten "$VALIDATE_OUT")
      emit "GATE_QA_BASELINE=broken"
      emit "GATE_QA_BASELINE_DETAIL=$(flatten "$DETAIL")"
    fi
  fi
fi
emit "BASELINE=$BASELINE"

# ─── Gate 3: epic completeness ───────────────────────────────────────────────
# Two forms, and which one applies is decided by the SFxx argument, never
# guessed. Epic-wide: no subfeature row still pending. Subfeature-scoped: that
# one subfeature's own Acceptance Checklist is complete — the epic-wide form can
# never be satisfied by a run targeting a single non-final subfeature, and would
# report non-convergence for a reason unrelated to any finding.
#
# A feature with no epic.md is `ok`, NOT `not-probed`: the gate does not apply,
# and a simple feature must never be blocked for a gate it was never subject to.
#
# T1 reads epic.md as text, exactly as status.sh and /add.done do today. T2's
# F19 replaces this block with a schema read; the three outcomes do not change.

EPIC_MD="$FEATURE_DIR/epic.md"
EPIC_PENDING=""

if [ -n "$SF_ARG" ]; then
  SF_TASKS=""
  for sfdir in "$FEATURE_DIR/subfeatures/${SF_ARG}"-*; do
    [ -f "$sfdir/tasks.md" ] || continue
    SF_TASKS="$sfdir/tasks.md"
  done
  if [ -z "$SF_TASKS" ]; then
    emit "GATE_EPIC=broken"
    emit "GATE_EPIC_DETAIL=No tasks.md for $SF_ARG under $FEATURE_DIR_ARG/subfeatures/"
    EPIC_PENDING="$SF_ARG"
  else
    SF_READ=$(awk '
      BEGIN { found = 0; unchecked = 0 }
      # Heading match is case-insensitive: "## Acceptance checklist" is the same
      # section as "## Acceptance Checklist", and a stub tasks.md that omits it
      # entirely must NOT be indistinguishable from one with zero unchecked
      # boxes — that silence is what let an unfinished subfeature earn a real
      # checkpoint tag.
      tolower($0) ~ /^##[[:space:]]+acceptance checklist/ { found = 1; inblock = 1; next }
      inblock && /^##[[:space:]]/ { inblock = 0 }
      # Accept "-" or "*" bullets at any indentation. Requiring a hyphen in
      # column 0 silently skipped every nested item.
      inblock && /^[[:space:]]*[-*][[:space:]]+\[[[:space:]]\]/ { unchecked++ }
      END { print (found ? "FOUND" : "ABSENT") "\t" unchecked }
    ' "$SF_TASKS")
    SF_FOUND=$(printf '%s' "$SF_READ" | cut -f1)
    UNCHECKED=$(printf '%s' "$SF_READ" | cut -f2)
    if [ "$SF_FOUND" = "ABSENT" ]; then
      emit "GATE_EPIC=broken"
      emit "GATE_EPIC_DETAIL=$SF_ARG tasks.md has no ## Acceptance Checklist section"
      EPIC_PENDING="$SF_ARG"
    elif [ "${UNCHECKED:-1}" -eq 0 ]; then
      emit "GATE_EPIC=ok"
      pass
    else
      emit "GATE_EPIC=broken"
      emit "GATE_EPIC_DETAIL=$SF_ARG acceptance checklist has $UNCHECKED unchecked item(s)"
      EPIC_PENDING="$SF_ARG"
    fi
  fi
elif [ ! -f "$EPIC_MD" ]; then
  emit "GATE_EPIC=ok"
  pass
else
  EPIC_READ=$(awk '
    function trim(v) { gsub(/^[ \t]+|[ \t]+$/, "", v); return v }
    BEGIN { FS = "|"; statusidx = 0; ididx = 0; header = 0 }
    # A table ends at the first line that is not a pipe row. Without this the
    # header latched for the whole file, so a Notes table below the Subfeatures
    # table was read against the wrong column indices.
    !/^\|/ { header = 0; statusidx = 0; ididx = 0; next }
    # A header only counts when it names BOTH a status column AND an id column.
    # Requiring only "status" let an unrelated earlier table (Environments |
    # Status) pin the index and misread every real row.
    !header {
      s_i = 0; i_i = 0
      for (i = 2; i <= NF; i++) {
        cell = tolower(trim($i))
        if (cell == "status") { s_i = i }
        if (cell == "sf" || cell == "id") { i_i = i }
      }
      if (s_i && i_i) { statusidx = s_i; ididx = i_i; header = 1; anyheader = 1 }
      next
    }
    # Rows are found through the resolved id column, not by assuming SFxx is
    # first — a table ordered Name | SF | Status was previously invisible.
    header && trim($ididx) ~ /^SF[0-9]+$/ {
      st = tolower(trim($statusidx))
      id = trim($ididx)
      if (st != "done") { pending = pending (pending ? "," : "") id }
    }
    END { print (anyheader ? "HEADER" : "NOHEADER") "\t" pending }
  ' "$EPIC_MD" 2>/dev/null)

  EPIC_MODE=$(printf '%s' "$EPIC_READ" | cut -f1)
  EPIC_PENDING=$(printf '%s' "$EPIC_READ" | cut -f2)

  if [ "$EPIC_MODE" = "NOHEADER" ]; then
    # Pre-schema document: no header names its columns, so fall back to the
    # rule status.sh has always applied. Less precise, and the only reason it
    # is acceptable is that it is exactly what this doc was written against.
    EPIC_PENDING=$(grep -E '^\|[[:space:]]*SF[0-9]+' "$EPIC_MD" 2>/dev/null \
      | grep -Ev '\|[[:space:]]*done[[:space:]]*\|' \
      | sed -E 's/^\|[[:space:]]*(SF[0-9]+).*/\1/' \
      | paste -sd, - 2>/dev/null || true)
  fi
  if [ -z "$EPIC_PENDING" ]; then
    emit "GATE_EPIC=ok"
    pass
  else
    emit "GATE_EPIC=broken"
    emit "GATE_EPIC_DETAIL=Subfeature(s) not done: $EPIC_PENDING"
  fi
fi
emit "EPIC_PENDING=$EPIC_PENDING"

# ─── Gate 4: requirements coverage ───────────────────────────────────────────
# plan.md's coverage table. This is DELIBERATELY broader than /add.done STEP
# 4.2's rule, which only ever knew the `| ... | X |` form — that form is written
# by nothing in the framework, so keying on it alone made the gate unpassable.

# On an epic, plan.md lives at SF level (`add.plan` STEP 5's table, and
# SCOPE_DIR). Reading the feature-level path on a scoped run reported `missing`
# for every subfeature — the gate could never pass on the exact scope the epic
# loop runs.
PLAN_MD="$FEATURE_DIR/plan.md"
if [ -n "$SF_ARG" ]; then
  for sfdir in "$FEATURE_DIR/subfeatures/${SF_ARG}"-*; do
    [ -f "$sfdir/plan.md" ] || continue
    PLAN_MD="$sfdir/plan.md"
  done
fi
COVERAGE_UNCOVERED=""

# Two shapes are recognised, because two exist. /add.plan STEP 11 writes an
# UNNAMED table headed `| ID | Requirement | Covered? | ... |` with values
# YES / EXCLUDED — that is what real plans carry. `## Cobertura de Requisitos`
# with an `X` marker is the older shape /add.done STEP 4.2 looked for.
#
# When NEITHER exists the gate is `ok`, not `missing`. /add.done's rule was
# conditional ("IF plan.md has ## Cobertura de Requisitos"), so an absent table
# was always a pass-through, and /add.plan STEP 11 is itself a coverage gate at
# plan time. Making absence blocking would mean no schema-conforming feature
# could ever converge.

if [ ! -f "$PLAN_MD" ]; then
  emit "GATE_COVERAGE=missing"
  emit "GATE_COVERAGE_DETAIL=No plan.md under $FEATURE_DIR_ARG"
else
  COV_READ=$(awk '
    function trim(v) { gsub(/^[ \t]+|[ \t]+$/, "", v); return v }
    function isseparator(row,   i, c, only) {
      only = 1
      for (i = 2; i <= NF; i++) { c = trim($i); if (c != "" && c !~ /^:?-+:?$/) only = 0 }
      return only
    }
    BEGIN { FS = "|"; mode = "none"; n = 0 }
    # Fence-aware: a fenced example below the last heading is documentation,
    # not data. CLAUDE.md records this same lesson for the ## Materializes block.
    /^[[:space:]]*```/ { fence = !fence; next }
    fence { next }
    tolower($0) ~ /^##[[:space:]]+cobertura de requisitos/ { mode = "legacy"; inblock = 1; next }
    mode == "legacy" && /^##[[:space:]]/ { inblock = 0 }
    mode == "legacy" && inblock && /^\|/ && /\|[[:space:]]*[Xx][[:space:]]*\|/ { n++; next }
    # Header-named form: find the Covered? column, then read each data row.
    mode != "legacy" && /^\|/ && !covidx {
      for (i = 2; i <= NF; i++) { c = tolower(trim($i)); gsub(/\?/, "", c)
        if (c == "covered") { covidx = i; mode = "column" } }
      next
    }
    mode == "column" && /^\|/ {
      if (isseparator()) next
      v = toupper(trim($covidx))
      if (v != "YES" && v != "EXCLUDED" && v != "N/A" && v !~ /✅/) { n++ }
      next
    }
    END { print mode "\t" n }
  ' "$PLAN_MD")

  COV_MODE=$(printf '%s' "$COV_READ" | cut -f1)
  COVERAGE_UNCOVERED=$(printf '%s' "$COV_READ" | cut -f2)

  if [ "$COV_MODE" = "none" ]; then
    emit "GATE_COVERAGE=ok"
    emit "GATE_COVERAGE_DETAIL=No coverage table in plan.md; /add.plan STEP 11 owns this gate at plan time"
    COVERAGE_UNCOVERED=0
    pass
  elif [ "${COVERAGE_UNCOVERED:-1}" -eq 0 ]; then
    emit "GATE_COVERAGE=ok"
    pass
  else
    emit "GATE_COVERAGE=broken"
    emit "GATE_COVERAGE_DETAIL=$COVERAGE_UNCOVERED requirement(s) uncovered in plan.md ($COV_MODE form)"
  fi
fi
emit "COVERAGE_UNCOVERED=$COVERAGE_UNCOVERED"

# ─── Raw feature state ───────────────────────────────────────────────────────
# Reported, never acted on. No gate above branches on it. The calling command
# owns the defaults registry; duplicating it in shell is how the two drift.

if [ ! -f .codeadd/manifest.json ]; then
  emit "QA_FEATURE_STATE=no-manifest"
else
  FEATURE_STATE=$(node -e "
    try {
      const key = process.argv[1];
      const j = JSON.parse(require('fs').readFileSync('.codeadd/manifest.json', 'utf8'));
      const has = j.features && Object.prototype.hasOwnProperty.call(j.features, key);
      console.log(has ? String(j.features[key]) : 'unset');
    } catch (e) { console.log('unset'); }
  " "$QA_FEATURE_KEY" 2>/dev/null)
  emit "QA_FEATURE_STATE=${FEATURE_STATE:-unset}"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
# The single line a caller reads to decide convergence. Anything short of 4/4
# blocks; `not-probed` is legal in the vocabulary and never counts as a pass.

emit "GATES_OK=$GATES_OK/4"

exit 0
