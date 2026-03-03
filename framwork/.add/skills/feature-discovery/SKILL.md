---
name: feature-discovery
description: Use when analyzing codebase for a specific feature - creates/updates discovery.md with technical analysis, patterns, files mapping and caches for future sessions
---

# Feature Discovery

Skill para análise técnica do codebase focada em uma feature específica. Persiste análise no `discovery.md` para reutilização entre sessões.

**Princípio:** Analisar uma vez, usar sempre. Cache por feature.

---

## Spec

{"trigger":"analyze codebase for feature","output":"docs/features/[ID]/discovery.md","style":"documentation-style/business.md","cache":{"location":"discovery.md","check":"metadata.updated","ttl":"until codebase changes"},"required":["token-efficiency","documentation-style/cache"]}

---

## Quando Usar

{"whenToUse":{"Nova feature sem discovery.md":"Análise completa","discovery.md existe mas vazio":"Análise completa","discovery.md existe preenchido":"Ler cache, complementar se necessário","Mudanças significativas no codebase":"Atualizar seções afetadas"},"dontUse":"Para análise global do projeto (usar architecture-discovery)"}

---

## Workflow

**REQUIRED:** Aplicar antes de escrever:
- `token-efficiency` - JSON minificado, tabelas, sem decoração
- `documentation-style/cache` - Ler→Preservar→Complementar→Metadata

### Phase 1: Verificar Cache (Cache Documental)

```bash
cat docs/features/[FEATURE_ID]/discovery.md
```

|Estado|Ação|
|---|---|
|Preenchido e recente|Usar como contexto, pular para Phase 4|
|Vazio/template|Phase 2 (análise completa)|
|Desatualizado|Phase 2 com foco nas mudanças|

### Phase 2: Análise Focada

**Objetivo:** Analisar APENAS o que é relevante para a feature.

```
1. Ler about.md → entender requisitos
2. Identificar domínio/área afetada
3. Buscar arquivos relacionados (Glob/Grep)
4. Identificar padrões existentes similares
5. Mapear dependências
```

**O que analisar:**

{"analysisAreas":{"Entidades":"Models/entities relacionadas ao domínio","Padrões":"Features similares como referência","Infraestrutura":"Services, repositories, controllers existentes","Frontend":"Components, hooks, stores relacionados","Integrações":"APIs externas, webhooks, eventos"}}

### Phase 3: Estruturar Descobertas

**Template discovery.md (Business Style):**

```markdown
# Discovery: [Feature]

## Summary
{"patterns":["padrão principal"],"files_create":N,"files_modify":N,"deps":["dep crítica"],"complexity":"low|medium|high","risks":["risco principal"]}

---

## Contexto Técnico

### Stack Relevante
- **Backend:** [tecnologias específicas]
- **Frontend:** [tecnologias específicas]
- **Infra:** [se aplicável]

### Padrões Identificados
- **[Padrão]:** usado em [local] - [como aplicar aqui]

---

## Análise do Codebase

### Arquivos Relacionados
- `path/file.ts` - [propósito, ~10 palavras]

### Features Similares
- **[Feature X]:** [o que reutilizar] - `path/`

---

## Mapeamento de Arquivos

### Criar
- `path/new-file.ts` - [propósito]

### Modificar
- `path/existing.ts` - [o que muda]

---

## Prerequisites Analysis (CRÍTICO)

**Objetivo:** Identificar O QUE PRECISA EXISTIR para a feature funcionar.

**Para CADA requisito do about.md, analisar:**

### Dados/Modelos Necessários
| Requisito | Prerequisite | Existe? | Ação |
|-----------|--------------|---------|------|
| RF01 | Campo X na entidade Y | ✅/❌ | Criar se ❌ |

### Fluxos Dependentes
| Requisito | Fluxo Necessário | Existe? | Ação |
|-----------|------------------|---------|------|
| RF01 | Endpoint para atribuir X | ✅/❌ | Criar se ❌ |

### Integrações
| Requisito | Integração | Existe? | Ação |
|-----------|------------|---------|------|
| RF01 | API externa Y | ✅/❌ | Configurar se ❌ |

### Dados Existentes
| Requisito | Dados Necessários | Populados? | Ação |
|-----------|-------------------|------------|------|
| RF01 | Registros com campo X | ✅/❌ | Migrar se ❌ |

**Regra:** Se algum prerequisite está ❌, a feature NÃO PODE ser considerada completa sem implementá-lo primeiro.

---

## Delivery Completeness (CRÍTICO)

**Pergunta central:** Com esse escopo, o usuário final consegue USAR a funcionalidade?

### Validação de Entrega Funcional

| Validado no Questionário | Camada Necessária | No Escopo? | Usuário consegue usar? |
|--------------------------|-------------------|------------|------------------------|
| [item validado] | Frontend/Backend/DB | ✅/❌ | ✅/❌ |

**Exemplos de falha:**
- Validou "checkbox" mas excluiu frontend → ❌ Usuário não consegue usar
- Validou "escolha de tipo" mas excluiu frontend → ❌ Usuário não consegue usar
- Apenas backend sem UI → ❌ Feature inutilizável (exceto APIs puras)

**⚠️ Se "Usuário consegue usar?" = ❌ → Escopo INCOMPLETO. Adicionar camada faltante.**

---

## Dependências

### Internas
- `@package/module` - [o que usar]

### Externas
- `package@version` - [propósito]

---

## Premissas Técnicas

- **[Premissa]:** [impacto se incorreta]

---

## Riscos Identificados

- **[Risco]:** [mitigação]

---

## Resumo para Planejamento

[3-5 linhas: complexidade, pontos de atenção, dependências críticas]

---

## Updates
[{"date":"YYYY-MM-DD","change":"descrição curta"}]

---

## Metadata
{"updated":"YYYY-MM-DD","sessions":N,"by":"[subagent]"}
```

**IMPORTANTE:** Sempre atualizar `## Summary` e `## Updates` quando houver mudanças.

### Phase 4: Persistir/Atualizar

**Se criando:** Escrever discovery.md completo com metadata

**Se atualizando:**
1. Preservar informações válidas existentes
2. Complementar com novos achados
3. Incrementar `sessions` no metadata
4. Atualizar `updated` date

---

## Regras

**Do:**
- Ler about.md primeiro (entender o que precisa)
- Analisar prerequisites para CADA requisito (CRÍTICO)
- Validar Delivery Completeness (CRÍTICO)
- Perguntar: usuário consegue USAR com esse escopo?
- Buscar features similares como referência
- Focar apenas no domínio relevante
- Atualizar metadata ao final
- Usar paths concretos e verificáveis

**Dont:**
- Analisar codebase inteiro (focar na feature)
- Ignorar discovery.md existente
- Sobrescrever informações válidas
- Criar arquivos redundantes
- Listar arquivos sem relevância clara
- Assumir que prerequisite existe sem verificar
- Pular seção de Prerequisites Analysis
- Pular seção de Delivery Completeness
- Aceitar escopo que torna feature inutilizável

---

## Integração com ADD

Quando ADD dispara subagente para discovery:

```markdown
**Skills:**
```bash
cat .add/skills/feature-discovery/SKILL.md
cat .add/skills/documentation-style/business.md
```

**Contexto:**
- Feature: [ID]
- about.md: [conteúdo ou path]

**Instruções:**
1. Verificar discovery.md existente
2. Se vazio/desatualizado → análise completa
3. Se preenchido → usar como cache
4. Atualizar metadata
```

---

## Checklist

- [ ] Verificou discovery.md existente?
- [ ] Leu about.md para entender requisitos?
- [ ] Identificou features similares?
- [ ] Mapeou arquivos a criar/modificar?
- [ ] **Analisou prerequisites para CADA requisito?** (CRÍTICO)
- [ ] Prerequisites faltantes estão no escopo da feature?
- [ ] **Validou Delivery Completeness?** (CRÍTICO)
- [ ] **Usuário consegue USAR a feature com esse escopo?** (CRÍTICO)
- [ ] Listou dependências?
- [ ] Documentou premissas e riscos?
- [ ] Atualizou metadata?
