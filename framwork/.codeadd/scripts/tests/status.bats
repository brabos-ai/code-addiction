#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

# ─── Branch detection ───────────────────────────────────────────────

@test "outputs BRANCH with type main" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRANCH:main TYPE:main MAIN:main"* ]]
}

@test "detects feature branch" {
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:feature"* ]]
}

@test "detects fix branch" {
  git checkout -b fix/0001H-bugfix -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:fix"* ]]
}

@test "detects docs branch" {
  git checkout -b docs/0001D-readme -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"TYPE:docs"* ]]
}

# ─── Phase detection ────────────────────────────────────────────────

@test "phase=created when feature dir exists but is empty" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:created"* ]]
}

@test "phase=documented when about.md has real content" {
  mkdir -p docs/features/0001F-test
  echo "# Feature 0001F" > docs/features/0001F-test/about.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:documented"* ]]
}

@test "phase=planned quando plan.md existe" {
  mkdir -p docs/features/0001F-test
  echo "# Plan" > docs/features/0001F-test/plan.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:planned"* ]]
}

@test "phase=done quando changelog.md existe" {
  mkdir -p docs/features/0001F-test
  echo "# Changelog" > docs/features/0001F-test/changelog.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:done"* ]]
}

# ─── Feature docs listing ───────────────────────────────────────────

@test "lists existing feature docs" {
  mkdir -p docs/features/0001F-test
  echo "a" > docs/features/0001F-test/about.md
  echo "p" > docs/features/0001F-test/plan.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"DOCS:about.md,plan.md"* ]]
}

# ─── Owner detection ────────────────────────────────────────────────

@test "detects complete owner (name|level|language)" {
  mkdir -p docs
  printf 'Nome: Maicon\nNivel: avancado\nIdioma: pt-br\n' > docs/owner.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Maicon|advanced|pt-br"* ]]
}

@test "owner uses defaults for missing fields" {
  mkdir -p docs
  printf 'Nome: Ana\n' > docs/owner.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"OWNER:Ana|intermediate|en-us"* ]]
}

# ─── Recommendations ────────────────────────────────────────────────

@test "recommends /add.new when on main" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:/add.new to start"* ]]
}

@test "recommends /add.build when phase=planned" {
  mkdir -p docs/features/0001F-test
  echo "# Plan" > docs/features/0001F-test/plan.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"REC:/add.build to implement"* ]]
}

# ─── Git status ──────────────────────────────────────────────────────

@test "shows GIT status when there are modified files" {
  echo "new file" > test.txt
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"GIT:"* ]]
}

# ─── Feature not found ──────────────────────────────────────────────

@test "reports feature dir not found when docs do not exist" {
  git checkout -b feature/9999F-missing -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"FEATURE:9999F-missing PHASE:none"* ]]
  [[ "$output" == *"not found"* ]]
}

# ─── Exit clean ─────────────────────────────────────────────────────

@test "always exits with 0" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
}

# ─── Phase extended ──────────────────────────────────────────────────

@test "phase=designed quando design.md existe" {
  mkdir -p docs/features/0001F-test
  echo "# Design" > docs/features/0001F-test/design.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:designed"* ]]
}

@test "HAS_DESIGN:true when feature-level design.md exists" {
  mkdir -p docs/features/0001F-test
  echo "# Design" > docs/features/0001F-test/design.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_DESIGN:true"* ]]
}

@test "HAS_DESIGN:true and PHASE:designed when only a subfeature has design.md" {
  mkdir -p docs/features/0001F-test/subfeatures/SF01-x
  echo "# Design" > docs/features/0001F-test/subfeatures/SF01-x/design.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_DESIGN:true"* ]]
  [[ "$output" == *"PHASE:designed"* ]]
  [[ "$output" == *"DOCS:design.md"* ]]
}

@test "HAS_DESIGN:false when no design.md exists at feature or subfeature level" {
  mkdir -p docs/features/0001F-test
  echo "# About" > docs/features/0001F-test/about.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_DESIGN:false"* ]]
}

@test "phase=discovering when discovery.md exists without Summary for Planning section" {
  mkdir -p docs/features/0001F-test
  echo "# Discovery - work in progress" > docs/features/0001F-test/discovery.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:discovering"* ]]
}

@test "phase=discovered when discovery.md contains '## Summary for Planning'" {
  mkdir -p docs/features/0001F-test
  printf '# Discovery\n\n## Summary for Planning\n{"key":"value"}\n' > docs/features/0001F-test/discovery.md
  git checkout -b feature/0001F-test -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PHASE:discovered"* ]]
}

# ─── iterations.jsonl ────────────────────────────────────────────────

@test "shows ITERATIONS when iterations.jsonl exists with entries" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '{"ts":"2026-01-01","type":"fix","slug":"btn","what":"fix button"}\n' >> docs/features/0001F-test/iterations.jsonl
  printf '{"ts":"2026-01-02","type":"add","slug":"form","what":"add form"}\n' >> docs/features/0001F-test/iterations.jsonl
  printf '{"ts":"2026-01-03","type":"enhance","slug":"modal","what":"improve modal"}\n' >> docs/features/0001F-test/iterations.jsonl
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ITERATIONS:3"* ]]
  [[ "$output" == *"LAST_ITERS:"* ]]
  [[ "$output" == *"ITERATIONS_FILE:"* ]]
}

# ─── Epic from plan.md ───────────────────────────────────────────────

@test "detects epic when plan.md has '### Feature N:' sections" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '# Plan\n\n## Epic: auth-system\n\n### Feature 1: Login\n### Feature 2: Signup\n### Feature 3: Logout\n' \
    > docs/features/0001F-test/plan.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EPIC:auth-system"* ]]
  [[ "$output" == *"FEATURES:0/3"* ]]
  [[ "$output" == *"NEXT:1"* ]]
}

@test "epic: shows all_complete when all features are complete" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '# Plan\n\n### Feature 1: Login\n### Feature 2: Signup\n' \
    > docs/features/0001F-test/plan.md
  # Marks features as complete via iterations.jsonl
  printf '{"ts":"2026-01-01","type":"add","slug":"feature-1-complete","what":"done"}\n' >> docs/features/0001F-test/iterations.jsonl
  printf '{"ts":"2026-01-02","type":"add","slug":"feature-2-complete","what":"done"}\n' >> docs/features/0001F-test/iterations.jsonl
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STATUS:all_complete"* ]]
}

# ─── epic.md (PRD0032) ───────────────────────────────────────────────

@test "detects epic.md and reports subfeature progress" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '| SF01 | Login | done |\n| SF02 | Signup | in_progress |\n| SF03 | Logout | pending |\n' \
    > docs/features/0001F-test/epic.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_EPIC:true"* ]]
  # Value assertions: only SF01 is done → 1/3; in_progress SF02 is the current SF.
  # (Guards against BRE `\|` alternation matching every row.)
  [[ "$output" == *"EPIC_PROGRESS:1/3"* ]]
  [[ "$output" == *"EPIC_CURRENT_SF:SF02"* ]]
}

@test "reports subfeature progress with padded/aligned columns" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  # LLM-generated markdown tables align columns with padding — the status cell
  # carries leading/trailing spaces. A literal `-F '| done |'` match would fail here.
  printf '| SF01 | Login  | done        |\n| SF02 | Signup | in_progress |\n| SF03 | Logout | pending     |\n' \
    > docs/features/0001F-test/epic.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"EPIC_PROGRESS:1/3"* ]]
  [[ "$output" == *"EPIC_CURRENT_SF:SF02"* ]]
}

# ─── tasks.md ────────────────────────────────────────────────────────

@test "shows tasks.md progress when present (no epic)" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '| 1.1 | Task one | ✅ |\n| 1.2 | Task two | ✅ |\n| 1.3 | Task three | pending |\n' \
    > docs/features/0001F-test/tasks.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"HAS_TASKS:true"* ]]
  [[ "$output" == *"TASKS_PROGRESS:2/3"* ]]
}

# ─── Summaries ───────────────────────────────────────────────────────

@test "shows ABOUT_SUMMARY when about.md has ## Summary section with JSON" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  printf '# About 0001F\n\n## Summary\n{"purpose":"test feature","scope":"minimal"}\n' \
    > docs/features/0001F-test/about.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"ABOUT_SUMMARY:"* ]]
}

# ─── RECENT_CHANGELOGS ───────────────────────────────────────────────

@test "shows RECENT_CHANGELOGS when there are completed features" {
  # On main branch (no current FEATURE_ID)
  mkdir -p docs/features/0001F-login
  printf '# 0001F Login\n\n## Summary\nUser authentication implemented\n' \
    > docs/features/0001F-login/changelog.md
  mkdir -p docs/features/0002F-signup
  printf '# 0002F Signup\n\n## Summary\nUser registration flow\n' \
    > docs/features/0002F-signup/changelog.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"RECENT_CHANGELOGS:"* ]]
  [[ "$output" == *"0001F-login"* ]]
}

# ─── Git checkpoint tag ──────────────────────────────────────────────

@test "shows LAST_CHECKPOINT when checkpoint tag exists" {
  mkdir -p docs/features/0001F-test
  git checkout -b feature/0001F-test -q
  git tag "checkpoint/0001F-test-v1-done"
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"LAST_CHECKPOINT:checkpoint/0001F-test-v1-done"* ]]
}

# ─── PENDING backlog ─────────────────────────────────────────────────

@test "PENDING: lists a feature with docs but no branch and no changelog" {
  mkdir -p docs/features/0005F-pending
  echo "# About" > docs/features/0005F-pending/about.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PENDING:0005F-pending PHASE:documented"* ]]
}

@test "PENDING: excludes a feature that already has a local branch" {
  mkdir -p docs/features/0005F-pending
  echo "# About" > docs/features/0005F-pending/about.md
  git branch feature/0005F-pending
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" != *"PENDING:0005F-pending"* ]]
}

@test "PENDING: still lists a feature when only an unrelated branch exists" {
  mkdir -p docs/features/0005F-pending
  echo "# About" > docs/features/0005F-pending/about.md
  # A branch that does NOT match */0005F-pending must not exclude it
  git branch feature/9999F-unrelated
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PENDING:0005F-pending"* ]]
}

@test "PENDING: excludes a feature that already has changelog.md" {
  mkdir -p docs/features/0006F-done
  echo "# About" > docs/features/0006F-done/about.md
  echo "# Changelog" > docs/features/0006F-done/changelog.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" != *"PENDING:0006F-done"* ]]
}

@test "PENDING: REC recommends /add.build for the first pending feature on main" {
  mkdir -p docs/features/0005F-pending
  echo "# About" > docs/features/0005F-pending/about.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"/add.build 0005F"* ]]
}

# ─── WIKI block ──────────────────────────────────────────────────────

@test "WIKI: absent when .codeadd/wiki/index.md does not exist" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WIKI:absent"* ]]
  [[ "$output" == *"WIKI_HINT:Run /add.wiki to generate the knowledge base"* ]]
}

@test "WIKI: present with 0 stale changes when sha == HEAD" {
  mkdir -p .codeadd/wiki
  echo "# Wiki" > .codeadd/wiki/index.md
  HEAD_SHA=$(git rev-parse HEAD)
  printf '{"updatedAt":"2026-07-15","command":"/add.wiki","gitHead":"%s"}\n' "$HEAD_SHA" > .codeadd/wiki/.meta.json
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WIKI:present"* ]]
  [[ "$output" == *"WIKI_COMMIT:"* ]]
  [[ "$output" == *"WIKI_STALE_COUNT:0"* ]]
  [[ "$output" != *"WIKI_HINT:"* ]]
}

@test "WIKI: present with N stale changes when sha is behind HEAD" {
  mkdir -p .codeadd/wiki
  echo "# Wiki" > .codeadd/wiki/index.md
  OLD_SHA=$(git rev-parse HEAD)
  printf '{"updatedAt":"2026-07-15","command":"/add.wiki","gitHead":"%s"}\n' "$OLD_SHA" > .codeadd/wiki/.meta.json
  git add .codeadd/wiki/index.md .codeadd/wiki/.meta.json
  git commit -m "add wiki" -q
  echo "change1" > file1.txt
  echo "change2" > file2.txt
  git add file1.txt file2.txt
  git commit -m "two changes" -q
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WIKI:present"* ]]
  [[ "$output" =~ WIKI_STALE_COUNT:[1-9] ]]
  [[ "$output" == *"WIKI_HINT:Wiki may be stale ("*") — /add.wiki update"* ]]
}

@test "WIKI: unresolvable sha (garbage .meta.json) yields unknown + unreachable hint" {
  mkdir -p .codeadd/wiki
  echo "# Wiki" > .codeadd/wiki/index.md
  echo "not valid json {{{" > .codeadd/wiki/.meta.json
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WIKI:present"* ]]
  [[ "$output" == *"WIKI_STALE_COUNT:unknown"* ]]
  [[ "$output" == *"WIKI_HINT:Wiki stamp unreachable — consider /add.wiki update"* ]]
}

@test "WIKI: missing .meta.json yields unknown + unreachable hint" {
  mkdir -p .codeadd/wiki
  echo "# Wiki" > .codeadd/wiki/index.md
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WIKI:present"* ]]
  [[ "$output" == *"WIKI_STALE_COUNT:unknown"* ]]
  [[ "$output" == *"WIKI_HINT:Wiki stamp unreachable — consider /add.wiki update"* ]]
}

@test "WIKI: unreachable sha (well-formed but nonexistent commit) yields unknown + unreachable hint" {
  mkdir -p .codeadd/wiki
  echo "# Wiki" > .codeadd/wiki/index.md
  printf '{"updatedAt":"2026-07-15","command":"/add.wiki","gitHead":"0000000000000000000000000000000000dead"}\n' > .codeadd/wiki/.meta.json
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"WIKI:present"* ]]
  [[ "$output" == *"WIKI_STALE_COUNT:unknown"* ]]
  [[ "$output" == *"WIKI_HINT:Wiki stamp unreachable — consider /add.wiki update"* ]]
}

# ─── SETUP CONTRACT (materialized-state staleness) ───────────────────

mk_receipt() { # $1 = setup-shape value, $2 = optional line ending
  mkdir -p docs/qa
  if [ "${2:-}" = "crlf" ]; then
    printf -- '---\r\ntype: setup-receipt\r\nsetup-shape: %s\r\n---\r\n\r\n## Decision Log\r\n\r\n| d | setup-shape: sha256:deadbeefdeadbeef | x |\r\n' "$1" > docs/qa/qa-setup.md
  else
    printf -- '---\ntype: setup-receipt\nsetup-shape: %s\n---\n\n## Decision Log\n\n| d | setup-shape: sha256:deadbeefdeadbeef | x |\n' "$1" > docs/qa/qa-setup.md
  fi
}

mk_sidecar() { # $1 = shape
  mkdir -p .codeadd
  printf '{\n  "version": 1,\n  "contracts": {\n    "add.qa-setup": {\n      "shape": "%s",\n      "paths": [\n        { "path": "a", "owner": "setup" }\n      ]\n    }\n  }\n}\n' "$1" > .codeadd/contracts.json
}

@test "SETUP_QA: absent when no QA state exists" {
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA:absent"* ]]
}

@test "SETUP_QA: stale when config.json exists without a receipt" {
  mkdir -p docs/qa
  echo '{}' > docs/qa/config.json
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA:stale"* ]]
  [[ "$output" == *"SETUP_QA_STALE:yes"* ]]
  [[ "$output" == *"SETUP_QA_HINT:"*"/add.qa-setup"* ]]
  [[ "$output" != *"SETUP_QA:unreceipted"* ]]
}

# A project holding only the qa-project skill must NOT read as absent:
# STEP 1.5 would classify it FIRST-RUN and re-materialize over the install.
# One case per provider install destination (cli/src/providers.js).
@test "SETUP_QA: stale from the qa-project skill alone, for EVERY provider dest" {
  for d in .claude .agents .agent .cursor .opencode; do
    rm -rf .claude .agents .agent .cursor .opencode
    mkdir -p "$d/skills/qa-project"
    echo "x" > "$d/skills/qa-project/SKILL.md"
    run "$SCRIPTS_DIR/status.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"SETUP_QA:stale"* ]] || { echo "provider dest $d not probed"; return 1; }
  done
}

@test "SETUP_QA: current when recorded shape equals shipped" {
  mk_receipt sha256:aaaaaaaaaaaaaaaa
  mk_sidecar sha256:aaaaaaaaaaaaaaaa
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA:present"* ]]
  [[ "$output" != *"SETUP_QA_STALE"* ]]
  [[ "$output" != *"SETUP_QA_CONTRACT"* ]]
  [[ "$output" != *"SETUP_QA_BEHIND"* ]]
}

@test "SETUP_QA: stale when recorded shape differs from shipped" {
  mk_receipt sha256:aaaaaaaaaaaaaaaa
  mk_sidecar sha256:bbbbbbbbbbbbbbbb
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA_STALE:yes"* ]]
  [[ "$output" == *"SETUP_QA_HINT:"*"/add.qa-setup"* ]]
  [[ "$output" != *"SETUP_QA_BEHIND"* ]]
}

@test "SETUP_QA: a malformed setup-shape is stale, never guessed current" {
  mkdir -p docs/qa
  printf -- '---\nsetup-shape: v1\n---\n' > docs/qa/qa-setup.md
  mk_sidecar sha256:aaaaaaaaaaaaaaaa
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA_STALE:yes"* ]]
  [[ "$output" != *"SETUP_QA_CONTRACT"* ]]
}

@test "SETUP_QA: pre-contracts install stays silent (no sidecar, no hint)" {
  mk_receipt sha256:aaaaaaaaaaaaaaaa
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA:present"* ]]
  [[ "$output" != *"SETUP_QA_HINT"* ]]
  [[ "$output" != *"SETUP_QA_STALE"* ]]
}

@test "SETUP_QA: a CRLF receipt is read, not degraded to unreadable" {
  mk_receipt sha256:aaaaaaaaaaaaaaaa crlf
  mk_sidecar sha256:bbbbbbbbbbbbbbbb
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA_STALE:yes"* ]]
}

# The frontmatter-bounded read must never match the agent-written body, where
# mk_receipt plants a decoy shape inside the Decision Log.
@test "SETUP_QA: the Decision Log body never leaks into the recorded value" {
  mk_receipt sha256:aaaaaaaaaaaaaaaa
  mk_sidecar sha256:aaaaaaaaaaaaaaaa
  run "$SCRIPTS_DIR/status.sh"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SETUP_QA:present"* ]]
  [[ "$output" != *"SETUP_QA_STALE"* ]]
  [[ "$output" != *"deadbeef"* ]]
}
