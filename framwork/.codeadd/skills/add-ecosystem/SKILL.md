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
| add.brainstorm | Explore ideas (READ-ONLY) | add-doc-schemas, add-ecosystem, add-plan-review |
| add.build | Development Execution Specialist. STEP 2 create-or-checkout of the feature branch via build-setup.sh (`F[NNNN]` + `--worktree` args). Consumes the review's `## Fix Routing` table and writes the resolution annex back. Generates unit/integration tests via @test-agent (tdd-pipeline) and E2E specs via @e2e-agent (qa-pipeline) | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-code-review, add-ecosystem, add-id-convention, add-tasks-checklist |
| add.diagnose | Pre-decision investigative triage for ambiguous symptoms. Applies 5-phase methodology in agent-dispatched mode: parallel @feature-history-agent ∥ @git-history-agent, then sequential @architecture-agent. Recommends route (hotfix/feature/extend/no-action). READ-ONLY | add-investigation, add-ecosystem |
| add.done | Finalize feature, promote the exact reviewed QA baseline to immutable `_tests/final/run-NNN/`, generate changelog, and merge. Final evidence preserves open findings; it is not a pass certificate | add-ecosystem, add-id-convention |
| add.hotfix | Urgent fix with global ID ([NNNN]H). Discovery via parallel @feature-history-agent ∥ @git-history-agent before code investigation. With tdd-pipeline, pins the confirmed root cause with a coordinator-verified RED test before any edit. After the fix, dispatches @security-agent ∥ @conformance-agent ∥ @failure-analysis-agent (read-only) and triages their findings in one bounded corrective pass, recording the outcome in about.md `## Review`. Creates isolated doc in docs/features/[NNNN]H-*, documents relationships in related.md | add-ux-design, add-ecosystem, add-investigation, add-id-convention, add-tdd, add-knowledge-discovery |
| add.init | Project onboarding - 3 questions (name, level, language), flat owner.md, optional product.md | add-product-discovery |
| add.new | Feature discovery, creates about.md (records `branch:` frontmatter — branch created later by add.build) | add-feature-discovery, add-feature-specification, add-doc-schemas, add-ecosystem, add-id-convention, add-plan-review |
| add.plan | Technical Planning Orchestrator. OWNS the design contract: gated STEP 8.1 UX pipeline (@ux-flow-agent → @ux-layout-agent → @ux-agent critique → consolidated `design.md`, provenance-hash idempotency). QA-Spec subagent (STEP 10.0) when qa-pipeline feature enabled. STEP 13 dispatches `@plan-reviewer-agent` before completion | add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-feature-discovery, add-ecosystem, add-id-convention, add-tasks-checklist, add-qa-spec (qa-pipeline), add-plan-review |
| add.plan-to-ready | Bounded convergence loop, feature / subfeature / **whole epic**. Loops build ⇄ review at most 3 iterations **per subfeature**, reset at each subfeature boundary, against the `/add.done` gates evaluated in dry-run by `converge-gates.sh`. On an epic target it iterates every pending subfeature in dependency order, commits + tags + pushes a gated checkpoint per converged subfeature (gate results in the commit trailer) and halts on the first non-CONVERGED one. Dispatches named leaf agents at depth 1, never commands. Plan leg dispatches `@plan-reviewer-agent` (`kind: feature-plan`) after consolidating `plan.md`. Reports CONVERGED / CAP_REACHED / BLOCKED and returns control; the merge stays human | add-doc-schemas, add-id-convention, add-tasks-checklist, add-ecosystem, add-plan-review, add-cross-sf-consistency, add-commit |
| add.pull-request | Create or update PR for current branch (idempotent). On feature branches, generates the permanent feature changelog before opening the PR | add-commit, add-doc-schemas, add-id-convention |
| add.qa-setup | End-to-end-verified QA bootstrap — installs the runner, generates `qa-project`, scaffolds config/screens, and materializes the dedicated `.gitignore` block that keeps working runs ephemeral. Identity is the shipped `shape` hash | add-dev-environment-setup, add-doc-schemas, add-qa-migration, add-setup-contract, add-subagent-driven-development |
| add.review | Feature Review Specialist — read-only on code. Code review + spec-compliance audit + the absorbed QA validation (preflight / evidence / judgement, self-gating on the `/add.qa-setup` receipt). Consolidates every finding class into one `## Fix Routing` table and writes a versioned `review-NNN.md`; `/add.build` applies the routes and appends the resolution annex | add-code-review, add-delivery-validation, add-backend-development, add-database-development, add-frontend-development, add-ux-design, add-security-audit, add-investigation |
| add.ux | Quick UX - loads add-ux-design and applies to user's free-form instruction | add-ux-design |
| add.wiki | Map project architecture, classify apps, generate portable project wiki (`.codeadd/wiki/`) with hub, spine, and per-domain pages. `/add.wiki update` runs incremental maintenance | add-doc-schemas, add-architecture-discovery, add-claude-md-style, add-wiki-maintenance |

## Skills

| Skill | Purpose |
|-------|---------|
| add-architecture-discovery | Map architecture, detect patterns, dispatch domain analyzers for the project wiki |
| add-backend-architecture | Backend architecture consultant: Simple Modular, Vertical Slice, Clean Architecture, Combined Strategy |
| add-backend-development | Backend architecture: SOLID, Clean Arch, DTOs, Services, Repository — stack-agnostic |
| add-claude-md-style | CLAUDE.md generation guide: content rules, format (JSON/markdown), line budget — load before any CLAUDE.md write |
| add-code-review | Code review: IoC, RESTful, Contracts, Security (OWASP), Clean Architecture, SOLID |
| add-commit | Knowledge reference for mid-workflow commits: adaptive message logic, type detection, staging rules |
| add-database-development | Data architecture: entities, repositories, migrations, naming — stack-agnostic |
| add-delivery-validation | Product validation: Requirements 100% implemented, prerequisites exist, acceptance criteria pass |
| add-dev-environment-setup | Detect OS, diagnose missing tools, install WSL/git/jq/gh, configure VS Code |
| add-doc-reviewer | Fresh-stakeholder review of a just-written ADD doc — surfaces gaps, clarity and scope questions, never reads the conversation that produced it |
| add-doc-schemas | Canonical schemas, stable IDs, universal doc rules, validation gate (incl. the `setup-receipt` schema) — single source of truth for all generated docs |
| add-ecosystem | Consolidated ecosystem view (source of truth) |
| add-feature-discovery | Feature discovery process, codebase analysis |
| add-feature-specification | about.md structure with requirements, rules, acceptance criteria |
| add-frontend-architecture | Frontend architecture consultant: Simple Component-Based, Feature-Based, FSD — React/Vue/Angular-aware |
| add-frontend-development | Frontend architecture: state, data fetching, components, forms, routing — stack-agnostic |
| add-gitnexus | [plugin-bound] Code knowledge-graph navigation via GitNexus MCP — call graph, refs, blast-radius, trace flows, safe refactors. Enabled by `codeadd plugins enable gitnexus` |
| add-health-check | Health check of environment and project dependencies |
| add-id-convention | Canonical [NNNN][L] ID and branch naming convention for features, hotfixes, refactors, chores, and docs — enforced by scripts (next-id.sh, get-branch-metadata.sh, build-setup.sh, done.sh) |
| add-investigation | Rigorous investigation methodology (5 phases with Iron Law) for vague symptoms and information-flow bugs. Adapted from systematic-debugging. Reusable by any command needing RCA before acting |
| add-knowledge-discovery | Consult the project wiki (and code knowledge graph) at the context/discovery step for minimal token cost — loaded by add.plan, add.hotfix, add.new, add.diagnose, add.review |
| add-optimizing-git-workflow | Git patterns, commits, branches, aliases |
| add-plan-based-features | Implement subscription plan-based features |
| add-plan-review | Pre-delivery executability rubric for about.md, brainstorm docs, and plan.md — verdict (ok / fix-then-ok / blocked) plus required fixes, not questions; loaded by `plan-reviewer-agent` |
| add-cross-sf-consistency | Five-dimension rubric, dedupe/precedence rules and finding routes for judging contract consistency across an epic's subfeature plans; loaded by `consistency-agent` |
| add-planning | Technical planning orchestration |
| add-product-discovery | Product discovery (macro level) |
| add-project-scaffolding | Create projects from scratch: Starter/Scale, multi-stack Node.js, Starter-to-Scale migration |
| add-qa | QA methodology (default-shipped); the `playwright` plugin adds live browser driving — Level C judge rubric, severity taxonomy, dual-judge (@ux-agent review ∥ @qa-agent) axis ownership, root-cause taxonomy, report schema/template, config.json/screens.json formats. `references/coordinator.md` holds the **coordinator-only** merge rules + Fix Routing — loaded by /add.review at its QA merge step, never by a judge |
| add-qa-migration | Adopt the code-addiction QA pipeline in a project that already runs Cypress/Jest/Vitest/custom QA — autonomous dogfooding sequence (add.new → add.plan → add.build → add.review) and its checkpoints; consumed by /add.qa-setup |
| add-qa-spec | Generate a code-free QA/E2E spec (reachability intent, UX acceptance, functional scenarios, capture states, viewports, a11y expectations) from about.md + design.md + plan-*.md, **and** author the `_tests/screens.json` screen catalog by read-merge-write — loaded by add.plan's qa-pipeline QA-Spec step |
| add-resource-path-convention | Path convention for referencing commands/skills/scripts across providers |
| add-security-audit | OWASP checklist, RLS, secrets, multi-tenancy |
| add-setup-contract | Compare a project's receipt `setup-shape` to the shipped sidecar `shape` and route FIRST-RUN / CURRENT / STALE |
| add-skill-creator | Create and test skills under real pressure |
| add-stripe | Stripe integration, price versioning, grandfathering |
| add-subagent-driven-development | Subagent coordination with quality gates |
| add-tasks-checklist | tasks.md schema: 5 sections, tick rules, [!] semantics, "non-trivial change" rule, architect prompt template — single source of truth |
| add-tdd | RED-GREEN-REFACTOR execution discipline: failing test confirmed for the right reason before code |
| add-test-specification | Generate contract test cases (RF/RN → testable cases) into plan-test-spec.md |
| add-token-efficiency | Compression, compact JSON, minimal tokens |
| add-ux-design | Components, mobile-first, SaaS patterns, shadcn, Tailwind |
| add-wiki-maintenance | Incremental project-wiki updates — diff-driven surgical edits, never full rewrites — loaded by `/add.wiki update` and add.done STEP 4.9 |

## Agents

| Agent | Purpose | Dispatched by |
|-------|---------|---------------|
| ux-flow-agent | Flow & interaction architect — design-system inspection (tokens, shell, component audit, visual patterns) then screen inventory, action classification, entry points, state transitions. Writes temp design-context.md + design-flow.md; early-exits `frontend_false` | add.plan (8.1.1) |
| ux-layout-agent | Layout & component specialist — layout tree + component composition + Design Contract per screen, new-component specs, states, every classified action served by a UI element. Writes temp design-layout.md (needs design-flow.md) | add.plan (8.1.2) |
| ux-agent | UX design owner (three modes) — critique mode: adversarial review of the flow/layout pair vs the Critique Rubric in add-ux-design (writes temp design-review.md); review mode: post-delivery judgement of shipped screens vs the `## Design Contract` (judgement axes + spec-gap); fix mode: amends `design.md`'s Design Contract + Design Review on a routed `design-spec` finding (the ONLY mode that writes, and the only agent permitted to write `design.md`); free-form UX assistance on direct use. No memory | add.plan (critique), add.review (review mode, ∥ qa-agent), add.build (routed design-spec fixes) |
| backend-agent | Backend implementation specialist | add.build, add.plan-to-ready |
| frontend-agent | Frontend implementation specialist | add.build, add.plan-to-ready |
| reviewer-agent | Code review (read-only) | add.review, add.plan-to-ready |
| security-agent | OWASP judge for a delivered change — judges the diff against A01-A10 plus XSS and mass assignment, asking first whether the change removed or weakened an existing control. Owns the security axis exclusively; a pre-existing finding is an observation, never a blocker (read-only) | add.hotfix |
| conformance-agent | Documented-rules judge — judges the diff against the wiki when present, CLAUDE.md plus surrounding code when absent. Freshness-gates every cited page so a stale page never grounds a blocker, and reports the reverse case as wiki-drift for /add.wiki update (read-only) | add.hotfix |
| failure-analysis-agent | Failure-mode judge — unhandled error paths, null propagation, missing rollback or idempotency, resource leaks, retry and ordering assumptions, reasoned against the blast radius of related features and suspicious commits confirmed earlier in the flow (read-only) | add.hotfix |
| test-agent | Unit + integration test generator for ONE area — reads the area's target files and feature docs, generates tests at the project's conventional location, runs them until green. CORRECTION mode writes one RED test pinning the bug instead of regenerating. Read-write on test files only | add.build (tdd-pipeline feature), add.plan-to-ready |
| fix-agent | Correction specialist for ONE area — consumes one area-scoped slice of the review's `## Fix Routing` table (code-review findings, build errors, red validation gates, QA findings) and applies the fix. The attempt counter is supplied by the caller, never decided by the agent | add.build, add.plan-to-ready |
| discovery-agent | Feature discovery and specification (read-only) | add.new |
| architecture-agent | Architecture consultant, layer/module advice (read-only) | add.plan, add.diagnose (Fase B), add.hotfix |
| system-design-agent | System design, data flows, infrastructure | add.plan, add.audit |
| database-agent | Schema design, migrations, queries | add.build, add.plan |
| doc-reviewer-agent | Fresh-context, question-only doc review — Gap/Clarity/Scope, no proposed fix (read-only) | None currently (manual / ad-hoc use only — add.new and add.brainstorm now dispatch plan-reviewer-agent) |
| plan-reviewer-agent | Fresh-context, fix-oriented pre-delivery review of about.md / brainstorm / plan.md — verdict (ok / fix-then-ok / blocked) plus required fixes (read-only) | add.plan (STEP 13), add.new (STEP 8), add.brainstorm (STEP 5), add.plan-to-ready (STEP 3, plan leg) |
| consistency-agent | Cross-subfeature consistency judge for an epic — compares contracts declared across subfeature `plan.md` / `about.md` / `design.md`, document against document and never code, on exactly five dimensions (API contracts, data schema, requirements, design tokens when `HAS_DESIGN`, auth/permission model). Anything outside the five is informational and never blocks. FULL pass after each subfeature's plan; DELTA pass at epic end. Read-only | add.plan-to-ready (F31 — plan-time full pass and end-of-epic delta) |
| feature-history-agent | Scans docs/features/ for symptom-relevant features (read-only, docs only) | add.diagnose (Fase A.1), add.hotfix |
| git-history-agent | Correlates recent git history with a symptom (read-only git) | add.diagnose (Fase A.2), add.hotfix |
| qa-agent | Deterministic + forensic QA judge (the qa-agent half of the dual panel) — functional delivery vs about.md, deterministic Design Contract conformance from measured computed styles, ALL a11y (axe-core), and root-caused failure forensics; judges from persisted run evidence (read-PNG), live-drives with the playwright plugin. No memory | add.review (per SF, parallel, ∥ ux-agent review) |
| e2e-agent | Cross-cutting E2E spec author — authors `<surface>.qa.spec` (functional assertions + multi-viewport capture + axe a11y), finalizes screens.json reachability recipe, green-confirms via `@playwright/test` (no MCP, test files only) | add.build (qa-pipeline feature), add.build (routed selector-drift / spec-defect / coverage fixes) |

## Features

| Feature | Default | Injects into | Purpose |
|---------|---------|--------------|---------|
| tdd-pipeline | enabled | add.plan, add.build, add.review | RED-GREEN-REFACTOR discipline + contract-test specs + unit/integration generation |
| qa-pipeline | disabled | add.plan, add.build | E2E spec authoring + agent QA validation |

Enable/disable via `codeadd features enable|disable|list <name>` — fragments are injected into the installed commands post-install. `qa-pipeline` (feature) governs whether QA artefacts are **authored**; the `playwright` plugin below only adds live driving to the judge — enabling the plugin does not enable the pipeline (canonical statement in add-qa).

## Plugins

| Plugin | Type | Description | Injects into | Plugin skill |
|--------|------|-------------|--------------|--------------|
| gitnexus | mcp | Code knowledge-graph navigation (calls, refs, blast-radius) via MCP | add.new, add.diagnose, add.hotfix, add.done | add-gitnexus |
| playwright | mcp | Adds live browser driving (screenshots + console/network) to the already-present QA validation via Playwright MCP | add.review (command), qa-agent (agent) | — (add-qa is now default) |

Enable/disable via `codeadd plugins enable|disable|list <name>`. Plugins are disabled by default and require the external tool to be installed.

## Dependency Index

| If you modify... | It impacts... |
|------------------|---------------|
| add-backend-development | add.build, add.plan, add.review, add.plan-to-ready |
| add-frontend-development | add.build, add.plan, add.review, add.plan-to-ready |
| add-database-development | add.build, add.plan, add.review, add.plan-to-ready |
| add-ux-design | add.ux, add.build, add.review, add.hotfix, add.plan, add.plan-to-ready; the three UX agents (ux-flow-agent, ux-layout-agent, ux-agent) declare it as a skill — its `critique-rubric.md` is the critic's canonical rubric and `design-contract.md` the layout/contract notation |
| add-code-review | add.review, add.build |
| add-security-audit | add.audit, add.review; @security-agent and @reviewer-agent declare it as a skill |
| add-setup-contract | add.qa-setup (STEP 1.5 compare + STEP 12 receipt rewrite) |
| add-qa-migration | add.qa-setup (STEP 5, first-run migration + `--migrate`) |
| add-subagent-driven-development | add.qa-setup (STEP 9 dispatch template, reused by migration + correction dispatch) |
| add-doc-reviewer | None currently (manual use only — add.new / add.brainstorm now use add-plan-review via plan-reviewer-agent) |
| add-plan-review | add.plan (STEP 13), add.new (STEP 8), add.brainstorm (STEP 5), add.plan-to-ready (STEP 3, plan leg) — all via plan-reviewer-agent |
| add-feature-discovery | add.new, add.plan |
| add-feature-specification | add.new |
| add-doc-schemas | add.new, add.brainstorm, add.audit, add.plan, add.build, add.plan-to-ready, add.hotfix, add.done, add.pull-request, add.init, add.wiki, add.diagnose |
| add-architecture-discovery | add.audit, add.wiki |
| add-ecosystem | add (loses full view), all commands that route to next steps |
| add-wiki-maintenance | add.wiki (update mode), add.done (STEP 4.9) |
| add-knowledge-discovery | add.plan, add.hotfix, add.new, add.diagnose, add.review |
| add-investigation | add.diagnose (primary, agent-dispatched mode), add.hotfix (STEP 6.1 escalation, agent-dispatched mode), add.review (STEP 5.1 ambiguous findings), add.audit (STEP 7.1 ambiguous findings) |
| feature-history-agent | add.diagnose (STEP 4 Fase A.1), add.hotfix (STEP 4) |
| git-history-agent | add.diagnose (STEP 4 Fase A.2), add.hotfix (STEP 4) |
| qa-agent | add.review (dispatched per SF, parallel with ux-agent review) |
| e2e-agent | add.build (dispatched when qa-pipeline feature enabled; also routed test-file fixes) |
| ux-flow-agent | add.plan (STEP 8.1.1) — and everything downstream of `design.md`: add.plan 8.4 frontend, add.review UX axis, add-qa-spec |
| ux-layout-agent | add.plan (STEP 8.1.2) — depends on ux-flow-agent's design-flow.md |
| ux-agent | add.plan (STEP 8.1.3 critique), add.review (STEP 10.1 review mode, ∥ qa-agent), add.build (fix mode — routed design-spec amendments), free-form direct use |
| add-qa-spec | add.plan (STEP 10.0, qa-pipeline feature) — owns `plan-qa-spec.md` AND `_tests/screens.json` authoring |
| add-feature-specification (about.md) | add.review (functional axis reads acceptance criteria — QA quality is bounded by spec quality) |
| add-ux-design (design.md) | add.review (@ux-agent review judges the judgement axes vs the `## Design Contract`; @qa-agent checks deterministic conformance vs the computed-style rows) |
| playwright (plugin) | add.review (drive), qa-agent (drive) — enhancement/live arm; the QA judgement runs without it (read-PNG) |
| add-id-convention | add.plan, add.build, add.hotfix, add.done, add.pull-request (all ID allocation and branch naming; SF-qualified design IDs cover the `feature-design` doc type from add-doc-schemas' `references/new-feature.md`; add.build's build-setup.sh enforces the format at branch creation) |
| add-tasks-checklist | add.plan, add.build, add.plan-to-ready (tasks.md schema and tick rules) |
| add-tdd | add.plan, add.build, add.review, add.hotfix (tdd-pipeline RED gate) |
| add-test-specification | add.plan (STEP 9) |
| converge-gates.sh | add.plan-to-ready (STEP 6, convergence check), add.done (STEP 4, delivery-gate preflight) — read-only probe for the four gates (review, QA baseline, epic, coverage); one script backs both commands' verdicts so they can't drift apart |

## Main Flows

| Flow | Sequence | When to use |
|------|----------|-------------|
| Complete | brainstorm → new → plan → build → review → done | Complex features with UI (design is produced inside plan STEP 8.1) |
| QA-validated | new → plan → build → **review ⇄ build** → done | UI features that ran `/add.qa-setup`. The review judges the rendered result and routes every finding; the build applies them and closes the round in the same `review-NNN.md`. Working runs stay local; done snapshots them before merge |
| Standard | new → plan → build → review → done | Features without complex UI |
| Lean | new → build → done | Small changes, quick tasks |
| Autonomous | new → **plan-to-ready** → done | Want zero-interaction implementation. The loop converges and returns control — the merge stays human |
| Emergency | hotfix → done | Critical production bug |
| Exploration | brainstorm → new → ... | Don't know where to start |
| Triage | diagnose → (hotfix OR new OR no-action) | Vague symptom, unsure if bug/feature |
| New Project | init → build → done | Create new project/feature |
| Analysis | wiki / audit | Check project health |

> **Branch creation:** the documental steps (brainstorm → new → plan) make no git writes — `/add.new` only records the branch name in `about.md` (`branch:`). The branch is created at the **build** (or **plan-to-ready**) step via `build-setup.sh`.

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
| add.new | feature needs technical planning | `/add.plan` | Architect before building. STEP 8.1 produces the UX contract when the feature touches UI |
| add.new | feature is simple (1-2 files) | `/add.build` | Skip planning, build directly |
| add.new | user wants zero interaction | `/add.plan-to-ready` | Bounded plan → build ⇄ review loop; stops at convergence, merge stays human |
| add.plan | default | `/add.build` | Most common path |
| add.plan | user wants zero interaction | `/add.plan-to-ready` | Bounded build ⇄ review loop against the /add.done gates |
| add.build | routed rows resolved + annex written | `/add.review` | Re-run the review — it writes the next `review-NNN.md` for side-by-side comparison |
| add.build | implementation complete | `/add.review` | Code review + QA judgement in one pass; it routes findings, never applies them |
| add.build | mode=DEVELOPMENT, skip tests | `/add.review` | Code review before merge |
| add.build | mode=CORRECTION | `/add.review` | Re-validate after fixes |
| add.build | epic, more subfeatures pending | `/add.build feature N` | Next subfeature in epic |
| add.review | status=BLOCKED with routed rows | `/add.build` | It consumes `## Fix Routing`, applies the fixes and appends the resolution annex |
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
| add.wiki | issues found | `/add.audit` | Deep health check |
| add.wiki | context mapped, ready to build | `/add.new` | Start building with context |
| add.wiki | standalone analysis | done | Analysis delivered |
| add.audit | critical issues found | `/add.new` per issue | Create features to fix findings |
| add.qa-setup | prereqs + config ready | `/add.review` | Its QA sections validate the rendered result (UX + functional) — optionally `codeadd plugins enable playwright` first for live driving |
| add.audit | project healthy | done | No action needed |
