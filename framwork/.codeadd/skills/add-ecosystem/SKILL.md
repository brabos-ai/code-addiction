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
| add.commit | Mid-workflow smart commit com mensagem Conventional Commits adaptativa: ≤3 arquivos → linha unica, >3 → lista por modulo. Auto-staging, flags --push e --confirm, deteccao de .env | add-commit |
| add-architecture-analyzer | Mapear arquitetura do projeto, classificar apps, consolidar contexto | add-architecture-discovery |
| add-audit | Analise tecnica completa do projeto (seguranca, arquitetura, dados, docs) | add-documentation-style, add-architecture-discovery, add-security-audit |
| add-autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design |
| add-brainstorm | Explorar ideias (READ-ONLY) | add-documentation-style |
| add-copy | Gerador de copy estruturado para landing pages SaaS | add-saas-copy |
| add-design | Especificacao UX mobile-first, coordena subagentes para features complexas | add-ux-design, add-documentation-style |
| add-dev | Implementacao guiada (coordena subagentes). Suporta `/add-dev feature N` para Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design |
| add-done | Finalizar feature, gera changelog. Valida epics + requisitos. Detecta branch protection e roteia para PR ou merge direto | - |
| add-feature | Discovery de funcionalidade, cria about.md | add-feature-discovery, add-feature-specification, add-documentation-style |
| add-hotfix | Correcao urgente com ID global (H[NNNN]). Cria doc isolado em docs/[NNNN]H-*, documenta relacoes em related.md | add-ux-design |
| add-init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | add-product-discovery (optional) |
| add-landing | Builder de landing pages SaaS de alta conversao | add-landing-page-saas |
| add-plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-feature-discovery |
| add-pr | Criar PR para code review (sem finalizar feature). Usado standalone ou referenciado pelo add-done quando branch protection ativo | - |
| add-review | Revisao de codigo, auto-correcao | add-code-review, add-delivery-validation, add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-security-audit |
| add-test | Geracao de testes automatizados (80% coverage). Parallel subagents por area + Startup Test | add-backend-development, add-frontend-development |
| add-ux | UX rapido - carrega add-ux-design e aplica ao contexto livre do usuario | add-ux-design |

## Skills add-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| add-architecture-discovery | Mapear arquitetura, detectar patterns, gerar stack-context.md | add-audit, add-architecture-analyzer |
| add-backend-development | Arquitetura backend: SOLID, Clean Arch, DTOs, Services, Repository — stack-agnostic | add-dev, add-autopilot, add-plan, add-review, add-test |
| add-code-review | Validacao de codigo, auto-correcao | add-review |
| add-commit | Knowledge reference para commits mid-workflow: adaptive message logic, type detection, staging rules | add.commit |
| add-database-development | Arquitetura de dados: entities, repositories, migrations, naming — stack-agnostic | add-dev, add-autopilot, add-plan, add-review |
| add-delivery-validation | Validar RF/RN implementados, criterios de aceite | add-review |
| add-dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code | add |
| add-documentation-style | Padroes de documentacao ADD-pro | add-feature, add-design, add-brainstorm, add-audit |
| add-ecosystem | Visao consolidada do ecossistema add-pro (source of truth) | add, add-feature, add-design, add-plan, add-dev, add-review, add-done, add-hotfix, add-brainstorm, add-test |
| add-feature-discovery | Processo de discovery de features, analise de codebase | add-feature, add-plan |
| add-feature-specification | Estrutura do about.md com RFs, RNs, criterios de aceite | add-feature |
| add-frontend-development | Arquitetura frontend: state, data fetching, components, forms, routing — stack-agnostic | add-dev, add-autopilot, add-plan, add-review, add-test |
| add-health-check | Health check de ambiente e dependencias do projeto | - |
| add-landing-page-saas | Framework para landing pages de alta conversao SaaS | add-landing |
| add-optimizing-git-workflow | Git patterns, commits, branches, aliases | - |
| add-plan-based-features | Implementar features baseadas em planos de subscription | - |
| add-planning | Orquestracao de planejamento tecnico | - |
| add-product-discovery | Discovery de produto (nivel macro) | add-init (optional) |
| add-project-scaffolding | Criar projetos do zero: Starter/Scale, multi-stack Node.js, stack-context.md | add-init (futuro) |
| add-saas-copy | Frameworks e templates de copy para landing pages SaaS | add-copy |
| add-security-audit | Checklist OWASP, RLS, secrets, multi-tenancy | add-audit, add-review |
| add-skill-creator | Criar e testar skills com pressao real | - |
| add-stripe | Integracao com Stripe, price versioning, grandfathering | add-dev (features de pagamento) |
| add-subagent-driven-development | Coordenacao de subagentes com quality gates | - |
| add-token-efficiency | Compressao, JSON compacto, minimo de tokens | Todas (best practice) |
| add-updating-claude-documentation | Atualizar CLAUDE.md quando arquitetura muda | - |
| add-ux-design | Componentes, mobile-first, SaaS patterns, shadcn, Tailwind | add-design, add-ux, add-dev, add-autopilot, add-review, add-hotfix, add-plan |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands add-pro |
| add-backend-development | add-dev, add-autopilot, add-plan, add-review, add-test |
| add-frontend-development | add-dev, add-autopilot, add-plan, add-review, add-test |
| add-database-development | add-dev, add-autopilot, add-plan, add-review |
| add-ux-design | add-design, add-ux, add-dev, add-autopilot, add-review, add-hotfix, add-plan |
| add-code-review | add-review |
| add-security-audit | add-audit, add-review |
| add-feature-discovery | add-feature, add-plan |
| add-feature-specification | add-feature, add-plan (le about.md) |
| add-documentation-style | add-feature, add-design, add-brainstorm, add-audit |
| add-architecture-discovery | add-audit, add-architecture-analyzer |
| add-ecosystem | add (perde visao do todo) |
| add-dev | add-autopilot (compartilham logica de implementacao) |
| add-project-scaffolding | stack-context.md (consultado por add-backend/database/frontend-development) |
| add-subagent-driven-development | add-dev, add-autopilot, add-review |

## Main Flows

| Fluxo | Sequencia | Quando usar |
|-------|-----------|-------------|
| Completo | feature -> design -> plan -> dev -> review -> done | Features complexas com UI |
| Normal | feature -> plan -> dev -> done | Features sem UI complexa |
| Simples | feature -> dev -> done | Features pequenas |
| Autonomo | feature -> autopilot -> done | Quer implementacao sem interacao |
| Emergencia | hotfix -> done | Bug critico em producao |
| Exploracao | brainstorm -> feature -> ... | Nao sabe por onde comecar |
| Novo Projeto | init -> scaffold -> dev -> done | Criar projeto do zero |
| Analise | audit | Verificar saude do projeto |

## Last Updated

| Data | Acao |
|------|------|
| 2026-03-16 | PRD0020: add- prefix on all skills, all-providers mapping, merged ecosystem-map + code-addiction-ecosystem |
| 2026-03-17 | PRD0021: add-commit migrated to add.commit command; skill simplified to knowledge reference |
