# pm-refinement-standard (0081F) — v1.10.0

Card: https://app.notion.com/p/41ae0000aeae81bcbd34e8b3be3e1cd7
Priority: Alta
Type: Feature
The intent is the card body below. Do not invent extra scope. Open items: none. Decide any leftover choice by the recommendations already in the card.

## Problema

Os cards refinados chegam crus na engenharia: texto solto, sem dizer o que se espera da entrega do ponto de vista do produto. A role de PM do agent mode (`framwork/.codeadd/agent-mode/roles/product-pm.md`, 2,7 KB) fala de comandos, limites, handoff, release e de quando perguntar, mas não diz o que um card refinado precisa ter. O intent ainda vivia numa subpágina separada do card, o que dá um clique a mais e deixa os dois ficarem diferentes.

## Objetivo

Todo card que passa por refinamento chega na engenharia como o card de um PM que sabe o que quer: qual é o problema, qual é o objetivo, quando é usado, como é a saída, como saber que está pronto e o que fica de fora. Tudo em visão de produto, nunca dizendo como implementar, e no próprio corpo do card.

## O que esperamos (visão de produto)

**Momento de uso.** Quando o PM de qualquer projeto que usa o Code Addiction refina um card antes do /add-new e do handoff para o Engineer.

**Exemplo da saída (dado fictício), o corpo de um card refinado:**

```javascript
## Problema      Usuário perde o relatório quando fecha a aba.
## Objetivo      O relatório fica salvo e reabre de onde parou.
## O que esperamos
   Momento de uso: fim do dia, revisando o relatório do time.
   Exemplo da saída: [mock da tela com "Rascunho salvo às 18:02"] (fictício)
   Pronto quando: fecho e reabro a aba e vejo o mesmo texto, em menos de 2 s.
   Fora do escopo: edição por duas pessoas ao mesmo tempo.
## Decisões      1. Salva a cada 10 s.  2. ...
## Em aberto     1. Guardar por quantos dias? Recomendo 30.
## Critérios de aceite
   WHEN fecho a aba com texto não salvo THEN ao reabrir vejo o rascunho
```

**Critério de pronto (verificável).**

- A role de PM tem uma seção que diz o que um card refinado precisa ter, com as partes acima.
- O template do intent tem a seção "O que esperamos" e os critérios de aceite WHEN/THEN, obrigatórios.
- A role diz que o intent é o corpo do card, sem subpágina.
- Um teste garante que essas partes existem na role e no template.
- Num card de exemplo, um leitor que não participou do refinamento entende em menos de 2 minutos o que deve ser entregue.

**Fora do escopo.** Dizer no card como implementar (isso é o /add-plan do Engineer), mudar o quadro do Notion ou as propriedades dele, e reescrever os cards que já existem.

## Decisões

1. **O intent é o corpo do card,** sem subpágina "intent". As partes são: Problema, Objetivo, O que esperamos, Decisões, Em aberto (cada um com recomendação) e Critérios de aceite em WHEN/THEN.
2. **"O que esperamos" tem 4 partes,** como o [MEET] PM já usa: momento de uso (quando e por que o usuário usa); exemplo concreto da saída marcado como fictício (arquivo, tela ou CLI); critério de pronto que o usuário consegue conferir; e o que fica fora do card.
3. **A pesquisa de mercado, com fontes, só entra em feature aberta,** e o tamanho do card acompanha o tamanho da entrega. Card de roadmap fica curto.
4. **Sempre visão de produto,** nunca como implementar.
5. **Muda a role** `framwork/.codeadd/agent-mode/roles/product-pm.md` **e o template do intent.** O /add-plan continua salvando a cópia do intent na `codeadd-docs`.
6. **Os cards que já têm subpágina de intent ficam como estão.** A regra vale para os novos.
7. **O fluxo fica:** PM refina no corpo do card, o usuário revisa no Backlog, depois /add-new, A fazer e handoff.
8. **O exemplo da saída é obrigatório em todo card.** Em bug e hotfix ele tem uma linha: o comportamento certo esperado.
9. **Os critérios WHEN/THEN ficam no corpo do card,** porque são visão de produto e é o que o usuário confere. O plano pode referenciá-los.
10. **A regra também vale para o template do Grok Bot no agent mode,** ainda pendente, para sair coerente.
11. **Nenhum intent separado quando o projeto usa Notion.** O corpo do card é o intent, e o Engineer lê o corpo do card para rodar o /add-plan. Sai a exigência de subpágina ou arquivo de intent à parte nos lugares que hoje tratam o "intent file" como o handoff:

- `framwork/.codeadd/agent-mode/roles/product-pm.md` (linhas 17, 32 a 36, 50 e 56 a 57);
- `framwork/.codeadd/agent-mode/roles/chief-engineer.md` (linhas 34, 40 a 43 e 51 a 56; a linha 54, "no intent file is assigned to you", passa a ser "nenhum card atribuído");
- `framwork/.codeadd/agent-mode/README.md` (linhas 224, 236 a 237 e 255);
- `framwork/.codeadd/skills/add--agent-notion/SKILL.md` (linha 21), que também passa a dizer que o intent é o corpo do card.

Em projeto sem Notion, o handoff continua sendo o arquivo de intent do /add-brainstorm mais a pasta da feature, porque não existe card. O /add-plan continua salvando a cópia na `codeadd-docs`.

## Em aberto

Nenhum.

## Referências

- Resumo pós-reunião (porta de LLM): https://app.notion.com/p/41ae0000aeae8182a683e214adbe466e
- Decisão do Maicon em 16/11/2026: sem subpágina de intent; o corpo do card é o intent.
