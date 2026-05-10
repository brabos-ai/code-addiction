---
name: add-backend-architecture
description: Guides backend architecture decisions — over-engineering, folder structure, slices, layers, feature organization, where code goes.
---

# Backend Architecture Consultant

Guide architectural decisions for backend projects. Language and framework agnostic. Choose between Vertical Slice, Clean Architecture, Simple Modular, or a Combined strategy based on project context.

**Use for:** Choosing architecture patterns, organizing features, structuring folders, deciding boundaries, avoiding over-engineering.

## When NOT to Use

- **Code implementation** — use `add-backend-development` instead
- **Project scaffolding / file generation** — use `add-project-scaffolding` instead
- **Discovering existing architecture** — use `add-architecture-discovery` instead
- **Frontend structure decisions** — use `add-frontend-architecture` instead

---

## Core Philosophy

The right architecture is the **simplest one that handles your actual complexity**.

Most projects fail not from too little architecture, but from too much too early. A 3-endpoint CRUD API does not need hexagonal architecture. A complex multi-provider AI platform does not survive with flat files.

The goal: **match structural investment to actual complexity**.

---

## Decision Navigator

Before recommending any pattern, assess context, match to the Decision Matrix, load the relevant reference file, apply to the user's specific case, and watch for drift during implementation. Always explain the **why** behind the recommendation.

### Context Questions

1. **Scale** — features/use cases: Small (1-5) / Medium (5-20) / Large (20+)
2. **External integrations** — None/few / Moderate (2-4) / Heavy (5+, multi-provider)
3. **Provider volatility** — Stable / Moderate / High (multi-provider, A/B testing)
4. **Team size** — Solo (1-3) / Medium (4-8) / Large (8+)
5. **Domain complexity** — Simple CRUD / Moderate rules / Complex domain (rich invariants, events)

### Decision Matrix

| Context | Architecture | Why |
|---------|-------------|-----|
| Small scale, few integrations, simple domain | **Simple Modular** | Anything more is waste |
| Medium scale, feature-focused growth, moderate integrations | **Vertical Slice** | Feature cohesion, low coupling, fast delivery |
| Complex domain, heavy integrations, high provider volatility | **Clean Architecture** | Strong isolation, testability, provider independence |
| Medium-large scale, moderate integrations with some volatility | **Combined (VSA + Clean)** | VSA for features, Clean principles for external boundaries |

### Over-Engineering Signals — stop and simplify if:

- [ ] More abstraction layers than business rules
- [ ] Interfaces with only one implementation and no plan for more
- [ ] A "shared" folder bigger than feature folders
- [ ] Adapter/port/contract files for a single database call
- [ ] Separate projects/packages for a 3-endpoint API

### Under-Engineering Signals — add structure if:

- [ ] Provider SDKs imported directly in business logic
- [ ] Feature A reaching into Feature B's internals
- [ ] One "services" folder with 30 files
- [ ] Business rules scattered across controllers/routes
- [ ] No way to test business logic without spinning up the full server

---

## Architecture Patterns

Each pattern has detailed guidance in a reference file. Read **only** the one that fits the project context.

### Simple Modular

For small projects where Vertical Slice or Clean Architecture would be overkill. Organize by feature/module, not by technical layer. No separate reference file — guidance below is complete.

```
src/modules/{feature}/{feature}.{routes,service,repository}.ts
src/shared/{database,errors}.ts
```

Rules:
- Each module contains its routes, service, and data access
- Shared folder only for true cross-cutting concerns (DB connection, logger, error types)
- Services can call other services directly (at this scale, lateral coupling is manageable)
- No contracts/interfaces needed unless you have multiple implementations

Graduate when "services calling services" creates confusion, or when external integrations appear that you might want to swap.

### Vertical Slice Architecture

For medium projects focused on feature delivery and isolation. Organize by **use case**, not by layer — each slice owns everything it needs.

**Read:** `references/vertical-slice.md` for complete guidance.

```
src/features/{domain}/{use-case}/{use-case}.{handler,http,schema,spec}.ts
src/shared/{database,logger}.ts
```

### Clean Architecture

For projects with complex domains, heavy external integrations, or high provider volatility. Dependencies point **inward**: domain knows nothing about infrastructure.

**Read:** `references/clean-architecture.md` for complete guidance.

```
src/domain/{entities,value-objects,errors}/
src/application/{use-cases,ports}/
src/infrastructure/{adapters,persistence,providers}/  src/presentation/{http,middleware}/
```

### Combined Strategy (VSA + Clean)

For medium-to-large projects that need feature cohesion AND external boundary isolation. Vertical Slice for **feature organization**, Clean principles for **external boundaries**.

**Read:** `references/combined-strategy.md` for complete guidance.

```
src/features/{domain}/{use-case}/  (handler + http + business contracts + adapters)
src/technical/{ai,payments,…}/{contracts,adapters}/
src/composition/register-dependencies.ts
```

---

## Universal Rules

Seven rules apply across all patterns (feature-over-layer, thin endpoints, business logic isolation, external provider isolation, shared folder discipline, cross-feature communication, testing strategy).

**Read:** `references/universal-rules.md` for the full list.
