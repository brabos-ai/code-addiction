# Board — a read-only, route-based view of the backlog

> **Date:** 2026-09-21
> **Plan:** `docs/plans/2026-09-21T145331-PLAN--backlog-board-002-board-app.md`
> **Layer:** both

Second subtopic of the backlog-board set (`docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md`).
`docs/backlog.jsonl` can now be seen: a kanban by status, a priority list and a ticket detail, live as the
file changes. `npm run setup` builds it and `npm run board` opens it on this repository's backlog. Shipping it
to users as an opt-in feature is subtopic 004.

## Added

- **`board/`** — the second root product directory. A TypeScript / React / Vite app with TanStack Router
  (typed routes, loaders, search params validated by one zod schema) and TanStack Query, shadcn/ui on
  Tailwind, react-hook-form for the filter form. Routes: `/board`, `/board/$ticketId`, `/list`,
  `/list/$ticketId`; filters live in the URL, and the ticket is a child-route sheet Back closes.
- **`board/server.mjs`** — zero dependencies, Node built-ins only, bound to `127.0.0.1` with a Host-header
  check. `GET /api/board` is built from `backlog.sh list --all` and `docs/backlog.definitions.json`;
  `GET /api/events` pushes `board-changed` when either file changes. Every other `/api` path is a 404 JSON —
  `/api/runs` and `/api/tickets/:id/refine` are reserved for the agent orchestrator and card refinement,
  which are designed into the layout and render nothing yet.
- **The design** — data-dense, "stone and cobalt", Geist bundled for offline use, light and dark from the
  system. The priority rank (line order on the board) is the one bold element on every card and row.
  Phones get a status switcher and a bottom sheet; tablets a snapping column scroller; from 1024 px a grid.
- **Tests** — vitest for the server (against the real `backlog.sh`), the data functions and the route tree;
  Playwright at 360, 768 and 1080 px over the built app, asserting no sideways scroll, URL-driven sheet,
  filters that survive a reload, no action button in the sheet header, and dark mode.
- **CI** — a `board` job: typecheck, unit tests, build, three-viewport e2e.

## Changed

- **`npm run setup`** — builds the workbench, then the board (`npm ci` + Vite build). The workbench half
  still takes no dependency and runs first, so an offline board failure leaves the pipeline installed;
  `npm run build:board` retries. New scripts: `build:board`, `board`, `test:board`.
- **`AGENTS.md`** — `board/` joins `mcp/` as a root product directory, with the asymmetry stated: only
  `server.mjs` is zero-dependency.
- **`scripts/run-tests.js`, `.gitignore`** — the board's build output stays out of the test-runner copies
  and out of git.

## Removed

- Nothing.
