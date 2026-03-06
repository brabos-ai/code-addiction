#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Standard branch types ───────────────────────────────────────────

@test "feature/F0001-test → feature, feat, slug, docs_dir" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "feature/F0001-test"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_NAME=feature/F0001-test"* ]]
  [[ "$output" == *"BRANCH_PREFIX=feature"* ]]
  [[ "$output" == *"BRANCH_TYPE=feature"* ]]
  [[ "$output" == *"COMMIT_TYPE=feat"* ]]
  [[ "$output" == *"FEATURE_ID=F0001"* ]]
  [[ "$output" == *"FEATURE_SLUG=F0001-test"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/F0001-test"* ]]
}

@test "fix/F0001-bugfix → hotfix_feature, fix" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "fix/F0001-bugfix"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=F0001"* ]]
  [[ "$output" == *"BRANCH_TYPE=hotfix_feature"* ]]
  [[ "$output" == *"COMMIT_TYPE=fix"* ]]
  [[ "$output" == *"FEATURE_SLUG=F0001-bugfix"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/F0001-bugfix"* ]]
}

@test "fix/H0001-urgent → hotfix_standalone, fix, docs/hotfixes" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "fix/H0001-urgent"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=H0001"* ]]
  [[ "$output" == *"BRANCH_TYPE=hotfix_standalone"* ]]
  [[ "$output" == *"COMMIT_TYPE=fix"* ]]
  [[ "$output" == *"FEATURE_SLUG=H0001-urgent"* ]]
  [[ "$output" == *"DOCS_DIR=docs/hotfixes/H0001-urgent"* ]]
}

# ─── Generic prefixes ────────────────────────────────────────────────

@test "refactor/F0002-cleanup → feature, refactor" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "refactor/F0002-cleanup"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=F0002"* ]]
  [[ "$output" == *"BRANCH_TYPE=feature"* ]]
  [[ "$output" == *"COMMIT_TYPE=refactor"* ]]
  [[ "$output" == *"FEATURE_SLUG=F0002-cleanup"* ]]
}

@test "chore/F0003-deps → feature, chore" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "chore/F0003-deps"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=F0003"* ]]
  [[ "$output" == *"BRANCH_TYPE=feature"* ]]
  [[ "$output" == *"COMMIT_TYPE=chore"* ]]
}

@test "docs/F0004-readme → feature, docs" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "docs/F0004-readme"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=F0004"* ]]
  [[ "$output" == *"COMMIT_TYPE=docs"* ]]
}

@test "perf/F0005-optimize → feature, perf" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "perf/F0005-optimize"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=F0005"* ]]
  [[ "$output" == *"COMMIT_TYPE=perf"* ]]
}

@test "test/F0006-coverage → feature, test" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "test/F0006-coverage"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=F0006"* ]]
  [[ "$output" == *"COMMIT_TYPE=test"* ]]
}

@test "custom/F0007-whatever → feature, custom (fallback)" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "custom/F0007-whatever"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=F0007"* ]]
  [[ "$output" == *"COMMIT_TYPE=custom"* ]]
}

# ─── Generic prefixes with H[XXXX] ──────────────────────────────────

@test "chore/H0001-cleanup → hotfix_standalone, chore" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "chore/H0001-cleanup"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=H0001"* ]]
  [[ "$output" == *"BRANCH_TYPE=hotfix_standalone"* ]]
  [[ "$output" == *"COMMIT_TYPE=chore"* ]]
}

# ─── Branches without ID (exit 0, empty fields) ─────────────────────

@test "main → BRANCH_TYPE=main, empty ID/slug/docs, exit 0" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "main"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=main"* ]]
  [[ "$output" == *"FEATURE_ID="* ]]
  [[ "$output" == *"FEATURE_SLUG="* ]]
  [[ "$output" == *"DOCS_DIR="* ]]
  [[ "$output" == *"COMMIT_TYPE="* ]]
}

@test "master → BRANCH_TYPE=main, exit 0" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "master"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=main"* ]]
}

@test "random-branch → BRANCH_TYPE=other, exit 0" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "random-branch"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=other"* ]]
  [[ "$output" == *"FEATURE_ID="* ]]
  [[ "$output" == *"FEATURE_SLUG="* ]]
}

# ─── Detached HEAD ───────────────────────────────────────────────────

@test "detached HEAD → exit 0, all empty" {
  git checkout --detach -q
  run "$SCRIPTS_DIR/get-branch-metadata.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_NAME=(detached)"* ]]
  [[ "$output" == *"BRANCH_TYPE=detached"* ]]
  [[ "$output" == *"FEATURE_ID="* ]]
}
