# Brainstorm: Project Backlog 001 — the format and the script

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-20
> **Type:** script + schema reference (product layer)
> **Umbrella:** `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md`

## Objective

Today a user of the framework has nowhere to record "what to do next" inside their own project. The
idea dies in the chat, or it becomes a full plan far too early. When this is done, a **skill** writes
that intent into a file in the user's repository — with real paths and a check someone can actually
run — so that it still means something weeks later. The internal equivalent is renamed to
`add-framework--backlog` so both names match.

**Serves the objective by** building the durable place — the file format and the script that owns it —
so that everything after it has somewhere to write and one definition of what a ticket is.

## Discovery

- **`framwork/.codeadd/scripts/delivered.sh`** — the structural model, read in full. `set -u` only,
  **never `-e`**, because `-e` turns a probe result into an exit code. Mode dispatch is a `case` on
  `$1`, with per-mode argument parsing before any file I/O. `node` is a hard dependency checked
  first, declared in the header, because bash has no safe JSON primitive. Output is strict
  `KEY=VALUE` lines followed by raw JSONL entries, never mixed shapes. Exit **0** for every probe
  result including an absent index, **1** only when the filesystem refuses a write, **2** for caller
  error — a bad mode, bad arguments, a hard-ban violation as `REFUSED=<name>`, or `ERROR=node-missing`.
- **`add-doc-schemas/references/delivery-index.md`** — the template `references/backlog.md` follows.
  It opens by explicitly disclaiming the doc-schema conventions ("no frontmatter template, no `id:`,
  no TL;DR, no depth floors, no Decision Log — none of those apply to a log a script appends to"),
  then: the file, the record with one example line and a field table, the statuses as a table with an
  ordering note, the scoping rule, numbered hard bans each testable, the `REFUSED=` vocabulary as a
  name→ban→trigger table, and the exit codes.
- **`build-ledger.sh` and `task-brief.sh`** — the two existing "create when absent, never rewritten"
  precedents. `build-ledger.sh` writes an identity header once and ignores later arguments for that
  identity; `task-brief.sh` writes a `.gitignore` "only when absent — a project that edited it owns
  it". Neither points at a shared convention: **each restates the rule locally**, so this design does
  the same.
- **`add-setup-contract`** — the other "never silently overwrite a user-edited JSON" convention:
  `docs/qa/config.json` is merged per key and drift is reported, not overwritten.
- **`framwork/.codeadd/scripts/tests/*.bats`** — where a script's suite lives. `scripts/run-bats.js`
  discovers suites through one fixed glob shared by the native and containerised runners, so a new
  suite needs no registration. `tests/delivered.bats` opens with a header block restating the
  contract under test, so the file is self-documenting.
- **`qa-evidence.sh`** — the only script using `mktemp` + `mv`, and only for `.gitignore` and
  directory promotion. **No JSONL writer in this repository does an atomic write.**
- **`next-id.sh` and `status.sh next-id` — measured, and they already disagree.** `next-id.sh` accepts
  any `^[A-Z]$` and scans `docs/features/[0-9]{4}[A-Z]-*/`. `status.sh next-id` **reimplements the
  same scan** under a comment claiming "Same source of truth as next-id.sh for consistency", but
  carries a hard allowlist `F|H|PRD|CHG` and exits 2 on anything else. Every command allocates through
  `status.sh next-id`; only `init.sh` calls `next-id.sh` directly.
- **Delivery index** — `history delivered.sh` returns one `live` entry (2026-09-14, the
  impact-question plan). `history add-doc-schemas` returns three `live` entries. `history log-jsonl.sh`
  and `history status.sh` return nothing recorded. Nothing under `backlog` or `roadmap` resolves in
  the product layer at all: no prior attempt, nothing dropped.

## Context & Motivation

The umbrella settled what the board is. This subtopic settles what a ticket *is* — as a record a
script can write, read and validate — and builds the one thing that owns it.

Three things in this design have no precedent in the repository, and each is called out where it
lands:

1. **No shipped script owns two cooperating files.** `delivered.sh`, `build-ledger.sh` and
   `task-brief.sh` each own exactly one.
2. **No JSONL here treats line order as a mutable priority.** `delivered.jsonl`, the ledgers and the
   iteration logs all treat line order as chronology. Reordering as a write operation is new.
3. **No script validates values in a log against a vocabulary declared in a sibling file.**
   `delivered.sh`'s four statuses are hardcoded inside it.

## Problem / Opportunity

Without this subtopic there is no file to write to and no agreement on what a ticket contains. Every
later subtopic would invent its own answer, and the three novelties above would each be decided
three times.

## Proposed Solution

One shipped script, `framwork/.codeadd/scripts/backlog.sh`, owning two files in the user's project,
with the record format declared outside it in `add-doc-schemas/references/backlog.md`.

### `docs/backlog.jsonl`

One JSON object per line, UTF-8, **LF always** — no CRLF conversion, matching every other JSONL writer
here. **Line order is the priority**: the first line is the highest.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `[NNNN][L]` with letter `B`, e.g. `0007B`. Allocated from the shared counter — see below. Never reused |
| `title` | string | One line |
| `theme` | string | Free grouping label. No registry: a theme exists because a ticket names it |
| `tldr` | string | One line, plain language — what this delivers, not how |
| `notes` | string[] | The body bullets |
| `done_when` | string | A check someone can actually run |
| `paths` | string[] | Real paths from the bounded project check. Empty when the ticket is ungrounded |
| `grounded` | boolean | Whether the bounded check found real things, or the ticket was recorded as stated |
| `status` | string | Must be defined in `docs/backlog.definitions.json` |
| `created_at` | string | ISO 8601 UTC |
| `updated_at` | string | ISO 8601 UTC |
| `comments` | object[] | `[{content, created_at}]`, append-only |
| `work_id` | string \| null | The `[NNNN][L]` of the work this ticket became, once it has one. Filled by 003 |

### `docs/backlog.definitions.json`

The status vocabulary. **Created when absent, never rewritten** — the rule is restated in the script's
own header, the way `build-ledger.sh` and `task-brief.sh` each restate theirs, because no shared
convention document exists to point at.

Shipped default:

```json
{
  "statuses": [
    { "name": "open",    "order": 1, "means": "decided, not started" },
    { "name": "doing",   "order": 2, "means": "work is in progress" },
    { "name": "done",    "order": 3, "means": "delivered" },
    { "name": "dropped", "order": 4, "means": "decided against" }
  ]
}
```

`order` is the sort order `list` groups by. It is not the ticket's priority — that is line order in
the JSONL, and the two must not be confused.

### `backlog.sh` modes

| Mode | Writes | Notes |
|---|---|---|
| `add` | appends one line at the **end** | Pure append. A new ticket is lowest priority until someone moves it |
| `update <id>` | rewrites that one line | Every other line byte-identical afterwards |
| `comment <id>` | rewrites that one line | Appends to `comments` |
| `move <id> --top` \| `--after <id>` \| `--bottom` | rewrites the file | The only mode that reorders |
| `remove <id>` | deletes that one line | No renumbering — ids are stable and never reused |
| `list` | nothing | `KEY=VALUE` keys then JSONL entries, open tickets by default |
| `search <query>` | nothing | Same output contract as `list` |

**How a record gets in.** `add`, `update` and `comment` take the record as **JSON on stdin**, exactly
as `delivered.sh write < record.json` does — the model this design already names. Seven fields, one of
them an array, do not fit flags. `move`, `remove`, `list` and `search` take their id or query
positionally, because each takes one scalar.

## Type of Artefact

script (new), reference under an existing skill (new), and two existing scripts changed.

## Scope

### Includes

- `framwork/.codeadd/scripts/backlog.sh` and `framwork/.codeadd/scripts/tests/backlog.bats`.
- `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`, and its row in the skill's
  reference table.
- The `B` letter reaching the shared id counter: **both** `next-id.sh` and `status.sh next-id`.
- The definitions file, its shipped default and its create-when-absent rule.

### Does NOT Include

- The `add-backlog` skill. That is 002 — this subtopic ships a script with no caller yet.
- Any change to how commands behave. That is 003.
- A `BACKLOG_OPEN:` line in `status.sh`'s report. Decided against for this subtopic: nothing consumes
  it yet, and the line would be chosen before a consumer exists. Only the `next-id` subcommand is
  touched.
- The git route to the base branch, including the worktree. The **skill** owns that, in 002. This
  script writes files and never commits.
- Atomic writes. No JSONL writer here does one, and diverging alone would be a decision without a
  reason.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| `add` is a **pure append at the end**; only `move` reorders | the "cheap to write to" part of the durable place | It separates the frequent cheap operation from the rare expensive one. Deciding priority at capture time is exactly what a mid-flow capture has no context to do | ✅ |
| Every write that is not `move` leaves all other lines **byte-identical** | the "durable place" part | This is the testable form of the umbrella's one-line-diff argument, and `backlog.bats` asserts it directly rather than trusting it | ✅ |
| Ticket ids are `[NNNN][L]` with letter **`B`**, from the **shared** counter | the "durable place" part | The user chose the shared convention over a separate `B0001` namespace. Measured consequence: `next-id.sh` scans only `docs/features/`, so without a change `0007B` and `0007F` would coexist and the single-counter promise would break for `B` alone | ✅ |
| **Both** `next-id.sh` and `status.sh next-id` are changed, and `backlog.bats` asserts they agree | the "durable place" part | Measured: `status.sh next-id` reimplements the scan rather than calling `next-id.sh`, and already diverges — it allows only `F\|H\|PRD\|CHG` and exits 2 on `B`. Two implementations of one counter is the "anything two files must keep equal" blind spot `add-artefact-graph` names; only a test holds them together | ✅ |
| `status.sh` is touched **only** in its `next-id` subcommand | the "durable place" part | It is the highest fan-in script in the graph. The `next-id` change is forced by the id decision; a report line is not, and is excluded above | ✅ |
| `set -u`, **never `-e`**; node checked first as a hard dependency | the "durable place" part | Copied from `delivered.sh` with its reason: `-e` turns a probe result into an exit code, and bash has no safe JSON primitive | ✅ |
| Exit 0 for probe results, 1 only on a refused write, 2 for caller error with `REFUSED=<name>` | the "durable place" part | The same discipline every other probe here follows. An absent backlog is a result, not a failure | ✅ |
| `docs/backlog.definitions.json` is created when absent and **never rewritten**, with the rule restated in the script header | the "durable place" part | It holds user customisation. `build-ledger.sh` and `task-brief.sh` each restate their own version of this rule locally because no shared convention document exists; inventing one here would be a second deliverable | ✅ |
| An unknown status on a **write** is refused; a status in the log that the definitions no longer define is **reported by `list`**, not refused | the "work comes back out" part | The definitions file is enforced or it is decoration. But refusing to read would lock a user out of their own board over a config edit they are allowed to make | ✅ |
| The allocator **greps the raw file**, it never parses JSON — no `node` in `next-id.sh` or `status.sh` | the "durable place" part | Both are pure bash today and gain no dependency. `next-id.sh` already extracts ids from directory names with `grep -oE '[0-9]{4}[A-Z]'`; the same grep over `docs/backlog.jsonl` returns the same thing. It also removes the damaged-line question: a line whose JSON is broken still carries its id as text, so it is still counted. **Refusing to allocate because a backlog line is damaged would block `/add.new` entirely** — a far worse failure than the one it would be guarding against, and the only way an id could be reused is damage that destroyed the id itself | ✅ |
| `theme` has no registry | the "cheap to write to" part | A second vocabulary file to maintain, for a grouping label. A theme exists because a ticket names it | ✅ |
| LF always, no atomic write | the "durable place" part | Matches `delivered.sh`, `log-jsonl.sh` and `build-ledger.sh`. Only `qa-evidence.sh` uses `mktemp`+`mv`, and not for a JSONL | ✅ |
| A damaged line is **reported by number and skipped**; the rest still answers | the "durable place" part | The way `delivered.sh read` tolerates a damaged index. A hand-edited file is expected, not an anomaly | ✅ |
| `references/backlog.md` opens by disclaiming the doc-schema conventions | the "durable place" part | `delivery-index.md` opens the same way, for the same reason: this is a log a script appends to, not a document | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|---|---|---|---|
| `backlog.sh` (new) | nothing yet — `add-backlog` in 002 is its first caller | n/a | create |
| `tests/backlog.bats` (new) | `scripts/run-bats.js`, through its fixed glob — no registration needed | n/a | create |
| `add-doc-schemas/references/backlog.md` (new) | `add-doc-schemas` | n/a | create, add the row to the skill's reference table |
| `add-doc-schemas` | 21 direct dependants (listed in the umbrella) | additive only — one new reference file and one table row | edit |
| `next-id.sh` | **graph:** 1 dependant, `add-id-convention` (RUNS_SCRIPT). **Graph blind spot, found by grep:** `init.sh` shells out to it directly, which produces no edge | greps `docs/backlog.jsonl` for `[0-9]{4}[A-Z]` in addition to scanning `docs/features/`. No JSON parsing, no new `node` dependency | edit |
| `status.sh` | **graph:** the broadest `RUNS_SCRIPT` fan-in in the repository. **By grep, `status.sh next-id` specifically:** `add.done`, `add.hotfix`, `add.new`, `add.pull-request`, and `add.brainstorm` which names it to forbid it | `next-id` allows `B` and greps the backlog too, by the same method, staying pure bash | edit — `next-id` subcommand only |
| `add-id-convention` | `add.build`, `add.done`, `add.hotfix`, `add.new`, `add.plan`, `add.pull-request`, `add-doc-schemas`, `add-qa` | the `B` letter joins the suffix table | edit |
| `init.sh` | not reached by a `RUNS_SCRIPT` edge; calls `next-id.sh` directly | none — it requests `F` and is unaffected | verify, no change |
| `log-jsonl.sh` | zero dependants | none — `backlog.sh` writes its own lines | none |

**What the graph cannot see here, and was checked by hand:**

- **Script-to-script shell calls produce no edge.** The graph reports one dependant for `next-id.sh`;
  grep found `init.sh` calling it and five commands calling `status.sh next-id`. The `Called by`
  column above separates what the graph answered from what grep found, and says which is which.
- **`cli/tests/` and `framwork/.codeadd/scripts/tests/` are not nodes.** The build-time test asserting
  zero `add-framework--` strings in product artefacts binds everything written here.
- **`next-id.sh` and `status.sh next-id` must stay equal and nothing records that.** This is the
  standing blind spot `add-artefact-graph` names; `backlog.bats` is the only thing that will hold
  them together.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| One definition of a ticket, in one reference, enforced by one script | A second file to keep consistent with the first |
| A cheap append for the frequent operation, with reordering isolated in one mode | The queue is unordered until someone reorders it |
| A single global id counter that stays single | A change to `status.sh`, the highest fan-in script here, and a second implementation to keep equal |
| A status vocabulary that belongs to the user | A validation path, and a degraded-but-readable state when the user edits it badly |

| Risk | Probability | Mitigation |
|---|---|---|
| `next-id.sh` and `status.sh next-id` drift again after this change | **High** — they are already drifted today | `backlog.bats` asserts both allocators return the same id for the same tree, including with a backlog present and with none. This is the only gate; it is named here so the plan cannot treat it as optional |
| A project with no `docs/backlog.jsonl` gets a changed id from `status.sh next-id` | Med | The scan must be a no-op on an absent file. `backlog.bats` asserts the allocation is unchanged against a tree with no backlog |
| `status.sh next-id` gains a fifth prefix and an existing caller passes something new by accident | Low | The allowlist stays an allowlist: `F\|H\|PRD\|CHG\|B`, and anything else still exits 2 |
| A user hand-edits `backlog.jsonl` and a line stops parsing | Med | Reported by line number and skipped; the rest still answers. Asserted in bats |
| `docs/backlog.definitions.json` is rewritten by some later change | Med | The rule is in the script header and asserted in bats: run twice against an edited file, the edit survives |
| The two-file coordination has no precedent and grows a third file later | Low | The definitions file holds vocabulary only. Anything that is per-ticket data belongs on the ticket line |

## Next Steps

Run: `/add-framework--plan project backlog 001 format and script`
