# Database Analyzer

Analyzes and documents the database strategy IMPLEMENTED in the project.

## Objective

Generate `{{addpath:wiki/domains/database.md}}` with real project patterns. Follows the shared wiki page contract in `{{skill:add-architecture-discovery/SKILL.md}}` (frontmatter schema, TL;DR + TOC + topic-first `##` chunks, content rules) — this file only adds database-specific discovery and section structure.

**IMPORTANT:** Do NOT document schema, tables, or indexes. They are dynamic and go stale.

**Scope rule:** domain-LOCAL database conventions (this project's entity naming, this project's migration workflow) belong on this page. Project-WIDE conventions (naming, ID/commit conventions, cross-app error-handling philosophy) belong on `{{addpath:wiki/conventions.md}}` — link to it, don't restate it.

## FIRST: Discover IF Database Exists

**Do NOT assume anything. Discover via config files and code.**

1. Read CLAUDE.md to understand the project structure
2. Read config files to identify database dependencies:
   ```bash
   # Dependencies list ORMs, drivers, query builders
   cat package.json 2>/dev/null          # Node.js (typeorm, prisma, knex, etc)
   cat requirements.txt 2>/dev/null      # Python (sqlalchemy, django ORM, etc)
   cat Gemfile 2>/dev/null               # Ruby (activerecord, sequel, etc)
   cat pom.xml 2>/dev/null               # Java (hibernate, jpa, etc)
   cat build.gradle 2>/dev/null          # Java Gradle
   cat go.mod 2>/dev/null                # Go (gorm, sqlx, etc)
   cat Cargo.toml 2>/dev/null            # Rust (diesel, sqlx, etc)
   cat composer.json 2>/dev/null         # PHP (eloquent, doctrine, etc)
   ```
3. Look for database folders/files:
   ```bash
   # Migrations, entities, schemas
   find . -type d \( -name "migrations" -o -name "entities" -o -name "models" \) 2>/dev/null | head -10
   ```
4. If no database/ORM found in the project → return "NO_DATABASE_FOUND"
5. If found → continue analysis

## What to Discover

Search ONLY for what exists in the project:

### 1. Database Type
- Which engine is being used? (discover via connection string or config)
- Connection: where it comes from (env var, config file)

### 2. Migrations
- Tool: typeorm, knex, prisma, liquibase, flyway, alembic, etc
- Folder: migrations path
- Glob: file pattern
- Commands: how to create, run, revert
- **Find a migration example**

### 3. Connection Strategy
- Pool size
- Timeout
- Where configured

### 4. ORM/Query Builder
- Library: typeorm, prisma, knex, kysely, sequelize, sqlalchemy, etc
- Entities/Models: path glob
- Repositories: path glob (if exists)

### 5. Row-Level Security (IF EXISTS)
- Status: enabled/disabled
- Policies: where defined
- Pattern: by tenant_id, user_id, etc

### 6. Reusable Abstractions (CRITICAL — prevents duplication)
- Base repository class (if exists) — agents MUST extend instead of creating raw queries
- Shared query helpers/builders (pagination, filtering, sorting utilities)
- Transaction wrappers/patterns
- Existing entity types/interfaces that new entities should follow
- Seed data factories/builders
- **For each: document path, purpose, and usage example**

### 7. Database Conventions (CRITICAL — ensures consistency)
- Entity/model naming pattern (singular? plural? PascalCase?)
- Migration naming convention (timestamp prefix? sequential?)
- Repository file placement (co-located with entity? separate folder?)
- How new entities are registered with the ORM
- How new migrations are created (CLI command)
- **Principle: the agent must follow the established pattern**

### 8. Seeding (IF EXISTS)
- File: seed path
- Command: how to run

## How to Search

**IMPORTANT:** First read package.json (or equivalent) to see installed database dependencies. Then confirm with code.

```bash
# 1. Read project dependencies (source of truth)
cat package.json | grep -A 100 '"dependencies"' | head -50

# 2. Find database folders
find . -type d \( -name "migrations" -o -name "entities" -o -name "models" -o -name "schemas" \) 2>/dev/null | head -10

# 3. Find ORM config files
find . -type f \( -name "ormconfig*" -o -name "*.schema.prisma" -o -name "knexfile*" -o -name "drizzle.config*" -o -name "schema.prisma" \) 2>/dev/null | head -5

# 4. Find database env vars
cat .env .env.example .env.local 2>/dev/null | grep -i "database\|db_\|postgres\|mysql\|mongo"

# 5. Read a migration/entity file to understand the pattern
# (choose a file after discovering where they are)
```

## Output Format

Write to `{{addpath:wiki/domains/database.md}}` using this structure:

```markdown
---
type: reference
area: database
description: [1-2 sentences, keyword-rich — engine, ORM, migration tool, when to read this page]
sources: [libs/database/**]   # ≤8 globs covering every path cited below; "cross-app" scope noted in description
commit: [short-sha at generation]
generated: YYYY-MM-DD
tags: [detected engine, ORM, key patterns — ≤6]
---

## TL;DR

[Brief by genre — engine, ORM, migration tool, patterns count. Extractive only. Stop when those are covered. No length number applies.]

## TOC

- [Database Type](#database-type)
- [Migrations](#migrations)
- [Connection Strategy](#connection-strategy)
- [Query Patterns](#query-patterns)
- [Row-Level Security](#row-level-security)
- [Reusable Abstractions](#reusable-abstractions)
- [Database Conventions](#database-conventions)
- [Seeding](#seeding)

## Database Type

[Topic sentence: engine, connection source.]
Config: `{"type":"[PostgreSQL/MySQL/etc]","connection":"[env var or config path]"}`

## Migrations

[Topic sentence: tool, folder, file pattern.]
Config: `{"tool":"[name]","folder":"[path]","glob":"[pattern]","commands":{"create":"[cmd]","run":"[cmd]","revert":"[cmd]"}}`

```[lang]
// [path:line]
[REAL migration example, ≤10 lines]
```

## Connection Strategy

[Topic sentence: pool config, where configured.]
Config: `{"config":"[path]","pool":"[size]","timeout":"[value]"}`

## Query Patterns

[Topic sentence: ORM, repository pattern.]
Config: `{"orm":"[name]","entities":"[path glob]","repositories":"[path glob]"}`

```[lang]
// [path:line]
[REAL query example, ≤10 lines]
```

## Row-Level Security

[Topic sentence: status, policy pattern.]
Config: `{"status":"[enabled/disabled]","policies":"[path]","pattern":"[by tenant_id/user_id/etc]"}`

```sql
-- [path:line]
[REAL policy example, ≤10 lines]
```

## Reusable Abstractions

[Topic sentence: what exists that agents MUST reuse for database work.]

**Base repository:**
- `[ClassName]` at `[path]` — [purpose]. Extend for new entities.

**Query helpers:**
- `[helperName]` at `[path]` — [pagination/filtering/sorting]

**Transaction patterns:**
- [how transactions are wrapped, path to example]

## Database Conventions

[Topic sentence: how database code is organized — domain-local only. Project-wide conventions live in `{{addpath:wiki/conventions.md}}`; link there instead of restating.]

Entity naming: [singular/plural, PascalCase]
Migration naming: [timestamp prefix, CLI command to create]
Repository placement: [co-located or separate]
New entity registration: [how to register with ORM]

## Seeding

[Topic sentence: seed file, command.]
Config: `{"file":"[path]","run":"[command]"}`

## Related

- [wiki/conventions.md](../conventions.md): project-wide naming/error-handling/style conventions
- [wiki/architecture.md](../architecture.md): system shape and layer boundaries this database layer serves
- [wiki/domains/backend.md](backend.md): consumers of this repository layer, if applicable
```

**CRITICAL:** Skip sections that don't exist. Each ## chunk = topic sentence + extractive content. Split by sub-heading rather than truncate when a chunk grows past a natural boundary. No numeric length cap applies (see `{{skill:add-doc-schemas/SKILL.md}}` for the output-length doctrine). Code examples always with `// path:line` comment. TOC only includes sections that exist. Full frontmatter schema, body contract, and content rules (sources/commit/tags, no-structural-facts, page size caps): see `{{skill:add-architecture-discovery/SKILL.md}}` → Wiki Page Contract.

**MOST IMPORTANT SECTIONS:** Reusable Abstractions and Database Conventions are the highest-value sections — they prevent agents from writing raw queries when helpers exist, and ensure new entities/migrations follow the established pattern.

## Critical Rules

**MANDATORY:**
- Document paths and globs (actionable)
- Real code examples
- Real project commands

**FORBIDDEN:**
- Table schemas (dynamic, goes stale)
- Relationships between tables
- Specific indexes
- Backup/recovery strategy
- Sections with "Not found"
