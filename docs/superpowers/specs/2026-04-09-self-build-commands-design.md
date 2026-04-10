# Design: Comandos Self-Build e Reestruturação de Responsabilidades

**Data:** 2026-04-09
**Status:** Aprovado

## Contexto

O framework ADD possui duas camadas:

- **Produto** — artefatos em `framwork/.codeadd/` (commands, skills, agents, scripts) distribuídos a 15 providers via `scripts/build.js`
- **Interna** — ferramentas de desenvolvimento em `.claude/` (commands, skills, agents) que constroem e mantêm o framework

Os comandos atuais (`add.strategy`, `add.make`) são projetados para operar sobre a camada de produto. Quando usados para evoluir a própria camada interna, escrevem em `framwork/.codeadd/` em vez de `.claude/`, exigindo movimentação manual. Não existe comando dedicado para evoluir a infraestrutura de desenvolvimento.

## Decisões

### 1. CLAUDE.md como Mapa Estrutural

O `CLAUDE.md` na raiz do projeto passa a conter um bloco de contexto estrutural que descreve o projeto. Todos os comandos (internos e de produto) consomem este mapa como primeiro passo do fluxo.

**Conteúdo:**

- **Anatomia do projeto** — as duas camadas (`.claude/` = ferramentas internas, `framwork/.codeadd/` = produto distribuído), diretórios-chave e seus papéis
- **Pipeline** — fluxo de build (`framwork/.codeadd/` -> `scripts/build.js` -> `provider-map.json` -> 15 providers), o que o CI faz
- **Web/Docs** — estrutura de `web/`, páginas, SVGs, como a documentação pública é organizada

Puro mapa. Sem regras de boundary por comando (cada comando mantém suas próprias regras no seu prompt).

### 2. Novo comando: `add.self-plan`

**Propósito:** Planejamento documentado para mudanças estruturais na camada interna. Invocado pelo usuário quando identifica que a evolução é grande/complexa.

**Escopo de atuação:** `.claude/` (commands, skills, agents), `scripts/`, `CLAUDE.md`

**Fluxo:**

1. **Carregar contexto** — lê CLAUDE.md para entender a estrutura, depois lê os artefatos afetados
2. **Análise** — entende o estado atual do que precisa mudar, identifica impactos (ex: mudar um skill afeta quais commands?)
3. **Plano** — gera documento com: o que mudar, por que, impactos, ordem de execução
4. **Output** — salva em `docs/self-plan/PLAN-[slug].md`

**Regras:**

- Análise e documentação apenas — nunca implementa
- Pode recomendar deprecação/remoção de artefatos
- Deve mapear dependências entre artefatos (ex: `build` depende do skill `building-commands`)

### 3. Novo comando: `add.self-build`

**Propósito:** Evolui artefatos da camada interna. Para melhorias pontuais, faz tudo sozinho. Para mudanças grandes, executa a partir de um plano do `self-plan`.

**Escopo de atuação:** `.claude/` (commands, skills, agents), `scripts/`, `CLAUDE.md`

**Modo pontual (sem plano prévio):**

1. **Carregar contexto** — lê CLAUDE.md + artefato(s) alvo
2. **Análise rápida** — identifica o que precisa mudar e impactos diretos
3. **Proposta** — apresenta mudança ao usuário, aguarda aprovação
4. **Implementação** — aplica a mudança
5. **Validação** — verifica que o artefato modificado está coerente

**Modo planejado (com plano do `self-plan`):**

1. **Carregar plano** — lê `docs/self-plan/PLAN-[slug].md`
2. **Carregar contexto** — lê CLAUDE.md + artefatos listados no plano
3. **Execução sequencial** — implementa item a item do plano, com checkpoint de aprovação entre itens
4. **Validação** — verifica coerência do conjunto

**Capacidades:**

- Criar novos artefatos em `.claude/` (commands, skills, agents)
- Modificar artefatos existentes
- Deprecar/remover artefatos
- Atualizar `scripts/` e `CLAUDE.md`

**Regras:**

- Nunca escreve em `framwork/.codeadd/`
- Deve carregar o skill `building-commands` ao criar/modificar commands ou skills
- Aprovação do usuário antes de cada mudança

### 4. Rename dos comandos existentes

- `add.strategy` -> `add.plan`
- `add.make` -> `add.build`

O conteúdo dos comandos não muda, apenas o nome dos arquivos. Referências internas (se houver) devem ser atualizadas.

### 5. Mapa de responsabilidades

| Camada | Planejamento | Implementacao |
|--------|-------------|---------------|
| Produto (`framwork/.codeadd/`) | `add.plan` | `add.build` |
| Interna (`.claude/`, `scripts/`, `CLAUDE.md`) | `add.self-plan` | `add.self-build` |
| Documentacao publica (`web/`, `README`) | — | `add.sync` |
| Release (tags, changelog) | — | `add.release` |

Simetria: `plan`/`build` para o produto, `self-plan`/`self-build` para a infraestrutura interna.

### 6. Skill `building-commands`

Sem mudanças. Continua existindo como skill carregado sob demanda por `add.build` e `add.self-build` quando criam/modificam commands ou skills.

O CLAUDE.md nao substitui o skill — sao coisas diferentes:

- CLAUDE.md = **o que o projeto e** (mapa estrutural)
- `building-commands` = **como escrever bons prompts** (tecnicas, padroes)

## Fora de escopo

- Mudanças funcionais em `add.sync` e `add.release`
- Mudanças no skill `building-commands`
- Mudanças na pipeline de build (`scripts/build.js`, `provider-map.json`)
- Mudanças nos artefatos de produto em `framwork/.codeadd/`
