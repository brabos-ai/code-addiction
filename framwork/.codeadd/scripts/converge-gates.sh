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
  OVERALL_ROW=$(grep -m1 -F '**Overall**' "$REVIEW_PATH" 2>/dev/null || true)
  if [ -z "$OVERALL_ROW" ]; then
    emit "GATE_REVIEW=broken"
    emit "GATE_REVIEW_DETAIL=No | **Overall** | row in $(basename "$REVIEW_PATH")"
  elif printf '%s' "$OVERALL_ROW" | grep -q 'PASSED'; then
    emit "GATE_REVIEW=ok"
    pass
  else
    emit "GATE_REVIEW=broken"
    emit "GATE_REVIEW_DETAIL=Overall row is not PASSED: $(flatten "$OVERALL_ROW")"
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
    UNCHECKED=$(awk '
      /^##[[:space:]]+Acceptance Checklist/ { inblock = 1; next }
      inblock && /^##[[:space:]]/ { inblock = 0 }
      inblock && /^-[[:space:]]+\[[[:space:]]\]/ { n++ }
      END { print n + 0 }
    ' "$SF_TASKS")
    if [ "$UNCHECKED" -eq 0 ]; then
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
  EPIC_PENDING=$(grep -E '^\|[[:space:]]*SF[0-9]+' "$EPIC_MD" 2>/dev/null \
    | grep -Ev '\|[[:space:]]*done[[:space:]]*\|' \
    | sed -E 's/^\|[[:space:]]*(SF[0-9]+).*/\1/' \
    | paste -sd, - 2>/dev/null || true)
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
# plan.md's `## Cobertura de Requisitos` section, counting rows marked
# uncovered. Same rule /add.done STEP 4.2 applies today.

PLAN_MD="$FEATURE_DIR/plan.md"
COVERAGE_UNCOVERED=""

if [ ! -f "$PLAN_MD" ]; then
  emit "GATE_COVERAGE=missing"
  emit "GATE_COVERAGE_DETAIL=No plan.md under $FEATURE_DIR_ARG"
elif ! grep -qE '^##[[:space:]]+Cobertura de Requisitos' "$PLAN_MD"; then
  emit "GATE_COVERAGE=missing"
  emit "GATE_COVERAGE_DETAIL=No ## Cobertura de Requisitos section in plan.md"
else
  COVERAGE_UNCOVERED=$(awk '
    /^##[[:space:]]+Cobertura de Requisitos/ { inblock = 1; next }
    inblock && /^##[[:space:]]/ { inblock = 0 }
    inblock && /^\|/ && /\|[[:space:]]*X[[:space:]]*\|/ { n++ }
    END { print n + 0 }
  ' "$PLAN_MD")
  if [ "$COVERAGE_UNCOVERED" -eq 0 ]; then
    emit "GATE_COVERAGE=ok"
    pass
  else
    emit "GATE_COVERAGE=broken"
    emit "GATE_COVERAGE_DETAIL=$COVERAGE_UNCOVERED requirement(s) uncovered in plan.md"
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
