# Compact backlog reads

## Outcome

Reading the backlog now costs a summary and returns detail only on request. `list` and `search`
print a seven-field JSONL summary — `id, status, title, tldr, theme, labels, updated_at` — with a
`tldr` preview cut at 120 code points, and every read carries `READ_VIEW` and a whole-board
`STATUS_COUNTS`. A new `get <id>` returns one ticket's complete raw row, and `search` now also
answers an exact ticket id over every status.

## Breaking change and migration

A reader that parses `list`/`search` output for `notes`, `paths`, `done_when` or `work_id` gets
nothing there now. Read the ticket first:

```
node .codeadd/scripts/backlog-cli.cjs get <id>          # exact, case-sensitive, no filter
node .codeadd/scripts/backlog-cli.cjs list --full       # raw rows, byte-identical to the old output
node .codeadd/scripts/backlog-cli.cjs list --ids        # one id per line, filter and order preserved
```

`get` of an unknown id, and of an absent board, is a successful read: exit 0, `TICKETS_RETURNED=0`,
no file created. `get` with no id is `ERROR=missing-id`, exit 2. Reads accept one filter
(`--all` or `--status <name>`) plus one projection (`--full` or `--ids`), in any order; a repeat,
a conflict, an unknown option or surplus argument is `ERROR=bad-argument`, exit 2. Writes, their
record channel and the publication entry are unchanged, and the publication entry refuses `get`
by name with `ERROR=read-mode` like `list` and `search`.

## Changes

- Core gains `get`, exact id equality in `search`, and ordered global `statusCounts` entries
  computed before any filter. Raw rows and stored records are unchanged, so the board API keeps
  serving complete tickets.
- The CLI owns the projection: summaries are presentation only and nothing is persisted.
- Five product owners and the two internal ones document the read contract; product and internal
  lifecycles resolve a declared id with `get` and a subject or old number with an all-status
  `search` followed by `get`.
- On a 21-ticket fixture, `list --all` summary payloads are 12× smaller than the full rows.