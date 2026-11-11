# Brainstorm: Board statuses that follow the pipeline phases

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-23
> **Type:** architecture
> **Ticket:** 0005B

## Objective

Today the board can only say whether a ticket was decided, is in progress, or is finished. When this is
done, a ticket's status says **which pipeline phase it is in and which command takes it out of there** —
and every pipeline command writes its own phase, without any of them stopping because of the board.

The objective has four parts, and every decision below names the one it serves:

| Part | What it means |
|---|---|
| **P1 — the phase is visible** | A glance at the board says which phase each ticket is in |
| **P2 — the next command is visible** | The same glance says whether someone is in that phase or the ticket is parked waiting for a human |
| **P3 — every command writes its own phase** | Not just `add.build` and `add.done`, which is all that writes today |
| **P4 — the board never stops a command** | A refused, degraded or impossible board write is one line in a final report, never a halt |

## Discovery

- **`add-doc-schemas/references/backlog.md`** — the record format for `docs/backlog.jsonl` and
  `docs/backlog.definitions.json`. States the status vocabulary is **user-owned**. This design splits that
  ownership rather than removing it.
- **`framwork/.codeadd/scripts/backlog.sh`** — owns `REFUSED=unknown-status` and the hardcoded
  `DEFAULT_DEFS` (`open`/`doing`/`done`/`dropped`), written once when the definitions file is absent.
- **`framwork/.codeadd/scripts/backlog-commit.sh`** — the git route. **It writes to the BASE branch, never
  to the caller's branch**: direct when already on base, a detached, locked worktree otherwise. This is
  what makes a board write affordable in a command that promises not to touch the feature branch.
- **`add-backlog/references/lifecycle.md`** — "the one procedure five commands share". Declares only
  `add.build` and `add.done` write, both idempotent, and every failure degrades instead of stopping.
- **`board/src/lib/tickets.ts`** (`groupByStatus`) — already builds one group per defined status and gives
  an undefined status its own trailing group rather than dropping the ticket.
- **Plan `2026-09-21T134430-PLAN--backlog-board-001-internal-backlog-migration`** — created the definitions
  file and the hard ban: `backlog.sh` never rewrites it once it exists. Pinned by `backlog.bats` **L3.2
  `DEFS_PRESERVED`**, which asserts a hand-edited file survives further writes **byte-for-byte**.
- **Plan `2026-09-21T145331-PLAN--backlog-board-002-board-app`** — `board/server.mjs` reads the definitions
  file directly with `fs` rather than trusting `backlog.sh list`'s silent fallback.
- **Plan `2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle`** — built the per-stage write
  table. **Scoped OUT, by name:** any change to `backlog.sh`, `backlog-commit.sh` or the product
  `lifecycle.md`, and any writer besides `add.build`/`add.done`. This design reopens all of it, once.
- **Delivery index (`history`)** — nothing `gone`, nothing `superseded`. Every piece of this subsystem is
  `live`, delivered between 2026-09-20 and 2026-09-22.

## Context & Motivation

The backlog board shipped three days ago in three consecutive plans, and it works. What it cannot do is
say where a ticket is. `open` covers everything from "nobody has looked at this" to "the plan is approved
and nobody picked it up"; `doing` covers everything from "the build started" to "the PR has been open for
two days". The pipeline already knows the difference at every step — five commands read the ticket and
four of them write nothing.

Each of the three prior plans deferred the scope needed to fix that. This is the reopening.

## Problem / Opportunity

Three problems, and one of them is new to this design:

1. **The board's vocabulary is coarser than the pipeline's knowledge.** Four statuses over a seven-stage
   flow. The information exists and is discarded.
2. **Only two of five commands write.** `lifecycle.md` gives the reason: a board write travels through
   `backlog-commit.sh`, which commits and pushes, and the other three commands promise no git writes.
   That reason turns out to be narrower than it reads — see **Key Decisions**.
3. **The pipeline would depend on names it does not own.** This is created by the fix, not by the current
   state. The moment seven writes per ticket depend on status names, a user renaming one breaks seven
   writes in silence — each degrading correctly, per P4, and each reporting a board that never moves.

## Proposed Solution

### The premise that shapes everything below: there is no installed base

**Nobody is using the board in a project today.** The board app is three days old and ships as a separate
release asset; no user's project has a `docs/backlog.definitions.json` this change would find and have to
respect. **So this set carries no backward-compatibility obligation on the product layer**, and three things
that dominated the first draft of this design are gone:

| Was | Is |
|---|---|
| Reserved statuses **injected** into an existing definitions file, field by field | `DEFAULT_DEFS` simply ships the canonical nine statuses and seven columns. `backlog.sh` writes that shape when it creates the file |
| `backlog.bats` **L3.2 `DEFS_PRESERVED` reversed** — the file written after creation | **Unchanged.** The promise that a hand-edited definitions file is never rewritten stays delivered and stays true |
| `default: true`, to avoid silently removing `doing` and `done` from installs that have them | **`default: false`.** There are no such installs, and the argument for `true` was that one sentence |

⛔ **The one repository that does have a four-status definitions file is this one.** It is a hand-edit,
scoped to subtopic 003 along with the rest of the internal side — not a migration, and not a mechanism.

**"Reserved" survives as a documented contract, not as a script mechanism.** The nine names are the
pipeline's and the reference says so; a user who renames one gets `REFUSED=unknown-status`, seven degraded
lines and a board that does not move. That is the existing rule, it is loud, and a fresh install never
reaches it because the shipped default already defines all nine.

### The model: three things that are today one

| Layer | Who owns it | What it is |
|---|---|---|
| **status `name`** | the pipeline, for the nine reserved names | the machine state a command writes |
| **status `label`** | the user | what the card shows |
| **`column`** | the user | which board column groups this status |

A status with no `column` falls back to its own `name` as the column. A status with no `label` falls back
to its `name`. An absent `columns` block derives the column list from the statuses in `order`. **A
definitions file written before this change therefore renders exactly as it does today** — four statuses,
four columns. That tolerance is no longer about an installed base — there is none — but about a definitions
file someone hand-edits and leaves a key out of.

```json
{
  "columns": [
    { "name": "backlog",  "order": 1, "label": "Backlog"  },
    { "name": "shaping",  "order": 2, "label": "Shaping"  },
    { "name": "planning", "order": 3, "label": "Planning" },
    { "name": "building", "order": 4, "label": "Building" },
    { "name": "review",   "order": 5, "label": "Review"   },
    { "name": "done",     "order": 6, "label": "Done"     },
    { "name": "dropped",  "order": 7, "label": "Dropped", "hidden": true }
  ],
  "statuses": [
    { "name": "open",      "order": 1, "column": "backlog",  "means": "decided, nobody picked it up" },
    { "name": "refining",  "order": 2, "column": "shaping",  "means": "add.brainstorm or add.new running" },
    { "name": "shaped",    "order": 3, "column": "shaping",  "means": "about.md exists, waiting to plan" },
    { "name": "planning",  "order": 4, "column": "planning", "means": "add.plan running" },
    { "name": "planned",   "order": 5, "column": "planning", "means": "plan approved, waiting to build" },
    { "name": "doing",     "order": 6, "column": "building", "means": "add.build running" },
    { "name": "in-review", "order": 7, "column": "review",   "means": "PR open" },
    { "name": "done",      "order": 8, "column": "done",     "means": "delivered" },
    { "name": "dropped",   "order": 9, "column": "dropped",  "means": "decided against" }
  ]
}
```

Seven columns, nine statuses. `open`, `doing`, `done` and `dropped` **keep the `name` they have on disk**
and gain a `label`; the five new names are `refining`, `shaped`, `planning`, `planned` and `in-review`.

### The phase pair, and the phase check

Every phase has an **entry** status (a command is running) and, where a human can park the ticket, an
**exit** status (the phase finished, nobody picked the next one up). That pair is what makes P2 readable
without adding a column: `Planning · planning` means someone is in it, `Planning · planned` means it is
parked.

```
phase      entry      exit
---------  ---------  ---------
shaping    refining   shaped
planning   planning   planned
building   doing      in-review
done       —          done
```

**The phase check** extends the existing read-first rule from one status to the phase's pair: a command
writes the entry status only when the ticket is not already in that phase's **entry or exit**. That is what
keeps `add.new` from dragging a ticket backwards from `shaped` to `refining` after `add.brainstorm`
already shaped it — and it needs no notion of ordering, which the record format deliberately withheld.

**The exit write keeps the rule it already has, unchanged.** `lifecycle.md`'s single-field "read first, skip
when already there" covers it: write the exit status unless the ticket already reads it. Only the **entry**
write needed widening to the pair, because only the entry write can move a ticket backwards. Stating both
here is deliberate — an exit rule left to be inferred by extension is an exit rule subtopic 002 decides
twice.

### Who triggers a write: the agent, and nothing else

**Every one of the seven writes is triggered by the agent reading a STEP, and there is no platform hook
anywhere in this design.** A command reaches the step, runs `backlog-commit.sh update`, and continues.

That is not a fallback — it is the only thing that can work. No external hook knows the difference between
"`add.plan` started" and "`add.plan` finished", because that is a position inside a command's own flow.

**The phase check stays as text in `lifecycle.md`, read by the agent.** Moving it into `backlog.sh` was
considered and rejected: the script validates vocabulary membership and nothing else, and phase logic in the
script is transition logic in the script — which **Does NOT Include** already bans.

⛔ **The word "hook" in `lifecycle.md` today means "integration point inside a command", not a platform
hook.** It has already misled one reader into thinking a `settings.json` hook was involved. Subtopic 003
replaces the word wherever it appears in that reference.

**What protects a write the agent skips: idempotency, already designed.** A missed `planning` means the next
command writes `doing` and the ticket skips a column. Coarser, never wrong — which is exactly why P4 holds.
`status.sh` is the natural place to notice that drift and report it without gating anything; it is out of
scope here and named so.

**Two of the seven sit on a script's return and could become deterministic later** — `doing` after
`build-setup.sh`, `done` after `done.sh --merge`. Out of scope for this set. Recording it because those two
are the writes that already exist, and they exist precisely because `lifecycle.md` tied them to a return.

### The feature gate

**Everything board-related that CAN be gated lives behind a new `board` feature, `default: false`.** The
instructions do not sit in the five commands — they sit in `framwork/.codeadd/fragments/board/{command}.md`
and are injected post-install, so `codeadd features enable board` is what puts them there.

`default: false` because there is nothing to preserve. It also matches what the flag is: the board app is a
separate release asset, so a fresh install has no board, no `docs/backlog.jsonl` and no reason to carry
fifteen blocks of ticket instruction in five commands.

**What "everything board-related" can and cannot reach**, because the mechanism has a hard edge:

| Gateable | Ships always, whatever the flag says |
|---|---|
| Every ticket instruction in `add.brainstorm`, `add.new`, `add.plan`, `add.build`, `add.done`, `add.hotfix` | `backlog.sh` and `backlog-commit.sh` — scripts, and `next-id.sh` needs the board for the global id counter |
| The `- skill: add-backlog…` declarations, which move into the fragments | The `add-backlog` skill and its two references — the registry has no `skills` key |
| | `ticket:` in `about.md`'s frontmatter schema — optional already, and inert when nothing writes it |
| | Anything in `workbench/` — no feature system there at all |

⛔ **A feature gates commands. That is the whole reach.** Saying "everything board-related goes behind the
flag" and then discovering the skill and the scripts cannot is how a scope grows mid-build, so the edge is
drawn here instead.

### A fragment carries an anchor and a pointer, never a procedure

⛔ **This is the rule that makes the gate survivable.** Six fragments each carrying the write procedure is
six copies drifting — which is the exact failure `lifecycle.md` was created to prevent, reintroduced by the
mechanism meant to tidy it up.

```
IF WRITING A board FRAGMENT SECTION:
  ⛔ DO NOT: Restate the phase pair, the phase check, the work_id stop or the degradation table
  ⛔ DO NOT: Copy a row of the write table into the fragment
  ✅ DO: Name the step, name the write, and point at the reference row that owns it
```

**The shared knowledge splits in two, both under `add-backlog`:**

| Reference | Carries | Read by |
|---|---|---|
| `references/phases.md` — **new** | the **model**: the nine statuses, the seven columns, what each phase means, the entry/exit pairs | the six fragments, `add-plan-authoring`, and anyone reading the board who wants to know what a column means |
| `references/lifecycle.md` — keeps its name | the **procedure**: who writes what, at which step, the phase check, the `work_id` stop, the degradations | the six fragments only |

**Why split rather than one file.** After subtopic 003 a single `lifecycle.md` covers the model, the product
procedure, the internal procedure, the phase check, the `work_id` stop and the degradations — and the
question "what does `in-review` mean" is asked by readers who will never write a status. The model is the
half with more readers and fewer writers.

⛔ **No new top-level skill.** `add-backlog` already owns `backlog.sh`, the record format and the lifecycle;
a second skill over one subsystem puts a boundary between them that has to be re-decided on every edit.

Three mechanical limits, all verified against the current build:

| Limit | Consequence |
|---|---|
| A feature marker cannot be nested inside the `<!-- uses: -->` block — HTML comments do not nest | **The two `- skill: add-backlog…` lines MOVE into the fragment's own `<!-- uses: -->` block** rather than staying in the command's. A fragment carries one, the way `docs-pruning` and `qa-pipeline` already do. `add-backlog` is named nowhere in these five commands except the ticket instructions themselves, so leaving the lines behind would declare a dependency a disabled command no longer has |
| A command-side marker pair must be **empty** — `assertEmptyMarkerPairs` in `scripts/build.js` throws `Non-empty injection pair` otherwise | Every line of instruction lives in the fragment. Nothing can be "marked where it stands", and several sites are mid-sentence clauses or numbered list items — see subtopic 002 |
| The feature registry gates **commands** only; it has no `skills` key | `lifecycle.md` ships whether or not the feature is on. An unloaded reference costs nothing |
| `workbench/` has no feature system at all | The four internal stages write unconditionally. The gate is product-layer only, and that asymmetry is intended, not an omission |

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Nine columns, no `column` field** — one column per status | A nine-column kanban does not fit a screen, and the ticket's own notes raised it. `column` was the user's idea and it is the one that also answers "wait state or not" without a second mechanism |
| **A `phase` field separate from `name`**, so a user can rename freely and the pipeline matches on `phase` | Three layers where two do the job. `phase` and `name` would be 1:1 in almost every install, and `backlog.sh` would resolve phase→name on every write. `label` gives the same freedom where it is actually wanted: what the human reads |
| **A `pipeline` field per status**, so one file can describe both the internal 4-stage flow and the product 7-stage one | The definitions file is already per-repo and never regenerated. Two flows are already expressible by two files. The field would encode something the file expresses by existing |
| **Each command writes once, on entry** | Halves the commits and destroys P2. "Planning" that cannot distinguish running from parked is the coarseness this design exists to remove |
| **Only commands that already do git writes write the board** (today's rule kept) | Leaves P3 unbuilt. Five of the seven writes never happen and the new statuses stay empty |

## Type of Artefact

architecture — a format change, a script contract change, two reference rewrites, writes added to five
product commands and four internal stages, and a board rendering change.

## Scope

### Includes

- `column`, `label` and the `columns` block in `docs/backlog.definitions.json`, all three optional with
  a declared fallback.
- Nine **reserved** status names in `backlog.sh`, accepted on a write whether or not the local definitions
  file lists them, and **added to that file when missing**.
- The nine names and the phase-pair model in `add-doc-schemas/references/backlog.md`.
- `add-backlog/references/lifecycle.md` rewritten for seven writes across five commands, the phase check,
  and the degradation table extended to the new statuses — **and the word "hook" replaced wherever it
  appears there**, since it means "integration point inside a command" and has already been misread as a
  platform hook.
- **`add-backlog/references/phases.md`** — a new reference carrying the phase MODEL, split out of
  `lifecycle.md`, which keeps the procedure.
- A `board` feature in `cli/src/features.js`, `default: false`, gating the five product commands, with the
  instructions moved into `framwork/.codeadd/fragments/board/{command}.md`.
- The five product commands: `add.brainstorm`, `add.new`, `add.plan`, `add.build`, `add.done`.
- `add.hotfix` reaching `doing` → `in-review` → `done` with no phase before it.
- `add-plan-authoring` § **The Ticket** and the four internal stages, plus this repository's own
  `docs/backlog.definitions.json` hand-edited for the internal flow.
- The board: columns from `column`, the status as a badge on the card, `dropped` hidden by default,
  `columns` carried on `/api/board`.
- `backlog.bats` — **additive assertions only. L3.2 `DEFS_PRESERVED` is NOT touched.**

### Does NOT Include

- **Any migration in `cli/src/migrations.js`, and any injection into an existing definitions file.** There is
  no installed base to migrate or inject into. `DEFAULT_DEFS` ships the canonical shape.
- **Any rewrite of a definitions file that already exists.** L3.2 `DEFS_PRESERVED` stays true.
- **Any transition validation, ever.** `backlog.sh` validates vocabulary membership and nothing else. No
  status is refused because the previous one was skipped — that is what lets `add.hotfix` jump, and a state
  machine here would be a new way for the board to stop a command, against P4.
- **Renaming `open`, `doing`, `done` or `dropped`.** Every ticket already on disk carries one of them.
- **Batching the seven writes into fewer commits.** Each is a one-line change through the existing route.
- **Any change to `backlog-commit.sh`.** The base-branch route, the lock and the sweep all already do what
  this needs.
- **A new status the user invents.** They may add one; nothing writes it and nothing moves it.
- Drag-and-drop or any write path from the board app. It stays read-only.
- **Any platform hook.** Every write is a STEP the agent runs.
- **Moving `doing` and `done` into the scripts that already signal them** (`build-setup.sh`,
  `done.sh --merge`). Possible, recorded, not now.
- **A drift signal in `status.sh`** for a write the agent skipped. It is the right place and it is not here.
- **Gating `lifecycle.md` itself, or anything in `workbench/`.** The registry has no `skills` key and the
  workbench has no feature system.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| A status's `column` is a separate, optional field | P1 | Nine statuses over seven columns. Without it, the wait states force a nine-column kanban or stop existing | ✅ |
| Status `name` is reserved for the nine the pipeline writes; `label`, `column` and `order` are the user's | P3, P4 | The pipeline cannot depend on names it does not own. Splitting ownership keeps the user's control over everything they actually look at | ✅ |
| `DEFAULT_DEFS` ships the canonical nine statuses and seven columns; nothing is ever injected into a file that exists | P3 | There is no installed base. Injection existed only to spare a migration, and with no installed base it buys nothing and costs a delivered promise |  ✅ |
| `backlog.bats` L3.2 `DEFS_PRESERVED` stays exactly as it is | P4 | It asserts a hand-edited definitions file survives further writes byte-for-byte. Keeping it is strictly better than replacing it with something weaker |  ✅ |
| "Reserved" is a documented contract, not a script mechanism | P3 | The nine names are the pipeline's and the reference says so. A rename degrades loudly with seven reported lines, and a fresh install never reaches it |  ✅ |
| `open`, `doing`, `done` and `dropped` keep their `name` | P4 | Renaming breaks every ticket on disk, and `label` gives the display name for free | ✅ |
| Each phase has an entry and an exit status; every command writes both | P2 | A column that cannot distinguish "running" from "parked waiting" is the coarseness this design removes | ✅ |
| The phase check: skip the entry write when the ticket is already in that phase's entry **or** exit | P2, P4 | Stops `add.new` dragging a ticket back from `shaped` to `refining`, without inventing an ordering the format withheld | ✅ |
| One reserved set serves both pipelines; the two flows differ only by which file exists in which repo | P3 | The seven map onto both — the internal `add-framework--brainstorm`'s exit (the intent file exists) *is* `shaped`. Two reserved sets would be two lists to keep equal in one script | ✅ |
| A `spike` writes nothing to the board, and the entry write happens after the path is classified | P4 | The existing spike rule already forbids a spike writing any file. An entry write at STEP 1 could not be undone when the path turned out to be `spike` | ✅ |
| No transition validation | P4 | It is what lets `add.hotfix` jump straight to `doing`, and a rejected transition would be a new way for the board to stop a command | ✅ |
| The board app stays read-only | P1 | Out of scope for this set. A write path from the board is a second writer of `docs/backlog.jsonl` and needs its own design | ✅ |
| Every write is triggered by the agent reading a STEP; no platform hook | P3 | No external hook can know a position inside a command's flow. It is the only model that works, not a compromise | ✅ |
| The phase check stays as text in `lifecycle.md`, not in `backlog.sh` | P4 | Phase logic in the script is transition logic in the script, which is already banned. The script validates vocabulary membership and nothing else | ✅ |
| The seven writes live behind a `board` feature, `default: false` | P3, P4 | Nothing to preserve — nobody is using the board in a project. A fresh install has no board app and no backlog, so it should carry none of the text | ✅ |
| The instructions live in `fragments/board/{command}.md`, not in the command body | P3 | It is how a feature is toggled at all — the marker in the command is an empty anchor and the fragment carries the content | ✅ |
| **A fragment carries an anchor and a pointer, never a procedure** | P3, P4 | Six fragments each restating the write procedure is six copies drifting — the failure `lifecycle.md` exists to prevent, reintroduced by the mechanism meant to tidy it | ✅ |
| The shared knowledge splits into `phases.md` (the model) and `lifecycle.md` (the procedure), both under `add-backlog` | P1, P3 | "What does `in-review` mean" is asked by readers who never write a status. The model has more readers and fewer writers than the procedure | ✅ |
| No new top-level skill | P3 | `add-backlog` already owns the script, the format and the lifecycle. A second skill over one subsystem needs a boundary re-decided on every edit | ✅ |

## Ecosystem Impact

`Called by` is filled from `impact --depth 1`. **Three of the artefacts this design changes have no node in
the graph** — it indexes only `framwork/.codeadd/` and `workbench/` — so their row reads NOT VERIFIED and
was answered by reading the file.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `scripts/backlog.sh` | `add-backlog` (RUNS_SCRIPT) | `DEFAULT_DEFS` grows to nine statuses and seven columns; the `column`/`label`/`columns`/`hidden` fallbacks. **No injection, no write to an existing file** | required |
| `scripts/backlog-commit.sh` | `add-backlog` (RUNS_SCRIPT) | Carries seven writes instead of two; the route, lock and sweep are unchanged | none |
| `add-backlog` | `add.brainstorm`, `add.build`, `add.done`, `add.new`, `add.plan` (USES_SKILL) | Owns the reference that changes | required |
| `add-backlog/references/lifecycle.md` | `add.brainstorm`, `add.build`, `add.done`, `add.new`, `add.plan`, `add-backlog` (USES_SKILL) | Rewritten: the procedure only — seven writes, the phase check, the `work_id` stop, the degradations | required |
| `add-backlog/references/phases.md` | new — the six `board` fragments, `add-plan-authoring` | The phase model: nine statuses, seven columns, the entry/exit pairs | new |
| `add-doc-schemas/references/backlog.md` | `add-backlog`, `add-doc-schemas` (USES_SKILL) | The nine reserved names, the three new optional fields, the split ownership | required |
| `add-doc-schemas` | 22 artefacts (USES_SKILL) — every pipeline command plus `plan-reviewer-agent` and 8 skills | Owns the format reference; nothing else it carries changes | required (its reference only) |
| `add.brainstorm` | `add`, `add.new` (HANDS_OFF_TO) | Writes `refining` after the path is classified, `shaped` on bounded/architectural | required |
| `add.new` | `add`, `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `add-doc-schemas`, `add-feature-specification`, `add-id-convention`, `add-plan-review`, `add-qa-migration`, `add-review-discipline` (HANDS_OFF_TO); `plugins/gitnexus/fragments/add.new.md` (INJECTS_INTO) | Gains two writes. **Its "makes NO git writes" line changes** — the write reaches the base branch, never the feature branch | required |
| `add.plan` | 21 artefacts — 9 commands/agents, 4 fragments (3 INJECTS_INTO), 8 skills | Gains `planning` and `planned` | required |
| `add.build` | 20 artefacts — 8 commands/agents, 4 fragments (3 INJECTS_INTO), 8 skills | `doing` stays; gains `in-review` where STEP 9 opens the PR | required |
| `add.done` | `add`, `add.build`, `add.plan`, `add.pull-request`, `add.review`, 2 fragments (INJECTS_INTO), `add-doc-schemas`, `add-qa` | `done` unchanged | none |
| `add.hotfix` | `add`, `add.brainstorm`, `add.diagnose`, `add.done`, 2 fragments (INJECTS_INTO), `add-doc-schemas`, `add-investigation` | Gains the board relation it never had: `doing` → `in-review` → `done`, no phase before | required |
| `add-plan-authoring` | `add-framework--brainstorm`, `--build`, `--done`, `--plan` (USES_SKILL) | § **The Ticket** gains the same rows for the four internal stages | required |
| `docs/backlog.definitions.json` | **NOT VERIFIED** (no graph node) — read directly: `backlog.sh` and `board/server.mjs` | Gains `columns`, and `column`/`label` per status. This repo's own file is hand-edited for the internal flow | required |
| `board/src/lib/tickets.ts`, `board/server.mjs`, `/api/board` | **NOT VERIFIED** (no graph node) — read directly: `groupByStatus` is called by the board views; `server.mjs` reads the definitions file with `fs` | Group by `column` instead of status; carry `columns`; badge the status; hide `dropped` | required |
| `cli/src/migrations.js` | **NOT VERIFIED** (no graph node) — read directly: carries nothing about the backlog | No installed base to migrate | none |
| `cli/src/features.js` | **NOT VERIFIED** (no graph node) — read directly: the `FEATURES` registry, read by `applyEnabledFeatures` and the `features` CLI verbs | A fourth entry, `board`, `default: false`, listing the five product commands | required |
| `fragments/board/{add.brainstorm,add.new,add.plan,add.build,add.done}.md` | new — a fragment's node carries `INJECTS_INTO` its command | Carry every ticket instruction that lives in a command body today | new |
| `scripts/tests/backlog.bats` | not a node (no test file is) | **Additive only** — new assertions for the four fields and their fallbacks. L3.2 `DEFS_PRESERVED` untouched | required |
| `cli/tests/` | not a node | A suite proving the `board` toggle adds and removes all five injections, and that the five commands ship marker-free | new |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A board that says which phase a ticket is in and whether anyone is in it | Seven commits and pushes on the base branch per ticket instead of two |
| A shipped default that already holds every phase | Nothing. The compat cost the first draft paid is gone with the installed base |
| One mechanism serving both pipelines, expressed by two data files | The freedom to rename a pipeline status; `label` replaces it |
| `add.hotfix` on the board for the first time | — |
| Every existing `backlog.bats` assertion intact, L3.2 `DEFS_PRESERVED` included | — |

| Risk | Probability | Mitigation |
|---|---|---|
| **A reader assumes an installed base exists and re-introduces the injection** — it was in this design's first draft and its reasoning is persuasive | Medium | The premise section states the fact and the three things that follow from it. L3.2 `DEFS_PRESERVED` standing unchanged is the check: any injection breaks it |
| Seven writes per ticket make the base branch's history noisy | High | Accepted. Each is a one-line JSONL change and the board is a side-record. Batching is out of scope and named so |
| Two commands write the board at once (an automatic delivery chains them) | Medium | `backlog-commit.sh` already locks the worktree for the whole capture, and every failure past the write degrades. No new mechanism |
| A command writes a status and the board never moves, silently | Medium | P4 already requires one line in the final report per degradation. Subtopic 002 must carry that line for each of the seven, not only for the two that report today |
| The board's `column` grouping breaks a definitions file that has no `column` anywhere | Medium | The fallback is the status's own `name`, asserted in subtopic 003 against the shipped four-status file |
| The product and internal vocabularies drift, because they are two hand-edited files | Medium | One reserved set in one script is the single point that holds them together. Subtopic 002 writes both sides in one plan, deliberately, so the phase map cannot be decided twice |
| `add.new`'s "makes NO git writes" contract looks broken to a reader | Low | The line is amended with the reason: the write reaches the base branch through a detached worktree and never touches the feature branch |
| **A skipped write leaves the ticket a column behind and nobody is told** | High — it is the cost of a trigger that is a STEP the agent reads | Accepted, and it is why P4 is right. The ticket goes coarse, never wrong. A drift signal in `status.sh` is the right fix and is named as out of scope |
| The gate moves `doing` and `done` out of two command bodies; a botched move loses a write that works today | Medium | Subtopic 002 is scoped as a pure move with zero behaviour change when enabled. That is what makes it testable: the same seven assertions before and after |
| The five product commands are gated and the four internal stages are not, so the two sides read differently | Medium | Intended, and stated in the gate's limits table: the workbench has no feature system. Subtopic 003 writes both sides in one plan so the asymmetry is a decision on the page, not a discovery later |

## Decomposition Map

| Subtopic | Design Path | Serves the objective by | Purpose |
|---|---|---|---|
| The model and the script | `2026-09-23T164422-board-pipeline-phase-statuses-001-model-and-script.md` | makes the phase expressible at all — nothing downstream can write a phase the format cannot hold | `column`, `label`, `columns`, `hidden` and their fallbacks; the nine reserved names and the seven columns in `DEFAULT_DEFS`; `backlog.sh` and additive `backlog.bats` assertions; both format references. **No injection and no L3.2 change** |
| The feature gate | `2026-09-23T164422-board-pipeline-phase-statuses-002-the-feature-gate.md` | makes every command able to write its own phase without every project paying for it | The `board` feature in `cli/src/features.js`, `default: false`; **every ticket instruction that exists today in all five commands** moved into `fragments/board/{command}.md`, reads and writes alike; the `- skill: add-backlog…` lines moved into the fragments' own `uses:` blocks; the two entangled prose sites refactored; the substitution-count literal bumped. **Zero behaviour change when enabled** — a pure move, which is what makes it verifiable |
| The seven writes | `2026-09-23T164422-board-pipeline-phase-statuses-003-the-seven-writes.md` | makes every command write its own phase, and keeps the board from stopping any of them | `lifecycle.md` rewritten, "hook" replaced; the five new writes added to the `board` fragments, extended to `add.brainstorm`, `add.new`, `add.plan` and `add.hotfix`; `add-plan-authoring` § The Ticket and the four internal stages, ungated; the degradation line per write; this repo's own definitions file — **which is tracked in git and is the live file this repository's own board reads, so 003 confirms it has no other consumer (CI included) before hand-editing it** |
| The board | `2026-09-23T164422-board-pipeline-phase-statuses-004-the-board.md` | makes the phase and the next command visible at a glance, which is the only place the objective is actually read | Columns from `column`; the status as a badge on the card; `dropped` hidden by default; `columns` on `/api/board`; the no-`column` fallback asserted |

## Dependencies & Relationships

**001 → 002 → 003, in that order, and both dependencies are hard.**

- **001 gates 003 and 004.** 003 would write statuses `backlog.sh` refuses; 004 would group by a field no
  file carries.
- **002 gates 003, and this is the ordering the first draft of this umbrella got wrong.** With 002 second,
  003 adds the five new writes into fragments that already exist. With 002 last, 003 writes them into the
  five command bodies and 002 then moves all seven out — the same work twice, and the second pass rewrites
  files the first pass just landed.
- **002 does not depend on 001.** It moves the ticket instructions that exist today behind a flag and
  touches no status name. It could run first. 001 first is recommended anyway: 001 is the decision
  everything else reads, and a review of it early is worth more than two days of parallelism this set does
  not need.
- **`add.hotfix` joins the feature in 003, not 002**, because it carries no ticket instruction today and
  `cli/tests/injection-exclusivity.integration.test.js` asserts the registry's `commands` list matches the
  fragment files one to one. 002 registers five commands; 003 makes it six.

**004 is independent of 002 and 003.** It could run before either — it would render seven columns with two in
use, which is honest and visibly incomplete. Last is recommended: it is presentation over whatever 003
produced.

**004 concurrency.** `2026-09-23T122713-PLAN--board-design-palette-and-hierarchy` just delivered work on
status colour and card hierarchy. 004 touches the same surface and must read that delivery before
changing it, not after.

## Next Steps

Run: `/add-framework--plan [idea]`
