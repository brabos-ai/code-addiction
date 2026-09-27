# Vue Architecture — Reference Guide

Vue sits in the middle: it provides conventions (Composition API, Pinia, Vue Router) but leaves project structure up to you. This reference fills the organizational gaps while respecting Vue's existing opinions.

---

## What Vue Already Decides (and What It Doesn't)

### Vue provides

- **Composition API** — how to organize logic within components (composables)
- **Pinia** — official state management with clear store pattern
- **Vue Router** — routing with navigation guards
- **Single File Components** — `.vue` files combining template, script, style
- **Nuxt** (optional) — file-based routing, auto-imports, server rendering

### Vue leaves open

- How to organize folders beyond the basic `src/` structure
- Where to put composables (global? per feature? per component?)
- How to split features and define boundaries between them
- When to use Pinia vs composables for state
- How to organize components (flat? nested? by feature?)

This reference addresses these gaps.

---

## Feature-Based Structure for Vue

### With Nuxt

```
├── pages/                         (Nuxt file-based routing — thin)
│   ├── index.vue
│   ├── login.vue
│   ├── products/
│   │   ├── index.vue
│   │   └── [id].vue
│   └── orders/
│       ├── index.vue
│       └── [id].vue
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.vue
│   │   │   ├── RegisterForm.vue
│   │   │   └── SocialLoginButtons.vue
│   │   ├── composables/
│   │   │   ├── useLogin.ts
│   │   │   ├── useRegister.ts
│   │   │   └── useCurrentUser.ts
│   │   ├── stores/
│   │   │   └── auth.store.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductCard.vue
│   │   │   ├── ProductList.vue
│   │   │   ├── ProductForm.vue
│   │   │   └── ProductFilters.vue
│   │   ├── composables/
│   │   │   ├── useProducts.ts
│   │   │   ├── useProductDetail.ts
│   │   │   └── useCreateProduct.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── orders/
│       ├── components/
│       │   ├── OrderTable.vue
│       │   ├── OrderDetailCard.vue
│       │   └── OrderStatusBadge.vue
│       ├── composables/
│       │   ├── useOrders.ts
│       │   └── useOrderDetail.ts
│       ├── types.ts
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── ui/                    (design system)
│   │   │   ├── UiButton.vue
│   │   │   ├── UiInput.vue
│   │   │   ├── UiModal.vue
│   │   │   └── UiTable.vue
│   │   └── layout/
│   │       ├── AppHeader.vue
│   │       ├── AppSidebar.vue
│   │       └── PageWrapper.vue
│   ├── composables/
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── format.ts
│   └── types/
│       └── api.ts
│
├── app.vue
└── nuxt.config.ts
```

### With Vite + Vue Router (SPA)

Same `features/` and `shared/` structure. The difference:

```
├── src/
│   ├── pages/                   (manual route-level components)
│   │   ├── ProductsPage.vue
│   │   ├── ProductDetailPage.vue
│   │   └── OrdersPage.vue
│   ├── features/
│   │   └── (same as above)
│   ├── shared/
│   │   └── (same as above)
│   ├── router/
│   │   └── index.ts             (manual route definitions)
│   ├── App.vue
│   └── main.ts
```

---

## Vue-Specific Decisions

### Composables vs Pinia Stores

This is the most common source of confusion in Vue architecture. Clear rule:

| Use composable when | Use Pinia store when |
|---------------------|---------------------|
| Logic is used by 1-3 components in the same feature | State is shared across features |
| Data comes from an API (server state) | State is purely UI (sidebar open, theme, user preferences) |
| Stateless logic reuse (format, validate, compute) | State needs to persist across route navigation |
| Feature-scoped data fetching | Global state (current user, auth, notifications) |

**Common mistake:** Putting API data in Pinia stores. API data belongs in a data fetching composable (with TanStack Query or VueUse's `useFetch`). Pinia is for **UI state**, not server state.

```ts
// WRONG — API data in Pinia
const useProductStore = defineStore('products', () => {
  const products = ref([])
  async function fetchProducts() {
    products.value = await api.get('/products')
  }
  return { products, fetchProducts }
})

// RIGHT — API data in composable with TanStack Query
function useProducts(filters?: Ref<ProductFilters>) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.get('/products', { params: unref(filters) }),
  })
}

// RIGHT — UI state in Pinia
const useProductFiltersStore = defineStore('product-filters', () => {
  const category = ref<string | null>(null)
  const sortBy = ref('name')
  const searchQuery = ref('')
  return { category, sortBy, searchQuery }
})
```

### Component Naming in Vue

Vue has a strong convention: **PascalCase** for components, matching the file name.

```
// File: ProductCard.vue → <ProductCard />
// File: UiButton.vue → <UiButton />
```

For shared UI components, prefix with `Ui`, `App`, or `Base` to distinguish from feature components:
- `UiButton.vue`, `UiInput.vue`, `UiModal.vue`
- `AppHeader.vue`, `AppSidebar.vue`

This avoids collisions with HTML elements and makes the component's nature immediately clear.

### Nuxt Auto-Imports

Nuxt auto-imports composables from `composables/` and components from `components/`. This is convenient but can create confusion with feature-based architecture:

**Recommended approach:** Use Nuxt auto-imports for `shared/` composables and components. For feature-specific code, use explicit imports to maintain clear boundaries.

```ts
// In a page — feature imports are explicit
import { ProductList, ProductFilters } from '~/features/products'

// shared/composables are auto-imported by Nuxt
const { debounced } = useDebounce(searchQuery, 300)
```

Configure `nuxt.config.ts` to auto-import from shared:
```ts
export default defineNuxtConfig({
  imports: {
    dirs: ['shared/composables']
  },
  components: {
    dirs: ['shared/components/ui', 'shared/components/layout']
  }
})
```

---

## Component Patterns for Vue

### Slots for Composition

Vue's slot system is the primary tool for component composition:

```vue
<!-- shared/components/ui/UiCard.vue -->
<template>
  <div class="card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>
```

Usage:
```vue
<UiCard>
  <template #header>
    <h3>{{ product.name }}</h3>
  </template>
  {{ product.description }}
  <template #footer>
    <UiButton @click="addToCart">Add to Cart</UiButton>
  </template>
</UiCard>
```

### Scoped Slots for Render Delegation

When a component needs to let the parent control rendering while providing data:

```vue
<!-- features/products/components/ProductList.vue -->
<template>
  <div v-if="isLoading"><UiSkeleton /></div>
  <div v-else-if="error"><UiError :message="error.message" /></div>
  <div v-else>
    <slot :products="products" :total="total">
      <!-- default rendering -->
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </slot>
  </div>
</template>
```

### Provide/Inject for Feature Context

When a feature needs to share state across deeply nested components without prop drilling:

```ts
// features/orders/composables/useOrderContext.ts
const ORDER_CONTEXT = Symbol('order-context')

export function provideOrderContext(orderId: Ref<string>) {
  const { data: order } = useOrderDetail(orderId)
  const context = { order, orderId }
  provide(ORDER_CONTEXT, context)
  return context
}

export function useOrderContext() {
  const context = inject(ORDER_CONTEXT)
  if (!context) throw new Error('useOrderContext must be used within order feature')
  return context
}
```

Use this within a feature boundary. Don't use provide/inject across features — that creates invisible coupling.

---

## Cross-Feature Communication in Vue

### Via Data Fetching Cache

Same as React — the query cache is the communication channel:

```ts
// Feature A creates order → invalidates ['orders']
// Feature B's useOrders() composable automatically refetches
```

### Via Router

```ts
// Feature A navigates
router.push({ name: 'order-detail', params: { id: orderId } })

// Feature B reads params
const route = useRoute()
const { data: order } = useOrderDetail(route.params.id)
```

### Via Pinia (Global UI State Only)

```ts
// shared/stores/notification.store.ts
export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])
  function add(notification: Notification) { items.value.push(notification) }
  function dismiss(id: string) { items.value = items.value.filter(n => n.id !== id) }
  return { items, add, dismiss }
})
```

---

## Scaling Signals for Vue

### When to add Pinia stores

- You're passing the same state through 3+ levels of components
- Multiple features need the same UI state (not API data)
- State needs to survive route changes

### When to move from Simple to Feature-Based

- `components/` folder exceeds 20 files
- `composables/` mixes concerns (auth + products + utils in the same folder)
- Nuxt auto-imports are pulling in too many unrelated things

### When to consider FSD

- 30+ pages, 6+ developers
- Features import from each other frequently
- You need strict dependency rules enforced
