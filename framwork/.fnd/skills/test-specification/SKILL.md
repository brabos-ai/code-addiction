---
name: test-specification
description: Use when generating contract test cases from RFs/RNs before implementation — produces test specs for tasks.md
---

# Test Specification

Gera test cases derivados de requisitos funcionais (RFs), regras de negócio (RNs) e contratos técnicos (endpoints, DTOs, entities). Produz especificações de teste que entram no `tasks.md` ANTES das tasks de implementação.

**Princípio:** Testes validam CONTRATO (input/output), nunca implementação interna.

---

## Spec

{"trigger":"subagent test-spec no /fnd-plan","input":["about.md (RFs, RNs, RNFs)","plan-database.md","plan-backend.md","plan-frontend.md"],"output":"plan-test-spec.md","focus":"contract tests derivados de requisitos","complements":"fnd-test (post-dev coverage)"}

---

## Quando Usar

- Subagente test-spec do `/fnd-plan` (automático)
- Sempre que `about.md` tiver RFs/RNs e contratos técnicos existirem

## Quando NÃO Usar

- Para gerar testes de cobertura pós-implementação (usar `/fnd-test`)
- Para edge cases e error handling (complemento do `/fnd-test`)
- Sem `about.md` com RFs/RNs definidos

---

## Input Sources

### 1. about.md — Requisitos Testáveis

```
RFs (Requisitos Funcionais):
  - **[RF01]:** [ação] [objeto] [condição]
  → Gera: test case que valida [ação] produz [resultado esperado]

RNs (Regras de Negócio):
  - **[RN01]:** [condição] → [resultado]
  → Gera: test case que valida [condição] produz [resultado]

RNFs (Requisitos Não-Funcionais):
  - **[RNF01]:** [constraint]
  → Gera: test case que valida [constraint] é respeitado
```

### 2. Contratos Técnicos (plan-*.md)

```
Endpoints:
  - Method + Path + Request DTO + Response DTO + Status
  → Gera: test case por endpoint (request válido → response esperado)

DTOs:
  - Fields + Validations
  → Gera: test case por validação (campo obrigatório, tipo, range)

Entities:
  - Table + Key Fields
  → Gera: test case de persistência (create → read → verify fields)

Commands/Events:
  - Trigger + Actions + Payload
  → Gera: test case de fluxo (trigger → side effects verificados)
```

---

## Test Case Generation Rules

### Regra 1: Contrato, Não Implementação

```
✅ CORRETO: "POST /api/v1/users com {name, email} retorna 201 com {id, name, email}"
❌ ERRADO: "UserService.create() chama repository.save() internamente"

✅ CORRETO: "Se email duplicado, retorna 409 Conflict"
❌ ERRADO: "Catch UniqueConstraintViolation no handler"
```

### Regra 2: 1 RF/RN = 1+ Test Cases

Cada requisito gera pelo menos 1 test case. RNs com condições geram 2 (positivo + negativo):

```
RN01: "Senha mínimo 8 caracteres" →
  - TC: senha com 8+ chars → aceita
  - TC: senha com <8 chars → rejeita com erro específico
```

### Regra 3: Nomenclatura Padronizada

```
[AREA]-[RF/RN]-[cenário]
Exemplos:
  backend-RF01-create-user-success
  backend-RF01-create-user-duplicate-email
  backend-RN01-password-min-length-valid
  backend-RN01-password-min-length-invalid
  frontend-RF02-form-displays-fields
  database-RF01-entity-persists-correctly
```

### Regra 4: Estrutura do Test Case

```
| ID | Test Case | Area | RF/RN | Input | Expected Output | Verify |
|----|-----------|------|-------|-------|-----------------|--------|
| T01 | [nome descritivo max 10 words] | backend | RF01 | [request/action] | [response/result] | [assertion] |
```

---

## Output Format

Escrever em: `docs/features/${FEATURE_ID}/plan-test-spec.md`

```markdown
## Test Specification

### Contract Tests (from RFs/RNs)

| ID | Test Case | Area | RF/RN | Input | Expected Output | Verify |
|----|-----------|------|-------|-------|-----------------|--------|
| T01 | Create user with valid data | backend | RF01 | POST /api/v1/users {name, email} | 201 {id, name, email} | status + body fields |
| T02 | Reject duplicate email | backend | RN01 | POST /api/v1/users {existing email} | 409 {error: "email exists"} | status + error message |
| T03 | User form renders all fields | frontend | RF01 | Navigate to /users/new | Form with name, email inputs | elements visible |
| T04 | Entity persists with all fields | database | RF01 | Insert user record | Record retrievable with all fields | select + compare |

### Test File Mapping

| Area | Test File | Test IDs |
|------|-----------|----------|
| backend | src/modules/[feature]/[feature].spec.ts | T01, T02 |
| frontend | src/pages/[feature]/__tests__/[page].test.tsx | T03 |
| database | src/modules/[feature]/[feature].repository.spec.ts | T04 |

### Coverage vs Requirements

| RF/RN | Test Cases | Covered? |
|-------|------------|----------|
| RF01 | T01, T03, T04 | ✅ |
| RN01 | T02 | ✅ |
```

---

## Integration with tasks.md

Test cases do `plan-test-spec.md` entram no `tasks.md` como tasks de serviço `test`, sequenciadas ANTES das tasks de implementação de cada área:

```
| ID | Description | Service | Files | Deps | Verify |
|----|-------------|---------|-------|------|--------|
| 1.1 | Contract test: create user success | test | src/modules/user/user.spec.ts | - | test file compiles |
| 1.2 | Contract test: reject duplicate email | test | src/modules/user/user.spec.ts | - | test file compiles |
| 2.1 | Create user entity and migration | database | src/entities/user.ts | 1.1 | npm run migrate |
| 2.2 | Create user endpoint | backend | src/modules/user/user.controller.ts | 2.1 | tests pass |
```

**Ordem:** test tasks → database tasks → backend tasks → frontend tasks

---

## Validation Checklist

- [ ] Cada RF do about.md tem pelo menos 1 test case
- [ ] Cada RN do about.md tem test case positivo E negativo
- [ ] Test cases usam contrato (input/output), não implementação interna
- [ ] Nomenclatura segue padrão: `[area]-[RF/RN]-[cenário]`
- [ ] Test File Mapping está completo
- [ ] Coverage vs Requirements mostra 100%
- [ ] Tasks de teste no tasks.md vêm ANTES das tasks de implementação
- [ ] Nenhum test case referencia classes/métodos internos
