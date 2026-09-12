# Brainstorm: Fast local bats — a container runner for the Windows dev machine

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-10
> **Type:** script

## Discovery

- **`.claude/commands/add-framework--done.md`** — owns the close-out test gate. It reads the CI run
  rather than executing the suites locally, and the paragraph that justifies that rule quotes the
  Windows number directly: `npm run test:scripts` takes "over an hour" on Windows and 63 seconds on
  CI. It also records a second symptom — a `qa-preflight.bats` failure that exists on no machine but
  this one, because a `node_modules` above `TMPDIR` resolves a package the test asserts is absent.
- **`.claude/skills/add-framework-product-layer/SKILL.md`** — already carries the only per-F-block
  test gate in the repository: a `cli` change does not close until `npx vitest run
  --no-file-parallelism` has been run and read. There is no equivalent rule for a `.sh` change.
- **`.github/workflows/ci.yml`** — two jobs, both on `ubuntu-latest`. `test-scripts` runs
  `npm run test:scripts`; `test-cli` runs the vitest suite and the package smoke test. The platform
  gap between CI and the dev machine is the whole of this problem.
- **`docs/deliveries/2026-09-10T203053-PLAN--close-out-hardening/`** (delivered, and closed out minutes
  before this document was written) — states the Windows/Linux gap as a global constraint and settles
  the current policy: local runs are per-file, the whole-suite verdict is CI's. **Its ledger already
  used the technique this design proposes.** A ruling there records running the bats suites inside a
  `linux/amd64` container against the mounted repository: `delivered.bats` fell from over 12 minutes to
  18.7 seconds, the whole scripts suite ran in 1m58s with 386 passing, and the `qa-preflight` false
  failure did not occur, for exactly the reason found again here — the container's `TMPDIR` has no
  `node_modules` above it. The ruling's cost clause argues the container run is *stronger* evidence
  than the Windows run, not weaker, because it is the same Linux the CI job uses.
- **So the container is not a new idea here. It is an undelivered one.** It was a one-off ruling inside
  a single build: recorded, and then gone. No script, no gate, nothing a second person can type. What
  this design adds is the part a ruling cannot carry, which is permanence — and the measurements below
  are a second, independent run of a technique that has already worked once in this repository.
- **The delivery index holds no entry about test execution.** Thirteen records, none whose subject is
  test speed, runners or Windows performance. `node scripts/graph.js history` resolves no node for the
  test infrastructure — it is not a graph artefact. The prior art above lives in a ledger ruling, which
  is precisely the kind of decision the index does not surface.

## Context & Motivation

The framework's own bats suite is unusable on the machine it is developed on. 386 tests across 16
files take roughly 69 minutes on Windows under Git Bash, and 63 seconds on Linux CI. The cost is not
the wall clock alone: a suite that slow is a suite nobody runs, so a `.sh` change reaches the pull
request with no local evidence behind it at all. That is why `add-framework--build` has no bats gate
today — the gate would be unenforceable.

The slowness has a second face that matters more than the first. The native Windows path does not
merely take longer to reach the same answer; it reaches a **different** answer. `qa-preflight.bats`
fails there and nowhere else, because the test asserts a package is absent while a `node_modules`
above `TMPDIR` makes it resolvable. A local run that disagrees with the merge gate is worse than no
local run, and `add-framework--done` says so in as many words.

## Problem / Opportunity

**Today.** The only trustworthy bats verdict is CI's. Local iteration on a shell script means either
running one file at a time and hoping the interaction with the others is fine, or pushing and waiting
for CI. A full local run is a 69-minute commitment that ends in a false failure.

**The opportunity.** The cost is entirely an artefact of the platform, not of the tests. bats spends
its time forking — `git init`, subshells, `run` invocations — and process creation under Git Bash on
Windows is far more expensive than on Linux. Moving the same suite into a Linux container on the same
machine removes the cost without changing a single test.

The numbers below were measured on the development machine (16 host CPUs; the Docker Desktop VM sees
8 CPUs and 11 GB).

| Path | Time | Result |
|---|---|---|
| Windows native, Git Bash | 75s for 7 tests, ~69 min extrapolated for 386 | green except the known false `qa-preflight` failure |
| Container, serial | 2m28 | 386 of 386 |
| Container, `-j 4`, the project's pinned bats 1.13.0 | 32s | 386 of 386 — **this is the design's path** |
| Container, `-j 4`, Debian's bats 1.8.2 | ~25s, three consecutive runs | 386 of 386, every run — rejected on version, not on speed |
| Container, `-j 8`, Debian's bats 1.8.2 | 18s | 2 failures in `qa-evidence.bats` |
| Container, repo copied in rather than mounted | 5m00 | 386 of 386 |
| GitHub CI, `ubuntu-latest` | 63s | green |
| vitest, Windows native, serial | 3m20 | 985 tests pass |
| vitest, container, serial | 5m46 | slower than native |

The serial container row corroborates the close-out ledger's measurement rather than discovering it:
2m28 here against 1m58 there, 386 passing in both, from two independent runs. The rows around it are
what that ruling never had occasion to establish — the parallel figures, the copy-in comparison and
the vitest result.

Two of those rows close questions that would otherwise have been guesses. **Copying the repository
into the container is worse than mounting it**, because the copy drags `node_modules` across the file
bridge. And **vitest does not belong in the container**: that suite reads and writes the mounted
repository heavily, which is exactly where the bridge charges, so it loses 2m26 by moving. The target
is bats alone.

## Proposed Solution

A small node wrapper replaces the literal `npx bats` line in `package.json`. It picks the runner from
the platform, and on Windows that runner is a Linux container holding the same tools CI has.

```
node scripts/run-bats.js
  ├─ not win32              → npx bats <files>            (serial, byte-identical to today)
  ├─ win32 + docker present → docker run … node_modules/.bin/bats -j 4 …   (32s)
  └─ win32, no docker       → explicit error, non-zero exit, points at CI
```

An environment variable forces either side, so the native Windows path stays reachable without
editing anything.

**Alternative A — two explicit scripts, no detection.** `test:scripts` stays native and a new
`test:scripts:docker` sits beside it. Rejected: it leaves the 69-minute command as the one everybody's
habit already types, and the fast path only helps whoever remembers the longer name.

**Alternative B — container everywhere, CI included.** One path for all machines, identical
environments, no divergence to reason about. Rejected: CI is already fast and already Linux, so it
would pay roughly 30 seconds of image build or pull per run to solve a problem it does not have, and
Docker would become a hard requirement for running the suite at all.

**Alternative C — run bats from the WSL distribution against `/mnt/c`.** Rejected on the user's own
constraint and on inspection: the installed Debian has git but neither bats nor node, so it needs its
own provisioning, and reads from `/mnt/c` cross the same file bridge the container already handles
better.

## Type of Artefact

`script` — two new internal files (a node wrapper and a Dockerfile) and a test suite in `cli/tests/`,
plus edits to `package.json`, one skill, one command and `CLAUDE.md`.

## Scope

### Includes

- `scripts/run-bats.js` — the platform-detecting wrapper, and the sole value of `test:scripts`.
- `scripts/bats.Dockerfile` — `node:22-bookworm-slim` plus `git`, `jq` and `parallel`. **bats itself
  is deliberately not installed.** The container runs the project's own pinned bats out of the mounted
  `node_modules`, which is the binary CI runs; the Debian package is 1.8.2 against the 1.13.0 the
  repository pins. The npm package is pure shell, so the copy installed on Windows runs unchanged on
  Linux — which is exactly what vitest cannot do, because `rolldown` ships a per-platform binary.
- Image lifecycle inside the wrapper: tag derived from a hash of the Dockerfile, built on demand when
  absent, rebuilt automatically when the Dockerfile changes.
- A new per-F-block gate in `add-framework-product-layer`: a block touching
  `framwork/.codeadd/scripts/*.sh` does not close until the bats suite has been run and read.
  **The gate is conditioned on the suite being runnable, and says so in its own text.** It binds
  wherever `npm run test:scripts` resolves to a usable runner — the native command on Linux, the
  container on Windows. Where neither exists, the block closes on a ledger ruling that names the
  gate as unrun and why, and the verdict falls to CI, which is where it already lives. Without that
  clause the gate would be unenforceable on the one configuration it was written for, since the
  native Windows fallback is both the 69-minute path and the one with the false failure.
- Rewriting the `add-framework--done` paragraph whose Windows timing is about to become false, without
  weakening the rule it supports.
- A `CLAUDE.md` line for the new entry point.
- Tests for the wrapper in `cli/tests/`, following `cli/tests/inventory.test.js`, which already covers
  an internal `scripts/*.js` file.

### Does NOT Include

- **The vitest suite.** Measured slower in the container. It stays native and serial, and the existing
  `--no-file-parallelism` rule is untouched.
- **Any change to `.github/workflows/ci.yml`.** CI calls `npm run test:scripts`, the wrapper detects
  Linux, and the command it runs is the one that runs there today.
- **Any change to the close-out gate in `add-framework--done`.** CI remains the authority for the merge
  verdict. Only the prose that quotes the old timing changes.
- **Parallelism on the Linux path.** The native branch stays serial so that CI's behaviour is unchanged
  by this work.
- **A fix for the two `-j 8` failures**, and **a fix for the native-Windows `qa-preflight` false
  failure.** Both are recorded as risks below, not solved here.
- **Any change to the bats tests themselves.**

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| The wrapper is node, not bash | `npm run` on Windows spawns `cmd.exe`, where a bash wrapper does not run. Every existing internal tool in `scripts/` is already node. | ✅ |
| `test:scripts` detects the platform rather than gaining a sibling | One command to remember; CI on Linux never touches Docker; nobody is left typing the slow name by habit. | ✅ |
| Windows without Docker fails loudly instead of falling back to native | A silent 69-minute fallback reads as a hang, and the native path is the one with the false failure. The error names the escape hatch and points at CI. | ✅ |
| The image sets no global git identity | The GitHub runner has none either. An image more permissive than CI produces a local verdict that can disagree with the merge gate. Measured green without it: 386 of 386 in 26s. | ✅ |
| The image does not install bats; the run uses the pinned copy from the mounted `node_modules` | Debian ships 1.8.2 and the repository pins 1.13.0. Installing the distribution package would put the local gate on a different bats than the one governing the merge, which is the same failure the git-identity decision above avoids. Measured green: 386 of 386 in 32s. | ✅ |
| The repository is bind-mounted, not copied | The copy costs 5 minutes because it drags `node_modules` across the bridge. Tests write to the container's own `/tmp`, so nothing touches the Windows disk. | ✅ |
| Four jobs, with no parallelism inside a file, overridable by environment | Three consecutive runs at `-j 4` were 386 of 386. Eight jobs reproduced two failures. The VM has 8 CPUs and bats already forks heavily. | ✅ |
| The Linux branch stays serial | It keeps CI's invocation identical to today, so this work cannot change the merge gate's behaviour. | ✅ |
| The image tag is a hash of the Dockerfile | Editing the Dockerfile rebuilds the image without anyone remembering a rebuild command. | ✅ |
| vitest stays native | Measured 5m46 in the container against 3m20 native. | ✅ |
| The new gate lives in `add-framework-product-layer` | `framwork/.codeadd/scripts/` is the product layer, and that skill already owns the only sibling rule, the serial-vitest gate for `cli`. | ✅ |
| The close-out gate is not touched | `add-framework--done` argues that one machine, one Node version and a developer's dirty environment are weaker evidence than CI. A faster local suite does not answer that argument. | ✅ |

## Ecosystem Impact

| Component | Layer | Impact | Action |
|-----------|-------|--------|--------|
| `scripts/run-bats.js` | internal | Does not exist | Create — platform detection, container invocation, image lifecycle, environment override |
| `scripts/bats.Dockerfile` | internal | Does not exist | Create — base image and the four packages, no global git config |
| `package.json` (root) | internal | `test:scripts` is a literal `npx bats` line | Point it at the wrapper |
| `.claude/skills/add-framework-product-layer/SKILL.md` | internal | Has a serial-vitest gate for `cli` and no gate for `.sh` | Add the bats gate beside it, in the same shape |
| `.claude/commands/add-framework--done.md` | internal | Its justification quotes the Windows timing that is about to change | Rewrite the timing claim; keep the rule that CI owns the verdict |
| `CLAUDE.md` | internal | No mention of how the suites are run | One line for the new entry point |
| `cli/tests/` | internal | No coverage for the wrapper | Add a suite, following `cli/tests/inventory.test.js` |
| `.github/workflows/ci.yml` | internal | Calls `npm run test:scripts` | None — the wrapper resolves to the same command on Linux |
| `framwork/.codeadd/scripts/tests/*.bats` | product | Run unchanged in both places | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A full local bats verdict in about 32 seconds rather than about 69 minutes | Docker becomes a prerequisite for running the whole suite on Windows |
| A local run that agrees with CI, including on `qa-preflight` | A second environment definition to keep aligned with the CI runner |
| A per-F-block gate for `.sh` changes that is enforceable wherever the suite is runnable | A `.sh` F-block now costs about 32 seconds it did not cost before |
| The container stops being a ruling in one ledger and becomes something a second person can type | A technique that was free to use ad hoc now carries a file, a gate and a maintenance duty |
| One command that behaves correctly on every platform | A layer of indirection between `npm run test:scripts` and the bats invocation |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The two `-j 8` failures in `qa-evidence.bats` are a genuine shared-state race rather than resource pressure, and could surface at `-j 4` on a faster machine | Medium | Pin four jobs and expose the environment override so a run can be repeated serially. Record the unexplained failure as a follow-up rather than claiming it is understood. A disagreement between the container and CI is still resolved by CI. |
| The image drifts from the CI runner and the local gate starts accepting what CI rejects | Medium | The two known drift points are closed by decision: no global git identity, and bats taken from the repository's own lockfile rather than from Debian. What remains in the image is git, jq and parallel, whose behaviour the suite does not pin. When the two disagree, CI wins by the existing close-out rule. |
| Some future dependency of the suite turns out to be per-platform, the way `rolldown` is for vitest, and the mounted `node_modules` stops working in the container | Low | It is a loud failure, not a silent one — the binary refuses to load. The fix is a Linux `node_modules` in a named volume, already measured at 2 seconds to populate for the `cli` tree. |
| The wrapper hides which runner actually ran, and a green result is read as proof of the wrong thing | Medium | The wrapper announces the chosen path and the reason before running anything. |
| Rewriting the `add-framework--done` paragraph weakens the rule it was written to support | Medium | The timing sentence is evidence for the rule, not the rule itself. The replacement keeps the argument — one machine, one Node version, a dirty environment — and drops only the stale number. |
| A contributor on Windows without Docker cannot satisfy the new F-block gate, because the only local path left is the 69-minute native run with its false failure | Medium | The gate is written conditionally: it binds where a usable runner resolves, and otherwise the block closes on a ledger ruling naming the gate as unrun. That is the same shape `add-framework--done` already uses for its local fallback — run the weaker thing, and say in the report that you did and why. CI remains the authority in both cases. |
| The bind mount is slower on another Windows machine and the gain shrinks | Low | The suite reads a few small files from the mount and does all its work in the container's `/tmp`. The measured copy-in alternative is already recorded as worse. |

## Next Steps

Run: `/add-framework--plan fast local bats — a container runner for the Windows dev machine`
