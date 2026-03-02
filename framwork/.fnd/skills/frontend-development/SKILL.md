---
name: frontend-development
description: |
  Frontend patterns: State, API, Types, Hooks, Forms, Routing. Integrates with ux-design for UI patterns.
---

# Frontend Development

Skill para implementação de Frontend seguindo padrões do projeto.

**Use para:** Pages, Hooks, State, Types, API integration, Forms, Routing
**Não use para:** UI/Design (ux-design), Backend (backend-development)

**Referência:** Sempre consultar `CLAUDE.md` para padrões gerais do projeto.

---

## UX Design Integration (MANDATORY)

**BEFORE implementing any frontend component:**

1. **Check for design.md:**
```bash
cat "docs/features/${FEATURE_ID}/design.md" 2>/dev/null
```

2. **If design.md exists:** Follow the specs exactly (components, props, states, layout)

3. **If design.md NOT exists:** Load and follow UX Design skill:
```bash
cat .fnd/skills/ux-design/SKILL.md
```

**The ux-design skill provides:**
- SaaS UX Pattern Library (Dashboard, Settings, Billing, Auth, etc.)
- Context detection (auto-detect which patterns apply)
- Mobile-first requirements (touch 44px, inputs 16px+)
- State patterns (loading, empty, error)
- Component patterns (layout, cards, forms, tables)

**RULE:** Never implement frontend without either design.md OR ux-design skill loaded.

---

## Structure

```
apps/frontend/src/
├── pages/[page-name].tsx
├── components/
│   ├── features/[feature]/[Component].tsx
│   └── ui/[component].tsx
├── hooks/use-[feature].ts
├── stores/[feature]-store.ts
├── types/index.ts
├── lib/api.ts
└── routes.tsx
```

---

## Types (Mirror Backend DTOs)

{"location":"apps/frontend/src/types/index.ts"}

```typescript
// Backend DTO → Frontend Interface
// Date → string (JSON serialization)
// Enum → union type (no backend import)

export interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';  // NOT enum import
  createdAt: string;  // NOT Date
}
```

{"rules":["interfaces not classes","Date→string","Enum→union type","no @fnd/domain imports","sync with backend DTOs"]}

---

## Hooks (Data Fetching)

{"location":"apps/frontend/src/hooks/use-[feature].ts"}

```typescript
// Query hook
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users').then(r => r.data),
  });
}

// Single resource
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get<User>(`/users/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

// Mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) =>
      api.post<User>('/users', data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

{"patterns":["queryKey consistent","enabled for conditional","invalidate on mutation","return mutation not wrapped"]}

---

## State Management

{"location":"apps/frontend/src/stores/[feature]-store.ts"}

```typescript
interface UIState {
  sidebarOpen: boolean;
  selectedUserId: string | null;
  toggleSidebar: () => void;
  selectUser: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  selectedUserId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  selectUser: (id) => set({ selectedUserId: id }),
}));
```

{"useLocalState":["UI state","modal/sidebar toggles","selections","filters"]}
{"useServerState":["server data","CRUD operations","cache management"]}

---

## API Integration

{"location":"apps/frontend/src/lib/api.ts"}

```typescript
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

{"rules":["use api instance","baseURL from env","interceptors for auth"]}

---

## Forms

```typescript
const schema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.enum(['owner', 'admin', 'member']).optional(),
});

type FormData = z.infer<typeof schema>;

export function UserForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '' },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('email')} />
      {form.formState.errors.email && <span>{form.formState.errors.email.message}</span>}
    </form>
  );
}
```

{"patterns":["schema mirrors DTO","typed FormData","error messages in PT-BR"]}

---

## Pages

{"location":"apps/frontend/src/pages/[page-name].tsx"}

```typescript
export function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();

  // MANDATORY: Handle all states (from ux-design skill)
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!users?.length) return <EmptyState title="Nenhum usuário" />;

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>
      <DataTable
        columns={columns}
        data={users}
        onDelete={(id) => deleteUser.mutate(id)}
      />
    </div>
  );
}
```

{"patterns":["hooks at top","loading/error/empty states MANDATORY","container layout","data ?? [] fallback"]}

---

## Routing

{"location":"apps/frontend/src/routes.tsx"}

```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'users',
        element: <ProtectedRoute><UsersPage /></ProtectedRoute>,
      },
      { path: 'users/:id', element: <UserDetailPage /> },
    ],
  },
]);
```

{"patterns":["nested routes","ProtectedRoute wrapper","dynamic :id params"]}

---

## Auth Store

{"location":"apps/frontend/src/stores/auth-store.ts"}

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      get isAuthenticated() { return !!get().token; },
    }),
    { name: 'auth-storage' }
  )
);
```

---

## Component Organization

```
components/
├── features/[feature]/
│   ├── [feature]-card.tsx
│   ├── [feature]-form.tsx
│   ├── [feature]-table.tsx
│   └── columns.tsx
├── ui/ (design system - shadcn)
└── layout/ (header, sidebar, footer)
```

---

## SaaS Context (from ux-design)

**When NO design.md exists, auto-detect context and apply patterns:**

| Keywords in feature | Context | Pattern to use |
|---------------------|---------|----------------|
| dashboard,metrics,KPIs | Dashboard | KPIs→Charts→Activity |
| settings,preferences | Settings | sidebar→forms |
| billing,pricing,plans | Billing | pricing cards, usage meters |
| list,table,CRUD | DataTables | filters→table→pagination |
| login,signup,auth | Auth | split screen, social buttons |
| team,members,workspace | Workspace | members list, invite flow |

**Always apply from ux-design:**
- Mobile-first breakpoints
- Loading/empty/error states
- Touch targets 44px
- Input font 16px+

---

## Validation Checklist

### Types
- [ ] Interfaces defined in `types/index.ts` (not classes)
  → Check: `export interface` used, not `export class`
- [ ] `Date` fields mapped to `string` (JSON serialization)
  → Check: no `Date` type in frontend interfaces, use `string`
- [ ] Enums mapped to union types (no backend enum imports)
  → Check: `'value1' | 'value2'` instead of imported enum
- [ ] Types synced with backend DTOs
  → Check: frontend interfaces match backend response DTO fields

### Hooks
- [ ] Hook files follow `use-[feature].ts` naming
  → Check: hook filenames use correct pattern
- [ ] `queryKey` is consistent and hierarchical
  → Check: query keys follow `['resource', id?]` pattern
- [ ] Mutations invalidate related queries on success
  → Check: `onSuccess` calls `queryClient.invalidateQueries`

### State Management
- [ ] Local/UI state uses Zustand store (sidebars, modals, selections)
  → Check: UI toggles use `create<State>()`, not useState
- [ ] Server data uses React Query (CRUD, cache)
  → Check: data fetching uses `useQuery`/`useMutation`, not local state

### Forms
- [ ] Zod schema validates all fields
  → Check: schema covers every form field with proper validators
- [ ] `FormData` type inferred from schema (`z.infer<typeof schema>`)
  → Check: no manual form type, uses Zod inference
- [ ] Error messages in PT-BR
  → Check: validation messages use Portuguese text

### Pages
- [ ] Loading state handled (`if (isLoading) return <LoadingSpinner />`)
  → Check: loading guard exists before data render
- [ ] Error state handled (`if (error) return <ErrorMessage />`)
  → Check: error guard exists before data render
- [ ] Empty state handled (`if (!data?.length) return <EmptyState />`)
  → Check: empty guard exists for list pages
- [ ] Container layout applied
  → Check: page uses `container` class or layout wrapper
- [ ] Hooks called at top of component (before conditionals)
  → Check: all hooks before any `if` returns

### Routing
- [ ] Protected routes wrapped with `<ProtectedRoute>`
  → Check: auth-required routes use wrapper component
- [ ] Nested routes structure maintained
  → Check: routes use `children` array for nesting
- [ ] Dynamic params use `:id` pattern
  → Check: detail routes use `path: 'resource/:id'`

### UX Integration
- [ ] UX design skill loaded if no `design.md`
  → Check: `.fnd/skills/ux-design/SKILL.md` read when design.md absent
- [ ] Mobile-first responsive design
  → Check: components use responsive breakpoints (sm, md, lg)
- [ ] SaaS context patterns applied
  → Check: feature matches SaaS pattern table in skill

### Build
- [ ] Build passes: `npm run build -w @fnd/frontend`
  → Check: run build command, zero errors
