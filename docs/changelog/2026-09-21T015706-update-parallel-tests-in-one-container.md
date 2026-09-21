# Parallel tests in one container — both suites parallel, Windows runs them in the CI's Linux

> **Date:** 2026-09-21
> **Plan:** `docs/plans/2026-09-21T001942-PLAN--parallel-tests-in-one-container.md`
> **Layer:** both

Both test suites now run in parallel, and on Windows they run inside a Linux container that gives
the answer CI gives. On one Windows machine `npm run test:all` — vitest and bats together — takes
38–47 s and passes 1579 + 498 tests, the same count on every run. The vitest suite alone used to
take 113 s serially.

## Added

- **`scripts/run-tests.js <vitest|bats|all>`** (renamed from `scripts/run-bats.js`) — one runner for
  both suites. Native off Windows, CI included; a Linux container on Windows; exit 2 when Windows has
  no Docker daemon, rather than a silent slow fallback. In the container the checkout arrives as a
  tarball extracted onto the container's own filesystem — Docker Desktop's Windows bind mount was too
  slow for vitest walking the tree (11 timeouts). `.git` stays mounted read-only, and a git
  worktree's host-path `.git` is remapped so git works in a worktree too.
- **`cli/tests/helpers/global-setup.js`** — vitest runs `scripts/build.js` once, before any worker,
  and fails the run naming the sidecar if a test deleted or rewrote one during it.
- **`cli/tests/helpers/test-groups.js`** — reads which test files import `child_process`, on every
  run, so the serial project never needs a hand-kept list.
- **`npm run test:all`** — both suites in one invocation.

## Changed

- **`scripts/tests.Dockerfile`** (renamed from `scripts/bats.Dockerfile`) — installs the Linux
  `cli/node_modules` at build time; the host's copy on Windows holds Windows builds of vitest's native
  bindings. The image tag hashes the Dockerfile and both cli package files, so a dependency bump
  rebuilds it. Still no bats and no global git identity.
- **`cli/vitest.config.js`** — two projects instead of `fileParallelism: false`: `parallel` runs every
  file that does not spawn a subprocess, `serial` runs the spawners one at a time after it. The
  measured timings are in its comment.
- **Root `npm test`** now goes through the runner. `npm test` inside `cli/` is still plain vitest,
  which is what CI runs.
- **`.github/workflows/ci.yml`** — bats runs with `-j 4`, and GNU `parallel` is installed if the
  runner image ever lacks it.
- **Env vars** `CODEADD_BATS_RUNNER` / `CODEADD_BATS_JOBS` are now `CODEADD_TESTS_RUNNER` /
  `CODEADD_TESTS_JOBS`, with no alias.
- **`workbench/skills/add-framework-product-layer`** — the CLI gate is root `npm test` and its two
  projects; "serial or nothing" is gone. **`workbench/skills/add-framework--done`** STEP 2.3 names the
  one runner, and root `npm test`'s exit 2 is a refusal too. **`CLAUDE.md`** names the new runner.
- **`scripts/build.js`** — `copyMcpIntoCli()` takes an optional root, so a test can prove the prune on
  a temporary tree.

## Fixed

- **The cli suite's verdict depended on file order.** `mcp-packaging.test.js` ran the real
  `scripts/build.js`, which deletes and rewrites the sidecars other tests read. It now works on a
  temporary copy. A hash audit of 1338 files before and after a full run found no other test writing
  into the real tree.

## Known

- On Windows the parallel projects still time out outside the container (2 of 1578 at 5000 ms). The
  `CODEADD_TESTS_RUNNER=native` override therefore keeps vitest serial there (93 s, green).
