<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/commands/add-dev.md -->
---
name: add-dev
description: Development execution specialist - coordinates subagents for feature implementation and bug fixes
---

# Development Execution Specialist

Coordinator for feature implementation, bug fixes, and epic feature execution. Detects context automatically, coordinates subagents, validates against skill checklists, and ensures 100% compilation.

---

## Spec

```json
{"gates":["feature_identified","docs_loaded","mode_determined","execution_decided","validator_executed"],"order":["context_mapper","parse_variables","determine_mode","load_docs","load_patterns","scope_detection","execution_decision","implementation","area_validation","integration_verification","log_iteration","completion"],"modes":{"development":"pending tasks in plan.md/about.md","correction":"feature implemented + user describes bug","feature":"epic feature N"},"patterns":{"if_exists":".codeadd/project/*.md","action":"READ before implementation"}}
```

---

## OWNER Context

**From `OWNER:name|level|language` (status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

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

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF FEATURE N REQUESTED BUT DEPENDENCY NOT MET:
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO NOT USE: Write on code files
  ⛔ DO NOT: Implement anything
  ⛔ DO: Inform that feature N-1 must be completed first

IF FEATURE NOT IDENTIFIED:
  ⛔ DO NOT USE: Task for subagent dispatch
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO: Run status.sh and identify feature

IF DOCS NOT LOADED:
  ⛔ DO NOT USE: Task for implementation subagents
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO: Load about.md, discovery.md, plan.md first

IF EXECUTION DECISION NOT MADE:
  ⛔ DO NOT USE: Task for subagent dispatch
  ⛔ DO NOT: Start implementation
  ⛔ DO: Output execution decision first

IF VALIDATOR NOT EXECUTED (after each area):
  ⛔ DO NOT: Report area completion to user
  ⛔ DO NOT: Advance to next area
  ⛔ DO: Execute validator subagent immediately

ALWAYS:
  ⛔ DO NOT USE: Bash for git add/commit/stage
  ⛔ DO NOT: Ask if user wants to commit
  ⛔ DO: Leave ALL files as unstaged changes
```

---

## STEP 1: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

This script provides ALL context needed:
- **BRANCH**: Feature ID, branch type, current phase
- **FEATURE_DOCS**: Which docs exist (HAS_PLAN, HAS_DESIGN, HAS_IMPLEMENTATION)
- **DESIGN_SYSTEM**: HAS_FOUNDATIONS, FOUNDATIONS_PATH
- **FRONTEND**: Path, component counts, folder structure
- **PROJECT_CONTEXT**: ARCHITECTURE_REF (CLAUDE.md)
- **ALL_FEATURES**: FEATURE_COUNT, list if need to choose
- **FEATURES**: X/Y (if Legacy Epic in plan.md)
- **HAS_EPIC**: `true` if epic.md exists (PRD0032 epic structure)
- **EPIC_CURRENT_SF**: Current subfeature (e.g. `SF02-login`)
- **HAS_TASKS**: `true` if tasks.md exists
- **TASKS_FILE**: Path to tasks.md
- **LAST_CHECKPOINT**: Last git tag checkpoint

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

**⛔ IF HAS_EPIC=true AND EPIC_CURRENT_SF is empty (all done):**
- ⛔ DO NOT: Start implementation
- ⛔ DO: Inform user all subfeatures complete → run `/add-done`

### 2B: Legacy Feature Flag ("feature N" passed)

**Syntax:** `/add-dev feature N` or `/add-dev feature 1`

```
IF user passed "feature N" AND HAS_EPIC=false:
  1. EXTRACT feature number from command
  2. READ plan.md and CHECK for "## Features" section (indicates Legacy Epic)
  3. IF NO Features section: warning + execute normally
  4. IF Features section exists:
     - EXTRACT tasks for specified feature N
     - VALIDATE dependency: feature N-1 complete in iterations.jsonl?
     - IF dependency NOT met: BLOCK
     - IF OK: execute only tasks for feature N
```

**⛔ PROHIBITIONS IF FEATURE N REQUESTED BUT DEPENDENCY NOT MET:**
- ⛔ DO NOT USE: Edit on code files
- ⛔ DO NOT USE: Write on code files
- ⛔ DO NOT: Implement anything
- ⛔ DO: Inform that feature N-1 must be completed first

### 2C: Simple Mode (no epic, no legacy feature flag)

```
IF HAS_EPIC=false AND no "feature N" passed:
  ASSEMBLE TASK_DOCUMENTS for subagent prompts:
  - docs/features/${FEATURE_ID}/about.md
  - docs/features/${FEATURE_ID}/discovery.md
  - docs/features/${FEATURE_ID}/design.md (if exists)
  - docs/features/${FEATURE_ID}/plan.md (if exists)
  - docs/features/${FEATURE_ID}/tasks.md (if HAS_TASKS=true)
```

---

## STEP 3: Parse Key Variables

```json
{"FEATURE_ID":"if empty+count=1 use; if multiple ask","CURRENT_PHASE":"discovered|designed|planned","HAS_PLAN":"use plan.md as SOURCE","HAS_DESIGN":"use design.md for UI","HAS_FOUNDATIONS":"use design-system.md for tokens","ARCHITECTURE_REF":"path to patterns","HAS_IMPLEMENTATION":"if true+bug → CORRECTION MODE"}
```

---

## STEP 4: Determine Mode (MANDATORY OUTPUT)

### 4.1 Context Detection (AUTOMATIC)

This command detects automatically:
1. **TASKS** - `tasks.md` exists (PRD0032) → execute by structured tasks
2. **DEVELOPMENT** - When pending tasks exist in plan.md or about.md (no tasks.md)
3. **CORRECTION** - When feature already implemented + user describes a problem
4. **FEATURE (Epic)** - When user passes flag `feature N` (legacy mode)

### 4.2 Detection Flow

1. Run status.sh
2. Check state (priority order):
   - User described PROBLEM/BUG? → YES + Feature implemented = CORRECTION MODE
   - `HAS_TASKS=true`? → YES = TASKS MODE (execute by tasks.md structure)
   - User passed flag `feature N`? → YES = FEATURE MODE (see STEP 2B above)
   - plan.md has pending tasks? → YES = DEVELOPMENT MODE (implement tasks)
   - about.md exists but no plan.md? → YES = DEVELOPMENT MODE (from about.md)
   - None of the above? → Inform user to run /feature first
3. **IF plan.md has `## Features` (Legacy Epic) AND user did NOT pass flag:**
   - Check FEATURES output from status.sh
   - IF incomplete features: ask "Feature X complete. Execute feature X+1?"
   - IF all complete: inform all Epic features already implemented
4. Output detected mode and execute

### 4.3 Bug Detection Keywords

```json
{"keywords":"bug,erro,error,broke,not working,problem,issue,failure,failed,fix,crash,broken","pattern":"unexpected vs expected"}
```

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

```bash
FEATURE_DIR="docs/features/${FEATURE_ID}"

# Load based on script flags
cat "${FEATURE_DIR}/plan.md" 2>/dev/null       # If HAS_PLAN=true
cat "${FEATURE_DIR}/design.md" 2>/dev/null     # If HAS_DESIGN=true
cat "${FEATURE_DIR}/about.md"                   # ALWAYS
cat "${FEATURE_DIR}/discovery.md"               # ALWAYS
cat "${ARCHITECTURE_REF}"                       # From script output
cat "docs/design-system.md" 2>/dev/null        # If HAS_FOUNDATIONS=true
```

**Decision based on flags:**

```json
{"plan_true":"Use plan.md as source","no_plan+design":"Use design.md + about.md","no_plan+no_design":"Use about.md + discovery.md"}
```

**If HAS_DESIGN=true:** Follow mobile-first layouts, component specs, design tokens

---

## STEP 6: Load Project Patterns (IF exist)

```bash
# Parse PROJECT_PATHS from status.sh output
# Example: PROJECT_PATHS:.codeadd/project/SERVER.md,.codeadd/project/ADMIN.md,.codeadd/project/DATABASE.md

# Read ALL project pattern files listed in PROJECT_PATHS
# Files are named by app (SERVER.md, ADMIN.md, CLI.md) not by type (BACKEND.md)
# Exception: DATABASE.md is cross-app

for file in $(echo "$PROJECT_PATHS" | tr ',' ' '); do
    cat "$file" 2>/dev/null
done
```

**If files exist:** Follow patterns documented. These are project-specific conventions.
**If files don't exist:** Run `/architecture-analyzer` to generate, or continue with generic best practices.

**If ITERATIONS output exists from script:** Previous /add-dev sessions context - avoid repeating fixes.

---

## STEP 7: Determine Scope (DEVELOPMENT and FEATURE modes)

**Auto-detect from plan.md/about.md:**

```json
{"backend":"endpoints,controllers,DTOs,API","workers":"queues,jobs,background","frontend":"pages,components,UI,forms","database":"entities,tables,migrations"}
```

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

**Areas:** Database, Backend, Workers, Frontend

**⛔ PROHIBITED:** Skip this decision. If "Execution Decision" does not appear in output, execution is WRONG.

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

### Subagent Strategy

```json
{"general-purpose":"Backend API,Workers,Frontend,Database","Explore":"Quick codebase analysis"}
```

### Model Selection

```json
{"implementation":{"database":"min sonnet (opus if multi-entity)","backend":"min sonnet (opus if CQRS/integration)","frontend":"min sonnet (opus if new design system)"},"validators":{"all":"sonnet"},"fix":{"syntax":"haiku","logic":"sonnet"},"planning":"opus","NEVER":"haiku for implementation (database/backend/frontend)"}
```

---

### DEVELOPMENT MODE

#### 9.1 Dependency Order & Parallelization

```
Contract Tests (if exist) -> Database -> Backend API -> [parallel: Workers, Frontend]
```

```json
{"db+backend+frontend":"Sequential: DB → Parallel: Backend+Frontend","backend+frontend":"Parallel","single":"Direct (no subagents)"}
```

#### 9.2 Universal Subagent Prompt Template

```
You are implementing the ${AREA} for feature ${FEATURE_ID}.

## TASK_DOCUMENTS (read ALL before starting — source of truth)
${TASK_DOCUMENTS}

## MANDATORY: Load Context (FIRST STEP)
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Parse PROJECT_PATHS from script output and read relevant files:
   - Files are named by app (SERVER.md, ADMIN.md, CLI.md, etc)
   - Read the file matching the app you're modifying
   - DATABASE.md is cross-app (read if doing database work)

## MANDATORY: Load Development Skills
Based on your area, read the corresponding skills BEFORE writing any code:
- Backend API: .codeadd/skills/backend-development/SKILL.md
- Database: .codeadd/skills/database-development/SKILL.md
- Frontend: .codeadd/skills/frontend-development/SKILL.md (auto-loads ux-design if no design.md)

## Your Tasks
${TASK_LIST}

## Skill Patterns
Follow ALL patterns from your loaded skill. Key areas:
- Backend: RESTful API, IoC/DI, DTOs, CQRS, Multi-tenancy
- Database: Entities, Kysely types, Migrations, Repositories, Barrel exports
- Frontend: Mobile-first, shadcn components, Tailwind v3, Motion animations

## DECISION LOGGING (MANDATORY — PRD0031)
Log **only pivots** to `docs/features/${FEATURE_ID}/decisions.jsonl` using the log script:
- PIVOT: `bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/decisions.jsonl" "pivot" "[area]" '"from":"[old]","decision":"[new]","reason":"[why]","attempt":[N]'`

## Deliverables
- Report: List of files created/modified + decisions logged
- Status: Build passes (run: ${BUILD_COMMAND})
```

#### 9.3 Area-Specific Details

**NOTE:** Paths and build commands are project-specific. Consult CLAUDE.md for exact locations and commands.

```json
{"database":"Entities, Types, Migrations, Repositories","backend":"Modules, Controllers, Services, DTOs","workers":"Workers, Processors, Queues","frontend":"Pages, Components, Hooks, Stores"}
```

**Database Tasks:** Entities, Kysely types, Knex migration, Repository, barrel exports
**Backend Tasks:** Module structure, DTOs, Commands, Events, Controller, Service, register in app.module.ts
**Worker Tasks:** Worker, Processor, queue config, error handling, register in worker.module.ts
**Frontend Tasks:** Pages, Components, Zustand store, Hooks, mirror DTOs, API integration, forms
- **MANDATORY:** Load skill `.codeadd/skills/frontend-development/SKILL.md` first
- **The frontend skill will:** Check for design.md -> if missing, auto-load ux-design/SKILL.md
- **If design.md exists:** Follow its specs + use ux-design skill for implementation details
- **Consult skill docs:** shadcn-docs.md, tailwind-v3-docs.md, motion-dev-docs.md, recharts-docs.md, tanstack-*.md

#### 9.3.1 Skills Reference (MANDATORY)

```json
{"backend":".codeadd/skills/backend-development/SKILL.md (RESTful,IoC,DTOs,CQRS,Multi-tenancy)","database":".codeadd/skills/database-development/SKILL.md (Entities,Migrations,Kysely,Repositories)","frontend":".codeadd/skills/frontend-development/SKILL.md (Types,Hooks,State,API,Forms,Routing+auto-loads ux-design)"}
```

**Subagent Prompt MUST include (in this order):**
```
## MANDATORY: Self-Bootstrap Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read feature docs: about.md, discovery.md, design.md, plan.md

## MANDATORY: Load Development Skill
BEFORE writing code, read: .codeadd/skills/[area]-development/SKILL.md
For Frontend: The skill will check for design.md and load ux-design/SKILL.md if needed.
Follow ALL patterns from the loaded skills.
```

#### 9.4 Subagent Dispatch

**Use Task tool with `subagent_type: "general-purpose"`**

**CRITICAL:** When dispatching multiple independent subagents, send ALL Task tool calls in a SINGLE message.

**MODEL SELECTION:** Choose model based on complexity (see Model Selection table above).

**FRONTEND SUBAGENT (MANDATORY INSTRUCTION):**
When dispatching a frontend subagent, ALWAYS include Self-Bootstrap + skills in the prompt:
```
## MANDATORY: Self-Bootstrap Context (FIRST STEP)
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Parse FEATURE_ID from output
3. Read feature docs IN ORDER:
   - docs/features/${FEATURE_ID}/about.md
   - docs/features/${FEATURE_ID}/discovery.md
   - docs/features/${FEATURE_ID}/design.md (if exists - PRIMARY for UI)
   - docs/features/${FEATURE_ID}/plan.md (contains frontend specs + backend DTOs)

## Frontend Skills (MANDATORY)
BEFORE writing ANY frontend code:
1. Read: .codeadd/skills/frontend-development/SKILL.md (FIRST - handles types, hooks, state, API)
2. If NO design.md: Load .codeadd/skills/ux-design/SKILL.md for SaaS UX patterns
3. If design.md EXISTS: Follow its specs + use ux-design for implementation details

For specific components, use Grep on skill docs:
- shadcn: .codeadd/skills/ux-design/shadcn-docs.md
- Tailwind: .codeadd/skills/ux-design/tailwind-v3-docs.md
- Motion: .codeadd/skills/ux-design/motion-dev-docs.md
- Charts: .codeadd/skills/ux-design/recharts-docs.md
- Tables: .codeadd/skills/ux-design/tanstack-table-docs.md
- Query: .codeadd/skills/ux-design/tanstack-query-docs.md
```

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

#### STEP C1: Bug Investigation (Autonomous)

##### C1.1 Extract Bug Info from User Message

**Parse the user's message to extract:**
- Bug description (what happened vs expected)
- Error messages (if mentioned)
- Where it occurred (frontend, API, worker, etc.)
- Steps to reproduce (if provided)

**If critical info is missing:** Ask ONE consolidated question, not multiple.

##### C1.2 Load Implementation Context

```bash
FEATURE_DIR="docs/features/${FEATURE_ID}"

cat "${FEATURE_DIR}/about.md"              # Expected behavior
cat "${FEATURE_DIR}/discovery.md"          # Business rules
cat "${FEATURE_DIR}/plan.md" 2>/dev/null   # Technical contracts (if HAS_PLAN=true)
cat "${ARCHITECTURE_REF}"                  # Project patterns
```

##### C1.3 Analyze Implementation Files

From `plan.md` and git changes, identify files likely involved:

```
Bug area: [extracted from user message]
Files to investigate (from plan.md/git):
- [file 1] - [reason]
- [file 2] - [reason]
```

##### C1.4 Investigate Root Cause

1. **READ relevant files** from plan.md and git changes
2. **TRACE the flow** from user action to bug
3. **COMPARE with contracts** from plan.md
4. **CHECK business rules** from about.md/discovery.md
5. **IDENTIFY root cause** - be specific

#### STEP C2: Fix Implementation

##### C2.1 Apply Fix

**Follow project patterns from ARCHITECTURE_REF:**
- Fix root cause, not symptom
- Follow existing code patterns
- Add defensive checks if needed
- Ensure fix aligns with acceptance criteria

**FRONTEND FIXES (MANDATORY):**
If the bug is in frontend code:
1. FIRST, load the UX design skill: Read `.codeadd/skills/ux-design/SKILL.md`
2. Follow ALL patterns from the skill (mobile-first, shadcn, Tailwind v3, Motion, etc.)
3. For component fixes: Grep pattern="[component]" path=".codeadd/skills/ux-design/shadcn-docs.md"
4. For styling fixes: Grep pattern="[utility]" path=".codeadd/skills/ux-design/tailwind-v3-docs.md"
5. For animation fixes: Grep pattern="[pattern]" path=".codeadd/skills/ux-design/motion-dev-docs.md"
6. Read: docs/design-system.md (if exists)

##### C2.2 Verify Build

```bash
npm run build
```

**CRITICAL:** Code MUST compile 100%. Fix errors before proceeding.

---

## STEP 10: Area Validation (MANDATORY after each area)

**After EACH area is implemented, dispatch a Validator Subagent to validate code against skill checklists and auto-correct violations.**

**⛔ PROHIBITIONS IF VALIDATOR NOT EXECUTED:**
- ⛔ DO NOT: Report area completion to user
- ⛔ DO NOT: Advance to next area
- ⛔ DO: Execute Validator IMMEDIATELY after implementation subagent returns

**⛔ PROHIBITIONS IF SPEC_STATUS = INCOMPLETE:**
- ⛔ DO NOT: Report area completion to user
- ⛔ DO NOT: Advance to next area
- ⛔ DO: Implement missing spec items OR escalate to user if out of scope

### 10.1 Validator Subagent Prompt Template

```
description: "Validate ${AREA} for ${FEATURE_ID}"
model: "sonnet"
prompt: |
  ## ROLE
  You are the ${AREA} VALIDATOR for feature ${FEATURE_ID}.
  Your job is to validate implemented code against the skill checklist and auto-correct violations.

  ## MANDATORY: Self-Bootstrap Context (FIRST STEP)
  1. Run: bash .codeadd/scripts/status.sh
  2. Parse FEATURE_ID from output
  3. Read skill: .codeadd/skills/${AREA}-development/SKILL.md

  ## SKILLS
  MANDATORY - Read BEFORE validating:
  - .codeadd/skills/${AREA}-development/SKILL.md (contains Validation Checklist)

  ## IMPLEMENTED FILES (from ${AREA} Subagent)
  ${FILES_CREATED}
  ${FILES_MODIFIED}

  ## TASK
  ### Step 1: Load Checklist
  Extract the "## Validation Checklist" section from the skill file.
  Each item has format: `- [ ] Description` + `→ Check: how to validate`

  ### Step 2: Read ALL Implemented Files
  Read EVERY file listed in FILES_CREATED and FILES_MODIFIED.

  ### Step 3: Validate Against Checklist
  For EACH checklist item, verify the implemented files comply.
  If violated: document the violation and prepare fix.

  ### Step 4: Apply Fixes
  Fix ALL violations found. Do NOT defer to review.

  ### Step 5: Verify Build
  Run build command (from CLAUDE.md) to ensure fixes didn't break anything.

  ## RULES
  - NO questions - fix violations automatically
  - Checklist violations = MUST FIX (not optional)
  - Build MUST pass after fixes
  - Report ALL issues fixed

  ## SPEC COMPLIANCE CHECK (light — PRD0034)
  EXECUTE AFTER skill checklist validation, for the CURRENT AREA ONLY:

  1. READ `## Spec Checklist` from docs/features/${FEATURE_ID}/plan.md
     IF no Spec Checklist section: SKIP and add note "No Spec Checklist in plan.md"
  2. FILTER items for current area (Backend / Database / Frontend)
  3. For each item:
     a. Locate in code: file, class, method, route
     b. Compare: expected name vs implemented, expected type vs implemented
     c. Status: ✅ MATCH | ⚠️ PARTIAL (exists but differs) | ❌ MISSING
  4. IF ⚠️ PARTIAL: AUTO-FIX to match spec OR document divergence with reason
  5. IF ❌ MISSING: document as INCOMPLETE — DO NOT mark area as complete
  6. UPDATE plan.md Spec Checklist: mark [x] on confirmed items

  SPEC COMPLIANCE OUTPUT (append to report):
  ```
  SPEC_COMPLIANCE: X/Y items matched
  SPEC_PARTIAL: [list of partial items with diff]
  SPEC_MISSING: [list of missing items]
  SPEC_STATUS: COMPLIANT | DIVERGENT | INCOMPLETE
  ```

  ⛔ IF SPEC_STATUS = INCOMPLETE: DO NOT mark area as complete.

  ## REPORT FORMAT
  Return:
  1. CHECKLIST_RESULTS: [each item: pass / fixed]
  2. VIOLATIONS_FOUND: [count]
  3. VIOLATIONS_FIXED: [list: file, issue, fix applied]
  4. FILES_MODIFIED: [files changed during validation]
  5. BUILD_STATUS: [pass/fail]
  6. SPEC_COMPLIANCE: [X/Y items matched]
  7. SPEC_STATUS: [COMPLIANT | DIVERGENT | INCOMPLETE]
  8. SPEC_MISSING: [list if any]
```

### 10.2 Validation Dispatch Flow

```
After DB Subagent returns:
  → Dispatch Database Validator (if database implemented)
  → Wait → Parse violations fixed

After Backend/Frontend Subagents return:
  → Dispatch Backend Validator (if backend implemented)
  → Dispatch Frontend Validator (if frontend implemented)
  → Wait → Parse violations fixed

After ALL validators:
  → Run build verification
  → If build fails: dispatch fix subagent with validator outputs + build errors
```

**CRITICAL:** Pass FILES_CREATED and FILES_MODIFIED from each area's implementation subagent to the corresponding validator.

---

## STEP 11: Coordinator Compliance Gate [HARD STOP]

⛔ GATE: DO NOT report completion without executing this step.
⛔ DO NOT USE: Write to report/completion files
⛔ DO NOT: Inform user of completion

1. Re-read TASK_DOCUMENTS (about.md, plan.md) to extract RF/RN list
2. Cross-reference each RF/RN against FILES_CREATED/FILES_MODIFIED from Decision Log
3. Quick-read relevant implementation files to confirm requirement exists in code
4. IF any RF/RN has no corresponding implementation:
   - List missing items
   - Dispatch fix subagent with missing requirements + TASK_DOCUMENTS
   - Re-run this gate after fix
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

### 12.1 Log Iteration to iterations.jsonl (PRD0031)

**MANDATORY: Append entry to `docs/features/${FEATURE_ID}/iterations.jsonl`:**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "<TYPE>" "/dev" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**IF epic subfeature (HAS_EPIC=true), add `"sf"` field:**
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "<TYPE>" "/dev" '"slug":"<SLUG>","what":"<WHAT>","files":["<f1>"],"sf":"${EPIC_CURRENT_SF}"'
```

**Types:** `add | fix | refactor | test | docs`

### 12.2 Git Tag Checkpoint (PRD0032 — Universal)

**ALWAYS create a checkpoint tag after successful implementation:**

```bash
# Feature simples
git tag "checkpoint/${FEATURE_ID}-done"

# Subfeature in epic (HAS_EPIC=true)
git tag "checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done"
```

**⛔ DO NOT skip tag creation. This enables rollback and progress tracking.**

**NOTE:** Checkpoint tags use `checkpoint/` prefix to separate from release tags (`v*`). These tags are temporary — cleaned up automatically by `/add-done` during merge.

### 12.3 Update epic.md (IF HAS_EPIC=true)

**IF HAS_EPIC=true, update the subfeature status in `docs/features/${FEATURE_ID}/epic.md`:**

Change `| ${EPIC_CURRENT_SF} | [name] | [obj] | pending |` → `| ${EPIC_CURRENT_SF} | [name] | [obj] | done | ${FEATURE_ID}-${EPIC_CURRENT_SF}-done |`

---

## STEP 15: Completion (Inform user based on mode)

### Development Completion

```
Development Complete!

Feature: ${FEATURE_ID}

**Summary:**
- Backend API: [X files]
- Workers: [Y files]
- Frontend: [Z files]
- Database: [W files]

**Build Status:** Backend + Frontend compiling

**Next Steps:**
1. Execute migration: `npm run migrate:latest`
2. Start services: `docker-compose -f infra/docker-compose.yml up -d && npm run dev`
3. Run code review: `/review`
4. When approved, run `/add-done` to merge

**Suggested next command (from ecosystem map):**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
- After development → `/add-review` or `/add-test`
- After correction → `/add-review`
```

### Feature Completion (when executing `/add-dev feature N` in Epic)

```
Feature ${N} Complete!

Epic: ${EPIC_NAME}
Feature: ${N} of ${TOTAL_FEATURES}

**Summary:**
- [Summary of tasks implemented in this feature]

**Build Status:** Compiling

**Acceptance Criteria for Feature:**
- [x] [Criterion 1 for feature]
- [x] [Criterion 2 for feature]

**Next Steps:**
1. Test the feature ${N} functionality
2. Validate acceptance criteria
3. When ready, execute: `/add-dev feature ${N+1}`
4. Or if all Epic features complete: `/add-done`

**Suggested next command (from ecosystem map):**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
- After development → `/add-review` or `/add-test`
- After correction → `/add-review`
```

### Correction Completion

```
Bug Fix Complete!

Feature: ${FEATURE_ID}

**Bug:** [short description]
**Root Cause:** [brief explanation]

**Files Modified:**
- [file 1]
- [file 2]

**Build Status:** Compiling

**Next Steps:**
1. Test the fix manually
2. Verify the bug is resolved
3. Run `/review` when ready
4. Run `/add-done` to merge

**Suggested next command (from ecosystem map):**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
- After development → `/add-review` or `/add-test`
- After correction → `/add-review`
```

---

## Skip Planning for Simple Features

For simple features (single field, small UI change):
1. Skip `/plan` command
2. Go directly from `/feature` to `/dev`
3. Implement from `about.md` and `discovery.md`

---

## Examples

### Example 1: Development Mode (2+ areas = SUBAGENTS)

```bash
# User executes:
/dev

# Agent detects:
# - Feature F0003-user-preferences active
# - plan.md exists with pending tasks

# Output:
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

### Example 2: Correction Mode

```bash
# User executes:
/add-dev the save button is not working, error 500

# Agent detects:
# - Feature F0003-user-preferences active
# - HAS_IMPLEMENTATION=true
# - Bug keywords: "not working", "error 500"

# Output:
"Detected Mode: CORRECTION
Feature: F0003-user-preferences
Context: Investigating bug on save button (error 500)

Starting investigation..."
```

### Example 3: Single Area (1 area = DIRECT)

```bash
# User executes:
/dev

# Agent detects:
# - Feature F0004-api-endpoint active
# - plan.md shows only Backend tasks

# Output:
"Detected Mode: DEVELOPMENT
Feature: F0004-api-endpoint
Context: Implementing tasks from plan.md

## Execution Decision

**Areas identified:** Backend
**Count:** 1

**Strategy:** DIRECT
**Justification:** 1 area = implement directly

Starting implementation..."
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
