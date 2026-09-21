#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Git info ────────────────────────────────────────────────────────

@test "detects main branch and type=main" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GIT:branch=main type=main"* ]]
}

@test "detects feature branch and type=feature" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"type=feature"* ]]
}

@test "detects hotfix branch and type=hotfix" {
  git checkout -b hotfix/0001H-urgent -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"type=hotfix"* ]]
}

# ─── Features discovery ─────────────────────────────────────────────

@test "creates docs/features if it does not exist and returns count=0 next=0001F" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURES:count=0 next=0001F"* ]]
  [ -d "docs/features" ]
}

@test "counts existing features and calculates next correctly" {
  mkdir -p docs/features/0001F-login
  mkdir -p docs/features/0002F-signup
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURES:count=2 next=0003F"* ]]
}

@test "detects current feature when on feature branch" {
  mkdir -p docs/features/0001F-test
  echo "# About" > docs/features/0001F-test/about.md
  echo "# Plan" > docs/features/0001F-test/plan.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CURRENT:0001F-test docs=[about.md,plan.md]"* ]]
}

# ─── Architecture detection ─────────────────────────────────────────

@test "detects AGENTS.md when it exists" {
  echo "# Agents" > AGENTS.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ARCH:AGENTS.md"* ]]
}

@test "reports ARCH:none when AGENTS.md does not exist" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ARCH:none"* ]]
}

@test "a CLAUDE.md alone is not the context file: ARCH:none plus LEGACY_CONTEXT" {
  echo "# Claude" > CLAUDE.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ARCH:none"* ]]
  [[ "$output" == *"LEGACY_CONTEXT:CLAUDE.md"* ]]
}

@test "LEGACY_CONTEXT lists every legacy file present, in order" {
  mkdir -p .claude
  echo "a" > CLAUDE.md
  echo "b" > .claude/CLAUDE.md
  echo "c" > GEMINI.md
  echo "d" > AGENTS.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ARCH:AGENTS.md"* ]]
  [[ "$output" == *"LEGACY_CONTEXT:CLAUDE.md,.claude/CLAUDE.md,GEMINI.md"* ]]
}

@test "no legacy file means no LEGACY_CONTEXT line at all" {
  echo "# Agents" > AGENTS.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" != *"LEGACY_CONTEXT"* ]]
}

# ─── Stack detection ────────────────────────────────────────────────

@test "detects stack from package.json" {
  cat > package.json << 'EOF'
{
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "express": "^4.0.0"
  }
}
EOF
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STACK:"* ]]
  [[ "$output" == *"nestjs"* ]]
  [[ "$output" == *"express"* ]]
}

# ─── Recommendation ─────────────────────────────────────────────────

@test "recommends /add-feature when on main" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:create feature branch with /add-feature"* ]]
}

@test "recommends continue work when on feature branch with docs" {
  mkdir -p docs/features/0001F-test
  echo "# About" > docs/features/0001F-test/about.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:continue work on 0001F-test"* ]]
}

# ─── Detached HEAD ──────────────────────────────────────────────────

@test "handles detached HEAD without failing" {
  git checkout --detach -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GIT:branch=(detached)"* ]]
}

# ─── RECENT_CHANGELOGS ──────────────────────────────────────────────

@test "shows RECENT_CHANGELOGS when there are features with changelog.md" {
  mkdir -p docs/features/0001F-done
  printf '# 0001F\n\n## Resumo\nFeature completed successfully\n' \
    > docs/features/0001F-done/changelog.md
  mkdir -p docs/features/0002F-done
  printf '# 0002F\n\n## Resumo\nSecond feature completed\n' \
    > docs/features/0002F-done/changelog.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"RECENT_CHANGELOGS:"* ]]
  [[ "$output" == *"0001F-done"* ]]
}

# ─── Read-only invariant ────────────────────────────────────────────

@test "performs no git write operations (branch/HEAD/refs/tree unchanged)" {
  local head_before branch_before refs_before status_before
  head_before=$(git rev-parse HEAD)
  branch_before=$(git branch --show-current)
  refs_before=$(git show-ref | sort)
  status_before=$(git status --porcelain)

  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]

  [ "$(git rev-parse HEAD)" = "$head_before" ]
  [ "$(git branch --show-current)" = "$branch_before" ]
  [ "$(git show-ref | sort)" = "$refs_before" ]
  [ "$(git status --porcelain)" = "$status_before" ]
}
