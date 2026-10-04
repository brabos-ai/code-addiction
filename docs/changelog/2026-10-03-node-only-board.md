# Node-only board — one backlog core, CLI and HTTP adapters (plan 2026-10-03T122024)

**Date:** 2026-10-03 · **Type:** architecture · **Layers:** both · **Plan:** `docs/plans/2026-10-03T122024-PLAN--node-only-board.md` · **Branch:** `feat/node-only-board` · **Commits:** `d4d9e0d..e54191f`

## Why

The board's Node server launched Bash, which launched another Node process merely to read backlog data. On Windows the launcher resolved bare `bash` to the WSL shim, so the UI launched and then failed its data request. Converting path separators does not fix an interpreter mismatch.

The tempting fix — extract a reader, leave writes in the shell — was rejected. It would have left the write rules trapped in `backlog.sh` and established no reusable domain boundary, so the next consumer would mean a third implementation. The user approved centralizing reads **and** writes in one Node core, reached by the agents through their existing shell commands and by the board directly through its HTTP server.

The constraint that shaped everything: **agents keep working exactly as they do today**. No agent command changes, no running service, no HTTP client. Git publication stays a separate wrapper, because choosing the route is not the same act as mutating the backlog.

## What changed

One authored implementation of backlog reads and writes now serves two adapters.

| Module | Responsibility | Depends on |
|---|---|---|
| `backlog-storage.cjs` | Ordered raw rows with line numbers, definitions provenance, byte-preserving persistence | Node built-ins |
| `backlog-core.cjs` | The seven operations, validation ordering, refusal precedence, diagnostics | adjacent storage |
| `backlog-cli.cjs` | Positional grammar, stdin records, stdout/stderr, exit codes 0/1/2 | adjacent core |

`backlog.sh` is now a wrapper: Node guard, ID allocation through `status.sh next-id B`, then delegation. `backlog-commit.sh` is untouched and still extracts `TICKET_ID`.

The board server imports the generated core at `board/runtime/backlog-core.cjs` directly. The bash subprocess, the stdout parser and the board's second definitions parser are gone. Reads still never write, and no mutation endpoint was added.

## Three decisions worth recording

**The CLI resolves its root from the caller's cwd, not from `SCRIPT_DIR`.** The plan specified `SCRIPT_DIR`. That is wrong for `backlog-commit.sh`, which calls `backlog.sh` *from the selected project or worktree* — resolving from the install location would have made the publication adapter write to the wrong board. The ledger records this reversal.

**The shipped-source guard allows three exact paths, not a directory or an extension.** Allowing `scripts/*.cjs` would have quietly re-permitted every future lintable file under `scripts/`. `cli/tests/build.test.js` pins the negatives, including a nested `scripts/nested/backlog-core.cjs` — the same basename in the wrong place must still fail.

**The board runtime is generated, and its lifecycle hooks are not optional.** A clean checkout has no `board/runtime/`, so `pretest`, `prebuild`, `pretest:e2e` and `preboard` all run the copier first. Without them the CI board job fails on a missing module — which is exactly what it did.

## Errors are now about data

The board's error panel told readers to install Git Bash or to pass `--scripts`. Both described an architecture this delivery deleted. It now reports `backlog-read-failed` and names `docs/backlog.jsonl`. `board/test/states.test.tsx` asserts the absence of that advice across every error name the server can return, so it cannot creep back.

## Files

**Created:**
- `framwork/.codeadd/scripts/backlog-storage.cjs`, `backlog-core.cjs`, `backlog-cli.cjs`
- `scripts/build-board-runtime.js`
- `cli/tests/backlog-core.test.js`, `backlog-cli.test.js`, `board-runtime.test.js`
- `board/test/states.test.tsx`

**Modified:**
- `framwork/.codeadd/scripts/backlog.sh` — reduced to a compatibility wrapper
- `framwork/.codeadd/scripts/tests/backlog.bats` — assertions retargeted at the canonical owner
- `scripts/build.js` — path-exact shipped-source allowlist
- `board/server.mjs` — imports the generated core; legacy `--scripts` accepted and ignored
- `board/package.json` — runtime preparation on every lifecycle
- `board/playwright.config.ts`, `board/vite.config.ts`, `.github/workflows/ci.yml` — no longer describe a shell-backed board
- `board/src/api/types.ts` — `BoardError` no longer lists the three shell-era failures
- `board/src/components/states.tsx` — data-read errors, no bash advice
- `board/test/server.test.ts` — shell-failure expectations replaced
- `cli/tests/build.test.js`, `build-artefact-graph.test.js`, `install.e2e.test.js`
- `.gitignore`, `package.json`, `AGENTS.md`

**Generated (never authored):** `board/runtime/backlog-core.cjs`, `board/runtime/backlog-storage.cjs`

**Deleted:** none. No reader-only helper was ever implemented, so none is claimed here as removed.

## Validation

CI is the authority for this delivery — green on `e54191f`: `board`, `test-cli` (Node 20 and 22), `test-scripts`, both `Analyze` jobs and `CodeQL`.

- `node scripts/build.js` — 247 nodes, 0 new warnings
- `cli` suite — 1681 tests
- `board` suite — 106 tests
- `backlog.bats` — 62 tests

Each behavioural test added at close-out was mutation-checked: restoring the old error copy fails `states.test.tsx`, and dropping a module from the release zip fails the install suite with `backlog-cli.cjs was not installed`.

## Known limitations

**The graph does not model JavaScript edges.** It indexes the three new modules as `product/script/*.cjs` nodes, but it has no notion of a `require()` between them, and it does not model `board/server.mjs` or top-level build tooling at all. The architecture edges here are proven by executable tests, not by the graph.

**No RED evidence was captured before implementation.** The plan asked for it; the build produced the modules and their tests together. The tests are therefore behavioural rather than regression-against-a-known-broken-state, and the mutation checks above are the substitute, not a replacement.

**`docs/plans/` is gitignored**, so the plan and ledger travel with a worktree by copy rather than by commit. STEP 6 archived both under `docs/deliveries/`, which is why they survive.