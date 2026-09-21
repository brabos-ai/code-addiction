#!/usr/bin/env bats

# migrate-context-files.sh folds legacy context files into AGENTS.md and deletes
# them. The one property every test here protects: no line of a migrated file is
# lost. Each case asserts every line of each candidate is present in AGENTS.md
# after the run, not merely that the candidate is gone.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# Every line of $1 (a saved copy of a candidate) appears in AGENTS.md.
assert_all_lines_in_agents() {
  local src="$1" line
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    [ -z "$line" ] && continue
    grep -qF -- "$line" AGENTS.md || { echo "missing line: $line"; return 1; }
  done < "$src"
}

# ─── AGENTS.md absent ────────────────────────────────────────────────

@test "CLAUDE.md alone becomes AGENTS.md verbatim and is deleted" {
  printf '# Project\n\nRule one.\n' > CLAUDE.md
  cp CLAUDE.md "$TEST_TEMP_DIR/claude.orig"
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MIGRATED:CLAUDE.md:created"* ]]
  [ ! -f CLAUDE.md ]
  cmp -s AGENTS.md "$TEST_TEMP_DIR/claude.orig"
}

@test ".claude/CLAUDE.md alone becomes AGENTS.md and is deleted" {
  mkdir -p .claude
  printf '# Nested\n\nKeep me.\n' > .claude/CLAUDE.md
  cp .claude/CLAUDE.md "$TEST_TEMP_DIR/nested.orig"
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MIGRATED:.claude/CLAUDE.md:created"* ]]
  [ ! -f .claude/CLAUDE.md ]
  cmp -s AGENTS.md "$TEST_TEMP_DIR/nested.orig"
}

# ─── The old-copy shape add.wiki used to produce ─────────────────────

@test "AGENTS.md = CLAUDE.md + shell policy and GEMINI.md = copy: both are duplicates, AGENTS.md unchanged" {
  printf '# Project\n\nRule one.\n' > CLAUDE.md
  cp CLAUDE.md GEMINI.md
  { cat CLAUDE.md; printf '\n---\n\n## Shell policy (Windows)\nUse Git Bash.\n'; } > AGENTS.md
  cp AGENTS.md "$TEST_TEMP_DIR/agents.orig"
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MIGRATED:CLAUDE.md:duplicate"* ]]
  [[ "$output" == *"MIGRATED:GEMINI.md:duplicate"* ]]
  [ ! -f CLAUDE.md ]
  [ ! -f GEMINI.md ]
  cmp -s AGENTS.md "$TEST_TEMP_DIR/agents.orig"
}

@test "CRLF candidate against LF AGENTS.md counts as contained" {
  printf '# Project\r\n\r\nRule one.\r\n' > CLAUDE.md
  printf '# Project\n\nRule one.\n\n## Shell policy (Windows)\n' > AGENTS.md
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MIGRATED:CLAUDE.md:duplicate"* ]]
  [ ! -f CLAUDE.md ]
  run grep -c "Migrated from" AGENTS.md
  [ "$output" = "0" ]
}

# ─── Different content is appended, never dropped ────────────────────

@test "hand-written CLAUDE.md different from AGENTS.md is appended whole under a heading" {
  printf '# My Claude notes\n\n- Always use pnpm.\n- Never touch prod.\n' > CLAUDE.md
  printf '# Agents\n\nCodex rules here.\n' > AGENTS.md
  cp CLAUDE.md "$TEST_TEMP_DIR/claude.orig"
  cp AGENTS.md "$TEST_TEMP_DIR/agents.orig"
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MIGRATED:CLAUDE.md:appended"* ]]
  [ ! -f CLAUDE.md ]
  grep -qx '## Migrated from CLAUDE.md' AGENTS.md
  assert_all_lines_in_agents "$TEST_TEMP_DIR/claude.orig"
  assert_all_lines_in_agents "$TEST_TEMP_DIR/agents.orig"
}

@test "all three candidates, each different: every line of every file lands in AGENTS.md" {
  mkdir -p .claude
  printf '# Root claude\nalpha line\n' > CLAUDE.md
  printf '# Nested claude\nbeta line\n' > .claude/CLAUDE.md
  printf '# Gemini\ngamma line\n' > GEMINI.md
  for f in CLAUDE.md .claude/CLAUDE.md GEMINI.md; do cp "$f" "$TEST_TEMP_DIR/$(echo "$f" | tr '/' '_').orig"; done
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"MIGRATED:CLAUDE.md:created"* ]]
  [[ "$output" == *"MIGRATED:.claude/CLAUDE.md:appended"* ]]
  [[ "$output" == *"MIGRATED:GEMINI.md:appended"* ]]
  [ ! -f CLAUDE.md ] && [ ! -f .claude/CLAUDE.md ] && [ ! -f GEMINI.md ]
  for f in "$TEST_TEMP_DIR"/*.orig; do assert_all_lines_in_agents "$f"; done
}

# ─── What is never touched ───────────────────────────────────────────

@test "CLAUDE.local.md is left in place and reported" {
  printf 'personal\n' > CLAUDE.local.md
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LEGACY_LOCAL:CLAUDE.local.md"* ]]
  [ -f CLAUDE.local.md ]
  [ ! -f AGENTS.md ]
}

@test "nothing to migrate reports CONTEXT_MIGRATION:none and writes nothing" {
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CONTEXT_MIGRATION:none"* ]]
  [ ! -f AGENTS.md ]
}

@test "AGENTS.md alone is left byte-identical" {
  printf '# Agents\nonly file\n' > AGENTS.md
  cp AGENTS.md "$TEST_TEMP_DIR/agents.orig"
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CONTEXT_MIGRATION:none"* ]]
  cmp -s AGENTS.md "$TEST_TEMP_DIR/agents.orig"
}

# ─── Idempotence ─────────────────────────────────────────────────────

@test "a second run changes nothing" {
  printf '# My notes\nkeep\n' > CLAUDE.md
  printf '# Agents\nother\n' > AGENTS.md
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  cp AGENTS.md "$TEST_TEMP_DIR/after-first"
  run "$SCRIPTS_DIR/migrate-context-files.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CONTEXT_MIGRATION:none"* ]]
  cmp -s AGENTS.md "$TEST_TEMP_DIR/after-first"
}
