---
name: add-frontend-architecture
description: |
  Frontend architecture consultant — guides project structure decisions for new or existing frontend projects. Helps choose between Simple Component-Based, Feature-Based, or Feature-Sliced Design based on project scale, team size, and framework. Framework-aware: provides specific guidance for React, Vue, and Angular, accounting for how opinionated each framework is. Use this skill when the user asks about frontend folder structure, project organization, how to scale their frontend, how to organize components/features/pages, or when starting a new frontend project. Also use when the user mentions "components folder is a mess", "where should this go", "how to structure React/Vue/Angular", "feature folders", or is refactoring a growing frontend. This skill guides decisions — it does not implement features (use add-frontend-development for that) and does not handle UI/UX design (use ux-design for that).
---

# Frontend Architecture Consultant

Guide structural decisions for frontend projects. Framework-aware, scale-appropriate.

**Use for:** Project structure, folder organization, feature boundaries, component hierarchy, scaling decisions
**Not for:** Feature implementation (add-frontend-development), UI/UX design (ux-design), backend (add-backend-architecture)

**Key difference from add-frontend-development:** This skill answers "how should I organize this project?" — add-frontend-development answers "how should I implement this feature?"

---

## Core Philosophy

Frontend architecture is inseparable from how you think about components. The folder structure follows from your component strategy, not the other way around.

The right architecture is the **simplest one that keeps your team productive** as the project grows. A 5-page dashboard doesn't need Feature-Sliced Design. A 50-page SaaS app doesn't survive with a flat `components/` folder.

---

## Framework Detection

Before recommending architecture, identify the framework. Each framework has a different level of opinion about structure:

| Framework | Opinion Level | What the skill provides |
|-----------|--------------|------------------------|
| **Angular** | High — modules, services, DI, routing built-in | Validate and optimize within Angular's structure |
| **Vue** | Medium — Composition API, Pinia exist but structure is free | Guide organization where Vue leaves it open |
| **React** | Low — almost nothing decided for you | Define the architecture that React doesn't provide |

**Detection:** Check `package.json`, `stack-context.md`, or ask the user. Then load the relevant reference:
- React → `references/react.md`
- Vue → `references/vue.md`
- Angular → `references/angular.md`

For other frameworks (Svelte, Solid, etc.), apply the universal principles below and adapt to the framework's idioms.

---

## Decision Navigator

### Context Questions

1. **Scale** — How many pages/views does this project have?
   - Small (1-10 pages, single feature area)
   - Medium (10-30 pages, 3-6 feature areas)
   - Large (30+ pages, many feature areas)

2. **Team size** — How many frontend developers?
   - Solo or small (1-2)
   - Medium (3-5)
   - Large (6+)

3. **Component reuse** — How much shared UI exists?
   - Minimal (mostly page-specific components)
   - Moderate (shared component library emerging)
   - Heavy (design system, shared across multiple apps)

4. **Domain complexity** — How complex is the business logic on the frontend?
   - Light (display data, simple forms, basic CRUD)
   - Moderate (multi-step flows, complex state, role-based views)
   - Heavy (real-time data, complex calculations, rich interactions)

5. **Framework** — Which framework? (affects how much the skill needs to define)

### Decision Matrix

| Context | Pattern | Why |
|---------|---------|-----|
| Small scale, solo dev, light domain | **Simple Component-Based** | Flat structure, fast to navigate, no ceremony |
| Medium scale, small-medium team, moderate domain | **Feature-Based** | Features co-located, scales well, easy to understand |
| Large scale, large team, heavy domain | **Feature-Sliced Design** | Formalized layers, clear boundaries, prevents chaos at scale |

### Over-Engineering Signals

- More folders than files inside them
- Components with `index.ts` re-exports that just re-export one thing
- A `/shared` or `/common` folder with 50+ components nobody can navigate
- Barrel files (`index.ts`) everywhere creating circular dependency problems
- Layers/abstractions that exist "because the architecture says so" but add no value

### Under-Engineering Signals

- A flat `components/` folder with 80+ files
- Business logic mixed into UI components (API calls inside buttons)
- State management scattered — some in stores, some in components, some in URL params
- Can't find where something lives without full-text search
- New team members take a week to understand the structure

---

## Architecture Patterns

### Simple Component-Based

For small projects where anything more would be overhead.

```
src/
  pages/
    home.tsx
    about.tsx
    settings.tsx
  components/
    header.tsx
    footer.tsx
    user-card.tsx
    settings-form.tsx
  hooks/                    (or composables/)
    use-auth.ts
    use-users.ts
  lib/
    api.ts
  types/
    user.ts
  app.tsx
  routes.tsx
```

Rules:
- Pages are route-level components
- Components folder is flat (no deep nesting for 10-20 components)
- Hooks/composables co-located or in a single folder
- No feature folders needed at this scale
- Direct imports between components are fine

When to graduate: when the `components/` folder exceeds 25-30 files and you start struggling to find things.

### Feature-Based

For medium projects. The frontend equivalent of Vertical Slice — organize by business feature.

**Read the framework-specific reference** for detailed guidance:
- React: `references/react.md`
- Vue: `references/vue.md`
- Angular: `references/angular.md`

Core structure (framework-agnostic):

```
src/
  features/
    auth/
      components/
      hooks|composables/
      types.ts
      index.ts
    products/
      components/
      hooks|composables/
      types.ts
      index.ts
    orders/
      components/
      hooks|composables/
      types.ts
      index.ts
  shared/
    components/
      ui/               (design system primitives)
      layout/            (header, sidebar, footer)
    hooks|composables/
    lib/
      api.ts
    types/
  pages/                 (or routes/ — thin, compose features)
  app.tsx
```

Key rules:
- Features own their components, hooks, and types
- Features expose a public API via `index.ts` — other features import from the barrel, not from internal files
- Shared contains only truly reusable, domain-agnostic code
- Pages are thin — they compose features, they don't contain business logic

### Feature-Sliced Design (FSD)

For large projects with many developers and complex feature interactions.

FSD formalizes frontend structure into layers with strict dependency rules:

```
src/
  app/              (global setup: providers, routing, styles)
  pages/            (route-level compositions — combine widgets and features)
  widgets/          (complex UI blocks — combine features and entities)
  features/         (user interactions — forms, toggles, actions)
  entities/         (business objects — user, product, order)
  shared/           (infrastructure — UI kit, API client, lib utilities)
```

Dependency rule (strict):
```
app → pages → widgets → features → entities → shared
```

Each layer can only import from layers **below** it. Never upward.

Within each layer, organize by **slice** (domain concept):
```
features/
  add-to-cart/
    ui/
    model/
    api/
    index.ts
  apply-discount/
    ui/
    model/
    api/
    index.ts
```

FSD is well-documented externally. The skill's role is to help decide **when** FSD is appropriate and how to apply it pragmatically — not to replicate the full FSD spec.

When FSD is right:
- 6+ frontend developers
- 30+ pages
- Features interact with each other in complex ways
- You need strict boundaries to prevent spaghetti

When FSD is overkill:
- Small-medium projects
- Solo developer or small team
- Simple CRUD apps

---

## Universal Principles (All Patterns)

### 1. Components Have Clear Roles

Every component falls into one of these categories:

| Role | Responsibility | Knows about business logic? |
|------|---------------|----------------------------|
| **Page** | Route entry point, composes features | No — just layout and composition |
| **Feature component** | Domain-specific UI + logic | Yes — owns its feature's behavior |
| **UI component** | Reusable, presentational | No — receives data via props/slots |
| **Layout component** | Page structure (header, sidebar) | No — structural only |

Don't mix roles. A button component should not fetch data. A page should not contain business logic.

### 2. Feature Isolation

Features should be as independent as possible:
- Feature components import from `shared/` and their own feature folder
- Cross-feature imports go through the feature's public API (`index.ts`), never internal files
- If Feature A needs data from Feature B, it should go through a shared hook/composable or the data layer, not by importing B's internal components

### 3. State Belongs Where It's Used

| State type | Where it lives | Examples |
|------------|---------------|----------|
| Component state | Inside the component | Form input values, toggle open/close |
| Feature state | Feature's store/hook | Selected filters, feature-specific UI state |
| Server state | Data fetching library cache | API responses, CRUD data |
| Global UI state | App-level store | Theme, sidebar collapsed, current user |
| URL state | Router/URL params | Current page, search query, selected tab |

Don't hoist state higher than necessary. Don't put everything in a global store.

### 4. Pages Are Thin

Pages (route-level components) should:
- Set up layout
- Compose feature components
- Handle route params
- Set page metadata (title, breadcrumbs)

Pages should NOT:
- Contain business logic
- Make API calls directly (delegate to feature hooks/composables)
- Have complex state management

### 5. Shared Folder Discipline

Same as backend: shared is for truly reusable, domain-agnostic code.

Good shared:
- UI primitives (Button, Input, Modal, Table)
- Layout components (Header, Sidebar, PageWrapper)
- API client setup
- Auth hooks/composables
- Utility functions (formatDate, formatCurrency)
- Type definitions for API responses

Bad shared:
- Feature components disguised as "reusable"
- Business logic utilities
- Components used by only one feature

### 6. Component Composition Over Configuration

Prefer composing small components over building large configurable ones.

```tsx
// Prefer this — composable
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent>{children}</CardContent>
</Card>

// Over this — configurable
<Card
  title={title}
  headerVariant="primary"
  showFooter={true}
  footerActions={actions}
  contentPadding="lg"
/>
```

Compound components are easier to understand, modify, and extend than prop-heavy monoliths.

### 7. Barrel Files Strategy

Barrel files (`index.ts`) are useful for feature public APIs but dangerous when overused:

- DO use barrels at the feature boundary: `features/auth/index.ts` exports what other features can use
- DO NOT create barrels inside feature internals (each subfolder doesn't need an index.ts)
- DO NOT create a single barrel that re-exports all shared components (leads to circular deps and bundle bloat)
- Watch for circular dependency issues — they often come from barrel files

---

## Guidance Workflow

When a user asks for frontend architecture guidance:

1. **Detect framework** — Check package.json, stack-context.md, or ask
2. **Assess context** — Scale, team, complexity, component reuse
3. **Recommend pattern** — Match to Decision Matrix, explain why alternatives don't fit
4. **Load reference** — Read the framework-specific reference for detailed guidance
5. **Apply to their domain** — Map the pattern to their specific features and pages
6. **Address the framework gap** — For React: define everything. For Vue: fill the gaps. For Angular: validate and optimize.
