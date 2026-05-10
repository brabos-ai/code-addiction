---
name: add-frontend-architecture
description: Frontend architecture consultant for project structure, folder organization, feature boundaries, and scaling decisions. Framework-aware (React, Vue, Angular). Use when user asks about frontend folder structure, "components folder is a mess", "where should this go", over-engineering, slices, feature folders, or starting/refactoring a frontend project. Guides decisions only — does not implement (use add-frontend-development) or design UI (use ux-design).
---

# Frontend Architecture Consultant

Guide structural decisions for frontend projects. Choose the **simplest** pattern that keeps the team productive as the project grows.

---

## Framework Detection

Detect first — each framework has a different opinion level about structure.

| Framework | Opinion | Skill role | Reference |
|-----------|---------|-----------|-----------|
| **Angular** | High (modules, DI, routing built-in) | Validate/optimize within Angular | `references/angular.md` |
| **Vue** | Medium (Composition API + Pinia, structure free) | Fill gaps Vue leaves open | `references/vue.md` |
| **React** | Low (almost nothing decided) | Define what React doesn't | `references/react.md` |

Detect via `package.json`, `stack-context.md`, or ask. For Svelte/Solid/etc., apply universal principles below.

---

## Decision Navigator

### Context Questions

1. **Scale** — Small (1-10 pages) / Medium (10-30) / Large (30+)
2. **Team size** — Solo (1-2) / Medium (3-5) / Large (6+)
3. **Component reuse** — Minimal / Moderate / Heavy (design system)
4. **Domain complexity** — Light (CRUD) / Moderate (multi-step flows) / Heavy (real-time, rich interactions)
5. **Framework** — Determines how much the skill must define

### Decision Matrix

| Context | Pattern | Why |
|---------|---------|-----|
| Small scale, solo dev, light domain | **Simple Component-Based** | Flat structure, fast to navigate, no ceremony |
| Medium scale, small-medium team, moderate domain | **Feature-Based** | Features co-located, scales well, easy to understand |
| Large scale (30+ pages, 6+ devs), heavy domain, complex feature interactions | **Feature-Sliced Design** | Formalized layers, strict boundaries; overkill for solo/small/CRUD |

**Over-engineering signals:** more folders than files; barrel files everywhere causing circular deps; `/shared` with 50+ unnavigable components; layers added "because architecture says so".

**Under-engineering signals:** flat `components/` with 80+ files; API calls inside buttons; state scattered across stores/components/URL; full-text search needed to find anything; week-long onboarding.

---

## Architecture Patterns

### Simple Component-Based

For small projects where anything more is overhead.

```
src/
  pages/         home.tsx, about.tsx, settings.tsx
  components/    header.tsx, footer.tsx, user-card.tsx     (flat)
  hooks/         use-auth.ts, use-users.ts                  (or composables/)
  lib/           api.ts
  types/         user.ts
  app.tsx
  routes.tsx
```

Rules: pages = route-level; components folder flat; no feature folders; direct imports fine.

**Graduate when:** `components/` exceeds 25-30 files.

### Feature-Based

For medium projects. Frontend equivalent of Vertical Slice — organize by business feature. See framework-specific reference for details.

```
src/
  features/
    auth/        components/  hooks|composables/  types.ts  index.ts
    products/    components/  hooks|composables/  types.ts  index.ts
    orders/      components/  hooks|composables/  types.ts  index.ts
  shared/
    components/  ui/          (design system primitives)
                 layout/      (header, sidebar, footer)
    hooks|composables/
    lib/         api.ts
    types/
  pages/         (thin, compose features)
  app.tsx
```

Rules:
- Features own their components, hooks, types
- Cross-feature imports go through `index.ts` public API only — never internal files
- `shared/` = truly reusable, domain-agnostic code only
- Pages are thin — compose features, no business logic

### Feature-Sliced Design (FSD)

For large projects with many devs and complex feature interactions.

```
src/
  app/         (global setup: providers, routing, styles)
  pages/       (route-level — combine widgets and features)
  widgets/     (complex UI blocks — combine features and entities)
  features/    (user interactions — forms, toggles, actions)
  entities/    (business objects — user, product, order)
  shared/      (infrastructure — UI kit, API client, utilities)
```

**Strict dependency rule:** `app → pages → widgets → features → entities → shared`. Each layer imports only from layers below. Never upward.

Within each layer, organize by **slice** (domain concept):

```
features/
  add-to-cart/      ui/  model/  api/  index.ts
  apply-discount/   ui/  model/  api/  index.ts
```

**Apply FSD when:** 6+ frontend devs, 30+ pages, complex feature interactions, strict boundaries needed. Skill's role is to decide *when* FSD fits and apply it pragmatically — not replicate the full spec.

---

## Universal Principles

| Principle | Rule |
|-----------|------|
| **Component roles** | Page (compose, no logic) / Feature (domain logic) / UI (presentational, props only) / Layout (structural). Never mix — buttons don't fetch, pages don't compute. |
| **Feature isolation** | Features import from `shared/` and self only. Cross-feature → through public `index.ts`. Need data from another feature → shared hook or data layer, never internal imports. |
| **State location** | Component state → in component. Feature state → feature store/hook. Server state → fetching lib cache. Global UI → app store. URL state → router params. Don't hoist higher than needed; don't globalize everything. |
| **Thin pages** | Pages set up layout, compose features, handle route params, set metadata. Never contain business logic, direct API calls, or complex state. |
| **Shared discipline** | Good: UI primitives, layout, API client, auth hooks, utilities, API types. Bad: feature components disguised as reusable, business logic, single-feature consumers. |
| **Barrel strategy** | DO at feature boundary (`features/auth/index.ts`). DON'T inside internals or as one mega-barrel of all shared (causes circular deps + bundle bloat). |

---

## When NOT to Use

- [ ] User asks how to **implement** a feature (routing, forms, data fetching) — use `add-frontend-development`
- [ ] User asks about **UI/UX design**, styling, components visuals — use `add-ux-design` / `frontend-design`
- [ ] User asks about **backend** structure or APIs — use `add-backend-architecture`
- [ ] User wants to **scaffold** a new project from scratch — use `add-project-scaffolding`
- [ ] Question is about a specific library's API — use Context7 docs

---

## Workflow

- [ ] Detect framework (package.json, stack-context.md, or ask)
- [ ] Assess context: scale, team size, component reuse, domain complexity
- [ ] Match to Decision Matrix; explain why alternatives don't fit
- [ ] Load framework-specific reference (`references/{react|vue|angular}.md`)
- [ ] Map the pattern to user's actual features and pages
- [ ] Address framework gap: React → define everything; Vue → fill gaps; Angular → validate/optimize
