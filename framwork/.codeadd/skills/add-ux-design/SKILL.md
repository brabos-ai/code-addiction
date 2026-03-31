---
name: add-ux-design
description: "Use when building UI components, pages, layouts, dashboards, charts, tables, forms, or any frontend interface. Use when styling, theming, or applying design direction to SaaS products. Triggers: design, UI, UX, component, page, layout, dashboard, mobile, responsive, dark mode, animation, skeleton, empty-state, loading-state, onboarding, settings, billing, auth."
---

# UX Design (Distinctive, Production-Grade)

You are a **UX designer-engineer**, not a layout generator.

Your goal is to create **memorable, high-craft SaaS interfaces** that:
- Express a clear aesthetic point of view
- Follow UX laws and cognitive psychology
- Are fully functional, mobile-first, and production-ready
- Avoid generic "template" patterns

**Use for:** Components, pages, layouts, dashboards, charts, tables, forms
**NEVER use for:** Backend (backend-development), Database (database-development)

**Support Files:**
- `{{skill:add-ux-design/design-direction.md}}` - Design Thinking, Quality Score, Output Structure
- `{{skill:add-ux-design/ux-laws-principles.md}}` - UX Laws, Cognitive Load, Mental Models
- `{{skill:add-ux-design/modern-patterns.md}}` - Interaction patterns, Visual trends, Performance UX
- `{{skill:add-ux-design/ux-writing.md}}` - Microcopy, Error messages, Empty states

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
| **Fitts** | Larger + closer = easier | CTAs grandes, ações primárias acessíveis |
| **Hick** | More options = slower decision | Max 5-7 items visíveis, progressive disclosure |
| **Miller** | 7±2 chunks | Agrupar info em seções, não listas longas |
| **Jakob** | Users expect patterns | Não reinventar, seguir convenções |
| **Doherty** | <400ms = flow state | Feedback imediato, optimistic UI |
| **Peak-End** | Memory = peak + end | Celebrar sucesso, polish no final |
| **Aesthetic-Usability** | Beautiful = easier | Investir em visual polish |

### Cognitive Load Principles
{"intrinsic":"simplificar fluxo","extraneous":"eliminar ruído visual","germane":"patterns consistentes"}

---

## Modern Interaction Patterns

> **Full details:** `modern-patterns.md`

### Optimistic UI (MUST USE)
```tsx
// User clicks → UI updates instantly → Request fires → Rollback if error
const handleLike = async () => {
  setLiked(true) // Optimistic
  try { await api.like(id) }
  catch { setLiked(false); toast.error("Failed") } // Rollback
}
```

### Command Palette (⌘K)
{"when":"10+ actions available","must":"fuzzy search, recent items, keyboard nav","lib":"cmdk via shadcn"}

### Inline Editing
{"pattern":"click → input appears → blur/enter saves","feedback":"subtle border, auto-save indicator","when":"frequent single-field edits"}

### Multi-select + Bulk Actions
{"pattern":"checkbox col → selection count → sticky action bar bottom","keyboard":"shift+click range, ctrl+click toggle"}

### Infinite vs Pagination
| Content Type | Recommendation |
|--------------|----------------|
| Feed/timeline | Infinite + virtualization |
| Search results | Pagination |
| Data tables | Pagination + page size selector |
| Gallery/cards | Load more button |

---

## SaaS UX Pattern Library

### Dashboard
{"layout":"KPIs→Charts→Activity","kpis":{"grid":"grid-cols-2 md:grid-cols-4","card":"icon+value+label+trend","max":4},"charts":{"line":"trends","bar":"comparisons","h":"h-[200px] md:h-[300px]"},"activity":"avatar+action+timestamp","mobile":{"kpis":"2col,swipe>4","charts":"full-w,h-scroll"}}

### Settings
{"layout":{"desktop":"sidebar→forms","mobile":"accordion|tabs"},"sections":["General","Profile","Notifications","Security","Billing","Team","API"],"forms":{"label":"above","save":"sticky-bottom-mobile"},"feedback":{"save":"toast 3s","unsaved":"warning dialog"},"danger":"red zone bottom+confirm"}

### Billing
{"pricing":{"tiers":3,"highlight":"Popular badge+border-primary","toggle":"monthly/annual"},"cards":"name→price→features→CTA","usage":{"display":"Progress current/limit","warn":"yellow@80%,red@95%"},"invoices":{"cols":"date|desc|amount|status|actions","mobile":"cards"},"checkout":"plan→payment→confirm→success"}

### Onboarding
{"flow":["Welcome","Profile","FirstAction","Success"],"maxSteps":5,"progress":"stepper|checklist","empty":"illustration+headline+desc+CTA","tooltips":{"max":3,"dismiss":"click|X"},"celebration":"confetti/animation on completion"}

### DataTables
{"layout":"filters→table→pagination","header":{"search":"debounce 300ms","filters":"dropdown+chips","bulk":"on selection"},"table":"checkbox|main|secondary|status|actions","mobile":"cards|h-scroll+sticky-col1","states":{"loading":"skeleton 3-5 rows","empty":"illust+CTA","error":"msg+retry"}}

### Auth
{"login":"email+pwd,social,forgot,signup link","signup":"name+email+pwd,terms,social","layout":{"desktop":"split form|illustration","mobile":"centered,logo top"},"flows":{"magic":"email→link→inbox→logged","forgot":"email→reset→newpwd→success","2fa":"6digits+resend"}}

### Workspace
{"members":"avatar+name+email+role+actions","roles":["Owner","Admin","Member","Viewer"],"invite":"email+role+send,pending list","switcher":"header dropdown,current highlighted","settings":["General","Members","Billing","DangerZone"]}

### Navigation
{"desktop":{"sidebar":"logo→nav→spacer→user,collapsible 240px→60px","header":"breadcrumb|search|notif|user,h-14 md:h-16,sticky"},"mobile":{"bottomNav":"5 max,icon+label,h-16","drawer":"hamburger→full nav"},"states":{"active":"bg-muted+text-primary+font-medium"}}

### Forms
{"layout":"max-w-2xl,space-y-6 sections,space-y-4 fields","fields":"label above+required*,placeholder=example,helper=muted,error=destructive","validation":"blur first,change after error,inline errors","actions":"bottom right,primary+secondary outline","mobile":"sticky bottom+safe-area","autosave":"draft indicator for long forms"}

### Modal
{"sizes":{"sm":"max-w-sm","md":"max-w-md","lg":"max-w-lg","full":"max-w-4xl"},"structure":"header(title+X)→content(scroll)→footer(actions right)","mobile":"drawer bottom (Vaul)","behavior":"X|Esc|outside close,focus trap"}

### Feedback
{"toast":{"position":"bottom-right,mobile:bottom-center","success":"green,auto 3s","error":"red,manual+retry","warning":"yellow,manual"},"loading":{"content":"Skeleton","actions":"Spinner+disable","progress":"uploads"},"confirm":{"destructive":"AlertDialog red","standard":"Dialog"}}

---

## Context Detection

**Auto-detect SaaS context from keywords:**

| Keywords | Context | Pattern |
|----------|---------|---------|
| dashboard,metrics,KPIs,analytics | Dashboard | Dashboard |
| settings,preferences,config,profile | Settings | Settings |
| billing,pricing,plans,subscription | Billing | Billing |
| onboarding,welcome,setup,wizard | Onboarding | Onboarding |
| list,table,CRUD,manage | DataTables | DataTables |
| login,signup,auth,password | Auth | Auth |
| team,members,workspace,invite | Workspace | Workspace |
| notifications,alerts | Feedback | Feedback |
| form,input,create,edit | Forms | Forms |
| modal,dialog,popup,drawer | Modal | Modal |

**Multiple contexts:** "Team Settings" → Settings + Workspace

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
{"subtle":"checkmark animation + green pulse","milestone":"confetti for achievements, first actions","rule":"match importance of action"}

---

## Visual Design (Modern)

> **Full details:** `modern-patterns.md`

### Bento Grids
{"when":"feature showcases, varied dashboards","pattern":"asymmetric grid-cols, varied item sizes","rule":"max 4 different sizes"}

### Glassmorphism (Correct Usage)
```tsx
<div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-black/5">
// Use for: overlays, highlighted cards, hero elements
// Avoid: small text over glass, overuse
```

### Dark Mode First
{"principle":"design dark first, derive light","benefits":"vibrant colors, less eye strain","must":"AA contrast ratio in dark mode"}

### Shadows (SaaS-Grade)
```tsx
// WRONG: Pure black shadows
shadow-lg // can look dirty

// CORRECT: Tinted subtle shadows
className="shadow-lg shadow-primary/5"
// or custom with color tint
```

### The 60-30-10 Rule
{"60%":"neutral (background)","30%":"secondary (cards/surfaces)","10%":"accent (CTAs/highlights)"}

---

## Typography

### Font Pairing
{"display":["Clash Display","Cabinet Grotesk","Satoshi","Plus Jakarta Sans"],"body":["DM Sans","Inter (if must)","Source Sans Pro"],"mono":["JetBrains Mono","Fira Code"]}

### Scale (Mobile-First)
```tsx
// Headings
<h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">
<h2 className="text-xl md:text-2xl font-display font-semibold">

// Body
<p className="text-sm md:text-base text-muted-foreground">

// Small
<span className="text-xs text-muted-foreground">
```

---

## Mobile-First (MANDATORY)

### Base Architecture
```tsx
// CORRECT: Mobile-first (320px base)
<div className="p-4 md:p-6 lg:p-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// WRONG: Desktop-first
<div className="p-8 sm:p-4">  // NEVER
```

### Touch Requirements
{"minTarget":"44x44px","spacing":"8px between touch elements","feedback":"active:scale-[0.98] or bg change"}

### Input Scaling (iOS Zoom Prevention)
```tsx
// ALWAYS 16px+ for inputs (prevents iOS zoom)
<Input className="text-base" /> // 16px minimum
// NEVER text-sm on mobile inputs
```

### Mobile Patterns
| Element | Desktop | Mobile |
|---------|---------|--------|
| Modals | Centered dialog | Bottom drawer (Vaul) |
| Navigation | Sidebar | Bottom nav (5 max) or hamburger |
| Tables | Full table | Cards or horizontal scroll |
| Filters | Inline dropdowns | Drawer/expandable |
| Forms | Inline submit | Sticky bottom + safe-area |

### Safe Area
```tsx
<div className="fixed bottom-0 inset-x-0 p-4 pb-safe">
// CSS: padding-bottom: max(1rem, env(safe-area-inset-bottom));
```

---

## UX Writing Quick Reference

> **Full details:** `ux-writing.md`

### Microcopy Rules
- **Concise:** "Save" not "Click here to save"
- **Active:** "Email sent" not "Your email has been sent"
- **Human:** "Something went wrong" not "Error 500"

### Error Messages
{"structure":"What happened + Why + How to fix","good":"Email already registered. Try logging in instead.","bad":"Error: duplicate key violation"}

### Empty States
{"structure":"Title + Value description + CTA","example":"No projects yet → Create your first project to start organizing work → Create Project"}

### Loading States
- Avoid generic "Loading..."
- Use context: "Fetching your dashboard...", "Almost there..."
- Show progress: "Uploading 3 of 5 files..."

---

## States (MANDATORY)

Every component/page must handle ALL states:

```tsx
// Loading
if (isLoading) return <Skeleton className="h-[200px]" />

// Error
if (error) return (
  <ErrorState
    message="Failed to load data"
    action={<Button onClick={refetch}>Try again</Button>}
  />
)

// Empty
if (!data?.length) return (
  <EmptyState
    icon={<FileIcon />}
    title="No items yet"
    description="Create your first item to get started"
    action={<Button>Create Item</Button>}
  />
)

// Success
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
```tsx
// Prefetch on hover
<Link prefetch onMouseEnter={() => prefetch(url)}>

// Preload images
<Image placeholder="blur" blurDataURL={tiny} />
```

---

## Anti-Patterns (IMMEDIATE FAILURE)

**Iron Law:** If the design could be mistaken for a template → restart.

| Pattern | Why Bad | Fix |
|---------|---------|-----|
| Default shadcn/Tailwind layout | Generic, forgettable | Define aesthetic direction first |
| Inter/Roboto/system fonts as display | AI cliché, zero personality | Expressive display font + restrained body |
| Purple gradients on white | Most overused SaaS pattern | Subtle, token-based color story |
| Symmetrical, predictable sections | Looks auto-generated | Break grid intentionally |
| Gradients on long text | Hurts readability | Short titles only |
| Pure black shadows | Look dirty | Tinted shadows (primary/5) |
| >3 vibrant colors | Distracts from content | 60-30-10 rule |
| Desktop-first breakpoints | Mobile afterthought | 320px base always |
| Centered modals on mobile | Bad touch UX | Vaul bottom drawers |
| Touch targets <44px | Frustrating | Min 44x44px |
| Inputs <16px font | iOS auto-zoom | text-base minimum |
| Generic loading text | Feels slow | Contextual messages |
| No empty states | Confusing | Always design empty |
| Decoration without intent | Visual noise | Every flourish serves the aesthetic thesis |

### Red Flags — STOP and Rethink

If you catch yourself doing ANY of these, **STOP. Delete. Start over.**

- Using default component styling without customization
- Skipping the Design Thinking Phase "because it's a small component"
- Saying "I'll add personality later"
- Copying a layout from another project without adapting tone
- Blending 3+ aesthetic tones

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

### Focus Management
```tsx
// Visible focus
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Trap focus in modals (shadcn does this)
// Restore focus on close
```

### Reduced Motion
```tsx
// Respect user preference
className="motion-safe:animate-fadeIn"

// Or in CSS
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

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

## Docs Lookup

{"shadcn":"{{skill:add-ux-design/shadcn-docs.md}}"}
{"tailwind":"{{skill:add-ux-design/tailwind-v3-docs.md}}"}
{"motion":"{{skill:add-ux-design/motion-dev-docs.md}}"}
{"recharts":"{{skill:add-ux-design/recharts-docs.md}}"}
{"tanstackTable":"{{skill:add-ux-design/tanstack-table-docs.md}}"}
{"tanstackQuery":"{{skill:add-ux-design/tanstack-query-docs.md}}"}
{"tanstackRouter":"{{skill:add-ux-design/tanstack-router-docs.md}}"}
{"designDirection":"{{skill:add-ux-design/design-direction.md}}"}
{"uxLaws":"{{skill:add-ux-design/ux-laws-principles.md}}"}
{"modernPatterns":"{{skill:add-ux-design/modern-patterns.md}}"}
{"uxWriting":"{{skill:add-ux-design/ux-writing.md}}"}

---

## Recommended Libs

{"core":[{"name":"shadcn/ui","for":"components"},{"name":"tailwindcss","for":"styling"},{"name":"motion","for":"animations"}]}
{"data":[{"name":"recharts","for":"charts"},{"name":"@tanstack/react-table","for":"tables"},{"name":"@tanstack/react-query","for":"data fetching"}]}
{"ux":[{"name":"sonner","for":"toasts","cmd":"npx shadcn add sonner"},{"name":"vaul","for":"mobile drawers","cmd":"npx shadcn add drawer"},{"name":"cmdk","for":"command palette","cmd":"npx shadcn add command"},{"name":"nuqs","for":"URL state"},{"name":"@tanstack/react-virtual","for":"1000+ items"}]}

---

## Required Output Structure

When generating ANY frontend work, ALWAYS include:

### 1. Design Direction (comment block at top)
```tsx
/**
 * Design Direction: [Aesthetic name, e.g. "Minimal Clean + Data-Dense"]
 * DQS: [score]/15
 * Differentiation: "This avoids generic UI by [doing X instead of Y]"
 */
```

### 2. Component Implementation
- Full working code with intentional styling
- Comments only where intent isn't obvious

### 3. States Coverage
- Loading, Empty, Error, Success — ALL handled

---

## Questions to Ask (Before Complex Interfaces)

1. Who is this for, emotionally?
2. Should this feel trustworthy, exciting, calm, or data-rich?
3. Is memorability or clarity more important?
4. Will this scale to other pages/components?
5. What should users *feel* in the first 3 seconds?

---

## Checklist (Before Shipping)

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

---

## Quick Patterns

### Layout Shell
```tsx
<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 md:h-16 items-center px-4" />
  </header>
  <div className="container flex flex-col md:flex-row gap-6 p-4 md:p-6">
    <aside className="hidden md:block w-64 shrink-0">
      <nav className="sticky top-20 space-y-2" />
    </aside>
    <main className="flex-1 min-w-0 space-y-6" />
  </div>
</div>
```

### Card with Hover
```tsx
<Card className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50">
  <CardHeader>
    <CardTitle className="group-hover:text-primary transition-colors">
      {title}
    </CardTitle>
  </CardHeader>
</Card>
```

### Animated List
```tsx
<motion.ul initial="hidden" animate="show" variants={{
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}}>
  {items.map((item) => (
    <motion.li key={item.id} variants={{
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0 }
    }}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

### Responsive Chart
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
