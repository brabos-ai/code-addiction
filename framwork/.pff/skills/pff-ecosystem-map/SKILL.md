---
name: pff-ecosystem-map
description: Visao consolidada do pff-pro - commands, skills, relacoes e dependencias. Carregada pelo /pff como source of truth.
---

# Ecosystem Map - pff-pro

> **Source of Truth:** Mapa completo do ecossistema pff-pro.

## Commands

| Command | Proposito | Skills que carrega |
|---------|-----------|-------------------|
| pff | Gateway inteligente - responde duvidas, orienta fluxo, sugere proximo comando | pff-ecosystem-map (source of truth) |
| pff-feature | Discovery de funcionalidade, cria about.md | feature-discovery, feature-specification |
| pff-design | Especificacao UX mobile-first | ux-design |
| pff-plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | planning, plan-based-features |
| pff-dev | Implementacao guiada (coordena subagentes). Suporta `/pff-dev feature N` para Epics | backend/frontend/database + subagent-driven |
| pff-autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | backend/frontend/database |
| pff-review | Revisao de codigo, auto-correcao | code-review, delivery-validation |
| pff-done | Finalizar feature, gera changelog. Valida features completas em Epics + cobertura de requisitos | documentation-style |
| pff-hotfix | Correcao urgente dual-mode: fix em feature existente (F[XXXX]) ou standalone (H[XXXX]). Usa template (.pff/templates/hotfix-template.md) | backend/frontend conforme area |
| pff-brainstorm | Explorar ideias (READ-ONLY) | - |
| pff-audit | Analise tecnica completa do projeto | audit, architecture-discovery |
| pff-pr | Criar PR + changelog automatico | optimizing-git-workflow |
| pff-landing | Builder de landing pages SaaS | landing-page-saas |
| pff-architecture-analyzer | Mapear arquitetura do projeto | architecture-discovery |

## Skills pff-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| architecture-discovery | Mapear arquitetura, detectar patterns | pff-audit, pff-architecture-analyzer |
| backend-development | Patterns NestJS, Clean Arch, DI, DTOs | pff-dev, pff-autopilot, pff-hotfix |
| code-review | Validacao de codigo, auto-correcao | pff-review |
| database-development | Entities, migrations, Kysely, repositories | pff-dev, pff-autopilot |
| delivery-validation | Validar RF/RN implementados | pff-review |
| documentation-style | Padroes de documentacao PFF | pff-done |
| feature-discovery | Processo de discovery de features | pff-feature |
| feature-specification | Estrutura do about.md | pff-feature |
| frontend-development | Patterns React, shadcn, Tailwind | pff-dev, pff-autopilot, pff-hotfix |
| audit | Checklist de saude tecnica | pff-audit |
| landing-page-saas | Framework para landing pages | pff-landing |
| optimizing-git-workflow | Git patterns, commits, branches | pff-pr, pff-done |
| plan-based-features | Implementar baseado no plan.md | pff-plan, pff-dev |
| planning | Orquestracao de planejamento tecnico | pff-plan |
| product-discovery | Discovery de produto (nivel macro) | pff-feature (quando macro) |
| security-audit | Checklist OWASP, RLS, secrets | pff-audit |
| stripe | Integracao com Stripe | pff-dev (features de pagamento) |
| subagent-driven-development | Coordenacao de subagentes | pff-dev |
| token-efficiency | Compressao, JSON compacto | Todas (best practice) |
| updating-claude-documentation | Atualizar CLAUDE.md | pff-done (quando altera arquitetura) |
| using-git-worktrees | Git worktrees para paralelismo | Uso manual |
| ux-design | Componentes, mobile-first, SaaS patterns | pff-design |
| write-skill | Testar commands com pressao | Validacao de commands |
| dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code settings.json | pff, pff-init |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands pff-pro |
| backend-development | pff-dev, pff-autopilot, pff-hotfix |
| frontend-development | pff-dev, pff-autopilot, pff-hotfix, ux-design |
| database-development | pff-dev, pff-autopilot |
| ux-design | pff-design, frontend-development |
| code-review | pff-review |
| pff-dev | pff-autopilot (compartilham logica de implementacao) |
| feature-specification | pff-feature, pff-plan (le about.md) |
| subagent-driven-development | pff-dev, pff-autopilot, pff-review |
| pff-ecosystem-map | /pff (perde visao do todo) |

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
2026-02-06 - refactor pff-hotfix: delete create-hotfix-docs.sh, add template, simplify command
2026-02-06 - update command pff-hotfix (dual-mode: feature fix + standalone)
2026-01-23 - rename pff-health-check -> pff-audit, skill health-check -> audit
2026-01-23 - refactor /pff + cleanup ecosystem-map
2026-01-23 - update commands pff-plan, pff-dev, pff-autopilot, pff-done
