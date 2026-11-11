# Fix: agent-mode-polish

> **Kind:** fix
> **Branch:** fix/agent-mode-polish
> **Head:** 718209614b5e507e746320698c6b484170ec4f66
> **PR:** https://github.com/brabos-ai/code-addiction/pull/119
> **Ticket:** 0033B

## What changed

- `84d6c80` fix(add-wiki): point stale step refs to current step ids (ticket 0033B).
- `b974554` docs(agents-md-style): the runtime policy block is 6 lines.
- `3d6d8ca` fix(cli): install without a TTY exits with an error instead of prompting (ticket 0027B).
- `0fd546c` docs(backlog): in-review means the build finished, the PR may not exist yet.
- `7182096` docs(backlog): align the in-review meaning in the embedded default, fixtures and schema reference.

Files:

```
M	board/e2e/fixture.ts
M	board/test/routes.test.tsx
M	cli/src/installer.js
M	cli/tests/bin-entrypoint.integration.test.js
M	cli/tests/install.e2e.test.js
M	docs/backlog.definitions.json
M	framwork/.codeadd/commands/add-wiki.md
M	framwork/.codeadd/scripts/backlog-core.cjs
M	framwork/.codeadd/skills/add--agents-md-style/SKILL.md
M	framwork/.codeadd/skills/add--doc-schemas/references/backlog.md
```

## Validation

Head `718209614b5e507e746320698c6b484170ec4f66`, CI accepted (not the local fallback). Run: https://github.com/brabos-ai/code-addiction/actions/runs/37859410667

- native suites (ubuntu-latest, Node 22.19.0): success
- board: success
- CodeQL / Analyze (actions, javascript-typescript): success
- test-loss guard: GUARD=pass, LOST=0, NOTED=0
