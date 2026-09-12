#!/usr/bin/env bats
# review-package.sh — writes the scoped diff a reviewer is dispatched against
# (plan 0078-PLAN--superpowers-adoption-002-durable-executor, F3). RED-FIRST:
# the script under test does not exist yet — every test below is expected to
# fail until F3 lands. That failure IS the point.
#
# Contract under test:
#   Usage: bash review-package.sh <BASE> <HEAD> <OUT_DIR>
#   - Writes `git log --oneline`, `git diff --stat` and `git diff -U10` for
#     BASE..HEAD into ONE file. Prints PACKAGE=<path> (plus COMMITS, FILES).
#   - Creates OUT_DIR and, when absent, a `.gitignore` containing `*` (F4).
#   - REFUSES AN EMPTY RANGE with exit 2, before writing anything. An empty
#     package is how a reviewer gets dispatched against nothing and returns
#     "looks fine" — the single failure this script exists to prevent.
#   - exit 0 on success, exit 2 ONLY on CLI misuse (arity, unresolvable ref,
#     not a git repository, empty range).

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

OUT="docs/features/0003F-signup/_build"

# make_commits — three commits on top of the init commit. src/wide.ts is 25
# lines so a -U10 diff reaches 10 lines above the change and a -U3 diff does not.
make_commits() {
  mkdir -p src
  i=1
  while [ "$i" -le 25 ]; do printf 'line-%02d\n' "$i" >> src/wide.ts; i=$((i + 1)); done
  git add -A && git commit -qm "feat(db): add users table"

  printf 'export const a = 1;\n' > src/a.ts
  git add -A && git commit -qm "feat(api): add signup endpoint"

  sed -i.bak 's/^line-15$/line-15-CHANGED/' src/wide.ts && rm -f src/wide.ts.bak
  git add -A && git commit -qm "fix(api): guard null email"
}

package_path() {
  printf '%s\n' "$output" | grep '^PACKAGE=' | sed 's/^PACKAGE=//'
}

# ─── L2.3 — all three sections present ───────────────────────────────────────

@test "L2.3: the package carries the log, the stat and the diff" {
  make_commits
  BASE=$(git rev-parse HEAD~2)
  HEAD=$(git rev-parse HEAD)
  run bash "$SCRIPTS_DIR/review-package.sh" "$BASE" "$HEAD" "$OUT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PACKAGE="* ]]
  PKG="$(package_path)"
  [ -f "$PKG" ]
  # 1. git log --oneline — both commit subjects in the range
  grep -q 'feat(api): add signup endpoint' "$PKG"
  grep -q 'fix(api): guard null email' "$PKG"
  # the commit BEFORE the range is not in it
  [ "$(grep -c 'feat(db): add users table' "$PKG")" -eq 0 ]
  # 2. git diff --stat — the summary line
  grep -qE '[0-9]+ files? changed' "$PKG"
  # 3. git diff — the real patch
  grep -q 'diff --git' "$PKG"
  grep -q '+export const a = 1;' "$PKG"
  grep -q '+line-15-CHANGED' "$PKG"
}

@test "L2.3: the diff is -U10, not the default -U3" {
  make_commits
  BASE=$(git rev-parse HEAD~1)
  HEAD=$(git rev-parse HEAD)
  run bash "$SCRIPTS_DIR/review-package.sh" "$BASE" "$HEAD" "$OUT"
  [ "$status" -eq 0 ]
  PKG="$(package_path)"
  # line-15 changed: 10 lines of context reaches line-05, 3 lines does not
  grep -q 'line-05' "$PKG"
}

@test "L2.3: COMMITS and FILES report the range's size" {
  make_commits
  BASE=$(git rev-parse HEAD~2)
  HEAD=$(git rev-parse HEAD)
  run bash "$SCRIPTS_DIR/review-package.sh" "$BASE" "$HEAD" "$OUT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"COMMITS=2"* ]]
  [[ "$output" == *"FILES=2"* ]]
}

@test "L2.3: the package names the range it covers" {
  make_commits
  BASE=$(git rev-parse HEAD~2)
  HEAD=$(git rev-parse HEAD)
  run bash "$SCRIPTS_DIR/review-package.sh" "$BASE" "$HEAD" "$OUT"
  [ "$status" -eq 0 ]
  PKG="$(package_path)"
  grep -q "$(git rev-parse --short "$BASE")" "$PKG"
  grep -q "$(git rev-parse --short "$HEAD")" "$PKG"
}

@test "L2.3: short refs and symbolic refs both resolve" {
  make_commits
  run bash "$SCRIPTS_DIR/review-package.sh" "HEAD~2" "HEAD" "$OUT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"COMMITS=2"* ]]
}

# ─── L2.3 — the empty range is refused ───────────────────────────────────────

@test "L2.3: BASE == HEAD is an empty range → exit 2" {
  make_commits
  HEAD=$(git rev-parse HEAD)
  run bash "$SCRIPTS_DIR/review-package.sh" "$HEAD" "$HEAD" "$OUT"
  [ "$status" -eq 2 ]
}

@test "L2.3: an empty range writes NO package — a reviewer cannot be handed one" {
  make_commits
  HEAD=$(git rev-parse HEAD)
  run bash "$SCRIPTS_DIR/review-package.sh" "$HEAD" "$HEAD" "$OUT"
  [ "$status" -eq 2 ]
  [[ "$output" != *"PACKAGE="* ]]
  [ "$(ls "$OUT" 2>/dev/null | grep -c 'review-package' || true)" -eq 0 ]
}

@test "L2.3: a range whose only commit is empty still packages — the log is content" {
  make_commits
  BASE=$(git rev-parse HEAD)
  git commit -q --allow-empty -m "chore: empty marker"
  run bash "$SCRIPTS_DIR/review-package.sh" "$BASE" "HEAD" "$OUT"
  [ "$status" -eq 0 ]
  PKG="$(package_path)"
  grep -q 'chore: empty marker' "$PKG"
}

# ─── F4 — the scratch contract ───────────────────────────────────────────────

@test "F4: OUT_DIR is created with a .gitignore containing *" {
  make_commits
  run bash "$SCRIPTS_DIR/review-package.sh" "HEAD~2" "HEAD" "$OUT"
  [ "$status" -eq 0 ]
  [ -f "$OUT/.gitignore" ]
  [ "$(cat "$OUT/.gitignore")" = "*" ]
}

@test "F4: the package never reaches git status" {
  make_commits
  run bash "$SCRIPTS_DIR/review-package.sh" "HEAD~2" "HEAD" "$OUT"
  [ "$status" -eq 0 ]
  run git status --porcelain
  [ "$output" = "" ]
}

# ─── CLI misuse — exit 2 ─────────────────────────────────────────────────────

@test "misuse: no arguments → exit 2" {
  run bash "$SCRIPTS_DIR/review-package.sh"
  [ "$status" -eq 2 ]
}

@test "misuse: two arguments → exit 2" {
  make_commits
  run bash "$SCRIPTS_DIR/review-package.sh" "HEAD~1" "HEAD"
  [ "$status" -eq 2 ]
}

@test "misuse: an empty BASE → exit 2" {
  make_commits
  run bash "$SCRIPTS_DIR/review-package.sh" "" "HEAD" "$OUT"
  [ "$status" -eq 2 ]
}

@test "misuse: an unresolvable BASE → exit 2" {
  make_commits
  run bash "$SCRIPTS_DIR/review-package.sh" "deadbeefdeadbeef" "HEAD" "$OUT"
  [ "$status" -eq 2 ]
}

@test "misuse: an unresolvable HEAD → exit 2" {
  make_commits
  run bash "$SCRIPTS_DIR/review-package.sh" "HEAD~1" "no-such-branch" "$OUT"
  [ "$status" -eq 2 ]
}

@test "misuse: outside a git repository → exit 2" {
  cd "$TEST_TEMP_DIR"
  mkdir -p not-a-repo && cd not-a-repo
  run bash "$SCRIPTS_DIR/review-package.sh" "HEAD~1" "HEAD" "$OUT"
  [ "$status" -eq 2 ]
}

@test "misuse prints a usage or error line, never a PACKAGE= line" {
  run bash "$SCRIPTS_DIR/review-package.sh" "HEAD~1" "HEAD"
  [ "$status" -eq 2 ]
  [[ "$output" == *"Usage:"* ]]
  [[ "$output" != *"PACKAGE="* ]]
}
