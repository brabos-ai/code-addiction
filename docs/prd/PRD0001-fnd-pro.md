# PRD: TDD no Fluxo FND — Test-Spec Subagent no /fnd-plan

> **Status:** implemented
> **Produto:** fnd-pro
> **Tipo:** workflow
> **Criado:** 2026-03-02
> **Autor:** Maicon + Claude (FND Strategy)

---

## Contexto

O pipeline FND atual segue `feature → plan → dev → test → review → done`. Testes são gerados DEPOIS da implementação pelo `/fnd-test`, focado em cobertura (80%). Isso é "test-after" — o código já existe quando os testes aparecem.

O `/fnd-feature` já gera requisitos funcionais (RFs), regras de negócio (RNs) e requisitos não-funcionais (RNFs) no `about.md` com formato testável (`[condição] → [resultado]`). O `/fnd-plan` já gera contratos técnicos (endpoints, DTOs, entities). Toda a informação necessária para gerar testes ANTES do código já existe no pipeline — só não é usada para isso.

## Problema

1. Testes pós-implementação validam código que já existe — não validam se os requisitos foram atendidos antes de codar
2. O `/fnd-dev` não usa testes como critério de sucesso — só valida build
3. Não há mecanismo que force o código a satisfazer os requisitos do `about.md` de forma verificável

## Proposta

Adicionar um **subagente test-spec** ao `/fnd-plan` que roda APÓS os subagentes de área (DB → Backend → Frontend) e gera test cases derivados dos RFs/RNs do `about.md` + contratos técnicos do `plan.md`. Esses testes entram no `tasks.md` como tasks sequenciadas ANTES das tasks de implementação.

O `/fnd-dev` passa a ser TDD-aware: detecta test files existentes e roda testes como gate de sucesso (não só build). O ciclo do dev vira: implementar → rodar testes → iterar até passar.

O `/fnd-test` pós-dev continua existindo como complemento focado em cobertura e edge cases.

## Escopo

### Inclui

- **Subagente test-spec no `/fnd-plan`:** Novo subagente que roda após DB/Backend/Frontend. Lê `about.md` (RFs, RNs, RNFs) + outputs dos subagentes de área (endpoints, DTOs, entities). Gera test cases concretos.
- **Tasks de teste no `tasks.md`:** Test cases gerados entram como tasks no `tasks.md`, sequenciadas ANTES das tasks de implementação de cada área.
- **`/fnd-dev` TDD-aware:** Dev detecta que existem test files, roda testes como gate de sucesso (além de build), itera até testes passarem.
- **Compatibilidade com `/fnd-test`:** O test pós-dev detecta que contract tests já existem e foca em gaps de cobertura e edge cases.

### NÃO Inclui (importante!)

- Mudanças no `/fnd-feature` — RFs/RNs já são testáveis como estão
- Mudanças no `/fnd-review` — já valida spec compliance
- Mudanças no `/fnd-done` — não afetado
- TDD como flag opcional — sempre ativo quando plan gera tasks
- Ensino/pedagogia de TDD para o aluno — o aluno é empreendedor, não técnico. TDD é mecanismo interno de qualidade, não conteúdo educacional.

## Decisões Validadas

| Questão | Decisão | Rationale |
|---------|---------|-----------|
| Modelo de TDD | Subagente dedicado para testes (opção A) | Separação de responsabilidade clara. Subagente especializado gera testes melhores que misturar na geração de código |
| Encaixe no pipeline | Embutido no `/fnd-plan` como subagente (opção C) | Zero commands novos. `tasks.md` já é o contrato de execução do dev — incluir tasks de teste é natural |
| `/fnd-test` pós-dev | Mantido como complemento (opção B) | Contract tests cobrem especificação (RFs/RNs). Post-dev cobre edge cases, error handling, integração. São complementares |
| `/fnd-dev` TDD-aware | Sim | Sem isso, gerar testes antes não muda nada — dev ignoraria os testes |
| Ajuste no `/fnd-feature` | Não necessário | `about.md` já produz RFs (`[ação] [objeto] [condição]`) e RNs (`[condição] → [resultado]`) que são diretamente testáveis |

## Trade-offs Aceitos

| Ganhamos | Abrimos mão de |
|----------|----------------|
| Requisitos validados por testes antes do código existir | `/fnd-plan` fica mais lento (subagente adicional) |
| `/fnd-dev` com gate de qualidade real (testes, não só build) | Dev pode precisar de mais iterações para passar testes |
| Duas camadas de teste: contrato (plan) + cobertura (test) | Complexidade de manutenção de dois momentos de teste |
| Pipeline auto-verificável end-to-end | Tasks.md fica maior com tasks de teste incluídas |

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Subagente test-spec gera testes frágeis ou acoplados à implementação | Média | Testes devem ser baseados em CONTRATO (input/output), não em implementação interna. Skill de test-spec deve ter regras claras |
| `/fnd-dev` entra em loop infinito tentando passar testes mal escritos | Baixa | Limite de iterações (já existe pattern no fnd-dev: max iterations). Se não passa após N tentativas, reportar e parar |
| Duplicação entre contract tests (plan) e coverage tests (test) | Média | `/fnd-test` deve detectar testes existentes e focar em gaps — não regerar o que já existe |
| `tasks.md` fica grande demais com tasks de teste + implementação | Baixa | Tasks de teste são compactas (nome do test case + assertion esperada). Não é código completo no tasks.md |

## Impacto no Ecossistema

| Componente | Ação necessária |
|------------|-----------------|
| `/fnd-plan` | Adicionar subagente test-spec após subagentes de área. Gerar tasks de teste no `tasks.md` antes das tasks de implementação |
| `/fnd-dev` | Adicionar detecção de test files + execução de testes como gate de sucesso + iteração até testes passarem |
| `/fnd-test` | Adicionar detecção de contract tests existentes. Focar em gaps de cobertura, não regerar |
| `/fnd-feature` | Nenhuma mudança |
| `/fnd-review` | Nenhuma mudança |
| `/fnd-done` | Nenhuma mudança |
| Skills | Criar skill `test-specification` com regras de geração de testes a partir de RFs/RNs |
| Pipeline docs | Atualizar diagrama do fluxo com novo step |

## Pipeline Resultante

```
feature → plan(+test-spec) → dev(test-aware) → test(coverage) → review → done

Detalhamento do /fnd-plan:
  1. Subagente DB (entities, migrations)
  2. Subagente Backend (endpoints, DTOs, services)
  3. Subagente Frontend (components, pages, hooks)
  4. Subagente Test-Spec (lê about.md + outputs 1-3 → gera test cases)
  5. Consolidação → plan.md + tasks.md (com tasks de teste antes de tasks de código)

Detalhamento do /fnd-dev com TDD:
  1. Lê tasks.md
  2. Implementa tasks de TESTE primeiro (gera test files)
  3. Implementa tasks de CÓDIGO
  4. Roda testes como gate (não só build)
  5. Itera até testes passarem
  6. Checkpoint
```

## Referências

- `framwork/.fnd/commands/fnd-plan.md` — Command spec do plan atual
- `framwork/.fnd/commands/fnd-dev.md` — Command spec do dev atual
- `framwork/.fnd/commands/fnd-test.md` — Command spec do test atual
- `framwork/.fnd/commands/fnd-feature.md` — Command spec do feature
- `framwork/.fnd/skills/feature-specification/SKILL.md` — Skill que define formato de RFs/RNs/RNFs

---

## Proximos Passos

```
/fnd-build PRD0001-fnd-pro
```

---

## Changelog do PRD

| Data | Mudanca |
|------|---------|
| 2026-03-02 | Criacao inicial |
| 2026-03-02 | Implementado via /fnd-build |
