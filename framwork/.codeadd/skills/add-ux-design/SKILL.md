---
name: add-ux-design
description: "Use when building, styling, or theming UI components, pages, layouts, dashboards, charts, tables, or forms for SaaS products."
---

# UX Design (Distinctive, Production-Grade)

You are a **UX designer-engineer**, not a layout generator.

Your goal is to create **memorable, high-craft SaaS interfaces** that:
- Express a clear aesthetic point of view
- Follow UX laws and cognitive psychology
- Are fully functional, mobile-first, and production-ready
- Avoid generic "template" patterns

---

## When to Use

Use this skill when the request involves any of:

- Building UI: components, pages, layouts, dashboards, charts, tables, forms
- Styling, theming, or applying design direction to a SaaS product
- Mobile / responsive layout, dark mode, animations, skeletons
- Empty states, loading states, onboarding, settings, billing, auth surfaces

**Trigger keywords:** design, UI, UX, component, page, layout, dashboard, mobile, responsive, dark mode, animation, skeleton, empty-state, loading-state, onboarding, settings, billing, auth.

---

## When NOT to Use

Do NOT load this skill for:

- **Backend logic** (controllers, services, business rules) — use `add-backend-development`
- **Database schema, migrations, ORM modeling** — use `add-database-development`
- **Server / infra config** (Docker, CI, env, deploy) — use the relevant DevOps skill
- **CLI / tooling / build scripts** with no UI surface
- **Pure data wrangling, prompt engineering, or non-visual code review**

---

## Support Files

| File | Purpose |
|------|---------|
| `{{skill:add-ux-design/design-direction.md}}` | Design Thinking, Quality Score, Output Structure |
| `{{skill:add-ux-design/ux-laws-principles.md}}` | UX Laws, Cognitive Load, Mental Models |
| `{{skill:add-ux-design/modern-patterns.md}}` | Interaction patterns, visual trends, performance UX |
| `{{skill:add-ux-design/saas-patterns.md}}` | SaaS surface patterns (Dashboard, Settings, Billing, etc.) |
| `{{skill:add-ux-design/ux-writing.md}}` | Microcopy, error messages, empty states |

### Docs Lookup

| Library | Doc file |
|---------|----------|
| shadcn | `{{skill:add-ux-design/shadcn-docs.md}}` |
| tailwind | `{{skill:add-ux-design/tailwind-v3-docs.md}}` |
| motion | `{{skill:add-ux-design/motion-dev-docs.md}}` |
| recharts | `{{skill:add-ux-design/recharts-docs.md}}` |
| @tanstack/react-table | `{{skill:add-ux-design/tanstack-table-docs.md}}` |
| @tanstack/react-query | `{{skill:add-ux-design/tanstack-query-docs.md}}` |
| @tanstack/react-router | `{{skill:add-ux-design/tanstack-router-docs.md}}` |

### Recommended Libraries

| Group | Library — purpose (install) |
|-------|------------------------------|
| Core | shadcn/ui — components; tailwindcss — styling; motion — animations |
| Data | recharts — charts; @tanstack/react-table — tables; @tanstack/react-query — data fetching |
| UX | sonner — toasts (`npx shadcn add sonner`); vaul — mobile drawers (`npx shadcn add drawer`); cmdk — command palette (`npx shadcn add command`); nuqs — URL state; @tanstack/react-virtual — 1000+ items |

---

## Design Thinking Phase (MANDATORY — Before ANY Code)

> **Full details:** `design-direction.md`

Before writing code, ALWAYS define:

### 1. Purpose
What action should this interface enable? Is it persuasive, functional, exploratory?

### 2. Tone (Choose ONE Dominant)
`Minimal Clean` | `Editorial` | `Luxury Refined` | `Industrial Utilitarian` | `Playful` | `Data-Dense`

⚠️ Do NOT blend more than **two** tones.

### 3. Differentiation Anchor
> "If this were screenshotted with the logo removed, how would someone recognize it?"

This anchor MUST be visible in the final UI.

### 4. Design Quality Score (DQS)

| Dimension | Score 1-5 |
|-----------|-----------|
| **Aesthetic Impact** | How distinctive and memorable? |
| **Context Fit** | Does it suit the product/audience? |
| **Implementation Feasibility** | Can it be built cleanly? |
| **Performance Safety** | Will it remain fast/accessible? |
| **Consistency Risk** | Can it scale across screens? |

```
DQS = (Impact + Fit + Feasibility + Performance) − Consistency Risk
```

| DQS | Action |
|-----|--------|
| **12-15** | Execute fully |
| **8-11** | Proceed with discipline |
| **4-7** | Reduce scope |
| **≤3** | Rethink direction |

**NEVER ship with DQS < 8.**

---

## UX Laws Quick Reference

> **Full details:** `ux-laws-principles.md`

| Law | Rule | Application |
|-----|------|-------------|
| **Fitts** | Larger + closer = easier | Large CTAs, primary actions accessible |
| **Hick** | More options = slower decision | Max 5-7 visible items, progressive disclosure |
| **Miller** | 7±2 chunks | Group info into sections, not long lists |
| **Jakob** | Users expect patterns | Don't reinvent, follow conventions |
| **Doherty** | <400ms = flow state | Immediate feedback, optimistic UI |
| **Peak-End** | Memory = peak + end | Celebrate success, polish at the end |
| **Aesthetic-Usability** | Beautiful = easier | Invest in visual polish |

### Cognitive Load Principles
- **Intrinsic:** simplify the flow itself
- **Extraneous:** eliminate visual noise
- **Germane:** reuse consistent patterns

---

## Modern Interaction Patterns

> **Full details:** `modern-patterns.md`

### Optimistic UI (MUST USE)
- User clicks → UI updates instantly → request fires → rollback + toast on error.
```tsx
const handleLike = async () => {
  setLiked(true)
  try { await api.like(id) } catch { setLiked(false); toast.error("Failed") }
}
```

### Command Palette (⌘K)
- **When:** 10+ actions available
- **Must:** fuzzy search, recent items, keyboard nav
- **Lib:** cmdk via shadcn

### Inline Editing
- **Pattern:** click → input appears → blur/enter saves
- **Feedback:** subtle border, auto-save indicator
- **When:** frequent single-field edits

### Multi-select + Bulk Actions
- **Pattern:** checkbox column → selection count → sticky action bar at bottom
- **Keyboard:** shift+click for range, ctrl+click to toggle

### Infinite vs Pagination
| Content Type | Recommendation |
|--------------|----------------|
| Feed/timeline | Infinite + virtualization |
| Search results | Pagination |
| Data tables | Pagination + page size selector |
| Gallery/cards | Load more button |

---

## SaaS UX Pattern Library

> **Full details:** `saas-patterns.md` — Dashboard, Settings, Billing, Onboarding, DataTables, Auth, Workspace, Navigation, Forms, Modal, Feedback.

### Context Detection

Auto-detect SaaS context from keywords:

| Keywords | Pattern |
|----------|---------|
| dashboard, metrics, KPIs, analytics | Dashboard |
| settings, preferences, config, profile | Settings |
| billing, pricing, plans, subscription | Billing |
| onboarding, welcome, setup, wizard | Onboarding |
| list, table, CRUD, manage | DataTables |
| login, signup, auth, password | Auth |
| team, members, workspace, invite | Workspace |
| notifications, alerts | Feedback |
| form, input, create, edit | Forms |
| modal, dialog, popup, drawer | Modal |

**Multiple contexts:** "Team Settings" → Settings + Workspace.

---

## Micro-interactions & Feedback

### Timing Guidelines
| Action | Response Time | Feedback Type |
|--------|---------------|---------------|
| Click/tap | < 100ms | Visual change (scale, color) |
| Form submit | < 500ms show spinner | Disable button + spinner |
| Content load | > 300ms | Skeleton loader |
| Toast display | 3-5s auto-dismiss | Bottom-right (desktop) |
| Animation duration | 200-400ms | Ease-out for exits |

### Button State Flow
```
idle → hover(scale-[1.02]) → active(scale-[0.98]) → loading(spinner+disabled) → success(check)/error(shake) → idle
```

### Progress Indicators
| Type | When to Use |
|------|-------------|
| Spinner | Unknown duration < 4s |
| Progress bar | Known steps/percentage |
| Skeleton | Content placeholder |
| Percentage text | File uploads, long processes |

### Success Celebrations
- **Subtle:** checkmark animation + green pulse
- **Milestone:** confetti for achievements / first actions
- **Rule:** match the importance of the action

---

## Visual Design (Modern)

> **Full details:** `modern-patterns.md`

### Bento Grids
- **When:** feature showcases, varied dashboards
- **Pattern:** asymmetric `grid-cols`, varied item sizes
- **Rule:** max 4 different sizes

### Glassmorphism (Correct Usage)
- Class: `bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-black/5`
- Use for overlays, highlighted cards, hero elements. Avoid small text over glass and overuse.

### Dark Mode First
- **Principle:** design dark first, derive light
- **Benefits:** vibrant colors, less eye strain
- **Must:** AA contrast ratio in dark mode

### Shadows (SaaS-Grade)
- WRONG: `shadow-lg` alone (pure black, looks dirty)
- CORRECT: tinted, e.g. `className="shadow-lg shadow-primary/5"`

### The 60-30-10 Rule
- **60%** neutral (background)
- **30%** secondary (cards / surfaces)
- **10%** accent (CTAs / highlights)

---

## Typography

### Font Pairing
- **Display:** Clash Display, Cabinet Grotesk, Satoshi, Plus Jakarta Sans
- **Body:** DM Sans, Inter (only if must), Source Sans Pro
- **Mono:** JetBrains Mono, Fira Code

### Scale (Mobile-First)
- **H1:** `text-2xl md:text-3xl lg:text-4xl font-display font-bold`
- **H2:** `text-xl md:text-2xl font-display font-semibold`
- **Body:** `text-sm md:text-base text-muted-foreground`
- **Small:** `text-xs text-muted-foreground`

---

## Mobile-First (MANDATORY)

### Base Architecture
- CORRECT (mobile-first, 320px base): `p-4 md:p-6 lg:p-8`, `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- WRONG (desktop-first): `p-8 sm:p-4` — NEVER

### Touch Requirements
- **Min target:** 44×44px
- **Spacing:** 8px between touch elements
- **Feedback:** `active:scale-[0.98]` or background change

### Input Scaling (iOS Zoom Prevention)
- Use `<Input className="text-base" />` (16px). Never `text-sm` on mobile inputs.

### Mobile Patterns
| Element | Desktop | Mobile |
|---------|---------|--------|
| Modals | Centered dialog | Bottom drawer (Vaul) |
| Navigation | Sidebar | Bottom nav (5 max) or hamburger |
| Tables | Full table | Cards or horizontal scroll |
| Filters | Inline dropdowns | Drawer/expandable |
| Forms | Inline submit | Sticky bottom + safe-area |

### Safe Area
- Fixed bottom bars: `className="fixed bottom-0 inset-x-0 p-4 pb-safe"` → CSS `padding-bottom: max(1rem, env(safe-area-inset-bottom))`

---

## UX Writing Quick Reference

> **Full details:** `ux-writing.md`

### Microcopy Rules
- **Concise:** "Save" not "Click here to save"
- **Active:** "Email sent" not "Your email has been sent"
- **Human:** "Something went wrong" not "Error 500"

### Error Messages
- **Structure:** What happened + Why + How to fix
- **Good:** "Email already registered. Try logging in instead."
- **Bad:** "Error: duplicate key violation"

### Empty States
- **Structure:** Title + Value description + CTA
- **Example:** "No projects yet → Create your first project to start organizing work → Create Project"

### Loading States
- Avoid generic "Loading..."
- Use context: "Fetching your dashboard...", "Almost there..."
- Show progress: "Uploading 3 of 5 files..."

---

## States (MANDATORY)

Every component/page must handle ALL states — Loading, Error, Empty, Success.

```tsx
if (isLoading) return <Skeleton className="h-[200px]" />
if (error)     return <ErrorState message="Failed to load data" action={<Button onClick={refetch}>Try again</Button>} />
if (!data?.length) return <EmptyState icon={<FileIcon />} title="No items yet" description="Create your first item to get started" action={<Button>Create Item</Button>} />
return <DataDisplay data={data} />
```

---

## Performance UX

### Perceived Performance
1. **Shell first:** Layout skeleton instant
2. **Critical content:** < 1s
3. **Secondary:** Lazy load
4. **Images:** Blur placeholder → full

### Skeleton Design Rules
- Must **mirror** final layout exactly
- Subtle pulse/gradient animation
- No "jumping" when content arrives
- 3-5 skeleton rows for lists

### Preloading
- **Prefetch on hover:** `<Link prefetch onMouseEnter={() => prefetch(url)}>`
- **Preload images:** `<Image placeholder="blur" blurDataURL={tiny} />`

---

## Anti-Patterns (IMMEDIATE FAILURE)

**Iron Law:** If the design could be mistaken for a template → restart.

If you catch yourself doing ANY of the patterns below, **STOP. Delete. Start over.**

| Pattern | Why Bad | Fix |
|---------|---------|-----|
| Default shadcn/Tailwind layout | Generic, forgettable | Define aesthetic direction first |
| Inter/Roboto/system fonts as display | AI cliché, zero personality | Expressive display font + restrained body |
| Purple gradients on white | Most overused SaaS pattern | Subtle, token-based color story |
| Symmetrical, predictable sections | Looks auto-generated | Break grid intentionally |
| Gradients on long text | Hurts readability | Short titles only |
| Desktop-first breakpoints | Mobile afterthought | 320px base always |
| Centered modals on mobile | Bad touch UX | Vaul bottom drawers |
| Generic loading text | Feels slow | Contextual messages |
| No empty states | Confusing | Always design empty |
| Decoration without intent | Visual noise | Every flourish serves the aesthetic thesis |
| Default component styling without customization | Template feel | Customize tokens, spacing, type |
| Skipping Design Thinking "because it's small" | DQS missing | Run the phase always |
| Saying "I'll add personality later" | Later never comes | Intent goes in first |
| Copying a layout without adapting tone | Tone clash | Re-anchor to product tone |
| Blending 3+ aesthetic tones | Visual noise | Max 2 tones |

### Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "It's just a simple page" | Simple pages still need aesthetic direction |
| "The user didn't specify a style" | Default to the project's established tone or define one |
| "shadcn defaults look fine" | Fine ≠ distinctive. Customize always. |
| "I'll polish it later" | Later never comes. Design intent goes in first. |
| "Mobile can wait" | Mobile-first is MANDATORY, not optional |

---

## Accessibility (MANDATORY)

### Minimum Requirements
- **Contrast:** WCAG AA (4.5:1 text, 3:1 UI)
- **Focus:** Visible focus rings, logical tab order
- **Labels:** All inputs labeled, alt text on images
- **Motion:** `prefers-reduced-motion` support
- **Keyboard:** All actions keyboard accessible

### Focus & Motion
- **Visible focus:** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Modals:** trap focus (shadcn does this); restore focus on close
- **Reduced motion:** use `motion-safe:` variants, or guard with `@media (prefers-reduced-motion: reduce)`

---

## Component Intelligence Matrix

| Component | UX Rule | Implementation |
|-----------|---------|----------------|
| **Sidebar** | Z-Pattern: Logo→Nav→Profile | `bg-background` + border 1px subtle |
| **KPI Cards** | Value is hero, label is support | `font-display` for number, `text-muted` for label |
| **Charts** | Less is more - no excessive grid | Subtle grid, `bg-popover` tooltip |
| **Navigation** | Active visible but not invasive | `text-primary` + `bg-primary/10` |
| **Tables** | Data > decoration | Subtle borders, hover row, actions right |
| **Forms** | Clear labels, inline errors | `text-destructive` errors, `text-muted` helpers |
| **Buttons** | Primary action obvious | One primary per view, rest secondary/ghost |
| **Empty States** | Guide, don't abandon | Illustration + headline + CTA |

---

## Required Output Structure

When generating ANY frontend work, ALWAYS include:

1. **Design Direction header** (top-of-file comment): aesthetic name, DQS score, differentiation statement. Example: `/** Design Direction: Minimal Clean + Data-Dense | DQS: 12/15 | Differentiation: ... */`
2. **Component implementation** — full working code, intentional styling, comments only where intent isn't obvious.
3. **States coverage** — Loading, Empty, Error, Success all handled.

---

## Quick Patterns

### Layout Shell
```tsx
<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
    <div className="container flex h-14 md:h-16 items-center px-4" />
  </header>
  <div className="container flex flex-col md:flex-row gap-6 p-4 md:p-6">
    <aside className="hidden md:block w-64 shrink-0"><nav className="sticky top-20 space-y-2" /></aside>
    <main className="flex-1 min-w-0 space-y-6" />
  </div>
</div>
```

### Card with Hover
```tsx
<Card className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50">
  <CardHeader><CardTitle className="group-hover:text-primary transition-colors">{title}</CardTitle></CardHeader>
</Card>
```

### Animated List (motion)
```tsx
<motion.ul initial="hidden" animate="show"
  variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
  {items.map(item => (
    <motion.li key={item.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>{item.name}</motion.li>
  ))}
</motion.ul>
```

### Responsive Chart (recharts)
```tsx
<div className="h-[200px] md:h-[300px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
</div>
```

---

## Critique Rubric (ux-agent critique mode)

> **Binds the CRITIC only.** This is the canonical rubric `@ux-agent` runs in critique mode against a `design-flow.md` + `design-layout.md` pair (dispatched by `add.plan` 8.1.3 / `add.design`). The authoring guidance in the rest of this skill — and in `@ux-flow-agent` / `@ux-layout-agent` — deliberately does NOT restate this list: an author who mechanically pre-satisfies the checklist produces a design that passes the critic without being better. Authors follow the craft guidance; the critic hunts against this rubric.

ONE bounded adversarial pass. Hunt for:

1. Ambiguous hierarchy — no clear primary focus on a screen.
2. More than one primary CTA on a screen.
3. A missing required state (empty / loading / error / success).
4. A classified action (from the Action Classification Matrix) with no corresponding UI element in the layout.
5. An off-scale value — spacing, radius, or type size not on the declared scale.
6. A custom pattern where an existing component already covers the case.
7. A tap target under 44px at the smallest viewport.
8. Contrast below WCAG AA against the declared tokens.
9. An entry point from `design-flow.md` that no layout accounts for.

**Per defect:** cite the screen/section, the rule violated, and a fix hint. Classify severity `blocker` / `major` / `minor` / `polish`.

**Empty critique:** never a bare "no issues found" — carry a rubric-by-rubric justification for why each of the 9 items does not apply (e.g. "single CTA per screen confirmed on all N screens").

**Read-only:** the critic reports; the dispatching coordinator decides accept/reject and applies changes.

---

## Validation Checklist (Before Shipping)

### UX
- [ ] All states handled (loading, empty, error, success)
- [ ] Optimistic UI for quick actions
- [ ] Feedback for every action (toast, animation)
- [ ] Progressive disclosure (not everything visible)
- [ ] Consistent patterns throughout

### Visual
- [ ] 60-30-10 color rule applied
- [ ] Shadows are tinted, not pure black
- [ ] Typography hierarchy clear
- [ ] Spacing consistent (4, 6, 8 scale)
- [ ] Dark mode works and looks intentional

### Mobile
- [ ] Touch targets 44px+
- [ ] Input font 16px+
- [ ] Bottom drawers for modals
- [ ] Safe area padding
- [ ] Bottom nav or hamburger menu

### Performance
- [ ] Skeleton loaders match layout
- [ ] Images lazy loaded with blur
- [ ] Lists virtualized if >50 items
- [ ] Prefetch on hover for links

### Accessibility
- [ ] WCAG AA contrast
- [ ] All inputs labeled
- [ ] Focus visible and logical
- [ ] Reduced motion supported
- [ ] Keyboard navigation works
