#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
  FEATURE="$TEST_REPO/docs/features/0001F-evidence"
  mkdir -p "$FEATURE"
}

teardown() {
  common_teardown
}

make_run() {
  local scope=$1
  local run=$2
  local store=${3:-working}
  local nnn=${run#run-}
  local root="$scope/_tests"
  local scope_value='[]'
  [[ "$(basename "$scope")" =~ ^(SF[0-9][0-9])- ]] && scope_value="[${BASH_REMATCH[1]}]"
  [ "$store" = final ] && root="$root/final"
  mkdir -p "$root/$run/screenshots"
  cat > "$root/$run/qa-validation-$nnn.md" <<EOF
---
id: 0001F-qa-validation-$nnn
type: qa-validation
created: 2026-08-17
feature: 0001F
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
| Blocker | 1 |
| Major | 2 |
| Minor | 3 |
| Polish | 4 |
## Coverage (contract-anchored, vs design.md)
covered
## Functional delivery (vs about.md)
delivered
## Findings
Open finding retained.
## Responsiveness (per viewport)
clean
## Accessibility (axe-core + visual)
clean
## Fix Routing
none
## Clean screens
home
## Not covered / caveats
none
EOF
  printf 'png-%s\n' "$run" > "$root/$run/screenshots/home.png"
}

@test "next starts at run-001 with no evidence" {
  run bash "$SCRIPTS_DIR/qa-evidence.sh" next "$FEATURE"
  [ "$status" -eq 0 ]
  [[ "$output" == *"RUN_ID=run-001"* ]]
}

@test "next uses the union of working and final evidence" {
  make_run "$FEATURE" run-003
  make_run "$FEATURE" run-007 final
  run bash "$SCRIPTS_DIR/qa-evidence.sh" next "$FEATURE"
  [ "$status" -eq 0 ]
  [[ "$output" == *"RUN_ID=run-008"* ]]
}

@test "previous resolves the immediate numeric predecessor across both stores" {
  make_run "$FEATURE" run-002 final
  make_run "$FEATURE" run-004 final
  make_run "$FEATURE" run-005
  run bash "$SCRIPTS_DIR/qa-evidence.sh" previous "$FEATURE" run-005
  [ "$status" -eq 0 ]
  [[ "$output" == *"PREVIOUS=run-004"* ]]
  [[ "$output" == *"_tests/final/run-004/qa-validation-004.md"* ]]
}

@test "working baseline keeps feature and subfeature counters independent" {
  SF1="$FEATURE/subfeatures/SF01-first"
  SF2="$FEATURE/subfeatures/SF02-second"
  mkdir -p "$SF1" "$SF2"
  make_run "$SF1" run-003
  make_run "$SF2" run-001
  run bash "$SCRIPTS_DIR/qa-evidence.sh" working-baseline "$FEATURE"
  [ "$status" -eq 0 ]
  [[ "$output" == "BASELINE=SF01:run-003,SF02:run-001" ]]
}

@test "mixed feature and subfeature baselines compare as canonical sets" {
  SF1="$FEATURE/subfeatures/SF01-first"
  mkdir -p "$SF1"
  make_run "$FEATURE" run-002
  make_run "$SF1" run-003

  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$FEATURE" "feature:run-002 · SF01:run-003"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SF01:run-003"* ]]
  [[ "$output" == *"feature:run-002"* ]]

  run bash "$SCRIPTS_DIR/qa-evidence.sh" promote "$FEATURE" "feature:run-002,SF01:run-003"
  [ "$status" -eq 0 ]
  [ -f "$FEATURE/_tests/final/run-002/qa-validation-002.md" ]
  [ -f "$SF1/_tests/final/run-003/qa-validation-003.md" ]
}

@test "validate rejects a stale review baseline" {
  make_run "$FEATURE" run-003
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$FEATURE" "feature:run-002"
  [ "$status" -eq 1 ]
  [[ "$output" == *"differs from current working evidence"* ]]
}

@test "validate rejects duplicate scope keys and malformed IDs" {
  make_run "$FEATURE" run-003
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$FEATURE" "feature:run-003,feature:run-003"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Duplicate baseline scope"* ]]
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$FEATURE" "feature:run-3"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Malformed baseline entry"* ]]
}

@test "validate rejects report number mismatches" {
  make_run "$FEATURE" run-003
  sed -i 's/qa-validation-003/qa-validation-002/' "$FEATURE/_tests/run-003/qa-validation-003.md"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$FEATURE" "feature:run-003"
  [ "$status" -eq 1 ]
  [[ "$output" == *"number mismatch"* ]]
}

@test "validate rejects a schema-incomplete report" {
  make_run "$FEATURE" run-003
  sed -i '/^judged-contract:/d' "$FEATURE/_tests/run-003/qa-validation-003.md"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$FEATURE" "feature:run-003"
  [ "$status" -eq 1 ]
  [[ "$output" == *"field judged-contract"* ]]
}

@test "promote copies the complete run and retry is an idempotent no-op" {
  make_run "$FEATURE" run-003
  run bash "$SCRIPTS_DIR/qa-evidence.sh" promote "$FEATURE" "feature:run-003"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ACTION=promoted"* ]]
  [[ "$output" == *"REPORT_CREATED=2026-08-17"* ]]
  [[ "$output" == *"BLOCKER_COUNT=1"* ]]
  [ -f "$FEATURE/_tests/final/run-003/screenshots/home.png" ]
  grep -q 'Open finding retained' "$FEATURE/_tests/final/run-003/qa-validation-003.md"
  [ -f "$FEATURE/_tests/run-003/screenshots/home.png" ]

  run bash "$SCRIPTS_DIR/qa-evidence.sh" promote "$FEATURE" "feature:run-003"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ACTION=noop"* ]]
}

@test "promote blocks an immutable destination conflict" {
  make_run "$FEATURE" run-003
  make_run "$FEATURE" run-003 final
  printf 'different\n' > "$FEATURE/_tests/final/run-003/screenshots/home.png"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" promote "$FEATURE" "feature:run-003"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Immutable final snapshot conflict"* ]]
}

@test "promote detects every immutable conflict before copying any scope" {
  SF1="$FEATURE/subfeatures/SF01-first"
  SF2="$FEATURE/subfeatures/SF02-second"
  mkdir -p "$SF1" "$SF2"
  make_run "$SF1" run-001
  make_run "$SF2" run-001
  make_run "$SF2" run-001 final
  printf 'different\n' > "$SF2/_tests/final/run-001/screenshots/home.png"

  run bash "$SCRIPTS_DIR/qa-evidence.sh" promote "$FEATURE" "SF01:run-001,SF02:run-001"
  [ "$status" -eq 1 ]
  [ ! -d "$SF1/_tests/final/run-001" ]
}

@test "none baseline succeeds only when no working run exists" {
  run bash "$SCRIPTS_DIR/qa-evidence.sh" promote "$FEATURE" none
  [ "$status" -eq 0 ]
  [[ "$output" == *"BASELINE=none"* ]]

  make_run "$FEATURE" run-001
  run bash "$SCRIPTS_DIR/qa-evidence.sh" promote "$FEATURE" none
  [ "$status" -eq 1 ]
}

@test "next fails clearly at the supported run-999 limit" {
  make_run "$FEATURE" run-999 final
  run bash "$SCRIPTS_DIR/qa-evidence.sh" next "$FEATURE"
  [ "$status" -eq 1 ]
  [[ "$output" == *"run limit reached at run-999"* ]]
}

@test "duplicate normalized subfeature scopes fail loud" {
  mkdir -p "$FEATURE/subfeatures/SF01-first" "$FEATURE/subfeatures/SF01-duplicate"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" scopes "$FEATURE"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Duplicate QA scope key"* ]]
}

@test "previous fails when the immediate predecessor directory has no report" {
  make_run "$FEATURE" run-001
  mkdir -p "$FEATURE/_tests/run-002"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" previous "$FEATURE" run-003
  [ "$status" -eq 1 ]
  [[ "$output" == *"has no report"* ]]
}

@test "validate rejects a symlinked baseline source" {
  make_run "$FEATURE" run-001
  mv "$FEATURE/_tests/run-001" "$FEATURE/_tests/outside-run"
  ln -s "$FEATURE/_tests/outside-run" "$FEATURE/_tests/run-001"
  [ -L "$FEATURE/_tests/run-001" ] || skip "native symlinks unavailable"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" validate "$FEATURE" "feature:run-001"
  [ "$status" -eq 1 ]
  [[ "$output" == *"must not be a symlink"* ]]
}

@test "ensure-ignore creates, normalizes, and reruns byte-identically" {
  printf 'node_modules/\n# ADD - managed by code-addiction\n.codeadd/\n# END ADD\n' > "$TEST_REPO/.gitignore"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" ensure-ignore "$TEST_REPO"
  [ "$status" -eq 0 ]
  first=$(cat "$TEST_REPO/.gitignore")
  [[ "$first" == *"docs/features/**/_tests/run-*/"* ]]
  [[ "$first" == *"# ADD - managed by code-addiction"* ]]

  run bash "$SCRIPTS_DIR/qa-evidence.sh" ensure-ignore "$TEST_REPO"
  [ "$status" -eq 0 ]
  [ "$(cat "$TEST_REPO/.gitignore")" = "$first" ]

  printf '\n# ADD QA evidence - managed by add.qa-setup\nwrong/\n# END ADD QA evidence\n' >> "$TEST_REPO/.gitignore"
  run bash "$SCRIPTS_DIR/qa-evidence.sh" ensure-ignore "$TEST_REPO"
  [ "$status" -eq 0 ]
  [ "$(grep -c '^# ADD QA evidence - managed by add.qa-setup$' "$TEST_REPO/.gitignore")" -eq 1 ]
  [[ "$(cat "$TEST_REPO/.gitignore")" != *"wrong/"* ]]
}
