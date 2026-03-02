---
name: fnd-ecosystem-map
description: Visao consolidada do fnd-pro - commands, skills, relacoes e dependencias. Carregada pelo /fnd como source of truth.
---

# Ecosystem Map - fnd-pro

> **Source of Truth:** Mapa completo do ecossistema fnd-pro.

## Commands

| Command | Proposito | Skills que carrega |
|---------|-----------|-------------------|
| fnd | Gateway inteligente - responde duvidas, orienta fluxo, sugere proximo comando | fnd-ecosystem-map (source of truth) |
| fnd-feature | Discovery de funcionalidade, cria about.md | feature-discovery, feature-specification |
| fnd-design | Especificacao UX mobile-first | ux-design |
| fnd-plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | planning, plan-based-features |
| fnd-dev | Implementacao guiada (coordena subagentes). Suporta `/fnd-dev feature N` para Epics | backend/frontend/database + subagent-driven |
| fnd-autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | backend/frontend/database |
| fnd-review | Revisao de codigo, auto-correcao | code-review, delivery-validation |
| fnd-done | Finalizar feature, gera changelog. Valida features completas em Epics + cobertura de requisitos | documentation-style |
| fnd-hotfix | Correcao urgente dual-mode: fix em feature existente (F[XXXX]) ou standalone (H[XXXX]). Usa template (.fnd/templates/hotfix-template.md) | backend/frontend conforme area |
| fnd-brainstorm | Explorar ideias (READ-ONLY) | - |
| fnd-audit | Analise tecnica completa do projeto | audit, architecture-discovery |
| fnd-pr | Criar PR + changelog automatico | optimizing-git-workflow |
| fnd-landing | Builder de landing pages SaaS | landing-page-saas |
| fnd-architecture-analyzer | Mapear arquitetura do projeto | architecture-discovery |

## Skills fnd-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| architecture-discovery | Mapear arquitetura, detectar patterns | fnd-audit, fnd-architecture-analyzer |
| backend-development | Patterns NestJS, Clean Arch, DI, DTOs | fnd-dev, fnd-autopilot, fnd-hotfix |
| code-review | Validacao de codigo, auto-correcao | fnd-review |
| database-development | Entities, migrations, Kysely, repositories | fnd-dev, fnd-autopilot |
| delivery-validation | Validar RF/RN implementados | fnd-review |
| documentation-style | Padroes de documentacao FND | fnd-done |
| feature-discovery | Processo de discovery de features | fnd-feature |
| feature-specification | Estrutura do about.md | fnd-feature |
| frontend-development | Patterns React, shadcn, Tailwind | fnd-dev, fnd-autopilot, fnd-hotfix |
| audit | Checklist de saude tecnica | fnd-audit |
| landing-page-saas | Framework para landing pages | fnd-landing |
| optimizing-git-workflow | Git patterns, commits, branches | fnd-pr, fnd-done |
| plan-based-features | Implementar baseado no plan.md | fnd-plan, fnd-dev |
| planning | Orquestracao de planejamento tecnico | fnd-plan |
| product-discovery | Discovery de produto (nivel macro) | fnd-feature (quando macro) |
| security-audit | Checklist OWASP, RLS, secrets | fnd-audit |
| stripe | Integracao com Stripe | fnd-dev (features de pagamento) |
| subagent-driven-development | Coordenacao de subagentes | fnd-dev |
| token-efficiency | Compressao, JSON compacto | Todas (best practice) |
| updating-claude-documentation | Atualizar CLAUDE.md | fnd-done (quando altera arquitetura) |
| using-git-worktrees | Git worktrees para paralelismo | Uso manual |
| ux-design | Componentes, mobile-first, SaaS patterns | fnd-design |
| write-skill | Testar commands com pressao | Validacao de commands |
| dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code settings.json | fnd, fnd-init |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands fnd-pro |
| backend-development | fnd-dev, fnd-autopilot, fnd-hotfix |
| frontend-development | fnd-dev, fnd-autopilot, fnd-hotfix, ux-design |
| database-development | fnd-dev, fnd-autopilot |
| ux-design | fnd-design, frontend-development |
| code-review | fnd-review |
| fnd-dev | fnd-autopilot (compartilham logica de implementacao) |
| feature-specification | fnd-feature, fnd-plan (le about.md) |
| subagent-driven-development | fnd-dev, fnd-autopilot, fnd-review |
| fnd-ecosystem-map | /fnd (perde visao do todo) |

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
2026-02-06 - refactor fnd-hotfix: delete create-hotfix-docs.sh, add template, simplify command
2026-02-06 - update command fnd-hotfix (dual-mode: feature fix + standalone)
2026-01-23 - rename fnd-health-check -> fnd-audit, skill health-check -> audit
2026-01-23 - refactor /fnd + cleanup ecosystem-map
2026-01-23 - update commands fnd-plan, fnd-dev, fnd-autopilot, fnd-done
