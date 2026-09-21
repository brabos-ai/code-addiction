# Plan: Parallel Tests in One Container — both suites parallel, Windows runs them in the CI's Linux

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-09-21
> **Delivery:** automatic

---

## Objective

When this is done, both test suites (cli vitest and bats) run in parallel with no
environment-caused failure, and run fast on Windows as well as on CI. The local result is the
same result CI gives.

**When this build is done:** `npm test`, `npm run test:scripts` and `npm run test:all` at the root run
through one runner that sends them into a Linux container on Windows and runs them natively
elsewhere. The vitest suite runs in parallel (subprocess-spawning files in a serial group after it),
no test mutates the real tree's sidecars, and CI runs bats with `-j`.

## Context

The user sees pipeline failures that feel environmental. Analysis of ~200 `ci.yml` runs found 10
failures, none environmental — the instability is local, which is why real drift only surfaces on CI.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-20T235638-parallel-tests-in-one-container.md` | The mechanism (runner, image, anonymous volume, globalSetup, two projects), rejected alternatives, risks |
| `docs/brainstorming/2026-09-20T235638-parallel-tests-in-one-container-intent.md` | `path: architectural`, `delivery: automatic`, every closed decision, isolated worktree, PR pre-authorised |

## Global Constraints

- The build runs in an isolated git worktree (intent file, `## Decided`)
- The user pre-authorised opening the PR at the end of the build (intent file, `## Decided`)
- Clear `NODE_OPTIONS` before shelling out to any node process (`add-artefact-graph`, Two Interfaces)
- Windows without a Docker daemon must not fall back silently to the native path — exit 2 (`scripts/run-bats.js`, `DOCKER_MISSING_MESSAGE` comment)
- The image installs no bats; the container runs the repo's pinned `./node_modules/.bin/bats` (`scripts/bats.Dockerfile`)
- The image sets no global git identity (`scripts/bats.Dockerfile`)
- `npm test` inside `cli/` stays plain `vitest run` — it is what `ci.yml` `test-cli` calls (design, Proposed Solution §5)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- A worktree must have `cli/node_modules` installed before any suite verdict (memory `cli-suite-unstable-local`)

## Problem

1. **Parallelism is off everywhere** — `cli/vitest.config.js` sets `fileParallelism: false` (applies to CI too); bats runs `-j 4` only in the Windows container, serially on CI.
2. **Turning it on fails for non-test reasons** — `cli/tests/mcp-packaging.test.js:75` runs the real `scripts/build.js`, which deletes the three sidecars first (`scripts/build.js:2123`), and writes a stale file into the real `cli/src/mcp/`; subprocess-spawning files time out under contention.
3. **Windows vitest has no container path** and is slow and load-sensitive.

## Proposal

Generalise the bats runner into one runner for both suites, extend its image with the Linux
`cli/node_modules`, make the vitest suite parallel-safe (build once, no real-tree mutation, serial
group for spawners), and turn on bats `-j` in CI. Sequence: runner and image first (they are how the
rest is exercised on Windows), isolation before parallelism, docs and measurement last.

## Current State

| Artefact | Today | Dependants |
|---|---|---|
| `scripts/run-bats.js` | bats only; native = `npx bats <glob>` with no `-j`; docker = `-j N --no-parallelize-within-files`; image built from stdin (empty context) | `package.json` `test:scripts`, `cli/tests/run-bats.test.js`, `CLAUDE.md:147` |
| `scripts/bats.Dockerfile` | node:22-bookworm-slim + git, jq, parallel | `run-bats.js` |
| `cli/vitest.config.js` | `fileParallelism: false`, long measured comment | vitest |
| `workbench/skills/add-framework-product-layer` | "Serial is not a preference" rule, `npx vitest run --no-file-parallelism`, `CODEADD_BATS_RUNNER` | `add-framework--build` (USES_SKILL) |
| `workbench/skills/add-framework--done` | STEP 2.3 names `CODEADD_BATS_RUNNER=native`, exit-2 refusal, four-command fallback | `add-framework--build` (HANDS_OFF_TO) |

## Scope

### Includes

#### Phase 1 — one runner, one image

- **F1** [internal] — `scripts/bats.Dockerfile` → `scripts/tests.Dockerfile` (`git mv`): add `COPY` of `cli/package.json` and `cli/package-lock.json` to `/code/cli/` and `npm ci` there, so the image holds Linux `node_modules` at `/code/cli/node_modules`. Rewrite the "empty build context" comment. MUST keep: no bats installed, no global git identity, git/jq/parallel present. Ref: design §Proposed Solution 2.
  - **Produces:** image path `/code/cli/node_modules`
- **F2** [internal] — `scripts/run-bats.js` → `scripts/run-tests.js` (`git mv`): takes `vitest | bats | all` (default `bats` is NOT kept — the argument is required; `package.json` always passes one). Env renamed `CODEADD_TESTS_RUNNER` / `CODEADD_TESTS_JOBS`. Image tag = hash of Dockerfile + `cli/package.json` + `cli/package-lock.json`; `ensureImage()` builds from a scratch temp directory holding only those three files. Docker run adds an anonymous volume at `/code/cli/node_modules` and `-e NODE_OPTIONS=`; before running vitest in the container it checks `cli/node_modules/.bin/vitest` exists and exits 2 with a clear message if not. Native bats gets the same `-j N --no-parallelize-within-files` (and the plain form at `-j 1`). Native vitest = `npm --prefix cli test`; container vitest = `./node_modules/.bin/vitest run` in `/code/cli`. `all` runs both in one invocation (one container on Windows), runs the second even when the first fails, and exits non-zero if either failed. The child env clears `NODE_OPTIONS`. MUST keep: exit-2 refusal on Windows with no daemon, forward-slashed mount path, argv (no outer shell) on the docker branch, `exitCodeFrom` never coercing a signal to 0, per-file arguments replacing the glob. **In the same F-block, `package.json` `test:scripts` becomes `node scripts/run-tests.js bats`**, so the rename and its only pointer move together and `npm run test:scripts` never points at a missing file.
  - **Consumes:** image path `/code/cli/node_modules` (F1)
  - **Produces:** `node scripts/run-tests.js <vitest|bats|all>`; env `CODEADD_TESTS_RUNNER`, `CODEADD_TESTS_JOBS`
- **F3** [product] — `cli/tests/run-bats.test.js` → `cli/tests/run-tests.test.js` (`git mv`): rewrite for F2. The L1.1 literal-equality case is replaced deliberately: the native bats command now carries `-j`, and the test asserts the new exact string instead. Add cases for suite selection, the tag hashing all three inputs, the anonymous volume and `NODE_OPTIONS` in the docker argv, `all` exit semantics, and the vitest-binary check. Keep L1.3 (no silent fallback) and L3.2 (no bats in the image) as they are, pointed at the renamed files. The three text assertions over other files are kept against today's text here and each is rewritten by the F-block that changes its target, so the suite is green at every boundary: L3.3 (`add-framework-product-layer`) in F11, L3.4 (`add-framework--done`) in F12, L3.5 (`CLAUDE.md`) in F13.
  - **Consumes:** `node scripts/run-tests.js <vitest|bats|all>`; env `CODEADD_TESTS_RUNNER`, `CODEADD_TESTS_JOBS` (F2)

#### Phase 2 — vitest parallel-safe

- **F4** [internal] — `scripts/build.js`: `copyMcpIntoCli()` accepts an optional root (default `ROOT`) so a test can run it against a temp tree. No behaviour change when called with no argument.
  - **Produces:** `copyMcpIntoCli(root?)`
- **F5** [product] — `cli/tests/mcp-packaging.test.js`: the "removes a stale file" case stops running `scripts/build.js` in the real tree and stops writing into the real `cli/src/mcp/`; it runs `copyMcpIntoCli(tmpRoot)` on a temp copy of `mcp/` and asserts the prune there. MUST keep the assertion it makes (a stale packaged module is removed).
  - **Consumes:** `copyMcpIntoCli(root?)` (F4)
- **F6** [product] — audit `cli/tests/**` for any other write, delete or build run against the real repository tree; fix each to use a temp copy. The list found (file, line, fix) goes into the ledger. An empty result is recorded as such.
- **F7** [product] — new `cli/tests/helpers/global-setup.js`: setup runs `node scripts/build.js` once with `NODE_OPTIONS` cleared and records a hash of each of the three sidecars; teardown re-hashes and fails the run naming the sidecar if any changed or disappeared.
  - **Produces:** `cli/tests/helpers/global-setup.js` (setup + sidecar teardown guard)
- **F8** [product] — `cli/vitest.config.js`: register F7 as `globalSetup`; declare two projects — `parallel` (every file not in the serial list, file parallelism on) and `serial` (the files that import `child_process`, found by grep at build time, one worker), ordered with `sequence.groupOrder` so `parallel` runs first and `serial` after, never concurrently. Verify the exact vitest 5 option names against current docs before writing. Replace `fileParallelism: false` and its comment with the new rule and the measurement from F14. Add a test (in `cli/tests/run-tests.test.js` or a new `cli/tests/vitest-projects.test.js`) asserting every test file importing `child_process` is in the serial project and no file is in both or neither.
  - **Consumes:** `cli/tests/helpers/global-setup.js` (setup + sidecar teardown guard) (F7)

#### Phase 3 — entry points and CI

- **F9** [internal] — `package.json`: `test` → `node scripts/run-tests.js vitest`; new `test:all` → `node scripts/run-tests.js all`. `test:scripts` already moved in F2. `setup`, `build`, `build:workbench` unchanged.
  - **Consumes:** `node scripts/run-tests.js <vitest|bats|all>` (F2)
- **F10** [internal] — `.github/workflows/ci.yml`: `test-scripts` sets `CODEADD_TESTS_JOBS` (4) and ensures GNU `parallel` is present (`command -v parallel || sudo apt-get install -y parallel`) before `npm run test:scripts`. `test-cli` unchanged apart from comments — it calls `npm test` inside `cli/`, which now runs the two projects.
  - **Consumes:** env `CODEADD_TESTS_RUNNER`, `CODEADD_TESTS_JOBS` (F2)

#### Phase 4 — docs and measurement

- **F11** [internal] — `workbench/skills/add-framework-product-layer/SKILL.md`: the "CLI artefacts" section replaces `npx vitest run --no-file-parallelism` and the "Serial is not a preference / never accept a green parallel run" rule with the runner (`npm test` at the root) and the two-project rule. In the same F-block, `cli/tests/run-tests.test.js` L3.3 is rewritten to pin the new text instead of the old. Keep the "a mental test is NOT evidence" gate.
  - **Consumes:** env `CODEADD_TESTS_RUNNER`, `CODEADD_TESTS_JOBS` (F2)
- **F12** [internal] — `workbench/skills/add-framework--done/SKILL.md` STEP 2.3 in full: `CODEADD_BATS_RUNNER` → `CODEADD_TESTS_RUNNER`; the exit-2/127 refusal now covers root `npm test` as well as `test:scripts`; the four-command local fallback uses the runner. In the same F-block, `cli/tests/run-tests.test.js` L3.4 is rewritten to the new text. Keep: "read the CI run, do not execute them here", the one-machine/one-Node-version argument, the `qa-preflight` example.
  - **Consumes:** env `CODEADD_TESTS_RUNNER`, `CODEADD_TESTS_JOBS` (F2)
- **F13** [internal] — `CLAUDE.md`: the key-files row for `scripts/run-bats.js` becomes one row for `scripts/run-tests.js` (backs `npm test`, `test:scripts`, `test:all`; native, or a Linux container on Windows). Outside the generated inventory block. In the same F-block, `cli/tests/run-tests.test.js` L3.5 is rewritten to the new path.
- **F14** [product] — measure, then record in the `cli/vitest.config.js` comment: vitest serial-native vs parallel-container on Windows, and the native Linux figure from the PR's CI run (added once CI reports). Figures with date and conditions; no invented number.

### Does NOT Include (important!)

- Detecting snapshot/diagram drift before push — those CI failures were real
- Changing what any test asserts, beyond F3's deliberate replacement of the native-command literal
- Running CI inside the container, or publishing the image to a registry
- A container path on Linux or macOS

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| One runner or two | One, `scripts/run-tests.js` | design, Key Decisions |
| How the container gets Linux deps | Installed in the image; anonymous volume hides the Windows copy | design, Proposed Solution 2 |
| When the image rebuilds | Tag hashes Dockerfile + cli package files | design, Key Decisions |
| How vitest becomes parallel-safe | Build once + no real-tree mutation + serial group for spawners | design, Proposed Solution 3 |
| Serial group runs concurrently with parallel? | No — `sequence.groupOrder`, parallel first | This plan: projects run concurrently by default, which would put spawners back under contention |
| Serial list source | `child_process` grep at build time, guarded by a test | review of the design: the config comment's list is stale |
| CI | Native Ubuntu, Node 20/22, bats `-j` | design, Key Decisions |
| Native bats literal test | Replaced, not kept | The native command changes on purpose; the old literal would pin CI to serial |
| Entry points | Same names + `test:all` | design, Key Decisions |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Local verdict matches CI, fast enough to use | Docker Desktop required for the default Windows path |
| Parallel in both suites | ~1 min image rebuild on each dependency change; per-run copy of `node_modules` into the anonymous volume |
| Sidecar race removed and guarded | Two vitest projects to keep correct |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| New spawning test lands in the parallel project | Medium | F8's project-membership test |
| Anonymous volume not filled from the image | Low | F2's vitest-binary check → exit 2 with message |
| Hidden real-tree writer flakes the parallel run | Medium | F6 audit + F7 teardown guard |
| `parallel` missing on the CI runner | Low | F10 installs it when absent |
| Container slower than native serial for vitest | Low | F14 measures; native stays reachable via `CODEADD_TESTS_RUNNER=native` |
| Vitest 5 option names differ from memory | Medium | F8 verifies against current docs before writing |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `scripts/bats.Dockerfile` → `scripts/tests.Dockerfile` | internal | rename + modify | F1 |
| `scripts/run-bats.js` → `scripts/run-tests.js` | internal | rename + modify | F2 |
| `cli/tests/run-bats.test.js` → `cli/tests/run-tests.test.js` | product | rename + modify | F3 |
| `scripts/build.js` | internal | modify | F4 |
| `cli/tests/mcp-packaging.test.js` | product | modify | F5 |
| other `cli/tests/*` found by the audit | product | modify | F6 |
| `cli/tests/helpers/global-setup.js` | product | create | F7 |
| `cli/vitest.config.js` | product | modify | F8, F14 |
| `cli/tests/vitest-projects.test.js` (if not folded into F3's file) | product | create | F8 |
| `package.json` | internal | modify | F9 |
| `.github/workflows/ci.yml` | internal | modify | F10 |
| `workbench/skills/add-framework-product-layer/SKILL.md` | internal | modify | F11 |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | F12 |
| `CLAUDE.md` | internal | modify | F13 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify it fails against the
current tree. Then drive it GREEN.

### L1 — Runner unit (`cli/tests/run-tests.test.js`)

1. `resolveRunner` honours `CODEADD_TESTS_RUNNER` both ways on both platforms; Windows with no daemon → `unavailable`. *RED: module and env var do not exist.*
2. `buildCommand` native bats at jobs 4 equals exactly `npx bats -j 4 --no-parallelize-within-files framwork/.codeadd/scripts/tests/*.bats`; at jobs 1 the plain form. *RED: native ignores jobs.*
3. Docker argv for vitest contains `-v /code/cli/node_modules`, `-e NODE_OPTIONS=`, and runs `./node_modules/.bin/vitest run` in `/code/cli`. *RED.*
4. `imageTag` changes when any of Dockerfile, `cli/package.json`, `cli/package-lock.json` changes. *RED: hashes the Dockerfile only.*
5. `all` exit code: 0 only when both suites exit 0; non-zero otherwise; second suite runs after a first failure. *RED.*
6. The Dockerfile installs no bats, sets no git identity, and runs `npm ci` for `cli/`. *RED on the third clause.*

### L2 — Isolation

1. `mcp-packaging` stale-file case leaves the real `cli/src/mcp/` and the three sidecars byte-identical (hash before/after in the test). *RED: it runs the real build.*
2. `copyMcpIntoCli(tmp)` copies and prunes inside `tmp` only. *RED: no parameter.*
3. The F7 teardown fails when a sidecar is deleted mid-run (exercise it directly with a temp sidecar dir or an injected path). *RED: guard absent.*
4. Every file importing `child_process` is in the serial project; no file in both or neither. *RED: no projects.*

### L3 — Text and wiring

1. `package.json` scripts equal the F2 (`test:scripts`) and F9 (`test`, `test:all`) strings. *RED.*
2. `ci.yml` `test-scripts` sets `CODEADD_TESTS_JOBS` and ensures `parallel`. *RED.*
3. `add-framework-product-layer` no longer contains `--no-file-parallelism` nor `CODEADD_BATS_`; `add-framework--done` names `CODEADD_TESTS_RUNNER=native`, keeps `REFUSAL to run`, `one machine`, `one Node version`, `qa-preflight`. *RED.*
4. `CLAUDE.md` names `scripts/run-tests.js` exactly once, row under 200 chars, `scripts/inventory.js --check` exits 0; no `run-bats` left anywhere outside `docs/`. *RED.*
5. `npm run setup` then the workbench build exit 0.

### L4 — Behavioural acceptance

1. On Windows with Docker: `npm run test:all` builds the image once, runs vitest in parallel then serial group, then bats `-j 4`, and both suites pass. Three consecutive runs give the same result (no variable failure count).
2. `CODEADD_TESTS_RUNNER=native npm test` still runs vitest natively on Windows.
3. The PR's CI run is green on `test-cli` (20, 22) and `test-scripts`, with bats running under `-j`.

**RED expectations against the current tree:** L1–L3 fail (new module, env, projects, text); L4 is run after F14.
**GREEN = all levels pass after F1–F14.**

---

## Execution Order

F1 [internal] → F2 [internal] → F3 [product] → F4 [internal] → F5 [product] → F6 [product] → F7 [product] → F8 [product] → F9 [internal] → F10 [internal] → F11 [internal] → F12 [internal] → F13 [internal] → F14 [product]

- **F1 before F2** — the runner hashes and builds the image F1 defines.
- **F3 right after F2** — the runner's own suite must be green before anything is run through it.
- **F4–F6 before F7–F8** — isolation lands before parallelism is switched on, so the first parallel run is not polluted by a known writer.
- **F9 after F8** — `npm test` switches to the runner only once the suite is parallel-safe.
- **F11–F13 after F9–F10** — the docs describe what exists.
- **F14 last** — it measures the finished state.

Working-state boundaries: after F3 (runner done, `test:scripts` pointing at it, vitest suite untouched), after F8 (suite parallel-safe), after F10.

Per-F-block gate beyond the layer default: after F2 and F8 run `node scripts/run-tests.js all`, after F9 run `npm run test:all`, on Windows through the container (`cli/node_modules` installed in the worktree first).

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, validation levels and pass state, any departure from the design with the section and reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A spawning test file left in the parallel project because the grep missed a dynamic import.
3. A remaining `run-bats` / `CODEADD_BATS_` string outside `docs/`.
4. F6 reported "none found" without the search command recorded.
5. F14 figures that were not measured in this build.

## References

- Design set: `docs/brainstorming/2026-09-20T235638-parallel-tests-in-one-container.md`, `…-intent.md`
- Prior art: `2026-09-10T230600-PLAN--fast-local-bats` — the container runner; `2026-09-11T005514-PLAN--vitest-fixture-scope` — the fixture cut and the serial measurement

---

## Next Steps

/add-framework--build parallel-tests-in-one-container

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-21 | Initial creation |
| 2026-09-21 | Review fix-then-ok: `test:scripts` pointer moves in F2 with the rename; F2/F8 gates call the runner directly; L3.3/L3.4/L3.5 rewrites assigned to F11/F12/F13; dropped F11's env-var clause (nothing to rename there) |
| 2026-09-21 | Implemented on feat/parallel-tests-in-one-container, commits 1d7da0a..912ac00 (F1–F14, layer-split companions F8a/b–F13b, and three review fixes). Departures recorded as rulings in the ledger: tarball copy instead of a bind mount, worktree git remap, serial native-Windows override |
