#!/usr/bin/env bats
# qa-preflight.sh — deterministic QA prerequisite probes (plan 0056).
# Contract: KEY=STATUS lines; statuses ok|missing|broken|not-probed (+ raw
# feature state true|false|unset|no-manifest). Diagnosis, never a gate:
# exit 0 regardless of probe results; exit 2 only on CLI misuse.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

write_manifest() {
  mkdir -p "$TEST_REPO/.codeadd"
  printf '%s' "$1" > "$TEST_REPO/.codeadd/manifest.json"
}

write_config() {
  mkdir -p "$TEST_REPO/docs/qa"
  printf '%s' "$1" > "$TEST_REPO/docs/qa/config.json"
}

# ─── Phase A: feature state (raw manifest read — command applies defaults) ───

@test "phase a: no manifest → QA_FEATURE_STATE=no-manifest, exit 0" {
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_FEATURE_STATE=no-manifest"* ]]
}

@test "phase a: manifest without features key → QA_FEATURE_STATE=unset" {
  write_manifest '{"version":"0.0.0","providers":["claude"]}'
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_FEATURE_STATE=unset"* ]]
}

@test "phase a: features.qa-pipeline=true → QA_FEATURE_STATE=true" {
  write_manifest '{"features":{"qa-pipeline":true}}'
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_FEATURE_STATE=true"* ]]
}

@test "phase a: features.qa-pipeline=false → QA_FEATURE_STATE=false" {
  write_manifest '{"features":{"qa-pipeline":false}}'
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_FEATURE_STATE=false"* ]]
}

# ─── Phase A: config.json + short-circuit of dependent probes ───────────────

@test "phase a: config missing → QA_CONFIG=missing, baseUrl probes not-probed" {
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_CONFIG=missing"* ]]
  [[ "$output" == *"QA_BASEURL_REACHABLE=not-probed"* ]]
  [[ "$output" == *"QA_BASEURL_LOCAL=not-probed"* ]]
}

@test "phase a: config invalid JSON → QA_CONFIG=broken, baseUrl probes not-probed" {
  write_config '{not json'
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_CONFIG=broken"* ]]
  [[ "$output" == *"QA_BASEURL_REACHABLE=not-probed"* ]]
}

@test "phase a: config without baseUrl → QA_CONFIG=broken" {
  write_config '{"viewports":{}}'
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_CONFIG=broken"* ]]
}

@test "phase a: local baseUrl on closed port → LOCAL=ok, REACHABLE=broken" {
  write_config '{"baseUrl":"http://127.0.0.1:1"}'
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_CONFIG=ok"* ]]
  [[ "$output" == *"QA_BASEURL=http://127.0.0.1:1"* ]]
  [[ "$output" == *"QA_BASEURL_LOCAL=ok"* ]]
  [[ "$output" == *"QA_BASEURL_REACHABLE=broken"* ]]
}

@test "phase a: production baseUrl → QA_BASEURL_LOCAL=broken (refuse remote hosts)" {
  write_config '{"baseUrl":"https://app.example.com"}'
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_BASEURL_LOCAL=broken"* ]]
}

# ─── Phase A: runner + chromium short-circuit ───────────────────────────────

@test "phase a: runner absent in project → QA_RUNNER=missing, QA_CHROMIUM=not-probed" {
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_RUNNER=missing"* ]]
  [[ "$output" == *"QA_CHROMIUM=not-probed"* ]]
}

# ─── Phase A: qa-project skill ──────────────────────────────────────────────

@test "phase a: qa-project skill present in a provider skills dir → ok" {
  mkdir -p "$TEST_REPO/.claude/skills/qa-project"
  echo "# qa-project" > "$TEST_REPO/.claude/skills/qa-project/SKILL.md"
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_PROJECT_SKILL=ok"* ]]
}

@test "phase a: qa-project skill absent → missing" {
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_PROJECT_SKILL=missing"* ]]
}

# ─── Phase B: screens.json + spec glob ──────────────────────────────────────

@test "phase b: screens.json missing → QA_SCREENS=missing" {
  mkdir -p "$TEST_REPO/docs/features/0001F-x"
  run bash "$SCRIPTS_DIR/qa-preflight.sh" b "docs/features/0001F-x"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_SCREENS=missing"* ]]
}

@test "phase b: screens.json invalid JSON → QA_SCREENS=broken" {
  mkdir -p "$TEST_REPO/docs/features/0001F-x/_tests"
  printf '{broken' > "$TEST_REPO/docs/features/0001F-x/_tests/screens.json"
  run bash "$SCRIPTS_DIR/qa-preflight.sh" b "docs/features/0001F-x"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_SCREENS=broken"* ]]
}

@test "phase b: valid screens.json → QA_SCREENS=ok" {
  mkdir -p "$TEST_REPO/docs/features/0001F-x/_tests"
  printf '{"feature":"0001F","screens":[]}' > "$TEST_REPO/docs/features/0001F-x/_tests/screens.json"
  run bash "$SCRIPTS_DIR/qa-preflight.sh" b "docs/features/0001F-x"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_SCREENS=ok"* ]]
}

@test "phase b: no spec glob arg → QA_SPECS=not-probed" {
  mkdir -p "$TEST_REPO/docs/features/0001F-x"
  run bash "$SCRIPTS_DIR/qa-preflight.sh" b "docs/features/0001F-x"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_SPECS=not-probed"* ]]
}

@test "phase b: spec glob with a match → QA_SPECS=ok" {
  mkdir -p "$TEST_REPO/docs/features/0001F-x" "$TEST_REPO/e2e"
  touch "$TEST_REPO/e2e/login.qa.spec.ts"
  run bash "$SCRIPTS_DIR/qa-preflight.sh" b "docs/features/0001F-x" "e2e/*.qa.spec.*"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_SPECS=ok"* ]]
}

@test "phase b: spec glob without match → QA_SPECS=missing" {
  mkdir -p "$TEST_REPO/docs/features/0001F-x" "$TEST_REPO/e2e"
  run bash "$SCRIPTS_DIR/qa-preflight.sh" b "docs/features/0001F-x" "e2e/*.qa.spec.*"
  [ "$status" -eq 0 ]
  [[ "$output" == *"QA_SPECS=missing"* ]]
}

# ─── CLI contract ───────────────────────────────────────────────────────────

@test "diagnosis is never a gate: everything missing still exits 0" {
  run bash "$SCRIPTS_DIR/qa-preflight.sh" a
  [ "$status" -eq 0 ]
}

@test "unknown phase → exit 2 with usage (CLI misuse is not a diagnosis)" {
  run bash "$SCRIPTS_DIR/qa-preflight.sh" nope
  [ "$status" -eq 2 ]
  [[ "$output" == *"Usage"* ]]
}

@test "phase b without FEATURE_DIR → exit 2 with usage" {
  run bash "$SCRIPTS_DIR/qa-preflight.sh" b
  [ "$status" -eq 2 ]
  [[ "$output" == *"Usage"* ]]
}
