# Add: TDD Pipeline (PRD0001-fnd-pro)

**Data:** 2026-03-02
**PRD:** PRD0001-fnd-pro
**Tipo:** workflow

## Mudancas

### Criado
- `framwork/.fnd/skills/test-specification/SKILL.md` — Skill para gerar contract test cases a partir de RFs/RNs

### Modificado
- `framwork/.fnd/commands/fnd-plan.md` — Adicionado STEP 9 (Test-Spec Subagent) apos subagentes de area. Tasks de teste sequenciadas ANTES de tasks de implementacao no tasks.md
- `framwork/.fnd/commands/fnd-dev.md` — TDD-aware: executa test tasks primeiro, roda testes como gate de sucesso (nao so build), itera ate testes passarem
- `framwork/.fnd/commands/fnd-test.md` — Detecta contract tests existentes, foca em gaps de cobertura e edge cases sem regerar

## Pipeline Resultante

```
feature → plan(+test-spec) → dev(test-aware) → test(coverage) → review → done
```
