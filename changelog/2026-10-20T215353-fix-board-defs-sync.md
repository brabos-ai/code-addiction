# Fix: an existing board definitions file gains the default statuses it lacks

## Outcome

An old `docs/backlog.definitions.json` on the board branch no longer blocks the pipeline. Statuses added to the defaults after the file was seeded (`refining`, `shaped`, `planning`, `planned`, `in-review`, and `awaiting-release` when `release_flow` is on) are added, so writes naming them stop being refused as `unknown-status`. Ticket 0057B.

## Changes

- `framwork/.codeadd/scripts/backlog-core.cjs`: `addBeforeDone` became `addInDefaultOrder` (insert before the first existing default successor; identical result for `awaiting-release` before `done`). New pure `mergeDefaultStatuses(defs)` and a `sync-defs` mode. `add` / `update` naming a missing default merge first and write the definitions last, after every other check. Entries the user wrote are never edited; only `order` shifts.
- `framwork/.codeadd/scripts/backlog-cli.cjs`: `sync-defs` in the grammar, refused as a write (`ERROR=write-mode`).
- `framwork/.codeadd/scripts/backlog-commit.cjs`: publishes `sync-defs` (`backlog: sync-defs (<n> statuses)`, `DEFS_ADDED=`); a merging `add` / `update` reports `DEFS_ADDED=` and commits both board files in one commit.
- `cli/src/migrations.js`: migration `0004-sync-board-definitions` runs the installed `backlog-commit.cjs sync-defs` (120 s bound). No board configured is applied silently; any board error throws and stays pending.
- Docs: `add--doc-schemas/references/backlog.md`, `add--backlog/SKILL.md`, `add--backlog/references/phases.md` no longer say nothing reconciles an old file.
- Tests: `cli/tests/backlog-core.test.js`, `backlog-cli.test.js`, `migrations.test.js`, `scripts/tests/backlog-commit.test.cjs` (#017-#022).

## Action for installed projects

Run `codeadd update` or `codeadd migrate`. A project with a board gets one commit on the `board` branch if its definitions lack a default status.
