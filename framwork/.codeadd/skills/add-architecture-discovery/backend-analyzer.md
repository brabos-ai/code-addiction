# Backend Analyzer

Analyzes and documents backend patterns IMPLEMENTED in the project.

## Objective

Generate `{{addpath:wiki/domains/backend.md}}` with real project patterns. Follows the shared wiki page contract in `{{skill:add-architecture-discovery/SKILL.md}}` (frontmatter schema, TL;DR + TOC + topic-first `##` chunks, content rules) — this file only adds backend-specific discovery and section structure.

**Scope rule:** domain-LOCAL backend conventions (this app's error handling, this app's DTO pattern) belong on this page. Project-WIDE conventions (naming, ID/commit conventions, cross-app error-handling philosophy) belong on `{{addpath:wiki/conventions.md}}` — link to it, don't restate it.

## FIRST: Discover IF Backend Exists

**Do NOT assume anything. Discover via config files and code.**

1. Read CLAUDE.md to understand the project structure
2. Read config files to identify dependencies:
   ```bash
   # Dependencies list everything the project uses
   cat package.json 2>/dev/null          # Node.js
   cat requirements.txt 2>/dev/null      # Python
   cat Gemfile 2>/dev/null               # Ruby
   cat pom.xml 2>/dev/null               # Java Maven
   cat build.gradle 2>/dev/null          # Java Gradle
   cat go.mod 2>/dev/null                # Go
   cat Cargo.toml 2>/dev/null            # Rust
   cat composer.json 2>/dev/null         # PHP
   cat *.csproj 2>/dev/null              # .NET
   ```
3. Analyze file extensions to confirm the stack
4. If no backend code is found → return "NO_BACKEND_FOUND"
5. If found → continue analysis

## What to Discover

Search ONLY for what exists in the project:

### 1. Framework & Language
- Which framework is being used? (discover via imports/code)
- Which language? (check file extensions)
- Runtime version (if documented)

### 2. Logging
- Library: winston, pino, bunyan, morgan, loguru, etc
- Configuration: format (JSON?), levels, transports
- Context: correlationId, userId, etc
- **Find a real usage example in the code**

### 3. Validation
- Library: class-validator, joi, zod, yup, pydantic, etc
- Pattern: decorators, schemas, DTOs
- Validation error format
- **Find a real DTO/schema example**

### 4. Database Interaction
- ORM/Query builder: typeorm, prisma, sequelize, knex, kysely, sqlalchemy, etc
- Repository pattern
- Entities/models location
- **Find a query example**

### 5. Error Handling
- Base error class (if exists)
- HTTP status mapping
- try/catch pattern
- **Find a throw example**

### 6. Middleware
- Execution order
- Where registered
- Main middlewares (auth, logging, rate-limit)

### 7. Authentication
- Type: JWT, sessions, OAuth
- Where token is validated
- Guards/decorators

### 8. API Conventions
- Standard response format
- Versioning
- Rate limiting

### 9. Reusable Abstractions (CRITICAL — prevents duplication)
- Base classes agents MUST extend (BaseService, BaseRepository, BaseController, etc)
- Shared utilities/helpers (formatters, parsers, mappers, validators)
- Custom decorators/annotations already available
- Shared DTOs, enums, types, interfaces
- Existing services that solve common problems (notification, email, file upload, etc)
- **For each: document path, purpose, and usage example**
- **Principle: if it exists, the agent MUST reuse it instead of creating a new one**

### 10. Project Conventions (CRITICAL — ensures consistency)
- File/folder naming pattern (kebab-case, camelCase, PascalCase)
- Module/feature organization (by domain? by layer? by feature?)
- Import ordering conventions
- Dependency injection pattern (constructor, decorator, factory)
- Where new files of each type should be placed
- How new endpoints/routes are registered
- **Principle: the agent must follow the established pattern, not invent a new one**

### 11. Testing (IF EXISTS)
- Framework: jest, mocha, vitest, pytest, etc
- File pattern: .spec.ts, .test.ts, test_*.py
- Commands

## How to Search

```bash
# 1. Find framework
grep -rE "from '@nestjs|from 'express|from 'fastify" --include="*.ts" --include="*.js" | head -3

# 2. Find logging
grep -rE "winston|pino|bunyan|logger\." --include="*.ts" | head -5

# 3. Find validation
grep -rE "class-validator|@IsEmail|@IsString|zod|joi" --include="*.ts" | head -5

# 4. Find ORM
grep -rE "typeorm|prisma|sequelize|knex|kysely" --include="*.ts" | head -5

# 5. Find error handling
grep -rE "extends (Http)?Exception|throw new" --include="*.ts" | head -5

# 6. Find auth
grep -rE "JwtService|passport|@UseGuards" --include="*.ts" | head -5
```

## Output Format

Write to `{{addpath:wiki/domains/backend.md}}` using this structure:

```markdown
---
type: reference
area: backend
description: [1-2 sentences, keyword-rich — framework, key patterns, when to read this page]
sources: [apps/server/**, libs/backend/**]   # ≤8 globs covering every path cited below
commit: [short-sha at generation]
generated: YYYY-MM-DD
tags: [detected framework, key patterns — ≤6]
---

## TL;DR

[Brief by genre — framework, key libraries, patterns count. Extractive only. Stop when the three are covered. No length number applies.]

## TOC

- [Framework & Language](#framework--language)
- [Logging](#logging)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Middleware](#middleware)
- [Authentication](#authentication)
- [API Conventions](#api-conventions)
- [Database Interaction](#database-interaction)
- [Reusable Abstractions](#reusable-abstractions)
- [Project Conventions](#project-conventions)
- [Testing](#testing)

## Framework & Language

[Topic sentence describing framework choice.] Framework: [name] | Language: [lang] | Runtime: [version]

## Logging

[Topic sentence: what logger, what context pattern.]
Config: `{"library":"[name]","format":"[JSON/text]","levels":"[list]","context":"[fields]"}`

```[lang]
// [path:line]
[REAL code example, ≤10 lines]
```

## Validation

[Topic sentence: what library, what pattern (decorators/schemas/DTOs).]
Config: `{"library":"[name]","pattern":"[decorators/schemas]"}`

```[lang]
// [path:line]
[REAL DTO/schema example, ≤10 lines]
```

## Error Handling

[Topic sentence: base class, HTTP mapping strategy.]
Config: `{"base_class":"[path]","mapping":{"400":"[name]","401":"[name]","404":"[name]"}}`

```[lang]
// [path:line]
[REAL throw example, ≤10 lines]
```

## Middleware

[Topic sentence: where registered, execution order.]
Order: [middleware1] → [middleware2] → [middleware3]

## Authentication

[Topic sentence: auth type, where validated.]
Config: `{"type":"[JWT/session/OAuth]","guard":"[path]","token":"[header/cookie]"}`

## API Conventions

[Topic sentence: response format, versioning.]

```json
[REAL response format example]
```

## Database Interaction

[Topic sentence: ORM, repository pattern.]
Config: `{"orm":"[name]","entities":"[path glob]","repositories":"[path glob]"}`

```[lang]
// [path:line]
[REAL query example, ≤10 lines]
```

## Reusable Abstractions

[Topic sentence: what exists that agents MUST reuse instead of creating from scratch.]

**Base classes:**
- `[ClassName]` at `[path]` — [purpose]. Extend this for new [services/controllers/etc].

**Shared utilities:**
- `[utilName]` at `[path]` — [what it does]

**Shared DTOs/Types:**
- `[path glob]` — [what's available]

**Existing services (reuse, don't duplicate):**
- `[ServiceName]` at `[path]` — [what problem it solves]

## Project Conventions

[Topic sentence: how THIS app is organized and where new backend code should go — domain-local only. Project-wide conventions live in `{{addpath:wiki/conventions.md}}`; link there instead of restating.]

File naming: [pattern]
Module organization: [by domain/layer/feature]
New endpoint registration: [how]
New service placement: [where]
Import ordering: [convention if any]

## Testing

[Topic sentence: framework, file pattern.]
Config: `{"framework":"[name]","files":"[pattern]","run":"[command]"}`

## Related

- [wiki/conventions.md](../conventions.md): project-wide naming/error-handling/style conventions
- [wiki/architecture.md](../architecture.md): system shape and layer boundaries this app fits into
- [wiki/domains/database.md](database.md): shared DB access patterns, if this app uses them
```

**CRITICAL:** Skip sections that don't exist. Each ## chunk = topic sentence + extractive content. Split by sub-heading rather than truncate when a chunk grows past a natural boundary. No numeric length cap applies (see `{{skill:add-doc-schemas/SKILL.md}}` for the output-length doctrine). Code examples always with `// path:line` comment. TOC only includes sections that exist. Full frontmatter schema, body contract, and content rules (sources/commit/tags, no-structural-facts, page size caps): see `{{skill:add-architecture-discovery/SKILL.md}}` → Wiki Page Contract.

**MOST IMPORTANT SECTIONS:** Reusable Abstractions and Project Conventions are the highest-value sections — they prevent agents from duplicating existing code and violating established patterns. Prioritize discovering these over documenting library configs.

## Critical Rules

**MANDATORY:**
- Read real files to extract examples
- Only include sections that ACTUALLY exist
- Examples must come from the project code, not generic docs

**FORBIDDEN:**
- Fabricate patterns not found in the code
- Sections with "Not found" or "None"
- Generic documentation examples
- Assume configurations
