# Lighter add-build

## Outcome

`/add-build` dispatches far fewer review, validation and readback agents. What gets checked stays the same: the repeats are gone, not the checks. In a TASKS MODE build with 2 areas and 6 tasks the validators drop from 6 to 2, and the readback disappears from the build.

## Why

Users reported that development got slow (ticket 0034B). The analysis counted about 10 review and test dispatches in a typical 2-area build, more than 20 in the worst case, and more than 40 in TASKS MODE. Most re-checked something an earlier dispatch had already checked.

## Changes

- **No readback in the build.** The step, its `Readback:` ledger lines and the completion item are gone from `framwork/.codeadd/commands/add-build.md`. The `/add-plan` readback stays. `add--review-discipline`, `add--subagent-driven-development`, `add--ecosystem` and `add-new.md` now name one readback site.
- **One validator per area in TASKS MODE.** A task commits once the build and its own `Verify` pass. One validator then reads the whole area range (`AREA_BASE..HEAD`) after the area's last task. The ledger gains `<area>: validated (…)`, and a resume restarts an area at its validator. The tdd fragment says `@test-agent` runs after the area's last task and before the validator.
- **No re-review on build-only fix rounds.** A round whose rows all came from build errors or a test-agent `BLOCKED` is gated by the build and the tests going green (`fix round N/3 (build-only — …)`). One reviewer-sourced row keeps the re-review. The Compliance Gate accepts the new line. A CORRECTION run whose last round was build-only runs the normal Final Review. `add-hotfix` and `MAX_ATTEMPTS = 3` are unchanged.
- **`/add-review` skips the audits the build already ran.** The Final Review writes `Final review head: <sha>` on its own line, so `converge-gates.cjs` is untouched. When the last verdict is `passed` or `ruled N`, no source changed since that commit and the tree is clean, `add-review.md` skips the spec audit and the OWASP pass and records `Spec audit: SKIPPED`. `/add-build` stops naming `/add-review` as a next step.
- **Tests.** `cli/tests/lighter-add-build.test.js` is new. `converge-gates.test.cjs` gains two cases for the head line. `product-close-out-parity.test.js` loses `L11` and `L11.1`–`L11.8`; each name carries a `Test-Removed:` trailer in the F1 commit.
