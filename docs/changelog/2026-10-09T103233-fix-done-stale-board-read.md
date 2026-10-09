# Done reads the ticket from origin/main

## Outcome

`/add-framework--done` and the other stages now read a ticket from `origin/main`, not from the branch's own copy of the board. They no longer report the `doing` and `in-review` writes as missing.

## Why

Board writes land on `main` and never on the feature branch. The branch copy of `docs/backlog.jsonl` stays as old as the branch, so it still said `planned` after the build had written `doing` and `in-review`. The close of PRs 120 and 121 reported those writes as missing for that reason.

## Changes

- `framwork/.codeadd/scripts/backlog-cli.cjs`: the read modes (`list`, `search`, `get`) take a trailing `--ref <git-ref>` and read the board and the definitions from that ref. Tests in `scripts/tests/backlog.test.cjs`.
- `workbench/skills/add-plan-authoring/SKILL.md`: the Ticket procedure fetches `origin main` and reads with `--ref origin/main`.
- `framwork/.codeadd/skills/add--backlog/references/lifecycle.md`: the product lifecycle recipe reads ticket status from `origin/main` the same way.
