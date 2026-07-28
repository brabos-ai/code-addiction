# Brainstorm 01: QA Pipeline Reachability

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-07-26
> **Type:** command + skill + CLI
> **Layer:** product (`framwork/.codeadd/`) + CLI (`cli/src/features.js`)
> **Umbrella:** `2026-07-26-00-qa-ux-umbrella.md` · **Depends on:** nothing — ship first

## Discovery

- **`cli/src/features.js`** — `qa-pipeline` is registered `default: false`, `commands: ['add.plan', 'add.test', 'add.build']`. `tdd` beside it is `default: true`.
- **`cli/src/plugins.json` / `plugins.js`** — the `playwright` plugin is a separate namespace, disabled by default, hard-gated by a `detect` shell probe. Enabling it injects live-driving fragments into `add.qa` and `qa-agent`.
- **`add.qa` STEP 1** — 1.1 states the plugin is optional and must not stop the run; 1.2 gates `baseUrl` reachability and refuses production hosts. The prohibitions table stops at the **first** failed condition.
- **`add.qa` STEP 4.0** — already distinguishes "qa-pipeline OFF → specs were never authored" from "ON but not generated", and prints the right remedy. This logic exists but only fires at STEP 4, after the run has already been set up.
- **`add.qa-setup`** — installs the runner (mandatory) + chromium + MCP with confirm-then-execute, generates the `qa-project` skill, scaffolds `config.json` + `screens.json`, and STEP 9 dispatches `/add.qa` as a smoke test with a bounded correction loop. STEP 9 already guards on `/add.build qa` requiring the feature: *"If that dispatch reports the feature is disabled, do NOT keep looping — surface it."*
- **`add.build.md:151`** — **the self-detection pattern already exists.** In always-present body text, outside any marker: *"IF that section is NOT present (the `qa-pipeline` feature is disabled) → tell the user to run `codeadd features enable qa-pipeline` and STOP; do NOT fall through to a normal build mode."* A command **can** detect its own missing fragment by probing for the section it expects.
- **`cli/src/features.js:85`** — `if (cmdPoints.length === 0) continue;` then `manifest.features[name] = true` is written regardless. On a **pre-sidecar install** (`injection-points.json` absent → `loadInjectionPoints` returns `[]`), `codeadd features enable qa-pipeline` injects nothing, reports success, and marks the feature on.
- **`cli/src/features.js:181`** — feature state is `featureStates[name] ?? meta.default`. A project that never toggled a feature has **no `features` key at all**; probing the manifest field alone yields "unknown", not "disabled".
- **`add-ecosystem` skill** — has `## Commands`, `## Skills`, `## Agents`, `## Plugins`, `## Dependency Index`, `## Main Flows`, `## Command Next-Steps Routing`. **There is no Features table**; feature state appears only as inline parentheticals (`:22`, `:29`, `:34`).

## Context & Motivation

A project ran `add.new → add.plan → add.build → add.review → add.test → add.qa` with the `playwright` plugin enabled and `add.qa-setup` already executed, and `/add.qa` still had nothing to judge.

The owner's mental model was reasonable: *"I enabled the Playwright plugin and ran the QA setup, therefore QA is on."* The framework's model is different: the **feature** `qa-pipeline` controls whether QA artefacts get authored, and the **plugin** `playwright` only adds live driving to the judging step. Those two are orthogonal, and nothing in the flow says so.

Worse, the OFF state is silent **in two of the three gated commands**. Feature fragments are injected post-install; with the feature off, the fragment is simply absent from the installed file, so `add.plan` never runs STEP 10.0 and `add.test` never dispatches `@e2e-agent` — and neither says so.

`add.build` is the exception, and it is the proof that the fix is cheap: at `add.build.md:151`, in always-present body text, it probes for the section it expects and refuses with the exact remedy when it is absent. **Fragment absence is detectable from inside** — a command can assert that a section it depends on exists. The other two simply never adopted the pattern.

## Problem / Opportunity

| Problem | Effect |
|---|---|
| `qa-pipeline` is `default: false` while every downstream QA artefact depends on it | The default install cannot produce QA evidence, and nothing says why |
| `add.plan` and `add.test` never adopted `add.build`'s fragment self-detection | Two commands run with the QA axis amputated and report success |
| `add.qa` stops at the first failed precondition | The user fixes one thing, re-runs, hits the next. Four round trips to discover four missing artefacts |
| Feature/plugin orthogonality is undocumented at the point of use | Enabling the plugin reads as "QA is on" |
| `add.qa-setup` installs the entire QA toolchain without checking the flag that makes it useful | The one command that *is* an explicit QA opt-in does not opt in |
| `codeadd features enable` reports success on a pre-sidecar install while injecting nothing | The opt-in itself can produce the silent state it exists to remove |

## Proposed Solution

Four coordinated changes. The default stays `false`; what changes is that the OFF state becomes **loud at the moment it matters**, and the one command that means "I want QA" turns it on.

### 1. `add.plan` and `add.test` adopt the existing self-detection pattern

`add.build.md:151` already proves this works. Add the equivalent assertion, in always-present body text, at the point each command would have used its fragment:

- `add.plan`, before consolidation: if the `## QA/E2E Specification` step section is absent → state that the QA axis is off, name the remedy, and **continue** (planning is still valid without QA).
- `add.test`, at the E2E dispatch point: if the E2E-dispatch section is absent → state that no E2E specs will be authored, name the remedy, and **continue**.

Both are notices, not stops — unlike `add.build qa`, where the user explicitly asked for the QA mode and stopping is correct. This is the highest-value change in this topic: it moves the diagnosis from three commands later to the moment the capability is skipped.

The cost objection ("every non-QA project sees QA nagging") is answered by making these one-line notices in the command's normal output, not gates.

### 2. `add.qa-setup` becomes the opt-in moment

Running `add.qa-setup` is unambiguous intent: it installs a browser runner, generates a project QA skill, and scaffolds a screen catalog. All of that is inert with `qa-pipeline` off.

A new **Feature gate step** (renumbered into the existing sequence, not a fractional `1.5` — `add-framework--build` prohibits fractional STEP numbering) reads the feature state and, when disabled, explains what stays broken, shows the exact command, and **runs it after confirmation** — consistent with the command's existing confirm-then-execute discipline. On decline, setup continues and the item is recorded as a remaining manual step in the STEP 10 hand-off, exactly as declined prerequisites are handled today.

Two mechanics this step must handle, both verified in `cli/src/features.js`:

- **State probe** — read `featureStates[name] ?? meta.default` semantics, not the manifest field alone. A project that never toggled a feature has no `features` key, and probing the field yields "unknown", not "disabled". The manifest path must be written `{{addpath:manifest.json}}` — the resource-path convention names this exact case as a typical use, and no command reads the manifest today, so there is no precedent to copy. `lintResourcePaths` only warns on raw `.codeadd/commands/` and `.codeadd/skills/` (`scripts/build.js:349-353`), so a hardcoded manifest path would ship silently.
- **Pre-sidecar no-op** — `if (cmdPoints.length === 0) continue;` (`:85`) means enable can inject nothing yet still write `features[name] = true` and print success when `injection-points.json` is absent. After enabling, the step must **verify the fragment actually landed** (probe the installed command for the expected section, per change 1) and, if it did not, route the user to re-install / `codeadd update` rather than reporting QA as on.

This step also mutates installed provider command files via `resolveResourceFiles` + `recalculateHashes`, which exceeds `add.qa-setup`'s current write-boundary prohibition row (*"Write only under `docs/qa/`, `FEATURE_DIR/_tests/`, and the resolved provider skills dir"*). That row must be extended to permit the CLI-mediated feature enable, explicitly and narrowly.

### 3. `add.qa` gets a two-phase, severity-aware preflight

Replace stop-at-first-failure with a single diagnostic pass. It must be **two-phase**, because `SCOPE_DIR` and `FEATURE_DIR` are defined in STEP 2 and cannot be probed in STEP 1 without violating the command's own sequential-execution block:

- **Phase A (STEP 1, project-level):** rows 1–8 below.
- **Phase B (immediately after STEP 2 scope resolution):** rows 9–12.
- One consolidated report before any work begins.

Severity is three-valued, not binary. Making every row blocking would delete two documented degradations that `add.qa` relies on today (STEP 4.0's *"(plugin ON) fall back to today's live-drive-from-catalog as a stopgap"*, and the fact that `add.qa` is **not** itself gated by `qa-pipeline` — `features.js` lists only `add.plan`, `add.test`, `add.build`).

| # | Phase | Prerequisite | Probe | Severity |
|---|---|---|---|---|
| 1 | A | `qa-pipeline` enabled | `featureStates[name] ?? default` | **degrade** — no authored specs; live-drive stopgap still possible with the plugin |
| 2 | A | `docs/qa/config.json` present | file read | block |
| 3 | A | `baseUrl` reachable | HTTP probe | block — surface `bootHint` |
| 4 | A | `baseUrl` local/throwaway | host inspection | block — refuse production |
| 5 | A | `@playwright/test` functional | trivial invocation | block |
| 6 | A | chromium launchable | headless health probe | block |
| 7 | A | `qa-project` skill present | skills dir read | block — carries the run commands |
| 8 | A | `playwright` MCP connected | MCP probe | **degrade** — read-PNG mode |
| 9 | B | `about.md` per SF in scope | file read | block — functional axis has no contract |
| 10 | B | `design.md` at `SCOPE_DIR` | file read | **degrade** — UX axis cannot run; functional axis still can |
| 11 | B | `FEATURE_DIR/_tests/screens.json` | file read | block |
| 12 | B | `<surface>.qa.spec` persisted | glob per `qa-project` | **degrade** — falls back to STEP 4.0's stopgap |

**`degrade` rows never stop the run.** They are reported with their remedy, and the corresponding axis is recorded under "Not covered / caveats". Row 10 is `degrade` specifically so that shipping `01` alone does not make every epic-scoped `/add.qa` refuse to run — the SF-level `design.md` production path lands in `02`, and until then the functional axis must keep working.

The report distinguishes **missing** from **present-but-non-functional**, mirroring `add.qa-setup` STEP 2's vocabulary. `add.qa` still repairs nothing — the diagnosis is the deliverable. STEP 4.0's existing branch logic is **retained**, not replaced; the preflight surfaces the same information earlier.

Rows 2–7 and 11–12 need no LLM reasoning and duplicate probes `add.qa-setup` STEP 2 already performs. Extract them into a shared script under `.codeadd/scripts/` and have both commands call it, per the framework's own rule that deterministic work belongs in scripts.

### 4. Document the orthogonality once, reference it elsewhere

The canonical statement lives in the `add-qa` skill overview:

> `qa-pipeline` (feature) decides whether QA artefacts are **authored**. `playwright` (plugin) decides whether the judge can additionally **drive the app live**. Enabling the plugin does not enable the pipeline.

`add.qa` STEP 1.1 references it rather than repeating it, per `add-token-efficiency`'s "Reference, Never Repeat".

**`add-ecosystem` gains a `## Features` section, mirroring `## Plugins` exactly.** Discovery showed the gap is wider than this topic: the skill has 8 sections and **no Features section at all**. The `tdd` feature — enabled by default, injecting into `add.plan`, `add.build`, and `add.review` — is never documented as a feature; it appears only as the `add-tdd` *skill* (`:75`, `:136`). `qa-pipeline` exists only as six inline parentheticals ("when qa-pipeline feature enabled"). A reader cannot learn from this skill that features exist, what their defaults are, or that a CLI toggles them.

`## Plugins` (`:99-106`) is the only place enablement semantics are stated in full, and it is the pattern to copy: a table plus **one prose line carrying default state + CLI + prerequisite**. The new section sits immediately before it, so features and plugins are adjacent:

| Feature | Default | Injects into | Purpose |
|---------|---------|--------------|---------|
| `tdd` | enabled | add.plan, add.build, add.review | RED-GREEN-REFACTOR discipline and contract-test specs |
| `qa-pipeline` | disabled | add.plan, add.test, add.build | E2E spec authoring + agent QA validation |

Followed by the enablement line (`codeadd features enable|disable|list <name>`) and the orthogonality statement, which is exactly where a reader comparing the two tables will hit it. Two fixes ride along, both pre-existing defects surfaced by discovery: the `add-tdd` Dependency Index row (`:136`) omits `add.plan` and `add.review` despite markers existing in both, and the `qa-pipeline` parentheticals can then reference the section instead of restating the condition.

### Alternatives considered

| Option | Verdict |
|---|---|
| Flip `qa-pipeline` to `default: true` | **Rejected.** `add.test` would dispatch `@e2e-agent` in projects with no `@playwright/test` installed, and `add.plan` would generate a QA spec nobody asked for. It converts a silent gap into a hard failure for every non-QA project. The defect is the silence, not the default |
| Auto-enable the feature from inside `add.qa` when it detects the flag off | **Rejected.** `add.qa` is read-only by contract and writes only under `_tests/run-NNN/`. Mutating project configuration from the audit command breaks that boundary |
| ~~Warn from `add.plan` / `add.test` when the feature is off~~ | **Adopted as change 1.** Originally rejected as infeasible on the belief that fragment absence is undetectable from inside. That belief was wrong — `add.build.md:151` implements exactly this pattern in always-present body text |
| Make every preflight row blocking | **Rejected.** Deletes `add.qa`'s documented live-drive stopgap and would block epic-scoped runs on an SF-level `design.md` that no command writes until `02` lands |
| Make the plugin `detect` probe also require the feature | **Rejected.** Conflates two namespaces and would block a legitimate plugin enable |

## Type of Artefact

Command modifications (`add.qa`, `add.qa-setup`), skill modifications (`add-qa`, `add-ecosystem`), and a CLI touch only if the manifest read helper needs exposing.

## Scope

### Includes

- `add.plan` and `add.test` adopt `add.build`'s fragment self-detection, as continue-with-notice (not a stop)
- `add.qa-setup` feature-gate step (renumbered into the sequence, not fractional) with confirm-then-execute enable, post-enable verification that the fragment landed, decline recorded in hand-off, and its write-boundary prohibition row extended
- `add.qa` two-phase, severity-aware preflight (Phase A at STEP 1, Phase B after scope resolution), with `block` / `degrade` semantics and per-row remedy
- A shared deterministic probe script under `.codeadd/scripts/`, called by both `add.qa` and `add.qa-setup`
- Canonical orthogonality statement in the `add-qa` skill; referenced (not repeated) from `add.qa`
- `add-ecosystem` `## Features` section (new, mirroring `## Plugins`), plus the `add-tdd` Dependency Index correction
- `add.qa` prohibitions table updated: the STEP 3 "screens.json absent" row folds into the preflight

### Does NOT Include

- Changing `qa-pipeline`'s `default: false`
- Any auto-repair or scaffolding by `add.qa`
- Removing `add.qa` STEP 4.0's existing branch logic — the preflight surfaces it earlier, it is not replaced
- Changing the `playwright` plugin's detect/enable lifecycle
- The `design.md` / `screens.json` production path — that is `02`
- Fixing the pre-sidecar no-op in `cli/src/features.js` itself — this topic detects and routes around it

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| `qa-pipeline` stays `default: false` | Enabling by default breaks non-QA projects with hard failures (E2E dispatch without a runner). The defect is silence, not the default | ✅ |
| `add.plan` / `add.test` self-detect their missing fragment and continue with a notice | The pattern already exists at `add.build.md:151`; a notice (not a gate) keeps non-QA projects unobstructed while ending the silence at the moment it occurs | ✅ |
| `add.qa-setup` is the opt-in moment and may enable the feature after confirmation | Running it is unambiguous QA intent, and the command already installs with confirm-then-execute. Everything it installs is inert without the flag | ✅ |
| The enable step verifies the fragment actually landed | `features.js:85` makes enable a silent success no-op on pre-sidecar installs — the opt-in could otherwise reproduce the exact state this topic removes | ✅ |
| The feature probe uses `featureStates[name] ?? default`, not the manifest field | A project that never toggled a feature has no `features` key; the field alone yields "unknown" | ✅ |
| Preflight is two-phase | `SCOPE_DIR`/`FEATURE_DIR` are defined at STEP 2; probing them at STEP 1 would violate the command's own sequential-execution block | ✅ |
| Preflight severity is `block` / `degrade`, not binary | All-blocking would delete `add.qa`'s documented live-drive stopgap and block epic runs on a `design.md` no command writes until `02` | ✅ |
| Deterministic probes extracted to a shared script | Framework rule: no-reasoning work belongs in scripts, and `add.qa-setup` STEP 2 already implements these probes | ✅ |
| Orthogonality stated once, referenced elsewhere | `add-token-efficiency`'s "Reference, Never Repeat"; the earlier triplication proposal violated it | ✅ |
| `add-ecosystem` gains a `## Features` section mirroring `## Plugins` | The skill documents 8 sections and **no features at all** — `tdd` is invisible as a feature despite being default-on across 3 commands. `## Plugins` already establishes the pattern (table + one prose line with default + CLI + prerequisite), so this copies a house form rather than inventing one, and gives the orthogonality statement its natural home | ✅ |
| Manifest reads use `{{addpath:manifest.json}}` | The convention names this exact case, no command sets a precedent, and the lint would not catch a hardcoded path | ✅ |
| Lookup tables in command/skill bodies are acceptable | `add-token-efficiency:159` bans "tables in resources", but practice contradicts it — 31 body tables across 6 sampled resources, 14 in `add-ux-design` alone, and the rule's own skill both contains a table and sanctions tables for behavioral orientation at `:42`. House style, not a violation | ✅ |
| No fractional STEP numbering | `add-framework--build.md:161-163` prohibits `STEP 6.5`-style numbering; renumber the sequence instead | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `add.qa` | Two-phase preflight (STEP 1 + post-STEP 2); prohibitions consolidated; STEP 1.1 references the orthogonality statement; STEP 4.0 retained | Modify |
| `add.qa-setup` | Feature-gate step added by renumbering; post-enable verification; write-boundary prohibition row extended; STEP 10 records a declined enable | Modify |
| `add.plan` | Fragment self-detection notice before consolidation (always-present body text) | Modify |
| `add.test` | Fragment self-detection notice at the E2E dispatch point | Modify |
| `add.build` | None — already implements the pattern | None |
| `add-qa` skill | Owns the canonical orthogonality statement | Modify |
| `add-ecosystem` skill | New `## Features` section before `## Plugins` (table + enablement line + orthogonality statement); `add-tdd` Dependency Index row corrected to include `add.plan` and `add.review`; `qa-pipeline` parentheticals reference the section | Modify |
| `.codeadd/scripts/` | New shared prerequisite-probe script | Create |
| `cli/src/features.js` | None (default unchanged). Pre-sidecar no-op is detected by the setup step, not fixed here | Verify only |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| The silence ends where it starts, not three commands later | Two more commands to keep in sync with the pattern |
| One diagnostic pass instead of four round trips | A longer STEP 1 in `add.qa` |
| A single unambiguous QA opt-in point that verifies itself | `add.qa-setup` now mutates feature state and installed command files, widening its blast radius |
| Deterministic probes stop being LLM steps | A new script to maintain and ship |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The self-detection notice becomes noise on non-QA projects | Med | One line, in normal output, no gate. `add.build` keeps its stop only because the user explicitly asked for QA mode |
| Preflight probes are slow (HTTP + browser launch + spec glob) | Med | Cheap-to-expensive ordering; short-circuit expensive rows when a cheap blocker already failed, reporting those as `not probed` rather than as passing |
| `add.qa-setup` enabling a feature surprises a user who wanted only the runner | Low | Confirmation is mandatory and the decline path is already modelled for prerequisites |
| Enable succeeds, injection silently does nothing, user believes QA is on | **High** on pre-sidecar installs | Post-enable verification probes the installed command for the expected section and routes to re-install / `codeadd update` when absent |
| Spec-presence probe (row 12) is fragile across project conventions | Med | Resolve the spec location from the generated `qa-project` skill, never by guessing; report `unknown` when the skill is absent (row 7 already blocks) |
| `degrade` rows get treated as blockers by an implementer | Med | Severity is a required column, and `degrade` rows must be listed under "Not covered / caveats" in the resulting report |
| Users read the preflight table as a gate verdict | Low | Header states it is a diagnosis; `add.qa` never emits pass/fail language (existing hard ban) |
| Extending `add.qa-setup`'s write boundary is used to justify wider writes later | Low | The permission is narrow and named: the CLI-mediated feature enable only |

## Next Steps

Run: `/add-framework--plan implement docs/brainstorming/2026-07-26-01-qa-pipeline-reachability.md`
