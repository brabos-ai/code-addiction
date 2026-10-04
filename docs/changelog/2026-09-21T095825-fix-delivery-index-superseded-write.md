# Delivery index — a replaced delivery can be declared superseded after its files are gone

> **Date:** 2026-09-21
> **Plan:** `docs/plans/2026-09-21T094332-PLAN--delivery-index-superseded-write.md`
> **Layer:** both

Backlog item 2.2. `delivered.sh write` checked every item's anchor against the repository whatever the
line's status, so a `superseded` line was refused at the one moment it was needed — after its
replacement deleted its files. The close-out of the parallel-tests delivery hit exactly that:
`REFUSED=find-absent` on the `fast-local-bats` entry. A `superseded` line is now declared, not
anchored, and its pointer must resolve instead.

## Changed

- **`framwork/.codeadd/scripts/delivered.sh` `write`** — a `superseded` line skips the checks that read
  the repository as it is now: `find-absent`, `find-over-matched`, the `LOOSE=` flag and `item-ignored`
  (a path can become ignored after the line was written — `.claude/` was tracked when `fast-local-bats`
  was recorded). Every check on the line's own text still runs, `item-in-docs` and `find-whitespace`
  included. `read`, `verify` and `touched` are unchanged.
- **`add-doc-schemas/references/delivery-index.md`** — ban 3, the over-match thresholds and the
  ignored-path half of ban 9 are documented as not applying to a `superseded` line; ban 7 now requires
  `superseded_by` to resolve. The "twelve names" count, already one short on `main`, is now right.
- **`workbench/skills/add-framework--done/SKILL.md` STEP 3.4** — writes this delivery's own entry before
  any `superseded` line pointing at it, and no longer reads ban 9 as binding a superseded line's items.
- **`scripts/run-tests.js` header** — says how to list and remove the old `codeadd-bats:*` images,
  which nothing builds or removes any more.

## Added

- **`REFUSED=superseded-by-unknown`** — a `superseded_by` naming no id the index holds is refused. An
  absent index resolves nothing, so it refuses too.
- **Eight `L1.14` cases in `delivered.bats`** — superseded with a gone, over-matched or now-ignored
  anchor is accepted; an unknown pointer is refused with and without an index; whitespace and `docs/`
  anchors are still refused on a superseded line; a `changed` line with a gone anchor is still refused.

## Records

- **`docs/delivered.jsonl`** — one appended line declaring `2026-09-10T230600-PLAN--fast-local-bats`
  `superseded` by `2026-09-21T001942-PLAN--parallel-tests-in-one-container`, written through `write`.
  The original line is untouched.
- **`docs/backlog/index.md`** — item 2.2 removed; no other number changed.

## Not changed

- The sweep for the old runner found nothing left to remove: outside `docs/`, `run-bats`,
  `bats.Dockerfile` and `CODEADD_BATS_` appear only in the absence assertions of
  `cli/tests/run-tests.test.js`.
