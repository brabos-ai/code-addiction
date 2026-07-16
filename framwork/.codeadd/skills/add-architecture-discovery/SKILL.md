---
name: add-architecture-discovery
description: Use when documenting project architecture — generates Technical Spec section in CLAUDE.md
---

# Architecture Discovery

Analyzes the codebase and updates the Technical Spec section of CLAUDE.md with structured data in a token-efficient format.

**Principle:** Discover, don't impose. Document what EXISTS in the code. CLAUDE.md is self-contained. Never invent patterns. Never create separate `technical-spec.md` files.

---

## When to Use

Triggers: need architecture docs, update CLAUDE.md, document technical spec, `/add.plan` needs context, `/add.build` needs patterns.

Auto-loaded by: `/add.plan`, `/add.build`.

## When NOT to Use

- Greenfield projects with no code yet — nothing to discover
- Single-file scripts or trivial repos — no architecture to document
- `.codeadd/wiki/` already current and CLAUDE.md Technical Spec reflects the codebase

---

## Phase 0 — Automated Discovery

Run: `bash .codeadd/scripts/architecture-discover.sh` → `.claude/temp/architecture-discovery.md`

Collects: {"includes":["package.json","turbo.json","tsconfig","dir structure depth 3","stack detection","patterns (CQRS,Repository,DI)","controllers,services,repositories","frontend (UI,state,forms,stores,hooks)","workers,cron,events,webhooks","integrations","statistics"]}

Read the discovery document COMPLETE before any manual searches — primary source (90% of work).

## Phase 1 — Architecture Contract

Generate the dependency contract BEFORE Technical Spec. Output → `CLAUDE.md → ## Architecture Contract`.

Steps:
- Identify packages/apps in the monorepo (or modules if single-app)
- Read each `package.json` to map internal dependencies
- Infer layer hierarchy (who depends on whom)
- Detect Clean Architecture pattern if present (domain → interfaces → database → api)
- Map where each artifact type resides (entities, DTOs, repos, services)

Hierarchy detection:
- Package with no internal deps = innermost (e.g., domain)
- Package depending only on domain = interfaces
- Package depending on domain + interfaces = database/infra
- Apps depending on everything = outermost (api)

---

## Deep Understanding (only when needed)

When discovery doc has insufficient info, read 1–2 files per area for STRUCTURE only — implementation details belong in `{{addpath:wiki/domains/}}`.

| Area | Question |
|---|---|
| Services | Interface pattern? |
| Repositories | Return Entity or DTO? |
| Workers | Dispatch/retry config? |
| Cron | Interval pattern? |
| Events | Naming pattern? |
| Webhooks | Signature verify? |

---

## App Classification

Classify each app/package to dispatch the appropriate specialist. Method: read `package.json` deps → match signals → return type.

### Signals

| Type | Dependencies |
|---|---|
| backend | express, fastify, nestjs, @nestjs/*, hono, koa, @grpc/*, socket.io, @trpc/* |
| frontend | react, vue, svelte, solid-js, @angular/*, next, nuxt, @tanstack/react-*, @remix-run/* |
| database | prisma, drizzle-orm, kysely, typeorm, sequelize, knex, @mikro-orm/* |
| cli | commander, yargs, clack, @clack/*, inquirer, meow, oclif |
| worker | bullmq, bull, agenda, node-cron, bee-queue, @temporalio/* |

Rules: an app can have MULTIPLE types; primary = first strong match; no signals → `generic`.

## Specialist Registry

Output → `{{addpath:wiki/domains/}}` for area specialists; the spine analyzer writes to `{{addpath:wiki/}}` root. Naming: lowercase area type.

| Type | Skill | Output | Analyzes |
|---|---|---|---|
| spine | spine-analyzer.md | wiki/architecture.md, wiki/conventions.md, wiki/workflows.md | cross-cutting: system shape/boundaries, project-wide conventions, dev workflows & validation gates |
| backend | backend-analyzer.md | wiki/domains/backend.md | logging, validation, error handling, auth, middleware, API patterns |
| frontend | frontend-analyzer.md | wiki/domains/frontend.md | state, styling, components, forms, hooks, routing |
| database | database-analyzer.md | wiki/domains/database.md (cross-app) | ORM, migrations, queries, transactions |
| cli | — | wiki/domains/cli.md | commands, args, prompts (generic template) |
| worker | — | wiki/domains/worker.md | jobs, queues, scheduling (generic template) |
| generic | — | wiki/domains/[area-type].md | structure, config, entry points only |

Dispatch: spine analyzer runs ONCE, ALWAYS, regardless of app classification; one area specialist per app (primary type); database analyzer runs ONCE cross-app; apps without specialist → generic; ALL run in PARALLEL (single dispatch batch, spine included).

## Generic App Template

For ANY app type without a specialist. Sections: App Nature, Structure, Entry Points, Dependencies, Configuration, **Reusable Abstractions**, **Project Conventions**, Commands/Jobs.

**Reusable Abstractions — HIGHEST PRIORITY.** Discover base classes, shared utilities, custom helpers, existing services agents MUST reuse. List path + purpose + usage example.

**Project Conventions — HIGHEST PRIORITY.** Discover file naming, folder organization, module registration, import conventions, where new code goes.

Rules: discover via code not name; include real examples; skip empty sections; prioritize Reusable Abstractions and Project Conventions over library configs.

---

## Validation Gates Detection

Detect runnable commands for 5 universal gate intents — `lint`, `typecheck`, `test`, `build`, `format` — across ANY language/ecosystem.

Output → `CLAUDE.md → ## Validation Gates` (minified JSON), placed after `## Technical Spec`, before `## Implementation Patterns`.

**Language-agnostic.** Inspect manifests the project actually has — `package.json`, `pyproject.toml`, `*.csproj`/`*.sln`, `Makefile`, `Cargo.toml`, `go.mod`, `mix.exs`, `composer.json`, `Gemfile`, `build.gradle`, `pom.xml`, etc. Map each intent to the real command. Do NOT assume language; do NOT fabricate gates.

### Intents

| Intent | Meaning |
|---|---|
| lint | static analysis / style (eslint, ruff, golangci-lint, rubocop, dotnet format --verify) |
| typecheck | type validation when separate from build (tsc --noEmit, mypy, pyright, mix dialyzer) |
| build | compile / bundle / produce artifacts (npm run build, cargo build, dotnet build, go build, mvn package) |
| test | automated test suite (npm test, pytest, go test, cargo test, dotnet test, mix test) |
| format | formatter in CHECK mode only (prettier --check, ruff format --check, gofmt -l, dotnet format --verify-no-changes) |

### Detection rules

- Only emit gates that exist — absence is meaningful
- Prefer canonical/shortest script name on ambiguity (e.g. `test` over `test:e2e`)
- `format`: ONLY non-mutating variants (`--check`, `--verify`, `-l`). Mutating-only `format`/`fmt` → SKIP
- If typecheck is part of build, omit typecheck — don't duplicate
- If a single script wraps multiple gates (e.g. `verify`), still emit each gate when individually runnable
- Document detection choice inline if ambiguous

```markdown
## Validation Gates
{"validation_gates":{"lint":"<cmd>","typecheck":"<cmd>","test":"<cmd>","build":"<cmd>","format":"<cmd>"}}
```

If NO gates detected → omit the section (do not emit empty object).

---

## Output Format — Token Efficient (CLAUDE.md sections)

{"format":"JSON minified one-line","max":"10 words per description","sections":["Stack","Structure","Patterns","Domain","API Routes","Critical Files","Background Processing","Scheduling","Events","Webhooks","Validation Gates"]}

Skip sections that don't apply. Update WITHIN CLAUDE.md.

## Wiki Page Contract — Shared by ALL Analyzers

Every analyzer in this registry (spine + area specialists) writes pages that satisfy this contract. Analyzer-specific sections below reference this one, they never restate it.

### Frontmatter (every wiki page, ≤10 lines total)

```yaml
---
type: reference | how-to | explanation
area: backend | frontend | database | architecture | conventions | workflows | <domain>
description: <1-2 sentences, keyword-rich — what this page covers and when to read it>
sources: [src/server/**, libs/database/src/repos/**]   # ≤8 globs, must cover every path cited in the page
commit: <short-sha at generation/last update of THIS page>
generated: <YYYY-MM-DD of THIS page's last write>
tags: [<grep targets: di, repository-pattern, error-handling>]   # ≤6
---
```

### Body

```markdown
# <Title>

## TL;DR
<2-4 lines: what this page is, why it exists, headline facts.>

## TOC            ← required when page > 100 lines
- [Topic A](#topic-a) ...

## <Topic — topic sentence first>
<Extractive content. Every non-trivial claim carries a source ref `path/file.ts:42`.
Real code examples, one per topic, trimmed.>

## Related
- [domains/database.md](database.md): <why related>   ← 2-4 links, relative paths
```

### Content Rules (all analyzers)

- Document ONLY what exists in code; every important claim grounded in inspected source (`path:line`). No invented modules, APIs, or behavior.
- Explain **why** important code exists, not only what files contain.
- Change-oriented guidance: each page answers what it does, why it exists, where to start, what to watch out for, and which tests/checks matter when changing it — written for the next *editor* agent, not just a reader.
- **No structural facts baked in.** No caller lists, no import inventories, no call graphs — these rot every commit. Where structure matters, point to the code graph or the code itself instead of enumerating it.
- One canonical home per concept. No thin pages — content that would be a stub merges into its domain page or a spine page; other pages link, never restate.
- Current-state phrasing only (no "as of v2.3…").
- Relative markdown links to real file paths only — **never wikilinks `[[page]]`**.
- Page size: **300 lines target, 500 hard cap.** Split into a `wiki/domains/<area>/` subdirectory only once a page exceeds the cap — never preemptively.

## Implementation Patterns Reference

- **CLAUDE.md** = WHERE things are (structure, paths, layers) + a pointer to the wiki
- **`.codeadd/wiki/`** = HOW to implement (patterns, conventions, workflows, architecture rationale)

CLAUDE.md no longer carries a hand-written `### Implementation Patterns` block — that section is REPLACED by the codeadd-wiki managed block, owned by `/add.wiki` STEP 6 (see `{{skill:add-claude-md-style/SKILL.md}}`). This skill's analyzers only produce the wiki pages; they do not write the managed block themselves.

## Cleanup

`rm .claude/temp/architecture-discovery.md` after execution.

Report discoveries + suggest `/add.wiki` if `.codeadd/wiki/` doesn't exist.

---

## Template Structure

```markdown
## Architecture Contract

> Dependencies and placement. Consult BEFORE implementing/reviewing.

### Layers
{"hierarchy":"domain → interfaces → database → api","rule":"inner never imports outer"}

### Packages
{"domain":"@org/domain","interfaces":"@org/backend","database":"@org/database","api":"apps/*"}

### Imports
{"domain":[],"interfaces":["domain"],"database":["domain","interfaces"],"api":["*"]}

### Placement
{"Entities":"domain","Enums":"domain","ServiceContracts":"interfaces","DTOs.shared":"interfaces","Repositories":"database","Services":"api","Handlers":"api"}
```

```markdown
## Technical Spec

> Token-efficient format for AI consumption.

**Generated:** YYYY-MM-DD | **Type:** [Monorepo|SingleApp]

### Stack
{"pkg":"[npm|yarn|pnpm]","build":"[turbo|nx]","lang":"[typescript|python]"}
{"backend":{"framework":"[NestJS|Express|Django]","version":"X.Y.Z"}}
{"frontend":{"framework":"[React|Vue|Next]","version":"X.Y.Z"}}
{"database":{"engine":"[PostgreSQL|MySQL]","orm":"[Kysely|Prisma]"}}

### Structure
{"paths":{"backend":"path","frontend":"path","domain":"path"}}

### Patterns
{"identified":["CQRS","Repository","DI"]}
{"conventions":{"files":"kebab-case","classes":"PascalCase"}}

### Domain
{"models":["entity1","entity2"],"location":"path"}

### API Routes
{"globalPrefix":"/api/v1","prefixLocation":"path"}
{"routes":[{"module":"auth","prefix":"/auth","endpoints":["POST /login"]}]}

### Validation Gates (if any detected — see Validation Gates Detection above)
{"validation_gates":{"lint":"<command>","typecheck":"<command>","test":"<command>","build":"<command>","format":"<command-in-check-mode>"}}

### Project Knowledge Base (CLAUDE.md managed block — NOT written by this skill)
{"note":"CLAUDE.md carries a codeadd-wiki managed block instead of a hand-written Implementation Patterns section"}
{"owner":"/add.wiki STEP 6 + add-claude-md-style — see that skill for the block template"}
{"location":".codeadd/wiki/","entrypoint":".codeadd/wiki/index.md"}
{"generate":"Run /add.wiki to create or refresh the wiki"}
```
