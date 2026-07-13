---
name: code-addiction-ecosystem
description: Consolidated view of the add-pro ecosystem - commands, skills, relationships and dependencies. Loaded by /add as source of truth.
---

# Ecosystem Map - add-pro

## When NOT to Use

- Not a how-to guide — load the specific skill for execution detail.
- Not for authoring new skills/commands → use `add-skill-creator`.
- Not for resource path conventions → use `add-resource-path-convention`.

## Commands

| Command | Purpose | Skills Loaded |
|---------|---------|---------------|
| add | Intelligent gateway - answers questions, guides flows, suggests next command | add-ecosystem, add-dev-environment-setup |
| add.audit | Complete technical analysis of project (security, architecture, data, docs). Escalates to add-investigation on ambiguous findings | add-doc-schemas, add-health-check, add-ecosystem, add-investigation |
| add.autopilot | Autonomous Feature Coordinator | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-tasks-checklist |
| add.brainstorm | Explore ideas (READ-ONLY) | add-doc-schemas, add-ecosystem |
| add.build | Development Execution Specialist. STEP 1.5 create-or-checkout of the feature branch via build-setup.sh (`F[NNNN]` + `--worktree` args). QA-Fix mode (`/add.build qa`) when qa-pipeline feature enabled | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-code-review, add-ecosystem, add-id-convention, add-tasks-checklist |
| add.design | Mobile-first UX specification, coordinates subagents for complex features | add-ux-design, add-doc-schemas |
| add.diagnose | Pre-decision investigative triage for ambiguous symptoms. Applies 5-phase methodology in agent-dispatched mode: parallel @feature-history-agent ∥ @git-history-agent, then sequential @architecture-agent. Recommends route (hotfix/feature/extend/no-action). READ-ONLY | add-investigation, add-ecosystem |
| add.done | Finalize feature, generate changelog. Validates epics + requirements. Detects branch protection and routes to PR or direct merge | add-ecosystem, add-id-convention |
| add.hotfix | Urgent fix with global ID ([NNNN]H). Discovery via parallel @feature-history-agent ∥ @git-history-agent before code investigation. Creates isolated doc in docs/features/[NNNN]H-*, documents relationships in related.md. Escalates to add-investigation when root cause not obvious | add-ux-design, add-ecosystem, add-investigation, add-id-convention |
| add.init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | add-product-discovery |
| add.new | Feature discovery, creates about.md (records `branch:` frontmatter — branch created later by add.build) | add-feature-discovery, add-feature-specification, add-doc-schemas, add-ecosystem, add-id-convention |
| add.plan | Technical Planning Orchestrator. QA-Spec subagent (STEP 10.0) when qa-pipeline feature enabled | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-feature-discovery, add-ecosystem, add-id-convention, add-tasks-checklist, add-qa-spec (qa-pipeline) |
| add.pull-request | Create or update PR for current branch (idempotent). On feature branches, generates the permanent feature changelog before opening the PR | add-commit, add-doc-schemas, add-id-convention |
| add.qa | Agent-judged QA validation — runs persisted specs + reads PNGs (live-drives with the `playwright` plugin), validates UX (vs design.md) AND functional delivery (vs about.md), writes versioned `_tests/run-NNN/qa-validation-NNN.md` (audit, not a gate). Dispatches @qa-agent per SF, judged across 4 axes (UX, functional, responsiveness, a11y). **Plugin optional** (degrades to read-PNG) | add-qa (default), add-doc-schemas |
| add.qa-setup | QA prerequisites + project config bootstrap — installs the `@playwright/test` runner (mandatory) + chromium + Playwright MCP (optional, confirm-then-execute), generates a project-specific `qa-project` skill, and scaffolds `docs/qa/config.json` + reachability-aware `FEATURE_DIR/_tests/screens.json`. Base command (runs before the plugin is enabled) | add-dev-environment-setup, add-doc-schemas |
| add.review | Feature Code Review Specialist | add-code-review, add-delivery-validation, add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-security-audit, add-investigation |
| add.test | Automated test generation. Parallel subagents per area; reports coverage (informational). Dispatches @e2e-agent when qa-pipeline feature enabled | add-backend-development, add-frontend-development, add-ecosystem |
| add.ux | Quick UX - loads add-ux-design and applies to user's free-form instruction | add-ux-design |
| add.xray | Map project architecture, classify apps, consolidate context | add-architecture-discovery, add-ecosystem |

## Skills

| Skill | Purpose |
|-------|---------|
| add-architecture-discovery | Map architecture, detect patterns, generate project-patterns skill |
| add-backend-architecture | Backend architecture consultant: Simple Modular, Vertical Slice, Clean Architecture, Combined Strategy |
| add-backend-development | Backend architecture: SOLID, Clean Arch, DTOs, Services, Repository — stack-agnostic |
| add-claude-md-style | CLAUDE.md generation guide: content rules, format (JSON/markdown), line budget — load before any CLAUDE.md write |
| add-code-review | Code review: IoC, RESTful, Contracts, Security (OWASP), Clean Architecture, SOLID |
| add-commit | Knowledge reference for mid-workflow commits: adaptive message logic, type detection, staging rules |
| add-database-development | Data architecture: entities, repositories, migrations, naming — stack-agnostic |
| add-delivery-validation | Product validation: Requirements 100% implemented, prerequisites exist, acceptance criteria pass |
| add-dev-environment-setup | Detect OS, diagnose missing tools, install WSL/git/jq/gh, configure VS Code |
| add-doc-schemas | Canonical schemas, stable IDs, universal doc rules, validation gate — single source of truth for all generated docs |
| add-ecosystem | Consolidated ecosystem view (source of truth) |
| add-feature-discovery | Feature discovery process, codebase analysis |
| add-feature-specification | about.md structure with requirements, rules, acceptance criteria |
| add-frontend-architecture | Frontend architecture consultant: Simple Component-Based, Feature-Based, FSD — React/Vue/Angular-aware |
| add-frontend-development | Frontend architecture: state, data fetching, components, forms, routing — stack-agnostic |
| add-gitnexus | [plugin-bound] Code knowledge-graph navigation via GitNexus MCP — call graph, refs, blast-radius, trace flows, safe refactors. Enabled by `codeadd plugins enable gitnexus` |
| add-health-check | Health check of environment and project dependencies |
| add-id-convention | Canonical [NNNN][L] ID and branch naming convention for features, hotfixes, refactors, chores, and docs — enforced by scripts (next-id.sh, get-branch-metadata.sh, build-setup.sh, done.sh) |
| add-investigation | Rigorous investigation methodology (5 phases with Iron Law) for vague symptoms and information-flow bugs. Adapted from systematic-debugging. Reusable by any command needing RCA before acting |
| add-optimizing-git-workflow | Git patterns, commits, branches, aliases |
| add-plan-based-features | Implement subscription plan-based features |
| add-planning | Technical planning orchestration |
| add-product-discovery | Product discovery (macro level) |
| add-project-scaffolding | Create projects from scratch: Starter/Scale, multi-stack Node.js, Starter-to-Scale migration |
| add-qa | QA methodology (default-shipped); the `playwright` plugin adds live browser driving — Level C judge rubric, severity taxonomy, 4-axis (UX + functional + responsiveness + a11y) method, report schema/template, config.json/screens.json formats |
| add-qa-spec | Generate a code-free QA/E2E spec (reachability intent, UX acceptance, functional scenarios, capture states, viewports, a11y expectations) from about.md + design.md + plan-*.md — loaded by add.plan's qa-pipeline QA-Spec step |
| add-resource-path-convention | Path convention for referencing commands/skills/scripts across providers |
| add-security-audit | OWASP checklist, RLS, secrets, multi-tenancy |
| add-skill-creator | Create and test skills under real pressure |
| add-stripe | Stripe integration, price versioning, grandfathering |
| add-subagent-driven-development | Subagent coordination with quality gates |
| add-tasks-checklist | tasks.md schema: 5 sections, tick rules, [!] semantics, "non-trivial change" rule, architect prompt template — single source of truth |
| add-tdd | RED-GREEN-REFACTOR execution discipline: failing test confirmed for the right reason before code |
| add-test-specification | Generate contract test cases (RF/RN → testable cases) into plan-test-spec.md |
| add-token-efficiency | Compression, compact JSON, minimal tokens |
| add-ux-design | Components, mobile-first, SaaS patterns, shadcn, Tailwind |

## Agents

| Agent | Purpose | Dispatched by |
|-------|---------|---------------|
| ux-agent | UX specialist for design decisions, interface analysis | add.design, add.ux |
| backend-agent | Backend implementation specialist | add.build, add.autopilot |
| frontend-agent | Frontend implementation specialist | add.build, add.autopilot |
| reviewer-agent | Code review (read-only) | add.review |
| discovery-agent | Feature discovery and specification (read-only) | add.new |
| architecture-agent | Architecture consultant, layer/module advice (read-only) | add.plan, add.diagnose (Fase B), add.hotfix |
| system-design-agent | System design, data flows, infrastructure | add.plan, add.audit |
| database-agent | Schema design, migrations, queries | add.build, add.plan |
| doc-reviewer-agent | Fresh-context doc review (read-only) | add.new, add.brainstorm |
| feature-history-agent | Scans docs/features/ for symptom-relevant features (read-only, docs only) | add.diagnose (Fase A.1), add.hotfix |
| git-history-agent | Correlates recent git history with a symptom (read-only git) | add.diagnose (Fase A.2), add.hotfix |
| qa-agent | 4-axis QA judge (UX, functional, responsiveness, a11y) — judges from persisted run evidence (screenshots + axe/assertion results, read-PNG); with the playwright plugin, additionally drives live | add.qa (per SF, parallel) |
| e2e-agent | Cross-cutting E2E spec author — authors `<surface>.qa.spec` (functional assertions + multi-viewport capture + axe a11y), finalizes screens.json reachability recipe, green-confirms via `@playwright/test` (no MCP, test files only) | add.test (qa-pipeline feature) |

## Plugins

| Plugin | Type | Description | Injects into | Plugin skill |
|--------|------|-------------|--------------|--------------|
| gitnexus | mcp | Code knowledge-graph navigation (calls, refs, blast-radius) via MCP | add.new, add.diagnose, add.hotfix, add.done | add-gitnexus |
| playwright | mcp | Adds live browser driving (screenshots + console/network) to the already-present QA validation via Playwright MCP | add.qa (command), qa-agent (agent) | — (add-qa is now default) |

Enable/disable via `codeadd plugins enable|disable|list <name>`. Plugins are disabled by default and require the external tool to be installed.

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
| add-doc-schemas | add.new, add.design, add.brainstorm, add.audit, add.plan, add.build, add.autopilot, add.hotfix, add.done, add.pull-request, add.init, add.xray, add.diagnose |
| add-architecture-discovery | add.audit, add.xray |
| add-ecosystem | add (loses full view), all commands that route to next steps |
| add-investigation | add.diagnose (primary, agent-dispatched mode), add.hotfix (STEP 6.1 escalation, agent-dispatched mode), add.review (STEP 5.1 ambiguous findings), add.audit (STEP 7.1 ambiguous findings) |
| feature-history-agent | add.diagnose (STEP 4 Fase A.1), add.hotfix (STEP 4) |
| git-history-agent | add.diagnose (STEP 4 Fase A.2), add.hotfix (STEP 4) |
| qa-agent | add.qa (dispatched per SF) |
| e2e-agent | add.test (dispatched when qa-pipeline feature enabled) |
| add-qa-spec | add.plan (STEP 10.0, qa-pipeline feature) |
| add-feature-specification (about.md) | add.qa (functional axis reads acceptance criteria — QA quality is bounded by spec quality) |
| add-ux-design (design.md) | add.qa (UX axis judges fidelity vs the design spec) |
| playwright (plugin) | add.qa (drive), qa-agent (drive) — enhancement/live arm; add.qa runs without it (read-PNG) |
| add-id-convention | add.plan, add.build, add.hotfix, add.done, add.pull-request (all ID allocation and branch naming; add.build's build-setup.sh enforces the format at branch creation) |
| add-tasks-checklist | add.plan, add.build, add.autopilot (tasks.md schema and tick rules) |
| add-tdd | add.build, add.test |
| add-test-specification | add.plan (STEP 9) |

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

> **Branch creation:** the documental steps (brainstorm → new → design → plan) make no git writes — `/add.new` only records the branch name in `about.md` (`branch:`). The branch is created at the **build** (or **autopilot**) step via `build-setup.sh`.

## Command Next-Steps Routing

Conditions evaluated top-to-bottom — use FIRST match.

| After | Condition | Suggest | Why |
|-------|-----------|---------|-----|
| add.init | always | `/add.new` | Onboarding done, start first feature |
| add.brainstorm | idea ready to formalize | `/add.new` | Capture as feature |
| add.brainstorm | needs more exploration | continue brainstorm | Not ready to commit |
| add.brainstorm | bug suspected, needs investigation | `/add.diagnose` | Structured triage needed |
| add.brainstorm | clear bug discovered | `/add.hotfix` | Urgent fix needed |
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
| add.review | status=PASSED, has UI | `/add.qa` | Validate the rendered result (UX + functional) before finalizing |
| add.review | status=PASSED | `/add.done` | All gates green, finalize |
| add.review | status=BLOCKED | fix + `/add.review` | Iterate until PASSED |
| add.hotfix | always | `/add.done` | Hotfix ready, finalize branch |
| add.review | needs team review before merge | `/add.pull-request` | PR for human review |
| add.pull-request | PR open, awaiting review | wait for review | Human review pending |
| add.pull-request | PR merged on GitHub | `/add.done` | Cleanup local branch + tags |
| add.pull-request | scope grew, need to update PR | `/add.pull-request` | Idempotent — appends update section |
| add.done | was feature, back on main | `/add.new` | Start next feature |
| add.done | was epic, more subfeatures | `/add.build feature N` | Next subfeature |
| add.done | was hotfix | `/add.new` | Return to feature work |
| add.ux | within active feature | return to current flow | UX applied, resume workflow |
| add.ux | standalone | done | One-off UX task |
| add.xray | issues found | `/add.audit` | Deep health check |
| add.xray | context mapped, ready to build | `/add.new` | Start building with context |
| add.xray | standalone analysis | done | Analysis delivered |
| add.audit | critical issues found | `/add.new` per issue | Create features to fix findings |
| add.qa-setup | prereqs + config ready | `/add.qa` | Validate the rendered result (UX + functional) — optionally `codeadd plugins enable playwright` first for live driving |
| add.qa | findings present | `/add.build` or `/add.review` | Audit is non-blocking — feed findings into the next fix wave |
| add.qa | clean (no findings) | `/add.done` | QA audit clean — finalize |
| add.audit | project healthy | done | No action needed |
