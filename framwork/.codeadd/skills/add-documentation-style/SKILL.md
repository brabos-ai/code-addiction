---
name: add-documentation-style
description: |
  Hub de estilos de documentação. Roteia para o estilo correto. Inclui técnica de cache documental obrigatória.
---

# Documentation Style Guide

Hub central para estilos de documentação. Cada tipo de documento segue um estilo otimizado.

## Spec

{"cache":{"mandatory":true,"metadata":"updated+sessions+by"},"max":{"words_item":20,"words_paragraph":100},"tokenEfficiency":{"ref":"token-efficiency skill","mandatory":true}}

---

## Roteamento de Estilos

{"routing":{"Technical":{"docs":"plan.md,changelog.md,architecture","file":"./technical.md"},"Design":{"docs":"design.md,UI specs","file":"./design.md"},"Business":{"docs":"about.md,discovery.md,brainstorm/","file":"./business.md"}}}

**IMPORTANTE:** Carregar o arquivo de estilo correto ANTES de escrever documentação.

---

## Técnica de Cache Documental (OBRIGATÓRIO)

**Princípio:** Ler antes de escrever. Atualizar, não recriar.

### Workflow Obrigatório

```
1. LER documento existente (se houver)
   ↓
2. IDENTIFICAR seções preenchidas vs vazias/template
   ↓
3. PRESERVAR informações válidas existentes
   ↓
4. COMPLEMENTAR com novos achados
   ↓
5. ATUALIZAR metadata no final
```

### Metadata Padrão

Adicionar no FINAL de todo documento atualizado:

```markdown
---
## Metadata
{"updated":"YYYY-MM-DD","sessions":N,"by":"[subagent-type]"}
```

### Regras de Cache

| Situação | Ação |
|----------|------|
| Documento não existe | Criar do zero com metadata |
| Documento existe vazio/template | Preencher + metadata |
| Documento existe preenchido | Ler → Complementar → Atualizar metadata |
| Informação conflitante | Nova informação prevalece, registrar mudança |

### Anti-Patterns de Cache

```
❌ Ignorar documento existente e recriar do zero
❌ Sobrescrever informações válidas sem necessidade
❌ Esquecer de atualizar metadata
❌ Duplicar informações entre documentos
```

---

## Regras Universais

Aplicam-se a TODOS os estilos.

**REQUIRED:** Aplicar token-efficiency skill em toda documentação.

### Idioma

| Contexto | Idioma |
|----------|--------|
| Texto, explicações | PT-BR |
| Código, git, termos técnicos | EN |

### Regras

ALWAYS:
- Use paths with glob patterns when applicable
- Use minified JSON for Spec (structured data only)
- Use tables for >3 items
- Keep maximum ~20 words/item
- Keep maximum ~100 words/paragraph
- Validate against token-efficiency checklist

NEVER:
- Use emojis in headers
- Inline code >10 lines (link to file instead)
- Use aspirational content (futuramente, idealmente)
- Duplicate content between documents
- Leave TODOs without owner/deadline
- Use decorative formatting (ASCII art)

---

## Quick Reference

### Quando usar cada estilo

```
Technical → "COMO implementar" (estrutura, código, configs)
Design    → "COMO se parece" (layouts, fluxos, componentes UI)
Business  → "O QUE e POR QUE" (requisitos, decisões, contexto)
```

### Checklist Pré-Documentação

1. Identificar tipo de documento
2. Carregar estilo correto: `cat {{skill:add-documentation-style/[estilo].md}}`
3. Aplicar formato do estilo
4. Validar contra regras universais

---

## Arquivos de Estilo

- [./technical.md](./technical.md) - Specs técnicas, planos de implementação
- [./design.md](./design.md) - UX specs, layouts, componentes visuais
- [./business.md](./business.md) - Features, requisitos, brainstorms
