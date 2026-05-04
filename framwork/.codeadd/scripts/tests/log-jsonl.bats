#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Success ─────────────────────────────────────────────────────────

@test "creates JSONL file with correct fields" {
  local out_file="$TEST_REPO/output.jsonl"
  run "$SCRIPTS_DIR/log-jsonl.sh" "$out_file" "fix" "/dev" '"slug":"test","what":"test fix"'
  [ "$status" -eq 0 ]
  [[ "$output" == *"LOGGED:"* ]]
  [ -f "$out_file" ]

  # Verify fields in JSON
  local line
  line=$(cat "$out_file")
  [[ "$line" == *'"type":"fix"'* ]]
  [[ "$line" == *'"agent":"/dev"'* ]]
  [[ "$line" == *'"slug":"test"'* ]]
  [[ "$line" == *'"ts":'* ]]
}

@test "creates intermediate directory if it does not exist" {
  local out_file="$TEST_REPO/deep/nested/dir/output.jsonl"
  run "$SCRIPTS_DIR/log-jsonl.sh" "$out_file" "add" "backend" '"slug":"s1","what":"w1"'
  [ "$status" -eq 0 ]
  [ -f "$out_file" ]
}

@test "appends multiple entries in the same file" {
  local out_file="$TEST_REPO/multi.jsonl"
  "$SCRIPTS_DIR/log-jsonl.sh" "$out_file" "fix" "/dev" '"slug":"a","what":"first"'
  "$SCRIPTS_DIR/log-jsonl.sh" "$out_file" "add" "/dev" '"slug":"b","what":"second"'

  local count
  count=$(wc -l < "$out_file")
  [ "$count" -eq 2 ]
}

# ─── Argument validation ────────────────────────────────────────────

@test "fails without arguments" {
  run "$SCRIPTS_DIR/log-jsonl.sh"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:missing_args"* ]]
}

@test "fails with only 3 arguments" {
  run "$SCRIPTS_DIR/log-jsonl.sh" "file.jsonl" "fix" "agent"
  [ "$status" -eq 1 ]
}

@test "fails with empty file argument" {
  run "$SCRIPTS_DIR/log-jsonl.sh" "" "fix" "agent" '"x":"y"'
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:empty_file"* ]]
}

@test "fails with empty type argument" {
  run "$SCRIPTS_DIR/log-jsonl.sh" "f.jsonl" "" "agent" '"x":"y"'
  [ "$status" -eq 1 ]
  [[ "$output" == *"ERROR:empty_type"* ]]
}
