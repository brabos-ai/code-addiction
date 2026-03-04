---
name: backend-development
description: |
  Padrões de Backend API: RESTful, IoC/DI, CQRS, DTOs, Clean Architecture.
---

# Backend Development

Skill para implementação de Backend API seguindo padrões do projeto.

**Use para:** Controllers, Services, DTOs, Commands/Events, IoC config
**Não use para:** Frontend (ux-design), Database (database-development), Security (security-audit)

**Referência:** Sempre consultar `CLAUDE.md` para padrões gerais do projeto.

---

## Clean Architecture

```
domain → interfaces → database → api
```

{"layers":[{"name":"domain","deps":"zero","content":"entities,enums,types"},{"name":"interfaces","deps":"domain","content":"service contracts"},{"name":"database","deps":"domain,interfaces","content":"repositories"},{"name":"api","deps":"all","content":"controllers,services,handlers"}]}

**Rules:** Lower layers NUNCA importam upper | Domain sem I/O | Interfaces=ports | Database=adapters

---

## RESTful Standards

{"methods":[{"m":"GET","use":"read","idem":true,"body":false,"res":"200"},{"m":"POST","use":"create","idem":false,"body":true,"res":"201"},{"m":"PUT","use":"full update","idem":true,"body":true,"res":"200"},{"m":"PATCH","use":"partial","idem":true,"body":true,"res":"200"},{"m":"DELETE","use":"remove","idem":true,"body":false,"res":"204"}]}

{"urlRules":{"do":["nouns:/users","plural:/accounts","nested:/accounts/:id/users","kebab:/user-roles","version:/api/v1"],"dont":["verbs:/getUsers","singular:/user","mixed:/userRoles"]}}

{"params":{"path":"resource id","query":"filter,pagination,sort,search"}}

{"statusCodes":{"200":"GET,PUT,PATCH ok","201":"POST created","204":"DELETE ok","400":"validation","401":"no auth","403":"no permission","404":"not found","409":"conflict"}}

---

## IoC / DI

**EVERY component MUST register in container.**

{"registration":[{"type":"Service","where":"providers in feature module"},{"type":"Repository","where":"providers+exports in db module"},{"type":"Guard","where":"providers in feature/global"},{"type":"Handler","where":"providers in feature module"},{"type":"Controller","where":"controllers array"}]}

{"checklist":["create with @Injectable","register in providers","import module in AppModule","export in index.ts if libs/"]}

{"errors":[{"err":"Can't resolve dependencies","fix":"add to providers"},{"err":"Can't resolve (cross-module)","fix":"add to exports"},{"err":"Controller 404","fix":"import module in AppModule"}]}

---

## Naming Conventions

{"files":{"controller":"kebab.controller.ts","service":"kebab.service.ts","repo":"PascalRepository.ts","interface":"IPascalRepository.ts","entity":"Pascal.ts","enum":"PascalCase.ts","dto":"PascalDto.ts","command":"PascalCommand.ts","handler":"PascalHandler.ts","event":"PascalEvent.ts"}}

{"rules":{"files":"kebab-case or PascalCase","classes":"PascalCase","interfaces":"I+PascalCase","dbColumns":"snake_case","variables":"camelCase","packages":"@add/[name]"}}

---

## DTOs

{"naming":[{"action":"create","pattern":"Create[Entity]Dto"},{"action":"update","pattern":"Update[Entity]Dto"},{"action":"patch","pattern":"Patch[Entity]Dto"},{"action":"response","pattern":"[Entity]ResponseDto"},{"action":"list","pattern":"[Entity]ListResponseDto"},{"action":"query","pattern":"[Entity]QueryDto"}]}

{"validation":["@IsNotEmpty()=required","@IsOptional()=optional","@IsEmail()","@IsEnum(E)","@IsUUID()","@MinLength(n)","@MaxLength(n)","@IsInt()","@Min(n)/@Max(n)"]}

---

## CQRS

{"commands":{"return":"void or ID (NEVER full objects)","naming":"[Action][Subject]Command","handler":"[Command]Handler"}}

{"events":{"naming":"[Subject][PastTense]Event (UserCreated)","handlers":"MUST be idempotent","export":"handlers NOT in index.ts"}}

{"rules":["write ops → Commands","read ops → direct Repository (no QueryHandlers)"]}

---

## Module Structure

```
modules/[feature]/
├── dtos/{Create,Update,[Feature]Response}Dto.ts
├── commands/{Create[Feature]Command.ts,handlers/}
├── events/{[Feature]CreatedEvent.ts,handlers/}
├── [feature].controller.ts
├── [feature].service.ts
└── [feature].module.ts
```

---

## Multi-Tenancy

{"rules":["ALWAYS filter by account_id","account_id from JWT (NEVER body)","Super Admin cross-tenant","NEVER trust client account_id"]}

---

## Config Access

**NEVER** `process.env` → **ALWAYS** `IConfigurationService`

---

## Imports

{"patterns":[{"type":"DTOs local","style":"./dtos"},{"type":"Entities/Enums","style":"@add/domain"},{"type":"Repositories","style":"@add/database"},{"type":"Shared services","style":"../../shared/services"}]}

---

## Exceptions

{"types":[{"ex":"BadRequestException","code":400,"use":"validation"},{"ex":"UnauthorizedException","code":401,"use":"no auth"},{"ex":"ForbiddenException","code":403,"use":"no permission"},{"ex":"NotFoundException","code":404,"use":"not found"},{"ex":"ConflictException","code":409,"use":"duplicate/business rule"}]}

---

## Validation Checklist

### RESTful Standards
- [ ] URLs use nouns, not verbs (no `/getUsers`, `/createOrder`)
  → Check: routes don't contain verbs (get, create, update, delete, fetch)
- [ ] Correct HTTP methods (GET=read, POST=create, PUT=full update, PATCH=partial, DELETE=remove)
  → Check: controller decorators match operation type
- [ ] Correct status codes (POST→201, DELETE→204, GET/PUT/PATCH→200)
  → Check: POST handlers have `@HttpCode(201)`, DELETE have `@HttpCode(204)`
- [ ] URL pattern follows `/api/v1/resource`
  → Check: controller `@Controller()` path uses versioned nouns

### Clean Architecture
- [ ] Layer dependencies respected (domain→interfaces→database→api)
  → Check: domain files have zero imports from upper layers
- [ ] Domain has zero I/O dependencies
  → Check: no database/http imports in domain layer
- [ ] Repositories return domain entities, not DTOs or raw rows
  → Check: repository methods return entity interfaces

### IoC/DI Registration
- [ ] Service/Handler/Repository decorated with `@Injectable()`
  → Check: `grep @Injectable` in every service/handler/repository file
- [ ] Component registered in module `providers` array
  → Check: module file lists component in providers
- [ ] Module imported in AppModule (if feature module)
  → Check: `app.module.ts` imports the feature module
- [ ] Barrel export added (if in libs/)
  → Check: `index.ts` exports the component

### DTOs
- [ ] Naming follows convention (Create/Update/Patch/Response + EntityDto)
  → Check: DTO class names match pattern
- [ ] Validation decorators on all fields (`@IsNotEmpty`, `@IsOptional`, etc.)
  → Check: every DTO field has at least one validation decorator
- [ ] Response DTOs exist for read operations
  → Check: GET endpoints return typed response DTOs

### CQRS
- [ ] Write operations use Commands (not direct service calls)
  → Check: POST/PUT/PATCH/DELETE use command bus
- [ ] Events emitted after state changes
  → Check: command handlers emit domain events
- [ ] Event handlers are idempotent
  → Check: handlers can be re-executed safely
- [ ] Event handlers NOT exported in index.ts
  → Check: barrel exports don't include event handlers

### Multi-Tenancy
- [ ] Every query filters by `account_id`
  → Check: repository methods receive and filter by accountId
- [ ] `account_id` extracted from JWT (never from request body)
  → Check: controller gets accountId from auth context, not body
- [ ] Client-provided account_id never trusted
  → Check: no `req.body.accountId` usage

### Config
- [ ] Uses `IConfigurationService`, never `process.env`
  → Check: no `process.env` in feature code
