#!/usr/bin/env bats
# converge-gates.sh — deterministic, read-only probe for the four /add.done
# convergence gates (plan 0074-001-convergence-gate, F2). RED-FIRST: the
# script under test does not exist yet — every test below is expected to
# fail until F1 (converge-gates.sh) lands. That failure IS the point.
#
# Contract under test (see docs/plans/0074-PLAN--autonomous-epic-convergence-001-convergence-gate.md):
#   Usage: bash converge-gates.sh <FEATURE_DIR> [SFxx]
#   - exit 0 ALWAYS, whatever the probe results. exit 2 ONLY on CLI misuse.
#   - KEY=VALUE lines. Four gate keys: GATE_REVIEW, GATE_QA_BASELINE,
#     GATE_EPIC, GATE_COVERAGE. Statuses: ok | missing | broken | not-probed.
#     No gate emits not-probed in T1.
#   - Gate 2 WRAPS qa-evidence.sh validate (set -euo pipefail, fail() prints
#     STATUS=ERROR and exits 1) — converge-gates.sh captures that and
#     translates to GATE_QA_BASELINE=broken, NEVER propagates the exit code.
#   - QA_FEATURE_STATE is the RAW manifest value (true|false|unset|no-manifest);
#     no gate branches on it — copied from qa-preflight.sh's contract.
#   - GATES_OK=N/4 summary line. NO writes of any kind. Never promotes.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Fixture helpers ─────────────────────────────────────────────────────────

write_manifest() {
  mkdir -p "$TEST_REPO/.codeadd"
  printf '%s' "$1" > "$TEST_REPO/.codeadd/manifest.json"
}

# write_review <feature_abs_dir> <nnn> <overall_cell_text> <baseline_line_or_empty>
# overall_cell_text example: '✅ PASSED' or '❌ BLOCKED' — wrapped in ** to
# match the literal `| **Overall** | **...** |` shape /add.review writes.
write_review() {
  local dir=$1 nnn=$2 overall=$3 baseline_line=$4
  {
    echo "# Review $nnn: $(basename "$dir")"
    echo
    echo "> **Date:** 2026-08-27 | **Branch:** feature/$(basename "$dir")"
    [ -n "$baseline_line" ] && echo "$baseline_line"
    echo
    echo "## Quality Gate Report"
    echo
    echo "| Gate | Status | Details |"
    echo "|------|--------|---------|"
    echo "| Build | ✅ PASSED | build — 0 errors |"
    echo "| Spec Compliance | ✅ PASSED | 4/4 items compliant |"
    echo "| Code Review Score | ✅ PASSED | 9.0/10 |"
    echo "| Product Validation | ✅ PASSED | RF: 4/4, RN: 2/2 |"
    echo "| Validation Gates | ✅ PASSED | lint → exit 0 |"
    echo "| QA Judgement | ✅ PASSED | feature: run-001, 0 blockers |"
    echo "| **Overall** | **${overall}** | **Ready for merge** |"
    echo
    echo "## Spec Compliance Audit"
    echo "All items compliant."
    echo
    echo "## Code Review Summary"
    echo "No issues."
    echo
    echo "## Product Validation"
    echo "RF01: met. RN01: met."
    echo
    echo "## QA Judgement"
    echo "feature: run-001 — 0 blocker, 0 major, 0 minor, 0 polish."
    echo
    echo "## Fix Routing"
    echo "none"
    echo
    echo "## Resolution Annex"
  } > "$dir/review-$nnn.md"
}

# write_plan_coverage <feature_abs_dir> <mode: covered|uncovered|absent-section|absent-file>
write_plan_coverage() {
  local dir=$1 mode=$2
  if [ "$mode" = "absent-file" ]; then
    rm -f "$dir/plan.md"
    return
  fi
  {
    echo "# Plan: Feature"
    echo
    if [ "$mode" = "absent-section" ]; then
      echo "## Architecture Decisions"
      echo "nothing coverage-related in this plan"
    else
      echo "## Cobertura de Requisitos"
      echo
      echo "| Requisito | Coberto |"
      echo "|-----------|---------|"
      echo "| RF01 | ✅ |"
      if [ "$mode" = "uncovered" ]; then
        echo "| RF02 | X |"
      else
        echo "| RF02 | ✅ |"
      fi
    fi
  } > "$dir/plan.md"
}

# write_epic <feature_abs_dir> <mode: all-done|pending>
write_epic() {
  local dir=$1 mode=$2
  mkdir -p "$dir"
  {
    echo "# Epic"
    echo
    echo "| SF | Name | Status | Notes |"
    echo "|----|------|--------|-------|"
    echo "| SF01 | Alpha | done | — |"
    if [ "$mode" = "pending" ]; then
      echo "| SF02 | Beta | pending | — |"
    else
      echo "| SF02 | Beta | done | — |"
    fi
  } > "$dir/epic.md"
}

# write_sf_tasks <sf_abs_dir> <mode: complete|incomplete>
write_sf_tasks() {
  local dir=$1 mode=$2
  mkdir -p "$dir"
  {
    echo "# Tasks: Subfeature"
    echo
    echo "## Metadata"
    echo
    echo "## Requirements Coverage"
    echo "- [x] RF01 — thing"
    echo
    echo "## TDD"
    echo
    echo "## Execution"
    echo
    echo "## Acceptance Checklist"
    echo "- [x] Route works (RF01)"
    if [ "$mode" = "complete" ]; then
      echo "- [x] Service enforces rule (RF01)"
    else
      echo "- [ ] Service enforces rule (RF01)"
    fi
  } > "$dir/tasks.md"
}

# make_qa_run <scope_abs_dir> <feature_id> <run>
# Builds a working-store qa-validation report that passes qa-evidence.sh's
# validate_report exactly (frontmatter id/type/created/feature/scope/method/
# viewports/specs/judged-contract, the 11 required H2 sections, and 4
# severity counts). Mirrors qa-evidence.bats' make_run.
make_qa_run() {
  local scope=$1 feature_id=$2 run=$3
  local nnn=${run#run-}
  local scope_value='[]'
  [[ "$(basename "$scope")" =~ ^(SF[0-9][0-9])- ]] && scope_value="[${BASH_REMATCH[1]}]"
  local root="$scope/_tests/$run"
  mkdir -p "$root/screenshots"
  cat > "$root/qa-validation-$nnn.md" <<EOF
---
id: ${feature_id}-qa-validation-$nnn
type: qa-validation
created: 2026-08-27
feature: ${feature_id}
scope: $scope_value
method: read-png
specs: { about: about.md, design: design.md }
viewports: [desktop]
judged-contract: sha256:0123456789abcdef
---
# QA Validation $nnn
## TOC
- Summary
## TL;DR
Evidence retained.
## Summary
| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 0 |
| Polish | 0 |
## Coverage (contract-anchored, vs design.md)
covered
## Functional delivery (vs about.md)
delivered
## Findings
none
## Responsiveness
clean
## Accessibility
clean
## Fix Routing
none
## Clean screens
home
## Not covered / caveats
none
EOF
  printf 'png-%s\n' "$run" > "$root/screenshots/home.png"
}

# build_ok_tree <id> — a fully well-formed feature dir: PASSED review with a
# canonical feature:run-001 baseline + valid report, a covered plan.md, and
# an epic.md with every subfeature done. Prints the FEATURE_DIR relative to
# $TEST_REPO (cwd for the whole test, per common_setup).
build_ok_tree() {
  local id=$1
  local dir="docs/features/$id"
  local abs="$TEST_REPO/$dir"
  mkdir -p "$abs"
  make_qa_run "$abs" "${id%%-*}" run-001
  write_review "$abs" 001 '✅ PASSED' '> **QA baseline:** feature:run-001'
  write_plan_coverage "$abs" covered
  write_epic "$abs" all-done
  printf '%s' "$dir"
}

# ─── Gate 1 — review verdict ─────────────────────────────────────────────────

@test "gate 1: no review file at all → GATE_REVIEW=missing" {
  DIR="docs/features/0020F-noreview"
  mkdir -p "$TEST_REPO/$DIR"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=missing"* ]]
}

@test "gate 1: review exists but Overall is BLOCKED → GATE_REVIEW=broken" {
  DIR="docs/features/0021F-blocked"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_review "$ABS" 001 '❌ BLOCKED' '> **QA baseline:** none'
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=broken"* ]]
  [[ "$output" == *"GATE_REVIEW_DETAIL="* ]]
}

@test "gate 1: review exists and Overall is PASSED → GATE_REVIEW=ok" {
  DIR=$(build_ok_tree "0022F-passed")
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=ok"* ]]
  [[ "$output" == *"REVIEW_PATH="*"review-001.md"* ]]
}

@test "gate 1: the highest-numbered review is the one evaluated" {
  DIR="docs/features/0023F-highest"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_review "$ABS" 001 '❌ BLOCKED' '> **QA baseline:** none'
  write_review "$ABS" 002 '✅ PASSED' '> **QA baseline:** none'
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=ok"* ]]
  [[ "$output" == *"REVIEW_PATH="*"review-002.md"* ]]
}

# ─── Gate 2 — QA baseline (wraps qa-evidence.sh validate) ───────────────────

@test "L2: canonical feature:run-001 baseline with a schema-valid report → GATE_QA_BASELINE=ok" {
  DIR=$(build_ok_tree "0012F-canonical")
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_QA_BASELINE=ok"* ]]
  [[ "$output" == *"BASELINE=feature:run-001"* ]]
}

@test "L2: path-form baseline is rejected by qa-evidence.sh and translated to broken (0028F failure #2)" {
  DIR=$(build_ok_tree "0010F-pathform")
  ABS="$TEST_REPO/$DIR"

  # Prove qa-evidence.sh itself fails loud on this exact shape first.
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$ABS" "_tests/run-001"
  [ "$status" -ne 0 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
  [[ "$output" == *"Malformed baseline entry"* ]]

  # Corrupt the review's own baseline line to the same path-form value.
  sed -i 's#feature:run-001#_tests/run-001#' "$ABS/review-001.md"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_QA_BASELINE=broken"* ]]
  [[ "$output" == *"GATE_QA_BASELINE_DETAIL="*"Malformed baseline entry"* ]]
}

@test "L2: baseline correct but qa-validation report is absent, translated to broken (0028F failure #1)" {
  DIR="docs/features/0011F-noreport"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS/_tests/run-001"
  write_review "$ABS" 001 '✅ PASSED' '> **QA baseline:** feature:run-001'

  # Prove qa-evidence.sh itself fails loud: the run dir exists, the report doesn't.
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$ABS" "feature:run-001"
  [ "$status" -ne 0 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
  [[ "$output" == *"Missing source report"* ]]

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_QA_BASELINE=broken"* ]]
  [[ "$output" == *"GATE_QA_BASELINE_DETAIL="*"Missing source report"* ]]
}

@test "L2: none baseline with qa-pipeline disabled → GATE_QA_BASELINE=ok, not broken" {
  DIR="docs/features/0013F-nobaseline"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_review "$ABS" 001 '✅ PASSED' '> **QA baseline:** none'
  write_manifest '{"features":{"qa-pipeline":false}}'

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_QA_BASELINE=ok"* ]]
  [[ "$output" == *"BASELINE=none"* ]]
  [[ "$output" == *"QA_FEATURE_STATE=false"* ]]
}

@test "L2: report present but schema-invalid → GATE_QA_BASELINE=broken, naming the missing section" {
  DIR=$(build_ok_tree "0014F-badschema")
  ABS="$TEST_REPO/$DIR"
  sed -i '/^## Accessibility$/d' "$ABS/_tests/run-001/qa-validation-001.md"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_QA_BASELINE=broken"* ]]
  [[ "$output" == *"GATE_QA_BASELINE_DETAIL="*"Accessibility"* ]]
}

@test "L2: review with no QA baseline line at all → GATE_QA_BASELINE=missing" {
  DIR="docs/features/0015F-nolineatall"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_review "$ABS" 001 '✅ PASSED' ''

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_QA_BASELINE=missing"* ]]
}

# ─── Gate 3 — epic completeness (today's string rule) ───────────────────────

@test "gate 3: no epic.md at all → GATE_EPIC=ok (not applicable, not broken, not not-probed)" {
  DIR="docs/features/0030F-noepic"
  mkdir -p "$TEST_REPO/$DIR"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
  [[ "$output" != *"GATE_EPIC=not-probed"* ]]
  [[ "$output" != *"GATE_EPIC=broken"* ]]
}

@test "gate 3: epic.md with every subfeature done → GATE_EPIC=ok" {
  DIR="docs/features/0031F-alldone"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_epic "$ABS" all-done
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
}

@test "gate 3: epic.md with a pending subfeature → GATE_EPIC=broken, naming it" {
  DIR="docs/features/0032F-pending"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_epic "$ABS" pending
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=broken"* ]]
  [[ "$output" == *"EPIC_PENDING="*"SF02"* ]]
}

@test "gate 3 scoped: SFxx given, its tasks.md acceptance checklist complete → ok (overrides epic.md's pending row)" {
  DIR="docs/features/0033F-scopedok"
  ABS="$TEST_REPO/$DIR"
  write_epic "$ABS" pending
  write_sf_tasks "$ABS/subfeatures/SF02-beta" complete
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR" SF02
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
}

@test "gate 3 scoped: SFxx given, its tasks.md acceptance checklist incomplete → broken (even though epic.md marks it done)" {
  DIR="docs/features/0034F-scopedbroken"
  ABS="$TEST_REPO/$DIR"
  write_epic "$ABS" all-done
  write_sf_tasks "$ABS/subfeatures/SF02-beta" incomplete
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR" SF02
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=broken"* ]]
}

# ─── Adversarial round: defects the first 38 tests could not see ─────────────
# Every test below was RED against the implementation that passed 38/38.

# write_review_detail <dir> <nnn> <overall> <baseline_line> <details_cell>
write_review_detail() {
  local dir=$1 nnn=$2 overall=$3 baseline=$4 details=$5
  {
    echo "# Review $nnn"
    echo
    [ -n "$baseline" ] && echo "$baseline"
    echo
    echo "| Gate | Status | Details |"
    echo "|------|--------|---------|"
    echo "| **Overall** | **${overall}** | ${details} |"
    echo
    echo "## Fix Routing"
  } > "$dir/review-$nnn.md"
}

@test "C1: a BLOCKED verdict whose Details cell says PASSED must not pass gate 1" {
  DIR="docs/features/0040F-c1"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  write_review_detail "$ABS" 001 '❌ BLOCKED' '> **QA baseline:** none' '5/6 gates PASSED — Code Review BLOCKED'
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=broken"* ]]
}

@test "C1b: NOT PASSED must not pass gate 1 (it contains its own negation)" {
  DIR="docs/features/0041F-c1b"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  write_review_detail "$ABS" 001 '❌ NOT PASSED' '> **QA baseline:** none' 'blocked on review'
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_REVIEW=broken"* ]]
}

@test "C2: a prose line mentioning Overall must not be read as the verdict row" {
  DIR="docs/features/0042F-c2"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  {
    echo "# Review 001"
    echo "> **QA baseline:** none"
    echo
    echo "**Overall** the build PASSED but product validation did not."
    echo
    echo "| Gate | Status | Details |"
    echo "|------|--------|---------|"
    echo "| **Overall** | **❌ BLOCKED** | product validation failed |"
  } > "$ABS/review-001.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_REVIEW=broken"* ]]
}

@test "C3: a plan.md written to add.plan STEP 11's real shape must not block gate 4" {
  DIR="docs/features/0043F-c3"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  {
    echo "# Plan"
    echo
    echo "## Tasks"
    echo
    echo "| ID | Requirement | Covered? | Feature/Area | Tasks |"
    echo "|----|-------------|----------|--------------|-------|"
    echo "| RF01 | User creates account | YES | Backend | 1.1 |"
    echo "| RF05 | Admin toggle RLS | EXCLUDED | - | Out of scope |"
  } > "$ABS/plan.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
  [[ "$output" != *"GATE_COVERAGE=missing"* ]]
}

@test "C3b: a plan.md with NO coverage table at all must not block — the old rule was conditional" {
  DIR="docs/features/0044F-c3b"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  printf '# Plan\n\n## Architecture Decisions\nnothing coverage-related\n' > "$ABS/plan.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
}

@test "C4: NO and ❌ in the Covered? column count as uncovered" {
  DIR="docs/features/0045F-c4"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  {
    echo "| ID | Requirement | Covered? | Feature/Area | Tasks |"
    echo "|----|-------------|----------|--------------|-------|"
    echo "| RF01 | ok one | YES | Backend | 1.1 |"
    echo "| RF05 | Admin toggle RLS | NO | - | none |"
    echo "| RF06 | Bulk export | ❌ | - | none |"
  } > "$ABS/plan.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_COVERAGE=broken"* ]]
  [[ "$output" == *"COVERAGE_UNCOVERED=2"* ]]
}

@test "C5: a tasks.md with no Acceptance Checklist section is not a silent pass" {
  DIR="docs/features/0046F-c5"; ABS="$TEST_REPO/$DIR"
  write_epic "$ABS" pending
  mkdir -p "$ABS/subfeatures/SF02-beta"
  printf '# Tasks\n\n## Execution\nnothing here\n' > "$ABS/subfeatures/SF02-beta/tasks.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR" SF02
  [[ "$output" == *"GATE_EPIC=broken"* ]]
}

@test "C5b: star bullets and indented boxes in the Acceptance Checklist are still counted" {
  DIR="docs/features/0047F-c5b"; ABS="$TEST_REPO/$DIR"
  write_epic "$ABS" pending
  mkdir -p "$ABS/subfeatures/SF02-beta"
  printf '# Tasks\n\n## Acceptance Checklist\n* [x] one\n  - [ ] nested unchecked\n' > "$ABS/subfeatures/SF02-beta/tasks.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR" SF02
  [[ "$output" == *"GATE_EPIC=broken"* ]]
}

@test "C6a: a second table below the Subfeatures table must not poison gate 3" {
  DIR="docs/features/0048F-c6a"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  {
    echo "## Subfeatures"
    echo "| SF | Name | Status |"
    echo "|----|------|--------|"
    echo "| SF01 | Alpha | done |"
    echo "| SF02 | Beta | done |"
    echo
    echo "## Notes"
    echo "| SF | Depends on |"
    echo "|----|------------|"
    echo "| SF02 | SF01 |"
  } > "$ABS/epic.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_EPIC=ok"* ]]
}

@test "C6b: an unrelated earlier Status column must not hijack the header index" {
  DIR="docs/features/0049F-c6b"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  {
    echo "## Environments"
    echo "| Env | Status |"
    echo "|-----|--------|"
    echo "| staging | up |"
    echo
    echo "## Subfeatures"
    echo "| SF | Name | Status |"
    echo "|----|------|--------|"
    echo "| SF01 | Alpha | done |"
    echo "| SF02 | Beta | pending |"
  } > "$ABS/epic.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_EPIC=broken"* ]]
  [[ "$output" == *"EPIC_PENDING=SF02"* ]]
  [[ "$output" != *"EPIC_PENDING=SF01"* ]]
}

@test "C6c: the id column is resolved by header, not assumed to be first" {
  DIR="docs/features/0050F-c6c"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  {
    echo "| Name | SF | Status |"
    echo "|------|----|--------|"
    echo "| Alpha | SF01 | done |"
    echo "| Beta | SF02 | pending |"
  } > "$ABS/epic.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_EPIC=broken"* ]]
  [[ "$output" == *"SF02"* ]]
}

@test "C7: gate 4 is fence-aware — a fenced example is not a real uncovered row" {
  DIR="docs/features/0051F-c7"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  {
    echo "## Cobertura de Requisitos"
    echo "| Requisito | Coberto |"
    echo "|-----------|---------|"
    echo "| RF01 | ✅ |"
    echo
    echo '```markdown'
    echo "| RF99 | X |"
    echo '```'
  } > "$ABS/plan.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
}

@test "S1: an epic-wide run aggregates the SUBFEATURE plans for coverage" {
  DIR="docs/features/0054F-s1"; ABS="$TEST_REPO/$DIR"
  write_epic "$ABS" all-done
  # On an epic there is NO feature-level plan.md — add.plan STEP 5 puts it at SF level.
  mkdir -p "$ABS/subfeatures/SF01-alpha" "$ABS/subfeatures/SF02-beta"
  printf '| ID | Requirement | Covered? |
|----|---|---|
| RF01 | a | YES |
' > "$ABS/subfeatures/SF01-alpha/plan.md"
  printf '| ID | Requirement | Covered? |
|----|---|---|
| RF02 | b | YES |
' > "$ABS/subfeatures/SF02-beta/plan.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
  [[ "$output" != *"GATE_COVERAGE=missing"* ]]
}

@test "S2: an epic-wide run reports an uncovered requirement from ANY subfeature plan" {
  DIR="docs/features/0055F-s2"; ABS="$TEST_REPO/$DIR"
  write_epic "$ABS" all-done
  mkdir -p "$ABS/subfeatures/SF01-alpha" "$ABS/subfeatures/SF02-beta"
  printf '| ID | Requirement | Covered? |
|----|---|---|
| RF01 | a | YES |
' > "$ABS/subfeatures/SF01-alpha/plan.md"
  printf '| ID | Requirement | Covered? |
|----|---|---|
| RF02 | b | NO |
' > "$ABS/subfeatures/SF02-beta/plan.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [[ "$output" == *"GATE_COVERAGE=broken"* ]]
  [[ "$output" == *"COVERAGE_UNCOVERED=1"* ]]
}

@test "C8: a subfeature-scoped run reads the SUBFEATURE's plan.md, not the feature's" {
  DIR="docs/features/0053F-c8"; ABS="$TEST_REPO/$DIR"
  write_epic "$ABS" pending
  write_sf_tasks "$ABS/subfeatures/SF02-beta" complete
  # the plan lives at SF level on an epic — add.plan.md:139 and SCOPE_DIR
  {
    echo "| ID | Requirement | Covered? |"
    echo "|----|-------------|----------|"
    echo "| RF01 | thing | YES |"
  } > "$ABS/subfeatures/SF02-beta/plan.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR" SF02
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
  [[ "$output" != *"GATE_COVERAGE=missing"* ]]
}

@test "M2: an empty SF argument is CLI misuse, not a silent switch to the epic-wide rule" {
  DIR="docs/features/0052F-m2"; ABS="$TEST_REPO/$DIR"; mkdir -p "$ABS"
  write_epic "$ABS" all-done
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR" ""
  [ "$status" -eq 2 ]
}

# ─── Gate 3 (F19) — schema read closes the string rule's blind spots ─────────
# T1 read epic.md as text, exactly as status.sh does: any row not matching
# `| done |` counts as pending. That rule cannot tell WHICH column it matched,
# so a cell reading `done` anywhere in the row passes the whole row. F19 makes
# the read resolve `status` by header name. These two rows are the blind spots.

# write_epic_blindspot <feature_abs_dir> <mode: notes-done|name-done>
write_epic_blindspot() {
  local dir=$1 mode=$2
  mkdir -p "$dir"
  {
    echo "# Epic"
    echo
    echo "| SF | Name | Status | Notes |"
    echo "|----|------|--------|-------|"
    echo "| SF01 | Alpha | done | — |"
    if [ "$mode" = "notes-done" ]; then
      # status is pending; the NOTES cell happens to read exactly "done"
      echo "| SF02 | Beta | pending | done |"
    else
      # the subfeature is NAMED done; its status is pending
      echo "| SF02 | done | pending | — |"
    fi
  } > "$dir/epic.md"
}

@test "F19 blind spot 1: a Notes cell reading done must not pass a pending row" {
  DIR="docs/features/0035F-notesdone"
  ABS="$TEST_REPO/$DIR"
  write_epic_blindspot "$ABS" notes-done
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=broken"* ]]
  [[ "$output" == *"EPIC_PENDING="*"SF02"* ]]
}

@test "F19 blind spot 2: a subfeature NAMED done must not pass while pending" {
  DIR="docs/features/0036F-namedone"
  ABS="$TEST_REPO/$DIR"
  write_epic_blindspot "$ABS" name-done
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=broken"* ]]
  [[ "$output" == *"EPIC_PENDING="*"SF02"* ]]
}

@test "F19: status resolved by header name, not by column position" {
  DIR="docs/features/0037F-reordered"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  {
    echo "# Epic"
    echo
    echo "| SF | Status | Name | Objective |"
    echo "|----|--------|------|-----------|"
    echo "| SF01 | done | Alpha | build alpha |"
    echo "| SF02 | pending | Beta | build beta |"
  } > "$ABS/epic.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=broken"* ]]
  [[ "$output" == *"EPIC_PENDING="*"SF02"* ]]
}

@test "F19 legacy: a done row carrying the extra checkpoint cell still reads done" {
  DIR="docs/features/0038F-legacycheckpoint"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  {
    echo "# Epic"
    echo
    echo "| SF | Name | Objective | Status |"
    echo "|----|------|-----------|--------|"
    # exactly what add.build block 14.3 has always written: a 4-column header
    # with a 5-cell done row, the extra trailing cell being the checkpoint tag
    echo "| SF01 | Alpha | build alpha | done | 0038F-SF01-done |"
    echo "| SF02 | Beta | build beta | done | 0038F-SF02-done |"
  } > "$ABS/epic.md"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
}

# ─── Gate 4 — requirements coverage ──────────────────────────────────────────

@test "gate 4: Cobertura de Requisitos with zero uncovered rows → GATE_COVERAGE=ok" {
  DIR="docs/features/0040F-covered"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_plan_coverage "$ABS" covered
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
  [[ "$output" == *"COVERAGE_UNCOVERED=0"* ]]
}

@test "gate 4: Cobertura de Requisitos with an uncovered row → GATE_COVERAGE=broken" {
  DIR="docs/features/0041F-uncovered"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_plan_coverage "$ABS" uncovered
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_COVERAGE=broken"* ]]
  [[ "$output" == *"COVERAGE_UNCOVERED=1"* ]]
}

# CHANGED BY THE ADVERSARIAL ROUND. This test previously asserted
# GATE_COVERAGE=missing for a plan with no coverage section, and that assertion
# encoded the C3 defect: /add.done STEP 4.2's rule was always conditional
# ("IF plan.md has ## Cobertura de Requisitos"), so an absent section was a
# pass-through. Making it `missing` — which blocks — meant NO schema-conforming
# feature could ever reach GATES_OK=4/4. The test was wrong, not the code.
@test "gate 4: plan.md with no coverage table at all is ok, not missing (the rule is conditional)" {
  DIR="docs/features/0026F-nosection"
  ABS="$TEST_REPO/$DIR"
  mkdir -p "$ABS"
  write_plan_coverage "$ABS" absent-section
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
  [[ "$output" != *"GATE_COVERAGE=missing"* ]]
}

@test "gate 4: no plan.md at all → GATE_COVERAGE=missing" {
  DIR="docs/features/0043F-noplan"
  mkdir -p "$TEST_REPO/$DIR"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_COVERAGE=missing"* ]]
}

# ─── Well-formed tree + gate isolation (every key traces to a real command) ─

@test "L1: a well-formed tree passes all four gates, GATES_OK=4/4" {
  DIR=$(build_ok_tree "0050F-wellformed")
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=ok"* ]]
  [[ "$output" == *"GATE_QA_BASELINE=ok"* ]]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
  [[ "$output" == *"GATES_OK=4/4"* ]]
}

@test "isolation: damaging only the review gate flips GATE_REVIEW and nothing else" {
  DIR=$(build_ok_tree "0051F-isoreview")
  ABS="$TEST_REPO/$DIR"
  sed -i 's/\*\*✅ PASSED\*\*/**❌ BLOCKED**/' "$ABS/review-001.md"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=broken"* ]]
  [[ "$output" == *"GATE_QA_BASELINE=ok"* ]]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
}

@test "isolation: damaging only the QA baseline gate flips GATE_QA_BASELINE and nothing else" {
  DIR=$(build_ok_tree "0052F-isobaseline")
  ABS="$TEST_REPO/$DIR"
  sed -i 's#feature:run-001#_tests/run-001#' "$ABS/review-001.md"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=ok"* ]]
  [[ "$output" == *"GATE_QA_BASELINE=broken"* ]]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
}

@test "isolation: damaging only the epic gate flips GATE_EPIC and nothing else" {
  DIR=$(build_ok_tree "0053F-isoepic")
  ABS="$TEST_REPO/$DIR"
  sed -i 's/Beta | done/Beta | pending/' "$ABS/epic.md"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=ok"* ]]
  [[ "$output" == *"GATE_QA_BASELINE=ok"* ]]
  [[ "$output" == *"GATE_EPIC=broken"* ]]
  [[ "$output" == *"GATE_COVERAGE=ok"* ]]
}

@test "isolation: damaging only the coverage gate flips GATE_COVERAGE and nothing else" {
  DIR=$(build_ok_tree "0054F-isocoverage")
  ABS="$TEST_REPO/$DIR"
  sed -i 's/| RF02 | ✅ |/| RF02 | X |/' "$ABS/plan.md"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATE_REVIEW=ok"* ]]
  [[ "$output" == *"GATE_QA_BASELINE=ok"* ]]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
  [[ "$output" == *"GATE_COVERAGE=broken"* ]]
}

@test "GATES_OK reflects a partial pass count on a mixed tree" {
  DIR=$(build_ok_tree "0081F-summarypartial")
  ABS="$TEST_REPO/$DIR"
  sed -i 's/\*\*✅ PASSED\*\*/**❌ BLOCKED**/' "$ABS/review-001.md"
  sed -i 's/Beta | done/Beta | pending/' "$ABS/epic.md"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATES_OK=2/4"* ]]
}

# ─── not-probed vocabulary + total failure ───────────────────────────────────

@test "no gate ever returns not-probed, even on a completely empty feature dir" {
  DIR="docs/features/0060F-empty"
  mkdir -p "$TEST_REPO/$DIR"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" != *"=not-probed"* ]]
  [[ "$output" == *"GATE_REVIEW=missing"* ]]
  [[ "$output" == *"GATE_QA_BASELINE=missing"* ]]
  [[ "$output" == *"GATE_EPIC=ok"* ]]
  [[ "$output" == *"GATE_COVERAGE=missing"* ]]
}

@test "exit 0 on total failure — diagnosis is never a gate" {
  DIR="docs/features/0061F-totalfail"
  mkdir -p "$TEST_REPO/$DIR"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GATES_OK="*"/4"* ]]
}

# ─── QA_FEATURE_STATE — raw manifest passthrough only ────────────────────────

@test "QA_FEATURE_STATE=no-manifest when .codeadd/manifest.json is absent" {
  DIR=$(build_ok_tree "0070F-nomanifest")
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_FEATURE_STATE=no-manifest"* ]]
}

@test "QA_FEATURE_STATE is the raw manifest value and never influences a gate outcome" {
  DIR=$(build_ok_tree "0071F-truestate")
  write_manifest '{"features":{"qa-pipeline":true}}'
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_FEATURE_STATE=true"* ]]
  [[ "$output" == *"GATE_QA_BASELINE=ok"* ]]
}

@test "QA_FEATURE_STATE=unset when manifest has no qa-pipeline key" {
  DIR=$(build_ok_tree "0072F-unsetstate")
  write_manifest '{"version":"0.0.0","providers":["claude"]}'
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_FEATURE_STATE=unset"* ]]
}

# ─── CLI contract — misuse is the only path to a non-zero exit ─────────────

@test "CLI misuse: no arguments → exit 2 with usage" {
  run bash "$SCRIPTS_DIR/converge-gates.sh"
  [ "$status" -eq 2 ]
  [[ "$output" == *"Usage"* ]]
}

@test "CLI misuse: non-existent FEATURE_DIR → exit 2 with usage" {
  run bash "$SCRIPTS_DIR/converge-gates.sh" "docs/features/9999Z-does-not-exist"
  [ "$status" -eq 2 ]
  [[ "$output" == *"Usage"* ]]
}

# ─── No writes, ever — this is what makes it legal inside a read-only step ──

@test "performs no writes: the tree is byte-identical before and after a run, even on a broken tree" {
  DIR=$(build_ok_tree "0090F-nowrite")
  ABS="$TEST_REPO/$DIR"
  sed -i 's/\*\*✅ PASSED\*\*/**❌ BLOCKED**/' "$ABS/review-001.md"
  BACKUP="$TEST_TEMP_DIR/backup-nowrite"
  cp -r "$ABS" "$BACKUP"

  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [ "$(diff -r "$BACKUP" "$ABS")" = "" ]
}

@test "never leaks qa-evidence.sh promote output and never creates _tests/final" {
  DIR=$(build_ok_tree "0091F-nopromote")
  ABS="$TEST_REPO/$DIR"
  run bash "$SCRIPTS_DIR/converge-gates.sh" "$DIR"
  [ "$status" -eq 0 ]
  [[ "$output" != *"ACTION=promoted"* ]]
  [[ "$output" != *"ACTION=noop"* ]]
  [ ! -d "$ABS/_tests/final" ]
}
