<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/ecosystem-map/SKILL.md -->
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
| add.new | Discovery de funcionalidade, cria about.md | feature-discovery, feature-specification |
| add.design | Especificacao UX mobile-first | ux-design |
| add.plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | planning, plan-based-features |
| add.build | Implementacao guiada (coordena subagentes). Suporta `/add.build feature N` para Epics | backend/frontend/database + subagent-driven |
| add.autopilot | Implementacao autonoma sem interacao. Suporta `/add.autopilot feature N` para Epics | backend/frontend/database |
| add.check | Revisao de codigo, auto-correcao | code-review, delivery-validation |
| add.ship | Finalizar feature, gera changelog. Valida epics + requisitos. Detecta branch protection e roteia para PR ou merge direto | documentation-style |
| add.hotfix | Correcao urgente dual-mode: fix em feature existente (F[XXXX]) ou standalone (H[XXXX]). Usa template (.codeadd/templates/hotfix-template.md) | backend/frontend conforme area |
| add.brainstorm | Explorar ideias (READ-ONLY) | - |
| add.audit | Analise tecnica completa do projeto | audit, architecture-discovery |
| add.pr | Criar PR para code review (sem finalizar feature). Usado standalone ou referenciado pelo add.ship quando branch protection ativo | optimizing-git-workflow |
| add.landing | Builder de landing pages SaaS | landing-page-saas |
| add.xray | Mapear arquitetura do projeto | architecture-discovery |
| add.sync | Validar consistencia do ecossistema - cross-reference commands/skills, parity providers, regenerar mapa | code-addiction-ecosystem |

## Skills add-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| architecture-discovery | Mapear arquitetura, detectar patterns | add.audit, add.xray |
| backend-development | Patterns NestJS, Clean Arch, DI, DTOs | add.build, add.autopilot, add.hotfix |
| code-review | Validacao de codigo, auto-correcao | add.check |
| database-development | Entities, migrations, Kysely, repositories | add.build, add.autopilot |
| delivery-validation | Validar RF/RN implementados | add.check |
| documentation-style | Padroes de documentacao ADD | add.ship |
| feature-discovery | Processo de discovery de features | add.new |
| feature-specification | Estrutura do about.md | add.new |
| frontend-development | Patterns React, shadcn, Tailwind | add.build, add.autopilot, add.hotfix |
| audit | Checklist de saude tecnica | add.audit |
| landing-page-saas | Framework para landing pages | add.landing |
| optimizing-git-workflow | Git patterns, commits, branches | add.pr, add.ship |
| plan-based-features | Implementar baseado no plan.md | add.plan, add.build |
| planning | Orquestracao de planejamento tecnico | add.plan |
| product-discovery | Discovery de produto (nivel macro) | add.new (quando macro) |
| security-audit | Checklist OWASP, RLS, secrets | add.audit |
| stripe | Integracao com Stripe | add.build (features de pagamento) |
| subagent-driven-development | Coordenacao de subagentes | add.build |
| token-efficiency | Compressao, JSON compacto | Todas (best practice) |
| updating-claude-documentation | Atualizar CLAUDE.md | add.ship (quando altera arquitetura) |
| ux-design | Componentes, mobile-first, SaaS patterns | add.design |
| skill-creator | Criar e melhorar skills (tier, CSO, anti-rationalization) | add.make (builds de skill) |
| dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code settings.json | add, add.init |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands add-pro |
| backend-development | add.build, add.autopilot, add.hotfix |
| frontend-development | add.build, add.autopilot, add.hotfix, ux-design |
| database-development | add.build, add.autopilot |
| ux-design | add.design, frontend-development |
| code-review | add.check |
| add.build | add.autopilot (compartilham logica de implementacao) |
| feature-specification | add.new, add.plan (le about.md) |
| subagent-driven-development | add.build, add.autopilot, add.check |
| code-addiction-ecosystem | /add (perde visao do todo) |

## Main Flows

| Fluxo | Sequencia | Quando usar |
|-------|-----------|-------------|
| Completo | new -> design -> plan -> build -> check -> ship | Features complexas com UI |
| Normal | new -> plan -> build -> ship | Features sem UI complexa |
| Simples | new -> build -> ship | Features pequenas |
| Autonomo | new -> autopilot -> ship | Quer implementacao sem interacao |
| Emergencia | hotfix -> ship | Bug critico em producao |
| Exploracao | brainstorm -> new -> ... | Nao sabe por onde comecar |
| Analise | audit | Verificar saude do projeto |
