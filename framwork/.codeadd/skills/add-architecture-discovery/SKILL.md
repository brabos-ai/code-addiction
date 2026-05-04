---
name: add-architecture-discovery
description: Use when need to analyze and document project architecture - auto-generates Technical Spec section in CLAUDE.md with token-efficient format
---

# Architecture Discovery

Analyzes the codebase and updates the Technical Spec section of CLAUDE.md with structured data in a token-efficient format.

**Principle:** Discover, don't impose. Document what EXISTS in the code, not what "should" exist. CLAUDE.md is self-contained.

---

## When to Use

Triggers:
- Need architecture docs
- Update CLAUDE.md
- Document technical spec
- `/plan` needs context
- `/add-dev` needs patterns

Auto-loaded by: `/plan`, `/dev`.

Output: `CLAUDE.md → ## Technical Spec + ## Architecture Contract`.

---

## Phase 0 — Automated Discovery

Run: `bash .codeadd/scripts/architecture-discover.sh`
Output: `.claude/temp/architecture-discovery.md`

The script collects:

{"includes":["package.json","turbo.json","tsconfig","dir structure depth 3","stack detection","patterns (CQRS,Repository,DI)","controllers,services,repositories","frontend (UI,state,forms,stores,hooks)","workers,cron,events,webhooks","integrations","statistics"]}

---

## Phase 1 — Architecture Contract

Generate the dependency contract that drives development and review. Output goes to `CLAUDE.md → ## Architecture Contract`.

### Discovery steps

- Identify packages/apps in the monorepo (or modules if single-app)
- Read each `package.json` to map internal dependencies
- Infer layer hierarchy (who depends on whom)
- Detect Clean Architecture pattern if present (domain → interfaces → database → api)
- Map where each artifact type should reside (entities, DTOs, repos, services)

### How to detect the hierarchy

- Package with no internal deps = innermost (e.g., domain)
- Package that only depends on domain = interfaces
- Package that depends on domain + interfaces = database/infra
- Apps that depend on everything = outermost (api)

---

## Discovery Document

{"location":".claude/temp/architecture-discovery.md","sections":["2.5: Stack Detection","3: Architectural Patterns","4: Domain Models & Entities","5: Infrastructure & Config","5.5: Routes & Endpoints","6.x: Frontend/Workers/Events/Webhooks/Integrations"]}

Read the discovery document COMPLETE before any manual searches.

---

## Deep Understanding (only when needed)

When the discovery document has insufficient info, read 1–2 files per area to understand STRUCTURE only — not implementation patterns. Implementation details (logging, validation, state, styling) belong in `{{addpath:skills/project-patterns/}}` via `/architecture-analyzer`.

Areas and what to look for:

| Area | Question |
|---|---|
| Services | Interface pattern? |
| Repositories | Return Entity or DTO? |
| Workers | Dispatch/retry config? |
| Cron | Interval pattern? |
| Events | Naming pattern? |
| Webhooks | Signature verify? |

**Principle:** Read only what's necessary to document STRUCTURE.

---

## App Classification

Classify each app/package to dispatch the appropriate specialist analyzer.

**Method:** Read app's `package.json` dependencies → match against signals → return type.

### Signals (lookup table)

{"signals":{"backend":["express","fastify","nestjs","@nestjs/*","hono","koa","@grpc/*","socket.io","@trpc/*"],"frontend":["react","vue","svelte","solid-js","@angular/*","next","nuxt","@tanstack/react-*","@remix-run/*"],"database":["prisma","drizzle-orm","kysely","typeorm","sequelize","knex","@mikro-orm/*"],"cli":["commander","yargs","clack","@clack/*","inquirer","meow","oclif"],"worker":["bullmq","bull","agenda","node-cron","bee-queue","@temporalio/*"]}}

### Classification rules

- Match dependencies against signals
- An app can have MULTIPLE types (e.g., backend + database)
- Primary type = first strong match
- If no signals match → `generic` (analyze structure and config only, no deep patterns)

---

## Specialist Registry

Maps app type to specialist analyzer. Output goes to `{{addpath:skills/project-patterns/}}`.

{"registry":{"backend":{"skill":"backend-analyzer.md","output":"backend.md","analyzes":"logging, validation, error handling, auth, middleware, API patterns"},"frontend":{"skill":"frontend-analyzer.md","output":"frontend.md","analyzes":"state, styling, components, forms, hooks, routing"},"database":{"skill":"database-analyzer.md","output":"database.md","scope":"cross-app","analyzes":"ORM, migrations, queries, transactions"},"cli":{"skill":null,"output":"cli.md","analyzes":"commands, args, prompts - use generic template"},"worker":{"skill":null,"output":"worker.md","analyzes":"jobs, queues, scheduling - use generic template"},"generic":{"skill":null,"output":"[area-type].md","analyzes":"structure, config, entry points only"}}}

Output dir: `{{addpath:skills/project-patterns/}}`. Naming: lowercase area type (`backend.md`, `frontend.md`, `database.md`, `cli.md`, `worker.md`).

### Dispatch rules

- One specialist per app (based on primary type)
- Database analyzer runs ONCE (cross-app)
- Apps without specialist → generic analysis
- All analyzers run in PARALLEL
- Output to `{{addpath:skills/project-patterns/[area].md}}`

---

## Generic App Template

Template for ANY app type without a specialist — focus on what agents need to develop correctly.

Sections:

- App Nature (discovered)
- Structure
- Entry Points
- Dependencies
- Configuration
- Reusable Abstractions
- Project Conventions
- Commands/Jobs (if applicable)

**Reusable Abstractions — HIGHEST PRIORITY.** Discover base classes, shared utilities, custom helpers, existing services/modules that agents MUST reuse. List each with path + purpose + usage example. This prevents duplication.

**Project Conventions — HIGHEST PRIORITY.** Discover file naming, folder organization, module registration, import conventions, where new code of each type goes. This ensures consistency.

Rules:

- Discover via code, not name
- Include real examples
- Skip empty sections
- Prioritize Reusable Abstractions and Project Conventions over library configs

---

## Validation Gates Detection

Detect runnable commands for the 5 universal gate intents — `lint`, `typecheck`, `test`, `build`, `format` — across ANY language/ecosystem the project uses.

Output: `CLAUDE.md → ## Validation Gates` (minified JSON block).

**Language-agnostic.** Inspect whatever manifest(s) the project actually has — `package.json`, `pyproject.toml`, `*.csproj`/`*.sln`, `Makefile`, `Cargo.toml`, `go.mod`, `mix.exs`, `composer.json`, `Gemfile`, `build.gradle`, `pom.xml`, etc. Map each gate intent to the real command this project uses. Do NOT assume a language; do NOT fabricate gates that don't exist.

### Intents (lookup)

{"intents":{"lint":"static analysis / style enforcement (eslint, ruff, golangci-lint, rubocop, dotnet format --verify, etc.)","typecheck":"type validation when separate from build (tsc --noEmit, mypy, pyright, mix dialyzer, etc.)","build":"compile / bundle / produce artifacts (npm run build, cargo build, dotnet build, go build, mvn package, etc.)","test":"automated test suite (npm test, pytest, go test, cargo test, dotnet test, mix test, etc.)","format":"formatter in CHECK mode only (prettier --check, ruff format --check, gofmt -l, dotnet format --verify-no-changes, etc.)"}}

### Detection rules

- Only emit gates that actually exist in the project — absence is meaningful
- Prefer canonical/shortest script name on ambiguity (e.g. `test` over `test:e2e`)
- `format` gate: ONLY accept non-mutating variants (`--check`, `--verify`, `-l`). If only a mutating `format`/`fmt` exists → SKIP format entirely (would rewrite files mid-build)
- If typecheck is part of build (no separate command), omit typecheck — don't duplicate
- If a single script wraps multiple gates (e.g. `verify` runs lint+test+build), still emit each individual gate separately when individually runnable
- Document detection choice inline if ambiguous (which script picked and why)

### Output block

Placement: after `## Technical Spec`, before `## Implementation Patterns`.

```markdown
## Validation Gates
{"validation_gates":{"lint":"<cmd>","typecheck":"<cmd>","test":"<cmd>","build":"<cmd>","format":"<cmd>"}}
```

If NO gates detected → omit the entire section (do not emit empty object).

---

## Output Format — Token Efficient

{"location":"CLAUDE.md → ## Technical Spec","format":"JSON minified one-line per object","max":"10 words per description","sections":["Stack","Structure","Patterns","Domain","API Routes","Critical Files","Background Processing (optional)","Scheduling (optional)","Events (optional)","Webhooks (optional)","Validation Gates","Implementation Patterns Reference"]}

Skip sections that don't apply.

---

## Implementation Patterns Reference

Link to `{{addpath:skills/project-patterns/}}` for implementation details.

- **CLAUDE.md** = WHERE things are
- **project-patterns skill** = HOW to implement

Location: `{{addpath:skills/project-patterns/}}`. Naming: lowercase area type (`backend.md`, `frontend.md`, `database.md`, `cli.md`, `worker.md`).

Search: `bash .codeadd/scripts/pattern-search.sh <area> [topic]` — returns `##` headers + line ranges for JIT loading.

DO NOT include in CLAUDE.md:

- Logging patterns
- Validation patterns
- State management details
- Styling patterns
- Anything already in the project-patterns skill

Reference list: from `pattern-search.sh --list` or `ls {{addpath:skills/project-patterns/*.md}}`.

---

## Cleanup

After execution: `rm .claude/temp/architecture-discovery.md`
Verify: `ls -la .claude/temp/ || echo cleanup complete`

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

---

## Critical Rules

**DO:**

- Run Phase 0 script FIRST (automated discovery)
- Read discovery document COMPLETE before manual searches
- Use document as primary source (90% of work done)
- Be framework-agnostic (detect, don't assume)
- Update section WITHIN CLAUDE.md (not separate file)
- Generate Architecture Contract BEFORE Technical Spec
- JSON minified one-line
- Max 10 words per description
- Document what EXISTS
- Cleanup temp document at end
- Skip sections that don't apply
- Reference `{{addpath:skills/project-patterns/}}` for implementation patterns (if exist)

**DO NOT:**

- Create `technical-spec.md` or separate files
- Use formatted/indented JSON
- Invent patterns not found in code
- Leave temp document after execution
- Assume specific framework/structure
- Ignore discovery document
- Make redundant searches
- Read many files (only what's necessary for patterns)
- Include implementation details in CLAUDE.md (logging, validation, state, styling) — these go in `{{addpath:skills/project-patterns/}}`

**Separation of concerns:**

- **CLAUDE.md** = WHERE things are (structure, paths, layers, packages)
- **`{{addpath:skills/project-patterns/}}`** = HOW to implement (patterns, conventions, examples)

---

## Workflow

1. Execute `bash .codeadd/scripts/architecture-discover.sh`
2. Read `.claude/temp/architecture-discovery.md` COMPLETE
3. Use document sections as foundation
4. Deep Understanding: read 1–2 files per area ONLY if STRUCTURE is unclear
5. Update CLAUDE.md → `## Architecture Contract` (hierarchy, packages, imports, placement)
6. Update CLAUDE.md → `## Technical Spec` (token-efficient, STRUCTURE only)
7. Detect validation gates per the Validation Gates Detection rules → emit `## Validation Gates` block in CLAUDE.md (omit if none detected)
8. Do NOT generate `.codeadd/project/stack-context.md` — this file has been removed entirely
9. Check if `{{addpath:skills/project-patterns/}}` exists → add Implementation Patterns Reference section
10. Cleanup: `rm .claude/temp/architecture-discovery.md`
11. Report discoveries + suggest `/add.xray` if project-patterns skill doesn't exist
