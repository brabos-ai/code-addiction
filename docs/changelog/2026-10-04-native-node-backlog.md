# Native Node backlog — local operations and recoverable Git publication

Plan: `docs/plans/2026-10-04T004044-PLAN--native-node-backlog.md` (ticket 0019B).
One branch (`feat/native-node-backlog`), one commit per F-block, the plan's
RED-first assertions recorded in the build ledger.

## What arrives

The agent backlog flow uses **native Node and Git**, targeting Windows,
Linux and macOS; acceptance remains pending macOS evidence. Every shell pipe that used to stand between the agent and a
ticket write (`bash`, `printf`, `grep`, `status.sh`, redirection) is gone from
the native recipes; bash remains only as compatibility wrappers whose stdin
channel the bats suites still pin.

| Artefact | Role | Layer |
|---|---|---|
| `framwork/.codeadd/scripts/backlog-cli.cjs` | the local entry: seven modes, `--record-file` records read in the caller cwd, native allocation | product |
| `framwork/.codeadd/scripts/backlog-id.cjs` | the native global allocator: immediate `docs/features` slugs plus the raw backlog text, anchored verbatim the way both shell calculators grep (trailing quote included); 9999+ refuses | product |
| `framwork/.codeadd/scripts/backlog-git.cjs` | native Git primitives: base discovery mirroring `get-main-branch.sh`, path-scoped commits, conflict-abort-verified rebase, atomic recovery refs (created expected-absent, released owned-only, moved refs kept) | product |
| `framwork/.codeadd/scripts/backlog-commit.cjs` | the publication entry: parse once, capture the record once, choose the operation root, run the same `executeBacklog`, render `ROUTE/BASE_BRANCH/TICKET_ID/SHA/PUSHED` plus `PERSISTED/COMMITTED/RECOVERY_PATH/RECOVERY_REF` | product |
| `framwork/.codeadd/scripts/backlog.sh`, `backlog-commit.sh` | bash compatibility wrappers: node guard with actionable native guidance, delegation | product |
| `scripts/build.js` + allowlist | ships exactly six canonical backlog CJS modules; nested lookalikes and wrong extensions still offenders | internal |
| product instructions (skills/fragments) | every native recipe reaches the `.cjs` entries; compatibility lines marked; lifecycle equality pinned | product |
| internal instructions (workbench) | the same migration at the internal layer, recipes and `The Ticket` | internal |
| board suite | the served board answers a real CLI mutation through SSE without a reload; standalone closure relocated runs with server + runtime alone | board |

## Verification

- cli suite 76 files / 1775 tests, board unit 8 files / 113 tests, full board
  e2e 163 passed with the same 20 baseline viewport skips; bats 65 + 7 = 72
  green inside the Linux container (runner exec-bit repair landed here too).
- Recovery matrix: conflict abort verified; push refusal retains the commit
  through its ref past `git gc --prune=now`; a matching foreign recovery ref
  survives a verified push untouched; a moved ref stays and is reported.
- Board ready closes `0019B`; the model-switch hold the plan records is
  satisfied by this build's explicit invocation on the chosen model.

## Follow-up review corrections — 2026-10-04

Review: `docs/plans/2026-10-04T004044-PLAN--native-node-backlog--review.md`.
Clean detached leftovers now require durable reachability before removal. Publication uses an isolated index and three-way merges to preserve caller staged/unstaged intent; overlapping edits retain bytes and report degradation. Staging failures emit the recovery report. Linked-worktree rebase detection resolves Git metadata paths. Successful push no longer hides divergent local-base advancement. Initial recovery-ref failure blocks reconciliation and push. Normal retained-tree exits release capture locks.

The parser reserves literal targets and requires a trailing record-file pair. Native usage and recovery-location guidance are updated. Each browser viewport owns a mutable fixture/server.

Follow-up validation: full CLI **1785 passed** on Linux/Docker; Bash compatibility **72 passed**; board unit/integration **113 passed** on Windows; browser **163 passed, 20 skipped** on Windows. Product and board builds passed. Initial parallel runs had timeout failures; subsequent full runs passed. Windows publication-suite execution and macOS acceptance are recorded separately in the review/ledger.

## Commit history

| F-block | Range |
|---|---|
| F1 | f3061ed5..ba896fb |
| F2 | ba896fb..6bcb980 |
| F3 | 6bcb980..df5e6c0 |
| F4 | df5e6c0..be6b471 |
| F5 | be6b471..7568343 |
| F6 | 7568343..3c5e0e6 |
| F7 | 3c5e0e6..b9c8041 |
| review fixes | b9c8041..dcf805c |
