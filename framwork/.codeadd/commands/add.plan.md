# Technical Planning Orchestrator

> **ARCHITECTURE REFERENCE:** Use `CLAUDE.md` as source of patterns.

Coordinator for technical planning. Loads context, dispatches specialized subagents (Database, Backend, Frontend), consolidates plan with APPEND + VALIDATE + FILL GAPS, and validates 100% requirements coverage.

---

## Spec

```json
{"gates":["feature_identified","docs_loaded","scope_determined","coverage_validated"],"order":["load_profile","run_context_mapper","load_recent_context","parse_variables","load_feature_docs","clarification","analyze_scope","execute_subagents","consolidate_plan","validate_requirements","completion"],"outputs":{"plan":"docs/features/${FEATURE_ID}/plan.md","temp":["plan-database.md","plan-backend.md","plan-frontend.md"]},"patterns":{"skills":["backend-development","database-development","frontend-development","ux-design"],"action":"READ SKILL.md before subagent dispatch"}}
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
- Skip ALL [STOP] points and clarification questions (STEP 6)
- Accept default scope automatically
- Do NOT ask for confirmation at any gate
- Execute to completion without human interaction
- Log all auto-decisions in console output

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1:  Load founder profile     → SILENT
STEP 2:  Run context mapper       → FIRST COMMAND
STEP 3:  Load recent context      → INTELLIGENT changelog reading
STEP 4:  Parse key variables      → Feature detection
STEP 5:  Load feature docs        → about.md, discovery.md, design.md
STEP 6:  Clarification questions  → IF NEEDED ONLY
STEP 7:  Analyze scope            → Epic subfeature vs full feature
STEP 8:  Execute subagents        → SEQUENTIAL, by area (8.0: cross-SF context for epics)
<!-- feature:tdd:step-list -->
STEP 9:  Test-Spec subagent       → AFTER area subagents, generates contract test cases
<!-- /feature:tdd:step-list -->
STEP 10: Consolidate plan         → APPEND + VALIDATE + FILL GAPS + tasks.md + cross-SF review (epic)
STEP 11: Validate requirements    → Coverage check (GATE)
STEP 12: Completion               → Inform user
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF FEATURE NOT IDENTIFIED (Step 4):
  ⛔ DO NOT USE: Task for subagent dispatch
  ⛔ DO NOT USE: Write for plan.md
  ⛔ DO NOT: Proceed past STEP 4
  ⛔ DO: List features and ask user to choose

IF DOCS NOT LOADED (Step 5 incomplete):
  ⛔ DO NOT USE: Task for subagent dispatch
  ⛔ DO NOT: Start planning without context
  ⛔ DO: Read about.md and discovery.md FIRST

IF SCOPE NOT DETERMINED (Step 7 incomplete):
  ⛔ DO NOT USE: Task for subagent dispatch
  ⛔ DO NOT: Dispatch subagents without knowing which ones are needed
  ⛔ DO: Complete scope analysis FIRST

IF COVERAGE < 100% (Step 11):
  ⛔ DO NOT USE: Write to finalize plan.md
  ⛔ DO NOT: Proceed to STEP 12
  ⛔ DO: Resolve gaps by adding missing tasks or documenting exclusions

ALWAYS:
  ⛔ DO NOT: Write implementation code in plan.md
  ⛔ DO NOT: Create subagents for components not in scope
  ⛔ DO NOT: Rewrite subagent outputs during consolidation (APPEND only)
```

---

## STEP 1: Load Founder Profile (SILENT)

```bash
cat docs/owner.md
```

**IF profile exists:** Adjust communication style accordingly.
**IF not exists:** Use **Balanced** style as default.

**⛔ DO NOT: Inform the user about this step. Execute SILENTLY.**

---

## STEP 2: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

This script provides ALL context needed:
- **BRANCH**: Feature ID, branch type, current phase
- **FEATURE_DOCS**: Which docs exist (HAS_DESIGN, HAS_PLAN, etc.)
- **DESIGN_SYSTEM**: If design-system.md exists
- **FRONTEND**: Component structure (for scope detection)
- **ALL_FEATURES**: List of all features if need to choose
- **RECENT_CHANGELOGS**: Last 5 completed features with summaries
- **HAS_EPIC**: `true` if `epic.md` exists (PRD0032 epic structure)
- **EPIC_CURRENT_SF**: Current subfeature ID (e.g. `SF02`)
- **EPIC_PROGRESS**: `done/total` subfeatures

**⛔ DO NOT: Skip this script. ALL subsequent steps depend on its output.**

### 2.1 Epic.md Detection (PRD0032)

**IF `HAS_EPIC=true` (script output):**

```
1. READ docs/features/${FEATURE_ID}/epic.md
2. IDENTIFY next pending subfeature (EPIC_CURRENT_SF from script)
3. SET SCOPE = subfeature only (not entire epic)
4. LOAD: docs/features/${FEATURE_ID}/subfeatures/${SF_DIR}/about.md
5. LOAD: docs/features/${FEATURE_ID}/discovery.md (shared)
6. INFORM user: "Planning subfeature ${EPIC_CURRENT_SF} of epic ${FEATURE_ID}"
```

**⛔ IF HAS_EPIC=true AND no pending subfeature:**
- ⛔ DO NOT: Plan anything
- ⛔ DO: Inform user all subfeatures are complete, run `/add.ship`

---

## STEP 3: Load Recent Context + Past Features Discovery (INTELLIGENT)

**The script returns RECENT_CHANGELOGS with summaries of the last completed features.**

### 3.1 Past Features Cache Check

```
SE docs/features/${FEATURE_ID}/past-features.md existe:
  → Ler past-features.md (cache)
  → Verificar se discovery.md tem seção "Related Features"
  → SE tem: usar como contexto, pular 3.2
  → SE não tem: pular 3.2 (past-features.md é suficiente)

SE past-features.md NÃO existe:
  → Executar STEP 3.2 (dispatch do Past Features Agent)
```

### 3.2 Dispatch Past Features Discovery Agent (SE necessário)

**Dispatch Past Features Discovery Agent** [read-only, light]:

```
Skill: .codeadd/skills/add-feature-discovery/SKILL.md Phase 1.5
Input: about.md da feature atual + RECENT_CHANGELOGS
Output: docs/features/${FEATURE_ID}/past-features.md
```

**Prompt do agente:**
```
Read .codeadd/skills/add-feature-discovery/SKILL.md Phase 1.5.
Feature: ${FEATURE_ID}.
Input: docs/features/${FEATURE_ID}/about.md + RECENT_CHANGELOGS abaixo.
[RECENT_CHANGELOGS]
Execute análise de features passadas e write past-features.md.
```

**WAIT:** past-features.md deve existir antes de continuar.

### 3.3 Usar Context para Planning

Com past-features.md disponível (cache ou gerado):

1. **Extrair de past-features.md:**
   - Arquivos que podem ser reutilizados
   - Padrões recentemente estabelecidos
   - Decisões técnicas relevantes
   - Terminologia correta para busca no codebase

2. **Usar no planejamento:**
   - Ordem de implementação respeitando dependências (`depends`)
   - Padrões a seguir (features com relação `shares-pattern`)
   - Conflitos potenciais (features com relação `conflicts`)

**Intelligent fallback (se past-features.md não tem matches relevantes):**
- Analisar RECENT_CHANGELOGS manualmente para matches por keyword
- Se match encontrado e discovery.md não referencia → ler changelog completo da feature

**Goal:** Use knowledge from recent deliveries to plan better, avoiding reinventing the wheel.

---

## STEP 4: Parse Key Variables (GATE: feature_identified)

From the script output, extract:
- `FEATURE_ID` - IF empty → list ALL_FEATURES and ask user
- `CURRENT_PHASE` - Verify it is `discovered` or `designed`
- `HAS_DESIGN` - IF true, use design.md as input for frontend planning
- `HAS_FOUNDATIONS` - IF true, use for design tokens

**IF feature identified:** Display and proceed to STEP 5.

**IF no feature identified:**

```
⛔ GATE: feature_identified = FALSE

Available features:
[List from ALL_FEATURES output]

Select the feature to plan.
```

**⛔ IF FEATURE NOT IDENTIFIED:**
- ⛔ DO NOT USE: Task for subagent dispatch
- ⛔ DO NOT USE: Write for plan.md
- ⛔ DO: Show feature list and WAIT for user selection

---

## STEP 5: Load Feature Documentation (GATE: docs_loaded)

**IF HAS_EPIC=true (epic.md structure):**
```bash
FEATURE_DIR="docs/features/${FEATURE_ID}"
SF_DIR=$(ls -d "${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*" 2>/dev/null | head -1)

cat "${SF_DIR}/about.md"            # Subfeature scope (PRIMARY)
cat "${FEATURE_DIR}/discovery.md"   # Shared discovery
cat "${SF_DIR}/plan.md" 2>/dev/null # If already started
cat "${FEATURE_DIR}/epic.md"        # Epic overview + dependencies
cat "docs/design-system.md" 2>/dev/null
```

**IF normal feature:**
```bash
FEATURE_DIR="docs/features/${FEATURE_ID}"
cat "${FEATURE_DIR}/about.md"
cat "${FEATURE_DIR}/discovery.md"
cat "${FEATURE_DIR}/design.md" 2>/dev/null  # If HAS_DESIGN=true
cat "docs/design-system.md" 2>/dev/null  # If HAS_FOUNDATIONS=true
```

**IF HAS_DESIGN=true:** Use design.md to inform backend contracts (endpoints serve the UI needs).

**⛔ GATE: docs_loaded**
- about.md MUST be read before proceeding
- discovery.md MUST be read before proceeding
- IF either file is missing → STOP and inform user

**⛔ IF DOCS NOT LOADED:**
- ⛔ DO NOT USE: Task for subagent dispatch
- ⛔ DO NOT: Start planning without context
- ⛔ DO: Read about.md and discovery.md FIRST

---

## STEP 6: Clarification Questions (IF NEEDED ONLY)

**ONLY ask questions if `about.md` and `discovery.md` leave critical decisions undefined.**

Present questions in structured format with recommendations:

```markdown
## Clarification Questions

---

### 1. [Simple question]

- a) [Option A]
- b) [Option B]

> **[RECOMMENDED: a]** - [Short justification]

---

## Answer: `1a, 2b` or `recommended`
```

**IF no clarification needed:** Proceed directly to STEP 7.

---

## STEP 7: Analyze Scope & Determine Structure (GATE: scope_determined)

### 7.1 Determine Scope Context

**IF HAS_EPIC=true (epic.md detected in STEP 2.1):**
- Scope = current subfeature (`EPIC_CURRENT_SF`) only
- Do NOT plan the entire epic
- Subagents receive scoped tasks for this subfeature

**IF normal feature (no epic.md):**
- Scope = entire feature as documented in about.md + discovery.md

### 7.2 Determine Subagents

```json
{"scopeDetection":{"database":{"keywords":"entities,tables,migrations,new data","subagent":"Database Specialist"},"backend":{"keywords":"endpoints,API,controllers,commands,events,workers,queues","subagent":"Backend Specialist"},"frontend":{"keywords":"pages,components,UI,forms,hooks","subagent":"Frontend Specialist"}}}
```

### Decision Rules

- **Only create subagents that the feature actually needs**
- If feature is backend-only → Only Backend Specialist
- If feature is full-stack → Database + Backend + Frontend
- If simple UI change → Only Frontend Specialist

**Inform the user:**
```
Type identified: [Simple FEATURE | EPIC]
Scope: [list of components]
Subagents: [list of subagents]

Starting planning...
```

**⛔ GATE: scope_determined**
- Epic vs Feature MUST be decided
- Required subagents MUST be identified
- User MUST be informed before proceeding

---

## STEP 8: Execute Subagents (SEQUENTIAL)

For each required subagent, dispatch using the Task tool with `subagent_type: "general-purpose"`.

**⛔ EXECUTE subagents ONE AT A TIME. WAIT for each to complete before dispatching the next.**

### Subagent Output Location

Each subagent writes to a temporary file:
```
docs/features/${FEATURE_ID}/plan-[area].md
```

---

### 8.0 Build Cross-SF Context (EPIC ONLY)

**IF HAS_EPIC=true:** Before dispatching any subagent, build the `${CROSS_SF_CONTEXT}` block.

**Steps:**
1. Read `epic.md` → extract dependency graph (which SF depends on which)
2. Identify the **consumers** of this SF (SFs that list this one as dependency)
3. Identify the **providers** for this SF (SFs this one depends on)
4. Read the `about.md` of each consumer and provider SF
5. If any consumer/provider already has a `plan.md`, read it too (previous SF plans)

**Build this block and INJECT it into every subagent prompt:**

```
## Cross-SF Context (EPIC — read for integration awareness)

### This SF provides data consumed by:
${FOR_EACH_CONSUMER_SF}
- **${SF_ID}**: ${1-line summary from about.md — what data it needs from this SF}
${END_FOR}

### This SF consumes data provided by:
${FOR_EACH_PROVIDER_SF}
- **${SF_ID}**: ${1-line summary from about.md — what data it provides}
  ${IF plan.md exists}: Contracts already defined in plan.md: ${key schemas/tables/DTOs}
${END_FOR}

### Integration rules:
- Schema fields MUST match the output structure expected by consumer SFs
- Shared resources (enums, config vars, types) should be defined in the earliest SF that needs them
- Document jsonb field structures when consumers depend on specific keys
```

**IF normal feature (no epic.md):** Skip this step. `${CROSS_SF_CONTEXT}` = empty.

---

### 8.1 Database Specialist

**When to create:** Feature requires new entities, tables, or data changes.

**Dispatch prompt:**
```
You are the DATABASE SPECIALIST planning for feature ${FEATURE_ID}.

## TASK_DOCUMENTS (read ALL before starting — source of truth)
${TASK_DOCUMENTS}

${CROSS_SF_CONTEXT}

## MANDATORY: Load Context (FIRST STEP)
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above

## Your Task
Create the database planning section. Search the codebase for similar entities and repositories to use as references.
When Cross-SF Context is present, ensure schema fields match the data structures expected by consumer SFs.

## Output Format
Write to: docs/features/${FEATURE_ID}/plan-database.md

Use this EXACT format:

## Database

### Entities
| Entity | Table | Key Fields | Reference |
|--------|-------|------------|-----------|
| [Name] | [snake_case] | [main fields] | Similar: `[search codebase for similar entity]` |

### Migration
- [Action]: [table/column] - [type/constraint]
- Reference: `[search codebase for similar migration]`

### Repository
| Method | Purpose |
|--------|---------|
| [methodName] | [what it does] |

Reference: `[search codebase for similar repository]`

## Rules
- NO code examples, only structure
- MUST search codebase for similar files as references (paths from CLAUDE.md)
- Keep it under 40 lines
```

---

### 8.2 Backend Specialist

**When to create:** Feature requires API, business logic, workers, or events.

**Dispatch prompt:**
```
You are the BACKEND SPECIALIST planning for feature ${FEATURE_ID}.

## TASK_DOCUMENTS (read ALL before starting — source of truth)
${TASK_DOCUMENTS}

${CROSS_SF_CONTEXT}

## MANDATORY: Load Context (FIRST STEP)
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Check for previous planning files: ls docs/features/${FEATURE_ID}/plan-*.md

## MANDATORY: Load Backend Development Skill
BEFORE designing endpoints, read: `.codeadd/skills/add-backend-development/SKILL.md`

This skill contains ALL standards for:
- RESTful API (HTTP methods, status codes, URL patterns)
- IoC/DI configuration
- DTO naming conventions
- CQRS patterns
- Multi-tenancy rules

## Your Task
Create the backend planning section covering: API, Commands, Events, Workers (if needed).
Search the codebase for similar modules to use as references.

## Output Format
Write to: docs/features/${FEATURE_ID}/plan-backend.md

Use this EXACT format:

## Backend

### Endpoints
| Method | Path | Request DTO | Response DTO | Status | Purpose |
|--------|------|-------------|--------------|--------|---------|
| [METHOD] | /api/v1/[path] | [DtoName] | [DtoName] | [2xx] | [~10 words] |

### DTOs
| DTO | Fields | Validations |
|-----|--------|-------------|
| [CreateXxxDto] | field1: type, field2: type | field1: required |
| [XxxResponseDto] | id, field1, createdAt | - |

### Commands
{"CreateXxxCommand":{"triggeredBy":"Controller","actions":"Validate, persist, emit event"}}

### Events
{"XxxCreatedEvent":{"payload":"id,accountId","consumers":"AuditWorker"}}

### Workers (if applicable)
{"queue-name":{"job":"JobName","trigger":"Event/Schedule","action":"what it does"}}

### Module Structure
[feature]/
├── dtos/
├── commands/handlers/
├── events/handlers/
├── [feature].controller.ts
├── [feature].service.ts
└── [feature].module.ts

Reference: `[search codebase for similar module]`

## Rules
- NO code examples, only contracts
- MUST search codebase for similar module as reference (paths from CLAUDE.md)
- Combine API + Workers in same section
- Keep it under 60 lines
- MUST follow `.codeadd/skills/add-backend-development/SKILL.md` patterns
- Include Status column in Endpoints table
```

---

### 8.3 Frontend Specialist

**When to create:** Feature requires UI changes.

**Dispatch prompt:**
```
You are the FRONTEND SPECIALIST planning for feature ${FEATURE_ID}.

## TASK_DOCUMENTS (read ALL before starting — source of truth)
${TASK_DOCUMENTS}

${CROSS_SF_CONTEXT}

## MANDATORY: Load Context (FIRST STEP)
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Check for previous planning files: ls docs/features/${FEATURE_ID}/plan-*.md
4. Read docs/design-system.md (if exists - tokens)

## Your Task
Create the frontend planning section.
**If design.md exists:** Follow its layout specs, component inventory, and mobile-first requirements.
**If not:** Search the codebase for similar pages/components to use as references.

## Output Format
Write to: docs/features/${FEATURE_ID}/plan-frontend.md

Use this EXACT format:

## Frontend

### Pages
| Route | Page Component | Purpose |
|-------|----------------|---------|
| /[path] | [PageName] | [~10 words] |

### Components
{"ComponentName":{"location":"components/[folder]/","purpose":"~10 words"}}

### Hooks & State
{"hooks":{"use[Feature]":{"type":"TanStack Query","purpose":"CRUD operations"}},"stores":{"[feature]Store":{"type":"Zustand","purpose":"Local UI state (if needed)"}}}

### Types (mirror from backend)
{"TypeName":{"fields":"field1,field2","sourceDTO":"CreateXxxDto"}}

Reference: `[search codebase for similar pages/hooks]`

## Rules
- NO code examples, only structure
- Types MUST mirror backend DTOs
- MUST search codebase for similar files as references (paths from CLAUDE.md)
- Keep it under 40 lines
```

<!-- feature:tdd:step9 -->

---

## STEP 9: Test-Spec Subagent (AFTER area subagents)

**When to create:** ALWAYS — runs after all area subagents complete.

**MANDATORY:** Load skill BEFORE dispatch: `.codeadd/skills/add-test-specification/SKILL.md`

**Dispatch prompt:**
```
You are the TEST SPECIFICATION SPECIALIST for feature ${FEATURE_ID}.

## MANDATORY: Load Skill
READ: .codeadd/skills/add-test-specification/SKILL.md — follow ALL rules.

## MANDATORY: Self-Bootstrap Context (FIRST STEP)
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Parse FEATURE_ID from output
3. Read feature docs IN ORDER:
   - docs/features/${FEATURE_ID}/about.md (PRIMARY — RFs, RNs, RNFs)
   - docs/features/${FEATURE_ID}/discovery.md
4. Read area planning outputs (contracts):
   - docs/features/${FEATURE_ID}/plan-database.md (if exists — entities, tables)
   - docs/features/${FEATURE_ID}/plan-backend.md (if exists — endpoints, DTOs, commands)
   - docs/features/${FEATURE_ID}/plan-frontend.md (if exists — pages, components)

## Your Task
Generate contract test cases derived from RFs/RNs in about.md + technical contracts from plan-*.md files.

Rules:
- Tests validate CONTRACT (input/output), NEVER internal implementation
- Each RF generates at least 1 test case
- Each RN generates positive AND negative test cases
- Use nomenclature: [area]-[RF/RN]-[scenario]
- Map test cases to test files

## Output Format
Write to: docs/features/${FEATURE_ID}/plan-test-spec.md

Use the EXACT format from the test-specification skill:

## Test Specification

### Contract Tests (from RFs/RNs)

| ID | Test Case | Area | RF/RN | Input | Expected Output | Verify |
|----|-----------|------|-------|-------|-----------------|--------|
| T01 | [max 10 words] | [backend/frontend/database] | [RF/RN ID] | [request/action] | [response/result] | [assertion] |

### Test File Mapping

| Area | Test File | Test IDs |
|------|-----------|----------|
| [area] | [path] | [T01, T02...] |

### Coverage vs Requirements

| RF/RN | Test Cases | Covered? |
|-------|------------|----------|
| [RF01] | [T01, T03] | ✅ |

## Rules
- NO implementation code — only test specifications
- Coverage vs Requirements MUST show 100%
- Keep under 40 lines
- Test cases are CONTRACTS: what goes in, what comes out
```

**⛔ DO NOT skip this subagent. Test specs are MANDATORY for TDD pipeline.**
<!-- /feature:tdd:step9 -->

---

## STEP 10: Consolidate Plan (APPEND + VALIDATE + FILL GAPS)

**PHILOSOPHY: APPEND + VALIDATE + FILL GAPS**

The heavy work was done by the specialized subagents. Your role here is:
1. **PRESERVE** - Append outputs without reinterpreting
2. **VALIDATE** - Ensure everything from discovery/design is mapped
3. **COMPLETE** - Fill identified gaps (schemas, contracts, etc.)

---

### 10.1 Append Subagent Outputs (RAW)

```bash
cd "docs/features/${FEATURE_ID}"

# Create plan.md header
echo "# Plan: ${FEATURE_ID}" > plan.md
echo "" >> plan.md

# Append each section PRESERVING ORIGINAL CONTENT
[ -f plan-test-spec.md ] && cat plan-test-spec.md >> plan.md && echo "" >> plan.md && echo "---" >> plan.md
[ -f plan-database.md ] && cat plan-database.md >> plan.md && echo "" >> plan.md && echo "---" >> plan.md
[ -f plan-backend.md ] && cat plan-backend.md >> plan.md && echo "" >> plan.md && echo "---" >> plan.md
[ -f plan-frontend.md ] && cat plan-frontend.md >> plan.md && echo "" >> plan.md && echo "---" >> plan.md
```

**⛔ DO NOT rewrite or summarize subagent content. Append directly.**

---

### 10.2 Validate Completeness (MANDATORY)

**Read discovery.md and design.md (if exists) and verify:**

| Source | What to Verify | Must Be in Plan |
|--------|---------------|-----------------|
| discovery.md | Mentioned entities/tables | Complete SQL schema in plan-database |
| discovery.md | Complex JSONB fields | Detailed TypeScript structure |
| discovery.md | Required endpoints | Complete contract (request/response DTOs) |
| discovery.md | Events/workers | Payload and consumers documented |
| design.md | UI components | Mapped in plan-frontend |
| design.md | States/interactions | Hooks and stores defined |

**Validation Checklist:**
```markdown
- [ ] All tables have SQL schema? (Complete CREATE TABLE)
- [ ] JSONB fields have TypeScript structure? (Detailed interface)
- [ ] All endpoints have request/response DTOs? (Fields and types)
- [ ] Frontend types mirror backend DTOs?
- [ ] Main flow is clear? (Who calls whom)
```

---

### 10.3 Fill Gaps (IF NEEDED)

**IF validation identifies gaps, ADD directly to plan.md:**

**Common gap examples:**

1. **Missing table schema:**
```sql
### Schema: [table_name]
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  [fields from discovery],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Missing JSONB structure:**
```typescript
### Interface: [JsonbFieldName]
interface [JsonbFieldName] {
  [field]: [type];
  // fields from discovery
}
```

3. **Incomplete API contract:**
```markdown
### Detailed API Contracts

#### [POST/GET/etc] /api/v1/[path]
**Request:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|

**Response:**
| Field | Type | Description |
|-------|------|-------------|
```

**RULE:** If discovery.md has the information, it MUST appear in plan.md in an actionable form for the developer.

---

### 10.4 Dispatch Architect Subagent — Generate tasks.md (PRD0032)

**AFTER plan.md is consolidated and gaps filled, dispatch the Architect Subagent to generate `tasks.md`.**

**DISPATCH AGENT:**
- **Capability:** read-write
- **Complexity:** standard
- **Output:** Write `${PLAN_DIR}/tasks.md` (where `PLAN_DIR` = feature dir or subfeature dir if epic)
- **Prompt:**
  ```
  You are the ARCHITECT for feature ${FEATURE_ID} (subfeature ${EPIC_CURRENT_SF} if epic).

  ## CONTEXT
  Read these files in order:
  1. ${PLAN_DIR}/plan.md  ← PRIMARY: technical contracts
  2. ${PLAN_DIR}/about.md ← Scope, acceptance criteria
  3. docs/features/${FEATURE_ID}/discovery.md ← Constraints

  4. ${PLAN_DIR}/plan-test-spec.md ← Test specifications (if exists)

  ## TASK
  Generate `${PLAN_DIR}/tasks.md` with atomic subtasks in this EXACT format.
  **TDD ORDER:** Test tasks (service=test) MUST come BEFORE implementation tasks for each area.

  ```markdown
  # Tasks: [feature or SF name]

  ## Metadata

  | Campo | Valor |
  |-------|-------|
  | Complexity | SIMPLE / STANDARD / COMPLEX |
  | Total tasks | [N] |
  | Services | database, backend, frontend, test |

  ## Tasks

  | ID | Description | Service | Files | Deps | Verify |
  |----|-------------|---------|-------|------|--------|
  | 1.1 | Contract test: [RF01 scenario] | test | `path/file.spec.ts` | - | test file compiles |
  | 1.2 | Contract test: [RN01 scenario] | test | `path/file.spec.ts` | - | test file compiles |
  | 2.1 | [max 10 words] | database | `path/file.ts` | - | `npm run migrate` |
  | 3.1 | [max 10 words] | backend | `path/a.ts`, `path/b.ts` | 2.1 | tests pass |
  | 4.1 | [max 10 words] | frontend | `path/c.tsx` | 3.1 | tests pass |
  ```

  ## RULES
  - 1 service per task (database | backend | frontend | test | infra)
  - Maximum 3 files per task — if more, split
  - Deps: comma-separated task IDs, or `-` if none
  - Verify: MANDATORY — command, curl, or browser check
  - Order: test (contract tests) → database → backend → frontend
  - Complexity scoring:
    - SIMPLE: ≤5 tasks
    - STANDARD: 6–12 tasks
    - COMPLEX: 13+ tasks (warn: should have been split as epic)
  ```

**⛔ DO NOT finalize plan without tasks.md.**

---

### 10.5 Cross-SF Integration Review (EPIC ONLY)

**IF HAS_EPIC=true:** After tasks.md is generated, dispatch the Integration Review Agent.
**IF normal feature:** Skip to 10.6.

**Purpose:** Cross-validate all existing SF plans to catch mismatches that individual subagents cannot see (schema ≠ consumer output, fragmented enums, missing config vars, undocumented handoffs).

**DISPATCH AGENT:**
- **Capability:** read-write
- **Complexity:** standard
- **Prompt:**
  ```
  You are the INTEGRATION REVIEWER for epic ${FEATURE_ID}.

  ## CONTEXT
  Read these files in order:
  1. docs/features/${FEATURE_ID}/epic.md ← dependency graph
  2. docs/features/${FEATURE_ID}/discovery.md ← shared requirements
  3. ALL existing plan.md files: ls docs/features/${FEATURE_ID}/subfeatures/*/plan.md
  4. ALL existing tasks.md files: ls docs/features/${FEATURE_ID}/subfeatures/*/tasks.md

  ## TASK
  Cross-validate all SF plans and FIX issues directly in the affected plan.md/tasks.md files.

  ### Check 1: Schema ↔ Consumer Alignment
  For each table/entity defined in a provider SF:
  - Find all consumer SFs that read or write this data
  - Verify column names, jsonb structures, and types match what consumers expect
  - FIX: update the provider SF plan.md schema to include missing fields or document jsonb structure

  ### Check 2: Shared Resource Centralization
  Scan all plans for shared resources (enums, config vars, types, barrel exports):
  - Enums: should be added ONCE in the earliest SF (usually SF01/foundation)
  - Config vars: all env vars should be declared in the foundation SF, consumed by later SFs
  - FIX: move fragmented additions to the foundation SF plan, update tasks.md accordingly

  ### Check 3: Cross-SF Handoff Contracts
  For each dependency edge in epic.md:
  - Verify the provider SF documents what it produces
  - Verify the consumer SF documents what it expects
  - FIX: add "Cross-SF Dependencies" section to plan.md if missing, with explicit contracts

  ### Check 4: Fallback & Degradation
  For SFs that depend on others not yet implemented:
  - Verify fallback behavior is documented (e.g., default timezone if SF04 not deployed)
  - FIX: add fallback notes to the dependent SF plan or task description

  ### Check 5: Worker/DI Registration Completeness
  For each new service or worker:
  - Verify DI registration task exists (API cradle AND worker cradle)
  - Verify barrel export is included in the file list of the task
  - FIX: add missing DI/barrel tasks

  ## OUTPUT
  DO NOT create a separate report file.
  Apply all fixes directly to the affected plan.md and tasks.md files.
  After all fixes, output a summary of changes made (file + what changed) to stdout.

  ## RULES
  - ONLY fix integration issues — do not rewrite content or change architecture
  - Preserve existing content — APPEND or EDIT, never delete sections
  - If a fix requires a new task, add it at the end of the tasks table
  - Keep each plan.md under 150 lines after fixes
  ```

**WAIT:** Integration review must complete before proceeding to 10.6.

---

### 10.6 Add Navigation Sections

Append to the end of plan.md:

```markdown
## Overview
[1-2 paragraphs summarizing the feature - based on about.md]

## Main Flow
1. [Step 1 - Actor → Action]
2. [Step 2 - Actor → Action]
3. [Continue as needed...]

## Implementation Order
1. **Database**: [list items if applicable]
2. **Backend**: [list items]
3. **Frontend**: [list items if applicable]

## Quick Reference
| Pattern | How to Find |
|---------|-------------|
| Entity | Search codebase for similar entity |
| Repository | Search codebase for similar repository |
| Controller | Search codebase for similar controller |
| Command | Search codebase for similar command |
| Frontend Hook | Search codebase for similar hook |
| Frontend Page | Search codebase for similar page |
```

---

## STEP 11: Validate Requirements Coverage (GATE: coverage_validated)

**⛔ GATE: coverage_validated - MANDATORY before finalizing**

```
IF COVERAGE < 100%:
  ⛔ DO NOT USE: Write to finalize plan.md
  ⛔ DO NOT: Proceed to STEP 12
  ⛔ DO: Resolve gaps by adding missing tasks
```

### 11.1 Extract Requirements from discovery.md

```markdown
- [ ] List ALL RFs (Functional Requirements)
- [ ] List ALL RNs (Business Rules)
- [ ] List items from Scope/Summary
```

### 11.2 Map Each Requirement

For EACH requirement:
```markdown
- [ ] Identify which Feature/Area covers it
- [ ] Identify which specific Tasks implement it
- [ ] IF no task exists → CREATE task or JUSTIFY exclusion
```

### 11.3 Generate Coverage Table

Add to plan.md AFTER Features section (or at beginning if not Epic):

```markdown
## Requirements Coverage

| ID | Requirement | Covered? | Feature/Area | Tasks |
|----|-------------|----------|--------------|-------|
| RF01 | User creates account | ✅ | Feature 1 | 1.1, 1.2, 1.3 |
| RF02 | Confirmation email | ✅ | Feature 2 | 2.1, 2.2 |
| RN01 | Password min 8 chars | ✅ | Feature 1 | 1.2 |
| RF05 | Admin toggle RLS | ❌ | - | - |

**Status:** ✅ 100% covered | ❌ X requirements pending
```

### 11.4 Validate Completeness

```markdown
- [ ] 100% covered → Proceed to STEP 12
- [ ] < 100% → STOP and resolve gaps:
  - Add missing tasks
  - OR document exclusion with justification
```

### 11.5 If Requirement Will Not Be Implemented

Document explicitly in the table:

```markdown
| RF05 | Admin toggle RLS | ⏸️ EXCLUDED | - | Out of current scope - validated with user |
```

---

### 10.7 Cleanup Temporary Files

```bash
cd "docs/features/${FEATURE_ID}"
rm -f plan-database.md plan-backend.md plan-frontend.md plan-test-spec.md
```

**⛔ DO NOT delete temporary files until plan.md is complete AND coverage is validated.**

---

## STEP 12: Completion

### Inform the User

```markdown
✅ **Technical Planning Complete!**

**Feature:** ${FEATURE_ID}
**Document:** `docs/features/${FEATURE_ID}/plan.md`

**Contents:**
- [X] API contracts (Y endpoints)
- [X] DTOs and validations
- [X] Commands and Events
- [X] Module structure
- [X] References to similar files

**Next Steps (load code-addiction-ecosystem skill for context):**
Read `.codeadd/skills/add-ecosystem/SKILL.md` Main Flows section.
Based on what was planned, suggest the logical next command:
- Standard flow → `/add.build`
- Autonomous flow → `/add.autopilot`
- If design is missing and feature has UI → `/add.design` first
```

---

## Rules

ALWAYS:
- Keep plan under 150 lines total
- Use tables for structured data
- Reference similar files instead of writing code
- Create only subagents the feature actually needs
- Execute subagents sequentially (one at a time)
- Delete temporary plan-*.md files after consolidation
- Load skill files before planning each area
- Validate 100% requirements coverage before finalizing
- Append subagent outputs without rewriting

NEVER:
- Write implementation code in plan.md
- Create verbose descriptions
- Include testing strategy (follow project patterns)
- Add unnecessary sections
- Create subagents for components not in scope
- Rewrite or summarize subagent content during consolidation
- Finalize plan with coverage below 100%

---

## Skills to Reference

- Backend: `.codeadd/skills/add-backend-development/SKILL.md`
- Database: `.codeadd/skills/add-database-development/SKILL.md`
- Frontend (Code): `.codeadd/skills/add-frontend-development/SKILL.md`
- Frontend (UI): `.codeadd/skills/add-ux-design/SKILL.md`

---

## Plan Quality Checklist

Before completing, verify:

- [ ] Plan is under 150 lines
- [ ] All contracts use tables (not prose)
- [ ] Every section has a Reference to similar file
- [ ] No code blocks with implementation
- [ ] Flow is numbered list (not ASCII/Mermaid)
- [ ] Implementation order is clear
- [ ] Temporary files deleted
- [ ] Skills loaded and patterns followed
- [ ] Requirements coverage = 100%

---

## Example: Minimal Plan (Backend-Only Feature)

```markdown
# Plan: F0012-api-health-check

## Overview
Add health check endpoint for monitoring. Returns API status and version.

---

## Backend

### Endpoints
| Method | Path | Request DTO | Response DTO | Status | Purpose |
|--------|------|-------------|--------------|--------|---------|
| GET | /api/v1/health | - | HealthResponseDto | 200 | Return API status |

### DTOs
| DTO | Fields | Validations |
|-----|--------|-------------|
| HealthResponseDto | status, version, timestamp | - |

Reference: `[search codebase for similar controller]`

---

## Main Flow
1. Client → GET /api/v1/health
2. Controller → Build response with status/version
3. Response → HealthResponseDto

## Implementation Order
1. **Backend**: DTO, Controller endpoint, register route

## Quick Reference
| Pattern | How to Find |
|---------|-------------|
| Controller | Search codebase for similar controller |
| DTO | Search codebase for similar DTOs |
```

**Total: ~35 lines** - This is the goal for simple features.

---

## Error Handling

| Error | Action |
|-------|--------|
| about.md not found | STOP - inform user, cannot plan without scope |
| discovery.md not found | STOP - inform user, cannot plan without requirements |
| status.sh fails | STOP - show error, check .add setup |
| Subagent fails to write output | Re-dispatch subagent once, then plan manually |
| >5 features in Epic | Split into multiple Epics, inform user |
