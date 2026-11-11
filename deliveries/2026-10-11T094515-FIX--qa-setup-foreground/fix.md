# Fix: qa-setup-foreground

> **Kind:** fix
> **Branch:** fix/qa-setup-foreground
> **Head:** e7740b01d74d897992fc9b089d163bda458aa5c4
> **PR:** https://github.com/brabos-ai/code-addiction/pull/132
> **Ticket:** 0046B

## What changed

- `e7740b0` fix(add-qa-setup): boot app as managed process and read dispatch-rules — the boot line in `add-qa-setup` now says "managed process", the migration dispatch reads `dispatch-rules.md`, and the contract shape and `changed_in` were updated.

Files:
- M cli/tests/build-contracts.test.js
- M cli/tests/lighter-product-qa.test.js
- A docs/changelog/2026-10-11T130000-fix-qa-setup-foreground.md
- M framwork/.codeadd/commands/add-qa-setup.md

## Validation

Head e7740b01d74d897992fc9b089d163bda458aa5c4. CI run https://github.com/brabos-ai/code-addiction/actions/runs/38140515965:

- native suites (ubuntu-latest, Node 22.19.0): success
- board: success
- CodeQL, Analyze (actions), Analyze (javascript-typescript): success
- test-loss guard: GUARD=pass, LOST=0
- AGENTS.md inventory: already current
