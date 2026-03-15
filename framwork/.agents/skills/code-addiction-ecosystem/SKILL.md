<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/code-addiction-ecosystem/SKILL.md -->
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
| add-architecture-analyzer | Mapear arquitetura do projeto, classificar apps, consolidar contexto | architecture-discovery |
| add-audit | Analise tecnica completa do projeto (seguranca, arquitetura, dados, docs) | documentation-style, architecture-discovery, security-audit |
| add-autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | backend-development, database-development, frontend-development, ux-design |
| add-brainstorm | Explorar ideias (READ-ONLY) | documentation-style |
| add-copy | Gerador de copy estruturado para landing pages SaaS | saas-copy |
| add-design | Especificacao UX mobile-first, coordena subagentes para features complexas | ux-design, documentation-style |
| add-dev | Implementacao guiada (coordena subagentes). Suporta `/add-dev feature N` para Epics | backend-development, database-development, frontend-development, ux-design |
| add-done | Finalizar feature, gera changelog. Valida epics + requisitos. Detecta branch protection e roteia para PR ou merge direto | - |
| add-feature | Discovery de funcionalidade, cria about.md | feature-discovery, feature-specification, documentation-style |
| add-hotfix | Correcao urgente com ID global (H[NNNN]). Cria doc isolado em docs/[NNNN]H-*, documenta relacoes em related.md | ux-design |
| add-init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | product-discovery (optional) |
| add-landing | Builder de landing pages SaaS de alta conversao | landing-page-saas |
| add-plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | backend-development, database-development, frontend-development, ux-design, feature-discovery |
| add-pr | Criar PR para code review (sem finalizar feature). Usado standalone ou referenciado pelo add-done quando branch protection ativo | - |
| add-review | Revisao de codigo, auto-correcao | code-review, delivery-validation, backend-development, database-development, frontend-development, ux-design, security-audit |
| add-test | Geracao de testes automatizados (80% coverage). Parallel subagents por area + Startup Test | backend-development, frontend-development |
| add-ux | UX rapido - carrega ux-design e aplica ao contexto livre do usuario | ux-design |

## Skills add-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| add-commit | Commit mid-workflow com mensagem Conventional Commits adaptativa: ≤3 arquivos → linha unica, >3 → lista por modulo. Auto-staging, flags --push e --confirm, deteccao de .env | - |
| add-ecosystem-map | [DUPLICATE] Mesmo conteudo que code-addiction-ecosystem - consolidar | - |
| architecture-discovery | Mapear arquitetura, detectar patterns, gerar stack-context.md | add-audit, add-architecture-analyzer |
| backend-development | Arquitetura backend: SOLID, Clean Arch, DTOs, Services, Repository — stack-agnostic | add-dev, add-autopilot, add-plan, add-review, add-test |
| code-addiction-ecosystem | Visao consolidada do ecossistema add-pro (source of truth) | add, add-feature, add-design, add-plan, add-dev, add-review, add-done, add-hotfix, add-brainstorm, add-test |
| code-review | Validacao de codigo, auto-correcao | add-review |
| database-development | Arquitetura de dados: entities, repositories, migrations, naming — stack-agnostic | add-dev, add-autopilot, add-plan, add-review |
| delivery-validation | Validar RF/RN implementados, criterios de aceite | add-review |
| dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code | add |
| documentation-style | Padroes de documentacao ADD-pro | add-feature, add-design, add-brainstorm, add-audit |
| feature-discovery | Processo de discovery de features, analise de codebase | add-feature, add-plan |
| feature-specification | Estrutura do about.md com RFs, RNs, criterios de aceite | add-feature |
| frontend-development | Arquitetura frontend: state, data fetching, components, forms, routing — stack-agnostic | add-dev, add-autopilot, add-plan, add-review, add-test |
| project-scaffolding | Criar projetos do zero: Starter/Scale, multi-stack Node.js, stack-context.md | add-init (futuro) |
| health-check | Health check de ambiente e dependencias do projeto | - |
| landing-page-saas | Framework para landing pages de alta conversao SaaS | add-landing |
| optimizing-git-workflow | Git patterns, commits, branches, aliases | - |
| plan-based-features | Implementar features baseadas em planos de subscription | - |
| planning | Orquestracao de planejamento tecnico | - |
| product-discovery | Discovery de produto (nivel macro) | add-init (optional) |
| saas-copy | Frameworks e templates de copy para landing pages SaaS | add-copy |
| security-audit | Checklist OWASP, RLS, secrets, multi-tenancy | add-audit, add-review |
| stripe | Integracao com Stripe, price versioning, grandfathering | add-dev (features de pagamento) |
| subagent-driven-development | Coordenacao de subagentes com quality gates | - |
| token-efficiency | Compressao, JSON compacto, minimo de tokens | Todas (best practice) |
| updating-claude-documentation | Atualizar CLAUDE.md quando arquitetura muda | - |
| ux-design | Componentes, mobile-first, SaaS patterns, shadcn, Tailwind | add-design, add-ux, add-dev, add-autopilot, add-review, add-hotfix, add-plan |
| write-skill | Criar e testar skills com pressao real | - |

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands add-pro |
| backend-development | add-dev, add-autopilot, add-plan, add-review, add-test |
| frontend-development | add-dev, add-autopilot, add-plan, add-review, add-test |
| database-development | add-dev, add-autopilot, add-plan, add-review |
| ux-design | add-design, add-ux, add-dev, add-autopilot, add-review, add-hotfix, add-plan |
| code-review | add-review |
| security-audit | add-audit, add-review |
| feature-discovery | add-feature, add-plan |
| feature-specification | add-feature, add-plan (le about.md) |
| documentation-style | add-feature, add-design, add-brainstorm, add-audit |
| architecture-discovery | add-audit, add-architecture-analyzer |
| code-addiction-ecosystem | add (perde visao do todo) |
| add-dev | add-autopilot (compartilham logica de implementacao) |
| project-scaffolding | stack-context.md (consultado por backend/database/frontend-development) |
| subagent-driven-development | add-dev, add-autopilot, add-review |

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
| 2026-03-09 | sync: regenerated ecosystem map via /add-sync |