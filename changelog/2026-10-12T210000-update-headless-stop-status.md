# Update: headless stop status — a stop or refusal never reads as done, and the internal build creates its own branch on main

## Outcome

Both result schemas say that a run ending at a STOP, a gate or a refusal (refusing to run on `main` included) is `stopped`, and one ending on a question is `needs-approval` — never `done`. Both bot guides show the one-line check that turns any other status into a non-zero exit. The internal build, started on `main`, creates `feat/<slug>` and goes on. Ticket 0051B.

## Changes

- `framwork/.codeadd/agent-mode/result.schema.json` and `workbench/skills/add-final-report/references/result-block.schema.json`: the `status` and `reason` descriptions only. Keys, types, enum and `v` are untouched.
- `framwork/.codeadd/agent-mode/README.md` (section 1) and `result-block.md` (How to call): the bash `jq -e` check and the PowerShell `ConvertFrom-Json` check, plus one sentence that `claude -p` itself exits 0.
- `workbench/skills/add-framework--build/SKILL.md`: STEP 1.3 (now "Branch and Worktree") creates `feat/<slug>` when the build starts on `main`, never asks; STEP 9 keeps its guards and its text no longer says the skill never creates a branch.
- Tests: `L1.9` and `L1.10` in `cli/tests/agent-mode.test.js`; two tests in `scripts/tests/result-block.test.cjs`; new `scripts/tests/build-branch-on-main.test.cjs`.

## Action for installed projects

None. Run `codeadd update` to get the new guide and schema.

## Not covered

A question stays `needs-approval`, not `stopped` as the ticket worded it: the `--resume` contract hangs on it, and it fails the exit check anyway. The model filling `status` correctly, and the branch being created live, are checked only by static reads.

| Commit | F-block |
|---|---|
| c91b1b6..1ff2ef9 | F1 |
| 1ff2ef9..b87f718 | F2 |
| b87f718..092e922 | F3 |
| 092e922..0f62b04 | F4 |
| 0f62b04..0a8f78e | F5 |
| 0a8f78e..3798f63 | F6 |
| 3798f63..e17dc47 | F7 |
| e17dc47..7648d55 | review fixes |
