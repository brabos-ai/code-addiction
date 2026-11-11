# A feature closes out on the build's own final review; `/add.review` becomes optional

**2026-09-19** · product layer
· plan `2026-09-19T122048-PLAN--optional-review-build-final-review`

## Why

`/add.done` refused to merge a feature without a `review-NNN.md`, so every feature paid for
`/add.review` even when the build had already reviewed each area. The build itself never looked at the
whole diff at once, which is the one gap that made skipping the review unsafe. The automatic
build ⇄ review loop existed only to chain that mandatory review.

## What changed

**The build reviews the whole unit.** A new unnumbered `## Final Review` in `add.build.md` runs once
per delivery unit, after its last area. `add-review-discipline` owns it: `@reviewer-agent` in the new
`MODE: feature` over the unit's review package, `MODE: owasp` on the `/add.review` STEP 4.1 trigger,
findings numbered `FR-n` and judged, one `@fix-agent` wave, then the scoped re-review. On an epic's last
subfeature the DELTA consistency pass runs first and its findings join the same list.

**The verdict is a ledger line.** `Final review: passed|ruled N|blocked N (after review-NNN)`, plus one
`Blocker suggestion: <id> — <ready-to-paste command>` line per open blocker. A Critical finding is
never turned into a ruling. A correction run writes the line from STEP 12.2's re-review.

**The gate reads either verdict — the most recent wins.** `converge-gates.sh` gate 1 compares the
line's `NNN` with the highest `review-NNN.md`: a higher review decides, otherwise the line does. It
emits `REVIEW_SOURCE=build|review|none`; gate 2 reports `skipped` (a pass, `BASELINE=none`) when the
build decided.

**Close-out no longer needs `/add.review`.** `/add.done` STEP 4.0 accepts the build's verdict and prints
its blocker suggestions from `GATE_REVIEW_DETAIL`. With `qa-pipeline` on and no review, it asks before
closing out without a QA judgement.

**The loop is gone.** The build's review baseline, its automatic hand-off to `/add.review`, the
review's STEP 11.5 hand-back and `add-delivery-mode`'s two-round section are removed. The build enters
`## Loop End` by itself on every delivery mode and prints every next command complete.
`add.build.md` went from 1609 to 1594 lines.

## Not included

Hotfix branches, a reviewed-tree fingerprint, `/add.review`'s own audit and QA judgement, and README
and web docs, which `/add-framework--sync` regenerates at release.
