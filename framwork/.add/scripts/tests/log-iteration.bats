#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
  # Criar estrutura de feature
  mkdir -p docs/features/F0001-test
  git checkout -b feature/F0001-test -q
}

teardown() {
  common_teardown
}

# ─── Sucesso ─────────────────────────────────────────────────────────

@test "cria iterations.md e loga primeira iteração" {
  run "$SCRIPTS_DIR/log-iteration.sh" fix save-btn "fix validation" "api/ctrl.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I1"* ]]
  [[ "$output" == *"FEATURE:F0001-test"* ]]
  [ -f "docs/features/F0001-test/iterations.md" ]
}

@test "incrementa número de iteração" {
  "$SCRIPTS_DIR/log-iteration.sh" fix first "first fix" "a.ts"
  run "$SCRIPTS_DIR/log-iteration.sh" add second "second add" "b.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I2"* ]]
}

@test "grava conteúdo correto no arquivo" {
  "$SCRIPTS_DIR/log-iteration.sh" fix save-btn "fix validation" "api/ctrl.ts"
  local content
  content=$(cat docs/features/F0001-test/iterations.md)
  [[ "$content" == *"## I1|"* ]]
  [[ "$content" == *"|/dev|fix"* ]]
  [[ "$content" == *"save-btn|fix validation|api/ctrl.ts"* ]]
}

@test "aceita comando customizado como 5o argumento" {
  run "$SCRIPTS_DIR/log-iteration.sh" add feat "new feat" "src.ts" "/hotfix"
  [ "$status" -eq 0 ]
  local content
  content=$(cat docs/features/F0001-test/iterations.md)
  [[ "$content" == *"|/hotfix|add"* ]]
}

# ─── Feature flag (epic) ────────────────────────────────────────────

@test "marca feature como completa com --feature N" {
  run "$SCRIPTS_DIR/log-iteration.sh" add signup "feature 1" "api.ts" "/dev" "--feature" "1"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_COMPLETE:1"* ]]
  local content
  content=$(cat docs/features/F0001-test/iterations.md)
  [[ "$content" == *"[FEATURE 1 COMPLETE]"* ]]
  [[ "$content" == *"|feature:1"* ]]
}

@test "aceita --epic flag" {
  run "$SCRIPTS_DIR/log-iteration.sh" add signup "feature 1" "api.ts" "/dev" "--feature" "1" "--epic" "auth-system"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EPIC:auth-system"* ]]
  local content
  content=$(cat docs/features/F0001-test/iterations.md)
  [[ "$content" == *"|epic:auth-system"* ]]
}

# ─── Truncamento ────────────────────────────────────────────────────

@test "trunca what em 60 caracteres" {
  local long_what="This is a very long description that exceeds sixty characters limit for sure yes it does"
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "$long_what" "f.ts"
  [ "$status" -eq 0 ]
  local content
  content=$(cat docs/features/F0001-test/iterations.md)
  # O conteúdo gravado deve ter no máximo 60 chars na parte do what
  local what_part
  what_part=$(grep "^slug|" docs/features/F0001-test/iterations.md | cut -d'|' -f2)
  [ "${#what_part}" -le 60 ]
}

# ─── Validações ──────────────────────────────────────────────────────

@test "falha sem argumentos" {
  run "$SCRIPTS_DIR/log-iteration.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:missing_required_args"* ]]
}

@test "falha com type inválido" {
  run "$SCRIPTS_DIR/log-iteration.sh" invalid slug "what" "files"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:invalid_type"* ]]
}

@test "falha quando não está em feature branch" {
  git checkout main -q
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "what" "files"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:not_on_feature_branch"* ]]
}

@test "falha quando feature dir não existe" {
  git checkout -b feature/F9999-missing -q
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "what" "files"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:feature_dir_not_found"* ]]
}

@test "falha com --feature sem valor numérico" {
  run "$SCRIPTS_DIR/log-iteration.sh" fix slug "what" "files" "/dev" "--feature" "abc"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:"* ]]
}

@test "valida todos os types aceitos" {
  for type in fix enhance refactor add remove config; do
    run "$SCRIPTS_DIR/log-iteration.sh" "$type" "slug-$type" "what" "f.ts"
    [ "$status" -eq 0 ]
  done
}

# ─── Arquivo vazio / existente ───────────────────────────────────────

@test "funciona corretamente quando iterations.md já existe mas está vazio" {
  touch docs/features/F0001-test/iterations.md
  run "$SCRIPTS_DIR/log-iteration.sh" fix save-btn "fix validation" "api/ctrl.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I1"* ]]
  [ -s "docs/features/F0001-test/iterations.md" ]
}

# ─── Caracteres especiais / UTF-8 ────────────────────────────────────

@test "aceita caracteres UTF-8 no campo what" {
  run "$SCRIPTS_DIR/log-iteration.sh" fix btn "corrigir validação de e-mail e autenticação" "api.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:I1"* ]]
  local content
  content=$(cat docs/features/F0001-test/iterations.md)
  [[ "$content" == *"btn"* ]]
}
