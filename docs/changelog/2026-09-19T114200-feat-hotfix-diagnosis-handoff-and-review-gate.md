# Hotfix reuses an accepted diagnosis and close-out checks a current receipt

**2026-09-19** · both layers
· plan `2026-09-19T105204-PLAN--hotfix-diagnosis-handoff-and-review-gate`

## Why

An accepted `/add.diagnose` report lived only in the session. `/add.hotfix` repeated history and RCA,
then reviewed with three always-on judges. `/add.done` skipped `/add.review` for hotfixes without
proving the hotfix's own review still matched the tree.

## What changed

**Accepted diagnoses persist.** Every route the user accepts is written to `docs/diagnose/`, including
no-action. A rejected diagnosis is not written. Hotfix routes print
`/add.hotfix @docs/diagnose/<file>.md` and never invoke it.

**Hotfix reuses a valid report.** Before branch creation it runs `hotfix-gates.sh diagnosis-check`.
Unrelated later drift does not block. Relevant overlap or a missing diagnosed commit requires a new
`/add.diagnose`. STEPS 4-6 and the second root-cause confirmation are skipped. The TDD RED gate in
STEP 7 still runs.

**Hotfix review matches the build model.** `@reviewer-agent` plus conditional OWASP, one `@fix-agent`
wave (`ATTEMPT=1`, `MAX_ATTEMPTS=1`), then a correction-only snapshot re-review. Inline fallback is
recorded as `reviewer: inline`. The three retained judges stay registered and lose only their hotfix
dispatch.

**`about.md` is the receipt.** Scalars, Reviewed Paths, and Findings live under `## Review`. The
fingerprint normalizes only `reviewed-tree`, the `about.md` row's own hash, and the close-out
addendum. Iteration is logged before that write. Nothing hotfix-owned changes after the hash lands.

**Close-out is positive.** `/add.done` Normal and Resume run `hotfix-gates.sh review-validate` on the
working tree. Recovery uses `--tree <merge-commit>`. Closed out still stops early. Feature
`converge-gates.sh` gates are unchanged. A failed hotfix receipt sends the user back to `/add.hotfix`,
never `/add.review`. `status.sh` recommends `/add.done` on a hotfix branch.

## Not included

Feature `/add.review`, `converge-gates.sh`, a hotfix `review-NNN.md`, QA baseline, a second correction
wave, and removal of `security-agent`, `conformance-agent`, or `failure-analysis-agent`.
