---
name: code-review
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
- Backend: `.codeadd/skills/backend-development/SKILL.md`
- Database: `.codeadd/skills/database-development/SKILL.md`
- Frontend (Code): `.codeadd/skills/frontend-development/SKILL.md`
- Frontend (UI): `.codeadd/skills/ux-design/SKILL.md`
- Security: `.codeadd/skills/security-audit/SKILL.md`

---

## Categorias de Validação

### 0. Spec Compliance (CRÍTICO — PRD0034)

**Spec vs implementation gap = the root cause of features that "pass review" but diverge from what was planned.**

{"source":"docs/features/${FEATURE_ID}/plan.md → ## Spec Checklist"}

{"validation":[
  "READ `## Spec Checklist` from plan.md (all areas)",
  "IF no Spec Checklist: extract contracts from plan.md prose (routes, services, DTOs, queues)",
  "For EACH item:",
  "  1. Locate implementation with file:line",
  "  2. Validate EXISTENCE and BEHAVIOR:",
  "     - Route exists AND accepts correct params?",
  "     - Service is generic as spec OR hardcoded?",
  "     - DTO has all specified fields?",
  "  3. Cross-reference: items cover ALL RF/RN from about.md?",
  "  4. Status: COMPLIANT | DIVERGENT (exists but differs) | MISSING"
]}

{"examples":[
  {"divergent":"spec: POST /billing/webhook/:provider, code: POST /webhook (fixed route)","fix":"refactor route to accept :provider param"},
  {"divergent":"spec: WebhookNormalizerService (generic), code: StripeWebhookService (hardcoded)","fix":"extract generic interface, rename service"},
  {"missing":"spec: WebhookSignatureGuard, code: no guard found","fix":"implement guard or document explicit scope exclusion"}
]}

{"specComplianceScore":[
  "COMPLIANT (all items match): full points",
  "DIVERGENT (functional but differs): -1 per item",
  "MISSING (not implemented): -2 per item, blocks merge if RF-linked"
]}

---

### 0.5. Architecture Contract (MAIS CRÍTICO)

**Violação de arquitetura = CRITICAL BLOCKER. Corrigir ANTES de qualquer outra validação.**

{"source":"CLAUDE.md → ## Architecture Contract"}

{"validation":[
  "Para CADA arquivo novo/modificado:",
  "1. Identificar layer/package do arquivo",
  "2. Grep imports de @org/* (ou alias do projeto)",
  "3. Verificar contra regras de Imports do contrato",
  "4. Verificar se artefato está no package correto (Placement)"
]}

{"examples":[
  {"violation":"interfaces importa database","fix":"mover artefato ou ajustar import"},
  {"violation":"DTO de service contract em database","fix":"mover DTO para interfaces"},
  {"violation":"domain importa qualquer coisa","fix":"remover import, domain tem zero deps"}
]}

---

### 1. IoC Configuration (CRÍTICO)

**Código sem IoC correto NÃO funciona em runtime.**

#### Checklist por Tipo de Componente

{"iocChecklist":{"Service":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":false},"Repository":{"decorator":"@Injectable()","providers":"db module","exports":"db module","controllers":false,"indexTs":"libs/"},"Handler":{"decorator":"@Injectable()","providers":"feature module","exports":false,"controllers":false,"indexTs":"NUNCA"},"Guard":{"decorator":"@Injectable()","providers":"feature/global","exports":false,"controllers":false,"indexTs":false},"Controller":{"decorator":"@Controller()","providers":false,"exports":false,"controllers":"feature module","indexTs":false}}}

#### Validações Obrigatórias IoC

```json
{"iocChecks":[
  {"component":"Service","validations":[
    "tem @Injectable()",
    "registrado em providers[] do módulo",
    "módulo importado em AppModule.imports[]"
  ]},
  {"component":"Repository","validations":[
    "tem @Injectable()",
    "registrado em providers[] do módulo database",
    "registrado em exports[] do módulo database",
    "exportado no index.ts de libs/app-database/src/",
    "tipo adicionado em Database.ts se nova tabela"
  ]},
  {"component":"CommandHandler","validations":[
    "tem @Injectable()",
    "registrado em providers[] do módulo feature",
    "NÃO exportado em index.ts (implementation detail)",
    "Command exportado (contrato público)"
  ]},
  {"component":"EventHandler","validations":[
    "tem @Injectable()",
    "registrado em providers[] do módulo feature",
    "NÃO exportado em index.ts (implementation detail)",
    "Event exportado se cross-module"
  ]},
  {"component":"Controller","validations":[
    "tem @Controller('prefix')",
    "registrado em controllers[] do módulo",
    "guards aplicados (@UseGuards)",
    "módulo importado em AppModule.imports[]"
  ]},
  {"component":"Module","validations":[
    "importa módulos necessários (SharedModule, DatabaseModule)",
    "registra todos providers",
    "registra todos controllers",
    "importado em AppModule.imports[]"
  ]}
]}
```

#### Arquivos a Verificar para IoC

```json
{"iocFiles":[
  {"file":"apps/backend/src/app.module.ts","check":"imports[] contém módulo"},
  {"file":"[feature].module.ts","check":"providers[], controllers[], imports[]"},
  {"file":"libs/app-database/src/app-database.module.ts","check":"providers[], exports[] para repos"},
  {"file":"libs/app-database/src/index.ts","check":"exports de repos públicos"},
  {"file":"libs/app-database/src/types/Database.ts","check":"tipos de tabelas novas"},
  {"file":"libs/domain/src/index.ts","check":"exports de entities/enums novos"}
]}
```

#### Erros Comuns IoC

{"errors":[
  {"err":"Nest can't resolve dependencies of X","cause":"X não está em providers[] ou dependência de X não registrada","fix":"adicionar X e suas dependências em providers[]"},
  {"err":"X is not a provider","cause":"falta @Injectable() ou não registrado","fix":"adicionar decorator e registrar em providers[]"},
  {"err":"Module X not found","cause":"módulo não importado em AppModule","fix":"adicionar em AppModule.imports[]"},
  {"err":"Repository not found","cause":"repo não exportado em exports[] do db module","fix":"adicionar em exports[] de AppDatabaseModule"},
  {"err":"404 on endpoint","cause":"controller não registrado ou módulo não importado","fix":"verificar controllers[] e AppModule.imports[]"}
]}

---

### 2. RESTful Compliance (CRÍTICO)

{"check":[{"rule":"HTTP method","correct":"GET read, POST create, DELETE remove","wrong":"POST for read"},{"rule":"URL","correct":"/users (noun)","wrong":"/getUsers (verb)"},{"rule":"Status","correct":"201 POST, 204 DELETE","wrong":"200 for all"}]}

---

### 3. Contract Validation (CRÍTICO)

{"frontendBackend":[{"backend":"Date","frontend":"string"},{"backend":"Enum","frontend":"union type"},{"rule":"sync required/optional fields"}]}

{"jsonb":["NO double parse","NO double stringify","Kysely handles automatically"]}

---

### 4. Security (OWASP)

{"checks":[{"cat":"Injection","check":"parametrized queries"},{"cat":"Auth","check":"guards applied"},{"cat":"DataExposure","check":"no secrets in logs"},{"cat":"AccessControl","check":"filter by account_id"},{"cat":"XSS","check":"outputs sanitized"}]}

{"multiTenant":["EVERY query filters account_id","account_id from JWT not body"]}

---

### 5. SOLID Principles

{"checks":["SRP: one class one responsibility","OCP: open for extension, closed for modification","LSP: subtypes substitutable","ISP: specific interfaces over general","DIP: depend on abstractions"]}

---

### 6. Code Quality

{"checks":["no any type","DTOs follow naming","no console.log (use logger)","no commented code","no unused imports","exception handling"]}

---

### 7. Database

{"checks":["migration created","has up and down","Kysely types updated","entity exported","repository exported"]}

---

### 8. Environment

{"checks":["new vars in .env.example","example values not real","use IConfigurationService not process.env"]}

---

## Score

{"weights":{"specCompliance":20,"archContract":20,"ioc":15,"restful":10,"contracts":15,"security":15,"solid":10,"quality":10,"database":5}}

{"status":{"8-10":"APPROVED","6-7":"NEEDS ATTENTION","4-5":"NEEDS FIXES","0-3":"CRITICAL"}}

---

## Process

### Phase 1: Load Context & Create Todos
1. `bash .codeadd/scripts/status.sh`
2. Read reference skills (backend, database, frontend, security)
3. Read CLAUDE.md
4. Identify ALL changed files

**OBRIGATÓRIO: Criar TodoWrite com lista de validações:**
```
Exemplo de todos a criar:
- [ ] Carregar contexto e identificar arquivos alterados
- [ ] Validar Spec Compliance: ler Spec Checklist do plan.md
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
   - READ `## Spec Checklist` from plan.md (all areas)
   - IF no Spec Checklist: grep plan.md for routes, services, DTOs, queues (prose extraction)
   - For each item: locate with `file:line`, validate behavior (not just existence)
   - DIVERGENT items: describe exact gap → auto-fix if safe, else report
   - MISSING items: report as BLOCKED (cannot auto-fix product scope)
   - Marcar todo como `completed`

2. **Architecture Contract** (segundo - violação estrutural)
   - Marcar todo como `in_progress`
   - Ler `## Architecture Contract` do CLAUDE.md
   - Para cada arquivo novo/modificado:
     - [ ] Identificar layer/package do arquivo
     - [ ] Verificar imports de @org/* contra regras de Imports
     - [ ] Verificar se artefato está no package correto (Placement)
   - Se violação encontrada: **CRITICAL BLOCKER** - corrigir antes de continuar
   - Marcar todo como `completed`

2. **IoC Configuration** (segundo mais crítico)
   - Marcar todo como `in_progress`
   - Para cada novo componente criado:
     - [ ] Verificar decorator (@Injectable, @Controller)
     - [ ] Verificar registro em providers[]/controllers[]
     - [ ] Verificar exports[] se compartilhado
     - [ ] Verificar index.ts se em libs/
     - [ ] Verificar AppModule.imports[]
   - Marcar todo como `completed`

3. **RESTful Compliance**
4. **Contract Validation**
5. **Security (OWASP)**
6. **SOLID Principles**
7. **Code Quality**
8. **Database**

### Phase 3: Fix (autopilot)
1. Para cada issue encontrado:
   - Criar todo específico: "Corrigir [issue] em [arquivo]"
   - Marcar como `in_progress`
   - Aplicar fix
   - Marcar como `completed`
2. Verificar build compila
3. Documentar before/after

### Phase 4: Report
Create `docs/features/${featureId}/review.md`

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
- Marcar todo como in_progress antes de começar validação
- Marcar todo como completed após finalizar validação
- Load skills BEFORE review
- Run status.sh FIRST
- Auto-fix in autopilot
- Verify build
- Document before/after

**Dont:**
- Iniciar review SEM criar TodoWrite
- Pular validação de Architecture Contract (MAIS crítica)
- Pular validação de IoC
- Report without fixing (autopilot)
- Ignore skill patterns
- Accept 'works' as justification
- Leave non-compiling code
- Esquecer de verificar AppModule.imports[]
- Esquecer de verificar barrel exports em libs/

---

## IoC Quick Reference

**Novo Service criado? Verificar:**
1. `@Injectable()` no service
2. `providers: [NovoService]` no módulo
3. `imports: [FeatureModule]` no AppModule

**Novo Repository criado? Verificar:**
1. `@Injectable()` no repository
2. `providers: [NovoRepository]` no AppDatabaseModule
3. `exports: [NovoRepository]` no AppDatabaseModule
4. `export { NovoRepository }` no index.ts de libs/app-database/src/

**Novo Handler criado? Verificar:**
1. `@Injectable()` no handler
2. `providers: [NovoHandler]` no módulo da feature
3. **NÃO** exportar handler em index.ts (implementation detail)

**Novo Controller criado? Verificar:**
1. `@Controller('prefix')` no controller
2. `controllers: [NovoController]` no módulo
3. `@UseGuards(JwtAuthGuard)` aplicado
4. `imports: [FeatureModule]` no AppModule

**Nova Entity/Enum criado? Verificar:**
1. `export { NovaEntity }` no index.ts de libs/domain/src/

**Nova Tabela criada? Verificar:**
1. Migration criada em libs/app-database/migrations/
2. Tipo adicionado em libs/app-database/src/types/Database.ts
