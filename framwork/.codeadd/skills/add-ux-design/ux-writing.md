# UX Writing Guide

> Reference file for `.codeadd/skills/ux-design/SKILL.md`

Guidelines for microcopy, error messages, empty states, and all interface text.

---

## Core Principles

### Voice & Tone

| Principle | Do | Don't |
|-----------|-----|-------|
| **Concise** | "Save" | "Click here to save your changes" |
| **Active** | "Email sent" | "Your email has been sent" |
| **Human** | "Something went wrong" | "Error 500: Internal Server Error" |
| **Helpful** | "Try again" | "Retry" |
| **Confident** | "Create project" | "You can create a project" |

### Writing Style

```
✅ Use:
- Present tense
- Active voice
- Second person (you/your)
- Sentence case (not Title Case)
- Specific actions

❌ Avoid:
- Jargon and technical terms
- Double negatives
- Passive voice
- ALL CAPS (except logos)
- Exclamation marks!!!
```

---

## Button Labels

### Primary Actions

| Context | Good | Bad |
|---------|------|-----|
| Save form | Save | Submit |
| Create new | Create project | Add |
| Delete | Delete | Remove |
| Confirm | Confirm | OK |
| Cancel | Cancel | No / Nevermind |
| Continue flow | Continue | Next |
| Final step | Complete setup | Finish |

### Destructive Actions

| Action | Button | Confirmation Text |
|--------|--------|-------------------|
| Delete item | Delete | "Delete this project? This can't be undone." |
| Remove member | Remove | "Remove John from the team?" |
| Cancel subscription | Cancel plan | "Cancel your subscription? You'll lose access on [date]." |

### Loading States

| Action | Loading Label |
|--------|---------------|
| Save | Saving... |
| Create | Creating... |
| Delete | Deleting... |
| Send | Sending... |
| Upload | Uploading... |
| Connect | Connecting... |

---

## Error Messages

### Structure

```
[What happened] + [Why/context] + [What to do]
```

### Examples

| Bad | Good |
|-----|------|
| "Error" | "Couldn't save changes. Check your connection and try again." |
| "Invalid input" | "Email format is invalid. Try name@example.com" |
| "Error 404" | "Page not found. It may have been moved or deleted." |
| "Request failed" | "Couldn't connect to server. Please try again." |
| "Forbidden" | "You don't have access to this project. Contact the owner." |

### By Error Type

**Validation Errors:**
```tsx
// Field-level (inline)
"Enter a valid email address"
"Password must be at least 8 characters"
"This field is required"
"Username is already taken"

// Form-level (summary)
"Please fix the errors above to continue"
```

**Network Errors:**
```tsx
"Couldn't connect. Check your internet and try again."
"Server is temporarily unavailable. Please try again later."
"Request timed out. Please try again."
```

**Permission Errors:**
```tsx
"You don't have permission to edit this."
"Only workspace admins can change billing settings."
"Your session has expired. Please sign in again."
```

**Not Found:**
```tsx
"This page doesn't exist. It may have been moved or deleted."
"Project not found. It may have been deleted."
"No results found for '[query]'. Try a different search."
```

### Error Message Components

```tsx
// Inline field error
<div className="space-y-2">
  <Label>Email</Label>
  <Input className="border-destructive" />
  <p className="text-sm text-destructive">
    Enter a valid email address
  </p>
</div>

// Toast error
toast.error("Couldn't save changes", {
  description: "Check your connection and try again.",
  action: {
    label: "Retry",
    onClick: () => retry(),
  },
})

// Full page error
<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
  <h2 className="text-xl font-semibold">Something went wrong</h2>
  <p className="text-muted-foreground mt-2 max-w-md">
    We couldn't load your dashboard. This is usually temporary.
  </p>
  <Button onClick={retry} className="mt-4">
    Try again
  </Button>
</div>
```

---

## Empty States

### Structure

```
[Icon/Illustration]
[Title: What's missing]
[Description: Why it matters / value proposition]
[CTA: Primary action]
```

### By Context

**First Use / Onboarding:**
```tsx
<EmptyState
  icon={<Rocket className="h-12 w-12 text-muted-foreground" />}
  title="Create your first project"
  description="Projects help you organize work and collaborate with your team."
  action={<Button>Create project</Button>}
/>
```

**No Results (Search/Filter):**
```tsx
<EmptyState
  icon={<Search className="h-12 w-12 text-muted-foreground" />}
  title="No results found"
  description={`No matches for "${query}". Try adjusting your filters.`}
  action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
/>
```

**No Content Yet:**
```tsx
<EmptyState
  icon={<FileText className="h-12 w-12 text-muted-foreground" />}
  title="No documents yet"
  description="Documents you create will appear here."
  action={<Button>Create document</Button>}
/>
```

**No Activity:**
```tsx
<EmptyState
  icon={<Activity className="h-12 w-12 text-muted-foreground" />}
  title="No activity yet"
  description="Recent actions from your team will show up here."
/>
```

**No Permissions:**
```tsx
<EmptyState
  icon={<Lock className="h-12 w-12 text-muted-foreground" />}
  title="Access restricted"
  description="You don't have permission to view this content. Contact the workspace owner for access."
  action={<Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>}
/>
```

### Empty State Component

```tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && (
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold">{title}</h3>
    {description && (
      <p className="text-muted-foreground mt-2 max-w-sm">
        {description}
      </p>
    )}
    {action && (
      <div className="mt-6">
        {action}
      </div>
    )}
  </div>
)
```

---

## Loading States

### Copy Guidelines

| Context | Bad | Good |
|---------|-----|------|
| Generic | Loading... | (no text, just spinner) |
| Dashboard | Loading... | Fetching your data... |
| Save | Loading... | Saving changes... |
| Search | Loading... | Searching... |
| Long process | Loading... | This may take a moment... |

### Progress Messages

```tsx
// File upload
"Uploading 3 of 5 files..."
"Processing image..."
"Almost done..."

// Multi-step process
"Creating your workspace..."
"Setting up defaults..."
"Inviting team members..."
"You're all set!"
```

### Skeleton Labels (Screen Reader)

```tsx
<div aria-label="Loading content" role="status">
  <Skeleton className="h-6 w-3/4" />
  <Skeleton className="h-4 w-1/2 mt-2" />
  <span className="sr-only">Loading...</span>
</div>
```

---

## Success Messages

### Toast Messages

| Action | Message |
|--------|---------|
| Save | "Changes saved" |
| Create | "Project created" |
| Delete | "Item deleted" |
| Send invite | "Invitation sent to john@example.com" |
| Copy | "Copied to clipboard" |
| Export | "Export complete. Downloading..." |

### Celebration Moments

| Milestone | Message | Visual |
|-----------|---------|--------|
| First project | "Your first project is ready!" | Confetti |
| Complete onboarding | "You're all set!" | Checkmark animation |
| Reach goal | "Goal achieved!" | Celebration animation |
| Upgrade | "Welcome to Pro!" | Special animation |

### Success Message Component

```tsx
// Simple toast
toast.success("Changes saved")

// With details
toast.success("Project created", {
  description: "Your new project is ready to use.",
})

// Full page success
<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", duration: 0.5 }}
  >
    <CheckCircle className="h-16 w-16 text-green-500" />
  </motion.div>
  <h2 className="text-2xl font-semibold mt-4">You're all set!</h2>
  <p className="text-muted-foreground mt-2 max-w-md">
    Your account is ready. Here's what you can do next.
  </p>
  <div className="flex gap-3 mt-6">
    <Button>Create first project</Button>
    <Button variant="outline">Explore features</Button>
  </div>
</div>
```

---

## Form Labels & Helpers

### Labels

| Bad | Good |
|-----|------|
| "Name*" | "Full name" (required indicator elsewhere) |
| "E-mail Address" | "Email" |
| "Enter your password" | "Password" |
| "Phone #" | "Phone number" |

### Placeholders

| Bad | Good |
|-----|------|
| "Enter name here" | "John Smith" |
| "Type email" | "you@example.com" |
| "Password" | (no placeholder for passwords) |
| "Search..." | "Search projects..." |

### Helper Text

| Context | Helper Text |
|---------|-------------|
| Password requirements | "At least 8 characters with a number" |
| Username | "Letters, numbers, and underscores only" |
| Bio | "Brief description for your profile. Max 160 characters." |
| API Key | "Keep this secret. It won't be shown again." |

### Required Fields

**Option 1:** Mark optional fields
```tsx
<Label>Email</Label>
<Label>Phone number <span className="text-muted-foreground">(optional)</span></Label>
```

**Option 2:** Indicate required with asterisk + legend
```tsx
<p className="text-sm text-muted-foreground mb-4">* Required fields</p>
<Label>Email *</Label>
```

---

## Confirmation Dialogs

### Destructive Actions

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete project?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "My Project" and all its data.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground">
        Delete project
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Unsaved Changes

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
      <AlertDialogDescription>
        You have unsaved changes. Do you want to save them before leaving?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Discard</AlertDialogCancel>
      <AlertDialogAction>Save changes</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Confirmation Patterns

| Action | Title | Description | Confirm | Cancel |
|--------|-------|-------------|---------|--------|
| Delete | Delete [item]? | Permanent deletion warning | Delete | Cancel |
| Remove member | Remove [name]? | What happens to their access | Remove | Cancel |
| Cancel subscription | Cancel plan? | When access ends, what's lost | Cancel plan | Keep plan |
| Leave page | Unsaved changes | Ask to save or discard | Save | Discard |
| Log out | Log out? | (optional, often not needed) | Log out | Cancel |

---

## Tooltips & Hints

### When to Use

| Use Tooltips For | Don't Use Tooltips For |
|------------------|------------------------|
| Icon-only buttons | Critical information |
| Abbreviations | Instructions that fit inline |
| Extra context | Mobile (no hover) |
| Keyboard shortcuts | Form validation |

### Copy Guidelines

```tsx
// Short and scannable
<TooltipContent>Edit profile</TooltipContent>

// With keyboard shortcut
<TooltipContent>
  <p>Edit profile</p>
  <p className="text-muted-foreground">⌘E</p>
</TooltipContent>

// With additional context
<TooltipContent>
  <p className="font-medium">Premium feature</p>
  <p className="text-muted-foreground">Upgrade to access</p>
</TooltipContent>
```

---

## Notifications

### Types

| Type | Use For | Example |
|------|---------|---------|
| Info | Neutral updates | "New feature available" |
| Success | Completed actions | "Payment received" |
| Warning | Potential issues | "Storage almost full" |
| Error | Failed actions | "Payment failed" |

### Copy Structure

```
[Brief title]
[Details/context]
[Action if applicable]
```

### Examples

```tsx
// Info
{
  title: "New feature",
  description: "Try our new dashboard widgets.",
  action: "Explore"
}

// Success
{
  title: "Invoice paid",
  description: "Payment of $49.00 received.",
  action: "View receipt"
}

// Warning
{
  title: "Storage limit",
  description: "You've used 80% of your storage.",
  action: "Upgrade plan"
}

// Error
{
  title: "Payment failed",
  description: "Your card was declined. Please update payment method.",
  action: "Update card"
}
```

---

## Accessibility Copy

### Screen Reader Text

```tsx
// Icon-only buttons need labels
<Button size="icon" aria-label="Delete item">
  <Trash className="h-4 w-4" />
</Button>

// Loading states
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading && <span className="sr-only">Loading...</span>}
  {content}
</div>

// Form errors
<Input
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <p id="email-error" role="alert" className="text-destructive">
    {error}
  </p>
)}
```

### Alt Text

| Image Type | Alt Text |
|------------|----------|
| Decorative | alt="" (empty) |
| Informative | Describe content |
| Functional | Describe action |
| Complex | Detailed description |

```tsx
// Decorative (empty alt)
<img src="decoration.svg" alt="" />

// Informative
<img src="chart.png" alt="Sales chart showing 20% growth in Q4" />

// Functional (in button)
<button>
  <img src="delete.svg" alt="Delete" />
</button>
```

---

## Internationalization Tips

### Write for Translation

```
✅ Do:
- Use complete sentences
- Avoid concatenating strings
- Use placeholders for variables
- Keep sentences simple

❌ Don't:
- Split sentences across elements
- Use idioms or slang
- Embed text in images
- Assume date/number formats
```

### Variable Handling

```tsx
// Bad: String concatenation
`Welcome back, ` + userName + `!`

// Good: Template with placeholder
t('welcome_back', { name: userName })
// "Welcome back, {{name}}!"

// Bad: Pluralization hack
items.length + " item" + (items.length > 1 ? "s" : "")

// Good: Proper pluralization
t('item_count', { count: items.length })
// one: "{{count}} item"
// other: "{{count}} items"
```

---

## Quick Reference

### Microcopy Checklist

- [ ] Is it concise? (can words be removed?)
- [ ] Is it active voice? (not passive)
- [ ] Is it specific? (not vague)
- [ ] Is it human? (not robotic)
- [ ] Is it helpful? (guides next action)
- [ ] Is it consistent? (matches other UI text)

### Common Replacements

| Instead of | Write |
|------------|-------|
| Click here | [Descriptive link text] |
| Please | (remove, be direct) |
| Error occurred | [Specific error message] |
| Invalid | [What's wrong + how to fix] |
| Success! | [Specific confirmation] |
| Loading... | [Contextual message or nothing] |
| Are you sure? | [Specific consequence] |
| Submit | [Specific action: Save, Send, Create] |
