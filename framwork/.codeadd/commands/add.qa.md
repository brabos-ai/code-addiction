---
description: Agent-judged QA validation — runs persisted specs + reads persisted PNGs, validates UX quality (vs design.md) AND functional delivery (vs about.md), writes a versioned _tests/run-NNN/qa-validation-NNN.md (audit, not a gate). Plugin optional: runs persisted specs + reads PNGs without it, live-drives with it
argument-hint: "<about.md path | feature-id [SFxx]>  (e.g. /add.qa @docs/features/0001F-*/subfeatures/SF06-*/about.md  ·  /add.qa 0001F SF02)"
---

# QA Validation - Dual-Judge Agent Panel

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Runs the persisted `<surface>.qa.spec` and judges the result with **two parallel specialists**: `@ux-agent` (review mode) owns the judgement axes — UX quality, judgement conformance, responsiveness — and `@qa-agent` owns the deterministic axes — computed-style conformance, functional delivery vs `about.md`, failure forensics, and all a11y. With the `playwright` plugin they additionally drive the app live for richer evidence. The coordinator reconciles coverage itself, dispatches the judge pair per subfeature, **merges** their findings under explicit rules, and writes a versioned `_tests/run-NNN/qa-validation-NNN.md`. This is an **audit, not a gate** — it documents, it never fixes.

---

## Required Skills

Load skill `{{skill:add-qa/SKILL.md}}` (now default-shipped; methodology — rubric, severity, report schema, numbering, read-PNG mode) before STEP 4.
Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 5 (the `qa-validation` schema + `_tests/run-NNN/` path + validation gate).
Load `{{skill:add-qa/references/coordinator.md}}` before STEP 5 (merge rules + Fix Routing) — coordinator-only; do NOT pass it to either judge.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Preflight Phase A → deterministic project-level probes (qa-preflight.sh) — collect ALL rows, no stop-at-first
STEP 2: Resolve scope   → spec-driven (about.md path) or id-driven (feature-id [SFxx]), then Phase B + consolidated diagnosis
STEP 3: Read specs      → about.md + DESIGN_FILE + _tests/screens.json
STEP 4: Resolve run-NNN → qa-evidence.sh union allocation → run spec → reconcile coverage → dispatch judge pair per SF
STEP 5: Merge + write   → merge rules (dedupe/precedence/severity/contradiction) → _tests/run-NNN/{qa-validation-NNN.md, screenshots/}
STEP 6: Summary         → counts by severity + per-judge counts + report path
STEP 7: Validation Gate → qa-validation schema gate
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 1-2 preflight** | Any `block` row failed | Run specs, dispatch agents, stop at the FIRST failure | Collect every row, report the ONE consolidated diagnosis with per-row remedy, then stop |
| **STEP 1-2 preflight** | Only `degrade` rows failed | Stopping the run | Record each degraded axis under "Not covered / caveats" and continue |
| **STEP 1** | `baseUrl` is a production/remote host (`QA_BASEURL_LOCAL=broken`) | Run at all | Refuse — the specs submit forms and create records; require a local/throwaway env |
| **STEP 4.1** | Before 4.2 writes anything | Writing evidence under a `run-NNN` not yet resolved; recomputing the number later | Resolve `run-NNN` in 4.1; every later path reuses it |
| **STEP 4.1** | Always | Scanning only working runs; writing directly under `_tests/final/` | Use `qa-evidence.sh next`; write the new audit under `_tests/run-NNN/` only |
| **STEP 4.4** | Coverage reconciliation | Delegating coverage to a judge; downgrading an uncaptured in-contract screen to a note | Coordinator builds the table; uncaptured reachable screen = `blocker` |
| **STEP 4.5** | Dispatch | Handing `@ux-agent` axe results or the computed-style JSON; letting one axis be judged twice | Split strictly per the axis ownership table |
| **STEP 4.5** | A declared dimension's verification method did not run | Recording it as passing, or omitting it | Record `unverifiable` + the reason |
| **STEP 5** | The two judges contradict each other | Dropping either position, or picking a winner silently | Report once at the LOWER severity with both positions verbatim |
| **READ-ONLY** | Always — `@ux-agent` and `@qa-agent` alike | Edit/Write on ANY file; fixing findings | Both judges return findings and write NOTHING — `@qa-agent` carries `disallowedTools` enforcing it. The coordinator alone writes under `SCOPE_DIR/_tests/run-NNN/` |
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
| 9 | Receipt `docs/qa/qa-setup.md` present with readable `setup-shape` | `QA_RECEIPT` | **block** — remedy: `{{cmd:add.qa-setup}}` |
| 10 | Receipt `setup-shape` equals shipped `contracts.json` shape | `QA_CONTRACT_MATCH` | **block** — remedy: `{{cmd:add.qa-setup}}` (full re-materialize) |

`{{cmd:add.qa-setup}}` interprets rows 9–10 as work-to-do, never a stop. This command interprets them as `block`.

Collect ALL rows — the consolidated diagnosis is assembled after Phase B (STEP 2.2). Do NOT stop here even on a `block` failure; the user gets every problem and its remedy at once.

---

## STEP 2: Resolve Scope

### 2.1 Scope resolution
Two input forms — detect from the first token:
- **Spec-driven** (a path ending in `about.md`, or a subfeature/feature folder path): `SCOPE_DIR` = the doc's containing folder; read that `about.md`; infer `feature-id`, `SFxx` and `FEATURE_DIR` from the path.
- **Id-driven** (`feature-id [SFxx]`): `FEATURE_DIR = docs/features/<feature-id>-*`. If `SFxx` given → `SCOPE_DIR = FEATURE_DIR/subfeatures/SFxx-*` (probe that SF). Else → `SCOPE_DIR = FEATURE_DIR` (probe every SF in the catalog).

SET `DESIGN_FILE` per the `feature-design` **Location** rule in `{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first, feature-level fallback) — i.e. `SCOPE_DIR/design.md`, else `FEATURE_DIR/design.md`. Every later step (preflight row 12, STEP 3, the `@ux-agent` dispatch) consumes `DESIGN_FILE`, never a re-derived path.

### 2.2 Preflight — Phase B (feature-scoped) + consolidated diagnosis
```bash
bash .codeadd/scripts/qa-preflight.sh b "<FEATURE_DIR>" "<spec glob from the qa-project skill>"
```
Resolve the spec glob from the generated `qa-project` skill's conventions — never guess it; if the skill is absent (row 7 already blocks), pass no glob and the row reports `not-probed`.

| # | Prerequisite | Probe | Severity |
|---|---|---|---|
| 11 | `about.md` per SF in scope | file read | block — the functional axis has no contract |
| 12 | `DESIGN_FILE` (SF-level, else feature-level — see 2.1) | file read | **degrade** — the UX axis cannot run; the functional axis still can |
| 13 | `FEATURE_DIR/_tests/screens.json` | `QA_SCREENS` | block — remedy: `{{cmd:add.qa-setup}}` scaffolds the empty catalog; `{{cmd:add.plan}}` fills it |
| 14 | `<surface>.qa.spec` persisted | `QA_SPECS` | **degrade** — falls back to STEP 4.3's stopgap |

Now emit the ONE consolidated preflight report (Phase A + Phase B): every failed row with its severity and exact remedy, `missing` vs `broken` distinguished, `not-probed` rows listed as such. The header states this is a **diagnosis**, not a verdict. Then:
- Any `block` row failed → STOP. `add.qa` repairs nothing — the diagnosis is the deliverable.
- Only `degrade` rows failed → record each under "Not covered / caveats" for the STEP 5 report and continue.

---

## STEP 3: Read Specs (per SF in scope)

For each subfeature in scope, read:
- `about.md` — the **functional contract**: RF/RN, acceptance criteria, rules, flows. Source of truth for *what behavior to prove*.
- `DESIGN_FILE` (resolved at 2.1) — the **UX contract**: source of truth for *what it should look like*.
- `FEATURE_DIR/_tests/screens.json` — the route map (which screens to visit + the design ref). If absent → route to `/add.qa-setup`.

---

## STEP 4: Run Persisted Specs + Dispatch the Dual Judge (one pair per SF, parallel)

4.1 RESOLVE run-NNN FIRST — before any evidence is written.
    Run `bash .codeadd/scripts/qa-evidence.sh next "${SCOPE_DIR}"` and parse
    `RUN_ID` / `RUN_NUMBER`. It allocates from the union of working
    `_tests/run-NNN/` and immutable `_tests/final/run-NNN/` evidence, so a fresh
    clone with final evidence cannot reset the counter.
    This ONE number names every path below — screenshots/, computed-styles/,
    and the STEP 5 report. STEP 5 CONSUMES it; it does NOT recompute it.
    Resolving it late is how evidence lands under a directory the report
    never points at.
    The destination remains `SCOPE_DIR/_tests/run-NNN/`. NEVER write a new audit
    under `final/`; only `/add.done` promotes a reviewed working run.
    Then run `bash .codeadd/scripts/qa-evidence.sh previous "${SCOPE_DIR}"
    "${RUN_ID}"`; retain `PREVIOUS_REPORT` when present for the judge dispatch and
    contract-amendment comparison. It resolves the immediate numeric predecessor
    from working plus final evidence, never a deeper history walk.

4.2 Run the surface's <surface>.qa.spec via the qa-project Managed App Lifecycle
    (probe → boot-bg + wait-ready if down → run → teardown-iff-booted).
    Collect, all under the run-NNN resolved in 4.1:
      - the functional assertion pass/fail roll-up
      - axe-core results (per screen × state × viewport)
      - PNGs at _tests/run-NNN/screenshots/<screen>.<state>.<viewport>.png
        (one per screen × state × viewport)
      - the captured computed styles at
        _tests/run-NNN/computed-styles/<screen>.<viewport>.json
        — the deterministic conformance input. If the capture did not run, say
        so and mark those checks `unverifiable` (4.5); never substitute a
        visual guess for a measured value.
    If persisted specs are ABSENT → branch on WHY (see 4.3).

4.3 Specs absent:
    - qa-pipeline OFF → specs were never authored. Tell the user:
      `codeadd features enable qa-pipeline` + `/add.qa-setup` + `/add.test`.
      Do NOT bounce to /add.test (it won't author E2E with the feature off).
    - qa-pipeline ON, not yet generated → route to /add.test to author them;
      or (plugin ON) fall back to today's live-drive-from-catalog as a stopgap.

4.4 COVERAGE RECONCILIATION — coordinator-owned, BEFORE dispatch.
    Extract the expected screen set from DESIGN_FILE (the layout tree + the
    Screens section), then compare it against the evidence actually captured
    under run-NNN. Two binding rules:
      - a reachable, in-contract screen with no evidence is a `blocker` titled
        `coverage: <screen> not captured` — not a note;
      - DESIGN_FILE wins over _tests/screens.json when they disagree, and the
        drift is noted in the report.
    Emit a reconciliation table (screen · expected states/viewports · evidence
    present · verdict). It is SHARED INPUT — the SAME table goes to BOTH judges
    in 4.5.
    ⛔ Coverage blockers are the COORDINATOR's findings, never a judge's.
       Neither judge re-derives coverage; both consume the table as given.

4.5 DISPATCH THE JUDGE PAIR — @ux-agent (review mode) AND @qa-agent, one pair
    per SF, PARALLEL, WAIT-ALL. Split the work strictly by the **Axis ownership**
    table in `{{skill:add-qa/SKILL.md}}` — that table is canonical and no axis is
    judged twice. Do NOT restate or reinterpret it here.

    ⛔ `@ux-agent` gets NO a11y and NO deterministic conformance — do not hand
       it the axe results or the computed-style JSON. Overlap on those axes
       makes the STEP 5 dedupe impossible.

    Each dispatch passes:
      - the resolved paths — `SCOPE_DIR/about.md` and `DESIGN_FILE`;
      - the run-NNN evidence dirs that judge owns per the table
        (@ux-agent → screenshots/ ;
         @qa-agent → screenshots/ + computed-styles/ + axe results + the
         assertion roll-up + console/network artifacts);
      - the 4.4 reconciliation table (identical copy to both);
      - the relevant skill — `{{skill:add-qa/SKILL.md}}` carries the rubric,
        the severity scale and the finding schema both judges report in.

    Mode (both judges):
    - plugin OFF → read-PNG mode: Read the PNGs + DOM/console artifacts the run
      captured; judge from persisted evidence. No browser_* calls.
    - plugin ON → read-PNG PLUS live driving (open unscripted states, read
      console/network interactively, capture extra evidence).

    Soft-degrade, evaluated per dispatch INDEPENDENTLY: if @ux-agent or
    @qa-agent is not available in this engine, dispatch a generic subagent with
    that judge's directive + the add-qa skill. The judged arm still runs where
    agents don't build; the deterministic assertion + axe results from 4.2 are
    provider-independent.

    ⛔ EVERY check has an `unverifiable` outcome. A declared dimension whose
       verification method did not run — computed styles not captured, axe
       absent, a state never reached — is recorded `unverifiable` WITH THE
       REASON. Never passing. Never silently omitted.

    WAIT-ALL before STEP 5.

<!-- plugin:playwright:drive -->
<!-- /plugin:playwright:drive -->

⛔ qa-agent is READ-ONLY on the codebase — it judges and reports, never fixes. If an agent edited code, reject the run.
⛔ ux-agent (review mode) is READ-ONLY on the codebase under the exact same rule — it judges and reports, never fixes. **If EITHER agent edited code, reject the run.** Both judges write nothing outside their returned findings.

---

## STEP 5: Merge Judgements, Aggregate & Write Report

⛔ BEFORE merging, READ `{{skill:add-qa/references/coordinator.md}}` — it carries the canonical **Merge Rules** (dedupe key, domain precedence, severity, contradiction) and the **Fix Routing** rules. It is coordinator-only; neither judge received it.

**5.1 Merge.** Apply the coordinator reference's Merge Rules in the order it states. Coverage blockers from 4.4 enter the merged set as **coordinator** findings and bypass the merge rules (no judge produced a competing version).

⛔ Silently omitting a contradicted finding is HARD-BANNED — an unresolved disagreement is itself information the reader needs.

**5.5 Derive routes — coordinator work, NEVER the judges.** The judges emit `type` + root cause (and, for `ux`, the `contract-violated`/`contract-inadequate` classification with its contract-line citation); routing is derived here, once, over the merged and deduped set. For every finding, assign a `route` by the deterministic lookup on `type` + root cause in the coordinator reference's **Fix Routing** table (there is no confidence score). Then:

- **Citation gate:** a `ux`/`spec-gap` route to `@ux-agent` MISSING its required contract-line citation is **presented, never dispatched** (flag it in the row, do not assign an ordered slot).
- ⛔ Run the reference's **capability validation** before writing. An invalid route is a schema violation — do NOT write the report with it; fix the derivation.
- Write the **`## Fix Routing`** section per the reference's template and layer ordering.

Write `SCOPE_DIR/_tests/run-NNN/qa-validation-NNN.md` per the `qa-validation` schema (template carried by the `add-qa` skill), using the `run-NNN` and `PREVIOUS_REPORT` already resolved in STEP 4.1 — do NOT recompute either here. Set the report's `judged-contract` frontmatter to the `provenance` hash of the `DESIGN_FILE` it judged; if that hash differs from the previous report's `judged-contract`, note *"contract amended since run-NNN"* plus the amended dimensions — a criterion that flipped green ONLY because the contract was amended is not a fix. Copy each curated screenshot into `SCOPE_DIR/_tests/run-NNN/screenshots/`, preserving `<screen>.<state>.<viewport>.png` names so the report's relative links resolve.

---

## STEP 6: Console Summary

Report to the user: counts by severity (blocker / major / minor / polish); **per-judge counts** — findings from `@ux-agent`, from `@qa-agent`, coordinator coverage findings, how many were merged as duplicates and how many contradictions were reported; **per responsible agent** — distinct-finding counts per routed agent from the 5.5 `## Fix Routing` table (so the dispatch is visible without opening the report), plus any presented-not-dispatched routes (manual `data-seed`/`env-boot`, citation-missing); the functional-delivery roll-up (criteria met / not met / partial); the number of `unverifiable` checks with their reasons; and the report path. **Do not fix anything** — surface the next route per the ecosystem map: findings present → `/add.build qa` (it consumes `## Fix Routing`), then re-run `/add.qa` and loop until clean; clean → `/add.review`. Code review is the LAST gate, so it judges the tree the fix waves produced — never route a just-fixed feature straight to `/add.done`.

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
