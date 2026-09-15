# Feature Review Specialist

<!-- uses:
- skill: add-commit
- skill: add-doc-schemas
- skill: add-final-report
- skill: add-investigation
- skill: add-knowledge-discovery
- skill: add-tasks-checklist
- skill: add-doc-schemas/references/new-feature.md
- agent: reviewer-agent
- agent: ux-agent
- command: /add.build
- command: /add.done
- command: /add.plan
- command: /add.qa-setup
- command: /add.wiki
- script: qa-evidence.sh
- script: status.sh
-->

<!--
Four entries left this block with the QA steps themselves — the QA skill, its
coordinator reference, and the two judges. The setup command STAYS declared:
the base body still names it in STEP 11.1's remedy for both gate states, so
removing it would dangle. STEPs 8, 9 and 10 now arrive from
fragments/qa-pipeline/, which declares them, and the phantom-edge gate is what
caught them still being declared here.

⛔ DO NOT name them in this comment. proseOf() strips only the `uses:` block,
so every other HTML comment is read as prose — spelling them out here
re-creates exactly the undeclared references removing them was meant to clear.
-->

> **READ-ONLY RULE:** This command **never modifies code**. Every finding — code review, spec compliance, UX, functional, a11y, build failures, red validation gates — is emitted as a routed row in `## Fix Routing` on `review-NNN.md`, and `/add.build` applies it. A judge that moves the thing it judges cannot converge, and it invalidates the QA evidence it just captured.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Coordinator for feature review. Dispatches read-only reviewers (Frontend + Backend) in parallel, consolidates every finding into one routed correction contract, and writes a versioned `review-NNN.md`. With the `qa-pipeline` feature enabled it additionally judges the rendered result through the absorbed QA sections; without it, this command is the code review and the spec-compliance audit.

---

## Yolo Mode

If argument contains `--yolo`: Skip STEP 1, auto-stage all, execute to completion, log all auto-decisions. It does **not** re-enable auto-correction — this command has none.

---

## MANDATORY SEQUENTIAL EXECUTION

**STEPS IN ORDER:**
```
STEP 1: Pre-Review Setup        → CHECK unstaged, ASK user
STEP 2: Bootstrap Context       → status.sh, load docs, load CLAUDE.md, read changed files
STEP 3: Spec Compliance Audit   → Deep plan.md vs code (BEFORE technical review)
<!-- feature:tdd-pipeline:step-list -->
<!-- /feature:tdd-pipeline:step-list -->
STEP 4: Dispatch Reviewers      → PARALLEL (Frontend + Backend), READ-ONLY
STEP 5: Consolidate Findings    → Merge, deduplicate, aggregate, score
STEP 6: Build Verification      → Run build; a failure is a routed finding, NOT a fix
STEP 7: Validation Gates Re-Run → INDEPENDENTLY re-run every gate from CLAUDE.md (do NOT trust ticks)
<!-- feature:qa-pipeline:step-list -->
<!-- /feature:qa-pipeline:step-list -->
STEP 11: Quality Gate Report    → Create review-NNN.md (incl. ## Fix Routing) + console output
```

---

## GATES AND PRECONDITIONS

All gates must be checked sequentially before proceeding to the next step. Gate failures block progress. Prohibitions below replace all conditional blocks throughout the document.

### Gate 1: Implementation Complete (STEP 1)

**Validation:** Feature code exists with minimum required documentation.

| Condition | Required | Status |
|-----------|----------|--------|
| Feature code exists | Committed, staged, or unstaged | Check working directory |
| `docs/features/${FEATURE_ID}/about.md` | Yes | Validate exists |
| `docs/features/${FEATURE_ID}/plan.md` | Recommended | Warn if missing (non-blocking) |

**Success Criteria:** about.md exists.
**Failure:** STOP. Inform user to complete implementation first.

### Gate 2: Context Fully Loaded (STEP 2)

**Validation:** All project context available before dispatching reviewers.

| Context | Source | Status |
|---------|--------|--------|
| Feature metadata | `bash .codeadd/scripts/status.sh` | FEATURE_ID, CURRENT_PHASE, FILES_TO_REVIEW |
| Feature docs | `docs/features/${FEATURE_ID}/*` (+ `subfeatures/${SFxx}-*/` on an epic) | about.md, discovery.md, plan.md, design.md (opt, SF-scoped — see 2.2), iterations.jsonl, decisions.jsonl |
| Knowledge base | via `{{skill:add-knowledge-discovery/SKILL.md}}`: hub + relevant area pages (if `WIKI:present`) | patterns, conventions to review against |
| Architecture reference | `CLAUDE.md` | Config, DI, repo, CQRS, naming, multi-tenancy, security, file structure |
| Changed files | `git diff --name-only` + read each file | ALL files from FILES_TO_REVIEW |

**Success Criteria:** ALL context loaded. Proceed to STEP 3.
**Failure:** Rerun context loading. Do NOT dispatch reviewers.

### Gate 3: Spec Compliance Audit Complete (STEP 3)

**Validation:** plan.md contracts match implementation before technical review.

| Audit Phase | Checklist |
|-------------|-----------|
| Load contracts | Extract routes, services, DTOs, guards, queues from plan.md prose |
| Load acceptance checklist | Read `docs/features/${FEATURE_ID}/tasks.md` → `## Acceptance Checklist` with tick state `[ ]/[x]/[!]` |
| Validate requirements coverage | `## Requirements Coverage` section must exist mapping RF/RN to checklist items |
| Execute audit | For each checklist item: locate impl (file:line), validate behavior, compare vs about.md (RF/RN), record status |
| Cross-reference | All RF/RN from about.md appear in coverage section; all RF/RN have ≥1 checklist item |

**Status Taxonomy:**
- `COMPLIANT`: Tick `[x]` AND matches plan.md name/type/behavior
- `DIVERGENT`: Tick `[x]` but differs from spec (describe gap)
- `FAILED`: Tick `[!]` (validator flagged); confirm reason
- `PENDING`: Tick `[ ]` (not implemented)
- `STALE TICK`: Tick `[x]` but code missing → reopen, block delivery

**Success Criteria:** `SPEC_AUDIT_STATUS = COMPLIANT` (>80% items compliant, no STALE_TICK, no UNCOVERED RF/RN).
**Failure:** Audit status = `DIVERGENT` or `INCOMPLETE`. Report findings; do NOT dispatch reviewers until resolved.

**Special Cases:**
- `tasks.md` OR `## Acceptance Checklist` missing → STOP. Report "Feature missing tasks.md/##Acceptance Checklist — must replan via /add.plan".
- All RF/RN covered but some items divergent → Proceed (marked ⚠️ in report).

### Gate 4: Reviewers Dispatched and Complete (STEP 4-5)

**Validation:** Backend and Frontend reviewers must complete before consolidation.

| Condition | Rule |
|-----------|------|
| Preconditions | Gates 1-3 PASSED. Context fully loaded. Spec audit complete. |
| Dispatch rule | Detect scope: frontend files → dispatch frontend; backend/libs files → dispatch backend; both → dispatch both in parallel |
| Blocking condition | ANY finding with unclear root cause → Load `add-investigation` skill, apply Phase 3 differential diagnosis before classifying severity |
| Completion requirement | ALL reviewers must return with findings before STEP 5 consolidation |

**Success Criteria:** All dispatched reviewers complete with findings consolidated.
**Failure:** Rerun missing reviewers. Do NOT proceed to build verification.

### Gate 5: Build Status Recorded (STEP 6)

**Validation:** The build is run and its result recorded. This command does NOT fix it.

| Step | Action | Condition |
|------|--------|-----------|
| Run build | Project build command (see CLAUDE.md) | Capture exit code + stderr |
| Build fails | Emit each error as a `## Fix Routing` row, area-scoped, severity `blocker` | Mark Overall BLOCKED |
| Idempotency | Do NOT re-dispatch reviewers | The review is a single pass over one tree |

⛔ IF the build fails:
  ⛔ DO NOT USE Edit or Write on any source file
  ⛔ DO NOT re-run the build hoping for a different result
  ✅ DO route the errors and continue to STEP 7 — the report is the deliverable

**Success Criteria:** The build was run and its status recorded, pass or fail.
**Failure:** The build could not be run at all (no command). Report it and continue.

### Gate 6: Validation Gates Re-Run Independently (STEP 7)

**Validation:** Every gate from CLAUDE.md `validation_gates` block re-executed in current session.

| Condition | Rule |
|-----------|------|
| Precondition | Build passes (Gate 5). STEP 7.5 (iteration logging) completed if files modified. |
| Load gates | Read CLAUDE.md `validation_gates` block. If missing → emit one-line nudge and skip rest of STEP 7. |
| Re-run procedure | For each `(intent, command)` in block: invoke via Bash, capture stdout/stderr/exit code in this session |
| Exit 0 | Confirm `[x]` (or upgrade `[!]`/`[ ]` to `[x]`) |
| Exit ≠ 0 | Partition failures into `TOUCHED_FAILURES` (git diff --name-only) vs `UNTOUCHED_FAILURES` |
| TOUCHED_FAILURES | Downgrade tick to `[!] — REASON: <≤120 chars>`. **Mark review BLOCKED.** Do NOT auto-fix — emit each as a `## Fix Routing` row. |
| UNTOUCHED_FAILURES only | Keep `[x]`. Refresh `### Known Issues` section (cap 10 items + `+N more`). |
| Write tasks.md | Update with new tick state and exit code pairs |
| Idempotency | Do NOT re-dispatch reviewers. Gate failures are validator job, not review job. |

**Success Criteria:** All touched gates exit 0. No `[!]` marks on touched files.
**Failure:** Any `[!]` on touched file. Mark review BLOCKED. Report reason to user.

**Special Cases:**
- CLAUDE.md has no `validation_gates` → Emit nudge: "Note: validation_gates not detected in CLAUDE.md. Run /add.wiki to enable validation gates." Skip rest of STEP 7.

### Gate 7: Review Document Writable (STEP 11)

**Validation:** `review-NNN.md` must write successfully before console output.

| Step | Action | Condition |
|------|--------|-----------|
| Collect data | Build: STEP 6. Spec: STEP 3. Scores: STEP 5. Gates: STEP 7. QA: the `qa-pipeline` judgement step, when that feature is enabled. |
| Build table | Quality Gate Report (see STEP 11.1) |
| Resolve NNN | Highest existing `docs/features/${FEATURE_ID}/review-NNN.md` + 1; `001` when none. **One sequence per feature**, flat at the feature-directory root |
| Write report | `docs/features/${FEATURE_ID}/review-NNN.md` per the `review` schema, with all consolidated findings and the `## Fix Routing` union |
| QA baseline | The `> **QA baseline:**` line is MANDATORY — `${QA_BASELINE}` from STEP 2.2 item 4b, resolved from the filesystem this run. Emit `none` when no run exists; NEVER omit the line. `/add.done` BLOCKS a review without it |
| Idempotency | Numbering replaces backup. Never overwrite an existing `review-NNN.md`; allocate the next number |

**Success Criteria:** `review-NNN.md` written with all gates populated and every finding routed.
**Failure:** Write fails. Do NOT output console report. Debug and retry.

**Why there is no baseline-invalidation row:** this command is read-only on code,
so `REVIEW_TREE_AFTER == REVIEW_TREE_BEFORE` holds by construction. The whole
"corrections invalidated the QA evidence" category is structurally unreachable —
removed, not handled. STEP 7.5 is the self-check that keeps it that way.

---

## PRE-EXECUTION PROHIBITIONS

These prohibitions replace all scattered conditional blocks and prevent common mistakes:

| Prohibition | When | Alternative |
|-------------|------|-------------|
| Do NOT dispatch reviewers (Task) | Implementation NOT complete (Gate 1) | Stop and inform user to complete first |
| Do NOT write spec audit output | Context NOT loaded (Gate 2) | Load all docs and CLAUDE.md first |
| Do NOT dispatch reviewers (Task) | Spec audit NOT complete (Gate 3) | Execute Spec Compliance Audit first |
| Do NOT proceed to STEP 7/8 | Build failing after fixes | Fix build errors until 100% passing (Gate 5) |
| Do NOT trust ticks on Validation Gates | Existing `[x]` marks in tasks.md | Re-run every gate command independently (Gate 6) |
| Do NOT mark review READY | Any gate red on touched file after re-run | Report gate failure; block review (Gate 6) |
| Do NOT skip review silently | CLAUDE.md has no validation_gates | Emit one-line nudge; continue review (Gate 6) |
| Do NOT use Bash git commit | Any point in workflow | Use /add-commit skill instead |
| Do NOT stage files silently | Pre-Review Setup (STEP 1) | Ask user permission first via AskUserQuestion |
| Do NOT USE Edit or Write on application code | Any point in workflow | Emit a `## Fix Routing` row; `/add.build` applies it |
| Do NOT instruct a dispatched agent to fix anything | Reviewer or judge dispatch | Dispatch read-only; collect findings |
| Do NOT dispatch the QA judges | the `qa-pipeline` preflight has a failed `block` row (that row exists only when the feature is enabled) | Report the consolidated diagnosis and its remedy |
| Do NOT run `qa-evidence.sh promote` | Any point in workflow | Promotion belongs to `/add.done` alone |

---

## STEP 1: Pre-Review Setup

### 1.1 Check for Unstaged Changes

Check working directory for unstaged/untracked changes.

**If there are unstaged changes:**

Use AskUserQuestion tool to ask the user:

```
Detected uncommitted changes in your working directory.

To include the changes in the next commit along with review corrections, I can stage them (git add).

Can I stage your changes?
- Yes: I stage and proceed with the review
- No: I keep as-is and proceed (changes remain unstaged)
```

**If user agrees (Yes):**

Resolve the current feature first (`bash .codeadd/scripts/status.sh` → `FEATURE_ID`), then stage feature-scoped — all code changes plus ONLY this feature's docs; other features' untracked docs stay untracked (see `{{skill:add-commit/SKILL.md}}` Staging Rules):

```bash
git add -A -- . ':(exclude)docs/features/*'
[ -n "${FEATURE_ID}" ] && [ -d "docs/features/${FEATURE_ID}" ] && git add -A -- "docs/features/${FEATURE_ID}"
```
Save `STAGED_CHANGES=true` for tracking.

**If user declines (No):**
Proceed with review. Save `STAGED_CHANGES=false`.

**If no unstaged changes:**
Proceed directly. Save `STAGED_CHANGES=false`.

### 1.2 Validate Implementation Complete (Gate 1)

- Feature code exists (committed, staged, or unstaged)
- `docs/features/${FEATURE_ID}/about.md` exists
- `docs/features/${FEATURE_ID}/plan.md` exists (recommended)

**IF implementation is NOT complete:** Inform user and STOP.

---

## STEP 2: Bootstrap Context

### 2.1 Detect Current Feature

```bash
bash .codeadd/scripts/status.sh
```

**Parse the output to get:**
- `FEATURE_ID`
- `CURRENT_PHASE`
- `FILES_TO_REVIEW` (consolidated list of all changed files)

**Feature identified:** Display and proceed automatically.
**No feature:** If ONE exists, use it; if MULTIPLE, ask user.

### 2.2 Load Feature Documentation

List the feature docs directory, then **load ALL documents IN ORDER:**
1. `about.md` - Feature specification (EXTRACT: RF, RN, Acceptance Criteria)
2. `discovery.md` - Discovery insights (CHECK: Prerequisites Analysis)
3. `plan.md` - Technical plan (PRIMARY - verification checklist)
4. `design.md` - UX design (if exists). **Resolve it per the `feature-design` Location rule in `{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first, feature-level fallback).**, once per subfeature the changed files touch. SET `HAS_DESIGN=true` if ANY resolved, and pass every resolved path into `TASK_DOCUMENTS`. Concluding "no design.md" from the feature-level path alone is a review defect — the frontend validator then reviews contract-free and every `## Design Contract` dimension goes unchecked.
4b. **QA baseline (`QA_BASELINE`) — resolve now; the `qa-pipeline` evidence step emits it when the feature is enabled.** Run `bash .codeadd/scripts/qa-evidence.sh working-baseline "${FEATURE_DIR}"` and parse `BASELINE`. The script returns the highest WORKING run independently per scope (`feature`, `SFxx`), or `none`; final snapshots never enter a new review baseline. Preserve the returned scope/run pairs as the promotion manifest `/add.done` consumes. Resolve it from the filesystem at review time — never copy it from a previous review document, author it by hand, reformat it, or convert it to a filesystem path. `QA_BASELINE` IS the script's stdout, verbatim, and nothing else. ⛔ DO NOT write a path like `_tests/run-001` in place of the script's `feature:run-001` — that exact substitution once passed review and `/add.done` rejected the whole epic at merge time.
4c. **Reviewed-tree fingerprint (`REVIEW_TREE_BEFORE`).** Compute a deterministic digest over every tracked or nonignored untracked file in the working tree, including each relative path and current content. Represent deleted tracked files explicitly. Exclude only this review's bookkeeping paths: `${FEATURE_DIR}/review-*.md`, `${FEATURE_DIR}/tasks.md`, and `${FEATURE_DIR}/iterations.jsonl`. Store the digest before dispatching reviewers.
4d. **Review scope (`SCOPE_DIR`, `REVIEW_SCOPE`) — resolve now, unconditionally.** An epic with subfeatures gives one `SCOPE_DIR` per in-scope `SFxx` under `FEATURE_DIR/subfeatures/`; a simple feature gives `SCOPE_DIR = FEATURE_DIR`. `REVIEW_SCOPE` is the YAML list of those scopes — `[SF01, SF02]`, or `[feature]` for a simple feature. ⛔ **This runs whether or not `qa-pipeline` is enabled.** STEP 11.2's `Scope` column and STEP 11.3's mandatory `scope:` frontmatter field both read it, and both are ungated; the QA steps consume the same value when the feature supplies them, and own none of it.
5. `iterations.jsonl` - Implementation history (JSONL: what was implemented, pivots, areas touched)
   - Each line: `{"ts":"...","agent":"...","type":"...","slug":"...","what":"...","files":["..."]}`
   - Use to understand: implementation sequence, which areas were modified, any pivots/corrections
   - Cross-reference with changed files to validate completeness
6. `decisions.jsonl` - Pivot decisions (if exists, check for areas with multiple pivots = extra review attention)
7. Consult knowledge base for validation:
   - IF `WIKI:present` (from script output): Load `{{skill:add-knowledge-discovery/SKILL.md}}`, read the hub (`{{addpath:wiki/index.md}}`), then SELECT + read the `{{addpath:wiki/domains/<area>.md}}` page(s) matching the changed code's areas, plus `{{addpath:wiki/conventions.md}}`. Freshness-check each selected page.
   - Run the skill's GRAPH step over the changed file list. **GRAPH question:** which deliveries last changed the files in this diff? The question is phrased over PATHS, not keywords, because a diff is what this step holds — resolve it in the skill's action table rather than reducing the paths to words first. **`RELATED_WORK` destination:** STEP 10.1's dispatch payload, which carries it to both judges as the deliveries that last changed these files. **STEP 10 arrives with `qa-pipeline`** — with the feature disabled there are no judges to carry it to, and `RELATED_WORK` stays coordinator context for STEPs 3 and 5. ⛔ DO NOT skip the GRAPH step on that branch: the history it returns is what tells STEP 3 a file was rewritten two deliveries ago and is not the new work it looks like.

```
IF `RELATED_WORK` IS STILL BLANK AFTER THE GRAPH STEP:
  ⛔ DO NOT: Carry on as though the step ran
  ✅ DO: Fill it with the hits, with `none` when the graph answered and had no match,
         or with `NOT VERIFIED` plus the reason when the graph could not be reached
```

   - IF `WIKI:present` is false: note "knowledge base unavailable — /add.wiki generates it" and continue with code-derived patterns only.
   - These pages contain implementation patterns and conventions to validate against

### 2.3 Load Project Architecture Reference

Read CLAUDE.md and **extract from specification:**
- Configuration patterns (env vars, configs)
- DI patterns (service injection)
- Repository patterns
- CQRS patterns (if applicable)
- Naming conventions
- Multi-tenancy rules (if applicable)
- Security rules
- Expected file structure

**CLAUDE.md is the source of truth** for validating code.

### 2.4 Read ALL Changed Files (Gate 2)

From `status.sh` output, read ALL files in `FILES_TO_REVIEW`.

**IMPORTANT:** Review must cover ALL changed files (committed, staged, unstaged, untracked).

---

## STEP 3: Spec Compliance Audit (BEFORE technical review)

**Deep audit of plan.md spec vs implemented code. Catches gaps the code review does not.**

### 3.1 Load Contracts and Acceptance Checklist

```
READ docs/features/${FEATURE_ID}/plan.md
  → Extract contracts from prose:
    - Routes: POST/GET/PUT/DELETE + path patterns
    - Services: Service/Handler/Adapter class definitions
    - DTOs: Dto/Request/Response class definitions
    - Guards: Guard class definitions
    - Queues: queue/processor/worker references

READ docs/features/${FEATURE_ID}/tasks.md → section `## Acceptance Checklist`
  → Each item ends with `(RFNN/RNNN)` reference and carries [ ]/[x]/[!] tick state
  → Use as deterministic audit source — pairs each contract with its RF/RN coverage and tick state

READ docs/features/${FEATURE_ID}/tasks.md → section `## Requirements Coverage`
  → Derived RF/RN tick state — used in cross-reference
```

**IF tasks.md OR `## Acceptance Checklist` ABSENT:** Stop and report "Feature missing tasks.md/##Acceptance Checklist — must replan via /add.plan".

### 3.2 Execute Audit (ALL areas)

For EACH item in `## Acceptance Checklist`:

```
a. LOCATE implementation with file:line (cross-reference contract from plan.md prose)
b. VALIDATE not just existence but BEHAVIOR:
   - Route: exists AND accepts correct params (path variables, query, body)?
   - Service: generic/adapter-based as spec OR hardcoded to specific provider?
   - DTO: has ALL specified fields with correct types?
   - Guard: applied at correct scope?
   - Queue: processes events as described?
c. COMPARE with about.md: does the item satisfy the RF/RN referenced in `(RFNN/RNNN)`?
d. STATUS per item (cross-check tick state vs reality):
   COMPLIANT     — tick `[x]` AND matches plan.md prose in name, type, behavior
   DIVERGENT     — tick `[x]` but differs from spec (describe exact gap; possibly stale tick)
   FAILED        — tick `[!]` (validator already flagged); inspect REASON, confirm or escalate
   PENDING       — tick `[ ]` (not yet implemented)
   STALE TICK    — tick `[x]` but code missing — re-open tick, block delivery
```

### 3.3 Cross-Reference

```
Do ALL RF/RN from about.md appear in tasks.md → ## Requirements Coverage?
Do ALL RF/RN have at least one ## Acceptance Checklist item referencing them via `(RFNN/RNNN)`?
  → COVERED:   RF/RN has corresponding checklist item(s)
  → UNCOVERED: RF/RN has no checklist item — architect failed at /add.plan; requires replan
```

### 3.4 Spec Audit Output (Gate 3)

Output the audit as a table with columns: Item, Type, Expected, Found at, Status. Include summary counts (COMPLIANT/DIVERGENT/MISSING), RF/RN coverage, and compute SPEC_AUDIT_STATUS:
- `COMPLIANT`: >80% items compliant, no STALE_TICK, no UNCOVERED RF/RN
- `DIVERGENT`: Some items divergent but no show-stoppers
- `INCOMPLETE`: Show-stoppers present (STALE_TICK, UNCOVERED RF/RN)

**IF SPEC_AUDIT_STATUS ≠ COMPLIANT:** Report findings to user. Do NOT proceed to STEP 4 until resolved.

<!-- feature:tdd-pipeline:spec-audit -->
<!-- /feature:tdd-pipeline:spec-audit -->

---

## STEP 4: Dispatch Specialized Reviewers (PARALLEL)

### 4.1 Detect Scope

Based on changed files, determine which reviewers to dispatch:
- **frontend**: `apps/frontend/**` detected
- **backend**: `apps/backend/**` OR `libs/**` detected

### Agent Roster

Every unit of work in this command is one row below. The command coordinates —
gates, scope resolution, state reads, merges — and the agents do the work. An
orchestrator driving this command reads the same roster and dispatches the same
agents directly, at depth 1.

| Agent | Capability | Inputs | Expected report |
|-------|-----------|--------|-----------------|
| `@reviewer-agent` (frontend) | **read-only** | `TASK_DOCUMENTS`, changed frontend files, validation checklist | findings by severity, `SPEC_STATUS`, `## Fix Routing` rows |
| `@reviewer-agent` (backend) | **read-only** | `TASK_DOCUMENTS`, changed backend files, validation checklist | findings by severity, `SPEC_STATUS`, `## Fix Routing` rows |

⛔ Both reviewer dispatches are **read-only**. A reviewer that edits code invalidates
the evidence this command just captured.
  ⛔ DO NOT instruct a reviewer to apply a fix
  ⛔ DO NOT accept a "Files Modified" section in a reviewer report
  ✅ DO emit every finding as a routed row for `/add.build` to consume

### 4.2 Dispatch Strategy

**If BOTH frontend and backend files exist:**
- Dispatch BOTH reviewers in PARALLEL (single message, multiple Task calls)

**If only ONE area exists:**
- Dispatch single reviewer

**Always wait for ALL reviewers to complete before proceeding.**

**Idempotency:** Do NOT re-dispatch reviewers if a build fix occurs (see Gate 5 note).

---

### DISPATCH AGENT: @reviewer-agent — Frontend Review

**Intent:** Review frontend code quality, patterns, and UX implementation for the feature.

```
description: "Review Frontend for ${FEATURE_ID}"
prompt: |
  ## ROLE
  You are the FRONTEND REVIEWER for feature ${FEATURE_ID}.

  ## BOOTSTRAP
  1. Run: bash .codeadd/scripts/status.sh
  2. Read ALL files listed in TASK_DOCUMENTS
  3. IF WIKI:present: read {{addpath:wiki/domains/frontend.md}} (+ {{addpath:wiki/conventions.md}})
  4. Read changed files: [list from FILES_TO_REVIEW with apps/frontend/** pattern]
  5. Read skills: add-frontend-development (PRIMARY), add-code-review, add-ux-design (ONLY if HAS_DESIGN=false — a design.md resolved at SF level counts, so never load it as a substitute for an epic's subfeature contract)

  ## TASK_DOCUMENTS (read ALL — source of truth)
  ${TASK_DOCUMENTS}

  ## VALIDATION CHECKLIST
  - [ ] React patterns: Hooks, composition, state management, TanStack Query
  - [ ] UX: every `## Design Contract` dimension in each resolved design.md verified against the code, responsive, accessibility (ARIA), loading/error states
  - [ ] Code: No `any` types, no console.log, no dead code, no hardcoded values
  - [ ] Security: XSS sanitized, URLs validated, no sensitive data in localStorage
  - [ ] Contracts: Frontend types match backend DTOs, API calls use correct endpoints
  - [ ] Patterns: State, component structure, styling, HTTP client follow documented patterns

  ## RULES
  - READ-ONLY. Do NOT edit, write or create any file. Report findings only.
  - NO questions — classify and report every violation you find
  - Use skills as source of truth
  - Design specs are MANDATORY whenever HAS_DESIGN=true, including SF-level design.md on an epic
  - Report ALL violations; no deferrals and no silent downgrades
  - DO NOT run build (coordinator does it)

  ## REPORT FORMAT
  Files Reviewed count, Issues by Category (Patterns, UX, Code Quality, Security, Contracts), each finding as (file:line, severity, area, proposed route, symptom), Score X/10.
```

---

### DISPATCH AGENT: @reviewer-agent — Backend Review

**Intent:** Review backend code quality, architecture, security, database, and product completeness for the feature.

```
description: "Review Backend for ${FEATURE_ID}"
prompt: |
  ## ROLE
  You are the BACKEND REVIEWER for feature ${FEATURE_ID}.

  ## BOOTSTRAP
  1. Run: bash .codeadd/scripts/status.sh
  2. Read ALL files listed in TASK_DOCUMENTS
  3. IF WIKI:present: read {{addpath:wiki/domains/backend.md}} + {{addpath:wiki/domains/database.md}} (+ {{addpath:wiki/conventions.md}})
  4. Read changed files: [list from FILES_TO_REVIEW with apps/backend/** OR libs/** pattern]
  5. Read skills: add-backend-development (PRIMARY), add-database-development, add-code-review, add-security-audit, add-delivery-validation

  ## TASK_DOCUMENTS (read ALL — source of truth)
  ${TASK_DOCUMENTS}

  ## VALIDATION CHECKLIST

  **Patterns (Critical):** IoC/DI (providers, imports, barrel exports), REST API (noun-based URLs, 201/204 codes), DTOs (class-validator, no raw objects, global validation)

  **Architecture:** Domain ← Repositories ← Services ← Controllers; no domain imports from outer; no business logic in controllers; SOLID principles (SRP, O/C, DIP)

  **Database:** Migrations with up/down; Kysely types updated; parametrized queries; no JSON.parse on JSONB (auto-parsed); no JSON.stringify before insert

  **Security (OWASP):** Parametrized queries, input validation; guards on protected routes; encrypted credentials; no sensitive logs; account_id filtering (multi-tenancy); CORS restricted; no critical npm vulnerabilities; explicit DTOs

  **Code Quality:** No `any` types, explicit returns, no console.log, no debugger, no comments, no unused imports, no magic numbers

  **Error Handling:** NestJS exceptions; throw NotFoundException (not null); descriptive messages

  **Contracts:** Backend DTOs mirrored as frontend interfaces; enums match; Date→string serialization

  **Product Validation:** For each RF/RN in about.md: verify implementation at file:line; check prerequisites (data, features, config exist); report anything missing

  ## RULES
  - READ-ONLY. Do NOT edit, write or create any file. Report findings only.
  - NO questions — classify and report every violation you find
  - Use skills as source of truth
  - Missing components = CRITICAL violation
  - Missing prerequisites = CRITICAL (report, don't assume)
  - Report ALL code violations; no deferrals and no silent downgrades
  - DO NOT run build (coordinator does it)

  ## REPORT FORMAT
  Files Reviewed, Issues by Category (Patterns, Architecture, Database, Security, Code Quality, Contracts), each finding as (file:line, severity, area, proposed route, symptom), Product Validation (RF/RN/Prerequisites status), Product Status (PASSED/BLOCKED), Score X/10.
```

---

## STEP 5: Consolidate Findings

### 5.1 Process Reviewer Outputs

**GATE 4: ALL reviewers must return before proceeding.**

**IF a finding has unclear root cause** (symptom reported but cause not isolated, OR severity disputed between reviewers, OR finding crosses layers): LOAD {{skill:add-investigation/SKILL.md}} and apply Phase 3 (Differential Diagnosis) before classifying severity. Do NOT route a finding whose cause has not been confirmed via differential diagnosis — present it to the user with the diagnostic table instead of assigning it an agent.

**After ALL reviewers return:**

1. **Merge findings:**
   - Combine issues from Frontend + Backend reviewers
   - Deduplicate if same issue reported by multiple reviewers

2. **Aggregate metrics:**
   - Total files reviewed
   - Total issues found/fixed
   - Severity breakdown
   - Product validation status (from Backend Reviewer)

3. **Calculate overall score:**
    ```
   Frontend Score: X/10
   Backend Score: Y/10
   Overall Score: (X + Y) / 2

   Product Status: PASSED/BLOCKED
   ```

4. **Emit findings as routed rows.** Every consolidated finding becomes a `## Fix Routing` row in STEP 11.2 — area, route, file, symptom. Nothing is applied here.

---

## STEP 6: Build Verification

Run the project build command (see CLAUDE.md). Capture the exit code and stderr.

**Expected:** the build succeeds.

**If the build fails:**
- Record the status as BLOCKED in the Quality Gate Report
- Emit each error as a `## Fix Routing` row: area-scoped, severity `blocker`, with the file and the compiler message as the symptom
- Continue to STEP 7 — a failing build does not stop the review, it becomes its most important finding

⛔ GATE 5 — the build is evidence, not a task:
  ⛔ DO NOT USE Edit or Write to fix a build error
  ⛔ DO NOT re-run the build expecting a different result
  ✅ DO route the errors and carry on producing the report

---

## STEP 7: Validation Gates Re-Run (INDEPENDENT)

The reviewer's job is to verify, not to trust. Existing `[x]` ticks on `## Validation Gates` are evidence of past success — they are NOT evidence of current correctness. This step re-establishes the truth.

### 7.1 Pre-condition

Read CLAUDE.md `validation_gates` block.

- **Block missing** → emit one-line nudge `Note: validation_gates not detected in CLAUDE.md. Run /add.wiki to enable validation gates.` and skip the rest of STEP 7.
- **Block present** → proceed.

### 7.2 Re-Run Procedure

Apply the **Validation Gates Procedure (review variant)** from `{{skill:add-tasks-checklist/SKILL.md}}`:

1. Compute `TOUCHED_FILES = git diff --name-only` against the feature base.
2. For EACH `(intent, command)` in `validation_gates`:
   1. Invoke the command via Bash. Capture stdout/stderr and exit code in this session.
   2. Exit 0 → confirm `[x]` (or upgrade `[!]`/`[ ]` to `[x]`).
   3. Exit ≠ 0 → partition failures into `TOUCHED_FAILURES` vs `UNTOUCHED_FAILURES`.
      - `TOUCHED_FAILURES` non-empty → downgrade the tick to `[!] — REASON: <≤120 chars>`. **Mark review BLOCKED.** Do NOT auto-fix in review (auto-fixes belong to build); surface to user instead.
      - `UNTOUCHED_FAILURES` only → keep `[x]` and refresh `### Known Issues` (cap 10 + `+N more`).
3. Write the updated `tasks.md`.

### 7.3 Hard Requirements

- Every gate command MUST be invoked via Bash in this session before STEP 11 produces `review-NNN.md`.
- Capture each `(gate, exit_code)` pair for inclusion in the Quality Gate Report.
- Review status MUST be BLOCKED if any gate is red on a touched file after re-run.
- Each red gate on a touched file becomes a `## Fix Routing` row, area-scoped, severity `blocker`.

### 7.4 Log Iteration

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "review" "/add.review" '"slug":"code-review","what":"Reviewed and routed findings","files":[]'
```

`files` is always empty: this command modifies no code.

### 7.5 Read-Only Self-Check (MANDATORY)

Recompute `REVIEW_TREE_AFTER` with the exact STEP 2.2 fingerprint procedure and
exclusions.

⛔ IF `REVIEW_TREE_AFTER != REVIEW_TREE_BEFORE`:
  ⛔ DO NOT continue past this self-check
  ⛔ DO NOT write `review-NNN.md`
  ✅ DO report that this run modified the tree it was judging — a contract
     violation, not a recoverable state. Name the changed paths and STOP.

This is a self-check on **this command's own behaviour**, not a QA staleness
category. With the review read-only the two fingerprints are equal by
construction, so a mismatch means a dispatched agent broke its read-only
contract.

<!-- feature:qa-pipeline:preflight -->
<!-- /feature:qa-pipeline:preflight -->
<!-- feature:qa-pipeline:evidence -->
<!-- /feature:qa-pipeline:evidence -->
<!-- feature:qa-pipeline:judge-head -->
<!-- /feature:qa-pipeline:judge-head -->
<!-- feature:qa-pipeline:judge-tail -->
<!-- /feature:qa-pipeline:judge-tail -->

**Live driving is a `playwright` plugin enhancement of the QA judgement above, never a replacement for it.** With `qa-pipeline` disabled there is no judgement here for the plugin to enhance, and with the plugin absent the judges work from persisted evidence. Enabling one does not enable the other.

<!-- plugin:playwright:drive -->
<!-- /plugin:playwright:drive -->

---

## STEP 11: Quality Gate Report (PRD0034)

**Consolidate every gate into `review-NNN.md`. The highest-numbered one is the merge prerequisite for `/add.done`.**

### 11.1 Build Quality Gate Report

Collect results from all previous steps:

```markdown
## Quality Gate Report

| Gate | Status | Details |
|------|--------|---------|
| Build | ✅ PASSED / ❌ BLOCKED | build command — X errors |
| Spec Compliance | ✅ PASSED / ⚠️ DIVERGENT / ❌ BLOCKED | X/Y items compliant |
| Code Review Score | ✅ PASSED / ❌ BLOCKED | X.X/10 (threshold: ≥ 7) |
| Product Validation | ✅ PASSED / ❌ BLOCKED | RF: X/X, RN: Y/Y |
| Validation Gates | ✅ PASSED / ⚠️ KNOWN ISSUES / ❌ BLOCKED | One row per gate from STEP 7 with `<command> → exit <code>` (omit row if CLAUDE.md has no validation_gates) |
| QA Judgement | ✅ PASSED / ⚠️ DEGRADED / ❌ BLOCKED / ⊘ NOT SET UP / ⊘ FEATURE OFF | Per-scope roll-up from the `qa-pipeline` judgement step, when that feature supplied one. The two ⊘ values are distinguished below |
| **Overall** | **✅ PASSED / ❌ BLOCKED** | **Ready for merge / Issues found** |

> Reviewed at: ${TIMESTAMP}
> Reviewed by: /add.review (model: ${MODEL})
```

**Overall = PASSED** only if ALL gates are PASSED or SKIPPED.
**Overall = BLOCKED** if ANY gate is BLOCKED.

**The two ⊘ states on the QA Judgement row are different diagnoses, and neither blocks.**
`⊘ FEATURE OFF` means `qa-pipeline` is disabled, so this command carried no QA steps to run at
all — remedy: `codeadd features enable qa-pipeline`, then `/add.qa-setup`. `⊘ NOT SET UP` means
the steps ran and stopped at the receipt gate — remedy: `/add.qa-setup` alone. Reporting the first
as the second sends the user to a command that will not fix it.

### 11.2 Build the unified `## Fix Routing` table

One table carries every finding class this command produced. It is the single
correction contract `/add.build` consumes — there is no second path.

It is the **union** of:

1. every in-scope `SCOPE_DIR`'s `qa-validation-NNN.md` `## Fix Routing` rows, where `qa-pipeline` produced one — none exist with the feature off, and the union is then items 2 to 4 (that per-scope schema section is unchanged and stays where it is);
2. code-review findings from STEP 5;
3. build failures from STEP 6 (Gate 5);
4. red validation gates on touched files from STEP 7 (Gate 6).

| Column | Content |
|--------|---------|
| `Scope` | The originating `SCOPE_DIR` (`SFxx`, or the feature id for a simple feature) |
| `ID` | Finding id, unique within this report |
| `Severity` | blocker / major / minor / polish |
| `Area` | database / backend / frontend / e2e |
| `Route` | The agent that owns the fix, or a manual route (`data-seed`, `env-boot`) |
| `File` | Path, where one is known |
| `Symptom` | One line — what is wrong, observable |
| `Blocked by` | IDs that must be resolved first, if any |

⛔ **No dedup rule.** Every row is scope-qualified, so two subfeatures reporting
the same symptom are genuinely two rows with two fix sites. Merging them would
lose a fix site.

**Ordering:** existing severity precedence first, then the area order the
correction flow already uses — database → backend → frontend → e2e.

Rows carried up from a per-scope report keep their route and their citation
state: a `@ux-agent` design-spec row missing its contract-line citation stays
flagged **presented, never dispatched**. No such row exists with `qa-pipeline`
off, because no judge ran to author one.

### 11.3 Write `review-NNN.md` (Gate 7)

Resolve `NNN` as the highest existing `docs/features/${FEATURE_ID}/review-NNN.md`
plus one (`001` when none). One sequence per feature, flat at the feature
directory root.

```
WRITE docs/features/${FEATURE_ID}/review-NNN.md   (per the `review` schema)

---
id: ${FEATURE_NUMBER}-review-NNN
type: review
created: ${TODAY}
feature: ${FEATURE_NUMBER}
scope: ${REVIEW_SCOPE}
branch: ${BRANCH_NAME}
status: open
---

# Review NNN: ${FEATURE_ID}

> **Date:** ${TODAY} | **Branch:** ${BRANCH_NAME}
> **QA baseline:** ${QA_BASELINE}

## Quality Gate Report
[table from 11.1]

## Spec Compliance Audit
[output from STEP 3.4]

## Code Review Summary
[aggregated findings from STEP 5]

## Product Validation
[RF/RN status from the backend reviewer]

## QA Judgement
[per-scope roll-up from the qa-pipeline judgement + links to each qa-validation-NNN.md; with the feature off, the gate value from STEP 11.1 and nothing else]

## Fix Routing
[the union table from 11.2]

## Resolution Annex
[empty on write — /add.build appends here and sets status: finalized]
```
⛔ `${FEATURE_NUMBER}` is the **bare** feature id (`0042F`) — the `[NNNN]F` prefix of the directory name, NOT `${FEATURE_ID}`, which `status.sh:88` sets to the full slug (`0042F-user-preferences`). The sibling `qa-validation` schema is validated against the bare form by `qa-evidence.sh` (it derives it from the directory basename), so a slug here produces an id the schema rejects.

The frontmatter block above is REQUIRED and its seven fields are the exact set
the `review` schema declares, in that order — `id`, `type`, `created`,
`feature`, `scope`, `branch`, `status`. Do NOT add fields, drop fields, or
reorder them. `NNN` in `id` is the number resolved at the top of this substep.
`status` is written `open` here and ONLY `{{cmd:add.build}}` ever sets it to
`finalized`, exactly once, when it appends the Resolution Annex.

`${REVIEW_SCOPE}` is resolved in **STEP 2.2 item 4d** and is always available —
the YAML list of every `SCOPE_DIR` this round covers, e.g. `[SF01, SF02]`, or
`[feature]` on a simple feature. This mirrors `qa-validation`'s `scope` field.
⛔ DO NOT look for it in a QA step: this field is mandatory in every review
document, and a review written with `qa-pipeline` off must still carry it.

⛔ NEVER overwrite an existing `review-NNN.md`. Numbering replaces the old
single-file backup rule; the sequence is what lets a loop compare rounds.

**IF the write failed:** Do NOT output console report. Debug and retry.

### 11.4 Console Output

**LOAD `{{skill:add-final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the gate table and the routing come after it, whole.

This command reviews and routes; it changes no application code. So `What was delivered` is the
verdict and the findings, `How it works` is what the gates actually measured, `Files touched` names
the `review-NNN.md` that 11.3 wrote and nothing else, and `⚠️ Needs your attention` carries the
blockers and the manual routes nobody else will pick up.

Then, after the seven blocks, output the quality gate summary: reviewers dispatched (files reviewed
per reviewer), findings by severity, spec compliance status, product validation
(RF/RN/prerequisites), scores, the gate table, the QA per-scope roll-up, the
path to this `review-NNN.md`, and next steps.

⛔ State explicitly that findings were **routed, not applied** — this command
modified no code — and name `{{cmd:add.build}}` as the step that applies them.

**Next steps (evaluate top-to-bottom, use FIRST match):**
- `BLOCKED` with routed rows → `{{cmd:add.build}}` — it consumes `## Fix Routing`, applies the fixes and appends the resolution annex here. Then re-run `/add.review`.
- `BLOCKED` with only manual routes (`data-seed`, `env-boot`, citation-missing) → resolve them by hand; they are user decisions, not agent work.
- `PASSED` → `{{cmd:add.done}}`.

⛔ This review is the LAST gate. If `{{cmd:add.build}}` runs AFTER it, this
`review-NNN.md` is stale — `/add.done` detects it and sends the user back here
for a new round.

---

## Summary of Rules

**ALWAYS:**
- Track the STAGED_CHANGES flag throughout execution
- Resolve `QA_BASELINE` through `qa-evidence.sh working-baseline` — per scope, working `run-NNN`, resolved from the filesystem this run, never copied from a previous review
- Emit every finding class into the one `## Fix Routing` table, scope-qualified
- Write `judged-tree` on every `qa-validation-NNN.md` the `qa-pipeline` judgement produced — the next run's skip predicate reads it
- Load `add-investigation` and apply differential diagnosis before classifying a finding whose root cause is unclear

**NEVER:**
- Modify application code — this command routes findings, it does not apply them
- Trust existing validation gate ticks
- Stage files without explicit user permission
- Skip product validation for RF, RN, or prerequisites
- Accept "it works" as justification for a violation
- Skip a reviewer if files exist in that area
- Re-dispatch reviewers after a build failure — the review is one pass over one tree
- Write QA evidence under `_tests/final/`, or run `qa-evidence.sh promote`
- Recompute `run-NNN` once the `qa-pipeline` evidence step has resolved it
