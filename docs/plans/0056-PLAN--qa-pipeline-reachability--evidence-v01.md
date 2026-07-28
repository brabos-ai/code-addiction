# Evidence v01 — Plan 0056: QA Pipeline Reachability

> **Date:** 2026-07-27 · **Branch:** `feature/0056-qa-pipeline-reachability`
> **Discipline:** TDD red-green (bats + vitest) + smoke evidence, per plan Execution Phases.
> Local environment: Windows 11 / Git Bash / node 22.17. CI (ubuntu) is the authoritative runner; local environmental caveats are noted where they apply.

## Phase R1 — RED: `qa-preflight.bats` before the script existed

```
$ npx bats framwork/.codeadd/scripts/tests/qa-preflight.bats
1..21
not ok 1 phase a: no manifest → QA_FEATURE_STATE=no-manifest, exit 0
not ok 2 phase a: manifest without features key → QA_FEATURE_STATE=unset
... (21/21 not ok — bash exit 127, script not found)
exit=1 · 21 failed / 0 passed
```

## Phase R2 — RED: `qa-reachability.smoke.test.js` before the behavior existed

```
$ npx vitest run tests/qa-reachability.smoke.test.js
Tests  5 failed | 3 passed (8)
× built add.plan carries the OFF-state notice with the exact remedy
× built add.test carries the OFF-state notice with the exact remedy
× qa-preflight.sh exists in the source scripts dir
× built add.qa invokes the shared probe script and declares block/degrade phases
× built add.qa-setup carries the feature-gate opt-in with the exact remedy
✓ (pinning) enable/disable round-trip byte-identical
✓ (pinning) pre-sidecar enable no-op — modified=0 yet manifest marks the feature on
✓ (pinning) built add.build retains its self-detection stop
```

The 3 passes are deliberate pinning tests of pre-existing behavior; the 5 failures are exactly the new behavior this plan ships.

## Phase G1 — GREEN: `qa-preflight.sh`

```
$ npx bats framwork/.codeadd/scripts/tests/qa-preflight.bats
exit=0 · 21 passed / 0 failed
```

One probe correction surfaced by the suite: `npx --no-install playwright --version` resolves a *global* playwright CLI (present on this machine), so the runner probe now requires project-local resolution first (`node -e "require.resolve('@playwright/test')"` — walks `node_modules` only, never the global npm prefix) before the functional invocation.

## Phase G2/G3 — command + skill edits, rebuild, full suites

```
$ node scripts/build.js
Build complete: 19 commands × providers → 95 files · 39 skills → 525 · 13 agents → 13
Injection points: 34 → framwork/.codeadd/injection-points.json   (no lint warnings, no anchor failures)

$ npx vitest run tests/qa-reachability.smoke.test.js
Tests  8 passed (8)

$ npx vitest run          # full cli suite, this branch
Tests  26 failed | 410 passed (436)

$ npx vitest run          # baseline: main via git worktree, same node_modules
Tests  26 failed | 402 passed (428)

$ diff <(branch failing set) <(main failing set)
IDENTICAL failing sets
```

**The 26 failures are pre-existing and environmental** (Windows checkout with `core.autocrlf=true` materializes CRLF; the injection/frontmatter regexes are LF-based — e.g. `expected '---\r\nname: ux-agent…' to match /^---\n/`). Branch vs main: same 26 failures, same 5 files (`build.test.js`, `gitnexus-plugin.test.js`, `injection-roundtrip.integration.test.js`, `bin-codeadd.test.js`, `uninstall-scope.test.js` — none touched by this plan); the branch adds 8 new tests, all green. The new smoke suite normalizes its fixture to LF (an installed project ships LF — the release ZIP is built on CI), so it is immune to checkout line-ending config.

Full bats run (`npm run test:scripts`, 10 suites) is impractical locally — msys git makes each setup/teardown slow (timed out at test 57/~150; the single observed failure was pre-existing, in `build-setup.bats`, untouched by this plan). The new suite runs isolated in seconds and is green; CI runs the full set on ubuntu.

## Phase S — enable → verify → disable round-trip transcript (scratch install fixture)

```
== enable qa-pipeline ==
files modified: 3
add.plan has injected section: true      (STEP 10.0 QA-Spec)
add.test has injected section: true      (E2E Spec Authoring)
add.build has injected section: true     (QA-Fix Flow)
manifest.features: {"qa-pipeline":true}
== disable qa-pipeline ==
byte-identical restore: true
== pre-sidecar no-op scenario ==
modified: 0 (nothing injected) — manifest.features: {"qa-pipeline":true} ← silent success the STEP 2 gate detects
```

## Deliverables shipped

| File | Kind |
|---|---|
| `framwork/.codeadd/scripts/qa-preflight.sh` | New shared probe script (TDD) |
| `framwork/.codeadd/scripts/tests/qa-preflight.bats` | New bats suite (21 tests) |
| `cli/tests/qa-reachability.smoke.test.js` | New vitest smoke suite (8 tests, permanent CI coverage) |
| `framwork/.codeadd/commands/add.qa.md` | Two-phase block/degrade preflight; orthogonality referenced |
| `framwork/.codeadd/commands/add.qa-setup.md` | STEP 2 feature gate (confirm→enable→verify); sequence renumbered 2–10 → 3–11; write boundary extended narrowly |
| `framwork/.codeadd/commands/add.plan.md` | QA-axis self-check notice (always-present body text) |
| `framwork/.codeadd/commands/add.test.md` | QA-axis self-check notice at the E2E dispatch point |
| `framwork/.codeadd/skills/add-qa/SKILL.md` | Canonical feature-vs-plugin statement |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | New `## Features` section; `add-tdd` Dependency Index corrected |
