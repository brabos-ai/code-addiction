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

# ─── Merge-mode selection: the /add.pull-request route ──────────────
#
# The pre-check exists because that route leaves the branch un-merged LOCALLY
# while `main` already carries equivalent content, applied by GitHub's squash
# button as a new commit with a different SHA. The squash from the original
# merge base would then re-apply what `main` already has.
#
# The mode is chosen DETERMINISTICALLY, never by catching a conflict and
# retrying — discovering it as a merge failure is exactly the guessing the
# design rejects everywhere else.

@test "merge mode: main already carries the branch -> direct mode, entry lands once" {
  setup_remote
  echo "base" > app.txt && git add app.txt && git commit -m "base" -q
  git push origin main -q

  git checkout -b feature/0001F-index -q
  echo "feature" > app.txt && git add app.txt && git commit -m "feat" -q

  # GitHub's squash button: the SAME content on main as a NEW commit, so the
  # branch's commits are not ancestors of main.
  git checkout main -q
  echo "feature" > app.txt && git add app.txt && git commit -m "squash from PR" -q
  git push origin main -q

  # STEP 6 then adds its output on the branch, and only that.
  git checkout feature/0001F-index -q
  mkdir -p docs docs/features/0001F-index
  printf '{"v":1,"id":"0001F"}\n' > docs/delivered.jsonl
  echo "# changelog" > docs/features/0001F-index/changelog.md
  git add -A && git commit -m "docs" -q
  git push -u origin feature/0001F-index -q

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  [[ "$output" == *"MERGE_MODE=direct"* ]]
  [[ "$output" == *"MERGE_COMMIT=OK"* ]]
  [[ "$output" != *"ERROR=Merge conflict detected"* ]]

  # The entry landed on main, exactly once, and the code was not duplicated.
  [ "$(git rev-parse --abbrev-ref HEAD)" = "main" ]
  [ -f docs/delivered.jsonl ]
  [ "$(wc -l < docs/delivered.jsonl | tr -d ' ')" = "1" ]
  [ "$(cat app.txt)" = "feature" ]
}

@test "merge mode: a normal branch still takes the squash route" {
  setup_remote
  echo "base" > app.txt && git add app.txt && git commit -m "base" -q
  git push origin main -q

  git checkout -b feature/0002F-normal -q
  echo "feature" > app.txt && git add app.txt && git commit -m "feat" -q
  mkdir -p docs
  printf '{"v":1,"id":"0002F"}\n' > docs/delivered.jsonl
  git add -A && git commit -m "docs" -q
  git push -u origin feature/0002F-normal -q

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  [[ "$output" == *"MERGE_MODE=squash"* ]]
  [[ "$output" == *"SQUASH=OK"* ]]
  [ -f docs/delivered.jsonl ]
  [ "$(cat app.txt)" = "feature" ]
}

@test "merge mode: direct mode carries a STEP 6 DELETION, not just additions" {
  # docs-pruning deletes tracked files at STEP 6. `git checkout <branch> -- <p>`
  # cannot carry a deletion, which is why the direct mode applies a patch.
  setup_remote
  echo "base" > app.txt && git add app.txt && git commit -m "base" -q
  mkdir -p docs/features/0003F-prune
  echo "scaffolding" > docs/features/0003F-prune/discovery.md
  git add -A && git commit -m "docs scaffolding" -q
  git push origin main -q

  git checkout -b feature/0003F-prune -q
  echo "feature" > app.txt && git add app.txt && git commit -m "feat" -q

  git checkout main -q
  echo "feature" > app.txt && git add app.txt && git commit -m "squash from PR" -q
  git push origin main -q

  git checkout feature/0003F-prune -q
  rm docs/features/0003F-prune/discovery.md
  mkdir -p docs
  printf '{"v":1,"id":"0003F"}\n' > docs/delivered.jsonl
  git add -A && git commit -m "docs" -q
  git push -u origin feature/0003F-prune -q

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  [[ "$output" == *"MERGE_MODE=direct"* ]]
  [ -f docs/delivered.jsonl ]
  [ ! -f docs/features/0003F-prune/discovery.md ]
}

# ─── Mode split (plan 2026-09-11T014333, F4) ─────────────────────────
# --commit-push and --cleanup are EXTRACTED from --merge's body, never
# re-implemented beside it. --merge composes them around its own checkout,
# squash and push, so every case above still exercises the whole sequence
# through its original entry point.

@test "commit-push: commits and pushes the branch, and does NOT switch to main" {
  setup_remote
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "own" > docs/features/0001F-test/about.md
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --commit-push
  [ "$status" -eq 0 ]
  [[ "$output" == *"COMMIT=OK"* ]]
  [[ "$output" == *"PUSH_BRANCH=OK"* ]]
  # The half that must NOT happen: no checkout, no merge, no push to main.
  [[ "$output" != *"CHECKOUT_MAIN=OK"* ]]
  [[ "$output" != *"PUSH_MAIN=OK"* ]]
  [ "$(git branch --show-current)" = "feature/0001F-test" ]
}

@test "commit-push: a clean tree still pushes and reports COMMIT=SKIPPED" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --commit-push
  [ "$status" -eq 0 ]
  [[ "$output" == *"COMMIT=SKIPPED"* ]]
  [[ "$output" == *"PUSH_BRANCH=OK"* ]]
}

@test "every mode refuses on main, for the reason that actually fires" {
  setup_remote
  # merge_guards' "Already on $MAIN_BRANCH" check is NOT what stops these. The
  # branch-ID check above it fires first, because `main` carries no [NNNN][L].
  # The existing "merge mode: fails when already on main (no ID)" case names
  # that in its own title. Asserted here as it behaves, not as it reads.
  for mode in --merge --commit-push --cleanup; do
    run "$SCRIPTS_DIR/done.sh" "$mode"
    [ "$status" -eq 1 ]
    [[ "$output" == *"No feature/hotfix ID found"* ]]
  done
}

@test "cleanup: run from the feature branch, it switches to main and deletes it" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  # Simulate a merge that already happened elsewhere: main carries the branch.
  git checkout "main" -q
  git merge --no-edit feature/0001F-test -q
  git push origin HEAD -q
  git checkout feature/0001F-test -q

  # F6 gave --cleanup its two post-merge checks, so it now proves against the
  # merge commit rather than deleting on trust. The argument is that proof.
  run "$SCRIPTS_DIR/done.sh" --cleanup "$(git rev-parse main)"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CLEANUP=OK"* ]]
  [ "$(git branch --show-current)" = "main" ]
  run git rev-parse --verify feature/0001F-test
  [ "$status" -ne 0 ]
}

@test "an unknown flag is NOT a mode — it falls through to context" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --not-a-mode
  [ "$status" -eq 0 ]
  # Context mode's own output, never the merge family's.
  [[ "$output" == *"CHANGED_COUNT="* ]]
  [[ "$output" != *"PUSH_BRANCH=OK"* ]]
}

@test "merge: still emits every key of the whole sequence" {
  setup_remote
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "own" > docs/features/0001F-test/about.md
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  # The composition is proven by the keys, not by reading the source: every
  # stage of the original sequence still reports.
  [[ "$output" == *"COMMIT=OK"* ]]
  [[ "$output" == *"PUSH_BRANCH=OK"* ]]
  [[ "$output" == *"CHECKOUT_MAIN=OK"* ]]
  [[ "$output" == *"PUSH_MAIN=OK"* ]]
  [[ "$output" == *"CLEANUP=OK"* ]]
  [[ "$output" == *"STATUS=SUCCESS"* ]]
}

# ─── Context-mode probes (plan 2026-09-11T014333, F5) ────────────────
# /add.done crosses four facts to pick its route. Computing them in prose is
# how two commands end up disagreeing, so the script emits them and the command
# only routes. gh being absent is a VALUE here, never an error: probing is not
# a gate.

# stub_gh <json-for-pr-view>  — a fake gh on PATH. Empty body = "no PR".
stub_gh() {
  local body="$1"
  STUB_BIN="$TEST_TEMP_DIR/bin"
  mkdir -p "$STUB_BIN"
  {
    echo '#!/bin/bash'
    echo 'case "$1 $2" in'
    echo '  "auth status") exit 0 ;;'
    echo '  "pr view")'
    if [ -z "$body" ]; then
      echo '    exit 1 ;;'
    else
      echo "    echo '$body' ;;"
    fi
    echo '  *) exit 0 ;;'
    echo 'esac'
  } > "$STUB_BIN/gh"
  chmod +x "$STUB_BIN/gh"
  PATH="$STUB_BIN:$PATH"
  export PATH
}

@test "probe: no gh on PATH → PR_STATE=no-gh, and the script still exits 0" {
  git checkout -b feature/0001F-test -q
  STUB_BIN="$TEST_TEMP_DIR/emptybin"; mkdir -p "$STUB_BIN"
  run env PATH="$STUB_BIN:/usr/bin:/bin" "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PR_STATE=no-gh"* ]]
}

@test "probe: an open PR → PR_STATE=open with its url and head sha" {
  git checkout -b feature/0001F-test -q
  stub_gh '{"state":"OPEN","url":"https://example.test/pr/7","headRefOid":"deadbeef","mergeCommit":null}'
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PR_STATE=open"* ]]
  [[ "$output" == *"PR_URL=https://example.test/pr/7"* ]]
  [[ "$output" == *"PR_HEAD_SHA=deadbeef"* ]]
}

@test "probe: a merged PR → PR_STATE=merged with its merge commit" {
  git checkout -b feature/0001F-test -q
  stub_gh '{"state":"MERGED","url":"https://example.test/pr/7","headRefOid":"deadbeef","mergeCommit":{"oid":"cafebabe"}}'
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PR_STATE=merged"* ]]
  [[ "$output" == *"PR_MERGE_COMMIT=cafebabe"* ]]
}

@test "probe: gh present but no PR for this branch → PR_STATE=none" {
  git checkout -b feature/0001F-test -q
  stub_gh ''
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PR_STATE=none"* ]]
}

@test "probe: no delivered.jsonl at all → INDEX_ENTRY=no-index" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"INDEX_ENTRY=no-index"* ]]
}

@test "probe: delivered.jsonl without this id → INDEX_ENTRY=absent" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs
  echo '{"v":1,"id":"0099F","name":"other"}' > docs/delivered.jsonl
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"INDEX_ENTRY=absent"* ]]
}

@test "probe: an UNCOMMITTED entry for this id still reads present" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs
  echo '{"v":1,"id":"0001F","name":"this one"}' > docs/delivered.jsonl
  # Deliberately not committed. This is where the duplicate entry is born: 6.8
  # leaves the line in the working tree and done.sh --merge commits it later, so
  # a check reading only commits cannot see the state it exists to catch.
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"INDEX_ENTRY=present"* ]]
}

@test "probe: MERGED_ON_MAIN=no on a branch main has not taken" {
  setup_remote
  git checkout -b feature/0001F-test -q
  echo x > f.txt; git add f.txt; git commit -m "work" -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MERGED_ON_MAIN=no"* ]]
}

@test "probe: MERGED_ON_MAIN=unknown when origin/main does not resolve" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MERGED_ON_MAIN=unknown"* ]]
}

@test "probe: LEDGER_PATH points at the feature's build-ledger.md" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "# about" > docs/features/0001F-test/about.md
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LEDGER_PATH=docs/features/0001F-test/build-ledger.md"* ]]
}

@test "probe: no ledger → PUBLISH_RECORD=none" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PUBLISH_RECORD=none"* ]]
}

@test "probe: the LAST Publish line wins — the ledger is a log, not a set" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  {
    echo "# Build ledger"
    echo "Publish: declined — local merge"
    echo "T01: complete (commits a..b)"
    echo "Publish: pr-opened https://example.test/pr/9"
  } > docs/features/0001F-test/build-ledger.md
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PUBLISH_RECORD=pr-opened"* ]]
  [[ "$output" == *"PUBLISH_RECORD_URL=https://example.test/pr/9"* ]]
}

@test "probe: a declined record carries no url" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  printf '%s\n' "# Build ledger" "Publish: declined — local merge" > docs/features/0001F-test/build-ledger.md
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PUBLISH_RECORD=declined"* ]]
  [[ "$output" == *"PUBLISH_RECORD_URL="* ]]
}

# guard — the probes are additive. add-wiki-maintenance reads CHANGED_FILES
# from this same output, so a field removed or renamed here breaks a consumer
# no test in this file names.
@test "probe: every pre-existing context field still reports" {
  setup_remote
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  for key in CURRENT_BRANCH MAIN_BRANCH BRANCH_TYPE FEATURE_NUMBER MODIFIED_COUNT \
             STAGED_COUNT UNTRACKED_COUNT HAS_UNCOMMITTED CHANGED_COUNT CHANGED_FILES; do
    [[ "$output" == *"$key="* ]] || [[ "$output" == *"$key=["* ]]
  done
}

# ─── Post-merge proof + push dry-run (plan 2026-09-11T014333, F6) ────
# Nothing here rolls back a merge. By --cleanup the work has landed, so a
# refused deletion is reported and skipped, and the script still exits 0.

@test "dry-run: an unpushable main stops BEFORE any local merge commit exists" {
  setup_remote
  git checkout -b feature/0001F-test -q
  echo x > f.txt; git add f.txt; git commit -m "work" -q
  git push -u origin feature/0001F-test -q
  MAIN_SHA_BEFORE=$(git rev-parse main)

  # main's remote ref advances behind our back, so a push of main would be a
  # non-fast-forward. This is what a client-side dry-run CAN see.
  CLONE="$TEST_TEMP_DIR/other"
  git clone -q "$TEST_TEMP_DIR/remote" "$CLONE"
  git -C "$CLONE" config user.email t@t.t
  git -C "$CLONE" config user.name t
  # The bare remote's HEAD points at a branch it never got, so the clone lands
  # with no local main. Create it from the ref that does exist.
  git -C "$CLONE" checkout -B main origin/main -q
  git -C "$CLONE" commit --allow-empty -m "someone else" -q
  git -C "$CLONE" push origin main -q

  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -ne 0 ]
  [[ "$output" == *"PUSH_MAIN=REFUSED"* ]]
  # The point: nothing local was written. Without the dry-run the refusal
  # arrives after the merge commit exists, leaving main ahead of origin with
  # nothing in the pipeline describing that state.
  [ "$(git rev-parse main)" = "$MAIN_SHA_BEFORE" ]
}

# KNOWN LIMIT, pinned so nobody later believes otherwise. `git push --dry-run`
# is client-side: it never reaches the remote's pre-receive hook, which is where
# GitHub enforces branch protection. A protected main therefore passes the
# dry-run and fails the real push.
#
# This is not a hole the dry-run should grow to cover. When main is protected the
# right answer is the PR route, and /add.done takes it whenever a PR exists —
# the routing is the protection, not this check.
@test "dry-run: a server-side pre-receive hook is NOT what this catches" {
  setup_remote
  git checkout -b feature/0001F-test -q
  echo x > f.txt; git add f.txt; git commit -m "work" -q
  git push -u origin feature/0001F-test -q

  HOOK="$TEST_TEMP_DIR/remote/hooks/pre-receive"
  mkdir -p "$(dirname "$HOOK")"
  {
    echo '#!/bin/bash'
    echo 'while read -r _old _new ref; do'
    echo '  case "$ref" in refs/heads/main) echo "protected branch" >&2; exit 1 ;; esac'
    echo 'done'
    echo 'exit 0'
  } > "$HOOK"
  chmod +x "$HOOK"

  run "$SCRIPTS_DIR/done.sh" --merge
  # The dry-run reports main pushable, because the hook never ran for it.
  [[ "$output" == *"PUSH_MAIN=PUSHABLE"* ]]
}

@test "cleanup: a fetch that fails refuses every deletion and still exits 0" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  git checkout main -q
  git merge --no-edit feature/0001F-test -q
  git push origin HEAD -q
  MERGE_SHA=$(git rev-parse HEAD)
  git checkout feature/0001F-test -q
  git remote set-url origin "$TEST_TEMP_DIR/nowhere.git"

  run "$SCRIPTS_DIR/done.sh" --cleanup "$MERGE_SHA"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CLEANUP=SKIPPED"* ]]
  [[ "$output" == *"CHECK=1"* ]]
  # The branch survives. A deletion run against an unfetched ref is the failure
  # this check exists for.
  run git rev-parse --verify feature/0001F-test
  [ "$status" -eq 0 ]
}

@test "cleanup: a merge sha origin/main does not contain refuses every deletion" {
  setup_remote
  git checkout -b feature/0001F-test -q
  echo x > f.txt; git add f.txt; git commit -m "work" -q
  git push -u origin feature/0001F-test -q
  # A sha that exists but is NOT on origin/main.
  UNMERGED_SHA=$(git rev-parse HEAD)

  run "$SCRIPTS_DIR/done.sh" --cleanup "$UNMERGED_SHA"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CLEANUP=SKIPPED"* ]]
  [[ "$output" == *"CHECK=2"* ]]
  run git rev-parse --verify feature/0001F-test
  [ "$status" -eq 0 ]
}

@test "cleanup: both checks passing deletes the branch" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  git checkout main -q
  git merge --no-edit feature/0001F-test -q
  git push origin HEAD -q
  MERGE_SHA=$(git rev-parse HEAD)
  git checkout feature/0001F-test -q

  run "$SCRIPTS_DIR/done.sh" --cleanup "$MERGE_SHA"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CLEANUP=OK"* ]]
  run git rev-parse --verify feature/0001F-test
  [ "$status" -ne 0 ]
}

@test "cleanup: no resolvable merge sha refuses the deletions rather than guessing" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  # No argument, no gh, nothing to resolve a merge commit from.
  STUB_BIN="$TEST_TEMP_DIR/emptybin"; mkdir -p "$STUB_BIN"
  run env PATH="$STUB_BIN:/usr/bin:/bin" "$SCRIPTS_DIR/done.sh" --cleanup
  [ "$status" -eq 0 ]
  [[ "$output" == *"CLEANUP=SKIPPED"* ]]
  run git rev-parse --verify feature/0001F-test
  [ "$status" -eq 0 ]
}
