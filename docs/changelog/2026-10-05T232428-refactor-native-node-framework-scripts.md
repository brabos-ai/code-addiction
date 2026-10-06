# Refactor: native Node framework scripts

**Date:** 2026-10-05
**Plan:** `2026-10-05T152826-PLAN--native-node-framework-scripts`
**Ticket:** 0022B

## What changed

Every framework-owned shell capability is now a native Node entry. The 19 shipped
`framwork/.codeadd/scripts/*.sh` and the 3 root `scripts/*.sh` (smoke, release, tag) are gone,
replaced by built-ins-only `.cjs` modules that preserve the public arguments, output fields,
exit codes, persisted formats and failure behaviour of the shells they replace. The product Bats
test transport is retired and every one of its 546 cases is ported to the built-in `node:test`
runner under `scripts/tests/`, with a tracked case map that records each case's disposition.

The delivery index is now read in-process. `scripts/graph.js` requires the side-effect-free
`delivery-index-core.cjs` instead of spawning `bash`, and `mcp/engine.mjs` does the same for both
`history` and `touched`. The graph and the MCP still answer identically because they read the same
emitted index, asserted rather than shared.

One shared allocator (`backlog-id.cjs`) sits under `next-id.cjs`, `status.cjs` and the init seed, so
`NEXT_ID_AGREE` compares Node against Node. All 13 product commands, 17 product skills, 3 agents,
4 fragments and the workbench guidance now invoke `node .codeadd/scripts/<entry>.cjs`.

## Why

Shell-mediated Node resolution and worktree path handling failed on Windows, and Bats process
creation made Windows runs exceed thirty minutes; the root tooling defaulted to a Linux container.
The migration removes Bash, WSL, Git-Bash and Docker as requirements for installing, running, and
testing the framework on Windows, macOS and Linux.

## How it is proven

- Each native entry is pinned by the ported Bats cases, run through `node --test`.
- `npm run test:scripts` is native: 627 tests, 624 pass, 3 platform-conditional skips, 0 fail.
- `npm test` runs the CLI suite on the native runner across the six-job CI matrix
  (Windows/macOS/Linux × Node 22.19.0/24).
- `migration-acceptance.test.cjs` is fully green: no shipped or root `.sh`, no Bats tree, native
  `test:scripts`, and no active `bash .codeadd/scripts/*.sh` invocation.
- `scripts/no-bash-guard.js` shadows `bash` for the test children and proves, with a negative
  control, that a Bash route is rejected while native Git and npm transport still work.

## Compatibility

Node `>=22.19.0` becomes the unified floor (Node 24 recommended), declared in the root, `cli`,
`board` and `web` manifests. Node 18/20 and older Node 22 are no longer supported. One public
contract changed deliberately: the allocator refuses at `9999` (`id-exhausted`, exit 1) instead of
the retired shell's five-digit rollover.

## Commits

The delivery lands as one commit per F-block on `feat/native-node-framework-scripts`, from the
test-foundation commits through the runtime entries, the caller cutover, shell retirement, the
native runner, CI and documentation. The full range and every ruling are recorded in the plan's
ledger.
