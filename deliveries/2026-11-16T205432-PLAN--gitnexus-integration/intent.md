# gitnexus-integration (0082F) — v1.10.0

Card: https://app.notion.com/p/41ae0000aeae816eacefd46a66435e2c
Priority: Média
Type: Feature
The intent is the card body below. Do not invent extra scope. Open items: none. For decision 7 (native gitnexus-* skills without hooks), decide by recommendation: keep the native skills if they can be used without hooks and without writing the AGENTS.md block; if not, keep the skills and only skip writing the AGENTS.md block, with hooks still out.

## Problema

Com o plugin GitNexus ligado, o framework tem duas camadas de busca que não conversam. O grafo de código diz o que uma mudança afeta, e o índice de entregas sabe quais entregas e bugs já mexeram naqueles arquivos, mas nenhum comando junta as duas respostas. Também não usamos `detect_changes` (o que o diff afeta) nem `gitnexus status` (se o grafo está velho). A instalação padrão do GitNexus escreve no `AGENTS.md` e no `CLAUDE.md` e instala hooks, o que vai contra as nossas regras. E a licença dele (PolyForm Noncommercial) não aparece para quem liga o plugin.

## Objetivo

Quando o GitNexus está ligado, o agente vê, numa passada só, o que a mudança afeta no código e o que já foi feito ou quebrou naquela área. O grafo está fresco quando é consultado, a instalação não mexe em arquivos nossos, e o usuário sabe da licença antes de ligar. Nós não mantemos o grafo do GitNexus, só a integração.

## O que esperamos (visão de produto)

**Momento de uso.** No /add-plan e no /add-hotfix, antes de planejar uma mudança. No /add-review, ao revisar um diff. E ao ligar o plugin com `codeadd`.

**Exemplo da saída (dado fictício), no /add-review:**

```javascript
Diff afeta 4 símbolos em 2 fluxos (gitnexus detect_changes):
  - authSeed (src/qa/seed.ts) → fluxo "login de teste"
  - loadSettings (src/config.ts) → fluxo "boot"
Já mexeram nesses arquivos (touched_by):
  - 0084B docs-branch-fixes (live): moveu authSeed para settings.local.json
  - 0091F qa-project-seed (live): seed de QA por projeto
Grafo: atualizado (status ok, último analyze há 2 commits)
```

**Critério de pronto (verificável).**

- Num repo de exemplo com o GitNexus ligado, o /add-review cita os símbolos afetados pelo diff e as entregas que já tocaram esses arquivos, sem o agente listar os chamadores à mão.
- Com o grafo velho, o comando roda `gitnexus status`, atualiza o grafo e só então consulta.
- Ligar o plugin não altera o `AGENTS.md` nem o `CLAUDE.md` e não instala hooks.
- A mensagem de ativação mostra a licença.
- Com o plugin desligado, nada muda: nenhum texto do GitNexus entra nos comandos.

**Fora do escopo.** Manter ou estender o grafo do GitNexus, os hooks dele, o modo watch, a wiki gerada por ele, embeddings e grupos de repositórios.

## Decisões

1. **Ligar as camadas.** Os arquivos que o `impact` ou o `detect_changes` apontam vão para o `touched_by` do nosso MCP, e o agente recebe as entregas e os bugs daquela área. Só instrução, nos fragments do plugin para add-plan, add-hotfix e add-review.
2. **`detect_changes` na revisão.** Entra no /add-review e no reviewer-agent no lugar de listar símbolo a símbolo. O add-review passa a receber o fragment do plugin.
3. **Frescor.** Antes da primeira consulta do comando, roda `gitnexus status`; se estiver velho, roda o `analyze`. O comando exato fica escrito no fragment, não "se estiver velho".
4. **Respostas pequenas sem corte cego.** Usar `summaryOnly` no `impact` e paginar com `limit` e `offset`. O `maxTokens` do GitNexus só como rede de segurança, porque ele corta o texto no meio, inclusive o JSON.
5. **Instalação limpa.** O `postEnableHint` orienta a configuração que não escreve no `AGENTS.md` e não instala hooks.
6. **Licença.** A mensagem de ativação do plugin avisa que o GitNexus é PolyForm Noncommercial e que uso comercial pede licença do autor. O aviso também entra no README do plugin, com uma frase só.
7. **Skills nativas sem hooks.** O Engineer confirma no /add-plan se dá para manter as skills nativas `gitnexus-*`, que o nosso despachante usa, sem os hooks e sem o bloco no `AGENTS.md`. Se não der, as skills ficam e a instalação apenas não escreve o bloco no `AGENTS.md`; hooks continuam fora.
8. **A ponte da decisão 1 entra também no /add-diagnose,** onde "isso já quebrou antes?" mais ajuda. É só instrução.

## Em aberto

Nenhum.

## Referências

- Análise das duas camadas de busca (Canvas): https://cursor.com/canvas/store-c0205520-6967-4dbd-93af-040f7d201ed4/cef469ce-cfcd-411b-a733-86f8f91e04aa
- GitNexus: https://github.com/abhigyanpatwari/GitNexus e a referência da CLI: https://github.com/abhigyanpatwari/GitNexus/blob/main/docs/cli-reference.md
- PR do summaryOnly, limit e offset no impact: https://github.com/abhigyanpatwari/GitNexus/pull/1818
