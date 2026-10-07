# Plan: Remove backlog shell wrappers — entradas exclusivamente Node

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-04
> **Delivery:** confirm

## Objective

[from conversation, no design document]

Remover os dois wrappers do backlog e deixar Node direto como único caminho distribuído e instruído para suas operações.

**When this build is done:** `backlog.sh` e `backlog-commit.sh` não existirão no source nem no novo release payload. Install/update removerá os wrappers registrados no manifest quando o cleanup conseguir removê-los sob permissões normais do filesystem; o comportamento existente em falha de unlink será preservado, sem garantia absoluta de remoção. Os agentes usarão `backlog-cli.cjs` para leitura/operações locais e `backlog-commit.cjs` para escritas que precisam de publicação. A cobertura comportamental será preservada.

## Context

O usuário confirmou a retirada definitiva das duas cascas Bash, em uma entrega. Confirmou também limpeza apenas pelo manifest existente e preservação dos testes comportamentais com chamadas Node diretas. Não existe design ou intent file. Delivery é confirm. Nenhum ticket foi declarado como carrier desta entrega; o comentário em 0021B é contexto, não autorização para vincular ou mover aquele ticket, cujo objetivo é outro.

As entregas arquivadas `2026-10-03T122024-PLAN--node-only-board` e `2026-10-04T004044-PLAN--native-node-backlog` já estabeleceram core/storage, CLI local, IDs nativos e publicação Git. Elas preservaram explicitamente wrappers por compatibilidade. Esta entrega substitui essa decisão sem reescrever seus documentos históricos.

O fluxo principal já usa Node. Os wrappers persistem como receitas de compatibilidade, help, metadata e fixtures/testes. A proibição de executar o CLI local no skill de backlog é condicionada a writes: não é uma proibição de leitura. `uses:` é metadata removida do prompt no build e não prova execução runtime.

Os strategy docs de `docs/strategy/` estão ausentes. Discovery consultou os dez artefactos relevantes por MCP: impact depth 1 e unbounded, dependencies e paths. History filtrado por layer falhou para todos com `read-failed: delivered.sh exited 127`; histórico pelo índice NOT VERIFIED. Os dois planos arquivados foram lidos. Não executar build para resolver essa consulta dentro do planejamento.

## Global Constraints

- "remover os wrappers que sao literalmente só uma casca para o CLI do board" (pedido do usuário nesta conversa; alvos resolvidos: backlog.sh e backlog-commit.sh).
- "limpeza somente pelo manifest e preservação dos testes comportamentais com chamadas Node diretas" (pergunta de confirmação nesta conversa, confirmada pelo usuário).
- "Do not hand-edit it" (AGENTS.md, inventário gerado).
- "EDIT THE SOURCE, NEVER THE BUILT COPY" (AGENTS.md, Internal Layer).

## Problem

1. Duas entradas compatíveis Bash continuam distribuídas para operações que já têm entradas Node completas.
2. Instruções ativas e help ainda oferecem essas entradas, que dependem do PATH do Bash e falham no Windows/WSL non-login observado.
3. Testes de comportamento ainda passam pelos wrappers; apagar as suites junto com eles perderia prova das operações e publicação.
4. Retirar apenas os arquivos sem limpar declarações, fixtures e instalação deixaria referências inválidas ou expectativas de compatibilidade falsas.

## Proposal

Uma entrega com preparação da prova, remoção dos dois wrappers, atualização product/internal e verificação do upgrade. Manter os seis módulos CJS canônicos e a separação entre mutação local e publicação. Não alterar regras de tickets, IDs, recusas, diagnóstico do core, lifecycle ou recovery Git.

## Current State

Risk por dependentes diretos do grafo, excluindo MENTIONS: 0 LOW, 1–2 MEDIUM, 3+ HIGH. Contagem transitiva é contexto, não score.

| Artefacto | Diretos | Transitivos | Risk |
|---|---:|---:|---|
| backlog.sh | 2 | 99 | MEDIUM |
| backlog-commit.sh | 2 | 99 | MEDIUM |
| add--backlog | 6 | 7 | HIGH |
| add--resource-path-convention | 1 | 98 | MEDIUM |
| add--doc-schemas | 22 | 98 | HIGH |
| add--doc-schemas/references/backlog.md | 2 | 99 | MEDIUM |
| add--ecosystem | 6 | 99 | HIGH |
| add--backlog/references/lifecycle.md | 7 | 8 | HIGH |
| internal add-framework--backlog | 0 | 0 | LOW |
| internal add-plan-authoring | 4 | 10 | HIGH |

Ambos wrappers têm edges diretas a backlog e resource-path-convention. Doc-schemas depende da convenção e da referência backlog. Os seis fragments board consomem backlog/lifecycle; add-new já declara publicação CJS. Paths negativos ecosystem/lifecycle/internal → wrappers não significam ausência de prosa. Não alterar slots, STEP IDs ou fragments por essa descoberta. O grafo não cobre testes, installer, release, AGENTS ou imports executáveis. AGENTS muda: inventário e overview, por meios distintos.

## Scope

### Includes

- **F1** [product] — Preparar cobertura nativa em `framwork/.codeadd/scripts/tests/backlog.bats`, `backlog-commit.bats` e `cli/tests/backlog-cli.test.js`. Comparar cada caso antes de retirar referências: trocar helpers e chamadas inline para Node; manter testes de operações, prioridade, recusas, bytes preservados, definitions, IDs e Git/recovery. Retirar somente testes exclusivamente sobre a casca Bash. Não mover toda a suíte Bats para outro runner. Substituir teste de runtime ausente do wrapper por cobertura existente aplicável, sem inventar ERROR=node-missing no CLI Node. Documentar a correspondência caso preservado/substituído/exclusivo da casca no ledger do build.
  - **Produces:** `native-backlog-behavior-coverage` — matriz de casos e execução das suites contra as entradas CJS.
- **F2** [product] — Remover `framwork/.codeadd/scripts/backlog.sh` e `backlog-commit.sh`. Atualizar help/usage de `backlog-cli.cjs` e `backlog-commit.cjs` para exemplos nativos, sem alterar gramática, stdin suportado, --record-file, root, allocation, stdout ou exit codes. Remover receitas e declarações dos wrappers em `skills/add--backlog/SKILL.md`, `references/lifecycle.md`, `skills/add--resource-path-convention/SKILL.md`, `skills/add--doc-schemas/SKILL.md`, `references/backlog.md` e `skills/add--ecosystem/SKILL.md`. Explicitar que writes do agente que precisam chegar à base usam publication entry; CLI local continua tendo modos de mutação para consumidores locais. Nenhuma promessa remanescente de compatibilidade Bash. Distinguir Node local que nunca comita de publicação que comita.
  - **Consumes:** `native-backlog-behavior-coverage` (F1).
  - **Produces:** `node-only-backlog-distribution` — source/payload sem os dois wrappers, instruções e help somente com entradas CJS.
- Ainda em **F2** [product], atualizar `cli/tests/install.e2e.test.js`, `board-feature.test.js`, `build-artefact-graph.test.js` e `fragment-placeholders.test.js`: remover leituras de wrappers deletados do source, usar CJS nas fixtures de scripts existentes e alinhar expectativas de distribuição/grafo. Qualquer fixture histórica necessária deve ser independente dos arquivos deletados. F2 deve passar os testes afetados antes de seu commit; não carregar falhas para F3.
- **F3** [product] — Acrescentar provas de migração em `cli/tests/install.e2e.test.js` e `updater.test.js`. Criar fixture de instalação antiga independente dos arquivos deletados. Provar fresh install, reinstall e update: seis módulos presentes; wrappers ausentes no pacote novo; wrappers rastreados no manifest antigo removidos; arquivos não rastreados preservados. Reutilizar cleanup atual de `cli/src/installer.js`/`updater.js`; sem limpeza por nomes nem refactor desses módulos. Se os testes revelarem defeito que exigir mudar esse contrato, parar e relatar em vez de inventar uma migração destrutiva.
  - **Consumes:** `node-only-backlog-distribution` (F2).
- **F4** [internal] — Limpar referências de compatibilidade e comentários de `workbench/commands/add-framework--backlog.md` e `workbench/skills/add-plan-authoring/SKILL.md`. Manter fluxo, statuses, carrier, idempotência, records em arquivos e comportamento DEGRADED. Atualizar overview de AGENTS para entrada nativa sem wrapper; regenerar inventário com `node scripts/inventory.js`, nunca à mão. Rebuild workbench para provar fontes atualizadas, sem editar output provider.
  - **Consumes:** `node-only-backlog-distribution` (F2).

### Does NOT Include

- `delivered.sh`, scripts/graph.js, mcp/ ou correção do objetivo original de 0021B.
- Remover outros scripts Bash ou dependência Bash da infraestrutura de testes.
- Alterar schema, statuses, prioridade, allocator, core/storage, publicação/recovery ou API/UX do board.
- Ticket 0020B: list enxuta, search por ID ou modo get.
- Reescrever docs/deliveries, changelogs antigos, dados do backlog ou notas históricas.
- Apagar arquivos não gerenciados pelo manifest, ou garantir remoção se unlink falhar. Preservar o comportamento atual; não afirmar limpeza absoluta.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Quantas entregas? | Uma | User confirmou remoção definitiva com instruções e provas na mesma entrega |
| Quais shells? | Somente backlog.sh e backlog-commit.sh | Dois wrappers; demais owners não fazem parte da mudança |
| Instalações antigas? | Cleanup pelo manifest existente | Preserva arquivos manuais e evita nova regra destrutiva |
| Testes? | Bats permanece; chamadas nativas | Preserva casos sem uma migração de runner |
| Compatibilidade? | Retirar duas entradas públicas antigas | External caller de Bash deve migrar para node; operações CJS preservadas |
| Ticket carrier? | Nenhum | Pedido não vinculou este plano ao done_when de um ticket |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Entradas únicas e sem ponte Bash/WSL | Compatibilidade com external callers que invocam os dois .sh |
| Cobertura existente preservada | Bash continua necessário para rodar Bats |
| Migração via instalação gerenciada | Cópias não rastreadas podem continuar no projeto do usuário |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Perder testes ao apagar wrappers | Medium | F1 matriz caso a caso; L2 baseline comportamental |
| Referências dangling ou prompts ainda oferecendo .sh | High | F2/F4; L1 scan e build graph/provider |
| Wrapper permanecer numa instalação gerenciada | Medium | F3 provas de reinstall/update com nomes reais |
| Cleanup apagar cópia manual | Low | F3 fixture não rastreada; algoritmo permanece manifest-owned |
| Confundir CLI local com publicação | Medium | F2 instruções condicionadas a intent e L2 publication/recovery |

## Impact

| Artefacto | Layer | Action | Reason |
|---|---|---|---|
| framwork/.codeadd/scripts/tests/backlog.bats | product | modify | F1 helpers/casos nativos |
| framwork/.codeadd/scripts/tests/backlog-commit.bats | product | modify | F1 publicação nativa |
| cli/tests/backlog-cli.test.js | product | modify | F1 retirar dependência do wrapper mantendo casos |
| framwork/.codeadd/scripts/backlog.sh | product | remove | F2 retirar wrapper local |
| framwork/.codeadd/scripts/backlog-commit.sh | product | remove | F2 retirar wrapper publication |
| framwork/.codeadd/scripts/backlog-cli.cjs | product | modify | F2 help nativo |
| framwork/.codeadd/scripts/backlog-commit.cjs | product | modify | F2 help nativo |
| framwork/.codeadd/skills/add--backlog/SKILL.md | product | modify | F2 entrada e metadata |
| framwork/.codeadd/skills/add--backlog/references/lifecycle.md | product | modify | F2 compatibilidade |
| framwork/.codeadd/skills/add--resource-path-convention/SKILL.md | product | modify | F2 caminhos/metadata |
| framwork/.codeadd/skills/add--doc-schemas/SKILL.md | product | modify | F2 tabela/metadata |
| framwork/.codeadd/skills/add--doc-schemas/references/backlog.md | product | modify | F2 transport versus owner |
| framwork/.codeadd/skills/add--ecosystem/SKILL.md | product | modify | F2 mapa/metadata |
| cli/tests/install.e2e.test.js | product | modify | F2 fixtures/expectativas; F3 fresh/reinstall |
| cli/tests/updater.test.js | product | modify | F3 upgrade gerenciado/manual |
| cli/tests/board-feature.test.js | product | modify | F2 conteúdo distribuído |
| cli/tests/build-artefact-graph.test.js | product | modify | F2 nodes e declarações |
| cli/tests/fragment-placeholders.test.js | product | modify | F2 fixture script existente |
| workbench/commands/add-framework--backlog.md | internal | modify | F4 fonte do comando |
| workbench/skills/add-plan-authoring/SKILL.md | internal | modify | F4 lifecycle interno |
| AGENTS.md | internal | modify | F4 overview e inventory gerado |

Build sidecars e provider output são gerados, não source editado. Um match vivo adicional fora da tabela deve ser classificado no levantamento inicial; se exigir edição, completar Impact/Scope antes de prosseguir. Não ampliar a retirada para outros scripts.

## Validation Matrix (spec for the build phase)

**RED first:** criar as provas de retirada/migração antes da remoção. Casos comportamentais que já passam são baseline GREEN, não alegar RED falso; regressões novas relevantes precisam RED específico. Preparar os levels antes dos F-blocks de implementação, via disciplina de testes do build.

### L1 — Ausência e referências (RED → GREEN; F2, F4)

1. Source e novo release payload não contêm exatamente `backlog.sh` nem `backlog-commit.sh`; os seis CJS canônicos permanecem. RED atual: ambos wrappers existem.
2. Zero ocorrências desses nomes nos prompts ativos product/workbench, help nativo e provider prompts gerados; metadata não tem target para nodes removidos. Scan restrito a conteúdo ativo, não arquivos históricos/dados nem fixtures de migração. RED atual: receitas, metadata e help presentes.
3. Grafo sem nodes dos dois wrappers e sem dangling declarations; risk/report usa artefactos reais, não contagens históricas hardcoded. RED atual: os dois nodes existem.
4. AGENTS inventory corresponde ao disco, overview anuncia publicação CJS. RED atual: inventory/overview anunciam wrappers.

### L2 — Comportamento nativo (baseline GREEN preservada; F1, F2)

1. Todos casos comportamentais dos dois Bats recebem destino na matriz do ledger e rodam contra Node; nenhuma exclusão só porque o caso passa por shell. Excluir apenas asserts de casca após classificação.
2. Suites nativas core/CLI/ID/publication existentes passam. Casos verificam list/search, mutações, ordering, refusal precedence, definitions e bytes; publicação direct/worktree e recovery permanecem cobertas por testes existentes significativos.
3. Smoke Windows/PowerShell: CLI nativo lê fixture; publication entry escreve/pusha em repo descartável com bare remote usando Git nativo e record-file, sem executar Bash/WSL. Repositório real não recebe ticket de teste. Registrar plataforma efetivamente testada; não alegar macOS/Linux não executados.

### L3 — Instalação/migração (RED → GREEN; F3)

1. Fresh install do novo payload instala os seis CJS e zero wrappers.
2. Reinstall e update de fixture antiga com os dois wrappers rastreados removem ambos e suas entradas do manifest; CJS instalados permanecem funcionais.
3. Em fixture separada, ambos nomes presentes mas não rastreados são preservados pelo cleanup; nenhum delete por nome fora do manifest.
4. RED da retirada deve usar payload construído a partir do source atual, onde wrappers ainda existem; fixture sem wrappers feita pelo próprio teste só prova cleanup e pode já passar. Registrar essa baseline GREEN separadamente.

### L4 — Gates de distribuição/coerência (F1–F4)

1. Product build e workbench build passam; warnings existentes registrados no baseline, nenhum novo warning/dangling causado pela retirada.
2. Executar suites CLI relevantes e Bats backlog/publication pelo runner oficial, inventory check e checks requeridos pelos layer owners. Usar `scripts/run-tests.js` via npm para o caminho suportado no Windows.
3. Scan final classifica todos matches restantes em source/tests/config ativo; só permitidos testes negativos, fixtures de instalação antiga e referências históricas source-only justificadas. Não aceitar chamada executável de wrapper retirado.
4. Board importa o mesmo core/storage e conserva os testes existentes aplicáveis; nenhum novo teste visual para mudança sem UI.

**GREEN = L1 e L3 migração GREEN, baselines L2 preservadas e L4 passando.** Build ledger guarda comandos, resultados, case map e limitações de plataforma. Nenhum gate depende de uma review companion.

## Execution Order

1. **F1 [product]**: preservar testes antes de apagar as entradas antigas. Commit executável com wrappers ainda presentes.
2. **F2 [product]**: retirar wrappers, limpar owners product e alinhar fixtures/expectativas affected no mesmo bloco. Todos os testes afetados passam antes do commit; nenhuma falha causada pela retirada pode atravessar o checkpoint.
3. **F3 [product]**: acrescentar e executar provas de migração sobre o product já GREEN.
4. **F4 [internal]**: limpar fontes internas, atualizar overview e regenerar inventory; rebuild workbench. Entrega completa GREEN antes de PR.

Aplicar um commit por F-block e hard stops do build. Per-block: F1 L2; F2 L1 product/L2 e suites de fixtures/distribuição affected; F3 L3; F4 L1 internal e L4 final. A preparação RED-first não autoriza editar output ou correr publicações reais do backlog.

## Reviewer Handoff

O build deixa no ledger os arquivos por F-block, os levels e seus resultados, matriz dos casos preservados/excluídos, plataforma real, decisões alteradas e motivos. Fazer o cold readback/final audit próprios do build; nenhum reviewer escreve companion.

Hunt:
1. Testes de negócio apagados como se fossem testes do wrapper.
2. Teste de upgrade com fixture já sem wrapper que nunca poderia reproduzir a regressão.
3. Fixtures antigas tentando ler os arquivos deletados do source.
4. Declaração `mention:` apontando a node que deixou de existir.
5. Help ou prompt ainda oferecendo Bash, ou CLI local recomendado para escrita que exige publicação.
6. Limpeza extrapolando manifest, histórico reescrito ou AGENTS inventory editado manualmente.
7. Caller externo Bash ainda tratado como compatível: documentar a remoção no changelog desta entrega, pelo estágio owner, sem alterar histórico.

## References

- AGENTS.md — layers, inventory, generated source/build boundaries.
- docs/deliveries/2026-10-03T122024-PLAN--node-only-board/plan.md — core/CLI/HTTP e compatibilidade anterior.
- docs/deliveries/2026-10-04T004044-PLAN--native-node-backlog/plan.md — IDs/publication nativos e wrappers preservados.
- cli/src/installer.js e cli/src/updater.js — cleanup manifest-owned existente, sem implementação prevista aqui.
- Confirmação do usuário nesta conversa — duas decisões de migração fechadas.

## Next Steps

`/add-framework--build remove-backlog-shell-wrappers`

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-04 | Plano inicial após confirmação de migração manifest-only e testes nativos preservados |
| 2026-10-04 | Review fix-then-ok: correções de fixtures/expectativas movidas para F2 para checkpoint GREEN; outcome de cleanup qualificado para permissões normais e falhas unlink existentes |
| 2026-10-04 | Implementado em 008a901, f0d76d1, b1c33ed e 1e772e2; final audit concluída, CLI 1789/Bats 66/board 31 GREEN; changelog docs/changelog/2026-10-04T184214-remove-backlog-shell-wrappers.md |
