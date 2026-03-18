# Development Execution Specialist

Coordinator for feature implementation, bug fixes, and epic feature execution. Detects context automatically, coordinates subagents, validates against skill checklists, and ensures 100% compilation.

---

## Spec

```json
{"modes":{"development":"pending tasks in plan.md/about.md","correction":"feature implemented + user describes bug","feature":"epic feature N"}}
```

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## Yolo Mode

If argument contains `--yolo`:
- Skip ALL [STOP] points
- Accept DEVELOPMENT mode automatically (no mode confirmation)
- Do NOT ask for confirmation at any gate
- Execute to completion without human interaction
- Log all auto-decisions in console output

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Run context mapper         → FIRST COMMAND (status.sh)
STEP 2: Detect feature flag        → IF "feature N" passed
STEP 3: Parse key variables        → Extract FEATURE_ID, flags, phase
STEP 4: Determine mode             → DEVELOPMENT | CORRECTION | FEATURE
STEP 5: Load feature docs          → BEFORE any implementation
STEP 6: Load project patterns      → IF PROJECT_PATHS exist
STEP 7: Determine scope            → Database, Backend, Workers, Frontend
STEP 8: Execution decision         → DIRECT (1 area) | SUBAGENTS (2+ areas)
STEP 9: Implementation             → Per mode (development/correction/feature)
STEP 10: Area validation           → Validator subagents (MANDATORY per area)
STEP 11: Compliance Gate           → Cross-reference RF/RN vs implementation
STEP 12: Integration verification  → Build MUST pass
<!-- feature:startup-test:step-list -->
<!-- /feature:startup-test:step-list -->
STEP 14: Log iteration             → BEFORE informing user
STEP 15: Completion                → Inform user based on mode
```

**ABSOLUTE PROHIBITIONS:**

```
IF FEATURE N REQUESTED BUT DEPENDENCY NOT MET:
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO NOT USE: Write on code files
  ⛔ DO NOT: Implement anything
  ✅ DO: Inform that feature N-1 must be completed first

IF FEATURE NOT IDENTIFIED:
  ⛔ DO NOT USE: Task for subagent dispatch
  ⛔ DO NOT USE: Edit on code files
  ✅ DO: Run status.sh and identify feature

IF DOCS NOT LOADED:
  ⛔ DO NOT USE: Task for implementation subagents
  ⛔ DO NOT USE: Edit on code files
  ✅ DO: Load about.md, discovery.md, plan.md first

IF EXECUTION DECISION NOT MADE:
  ⛔ DO NOT USE: Task for subagent dispatch
  ⛔ DO NOT: Start implementation
  ✅ DO: Output execution decision first

IF VALIDATOR NOT EXECUTED (after each area):
  ⛔ DO NOT: Report area completion to user
  ⛔ DO NOT: Advance to next area
  ✅ DO: Execute validator subagent immediately

ALWAYS:
  ⛔ DO NOT USE: Bash for git add/commit/stage
  ⛔ DO NOT: Ask if user wants to commit
  ✅ DO: Leave ALL files as unstaged changes
```

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

## STEP 2: Detect Context (Epic Subfeature OR Legacy Feature Flag)

### 2A: HAS_EPIC=true (PRD0032 epic.md structure)

```
IF HAS_EPIC=true:
  1. READ docs/features/${FEATURE_ID}/epic.md
  2. IDENTIFY current subfeature: EPIC_CURRENT_SF from script output
  3. SET SF_DIR = docs/features/${FEATURE_ID}/subfeatures/${EPIC_CURRENT_SF}-*/
  4. SET TASKS_FILE = ${SF_DIR}/tasks.md (if HAS_TASKS=true)
  5. Inform: "Executing subfeature ${EPIC_CURRENT_SF} of epic ${FEATURE_ID}"
  6. ASSEMBLE TASK_DOCUMENTS for subagent prompts:
     - docs/features/${FEATURE_ID}/subfeatures/${EPIC_CURRENT_SF}-*/about.md
     - docs/features/${FEATURE_ID}/discovery.md
     - ${SF_DIR}/plan.md (if exists)
     - ${SF_DIR}/tasks.md (if HAS_TASKS=true)
```

**IF HAS_EPIC=true AND EPIC_CURRENT_SF is empty:** DO NOT implement. Inform all subfeatures complete → run `/add.done`.

### 2B: Legacy Feature Flag (`/add.build feature N`)

```
IF user passed "feature N" AND HAS_EPIC=false:
  1. EXTRACT feature number
  2. READ plan.md → CHECK for "## Features" section (Legacy Epic)
  3. IF no Features section: warning + execute normally
  4. IF Features section: extract tasks for feature N, validate dependency (N-1 complete in iterations.jsonl?), BLOCK if not met
```

### 2C: Simple Mode (no epic, no legacy feature flag)

ASSEMBLE TASK_DOCUMENTS: about.md, discovery.md, design.md (if exists), plan.md (if exists), tasks.md (if HAS_TASKS=true) — all under `docs/features/${FEATURE_ID}/`.

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

## STEP 6: Load Project Patterns (IF exist)

Read ALL project pattern files listed in PROJECT_PATHS from status.sh output. Files are named by app (SERVER.md, ADMIN.md, CLI.md) not by type. Exception: DATABASE.md is cross-app.

**If files exist:** Follow patterns documented. These are project-specific conventions.
**If files don't exist:** Run `/add.xray` to generate, or continue with generic best practices.

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

### TASKS MODE (PRD0032 — when tasks.md exists)

**Activated when:** `HAS_TASKS=true` and `TASKS_FILE` is set.

**Flow:**

```
1. READ tasks.md from TASKS_FILE path
2. GROUP tasks by service (database, backend, frontend)
3. VALIDATE deps: build execution graph (tasks with no deps first)
4. EXECUTION ORDER: database → backend → frontend
5. AFTER all task groups complete: proceed to STEP 10 (validation)
```

<!-- feature:tdd:tasks-flow -->
<!-- /feature:tdd:tasks-flow -->
<!-- feature:tdd:gate -->
<!-- /feature:tdd:gate -->

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

### Subagent Dispatch Template

**DISPATCH AGENT:**
- **Capability:** read-write | full-access
- **Complexity:** light (single fix/syntax) | standard (single area) | heavy (multi-entity/CQRS/new design system)
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
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS below
3. Parse PROJECT_PATHS from script output and read the file matching the app you're modifying
   - DATABASE.md is cross-app (read if doing database work)

## TASK_DOCUMENTS (read ALL — source of truth)
${TASK_DOCUMENTS}

## MANDATORY: Load Development Skill
BEFORE writing code, read: .codeadd/skills/add-${AREA}-development/SKILL.md
- For Frontend: The skill will check for design.md and load ux-design/SKILL.md if needed
- If design.md EXISTS: Follow its specs + use ux-design for implementation details
- For specific components, Grep on skill docs: shadcn-docs.md, tailwind-v3-docs.md, motion-dev-docs.md, recharts-docs.md, tanstack-table-docs.md, tanstack-query-docs.md

Follow ALL patterns from the loaded skills.

## Your Tasks
${TASK_LIST}

## DECISION LOGGING (MANDATORY — PRD0031)
Log **only pivots** to `docs/features/${FEATURE_ID}/decisions.jsonl`:
- PIVOT: `bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/decisions.jsonl" "pivot" "[area]" '"from":"[old]","decision":"[new]","reason":"[why]","attempt":[N]'`

## Deliverables
- Report: List of files created/modified + decisions logged
- Status: Build passes (run: ${BUILD_COMMAND})
```

#### 9.3 Area-Specific Notes

**Paths and build commands are project-specific. Consult CLAUDE.md for exact locations and commands.**

- **Database:** Entities, Kysely types, Knex migration, Repository, barrel exports
- **Backend:** Module structure, DTOs, Commands, Events, Controller, Service, register in app.module.ts
- **Workers:** Worker, Processor, queue config, error handling, register in worker.module.ts
- **Frontend:** Pages, Components, Zustand store, Hooks, mirror DTOs, API integration, forms
  - MANDATORY: Load skill `.codeadd/skills/add-frontend-development/SKILL.md` first
  - The frontend skill will check for design.md → if missing, auto-load ux-design/SKILL.md

**Skills Reference (MANDATORY):**
- Backend: `.codeadd/skills/add-backend-development/SKILL.md` (RESTful, IoC, DTOs, CQRS, Multi-tenancy)
- Database: `.codeadd/skills/add-database-development/SKILL.md` (Entities, Migrations, Kysely, Repositories)
- Frontend: `.codeadd/skills/add-frontend-development/SKILL.md` (Types, Hooks, State, API, Forms, Routing + auto-loads ux-design)

#### 9.4 Subagent Dispatch

**CRITICAL:** When dispatching multiple independent subagents, send ALL Task tool calls in a SINGLE message.

**DISPATCH AGENT:**
- **Capability:** read-write | full-access
- **Complexity:** Choose based on task — light for syntax fixes, standard for single-area implementation, heavy for multi-entity/CQRS/new design system
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
3. **Identify files** from plan.md and git changes likely involved in the bug
4. **Investigate root cause**: READ files → TRACE flow → COMPARE with contracts → CHECK business rules → IDENTIFY specific root cause

#### C2: Fix Implementation

- Fix root cause, not symptom. Follow existing code patterns. Add defensive checks if needed.
- **Frontend fixes:** FIRST load `.codeadd/skills/add-ux-design/SKILL.md`, follow all patterns, Grep skill docs for relevant components/styling/animation. Read design-system.md if exists.
- **CRITICAL:** Code MUST compile 100%. Fix errors before proceeding.

---

## STEP 10: Area Validation (MANDATORY after each area)

**After EACH area is implemented, dispatch a Validator Subagent to validate code against skill checklists and auto-correct violations.**

**IF VALIDATOR NOT EXECUTED:** DO NOT report area completion or advance to next area. Execute Validator IMMEDIATELY.
**IF SPEC_STATUS = INCOMPLETE:** DO NOT report area completion. Implement missing spec items OR escalate to user.

### 10.1 Validator Subagent Prompt Template

**DISPATCH AGENT:** Capability: read-write | full-access | Complexity: standard

```
You are the ${AREA} VALIDATOR for feature ${FEATURE_ID}.
Validate implemented code against skill checklist and auto-correct violations.

## Self-Bootstrap (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read skill: .codeadd/skills/add-${AREA}-development/SKILL.md
3. Read ALL files in FILES_CREATED and FILES_MODIFIED below

## IMPLEMENTED FILES
${FILES_CREATED}
${FILES_MODIFIED}

## TASK
1. Extract "## Validation Checklist" from skill file
2. Read EVERY implemented file
3. Validate each checklist item → if violated, prepare fix
4. Apply ALL fixes (do NOT defer to review)
5. Run build command (from CLAUDE.md) → must pass

RULES: No questions. Checklist violations = MUST FIX. Build MUST pass.

## SPEC COMPLIANCE CHECK (PRD0034)
After skill checklist validation, for CURRENT AREA ONLY:
1. READ `## Spec Checklist` from plan.md (if no section: SKIP)
2. FILTER items for current area
3. For each: locate in code, compare expected vs implemented → MATCH | PARTIAL | MISSING
4. PARTIAL: AUTO-FIX or document divergence | MISSING: mark INCOMPLETE
5. UPDATE plan.md Spec Checklist: mark [x] on confirmed items
IF SPEC_STATUS = INCOMPLETE: DO NOT mark area as complete.

## REPORT: CHECKLIST_RESULTS, VIOLATIONS_FOUND, VIOLATIONS_FIXED, FILES_MODIFIED, BUILD_STATUS, SPEC_COMPLIANCE (X/Y), SPEC_STATUS, SPEC_MISSING
```

### 10.2 Validation Dispatch Flow

Dispatch validator for each area immediately after its implementation subagent returns. After ALL validators complete, run build verification. If build fails, dispatch fix subagent with validator outputs + build errors.

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

<!-- feature:startup-test:step -->
<!-- /feature:startup-test:step -->

---

## STEP 14: Log Iteration + Checkpoint (BEFORE informing user)

### 14.1 Log Iteration to iterations.jsonl (PRD0031)

**MANDATORY: Append entry to `docs/features/${FEATURE_ID}/iterations.jsonl`:**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "<TYPE>" "/dev" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**IF epic subfeature (HAS_EPIC=true), add `"sf"` field:**
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "<TYPE>" "/dev" '"slug":"<SLUG>","what":"<WHAT>","files":["<f1>"],"sf":"${EPIC_CURRENT_SF}"'
```

**Types:** `add | fix | refactor | test | docs`

### 14.2 Git Tag Checkpoint (PRD0032 — Universal)

**ALWAYS create a checkpoint tag after successful implementation:**

```bash
# Feature simples
git tag "checkpoint/${FEATURE_ID}-done"

# Subfeature in epic (HAS_EPIC=true)
git tag "checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done"
```

**DO NOT skip tag creation. This enables rollback and progress tracking.**

**NOTE:** Checkpoint tags use `checkpoint/` prefix to separate from release tags (`v*`). These tags are temporary — cleaned up automatically by `/add.done` during merge.

### 14.3 Update epic.md (IF HAS_EPIC=true)

**IF HAS_EPIC=true, update the subfeature status in `docs/features/${FEATURE_ID}/epic.md`:**

Change `| ${EPIC_CURRENT_SF} | [name] | [obj] | pending |` → `| ${EPIC_CURRENT_SF} | [name] | [obj] | done | ${FEATURE_ID}-${EPIC_CURRENT_SF}-done |`

---

## STEP 15: Completion (Inform user based on mode)

Inform user of completion including: feature ID, files summary (per area count), build status, and next suggested commands.

**Always include suggested next command from ecosystem map:** Read `.codeadd/skills/add-ecosystem/SKILL.md` Main Flows section.
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

## Rules

ALWAYS:
- Detect mode automatically (development vs correction vs feature)
- Load relevant skill BEFORE implementing
- Follow skill patterns rigorously
- Implement contracts exactly as specified
- Ensure 100% compilation before proceeding
- Keep code simple (KISS, YAGNI)
- Output execution decision BEFORE implementation
- Execute validator subagent after EACH area
- Log iteration BEFORE informing user
- Leave ALL files as unstaged changes

NEVER:
- Commit or stage any code (git add/commit/stage)
- Ask if user wants to commit
- Skip implementation sections
- Leave code in non-compiling state
- Add features not in specification
- Ignore skill patterns
- Skip execution decision output
- Report area completion without validator
- Inform user without logging iteration

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
