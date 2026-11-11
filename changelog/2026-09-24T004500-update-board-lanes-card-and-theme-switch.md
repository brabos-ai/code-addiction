# Board — lanes, a full-width card, a graphite dark and a theme switch

> **Date:** 2026-09-24
> **Plan:** none — direct change after a design review of the running board
> **Layer:** product

The user reviewed the board at 1536px and raised four things. The card wasted its left edge on the
rank. The page had no room at its edges. The dark theme was harsh. And there was no way to get the
light theme on a dark desktop. A fifth thing showed up during the review: a type-size bug that made
the filter toggles bigger than the search box beside them.

This delivery reverses two decisions that `2026-09-23T134131-update-board-design-palette-and-hierarchy.md`
recorded: the rank is no longer "the card's one bold element", and columns no longer share the row
evenly. The header of `board/src/index.css` carries the new direction.

## Changed

- **The card** (`ticket-card.tsx`) — the rank sat in a fixed 36px column down the card's left. On a
  245px card that was 15% of the width, taken from the title. Status, id and priority now share one
  small line above the title. The rank is a `#N` badge on that line, in ink on the sunken surface.
  Title, summary and meta use the full width. The status is its glyph and name in its own hue. The
  theme is text behind a folder mark instead of a filled chip, so it no longer reads as a second tag
  beside the label chip. The list keeps its large rank: there it is the Priority column of a table.

- **Lanes** (`board-view.tsx`, `index.css`) — each column is a tinted lane (`--lane`) that its cards
  sit in. A lane with cards is 20rem; an empty one is 11rem. Equal shares gave the six columns 245px
  each at 1080-1536px, so the one column with cards was the narrowest thing on the board. The tint is
  what keeps an empty lane reading as a column.

- **Room at the edges** (`app-shell.tsx`) — the gutter grows to 40px from `lg`, the filters get 24px
  above the board, and the shell's max width goes from 1600px to 1680px.

- **The dark scheme** (`index.css`, `index.html`) — graphite instead of near-black. The ground moves
  from `#0c0e12` to `#1b1c1f`. Page, lane and card are three close steps (`#1b1c1f`, `#222327`,
  `#2a2b30`), and the card's ring does the separating. The soft status chips now sit above the card
  rather than below it, and `--s-dropped` lightens to keep 4.5:1 on its chip.

## Added

- **A theme switch** (`app-shell.tsx`, `lib/theme.ts`) — System, Light, Dark, as a radio group in the
  header. The choice is kept in `localStorage` under `board-theme`. System follows the OS and keeps
  following it when the OS changes. The scheme now lives on `<html data-theme>`, not under
  `@media (prefers-color-scheme)`. An inline script in `index.html` sets it before the first paint,
  so a saved choice never flashes the other scheme. The Tailwind `dark:` variant now reads
  `data-theme`. Before this, it pointed at a `.dark` class that nothing set, so the two `dark:`
  backdrops in the sheet and in the shortcut list never applied.

- **`board/test/theme.test.ts`** — runs the inline script against every stored value and OS scheme,
  and checks it agrees with `resolveScheme`. It also holds the `cn` fix below.

- **e2e** — the switch overrides the OS, survives a reload, and hands back to the OS on System. The
  filter toggles and the view switch render at 13px.

## Fixed

- **Type size dropped by `cn`** (`lib/utils.ts`) — `tailwind-merge` did not know the named type
  steps, so it read `text-meta` as a colour and dropped it whenever `text-muted` or `text-accent`
  came after it. The filter toggles, `Show dropped` and the Board/List switch rendered at 16px
  instead of 13px. `cn` now registers `micro`, `meta`, `body`, `section` and `display` as font
  sizes.

## Tests reshaped

- `L4.1/L4.2` — on `/board` the rank takes the 4.5:1 text floor on its badge, and the title must
  start at the same left edge as the status line. On `/list` the "largest type" assertion stays.
- `L4.5` — "columns share the row evenly" becomes "a lane with cards is wider than an empty one;
  empty lanes share one width".
- The dark-chip test becomes "theme and label read as two treatments": the theme has no fill and no
  outline, and the label is outlined.
- `tokens.test.ts` reads the dark block from `:root[data-theme="dark"]` and fails if a scheme is
  declared under a media query again.

## Notes

At the default worker count on a Windows machine, the e2e suite had timeouts that changed from run
to run (4 in one run, other tests in the next). With `--workers=3` all 113 pass. CI runs on Linux
and is the verdict.
