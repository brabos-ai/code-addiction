# Brainstorm: Parallel Tests in One Container

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-20
> **Type:** architecture

## Objective

When this is done, both test suites (cli vitest and bats) run in parallel with no
environment-caused failure, and run fast on Windows as well as on CI. The local result is the
same result CI gives.

## Discovery

- `scripts/run-bats.js` + `scripts/bats.Dockerfile` — shipped by `2026-09-10T230600-PLAN--fast-local-bats`
  (live). Routes bats into a Linux container on Windows, `-j 4`; native everywhere else. Image tag is
  the Dockerfile's hash; empty build context; runs the repo's pinned `./node_modules/.bin/bats`.
- `cli/vitest.config.js` — `fileParallelism: false`, with the measurement: on a loaded Windows machine
  parallel was 153s / 12 failures vs serial 208s / 2. All twelve were subprocess timeouts in files
  that spawn a process. The seven files that comment names have already drifted: a `child_process`
  grep today returns a different set. The old EBUSY shared-fixture race is recorded as fixed.
- `2026-09-11T005514-PLAN--vitest-fixture-scope` (live) — took the quiet serial run from 164s to ~80s
  by scoping `qa-reachability`'s tree copy to the tests that open it.
- `cli/tests/mcp-packaging.test.js:75` — runs the real `scripts/build.js` in the real tree. `build.js`
  deletes all three sidecars first (`scripts/build.js:2123`); a build that aborts leaves them absent,
  and every later test that reads a sidecar fails. This is the recorded cause of 6/13/47/28 failures
  on one unchanged commit (memory `cli-suite-unstable-local`).
- CI history (last ~200 `ci.yml` runs): 10 failures, **none environmental** — 7 snapshot/diagram drift
  (`build-artefact-graph` inventory snapshot, `graph-mermaid` checked-in diagram), 2 command-text
  assertions, 1 vitest 4→5 bump, 1 bats. They reached CI because the local run is not trusted, so CI
  was the first run that counted.

## Context & Motivation

The user sees pipeline failures that feel environmental. The analysis shows the environment problem
is local: the Windows vitest run is slow (serial, 80–208s) and unstable (shared real-tree state,
subprocess timeouts under load, `NODE_OPTIONS` debugger banner). Because it is not trusted it gets
skipped, and real drift surfaces only in CI. bats already solved the same problem with a container;
vitest never got it.

## Problem / Opportunity

1. **Parallelism is off everywhere** — vitest is serial locally and on CI (the config applies to
   both); bats runs `-j 4` locally but serial on CI.
2. **Turning it on today fails** — shared real-tree state (the sidecars) and Windows process-spawn
   cost produce failures that are not test failures.
3. **Windows is slow** for vitest and has no container path.

## Proposed Solution

**Recommended — one runner, one image, safe parallelism:**

1. **Generalise the runner.** `scripts/run-bats.js` becomes `scripts/run-tests.js <vitest|bats|all>`.
   Runner resolution is unchanged: native off Windows, container on Windows when the daemon answers,
   exit 2 when it does not, `CODEADD_TESTS_RUNNER=native|docker` overrides (the old
   `CODEADD_BATS_RUNNER` is renamed — it has no user outside this repo).
2. **One image carries the Linux `cli/node_modules`.** The Dockerfile runs `npm ci` for `cli/` at build
   time. Because the repo is bind-mounted over `/code`, the run adds an anonymous volume at
   `/code/cli/node_modules` so Docker fills it from the image and the Windows copy (with Windows
   rollup/esbuild binaries) stays hidden. The image tag hashes the Dockerfile **plus
   `cli/package.json` and `cli/package-lock.json`**, so a dependency change rebuilds it. Today
   `ensureImage()` pipes only the Dockerfile over stdin (`docker build -t tag -`), an empty context a
   `COPY` cannot resolve against. It changes to build from a scratch temp directory holding only the
   Dockerfile and those two files, so the repo and its `node_modules` still never cross the file bridge.
   The Dockerfile's "empty build context" comment is rewritten to match.
3. **Make vitest parallel-safe.**
   - A vitest `globalSetup` runs `scripts/build.js` once, before any worker starts.
   - No test deletes or rewrites a sidecar in the real tree. `mcp-packaging`'s build test, and any
     other test found running the real build, operates on a temporary copy.
   - `cli/vitest.config.js` declares two projects: the subprocess-spawning files run serially; every
     other file runs in parallel. The serial set is whatever imports `child_process` at implementation
     time — found by grep, never copied from the config's current comment, which is already stale. `fileParallelism: false` and its comment are replaced by the new
     measurement.
   - The container and the runner clear `NODE_OPTIONS`.
4. **CI stays native Ubuntu, gains parallelism.** `test-cli` keeps the Node 20/22 matrix and calls
   `npm test` inside `cli/` (plain vitest, now two projects). `test-scripts` runs bats with `-j`. Today
   `buildCommand()` adds `-j` only on the docker branch; the native branch gains it too, reading the
   same jobs setting. `CODEADD_BATS_JOBS` becomes `CODEADD_TESTS_JOBS` and sets bats `-j` on both
   branches; vitest keeps its own worker default.
5. **Entry points keep their names.** Root `npm test` → `run-tests.js vitest`; `npm run test:scripts` →
   `run-tests.js bats`; new `npm run test:all` runs both in one runner invocation (one container start on Windows, both
   native elsewhere). `npm test` inside
   `cli/` stays plain vitest — that is what CI calls.

**Alternatives rejected:**

| Alternative | Why not |
|---|---|
| Separate `run-vitest.js` beside `run-bats.js` | Duplicates the daemon probe, image and hash tag |
| Named volume + `npm ci` on lockfile change | User chose installing into the image |
| `npm ci` on every run | 30–60s per run eats the speed gain |
| Fix state only, everything parallel | Bets that Linux removes the spawn timeouts without measuring |
| Serial group only, no state fix | The sidecar-deleting test still breaks whatever runs after it |
| CI inside the same image | Loses the Node 20 leg or needs two images; image build per run |
| Keep vitest native on Windows | Stays slow and load-sensitive |

## Type of Artefact

architecture — test infrastructure (runner script, Dockerfile, vitest config, CI workflow) plus the
internal skills that describe how the suites run.

## Scope

### Includes
- `scripts/run-bats.js` → `scripts/run-tests.js` (vitest | bats | all), its test file renamed with it;
  `-j` on the native branch; build from a scratch context directory
- `scripts/bats.Dockerfile` → one test image (rename to `scripts/tests.Dockerfile`) with `cli/` deps;
  its empty-context comment rewritten
- `cli/vitest.config.js` — globalSetup build once, two projects (serial spawners, parallel rest)
- `cli/tests/mcp-packaging.test.js` and any other test that writes the real tree — move to a temp copy
- An audit of `cli/tests/` for real-tree writes, done in the build and recorded
- `package.json` scripts: `test`, `test:scripts`, new `test:all`
- `.github/workflows/ci.yml` — bats `-j`; vitest already parallel via config
- `workbench/skills/add-framework-product-layer/SKILL.md` — replace the "serial or nothing" rule and
  `npx vitest run --no-file-parallelism` with the runner
- `workbench/skills/add-framework--done/SKILL.md` — STEP 2.3 in full: the `CODEADD_BATS_RUNNER`
  references, the exit-2/127 refusal semantics, and the four-command local fallback, now that root
  `npm test` also routes through the container on Windows
- `CLAUDE.md` — the `scripts/run-bats.js` key-files row
- A before/after timing measurement on Windows (container) and CI, recorded in the config comment

### Does NOT Include
- Snapshot/diagram drift detection before push — those CI failures were real, not environmental
- Changing any test's assertions
- Publishing the image to a registry
- Running CI inside the container
- A Linux/macOS container path (native stays native there)

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| One runner for both suites | "fast on Windows" | One probe, one image, one rule; bats already proved it | ✅ |
| Deps installed in the image, shadowed via anonymous volume | "fast on Windows" | Windows `node_modules` carries Windows native binaries that do not run in Linux | ✅ |
| Image tag hashes Dockerfile + cli package files | "same result as CI" | A dependency bump must rebuild, or the container grades on stale deps | ✅ |
| Build once in globalSetup; no test touches real sidecars | "no environment-caused failure" | The sidecar deletion is the recorded cause of the variable failure counts | ✅ |
| Serial project for the 8 spawning files, parallel for the rest | "run in parallel" | Keeps the measured timeout class out of the parallel pool without betting on Linux | ✅ |
| CI stays native, gains parallelism | "fast on CI" | Keeps the Node 20/22 matrix; Ubuntu is already Linux | ✅ |
| Same npm script names | "same result as CI" | Skills and habits keep working; the default path becomes the fast one | ✅ |
| Env overrides renamed to `CODEADD_TESTS_RUNNER` / `CODEADD_TESTS_JOBS` | "run fast" — clarity only | It now covers both suites; no user outside this repo | ✅ |

## Ecosystem Impact

| Component | Layer | Called by | Impact | Action |
|-----------|-------|-----------|--------|--------|
| `scripts/run-bats.js` | internal | NOT VERIFIED — not a graph node (top-level `scripts/`). Grep: `package.json`, `cli/tests/run-bats.test.js`, `CLAUDE.md`, `add-framework-product-layer` | Renamed and generalised | Rename, update every grep hit |
| `scripts/bats.Dockerfile` | internal | NOT VERIFIED — not a node. Read only by `run-bats.js` | Becomes the shared test image | Rename, add cli deps |
| `cli/vitest.config.js` | product (cli) | NOT VERIFIED — not a node. Read by vitest | Parallel projects + globalSetup | Rewrite |
| `cli/tests/mcp-packaging.test.js` | product (cli) | NOT VERIFIED — not a node | Stops writing the real tree | Temp copy |
| `.github/workflows/ci.yml` | internal | NOT VERIFIED — not a node | bats `-j` | Edit |
| `package.json` (root) | internal | NOT VERIFIED — not a node | Scripts rewired | Edit |
| `workbench/skills/add-framework-product-layer` | internal | `add-framework--build` (USES_SKILL) | Its serial rule becomes wrong | Rewrite the CLI-suite section |
| `workbench/skills/add-framework--done` | internal | `add-framework--build` (HANDS_OFF_TO) | Describes the bats container | Update the passage |
| `CLAUDE.md` | internal | NOT VERIFIED — not a node | Key-files row names `run-bats.js` | Edit by hand |

Neither skill has fragments injected into it, so one `impact --depth 1` query each is complete.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Local run matches CI and is fast enough to use | Docker Desktop becomes required for the default Windows path |
| Parallel on both suites, both places | A dependency change costs one image rebuild (~1 min) |
| The sidecar race is gone, not hidden | Two vitest projects to keep correct as files are added |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A new test spawns a process but lands in the parallel project | Med | A test asserts every file that imports `child_process` is in the serial project |
| Anonymous volume not filled from the image on some Docker version | Low | Runner verifies `node_modules/.bin/vitest` exists in the container before running; fails with exit 2 and a clear message |
| Another hidden real-tree writer causes parallel flakes | Med | The build's audit, plus a guard: globalSetup hashes the sidecars and a teardown check fails the run if they changed |
| Container on bind mount is slower for vitest file I/O than expected | Low | Measure; if slower than native serial, record it and keep native as the override |

## Next Steps

Run: `/add-framework--plan parallel tests in one container`
