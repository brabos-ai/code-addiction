# Brainstorm: The model and the script

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-23
> **Type:** architecture
> **Ticket:** 0005B
> **Set:** `2026-09-23T164422-board-pipeline-phase-statuses-000-umbrella.md`, subtopic 001

## Objective

Today the board can only say whether a ticket was decided, is in progress, or is finished. When this is
done, a ticket's status says **which pipeline phase it is in and which command takes it out of there** —
and every pipeline command writes its own phase, without any of them stopping because of the board.

**Serves the objective by** making the phase expressible at all — every other subtopic writes, reads or
renders a phase, and none of them can until the format holds one and the script accepts it.

## Discovery

- **`framwork/.codeadd/scripts/backlog.sh`** — one embedded Node program (`NODE_PROG`) over a fixed argv.
  `DEFAULT_DEFS` holds the four shipped statuses. `loadDefs()` creates the file from `DEFAULT_DEFS` when
  absent **on a write only**, returns the parsed file when present, and returns `DEFAULT_DEFS` with
  `DEFS_UNREADABLE=yes` when the file cannot be parsed. `rejectUnknownStatus()` refuses a write carrying a
  status the loaded definitions do not list.
- **`framwork/.codeadd/scripts/tests/backlog.bats`** — 47 assertions. Four matter here:
  **L3.2 `DEFS_PRESERVED`** (a hand-edited file survives further writes byte-for-byte), **L3.2b** (a status
  the user added is accepted on a write), **L3.6** (an undefined status exits 2 with
  `REFUSED=unknown-status`, file unchanged), and **L1.4/L1.4b** (the emittable `REFUSED=` set equals the
  documented one). **None of the four is reversed by this subtopic.**
- **`add-doc-schemas/references/backlog.md`** — the record format. Declares the status vocabulary is the
  user's, the thirteen fields, the seven hard bans and the six `REFUSED=` names.
- **`add-backlog/references/lifecycle.md` § The Status Names** — says a renamed status makes the write fail
  with `REFUSED=unknown-status`, and bans reading `order` as a meaning. **Both stay true.**
- **`board/server.mjs:126-140`, `readDefs()`** — reads the definitions file with `fs` and maps each status to
  exactly `{ name, order, means }`, dropping every other key. Verified: it tolerates the new fields without
  erroring; it simply ignores them until subtopic 004.
- **The premise from the umbrella: there is no installed base.** Nobody is using the board in a project, so
  no user's `docs/backlog.definitions.json` exists to migrate, inject into or preserve.
- **Delivery index (`history`)** — `backlog.sh` is `live` from
  `2026-09-20T111051-PLAN--project-backlog-001-format-and-script`. Nothing `gone`, nothing `superseded`.

## Context & Motivation

Nothing downstream can move. Subtopic 003 would write `planning` and get `REFUSED=unknown-status`; subtopic
004 would group by a field no file carries.

**This subtopic is much smaller than its first draft, and the reason is worth recording.** That draft
injected missing reserved statuses into an existing definitions file, field by field, which meant reversing
`backlog.bats` L3.2 `DEFS_PRESERVED` — a delivered assertion that the file is never rewritten. All of that
existed to spare an installed base a migration. There is no installed base. The injection, the reversal and
the eleven-column failure mode it created are all gone.

## Problem / Opportunity

1. **The format cannot express a phase.** A status is simultaneously the machine state, the display name and
   the column. Nine statuses over seven columns is not expressible.
2. **`DEFAULT_DEFS` holds four names.** It has to hold nine, and the seven columns they map onto.
3. **The pipeline will depend on names it does not own.** Seven writes per ticket, in subtopic 003, name
   statuses the user is currently free to rename.

## Proposed Solution

### The four new fields

| Field | Where | Optional | Fallback when absent |
|---|---|---|---|
| `column` | on a status | yes | the status's own `name` |
| `label` | on a status | yes | the status's own `name` |
| `columns` | top level, an array | yes | derived from the statuses, in `order` order |
| `hidden` | on a column | yes | `false` |

**All four stay optional, and the reason has changed.** In the first draft it was so an existing install
rendered as before. Now it is simpler: a definitions file is hand-edited, and a missing key must degrade to
something sensible rather than break the board.

**`order` narrows in meaning and gains none.** It stays a sort key and never a semantic — the existing ban
on reading `order: 2` as "in progress" is unchanged. What changes is what it sorts: a status's `order` sorts
it **within its column**, and a column's own `order` sorts the columns.

### `DEFAULT_DEFS` ships the whole shape

`backlog.sh`'s `DEFAULT_DEFS` grows from four statuses to nine, and gains the seven-column array. It is
written, as today, **only when the definitions file is absent, and only on a write.**

```
statuses:  open, refining, shaped, planning, planned, doing, in-review, done, dropped
columns:   backlog, shaping, planning, building, review, done, dropped(hidden)
```

`open`, `doing`, `done` and `dropped` keep the `name` they have. The five new names are `refining`,
`shaped`, `planning`, `planned` and `in-review`.

```
IF THE DEFINITIONS FILE ALREADY EXISTS:
  ⛔ DO NOT: Add a missing reserved status to it
  ⛔ DO NOT: Fill in an absent column, label or columns array
  ⛔ DO NOT: Write to it at all
  ✅ DO: Use it as written, and refuse a write carrying a status it does not define — today's behaviour
```

⛔ **`backlog.bats` L3.2 `DEFS_PRESERVED` is NOT touched.** It asserts a hand-edited definitions file
survives further writes byte-for-byte, and after this subtopic that is still exactly true. The first draft
of this design reversed it; keeping it is strictly better, and any implementation that needs it relaxed has
re-introduced the injection.

### "Reserved" is a contract, not a mechanism

The nine names are the pipeline's. The reference says so, and nothing enforces it in code.

| The pipeline owns | The user owns |
|---|---|
| the nine `name` values — documented, not enforced | `label`, `column`, `order` and `means` on every status |
| | every status they add themselves |
| | the `columns` array and each column's `label`, `order` and `hidden` |

**A user who renames a reserved status gets `REFUSED=unknown-status`, seven degraded lines across the
pipeline, and a board that does not move.** That is loud, it is the rule that already exists, and it is
their own edit. A fresh install never reaches it, because `DEFAULT_DEFS` defines all nine.

⛔ **No enforcement is added.** A script that refused to run on a renamed status, or put the name back,
would be taking a file the format calls the user's.

### `REFUSED=unknown-status` keeps its full meaning

It stays reachable for exactly what it always meant: a write carrying a status the loaded definitions do not
define. The `REFUSED=` name stays, L1.4 and L1.4b stay, L3.6 stays, and the reference keeps documenting it.
Subtopic 003's degradation table keeps its row and the row can still fire.

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Inject missing reserved statuses into an existing file** — this design's first draft | It buys nothing with no installed base, and costs `backlog.bats` L3.2 `DEFS_PRESERVED`, a delivered promise. It also introduced an eleven-column failure mode that took a field-by-field table to avoid |
| **A migration in `cli/src/migrations.js`** | Nothing to migrate |
| **Make the four fields required** | A hand-edited file missing one would break the board instead of degrading |
| **Enforce the reserved names in the script** | It would overwrite or refuse a file the format declares the user's, and no fresh install can reach the case |
| **Insert the five new statuses at a canonical `order`, renumbering** | Nothing to renumber — `DEFAULT_DEFS` is written whole |
| **Put the phase check in `backlog.sh`** | Phase logic in the script is transition logic in the script, which the umbrella bans. The script validates vocabulary membership; that is its whole job here |

## Type of Artefact

script + reference. No command, no skill body, no agent.

## Scope

### Includes

- `DEFAULT_DEFS` in `backlog.sh`: nine statuses with their `column`, `label` and `means`, plus the
  seven-column array with `dropped` carrying `hidden: true`.
- Reading the four new fields, each with its declared fallback, wherever the script already reads a status.
- `add-doc-schemas/references/backlog.md`: the four new fields and their fallbacks, the nine reserved names
  as a documented contract, what `order` sorts now, and which side owns which key.
- **`add-backlog/references/lifecycle.md` § The Status Names only** — the one section the nine names touch.
  The rest of that file is subtopic 003's, and `references/phases.md` is created there too.

⛔ **The nine names and the seven columns are declared in `backlog.md` as FORMAT — what a field may hold.**
What each phase MEANS belongs to `phases.md`, which subtopic 003 writes. Two documents, two questions:
`backlog.md` answers "is this a legal value", `phases.md` answers "what does it mean". A format reference
that also explains the pipeline's phases is a second owner of the model.
- `backlog.bats`: **additive assertions only** — the four fields and their fallbacks, and that
  `DEFAULT_DEFS` writes the canonical shape on a first write.

### Does NOT Include

- **Any write to a definitions file that already exists.** No injection, no fill-in, no rewrite.
- **Any change to `backlog.bats` L3.2 `DEFS_PRESERVED`, L3.2b, L3.6, L1.4 or L1.4b.**
- Any migration in `cli/src/migrations.js`.
- Any enforcement of the reserved names.
- Any command, any skill body, `add-plan-authoring`, or any write of a new status. Subtopics 002 and 003.
- Any change to `board/`. Subtopic 004 consumes the four fields; this subtopic only makes them exist.
- The `board` feature. Subtopic 002.
- Any change to `backlog-commit.sh`, `next-id.sh` or `status.sh`.
- Transition validation of any kind.
- Renaming `open`, `doing`, `done` or `dropped`.
- Any new `REFUSED=` name. The six stay six.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| `column`, `label`, `columns` and `hidden`, all optional with a declared fallback | the "phase is visible" half | A hand-edited file missing a key must degrade, not break the board | ✅ |
| `DEFAULT_DEFS` ships the canonical nine and seven; an existing file is never written | the "phase is visible" half | No installed base. Injection buys nothing and costs a delivered assertion | ✅ |
| `backlog.bats` L3.2 `DEFS_PRESERVED` stays exactly as it is | the "the board never breaks a project" half | It is still true after this subtopic. An implementation needing it relaxed has re-introduced the injection | ✅ |
| "Reserved" is documented, never enforced | the "every command writes its own phase" half | Enforcement would take a file the format calls the user's, and a fresh install cannot reach the case | ✅ |
| `open`, `doing`, `done` and `dropped` keep their `name` | the "the board never breaks a project" half | This repository's own board has tickets on all four, and `label` gives the display name for free | ✅ |
| `order` sorts within a column; columns sort by their own `order` | the "phase is visible" half | Keeps the existing ban on reading `order` as a meaning | ✅ |
| `REFUSED=unknown-status` keeps its full meaning and stays reachable | the "the board never stops a command" half | A renamed or invented status is still refused, and every assertion holding the vocabulary together stays | ✅ |
| This subtopic fixes `lifecycle.md` § The Status Names and nothing else in that file | the "one decision, one place" half | That section names the statuses; 002 sits between this and 003, and leaving it stale for two subtopics is how a reference drifts | ✅ |

## Ecosystem Impact

`Called by` is from `impact --depth 1`. No fragment injects into any artefact here — checked against all
eleven fragments in the tree, none touches the backlog.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `scripts/backlog.sh` | `add-backlog` (RUNS_SCRIPT) | `DEFAULT_DEFS` grows to nine statuses and seven columns; the four fields are read with fallbacks | required |
| `add-doc-schemas/references/backlog.md` | `add-backlog`, `add-doc-schemas` (USES_SKILL) | Four new fields, the nine names as a contract, what `order` sorts, who owns which key | required |
| `add-doc-schemas` | 22 artefacts (USES_SKILL) — every pipeline command, `plan-reviewer-agent`, 8 skills | Owns the reference. Nothing else it carries changes | required (reference only) |
| `add-backlog/references/lifecycle.md` | `add.brainstorm`, `add.build`, `add.done`, `add.new`, `add.plan`, `add-backlog` (USES_SKILL) | § The Status Names only | required |
| `add-backlog` | the same five commands (USES_SKILL) | Owns both references | required |
| `scripts/backlog-commit.sh` | `add-backlog` (RUNS_SCRIPT) | None. It wraps `backlog.sh` and nothing about the git route changes | none |
| `scripts/tests/backlog.bats` | not a node | Additive assertions. **No existing assertion is changed or removed** | required |
| `docs/backlog.definitions.json` | **NOT VERIFIED** (no graph node) — read directly: `backlog.sh` and `board/server.mjs` | **Untouched by this subtopic.** This repository's file already exists, so nothing writes it. Subtopic 003 hand-edits it | none |
| `board/server.mjs` | **NOT VERIFIED** (no graph node) — read directly: `readDefs()` maps to three keys and drops the rest | Tolerates the new fields, ignores them until 004. Verified, no edit | verify, no edit |
| `cli/src/migrations.js` | **NOT VERIFIED** (no graph node) | None. Nothing to migrate | none |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A format that can express a phase | Nothing. The compat cost the first draft paid is gone with the installed base |
| Nine names seven writes can depend on | The user's freedom to rename one without breaking their own board |
| Every existing `backlog.bats` assertion intact | — |

| Risk | Probability | Mitigation |
|---|---|---|
| **A builder re-introduces the injection**, because the reasoning for it is persuasive and it was in this design's first draft | **Medium. It is the main risk left** | The `IF THE DEFINITIONS FILE ALREADY EXISTS` block says it four ways, and L3.2 `DEFS_PRESERVED` standing unchanged is the check — any injection breaks it |
| `DEFAULT_DEFS` and the reference drift — two lists of nine names and seven columns | Medium | `L1.4b` already holds the emittable `REFUSED=` vocabulary equal to the documented one. The plan extends that pattern to the statuses rather than inventing a new check |
| `board/server.mjs` breaks on a field it does not know | Low — verified it maps three keys and drops the rest | Named as a verify step. 001 lands first and this repository's own board runs on it |
| This repository's own four-status file makes subtopic 003 or 004 look broken before its hand-edit lands | Low | `column` falls back to the status `name`, so the board renders four columns exactly as today until 003 edits the file |
| A user renames a reserved status and gets a board that never moves | Low | Seven reported lines, one per write. Loud, and it is their own edit |

## Next Steps

Run: `/add-framework--plan [idea]`
