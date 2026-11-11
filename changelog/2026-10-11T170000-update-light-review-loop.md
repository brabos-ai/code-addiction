# Update: light review loop — the build closes the review it fixed, and done accepts it

## Outcome

After a review with findings, `/add-build` fixes them, re-reviews only the fix diff, records the resolution in the same review, and `/add-done` closes with it. A fix wave that stays inside the findings' scope no longer forces a new full review. Ticket 0047B.

## Changes

- `converge-gates.cjs` gate 2: the newest working QA run with a valid report is the gate, whichever source decided gate 1. `skipped` only when no working run exists. A baseline that moved to a newer run of the same scopes is `ok` ("advanced"), not `broken`.
- `add-done`: branch 5 fires only without a working QA run; an advanced baseline is not a block.
- `add-review`: a red `lint`/`format` gate on touched files is `minor` and `⚠️ KNOWN ISSUES` (route `formatter` or `@fix-agent`), no longer a `blocker`. It does not make Overall BLOCKED.
- Review schema: the Resolution Annex is `ID | Route | Outcome | Evidence | Test | Files | Note`, with outcome `deferred` and route `formatter`. `reviewer-agent` re-review lines carry `test:`.
- `add-build`: `minor`/`polish`/`lint` rows are deferred to the ledger; `formatter` rows run the project's formatter (five known tools); gates run after the last round; after a correction, a scope check (files outside the findings, or over 300 changed lines) falls back to the normal Final Review; a run with no `@fix-agent` round writes `Final review: passed`.
- `board` feature: one backlog ticket for the deferred minors (new slot member `deferred-minors`). `qa-pipeline`: a routed correction of a review that judged QA hands off to `/add-done`.
- Tests: `scripts/tests/converge-gates.test.cjs` #078-#083, `cli/tests/light-review-loop.test.js`; pinned injection counts moved 71 -> 72 and the `add-build` line budget to 1708.

## Action for installed projects

None. Projects with `board` enabled get the new `deferred-minors` section on the next `codeadd features` refresh.
