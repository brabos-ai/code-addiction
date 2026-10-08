# Agent-mode polish

## Outcome

`codeadd install` without a terminal now fails at once with a clear message, so scripts and CI never hang on a prompt. Four small leftovers from the agent-mode work are fixed too.

## Why

Install asks something on every road (scope, providers, the Modify/Update/Reinstall menu). With stdin not a TTY it waited forever (ticket 0027B). The `add-wiki` command cited step numbers that no longer exist (ticket 0033B). The `in-review` status said "PR open", but the build marks it before any PR may exist.

## Changes

- `cli/src/installer.js` checks `process.stdin.isTTY` before the first prompt. On an existing installation it points to `codeadd update`; otherwise it says install needs a terminal. Tests in `cli/tests/bin-entrypoint.integration.test.js` and `cli/tests/install.e2e.test.js`.
- `framwork/.codeadd/commands/add-wiki.md` points its stale step refs to `add-wiki.run-migration` and `add-wiki.build-dispatch-plan`.
- `framwork/.codeadd/skills/add--agents-md-style/SKILL.md` says the runtime policy block is 6 lines.
- `in-review` now means "build finished, PR may not exist yet; waiting for review and merge" in `docs/backlog.definitions.json`, the embedded default in `backlog-core.cjs`, the board fixtures and the schema reference.
