---
name: add-qa
description: Use when running agent-judged QA validation (read-PNG by default; the playwright plugin adds live driving) — the Level C judge rubric, severity taxonomy, dual-judge (@ux-agent review ∥ @qa-agent) method, report schema/template, and the config.json/screens.json formats. Consumed by /add.qa and both judges.
---

# add-qa — QA Validation Methodology

## Overview

The QA capability **judges from the persisted run evidence (screenshots + computed styles + axe/assertion results); with the playwright plugin it additionally drives the app live** and lets the **agents be the judges** (Level C): the run captures evidence, the judges assess it. `/add.qa` dispatches **two specialist judges per subfeature, in parallel** — `@ux-agent` in review mode (the judgement axes: UX quality, judgement conformance, responsiveness) and `@qa-agent` (functional delivery vs `about.md`, deterministic Design Contract conformance from measured computed styles, ALL accessibility, and failure forensics) — and the coordinator reconciles coverage once, then merges the two finding sets. It is an **audit, not a gate**: it documents findings that feed the next fix wave; it never fixes. Each screen's `design.md` `## Design Contract` is the source of truth for both conformance judgements — the dimensions it names, and how each is verified, decide which judge owns each row: computed-style rows are `@qa-agent`'s deterministic comparison, the judgement rows are `@ux-agent`'s.

Prerequisite install (chromium + Playwright MCP) and config scaffolding are NOT here — they live in `/add.qa-setup` (must run before the plugin is enabled).

**Feature vs plugin (canonical statement):** `qa-pipeline` (feature) decides whether QA artefacts are **authored** — the plan QA-spec, the E2E specs, the `/add.build qa` mode. `playwright` (plugin) decides whether the judge can additionally **drive the app live**. They are orthogonal: enabling the plugin does not enable the pipeline. Features toggle via `codeadd features enable|disable qa-pipeline`; every consumer references this statement instead of restating it.

## When to Use

- `/add.qa` dispatches the judge pair (`@ux-agent` review ∥ `@qa-agent`) to validate a subfeature.
- Either judge needs the rubric, severity taxonomy, root-cause taxonomy, or the finding/report shape.

## When NOT to Use

- Installing prereqs or scaffolding `config.json`/`screens.json` → `/add.qa-setup`.
- Static code review (no rendered result) → `/add.review`.
- Unit/integration test generation → `/add.test`.

## Validation Model — Level C

The persisted spec (or, with the plugin, live driving) **captures and exercises**; only the **agents judge** fidelity, conformance, and delivery. There is no pixel-diff and no Figma baseline — fidelity is agent judgement against `design.md`, plus regression-by-eye across runs. **Deterministic conformance is not an exception to "no pixel-diff": it compares captured computed-style NUMBERS (font-size, gap, token values) against the contract's declared values — never images.** Both arms are default-on and spec-derived: pointing at the spec is enough, no manual "validate UX and functionality" instruction needed.

### Axis ownership — two judges, no axis judged twice

`/add.qa` STEP 4.5 dispatches `@ux-agent` (review mode) ∥ `@qa-agent`, one pair per SF. Each axis has exactly one owner so the STEP 5 dedupe is well-defined:

| Axis | Judge | Source of truth |
|---|---|---|
| UX quality (judgement) | `@ux-agent` | `## Design Contract` + `## Design Review` |
| Conformance — deterministic | `@qa-agent` | captured computed styles vs the contract |
| Conformance — judgement (hierarchy, optical alignment, primary-CTA reading, declared reflow) | `@ux-agent` | contract + screenshots |
| Responsiveness | `@ux-agent` | declared breakpoint behaviour + per-viewport PNGs |
| Functional delivery | `@qa-agent` | `about.md` criteria + assertion roll-up |
| Failure forensics | `@qa-agent` | assertion error + failure PNG + console/network |
| a11y — ALL of it | `@qa-agent` | axe-core (incl. `color-contrast`, `target-size`) |

`@ux-agent` receives NO axe results and NO computed-style JSON; `@qa-agent` receives no `design.md` judgement content. Handing either the other's input is a dispatch error. Coverage is the **coordinator's** reconciliation (STEP 4.4), computed once and handed to both — never a judge's finding.

Viewports (v1, configurable in `config.json`): desktop 1440, tablet 768, mobile 375.

**Read-PNG mode:** with the plugin off, both judges work from the persisted PNGs + axe/assertion/computed-style artifacts (no `browser_*`); with it on, they additionally live-drive.

## Review-mode Approval Rubric (`@ux-agent`) — summary

`@ux-agent` review mode judges ONLY the judgement dimensions (full rubric in the `ux-agent` definition, section "Approval Rubric"): breakpoint behaviour (declared reflow happened), primary-CTA count vs declared, visual hierarchy leads to the primary action, optical alignment, required-state RENDER quality, and the overall UX read vs the contract. Spacing/token/type/grid values and ALL a11y are OUT — those are `@qa-agent`'s deterministic rows. When the rubric needs a dimension the contract never declared, the reviewer emits `type: spec-gap` naming the exact missing dimension.

## Root-cause Taxonomy (`@qa-agent`) — functional findings

Every `type: functional` finding carries **exactly one** root cause, cited to the evidence that grounds it:

| Root cause | Signature |
|---|---|
| `missing-implementation` | the element/behaviour the criterion promises does not exist |
| `contract-mismatch` | frontend and backend disagree on field, shape, or status code |
| `selector-drift` | element exists but the spec's selector no longer matches |
| `spec-defect` | the assertion itself is wrong or over-specified |
| `data-seed` | flow needs state the run did not seed (authSeed gap) |
| `env-boot` | app or dependency not up; environmental |
| `regression` | a criterion that passed in the immediately previous run now fails |

`regression` reads ONLY the immediately previous `run-NNN` report — no deeper history walk; the first run has no regression class. Expected error states are correct behavior, never classified. `@qa-agent`'s deterministic conformance findings are `type: ux` and instead carry one of `contract-violated | contract-inadequate`.

## Coordinator-only knowledge (NOT for the judges)

The **merge rules** (dedupe / domain precedence / severity / contradiction) and the **Fix Routing** rules (routing lookup table, the `ux` two-value classification, capability validation, dependency ordering, the `## Fix Routing` template, the contract-amendment trail) live in `{{skill:add-qa/references/coordinator.md}}`. `/add.qa` loads that file before it merges; **a judge never does** — judges emit `type` + root cause and never a `route`.

## Severity Taxonomy

| Severity | Meaning |
|---|---|
| `blocker` | Unusable / broken core path |
| `major` | Significant deviation or functional error |
| `minor` | Small visual/functional issue |
| `polish` | Cosmetic / low-confidence |

Each finding is also tagged `type: ux | functional | a11y | spec-gap`. An *expected* error state (e.g. invalid-token) is correct behavior, not a finding. A declared dimension whose verification method did not run (computed styles not captured, axe absent, a state never reached) is recorded `unverifiable` with the reason — never as passing, never silently dropped.

## Scope, Path & Numbering

- **Scope:** SF folder when scoped to a subfeature (`SCOPE_DIR = .../subfeatures/SFxx-*`), feature folder otherwise.
- **Report path:** `SCOPE_DIR/_tests/run-NNN/qa-validation-NNN.md`; screenshots in `SCOPE_DIR/_tests/run-NNN/screenshots/` named `<screen>.<state>.<viewport>.png` (one file per screen × state × viewport; `<state>` from the spec's `capture states`, `default` for single-state screens).
- **Numbering:** per scope, `qa-validation-NNN` starting `001`; each SF keeps its own regression history. The report and its screenshots share the same `run-NNN`. See `{{skill:add-id-convention/SKILL.md}}` (per-scope sequence IDs) and the `qa-validation` schema in `{{skill:add-doc-schemas/SKILL.md}}`.

## Config & Catalog Formats (reference)

> **Source of truth: `/add.qa-setup`.** These blocks are a read-time reference for the run command + agent (which *consume* the files). `/add.qa-setup` is the canonical **scaffolder** — it runs before this plugin skill exists, so it carries the authoritative shape. If the two ever diverge, `/add.qa-setup` wins; update it, then mirror here.

`docs/qa/config.json` (project-wide; scaffolded by `/add.qa-setup`):
```json
{
  "baseUrl": "http://localhost:5173",
  "viewports": { "desktop": [1440, 900], "tablet": [768, 1024], "mobile": [375, 812] },
  "bootHint": "how to start the app's dev server (free text, project-specific)",
  "authSeed": "how an authenticated session is obtained for auth:true screens (free text / steps)"
}
```

`FEATURE_DIR/_tests/screens.json` (route map for the UX axis; `sf` enables per-SF filtering). The functional axis intent is NOT stored here — it is read from each SF's `about.md` at run time, so the catalog stays small and the functional contract has one source of truth:
```json
{
  "feature": "0001F",
  "screens": [
    { "id": "login", "sf": "SF02", "name": "Login", "path": "/login", "auth": false, "design": "docs/features/0001F-.../subfeatures/SF02-.../design.md", "expect": "what a correct render / expected state looks like" }
  ]
}
```

## Report Template (`qa-validation-NNN.md`)

```markdown
---
id: <feature-id>-qa-validation-NNN
type: qa-validation
created: <YYYY-MM-DD>
feature: <feature-id>
scope: [<SFxx>, ...]
method: <read-png | read-png+live-drive> — dual-judge (@ux-agent review ∥ @qa-agent) (Level C)
specs: { about: <about.md ref>, design: <design.md ref> }
viewports: <from docs/qa/config.json>
judged-contract: sha256:<design.md provenance hash>
---

# QA Validation NNN — <feature-id>

## TOC
- [TL;DR](#tldr) · [Summary](#summary) · [Coverage](#coverage-contract-anchored-vs-designmd) · [Functional delivery](#functional-delivery-vs-aboutmd) · [Findings](#findings) · [Responsiveness](#responsiveness-per-viewport) · [Accessibility](#accessibility-axe-core--visual) · [Fix Routing](#fix-routing) · [Clean screens](#clean-screens) · [Not covered / caveats](#not-covered--caveats)

## TL;DR
<1–2 lines: overall health + headline problems for next wave.>

## Summary
| Severity | Count |
|---|---|
| Blocker | N |
| Major | N |
| Minor | N |
| Polish | N |

| By judge | Count |
|---|---|
| @ux-agent | N |
| @qa-agent | N |
| coordinator (coverage) | N |
| merged duplicates | N |
| contradictions | N |

## Coverage (contract-anchored, vs design.md)
| Screen (design.md) | States captured | Viewports | Judged | Gap |
|---|---|---|---|---|
| <screen> | empty,filled,list | desktop,tablet,mobile | yes | — |
| <screen> | — | — | no | BLOCKER: declared in design.md, no evidence |

## Functional delivery (vs about.md)
| Acceptance criterion / RF | Result | Evidence |
|---|---|---|
| <criterion from about.md> | met / not met / partial | <screenshot or note> |

## Findings
### [SEVERITY · ux|functional|a11y|spec-gap] <screen> @<viewport> — <short title>
- **Screen:** <route> · **Spec:** <about.md criterion> · **Design:** <design.md contract row / ref>
- **Type:** ux | functional | a11y | spec-gap
- **Root cause:** <one of the 7 — `type: functional` only> · **Conformance:** <contract-violated | contract-inadequate — `type: ux` conformance only>
- **Evidence:** ![](screenshots/<screen>.<state>.<viewport>.png) · `<log line if functional>` · <measured value vs declared set if conformance>
- **Observed:** <what is wrong / what the behavior did>
- **Expected:** <what design.md's Design Contract row shows OR what the about.md criterion promises>
- **Fix hint:** <where/what to change>
- **Route:** <@agent → @agent · target: class — coordinator-derived, see Fix Routing>

## Responsiveness (per viewport)
<overflow / clipping / tap-target notes per viewport, or "clean">

## Accessibility (axe-core + visual)
<axe violations by rule/impact + visual notes: contrast, focus, heading order, or "clean">

## Fix Routing
<the coordinator's dispatch plan for `/add.build qa` — table shape + rules in `{{skill:add-qa/references/coordinator.md}}`.
`data-seed`/`env-boot` and @ux-agent/user routes are unordered (—); if the contract was
amended since the previous run, note "contract amended since run-NNN" + the dimensions.>
| Order | Agent | Findings | Target class | Blocked by |
|---|---|---|---|---|
| 1 | @backend-agent | F1 | api | — |
| — | @ux-agent | F4 | design-spec | — |
| — | user (manual) | F6 (data-seed: authSeed) | env-config | — |

## Clean screens
<screens that passed UX + functional with no findings>

## Not covered / caveats
<screens/criteria skipped, auth not seeded, flows not reachable, no image baseline
(fidelity is agent judgement, not pixel-diff vs Figma), post-interaction states not
captured, etc.>
```

## Validation Checklist

```
[ ] Both judges ran (@ux-agent review ∥ @qa-agent) — neither arm silently skipped; a soft-degrade to a generic subagent still counts as run
[ ] Coverage reconciled by the coordinator vs design.md — every declared screen captured + judged; reachable, in-contract gaps raised as blockers (not soft notes)
[ ] No axis judged twice — @ux-agent got no axe/computed-style input, @qa-agent got no design.md judgement content
[ ] Every finding has evidence (screenshot path, measured value, and/or log line) + severity + type
[ ] Every functional finding carries exactly one root cause; not-run checks recorded `unverifiable`, never passing
[ ] Findings merged per the Merge Rules in `{{skill:add-qa/references/coordinator.md}}` — coordinator work; a judge neither loads that file nor runs this row
[ ] Every finding carries a coordinator-derived `route`, valid per that same reference — coordinator work
[ ] Functional roll-up lists each criterion tested (met/not met/partial)
[ ] Report numbered per scope (qa-validation-NNN, start 001); run-NNN matches; TOC present
[ ] Unreached screens/criteria recorded under "Not covered"
[ ] No code modified — audit only
```
