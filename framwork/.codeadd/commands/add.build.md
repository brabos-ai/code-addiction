# Development Execution Specialist

Coordinator for feature implementation, bug fixes, and epic feature execution. Detects context automatically, coordinates subagents, validates against skill checklists, and ensures 100% compilation.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules). Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format.

`/add.build` is a **mutator**: it updates existing `plan.md`/`about.md` during/after implementation. It MUST NOT allocate new IDs — always reuse the `[NNNN]F` from existing frontmatter. Every write MUST follow the cache rule: read existing doc → preserve valid content → complement with new info → bump `updated:` to today. `created:`, `id:`, and `type:` are immutable.

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).
> **ARGS:** `/add.build [F[NNNN]] [--worktree]` — explicit feature target + opt-in worktree; composable with `feature N` (legacy epic) and `qa` (qa-pipeline).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Run context mapper         → FIRST COMMAND (status.sh)
STEP 1.5: Branch setup             → build-setup.sh (create-or-checkout feature branch)
STEP 2: Detect context             → Epic subfeature | Legacy feature flag | Simple mode
STEP 3: Parse key variables        → Extract FEATURE_ID, flags, phase
STEP 4: Determine mode             → DEVELOPMENT | CORRECTION | FEATURE | QA-FIX (/add.build qa)
STEP 5: Load feature docs          → BEFORE any implementation
STEP 6: Load project patterns      → IF PROJECT_SKILL or PROJECT_DOCS exist
STEP 7: Determine scope            → Database, Backend, Workers, Frontend
STEP 8: Execution decision         → DIRECT (1 area) | SUBAGENTS (2+ areas)
STEP 9: Implementation             → Per mode (development/correction/feature)
STEP 10: Area validation           → Validator subagents (MANDATORY per area)
STEP 11: Compliance Gate           → Cross-reference RF/RN vs implementation
STEP 12: Integration verification  → Build MUST pass
STEP 13: Mutate docs + Validation Gate → Cache rule + schema gate on plan.md/about.md
STEP 14: Log iteration             → BEFORE informing user
STEP 15: Completion                → Inform user based on mode
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

## STEP 1.5: Branch Setup

**Runs the feature's recorded branch decision (from `about.md` `branch:`) — build executes, never decides the name.**

1. Resolve target: explicit `F[NNNN]` arg > `FEATURE_ID` from status.sh (branch) > ask-gate listing `PENDING:` features from status.sh output. Normalize to the canonical `[NNNN][L]` ID the script expects.
2. Run `bash .codeadd/scripts/build-setup.sh <FEATURE_ID> [--worktree]`.
3. On non-zero exit: STOP, show stderr verbatim, let the user decide (dirty tree, missing docs, invalid `branch:`) — NEVER auto-resolve.
4. If `WORKTREE:` in output: inform the path and instruct that implementation happens inside it (subsequent commands run in that directory).
5. Then re-run `status.sh` (now on the feature branch/worktree) and continue to STEP 2.

---

## STEP 2: Detect Context

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

## STEP 3: Parse Key Variables

Extract from status.sh output:
- **FEATURE_ID** — if empty and count=1, use it; if multiple, ask
- **CURRENT_PHASE** — discovered | designed | planned
- **HAS_PLAN** — use plan.md as SOURCE
- **HAS_DESIGN** — use design.md for UI
- **HAS_FOUNDATIONS** — use design-system.md for tokens
- **ARCHITECTURE_REF** — path to patterns
- **HAS_IMPLEMENTATION** — if true + bug → CORRECTION MODE

---

## STEP 4: Determine Mode (MANDATORY OUTPUT)

### 4.1 Context Detection (AUTOMATIC)

This command detects automatically:
1. **TASKS** - `tasks.md` exists (PRD0032) → execute by structured tasks
2. **DEVELOPMENT** - When pending tasks exist in plan.md or about.md (no tasks.md)
3. **CORRECTION** - When feature already implemented + user describes a problem
4. **FEATURE (Epic)** - When user passes flag `feature N` (legacy mode)

### 4.2 Detection Flow (priority order)

**QA-Fix pre-check (BEFORE the ladder):** IF the command was invoked with an explicit `qa` argument (`/add.build qa`, or an explicit `--qa` / report-path signal) → SKIP the mode ladder entirely and go to the **QA-Fix Flow (qa-pipeline)** section (below STEP 5). IF that section is NOT present (the `qa-pipeline` feature is disabled) → tell the user to run `codeadd features enable qa-pipeline` and STOP; do NOT fall through to a normal build mode.

1. User described PROBLEM/BUG + feature implemented? → CORRECTION MODE
2. `HAS_TASKS=true`? → TASKS MODE
3. User passed `feature N`? → FEATURE MODE
4. plan.md has pending tasks? → DEVELOPMENT MODE
5. about.md exists but no plan.md? → DEVELOPMENT MODE (from about.md)
6. None? → Inform user to run /feature first

**Legacy Epic edge case:** IF plan.md has `## Features` AND no flag passed → check FEATURES from status.sh → ask to execute next incomplete feature or inform all complete.

### 4.3 Bug Detection

Keywords: bug, erro, error, broke, not working, problem, issue, failure, failed, fix, crash, broken
Pattern: unexpected vs expected behavior

### 4.4 Mode Output (MANDATORY)

**Output this BEFORE proceeding:**

```markdown
## Detected Mode: [TASKS | DEVELOPMENT | CORRECTION | FEATURE]

**Feature:** ${FEATURE_ID}
**Context:** [brief explanation of what will be done]

Starting...
```

---

## STEP 5: Load Feature Documentation (BEFORE implementation)

Read all relevant feature docs based on status.sh flags:
- `plan.md` (if HAS_PLAN=true) — use as primary source
- `design.md` (if HAS_DESIGN=true) — follow mobile-first layouts, component specs, design tokens
- `about.md` — ALWAYS
- `discovery.md` — ALWAYS
- `${ARCHITECTURE_REF}` — from script output
- `design-system.md` (if HAS_FOUNDATIONS=true)

**Priority:** plan.md > design.md + about.md > about.md + discovery.md

---
<!-- feature:qa-pipeline:qa-fix -->
<!-- /feature:qa-pipeline:qa-fix -->

## STEP 6: Load Project Patterns (IF exist)

**IF status.sh outputs PROJECT_SKILL (new format):**
1. Identify the relevant area(s) for this task (backend, frontend, database, etc.)
2. Run: `bash .codeadd/scripts/pattern-search.sh [area]` → get TOPIC names + LINES ranges
3. Read ONLY the topics relevant to the current task using `Read offset:START limit:LENGTH`
4. Follow patterns documented. These are project-specific conventions.

**IF status.sh outputs PROJECT_DOCS (legacy format):**
Read ALL project pattern files listed in PROJECT_DOCS from status.sh output.

**If neither exists:** Run `/add.xray` to generate, or continue with generic best practices.

**If ITERATIONS output exists from script:** Previous /add.build sessions context - avoid repeating fixes.

---

## STEP 7: Determine Scope (DEVELOPMENT and FEATURE modes)

**Auto-detect from plan.md/about.md:**
- **Backend** — endpoints, controllers, DTOs, API
- **Workers** — queues, jobs, background
- **Frontend** — pages, components, UI, forms
- **Database** — entities, tables, migrations

---

## STEP 8: Execution Decision (MANDATORY OUTPUT)

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

## STEP 9: Implementation (Per Mode)

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
5. AFTER all task groups complete: proceed to STEP 10 (validation).
```

<!-- feature:tdd:tasks-flow -->
<!-- /feature:tdd:tasks-flow -->
<!-- feature:tdd:gate -->
<!-- /feature:tdd:gate -->
<!-- feature:tdd:verify-red -->
<!-- /feature:tdd:verify-red -->

**Subagent prompt addition for TASKS MODE:**

Include in each subagent's prompt the relevant tasks from tasks.md:
```
## YOUR TASKS (from tasks.md)
| ID | Description | Files | Verify |
|----|-------------|-------|--------|
| [only tasks for your service area] |

Execute ALL tasks in order. After each task, confirm the verify command passes.
<!-- feature:tdd:awareness -->
<!-- /feature:tdd:awareness -->
```

**DECISION LOGGING (MANDATORY for TASKS MODE subagents):**
Each subagent MUST append to `docs/features/${FEATURE_ID}/decisions.jsonl` **only on pivot** (changed approach):
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/decisions.jsonl" "pivot" "[area]" '"from":"[old]","decision":"[new]","reason":"[why]","attempt":[N],"error":"[if any]"'
```

---

### Named Agent Mapping

| Area | Named Agent | Fallback (if agent not installed) |
|------|-------------|-----------------------------------|
| Database | `@database-agent` | Generic subagent + skill add-database-development |
| Backend | `@backend-agent` | Generic subagent + skill add-backend-development |
| Frontend | `@frontend-agent` | Generic subagent + skill add-frontend-development |
| Validation | `@reviewer-agent` | Generic subagent + skill add-code-review |

**Named agents have skills preloaded, model optimized, and tool restrictions enforced via their definition.** When dispatching a named agent, skills in the prompt are already loaded — include them as reference for the agent's task, not as load instructions.

### Subagent Dispatch Template

**DISPATCH AGENT: @${AREA}-agent** (see Named Agent Mapping)
- **Prompt:** [use Universal Subagent Prompt below]

---

### DEVELOPMENT MODE

#### 9.1 Dependency Order & Parallelization

```
Contract Tests (if exist) -> Database -> Backend API -> [parallel: Workers, Frontend]
```

- DB + Backend + Frontend: Sequential DB → Parallel Backend + Frontend
- Backend + Frontend only: Parallel
- Single area: Direct (no subagents)

#### 9.2 Universal Subagent Prompt Template

Use this template for ALL area subagents (database, backend, frontend, workers):

```
You are implementing the ${AREA} for feature ${FEATURE_ID}.

## MANDATORY: Self-Bootstrap Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files in TASK_DOCUMENTS below
3. IF PROJECT_SKILL in output: run `bash .codeadd/scripts/pattern-search.sh ${AREA}` → read relevant topics
   ELSE IF PROJECT_DOCS: read matching app patterns (database patterns cross-app)

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

#### 9.3 Area-Specific Notes

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

#### 9.4 Subagent Dispatch

**CRITICAL:** When dispatching multiple independent subagents, send ALL Task tool calls in a SINGLE message.

**DISPATCH AGENT: @${AREA}-agent** (see Named Agent Mapping in section 9)
- **Prompt:** Use Universal Subagent Prompt Template (section 9.2)

#### 9.5 Coordination Flow

```
Dispatch DB Subagent -> Wait -> Verify build
    | (if fails, dispatch fix subagent)
Dispatch Backend + Frontend (parallel) -> Wait -> Verify build
    | (if fails, dispatch fix subagent)
Documentation -> DONE
```

**Fix Subagent Prompt:**
```
You are FIXING BUILD ERRORS for feature ${FEATURE_ID}.

## Error Output
[paste build error output]

## Your Task
Fix ALL build errors. Do not stop until build passes 100%.
```

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

## STEP 10: Area Validation (MANDATORY after each area)

**After EACH area is implemented, dispatch a Validator Subagent to validate code against skill checklists and auto-correct violations.**

**IF VALIDATOR NOT EXECUTED:** DO NOT report area completion or advance to next area. Execute Validator IMMEDIATELY.
**IF SPEC_STATUS = INCOMPLETE:** DO NOT report area completion. Implement missing spec items OR escalate to user.

**MANDATORY:** Validator MUST load `{{skill:add-tasks-checklist/SKILL.md}}` to apply tick rules, "non-trivial change" definition, and `[!]` failure-marker semantics.

### 10.1 Validator Subagent Prompt Template

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

Follow the **Tick Application Procedure** defined in the `add-tasks-checklist` skill (sections "Tick Application Procedure" and "Section Rules"). In `add.build`, the validator WRITES `tasks.md` directly — do NOT emit a JSON report (that path is for autopilot).

After applying ticks, RECOMPUTE §1 Requirements Coverage per the skill's derived-state rule.

IF any §3 or §4 item for this area is `[!]` or `[ ]`: SET SPEC_STATUS = INCOMPLETE.

## REPORT
CHECKLIST_RESULTS, VIOLATIONS_FOUND, VIOLATIONS_FIXED, FILES_MODIFIED, BUILD_STATUS,
TICKS_APPLIED (count of [x] set), TICKS_FAILED (count of [!] set with reasons), SPEC_STATUS.
```

### 10.2 Validation Dispatch Flow

Dispatch validator for each area immediately after its implementation subagent returns. After ALL validators complete, run build verification. If build fails, dispatch fix subagent with validator outputs + build errors.

### 10.3 Validation Gates Tick (END OF BUILD)

After ALL area validators return AND build verification passes, run the **Validation Gates Procedure** from `{{skill:add-tasks-checklist/SKILL.md}}`. This performs the final write to `tasks.md` (§5 ticks + final §1 recompute).

**Hard requirement:** every gate command listed in CLAUDE.md `validation_gates` MUST be invoked via Bash in this session. Tick `[x]` only when the most recent invocation exited 0 (after fixing touched-file failures). Tick `[!]` when touched-file failures persist after a fix attempt. Append untouched-file failures to `### Known Issues` (cap 10 + `+N more`).

**Migration nudge:** if CLAUDE.md has no `validation_gates` block, emit the one-line nudge and skip this sub-step (no gates to enforce).

**CRITICAL:** Pass FILES_CREATED and FILES_MODIFIED from each implementation subagent to its validator.

---

## STEP 11: Coordinator Compliance Gate [HARD STOP]

DO NOT report completion without executing this step.

1. Re-read TASK_DOCUMENTS to extract RF/RN list
2. Cross-reference each RF/RN against FILES_CREATED/FILES_MODIFIED
3. Quick-read implementation files to confirm requirement exists in code
4. IF any RF/RN missing: list items → dispatch fix subagent → re-run gate
5. IF ALL RF/RN covered: proceed to STEP 12

---

## STEP 12: Integration Verification

1. **Contract Adherence:** Endpoints, events, commands match plan
2. **Build Verification:** Run project build command (see CLAUDE.md)
<!-- feature:tdd:verification -->
<!-- /feature:tdd:verification -->

**CRITICAL:** Code MUST compile 100%. Fix errors before proceeding.

---

## STEP 13: Mutate Docs + Validation Gate

**IF implementation requires updating `plan.md` or `about.md`:**

1. READ the full existing doc (idempotency check)
2. Capture immutable fields: `id: [NNNN]F`, `created:`, `type:`
3. Preserve valid content → only complement new findings
4. Bump `updated:` to today
5. Apply schema validation gate from `{{skill:add-doc-schemas/SKILL.md}}`

For EACH mutated doc, execute the validation gate (schema: `feature-plan` or `feature-about`). Verify immutables preserved. DO NOT advance to STEP 14 until gates return PASS.

Reference: **cache documental** rule from `{{skill:add-doc-schemas/SKILL.md}}`

---

## STEP 14: Log Iteration + Checkpoint

**14.1 Log Iteration (MANDATORY before user notification):**

Check if `docs/features/${FEATURE_ID}/iterations.jsonl` exists. If not, create empty file. Append entry:

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "<TYPE>" "/dev" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

IF `HAS_EPIC=true`, add `"sf"` field: `"sf":"${EPIC_CURRENT_SF}"`

**Types:** `add | fix | refactor | test | docs`

**14.2 Create Checkpoint Tag (MANDATORY):**

Check if tag exists before creating (idempotency guard):

```bash
# Simple feature
git tag "checkpoint/${FEATURE_ID}-done" 2>/dev/null || true

# Epic subfeature (HAS_EPIC=true)
git tag "checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done" 2>/dev/null || true
```

NOTE: Checkpoint tags use `checkpoint/` prefix (separate from release `v*`). Temporarily — cleaned up by `/add.done`.

**14.3 Update epic.md (IF HAS_EPIC=true only):**

IF file exists, update subfeature status line:
`| ${EPIC_CURRENT_SF} | [name] | [obj] | pending |` → `| ${EPIC_CURRENT_SF} | [name] | [obj] | done | ${FEATURE_ID}-${EPIC_CURRENT_SF}-done |`

---

## STEP 15: Completion (Inform user based on mode)

Inform user of completion including: feature ID, files summary (per area count), build status, and next suggested commands.

**Always include suggested next command from ecosystem map:** Read skill `add-ecosystem` Main Flows section.
- After development → `/add.review` or `/add.test`
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
| Build fails after implementation | Dispatch fix subagent with error output |
| Build fails after validation | Dispatch fix subagent with validator output + build errors |
| >4 areas detected | Split into maximum parallel groups |
| No plan.md or about.md | Inform user to run /feature or /plan first |
