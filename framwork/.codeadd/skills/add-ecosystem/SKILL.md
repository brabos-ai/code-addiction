---
name: add-ecosystem
description: Visao consolidada do add-pro - commands, skills, relacoes e dependencias. Carregada pelo /add como source of truth.
---

# Ecosystem Map - add-pro

> **Source of Truth:** Mapa completo do ecossistema add-pro.

## Commands

| Command | Proposito | Skills que carrega |
|---------|-----------|-------------------|
| add | Gateway inteligente - responde duvidas, orienta fluxo, sugere proximo comando | add-ecosystem, add-dev-environment-setup |
| add.audit | Analise tecnica completa do projeto (seguranca, arquitetura, dados, docs) | add-documentation-style, add-ecosystem |
| add.autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design |
| add.brainstorm | Explorar ideias (READ-ONLY) | add-documentation-style, add-ecosystem |
| add.build | Implementacao guiada (coordena subagentes). Suporta `/add.build feature N` para Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-ecosystem |
| add.review | Revisao de codigo com auto-correcao completa. Cobre frontend, backend, seguranca, delivery validation | add-code-review, add-delivery-validation, add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-security-audit |
| add.commit | Mid-workflow smart commit com mensagem Conventional Commits adaptativa: ≤3 arquivos → linha unica, >3 → lista por modulo | add-commit |
| add.copy | Gerador de copy estruturado para landing pages SaaS | add-saas-copy, add-ecosystem |
| add.design | Especificacao UX mobile-first, coordena subagentes para features complexas | add-ux-design, add-documentation-style |
| add.done | Finalizar feature, gera changelog. Valida epics + requisitos. Detecta branch protection e roteia para PR ou merge direto | add-ecosystem |
| add.hotfix | Correcao urgente com ID global (H[NNNN]). Cria doc isolado em docs/[NNNN]H-*, documenta relacoes em related.md | add-ux-design, add-ecosystem |
| add.init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | add-product-discovery (optional) |
| add.landing | Builder de landing pages SaaS de alta conversao | add-landing-page-saas, add-ecosystem |
| add.new | Discovery de funcionalidade, cria about.md | add-feature-discovery, add-feature-specification, add-documentation-style, add-ecosystem |
| add.plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-feature-discovery, add-ecosystem |
| add.pr | Criar PR para code review (sem finalizar feature). Usado standalone ou referenciado pelo add.done quando branch protection ativo | - |
| add.test | Geracao de testes automatizados (80% coverage). Parallel subagents por area + Startup Test | add-backend-development, add-frontend-development, add-ecosystem |
| add.ux | UX rapido - carrega add-ux-design e aplica ao contexto livre do usuario | add-ux-design |
| add.xray | Mapear arquitetura do projeto, classificar apps, consolidar contexto | add-architecture-discovery, add-ecosystem |

## Skills add-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| add-architecture-discovery | Mapear arquitetura, detectar patterns, gerar stack-context.md | add.audit, add.xray |
| add-backend-architecture | Consultant de arquitetura backend: Simple Modular, Vertical Slice, Clean Architecture, Combined Strategy | - |
| add-backend-development | Arquitetura backend: SOLID, Clean Arch, DTOs, Services, Repository — stack-agnostic | add.build, add.autopilot, add.plan, add.review, add.test |
| add-code-review | Validacao de codigo, auto-correcao | add.review |
| add-commit | Knowledge reference para commits mid-workflow: adaptive message logic, type detection, staging rules | add.commit |
| add-database-development | Arquitetura de dados: entities, repositories, migrations, naming — stack-agnostic | add.build, add.autopilot, add.plan, add.review |
| add-delivery-validation | Validar RF/RN implementados, criterios de aceite | add.review |
| add-dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code | add |
| add-documentation-style | Padroes de documentacao ADD-pro | add.new, add.design, add.brainstorm, add.audit |
| add-ecosystem | Visao consolidada do ecossistema add-pro (source of truth) | add, add.new, add.design, add.plan, add.build, add.done, add.hotfix, add.brainstorm, add.test, add.audit, add.copy, add.landing, add.xray |
| add-feature-discovery | Processo de discovery de features, analise de codebase | add.new, add.plan |
| add-feature-specification | Estrutura do about.md com RFs, RNs, criterios de aceite | add.new |
| add-frontend-architecture | Consultant de arquitetura frontend: Simple Component-Based, Feature-Based, FSD — React/Vue/Angular-aware | - |
| add-frontend-development | Arquitetura frontend: state, data fetching, components, forms, routing — stack-agnostic | add.build, add.autopilot, add.plan, add.review, add.test |
| add-health-check | Health check de ambiente e dependencias do projeto | - |
| add-landing-page-saas | Framework para landing pages de alta conversao SaaS | add.landing |
| add-optimizing-git-workflow | Git patterns, commits, branches, aliases | - |
| add-plan-based-features | Implementar features baseadas em planos de subscription | - |
| add-planning | Orquestracao de planejamento tecnico | - |
| add-product-discovery | Discovery de produto (nivel macro) | add.init (optional) |
| add-project-scaffolding | Criar projetos do zero: Starter/Scale, multi-stack Node.js, stack-context.md | - |
| add-saas-copy | Frameworks e templates de copy para landing pages SaaS | add.copy |
| add-security-audit | Checklist OWASP, RLS, secrets, multi-tenancy | add.audit, add.review |
| add-skill-creator | Criar e testar skills com pressao real | - |
| add-stripe | Integracao com Stripe, price versioning, grandfathering | - |
| add-subagent-driven-development | Coordenacao de subagentes com quality gates | - |
| add-token-efficiency | Compressao, JSON compacto, minimo de tokens | Todas (best practice) |
| add-updating-claude-documentation | Atualizar CLAUDE.md quando arquitetura muda | - |
| add-ux-design | Componentes, mobile-first, SaaS patterns, shadcn, Tailwind | add.design, add.ux, add.build, add.autopilot, add.review, add.hotfix, add.plan |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands add-pro |
| add-backend-development | add.build, add.autopilot, add.plan, add.review, add.test |
| add-frontend-development | add.build, add.autopilot, add.plan, add.review, add.test |
| add-database-development | add.build, add.autopilot, add.plan, add.review |
| add-ux-design | add.design, add.ux, add.build, add.autopilot, add.review, add.hotfix, add.plan |
| add-code-review | add.review |
| add-security-audit | add.audit, add.review |
| add-feature-discovery | add.new, add.plan |
| add-feature-specification | add.new, add.plan (le about.md) |
| add-documentation-style | add.new, add.design, add.brainstorm, add.audit |
| add-architecture-discovery | add.audit, add.xray |
| add-ecosystem | add (perde visao do todo) |
| add.build | add.autopilot (compartilham logica de implementacao) |
| add-project-scaffolding | stack-context.md (consultado por add-backend/database/frontend-development) |
| add-subagent-driven-development | add.build, add.autopilot, add.review |

## Main Flows

| Fluxo | Sequencia | Quando usar |
|-------|-----------|-------------|
| Completo | new -> design -> plan -> build -> check -> done | Features complexas com UI |
| Normal | new -> plan -> build -> done | Features sem UI complexa |
| Simples | new -> build -> done | Features pequenas |
| Autonomo | new -> autopilot -> done | Quer implementacao sem interacao |
| Emergencia | hotfix -> done | Bug critico em producao |
| Exploracao | brainstorm -> new -> ... | Nao sabe por onde comecar |
| Novo Projeto | init -> scaffold -> build -> done | Criar projeto do zero |
| Analise | xray / audit | Verificar saude do projeto |

## Last Updated

2026-03-23 - sync: registered add.commit command, add-backend-architecture and add-frontend-architecture skills in provider-map; fixed add.audit phantom refs (add-audit→add-health-check); removed phantom add-test-specification from add.plan; updated web pages provider dirs (Codex→.agents/, Antigrav→.agent/)
2026-03-20 - sync: regenerated ecosystem map via /add.sync (added add-backend-architecture, add-frontend-architecture)