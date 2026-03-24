---
name: add-backend-architecture
description: |
  Backend architecture consultant — guides structural decisions for new projects, features, or refactors. Helps choose between Vertical Slice, Clean Architecture, or a combined strategy based on project context. Use this skill whenever the user asks about project structure, folder organization, architecture patterns, how to organize features, or when starting a new backend project. Also use when the user is unsure whether their project needs more or less architectural structure, or when they mention "over-engineering", "folder structure", "feature organization", "slices", "layers", or "where should this code go". This skill guides decisions — it does not scaffold code (use add-project-scaffolding for that) and does not implement features (use add-backend-development for that).
---

# Backend Architecture Consultant

Guide architectural decisions for backend projects. Language and framework agnostic.

**Use for:** Choosing architecture patterns, organizing features, structuring folders, deciding boundaries, avoiding over-engineering
**Not for:** Code implementation (add-backend-development), project scaffolding (add-project-scaffolding), discovering existing architecture (add-architecture-discovery)

---

## Core Philosophy

The right architecture is the **simplest one that handles your actual complexity**.

Most projects fail not from too little architecture, but from too much too early. A 3-endpoint CRUD API does not need hexagonal architecture. A complex multi-provider AI platform does not survive with flat files.

The goal: **match structural investment to actual complexity**.

---

## Decision Navigator

Before recommending any pattern, understand the project context. Ask or infer:

### Context Questions

1. **Scale** — How many features/use cases will this project have?
   - Small (1-5 features, single domain)
   - Medium (5-20 features, 2-4 domains)
   - Large (20+ features, multiple bounded contexts)

2. **External integrations** — How many external providers does the project depend on?
   - None/few (database only, maybe one email provider)
   - Moderate (2-4 external services)
   - Heavy (5+ providers, multi-provider strategies, fallback logic)

3. **Provider volatility** — How likely are providers to change?
   - Stable (unlikely to switch DB or main services)
   - Moderate (might switch one or two providers)
   - High (multi-provider, A/B testing providers, strategic switching)

4. **Team size** — How many developers will work on this?
   - Solo or small team (1-3)
   - Medium team (4-8)
   - Large team (8+)

5. **Domain complexity** — How complex is the business logic?
   - Simple CRUD (data in, data out, minimal rules)
   - Moderate business rules (validations, workflows, state machines)
   - Complex domain (rich business logic, many invariants, domain events)

### Decision Matrix

| Context | Architecture | Why |
|---------|-------------|-----|
| Small scale, few integrations, simple domain | **Simple Modular** | Anything more is waste |
| Medium scale, feature-focused growth, moderate integrations | **Vertical Slice** | Feature cohesion, low coupling, fast delivery |
| Complex domain, heavy integrations, high provider volatility | **Clean Architecture** | Strong isolation, testability, provider independence |
| Medium-large scale, moderate integrations with some volatility | **Combined (VSA + Clean)** | VSA for features, Clean principles for external boundaries |

### Over-Engineering Signals

Stop and simplify if you see:

- More abstraction layers than business rules
- Interfaces with only one implementation and no plan for more
- A "shared" folder bigger than feature folders
- Adapter/port/contract files for a single database call
- Separate projects/packages for a 3-endpoint API

### Under-Engineering Signals

Add structure if you see:

- Provider SDKs imported directly in business logic
- Feature A reaching into Feature B's internals
- One "services" folder with 30 files
- Business rules scattered across controllers/routes
- No way to test business logic without spinning up the full server

---

## Architecture Patterns

Each pattern has detailed guidance in a reference file. Read **only** the one that fits the project context.

### Simple Modular

For small projects where Vertical Slice or Clean Architecture would be overkill.

```
src/
  modules/
    users/
      users.routes.ts
      users.service.ts
      users.repository.ts
    products/
      products.routes.ts
      products.service.ts
  shared/
    database.ts
    errors.ts
  app.ts
```

Rules:
- Organize by feature/module, not by technical layer
- Each module contains its routes, service, and data access
- Shared folder only for true cross-cutting concerns (DB connection, logger, error types)
- Services can call other services directly (at this scale, lateral coupling is manageable)
- No contracts/interfaces needed unless you have multiple implementations

When to graduate: when you notice features growing complex enough that "services calling services" creates confusion, or when you add external integrations that you might want to swap.

### Vertical Slice Architecture

For medium projects focused on feature delivery and isolation.

**Read:** `references/vertical-slice.md` for complete guidance.

Key idea: organize by **use case**, not by layer. Each slice owns everything it needs.

```
src/
  features/
    products/
      create-product/
        create-product.handler.ts
        create-product.http.ts
        create-product.schema.ts
        create-product.spec.ts
    users/
      get-user-profile/
        ...
  shared/
    database.ts
    logger.ts
```

### Clean Architecture

For projects with complex domains, heavy external integrations, or high provider volatility.

**Read:** `references/clean-architecture.md` for complete guidance.

Key idea: dependencies point **inward**. Domain knows nothing about infrastructure.

```
src/
  domain/
    entities/
    value-objects/
    errors/
  application/
    use-cases/
    ports/
  infrastructure/
    adapters/
    persistence/
    providers/
  presentation/
    http/
    middleware/
```

### Combined Strategy (VSA + Clean)

For medium-to-large projects that need feature cohesion AND external boundary isolation.

**Read:** `references/combined-strategy.md` for complete guidance.

Key idea: use Vertical Slice for **feature organization** and Clean principles for **external boundaries**.

```
src/
  features/
    products/
      create-product/
        create-product.handler.ts
        create-product.http.ts
        product-description-generator.ts      (business contract)
        ai-product-description-generator.ts   (adapter)
  technical/
    ai/
      contracts/
      adapters/
  composition/
    register-dependencies.ts
```

---

## Universal Rules (Apply to All Patterns)

These rules hold regardless of which architecture you choose.

### 1. Feature Over Layer

Organize code by what it **does** (features, use cases), not by what it **is** (controllers, services, repositories).

Wrong: `controllers/`, `services/`, `repositories/` at the top level
Right: `features/users/`, `features/products/`, `modules/auth/`

### 2. Thin Endpoints

HTTP endpoints (routes, controllers) must remain thin:
- Receive request
- Validate input
- Delegate to handler/service
- Return response

Never put business logic, database access, or external provider calls in endpoints.

### 3. Business Logic Isolation

Business rules must not depend on:
- HTTP concepts (request, response, status codes, headers)
- Provider SDKs (OpenAI, Stripe, AWS, etc.)
- Framework internals (decorators, middleware specifics)
- Database query language (SQL, ORM-specific queries)

Business logic receives **data**, processes it, returns **data**.

### 4. External Provider Isolation

External providers (AI, payment, email, storage, messaging) should be behind an abstraction — but **calibrate the abstraction to your needs**:

- If you have one provider and it's unlikely to change: a thin wrapper function is fine
- If you might swap providers: define a contract/interface
- If you have multiple providers with fallback: full adapter pattern

The question is not "should I abstract?" but "how much abstraction does my actual situation need?"

### 5. Shared Folder Discipline

Shared/common folders are for true infrastructure:
- Database connection
- Logger
- Auth helpers
- Error types
- Common middleware

Shared must **never** contain business logic. If something feels "shared" but carries business meaning, it probably belongs in a feature with a contract that other features consume.

### 6. Cross-Feature Communication

Features should not reach into each other's internals.

At small scale: direct service calls are acceptable.
At medium scale: use explicit contracts (consumer defines the interface, provider implements it).
At large scale: consider events or message-based communication.

### 7. Testing Strategy

- **Unit tests**: test business logic (handlers, services, use cases) directly. Mock only external dependencies.
- **Integration tests**: test HTTP flow end-to-end. Don't overtest thin endpoints.
- **Contract tests**: when features communicate via contracts, test the contract implementation.

Test business rules in isolation. Test transport separately.

---

## Guidance Workflow

When a user asks for architecture guidance:

1. **Assess context** — Use the Decision Navigator questions (or infer from what you know about the project)
2. **Recommend pattern** — Match to the Decision Matrix. Explain **why** this pattern fits and why alternatives would be over/under-engineering
3. **Load reference** — Read the relevant reference file for detailed guidance
4. **Apply to their specific case** — Map the pattern to their domain, naming conventions, and tech stack
5. **Watch for drift** — If during implementation the architecture starts feeling wrong (too much boilerplate, too little structure), revisit the decision

Always explain the **why** behind recommendations. "Use Vertical Slice because your project has 12 features, moderate complexity, and few external integrations — Clean Architecture would add layers you don't need yet" is better than "Use Vertical Slice."
