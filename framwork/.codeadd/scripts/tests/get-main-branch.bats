#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Detection via remote ────────────────────────────────────────────

@test "detects main via origin/HEAD (cloned repo)" {
  setup_remote
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "main" ]
}

@test "detects main via refs/remotes/origin/main" {
  setup_remote
  # Remove symbolic-ref to force fallback to show-ref
  git remote set-head origin --delete 2>/dev/null || true
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "main" ]
}

@test "detects master via remote when main does not exist" {
  # Create repo with master
  cd "$TEST_TEMP_DIR"
  rm -rf "$TEST_REPO"
  mkdir -p "$TEST_REPO"
  cd "$TEST_REPO"
  git init --initial-branch=master -q
  git config user.email "test@test.com"
  git config user.name "Test"
  git commit --allow-empty -m "init" -q

  setup_remote_dir="$TEST_TEMP_DIR/remote"
  mkdir -p "$setup_remote_dir"
  git init --bare -q "$setup_remote_dir"
  git remote add origin "$setup_remote_dir"
  git push -u origin master -q 2>/dev/null

  # Remove symbolic-ref
  git remote set-head origin --delete 2>/dev/null || true

  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "master" ]
}

# ─── Detection via local branch (no remote) ─────────────────────────

@test "detects local main when there is no remote" {
  # Repo without remote, main branch already exists from setup
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "main" ]
}

@test "detects local master when there is no remote and branch is master" {
  git branch -m master
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "master" ]
}

# ─── Error cases ──────────────────────────────────────────────────

@test "fails with exit 1 outside of git repository" {
  cd "$TEST_TEMP_DIR"
  mkdir -p not-a-repo
  cd not-a-repo
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 1 ]
}

@test "fails with exit 2 when neither main nor master exists" {
  git branch -m develop
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 2 ]
}

@test "error message goes to stderr on failure" {
  git branch -m develop
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 2 ]
  [[ "$output" == *"ERRO"* ]]
}
