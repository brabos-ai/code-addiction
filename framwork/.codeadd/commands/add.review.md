# Feature Code Review Specialist

> **AUTO-CORRECTION RULE:** The reviewer MUST automatically apply ALL identified corrections. Only finalize when code is 100% correct.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).

Coordinator for feature code review. Dispatches specialized reviewers (Frontend + Backend) in parallel, consolidates findings, auto-corrects all violations, verifies build, and outputs structured report to console.

---

## Yolo Mode

If argument contains `--yolo`: Skip STEP 1, auto-stage all, auto-correct without confirmation, execute to completion, log all auto-decisions.

---

## MANDATORY SEQUENTIAL EXECUTION

**STEPS IN ORDER:**
```
STEP 1: Pre-Review Setup        → CHECK unstaged, ASK user
STEP 2: Bootstrap Context       → status.sh, load docs, load CLAUDE.md, read changed files
STEP 3: Spec Compliance Audit   → Deep plan.md vs code (BEFORE technical review)
STEP 4: Dispatch Reviewers      → PARALLEL (Frontend + Backend via Task)
STEP 5: Consolidate Findings    → Merge, deduplicate, aggregate, score
STEP 6: Build Verification      → npm run build, fix until passing
STEP 7: Validation Gates Re-Run → INDEPENDENTLY re-run every gate from CLAUDE.md (do NOT trust ticks)
<!-- feature:tdd:step-list -->
<!-- /feature:tdd:step-list -->
STEP 8: Quality Gate Report     → Create review.md + console output
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

### Gate 5: Build Passes (STEP 6)

**Validation:** Code compiles after reviewer corrections.

| Step | Action | Condition |
|------|--------|-----------|
| Run build | `npm run build` | Expected: exit code 0 |
| Build fails | Review errors, auto-fix, re-run | Repeat until passing |
| Idempotency | Do NOT re-dispatch reviewers after build fix | Fixes are follow-up corrections, not re-review |

**Success Criteria:** Build exits 0, no errors.
**Failure:** Build fails. Fix errors. Re-run build. Do NOT proceed to STEP 7 until build passes.

### Gate 6: Validation Gates Re-Run Independently (STEP 7)

**Validation:** Every gate from CLAUDE.md `validation_gates` block re-executed in current session.

| Condition | Rule |
|-----------|------|
| Precondition | Build passes (Gate 5). STEP 7.5 (iteration logging) completed if files modified. |
| Load gates | Read CLAUDE.md `validation_gates` block. If missing → emit one-line nudge and skip rest of STEP 7. |
| Re-run procedure | For each `(intent, command)` in block: invoke via Bash, capture stdout/stderr/exit code in this session |
| Exit 0 | Confirm `[x]` (or upgrade `[!]`/`[ ]` to `[x]`) |
| Exit ≠ 0 | Partition failures into `TOUCHED_FAILURES` (git diff --name-only) vs `UNTOUCHED_FAILURES` |
| TOUCHED_FAILURES | Downgrade tick to `[!] — REASON: <≤120 chars>`. **Mark review BLOCKED.** Do NOT auto-fix (report to user). |
| UNTOUCHED_FAILURES only | Keep `[x]`. Refresh `### Known Issues` section (cap 10 items + `+N more`). |
| Write tasks.md | Update with new tick state and exit code pairs |
| Idempotency | Do NOT re-dispatch reviewers. Gate failures are validator job, not review job. |

**Success Criteria:** All touched gates exit 0. No `[!]` marks on touched files.
**Failure:** Any `[!]` on touched file. Mark review BLOCKED. Report reason to user.

**Special Cases:**
- CLAUDE.md has no `validation_gates` → Emit nudge: "Note: validation_gates not detected in CLAUDE.md. Run /add.wiki to enable validation gates." Skip rest of STEP 7.

### Gate 7: Review Document Writable (STEP 8)

**Validation:** review.md must write successfully before console output.

| Step | Action | Condition |
|------|--------|-----------|
| Collect data | Build: status from STEP 6. Spec: status from STEP 3. Scores: from STEP 5. Gates: from STEP 7. |
| Build table | Quality Gate Report (see STEP 8.1) |
| Write review.md | `docs/features/${FEATURE_ID}/review.md` with all consolidated findings |
| QA baseline | The `> **QA baseline:**` line is MANDATORY — `${QA_BASELINE}` from STEP 2.2 item 4b, resolved from the filesystem this run. Emit `none` when no run exists; NEVER omit the line. `/add.done` BLOCKS a review.md without it |
| QA provenance | If this review changed QA-relevant files after capturing a non-`none` baseline, set `QA_BASELINE_INVALIDATED=true`, mark Overall BLOCKED, and route through `/add.qa` then `/add.review` |
| Idempotency | If review.md already exists → back it up as `review.md.prev`, write new |

**Success Criteria:** review.md written with all gates populated.
**Failure:** Write fails. Do NOT output console report. Debug and retry.

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
| Do NOT mark review PASSED or route to `/add.done` | `QA_BASELINE_INVALIDATED=true` | Require `/add.qa`, then a new `/add.review` |

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
4b. **QA baseline (`QA_BASELINE`) — resolve now, emit in 8.2.** Run `bash .codeadd/scripts/qa-evidence.sh working-baseline "${FEATURE_DIR}"` and parse `BASELINE`. The script returns the highest WORKING run independently per scope (`feature`, `SFxx`), or `none`; final snapshots never enter a new review baseline. Preserve the returned scope/run pairs as the promotion manifest `/add.done` consumes. Resolve it from the filesystem at review time — never copy it from a previous `review.md`. Initialize `QA_BASELINE_INVALIDATED=false`.
4c. **Reviewed-tree fingerprint (`REVIEW_TREE_BEFORE`).** Compute a deterministic digest over every tracked or nonignored untracked file in the working tree, including each relative path and current content. Represent deleted tracked files explicitly. Exclude only this review's bookkeeping paths: `${FEATURE_DIR}/review.md`, `${FEATURE_DIR}/review.md.prev`, `${FEATURE_DIR}/tasks.md`, and `${FEATURE_DIR}/iterations.jsonl`. Store the digest before dispatching reviewers.
5. `iterations.jsonl` - Implementation history (JSONL: what was implemented, pivots, areas touched)
   - Each line: `{"ts":"...","agent":"...","type":"...","slug":"...","what":"...","files":["..."]}`
   - Use to understand: implementation sequence, which areas were modified, any pivots/corrections
   - Cross-reference with changed files to validate completeness
6. `decisions.jsonl` - Pivot decisions (if exists, check for areas with multiple pivots = extra review attention)
7. Consult knowledge base for validation:
   - IF `WIKI:present` (from script output): Load `{{skill:add-knowledge-discovery/SKILL.md}}`, read the hub (`{{addpath:wiki/index.md}}`), then SELECT + read the `{{addpath:wiki/domains/<area>.md}}` page(s) matching the changed code's areas, plus `{{addpath:wiki/conventions.md}}`. Freshness-check each selected page.
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

<!-- feature:tdd:spec-audit -->
<!-- /feature:tdd:spec-audit -->

---

## STEP 4: Dispatch Specialized Reviewers (PARALLEL)

### 4.1 Detect Scope

Based on changed files, determine which reviewers to dispatch:
- **frontend**: `apps/frontend/**` detected
- **backend**: `apps/backend/**` OR `libs/**` detected

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
  - NO questions — fix automatically
  - Use skills as source of truth
  - Design specs are MANDATORY whenever HAS_DESIGN=true, including SF-level design.md on an epic
  - Fix ALL violations; no deferrals
  - DO NOT run build (coordinator does it)

  ## REPORT FORMAT
  Files Reviewed count, Issues by Category (Patterns, UX, Code Quality, Security, Contracts), Issues Fixed (file:line, severity, fix), Files Modified, Score X/10.
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

  **Product Validation:** For each RF/RN in about.md: verify implementation at file:line; check prerequisites (data, features, config exist); report missing (cannot auto-fix scope)

  ## RULES
  - NO questions — fix automatically
  - Use skills as source of truth
  - Missing components = CRITICAL violation
  - Missing prerequisites = CRITICAL (report, don't assume)
  - Fix ALL code violations; no deferrals
  - DO NOT run build (coordinator does it)

  ## REPORT FORMAT
  Files Reviewed, Issues by Category (Patterns, Architecture, Database, Security, Code Quality, Contracts), Issues Fixed (file:line, severity, fix), Files Modified, Product Validation (RF/RN/Prerequisites status), Product Status (PASSED/BLOCKED), Score X/10.
```

---

## STEP 5: Consolidate Findings

### 5.1 Process Reviewer Outputs

**GATE 4: ALL reviewers must return before proceeding.**

**IF a finding has unclear root cause** (symptom reported but cause not isolated, OR severity disputed between reviewers, OR finding crosses layers): LOAD {{skill:add-investigation/SKILL.md}} and apply Phase 3 (Differential Diagnosis) before classifying severity. Do NOT auto-correct findings whose cause has not been confirmed via differential diagnosis — escalate them to the user with the diagnostic table.

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

4. **Bind QA evidence to the corrected tree:**
   - Track reviewer correction paths for reporting, but use the STEP 2.2 tree fingerprint as the authority.
   - If `QA_BASELINE != none` and the final fingerprint differs, set `QA_BASELINE_INVALIDATED=true`.
   - Do NOT recapture the same run ID: its evidence predates these corrections.

---

## STEP 6: Build Verification

```bash
npm run build
```

**Expected:** Build succeeds.

**If build fails:**
- Review build errors
- Identify which corrections broke the build
- Fix build errors automatically
- Re-run build
- Repeat until build passes

**GATE 5: Do NOT proceed to STEP 7 until build passes 100%.**

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

- Every gate command MUST be invoked via Bash in this session before STEP 8 produces `review.md`.
- Capture each `(gate, exit_code)` pair for inclusion in the Quality Gate Report.
- Review status MUST be BLOCKED if any gate is red on a touched file after re-run.

### 7.4 Log Iteration (IF corrections applied)

**IF files were modified during review (auto-corrections):**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "fix" "/check" '"slug":"code-review","what":"Auto-corrected violations from review","files":["<list of modified files>"]'
```

Do NOT skip iteration logging if files were modified during review.

Before STEP 8, compute `REVIEW_TREE_AFTER` with the exact STEP 2.2 fingerprint procedure and exclusions. If `QA_BASELINE != none` and `REVIEW_TREE_AFTER != REVIEW_TREE_BEFORE`, set `QA_BASELINE_INVALIDATED=true`; this deterministic final check supersedes the provisional STEP 5 value.

---

## STEP 8: Quality Gate Report (PRD0034)

**Consolidate all gates into review.md. This file is the merge prerequisite for /add.done.**

### 8.1 Build Quality Gate Report

Collect results from all previous steps:

```markdown
## Quality Gate Report

| Gate | Status | Details |
|------|--------|---------|
| Build | ✅ PASSED / ❌ BLOCKED | npm run build — X errors |
| Spec Compliance | ✅ PASSED / ⚠️ DIVERGENT / ❌ BLOCKED | X/Y items compliant |
| Code Review Score | ✅ PASSED / ❌ BLOCKED | X.X/10 (threshold: ≥ 7) |
| Product Validation | ✅ PASSED / ❌ BLOCKED | RF: X/X, RN: Y/Y |
| Validation Gates | ✅ PASSED / ⚠️ KNOWN ISSUES / ❌ BLOCKED | One row per gate from STEP 7 with `<command> → exit <code>` (omit row if CLAUDE.md has no validation_gates) |
| **Overall** | **✅ PASSED / ❌ BLOCKED** | **Ready for merge / Issues found** |

> Reviewed at: ${TIMESTAMP}
> Reviewed by: /add.review (model: ${MODEL})
```

**Overall = PASSED** only if ALL gates are PASSED or SKIPPED and `QA_BASELINE_INVALIDATED=false`.
**Overall = BLOCKED** if ANY gate is BLOCKED or `QA_BASELINE_INVALIDATED=true`. Add a QA provenance row explaining that corrections changed the tree after the recorded baseline.

### 8.2 Write review.md (Gate 7)

```
WRITE docs/features/${FEATURE_ID}/review.md

Content:
# Review: ${FEATURE_ID}

> **Date:** ${TODAY} | **Branch:** ${BRANCH_NAME}
> **QA baseline:** ${QA_BASELINE}

## Quality Gate Report
[table from 8.1]

## Spec Compliance Audit
[output from STEP 3.4]

## Code Review Summary
[aggregated findings from STEP 5]

## Product Validation
[RF/RN status from Backend Reviewer]
```

**IF review.md write failed:** Do NOT output console report. Debug and retry.

### 8.3 Console Output

Output quality gate summary including: reviewers dispatched (files reviewed per reviewer), issues found/fixed with severity breakdown, spec compliance status, product validation (RF/RN/prerequisites), scores (frontend/backend/overall), gate statuses table, link to review.md, list of modified files, and next steps.

**Next steps (evaluate top-to-bottom, use FIRST match):**
- `QA_BASELINE_INVALIDATED=true` → `/add.qa` to capture the corrected tree, then `/add.review` to bind that new run. NEVER route directly to `/add.done`.
- `BLOCKED` → fix + re-run `/add.review`.
- `PASSED`, `HAS_DESIGN=true` (STEP 2.2), and NO `_tests/run-*/` directory exists for the scope → `/add.qa` — the rendered result was never validated. Run the QA loop (`/add.qa` ⇄ `/add.build qa`), then return here so review judges the post-fix tree. State this explicitly; do NOT route a never-QA'd UI feature straight to `/add.done`.
- `PASSED` → `/add.done`.

⛔ Code review is the LAST gate in the QA-validated flow. If `/add.build qa` runs AFTER this review, this `review.md` is stale — `/add.done` will detect it and send the user back here.

---

## Summary of Rules

**ALWAYS:**
- Check unstaged changes and ask user before staging (STEP 1)
- Load all feature docs and CLAUDE.md before dispatching reviewers (STEP 2)
- Execute spec compliance audit before technical review (STEP 3)
- Dispatch reviewers in parallel when both scopes exist (STEP 4)
- Consolidate findings with root cause analysis (STEP 5)
- Verify build passes after corrections (STEP 6)
- Re-run validation gates independently (STEP 7)
- Write review.md before console output (STEP 8)
- Track STAGED_CHANGES flag throughout execution
- Resolve `QA_BASELINE` through `qa-evidence.sh working-baseline` and emit it in review.md — per scope, working `run-NNN`, never copied from a previous review.md
- Invalidate a non-empty QA baseline when review corrections change QA-relevant files; require QA then re-review

**NEVER:**
- Dispatch reviewers without completing Gates 1-3
- Trust existing validation gate ticks
- Stage files without explicit user permission
- Skip product validation for RF, RN, or prerequisites
- Proceed to report if build is failing
- Leave code in a non-compiling state
- Accept "it works" as justification for violations
- Skip a reviewer if files exist in that area
- Re-dispatch reviewers if build fails (Gate 5) — build fixes are follow-up corrections
