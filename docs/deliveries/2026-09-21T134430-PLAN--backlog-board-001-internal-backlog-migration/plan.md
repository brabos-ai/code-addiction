# Plan: Internal backlog migration — this repository's board moves onto the product backlog format

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
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

**When this build is done:** this repository's backlog lives in `docs/backlog.jsonl` +
`docs/backlog.definitions.json`, written only by `backlog.sh`; the product format carries an optional
`labels` field that holds the internal layer; and `/add-framework--backlog` reads and writes through the
product scripts instead of editing markdown by hand. Subtopics 002–004 are separate plans.

## Context

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-21T112103-backlog-board-001-internal-backlog-migration.md` | The `labels` contract, the migration mapping (fields, `paths`/`grounded` rule, order 1.4 → 1.2 → 2.1 → 3.1), the command rewrite, the supersession of design-004 |
| `docs/brainstorming/2026-09-21T112103-backlog-board-001-internal-backlog-migration-intent.md` | Path `architectural`, `delivery: automatic`, every decision closed, `## Open: None` |
| `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md` | The set's shared decisions and the order 001 → 002 → 003 → 004 |

## Global Constraints

- `backlog.sh` never commits and never rewrites `docs/backlog.definitions.json` once it exists (`add-doc-schemas/references/backlog.md`, Hard bans / structural promises)
- "Every write that is not `move` leaves all other lines byte-identical" (`add-doc-schemas/references/backlog.md`, Line order is the priority)
- "Do not add a count anywhere: an array has a length" (`AGENTS.md`, Product Layer)
- "HTML comments (`<!-- -->`) are stripped at build" and "Never write a raw `.codeadd/` path" in shipped artefacts (`AGENTS.md`, Pipeline) — scripts are the exception
- `node scripts/build.js` and `node scripts/build-workbench.js` exit 0 with no new warning (`AGENTS.md`, Pipeline)
- Tests run only through the root `npm` scripts; nothing writes into the checkout (memory: tests do not write in the checkout)

## Problem

1. **Two boards, two formats** — the internal board is markdown with no id, no status and no script; the product one is JSONL with all three.
2. **A git route re-implemented in a prompt** — `add-framework--backlog` STEPS 5–8 do by hand what `backlog-commit.sh` implements and tests.
3. **No field for the layer** — the product format deliberately has no `scope`, and the internal board needs one.

## Proposal

Extend the product format with an optional `labels` array (test first), migrate the four items with
`backlog.sh add`, delete the markdown board, then rewrite the command over the two scripts and update
`AGENTS.md`. Format → data → command, because each stage reads what the previous one produced.

## Scope

### Includes

#### Phase 1 — `labels` on the product format

- **F1** [product] — `framwork/.codeadd/scripts/tests/backlog.bats`: add assertions, written RED before F2:
  `add` with `"labels":["internal"]` stores `labels` as given; `add` without `labels` stores `labels: []`;
  `add` with a non-array `labels` stores `[]`; `add` with an unknown field still drops it; `update` with
  `labels` replaces them and leaves other lines byte-identical. Existing 47 tests must keep passing.
  (Design §Proposed Solution 1.)
  - **Produces:** the RED `labels` assertions
- **F2** [product] — `framwork/.codeadd/scripts/backlog.sh`: the `add` record gains `labels`, positioned
  right after `theme`, taken the way `notes` is (`Array.isArray` → as given, else `[]`). `update`, `search`,
  `list` unchanged. The header's "the thirteen ticket fields" loses its count ("the ticket fields").
  Must not lose: no git, `set -u` only, the pure-append `add`.
  - **Consumes:** the RED `labels` assertions (F1)
  - **Produces:** ticket lines carrying `"labels":[...]`
- **F3** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`: a `labels` row in
  the field table (optional, free strings, no registry, default `[]`, not matched by `search`); the
  "There is no `scope` field" paragraph points at `labels` as the generic way to carry such a grouping; the
  worked example ticket line gains `"labels":[]` after `theme`. Also remove the count from "the thirteen
  ticket fields" in `framwork/.codeadd/skills/add-backlog/SKILL.md` and
  `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` (index row). No other wording in those two skills changes.

#### Phase 2 — the data

- **F4** [internal] — `docs/backlog.jsonl`, `docs/backlog.definitions.json` (created), `docs/backlog/index.md`
  (deleted): run `bash framwork/.codeadd/scripts/backlog.sh add` once per item, from the repository root,
  in the order **1.4, 1.2, 2.1, 3.1**, mapping per the design (title, theme, tldr, notes with the first note
  `Formerly item N.M of docs/backlog/index.md.`, done_when, labels from **Scope**, `paths` only for
  backtick text resolving to an existing path — checked before the call — `grounded` per item, `status:
  open`). **One `notes` entry per top-level bullet; a nested sub-bullet folds into its parent's string**, kept as
  markdown (`"<parent>\n- <sub>\n- <sub>"`) — item 1.4's three indented options under "The open question"
  become part of that one note. The `**Done when:**` bullet becomes `done_when`, not a note. Before deleting
  `docs/backlog/index.md`, compare each item's top-level bullet count (excluding **Done when**) with its
  `notes` length minus one. One commit carries the two new files and the deletion. No reusable migration script is added.
  - **Consumes:** ticket lines carrying `"labels":[...]` (F2)
  - **Produces:** `docs/backlog.jsonl` holding four tickets

#### Phase 3 — the command

- **F5** [internal] — `workbench/commands/add-framework--backlog.md`: rewritten over the scripts
  (design §Proposed Solution 4). Reads with `bash framwork/.codeadd/scripts/backlog.sh list|search`; resolves
  add / update / comment / move / close (`status` → `done` or `dropped`) / remove (mistakes only); keeps the
  bounded project check and its bans, the no-confirmation rule and the never-guess-a-target gates; every add
  carries exactly one of `product`, `internal`, `both` in `labels`; writes with
  `bash framwork/.codeadd/scripts/backlog-commit.sh`, whose `ROUTE`, `BASE_BRANCH`, `TICKET_ID`, `SHA`,
  `PUSHED` and `DEGRADED` keys feed the report. STEPS 5–8 (commit, fetch, rebase, push) collapse into that
  call. The line-ending and renumbering rules go (the script owns the file). Still loads `add-final-report`
  at the last step. Its `description` in `workbench/provider-map.json` (today "adds, updates or removes a
  backlog item") becomes "Records what to do next — adds, updates, reprioritises or closes a backlog ticket,
  then commits and pushes it to main through backlog-commit.sh."
  - **Consumes:** `docs/backlog.jsonl` holding four tickets (F4)
- **F6** [internal] — `AGENTS.md`: the `add-framework--backlog` row reads "Records what to do next — add,
  update, comment, reprioritise or close a ticket, committed and pushed to `main` through `backlog-commit.sh`"
  and its "Operates on" cell reads `docs/backlog.jsonl`.

### Does NOT Include (important!)

- The ticket lifecycle in the internal pipeline (subtopic 003)
- The board app and its distribution (002, 004)
- A `--label` filter on `backlog.sh list` — the board filters client-side
- Any change to `backlog-commit.sh`
- `add-backlog` (the product capture skill) passing `labels` — optional and unasked
- Editing `docs/deliveries/`, `docs/changelog/` or `docs/delivered.jsonl`, which cite old item numbers as history
- A real `/add-framework--backlog` write against `origin` during the build (see L4)

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Supersede design-004's "format stays markdown"? | Yes | Design §Key Decisions row 1 |
| How is the layer carried? | Optional generic `labels: string[]`, default `[]`, after `theme` | Design §Key Decisions row 2 |
| Order of the migrated tickets | 1.4, 1.2, 2.1, 3.1 | Design §Key Decisions row 4 |
| What enters `paths` / `grounded` | Only resolving repository paths; `grounded` per item | Design §Proposed Solution 2 |
| How does an item leave the queue? | By status; `remove` only for mistakes | Design §Key Decisions row 6 |
| The field count in prose | Removed, not bumped to fourteen | `AGENTS.md` "do not add a count anywhere" |
| The prompt-review audit of `add-framework--backlog` | `ok`, all eight items ✅ — no F-block from it | STEP 3.4 |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| `labels` breaks a product reader or the byte-stability promise | Low | F1's `update` byte-identical assertion and the existing `LINES_BYTE_STABLE` test (L1) |
| A bullet is lost in the migration | Low | F4's bullet-count comparison before deletion (L2.3) |
| The build pushes a test ticket to `main` | Med | L4 is a read of the rewritten command plus the existing `backlog-commit.bats`; no live write runs during the build |
| The rewritten command drops a gate the old one had | Low | L3 prompt-review delivery pass over F5 |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/tests/backlog.bats` | product | modify | F1 |
| `framwork/.codeadd/scripts/backlog.sh` | product | modify | F2 |
| `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md` | product | modify | F3 |
| `framwork/.codeadd/skills/add-backlog/SKILL.md` | product | modify | F3 (count removed) |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | F3 (count removed) |
| `docs/backlog.jsonl` | internal | create | F4 |
| `docs/backlog.definitions.json` | internal | create | F4 |
| `docs/backlog/index.md` | internal | **remove** | F4 |
| `workbench/commands/add-framework--backlog.md` | internal | modify | F5 |
| `workbench/provider-map.json` | internal | modify (the command's `description`) | F5 |
| `AGENTS.md` | internal | modify | F6 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### L1 — Script (RED → GREEN), `backlog.bats` run alone

1. `add` with `"labels":["internal"]` → the stored line has `"labels":["internal"]`. *RED today: `add` drops the field.*
2. `add` without `labels` → `"labels":[]`. *RED today: the key is absent.*
3. `add` with `"labels":"x"` → `"labels":[]`. *RED today: absent.*
4. `add` with an unknown field `foo` → no `foo` on the line. *GREEN today; regression guard.*
5. `update <id>` with `labels` → that line changes, every other line byte-identical. *GREEN today; regression guard.*
6. All pre-existing `backlog.bats` and `backlog-commit.bats` tests pass.

### L2 — Data (after F4)

1. `bash framwork/.codeadd/scripts/backlog.sh list --all` prints `BACKLOG_PRESENT=yes`, `TICKETS_TOTAL=4`, `DAMAGED_LINES=0`, and the four tickets in the order 1.4, 1.2, 2.1, 3.1 by their first note.
2. Each ticket carries exactly one of `product`, `internal`, `both` in `labels`, matching its old **Scope** (1.4 product, 1.2 product, 2.1 product, 3.1 both).
3. For each item, `notes.length - 1` equals its old top-level bullet count excluding **Done when** (nested sub-bullets folded into their parent); every `paths` entry exists on disk; `grounded` is `true` exactly when `paths` is non-empty.
4. `docs/backlog/index.md` does not exist; `docs/backlog.definitions.json` holds the four default statuses.

### L3 — Artefacts

1. `node scripts/build.js` and `node scripts/build-workbench.js` exit 0 with no new warning.
2. Grep finds no `thirteen` left in `backlog.sh`, `add-backlog/SKILL.md`, `add-doc-schemas/SKILL.md`, `references/backlog.md`.
3. Grep over `workbench/` and `AGENTS.md` finds no `docs/backlog/index.md`.
4. `@prompt-review-agent` delivery pass over `add-framework--backlog` returns no ❌.

### L4 — Behavioural acceptance

1. The rewritten command names `backlog.sh` for every read and `backlog-commit.sh` for every write, and no step edits `docs/backlog.jsonl` directly (read of F5).
2. The route and push behaviour are those `backlog-commit.bats` already asserts (L1.6); the first real `/add-framework--backlog` run after the merge is the live check, recorded as deferred in the ledger.

**RED expectations against the current tree:** L1.1–1.3 fail; L2 fails (no board); L3.2 and L3.3 fail.
**GREEN = all levels pass after F1–F6.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [internal] → F5 [internal] → F6 [internal]

- **F1 before F2** — RED first.
- **F4 after F2** — the migration writes `labels`, which only exists after F2.
- **F5 after F4** — the command is proven against a real board.
- Working-state boundaries: after F3 (format extended, nothing reads it yet) and after F4 (data migrated, old command would still reference a deleted file — so F5 must follow in the same build).
- Run `backlog.bats` and `backlog-commit.bats` alone, not the whole bats suite, for L1.

## Reviewer Handoff

For each F-block the build leaves, in the ledger: files touched, the validation levels covering it and
their state, and any departure from the design with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. A migrated ticket whose `paths` holds a plan id, a template name or a command slug.
3. A gate from the old command (never guess a target, bounded check, no confirmation) missing in the rewrite.

## References

- Design set: `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md` and its `-001-` member
- Prior art: `2026-09-20T111051-PLAN--project-backlog-001-format-and-script` (the format and `backlog.sh`), `2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename` (`backlog-commit.sh`, design-004)

---

## Next Steps

/add-framework--build backlog-board-001-internal-backlog-migration

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-21 | Initial creation |
| 2026-09-21 | Review fix-then-ok: nested sub-bullets fold into their parent note and `Done when` is not a note (F4, L2.3); the F1→F2 interface renamed "the RED `labels` assertions" |
| 2026-09-21 | Implemented in 19eb501 (F1), 7606c0d (F2), f1539f0 (F3), e9273f1 (F4), 3735e60 (F5), 9a0a202 (F6) |
