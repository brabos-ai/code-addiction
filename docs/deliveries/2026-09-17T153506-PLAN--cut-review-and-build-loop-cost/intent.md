---
path: architectural
topic: cut-review-and-build-loop-cost
doc: docs/brainstorming/2026-09-17T150746-cut-review-and-build-loop-cost-000-umbrella.md
delivery: automatic
---

## Decided
- Umbrella covers three subtopics, refined in this order: 1 review-confirm-before-fix, 2 subagent-dispatch-pruning, 3 build-tdd-test-tier-cap — 1 and 2 share `add-review-discipline`, cheapest done in sequence; 3 is independent
- False-positive check for a review finding stays inside the same agent by default; a separate verify dispatch is escalation-only, for findings the reviewer cannot confirm itself
- Internal layer's `add-framework--build` STEP 7 "3 + N" (one `@prompt-review-agent` dispatch per `.md` file) becomes "3 fixed + 1 batched" call covering every touched artefact
- Product layer's OWASP-focused `reviewer-agent` mode is conditional, triggered only when the diff touches auth, payment, upload, unsanitized input, or session/token — not a default third dispatch
- `add.plan` consults `wiki/workflows.md`'s Test Workflow section before writing a task's `Verify:` line, to classify local vs. CI vs. manual
- `add.build`/`add-tdd` never chase a CI-tier suite to green in the interactive session — only the task's own touched file runs locally; the rest is CI's job
- `MAX_ATTEMPTS = 3` and "a red build is not a finding" stay unchanged in wording; subtopic 3 extends coverage, not the rule's text
- "Review runs exactly once, no verdict file" (internal) stays untouched — this design works inside it
- Internal and product `add-review-discipline` stay divergent — no merge, confirmed with the user

## Open
None
