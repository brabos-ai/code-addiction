# Arquitetura Frontend -- SaaS de Gestao de Projetos

## 1. Framework e Stack Detectados

- **Framework:** React (opiniao baixa -- tudo precisa ser definido por voce)
- **Bundler:** Vite (SPA, sem SSR/file-based routing)
- **Data fetching:** TanStack Query (cache e server state)
- **State management:** Zustand (global UI state)
- **Tipo de app:** SPA dashboard/admin (SEO nao e prioridade)

## 2. Avaliacao de Contexto

| Criterio | Sua Situacao | Nivel |
|----------|-------------|-------|
| **Escala** | Dashboard, projetos, kanban, time tracking, relatorios, conta, equipe = ~7 areas de feature, estimativa de 15-25 paginas | Medio |
| **Time** | 3 devs frontend | Medio |
| **Reuso de componentes** | Board kanban, tabelas, cards de projeto, formularios -- moderado | Moderado |
| **Complexidade de dominio** | Kanban (drag-and-drop, estados), time tracking (timers, calculos), relatorios (graficos, filtros) | Moderado-Alto |

## 3. Padrao Recomendado: Feature-Based

O padrao **Feature-Based** e a escolha certa para o seu caso. Veja por que os outros nao se encaixam:

- **Simple Component-Based:** Voce ja passou desse ponto. 60+ arquivos numa pasta `components/` e exatamente o sinal de que essa abordagem nao escala mais. O limite saudavel e ~25-30 arquivos.
- **Feature-Sliced Design (FSD):** Exagerado para 3 devs e ~20 paginas. FSD brilha com 6+ devs e 30+ paginas com interacoes complexas entre features. Adotar agora significaria mais cerimonia do que valor.

**Feature-Based** resolve seu problema principal: agrupar por dominio de negocio em vez de por tipo tecnico. Cada dev pode ser responsavel por features especificas sem pisar no codigo dos outros.

## 4. Estrutura Proposta

```
src/
  pages/                              (route-level, composicao FINA)
    dashboard-page.tsx
    projects-page.tsx
    project-detail-page.tsx
    board-page.tsx
    time-tracking-page.tsx
    reports-page.tsx
    account-settings-page.tsx
    team-page.tsx

  features/
    dashboard/
      components/
        stats-overview.tsx
        recent-activity.tsx
        project-summary-card.tsx
      hooks/
        use-dashboard-stats.ts
        use-recent-activity.ts
      types.ts
      index.ts                        (API publica da feature)

    projects/
      components/
        project-list.tsx
        project-card.tsx
        project-form.tsx
        project-filters.tsx
      hooks/
        use-projects.ts
        use-project-detail.ts
        use-create-project.ts
        use-update-project.ts
      types.ts
      index.ts

    board/
      components/
        kanban-board.tsx
        kanban-column.tsx
        kanban-card.tsx
        card-detail-modal.tsx
        column-header.tsx
      hooks/
        use-board.ts
        use-move-card.ts
        use-board-filters.ts
      types.ts
      index.ts

    time-tracking/
      components/
        timer-widget.tsx
        time-entry-list.tsx
        time-entry-form.tsx
        weekly-summary.tsx
      hooks/
        use-timer.ts
        use-time-entries.ts
        use-log-time.ts
      types.ts
      index.ts

    reports/
      components/
        report-filters.tsx
        time-report-chart.tsx
        project-progress-chart.tsx
        report-export-button.tsx
      hooks/
        use-time-report.ts
        use-project-report.ts
      types.ts
      index.ts

    account/
      components/
        profile-form.tsx
        password-form.tsx
        notification-settings.tsx
      hooks/
        use-profile.ts
        use-update-profile.ts
      types.ts
      index.ts

    team/
      components/
        member-list.tsx
        member-invite-form.tsx
        role-selector.tsx
        member-card.tsx
      hooks/
        use-team-members.ts
        use-invite-member.ts
        use-update-role.ts
      types.ts
      index.ts

  shared/
    components/
      ui/                             (primitivos de design system)
        button.tsx
        input.tsx
        select.tsx
        modal.tsx
        table.tsx
        card.tsx
        badge.tsx
        dropdown-menu.tsx
        avatar.tsx
        skeleton.tsx
      layout/
        app-layout.tsx
        sidebar.tsx
        header.tsx
        page-wrapper.tsx
    hooks/
      use-debounce.ts
      use-media-query.ts
      use-click-outside.ts
    lib/
      api.ts                          (instancia axios/fetch configurada)
      format.ts                       (formatDate, formatCurrency, formatDuration)
      cn.ts                           (classname merge utility)
    types/
      api.ts                          (tipos genericos de resposta da API)
    stores/
      ui-store.ts                     (sidebar aberta/fechada, theme -- Zustand)
      auth-store.ts                   (usuario logado, token -- Zustand)

  routes.tsx                          (definicao central de rotas)
  app.tsx                             (providers: QueryClient, Router, Zustand)
  main.tsx                            (entry point do Vite)
```

## 5. Regras de Arquitetura Para o Time

### Paginas sao finas

Paginas apenas compoem features. Nunca contem logica de negocio.

```tsx
// pages/board-page.tsx -- CORRETO
import { KanbanBoard } from '@/features/board'
import { PageWrapper } from '@/shared/components/layout/page-wrapper'
import { useParams } from 'react-router-dom'

export default function BoardPage() {
  const { projectId } = useParams()
  return (
    <PageWrapper title="Board">
      <KanbanBoard projectId={projectId!} />
    </PageWrapper>
  )
}
```

### Features exportam via index.ts

Outros modulos importam da feature, nunca de arquivos internos.

```ts
// features/board/index.ts
export { KanbanBoard } from './components/kanban-board'
export { useBoard } from './hooks/use-board'
export type { BoardColumn, BoardCard } from './types'
```

```ts
// CORRETO -- importa da API publica
import { KanbanBoard } from '@/features/board'

// ERRADO -- importa de arquivo interno
import { KanbanBoard } from '@/features/board/components/kanban-board'
```

### Hooks encapsulam data fetching por feature

Cada feature possui seus proprios hooks de query/mutation com TanStack Query. Server state **nunca** vai para Zustand.

```ts
// features/time-tracking/hooks/use-time-entries.ts
export function useTimeEntries(projectId: string, dateRange: DateRange) {
  return useQuery({
    queryKey: ['time-entries', projectId, dateRange],
    queryFn: () => api.get(`/projects/${projectId}/time-entries`, { params: dateRange }),
  })
}

// features/time-tracking/hooks/use-log-time.ts
export function useLogTime() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LogTimeInput) => api.post('/time-entries', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  })
}
```

### Zustand so para UI state global

```ts
// shared/stores/ui-store.ts -- sidebar, theme
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

// shared/stores/auth-store.ts -- usuario atual, token
export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
```

Dados do servidor (projetos, membros, time entries) ficam no cache do TanStack Query. Zustand **nao e cache de API**.

### Comunicacao entre features via cache

Se o dashboard precisa mostrar dados de projetos, ele usa os mesmos query keys -- o TanStack Query cuida do cache compartilhado.

```tsx
// features/dashboard/hooks/use-dashboard-stats.ts
// Pode reusar a mesma queryKey de projects se fizer sentido
import { api } from '@/shared/lib/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats'),
  })
}
```

Se Feature A cria um projeto e invalida `['projects']`, o dashboard que tambem consome projetos recebe a atualizacao automaticamente. Nenhum import direto entre features e necessario.

## 6. Onde Cada Tipo de State Vive

| Tipo de State | Onde | Exemplo no seu app |
|---------------|------|-------------------|
| **Component state** | `useState` local | Input do formulario de convite, modal aberto/fechado |
| **Feature state** | Hook da feature | Filtros do board, timer ativo no time-tracking |
| **Server state** | TanStack Query cache | Lista de projetos, membros, time entries |
| **Global UI state** | Zustand stores | Sidebar aberta, tema, usuario logado |
| **URL state** | React Router params | Projeto selecionado (`/projects/:id`), aba ativa |

## 7. Plano de Migracao da Estrutura Atual

Voce nao precisa migrar tudo de uma vez. Faca feature por feature:

1. **Comece pela feature mais isolada** -- `account` ou `team` provavelmente tem menos dependencias cruzadas
2. **Crie a pasta `features/account/`**, mova os componentes relevantes da pasta `components/` para la, crie os hooks
3. **Crie o `index.ts`** da feature e atualize os imports nos arquivos que consomem
4. **Repita** para a proxima feature. Sugiro esta ordem: account > team > time-tracking > reports > projects > board > dashboard (dashboard por ultimo porque depende das outras)
5. **O que sobrar** na pasta `components/` apos mover tudo para features provavelmente e `shared/` (componentes de UI reutilizaveis)

Cada feature migrada e um PR separado. 3 devs podem trabalhar em paralelo em features diferentes depois que a estrutura de pastas estiver criada.

## 8. Sinais de Over-Engineering Para Vigiar

- Nao crie subpastas dentro de `components/` de uma feature se ela tem menos de 6-8 componentes -- mantenha flat
- Nao crie barrel files (`index.ts`) para cada subpasta interna -- so no nivel da feature
- Se uma feature tem apenas 1-2 componentes, ela provavelmente nao precisa ser uma feature separada (agrupe com outra)
- Nao force o padrao container/presentational em todo componente -- use quando ha reuso real

## 9. Configuracao de Path Aliases

No `vite.config.ts`, configure o alias `@/` para simplificar imports:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

E no `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Isso permite imports limpos como `import { KanbanBoard } from '@/features/board'` em vez de caminhos relativos frageis.
