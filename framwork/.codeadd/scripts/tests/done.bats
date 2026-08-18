#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Context mode (default) ─────────────────────────────────────────

@test "context mode: shows feature branch info" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CURRENT_BRANCH=feature/0001F-test"* ]]
  [[ "$output" == *"MAIN_BRANCH=main"* ]]
  [[ "$output" == *"BRANCH_TYPE=feature"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0001F"* ]]
}

@test "context mode: detects hotfix" {
  git checkout -b hotfix/0001H-urgent -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=hotfix"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0001H"* ]]
}

@test "context mode: detects fix" {
  git checkout -b fix/0001H-bugfix -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=fix"* ]]
}

@test "context mode: reports pending changes" {
  git checkout -b feature/0001F-test -q
  echo "change" > newfile.txt
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_UNCOMMITTED=true"* ]]
  [[ "$output" == *"UNTRACKED_COUNT=1"* ]]
}

@test "context mode: reports no pending changes" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_UNCOMMITTED=false"* ]]
}

# ─── Errors ───────────────────────────────────────────────────────────

@test "fails in detached HEAD" {
  git checkout --detach -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
  [[ "$output" == *"detached"* ]]
}

@test "context mode: fails on branch without ID" {
  git checkout -b random-branch -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
  [[ "$output" == *"No feature/hotfix ID found"* ]]
}

# ─── Generic branch prefixes (PRD0007) ───────────────────────────────

@test "context mode: refactor/0002R-cleanup detected as refactor" {
  git checkout -b refactor/0002R-cleanup -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=refactor"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0002R"* ]]
}

@test "context mode: chore/0003C-deps detected as chore" {
  git checkout -b chore/0003C-deps -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=chore"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0003C"* ]]
}

@test "context mode: docs/0004D-readme detected as docs" {
  git checkout -b docs/0004D-readme -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=docs"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0004D"* ]]
}

# ─── Merge mode guards ──────────────────────────────────────────────

@test "merge mode: fails when already on main (no ID)" {
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
}

@test "merge mode: fails on branch without ID" {
  git checkout -b random-branch -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"No feature/hotfix ID found"* ]]
}

# ─── Context mode: edge cases ────────────────────────────────────────

@test "context mode: reports multiple simultaneous changes (modified + staged + untracked)" {
  git checkout -b feature/0001F-test -q
  echo "original" > existing.txt
  git add existing.txt && git commit -m "add file" -q
  echo "modified" > existing.txt          # modified
  echo "staged content" > staged.txt
  git add staged.txt                       # staged
  echo "untracked" > newfile.txt           # untracked
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MODIFIED_COUNT=1"* ]]
  [[ "$output" == *"STAGED_COUNT=1"* ]]
  [[ "$output" == *"UNTRACKED_COUNT=1"* ]]
  [[ "$output" == *"HAS_UNCOMMITTED=true"* ]]
}

@test "context mode: emits WARNING when origin/main does not exist on remote" {
  # Without setup_remote — origin/main does not exist
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WARNING=Remote branch origin/main not found"* ]]
}

# ─── Merge mode: execution scenarios ────────────────────────────────

@test "merge mode: fails without remote configured (push failure)" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -ne 0 ]
}

@test "merge mode: detects merge conflict on squash" {
  setup_remote
  # Add base file on main and push
  echo "original content" > shared.txt
  git add shared.txt && git commit -m "add shared file" -q
  git push origin main -q
  # Create feature branch and modify the file
  git checkout -b feature/0001F-conflict -q
  echo "feature version" > shared.txt
  git add shared.txt && git commit -m "feature change" -q
  git push -u origin feature/0001F-conflict -q
  # Conflict: update main with a different change
  git checkout main -q
  echo "main conflicting version" > shared.txt
  git add shared.txt && git commit -m "main change" -q
  git push origin main -q
  # Return to feature and attempt merge
  git checkout feature/0001F-conflict -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"Merge conflict detected"* ]]
}

@test "merge mode: skips commit when branch has no commits beyond main" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  [[ "$output" == *"MERGE_COMMIT=SKIPPED"* ]]
}

# ─── Feature-scoped staging ─────────────────────────────────────────

@test "merge mode: does not sweep another feature's untracked docs into the commit" {
  setup_remote
  git checkout -b feature/0001F-test -q
  # Current feature's own doc (must be committed)
  mkdir -p docs/features/0001F-test
  echo "own" > docs/features/0001F-test/about.md
  # Another feature's untracked doc (must stay untracked)
  mkdir -p docs/features/0002F-other
  echo "other" > docs/features/0002F-other/about.md
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  # After merge (now on main): own doc tracked, other's doc still untracked
  run git ls-files docs/features/0001F-test/about.md
  [ -n "$output" ]
  run git ls-files docs/features/0002F-other/about.md
  [ -z "$output" ]
  [ -f docs/features/0002F-other/about.md ]
}

@test "merge mode: commits final QA snapshots and leaves ignored working runs local" {
  setup_remote
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test/_tests/run-001 docs/features/0001F-test/_tests/final/run-001
  echo "working" > docs/features/0001F-test/_tests/run-001/qa-validation-001.md
  echo "final" > docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md
  printf '# ADD QA evidence - managed by add.qa-setup\ndocs/features/**/_tests/run-*/\n# END ADD QA evidence\n' > .gitignore
  git push -u origin feature/0001F-test -q

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  run git ls-files docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md
  [ -n "$output" ]
  run git ls-files docs/features/0001F-test/_tests/run-001/qa-validation-001.md
  [ -z "$output" ]
  [ -f docs/features/0001F-test/_tests/run-001/qa-validation-001.md ]
}

@test "merge mode: blocks when a broad ignore rule would omit final QA evidence" {
  setup_remote
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test/_tests/final/run-001
  echo "final" > docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md
  printf 'docs/features/**/_tests/\n' > .gitignore
  git push -u origin feature/0001F-test -q

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"Final QA snapshot is ignored"* ]]
}

@test "merge mode: blocks modification of an already tracked final snapshot" {
  setup_remote
  mkdir -p docs/features/0001F-test/_tests/final/run-001
  echo "original" > docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md
  git add . && git commit -m "add final evidence" -q && git push origin main -q
  git checkout -b feature/0001F-test -q
  echo "modified" > docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"Immutable final QA snapshot differs from HEAD"* ]]
}

@test "merge mode: blocks deletion of an already tracked final snapshot" {
  setup_remote
  mkdir -p docs/features/0001F-test/_tests/final/run-001
  echo "original" > docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md
  git add . && git commit -m "add final evidence" -q && git push origin main -q
  git checkout -b feature/0001F-test -q
  rm docs/features/0001F-test/_tests/final/run-001/qa-validation-001.md

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"Immutable final QA snapshot differs from HEAD"* ]]
}

# ─── Worktree awareness ─────────────────────────────────────────────

@test "start guard: fails when run from inside a linked worktree" {
  git checkout -b feature/0001F-test -q
  git worktree add -b feature/0002F-wt .worktrees/0002F-wt -q
  cd .worktrees/0002F-wt
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -ne 0 ]
  [[ "$output" == *"primary checkout"* ]]
}

@test "start guard: does not false-positive from a subdirectory of the primary checkout" {
  git checkout -b feature/0001F-test -q
  mkdir -p sub/dir
  cd sub/dir
  run "$SCRIPTS_DIR/done.sh"
  # Primary checkout must never be mistaken for a linked worktree, even when
  # invoked from a subdir (where --git-common-dir returns an absolute path).
  [[ "$output" != *"linked worktree"* ]]
  [[ "$output" != *"primary checkout"* ]]
}

@test "merge mode: worktree-cleanup step does not break a normal (no-worktree) merge" {
  setup_remote
  git checkout -b feature/0001F-test -q
  echo "code" > src.txt && git add src.txt && git commit -m "feat" -q
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  [[ "$output" == *"CLEANUP=OK"* ]]
}
