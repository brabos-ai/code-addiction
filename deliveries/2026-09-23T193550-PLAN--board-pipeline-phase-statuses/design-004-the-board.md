# Brainstorm: The board

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-23
> **Type:** product
> **Ticket:** 0005B
> **Set:** `2026-09-23T164422-board-pipeline-phase-statuses-000-umbrella.md`, subtopic 004

## Objective

Today the board can only say whether a ticket was decided, is in progress, or is finished. When this is
done, a ticket's status says **which pipeline phase it is in and which command takes it out of there** —
and every pipeline command writes its own phase, without any of them stopping because of the board.

**Serves the objective by** making the phase and the next command visible at a glance — which is the only
place the objective is actually read. Subtopics 001 to 003 make the phase exist and get written; none of
them is worth anything until this one shows it.

## Discovery

- **`board/server.mjs:126-140`, `readDefs()`** — reads `docs/backlog.definitions.json` with `fs`, then
  `.map((s, i) => ({ name, order, means }))`. **It silently drops every other field**, so `column` and
  `label` vanish there today. It sorts by `order`.
- **`board/server.mjs:142-166`, `boardPayload()`** — returns
  `{ present, tickets, statuses, damagedLines, undefinedStatuses, readAt }`. With no definitions file it
  derives statuses from first-seen order in the ticket stream.
- **`board/src/api/types.ts:7-33`** — `Status = { name, order, means }`; `BoardData` has no `columns`.
- **`board/src/lib/tickets.ts:19-39`, `groupByStatus`** — one group per defined status, and a trailing group
  with `undefined: true` for a status the vocabulary does not define.
- **One app caller: `board/src/views/board-view.tsx:11,30-32`.** Everything downstream keys off
  `group.status.name`: the mobile tab bar (`:57-101`), the `Column` component's id, `aria-label`,
  `data-status`, header text and glyph (`:123-147`), and the `QUIET` dimming set (`:14`,
  `new Set(['done','dropped'])`).
- **`board/src/components/ui.tsx:63-100`, `StatusGlyph`** — an SVG shape per status, unknown falls back to a
  dot. **`ui.tsx:103-116`, `StatusPill`** — the chip, styled through `data-status` and the
  `[data-status="…"]` selectors at `board/src/index.css:176-191` over the `--s-*` tokens at `:38-48` and
  `:85-92`.
- **Nothing hides or filters `dropped` today.** Grep over `board/src` finds only the `QUIET` dimming and its
  own colour token. Hiding a column is entirely new behaviour.
- **No status-filter UI exists on the board.** `filter-bar.tsx:93-95` renders it only when `showStatus` is
  passed, and `list-view.tsx:31` passes it while `board-view.tsx:35` does not. On the board,
  `search.status` hides whole groups.
- **`filter-bar.tsx:28-33`** — the established convention, in a comment: all view state lives in the URL.
- **Plan `2026-09-23T122713-PLAN--board-design-palette-and-hierarchy`** — delivered this morning. Its
  **F13 ruling** reverted column sizing twice and landed back on equal-share `sm:flex-1 sm:basis-0`
  (`board-view.tsx:138`), because with three of four statuses empty the collapse crowded the cards. The
  ruling names the cost in as many words: *"the original 'board wastes its viewport' complaint coming back
  if a future board runs many statuses with few tickets."* Its **F18** told statuses apart by shape as well
  as hue, answering a colour-blindness finding. Its **F5/F8** made the priority rank the one bold element on
  a card. Its **Checkpoint 3** deferred, by name, *"a second grouping axis in the URL and in the column
  model."*
- **`board/src/components/states.tsx:101`, `BoardSkeleton`** — hardcodes four columns, `[0,1,2,3].map(…)`.
- **Tests** — `board/test/tickets.test.ts` (`groupByStatus`, `filterTickets`, `facets`, `parseBoardSearch`),
  `board/test/server.test.ts:95-121` (the `/api/board` shape and status order, against the real
  `server.mjs` and the real `backlog.sh`), `board/e2e/board.spec.ts` with `board/e2e/fixture.ts:74-83`
  (which writes a four-status definitions file). Run by `npm --prefix board test`
  (`tsc -b --noEmit && vitest run`) and wired at the root as `test:board`.
- **Delivery index (`history`)** — nothing `gone`, nothing `superseded`. The board app is `live` from
  `2026-09-21T145331-PLAN--backlog-board-002-board-app`.

## Context & Motivation

**This is where the objective is read or not read at all.** The other three subtopics are plumbing: a
format that holds a phase, a flag that gates instructions, and seven writes. If the board keeps grouping by
status, the user gets nine columns in the order the injection appended them, and the work produces a worse
board than the one it started from.

It is also the subtopic with the newest neighbour. The palette-and-hierarchy delivery landed hours ago,
reverted its column sizing twice, and wrote down the exact failure this change makes more likely.

## Problem / Opportunity

1. **The column-per-status assumption is load-bearing in three places at once** — the mobile tab bar, the
   `Column` component and the `QUIET` set. All three read `status.name` as if it identified the column.
2. **The server drops the fields this needs.** `readDefs()`'s mapper is an allowlist of three keys.
3. **Column count goes from four to seven, into a layout that was just tuned for four**, by a ruling that
   named this exact risk. That is the hardest part of this subtopic and it is not a code problem.
4. **Two failure modes are easy to conflate:** a ticket whose *status* the vocabulary does not define
   (handled today, `undefined: true`) and a status whose *column* the `columns` array does not list (new).

## Proposed Solution

### Group by column; badge by status

`groupByStatus` is kept and a column grouping wraps it. The column is the layout unit; the status stays the
per-card signal.

| Unit | What it renders | Keyed by |
|---|---|---|
| Column | header label, id, `aria-label`, `data-column` | the column's `name`, its `label` for display |
| Card | the status badge — `StatusGlyph` plus `StatusPill` | the ticket's `status`, unchanged |

**This is what keeps F18 intact.** The glyph and the hue stay status-keyed, so the shape-as-well-as-hue
answer to the colour-blindness finding moves from the column header onto the card, where there are now
several statuses to tell apart. No `--s-*` token changes and no `[data-status]` selector changes.

**`QUIET` moves from per-column to per-card.** It is `new Set(['done','dropped'])` today and it matches a
status name; a column can now hold several statuses, so dimming a whole column by one status name is wrong.
The dimming follows the card.

### The server carries `columns`

`readDefs()` carries `column` and `label` through, and a sibling read picks up the top-level `columns`
array. `boardPayload()` gains a `columns` field, derived when the array is absent.

```
columns present in the file   -> used as written, sorted by order
columns absent               -> derived: one column per DISTINCT status column value,
                                in the order the statuses' own `order` first produces it
no definitions file at all    -> today's path — statuses derived from first-seen ticket order,
                                each its own column, which is exactly today's rendering
```

⛔ **The server stays zero-dependency, Node built-ins only, bound to `127.0.0.1`, and still never parses
`docs/backlog.jsonl`.** This is a pure data-shaping change to two functions. No import is added.

### The two failure modes, kept apart

| Situation | Today | After |
|---|---|---|
| A ticket's **status** is not in `statuses` | trailing group, `undefined: true` | unchanged — the status is unknown, and the card carries the fallback dot |
| A status's **`column`** is not in `columns` | cannot happen | a trailing **column**, marked as undefined, holding those statuses |
| A status has **no `column`** | cannot happen | falls back to its own `name` as the column, per subtopic 001 |

Three distinct outcomes, three distinct markers. A single "unknown" flag covering all of them is the bug
this table exists to prevent.

### `BoardSkeleton` takes a literal, and cannot take the real count

⛔ **`BoardSkeleton` is the router's `pendingComponent`** (`board/routes/board.tsx:12`, `list.tsx:12`). It
renders precisely when no payload has arrived, so "the real count" is a number it cannot have. A mitigation
asserting the skeleton equals the payload's count is unimplementable.

**It takes a literal: six, the shipped default's visible column count** — the same six this document commits
to elsewhere.

| Install | First paint |
|---|---|
| The shipped default, six visible | matches. No shift |
| A user who edited `columns`, or today's four-status file before its first write | one shift on cold load — **accepted, and named** |

**Trading a guaranteed four-column mismatch for a mismatch only on a customised board is the whole gain.**
Deriving it is impossible; matching the common case is the best available, and pretending otherwise is how
the risk row above got written wrong the first time.

### The `Column` type, and `hidden` surviving the round trip

⛔ **`readDefs()` is an allowlist that silently drops what it does not name** (`server.mjs:127-140`). So
`hidden` needs carrying through as deliberately as `column` and `label` do — the whole default-hiding
mechanism depends on a field that would otherwise vanish between the file and the client.

```ts
// board/src/api/types.ts
export type Column = { name: string; order: number; label?: string; hidden?: boolean };
export type Status = { name: string; order: number; means: string; column?: string; label?: string };
// BoardData gains: columns: Column[]
```

The server test asserts all four new fields survive the round trip — `column` and `label` on a status,
`label` and `hidden` on a column. **One assertion per field, because the mapper drops them one at a time.**

### `dropped` hidden by default, through the URL

`hidden: true` on a column sets the **default**, and the URL overrides it — which is the convention
`filter-bar.tsx:28-33` states for every other piece of view state.

**The `column` param is an additive union with the default-visible set, not an override list.** The two
readings are different code and different tests, so the choice is made here:

| | |
|---|---|
| **Absent** | Every column whose `hidden` is not `true` renders. Today's behaviour on a file with no `columns` block |
| **Present** | The default-visible set **plus** the columns named. `?column=dropped` shows the six plus `dropped` |

**Why additive rather than an override list.** `label` and `status` are both additive filters over "show
all" when absent, so additive is the convention this param joins rather than inverts. It also keeps the
"show dropped" control trivial: it writes `dropped`, not a computed list of everything currently visible —
which would go stale the moment the user edits `columns`.

⛔ **`column` is the one param whose absence is not "show everything".** That asymmetry is real and it is
the price of a default-hidden column. It is stated here so a reader does not "fix" it into consistency.

⛔ **Not `useState`.** A silently local toggle breaks the URL-as-source-of-truth convention and makes a
shared board link show a different board.

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Replace `groupByStatus` with `groupByColumn`** | Its per-status grouping is exactly what the card badges and per-status counts need. Wrapping it keeps `tickets.test.ts` meaningful instead of rewriting it |
| **Move the glyph and hue to the column** | Undoes F18. With several statuses per column the card is the only place the distinction can live |
| **Keep `QUIET` per-column** | A column holding `in-review` and `done` would dim both, or neither. Wrong either way |
| **Hide `dropped` with local component state** | Breaks the URL convention and a shared link |
| **Revisit F13's equal-share sizing as part of this subtopic** | It was reverted twice, by a user looking at a real board, hours ago. Re-opening it inside a grouping change is how a third revert happens. The lever this subtopic adds is `column` itself — see Risks |
| **Ship fewer than seven columns to stay near four** | The seven are the pipeline's phases. Collapsing them in the shipped default hides the thing the set was built to show, and the user can collapse them themselves with `column` |

## Type of Artefact

product — the board app, its server, its types and its tests.

## Scope

### Includes

- `board/server.mjs`: `readDefs()` carries `column` and `label`; a sibling read carries the `columns` array
  **with each entry's `label` and `hidden`** — the allowlist mapper drops anything it does not name; `boardPayload()`
  returns `columns`, derived when absent, with today's path preserved when there is no definitions file.
- `board/src/api/types.ts`: a new `Column = { name, order, label?, hidden? }`; `Status` gains optional
  `column` and `label`; `BoardData` gains `columns: Column[]`.
- A column grouping wrapping `groupByStatus`, in `board/src/lib/tickets.ts`.
- `board/src/views/board-view.tsx`: the `Column` component, the mobile tab bar and the desktop layout keyed
  by column; the status badge moved onto the card; `QUIET` moved from per-column to per-card.
- `board/src/components/states.tsx`: `BoardSkeleton`'s hardcoded `[0,1,2,3]` becomes the **shipped default's
  visible count, six** — a literal, not a derived value. See below.
- The new `column` URL param, in `board/src/lib/search.ts` and the filter bar, and `hidden: true` as the
  default it overrides.
- Tests: `board/test/server.test.ts` for the payload's `columns` in all three derivation paths;
  `board/test/tickets.test.ts` for the column grouping and the three failure modes;
  `board/e2e/fixture.ts` gaining a `columns`-aware variant; the existing `noSidewaysScroll` assertion
  **re-run at the real seven-column count across the three viewports**.

### Does NOT Include

- Any change to `--s-*` tokens, the `[data-status="…"]` selectors, `StatusGlyph`'s shapes or `StatusPill`.
  F18 and F1 stand.
- Any change to the priority rank as the one bold element on a card. F5 and F8 stand.
- **Any revisit of F13's equal-share column sizing.** If seven columns do not fit, that is a finding this
  subtopic reports, not a layout it re-decides.
- A `data-column` styling axis or any column-level hue. The column header stays neutral.
- Grouping by theme — the other half of the palette delivery's Checkpoint 3.
- Any write path from the board. It stays read-only.
- Any change to `backlog.sh`, `backlog-commit.sh` or `docs/backlog.jsonl`.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| Column is the layout unit; status is the per-card badge | the "phase is visible" half and the "next command is visible" half | It is the only arrangement where seven phases fit and nine statuses stay distinguishable | ✅ |
| `groupByStatus` is kept and wrapped, not replaced | the "phase is visible" half | Its per-status grouping is what the card badges need, and its existing suite stays meaningful | ✅ |
| The glyph and the hue stay status-keyed | the "next command is visible" half | Undoing F18's shape-as-well-as-hue answer would re-open a colour-blindness finding closed this morning | ✅ |
| `QUIET` moves from per-column to per-card | the "next command is visible" half | A column can now hold `in-review` and `done`; dimming by one status name is wrong for both | ✅ |
| Three distinct markers for unknown status, unknown column and absent column | the "the board never breaks a project" half | One flag over three situations makes an unrecognised status indistinguishable from a mis-typed column | ✅ |
| `hidden: true` is a default the URL overrides, via a new `column` param | the "phase is visible" half | `filter-bar.tsx:28-33` states the convention: all view state in the URL, so a shared link shows the same board | ✅ |
| `BoardSkeleton`'s column count becomes real | the "phase is visible" half | Four is a leftover from when four statuses were four columns. A skeleton that does not match the board is a layout shift on every load | ✅ |
| F13's equal-share sizing is not re-opened here | the "the board never breaks a project" half | Reverted twice this morning by someone looking at a real board. A third revert inside a grouping change is how this subtopic fails | ✅ |
| The shipped default is seven columns, six visible | the "phase is visible" half | They are the pipeline's phases. A user who wants four sets `column` on their statuses — which is the lever this whole set adds | ✅ |

## Ecosystem Impact

**Nothing under `board/` has a graph node** — the artefact graph indexes `framwork/.codeadd/` and
`workbench/` only. Every row below is **NOT VERIFIED** by the graph and was answered by reading the files;
each names the caller found and its line.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `board/server.mjs` `readDefs()` | `boardPayload()` (`server.mjs:143`) | Carries `column` and `label`; reads `d.columns` | required |
| `board/server.mjs` `boardPayload()` | the `/api/board` route (`server.mjs`) | Returns `columns`, derived when absent | required |
| `board/src/api/types.ts` | `board/src/api/board.ts`, every view | A new `Column` type carrying `label` and `hidden`; `Status` gains two optional fields; `BoardData` gains `columns: Column[]` | required |
| `board/src/lib/tickets.ts` `groupByStatus` | `board/src/views/board-view.tsx:11` — the only app caller; `board/test/tickets.test.ts:48-64` | Kept as-is, wrapped by a column grouping | required (additive) |
| `board/src/lib/tickets.ts` `filterTickets` | `board-view.tsx:29`, `list-view.tsx:27` | Unchanged. It filters tickets by status and still should | none |
| `board/src/views/board-view.tsx` | the `/board` route | The tab bar, the `Column` component and `QUIET`, all re-keyed to column | required |
| `board/src/views/list-view.tsx` | the `/list` route | Unchanged — it is a list, not columns. Its `showStatus` filter still filters by status | none |
| `board/src/components/ui.tsx` `StatusGlyph`, `StatusPill` | `board/src/views/ticket-sheet.tsx:86`, `board/src/views/list-view.tsx:89`, `board-view.tsx:96-98,142-147` | Reused on the card. The components themselves do not change; two of their call sites move | call sites only |
| `board/src/components/states.tsx` `BoardSkeleton` | the `/board` loading state | Four hardcoded columns become the real count | required |
| `board/src/lib/search.ts` | `filter-bar.tsx`, both views | A `column` list param joins `q`, `theme`, `label`, `status` | required |
| `board/src/components/filter-bar.tsx` | both views | A control for the `column` param | required |
| `board/src/index.css` | the whole app | **No change.** Tokens and `[data-status]` selectors stand | none |
| `docs/backlog.definitions.json` | `backlog.sh`, `board/server.mjs` | Read, never written here | none |
| `board/test/server.test.ts`, `board/test/tickets.test.ts`, `board/e2e/` | `npm --prefix board test`, root `test:board`, CI's board job | New assertions; a `columns` fixture variant; `noSidewaysScroll` re-run at seven columns | required |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A board that shows the phase and whether anyone is in it | A layout tuned for four columns, now running seven |
| Column count becomes the user's decision, through `column` | The simplicity of one status = one column |
| F18, F1, F5 and F8 all survive untouched | — |
| `dropped` out of the way by default, overridable in the URL | A new URL param to maintain |

| Risk | Probability | Mitigation |
|---|---|---|
| **Seven columns break the equal-share layout F13 landed on.** Its ruling names this exact case: *"many statuses with few tickets"* | **High. This is the risk of this subtopic** | The `noSidewaysScroll` e2e assertion at three viewports is the gate, run at the real seven-column count, before anything else in this subtopic is called done. If it fails, the plan **reports it and stops** — it does not re-decide F13. The user then chooses: fewer shipped columns, or a layout change as its own work |
| `BoardSkeleton` stays at four and the board shifts on every load | High if missed — it is a hardcoded literal with no test | Named in scope with its exact line. **The assertion is that the skeleton's count equals the shipped default's visible count, six — never "the payload's", which it cannot know.** A customised board still shifts once, and that is accepted above |
| The three failure modes get collapsed into one flag | Medium | Three rows, three markers, three assertions. It is the table, not a paragraph |
| `readDefs()`'s allowlist mapper silently drops one of the new fields | **High — it is an allowlist, and `hidden` is the one the whole default-hiding mechanism rests on** | One server-test assertion **per field**: `column` and `label` on a status, `label` and `hidden` on a column. A single "the new fields survive" assertion would pass with three of four |
| Hiding `dropped` lands as local state because it is easier | Medium | The convention is in a comment at `filter-bar.tsx:28-33` and the decision is in this document. A test that a `column` param in the URL survives a reload |
| The status filter's meaning gets muddled — filter by status or by column? | Medium | Decided: `filterTickets` keeps filtering **tickets by status**, unchanged, and the new `column` param selects **which columns render**. Two different jobs, two params |
| **`column` is implemented as an override list instead of an additive union** | Medium | The two readings are different code and different tests. The table above states which, and the "show dropped" control writing the single value `dropped` is the assertion that pins it |
| This subtopic lands before 003, showing seven columns with two in use | Low — the order is 001, 002, 003, 004 | Honest and visibly incomplete if it happens. Not a correctness problem |

## Next Steps

Run: `/add-framework--plan [idea]`
