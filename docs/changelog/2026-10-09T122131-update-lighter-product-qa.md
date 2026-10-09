# Lighter product QA

## Outcome

With `qa-pipeline` on, a feature goes from plan to merge paying for each QA check once. The user always knows the next QA step. Closing a feature without a QA judgement no longer fails. Review starts the app instead of asking the user to. Setup no longer runs a nested review and build loop.

## Why

Ticket 0035B asked for a review of the product QA flow in the spirit of 0034B. The review found dispatches that repeat, one dead end at close-out, and a setup that re-ran the whole pipeline. After 0034B the build also stopped naming `/add-review`, which is wrong when QA is on: the QA judgement lives only there.

## Changes

- **No dead end at close-out (C1).** In `add-done`, when no review judged QA and the user closes without a judgement (or the feature is off), `QA_PROMOTION_STATUS=skipped` and STEP `promote-qa` runs neither `validate` nor `promote`. The question now says working QA evidence will not be promoted.
- **The build names the next QA step (C2).** A new slot `qa-pipeline.next-command` in `add-build.md` carries a `next-command` section in the qa-pipeline fragment. The base command gained no `/add-review` text. The section only fires for a normal build or an epic's last subfeature that declares screens.
- **Plan skips the QA spec without a screen, and warns about setup (C4, C8).** The `qa-spec` section runs only when `design.md` declares a screen, and warns once when `SETUP_QA` is absent or stale.
- **One `@e2e-agent` per delivery (C5).** It runs after every area is validated, on the last subfeature of an epic, over every surface in scope. Captures go to a scratch directory that is deleted, so no `_tests/run-NNN/` is left behind. Failing assertions become a build-only fix round gated by build, tests and the spec re-run, with `MAX_ATTEMPTS = 3` and no second e2e dispatch. The ledger line `e2e: complete (N surfaces, P passing; commits BASE..HEAD)` lets a resume skip the dispatch. `e2e-agent` takes one or more surfaces and a `CAPTURE_DIR`.
- **The e2e specs are committed (C3).** One extra batch through STEP `add-build.commit`, with `Feature-Id` and no `Task-Id`, so `BUILD_REVIEW_COVERS` can hold with QA on.
- **Review boots the app (C6).** Preflight row 3 starts the app through the managed lifecycle and blocks only if boot fails. The preflight tears down only an app it booted. A feature with no screen is not blocked by the missing `screens.json`. `qa-preflight.cjs` is unchanged.
- **Setup drops the smoke review (C7).** `add-qa-setup` has a new STEP `proof`: preflight `a`, plus `b` when a feature has `screens.json`. The first real `/add-review` proves QA end to end. `## Materializes` is unchanged, so installed projects stay current.
- **Cleanup (C9).** `STEP add-build.order` (never existed) is `STEP add-build.dependency-order` in the qa and tdd fragments. The `qa-fix` slot moved into STEP `add-build.correct` with an explicit route to agent table. Maintainer notes in the review fragment moved to a source comment. Stale step numbers and first-run wording were fixed in `add--setup-contract`, `add--qa-migration`, `add--ecosystem` and `provider-map.json`.
- **Tests.** `cli/tests/lighter-product-qa.test.js` is new. The injection pins moved from 70 to 71 (and slots 63 to 64), and `add-build.md`'s line budget from 1657 to 1665. Eight test names were retitled or replaced; the `Test-Removed:` trailers are in the last commit of the branch.

## Not changed

The two review judges, `qa-preflight.cjs`, `qa-evidence.cjs`, `converge-gates.cjs`, `add--review-discipline`, the `## Materializes` block, and the `web/` docs page (sync regenerates it).
