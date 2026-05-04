#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
  # Create feature structure
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
}

teardown() {
  common_teardown
}

# ─── Success ─────────────────────────────────────────────────────────

@test "creates iterations.md and logs first iteration" {
  run "$SCRIPTS_DIR/log-iteration.sh" fix save-btn "fix validation" "api/ctrl.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I1"* ]]
  [[ "$output" == *"FEATURE:0001F-test"* ]]
  [ -f "docs/features/0001F-test/iterations.md" ]
}

@test "increments iteration number" {
  "$SCRIPTS_DIR/log-iteration.sh" fix first "first fix" "a.ts"
  run "$SCRIPTS_DIR/log-iteration.sh" add second "second add" "b.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I2"* ]]
}

@test "writes correct content to file" {
  "$SCRIPTS_DIR/log-iteration.sh" fix save-btn "fix validation" "api/ctrl.ts"
  local content
  content=$(cat docs/features/0001F-test/iterations.md)
  [[ "$content" == *"## I1|"* ]]
  [[ "$content" == *"|/dev|fix"* ]]
  [[ "$content" == *"save-btn|fix validation|api/ctrl.ts"* ]]
}

@test "accepts custom command as 5th argument" {
  run "$SCRIPTS_DIR/log-iteration.sh" add feat "new feat" "src.ts" "/hotfix"
  [ "$status" -eq 0 ]
  local content
  content=$(cat docs/features/0001F-test/iterations.md)
  [[ "$content" == *"|/hotfix|add"* ]]
}

# ─── Feature flag (epic) ────────────────────────────────────────────

@test "marks feature as complete with --feature N" {
  run "$SCRIPTS_DIR/log-iteration.sh" add signup "feature 1" "api.ts" "/dev" "--feature" "1"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_COMPLETE:1"* ]]
  local content
  content=$(cat docs/features/0001F-test/iterations.md)
  [[ "$content" == *"[FEATURE 1 COMPLETE]"* ]]
  [[ "$content" == *"|feature:1"* ]]
}

@test "accepts --epic flag" {
  run "$SCRIPTS_DIR/log-iteration.sh" add signup "feature 1" "api.ts" "/dev" "--feature" "1" "--epic" "auth-system"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EPIC:auth-system"* ]]
  local content
  content=$(cat docs/features/0001F-test/iterations.md)
  [[ "$content" == *"|epic:auth-system"* ]]
}

# ─── Truncation ────────────────────────────────────────────────────

@test "truncates what field at 60 characters" {
  local long_what="This is a very long description that exceeds sixty characters limit for sure yes it does"
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "$long_what" "f.ts"
  [ "$status" -eq 0 ]
  local content
  content=$(cat docs/features/0001F-test/iterations.md)
  # Written content must be at most 60 chars in the what field
  local what_part
  what_part=$(grep "^slug|" docs/features/0001F-test/iterations.md | cut -d'|' -f2)
  [ "${#what_part}" -le 60 ]
}

# ─── Validation ──────────────────────────────────────────────────────

@test "fails without arguments" {
  run "$SCRIPTS_DIR/log-iteration.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:missing_required_args"* ]]
}

@test "fails with invalid type" {
  run "$SCRIPTS_DIR/log-iteration.sh" invalid slug "what" "files"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:invalid_type"* ]]
}

@test "fails when not on feature branch" {
  git checkout main -q
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "what" "files"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:not_on_feature_branch"* ]]
}

@test "fails when feature dir does not exist" {
  git checkout -b feature/9999F-missing -q
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "what" "files"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:feature_dir_not_found"* ]]
}

@test "fails with --feature without numeric value" {
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "what" "files" "/dev" "--feature" "abc"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:"* ]]
}

@test "validates all accepted types" {
  for type in fix enhance refactor add remove config; do
    run "$SCRIPTS_DIR/log-iteration.sh" "$type" "slug-$type" "what" "f.ts"
    [ "$status" -eq 0 ]
  done
}

# ─── Empty / existing file ───────────────────────────────────────────

@test "works correctly when iterations.md already exists but is empty" {
  touch docs/features/0001F-test/iterations.md
  run "$SCRIPTS_DIR/log-iteration.sh" fix save-btn "fix validation" "api/ctrl.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I1"* ]]
  [ -s "docs/features/0001F-test/iterations.md" ]
}

# ─── Special characters / UTF-8 ────────────────────────────────────

@test "accepts UTF-8 characters in what field" {
  run "$SCRIPTS_DIR/log-iteration.sh" fix btn "corrigir validação de e-mail e autenticação" "api.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I1"* ]]
  local content
  content=$(cat docs/features/0001F-test/iterations.md)
  [[ "$content" == *"btn"* ]]
}
