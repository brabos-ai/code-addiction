<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/planning/SKILL.md -->
---
name: planning
description: Use when creating technical implementation plans - creates/updates plan.md with tasks, file mappings, dependencies and complexity estimates using Technical Style
---

# Technical Planning

Skill para criação de planos técnicos de implementação. Cria/atualiza `plan.md` com tasks, mapeamento de arquivos e estimativas.

**Princípio:** Plano concreto e executável, não wishlist.

---

## Spec

{"trigger":"create implementation plan","input":["about.md","discovery.md","design.md?"],"output":"docs/features/[ID]/plan.md","style":"documentation-style/technical.md","format":"JSON minified + tasks sequenciadas"}

---

## Quando Usar

{"whenToUse":{"Feature documentada, pronta para dev":"Criar plan.md","plan.md existe incompleto":"Completar tasks faltantes","Escopo mudou":"Atualizar tasks afetadas","Durante dev, descobriu mais trabalho":"Adicionar tasks"},"dontUse":"Sem about.md (primeiro documentar feature)"}

---

## Workflow

### Phase 1: Carregar Contexto

```bash
# Ler documentação da feature
cat docs/features/[FEATURE_ID]/about.md
cat docs/features/[FEATURE_ID]/discovery.md
cat docs/features/[FEATURE_ID]/design.md  # se existir
```

**Extrair:**
- Requisitos (RF/RNF/RN) do about.md
- Arquivos a criar/modificar do discovery.md
- Componentes UI do design.md (se houver)

### Phase 2: Estruturar Tasks

**Regras de quebra:**

{"breakRules":{"Simples":{"criteria":"1-3 arquivos, sem deps","action":"Task única"},"Média":{"criteria":"4-10 arquivos, deps sequenciais","action":"Tasks por camada"},"Grande":{"criteria":">10 arquivos, múltiplos domínios","action":"Batches separados"}}}

**Ordem padrão (bottom-up):**
```
1. Domain (entities, enums, types)
2. Database (migrations, repositories)
3. Business (services, use-cases)
4. API (controllers, DTOs, validators)
5. Frontend (components, hooks, stores)
6. Integration (tests, e2e)
```

### Phase 3: Estimar Complexidade

**Escala:**
```
S = Small  → 1-2 arquivos, mudança localizada
M = Medium → 3-5 arquivos, lógica moderada
L = Large  → 6+ arquivos, lógica complexa
```

**Sinais de complexidade:**
- Novas entidades → +1 size
- Migrations → +1 size
- Integrações externas → +1 size
- UI complexa (forms, tables) → +1 size

### Phase 4: Estruturar Documento

**Template plan.md (Technical Style):**

```markdown
# Plan: [Feature Name]

Plano técnico para implementação de [feature]. Baseado em about.md e discovery.md.

---

## Spec

### Context
{"feature":"[ID]","branch":"feature/[ID]-[name]","deps":["package@version"],"estimate":"[S/M/L]"}

### Files
{"create":["path/file1.ts","path/file2.ts"],"modify":["path/existing.ts"]}

### Tasks
[{"id":1,"task":"Criar entity [Name]","estimate":"S","deps":[]},{"id":2,"task":"Criar migration","estimate":"S","deps":[1]},{"id":3,"task":"Criar repository","estimate":"S","deps":[2]},{"id":4,"task":"Criar service","estimate":"M","deps":[3]},{"id":5,"task":"Criar controller + DTOs","estimate":"M","deps":[4]},{"id":6,"task":"Criar componentes UI","estimate":"M","deps":[5]},{"id":7,"task":"Testes e2e","estimate":"S","deps":[6]}]

---

## Tasks Detalhadas

### Task 1: Criar entity [Name]
**Estimate:** S
**Files:** `libs/domain/src/entities/[Name].ts`
**Deps:** Nenhuma

**Checklist:**
- [ ] Campos conforme about.md
- [ ] Enums se necessário
- [ ] Export no index.ts

---

### Task 2: Criar migration
**Estimate:** S
**Files:** `libs/app-database/src/migrations/[timestamp]-[name].ts`
**Deps:** Task 1

**Checklist:**
- [ ] Tabela com campos
- [ ] Indexes necessários
- [ ] Foreign keys

---

[... continuar para cada task ...]

---

## Batching (se aplicável)

**Batch 1: Foundation**
- Tasks 1-3 (domain + database)
- Commit: "feat([feature]): add [Name] entity and repository"

**Batch 2: Business Logic**
- Tasks 4-5 (service + API)
- Commit: "feat([feature]): add [Name] service and endpoints"

**Batch 3: Frontend**
- Task 6 (UI)
- Commit: "feat([feature]): add [Name] UI components"

**Batch 4: Quality**
- Task 7 (tests)
- Commit: "test([feature]): add e2e tests for [Name]"

---

## Riscos e Mitigações

- **[Risco do discovery.md]:** [mitigação no plano]

---

## Metadata
{"updated":"YYYY-MM-DD","sessions":N,"by":"[subagent]"}
```

### Phase 5: Validar e Persistir

**Checklist antes de salvar:**
- [ ] Todas as tasks têm estimate (S/M/L)
- [ ] Dependências entre tasks estão corretas
- [ ] Paths são concretos e verificáveis
- [ ] Batches fazem sentido para commits
- [ ] Metadata atualizado

---

## Formato de Tasks

### JSON Spec (compacto)
```json
[{"id":1,"task":"descrição","estimate":"S","deps":[]},{"id":2,"task":"descrição","estimate":"M","deps":[1]}]
```

### Task Detalhada (expandida)
```markdown
### Task N: [Título]
**Estimate:** [S/M/L]
**Files:** `path/file.ts`
**Deps:** Task [N-1] ou Nenhuma

**Checklist:**
- [ ] [Item verificável]
```

---

## Batching Strategy

### Quando usar batches

{"batching":{"<5 tasks":"Batch único","5-10 tasks":"2-3 batches por camada",">10 tasks":"Batches por domínio/módulo"}}

### Regras de commit

```
Batch = 1 commit semântico

feat([feature]): add [what was added]
fix([feature]): fix [what was fixed]
refactor([feature]): refactor [what changed]
test([feature]): add tests for [what]
```

---

## Regras

**Do:**
- Basear tasks em about.md e discovery.md
- Incluir dependências entre tasks
- Estimar todas as tasks (S/M/L)
- Paths concretos e verificáveis
- Batches com commits semânticos

**Dont:**
- Tasks vagas (implementar feature)
- Estimativas sem critério
- Ignorar dependências entre tasks
- Planejar sem ler documentação prévia
- Batches muito grandes (>5 tasks)

---

## Integração com ADD

Quando ADD dispara subagente para planning:

```markdown
**Skills:**
```bash
cat .codeadd/skills/planning/SKILL.md
cat .codeadd/skills/documentation-style/technical.md
```

**Contexto:**
- Feature: [ID]
- about.md: [path ou conteúdo]
- discovery.md: [path ou conteúdo]

**Instruções:**
1. Ler about.md (requisitos)
2. Ler discovery.md (arquivos, padrões)
3. Ler design.md se existir
4. Criar plan.md com tasks sequenciadas
5. Atualizar metadata
```

---

## Checklist

- [ ] Leu about.md (requisitos)?
- [ ] Leu discovery.md (arquivos)?
- [ ] Tasks têm IDs sequenciais?
- [ ] Todas tasks têm estimate (S/M/L)?
- [ ] Dependências entre tasks corretas?
- [ ] Paths são concretos?
- [ ] Batches definidos (se >5 tasks)?
- [ ] Riscos mapeados?
- [ ] Metadata atualizado?
