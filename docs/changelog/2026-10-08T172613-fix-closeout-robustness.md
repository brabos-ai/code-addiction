# Close-out robustness: tracked-only clean-tree gate and board CI timeouts

## Outcome

`/add-framework--done` no longer stops on untracked files that are not part of the delivery. The board CI job and its Playwright install step now have time limits, so a hung run ends by itself.

## Why

The close-out gate at STEP 2.3 demanded a fully clean working tree. Any stray untracked path (a scratch file, a local artefact) blocked a delivery whose tracked files were all committed (ticket 0023B). Separately, the `board` CI job had no `timeout-minutes`, so a hung Playwright install could hold the job for the default six hours (ticket 0025B).

## Changes

- `workbench/skills/add-framework--done/SKILL.md` item 2 of STEP 2.3 runs `git status --porcelain --untracked-files=no`. Uncommitted or staged changes to tracked files still stop the gate. Untracked paths are reported and do not block.
- `cli/tests/done-clean-tree-gate.test.js` holds the text of that gate; `cli/tests/inventory.test.js` was adjusted to match.
- `.github/workflows/ci.yml` gives the `board` job `timeout-minutes: 20` and the Playwright install step `timeout-minutes: 10`. `scripts/tests/test-ci-policy.test.cjs` checks both.
- `framwork/.codeadd/skills/add--backlog/references/phases.md` now says `in-review` is written by `add-build` and that the board does not check for an open PR.

## Validation

CI on head `f71494f` passed: native suites, board, CodeQL and both Analyze jobs. Test-loss guard: pass, no lost tests.
