# Fix: hotfix objective review — a wanted deletion no longer stales the receipt, the review judges by the objective

## Outcome

A hotfix whose goal is to remove a file closes through `/add-done` with `HOTFIX_REVIEW=ok`. The hotfix review gets an explicit `OBJECTIVE` and the diff. A stale receipt is fixed by rerunning only the review. A hotfix started on a wrongly named branch is told the exact name `/add-done` needs. Ticket 0048B (OMF case, `0043H-remove-turnstile`).

## Changes

- `hotfix-gates.cjs`: a path the receipt lists that is absent from the final tree keeps its receipt row, in the comparison, the `about.md` self-hash and the fingerprint (worktree and `--tree`). Review manifests write deleted rows as `000000`. Edits and added files after the review still go stale. `diagnosis-*` modes are unchanged. Receipts written before this change still pass.
- `add--doc-schemas` (`fix.md`): the hotfix schema states both rules.
- `reviewer-agent`: one rule for every caller — a removal the objective asks for is not a finding.
- `add-hotfix`: `OBJECTIVE` in `STEP add-hotfix.review-input` and the dispatch; new sub-step `STEP add-hotfix.resume-review` (validate first, resume only on `stale`/`blocked`); branch check stops on any branch not named `hotfix/[NNNN]H-*`.
- `add-done`: `stale`/`blocked` receipts send the user to rerun `/add-hotfix` on the same branch; the Recovery route stops instead.
- `done.cjs`: the branch hints name `hotfix/[NNNN]H-<slug>` and `hotfix/0002H-urgent`.
- Tests: `hotfix-gates#009-016`, `done#057-059`, `cli/tests/hotfix-objective-review-0048.test.js`.

## Action for installed projects

None. Run `codeadd update`. A branch like `hotfix/foo` (no ID) is now stopped by `/add-hotfix`; rename it to `hotfix/[NNNN]H-<slug>`.

## Not covered

The resume step and the reviewer rule are text; no live `/add-hotfix` run was made.
