# Board — the filter row keeps the search and Show dropped, nothing else

> **Date:** 2026-09-24
> **Plan:** none — direct change after the user reviewed the running board
> **Layer:** product

Follows `2026-09-24T020000-update-board-compact-cards-and-lane-meaning.md`.

## Removed

- **The theme dropdown** (`filter-bar.tsx`) — it listed every theme in use, and it repeated what
  the text search already finds.

- **The labels toggles** (`filter-bar.tsx`) — the row showed one toggle per label in use. Labels
  hold whatever a project puts in them. This repository uses them for its own layer tags
  (`product`, `internal`, `both`), so the row was named "Labels" while it filtered by layer, and on
  a board installed in any other project it would show that project's tags with no meaning attached.

- **`theme` and `label` in the view state** (`lib/search.ts`, `lib/tickets.ts`) — both params leave
  the search schema and `filterTickets`. An old URL that still carries them loads unfiltered. It is
  not filtered by a control the page no longer shows. `facets()`, which built the two option lists,
  is removed with them.

## Kept

- The text search, on both views.
- `Show dropped` on the board.
- The status toggles on the list. The board shows status as its lanes, so it never had them.
- Labels and theme still show on the card and in the ticket sheet. Only the filter changed.

## Tests

- Unit: the theme and label filter cases go, a search-plus-status case covers the AND, and a case
  checks that `theme` and `label` from an old URL are dropped.
- e2e: the board's filter row has the search and `Show dropped`, no combobox and no Labels group,
  and a URL with `label=` and `theme=` loads unfiltered. The height check (`L5.6`) and the 13px
  check now measure a status toggle and `Show dropped` instead of the label toggle.
