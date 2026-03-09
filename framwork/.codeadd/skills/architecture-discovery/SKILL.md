---
name: architecture-discovery
description: Use when need to analyze and document project architecture - auto-generates Technical Spec section in CLAUDE.md with token-efficient format
---

# Architecture Discovery

Analisa codebase e atualiza seção Technical Spec do CLAUDE.md com dados estruturados em formato token-efficient.

**Princípio:** Descobrir, não impor. Documentar o que EXISTE no código, não o que "deveria" existir. CLAUDE.md é self-contained.

---

## Spec

### WhenToUse
{"triggers":["need architecture docs","update CLAUDE.md","document technical spec","/plan needs context","/add-dev needs patterns"],"auto-loaded-by":["/plan","/dev"],"output":"CLAUDE.md → ## Technical Spec + ## Architecture Contract"}

### Phase0_AutomatedDiscovery
{"script":"bash .codeadd/scripts/architecture-discover.sh","output":".claude/temp/architecture-discovery.md","includes":["package.json","turbo.json","tsconfig","dir structure depth 3","stack detection","patterns (CQRS,Repository,DI)","controllers,services,repositories","frontend (UI,state,forms,stores,hooks)","workers,cron,events,webhooks","integrations","statistics"]}

### Phase1_ArchitectureContract
{"purpose":"Gerar contrato de dependências para direcionar dev e review","output":"CLAUDE.md → ## Architecture Contract"}

{"discovery":[
  "Identificar packages/apps do monorepo (ou módulos se single-app)",
  "Ler package.json de cada um para mapear dependencies internas",
  "Inferir hierarquia de camadas (quem depende de quem)",
  "Detectar padrão Clean Architecture se existir (domain→interfaces→database→api)",
  "Mapear onde cada tipo de artefato deve ficar (entities, DTOs, repos, services)"
]}

{"detectHierarchy":[
  "Package sem deps internas = innermost (ex: domain)",
  "Package que só depende de domain = interfaces",
  "Package que depende de domain+interfaces = database/infra",
  "Apps que dependem de tudo = outermost (api)"
]}

### DiscoveryDocument
{"location":".claude/temp/architecture-discovery.md","sections":["2.5: Stack Detection","3: Architectural Patterns","4: Domain Models & Entities","5: Infrastructure & Config","5.5: Routes & Endpoints","6.x: Frontend/Workers/Events/Webhooks/Integrations"],"action":"read BEFORE manual searches"}

### DeepUnderstanding
{"when":"discovery doc has insufficient info","read":"1-2 files per area to understand STRUCTURE","areas":["services → interface pattern?","repositories → return Entity or DTO?","workers → dispatch/retry config?","cron → interval pattern?","events → naming pattern?","webhooks → signature verify?"],"principle":"read only necessary to document STRUCTURE, not implementation patterns"}
{"note":"Implementation details (logging, validation, state, styling) belong in .codeadd/project/*.md via /architecture-analyzer"}

### AppClassification
{"purpose":"Classify each app/package to dispatch appropriate specialist analyzer"}
{"method":"Read app's package.json dependencies → match against signals → return type"}
{"signals":{
  "backend":["express","fastify","nestjs","@nestjs/*","hono","koa","@grpc/*","socket.io","@trpc/*"],
  "frontend":["react","vue","svelte","solid-js","@angular/*","next","nuxt","@tanstack/react-*","@remix-run/*"],
  "database":["prisma","drizzle-orm","kysely","typeorm","sequelize","knex","@mikro-orm/*"],
  "cli":["commander","yargs","clack","@clack/*","inquirer","meow","oclif"],
  "worker":["bullmq","bull","agenda","node-cron","bee-queue","@temporalio/*"]
}}
{"classification_rules":[
  "Match dependencies against signals",
  "App can have MULTIPLE types (backend + database)",
  "Primary type = first strong match",
  "If no match → generic (structure only)"
]}
{"fallback":"If no signals match → analyze structure and config only, no deep patterns"}

### SpecialistRegistry
{"purpose":"Map app type to specialist analyzer skill"}
{"registry":{
  "backend":{"skill":"backend-analyzer.md","output":"[APP_NAME].md","analyzes":"logging, validation, error handling, auth, middleware, API patterns"},
  "frontend":{"skill":"frontend-analyzer.md","output":"[APP_NAME].md","analyzes":"state, styling, components, forms, hooks, routing"},
  "database":{"skill":"database-analyzer.md","output":"LIB-[DIR_NAME].md","scope":"cross-app","analyzes":"ORM, migrations, queries, transactions"},
  "cli":{"skill":null,"output":"[APP_NAME].md","analyzes":"commands, args, prompts - use generic template"},
  "worker":{"skill":null,"output":"[APP_NAME].md","analyzes":"jobs, queues, scheduling - use generic template"},
  "generic":{"skill":null,"output":"[APP_NAME].md","analyzes":"structure, config, entry points only"}
}}
{"dispatch_rules":[
  "One specialist per app (based on primary type)",
  "Database analyzer runs ONCE (cross-app)",
  "Apps without specialist → generic analysis",
  "All analyzers run in PARALLEL"
]}

### GenericAppTemplate
{"purpose":"Template for apps without specialist (cli, worker, unknown)"}
{"sections":["App Nature (discovered)","Structure","Entry Points","Dependencies","Configuration","Commands/Jobs (if applicable)"]}
{"rules":["Discover via code, not name","Include real examples","Skip empty sections"]}

### OutputFormat_TokenEfficient
{"location":"CLAUDE.md → ## Technical Spec","format":"JSON minified one-line per object","max":"10 words per description","sections":["Stack","Structure","Patterns","Domain","API Routes","Critical Files","Background Processing (optional)","Scheduling (optional)","Events (optional)","Webhooks (optional)","Integrations (optional)","Implementation Patterns Reference"],"skip":"sections that don't apply"}

### ImplementationPatternsReference
{"purpose":"Link to .codeadd/project/*.md for implementation details","note":"CLAUDE.md = WHERE things are, .codeadd/project/*.md = HOW to implement"}
{"naming":"Files named by path: {PREFIX}-{DIR_NAME}.md where PREFIX=APP|LIB and DIR_NAME=actual directory name in UPPERCASE","example":"apps/backend → APP-BACKEND.md, libs/database → LIB-DATABASE.md"}
{"doNOT":["include logging patterns in CLAUDE.md","include validation patterns in CLAUDE.md","include state management details in CLAUDE.md","include styling patterns in CLAUDE.md","duplicate info already in .codeadd/project/*.md"]}
{"reference":"List ALL .codeadd/project/*.md files dynamically - don't hardcode names"}

### StackContextGeneration
{"purpose":"Generate .codeadd/project/stack-context.md from discovered architecture","when":"stack-context.md does not exist OR is outdated","source":"Phase0 discovery document + package.json analysis"}

{"detection":{
  "framework":{"express":"express in deps","fastify":"fastify in deps","nestjs":"@nestjs/core in deps","bun-hono":"hono in deps + bun runtime","bun-elysia":"elysia in deps + bun runtime"},
  "orm":{"prisma":"prisma in deps","drizzle":"drizzle-orm in deps","kysely":"kysely in deps","typeorm":"typeorm in deps"},
  "database":{"postgresql":"pg in deps OR DATABASE_URL contains postgres","mysql":"mysql2 in deps","sqlite":"better-sqlite3 in deps","mongodb":"mongodb OR mongoose in deps"},
  "frontend":{"react":"react in deps","vue":"vue in deps","svelte":"svelte in deps"},
  "state":{"zustand":"zustand in deps","pinia":"pinia in deps","svelte-stores":"svelte in deps"},
  "forms":{"react-hook-form":"react-hook-form in deps","vee-validate":"vee-validate in deps","superforms":"sveltekit-superforms in deps"}
}}

{"output_path":".codeadd/project/stack-context.md","format":"See project-scaffolding skill for exact format","fields":["framework","language","runtime","orm","database","migrations","frontend framework","build-tool","ui-library","state","forms","tier","pattern","monorepo","workspace-tool"]}

{"rules":[
  "Detect from actual dependencies, never assume",
  "If field cannot be determined, use 'none' or omit",
  "tier: 'scale' if monorepo with apps/ + packages/, 'starter' otherwise",
  "monorepo: true if turbo.json OR nx.json OR workspaces in package.json",
  "pattern: 'clean-architecture' if domain/interfaces/database layers detected"
]}

### Cleanup
{"action":"rm .claude/temp/architecture-discovery.md","verify":"ls -la .claude/temp/ || echo cleanup complete"}

---

## Template Structure

```markdown
## Architecture Contract

> Dependências e placement. Consultar ANTES de implementar/revisar.

### Layers
{"hierarchy":"domain → interfaces → database → api","rule":"inner nunca importa outer"}

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

### Implementation Patterns (if .codeadd/project/ exists)
{"note":"Detailed patterns documented separately for token efficiency"}
{"files":"List dynamically from .codeadd/project/*.md - named by path (APP-BACKEND.md, APP-ADMIN.md, LIB-DATABASE.md, etc)"}
{"naming":"PREFIX-DIRNAME.md where PREFIX=APP (apps/) or LIB (libs/packages/), DIRNAME=actual directory name"}
{"generate":"Run /architecture-analyzer to create these files"}
```

---

## Critical Rules

**DO:**
- Run Phase 0 script FIRST (automated discovery)
- Read discovery document COMPLETE before manual searches
- Use document as primary source (90% of work done)
- Be framework-agnostic (detect, don't assume)
- Update section WITHIN CLAUDE.md (not separate file)
- **Generate Architecture Contract BEFORE Technical Spec**
- JSON minified one-line
- Max 10 words per description
- Document what EXISTS
- Cleanup temp document at end
- Skip sections that don't apply
- **Reference .codeadd/project/*.md for implementation patterns (if exist)**

**DO NOT:**
- Create technical-spec.md or separate files
- Use formatted/indented JSON
- Invent patterns not found in code
- Leave temp document after execution
- Assume specific framework/structure
- Ignore discovery document
- Make redundant searches
- Read many files (only necessary for patterns)
- **Include implementation details in CLAUDE.md (logging, validation, state, styling) - these go in .codeadd/project/*.md**

**SEPARATION OF CONCERNS:**
- **CLAUDE.md** = WHERE things are (structure, paths, layers, packages)
- **.codeadd/project/*.md** = HOW to implement (patterns, conventions, examples)

---

## Workflow

1. Execute `bash .codeadd/scripts/architecture-discover.sh`
2. Read `.claude/temp/architecture-discovery.md` COMPLETE
3. Use document sections as foundation
4. Deep Understanding: read 1-2 files per area ONLY if STRUCTURE unclear
5. **Update CLAUDE.md → ## Architecture Contract** (hierarquia, packages, imports, placement)
6. Update CLAUDE.md → ## Technical Spec (token-efficient, STRUCTURE only)
7. **Generate `.codeadd/project/stack-context.md`** if it doesn't exist (detect stack from deps, structure, configs)
8. **Check if .codeadd/project/*.md exist** → add Implementation Patterns Reference section
9. Cleanup: `rm .claude/temp/architecture-discovery.md`
10. Report discoveries + suggest `/architecture-analyzer` if .codeadd/project/*.md don't exist
