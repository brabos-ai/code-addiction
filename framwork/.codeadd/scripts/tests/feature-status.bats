#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Branch detection ───────────────────────────────────────────────

@test "output BRANCH com tipo main" {
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:main TYPE:main MAIN:main"* ]]
}

@test "detecta branch feature" {
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:feature"* ]]
}

@test "detecta branch fix" {
  git checkout -b fix/F0001-bugfix -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:fix"* ]]
}

@test "detecta branch docs" {
  git checkout -b docs/readme -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:docs"* ]]
}

# ─── Phase detection ────────────────────────────────────────────────

@test "phase=created quando feature dir existe mas está vazio" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:created"* ]]
}

@test "phase=documented quando about.md tem conteúdo real" {
  mkdir -p docs/features/F0001-test
  echo "# Feature F0001" > docs/features/F0001-test/about.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:documented"* ]]
}

@test "phase=planned quando plan.md existe" {
  mkdir -p docs/features/F0001-test
  echo "# Plan" > docs/features/F0001-test/plan.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:planned"* ]]
}

@test "phase=done quando changelog.md existe" {
  mkdir -p docs/features/F0001-test
  echo "# Changelog" > docs/features/F0001-test/changelog.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:done"* ]]
}

# ─── Feature docs listing ───────────────────────────────────────────

@test "lista docs existentes da feature" {
  mkdir -p docs/features/F0001-test
  echo "a" > docs/features/F0001-test/about.md
  echo "p" > docs/features/F0001-test/plan.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"DOCS:about.md,plan.md"* ]]
}

# ─── Owner detection ────────────────────────────────────────────────

@test "detecta owner completo (nome|nivel|idioma)" {
  mkdir -p docs
  printf 'Nome: Maicon\nNivel: avancado\nIdioma: pt-br\n' > docs/owner.md
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Maicon|avancado|pt-br"* ]]
}

@test "owner usa defaults para campos faltando" {
  mkdir -p docs
  printf 'Nome: Ana\n' > docs/owner.md
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Ana|intermediario|en-us"* ]]
}

# ─── Recommendations ────────────────────────────────────────────────

@test "recomenda /feature quando em main" {
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:/feature to start"* ]]
}

@test "recomenda /add-dev quando phase=planned" {
  mkdir -p docs/features/F0001-test
  echo "# Plan" > docs/features/F0001-test/plan.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:/add-dev to implement"* ]]
}

# ─── Git status ──────────────────────────────────────────────────────

@test "mostra GIT status quando há arquivos modificados" {
  echo "new file" > test.txt
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GIT:"* ]]
}

# ─── Feature not found ──────────────────────────────────────────────

@test "reporta feature dir not found quando docs não existem" {
  git checkout -b feature/F9999-missing -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE:F9999-missing PHASE:none"* ]]
  [[ "$output" == *"not found"* ]]
}

# ─── Exit clean ─────────────────────────────────────────────────────

@test "exit 0 sempre" {
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
}

# ─── Phase extended ──────────────────────────────────────────────────

@test "phase=designed quando design.md existe" {
  mkdir -p docs/features/F0001-test
  echo "# Design" > docs/features/F0001-test/design.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:designed"* ]]
}

@test "phase=discovering quando discovery.md existe sem seção Summary for Planning" {
  mkdir -p docs/features/F0001-test
  echo "# Discovery - work in progress" > docs/features/F0001-test/discovery.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:discovering"* ]]
}

@test "phase=discovered quando discovery.md contém '## Summary for Planning'" {
  mkdir -p docs/features/F0001-test
  printf '# Discovery\n\n## Summary for Planning\n{"key":"value"}\n' > docs/features/F0001-test/discovery.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:discovered"* ]]
}

# ─── iterations.jsonl ────────────────────────────────────────────────

@test "exibe ITERATIONS quando iterations.jsonl existe com entradas" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  printf '{"ts":"2026-01-01","type":"fix","slug":"btn","what":"fix button"}\n' >> docs/features/F0001-test/iterations.jsonl
  printf '{"ts":"2026-01-02","type":"add","slug":"form","what":"add form"}\n' >> docs/features/F0001-test/iterations.jsonl
  printf '{"ts":"2026-01-03","type":"enhance","slug":"modal","what":"improve modal"}\n' >> docs/features/F0001-test/iterations.jsonl
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ITERATIONS:3"* ]]
  [[ "$output" == *"LAST_ITERS:"* ]]
  [[ "$output" == *"ITERATIONS_FILE:"* ]]
}

# ─── Epic from plan.md ───────────────────────────────────────────────

@test "detecta epic quando plan.md tem '### Feature N:' sections" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  printf '# Plan\n\n## Epic: auth-system\n\n### Feature 1: Login\n### Feature 2: Signup\n### Feature 3: Logout\n' \
    > docs/features/F0001-test/plan.md
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EPIC:auth-system"* ]]
  [[ "$output" == *"FEATURES:0/3"* ]]
  [[ "$output" == *"NEXT:1"* ]]
}

@test "epic: exibe all_complete quando todas as features estão completas" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  printf '# Plan\n\n### Feature 1: Login\n### Feature 2: Signup\n' \
    > docs/features/F0001-test/plan.md
  # Marca as features como completas via iterations.jsonl
  printf '{"ts":"2026-01-01","type":"add","slug":"feature-1-complete","what":"done"}\n' >> docs/features/F0001-test/iterations.jsonl
  printf '{"ts":"2026-01-02","type":"add","slug":"feature-2-complete","what":"done"}\n' >> docs/features/F0001-test/iterations.jsonl
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATUS:all_complete"* ]]
}

# ─── epic.md (PRD0032) ───────────────────────────────────────────────

@test "detecta epic.md e reporta progresso de subfeatures" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  printf '| SF01 | Login | done |\n| SF02 | Signup | in_progress |\n| SF03 | Logout | pending |\n' \
    > docs/features/F0001-test/epic.md
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_EPIC:true"* ]]
  [[ "$output" == *"EPIC_PROGRESS:"* ]]
  [[ "$output" == *"EPIC_CURRENT_SF:"* ]]
}

# ─── tasks.md ────────────────────────────────────────────────────────

@test "exibe progresso de tasks.md quando presente (sem epic)" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  printf '| 1.1 | Task one | ✅ |\n| 1.2 | Task two | ✅ |\n| 1.3 | Task three | pending |\n' \
    > docs/features/F0001-test/tasks.md
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_TASKS:true"* ]]
  [[ "$output" == *"TASKS_PROGRESS:2/3"* ]]
}

# ─── Summaries ───────────────────────────────────────────────────────

@test "exibe ABOUT_SUMMARY quando about.md tem seção ## Summary com JSON" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  printf '# About F0001\n\n## Summary\n{"purpose":"test feature","scope":"minimal"}\n' \
    > docs/features/F0001-test/about.md
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ABOUT_SUMMARY:"* ]]
}

# ─── RECENT_CHANGELOGS ───────────────────────────────────────────────

@test "exibe RECENT_CHANGELOGS quando há features finalizadas" {
  # Em main branch (sem FEATURE_ID atual)
  mkdir -p docs/features/F0001-login
  printf '# F0001 Login\n\n## Summary\nUser authentication implemented\n' \
    > docs/features/F0001-login/changelog.md
  mkdir -p docs/features/F0002-signup
  printf '# F0002 Signup\n\n## Summary\nUser registration flow\n' \
    > docs/features/F0002-signup/changelog.md
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"RECENT_CHANGELOGS:"* ]]
  [[ "$output" == *"F0001-login"* ]]
}

# ─── Git checkpoint tag ──────────────────────────────────────────────

@test "exibe LAST_CHECKPOINT quando tag de checkpoint existe" {
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
  git tag "checkpoint/F0001-test-v1-done"
  run "$SCRIPTS_DIR/feature-status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LAST_CHECKPOINT:checkpoint/F0001-test-v1-done"* ]]
}
