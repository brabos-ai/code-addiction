# Design Style

Estilo para documentação de UX/UI: layouts, fluxos visuais, specs de componentes.

**Usar em:** design.md, UI specs, component specs

---

## Princípio

Visual e compacto. ASCII para layouts, notação concisa para componentes e estados.

---

## Estrutura Obrigatória

```markdown
# Design: [Feature]

[Contexto UX em 2-3 linhas - objetivo da experiência]

**Mobile-first:** touch 44px, inputs 16px+

---

## Layouts

### [PageName]
[ASCII layout]
→md: [mudanças tablet] | →lg: [mudanças desktop]

## Components

### Existing (reuse)
- [Name]: [path] | [purpose ~10 palavras]

### New
- [Name]: [purpose] | props:{a,b,c} | uses:[X,Y]

## States
[state mappings em uma linha]
```

---

## Notação de Layouts

### ASCII Compacto
```
┌─────────────────┐
│ Header          │
├─────────────────┤
│ Content         │
│ ┌───┐ ┌───┐    │
│ │Card│ │Card│   │
│ └───┘ └───┘    │
├─────────────────┤
│ BottomNav       │
└─────────────────┘
```

### Breakpoints Inline
```
→md: sidebar 240px left
→lg: content max-w-6xl centered, sidebar fixed
```

### Grid Notation
```
mobile: stack (1col)
→md: 2col grid gap-4
→lg: 3col grid gap-6, sidebar 280px
```

---

## Notação de Componentes

### Existing (reutilizar)
```markdown
- Button: components/ui/button.tsx | ações primárias e secundárias
- Card: components/ui/card.tsx | container com sombra
- DataTable: components/ui/data-table.tsx | tabelas com sort/filter
```

### New (criar)
```markdown
- NotificationCard: exibe notificação | props:{notification,onDismiss,onAction} | uses:[Card,Button,Badge]
- NotificationList: lista com infinite scroll | props:{filters,onLoadMore} | uses:[NotificationCard,Skeleton]
```

### Props Notation
```
props:{required*,optional,withDefault=value}
```

---

## Notação de Estados

### Inline Format
```
loading→Skeleton | empty→EmptyState("Sem notificações") | error→Toast
```

### Expanded (quando complexo)
```markdown
### States: NotificationList
- loading: Skeleton repeat=5
- empty: EmptyState icon=bell message="Sem notificações"
- error: Toast variant=destructive + retry button
- partial: Cards loaded + Skeleton at bottom (infinite scroll)
```

---

## Notação de Fluxos

### User Flow Compacto
```
[trigger] → [action] → [feedback] → [result]
```

### Exemplo
```
click bell → open dropdown → load notifications → show list/empty
mark as read → optimistic update → API call → confirm/rollback
```

---

## Exemplo Completo

```markdown
# Design: User Notifications

Sistema de notificações in-app. Dropdown no header com lista e ações rápidas.

**Mobile-first:** touch 44px, bell icon 24px, cards full-width

---

## Layouts

### NotificationDropdown (mobile)
┌─────────────────┐
│ Header ──[Bell]─│ ← badge count
├─────────────────┤
│ ┌─────────────┐ │
│ │ Notification │ │ ← full-width card
│ │ Card        │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Notification │ │
│ └─────────────┘ │
├─────────────────┤
│ [Mark all read] │
└─────────────────┘
→md: dropdown 380px right-aligned
→lg: dropdown 420px, max-h-96 scroll

### NotificationPage (mobile)
┌─────────────────┐
│ ← Notificações  │
├─────────────────┤
│ [Filters]       │
├─────────────────┤
│ Cards stack     │
│ infinite scroll │
├─────────────────┤
│ BottomNav       │
└─────────────────┘
→md: filters sidebar left 200px
→lg: 2col layout, filters sticky

---

## Components

### Existing
- Button: components/ui/button.tsx | ações
- Card: components/ui/card.tsx | container
- Badge: components/ui/badge.tsx | contadores
- DropdownMenu: components/ui/dropdown-menu.tsx | menu bell
- Skeleton: components/ui/skeleton.tsx | loading

### New
- NotificationBell: bell icon com badge | props:{count*,onClick*} | uses:[Button,Badge]
- NotificationCard: card de notificação | props:{notification*,onRead,onAction,onDismiss} | uses:[Card,Button]
- NotificationList: lista com scroll | props:{notifications*,loading,onLoadMore} | uses:[NotificationCard,Skeleton]
- NotificationFilters: filtros de tipo/status | props:{value*,onChange*} | uses:[Select,Button]

---

## States

loading→Skeleton repeat=3 | empty→EmptyState(icon=bell) | error→Toast+retry

### NotificationCard States
- unread: border-l-4 border-primary, bg-muted/50
- read: border-l-4 border-transparent
- hover: bg-accent (desktop only)
- pressed: scale-98 (mobile)

---

## Flows

### View Notifications
bell click → dropdown open → fetch recent → show list/empty/error

### Mark as Read
card click → optimistic bg change → PATCH /notifications/:id/read → confirm/rollback

### Dismiss
swipe left (mobile) / hover+X (desktop) → optimistic remove → DELETE → confirm/rollback

---

## Accessibility

- Bell: aria-label="Notificações, {count} não lidas"
- Cards: role=listitem, focusable
- Dropdown: trap focus, Escape to close
- Touch: 44px minimum targets
```

---

## Anti-Patterns

| Errado | Correto |
|--------|---------|
| Descrever layout em parágrafos | ASCII diagram |
| Listar props em texto corrido | `props:{a,b,c}` notation |
| Estados em múltiplos parágrafos | Inline: `loading→X \| empty→Y` |
| Ignorar breakpoints | `→md: ... \| →lg: ...` |
| Componentes sem composição | `uses:[X,Y,Z]` |

---

## Checklist

- [ ] Layout ASCII para cada tela/componente principal
- [ ] Breakpoints inline (→md, →lg)
- [ ] Componentes existing vs new separados
- [ ] Props com notation compacta
- [ ] Estados em formato inline ou expandido
- [ ] Fluxos de usuário documentados
- [ ] Mobile-first (44px touch, 16px inputs)
