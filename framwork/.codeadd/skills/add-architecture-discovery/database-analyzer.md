# Database Analyzer

Analisa e documenta estratégia de database IMPLEMENTADA no projeto.

## Objetivo

Gerar `.codeadd/skills/project-patterns/database.md` com padrões reais do projeto. Follows context engineering principles: frontmatter + TL;DR + TOC + topic-first ## chunks (~128 tokens each) with extractive-only content and real code examples.

**IMPORTANTE:** NÃO documentar schema, tabelas ou índices. São dinâmicos e ficam desatualizados.

## PRIMEIRO: Descobrir SE Existe Database

**NÃO assuma nada. Descubra via config files e código.**

1. Leia CLAUDE.md para entender estrutura do projeto
2. Leia config files para identificar dependências de database:
   ```bash
   # Dependências listam ORMs, drivers, query builders
   cat package.json 2>/dev/null          # Node.js (typeorm, prisma, knex, etc)
   cat requirements.txt 2>/dev/null      # Python (sqlalchemy, django ORM, etc)
   cat Gemfile 2>/dev/null               # Ruby (activerecord, sequel, etc)
   cat pom.xml 2>/dev/null               # Java (hibernate, jpa, etc)
   cat build.gradle 2>/dev/null          # Java Gradle
   cat go.mod 2>/dev/null                # Go (gorm, sqlx, etc)
   cat Cargo.toml 2>/dev/null            # Rust (diesel, sqlx, etc)
   cat composer.json 2>/dev/null         # PHP (eloquent, doctrine, etc)
   ```
3. Procure por pastas/arquivos de database:
   ```bash
   # Migrations, entities, schemas
   find . -type d \( -name "migrations" -o -name "entities" -o -name "models" \) 2>/dev/null | head -10
   ```
4. Se não encontrar database/ORM no projeto → retorne "NO_DATABASE_FOUND"
5. Se encontrar → continue a análise

## O Que Descobrir

Pesquise APENAS se existir no projeto:

### 1. Database Type
- Qual engine está sendo usado? (descubra via connection string ou config)
- Connection: de onde vem (env var, config file)

### 2. Migrations
- Tool: typeorm, knex, prisma, liquibase, flyway, alembic, etc
- Pasta: path das migrations
- Glob: padrão de arquivos
- Comandos: como criar, rodar, reverter
- **Encontrar exemplo de migration**

### 3. Connection Strategy
- Pool size
- Timeout
- Onde configurado

### 4. ORM/Query Builder
- Biblioteca: typeorm, prisma, knex, kysely, sequelize, sqlalchemy, etc
- Entities/Models: path glob
- Repositories: path glob (se existir)

### 5. Row-Level Security (SE EXISTIR)
- Status: enabled/disabled
- Policies: onde definidas
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

### 8. Seeding (SE EXISTIR)
- Arquivo: path do seed
- Comando: como rodar

## Como Pesquisar

**IMPORTANTE:** Primeiro leia package.json (ou equivalente) para ver dependências de database instaladas. Depois confirme com código.

```bash
# 1. Ler dependências do projeto (fonte da verdade)
cat package.json | grep -A 100 '"dependencies"' | head -50

# 2. Encontrar pastas de database
find . -type d \( -name "migrations" -o -name "entities" -o -name "models" -o -name "schemas" \) 2>/dev/null | head -10

# 3. Encontrar arquivos de config de ORM
find . -type f \( -name "ormconfig*" -o -name "*.schema.prisma" -o -name "knexfile*" -o -name "drizzle.config*" -o -name "schema.prisma" \) 2>/dev/null | head -5

# 4. Encontrar env vars de database
cat .env .env.example .env.local 2>/dev/null | grep -i "database\|db_\|postgres\|mysql\|mongo"

# 5. Ler arquivo de migration/entity para entender padrão
# (escolher um arquivo após descobrir onde estão)
```

## Output Format

Write to `.codeadd/skills/project-patterns/database.md` using this structure:

```markdown
---
area: database
generated: YYYY-MM-DD
app-path: [actual lib path, e.g., libs/database, or "cross-app"]
engine: [detected database engine]
---

## TL;DR

[≤60 words: engine, ORM, migration tool, patterns count. Extractive only.]

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

[Topic sentence: how database code is organized.]

Entity naming: [singular/plural, PascalCase]
Migration naming: [timestamp prefix, CLI command to create]
Repository placement: [co-located or separate]
New entity registration: [how to register with ORM]

## Seeding

[Topic sentence: seed file, command.]
Config: `{"file":"[path]","run":"[command]"}`
```

**CRITICAL:** Skip sections that don't exist. Each ## chunk ~100-150 words max. Code examples always with `// path:line` comment. TOC only includes sections that exist.

**MOST IMPORTANT SECTIONS:** Reusable Abstractions and Database Conventions are the highest-value sections — they prevent agents from writing raw queries when helpers exist, and ensure new entities/migrations follow the established pattern.

## Regras Críticas

**OBRIGATÓRIO:**
- Documentar paths e globs (acionáveis)
- Exemplos reais do código
- Comandos reais do projeto

**PROIBIDO:**
- Schema de tabelas (dinâmico, fica old)
- Relacionamentos entre tabelas
- Índices específicos
- Backup/recovery strategy
- Seções com "Not found"
