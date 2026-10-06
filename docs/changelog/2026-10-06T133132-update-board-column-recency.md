# Board column recency

> **Date:** 2026-10-06
> **Plan:** 2026-10-06T114929-PLAN--board-column-recency
> **Layers:** product

## Delivered

- Backlog cards stay in canonical line order, including after a filter and when the column label is not "Backlog".
- Every other kanban column shows the newest `updated_at` first. Cards that share a column across statuses are one sequence, not per-status blocks.
- Equal instants, including the same instant written with different offsets, keep incoming priority order. Empty or unparseable timestamps sort after every valid instant and keep their mutual order.
- Priority numbers, `/list`, and sheet navigation still follow the unfiltered API ticket array. Desktop and mobile both render the shared column arrays.

## Validation

- L1.2 and L1.4 failed on line order before the sort. L2.1 failed the same way on the shaping column. Preservation checks for Backlog and `/list` were not those failures.
- `npm test` in `board/`: typecheck and 123 tests passed. `npm run build` passed.
- A temporary fixture, not committed and not the live backlog, showed the same Backlog priority and newest-first shaping at 1280px and at 390px. Tied cards stayed in line order.
- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exited 0 with no new warning. The three board files are not artefact nodes.

## Decisions recorded

- The exception is `column.name === 'backlog'`, not the label, the status `open`, or column position.
- Instants are `Date.parse`. A non-ISO value that `Date.parse` rejects sorts as invalid.

Implementation commits: `40c3aac` (F1), `7cbf1d8` (F2).
