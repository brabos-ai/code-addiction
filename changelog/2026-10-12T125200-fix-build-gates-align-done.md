# Fix: build gates aligned with done — a simple feature runs the same gates as `/add-done`, and the coverage gate reads only its own table

## Outcome

A simple-feature `/add-build` no longer closes as complete while `converge-gates.cjs` would make `/add-done` block. The coverage gate counts only rows of a table whose header carries `Covered?`. The build ledger refuses a `Final review:` line no gate can parse. Ticket 0049B (OMF case, feature 0048F under v1.5.4).

## Changes

- `converge-gates.cjs` (`readCoverage`): a table ends at the first line that does not start with `|`, and the column latch is cleared there. Only the first `|` line of a table is read as a header. A separate "table seen" flag is never reset, so an epic-wide run keeps the uncovered count when the last plan has no table.
- `add--test-specification` and the `tdd-pipeline` `add-plan` fragment: the test-spec "Coverage vs Requirements" third column is `Status`, not `Covered?`. The requirements table in `add-plan` keeps `Covered?`.
- `add-build` (`## Loop End`, step 1): a non-epic runs `converge-gates.cjs "docs/features/${FEATURE_ID}"`. `GATES_OK=5/5` goes to Publish. Anything short exits BLOCKED naming each gate that is not `ok`, then goes to Publish. The completion metadata reports BLOCKED, not complete. The correction-run verdict text names the `(after review-NNN)` grammar.
- `build-ledger.cjs`: a `Final review:` line outside `passed|ruled N|blocked N (after review-NNN)` exits 2 before any file is touched. `Final review head:` is unaffected.
- `add--ecosystem`: the `add-build` row mentions the gate script on a simple feature.
- Tests: `converge-gates#090-094`, `build-ledger#018-020`, `cli/tests/optional-review-build-final-review.test.js` (new 0049B block; `BUILD_LINE_BUDGET` 1708 → 1713).

## Action for installed projects

None. Run `codeadd update`. Existing `plan.md` files with a test-spec `Covered?` table are now read on their own terms: `✅` cells count as covered.

## Not covered

Hotfix is unchanged. The `add-build` change is text; no live `/add-build` run was made.
