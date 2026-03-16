# Modern UX Patterns

> Reference file for `.codeadd/skills/ux-design/SKILL.md`

Deep dive into modern interaction patterns, visual trends 2024/25, and performance UX.

---

## Interaction Patterns

### Optimistic UI

**Principle:** Update UI immediately, sync in background, rollback on error.

**When to Use:**
| Action Type | Use Optimistic UI? |
|-------------|-------------------|
| Like/favorite | Yes |
| Toggle settings | Yes |
| Delete (soft) | Yes |
| Form submit | No (show loading) |
| Payment | No (must confirm) |
| File upload | No (show progress) |

**Implementation:**
```tsx
// Simple toggle
const handleFavorite = async (itemId: string) => {
  // Optimistic update
  setItems(prev => prev.map(item =>
    item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
  ))

  try {
    await api.toggleFavorite(itemId)
  } catch (error) {
    // Rollback on error
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
    ))
    toast.error("Failed to update. Please try again.")
  }
}

// With TanStack Query
const mutation = useMutation({
  mutationFn: api.toggleFavorite,
  onMutate: async (itemId) => {
    await queryClient.cancelQueries({ queryKey: ['items'] })
    const previous = queryClient.getQueryData(['items'])

    queryClient.setQueryData(['items'], (old) =>
      old.map(item =>
        item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    )

    return { previous }
  },
  onError: (err, itemId, context) => {
    queryClient.setQueryData(['items'], context.previous)
    toast.error("Failed to update")
  },
})
```

---

### Command Palette (⌘K)

**When to Use:**
- Application has 10+ distinct actions
- Power users need quick access
- Search is a primary function

**Anatomy:**
```
┌────────────────────────────────────────┐
│ 🔍 Type a command or search...         │
├────────────────────────────────────────┤
│ Recent                                  │
│   📄 Open Dashboard                     │
│   ⚙️  Settings                          │
├────────────────────────────────────────┤
│ Actions                                 │
│   ➕ Create Project           ⌘N       │
│   📊 View Analytics           ⌘A       │
│   👤 Profile Settings         ⌘,       │
├────────────────────────────────────────┤
│ Navigation                              │
│   🏠 Home                               │
│   📁 Projects                           │
│   📈 Reports                            │
└────────────────────────────────────────┘
```

**Implementation (shadcn/cmdk):**
```tsx
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command"

const CommandPalette = () => {
  const [open, setOpen] = useState(false)

  // Global shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Recent">
          {recentItems.map((item) => (
            <CommandItem key={item.id} onSelect={() => navigate(item.path)}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => createProject()}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

**Must Have:**
- Fuzzy search
- Keyboard navigation (↑↓ Enter Esc)
- Recent items section
- Keyboard shortcuts displayed
- Categories/grouping
- Loading state for async search

---

### Inline Editing

**Pattern:** Click text → becomes input → blur/enter saves

**When to Use:**
- Frequent single-field edits
- Titles, names, short text
- Avoiding full form overhead

**Implementation:**
```tsx
const InlineEdit = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (draft !== value) {
      await onSave(draft)
    }
    setEditing(false)
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") {
            setDraft(value)
            setEditing(false)
          }
        }}
        className="h-auto py-1 px-2"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="hover:bg-muted px-2 py-1 rounded -mx-2 cursor-text text-left"
    >
      {value}
      <Pencil className="inline ml-2 h-3 w-3 opacity-0 group-hover:opacity-50" />
    </button>
  )
}
```

**Visual Cues:**
- Hover shows edit affordance (pencil icon, subtle bg)
- Input has clear border when active
- Show saving indicator
- Escape cancels, Enter saves

---

### Drag and Drop

**Common Patterns:**
| Pattern | Use Case |
|---------|----------|
| Kanban columns | Task management |
| List reordering | Priorities, playlists |
| File drop zone | Uploads |
| Grid rearrange | Dashboards, galleries |

**Implementation (dnd-kit):**
```tsx
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  )
}

const SortableList = ({ items, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      onReorder(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            <Card>{item.name}</Card>
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

**Accessibility:**
- Always provide keyboard alternative
- Announce drag start/end to screen readers
- Show drop zones clearly

---

### Multi-select & Bulk Actions

**Pattern:**
```
┌────────────────────────────────────────┐
│ ☐ Select all (3 selected)              │
├────────────────────────────────────────┤
│ ☑ Item 1                               │
│ ☐ Item 2                               │
│ ☑ Item 3                               │
│ ☑ Item 4                               │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ 3 selected   [Archive] [Delete] [Cancel]│
└────────────────────────────────────────┘ ← Sticky bottom bar
```

**Implementation:**
```tsx
const [selected, setSelected] = useState<Set<string>>(new Set())

const toggleSelect = (id: string) => {
  setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}

const selectAll = () => {
  if (selected.size === items.length) {
    setSelected(new Set())
  } else {
    setSelected(new Set(items.map(i => i.id)))
  }
}

// Bulk action bar
{selected.size > 0 && (
  <div className="fixed bottom-0 inset-x-0 bg-background border-t p-4 flex items-center justify-between">
    <span className="text-sm text-muted-foreground">
      {selected.size} selected
    </span>
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleBulkArchive}>Archive</Button>
      <Button variant="destructive" onClick={handleBulkDelete}>Delete</Button>
      <Button variant="ghost" onClick={() => setSelected(new Set())}>Cancel</Button>
    </div>
  </div>
)}
```

**Keyboard:**
- Shift+Click for range selection
- Ctrl/Cmd+Click for toggle
- Ctrl/Cmd+A for select all

---

### Infinite Scroll vs Pagination

| Factor | Infinite Scroll | Pagination |
|--------|-----------------|------------|
| Content type | Feeds, discovery | Search, data tables |
| User intent | Browse, explore | Find specific item |
| Back button | Problematic | Works well |
| Accessibility | Harder | Easier |
| URL sharing | Complex | Simple |
| Performance | Needs virtualization | Naturally bounded |

**Infinite Scroll Implementation:**
```tsx
import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"

const InfiniteList = () => {
  const { ref, inView } = useInView()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: ({ pageParam = 0 }) => fetchItems({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage])

  return (
    <div>
      {data?.pages.map((page) =>
        page.items.map((item) => <ItemCard key={item.id} item={item} />)
      )}

      <div ref={ref} className="h-10">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  )
}
```

**With Virtualization (1000+ items):**
```tsx
import { useVirtualizer } from "@tanstack/react-virtual"

const VirtualList = ({ items }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ItemCard item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Visual Design Trends (2024/25)

### Bento Grids

Asymmetric grid layouts with varied cell sizes.

```tsx
// Bento grid layout
<div className="grid grid-cols-4 gap-4">
  {/* Large feature card */}
  <Card className="col-span-2 row-span-2">
    <LargeFeature />
  </Card>

  {/* Medium cards */}
  <Card className="col-span-2">
    <MediumFeature />
  </Card>

  <Card className="col-span-1">
    <SmallFeature />
  </Card>

  <Card className="col-span-1">
    <SmallFeature />
  </Card>
</div>

// Responsive bento
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card className="md:col-span-2 md:row-span-2" />
  {/* ... */}
</div>
```

**Rules:**
- Max 4 different sizes
- Visual balance (not random)
- Content hierarchy drives size
- Mobile: stack vertically

---

### Glassmorphism (Done Right)

```tsx
// Correct usage
<div className="
  bg-white/10
  dark:bg-white/5
  backdrop-blur-md
  border border-white/20
  rounded-lg
  shadow-lg shadow-black/5
">

// With gradient overlay
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-lg" />
  <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
    {/* content */}
  </div>
</div>
```

**When to Use:**
- Hero sections
- Feature highlights
- Overlays on images
- NOT for text-heavy content

**Avoid:**
- Small text over glass (readability)
- Overuse (loses impact)
- Without proper contrast

---

### Mesh Gradients

Organic, multi-color gradients.

```tsx
// CSS mesh gradient
<div className="relative min-h-screen">
  <div
    className="absolute inset-0 -z-10"
    style={{
      background: `
        radial-gradient(at 40% 20%, hsla(var(--primary), 0.3) 0px, transparent 50%),
        radial-gradient(at 80% 0%, hsla(var(--accent), 0.2) 0px, transparent 50%),
        radial-gradient(at 0% 50%, hsla(var(--secondary), 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 50%, hsla(var(--primary), 0.1) 0px, transparent 50%),
        radial-gradient(at 0% 100%, hsla(var(--accent), 0.15) 0px, transparent 50%)
      `,
    }}
  />
  {/* content */}
</div>

// Tailwind approximation
<div className="bg-gradient-to-br from-primary/20 via-background to-accent/10" />
```

**Best Practices:**
- Opacity 10-30% (subtle)
- Use brand colors
- Place behind content, not over
- Test in both light/dark modes

---

### Dark Mode First

**Principle:** Design for dark mode first, derive light mode.

**Benefits:**
- Colors appear more vibrant
- Easier to add depth with shadows
- Better for OLED displays
- Reduces eye strain

**Implementation:**
```css
:root {
  /* Dark mode defaults */
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --primary: 210 40% 98%;
  --muted: 223 47% 11%;
}

.light {
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --primary: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
}
```

**Contrast Considerations:**
```tsx
// Ensure contrast in both modes
<p className="text-foreground" /> // Auto-adjusts
<p className="text-muted-foreground" /> // AA compliant both modes

// Colored elements need both variants
<Badge className="bg-green-500/20 text-green-500 dark:bg-green-500/10 dark:text-green-400" />
```

---

### Variable Fonts

**Benefits:**
- Single file, all weights
- Smooth weight transitions
- Smaller file size
- Micro-animations possible

```css
@font-face {
  font-family: 'Inter var';
  src: url('/fonts/Inter-roman.var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

/* Weight transition on hover */
.nav-link {
  font-variation-settings: 'wght' 400;
  transition: font-variation-settings 0.2s;
}
.nav-link:hover {
  font-variation-settings: 'wght' 600;
}
```

---

## Performance UX

### Perceived Performance

**Principles:**
1. **Instant feedback** - Acknowledge every action
2. **Progressive rendering** - Show something immediately
3. **Optimistic updates** - Assume success
4. **Skeleton screens** - Layout stability

### Skeleton Design

**Rules:**
- Must mirror final layout exactly
- Same heights, widths, positions
- Subtle animation (pulse/shimmer)
- No layout shift when content loads

```tsx
// Skeleton component
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
)

// Card skeleton matching real card
const CardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-3/4" /> {/* Title */}
      <Skeleton className="h-4 w-1/2 mt-2" /> {/* Description */}
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[200px] w-full" /> {/* Image/content */}
    </CardContent>
    <CardFooter className="flex justify-between">
      <Skeleton className="h-4 w-20" /> {/* Date */}
      <Skeleton className="h-9 w-24" /> {/* Button */}
    </CardFooter>
  </Card>
)

// Usage with loading state
{isLoading ? (
  <div className="grid gap-4">
    {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : (
  <div className="grid gap-4">
    {items.map(item => <ItemCard key={item.id} item={item} />)}
  </div>
)}
```

---

### Progressive Loading Strategy

**Priority Order:**
1. **Shell** (instant) - Layout, navigation
2. **Above fold** (< 1s) - Hero, primary content
3. **Below fold** (lazy) - Secondary content
4. **Heavy assets** (defer) - Images, videos

```tsx
// Route-based code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Settings = lazy(() => import("./pages/Settings"))

// Component-based lazy loading
const HeavyChart = lazy(() => import("./components/HeavyChart"))

// Image optimization
<Image
  src={image.url}
  placeholder="blur"
  blurDataURL={image.blurHash}
  loading="lazy"
/>

// Intersection observer for below-fold content
const LazySection = ({ children }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "100px",
  })

  return (
    <div ref={ref}>
      {inView ? children : <Skeleton className="h-[400px]" />}
    </div>
  )
}
```

---

### Preloading & Prefetching

```tsx
// Prefetch on hover
<Link
  to="/dashboard"
  onMouseEnter={() => queryClient.prefetchQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  })}
>
  Dashboard
</Link>

// Preload critical resources
<link rel="preload" href="/fonts/inter.woff2" as="font" crossOrigin />
<link rel="preconnect" href="https://api.example.com" />

// React Router prefetch
<Link to="/dashboard" prefetch="intent" /> {/* Prefetch on hover/focus */}
```

---

### Loading State Hierarchy

| Duration | Feedback |
|----------|----------|
| 0-100ms | None (appears instant) |
| 100-500ms | Subtle (button disable, opacity) |
| 500ms-2s | Spinner or skeleton |
| 2s-10s | Progress indicator with message |
| 10s+ | Background process with notification |

```tsx
// Delayed loading indicator
const [showSpinner, setShowSpinner] = useState(false)

useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => setShowSpinner(true), 500)
    return () => clearTimeout(timer)
  }
  setShowSpinner(false)
}, [isLoading])

return (
  <Button disabled={isLoading}>
    {showSpinner && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
    {isLoading ? "Saving..." : "Save"}
  </Button>
)
```

---

## Quick Reference

### Interaction Pattern Decision Tree

```
User action needed?
├── Quick toggle/like? → Optimistic UI
├── Many options to choose? → Command Palette (⌘K)
├── Edit single field? → Inline Edit
├── Reorder items? → Drag & Drop
├── Act on multiple items? → Multi-select + Bulk Bar
└── Browse content?
    ├── Exploratory? → Infinite Scroll
    └── Searching? → Pagination
```

### Visual Trend Checklist

- [ ] Bento grids for feature layouts
- [ ] Glassmorphism for hero/overlays (subtle)
- [ ] Mesh gradients for backgrounds
- [ ] Dark mode designed first
- [ ] Variable fonts for smooth transitions
- [ ] Tinted shadows (not pure black)
- [ ] 60-30-10 color distribution

### Performance UX Checklist

- [ ] Skeleton mirrors final layout
- [ ] No layout shift on load
- [ ] Optimistic updates for quick actions
- [ ] Delayed spinners (500ms+)
- [ ] Prefetch on hover
- [ ] Lazy load below fold
- [ ] Images have blur placeholders
