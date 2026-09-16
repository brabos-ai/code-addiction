<!-- uses:
- agent: e2e-agent
- agent: qa-agent
- agent: ux-agent
- skill: add-qa
- skill: add-qa/references/coordinator.md
- skill: add-doc-schemas
- skill: add-doc-schemas/references/new-feature.md
- command: /add.qa-setup
- command: /add.plan
- command: /add.build
- command: /add.done
- script: qa-preflight.sh
- script: qa-evidence.sh
-->

<!--
FIVE sections. STEP 10 arrives as judge-head + judge-tail rather than one
block, and that split is now VESTIGIAL — read this before assuming it guards
something.

It was created because the `plugin:playwright:drive` pair sat inside STEP 10, at
the `**WAIT-ALL before 10.2.**` line, and a feature pair may not enclose it:
assertEmptyMarkerPairs refuses a pair with content between its comments, and a
nested pair would put the plugin's markers inside this feature's block. Splitting
STEP 10 around the plugin pair avoided both.

It did not work. The anchor line the plugin resolved against moved into THIS
file with the rest of STEP 10, so the plugin re-anchored to the `contract.` seam
that all four qa sections already shared — and applyInjectionToContent groups by
anchor within one namespace only, so the two namespaces inserted separately at
the same point and the live-driving block's position followed the enable order.
Above STEP 8 one way, below STEP 10 the other.

The fix was a seam line of its own in the base command, immediately before the
plugin pair, which now sits AFTER judge-tail. Placement is deterministic and
byte-identical in both enable orders, pinned by L2.2 and L2.10.

So nothing sits between judge-head and judge-tail any more. They are kept apart
only because merging them moves the injection total and the three suites that
pin it, for no behavioural gain. Merge them in a delivery that is already
touching those pins — not as a drive-by.
-->

<!-- section:step-list -->
STEP 8: QA Preflight            → deterministic probes (qa-preflight.sh a + b); self-gates on the add.qa-setup receipt
STEP 9: QA Evidence             → per SCOPE_DIR: run-NNN, run persisted specs, capture; SKIP when judged-tree is unchanged
STEP 10: QA Judgement           → @ux-agent ∥ @qa-agent per SF, merge, write qa-validation-NNN.md
<!-- /section:step-list -->

<!-- section:preflight -->

---

## STEP 8: QA Preflight (deterministic, cheap)

This section and the two below carry the QA validation that used to live in a
separate command. They arrive with the `qa-pipeline` feature, which decides
whether they exist at all, and they **self-gate on the `/add.qa-setup` receipt**,
which decides whether they can run.

**Two gates, two questions, and both must be satisfied.** The feature governs the
whole QA flow — authoring (`add.plan`'s QA spec, `@e2e-agent`), correction, and
the judgement below. Judgement is not the exception: its input is the evidence
`@e2e-agent` authors, so with the feature off there is nothing to judge. The
canonical split between the feature and the `playwright` plugin lives in
`{{skill:add-qa/SKILL.md}}` ("Feature vs plugin").

Load `{{skill:add-qa/SKILL.md}}` (rubric, severity, report schema, numbering,
read-PNG mode) before STEP 10. Load `{{skill:add-qa/references/coordinator.md}}`
before STEP 10's merge — coordinator-only; do NOT pass it to either judge.

### 8.1 Capability context

The `playwright` plugin is **optional**. Enabled + MCP connected → live-driving
is available. Otherwise → **degraded mode**: run persisted specs via the runner
and read persisted PNGs. Do NOT stop for a missing plugin. Enabling the plugin
does NOT enable the `qa-pipeline` feature — the split is canonical in
`{{skill:add-qa/SKILL.md}}` ("Feature vs plugin").

### 8.2 Phase A — project-level probes

```bash
bash .codeadd/scripts/qa-preflight.sh a
```

Parse the `KEY=STATUS` lines. `missing` and `broken` are distinct diagnoses
(absent vs present-but-non-functional); `not-probed` means a cheaper blocker
short-circuited the row — report it as not probed, never as passing.

⛔ **There is no "is `qa-pipeline` enabled" row, and there must not be one.** This
section only exists in the installed command when the feature is on, so a probe
for it here can only ever report enabled. `QA_FEATURE_STATE` in the script's
output is consumed by `{{cmd:add.qa-setup}}`, not by this step.

| # | Prerequisite | Probe | Severity |
|---|---|---|---|
| 1 | `docs/qa/config.json` present + parseable + has `baseUrl` | `QA_CONFIG` | block |
| 2 | `baseUrl` local/throwaway | `QA_BASEURL_LOCAL` | block — refuse production |
| 3 | `baseUrl` reachable | `QA_BASEURL_REACHABLE` | block — surface the config `bootHint` |
| 4 | `@playwright/test` functional in the project | `QA_RUNNER` | block |
| 5 | chromium launchable | `QA_CHROMIUM` | block |
| 6 | `qa-project` skill present | `QA_PROJECT_SKILL` | block — it carries the run commands |
| 7 | `playwright` MCP connected | provider MCP listing (not scripted) | **degrade** — read-PNG mode |
| 8 | Receipt `docs/qa/qa-setup.md` present with readable `setup-shape` | `QA_RECEIPT` | **block** — remedy: `{{cmd:add.qa-setup}}` |
| 9 | Receipt `setup-shape` equals shipped `contracts.json` shape | `QA_CONTRACT_MATCH` | **block** — remedy: `{{cmd:add.qa-setup}}` (full re-materialize) |

`{{cmd:add.qa-setup}}` interprets rows 8–9 as work-to-do, never a stop. This
command interprets them as `block` — the asymmetry is deliberate and unchanged.

Collect ALL rows. Do NOT stop here even on a `block` failure; the user gets
every problem and its remedy at once, after Phase B.

### 8.3 Reconcile QA scope

The absorbed QA loops over the **in-scope `SCOPE_DIR`s** already resolved by
**STEP 2.2 item 4d**, which runs whether or not this feature is enabled.

⛔ **DO NOT re-derive them here.** STEP 11.3 writes `${REVIEW_SCOPE}` into a
mandatory frontmatter field from the ungated body, so the scope cannot belong
to a step that ships conditionally. What this step adds is the reconciliation
with `qa-evidence.sh`'s per-scope shape, nothing more.

SET `DESIGN_FILE` per `SCOPE_DIR` using the `feature-design` **Location** rule in
`{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first,
feature-level fallback) — the same rule STEP 2.2 already applies.

### 8.4 Phase B — feature-scoped probes + consolidated diagnosis

```bash
bash .codeadd/scripts/qa-preflight.sh b "<FEATURE_DIR>" "<spec glob from the qa-project skill>"
```

Resolve the spec glob from the generated `qa-project` skill's conventions —
never guess it; if the skill is absent (row 6 already blocks), pass no glob and
the row reports `not-probed`.

| # | Prerequisite | Probe | Severity |
|---|---|---|---|
| 10 | `about.md` per SF in scope | file read | block — the functional axis has no contract |
| 11 | `DESIGN_FILE` (SF-level, else feature-level — see 8.3) | file read | **degrade** — the UX axis cannot run; the functional axis still can |
| 12 | `FEATURE_DIR/_tests/screens.json` | `QA_SCREENS` | block — remedy: `{{cmd:add.qa-setup}}` scaffolds the empty catalog; `/add.plan` fills it |
| 13 | `<surface>.qa.spec` persisted | `QA_SPECS` | **degrade** — falls back to 9.3's stopgap |

Emit ONE consolidated preflight report (Phase A + Phase B): every failed row
with its severity and exact remedy, `missing` vs `broken` distinguished,
`not-probed` rows listed as such. The header states this is a **diagnosis**, not
a verdict. Then:

⛔ IF any `block` row failed:
  ⛔ DO NOT proceed to STEP 9 or STEP 10
  ⛔ DO NOT dispatch the QA judges
  ✅ DO record the diagnosis in `review-NNN.md` and continue to STEP 11 — the
     code-review half of this command still produced findings worth reporting

- Only `degrade` rows failed → record each under "Not covered / caveats" for the
  STEP 10 report and continue.
<!-- /section:preflight -->

<!-- section:evidence -->

---

## STEP 9: QA Evidence (per SCOPE_DIR)

### 9.1 Skip predicate

Evidence capture is the expensive half. Re-run it only when the tree actually
changed since the evidence was captured.

For each `SCOPE_DIR`, read the previous report's `judged-tree` frontmatter field
(`qa-evidence.sh previous`). Compare it against `REVIEW_TREE_BEFORE` from STEP 2.2.

| Condition | Action |
|-----------|--------|
| No previous report | Capture (9.2) |
| `judged-tree` absent from the previous report | Capture — a pre-`judged-tree` report cannot answer the question |
| `judged-tree != REVIEW_TREE_BEFORE` | Capture |
| `judged-tree == REVIEW_TREE_BEFORE` | **SKIP capture.** Reuse the previous run's evidence and say so in the report |

### 9.2 Capture

**Resolve `run-NNN` FIRST — before any evidence is written.**

```bash
bash .codeadd/scripts/qa-evidence.sh next "${SCOPE_DIR}"
```

Parse `RUN_ID` / `RUN_NUMBER`. It allocates from the union of working
`_tests/run-NNN/` and immutable `_tests/final/run-NNN/` evidence, so a fresh
clone with final evidence cannot reset the counter. This ONE number names every
path below and the STEP 10 report; STEP 10 **consumes** it and never recomputes
it. The destination is `SCOPE_DIR/_tests/run-NNN/`.

⛔ NEVER write a new audit under `_tests/final/`, and NEVER invoke
`qa-evidence.sh promote`. Only `/add.done` promotes a reviewed working run.

Then `bash .codeadd/scripts/qa-evidence.sh previous "${SCOPE_DIR}" "${RUN_ID}"`;
retain `PREVIOUS_REPORT` for the judge dispatch and contract-amendment comparison.
It resolves the immediate numeric predecessor from working plus final evidence,
never a deeper history walk.

Run the surface's `<surface>.qa.spec` via the `qa-project` Managed App Lifecycle
(probe → boot-bg + wait-ready if down → run → teardown-iff-booted). Collect, all
under the resolved `run-NNN`:

- the functional assertion pass/fail roll-up
- axe-core results (per screen × state × viewport)
- PNGs at `_tests/run-NNN/screenshots/<screen>.<state>.<viewport>.png`
- captured computed styles at `_tests/run-NNN/computed-styles/<screen>.<viewport>.json` — the deterministic conformance input. If the capture did not run, say so and mark those checks `unverifiable` in 10.1; never substitute a visual guess for a measured value.

### 9.3 Specs absent

The specs are authored by `@e2e-agent` under this same feature, so reaching this
step means the feature is on and the specs were simply not generated yet.

- Route to `/add.build` to author them; or
- (plugin ON) fall back to live-drive-from-catalog as a stopgap.

⛔ **There is no feature-off branch here, and there must not be one.** With the
feature off this whole section is absent from the installed command, so a branch
telling the user to enable the feature could never be read by anyone who needed
it. That remedy belongs where a reader can reach it: `{{cmd:add.qa-setup}}`, the
STEP 11 gate row, and the canonical statement in `{{skill:add-qa/SKILL.md}}`.

### 9.4 Coverage reconciliation — coordinator-owned, BEFORE dispatch

Extract the expected screen set from `DESIGN_FILE` (the layout tree + the Screens
section), then compare it against the evidence actually captured under `run-NNN`.
Two binding rules:

- a reachable, in-contract screen with no evidence is a `blocker` titled `coverage: <screen> not captured` — not a note;
- `DESIGN_FILE` wins over `_tests/screens.json` when they disagree, and the drift is noted in the report.

Emit a reconciliation table (screen · expected states/viewports · evidence
present · verdict). It is SHARED INPUT — the SAME table goes to BOTH judges.

⛔ Coverage blockers are the COORDINATOR's findings, never a judge's. Neither
judge re-derives coverage; both consume the table as given.
<!-- /section:evidence -->

<!-- section:judge-head -->

---

## STEP 10: QA Judgement (per SCOPE_DIR)

### 10.1 Dispatch the judge pair

**DISPATCH AGENTS: `@ux-agent` (review mode) ∥ `@qa-agent`** — one pair per SF, PARALLEL, WAIT-ALL.

Split the work strictly by the **Axis ownership** table in
`{{skill:add-qa/SKILL.md}}` — that table is canonical and no axis is judged
twice. Do NOT restate or reinterpret it here.

⛔ `@ux-agent` gets NO a11y and NO deterministic conformance — do not hand it the
axe results or the computed-style JSON. Overlap on those axes makes the 10.2
dedupe impossible.

Each dispatch passes:

- the resolved paths — `SCOPE_DIR/about.md` and `DESIGN_FILE`;
- the `run-NNN` evidence dirs that judge owns per the table (`@ux-agent` → `screenshots/`; `@qa-agent` → `screenshots/` + `computed-styles/` + axe results + the assertion roll-up + console/network artifacts);
- the 9.4 reconciliation table (identical copy to both);
- **`RELATED_WORK` from STEP 2.2** — the deliveries that last changed these files, ids with one line each. **Never blank** — `none` when the graph answered and had no match, `NOT VERIFIED` plus the reason when it could not be reached. A judge that does not know a file was rewritten two deliveries ago judges it as though it were new;
- `{{skill:add-qa/SKILL.md}}` — rubric, severity scale, finding schema.

Mode (both judges):

- plugin OFF → read-PNG mode: read the PNGs + DOM/console artifacts the run captured; judge from persisted evidence. No `browser_*` calls.
- plugin ON → read-PNG PLUS live driving (open unscripted states, read console/network interactively, capture extra evidence).

Soft-degrade, evaluated per dispatch INDEPENDENTLY: if `@ux-agent` or `@qa-agent`
is not available in this engine, dispatch a generic subagent with that judge's
directive + the `add-qa` skill. The judged arm still runs where agents don't
build; the deterministic assertion + axe results from 9.2 are provider-independent.

⛔ EVERY check has an `unverifiable` outcome. A declared dimension whose
verification method did not run — computed styles not captured, axe absent, a
state never reached — is recorded `unverifiable` WITH THE REASON. Never passing.
Never silently omitted.

**WAIT-ALL before 10.2.**
<!-- /section:judge-head -->

<!-- section:judge-tail -->

⛔ Both judges are READ-ONLY on the codebase — they judge and report, never fix.
`@qa-agent` carries `disallowedTools` enforcing it. **If EITHER agent edited
code, reject the run** (STEP 7.5 catches it).

### 10.2 Merge and write the per-scope report

⛔ BEFORE merging, READ `{{skill:add-qa/references/coordinator.md}}` — it carries
the canonical **Merge Rules** (dedupe key, domain precedence, severity,
contradiction) and the **Fix Routing** rules. Coordinator-only; neither judge
received it.

Apply the Merge Rules in the order the reference states. Coverage blockers from
9.4 enter the merged set as **coordinator** findings and bypass the merge rules
(no judge produced a competing version).

⛔ Silently omitting a contradicted finding is HARD-BANNED — an unresolved
disagreement is itself information the reader needs. Report it once at the LOWER
severity with both positions verbatim.

**Derive routes — coordinator work, NEVER the judges.** For every finding assign
a `route` by the deterministic lookup on `type` + root cause in the coordinator
reference's **Fix Routing** table (there is no confidence score). Then:

- **Citation gate:** a `ux`/`spec-gap` route to `@ux-agent` MISSING its required contract-line citation is **presented, never dispatched** — flag it in the row, do not assign an ordered slot.
- ⛔ Run the reference's **capability validation** before writing. An invalid route is a schema violation — do NOT write the report with it; fix the derivation.

Write `SCOPE_DIR/_tests/run-NNN/qa-validation-NNN.md` per the `qa-validation`
schema, using the `run-NNN` and `PREVIOUS_REPORT` resolved in 9.2. Set:

- `judged-contract` — the `provenance` hash of the `DESIGN_FILE` it judged. If it differs from the previous report's, note *"contract amended since run-NNN"* plus the amended dimensions. A criterion that flipped green ONLY because the contract was amended is not a fix.
- `judged-tree` — `REVIEW_TREE_BEFORE`, the fingerprint of the tree that produced this evidence. 9.1 reads it on the next invocation; without it the skip predicate cannot work.

Copy each curated screenshot into `SCOPE_DIR/_tests/run-NNN/screenshots/`,
preserving `<screen>.<state>.<viewport>.png` names so the report's relative links
resolve.

Then execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for
schema `qa-validation`.

**The per-scope report is not replaced by `review-NNN.md`.** `qa-evidence.sh
validate`, `working-baseline` and `previous`, and `/add.done`, all depend on
this exact contract. Both documents are written every run.
<!-- /section:judge-tail -->
