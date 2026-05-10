---
name: add-project-scaffolding
description: Guide Node.js project scaffolding — Starter monolith, Scale monorepo, Starter→Scale migration.
---

# Project Scaffolding

Guide AI-assisted creation of Node.js projects from scratch with consistent architecture across stacks.

**Use for:** Creating new projects, choosing stack, scaffolding folder structure, migrating Starter to Scale
**Not for:**
- Implementing features (use backend/database/frontend-development)
- Analyzing existing projects (use architecture-discovery)
- Non-Node.js stacks (Python, Go, Java, .NET, etc.)

**Principle:** This skill is KNOWLEDGE that guides the AI — not a CLI generator or static templates. The AI generates the actual files using its knowledge of each framework, guided by these architectural decisions.

---

## Tier Selection

Two tiers exist. Choose based on project needs:

| Criteria | Starter | Scale |
|----------|---------|-------|
| Team size | 1-3 devs | 3+ devs |
| Complexity | Single domain or few modules | Multiple domains, shared libs |
| Deploy targets | Single service | Multiple services/workers |
| When to choose | MVP, learning, prototyping | Production SaaS, multi-app |

**Starter is the default.** Only recommend Scale when the project clearly needs multiple apps or shared packages from day one. Starter can always migrate to Scale later.

---

## Starter Tier (Modular Monolith)

Single `src/` directory organized by domain modules. Every module contains ALL its artifacts (controller/routes, service, repository, DTOs, entities). This co-location makes future extraction to packages trivial.

### Structure

> **Legend:** NestJS uses `*.controller.ts` / `*.module.ts` (decorator-based). Other stacks (Express/Fastify/Bun-Hono/Bun-Elysia) use `*.routes.ts` for handlers and `index.ts` as barrel/plugin export.

```
project/
├── src/
│   ├── modules/                    # One directory per domain
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.module.ts
│   │   │   ├── dtos/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── user-response.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   └── auth/
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── ...
│   ├── shared/                     # Cross-module code
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   ├── migrations/
│   │   │   └── types/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── middlewares/
│   │   ├── guards/
│   │   └── utils/
│   ├── app.module.ts
│   └── main.ts                     # Entry point
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   └── owner.md
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .env.example
├── docker-compose.dev.yml
└── README.md
```

### Naming by Framework

| Stack | Controller | Service | Module | Barrel |
|-------|-----------|---------|--------|--------|
| nestjs | `*.controller.ts` | `*.service.ts` | `*.module.ts` | `index.ts` (in libs/) |
| express | `*.routes.ts` | `*.service.ts` | `index.ts` (exports) | `index.ts` |
| fastify | `*.routes.ts` | `*.service.ts` | `index.ts` (plugin) | `index.ts` |
| bun-hono | `*.routes.ts` | `*.service.ts` | `index.ts` | `index.ts` |
| bun-elysia | `*.routes.ts` | `*.service.ts` | `index.ts` (plugin) | `index.ts` |

---

## Scale Tier (Monorepo)

Multiple apps sharing packages. Each package has clear responsibility. Modules INSIDE apps follow the same structure as Starter.

### Structure

```
project/
├── apps/
│   ├── api/                        # HTTP server
│   │   ├── src/
│   │   │   ├── modules/            # Same module structure as Starter
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── worker/                     # Background jobs (optional)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── core/                       # Entities, enums, interfaces
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── enums/
│   │   │   └── interfaces/
│   │   └── package.json
│   ├── database/                   # ORM, migrations, repositories
│   │   ├── src/
│   │   │   ├── migrations/
│   │   │   ├── repositories/
│   │   │   └── types/
│   │   └── package.json
│   ├── services/                   # Shared business logic
│   │   └── package.json
│   ├── shared/                     # Utils, configs, middlewares
│   │   └── package.json
│   └── adapters/                   # External integrations
│       └── package.json
├── docs/
├── infra/                          # Docker, CI/CD, IaC
├── package.json                    # Workspace root
├── turbo.json                      # or nx.json, or bun workspace
└── tsconfig.base.json
```

---

## Scaffolding Workflow

When creating a new project, follow this sequence:

### 1. Collect Choices

Ask the user (or infer from context):

```
1. Stack: express | fastify | nestjs | bun-hono | bun-elysia
2. Database: postgresql | mysql | sqlite | mongodb | none (default: postgresql)
3. ORM: prisma | drizzle | kysely | typeorm | none (default: prisma)
4. Frontend: react | vue | svelte | none (default: none)
5. Tier: starter | scale (default: starter)
6. Package manager: npm | pnpm | yarn | bun (default: pnpm)
```

### 2. Generate Folder Structure

Create the directory structure matching the chosen tier. Use the framework-specific naming conventions from the tables above.

### 3. Generate Configuration Files

For each stack, generate appropriate configs:

#### TypeScript Config

| Scope | Options |
|-------|---------|
| Base `compilerOptions` | `target: ES2022`, `module/moduleResolution: NodeNext`, `strict: true`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`, `resolveJsonModule`, `declaration`, `declarationMap`, `sourceMap`, `outDir: ./dist` |
| NestJS additions | `emitDecoratorMetadata: true`, `experimentalDecorators: true` |
| Bun override | `types: ["bun-types"]` |

#### Docker Compose (dev)

Every project gets a `docker-compose.dev.yml` for local database:

```yaml
services:
  db:
    image: postgres:16-alpine  # or mysql:8, mongo:7
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app_dev
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

#### Environment

`.env.example` with documented variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://dev:dev@localhost:5432/app_dev

# Auth (if applicable)
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
```

### 4. Generate Entry Point

Create `main.ts` with the framework's bootstrap pattern. The AI knows each framework's bootstrap — use idiomatic code for the chosen stack.

### 5. Create Initial Module (Optional)

If the user mentions a domain (e.g., "user management app"), create the first module following the structure. Otherwise, leave `modules/` empty with a `.gitkeep`.

---

## Migration: Starter to Scale

When a Starter project outgrows its structure, migrate to Scale. The module-based organization makes this mechanical:

### Mapping

| Starter (from) | Scale (to) | Action |
|----------------|------------|--------|
| `src/modules/*/entities/` | `packages/core/src/entities/` | Move, update imports |
| `src/modules/*/` (services, repos) | `apps/api/src/modules/*/` | Move controller/service, extract repo to packages/database |
| `src/shared/database/` | `packages/database/` | Extract as package |
| `src/shared/config/` | `packages/shared/src/config/` | Extract as package |
| `src/shared/utils/` | `packages/shared/src/utils/` | Extract as package |
| `src/main.ts` | `apps/api/src/main.ts` | Move, adjust imports |
| `package.json` | Root `package.json` + `apps/api/package.json` | Split dependencies |
| `tsconfig.json` | `tsconfig.base.json` + `apps/api/tsconfig.json` | Config inheritance |

### Migration Steps

1. **Create monorepo structure** — `apps/`, `packages/`, root workspace config
2. **Extract domain layer** — Move entities and enums to `packages/core/`
3. **Extract database layer** — Move migrations, repositories, types to `packages/database/`
4. **Extract shared utilities** — Move config, utils, middlewares to `packages/shared/`
5. **Move app code** — Move `src/modules/` and `main.ts` to `apps/api/src/`
6. **Update imports** — Replace relative paths with package imports (`@project/core`, `@project/database`)
7. **Configure workspace tool** — Add turbo.json/nx.json with build pipeline
8. **Update tsconfig** — Create base config, extend in each package/app
9. **Verify build** — Each package builds independently, app builds with all deps

### Migration Principle

Each `module/` and `shared/` from Starter maps 1:1 to a `package/` or `apps/` in Scale. The NestJS-like module organization ensures this is a mechanical process, not an architectural redesign.

---

## Stack-Specific Guidance

### Universal (all stacks)

- Organize by domain modules, not by technical layer
- Each module self-contained: routes/controller + service + repository + DTOs + entities
- Entry point (`main.ts`) registers modules, not individual routes
- Configuration centralized in `shared/config/` — never `process.env` in modules
- Database connection in `shared/database/` — shared across modules

### Express / Fastify

- Use Router (Express) or plugin (Fastify) to encapsulate each module
- Register all module routers/plugins in `app.ts`
- Module's `index.ts` exports the router/plugin for registration
- DI manual — create instances in `index.ts` or use lightweight container (tsyringe, awilix)

### NestJS

- Standard NestJS patterns — `@Module`, `@Controller`, `@Injectable`
- Each domain gets its own module with providers, controllers, exports
- Register all feature modules in `AppModule`

### Bun (Hono / Elysia)

- Use Hono's `app.route()` or Elysia's `.use()` plugin to mount modules
- Module's `index.ts` exports the sub-app/plugin
- Leverage Bun's native performance — no clustering needed

---

## Validation Checklist

### Structure
- [ ] Folder structure matches chosen tier (Starter or Scale)
- [ ] Each module contains: controller/routes, service, repository, DTOs, entities
- [ ] `shared/` contains: database, config, middlewares, utils
- [ ] `tests/` directory exists with unit/ and integration/

### Configuration
- [ ] `tsconfig.json` exists with strict mode enabled
- [ ] `package.json` has correct scripts (dev, build, start, test, migrate)
- [ ] `.env.example` exists with documented variables
- [ ] `docker-compose.dev.yml` exists for local database
- [ ] `.eslintrc.js` exists

### Module Organization
- [ ] Modules organized by domain, not by technical layer
- [ ] No cross-module direct imports (use shared/ or package imports)
- [ ] Entry point registers modules via framework-idiomatic pattern

### Migration Readiness (Starter)
- [ ] Each module is self-contained (could be extracted to a package)
- [ ] Shared code is in `shared/`, not scattered across modules
- [ ] No hard-coded paths between modules

---

## Next Steps

After the project structure is created, run `/add.xray` to generate:
- `.codeadd/project/stack-context.md` — stack key-value file consumed by dev skills
- `{{skill:project-patterns/}}` — implementation patterns skill with backend, frontend, database area files
- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` — context files with architecture contract and technical spec
