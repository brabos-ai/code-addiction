# ADD Build - Executor de Commands, Skills e Scripts

> **LANG:** PT-BR (texto) | EN (código, git)
> **SKILL:** Aplicar `building-commands` em TODOS os outputs

Executor que transforma PRDs em artefatos funcionais (commands, skills, scripts) dentro do framework code-addiction (`framwork/`).

---

## Spec

```json
{"gates":["prd_loaded","design_approved","tests_pass"],"order":["load_prd","design","implement","test","document"],"outputs":{"command":"framwork/.claude/commands/*.md","skill":"framwork/.codeadd/skills/*/SKILL.md","script":"framwork/.codeadd/scripts/*","codeadd_command":"framwork/.codeadd/commands/*.md","agent_workflow":"framwork/.agent/workflows/*.md","agent_skill":"framwork/.agents/skills/*/SKILL.md"}}
```

---

## ⛔⛔⛔ EXECUÇÃO SEQUENCIAL OBRIGATÓRIA ⛔⛔⛔

**ETAPAS EM ORDEM:**
```
STEP 1: Carregar PRD/Contexto    → LER PRIMEIRO
STEP 2: Design aprovado?         → SE NÃO: PARAR E APRESENTAR
STEP 3: Carregar skills          → building-commands + ecosystem-map
STEP 4: Implementar              → SOMENTE APÓS 1-3 (em framwork/)
STEP 5: Testar                   → SOMENTE APÓS implementar
STEP 6: Documentar               → SOMENTE APÓS testes passarem
STEP 7: Completion               → Resumo final
```

**⛔ PROIBIÇÕES ABSOLUTAS:**

```
SE PRD/CONTEXTO NÃO CARREGADO:
  ⛔ NÃO USE: Write em framwork/
  ⛔ NÃO FAÇA: Implementação de qualquer artefato
  ✅ FAÇA: Carregar PRD ou pedir descrição

SE DESIGN NÃO APROVADO:
  ⛔ NÃO USE: Write para criar artefatos em framwork/
  ⛔ NÃO USE: Edit em artefatos existentes em framwork/
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
/add-build PRD-[slug]                 → Executar PRD específico
/add-build [tipo] [nome]             → Build direto (sem PRD, para simples)
/add-build --optimize [path]          → Otimizar artefato existente em framwork/
```

**Exemplos:**
```
/add-build PRD-hotfix-optimization
/add-build command add-diagnose
/add-build --optimize framwork/.claude/commands/add-feature.md
```

**Tipos válidos:** `command` | `skill` | `script` | `workflow`

**Paths do framework:**
| Tipo | Path |
|------|------|
| Command (Claude) | `framwork/.claude/commands/*.md` |
| Command (CodeADD) | `framwork/.codeadd/commands/*.md` |
| Workflow (Agent) | `framwork/.agent/workflows/*.md` |
| Skill (CodeADD) | `framwork/.codeadd/skills/*/SKILL.md` |
| Skill (Agent) | `framwork/.agents/skills/*/SKILL.md` |
| Script | `framwork/.codeadd/scripts/*` |

---

## STEP 1: Carregar Contexto (OBRIGATÓRIO)

### 1.0 Verificar Estrutura do Framework

**EXECUTAR:** Verificar que `framwork/` existe e listar sua estrutura:

```bash
ls framwork/.claude/commands/ framwork/.codeadd/commands/ framwork/.codeadd/skills/ framwork/.agents/skills/ framwork/.agent/workflows/ framwork/.codeadd/scripts/ 2>/dev/null
```

### 1.1 Se PRD especificado

```bash
# Ler PRD
docs/prd/PRD-[slug].md
```

**Extrair do PRD:**
- Tipo de artefato (command/skill/script/workflow)
- Escopo (inclui/não inclui)
- Decisões validadas
- Trade-offs aceitos

### 1.2 Se build direto (sem PRD)

**Somente para builds SIMPLES.** Coletar:

```markdown
**Tipo:** [command|skill|script|workflow]
**Nome:** [kebab-case]
**Propósito:** [1 linha]
**Escopo:** [o que faz / o que NÃO faz]
**Providers:** [claude|codeadd|agent] (em quais provider dirs criar)
```

**Se complexo:** Recomendar `/add-strategy` primeiro.

### 1.3 Se --optimize

```markdown
1. Ler artefato atual em framwork/
2. Ler building-commands skill
3. Identificar gaps vs skill
4. Listar melhorias propostas
```

---

## STEP 2: Design [STOP]

**⛔ GATE:** Não implementar sem aprovação do design.

### 2.1 Apresentar Design

```markdown
## Design: [Nome do Artefato]

**Tipo:** [command|skill|script|workflow]
**Path:** framwork/[caminho final]

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
.claude/skills/code-addiction-ecosystem/SKILL.md    # SEMPRE (visão do ecossistema)
.claude/skills/token-efficiency/             # SEMPRE
.claude/skills/documentation-style/          # Se gerar docs
framwork/.codeadd/skills/                    # Referência de skills existentes
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

#### Command (framwork/.claude/commands/*.md + framwork/.codeadd/commands/*.md)

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

**NOTA:** Criar em TODOS os provider dirs relevantes:
- `framwork/.claude/commands/` (Claude Code)
- `framwork/.codeadd/commands/` (CodeADD)
- `framwork/.agent/workflows/` (Agent - se aplicável)

#### Skill (framwork/.codeadd/skills/*/SKILL.md + framwork/.agents/skills/*/SKILL.md)

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

#### Script (framwork/.codeadd/scripts/*)

**Estrutura obrigatória:**

```bash
#!/bin/bash
# ============================================
# [NOME DO SCRIPT]
# [Descrição 1 linha]
# ============================================
# Usage: bash framwork/.codeadd/scripts/[nome].sh [args]
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

## STEP 7: Completion

```markdown
## Build Complete!

**Artefato:** framwork/[path]
**Tipo:** [command|skill|script|workflow]
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

### STEP 2-6: Seguir fluxo normal

---

## Rules

```json
{"do":["Carregar PRD/contexto PRIMEIRO","Apresentar design ANTES de implementar","Carregar building-commands skill SEMPRE","Aplicar TODOS os padrões da skill","Testar mentalmente ANTES de finalizar","Documentar mudanças e atualizar ecosystem map","Usar numeração sequencial INTEIRA (1,2,3)","Renumerar passos se inserir novo","Criar artefatos em TODOS os provider dirs relevantes de framwork/"],"dont":["Implementar sem PRD/contexto","Pular aprovação de design","Ignorar building-commands skill","Usar linguagem informativa","Criar gates genéricos (sem ferramentas)","Usar Phase em vez de STEP","Finalizar sem teste mental","Usar numeração fracionada (2.5, 6.5)","Encaixar passos sem renumerar","Escrever fora de framwork/"]}
```
