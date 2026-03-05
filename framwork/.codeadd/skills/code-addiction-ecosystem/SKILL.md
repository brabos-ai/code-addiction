---
name: code-addiction-ecosystem
description: Visao consolidada do add-pro - commands, skills, relacoes e dependencias. Carregada pelo /add como source of truth.
---

# Ecosystem Map - add-pro

> **Source of Truth:** Mapa completo do ecossistema add-pro.

## Commands

| Command | Proposito | Skills que carrega |
|---------|-----------|-------------------|
| add | Gateway inteligente - responde duvidas, orienta fluxo, sugere proximo comando | code-addiction-ecosystem, dev-environment-setup |
| add-architecture-analyzer | Mapear arquitetura do projeto | architecture-discovery |
| add-audit | Analise tecnica completa do projeto | documentation-style, health-check, security-audit |
| add-autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | backend-development, database-development, frontend-development, ux-design |
| add-brainstorm | Explorar ideias (READ-ONLY) | documentation-style, code-addiction-ecosystem |
| add-copy | SaaS copy generator - marketing copy para landing pages | saas-copy |
| add-design | Especificacao UX mobile-first | ux-design, documentation-style |
| add-dev | Implementacao guiada (coordena subagentes). Suporta `/add-dev feature N` para Epics | backend-development, database-development, frontend-development, ux-design |
| add-done | Finalizar feature, gera changelog. Valida epics + requisitos. Detecta branch protection e roteia para PR ou merge direto | code-addiction-ecosystem |
| add-feature | Discovery de funcionalidade, cria about.md | feature-discovery, documentation-style, feature-specification, product-discovery |
| add-hotfix | Correcao urgente dual-mode: fix em feature existente (F[XXXX]) ou standalone (H[XXXX]). Usa template (.codeadd/templates/hotfix-template.md) | feature-discovery, ux-design |
| add-init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | product-discovery |
| add-landing | Builder de landing pages SaaS | landing-page-saas |
| add-plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario | backend-development, database-development, frontend-development, ux-design, feature-discovery |
| add-pr | Criar PR para code review (sem finalizar feature). Usado standalone ou referenciado pelo add-done quando branch protection ativo | - |
| add-review | Revisao de codigo, auto-correcao | code-review, delivery-validation, backend-development, database-development, frontend-development, ux-design, security-audit |
| add-test | Geracao automatica de testes, targeting 80% coverage | backend-development, frontend-development |
| add-ux | UX lightweight - aplica conhecimento UX a instrucoes livres com pattern discovery | ux-design |

## Skills add-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| add-ecosystem-map | Visao consolidada do ecossistema (alias) | - |
| architecture-discovery | Mapear arquitetura, detectar patterns | add-architecture-analyzer |
| backend-development | Patterns NestJS, Clean Arch, DI, DTOs | add-autopilot, add-dev, add-plan, add-review, add-test |
| code-addiction-ecosystem | Source of truth do ecossistema add-pro | add, add-brainstorm, add-dev, add-done, add-feature, add-hotfix, add-plan, add-review, add-test, add-design |
| code-review | Validacao de codigo, auto-correcao | add-review |
| database-development | Entities, migrations, Kysely, repositories | add-autopilot, add-dev, add-plan, add-review |
| delivery-validation | Validar RF/RN implementados | add-review |
| dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code settings.json | add |
| documentation-style | Padroes de documentacao ADD | add-audit, add-brainstorm, add-design, add-feature |
| feature-discovery | Processo de discovery de features | add-feature, add-hotfix, add-plan |
| feature-specification | Estrutura do about.md | add-feature |
| frontend-development | Patterns React, shadcn, Tailwind | add-autopilot, add-dev, add-plan, add-review, add-test |
| health-check | Tech health check: documentation, security, architecture, data | add-audit |
| landing-page-saas | Framework para landing pages | add-landing |
| optimizing-git-workflow | Git patterns, commits, branches | - |
| plan-based-features | Implementar baseado no plan.md | - |
| planning | Orquestracao de planejamento tecnico | - |
| product-discovery | Discovery de produto (nivel macro) | add-feature, add-init |
| saas-copy | Frameworks e templates para copy SaaS | add-copy |
| security-audit | Checklist OWASP, RLS, secrets | add-audit, add-review |
| stripe | Integracao com Stripe | - |
| subagent-driven-development | Coordenacao de subagentes | - |
| token-efficiency | Compressao, JSON compacto | Todas (best practice) |
| updating-claude-documentation | Atualizar CLAUDE.md | - |
| ux-design | Componentes, mobile-first, SaaS patterns | add-autopilot, add-design, add-dev, add-hotfix, add-plan, add-review, add-ux |
| write-skill | Criar/atualizar skills | - |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| backend-development | add-autopilot, add-dev, add-plan, add-review, add-test |
| frontend-development | add-autopilot, add-dev, add-plan, add-review, add-test |
| database-development | add-autopilot, add-dev, add-plan, add-review |
| ux-design | add-autopilot, add-design, add-dev, add-hotfix, add-plan, add-review, add-ux |
| code-addiction-ecosystem | add, add-brainstorm, add-dev, add-done, add-feature, add-hotfix, add-plan, add-review, add-test, add-design |
| documentation-style | add-audit, add-brainstorm, add-design, add-feature |
| feature-discovery | add-feature, add-hotfix, add-plan |
| security-audit | add-audit, add-review |
| code-review | add-review |
| delivery-validation | add-review |
| feature-specification | add-feature |
| subagent-driven-development | add-dev, add-autopilot, add-review (implicit pattern) |

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