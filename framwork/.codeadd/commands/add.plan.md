# Technical Planning Orchestrator

> **ARCHITECTURE REFERENCE:** Use `CLAUDE.md` as source of patterns.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner -> explain why; advanced -> essentials only).
> **ARGS:** `/add.plan [F[NNNN]]` — explicit `F[NNNN]` targets a feature off-branch (overrides branch detection).

Coordinator for technical planning. Loads context, dispatches specialized subagents (UX Design, Database, Backend, Frontend), consolidates plan with APPEND + VALIDATE + FILL GAPS, and validates 100% requirements coverage.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules). Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format. Load `{{skill:add-plan-review/SKILL.md}}` before STEP 13 (pre-delivery review rubric + verdict contract).

---

## GATES (Invariant Execution Blockers)

| Gate | Triggered at | Condition | Action |
|------|--------------|-----------|--------|
| `feature_identified` | STEP 4 | FEATURE_ID is empty | List all features, WAIT for user choice, NEVER proceed without selection |
| `docs_loaded` | STEP 5 | about.md OR discovery.md missing | STOP, inform user, NEVER dispatch subagents |
| `scope_determined` | STEP 7 | Epic/Feature type unclear OR subagents unidentified | NEVER dispatch subagents, ALWAYS complete scope analysis first |
| `design_gate` | STEP 8.1.0 | Any of checks 1-3 (frontend / scope / provenance) returns a skip verdict AND check 4 (contract-schema) does not override it | NEVER dispatch a UX agent; STATE the verdict + reason, skip 8.1, continue at 8.2 |
| `design_validated` | STEP 8.1.5 | `feature-design` schema gate did not return PASS | NEVER delete the 8.1 temps, NEVER proceed to 8.2 — fix `design.md` and re-run the gate |
| `coverage_validated` | STEP 11 | Coverage < 100% | STOP, resolve gaps (add tasks or document exclusions), re-validate before finalizing |
| `plan_reviewed` | STEP 13 | `@plan-reviewer-agent` verdict is `blocked`, or blockers remain after the one `fix-then-ok` re-dispatch | STOP, present the blockers to the user; NEVER proceed to STEP 14 Completion |

---

## INVARIANT PROHIBITIONS

- NEVER write implementation code in plan.md (only contracts, schemas, structure)
- NEVER create subagents for components not in scope
- NEVER rewrite or summarize subagent outputs during consolidation (APPEND only)
- NEVER finalize plan without tasks.md AND 100% coverage validation
- NEVER execute subagents in parallel (SEQUENTIAL only, one at a time)

---

## STEPS IN ORDER

```
STEP 1:  Load founder profile     -> SILENT
STEP 2:  Run context mapper       -> FIRST COMMAND
STEP 3:  Load recent context      -> INTELLIGENT changelog reading
STEP 4:  Parse key variables      -> Feature detection (GATE: feature_identified)
STEP 5:  Load feature docs        -> about.md, discovery.md, design.md (GATE: docs_loaded)
STEP 6:  Clarification questions  -> IF NEEDED ONLY
STEP 7:  Analyze scope            -> Epic/Feature type + subagent selection (GATE: scope_determined)
STEP 8:  Execute subagents        -> SEQUENTIAL by area
  - 8.0: Cross-SF context (EPIC ONLY)
  - 8.1: UX Design Specialist (gated -> design.md)
  - 8.2: Database Specialist
  - 8.3: Backend Specialist
  - 8.4: Frontend Specialist
<!-- feature:qa-pipeline:step-list -->
<!-- /feature:qa-pipeline:step-list -->
<!-- feature:tdd-pipeline:step-list -->
<!-- /feature:tdd-pipeline:step-list -->
STEP 10: Consolidate plan         -> APPEND + VALIDATE + FILL GAPS + tasks.md + cross-SF review (EPIC ONLY)
STEP 11: Validate requirements    -> Coverage check (GATE: coverage_validated)
STEP 12: Validation Gate          -> feature-plan schema gate
STEP 13: Plan Review              -> @plan-reviewer-agent verdict + fix loop (GATE: plan_reviewed)
STEP 14: Completion               -> Inform user
```

**Reuse feature ID:** `add.plan` does NOT allocate a new ID. Read `id: [NNNN]F` from the feature's `about.md` frontmatter in STEP 5. The generated `plan.md` carries the SAME `[NNNN]F` with `related: [[NNNN]F]`.

---

## STEP 1: Load Founder Profile (SILENT)

Read `docs/owner.md` to determine communication style.

**IF profile exists:** Adjust communication style accordingly.
**IF not exists:** Use **Balanced** style as default.

**NEVER inform the user about this step. Execute SILENTLY.**

---

## STEP 2: Run Context Mapper (FIRST COMMAND)

Execute: `bash .codeadd/scripts/status.sh`

Provides: BRANCH (feature ID, type, phase), FEATURE_DOCS (HAS_DESIGN, HAS_PLAN), DESIGN_SYSTEM, FRONTEND (component structure), ALL_FEATURES, RECENT_CHANGELOGS (last 5), HAS_EPIC, EPIC_CURRENT_SF, EPIC_PROGRESS.

**NEVER skip this script. ALL subsequent steps depend on its output.**

**Epic Detection:** IF `HAS_EPIC=true`, read epic.md, identify next pending SF (EPIC_CURRENT_SF), set scope to that SF only, load its about.md + shared discovery.md, and inform user: "Planning subfeature ${EPIC_CURRENT_SF} of epic ${FEATURE_ID}". IF HAS_EPIC=true AND no pending subfeature, NEVER plan—inform user all SFs complete and suggest `/add.done`.

---

## STEP 3: Load Recent Context (INTELLIGENT)

**Cache Detection:** IF `docs/features/${FEATURE_ID}/past-features.md` exists, read it (cache). IF cache + discovery.md has section "Related Features", use as context and skip agent dispatch. Otherwise, dispatch Past Features Discovery Agent.

**Agent Dispatch (if needed):**
- **Agent:** @discovery-agent
- **Skill:** `add-feature-discovery` Phase 1.5
- **Input:** about.md + RECENT_CHANGELOGS (from status.sh)
- **Output:** `docs/features/${FEATURE_ID}/past-features.md`

**Extract and Apply:** From past-features.md (cached or generated), identify:
- Files available for reuse
- Recently established patterns and technical decisions
- Correct codebase terminology for searches
- Implementation order respecting dependencies (`depends`)
- Related patterns (`shares-pattern` relation)
- Known conflicts (`conflicts` relation)

**Fallback:** IF past-features.md has no relevant matches, analyze RECENT_CHANGELOGS manually by keyword. IF match found and discovery.md doesn't reference it, read full changelog of that feature.

**Goal:** Use knowledge from recent deliveries to inform planning, avoiding reinventing the wheel.

**Consult Knowledge Base:** Load `{{skill:add-knowledge-discovery/SKILL.md}}` and run its procedure using the WIKI fields already parsed from STEP 2 status.sh (`WIKI:present`, `WIKI_STALE_COUNT`). SELECT the minimal page set (hub + 1-3 pages) for the feature's domain(s), and freshness-check each. IF `WIKI:present` is false → note "knowledge base unavailable — /add.wiki generates it" and proceed with code-first discovery. Carry the selected page paths + one-line reasons + freshness verdicts forward into STEP 5's file-loading matrix and STEP 8's subagent bootstrap block.

---

## STEP 4: Parse Key Variables (GATE: feature_identified)

Extract from status.sh: `FEATURE_ID`, `CURRENT_PHASE` (must be `discovered` or `designed`), `HAS_DESIGN`, `HAS_FOUNDATIONS`.

**Feature targeting (detection order):** explicit `F[NNNN]` argument > `FEATURE_ID` from status.sh (branch) > `feature_identified` ask-gate (list features, WAIT — see GATES table).

**IF feature identified:** Display metadata and proceed to STEP 5.
**IF feature_identified gate fails:** Show feature list and WAIT for user choice. Ref: GATES table.

---

## STEP 5: Load Feature Documentation (GATE: docs_loaded)

**File loading matrix:**

| Type | Files to read | Priority |
|------|---------------|----------|
| Epic feature (HAS_EPIC=true) | `${SF_DIR}/about.md`, `${FEATURE_DIR}/discovery.md`, `${SF_DIR}/plan.md` (if exists), `${SF_DIR}/design.md` (if HAS_DESIGN), `${FEATURE_DIR}/epic.md` (schema `epic`), `docs/design-system.md` (if exists) | PRIMARY |
| Normal feature | `${FEATURE_DIR}/about.md`, `${FEATURE_DIR}/discovery.md`, `design.md` (if HAS_DESIGN), `docs/design-system.md` (if HAS_FOUNDATIONS) | PRIMARY |
| Design data | Use design.md to inform backend contracts (endpoints serve UI needs) | IF HAS_DESIGN=true |
| Knowledge base | Selected wiki pages from STEP 3's Consult Knowledge Base sub-step (paths + freshness verdicts) | IF WIKI:present |

**Gate enforcement:** about.md AND discovery.md are MANDATORY. IF either missing, STOP and inform user. Ref: GATES table.

**Provenance source:** the `about.md` read in this step is the provenance source for STEP 8.1. Record its exact path (`${SF_DIR}/about.md` when HAS_EPIC=true, else `${FEATURE_DIR}/about.md`) as `${ABOUT_PATH}` — 8.1.0 and 8.1.4 hash those same bytes.

---

## STEP 6: Clarification Questions (IF NEEDED ONLY)

**ONLY ask questions if `about.md` and `discovery.md` leave critical decisions undefined.**

Present questions with options and a RECOMMENDED default. Format: `### 1. [Question]` with `- a) / - b)` options and `> RECOMMENDED: [x] - [reason]`. User answers with `1a, 2b` or `recommended`.

**IF no clarification needed:** Proceed directly to STEP 7.

---

## STEP 7: Analyze Scope & Determine Structure (GATE: scope_determined)

**Scope determination:**

| Condition | Scope | Action |
|-----------|-------|--------|
| HAS_EPIC=true | Current subfeature only | Read ${SF_DIR}/about.md, do NOT plan entire epic |
| Normal feature | Entire feature | Read ${FEATURE_DIR}/about.md + discovery.md |

**Subagent selection matrix:**

| Keywords | Subagent | Create if |
|----------|----------|-----------|
| entities, tables, migrations, new data | Database Specialist | Feature needs data changes |
| endpoints, API, controllers, commands, events, workers, queues | Backend Specialist | Feature needs business logic |
| pages, components, UI, forms, hooks | Frontend Specialist | Feature needs UI changes |

**Decision rule:** Only create subagents the feature actually needs. Examples:
- Backend-only feature → Database + Backend Specialist only
- Full-stack feature → All three
- Simple UI change → Frontend Specialist only

**Persist the selection (MANDATORY):** the selection is not just informational — later steps branch on it. State these variables explicitly in this step's output, one line each, and carry them forward in context:

```
FRONTEND_SELECTED = true|false   # Frontend Specialist is in the subagent list
DATABASE_SELECTED = true|false
BACKEND_SELECTED  = true|false
```

`FRONTEND_SELECTED` is read by STEP 8.1's gate (no UX design work happens when it is `false`) and by 8.4. NEVER re-derive it later from prose — read the value stated here.

**Inform user:** Type (FEATURE/EPIC), scope summary, subagent list. Ref: GATES table for scope_determined requirements.

---

## STEP 8: Execute Subagents (SEQUENTIAL)

**Execution rule:** SEQUENTIAL only. Wait for each subagent to complete before dispatching next.

<!-- plugin:gitnexus:graph-plan -->
<!-- /plugin:gitnexus:graph-plan -->

**Output location:** Each subagent writes to: `docs/features/${FEATURE_ID}/plan-[area].md` (temporary; deleted after consolidation).

---

### 8.0 Cross-SF Context (EPIC ONLY)

**IF HAS_EPIC=true:** Resolve the dependency graph from `epic.md` per the `epic` schema in `{{skill:add-doc-schemas/references/new-feature.md}}` — read the Subfeatures table **by header name**, never by column position, and take dependencies from the `dependencies` column when populated, falling back to the `## Order` narrative section only when `dependencies` is absent (the schema's own precedence rule). **Providers** = the SF ids in this SF's own `dependencies` cell (or Order entry). **Consumers** = every other SF whose `dependencies` cell (or Order entry) names this SF. Read each provider's/consumer's about.md + plan.md (if exists), build `${CROSS_SF_CONTEXT}` block below, and INJECT it into every subagent prompt:

```
## Cross-SF Context (EPIC -- read for integration awareness)

### Consumers (SFs that need data from this SF):
- **${SF_ID}**: ${1-line description of data needed}

### Providers (SFs that supply data to this SF):
- **${SF_ID}**: ${1-line description of data supplied} | Contracts: ${schemas/DTOs if plan.md exists}

### Integration rules:
- Schema fields MUST match consumer expectations
- Shared resources (enums, config vars, types) defined ONCE in earliest SF
- Document jsonb field structures when consumers depend on specific keys
```

**IF normal feature (no epic.md):** Skip this step. `${CROSS_SF_CONTEXT}` = empty.

---

### 8.1 UX Design Specialist (gated — produces `design.md`)

`add.plan` OWNS the design contract. When the feature touches UI, this sub-step produces the consolidated `design.md` that 8.4 (Frontend), STEP 10 and the QA judgement in `/add.review` all read. Three dispatches + one coordinator consolidation.

⛔ NO human `[STOP]` anywhere in 8.1 — every accept/reject decision here belongs to the coordinator.

**SF_DIR:** `SF_DIR = ${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*` (single match; the same glob `status.sh`'s `SF_DIR_GLOB` resolves).

**Scope dir:** `SCOPE_DIR = ${SF_DIR}` when HAS_EPIC=true, else `${FEATURE_DIR}` (the same rule `/add.review`'s QA scope resolution uses). All 8.1 temps AND the final `design.md` live in `${SCOPE_DIR}`. `${SF_SUFFIX}` = ` (subfeature ${EPIC_CURRENT_SF})` when HAS_EPIC=true, empty otherwise.

**`design.md` resolution (for every consumer, including the skip path):** resolve it per the `feature-design` **Location** rule in `{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first, feature-level fallback).

#### 8.1.0 Gate (evaluate BEFORE any dispatch)

Evaluate all four checks IN ORDER and STATE the verdict + reason in your output. Checks 1-3 are skip gates — ANY skip verdict there means 8.1 does NOT run. Check 4 is a **schema override**: it can force 8.1 to run even when check 3 said skip.

1. **Frontend gate:** `FRONTEND_SELECTED = true` (the value stated in STEP 7). IF false → SKIP 8.1, note "no UI in scope".
2. **Scope gate:** count the screens/pages declared in `about.md` + `discovery.md` and check for structural keywords (wizard, onboarding, multi-step, flow, dashboard, settings-panel). SKIP 8.1 when the feature introduces NO new or restructured screen AND declares NO new component — i.e. changes confined to existing components on existing screens. On skip → note it; `@frontend-agent` (8.4) then plans against the EXISTING `design.md` (resolution above).
3. **Idempotency by provenance (NEVER mtime):** compute the hash of the exact `about.md` bytes read in STEP 5:

```bash
sha256sum "${ABOUT_PATH}" | cut -d' ' -f1     # macOS: shasum -a 256 "${ABOUT_PATH}" | cut -d' ' -f1
```

   → `${ABOUT_SHA}`. IF `${SCOPE_DIR}/design.md` exists AND its frontmatter carries `provenance: sha256:${ABOUT_SHA}` → SKIP 8.1, note "design.md up to date (provenance match)". IF the file exists and the value differs or is absent → RUN 8.1 and record WHY in the output ("about.md changed since design.md was written" / "design.md predates provenance tracking").

4. **Contract-schema override (runs even when check 3 said SKIP):** a `design.md` written before the layout-tree + `## Design Contract` schema carries a perfectly valid `provenance` hash, so check 3 alone would skip regeneration **forever** while the contract stays absent. Read the existing `${SCOPE_DIR}/design.md` and check for BOTH a `## Design Contract` section and a layout tree. IF either is missing → **OVERRIDE the check-3 skip and RUN 8.1**, recording the reason "design.md predates the Design Contract schema — regenerating". IF check 3 already decided RUN, this check changes nothing.

⛔ NEVER decide freshness from file mtime, git status, or "it looks recent". The provenance hash is the only signal.

⛔ A `design.md` with no `## Design Contract` is not a cosmetic gap — it silently disables `@qa-agent`'s deterministic conformance axis and leaves `/add.review`'s contract check with nothing to verify. Never let a provenance match preserve one.

#### 8.1.1 DISPATCH @ux-flow-agent (flow & interaction)

- **Output (temps):** `${SCOPE_DIR}/design-context.md` + `${SCOPE_DIR}/design-flow.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}`, then pass ONLY: target directory `${SCOPE_DIR}` (exact — never invent a path), the two output paths above, the inputs `${ABOUT_PATH}` + `${FEATURE_DIR}/discovery.md`, and `HAS_FOUNDATIONS=${HAS_FOUNDATIONS}` (if true it reads `docs/design-system.md` and prefers its tokens). Instruct it to follow its own agent definition — do NOT restate the method here — and to report `frontend_false` and STOP without writing, if the project has no frontend at all.
- **Early exit:** IF the agent reports `frontend_false` → SKIP the remainder of 8.1 (no `design.md` is written), note it in your output, and continue with 8.2-8.4 as selected in STEP 7.
- **Soft-degrade:** if `@ux-flow-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill.

#### 8.1.2 DISPATCH @ux-layout-agent (layout & components)

- **Output (temp):** `${SCOPE_DIR}/design-layout.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}`, then pass ONLY: target directory `${SCOPE_DIR}`, the MANDATORY inputs `${SCOPE_DIR}/design-flow.md` + `${SCOPE_DIR}/design-context.md` (read FIRST), the fallback context `${ABOUT_PATH}` / `${FEATURE_DIR}/discovery.md`, and the output path above. Instruct it to follow its own agent definition — the layout method lives there, not here.
- **Soft-degrade:** if `@ux-layout-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill.

#### 8.1.3 DISPATCH @ux-agent (critique mode — adversarial, ONE bounded pass)

- **Output (temp):** `${SCOPE_DIR}/design-review.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}` and state **CRITIQUE MODE — read-only**, then pass ONLY: target directory `${SCOPE_DIR}`, the inputs `design-flow.md` / `design-layout.md` / `design-context.md` at that directory, and the output path above. The rubric, the per-defect shape, the severity scale and the empty-critique rule are its agent definition's — do NOT restate them. State that it NEVER edits `design-flow.md`, `design-layout.md`, or `design.md`: it reports, the coordinator decides.
- **Soft-degrade:** if `@ux-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill (the rubric is `{{skill:add-ux-design/critique-rubric.md}}`).

#### 8.1.4 Coordinator Consolidation → `design.md`

Execute the **Consolidation contract** for schema `feature-design` in `{{skill:add-doc-schemas/references/new-feature.md}}` — the four temps, the accept/reject decision trail, the coherence validation, the section list, the exact frontmatter block, the `## Design Review` table shape and the provenance-truthfulness rule all live there. Set `provenance: sha256:${ABOUT_SHA}` (the hash computed at 8.1.0) and write to `${SCOPE_DIR}/design.md`.

⛔ DO NOT re-dispatch `@ux-layout-agent` to apply the critique — consolidation is coordinator work.
⛔ `${ABOUT_SHA}` is only truthful because 8.1.0 recomputed it — never stamp it over a reused temp.

<!-- MAINTAINER: do not restate the frontmatter or section shape here. Cite the schema so this command cannot drift from it. Change it in the schema, never here. -->

#### 8.1.5 Validation Gate (`feature-design`)

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `feature-design` against the `design.md` you just wrote. ⛔ DO NOT skip. Require `PASS` before 8.1.6.

#### 8.1.6 Cleanup Temporary Files

```bash
cd "${SCOPE_DIR}"
rm -f design-context.md design-flow.md design-layout.md design-review.md
```

Delete only AFTER `design.md` is written and the 8.1.5 gate returned `PASS`.

---

### Subagent Bootstrap (shared across 8.2-8.4)

Every area subagent receives this bootstrap block before its specific task. `${WIKI_PAGES}` = the page paths selected in STEP 3's Consult Knowledge Base sub-step, one line each: path + one-line reason + freshness verdict. Empty if no wiki was consulted — subagents read the listed pages themselves (JIT), never inlined content:

```
## TASK_DOCUMENTS (read ALL before starting -- source of truth)
${TASK_DOCUMENTS}

${CROSS_SF_CONTEXT}

## Knowledge Base (JIT -- read only the pages relevant to your area)
${WIKI_PAGES}

## MANDATORY: Load Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Check for previous planning files: ls docs/features/${FEATURE_ID}/plan-*.md
```

---

### 8.2 Database Specialist

**When to create:** Feature requires new entities, tables, or data changes.

**DISPATCH AGENT: @database-agent**
- **Output:** `docs/features/${FEATURE_ID}/plan-database.md`
- **Prompt:**
  ```
  You are the DATABASE SPECIALIST planning for feature ${FEATURE_ID}.

  ${SUBAGENT_BOOTSTRAP}

  ## Your Task
  Create the database planning section. Find similar entities and repositories in the codebase to use as references.
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

### 8.3 Backend Specialist

**When to create:** Feature requires API, business logic, workers, or events.

**DISPATCH AGENT: @backend-agent**
- **Output:** `docs/features/${FEATURE_ID}/plan-backend.md`
- **Prompt:**
  ```
  You are the BACKEND SPECIALIST planning for feature ${FEATURE_ID}.

  ${SUBAGENT_BOOTSTRAP}

  ## MANDATORY: Load Backend Development Skill
  BEFORE designing endpoints, read skill `add-backend-development` (RESTful API, IoC/DI, DTO naming, CQRS, multi-tenancy).

  ## Your Task
  Create the backend planning section covering: API, Commands, Events, Workers (if needed).
  Find similar modules in the codebase to use as references.

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

### 8.4 Frontend Specialist

**When to create:** Feature requires UI changes.

**Reference, Never Repeat:** the frontend section REFERENCES `design.md` for layout, tokens, and states — it NEVER restates them. The layout contract lives in `design.md` only (written by 8.1, or the pre-existing one when 8.1 was skipped); `plan-frontend.md` carries the code-side structure (pages, components, hooks, types) and points at `design.md` for the visual contract.

**DISPATCH AGENT: @frontend-agent**
- **Output:** `docs/features/${FEATURE_ID}/plan-frontend.md`
- **Prompt:**
  ```
  You are the FRONTEND SPECIALIST planning for feature ${FEATURE_ID}.

  ${SUBAGENT_BOOTSTRAP}
  4. Read docs/design-system.md (if exists - tokens)

  ## Your Task
  Create the frontend planning section.
  **If design.md exists:** Follow its layout specs, component inventory, and mobile-first
  requirements, and REFERENCE it — cite `design.md` (plus screen name) for layout, tokens,
  and states instead of restating them. The layout lives in design.md only.
  **If not:** Find similar pages/components in the codebase to use as references.

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
  - NEVER restate design.md layout/tokens/states — reference them (Reference, Never Repeat)
  - Keep it under 40 lines
  ```

**End of the area subagents.** 8.2-8.4 have run sequentially; every selected area now has its `plan-<area>.md` temp.

<!-- feature:tdd-pipeline:step9 -->
<!-- /feature:tdd-pipeline:step9 -->

---

## STEP 10: Consolidate Plan (APPEND + VALIDATE + FILL GAPS)
<!-- feature:qa-pipeline:qa-spec -->
<!-- /feature:qa-pipeline:qa-spec -->

**QA axis self-check:** IF no `10.0 QA-Spec Subagent` section is present above (the `qa-pipeline` feature is disabled) → `plan-qa-spec.md` will NOT be generated. Add one line to the STEP 14 completion output: the QA axis is off and `codeadd features enable qa-pipeline` turns it on. Do NOT stop — the plan is valid without QA.

**Philosophy:** Preserve subagent outputs (APPEND), ensure discovery/design completeness (VALIDATE), complete identified gaps (FILL GAPS).

**Schema load (MANDATORY):** Execute schema `feature-plan` from `{{skill:add-doc-schemas/SKILL.md}}`. Reuse `[NNNN]F` from about.md. Apply cache technique per skill.

### 10.1 Assemble plan.md

Create plan.md header: `# Plan: ${FEATURE_ID}`. Append subagent outputs in order (preserving original content):
1. plan-test-spec.md (if exists)
2. plan-database.md (if exists)
3. plan-backend.md (if exists)
4. plan-frontend.md (if exists)
5. plan-qa-spec.md (if exists)

Separate each section with `---`. **NEVER rewrite or summarize subagent content. Append directly.**

### 10.2 Validate Completeness

Read discovery.md and design.md (if exists — resolve per the SCOPE_DIR rule in 8.1: SF-level first, feature-level fallback). Verify:
- All entities/tables from discovery → complete schema in plan-database
- JSONB fields → detailed TypeScript structures
- Endpoints → complete request/response DTOs
- Events/workers → documented payloads and consumers
- Design components → mapped in plan-frontend
- States/interactions → defined hooks and stores
- Frontend types mirror backend DTOs
- Main flow is clear (call chain documented)

### 10.3 Fill Gaps

IF validation identifies gaps, ADD directly to plan.md. Common gaps:
- **Missing table schema** → Complete CREATE TABLE with all discovery fields
- **Missing JSONB structure** → TypeScript interface with detailed field types
- **Incomplete API contract** → Request/Response tables (Field | Type | Required | Description)

**Rule:** If discovery.md contains information, it MUST appear in plan.md in actionable form for developer.

### 10.4 Generate tasks.md (Architect Subagent)

**MANDATORY:** Load `{{skill:add-tasks-checklist/SKILL.md}}` BEFORE dispatching.

**Dispatch:** @architecture-agent
- **Output:** `${PLAN_DIR}/tasks.md` (feature dir or subfeature dir if epic)
- **Prompt template:** From `add-tasks-checklist` ("Architect Subagent Prompt Template" section), substituting `${FEATURE_ID}`, `${EPIC_CURRENT_SF}`, `${PLAN_DIR}`

**Rules:**
- tasks.md MUST have exact sections: `## Metadata`, `## Requirements Coverage`, `## TDD`, `## Execution`, `## Acceptance Checklist`, `## Quality Gates` (validators parse by text)
- plan.md FROZEN after this step (no spec checklist section)
- Every RF/RN in Requirements Coverage MUST link to ≥1 Acceptance Checklist item
- All checkboxes start as `[ ]` (no pre-ticking)

### 10.5 Cross-SF Integration Review (EPIC ONLY)

**IF HAS_EPIC=true:** After tasks.md generated, dispatch @architecture-agent for integration review.
**IF normal feature:** Skip to 10.6.

**Purpose:** COMPLETENESS of the subfeature plans as a set — fragmented enums/config, missing fallback behavior, missing DI registration. 10.5 is the **in-place fixer**.

**What 10.5 does NOT own:** DIVERGENCE between two subfeature plans. That belongs to `@consistency-agent` — the read-only judge of the five-dimension rubric in `{{skill:add-cross-sf-consistency/SKILL.md}}` (API contracts, data schema, requirements, design tokens, auth model), dispatched by `/add.plan-to-ready`. Two checks 10.5 used to derive itself now live there: **Schema ↔ Consumer Alignment** → that agent's dimension 2 (data schema); **Cross-SF Handoff Contracts** → that agent's dimension 1 (API contracts). 10.5 **consumes** its findings for both and MUST NOT re-derive them — one detector, one rubric, never a second verdict.

**Where the line falls:** every agent dimension asks *do two declarations disagree?*; every check that stays here asks *is one plan complete?* Check 1 below asks whether a declaration is **duplicated** — a different question whose answer is a plan edit, not a verdict. The agent judges and never edits; 10.5 edits.

**Checks to fix in-place — these three, and only these three:**
1. Shared Resource Centralization (enums/config added ONCE in earliest SF)
2. Fallback & Degradation (SFs depending on unimplemented SFs have fallback behavior)
3. Worker/DI Registration (new services have DI tasks)

**Consumed, never derived:** a `FULL`-pass `@consistency-agent` finding on dimension 1 (API contracts) or dimension 2 (data schema) arrives as a concrete `plan.md` edit — apply it in place here. Do NOT open your own schema-alignment or handoff-contract comparison.

**Output:** Summary of changes (file + what changed) to stdout, marking which edits came from a `@consistency-agent` finding. NEVER create separate report file. ONLY fix integration issues. Preserve existing content. Keep each plan.md under 150 lines.

### 10.6 Add Navigation Sections

Append to plan.md: **Overview** (1-2 paragraphs from about.md), **Main Flow** (numbered Actor→Action steps), **Implementation Order** (Database→Backend→Frontend), **Quick Reference** (pattern→codebase search terms: Entity, Repository, Controller, Command, Hook, Page).

### 10.7 Cleanup Temporary Files

```bash
cd "docs/features/${FEATURE_ID}"
rm -f plan-database.md plan-backend.md plan-frontend.md plan-test-spec.md plan-qa-spec.md
```

Delete only after plan.md complete AND coverage validated.

---

## STEP 11: Validate Requirements Coverage (GATE: coverage_validated)

**Extract** all RFs, RNs, and Scope items from discovery.md. **Map** each requirement to Feature/Area and specific tasks. **IF no task exists → CREATE task or JUSTIFY exclusion.**

**Generate coverage table** in plan.md:

| ID | Requirement | Covered? | Feature/Area | Tasks |
|----|-------------|----------|--------------|-------|
| RF01 | User creates account | YES | Backend + Frontend | 1.1, 1.2, 1.3 |
| RF05 | Admin toggle RLS | EXCLUDED | - | Out of scope — validated with user |

**Validation:** IF Coverage = 100% → Proceed to STEP 12. IF Coverage < 100% → STOP, resolve gaps (add tasks or document exclusions), re-validate. Ref: GATES table.

---

## STEP 12: Validation Gate

Execute validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `feature-plan`. ⛔ DO NOT skip. Require `PASS` before proceeding.

---

## STEP 13: Plan Review (GATE: plan_reviewed)

Schema gate PASSED. Do not present `plan.md` or the next command as delivered yet.

1. **DISPATCH** `@plan-reviewer-agent` with `path` = `plan.md`'s path and `kind: feature-plan`. **Soft-degrade:** if the engine has no subagent dispatch, apply `{{skill:add-plan-review/SKILL.md}}` inline, explicitly forgetting this conversation.
2. **Act on the verdict:**
   - `ok` → proceed to STEP 14.
   - `fix-then-ok` → apply only the Required fixes that do not invent a user decision, **re-run STEP 12's validation gate on `plan.md`**, then re-dispatch `@plan-reviewer-agent` **once**. After that single re-dispatch, proceed to STEP 14 unless the verdict is still `blocked` or blockers remain.
   - `blocked`, or blockers still standing after the one re-dispatch → STOP. Ref: GATES table (`plan_reviewed`). Present the blockers to the user; do NOT proceed to STEP 14.
3. ⛔ Do NOT re-dispatch `@ux-flow-agent`, `@ux-layout-agent`, or `@ux-agent` to satisfy a plan-review finding — those subagents own `design.md`, not `plan.md`; a `design.md` finding is out of scope for this review.

---

## STEP 14: Completion

Inform user with summary:
- Feature ID and plan path
- Areas planned (UX Design/Database/Backend/Frontend)
- Design contract: the `design.md` path 8.1 wrote — or the reason 8.1 was skipped (no UI in scope / no new screen or component / provenance match / no frontend)
- Key metrics (endpoint count, task count, RF/RN count)
- Plan review verdict from STEP 13, and a one-line summary of any applied fixes
- Suggested next command: read `add-ecosystem` Main Flows section to determine `/add.build` or `/add.plan-to-ready`

---

## Execution Rules

| Rule | Category |
|------|----------|
| Keep final plan.md under 150 lines | Size constraint |
| Use tables for all structured data (not prose) | Readability |
| Reference similar files instead of writing code | Patterns |
| Create only subagents the feature actually needs | Scope |
| Execute subagents SEQUENTIALLY (not parallel) | Ordering |
| Delete temporary plan-*.md files after consolidation | Cleanup |
| Load skill files before planning each area | Prerequisites |
| Append subagent outputs without rewriting | Preservation |
| Validate 100% requirements coverage before finalizing | Gate enforcement |

---

## Quick Skill Reference

- Backend: `add-backend-development`
- Database: `add-database-development`
- Frontend (Code): `add-frontend-development`
- Frontend (UI): `add-ux-design`
- Schemas: `add-doc-schemas`
- ID Convention: `add-id-convention`
- Tasks Checklist: `add-tasks-checklist`
- Feature Discovery: `add-feature-discovery`
- Plan Review: `add-plan-review`

---

## Error Handling

| Error | Action |
|-------|--------|
| about.md or discovery.md missing | STOP — cannot plan without RFs/RNs. Inform user. |
| status.sh fails | STOP — show error. Check .codeadd setup. |
| Subagent output not written | Re-dispatch once. If still fails, plan manually. |
| >5 features in Epic | STOP — split into multiple Epics. Inform user. |
| Coverage < 100% | STOP — resolve gaps in tasks.md. Re-validate. |
