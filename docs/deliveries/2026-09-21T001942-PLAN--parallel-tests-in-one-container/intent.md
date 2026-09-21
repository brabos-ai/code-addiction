---
path: architectural
topic: parallel-tests-in-one-container
doc: docs/brainstorming/2026-09-20T235638-parallel-tests-in-one-container.md
delivery: automatic
---

## Decided
- One runner for vitest and bats (`scripts/run-tests.js`) — one daemon probe, one image, one rule
- `cli/` deps installed in the image, Windows `node_modules` hidden by an anonymous volume — Windows native binaries do not run in Linux
- Image tag hashes the Dockerfile plus `cli/package.json` and `cli/package-lock.json`; built from a scratch context dir — a dependency bump must rebuild
- vitest builds once in `globalSetup`; no test touches real-tree sidecars; spawning files (found by `child_process` grep) run in a serial project, the rest parallel — removes the sidecar race and the measured timeout class
- CI stays native Ubuntu with the Node 20/22 matrix; bats gets `-j` on the native branch too — Ubuntu is already Linux
- Same npm script names (`test`, `test:scripts`) routed through the runner, plus `test:all`; `npm test` inside `cli/` stays plain vitest — CI calls it
- Env overrides renamed to `CODEADD_TESTS_RUNNER` / `CODEADD_TESTS_JOBS` — no user outside this repo
- The build runs in an isolated git worktree — stated by the user at approval
- The user pre-authorised opening the PR at the end of the build — stated at approval; build STEP 9 opens it without asking

## Open
None
