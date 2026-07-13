#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Helpers ─────────────────────────────────────────────────────────

# Creates docs/features/<dir>/about.md with an optional branch: frontmatter.
# Usage: make_feature <dir> [branch]
make_feature() {
  local dir="$1"
  local branch="${2:-}"
  mkdir -p "docs/features/$dir"
  if [ -n "$branch" ]; then
    printf -- '---\nid: %s\nbranch: %s\n---\n# about\n' "$dir" "$branch" \
      > "docs/features/$dir/about.md"
  else
    printf -- '---\nid: %s\n---\n# about\n' "$dir" \
      > "docs/features/$dir/about.md"
  fi
}

# ─── FEATURE_DIR resolution ──────────────────────────────────────────

@test "resolves feature dir by ID (glob)" {
  make_feature "0042F-auth-system" "feature/0042F-auth-system"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:feature/0042F-auth-system"* ]]
}

@test "resolves feature dir by full slug" {
  make_feature "0042F-auth-system" "feature/0042F-auth-system"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F-auth-system
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:feature/0042F-auth-system"* ]]
}

@test "not-found feature dir exits 2 with stderr" {
  run "$SCRIPTS_DIR/build-setup.sh" 9999F
  [ "$status" -eq 2 ]
  [[ "$output" == *"9999F"* ]]
}

@test "ambiguous ID glob exits 2 and lists matches" {
  make_feature "0042F-auth-one" "feature/0042F-auth-one"
  make_feature "0042F-auth-two" "feature/0042F-auth-two"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 2 ]
  [[ "$output" == *"0042F-auth-one"* ]]
  [[ "$output" == *"0042F-auth-two"* ]]
}

# ─── branch: reading + legacy fallback ───────────────────────────────

@test "reads branch: from about.md frontmatter" {
  make_feature "0007F-billing" "feature/0007F-billing"
  run "$SCRIPTS_DIR/build-setup.sh" 0007F
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:feature/0007F-billing"* ]]
  [[ "$output" != *"DERIVED:true"* ]]
}

@test "legacy docs without branch: derive from ID letter (F->feature)" {
  make_feature "0011F-legacy"
  run "$SCRIPTS_DIR/build-setup.sh" 0011F
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:feature/0011F-legacy"* ]]
  [[ "$output" == *"DERIVED:true"* ]]
}

@test "legacy hotfix docs derive H->hotfix" {
  make_feature "0011H-legacy-fix"
  run "$SCRIPTS_DIR/build-setup.sh" 0011H
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:hotfix/0011H-legacy-fix"* ]]
  [[ "$output" == *"DERIVED:true"* ]]
}

# ─── Validation (Hard Invariant) ─────────────────────────────────────

@test "invalid branch: format exits 3" {
  make_feature "0042F-auth" "not-a-valid-branch"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 3 ]
}

@test "branch slug not equal to dirname exits 3" {
  make_feature "0042F-auth" "feature/0042F-different"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 3 ]
}

# ─── Idempotent create-or-checkout ───────────────────────────────────

@test "creates new branch (STATE:created)" {
  make_feature "0042F-auth" "feature/0042F-auth"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATE:created"* ]]
  [[ "$output" == *"MODE:in-place"* ]]
  run git branch --show-current
  [ "$output" = "feature/0042F-auth" ]
}

@test "checks out existing branch (STATE:existing)" {
  make_feature "0042F-auth" "feature/0042F-auth"
  git branch feature/0042F-auth
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATE:existing"* ]]
}

@test "already on target branch (STATE:current)" {
  make_feature "0042F-auth" "feature/0042F-auth"
  git checkout -b feature/0042F-auth -q
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATE:current"* ]]
}

# ─── Dirty-tree guard (in-place only) ────────────────────────────────

@test "dirty tracked tree exits 5" {
  make_feature "0042F-auth" "feature/0042F-auth"
  echo "tracked" > tracked.txt
  git add tracked.txt
  git commit -m "add tracked" -q
  echo "modified" >> tracked.txt
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 5 ]
}

@test "untracked-only tree is allowed" {
  make_feature "0042F-auth" "feature/0042F-auth"
  echo "untracked" > untracked.txt
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATE:created"* ]]
}

# ─── Base resolution ─────────────────────────────────────────────────

@test "no verifiable main exits 4" {
  make_feature "0042F-auth" "feature/0042F-auth"
  git branch -m develop
  run "$SCRIPTS_DIR/build-setup.sh" 0042F
  [ "$status" -eq 4 ]
}

# ─── Worktree mode ───────────────────────────────────────────────────

@test "worktree mode adds worktree and prints WORKTREE" {
  make_feature "0042F-auth" "feature/0042F-auth"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F --worktree
  [ "$status" -eq 0 ]
  [[ "$output" == *"MODE:worktree"* ]]
  [[ "$output" == *"WORKTREE:"* ]]
  [ -d ".worktrees/0042F-auth" ]
}

@test "worktree mode appends .worktrees/ to .gitignore" {
  make_feature "0042F-auth" "feature/0042F-auth"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F --worktree
  [ "$status" -eq 0 ]
  grep -q '.worktrees/' .gitignore
}

@test "worktree mode copies untracked feature docs into worktree" {
  make_feature "0042F-auth" "feature/0042F-auth"
  run "$SCRIPTS_DIR/build-setup.sh" 0042F --worktree
  [ "$status" -eq 0 ]
  [ -f ".worktrees/0042F-auth/docs/features/0042F-auth/about.md" ]
}

@test "worktree mode does not run dirty-tree guard" {
  make_feature "0042F-auth" "feature/0042F-auth"
  echo "tracked" > tracked.txt
  git add tracked.txt
  git commit -m "add tracked" -q
  echo "modified" >> tracked.txt
  run "$SCRIPTS_DIR/build-setup.sh" 0042F --worktree
  [ "$status" -eq 0 ]
  [[ "$output" == *"MODE:worktree"* ]]
}

@test "worktree mode over a pre-existing branch reports STATE:existing" {
  make_feature "0042F-auth" "feature/0042F-auth"
  git branch feature/0042F-auth
  run "$SCRIPTS_DIR/build-setup.sh" 0042F --worktree
  [ "$status" -eq 0 ]
  [[ "$output" == *"MODE:worktree"* ]]
  [[ "$output" == *"STATE:existing"* ]]
  [ -d ".worktrees/0042F-auth" ]
}

@test "worktree idempotency (STATE:current when already registered)" {
  make_feature "0042F-auth" "feature/0042F-auth"
  "$SCRIPTS_DIR/build-setup.sh" 0042F --worktree
  run "$SCRIPTS_DIR/build-setup.sh" 0042F --worktree
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATE:current"* ]]
}
