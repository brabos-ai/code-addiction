---
name: add--code-review
description: 'Code review: IoC, RESTful, Contracts, Security (OWASP), Clean Architecture, SOLID.'
---

# Code Review

<!-- uses:
- skill: add--backend-development
- skill: add--database-development
- skill: add--frontend-development
- skill: add--security-audit
- skill: add--ux-design
- mention: add--architecture-discovery
- mention: add--feature-discovery
- mention: add--feature-specification
- mention: /add-plan
- command: /add-build
- script: status.cjs
-->

Skill for validating implemented code against project standards.

**Use for:** Validate code and identify violations; apply routed fixes when dispatched by `/add-build`
**Do not use for:**

- Implementing new features (use `add--backend-development` / `add--frontend-development`)
- Planning or specifying work — planning belongs to `/add-plan`, which writes `plan.md` against the `feature-plan` schema; specifying belongs to `add--feature-specification`
- Codebase discovery or architecture analysis (use `add--feature-discovery` / `add--architecture-discovery`)

**Reference:** Project conventions: follow `{{addpath:wiki/conventions.md}}` → `## Stack Conventions` (+ `{{addpath:wiki/domains/<area>.md}}`); a one-line critical rule may live in `AGENTS.md`. If absent, apply the agnostic defaults and follow the nearest existing code; never impose tenancy, DI registration or barrels unless the project uses them.

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

- Backend: `{{skill:add--backend-development/SKILL.md}}`
- Database: `{{skill:add--database-development/SKILL.md}}`
- Frontend (Code): `{{skill:add--frontend-development/SKILL.md}}`
- Frontend (UI): `{{skill:add--ux-design/SKILL.md}}`
- Security: `{{skill:add--security-audit/SKILL.md}}`

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

Source: `AGENTS.md → ## Architecture Contract`.

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

**Code that is not registered the way the project registers it does NOT work at runtime.**

Check registration per the project's DI convention (row `DI`): every new service, repository, handler, guard and controller is registered, and exported where other modules use it, exactly as neighbouring code does. When row `DI` names no container, this check is `N/A` and scores full points. When it is `none` or absent, judge consistency with the neighbouring code.

Barrel exports are checked only when row `Barrels` = yes.

#### Example (one framework, module-based containers)

| Component | Where it must be registered |
|---|---|
| Service / handler / guard | `providers[]` of its feature module |
| Repository | `providers[]` and `exports[]` of the data module |
| Controller | `controllers[]` of its feature module |
| Feature module | `imports[]` of the root module |

Typical symptoms: "cannot resolve dependencies of X" = `X` or its dependency missing from `providers[]`; endpoint 404 = controller not registered or module not imported; repository not found = not exported by its module.

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
- The driver/ORM handles it automatically

---

### 6. Security (OWASP)

| Category | Check |
|---|---|
| Injection | parametrized queries |
| Auth | guards applied |
| Data Exposure | no secrets in logs |
| Access Control | guards and ownership checks; tenant scoping when row `Tenancy` = yes |
| XSS | outputs sanitized |

Multi-tenant (only when row `Tenancy` = yes):

- EVERY query filters by the recorded tenant key (e.g. `account_id`)
- The tenant key comes from the auth context, not the body
- A query missing the key is a CRITICAL finding

---

### 7. SOLID Principles

- **SRP:** one class, one responsibility
- **OCP:** open for extension, closed for modification
- **LSP:** subtypes substitutable
- **ISP:** specific interfaces over general
- **DIP:** depend on abstractions

---

### 8. Code Quality

- No untyped escape hatches (e.g. `any`)
- DTOs follow naming
- No `console.log` (use logger)
- No commented code
- No unused imports
- Exception handling

---

### 9. Database

- Migration created
- Has `up` and `down`
- Generated query/ORM types regenerated (if the project uses them)
- Entity exported
- Repository exported

---

### 10. Environment

- New vars in `.env.example`
- Example values not real
- Use the project's config module, not direct environment access

---

## Score

Weights and status (lookup):

{"weights":{"specCompliance":20,"archContract":20,"ioc":15,"restful":10,"contracts":15,"security":15,"solid":10,"quality":10,"database":5}}
{"status":{"8-10":"APPROVED","6-7":"NEEDS ATTENTION","4-5":"NEEDS FIXES","0-3":"CRITICAL"}}

---

## Process

### Phase 1: Load Context & Create Todos

1. `node .codeadd/scripts/status.cjs`
2. Read reference skills (backend, database, frontend, security)
3. Read the project conventions (wiki), then `AGENTS.md`
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

### Phase 3: Fix (build-side, routed)

1. For each issue found:
   - Create specific todo: "Fix [issue] in [file]"
   - Mark as `in_progress`
   - Apply fix
   - Mark as `completed`
2. Verify build compiles
3. Document before/after

### Phase 4: Report

Generate the review report at `docs/features/${featureId}/review-NNN.md` (next number in the per-feature sequence). The exact output template (score table, issue format, build status) is owned by the consuming command (`add-review`) — this skill validates; the command formats.

---

## Rules

**Do:**

- Create TodoWrite BEFORE starting review and update it during each phase
- Load reference skills BEFORE review
- Run `status.cjs` FIRST
- Apply routed fixes when dispatched by `/add-build`
- Verify build
- Document before/after

**Don't:**

- Start review without creating TodoWrite
- Skip Architecture Contract validation (MOST critical)
- Skip DI validation when the project uses a container
- Report without fixing (review-side)
- Ignore skill patterns
- Accept "works" as justification
- Leave non-compiling code
- Forget to verify registration and barrel exports where the project uses them
