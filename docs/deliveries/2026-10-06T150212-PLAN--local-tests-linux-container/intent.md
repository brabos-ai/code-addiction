---
path: architectural
topic: local-tests-linux-container
doc: docs/brainstorming/2026-10-06T144849-local-tests-linux-container.md
delivery: automatic
---

## Decided
- Every supported local test command runs in Linux Docker on all host OS — scripts enforce the policy.
- Prohibit local native overrides and fallback — missing Docker means tests were not run.
- Keep prompts environment-agnostic — ordinary npm commands dispatch centrally.
- npm test/framework selects CLI, scripts and package smoke; all adds board unit/typecheck and E2E — individual suites retain filters.
- Include watch synchronization and coverage/browser report export — preserve usable local workflows.
- Authorize native Linux GitHub Actions explicitly — generic CI/copy flags do not authorize local execution.
- Extend the work initiated by PR #109 — preserve isolation, worktree support and failure propagation.
- Deliver automatically through planning/build — merge and deciding stops still require user approval.

## Open
None
