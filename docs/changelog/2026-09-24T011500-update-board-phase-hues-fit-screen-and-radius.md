# Board — a hue per phase, a board that fits the screen, and tighter corners

> **Date:** 2026-09-24
> **Plan:** none — direct change after the user reviewed the running board
> **Layer:** product

Follows `2026-09-24T004500-update-board-lanes-card-and-theme-switch.md`. The user raised three
things. The board was monochrome. There was no visible way to reach the columns on the right. And
everything was too round.

## Changed

- **A hue per phase** (`board/src/index.css`, `board-view.tsx`) — the pipeline has nine statuses in
  six visible phases, but only four statuses had a hue. `refining`, `shaped`, `planning`, `planned`
  and `in-review` rendered as the grey fallback, so only Done carried colour. Each phase now has a
  hue: backlog steel, shaping violet (`--s-shaping`), planning blue (`--s-planning`), building amber,
  review teal (`--s-review`), done green. Each is declared in both schemes, with a soft chip that
  clears 4.5:1. A lane carries `data-phase`. Its hue shows as a small square before the lane's name,
  and through `data-status` as the status on each card. The lane and the card stay neutral: a trial
  of a coloured wash across the lane's top was rejected on review.

- **Status shapes for the new statuses** (`ui.tsx`) — a phase's running status (`refining`,
  `planning`, `in-review`) takes the half-filled circle `doing` uses. Its waiting status (`shaped`,
  `planned`) takes a new shape: the ring with a point at its centre. Hue says the phase; shape says
  running or waiting.

- **The board fits the screen** (`app-shell.tsx`, `board-view.tsx`) — the lane row scrolled
  sideways, but its scrollbar sat under the tallest lane. At 740px of screen it was 1437px down, so
  nobody saw it. From `sm` up, the shell is now exactly one screen tall (`AppShell fill`). The row
  takes the rest of the height, and each lane scrolls its own cards. The row's scrollbar is always
  at the bottom of the view. A fade on the right edge shows while more lanes lie that way. Snap on
  the row moves from mandatory to proximity, so a scroll stops where the reader stops it. Phones
  keep one lane at a time with the page scrolling.

- **The lane header** — the count moves to the right edge, on a small sunken tag.

- **Tighter corners** (`index.css` `@theme`, and every component) — the radius scale is now 3, 4, 6
  and 8px (`--radius-sm` to `--radius-2xl`). Buttons, the search, the theme select, the filter
  toggles, the view switch, the theme switch, chips and status pills were pills (`rounded-full`).
  They are now rounded rectangles. Lanes are 6px, cards 4px. True circles stay round: status
  glyphs, the live dot, the filter count badge and the sheet's drag handle.

## Added

- e2e: every lane's marker has a distinct colour, and a card's status matches its lane's marker.
- e2e: at 1080x500 the row ends inside the screen, the page does not scroll down, and a full lane
  scrolls its own cards.
- e2e: the status-pill contrast test covers every status on the page, not a fixed four.
