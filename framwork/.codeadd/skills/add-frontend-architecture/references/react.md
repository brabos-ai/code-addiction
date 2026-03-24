# React Architecture — Reference Guide

React is intentionally unopinionated about project structure. This means **every architectural decision is yours** — folder structure, state management, data fetching, routing, component patterns. This reference fills those gaps.

---

## The React Ecosystem Decision Tree

Before organizing folders, you need to decide your stack. These choices directly impact architecture:

### Meta-Framework vs Vanilla

| Choice | When | Impact on Architecture |
|--------|------|----------------------|
| **Next.js (App Router)** | Most projects — SEO matters, server rendering needed | File-based routing, Server Components, built-in data fetching patterns |
| **Next.js (Pages Router)** | Legacy projects, simpler mental model | File-based routing, getServerSideProps/getStaticProps |
| **Remix** | Data-heavy apps, progressive enhancement | Loader/action pattern, nested routes |
| **Vite + React Router** | SPAs, dashboards, admin panels where SEO doesn't matter | Manual routing, full client-side |

The meta-framework choice affects where files go and how data flows. This reference covers patterns that apply regardless of meta-framework, noting differences where they matter.

### State Management

| Tool | When | Architecture Impact |
|------|------|-------------------|
| **React state + context** | Small apps, few shared states | No external deps, but context re-renders can bite at scale |
| **Zustand** | Medium-large apps, need global UI state | Lightweight stores, easy to split by feature |
| **Jotai/Recoil** | Complex atomic state, many independent pieces | Atom-based, good for granular reactivity |
| **Redux Toolkit** | Large apps, complex state flows, time-travel debugging needed | Heavier, but powerful for complex state machines |

**Rule of thumb:** Start with React state + context. Add Zustand when context re-renders become a problem or you have 3+ global state concerns. Avoid Redux unless you specifically need its capabilities.

### Data Fetching

| Tool | When |
|------|------|
| **TanStack Query (React Query)** | Most projects — handles caching, invalidation, loading states |
| **SWR** | Simpler alternative, less features but lighter |
| **RTK Query** | If already using Redux Toolkit |
| **Server Components (Next.js)** | Data that doesn't need client interactivity |

**Rule:** Server state (API data) goes through the data fetching library, never into a Zustand/Redux store. The data fetching library IS the cache.

---

## Feature-Based Structure for React

This is the recommended pattern for medium projects (10-30 pages, 3-5 devs).

### With Next.js App Router

```
src/
  app/                           (Next.js routing — thin page compositions)
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      layout.tsx                 (shared dashboard layout)
      page.tsx                   (dashboard home)
      products/
        page.tsx                 (product list)
        [id]/page.tsx            (product detail)
      orders/
        page.tsx
        [id]/page.tsx
    layout.tsx                   (root layout)

  features/
    auth/
      components/
        login-form.tsx
        register-form.tsx
        social-login-buttons.tsx
      hooks/
        use-login.ts
        use-register.ts
        use-current-user.ts
      types.ts
      index.ts                   (public API)

    products/
      components/
        product-card.tsx
        product-list.tsx
        product-form.tsx
        product-filters.tsx
      hooks/
        use-products.ts
        use-product-detail.ts
        use-create-product.ts
      types.ts
      index.ts

    orders/
      components/
        order-table.tsx
        order-detail-card.tsx
        order-status-badge.tsx
      hooks/
        use-orders.ts
        use-order-detail.ts
      types.ts
      index.ts

  shared/
    components/
      ui/                        (design system)
        button.tsx
        input.tsx
        modal.tsx
        table.tsx
        card.tsx
      layout/
        header.tsx
        sidebar.tsx
        page-wrapper.tsx
    hooks/
      use-debounce.ts
      use-media-query.ts
    lib/
      api.ts                     (axios/fetch instance)
      format.ts                  (formatDate, formatCurrency)
    types/
      api.ts                     (shared API response types)
```

### Key Decisions Explained

**Why `app/` is thin:** Next.js App Router pages should only compose features — import the right feature components, pass route params, handle layout. Business logic lives in `features/`.

```tsx
// app/(dashboard)/products/page.tsx — THIN
import { ProductList, ProductFilters } from '@/features/products'

export default function ProductsPage() {
  return (
    <PageWrapper title="Products">
      <ProductFilters />
      <ProductList />
    </PageWrapper>
  )
}
```

**Why features export via index.ts:** This creates a clear boundary. Other features and pages import from `@/features/products`, never from `@/features/products/components/product-card`. This means you can refactor internals without breaking consumers.

```ts
// features/products/index.ts
export { ProductList } from './components/product-list'
export { ProductCard } from './components/product-card'
export { ProductForm } from './components/product-form'
export { ProductFilters } from './components/product-filters'
export { useProducts } from './hooks/use-products'
export { useProductDetail } from './hooks/use-product-detail'
export type { Product, CreateProductInput } from './types'
```

**Why hooks per feature:** Each feature owns its data fetching and mutation logic. This co-locates the "what data do I need" with "how do I display it."

```ts
// features/products/hooks/use-products.ts
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.get('/products', { params: filters }),
  })
}

// features/products/hooks/use-create-product.ts
export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProductInput) => api.post('/products', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
```

### With Vite + React Router (SPA)

```
src/
  pages/
    products-page.tsx
    product-detail-page.tsx
    orders-page.tsx
    login-page.tsx

  features/
    (same as above)

  shared/
    (same as above)

  routes.tsx                     (central route definitions)
  app.tsx                        (providers, global setup)
  main.tsx                       (entry point)
```

The difference: pages live in a flat `pages/` folder and routes are defined manually instead of file-system based. Everything else is identical.

---

## Component Patterns for React

### Container vs Presentational (Modernized)

The classic pattern still applies but with hooks instead of HOCs:

```tsx
// Presentational — receives data via props, zero logic
function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>{product.name}</CardHeader>
      <CardContent>{product.description}</CardContent>
      <CardFooter>
        <Button onClick={() => onAddToCart(product.id)}>Add to Cart</Button>
      </CardFooter>
    </Card>
  )
}

// Container — manages data and logic, renders presentational
function ProductListContainer() {
  const { data: products, isLoading } = useProducts()
  const { mutate: addToCart } = useAddToCart()

  if (isLoading) return <Skeleton />

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
      ))}
    </div>
  )
}
```

You don't need to be rigid about this. The pattern is useful when a component is reused in different data contexts. For one-off components, combining data and presentation is fine.

### Compound Components

For complex UI that needs flexible composition:

```tsx
// Usage — flexible, readable
<DataTable data={orders}>
  <DataTable.Column header="ID" accessor="id" />
  <DataTable.Column header="Customer" accessor="customerName" />
  <DataTable.Column header="Total" accessor="total" render={v => formatCurrency(v)} />
  <DataTable.Actions>
    {(row) => <OrderActions order={row} />}
  </DataTable.Actions>
</DataTable>
```

Use compound components when you have a complex UI element (table, form, tabs, accordion) that needs to be configured differently in different contexts.

### Custom Hooks as Feature Logic

Hooks are the primary abstraction for logic reuse in React. Each feature's hooks encapsulate:

- Data fetching (queries and mutations)
- Feature-specific UI state
- Business logic that multiple components in the feature need

```ts
// features/orders/hooks/use-order-workflow.ts
export function useOrderWorkflow(orderId: string) {
  const { data: order } = useOrderDetail(orderId)
  const { mutate: approve } = useApproveOrder()
  const { mutate: cancel } = useCancelOrder()

  const canApprove = order?.status === 'pending'
  const canCancel = order?.status !== 'cancelled' && order?.status !== 'delivered'

  return { order, approve, cancel, canApprove, canCancel }
}
```

---

## Cross-Feature Communication in React

### Via Shared Data Layer

The most common and recommended approach:

```tsx
// Feature A writes data
const { mutate: createOrder } = useCreateOrder()

// Feature B reads the same data (via cache)
const { data: recentOrders } = useOrders({ limit: 5 })
// After Feature A creates an order and invalidates ['orders'],
// Feature B automatically gets the updated data
```

TanStack Query's cache is the communication channel. No direct imports between features needed.

### Via URL State

For coordination through routing:

```tsx
// Feature A navigates
navigate(`/orders/${orderId}`)

// Feature B reads the param
const { id } = useParams()
const { data: order } = useOrderDetail(id)
```

### Via Global Store (Rare)

Only when you need synchronous cross-feature UI state:

```ts
// shared/stores/notification-store.ts
export const useNotificationStore = create((set) => ({
  notifications: [],
  add: (notification) => set(state => ({
    notifications: [...state.notifications, notification]
  })),
}))
```

---

## Scaling Signals

### When to move from Simple to Feature-Based

- `components/` folder has 25+ files
- You catch yourself grepping to find where something lives
- Two developers are regularly editing the same folders
- Hooks are a mix of auth, products, orders, and utils in one folder

### When to move from Feature-Based to FSD

- Features start importing heavily from each other
- Shared folder is growing with semi-reusable components
- You need strict boundaries between teams
- The "is this a feature or a shared component?" question comes up weekly
- 6+ developers on the frontend

### When to simplify

- More than half your features have only 1-2 components
- You're creating barrel files for folders with one file
- New developers comment that the structure is hard to navigate
- Most of your time goes into "where does this go?" instead of building
