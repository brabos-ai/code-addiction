# Vertical Slice Architecture — Reference Guide

## Core Principle

Organize code by **use case / feature**, not by technical layer. What changes together stays together.

A slice contains everything required for a single business capability.

---

## Slice Composition

A healthy slice:

```
create-product/
  create-product.handler.ts
  create-product.http.ts
  create-product.schema.ts
  create-product.spec.ts
```

Optional files per slice: DTO, mapper, validator, contract, local adapter.

A slice must remain cohesive. A slice must **not** become a mini layered architecture internally.

---

## Handler Rule

The handler is the center of the slice. It owns:
- Business orchestration
- Local decision flow
- Dependency coordination

The handler must **not** contain infrastructure details.

```
// Correct — depends on business capability
class CreateProductHandler {
  constructor(private readonly userLookup: UserLookup) {}
}

// Wrong — depends on infrastructure SDK
class CreateProductHandler {
  constructor(private readonly openaiSdk: OpenAIClient) {}
}
```

---

## Endpoint Rule

Endpoints must remain thin:
- Receive request
- Validate input
- Call handler
- Convert result to response

Endpoints must **never** contain business orchestration, repository access, external provider calls, or domain decisions.

---

## Cross-Feature Dependencies

A feature must **never** directly call another feature's handler. This creates lateral coupling.

### Wrong

```
CreateProductHandler -> GetUserByIdHandler
```

### Correct — Use an explicit contract

```ts
// Defined in: products/contracts/user-lookup.ts
export interface UserLookup {
  existsById(userId: string): Promise<boolean>
}
```

Then inject that contract into the handler.

### Consumer Owns the Contract

The feature that **needs** the capability defines the interface.

- Products needs user existence → `products/contracts/user-lookup.ts`
- Users needs product list → `users/contracts/user-products-reader.ts`

Rule: **Consumer defines the port. Provider implements the port.**

---

## Cross-Feature Dependency Examples

### Products checking user existence

Contract inside Products:
```ts
export interface UserLookup {
  existsById(userId: string): Promise<boolean>
}
```

Handler:
```ts
class CreateProductHandler {
  constructor(private readonly userLookup: UserLookup) {}

  async execute(input) {
    const exists = await this.userLookup.existsById(input.ownerId)
    if (!exists) throw new Error('Owner not found')
  }
}
```

Products depends only on the capability it needs. Products does **not** depend on Users' internal use cases.

### Users listing their products

Contract inside Users:
```ts
export interface UserProductsReader {
  listByUserId(userId: string): Promise<UserProductSummary[]>
}
```

Even though products are owned by the Products domain, the contract belongs to Users because Users consumes that capability.

---

## Shared Folder Rule

Shared is allowed only for true shared infrastructure:
- logger, database connection, auth helpers, error types, common contracts, low-level infra utilities

Dangerous shared:
- shared/services, shared/domain, business rules in shared

**Shared must never become a hidden business layer.**

---

## External Integration Rule

External providers must not leak into slices.

```
// Wrong
handler -> Vercel AI SDK directly

// Correct
handler -> business contract -> adapter -> provider
```

This applies to: AI SDKs, payment gateways, email providers, storage providers, message brokers.

---

## AI Integration Pattern

AI must be treated as infrastructure. The business feature defines the business contract.

```ts
// Inside Users feature — speaks business language
export interface UserBioGenerator {
  generateForOnboarding(data: UserData): Promise<string>
}
```

The implementation uses AI, but the feature doesn't know or care about that.

### AI Module Pattern

A technical AI module is allowed for cross-cutting AI capabilities:

```
features/
  ai/
    contracts/
      structured-text-client.ts
    adapters/
      vercel-structured-text-client.ts
```

This module owns: provider SDKs, retries, fallback, observability, token accounting, provider switching.

### Contract Separation

- **Business contract** stays in consumer feature: `users/contracts/user-bio-generator.ts`
- **Technical contract** stays in AI module: `ai/contracts/structured-text-client.ts`

Business language belongs to business feature. Technical language belongs to technical module.

---

## Testing

- **Unit tests**: test handlers directly, mock only dependencies
- **Integration tests**: test HTTP flow, never overtest thin endpoints
- Test business in handlers. Test transport in integration.

---

## Anti-Patterns

Avoid:
- Handler calling handler (lateral coupling)
- Feature importing another feature's internals
- Generic "AI service" for everything
- Giant shared folder
- Feature leaking provider SDK
- Technical abstraction without business meaning

---

## Architectural Decision Checklist

When in doubt:

1. **Do I need data or business logic?** → Data: use read contract. Business logic: maybe the boundary is wrong.
2. **Is this truly shared?** → If not, keep it local to the feature.
3. **Is this technical or business?** → Technical belongs to infra/technical module. Business belongs to consumer feature.

---

## Success Criteria

Vertical Slice succeeds when:
- Features remain autonomous
- Dependencies remain intentional
- Contracts remain small
- Infrastructure stays outside business language

It fails when slices start behaving like hidden services calling each other.
