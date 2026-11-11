---
path: architectural
topic: hotfix-diagnosis-handoff-and-review-gate
doc: docs/brainstorming/2026-09-19T102437-hotfix-diagnosis-handoff-and-review-gate.md
delivery: automatic
---

## Decided
- Persist every diagnosis the user accepts so downstream work never depends on conversation memory.
- Print `/add.hotfix @<relative-report-path>` for an accepted hotfix route; never invoke it automatically.
- Record the diagnosis commit, branch, and dirty-tree content baseline in the handoff.
- Validate only commits and pending changes after the diagnosis; unrelated drift does not block.
- Skip hotfix history discovery and root-cause confirmation when a current handoff is supplied.
- Replace the hotfix's three judges with reviewer-agent, conditional OWASP, one correction wave, and scoped re-review.
- Allow inline review when subagent dispatch is unavailable and record that route in the receipt.
- Keep the hotfix review receipt in `about.md`; do not create `review-NNN.md` or a QA baseline.
- Add `hotfix-gates.sh` as the deterministic owner of diagnosis drift, correction-wave diff, and review freshness.
- Make `/add.done` validate the hotfix receipt and fingerprint directly; never route a hotfix through `/add.review`.

## Open
None
