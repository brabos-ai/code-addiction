# Add: a team section in the agent-mode guide and two role files

## Outcome

An owner can start a new agent with "read `.codeadd/agent-mode/roles/<role>.md` and use this framework". The guide now says how several agents share one codebase and one board. Each of the two roles says what it runs, where it stops and how it reports. `/add-help` sends a bot question about teams to those files. No command, script or fragment changes. Ticket 0054B.

## Changes

- `framwork/.codeadd/agent-mode/README.md`: new `## 10. Work as a team of agents`. It points to section 2 for the worktree and session rules instead of copying them, and adds one ticket per engineer, board writes only through `backlog-commit.cjs`, the `board-locked` retry, the stop on `rebase-conflict`, `push-refused` and `fetch-failed`, and the handoff through the intent file and `shaped`.
- `framwork/.codeadd/agent-mode/roles/product-pm.md`: new. Scope, release and priority; shapes work up to `shaped`; never implements; records the assignee as a ticket comment; checks the delivery against the acceptance criteria.
- `framwork/.codeadd/agent-mode/roles/chief-engineer.md`: new. One ticket; `/add-plan`, `/add-build`, mandatory `/add-review` before `/add-done` or `/add-pull-request`; blockers and majors resolved; minors follow the deferred flow.
- `framwork/.codeadd/commands/add-help.md`: one sentence in Type H pointing at `agent-mode/roles/`.
- `cli/tests/agent-mode.test.js`, `cli/tests/add-help.test.js`: 10 new checks (`T1.1`–`T1.8`, `T2.1`), including an install test that copies `agent-mode/roles/` byte for byte.
- `CHANGELOG.md`: one line under `[Unreleased]`.

## Action for installed projects

None. Run `codeadd update` to get the new files.

## Not covered

The assignee comment is a process rule: nothing on the board stops a second engineer from taking the same ticket. There is no reviewer role.

| Commit | F-block |
|---|---|
| fd7f856..849fa66 | F1 |
| 849fa66..d9407ce | F2 |
| d9407ce..fecfd9a | F3 |
| fecfd9a..bd15e15 | F4 |
| bd15e15..a782706 | F5 |
| a782706..d591a93 | F6 |
| d591a93..6625f76 | review fixes on F3 and F4 |
