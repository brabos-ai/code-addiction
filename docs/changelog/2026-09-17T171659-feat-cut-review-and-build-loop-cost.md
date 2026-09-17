# Cutting the cost review and build were burning on loops nobody meant to run

**2026-09-17** · both layers
· plan `2026-09-17T153506-PLAN--cut-review-and-build-loop-cost`

## Why

Review and build were both burning token on work that did not need spending: a fix dispatched for a
finding nobody had checked was real, an internal build's quality audit paying one subagent call per
touched file with no ceiling, and a live incident where `/add.build` looped rewriting six inherited
`workerd` test suites because nothing told the session that suite belonged to CI, not to it — even
though the project's own generated wiki already recorded the split.

## What changed

**Findings carry a confidence field.** `reviewer-agent`'s `MODE: task` findings now mark
`Confidence: confirmed | needs-verification`. In the in-build task loop
(`add-subagent-driven-development` §7), a `needs-verification` finding gets one scoped confirm
dispatch before `@fix-agent` is ever called; a retracted finding is dismissed and logged instead of
fixed on faith.

**Internal quality audit is bounded.** `prompt-review-agent` accepts a batched list of artefacts in
one dispatch. `add-framework--build` STEP 7.1's quality scope went from "3 + N" (one call per touched
`.md` file, no ceiling) to "3 + 1" (one batched call, regardless of file count).

**OWASP review is conditional, not default.** `reviewer-agent` gains `MODE: owasp`, a systematic
OWASP Top 10 pass. `/add.review` dispatches it alongside the frontend/backend reviewers only when the
diff touches a sensitive area — auth, payment, upload, unsanitized input, session/token — never by
default, and never deduplicated against the area reviewer's own security checklist line.

**Build/TDD stops chasing CI-tier suites locally.** The architect subagent that writes a task's
`Verify:` line now reads `wiki/workflows.md`'s Test Workflow section first, scoping a CI-tier test's
`Verify:` to that one file instead of the whole suite command. The `tdd-pipeline` fragment's
gate/awareness/verification sections, and its WAIT-ALL `TEST_COMMAND` run, only chase local-tier work
to green inside the session — CI owns the rest. `add-tdd`'s GREEN step carries the same caveat, inert
wherever no `Verify:` line exists (e.g. `add.hotfix`).

**Fix Routing stays one review, one fix wave, on purpose.** The STEP 7 review pass found that
`Confidence` only gated the in-build task loop — `/add.review`'s own `## Fix Routing` →
`/add.build` STEP 12 pipeline, the one most users actually run, never consumed it. Extending that
pipeline's schema was one option; the simpler one taken instead states explicitly, at both sites, that
this path is "one review, one fix wave, done" and `Confidence` stays informational there. No new
schema, no new gate.

## What the checks found

The STEP 7 auditors found a real regression (three `prompt-quality-ruler.test.js` assertions pinned
the old "3 + N" wording and the old per-file trap phrasing) and a real process gap (no
`cli/tests/*.test.js` RED-first coverage was written during F1-F9, against the plan's own Validation
Matrix). Both are fixed: the broken assertions updated, and `cut-review-and-build-loop-cost.test.js`
added — written and confirmed GREEN after the fact, not RED-first, which is recorded as a ruling
rather than hidden. A second scoping gap (the tier-aware gate covered `gate`/`awareness`/`verification`
but left the WAIT-ALL `TEST_COMMAND` run untouched) is closed too. Six pre-existing defects the
full-file audit surfaced in files this delivery touched — a stale `uses:` declaration, a fix-agent
contract mismatch, a stale reference subdoc, a missing validation-gate block, and a non-canonical LANG
line — are left for a separate delivery; none is caused by, or entangled with, this one's own edits.

## Not included

- `add-review-discipline` (either layer), `add.plan.md`, and `add-subagent-driven-development`'s
  Breaker section (§8) — investigated and found already sufficient.
- Wiki generation (`add-architecture-discovery` / `add.wiki`) — `workflows.md` already carried what
  was needed; this delivery only wired consumption.
- `MAX_ATTEMPTS = 3` is unchanged.
- A `Confidence` column, merge step or gate for `/add.review`'s `## Fix Routing` pipeline — explicit
  user decision to keep that pipeline schema-free rather than extend it.

## Cost accepted

The OWASP trigger's five-item path list can miss a sensitive area outside it. A batched
`prompt-review-agent` call has no fallback yet for a very large build (15+ `.md` files). Test-tier
routing degrades silently to today's behavior wherever `wiki/workflows.md` or its Test Workflow
section is absent. `/add.review`'s Fix Routing pipeline still fixes every routed finding without a
pre-fix confidence check, by explicit choice, not oversight.
