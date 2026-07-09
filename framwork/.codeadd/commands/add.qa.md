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
STEP 1: Gate            → config present + baseUrl reachable/local (plugin optional)
STEP 2: Resolve scope   → spec-driven (about.md path) or id-driven (feature-id [SFxx])
STEP 3: Read specs      → about.md + design.md + _tests/screens.json
STEP 4: Run specs + dispatch → run <surface>.qa.spec, then qa-agent per SF (functional/UX/responsiveness/a11y)
STEP 5: Aggregate+write → _tests/run-NNN/{qa-validation-NNN.md, screenshots/}
STEP 6: Summary         → counts by severity + report path
STEP 7: Validation Gate → qa-validation schema gate
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 1** | `baseUrl` not reachable | Run specs, dispatch agents | Route to the config `bootHint` (start the app), then retry |
| **STEP 1** | `baseUrl` is a production/remote host | Run at all | Refuse — the specs submit forms and create records; require a local/throwaway env |
| **STEP 3** | `screens.json` absent for the feature | Dispatch agents, guess routes | Route to `/add.qa-setup` to scaffold the catalog |
| **READ-ONLY** | Always | Edit/Write on source code, app config, migrations; fixing findings | Write only under `SCOPE_DIR/_tests/run-NNN/` |
| **STEP 7** | Report not written | Mark complete | Run the gate first |

---

## STEP 1: Gate

### 1.1 Capability gate
The `playwright` plugin is **optional**. If enabled + MCP connected → live-driving mode is available. If not → **degraded mode** (run persisted specs via the runner + read persisted PNGs). Do NOT stop for a missing plugin.

### 1.2 Reachability + safety gate
Read `docs/qa/config.json`. Confirm `baseUrl` is reachable; if not, surface the config `bootHint` and stop until the app is up. Confirm `baseUrl` is a local/throwaway environment — refuse to run against production (the functional axis submits forms and creates records).

---

## STEP 2: Resolve Scope

Two input forms — detect from the first token:
- **Spec-driven** (a path ending in `about.md`, or a subfeature/feature folder path): `SCOPE_DIR` = the doc's containing folder; read that `about.md` + the sibling `design.md`; infer `feature-id` + `SFxx` from the path.
- **Id-driven** (`feature-id [SFxx]`): `FEATURE_DIR = docs/features/<feature-id>-*`. If `SFxx` given → `SCOPE_DIR = FEATURE_DIR/subfeatures/SFxx-*` (probe that SF). Else → `SCOPE_DIR = FEATURE_DIR` (probe every SF in the catalog).

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
