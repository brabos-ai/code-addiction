# Backend Analyzer

Analisa e documenta padrões backend IMPLEMENTADOS no projeto.

## Objetivo

Gerar conteúdo para `.codeadd/project/[PREFIX]-[DIR_NAME].md` com padrões reais do projeto.

**Naming Convention:** File name = `{PREFIX}-{DIRECTORY-NAME}.md`
- PREFIX = APP (if in apps/) | LIB (if in libs/ or packages/)
- DIRECTORY-NAME = exact directory name in UPPERCASE
- Example: `apps/backend` → `APP-BACKEND.md`, `apps/server` → `APP-SERVER.md`

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

### 9. Testing (SE EXISTIR)
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

```markdown
# Backend Patterns

## Framework & Language
Framework: [nome] | Language: [lang] | Runtime: [version]

## Logging
Library: [nome]
| Config | Value |
|--------|-------|
| Format | [JSON/text] |
| Levels | [lista] |
| Transport | [onde vai] |

Usage:
```[lang]
[exemplo REAL do código]
```

## Validation
Library: [nome]
Pattern: [como funciona]

Example:
```[lang]
[exemplo REAL de DTO/schema]
```

Error response:
```json
[formato REAL de erro]
```

## Database Interaction
ORM: [nome]
Entities: [path glob]
Repositories: [path glob]

Query pattern:
```[lang]
[exemplo REAL de query]
```

## Error Handling
Base class: [path se existir]
HTTP mapping:
| Status | Exception |
|--------|-----------|
| 400 | [nome] |
| 401 | [nome] |
| 404 | [nome] |

Pattern:
```[lang]
[exemplo REAL de throw]
```

## Middleware
Registration: [onde]
Order:
1. [middleware 1]
2. [middleware 2]

## Authentication
Type: [JWT/session/OAuth]
Guard: [path/nome]
Token location: [header/cookie]

## API Conventions
Response format:
```json
[formato REAL]
```
Versioning: [padrão]

## Testing
Framework: [nome]
Files: [padrão]
Run: [comando]
```

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
