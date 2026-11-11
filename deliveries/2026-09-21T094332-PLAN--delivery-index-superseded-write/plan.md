# Plan: Delivery index supersession — `write` accepts a `superseded` line whose anchors are gone

> **Status:** implemented
> **Layers:** both
> **Type:** script
> **Created:** 2026-09-21
> **Delivery:** automatic

---

## Objective

[from conversation, no design document] Any delivery replaced by another can be recorded as
`superseded` in the delivery index even after its files are deleted; the `fast-local-bats` entry
points at the parallel-tests entry, and nothing of the old runner survives in the repository.

**When this build is done:** `delivered.sh write` accepts a `superseded` line whose anchors no longer
resolve and refuses one whose `superseded_by` names no indexed id; the schema says so; the
`fast-local-bats` entry reads `superseded`; the old runner's Docker images have a documented prune
command; backlog item 2.2 is gone from the backlog.

## Context

Backlog item 2.2. The close-out of `2026-09-21T001942-PLAN--parallel-tests-in-one-container` (PR #83)
tried to declare `2026-09-10T230600-PLAN--fast-local-bats` superseded and got `REFUSED=find-absent`,
because `run-bats.js` no longer exists anywhere. `write` runs the anchor checks on every item whatever
the status (`framwork/.codeadd/scripts/delivered.sh:366-368`), while the schema says `superseded` is
never recomputed and the read side already honours that (`delivered.sh:299`).

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-21T094234-delivery-index-superseded-write-intent.md` | Path `bounded`, delivery `automatic`, every closed decision (which checks are skipped, the new refusal, the index line, the sweep result), `## Open: None` |

## Global Constraints

- Hard ban 6 holds: "Never rewrite or delete a line. Corrections are new lines." — the supersession is an appended line (`add-doc-schemas/references/delivery-index.md`, hard bans)
- A refused write appends nothing and exits 2 with `REFUSED=<name>` (`delivery-index.md`, `REFUSED=` vocabulary and exit codes)
- Tests never write the developer's checkout — run suites only through `npm run test:scripts` / `npm test` at the root (commit d6957c3; `scripts/run-tests.js` header)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **A replaced delivery cannot be declared replaced.** `write` refuses a `superseded` line with
   `find-absent` exactly when its anchors are gone — the only moment the declaration is needed.
2. **`superseded_by` is unchecked.** Any string is accepted (`delivered.sh:346` checks presence only),
   so a typo produces an entry pointing at nothing, and no read warns.
3. **The `fast-local-bats` entry still reads `changed`** after being replaced, and nothing tells an
   operator how to remove the old `codeadd-bats:*` images no runner rebuilds or removes.

## Proposal

Branch `doWrite` on `status === 'superseded'`: skip the two repository-reading anchor checks
(`find-absent`, `find-over-matched`, and the `LOOSE` count that rides on the same search), keep every
shape check, and add one resolution check — `superseded_by` must name an id present in the index,
else `REFUSED=superseded-by-unknown`. Document it in the schema, then use the fixed script to append
the `fast-local-bats` line.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/tests/delivered.bats`: add the L1 cases below, RED
  against the current script, next to the existing L1.8 refusal cases. Seed the index with
  `write_index` so a `superseded_by` target exists. Must NOT alter any existing case.
- **F2** [product] — `framwork/.codeadd/scripts/delivered.sh` `doWrite`: for `status: superseded`,
  skip `find-absent`, `find-over-matched` and the `LOOSE` accumulation; keep `missing-field`,
  `find-whitespace`, `item-in-docs`, `item-ignored`, `no-items`, `no-commits`, `bad-status`,
  `superseded-without-by`. Add `REFUSED=superseded-by-unknown` when `superseded_by` is not an id in
  the loaded index (an absent index resolves nothing, so it refuses). Must NOT change `read`,
  `verify` or `touched`. Update the script's header comment where it lists refusals.
  - **Produces:** `REFUSED=superseded-by-unknown`
- **F3** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md`: state
  that bans 3 and the over-match refusal do not apply to a `superseded` line (hard-ban table and the
  0 / >20 files table), and that `superseded_by` must resolve to an indexed id (ban 7). Add the
  `superseded-by-unknown` row to the `REFUSED=` vocabulary table.
  - **Consumes:** `REFUSED=superseded-by-unknown` (F2)
- **F4** [internal] — `docs/delivered.jsonl`: append, through `bash framwork/.codeadd/scripts/delivered.sh write`,
  one line for `2026-09-10T230600-PLAN--fast-local-bats` carrying its existing record (name, words,
  commits, origin, items, node) with `status: superseded`, `superseded_by:
  2026-09-21T001942-PLAN--parallel-tests-in-one-container`, `by: human`. Never edit the existing line.
- **F5** [internal] — `scripts/run-tests.js` header: one short paragraph saying the old runner's
  `codeadd-bats:*` images are no longer built or removed by anything, and how to list and remove them
  (`docker image ls codeadd-bats`, then `docker image rm`). No code change.
- **F6** [internal] — `docs/backlog/index.md`: remove item 2.2 whole, without renumbering anything
  (the file's own rule: a delivered item is removed, the gap stays).

### Does NOT Include (important!)

- A subcommand or automated close-out step that declares `superseded` — it stays a human `write`.
- Removing the Docker images on any machine — only the instruction ships.
- Backlog item 2.1 or any other item.
- Any change to `verifyEntry`, `read` sorting or dead-slot caps.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Which checks a `superseded` line skips | Only `find-absent`, `find-over-matched` (and `LOOSE`) | They read the repository; the rest guard the line's shape (intent file) |
| Validate `superseded_by`? | Yes — must be an indexed id, `REFUSED=superseded-by-unknown` | The entry's only value is its pointer (intent file) |
| Who writes the fast-local-bats line | This build, via `write`, `by: human` | Schema: a human writes a line only to declare `superseded` |
| Backlog item removal | In this branch (F6) | Backlog rule; `add-framework--done` has no backlog step |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/tests/delivered.bats` | product | modify | F1 — new L1 cases |
| `framwork/.codeadd/scripts/delivered.sh` | product | modify | F2 — status branch and new refusal. Callers (graph, `impact --depth 1`): `add.done`, `add.hotfix`, `add-knowledge-discovery` — none writes `superseded`, unaffected. Risk HIGH by count, change is additive. Internal close-out `add-framework--done` not in the graph answer: NOT VERIFIED; it only gains the ability |
| `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md` | product | modify | F3 — 22 direct dependants of `add-doc-schemas`; additive text in one reference |
| `docs/delivered.jsonl` | internal | modify (append) | F4 — not a graph node |
| `scripts/run-tests.js` | internal | modify (comment) | F5 — not a graph node |
| `docs/backlog/index.md` | internal | modify | F6 — not a graph node |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 lands before F2 and its new cases fail against the current script.

### L1 — bats, `delivered.bats` (RED → GREEN)

1. A `superseded` record whose every `find` is absent from the corpus, with `superseded_by` naming a
   seeded id, is accepted: exit 0, `ENTRY=` printed, one line appended. *RED today: `REFUSED=find-absent`.*
2. A `superseded` record whose `find` matches more than 20 files is accepted. *RED today:
   `REFUSED=find-over-matched`.*
3. A `superseded` record whose `superseded_by` names no id in the index is refused with
   `REFUSED=superseded-by-unknown`, exit 2, nothing appended. *RED today: accepted.*
4. A `superseded` record with a whitespace `find` is still refused `find-whitespace`. (Guard — green
   today, must stay green.)
5. A `changed` record with an absent `find` is still refused `find-absent`. (Guard.)

### L2 — suite

1. `npm run test:scripts` green, including every pre-existing `delivered.bats` case untouched.
2. `npm run build` exits 0 with no new warning.

### L3 — Behavioural acceptance

1. `bash framwork/.codeadd/scripts/delivered.sh read fast-local-bats` returns the entry as
   `superseded` with `superseded_by` = the parallel-tests id (F4).
2. `delivered.sh verify` leaves the new line untouched (superseded is never recomputed).
3. A grep for `run-bats|bats\.Dockerfile|CODEADD_BATS_` outside `docs/` finds only the absence
   assertions in `cli/tests/run-tests.test.js` (F5 adds none).
4. `docs/backlog/index.md` has no `### 2.2` heading, and 2.1 and every other number are unchanged (F6).
5. `delivery-index.md` names `superseded-by-unknown` in the `REFUSED=` table and states the
   `superseded` exemption (F3).

**RED expectations against the current tree:** L1.1, L1.2, L1.3 fail; L3.1 reads `changed`.
**GREEN = all levels pass after F1–F6.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [internal] → F5 [internal] → F6 [internal]

- **F1 before F2** — RED first.
- **F3 right after F2** — the schema must not describe behaviour the script lacks, nor lag it.
- **F4 after F2** — the line is only accepted by the fixed script.
- F5 and F6 are independent and last. Every boundary after F2 leaves the repo working.
- Per-F-block: F1–F2 run `npm run test:scripts` (the `.sh` gate); F4 runs L3.1–L3.2.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, validation levels and pass state, any
departure from the intent file with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. F2 skipping more than the two anchor checks — a `superseded` line must still be refused for a bad shape (L1.4).
3. F4 written by hand-editing `docs/delivered.jsonl` instead of through `write`, or rewriting the existing line.

---

## Next Steps

/add-framework--build delivery-index-superseded-write

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-21 | Initial creation |
| 2026-09-21 | Implemented in 84f5bfb..646e796 on `fix/delivery-index-superseded-write`. F7 (item-ignored joins the skipped checks), F8 (close-out writes its entry before supersessions) and F9 (header wrap) added during the build — see the ledger rulings |
