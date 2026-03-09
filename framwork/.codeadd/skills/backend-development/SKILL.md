---
name: backend-development
description: |
  Backend architecture: SOLID, Clean Architecture, DTOs, Services, Repository Pattern, RESTful standards — stack-agnostic. Consult stack-context.md for framework. Use when implementing backend features.
---

# Backend Development

Skill for backend API implementation following universal architectural principles.

**Use for:** Routes/Controllers, Services, DTOs, Domain logic, Data access, Error handling
**Not for:** Frontend (ux-design), Database migrations (database-development), Security (security-audit)

**Stack resolution:** Consult `.codeadd/project/stack-context.md` for the framework in use (Express, Fastify, NestJS, Hono, Elysia, etc.). Apply these principles using the framework's idiomatic patterns. The AI already knows each framework's syntax — this skill teaches architecture, not framework tutorials.

**Reference:** Always consult `CLAUDE.md` for general project standards.

---

## Clean Architecture

```
domain → application → infrastructure → presentation
```

{"layers":[{"name":"domain","deps":"zero","content":"entities,value objects,enums,types,domain errors"},{"name":"application","deps":"domain only","content":"service interfaces,use cases,DTOs"},{"name":"infrastructure","deps":"domain,application","content":"repository implementations,external services,config"},{"name":"presentation","deps":"all","content":"routes/controllers,middleware,error mapping"}]}

**Rules:**
- Lower layers NEVER import from upper layers
- Domain has ZERO I/O, ZERO framework dependencies — pure business logic
- Application layer defines interfaces (ports) — infrastructure implements them (adapters)
- Presentation layer is the only place aware of HTTP

---

## SOLID Principles

{"solid":[{"p":"SRP","rule":"Each class/module has one reason to change. Services don't handle HTTP. Repositories don't validate."},{"p":"OCP","rule":"Extend behavior via new implementations, not modifying existing code. Strategy/plugin patterns."},{"p":"LSP","rule":"Implementations must be substitutable for their interfaces without breaking behavior."},{"p":"ISP","rule":"Prefer small, focused interfaces. Don't force consumers to depend on methods they don't use."},{"p":"DIP","rule":"Services depend on interfaces, not implementations. Inject abstractions, never concrete classes."}]}

---

## RESTful Standards

{"methods":[{"m":"GET","use":"read","idem":true,"body":false,"res":"200"},{"m":"POST","use":"create","idem":false,"body":true,"res":"201"},{"m":"PUT","use":"full update","idem":true,"body":true,"res":"200"},{"m":"PATCH","use":"partial","idem":true,"body":true,"res":"200"},{"m":"DELETE","use":"remove","idem":true,"body":false,"res":"204"}]}

{"urlRules":{"do":["nouns:/users","plural:/accounts","nested:/accounts/:id/users","kebab:/user-roles","version:/api/v1"],"dont":["verbs:/getUsers","singular:/user","mixed:/userRoles"]}}

{"params":{"path":"resource id","query":"filter,pagination,sort,search"}}

{"statusCodes":{"200":"GET,PUT,PATCH ok","201":"POST created","204":"DELETE ok","400":"validation","401":"no auth","403":"no permission","404":"not found","409":"conflict"}}

---

## Dependency Injection / IoC

**EVERY service, repository, and handler MUST be registered in the framework's DI container.**

{"principles":["Services receive dependencies via constructor injection","Depend on interfaces/abstractions, never concrete implementations","Register all components in the framework's container/module system","Cross-module dependencies must be explicitly exported/shared"]}

{"checklist":["Component created with proper DI registration for the framework","Registered in the DI container/module","Imported/available where consumed","Exported if shared across modules"]}

**Common DI errors:** Unresolved dependency = not registered. Cross-module failure = not exported. Route 404 = module not loaded. Consult framework docs for idiomatic registration.

---

## Naming Conventions

{"files":{"controller/route":"kebab.controller.ts or kebab.routes.ts","service":"kebab.service.ts","repository":"PascalRepository.ts","interface":"IPascalRepository.ts","entity":"Pascal.ts","enum":"PascalCase.ts","dto":"PascalDto.ts"}}

{"rules":{"files":"kebab-case or PascalCase (follow project convention)","classes":"PascalCase","interfaces":"I+PascalCase","dbColumns":"snake_case","variables":"camelCase"}}

**Paths and aliases:** Follow the project's existing import aliases and directory structure. Do not invent new aliases — check `tsconfig.json` paths and existing code.

---

## DTOs

{"naming":[{"action":"create","pattern":"Create[Entity]Dto"},{"action":"update","pattern":"Update[Entity]Dto"},{"action":"patch","pattern":"Patch[Entity]Dto"},{"action":"response","pattern":"[Entity]ResponseDto"},{"action":"list","pattern":"[Entity]ListResponseDto"},{"action":"query","pattern":"[Entity]QueryDto"}]}

**Rules:**
- Input DTOs (create/update/patch) are SEPARATE from response DTOs
- Validation happens at the presentation layer entry point, NEVER in domain
- Use the project's validation library (class-validator, zod, typebox, valibot, joi, etc.)
- Every input field must have validation rules defined
- Response DTOs control what leaves the API — never expose raw entities

---

## Services

{"rules":["Business logic lives here — NO HTTP concepts (no req/res, no status codes, no headers)","Receives pure data (DTOs or primitives), returns pure data (entities or response DTOs)","Depends on repository interfaces, not implementations","Orchestrates domain logic — does not contain persistence logic","One service per bounded context / feature area"]}

---

## Repository Pattern

{"rules":["Interface defined in application/domain layer","Implementation in infrastructure layer","Services depend on the interface, never the implementation","Returns domain entities, not raw rows or ORM-specific objects","All data access goes through repositories — no direct DB calls in services"]}

---

## CQRS (When Applicable)

**IMPORTANT:** Only apply CQRS if the project already uses it. If the project uses simple service calls, follow that pattern. Do NOT impose CQRS on projects that don't use it.

{"commands":{"return":"void or ID (NEVER full objects)","naming":"[Action][Subject]Command","handler":"[Command]Handler"}}

{"events":{"naming":"[Subject][PastTense]Event (UserCreated)","handlers":"MUST be idempotent"}}

{"rules":["Write operations → Commands","Read operations → direct service/repository calls","Event handlers can be re-executed safely (idempotent)"]}

---

## Error Handling

{"layers":{"domain":"Throw domain-specific errors (NotFoundError, BusinessRuleViolationError, ConflictError). No HTTP concepts.","application":"Let domain errors propagate. Add application-level errors if needed (ValidationError).","presentation":"Map domain/application errors to HTTP status codes. This is the ONLY layer that knows about HTTP."}}

{"mapping":[{"domain":"NotFoundError","http":404},{"domain":"ValidationError","http":400},{"domain":"UnauthorizedError","http":401},{"domain":"ForbiddenError","http":403},{"domain":"ConflictError","http":409},{"domain":"BusinessRuleViolationError","http":422}]}

**Rule:** Services throw domain errors. The presentation layer (middleware, error handler, or framework mechanism) maps them to HTTP responses. Never import HTTP concepts into services.

---

## Module / Feature Structure

Organize code by domain/feature, not by technical role. Each feature module contains its own controllers, services, DTOs, and domain logic.

```
[feature]/
├── dtos/
│   ├── Create[Feature]Dto.ts
│   ├── Update[Feature]Dto.ts
│   └── [Feature]ResponseDto.ts
├── [feature].controller.ts (or routes.ts)
├── [feature].service.ts
└── [feature].module.ts (or index.ts)
```

**DDD-lite principles:**
- Entities encapsulate behavior (methods, not just data bags)
- Value objects for concepts with no identity (Money, Email, DateRange)
- Organize by bounded context, not by technical layer
- Keep domain logic in entities/services, not in controllers or repositories

---

## Multi-Tenancy

{"rules":["ALWAYS filter by tenant identifier (e.g., account_id) at repository level","Tenant ID extracted from auth context (JWT/session), NEVER from request body","Super Admin may access cross-tenant data — explicitly guard this","NEVER trust client-provided tenant ID"]}

---

## Configuration

**NEVER** access env vars directly in services (`process.env`, `Bun.env`, etc.)
**ALWAYS** use a centralized, typed configuration service/module.

{"rules":["Define a configuration interface with typed properties","Load and validate config at startup","Inject config service into consumers","Fail fast on missing required config"]}

---

## KISS and YAGNI

- Don't add abstraction layers you don't need yet
- Don't implement patterns the project doesn't use
- Prefer simple, readable code over clever code
- Add complexity only when requirements demand it
- Follow existing project patterns — consistency over personal preference

---

## Validation Checklist

### RESTful Standards
- [ ] URLs use nouns, not verbs (no `/getUsers`, `/createOrder`)
  -> Check: routes don't contain verbs (get, create, update, delete, fetch)
- [ ] Correct HTTP methods (GET=read, POST=create, PUT=full update, PATCH=partial, DELETE=remove)
  -> Check: route definitions match operation type
- [ ] Correct status codes (POST->201, DELETE->204, GET/PUT/PATCH->200)
  -> Check: response status codes match the method table above
- [ ] URL pattern follows `/api/v1/resource`
  -> Check: route paths use versioned plural nouns

### Clean Architecture
- [ ] Layer dependencies respected (domain->application->infrastructure->presentation)
  -> Check: domain files have zero imports from upper layers
- [ ] Domain has zero I/O or framework dependencies
  -> Check: no database/http/framework imports in domain layer
- [ ] Repositories return domain entities, not DTOs or raw rows
  -> Check: repository methods return entity types

### Dependency Injection
- [ ] All services/repositories/handlers registered in DI container
  -> Check: every component is registered per framework convention
- [ ] Dependencies injected via constructor, not instantiated directly
  -> Check: no `new ConcreteService()` in business logic
- [ ] Services depend on interfaces, not concrete implementations
  -> Check: constructor parameters reference abstractions

### DTOs
- [ ] Naming follows convention (Create/Update/Patch/Response + EntityDto)
  -> Check: DTO class names match pattern
- [ ] Validation rules on all input DTO fields
  -> Check: every input field has validation defined
- [ ] Response DTOs exist for read operations
  -> Check: GET endpoints return typed response DTOs, not raw entities

### Error Handling
- [ ] Services throw domain errors, not HTTP exceptions
  -> Check: no HTTP status codes or framework exception classes in service layer
- [ ] Presentation layer maps domain errors to HTTP responses
  -> Check: error mapping exists in controller/middleware/error handler
- [ ] Domain errors are descriptive and typed
  -> Check: custom error classes with meaningful names

### Multi-Tenancy
- [ ] Every query filters by tenant identifier
  -> Check: repository methods receive and filter by tenant ID
- [ ] Tenant ID extracted from auth context, never from request body
  -> Check: controller gets tenant ID from auth middleware/context
- [ ] Client-provided tenant ID never trusted
  -> Check: no `req.body.tenantId` usage for authorization

### Configuration
- [ ] Uses centralized config service, never direct env var access
  -> Check: no `process.env` / `Bun.env` in feature code
