#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Config detection ───────────────────────────────────────────────

@test "detecta package.json" {
  echo '{"name":"test"}' > package.json
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"package.json"* ]]
}

@test "detecta múltiplos config files" {
  echo '{}' > package.json
  echo "" > requirements.txt
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"package.json"* ]]
  [[ "$output" == *"requirements.txt"* ]]
}

@test "detecta lock files" {
  echo '{}' > package.json
  echo "" > package-lock.json
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"package-lock.json"* ]]
}

# ─── Structure ───────────────────────────────────────────────────────

@test "mostra seção STRUCTURE" {
  mkdir -p src/components
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STRUCTURE:"* ]]
  [[ "$output" == *"src/"* ]]
}

@test "ignora node_modules na estrutura" {
  mkdir -p node_modules/some-pkg
  mkdir -p src
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" != *"node_modules"* ]] || [[ "$output" == *"STRUCTURE:"* ]]
}

# ─── Extensions ──────────────────────────────────────────────────────

@test "lista extensões de arquivos" {
  echo "x" > file1.ts
  echo "x" > file2.ts
  echo "x" > file3.js
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EXTENSIONS:"* ]]
  [[ "$output" == *".ts:"* ]]
}

# ─── Scripts detection ───────────────────────────────────────────────

@test "detecta scripts do package.json" {
  cat > package.json << 'EOF'
{
  "scripts": {
    "test": "jest",
    "build": "tsc"
  }
}
EOF
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SCRIPTS:"* ]]
  [[ "$output" == *"test"* ]]
  [[ "$output" == *"build"* ]]
}

@test "detecta targets do Makefile" {
  cat > Makefile << 'EOF'
build:
	echo "building"

test:
	echo "testing"
EOF
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"build"* ]]
}

# ─── Deps ────────────────────────────────────────────────────────────

@test "lista dependências do package.json" {
  cat > package.json << 'EOF'
{
  "dependencies": {
    "express": "^4.0.0",
    "lodash": "^4.0.0"
  }
}
EOF
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"DEPS:"* ]]
  [[ "$output" == *"express"* ]]
}

# ─── ENV files ───────────────────────────────────────────────────────

@test "detecta .env files" {
  echo "KEY=val" > .env
  echo "KEY=val" > .env.example
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ENV:"* ]]
  [[ "$output" == *".env"* ]]
  [[ "$output" == *".env.example"* ]]
}

# ─── LSP ─────────────────────────────────────────────────────────────

@test "reporta LSP status" {
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LSP:"* ]]
}

# ─── Exit clean ──────────────────────────────────────────────────────

@test "exit 0 sempre" {
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
}

# ─── Edge cases ───────────────────────────────────────────────────────

@test "não crasha com package.json malformado" {
  echo "{ invalid json: [" > package.json
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
}

@test "lida com diretório com espaços no nome" {
  mkdir -p "src/my component"
  mkdir -p "src/utils"
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STRUCTURE:"* ]]
}
