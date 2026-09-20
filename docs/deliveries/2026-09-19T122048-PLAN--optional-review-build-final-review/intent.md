---
path: architectural
topic: optional-review-build-final-review
doc: docs/brainstorming/2026-09-19T112200-optional-review-build-final-review.md
delivery: automatic
---

## Decided
- `/add.review` is optional at `/add.done` for feature branches — the build's own final review replaces it as the default close-out verdict
- The build runs one final review per delivery unit: whole diff + RF/RN spec compliance + conditional OWASP — covers what per-area reviews cannot see
- One fix wave + scoped re-review; non-blocker leftovers become `Ruling:` lines — same "one review, one fix wave" rule as PR #75
- An open `blocker` blocks (`Final review: blocked N`) and always comes with a suggested next step reasoned from the feature's objective, as a ready-to-paste command — keeps the "no unresolved blocker survives" guarantee
- The verdict is a `build-ledger.md` line naming the highest `review-NNN.md` at the time; `converge-gates.sh` uses "most recent wins" — `review-NNN.md` stays owned by `/add.review` only
- No review → `GATE_QA_BASELINE=skipped`, `BASELINE=none`; `REVIEW_SOURCE=build|review|none` emitted
- `qa-pipeline` enabled + no review → `/add.done` asks the user whether to close out without judged QA — the user's call, never silent
- The automatic build ⇄ review loop is removed (1.0.1 baseline, STEP 17 skip, STEP 18.2 handoff, `/add.review` STEP 11.5, `add-delivery-mode` loop section)
- The build enters `## Loop End` by itself after the final review or a correction run, on every delivery mode; the user never types `--loop-end`; any suggested next command is printed complete, ready to paste
- DELTA pass findings join the last subfeature's final review when no `review-NNN.md` is operative
- Mechanics owned by product `add-review-discipline`; `add.build.md` net line count ≤ 0 against branch start — checkable budget
- Hotfix branches, a reviewed-tree fingerprint and `/add.review`'s own audit/QA judgement are out of scope
- Execution runs in an isolated git worktree, branched from current `main` — user's explicit request at approval

## Open
None
