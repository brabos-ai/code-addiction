# Changelog: Node-only board — one backlog core, CLI and HTTP adapters

**Date:** 2026-10-03
**Plan:** docs/plans/2026-10-03T122024-PLAN--node-only-board.md
**Branch:** feat/node-only-board
**Commits:** f669105..12219cc

## What changed

Extracted all backlog operations from `backlog.sh` into one canonical Node core consumed by both the agent CLI and the board HTTP server. The board no longer spawns Bash to read backlog data.

## Architecture

Three flat product modules under `framwork/.codeadd/scripts/`:

| Module | Responsibility |
|--------|---------------|
| `backlog-storage.cjs` | Read raw ordered rows and definitions; seed missing definitions; persist rows |
| `backlog-core.cjs` | Defaults, list/search/add/update/comment/move/remove, validation, diagnostics |
| `backlog-cli.cjs` | Positional grammar, stdin, stdout/stderr, exit codes |

`backlog.sh` is now a compatibility wrapper: Node guard, ID allocation via `status.sh next-id B`, and CLI invocation. `backlog-commit.sh` remains the unchanged Git-publication adapter.

The board server imports the generated core at `board/runtime/backlog-core.cjs` directly — no subprocess, no stdout parser.

## Files

**Created:**
- `framwork/.codeadd/scripts/backlog-storage.cjs`
- `framwork/.codeadd/scripts/backlog-core.cjs`
- `framwork/.codeadd/scripts/backlog-cli.cjs`
- `scripts/build-board-runtime.js`
- `cli/tests/backlog-core.test.js`
- `cli/tests/backlog-cli.test.js`
- `cli/tests/board-runtime.test.js`

**Modified:**
- `framwork/.codeadd/scripts/backlog.sh` — reduced to compatibility wrapper
- `scripts/build.js` — shipped-source allowlist for three CJS modules
- `.gitignore` — ignore `board/runtime/`
- `board/server.mjs` — import generated core directly
- `board/package.json` — preboard hook
- `board/playwright.config.ts` — remove --scripts arg
- `package.json` — remove --scripts, add preboard hook
- `AGENTS.md` — describe generated core architecture

**Generated (not authored):**
- `board/runtime/backlog-core.cjs`
- `board/runtime/backlog-storage.cjs`

## Validation

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` — 247 nodes, 972 edges, 0 new warnings
- `cli/tests/backlog-core.test.js` — 16 tests pass
- `cli/tests/backlog-cli.test.js` — 6 tests pass
- `cli/tests/board-runtime.test.js` — 3 tests pass
