# Brainstorm: Board app — a read-only, route-based activity board over `docs/backlog.jsonl`

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-21
> **Type:** product
> **Umbrella:** `2026-09-21T112103-backlog-board-000-umbrella.md`

## Objective

Today the product backlog is structured (`docs/backlog.jsonl` + `backlog.sh`) and the internal one is a
markdown file edited by hand, and neither can be seen visually. When this is done, the framework's own
repository uses the same format and the same scripts as the product for its backlog, the internal pipeline
moves tickets through their lifecycle the way the product pipeline does, and a React board opens any
`docs/backlog.jsonl` for visual, read-only analysis — built and available by default in the workbench
(`npm run setup`), and an opt-in feature a user enables to get it under `.codeadd/` in their project — shaped from day one to grow into an activity-management app.

Serves the objective by building the board itself and making `npm run setup` compile it, so this repository
sees its own backlog visually; shipping it to users is 004.

## Discovery

- `mcp/` is the precedent for root-level product source that runs from a user's project: zero-dependency
  `.mjs`, because `node_modules` is not on the resolution path there.
- `backlog.sh list --all` prints `KEY=VALUE` lines then raw JSONL tickets (`BACKLOG_PRESENT`,
  `TICKETS_TOTAL`, `DAMAGED_LINE`, `UNDEFINED_STATUS`), exit 0 even on an absent board. Needs bash and node ≥ 18.
- `docs/backlog.definitions.json` holds `statuses[]` with `name`, `order`, `means`. It is the user's file,
  created on the first write and never rewritten.
- No React, Vite or TypeScript anywhere in the repository. `web/` is Astro and stays separate.
- `package.json` `setup` is `node scripts/build-workbench.js`; `AGENTS.md` records "setup takes no
  dependency" as a rule. This subtopic reverses it at the user's decision.
- No UX agent is registered for this repository's own sessions; `framwork/.codeadd/` ships `@ux-agent`,
  `@ux-layout-agent`, `@ux-flow-agent` and the `add-ux-design` skill.

## Context & Motivation

A JSONL board is correct for scripts and poor for people. The user wants to see the backlog as a kanban and a
priority list, and wants the app to grow into activity management: later, running an agent orchestrator
against a card, or refining a card with help before running it. Those futures are not built here, but the
structure is chosen so they slot in without a rewrite.

## Problem / Opportunity

- No visual view of either backlog.
- A browser cannot `fetch` a local file from `file://`, so a plain HTML page cannot show the live board.
- Future write and agent actions need an app shaped for them from the start: routes, loaders, an API namespace.

## Proposed Solution

### Placement and stack

- Source at the repository root, **`board/`**, its own `package.json` (private) and lockfile. Product layer —
  it ships to users in 004 — but **not** copied into `cli/src/` like `mcp/`.
- **TypeScript (strict)**, **React**, **Vite**.
- **TanStack Router**, file-based routes, **typed and validated search params** (zod), **route loaders**.
  TanStack Query holds server data; each loader calls `ensureQueryData`, so navigation never shows a blank
  screen and a server push only invalidates a query.
- **Tailwind CSS + shadcn/ui** (Radix primitives) for components, `lucide-react` icons, `react-markdown` for
  notes and comments.
- **Forms: react-hook-form + zod**, the pair shadcn/ui's `Form` is built on. The one form this subtopic has is
  the filter bar: its defaults come from the route's validated search params and every change navigates, so
  **the URL is the single source of view state**. The zod schema that validates the route's search is the same
  one the form uses. Write forms, when they come, follow the same shape: loader provides defaults, submit goes
  to `/api`, success invalidates the query.

### Layout on disk (same in the repository and, in 004, in a user's `.codeadd/board/`)

```
board/
  server.mjs      zero-dependency Node server
  dist/           the Vite build (gitignored in the repository)
  src/ ...        TypeScript source (repository only; never shipped)
```

### Routes

| Route | Shows |
|---|---|
| `/` | redirects to `/board` |
| `/board` | Kanban. One column per status in `definitions.statuses`, sorted by `order`. Cards inside a column keep board line order — the priority |
| `/board/$ticketId` | The ticket detail as a right-side sheet over the kanban. Nested route: the URL is shareable, Back closes it, filters survive |
| `/list` | Every ticket in line order with its rank number — the priority view |
| `/list/$ticketId` | The same detail sheet over the list |

Search params on `/board` and `/list`: `q` (text over title, tldr, notes), `theme`, `label` (repeatable),
`status` (repeatable; on `/board` it hides the other columns). Invalid params are dropped by the schema, never
thrown at the user.

### Server — `board/server.mjs`

- Node ≥ 18, **no dependency**, ESM.
- Flags: `--root <dir>` (the project, default cwd), `--scripts <dir>` (default `<root>/.codeadd/scripts`),
  `--port` (default `4317`; when busy, the next free port up to +10), `--no-open`. Binds **`127.0.0.1` only**.
- `GET /api/board` → `{ present, tickets[], statuses[], damagedLines[], undefinedStatuses[], readAt }`.
  Tickets come from running `bash <scripts>/backlog.sh list --all` — **the server never parses
  `docs/backlog.jsonl` itself**. `statuses` come from `docs/backlog.definitions.json`; when that file is absent
  and tickets exist, columns are derived from the statuses in use, in first-seen order; when both are absent,
  `present: false` and the UI shows the empty state.
- `GET /api/events` → Server-Sent Events. `fs.watch` on `docs/`, debounced, emits `board-changed` when
  `backlog.jsonl` or `backlog.definitions.json` changes. The client invalidates the board query.
- Everything else under `/api/` → `404` JSON. **Reserved namespaces, not implemented:** `/api/tickets/:id/refine`,
  `/api/runs`, `/api/runs/:id`.
- Static: serves `dist/`, with SPA fallback to `index.html`.
- Errors are data: `bash` missing, script missing, script exit ≠ 0 → `/api/board` returns
  `{ error: "<code>", detail }` and the UI shows it as a banner, never a blank page.
- Opens the default browser unless `--no-open`.

### Workbench integration

- `package.json`:
  - `setup` → `node scripts/build-workbench.js && npm run build:board`
  - `build:board` → `npm --prefix board ci && npm --prefix board run build`
  - `board` → `node board/server.mjs --scripts framwork/.codeadd/scripts`
  - `test:board` → `npm --prefix board test`
- The workbench build runs first, so a board failure (offline, npm error) leaves the pipeline installed; the
  retry is `npm run build:board`.
- `AGENTS.md`: the "setup is the install" section says setup now also builds `board/` and why; the "mcp/ is the
  only root product directory" note names `board/` as the second and states the asymmetry: **only
  `board/server.mjs` is zero-dependency, like `mcp/`; the `src/` build toolchain is not**, which is why setup
  now takes a dependency. It also says `board/` ships as a release asset, not inside the npm package.
- `.gitignore`: `board/dist/`, `board/node_modules/`.

### Tests

- `board/` runs **vitest**: server tests against a temporary project with a fixture board and the real
  `framwork/.codeadd/scripts/backlog.sh`; route/component tests with Testing Library over a mocked `/api/board`.
- `tsc --noEmit` is part of `npm --prefix board test`.
- `.github/workflows/ci.yml` gains a `board` job mirroring `test-cli`: `defaults.run.working-directory: board`,
  Node 22, then `npm ci`, `npm test`, `npm run build`. Root `npm test` is unchanged.
- `scripts/run-tests.js` adds `./board/node_modules` and `./board/dist` to `TREE_EXCLUDES`, next to
  `./web/node_modules`, so the Windows container copy does not carry them.

## UX Brief — for the UX design pass the plan must run before any screen is built

**The plan runs a UX design pass (layout and flow) before the UI F-blocks, loading `add-ux-design`, and hands
it this brief verbatim.** The UI is what the user named as the quality bar.

- **What the app is:** an activity-management app whose first module is a read-only backlog board. Name,
  navigation and shell are for activity management, not "a backlog viewer".
- **Now:** kanban by status, priority list, ticket detail, filters in the URL, board-health banner
  (damaged lines, undefined statuses, script errors), an empty state for "no board yet" that says how a first
  ticket is created (`add-backlog` skill / `add-framework--backlog`).
- **Card content:** title, id, theme chip, label chips, grounded/ungrounded mark, comment count, `work_id` badge
  when set. Dense but readable.
- **Detail:** id, status, theme, labels, tldr, notes (markdown), done when, paths, grounded, created and updated
  times, comment timeline, `work_id`.
- **Planned for later, designed now, rendered NOT AT ALL:**
  1. *Run with agents* — dispatching an agent orchestrator against a card, and following that run.
  2. *Refine* — a conversation that improves a card before it runs.
  The layout reserves: an **action region in the detail sheet header** (empty now, no placeholder buttons);
  a **right-hand activity panel slot in the app shell** (collapsed and absent now) where a run log or a
  refinement conversation will live; a **navigation slot** where a "Runs" section will appear. Route names
  `/board/$ticketId/refine`, `/runs`, `/runs/$runId` are reserved and not created.
- **Also later, and the layout must not preclude:** drag-and-drop between columns and within a column (writes).
- Light and dark, following the system. Keyboard: `/` focuses search, `Esc` closes the sheet. Narrow screens:
  the kanban becomes a status switcher with one column visible.

## Type of Artefact

product — a new root application (TypeScript/React) and a zero-dependency server; internal — setup scripts
and `AGENTS.md`.

## Scope

### Includes
- `board/` app, server, tests, CI job
- `package.json` scripts, `.gitignore`, `AGENTS.md`
- The UX design pass and its brief

### Does NOT Include
- Any write: drag and drop, edit, status change, comment
- Orchestrator or refinement UI, API or routes — reserved only
- Shipping to users (004)
- Changing `backlog.sh` output

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| TanStack Router with loaders and validated search params; TanStack Query for server data | route-based state, and room for future routes | User requirement: route-based from the start, data and state per route. TanStack Router types the search params, which is what makes the URL a safe state store | ✅ |
| react-hook-form + zod, one schema shared with the route search | form practice consistent with route state | shadcn/ui's `Form` is built on it; one schema means the URL and the form cannot disagree | ✅ |
| shadcn/ui + Tailwind | "use ready UI libraries, a good-looking kanban" | Components are copied into the source and owned, so no runtime UI dependency ships beyond React | ✅ |
| Server reads tickets only through `backlog.sh list --all` | one reader of the format | The script owns damaged-line and undefined-status rules; a second parser drifts | ✅ |
| Server binds `127.0.0.1`, no CORS | safe now and when writes arrive | Future write and agent endpoints must never be reachable from the network | ✅ |
| SSE on file change | the board is live without reloads | Zero-dependency, one-way push is all a read-only board needs | ✅ |
| Same on-disk layout (`server.mjs` + `dist/`) in the repository and in `.codeadd/board/` | 004 ships what 002 runs | The server finds `dist/` relative to itself in both | ✅ |
| `setup` builds the board; failure leaves the workbench built | "available by default in the workbench" | User decision reversing the no-dependency rule; order keeps the pipeline usable offline | ✅ |
| Future actions get reserved regions and namespaces, rendered not at all | the app's future as activity management | User requirement: planned, invisible | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `board/` (new, product) | not a node — the graph does not see app source | New | create |
| `framwork/.codeadd/scripts/backlog.sh` (product) | `add-backlog` (RUNS_SCRIPT) | Gains the server as a runtime caller; unchanged | none |
| `docs/backlog.definitions.json` | not a node | Read by the server | none |
| `package.json` (internal) | not a node | `setup`, `build:board`, `board`, `test:board` | edit |
| `AGENTS.md` (internal) | not a node — graph cannot see it | setup rule, root-dir note | edit |
| `.gitignore`, `.github/workflows/ci.yml` (internal) | not nodes | ignore entries, `board` job | edit |
| `scripts/run-tests.js` (internal) | not a node — top-level scripts produce no nodes | `TREE_EXCLUDES` gains the board's build dirs | edit |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A live visual board, typed routes ready for future modules | A second package with its own dependencies in the repository |
| One format reader | The server needs bash, like every framework script |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| `fs.watch` is unreliable on some filesystems | Med | Debounced; the client also refetches on window focus |
| Port 4317 taken | Low | Next free port up to +10, printed on start |
| bash absent on a Windows machine | Low | The framework already requires bash; the API returns `bash-missing` and the UI says so |
| Dependency updates break the build | Med | Lockfile committed; CI `board` job builds on every PR |

## Next Steps

Run: `/add-framework--plan docs/brainstorming/2026-09-21T112103-backlog-board-002-board-app.md`
