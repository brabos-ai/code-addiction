# Plan: História de entrega que sobrevive ao worktree — `docs/deliveries/<plan-basename>/`

> **Status:** implemented
> **Layers:** internal
> **Type:** command
> **Created:** 2026-09-09

---

## Context

Este plano executa o **item 2 do roadmap** (`docs/roadmap/index.md`), "Development history that
survives the worktree", com os quatro sub-itens 2.0 a 2.3 tratados como um trabalho só.

Não existe design doc em `docs/brainstorming/` para este tópico. As decisões foram tomadas na sessão
de planejamento e estão em **Validated Decisions** abaixo.

O item 1 do roadmap ("Review, reshaped") **já foi entregue**, no PR `#46`. Ele removeu
`/add-framework--review`, moveu a passada adversarial para dentro de `/add-framework--build` STEP 7 e
acabou com o arquivo de veredito. Duas consequências que este plano herda e não tenta reverter:

- **Nenhum `--review-vNN.md` novo será produzido.** O membro `review.md` da convenção passa a existir
  só para os arquivos legados ainda em disco. A regra continua sendo um glob opcional, que é
  exatamente o que sobrevive aos dois cenários.
- **Nada mais escreve `docs/evidence/`.** Depois do `#46` a única menção ao diretório no repo inteiro
  está no STEP 8 de `/add-framework--done`, que o apaga. `add-review-discipline` proíbe a passada de
  review de escrever em `docs/plans/` fora do ledger, e o que a auditoria acha vira `Ruling:` no
  ledger, não arquivo. O membro `evidences/` fica pela mesma razão que `review.md`: cobre o que já
  está em disco e não custa nada se o diretório estiver vazio.

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` sai 0 e não emite warning ausente da baseline medida
  antes do primeiro F-block (`add-framework-internal-layer`, Validation)
- `ADD_GRAPH_WARNINGS=1` em toda medição de warning — sem ele `build.js` só imprime a contagem e a
  afirmação "nenhum warning novo" não se sustenta (`add-framework-internal-layer`, Validation)
- Um nome que aparece em prosa sem relação declarada **falha** o build; declarado e nunca nomeado em
  prosa **avisa** (`add-framework-internal-layer`, Validation)
- Todo remove ou rename atualiza cada dependente **no mesmo F-block**
  (`add-framework--build` STEP 4.4, Lifecycle Actions)
- Todo F-block `[internal]` prova que ficou na raia com `git status --porcelain framwork/` vazio
  (`add-framework-internal-layer`, Validation)
- Numeração de STEP é inteira e sequencial; inserir um STEP renumera os seguintes, nunca cria `5.5`
  (`building-commands`, via `add-framework--build` STEP 3)
- O bloco de inventário do `CLAUDE.md` é gerado por `node scripts/inventory.js` e nunca editado à mão
  entre os marcadores (`add-framework-internal-layer`, CLAUDE.md is not bookkeeping)
- Comentários HTML (`<!-- -->`) são removidos no build; blocos `<!-- uses: -->` dependem disso
  (CLAUDE.md, Pipeline)

## Problem

1. **O worktree leva os documentos junto** — `docs/plans/`, `docs/brainstorming/` e `docs/evidence/`
   são gitignored (`.gitignore` linhas 144-146). Num build com worktree eles existem só dentro do
   diretório do worktree. `/add-framework--done` STEP 8.1 remove o worktree e leva tudo.

2. **A tabela do STEP 8 mente** — ela lista `docs/plans/` e `docs/brainstorming/` na coluna "Kept"
   porque nada naquele STEP os apaga. Em build com worktree eles não são mantidos, e o texto afirma
   que sim.

3. **Só o extrato chega ao `main`** — hoje sobrevive a prosa do changelog e as linhas `Ruling:`
   copiadas à mão para o relatório de conclusão. O documento em si nunca é pedido para sobreviver.

4. **`origin` aponta para um caminho que não existe fora desta máquina** — toda entrada de
   `docs/delivered.jsonl` grava `origin: docs/plans/<id>.md`, um caminho gitignored. Num clone novo o
   campo não resolve para nada.

5. **O `done` roda dentro do worktree que quer remover** — o STEP 1.2 exige que a branch atual não
   seja `main`, e numa build com worktree a branch só está checada lá dentro. `git worktree remove`
   do próprio diretório não funciona. O STEP 8.1 descreve uma remoção que, nesse caminho, não
   acontece.

## Proposal

Um diretório **tracked** por plano entregue, `docs/deliveries/<plan-basename>/`, escrito pelo STEP 6
de `/add-framework--done` — o mesmo STEP que já commita a entrada do índice e o changelog, e que o
STEP 7 já faz merge via `gh`. Nenhum ciclo novo de commit-e-push.

A ordem é o conserto inteiro: os documentos chegam ao `main` no STEP 7, e só depois o STEP 8 remove
worktree, branch e os originais locais. Um passo que rodasse depois do STEP 8.1 não teria mais o que
mover.

Quatro estágios:

1. A convenção escrita, em `add-plan-authoring` — que já é dona do nome do plano e dos companions.
2. O arquivamento em `/add-framework--done` STEP 6, antes do commit.
3. O STEP 8 dizendo a verdade sobre o que apaga, e pulando a remoção do worktree em que ele mesmo está.
4. A varredura de quem lê `docs/plans/`: o skill do ledger, o agente de discovery, o comando de
   release, o `CLAUDE.md` e o comentário do `.gitignore`.

## Current State

| Artefato | Hoje | Dependentes (`impact --depth 1`) |
|---|---|---|
| `.claude/commands/add-framework--done.md` | STEP 6 commita entrada + changelog. STEP 8 remove worktree, branch e `docs/evidence/`. Grava `origin: docs/plans/<id>.md` | 0 |
| `.claude/skills/add-plan-authoring/SKILL.md` | Seção **File Naming** define o caminho do plano e os companions `--evidence-v01.md`, `--review-v01.md`, `--ledger.md` | 1 (`add-framework--plan`) |
| `.claude/skills/add-build-ledger/SKILL.md` | Afirma que `docs/plans/` é gitignored e que a decisão "morre nesta máquina" se o ruling não for copiado para o relatório | 1 (`add-framework--build`) |
| `.claude/agents/framework-discovery-agent.md` | Plan Scan faz `Glob docs/plans/*.md` e extrai as palavras do basename do arquivo | 2 (`add-framework--plan`, `add-framework--brainstorm`) |
| `.claude/commands/add-framework--release.md` | Seção **Plan scan**: "If `docs/plans/` exists → include non-draft plans created/updated since `LATEST_TAG`" | 1 (`add-framework--sync`) |
| `CLAUDE.md` | Linha 38: `| Plans | docs/plans/ — gitignored working artefacts, local only |` | — |
| `.gitignore` | Linhas 141-146: comentário lista `docs/changelog/` e `docs/delivered.jsonl` como tracked | — |

Dois fatos que este plano **não precisa mudar**, verificados na fonte:

- O corpus do `delivered.sh verify` é "todo arquivo que o git não ignora, **menos `docs/`**, menos o
  próprio índice" (`add-doc-schemas/references/delivery-index.md`, "What the search may look at").
  Um diretório novo dentro de `docs/` é invisível para a verificação de âncoras. Nenhum item pode ser
  ancorado ali, e nenhum `find` vai casar por acidente dentro de um plano arquivado.
- `origin` nunca é resolvido por script. `delivered.sh` só o exige presente (linha 132) e o repassa
  (linha 221). Mudar o valor não quebra nenhum consumidor.

## Scope

### Includes

- **F1** [internal] — `.claude/skills/add-plan-authoring/SKILL.md`: nova seção **The Delivered Home**,
  logo depois de **File Naming**, definindo a convenção do diretório durável: o nome
  `docs/deliveries/<plan-basename>/`, os cinco membros e o que fica de fora. Não pode perder a regra
  de que `docs/plans/` continua sendo a casa de um plano **em andamento** e continua gitignored — a
  seção descreve para onde um plano **entregue** vai, não substitui a File Naming. A seção precisa
  dizer, em uma linha, que `evidences/` vem do **diretório** `docs/evidence/` — a classe por plano que
  o STEP 8 já apaga — e não do companion `--evidence-v01.md` listado logo acima em **File Naming**.
  Os dois nomes soam iguais e são coisas diferentes; a seção nova fica encostada na lista de
  companions e sem essa linha a origem de `evidences/` é ambígua. A seção precisa dizer também que
  `review.md` e `evidences/` são **membros condicionais**: depois do `#46` nada produz um deles, e um
  diretório de entrega sem os dois é o caso normal, não uma entrega incompleta.
  - **Produces:** a convenção `docs/deliveries/<plan-basename>/` com os membros `plan.md`,
    `ledger.md`, `design.md`, `review.md`, `evidences/`

- **F2** [internal] — `.claude/commands/add-framework--done.md`: o STEP 6 arquiva antes de commitar.
  Monta `docs/deliveries/<id>/` a partir dos originais gitignored, faz `git add` desse caminho junto
  com a entrada e o changelog, e mantém **um** commit e um push. O valor de `origin` que o STEP 3
  autoriza passa a `docs/deliveries/<id>/`. A linha do STEP 6 no mapa de STEPs passa a nomear o
  arquivamento. O bloco
  `<!-- uses: -->` ganha `- skill: add-plan-authoring`, porque a prosa passa a nomear o skill e o gate
  de referência solta falha sem a declaração. **O caminho do design é lido da tabela `| Document |
  Carries |` da seção Context do próprio plano** — é o único vínculo que existe entre um plano e seu
  design doc, porque `docs/brainstorming/` usa timestamp próprio, sem relação com o do plano
  (`add-framework--brainstorm`, File Naming). Plano sem essa tabela não tem `design.md`, e isso não é
  erro. Não pode perder: o STEP 6 continua sendo um único commit, e o texto que explica por que a
  entrada é commitada antes do merge continua válido.
  - **Consumes:** a convenção `docs/deliveries/<plan-basename>/` (F1)
  - **Produces:** `origin` das entradas novas é `docs/deliveries/<id>/`

- **F3** [internal] — `.claude/commands/add-framework--done.md`: o STEP 8 diz a verdade. A tabela
  Removed/Kept passa a listar os originais locais de `docs/plans/`, `docs/brainstorming/` e
  `docs/evidence/` como removidos **depois** do merge, com a cópia durável no `main` como o que
  sobrevive. Ganha a regra não-fatal do worktree: se o `done` está rodando dentro do worktree que ia
  remover, reporta e pula — como todo sub-passo do STEP 8, que já é não-fatal. Ganha a proibição de
  apagar um original cuja cópia durável não está commitada. **E corrige a frase logo abaixo da tabela
  que diz que `docs/evidence/` é a única classe sem leitor pós-merge** — com este plano
  `docs/plans/` e `docs/brainstorming/` passam a ter a mesma propriedade, e a frase vira uma
  contradição dentro do próprio arquivo se ficar como está. Não pode perder: a ordem forçada
  (worktree, depois branch), nem o fato de que o STEP 8 só roda se o STEP 3 escreveu entrada e o
  STEP 7 fez merge.
  - **Consumes:** `origin` das entradas novas é `docs/deliveries/<id>/` (F2)

- **F4** [internal] — `.claude/skills/add-build-ledger/SKILL.md`: corrige o destino do ledger. A frase
  "docs/plans/ é gitignored, so the ledger never reaches a reviewer on its own" continua verdadeira
  **durante o build**; a metade que diz que a decisão morre nesta máquina deixa de ser verdade para um
  plano fechado. O texto passa a dizer as duas coisas: o relatório de conclusão continua sendo como um
  ruling chega a um humano no momento do build, e `/add-framework--done` arquiva o ledger inteiro em
  `docs/deliveries/<id>/ledger.md`. O bloco `<!-- uses: -->` ganha
  `- mention: /add-framework--done`, pela mesma razão do F2.
  - **Consumes:** a convenção `docs/deliveries/<plan-basename>/` (F1)

- **F5** [internal] — `.claude/agents/framework-discovery-agent.md`: o Plan Scan enxerga entregas. Além
  de `Glob docs/plans/*.md`, varre `docs/deliveries/*/plan.md` e extrai as palavras do **nome do
  diretório**, não do nome do arquivo — `plan.md` não tem slug. Um plano entregue entra no ranking
  marcado como entregue, para o chamador saber que é prior art fechada e não trabalho em aberto. Não
  pode perder: a regra de descartar o token inicial (timestamp ou `NNNN`) e o marcador `PLAN` /
  `SELF-PLAN`, que vale igual para o nome do diretório.
  - **Consumes:** a convenção `docs/deliveries/<plan-basename>/` (F1)

- **F6** [internal] — `.claude/commands/add-framework--release.md`: o Plan scan da linha 179 passa a
  ler `docs/deliveries/`, delimitado por `git diff --name-status LATEST_TAG..main --
  docs/deliveries/`. `docs/plans/` sai da lista de fontes de release notes: é gitignored, e numa
  máquina de release pode estar vazio, o que hoje faz a seção render nada sem avisar.
  - **Consumes:** a convenção `docs/deliveries/<plan-basename>/` (F1)

- **F7** [internal] — `CLAUDE.md` e `.gitignore`: o mapa aponta para a casa nova. A tabela do Internal
  Layer ganha uma linha para `docs/deliveries/<plan-basename>/` ao lado da linha de `docs/plans/`, que
  continua descrita como gitignored e local. O comentário do `.gitignore` (linha 142), que hoje lista
  o que é tracked, passa a nomear `docs/deliveries/` junto com `docs/changelog/` e
  `docs/delivered.jsonl`. Não pode perder: as três linhas de ignore (144-146) ficam exatamente como
  estão, e nada é escrito entre os marcadores do bloco de inventário.
  - **Consumes:** a convenção `docs/deliveries/<plan-basename>/` (F1)

### Does NOT Include (important!)

- **A camada product.** `docs/features/` é tracked no projeto do usuário e `build-setup.sh` já copia
  os docs da feature para dentro do worktree (linhas 157-159). O bug não existe lá.
- **Destrackear `docs/plans/`.** Rejeitado: o STEP 2.3 item 2 de `add-framework--done` exige árvore
  limpa, e com `docs/plans/` tracked qualquer rascunho parado vira `??` no `git status` e trava toda
  entrega.
- **Script novo.** O bats só cobre `framwork/.codeadd/scripts/tests/*.bats` e a suíte leva mais de uma
  hora nesta máquina. O arquivamento é prosa no comando, provado pelos gates de grafo e pelo ensaio
  do L3.
- **Migrar entregas antigas.** As entradas já em `docs/delivered.jsonl` mantêm
  `origin: docs/plans/<id>.md`. O índice nunca reescreve linha (hard ban 6,
  `delivery-index.md`). Planos entregues antes deste plano não ganham diretório retroativo.
- **Plano abandonado.** Um plano que nunca é fechado nunca é arquivado. Fica local e é apagado à mão.
- **Aposentar o `docs/changelog/`.** A narrativa em prosa continua onde está e não é redundante com o
  arquivo bruto.
- **Mudar `delivered.sh` ou o schema do índice.** `origin` já é definido como "the feature directory
  or plan path this came from" — genérico o bastante para o valor novo.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Mover no close-out, ou parar de ignorar `docs/plans/`? | Mover | Destrackear quebra o gate de árvore limpa do STEP 2.4 e mistura rascunho com história. O `.gitignore` já declara a divisão por durabilidade |
| Nome do diretório | `docs/deliveries/<plan-basename>/` | Faz par com `docs/delivered.jsonl` e `delivered.sh`; `origin` e `id` casam na mesma string. `docs/history/` colidiria com o verbo `history` do `graph.js` |
| Nomes dentro do diretório | Normalizados: `plan.md`, `ledger.md`, `design.md`, `review.md`, `evidences/` | O diretório já carrega o id. Um nome fixo deixa achar o ledger sem saber o id |
| Plural em `evidences/` | `evidences/`, não `evidence/` | Decisão do usuário |
| Conjunto que move | plano + ledger sempre; design do brainstorming, review e evidências quando existirem | O plano aponta para o design e não o repete (`add-plan-authoring`, Authoring Rules), então sem o design o plano arquivado fica incompleto |
| Companion de review | Por glob, opcional | O `#46` já deletou `/add-framework--review`. O glob passa a cobrir só arquivo legado em disco, e um diretório sem `review.md` é o caso normal |
| `evidences/` continua na convenção, mesmo sem produtor? | Sim | Depois do `#46` nada escreve `docs/evidence/`. Manter o glob cobre o que já está em disco e custa nada quando o diretório está vazio; tirar agora obrigaria a re-adicionar se um produtor voltar |
| Onde a convenção mora | `add-plan-authoring` | Já é dona do nome do plano e dos companions. Um skill novo duplicaria a autoridade |
| O arquivamento é condicional a haver worktree? | Não, é incondicional | Uma regra sem detecção não tem como errar a detecção |
| Resolução de `[plan]` passa a ver `docs/deliveries/`? | Não | `/add-framework--build`, `/add-framework--plan` e `/add-framework--done` resolvem plano em aberto. Um plano entregue não deve ser re-executado nem re-fechado |
| Entra o conserto do "done dentro do worktree"? | Sim, como regra não-fatal no STEP 8 | Sem ele a tabela do STEP 8 continua descrevendo uma remoção que não acontece |
| Camada | `internal` apenas | Nenhum arquivo sob `framwork/` ou `cli/` é tocado |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Plano, ledger, design e evidências rastreados no `main`, por entrega | Peso no repo — alguns KB de markdown por entrega, para sempre |
| `origin` resolve num clone novo | Entradas antigas continuam apontando para um caminho gitignored, e a assimetria fica visível no índice |
| `docs/plans/` volta a conter só trabalho em aberto | Quem procurava um plano entregue em `docs/plans/` passa a não achar. Mitigado pelo F5 e pelo F7 |
| Nomes normalizados dentro do diretório | O nome original do arquivo se perde; só o basename do diretório o preserva |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| `git worktree remove` recusa em vez de apagar os arquivos ignorados, e a premissa do problema muda | Medium | **L3.0** mede o comportamento real antes de qualquer F-block. Se recusar, o conserto continua correto — os documentos ainda precisam chegar ao `main` — e a mudança é só na prosa que explica o porquê. Registrar como ruling |
| A prosa nova nomeia um artefato sem declarar a relação e o build falha | High | F2 e F4 já incluem a declaração `uses:` no próprio bloco. O gate roda em todo F-block (Global Constraints) |
| Deletar o original antes de a cópia estar commitada | Medium | F3 põe a remoção no STEP 8, depois do merge do STEP 7, e adiciona a proibição explícita. **L3.2** prova a ordem |
| O F5 extrai slug do nome errado e a discovery para de pontuar planos entregues | Medium | **L1.4** e **L3.3** conferem que o slug sai do nome do diretório |
| O diretório novo entra no corpus de verificação de âncoras do índice | Low | Não entra: o corpus exclui `docs/` inteiro. **L2.3** confere que `delivered.sh verify` roda igual depois do arquivamento |
| Renumeração de STEP quebra referências cruzadas a "STEP 8.1" | Medium | Nenhum STEP é inserido: F2 e F3 editam os STEPs 6 e 8 existentes. **L1.7** confere que o mapa de STEPs continua 1 a 9 |

## Impact

| Artefato | Layer | Action | Reason |
|---|---|---|---|
| `.claude/skills/add-plan-authoring/SKILL.md` | internal | modify | F1 — a convenção do diretório durável |
| `.claude/commands/add-framework--done.md` | internal | modify | F2 — STEP 6 arquiva, `origin` muda, `uses:` ganha `add-plan-authoring`; F3 — STEP 8 corrigido |
| `.claude/skills/add-build-ledger/SKILL.md` | internal | modify | F4 — o destino do ledger e a declaração `mention:` |
| `.claude/agents/framework-discovery-agent.md` | internal | modify | F5 — Plan Scan varre `docs/deliveries/` |
| `.claude/commands/add-framework--release.md` | internal | modify | F6 — Plan scan lê a casa nova |
| `CLAUDE.md` | internal | modify | F7 — linha na tabela do Internal Layer |
| `.gitignore` | internal | modify | F7 — comentário nomeia `docs/deliveries/` como tracked |

Nenhum arquivo é criado, renomeado ou removido por este plano. `docs/deliveries/` passa a existir na
primeira execução de `/add-framework--done` depois da entrega — o mesmo padrão de
`docs/delivered.jsonl`, que também nunca é criado vazio.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Escrever cada nível ANTES de qualquer F-block cair e confirmar que falha
contra a árvore atual. Depois levar a GREEN.

### L1 — Conteúdo dos artefatos (RED → GREEN)

Cada item é um `grep` sobre a árvore, rodável antes e depois.

1. `grep -rln "docs/deliveries" .claude/ CLAUDE.md .gitignore` retorna os **sete** caminhos do quadro
   de Impact. *RED hoje: retorna vazio.*
2. `add-framework--done.md` contém `docs/deliveries/<id>/` como valor de `origin` e **não** contém
   mais `origin`: `docs/plans/<id>.md`. *RED hoje: o contrário nos dois lados.*
3. A tabela Removed/Kept do STEP 8 não lista mais `docs/plans/` nem `docs/brainstorming/` na coluna
   Kept. *RED hoje: lista as duas.*
4. `framework-discovery-agent.md` faz glob em `docs/deliveries/*/plan.md` e diz explicitamente que o
   slug vem do nome do diretório. *RED hoje: só `Glob docs/plans/*.md`.*
5. `add-framework--release.md` não cita `docs/plans/` como fonte de release notes e cita
   `docs/deliveries/`. *RED hoje: cita `docs/plans/`.*
6. `add-build-ledger/SKILL.md` não afirma mais, sem qualificação, que a decisão morre nesta máquina, e
   nomeia `docs/deliveries/<id>/ledger.md`. *RED hoje: a afirmação está lá sem qualificação.*
7. O mapa de STEPs de `add-framework--done.md` continua sendo exatamente STEP 1 a STEP 9, sem `5.5` e
   sem STEP novo. *Verde hoje — guarda de regressão contra a renumeração.*
8. `git check-ignore docs/plans/x.md` sai 0 e `git check-ignore docs/deliveries/x/plan.md` sai 1.
   *Parcialmente verde hoje — guarda de que o F7 não mexeu nas três linhas de ignore.*

### L2 — Build e grafo

1. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` sai 0, e a lista de warnings é igual à baseline medida
   antes do F1. *Verde hoje — o build está limpo; o valor é pegar a aresta nova quebrada.*
2. `git status --porcelain framwork/` vazio depois de cada F-block, exceto o
   `artefact-graph.json` gitignored. *Verde hoje.*
3. `bash framwork/.codeadd/scripts/delivered.sh verify` roda com o mesmo resultado antes e depois do
   arquivamento de um plano de mentira dentro de `docs/deliveries/`. *Prova que o corpus exclui
   `docs/` de fato, e não só na documentação.*
4. `node scripts/graph.js impact add-plan-authoring --depth 1` passa a listar
   `internal/command/add-framework--done` além de `add-framework--plan`. *RED hoje: só um dependente.*

### L3 — Aceitação comportamental (ensaio, sem merge)

Roda num branch e num worktree descartáveis, fora de `.worktrees/`. Nenhum push, nenhum merge.

0. **Premissa.** Criar um worktree descartável, pôr um arquivo dentro de um caminho gitignored, rodar
   `git worktree remove` **de fora** e registrar o que acontece com o arquivo ignorado: apagado,
   recusado, ou recusado só com `--force`. O resultado vira ruling e, se divergir, corrige a prosa do
   Problem 1 no mesmo F-block que a escreveu.
1. **O arquivamento monta o diretório.** Com um plano de mentira, um ledger, um design em
   `docs/brainstorming/` e dois arquivos em `docs/evidence/`, executar o STEP 6 como escrito e afirmar
   que `docs/deliveries/<id>/` contém `plan.md`, `ledger.md`, `design.md` e `evidences/` com os dois
   arquivos de nome original — e que `git status --porcelain docs/deliveries/` os mostra como
   adicionados, não ignorados.
2. **A ordem sobrevive à remoção.** Commitar o diretório no branch descartável, remover o worktree, e
   afirmar que os originais gitignored sumiram enquanto o `docs/deliveries/<id>/` do commit continua
   legível via `git show`.
3. **A discovery acha o plano entregue.** Com o plano só em `docs/deliveries/<id>/plan.md`, dispachar
   `@framework-discovery-agent` com um tópico que casa com o slug do diretório e afirmar que o plano
   entra no relatório marcado como entregue.
4. **A auto-remoção é reportada, não tentada.** De dentro do worktree descartável, rodar
   `git worktree remove` apontando para ele mesmo e afirmar que o comando falha — o que a regra nova
   do STEP 8 manda reportar e pular.

**RED expectations contra a árvore atual:** L1.1 a L1.6 e L2.4 falham hoje. L1.7, L1.8, L2.1 e L2.2
já passam e são guardas de regressão. L3 inteiro não é executável hoje porque o procedimento que ele
ensaia não existe.
**GREEN = todos os níveis passam depois de F1–F7.**

---

## Execution Order

**F1 → F2 → F3 → F4 → F5 → F6 → F7**

- **F1 primeiro** porque todos os outros seis consomem o nome da convenção. Um F-block que escrevesse
  `docs/deliveries/` antes de a convenção existir estaria construindo contra um nome não inventado.
- **F2 antes de F3** porque o F3 apaga originais e só pode fazer isso depois de o F2 garantir a cópia.
  Executar na ordem inversa deixaria uma versão do comando que apaga sem ter copiado.
- **F4 a F7 em qualquer ordem entre si**; a sequência acima é só determinismo. Nenhum deles é
  consumido por outro.

**Fronteiras seguras para parar:** depois do F1 (só uma convenção escrita, nada a usa), depois do F2
(documentos são arquivados, nada é apagado — o estado mais seguro do plano) e depois do F7. Parar
**entre F2 e F3** é aceitável; parar no meio do F3 não é, porque metade da tabela do STEP 8 estaria
corrigida e a outra metade não.

**Validação por F-block além do padrão da camada:** rodar os itens de L1 que citam o arquivo daquele
F-block, antes de commitar o bloco. O L3 roda uma vez, depois do F7, porque ensaia o comando inteiro.

## Reviewer Handoff

**O destino é o ledger, não um arquivo de evidência.** Depois do `#46` a passada de review vive dentro
de `/add-framework--build` STEP 7 e `add-review-discipline` a proíbe de escrever em `docs/plans/` fora
do ledger. Então, para cada F-block, o build deixa no ledger e carrega para o relatório de conclusão:

- **O que mudou** — arquivos tocados, com o id do F-block, na linha `complete` do bloco.
- **Quais níveis de validação cobrem o bloco**, e o estado de cada um, na mesma linha.
- **Toda decisão adiada ou alterada**, como `Ruling:`, com a linha de Validated Decisions de que ela
  se afasta e a cláusula de custo.
- **O resultado do L3.0**, textual, como `Ruling:`, porque ele pode contradizer o Problem 1.

Lacunas que a passada de review precisa caçar ativamente:

1. Um F-block marcado done cujo nível de validação nunca esteve RED — teste escrito depois do conserto
   não prova nada.
2. **Prosa nomeando um artefato sem a declaração `uses:` correspondente.** F2 e F4 introduzem arestas
   novas no grafo; um deles esquecer a declaração faz o build falhar no bloco seguinte, não no dele.
3. **O F3 apagando mais do que a cópia durável cobre.** A regra é: todo caminho que o STEP 8 apaga já
   tem cópia durável no `main`, ou nunca foi para sobreviver pela convenção do F1. Um terceiro caso
   não existe.
4. **A tabela do STEP 8 corrigida pela metade.** A coluna Kept e a coluna Removed precisam concordar
   entre si e com o texto abaixo da tabela, que hoje afirma que `docs/evidence/` é a única classe sem
   leitor pós-merge.
5. **`docs/plans/` sumindo de onde ainda deve estar.** A resolução de `[plan]` em
   `/add-framework--build`, `/add-framework--plan` e `/add-framework--done` continua olhando só
   `docs/plans/`. Um F-block que a estenda para `docs/deliveries/` está fora do escopo decidido.

## References

- Roadmap item 2, `docs/roadmap/index.md` — o enunciado que este plano executa
- `add-doc-schemas/references/delivery-index.md` — o campo `origin`, o corpus que exclui `docs/`, e o
  hard ban 6 que impede reescrever linha
- `docs/changelog/2026-09-09-refactor-review-no-loops.md` — a entrega `#46`, que removeu
  `/add-framework--review` e o companion `--review-vNN.md`, e por isso deixou `review.md` e
  `evidences/` como membros condicionais
- `docs/changelog/2026-09-08-add-delivery-index-internal.md` — a narrativa da entrega que criou
  `/add-framework--done`, o verbo `history` do grafo e a entrada `origin` que este plano muda. O plano
  em si já foi entregue e limpo localmente, o que é exatamente o problema que este plano conserta

---

## Next Steps

/add-framework--build durable-delivery-history

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-09 | Initial creation |
| 2026-09-09 | Review `fix-then-ok`: F2 passa a dizer de onde vem o caminho do design; F3 passa a corrigir a frase sobre `docs/evidence/` ser a única classe sem leitor; F1 separa `evidences/` do companion `--evidence-v01.md`; References aponta para o changelog que existe |
| 2026-09-09 | Realinhado ao `#46` (item 1 do roadmap, já entregue): Context diz que `review.md` e `evidences/` viraram membros condicionais porque nada mais produz nenhum dos dois; F1 escreve essa condicionalidade na convenção; Reviewer Handoff passa do arquivo de evidência para o ledger; Current State corrige os dependentes de `add-framework--release` de 0 para 1 e sai dos números de linha; `STEP 2.4 item 2` vira `STEP 2.3 item 2`; References aponta para o changelog do `#46` |
| 2026-09-09 | Implemented. F1 6a345b1, F2 199b066, F3 c09b7e1 (+30d9a49 from the L3.4 measurement), F4 45eb0d3, F5 027cc0e (+bda959f from the L3.3 probe), F6 2ca4794, F7 f5d2a6c, review findings 8cf862b |
| 2026-09-09 | Escopo estendido pelo usuario no gate de publicacao: F8 [product] estreita o campo `origin` em add-doc-schemas/references/delivery-index.md (a823c91). Reverte a decisao validada "camada internal apenas" e o item de Does NOT Include que excluia o schema do indice |
