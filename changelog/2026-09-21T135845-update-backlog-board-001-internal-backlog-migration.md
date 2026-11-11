# Internal backlog — this repository's board moves onto the product backlog format

> **Date:** 2026-09-21
> **Plan:** `docs/plans/2026-09-21T134430-PLAN--backlog-board-001-internal-backlog-migration.md`
> **Layer:** both

First subtopic of the backlog-board set (`docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md`).
The framework's own board was a markdown file edited by hand; it is now `docs/backlog.jsonl`, written by the
same `backlog.sh` users get. This supersedes design-004 of
`2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename`, which kept the internal board in
markdown because nobody had asked — the user now has, and the board app of subtopic 002 answers the
"read it raw" reason.

## Added

- **`labels` on the ticket format** — an optional list of free strings, after `theme`, default `[]`; a value
  that is not an array is written as `[]`. `backlog.sh add` keeps it; `update` already carried any field;
  `search` does not match it. This is where the framework's own board carries its layer (`product`,
  `internal`, `both`) without a `scope` field that would be noise in a one-layer project.
- **`docs/backlog.jsonl` and `docs/backlog.definitions.json`** in this repository — tickets `0001B`–`0004B`,
  migrated from items 1.4, 1.2, 2.1 and 3.1 in that order (1.2 defers itself behind 1.4, and line order is now
  the priority). Each keeps its old number as its first note, `Formerly item N.M of docs/backlog/index.md.`
- **`backlog.bats` L4.1–L4.5** — the `labels` contract, written RED before the script changed.

## Changed

- **`workbench/commands/add-framework--backlog.md`** — reads with `backlog.sh list|search` and writes with one
  `backlog-commit.sh` call, which commits, rebases and pushes on its own route (direct on `main`, a locked
  worktree elsewhere). Operations are add, update, comment, move, close and remove; a ticket leaves the queue
  by closing, and `remove` is for a ticket written by mistake. The bounded project check, the
  no-confirmation rule and the never-guess gates are kept.
- **`add-doc-schemas/references/backlog.md`** — the `labels` row, the worked example, and the no-`scope`
  paragraph pointing at `labels`.
- **`backlog.sh`, `add-backlog`, `add-doc-schemas`** — stop counting the ticket fields.
- **`AGENTS.md`, `workbench/provider-map.json`** — the command's description and the file it operates on.

## Removed

- **`docs/backlog/index.md`** — the markdown board. `git log --follow` keeps its history.
