# PRD: Xray → Project Patterns Skill

> **Status:** implemented
> **Type:** architecture
> **Created:** 2026-04-09
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

O `add.xray` hoje gera arquivos soltos em `.codeadd/project/` (APP-BACKEND.md, LIB-DATABASE.md, etc). Esses arquivos contêm padrões reais do projeto mas:
- Não seguem a estrutura de skill (não são portáveis)
- Não têm mecanismo de busca semântica eficiente
- São pouco consumidos pelos comandos de desenvolvimento (plan, build, autopilot)
- Não podem ser copiados facilmente para outros providers de AI coding

O framework ADD distribui commands/skills para 15+ providers, mas o **output gerado no projeto do usuário** vive em `.codeadd/` do repositório dele. Evoluir esse output para uma skill estruturada dá ao usuário um artefato portável que funciona em qualquer provider — com ou sem o framework ADD instalado.

## Problem

1. **Consumo ineficiente:** Agentes precisam ler arquivos inteiros para encontrar um padrão específico (ex: logging pattern do backend). Sem index, sem busca por tópico.
2. **Não-portável:** Os arquivos flat em `.codeadd/project/` não seguem nenhum padrão reconhecível por outros providers.
3. **Desconectado do pipeline:** `add.plan`, `add.build`, `add.autopilot` quase não consomem os padrões gerados — `add.build` e `add.autopilot` só checam `decisions.jsonl`.
4. **Sem discoverability:** O agente não sabe quais áreas estão mapeadas sem listar o diretório manualmente.

## Proposal

Evoluir o output do `add.xray` de arquivos flat para uma **skill estruturada** em `.codeadd/skills/project-patterns/` no projeto do usuário. Cada área (backend, frontend, database, etc.) terá seu próprio arquivo `.md` com `##` headers padronizados que servem como index semântico. Um script auxiliar (`pattern-search.sh`) permite busca eficiente por área/tópico, retornando headers + line ranges para leitura cirúrgica.

A criação da skill será guiada pela skill `add-skill-creator` para garantir aderência às boas práticas (CSO, anti-rationalization, estrutura de tiers).

### Context Engineering Alignment (PRD0009)

A skill gerada DEVE seguir os princípios de context engineering já implementados no framework:

- **Grep-as-retrieval** (Jha et al.) — cada `##` header abre com topic sentence que funciona como target de grep. Agents fazem `grep "^## " backend.md` para descobrir tópicos → `Read offset:X limit:Y` para carregar só o chunk necessário. Sem leitura eager.
- **Section-chunks ~100-150 palavras** (~128 tokens) — sweet spot empírico para retrieval. Cada chunk é auto-contido: topic sentence + padrão extractivo + 1 exemplo canônico do código real.
- **Extractive only** — padrões documentados são exemplos reais extraídos do código, não paráfrases. Backend-analyzer.md já faz isso ("encontrar exemplo REAL"). Proibido: sumarização abstrativa, explicações genéricas.
- **Heterogeneous zone budget** — SKILL.md (index) = zero compressão. Área files: frontmatter + TL;DR = zero compressão. Pattern chunks = extractive ≤150 palavras. Exemplos de código = 1 canônico por tópico (≤10 linhas).
- **JIT loading model** — consumidores (plan, build, autopilot) NUNCA carregam a skill inteira. Fluxo: `status.sh` → `pattern-search.sh [área]` → `Read offset:X limit:Y`. Cada etapa carrega progressivamente menos contexto.
- **Frontmatter + TL;DR obrigatório** em cada arquivo de área, per `add-doc-schemas` convention. Agents leem TL;DR para decidir se precisam mergulhar nos chunks.
- **TOC obrigatório** se >3 seções `##` no arquivo de área — lista flat de anchors logo após TL;DR.

## Scope

### Includes

- Reestruturar output do `add.xray` de `.codeadd/project/*.md` → `.codeadd/skills/project-patterns/`
- SKILL.md principal com metadata, index de áreas, e instruções de uso
- Um arquivo `.md` por área detectada (backend.md, frontend.md, database.md, etc.)
- `##` headers padronizados como index semântico (ex: `## Logging`, `## Validation`, `## State Management`)
- Script `pattern-search.sh` — input: área(s) e/ou tópico(s), output: headers + line ranges formatados
- Atualizar `status.sh` para reportar áreas mapeadas na skill
- Atualizar specialist analyzers (backend-analyzer.md, frontend-analyzer.md, etc.) para novo output path e formato
- Atualizar `add-architecture-discovery/SKILL.md` para nova estrutura de output
- Atualizar `add.xray` command para orquestrar a nova estrutura
- Atualizar consumer commands (`add.plan`, `add.build`, `add.autopilot`, `add.review`, `add.test`) para consumir via `pattern-search.sh`
- Atualizar instruções em CLAUDE.md/AGENTS.md/GEMINI.md (no STEP 7 do xray) com instrução de como usar o script de busca
- Usar `add-skill-creator` como referência para estrutura da skill gerada

### Does NOT Include (important!)

- Migração automática de `.codeadd/project/*.md` existentes (usuário re-executa xray)
- Mudanças no `architecture-discover.sh` (script de discovery continua o mesmo)
- Mudanças no `build.js` (skill do projeto do usuário não é compilada pelo framework)
- Mudanças no `provider-map.json` (nenhum novo artefato distribuído)
- `stack-context.md` — permanece em `.codeadd/project/` (schema separado, doc-schemas)
- `decisions.jsonl` — permanece em `.codeadd/project/` (runtime de feature, não padrão)
- `code-quality-review.md` — permanece em `docs/` (relatório, não padrão de projeto)

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Onde guardar output? | `.codeadd/skills/project-patterns/` no projeto do usuário | Skill portável, padrão de mercado, copiável para qualquer provider |
| Estrutura de arquivos? | Um `.md` por área (backend.md, frontend.md, etc.) + SKILL.md index | Balanceia granularidade com navegabilidade; `##` headers = index semântico |
| Script de busca? | Sim — `pattern-search.sh` | Viabiliza consumo eficiente por agentes (área + tópico → line range) |
| Atualizar status.sh? | Sim — reportar áreas mapeadas | Discoverability: agente sabe quais frentes existem antes de buscar |
| Integrar consumers? | Sim — plan, build, autopilot, review, test | É onde o valor real está; hoje operam quase cegos para padrões |
| Guiar criação da skill? | Via `add-skill-creator` (CSO, anti-rationalization, tier structure) | Garante qualidade da skill gerada seguindo boas práticas |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Portabilidade: skill copiável para qualquer provider | Backward compat: consumers precisam ser atualizados |
| Busca semântica eficiente via `##` headers + script | Complexidade: mais partes móveis (script, skill structure) |
| Padrões consumidos ativamente por plan/build/autopilot | Re-execução necessária: projetos existentes precisam rodar xray novamente |
| Estrutura padronizada via skill-creator | Mais tempo de execução do xray (gera skill ao invés de flat files) |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Quebrar consumers atuais que fazem glob em `.codeadd/project/*.md` | Alta | Atualizar todos consumers no mesmo PRD; `stack-context.md` e `decisions.jsonl` permanecem em `.codeadd/project/` |
| Pattern-search.sh falhar em edge cases (Windows, paths com espaço) | Média | Seguir mesmo padrão robusto do `status.sh` (set -euo pipefail, portabilidade) |
| Skill gerada muito grande para context window | Baixa | Headers `##` permitem leitura parcial; script retorna ranges cirúrgicos |
| Providers não reconhecerem a skill | Baixa | Skill segue formato standard markdown; SKILL.md com frontmatter YAML é universalmente reconhecido |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `framwork/.codeadd/commands/add.xray.md` | **Rewrite** — nova estrutura de output, dispatch para skill structure |
| `framwork/.codeadd/skills/add-architecture-discovery/SKILL.md` | **Update** — output paths, ImplementationPatternsReference section |
| `framwork/.codeadd/skills/add-architecture-discovery/backend-analyzer.md` | **Update** — output path + format com `##` headers padronizados |
| `framwork/.codeadd/skills/add-architecture-discovery/frontend-analyzer.md` | **Update** — output path + format com `##` headers padronizados |
| `framwork/.codeadd/skills/add-architecture-discovery/database-analyzer.md` | **Update** — output path + format com `##` headers padronizados |
| `framwork/.codeadd/skills/add-architecture-discovery/code-quality-analyzer.md` | **None** — output permanece em `docs/` |
| `framwork/.codeadd/scripts/status.sh` | **Update** — seção PROJECT PATTERNS para nova estrutura + áreas mapeadas |
| `framwork/.codeadd/scripts/pattern-search.sh` | **Create** — novo script de busca semântica |
| `framwork/.codeadd/commands/add.plan.md` | **Update** — consumir padrões via pattern-search.sh |
| `framwork/.codeadd/commands/add.build.md` | **Update** — consumir padrões via pattern-search.sh |
| `framwork/.codeadd/commands/add.autopilot.md` | **Update** — consumir padrões via pattern-search.sh |
| `framwork/.codeadd/commands/add.review.md` | **Update** — consumir padrões via pattern-search.sh |
| `framwork/.codeadd/commands/add.test.md` | **Update** — consumir padrões via pattern-search.sh |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | **Update** — adicionar pattern-search.sh na ecosystem map |
| `framwork/.codeadd/skills/add-skill-creator/SKILL.md` | **None** — consumido como referência, não modificado |
| CLAUDE.md / AGENTS.md / GEMINI.md (user project) | **Update via xray STEP 7** — instruções de uso do pattern-search.sh |

## Technical Design Notes

### Skill Structure (generated in user's project)

```
.codeadd/skills/project-patterns/
├── SKILL.md              # Index: metadata, áreas disponíveis, instruções de busca
├── backend.md            # Padrões backend (## Logging, ## Validation, ## Error Handling, ...)
├── frontend.md           # Padrões frontend (## State Management, ## Components, ## Styling, ...)
├── database.md           # Padrões database (## ORM, ## Migrations, ## Queries, ...)
└── [area].md             # Qualquer área detectada (cli.md, worker.md, shared.md, ...)
```

### Area File Format (context engineering compliant)

Cada arquivo de área segue esta estrutura, alinhada com `add-doc-schemas` e `add-token-efficiency`:

```markdown
---
area: backend
generated: 2026-04-09
app-path: apps/server
framework: nestjs
---

## TL;DR

Backend NestJS com logging via Pino, validação class-validator, auth JWT, repository pattern com Prisma. 8 padrões documentados.

## TOC

- [Logging](#logging)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Authentication](#authentication)
- [Middleware](#middleware)
- [API Conventions](#api-conventions)
- [Database Interaction](#database-interaction)
- [Testing](#testing)

## Logging

Pino como logger principal com correlationId por request via AsyncLocalStorage. Format JSON em produção, pretty em dev.

Library: pino
Config: `{"level":"info","transport":"pino-pretty (dev)","context":"correlationId,userId"}`

```typescript
// apps/server/src/common/logger.service.ts:12
this.logger.info({ correlationId, userId }, 'Order created');
```

## Validation

[topic sentence + extractive pattern + 1 exemplo real, ~100-150 palavras]
...
```

**Regras do formato:**
- Frontmatter: `area`, `generated`, `app-path`, `framework` (machine-parseable)
- TL;DR: ≤60 palavras, extractivo, resume stack + quantidade de padrões
- TOC: obrigatório se >3 seções, flat bullets com anchors
- Cada `##` chunk: topic sentence first (grep target) → config/spec em JSON minificado → 1 exemplo real do código (≤10 linhas, com path:line)
- Chunks ~100-150 palavras (~128 tokens) — split se ultrapassar
- Código: sempre com referência `// path:line` para rastreabilidade

### pattern-search.sh Interface

```bash
# Listar áreas mapeadas
bash .codeadd/scripts/pattern-search.sh --list

# Buscar todos tópicos de uma área
bash .codeadd/scripts/pattern-search.sh backend

# Buscar tópico específico
bash .codeadd/scripts/pattern-search.sh backend logging

# Múltiplas áreas
bash .codeadd/scripts/pattern-search.sh backend,frontend

# Output format:
# AREA:backend FILE:.codeadd/skills/project-patterns/backend.md
# TOPIC:Logging LINES:15-42
# TOPIC:Validation LINES:43-78
# TOPIC:Error Handling LINES:79-110
```

### status.sh New Output

```
PROJECT_SKILL:.codeadd/skills/project-patterns
PROJECT_AREAS:backend,frontend,database
PROJECT_TOPICS:12
```

### Consumer Integration Pattern

Commands (plan, build, autopilot) passam a consumir assim:

```
1. Run status.sh → get PROJECT_AREAS
2. Run pattern-search.sh [relevant-area] → get TOPIC + LINES
3. Read file offset:START limit:LENGTH → only the pattern needed
```

## References

- `framwork/.codeadd/commands/add.xray.md` — current xray implementation
- `framwork/.codeadd/skills/add-architecture-discovery/SKILL.md` — current discovery skill
- `framwork/.codeadd/skills/add-skill-creator/SKILL.md` — skill creation best practices
- `framwork/.codeadd/scripts/status.sh` — current status script (L461-481 PROJECT PATTERNS)
- `{{doc:PRD0009}}` — Documentation Context Engineering (grep-as-retrieval, JIT loading, extractive-only, zone budgets)
- `{{skill:add-doc-schemas/SKILL.md}}` — canonical schemas, section-chunk caps, validation gate
- `{{skill:add-token-efficiency/SKILL.md}}` — heterogeneous zone budget, abstractive ban
- `{{skill:add-documentation-style/SKILL.md}}` — universal formatting rules, cache documental
- `{{skill:add-doc-ref-convention/SKILL.md}}` — stable IDs, `{{doc:ID}}` resolution

---

## Next Steps

`/add.build PRD0011-xray-project-skill-output`

---

## PRD Changelog

| Date | Change |
|------|--------|
| 2026-04-09 | Initial creation |
| 2026-04-09 | Added Context Engineering alignment section (PRD0009 principles: grep-as-retrieval, JIT loading, extractive-only, zone budgets, section-chunks ~128 tokens). Added area file format spec with concrete example. Added PRD0009 + doc-schemas/token-efficiency/doc-ref-convention references. |
