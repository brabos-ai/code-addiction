# Business Style

Estilo para documentação de negócio: features, requisitos, brainstorms, discovery.

**Usar em:** about.md, discovery.md, docs/brainstorm/

---

## Princípio

Clareza sobre o "O QUE" e "POR QUE". Contexto suficiente para entender decisões. Bullets estruturados, não parágrafos longos.

---

## Estrutura Obrigatória

```markdown
# [Tipo]: [Nome]

[Contexto em 3-5 linhas - problema, solução, impacto]

---

## [Seções específicas do documento]

### Formato de Seções
- **[Item]:** descrição concisa (~15-20 palavras)
- **[Item]:** descrição concisa

### Decisões
| Decisão | Razão | Alternativa descartada |
|---------|-------|------------------------|

### Critérios/Checklist
- [ ] [Critério verificável]
```

---

## Formatos por Tipo de Documento

### about.md (Feature Spec)

```markdown
# Feature: [Nome]

[O QUE: descrição da funcionalidade]
[POR QUE: problema resolvido]
[PARA QUEM: usuários impactados]

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

### Incluído
- [Item que FAZ parte]
- [Item que FAZ parte]

### Excluído
- [Item que NÃO faz parte] - [motivo breve]

---

## Decisões

| Decisão | Razão | Alternativa descartada |
|---------|-------|------------------------|
| [Escolha A] | [Por que A] | [B - por que não] |

---

## Edge Cases

- **[Caso]:** [tratamento definido]
- **[Caso]:** [tratamento definido]

---

## Critérios de Aceite

- [ ] [Critério verificável e testável]
- [ ] [Critério verificável e testável]

---

## Spec (Resumo Token-Efficient)

{"feature":"[id]","type":"[new/enhancement/fix]","priority":"[high/medium/low]","users":["tipo1","tipo2"],"deps":["feature/sistema"]}
```

### discovery.md (Codebase Analysis)

```markdown
# Discovery: [Feature]

Análise técnica do codebase para implementação de [feature].

---

## Contexto Técnico

### Stack Relevante
- **Backend:** [tecnologias específicas para esta feature]
- **Frontend:** [tecnologias específicas]
- **Infra:** [Redis/queues/etc se aplicável]

### Padrões Identificados
- **[Padrão]:** usado em [local] - [como aplicar aqui]

---

## Análise do Codebase

### Arquivos Relacionados
- `path/file.ts` - [propósito, ~10 palavras]
- `path/file.ts` - [propósito]

### Features Similares
- **[Feature X]:** [o que reutilizar] - `path/`
- **[Feature Y]:** [o que reutilizar] - `path/`

---

## Mapeamento de Arquivos

### Criar
- `path/new-file.ts` - [propósito]

### Modificar
- `path/existing.ts` - [o que muda]

---

## Dependências

### Internas
- `@fnd/domain` - [entities/enums necessários]
- `@fnd/database` - [repositories necessários]

### Externas
- `package@version` - [propósito]

---

## Premissas Técnicas

- **[Premissa]:** [impacto se incorreta]
- **[Premissa]:** [impacto se incorreta]

---

## Riscos Identificados

- **[Risco]:** [mitigação]

---

## Resumo para Planejamento

[3-5 linhas sumarizando: complexidade, pontos de atenção, dependências críticas]
```

### brainstorm/ (Idea Exploration)

```markdown
# Brainstorm: [Tópico]

**Data:** [YYYY-MM-DD]
**Participantes:** [quem participou]

---

## Contexto

[Problema ou oportunidade que motivou a discussão - 3-5 linhas]

---

## O que o Usuário Quer

### Necessidade Principal
[Descrição do ponto de vista do usuário, sem jargão técnico]

### Cenários de Uso
- **[Cenário 1]:** [situação prática]
- **[Cenário 2]:** [situação prática]

---

## Descobertas

### O que já existe
- [Funcionalidade existente] - [como ajuda]

### O que falta
- [Gap identificado] - [impacto]

---

## Ideias Discutidas

### [Ideia A]
- **Proposta:** [descrição]
- **Prós:** [vantagens]
- **Contras:** [desvantagens]

### [Ideia B]
- **Proposta:** [descrição]
- **Prós:** [vantagens]
- **Contras:** [desvantagens]

---

## Decisões Preliminares

| Decisão | Razão |
|---------|-------|
| [Escolha] | [Justificativa] |

---

## Dúvidas em Aberto

- [ ] [Pergunta que precisa resposta]
- [ ] [Pergunta que precisa resposta]

---

## Próximos Passos

- [ ] [Ação] - [responsável se definido]

---

## Para `/feature`

> [Frase descrevendo a feature para iniciar discovery formal]
```

---

## Notação de Requisitos

### Formato Padrão
```
- **[ID]:** [Ação] [objeto] [condição/contexto] (~15-20 palavras)
```

### Exemplos
```
- **RF01:** Usuário pode marcar notificação como lida com um clique
- **RF02:** Sistema agrupa notificações do mesmo tipo em até 24h
- **RNF01:** Lista carrega em menos de 200ms para até 100 itens
```

---

## Notação de Regras de Negócio

### Formato Padrão
```
- **[ID]:** [condição] → [resultado]
```

### Exemplos
```
- **RN01:** Notificação não lida após 30 dias → arquivar automaticamente
- **RN02:** Usuário com plano Free → máximo 50 notificações armazenadas
- **RN03:** Notificação de segurança → sempre enviar email além de in-app
```

---

## Notação de Decisões

### Tabela Padrão
```markdown
| Decisão | Razão | Alternativa descartada |
|---------|-------|------------------------|
| WebSocket | Real-time sem polling | SSE - menos suporte mobile |
| PostgreSQL | Já usado no projeto | MongoDB - complexidade extra |
```

### Quando Expandir
Se a decisão é complexa, usar seção dedicada:
```markdown
### Decisão: [Título]

**Contexto:** [situação que gerou a necessidade]

**Opções Consideradas:**
1. **[Opção A]:** [descrição] - [prós/contras]
2. **[Opção B]:** [descrição] - [prós/contras]

**Escolha:** [Opção X] porque [razão principal]

**Consequências:** [impactos da decisão]
```

---

## Anti-Patterns

| Errado | Correto |
|--------|---------|
| Parágrafos longos explicando requisitos | Bullets com **[ID]:** formato |
| "O sistema deve ser rápido" | **RNF01:** resposta em <200ms |
| Decisões sem alternativas | Tabela com alternativa descartada |
| Edge cases sem tratamento | **[Caso]:** [tratamento definido] |
| Critérios vagos | Critérios verificáveis e testáveis |
| Jargão técnico em brainstorm | Linguagem do usuário |

---

## Checklist por Documento

### about.md
- [ ] Problema claramente definido
- [ ] Requisitos com IDs (RF/RNF)
- [ ] Regras de negócio com IDs (RN)
- [ ] Escopo: incluído E excluído
- [ ] Decisões com alternativas descartadas
- [ ] Critérios de aceite verificáveis
- [ ] Spec token-efficient no final

### discovery.md
- [ ] Arquivos relacionados com paths
- [ ] Features similares identificadas
- [ ] Mapeamento criar/modificar
- [ ] Premissas com impacto
- [ ] Resumo para planejamento

### brainstorm/
- [ ] Data e participantes
- [ ] Contexto do ponto de vista do usuário
- [ ] Linguagem sem jargão técnico
- [ ] Dúvidas em aberto listadas
- [ ] Frase para `/feature` se aplicável
