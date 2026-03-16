# Database Analyzer

Analisa e documenta estratégia de database IMPLEMENTADA no projeto.

## Objetivo

Gerar conteúdo para `.codeadd/project/LIB-[DIR_NAME].md` com padrões reais do projeto.

**Naming Convention:** File name = `LIB-{DIRECTORY-NAME}.md`
- Based on actual lib path: `libs/database` → `LIB-DATABASE.md`, `libs/app-database` → `LIB-APP-DATABASE.md`
- If cross-app without dedicated lib: use `LIB-DATABASE.md` as fallback

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

### 6. Seeding (SE EXISTIR)
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

```markdown
# Database Architecture

## Database Type
Type: [PostgreSQL/MySQL/MongoDB/etc]
Connection: [env var name or config path]

## Migrations
Tool: [typeorm/prisma/knex/etc]
Folder: [path]
Glob: [padrão de arquivos, ex: *.ts, *.sql]

Commands:
| Action | Command |
|--------|---------|
| Create | [comando real] |
| Run | [comando real] |
| Revert | [comando real] |

Example migration:
```[lang]
[exemplo REAL de migration do projeto]
```

## Connection Strategy
Config: [path do arquivo de config]
Pool: [tamanho se encontrado]
Timeout: [valor se encontrado]

## Query Patterns
ORM: [nome]
Entities: [path glob]
Repositories: [path glob]

Pattern:
```[lang]
[exemplo REAL de query do projeto]
```

## Row-Level Security
Status: [Enabled/Disabled]
Policies: [path]
Pattern: [by tenant_id, user_id, etc]

Example:
```sql
[exemplo REAL de policy]
```

## Seeding
File: [path]
Run: [comando]
```

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
