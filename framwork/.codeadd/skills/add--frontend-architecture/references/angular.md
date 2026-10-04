# Angular Architecture — Reference Guide

Angular is the most opinionated major framework. It provides modules (or standalone components), services with DI, routing, forms, HTTP client, and a testing framework. This means the architectural decisions left to you are **fewer but more impactful**.

This reference focuses on what Angular doesn't decide for you: **how to organize features, manage scale, and avoid the common structural pitfalls**.

---

## What Angular Already Decides

| Concern | Angular's Opinion |
|---------|-------------------|
| Component model | Decorators, templates, standalone or NgModule |
| State management | Services + RxJS (or Signals in v17+) |
| Dependency injection | Built-in, hierarchical injectors |
| Routing | @angular/router with lazy loading |
| HTTP | HttpClient with interceptors |
| Forms | Reactive Forms or Template-Driven Forms |
| Testing | Jasmine + Karma (or Jest), TestBed |

### What Angular Leaves Open

- How to group features and define boundaries
- When to use standalone components vs NgModules
- How to structure services (one per feature? shared? per use case?)
- When to use Signals vs RxJS vs plain services
- How to organize state beyond simple services
- NgRx/NGXS: when (and if) to introduce them

---

## Feature-Based Structure for Angular

### With Standalone Components (Angular 17+)

This is the modern approach. Standalone components don't require NgModules.

```
src/app/
  features/
    auth/
      components/
        login-form.component.ts
        register-form.component.ts
      services/
        auth.service.ts
      guards/
        auth.guard.ts
      models/
        user.model.ts
      auth.routes.ts
      index.ts

    products/
      components/
        product-list.component.ts
        product-card.component.ts
        product-form.component.ts
        product-filters.component.ts
      services/
        product.service.ts
      models/
        product.model.ts
      products.routes.ts
      index.ts

    orders/
      components/
        order-table.component.ts
        order-detail.component.ts
        order-status-badge.component.ts
      services/
        order.service.ts
      models/
        order.model.ts
      orders.routes.ts
      index.ts

  shared/
    components/
      ui/
        button.component.ts
        input.component.ts
        modal.component.ts
        table.component.ts
      layout/
        header.component.ts
        sidebar.component.ts
        page-wrapper.component.ts
    services/
      api.service.ts
      notification.service.ts
    interceptors/
      auth.interceptor.ts
      error.interceptor.ts
    pipes/
      format-date.pipe.ts
      format-currency.pipe.ts
    models/
      api-response.model.ts

  app.component.ts
  app.config.ts
  app.routes.ts
```

### With NgModules (Angular < 17 or existing projects)

```
src/app/
  features/
    auth/
      components/
        login-form/
          login-form.component.ts
          login-form.component.html
          login-form.component.scss
      services/
        auth.service.ts
      guards/
        auth.guard.ts
      auth-routing.module.ts
      auth.module.ts

    products/
      components/
        product-list/
          product-list.component.ts
          product-list.component.html
          product-list.component.scss
      services/
        product.service.ts
      products-routing.module.ts
      products.module.ts

  shared/
    shared.module.ts               (exports shared components, pipes, directives)
    components/
    pipes/
    services/

  core/
    core.module.ts                 (singleton services, guards, interceptors)
    services/
    interceptors/
    guards/

  app-routing.module.ts
  app.module.ts
```

**Note on core/ vs shared/:** In NgModule-based Angular, the classic pattern separates:
- `core/` — singleton services, interceptors, guards (imported once in AppModule)
- `shared/` — reusable components, pipes, directives (imported in many feature modules)

With standalone components, this distinction matters less because DI scope is controlled by `providedIn` and component imports are explicit.

---

## Angular-Specific Decisions

### Standalone Components vs NgModules

| Use standalone when | Use NgModules when |
|--------------------|--------------------|
| New projects (Angular 17+) | Existing projects already using NgModules |
| Simpler mental model, less boilerplate | Team is familiar with NgModule patterns |
| Easier tree-shaking | Need complex module-level DI configuration |

**Recommendation for new projects:** Use standalone components. NgModules add ceremony without proportional value in modern Angular.

### Service Scope

Angular's DI makes service scope a real architectural decision:

```ts
// Global singleton — available everywhere
@Injectable({ providedIn: 'root' })
export class AuthService { }

// Feature-scoped — new instance per feature (rarely needed)
@Injectable()
export class ProductFilterService { }
// Provided in the feature's route config or component providers
```

**Rule:** Default to `providedIn: 'root'` for services. Only scope to feature level when you genuinely need isolated instances (e.g., a filter service that resets per page).

### Signals vs RxJS

Angular 17+ introduced Signals. The question is when to use which:

| Use Signals when | Use RxJS when |
|-----------------|---------------|
| Simple state (primitives, objects) | Streams of events over time |
| Synchronous reactivity | HTTP responses (HttpClient returns Observables) |
| Component-level state | Complex async flows (debounce, merge, switchMap) |
| Derived/computed state | WebSocket streams, real-time data |
| Template binding | Combining multiple async sources |

**Practical approach:** Use Signals for UI state and simple derived state. Use RxJS for HTTP calls and complex async flows. Don't fight the framework — HttpClient returns Observables, so data fetching stays RxJS.

```ts
// Signal for UI state
@Injectable({ providedIn: 'root' })
export class ProductFilterService {
  readonly category = signal<string | null>(null)
  readonly sortBy = signal<'name' | 'price'>('name')
  readonly searchQuery = signal('')

  readonly activeFilters = computed(() => ({
    category: this.category(),
    sortBy: this.sortBy(),
    search: this.searchQuery(),
  }))
}

// RxJS for data fetching
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(filters: ProductFilters): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products', { params: filters })
  }
}
```

### NgRx — When to Introduce

NgRx (or NGXS) adds significant complexity. Only introduce it when:

- Multiple features need to react to the same state changes
- You have complex state machines with many transitions
- You need time-travel debugging for state issues
- The team is large enough that explicit action/reducer patterns prevent conflicts

**Do NOT use NgRx when:**
- Services + Signals handle your state fine
- You have less than 5 features
- The "boilerplate per feature" exceeds the actual feature logic
- You're using it "because Angular projects should use NgRx"

---

## Component Patterns for Angular

### Smart vs Presentational

Angular's DI makes this pattern natural:

```ts
// Presentational — inputs and outputs only
@Component({
  selector: 'app-product-card',
  standalone: true,
  template: `
    <div class="card">
      <h3>{{ product().name }}</h3>
      <p>{{ product().price | currency }}</p>
      <button (click)="addToCart.emit(product().id)">Add to Cart</button>
    </div>
  `
})
export class ProductCardComponent {
  product = input.required<Product>()
  addToCart = output<string>()
}

// Smart — injects services, manages state
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent, AsyncPipe],
  template: `
    @if (products$ | async; as products) {
      @for (product of products; track product.id) {
        <app-product-card [product]="product" (addToCart)="onAddToCart($event)" />
      }
    } @else {
      <app-skeleton />
    }
  `
})
export class ProductListComponent {
  private productService = inject(ProductService)
  private cartService = inject(CartService)

  products$ = this.productService.getProducts()

  onAddToCart(productId: string) {
    this.cartService.add(productId)
  }
}
```

### Content Projection (Angular's Slots)

```ts
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <div class="card-header">
        <ng-content select="[card-header]" />
      </div>
      <div class="card-content">
        <ng-content />
      </div>
      <div class="card-footer">
        <ng-content select="[card-footer]" />
      </div>
    </div>
  `
})
export class CardComponent {}
```

### Route-Level Lazy Loading

Angular's router supports lazy loading per feature — this is critical for performance at scale:

```ts
// app.routes.ts
export const routes: Routes = [
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes')
      .then(m => m.PRODUCT_ROUTES),
  },
  {
    path: 'orders',
    loadChildren: () => import('./features/orders/orders.routes')
      .then(m => m.ORDER_ROUTES),
  },
]

// features/products/products.routes.ts
export const PRODUCT_ROUTES: Routes = [
  { path: '', component: ProductListComponent },
  { path: ':id', component: ProductDetailComponent },
]
```

---

## Cross-Feature Communication in Angular

### Via Services (Most Common)

```ts
// Feature A's service triggers a change
this.orderService.createOrder(data).subscribe()

// Feature B reads the same data (if using shared observable/signal)
// OR: Feature B refetches when it enters the route
```

### Via Router

```ts
this.router.navigate(['/orders', orderId])
```

### Via Event Bus (Large Apps)

When features need loose coupling:

```ts
@Injectable({ providedIn: 'root' })
export class EventBus {
  private events = new Subject<AppEvent>()

  emit(event: AppEvent) { this.events.next(event) }

  on<T extends AppEvent['type']>(type: T) {
    return this.events.pipe(filter(e => e.type === type))
  }
}
```

Use sparingly — event buses can become invisible coupling if overused.

---

## Common Angular Anti-Patterns

### God Module
One AppModule that imports everything. Fix: lazy-load features.

### Service Spaghetti
Services injecting 10+ other services. Fix: break into focused services per feature.

### Template Logic
Complex logic in templates (`*ngIf="items && items.length > 0 && !loading && user?.role === 'admin'"`). Fix: move to computed properties or signals.

### Over-Abstracting Services
Creating base classes and generic services that every feature extends. Fix: simple, focused services per feature. Duplication is better than the wrong abstraction.

---

## Scaling Signals for Angular

### When to add dedicated state management (NgRx/NGXS)

- 6+ developers on the frontend
- State changes need to be traceable (debugging complex flows)
- Multiple features react to the same state mutations
- You need optimistic updates with rollback

### When to simplify

- NgRx actions/reducers/effects outnumber actual feature logic
- Every simple CRUD operation requires 5 files of NgRx boilerplate
- Junior developers struggle more with state management than with business logic
- Consider replacing NgRx with Signals + Services for simpler features
