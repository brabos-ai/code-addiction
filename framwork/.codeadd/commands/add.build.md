# Development Execution Specialist

<!-- uses:
- skill: add-backend-development
- skill: add-code-review
- skill: add-commit
- skill: add-database-development
- skill: add-doc-schemas
- skill: add-ecosystem
- skill: add-frontend-development
- skill: add-id-convention
- skill: add-subagent-driven-development
- skill: add-tasks-checklist
- skill: add-ux-design
- skill: add-doc-schemas/references/new-feature.md
- agent: backend-agent
- agent: database-agent
- agent: e2e-agent
- agent: fix-agent
- agent: frontend-agent
- agent: reviewer-agent
- agent: test-agent
- agent: ux-agent
- command: /add.done
- command: /add.new
- command: /add.plan-to-ready
- command: /add.qa-setup
- command: /add.review
- command: /add.wiki
- script: build-ledger.sh
- script: build-setup.sh
- script: converge-gates.sh
- script: done.sh
- script: review-package.sh
- script: status.sh
- script: task-brief.sh
-->

Coordinator for feature implementation, bug fixes, and epic feature execution. Detects context automatically, coordinates subagents, validates against skill checklists, and ensures 100% compilation.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules). Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format.

Load `{{skill:add-subagent-driven-development/SKILL.md}}` before STEP 1 as well. It **defines** the loop this command runs — the build ledger and its canonical format, the resume rule, the pre-flight scan, handoff by path, the scoped re-review, model escalation, the breaker and the `Ruling:` format, and the four hard stops. This command **implements** that definition; it never invents a second vocabulary for it. Where a step below and the skill disagree, the skill is the definition and the disagreement is a defect to report.

`/add.build` is a **mutator**: it updates existing `plan.md`/`about.md` during/after implementation. It MUST NOT allocate new IDs — always reuse the `[NNNN]F` from existing frontmatter. Every write MUST follow the cache rule: read existing doc → preserve valid content → complement with new info → bump `updated:` to today. `created:`, `id:`, and `type:` are immutable.

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).
> **ARGS:** `/add.build [F[NNNN]] [--worktree]` — explicit feature target + opt-in worktree; composable with `feature N` (legacy epic).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1:  Run context mapper          → FIRST COMMAND (status.sh) + read the build ledger
STEP 2:  Branch setup                → build-setup.sh (create-or-checkout feature branch)
STEP 3:  Detect context              → Epic subfeature | Legacy feature flag | Simple mode
STEP 4:  Parse key variables         → Extract FEATURE_ID, flags, phase
STEP 5:  Determine mode              → Apply the resume rule, THEN DEVELOPMENT | TASKS | CORRECTION | FEATURE
STEP 6:  Load feature docs           → BEFORE any implementation
STEP 7:  Load project knowledge      → IF WIKI:present (status.sh)
STEP 8:  Determine scope             → Database, Backend, Workers, Frontend
STEP 9:  Execution decision          → DIRECT (1 area) | SUBAGENTS (2+ areas)
STEP 10: Implementation              → Pre-flight scan, then dispatch by path over the Agent Roster
STEP 11: Area validation → COMMIT    → Validator agents (MANDATORY per area), build gate, THEN the commit
STEP 12: Routed correction           → Consume ## Fix Routing; re-review every fix; write the resolution annex
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
- **COMMIT CONTRACT:** **One semantic commit per batch.** In TASKS MODE a batch is one `tasks.md` task (`T01`, `T02`, …); in DEVELOPMENT and CORRECTION MODE a batch is one area dispatch, because there are no task ids to commit against. Message follows `{{skill:add-commit/SKILL.md}}`, with the task id and the feature id as **trailers** (`Task-Id: T02`, `Feature-Id: ${FEATURE_ID}`) so the ledger, the commit and `tasks.md` can be joined later. ⛔ **The commit lands ONLY after the area validator returned AND the build passed** — STEP 11.3 is the single place any commit happens, and a commit that lands before validation is a commit of unvalidated code
- **LEDGER:** `${FEATURE_DIR}/build-ledger.md` (or `${SF_DIR}/build-ledger.md` on an epic) is read on entry and appended after **every** task, fix round, deferred minor, parked finding and ruling — always through `bash .codeadd/scripts/build-ledger.sh`, never by hand. A task carrying a `complete` line is NEVER re-dispatched
- **BRANCH SETUP FIRST:** build-setup.sh MUST have exited 0 before any implementation step

---

## STEP 1: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

This script provides ALL context: BRANCH (feature ID, type, phase), FEATURE_DOCS (HAS_PLAN, HAS_DESIGN, HAS_IMPLEMENTATION), DESIGN_SYSTEM, FRONTEND (path, components), PROJECT_CONTEXT (ARCHITECTURE_REF), ALL_FEATURES (count, list), FEATURES (X/Y if Legacy Epic), HAS_EPIC, EPIC_CURRENT_SF, HAS_TASKS, TASKS_FILE, LAST_CHECKPOINT.

### 1.0 Read the Build Ledger (the resume map)

**Read the ledger before you decide anything.** `${FEATURE_DIR}/build-ledger.md` on a simple feature,
`${SF_DIR}/build-ledger.md` on an epic — the epic path resolves in STEP 3, so on an epic read it the
moment `SF_DIR` is known and before STEP 5.

- **Absent** → this is a fresh build. It is created by the first line you append; do not create it by hand.
- **Present** → it is the record of a previous run of this same build, and it outranks your recollection.
  Read it in full, then reconcile it against `git log --oneline` for the branch.

⛔ DO NOT skip this because the conversation "looks like" a fresh start. That is exactly what a compacted
session looks like, and re-dispatching a finished task is the failure this read exists to prevent.

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

### 5.0 Apply the Resume Rule (BEFORE mode detection)

The ledger read in STEP 1.0 is consumed here, before anything is detected. Apply the resume rule exactly
as `{{skill:add-subagent-driven-development/SKILL.md}}` states it:

| Ledger state for a task | What you do |
|---|---|
| a `complete` line exists | **NEVER re-dispatch it.** Not "probably done", not "let me re-check by re-running it". Done |
| the last line is `fix round N/3` | resume at round **N+1**, not at round 1 |
| no line at all | this is the first task to dispatch |

Set `RESUME_FROM` = the first `## Execution` task with no `complete` line. In TASKS MODE this feeds the
**Resume vs Rerun Procedure** in STEP 10 — the ledger decides `resume`, and only an explicit user request
to redo the work sets `rerun_all`.

**Where the ledger and `git log` disagree, git wins for *what exists* and the ledger wins for *what was
decided*.** A commit in `git log` happened whatever the ledger says; a ruling leaves no trace in a diff.

**Output one line before proceeding:** `LEDGER: <path> — <n> entries — resuming at <TASK_ID | Task 1 (fresh)>`.

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

### 10.0 Pre-Flight Scan and the Handoff Contract (BEFORE the first dispatch)

Both blocks below run **once, before the first subagent of this run is dispatched**. Neither is optional,
and neither is satisfied by asserting it happened.

#### 10.0.1 Pre-Flight Scan (BEFORE Task 1) [HARD GATE]

Read `TASKS_FILE` **once** and write a table to the ledger. Tasks carry six sub-bullets — Service, Files,
Deps, Consumes, Produces, Verify (`{{skill:add-tasks-checklist/SKILL.md}}`) — and `Consumes` / `Produces`
are what make the scan possible: they are the exact signatures each task calls and each task provides.

Two kinds of row, **both required**:

1. **One row per pair of tasks sharing a file or an interface** — what one `Produces` against what the
   other `Consumes`, and what was found. A `Consumes` that does not match a `Produces` character for
   character is a **conflict**, not a nuance.
2. **One row per task, for self-consistency** — whether the task's own text agrees with itself (its
   `Files` cover its `Produces`; its `Deps` cover the tasks its `Consumes` names).

Append every row to the ledger, one line each:

```bash
bash .codeadd/scripts/build-ledger.sh "${LEDGER_FILE}" "Preflight: T02 produces \`UserDto.fullName\`, T05 consumes \`UserDto.name\` — CONFLICT"
```

⛔ **The output is a table, not a verdict.** Writing `Preflight: clean` without the rows is not a scan that
ran — it is a claim that one did, and it is rejected.

✅ **Every conflict is ruled on BEFORE Task 1 is dispatched**, with the `Ruling:` recorded beside its row
in the format 10.0.3 defines. A conflict carried into execution becomes two subagents building against two
different names, discovered at integration, when both are already committed.

**On resume:** if the ledger already holds `Preflight:` rows for this build, the scan already ran — do not
re-run it and do not re-rule its conflicts.

**No `tasks.md` (DEVELOPMENT / CORRECTION / FEATURE MODE):** there are no `Consumes` / `Produces` pairs to
scan. Write one ledger line saying so — `Preflight: skipped — no tasks.md (DEVELOPMENT MODE)` — and
proceed. Silence is not the same as a recorded skip.

#### 10.0.2 Handoff by Path — what a dispatch carries

The coordinator hands each agent **paths, not pasted content**. A pasted brief and an inline report stay
resident in context and are re-read on every turn for the rest of the session.

**Before each dispatch, in this order:**

1. **Record `BASE`** — `BASE=$(git rev-parse HEAD)`, taken *before* the dispatch. This is half of the
   bracket every ledger line and every review package needs.
2. **Write the brief:**
   ```bash
   bash .codeadd/scripts/task-brief.sh "${TASKS_FILE}" T02 "${FEATURE_DIR}/_build"
   ```
   It prints `BRIEF=`, `TASK=` and `SUBBULLETS=`, and **exits 2** when the id is not an `## Execution`
   task — an empty brief is how an agent gets dispatched against nothing and reports success. On exit 2,
   STOP and show stderr verbatim; never hand-write a substitute brief.
3. **Choose `REPORT_FILE`** — `${FEATURE_DIR}/_build/<task-id>-report.md`. `_build/` is scratch: the
   scripts create it with a `.gitignore` containing `*`, so briefs, reports and diff packages never reach
   a commit. The **ledger is not scratch** and never lives there.

| Field the dispatch carries | Content |
|---|---|
| `TASK_DOCUMENTS` | file paths, as always — never summaries |
| `BRIEF` | the path `task-brief.sh` printed. The agent reads it |
| `REPORT_FILE` | the path where the agent writes its full report |
| `INTERFACES` | the exact `Produces` signatures from earlier tasks that this task `Consumes` — the brief cannot know them |
| `GLOBAL CONSTRAINTS` | the plan's `## Global Constraints` block, **copied verbatim from `plan.md`** |

⛔ **`## Global Constraints` is copied, never summarised.** It is the reviewer's attention lens and it is
written with exact values copied from their sources. "Fast enough" cannot be reviewed; "under 200ms" can.
Paraphrasing destroys the only property that makes it usable. If `plan.md` carries no such block, say so
in the dispatch (`GLOBAL CONSTRAINTS: none declared in plan.md`) rather than inventing one.

**What the agent returns inline:** `STATUS`, `COMMITS` (`BASE..HEAD`), a one-line `TESTS` summary, and
`CONCERNS`. Nothing else — the full report is on disk at `REPORT_FILE` for whoever needs it.

#### 10.0.3 The `Ruling:` format

Every ruling this command makes — a pre-flight conflict, a finding open at the cap — is one ledger line:

```
Ruling: <what you decided> — <why> — <what it costs if wrong>
```

All three parts are required. The cost clause is what makes a ruling reviewable: a human reading "the
caller already guards" cannot tell whether to check it; a human reading "costs a crash if wrong" can.
STEP 17 reprints every one of them.

---

### TASKS MODE (when tasks.md exists)

**Activated when:** `HAS_TASKS=true` and `TASKS_FILE` is set.

**MANDATORY:** Load `{{skill:add-tasks-checklist/SKILL.md}}` BEFORE entering this mode. The skill defines the 5-section schema, tick rules, `[!]` semantics, "non-trivial change" rule, the Resume/Rerun procedure, the tick-application procedure, and the validator report shape.

**FIRST in TASKS MODE:** Run the **Resume vs Rerun Procedure** from `add-tasks-checklist`. This sets `RESUME_MODE = resume | rerun_all`.

⛔ **The ledger outranks the tick.** A task the ledger marks `complete` is never re-dispatched, whatever
`RESUME_MODE` or a stale `[ ]` in `tasks.md` says. Where the two disagree, reconcile against `git log` and
record the reconciliation as a ledger line.

**Flow:**

```
1. FILTER §3 Execution tasks per RESUME_MODE, then SUBTRACT every task the ledger marks complete.
2. GROUP filtered tasks by service (database, backend, frontend, test).
3. VALIDATE deps: build execution graph (tasks with no deps first).
4. EXECUTION ORDER: test → database → backend → frontend.
5. PER TASK: record BASE → write brief (10.0.2) → dispatch → validator + build gate (STEP 11)
   → COMMIT the task (STEP 11.3) → append the ledger line with its BASE..HEAD bracket.
6. AFTER all task groups complete: proceed to STEP 11.4 (validation gates tick).
```

**One commit per task in this mode** — tasks are already service-scoped and capped at 3 files, so a task
is the right commit. See the COMMIT CONTRACT invariant and STEP 11.3.

<!-- feature:tdd-pipeline:tasks-flow -->
<!-- /feature:tdd-pipeline:tasks-flow -->
<!-- feature:tdd-pipeline:gate -->
<!-- /feature:tdd-pipeline:gate -->
<!-- feature:tdd-pipeline:verify-red -->
<!-- /feature:tdd-pipeline:verify-red -->

**Subagent prompt addition for TASKS MODE:**

Hand **brief paths**, never a pasted task table — one `task-brief.sh` call per task in this agent's service
area (10.0.2). The brief carries all six sub-bullets; a table copied into the prompt loses `Consumes` and
`Produces`, which are the only thing making two tasks build against the same name.
```
## YOUR TASKS (briefs — read each one first)
- T02 → ${BRIEF path printed by task-brief.sh}
- T04 → ${BRIEF path printed by task-brief.sh}

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
| `@reviewer-agent` | read-only | `MODE` (`task` \| `re-review`), area `FILES_CREATED`/`FILES_MODIFIED` or the `review-package.sh` path, checklist, open findings on re-review | `MODE: task` → `CHECKLIST_RESULTS`, `VIOLATIONS_FOUND`, `SPEC_STATUS`; `MODE: re-review` → one `ADDRESSED`/`NOT ADDRESSED` verdict per open finding, `NEW_BREAKAGE`, `DEFERRED_MINORS`, `VERDICT` |
| `@test-agent` | full-access (test files only) | `AREA`, `MODE`, `TEST_COMMAND`, `AREA_FILES`, `CONTRACT_TESTS` | `FILES_CREATED`, `TESTS_PASSING`, `TEST_COUNT`, `RED_TEST` (CORRECTION) |
| `@fix-agent` | full-access | `AREA`, `ROUTED_ROWS`, `ATTEMPT`, `MAX_ATTEMPTS`, `BUILD_ERRORS`, and at round 3 only an explicit `MODEL` one tier above its declared model | `ROWS_RESOLVED`, `ROWS_FAILED`, `NOT_MINE`, `DISPUTED`, `BUILD_STATUS` |
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

**`MAX_ATTEMPTS` is 3, and the model escalates at round 3 — not at round 2:**

| Round | Model passed to `@fix-agent` |
|---|---|
| 1 | the agent's declared model — pass no `MODEL` |
| 2 | the agent's declared model — pass no `MODEL` |
| 3 | an explicit `MODEL`, **one tier above** the agent's declared model |

Two rounds on the declared model is a fair trial. A loop that survives two rounds usually means the agent
cannot see its own problem, and a third round on the same model buys nothing.

**Every fix round is re-reviewed** — record `FIX_BASE` before the dispatch and run the scoped re-review in
STEP 12.2 after it returns. Append one ledger line per round:
`T02: fix round 1/3 (2 addressed, 0 open; commits d4e5f6a..b7c8d9e)`.

⛔ IF `ATTEMPT` would exceed `MAX_ATTEMPTS`, stop dispatching — then split on what is still open:

- **Open review findings → THE BREAKER: rule and continue. Do NOT stop the session.** Adjudicate each open
  finding yourself and write one `Ruling:` line per finding to the ledger in the 10.0.3 format. Then move
  to the next task. A session parked on a question costs a day; a wrong ruling costs rework the human can
  see and undo, and STEP 17 puts every ruling in front of them.
- **A red build → the BUILD GATE stands.** A failing build is not a finding to adjudicate. Report the
  unresolved rows and the last `BUILD_ERRORS`, append the failure to the ledger, and STOP. ⛔ DO NOT
  continue to the next STEP as if the build passed, and ⛔ DO NOT rule a compile error away.

**Four things — and only these — stop the session and ask the human:** an irreversible or destructive
operation; a security-sensitive action (credentials, auth, permissions, secrets); a side effect outside
this working tree that norms say you ask about first (a merge, a push to a shared branch, a publish); and
a plan so broken that every path forward is a guess. Everything else is a ruling. "I am not sure" is not a
fifth stop.

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

Use this template for ALL area subagents (database, backend, frontend, workers). Every `${...}` below that
names a file is a **path** the coordinator resolved in 10.0.2 — pasted briefs and pasted diffs are a defect
in this template, not a shortcut.

```
You are implementing the ${AREA} for feature ${FEATURE_ID}.

## MANDATORY: Self-Bootstrap Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files in TASK_DOCUMENTS below
3. Read the file at BRIEF
4. IF WIKI:present in output: read {{addpath:wiki/index.md}}, then {{addpath:wiki/domains/${AREA}.md}} (+ {{addpath:wiki/conventions.md}} when conventions matter for this task)

## TASK_DOCUMENTS (read ALL — source of truth)
${TASK_DOCUMENTS}

## BRIEF (your task's full block — read it, it is not summarised anywhere)
${BRIEF}

## REPORT_FILE (write your FULL report here — do not paste it back)
${REPORT_FILE}

## INTERFACES (exact `Produces` signatures from earlier tasks that your task Consumes)
${INTERFACES}

## GLOBAL CONSTRAINTS (copied verbatim from plan.md — do not paraphrase, do not trade away)
${GLOBAL_CONSTRAINTS}

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

## REPORT FORMAT
Write your full report to REPORT_FILE. Return inline ONLY:
1. STATUS: [complete/blocked]
2. FILES: [created/modified — the coordinator commits them at STEP 11.3, you do not]
3. COMMITS: [none — the coordinator owns the commit in this command]
4. TESTS: [one line]
5. CONCERNS: [if any]

## Deliverables
- Files created/modified + decisions logged, full report written to REPORT_FILE
- Build passes: ${BUILD_COMMAND}
```

⛔ **The subagent does not commit — the coordinator does, in STEP 11.3, after the validator returned and
the build passed.** This is where `/add.build` pins the skill's "commit after validation, never before":
the validator is a separate dispatch, so an implementer that committed its own work would put the commit
*upstream* of the only thing that validates it. A subagent that reports having committed anyway has broken
the contract — record it as a ledger line and reconcile `BASE..HEAD` against `git log` before continuing.

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

**DISPATCH AGENT: @${AREA}-agent** (see the Agent Roster in STEP 10)
- **Prompt:** Use the Universal Subagent Prompt Template (10.2), filled from the paths 10.0.2 resolved

#### 10.5 Coordination Flow

**One commit per area dispatch in this mode** — there are no task ids to commit against.

```
Record BASE -> Dispatch DB agent -> Wait -> Validator (STEP 11) -> Verify build
    | (if fails, dispatch @fix-agent with ATTEMPT)
  -> COMMIT the area batch (STEP 11.3) -> ledger line with BASE..HEAD
Record BASE -> Dispatch Backend + Frontend (parallel) -> Wait -> Validators -> Verify build
    | (if fails, dispatch @fix-agent with ATTEMPT)
  -> COMMIT each area batch (STEP 11.3) -> ledger line per area
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
- **One commit per area dispatch**, at STEP 11.3 and not before — a correction has no task ids either.
  Record `BASE` before the fix dispatch and the ledger line carries the `BASE..HEAD` bracket.

---

## STEP 11: Area Validation (MANDATORY after each area)

**After EACH area is implemented, dispatch a Validator Subagent to validate code against skill checklists and auto-correct violations.**

**IF VALIDATOR NOT EXECUTED:** DO NOT report area completion or advance to next area. Execute Validator IMMEDIATELY.
**IF SPEC_STATUS = INCOMPLETE:** DO NOT report area completion. Implement missing spec items OR escalate to user.

**MANDATORY:** Validator MUST load `{{skill:add-tasks-checklist/SKILL.md}}` to apply tick rules, "non-trivial change" definition, and `[!]` failure-marker semantics.

**This validator runs on the WORKING TREE, not on a diff — deliberately.** It is the gate the commit waits
on (11.3), so at this point nothing is committed yet and `BASE..HEAD` is still empty. `review-package.sh`
belongs to the **re-review** in 12.2, after a fix batch is committed. Dispatch this one with `MODE: task`
and `FILES_CREATED`/`FILES_MODIFIED`; never with a package path that cannot exist yet.

### 11.1 Validator Subagent Prompt Template

**DISPATCH AGENT: @reviewer-agent**

```
You are the ${AREA} VALIDATOR for feature ${FEATURE_ID}.
Validate implemented code against skill checklist, audit spec compliance against plan.md prose,
and tick tasks.md (§2 TDD, §3 Execution, §4 Acceptance Checklist) for items covered by your area.

## MODE: task

## GLOBAL CONSTRAINTS (copied verbatim from plan.md — your attention lens)
${GLOBAL_CONSTRAINTS}

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

### 11.3 Commit the Batch [THE ONLY PLACE THIS COMMAND COMMITS]

**Read this sub-step top to bottom. The order IS the requirement — a commit that lands before validation
is a commit of unvalidated code, and it is worse than no commit because it looks like delivered work.**

Run the four gates below **in this order**, and only reach step 4 if 1, 2 and 3 all held:

1. **The area validator has RETURNED.** Not "was dispatched", not "is running" — returned, with its
   report in hand. ⛔ IF no validator report exists for this batch: DO NOT commit. Go back to 11.2.
2. **`SPEC_STATUS` is not `INCOMPLETE`.** ⛔ IF it is: DO NOT commit. Implement the missing spec items or
   escalate, then re-validate.
3. **The build PASSED.** Run the project build command (CLAUDE.md) and read its exit status in this
   session. ⛔ IF it is red: DO NOT commit. Dispatch `@fix-agent` per the **Correction Dispatch** contract
   and return to gate 1 afterwards. `BUILD_STATUS: pass` is a fact you observed, never one you assumed.
4. **NOW commit — and record the bracket.**

```bash
# BASE was recorded in 10.0.2, BEFORE the dispatch. Do not re-derive it here.
# Staging follows add-commit's Staging Rules: all code, and ONLY this feature's docs.
git add -A -- . ':(exclude)docs/features/*'
[ -d "docs/features/${FEATURE_ID}" ] && git add -A -- "docs/features/${FEATURE_ID}"
# _build/ ignores itself, so briefs, reports and diff packages never enter the index.
git commit -m "<type>(<scope>): <subject per add-commit>" \
           -m "Task-Id: ${TASK_ID}" -m "Feature-Id: ${FEATURE_ID}"
HEAD=$(git rev-parse HEAD)
bash .codeadd/scripts/build-ledger.sh "${LEDGER_FILE}" \
  "${TASK_ID}: complete (commits ${BASE}..${HEAD}, BUILD_STATUS=pass, review clean)"
```

- **Message** follows `{{skill:add-commit/SKILL.md}}`'s Conventional Commits logic and its Staging Rules.
- **Trailers are mandatory:** `Task-Id:` (the `tasks.md` id, or the area name in DEVELOPMENT / CORRECTION
  MODE, where there are no task ids) and `Feature-Id:`. They are what joins the ledger, the commit and
  `tasks.md` later.
- **One commit per batch** — one `tasks.md` task in TASKS MODE, one area dispatch otherwise.
- **The ledger line carries `BASE..HEAD` and `BUILD_STATUS`.** A `complete` line without the bracket is
  not a resume marker, because nothing can reconcile it against `git log`.

⛔ DO NOT commit from any other step, and DO NOT let a subagent commit. Every git write in this command
lives here, so there is exactly one place to check that validation came first.

### 11.4 Validation Gates Tick (END OF BUILD)

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
Work rows in the table's given order, respecting `Blocked by`. **Record
`FIX_BASE=$(git rev-parse HEAD)` before the dispatch** — 12.3 cannot run without it. Dispatch
`@fix-agent` per area per the **Correction Dispatch** contract, with the tracked
`ATTEMPT` and, at round 3 only, the escalated `MODEL`.

### 12.2 Scoped Re-Review (after EVERY fix round) [HARD GATE]

**A fix that compiles and misses the finding passes today. This is the step that catches it.**

After `@fix-agent` returns and its batch is committed (STEP 11.3), package the **fix diff only** and
re-dispatch the reviewer:

```bash
bash .codeadd/scripts/review-package.sh "${FIX_BASE}" "$(git rev-parse HEAD)" "${FEATURE_DIR}/_build"
```

It prints `PACKAGE=`, `COMMITS=` and `FILES=`, and **exits 2 on an empty range** — an empty package is how
a reviewer gets dispatched against nothing and returns "looks fine". ⛔ On exit 2, DO NOT dispatch and DO
NOT mark the round re-reviewed: an empty range means the fix produced no commit, which is itself the
finding.

**DISPATCH AGENT: `@reviewer-agent`** [read-only] with:

| Field | Content |
|---|---|
| `MODE` | `re-review` — **explicit, never omitted**; an absent `MODE` is a full task review |
| `REVIEW PACKAGE` | the path `review-package.sh` printed |
| `OPEN FINDINGS` | the findings from the previous review, verbatim, with their ids |
| `TASK_DOCUMENTS` | the same docs the implementation subagent received |

It returns one verdict per open finding — `ADDRESSED` or `NOT ADDRESSED` — plus `NEW_BREAKAGE` **scoped to
the fix diff only** and `DEFERRED_MINORS`. Deferred minors go to the ledger as
`T0N: minor (deferred): <one line>` and **never extend the loop**; a re-review that grows new blocking
findings every round is a loop that never ends.

Append one ledger line per round, before the next round starts:

```bash
bash .codeadd/scripts/build-ledger.sh "${LEDGER_FILE}" \
  "${TASK_ID}: fix round ${ATTEMPT}/3 (${N_ADDRESSED} addressed, ${N_OPEN} open; commits ${FIX_BASE}..${HEAD})"
```

- **`NOT ADDRESSED` findings stay open** and go into the next round's `ROUTED_ROWS` — the round counter
  advances, `MAX_ATTEMPTS` stays 3, and round 3 carries the escalated `MODEL`.
- **All `ADDRESSED`** → the task is done; write its `complete` line.
- **At the cap with findings still open** → the breaker in **Correction Dispatch**: rule each one, record
  the `Ruling:` line, continue.

⛔ A fix round with no `fix round N/3` ledger line naming its re-review is an **unverified fix**, whatever
the build says. STEP 13's Compliance Gate refuses completion on exactly that.

### 12.3 Resolution annex (write-back)

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
2. Cross-reference each RF/RN against FILES_CREATED/FILES_MODIFIED **and against the ledger + `git log`** —
   the coordinator is the only actor holding both the full spec and the full ledger
3. Quick-read implementation files to confirm requirement exists in code
4. IF any RF/RN missing: list items → dispatch `@fix-agent` (routed rows = the missing RF/RN, with the tracked `ATTEMPT`) → re-run gate
5. **Ledger integrity check [REFUSAL]:** scan the ledger for every `fix round N/3` line. ⛔ IF any fix
   round has no matching re-review line recorded by STEP 12.2, DO NOT report completion — that fix is
   unverified whatever the build says. Run the missing re-review, then re-run this gate.
6. IF ALL RF/RN covered AND every fix round is re-reviewed: proceed to STEP 14

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

**16.1 Log Iteration (MANDATORY before user notification):**

Check if `docs/features/${FEATURE_ID}/iterations.jsonl` exists. If not, create empty file. Append entry:

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "<TYPE>" "/dev" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

IF `HAS_EPIC=true`, add `"sf"` field: `"sf":"${EPIC_CURRENT_SF}"`

**Types:** `add | fix | refactor | test | docs`

**16.2 Close the ledger for this run (MANDATORY):**

By the time this step runs the ledger must already hold **one line for every event of this run** — every
task, every fix round, every deferred minor, every parked finding and every ruling. This sub-step is where
you verify that, not where you write them in bulk after the fact; a ledger written from memory at the end
is the conversation again, which is the thing the ledger replaced.

Walk the run and confirm one line exists for each of:

| Event | Ledger line shape |
|---|---|
| pre-flight scan | `Preflight: <row>` — one per pair and per task, plus a `Ruling:` per conflict |
| task completed | `T0N: complete (commits BASE..HEAD, BUILD_STATUS=pass, review clean)` |
| fix round | `T0N: fix round N/3 (X addressed, Y open; commits FIX_BASE..HEAD)` |
| deferred minor | `T0N: minor (deferred): <one line>` |
| parked finding | `T0N: parked — <finding> — Ruling: <decision> — <why> — <cost if wrong>` |
| ruling | `Ruling: <what you decided> — <why> — <what it costs if wrong>` |
| subagent failure | `T0N: failed — <error excerpt>` |

Append any missing line now with `bash .codeadd/scripts/build-ledger.sh`, and say in the completion report
that it was appended late. ⛔ DO NOT hand-edit the ledger and ⛔ DO NOT rewrite its identity header — the
script owns both, and a ledger whose identity changes mid-build cannot be trusted.

**16.3 Checkpoint Tag — NOT created here (MANDATORY):**

⛔ DO NOT create a `checkpoint/*` tag here. **The reason is ownership, not absence: there is exactly ONE
tag owner, and it is `/add.plan-to-ready` (`{{cmd:add.plan-to-ready}}`).**

`/add.build` now commits per batch (STEP 11.3), so a tag created here would point at real work — that is
precisely why the prohibition has to be stated as ownership. A `checkpoint/*` tag does not mean "code was
committed"; it means **this subfeature converged**, and convergence is decided by
`{{cmd:add.plan-to-ready}}`'s gate run (`converge-gates.sh`), which this command never runs and cannot
speak for. A second creator would put the same tag name on two different commits with two different
meanings, and `done.sh --merge`'s checkpoint cleanup deletes by name — it cannot tell them apart.

`{{cmd:add.plan-to-ready}}` creates `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done` (or
`checkpoint/${FEATURE_ID}-done` on a simple feature), annotated, on its own gated checkpoint commit. Until
it runs, `status.sh`'s `LAST_CHECKPOINT` correctly reports nothing — and **that silence is the signal that
this subfeature has not converged.** Commits on the branch prove work happened; only the tag proves it
converged.

**16.4 Update epic.md (IF HAS_EPIC=true only):**

IF file exists, resolve the Subfeatures row whose `id` cell equals
`${EPIC_CURRENT_SF}` and set that row's `status` column to `done`. Read and
write columns **by header name**, per the `epic` schema
(`{{skill:add-doc-schemas/references/new-feature.md}}`) — never by
string-matching the row's old text.

⛔ DO NOT write the `checkpoint` cell. Per 16.3, this command creates no
checkpoint **tag**, so it owns none of that column — the cell names a tag, and
naming a tag you did not create is how the column starts pointing at nothing.
The schema writes `checkpoint` only from the command that creates the tag and
the commit it points at (`{{cmd:add.plan-to-ready}}`). That the batch commits of
STEP 11.3 exist changes nothing here: they are not checkpoint commits.

---

## STEP 17: Completion (Inform user based on mode)

Inform user of completion including: feature ID, files summary (per area count), build status, the ledger
path with its commit brackets, and next suggested commands.

### 17.1 "Rulings I made" [MANDATORY — EXHAUSTIVE, NOT REPRESENTATIVE]

**Every ruling reaches the human.** Grep the ledger for every line containing `Ruling:` — pre-flight
conflict rulings and cap rulings alike — and reprint **all of them**, in the order they were made:

```bash
grep -n 'Ruling:' "${LEDGER_FILE}"
```

```markdown
## Rulings I made

| # | Ruling | Why | Costs if wrong |
|---|--------|-----|----------------|
| 1 | T02's name wins for `UserDto.fullName` | plan.md Architecture Decisions names it | a rename in T05 |
| 2 | Shipped without the null guard the reviewer wanted | the caller already guards | a crash |
```

- **Exhaustive.** If the ledger holds a ruling, this section holds it. A ruling that stays in the ledger
  and never surfaces is a decision made in secret, and the whole mechanism becomes decorative.
- **Every row carries all three parts** — decision, why, cost-if-wrong. The cost column is what makes a
  ruling reviewable: a human reading "the caller already guards" cannot tell whether to check it; a human
  reading "costs a crash if wrong" can. ⛔ A row with an empty cost cell is a defect — go back to the
  ledger line and supply it, or re-open the finding.
- **Zero rulings is a valid outcome and is stated, not omitted:** "Rulings I made: none — no conflict and
  no finding reached the cap." Silence reads as "the section was skipped".

Also surface, from the same ledger: deferred minors (count + one line each), parked findings, and any
subagent failure line. These are not rulings and go in their own short list.

### 17.2 Next command

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
| `@fix-agent` exhausted `MAX_ATTEMPTS`, findings still open | THE BREAKER: rule each open finding into the ledger (`Ruling:` format, 10.0.3) and continue. Do NOT stop the session |
| `@fix-agent` exhausted `MAX_ATTEMPTS`, build still red | Report unresolved rows and last errors; STOP. The BUILD GATE is not a finding to rule on. Never advance as if the build passed |
| `review-package.sh` exits 2 (empty range) | The fix produced no commit — that is the finding. Do NOT dispatch the re-reviewer against nothing; re-open the round |
| Ledger and `git log` disagree | git wins for what EXISTS, the ledger wins for what was DECIDED. Record the reconciliation as a ledger line |
| >4 areas detected | Split into maximum parallel groups |
| No plan.md or about.md | Inform user to run /feature or /plan first |
