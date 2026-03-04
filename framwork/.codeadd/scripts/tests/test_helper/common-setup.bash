#!/bin/bash
# =============================================================================
# Common test setup/teardown for BATS tests
# =============================================================================

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Setup: cria repositório git temporário com branch main
common_setup() {
  TEST_TEMP_DIR=$(mktemp -d)
  TEST_REPO="$TEST_TEMP_DIR/repo"
  mkdir -p "$TEST_REPO"
  cd "$TEST_REPO"

  git init --initial-branch=main -q
  git config user.email "test@test.com"
  git config user.name "Test"
  git commit --allow-empty -m "init" -q
}

# Teardown: limpa diretório temporário
common_teardown() {
  if [ -n "${TEST_TEMP_DIR:-}" ] && [ -d "$TEST_TEMP_DIR" ]; then
    rm -rf "$TEST_TEMP_DIR"
  fi
}

# Helper: cria estrutura de feature docs
create_feature_docs() {
  local feature_id="${1:-F0001-test}"
  local docs_dir="$TEST_REPO/docs/features/$feature_id"
  mkdir -p "$docs_dir"
  echo "# $feature_id" > "$docs_dir/plan.md"
  echo "$docs_dir"
}

# Helper: adiciona remote origin ao repo de teste
setup_remote() {
  local remote_dir="$TEST_TEMP_DIR/remote"
  mkdir -p "$remote_dir"
  git init --bare -q "$remote_dir"
  cd "$TEST_REPO"
  git remote add origin "$remote_dir"
  git push -u origin main -q 2>/dev/null
}
