---
name: add-code-review
description: Code review: IoC, RESTful, Contracts, Security (OWASP), Clean Architecture, SOLID.
---

# Code Review

Skill for validating implemented code against project standards.

**Use for:** Validate code, identify violations, auto-fix (autopilot)
**Do not use for:** Implementing code, planning, discovery

**Reference:** Always consult `CLAUDE.md` for general project standards.

---

## ⚠️ MANDATORY RULE: TodoWrite

**BEFORE starting any review, you MUST create a todo list using TodoWrite.**

The code-review agent MUST create todos for each validation category and for each changed file. This ensures:

1. Progress visibility for the user
2. No validation is forgotten
3. Traceability of fixes

---

## Skills de Referência

**Load BEFORE reviewing:**

- Backend: `{{skill:add-backend-development/SKILL.md}}`
- Database: `{{skill:add-database-development/SKILL.md}}`
- Frontend (Code): `{{skill:add-frontend-development/SKILL.md}}`
- Frontend (UI): `{{skill:add-ux-design/SKILL.md}}`
- Security: `{{skill:add-security-audit/SKILL.md}}`

---

## Categorias de Validação

### 0. Spec Compliance (CRITICAL)

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

### 0.5. Architecture Contract (MOST CRITICAL)

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
| `interfaces` importa `database` | Mover artefato ou ajustar import |
| DTO de service contract em `database` | Mover DTO para `interfaces` |
| `domain` importa qualquer coisa | Remover import — `domain` tem zero deps |

---

### 1. IoC Configuration (CRITICAL)

**Code without correct IoC does NOT work at runtime.**

#### Checklist por tipo de componente (lookup)

{"iocChecklist":{"Service":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":false},"Repository":{"decorator":"@Injectable()","providers":"db module","exports":"db module","controllers":false,"indexTs":"libs/"},"Handler":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":"NEVER"},"Guard":{"decorator":"@Injectable()","providers":"feature/global","exports":false,"controllers":false,"indexTs":false},"Controller":{"decorator":"@Controller()","providers":false,"exports":false,"controllers":"feature module","indexTs":false}}}

#### Mandatory IoC Validations

**Service:**

- Has `@Injectable()`
- Registered in module `providers[]`
- Module imported in `AppModule.imports[]`

**Repository:**

- Has `@Injectable()`
- Registered in database module `providers[]`
- Registered in database module `exports[]`
- Exported in `libs/app-database/src/index.ts`
- Type added in `Database.ts` if new table

**CommandHandler:**

- Has `@Injectable()`
- Registered in feature module `providers[]`
- NOT exported in `index.ts` (implementation detail)
- `Command` exported (public contract)

**EventHandler:**

- Has `@Injectable()`
- Registered in feature module `providers[]`
- NOT exported in `index.ts` (implementation detail)
- `Event` exported if cross-module

**Controller:**

- Has `@Controller('prefix')`
- Registered in module `controllers[]`
- Guards applied (`@UseGuards`)
- Module imported in `AppModule.imports[]`

**Module:**

- Imports required modules (`SharedModule`, `DatabaseModule`)
- Registers all providers
- Registers all controllers
- Imported in `AppModule.imports[]`

#### Arquivos a verificar para IoC

| File | Check |
|---|---|
| `apps/backend/src/app.module.ts` | `imports[]` contains module |
| `[feature].module.ts` | `providers[]`, `controllers[]`, `imports[]` |
| `libs/app-database/src/app-database.module.ts` | `providers[]`, `exports[]` for repos |
| `libs/app-database/src/index.ts` | public repo exports |
| `libs/app-database/src/types/Database.ts` | new table types |
| `libs/domain/src/index.ts` | new entity/enum exports |

#### Common IoC Errors

| Erro | Causa | Fix |
|---|---|---|
| `Nest can't resolve dependencies of X` | `X` not in `providers[]` or `X`'s dependency not registered | Add `X` and its dependencies to `providers[]` |
| `X is not a provider` | Missing `@Injectable()` or not registered | Add decorator and register in `providers[]` |
| `Module X not found` | Module not imported in `AppModule` | Add to `AppModule.imports[]` |
| `Repository not found` | Repo not exported in db module `exports[]` | Add to `AppDatabaseModule` `exports[]` |
| 404 on endpoint | Controller not registered or module not imported | Check `controllers[]` and `AppModule.imports[]` |

---

### 2. RESTful Compliance (CRÍTICO)

| Rule | Correct | Wrong |
|---|---|---|
| HTTP method | GET read, POST create, DELETE remove | POST for read |
| URL | `/users` (noun) | `/getUsers` (verb) |
| Status | 201 POST, 204 DELETE | 200 for all |

---

### 3. Contract Validation (CRÍTICO)

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

### 4. Security (OWASP)

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

### 5. SOLID Principles

- **SRP:** one class, one responsibility
- **OCP:** open for extension, closed for modification
- **LSP:** subtypes substitutable
- **ISP:** specific interfaces over general
- **DIP:** depend on abstractions

---

### 6. Code Quality

- No `any` type
- DTOs follow naming
- No `console.log` (use logger)
- No commented code
- No unused imports
- Exception handling

---

### 7. Database

- Migration created
- Has `up` and `down`
- Kysely types updated
- Entity exported
- Repository exported

---

### 8. Environment

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

**MANDATORY: Create TodoWrite with validation list:**

```
Example todos to create:
- [ ] Load context and identify changed files
- [ ] Validate Spec Compliance: read contracts from plan.md (prose) and tick state from tasks.md → ## Acceptance Checklist
- [ ] Validate Spec Compliance: compare routes/services/DTOs vs spec
- [ ] Validate Architecture Contract: imports between packages
- [ ] Validate Architecture Contract: artefact placement
- [ ] Validate IoC: check @Injectable on new services
- [ ] Validate IoC: check providers[] in modules
- [ ] Validate IoC: check exports[] for repositories
- [ ] Validate IoC: check imports[] in AppModule
- [ ] Validate IoC: check barrel exports (index.ts)
- [ ] Validate RESTful: correct HTTP methods
- [ ] Validate RESTful: correct status codes
- [ ] Validate Contracts: types synchronized frontend/backend
- [ ] Validate Security: multi-tenancy (account_id)
- [ ] Validate Security: guards applied
- [ ] Validate Quality: no any, no console.log
- [ ] Validate Database: migrations, Kysely types
- [ ] Fix issues found
- [ ] Verify build compiles
- [ ] Generate review report
```

### Phase 2: Validate (com TodoWrite updates)

For EACH changed file, validate in order:

1. **Spec Compliance** (PRIMEIRO — gap spec-vs-code)
   - Mark todo as `in_progress`
   - READ contracts from `plan.md` prose (routes, services, DTOs, queues)
   - READ tick state from `tasks.md → ## Acceptance Checklist` (each item ends with `(RFNN/RNNN)`; cross-reference §1 Requirements Coverage)
   - For each contract: locate with `file:line`, validate behavior (not just existence)
   - DIVERGENT items: describe exact gap → auto-fix if safe, else report
   - MISSING items: report as BLOCKED (cannot auto-fix product scope)
   - Mark todo as `completed`

2. **Architecture Contract** (segundo — violação estrutural)
   - Mark todo as `in_progress`
   - Read `## Architecture Contract` from `CLAUDE.md`
   - For each new/modified file:
     - [ ] Identify the file's layer/package
     - [ ] Verify imports of `@org/*` against Import rules
     - [ ] Verify the artefact is in the correct package (Placement)
   - If violation found: **CRITICAL BLOCKER** — fix before continuing
   - Mark todo as `completed`

3. **IoC Configuration** (segundo mais crítico)
   - Mark todo as `in_progress`
   - For each new component created:
     - [ ] Verify decorator (`@Injectable`, `@Controller`)
     - [ ] Verify registration in `providers[]`/`controllers[]`
     - [ ] Verify `exports[]` if shared
     - [ ] Verify `index.ts` if in `libs/`
     - [ ] Verify `AppModule.imports[]`
   - Mark todo as `completed`

4. **RESTful Compliance**
5. **Contract Validation**
6. **Security (OWASP)**
7. **SOLID Principles**
8. **Code Quality**
9. **Database**

### Phase 3: Fix (autopilot)

1. For each issue found:
   - Create specific todo: "Fix [issue] in [file]"
   - Mark as `in_progress`
   - Apply fix
   - Mark as `completed`
2. Verify build compiles
3. Document before/after

### Phase 4: Report

Create `docs/features/${featureId}/review.md`.

---

## Output Template

```markdown
# Code Review: [Feature]

**Date:** [date] | **Status:** ✅ APPROVED

## Score

| Category | Score | Status |
|----------|-------|--------|
| Spec Compliance | X/10 | ✅ |
| Arch Contract | X/10 | ✅ |
| IoC | X/10 | ✅ |
| RESTful | X/10 | ✅ |
| Contracts | X/10 | ✅ |
| Security | X/10 | ✅ |
| SOLID | X/10 | ✅ |
| Quality | X/10 | ✅ |
| Database | X/10 | ✅ |
| **OVERALL** | **X/10** | **✅** |

## Issues Found & Fixed

### Issue #1: [Title]
**Category:** [cat] | **File:** `path:line` | **Severity:** 🔴 Critical

**Problem:** [code before]
**Fix:** [code after]
**Status:** ✅ FIXED

## Build Status
- [x] Backend compiles
- [x] Frontend compiles
```

---

## Rules

**Do:**

- CREATE TodoWrite BEFORE starting review
- Update todos during each phase
- Mark todo as `in_progress` before starting validation
- Mark todo as `completed` after finishing validation
- Load skills BEFORE review
- Run `status.sh` FIRST
- Auto-fix in autopilot
- Verify build
- Document before/after

**Don't:**

- Start review WITHOUT creating TodoWrite
- Skip Architecture Contract validation (MOST critical)
- Skip IoC validation
- Report without fixing (autopilot)
- Ignore skill patterns
- Accept "works" as justification
- Leave non-compiling code
- Forget to verify `AppModule.imports[]`
- Forget to verify barrel exports in `libs/`

---

## IoC Quick Reference

**New Service created? Verify:**

1. `@Injectable()` no service
2. `providers: [NovoService]` no módulo
3. `imports: [FeatureModule]` no `AppModule`

**New Repository created? Verify:**

1. `@Injectable()` no repository
2. `providers: [NovoRepository]` no `AppDatabaseModule`
3. `exports: [NovoRepository]` no `AppDatabaseModule`
4. `export { NovoRepository }` no `index.ts` de `libs/app-database/src/`

**New Handler created? Verify:**

1. `@Injectable()` no handler
2. `providers: [NovoHandler]` no módulo da feature
3. **DO NOT** export handler in `index.ts` (implementation detail)

**New Controller created? Verify:**

1. `@Controller('prefix')` no controller
2. `controllers: [NovoController]` no módulo
3. `@UseGuards(JwtAuthGuard)` aplicado
4. `imports: [FeatureModule]` no `AppModule`

**New Entity/Enum created? Verify:**

1. `export { NovaEntity }` no `index.ts` de `libs/domain/src/`

**New Table created? Verify:**

1. Migration criada em `libs/app-database/migrations/`
2. Tipo adicionado em `libs/app-database/src/types/Database.ts`
