# Board management for a team of agents

Read this when the project has the `board` feature enabled. Without it, ignore this file: the handoff is the
intent file and `docs/features/<id>/about.md` (section 10 of the guide).

The internal board is the source of truth. An external tracker (Notion, Jira, any app) is a mirror.

## 1. Where the board lives

- The board is an orphan `board` branch on the project's own remote. It is not in the code checkout.
- Each machine keeps one clone of it under `~/.codeadd/<project-key>/board/` (`CODEADD_BOARD_DIR` overrides the path).
- `.codeadd/board.json` (`{remote, branch}`) is the only board file the code repository tracks. Any checkout or
  worktree that has it committed can read and write the board. No separate worktree, no cloud service.
- Enabling the `board` feature creates the board: `node .codeadd/scripts/board-init.cjs` writes the config, pushes the
  orphan branch to `origin` and makes the clone. It needs an `origin` with the main branch pushed.
- Read with `node .codeadd/scripts/backlog-cli.cjs`. Write only with `node .codeadd/scripts/backlog-commit.cjs <mode>`.
  A write lands on `board`, never on your branch or `main`, so it triggers no code CI. Never edit the board files.
- The ticket's `comments` list is append-only. There is no assignee field: the assignment is a comment.

## 2. What writes automatically, what is manual

A command writes the board by itself only when the ticket is declared (`ticket:` in its documents, or `<id>` in the call).
A failed board write never fails the command: it shows as a line in the final report.

| Step | Status written |
|---|---|
| `/add-brainstorm` (not on `spike`) | `refining`, then `shaped` |
| `/add-new` | `refining` and `feature`, then `shaped` |
| `/add-plan` | `planning`, then `planned` |
| `/add-build` | `doing` and `work_id`; then `in-review`, only when it opened or updated a PR |
| `/add-hotfix` | `doing` and `work_id`; never `in-review` |
| `/add-done` | `awaiting-release` when `RELEASE_FLOW=yes`, else `done` |

Nothing validates transitions; only the phase check and the `work_id` stop skip a write.

Manual, always:

- Create a ticket (the `add--backlog` skill; no command creates one).
- Assign it: a comment `assigned: <engineer>`.
- Drop, reprioritise (`move`), or edit a ticket.
- Turn the release flow on, once per project: `backlog-commit.cjs release-flow on`.
- Close the tickets of a release: `backlog-commit.cjs release <version>`. It moves every `awaiting-release`
  ticket to `done` and overwrites its `release` with the version, in one commit. Run it only when every waiting
  ticket belongs to that version.

To write a record (a comment, a patch), create the JSON file with the agent file-write tool, as UTF-8, then pass it:

```bash
node .codeadd/scripts/backlog-commit.cjs comment <id> --record-file assign.json
```

where `assign.json` is `{"content":"assigned: <engineer>"}`. Do not build the file with `echo >`: in Windows
PowerShell 5 it writes UTF-16, and the write is refused with `REFUSED=invalid-json` (exit 2).

## 3. Who does what, and the external mirror

Whoever runs a stage updates the internal board (automatic for the commands above), then mirrors that stage to
the external board right after. There is no single mirror bot.

| Moment | Who | Internal board | External mirror |
|---|---|---|---|
| Idea recorded | PM | `add` creates the ticket as `open` | new card, status `open` |
| Shaping starts | PM, `/add-brainstorm <id>` with delivery `manual` | `refining` | status `refining` |
| Shaped | PM, `/add-brainstorm` or `/add-new` | `shaped`, `feature` set | status `shaped`, feature id |
| Docs on `main` | PM | none: commit and push the intent and `docs/features/<id>/` | none |
| Assigned | PM | comment `assigned: <engineer>` | assignee |
| Release mapping | PM | none in `release`: keep the mapping in the external board or a label | release |
| Planning | engineer, `/add-plan` | `planning`, then `planned` | status |
| Building | engineer, `/add-build` or `/add-hotfix <id>` | `doing` | status `doing` |
| PR opened | engineer, `/add-build` | `in-review` (only with a PR) | status `in-review` |
| Merged | engineer, `/add-done` | `awaiting-release` or `done` | status |
| Release published | PM | `release <version>` | status `done`, release |
| Dropped | PM | `update` to `dropped` | status `dropped` |

Each external field has one owner, so the two boards do not drift:

- Execution status (`planning` to `done`): the engineer.
- Release, priority and assignment: the PM.
- The PM decides the release mapping (which tickets go in which release). When the PM decides it in the external
  board, the PM reflects it into the internal board as a label, never in the `release` field (that field is filled only when a
  release closes the ticket).

Automatic sync between the two boards is future work and out of scope here. Section 9 of the guide describes the
`changes --since` loop a project can use to build one.

## 4. Concurrency

- Only the assignee writes a ticket. A ticket is one line of one file, so two machines writing the same ticket
  (or a `move`, which reorders lines) can conflict on rebase. Edits on adjacent lines can conflict too.
- On one machine, a write takes the clone's lock and waits up to 30 seconds. If it is still held, the write exits 1
  with `ERROR=board-locked` and writes nothing. Run the same write again.
- A read never waits: if the lock is held it prints `SYNC=skipped` and answers from the clone.
- Between machines, a refused push re-fetches, rebases once and tries again. If that fails, the write reports
  `DEGRADED=rebase-conflict` (or `push-refused`, `fetch-failed`). The commit is not lost: it stays in the clone,
  held by the ref named in `RECOVERY_REF`, and the next write tries to push it. After `rebase-conflict`, every later write on that machine degrades again until the user resolves it. Stop, report to the user, and do not resolve
  it by hand.
- Same ticket, two machines: the second write is the one that degrades. Report it; the user picks which write stands.

## 5. Gaps the commands leave to you

- A bug ticket stays `open`. The PM assigns it with the comment. The engineer runs `/add-hotfix <id>`, then
  `/add-done`. A bug ticket needs neither `shaped` nor a `feature`.
- When a ticket has more than one `assigned:` comment, the latest one wins.
- The handoff signal for a feature is the assignment comment, written after the intent and `docs/features/<id>/`
  are on `main`. A `shaped` ticket without that comment is not yet handed over.
- With no PR (`on-main` or no `gh`), `/add-build` never writes `in-review`: the ticket stays `doing` until `/add-done`.
- The PM runs `/add-brainstorm` with delivery `manual`; `automatic` would run `/add-plan` and `/add-build`, which are the engineer's.
