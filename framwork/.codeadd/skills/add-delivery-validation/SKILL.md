---
name: add-delivery-validation
description: Product validation: Requirements 100% implemented, prerequisites exist, acceptance criteria pass.
---

# Delivery Validation

Skill para validação de PRODUTO - verifica se requisitos foram 100% implementados.

**Use para:** Validar entrega de feature, verificar requisitos cumpridos, identificar gaps funcionais
**Não use para:** Validar código técnico (usar code-review), planejamento, discovery

**Diferença do code-review:**

| code-review (Técnico) | delivery-validation (Produto) |
|----------------------|------------------------------|
| IoC, SOLID, segurança | RF/RN implementados? |
| Contratos tipos | Critérios de aceite passando? |
| Build compila? | Funcionalidade funciona end-to-end? |
| Padrões técnicos | Dependências implícitas criadas? |

---

## Spec

{"trigger":"validate feature delivery","input":"about.md + implementation","output":"validation report","focus":"requirements completeness","required":["about.md exists","implementation exists"]}

---

## Quando Usar

{"use":["Antes de /add-done (gate final)","Após /review (complementar)","Quando feature parece pronta"],"dontUse":["Durante desenvolvimento","Para validar código (usar code-review)","Sem about.md definido"]}

---

## Workflow

### Phase 1: Carregar Requisitos

```bash
# Identificar feature atual
FEATURE_ID=$(bash .codeadd/scripts/status.sh)

# Carregar especificação
cat docs/features/${FEATURE_ID}/about.md
cat docs/features/${FEATURE_ID}/plan.md 2>/dev/null  # Contratos (prose)
cat docs/features/${FEATURE_ID}/tasks.md 2>/dev/null # Tick state (## Acceptance Checklist)
```

**Extrair do about.md:**
- **RF (Requisitos Funcionais):** O que o sistema DEVE fazer
- **RN (Regras de Negócio):** Condições e comportamentos
- **Critérios de Aceite:** Verificações testáveis
- **Escopo Incluído:** O que FAZ parte da entrega

**Extrair contratos do plan.md (prose) + tick state do tasks.md → ## Acceptance Checklist:**

Do `plan.md` (prose): routes, services, DTOs, guards, migrations, queues — as defined in the plan.
Do `tasks.md → ## Acceptance Checklist`: a checklist where each item ends with `(RFNN/RNNN)` reference and carries `[ ]`/`[x]`/`[!]` tick state set by `add.build`/`add.autopilot` validators.

Mapear cada item de `## Acceptance Checklist` para o RF/RN correspondente do `about.md`. Use o `## Requirements Coverage` do `tasks.md` como derived index — todos os RF/RN devem ter cobertura por ≥1 item do `## Acceptance Checklist`.

SE `tasks.md` ou `## Acceptance Checklist` NÃO existem (legacy feature, pré-PRD0014):
- BLOQUEAR validação. A feature não foi planejada com o schema atual; não há fallback automático.
- Avisar: "tasks.md ausente ou sem ## Acceptance Checklist — feature precisa ser replanejada via /add.plan."

### Phase 2: Construir Checklist de Validação

**Para CADA requisito, criar item verificável:**

```markdown
## Checklist de Requisitos

### Requisitos Funcionais
- [ ] **RF01:** [descrição] → [como verificar]
- [ ] **RF02:** [descrição] → [como verificar]

### Regras de Negócio
- [ ] **RN01:** [condição] → [resultado esperado]
- [ ] **RN02:** [condição] → [resultado esperado]

### Critérios de Aceite
- [ ] [critério 1] → [como testar]
- [ ] [critério 2] → [como testar]
```

### Phase 3: Verificar Prerequisites (CRÍTICO)

**Para CADA requisito, analisar dependências implícitas:**

```markdown
## Prerequisites Analysis

### RF01: "Verificar tier do produto antes de baixar"
**Análise de dependências:**
1. Produto precisa ter campo `tier`? → [VERIFICAR no model]
2. Existe fluxo para atribuir tier? → [VERIFICAR endpoints]
3. Tier já está sendo populado? → [VERIFICAR dados]

**Status:**
- [ ] Campo tier existe em Product → ✅/❌
- [ ] Fluxo de atribuição existe → ✅/❌
- [ ] Dados estão consistentes → ✅/❌
```

**Perguntas-chave para cada requisito:**
- "O que PRECISA existir para isso funcionar?"
- "Que dados/campos são necessários?"
- "Que fluxos dependentes são necessários?"
- "Que integrações são necessárias?"

### Phase 3.5: Validar Acceptance Checklist (tasks.md → ## Acceptance Checklist)

**Para CADA item do ## Acceptance Checklist:**

```markdown
### Acceptance Checklist Validation

| Item (com ref RF/RN) | Tick state | Esperado (do plan.md) | Encontrado | Status |
|----------------------|------------|------------------------|------------|--------|
| Route POST /billing/webhook/:provider returns 200 (RF02) | [x] | WebhookController.handleWebhook() | POST /webhook (fixed) | ⚠️ DIVERGENT |
| Service WebhookNormalizerService is provider-agnostic (RF02) | [!] | generic, provider-agnostic | StripeWebhookService | ❌ MISSING |
| DTO WebhookEventDto exposes {provider, payload, signature} (RF02) | [ ] | {provider, payload, signature} | WebhookDto {payload} | ⚠️ DIVERGENT |
```

**Status por item (cross-check tick state vs reality):**
- ✅ **COMPLIANT:** tick `[x]` AND implementação confere com plan.md prose
- ⚠️ **DIVERGENT:** tick `[x]` mas implementação difere do plan.md (validador errou OR drift pós-tick)
- ❌ **MISSING/FAILED:** tick `[!]` (validador já marcou falha) OU tick `[ ]` ainda pendente
- 🚨 **STALE TICK:** tick `[x]` mas código não existe — bloqueia entrega; reabre tick

**Cross-reference obrigatório:** Todos os RF/RN do `## Requirements Coverage` (tasks.md §1) têm item correspondente no `## Acceptance Checklist` (tasks.md §4)?
- SE sim → validação é determinística (checklist-driven)
- SE gap → documentar quais RF/RN ficaram sem cobertura — falha do architect na geração de tasks.md, requer regenerar via /add.plan

---

### Phase 4: Validar Implementação

**Para CADA item do checklist (about.md + tasks.md → ## Acceptance Checklist):**

1. **Localizar código que implementa**
   ```bash
   # Buscar implementação do requisito
   grep -r "[termo-chave]" apps/ libs/ --include="*.ts"
   ```

2. **Verificar se lógica está correta**
   - Condições do RN implementadas?
   - Edge cases tratados?
   - Fluxo completo end-to-end?

3. **Marcar status:**
   - ✅ **Implementado:** Código existe e está correto
   - ⚠️ **Parcial:** Implementado mas incompleto
   - ❌ **Não implementado:** Falta completamente
   - 🔗 **Prerequisite faltando:** Dependência não existe

### Phase 5: Testar Cenários (se possível)

**Para cada critério de aceite:**

```markdown
### Teste: [Critério]

**Cenário:** [descrição]
**Dado:** [pré-condição]
**Quando:** [ação]
**Então:** [resultado esperado]

**Resultado:** ✅ Passou / ❌ Falhou / ⚠️ Não testável
```

### Phase 6: Gerar Relatório

**Output: validation-report.md**

```markdown
# Delivery Validation: [Feature]

**Date:** [date] | **Status:** ✅ APPROVED / ❌ BLOCKED

## Summary

{"total_requirements":N,"implemented":N,"partial":N,"missing":N,"prerequisites_ok":true/false}

---

## Requisitos Funcionais

| ID | Requisito | Status | Observação |
|----|-----------|--------|------------|
| RF01 | [desc] | ✅ | Implementado em `path:line` |
| RF02 | [desc] | ❌ | Não encontrado |

---

## Regras de Negócio

| ID | Regra | Status | Observação |
|----|-------|--------|------------|
| RN01 | [cond] → [result] | ✅ | Lógica correta |
| RN02 | [cond] → [result] | ⚠️ | Falta edge case X |

---

## Prerequisites Analysis

| Requisito | Prerequisite | Status | Ação Necessária |
|-----------|--------------|--------|-----------------|
| RF01 | Campo tier em Product | ❌ | Criar campo |
| RF01 | Fluxo de atribuição | ❌ | Criar endpoint |

---

## Critérios de Aceite

- [x] [Critério 1] - Passou
- [ ] [Critério 2] - Falhou: [motivo]

---

## Gaps Identificados

### Gap 1: [Título]
**Requisito:** RF01
**Problema:** [descrição do gap]
**Impacto:** [o que não funciona]
**Ação:** [o que precisa ser feito]

---

## Decisão

**Status:** ✅ APPROVED / ⚠️ NEEDS WORK / ❌ BLOCKED

**Se BLOCKED:**
- [ ] Implementar [gap 1]
- [ ] Implementar [gap 2]

**Se APPROVED:**
Feature pronta para merge.
```

---

## Severidades

{"severity":{"✅ Implemented":"Requisito 100% atendido","⚠️ Partial":"Implementado mas incompleto - pode mergear com ressalva","❌ Missing":"Não implementado - BLOQUEIA merge","🔗 Prerequisite Missing":"Dependência não existe - BLOQUEIA merge"}}

---

## Regras de Bloqueio

{"blocking":{"❌ Missing RF":"Feature incompleta - não entregar","🔗 Prerequisite Missing":"Impossível funcionar - não entregar","❌ Missing RN crítica":"Comportamento incorreto - não entregar"},"non_blocking":{"⚠️ Partial RF":"Pode mergear se documentado","⚠️ Missing RN não-crítica":"Pode mergear com TODO"}}

---

## Integração com Outros Commands

### Uso em /review
```markdown
## Phase Final: Product Validation

Após code review técnico, executar delivery-validation:
1. Carregar skill: `cat {{skill:add-delivery-validation/SKILL.md}}`
2. Executar validação de produto
3. Só aprovar se code-review E delivery-validation passarem
```

### Uso em /add-done
```markdown
## Gate Final

ANTES de mergear:
1. code-review passou? → ✅
2. delivery-validation passou? → ✅
3. Ambos ✅ → pode mergear
```

---

## Checklist

- [ ] about.md existe e está completo?
- [ ] Todos RF listados?
- [ ] Todos RN listados?
- [ ] Critérios de aceite definidos?
- [ ] Prerequisites analisados para cada RF?
- [ ] Cada requisito tem implementação verificada?
- [ ] Gaps documentados com ação necessária?
- [ ] Status final definido (APPROVED/BLOCKED)?

---

## Rules

**Do:**
- Ler about.md PRIMEIRO
- Analisar prerequisites para CADA requisito
- Verificar implementação com código (não assumir)
- Documentar gaps com ações concretas
- Bloquear se prerequisite faltando

**Dont:**
- Aprovar sem verificar prerequisites
- Assumir que 'parece implementado' é suficiente
- Ignorar regras de negócio
- Aprovar feature incompleta
- Confundir com code-review (técnico)

---

## Exemplo Prático

**Cenário:** Feature "Download de template com verificação de tier"

**about.md diz:**
```
RF01: Verificar tier do produto antes de permitir download
RN01: Produto sem tier → bloquear download
```

**Análise de Prerequisites:**
```
RF01: Verificar tier do produto
  └─ Prerequisite: Produto TEM campo tier?
     └─ Verificar: SELECT * FROM products LIMIT 1;
     └─ Resultado: ❌ Campo tier NÃO EXISTE

  └─ Prerequisite: Existe fluxo para atribuir tier?
     └─ Verificar: grep -r "tier" apps/backend/src/
     └─ Resultado: ❌ Nenhum endpoint de atribuição
```

**Decisão:** ❌ BLOCKED
- Prerequisite "campo tier" não existe
- Prerequisite "fluxo de atribuição" não existe
- Feature não pode funcionar sem esses prerequisites

**Ação:** Implementar prerequisites antes de considerar feature pronta.
