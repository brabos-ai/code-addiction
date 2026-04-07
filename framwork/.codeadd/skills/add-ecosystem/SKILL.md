---
name: add-ecosystem
description: Visao consolidada do ecossistema - commands, skills, relacoes e dependencias. Carregada pelo /add como source of truth.
---

# Ecosystem Map

> **Source of Truth:** Mapa completo do ecossistema.

## Commands

| Command | Proposito | Skills que carrega |
|---------|-----------|-------------------|
| add | Gateway inteligente - responde duvidas, orienta fluxo, sugere proximo comando | add-ecosystem, add-dev-environment-setup |
| add.audit | Analise tecnica completa do projeto (seguranca, arquitetura, dados, docs). Escala para add-investigation em findings ambiguos | add-documentation-style, add-health-check, add-ecosystem, add-investigation (on-demand) |
| add.autopilot | Implementacao autonoma sem interacao. Suporta `/autopilot feature N` para Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design |
| add.brainstorm | Explorar ideias (READ-ONLY) | add-documentation-style, add-ecosystem |
| add.build | Implementacao guiada (coordena subagentes). Suporta `/add.build feature N` para Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-code-review, add-ecosystem |
| add.review | Revisao de codigo com auto-correcao completa. Cobre frontend, backend, seguranca, delivery validation. Escala para add-investigation em findings com root cause nao isolado | add-code-review, add-delivery-validation, add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-security-audit, add-investigation (on-demand) |
| add.commit | Mid-workflow smart commit com mensagem Conventional Commits adaptativa: ≤3 arquivos → linha unica, >3 → lista por modulo | add-commit |
| add.copy | Gerador de copy estruturado para landing pages SaaS | add-saas-copy, add-ecosystem |
| add.design | Especificacao UX mobile-first, coordena subagentes para features complexas | add-ux-design, add-documentation-style |
| add.diagnose | Triagem investigativa pre-decisao para sintomas ambiguos. Aplica metodologia de 5 fases (disambiguation, RCA, patterns, differential diagnosis, synthesis) e recomenda rota (hotfix/feature/extend/no-action). READ-ONLY | add-investigation, add-ecosystem |
| add.done | Finalizar feature, gera changelog. Valida epics + requisitos. Detecta branch protection e roteia para PR ou merge direto | add-ecosystem |
| add.hotfix | Correcao urgente com ID global (H[NNNN]). Cria doc isolado em docs/[NNNN]H-*, documenta relacoes em related.md. Escala para add-investigation quando root cause nao e obvio | add-ux-design, add-ecosystem, add-investigation (on-demand) |
| add.init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | add-product-discovery (optional) |
| add.landing | Builder de landing pages SaaS de alta conversao | add-landing-page-saas, add-ecosystem |
| add.new | Discovery de funcionalidade, cria about.md | add-feature-discovery, add-feature-specification, add-documentation-style, add-ecosystem |
| add.plan | Planejamento tecnico, cria plan.md. Detecta Epic vs Feature por fluxos de usuario. Checklist cobertura obrigatorio | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-feature-discovery, add-ecosystem |
| add.pr | Criar PR para code review (sem finalizar feature). Usado standalone ou referenciado pelo add.done quando branch protection ativo | - |
| add.test | Geracao de testes automatizados (80% coverage). Parallel subagents por area + Startup Test | add-backend-development, add-frontend-development, add-ecosystem |
| add.ux | UX rapido - carrega add-ux-design e aplica ao contexto livre do usuario | add-ux-design |
| add.xray | Mapear arquitetura do projeto, classificar apps, consolidar contexto | add-architecture-discovery, add-ecosystem |

## Skills

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
| add-architecture-discovery | Mapear arquitetura, detectar patterns, gerar stack-context.md | add.audit, add.xray |
| add-backend-architecture | Consultant de arquitetura backend: Simple Modular, Vertical Slice, Clean Architecture, Combined Strategy | - |
| add-backend-development | Arquitetura backend: SOLID, Clean Arch, DTOs, Services, Repository — stack-agnostic | add.build, add.autopilot, add.plan, add.review, add.test |
| add-code-review | Validacao de codigo, auto-correcao | add.review, add.build |
| add-commit | Knowledge reference para commits mid-workflow: adaptive message logic, type detection, staging rules | add.commit |
| add-database-development | Arquitetura de dados: entities, repositories, migrations, naming — stack-agnostic | add.build, add.autopilot, add.plan, add.review |
| add-delivery-validation | Validar RF/RN implementados, criterios de aceite | add.review |
| add-dev-environment-setup | Detectar SO, diagnosticar tools ausentes, instalar WSL/git/jq/gh, configurar VS Code | add |
| add-documentation-style | Padroes de documentacao ADD-pro | add.new, add.design, add.brainstorm, add.audit |
| add-ecosystem | Visao consolidada do ecossistema (source of truth) | add, add.new, add.design, add.plan, add.build, add.done, add.hotfix, add.brainstorm, add.test, add.audit, add.copy, add.landing, add.xray |
| add-feature-discovery | Processo de discovery de features, analise de codebase | add.new, add.plan |
| add-feature-specification | Estrutura do about.md com RFs, RNs, criterios de aceite | add.new |
| add-frontend-architecture | Consultant de arquitetura frontend: Simple Component-Based, Feature-Based, FSD — React/Vue/Angular-aware | - |
| add-frontend-development | Arquitetura frontend: state, data fetching, components, forms, routing — stack-agnostic | add.build, add.autopilot, add.plan, add.review, add.test |
| add-health-check | Health check de ambiente e dependencias do projeto | add.audit |
| add-investigation | Metodologia de investigacao rigorosa (5 fases com Iron Law) para sintomas vagos e bugs de fluxo de informacao. Adaptada de obra/superpowers systematic-debugging. Reutilizavel por qualquer comando que precise de RCA antes de agir | add.diagnose, add.hotfix, add.review, add.audit |
| add-landing-page-saas | Framework para landing pages de alta conversao SaaS | add.landing |
| add-optimizing-git-workflow | Git patterns, commits, branches, aliases | - |
| add-plan-based-features | Implementar features baseadas em planos de subscription | - |
| add-planning | Orquestracao de planejamento tecnico | - |
| add-product-discovery | Discovery de produto (nivel macro) | add.init (optional) |
| add-project-scaffolding | Criar projetos do zero: Starter/Scale, multi-stack Node.js, stack-context.md | - |
| add-resource-path-convention | Convencao de paths para referenciar commands/skills/scripts entre providers | add.make (build-time) |
| add-saas-copy | Frameworks e templates de copy para landing pages SaaS | add.copy |
| add-security-audit | Checklist OWASP, RLS, secrets, multi-tenancy | add.audit, add.review |
| add-skill-creator | Criar e testar skills com pressao real | - |
| add-stripe | Integracao com Stripe, price versioning, grandfathering | - |
| add-subagent-driven-development | Coordenacao de subagentes com quality gates | - |
| add-token-efficiency | Compressao, JSON compacto, minimo de tokens | Todas (best practice) |
| add-updating-claude-documentation | Atualizar CLAUDE.md quando arquitetura muda | - |
| add-ux-design | Componentes, mobile-first, SaaS patterns, shadcn, Tailwind | add.design, add.ux, add.build, add.autopilot, add.review, add.hotfix, add.plan |

## Agents (Specialized Subagents)

| Agent | Model | Skills Preloaded | Tools | Used by |
|-------|-------|-----------------|-------|---------|
| @ux-agent | sonnet | add-ux-design | Read,Glob,Grep,Bash,Write,Edit | add.design (flow+layout subagents) |
| @backend-agent | inherit | add-backend-development, add-database-development | All | add.build, add.autopilot (backend area) |
| @frontend-agent | inherit | add-frontend-development | All | add.build, add.autopilot (frontend area) |
| @reviewer-agent | sonnet | add-code-review, add-security-audit | Read-only (no Write/Edit) | add.review, add.build (validators), add.autopilot, add.audit |
| @discovery-agent | haiku | add-feature-discovery, add-feature-specification | Read-only (no Write/Edit) | add.new (codebase discovery) |
| @architecture-agent | inherit | add-architecture-discovery, add-backend-architecture, add-frontend-architecture | Read-only (no Write/Edit) | add.plan (architect+integration), add.autopilot (planning), add.audit |
| @system-design-agent | inherit | add-architecture-discovery | Read,Glob,Grep,Bash,Write,Edit | Standalone (system design proposals) |
| @database-agent | sonnet | add-database-development | Read,Glob,Grep,Bash,Write,Edit | add.build, add.autopilot (database area), add.plan, add.audit |

**Key distinctions:**
- **Skill** = knowledge pack (loaded into context)
- **Agent** = specialist executor (skills preloaded + tool restrictions + model optimized + persistent memory)
- **Command** = orchestrated workflow (dispatches agents, manages gates)

**Invocation:** `@agent-name` standalone or via command dispatch (`DISPATCH AGENT: @agent-name`)

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
| building-commands | Estrutura de TODOS os commands |
| add-backend-development | add.build, add.autopilot, add.plan, add.review, add.test |
| add-frontend-development | add.build, add.autopilot, add.plan, add.review, add.test |
| add-database-development | add.build, add.autopilot, add.plan, add.review |
| add-ux-design | add.design, add.ux, add.build, add.autopilot, add.review, add.hotfix, add.plan |
| add-code-review | add.review, add.build |
| add-security-audit | add.audit, add.review |
| add-feature-discovery | add.new, add.plan |
| add-feature-specification | add.new, add.plan (le about.md) |
| add-documentation-style | add.new, add.design, add.brainstorm, add.audit |
| add-architecture-discovery | add.audit, add.xray |
| add-ecosystem | add (perde visao do todo) |
| add-investigation | add.diagnose (primary), add.hotfix (STEP 7.1 escalation), add.review (STEP 5.1 ambiguous findings), add.audit (STEP 7.1 ambiguous findings) |
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
| Triagem | diagnose -> (hotfix OR new OR no-action) | Sintoma vago, nao sabe se e bug/feature/doc-drift |
| Novo Projeto | init -> scaffold -> build -> done | Criar projeto do zero |
| Analise | xray / audit | Verificar saude do projeto |

## Command Next-Steps Routing

> **Routing table.** After completing a command, look up its row to suggest the next step. Conditions are evaluated top-to-bottom — use the FIRST match.

| After | Condition | Suggest | Why |
|-------|-----------|---------|-----|
| add.init | always | `/add.new` | Onboarding done, start first feature |
| add.brainstorm | idea ready to formalize | `/add.new` | Capture as feature |
| add.brainstorm | needs more exploration | continue brainstorm | Not ready to commit |
| add.brainstorm | bug suspected, needs investigation | `/add.diagnose` | Route to structured triage |
| add.brainstorm | clear bug discovered | `/add.hotfix` | Route to urgent fix |
| add.diagnose | route=hotfix | `/add.hotfix` | Confirmed bug requiring urgent fix |
| add.diagnose | route=feature | `/add.new` | Confirmed functional gap |
| add.diagnose | route=extend | `/add.new` or `/add.plan` | Extend existing feature — load prior context |
| add.diagnose | route=no-action | done | No real problem — stop here |
| add.new | feature has complex UI (3+ screens) | `/add.design` | UX spec needed before planning |
| add.new | feature needs technical planning | `/add.plan` | Architect before building |
| add.new | feature is simple (1-2 files) | `/add.build` | Skip planning, build directly |
| add.new | user wants zero interaction | `/add.autopilot` | Autonomous end-to-end |
| add.design | always | `/add.plan` or `/add.build` | UX spec done, plan or implement |
| add.plan | default | `/add.build` | Most common path |
| add.plan | user wants zero interaction | `/add.autopilot` | Autonomous implementation |
| add.build | mode=DEVELOPMENT, wants tests | `/add.test` | Validate with automated tests |
| add.build | mode=DEVELOPMENT, skip tests | `/add.review` | Code review before merge |
| add.build | mode=CORRECTION | `/add.review` | Re-validate after fixes |
| add.build | epic, more subfeatures pending | `/add.build feature N` | Next subfeature in epic |
| add.autopilot | always | `/add.done` | Autopilot includes review; finalize |
| add.test | tests passing | `/add.review` | Validate code quality |
| add.test | tests failing | fix + `/add.test` | Iterate until green |
| add.review | status=PASSED | `/add.done` | All gates green, finalize |
| add.review | status=BLOCKED | fix + `/add.review` | Iterate until PASSED |
| add.hotfix | always | `/add.done` | Hotfix ready, finalize branch |
| add.commit | more work to do | `/add.commit` | Keep developing |
| add.commit | branch ready to finalize | `/add.done` | Merge to main |
| add.commit | needs team review | `/add.pr` | PR before merge |
| add.pr | always | wait for PR review | Human review pending |
| add.done | was feature, back on main | `/add.new` | Start next feature |
| add.done | was epic, more subfeatures | `/add.build feature N` | Next subfeature |
| add.done | was hotfix | `/add.new` | Return to feature work |
| add.copy | has landing page to build | `/add.landing` | Copy feeds the landing builder |
| add.copy | standalone copy task | done | Copy delivered |
| add.landing | always | `/add.commit` or `/add.done` | Landing built, commit or finalize |
| add.ux | within active feature | return to current flow | UX applied, resume workflow |
| add.ux | standalone | done | One-off UX task |
| add.xray | issues found | `/add.audit` | Deep health check |
| add.xray | context mapped, ready to build | `/add.new` | Start building with context |
| add.xray | standalone analysis | done | Analysis delivered |
| add.audit | critical issues found | `/add.new` per issue | Create features to fix findings |
| add.audit | project healthy | done | No action needed |