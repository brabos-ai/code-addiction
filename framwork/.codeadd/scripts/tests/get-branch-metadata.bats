#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Standard branch types ───────────────────────────────────────────

@test "feature/0001F-test → feature, feat, slug, docs_dir" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "feature/0001F-test"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_NAME=feature/0001F-test"* ]]
  [[ "$output" == *"BRANCH_PREFIX=feature"* ]]
  [[ "$output" == *"BRANCH_TYPE=feature"* ]]
  [[ "$output" == *"COMMIT_TYPE=feat"* ]]
  [[ "$output" == *"FEATURE_ID=0001F"* ]]
  [[ "$output" == *"FEATURE_SLUG=0001F-test"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0001F-test"* ]]
}

@test "fix/0001H-bugfix → fix, fix" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "fix/0001H-bugfix"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0001H"* ]]
  [[ "$output" == *"BRANCH_TYPE=fix"* ]]
  [[ "$output" == *"COMMIT_TYPE=fix"* ]]
  [[ "$output" == *"FEATURE_SLUG=0001H-bugfix"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0001H-bugfix"* ]]
}

@test "hotfix/0002H-urgent → hotfix, fix" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "hotfix/0002H-urgent"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0002H"* ]]
  [[ "$output" == *"BRANCH_TYPE=hotfix"* ]]
  [[ "$output" == *"COMMIT_TYPE=hotfix"* ]]
  [[ "$output" == *"FEATURE_SLUG=0002H-urgent"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0002H-urgent"* ]]
}

# ─── Generic prefixes ────────────────────────────────────────────────

@test "refactor/0002R-cleanup → refactor, refactor" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "refactor/0002R-cleanup"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0002R"* ]]
  [[ "$output" == *"BRANCH_TYPE=refactor"* ]]
  [[ "$output" == *"COMMIT_TYPE=refactor"* ]]
  [[ "$output" == *"FEATURE_SLUG=0002R-cleanup"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0002R-cleanup"* ]]
}

@test "chore/0003C-deps → chore, chore" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "chore/0003C-deps"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0003C"* ]]
  [[ "$output" == *"BRANCH_TYPE=chore"* ]]
  [[ "$output" == *"COMMIT_TYPE=chore"* ]]
  [[ "$output" == *"FEATURE_SLUG=0003C-deps"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0003C-deps"* ]]
}

@test "docs/0004D-readme → docs, docs" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "docs/0004D-readme"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0004D"* ]]
  [[ "$output" == *"BRANCH_TYPE=docs"* ]]
  [[ "$output" == *"COMMIT_TYPE=docs"* ]]
  [[ "$output" == *"FEATURE_SLUG=0004D-readme"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0004D-readme"* ]]
}

@test "perf/0005F-optimize → perf, perf" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "perf/0005F-optimize"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0005F"* ]]
  [[ "$output" == *"BRANCH_TYPE=perf"* ]]
  [[ "$output" == *"COMMIT_TYPE=perf"* ]]
  [[ "$output" == *"FEATURE_SLUG=0005F-optimize"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0005F-optimize"* ]]
}

@test "test/0006F-coverage → test, test" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "test/0006F-coverage"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0006F"* ]]
  [[ "$output" == *"BRANCH_TYPE=test"* ]]
  [[ "$output" == *"COMMIT_TYPE=test"* ]]
  [[ "$output" == *"FEATURE_SLUG=0006F-coverage"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0006F-coverage"* ]]
}

@test "custom/0007F-whatever → custom (generic fallback)" {
  run "$SCRIPTS_DIR/get-branch-metadata.sh" "custom/0007F-whatever"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0007F"* ]]
  [[ "$output" == *"BRANCH_TYPE=custom"* ]]
  [[ "$output" == *"COMMIT_TYPE=custom"* ]]
  [[ "$output" == *"FEATURE_SLUG=0007F-whatever"* ]]
  [[ "$output" == *"DOCS_DIR=docs/features/0007F-whatever"* ]]
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
  [[ "$output" == *"BRANCH_NAME='(detached)'"* ]]
  [[ "$output" == *"BRANCH_TYPE=detached"* ]]
  [[ "$output" == *"FEATURE_ID="* ]]
}
