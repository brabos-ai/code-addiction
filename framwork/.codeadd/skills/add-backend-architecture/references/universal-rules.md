# Universal Rules (Apply to All Patterns)

These rules hold regardless of which architecture you choose.

## 1. Feature Over Layer

Organize code by what it **does** (features, use cases), not by what it **is** (controllers, services, repositories).

Wrong: `controllers/`, `services/`, `repositories/` at the top level
Right: `features/users/`, `features/products/`, `modules/auth/`

## 2. Thin Endpoints

HTTP endpoints (routes, controllers) must remain thin:
- Receive request
- Validate input
- Delegate to handler/service
- Return response

Never put business logic, database access, or external provider calls in endpoints.

## 3. Business Logic Isolation

Business rules must not depend on:
- HTTP concepts (request, response, status codes, headers)
- Provider SDKs (OpenAI, Stripe, AWS, etc.)
- Framework internals (decorators, middleware specifics)
- Database query language (SQL, ORM-specific queries)

Business logic receives **data**, processes it, returns **data**.

## 4. External Provider Isolation

External providers (AI, payment, email, storage, messaging) should be behind an abstraction — but **calibrate the abstraction to your needs**:

- If you have one provider and it's unlikely to change: a thin wrapper function is fine
- If you might swap providers: define a contract/interface
- If you have multiple providers with fallback: full adapter pattern

The question is not "should I abstract?" but "how much abstraction does my actual situation need?"

## 5. Shared Folder Discipline

Shared/common folders are for true infrastructure:
- Database connection
- Logger
- Auth helpers
- Error types
- Common middleware

Shared must **never** contain business logic. If something feels "shared" but carries business meaning, it probably belongs in a feature with a contract that other features consume.

## 6. Cross-Feature Communication

Features should not reach into each other's internals.

At small scale: direct service calls are acceptable.
At medium scale: use explicit contracts (consumer defines the interface, provider implements it).
At large scale: consider events or message-based communication.

## 7. Testing Strategy

- **Unit tests**: test business logic (handlers, services, use cases) directly. Mock only external dependencies.
- **Integration tests**: test HTTP flow end-to-end. Don't overtest thin endpoints.
- **Contract tests**: when features communicate via contracts, test the contract implementation.

Test business rules in isolation. Test transport separately.
