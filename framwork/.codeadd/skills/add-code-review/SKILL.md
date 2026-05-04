---
name: add-code-review
description: Code review: IoC, RESTful, Contracts, Security (OWASP), Clean Architecture, SOLID.
---

# Code Review

Skill para validação de código implementado contra padrões do projeto.

**Use para:** Validar código, identificar violações, auto-corrigir (autopilot)
**Não use para:** Implementar código, planejamento, discovery

**Referência:** Sempre consultar `CLAUDE.md` para padrões gerais do projeto.

---

## ⚠️ REGRA OBRIGATÓRIA: TodoWrite

**ANTES de iniciar qualquer revisão, você DEVE criar uma lista de todos usando TodoWrite.**

O agente de code-review DEVE criar todos para cada categoria de validação e para cada arquivo alterado. Isso garante:

1. Visibilidade do progresso para o usuário
2. Nenhuma validação esquecida
3. Rastreabilidade das correções

---

## Skills de Referência

**Carregar ANTES de revisar:**

- Backend: `{{skill:add-backend-development/SKILL.md}}`
- Database: `{{skill:add-database-development/SKILL.md}}`
- Frontend (Code): `{{skill:add-frontend-development/SKILL.md}}`
- Frontend (UI): `{{skill:add-ux-design/SKILL.md}}`
- Security: `{{skill:add-security-audit/SKILL.md}}`

---

## Categorias de Validação

### 0. Spec Compliance (CRÍTICO)

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

### 0.5. Architecture Contract (MAIS CRÍTICO)

**Violação de arquitetura = CRITICAL BLOCKER. Corrigir ANTES de qualquer outra validação.**

Source: `CLAUDE.md → ## Architecture Contract`.

Validation steps:

Para CADA arquivo novo/modificado:

1. Identificar layer/package do arquivo
2. Grep imports de `@org/*` (ou alias do projeto)
3. Verificar contra regras de Imports do contrato
4. Verificar se artefato está no package correto (Placement)

Examples:

| Violation | Fix |
|---|---|
| `interfaces` importa `database` | Mover artefato ou ajustar import |
| DTO de service contract em `database` | Mover DTO para `interfaces` |
| `domain` importa qualquer coisa | Remover import — `domain` tem zero deps |

---

### 1. IoC Configuration (CRÍTICO)

**Código sem IoC correto NÃO funciona em runtime.**

#### Checklist por tipo de componente (lookup)

{"iocChecklist":{"Service":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":false},"Repository":{"decorator":"@Injectable()","providers":"db module","exports":"db module","controllers":false,"indexTs":"libs/"},"Handler":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":"NUNCA"},"Guard":{"decorator":"@Injectable()","providers":"feature/global","exports":false,"controllers":false,"indexTs":false},"Controller":{"decorator":"@Controller()","providers":false,"exports":false,"controllers":"feature module","indexTs":false}}}

#### Validações obrigatórias IoC

**Service:**

- Tem `@Injectable()`
- Registrado em `providers[]` do módulo
- Módulo importado em `AppModule.imports[]`

**Repository:**

- Tem `@Injectable()`
- Registrado em `providers[]` do módulo database
- Registrado em `exports[]` do módulo database
- Exportado no `index.ts` de `libs/app-database/src/`
- Tipo adicionado em `Database.ts` se nova tabela

**CommandHandler:**

- Tem `@Injectable()`
- Registrado em `providers[]` do módulo feature
- NÃO exportado em `index.ts` (implementation detail)
- `Command` exportado (contrato público)

**EventHandler:**

- Tem `@Injectable()`
- Registrado em `providers[]` do módulo feature
- NÃO exportado em `index.ts` (implementation detail)
- `Event` exportado se cross-module

**Controller:**

- Tem `@Controller('prefix')`
- Registrado em `controllers[]` do módulo
- Guards aplicados (`@UseGuards`)
- Módulo importado em `AppModule.imports[]`

**Module:**

- Importa módulos necessários (`SharedModule`, `DatabaseModule`)
- Registra todos providers
- Registra todos controllers
- Importado em `AppModule.imports[]`

#### Arquivos a verificar para IoC

| File | Check |
|---|---|
| `apps/backend/src/app.module.ts` | `imports[]` contém módulo |
| `[feature].module.ts` | `providers[]`, `controllers[]`, `imports[]` |
| `libs/app-database/src/app-database.module.ts` | `providers[]`, `exports[]` para repos |
| `libs/app-database/src/index.ts` | exports de repos públicos |
| `libs/app-database/src/types/Database.ts` | tipos de tabelas novas |
| `libs/domain/src/index.ts` | exports de entities/enums novos |

#### Erros comuns IoC

| Erro | Causa | Fix |
|---|---|---|
| `Nest can't resolve dependencies of X` | `X` não está em `providers[]` ou dependência de `X` não registrada | Adicionar `X` e suas dependências em `providers[]` |
| `X is not a provider` | Falta `@Injectable()` ou não registrado | Adicionar decorator e registrar em `providers[]` |
| `Module X not found` | Módulo não importado em `AppModule` | Adicionar em `AppModule.imports[]` |
| `Repository not found` | Repo não exportado em `exports[]` do db module | Adicionar em `exports[]` de `AppDatabaseModule` |
| 404 on endpoint | Controller não registrado ou módulo não importado | Verificar `controllers[]` e `AppModule.imports[]` |

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

**OBRIGATÓRIO: Criar TodoWrite com lista de validações:**

```
Exemplo de todos a criar:
- [ ] Carregar contexto e identificar arquivos alterados
- [ ] Validar Spec Compliance: ler contratos do plan.md (prose) e tick state do tasks.md → ## Acceptance Checklist
- [ ] Validar Spec Compliance: comparar routes/services/DTOs vs spec
- [ ] Validar Architecture Contract: imports entre packages
- [ ] Validar Architecture Contract: placement de artefatos
- [ ] Validar IoC: verificar @Injectable em novos services
- [ ] Validar IoC: verificar providers[] nos módulos
- [ ] Validar IoC: verificar exports[] para repositórios
- [ ] Validar IoC: verificar imports[] em AppModule
- [ ] Validar IoC: verificar barrel exports (index.ts)
- [ ] Validar RESTful: métodos HTTP corretos
- [ ] Validar RESTful: status codes corretos
- [ ] Validar Contracts: tipos sincronizados frontend/backend
- [ ] Validar Security: multi-tenancy (account_id)
- [ ] Validar Security: guards aplicados
- [ ] Validar Quality: sem any, sem console.log
- [ ] Validar Database: migrations, tipos Kysely
- [ ] Corrigir issues encontrados
- [ ] Verificar build compila
- [ ] Gerar relatório de review
```

### Phase 2: Validate (com TodoWrite updates)

Para CADA arquivo alterado, validar na ordem:

1. **Spec Compliance** (PRIMEIRO — gap spec-vs-code)
   - Marcar todo como `in_progress`
   - READ contracts from `plan.md` prose (routes, services, DTOs, queues)
   - READ tick state from `tasks.md → ## Acceptance Checklist` (each item ends with `(RFNN/RNNN)`; cross-reference §1 Requirements Coverage)
   - For each contract: locate with `file:line`, validate behavior (not just existence)
   - DIVERGENT items: describe exact gap → auto-fix if safe, else report
   - MISSING items: report as BLOCKED (cannot auto-fix product scope)
   - Marcar todo como `completed`

2. **Architecture Contract** (segundo — violação estrutural)
   - Marcar todo como `in_progress`
   - Ler `## Architecture Contract` do `CLAUDE.md`
   - Para cada arquivo novo/modificado:
     - [ ] Identificar layer/package do arquivo
     - [ ] Verificar imports de `@org/*` contra regras de Imports
     - [ ] Verificar se artefato está no package correto (Placement)
   - Se violação encontrada: **CRITICAL BLOCKER** — corrigir antes de continuar
   - Marcar todo como `completed`

3. **IoC Configuration** (segundo mais crítico)
   - Marcar todo como `in_progress`
   - Para cada novo componente criado:
     - [ ] Verificar decorator (`@Injectable`, `@Controller`)
     - [ ] Verificar registro em `providers[]`/`controllers[]`
     - [ ] Verificar `exports[]` se compartilhado
     - [ ] Verificar `index.ts` se em `libs/`
     - [ ] Verificar `AppModule.imports[]`
   - Marcar todo como `completed`

4. **RESTful Compliance**
5. **Contract Validation**
6. **Security (OWASP)**
7. **SOLID Principles**
8. **Code Quality**
9. **Database**

### Phase 3: Fix (autopilot)

1. Para cada issue encontrado:
   - Criar todo específico: "Corrigir [issue] em [arquivo]"
   - Marcar como `in_progress`
   - Aplicar fix
   - Marcar como `completed`
2. Verificar build compila
3. Documentar before/after

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

- CRIAR TodoWrite ANTES de iniciar review
- Atualizar todos durante cada fase
- Marcar todo como `in_progress` antes de começar validação
- Marcar todo como `completed` após finalizar validação
- Load skills BEFORE review
- Run `status.sh` FIRST
- Auto-fix in autopilot
- Verify build
- Document before/after

**Don't:**

- Iniciar review SEM criar TodoWrite
- Pular validação de Architecture Contract (MAIS crítica)
- Pular validação de IoC
- Report without fixing (autopilot)
- Ignore skill patterns
- Accept "works" as justification
- Leave non-compiling code
- Esquecer de verificar `AppModule.imports[]`
- Esquecer de verificar barrel exports em `libs/`

---

## IoC Quick Reference

**Novo Service criado? Verificar:**

1. `@Injectable()` no service
2. `providers: [NovoService]` no módulo
3. `imports: [FeatureModule]` no `AppModule`

**Novo Repository criado? Verificar:**

1. `@Injectable()` no repository
2. `providers: [NovoRepository]` no `AppDatabaseModule`
3. `exports: [NovoRepository]` no `AppDatabaseModule`
4. `export { NovoRepository }` no `index.ts` de `libs/app-database/src/`

**Novo Handler criado? Verificar:**

1. `@Injectable()` no handler
2. `providers: [NovoHandler]` no módulo da feature
3. **NÃO** exportar handler em `index.ts` (implementation detail)

**Novo Controller criado? Verificar:**

1. `@Controller('prefix')` no controller
2. `controllers: [NovoController]` no módulo
3. `@UseGuards(JwtAuthGuard)` aplicado
4. `imports: [FeatureModule]` no `AppModule`

**Nova Entity/Enum criado? Verificar:**

1. `export { NovaEntity }` no `index.ts` de `libs/domain/src/`

**Nova Tabela criada? Verificar:**

1. Migration criada em `libs/app-database/migrations/`
2. Tipo adicionado em `libs/app-database/src/types/Database.ts`
