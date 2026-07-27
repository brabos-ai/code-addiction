---
name: add-qa
description: Use when running agent-judged QA validation (read-PNG by default; the playwright plugin adds live driving) — the Level C judge rubric, severity taxonomy, dual-axis (UX + functional) method, report schema/template, and the config.json/screens.json formats. Consumed by /add.qa and the qa-agent.
---

# add-qa — QA Validation Methodology

## Overview

The QA capability **judges from the persisted run evidence (screenshots + axe/assertion results); with the playwright plugin it additionally drives the app live** and lets the **agent be the judge** (Level C): the run captures evidence, the agent assesses it. It validates two axes — **UX quality** vs `design.md` (looking at screenshots) and **functional delivery** vs `about.md` (judged from functional-assertion results; with the plugin, additionally by live driving). It is an **audit, not a gate**: it documents findings that feed the next fix wave; it never fixes.

Prerequisite install (chromium + Playwright MCP) and config scaffolding are NOT here — they live in `/add.qa-setup` (must run before the plugin is enabled).

**Feature vs plugin (canonical statement):** `qa-pipeline` (feature) decides whether QA artefacts are **authored** — the plan QA-spec, the E2E specs, the `/add.build qa` mode. `playwright` (plugin) decides whether the judge can additionally **drive the app live**. They are orthogonal: enabling the plugin does not enable the pipeline. Features toggle via `codeadd features enable|disable qa-pipeline`; every consumer references this statement instead of restating it.

## When to Use

- `/add.qa` dispatches a `qa-agent` to validate a subfeature.
- A `qa-agent` needs the judge rubric, severity taxonomy, or the finding/report shape.

## When NOT to Use

- Installing prereqs or scaffolding `config.json`/`screens.json` → `/add.qa-setup`.
- Static code review (no rendered result) → `/add.review`.
- Unit/integration test generation → `/add.test`.

## Validation Model — Level C

The persisted spec (or, with the plugin, live driving) **captures and exercises**; only the **agent judges** fidelity and responsiveness. There is no pixel-diff and no Figma baseline — fidelity is agent judgement against `design.md`, plus regression-by-eye across runs. Both axes are default-on and spec-derived: pointing at the spec is enough, no manual "validate UX and functionality" instruction needed.

| Axis | Source of truth | Method |
|---|---|---|
| UX quality | `design.md` | Look at full-page screenshots per screen × **state** × viewport; judge layout/hierarchy/spacing, tokens/color/type, single primary CTA, responsiveness, correct state. **Coverage is contract-anchored: every screen `design.md` declares must have evidence — a reachable declared screen with none is a `blocker`.** |
| Functional delivery | `about.md` (RF/RN + acceptance criteria) | Judge each criterion from the persisted spec's functional-assertion results (and, with the plugin, additionally by live driving); mark met / not met / partial; fold in console/network/4xx–5xx diagnostics |
| Responsiveness | config.json viewports | Per-viewport screenshots: overflow / clipping / wrapping / off-canvas, tap-target size on the smallest viewport |
| a11y | axe-core + design.md | Deterministic axe violations (rule/impact) + visual notes: contrast, visible focus, heading order |

Viewports (v1, configurable in `config.json`): desktop 1440, tablet 768, mobile 375.

**Read-PNG mode:** with the plugin off, judge UX/responsiveness from the persisted PNGs + axe/assertion artifacts (no `browser_*`); with it on, additionally live-drive.

## Severity Taxonomy

| Severity | Meaning |
|---|---|
| `blocker` | Unusable / broken core path |
| `major` | Significant deviation or functional error |
| `minor` | Small visual/functional issue |
| `polish` | Cosmetic / low-confidence |

Each finding is also tagged `type: ux | functional | a11y`. An *expected* error state (e.g. invalid-token) is correct behavior, not a finding.

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
method: <read-png | read-png+live-drive> — dual-axis (UX + functional) + responsiveness + a11y (Level C)
specs: { about: <about.md ref>, design: <design.md ref> }
viewports: <from docs/qa/config.json>
---

# QA Validation NNN — <feature-id>

## TL;DR
<1–2 lines: overall health + headline problems for next wave.>

## Summary
| Severity | Count |
|---|---|
| Blocker | N |
| Major | N |
| Minor | N |
| Polish | N |

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
### [SEVERITY · ux|functional|a11y] <screen> @<viewport> — <short title>
- **Screen:** <route> · **Spec:** <about.md criterion> · **Design:** <design.md ref>
- **Type:** ux | functional | a11y
- **Evidence:** ![](screenshots/<screen>.<state>.<viewport>.png) · `<log line if functional>`
- **Observed:** <what is wrong / what the behavior did>
- **Expected:** <what design.md shows OR what the about.md criterion promises>
- **Fix hint:** <where/what to change>

## Responsiveness (per viewport)
<overflow / clipping / tap-target notes per viewport, or "clean">

## Accessibility (axe-core + visual)
<axe violations by rule/impact + visual notes: contrast, focus, heading order, or "clean">

## Clean screens
<screens that passed UX + functional with no findings>

## Not covered / caveats
<screens/criteria skipped, auth not seeded, flows not reachable, no image baseline
(fidelity is agent judgement, not pixel-diff vs Figma), post-interaction states not
captured, etc.>
```

## Validation Checklist

```
[ ] Both axes judged (UX vs design.md, functional vs about.md) — neither silently skipped
[ ] Coverage reconciled vs design.md — every declared screen captured + judged; reachable, in-contract gaps raised as blockers (not soft notes)
[ ] Every finding has evidence (screenshot path and/or log line) + severity + type
[ ] Functional roll-up lists each criterion tested (met/not met/partial)
[ ] Report numbered per scope (qa-validation-NNN, start 001); run-NNN matches
[ ] Unreached screens/criteria recorded under "Not covered"
[ ] No code modified — audit only
```
