# Development Execution Specialist

Coordinator for feature implementation, bug fixes, and epic feature execution. Detects context automatically, coordinates subagents, validates against skill checklists, and ensures 100% compilation.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules). Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format.

`/add.build` is a **mutator**: it updates existing `plan.md`/`about.md` during/after implementation. It MUST NOT allocate new IDs — always reuse the `[NNNN]F` from existing frontmatter. Every write MUST follow the cache rule: read existing doc → preserve valid content → complement with new info → bump `updated:` to today. `created:`, `id:`, and `type:` are immutable.

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).
> **ARGS:** `/add.build [F[NNNN]] [--worktree]` — explicit feature target + opt-in worktree; composable with `feature N` (legacy epic).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1:  Run context mapper          → FIRST COMMAND (status.sh)
STEP 2:  Branch setup                → build-setup.sh (create-or-checkout feature branch)
STEP 3:  Detect context              → Epic subfeature | Legacy feature flag | Simple mode
STEP 4:  Parse key variables         → Extract FEATURE_ID, flags, phase
STEP 5:  Determine mode              → DEVELOPMENT | TASKS | CORRECTION | FEATURE
STEP 6:  Load feature docs           → BEFORE any implementation
STEP 7:  Load project knowledge      → IF WIKI:present (status.sh)
STEP 8:  Determine scope             → Database, Backend, Workers, Frontend
STEP 9:  Execution decision          → DIRECT (1 area) | SUBAGENTS (2+ areas)
STEP 10: Implementation              → Per mode, over the Agent Roster
STEP 11: Area validation             → Validator agents (MANDATORY per area)
STEP 12: Routed correction           → Consume ## Fix Routing; write the resolution annex
STEP 13: Compliance Gate             → Cross-reference RF/RN vs implementation
STEP 14: Integration verification    → Build MUST pass
STEP 15: Mutate docs + Validation Gate → Cache rule + schema gate on plan.md/about.md
STEP 16: Log iteration               → BEFORE informing user
STEP 17: Completion                  → Inform user based on mode
```

**ABSOLUTE INVARIANTS (enforce at all gates):**

- **FEATURE DETECTION:** Must identify FEATURE_ID before proceeding. If missing → run status.sh
- **DEPENDENCY CHECK:** If feature flag passed → validate N-1 complete in iterations.jsonl before implementation
- **DOCS FIRST:** Always load feature docs (about.md, discovery.md, plan.md) before dispatching subagents
- **EXECUTION DECISION VISIBLE:** Output decision (DIRECT vs SUBAGENTS) before ANY implementation
- **VALIDATOR MANDATORY:** After each area implementation → dispatch validator immediately. Do NOT report completion without validator
- **IMMUTABILITY:** Never allocate new [NNNN]F ID. Always reuse from existing frontmatter. Preserve created:, id:, type:
- **IDEMPOTENCY:** Check file existence before writing. Never overwrite artefacts without reading first
- **BUILD GATE:** Code MUST compile 100%. Fix errors before advancing
- **GIT CLEAN:** Leave files unstaged. Never git add/commit/stage
- **BRANCH SETUP FIRST:** build-setup.sh MUST have exited 0 before any implementation step

---

## STEP 1: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

This script provides ALL context: BRANCH (feature ID, type, phase), FEATURE_DOCS (HAS_PLAN, HAS_DESIGN, HAS_IMPLEMENTATION), DESIGN_SYSTEM, FRONTEND (path, components), PROJECT_CONTEXT (ARCHITECTURE_REF), ALL_FEATURES (count, list), FEATURES (X/Y if Legacy Epic), HAS_EPIC, EPIC_CURRENT_SF, HAS_TASKS, TASKS_FILE, LAST_CHECKPOINT.

### 1.1 Cross-Feature Decisions Context (PRD0031)

**IF `.codeadd/project/decisions.jsonl` exists:**
1. READ file
2. FILTER entries where `"type":"pivot"`
3. TAKE last 20 entries
4. ADD to working context as: "Previous pivots to avoid repeating:"
   - `[agent] pivoted from "[from]" → "[decision]": [reason]`

---

## STEP 2: Branch Setup

**Runs the feature's recorded branch decision (from `about.md` `branch:`) — build executes, never decides the name.**

1. Resolve target: explicit `F[NNNN]` arg > `FEATURE_ID` from status.sh (branch) > ask-gate listing `PENDING:` features from status.sh output. Normalize to the canonical `[NNNN][L]` ID the script expects.
2. Run `bash .codeadd/scripts/build-setup.sh <FEATURE_ID> [--worktree]`.
3. On non-zero exit: STOP, show stderr verbatim, let the user decide (dirty tree, missing docs, invalid `branch:`) — NEVER auto-resolve.
4. If `WORKTREE:` in output: inform the path and instruct that implementation happens inside it (subsequent commands run in that directory).
5. Then re-run `status.sh` (now on the feature branch/worktree) and continue to STEP 3.

---

## STEP 3: Detect Context

**IF HAS_EPIC=true:**
1. READ `docs/features/${FEATURE_ID}/epic.md`
2. IDENTIFY current subfeature: `EPIC_CURRENT_SF` from script output
3. IF `EPIC_CURRENT_SF` is empty → STOP. Inform all subfeatures complete → suggest `/add.done`
4. SET `SF_DIR = docs/features/${FEATURE_ID}/subfeatures/${EPIC_CURRENT_SF}-*/`
5. SET `TASKS_FILE = ${SF_DIR}/tasks.md` (if `HAS_TASKS=true`)
6. Inform: "Executing subfeature `${EPIC_CURRENT_SF}` of epic `${FEATURE_ID}`"
7. ASSEMBLE `TASK_DOCUMENTS`:
   - `docs/features/${FEATURE_ID}/subfeatures/${EPIC_CURRENT_SF}-*/about.md`
   - `docs/features/${FEATURE_ID}/discovery.md`
   - `design.md` (if `HAS_DESIGN`) — resolved per the `feature-design` **Location** rule in `{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first, feature-level fallback)
   - `${SF_DIR}/plan.md` (if exists)
   - `${SF_DIR}/tasks.md` (if `HAS_TASKS=true`)

**ELSE IF user passed `feature N` (legacy feature flag):**
1. EXTRACT feature number from input
2. READ `plan.md` → CHECK for `## Features` section (indicates Legacy Epic)
3. IF no Features section → WARN and execute normally (go to Simple Mode below)
4. IF Features section exists:
   - Extract tasks for feature N from plan.md
   - VALIDATE dependency: query `iterations.jsonl` for feature N-1 completion
   - IF N-1 not complete → BLOCK implementation, inform which feature must complete first
   - IF N-1 complete → proceed (treat as feature N subfeature context)

**ELSE (Simple Mode):**
ASSEMBLE `TASK_DOCUMENTS` from `docs/features/${FEATURE_ID}/`:
- `about.md`
- `discovery.md`
- `design.md` (if exists)
- `plan.md` (if exists)
- `tasks.md` (if `HAS_TASKS=true`)

---

## STEP 4: Parse Key Variables

Extract from status.sh output:
- **FEATURE_ID** — if empty and count=1, use it; if multiple, ask
- **CURRENT_PHASE** — discovered | designed | planned
- **HAS_PLAN** — use plan.md as SOURCE
- **HAS_DESIGN** — use design.md for UI
- **HAS_FOUNDATIONS** — use design-system.md for tokens
- **ARCHITECTURE_REF** — path to patterns
- **HAS_IMPLEMENTATION** — if true + bug → CORRECTION MODE

---

## STEP 5: Determine Mode (MANDATORY OUTPUT)

### 5.1 Context Detection (AUTOMATIC)

This command detects automatically:
1. **TASKS** - `tasks.md` exists (PRD0032) → execute by structured tasks
2. **DEVELOPMENT** - When pending tasks exist in plan.md or about.md (no tasks.md)
3. **CORRECTION** - When feature already implemented + user describes a problem
4. **FEATURE (Epic)** - When user passes flag `feature N` (legacy mode)

### 5.2 Detection Flow (priority order)

**Routed-findings pre-check (BEFORE the ladder):** IF the highest
`docs/features/${FEATURE_ID}/review-NNN.md` carries a `## Fix Routing` table with
unresolved rows and no `## Resolution Annex` closing them → this invocation is a
**correction leg**: enter CORRECTION MODE and work the routed rows. There is no
separate `qa` argument mode — one correction contract, one path.

1. Unresolved `## Fix Routing` rows on the highest `review-NNN.md`? → CORRECTION MODE (routed)
2. User described PROBLEM/BUG + feature implemented? → CORRECTION MODE
3. `HAS_TASKS=true`? → TASKS MODE
4. User passed `feature N`? → FEATURE MODE
5. plan.md has pending tasks? → DEVELOPMENT MODE
6. about.md exists but no plan.md? → DEVELOPMENT MODE (from about.md)
7. None? → Inform user to run /add.new first

**Legacy Epic edge case:** IF plan.md has `## Features` AND no flag passed → check FEATURES from status.sh → ask to execute next incomplete feature or inform all complete.

### 5.3 Bug Detection

Keywords: bug, erro, error, broke, not working, problem, issue, failure, failed, fix, crash, broken
Pattern: unexpected vs expected behavior

### 5.4 Mode Output (MANDATORY)

**Output this BEFORE proceeding:**

```markdown
## Detected Mode: [TASKS | DEVELOPMENT | CORRECTION | FEATURE]

**Feature:** ${FEATURE_ID}
**Context:** [brief explanation of what will be done]

Starting...
```

---

## STEP 6: Load Feature Documentation (BEFORE implementation)

Read all relevant feature docs based on status.sh flags:
- `plan.md` (if HAS_PLAN=true) — use as primary source
- `design.md` (if HAS_DESIGN=true) — follow mobile-first layouts, component specs, design tokens. Resolve it per the `feature-design` **Location** rule in `{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first, feature-level fallback)
- `about.md` — ALWAYS
- `discovery.md` — ALWAYS
- `${ARCHITECTURE_REF}` — from script output
- `design-system.md` (if HAS_FOUNDATIONS=true)

**Priority (domain-scoped):** `plan.md` wins on technical contracts (endpoints, DTOs, schemas, module structure, types); `design.md` wins on layout, hierarchy, tokens, states, and every `## Design Contract` dimension; `about.md` remains the functional authority.
Fallback for anything not covered: plan.md > design.md + about.md > about.md + discovery.md.

---
<!-- feature:qa-pipeline:qa-fix -->
<!-- /feature:qa-pipeline:qa-fix -->

## STEP 7: Load Project Knowledge (IF wiki exists)

**IF WIKI:present (status.sh):**
1. Identify the relevant area(s) for this task (backend, frontend, database, etc.)
2. Read {{addpath:wiki/index.md}}, then the {{addpath:wiki/domains/<area>.md}} page(s) for the areas being touched (+ {{addpath:wiki/conventions.md}} when conventions matter for the work at hand)
3. Follow patterns documented. These are project-specific conventions.

**If WIKI:absent:** Run `/add.wiki` to generate, or continue with generic best practices.

**If ITERATIONS output exists from script:** Previous /add.build sessions context - avoid repeating fixes.
<!-- feature:tdd-pipeline:detect-framework -->
<!-- /feature:tdd-pipeline:detect-framework -->

**Test generation self-check:** IF no "Test Framework Detection" section appears above, the `tdd-pipeline` feature is disabled and **test generation is disabled** for this build — no unit or integration tests will be produced. State it once, here, with the remedy: `codeadd features enable tdd-pipeline`. Do NOT stop; implementation proceeds unchanged.

**E2E self-check:** IF no "E2E Spec Authoring" section appears in STEP 11, the `qa-pipeline` feature is disabled and **E2E spec authoring is disabled** — no `<surface>.qa.spec` will be authored. State it once with the remedy: `codeadd features enable qa-pipeline` (plus `/add.qa-setup` if QA was never bootstrapped). Do NOT stop.

---

## STEP 8: Determine Scope (DEVELOPMENT and FEATURE modes)

**Auto-detect from plan.md/about.md:**
- **Backend** — endpoints, controllers, DTOs, API
- **Workers** — queues, jobs, background
- **Frontend** — pages, components, UI, forms
- **Database** — entities, tables, migrations

---

## STEP 9: Execution Decision (MANDATORY OUTPUT)

**MUST output this decision BEFORE any implementation:**

```markdown
## Execution Decision

**Areas identified:** [list: Database, Backend, Workers, Frontend]
**Count:** [1 | 2 | 3 | 4]

**Strategy:** [DIRECT | SUBAGENTS]
**Justification:** [1 area = implement directly | 2+ areas = use subagents]
```

**Rules:**

| Areas | Strategy | Action |
|-------|----------|--------|
| **1 area** (only Backend, only Frontend, only Database) | DIRECT | You implement everything |
| **2+ areas** (Backend+Frontend, Database+Backend, etc) | SUBAGENTS | Dispatch via Task tool |

**PROHIBITED:** Skip this decision. If "Execution Decision" does not appear in output, execution is WRONG.

---

## STEP 10: Implementation (Per Mode)

### TASKS MODE (when tasks.md exists)

**Activated when:** `HAS_TASKS=true` and `TASKS_FILE` is set.

**MANDATORY:** Load `{{skill:add-tasks-checklist/SKILL.md}}` BEFORE entering this mode. The skill defines the 5-section schema, tick rules, `[!]` semantics, "non-trivial change" rule, the Resume/Rerun procedure, the tick-application procedure, and the validator report shape.

**FIRST in TASKS MODE:** Run the **Resume vs Rerun Procedure** from `add-tasks-checklist`. This sets `RESUME_MODE = resume | rerun_all`.

**Flow:**

```
1. FILTER §3 Execution tasks per RESUME_MODE (rules defined in skill).
2. GROUP filtered tasks by service (database, backend, frontend, test).
3. VALIDATE deps: build execution graph (tasks with no deps first).
4. EXECUTION ORDER: test → database → backend → frontend.
5. AFTER all task groups complete: proceed to STEP 11 (validation).
```

<!-- feature:tdd-pipeline:tasks-flow -->
<!-- /feature:tdd-pipeline:tasks-flow -->
<!-- feature:tdd-pipeline:gate -->
<!-- /feature:tdd-pipeline:gate -->
<!-- feature:tdd-pipeline:verify-red -->
<!-- /feature:tdd-pipeline:verify-red -->

**Subagent prompt addition for TASKS MODE:**

Include in each subagent's prompt the relevant tasks from tasks.md:
```
## YOUR TASKS (from tasks.md)
| ID | Description | Files | Verify |
|----|-------------|-------|--------|
| [only tasks for your service area] |

Execute ALL tasks in order. After each task, confirm the verify command passes.
<!-- feature:tdd-pipeline:awareness -->
<!-- /feature:tdd-pipeline:awareness -->
```

**DECISION LOGGING (MANDATORY for TASKS MODE subagents):**
Each subagent MUST append to `docs/features/${FEATURE_ID}/decisions.jsonl` **only on pivot** (changed approach):
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/decisions.jsonl" "pivot" "[area]" '"from":"[old]","decision":"[new]","reason":"[why]","attempt":[N],"error":"[if any]"'
```

---

### Agent Roster

Every unit of work in this command is one row below. The command coordinates —
gates, mode detection, state reads, merges — and the agents do the work. An
orchestrator driving this command reads the same roster and dispatches the same
agents directly, at depth 1.

| Agent | Capability | Inputs | Expected report |
|-------|-----------|--------|-----------------|
| `@database-agent` | full-access | `TASK_DOCUMENTS`, area task list, `${FEATURE_ID}` | `FILES_CREATED`, `FILES_MODIFIED`, `BUILD_STATUS`, decisions logged |
| `@backend-agent` | full-access | `TASK_DOCUMENTS`, area task list, `${FEATURE_ID}` | `FILES_CREATED`, `FILES_MODIFIED`, `BUILD_STATUS`, decisions logged |
| `@frontend-agent` | full-access | `TASK_DOCUMENTS`, area task list, `${FEATURE_ID}`, `design.md` | `FILES_CREATED`, `FILES_MODIFIED`, `BUILD_STATUS`, decisions logged |
| `@reviewer-agent` | read-only | area `FILES_CREATED`/`FILES_MODIFIED`, checklist | `CHECKLIST_RESULTS`, `VIOLATIONS_FOUND`, `SPEC_STATUS` |
| `@test-agent` | full-access (test files only) | `AREA`, `MODE`, `TEST_COMMAND`, `AREA_FILES`, `CONTRACT_TESTS` | `FILES_CREATED`, `TESTS_PASSING`, `TEST_COUNT`, `RED_TEST` (CORRECTION) |
| `@fix-agent` | full-access | `AREA`, `ROUTED_ROWS`, `ATTEMPT`, `MAX_ATTEMPTS`, `BUILD_ERRORS` | `ROWS_RESOLVED`, `ROWS_FAILED`, `NOT_MINE`, `DISPUTED`, `BUILD_STATUS` |
| `@e2e-agent` | read-write (test files only, no MCP) | in-scope surface, `screens.json`, component paths | authored spec paths, `screens.json` updates, green-confirm result |
| `@ux-agent` | read-write (`design.md` only) | routed design-spec finding + contract-line citation | amendment appended to `## Design Review` |

**Fallback:** if a named agent is not installed on this engine, dispatch a
generic subagent at the same capability plus the area's skill
(`add-database-development`, `add-backend-development`,
`add-frontend-development`, `add-code-review`, `add-ux-design`). Every dispatch
directive in this command is self-sufficient inline for exactly that reason.

**Named agents have skills preloaded, model optimized, and tool restrictions enforced via their definition.** When dispatching a named agent, skills in the prompt are already loaded — include them as reference for the agent's task, not as load instructions.

### Correction Dispatch (`@fix-agent`)

Every correction in this command goes through `@fix-agent`. There is no
anonymous fix subagent.

**DISPATCH AGENT: `@fix-agent`** [full-access, standard] — one per affected area, parallel across areas.
- **Inputs:** `AREA`, this area's `ROUTED_ROWS`, `ATTEMPT`, `MAX_ATTEMPTS = 3`, `BUILD_ERRORS` verbatim.
- **`ATTEMPT` is supplied by this command, never by the agent.** A leaf agent cannot see its own history, so the cap lives here where the loop can see it.

⛔ IF `ATTEMPT` would exceed `MAX_ATTEMPTS`:
  ⛔ DO NOT dispatch `@fix-agent` again
  ⛔ DO NOT continue to the next STEP as if the build passed
  ✅ DO report the unresolved rows, the last `BUILD_ERRORS`, and STOP

Rows the agent returns as `NOT_MINE` (`data-seed`, `env-boot`,
capability-invalid, `@ux-agent` design-spec) are surfaced to the user as
decisions — never silently re-dispatched.

### Subagent Dispatch Template

**DISPATCH AGENT: @${AREA}-agent** (see Agent Roster)
- **Prompt:** [use Universal Subagent Prompt below]
<!-- feature:tdd-pipeline:test-dispatch -->
<!-- /feature:tdd-pipeline:test-dispatch -->

---

### DEVELOPMENT MODE

#### 10.1 Dependency Order & Parallelization

```
Contract Tests (if exist) -> Database -> Backend API -> [parallel: Workers, Frontend]
```

- DB + Backend + Frontend: Sequential DB → Parallel Backend + Frontend
- Backend + Frontend only: Parallel
- Single area: Direct (no subagents)

#### 10.2 Universal Subagent Prompt Template

Use this template for ALL area subagents (database, backend, frontend, workers):

```
You are implementing the ${AREA} for feature ${FEATURE_ID}.

## MANDATORY: Self-Bootstrap Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files in TASK_DOCUMENTS below
3. IF WIKI:present in output: read {{addpath:wiki/index.md}}, then {{addpath:wiki/domains/${AREA}.md}} (+ {{addpath:wiki/conventions.md}} when conventions matter for this task)

## TASK_DOCUMENTS (read ALL — source of truth)
${TASK_DOCUMENTS}

## MANDATORY: Load Development Skill
Read: skill add-${AREA}-development (patterns, validation, code style)
- For Frontend: skill will auto-load ux-design if design.md exists
- Reference component docs as needed: shadcn, tailwind-v3, motion, recharts, tanstack

## IDEMPOTENCY: Before writing files
- Check if file exists → READ FIRST before overwriting
- Never delete + recreate; preserve and patch instead
- If test/config files exist, validate before write

## Your Tasks
${TASK_LIST}

## DECISION LOGGING (PRD0031 — pivots only)
On approach change: `bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/decisions.jsonl" "pivot" "[area]" '"from":"[old]","decision":"[new]","reason":"[why]","attempt":[N]'`

## Deliverables
- Files created/modified + decisions logged
- Build passes: ${BUILD_COMMAND}
```

#### 10.3 Area-Specific Notes

**Paths and build commands are project-specific. Consult CLAUDE.md for exact locations and commands.**

- **Database:** Entities, Kysely types, Knex migration, Repository, barrel exports
- **Backend:** Module structure, DTOs, Commands, Events, Controller, Service, register in app.module.ts
- **Workers:** Worker, Processor, queue config, error handling, register in worker.module.ts
- **Frontend:** Pages, Components, Zustand store, Hooks, mirror DTOs, API integration, forms
  - MANDATORY: Load skill `add-frontend-development` first
  - The frontend skill will check for design.md → if missing, auto-load ux-design/SKILL.md

**Skills Reference (MANDATORY):**
- Backend: skill `add-backend-development` (RESTful, IoC, DTOs, CQRS, Multi-tenancy)
- Database: skill `add-database-development` (Entities, Migrations, Kysely, Repositories)
- Frontend: skill `add-frontend-development` (Types, Hooks, State, API, Forms, Routing + auto-loads ux-design)

#### 10.4 Subagent Dispatch

**CRITICAL:** When dispatching multiple independent subagents, send ALL Task tool calls in a SINGLE message.

**DISPATCH AGENT: @${AREA}-agent** (see Named Agent Mapping in section 9)
- **Prompt:** Use Universal Subagent Prompt Template (section 9.2)

#### 10.5 Coordination Flow

```
Dispatch DB agent -> Wait -> Verify build
    | (if fails, dispatch @fix-agent with ATTEMPT)
Dispatch Backend + Frontend (parallel) -> Wait -> Verify build
    | (if fails, dispatch @fix-agent with ATTEMPT)
Documentation -> DONE
```

On a failing build, dispatch `@fix-agent` per the **Correction Dispatch** contract
above: one per affected area, `ROUTED_ROWS` derived from the build errors, and the
`ATTEMPT` counter tracked here. The cap is `MAX_ATTEMPTS = 3` per area.

---

### CORRECTION MODE

> Activated when: Feature implemented + user describes problem/bug

#### C1: Bug Investigation (Autonomous)

1. **Extract** from user message: bug description, error messages, area (frontend/API/worker), repro steps
   - If critical info missing: Ask ONE consolidated question
2. **Load context**: about.md, discovery.md, plan.md (if HAS_PLAN), ARCHITECTURE_REF
3. **Identify files** from plan.md and `CHANGED` output (STEP 1) likely involved in the bug
4. **Investigate root cause**: READ files → TRACE flow → COMPARE with contracts → CHECK business rules → IDENTIFY specific root cause

#### C2: Fix Implementation

- Fix root cause, not symptom. Follow existing code patterns. Add defensive checks if needed.
- **Frontend fixes:** FIRST load skill `add-ux-design`, follow all patterns, Grep skill docs for relevant components/styling/animation. Read design-system.md if exists.
- **CRITICAL:** Code MUST compile 100%. Fix errors before proceeding.

---

## STEP 11: Area Validation (MANDATORY after each area)

**After EACH area is implemented, dispatch a Validator Subagent to validate code against skill checklists and auto-correct violations.**

**IF VALIDATOR NOT EXECUTED:** DO NOT report area completion or advance to next area. Execute Validator IMMEDIATELY.
**IF SPEC_STATUS = INCOMPLETE:** DO NOT report area completion. Implement missing spec items OR escalate to user.

**MANDATORY:** Validator MUST load `{{skill:add-tasks-checklist/SKILL.md}}` to apply tick rules, "non-trivial change" definition, and `[!]` failure-marker semantics.

### 11.1 Validator Subagent Prompt Template

**DISPATCH AGENT: @reviewer-agent**

```
You are the ${AREA} VALIDATOR for feature ${FEATURE_ID}.
Validate implemented code against skill checklist, audit spec compliance against plan.md prose,
and tick tasks.md (§2 TDD, §3 Execution, §4 Acceptance Checklist) for items covered by your area.

## Self-Bootstrap (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read skill: add-${AREA}-development
3. Read skill: add-tasks-checklist (tick rules, [!] semantics, "non-trivial change")
4. Read ALL files in FILES_CREATED and FILES_MODIFIED below
5. Read plan.md (prose contracts) and tasks.md (canonical checklist)

## IMPLEMENTED FILES
${FILES_CREATED}
${FILES_MODIFIED}

## TASK A — Skill Checklist Validation
1. Extract "## Validation Checklist" from skill file
2. Read EVERY implemented file
3. Validate each checklist item → if violated, prepare fix
4. Apply ALL fixes (do NOT defer to review)
5. Run build command (from CLAUDE.md) → must pass

RULES: No questions. Checklist violations = MUST FIX. Build MUST pass.

## TASK B — Spec Compliance + tasks.md Tick (CURRENT AREA ONLY)

Follow the **Tick Application Procedure** defined in the `add-tasks-checklist` skill (sections "Tick Application Procedure" and "Section Rules"). In `add.build`, the validator WRITES `tasks.md` directly — do NOT emit a JSON report (that path is for a coordinator that owns the write, e.g. `/add.plan-to-ready`).

After applying ticks, RECOMPUTE §1 Requirements Coverage per the skill's derived-state rule.

IF any §3 or §4 item for this area is `[!]` or `[ ]`: SET SPEC_STATUS = INCOMPLETE.

## REPORT
CHECKLIST_RESULTS, VIOLATIONS_FOUND, VIOLATIONS_FIXED, FILES_MODIFIED, BUILD_STATUS,
TICKS_APPLIED (count of [x] set), TICKS_FAILED (count of [!] set with reasons), SPEC_STATUS.
```

### 11.2 Validation Dispatch Flow

Dispatch validator for each area immediately after its implementation agent returns. After ALL validators complete, run build verification. If the build fails, dispatch `@fix-agent` per the **Correction Dispatch** contract, passing the validator outputs and build errors as `ROUTED_ROWS` + `BUILD_ERRORS`, and the tracked `ATTEMPT`.

### 11.3 Validation Gates Tick (END OF BUILD)

After ALL area validators return AND build verification passes, run the **Validation Gates Procedure** from `{{skill:add-tasks-checklist/SKILL.md}}`. This performs the final write to `tasks.md` (§5 ticks + final §1 recompute).

**Hard requirement:** every gate command listed in CLAUDE.md `validation_gates` MUST be invoked via Bash in this session. Tick `[x]` only when the most recent invocation exited 0 (after fixing touched-file failures). Tick `[!]` when touched-file failures persist after a fix attempt. Append untouched-file failures to `### Known Issues` (cap 10 + `+N more`).

**Migration nudge:** if CLAUDE.md has no `validation_gates` block, emit the one-line nudge and skip this sub-step (no gates to enforce).

**CRITICAL:** Pass FILES_CREATED and FILES_MODIFIED from each implementation subagent to its validator.
<!-- feature:qa-pipeline:e2e-dispatch -->
<!-- /feature:qa-pipeline:e2e-dispatch -->

---

## STEP 12: Routed Correction Contract

`/add.review` emits every finding class — code review, spec compliance, build
failures, red validation gates, and QA judgement — as rows in one `## Fix Routing`
table on `review-NNN.md`. This command is the only thing that applies them.

**Applies whether or not the `qa-pipeline` feature is enabled.** The review writes
`## Fix Routing` from its ungated base body, so the correction contract cannot be
feature-gated either.

### 12.1 Consume

Read `## Fix Routing` from the **highest** `docs/features/${FEATURE_ID}/review-NNN.md`.
Work rows in the table's given order, respecting `Blocked by`. Dispatch
`@fix-agent` per area per the **Correction Dispatch** contract, with the tracked
`ATTEMPT`.

### 12.2 Resolution annex (write-back)

After the fix wave, append to the SAME `review-NNN.md` you consumed:

```markdown
## Resolution Annex

| ID | Route | Outcome | Files | Note |
|----|-------|---------|-------|------|
| <finding id> | <agent> | resolved / failed / not-mine / disputed | <paths> | <one line> |
```

- **Append-only.** Add rows for the IDs this wave touched; NEVER rewrite or remove an existing row, and never re-add an ID already present.
- Set the document's frontmatter `status: finalized` **exactly once**, when the wave completes. A second annex write on an already-finalized document adds its new rows and leaves `status` alone.
- Report IDs exactly as `## Fix Routing` gave them — a renamed ID cannot be matched back to its row.

⛔ IF the highest `review-NNN.md` has no `## Fix Routing` section:
  ⛔ DO NOT guess a dispatch
  ⛔ DO NOT fall back to grouping findings by severity
  ✅ DO tell the user to run `{{cmd:add.review}}`, which writes a fresh report carrying routes

---

## STEP 13: Coordinator Compliance Gate [HARD STOP]

DO NOT report completion without executing this step.

1. Re-read TASK_DOCUMENTS to extract RF/RN list
2. Cross-reference each RF/RN against FILES_CREATED/FILES_MODIFIED
3. Quick-read implementation files to confirm requirement exists in code
4. IF any RF/RN missing: list items → dispatch `@fix-agent` (routed rows = the missing RF/RN, with the tracked `ATTEMPT`) → re-run gate
5. IF ALL RF/RN covered: proceed to STEP 13

---

## STEP 14: Integration Verification

1. **Contract Adherence:** Endpoints, events, commands match plan
2. **Build Verification:** Run project build command (see CLAUDE.md)
<!-- feature:tdd-pipeline:verification -->
<!-- /feature:tdd-pipeline:verification -->
<!-- feature:tdd-pipeline:coverage -->
<!-- /feature:tdd-pipeline:coverage -->

**CRITICAL:** Code MUST compile 100%. Fix errors before proceeding.

---

## STEP 15: Mutate Docs + Validation Gate

**IF implementation requires updating `plan.md` or `about.md`:**

1. READ the full existing doc (idempotency check)
2. Capture immutable fields: `id: [NNNN]F`, `created:`, `type:`
3. Preserve valid content → only complement new findings
4. Bump `updated:` to today
5. Apply schema validation gate from `{{skill:add-doc-schemas/SKILL.md}}`

For EACH mutated doc, execute the validation gate (schema: `feature-plan` or `feature-about`). Verify immutables preserved. DO NOT advance to STEP 16 until gates return PASS.

Reference: **cache documental** rule from `{{skill:add-doc-schemas/SKILL.md}}`

---

## STEP 16: Log Iteration + Checkpoint

**14.1 Log Iteration (MANDATORY before user notification):**

Check if `docs/features/${FEATURE_ID}/iterations.jsonl` exists. If not, create empty file. Append entry:

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "<TYPE>" "/dev" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

IF `HAS_EPIC=true`, add `"sf"` field: `"sf":"${EPIC_CURRENT_SF}"`

**Types:** `add | fix | refactor | test | docs`

**14.2 Checkpoint Tag — NOT created here (MANDATORY):**

⛔ DO NOT create a `checkpoint/*` tag here. This is one pinned path, not a
condition to satisfy: the `GIT CLEAN` invariant (line 54) — leave files
unstaged, never git add/commit/stage — means `/add.build` never makes a
commit. A tag created at this point would land on the commit that already
existed BEFORE this subfeature's work, so restoring from it would restore the
state before the subfeature. The tag has always been a lie, and gating its
creation behind a condition would only wrap the same lie in a different hat —
there is no condition this block could ever evaluate to true.

`{{cmd:add.plan-to-ready}}` re-creates `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done`
(or `checkpoint/${FEATURE_ID}-done` on a simple feature) at the moment it makes
the real commit. Until that command runs, `status.sh:322`'s `LAST_CHECKPOINT`
correctly reports nothing — there is no commit yet for a tag to point at.

**14.3 Update epic.md (IF HAS_EPIC=true only):**

IF file exists, resolve the Subfeatures row whose `id` cell equals
`${EPIC_CURRENT_SF}` and set that row's `status` column to `done`. Read and
write columns **by header name**, per the `epic` schema
(`{{skill:add-doc-schemas/references/new-feature.md}}`) — never by
string-matching the row's old text.

⛔ DO NOT write the `checkpoint` cell. Per 14.2, this step creates no commit,
so it owns none of that column: the schema writes `checkpoint` only from the
command that creates the commit the tag points at (`{{cmd:add.plan-to-ready}}`).

---

## STEP 17: Completion (Inform user based on mode)

Inform user of completion including: feature ID, files summary (per area count), build status, and next suggested commands.

**Always include suggested next command from ecosystem map:** Read skill `add-ecosystem` Main Flows section.
- After development → `/add.review`
- After correction → `/add.review`

---

## Skip Planning for Simple Features

For simple features (single field, small UI change):
1. Skip `/plan` command
2. Go directly from `/feature` to `/dev`
3. Implement from `about.md` and `discovery.md`

---

## Example: Development Mode (2+ areas = SUBAGENTS)

```
# User executes: /dev
# Agent detects: F0003-user-preferences active, plan.md with pending tasks

"Detected Mode: DEVELOPMENT
Feature: F0003-user-preferences
Context: Implementing tasks from plan.md

## Execution Decision
**Areas identified:** Database, Backend, Frontend
**Count:** 3
**Strategy:** SUBAGENTS
**Justification:** 3 areas = mandatory subagents

Dispatching subagents..."
```

---

## Error Handling

| Error | Action |
|-------|--------|
| No feature detected | Inform user to run /feature first |
| Dependency not met (Epic) | Block and inform which feature must complete first |
| Build fails after implementation | Dispatch `@fix-agent` with the error output as `ROUTED_ROWS` + `BUILD_ERRORS` |
| Build fails after validation | Dispatch `@fix-agent` with validator output + build errors |
| `@fix-agent` exhausted `MAX_ATTEMPTS` | Report unresolved rows and last errors; STOP. Never advance as if the build passed |
| >4 areas detected | Split into maximum parallel groups |
| No plan.md or about.md | Inform user to run /feature or /plan first |
