# Clean Architecture — Reference Guide

## Core Principle

Dependencies point **inward**. Inner layers define contracts. Outer layers implement them.

The domain must survive the replacement of any external technology — database, framework, provider, transport protocol.

```
[Domain] ← [Application] ← [Infrastructure] ← [Presentation]
```

Each layer only knows about layers to its left (inward). Never the other way.

---

## Layer Responsibilities

### Domain (innermost)

The heart of the system. Pure business logic with **zero dependencies** on anything external.

Contains:
- **Entities** — objects with identity and business behavior (not just data bags)
- **Value Objects** — objects defined by their attributes, no identity (Money, Email, DateRange)
- **Domain Errors** — typed business exceptions (InsufficientFundsError, InvalidEmailError)
- **Domain Events** — facts about things that happened (OrderPlaced, UserRegistered)
- **Enums and Constants** — business-meaningful enumerations

Rules:
- No imports from any other layer
- No I/O (no database, no HTTP, no file system, no logging)
- No framework dependencies (no decorators, no DI annotations unless truly non-invasive)
- Entities encapsulate behavior — they are not DTOs

```ts
// Good — entity with behavior
class Order {
  private items: OrderItem[] = []

  addItem(product: Product, quantity: number): void {
    if (quantity <= 0) throw new InvalidQuantityError()
    if (this.status !== OrderStatus.DRAFT) throw new OrderNotEditableError()
    this.items.push(new OrderItem(product, quantity))
  }

  get total(): Money {
    return this.items.reduce((sum, item) => sum.add(item.subtotal), Money.zero())
  }
}

// Bad — anemic entity (just a data bag)
class Order {
  id: string
  items: OrderItem[]
  status: string
  total: number
}
```

### Application

Orchestrates use cases by coordinating domain objects and defining **ports** (interfaces) for external needs.

Contains:
- **Use Cases / Application Services** — one class per use case, orchestrates the flow
- **Ports (interfaces)** — contracts for what the application needs from the outside world
- **Input/Output DTOs** — data structures for crossing the application boundary
- **Application Errors** — errors specific to use case orchestration (ResourceNotFoundError, ValidationError)

Rules:
- Depends only on Domain
- Defines ports — never implements them
- Each use case has a single `execute` method
- Receives DTOs, works with domain entities internally, returns DTOs

```ts
// Port — defined in Application, implemented in Infrastructure
export interface OrderRepository {
  findById(id: string): Promise<Order | null>
  save(order: Order): Promise<void>
}

export interface PaymentGateway {
  charge(amount: Money, method: PaymentMethod): Promise<PaymentResult>
}

// Use Case
class PlaceOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
    private readonly notifications: OrderNotifier,
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    const order = await this.orders.findById(input.orderId)
    if (!order) throw new ResourceNotFoundError('Order')

    order.place()

    const payment = await this.payments.charge(order.total, input.paymentMethod)
    if (!payment.success) throw new PaymentFailedError(payment.reason)

    await this.orders.save(order)
    await this.notifications.notifyOrderPlaced(order)

    return { orderId: order.id, status: order.status }
  }
}
```

### Infrastructure

Implements the ports defined by the Application layer. This is where external technologies live.

Contains:
- **Repository implementations** — database access via ORM or raw queries
- **Provider adapters** — external service integrations (payment, email, AI, storage)
- **Messaging** — event bus, message queue implementations
- **Configuration** — environment loading, secrets management

Rules:
- Implements Application ports
- Can depend on Domain and Application
- Contains all technology-specific code (ORM, SDK imports, API calls)
- Returns Domain entities from repositories (not raw rows, not ORM models)

```ts
// Implements the port from Application
class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.db.query('SELECT * FROM orders WHERE id = $1', [id])
    if (!row) return null
    return this.toDomain(row)  // Map DB row to Domain entity
  }

  async save(order: Order): Promise<void> {
    await this.db.query(
      'UPDATE orders SET status = $1, total = $2 WHERE id = $3',
      [order.status, order.total.amount, order.id]
    )
  }

  private toDomain(row: any): Order {
    // Map database representation to domain entity
  }
}
```

### Presentation (outermost)

Translates between the external world (HTTP, CLI, gRPC, WebSocket) and the Application layer.

Contains:
- **Routes / Controllers** — HTTP endpoint definitions
- **Middleware** — auth, rate limiting, request logging
- **Error Mappers** — translate domain/application errors to HTTP responses
- **Request/Response DTOs** — HTTP-specific data shapes

Rules:
- Calls use cases from Application layer
- Maps HTTP requests to use case input DTOs
- Maps use case output DTOs (or errors) to HTTP responses
- Never contains business logic
- This is the only layer that knows about HTTP

```ts
// Thin controller — just translation
router.post('/orders/:id/place', async (req, res) => {
  const input = { orderId: req.params.id, paymentMethod: req.body.paymentMethod }
  const result = await placeOrder.execute(input)
  res.status(200).json(result)
})
```

---

## Ports and Adapters

The port-adapter pattern is the mechanism that makes Clean Architecture work.

**Port** = interface defined by the consumer (Application layer) describing what it needs
**Adapter** = implementation provided by Infrastructure layer

### Types of Ports

**Driving ports** (primary) — how the outside world calls in:
- HTTP controllers calling use cases
- CLI commands calling use cases
- Event handlers calling use cases

**Driven ports** (secondary) — how the application calls out:
- Repository interfaces (data persistence)
- Provider interfaces (external services)
- Notification interfaces (email, push, SMS)

### Contract Design

Keep ports **small and focused**. Each port should represent a single capability.

```ts
// Good — focused ports
interface OrderRepository {
  findById(id: string): Promise<Order | null>
  save(order: Order): Promise<void>
}

interface PaymentGateway {
  charge(amount: Money, method: PaymentMethod): Promise<PaymentResult>
}

// Bad — bloated port
interface DataAccess {
  findOrder(id: string): Promise<Order>
  findUser(id: string): Promise<User>
  findProduct(id: string): Promise<Product>
  saveOrder(order: Order): Promise<void>
  chargePayment(amount: number): Promise<boolean>
  sendEmail(to: string, body: string): Promise<void>
}
```

---

## Dependency Injection

All wiring happens in the **Composition Root** — a single place (usually at application startup) where concrete implementations are bound to ports.

```ts
// composition/container.ts
function buildContainer() {
  const db = new PostgresClient(config.database)

  const orderRepo = new PostgresOrderRepository(db)
  const paymentGateway = new StripePaymentGateway(config.stripe)
  const notifier = new EmailOrderNotifier(config.email)

  const placeOrder = new PlaceOrderUseCase(orderRepo, paymentGateway, notifier)
  const cancelOrder = new CancelOrderUseCase(orderRepo, notifier)

  return { placeOrder, cancelOrder }
}
```

Rules:
- Composition Root is the **only place** that knows about concrete implementations
- Use cases receive abstractions (ports), never concrete classes
- If the framework has a DI container (NestJS, Spring, etc.), use it idiomatically
- If not, manual composition is perfectly fine

---

## When Clean Architecture Shines

- Complex domain logic with many business rules
- Multiple external providers that might change (payment, AI, email)
- Regulatory/compliance requirements demanding strong isolation
- Large teams where clear boundaries prevent stepping on each other
- Long-lived systems that will outlive their current technology choices

## When Clean Architecture Is Overkill

- Simple CRUD with minimal business logic
- Prototypes or MVPs where speed matters more than boundaries
- Small projects with stable, single providers
- Solo developer projects where the overhead doesn't pay off

If you find yourself writing more plumbing (ports, adapters, mappers) than business logic, you've probably over-invested in architecture for your current needs.

---

## Common Anti-Patterns

### Anemic Domain

Entities are just data bags with no behavior. All logic lives in services.

Fix: move business rules into entities. Entities validate their own invariants.

### Leaky Abstractions

Infrastructure details leaking upward — ORM types in domain, HTTP concepts in services.

Fix: map at boundaries. Repositories return domain entities, not ORM models. Use cases receive DTOs, not Request objects.

### Port Explosion

Creating interfaces for every single thing, even when there's only one implementation and no plan for more.

Fix: create ports for **genuine abstraction boundaries** — things that might change, things you want to test in isolation, things with multiple consumers. A single internal utility function doesn't need a port.

### God Use Case

One use case that orchestrates 15 different things.

Fix: break into smaller use cases or introduce domain services that encapsulate sub-workflows.

### Shared Domain

A "common" domain package that everything depends on, creating implicit coupling.

Fix: each bounded context owns its domain. If contexts need to communicate, use explicit contracts or events.

---

## Testing Strategy

### Unit Tests — Domain

Test business rules in entities and value objects. No mocks needed — domain is pure.

```ts
test('order rejects negative quantity', () => {
  const order = new Order()
  expect(() => order.addItem(product, -1)).toThrow(InvalidQuantityError)
})
```

### Unit Tests — Use Cases

Test orchestration logic. Mock the ports (repositories, gateways).

```ts
test('place order charges payment and saves', async () => {
  const orders = mockOrderRepository({ findById: () => draftOrder })
  const payments = mockPaymentGateway({ charge: () => successResult })
  const useCase = new PlaceOrderUseCase(orders, payments, mockNotifier)

  await useCase.execute({ orderId: '1', paymentMethod: 'card' })

  expect(orders.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'placed' }))
  expect(payments.charge).toHaveBeenCalled()
})
```

### Integration Tests — Infrastructure

Test that adapters correctly implement their ports. Use real databases (test containers), real APIs (sandbox environments).

### E2E Tests — Presentation

Test HTTP flow end-to-end with minimal cases. Don't duplicate business logic testing here.

---

## Folder Structure Recommendation

```
src/
  domain/
    entities/
      order.ts
      order-item.ts
    value-objects/
      money.ts
      email.ts
    errors/
      domain-errors.ts
    events/
      order-placed.ts

  application/
    use-cases/
      place-order/
        place-order.use-case.ts
        place-order.input.ts
        place-order.output.ts
      cancel-order/
        cancel-order.use-case.ts
    ports/
      order-repository.ts
      payment-gateway.ts
      order-notifier.ts

  infrastructure/
    persistence/
      postgres-order-repository.ts
    providers/
      stripe-payment-gateway.ts
      sendgrid-order-notifier.ts
    config/
      database.config.ts

  presentation/
    http/
      routes/
        order.routes.ts
      middleware/
        auth.middleware.ts
        error-handler.middleware.ts

  composition/
    container.ts
```

This structure is a recommendation. Adapt naming and nesting to your project's conventions and framework idioms.
