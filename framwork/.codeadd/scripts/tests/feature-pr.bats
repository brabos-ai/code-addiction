#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Guards ──────────────────────────────────────────────────────────

@test "falha quando não está em feature branch" {
  run "$SCRIPTS_DIR/feature-pr.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Not on a feature branch"* ]]
}

@test "falha em detached HEAD" {
  git checkout --detach -q
  run "$SCRIPTS_DIR/feature-pr.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Could not detect current branch"* ]]
}

@test "falha quando feature dir não existe (create-pr mode)" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/feature-pr.sh" --create-pr
  [ "$status" -eq 1 ]
  [[ "$output" == *"Feature directory not found"* ]]
}

# ─── Preview mode ───────────────────────────────────────────────────

@test "preview mode: mostra ações que serão executadas" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  run "$SCRIPTS_DIR/feature-pr.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MODE=PREVIEW"* ]]
  [[ "$output" == *"WILL_DO="* ]]
  [[ "$output" == *"CONFIRM=Run with --create-pr to execute"* ]]
}

@test "preview mode: detecta feature ID corretamente" {
  git checkout -b feature/0042F-login -q
  mkdir -p docs/features/0042F-login
  run "$SCRIPTS_DIR/feature-pr.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE_ID=0042F-login"* ]]
}

@test "preview mode: conta pending changes" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "new" > newfile.txt
  run "$SCRIPTS_DIR/feature-pr.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"UNTRACKED_COUNT=1"* ]]
  [[ "$output" == *"HAS_UNCOMMITTED=true"* ]]
}

# ─── Create PR mode guards ──────────────────────────────────────────

@test "create-pr mode: falha sem changelog.md" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "change" > src.txt
  git add src.txt && git commit -m "feat" -q
  run "$SCRIPTS_DIR/feature-pr.sh" --create-pr
  [ "$status" -eq 1 ]
  [[ "$output" == *"changelog.md not found"* ]]
}

@test "create-pr mode: falha sem changes e sem uncommitted" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "# Changelog" > docs/features/0001F-test/changelog.md
  run "$SCRIPTS_DIR/feature-pr.sh" --create-pr
  [ "$status" -eq 1 ]
  [[ "$output" == *"No commits or changes found"* ]]
}

# ─── Create PR mode: push/gh failures ──────────────────────────────

@test "create-pr mode: falha ao fazer push quando não há remote configurado" {
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "# Changelog" > docs/features/0001F-test/changelog.md
  echo "change" > src.txt
  git add . && git commit -m "feat" -q
  run "$SCRIPTS_DIR/feature-pr.sh" --create-pr
  [ "$status" -eq 1 ]
  [[ "$output" == *"git push failed"* ]]
}

@test "create-pr mode: falha quando gh não está autenticado" {
  setup_remote
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "change" > src.txt
  git add . && git commit -m "feat" -q
  echo "# Changelog" > docs/features/0001F-test/changelog.md
  local mock_bin
  mock_bin=$(mktemp -d)
  cat > "$mock_bin/gh" << 'GHEOF'
#!/bin/bash
if [[ "$1" == "auth" ]]; then exit 1; fi
exit 0
GHEOF
  chmod +x "$mock_bin/gh"
  export PATH="$mock_bin:$PATH"
  run "$SCRIPTS_DIR/feature-pr.sh" --create-pr
  [ "$status" -eq 1 ]
  [[ "$output" == *"gh CLI is not authenticated"* ]]
}

@test "create-pr mode: falha quando PR já existe para o branch" {
  setup_remote
  git checkout -b feature/0001F-test -q
  mkdir -p docs/features/0001F-test
  echo "change" > src.txt
  git add . && git commit -m "feat" -q
  echo "# Changelog" > docs/features/0001F-test/changelog.md
  local mock_bin
  mock_bin=$(mktemp -d)
  cat > "$mock_bin/gh" << 'GHEOF'
#!/bin/bash
case "$1" in
  auth) exit 0 ;;
  pr)
    if [[ "$2" == "list" ]]; then
      echo "https://github.com/owner/repo/pull/42"
      exit 0
    fi
    ;;
esac
exit 0
GHEOF
  chmod +x "$mock_bin/gh"
  export PATH="$mock_bin:$PATH"
  run "$SCRIPTS_DIR/feature-pr.sh" --create-pr
  [ "$status" -eq 1 ]
  [[ "$output" == *"ALREADY_EXISTS"* ]]
  [[ "$output" == *"PR_URL=https://github.com"* ]]
}
