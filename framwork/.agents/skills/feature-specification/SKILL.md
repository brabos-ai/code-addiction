<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/feature-specification/SKILL.md -->
---
name: feature-specification
description: Use when documenting feature requirements - creates/updates about.md with business rules, acceptance criteria, scope and decisions using Business Style
---

# Feature Specification

Skill para documentar especificação de features. Cria/atualiza `about.md` com requisitos, regras de negócio, escopo e decisões.

**Princípio:** Documentar O QUE e POR QUE, não COMO.

---

## Spec

{"trigger":"document feature requirements","output":"docs/features/[ID]/about.md","style":"documentation-style/business.md","focus":"business rules, scope, decisions","required":["token-efficiency","documentation-style/cache"]}

---

## Quando Usar

{"whenToUse":{"Nova feature":"Criar about.md via questionário","about.md existe incompleto":"Complementar seções faltantes","Requisitos mudaram":"Atualizar seções afetadas","Escopo expandiu":"Adicionar novos requisitos, atualizar escopo"},"dontUse":"Para documentar análise técnica (usar feature-discovery)"}

---

## Workflow

**REQUIRED:** Aplicar antes de escrever:
- `token-efficiency` - JSON minificado, tabelas, sem decoração
- `documentation-style/cache` - Ler→Preservar→Complementar→Metadata

### Phase 1: Verificar Estado (Cache Documental)

```bash
cat docs/features/[FEATURE_ID]/about.md
```

|Estado|Ação|
|---|---|
|Não existe/vazio|Phase 2 (questionário)|
|Parcialmente preenchido|Phase 3 (completar)|
|Completo|Verificar se precisa atualização|

### Phase 2: Questionário Estratégico

**Objetivo:** Extrair requisitos via perguntas estruturadas.

**Técnica:** Inferir respostas + validar rapidamente.

```markdown
## Validação Rápida - [Feature]

Analisei o contexto e inferi as respostas abaixo.
**Responda "Ok" se correto, ou apenas as correções.**

---

### 1. Escopo & Objetivo

**1.1 Objetivo principal:**
→ **[INFERIDO]:** [descrição baseada no contexto]

**1.2 Usuários:**
- a) Usuários finais autenticados
- b) Administradores
- c) Sistemas externos (API)
→ **[PROVÁVEL: ?]**

**1.3 Problema resolvido:**
→ **[INFERIDO]:** [descrição]

---

### 2. Regras de Negócio

**2.1 Validações:**
→ **[INFERIDO]:** [lista]

**2.2 Limites/quotas:**
- a) Sem limites
- b) Por usuário
- c) Por workspace/plan
→ **[PROVÁVEL: a]**

---

### 3. Escopo

**3.1 Incluído:**
→ **[INFERIDO]:** [lista]

**3.2 Excluído:**
→ **[INFERIDO]:** [lista]

---

✅ Responda "Ok" ou liste correções.
```

### Phase 3: Estruturar Documentação

**Template about.md (Business Style):**

```markdown
# Feature: [Nome]

## Summary
{"status":"discovery|planning|dev|review|done","scope":["item1","item2"],"decisions":["key decision"],"blockers":[],"next":"próxima ação"}

---

## Objetivo

**Problema:** [descrição do problema atual]
**Solução:** [como a feature resolve]
**Valor:** [benefício mensurável]

---

## Requisitos

### Funcionais
- **[RF01]:** [descrição ~15 palavras]
- **[RF02]:** [descrição ~15 palavras]

### Não-Funcionais
- **[RNF01]:** [performance/segurança/etc]

---

## Regras de Negócio

- **[RN01]:** [condição] → [resultado]
- **[RN02]:** [condição] → [resultado]

---

## Escopo

### Camadas Obrigatórias (baseado no questionário)

| Validado com Usuário | Camada | Incluída? |
|----------------------|--------|-----------|
| [item do questionário] | Frontend/Backend/DB | ✅ |

**⚠️ Se camada é necessária para usuário USAR a feature → OBRIGATÓRIA.**

### Incluído
- [Item que FAZ parte]

### Excluído (APENAS se não impacta usabilidade)
- [Item que NÃO faz parte] - [motivo] - **Impacta uso?** Não

**Regra:** NÃO PODE excluir camada que torna feature inutilizável.

---

## Decisões

| Decisão | Razão | Alternativa descartada |
|---------|-------|------------------------|
| [Escolha A] | [Por que A] | [B - por que não] |

---

## Edge Cases

- **[Caso]:** [tratamento definido]

---

## Critérios de Aceite

- [ ] [Critério verificável e testável]
- [ ] [Critério verificável e testável]

---

## Spec

{"feature":"[id]","type":"[new/enhancement/fix]","priority":"[high/medium/low]","users":["tipo1"],"deps":["feature/sistema"]}

---

## Updates
[{"date":"YYYY-MM-DD","change":"descrição curta da mudança"}]

---

## Metadata
{"updated":"YYYY-MM-DD","sessions":N,"by":"[subagent]"}
```

**IMPORTANTE:** Sempre atualizar `## Summary` e `## Updates` quando houver mudanças.

### Phase 4: Validar e Persistir

**Checklist antes de salvar:**
- [ ] Requisitos têm IDs (RF/RNF/RN)
- [ ] Escopo tem incluído E excluído
- [ ] Decisões têm alternativa descartada
- [ ] Critérios são verificáveis
- [ ] Metadata atualizado

---

## Notação de Requisitos

### Funcionais (RF)
```
- **[RF01]:** [Ação] [objeto] [condição] (~15-20 palavras)
```

**Exemplos:**
```
- **RF01:** Usuário pode marcar notificação como lida com um clique
- **RF02:** Sistema agrupa notificações do mesmo tipo em até 24h
```

### Não-Funcionais (RNF)
```
- **[RNF01]:** [Métrica] [valor] [contexto]
```

**Exemplos:**
```
- **RNF01:** Lista carrega em menos de 200ms para até 100 itens
- **RNF02:** Suporta 1000 requisições/minuto por tenant
```

### Regras de Negócio (RN)
```
- **[RN01]:** [condição] → [resultado]
```

**Exemplos:**
```
- **RN01:** Notificação não lida após 30 dias → arquivar automaticamente
- **RN02:** Usuário plano Free → máximo 50 notificações armazenadas
```

---

## Regras

**Do:**
- Usar IDs para todos os requisitos
- Incluir alternativas descartadas em decisões
- Definir tratamento para cada edge case
- Critérios verificáveis e testáveis
- Atualizar metadata
- Preencher Camadas Obrigatórias
- Validar que escopo permite USAR a feature

**Dont:**
- Misturar o que com como (técnico vai no discovery)
- Requisitos vagos (sistema deve ser rápido)
- Decisões sem justificativa
- Edge cases sem tratamento definido
- Excluir camada que torna feature inutilizável
- Excluir frontend se questionário validou UI

---

## Integração com ADD

Quando ADD dispara subagente para especificação:

```markdown
**Skills:**
```bash
cat .codeadd/skills/feature-specification/SKILL.md
cat .codeadd/skills/documentation-style/business.md
```

**Contexto:**
- Feature: [ID]
- Descrição inicial: [do usuário]

**Instruções:**
1. Verificar about.md existente
2. Se vazio → questionário estratégico
3. Se incompleto → completar seções
4. Atualizar metadata
```

---

## Checklist

- [ ] Problema claramente definido?
- [ ] Requisitos com IDs (RF/RNF)?
- [ ] Regras de negócio com IDs (RN)?
- [ ] **Camadas Obrigatórias preenchidas?** (CRÍTICO)
- [ ] **Nenhuma camada necessária foi excluída?** (CRÍTICO)
- [ ] Escopo: incluído E excluído?
- [ ] Decisões com alternativas descartadas?
- [ ] Edge cases com tratamento?
- [ ] Critérios verificáveis?
- [ ] Spec JSON no final?
- [ ] Metadata atualizado?
