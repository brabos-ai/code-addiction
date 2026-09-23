# Plan: Board design — palette, elevation and card hierarchy

> **Status:** draft — checkpoint 1 (F1–F13) implemented and audited; checkpoint 2 (F14–F21) in flight
> **Layers:** product
> **Type:** product
> **Created:** 2026-09-23
> **Delivery:** confirm

---

## Objective

`[from conversation, no design document]`

The board renders the design direction its own stylesheet declares: a cool-neutral palette with one
cobalt accent, a dark theme with real depth, and the priority rank legible enough to be the single
bold element it was designed to be. No route, filter, data path or ARIA role changes.

**When this build is done:** every colour, elevation, type size and interaction surface in the board
comes from a named token; the light theme is cool throughout instead of warm-on-cool; `dropped` and
`open` are told apart at a glance and so are `warn` and `doing`; the dark theme separates page, card
and sheet into three planes; the ticket id and the rank both pass their contrast floor; and the
Playwright suite still passes at 360, 768 and 1080 in both colour schemes.

## Context

The board shipped on 2026-09-21 (`2026-09-21T145331-PLAN--backlog-board-002-board-app`) with a
stated design direction written into the top of its stylesheet. A design review of the running app on
2026-09-23 found the implementation had drifted from that direction in the palette layer, and that
several defects a reviewer would call "component problems" are single token failures seen through
components.

No design document and no intent file exist — the review happened in conversation and the user
approved the full set of adjustments. The decisions below are recorded inline for that reason.

**The stylesheet's own header is the authority this plan defers to**, not the reviewer's taste:

```
board/src/index.css:3-7
  Differentiation: the priority rank. Line order on the board IS the priority,
  so every card and row carries its queue position as a large tabular numeral —
  the one bold element; everything around it stays quiet.
  Palette "stone and cobalt": cool neutrals, one cobalt accent, status hues only
  where a status is named.
```

Three findings from the review were reversed against that header and are recorded in
**Validated Decisions** rather than dropped silently, because a later reader would otherwise find the
reviewer's first opinion in the conversation and the opposite in the code.

## Global Constraints

- `Palette "stone and cobalt": cool neutrals, one cobalt accent, status hues only where a status is named` (board/src/index.css:6-7)
- `Differentiation: the priority rank … the one bold element; everything around it stays quiet` (board/src/index.css:3-5)
- `expect(bg).toBe('rgb(17, 19, 23)')` (board/e2e/board.spec.ts:117) — any change to the dark `--bg` updates this assertion in the same F-block
- `expect(dialog.getByRole('button')).toHaveCount(1)` (board/e2e/board.spec.ts:89) — the sheet keeps exactly one button. **Amended by F21**: the guard's stated subject is the action region for running or refining a ticket, "designed and deliberately NOT rendered" (board/src/views/ticket-sheet.tsx:19-22). It becomes a tripwire on the exact set — Close plus the id copy — so any further button still trips it
- `expect(scroll, 'page scrolls sideways').toBeLessThanOrEqual(client)` (board/e2e/board.spec.ts:23) — horizontal scroll stays on the columns container, never on `document.scrollingElement`
- `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }` (board/src/index.css:117-120) — focus stays visible in both schemes
- `expect(errors.get(page), 'console errors').toEqual([])` (board/e2e/board.spec.ts:15) — no new console error at any viewport
- `Nothing under mcp/ is registered in provider-map.json` applies to `board/` identically — it is `[product]` because it ships, not because it is registered (AGENTS.md, Product Layer — `board/`)
- No functionality change: routes, filters, data flow, ARIA roles and keyboard behaviour are untouched (user instruction, 2026-09-23). **Amended for Checkpoint 2 on 2026-09-23** (user instruction): additive interaction is allowed — a gesture that exists today keeps working unchanged, no route or filter state changes, and nothing alters how a card is opened, read or closed. Grouping, density and a board selection cursor stay out under the original wording

## Problem

1. **The light theme contradicts its own stated direction** — `--bg #f2f3ef`, `--surface-2 #f7f8f5`
   and `--line #dfe1db` are warm neutrals (green is the highest channel), while `--ink #15171c`,
   `--muted #62676f` and `--faint #8c9199` are cool (blue is the highest channel). The stylesheet
   declares "cool neutrals". A warm ground under cool type is what makes the page read muddy, and it
   also puts the accent-tinted shadow (`rgb(45 75 224 / 0.06)`) in conflict with the surface it falls on.

2. **`--s-dropped` is byte-identical to `--faint`, in both schemes** — `#8c9199` light, `#7b818b`
   dark. `dropped` has no colour of its own; it has the colour of de-emphasised text. Beside
   `--s-open` (`#5b6472` / `#a8b0bd`) the two most opposed states differ only in lightness, which at
   the 6px status dot (`board-view.tsx:132`, `ui.tsx:60`) is not a difference.

3. **`--warn` and `--s-doing` collide, and collide differently per scheme** — identical in dark
   (`#f0b24a`), near-identical and not equal in light (`#9a5b00` vs `#a86400`). One pair of tokens
   cannot be an alias in one theme and a distinction in the other.

4. **The dark theme has no depth** — `--bg #111317` to `--surface #181b20` is a ~7-point luminance
   step, and every shadow is pure black over a near-black ground, which cannot darken anything.
   Card and sheet share `--surface`, so the floating panel sits at the same elevation as the card
   behind it. The same cause makes `dark:bg-black/50` (`ticket-sheet.tsx:38`) an invisible backdrop
   and `ring-line` (~1.3:1 against `--bg`) an invisible ring.

5. **Two text roles fail their contrast floor** — the ticket id renders `text-faint` at 11px
   (`ticket-card.tsx:42`): ~2.8:1 on the light page background, ~3.2:1 on the light surface. The rank
   numeral renders `text-ink/25` (`ticket-card.tsx:59`, `list-view.tsx:78`): ~2.1:1 in dark. The rank
   is the element the stylesheet nominates as the one bold thing on the card, and it is the least
   visible thing on it.

6. **The accent renders nowhere on either main view** — `--accent` reaches only the focus ring, the
   skip link, `EmptyBoard` and the `Done when` box. The declared "one cobalt accent" is absent from
   the board and the list entirely.

7. **`--s-done` carries two meanings** — the done status and the "Live" heartbeat dot
   (`app-shell.tsx:76-77` reads `var(--s-done)` directly). Green means "this ticket is finished" and
   "the server is connected" in the same viewport.

8. **Design values are arbitrary and scattered instead of tokenised** — 21 literal `text-[Npx]`
   occurrences across 8 component files spanning six sizes, and 12 arbitrary interaction alphas
   across 7 files in five distinct values (`ink/[0.025]`, `ink/[0.03]`, `ink/[0.05]`, `ink/[0.06]`,
   `ink/[0.07]`). `@theme inline` carries colour and shadow and nothing else, so nothing holds these
   to a system.

9. **The board wastes its viewport and the empty columns dominate it** — at `lg` the columns row
   becomes a grid of equal shares, driven by the inline
   `style={{ gridTemplateColumns: repeat(N, minmax(0, 1fr)) }}` at `board-view.tsx:108` together with
   `lg:grid` at `board-view.tsx:106` and `lg:w-auto lg:min-w-0` at `board-view.tsx:126`. A board whose
   tickets are all `open` therefore renders one column of content and three empty ones of the same
   width, each filled by a dashed 190px-tall empty box (`board-view.tsx:144`) carrying information the
   column header's `0` already gave.

10. **The list truncates its Theme column below usefulness, and its timestamp is unformatted** —
    the 10rem Theme column (`list-view.tsx:91`) renders `Delivered-work relations…`. `Updated` does
    carry an absolute value in `title` (`list-view.tsx:92`), but as the raw ISO string
    `2026-09-21T16:52:32Z` rather than through `absoluteTime()`, which is how `LiveStamp` formats the
    same kind of value (`app-shell.tsx:74`).

## Proposal

Fix the token layer first, then the components that read it. Most of what reads as a component defect
in this list is a token defect observed through a component: the chips already distinguish theme from
label (`ui.tsx:40` filled vs `:42` outlined) and the sheet already has a backdrop — both fail only in
dark, both for the same reason as Problem 4. Repairing the tokens removes those symptoms without a
component touching them.

Sequencing therefore runs: colour (F1) → elevation (F2) → the two token families the components
still hard-code, type and interaction (F3, F4) → the component work that needs the new tokens
(F5–F9). Each F-block leaves the app building and the suite passing.

## Current State

| Artefact | What it is today | Depended on by |
|---|---|---|
| `board/src/index.css` | 29 colour tokens per scheme, 3 shadow tokens, `@theme inline` mapping colour+shadow only, `[data-status]` → `--st`/`--st-soft` | every component in `board/src/` |
| `board/src/components/ui.tsx` | `Button` (cva), `Chip` (plain/accent/outline), `StatusPill` (reads `--st`) | ticket-card, states, filter-bar, list-view |
| `board/src/components/ticket-card.tsx` | `TicketCard` + `TicketMeta`, shared by board and list | board-view, list-view |
| `board/src/views/board-view.tsx` | Columns, mobile status tabs, the dashed empty `<li>` | routes/board |
| `board/src/views/list-view.tsx` | Header row + `Row` grid | routes/list |
| `board/src/views/ticket-sheet.tsx` | Radix dialog: bottom sheet under `sm`, side panel above | both detail routes |
| `board/src/components/app-shell.tsx` | Header, view switch, `LiveStamp`, `Mark` | both views |
| `board/src/components/states.tsx` | ErrorPanel, EmptyBoard, NoMatches, HealthBanner, BoardSkeleton | both views |
| `board/e2e/board.spec.ts` | 3 viewports × light/dark, asserts no sideways scroll, no console errors, the dark `--bg` literal, and a one-button sheet | CI job `board` |

**`board/` is absent from `framwork/.codeadd/artefact-graph.json`** — 0 matches across its 234 nodes,
because the graph indexes `framwork/.codeadd/` and `.claude/`. See **Validated Decisions** for how the
STEP 3.2 questions were answered instead.

## Scope

### Includes

- **F1** [product] — `board/src/index.css` (`:root`, the `prefers-color-scheme: dark` block,
  `@theme inline`) and `board/e2e/board.spec.ts`: the colour system. Move the light neutrals to the
  cool ramp the header declares (`--bg`, `--surface-2`, `--line`, `--line-strong`); give `--s-dropped`
  a value of its own in both schemes, separated from `--s-open` by chroma rather than lightness;
  make `--warn` an explicit alias of `--s-doing` in both schemes so the two can never disagree again;
  re-chroma the dark `--danger` to sit with `--s-doing` and `--s-done` instead of above them; deepen
  the dark `--bg` so page, card and sheet can occupy three planes; add `--surface-3` for the sheet,
  `--surface-hover` / `--surface-active` / `--surface-sunken` for interaction, and `--rank` for the
  priority numeral; register every new token in `@theme inline`. Update the dark-background assertion
  at `board/e2e/board.spec.ts:117` to the new value in this same block. **Must not lose:** the
  `[data-status]` → `--st` / `--st-soft` indirection, `color-scheme: light dark`, or the scheme-driven
  (not class-driven) theming.
  - **Produces:** `--surface-3`, `--surface-hover`, `--surface-active`, `--surface-sunken`, `--rank` in `@theme inline`

- **F2** [product] — `board/src/index.css`, `board/src/components/ticket-card.tsx:49`,
  `board/src/views/ticket-sheet.tsx:38,47,49`: elevation. Rebuild `--shadow-card` / `--shadow-lift` /
  `--shadow-sheet` per scheme so dark elevation comes from a top inset highlight rather than from
  black over near-black; point the sheet at `--surface-3`; raise the dark backdrop until it reads as
  one. **Must not lose:** the light scheme's accent-tinted shadow, which is deliberate and becomes
  correct once F1 makes the ground cool.
  - **Consumes:** `--surface-3` (F1)

- **F3** [product] — `board/src/index.css` plus every file carrying a literal size —
  `ticket-card.tsx`, `ui.tsx`, `app-shell.tsx`, `markdown.tsx`, `filter-bar.tsx`, `board-view.tsx`,
  `list-view.tsx`, `ticket-sheet.tsx`: a five-step type scale as `@theme inline` tokens, replacing all
  21 `text-[Npx]` occurrences across those 8 files. **Must not lose:** the rendered size of the sheet
  title and the card title — this is a tokenisation, not a retypesetting.
  - **Produces:** the `--text-*` scale in `@theme inline`

- **F4** [product] — `ui.tsx:14,40`, `app-shell.tsx:38`, `states.tsx:35,100,101`,
  `markdown.tsx:15`, `filter-bar.tsx:125`, `list-view.tsx:73`, `ticket-sheet.tsx:66,120`: replace the
  12 arbitrary `ink/[0.0XX]` alphas across those 7 files with `--surface-hover` / `--surface-active` /
  `--surface-sunken`.
  **Must not lose:** the `Chip` plain-vs-outline distinction — it is the theme/label distinction and
  it must now read in dark, which is the point of routing it through a token.
  - **Consumes:** `--surface-hover`, `--surface-active`, `--surface-sunken` (F1)

- **F5** [product] — `board/src/components/ticket-card.tsx`: card hierarchy. The id moves from
  `text-faint` to `--muted` with tabular figures and letter-spacing so it reads as an identifier; the
  rank numeral moves from `text-ink/25` to `--rank` and keeps its size and weight; the hover
  transition moves off the rank and onto the title; a long theme stops pushing the labels onto a
  second line. **Must not lose:** the rank as the card's one bold element (Global Constraints), the
  `aria-label="Priority N"`, or `TicketMeta`'s reuse by the list row.
  - **Consumes:** `--rank` (F1)

- **F6** [product] — `board/src/views/board-view.tsx:104-108,126,144`,
  `board/src/components/states.tsx:97-103`: columns sized to content. Replace the equal-share layout —
  the inline `style={{ gridTemplateColumns: repeat(N, minmax(0, 1fr)) }}` at `board-view.tsx:108`,
  `lg:grid` at `:106` and `lg:w-auto lg:min-w-0` at `:126` — with a fixed column width and a
  left-aligned row; an empty column collapses to its header; the dashed empty `<li>` at `:144` is
  removed. `BoardSkeleton` tracks the new layout so the first paint does not jump.
  **Must not lose — and this is the block's hard constraint:** `board-view.tsx:106` currently carries
  `lg:overflow-visible`, which turns the scroll container OFF at exactly the breakpoint where this
  block stops columns being equal shares. The 1080 e2e viewport is inside `lg`, and
  `noSidewaysScroll` measures `document.scrollingElement` (Global Constraints), so once total column
  width can exceed the viewport the overflow bleeds to the page and the suite fails at 1080. F6 must
  therefore either keep a scroll container active at `lg` (dropping `lg:overflow-visible`, and
  handling the `lg:mx-0 lg:px-0` gutter reset that accompanies it) or constrain total column width so
  it can never exceed the viewport — and state in the ledger which of the two it chose. The
  `sm:hidden` mobile status tablist and its arrow-key handling stay exactly as they are.

- **F7** [product] — `board/src/views/ticket-sheet.tsx`: the panel. Resolve the one-sided
  `rounded-l-[22px]` against an edge-anchored panel; add a visible `Esc` hint beside the close control
  **as a non-button element**; change `Done when` from a filled `bg-accent-soft/70` box to a left rule
  on `--surface-2`. **Must not lose:** exactly one button in the dialog (Global Constraints), the
  `onOpenAutoFocus` handler, and the `sm:hidden` drag handle.

- **F8** [product] — `board/src/views/list-view.tsx:91,92`: the table. Widen the Theme column past the
  point where truncation destroys the word, or reduce it to a status-style marker; run the existing
  `title={ticket.updated_at}` at `:92` through `absoluteTime()` so the hover value reads as a date
  instead of a raw ISO string, matching `LiveStamp` (`app-shell.tsx:74`); label the Priority column
  for what it is. **Must not lose:** the `grid-cols-[…]` responsive ladder or the row's single-link
  structure. **Note:** the `title` is not missing — it is unformatted. This block replaces its value,
  it does not add the attribute.

- **F9** [product] — `board/src/components/app-shell.tsx:76-77` plus the accent's new sites: decouple
  the Live heartbeat from `--s-done` so green means one thing; give `--accent` at least one recurring
  role on the board and the list. **Must not lose:** `aria-live="polite"` on the stamp, and the rule
  that status hues appear only where a status is named (Global Constraints) — the accent takes a
  navigational role, never a status one.
  - **Consumes:** `--accent` and `--accent-soft` as F1 leaves them (F1) — F1 re-grounds them against
    the cool light ramp and this block places them; neither produces a new token

### Does NOT Include (important!)

- Any behaviour change: routes, filters, search, SSE, keyboard handling and ARIA roles are untouched.
- A manual light/dark toggle. The app follows `prefers-color-scheme` by design; a switch is a feature,
  not a design fix, and `@custom-variant dark` already exists unused for whoever adds it.
- Pixel-diff snapshot comparison in Playwright. The suite captures screenshots as evidence
  (`board.spec.ts:30`); turning them into assertions is a new gate and would fail this plan by design.
- `board/server.mjs`. It is zero-dependency and serves `dist/` — no design token reaches it.
- The board's distribution half (`backlog-board-004`), which installs it under `.codeadd/board/`.
- Any change under `framwork/.codeadd/` or `framwork/provider-map.json`. `board/` is `[product]`
  because it ships as a release asset, not because it is registered (Global Constraints).

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Light neutrals: warm or cool? | **Cool** | Not a preference. `index.css:6` declares "cool neutrals" and the light values are warm. This repairs a drift, and it also makes the accent-tinted shadow at `index.css:41-42` stop conflicting with its ground |
| Is the priority rank redundant with row order? | **No — keep it at full size** | The review's first opinion was that it should shrink. `index.css:3-5` names it the app's deliberate differentiator and its one bold element. The defect is that at ~2.1:1 in dark it cannot perform that role. Fix the contrast, keep the size (F5) |
| Do theme and label chips need to be differentiated? | **Already are — fix the tokens instead** | The review's first opinion was that they shared a treatment. `ui.tsx:40` renders theme filled and `:42` renders labels outlined, and `ticket-card.tsx:19,23` uses both. They fail to read only in dark, where `ink/[0.05]` and `ring-line` both fall below perception. F4 and F1 fix it; no component change is needed for it |
| Does the sheet need a backdrop added? | **Already has one — raise it in dark** | `ticket-sheet.tsx:38` carries `bg-ink/25 dark:bg-black/50`. It reads correctly in light and not in dark, which is Problem 4, not a missing element (F2) |
| Should the accent be activated or retired? | **Activated** | `index.css:6-7` declares "one cobalt accent". A token that renders on neither main view is not an accent. F9 gives it a navigational role, never a status one, so the same line's "status hues only where a status is named" still holds |
| Fixed column width, given the no-sideways-scroll assertion? | **Yes, but the container must be made to survive `lg`** | `noSidewaysScroll` reads `document.scrollingElement` (`board.spec.ts:18-24`), so the assertion constrains where the scroll lives, not whether columns may exceed the viewport. `board-view.tsx:105` does put `overflow-x-auto` on the columns row — **and `board-view.tsx:106` turns it off again at `lg` with `lg:overflow-visible`**, which is the breakpoint the 1080 e2e project runs in and the breakpoint this change applies to. F6 therefore carries the containment requirement explicitly; a build that only reads line 105 will ship a page that scrolls sideways at 1080 |
| How were the STEP 3.2 graph questions answered? | **By direct import analysis, recorded as NOT VERIFIED via the graph route** | `board/` is absent from `artefact-graph.json` (0 of 234 nodes) because the graph indexes `framwork/.codeadd/` and `.claude/`. `board/src/` is a self-contained Vite app whose entire import surface is inside itself, so the callers of each file are enumerable completely and directly. Grading below is from that enumeration |
| Splitting the token rewrite across several commits? | **No — one F-block for the colour system** | A half-cool, half-warm `:root` is a state no reviewer can judge and no screenshot can explain. The type scale (F3) and the interaction alphas (F4) are separate concerns with separate consumers and do split |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Every design value named and themeable | A larger diff across 10 component files, mostly mechanical substitution |
| A dark theme with three real planes | The current dark `--bg`, and the e2e assertion pinned to it must move with it |
| Contrast floors met for the id and the rank | Some of the current quietness — `--faint` stops carrying text that matters |
| A mechanical guard against arbitrary values returning | One new test file to maintain |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| The dark `--bg` change silently breaks the e2e suite | High | The assertion update is inside F1 itself, not a follow-up; L3 runs the suite per F-block |
| Fixed columns introduce page-level horizontal scroll at `lg` | **High** | `lg:overflow-visible` (`board-view.tsx:106`) disables the scroll container at the breakpoint this change applies to. F6 carries the containment requirement as a named must-not-lose; L3.1 and L4.5 both assert `noSidewaysScroll`, and the Reviewer Handoff requires the ledger to state which route was taken rather than inferring it from a green run |
| An `Esc` hint added as a button breaks the one-button dialog assertion | Medium | F7 states the non-button requirement; L3 asserts the count after F7 |
| Mechanical token substitution shifts a rendered size or colour unintentionally | Medium | L2 asserts no arbitrary value remains; L4 asserts the computed values that matter rather than trusting the eye |
| The new contrast floors are met in one scheme and missed in the other | Medium | L4 measures in both `colorScheme: light` and `dark`, at every viewport project |
| `BoardSkeleton` keeps the old grid and the first paint jumps | Low | `states.tsx:97-103` is named in F6's file list, not left to be noticed |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `board/src/index.css` | product | modify | The colour system (F1), elevation (F2), the type scale (F3), interaction surfaces (F4) |
| `board/e2e/board.spec.ts` | product | modify | The dark `--bg` assertion moves with F1; L3/L4 coverage for F4, F6, F7 |
| `board/test/tokens.test.ts` | product | create | L2 — the source guard that no arbitrary size or alpha returns (F3, F4) |
| `board/src/components/ticket-card.tsx` | product | modify | Elevation (F2), type scale (F3), interaction (F4), card hierarchy (F5) |
| `board/src/components/ui.tsx` | product | modify | Type scale (F3); `Chip` and `Button` interaction surfaces (F4) |
| `board/src/components/app-shell.tsx` | product | modify | Type scale (F3), interaction (F4), Live-dot decoupling and accent role (F9) |
| `board/src/components/states.tsx` | product | modify | Type scale (F3), interaction (F4), `BoardSkeleton` tracking the new columns (F6) |
| `board/src/components/markdown.tsx` | product | modify | Type scale (F3), interaction (F4) |
| `board/src/components/filter-bar.tsx` | product | modify | Type scale (F3), interaction (F4) |
| `board/src/views/board-view.tsx` | product | modify | Type scale (F3), column sizing and empty-state removal (F6) |
| `board/src/views/ticket-sheet.tsx` | product | modify | Elevation and `--surface-3` (F2), type scale (F3), interaction (F4), the panel (F7) |
| `board/src/views/list-view.tsx` | product | modify | Type scale (F3), interaction (F4), the table (F8). **Also the id and rank treatment F5 describes for the card only** — `Problem 5` names `list-view.tsx:78` and no F-block covered it; F8 closed it and the ledger rules on it |
| `board/index.html` | product | modify | The `theme-color` meta tags carry the two previous `--bg` values and static HTML cannot read a token (F11, from the review) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** L2 and L4 are written before F1 lands and each is verified failing against
the current tree. L1 and L3 pass today and must keep passing — they are the regression floor, and a
build that only watches them would see none of this plan's intent.

### L1 — Typecheck and unit (regression floor)

Command: `npm --prefix board test` (`tsc -b --noEmit && vitest run`).

1. The existing suites in `board/test/` pass unchanged after every F-block. *Passes today; any break is
   a regression this plan caused, since no component contract changes.*

### L2 — Source guard for tokenisation (RED → GREEN)

New file `board/test/tokens.test.ts`, run by the same command.

1. No file under `board/src/**/*.tsx` contains a `text-[<n>px]` literal. *RED today: 21 occurrences
   across 8 files — app-shell 2, filter-bar 4, markdown 1, ticket-card 4, ui 1, board-view 1,
   list-view 4, ticket-sheet 4.*
2. No file under `board/src/**/*.tsx` contains an `ink/[0.0…]` arbitrary alpha. *RED today: 12
   occurrences across 7 files — app-shell 1, filter-bar 1, markdown 1, states 3, ui 2, list-view 2,
   ticket-sheet 2.*
3. Every token the components reference resolves to a declaration in `board/src/index.css` — both in
   `:root` and in the `prefers-color-scheme: dark` block, with neither scheme missing one the other
   has. *RED today: `--surface-3`, `--surface-hover`, `--surface-active`, `--surface-sunken`, `--rank`
   and the `--text-*` scale do not exist.*
4. `--warn` and `--s-doing` resolve to the same value in **both** schemes. *RED today: they are equal in
   dark and unequal in light.*
5. `--s-dropped` and `--faint` resolve to different values in **both** schemes. *RED today: identical in
   both.*

### L3 — End-to-end, 3 viewports × 2 schemes (regression floor)

Command: `npm --prefix board run test:e2e` (360, 768, 1080).

1. `noSidewaysScroll` holds on `/board` and `/list` at every viewport. *Passes today; F6 is the block
   most able to break it.*
2. The dark-scheme background assertion matches the value F1 set. *Passes today at the old value; F1
   moves both sides together.*
3. The ticket sheet contains exactly one button, named `Close`. *Passes today; F7 is the block most
   able to break it.*
4. No console error at any viewport in either scheme. *Passes today.*
5. The screenshots at `test-results/screens/` regenerate for all three viewports in both schemes, for
   the build's evidence file. *Captured, never diffed — see Does NOT Include.*

### L4 — Behavioural acceptance: the design intent, measured (RED → GREEN)

Added to `board/e2e/board.spec.ts`, measured through `getComputedStyle` in both
`emulateMedia({ colorScheme })` states.

1. The ticket id's computed colour reaches at least 4.5:1 against the surface behind it, in both
   schemes. *RED today: ~3.2:1 light on surface, ~2.8:1 light on page background.*
2. The rank numeral's computed colour reaches at least 3:1 against the card surface, in both schemes,
   **and remains the largest font-size on the card**. *RED today: ~2.1:1 in dark. The second half is
   what keeps F5 from "fixing" contrast by shrinking the element the stylesheet nominates as bold.*
3. `--bg`, `--surface` and `--surface-3` resolve to three distinct luminances in the dark scheme, in
   ascending order. *RED today: `--surface-3` does not exist and the sheet shares `--surface`.*
4. In the light scheme, `--bg`, `--surface-2`, `--line` and `--muted` all sit on the same side of the
   neutral axis — no warm ground under cool type. *RED today: the first three are warm, the fourth cool.*
5. On `/board?q=sweep`, which the search narrows to a single ticket, each empty column's rendered
   width is smaller than the populated column's, and `noSidewaysScroll` still holds. *RED today:
   equal shares at `lg`.* **The filter is how this is reachable:** `board/e2e/fixture.ts` deliberately
   fills every status (open ×4, doing, done, dropped), so the unfiltered board has no empty column to
   measure. `q=sweep` is already the suite's filter case (`board.spec.ts:68-77`) and narrows to one
   ticket — no fixture change, and the assertion exercises the collapse and the containment together.*
6. The Live heartbeat's computed colour differs from `--s-done`. *RED today: it reads `var(--s-done)`
   directly at `app-shell.tsx:76-77`.*

**RED expectations against the current tree:** L2 fails on all five assertions; L4 fails on all six.
L1 and L3 pass today and must still pass at every F-block boundary.
**GREEN = all four levels pass after F1–F9.**

---

## Execution Order

```
F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9
```

- **F1 first** because every other block reads tokens it declares, and because the e2e assertion it
  must move is the one thing that turns the whole suite red if left behind.
- **F2 after F1** because the sheet's new plane consumes `--surface-3`.
- **F3 and F4 before F5–F9** because the component blocks should edit files already converted to
  tokens; doing it the other way means touching the same lines twice and reviewing a mixed diff.
- **F5 after F1** because the rank consumes `--rank`.
- **F6, F7, F8 are independent of one another** and may be reordered among themselves if the build
  needs to; none produces anything another consumes.
- **F9 last** because the accent's new role should be placed once the ground it sits on is final.

**Working-state boundaries:** every F-block boundary. Each leaves the app building, `npm --prefix
board test` green, and the e2e suite green. A build that must stop can stop after any of them.

**Per-F-block validation beyond the layer default:**

- F1: L2 (assertions 3, 4, 5), L3 (assertion 2), L4 (assertions 3, 4)
- F2: L3 (assertion 4), L4 (assertion 3)
- F3: L2 (assertion 1)
- F4: L2 (assertion 2)
- F5: L4 (assertions 1, 2)
- F6: L3 (assertion 1), L4 (assertion 5)
- F7: L3 (assertion 3)
- F8: L1
- F9: L4 (assertion 6)

**Not the product-layer default.** `board/` is `[product]` but is absent from
`framwork/provider-map.json` and is not copied into `cli/src/`, so `node scripts/build.js`, the
provider-output check and the `cli/tests/` suite have nothing to say about any block here. The gates
that apply are `npm --prefix board test`, `npm --prefix board run build` and
`npm --prefix board run test:e2e` — the three the CI `board` job runs (`.github/workflows/ci.yml:110-120`).

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the Validated Decisions row it departs from and why.
- **The regenerated screenshots** for the blocks with a visible result (F1, F2, F5, F6, F7, F8, F9),
  both schemes, so the reviewer judges the design change rather than reading about it.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. **F5 meeting L4.2's contrast floor by shrinking the rank.** The assertion's second half exists for
   exactly this, and a reviewer should confirm the size assertion is present and not merely the colour one.
3. **F1 changing the dark `--bg` without moving `board/e2e/board.spec.ts:117` in the same commit.** A
   later commit that "fixes the test" has inverted which artefact is the source of truth.
4. **F6 sizing the columns without resolving `lg:overflow-visible` at `board-view.tsx:106`.** The
   ledger must name which containment route was taken. A green suite is not evidence here on its own:
   if F6 happened to keep total column width under 1080, the assertion passes at the tested viewport
   and the page still scrolls sideways on a narrower `lg` window or with a fifth status.
4. **A token added to `:root` and forgotten in the dark block, or the reverse.** L2.3 covers it; confirm
   the test enumerates rather than spot-checks.
5. **F4 flattening the `Chip` plain/outline distinction while routing both through one token.** That
   distinction is the theme/label distinction and Problem 2's fix depends on it surviving.
6. **A behaviour change smuggled in as a design change** — a changed route, filter, `aria-*`, or
   keyboard handler. The constraint is plan-wide and nothing in the Validation Matrix would catch it
   except the reviewer.

## References

- Prior art: `2026-09-21T145331-PLAN--backlog-board-002-board-app` — shipped the board, its design
  direction, the three-viewport Playwright suite and the CI `board` job this plan is bound by.
- Design direction under repair: `board/src/index.css:1-8`.
- Review that produced this plan: conversation of 2026-09-23, screenshots of `/board`, `/list` and the
  ticket sheet at 1512px in both schemes.

---

---

# Checkpoint 2 — the ticket sheet, and the filter bar

> **Added:** 2026-09-23, after the user reviewed the running board. Checkpoint 1 (F1–F13) is
> implemented, audited and committed; nothing below reopens it.

## Objective

`[from conversation, no design document]`

The ticket sheet reads as a detail panel rather than a document: what a ticket *is* — its theme,
labels, grounding, branch and dates — is visible the moment it opens, and its prose is set at a
length a person reads rather than scans past. The filter bar reads as controls rather than as the
same chips the cards carry.

**When this checkpoint is done:** opening a ticket shows its properties without scrolling; the title
and status stay in view while the body scrolls; no line of prose in the sheet runs past ~70
characters; `Done when` sits at section weight instead of competing with the title; and an active
filter is told from an inactive one by more than which word it holds.

## Problem

11. **The sheet's properties are at the bottom.** Theme, labels, grounded, work, created and updated
    live in a `Details` section after Notes, Paths and Comments (`ticket-sheet.tsx:160-183`). The
    header carries `status · id · Priority N of M` and nothing else (`:93-101`). To learn what theme a
    ticket belongs to a reader scrolls past every note on it. Linear, Jira and Height all keep
    properties adjacent to the title and never behind a scroll.

12. **Everything below the title weighs the same.** Title at `--text-display`, then summary, `Done
    when` and every note at `--text-body` with `leading-relaxed` (`:103-133`). Sections are separated
    by margin alone (`Section`, `:188-195`). There is no rhythm to scan by, so the panel can only be
    read start to finish.

13. **The prose measure is the full panel.** Nothing caps line length, so at
    `sm:w-[min(560px,92vw)]` minus `sm:px-8` the body runs past 70 characters per line at 15px with
    relaxed leading.

14. **`Done when` outweighs what it qualifies.** It is the only bordered, filled block in the panel
    (`:116-119`) and it sits directly under the summary, so the acceptance criterion reads louder than
    the ticket.

15. **The title scrolls away.** Only the close control is anchored (`:78-83`); status, id and title
    scroll with the body, so a reader deep in the notes has lost which ticket they are in.

16. **The filter bar's controls look like the cards' chips.** `filter-bar.tsx` renders label and
    status filters with the same pill shape the cards use for labels, so one shape means both "this
    ticket carries this label" and "the board is filtered to it", and an active filter is told from an
    inactive one by fill alone.

## Scope

### Includes

- **F14** [product] — `board/src/views/ticket-sheet.tsx`: the panel's chrome. Status, id, priority,
  the close control and the `Esc` hint move into a header that does not scroll with the body; the
  title joins it in a condensed form once the body is scrolled. The panel widens to carry long-form
  content. **Must not lose:** exactly one button in the dialog (Global Constraints), the
  `onOpenAutoFocus` handler, the `sm:hidden` drag handle, or `Dialog.Title` being the accessible name.

- **F15** [product] — `board/src/views/ticket-sheet.tsx`: properties move up. Theme, labels,
  grounded, work, created and updated render in a compact grid directly under the title, and the
  `Details` section at the bottom is removed rather than duplicated. **Must not lose:** every field
  the `Details` section showed, including its empty-state wording, and the `<time dateTime>` elements.

- **F16** [product] — `board/src/views/ticket-sheet.tsx`, `board/src/components/markdown.tsx`: the
  reading rhythm. Prose takes a measure cap; `Done when` drops to section weight, keeping its accent
  rule; note leading tightens from relaxed to normal; `Section` gains a hairline rule above its title
  so the panel has zones. **Must not lose:** the `Done when` accent rule, which is the accent's one
  role inside the sheet, and `Markdown`'s existing element styling.

- **F17** [product] — `board/src/components/filter-bar.tsx`: the filters read as controls. An active
  filter carries the accent; an inactive one is quiet and visibly not a tag. The search field stops
  being the heaviest element in the row. **Must not lose:** `role="search"`, the `role="group"`
  labels on the toggle groups, the `/` shortcut and its hint, or the mobile collapse.

- **F18** [product] — `board/src/components/ui.tsx`, `board/src/views/board-view.tsx`: a status is
  told by shape as well as hue. `StatusPill` and the board's column headers take a distinct glyph per
  state instead of one coloured dot, so the four read apart without relying on colour. **Must not
  lose:** the `[data-status]` → `--st`/`--st-soft` indirection, the status text itself, or the 4.5:1
  floor the pill assertion holds. A status the definitions file declares but this set does not know
  falls back to the current dot rather than rendering nothing.

- **F19** [product] — `board/src/views/ticket-sheet.tsx`: `J`/`K` and `←`/`→` move to the previous
  and next ticket in priority order without closing the sheet. The header already states
  `Priority N of M`; this makes it navigable. **Must not lose:** `Esc` closing the sheet, Back closing
  it, the filters surviving the move, or focus staying on the panel.

- **F20** [product] — `board/src/components/app-shell.tsx` (or a component of its own): `?` opens an
  overlay listing every shortcut the app has. **Must not lose:** `/` reaching the search box, and the
  overlay must not trap focus away from `Esc`.

- **F21** [product] — `board/src/components/ticket-card.tsx`, `board/src/views/ticket-sheet.tsx`:
  clicking the ticket id copies it, with a one-second acknowledgement. **Must not lose:** the id
  staying selectable by hand, and a click on the id inside a card must NOT also open the card.

### Does NOT Include

- **Grouping by theme, a density toggle, and a board selection cursor.** The first changes the board's
  grouping and its URL state, the second needs a persisted preference and a new control, and the third
  collides with the arrow-key handler the mobile status tablist already owns (`board-view.tsx:66-76`).
  All three are flow, not interaction, and stay under the constraint's original wording.
- Swimlanes, WIP limits and saved views — rejected outright, not deferred. They earn their place in
  Jira because that board is where work is *moved*; this one is read-only over a JSONL file.
- Any change to what the sheet renders. Fields move; none is added or dropped.

## Validation Matrix — Checkpoint 2

### L5 — Behavioural acceptance (RED → GREEN)

1. Opening a ticket shows its theme and labels **without scrolling** — both are inside the viewport
   at scroll position 0. *RED today: they render in `Details`, below every note.*
2. After scrolling the sheet body to its end, the status pill and the ticket id are **still in the
   viewport**. *RED today: only the close control is anchored.*
3. No text block in the sheet renders wider than 70 characters at its own font size. *RED today: the
   body takes the full panel width.*
4. The sheet renders **no** `Details` heading. *RED today: it is the last section.*
5. `Done when`'s text is the same computed size as a note's, and its heading is the same size as a
   section heading. *RED today it is, but nothing holds it there once the block is restyled.*
6. An active label filter's computed colour or border uses `--accent`; an inactive one does not.
   *RED today: both are `Chip`-shaped and differ only in fill.*
7. Each of the four statuses renders a **different glyph**, so the set is distinguishable with hue
   removed. *RED today: one dot, four colours.*
8. With the sheet open, `J` and `K` move to the next and previous ticket in priority order, the URL
   follows, and the active filters survive. *RED today: neither key does anything.*
9. `?` opens an overlay naming every shortcut, and `Esc` closes it. *RED today: nothing responds.*
10. Clicking a card's id copies it and does **not** open the card. *RED today: the id is inert and
    the click reaches the card link.*
11. The existing sheet assertions still hold: exactly one button, the `Esc` hint is not a button, and
    text inside the sheet clears 4.5:1 on `--surface-3`.

**GREEN = L1–L5 all pass after F14–F21.**

## Execution Order — Checkpoint 2

```
F14 → F15 → F16 → F17 → F18 → F19 → F20 → F21
```

- **F14 first** because F15's properties grid sits under the title, and the title's position is what
  F14 settles.
- **F16 after F15** so the rhythm is applied to the final set of blocks rather than to one that is
  about to gain a grid.
- **F17, F18, F20 and F21 are independent** of the sheet work and of each other.
- **F19 after F14**, because it navigates the header F14 anchors.

---

# Checkpoint 3 — recorded, not planned

Raised in the same conversation and held back deliberately. **Each changes how the board itself
behaves, not how it reads**, which is the line Checkpoint 2's amended constraint draws:

1. **Group by theme**, as the board groups by status. The field exists on every ticket; the cost is a
   second grouping axis in the URL and in the column model.
2. **A compact card density**, for scanning a long backlog. Needs a control and a persisted
   preference, which is the app's first piece of user state.
3. **A selection cursor on the board** — arrows to move, Enter to open. It collides with the arrow-key
   handler the mobile status tablist already owns, so it needs that handler rethought first.

Explicitly rejected, not deferred: swimlanes, WIP limits and saved views.

## Next Steps

/add-framework--build board-design-palette-and-hierarchy

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-23 | Initial creation |
| 2026-09-23 | Review `fix-then-ok` applied. A1: `lg:overflow-visible` at `board-view.tsx:106` disables the scroll container at the breakpoint F6 changes — containment is now a named requirement in F6, a High risk, and a Reviewer Handoff gap. A2: `ticket-sheet.tsx:47` added to F2's citation. A3: Problem 10 and F8 corrected — the `Updated` `title` exists and is unformatted, not missing. A4: counts corrected to 21 `text-[Npx]` across 8 files and 12 `ink/[0.0…]` across 7, in Problem 8, F3, F4 and L2. N1: F9's `Consumes` now names tokens |
| 2026-09-23 | Two defects found while the review ran. L4.5 was unrunnable — `board/e2e/fixture.ts` fills every status, so the unfiltered board has no empty column; it now measures on `/board?q=sweep`. Problem 9 and F6 now name the inline `gridTemplateColumns` at `board-view.tsx:108` as the actual driver of equal shares, not the `lg:w-auto` class alone |
| 2026-09-23 | Implemented. F1 bb04c24, F2 a097e9d, F3 b437c7c, F4 5f0b2de, F5 d669baa, F6 d33227f, F7 2c6dc06, F8 1525ae1, F9 74927bc. Review pass applied three findings as F10 f30e275, F11 1833e08 and F12 d4462d6. Impact gains `board/index.html`; the `ink/[0.0XX]` breakdown corrected to list-view 2 (the total of 12 was right, the per-file split counted lines not occurrences) |
| 2026-09-23 | Checkpoint 2 added on the same branch at the user's request: the ticket sheet (F14–F16), the filter bar (F17), status-by-shape (F18) and four additive interactions (F19–F21). The Global Constraint on behaviour is amended in place, explicitly, to allow additive interaction only. Checkpoint 3 keeps grouping, density and a board selection cursor |
