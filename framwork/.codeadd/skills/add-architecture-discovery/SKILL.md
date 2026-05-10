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
- `project-patterns` skill already current and CLAUDE.md Technical Spec reflects the codebase

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

When discovery doc has insufficient info, read 1–2 files per area for STRUCTURE only — implementation details belong in `{{addpath:skills/project-patterns/}}`.

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

Output → `{{addpath:skills/project-patterns/}}`. Naming: lowercase area type.

| Type | Skill | Output | Analyzes |
|---|---|---|---|
| backend | backend-analyzer.md | backend.md | logging, validation, error handling, auth, middleware, API patterns |
| frontend | frontend-analyzer.md | frontend.md | state, styling, components, forms, hooks, routing |
| database | database-analyzer.md | database.md (cross-app) | ORM, migrations, queries, transactions |
| cli | — | cli.md | commands, args, prompts (generic template) |
| worker | — | worker.md | jobs, queues, scheduling (generic template) |
| generic | — | [area-type].md | structure, config, entry points only |

Dispatch: one specialist per app (primary type); database analyzer runs ONCE cross-app; apps without specialist → generic; all run in PARALLEL.

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

## Output Format — Token Efficient

{"format":"JSON minified one-line","max":"10 words per description","sections":["Stack","Structure","Patterns","Domain","API Routes","Critical Files","Background Processing","Scheduling","Events","Webhooks","Validation Gates","Implementation Patterns Reference"]}

Skip sections that don't apply. Update WITHIN CLAUDE.md.

## Implementation Patterns Reference

- **CLAUDE.md** = WHERE things are (structure, paths, layers)
- **project-patterns skill** = HOW to implement (patterns, conventions, examples)

Search: `bash .codeadd/scripts/pattern-search.sh <area> [topic]` — `##` headers + line ranges for JIT loading. List: `pattern-search.sh --list`.

DO NOT include in CLAUDE.md (these belong in project-patterns): logging, validation, state management, styling.

## Cleanup

`rm .claude/temp/architecture-discovery.md` after execution.

Report discoveries + suggest `/add.xray` if project-patterns skill doesn't exist.

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

### Implementation Patterns (if .codeadd/skills/project-patterns/ exists)
{"note":"Detailed patterns documented as portable skill for token-efficient JIT loading"}
{"location":".codeadd/skills/project-patterns/","files":"backend.md, frontend.md, database.md, cli.md, worker.md (by area type)"}
{"search":"bash .codeadd/scripts/pattern-search.sh --list → areas; pattern-search.sh <area> → topics + line ranges"}
{"generate":"Run /add.xray to create project-patterns skill"}
```
