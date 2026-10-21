# Plan: Board definitions sync — an existing definitions file gains the default statuses it lacks

> **Status:** implemented
> **Layers:** product
> **Type:** script
> **Created:** 2026-10-20
> **Delivery:** confirm
> **Ticket:** 0057B

---

## Objective

[from conversation, no design document] An existing `docs/backlog.definitions.json` on the board branch
gains every default status it lacks — through `codeadd migrate` and on the `backlog-commit.cjs` write that
names a missing default — so the pipeline's own status writes stop being refused as `unknown-status`.

**When this build is done:** one idempotent merge lives in the backlog core. A new write mode,
`sync-defs`, publishes it through the one board write route. Migration `0004-sync-board-definitions`
runs that mode from `codeadd migrate` and `codeadd update`. An `add` or `update` naming a default status
the file lacks merges first and lands in the same board commit. A status that is not a default is still
refused. The product docs that promised "nothing reconciles an old file" say what is true now.

**Ticket done when:** An old 5-status definitions file gains every missing default status (awaiting-release only when release_flow is on) without overwriting existing entries, via codeadd migrate and on the backlog-commit unknown-status path; covered by a test.

## Context

`DEFAULT_DEFS` (`framwork/.codeadd/scripts/backlog-core.cjs:12-43`) has ten statuses. The core writes it
only when the file is absent (`backlog-core.cjs:119-125`). Only `release-flow on` adds a status to an
existing file — `awaiting-release`, through `addBeforeDone` (`backlog-core.cjs:63-81`, `:295-303`). The CLI
registry (`cli/src/migrations.js`) holds `0001`–`0003`, none of which reads the board. So `codeadd migrate`
reports `Nothing pending.`, and every pipeline write of `refining`, `shaped`, `planning`, `planned` or
`in-review` against an older file exits 2 with `REFUSED=unknown-status`. Real case: a file holding
`open, doing, awaiting-release, done, dropped`.

**This reverses a decision on purpose.** `2026-09-23T193550-PLAN--board-pipeline-phase-statuses` rejected
injecting statuses into an existing file ("nothing is ever injected into a file that exists"), and
`2026-10-10T152531-PLAN--board-awaiting-release-and-agent-mode-examples` kept existing files out of
scope. The product docs still say it: `add--doc-schemas/references/backlog.md:143-148` and `:172-182`,
`add--backlog/references/phases.md:60`. The reason given was that the vocabulary is the user's. That
holds for entries the user wrote. It does not hold for names the framework's own commands write
unconditionally: a file without them breaks the pipeline, and every stage only reports and continues.
The reversal is narrow. It adds names that are missing. It never edits, renames, removes or reorders an
entry the user wrote.

No design document and no intent file exist. The user asked for every open point to be decided by the
planner's recommendation; the decisions are in **Validated Decisions**.

## Global Constraints

- Node built-ins only, no bash dependency, stack-agnostic (user brief; `backlog-commit.cjs` header: "No bash, no WSL, no shell anywhere in between")
- A definitions file the core cannot parse is never written (`backlog-core.cjs:292` — "A file the core cannot parse is never overwritten.")
- The definitions file is written only when something changed (`backlog-core.cjs:304` — "Written only when something changed, so a hand-formatted file is not reformatted for nothing.")
- Every board write goes through `backlog-commit.cjs`, the one write route; `backlog-cli.cjs` refuses writes with `ERROR=write-mode` (AGENTS.md, `add--backlog` SKILL.md:50)
- `docs/backlog.jsonl` is never read in the checkout (AGENTS.md, Product Layer — `board/`)
- A migration's `run` must be idempotent and synchronous; a failure is reported and left out of the ledger (`cli/src/migrations.js`, `runMigrations` header)
- Tests run through `node scripts/run-tests.js`; no test writes in the checkout (AGENTS.md, `scripts/run-tests.js` row)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **An old definitions file is frozen.** Statuses added to `DEFAULT_DEFS` after the file was seeded
   never reach it, and nothing reports that.
2. **The pipeline is refused on its own vocabulary.** `refining`, `shaped`, `planning`, `planned` and
   `in-review` writes exit 2 with `REFUSED=unknown-status`, so tickets silently stay a column behind.
3. **`codeadd migrate` has no way to see the board.** It says `Nothing pending.` on a project that needs
   a repair.

## Proposal

One pure merge function in the core, one new write mode that publishes it, and two callers:

1. **Core.** Generalise `addBeforeDone` into an insert that places a missing default **before the first
   entry already in the file that follows it in the default order** (`addBeforeDone` is the case where
   that entry is `done`). Add `mergeDefaultStatuses(defs)` over it. Add the `sync-defs` mode. Teach
   `add` / `update` to merge when the requested status is a missing default.
2. **Write route.** `backlog-cli.cjs` accepts `sync-defs` in its grammar (and refuses it as a write);
   `backlog-commit.cjs` commits and pushes it like `release-flow`, and reports `DEFS_ADDED`.
3. **Migration.** `0004-sync-board-definitions` runs `node .codeadd/scripts/backlog-commit.cjs sync-defs`
   in the project and maps its report to `changes` / `notes`, or throws to stay pending.
4. **Docs and changelog.** The three product docs that promise no reconciliation are corrected;
   `CHANGELOG.md` gains a `### Fixed` line.

Sequencing: core first (everything calls it), then the route, then the migration (it shells the
route), then docs.

## Current State

| Artefact | Today | Depth-1 dependants (graph) |
|---|---|---|
| `product/script/backlog-core.cjs` | Seeds when absent; `release-flow on` is the only merge | 1 — `add--resource-path-convention` (RUNS_SCRIPT). Also imported by `backlog-commit.cjs`, `backlog-cli.cjs`, `board/server.mjs` via `board/runtime/` |
| `product/script/backlog-commit.cjs` | Write modes `add … release-flow` | 4 — `fragments/board/add-new.md`, `add--backlog`, `add--id-convention`, `add--resource-path-convention` |
| `product/script/backlog-cli.cjs` | Owns the grammar `parseInvocation`, `MODES`, `WRITE_MODES` | 2 — `add--backlog`, `add--resource-path-convention` |
| `cli/src/migrations.js` | Registry `0001`–`0003`, none reads the board | NOT VERIFIED by graph — CLI source is not a graph node (route missing). By grep: `cli/src/cli.js`, `cli/src/updater.js`, `cli/src/installer.js` |

Delivery index (layer `product`): `backlog-core.cjs` — `changed` by `2026-10-03T122024-PLAN--node-only-board`;
`backlog-commit.cjs` — `superseded` entry `2026-10-04T004044-PLAN--native-node-backlog`, replaced by
`2026-10-05T152826-PLAN--native-node-framework-scripts`. Neither entry is a definitions merge that was
tried and dropped.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/backlog-core.cjs`: the merge.
  - Replace `addBeforeDone(list, name, seeded)` with `addInDefaultOrder(list, name, seeded)`. When the
    name is present, do nothing. Otherwise the pivot is the first entry in `list` whose name is one of
    the seeded entries that come AFTER `name` in `seeded`, searched in seeded order. The new entry takes
    the pivot's `order` and index; every entry with `order >= pivot` moves up by one. No pivot, or a
    pivot with no finite `order` → append with `max(order) + 1`. Same mechanism and comment style as today.
  - `release-flow on` calls the new function. For a file that holds `done` the result is byte-identical
    to today; existing `release-flow` tests must stay green unchanged.
  - Add `mergeDefaultStatuses(defs)` → `{ next, added }`, pure, no I/O. Deep-copies `defs`. Walks
    `DEFAULT_DEFS.statuses` in order and inserts each missing name; **skips `awaiting-release` unless
    `defs.release_flow === true`**. When `Array.isArray(next.columns)`, it also inserts the column each
    ADDED status names when that column is missing, with the same function over `DEFAULT_DEFS.columns`.
    No `columns` key → none created. Never touches `labels`, `release_flow`, or any key of an existing
    entry other than `order`. `added` lists the status names added, in default order.
  - Export `mergeDefaultStatuses` (tests use it).
  - **Produces:** `mergeDefaultStatuses(defs) → { next, added }`

- **F2** [product] — `framwork/.codeadd/scripts/backlog-core.cjs`: the `sync-defs` mode and the
  unknown-status path.
  - `sync-defs` joins `WRITE_MODES`. It is handled BEFORE the absent-file seeding block: absent file →
    `{ ok: true, defsAdded: [] }`, nothing written (reads already fall back to the defaults, and the next
    ordinary write seeds). Invalid file → `{ ok: false, refusal: 'definitions-unreadable' }`, nothing
    written. Usable file → merge; write only when `added` is not empty; write failure →
    `writeFailure: 'definitions'`.
  - `add` and `update`: when the requested status is not in the file's statuses AND `defsProvenance ===
    'file'` AND the status is a name in `mergeDefaultStatuses(defs).added`, validate against the merged
    set. Status not a default, or `awaiting-release` with `release_flow` not true → `unknown-status`,
    exactly as today.
  - **The definitions write comes last.** Every other check of the mode (reserved fields, required
    fields, duplicate id, `comments`) runs first. The merged file is written immediately before
    `writeBoard`, so a refused write leaves both files untouched. Defs write failure →
    `writeFailure: 'definitions'` and the board file is not written.
  - Successful results carry `defsAdded` (array, empty when nothing merged).
  - Fallback and seeded provenance are unchanged: validation against `DEFAULT_DEFS`, nothing extra written.
  - **Consumes:** `mergeDefaultStatuses(defs) → { next, added }` (F1)
  - **Produces:** core mode `sync-defs`; result field `defsAdded`

- **F3** [product] — `framwork/.codeadd/scripts/backlog-cli.cjs`: `sync-defs` in `MODES` and
  `WRITE_MODES`, no arguments (an extra argument is the grammar's usual error). The read entry refuses it
  with `ERROR=write-mode`, exit 2, like `release-flow`. Header and `USAGE` list it.
  - **Consumes:** core mode `sync-defs` (F2)

- **F4** [product] — `framwork/.codeadd/scripts/backlog-commit.cjs`: publish `sync-defs`.
  - Commit message `backlog: sync-defs (<n> statuses)`. Report `DEFS_ADDED=<comma names>` in place of
    `TICKET_ID` (empty allowed). Nothing added → `COMMITTED=no`, exit 0, no push — the same branch as
    `release` / `release-flow`. **Two edits make that true:** `sync-defs` gets its own branch in the
    `mode ===` chain that sets the report key and `message` (it has no `ticketId`), and the no-op exit
    `if (!commit.committed && (mode === 'release' || mode === 'release-flow'))` adds `sync-defs` —
    otherwise a second run falls through to the push.
  - `add` / `update` with a non-empty `defsAdded` report `DEFS_ADDED=<names>` after `TICKET_ID`. The
    commit already carries both files (`boardPaths`); verify it is ONE commit.
  - `REFUSED=definitions-unreadable` is the existing exit-2 domain refusal.
  - Header: the mode, its report key, its commit message, its exit codes; `USAGE` lists it.
  - **Consumes:** core mode `sync-defs`; result field `defsAdded` (F2)
  - **Produces:** `backlog-commit.cjs sync-defs` report lines `DEFS_ADDED=`, `COMMITTED=`, `PUSHED=`,
    `DEGRADED=`, `REFUSED=`, `ERROR=`

- **F5** [product] — `cli/src/migrations.js`: migration `0004-sync-board-definitions`.
  - **Short-circuit first, no spawn:** no `.codeadd/board.json` in `ctx.cwd` → applied, note `no board
    configured in this project`. This also covers a pre-board project (backlog still in the checkout,
    `board-migration-required`): once its maintainer moves the board, the write-path merge (F2) covers
    it. And it keeps every existing `update` / `install` test from spawning a child.
  - `syncBoardDefinitions(ctx, exec = defaultExec)` — `defaultExec` is `spawnSync(process.execPath,
    ['.codeadd/scripts/backlog-commit.cjs', 'sync-defs'], { cwd: ctx.cwd, encoding: 'utf8', timeout:
    120000 })`. The bound covers the 30 s lock wait plus fetch and push; a timeout (`error` set or
    `signal` set) → throw, stays pending. The injectable `exec` is for tests only. Board configured but
    the script file missing → applied, note `backlog-commit.cjs not installed; nothing to sync` (this
    release does not ship it, so there is nothing to wait for).
  - Exit 0 → applied. `DEFS_ADDED` not empty → `changes`: `board definitions: added <names>`; empty →
    `notes`: `board definitions already hold every default status`. A `DEGRADED=` line → a note naming it
    (the commit is in the clone and the next write pushes it).
  - Exit 2 with `REFUSED=board-not-configured` → applied, note `no board in this project`.
  - Any other outcome (`REFUSED=definitions-unreadable`, any `ERROR=`, exit 1, an unknown mode from an
    older script) → throw with the first `REFUSED=` / `ERROR=` line, so it stays pending and the next
    `migrate` / `update` retries it.
  - Registered after `0003`, with a description that says it writes the board branch.
  - **Consumes:** `backlog-commit.cjs sync-defs` report lines `DEFS_ADDED=`, `COMMITTED=`, `PUSHED=`,
    `DEGRADED=`, `REFUSED=`, `ERROR=` (F4)

- **F6** [product] — tests, RED first (see the Validation Matrix):
  `cli/tests/backlog-core.test.js`, `scripts/tests/backlog-commit.test.cjs` (new case ids registered in
  `scripts/tests/native-script-cases.json`), `cli/tests/backlog-cli.test.js`, `cli/tests/migrations.test.js`.
  Every new `sync-defs` and write-path merge case of the shipped entry goes in `backlog-commit.test.cjs`.
  `scripts/tests/backlog.test.cjs` is **run unchanged, not edited** — it holds `backlog#033`
  (DEFS_PRESERVED) and `backlog#044`, both of which must stay green. The `update` / `install` suites
  (`cli/tests/updater.test.js`, `install.e2e.test.js`, `non-interactive.e2e.test.js`) also run unchanged
  with the real `0004` registered (L2.9).

- **F7** [product] — the docs that promise no reconciliation:
  - `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md`: rewrite the ⛔ block at `:143-148`,
    the `DO NOT` lines at `:176-182`, and "Existing projects are not migrated" at `:190-195` to the new
    rule — missing default names are added by `sync-defs`, by migration `0004`, and on a write naming one;
    existing entries are never edited; a non-default status is still refused. Add `sync-defs` to the
    refusal table row for `definitions-unreadable` (`:318`).
  - `framwork/.codeadd/skills/add--backlog/SKILL.md:50-59`: `sync-defs` in the write-mode list.
  - `framwork/.codeadd/skills/add--backlog/references/phases.md:60`: same correction, one sentence.
  - What must not be lost: "the vocabulary is the user's" still governs every entry the user wrote.

- **F8** [product] — `CHANGELOG.md`: a `### Fixed` subsection under `## [Unreleased]` with one line —
  an existing board definitions file now gains the default statuses it lacks, via `codeadd migrate` and
  on the write that needs one. The delivery's `docs/changelog/<ts>-fix-board-defs-sync.md` is written by
  the build at its STEP 8, under the rules in `add-plan-authoring` → File Naming; it is not an F-block.

### Does NOT Include (important!)

- Merging default `labels` or default `columns` that no added status needs. Labels are a suggestion
  (`backlog.md:68`); the ticket is about statuses.
- Removing, renaming or re-labelling any entry, or reordering one other than the `order` shift an insert
  needs.
- A merge in the checkout for a project still in `board-migration-required` — the checkout's backlog is
  never read; the migration stays pending and reports the error.
- Changing `release-flow` semantics, the seeding of an absent file, or the board server.
- Any change to `workbench/`. The internal `add-plan-authoring` degradation row for `unknown-status` stays
  true for a non-default status.

## Validated Decisions

Decided by the planner at the user's request ("decide every open point by your own recommendation").

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Reuse `addBeforeDone` ordering as is? | **No — generalise it** to "before the first existing default successor" | `addBeforeDone` puts every insert before `done`. On the real file it would place `refining` after `awaiting-release`. The general rule gives the default order on that file and is identical to today for `awaiting-release` |
| Unknown-status path: merge only the requested status, or all missing defaults? | **All missing defaults, once** | One coherent board commit instead of one per future write; same function as the migration |
| How does `codeadd migrate` reach the board? | **Spawn the installed `backlog-commit.cjs sync-defs`** | It is the existing write route — lock, level with remote, commit, push. `cli/` would otherwise duplicate the board resolution, lock and git code |
| `sync-defs` on an absent file | **No-op**, nothing seeded | Reads already fall back to defaults; seeding a file from an unattended `update` is a write nobody asked for |
| Migration outcome on an unparseable file, or a board error | **Throw → stays pending** | Retried on the next `migrate`/`update` and warned each time; marking it applied would hide the repair for good |
| Migration on a project with no board | **Applied, with a note** | Nothing will ever need it there |
| A fresh install stamps `0004` as applied without running it | **Accept** | The write-path merge covers that project on its first write that needs a default |
| `awaiting-release` | Added only when `release_flow === true`; absent, `false` or any non-boolean value counts as off | User brief; `release-flow on` already adds it when turned on; same test the core's `RELEASE_FLOW` read uses |
| Migration on a project with no `.codeadd/board.json` | Applied with a note, no child spawned | Nothing to sync; keeps every existing update/install test free of a child process |
| Migration spawn time limit | 120 s, then throw | `codeadd update` must not hang on a held lock or a dead remote |
| Missing column | Added only when the file has a `columns` array and an added status names it | User brief; a file without `columns` derives them (`backlog.md` keys table) |
| Release-flow on a file with no `done` but with `dropped` | Insert before `dropped` instead of appending | The general rule; strictly a better position. Only reachable on a hand-edited file |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| The pipeline's writes land on old boards with no manual step | A user who RENAMED a default (e.g. `doing` → `wip`) gets `doing` added back next to `wip` |
| One repair path for migrate and for writes | `codeadd update` now pushes to the `board` branch when it has something to add |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A refused write leaves a merged defs file uncommitted in the clone | Medium | F2 writes defs last, after every check; L1.9 asserts both files byte-unchanged on a refused write |
| The generalised insert changes `release-flow on` output | Low | F1 keeps the `done` case identical; the existing `release-flow` tests in `backlog-commit.test.cjs` run unchanged (L2.5) |
| `board/runtime/` copies of the core go stale | Medium | Build runs `node scripts/build-board-runtime.js` (via `npm run build:board`); `cli/tests/board-runtime.test.js` checks byte equality (L3.2) |
| Migration masks a board failure as applied | Low | F5 throws on every outcome but exit 0 and `board-not-configured`; L2.8 covers each mapped outcome |
| Custom fields lost on merge | Low | Deep copy, insert-only; L1.4 asserts every pre-existing entry equal except `order` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/backlog-core.cjs` | product | modify | F1, F2 |
| `framwork/.codeadd/scripts/backlog-cli.cjs` | product | modify | F3 |
| `framwork/.codeadd/scripts/backlog-commit.cjs` | product | modify | F4 |
| `cli/src/migrations.js` | product | modify | F5 |
| `cli/tests/backlog-core.test.js` | product | modify | F6 |
| `cli/tests/backlog-cli.test.js` | product | modify | F6 |
| `cli/tests/migrations.test.js` | product | modify | F6 |
| `scripts/tests/backlog-commit.test.cjs` | internal path, tests a product script | modify | F6 — tagged with F6 [product] because it tests the shipped entry |
| `scripts/tests/native-script-cases.json` | internal path | modify | F6 — case ids for the new tests |
| `scripts/tests/backlog.test.cjs` | internal path | unchanged, run | F6 — `backlog#033`, `backlog#044` stay green |
| `cli/tests/updater.test.js`, `install.e2e.test.js`, `non-interactive.e2e.test.js` | product | unchanged, run | F6 / L2.9 — real `0004` registered |
| `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md` | product | modify | F7 |
| `framwork/.codeadd/skills/add--backlog/SKILL.md` | product | modify | F7 |
| `framwork/.codeadd/skills/add--backlog/references/phases.md` | product | modify | F7 |
| `CHANGELOG.md` | root | modify | F8 |
| `board/runtime/*` | product (generated) | regenerate | Copies of the core; not hand-edited |
| `AGENTS.md` | internal | unchanged | No anatomy change; the inventory already lists every script touched |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against the
current tree. Run through `node scripts/run-tests.js` (suites `cli` and `scripts`).

Fixtures: **OLD5** = statuses `open, doing, awaiting-release, done, dropped` (orders 1–5),
`release_flow: true`, no `columns`. **OLD4** = `open, doing, done, dropped`, no `release_flow`, with a
`columns` array of `backlog, building, done, dropped`. **CUSTOM** = OLD4 plus a status `blocked`
(order between `doing` and `done`) and a changed `means` on `doing` and an extra key `color` on `open`.

### L1 — Core (`cli/tests/backlog-core.test.js`) (RED → GREEN)

1. `mergeDefaultStatuses(OLD5)`: status names equal the ten defaults in default order; orders strictly
   increase; `added` = `refining, shaped, planning, planned, in-review`. *RED: function does not exist.*
2. `mergeDefaultStatuses(OLD4)`: nine names, no `awaiting-release`; `columns` gains `shaping, planning,
   review` in default order and no `release`. *RED.*
3. Idempotency: merging the result again → `added` empty and `next` deep-equals its input. *RED.*
4. CUSTOM: `blocked`, the changed `means`, `color` all preserved; every pre-existing entry equal to its
   input except `order`; relative order of pre-existing entries unchanged. *RED.*
5. `sync-defs` on OLD5 file → file holds the full set; second run writes nothing (bytes and mtime
   unchanged). *RED: unknown mode.*
6. `sync-defs` on an unparseable file → `definitions-unreadable`, bytes unchanged; on no file → ok,
   `defsAdded` empty, no file created. *RED.*
7. `add` with status `refining` on OLD5 → ok, `defsAdded` non-empty, ticket written, defs full. *RED:
   refused `unknown-status` today.*
8. `add` with status `invented` on OLD5 → `unknown-status`, both files byte-unchanged; `update` to
   `awaiting-release` on OLD4 → `unknown-status`, unchanged. *GREEN today — must stay green.*
9. `add` with status `shaped` and a reserved field on OLD5 → `reserved-field`, both files unchanged.
   *RED once the merge exists if the write order is wrong — pins F2's "defs last".*
10. `release-flow on` on OLD4 → same bytes as before this change (fixture output captured from the
    current tree). *GREEN today — must stay green.*

### L2 — Write route (`scripts/tests/backlog-commit.test.cjs`, `cli/tests/backlog-cli.test.js`, `cli/tests/migrations.test.js`)

1. `backlog-commit.cjs sync-defs` on a board fixture seeded with OLD5 → exit 0, `DEFS_ADDED=refining,
   shaped,planning,planned,in-review`, `COMMITTED=yes`, `PUSHED=yes`; the remote `board` file holds ten
   statuses. *RED.*
2. Second run → `COMMITTED=no`, `DEFS_ADDED=` empty, exit 0, remote head unchanged. *RED.*
3. `update <id>` with `{"status":"refining"}` on OLD5 → exit 0, `DEFS_ADDED=` listed, and the pushed
   head commit touches both `docs/backlog.jsonl` and `docs/backlog.definitions.json` (one commit). *RED.*
4. `update <id>` with `{"status":"invented"}` → exit 2, `REFUSED=unknown-status`, no new commit. *GREEN
   today — must stay green.*
5. Every existing `release-flow` and `release` case passes unchanged. *GREEN.*
6. `backlog-cli.cjs sync-defs` → `ERROR=write-mode`, exit 2. *RED.*
7. `0004-sync-board-definitions` is in `MIGRATIONS` and `allMigrationIds()` stays sorted. *RED.*
8. `syncBoardDefinitions` with an injected `exec`: exit 0 + names → one `changes` entry; exit 0 + empty
   → one note; exit 0 + `DEGRADED=push-refused` → note names it; exit 2 + `board-not-configured` →
   applied with note; exit 2 + `definitions-unreadable` → throws; exit 1 + `ERROR=board-checkout-missing`
   → throws; a timed-out spawn → throws; no `.codeadd/board.json` → applied with note and `exec` never
   called; board configured and script absent → applied with note; and through `runMigrations` a throw
   leaves `0004` out of `applied`. *RED.*
9. `scripts/tests/backlog.test.cjs`, `cli/tests/updater.test.js`, `install.e2e.test.js` and
   `non-interactive.e2e.test.js` pass unchanged with the real `0004` in `MIGRATIONS`. *GREEN — must stay green.*

### L3 — Build and runtime

1. `node scripts/build.js` exits 0 with no new warning.
2. Board runtime regenerated; `cli/tests/board-runtime.test.js` passes (byte equality with the core).

### L4 — Behavioural acceptance

1. On a scratch board fixture holding OLD5, `codeadd migrate --list` shows `0004` pending; `codeadd
   migrate` prints `Migration: board definitions: added …` and records `0004`; a second `migrate` prints
   `Nothing pending.` — run in a temp project, never in this checkout.

**RED expectations against the current tree:** L1.1–7, L1.9, L2.1–3, L2.6–8 fail. L1.8, L1.10, L2.4,
L2.5 pass and must keep passing.
**GREEN = all levels pass after F1–F8.**

---

## Execution Order

1. **F6 (RED part)** — write L1, L2 tests; confirm the RED set above.
2. **F1 [product]** → **F2 [product]** — core; L1 green. Repo works here: no caller sends `sync-defs` yet.
3. **F3 [product]** → **F4 [product]** — route; L2.1–2.6 green. Working boundary.
4. **F5 [product]** — migration; L2.7–2.8 green. Working boundary.
5. **F7 [product]** — docs.
6. **F8 [product]** — changelog line.
7. L3, L4.

One commit per F-block (`add-build-ledger`). F6's tests may be committed with the F-block they turn green.

## Reviewer Handoff

For each F-block the evidence file names files touched, the validation levels and their pass state, and
any departure from this plan with its reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A defs write that happens before a refusal check in `add` / `update` (L1.9).
3. A merge that changed a key of an existing entry other than `order` (L1.4).
4. A migration outcome mapped to "applied" that should have stayed pending (L2.8).
5. A doc still saying nothing reconciles an old file (F7 lines).

## References

- `2026-09-23T193550-PLAN--board-pipeline-phase-statuses` — the decision this plan reverses, narrowly.
- `2026-10-10T152531-PLAN--board-awaiting-release-and-agent-mode-examples` — `addBeforeDone` and `release-flow on`.
- `2026-10-10T110912-PLAN--board-outside-code-branches` — the board branch and the one write route.

---

## Next Steps

/add-framework--build docs/plans/2026-10-20T213051-PLAN--board-defs-sync.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-20 | Initial creation |
| 2026-10-20 | Review fix-then-ok applied: F6 names `backlog.test.cjs` as run-unchanged and where new cases go (A1); F5 short-circuits on no `board.json`, maps a missing script to applied, L2.8/L2.9 cover the real `0004` in update/install suites (A2); F5 spawn timeout 120 s → throw (A3); F4 names the `mode` chain and the no-op exit edits (A4); `release_flow` non-boolean counts as off (N1). Status set to approved by the planner, at the user's request |
| 2026-10-20 | Implemented in commits 417d9a3..HEAD of branch fix/board-defs-migrate; rulings in the ledger |
