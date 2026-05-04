#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Branch detection ───────────────────────────────────────────────

@test "outputs BRANCH with type main" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:main TYPE:main MAIN:main"* ]]
}

@test "detects feature branch" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:feature"* ]]
}

@test "detects fix branch" {
  git checkout -b fix/0001H-bugfix -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:fix"* ]]
}

@test "detects docs branch" {
  git checkout -b docs/0001D-readme -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:docs"* ]]
}

# ─── Phase detection ────────────────────────────────────────────────

@test "phase=created when feature dir exists but is empty" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:created"* ]]
}

@test "phase=documented when about.md has real content" {
  mkdir -p docs/features/0001F-test
  echo "# Feature 0001F" > docs/features/0001F-test/about.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:documented"* ]]
}

@test "phase=planned quando plan.md existe" {
  mkdir -p docs/features/0001F-test
  echo "# Plan" > docs/features/0001F-test/plan.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:planned"* ]]
}

@test "phase=done quando changelog.md existe" {
  mkdir -p docs/features/0001F-test
  echo "# Changelog" > docs/features/0001F-test/changelog.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:done"* ]]
}

# ─── Feature docs listing ───────────────────────────────────────────

@test "lists existing feature docs" {
  mkdir -p docs/features/0001F-test
  echo "a" > docs/features/0001F-test/about.md
  echo "p" > docs/features/0001F-test/plan.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"DOCS:about.md,plan.md"* ]]
}

# ─── Owner detection ────────────────────────────────────────────────

@test "detects complete owner (name|level|language)" {
  mkdir -p docs
  printf 'Nome: Maicon\nNivel: avancado\nIdioma: pt-br\n' > docs/owner.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Maicon|advanced|pt-br"* ]]
}

@test "owner uses defaults for missing fields" {
  mkdir -p docs
  printf 'Nome: Ana\n' > docs/owner.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Ana|intermediate|en-us"* ]]
}

# ─── Recommendations ────────────────────────────────────────────────

@test "recommends /feature when on main" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:/feature to start"* ]]
}

@test "recommends /add-dev when phase=planned" {
  mkdir -p docs/features/0001F-test
  echo "# Plan" > docs/features/0001F-test/plan.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:/add-dev to implement"* ]]
}

# ─── Git status ──────────────────────────────────────────────────────

@test "shows GIT status when there are modified files" {
  echo "new file" > test.txt
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GIT:"* ]]
}

# ─── Feature not found ──────────────────────────────────────────────

@test "reports feature dir not found when docs do not exist" {
  git checkout -b feature/9999F-missing -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE:9999F-missing PHASE:none"* ]]
  [[ "$output" == *"not found"* ]]
}

# ─── Exit clean ─────────────────────────────────────────────────────

@test "always exits with 0" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
}

# ─── Phase extended ──────────────────────────────────────────────────

@test "phase=designed quando design.md existe" {
  mkdir -p docs/features/0001F-test
  echo "# Design" > docs/features/0001F-test/design.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:designed"* ]]
}

@test "phase=discovering when discovery.md exists without Summary for Planning section" {
  mkdir -p docs/features/0001F-test
  echo "# Discovery - work in progress" > docs/features/0001F-test/discovery.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:discovering"* ]]
}

@test "phase=discovered when discovery.md contains '## Summary for Planning'" {
  mkdir -p docs/features/0001F-test
  printf '# Discovery\n\n## Summary for Planning\n{"key":"value"}\n' > docs/features/0001F-test/discovery.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:discovered"* ]]
}

# ─── iterations.jsonl ────────────────────────────────────────────────

@test "shows ITERATIONS when iterations.jsonl exists with entries" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '{"ts":"2026-01-01","type":"fix","slug":"btn","what":"fix button"}\n' >> docs/features/0001F-test/iterations.jsonl
  printf '{"ts":"2026-01-02","type":"add","slug":"form","what":"add form"}\n' >> docs/features/0001F-test/iterations.jsonl
  printf '{"ts":"2026-01-03","type":"enhance","slug":"modal","what":"improve modal"}\n' >> docs/features/0001F-test/iterations.jsonl
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ITERATIONS:3"* ]]
  [[ "$output" == *"LAST_ITERS:"* ]]
  [[ "$output" == *"ITERATIONS_FILE:"* ]]
}

# ─── Epic from plan.md ───────────────────────────────────────────────

@test "detects epic when plan.md has '### Feature N:' sections" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '# Plan\n\n## Epic: auth-system\n\n### Feature 1: Login\n### Feature 2: Signup\n### Feature 3: Logout\n' \
    > docs/features/0001F-test/plan.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EPIC:auth-system"* ]]
  [[ "$output" == *"FEATURES:0/3"* ]]
  [[ "$output" == *"NEXT:1"* ]]
}

@test "epic: shows all_complete when all features are complete" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '# Plan\n\n### Feature 1: Login\n### Feature 2: Signup\n' \
    > docs/features/0001F-test/plan.md
  # Marks features as complete via iterations.jsonl
  printf '{"ts":"2026-01-01","type":"add","slug":"feature-1-complete","what":"done"}\n' >> docs/features/0001F-test/iterations.jsonl
  printf '{"ts":"2026-01-02","type":"add","slug":"feature-2-complete","what":"done"}\n' >> docs/features/0001F-test/iterations.jsonl
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATUS:all_complete"* ]]
}

# ─── epic.md (PRD0032) ───────────────────────────────────────────────

@test "detects epic.md and reports subfeature progress" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '| SF01 | Login | done |\n| SF02 | Signup | in_progress |\n| SF03 | Logout | pending |\n' \
    > docs/features/0001F-test/epic.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_EPIC:true"* ]]
  [[ "$output" == *"EPIC_PROGRESS:"* ]]
  [[ "$output" == *"EPIC_CURRENT_SF:"* ]]
}

# ─── tasks.md ────────────────────────────────────────────────────────

@test "shows tasks.md progress when present (no epic)" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '| 1.1 | Task one | ✅ |\n| 1.2 | Task two | ✅ |\n| 1.3 | Task three | pending |\n' \
    > docs/features/0001F-test/tasks.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_TASKS:true"* ]]
  [[ "$output" == *"TASKS_PROGRESS:2/3"* ]]
}

# ─── Summaries ───────────────────────────────────────────────────────

@test "shows ABOUT_SUMMARY when about.md has ## Summary section with JSON" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '# About 0001F\n\n## Summary\n{"purpose":"test feature","scope":"minimal"}\n' \
    > docs/features/0001F-test/about.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ABOUT_SUMMARY:"* ]]
}

# ─── RECENT_CHANGELOGS ───────────────────────────────────────────────

@test "shows RECENT_CHANGELOGS when there are completed features" {
  # On main branch (no current FEATURE_ID)
  mkdir -p docs/features/0001F-login
  printf '# 0001F Login\n\n## Summary\nUser authentication implemented\n' \
    > docs/features/0001F-login/changelog.md
  mkdir -p docs/features/0002F-signup
  printf '# 0002F Signup\n\n## Summary\nUser registration flow\n' \
    > docs/features/0002F-signup/changelog.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"RECENT_CHANGELOGS:"* ]]
  [[ "$output" == *"0001F-login"* ]]
}

# ─── Git checkpoint tag ──────────────────────────────────────────────

@test "shows LAST_CHECKPOINT when checkpoint tag exists" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  git tag "checkpoint/0001F-test-v1-done"
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LAST_CHECKPOINT:checkpoint/0001F-test-v1-done"* ]]
}
