# Review — Native Node backlog

**Plano:** `2026-10-04T004044-PLAN--native-node-backlog.md`  
**Branch:** `feat/native-node-backlog`  
**HEAD revisado:** `5485b6cbc4f0f573dd0f5baa184be5e9d65320cb`  
**Data:** 2026-10-04

## Executive summary

**Recomendação original: solicitar ajustes antes do merge.** A arquitetura segue o plano: entradas nativas Node, módulos compartilhados, publicação Git e migração das instruções. Entretanto, a proteção de recuperação e a preservação do estado do usuário apresentam falhas.

**Resultado: 1 Critical, 5 Major e 3 Minor.** Foram revisados o diff contra main, o plano e o ledger. Os 79 testes existentes de CLI, alocação e publicação passaram no runner Linux/Docker. Reproduções adicionais em repositórios descartáveis no Windows identificaram os cenários abaixo. As referências de linha correspondem ao HEAD revisado.

## Critical

### C1 — Stale sweep remove trabalho detached sem verificar proteção

- **Local:** `framwork/.codeadd/scripts/backlog-git.cjs:385–400`.
- **Evidência:** um worktree limpo com commit exclusivo e sem recovery ref foi removido e recriado na base. Seu conteúdo desapareceu do worktree e nenhuma ref protegeu o commit.
- **Impacto:** possível perda após expiração/pruning. O teste `cli/tests/backlog-publication.test.js:397–412` espera incorretamente esse descarte.
- **Ajuste:** verificar alcançabilidade por referência durável antes de remover; recusar trabalho não protegido com `REFUSED=worktree-recovery-required`, caminho e SHA. Atualizar a regressão para exigir preservação.

## Major

### M1 — Falha de staging escapa sem relatório de recuperação

- **Local:** `backlog-git.cjs:344–351`; `backlog-commit.cjs:308`.
- **Evidência:** com index.lock existente, o ticket foi persistido, stdout ficou vazio e a execução terminou com stack trace, sem TICKET_ID, PERSISTED ou RECOVERY_PATH.
- **Ajuste:** tratar staging como falha controlada com exit 1, dados preservados e relatório estruturado. Liberar o lock de captura no encerramento normal, inclusive quando o worktree é retido; a próxima execução deve reconhecer recuperação pendente.

### M2 — Commit elimina a separação staged/unstaged do backlog

- **Local:** `backlog-git.cjs:348–355`.
- **Evidência:** uma versão staged de backlog.definitions.json foi substituída pela versão unstaged; a versão unstaged foi commitada e o diff staged desapareceu.
- **Ajuste:** isolar o index e publicar somente a alteração desta operação, preservando os blobs staged e os bytes do working tree do usuário. Sobreposição que não possa ser mesclada com segurança deve reter os dados e reportar degradação, sem alterar o index do usuário.

### M3 — Detecção de rebase incorreta em worktrees linked

- **Local:** `backlog-git.cjs:189–195`.
- **Evidência:** um rebase pausado com working tree limpo retornou rebasing=false. Nos worktrees linked, .git é um arquivo; rebase-merge/rebase-apply não são verificados.
- **Ajuste:** resolver os caminhos pelo Git, inspecionar os diretórios de rebase e considerar inspeção malsucedida insegura. Verificar o estado após abort.

### M4 — Falha de avanço da base local ocultada após push

- **Local:** `backlog-commit.cjs:391–398`.
- **Evidência:** um commit local não publicado e outro independente no remoto produziram rebase/push bem-sucedidos, mas main local permaneceu antigo. Não houve DEGRADED e as refs próprias foram removidas.
- **Ajuste:** reportar a divergência mesmo após push bem-sucedido e manter proteção conforme a política do plano. A justificativa anterior do ledger de que o cenário seria impossível foi refutada pela reprodução.

### M5 — Aceitação multiplataforma incompleta

- **Local:** plano L7; ledger linha 74; changelog, seção What arrives.
- **Evidência:** o ledger reconhece R8 incompleta, mas a entrega é apresentada como implementada para Windows, Linux e macOS.
- **Ajuste:** executar e registrar evidências faltantes no HEAD final ou alterar explicitamente o aceite com o usuário. Até lá, manter a aceitação pendente; Linux/Docker não substitui macOS.

## Minor

### m1 — Parser interpreta target literal como opção

- **Local:** `backlog-cli.cjs:79–94`.
- **Evidência:** update --record-file --record-file arquivo retorna bad-argument em vez de preservar o primeiro argumento como target literal. A opção também é aceita fora da posição trailing.
- **Ajuste:** reservar a posição do target antes de interpretar o par trailing e testar ambos os casos.

### m2 — Escritas E2E concorrentes no mesmo backlog

- **Local:** `board/e2e/native-backlog.spec.ts:41–67`; `board/playwright.config.ts:67–70`.
- **Impacto:** três projetos compartilham arquivo mutável e add paralelo, mas o contrato não oferece reserva/coordenação concorrente. Possíveis disputas de ID e sobrescritas tornam a prova instável.
- **Ajuste:** isolar fixture/server por projeto ou serializar as operações mutáveis, sem introduzir concorrência no produto.

### m3 — Diagnósticos orientam para Bash ou localização incorreta

- **Local:** `backlog-cli.cjs:35–43`; `add--backlog/SKILL.md:225–239`.
- **Impacto:** usage omite Node/record-file; a tabela afirma que commits estão na base local quando podem existir somente por recovery ref/worktree.
- **Ajuste:** Node como invocação principal; relatar localização a partir de ROUTE, SHA e RECOVERY_*.

## Acompanhamento

Correções autorizadas pelo usuário após a apresentação desta review. O histórico acima permanece como registro do diagnóstico original; resultados e pendências da correção serão registrados abaixo.

| Finding | Estado inicial |
|---|---|
| C1, M1–M4, m1–m3 | Corrigidos; regressões e integração aprovadas em Linux/Docker e board Windows |
| M5 | Encerrado por alteração explícita do aceite: parcialmente validado; macOS não executado |

### Evidência das correções

- CLI completa: 1785 testes em 76 arquivos aprovados em Linux/Docker, incluindo 38 testes de publicação e 33 de CLI.
- Wrappers Bash: 72 testes aprovados em Linux/Docker.
- Board Windows: 113 testes unit/integration aprovados; browser 163 aprovados e 20 skips de viewport.
- Builds product e board aprovados; inventário atualizado sem alterações.
- As primeiras execuções completas sofreram timeouts sob carga; execuções completas posteriores passaram. A opção maxWorkers enviada via npm foi ignorada pelo npm; os passes não dependem dela.
- Publicação Windows: 38/38 testes aprovados no runner nativo, exit 0, duração 161,75 s. A primeira execução foi interrompida pelo timeout externo de 120 s. macOS permanece sem execução.

### Aceite final — 2026-10-04

O usuário dispensou a evidência macOS por não ter um Mac e aceitou a entrega como **parcialmente validada**. M5 deixa de bloquear o encerramento. As evidências Windows e Linux/Docker permanecem válidas; macOS não foi executado.
