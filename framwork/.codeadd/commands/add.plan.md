# Technical Planning Orchestrator

> **ARCHITECTURE REFERENCE:** Use `CLAUDE.md` as source of patterns.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante -> explain why; avancado -> essentials only).

Coordinator for technical planning. Loads context, dispatches specialized subagents (Database, Backend, Frontend), consolidates plan with APPEND + VALIDATE + FILL GAPS, and validates 100% requirements coverage.

---

## Spec

```json
{"outputs":{"plan":"docs/features/${FEATURE_ID}/plan.md","temp":["plan-database.md","plan-backend.md","plan-frontend.md"]},"patterns":{"skills":["backend-development","database-development","frontend-development","ux-design"],"action":"READ SKILL.md before subagent dispatch"}}
```

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
STEP 1:  Load founder profile     -> SILENT
STEP 2:  Run context mapper       -> FIRST COMMAND
STEP 3:  Load recent context      -> INTELLIGENT changelog reading
STEP 4:  Parse key variables      -> Feature detection
STEP 5:  Load feature docs        -> about.md, discovery.md, design.md
STEP 6:  Clarification questions  -> IF NEEDED ONLY
STEP 7:  Analyze scope            -> Epic subfeature vs full feature
STEP 8:  Execute subagents        -> SEQUENTIAL, by area (8.0: cross-SF context for epics)
<!-- feature:tdd:step-list -->
STEP 9:  Test-Spec subagent       -> AFTER area subagents, generates contract test cases
<!-- /feature:tdd:step-list -->
STEP 10: Consolidate plan         -> APPEND + VALIDATE + FILL GAPS + tasks.md + cross-SF review (epic)
STEP 11: Validate requirements    -> Coverage check (GATE)
STEP 12: Completion               -> Inform user
```

**ABSOLUTE PROHIBITIONS:**

```
IF FEATURE NOT IDENTIFIED (Step 4):
  NEVER dispatch subagents or write plan.md
  ALWAYS list features and ask user to choose

IF DOCS NOT LOADED (Step 5 incomplete):
  NEVER dispatch subagents or start planning
  ALWAYS read about.md and discovery.md FIRST

IF SCOPE NOT DETERMINED (Step 7 incomplete):
  NEVER dispatch subagents without knowing which ones are needed
  ALWAYS complete scope analysis FIRST

IF COVERAGE < 100% (Step 11):
  NEVER finalize plan.md or proceed to STEP 12
  ALWAYS resolve gaps by adding missing tasks or documenting exclusions

ALWAYS:
  NEVER write implementation code in plan.md
  NEVER create subagents for components not in scope
  NEVER rewrite subagent outputs during consolidation (APPEND only)
```

---

## STEP 1: Load Founder Profile (SILENT)

Read `docs/owner.md` to determine communication style.

**IF profile exists:** Adjust communication style accordingly.
**IF not exists:** Use **Balanced** style as default.

**NEVER inform the user about this step. Execute SILENTLY.**

---

## STEP 2: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

Provides: BRANCH (feature ID, type, phase), FEATURE_DOCS (HAS_DESIGN, HAS_PLAN), DESIGN_SYSTEM, FRONTEND (component structure), ALL_FEATURES, RECENT_CHANGELOGS (last 5), HAS_EPIC, EPIC_CURRENT_SF, EPIC_PROGRESS.

**NEVER skip this script. ALL subsequent steps depend on its output.**

### 2.1 Epic.md Detection (PRD0032)

**IF `HAS_EPIC=true`:** Read epic.md, identify next pending SF (EPIC_CURRENT_SF), set scope to that SF only, load its about.md + shared discovery.md, inform user: "Planning subfeature ${EPIC_CURRENT_SF} of epic ${FEATURE_ID}".

**IF HAS_EPIC=true AND no pending subfeature:** NEVER plan. Inform user all SFs complete, run `/add.done`.

---

## STEP 3: Load Recent Context + Past Features Discovery (INTELLIGENT)

**The script returns RECENT_CHANGELOGS with summaries of the last completed features.**

### 3.1 Past Features Cache Check

```
IF docs/features/${FEATURE_ID}/past-features.md exists:
  -> Read past-features.md (cache)
  -> Check if discovery.md has section "Related Features"
  -> IF yes: use as context, skip 3.2
  -> IF no: skip 3.2 (past-features.md is sufficient)

IF past-features.md does NOT exist:
  -> Execute STEP 3.2 (dispatch Past Features Agent)
```

### 3.2 Dispatch Past Features Discovery Agent (IF needed)

**DISPATCH AGENT:**
- **Capability:** read-only, light
- **Skill:** `add-feature-discovery` Phase 1.5
- **Input:** about.md of current feature + RECENT_CHANGELOGS
- **Output:** `docs/features/${FEATURE_ID}/past-features.md`
- **Prompt:**
  ```
  Read skill add-feature-discovery Phase 1.5.
  Feature: ${FEATURE_ID}.
  Input: docs/features/${FEATURE_ID}/about.md + RECENT_CHANGELOGS below.
  [RECENT_CHANGELOGS]
  Execute past features analysis and write past-features.md.
  ```

**WAIT:** past-features.md must exist before continuing.

### 3.3 Use Context for Planning

With past-features.md available (cached or generated):

1. **Extract from past-features.md:**
   - Files that can be reused
   - Recently established patterns
   - Relevant technical decisions
   - Correct terminology for codebase search

2. **Use in planning:**
   - Implementation order respecting dependencies (`depends`)
   - Patterns to follow (features with `shares-pattern` relation)
   - Potential conflicts (features with `conflicts` relation)

**Intelligent fallback (if past-features.md has no relevant matches):**
- Analyze RECENT_CHANGELOGS manually for matches by keyword
- If match found and discovery.md does not reference it -> read full changelog of that feature

**Goal:** Use knowledge from recent deliveries to plan better, avoiding reinventing the wheel.

---

## STEP 4: Parse Key Variables (GATE: feature_identified)

Extract from script: `FEATURE_ID` (if empty -> list ALL_FEATURES and ask), `CURRENT_PHASE` (must be `discovered` or `designed`), `HAS_DESIGN`, `HAS_FOUNDATIONS`.

**IF feature identified:** Display and proceed to STEP 5.
**IF not:** Show feature list and WAIT. NEVER dispatch subagents or write plan.md without a feature.

---

## STEP 5: Load Feature Documentation (GATE: docs_loaded)

**IF HAS_EPIC=true:** Read `${SF_DIR}/about.md` (PRIMARY), `${FEATURE_DIR}/discovery.md`, `${SF_DIR}/plan.md` (if exists), `${FEATURE_DIR}/epic.md`, `docs/design-system.md` (if exists).

**IF normal feature:** Read `${FEATURE_DIR}/about.md`, `${FEATURE_DIR}/discovery.md`, `design.md` (if HAS_DESIGN), `docs/design-system.md` (if HAS_FOUNDATIONS).

**IF HAS_DESIGN=true:** Use design.md to inform backend contracts (endpoints serve the UI needs).

**GATE:** about.md AND discovery.md MUST be read. IF either missing -> STOP and inform user.

---

## STEP 6: Clarification Questions (IF NEEDED ONLY)

**ONLY ask questions if `about.md` and `discovery.md` leave critical decisions undefined.**

Present questions with options and a RECOMMENDED default. Format: `### 1. [Question]` with `- a) / - b)` options and `> RECOMMENDED: [x] - [reason]`. User answers with `1a, 2b` or `recommended`.

**IF no clarification needed:** Proceed directly to STEP 7.

---

## STEP 7: Analyze Scope & Determine Structure (GATE: scope_determined)

### 7.1 Determine Scope Context

**IF HAS_EPIC=true:** Scope = current subfeature only. Do NOT plan the entire epic.
**IF normal feature:** Scope = entire feature as documented in about.md + discovery.md.

### 7.2 Determine Subagents

```json
{"scopeDetection":{"database":{"keywords":"entities,tables,migrations,new data","subagent":"Database Specialist"},"backend":{"keywords":"endpoints,API,controllers,commands,events,workers,queues","subagent":"Backend Specialist"},"frontend":{"keywords":"pages,components,UI,forms,hooks","subagent":"Frontend Specialist"}}}
```

### Decision Rules

- **Only create subagents that the feature actually needs**
- If feature is backend-only -> Only Backend Specialist
- If feature is full-stack -> Database + Backend + Frontend
- If simple UI change -> Only Frontend Specialist

**Inform user:** Type (FEATURE/EPIC), scope (components), subagents list. Then proceed.

**GATE:** Epic vs Feature decided, subagents identified, user informed.

---

## STEP 8: Execute Subagents (SEQUENTIAL)

**NEVER execute subagents in parallel. ALWAYS wait for each to complete before dispatching the next.**

### Subagent Output Location

Each subagent writes to a temporary file:
```
docs/features/${FEATURE_ID}/plan-[area].md
```

---

### 8.0 Build Cross-SF Context (EPIC ONLY)

**IF HAS_EPIC=true:** Before dispatching any subagent, read epic.md dependency graph, identify consumers + providers of this SF, read their about.md (and plan.md if exists), then build `${CROSS_SF_CONTEXT}`:

**Build this block and INJECT it into every subagent prompt:**

```
## Cross-SF Context (EPIC -- read for integration awareness)
### Consumers (SFs that need data from this SF):
- **${SF_ID}**: ${1-line — what data it needs}

### Providers (SFs that supply data to this SF):
- **${SF_ID}**: ${1-line — what data it provides} | Contracts: ${schemas/DTOs if plan.md exists}

### Integration rules:
- Schema fields MUST match consumer expectations
- Shared resources (enums, config vars, types) defined in earliest SF
- Document jsonb field structures when consumers depend on specific keys
```

**IF normal feature (no epic.md):** Skip this step. `${CROSS_SF_CONTEXT}` = empty.

---

### Subagent Bootstrap (shared across 8.1-8.3)

Every area subagent receives this bootstrap block before its specific task:

```
## TASK_DOCUMENTS (read ALL before starting -- source of truth)
${TASK_DOCUMENTS}

${CROSS_SF_CONTEXT}

## MANDATORY: Load Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Check for previous planning files: ls docs/features/${FEATURE_ID}/plan-*.md
```

---

### 8.1 Database Specialist

**When to create:** Feature requires new entities, tables, or data changes.

**DISPATCH AGENT:**
- **Capability:** read-write
- **Complexity:** standard
- **Output:** `docs/features/${FEATURE_ID}/plan-database.md`
- **Prompt:**
  ```
  You are the DATABASE SPECIALIST planning for feature ${FEATURE_ID}.

  ${SUBAGENT_BOOTSTRAP}

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

**DISPATCH AGENT:**
- **Capability:** read-write
- **Complexity:** standard
- **Output:** `docs/features/${FEATURE_ID}/plan-backend.md`
- **Prompt:**
  ```
  You are the BACKEND SPECIALIST planning for feature ${FEATURE_ID}.

  ${SUBAGENT_BOOTSTRAP}

  ## MANDATORY: Load Backend Development Skill
  BEFORE designing endpoints, read skill `add-backend-development` (RESTful API, IoC/DI, DTO naming, CQRS, multi-tenancy).

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
  +-- dtos/
  +-- commands/handlers/
  +-- events/handlers/
  +-- [feature].controller.ts
  +-- [feature].service.ts
  +-- [feature].module.ts

  Reference: `[search codebase for similar module]`

  ## Rules
  - NO code examples, only contracts
  - MUST search codebase for similar module as reference (paths from CLAUDE.md)
  - Combine API + Workers in same section
  - Keep it under 60 lines
  - MUST follow skill `add-backend-development` patterns
  - Include Status column in Endpoints table
  ```

---

### 8.3 Frontend Specialist

**When to create:** Feature requires UI changes.

**DISPATCH AGENT:**
- **Capability:** read-write
- **Complexity:** standard
- **Output:** `docs/features/${FEATURE_ID}/plan-frontend.md`
- **Prompt:**
  ```
  You are the FRONTEND SPECIALIST planning for feature ${FEATURE_ID}.

  ${SUBAGENT_BOOTSTRAP}
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

**When to create:** ALWAYS -- runs after all area subagents complete.

**DISPATCH AGENT:**
- **Capability:** read-write
- **Complexity:** standard
- **Output:** `docs/features/${FEATURE_ID}/plan-test-spec.md`
- **Prompt:**
  ```
  You are the TEST SPECIFICATION SPECIALIST for feature ${FEATURE_ID}.

  ## MANDATORY: Self-Bootstrap Context (FIRST STEP)
  1. Run: bash .codeadd/scripts/status.sh
  2. Parse FEATURE_ID from output
  3. Read feature docs IN ORDER:
     - docs/features/${FEATURE_ID}/about.md (PRIMARY -- RFs, RNs, RNFs)
     - docs/features/${FEATURE_ID}/discovery.md
  4. Read area planning outputs (contracts):
     - docs/features/${FEATURE_ID}/plan-database.md (if exists)
     - docs/features/${FEATURE_ID}/plan-backend.md (if exists)
     - docs/features/${FEATURE_ID}/plan-frontend.md (if exists)

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
  | [RF01] | [T01, T03] | YES |

  ## Rules
  - NO implementation code -- only test specifications
  - Coverage vs Requirements MUST show 100%
  - Keep under 40 lines
  - Test cases are CONTRACTS: what goes in, what comes out
  ```

**NEVER skip this subagent. Test specs are MANDATORY for TDD pipeline.**
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

**NEVER rewrite or summarize subagent content. Append directly.**

---

### 10.2 Validate Completeness (MANDATORY)

**Read discovery.md and design.md (if exists). Verify ALL of:**
- discovery entities/tables -> complete SQL schema in plan-database
- discovery JSONB fields -> detailed TypeScript structure
- discovery endpoints -> complete request/response DTOs
- discovery events/workers -> payload and consumers documented
- design components -> mapped in plan-frontend
- design states/interactions -> hooks and stores defined
- Frontend types mirror backend DTOs
- Main flow is clear (who calls whom)

---

### 10.3 Fill Gaps (IF NEEDED)

**IF validation identifies gaps, ADD directly to plan.md.** Common gaps:
- **Missing table schema** -> add complete CREATE TABLE with all fields from discovery
- **Missing JSONB structure** -> add TypeScript interface with detailed field types
- **Incomplete API contract** -> add Request/Response tables with Field | Type | Required | Description

**RULE:** If discovery.md has the information, it MUST appear in plan.md in an actionable form for the developer.

---

### 10.4 Dispatch Architect Subagent -- Generate tasks.md (PRD0032)

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
  1. ${PLAN_DIR}/plan.md  <- PRIMARY: technical contracts
  2. ${PLAN_DIR}/about.md <- Scope, acceptance criteria
  3. docs/features/${FEATURE_ID}/discovery.md <- Constraints

  4. ${PLAN_DIR}/plan-test-spec.md <- Test specifications (if exists)

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
  - Maximum 3 files per task -- if more, split
  - Deps: comma-separated task IDs, or `-` if none
  - Verify: MANDATORY -- command, curl, or browser check
  - Order: test (contract tests) -> database -> backend -> frontend
  - Complexity scoring:
    - SIMPLE: <=5 tasks
    - STANDARD: 6-12 tasks
    - COMPLEX: 13+ tasks (warn: should have been split as epic)
  ```

**NEVER finalize plan without tasks.md.**

---

### 10.5 Cross-SF Integration Review (EPIC ONLY)

**IF HAS_EPIC=true:** After tasks.md is generated, dispatch the Integration Review Agent.
**IF normal feature:** Skip to 10.6.

**Purpose:** Cross-validate all existing SF plans to catch mismatches that individual subagents cannot see (schema != consumer output, fragmented enums, missing config vars, undocumented handoffs).

**DISPATCH AGENT:**
- **Capability:** read-write
- **Complexity:** standard
- **Prompt:**
  ```
  You are the INTEGRATION REVIEWER for epic ${FEATURE_ID}.

  ## CONTEXT
  Read these files in order:
  1. docs/features/${FEATURE_ID}/epic.md <- dependency graph
  2. docs/features/${FEATURE_ID}/discovery.md <- shared requirements
  3. ALL existing plan.md files: ls docs/features/${FEATURE_ID}/subfeatures/*/plan.md
  4. ALL existing tasks.md files: ls docs/features/${FEATURE_ID}/subfeatures/*/tasks.md

  ## TASK
  Cross-validate all SF plans and FIX issues directly in the affected plan.md/tasks.md files.

  ### Checks (fix each in-place):
  1. **Schema <-> Consumer Alignment** - column names, jsonb structures, types match consumer expectations. FIX in provider plan.md.
  2. **Shared Resource Centralization** - enums/config vars/types added ONCE in earliest SF. FIX by moving to foundation SF.
  3. **Cross-SF Handoff Contracts** - each dependency edge has documented provider output + consumer expectation. FIX by adding "Cross-SF Dependencies" section.
  4. **Fallback & Degradation** - SFs depending on unimplemented SFs have fallback behavior documented. FIX in dependent SF plan/tasks.
  5. **Worker/DI Registration** - DI registration tasks exist for new services (API + worker cradle, barrel exports). FIX by adding missing tasks.

  ## OUTPUT
  Apply all fixes directly to affected files. Output summary of changes (file + what changed) to stdout. NEVER create a separate report file.

  ## RULES
  - ONLY fix integration issues -- NEVER rewrite content or change architecture
  - Preserve existing content -- APPEND or EDIT, never delete sections
  - Keep each plan.md under 150 lines after fixes
  ```

**WAIT:** Integration review must complete before proceeding to 10.6.

---

### 10.6 Add Navigation Sections

Append to plan.md: **Overview** (1-2 paragraphs from about.md), **Main Flow** (numbered Actor -> Action steps), **Implementation Order** (Database -> Backend -> Frontend), **Quick Reference** (table mapping patterns to codebase search terms for Entity, Repository, Controller, Command, Hook, Page).

---

## STEP 11: Validate Requirements Coverage (GATE: coverage_validated)

**GATE: coverage_validated - MANDATORY before finalizing**

```
IF COVERAGE < 100%:
  NEVER finalize plan.md or proceed to STEP 12
  ALWAYS resolve gaps by adding missing tasks
```

### 11.1 Process

1. **Extract** all RFs, RNs, and Scope items from discovery.md
2. **Map** each requirement to Feature/Area and specific Tasks
3. **IF no task exists** -> CREATE task or JUSTIFY exclusion

### 11.2 Generate Coverage Table

Add `## Requirements Coverage` to plan.md with this format:

| ID | Requirement | Covered? | Feature/Area | Tasks |
|----|-------------|----------|--------------|-------|
| RF01 | User creates account | YES | Feature 1 | 1.1, 1.2, 1.3 |
| RF05 | Admin toggle RLS | EXCLUDED | - | Out of current scope - validated with user |

**Status:** YES 100% covered | NO X requirements pending

### 11.3 Validate

- 100% covered -> Proceed to STEP 12
- < 100% -> STOP, resolve gaps (add tasks or document exclusion), then re-validate

---

### 10.7 Cleanup Temporary Files

```bash
cd "docs/features/${FEATURE_ID}"
rm -f plan-database.md plan-backend.md plan-frontend.md plan-test-spec.md
```

**NEVER delete temporary files until plan.md is complete AND coverage is validated.**

---

## STEP 12: Completion

Inform the user with a summary of what was planned:
- Feature ID and plan path
- Which areas were planned (Database/Backend/Frontend)
- Key metrics (endpoint count, task count)
- Suggest next command based on context: read skill `add-ecosystem` Main Flows section to determine whether `/add.build`, `/add.autopilot`, or `/add.design` is appropriate.

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

- Backend: skill `add-backend-development`
- Database: skill `add-database-development`
- Frontend (Code): skill `add-frontend-development`
- Frontend (UI): skill `add-ux-design`

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
1. Client -> GET /api/v1/health
2. Controller -> Build response with status/version
3. Response -> HealthResponseDto

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
