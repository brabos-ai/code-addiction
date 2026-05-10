---
name: add-code-review
description: 'Code review: IoC, RESTful, Contracts, Security (OWASP), Clean Architecture, SOLID.'
---

# Code Review

Skill for validating implemented code against project standards.

**Use for:** Validate code, identify violations, auto-fix (autopilot)
**Do not use for:**

- Implementing new features (use `add-backend-development` / `add-frontend-development`)
- Planning or specifying work (use `add-planning` / `add-feature-specification`)
- Codebase discovery or architecture analysis (use `add-feature-discovery` / `add-architecture-discovery`)

**Reference:** Always consult `CLAUDE.md` for general project standards.

---

## MANDATORY RULE: TodoWrite

**BEFORE starting any review, you MUST create a todo list using TodoWrite.**

The code-review agent MUST create todos for each validation category and for each changed file. This ensures:

1. Progress visibility for the user
2. No validation is forgotten
3. Traceability of fixes

---

## Reference Skills

**Load BEFORE reviewing:**

- Backend: `{{skill:add-backend-development/SKILL.md}}`
- Database: `{{skill:add-database-development/SKILL.md}}`
- Frontend (Code): `{{skill:add-frontend-development/SKILL.md}}`
- Frontend (UI): `{{skill:add-ux-design/SKILL.md}}`
- Security: `{{skill:add-security-audit/SKILL.md}}`

---

## Validation Categories

### 1. Spec Compliance (CRITICAL)

**Spec vs implementation gap = the root cause of features that "pass review" but diverge from what was planned.**

Sources (lookup):

{"sources":{"contracts":"docs/features/${FEATURE_ID}/plan.md (prose: routes, services, DTOs, queues)","tick_state":"docs/features/${FEATURE_ID}/tasks.md → ## Acceptance Checklist"}}

Validation procedure:

1. READ contracts from `plan.md` prose (routes, services, DTOs, queues)
2. READ tick state from `tasks.md → ## Acceptance Checklist` (each item ends with `(RFNN/RNNN)` reference)
3. For EACH contract item:
   1. Locate implementation with `file:line`
   2. Validate EXISTENCE and BEHAVIOR:
      - Route exists AND accepts correct params?
      - Service is generic as spec OR hardcoded?
      - DTO has all specified fields?
   3. Cross-reference: do items cover ALL `RF/RN` from `about.md`?
   4. Status: `COMPLIANT` | `DIVERGENT` (exists but differs) | `MISSING`

Examples:

| Type | Spec | Code | Fix |
|---|---|---|---|
| DIVERGENT | `POST /billing/webhook/:provider` | `POST /webhook` (fixed route) | Refactor route to accept `:provider` param |
| DIVERGENT | `WebhookNormalizerService` (generic) | `StripeWebhookService` (hardcoded) | Extract generic interface, rename service |
| MISSING | `WebhookSignatureGuard` | No guard found | Implement guard or document explicit scope exclusion |

Spec Compliance scoring:

- `COMPLIANT` (all items match): full points
- `DIVERGENT` (functional but differs): -1 per item
- `MISSING` (not implemented): -2 per item, blocks merge if `RF`-linked

---

### 2. Architecture Contract (MOST CRITICAL)

**Architecture violation = CRITICAL BLOCKER. Fix BEFORE any other validation.**

Source: `CLAUDE.md → ## Architecture Contract`.

Validation steps:

For EACH new/modified file:

1. Identify the file's layer/package
2. Grep imports of `@org/*` (or project alias)
3. Verify against Import rules from the contract
4. Verify the artefact is in the correct package (Placement)

Examples:

| Violation | Fix |
|---|---|
| `interfaces` imports `database` | Move artefact or adjust import |
| Service-contract DTO in `database` | Move DTO to `interfaces` |
| `domain` imports anything | Remove import — `domain` has zero deps |

---

### 3. IoC Configuration (CRITICAL)

**Code without correct IoC does NOT work at runtime.**

#### Checklist by component type (lookup)

{"iocChecklist":{"Service":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":false},"Repository":{"decorator":"@Injectable()","providers":"db module","exports":"db module","controllers":false,"indexTs":"libs/"},"Handler":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":"NEVER"},"Guard":{"decorator":"@Injectable()","providers":"feature/global","exports":false,"controllers":false,"indexTs":false},"Controller":{"decorator":"@Controller()","providers":false,"exports":false,"controllers":"feature module","indexTs":false}}}

#### Files to verify for IoC

| File | Check |
|---|---|
| `apps/backend/src/app.module.ts` | `imports[]` contains module |
| `[feature].module.ts` | `providers[]`, `controllers[]`, `imports[]` |
| `libs/app-database/src/app-database.module.ts` | `providers[]`, `exports[]` for repos |
| `libs/app-database/src/index.ts` | public repo exports |
| `libs/app-database/src/types/Database.ts` | new table types |
| `libs/domain/src/index.ts` | new entity/enum exports |

#### Common IoC Errors

| Error | Cause | Fix |
|---|---|---|
| `Nest can't resolve dependencies of X` | `X` not in `providers[]` or `X`'s dependency not registered | Add `X` and its dependencies to `providers[]` |
| `X is not a provider` | Missing `@Injectable()` or not registered | Add decorator and register in `providers[]` |
| `Module X not found` | Module not imported in `AppModule` | Add to `AppModule.imports[]` |
| `Repository not found` | Repo not exported in db module `exports[]` | Add to `AppDatabaseModule` `exports[]` |
| 404 on endpoint | Controller not registered or module not imported | Check `controllers[]` and `AppModule.imports[]` |

---

### 4. RESTful Compliance (CRITICAL)

| Rule | Correct | Wrong |
|---|---|---|
| HTTP method | GET read, POST create, DELETE remove | POST for read |
| URL | `/users` (noun) | `/getUsers` (verb) |
| Status | 201 POST, 204 DELETE | 200 for all |

---

### 5. Contract Validation (CRITICAL)

Frontend ↔ Backend:

| Backend | Frontend |
|---|---|
| `Date` | `string` |
| `Enum` | union type |

Sync `required` / `optional` fields between backend and frontend.

JSONB rules:

- NO double parse
- NO double stringify
- Kysely handles automatically

---

### 6. Security (OWASP)

| Category | Check |
|---|---|
| Injection | parametrized queries |
| Auth | guards applied |
| Data Exposure | no secrets in logs |
| Access Control | filter by `account_id` |
| XSS | outputs sanitized |

Multi-tenant:

- EVERY query filters `account_id`
- `account_id` from JWT, not body

---

### 7. SOLID Principles

- **SRP:** one class, one responsibility
- **OCP:** open for extension, closed for modification
- **LSP:** subtypes substitutable
- **ISP:** specific interfaces over general
- **DIP:** depend on abstractions

---

### 8. Code Quality

- No `any` type
- DTOs follow naming
- No `console.log` (use logger)
- No commented code
- No unused imports
- Exception handling

---

### 9. Database

- Migration created
- Has `up` and `down`
- Kysely types updated
- Entity exported
- Repository exported

---

### 10. Environment

- New vars in `.env.example`
- Example values not real
- Use `IConfigurationService`, not `process.env`

---

## Score

Weights and status (lookup):

{"weights":{"specCompliance":20,"archContract":20,"ioc":15,"restful":10,"contracts":15,"security":15,"solid":10,"quality":10,"database":5}}
{"status":{"8-10":"APPROVED","6-7":"NEEDS ATTENTION","4-5":"NEEDS FIXES","0-3":"CRITICAL"}}

---

## Process

### Phase 1: Load Context & Create Todos

1. `bash .codeadd/scripts/status.sh`
2. Read reference skills (backend, database, frontend, security)
3. Read `CLAUDE.md`
4. Identify ALL changed files
5. Create TodoWrite (see MANDATORY RULE) covering each validation category and changed file

### Phase 2: Validate

For EACH changed file, validate in order, marking each todo `in_progress` → `completed`:

1. **Spec Compliance** — see §1
2. **Architecture Contract** — see §2 (CRITICAL BLOCKER if violated; fix before continuing)
3. **IoC Configuration** — see §3
4. **RESTful Compliance** — see §4
5. **Contract Validation** — see §5
6. **Security (OWASP)** — see §6
7. **SOLID Principles** — see §7
8. **Code Quality** — see §8
9. **Database** — see §9

### Phase 3: Fix (autopilot)

1. For each issue found:
   - Create specific todo: "Fix [issue] in [file]"
   - Mark as `in_progress`
   - Apply fix
   - Mark as `completed`
2. Verify build compiles
3. Document before/after

### Phase 4: Report

Generate the review report at `docs/features/${featureId}/review.md`. The exact output template (score table, issue format, build status) is owned by the consuming command (`add.review`) — this skill validates; the command formats.

---

## Rules

**Do:**

- Create TodoWrite BEFORE starting review and update it during each phase
- Load reference skills BEFORE review
- Run `status.sh` FIRST
- Auto-fix in autopilot
- Verify build
- Document before/after

**Don't:**

- Start review without creating TodoWrite
- Skip Architecture Contract validation (MOST critical)
- Skip IoC validation
- Report without fixing (autopilot)
- Ignore skill patterns
- Accept "works" as justification
- Leave non-compiling code
- Forget to verify `AppModule.imports[]` or barrel exports in `libs/`
