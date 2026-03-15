<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/commands/add-review.md -->
---
name: add-review
description: Feature code review specialist with auto-correction until 100% correct
---

# Feature Code Review Specialist

> **AUTO-CORRECTION RULE:** The reviewer MUST automatically apply ALL identified corrections. Only finalize when code is 100% correct.

Coordinator for feature code review. Dispatches specialized reviewers (Frontend + Backend) in parallel, consolidates findings, auto-corrects all violations, verifies build, and outputs structured report to console.

---

## Spec

```json
{"gates":["implementation_complete","feature_docs_exist","context_loaded","spec_audit_complete","reviewers_complete","build_passing","startup_check_passed_or_skipped"],"order":["pre_review_setup","bootstrap_context","spec_compliance_audit","dispatch_reviewers","consolidate_findings","build_verification","startup_test","quality_gate_report"],"outputs":{"report":"console + docs/features/${FEATURE_ID}/review.md"}}
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
STEP 8: Quality Gate Report     → Create review.md + console output
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF IMPLEMENTATION NOT COMPLETE:
  ⛔ DO NOT USE: Task for reviewer subagents
  ⛔ DO: Inform user to complete development first

IF CONTEXT NOT LOADED (STEP 2):
  ⛔ DO NOT USE: Write for spec audit output
  ⛔ DO NOT USE: Task for reviewer subagents
  ⛔ DO: Load all feature docs and CLAUDE.md first

IF SPEC AUDIT NOT COMPLETE (STEP 3):
  ⛔ DO NOT USE: Task for reviewer subagents
  ⛔ DO: Execute Spec Compliance Audit first

IF BUILD FAILING (after fixes):
  ⛔ DO NOT: Proceed to STEP 7 or STEP 8
  ⛔ DO: Fix build errors until 100% passing

IF STARTUP TEST FAILS (exit code 1, non-connection error):
  ⛔ DO NOT USE: Write to create review.md
  ⛔ DO: Fix DI/IoC error, re-run startup test

ALWAYS:
  ⛔ DO NOT USE: Bash for git commit
  ⛔ DO NOT: Stage without user permission
```

---

## Model Selection

**All reviewers use:** `sonnet`

Review requires complex reasoning about architecture, security, and business logic. Sonnet provides the best balance of quality and cost for code review tasks.

---

## STEP 1: Pre-Review Setup

### 1.1 Check for Unstaged Changes

```bash
git status --porcelain
```

**If there are unstaged changes (lines starting with ` M`, `??`, etc.):**

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

**⛔ GATE: Implementation must exist.**
- Feature code exists (committed, staged, or unstaged)
- `docs/features/${FEATURE_ID}/about.md` exists
- `docs/features/${FEATURE_ID}/plan.md` exists (recommended)

**IF implementation is NOT complete:**
- ⛔ DO NOT USE: Task for reviewer subagents
- ⛔ DO: Inform user and STOP

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

```bash
ls -la "docs/features/${FEATURE_ID}/"
```

**Load ALL documents IN ORDER:**
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

```bash
cat CLAUDE.md
```

**Extract from specification:**
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

**⛔ GATE: Context must be fully loaded before dispatching reviewers.**

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
    - Routes: grep for POST/GET/PUT/DELETE + path patterns
    - Services: grep for Service/Handler/Adapter class definitions
    - DTOs: grep for Dto/Request/Response class definitions
    - Guards: grep for Guard class definitions
    - Queues: grep for queue/processor/worker references
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
   ✅ COMPLIANT   — matches spec in name, type, and behavior
   ⚠️ DIVERGENT   — exists but differs from spec (describe exact gap)
   ❌ MISSING     — not found in codebase
```

### 3.3 Cross-Reference

```
Do ALL RF/RN from about.md have at least one Spec Checklist item covering them?
  → COVERED:   RF/RN has corresponding checklist item(s)
  → UNCOVERED: RF/RN has no checklist item — potential gap
```

### 3.4 Spec Audit Output

```
## Spec Compliance Audit

**Source:** [Spec Checklist | Prose extraction]
**Total items:** X

| Item | Type | Expected | Found at | Status |
|------|------|----------|----------|--------|
| Route: POST /billing/webhook/:provider | Route | WebhookController | POST /webhook (fixed) | ⚠️ DIVERGENT |
| Service: WebhookNormalizerService | Service | generic, provider-agnostic | StripeWebhookService | ❌ MISSING |
| DTO: WebhookEventDto {provider,payload,signature} | DTO | 3 fields | WebhookDto {payload} | ⚠️ DIVERGENT |

**COMPLIANT:** X/Y
**DIVERGENT:** X/Y — [list with exact gaps]
**MISSING:** X/Y — [list]

**RF/RN Coverage:**
- RF01: ✅ covered by [item]
- RF02: ⚠️ no Spec Checklist item

**SPEC_AUDIT_STATUS:** COMPLIANT | DIVERGENT | INCOMPLETE
```

**⛔ GATE: SPEC_AUDIT_STATUS MUST be computed before dispatching reviewers.**
- ⛔ DO NOT USE: Task for reviewer subagents if spec audit not complete
- ✅ DO: Include SPEC_AUDIT_STATUS in reviewer prompts as context

---

## STEP 4: Dispatch Specialized Reviewers (PARALLEL)

### 4.1 Detect Scope

Based on changed files, determine which reviewers to dispatch:

```json
{
  "frontend": "apps/frontend/** detected",
  "backend": "apps/backend/** OR libs/** detected"
}
```

### 4.2 Dispatch Strategy

**If BOTH frontend and backend files exist:**
- Dispatch BOTH reviewers in PARALLEL (single message, multiple Task calls)

**If only ONE area exists:**
- Dispatch single reviewer

**Always wait for ALL reviewers to complete before proceeding.**

---

### Frontend Reviewer

**Dispatch with Task tool:**

```
description: "Review Frontend for ${FEATURE_ID}"
model: "sonnet"
subagent_type: "general-purpose"
prompt: |
  ## ROLE
  You are the FRONTEND REVIEWER for feature ${FEATURE_ID}.
  Your job is to validate frontend code quality, patterns, and UX implementation.

  ## TASK_DOCUMENTS (read ALL before reviewing — source of truth)
  ${TASK_DOCUMENTS}

  ## MANDATORY: Load Context (FIRST STEP)
  Execute BEFORE any validation:

  1. Run: bash .codeadd/scripts/status.sh
  2. Read ALL files listed in TASK_DOCUMENTS above
  3. Parse PROJECT_PATHS from script output and read relevant files:
     - Read files matching frontend apps you're reviewing (e.g., ADMIN.md, PORTAL.md)
     - Files are named by app, not by type
  4. Read changed files: [list from FILES_TO_REVIEW with apps/frontend/** pattern]

  ## SKILLS (MANDATORY)
  Read BEFORE reviewing:
  - .codeadd/skills/frontend-development/SKILL.md (PRIMARY - types, hooks, state, API)
  - .codeadd/skills/code-review/SKILL.md (validation patterns)
  - .codeadd/skills/ux-design/SKILL.md (if design.md missing or for implementation details)

  Reference for specific components:
  - shadcn: .codeadd/skills/ux-design/shadcn-docs.md
  - Tailwind: .codeadd/skills/ux-design/tailwind-v3-docs.md
  - Motion: .codeadd/skills/ux-design/motion-dev-docs.md
  - Charts: .codeadd/skills/ux-design/recharts-docs.md
  - Tables: .codeadd/skills/ux-design/tanstack-table-docs.md
  - Query: .codeadd/skills/ux-design/tanstack-query-docs.md

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

  ## TASK
  1. Read ALL frontend files from FILES_TO_REVIEW
  2. Validate against all categories above
  3. AUTO-FIX all violations found
  4. Document issues found and fixes applied

  ## RULES
  - NO questions - fix issues automatically
  - Use skill patterns as source of truth
  - If design.md exists, specs are MANDATORY (not optional)
  - Fix ALL violations (no deferrals)
  - DO NOT run build (coordinator will do it)

  ## REPORT FORMAT
  Return structured report:

  ### Frontend Review Report

  **Files Reviewed:** [count]

  **Issues Found by Category:**
  - Frontend Patterns: [count]
  - UX Implementation: [count]
  - Code Quality: [count]
  - Security: [count]
  - Contracts: [count]

  **Issues Fixed:**
  [List each issue with: file:line, severity (🔴🟡🟠🟢), description, fix applied]

  **Files Modified:**
  [List all files modified during fixes]

  **Severity Summary:**
  - 🔴 Critical: [count] fixed
  - 🟡 High: [count] fixed
  - 🟠 Medium: [count] fixed
  - 🟢 Low: [count] fixed

  **Score:** [X/10] (deduct 2 points per critical, 1 per high, 0.5 per medium)
```

---

### Backend Reviewer

**Dispatch with Task tool:**

```
description: "Review Backend for ${FEATURE_ID}"
model: "sonnet"
subagent_type: "general-purpose"
prompt: |
  ## ROLE
  You are the BACKEND REVIEWER for feature ${FEATURE_ID}.
  Your job is to validate backend code quality, architecture, security, database, AND product completeness.

  ## TASK_DOCUMENTS (read ALL before reviewing — source of truth)
  ${TASK_DOCUMENTS}

  ## MANDATORY: Load Context (FIRST STEP)
  Execute BEFORE any validation:

  1. Run: bash .codeadd/scripts/status.sh
  2. Read ALL files listed in TASK_DOCUMENTS above
  3. Parse PROJECT_PATHS from script output and read relevant files:
     - Read files matching backend apps you're reviewing (e.g., SERVER.md)
     - DATABASE.md is cross-app, always read if database work
     - Files are named by app, not by type
  4. Read changed files: [list from FILES_TO_REVIEW with apps/backend/** OR libs/** pattern]

  ## SKILLS (MANDATORY)
  Read BEFORE reviewing:
  - .codeadd/skills/backend-development/SKILL.md (PRIMARY - Clean Arch, RESTful, IoC/DI, DTOs, CQRS)
  - .codeadd/skills/database-development/SKILL.md (Entities, Migrations, Kysely, Repositories)
  - .codeadd/skills/code-review/SKILL.md (validation patterns, contracts)
  - .codeadd/skills/security-audit/SKILL.md (OWASP, multi-tenancy)
  - .codeadd/skills/delivery-validation/SKILL.md (product validation)

  ## VALIDATION CATEGORIES

  ### 1. Project-Specific Patterns (CRITICAL)
  **IoC/DI Configuration:**
  ```bash
  # Check module imports
  cat apps/backend/src/api/app.module.ts | grep -E "imports:"

  # Check barrel exports
  cat libs/app-database/src/repositories/index.ts
  cat libs/app-database/src/interfaces/index.ts
  cat libs/domain/src/entities/index.ts
  cat libs/domain/src/enums/index.ts
  ```
  - [ ] Services in module providers
  - [ ] Modules imported in AppModule
  - [ ] Barrel exports complete (entities, repositories, interfaces)

  **RESTful API Compliance:**
  ```bash
  # Find verbs in routes (anti-pattern)
  grep -rE "@(Get|Post|Put|Patch|Delete)\(['\"].*?(get|create|update|delete)" apps/backend/src --include="*.controller.ts"

  # Check HttpCode usage
  grep -rE "@HttpCode" apps/backend/src --include="*.controller.ts"
  ```
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
  ```bash
  # Check for JSONB misuse
  grep -rE "JSON\.(parse|stringify)" libs/app-database/src --include="*.ts"
  ```
  - [ ] No `JSON.parse()` on JSONB fields (Kysely auto-parses)
  - [ ] No `JSON.stringify()` before insert (Kysely auto-stringifies)

  ### 5. Security Validation (OWASP)

  **Injection (🔴 Critical):**
  - [ ] Queries parametrized (no string concatenation)
  - [ ] Inputs validated with class-validator decorators

  **Authentication (🔴 Critical):**
  - [ ] Guards applied to protected routes
  - [ ] JWT tokens not exposed in logs/responses

  **Data Exposure (🔴 Critical):**
  - [ ] Credentials encrypted via IEncryptionService
  - [ ] Logs without sensitive data (passwords, tokens, API keys)

  **Access Control (🔴 Critical - Multi-Tenancy):**
  - [ ] EVERY query filters by `account_id` (if multi-tenancy in CLAUDE.md)
  - [ ] Ownership validated before operations
  - [ ] `account_id` from JWT (NOT from request body)

  **Configuration (🟡 High):**
  - [ ] CORS restricted (not `origin: '*'` in production)
  - [ ] Secrets via environment variables
  - [ ] New env vars documented in `.env.example`

  **XSS (🟡 High):**
  - [ ] Outputs sanitized
  - [ ] URLs validated before use

  **Dependencies (🟡 High):**
  - [ ] No critical/high vulnerabilities (check with `npm audit` if unsure)

  **Mass Assignment (🟠 Medium):**
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
  **Backend ↔ Frontend Contracts:**
  ```bash
  # Check backend DTOs
  grep -rE "export (class|interface) \w+(Dto|Response)" apps/backend/src --include="*.ts"

  # Compare with frontend types
  ls apps/frontend/src/types/
  ```
  - [ ] Backend DTOs mirrored as frontend interfaces
  - [ ] Enums mirrored with same values
  - [ ] Date fields: Date in backend, string in frontend (JSON serialization)

  ### 8.5. Project Patterns Validation (if .codeadd/project/*.md exists)
  **Backend Patterns (from .codeadd/project/[APP_NAME].md):**
  - [ ] Logging follows documented pattern (library, format, context)
  - [ ] Validation follows documented pattern (library, DTOs)
  - [ ] Error handling follows documented pattern (base class, HTTP mapping)
  - [ ] Database interaction follows documented pattern (ORM, repository)
  Note: Pattern files are named by app (SERVER.md), not BACKEND.md

  **Database Patterns (from .codeadd/project/DATABASE.md):**
  - [ ] Migrations follow documented pattern (tool, folder, commands)
  - [ ] Connection follows documented pattern

  ### 9. Product Validation (CRITICAL)

  **Load Delivery Validation Skill:**
  ```bash
  cat .codeadd/skills/delivery-validation/SKILL.md
  ```

  **For EACH requirement in about.md:**

  **Functional Requirements (RF):**
  - [ ] RF01: [description] → Implementation: [file:line] → ✅/❌
  - [ ] RF02: [description] → Implementation: [file:line] → ✅/❌
  - [ ] ...

  **Business Rules (RN):**
  - [ ] RN01: [description] → Logic: [file:line] → ✅/❌
  - [ ] RN02: [description] → Logic: [file:line] → ✅/❌
  - [ ] ...

  **Prerequisites Validation:**
  For each requirement, check if implicit dependencies exist:
  - [ ] Does requirement assume data/fields exist? Verify entity has them.
  - [ ] Does requirement assume another feature exists? Verify endpoint/component exists.
  - [ ] Does requirement assume configuration? Verify env vars/config exists.

  **Example:**
  ```
  RF01: "Verificar tier do produto antes de baixar"

  Prerequisites:
  - [ ] Campo `tier` existe em Product entity? → Check entity
  - [ ] Tier é atribuído em algum fluxo? → Check endpoints
  - [ ] Dados de tier populados? → Make sense
  ```

  **Product Status:**
  - If ALL requirements implemented AND prerequisites OK → ✅ PASSED
  - If ANY requirement missing OR prerequisite missing → ❌ BLOCKED

  ## TASK
  1. Read ALL backend/database files from FILES_TO_REVIEW
  2. Validate against all categories above (1-9)
  3. Execute Product Validation (category 9) LAST
  4. AUTO-FIX all violations found (EXCEPT missing requirements - report those)
  5. Document issues found and fixes applied

  ## RULES
  - NO questions - fix issues automatically
  - Use skill patterns as source of truth
  - Missing components from plan.md = CRITICAL violation
  - Missing prerequisites = CRITICAL (report, don't assume)
  - Fix ALL code violations (no deferrals)
  - For missing requirements: REPORT (cannot auto-fix product scope)
  - DO NOT run build (coordinator will do it)

  ## REPORT FORMAT
  Return structured report:

  ### Backend Review Report

  **Files Reviewed:** [count]

  **Issues Found by Category:**
  - Project Patterns (IoC/RESTful/DTOs): [count]
  - Architecture: [count]
  - Database: [count]
  - Security: [count]
  - Code Quality: [count]
  - Contracts: [count]

  **Issues Fixed:**
  [List each issue with: file:line, severity (🔴🟡🟠🟢), description, fix applied]

  **Files Modified:**
  [List all files modified during fixes]

  **Severity Summary:**
  - 🔴 Critical: [count] fixed
  - 🟡 High: [count] fixed
  - 🟠 Medium: [count] fixed
  - 🟢 Low: [count] fixed

  **Product Validation:**

  RF Implemented:
  - RF01: [description] → ✅/❌ [file:line or reason if missing]
  - RF02: [description] → ✅/❌ [file:line or reason if missing]
  - ...

  RN Implemented:
  - RN01: [description] → ✅/❌ [file:line or reason if missing]
  - RN02: [description] → ✅/❌ [file:line or reason if missing]
  - ...

  Prerequisites:
  - ✅/❌ [list prerequisites checked and status]

  **Product Status:** ✅ PASSED / ❌ BLOCKED
  **Product Issues:** [list missing requirements/prerequisites if BLOCKED]

  **Score:** [X/10] (deduct 2 points per critical, 1 per high, 0.5 per medium, MINUS 5 if product BLOCKED)
```

---

## STEP 5: Consolidate Findings

### 5.1 Process Reviewer Outputs

**⛔ GATE: ALL reviewers must return before proceeding.**

**After ALL reviewers return:**

1. **Merge findings:**
   - Combine issues from Frontend + Backend reviewers
   - Deduplicate if same issue reported by multiple reviewers

2. **Aggregate metrics:**
   - Total files reviewed
   - Total issues found/fixed
   - Severity breakdown (🔴🟡🟠🟢)
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

**⛔ GATE: Do NOT proceed to STEP 7 until build passes 100%.**

<!-- feature:startup-test:step -->
<!-- /feature:startup-test:step -->

---

## STEP 8: Quality Gate Report (PRD0034)

**Consolidate all gates into review.md. This file is the merge prerequisite for /add-done.**

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
> Reviewed by: /add-review (model: ${MODEL})
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

**⛔ GATE: review.md MUST be written before outputting console report.**
- ⛔ DO NOT: Output console report if review.md write failed
- ✅ DO: Write review.md FIRST, then console

### 8.3 Console Output

```markdown
✅ Review Complete - Feature ${FEATURE_ID}

📊 Execution Summary:

**Reviewers:**
- Frontend Reviewer: ${FRONTEND_FILES_REVIEWED} files
- Backend Reviewer: ${BACKEND_FILES_REVIEWED} files

**Analysis:**
- Total files reviewed: ${TOTAL_FILES}
- Total issues found: ${TOTAL_ISSUES}
- Total issues fixed: ${TOTAL_FIXED}

**Spec Compliance:**
- Status: ${SPEC_AUDIT_STATUS}
- Items: ${COMPLIANT}/${TOTAL} COMPLIANT, ${DIVERGENT} DIVERGENT, ${MISSING} MISSING

**Issues by Severity:**
- 🔴 Critical: ${CRITICAL_COUNT} fixed
- 🟡 High: ${HIGH_COUNT} fixed
- 🟠 Medium: ${MEDIUM_COUNT} fixed
- 🟢 Low: ${LOW_COUNT} fixed

**Product Validation:**
- RF implemented: ${RF_IMPLEMENTED}/${RF_TOTAL}
- RN implemented: ${RN_IMPLEMENTED}/${RN_TOTAL}
- Prerequisites: ✅ OK
- Status: ✅ PASSED

**Scores:**
- Frontend: ${FRONTEND_SCORE}/10
- Backend: ${BACKEND_SCORE}/10
- **Overall: ${OVERALL_SCORE}/10**

**Quality Gates:**
| Gate | Status |
|------|--------|
| Build | ✅ / ❌ |
| Spec Compliance | ✅ / ⚠️ / ❌ |
| Code Review | ✅ / ❌ |
| Product Validation | ✅ / ❌ |
| Startup Test | ✅ / ⚠️ SKIPPED / ❌ |
| **Overall** | **✅ PASSED / ❌ BLOCKED** |

**📄 Quality Gate Report:** docs/features/${FEATURE_ID}/review.md
**🔧 Corrections Applied (unstaged):** ${LIST_OF_MODIFIED_FILES}

**📄 View corrections:** git diff
**📌 Accept corrections:** git add .

**Next Steps:**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
- If review PASSED → `/add-done`
- If review BLOCKED → fix issues, then `/add-review` again
```

### Blocked Console Report

```markdown
⚠️ Review Partial - Feature ${FEATURE_ID}

**Quality Gates:**
| Gate | Status | Details |
|------|--------|---------|
| Build | ✅ PASSED | |
| Spec Compliance | ❌ BLOCKED | Route /webhook diverges from spec /webhook/:provider |
| Code Review | ✅ PASSED | 8.5/10 |
| Product Validation | ❌ BLOCKED | RF03 not implemented |
| Startup Test | ✅ PASSED | |
| **Overall** | **❌ BLOCKED** | |

**Required Actions:**
1. Fix DIVERGENT: refactor POST /webhook → POST /webhook/:provider
2. Implement RF03: [description]
3. Run /add-review again after corrections

**📄 Report saved:** docs/features/${FEATURE_ID}/review.md
```

---

## Rules

ALWAYS:
- Check unstaged changes and ask user before staging
- Load all feature docs and CLAUDE.md before dispatching reviewers
- Dispatch Frontend and Backend reviewers in parallel
- Wait for all reviewers to complete before consolidating
- Auto-fix all violations without deferrals
- Verify build passes after applying fixes
- Output report to console only
- Track STAGED_CHANGES flag throughout execution

NEVER:
- Create review.md or any documentation files
- Use Bash for git commit operations
- Stage files without explicit user permission
- Dispatch reviewers sequentially instead of parallel
- Skip product validation for RF, RN, or prerequisites
- Proceed to report if build is failing
- Leave code in a non-compiling state
- Accept "it works" as justification for violations
- Skip a reviewer if files exist in that area

---

## Quick Reference: Review Checklist

**Before starting:**
- [ ] Feature implemented? (code exists)
- [ ] Feature docs exist? (about.md, plan.md)

**STEP 1: Setup**
- [ ] Check for unstaged changes
- [ ] Ask user if can stage (if unstaged exists)
- [ ] Stage if user agrees, track STAGED_CHANGES

**STEP 2: Bootstrap**
- [ ] Feature ID detected
- [ ] Docs loaded (about, discovery, plan, design if exists)
- [ ] CLAUDE.md loaded
- [ ] Changed files identified

**STEP 3: Spec Compliance Audit**
- [ ] Spec Checklist loaded (or prose extraction fallback)
- [ ] All items audited (file:line, behavior validation)
- [ ] RF/RN cross-reference complete
- [ ] SPEC_AUDIT_STATUS computed

**STEP 4: Reviewers**
- [ ] Frontend Reviewer dispatched (if frontend files)
- [ ] Backend Reviewer dispatched (if backend files)
- [ ] Dispatched in PARALLEL
- [ ] SPEC_AUDIT_STATUS included in reviewer context

**STEP 5: Consolidate**
- [ ] Findings merged
- [ ] Metrics aggregated
- [ ] Overall score calculated

**STEP 6: Build**
- [ ] Build passes ✅
- [ ] All issues fixed

**STEP 7: Startup Test**
- [ ] start:test script exists (created if not)
- [ ] npm run start:test → exit 0 (or SKIPPED if connection error)

**STEP 8: Quality Gate Report**
- [ ] review.md written to docs/features/${FEATURE_ID}/review.md
- [ ] Overall status computed (PASSED / BLOCKED)
- [ ] Console report output with gate summary

---

## Skills Reference

- **Code Review:** `.codeadd/skills/code-review/SKILL.md`
- **Delivery Validation:** `.codeadd/skills/delivery-validation/SKILL.md`
- **Backend Development:** `.codeadd/skills/backend-development/SKILL.md`
- **Database Development:** `.codeadd/skills/database-development/SKILL.md`
- **Frontend Development:** `.codeadd/skills/frontend-development/SKILL.md`
- **UX Design:** `.codeadd/skills/ux-design/SKILL.md`
- **Security Audit:** `.codeadd/skills/security-audit/SKILL.md`
