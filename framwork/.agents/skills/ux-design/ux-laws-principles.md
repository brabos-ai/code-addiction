# UX Laws & Principles

> Reference file for `.codeadd/skills/ux-design/SKILL.md`

Deep dive into UX laws, cognitive load theory, and mental models for creating intuitive interfaces.

---

## UX Laws

### Fitts's Law
**"Time to target = distance / size"**

| Principle | Application |
|-----------|-------------|
| Larger targets are easier to hit | Primary CTAs should be larger than secondary |
| Closer targets are faster to reach | Related actions should be grouped |
| Edge/corner targets are infinite size | Use screen edges for important actions |

**Implementation:**
```tsx
// Primary action: larger, more prominent
<Button size="lg" className="min-w-[120px]">Save Changes</Button>

// Secondary action: smaller
<Button variant="outline" size="sm">Cancel</Button>

// Mobile: full-width CTAs for easy thumb reach
<Button className="w-full h-12">Continue</Button>
```

**Common Violations:**
- Tiny close buttons on modals
- Small touch targets on mobile (<44px)
- Important actions far from current focus

---

### Hick's Law
**"Decision time increases with number and complexity of choices"**

| Choices | User Experience |
|---------|-----------------|
| 2-3 | Instant decision |
| 4-6 | Quick scan |
| 7-9 | Cognitive load starts |
| 10+ | Overwhelm, analysis paralysis |

**Implementation:**
```tsx
// WRONG: Too many options at once
<nav>{allMenuItems.map(item => <Link />)}</nav> // 15 items

// CORRECT: Progressive disclosure
<nav>
  {primaryItems.map(item => <Link />)} // 5 items
  <DropdownMenu>
    <DropdownMenuTrigger>More</DropdownMenuTrigger>
    <DropdownMenuContent>
      {secondaryItems.map(item => <DropdownMenuItem />)}
    </DropdownMenuContent>
  </DropdownMenu>
</nav>
```

**Application:**
- Navigation: max 5-7 primary items
- Forms: break into steps if >7 fields
- Settings: categorize into sections
- Filters: show common ones, hide advanced

---

### Miller's Law
**"Average person can hold 7±2 items in working memory"**

| Context | Recommendation |
|---------|----------------|
| Phone numbers | Group in 3-4 digit chunks |
| Lists | Max 7 visible items, paginate rest |
| Steps | Max 5 visible steps in stepper |
| Categories | Max 7 main categories |

**Implementation:**
```tsx
// WRONG: Long unbroken list
<ul>{items.map(i => <li />)}</ul> // 20 items

// CORRECT: Chunked with visual grouping
<div className="space-y-6">
  <section>
    <h3>Recent</h3>
    <ul>{recentItems.slice(0, 5).map(i => <li />)}</ul>
  </section>
  <section>
    <h3>All Items</h3>
    <ul>{/* paginated */}</ul>
  </section>
</div>
```

---

### Jakob's Law
**"Users spend most of their time on OTHER sites"**

| Principle | Application |
|-----------|-------------|
| Users expect familiar patterns | Don't reinvent standard UX |
| Leverage existing mental models | Follow platform conventions |
| Innovation has a learning cost | Innovate on value, not on basic UX |

**Standard Patterns to Follow:**
| Element | Expected Pattern |
|---------|------------------|
| Logo | Top-left, links to home |
| Search | Top-right or center header |
| User menu | Top-right avatar dropdown |
| Primary nav | Left sidebar or top |
| Breadcrumbs | Below header, before content |
| Form submit | Bottom-right of form |
| Delete | Red, with confirmation |
| Cancel | Secondary button, left of submit |

**When to Break Convention:**
- Only if user testing proves significant improvement
- When convention doesn't exist for novel feature
- For differentiation that adds clear value

---

### Doherty Threshold
**"Productivity soars when response time < 400ms"**

| Response Time | User Perception |
|---------------|-----------------|
| 0-100ms | Instant |
| 100-300ms | Slight delay |
| 300-1000ms | System is working |
| 1000ms+ | Flow broken |

**Implementation:**
```tsx
// Optimistic UI for instant feedback
const handleToggle = async () => {
  setEnabled(!enabled) // Instant visual feedback
  try {
    await api.toggle()
  } catch {
    setEnabled(enabled) // Rollback
    toast.error("Failed to update")
  }
}

// Debounce search to avoid lag
const debouncedSearch = useDebouncedCallback(
  (value) => search(value),
  300
)
```

---

### Peak-End Rule
**"People judge experiences by their peak and end, not average"**

| Moment | Strategy |
|--------|----------|
| Peak (best moment) | Make key success moments memorable |
| End (final moment) | End on positive note |
| Negative peaks | Minimize and recover gracefully |

**Implementation:**
```tsx
// Celebrate milestones (peak moments)
const handleFirstProject = async () => {
  await createProject()
  confetti() // Celebration!
  toast.success("Your first project is ready!")
}

// Positive endings
const handleCheckout = () => {
  // After payment success
  return (
    <div className="text-center space-y-4">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
      <h2>You're all set!</h2>
      <p>Welcome to the team. Here's what's next...</p>
    </div>
  )
}
```

---

### Aesthetic-Usability Effect
**"Users perceive beautiful designs as more usable"**

| Principle | Impact |
|-----------|--------|
| Polish builds trust | Users forgive minor issues |
| Attention to detail signals quality | Increases perceived value |
| Visual hierarchy guides attention | Makes interfaces feel intuitive |

**Investment Areas:**
1. **Micro-interactions** - Button hovers, transitions
2. **Typography** - Proper hierarchy, good fonts
3. **Spacing** - Consistent, breathing room
4. **Icons** - Consistent style, appropriate size
5. **Colors** - Harmonious palette, meaningful use

---

### Zeigarnik Effect
**"Incomplete tasks are remembered better than completed ones"**

| Application | Implementation |
|-------------|----------------|
| Progress indicators | Show completion percentage |
| Onboarding checklists | Visible incomplete items |
| Form progress | Step indicators |
| Gamification | Achievement progress bars |

**Implementation:**
```tsx
// Onboarding checklist
<Card>
  <CardHeader>
    <CardTitle>Get Started</CardTitle>
    <Progress value={completedSteps / totalSteps * 100} />
  </CardHeader>
  <CardContent>
    {steps.map(step => (
      <div key={step.id} className="flex items-center gap-2">
        {step.completed ? (
          <CheckCircle className="text-green-500" />
        ) : (
          <Circle className="text-muted-foreground" />
        )}
        <span className={step.completed ? "line-through text-muted-foreground" : ""}>
          {step.title}
        </span>
      </div>
    ))}
  </CardContent>
</Card>
```

---

### Law of Proximity
**"Elements close together are perceived as related"**

```tsx
// WRONG: Unrelated items too close
<div>
  <Input />
  <Button>Submit</Button>
  <Link>Terms</Link>
</div>

// CORRECT: Visual grouping with spacing
<div className="space-y-6">
  <div className="space-y-2">
    <Label>Email</Label>
    <Input />
    <p className="text-sm text-muted-foreground">We'll never share your email.</p>
  </div>

  <Button className="w-full">Submit</Button>

  <p className="text-center text-sm text-muted-foreground">
    By signing up, you agree to our <Link>Terms</Link>
  </p>
</div>
```

---

### Law of Common Region
**"Elements within a boundary are perceived as a group"**

```tsx
// Use cards to create visual regions
<Card>
  <CardHeader>
    <CardTitle>Account Settings</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <Input label="Name" />
    <Input label="Email" />
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>

// Use borders/backgrounds for sections
<section className="border rounded-lg p-4 space-y-4">
  {/* Related content */}
</section>
```

---

## Cognitive Load Theory

### Types of Cognitive Load

| Type | Definition | Strategy |
|------|------------|----------|
| **Intrinsic** | Inherent complexity of the task | Simplify task, break into steps |
| **Extraneous** | Load from poor design | Remove distractions, noise |
| **Germane** | Load from learning | Build on familiar patterns |

### Reducing Extraneous Load

**Visual Noise:**
```tsx
// WRONG: Decorative noise
<Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-4 border-dashed shadow-2xl">
  <div className="absolute top-0 right-0 animate-spin">✨</div>

// CORRECT: Clean, purposeful
<Card className="bg-card border shadow-sm">
```

**Information Overload:**
```tsx
// WRONG: Everything visible
<Dashboard>
  <KPIs /> {/* 10 KPIs */}
  <Charts /> {/* 5 charts */}
  <Tables /> {/* Full data */}
  <Activity /> {/* 50 items */}
</Dashboard>

// CORRECT: Progressive disclosure
<Dashboard>
  <KPIs /> {/* Top 4 KPIs */}
  <Charts /> {/* 2 main charts */}
  <Tabs>
    <Tab label="Activity"><ActivityPreview limit={5} /></Tab>
    <Tab label="All Data"><Link to="/data">View all →</Link></Tab>
  </Tabs>
</Dashboard>
```

### Building Germane Load (Good Learning)

**Consistent Patterns:**
```tsx
// Same pattern everywhere for similar actions
// Delete always: red, confirmation dialog
// Save always: bottom-right, primary button
// Cancel always: secondary, left of save
// Loading always: skeleton matching layout
```

**Familiar Mental Models:**
| Action | Expected Pattern |
|--------|------------------|
| Drag & drop | Move items, reorder |
| Swipe left | Delete/archive |
| Pull down | Refresh |
| Long press | Context menu |
| Double click | Edit |

---

## Mental Models

### Recognition vs Recall

**Recognition (easier):**
- Dropdown menus showing all options
- Autocomplete suggestions
- Recent items list
- Visual icons with labels

**Recall (harder):**
- Empty text input requiring exact syntax
- Keyboard shortcuts (without hints)
- Remembering menu locations

**Implementation:**
```tsx
// WRONG: Requires recall
<Input placeholder="Enter command..." />

// CORRECT: Recognition with search
<CommandPalette>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandGroup heading="Recent">
      {recentCommands.map(cmd => <CommandItem />)}
    </CommandGroup>
    <CommandGroup heading="Actions">
      {allActions.map(action => (
        <CommandItem>
          <action.icon />
          <span>{action.label}</span>
          <CommandShortcut>{action.shortcut}</CommandShortcut>
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</CommandPalette>
```

---

## Applying Laws Together

### Example: Settings Page

```tsx
// Hick's Law: Limited categories
// Miller's Law: Max 7 sections visible
// Jakob's Law: Standard settings pattern
// Proximity: Related fields grouped
// Common Region: Cards separate sections

<SettingsLayout>
  <SettingsNav>
    <NavItem>General</NavItem>
    <NavItem>Profile</NavItem>
    <NavItem>Notifications</NavItem>
    <NavItem>Security</NavItem>
    <NavItem>Billing</NavItem>
  </SettingsNav>

  <SettingsContent>
    <Card> {/* Common Region */}
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your public profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4"> {/* Proximity */}
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input />
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea />
        </div>
      </CardContent>
      <CardFooter className="justify-end"> {/* Jakob's Law: save bottom-right */}
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  </SettingsContent>
</SettingsLayout>
```

---

## Quick Reference Card

| Law | One-Liner | Action |
|-----|-----------|--------|
| Fitts | Big + close = easy | Large CTAs, group related |
| Hick | Fewer = faster | Max 7, progressive disclosure |
| Miller | 7±2 chunks | Group info, paginate |
| Jakob | Follow conventions | Don't reinvent UX |
| Doherty | <400ms = flow | Optimistic UI, prefetch |
| Peak-End | Memory = peak + end | Celebrate, end well |
| Aesthetic | Pretty = usable | Invest in polish |
| Zeigarnik | Incomplete = memorable | Progress bars, checklists |
| Proximity | Close = related | Space to separate |
| Common Region | Boundary = group | Cards, borders |
