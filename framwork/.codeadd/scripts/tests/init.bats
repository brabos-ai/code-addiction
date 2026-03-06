#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Owner detection ────────────────────────────────────────────────

@test "detecta owner completo de docs/owner.md (nome|nivel|idioma)" {
  mkdir -p docs
  printf 'Nome: Maicon\nNivel: avancado\nIdioma: pt-br\n' > docs/owner.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Maicon|avancado|pt-br"* ]]
}

@test "usa defaults quando owner.md nao existe" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:unknown|intermediario|en-us"* ]]
}

@test "usa defaults parciais quando owner.md tem campos faltando" {
  mkdir -p docs
  printf 'Nome: Ana\n' > docs/owner.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Ana|intermediario|en-us"* ]]
}

# ─── Git info ────────────────────────────────────────────────────────

@test "detecta branch main e type=main" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GIT:branch=main type=main"* ]]
}

@test "detecta branch feature e type=feature" {
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"type=feature"* ]]
}

@test "detecta branch hotfix e type=hotfix" {
  git checkout -b hotfix/urgent -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"type=hotfix"* ]]
}

# ─── Features discovery ─────────────────────────────────────────────

@test "cria docs/features se não existe e retorna count=0 next=F0001" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURES:count=0 next=F0001"* ]]
  [ -d "docs/features" ]
}

@test "conta features existentes e calcula next corretamente" {
  mkdir -p docs/features/F0001-login
  mkdir -p docs/features/F0002-signup
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURES:count=2 next=F0003"* ]]
}

@test "detecta current feature quando em branch feature" {
  mkdir -p docs/features/F0001-test
  echo "# About" > docs/features/F0001-test/about.md
  echo "# Plan" > docs/features/F0001-test/plan.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CURRENT:F0001-test docs=[about.md,plan.md]"* ]]
}

# ─── Architecture detection ─────────────────────────────────────────

@test "detecta CLAUDE.md quando existe" {
  echo "# Claude" > CLAUDE.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ARCH:CLAUDE.md"* ]]
}

@test "reporta ARCH:none quando CLAUDE.md não existe" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ARCH:none"* ]]
}

# ─── Stack detection ────────────────────────────────────────────────

@test "detecta stack do package.json" {
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

@test "recomenda /feature quando em main" {
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:create feature branch with /feature"* ]]
}

@test "recomenda continue discovery quando em feature branch com docs" {
  mkdir -p docs/features/F0001-test
  echo "# About" > docs/features/F0001-test/about.md
  git checkout -b feature/F0001-test -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:continue discovery for F0001-test"* ]]
}

# ─── Detached HEAD ──────────────────────────────────────────────────

@test "lida com detached HEAD sem falhar" {
  git checkout --detach -q
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GIT:branch=detached-HEAD"* ]]
}

# ─── RECENT_CHANGELOGS ──────────────────────────────────────────────

@test "exibe RECENT_CHANGELOGS quando há features com changelog.md" {
  mkdir -p docs/features/F0001-done
  printf '# F0001\n\n## Resumo\nFeature completed successfully\n' \
    > docs/features/F0001-done/changelog.md
  mkdir -p docs/features/F0002-done
  printf '# F0002\n\n## Resumo\nSecond feature completed\n' \
    > docs/features/F0002-done/changelog.md
  run "$SCRIPTS_DIR/init.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"RECENT_CHANGELOGS:"* ]]
  [[ "$output" == *"F0001-done"* ]]
}
