<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/frontend-development/SKILL.md -->
---
name: frontend-development
description: |
  Frontend architecture: state management, data fetching, components, forms, routing — stack-agnostic. Consult stack-context.md for framework. Use when implementing frontend features.
---

# Frontend Development

Stack-agnostic skill for frontend architecture and implementation patterns.

**Use for:** Pages, State, Data Fetching, Types, API integration, Forms, Routing, Components
**Do not use for:** UI/Design (ux-design), Backend (backend-development)

**Stack orientation:** Consult `.codeadd/project/stack-context.md` for the frontend framework, UI library, state management, and data-fetching tool. Apply the principles below using that framework's APIs.

**Reference:** Always consult `CLAUDE.md` for general project standards.

---

## UX Design Integration (MANDATORY)

**BEFORE implementing any frontend component:**

1. **Check for design.md** in the feature docs directory
2. **If design.md exists:** Follow the specs exactly (components, props, states, layout)
3. **If design.md does NOT exist:** Load and follow the UX Design skill (`.codeadd/skills/ux-design/SKILL.md`)

**The ux-design skill provides:**
- SaaS UX Pattern Library (Dashboard, Settings, Billing, Auth, etc.)
- Context detection (auto-detect which patterns apply)
- Mobile-first requirements (touch 44px, inputs 16px+)
- State patterns (loading, empty, error)
- Component patterns (layout, cards, forms, tables)

**RULE:** Never implement frontend without either design.md OR ux-design skill loaded.

---

## Structure

Organize source files by concern. Exact paths and extensions depend on the framework (see `stack-context.md`).

```
[frontend-src]/
├── pages/[page-name].*          # Route-level page components
├── components/
│   ├── features/[feature]/      # Domain components (logic + presentation)
│   └── ui/                      # Design system / reusable primitives
├── composables|hooks/           # Data-fetching and reusable logic
├── stores/[feature]-store.*     # UI state stores
├── types/                       # Shared TypeScript interfaces/types
├── lib/api.*                    # Centralized API client
└── routes.*                     # Route definitions
```

---

## Types (Mirror Backend DTOs)

{"rules":["interfaces not classes","Date fields -> string (JSON serialization)","Enums -> union types (no backend imports)","sync with backend DTOs","never use `any`"]}

Principles:
- Frontend interfaces must mirror backend response DTOs field-by-field
- `Date` fields become `string` (JSON serialization)
- Backend enums become union types — no cross-boundary imports
- Use `interface`, not `class`, for data shapes
- Keep types in a centralized location and import everywhere

---

## Data Fetching

{"separation":"UI state (local, ephemeral) vs Server state (cache of backend data) — NEVER mix them"}

Use the project's data-fetching library (see `stack-context.md`) to handle server state. Every data-fetch must address:

1. **Cache keys** — consistent, hierarchical (e.g. `['resource']`, `['resource', id]`)
2. **Loading state** — always show a loading indicator while fetching
3. **Error state** — always handle and display errors
4. **Cache invalidation** — after mutations, invalidate related cached data
5. **Conditional fetching** — only fetch when prerequisites are met (e.g. ID exists)

{"patterns":["cache keys consistent and hierarchical","invalidate cache on mutation","conditional fetching when prerequisites missing","return the library's primitives directly — do not wrap unnecessarily"]}

---

## State Management

Separate state into two categories — never mix them:

| Category | What belongs here | Where it lives |
|----------|-------------------|----------------|
| **UI state** | Sidebar open/close, modals, selections, filters, local toggles | Client-side store (see `stack-context.md`) |
| **Server state** | Data from the backend, CRUD results, cached responses | Data-fetching library cache |

Principles:
- UI state is local and ephemeral — losing it on refresh is acceptable
- Server state is a cache of the backend — the backend is the source of truth
- Never store fetched data in a UI store; let the data-fetching library manage it

---

## API Client

{"rules":["single centralized instance","base URL from environment variable","interceptors for auth token injection","interceptors for global error handling (401 -> logout, 5xx -> notification)"]}

Principles:
- Create ONE API client instance for the entire app
- Base URL comes from an environment variable — never hard-code
- Add request interceptors to attach auth tokens automatically
- Add response interceptors for global error handling (e.g. 401 triggers logout)
- All data-fetching composables/hooks use this client

---

## Forms

{"patterns":["schema-based validation (Zod or equivalent)","form data type inferred from schema","validate on client AND server","immediate user feedback on validation errors"]}

Principles:
- Define a validation schema (Zod recommended) for every form
- Infer the form data type from the schema — no manual type duplication
- Schema should mirror the backend DTO for the endpoint
- Show validation errors inline, immediately on blur or submit
- Validate on client for UX, validate on server for security — both are mandatory
- Error messages should match the project's language/locale

---

## Pages / Views

Every page that displays data MUST handle three states:

1. **Loading** — show a spinner or skeleton while data loads
2. **Error** — show an error message with retry option
3. **Empty** — show an empty-state message when data is an empty collection

{"patterns":["loading/error/empty states MANDATORY for every data page","data-fetching logic at top of component","container/layout wrapper for consistent spacing","fallback to empty array for list data"]}

---

## Routing

{"patterns":["routes reflect feature architecture","protected routes for authenticated sections","lazy loading per route for performance","nested routes for layout inheritance","dynamic params for detail views"]}

Principles:
- Route structure mirrors the feature architecture
- Auth-required routes are wrapped in a protected-route guard
- Each route is lazy-loaded to reduce initial bundle size
- Use nested routes for shared layouts (sidebar, header)
- Detail routes use dynamic parameters (e.g. `/users/:id`)

---

## Auth

Principles:
- Centralized auth state (current user, token, isAuthenticated)
- Token stored securely (consider httpOnly cookies vs localStorage based on threat model)
- Auth state persisted across page refreshes
- API client automatically attaches token to requests
- Protected route guard redirects unauthenticated users to login
- Logout clears auth state and cached data

---

## Component Organization

```
components/
├── features/[feature]/          # Domain-specific components
│   ├── [feature]-card.*
│   ├── [feature]-form.*
│   ├── [feature]-table.*
│   └── [feature]-columns.*
├── ui/                          # Design system primitives (from UI library)
└── layout/                      # Structural components (header, sidebar, footer)
```

Principles:
- **Feature components** contain domain logic and compose UI components
- **UI components** are presentational, reusable, and domain-agnostic
- **Layout components** define page structure (header, sidebar, footer)
- KISS: if a component is used in only one place, keep it inline — do not prematurely abstract into a shared component or utility

---

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `user-profile-card.*` |
| Components | PascalCase | `UserProfileCard` |
| Functions/variables | camelCase | `getUserById`, `isLoading` |
| Types/interfaces | PascalCase | `UserProfile`, `CreateUserRequest` |
| Stores | camelCase with domain prefix | `useAuthStore`, `uiStore` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

---

## Performance

- **Lazy loading:** routes and heavy components loaded on demand
- **Memoization:** only where measurements show a performance gain — never premature
- **Bundle size:** monitor and avoid unnecessary dependencies
- **Images:** use optimized formats and lazy loading
- KISS: do not optimize without evidence of a problem

---

## SaaS Context (from ux-design)

**When NO design.md exists, auto-detect context and apply patterns:**

| Keywords in feature | Context | Pattern to use |
|---------------------|---------|----------------|
| dashboard, metrics, KPIs | Dashboard | KPIs > Charts > Activity |
| settings, preferences | Settings | sidebar > forms |
| billing, pricing, plans | Billing | pricing cards, usage meters |
| list, table, CRUD | DataTables | filters > table > pagination |
| login, signup, auth | Auth | split screen, social buttons |
| team, members, workspace | Workspace | members list, invite flow |

**Always apply from ux-design:**
- Mobile-first breakpoints
- Loading/empty/error states
- Touch targets 44px
- Input font 16px+

---

## Validation Checklist

### Types
- [ ] Interfaces defined centrally (not classes)
- [ ] `Date` fields mapped to `string`
- [ ] Enums mapped to union types (no backend imports)
- [ ] Types synced with backend DTOs
- [ ] No use of `any`

### Data Fetching
- [ ] Cache keys consistent and hierarchical
- [ ] Mutations invalidate related cached data
- [ ] Conditional fetching when prerequisites missing
- [ ] Server data managed by data-fetching library, not UI store

### State Management
- [ ] UI state (toggles, selections, filters) in client-side store
- [ ] Server data in data-fetching library cache — never in UI store

### Forms
- [ ] Schema-based validation for all fields
- [ ] Form data type inferred from schema
- [ ] Validation on client AND server
- [ ] Error messages match project locale

### Pages / Views
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Empty state handled for list views
- [ ] Layout wrapper applied for consistent spacing
- [ ] Data-fetching logic at top of component, before conditionals

### Routing
- [ ] Protected routes guard authenticated sections
- [ ] Routes lazy-loaded
- [ ] Nested routes for shared layouts
- [ ] Dynamic params for detail views

### UX Integration
- [ ] UX design skill loaded if no `design.md`
- [ ] Mobile-first responsive design
- [ ] SaaS context patterns applied

### Build
- [ ] Build passes with zero errors (run project's build command)
