# Plan: Compact backlog reads — resumo para seleção, get para detalhe

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-04
> **Delivery:** confirm

## Objective

[from conversation, no design document]

Reduzir o conteúdo que o agente recebe ao listar e buscar tickets. Carregar o registro completo somente quando precisar de detalhe, por ID exato ou opção explícita.

**When this build is done:** list/search terão JSONL resumido como padrão, get devolverá um ticket completo por ID exato, --full preservará a leitura completa e list --ids devolverá identidades na ordem do board. Consumidores product/internal selecionarão pelo resumo e carregarão detalhe antes de usar campos omitidos. A API do board continuará recebendo registros completos.

**Delivery complete:** desenvolvimento em worktree isolada e branch dedicada, evidências TDD RED → GREEN, PR aberta e CI GREEN confirmado no head SHA atual da PR. Implementação local concluída ou checks ainda pending não satisfazem esse estado.

## Context

O usuário confirmou get próprio, JSONL resumido e sete campos: id, status, title, tldr, theme, labels, updated_at. Confirmou a proposta de preservar busca sobre conteúdo completo, prioridade e diagnósticos, e distinguir apresentação da fila de resolução de alvo.

O ticket 0020B é referência de intenção e medição, não carrier de lifecycle: não há intent file declarando ticket e este plano não move o board. Seu done_when histórico recomenda fallback open → all; a confirmação desta conversa substitui essa recomendação por busca em todos os statuses ao resolver um alvo, evitando falsa unicidade. A proposta de colunas fixas e a alternativa de substituir get por search foram rejeitadas na confirmação.

**Predecessor obrigatório:** `2026-10-04T181131-PLAN--remove-backlog-shell-wrappers`. Seu post-state remove backlog.sh/backlog-commit.sh, mantém os seis CJS e preserva Bats com chamadas Node. O checkout observado em 5b2a69a já não rastreia os wrappers e usa help nativo. Isso prova source observado, não execução de todos os gates nem close-out do predecessor. Antes do primeiro bloco, o build verifica o post-state e os resultados disponíveis daquela entrega; se incompleto, para e pede concluir o predecessor. Não implementar novamente sua remoção.

Não existem design/intent file nem strategy docs. Discovery consultou o grafo e leu cinco planos relevantes. O scan inicial completo das primeiras linhas de todos os artefactos não foi concluído; discovery foi direcionada. History filtrado por layer falhou com `delivered.sh exited 127` para product e internal: histórico pelo índice NOT VERIFIED. Os planos arquivados foram lidos diretamente, sem alterar histórico.

Medição histórica registrada no 0020B: 21 tickets, 76.904 bytes; notes/done_when/paths somam 83,9%. É uma amostra datada, não número fixo que o build poderá assumir para o board vivo.

## Global Constraints

- "leve em consideracao o plano que irei executar antes deeste docs\plans\2026-10-04T181131-PLAN--remove-backlog-shell-wrappers.md" (pedido do usuário).
- "Confirma `get` próprio, JSONL resumido e os sete campos recomendados?" / "sim" (confirmação do usuário nesta conversa).
- "inclua no plano para ser executado em worktree isolada com tdd red green, abertura de PR ao finalizar o desenvolvimento e monitoramento do pipeline para garantir CI green" (pedido do usuário nesta revisão).
- "EDIT THE SOURCE, NEVER THE BUILT COPY" (AGENTS.md).
- "tickets come from the generated core at `runtime/backlog-core.cjs`, the one reader of that format" (AGENTS.md, board).

## Problem

1. O CLI imprime registros completos em list/search; seleção de alvo carrega corpo, paths e critérios que ainda não serão usados.
2. Lifecycle product/internal lê o board inteiro para recuperar um ID declarado.
3. Um resumo sem detalhe explícito esconderia notes/paths/done_when e work_id necessários ao planejamento e às guardas de fase.
4. Publication importa o parser do CLI e hoje recusa somente list/search. Acrescentar get sem ampliar essa recusa permitiria iniciar uma rota Git para leitura.
5. Buscar primeiro apenas open pode esconder outro candidato em fase diferente; truncar tldr não pode truncar o conteúdo pesquisável.

## Proposal

Estender o contrato de leitura nativo. Core mantém registros completos; apenas o renderer do CLI faz projeção e preview. Get faz lookup exato no core. Busca continua sobre texto completo e passa a incluir igualdade exata de ID. Atualizar owners de leitura e testes que dependem da saída antiga, sem mexer em regras de mutação.

### Contrato confirmado e especificação técnica

- **list padrão:** filtro open existente. --all inclui todos; --status mantém filtro por nome. **search padrão:** todos os statuses, substring case-insensitive em title/tldr/notes completos, além de igualdade exata case-insensitive de id. Match em notes que menciona outro ID pode produzir outros candidatos; search não substitui get. Não adicionar busca em labels, comments ou paths.
- **Resumo list/search:** exatamente sete chaves por objeto, na ordem id, status, title, tldr, theme, labels, updated_at. Não emitir notes, done_when, paths, work_id, feature, comments, created_at ou grounded. Title inteiro; theme/labels preservados, sem impor layer a projetos de usuários. Updated_at contém a parte YYYY-MM-DD de timestamp ISO válido; ausente/inválido vira null. Campo textual ausente/não string vira string vazia; labels não array vira []; valores dessas projeções nunca são persistidos.
- **TLDR preview:** máximo 120 Unicode code points, incluindo … final quando houver corte; 119 code points originais + … para entradas maiores. Não dividir surrogate pairs. Sem reduzir conteúdo persistido nem pesquisável. JSON escaping preserva tabs/newlines/quotes; não substituir JSONL por colunas.
- **Detalhe:** get <id>, lookup exato e case-sensitive no core, sem filtro de status, retorna a raw row original completa. ID ausente no board, inclusive board ausente: read bem-sucedida, TICKETS_RETURNED=0, exit 0, sem criar arquivo. Argumento id ausente: ERROR=missing-id, exit 2. ID option-looking ocupa posição literal, como outros targets existentes. Não alterar validação de duplicatas manuais do board nesta entrega.
- **--full:** list/search retornam raw rows completas, preservando bytes da serialização das linhas. Get já é full; não aceita flags de projeção. **--ids:** somente list, emite um id por linha após metadata; preserva filtro e prioridade. --full e --ids são mutuamente exclusivos.
- **Gramática:** list permite um filtro (--all OU --status <name>) e uma projeção (--full OU --ids), em qualquer ordem. Repetição, conflito, opção desconhecida e argumento excedente nas leituras são ERROR=bad-argument, exit 2; --status sem valor mantém ERROR=missing-status. Search reserva o primeiro argumento como query literal (inclusive --full/--ids/--record-file), seguido opcionalmente por --full. Get reserva o primeiro argumento como target literal e rejeita surplus. Preservar integralmente gramática/precedência de writes, inclusive surplus legacy e --record-file; não generalizar parsing novo para mutações.
- **Metadata:** manter BACKLOG_PRESENT, TICKETS_TOTAL, TICKETS_RETURNED, DAMAGED_LINES, DAMAGED_LINE, UNDEFINED_STATUS e diagnósticos existentes em todas as leituras. Acrescentar READ_VIEW=summary|full|ids. Acrescentar STATUS_COUNTS=<JSON object> com contagens do board inteiro antes do filtro, em ordem de primeira ocorrência dos statuses. O core entrega `statusCounts` como entries ordenadas [status, count], calculadas sobre todos os registros parseados antes do filtro. O adapter serializa explicitamente o objeto JSON com keys/values escapados por JSON.stringify, sem depender da ordem de enumeração de um objeto JavaScript; nomes numéricos como "10" antes de "2" conservam a ordem no texto emitido. Contar em Map ou estrutura equivalente sem prototype collisions. Não usar chaves dinâmicas STATUS_<name>, que não escapam nomes customizados. Status ausente/não string de objeto incompleto não entra nessa contagem; demais diagnósticos conservam a semântica existente.
- **Pureza:** nenhuma leitura consome stdin, aloca ID, cria definitions ou chama Git. Publication recusa list/search/get com ERROR=read-mode antes de parser/routing e sem ler record-file.
- **Consumidores:** apresentação pode usar list default open. Resolução por assunto usa search sobre todos os statuses; ambiguidade continua sendo stop. ID declarado usa get diretamente. Número antigo usa search da nota `Formerly item N.M of docs/backlog/index.md.`, depois get dos candidatos e validação exata da nota antes de selecionar. Antes de qualquer uso de notes, paths, done_when ou work_id, obter detalhe. Não inferir identidade ou work_id a partir do resumo.

## Current State

Risk por dependentes diretos, excluindo MENTIONS: 0 LOW, 1–2 MEDIUM, 3+ HIGH. Counts são snapshots consultados nesta sessão; revalidar após mudanças concorrentes. A descoberta inicial viu edges de wrappers que o predecessor remove; não perpetuar esses edges no novo plano.

| Artefacto | Diretos | Risk |
|---|---:|---|
| backlog-cli.cjs | 3 | HIGH |
| backlog-core.cjs | 1 | MEDIUM |
| backlog-commit.cjs | 3 | HIGH |
| add--backlog | 6 | HIGH |
| add--backlog/references/lifecycle.md | 7 | HIGH |
| add--doc-schemas/references/backlog.md | 2 | MEDIUM |
| add--resource-path-convention | 1 | MEDIUM |
| add--ecosystem | 6 | HIGH |
| internal add-framework--backlog | 0 | LOW |
| internal add-plan-authoring | 4 | HIGH |

Impact unbounded foi consultado como contexto; vários nós product atingem 99 dependentes. Dependencies/path mostram backlog → CLI/lifecycle/schema; CLI → core e internal → product CLI não têm path declarado. Imports executáveis não são modelados: CLI/publication/board usam core e publication usa parser/renderer. Os seis fragments board consomem owners centralizados; quatro estágios internos consomem plan-authoring. AGENTS.md não precisa mudar para este contrato; inventário não ganha script.

## Scope

### Includes

- **F1 [product] — Leitura exata e fronteira de publicação.** Em backlog-core.cjs, acrescentar get, igualdade de ID na busca e `statusCounts` como entries globais ordenadas calculadas antes do filtro, mantendo raw rows/tickets completas e diagnósticos. Em backlog-cli.cjs, aceitar get sem record capture/allocation; ampliar refusal antecipada em backlog-commit.cjs e help mínimo para get. Preparar/aplicar testes core/CLI/publication/Bats para leitura exata, ausências, busca por notes/ID, contagens globais e recusa de reads. Preservar export contracts; o renderer segue full por enquanto neste checkpoint. **Validation:** L1 get/search/contagens do core e L2 pureza/publicação.
  - **Produces:** `backlog-exact-detail-read` — get exato completo, search com ID e publication sem read routing.
  - **Produces:** `backlog-global-status-counts` — result.statusCounts com entries ordenadas do board inteiro, inclusive em leituras filtradas/get.
- **F2 [product] — Resumo e projeções.** Em backlog-cli.cjs, implementar gramática de flags apenas para reads, projeção summary/full/ids e metadata. Aproveitar tickets completos e statusCounts retornados pelo core; apenas serializar as contagens no adapter, sem transformar result.rows ou persistir normalização. Ajustar CLI/Bats e testes de consumidores que parseiam stdout antigo; usar --full em fixtures destinadas a testar registro completo e manter casos reais do resumo. Em board-phase-writes.test.js, migrar a assert existente da receita product ao get junto do lifecycle neste checkpoint; o arquivo não contém uma assert literal da receita internal que exija edição em F3. Em add--backlog/SKILL.md, lifecycle, reference backlog, resource-path-convention e ecosystem, documentar o contrato e migrar leitura product por ID para get. **Validation:** L1 projeções/gramática, L3 consumidores product e L4 peso/board.
  - **Consumes:** `backlog-exact-detail-read` (F1).
  - **Consumes:** `backlog-global-status-counts` (F1).
  - **Produces:** `backlog-summary-protocol` — resumo de sete campos, detalhe explícito, metadata e opções definidos acima.
- **F3 [internal] — Seleção e detalhe no workbench.** Em workbench/commands/add-framework--backlog.md, STEP 1 lê list --all resumido para visão do board; STEP 2 usa get para ID e search all-status para assunto/número antigo, seguido de detalhe quando necessário. Remover a receita de scan de raw lines como leitura primária por ID. Em workbench/skills/add-plan-authoring/SKILL.md, The Ticket lê get para o ID declarado antes das guardas, sem alterar carrier/status/idempotência. O fallback open → all registrado no ticket não é implementado: confirmação escolheu busca em todos os statuses para resolver alvo. **Validation:** L3 consumidores internal e L5 coerência/distribuição.
  - **Consumes:** `backlog-summary-protocol` (F2).

### Does NOT Include

- Retirar wrappers novamente, editar o predecessor ou reintroduzir compatibilidade Bash.
- Alterar schema persistido, allocator, statuses, prioridade, storage, publication/recovery Git ou writes.
- UI/API do board, novos endpoints, paginação, selected-fields genérico ou agrupamento/reordenação por theme.
- Flags de execução ativa, contagem de notes ou corte de title/theme/labels.
- Limpeza automática de --record-file, histórico/delivery-index no Windows/WSL, rewriting de archived rulings ou updates do ticket durante planejamento.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Detalhe | get próprio por ID | Identidade exata separada da busca |
| Saída | JSONL resumido | Escaping/parsing preservados; ganho principal vem do corpo removido |
| Campos | Sete campos confirmados | Identidade, fase, assunto, agrupamento e data |
| TLDR | Preview 120 code points | Limita contexto sem truncar pesquisa/storage |
| Busca para resolver alvo | Todos statuses | Não esconder ambiguidade entre open e fases iniciadas |
| Compatibilidade full | --full opt-in | Consumidores completos têm rota explícita |
| Priority | Ordem original | Theme não reorganiza o board |
| Status counts | JSON único no cabeçalho | Preserva nomes customizados sem inventar restrictions |
| Predecessor | Node-only primeiro | Testes nativos herdados, sem retrabalho de wrappers |
| Ambiente de execução | Worktree isolada e branch dedicada | Exigência do usuário; preservar checkout original |
| Desenvolvimento | TDD RED → GREEN por comportamento novo | Falha observada antes da implementação, sucesso verificado depois |
| Publicação | PR após gates locais e confirmação do primeiro push | Pedido de PR mantém o hard stop do build STEP 9 |
| Conclusão | CI GREEN no head SHA atual | Não aceitar checks antigos, pending ou falha como entrega concluída |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Seleção com payload menor | list/search default deixam de conter registro inteiro |
| get exato e consumidores claros | Um modo adicional e testes de fronteira |
| JSONL com escaping conhecido | Economia adicional de arrays/colunas |
| Busca sem candidatos ocultos | Não usar filtro open como shortcut de resolução |

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| get inicia publication Git | F1 recusa antecipada; L2 repos descartáveis/no-side-effect |
| Resumo chega ao core/HTTP | F2 projeção exclusiva no CLI; L4 API conserva corpo completo |
| TLDR cortado deixa match invisível | F1 pesquisa original; F2/L1 match após posição 120 |
| Lifecycle perde work_id/done_when | F2/F3 detalhe obrigatório; L3 owners e guardas |
| Parsing novo altera writes | F2 gramática limitada a reads; L1/L2 baselines legacy |
| Tests dependem de source removido pelo predecessor | F2 fixtures Node herdadas; L5 scan sem chamadas a wrappers |
| Metadados/status custom collide | F2 escaping/count object; L1 statuses adversariais |

## Impact

| Path | Layer | Action | Reason |
|---|---|---|---|
| framwork/.codeadd/scripts/backlog-core.cjs | product | modify | F1 get/search; full results preservados |
| framwork/.codeadd/scripts/backlog-cli.cjs | product | modify | F1 get; F2 parsing/rendering/help |
| framwork/.codeadd/scripts/backlog-commit.cjs | product | modify | F1 recusa get antes de routing |
| cli/tests/backlog-core.test.js | product | modify | F1 lookup/search e read purity |
| cli/tests/backlog-cli.test.js | product | modify | F1/F2 gramática, projections, metadata |
| cli/tests/backlog-publication.test.js | product | modify | F1/F2 read refusal e baseline writes |
| framwork/.codeadd/scripts/tests/backlog.bats | product | modify | F1/F2 testes nativos herdados |
| framwork/.codeadd/scripts/tests/backlog-commit.bats | product | modify | F1 recusa leitura nativa |
| framwork/.codeadd/skills/add--backlog/SKILL.md | product | modify | F2 read/get e target resolution |
| framwork/.codeadd/skills/add--backlog/references/lifecycle.md | product | modify | F2 get antes de guards |
| framwork/.codeadd/skills/add--doc-schemas/references/backlog.md | product | modify | F2 owner de output/keys/exit behavior |
| framwork/.codeadd/skills/add--resource-path-convention/SKILL.md | product | modify | F2 descrição de modos nativos |
| framwork/.codeadd/skills/add--ecosystem/SKILL.md | product | modify | F2 mapa da entrada |
| cli/tests/board-phase-writes.test.js | product | modify | F2 receita product get em vez de scan list |
| cli/tests/install.e2e.test.js | product | modify | F2 entrada instalada summary/get/full |
| board/test/native-backlog.test.ts | product | modify | F2 parser de stdout/full fixtures |
| board/e2e/native-backlog.spec.ts | product | modify | F2 fixtures que dependem de stdout completo |
| workbench/commands/add-framework--backlog.md | internal | modify | F3 seleção all-status/detail |
| workbench/skills/add-plan-authoring/SKILL.md | internal | modify | F3 get ID declarado |

Provider output, sidecars e board runtime são gerados por builds, não editados. board/server.mjs e backlog-storage.cjs são lidos e verificados, não modificados. Se o levantamento dos testes após o predecessor revelar outro consumidor vivo, completar Impact/Scope e consultar o grafo para qualquer novo artefacto antes de editar; não esconder mudança em um bloco genérico.

## Validation Matrix (spec for the build phase)

**RED first:** escrever os casos novos antes da implementação correspondente. Baselines que já passam são preservação GREEN, não alegar RED falso. F1 prepara prova de get/search/refusal; F2 prepara projections/flags; F3 prepara verificações do owner internal. Usar repos/boards descartáveis, nunca tickets de teste no board real.

### L1 — Contrato funcional de leitura (F1/F2)

1. Get de open/done/doing devolve exatamente a raw row completa do ID, não tickets que só mencionem esse ID. Missing target produz missing-id/2; unknown target e board ausente produzem read/0 com zero resultados e diagnósticos. RED: get não existe.
2. Search casa title/tldr/notes completos e ID; mantém ordem. Caso com match somente após posição 120 do tldr ainda retorna summary. Dois candidatos em statuses diferentes permanecem dois. RED de ID match: ID isolado não casa hoje; outros matches são baseline.
3. List/search default retornam sete chaves exatas, preview <=120 code points e date/null. Provar emoji no limite, aspas, tabs, newline, tldr curto/120/121, objeto incompleto e labels não array sem crash ou regravação. RED: stdout completo.
4. --full retorna raw rows byte-equivalentes à saída antiga; --ids retorna somente identidades nas linhas de payload, mesmo filtro/ordem. READ_VIEW distingue as projeções; metadata acompanha todas. RED: opções novas não existem.
5. Matriz: list (open/all/status) × (summary/full/ids); search (summary/full); get (full). Flags em ordens permitidas; conflitos/repetições/surplus/unknown recusados. Primeiro query/target option-looking permanece literal. Write parser/record-file precedence/surplus legacy ficam baseline GREEN.
6. F1 prova statusCounts global no core mesmo para filtro/search/get com zero hits. F2 prova STATUS_COUNTS serializado sobre essas entries: conta board todo, não hits; funciona com filtros, zero tickets e statuses com espaço, =, __proto__ e nomes numéricos (fixture com "10" antes de "2", assert da ordem textual no JSON emitido). Damage não entra na contagem; undefined status string entra e segue diagnosticado. Diagnósticos/total/returned existentes preservados.

### L2 — Pureza e publicação (F1/F2)

1. List/search/get e todas projections não bloqueiam com stdin aberto; não criam definitions/board, não alocam ID, não dependem de Git nem child_process no local/core/storage.
2. Publication recusa get/list/search com read-mode/2 antes de parsing, leitura de record-file, locks/worktree ou persistência. Provar inclusive get com argumentos inválidos/record-file inexistente. Repositório descartável conserva HEAD, index, arquivos e refs.
3. Suites de ID/write/publication/recovery existentes permanecem GREEN. Nenhuma alteração de route/commit/rebase/push nem invocação Bash/WSL para fazer leitura nativa.

### L3 — Consumidores e resolução (F2/F3)

1. Owners product/internal instruem get para ID declarado. Nenhum lifecycle obtém work_id/status/done_when a partir de summary. Preservar phase guard, work_id equality, idempotência, carrier e degradações existentes.
2. Caso de assunto que casa open e doing/done não vira unicidade por filtro open. Resolução ambígua continua pedindo alvo. Número antigo exige nota exata no get, não seleção pelo tldr preview.
3. No source/provider prompts ativos, leitura por ID não depende de scan `list --all` completo. List-all summary continua permitido para visão do board; não proibir a listagem como tal. Testes product de phase-write fixam a receita nova. Verificações internal usam o owner source real e seus neighbours, não built copies editadas.

### L4 — Redução e preservação HTTP (F2)

1. Fixture determinística de 21 tickets com corpos longos representativos: medir bytes de list --all summary e full sobre os MESMOS registros; exigir summary < full/6. Guardar comandos, dimensões da fixture e bytes no ledger. Não depender de conteúdo/contagem do backlog vivo nem alegar orçamento universal: títulos/labels/theme não são capados.
2. Se todos notes/done_when/paths aumentarem, a projeção de cada summary permanece igual e os bytes do payload summary não aumentam. Essa prova verifica ausência estrutural de corpos, além da razão de tamanho.
3. Entrada instalada em scratch project usa summary/get/full com os mesmos resultados. API /api/board pelo runtime gerado continua devolvendo notes, paths, done_when, comments, feature, work_id e timestamps completos; testes board nativos/E2E afetados passam sem alteração visual.

### L5 — Pré-requisito, coerência e distribuição (F1–F3)

1. Confirmar predecessor Node-only: wrappers ausentes, fixtures/suites nativas preservadas e source pronto. Se não, parar antes de implementar. Graph refresh somente pelo build owner durante execução; planejamento não executa build.
2. Product/workbench builds passam sem novos warnings/dangling. Consultar graph pós-build; inventário/AGENTS não precisa editar porque nenhum artefacto é criado/removido.
3. Executar CLI relevante, Bats backlog/publication pelo runner oficial, board tests afetados e gates exigidos pelos layer owners. Windows usa scripts/run-tests.js via npm. Registrar plataforma executada; não afirmar ambientes não testados.
4. Source/help/provider output não reinserem wrappers; metadata de relações resolve. Nova leitura get é oferecida somente no CLI local. Slots, STEP IDs e dispatch pipeline não mudam.

**GREEN:** casos novos L1/L2/L3 atingem o estado especificado, baselines conservadas, redução L4 comprovada e L5 passando.

### L6 — Isolamento, TDD e entrega remota (todos os blocos e publicação)

1. Antes de F1, criar worktree dedicada a partir da base atualizada que já contém o predecessor, com branch própria; registrar base SHA, branch e path no ledger. Conferir que a worktree não é o checkout original nem pertence a outra sessão. Copiar o plano local gitignored para docs/plans/ nessa worktree, preservando basename/conteúdo; ledger e todos os comandos de implementação/build/test/commit passam a operar nela. Quando o harness permitir, mover a sessão para essa worktree. Preservar arquivos e index do checkout original; não fazer implementação em main ou na branch do predecessor. A criação ocorre somente na fase build.
2. TDD por comportamento novo: escrever teste, executá-lo e registrar RED com comando, resultado e falha pelo motivo esperado antes de editar implementação; aplicar a menor mudança, executar o mesmo teste e registrar GREEN, depois as regressões do bloco. Falha de ambiente/dependência não conta como RED. Não substituir testes por assertions que espelhem código nem fabricar RED para baselines já GREEN. Para instruções internal de F3, checks read-only específicos do contrato devem demonstrar a receita antiga antes e a nova depois, sem forçar testes artificiais de prosa. Evidência no ledger por F-block, junto dos levels correspondentes.
3. Após F1–F3, gates locais e final audit do build, executar o fluxo de publicação de add-framework--build STEP 9 na branch dedicada: confirmar primeiro push quando ainda não existe PR, então push e abrir PR contra a base atual do repositório. Se houver PR da mesma branch, atualizar a existente. Registrar URL/número, base/head branch e head SHA; nunca abrir PR duplicada. Se a confirmação for negada ou publicação bloqueada, reportar entrega local incompleta para o objetivo remoto, preservando worktree/commits.
4. Após publicar, acompanhar os checks/runs associados ao head SHA atual via GitHub CLI (por exemplo, gh pr checks --watch e gh run view para logs). Não tomar ausência inicial de checks como GREEN: aguardar o CI esperado iniciar. Para o workflow CI observado, exigir test-cli nas versões Node 20 e 22, test-scripts e board, além dos required checks aplicáveis e dos demais workflows disparados para a PR. Ler os workflows atuais na execução e confirmar o conjunto esperado; não perpetuar nomes se mudaram. Todos os jobs esperados devem terminar com success; pending, failure, cancelled, timeout ou ausência de job esperado não satisfazem GREEN. Check realmente não aplicável precisa justificativa registrada, sem tratar skip de teste esperado como sucesso.
5. Se um check falhar por esta entrega, ler logs, reproduzir na worktree e corrigir sob TDD; registrar falha e correção, validar localmente, commitar e atualizar a mesma PR. Respeitar hard stops e regras de review do build; não adicionar outra opinião sobre a entrega como condição de cada push. Após cada novo push, o SHA muda: esperar/checkar novamente os runs do novo SHA. Falha externa, falta de acesso ou mudança que exige decisão fora do escopo são blockers reportados, não razão para declarar CI GREEN nem alterar o CI para contornar a falha.
6. Antes do relatório final, reler head SHA da PR e provar que é o mesmo SHA cujos checks passaram. Registrar URLs/run IDs, jobs/conclusions e SHA no ledger. Se o head mudar enquanto se acompanha CI, verificar o novo head; não reutilizar evidência antiga. Só declarar entrega remota concluída quando PR estiver aberta e o CI desse head estiver GREEN. Preservar worktree/branch e PR para close-out; merge e cleanup seguem add-framework--done.

**Acceptance de entrega:** L1–L5 GREEN + isolamento/TDD comprovados + PR aberta + L6 CI GREEN no head atual. O planejamento apenas declara esse fluxo; não cria worktree, branch, commits ou PR.

## Execution Order

1. **F1 [product]**: obter detalhe exato sem criar efeitos Git. Checkpoint preserva stdout list/search full e mantém consumidores antigos funcionais.
2. **F2 [product]**: trocar default e migrar todos consumidores/testes stdout afetados no mesmo bloco. Instruções internal antigas ainda encontram ID no JSONL summary, mas seu uso de detalhe migra imediatamente em F3; não publicar entrega antes desse bloco.
3. **F3 [internal]**: migrar owners internos e fechar coerência product/internal. Entrega pronta para PR somente após todos níveis passarem.

Um commit por F-block, hard stops/ledger do build. Não carregar testes quebrados de F2 para F3. A assert da receita product em board-phase-writes.test.js muda em F2 junto do lifecycle. F3 verifica fontes internal por checks read-only, com comandos e assertions registrados no ledger; não edita tests product. Se surgir um test product que realmente dependa de mudança de owner internal, parar para atualizar Impact/Scope/order com bloco explicitamente [product] antes de proceder; não atribuir a edição implicitamente a F3. Preparação RED-first não autoriza aplicar projeção global ao core.

**Sequência operacional obrigatória:** verificar predecessor → criar worktree/branch isoladas e transportar plano → RED → implementação → GREEN por bloco → regressões/gates/final audit → confirmação STEP 9 → push/PR → monitorar CI → corrigir/push/monitorar novo SHA quando necessário → relatório com PR e evidências GREEN do head atual. L6 é gate transversal de execução/entrega, não um novo F-block que altera artefactos do framework.

## Reviewer Handoff

Build registra por bloco comandos, checks/levels, resultados, bytes da fixture, plataforma e qualquer desvio aprovado. Usa cold readback/final audit próprios do build; nenhum review companion novo.

O ledger também registra worktree/branch/base SHA, evidências RED/GREEN por comportamento, PR URL e evidências de CI ligadas ao head final. O relatório de conclusão fornece PR, head SHA e jobs/runs GREEN; se bloqueado, informa o último SHA, estado real e pendência.

Hunt:
1. Get passando por publication, lendo record-file ou iniciando Git antes da recusa.
2. Summary substituindo result.rows e quebrando /api/board.
3. Search pesquisando preview ou selecionando open quando existe outro candidato.
4. Guardas de lifecycle consumindo summary sem work_id/done_when.
5. Flag-looking query reinterpretada, ou parser de writes alterado para consertar reads.
6. Teste de peso ligado ao backlog vivo, full reserializado ou cortes quebrando Unicode.
7. Testes do predecessor apagados ou wrappers reintroduzidos em help/fixtures executáveis.
8. Histórico F5 tratado como proibição permanente ou documentos arquivados reescritos.
9. Código alterado no checkout original, RED observado somente depois da implementação, ou entrega dita concluída sem PR/CI GREEN no head atual.

## References

- docs/plans/2026-10-04T181131-PLAN--remove-backlog-shell-wrappers.md — predecessor; quando arquivado, docs/deliveries/2026-10-04T181131-PLAN--remove-backlog-shell-wrappers/plan.md.
- Ticket 0020B, lido pela CLI nativa — intenção e medição histórica, com ajustes confirmados nesta conversa.
- docs/deliveries/2026-10-04T004044-PLAN--native-node-backlog/plan.md — parser compartilhado e publication nativa.
- docs/deliveries/2026-10-03T122024-PLAN--node-only-board/plan.md — core completo e apresentação separada.
- docs/deliveries/2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename/ledger.md:19 — decisão anterior limitada àquela entrega.

## Next Steps

`/add-framework--build compact-backlog-reads`

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-04 | Plano inicial após confirmação de get próprio, JSONL e sete campos; predecessor Node-only explícito; busca all-status substitui fallback open → all |
| 2026-10-04 | Review fix-then-ok: core fornece counts globais ordenadas a F2; serialization preserva nomes numéricos; ownership de testes product/internal explícito |
| 2026-10-04 | Pedido do usuário: worktree/branch isoladas obrigatórias, TDD RED → GREEN comprovado, PR ao finalizar desenvolvimento e acompanhamento/correção de CI até GREEN no head atual (L6) |
| 2026-10-04 | Implementado em 834f2d2, 6e51c1c e 5c27548; final audit concluída (14 achados, 1 aplicado como verificação, 13 rejeitados com razão); changelog `docs/changelog/2026-10-04T190016-compact-backlog-reads.md` |
| 2026-10-05 | Atualizado com main ca1eefa via merge bc501bc; correção F4 de datas inválidas com RED → GREEN em ab71d7a; PR #101 atualizada. |
