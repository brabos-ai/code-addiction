---
name: add-frontend-development
description: |
  Frontend architecture: state, data fetching, components, forms, routing. Stack-agnostic.
---

# Frontend Development

Stack-agnostic skill for frontend architecture and implementation patterns.

**Use for:** Pages, State, Data Fetching, Types, API integration, Forms, Routing, Components
**Do not use for:** UI/Design (ux-design), Backend (backend-development), mobile-native (React Native/Flutter), build tooling/bundler config

**Stack orientation:** Consult `CLAUDE.md ## Architecture Contract` for the frontend framework, UI library, state management, and data-fetching tool. Apply the principles below using that framework's APIs.

**Reference:** Always consult `CLAUDE.md` for general project standards.

---

## UX Design Integration (MANDATORY)

**BEFORE implementing any frontend component:**

1. **Check for design.md** in the feature docs directory
2. **If design.md exists:** Follow the specs exactly (components, props, states, layout)
3. **If design.md does NOT exist:** Load and follow the UX Design skill (`{{skill:add-ux-design/SKILL.md}}`)

The ux-design skill provides the SaaS UX Pattern Library (Dashboard, Settings, Billing, Auth, DataTables, Workspace), context auto-detection, mobile-first requirements (touch 44px, inputs 16px+), state patterns (loading/empty/error), and component patterns (layout, cards, forms, tables).

**RULE:** Never implement frontend without either design.md OR ux-design skill loaded.

---

## Structure

Organize source files by concern. Exact paths and extensions depend on the framework (see `CLAUDE.md`).

```
[frontend-src]/
├── pages/[page-name].*          # Route-level page components
├── components/
│   ├── features/[feature]/      # Domain components (logic + presentation)
│   │   ├── [feature]-card.*
│   │   ├── [feature]-form.*
│   │   ├── [feature]-table.*
│   │   └── [feature]-columns.*
│   ├── ui/                      # Design system primitives (from UI library)
│   └── layout/                  # Structural components (header, sidebar, footer)
├── composables|hooks/           # Data-fetching and reusable logic
├── stores/[feature]-store.*     # UI state stores
├── types/                       # Shared TypeScript interfaces/types
├── lib/api.*                    # Centralized API client
└── routes.*                     # Route definitions
```

---

## Types (Mirror Backend DTOs)

{"rules":["interfaces not classes","Date fields -> string (JSON serialization)","Enums -> union types (no backend imports)","sync with backend DTOs field-by-field","never use `any`","centralized location"]}

---

## Data Fetching

{"separation":"UI state (local, ephemeral) vs Server state (cache of backend data) — NEVER mix them","requirements":["consistent hierarchical cache keys (e.g. ['resource'], ['resource', id])","loading indicator while fetching","error state handled and displayed","invalidate related cache after mutations","conditional fetching when prerequisites missing (e.g. ID exists)","return library primitives directly — do not wrap unnecessarily"]}

Use the project's data-fetching library (see `CLAUDE.md`) to handle server state.

---

## State Management

Separate state into two categories — never mix them:

| Category | What belongs here | Where it lives |
|----------|-------------------|----------------|
| **UI state** | Sidebar open/close, modals, selections, filters, local toggles | Client-side store (see `CLAUDE.md`) |
| **Server state** | Data from the backend, CRUD results, cached responses | Data-fetching library cache |

UI state is local and ephemeral — losing it on refresh is acceptable. Server state is a cache of the backend (the source of truth). Never store fetched data in a UI store.

---

## API Client

{"rules":["single centralized instance for the entire app","base URL from environment variable — never hard-code","request interceptors for auth token injection","response interceptors for global error handling (401 -> logout, 5xx -> notification)","all data-fetching composables/hooks use this client"]}

---

## Forms

{"patterns":["schema-based validation (Zod or equivalent) for every form","form data type inferred from schema — no manual duplication","schema mirrors the backend DTO for the endpoint","validate on client (UX) AND server (security) — both mandatory","inline validation errors immediately on blur or submit","error messages match the project's language/locale"]}

---

## Pages / Views

{"mandatory_states":["Loading — spinner or skeleton while data loads","Error — error message with retry option","Empty — empty-state message when collection is empty"],"patterns":["data-fetching logic at top of component, before conditionals","container/layout wrapper for consistent spacing","fallback to empty array for list data"]}

---

## Routing

{"patterns":["route structure mirrors feature architecture","auth-required routes wrapped in protected-route guard","each route lazy-loaded to reduce initial bundle size","nested routes for shared layouts (sidebar, header)","detail routes use dynamic params (e.g. /users/:id)"]}

---

## Auth

{"rules":["centralized auth state (current user, token, isAuthenticated)","token stored securely (httpOnly cookies vs localStorage based on threat model)","auth state persisted across page refreshes","API client automatically attaches token to requests","protected route guard redirects unauthenticated users to login","logout clears auth state and cached data"]}

---

## Component Organization

- **Feature components** contain domain logic and compose UI components
- **UI components** are presentational, reusable, and domain-agnostic
- **Layout components** define page structure (header, sidebar, footer)
- KISS: if a component is used in only one place, keep it inline — do not prematurely abstract

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

## Validation Checklist

### Types
- [ ] Types synced with backend DTOs, no `any`

### Data Fetching & State
- [ ] Server data in data-fetching library cache, UI state in client store — never mixed
- [ ] Mutations invalidate related cache

### Forms
- [ ] Schema-based validation on client AND server
- [ ] Error messages match project locale

### Pages / Views
- [ ] Loading, error, and empty states handled
- [ ] Data-fetching logic at top of component, before conditionals

### Routing
- [ ] Protected routes guard authenticated sections
- [ ] Routes lazy-loaded

### UX Integration
- [ ] UX design skill loaded if no `design.md`
- [ ] Mobile-first responsive design applied

### Build
- [ ] Build passes with zero errors (run project's build command)
