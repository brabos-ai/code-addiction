#!/usr/bin/env bats
# task-brief.sh — extracts ONE `## Execution` task's full block from tasks.md
# into its own file (plan 0078-PLAN--superpowers-adoption-002-durable-executor,
# F2). RED-FIRST: the script under test does not exist yet — every test below is
# expected to fail until F2 lands. That failure IS the point.
#
# Contract under test:
#   Usage: bash task-brief.sh <TASKS_FILE> <TASK_ID> <OUT_DIR>
#   - Extracts the `- [ ] TNN <description>` line plus ALL SIX sub-bullets
#     (Service, Files, Deps, Consumes, Produces, Verify) — the shape the
#     add-tasks-checklist skill defines. Consumes/Produces are the whole reason
#     the brief exists: a dispatched agent never sees the other task's code.
#   - Scoped to `## Execution`. A `T-TEST-01` line in `## TDD` is NOT a task,
#     and the last task must not swallow `## Acceptance Checklist`.
#   - Writes the block to its own file, prints BRIEF=<path> (plus SUBBULLETS=<n>).
#   - Creates OUT_DIR and, when absent, a `.gitignore` inside it containing `*`
#     — F4's scratch contract: briefs never reach a commit.
#   - exit 0 on success. exit 2 ONLY on CLI misuse, which includes a TASK_ID
#     that is not in `## Execution`: an empty brief is how an agent gets
#     dispatched against nothing.

setup() {
  load 'test_helper/common-setup'
  common_setup
}

teardown() {
  common_teardown
}

TASKS="docs/features/0003F-signup/tasks.md"
OUT="docs/features/0003F-signup/_build"

# write_tasks <path> — the canonical add-tasks-checklist shape: a TDD section
# whose ids share T01's prefix, two Execution tasks with all six sub-bullets,
# and an Acceptance Checklist immediately after the last task.
write_tasks() {
  mkdir -p "$(dirname "$1")"
  cat > "$1" <<'EOF'
# Tasks: Signup

## Metadata

| Field | Value |
|-------|-------|
| Complexity | STANDARD |

## Requirements Coverage

- [ ] RF01 — user signs up

## TDD

- [ ] T-TEST-01 Contract test for RF01 — `test/users.spec.ts`
- [ ] T-TEST-02 Contract test for RN01 — `test/rules.spec.ts`

## Execution

- [ ] T01 Create users table migration
  - Service: database
  - Files: `db/migrations/001_users.ts`
  - Deps: -
  - Consumes: -
  - Produces: `UserRepository.insert(row: NewUser): Promise<User>`
  - Verify: `npm run migrate`
- [ ] T02 Implement signup endpoint
  - Service: backend
  - Files: `src/api/users.ts`, `src/services/users.ts`
  - Deps: T01
  - Consumes: `UserRepository.insert(row: NewUser): Promise<User>` (T01)
  - Produces: `UsersService.create(dto: CreateUserDto): Promise<UserDto>`
  - Verify: `npm test -- users`

## Acceptance Checklist

- [ ] Route `POST /users` returns 201 on valid signup (RF01)
- [ ] Service `UsersService.create` enforces unique email (RN01)

## Validation Gates

- [ ] Run `npm run lint` and fix failures in files touched by this work
EOF
}

brief_path() {
  printf '%s\n' "$output" | grep '^BRIEF=' | sed 's/^BRIEF=//'
}

# ─── L2.2 — all six sub-bullets, and the .gitignore ──────────────────────────

@test "L2.2: a task with six sub-bullets writes all six" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T02 "$OUT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"BRIEF="* ]]
  BRIEF="$(brief_path)"
  [ -f "$BRIEF" ]
  grep -q 'T02 Implement signup endpoint' "$BRIEF"
  grep -q 'Service: backend' "$BRIEF"
  grep -q 'Files: `src/api/users.ts`, `src/services/users.ts`' "$BRIEF"
  grep -q 'Deps: T01' "$BRIEF"
  grep -q 'Consumes: `UserRepository.insert(row: NewUser): Promise<User>` (T01)' "$BRIEF"
  grep -q 'Produces: `UsersService.create(dto: CreateUserDto): Promise<UserDto>`' "$BRIEF"
  grep -q 'Verify: `npm test -- users`' "$BRIEF"
  [[ "$output" == *"SUBBULLETS=6"* ]]
}

@test "L2.2: the brief carries ONLY its own task — the neighbour never leaks in" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T02 "$OUT"
  [ "$status" -eq 0 ]
  BRIEF="$(brief_path)"
  [ "$(grep -c 'T01 Create users table migration' "$BRIEF")" -eq 0 ]
  [ "$(grep -c 'Service: database' "$BRIEF")" -eq 0 ]
  [ "$(grep -c 'npm run migrate' "$BRIEF")" -eq 0 ]
}

@test "L2.2: OUT_DIR is created with a .gitignore containing *" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$OUT"
  [ "$status" -eq 0 ]
  [ -d "$OUT" ]
  [ -f "$OUT/.gitignore" ]
  [ "$(cat "$OUT/.gitignore")" = "*" ]
}

@test "L2.2: the self-ignoring _build/ keeps the brief out of git status (F4)" {
  write_tasks "$TASKS"
  git add -A && git commit -qm "tasks"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$OUT"
  [ "$status" -eq 0 ]
  run git status --porcelain
  [ "$output" = "" ]
}

@test "an existing .gitignore is left alone, never overwritten" {
  write_tasks "$TASKS"
  mkdir -p "$OUT"
  printf '*\n!keep-me.md\n' > "$OUT/.gitignore"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$OUT"
  [ "$status" -eq 0 ]
  grep -q 'keep-me.md' "$OUT/.gitignore"
}

@test "a nested OUT_DIR that does not exist is created" {
  write_tasks "$TASKS"
  DEEP="docs/features/0003F-signup/subfeatures/SF01-auth/_build"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$DEEP"
  [ "$status" -eq 0 ]
  [ -d "$DEEP" ]
  [ -f "$DEEP/.gitignore" ]
}

# ─── Boundaries — the two ways a naive extractor is wrong ────────────────────

@test "the LAST task stops at ## Acceptance Checklist — the section is not swallowed" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T02 "$OUT"
  [ "$status" -eq 0 ]
  BRIEF="$(brief_path)"
  [ "$(grep -c 'Acceptance Checklist' "$BRIEF")" -eq 0 ]
  [ "$(grep -c 'returns 201 on valid signup' "$BRIEF")" -eq 0 ]
  [ "$(grep -c 'npm run lint' "$BRIEF")" -eq 0 ]
}

@test "T01 resolves to the Execution task, never to T-TEST-01 in ## TDD" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$OUT"
  [ "$status" -eq 0 ]
  BRIEF="$(brief_path)"
  grep -q 'T01 Create users table migration' "$BRIEF"
  [ "$(grep -c 'T-TEST-01' "$BRIEF")" -eq 0 ]
  [ "$(grep -c 'users.spec.ts' "$BRIEF")" -eq 0 ]
}

@test "a ticked or failed task is still extractable — the brief is not tick-gated" {
  write_tasks "$TASKS"
  sed -i.bak 's/- \[ \] T01 /- [!] T01 /' "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$OUT"
  [ "$status" -eq 0 ]
  BRIEF="$(brief_path)"
  grep -q 'T01 Create users table migration' "$BRIEF"
  grep -q 'Verify: `npm run migrate`' "$BRIEF"
}

@test "a CRLF tasks.md still yields all six sub-bullets" {
  write_tasks "$TASKS"
  sed 's/$/\r/' "$TASKS" > "$TASKS.crlf" && mv "$TASKS.crlf" "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T02 "$OUT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SUBBULLETS=6"* ]]
}

@test "a task missing sub-bullets is reported by count, not silently padded" {
  mkdir -p "$(dirname "$TASKS")"
  cat > "$TASKS" <<'EOF'
# Tasks: Thin

## Execution

- [ ] T01 Thin task
  - Service: backend
  - Files: `src/a.ts`
  - Verify: tests pass

## Acceptance Checklist
EOF
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$OUT"
  [ "$status" -eq 0 ]
  [[ "$output" == *"SUBBULLETS=3"* ]]
}

# ─── CLI misuse — exit 2 ─────────────────────────────────────────────────────

@test "misuse: no arguments → exit 2" {
  run bash "$SCRIPTS_DIR/task-brief.sh"
  [ "$status" -eq 2 ]
}

@test "misuse: two arguments → exit 2" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01
  [ "$status" -eq 2 ]
}

@test "misuse: TASKS_FILE does not exist → exit 2" {
  run bash "$SCRIPTS_DIR/task-brief.sh" "docs/features/nope/tasks.md" T01 "$OUT"
  [ "$status" -eq 2 ]
}

@test "misuse: a malformed TASK_ID → exit 2" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" "task one" "$OUT"
  [ "$status" -eq 2 ]
}

@test "misuse: a TDD id is not an Execution task id → exit 2" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T-TEST-01 "$OUT"
  [ "$status" -eq 2 ]
}

@test "misuse: a TASK_ID absent from ## Execution → exit 2, and no brief is written" {
  write_tasks "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T99 "$OUT"
  [ "$status" -eq 2 ]
  [[ "$output" != *"BRIEF="* ]]
  [ "$(ls "$OUT" 2>/dev/null | grep -c 'T99' || true)" -eq 0 ]
}

@test "misuse: a tasks.md with no ## Execution section → exit 2" {
  mkdir -p "$(dirname "$TASKS")"
  printf '# Tasks\n\n## TDD\n\n- [ ] T-TEST-01 thing\n' > "$TASKS"
  run bash "$SCRIPTS_DIR/task-brief.sh" "$TASKS" T01 "$OUT"
  [ "$status" -eq 2 ]
}
