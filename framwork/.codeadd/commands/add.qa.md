---
description: Agent-judged QA validation — drives the app via Playwright MCP, validates UX quality (vs design.md) AND functional delivery (vs about.md), writes a versioned _qa-report/validation-NNN.md (audit, not a gate). Requires the playwright plugin
argument-hint: "<about.md path | feature-id [SFxx]>  (e.g. /add.qa @docs/features/0001F-*/subfeatures/SF06-*/about.md  ·  /add.qa 0001F SF02)"
---

# QA Validation - Dual-Axis Agent Judge

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Drives the running app via Playwright MCP and judges it on **two axes**: UX quality vs `design.md` (looking at screenshots) and functional delivery vs `about.md` (actively exercising flows). Dispatches one `qa-agent` per subfeature, aggregates findings, writes a versioned `_qa-report/validation-NNN.md`. This is an **audit, not a gate** — it documents, it never fixes.

---

## Required Skills

Load skill `add-qa` (methodology — rubric, severity taxonomy, report schema, numbering; installed by the `playwright` plugin) before STEP 4.
Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 5 (the `qa-validation` schema + `_qa-report/` path + validation gate).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Gate            → plugin enabled + MCP detected + baseUrl reachable
STEP 2: Resolve scope   → spec-driven (about.md path) or id-driven (feature-id [SFxx])
STEP 3: Read specs      → about.md (functional) + design.md (UX) + screens.json (route map)
STEP 4: Dispatch agents → one qa-agent per SF (parallel), both axes
STEP 5: Aggregate+write → validation-NNN.md + screenshots/run-NNN/
STEP 6: Summary         → counts by severity + report path
STEP 7: Validation Gate → qa-validation schema gate
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 1** | `playwright` plugin not enabled OR Playwright MCP not detected | Any `browser_*` MCP call, dispatching qa-agent | Stop, route to `/add.qa-setup` + `codeadd plugins enable playwright` |
| **STEP 1** | `baseUrl` not reachable | Drive the browser, dispatch agents | Route to the config `bootHint` (start the app), then retry |
| **STEP 1** | `baseUrl` is a production/remote host | Drive at all | Refuse — functional QA mutates state; require a local/throwaway env |
| **STEP 3** | `screens.json` absent for the feature | Dispatch agents, guess routes | Route to `/add.qa-setup` to scaffold the catalog |
| **READ-ONLY** | Always | Edit/Write on source code, app config, migrations; fixing findings | Write only under `SCOPE_DIR/_qa-report/` |
| **STEP 7** | Report not written | Mark complete | Run the gate first |

---

## STEP 1: Gate

### 1.1 Capability gate
Verify the `playwright` plugin is enabled and the Playwright MCP server is connected (the agent will need `browser_*` tools). If not → STOP. Route the user to `/add.qa-setup` then `codeadd plugins enable playwright`. Do NOT attempt to drive.

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
- `FEATURE_DIR/_qa-report/screens.json` — the route map (which screens to visit + the design ref). If absent → route to `/add.qa-setup`.

---

## STEP 4: Dispatch QA Agents (one per SF, parallel)

Each subfeature is validated by its own `qa-agent` to isolate the heavy image context and parallelize across SFs. Dispatch all simultaneously.

<!-- plugin:playwright:drive -->
<!-- /plugin:playwright:drive -->

**DISPATCH AGENT: @qa-agent (one per SF) [read-write, heavy] — PARALLEL:**
Each agent is independent. Dispatch ALL in scope simultaneously. Each receives:
- the SF's `about.md` + `design.md` paths (the two contracts),
- its `screens.json` entries (route map for the UX axis),
- the viewport list + `baseUrl` + `authSeed` hint from `config.json`,
- the directive to validate **both axes**: UX quality (look at screenshots vs `design.md`) AND functional delivery (actively exercise each acceptance criterion vs `about.md`).
- **Output:** classified findings + the functional-checklist pass/fail roll-up + the curated screenshot paths.

**WAIT-ALL** before proceeding to STEP 5.

⛔ qa-agent is READ-ONLY on the codebase — it drives and reports, never fixes. If an agent edited code, reject the run.

---

## STEP 5: Aggregate & Write Report

Determine the next number **per scope**: scan `SCOPE_DIR/_qa-report/validation-*.md`, take the highest `NNN`, add 1 (start `001`). Run screenshots share the same `NNN` → `run-NNN`.

Write `SCOPE_DIR/_qa-report/validation-NNN.md` per the `qa-validation` schema (template carried by the `add-qa` skill). Copy each curated screenshot into `SCOPE_DIR/_qa-report/screenshots/run-NNN/`, preserving `<screen>.<viewport>.png` names so the report's relative links resolve.

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
