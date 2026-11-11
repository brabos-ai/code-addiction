# Board — compact cards, one status line per lane, and lanes that say what they mean

> **Date:** 2026-09-24
> **Plan:** none — direct change after the user asked for general improvements
> **Layer:** product

Follows `2026-09-24T011500-update-board-phase-hues-fit-screen-and-radius.md`.

## Added

- **Compact cards** (`lib/density.ts`, `app-shell.tsx`, `ticket-card.tsx`) — a toggle in the header,
  on the board only and not on a phone. A compact card keeps its status line, a one-line title and
  its labels. It drops the summary, the theme, the feature and the work link. A comfortable card was
  about 220px tall, so Backlog showed 3 of its 8 cards. A compact one is about 100px. The choice is
  kept in `localStorage` under `board-density` and set on `<html data-density>`, which the new
  `compact:` variant in `index.css` reads. The inline script in `index.html` sets it before the
  first paint, like the theme.

- **An empty lane says what it means** (`board-view.tsx`) — the definitions carry a `means` line
  per status (`add.build running`, `about.md exists, waiting to plan`). It lived only in a tooltip on
  the lane header. An empty lane now shows it, under each status's label when the lane has more than
  one.

## Changed

- **Status on the card only where the lane holds more than one** (`board-view.tsx`) — Backlog holds
  only `open`, Building only `doing`, Done only `done`. Every card there repeated what its lane
  already says. Shaping and Planning hold two statuses each, and their cards still name theirs.

- **Lane widths** — 18.5rem with cards and 10rem empty, 0.75rem apart, down from 20rem, 11rem and
  1rem. Six lanes with three populated fit a 1536px screen, which is 1920px at 125% zoom. Ticket
  0008B (six lanes on a 1080px screen) stays open: a board with five populated lanes still scrolls
  there.

## Tests

- `theme.test.ts` runs the inline script for the density too, against `DENSITY_KEY`.
- e2e: a card names its status only in a lane with more than one; an empty lane shows its
  statuses' meaning; compact cards drop the summary, keep the labels, come in well under the
  comfortable height, and survive a reload. The phase-hue test reads its card status from Shaping,
  which now holds the only cards that show one.
