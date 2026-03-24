# Combined Strategy (Vertical Slice + Clean Principles) — Reference Guide

## Core Principle

Use **Vertical Slice** for feature organization and **Clean Architecture principles** for external boundaries.

This gives:
- **Feature cohesion** — all use-case files stay together
- **Change locality** — modifications stay within the slice
- **Provider isolation** — external technology does not leak into business handlers
- **Controlled boundaries** — provider replacement is contained

---

## When to Use This

The combined strategy is the right choice when:
- Project has moderate-to-many features (5+)
- Some features integrate with external providers (AI, payment, email, storage)
- You want fast feature development without sacrificing boundary discipline
- Provider volatility exists but full Clean Architecture would be overkill

If **all** features are pure CRUD with no external integrations, plain Vertical Slice is simpler.
If **most** features have complex domain logic AND heavy external integrations, full Clean Architecture may serve better.

---

## Structure Overview

```
src/
  features/
    products/
      create-product/
        create-product.handler.ts
        create-product.http.ts
        create-product.schema.ts
        create-product.spec.ts
      generate-product-description/
        generate-product-description.handler.ts
        generate-product-description.http.ts
        product-description-generator.ts       (business contract)
        ai-product-description-generator.ts    (business-to-technical adapter)

    users/
      create-user/
        ...
      get-user-profile/
        ...
      contracts/
        user-lookup.ts                         (cross-feature contract)

  technical/
    ai/
      contracts/
        structured-text-client.ts
      adapters/
        vercel-structured-text-client.ts
        claude-structured-text-client.ts
        fallback-structured-text-client.ts
      policies/
        provider-fallback-policy.ts
      errors/
        ai-provider-error.ts

  shared/
    database.ts
    logger.ts
    errors.ts

  composition/
    register-dependencies.ts
```

---

## The Two Types of Contracts

### Business Contracts (inside features)

Express a **business capability** in business language. Defined by the feature that needs the capability.

```ts
// features/products/generate-product-description/product-description-generator.ts
export interface ProductDescriptionGenerator {
  generate(input: {
    title: string
    category: string
    attributes: string[]
  }): Promise<{ description: string }>
}
```

The handler depends on this:
```ts
class GenerateProductDescriptionHandler {
  constructor(private readonly generator: ProductDescriptionGenerator) {}

  async execute(input: Input) {
    const result = await this.generator.generate({
      title: input.title,
      category: input.category,
      attributes: input.attributes,
    })
    return { description: result.description }
  }
}
```

The handler knows **nothing** about AI SDKs, prompts, retries, or providers.

### Technical Contracts (inside technical modules)

Express a **technical capability** in technology language. Owned by the technical module.

```ts
// technical/ai/contracts/structured-text-client.ts
export interface StructuredTextClient {
  generateObject<T>(input: {
    systemPrompt: string
    userPrompt: string
    schemaName: string
  }): Promise<T>
}
```

### The Bridge — Business-to-Technical Adapter

Lives inside the feature. Translates business language to technical language.

```ts
// features/products/generate-product-description/ai-product-description-generator.ts
class AiProductDescriptionGenerator implements ProductDescriptionGenerator {
  constructor(private readonly client: StructuredTextClient) {}

  async generate(input: {
    title: string
    category: string
    attributes: string[]
  }): Promise<{ description: string }> {
    return this.client.generateObject<{ description: string }>({
      systemPrompt: 'You write concise and persuasive product descriptions.',
      userPrompt: `Product: ${input.title}, Category: ${input.category}, Attributes: ${input.attributes.join(', ')}`,
      schemaName: 'product-description',
    })
  }
}
```

The feature still speaks business language. The technical module speaks technology language. The adapter bridges them.

---

## Cross-Feature Contracts

Same rules as pure Vertical Slice:

- **Consumer owns the contract** — the feature that needs a capability defines the interface
- Features never call each other's handlers directly
- Contracts are small and focused

```ts
// features/products/contracts/user-lookup.ts (Products needs this from Users)
export interface UserLookup {
  existsById(userId: string): Promise<boolean>
}

// features/users/contracts/user-products-reader.ts (Users needs this from Products)
export interface UserProductsReader {
  listByUserId(userId: string): Promise<UserProductSummary[]>
}
```

---

## Technical Module Structure

A technical module manages one infrastructure concern. It owns the provider SDKs and all related complexity.

### What belongs in a technical module

- Provider-specific adapter implementations
- Technical contracts (reusable across features)
- Retry logic, fallback policies
- Observability and telemetry
- Token/cost accounting
- Provider-specific error handling

### What does NOT belong in a technical module

- Business logic
- Business contracts (those belong in features)
- Feature-specific prompts or templates (those belong in the business-to-technical adapter inside the feature)

### Example: Multiple AI Providers with Fallback

```ts
// technical/ai/adapters/fallback-structured-text-client.ts
class FallbackStructuredTextClient implements StructuredTextClient {
  constructor(
    private readonly primary: StructuredTextClient,
    private readonly secondary: StructuredTextClient,
  ) {}

  async generateObject<T>(input): Promise<T> {
    try {
      return await this.primary.generateObject<T>(input)
    } catch {
      return await this.secondary.generateObject<T>(input)
    }
  }
}
```

For complex fallback rules, isolate in a policy:

```ts
// technical/ai/policies/provider-fallback-policy.ts
class ProviderFallbackPolicy {
  shouldFallback(error: unknown): boolean {
    // retry primary once before fallback
    // fallback only on timeout and 5xx
    // never fallback on validation errors
  }
}
```

Business slices must **not** know:
- Which provider is primary or secondary
- Fallback or retry rules
- Cost-routing logic
- Provider-specific exceptions

---

## Composition Root

The only place that knows about concrete implementations. Wires everything together.

```ts
// composition/register-dependencies.ts
import { GenerateProductDescriptionHandler } from '../features/products/generate-product-description/generate-product-description.handler'
import { AiProductDescriptionGenerator } from '../features/products/generate-product-description/ai-product-description-generator'
import { VercelStructuredTextClient } from '../technical/ai/adapters/vercel-structured-text-client'
import { ClaudeStructuredTextClient } from '../technical/ai/adapters/claude-structured-text-client'
import { FallbackStructuredTextClient } from '../technical/ai/adapters/fallback-structured-text-client'

export function buildGenerateProductDescriptionHandler() {
  const primary = new VercelStructuredTextClient()
  const secondary = new ClaudeStructuredTextClient()
  const client = new FallbackStructuredTextClient(primary, secondary)
  const generator = new AiProductDescriptionGenerator(client)
  return new GenerateProductDescriptionHandler(generator)
}
```

---

## Naming: `technical/` vs `infrastructure/`

Both names work. Choose based on your project's convention:

- **`technical/`** — explicit separation between business slices and technical capabilities
- **`infrastructure/`** — common in projects already using Clean Architecture naming

The folder name is not the important rule. The important rule is:

> Provider SDKs, fallback logic, retries, telemetry, routing, and technical policies must stay outside the business slice.

---

## Decision Guide: When to Apply Clean Principles Within a Slice

Not every slice needs the full contract-adapter pattern. Use it proportionally:

| Slice characteristic | Approach |
|---------------------|----------|
| Pure CRUD, no external providers | Simple handler + repository. No contracts needed. |
| Uses one stable external provider | Thin wrapper function or class. Interface optional. |
| Uses external provider that might change | Define business contract + adapter. |
| Uses multiple providers with fallback | Full contract + technical module + adapter pattern. |
| Cross-feature dependency | Consumer-defined contract. |

The goal is not uniform architecture across all slices. The goal is **appropriate structure for each slice's actual complexity**.

---

## Testing

- **Handlers**: test directly, mock contracts
- **Business-to-technical adapters**: test translation logic
- **Technical adapters**: integration test against real/sandbox providers
- **HTTP endpoints**: thin integration tests, don't duplicate business logic testing
- **Composition**: verify wiring works (smoke test)

---

## Anti-Patterns in Combined Strategy

- **Contract for everything**: not every handler needs a contract. If it just reads from the database, a direct repository call is fine.
- **Technical module doing business logic**: if the technical module starts making business decisions (which product descriptions to generate, which users get AI features), business logic has leaked.
- **Adapter doing too much**: if the business-to-technical adapter is 200 lines of complex logic, it's probably doing business work that belongs in the handler.
- **Composition root doing orchestration**: the composition root wires, it doesn't orchestrate. If it contains `if/else` logic, something is wrong.
- **Every slice mirroring the same structure**: slices should be as complex as they need to be, not more. A simple CRUD slice with 4 files is fine next to a complex AI-integrated slice with 8 files.
