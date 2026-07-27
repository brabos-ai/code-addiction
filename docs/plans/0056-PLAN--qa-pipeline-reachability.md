# Plan: QA Pipeline Reachability

> **Status:** implemented
> **Type:** command + skill + script
> **Created:** 2026-07-26
> **Author:** Maicon + Claude (ADD Strategy)
> **Source brainstorm:** `docs/brainstorming/2026-07-26-01-qa-pipeline-reachability.md` (final) · Umbrella: `2026-07-26-00-qa-ux-umbrella.md`

---

## Context

A real project ran the full canonical flow (`add.new → add.plan → add.build → add.review → add.test → add.qa`) with the `playwright` plugin enabled and `add.qa-setup` executed — and `/add.qa` still had nothing to judge. Root cause: the `qa-pipeline` **feature** (which gates artefact authoring) and the `playwright` **plugin** (which only adds live driving) are orthogonal, the feature is `default: false`, and its OFF state is silent in two of the three gated commands. The umbrella brainstorm decomposes the fix into topics 01–05; **this plan implements topic 01**, which is independent and ships first.

All factual claims in the source brainstorm were verified against the codebase on 2026-07-26 (40/40 file:line claims confirmed). The umbrella and refinements received a coherence-correction pass the same day.

Owner additions incorporated into this plan (not in the source brainstorm):

1. **TDD red-green** for every deterministic script this topic creates.
2. **Smoke-test phase with persisted evidence** that the framework works end-to-end for the scenarios this topic touches.

## Problem

| Problem | Effect |
|---|---|
| `qa-pipeline` is `default: false` while every downstream QA artefact depends on it | Default install cannot produce QA evidence, and nothing says why |
| `add.plan` / `add.test` never adopted `add.build`'s fragment self-detection (`add.build.md:149`) | Two commands run with the QA axis amputated and report success |
| `add.qa` stops at the first failed precondition | Four round trips to discover four missing artefacts |
| Feature/plugin orthogonality undocumented at the point of use | Enabling the plugin reads as "QA is on" |
| `add.qa-setup` installs the whole QA toolchain without checking the flag that makes it useful | The explicit QA opt-in command does not opt in |
| `codeadd features enable` on a pre-sidecar install injects nothing yet reports success (`features.js:85`) | The opt-in itself can reproduce the silent state it exists to remove |

## Proposal

Four coordinated changes — the default stays `false`; the OFF state becomes **loud at the moment it matters**, and the one command that means "I want QA" turns the feature on:

1. **`add.plan` and `add.test` adopt fragment self-detection** (pattern proven at `add.build.md:149`), as one-line *continue-with-notice* in always-present body text — not gates.
2. **`add.qa-setup` becomes the opt-in moment**: a new feature-gate step (integer renumbering, no fractional steps) reads feature state, explains what stays broken when disabled, runs `codeadd features enable qa-pipeline` after confirmation, then **verifies the fragment actually landed** (pre-sidecar no-op detection). Decline is recorded in the STEP 10 hand-off.
3. **`add.qa` gets a two-phase, severity-aware preflight**: Phase A (STEP 1, project-level, rows 1–8), Phase B (immediately after STEP 2 scope resolution, rows 9–12), one consolidated diagnosis with `block`/`degrade` severity per row and the exact remedy for each. STEP 4.0's existing branch logic is retained.
4. **Orthogonality documented once** (canonical statement in `add-qa` skill, referenced from `add.qa` STEP 1.1) and **`add-ecosystem` gains a `## Features` section** mirroring `## Plugins`, fixing the invisible-`tdd`-feature gap and the `add-tdd` Dependency Index row.

Deterministic probes (rows 2–7, 11–12) are extracted into a **shared script** `framwork/.codeadd/scripts/qa-preflight.sh`, called by both `add.qa` and `add.qa-setup` — per the house rule that no-reasoning work belongs in scripts. The script is built **TDD red-green with bats**, matching the nine existing `.bats` suites, and the whole topic ships with a **vitest smoke suite** pinning the end-to-end behavior on built provider output.

## Scope

### Includes

- `add.plan`: self-detection notice before consolidation (always-present body text) — if the `## QA/E2E Specification` step section is absent → state the QA axis is off, name the remedy (`codeadd features enable qa-pipeline`), **continue**
- `add.test`: same pattern at the E2E dispatch point — no specs will be authored, name the remedy, **continue**
- `add.qa-setup`: feature-gate step renumbered into the sequence; state probe via manifest (`{{addpath:manifest.json}}`) with `featureStates[name] ?? default` semantics; confirm-then-execute enable; **post-enable verification** that the injected section exists in the installed command (else route to re-install / `codeadd update`); write-boundary prohibition row extended narrowly to permit the CLI-mediated feature enable; declined enable recorded in STEP 10 hand-off
- `add.qa`: two-phase preflight (Phase A rows 1–8 at STEP 1; Phase B rows 9–12 after STEP 2); `block`/`degrade` severity exactly as specified in the brainstorm's preflight table; consolidated report distinguishing **missing** vs **present-but-non-functional**; cheap-to-expensive probe ordering with `not probed` reporting on short-circuit; degrade rows listed under "Not covered / caveats"; STEP 3 "screens.json absent" prohibition row folded into the preflight; STEP 4.0 retained unchanged
- **`framwork/.codeadd/scripts/qa-preflight.sh`** (new): deterministic probes for rows 2–7 (config.json present, baseUrl reachable, baseUrl non-production, `@playwright/test` functional, chromium launchable, `qa-project` skill present) and rows 11–12 (screens.json present, `<surface>.qa.spec` glob); emits machine-readable `KEY=STATUS` lines with three-valued status (`ok` / `missing` / `broken`) plus raw manifest feature state (`true`/`false`/`unset` — the **command** applies default semantics)
- **`framwork/.codeadd/scripts/tests/qa-preflight.bats`** (new): RED-first test suite; auto-picked-up by the existing `npm run test:scripts` glob and the CI `test-scripts` job
- `add-qa` skill: canonical orthogonality statement (stated once; `add.qa` references it)
- `add-ecosystem` skill: new `## Features` section immediately before `## Plugins` (table: feature, default, injects-into, purpose + one enablement/orthogonality prose line); `add-tdd` Dependency Index row corrected to include `add.plan` and `add.review`; `qa-pipeline` parentheticals reference the section
- **`cli/tests/qa-reachability.smoke.test.js`** (new, vitest): end-to-end pinning of the four owner scenarios (see Execution Phases, Phase S)
- Rebuild (`node scripts/build.js`) + `injection-points.json` regeneration; verify no anchor drifted
- **Evidence file** `docs/plans/0056-PLAN--qa-pipeline-reachability--evidence-v01.md` capturing the full RED and GREEN suite outputs plus the enable/disable round-trip transcript

### Does NOT Include (important!)

- Changing `qa-pipeline`'s `default: false`
- Any auto-repair or scaffolding by `add.qa` (it stays diagnosis-only, read-only)
- Removing or replacing `add.qa` STEP 4.0's branch logic
- Changing the `playwright` plugin's detect/enable lifecycle
- The `design.md` / `screens.json` production path (topic `02`)
- **Fixing the pre-sidecar no-op in `cli/src/features.js` itself** — this topic *detects and routes around it*; the CLI fix is a separate change with its own test surface
- Non-web QA surfaces (deferred umbrella follow-up)

## Validated Decisions

Decisions 1–13 were validated in the source brainstorm (session-agreed, all rationale recorded there); 14–18 are new to this plan.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Feature default | `qa-pipeline` stays `default: false` | The defect is silence, not the default; flipping breaks every non-QA project |
| 2 | Silent OFF in add.plan/add.test | Self-detection notice, continue (not stop) | Pattern proven at `add.build.md:149`; notice keeps non-QA projects unobstructed |
| 3 | Opt-in moment | `add.qa-setup`, confirm-then-execute | Running it is unambiguous QA intent; matches its existing confirm discipline |
| 4 | Enable trustworthiness | Post-enable verification that the fragment landed | `features.js:85` makes enable a silent no-op on pre-sidecar installs |
| 5 | Feature state probe | `featureStates[name] ?? default`, path via `{{addpath:manifest.json}}` | Untoggled projects have no `features` key; lint would not catch a hardcoded path |
| 6 | Preflight structure | Two-phase (A: rows 1–8; B: rows 9–12) | `SCOPE_DIR`/`FEATURE_DIR` exist only after STEP 2; single-phase violates sequential execution |
| 7 | Preflight severity | `block` / `degrade`, not binary | All-blocking deletes the documented live-drive stopgap and blocks epic runs pre-`02` |
| 8 | Deterministic probes | Extracted to a shared script, called by both commands | House rule: no-reasoning work belongs in scripts; `add.qa-setup` STEP 2 already duplicates them |
| 9 | Orthogonality documentation | Stated once in `add-qa`, referenced elsewhere | "Reference, Never Repeat" |
| 10 | Ecosystem visibility | `add-ecosystem` gains `## Features` mirroring `## Plugins` | Features are undocumented as a concept today; `## Plugins` is the house form to copy |
| 11 | STEP numbering | Integer renumbering, no fractional steps | `add-framework--build.md:161-165` prohibition |
| 12 | features.js pre-sidecar bug | Detected and routed around, not fixed here | Keeps this topic command/skill-scoped; CLI fix is separable |
| 13 | Body tables in commands | Acceptable | House practice (31 body tables across 6 sampled resources) |
| 14 | **Probe script language + test harness** | Bash + bats (`qa-preflight.sh` / `qa-preflight.bats`) | House standard: 11 existing `.sh` scripts, 9 existing `.bats` suites, CI `test-scripts` job already runs the glob — zero new infra |
| 15 | **JSON parsing inside the probe script** | Shell out to `node -e` for `manifest.json` / `config.json` reads | Pure-bash JSON parsing is fragile; node ≥18 is already a hard requirement of the CLI that installed the framework, so it is guaranteed present |
| 16 | **Where default semantics live** | Script emits raw state (`true`/`false`/`unset`); the command interprets `unset` per the documented default | The defaults registry lives in `cli/src/features.js`; duplicating it in a shell script creates a second source of truth that drifts |
| 17 | **TDD scope** | RED-first bats for `qa-preflight.sh`; RED-first vitest smoke assertions for new built-output behavior; prose-only command edits are covered by the smoke suite, not unit tests | Tests-first only where behavior is executable; command markdown is verified via its built artefacts |
| 18 | **Smoke evidence persistence** | Suites live in CI permanently; a point-in-time evidence file is written beside the plan (`--evidence-v01.md`) | `docs/` is gitignored, so the durable green signal is CI; the evidence file is the owner-facing proof for this delivery |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| The silence ends where it starts, not three commands later | Two more commands to keep in sync with the self-detection pattern |
| One diagnostic pass instead of four round trips | A longer STEP 1 in `add.qa` |
| A single QA opt-in point that verifies itself | `add.qa-setup` now mutates feature state + installed command files (blast radius widened, narrowly) |
| Deterministic probes stop being LLM steps; tested red-green | A new script + bats suite to maintain |
| Permanent regression coverage of the reachability scenarios in CI | A new vitest file to maintain |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Self-detection notice becomes noise on non-QA projects | Med | One line, normal output, no gate |
| Preflight probes slow (HTTP + browser launch + glob) | Med | Cheap-to-expensive ordering; short-circuit expensive rows on a cheap blocker, report them `not probed` |
| Enable succeeds, injection silently no-ops, user believes QA is on | **High** (pre-sidecar installs) | Post-enable verification probes the installed command for the expected section; routes to re-install / `codeadd update` |
| Spec-presence probe (row 12) fragile across project conventions | Med | Resolve spec location from the generated `qa-project` skill, never guess; `unknown` when the skill is absent (row 7 blocks first) |
| `degrade` rows treated as blockers by an implementer | Med | Severity is a required column; degrade rows must appear under "Not covered / caveats" |
| `add.qa-setup` write-boundary extension abused later | Low | Permission is narrow and named: CLI-mediated feature enable only |
| Probe script behaves differently on Windows dev machines vs CI | Med | POSIX-only constructs; JSON via `node -e` (decision 15); bats suite runs in CI on ubuntu — the authoritative environment — and locally via Git Bash |
| Smoke suite couples to prose wording of the notices | Med | Assert on stable sentinel substrings (the remedy command string, the section heading), not full sentences |
| Manifest/`config.json` shape drifts and breaks the script silently | Low | bats fixtures pin the parsed shapes; a shape change fails the suite loudly |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `framwork/.codeadd/commands/add.qa.md` | Modify — two-phase preflight; prohibitions consolidated; STEP 1.1 references orthogonality statement; STEP 4.0 retained |
| `framwork/.codeadd/commands/add.qa-setup.md` | Modify — feature-gate step (renumbered); post-enable verification; write-boundary row extended; STEP 10 records declined enable; STEP 2 probes delegated to the shared script |
| `framwork/.codeadd/commands/add.plan.md` | Modify — self-detection notice (always-present body text, outside any marker) |
| `framwork/.codeadd/commands/add.test.md` | Modify — self-detection notice at the E2E dispatch point |
| `framwork/.codeadd/commands/add.build.md` | None — already implements the pattern |
| `framwork/.codeadd/skills/add-qa/SKILL.md` | Modify — canonical orthogonality statement |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Modify — `## Features` section; `add-tdd` Dependency Index correction; parentheticals reference the section |
| `framwork/.codeadd/scripts/qa-preflight.sh` | **Create** (TDD) |
| `framwork/.codeadd/scripts/tests/qa-preflight.bats` | **Create** (RED first) |
| `cli/tests/qa-reachability.smoke.test.js` | **Create** (RED first for new behavior) |
| `cli/src/features.js` | None — verify only (default unchanged; no-op detected by the setup step, not fixed) |
| `framwork/.codeadd/injection-points.json` | Regenerated by rebuild; verify anchors did not drift (notices are inserted *outside* markers and must not rewrite anchor lines) |
| Provider dirs (`framwork/.claude/`, …) | Regenerated by `node scripts/build.js` |
| `web/` docs, `README.md` | None in this plan — `add-framework--sync` at release |

## Execution Phases (TDD + Smoke)

`/add-framework--build` executes in this order. **RED phases must be committed/verified failing before their GREEN phase starts.**

### Phase R1 — RED: probe script

Write `framwork/.codeadd/scripts/tests/qa-preflight.bats` with fixtures (temp dirs simulating: complete QA project; missing `config.json`; unreachable `baseUrl`; production `baseUrl`; missing `qa-project` skill; empty spec glob; manifest with `features.qa-pipeline: true` / `false` / absent / file absent). Run `npm run test:scripts` → **new suite fails** (script does not exist). Capture output.

### Phase R2 — RED: smoke suite

Write `cli/tests/qa-reachability.smoke.test.js` (vitest, house patterns from `injection-roundtrip.integration.test.js` / `install.e2e.test.js`):

1. **Enable/disable round-trip** — on a sidecar-present fixture, `enable qa-pipeline` injects all three sections into built `add.plan`/`add.test`/`add.build`; `disable` removes them byte-identically.
2. **Pre-sidecar no-op detection scenario** — with `injection-points.json` absent, `enable` reports success yet the built commands carry no section (pins the behavior the setup step must detect; guards against silent CLI behavior change).
3. **Fragment self-detection notices** — built `add.plan` and `add.test` (feature OFF state) contain the notice sentinels (remedy string `codeadd features enable qa-pipeline`); built `add.build` retains its existing detection text.
4. **Preflight contract** — built `add.qa` contains the Phase A/Phase B preflight with the `block`/`degrade` table and the shared-script invocation (`.codeadd/scripts/qa-preflight.sh`).

Assertions 3–4 **fail** (behavior not built yet); assertion 1–2 pass as pinning tests. Capture output.

### Phase G1 — GREEN: script

Implement `qa-preflight.sh` until the bats suite is green. POSIX bash; JSON via `node -e`; output contract `KEY=ok|missing|broken|unset|not-probed` one per line.

### Phase G2 — GREEN: commands + skills

Apply the six command/skill modifications (Ecosystem Impact table). Follow `building-commands` + `add-framework-development` skills; notices in always-present body text; no fractional STEP numbers; `{{addpath:manifest.json}}` for manifest reads.

### Phase G3 — GREEN: rebuild + full suites

`node scripts/build.js` → verify `injection-points.json` anchors unchanged → `npm test` + `npm run test:scripts` → all green, including the previously-RED smoke assertions.

### Phase S — Smoke evidence

Write `docs/plans/0056-PLAN--qa-pipeline-reachability--evidence-v01.md` containing: RED outputs (R1, R2), GREEN outputs (G1, G3), and a transcript of the enable → verify → disable → verify round-trip on a scratch install fixture. This file is the owner-facing proof; CI keeps the durable signal.

## References

- `docs/brainstorming/2026-07-26-01-qa-pipeline-reachability.md` (source, final)
- `docs/brainstorming/2026-07-26-00-qa-ux-umbrella.md` (umbrella, corrected 2026-07-26)
- `framwork/.codeadd/skills/add-resource-path-convention/SKILL.md` (`{{addpath:}}` convention)
- `.claude/skills/building-commands/`, `.claude/skills/add-framework-development/` (build-time skills)
- `.github/workflows/ci.yml` (`test-cli` vitest matrix, `test-scripts` bats job)
- Verified evidence base: `add.build.md:149` (self-detection pattern), `cli/src/features.js:85` (pre-sidecar no-op), `:182` (state semantics)

---

## Next Steps

/add-framework--build 0056-PLAN--qa-pipeline-reachability

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-07-26 | Initial creation from brainstorm 01 (post coherence-correction pass) + owner TDD/smoke requirements |
| 2026-07-27 | Implemented on `feature/0056-qa-pipeline-reachability` — all phases (R1/R2/G1/G2/G3/S) executed; evidence in `--evidence-v01.md` |
