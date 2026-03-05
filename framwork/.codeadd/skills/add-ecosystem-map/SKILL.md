---
name: code-addiction-ecosystem
description: Visao consolidada do add-pro - commands, skills, relacoes e dependencias. Carregada pelo /add como source of truth.
---

# Ecosystem Map - add-pro

> **Source of Truth:** Mapa completo do ecossistema add-pro.

## Commands

| Command | Proposito | Skills que carrega |
|---------|-----------|-------------------|
| add | Gateway inteligente - responde duvidas, orienta fluxo, sugere proximo comando | code-addiction-ecosystem (source of truth) |
| add-feature | Discovery de funcionalidade, cria about.md | feature-discovery, feature-specification |
| add-design | Especificacao UX mobile-first | ux-design |
| add-plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | planning, plan-based-features |
| add-dev | Implementacao guiada (coordena subagentes). Suporta `/add-dev feature N` para Epics | backend/frontend/database + subagent-driven |
| add-autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | backend/frontend/database |
| add-review | Revisao de codigo, auto-correcao | code-review, delivery-validation |
| add-done | Finalizar feature, gera changelog. Valida features completas em Epics + cobertura de requisitos | documentation-style |
| add-hotfix | Correcao urgente dual-mode: fix em feature existente (F[XXXX]) ou standalone (H[XXXX]). Usa template (.codeadd/templates/hotfix-template.md) | backend/frontend conforme area |
| add-brainstorm | Explorar ideias (READ-ONLY) | - |
| add-audit | Analise tecnica completa do projeto | audit, architecture-discovery |
| add-pr | Criar PR + changelog automatico | optimizing-git-workflow |
| add-landing | Builder de landing pages SaaS | landing-page-saas |
| add-architecture-analyzer | Mapear arquitetura do projeto | architecture-discovery |

## Skills add-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| architecture-discovery | Mapear arquitetura, detectar patterns | add-audit, add-architecture-analyzer |
| backend-development | Patterns NestJS, Clean Arch, DI, DTOs | add-dev, add-autopilot, add-hotfix |
| code-review | Validacao de codigo, auto-correcao | add-review |
| database-development | Entities, migrations, Kysely, repositories | add-dev, add-autopilot |
| delivery-validation | Validar RF/RN implementados | add-review |
| documentation-style | Padroes de documentacao ADD | add-done |
| feature-discovery | Processo de discovery de features | add-feature |
| feature-specification | Estrutura do about.md | add-feature |
| frontend-development | Patterns React, shadcn, Tailwind | add-dev, add-autopilot, add-hotfix |
| audit | Checklist de saude tecnica | add-audit |
| landing-page-saas | Framework para landing pages | add-landing |
| optimizing-git-workflow | Git patterns, commits, branches | add-pr, add-done |
| plan-based-features | Implementar baseado no plan.md | add-plan, add-dev |
| planning | Orquestracao de planejamento tecnico | add-plan |
| product-discovery | Discovery de produto (nivel macro) | add-feature (quando macro) |
| security-audit | Checklist OWASP, RLS, secrets | add-audit |
| stripe | Integracao com Stripe | add-dev (features de pagamento) |
| subagent-driven-development | Coordenacao de subagentes | add-dev |
| token-efficiency | Compressao, JSON compacto | Todas (best practice) |
| updating-claude-documentation | Atualizar CLAUDE.md | add-done (quando altera arquitetura) |
| using-git-worktrees | Git worktrees para paralelismo | Uso manual |
| ux-design | Componentes, mobile-first, SaaS patterns | add-design |
| write-skill | Testar commands com pressao | Validacao de commands |
| dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code settings.json | add, add-init |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands add-pro |
| backend-development | add-dev, add-autopilot, add-hotfix |
| frontend-development | add-dev, add-autopilot, add-hotfix, ux-design |
| database-development | add-dev, add-autopilot |
| ux-design | add-design, frontend-development |
| code-review | add-review |
| add-dev | add-autopilot (compartilham logica de implementacao) |
| feature-specification | add-feature, add-plan (le about.md) |
| subagent-driven-development | add-dev, add-autopilot, add-review |
| code-addiction-ecosystem | /add (perde visao do todo) |

## Main Flows

| Fluxo | Sequencia | Quando usar |
|-------|-----------|-------------|
| Completo | feature -> design -> plan -> dev -> review -> done | Features complexas com UI |
| Normal | feature -> plan -> dev -> done | Features sem UI complexa |
| Simples | feature -> dev -> done | Features pequenas |
| Autonomo | feature -> autopilot -> done | Quer implementacao sem interacao |
| Emergencia | hotfix -> done | Bug critico em producao |
| Exploracao | brainstorm -> feature -> ... | Nao sabe por onde comecar |
| Analise | audit | Verificar saude do projeto |

## Last Updated

2026-02-18 - add skill dev-environment-setup (WSL/git/jq/gh setup, VS Code settings.json merge)
2026-02-06 - refactor add-hotfix: delete create-hotfix-docs.sh, add template, simplify command
2026-02-06 - update command add-hotfix (dual-mode: feature fix + standalone)
2026-01-23 - rename add-health-check -> add-audit, skill health-check -> audit
2026-01-23 - refactor /add + cleanup ecosystem-map
2026-01-23 - update commands add-plan, add-dev, add-autopilot, add-done
