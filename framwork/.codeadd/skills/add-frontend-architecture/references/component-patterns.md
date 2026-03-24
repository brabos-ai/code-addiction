# Component Patterns — Universal Reference

Framework-agnostic patterns for building maintainable component architectures. These principles apply whether you're using React, Vue, Angular, Svelte, or Solid.

---

## Component Roles

Every component in a frontend project should have one clear role:

### Page Components

Route entry points. They compose other components and handle route-level concerns.

**Responsibilities:**
- Set up layout for the route
- Read route parameters
- Compose feature components
- Set page metadata (title, breadcrumbs)

**Must not:**
- Contain business logic
- Make API calls directly
- Manage complex state

A page should be readable in 30 seconds. If it's not, logic has leaked in.

### Feature Components

Domain-specific components that own business behavior for their feature.

**Responsibilities:**
- Fetch and mutate data for the feature
- Orchestrate user interactions within the feature
- Manage feature-specific state
- Compose UI components with domain data

**Scope:**
- Feature components live inside their feature folder
- They import from shared UI and from their own feature
- They should not import from other features' internals

### UI Components (Design System)

Reusable, presentational, domain-agnostic building blocks.

**Responsibilities:**
- Render based on props/inputs
- Emit events for user interactions
- Support composition via slots/children
- Handle visual variants (size, color, state)

**Must not:**
- Fetch data
- Know about business logic
- Import feature-specific types
- Manage state beyond internal UI concerns (open/close, hover, focus)

### Layout Components

Structural components that define page composition.

**Examples:** Header, Sidebar, Footer, PageWrapper, ContentArea

**Rule:** Layout components handle structure and navigation. They don't contain business logic.

---

## Composition Patterns

### Compound Components

Break complex UI into cooperating sub-components that share implicit state.

**When to use:**
- Tables with customizable columns
- Forms with dynamic field layouts
- Tabs, accordions, dropdowns with complex content
- Any component where a flat prop API would be unwieldy

**Principle:** The parent component provides context/state. Child components consume it. Users compose them declaratively.

```
// Conceptual (framework-agnostic)
<DataTable data={items}>
  <Column header="Name" field="name" />
  <Column header="Status" field="status" render={StatusBadge} />
  <TableActions>{(row) => <EditButton item={row} />}</TableActions>
</DataTable>
```

Benefits:
- Flexible composition without prop explosion
- Each sub-component handles one concern
- Easy to add new sub-component types

### Render Delegation

Let parent components control how data is rendered while child components handle data fetching and state.

**When to use:**
- Lists where items need different renderings in different contexts
- Data containers (tables, grids) that work with various data shapes
- Wrapper components that provide data to custom UIs

### Headless Components

Components that provide behavior and state management but no UI. The consumer provides all rendering.

**When to use:**
- Autocomplete/combobox behavior (filtering, keyboard navigation, selection)
- Drag and drop logic
- Virtualized list scrolling
- Tooltip/popover positioning

**Principle:** Separate the "how it works" from "how it looks." The headless component exports state and handlers. The consumer renders whatever it wants.

### Provider/Consumer Pattern

Share state across a component subtree without prop drilling.

**When to use:**
- Theme data
- Auth context
- Feature-scoped state (current order, current form)
- Avoiding passing the same prop through 4+ levels

**Framework implementations:**
- React: Context + useContext
- Vue: provide/inject
- Angular: Hierarchical DI

**Rule:** Use within a feature boundary. Cross-feature state sharing via this pattern creates invisible coupling.

---

## State Patterns

### Local State

State that lives in a single component and is not shared.

**Examples:** Input value, toggle open/close, hover state, local form data

**Rule:** Keep state local until you have a real reason to lift it.

### Lifted State

State that's shared between siblings, lifted to the nearest common parent.

**Examples:** Active tab in a tab group, selected item in a list-detail view

**Rule:** Lift state one level at a time. Don't hoist to app-level just because two components need it.

### Feature State

State shared across multiple components within a feature boundary.

**Implementation:** Feature-level store (Zustand slice, Pinia store, Angular service)

**Examples:** Product filters, order workflow state, dashboard layout preferences

### Server State

Data fetched from the backend. This is the most common state type and the most commonly mismanaged.

**Rules:**
- Use a data fetching library (TanStack Query, SWR, Apollo, etc.) — don't reinvent caching
- Server state belongs in the query cache, NOT in UI stores
- Mutations invalidate relevant queries — this is the communication mechanism
- Loading, error, and stale states are managed by the library, not by you

### URL State

State encoded in the URL — query params, route params, hash.

**When to put state in URL:**
- Shareable links (search filters, pagination, selected tab)
- Deep linking (specific item view, specific state)
- State that should survive page refresh

**When NOT to put state in URL:**
- Ephemeral UI state (modal open, tooltip visible)
- Form data in progress
- State that's meaningless without the current session

---

## Design System Organization

### Structure

```
shared/
  components/
    ui/
      button/
      input/
      modal/
      table/
      card/
      badge/
      dropdown/
      tooltip/
      skeleton/
      spinner/
      empty-state/
      error-state/
```

### Rules

1. **Domain-agnostic** — UI components know about visual concerns (size, color, variant), never about business concepts (Product, Order, User)

2. **Composable** — Prefer composition over configuration. Many small props = hard to use. Slots/children + sub-components = flexible.

3. **Consistent API** — Similar components should have similar APIs. If `Button` has a `variant` prop, `Badge` should too (not `type` or `style`).

4. **States built-in** — Every data-displaying component should handle loading and error states. Don't leave this to consumers.

5. **Accessible by default** — ARIA attributes, keyboard navigation, focus management should be built into the component, not added by consumers.

---

## Cross-Feature Boundaries

### What Can Cross Boundaries

- Shared UI components (from shared/)
- Shared utility functions
- Type definitions for API responses
- Router navigation between features
- Data fetching cache (query cache is the shared data layer)

### What Should NOT Cross Boundaries

- Feature-internal components
- Feature-internal state/hooks/composables
- Feature-specific types (unless exported via the feature's public API)
- Direct function calls between features

### Public API Pattern

Each feature exposes a public API through its barrel file (`index.ts`):

```ts
// features/products/index.ts
// Only export what other features and pages need
export { ProductCard } from './components/product-card'
export { ProductList } from './components/product-list'
export { useProducts } from './hooks/use-products'
export type { Product } from './types'
```

Everything not exported is considered internal and should not be imported directly.

---

## Performance Patterns

### Code Splitting

Split by route — each feature's route is a separate chunk loaded on demand. This is the single highest-impact performance optimization for large frontends.

### Lazy Components

For heavy components not needed on initial render (modals, charts, rich text editors):
- Load on user interaction (click to open modal → load modal code)
- Load on viewport entry (scroll to chart → load chart code)

### Memoization

**Only memoize when you have evidence of a problem.** Premature memoization adds complexity and can actually hurt performance (memo comparison cost > re-render cost for simple components).

Signals to memoize:
- Profiler shows expensive re-renders
- List items re-render when list data hasn't changed
- Computed values are recalculated unnecessarily on every render

### Virtualization

For long lists (100+ items), virtualize instead of rendering all items. Use a library (TanStack Virtual, react-window, etc.) — don't build your own.

---

## Anti-Patterns

### Prop Drilling Beyond 3 Levels
If a prop passes through 3+ components that don't use it, introduce a context/provider or lift the data fetching closer to where it's consumed.

### God Components
Components with 500+ lines that handle data fetching, state management, business logic, and rendering. Break them into smaller components with clear roles.

### Premature Abstraction
Creating a `GenericList` component because you have 3 lists. If the lists are different enough, 3 specific components are better than one generic one with 15 configuration props.

### Shared Folder as Dump
Every "might be reused someday" component going into shared/. Rule: a component goes into shared/ only after it's **actually used** by 2+ features. Until then, it lives in the feature that uses it.

### Business Logic in Components
API calls, validation rules, price calculations, permission checks — these should live in hooks/composables/services, not in the component template or event handlers.
