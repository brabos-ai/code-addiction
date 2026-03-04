#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Detecção via remote ────────────────────────────────────────────

@test "detecta main via origin/HEAD (repo clonado)" {
  setup_remote
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "main" ]
}

@test "detecta main via refs/remotes/origin/main" {
  setup_remote
  # Remove symbolic-ref para forçar fallback para show-ref
  git remote set-head origin --delete 2>/dev/null || true
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "main" ]
}

@test "detecta master via remote quando main não existe" {
  # Criar repo com master
  cd "$TEST_TEMP_DIR"
  rm -rf "$TEST_REPO"
  mkdir -p "$TEST_REPO"
  cd "$TEST_REPO"
  git init --initial-branch=master -q
  git config user.email "test@test.com"
  git config user.name "Test"
  git commit --allow-empty -m "init" -q

  setup_remote_dir="$TEST_TEMP_DIR/remote"
  mkdir -p "$setup_remote_dir"
  git init --bare -q "$setup_remote_dir"
  git remote add origin "$setup_remote_dir"
  git push -u origin master -q 2>/dev/null

  # Remove symbolic-ref
  git remote set-head origin --delete 2>/dev/null || true

  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "master" ]
}

# ─── Detecção via branch local (sem remote) ─────────────────────────

@test "detecta main local quando não há remote" {
  # Repo sem remote, branch main já existe do setup
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "main" ]
}

@test "detecta master local quando não há remote e branch é master" {
  git branch -m master
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 0 ]
  [ "$output" = "master" ]
}

# ─── Casos de erro ──────────────────────────────────────────────────

@test "falha com exit 1 fora de repositório git" {
  cd "$TEST_TEMP_DIR"
  mkdir -p not-a-repo
  cd not-a-repo
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 1 ]
}

@test "falha com exit 2 quando não há main nem master" {
  git branch -m develop
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 2 ]
}

@test "mensagem de erro vai para stderr quando falha" {
  git branch -m develop
  run "$SCRIPTS_DIR/get-main-branch.sh"
  [ "$status" -eq 2 ]
  [[ "$output" == *"ERRO"* ]]
}
