# docs-search-precision (0080F) — v1.10.0

Card: https://app.notion.com/p/41ae0000aeae815897e9f85deb43a596
Priority: Alta
Type: Feature
The intent is the card body below. Do not invent extra scope. Open items: none. Decide any leftover choice by the recommendations already in the card.

## Problema

A busca que os agentes usam para achar entregas, bugs e decisões passadas (o `read` do índice de entregas e o `search` do MCP de docs) compara pedaços de texto soltos. Em pt-BR, palavras como "de" casam com quase tudo: em 5 de 8 consultas reais, todas as 85 entregas vivas voltaram, e "economia de tokens" pôs a entrega errada em 1º. Cada leitura devolve de 10 a 13 KB (cerca de 3 mil tokens), quase tudo lista de commits. O resultado não traz a pontuação nem um trecho que mostre por que casou, então o agente não sabe o quanto confiar em cada resultado.

## Objetivo

O agente acha a entrega certa entre os primeiros resultados, em pt-BR ou em inglês, com uma resposta pequena, ordenada pela relevância e com a pontuação visível. A resposta fica pequena porque só os melhores resultados vêm, nunca porque o texto foi cortado no meio.

## O que esperamos (visão de produto)

**Momento de uso.** No /add-plan, /add-hotfix, /add-diagnose ou /add-review, o agente pergunta "já fizemos algo parecido?" ou "isso já quebrou antes?". É a etapa de discovery, que roda em quase todo comando.

**Exemplo da saída (dado fictício):**

```javascript
busca: "senha de teste QA"  ·  12 casaram · 3 retornados · corte: queda de relevância
1. 0091F qa-project-seed       live   0.92  "...o seed de QA fica fora do git, sem senha fixa..."
2. 0084B docs-branch-fixes      live   0.61  "...authSeed sai do settings.json versionado..."
3. 0040F qa-setup               superseded→0091F  0.40  "...credenciais de teste no settings..."
para ver mais: offset=3 · detalhe: get 0091F
```

**Critério de pronto (verificável).**

- Uma suíte de cerca de 20 consultas reais (metade pt-BR, metade inglês), cada uma com o ID esperado, roda no CI. O ID certo aparece entre os 3 primeiros em pelo menos 18 das 20.
- Nenhuma consulta com "de", "da" ou "para" devolve todas as entregas.
- Uma consulta típica devolve no máximo cerca de 2 mil tokens, e nenhum resultado chega cortado no meio.
- Todo resultado mostra pontuação, status e um trecho curto do texto que casou.

**Fora do escopo.** Embeddings, banco vetorial, reranqueamento por LLM, GraphRAG e decaimento por tempo. A ordem por validade fica no card search-validity-rank. A integração com o GitNexus fica no card gitnexus-integration.

## Decisões

1. Casar por palavra inteira ou início de palavra, nunca por pedaço solto. Termos com menos de 3 letras e stopwords de pt e en são ignorados.
2. Termo raro vale mais que termo comum: um BM25 simples em JS puro, sem dependência nova. Vale para o `read` do índice e para o `search` do MCP.
3. Toda resposta traz a pontuação de cada resultado, normalizada de 0 a 1 em relação ao 1º, e um trecho curto (cerca de 200 caracteres) do campo que casou. É a mesma ideia da busca vetorial: ordenada, com a nota visível.
4. **Tamanho controlado pela relevância, nunca por corte cego.**
   - Padrão de 5 resultados (máximo 20).
   - Um corte pela queda de relevância: para quando a nota cai muito em relação ao anterior, como o autocut do Weaviate, ou fica abaixo de cerca de 30% do 1º.
   - Um orçamento de cerca de 2 mil tokens que tira resultados inteiros do fim e nunca corta um resultado ou o JSON no meio.
   - A resposta diz quantos casaram, quantos voltaram e por que parou, com `offset` para paginar.
5. A busca devolve a lista enxuta, com ID, tipo, status, título, nota, trecho e caminho. O detalhe sai em outra chamada por ID (`get`, que já existe), com limite de tamanho e o aviso de quando foi cortado. A lista de commits e os itens completos saem da busca e ficam só no detalhe.
6. Da mesma cadeia de substituição, só vem a versão atual; a antiga aparece como `superseded→ID`, não como resultado repetido.
7. A suíte de consultas faz parte da entrega e é o que prova a melhora, antes e depois.
8. O `words` das entregas passa a ser escrito em inglês e na língua do time. A skill de discovery manda refazer a busca na outra língua só quando o resultado vier fraco.
9. **Sem legado do caminho antigo no índice.** O campo `origin` das entregas antigas que ainda aponta para `docs/...` passa a apontar para o caminho atual em `.codeadd/docs/`, alinhado à decisão 3 do docs-branch: nada legado do caminho anterior.
10. O orçamento padrão é de cerca de 2 mil tokens, porque é a etapa de discovery e o detalhe vem pelo `get`.
11. Não tem parâmetro concise/detailed. O `get` por ID já faz o papel do detalhado, e é um parâmetro a menos para o agente errar.
12. Sem diversidade (MMR) por ora. Sem embeddings a similaridade seria fraca, e a decisão 6 já tira a repetição mais comum.
13. A suíte de consultas fica junto do command-evals, sobre um corpus de exemplo versionado nos testes. O grafo do nosso repo tem 1 nó e não serve.

## Em aberto

Nenhum.

## Referências

- Análise das duas camadas de busca (Canvas): https://cursor.com/canvas/store-c0205520-6967-4dbd-93af-040f7d201ed4/cef469ce-cfcd-411b-a733-86f8f91e04aa, com a seção "Tamanho da resposta sem perder qualidade".
- Anthropic: Writing effective tools for agents: https://www.anthropic.com/engineering/writing-tools-for-agents
- Weaviate: autocut: https://docs.weaviate.io/weaviate/api/graphql/additional-operators
- ai-memory: ARCHITECTURE.md: https://github.com/akitaonrails/ai-memory/blob/main/docs/ARCHITECTURE.md, com trecho de 24 palavras na busca e a página completa por `memory_read_page`.
