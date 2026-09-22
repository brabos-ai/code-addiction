# Plan: Board app — a read-only, route-based activity board over `docs/backlog.jsonl`

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-09-21
> **Delivery:** automatic

---

## Objective

Today the product backlog is structured (`docs/backlog.jsonl` + `backlog.sh`) and the internal one is a
markdown file edited by hand, and neither can be seen visually. When this is done, the framework's own
repository uses the same format and the same scripts as the product for its backlog, the internal pipeline
moves tickets through their lifecycle the way the product pipeline does, and a React board opens any
`docs/backlog.jsonl` for visual, read-only analysis — built and available by default in the workbench
(`npm run setup`), and an opt-in feature a user enables to get it under `.codeadd/` in their project — shaped from day one to grow into an activity-management app.

**When this build is done:** `npm run setup` compiles `board/`, and `npm run board` opens a live, read-only
kanban, priority list and ticket detail over this repository's `docs/backlog.jsonl` in the browser — verified
in Playwright at 360, 768 and 1080 px, with the future orchestrator and refinement regions reserved and not
rendered. Shipping it to users is subtopic 004.

## Context

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-21T112103-backlog-board-002-board-app.md` | Stack, on-disk layout, routes and search params, the server and its `/api` contract, workbench integration, tests, and the **UX Brief** |
| `docs/brainstorming/2026-09-21T112103-backlog-board-002-board-app-intent.md` | `delivery: automatic`; the design skills and Playwright verification; responsive 360→1080; stacking on the 001 branch |
| `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md` | The set's shared decisions |

## Global Constraints

- The UI is built with `frontend-design`, `high-end-visual-design`, `web-design-guidelines` and `add-ux-design` loaded, and "verified in a real browser with Playwright before the F-block closes" (intent, `## Decided`)
- "verified at 360, 768 and 1080 px wide, no horizontal page scroll at any of them" (intent, `## Decided`)
- The server "Binds **`127.0.0.1` only**" and has "**no dependency**" (design, Server)
- "**the server never parses `docs/backlog.jsonl` itself**" — tickets come from `backlog.sh list --all` (design, Server)
- Future actions are "rendered NOT AT ALL" — no placeholder buttons (design, UX Brief)
- "TypeScript (strict)" (design, Placement and stack)
- `node scripts/build.js` and `node scripts/build-workbench.js` exit 0 with no new warning (`AGENTS.md`, Pipeline)
- Tests run through npm scripts; nothing writes into the checkout outside `board/dist/` and `board/node_modules/` (memory: tests do not write in the checkout)

## Problem

1. **No visual view** of either backlog.
2. **`file://` blocks `fetch`**, so a static page cannot show the live board.
3. **Future write and agent actions** need an app shaped for them now: routes, loaders, an API namespace.

## Proposal

Build `board/` in six stages — scaffold, server, data and routes, UX and UI, workbench and CI wiring, and
the setup-rule change in `AGENTS.md`. Every UI F-block is proven in
Playwright at three widths before it commits.

**Layer of `board/`.** It sits at the repository root and is tagged `[product]`, for the reason `mcp/` is:
it ships to users (as a release asset, in 004), and shipping decides the layer. The build's path rule would
derive `[internal]` for a root path; this plan states the tag explicitly so no derivation runs.

## Scope

### Includes

#### Phase 1 — scaffold

- **F1** [product] — `board/package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`,
  `index.html`, `src/main.tsx`, `vitest` + Testing Library setup, `@playwright/test` with a Chromium-only
  config, Tailwind CSS, shadcn/ui base (`components.json`, `src/lib/utils.ts`), TanStack Router file-based
  plugin, TanStack Query, zod, react-hook-form, react-markdown, lucide-react. Scripts: `dev`, `build`
  (`tsc -b && vite build`), `test` (`tsc --noEmit` + `vitest run`), `test:e2e` (Playwright). One smoke test.
  (Design §Placement and stack.)
  - **Produces:** `npm --prefix board run build` emitting `board/dist/index.html`

#### Phase 2 — server

- **F2** [product] — `board/server.mjs` + `board/test/server.test.ts`, tests RED first. Flags `--root`,
  `--scripts`, `--port` (4317, next free up to +10), `--no-open`; binds `127.0.0.1`. `GET /api/board` →
  `{ present, tickets[], statuses[], damagedLines[], undefinedStatuses[], readAt }` built from
  `bash <scripts>/backlog.sh list --all` and `docs/backlog.definitions.json` — **read directly with `fs`**, because `backlog.sh list` falls back to its default vocabulary without saying the file is absent; the one-reader rule covers the ticket JSONL, and the definitions file is plain JSON the user owns (columns derived from statuses in
  use when the file is absent; `present: false` when both are absent); errors as `{ error, detail }`
  (`bash-missing`, `script-missing`, `script-failed`); `GET /api/events` SSE `board-changed` on a debounced
  `fs.watch` of `docs/`; any other `/api/*` → 404 JSON; static `dist/` with SPA fallback. Tests run against a
  temporary project and the real `framwork/.codeadd/scripts/backlog.sh`. (Design §Server.)
  - **Produces:** the `/api/board` JSON shape and the `board-changed` SSE event
  - **Consumes:** `npm --prefix board run build` emitting `board/dist/index.html` (F1)

#### Phase 3 — data and routes

- **F3** [product] — `board/src/api/*` (types, fetcher, `boardQueryOptions`), `board/src/routes/*`: `/` redirect,
  `/board`, `/board/$ticketId`, `/list`, `/list/$ticketId`, each loader calling `ensureQueryData`; one zod search
  schema (`q`, `theme`, `label[]`, `status[]`) shared by the route `validateSearch` and the filter form; invalid
  params dropped; an `EventSource` hook invalidating the board query on `board-changed` and a refetch on focus.
  Pure filter and grouping functions (`filterTickets`, `groupByStatus`) unit-tested. (Design §Routes.)
  - **Consumes:** the `/api/board` JSON shape and the `board-changed` SSE event (F2)
  - **Produces:** the route tree and the `filterTickets` / `groupByStatus` functions

#### Phase 4 — UX and UI

- **F4** [product] — the UX design pass, then the screens. Load the four design skills first; decide the visual
  direction (type, colour tokens light and dark, spacing, radius, density) against the UX Brief and record it as
  a ruling. Build: the app shell (navigation for activity management, with the Runs slot and the right-hand
  activity-panel slot reserved in the layout and rendered not at all); the kanban (columns by `order`, count per
  column, cards in line order); the list (rank, status, theme, labels); the detail sheet (every field in the
  brief, notes and comments as markdown; header action region empty); the filter bar (react-hook-form over the
  shared schema, writing to the URL); the health banner; the empty state; keyboard (`/` search, `Esc` close);
  narrow screens with a status switcher in place of the column scroll.
  **Playwright proof, before commit:** `board/e2e/board.spec.ts` against `server.mjs` on a fixture project, at
  360×800, 768×1024 and 1080×900: every route renders, `document.scrollingElement.scrollWidth <=
  clientWidth`, opening a card changes the URL and `Esc`/Back closes it, a filter lands in the URL and survives a
  reload, no action button exists in the detail header, console has no error. Screenshots of each route at each
  width are taken to `board/test-results/` and read before the block closes; every defect found is fixed in this
  block. (Design §UX Brief.)
  - **Consumes:** the route tree and the `filterTickets` / `groupByStatus` functions (F3)

#### Phase 5 — workbench and CI

- **F5** [internal] — root `package.json`: `setup` → `node scripts/build-workbench.js && npm run build:board`;
  `build:board` → `npm --prefix board ci && npm --prefix board run build`; `board` → `node board/server.mjs
  --scripts framwork/.codeadd/scripts`; `test:board` → `npm --prefix board test`. `.gitignore`: `board/dist/`,
  `board/test-results/`, `board/playwright-report/` — `board/node_modules/` is already ignored by the root
  `node_modules/` pattern (`.gitignore:41`, confirmed with `git check-ignore`). `scripts/run-tests.js`: `./board/node_modules` and
  `./board/dist` join `TREE_EXCLUDES`, and `board/node_modules` joins `NATIVE_COPY_EXCLUDES`.
  `.github/workflows/ci.yml`: a `board` job, `working-directory: board`, Node 22, `npm ci`, `npm test`,
  `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. (Design §Workbench
  integration, §Tests.)

#### Phase 6 — the map

- **F6** [internal] — `AGENTS.md`: the "setup is the install" section says setup now also builds `board/`, why,
  and that `npm run build:board` retries it; the "mcp/ is the only root product directory" note names `board/` as
  the second, states that **only `board/server.mjs` is zero-dependency — the `src/` toolchain is not**, and that it
  ships as a release asset (004), not inside the npm package. The Key files table gains a `board/` row.

### Does NOT Include (important!)

- Any write from the board — drag and drop, edit, status change, comment
- The orchestrator and refinement UI, routes (`/board/$ticketId/refine`, `/runs`) and APIs — reserved only
- Shipping to users (004), the internal lifecycle (003)
- Changes to `backlog.sh` or its output
- A root `npm test` change — the board suite runs through `test:board` and its own CI job

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Stack | TS strict, React, Vite, TanStack Router + Query, shadcn/ui + Tailwind, react-hook-form + zod | Design §Key Decisions rows 1–3 |
| Where the ticket data comes from | `backlog.sh list --all`, never a JSONL parse | Design §Key Decisions row 4 |
| Network exposure | `127.0.0.1` only | Design §Key Decisions row 5 |
| Live updates | SSE on file change + refetch on focus | Design §Key Decisions row 6 |
| Setup builds the board | Yes; workbench first so a board failure leaves the pipeline usable | Design §Key Decisions row 8 |
| Layer tag of `board/` | `[product]` | Ships in 004; same reasoning as `mcp/` |
| Proof of UX | Playwright at 360/768/1080 + screenshots read before commit | Intent `## Decided` |
| Branch | Stacked on `feat/backlog-board-001-internal-migration` | Intent `## Decided` |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Horizontal scroll or clipped content on a phone | Med | F4's Playwright `scrollWidth` assertion at 360 px |
| A future-action placeholder slips into the UI | Low | F4's assertion that the detail header holds no action button |
| `fs.watch` misses a change on some filesystems | Med | F3 refetch on window focus; F2 debounced watcher |
| npm or Playwright download fails offline during setup | Med | F5 builds the workbench first; `build:board` retries |
| Server parses the JSONL itself and drifts from the script | Low | F2 test runs against the real `backlog.sh` and a damaged line |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `board/` (package, config, `src/`, `test/`, `e2e/`) | product | create | F1–F4 |
| `board/server.mjs` | product | create | F2 |
| `package.json` | internal | modify | F5 |
| `.gitignore` | internal | modify | F5 |
| `scripts/run-tests.js` | internal | modify | F5 |
| `.github/workflows/ci.yml` | internal | modify | F5 |
| `AGENTS.md` | internal | modify | F6 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### L1 — Server (vitest, RED → GREEN)

1. `/api/board` on a fixture with 3 tickets returns them in line order with `present: true`. *RED: no server.*
2. A damaged line appears in `damagedLines`; the other tickets still return.
3. No definitions file + tickets → statuses derived in first-seen order; both absent → `present: false`.
4. `--scripts` pointing nowhere → `{ error: "script-missing" }`, HTTP 200 JSON, no crash.
5. `/api/runs` → 404 JSON; `/board/0001B` → `index.html`.
6. The listening address is `127.0.0.1`; a busy port moves to the next.
7. Writing `docs/backlog.jsonl` emits one `board-changed` on `/api/events`.

### L2 — Data and routes (vitest)

1. `filterTickets` by `q`, `theme`, `label`, `status`, combined; `groupByStatus` keeps line order inside a column.
2. The search schema drops an invalid param and keeps valid ones.
3. Rendering `/board` with a mocked `/api/board` shows one column per status in `order`.

### L3 — Behaviour in a browser (Playwright, 360×800, 768×1024, 1080×900)

1. `/board`, `/list`, `/board/<id>` render with no console error.
2. `scrollWidth <= clientWidth` on every route at every width.
3. Opening a card changes the URL; `Esc` and Back close it.
4. A filter reaches the URL and survives a reload.
5. The detail header holds no button besides close; no "Runs" item renders.
6. At 360 px the kanban shows one column and a status switcher.
7. Screenshots of each route at each width exist and were read; defects found are fixed in F4.

### L4 — Integration

1. `npm run setup` on a clean clone builds the workbench and the board.
2. `npm run board` serves this repository's four tickets.
3. `node scripts/build.js` and `node scripts/build-workbench.js` exit 0 with no new warning; `git status --porcelain framwork/` empty.

**RED expectations against the current tree:** L1–L4 all fail — nothing exists.
**GREEN = all levels pass after F1–F6.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [product] → F5 [internal] → F6 [internal]

- **F2 before F3** — loaders consume the API shape.
- **F3 before F4** — screens live inside routes.
- **F5 after F4** — setup compiles something that exists.
- Every boundary leaves the tree working; after F4 the board runs with `npm --prefix board run build && node board/server.mjs --scripts framwork/.codeadd/scripts`.
- F4 does not commit until L3 passes and its screenshots were read.

## Reviewer Handoff

For each F-block the build leaves, in the ledger: files touched, the validation levels covering it and
their state, and any departure from the design with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A rendered placeholder for a future action — a disabled button, a "coming soon", an empty Runs link.
3. A route that reads state from anywhere but its URL and its loader.
4. A width where the page scrolls sideways.

## References

- Design set: `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md`, `-002-board-app.md`
- Prior art: `mcp/` (root product source, zero-dependency `.mjs`); `2026-09-21T134430-PLAN--backlog-board-001-internal-backlog-migration` (the data it reads)

---

## Next Steps

/add-framework--build backlog-board-002-board-app

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-21 | Initial creation |
| 2026-09-21 | Review fix-then-ok: F2 reads the definitions file directly and says why; six stages; `board/node_modules/` noted as already ignored by the root `node_modules/` pattern (B1 rejected: the design listed it, the existing pattern already covers it) |
| 2026-09-21 | Implemented in 99ceef1 (F1), cb1dce9 + 84309f5 (F2), a58b589 (F3), b796eee (F4), 61ecb68 + 40978f0 (F5), c6a560d + 479209d (F6) |
