# Backend Analyzer

Analisa e documenta padrões backend IMPLEMENTADOS no projeto.

## Objetivo

Gerar `.codeadd/skills/project-patterns/backend.md` com padrões reais do projeto. Follows context engineering principles: frontmatter + TL;DR + TOC + topic-first ## chunks (~128 tokens each) with extractive-only content and real code examples.

## PRIMEIRO: Descobrir SE Existe Backend

**NÃO assuma nada. Descubra via config files e código.**

1. Leia CLAUDE.md para entender estrutura do projeto
2. Leia config files para identificar dependências:
   ```bash
   # Dependências listam tudo que o projeto usa
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
3. Analise extensões de arquivos para confirmar stack
4. Se não encontrar código backend → retorne "NO_BACKEND_FOUND"
5. Se encontrar → continue a análise

## O Que Descobrir

Pesquise APENAS se existir no projeto:

### 1. Framework & Language
- Qual framework está sendo usado? (descubra via imports/código)
- Qual linguagem? (veja extensões dos arquivos)
- Runtime version (se documentado)

### 2. Logging
- Biblioteca: winston, pino, bunyan, morgan, loguru, etc
- Configuração: formato (JSON?), níveis, transports
- Contexto: correlationId, userId, etc
- **Encontrar exemplo real de uso no código**

### 3. Validation
- Biblioteca: class-validator, joi, zod, yup, pydantic, etc
- Padrão: decorators, schemas, DTOs
- Formato de erro de validação
- **Encontrar exemplo real de DTO/schema**

### 4. Database Interaction
- ORM/Query builder: typeorm, prisma, sequelize, knex, kysely, sqlalchemy, etc
- Padrão de repositório
- Localização de entities/models
- **Encontrar exemplo de query**

### 5. Error Handling
- Classe base de erro (se existir)
- Mapeamento HTTP status
- Padrão de try/catch
- **Encontrar exemplo de throw**

### 6. Middleware
- Ordem de execução
- Onde registrado
- Principais middlewares (auth, logging, rate-limit)

### 7. Authentication
- Tipo: JWT, sessions, OAuth
- Onde token validado
- Guards/decorators

### 8. API Conventions
- Response format padrão
- Versionamento
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

### 11. Testing (SE EXISTIR)
- Framework: jest, mocha, vitest, pytest, etc
- Padrão de arquivos: .spec.ts, .test.ts, test_*.py
- Comandos

## Como Pesquisar

```bash
# 1. Encontrar framework
grep -rE "from '@nestjs|from 'express|from 'fastify" --include="*.ts" --include="*.js" | head -3

# 2. Encontrar logging
grep -rE "winston|pino|bunyan|logger\." --include="*.ts" | head -5

# 3. Encontrar validation
grep -rE "class-validator|@IsEmail|@IsString|zod|joi" --include="*.ts" | head -5

# 4. Encontrar ORM
grep -rE "typeorm|prisma|sequelize|knex|kysely" --include="*.ts" | head -5

# 5. Encontrar error handling
grep -rE "extends (Http)?Exception|throw new" --include="*.ts" | head -5

# 6. Encontrar auth
grep -rE "JwtService|passport|@UseGuards" --include="*.ts" | head -5
```

## Output Format

Write to `.codeadd/skills/project-patterns/backend.md` using this structure:

```markdown
---
area: backend
generated: YYYY-MM-DD
app-path: [actual app path, e.g., apps/server]
framework: [detected framework]
---

## TL;DR

[≤60 words: framework, key libraries, patterns count. Extractive only.]

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

[Topic sentence: how the project is organized and where new code should go.]

File naming: [pattern]
Module organization: [by domain/layer/feature]
New endpoint registration: [how]
New service placement: [where]
Import ordering: [convention if any]

## Testing

[Topic sentence: framework, file pattern.]
Config: `{"framework":"[name]","files":"[pattern]","run":"[command]"}`
```

**CRITICAL:** Skip sections that don't exist. Each ## chunk ~100-150 words max. Code examples always with `// path:line` comment. TOC only includes sections that exist.

**MOST IMPORTANT SECTIONS:** Reusable Abstractions and Project Conventions are the highest-value sections — they prevent agents from duplicating existing code and violating established patterns. Prioritize discovering these over documenting library configs.

## Regras Críticas

**OBRIGATÓRIO:**
- Ler arquivos reais para extrair exemplos
- Só incluir seções que REALMENTE existem
- Exemplos devem ser do código do projeto, não genéricos

**PROIBIDO:**
- Inventar padrões não encontrados
- Seções com "Not found" ou "None"
- Exemplos genéricos de documentação
- Assumir configurações
