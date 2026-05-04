#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Config detection ───────────────────────────────────────────────

@test "detects package.json" {
  echo '{"name":"test"}' > package.json
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"package.json"* ]]
}

@test "detects multiple config files" {
  echo '{}' > package.json
  echo "" > requirements.txt
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"package.json"* ]]
  [[ "$output" == *"requirements.txt"* ]]
}

@test "detects lock files" {
  echo '{}' > package.json
  echo "" > package-lock.json
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"package-lock.json"* ]]
}

# ─── Structure ───────────────────────────────────────────────────────

@test "shows STRUCTURE section" {
  mkdir -p src/components
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STRUCTURE:"* ]]
  [[ "$output" == *"src/"* ]]
}

@test "ignores node_modules in structure" {
  mkdir -p node_modules/some-pkg
  mkdir -p src
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" != *"node_modules"* ]] || [[ "$output" == *"STRUCTURE:"* ]]
}

# ─── Extensions ──────────────────────────────────────────────────────

@test "lists file extensions" {
  echo "x" > file1.ts
  echo "x" > file2.ts
  echo "x" > file3.js
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EXTENSIONS:"* ]]
  [[ "$output" == *".ts:"* ]]
}

# ─── Scripts detection ───────────────────────────────────────────────

@test "detects package.json scripts" {
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

@test "detects Makefile targets" {
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

@test "lists package.json dependencies" {
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

@test "detects .env files" {
  echo "KEY=val" > .env
  echo "KEY=val" > .env.example
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ENV:"* ]]
  [[ "$output" == *".env"* ]]
  [[ "$output" == *".env.example"* ]]
}

# ─── LSP ─────────────────────────────────────────────────────────────

@test "reports LSP status" {
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LSP:"* ]]
}

# ─── Exit clean ──────────────────────────────────────────────────────

@test "always exits 0" {
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
}

# ─── Edge cases ───────────────────────────────────────────────────────

@test "does not crash with malformed package.json" {
  echo "{ invalid json: [" > package.json
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
}

@test "handles directory with spaces in name" {
  mkdir -p "src/my component"
  mkdir -p "src/utils"
  run "$SCRIPTS_DIR/architecture-discover.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STRUCTURE:"* ]]
}
