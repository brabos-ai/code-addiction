---
name: code-addiction-ecosystem
description: Consolidated view of the add-pro ecosystem - commands, skills, relationships and dependencies. Loaded by /add as source of truth.
---

# Ecosystem Map - add-pro

> **Source of Truth:** Complete ecosystem map for add-pro.
>
> **Last Updated:** 2026-04-07 (STEP 6: Auto-regenerated from comprehensive ecosystem scan)

## Commands

| Command | Purpose | Skills Loaded |
|---------|---------|---------------|
| add | Intelligent gateway - answers questions, guides flows, suggests next command | add-ecosystem, add-dev-environment-setup |
| add.audit | Complete technical analysis of project (security, architecture, data, docs). Escalates to add-investigation on ambiguous findings | add-documentation-style, add-health-check, add-ecosystem, add-investigation |
| add.autopilot | Autonomous implementation without interaction. Supports `/autopilot feature N` for Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design |
| add.brainstorm | Explore ideas (READ-ONLY) | add-documentation-style, add-ecosystem |
| add.build | Guided implementation (coordinates subagents). Supports `/add.build feature N` for Epics | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-code-review, add-ecosystem |
| add.commit | Mid-workflow smart commit with adaptive Conventional Commits message: ≤3 files → single line, >3 → module list | add-commit |
| add.copy | Structured copy generator for SaaS landing pages | add-saas-copy, add-ecosystem |
| add.design | Mobile-first UX specification, coordinates subagents for complex features | add-ux-design, add-documentation-style |
| add.diagnose | Pre-decision investigative triage for ambiguous symptoms. Applies 5-phase methodology (disambiguation, RCA, patterns, differential diagnosis, synthesis) and recommends route (hotfix/feature/extend/no-action). READ-ONLY | add-investigation, add-ecosystem |
| add.done | Finalize feature, generate changelog. Validates epics + requirements. Detects branch protection and routes to PR or direct merge | add-ecosystem |
| add.hotfix | Urgent fix with global ID (H[NNNN]). Creates isolated doc in docs/[NNNN]H-*, documents relationships in related.md. Escalates to add-investigation when root cause not obvious | add-ux-design, add-ecosystem, add-investigation |
| add.init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | add-product-discovery |
| add.landing | High-conversion SaaS landing page builder | add-landing-page-saas, add-ecosystem |
| add.new | Feature discovery, creates about.md | add-feature-discovery, add-feature-specification, add-documentation-style, add-ecosystem |
| add.plan | Technical planning, creates plan.md. Detects Epic vs Feature by user flows. Coverage checklist mandatory | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-feature-discovery, add-ecosystem |
| add.pr | Create PR for code review (without finalizing feature). Used standalone or referenced by add.done when branch protection active | - |
| add.review | Code review with complete auto-correction. Covers frontend, backend, security, delivery validation. Escalates to add-investigation on findings with isolated root cause | add-code-review, add-delivery-validation, add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-security-audit, add-investigation |
| add.test | Automated test generation (80% coverage). Parallel subagents per area + Startup Test | add-backend-development, add-frontend-development, add-ecosystem |
| add.ux | Quick UX - loads add-ux-design and applies to user's free-form instruction | add-ux-design |
| add.xray | Map project architecture, classify apps, consolidate context | add-architecture-discovery, add-ecosystem |

## Skills

| Skill | Purpose | Used by |
|-------|---------|---------|
| add-architecture-discovery | Map architecture, detect patterns, generate stack-context.md | add.audit, add.xray |
| add-backend-architecture | Backend architecture consultant: Simple Modular, Vertical Slice, Clean Architecture, Combined Strategy | - |
| add-backend-development | Backend architecture: SOLID, Clean Arch, DTOs, Services, Repository — stack-agnostic | add.build, add.autopilot, add.plan, add.review, add.test |
| add-code-review | Code validation, auto-correction | add.review, add.build |
| add-commit | Knowledge reference for mid-workflow commits: adaptive message logic, type detection, staging rules | add.commit |
| add-database-development | Data architecture: entities, repositories, migrations, naming — stack-agnostic | add.build, add.autopilot, add.plan, add.review, add.test |
| add-delivery-validation | Validate requirements implemented, acceptance criteria pass | add.review |
| add-dev-environment-setup | Detect OS, diagnose missing tools, install WSL/git/jq/gh, configure VS Code | add |
| add-documentation-style | ADD-pro documentation standards | add.new, add.design, add.brainstorm, add.audit |
| add-ecosystem | Consolidated ecosystem view (source of truth) | add, add.new, add.design, add.plan, add.build, add.done, add.hotfix, add.brainstorm, add.test, add.audit, add.copy, add.landing, add.xray, add.diagnose |
| add-feature-discovery | Feature discovery process, codebase analysis | add.new, add.plan |
| add-feature-specification | about.md structure with requirements, rules, acceptance criteria | add.new |
| add-frontend-architecture | Frontend architecture consultant: Simple Component-Based, Feature-Based, FSD — React/Vue/Angular-aware | - |
| add-frontend-development | Frontend architecture: state, data fetching, components, forms, routing — stack-agnostic | add.build, add.autopilot, add.plan, add.review, add.test |
| add-health-check | Health check of environment and project dependencies | add.audit |
| add-investigation | Rigorous investigation methodology (5 phases with Iron Law) for vague symptoms and information-flow bugs. Adapted from systematic-debugging. Reusable by any command needing RCA before acting | add.diagnose, add.hotfix, add.review, add.audit |
| add-landing-page-saas | High-conversion SaaS landing page framework | add.landing |
| add-optimizing-git-workflow | Git patterns, commits, branches, aliases | - |
| add-plan-based-features | Implement subscription plan-based features | - |
| add-planning | Technical planning orchestration | - |
| add-product-discovery | Product discovery (macro level) | add.init |
| add-project-scaffolding | Create projects from scratch: Starter/Scale, multi-stack Node.js, stack-context.md | - |
| add-resource-path-convention | Path convention for referencing commands/skills/scripts across providers | - |
| add-saas-copy | Copy frameworks and templates for SaaS landing pages | add.copy |
| add-security-audit | OWASP checklist, RLS, secrets, multi-tenancy | add.audit, add.review |
| add-skill-creator | Create and test skills under real pressure | - |
| add-stripe | Stripe integration, price versioning, grandfathering | - |
| add-subagent-driven-development | Subagent coordination with quality gates | - |
| add-token-efficiency | Compression, compact JSON, minimal tokens | All (best practice) |
| add-updating-claude-documentation | Update CLAUDE.md when architecture changes | - |
| add-ux-design | Components, mobile-first, SaaS patterns, shadcn, Tailwind | add.design, add.ux, add.build, add.autopilot, add.review, add.hotfix, add.plan |

## Dependency Index

| If you modify... | It impacts... |
|------------------|---------------|
| add-backend-development | add.build, add.autopilot, add.plan, add.review, add.test |
| add-frontend-development | add.build, add.autopilot, add.plan, add.review, add.test |
| add-database-development | add.build, add.autopilot, add.plan, add.review, add.test |
| add-ux-design | add.design, add.ux, add.build, add.autopilot, add.review, add.hotfix, add.plan |
| add-code-review | add.review, add.build |
| add-security-audit | add.audit, add.review |
| add-feature-discovery | add.new, add.plan |
| add-feature-specification | add.new |
| add-documentation-style | add.new, add.design, add.brainstorm, add.audit |
| add-architecture-discovery | add.audit, add.xray |
| add-ecosystem | add (loses full view), all commands that route to next steps |
| add-investigation | add.diagnose (primary), add.hotfix (STEP 7.1 escalation), add.review (STEP 5.1 ambiguous findings), add.audit (STEP 7.1 ambiguous findings) |

## Main Flows

| Flow | Sequence | When to use |
|------|----------|-------------|
| Complete | brainstorm → new → design → plan → build → review → done | Complex features with UI |
| Standard | new → plan → build → review → done | Features without complex UI |
| Lean | new → build → done | Small changes, quick tasks |
| Autonomous | new → autopilot → done | Want zero-interaction implementation |
| Emergency | hotfix → done | Critical production bug |
| Exploration | brainstorm → new → ... | Don't know where to start |
| Triage | diagnose → (hotfix OR new OR no-action) | Vague symptom, unsure if bug/feature |
| New Project | init → build → done | Create new project/feature |
| Analysis | xray / audit | Check project health |

## Command Next-Steps Routing

> **Routing table.** After completing a command, look up its row to suggest the next step. Conditions evaluated top-to-bottom — use FIRST match.

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
