# Board design — the palette, elevation and hierarchy the stylesheet already declared

> **Date:** 2026-09-23
> **Plan:** `docs/plans/2026-09-23T122713-PLAN--board-design-palette-and-hierarchy.md`
> **Layer:** product

`board/src/index.css` has carried a design direction in its header since the app shipped: "cool
neutrals, one cobalt accent", and the priority rank as "the one bold element". The implementation had
drifted from it. The light palette was warm under cool type, the dark theme had no depth to speak of,
several design values lived as px and alpha literals in components, and the rank — the element the
stylesheet nominates as bold — was the least visible thing on a card.

This delivery brings the code back to that direction and puts a measurement behind each claim. Nothing
about behaviour changes: no route, filter, data path, ARIA role or keyboard handler was touched.

## Changed

- **The colour system** (`board/src/index.css`) — the light neutrals move to the cool ramp the header
  declares. `--s-dropped` gains a value of its own: it was byte-identical to `--faint` in both schemes,
  so "dropped" had the colour of de-emphasised text, and beside `--s-open` the two most opposed states
  differed only in lightness. They now separate by hue — steel for open, violet for dropped. `--warn`
  becomes an explicit alias of `--s-doing` in both schemes, where the pair was equal in dark and unequal
  in light. The dark `--danger` leaves Material Red 200 for a chroma that sits with its neighbours.

- **Dark elevation** (`board/src/index.css`, `ticket-sheet.tsx`, `ticket-card.tsx`) — every dark shadow
  was black over a near-black ground, which darkens nothing, so card and sheet sat at the page's
  apparent height. Elevation now comes from light: a top inset highlight marks each plane's lit edge.
  `--bg` drops to `#0c0e12` and a new `--surface-3` gives the sheet a plane of its own, so page, card
  and sheet read as three. The backdrop gains a blur and rises, because dimming a near-black page by
  half is not a dim.

- **A named type scale and named interaction surfaces** — 21 `text-[Npx]` literals across 8 files
  spanning six sizes become five steps named by their job; 12 arbitrary `ink/[0.0XX]` alphas across 7
  files in five values become `--surface-hover`, `--surface-active` and `--surface-sunken`. Renaming
  alone would have changed nothing visible: a 5% light film over a dark card lifts it by 0.008 in
  luminance, under what the eye separates, which is why the filled theme chip and the outlined label
  chip looked alike in dark although the markup always distinguished them.

- **The card and the list row** (`ticket-card.tsx`, `list-view.tsx`) — the ticket id, which is what a
  person copies into a command, moves from `--faint` to `--muted` with tabular figures. The rank keeps
  its size and weight and leaves `ink/25`, which measured 2.10:1 in dark. Hover moves off the rank and
  onto the title. A long theme is capped instead of pushing every label onto a second line, and the
  list's Theme column widens past the point where truncation destroyed the word.

- **The board's columns** (`board-view.tsx`, `states.tsx`) — the row was a grid of equal shares at
  `lg`, so four columns split the viewport however little they held, each empty one filled by a dashed
  box repeating the zero its header already showed. Columns now share the row within a range and an
  empty one collapses to its header. `lg:overflow-visible` went with the grid: the overflow has to stay
  on the row, because the suite measures `document.scrollingElement` and the 1080 project sits inside
  `lg`.

- **The sheet** (`ticket-sheet.tsx`) — an `Esc` hint beside the close control, as a span rather than a
  second button; one 16px radius on the exposed edge; and `Done when` traded its filled accent box,
  which read as a documentation callout, for a rule on the accent.

- **Colour with one meaning each** (`app-shell.tsx`) — the Live heartbeat read `var(--s-done)`
  directly, so green meant "this ticket is finished" and "the server is connected" in one viewport. It
  goes neutral. `--accent` rendered on neither main view; the active view switch takes it, which is
  navigational — the stylesheet reserves status hues for named statuses.

- **`board/index.html`** — the `theme-color` meta tags carried the two previous `--bg` values. Static
  HTML cannot read a token, so the system and PWA chrome kept painting the old background.

## Added

- **`board/test/tokens.test.ts`** — the guard that keeps the system a system. It fails on any
  `text-[Npx]` or `ink/[0.0XX]` left in `src/`, on a token declared in one scheme and not the other, on
  `--warn` and `--s-doing` disagreeing, on `--s-dropped` equalling `--faint`, and on `theme-color`
  drifting from `--bg`.

- **Eleven behavioural assertions in `board/e2e/board.spec.ts`**, at 360, 768 and 1080 in both schemes:
  the three dark planes in ascending luminance, no warm neutral in light, the id and rank contrast
  floors on `/board` and `/list`, every status pill against its own chip, text inside the sheet on
  `--surface-3`, the theme chip readably filled against the outlined label chip, an empty column
  narrower than a populated one, a full board fitting 1080, the `Esc` hint not being a button, and the
  heartbeat no longer sharing a colour with `done`.

  These measure rather than describe. Compositing happens in the browser on a 1×1 canvas, because
  Chromium reports a Tailwind alpha utility as `oklab(L a b / α)` and reading that as rgb gives a
  number that looks plausible and is wrong. The rank assertion pairs its contrast floor with "still the
  largest type here", so the floor cannot be met by shrinking the element the stylesheet calls bold.

## Notes

Three observations from the design review were **reversed** during planning, against the stylesheet's
own header, and are recorded in the plan's Validated Decisions: the rank is not redundant with row
order but the app's declared differentiator, so it keeps its size and gains contrast; the theme and
label chips were already distinguished in markup and needed a token fix, not a component one; and the
sheet already had a backdrop that failed only in dark, for the same reason the shadows did.

A fourth reversal happened during the build and is in the ledger: fixed column widths put the fourth
status off-screen at 1080, which is worse than the equal shares they replaced, so columns share the
row within a range instead.

---

## Checkpoint 2 — the ticket sheet, and what it taught the rest

Added on the same branch after the user reviewed the running board. Checkpoint 1 was already audited
and committed; nothing below reopens it.

### The sheet stopped being a document and a slab

It carried its properties — theme, labels, grounded, work, dates — in a `Details` section **after**
every note, so learning what area a ticket belonged to meant scrolling past everything written about
it. They move next to the title. The header with status, id and `Priority N of M` stops scrolling
away, so a reader deep in the notes still knows where they are. Prose takes a 56-character measure,
leading drops from relaxed to normal, sections gain a hairline, and `Done when` falls to section
weight — it is an acceptance criterion and it was reading louder than the ticket.

Then the panel itself. It accumulated four elevation signals at once — the app's lightest surface, a
drop shadow, an inset highlight and a corner radius, over a blurred backdrop — and read as a slab
dropped on the board rather than the child route it is. Above `sm` it is now flush, square,
unshadowed, and separated by a single rule; on a phone it stays a bottom sheet. `--surface-3` is
retired with the slab that needed it, and the board is two planes again.

### A status is a shape now

Four states were one 6px dot in four colours, which is four states a colour-blind reader cannot tell
apart at all. Each takes a shape that carries the progression — an open ring, that ring half filled,
solid with a check cut out, and struck through — in all four places a status appears. Hue became
reinforcement instead of the whole signal.

### Four keys, and an id that copies itself

`J`/`K` and the arrows step through tickets without closing the sheet, with the filters riding along.
`?` lists every shortcut, which nothing did before — `/` and `Esc` shipped unnamed. Clicking the id
copies it. All additive: no gesture that existed changed, which is the line the plan's amended
constraint draws.

The id copy lives in the sheet and not on the card, because a card is one big `<a>` and a button
inside an anchor is invalid interaction semantics. It is the sheet's second button, which `L3.5`
forbade — that guard became a tripwire on the exact set rather than a cap, so a third button still
trips it and still has to be argued for.

### What the review caught

Its own findings, all applied: the shortcut keys measured 4.38:1 in dark against a 4.5:1 floor; the
copy acknowledgement outlived its ticket, because `J` re-renders the panel rather than unmounting it,
so the tick could sit lit on a ticket nobody copied; and nothing covered `?` with a ticket already
open. It works — now it is asserted, along with `Esc` unstacking one layer at a time.

### Notes

Two of checkpoint 1's own decisions were reversed here, both after seeing the board rendered rather
than reasoning about it: fixed column widths put the fourth status off-screen at 1080, so columns
share the row within a range; and the sheet's third plane was the thing that made it feel heavy. The
plan's ledger carries both with their cost.

**Checkpoint 3 keeps** grouping by theme, a compact density and a board selection cursor — each
changes how the board behaves rather than how it reads, and the third collides with the arrow-key
handler the mobile status tablist already owns.
