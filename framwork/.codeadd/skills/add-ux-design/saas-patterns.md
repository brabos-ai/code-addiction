# SaaS UX Pattern Library

Reference patterns for common SaaS surfaces. Use alongside `modern-patterns.md` (interaction patterns) and `design-direction.md` (aesthetic decisions).

---

## Dashboard

- **Layout:** KPIs → Charts → Activity
- **KPIs:** `grid-cols-2 md:grid-cols-4`, card = icon + value + label + trend, max 4
- **Charts:** line for trends, bar for comparisons, height `h-[200px] md:h-[300px]`
- **Activity:** avatar + action + timestamp
- **Mobile:** KPIs 2-col (swipe if >4), charts full-width with horizontal scroll

## Settings

- **Layout:** desktop = sidebar → forms; mobile = accordion or tabs
- **Sections:** General, Profile, Notifications, Security, Billing, Team, API
- **Forms:** label above; sticky save bar bottom on mobile
- **Feedback:** save → toast 3s; unsaved changes → warning dialog
- **Danger zone:** red zone at bottom + confirmation dialog

## Billing

- **Pricing:** 3 tiers, "Popular" badge + `border-primary` highlight, monthly/annual toggle
- **Cards:** name → price → features → CTA
- **Usage:** progress bar `current/limit`, warn yellow @ 80%, red @ 95%
- **Invoices:** cols `date | desc | amount | status | actions`; mobile = cards
- **Checkout flow:** plan → payment → confirm → success

## Onboarding

- **Flow:** Welcome → Profile → FirstAction → Success
- **Max steps:** 5
- **Progress:** stepper or checklist
- **Empty state:** illustration + headline + description + CTA
- **Tooltips:** max 3, dismiss via click or X
- **Celebration:** confetti or animation on completion

## DataTables

- **Layout:** filters → table → pagination
- **Header:** search (debounce 300ms), filters as dropdown + chips, bulk actions on selection
- **Row structure:** checkbox | main | secondary | status | actions
- **Mobile:** cards or horizontal scroll with sticky first column
- **States:** loading = skeleton 3-5 rows; empty = illustration + CTA; error = message + retry

## Auth

- **Login:** email + password, social, forgot, signup link
- **Signup:** name + email + password, terms, social
- **Layout:** desktop = split form | illustration; mobile = centered, logo top
- **Magic link:** email → link → inbox → logged-in
- **Forgot password:** email → reset → new password → success
- **2FA:** 6 digits + resend

## Workspace

- **Members:** avatar + name + email + role + actions
- **Roles:** Owner, Admin, Member, Viewer
- **Invite:** email + role + send; pending list
- **Switcher:** header dropdown with current highlighted
- **Settings sections:** General, Members, Billing, Danger Zone

## Navigation

- **Desktop sidebar:** logo → nav → spacer → user; collapsible 240px → 60px
- **Desktop header:** breadcrumb | search | notifications | user; `h-14 md:h-16`, sticky
- **Mobile bottom nav:** max 5, icon + label, `h-16`
- **Mobile drawer:** hamburger → full nav
- **Active state:** `bg-muted` + `text-primary` + `font-medium`

## Forms

- **Layout:** `max-w-2xl`, `space-y-6` between sections, `space-y-4` between fields
- **Fields:** label above with `*` for required; placeholder = example; helper = muted; error = destructive
- **Validation:** on blur first, on change after first error, inline errors
- **Actions:** bottom right, primary + secondary outline
- **Mobile:** sticky bottom + safe-area
- **Autosave:** draft indicator for long forms

## Modal

- **Sizes:** `sm: max-w-sm`, `md: max-w-md`, `lg: max-w-lg`, `full: max-w-4xl`
- **Structure:** header (title + X) → content (scroll) → footer (actions right)
- **Mobile:** bottom drawer (Vaul)
- **Behavior:** close on X, Esc, outside click; trap focus

## Feedback

- **Toast position:** bottom-right desktop; bottom-center mobile
- **Toast types:** success = green, auto 3s; error = red, manual + retry; warning = yellow, manual
- **Loading:** content = Skeleton; actions = Spinner + disable; uploads = progress
- **Confirm:** destructive = AlertDialog red; standard = Dialog
