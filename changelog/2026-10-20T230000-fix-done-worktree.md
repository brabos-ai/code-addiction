# Fix: /add-done from the feature worktree, scoped staging, build worktrees carry the framework

## Outcome

`done.cjs` runs context, `--commit-push` and the PR route (`--cleanup` included) from a linked worktree checked out on the feature branch; `--merge` still needs the primary checkout. Commit-push stages only the delivery and stops with `DIRTY_UNRELATED=<path>` on anything else. `build-setup.cjs --worktree` copies the installed `.codeadd/` and provider folders and prints `COPIED=`. Ticket 0058B.

## Changes

- `framwork/.codeadd/scripts/done.cjs`: worktree start guard by branch, `CHECKOUT=`, deferred cleanup (`WORKTREE_CLEANUP=DEFERRED`, `LOCAL_DELETE=DEFERRED`), scoped staging, shared `CLOSE_OUT_PATHS`.
- `framwork/.codeadd/scripts/build-setup.cjs`: `copyInstalled` from the `.gitignore` ADD block, per-file, never overwrites.
- `framwork/.codeadd/commands/add-done.md`, `add-build.md`, `agent-mode/README.md`: routing, stops and the two guide lines.
- `scripts/tests/done.test.cjs`, `build-setup.test.cjs`: done#060–#070, build-setup#023–#026.

## Action for installed projects

None. Run `codeadd update`.
