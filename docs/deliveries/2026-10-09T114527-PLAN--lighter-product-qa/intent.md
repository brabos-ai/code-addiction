---
path: architectural
topic: lighter-product-qa
doc: docs/brainstorming/2026-10-09T113824-lighter-product-qa.md
delivery: confirm
ticket: 0035B
---

## Decided
- C1 add-done: "close without a QA judgement" skips promote-qa instead of validating `none` — removes the dead end after a fix build
- C2 add-build: suggests `/add-review` as next step only when `qa-pipeline` is on — QA judgement lives only there
- C3 add-build: e2e spec files enter a build commit — makes 0034B's `BUILD_REVIEW_COVERS` work with QA on
- C4 add-plan: qa-spec runs only when `design.md` declares a screen — no dispatch on non-UI work
- C5 add-build: ONE `@e2e-agent` per delivery, after every area and SF is built (epic: on the last SF, where DELTA runs); failures become rows of a normal fix wave, gated by the spec re-run (no re-review, no second e2e dispatch), MAX_ATTEMPTS stays 3; no `run-NNN` left behind; ledger line for resume — user's decision
- C6 add-review: preflight row 3 boots the app via the managed lifecycle and blocks only if boot fails
- C7 add-qa-setup: smoke review and its correction loop removed; proof is preflight a+b green
- C8 add-plan: warns once when `qa-pipeline` is on and `SETUP_QA` is absent or stale
- C9 cleanup: dangling `STEP add-build.order`, qa-fix moved to STEP correct with explicit routes, maintainer notes to HTML comments, stale refs in add--setup-contract and add--qa-migration
- Both review judges stay — recorded 2026-07 decision, small gain
- One plan, one F-block and commit per cut, all [product] — 0034B shape; keep add--review-discipline counts consistent

## Open
None
