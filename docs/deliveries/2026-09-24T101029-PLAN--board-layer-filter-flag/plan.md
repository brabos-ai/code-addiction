# Plan: Board layer filter — opt-in do filtro interno

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-09-24
> **Delivery:** confirm

---

## Objective

Um filtro "Layer" (product / internal / both) e o chip correspondente no card aparecem só quando o servidor do board recebe `--layers`. Apenas `npm run board` deste repositório passa a flag; o board distribuído a outros projetos nasce sem esse filtro. [from conversation, no design document]

**When this build is done:** Quem abre o board deste repositório filtra tickets por camada no quadro e na lista. Uma instalação normal continua sem filtro e sem chips nos cards ou linhas da lista; o detalhe do ticket continua mostrando as labels gravadas.

## Context

O commit a46ec44 retirou os filtros de tema e label porque `labels` é um campo livre de cada projeto. Neste repositório, `add-framework--backlog` usa `product`, `internal` e `both` para distinguir trabalho no framework distribuído, trabalho interno e trabalho nas duas camadas. O owner precisa dessa separação, sem dar significado de camada às labels de quem instala o board. A conversa em `board-feature-flag.txt` fechou a escolha de flag no servidor, filtro multisseleção com OU, preservação de labels no detalhe e suporte também à `/list`. Não houve design nem intent file. Este plano registra essas decisões para que o build não precise reconstruí-las do histórico local.

## Global Constraints

- "Keep `server.mjs` on Node built-ins, bound to 127.0.0.1; ship `server.mjs` + `dist/`" (AGENTS.md, Product Layer — `board/`).
- "THE SERVER NEVER PARSES docs/backlog.jsonl. Tickets come from `backlog.sh list --all`" (`board/server.mjs`, header).
- "ONE schema for the view state of /board and /list" (`board/src/lib/search.ts`, header).
- "The URL stays the one source of view state" (`board/src/components/filter-bar.tsx`, header).

## Problem

1. **Camada sem filtro** — depois de a UI remover o filtro genérico de labels, o owner não consegue separar tickets `product`, `internal` e `both` no board.
2. **Chips sem contexto** — cards e linhas móveis ainda mostram todas as labels, inclusive as camadas internas, para qualquer instalação.
3. **Configuração no lugar errado expõe o conceito** — `backlog.definitions.json` é dado do projeto e as features do CLI são injeção de comandos, não opções do servidor em runtime.

## Proposal

O servidor aceita `--layers`, desligada por padrão, e somente nesse modo expõe a capacidade de filtro no `/api/board`. A UI usa o payload para desenhar o controle "Layer" e os chips de `product`, `internal` e `both`. O script `board` do `package.json` da raiz liga essa capacidade apenas neste repositório. O contrato do backlog e a instalação distribuída não ganham nova opção pública. A sequência servidor → UI → script local permite validar o modo desligado antes da ativação local.

**Contrato do opt-in:** com flag, a resposta normal de `/api/board` acrescenta `"layerFilter":{"name":"Layer","values":["product","internal","both"]}`; sem flag, essa chave **não existe** (não é `false` ou `null`). O restante do payload continua igual, inclusive `tickets[].labels`. O tipo cliente é `layerFilter?: { name: string; values: string[] }`; os valores são a lista fechada e ordenada acima, não são extraídos dos tickets.

**Contrato da URL:** usar `label` como array serializado pelo TanStack Router, no mesmo formato que `status` e `column`: uma seleção `?label=%5B%22product%22%5D`; duas `?label=%5B%22product%22%2C%22both%22%5D`. O parse aceita um único valor string como faz para `status`. Ao receber dados **sem** `layerFilter`, ambas as views ignoram `label` imediatamente na busca e removem esse parâmetro da URL com navegação `replace`, preservando `q`, `status` e `column`. O mesmo saneamento remove valores de label fora do vocabulário no modo ligado. O parâmetro não pode reaparecer na troca de view ou no clear.

## Current State

| Área | Estado atual | Alcance no grafo de artefatos |
|---|---|---|
| `board/server.mjs` | `parseArgs` não aceita `--layers`; `/api/board` não retorna configuração de filtros | NOT VERIFIED: `board/` não é nó |
| `board/src` | `search.ts` descarta `label=`, `filterTickets` não filtra labels; `TicketMeta` mostra todas | NOT VERIFIED: `board/` não é nó |
| `package.json`, `AGENTS.md` | `npm run board` não passa flag; o mapa não explica o opt-in | NOT VERIFIED: arquivos fora do grafo |

Nenhum artefato modelado pelo grafo é alterado neste plano; por isso não há contagem de dependentes diretos para graduar. O índice de entregas por nó também não cobre esses arquivos. O histórico local aponta o commit a46ec44 como remoção do filtro genérico, mas não prova o histórico completo de entregas do board. `AGENTS.md` muda e será checado à mão.

## Scope

### Includes

- **F1** [product] — `board/server.mjs`, `board/test/server.test.ts`: aceitar `--layers` sem alterar os outros argumentos e acrescentar ao `/api/board` o `layerFilter` com o formato exato definido em Proposal somente quando a flag foi passada; sem flag a chave deve estar ausente, mesmo que o backlog tenha essas labels. Manter tickets e labels originais na resposta e o servidor zero-dependency.
  - **Produces:** `/api/board` campo opt-in `layerFilter: { name: "Layer", values: ["product", "internal", "both"] }`; ausente por padrão.
- **F2** [product] — `board/src/api/types.ts`, `board/src/lib/search.ts`, `board/src/lib/tickets.ts`, `board/test/tickets.test.ts`: tipar o campo opcional da API e recuperar o parâmetro de URL `label` no formato TanStack Router definido em Proposal; casar labels exatamente, com OU dentro do grupo e AND com `q` e `status`. Aplicar somente os valores permitidos pela capacidade; sem ela, `label=` não filtra nem conta como filtro ativo. Manter `theme=` ignorado e os outros filtros intactos.
  - **Consumes:** `/api/board` campo opt-in `layerFilter: { name: "Layer", values: ["product", "internal", "both"] }`; ausente por padrão (F1).
  - **Produces:** busca efetiva `label` condicionada a `layerFilter` em `/board` e `/list`.
- **F3** [product] — `board/src/components/filter-bar.tsx`, `board/src/components/ticket-card.tsx`, `board/src/views/board-view.tsx`, `board/src/views/list-view.tsx`, `board/test/routes.test.tsx`: mostrar o controle "Layer" nos dois modos de visualização apenas com a capacidade ativa; marcar vários valores e escrever a URL no formato definido em Proposal. Sem opt-in, descartar `label` da URL via `replace` após carregar o payload, preservando os demais parâmetros; com opt-in, sanear valores desconhecidos da mesma forma. Manter clear, indicador móvel, recarga e troca de view coerentes. Mostrar apenas os chips de camada declarados em cards e nas linhas móveis da lista quando ligado; não mostrar chips de labels quando desligado. Não esconder as labels de `board/src/views/ticket-sheet.tsx` nem mudar tema, status, rank ou outros metadados.
  - **Consumes:** `/api/board` campo opt-in `layerFilter: { name: "Layer", values: ["product", "internal", "both"] }`; ausente por padrão (F1).
  - **Consumes:** busca efetiva `label` condicionada a `layerFilter` em `/board` e `/list` (F2).
- **F4** [product] — `board/e2e/board.spec.ts` (e, se necessário, `board/playwright.config.ts`): cobrir o modo distribuído, sem `--layers`, e o opt-in com `--layers`, usando a fixture existente. Atualizar as expectativas antigas de chips visíveis no modo padrão e do link `label=` ignorado. Confirmar filtro e chips em board/list, detalhe com labels em ambos, multisseleção, reload, deep link e remoção de `label` da URL sem flag. Não ligar a flag no servidor padrão da suite e2e; iniciar um segundo servidor de teste opt-in em porta própria se necessário.
  - **Consumes:** `/api/board` campo opt-in `layerFilter: { name: "Layer", values: ["product", "internal", "both"] }`; ausente por padrão (F1).
- **F5** [internal] — `package.json`, `AGENTS.md`: adicionar `--layers` somente ao script `board` da raiz e explicar junto à descrição do board que esse opt-in é específico deste repo. Não alterar a distribuição nem o comando do servidor usado pelo usuário final.
  - **Consumes:** `/api/board` campo opt-in `layerFilter: { name: "Layer", values: ["product", "internal", "both"] }`; ausente por padrão (F1).

### Does NOT Include (important!)

- Não adicionar `labelGroups` ao schema ou ao `docs/backlog.definitions.json`: isso exporia o conceito interno como configuração do produto.
- Não criar feature do CLI, `.env`, `features.json`, biblioteca de flags ou duas variantes de build: a flag de runtime basta.
- Não restaurar filtro de tema nem tratar `product` como incluindo `both` automaticamente.
- Não mudar `add-framework--backlog`, `backlog.sh` ou validar novas labels ao gravar tickets.
- Não ocultar `labels` da API nem do detalhe do ticket: o opt-in governa o filtro e os chips resumidos, não acesso aos dados.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Onde ligar? | `--layers` no servidor, passada apenas pelo `npm run board` local | Funciona após clone sem `.env`; o servidor distribuído inicia sem flag (conversa, resposta final aprovada). |
| Onde vale? | `/board` e `/list` | O owner aceitou a recomendação para Q4; as duas usam `FilterBar`. |
| Como selecionar? | Multisseleção, match exato, OU; `both` é valor próprio | Q3 = opção A. |
| O que aparece quando desligado? | Sem filtro ou chip em card/linha; detalhe conserva labels | Q2 = opção A. |
| Como tratar outras labels? | Não entram em chips nem nos valores do filtro; continuam no detalhe | Camada interna não dá significado a tags livres. |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Um só `dist/`, com opt-in local e default seguro para outras instalações | O código do filtro ainda existe no bundle; esconder a UI não é controle de acesso às labels. |
| Vocabulário estável para o owner | Um projeto externo não pode trocar nome/valores do filtro por config. |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| `label=` antigo filtrar em silêncio sem controle visível | Medium | F2 ignora quando não há capacidade; F3 remove o parâmetro com `replace`; L2 e L3 cobrem deep links, clear e troca de view. |
| Chip livre `quality` continuar aparecendo no card de outro projeto | High | F3 filtra chips pelos valores da capacidade; L3 prova modo desligado e ligado com label extra. |
| Ativar a flag no servidor dos testes e distribuir o modo interno por engano | Medium | F4 mantém fixture padrão desligada; F5 muda só script da raiz; L1/L3 testam ambos os modos. |
| Contrato do servidor divergir do tipo do cliente | Medium | F1 produz campo único, F2/F3 o consomem; L1/L2 checam forma e ausência. |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `board/server.mjs`, `board/test/server.test.ts` | product | modify | F1: flag e resposta API, prova dos dois estados |
| `board/src/api/types.ts`, `board/src/lib/search.ts`, `board/src/lib/tickets.ts`, `board/test/tickets.test.ts` | product | modify | F2: contrato, URL, filtragem, testes |
| `board/src/components/filter-bar.tsx`, `board/src/components/ticket-card.tsx`, `board/src/views/board-view.tsx`, `board/src/views/list-view.tsx`, `board/test/routes.test.tsx` | product | modify | F3: controle e chips condicionais nas duas views |
| `board/e2e/board.spec.ts` | product | modify | F4: aceitação em navegador nos dois modos |
| `board/playwright.config.ts` | product | modify if needed | F4: isolamento do segundo servidor opt-in |
| `package.json`, `AGENTS.md` | internal | modify | F5: ativação local e mapa do projeto |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Criar/atualizar as checagens antes dos respectivos F-blocks e confirmar que falham no estado atual; depois deixá-las GREEN. Onde um cenário já passa hoje (ausência da flag), parear com seu inverso RED (flag presente) antes de considerar o nível coberto.

### L1 — Servidor e contrato (F1; RED → GREEN)

1. Sem `--layers`, `/api/board` não tem chave `layerFilter` mesmo com labels de camada; com `--layers`, tem exatamente `{"name":"Layer","values":["product","internal","both"]}`. *RED hoje: `--layers` é argumento desconhecido.*
2. Nos dois modos a API preserva os tickets, suas labels, as colunas e o comportamento de erro/host/porta. *RED hoje: segundo modo não inicia.*

### L2 — Busca e tipos (F2; RED → GREEN)

1. Com opt-in, o array da URL `?label=%5B%22product%22%5D` retorna só `product`, não `both`; `?label=%5B%22product%22%2C%22both%22%5D` retorna ambos, com OR e match exato; `status`/`q` combinam por AND. *RED hoje: `label` é descartado.*
2. Sem opt-in ou com valor fora do vocabulário, `label=` não aplica filtro oculto e o filtro efetivo não conta esse campo. `theme=` continua descartado. *RED hoje para o caso com opt-in.*

### L3 — Rotas, controles e aceite visual (F3–F5; RED → GREEN)

1. Sem flag: `/board` e `/list` não exibem grupo "Layer" nem chips de labels no card/linha; um deep link `?label=%5B%22internal%22%5D&q=doctor` mostra os tickets conforme `q` e retira somente `label` da URL via `replace`, também após troca de view; detalhe mantém labels. *RED hoje: chips continuam visíveis.*
2. Com flag: as duas views mostram os três botões "Layer" na ordem, filtram por seleção múltipla, mantêm o array `label` no formato do TanStack Router na URL após reload e troca de view, limpam o filtro ao usar Clear; valor desconhecido é removido da URL; chip de `quality` não aparece no resumo, mas aparece no detalhe. *RED hoje: nenhum controle de camada.*
3. Verificar desktop e móvel, inclusive contador de refinements e linhas móveis da lista; rodar `npm run test:board`, `npm run build:board` e o e2e de `board/` no build. *RED hoje: modo opt-in não inicia.*
4. `npm run board` do root passa `--layers`; servidor iniciado diretamente sem flag continua desligado; `AGENTS.md` descreve esse contraste. *RED hoje: script da raiz não passa flag.*

**RED expectations against the current tree:** o modo ligado falha em L1–L3; o modo desligado falha na ausência dos chips de resumo em L3.
**GREEN = all levels pass after F1–F5.**

---

## Execution Order

1. **F1 [product]** define o campo opcional do servidor e prova ambos os estados.
2. **F2 [product]** consome a capacidade e define a busca efetiva.
3. **F3 [product]** consome os dois contratos para montar filtros e chips nas duas views.
4. **F4 [product]** exercita o bundle e o servidor real com e sem flag; mantém o e2e padrão no modo de distribuição.
5. **F5 [internal]** liga o script só neste repo e atualiza o mapa após a verificação do default.

Após F1 o servidor continua servindo a UI antiga quando a flag não é passada. Após F3 ambos os estados são utilizáveis; F4 os confirma antes de F5. A validação de cada F-block está identificada em L1, L2 ou L3. Conferir as referências a `AGENTS.md` à mão, pois o grafo não o indexa.

## Reviewer Handoff

O build deve deixar evidência de arquivos alterados por F-block, estado RED e GREEN de L1–L3 e qualquer decisão alterada frente à conversa. Conferir em especial:

1. Nenhum F-block marcado concluído com nível de validação escrito só depois da mudança.
2. `label=` não deixa filtro invisível quando a API não anuncia o opt-in, inclusive em links compartilhados e troca de view.
3. O script do root é o único ponto que passa `--layers`; o e2e padrão e o caminho distribuído não a passam.
4. `quality` e demais labels livres não aparecem em resumos; continuam no detalhe e na resposta API.

---

## Next Steps

/add-framework--build board-layer-filter-flag

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-24 | Initial creation from the approved conversation in `board-feature-flag.txt` |
| 2026-09-24 | Review fix: exact API shape, URL array format, canonical removal of disabled `label` |
| 2026-09-24 | Implemented F1–F5 in 6641752, 38aaf8c, 28addd2, f0f7ca5 and 831ddff; final audit coverage correction in cf7fcbe. RED/GREEN evidence and rulings are in the companion ledger. |
