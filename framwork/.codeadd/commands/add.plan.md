# Technical Planning Orchestrator

<!-- uses:
- skill: add-backend-development
- skill: add-cross-sf-consistency
- skill: add-database-development
- skill: add-delivery-mode
- skill: add-doc-schemas
- skill: add-feature-discovery
- skill: add-final-report
- skill: add-frontend-development
- skill: add-id-convention
- skill: add-knowledge-discovery
- skill: add-plan-review
- skill: add-review-discipline
- skill: add-tasks-checklist
- skill: add-ux-design
- skill: add-doc-schemas/references/new-feature.md
- skill: add-ux-design/critique-rubric.md
- skill: add-subagent-driven-development
- skill: add-subagent-driven-development/references/dispatch-rules.md
- agent: architecture-agent
- agent: backend-agent
- agent: consistency-agent
- agent: database-agent
- agent: discovery-agent
- agent: frontend-agent
- agent: plan-reviewer-agent
- agent: qa-agent
- agent: readback-agent
- agent: ux-agent
- agent: ux-flow-agent
- agent: ux-layout-agent
- command: /add.build
- command: /add.done
- command: /add.review
- command: /add.wiki
- script: status.sh
-->

> **ARCHITECTURE REFERENCE:** Use `AGENTS.md` as source of patterns.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.
> **ARGS:** `/add.plan [F[NNNN]]` — explicit `F[NNNN]` targets a feature off-branch (overrides branch detection).

Coordinator for technical planning. Loads context, dispatches specialized subagents (UX Design, Database, Backend, Frontend), consolidates plan with APPEND + VALIDATE + FILL GAPS, and validates 100% requirements coverage.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules). Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format. Load `{{skill:add-plan-review/SKILL.md}}` before STEP 12 (pre-delivery review rubric + verdict contract).

---

## GATES (Invariant Execution Blockers)

| Gate | Triggered at | Condition | Action | Stop kind |
|------|--------------|-----------|--------|-----------|
| `feature_identified` | STEP 3 | FEATURE_ID is empty | List all features, WAIT for user choice, NEVER proceed without selection | deciding |
| `docs_loaded` | STEP 4 | about.md OR discovery.md missing | STOP, inform user, NEVER dispatch subagents | deciding |
| `scope_determined` | STEP 6 | Epic/Feature type unclear OR subagents unidentified | NEVER dispatch subagents, ALWAYS complete scope analysis first | — (not a user stop) |
| `design_gate` | STEP 7.1.0 | Any of checks 1-3 (frontend / scope / provenance) returns a skip verdict AND check 4 (contract-schema) does not override it | NEVER dispatch a UX agent; STATE the verdict + reason, skip 7.1, continue at 7.2 | — (not a user stop) |
| `design_validated` | STEP 7.1.5 | `feature-design` schema gate did not return PASS | NEVER delete the 7.1 temps, NEVER proceed to 7.2 — fix `design.md` and re-run the gate | — (not a user stop) |
| `coverage_validated` | STEP 10 | Coverage < 100% | STOP, resolve gaps (add tasks or document exclusions), re-validate before finalizing | deciding |
| `plan_reviewed` | STEP 12 | `@plan-reviewer-agent` verdict is `blocked`, blockers remain after the re-dispatch `add-review-discipline` allows, or `@consistency-agent` leaves a conflict standing | STOP, present the blockers to the user; NEVER proceed to STEP 13 Completion | deciding |

**Stop kind** follows `{{skill:add-delivery-mode/SKILL.md}}`: a **deciding** stop waits on every
delivery mode; a **confirming** stop waits only on `confirm`, and on `automatic` prints what it would
have shown and continues. Every gate above that stops is deciding — each presents a failure or a choice
no approval covered.

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
STEP 1:  Run context mapper       -> FIRST COMMAND
STEP 2:  Load recent context      -> INTELLIGENT changelog reading
STEP 3:  Parse key variables      -> Feature detection (GATE: feature_identified)
STEP 4:  Load feature docs        -> about.md, discovery.md, design.md (GATE: docs_loaded)
STEP 5:  Clarification questions  -> IF NEEDED ONLY
STEP 6:  Analyze scope            -> Epic/Feature type + subagent selection (GATE: scope_determined)
STEP 7:  Execute subagents        -> SEQUENTIAL by area
  - 7.0: Cross-SF context (EPIC ONLY)
  - 7.1: UX Design Specialist (gated -> design.md)
  - 7.2: Database Specialist
  - 7.3: Backend Specialist
  - 7.4: Frontend Specialist
<!-- feature:qa-pipeline:step-list -->
<!-- /feature:qa-pipeline:step-list -->
<!-- feature:tdd-pipeline:step-list -->
<!-- /feature:tdd-pipeline:step-list -->
STEP 9:  Consolidate plan         -> preview (9.0.1), then APPEND + VALIDATE + FILL GAPS + tasks.md + cross-SF review (EPIC ONLY)
STEP 10: Validate requirements    -> Coverage check (GATE: coverage_validated)
STEP 11: Validation Gate          -> feature-plan schema gate
STEP 12: Plan Review              -> @plan-reviewer-agent verdict + fix loop, @consistency-agent FULL (EPIC), readback (GATE: plan_reviewed)
STEP 13: Completion               -> Inform user
```

**Reuse feature ID:** `add.plan` does NOT allocate a new ID. Read `id: [NNNN]F` from the feature's `about.md` frontmatter in STEP 4. The generated `plan.md` carries the SAME `[NNNN]F` with `related: [[NNNN]F]`.

---

## STEP 1: Run Context Mapper (FIRST COMMAND)

Execute: `bash .codeadd/scripts/status.sh`

Provides: BRANCH (feature ID, type, phase), FEATURE_DOCS (HAS_DESIGN, HAS_PLAN), DESIGN_SYSTEM, FRONTEND (component structure), ALL_FEATURES, RECENT_CHANGELOGS (last 5), HAS_EPIC, EPIC_CURRENT_SF, EPIC_PROGRESS.

**NEVER skip this script. ALL subsequent steps depend on its output.**

**Epic Detection:** IF `HAS_EPIC=true`, read epic.md, identify next pending SF (EPIC_CURRENT_SF), set scope to that SF only, load its about.md + shared discovery.md, and inform user: "Planning subfeature ${EPIC_CURRENT_SF} of epic ${FEATURE_ID}". IF HAS_EPIC=true AND no pending subfeature, NEVER plan—inform user all SFs complete and suggest `/add.done`.

---

## STEP 2: Load Recent Context (INTELLIGENT)

**Cache Detection:** IF `docs/features/${FEATURE_ID}/past-features.md` exists, read it (cache). IF cache + discovery.md has section "Related Features", use as context and skip agent dispatch. Otherwise, dispatch Past Features Discovery Agent.

**Before any dispatch in this command:** read `{{skill:add-subagent-driven-development/references/dispatch-rules.md}}` — a fresh dispatch leaves the engine's resume and session fields empty; only an id an earlier dispatch returned is ever passed.

**Agent Dispatch (if needed):**
- **Agent:** @discovery-agent
- **Capability:** read-only
- **Skill:** `add-feature-discovery` Phase 1.5
- **Input:** about.md + RECENT_CHANGELOGS (from status.sh)
- **Returns:** the complete `past-features.md` content, in its report

⛔ **The agent is read-only and writes nothing. THIS STEP writes the file** to
`docs/features/${FEATURE_ID}/past-features.md`, verbatim from the report.

```
IF THE REPORT CARRIES NO DOCUMENT:
  ⛔ DO NOT USE: Write on past-features.md
  ⛔ DO NOT: Continue to Extract and Apply against a file you just created empty
  ✅ DO: Report that the dispatch returned no content, and use the keyword fallback below
```

**Extract and Apply:** From past-features.md (cached or generated), identify:
- Files available for reuse
- Recently established patterns and technical decisions
- Correct codebase terminology for searches
- Implementation order respecting dependencies (`depends`)
- Related patterns (`shares-pattern` relation)
- Known conflicts (`conflicts` relation)

**Fallback:** IF past-features.md has no relevant matches, analyze RECENT_CHANGELOGS manually by keyword. IF match found and discovery.md doesn't reference it, read full changelog of that feature.

**Goal:** Use knowledge from recent deliveries to inform planning, avoiding reinventing the wheel.

**Consult Knowledge Base:** Load `{{skill:add-knowledge-discovery/SKILL.md}}` and run its procedure using the WIKI fields already parsed from STEP 2 status.sh (`WIKI:present`, `WIKI_STALE_COUNT`). SELECT the minimal page set (hub + 1-3 pages) for the feature's domain(s), and freshness-check each. IF `WIKI:present` is false → note "knowledge base unavailable — /add.wiki generates it" and proceed with code-first discovery. Carry the selected page paths + one-line reasons + freshness verdicts forward into STEP 4's file-loading matrix and STEP 7's subagent bootstrap block. **GRAPH question:** what has already been delivered in the area this plan touches, and what do those deliveries connect to? Resolve it in the skill's action table; do not name an action here. **`RELATED_WORK`, from the skill's GRAPH step, travels the same two routes**: each hit's `path` and typed relations go into STEP 4's matrix as documents to read, and the whole set goes into STEP 7's bootstrap block as `${RELATED_WORK}`. **It travels whether or not a wiki exists** — the GRAPH step is standalone and reads no wiki page, so a `WIKI:absent` run still carries it. A plan that proposes work already delivered nearby is the failure this closes.

```
IF `RELATED_WORK` IS STILL BLANK AFTER THE GRAPH STEP:
  ⛔ DO NOT: Carry on as though the step ran
  ✅ DO: Fill it with the hits, with `none` when the graph answered and had no match,
         or with `NOT VERIFIED` plus the reason when the graph could not be reached
```

---

## STEP 3: Parse Key Variables (GATE: feature_identified)

Extract from status.sh: `FEATURE_ID`, `CURRENT_PHASE` (must be `discovered` or `designed`), `HAS_DESIGN`, `HAS_FOUNDATIONS`.

**Feature targeting (detection order):** explicit `F[NNNN]` argument > `FEATURE_ID` from status.sh (branch) > `feature_identified` ask-gate (list features, WAIT — see GATES table).

**IF feature identified:** Display metadata and proceed to STEP 4.
**IF feature_identified gate fails:** Show feature list and WAIT for user choice. Ref: GATES table.

---

## STEP 4: Load Feature Documentation (GATE: docs_loaded)

**File loading matrix:**

| Type | Files to read | Priority |
|------|---------------|----------|
| Epic feature (HAS_EPIC=true) | `${SF_DIR}/about.md`, `${FEATURE_DIR}/discovery.md`, `${SF_DIR}/plan.md` (if exists), `${SF_DIR}/design.md` (if HAS_DESIGN), `${FEATURE_DIR}/epic.md` (schema `epic`), `docs/design-system.md` (if exists) | PRIMARY |
| Normal feature | `${FEATURE_DIR}/about.md`, `${FEATURE_DIR}/discovery.md`, `design.md` (if HAS_DESIGN), `docs/design-system.md` (if HAS_FOUNDATIONS) | PRIMARY |
| Design data | Use design.md to inform backend contracts (endpoints serve UI needs) | IF HAS_DESIGN=true |
| Knowledge base | Selected wiki pages from STEP 2's Consult Knowledge Base sub-step (paths + freshness verdicts) | IF WIKI:present |

**Gate enforcement:** about.md AND discovery.md are MANDATORY. IF either missing, STOP and inform user. Ref: GATES table.

**Delivery mode (read here, once):** resolve `DELIVERY` per `{{skill:add-delivery-mode/SKILL.md}}`.

| Source, in order | Value |
|---|---|
| `epic.md`'s `## Notes` carries a `delivery:` line (HAS_EPIC=true) | `automatic` for both `automatic` and `semi-automatic` — the pause between subfeatures belongs to `/add.build` |
| The intent file named by `about.md`'s frontmatter carries `delivery:` | That value |
| Neither | `confirm` |

**Objective (read here, once):** record `about.md`'s `## Objective` as `${OBJECTIVE}`. STEP 9 copies it
into `plan.md` verbatim. An `about.md` with no `## Objective` is a legacy document — record
`${OBJECTIVE}` as absent; STEP 9 then writes the section from `about.md`'s Problem, marked
`[derived from Problem, no objective in about.md]`.

<!-- feature:board:ticket-read -->
<!-- /feature:board:ticket-read -->

**Provenance source:** the `about.md` read in this step is the provenance source for STEP 7.1. Record its exact path (`${SF_DIR}/about.md` when HAS_EPIC=true, else `${FEATURE_DIR}/about.md`) as `${ABOUT_PATH}` — 7.1.0 and 7.1.4 hash those same bytes.

---

## STEP 5: Clarification Questions (IF NEEDED ONLY)

**ONLY ask questions if `about.md` and `discovery.md` leave critical decisions undefined.**

Present questions with options and a RECOMMENDED default. Format: `### 1. [Question]` with `- a) / - b)` options and `> RECOMMENDED: [x] - [reason]`. User answers with `1a, 2b` or `recommended`.

**IF no clarification needed:** Proceed directly to STEP 6.

---

## STEP 6: Analyze Scope & Determine Structure (GATE: scope_determined)

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

`FRONTEND_SELECTED` is read by STEP 7.1's gate (no UX design work happens when it is `false`) and by 7.4. NEVER re-derive it later from prose — read the value stated here.

**Inform user:** Type (FEATURE/EPIC), scope summary, subagent list. Ref: GATES table for scope_determined requirements.

---

## STEP 7: Execute Subagents (SEQUENTIAL)

**Execution rule:** SEQUENTIAL only. Wait for each subagent to complete before dispatching next.

<!-- plugin:gitnexus:graph-plan -->
<!-- /plugin:gitnexus:graph-plan -->

**Output location:** Each subagent writes to: `docs/features/${FEATURE_ID}/plan-[area].md` (temporary; deleted after consolidation).

---

### 7.0 Cross-SF Context (EPIC ONLY)

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

### 7.1 UX Design Specialist (gated — produces `design.md`)

`add.plan` OWNS the design contract. When the feature touches UI, this sub-step produces the consolidated `design.md` that 7.4 (Frontend), STEP 9 and the QA judgement in `/add.review` all read. Three dispatches + one coordinator consolidation.

⛔ NO human `[STOP]` anywhere in 7.1 — every accept/reject decision here belongs to the coordinator.

**SF_DIR:** `SF_DIR = ${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*` (single match; the same glob `status.sh`'s `SF_DIR_GLOB` resolves).

**Scope dir:** `SCOPE_DIR = ${SF_DIR}` when HAS_EPIC=true, else `${FEATURE_DIR}` (the same rule `/add.review`'s QA scope resolution uses). All 7.1 temps AND the final `design.md` live in `${SCOPE_DIR}`. `${SF_SUFFIX}` = ` (subfeature ${EPIC_CURRENT_SF})` when HAS_EPIC=true, empty otherwise.

**`design.md` resolution (for every consumer, including the skip path):** resolve it per the `feature-design` **Location** rule in `{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first, feature-level fallback).

#### 7.1.0 Gate (evaluate BEFORE any dispatch)

Evaluate all four checks IN ORDER and STATE the verdict + reason in your output. Checks 1-3 are skip gates — ANY skip verdict there means 7.1 does NOT run. Check 4 is a **schema override**: it can force 7.1 to run even when check 3 said skip.

1. **Frontend gate:** `FRONTEND_SELECTED = true` (the value stated in STEP 6). IF false → SKIP 7.1, note "no UI in scope".
2. **Scope gate:** count the screens/pages declared in `about.md` + `discovery.md` and check for structural keywords (wizard, onboarding, multi-step, flow, dashboard, settings-panel). SKIP 7.1 when the feature introduces NO new or restructured screen AND declares NO new component — i.e. changes confined to existing components on existing screens. On skip → note it; `@frontend-agent` (7.4) then plans against the EXISTING `design.md` (resolution above).
3. **Idempotency by provenance (NEVER mtime):** compute the hash of the exact `about.md` bytes read in STEP 4:

```bash
sha256sum "${ABOUT_PATH}" | cut -d' ' -f1     # macOS: shasum -a 256 "${ABOUT_PATH}" | cut -d' ' -f1
```

   → `${ABOUT_SHA}`. IF `${SCOPE_DIR}/design.md` exists AND its frontmatter carries `provenance: sha256:${ABOUT_SHA}` → SKIP 7.1, note "design.md up to date (provenance match)". IF the file exists and the value differs or is absent → RUN 7.1 and record WHY in the output ("about.md changed since design.md was written" / "design.md predates provenance tracking").

4. **Contract-schema override (runs even when check 3 said SKIP):** a `design.md` written before the layout-tree + `## Design Contract` schema carries a perfectly valid `provenance` hash, so check 3 alone would skip regeneration **forever** while the contract stays absent. Read the existing `${SCOPE_DIR}/design.md` and check for BOTH a `## Design Contract` section and a layout tree. IF either is missing → **OVERRIDE the check-3 skip and RUN 7.1**, recording the reason "design.md predates the Design Contract schema — regenerating". IF check 3 already decided RUN, this check changes nothing.

⛔ NEVER decide freshness from file mtime, git status, or "it looks recent". The provenance hash is the only signal.

⛔ A `design.md` with no `## Design Contract` is not a cosmetic gap — it silently disables `@qa-agent`'s deterministic conformance axis and leaves `/add.review`'s contract check with nothing to verify. Never let a provenance match preserve one.

#### 7.1.1 DISPATCH @ux-flow-agent (flow & interaction)

- **Output (temps):** `${SCOPE_DIR}/design-context.md` + `${SCOPE_DIR}/design-flow.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}`, then pass ONLY: target directory `${SCOPE_DIR}` (exact — never invent a path), the two output paths above, the inputs `${ABOUT_PATH}` + `${FEATURE_DIR}/discovery.md`, and `HAS_FOUNDATIONS=${HAS_FOUNDATIONS}` (if true it reads `docs/design-system.md` and prefers its tokens). Instruct it to follow its own agent definition — do NOT restate the method here — and to report `frontend_false` and STOP without writing, if the project has no frontend at all.
- **Early exit:** IF the agent reports `frontend_false` → SKIP the remainder of 7.1 (no `design.md` is written), note it in your output, and continue with 7.2-7.4 as selected in STEP 6.
- **Soft-degrade:** if `@ux-flow-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill.

#### 7.1.2 DISPATCH @ux-layout-agent (layout & components)

- **Output (temp):** `${SCOPE_DIR}/design-layout.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}`, then pass ONLY: target directory `${SCOPE_DIR}`, the MANDATORY inputs `${SCOPE_DIR}/design-flow.md` + `${SCOPE_DIR}/design-context.md` (read FIRST), the fallback context `${ABOUT_PATH}` / `${FEATURE_DIR}/discovery.md`, and the output path above. Instruct it to follow its own agent definition — the layout method lives there, not here.
- **Soft-degrade:** if `@ux-layout-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill.

#### 7.1.3 DISPATCH @ux-agent (critique mode — adversarial, ONE bounded pass)

- **Output (temp):** `${SCOPE_DIR}/design-review.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}` and state **CRITIQUE MODE — read-only**, then pass ONLY: target directory `${SCOPE_DIR}`, the inputs `design-flow.md` / `design-layout.md` / `design-context.md` at that directory, and the output path above. The rubric, the per-defect shape, the severity scale and the empty-critique rule are its agent definition's — do NOT restate them. State that it NEVER edits `design-flow.md`, `design-layout.md`, or `design.md`: it reports, the coordinator decides.
- **Soft-degrade:** if `@ux-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill (the rubric is `{{skill:add-ux-design/critique-rubric.md}}`).

#### 7.1.4 Coordinator Consolidation → `design.md`

Execute the **Consolidation contract** for schema `feature-design` in `{{skill:add-doc-schemas/references/new-feature.md}}` — the four temps, the accept/reject decision trail, the coherence validation, the section list, the exact frontmatter block, the `## Design Review` table shape and the provenance-truthfulness rule all live there. Set `provenance: sha256:${ABOUT_SHA}` (the hash computed at 7.1.0) and write to `${SCOPE_DIR}/design.md`.

⛔ DO NOT re-dispatch `@ux-layout-agent` to apply the critique — consolidation is coordinator work.
⛔ `${ABOUT_SHA}` is only truthful because 7.1.0 recomputed it — never stamp it over a reused temp.

<!-- MAINTAINER: do not restate the frontmatter or section shape here. Cite the schema so this command cannot drift from it. Change it in the schema, never here. -->

#### 7.1.5 Validation Gate (`feature-design`)

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `feature-design` against the `design.md` you just wrote. ⛔ DO NOT skip. Require `PASS` before 7.1.6.

#### 7.1.6 Cleanup Temporary Files

```bash
cd "${SCOPE_DIR}"
rm -f design-context.md design-flow.md design-layout.md design-review.md
```

Delete only AFTER `design.md` is written and the 7.1.5 gate returned `PASS`.

---

### Subagent Bootstrap (shared across 7.2-7.4)

Every area subagent receives this bootstrap block before its specific task.

`${WIKI_PAGES}` = the page paths selected in STEP 2's Consult Knowledge Base sub-step, one line each: path + one-line reason + freshness verdict. Empty if no wiki was consulted.

`${RELATED_WORK}` = the GRAPH step's hits from the same sub-step, one line each: id + path + one-line reason. **Never blank** — `none` when the graph answered and had no match, `NOT VERIFIED` plus the reason when it could not be reached. **Filled independently of `${WIKI_PAGES}`** — the two come from different steps and either can be empty while the other is not.

Subagents read the listed documents themselves (JIT), never inlined content:

```
## TASK_DOCUMENTS (read ALL before starting -- source of truth)
${TASK_DOCUMENTS}

${CROSS_SF_CONTEXT}

## Knowledge Base (JIT -- read only the pages relevant to your area)
${WIKI_PAGES}

## Related delivered work (JIT -- open only what your area touches)
${RELATED_WORK}

## MANDATORY: Load Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Check for previous planning files: ls docs/features/${FEATURE_ID}/plan-*.md
```

---

### 7.2 Database Specialist

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
  - MUST search codebase for similar files as references (paths from AGENTS.md)
  - Keep it under 40 lines
  ```

---

### 7.3 Backend Specialist

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
  - MUST search codebase for similar module as reference (paths from AGENTS.md)
  - Combine API + Workers in same section
  - Keep it under 60 lines
  - MUST follow skill `add-backend-development` patterns
  - Include Status column in Endpoints table
  ```

---

### 7.4 Frontend Specialist

**When to create:** Feature requires UI changes.

**Reference, Never Repeat:** the frontend section REFERENCES `design.md` for layout, tokens, and states — it NEVER restates them. The layout contract lives in `design.md` only (written by 7.1, or the pre-existing one when 7.1 was skipped); `plan-frontend.md` carries the code-side structure (pages, components, hooks, types) and points at `design.md` for the visual contract.

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
  - MUST search codebase for similar files as references (paths from AGENTS.md)
  - NEVER restate design.md layout/tokens/states — reference them (Reference, Never Repeat)
  - Keep it under 40 lines
  ```

**End of the area subagents.** 7.2-7.4 have run sequentially; every selected area now has its `plan-<area>.md` temp.

<!-- feature:tdd-pipeline:step9 -->
<!-- /feature:tdd-pipeline:step9 -->

---

## STEP 9: Consolidate Plan (APPEND + VALIDATE + FILL GAPS)
<!-- feature:qa-pipeline:qa-spec -->
<!-- /feature:qa-pipeline:qa-spec -->

**QA axis self-check:** IF no `9.0 QA-Spec Subagent` section is present above (the `qa-pipeline` feature is disabled) → `plan-qa-spec.md` will NOT be generated. Add one line to the STEP 13 completion output: the QA axis is off and `codeadd features enable qa-pipeline` turns it on. Do NOT stop — the plan is valid without QA.

**Philosophy:** Preserve subagent outputs (APPEND), ensure discovery/design completeness (VALIDATE), complete identified gaps (FILL GAPS).

### 9.0.1 Plan Preview [STOP]

**Before `plan.md` is written, show what it will say** — composed from what STEPS 4-7 already
produced. It runs no new analysis and dispatches nothing.

```markdown
**Objective:** <one line — ${OBJECTIVE}>
**Areas:** <one line per area planned — its name and what it includes>
**Order:** <the implementation order, and WHY it is that order, in one or two lines>
**Risk:** <one line per area — what is most likely to go wrong there>
**Excluded:** <what the plan will NOT do, one line per item>
```

```
IF COMPOSING THE PREVIEW:
  ⛔ DO NOT: List files, task ids or task detail — then someone reads the preview instead of the plan
  ⛔ DO NOT: Dispatch an agent or run a new query for it
  ✅ DO: Compose the five items from the analysis in hand, and print them
```

**Stop kind — confirming.** The preview reports a plan the brainstorm's approval already covered. On
`DELIVERY=confirm`, wait for the user to correct it or wave it through; on `automatic`, print it and
continue. **On an automatic delivery it is the one moment the user can see what is being decided
without them** — which is why it prints in full.

**Schema load (MANDATORY):** Execute schema `feature-plan` from `{{skill:add-doc-schemas/SKILL.md}}`. Reuse `[NNNN]F` from about.md. Apply cache technique per skill.

### 9.1 Assemble plan.md

Create plan.md header: `# Plan: ${FEATURE_ID}`, then the line `> **Delivery:** ${DELIVERY}` — `/add.build`
and `/add.review` read that line and nothing else to learn the mode. Then `## TL;DR`, then
**`## Objective`: `${OBJECTIVE}` copied verbatim**, followed by one line saying what is true once this plan
is built.
<!-- feature:board:ticket-done-when -->
<!-- /feature:board:ticket-done-when -->

```
IF WRITING `## Objective`:
  ⛔ DO NOT: Re-word it — a better sentence is a different objective
  ⛔ DO NOT: Point at about.md instead of copying — the reviewer reads plan.md alone
  ✅ DO: Copy it byte for byte, then add the one "once built" line
```

Append subagent outputs in order (preserving original content):
1. plan-test-spec.md (if exists)
2. plan-database.md (if exists)
3. plan-backend.md (if exists)
4. plan-frontend.md (if exists)
5. plan-qa-spec.md (if exists)

Separate each section with `---`. **NEVER rewrite or summarize subagent content. Append directly.**

**Write `## Global Constraints`** immediately after `## Context`, per the `feature-plan` schema. One line per requirement that binds the WHOLE plan rather than one task — RNFs from `about.md`, stack pins and validation gates from `AGENTS.md`, tokens from `design-system.md`. Copy each value **verbatim from its source** and cite that source in parentheses:

```markdown
## Global Constraints

- List renders in under 200ms for up to 100 items (about.md RNF01)
- Node 20.x; no `^` or `~` in package.json (AGENTS.md stack)
- `npm run lint` and `npm run typecheck` exit 0 (AGENTS.md validation_gates)
- Spacing only through `--space-*` tokens (design-system.md)
```

⛔ **Verbatim is load-bearing** — this block is handed to a downstream reviewer as its attention lens. "fast enough" cannot be reviewed; "under 200ms" can. Never paraphrase, never write a vague range, never state a constraint without its source. **With no project-wide constraints the section reads the single word `None`** — never omit the section, because an absent section is a question and `None` is an assertion.

### 9.2 Validate Completeness

Read discovery.md and design.md (if exists — resolve per the SCOPE_DIR rule in 7.1: SF-level first, feature-level fallback). Verify:
- All entities/tables from discovery → complete schema in plan-database
- JSONB fields → detailed TypeScript structures
- Endpoints → complete request/response DTOs
- Events/workers → documented payloads and consumers
- Design components → mapped in plan-frontend
- States/interactions → defined hooks and stores
- Frontend types mirror backend DTOs
- Main flow is clear (call chain documented)

### 9.3 Fill Gaps

IF validation identifies gaps, ADD directly to plan.md. Common gaps:
- **Missing table schema** → Complete CREATE TABLE with all discovery fields
- **Missing JSONB structure** → TypeScript interface with detailed field types
- **Incomplete API contract** → Request/Response tables (Field | Type | Required | Description)

**Rule:** If discovery.md contains information, it MUST appear in plan.md in actionable form for developer.

### 9.4 Generate tasks.md (Architect Subagent)

**MANDATORY:** Load `{{skill:add-tasks-checklist/SKILL.md}}` BEFORE dispatching.

**Dispatch:** @architecture-agent
- **Capability:** read-only
- **Returns:** the complete tasks document, in its report
- **Prompt template:** From `add-tasks-checklist` ("Architect Subagent Prompt Template" section), substituting `${FEATURE_ID}`, `${EPIC_CURRENT_SF}`, `${PLAN_DIR}`

⛔ **The agent is read-only and writes nothing. THIS STEP writes the file** to
`${PLAN_DIR}/tasks.md` (feature dir, or subfeature dir if epic), verbatim from the report.

```
IF THE REPORT CARRIES NO DOCUMENT:
  ⛔ DO NOT USE: Write on tasks.md
  ⛔ DO NOT: Proceed to 9.5 or STEP 10 against a file you just created empty
  ✅ DO: Report that the dispatch returned no content and STOP — STEP 10 coverage and
         STEP 11.1's interface check both read this file
```

**Rules:**
- tasks.md MUST have exact sections: `## Metadata`, `## Requirements Coverage`, `## TDD`, `## Execution`, `## Acceptance Checklist`, `## Validation Gates` (validators parse by text). **The sixth is conditional** — write it only when `AGENTS.md` exposes a `validation_gates` block, and omit the section entirely otherwise
- Every `## Execution` task carries **6** metadata sub-bullets in order: `Service`, `Files`, `Deps`, `Consumes`, `Produces`, `Verify` — never 4. `Produces` is the **exact signature** a later task will call (`-` when nothing); `Consumes` is the **exact signature** plus the producing task ID in parentheses (`-` when nothing). Every `Consumes` MUST match a `Produces` on an **earlier** task **character for character** — STEP 11 checks this mechanically, and a `Consumes` written as prose fails there
- plan.md FROZEN after this step (no spec checklist section)
- Every RF/RN in Requirements Coverage MUST link to ≥1 Acceptance Checklist item
- All checkboxes start as `[ ]` (no pre-ticking)

### 9.5 Cross-SF Integration Review (EPIC ONLY)

**IF HAS_EPIC=true:** After tasks.md generated, dispatch @architecture-agent [read-only] for integration review.
**IF normal feature:** Skip to 9.6.

⛔ **The agent reviews and reports. THIS STEP applies every edit to `plan.md`.** The agent declares
`readonly: true` and writes nothing — a finding it returns is a `plan.md` edit you make here.

**Purpose:** COMPLETENESS of the subfeature plans as a set — fragmented enums/config, missing fallback behavior, missing DI registration. 9.5 is the **in-place fixer**.

**What 9.5 does NOT own:** DIVERGENCE between two subfeature plans. That belongs to `@consistency-agent` — the read-only judge of the five-dimension rubric in `{{skill:add-cross-sf-consistency/SKILL.md}}` (API contracts, data schema, requirements, design tokens, auth model), dispatched by this command at STEP 12 (`mode: FULL`) and by `/add.build` before an epic's last checkpoint (`mode: DELTA`). Two checks 9.5 used to derive itself now live there: **Schema ↔ Consumer Alignment** → that agent's dimension 2 (data schema); **Cross-SF Handoff Contracts** → that agent's dimension 1 (API contracts). 9.5 **consumes** its findings for both and MUST NOT re-derive them — one detector, one rubric, never a second verdict.

**Where the line falls:** every agent dimension asks *do two declarations disagree?*; every check that stays here asks *is one plan complete?* Check 1 below asks whether a declaration is **duplicated** — a different question whose answer is a plan edit, not a verdict. `@consistency-agent` judges and never edits; 9.5 edits.

**Checks to fix in-place — these three, and only these three:**
1. Shared Resource Centralization (enums/config added ONCE in earliest SF)
2. Fallback & Degradation (SFs depending on unimplemented SFs have fallback behavior)
3. Worker/DI Registration (new services have DI tasks)

**Consumed, never derived:** a `FULL`-pass `@consistency-agent` finding on dimension 1 (API contracts) or dimension 2 (data schema) arrives at STEP 12.3 as a concrete `plan.md` edit — apply it in place there. Do NOT open your own schema-alignment or handoff-contract comparison.

**Output:** Summary of changes (file + what changed) to stdout, marking which edits came from a `@consistency-agent` finding. NEVER create separate report file. ONLY fix integration issues. Preserve existing content. Keep each plan.md under 150 lines.

### 9.6 Add Navigation Sections

Append to plan.md: **Overview** (1-2 paragraphs from about.md), **Main Flow** (numbered Actor→Action steps), **Implementation Order** (Database→Backend→Frontend), **Quick Reference** (pattern→codebase search terms: Entity, Repository, Controller, Command, Hook, Page).

### 9.7 Cleanup Temporary Files

```bash
cd "docs/features/${FEATURE_ID}"
rm -f plan-database.md plan-backend.md plan-frontend.md plan-test-spec.md plan-qa-spec.md
```

Delete only after plan.md complete AND coverage validated.

---

## STEP 10: Validate Requirements Coverage (GATE: coverage_validated)

**Extract** all RFs, RNs, and Scope items from discovery.md. **Map** each requirement to Feature/Area and specific tasks. **IF no task exists → CREATE task or JUSTIFY exclusion.**

**Generate coverage table** in plan.md:

| ID | Requirement | Covered? | Feature/Area | Tasks |
|----|-------------|----------|--------------|-------|
| RF01 | User creates account | YES | Backend + Frontend | 1.1, 1.2, 1.3 |
| RF05 | Admin toggle RLS | EXCLUDED | - | Out of scope — validated with user |

**Validation:** IF Coverage = 100% → Proceed to STEP 11. IF Coverage < 100% → STOP, resolve gaps (add tasks or document exclusions), re-validate. Ref: GATES table.

---

## STEP 11: Validation Gate

Execute validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `feature-plan`. ⛔ DO NOT skip. Require `PASS` before proceeding.

### 11.1 Interface Pair Check (`tasks.md`) — MECHANICAL

⛔ This is a **string comparison, not a judgement**. Do NOT decide whether two signatures "mean the same thing" — compare the characters.

1. Read `${PLAN_DIR}/tasks.md`. From `## Execution`, extract for each task `TNN`: every `Produces` value and every `Consumes` value. Strip only the surrounding backticks and the trailing `(TNN)` producer reference on a `Consumes`. A value of `-` is skipped.
2. For each `Consumes` value on task `TNN`, find a task `TMM` with **`MM` < `NN`** whose `Produces` contains that **exact same string, character for character**.
3. **PASS** when every `Consumes` has such a match, and the producer ID cited in the `Consumes` parentheses is that same `TMM`.
4. **FAIL** on any miss. ⛔ STOP and print **both strings verbatim**, so the difference is visible:

```
INTERFACE MISMATCH — T04 Consumes has no matching Produces on an earlier task
  Consumes (T04): <the exact consumed string>
  Nearest Produces (T02): <the exact produced string, or "none">
```

Then fix `tasks.md` so the two agree character for character and re-run this check. A `Consumes` written as prose rather than a signature fails here by design: a string no machine can match is a contract no dispatched subagent can implement against. **Do NOT weaken the comparison to make a prose `Consumes` pass.**

---

## STEP 12: Plan Review + Comprehension Readback (GATE: plan_reviewed)

Schema gate PASSED. Do not present `plan.md` or the next command as delivered yet.

1. **DISPATCH** `@plan-reviewer-agent` with `path` = `plan.md`'s path and `kind: feature-plan`. **Soft-degrade:** if the engine has no subagent dispatch, apply `{{skill:add-plan-review/SKILL.md}}` inline, explicitly forgetting this conversation.
2. **Act on the verdict.** **LOAD `{{skill:add-review-discipline/SKILL.md}}`.** It owns how many times each reader runs, what makes a second dispatch legal, how a divergence is handled at this site, and what you owe a report you receive. The verdict table lives there; this step carries only its own dispatch inputs. The re-gate this site runs is STEP 11's
   validation gate on `plan.md`. A standing blocker STOPS — ref: GATES table (`plan_reviewed`) — and
   STEP 13 does not run.
3. ⛔ Do NOT re-dispatch `@ux-flow-agent`, `@ux-layout-agent`, or `@ux-agent` to satisfy a plan-review finding — those subagents own `design.md`, not `plan.md`; a `design.md` finding is out of scope for this review.

### 12.3 Cross-subfeature judge — FULL pass (EPIC ONLY)

**Run it after step 2's verdict resolved to proceed, and before the readback** — this pass edits
`plan.md`, and a readback taken before it reads a version about to change.

| State | This sub-step |
|---|---|
| Not an epic, or the epic has one subfeature | **Skip** — there is nothing to compare against |
| Epic, and no other `epic.md` row reads `done` yet | **Skip** — `{{skill:add-cross-sf-consistency/SKILL.md}}`'s rubric only fires with two or more subfeatures to compare. Say so in STEP 13 |
| Epic, and at least one sibling row reads `done` | Dispatch below |

**DISPATCH AGENT: @consistency-agent**
- **Capability:** read-only
- **Input:** `mode: FULL`; this subfeature's `plan.md`, `about.md` and `design.md` (if present);
  `epic.md`'s resolved roster; `HAS_DESIGN`; and the same three documents for every sibling whose row
  reads `done`

**WAIT** for the report. Then act on its findings:

1. Apply each finding as a concrete edit to THIS subfeature's `plan.md` only — ⛔ never to a sibling's
   `plan.md`, which is frozen once its row reads `done`. Mark in STEP 9.5's output which edits came from
   this pass.
2. Re-run STEP 11's `feature-plan` validation gate on the fixed `plan.md`.
3. Re-dispatch `@consistency-agent` **once** to confirm the conflict is resolved.
4. Still unresolved after that one re-dispatch, or the conflict needs a product decision no edit can
   make → STOP and present it (gate `plan_reviewed`, **deciding**). STEP 13 does not run.
5. `informational` findings are listed in STEP 13 and never applied as a `plan.md` edit.

### 12.4 Comprehension readback

1. **DISPATCH** `@readback-agent` with `target` = `docs/features/${FEATURE_ID}` and `scope: subfeature`, naming the subfeature just planned. Its reading set is the feature folder's top-level `.md` plus that one subfeature's subtree — **no sibling subfeature**, because divergence between siblings belongs to `@consistency-agent` on its own five dimensions. On a non-epic feature there are no subfeatures and the scope reads the whole folder.

   Run it ONLY after the reviewer's verdict (step 2 above) resolved to proceed, 12.3 finished, and every applied fix is on disk.

```
IF THE PROVIDER HAS NO SUBAGENT DISPATCH:
  ⛔ DO NOT: Apply the readback inline yourself
  ✅ DO: Skip it, and say in STEP 13 that it was skipped and why
```

   There is no inline fallback because the mechanism IS the reader not holding this conversation. A readback you perform on a plan you just wrote measures nothing.

2. **Compare the readback against what was actually decided in this conversation**, using the report's closing **"In one sentence"** line.
   - **Matches** → proceed to STEP 13, citing the readback in one line.
   - **Diverges** → the document failed, not the agent. Apply this site's row from `{{skill:add-review-discipline/SKILL.md}}`'s divergence table — its re-gate here is STEP 11's validation gate on `plan.md`.

```
IF THE READBACK DIVERGES:
  ⛔ DO NOT: Summarize the divergence away as "close enough"
  ⛔ DO NOT: Treat it as the subagent having misread the plan
  ✅ DO: Show what it understood beside what was decided, then STOP
```

   ⛔ The readback is NOT a gate and does NOT feed `plan_reviewed`. It returns no verdict and cannot block.

---

## STEP 13: Completion

**LOAD `{{skill:add-final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the feature ID, the paths and the next command come after it.

A plan proposes rather than executes, so block 2 is titled `What will be done` and written in the
future tense. Fill `How it works` with the mechanism the plan settles on — what the feature will do
once built, for a reader who never opens `plan.md`.
<!-- feature:board:ticket-planned -->
<!-- /feature:board:ticket-planned -->

Then, after the seven blocks, state:
- Feature ID and plan path
- Areas planned (UX Design/Database/Backend/Frontend)
- Design contract: the `design.md` path 7.1 wrote — or the reason 7.1 was skipped (no UI in scope / no new screen or component / provenance match / no frontend)
- Key metrics (endpoint count, task count, RF/RN count)
- Plan review verdict from STEP 12, and a one-line summary of any applied fixes
- Suggested next command: `/add.build`

**Stop kind — confirming.** The report describes a plan the brainstorm's approval already covered.

| `DELIVERY` | Do |
|---|---|
| `confirm` | Print the report and the suggestion, and STOP. The user runs `/add.build` |
| `automatic` | Print the report and the line `(delivering automatically — continuing to /add.build.)`, then follow {{cmd:add.build}} with this feature's id, from its first step, as `add-delivery-mode` describes |

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
