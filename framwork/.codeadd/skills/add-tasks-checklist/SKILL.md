---
name: add-tasks-checklist
description: Use when generating, reading, or ticking tasks.md — defines the canonical 5-section schema, tick rules per section, failure marker semantics, "non-trivial change" rule, and the architect subagent prompt template. Single source of truth for tasks.md across add.plan, add.build, add.autopilot, add.review, add-code-review, add-delivery-validation.
---

# tasks.md Checklist Schema

## Overview

`tasks.md` is the **single source of progress truth** for a feature (or subfeature, in epics). `plan.md` is the frozen spec; `tasks.md` is the developer's activity breakdown that absorbs all tick state — area work, contract validation, TDD evidence, and quality gates.

## When to Use

- Generating a new `tasks.md` for a feature or subfeature
- Per-area validator ticking sections after implementation
- Deciding whether a section/item gets `[x]` or `[!]`
- Reading tick state to gate review or delivery
- Coordinator merging multi-area validator reports in autopilot

## When NOT to Use

- Generating `plan.md` (use `add-planning`) — `plan.md` carries prose contracts, not ticks
- Generating `about.md` (use `add-feature-specification`)
- Tick state for hotfixes (hotfixes do not use `tasks.md`)

## Canonical Structure

`tasks.md` has **6 sections in this exact order with these exact headings** (validators parse by exact text). The 6th section (`## Validation Gates`) is **conditional** — present only when CLAUDE.md exposes a `validation_gates` block.

```markdown
# Tasks: [feature or SF name]

## Metadata

| Field | Value |
|-------|-------|
| Complexity | SIMPLE / STANDARD / COMPLEX |
| Total tasks | [N] |
| Services | database, backend, frontend, test |

## Requirements Coverage

- [ ] RF01 — [requirement title]
- [ ] RF02 — [requirement title]
- [ ] RN01 — [rule title]

## TDD

- [ ] T-TEST-01 Contract test for RF01 — `path/file.spec.ts`
- [ ] T-TEST-02 Contract test for RN01 — `path/file.spec.ts`

## Execution

- [ ] T01 [max 10 words description]
  - Service: database
  - Files: `path/file.ts`
  - Deps: -
  - Verify: `npm run migrate`
- [ ] T02 [max 10 words description]
  - Service: backend
  - Files: `path/a.ts`, `path/b.ts`
  - Deps: T01
  - Verify: tests pass

## Acceptance Checklist

- [ ] Route `POST /users` returns 201 on valid signup (RF01)
- [ ] DTO `UserDto` exposes `id`, `email`, `createdAt` (RF01)
- [ ] Service `UsersService.create` enforces unique email (RN01)
- [ ] Queue `user.signup` published on success (RF01)

## Validation Gates

- [ ] Run `npm run lint` and fix failures in files touched by this work
- [ ] Run `npm run typecheck` and fix failures in files touched by this work
- [ ] Run `npm test` and fix failures in files touched by this work
- [ ] Run `npm run build` and fix failures
- [ ] Run `npm run format:check` and fix failures in files touched by this work
```

> The exact items above are auto-derived from CLAUDE.md `validation_gates`. The example shows a Node project; for Python the items would read `Run \`pytest\` …`, for .NET `Run \`dotnet test\` …`, etc. — language-agnostic.

## Section Rules

### `## Requirements Coverage`

- One line per RF/RN from `about.md`. The architect MUST include every RF and RN.
- **Tick rule:** **auto-derived.** A RF/RN is `[x]` when ALL Execution tasks AND ALL Acceptance items that reference it are `[x]`. Validators do not tick this section directly — the coordinator (or `add.build`'s post-validator step) recomputes derived state after every write.

### `## TDD`

- One line per contract test. Format: `- [ ] T-TEST-NN <description> — \`path/file.spec.ts\``.
- TDD tasks MUST come before their corresponding Execution tasks (architect ordering rule).
- **Tick rule:** validator ticks `[x]` when the test file is added or modified in the diff AND the test command exits 0 for that file. If file added but tests fail or assertions are trivially empty (no `expect(...)`), set `[!]` with reason.

### `## Execution`

- Task line format: `- [ ] TNN <description, ≤10 words>` followed by 4 metadata sub-bullets (Service, Files, Deps, Verify).
- Allowed services: `database`, `backend`, `frontend`, `test`, `infra`. Exactly one service per task. Maximum 3 files per task; if more, split.
- `Deps`: comma-separated task IDs (e.g., `T01, T03`) or `-` if none.
- `Verify`: MANDATORY single line — a runnable command, curl, or browser check.
- **Tick rule:** validator ticks `[x]` when **all** files listed in `Files` appear in the diff with **non-trivial changes**. If only some files appear, or all changes are trivial, set `[!]` with reason.

### `## Acceptance Checklist`

- One line per contract item: routes, DTOs, services, queues, events, business rules. Every line MUST end with the RF/RN reference in parentheses (e.g., `(RF01)`, `(RN03)`, `(RF01, RN02)`).
- Architect rule: every RF and RN listed in `## Requirements Coverage` MUST be referenced by at least one Acceptance item. `add.review` cross-checks this.
- **Tick rule:** validator ticks `[x]` when the contract is verifiable in the diff (route handler exists with expected method/path; DTO field present; service method implements expected behavior). If partial (e.g., route exists but does not enforce a rule), set `[!]` with reason.

### `## Validation Gates`

- **Auto-derived** from the `validation_gates` JSON block in CLAUDE.md (written by `add-architecture-discovery` / `add.xray`). One checklist line per detected gate. If the block is absent or empty, **omit this section entirely** — never fabricate gate items.
- Item line format: `- [ ] Run \`<gate command>\` and fix failures in files touched by this work` (drop "in files touched by this work" for the `build` gate, which is global).
- The `format` gate appears only when CLAUDE.md provides a non-mutating check command (e.g. `prettier --check`, `ruff format --check`, `dotnet format --verify-no-changes`).
- **Tick rule (build/autopilot):** the validator MUST actually invoke the gate command via Bash, capture exit code and output, then:
  - Exit 0 → tick `[x]`.
  - Exit ≠ 0 → identify failures restricted to files in `git diff --name-only` against the feature base; fix only those; re-run; tick `[x]` only when the re-run is green. Never tick on red. Never tick based on self-attestation.
  - Pre-existing failures in untouched files → record under `### Known Issues` (see below). Do not block the tick on touched-file fixes.
- **Tick rule (review):** the reviewer MUST **independently re-run** every gate command (do NOT trust existing `[x]` ticks from build). If the re-run goes red on touched files, set `[!]`; if it goes red only on untouched files, leave `[x]` and update `### Known Issues`.
- **`### Known Issues` subsection** (under `## Validation Gates`): one bullet per pre-existing failure outside the touched set. Format: `- <file>:<line> — <short failure summary>`. Capped at **10 entries**; if more, append `- +N more (run \`<gate>\` for full list)`.

## Failure Marker `[!]`

When a tick attempt detects a problem, replace `[ ]` with `[!]` and append an inline reason:

```
- [!] T03 Implement signup endpoint — REASON: route handler missing email uniqueness check
- [!] Route POST /users returns 201 (RF01) — REASON: returns 200 on success, not 201
```

**Rules:**
- Single line, freeform text.
- Maximum 120 characters after `REASON:`.
- Name the failing artefact (file, route, field, assertion). No jargon, no stack traces.
- A `[!]` task is re-attempted on next `add.build` resume; on success the validator overwrites `[!]` with `[x]` and removes the `— REASON:` suffix.

## "Non-Trivial Change" Definition

A diff change to a file counts as **non-trivial** when at least one of these holds:

- A new symbol is declared (function, class, type, const, route, schema field).
- An existing symbol's signature, return type, or body is modified beyond formatting.
- A test contains at least one `expect(...)` / `assert(...)` that exercises behavior.
- A configuration value (route path, env key, migration column) is added or changed.

A change is **trivial** (does NOT count) when it is exclusively:

- Whitespace, indentation, or line-ending changes.
- Import statement reorder with no new imports.
- Comment additions or rewordings.
- Unused variable rename.

## Tick Authority (who writes ticks)

| Section | `add.build` | `add.autopilot` |
|---------|-------------|-----------------|
| §1 Requirements Coverage | derived after validator writes | coordinator recomputes after batch write |
| §2 TDD | per-area validator | coordinator merges per-area reports |
| §3 Execution | per-area validator | coordinator merges per-area reports |
| §4 Acceptance Checklist | per-area validator | coordinator merges per-area reports |
| §5 Validation Gates | post-validator final step (must run real commands) | coordinator final step (must run real commands) |
| `[!]` setting | per-area validator | coordinator (from validator reports) |

In `add.autopilot`, **only the coordinator writes** to `tasks.md`. Area validators emit a structured report and the coordinator performs a single merge-write per batch — this avoids parallel-write contention without locks.

## Validator Report Shape (autopilot)

Per-area validators in `add.autopilot` MUST return a JSON-shaped report:

```json
{
  "area": "backend",
  "ticks": {
    "tdd": [{"id": "T-TEST-02", "status": "x"}],
    "execution": [{"id": "T03", "status": "x"}, {"id": "T04", "status": "!", "reason": "missing uniqueness check on email"}],
    "acceptance": [{"key": "Route POST /users returns 201", "status": "x", "rf": ["RF01"]}]
  },
  "files_inspected": ["src/api/users.ts", "src/services/users.ts"]
}
```

The coordinator merges all area reports, recomputes derived `## Requirements Coverage` state, and writes `tasks.md` once.

## Architect Subagent Prompt Template

When `add.plan` STEP 10.4 dispatches the architect subagent, use this prompt template:

```
You are the ARCHITECT for feature ${FEATURE_ID} (subfeature ${EPIC_CURRENT_SF} if epic).

## CONTEXT
Read these files in order:
1. ${PLAN_DIR}/plan.md  — PRIMARY: technical contracts (prose)
2. ${PLAN_DIR}/about.md — Scope, RF/RN, acceptance criteria
3. docs/features/${FEATURE_ID}/discovery.md — Constraints
4. ${PLAN_DIR}/plan-test-spec.md — Test specifications (if exists)

## TASK
Generate `${PLAN_DIR}/tasks.md` following the canonical schema defined in
the `add-tasks-checklist` skill. Use the EXACT section headings:
  ## Metadata
  ## Requirements Coverage
  ## TDD
  ## Execution
  ## Acceptance Checklist
  ## Validation Gates    (omit entirely if CLAUDE.md has no validation_gates block)

## RULES
- ## Requirements Coverage MUST list every RF and RN from about.md.
- ## TDD tasks MUST precede their corresponding ## Execution tasks.
- Every ## Acceptance Checklist item MUST end with `(RFNN)` or `(RNNN)` reference;
  every RF/RN in §1 MUST be referenced by at least one §4 item.
- ## Execution tasks: 1 service per task, max 3 files, ≤10 words description,
  4 metadata sub-bullets (Service, Files, Deps, Verify), Verify is mandatory.
- All checkboxes start as `[ ]`. Do NOT pre-tick anything.
- ## Validation Gates: read CLAUDE.md `validation_gates` JSON block. Emit one item per detected gate using the format `- [ ] Run \`<command>\` and fix failures in files touched by this work` (drop the "in files touched" suffix for the `build` gate). If the block is absent or empty, omit this section entirely — never fabricate gates.
- Complexity scoring: SIMPLE ≤5 tasks, STANDARD 6–12, COMPLEX 13+ (warn: should be split as epic).
- Service order (TDD ordering): test → database → backend → frontend.

## OUTPUT
Write `${PLAN_DIR}/tasks.md` only. Do not modify any other file.
```

## Resume vs Rerun Procedure

Used at the start of `add.build` TASKS MODE (and any consumer that re-enters a feature mid-flight). Follow these steps exactly:

1. **Read** `tasks.md` from the feature/subfeature directory.
2. **Count** items across §2 TDD + §3 Execution + §4 Acceptance Checklist (do NOT count §1 or §5):
   - `pending = count(- [ ])`
   - `done    = count(- [x])`
   - `failed  = count(- [!])`
3. **Present** counts to the user (e.g., "5 pending, 8 done, 1 failed") and **ask**:
   > "Resume (re-execute only `[ ]` and `[!]` items) or rerun all (re-execute everything regardless of state)?"
4. **Resolve** user response conversationally (e.g., "resume", "continue", "rerun", "do all") — no CLI flags. On silence or headless mode, default to **resume**.
5. **Set** `RESUME_MODE = resume | rerun_all` for the consumer to filter the §3 Execution task list.

`resume` filter rule: include §3 Execution items with state `[ ]` or `[!]`; skip `[x]`.
`rerun_all` filter rule: include all §3 Execution items regardless of state.

## Tick Application Procedure (per area validator)

Used by the per-area validator subagent in `add.build` (writes directly) and `add.autopilot` (emits report; coordinator writes). Follow exactly:

1. **Inspect diff:** run `git diff` against the feature branch base. This is the source of truth for what changed — NOT any FILES_CREATED/FILES_MODIFIED list, which can lie.
2. **Filter** `tasks.md` items for the CURRENT AREA:
   - §2 TDD → tests where the test file lives in the area's path
   - §3 Execution → tasks with `Service: ${AREA}`
   - §4 Acceptance Checklist → items whose contracts (from `plan.md` prose) belong to the area
3. **Apply tick rules** (defined in "Section Rules" above):
   - §2 TDD: `[x]` if test file added/modified AND test command exits 0; else `[!]` with reason
   - §3 Execution: `[x]` if ALL `Files` in metadata appear in diff with NON-TRIVIAL changes; else `[!]`
   - §4 Acceptance: `[x]` if contract verifiable in diff; divergent/missing → `[!]`
4. **Auto-fix** divergent items where safe (wrong status code, missing field, etc.); re-tick on success.
5. **Output:**
   - In `add.build`: write the updated `tasks.md` directly (full file).
   - In `add.autopilot`: emit the JSON validator report (see "Validator Report Shape"); the coordinator merges and writes.
6. **Set** `SPEC_STATUS = INCOMPLETE` if any §3 or §4 item for this area is `[!]` or `[ ]`.

## Coordinator Merge Procedure (autopilot only)

Used by the coordinator after collecting all per-area validator reports. Coordinator is the SOLE writer of `tasks.md` in autopilot.

1. **Collect** the JSON tick report from every area validator.
2. **Merge** ticks across areas (no conflicts expected — areas don't overlap on §3 tasks; if conflict, last-writer-wins is acceptable since both must agree on diff state).
3. **Recompute** §1 Requirements Coverage: a RF/RN line ticks `[x]` only if ALL §3 Execution AND §4 Acceptance items referencing it (via `(RFNN/RNNN)`) are `[x]`.
4. **Write** `tasks.md` ONCE per batch with all merged ticks.

## Validation Gates Procedure (end of build / autopilot / review)

Used by `add.build` (or autopilot coordinator, or `add.review`) AFTER all area validators complete. This is where `## Validation Gates` items get ticked. **Self-attestation is forbidden.** Every tick must correspond to an actual command invocation captured in this session.

### Pre-condition: migration nudge

Read CLAUDE.md. If no `validation_gates` JSON block exists, emit ONE single line to the user:

> Note: `validation_gates` not detected in CLAUDE.md. Run `/add.xray` to enable validation gates.

Do NOT auto-run xray. Do NOT block. Skip the rest of this procedure when the block is absent (no gates to enforce). When the block is present but `## Validation Gates` is missing from `tasks.md`, that is a planning bug — surface it but still run the gates from CLAUDE.md.

### Steps

1. Parse `validation_gates` from CLAUDE.md → ordered list of `(intent, command)` pairs.
2. Compute `TOUCHED_FILES = git diff --name-only <feature-base>...HEAD` (plus uncommitted changes for `add.build`).
3. For EACH `(intent, command)`:
   1. Invoke the command via Bash. Capture stdout/stderr and exit code.
   2. Exit 0 → set the corresponding `## Validation Gates` item to `[x]`. Continue.
   3. Exit ≠ 0 → parse output for file-scoped failures (each tool reports `path:line:…`).
      - Partition into `TOUCHED_FAILURES` (path ∈ TOUCHED_FILES) and `UNTOUCHED_FAILURES` (rest).
      - Fix `TOUCHED_FAILURES` (or dispatch a fix subagent). Re-invoke the gate. If green → `[x]`. If still red on touched files → `[!] — REASON: <≤120 chars naming the failing artefact>`. NEVER tick `[x]` while red on a touched file.
      - Append `UNTOUCHED_FAILURES` to `### Known Issues` under `## Validation Gates`. Cap at 10 entries; append `- +N more (run \`<command>\` for full list)` when truncating.
4. Recompute `## Requirements Coverage` derived state one final time.
5. Single write to `tasks.md`.

### Review variant (independent re-run)

When invoked by `add.review`, ignore any pre-existing `[x]` ticks on `## Validation Gates` — re-run every gate command from scratch. The review's job is to verify, not to trust.

> Backwards-compatibility note: this procedure replaces the prior "Quality Gates Procedure". The §5 section was renamed `## Quality Gates → ## Validation Gates`. Existing `tasks.md` files generated before this change use the old heading; consumers should treat both headings as the same section during the transition window, but new writes always use `## Validation Gates`.

## Validation Checklist

```
[ ] All 5 section headings present and exact text
[ ] ## Requirements Coverage covers every RF/RN from about.md
[ ] ## TDD tasks precede their corresponding ## Execution tasks
[ ] Every ## Acceptance Checklist item ends with (RFNN/RNNN) reference
[ ] Every RF/RN in §1 is referenced by ≥1 §4 item
[ ] ## Execution tasks have all 4 metadata sub-bullets
[ ] No more than 3 files per ## Execution task
[ ] All checkboxes initialized as [ ]
[ ] No tick lives in plan.md (plan.md is frozen)
```
