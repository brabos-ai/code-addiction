#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Context mode (default) ─────────────────────────────────────────

@test "context mode: mostra info do branch feature" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CURRENT_BRANCH=feature/0001F-test"* ]]
  [[ "$output" == *"MAIN_BRANCH=main"* ]]
  [[ "$output" == *"BRANCH_TYPE=feature"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0001F"* ]]
}

@test "context mode: detecta hotfix" {
  git checkout -b hotfix/0001H-urgent -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=hotfix"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0001H"* ]]
}

@test "context mode: detecta fix" {
  git checkout -b fix/0001H-bugfix -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=fix"* ]]
}

@test "context mode: reporta pending changes" {
  git checkout -b feature/0001F-test -q
  echo "change" > newfile.txt
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_UNCOMMITTED=true"* ]]
  [[ "$output" == *"UNTRACKED_COUNT=1"* ]]
}

@test "context mode: reporta sem pending changes" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_UNCOMMITTED=false"* ]]
}

# ─── Erros ───────────────────────────────────────────────────────────

@test "falha em detached HEAD" {
  git checkout --detach -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
  [[ "$output" == *"detached"* ]]
}

@test "context mode: falha em branch sem ID" {
  git checkout -b random-branch -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
  [[ "$output" == *"No feature/hotfix ID found"* ]]
}

# ─── Generic branch prefixes (PRD0007) ───────────────────────────────

@test "context mode: refactor/0002R-cleanup detectado como refactor" {
  git checkout -b refactor/0002R-cleanup -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=refactor"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0002R"* ]]
}

@test "context mode: chore/0003C-deps detectado como chore" {
  git checkout -b chore/0003C-deps -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=chore"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0003C"* ]]
}

@test "context mode: docs/0004D-readme detectado como docs" {
  git checkout -b docs/0004D-readme -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH_TYPE=docs"* ]]
  [[ "$output" == *"FEATURE_NUMBER=0004D"* ]]
}

# ─── Merge mode guards ──────────────────────────────────────────────

@test "merge mode: falha quando já está em main (no ID)" {
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"STATUS=ERROR"* ]]
}

@test "merge mode: falha em branch sem ID" {
  git checkout -b random-branch -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"No feature/hotfix ID found"* ]]
}

# ─── Context mode: edge cases ────────────────────────────────────────

@test "context mode: reporta múltiplas mudanças simultâneas (modified + staged + untracked)" {
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

@test "context mode: emite WARNING quando origin/main não existe no remote" {
  # Sem setup_remote — origin/main não existe
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WARNING=Remote branch origin/main not found"* ]]
}

# ─── Merge mode: execution scenarios ────────────────────────────────

@test "merge mode: falha sem remote configurado (push failure)" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -ne 0 ]
}

@test "merge mode: detecta merge conflict no squash" {
  setup_remote
  # Adiciona arquivo base no main e envia
  echo "original content" > shared.txt
  git add shared.txt && git commit -m "add shared file" -q
  git push origin main -q
  # Cria feature branch e modifica o arquivo
  git checkout -b feature/0001F-conflict -q
  echo "feature version" > shared.txt
  git add shared.txt && git commit -m "feature change" -q
  git push -u origin feature/0001F-conflict -q
  # Conflito: atualiza main com mudança diferente
  git checkout main -q
  echo "main conflicting version" > shared.txt
  git add shared.txt && git commit -m "main change" -q
  git push origin main -q
  # Volta para feature e tenta merge
  git checkout feature/0001F-conflict -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 1 ]
  [[ "$output" == *"Merge conflict detected"* ]]
}

@test "merge mode: pula commit quando branch não tem commits além do main" {
  setup_remote
  git checkout -b feature/0001F-test -q
  git push -u origin feature/0001F-test -q
  run "$SCRIPTS_DIR/done.sh" --merge
  [ "$status" -eq 0 ]
  [[ "$output" == *"MERGE_COMMIT=SKIPPED"* ]]
}
