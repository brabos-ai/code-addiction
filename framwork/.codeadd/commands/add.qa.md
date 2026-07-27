---
description: Agent-judged QA validation — runs persisted specs + reads persisted PNGs, validates UX quality (vs design.md) AND functional delivery (vs about.md), writes a versioned _tests/run-NNN/qa-validation-NNN.md (audit, not a gate). Plugin optional: runs persisted specs + reads PNGs without it, live-drives with it
argument-hint: "<about.md path | feature-id [SFxx]>  (e.g. /add.qa @docs/features/0001F-*/subfeatures/SF06-*/about.md  ·  /add.qa 0001F SF02)"
---

# QA Validation - Dual-Axis Agent Judge

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Runs the persisted `<surface>.qa.spec` and judges the result on **four axes**: UX quality vs `design.md`, functional delivery vs `about.md`, responsiveness across viewports, and a11y. With the `playwright` plugin it additionally drives the app live for richer evidence. Dispatches one `qa-agent` per subfeature, aggregates findings, writes a versioned `_tests/run-NNN/qa-validation-NNN.md`. This is an **audit, not a gate** — it documents, it never fixes.

---

## Required Skills

Load skill `{{skill:add-qa/SKILL.md}}` (now default-shipped; methodology — rubric, severity, report schema, numbering, read-PNG mode) before STEP 4.
Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 5 (the `qa-validation` schema + `_tests/run-NNN/` path + validation gate).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Preflight Phase A → deterministic project-level probes (qa-preflight.sh) — collect ALL rows, no stop-at-first
STEP 2: Resolve scope   → spec-driven (about.md path) or id-driven (feature-id [SFxx]), then Phase B + consolidated diagnosis
STEP 3: Read specs      → about.md + design.md + _tests/screens.json
STEP 4: Run specs + dispatch → run <surface>.qa.spec, then qa-agent per SF (functional/UX/responsiveness/a11y)
STEP 5: Aggregate+write → _tests/run-NNN/{qa-validation-NNN.md, screenshots/}
STEP 6: Summary         → counts by severity + report path
STEP 7: Validation Gate → qa-validation schema gate
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 1-2 preflight** | Any `block` row failed | Run specs, dispatch agents, stop at the FIRST failure | Collect every row, report the ONE consolidated diagnosis with per-row remedy, then stop |
| **STEP 1-2 preflight** | Only `degrade` rows failed | Stopping the run | Record each degraded axis under "Not covered / caveats" and continue |
| **STEP 1** | `baseUrl` is a production/remote host (`QA_BASEURL_LOCAL=broken`) | Run at all | Refuse — the specs submit forms and create records; require a local/throwaway env |
| **READ-ONLY** | Always | Edit/Write on source code, app config, migrations; fixing findings | Write only under `SCOPE_DIR/_tests/run-NNN/` |
| **STEP 7** | Report not written | Mark complete | Run the gate first |

---

## STEP 1: Preflight — Phase A (project-level)

### 1.1 Capability context
The `playwright` plugin is **optional**. If enabled + MCP connected → live-driving mode is available. If not → **degraded mode** (run persisted specs via the runner + read persisted PNGs). Do NOT stop for a missing plugin. The feature/plugin split is canonical in `{{skill:add-qa/SKILL.md}}` ("Feature vs plugin") — enabling the plugin does NOT enable the `qa-pipeline` feature.

### 1.2 Run the deterministic probes
```bash
bash .codeadd/scripts/qa-preflight.sh a
```
Parse the `KEY=STATUS` lines. `missing` and `broken` are distinct diagnoses (absent vs present-but-non-functional); `not-probed` means a cheaper blocker short-circuited the row — report it as not probed, never as passing. `QA_FEATURE_STATE=unset|no-manifest` resolves by the feature's default: `qa-pipeline` defaults to **disabled**.

### 1.3 Phase A rows

| # | Prerequisite | Probe | Severity |
|---|---|---|---|
| 1 | `qa-pipeline` feature enabled | `QA_FEATURE_STATE` + default | **degrade** — no authored specs; live-drive stopgap still possible with the plugin. Remedy: `codeadd features enable qa-pipeline` |
| 2 | `docs/qa/config.json` present + parseable + has `baseUrl` | `QA_CONFIG` | block |
| 3 | `baseUrl` local/throwaway | `QA_BASEURL_LOCAL` | block — refuse production |
| 4 | `baseUrl` reachable | `QA_BASEURL_REACHABLE` | block — surface the config `bootHint` |
| 5 | `@playwright/test` functional in the project | `QA_RUNNER` | block |
| 6 | chromium launchable | `QA_CHROMIUM` | block |
| 7 | `qa-project` skill present | `QA_PROJECT_SKILL` | block — it carries the run commands |
| 8 | `playwright` MCP connected | provider MCP listing (not scripted) | **degrade** — read-PNG mode |

Collect ALL rows — the consolidated diagnosis is assembled after Phase B (STEP 2.2). Do NOT stop here even on a `block` failure; the user gets every problem and its remedy at once.

---

## STEP 2: Resolve Scope

### 2.1 Scope resolution
Two input forms — detect from the first token:
- **Spec-driven** (a path ending in `about.md`, or a subfeature/feature folder path): `SCOPE_DIR` = the doc's containing folder; read that `about.md` + the sibling `design.md`; infer `feature-id` + `SFxx` from the path.
- **Id-driven** (`feature-id [SFxx]`): `FEATURE_DIR = docs/features/<feature-id>-*`. If `SFxx` given → `SCOPE_DIR = FEATURE_DIR/subfeatures/SFxx-*` (probe that SF). Else → `SCOPE_DIR = FEATURE_DIR` (probe every SF in the catalog).

### 2.2 Preflight — Phase B (feature-scoped) + consolidated diagnosis
```bash
bash .codeadd/scripts/qa-preflight.sh b "<FEATURE_DIR>" "<spec glob from the qa-project skill>"
```
Resolve the spec glob from the generated `qa-project` skill's conventions — never guess it; if the skill is absent (row 7 already blocks), pass no glob and the row reports `not-probed`.

| # | Prerequisite | Probe | Severity |
|---|---|---|---|
| 9 | `about.md` per SF in scope | file read | block — the functional axis has no contract |
| 10 | `design.md` at `SCOPE_DIR` | file read | **degrade** — the UX axis cannot run; the functional axis still can |
| 11 | `FEATURE_DIR/_tests/screens.json` | `QA_SCREENS` | block — remedy: `/add.qa-setup` scaffolds the catalog |
| 12 | `<surface>.qa.spec` persisted | `QA_SPECS` | **degrade** — falls back to STEP 4.0's stopgap |

Now emit the ONE consolidated preflight report (Phase A + Phase B): every failed row with its severity and exact remedy, `missing` vs `broken` distinguished, `not-probed` rows listed as such. The header states this is a **diagnosis**, not a verdict. Then:
- Any `block` row failed → STOP. `add.qa` repairs nothing — the diagnosis is the deliverable.
- Only `degrade` rows failed → record each under "Not covered / caveats" for the STEP 5 report and continue.

---

## STEP 3: Read Specs (per SF in scope)

For each subfeature in scope, read:
- `about.md` — the **functional contract**: RF/RN, acceptance criteria, rules, flows. Source of truth for *what behavior to prove*.
- `design.md` — the **UX contract**: source of truth for *what it should look like*.
- `FEATURE_DIR/_tests/screens.json` — the route map (which screens to visit + the design ref). If absent → route to `/add.qa-setup`.

---

## STEP 4: Run Persisted Specs + Dispatch QA Agents (one per SF, parallel)

4.1 Run the surface's <surface>.qa.spec via the qa-project Managed App Lifecycle
    (probe → boot-bg + wait-ready if down → run → teardown-iff-booted).
    Collect: functional assertion pass/fail, axe-core results, PNGs written to
    _tests/run-NNN/screenshots/<screen>.<state>.<viewport>.png (one per screen × state × viewport).
    If persisted specs are ABSENT → branch on WHY (see 4.0).

4.0 Specs absent:
    - qa-pipeline OFF → specs were never authored. Tell the user:
      `codeadd features enable qa-pipeline` + `/add.qa-setup` + `/add.test`.
      Do NOT bounce to /add.test (it won't author E2E with the feature off).
    - qa-pipeline ON, not yet generated → route to /add.test to author them;
      or (plugin ON) fall back to today's live-drive-from-catalog as a stopgap.

4.2 DISPATCH @qa-agent (one per SF, PARALLEL). Mode:
    - plugin OFF → read-PNG mode: Read the PNGs + DOM/console artifacts the run
      captured; judge UX. No browser_* calls.
    - plugin ON → read-PNG PLUS live driving (open unscripted states, read
      console/network interactively, capture extra evidence).
    Each agent folds in the axe-core results + functional assertion roll-up, and
    reconciles captured evidence against the design.md-declared screen set —
    a reachable, in-contract screen with no evidence is a coverage blocker, not a note.
    If @qa-agent is not available in this engine, dispatch a generic subagent with
    this same directive + the add-qa skill (soft-degrade — the judged arm still runs
    where agents don't build; the deterministic assertion + axe results from 4.1 are
    provider-independent).
    WAIT-ALL before STEP 5.

<!-- plugin:playwright:drive -->
<!-- /plugin:playwright:drive -->

⛔ qa-agent is READ-ONLY on the codebase — it judges and reports, never fixes. If an agent edited code, reject the run.

---

## STEP 5: Aggregate & Write Report

Determine the next `run-NNN` **per scope**: scan `SCOPE_DIR/_tests/run-*/`, take the highest `NNN`, add 1 (start `001`).

Write `SCOPE_DIR/_tests/run-NNN/qa-validation-NNN.md` per the `qa-validation` schema (template carried by the `add-qa` skill). Copy each curated screenshot into `SCOPE_DIR/_tests/run-NNN/screenshots/`, preserving `<screen>.<state>.<viewport>.png` names so the report's relative links resolve.

---

## STEP 6: Console Summary

Report to the user: counts by severity (blocker / major / minor / polish), the functional-delivery roll-up (criteria met / not met / partial), and the report path. **Do not fix anything** — surface the next route (`/add.build` or `/add.review`) per the ecosystem map.

---

## STEP 7: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `qa-validation`.

⛔ DO NOT mark the command complete until the gate returns `PASS`.

---

## Rules

ALWAYS:
- Treat the result as an audit that feeds the next fix wave — surface the build/review route, never emit a pass/fail verdict

NEVER:
- Drive against a production/remote `baseUrl` — the functional axis submits forms and creates records
- Modify application code or fix findings — QA documents, it does not repair
