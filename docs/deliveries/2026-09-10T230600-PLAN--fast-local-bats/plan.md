# Plan: Fast local bats — a container runner for the Windows dev machine

> **Status:** implemented
> **Layers:** both
> **Type:** script
> **Created:** 2026-09-10

---

## Context

The bats suite takes about 69 minutes on the Windows machine this framework is developed on, and 63
seconds on Linux CI. It also reaches a *different* answer there: `qa-preflight.bats` fails on Windows
and nowhere else, because a `node_modules` above `TMPDIR` resolves a package the test asserts is
absent. A suite that slow and that wrong is a suite nobody runs, which is why no F-block gate for
`.sh` changes exists today.

The technique that fixes it has already worked here once. The ledger of
`2026-09-10T203053-PLAN--close-out-hardening` records a ruling that ran the bats suites inside a
`linux/amd64` container against the mounted repository: `delivered.bats` fell from over 12 minutes to
18.7 seconds, the whole suite ran in 1m58s with 386 passing, and the `qa-preflight` false failure did
not occur. That ruling left no script and no gate. **This plan is that ruling made permanent.**

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-10T224647-fast-local-bats.md` | The full measurement table, the three rejected alternatives, the eleven validated decisions with their rationale, and the risk register |

## Global Constraints

- The container runs the repository's own pinned bats — `./node_modules/.bin/bats`, version `1.13.0` — never a distribution package, which is `1.8.2` on Debian bookworm (design doc, Key Decisions)
- The image sets no global git identity, because the GitHub runner has none (design doc, Key Decisions)
- The non-Windows branch runs `npx bats framwork/.codeadd/scripts/tests/*.bats` serially, byte-identical to the current value of `test:scripts` (design doc, Does NOT Include)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- `cd cli && npx vitest run --no-file-parallelism` — serial or nothing (`add-framework-product-layer`)

## Problem

1. **The whole-suite bats verdict is unavailable locally.** 69 minutes is not an iteration loop. The
   only trustworthy verdict is CI's, which arrives after a pull request exists.
2. **The native Windows run disagrees with the merge gate.** One test fails there for an environmental
   reason, so even the slow local answer cannot be trusted without knowing which failure to ignore.
3. **A `.sh` change reaches the pull request with no local evidence.** There is no per-F-block bats
   gate because such a gate would be unenforceable at 69 minutes.
4. **The fix exists but is not reusable.** It lives as prose in one delivered ledger. Nobody can type it.

## Proposal

Replace the literal `npx bats` line in `package.json` with a small node wrapper that picks the runner
from the platform. On Linux it runs today's command unchanged, so CI is untouched. On Windows it runs
the suite inside a Linux container built from a committed Dockerfile, with the repository bind-mounted
and the project's own pinned bats executed from the mounted `node_modules`. Without Docker on Windows
it fails loudly and points at CI, rather than falling back to the 69-minute path.

Then the per-F-block gate that was previously unenforceable becomes enforceable, and lands beside the
serial-vitest gate that already governs `cli` changes.

Sequencing: the RED matrix first, then the runner, then the three documentation edits that depend on
the runner existing.

## Current State

| Artefact | Today | Depth-1 dependants |
|---|---|---|
| `package.json` → `test:scripts` | `npx bats framwork/.codeadd/scripts/tests/*.bats` | — (the CI job calls it) |
| `.claude/skills/add-framework-product-layer/SKILL.md` | Serial-vitest gate for `cli`; no gate for `.sh` | 1 (`add-framework--build`) |
| `.claude/commands/add-framework--done.md` | Its STEP 2.3 justification quotes "over an hour on Windows" | 0 |
| `CLAUDE.md` | No mention of how the suites are run | not modelled by the graph |
| `.github/workflows/ci.yml` → `test-scripts` | `npm run test:scripts` on `ubuntu-latest` | — |

## Scope

### Includes

- **F1** [product] — `cli/tests/run-bats.test.js`: the RED matrix for the wrapper. Asserts the runner
  choice per platform, the two environment overrides, the image tag derivation, the Docker-absent
  error, and that the non-Windows command string equals the string `test:scripts` holds today. **Must
  not** shell out to Docker or run the bats suite — it tests the wrapper's decisions, not its output.
  *RED today: `scripts/run-bats.js` does not exist.*

- **F2** [internal] — `scripts/bats.Dockerfile`: create. `node:22-bookworm-slim` plus `git`, `jq`,
  `parallel` and `ca-certificates`. **Must not** install `bats` and **must not** set any
  `git config --global`. Both omissions are load-bearing and belong in a comment in the file, because
  each looks like an oversight to the next reader.
  - **Produces:** the path `scripts/bats.Dockerfile`, which the wrapper hashes and builds from

- **F3** [internal] — `scripts/run-bats.js`: create. Detects the platform, resolves the runner, builds
  the image when absent, runs the suite, and forwards the child's exit code unchanged. Announces which
  runner it chose and why before running anything. **Must not** swallow a non-zero exit, and **must
  not** fall back from Docker to native on its own.
  - **Consumes:** `scripts/bats.Dockerfile` (F2)
  - **Produces:** `CODEADD_BATS_RUNNER=native|docker`, `CODEADD_BATS_JOBS=<n>`, and the image tag
    `codeadd-bats:<first 12 hex of the sha256 of scripts/bats.Dockerfile>`

- **F4** [internal] — `package.json`: `test:scripts` becomes `node scripts/run-bats.js`. **Must not**
  gain a sibling script — the single entry point is the decision.
  - **Consumes:** `node scripts/run-bats.js` (F3)
  - **Produces:** `npm run test:scripts` resolves to a platform-correct runner

- **F5** [internal] — `.claude/skills/add-framework-product-layer/SKILL.md`: add the bats gate for a
  block touching `framwork/.codeadd/scripts/*.sh`, in the same shape as the serial-vitest gate that
  precedes it. The gate is **conditioned on a usable runner resolving**; where none does, the block
  closes on a ledger ruling naming the gate as unrun, and CI keeps the verdict. **Must not** weaken or
  restate the existing vitest gate.
  - **Consumes:** `npm run test:scripts` resolves to a platform-correct runner (F4)

- **F6** [internal] — `.claude/commands/add-framework--done.md`: rewrite the STEP 2.3 sentence carrying
  the Windows timing. **Must not lose** the argument it supports — that one machine, one Node version
  and a developer's dirty environment are weaker evidence than CI — nor the `qa-preflight` example,
  which remains true of the native Windows path the override still reaches.
  - **Consumes:** `npm run test:scripts` resolves to a platform-correct runner (F4)

- **F7** [internal] — `CLAUDE.md`: one row in the key-files table for `scripts/run-bats.js`. **Must
  not** restate the wrapper's mechanics — the file is an overview and points at owners.

### Does NOT Include (important!)

- **The vitest suite.** Measured at 5m46 in the container against 3m20 native, because that suite
  reads and writes the mounted repository heavily. It stays native and serial.
- **Any edit to `.github/workflows/ci.yml`.** The job calls `npm run test:scripts`; the wrapper detects
  Linux and runs what runs there today.
- **Any change to the close-out gate's authority.** CI still owns the merge verdict. Only the prose
  quoting the stale timing changes.
- **Parallelism on the non-Windows branch.** Keeping it serial is what guarantees this work cannot
  alter the merge gate's behaviour.
- **A fix for the two `-j 8` failures in `qa-evidence.bats`**, whose cause was not investigated.
- **A fix for the native-Windows `qa-preflight` false failure.** The container avoids it; the native
  path still has it, which is one reason the Docker-absent case errors instead of falling back.
- **Any change to the `.bats` files themselves.**

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Wrapper language | node | `npm run` on Windows spawns `cmd.exe`, where a bash wrapper does not run. Every tool in `scripts/` is already node |
| One entry point or two | One — `test:scripts` detects the platform | A sibling script leaves the 69-minute name as the one habit types |
| Windows without Docker | Explicit error, non-zero exit | A silent 69-minute fallback reads as a hang, and that path has the false failure |
| Which bats runs in the container | The repository's pinned `1.13.0` from the mounted `node_modules` | Debian ships `1.8.2`. A local gate on a different bats than the merge gate is the failure this design exists to avoid. Measured green: 386 of 386 in 32s |
| Global git identity in the image | None | The GitHub runner has none. Measured green without it |
| Repository into the container | Bind mount | Copying costs 5 minutes because it drags `node_modules` across the file bridge. Tests write to the container's `/tmp` |
| Job count | 4, with no parallelism inside a file, overridable | Three consecutive runs at 4 were 386 of 386. Eight reproduced two failures on an 8-CPU VM |
| Non-Windows branch | Serial, unchanged | Keeps CI's invocation identical to today |
| Image tag | First 12 hex of the sha256 of the Dockerfile | Editing the Dockerfile rebuilds without anyone remembering a rebuild command |
| Where the new gate lives | `add-framework-product-layer` | `framwork/.codeadd/scripts/` is the product layer, and that skill owns the only sibling rule |
| Is the gate unconditional | No — conditioned on a usable runner | Otherwise it is unenforceable on the one configuration it was written for |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A full local bats verdict in about 32 seconds rather than about 69 minutes | Docker becomes a prerequisite for the whole suite on Windows |
| A local run that agrees with CI, `qa-preflight` included | A second environment definition to keep aligned with the runner |
| An enforceable per-F-block gate for `.sh` changes | About 32 seconds added to every such F-block |
| The container becomes something a second person can type | A file, a gate and a maintenance duty where an ad-hoc command used to do |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The two `-j 8` failures are a real shared-state race, not resource pressure, and surface at `-j 4` on a faster machine | Medium | F3 exposes `CODEADD_BATS_JOBS` so a run can be repeated serially; L2.4 asserts a serial container run is green. CI resolves any disagreement |
| The image drifts from the CI runner and the local gate accepts what CI rejects | Medium | The two known drift points are closed by F2: no global git identity, and bats from the lockfile. L3.2 asserts the Dockerfile installs no `bats` package |
| The wrapper hides which runner ran, and green is read as proof of the wrong thing | Medium | F3 announces the chosen runner and reason before running; L1.6 asserts the announcement |
| F6 drops the argument while dropping the number | Medium | F6 names what must not be lost; L3.4 asserts both the argument and the `qa-preflight` example survive |
| A contributor on Windows without Docker cannot satisfy the F5 gate | Medium | F5's gate is conditional by construction, with the ledger-ruling fallback. L3.3 asserts the condition is present |
| A future suite dependency ships a per-platform binary and the mounted `node_modules` stops working | Low | Loud failure, not silent. The fix is a Linux `node_modules` in a named volume, measured at 2 seconds to populate |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/run-bats.test.js` | product | create | The RED matrix (F1) |
| `scripts/bats.Dockerfile` | internal | create | The image definition (F2) |
| `scripts/run-bats.js` | internal | create | The wrapper (F3) |
| `package.json` | internal | modify | `test:scripts` points at the wrapper (F4) |
| `.claude/skills/add-framework-product-layer/SKILL.md` | internal | modify | The conditioned bats gate (F5) |
| `.claude/commands/add-framework--done.md` | internal | modify | The stale timing sentence (F6) |
| `CLAUDE.md` | internal | modify | One key-files row (F7) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 lands before F2–F4 and every L1 assertion is confirmed failing against
the current tree before any implementation.

### L1 — The wrapper's decisions (RED → GREEN)

1. On a non-`win32` platform the wrapper resolves the native runner, and the command string it builds
   equals `npx bats framwork/.codeadd/scripts/tests/*.bats`. *RED today: the module does not exist.*
2. On `win32` with Docker reachable it resolves the container runner. *RED today: same.*
3. On `win32` with Docker unreachable it exits non-zero and the message names both the override and CI,
   and it does NOT invoke the native runner. *RED today: same.*
4. `CODEADD_BATS_RUNNER=native` and `=docker` each override the platform choice on both platforms.
   *RED today: same.*
5. The image tag equals `codeadd-bats:` plus the first 12 hex of the sha256 of the Dockerfile bytes,
   and changing one byte of that file changes the tag. *RED today: same.*
6. The wrapper prints which runner it chose and why before spawning anything. *RED today: same.*
7. A non-zero child exit is forwarded unchanged, on both branches. *RED today: same.*
8. `CODEADD_BATS_JOBS` replaces the default of 4 in the container command; unset yields 4.
   *RED today: same.*

### L2 — Integration, run on the Windows machine

1. `npm run test:scripts` completes with 386 passing and exit 0.
2. Its wall clock is under 2 minutes.
3. The bats binary the container executed reports `1.13.0`.
4. The same suite with `CODEADD_BATS_JOBS=1` is also 386 passing — the parallel result is not the only
   green.
5. `qa-preflight.bats` passes, with no failure to be explained away.

### L3 — The documentation and gate edits

1. `package.json` → `test:scripts` equals `node scripts/run-bats.js`, and no second bats script exists.
2. `scripts/bats.Dockerfile` installs `git`, `jq` and `parallel`, contains no `bats` package install,
   and contains no `git config --global`. Each omission carries a comment saying why.
3. `add-framework-product-layer` contains the bats gate, its conditional clause, and the ledger-ruling
   fallback — and the pre-existing serial-vitest gate is byte-unchanged.
4. `add-framework--done` no longer claims a specific over-an-hour Windows figure, still argues that one
   machine with one Node version is weaker evidence than CI, and still carries the `qa-preflight`
   example.
5. `CLAUDE.md` has exactly one new row naming `scripts/run-bats.js`, and `node scripts/inventory.js
   --check` exits 0.

### L4 — Behavioural acceptance

1. On Linux the wrapper's spawned command is character-identical to the string `test:scripts` holds
   before F4 — proving the CI job's behaviour did not change.
2. A simulated `.sh` F-block closing without a usable runner produces the ledger-ruling path F5
   describes, not a silent pass and not a block.

**RED expectations against the current tree:** every L1 assertion fails, because `scripts/run-bats.js`
does not exist. L3.1 through L3.5 fail because none of those edits has landed.
**GREEN = all levels pass after F1–F7.**

---

## Execution Order

```
F1 [product]  → F2 [internal] → F3 [internal] → F4 [internal] → F5 [internal] → F6 [internal] → F7 [internal]
```

- **F1 first** because every L1 assertion must be confirmed RED before the wrapper exists.
- **F2 before F3** because the wrapper hashes and builds from the Dockerfile.
- **F4 after F3** because pointing `test:scripts` at a missing file breaks the CI job on any push.
- **F5, F6 and F7 last** because all three describe a runner that must already work.

**Working-tree boundaries.** The repository is in a working state after F1 (a RED suite is expected to
fail and nothing else changed), and after each of F4 through F7. **F2 and F3 are not a stopping point
together with F4** — a build that must stop between F3 and F4 leaves a wrapper nothing calls, which is
harmless, but stopping after F4 with F3 incomplete breaks `npm test:scripts` for CI.

**Per-F-block validation beyond the layer default.** F1 runs the `cli` suite serially, per
`add-framework-product-layer`. F2 through F4 each run the full L1 set. F5 through F7 run their own L3
assertion. L2 runs once, after F4.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 assertion was never RED — a test written after the wrapper proves
   nothing about the wrapper.
2. **L2 run on the wrong branch.** A green L2 produced by `CODEADD_BATS_RUNNER=native` on a Linux
   machine proves nothing this plan is about. The evidence must name the platform and the runner.
3. **F6 losing the argument with the number.** The easy failure is deleting the whole paragraph
   because its figure went stale.
4. **F5's gate landing unconditional.** The conditional clause is what makes it honest; a gate that
   reads cleaner without it is the defect.

## References

- Design set: `docs/brainstorming/2026-09-10T224647-fast-local-bats.md`
- Prior art this plan builds on: `2026-09-10T203053-PLAN--close-out-hardening` — its ledger records the
  container run this plan makes permanent, including the 18.7-second `delivered.bats` figure and the
  absent `qa-preflight` false failure

---

## Next Steps

/add-framework--build fast-local-bats

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-10 | Initial creation |
| 2026-09-10 | Implemented across 11 commits, 6ec4fcc..ec4c2a9. Two unplanned blocks opened for the layer boundary (F1b, F4b) and one for the review fixes (F1c). Review: 24 findings, 11 applied, 13 rejected |
