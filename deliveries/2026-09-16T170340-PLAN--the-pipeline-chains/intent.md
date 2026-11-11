---
id: BRN-internal-fast-path
type: brainstorm-intent
created: 2026-09-16
path: architectural
topic: internal-fast-path
doc: docs/brainstorming/2026-09-16T083054-internal-fast-path-000-umbrella.md
---

## Decided

- The automatic mode is a third option at the brainstorm's approval, not a flag — a flag is a mode you forget you enabled
- The automatic mode runs while every verdict-bearing gate returns `ok` or `fix-then-ok`, and stops on `blocked` or a hard stop
- The gates that emit no verdict — the `[STOP]` approvals and the close-out's boolean gate — are subtopic 003's to define
- The four internal commands become skills, for coherence and not for capability: they were already loadable, so conversion buys no mechanism
- `--squash` becomes `--merge` in both close-out commands, accepting that it becomes every installed user's default
- The GitHub repository needs no change — it already allows all three merge methods
- ⛔ **Two members, in the order 002 merge → 003 conversion and chain.** This originally read "three subtopics, 001 → 002 → 003" and both halves were wrong. 001 is **parked, not a member**: the dependency the umbrella claimed does not exist, because the chain always produces a plan. The objective was then **widened** to its third clause — the merge preserves history — after `8.1`'s serves-line test failed 002 against the narrower text the umbrella itself had introduced with the word "Separately"
- 003 must create the build → done hand-off; it does not exist today, only a `mention:`
- The automatic option's terminus is `add-framework--build` STEP 9's question about opening the PR. **The merge is never automatic**, on any path

## Open

None

## Prior art

- 2026-09-15T224612-PLAN--pipeline-ceremony-rebalance live — the intent file that carries the brainstorm's classification into the planner; the sizing this umbrella assumed was missing already exists up to that point
- 2026-09-14T215437-PLAN--post-merge-checks-five-where-one-would-do live — cut a close-out check only where a successful merge could not exist without the thing it re-proved
- 2026-09-10T203053-PLAN--close-out-hardening live — the close-out was hardened from four failures found by running it, not by reading it
- 2026-09-11T014333-PLAN--product-close-out-parity live — names the close-out facts that hold in any repository; its plan and its umbrella disagree on the count; 001 settled it at four, and that finding survives its parking

## Rejected

- A fifth `framework--quick` command — duplicates the build's direct mode and the close-out, producing two places that merge and two that index
- Extracting each command's core into a skill while the command stays the entry point — the shape shipped for `add.new`; rejected in favour of full conversion after the mechanical argument was withdrawn
- Making `add.done`'s merge method configurable through the manifest — rejected for the simpler flag change, cost stated and accepted

⛔ **Each subtopic writes its own intent file at its own refinement.** This one records what the SET settled; it is not the contract for any single plan.
