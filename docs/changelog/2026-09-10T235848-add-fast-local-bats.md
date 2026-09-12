# Fast local bats — a container runner for the Windows dev machine

**Date:** 2026-09-10
**Plan:** `2026-09-10T230600-PLAN--fast-local-bats`
**Layer:** both

The bats suite took about 69 minutes on the machine this framework is developed on and 63 seconds on
Linux CI. It now takes about half a minute locally, and it agrees with CI.

## Why

The slowness was the visible half. The worse half was that the native Windows run reached a
*different* answer: `qa-preflight.bats` failed there and nowhere else, because a `node_modules` above
`TMPDIR` resolved a package the test asserts is absent. A local verdict that contradicts the merge
gate is worse than no local verdict at all.

Both costs together are why no F-block gate for shell scripts existed. A gate nobody can afford to
satisfy is a gate everybody rules their way past, so the rule was never written.

The fix was not new. The ledger of `2026-09-10T203053-PLAN--close-out-hardening` records a ruling
that ran the same suites inside a `linux/amd64` container: `delivered.bats` fell from over twelve
minutes to 18.7 seconds, the whole suite ran in 1m58s with 386 passing, and the `qa-preflight` false
failure did not occur. That ruling left no script and no gate behind. This delivery is that ruling
made permanent.

## What changed

**`scripts/run-bats.js`** backs `npm run test:scripts`. Off Windows it spawns the exact string that
entry held before, so the CI job's behaviour is unchanged and one assertion pins it character for
character. On Windows it builds the image when its tag is absent, bind-mounts the repository, and
runs the repository's own pinned bats from the mounted `node_modules` with four jobs. Extra arguments
replace the glob, so a per-file run still works. On Windows with no Docker daemon it exits 2 — a
refusal to run, never a test result — and names both the override and CI.

**`scripts/bats.Dockerfile`** is `node:22-bookworm-slim` plus `ca-certificates`, `git`, `jq` and
`parallel`. Two omissions are load-bearing and each carries a comment saying so. It does not install
bats, because Debian ships 1.8.2 against the 1.13.0 this repository pins, and a local gate grading on
a different binary than the merge gate is the divergence this work exists to close. It sets no global
git identity, because the GitHub runner has none and an image more permissive than CI comes back
green on what CI rejects.

**`add-framework-product-layer`** gained the gate that was previously unenforceable: an F-block
touching `framwork/.codeadd/scripts/*.sh` does not close until the suite has been run and read. The
gate binds only where a runner resolves. Where none does, the block closes on a three-part ledger
ruling and the verdict stays with CI.

**`add-framework--done`** stopped quoting a timing figure that this delivery made false, without
losing the argument that figure was evidence for: one machine, one Node version and a developer's
dirty environment are weaker than CI, whatever the clock says. Its local fallback gained the case it
was missing, because exit 2 from the runner is a refusal rather than a red suite, and that command
never loads the skill where those semantics are written.

## Measured

| Path | Time | Result |
|---|---|---|
| Windows native, before | ~69 min extrapolated | one false failure |
| `npm run test:scripts`, container, four jobs | 36s | 386 of 386 |
| `npm run test:scripts`, container, one job | 2m16 | 386 of 386 |
| GitHub CI, unchanged | 63s | green |

## Not included

The vitest suite stays native and serial. Measured in the container it took 5m46 against 3m20
natively, because that suite reads and writes the mounted repository heavily and the file bridge is
exactly where the cost lands. The two `qa-evidence.bats` failures that appear at eight jobs, and the
native-Windows `qa-preflight` false failure, are recorded as known and unfixed.
