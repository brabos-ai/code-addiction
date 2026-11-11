# The board can wait for a release, and the agent-mode guide gains a Notion example

## Outcome

A project that opts in sees merged work wait in a `Release` column until a release names its version. A project that does not opt in behaves exactly as before. This repository's board is opted in, and its stable release closes the waiting tickets. The agent-mode guide no longer says the headless contract is Claude Code only.

## Why

A ticket read `done` the moment its PR merged, so the board could not show what waited for a release or which version shipped it. Labels had no suggested set. The guide claimed exclusivity and showed no concrete tracker. Ticket 0042B.

## Changes

- `backlog-core.cjs`: the default definitions gain the `release` column, the `awaiting-release` status (ten statuses, eight columns), five suggested labels (`feature`, `bug`, `improvement`, `docs`, `chore`; never enforced) and `release_flow: false`. `add` keeps a string `release`, else `null`.
- `backlog-cli.cjs`: every read prints `RELEASE_FLOW=yes|no` right after `BACKLOG_PRESENT`. It is `yes` only when the definitions file is usable and carries `release_flow: true`, so no command parses that file.
- Docs (`add--doc-schemas` backlog reference, `add--backlog` phases, lifecycle and skill): the new field, labels and switch; existing projects are not migrated and opt in by hand; nothing in the product closes `awaiting-release`.
- Flows: the `add-done` row and the board fragment write `awaiting-release` on `RELEASE_FLOW=yes`, else `done`; the Resume skip and the `work_id` stop accept both. The internal `add-framework--done` and `add-plan-authoring` follow the same rule, `--fix` included.
- `add-framework--release` (internal): after the tag is pushed, a stable release lists `awaiting-release`, then writes `release` (the tag name) and `done` for each ticket through `backlog-commit.cjs`. A beta skips it. A failure never undoes the release.
- Board app: a pause glyph and a magenta hue for `awaiting-release`, the Release lane hue, and a `Release` line in the ticket detail. `server.mjs` is unchanged.
- This repository's board (branch `board`, commit 9c9b991): the Release column, the status and `release_flow: true`.
- `agent-mode/README.md`: the `claude -p --json-schema` calls are an example, and Codex, OpenCode and other providers can do the same from their own documentation. Section 9 gains a short Notion mirror example. The framework still ships no tracker code.
- Tests: the seed-set tests move to ten and eight (renames carry `Test-Removed:` trailers); new tests cover the core, `RELEASE_FLOW`, the flow text, the release step, the board tokens and the guide.

## Validation

`node scripts/run-tests.js framework` green apart from one pinned-text test, which was updated and re-run green (CLI 2394 tests, scripts, package smoke). Board suite 138 tests, `npm run build:board` ok. `node scripts/build.js` clean, no warning. Behaviour checked on a temp project and on `/api/board` of this repository's board.

## Left for later

Other projects opt in by hand. The next stable release is the first to close tickets in `awaiting-release`.
