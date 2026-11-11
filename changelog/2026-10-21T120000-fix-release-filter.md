# Fix: release closes only its own tickets, commit-push accepts `git rm`

## Outcome

`backlog-commit.cjs release <version>` no longer closes a waiting ticket marked for another version. `done.cjs --commit-push` no longer fails on a delivery file removed with `git rm`. Ticket 0059B.

## Changes

- `framwork/.codeadd/scripts/backlog-core.cjs`: release mode skips an `awaiting-release` ticket whose `release` field or `release:<x>` label names a different version. `v0.6.0` equals `0.6.0` when comparing; the version is written as given.
- `framwork/.codeadd/scripts/backlog-commit.cjs`: reports `TICKETS_SKIPPED=<comma ids>` next to `TICKETS_RELEASED`. The commit message count stays the released count. Header and usage updated.
- `framwork/.codeadd/scripts/done.cjs`: staged deletions are left out of the `git add` list (the index already holds them), and the commit still runs when the index has staged changes.
- `scripts/tests/backlog-commit.test.cjs`, `done.test.cjs`: backlog-commit#023, done#071.

## Action for installed projects

None. Run `codeadd update`.
