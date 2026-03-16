# Feature Code Review Specialist

> **AUTO-CORRECTION RULE:** The reviewer MUST automatically apply ALL identified corrections. Only finalize when code is 100% correct.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

Coordinator for feature code review. Dispatches specialized reviewers (Frontend + Backend) in parallel, consolidates findings, auto-corrects all violations, verifies build, and outputs structured report to console.

---

## Spec

```json
{"outputs":{"report":"console + docs/features/${FEATURE_ID}/review.md"}}
```

---

## Yolo Mode

If argument contains `--yolo`:
- Skip Pre-Review Setup (STEP 1) — auto-stage all changes
- Do NOT ask for confirmation at any gate
- Auto-correct ALL violations without confirmation
- Execute to completion without human interaction
- Log all auto-decisions in console output

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Pre-Review Setup        → CHECK unstaged, ASK user
STEP 2: Bootstrap Context       → status.sh, load docs, load CLAUDE.md, read changed files
STEP 3: Spec Compliance Audit   → Deep plan.md vs code (BEFORE technical review)
STEP 4: Dispatch Reviewers      → PARALLEL (Frontend + Backend via Task)
STEP 5: Consolidate Findings    → Merge, deduplicate, aggregate, score
STEP 6: Build Verification      → npm run build, fix until passing
<!-- feature:startup-test:step-list -->
<!-- /feature:startup-test:step-list -->
<!-- feature:tdd:step-list -->
<!-- /feature:tdd:step-list -->
STEP 8: Quality Gate Report     → Create review.md + console output
```

**ABSOLUTE PROHIBITIONS:**

```
IF IMPLEMENTATION NOT COMPLETE:
  ⛔ DO NOT USE: Task for reviewer subagents
  ✅ DO: Inform user to complete development first

IF CONTEXT NOT LOADED (STEP 2):
  ⛔ DO NOT USE: Write for spec audit output
  ⛔ DO NOT USE: Task for reviewer subagents
  ✅ DO: Load all feature docs and CLAUDE.md first

IF SPEC AUDIT NOT COMPLETE (STEP 3):
  ⛔ DO NOT USE: Task for reviewer subagents
  ✅ DO: Execute Spec Compliance Audit first

IF BUILD FAILING (after fixes):
  ⛔ DO NOT: Proceed to STEP 7 or STEP 8
  ✅ DO: Fix build errors until 100% passing

IF STARTUP TEST FAILS (exit code 1, non-connection error):
  ⛔ DO NOT USE: Write to create review.md
  ✅ DO: Fix DI/IoC error, re-run startup test

ALWAYS:
  ⛔ DO NOT USE: Bash for git commit
  ⛔ DO NOT: Stage without user permission
```

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
```bash
git add -A
```
Save `STAGED_CHANGES=true` for tracking.

**If user declines (No):**
Proceed with review. Save `STAGED_CHANGES=false`.

**If no unstaged changes:**
Proceed directly. Save `STAGED_CHANGES=false`.

### 1.2 Validate Implementation Complete

**GATE: Implementation must exist.**
- Feature code exists (committed, staged, or unstaged)
- `docs/features/${FEATURE_ID}/about.md` exists
- `docs/features/${FEATURE_ID}/plan.md` exists (recommended)

**IF implementation is NOT complete:**
- DO NOT USE: Task for reviewer subagents
- DO: Inform user and STOP

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
4. `design.md` - UX design (if exists)
5. `iterations.jsonl` - Implementation history (JSONL: what was implemented, pivots, areas touched)
   - Each line: `{"ts":"...","agent":"...","type":"...","slug":"...","what":"...","files":["..."]}`
   - Use to understand: implementation sequence, which areas were modified, any pivots/corrections
   - Cross-reference with changed files to validate completeness
6. `decisions.jsonl` - Pivot decisions (if exists, check for areas with multiple pivots = extra review attention)
7. Parse `PROJECT_PATHS` from script output and read ALL listed files:
   - Files are named by app (SERVER.md, ADMIN.md, CLI.md, etc)
   - DATABASE.md is cross-app
   - These contain implementation patterns to validate against

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

### 2.4 Read ALL Changed Files

From `status.sh` output, read ALL files in `FILES_TO_REVIEW`.

**IMPORTANT:** Review must cover ALL changed files (committed, staged, unstaged, untracked).

**GATE: Context must be fully loaded before dispatching reviewers.**

---

## STEP 3: Spec Compliance Audit (PRD0034 — BEFORE technical review)

**Deep audit of plan.md spec vs implemented code. Catches gaps the code review does not.**

### 3.1 Load Spec Checklist

```
READ docs/features/${FEATURE_ID}/plan.md → section `## Spec Checklist`

IF `## Spec Checklist` EXISTS:
  → Use checklist items as audit source (deterministic)

IF `## Spec Checklist` NOT FOUND:
  → FALLBACK: Extract contracts from plan.md prose:
    - Routes: POST/GET/PUT/DELETE + path patterns
    - Services: Service/Handler/Adapter class definitions
    - DTOs: Dto/Request/Response class definitions
    - Guards: Guard class definitions
    - Queues: queue/processor/worker references
  → Note: "Spec Checklist absent — audit based on prose extraction (less precise)"
```

### 3.2 Execute Audit (ALL areas)

For EACH item in the checklist (or extracted contracts):

```
a. LOCATE implementation with file:line
b. VALIDATE not just existence but BEHAVIOR:
   - Route: exists AND accepts correct params (path variables, query, body)?
   - Service: generic/adapter-based as spec OR hardcoded to specific provider?
   - DTO: has ALL specified fields with correct types?
   - Guard: applied at correct scope?
   - Queue: processes events as described?
c. COMPARE with about.md: does the item satisfy the RF/RN that motivated it?
d. STATUS per item:
   COMPLIANT   — matches spec in name, type, and behavior
   DIVERGENT   — exists but differs from spec (describe exact gap)
   MISSING     — not found in codebase
```

### 3.3 Cross-Reference

```
Do ALL RF/RN from about.md have at least one Spec Checklist item covering them?
  → COVERED:   RF/RN has corresponding checklist item(s)
  → UNCOVERED: RF/RN has no checklist item — potential gap
```

### 3.4 Spec Audit Output

Output the audit as a table with columns: Item, Type, Expected, Found at, Status. Include summary counts (COMPLIANT/DIVERGENT/MISSING), RF/RN coverage, and compute SPEC_AUDIT_STATUS (COMPLIANT | DIVERGENT | INCOMPLETE).

**GATE: SPEC_AUDIT_STATUS MUST be computed before dispatching reviewers.**
- DO NOT USE: Task for reviewer subagents if spec audit not complete
- DO: Include SPEC_AUDIT_STATUS in reviewer prompts as context

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

---

### DISPATCH AGENT: Frontend Reviewer

**Intent:** Review frontend code quality, patterns, and UX implementation for the feature.

```
description: "Review Frontend for ${FEATURE_ID}"
prompt: |
  ## ROLE
  You are the FRONTEND REVIEWER for feature ${FEATURE_ID}.
  Validate frontend code quality, patterns, and UX implementation.

  ## BOOTSTRAP
  1. Run: bash .codeadd/scripts/status.sh
  2. Read ALL files listed in TASK_DOCUMENTS
  3. Read PROJECT_PATHS files matching frontend apps (e.g., ADMIN.md, PORTAL.md)
  4. Read changed files: [list from FILES_TO_REVIEW with apps/frontend/** pattern]
  5. Read skills:
     - .codeadd/skills/add-frontend-development/SKILL.md (PRIMARY)
     - .codeadd/skills/add-code-review/SKILL.md
     - .codeadd/skills/add-ux-design/SKILL.md (if design.md missing)
     - Component refs: shadcn-docs.md, tailwind-v3-docs.md, motion-dev-docs.md, recharts-docs.md, tanstack-table-docs.md, tanstack-query-docs.md (in .codeadd/skills/add-ux-design/)

  ## TASK_DOCUMENTS (read ALL — source of truth)
  ${TASK_DOCUMENTS}

  ## VALIDATION CATEGORIES

  ### 1. Frontend Patterns (from frontend-development skill)
  - [ ] React patterns: Hooks correctness, component composition
  - [ ] State management: Context, store, local state usage
  - [ ] API integration: TanStack Query, error handling
  - [ ] Types: Frontend types mirror backend DTOs
  - [ ] Forms: Validation, error messages

  ### 2. UX Implementation (from design.md or ux-design skill)
  - [ ] Design specs followed (if design.md exists)
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Accessibility (ARIA, keyboard navigation)
  - [ ] Loading states, error states
  - [ ] User feedback (toasts, confirmations)

  ### 3. Code Quality
  - [ ] No `any` types (use explicit types or `unknown`)
  - [ ] No `console.log` (use proper logging if needed)
  - [ ] No dead code or unused imports
  - [ ] No hardcoded values (extract to constants)

  ### 4. Security (Frontend-Specific)
  - [ ] XSS protection: Outputs sanitized
  - [ ] URLs validated before use in href/src
  - [ ] No sensitive data in localStorage (use httpOnly cookies)

  ### 5. Contract Validation
  - [ ] Frontend types match backend DTOs
  - [ ] API calls use correct endpoints
  - [ ] Request/response types align

  ### 6. Project Patterns Validation (if .codeadd/project/*.md exists for frontend apps)
  - [ ] State management follows documented pattern
  - [ ] Component structure follows documented pattern
  - [ ] Styling follows documented pattern
  - [ ] HTTP client follows documented pattern
  Note: Pattern files are named by app (ADMIN.md, PORTAL.md), not FRONTEND.md

  ## RULES
  - NO questions — fix issues automatically
  - Use skill patterns as source of truth
  - If design.md exists, specs are MANDATORY (not optional)
  - Fix ALL violations (no deferrals)
  - DO NOT run build (coordinator will do it)

  ## REPORT FORMAT
  Return: Files Reviewed count, Issues Found by Category (Frontend Patterns, UX, Code Quality, Security, Contracts), Issues Fixed (file:line, severity, description, fix), Files Modified, Severity Summary, Score X/10 (deduct 2 per critical, 1 per high, 0.5 per medium).
```

---

### DISPATCH AGENT: Backend Reviewer

**Intent:** Review backend code quality, architecture, security, database, and product completeness for the feature.

```
description: "Review Backend for ${FEATURE_ID}"
prompt: |
  ## ROLE
  You are the BACKEND REVIEWER for feature ${FEATURE_ID}.
  Validate backend code quality, architecture, security, database, AND product completeness.

  ## BOOTSTRAP
  1. Run: bash .codeadd/scripts/status.sh
  2. Read ALL files listed in TASK_DOCUMENTS
  3. Read PROJECT_PATHS files matching backend apps (e.g., SERVER.md, DATABASE.md)
  4. Read changed files: [list from FILES_TO_REVIEW with apps/backend/** OR libs/** pattern]
  5. Read skills:
     - .codeadd/skills/add-backend-development/SKILL.md (PRIMARY)
     - .codeadd/skills/add-database-development/SKILL.md
     - .codeadd/skills/add-code-review/SKILL.md
     - .codeadd/skills/add-security-audit/SKILL.md
     - .codeadd/skills/add-delivery-validation/SKILL.md

  ## TASK_DOCUMENTS (read ALL — source of truth)
  ${TASK_DOCUMENTS}

  ## VALIDATION CATEGORIES

  ### 1. Project-Specific Patterns (CRITICAL)
  **IoC/DI Configuration:**
  - [ ] Services in module providers
  - [ ] Modules imported in AppModule
  - [ ] Barrel exports complete (entities, repositories, interfaces)

  **RESTful API Compliance:**
  - [ ] Noun-based URLs (no verbs like /getUsers)
  - [ ] POST returns 201 (with @HttpCode decorator)
  - [ ] DELETE returns 204 (with @HttpCode decorator)
  - [ ] Proper HTTP methods for operations

  **DTOs & Validation:**
  - [ ] DTOs with class-validator decorators
  - [ ] Handler methods use DTOs (not raw objects)
  - [ ] Validation enabled globally

  ### 2. Clean Architecture
  - [ ] Domain layer NEVER imports from outer layers
  - [ ] Repositories use domain entities, NOT DTOs
  - [ ] Services use repositories via interfaces
  - [ ] Controllers handle DTOs and call services
  - [ ] No business logic in controllers

  ### 3. SOLID Principles
  - [ ] Single Responsibility: Classes do one thing
  - [ ] Open/Closed: Use Strategy/Factory for extensibility (no switch/if-else chains)
  - [ ] Dependency Inversion: Depend on abstractions (interfaces), not concretions

  ### 4. Database Validation
  **Entities & Migrations:**
  - [ ] New tables have migration in `libs/app-database/migrations/`
  - [ ] Migration has functional `up` and `down`
  - [ ] Kysely types updated in `libs/app-database/src/types/Database.ts`

  **Repository Patterns:**
  - [ ] Repositories use Kysely query builder
  - [ ] No raw SQL strings (use parametrized queries)
  - [ ] No double-parse/stringify for JSONB fields

  **JSONB Validation:**
  - [ ] No `JSON.parse()` on JSONB fields (Kysely auto-parses)
  - [ ] No `JSON.stringify()` before insert (Kysely auto-stringifies)

  ### 5. Security Validation (OWASP)

  **Injection (Critical):**
  - [ ] Queries parametrized (no string concatenation)
  - [ ] Inputs validated with class-validator decorators

  **Authentication (Critical):**
  - [ ] Guards applied to protected routes
  - [ ] JWT tokens not exposed in logs/responses

  **Data Exposure (Critical):**
  - [ ] Credentials encrypted via IEncryptionService
  - [ ] Logs without sensitive data (passwords, tokens, API keys)

  **Access Control (Critical - Multi-Tenancy):**
  - [ ] EVERY query filters by `account_id` (if multi-tenancy in CLAUDE.md)
  - [ ] Ownership validated before operations
  - [ ] `account_id` from JWT (NOT from request body)

  **Configuration (High):**
  - [ ] CORS restricted (not `origin: '*'` in production)
  - [ ] Secrets via environment variables
  - [ ] New env vars documented in `.env.example`

  **XSS (High):**
  - [ ] Outputs sanitized
  - [ ] URLs validated before use

  **Dependencies (High):**
  - [ ] No critical/high vulnerabilities (check with `npm audit` if unsure)

  **Mass Assignment (Medium):**
  - [ ] DTOs explicit (no spread of body)
  - [ ] No direct assignment from request to entity

  ### 6. Code Quality
  - [ ] No `any` types (use explicit types or `unknown`)
  - [ ] Interfaces/Types for complex objects
  - [ ] Function returns typed explicitly
  - [ ] No `console.log` (use injected logger)
  - [ ] No `debugger` statements
  - [ ] No commented code
  - [ ] No unused imports
  - [ ] No magic numbers (use named constants)
  - [ ] No hardcoded URLs/endpoints

  ### 7. Error Handling
  - [ ] Use NestJS exceptions (BadRequestException, NotFoundException, etc.)
  - [ ] Don't return `null` when should throw NotFoundException
  - [ ] Errors with descriptive messages

  ### 8. Contract & Runtime Validation
  - [ ] Backend DTOs mirrored as frontend interfaces
  - [ ] Enums mirrored with same values
  - [ ] Date fields: Date in backend, string in frontend (JSON serialization)

  ### 8.5. Project Patterns Validation (if .codeadd/project/*.md exists)
  - [ ] Logging follows documented pattern (library, format, context)
  - [ ] Validation follows documented pattern (library, DTOs)
  - [ ] Error handling follows documented pattern (base class, HTTP mapping)
  - [ ] Database interaction follows documented pattern (ORM, repository)
  Note: Pattern files are named by app (SERVER.md), not BACKEND.md

  **Database Patterns (from .codeadd/project/DATABASE.md):**
  - [ ] Migrations follow documented pattern (tool, folder, commands)
  - [ ] Connection follows documented pattern

  ### 9. Product Validation (CRITICAL)

  Read `.codeadd/skills/add-delivery-validation/SKILL.md` before validating.

  **For EACH requirement in about.md:**

  **Functional Requirements (RF):**
  - [ ] RF01: [description] → Implementation: [file:line] → status

  **Business Rules (RN):**
  - [ ] RN01: [description] → Logic: [file:line] → status

  **Prerequisites Validation:**
  For each requirement, check if implicit dependencies exist:
  - [ ] Does requirement assume data/fields exist? Verify entity has them.
  - [ ] Does requirement assume another feature exists? Verify endpoint/component exists.
  - [ ] Does requirement assume configuration? Verify env vars/config exists.

  **Product Status:**
  - If ALL requirements implemented AND prerequisites OK → PASSED
  - If ANY requirement missing OR prerequisite missing → BLOCKED

  ## RULES
  - NO questions — fix issues automatically
  - Use skill patterns as source of truth
  - Missing components from plan.md = CRITICAL violation
  - Missing prerequisites = CRITICAL (report, don't assume)
  - Fix ALL code violations (no deferrals)
  - For missing requirements: REPORT (cannot auto-fix product scope)
  - DO NOT run build (coordinator will do it)

  ## REPORT FORMAT
  Return: Files Reviewed count, Issues Found by Category (Project Patterns, Architecture, Database, Security, Code Quality, Contracts), Issues Fixed (file:line, severity, description, fix), Files Modified, Severity Summary, Product Validation (RF status, RN status, Prerequisites), Product Status (PASSED/BLOCKED), Score X/10 (deduct 2 per critical, 1 per high, 0.5 per medium, MINUS 5 if product BLOCKED).
```

---

## STEP 5: Consolidate Findings

### 5.1 Process Reviewer Outputs

**GATE: ALL reviewers must return before proceeding.**

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

**GATE: Do NOT proceed to STEP 7 until build passes 100%.**

<!-- feature:startup-test:step -->
<!-- /feature:startup-test:step -->

---

## STEP 7.5: Log Iteration (IF corrections applied)

**IF files were modified during review (auto-corrections):**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "fix" "/check" '"slug":"code-review","what":"Auto-corrected violations from review","files":["<list of modified files>"]'
```

⛔ DO NOT: Skip iteration logging if files were modified during review.

---

## STEP 8: Quality Gate Report (PRD0034)

**Consolidate all gates into review.md. This file is the merge prerequisite for /add.ship.**

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
<!-- feature:startup-test:quality-gate -->
<!-- /feature:startup-test:quality-gate -->
| **Overall** | **✅ PASSED / ❌ BLOCKED** | **Ready for merge / Issues found** |

> Reviewed at: ${TIMESTAMP}
> Reviewed by: /add.check (model: ${MODEL})
```

**Overall = PASSED** only if ALL gates are PASSED or SKIPPED.
**Overall = BLOCKED** if ANY gate is BLOCKED.

### 8.2 Write review.md

```
WRITE docs/features/${FEATURE_ID}/review.md

Content:
# Review: ${FEATURE_ID}

> **Date:** ${TODAY} | **Branch:** ${BRANCH_NAME}

## Quality Gate Report
[table from 8.1]

## Spec Compliance Audit
[output from STEP 3.4]

## Code Review Summary
[aggregated findings from STEP 5]

## Product Validation
[RF/RN status from Backend Reviewer]
```

**GATE: review.md MUST be written before outputting console report.**
- DO NOT: Output console report if review.md write failed
- DO: Write review.md FIRST, then console

### 8.3 Console Output

Output quality gate summary including: reviewers dispatched (files reviewed per reviewer), issues found/fixed with severity breakdown, spec compliance status, product validation (RF/RN/prerequisites), scores (frontend/backend/overall), gate statuses table, link to review.md, list of modified files, and next steps (add.ship if PASSED, fix + re-check if BLOCKED).

---

## Rules

ALWAYS:
- Check unstaged changes and ask user before staging
- Load all feature docs and CLAUDE.md before dispatching reviewers
- Auto-fix all violations without deferrals
- Verify build passes after applying fixes
- Output report to console only
- Track STAGED_CHANGES flag throughout execution

NEVER:
- Create review.md or any documentation files
- Use Bash for git commit operations
- Stage files without explicit user permission
- Skip product validation for RF, RN, or prerequisites
- Proceed to report if build is failing
- Leave code in a non-compiling state
- Accept "it works" as justification for violations
- Skip a reviewer if files exist in that area
