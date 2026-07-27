# Plan: Fix Routing in the QA Report

> **Status:** implemented
> **Type:** schema + skill + command fragment
> **Created:** 2026-07-27
> **Author:** Maicon + Claude (ADD Strategy)
> **Source brainstorm:** `docs/brainstorming/2026-07-26-05-qa-fix-routing.md` (final, post coherence pass) · Umbrella topic 05 (last)
> **Depends on:** plan 0059. **Blocks:** nothing — closes the umbrella.

## Context

The QA report is the handoff artefact between judging and fixing, and today the handoff loses almost everything: `/add.build qa` receives severity and axis, then re-diagnoses each finding from scratch. 0059 supplies the missing input — every functional finding now carries a root cause from a fixed taxonomy, and finding types are `ux | functional | a11y | spec-gap`. Routing is the thin layer that turns a classification into a dispatch: a `route` field per finding, a `## Fix Routing` section with an ordered dispatch plan, and consumption rules in the QA-Fix fragment.

**Corrected from the source brainstorm (coherence pass):** there is **no `confidence` field** — routing is a deterministic lookup on `type` + root cause. The "present, don't dispatch" valve fires on three structural conditions instead: manual routes (`data-seed`, `env-boot`), routes failing capability validation, and `ux`/`spec-gap` routes to `@ux-agent` missing their required contract-line citation.

## Global Constraints (bind every task)

- Source of truth `framwork/.codeadd/` only; `node scripts/build.js` clean after every task; `cd cli && npx vitest run tests/qa-reachability.smoke.test.js` green after every task.
- **Injection anchors:** `fragments/qa-pipeline/add.build.md` content may change freely BETWEEN its `<!-- section:qa-fix -->` markers, but `framwork/.codeadd/commands/add.build.md`'s marker pair (~:195) and its adjacent anchor lines must NOT be disturbed — the Named Agent Mapping edit lives elsewhere in that file (~:293-300). `add.qa.md` carries the `plugin:playwright:drive` pair. Rebuild verifies; `tests/qa-reachability.smoke.test.js` scenario 1 round-trips the qa-pipeline injection.
- The `/add.build qa` confirmation gate stays MANDATORY and untouched — routing decides *who*, never *whether*. QA never fixes; `add.qa` stays read-only.
- Judges emit `type` + root cause; the **coordinator** derives `route` at STEP 5 after the merge (never the judges — routing needs the merged, deduped set and global ordering).
- ~~Legacy reports without `## Fix Routing` must still work (fallback to severity/axis grouping).~~ **Superseded 2026-07-27 (amendment A1, commit `a7eeb52`):** a report without `## Fix Routing` makes `/add.build qa` **STOP with the remedy** (re-run `/add.qa`, which writes a fresh run-NNN carrying routes). Rationale: the QA pipeline is an opt-in, disabled-by-default feature with no released consumer holding pre-0060 reports, and a silent severity/axis fallback would dispatch un-routed findings to the wrong agents — the exact failure routing exists to prevent. See the Amendments section.
- Vitest baseline: 27 environmental failures. English only. Conventional commit per task + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Task 1: qa-validation schema + add-qa routing rules

**Files:** `framwork/.codeadd/skills/add-doc-schemas/references/review.md`, `framwork/.codeadd/skills/add-qa/SKILL.md`.

1. **Schema** (`references/review.md`): every finding gains a REQUIRED `route` field — form `**Route:** @agent-a → @agent-b · target: <target class>` (ordered chain allowed). Add the `## Fix Routing` section to the Sections list. New hard bans: a finding without a route; a route whose agent cannot write the target class. Frontmatter gains `judged-contract: sha256:<design.md provenance hash>` — the contract hash the run judged against.
2. **`add-qa/SKILL.md`** gains:
   - **Routing rules table** (lookup on `type` + root cause), verbatim: functional/`missing-implementation` (backend|data) → `@backend-agent` (+ `@database-agent` if schema) · api, schema; functional/`missing-implementation` (UI) → `@frontend-agent` · component; functional/`contract-mismatch` → `@backend-agent` → `@frontend-agent` · api-contract; functional/`selector-drift` → `@e2e-agent` · test-file; functional/`spec-defect` → `@e2e-agent` · test-file; functional/`data-seed` → **user (manual)** · env-config; functional/`env-boot` → **user (manual)** · env-config; functional/`regression` → route by the underlying cause, flagged `regression` · varies; ux/`contract-violated` → `@frontend-agent` · component; ux/`contract-inadequate` → `@ux-agent` · design-spec; a11y (markup/semantics/heading order) → `@frontend-agent` · component; a11y (contrast/token) → `@frontend-agent` (usage) or `@ux-agent` (contract) · component, design-spec; `spec-gap` → `@ux-agent` · design-spec; coverage blocker → `@e2e-agent` · test-file.
   - **The `ux` two-value classification** (the one place routing is judgement, not lookup): `contract-violated` = the rendered value contradicts a declared dimension → `@frontend-agent`; `contract-inadequate` = the contract declares nothing covering the observed problem → `@ux-agent`. A `ux` finding routed to `@ux-agent` MUST cite the missing or wrong contract line; without the citation the route is presented, never dispatched.
   - **Capability validation** (hard rule): `@e2e-agent` may only be routed to `test-file`; `@ux-agent` only to `design-spec`; `@qa-agent` never (read-only); implementation agents may not be routed to `design-spec`. An invalid route is a schema violation, not a warning.
   - **Dependency ordering** fixed by layer: `@database-agent` → `@backend-agent` → `@frontend-agent` → `@e2e-agent`; `@ux-agent` and user routes are unordered (no code dependency).
   - **`## Fix Routing` template**: table `Order | Agent | Findings | Target class | Blocked by`, with unordered rows (`—`) for `@ux-agent`/user; note that a finding may appear under more than one agent when its route is a chain, each slice stating what it owns; counts are involvement, not ownership (count distinct findings in summaries).
   - **Contract-amendment trail** (required, else the audit self-heals): a fix wave that amends `design.md` (routes to `design-spec`) appends to `## Design Review` with the originating `run-NNN` + finding ID; and because `qa-validation` frontmatter records `judged-contract`, when the next run's hash differs the report states *"contract amended since run-NNN"* and lists the amended dimensions — a criterion that flipped to green under an amended contract is NEVER reported as a fix.

## Task 2: add.qa derives routes (STEP 5/6) + judges emit type + root cause only

**Files:** `framwork/.codeadd/commands/add.qa.md`, `framwork/.codeadd/agents/ux-agent.md`, `framwork/.codeadd/agents/qa-agent.md`.

1. **`add.qa` STEP 5** (after the 0059 merge/dedupe): the coordinator derives `route` per finding from the routing rules (lookup on `type` + root cause; the `ux` two-value classification comes from the judge's finding, whose citation the coordinator validates), runs capability validation (invalid route = fail loud, do not write the report with it), and writes the `## Fix Routing` section with the ordered dispatch plan. Write `judged-contract` into the report frontmatter (the `provenance` hash from the `design.md` it judged).
2. **`add.qa` STEP 6** console summary gains counts per responsible agent (distinct findings), so the route is visible without opening the report.
3. **Agents:** state explicitly in both `ux-agent.md` (review mode) and `qa-agent.md` that they emit `type` + root cause (+ the `ux` two-value classification with its citation) and **do NOT emit `route`** — routing is coordinator work. ⛔ Keep each agent's `plugin:` marker pair + adjacent anchor prose byte-identical.

## Task 3: /add.build qa consumption + Named Agent Mapping

**Files:** `framwork/.codeadd/fragments/qa-pipeline/add.build.md`, `framwork/.codeadd/commands/add.build.md`.

1. **Fragment** (between its section markers): read `## Fix Routing` and group by agent for DISPATCH; retain severity grouping for PRESENTATION (the user still sees blocker→polish). After the existing mandatory confirmation, dispatch each agent in the table's order respecting `Blocked by`; sequential across layers, parallel within one agent's slice when its findings are independent. Surface as user decisions and do NOT dispatch: manual routes (`data-seed`/`env-boot`, naming the `config.json` field to fix — `authSeed`/`bootHint`), capability-invalid routes, and `@ux-agent` routes missing their contract-line citation. **Absent `## Fix Routing` (amended A1 — was "legacy fallback"):** STOP with the remedy (re-run `/add.qa <feature-id> [SFxx]`, then `/add.build qa`); never guess a dispatch and never fall back to severity grouping. **Amendment trail:** a dispatched `@ux-agent` design-spec fix MUST append its amendment to `design.md` `## Design Review` with the originating `run-NNN` + finding ID. Everything else unchanged: explicit `/add.build qa` trigger only, outside the §4.2 mode ladder, CORRECTION MODE (C2) discipline, `add-ux-design` loaded for frontend work, 100% compile, non-blocking, re-run suggestion.
2. **`add.build.md` Named Agent Mapping** (~:293-300, far from the qa-fix marker): add rows for `@e2e-agent` (test files only, no MCP) and `@ux-agent` (design spec only, never application code), each with the soft-degrade fallback the table already uses for the other agents.
3. **Verify** `cli/src/plugins.json`: `playwright.agents[]` lists only `qa-agent`. Since 0059 put `@ux-agent` on the judging path, decide and record: if `@ux-agent` never needs live driving (it judges from persisted PNGs + contract), leave the catalog as-is and state that in the report; only add a row if a drive fragment genuinely exists for it. Do not add a catalog row without a matching `plugins/playwright/fragments/agents/ux-agent.md` file — a row alone injects nothing (and a marker alone likewise).

## Task 4: ecosystem + sweep + tests + evidence + umbrella closure

1. **`add-ecosystem/SKILL.md`**: `add.qa → add.build` routing row mentions the routed handoff; Agents table "Dispatched by" for `@e2e-agent` (gains `add.build qa`) and `@ux-agent` (gains `add.build qa` design-spec fixes); Dependency Index rows.
2. **Sweep:** no remaining "grouped by severity and axis" wording implying dispatch-by-severity; no `confidence` field references anywhere (the corrected decision); `fix hint` retained as a field but no longer the dispatch signal — confirm the schema still requires it.
3. **Tests (scenario 8)** in `cli/tests/qa-reachability.smoke.test.js`: built `review.md` reference contains `## Fix Routing` + `judged-contract`; built `add-qa` skill contains the routing rules table + capability validation; built `add.qa.md` STEP 5 derives routes and STEP 6 reports per-agent counts; built fragment content contains the legacy fallback sentence and the dispatch-by-agent rule; built `add.build.md` Named Agent Mapping contains `@e2e-agent` and `@ux-agent`. Full vitest = 27-row baseline; bats 63/63.
4. **Evidence** `docs/plans/0060-PLAN--qa-fix-routing--evidence-v01.md`; **changelog** `docs/changelog/2026-07-27-update-qa-fix-routing.md` (framework version bump obligation — schema change); plan status → implemented.
5. **Umbrella closure note:** append to `docs/brainstorming/2026-07-26-00-qa-ux-umbrella.md` a status line recording that topics 01-05 are implemented as plans 0056-0060, and list the umbrella's still-open deferred follow-ups (non-web-surface QA, run-evidence lifecycle, screens.json maintenance workflow, hand-edit design.md drift) so they are not mistaken for delivered.

## Validated Decisions (carried, with the coherence correction)

`route` required on every finding; routing is a lookup, not fresh judgement; multiple ordered agents allowed; capability validation is a hard ban; manual routes go to the user; `spec-gap` → design-spec only; coverage blockers → `@e2e-agent`; layer ordering database→backend→frontend→e2e; **no `confidence` field** — gating on manual/capability-invalid/citation-missing instead; confirmation gate untouched; severity for presentation, agent for dispatch; per-agent counts in the console summary; contract amendments leave a trail and never read as fixes.

## Amendments

### A1 — no legacy fallback for un-routed reports (2026-07-27, commit `a7eeb52`)

**Changed:** the Global Constraint "legacy reports must still work (fallback to severity/axis grouping)" and Task 3's matching fragment sentence are withdrawn. `/add.build qa` now STOPs when the report carries no `## Fix Routing`, telling the user to re-run `/add.qa`.

**Why:** `qa-pipeline` ships **disabled by default** and no released version ever wrote a routed report, so no user holds a report the fallback would have served. Against that empty benefit, a severity/axis fallback silently dispatches findings whose owner was never derived — precisely the mis-dispatch that capability validation and the citation gate exist to block. A hard STOP with an exact remedy costs one `/add.qa` re-run and cannot mis-dispatch.

**Migration impact:** any `qa-validation-NNN.md` written before this branch must be regenerated by re-running `/add.qa <feature-id> [SFxx]`; the stale run is never consumed. `/add.build qa` states this remedy verbatim. The `_qa-report/` migration note that plan 0057 T4.3 cited was removed in the same commit and is superseded by this amendment.

**Artefacts reconciled with A1:** `fragments/qa-pipeline/add.build.md`, `skills/add-doc-schemas/references/review.md` (route REQUIRED), `cli/tests/qa-reachability.smoke.test.js` scenario 8, `docs/plans/0060-PLAN--qa-fix-routing--evidence-v01.md`, `docs/changelog/2026-07-27-update-qa-fix-routing.md`.

## Risks

| Risk | Mitigation |
|---|---|
| Roster drift stales the routing rules | Rules live in the `add-qa` skill, not the command; `add-framework--sync` surfaces drift |
| Wrong route dispatches an agent that cannot fix it | Capability validation as a hard ban + the confirmation gate + citation-missing never dispatched |
| Legacy report lacks `## Fix Routing` | **A1:** hard STOP with the re-run remedy — no silent severity/axis fallback (a fallback would dispatch un-routed findings to the wrong agents) |
| Chains produce partial fixes when a link is skipped | Each slice states what it owns; skipped links reported unresolved; next `/add.qa` catches |
| Amendment trail ignored → self-healing audit | `judged-contract` hash + mandatory `## Design Review` append; flipped-green-under-amended-contract never reported as a fix |

## Next Steps

Executed via subagent-driven development in-session; closes the QA/UX umbrella.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-07-27 | Created from brainstorm 05 (post coherence pass: no confidence field), task-structured for SDD |
| 2026-07-27 | Tasks 1–4 implemented (commits `e21e2d9`, `5975816`, `fcad3ee`); status → implemented |
| 2026-07-27 | **Amendment A1** — legacy severity/axis fallback withdrawn in favour of a hard STOP + re-run remedy (commit `a7eeb52`); recorded after umbrella review v01 flagged the plan-vs-code contradiction |
