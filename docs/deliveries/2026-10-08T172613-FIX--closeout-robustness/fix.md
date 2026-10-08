> **Kind:** fix
> **Branch:** fix/closeout-robustness
> **Head:** f71494f45b9a356fa9ef316e86a8695d3e95ffe4
> **PR:** https://github.com/brabos-ai/code-addiction/pull/117
> **Ticket:** 0023B

# Fix: closeout-robustness

## What changed

Commits (`git log --oneline main..HEAD`):

- `b0e005c` ci(board): add timeout-minutes to the board job and Playwright install — a hung board job can no longer hold CI open (ticket 0025B).
- `77af190` fix(done): clean-tree gate stops only on tracked changes — unrelated untracked paths no longer block STEP 2.3 of the close-out (ticket 0023B).
- `f71494f` docs(backlog): in-review no longer claims the board checks for an open PR — the backlog phases reference now matches what the board does.

Files (`git diff --name-status main...HEAD`):

- M `.github/workflows/ci.yml`
- A `cli/tests/done-clean-tree-gate.test.js`
- M `cli/tests/inventory.test.js`
- M `framwork/.codeadd/skills/add--backlog/references/phases.md`
- M `scripts/tests/test-ci-policy.test.cjs`
- M `workbench/skills/add-framework--done/SKILL.md`

## Validation

Head `f71494f45b9a356fa9ef316e86a8695d3e95ffe4`. Run https://github.com/brabos-ai/code-addiction/actions/runs/37839497468

- native suites (ubuntu-latest, Node 22.19.0): success
- board: success
- CodeQL, Analyze (actions), Analyze (javascript-typescript): success
