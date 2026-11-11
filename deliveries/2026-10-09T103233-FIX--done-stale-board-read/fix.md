# Fix: done-stale-board-read

> **Kind:** fix
> **Branch:** fix/done-stale-board-read
> **Head:** 6c5bce923726680d44626d7fb32ed42ed5db61b7
> **PR:** https://github.com/brabos-ai/code-addiction/pull/122

## What changed

- `c6d7c8e` fix(done): read the ticket from origin/main, not the branch's stale board. `backlog-cli` read modes (list/search/get) take a trailing `--ref <git-ref>`, and the Ticket procedure in `add-plan-authoring` fetches origin main and reads with `--ref origin/main`.
- `6c5bce9` fix(backlog): read ticket status from origin/main in the lifecycle recipe (`add--backlog/references/lifecycle.md`).

Files:

- M `framwork/.codeadd/scripts/backlog-cli.cjs`
- M `framwork/.codeadd/skills/add--backlog/references/lifecycle.md`
- M `scripts/tests/backlog.test.cjs`
- M `workbench/skills/add-plan-authoring/SKILL.md`

## Validation

Head `6c5bce923726680d44626d7fb32ed42ed5db61b7`. Run: https://github.com/brabos-ai/code-addiction/actions/runs/37937656392

- native suites (ubuntu-latest, Node 22.19.0): success
- board: success
- CodeQL / Analyze (actions) / Analyze (javascript-typescript): success

Test-loss guard: GUARD=pass, LOST=0.
