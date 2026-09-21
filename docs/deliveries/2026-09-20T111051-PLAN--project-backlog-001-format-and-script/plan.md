# Plan: Project Backlog 001 — the ticket format and the script that owns it

> **Status:** implemented
> **Layers:** product
> **Type:** script
> **Created:** 2026-09-20
> **Delivery:** automatic

---

## Objective

Today a user of the framework has nowhere to record "what to do next" inside their own project. The
idea dies in the chat, or it becomes a full plan far too early. When this is done, a **skill** writes
that intent into a file in the user's repository — with real paths and a check someone can actually
run — so that it still means something weeks later. The internal equivalent is renamed to
`add-framework--backlog` so both names match.

This plan is subtopic 001 of that set. It serves the objective by building the durable place — the
file format and the script that owns it — so that everything after it has somewhere to write and one
definition of what a ticket is.

**When this build is done:** a user's project can hold a prioritised board of tickets that a script
reads, writes and validates; a ticket id comes from the same global counter every other work item
uses, through both allocators, with a test holding them equal; and the record format is declared in
one reference that the script implements rather than extends.

## Context

The framework has a pipeline for work that is about to start and an index of work that is finished.
It has nothing for work that is decided but not started. The internal layer solved this for itself in
September 2026 with `add-framework--roadmap`; the product layer never got it.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md` | The board's shape, the skill-not-command decision, the JSONL-over-JSON argument, the four-subtopic decomposition and its dependency chain |
| `docs/brainstorming/2026-09-20T104517-project-backlog-001-format-and-script.md` | The ticket field table, the definitions file and its default, the seven modes and their input mechanism, the measured `next-id.sh`/`status.sh` divergence, and the grep-not-JSON allocator decision |
| `docs/brainstorming/2026-09-20T104517-project-backlog-001-format-and-script-intent.md` | The classified path (`architectural`), `delivery: automatic`, the closed decisions, the separate-worktree delivery constraint, and `## Open: None` |

## Global Constraints

- Built in a **separate git worktree**, not in the primary checkout (intent file, Delivery constraint).
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline).
- No product artefact contains the string `add-framework--` (the build-time test established by
  `2026-09-16T205633-PLAN--product-pipeline-parity`).
- Scripts are referenced by the literal path `.codeadd/scripts/`, never through `{{cmd:}}` or
  `{{skill:}}` (`add-resource-path-convention`, Scripts).
- Shipped scripts carry their own usage and exit codes in their header (CLAUDE.md, Key files).
- `docs/backlog.definitions.json` is created when absent and **never rewritten** thereafter.
- `docs/backlog.jsonl` is written UTF-8 with **LF** endings; no atomic write, matching every other
  JSONL writer in `framwork/.codeadd/scripts/`.

## Problem

1. **No durable place** — a decision made mid-build survives only as long as the session.
2. **Two id allocators that already disagree** — `next-id.sh` accepts any `^[A-Z]$`;
   `status.sh next-id` reimplements the same scan behind a hard allowlist `F|H|PRD|CHG` and exits 2
   on anything else. The comment in `status.sh` claims they are one source of truth. Nothing tests it.
3. **No agreement on what a ticket is** — without a declared record, each later subtopic invents one.

## Proposal

One shipped script owning two files, with the record format declared outside it. The work sequences
in four phases: the id counter first, because it is the only phase that touches existing artefacts
and the only one that can break a third-party command; then the format; then the script that
implements it; with the test suite written RED ahead of every F-block rather than at the end.

## Current State

| Artefact | What it does today | Direct dependants (depth 1) |
|---|---|---|
| `next-id.sh` | Scans `docs/features/[0-9]{4}[A-Z]-*/`, takes max+1, stamps any `^[A-Z]$` letter | 1 in the graph (`add-id-convention`); `init.sh` shells out to it, which produces no edge |
| `status.sh` `next-id` | Reimplements the same scan; allowlist `F\|H\|PRD\|CHG`, exit 2 otherwise | 19 on the script as a whole |
| `add-id-convention` | Declares the `[NNNN][L]` format and the F/H/R/C/D/P/T suffix table; declares `RUNS_SCRIPT` to both allocators | 8 |
| `add-doc-schemas` | Owns every document schema and the `references/` table | 21 |
| `delivered.sh` | The structural model: mode dispatch, stdin record, `KEY=VALUE` output, exits 0/1/2 | — |

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/tests/backlog.bats`: create the suite with every
  assertion for F2–F8, all failing against the current tree. Discovered by `scripts/run-bats.js`
  through its fixed glob, so no registration is needed. Opens with a header block restating the
  contract under test, the way `tests/delivered.bats` does. It must NOT be written after the
  implementation — a test written after the fix proves nothing.
  - **Produces:** `backlog.bats` asserts `NEXT_ID_AGREE`, `DEFS_PRESERVED`, `LINES_BYTE_STABLE`

- **F2** [product] — `framwork/.codeadd/scripts/next-id.sh`: greps `docs/backlog.jsonl` for
  `[0-9]{4}[A-Z]` in addition to scanning `docs/features/`, and folds both into the one max. Must NOT
  parse JSON and must NOT gain a `node` dependency — the existing `grep -oE '[0-9]{4}[A-Z]'` over the
  raw file returns the same thing. Must be a no-op when the file is absent. Ref: design,
  Key Decisions, the allocator row.
  - **Produces:** `next-id.sh <L>` counts backlog ids
  - **Consumes:** `NEXT_ID_AGREE` (F1)

- **F3** [product] — `framwork/.codeadd/scripts/status.sh`: the `next-id` subcommand only — `B` joins
  the allowlist, and the same grep over `docs/backlog.jsonl` joins the scan. Must NOT lose the
  allowlist: anything outside `F|H|PRD|CHG|B` still exits 2. **No other part of `status.sh` is
  touched, and no `BACKLOG_OPEN:` line is added.**
  - **Consumes:** `next-id.sh <L>` counts backlog ids (F2), `NEXT_ID_AGREE` (F1)

- **F4** [product] — `framwork/.codeadd/skills/add-id-convention/SKILL.md`: `B` joins the letter
  suffix table, with one line saying a ticket is not a branch and takes no branch of its own. Adds the
  rule that both allocators must agree and that `backlog.bats` is what holds them. Must NOT lose the
  existing seven letters or the branch-format section. Ref: design, Ecosystem Impact.

- **F5** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`: the record
  format. Opens by disclaiming the doc-schema conventions the way `delivery-index.md` does, then: the
  two files, the ticket record with one example line and the thirteen-field table, the definitions
  file and its shipped default, the statuses table with the note that `order` is the `list` sort and
  NOT the priority, the hard bans each testable, the `REFUSED=` vocabulary, and the exit codes. Ref:
  design, `docs/backlog.jsonl` and `docs/backlog.definitions.json`.
  - **Produces:** `references/backlog.md` declares the record and the `REFUSED=` names

- **F6** [product] — `framwork/.codeadd/skills/add-doc-schemas/SKILL.md`: one row in the reference
  table pointing at `references/backlog.md`. Additive only — no existing row changes.
  - **Consumes:** `references/backlog.md` declares the record and the `REFUSED=` names (F5)

- **F7** [product] — `framwork/.codeadd/scripts/backlog.sh`: the script. `set -u` never `-e`; `node`
  checked first as a hard dependency with `ERROR=node-missing` and exit 2; mode dispatch by `case` on
  `$1`; `KEY=VALUE` lines then raw JSONL entries. Modes `add`, `update`, `comment`, `move`, `remove`,
  `list`, `search`. The first three take the record as JSON on stdin; the rest take their id or query
  positionally. Creates `docs/backlog.definitions.json` when absent with the shipped default and
  **never rewrites it**, with that rule restated in its own header. Refuses an undefined status on a
  write; reports — never refuses — a status the definitions no longer define. Reports a damaged line
  by number and continues. Exits 0 for probe results including an absent backlog, 1 only when the
  filesystem refuses a write, 2 for caller error. **This script writes files and never commits** — the
  git route belongs to 002.
  - **Consumes:** `references/backlog.md` declares the record and the `REFUSED=` names (F5),
    `DEFS_PRESERVED` (F1), `LINES_BYTE_STABLE` (F1)

- **F8** [product] — `framwork/.codeadd/scripts/backlog.sh`: the reordering half — `move <id>
  --top | --after <id> | --bottom`, the only mode that rewrites the file. Split from F7 because it is
  the one operation whose correctness is about the whole file rather than one line, and it is what
  `LINES_BYTE_STABLE` exists to bound.
  - **Consumes:** `LINES_BYTE_STABLE` (F1)

### Does NOT Include (important!)

- The `add-backlog` skill. Subtopic 002. This plan ships a script with no caller yet, deliberately.
- Any hook in `add.brainstorm`, `add.new`, `add.plan`, `add.build` or `add.done`. Subtopic 003.
- The git route to the base branch and the temporary worktree. Subtopic 002 — that is the **skill's**
  behaviour, and this script never commits.
- The internal rename `add-framework--roadmap` → `add-framework--backlog`. Subtopic 004.
- Atomic writes. No JSONL writer here does one; diverging alone would be a decision without a reason.
- A `BACKLOG_OPEN:` report line in `status.sh`. Nothing consumes it yet, so the line would be chosen
  before a consumer exists.
- A row in `add-ecosystem`'s Dependency Index. The script has no caller until 002, so the row would be
  empty; `/add-framework--sync` writes it.
- A registry for `theme`. A theme exists because a ticket names it.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Command or skill? | Skill (002); this subtopic ships only the script | Capture happens mid-flow inside another command's run. Umbrella, Key Decisions |
| JSONL or a JSON array? | JSONL, line order is the priority | One-ticket edit is a one-line diff, mechanically checkable. Umbrella, Alternatives |
| Where does a new ticket land? | Appended at the end; only `move` reorders | Separates the frequent cheap write from the rare expensive one. Design, Key Decisions |
| Ticket id form? | `[NNNN][L]` with letter `B`, from the shared counter | User's choice over a separate `B0001` namespace. Design, Key Decisions |
| Which allocators change? | **Both** `next-id.sh` and `status.sh next-id` | Measured: `status.sh` reimplements the scan and already diverges. Design, Discovery |
| Does the allocator parse JSON? | No — grep `[0-9]{4}[A-Z]` on the raw text | Keeps both scripts pure bash, and a damaged line still yields its id. Design, Key Decisions |
| How does a record get in? | JSON on stdin for `add`/`update`/`comment` | Seven fields, one an array, do not fit flags. `delivered.sh write` is the precedent. Design |
| What happens to an undefined status? | Refused on write; reported on read | Enforced or it is decoration; refusing to read locks a user out of their own board. Design |
| Where does the schema live? | `add-doc-schemas/references/backlog.md` | The script implements the reference, it does not extend it. `delivered.sh` header |
| Is `docs/backlog.definitions.json` ever rewritten? | No — created when absent only | It holds user customisation, and `docs/` is never touched by the installer. Umbrella, Key Decisions |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| One definition of a ticket, enforced by one script | A second file to keep consistent with the first |
| A cheap append for the frequent operation | The queue is unordered until someone reorders it |
| A single global id counter that stays single | A change to `status.sh`, the highest fan-in script here |
| A status vocabulary belonging to the user | A validation path, and a degraded-but-readable state after a bad edit |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| `next-id.sh` and `status.sh next-id` drift again | **High** — already drifted today | F1's `NEXT_ID_AGREE`, asserted at L2.1 and L2.2: both allocators return the same id for the same tree, with a backlog present and with none |
| A project with no `docs/backlog.jsonl` gets a changed id | Medium | L2.2 asserts allocation is byte-identical against a tree with no backlog. F2 and F3 both state the no-op requirement |
| `status.sh next-id` loses its allowlist while gaining `B` | Medium | L1.3 asserts an unknown prefix still exits 2. Named in F3 as what must not be lost |
| A hand-edited `backlog.jsonl` line stops parsing | Medium | L3.4: reported by line number, the rest still answers. F7 |
| `docs/backlog.definitions.json` gets rewritten | Medium | F1's `DEFS_PRESERVED`, asserted at L3.2: run twice against an edited file, the edit survives byte-for-byte |
| An `update` silently rewrites lines it should not touch | Medium | F1's `LINES_BYTE_STABLE`, asserted at L3.3 and L3.5: every line but the target is byte-identical after `update`, `comment` and `remove` |
| The reference and the script disagree about the record | Medium | F5 lands before F7, and F7's `Consumes` names it. L1.4 asserts every `REFUSED=` name the script can emit appears in the reference |
| A `move` corrupts the file | Low | L3.5: after any `move`, the multiset of lines is unchanged and only the order differs. F8 |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/scripts/tests/backlog.bats` | product | create | The RED suite for every level (F1) |
| `framwork/.codeadd/scripts/next-id.sh` | product | modify | The `B` counter reaches the backlog (F2) |
| `framwork/.codeadd/scripts/status.sh` | product | modify | `next-id` subcommand only: allowlist and scan (F3) |
| `framwork/.codeadd/skills/add-id-convention/SKILL.md` | product | modify | The `B` letter and the two-allocator rule (F4) |
| `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md` | product | create | The record format (F5) |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | One reference-table row (F6) |
| `framwork/.codeadd/scripts/backlog.sh` | product | create | The script and its six non-reordering modes (F7), then `move` (F8) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 writes every level below BEFORE any other F-block lands, and each is
verified failing against the current tree. Then F2–F8 drive them GREEN.

### L1 — Unit / script-side (RED → GREEN)

1. `bash next-id.sh B` returns an id whose number exceeds every `[0-9]{4}[A-Z]` in
   `docs/features/` **and** in `docs/backlog.jsonl`. *RED today: `next-id.sh` never opens the backlog.*
2. `bash status.sh next-id B` exits 0 and returns an id. *RED today: the allowlist rejects `B` and
   exits 2.*
3. `bash status.sh next-id Z` still exits 2. *RED today: passes already — this is the regression
   guard for F3, and it must be shown passing before and after.*
4. Every `REFUSED=<name>` string `backlog.sh` can emit appears in `references/backlog.md`.
   *RED today: neither file exists.*
5. `backlog.sh` contains no `set -e` and checks `node` before any file I/O. *RED today: no script.*

### L2 — Integration: the two allocators agree

1. **`NEXT_ID_AGREE`, with a backlog present** — for a tree holding both `docs/features/` entries and
   `docs/backlog.jsonl` entries, `next-id.sh <L>` and `status.sh next-id <L>` return the **same
   string**, for each of `F`, `H` and `B`. *RED today: they diverge, and `B` exits 2 on one of them.*
2. **`NEXT_ID_AGREE`, with no backlog** — same equality against a tree with no `docs/backlog.jsonl`,
   and the returned id is byte-identical to what each script returns today. *RED today: not asserted
   anywhere, which is how they drifted.*
3. A `docs/backlog.jsonl` whose JSON is damaged on one line still contributes that line's id to the
   max. *RED today: no backlog is read at all.*

### L3 — Behavioural acceptance

1. `add` on an absent `docs/backlog.jsonl` creates it, writes one line, and creates
   `docs/backlog.definitions.json` with the shipped four statuses.
2. **`DEFS_PRESERVED`** — with `docs/backlog.definitions.json` edited by hand (a status renamed, a
   fifth added), two further `add` calls leave that file **byte-identical**.
3. **`LINES_BYTE_STABLE`** — after `update <id>` and after `comment <id>`, every line except the
   target is byte-identical, and the file's line count is unchanged.
4. A hand-damaged line is reported by its line number on `list`, exit stays 0, and every other ticket
   is returned.
5. **`LINES_BYTE_STABLE` under `move`** — after `move <id> --top`, the multiset of lines is unchanged,
   only their order differs, and the target is line 1. After `remove <id>`, exactly one line is gone
   and every survivor is byte-identical.
6. A write carrying a status absent from the definitions exits 2 with `REFUSED=unknown-status`, and
   the file is unchanged.
7. A `list` over a backlog holding a status the definitions no longer define exits 0, returns every
   ticket, and reports the undefined status as a key.
8. `list` and `search` on an absent backlog exit 0 and report an empty result — an absent index is a
   result, not a failure.
9. Written files use LF endings and contain no CR byte.

### L4 — Build and packaging

1. `node scripts/build.js` exits 0 and emits no new warning.
2. `backlog.sh` reaches all five provider output directories, and `references/backlog.md` reaches
   every provider carrying `add-doc-schemas`.
3. No product artefact written by this plan contains the string `add-framework--`.
4. `npm run test:scripts` discovers and runs `backlog.bats` with no registration change.

**RED expectations against the current tree:** L1.1, L1.2, L1.4, L1.5, every level of L2 and every
level of L3 fail today — three artefacts do not exist and two allocators ignore the backlog. L1.3 and
L4.1 pass today and are regression guards; they must be shown passing before F2 lands and again after
F8.
**GREEN = all levels pass after F1–F8.**

---

## Execution Order

1. **F1 first** — the suite, RED, before any implementation. Nothing else may land until every level
   above is on disk and failing for the stated reason.
2. **F2, then F3** — `next-id.sh` before `status.sh`, because L2.1 compares the two and the comparison
   is only meaningful once one side is correct. After F3 the repository is in a working state.
3. **F4** — the convention skill, once the behaviour it documents exists.
4. **F5, then F6** — the reference before the row that points at it. After F6 the repository is in a
   working state.
5. **F7** — the script, which `Consumes` F5's reference. It cannot be written against a record that is
   still open.
6. **F8** — `move`, last, because it is the only whole-file operation and `LINES_BYTE_STABLE` bounds
   it against the state F7 established.

**Working-state boundaries:** after F3, after F6, and after F8. A build that must stop should stop at
one of those three.

**Per-F-block validation beyond the layer default:** F2 and F3 each run L2.2 (the no-backlog
regression) in addition to their own level, because that is the assertion that protects every existing
caller of `status.sh next-id`.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves
   nothing. L1.3 and L4.1 are the two that pass today; every other level must be shown failing first.
2. **F3 touching `status.sh` outside `next-id`.** Nineteen artefacts depend on that script. The diff
   for F3 must be confined to the `next-id` block, and the reviewer should read the whole diff rather
   than the summary.
3. **F2 or F3 gaining a `node` dependency.** Both are pure bash today. A JSON parse smuggled in here
   is invisible until a machine without node runs `/add.new`.
4. **A `Consumes` string that does not match its `Produces` byte-for-byte.** F7 consumes F5's
   reference name and two of F1's assertion names.
5. **`docs/backlog.definitions.json` being written more than once.** L3.2 catches it only if the
   fixture edits the file between calls; a suite that recreates it each time proves nothing.

## References

- Design set: `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md`,
  `docs/brainstorming/2026-09-20T104517-project-backlog-001-format-and-script.md`
- Intent: `docs/brainstorming/2026-09-20T104517-project-backlog-001-format-and-script-intent.md`
- Prior art: `2026-09-14T145149-PLAN--the-impact-question-which-deliveries-touched-this-file` —
  established `delivered.sh`'s mode dispatch, its stdin record and the `delivery-index.md` reference
  shape this plan copies.
- Prior art: `2026-09-11T014333-PLAN--product-close-out-parity` — established that the product layer
  must not borrow an internal `docs/` path shape.
- Prior art: `2026-09-10T230600-PLAN--fast-local-bats` — established how `scripts/run-bats.js`
  discovers a new suite.

---

## Next Steps

/add-framework--build project-backlog-001-format-and-script

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-20 | Initial creation |
| 2026-09-20 | Implemented. F1 cafd823, F2 6675083, F3 ce28207, F4 9ac4b5b, F5 fcc3c5f, F6 2380cd0, F7 16a42ad + 1b9c37a, F8 a6ecc4c, review finding 686c8d4. The review pass found no high-severity finding; the one applied was ruler item 5, single owner, on the grep-not-parse rule |
| 2026-09-20 | F3 also fixed a live pre-existing bug the plan did not anticipate: both allocators matched the whole find path rather than the directory basename, so `0001F-auth-2024` made `status.sh next-id` return `2025F`. L2.1b was added to pin it |
