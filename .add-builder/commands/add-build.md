# ADD Build - Executor de Commands, Skills e Scripts

> **LANG:** PT-BR (texto) | EN (código, git)
> **SKILL:** Aplicar `building-commands` em TODOS os outputs

Executor que transforma PRDs em artefatos funcionais (commands, skills, scripts).

---

## Spec

```json
{"gates":["product_identified","prd_loaded","design_approved","tests_pass"],"order":["identify_product","load_prd","design","implement","test","document"],"outputs":{"command":"[produto]/.claude/commands/*.md","skill":"[produto]/.claude/skills/*/SKILL.md","script":"[produto]/.add/scripts/*"}}
```

---

## ⛔⛔⛔ EXECUÇÃO SEQUENCIAL OBRIGATÓRIA ⛔⛔⛔

**ETAPAS EM ORDEM:**
```
STEP 1: Carregar PRD/Contexto    → LER PRIMEIRO
STEP 2: Design aprovado?         → SE NÃO: PARAR E APRESENTAR
STEP 3: Carregar skills          → building-commands + ecosystem-map
STEP 4: Implementar              → SOMENTE APÓS 1-3
STEP 5: Testar                   → SOMENTE APÓS implementar
STEP 6: Documentar               → SOMENTE APÓS testes passarem
STEP 7: Atualizar ecosystem-map  → SE add-pro
STEP 8: Completion               → Resumo final
```

**⛔ PROIBIÇÕES ABSOLUTAS:**

```
SE PRODUTO NÃO IDENTIFICADO:
  ⛔ NÃO USE: Write em QUALQUER diretório
  ⛔ NÃO USE: Edit em QUALQUER artefato
  ⛔ NÃO FAÇA: Qualquer implementação
  ✅ FAÇA: Identificar produto (listar add-*/ e perguntar)

SE PRD/CONTEXTO NÃO CARREGADO:
  ⛔ NÃO USE: Write em [produto]/.claude/commands/
  ⛔ NÃO USE: Write em [produto]/.claude/skills/
  ⛔ NÃO USE: Write em [produto]/.add/scripts/
  ⛔ NÃO FAÇA: Implementação de qualquer artefato
  ✅ FAÇA: Carregar PRD ou pedir descrição

SE DESIGN NÃO APROVADO:
  ⛔ NÃO USE: Write para criar artefatos
  ⛔ NÃO USE: Edit em artefatos existentes
  ⛔ NÃO FAÇA: Implementação
  ✅ FAÇA: Apresentar design e aguardar aprovação

SE building-commands SKILL NÃO CARREGADA:
  ⛔ NÃO USE: Write em commands
  ⛔ NÃO FAÇA: Criar estrutura de command
  ✅ FAÇA: Ler .claude\skills\building-commands\SKILL.md
```

---

## Modo de Operação

```
/add-build PRD-[produto]-[slug]       → Executar PRD específico (produto no nome)
/add-build [produto] [tipo] [nome]    → Build direto (sem PRD, para simples)
/add-build --optimize [path]          → Otimizar artefato existente
```

**Exemplos:**
```
/add-build PRD-add-pro-hotfix-optimization
/add-build add-free command add-diagnose
/add-build --optimize add-pro/.claude/commands/add-feature.md
```

**Tipos válidos:** `command` | `skill` | `script`

---

## STEP 0: Identificar Produto Alvo (OBRIGATÓRIO)

### 0.1 Descobrir Produtos Disponíveis

**EXECUTAR:** Listar diretórios `add-*` na raiz do projeto.

**Produtos conhecidos:**
| Produto | Descrição |
|---------|-----------|
| `add-free` | Tier gratuito |
| `add-pro` | Tier pago |
| `add-experimental` | Laboratório |
| `add-quick-launch` | App standalone |

### 0.2 Extrair Produto do Contexto

**Se PRD especificado:** Extrair produto do nome do PRD (`PRD-[produto]-[slug]`)

**Se build direto:** Produto é o primeiro argumento

**Se --optimize:** Extrair produto do path do artefato

### 0.3 Definir Paths de Output

```markdown
**Produto:** [add-xxx]
**Commands:** [produto]/.claude/commands/
**Skills:** [produto]/.claude/skills/
**Scripts:** [produto]/.add/scripts/
```

**⛔ SE PRODUTO NÃO IDENTIFICADO:**
```
⛔ NÃO USE: Write em qualquer diretório
✅ FAÇA: Perguntar qual produto é o contexto
```

---

## STEP 1: Carregar Contexto (OBRIGATÓRIO)

### 1.1 Se PRD especificado

```bash
# Ler PRD (produto está no nome)
docs/prd/PRD-[produto]-[slug].md
```

**Extrair do PRD:**
- Produto alvo
- Tipo de artefato (command/skill/script)
- Escopo (inclui/não inclui)
- Decisões validadas
- Trade-offs aceitos

### 1.2 Se build direto (sem PRD)

**Somente para builds SIMPLES.** Coletar:

```markdown
**Produto:** [add-xxx]
**Tipo:** [command|skill|script]
**Nome:** [kebab-case]
**Propósito:** [1 linha]
**Escopo:** [o que faz / o que NÃO faz]
```

**Se complexo:** Recomendar `/add-strategy [produto]` primeiro.

### 1.3 Se --optimize

```markdown
1. Extrair produto do path do artefato
2. Ler artefato atual
3. Ler building-commands skill
4. Identificar gaps vs skill
5. Listar melhorias propostas
```

---

## STEP 2: Design [STOP]

**⛔ GATE:** Não implementar sem aprovação do design.

### 2.1 Apresentar Design

```markdown
## Design: [Nome do Artefato]

**Produto:** [add-xxx]
**Tipo:** [command|skill|script]
**Path:** [produto]/[caminho final]

### Estrutura Proposta

[Outline do artefato - seções principais, fluxo]

### Gates Planejados (se command)

| Gate | Condição | Proibições |
|------|----------|------------|
| [gate 1] | [quando bloqueia] | [ferramentas bloqueadas] |

### Checklist de Validação

Vou aplicar building-commands skill:
- [ ] Top-of-file blocking section
- [ ] STEP em vez de Phase
- [ ] Linguagem imperativa
- [ ] Gates com proibições de ferramentas
- [ ] Ordem obrigatória explícita

### Baseado em

- PRD: [link se existir]
- Referências: [commands/skills similares]

---

Aprova esse design?
```

### 2.2 Aguardar Aprovação

**PARAR E ESPERAR.** Só prosseguir após:
- `Ok` / `Sim` / `Aprovo`
- Ou ajustes solicitados → refazer design

---

## STEP 3: Carregar Skills (OBRIGATÓRIO)

**ANTES de implementar, LER:**

```
.claude\skills\building-commands\SKILL.md           # SEMPRE
.claude/skills/add-ecosystem-map/SKILL.md    # SEMPRE (visão do ecossistema)
.claude/skills/token-efficiency/             # SEMPRE
.claude/skills/documentation-style/          # Se gerar docs
```

### Checklist building-commands (APLICAR)

```
□ Top-of-file blocking section (proibições ANTES das instruções)
□ Usa STEP (imperativo) em vez de Phase (documentativo)
□ Numeração sequencial INTEIRA (1, 2, 3... NUNCA 2.5, 6.5)
□ Linguagem imperativa (EXECUTE, NÃO FAÇA, CONFIRME)
□ Gates usam proibições de FERRAMENTAS específicas
□ Condition blocks: SE [condição]: ⛔ NÃO USE [ferramenta]
□ Ordem obrigatória explícita
□ Checklists com checkboxes (não timelines)
□ Spec JSON compacto no topo
```

**⛔ NUMERAÇÃO FRACIONADA PROIBIDA:**
```
❌ ERRADO: STEP 6, STEP 6.5, STEP 7  (6.5 não é subtópico de 6)
✅ CERTO:  STEP 6, STEP 7, STEP 8   (renumerar a sequência)

SE precisar inserir passo entre existentes:
  → RENUMERAR todos os passos subsequentes
  → NUNCA usar .5 ou similar para "encaixar"
```

---

## STEP 4: Implementar

### 4.1 Por Tipo de Artefato

#### Command ([produto]/.claude/commands/*.md)

**Estrutura obrigatória:**

```markdown
# [Nome do Command]

> **LANG:** PT-BR (texto) | EN (código, git)

[Descrição 1 linha]

---

## Spec
{json compacto}

---

## ⛔⛔⛔ EXECUÇÃO SEQUENCIAL OBRIGATÓRIA ⛔⛔⛔

**ETAPAS EM ORDEM:**
[lista numerada]

**⛔ PROIBIÇÕES ABSOLUTAS:**
[condition blocks com ferramentas]

---

## STEP 1: ...
## STEP 2: ...

---

## Rules
{json do/dont}
```

#### Skill ([produto]/.claude/skills/*/SKILL.md)

**Estrutura obrigatória:**

```markdown
---
name: [kebab-case]
description: [quando usar - max 20 palavras]
---

# [Nome]

## Overview
[2-3 linhas]

## When to Use
[lista]

## When NOT to Use
[lista]

## Core [seções específicas]

## Validation Checklist
[checkboxes]
```

#### Script ([produto]/.add/scripts/*)

**Estrutura obrigatória:**

```bash
#!/bin/bash
# ============================================
# [NOME DO SCRIPT]
# [Descrição 1 linha]
# ============================================
# Usage: bash [produto]/.add/scripts/[nome].sh [args]
# Dependencies: [lista]
# ============================================

# --- Detection ---
[detectar contexto]

# --- Execution ---
[lógica principal]

# --- Output ---
[output estruturado]
```

### 4.2 Validar Durante Implementação

A cada seção escrita, verificar:

```
□ Linguagem imperativa? (não informativa)
□ Gates têm proibições de ferramentas?
□ Ordem é obrigatória? (não sugerida)
□ Checkboxes? (não timelines)
```

---

## STEP 5: Testar

### 5.1 Teste Mental (OBRIGATÓRIO)

Simular execução do artefato:

```markdown
## Teste Mental: [Artefato]

### Cenário 1: Happy Path
- Input: [o que o usuário faz]
- Esperado: [o que deve acontecer]
- ✅/❌: [passa?]

### Cenário 2: Gate Violation
- Input: [usuário tenta pular etapa]
- Esperado: [gate bloqueia]
- ✅/❌: [passa?]

### Cenário 3: Edge Case
- Input: [situação incomum]
- Esperado: [comportamento adequado]
- ✅/❌: [passa?]
```

### 5.2 Validar vs building-commands

```
□ Agente consegue pular gates? (deve ser impossível)
□ Proibições são específicas? (ferramentas, não genéricas)
□ Ordem é bypassável? (não deve ser)
```

**Se falhar:** Voltar ao STEP 4 e corrigir.

---

## STEP 6: Documentar

### 6.1 Changelog (OBRIGATÓRIO se novo/major)

```
docs/changelog/YYYY-MM-DD-[action]-[what].md
```

**Ações:** `add` | `update` | `refactor` | `remove`

### 6.2 Atualizar PRD (se existir)

```markdown
## Changelog do PRD

| Data | Mudança |
|------|---------|
| YYYY-MM-DD | Implementado via /add-build |
```

**Status:** `draft` → `implemented`

---

## STEP 7: Atualizar Ecosystem Map (SE add-pro)

**Condição:** Apenas se o artefato criado/modificado é do **add-pro**.

**SE produto = add-pro E tipo = command ou skill:**

1. Ler `.claude/skills/add-ecosystem-map/SKILL.md`
2. Verificar se o artefato já está listado
3. **SE novo:** Adicionar entrada na tabela correspondente
4. **SE modificado:** Atualizar descrição se necessário
5. Atualizar "Last Updated" com data e ação

**Formato de atualização:**
```markdown
## Last Updated
YYYY-MM-DD - [add|update|remove] [command|skill] [nome]
```

**SE produto ≠ add-pro:** Pular este step.

---

## STEP 8: Completion

```markdown
## Build Complete!

**Produto:** [add-xxx]
**Artefato:** [produto]/[path]
**Tipo:** [command|skill|script]
**PRD:** [link se existir]

### Criado/Atualizado:
- [arquivo 1]
- [arquivo 2]

### Validações:
- ✅ building-commands aplicado
- ✅ Teste mental passou
- ✅ Changelog criado

### Para usar:
[instrução de uso do artefato]
```

---

## Modo Optimize

Se `/add-build --optimize [path]`:

### STEP 1: Analisar Artefato

```markdown
## Análise: [path]

### vs building-commands skill:

| Critério | Status | Problema |
|----------|--------|----------|
| Top-of-file blocking | ✅/❌ | [se ❌, o que falta] |
| STEP vs Phase | ✅/❌ | [se ❌, o que falta] |
| Linguagem imperativa | ✅/❌ | [se ❌, exemplos] |
| Gates com ferramentas | ✅/❌ | [se ❌, o que falta] |
| Ordem obrigatória | ✅/❌ | [se ❌, o que falta] |

### Melhorias Propostas:
1. [melhoria 1]
2. [melhoria 2]

Aplicar otimizações?
```

### STEP 2-7: Seguir fluxo normal

---

## Rules

```json
{"do":["Carregar PRD/contexto PRIMEIRO","Apresentar design ANTES de implementar","Carregar building-commands skill SEMPRE","Aplicar TODOS os padrões da skill","Testar mentalmente ANTES de finalizar","Documentar mudanças","Usar numeração sequencial INTEIRA (1,2,3)","Renumerar passos se inserir novo"],"dont":["Implementar sem PRD/contexto","Pular aprovação de design","Ignorar building-commands skill","Usar linguagem informativa","Criar gates genéricos (sem ferramentas)","Usar Phase em vez de STEP","Finalizar sem teste mental","Usar numeração fracionada (2.5, 6.5)","Encaixar passos sem renumerar"]}
```
