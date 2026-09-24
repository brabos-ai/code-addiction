# Board layer filter — server opt-in

> **Date:** 2026-09-24
> **Plan:** 2026-09-24T101029-PLAN--board-layer-filter-flag
> **Layers:** product, internal

## Delivered

- `board/server.mjs` accepts `--layers`. Only that mode adds `layerFilter: { name: "Layer", values: ["product", "internal", "both"] }` to `/api/board`. Tickets and their labels remain intact in both modes.
- `/board` and `/list` show the Layer control when the API advertises it. Multiple selections match exact labels with OR and combine with text and status filters using AND. `both` is independent of `product` and `internal`.
- The URL retains enabled selections across reloads and view changes. Disabled and unknown selections are removed with replacement navigation, preserving the other filters and an open ticket route. Empty selections omit `label`.
- Cards and mobile list rows show only declared layer chips while enabled. Default installations show no label chips in these summaries. Ticket details retain all labels, including free labels such as `quality`.
- The repository's root `board` script passes `--layers`; `AGENTS.md` documents that local opt-in. Distribution and backlog contracts are unchanged.

## Validation

- Server and search assertions were observed failing before implementation. Route tests failed on the old controls, chips and URL behavior. Browser RED used the bundle built before the UI changes, with six expected failures and two passing inverse scenarios.
- `npm run test:board`: TypeScript and 97 tests passed before the final audit. The audit added a second port-fallback case; the affected server suite then passed all 24 tests.
- `npm run build:board` passed, including dependency installation and the production build.
- Browser suite: 142 passed, 20 viewport-specific skips and nine failures in the full run. Two new mobile cases were corrected to wait for the toolbar before opening filters; seven existing cases had loading or Escape timeouts. All nine passed in a targeted rerun with three workers, giving 151 distinct passing scenarios. No assertions were weakened.
- Inspected tablet board and mobile list captures. Layer selection, chips and the mobile refinement count rendered as expected, without page overflow.
- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` passed for every block with no new or baseline warnings. Internal changes left `framwork/` clean. The root script's real server response confirmed the opt-in capability.
- Three final review scopes completed. One low-severity coverage finding was applied: busy-port fallback now runs with and without `--layers`. No outstanding findings.
- Artefact graph coverage is NOT VERIFIED: the modified board files, root package and `AGENTS.md` are not graph nodes. The generated inventory was already current.

## Decisions recorded

- Mixed selections keep supported values; an empty result removes the URL parameter.
- The mobile counter counts selected values. Chips preserve the ticket's original label order.
- The second browser-test server enables the flag; the default test server remains disabled.

Implementation commits: `6641752`, `38aaf8c`, `28addd2`, `f0f7ca5`, `831ddff`. Audit coverage: `cf7fcbe`.
