# Brainstorm 05: Fix Routing in the QA Report

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-07-26
> **Type:** schema + skill + command fragment
> **Layer:** product (`framwork/.codeadd/`)
> **Umbrella:** `2026-07-26-00-qa-ux-umbrella.md` · **Depends on:** `04`

## Discovery

- **`qa-validation` schema** — finding depth floor: severity, `type`, screen, viewport, related criterion or design ref, concrete evidence, observed, expected, **fix hint** (free text). No responsible-agent field. Hard bans include any "fix applied" claim, since QA documents and never fixes.
- **`fragments/qa-pipeline/add.build.md`** — the QA-Fix flow: activates **only** on explicit `/add.build qa` (or `--qa` / a report path); sits outside the §4.2 mode ladder so a stale run never triggers it implicitly; detects the highest `run-NNN`, reads `qa-validation-NNN.md`, presents unresolved findings **grouped by severity and axis**, and **CONFIRMS before changing any code**. Applies fixes reusing CORRECTION MODE (C2) discipline; frontend work loads `add-ux-design`; the build must compile 100%. Suggests re-running `/add.qa` for side-by-side comparison. Non-blocking, no forced iteration.
- **`add.qa` STEP 6** — reports counts by severity plus the functional roll-up, and surfaces the next route (`/add.build` or `/add.review`). Never emits a pass/fail verdict.
- **Agent roster and write capability** — `@database-agent`, `@backend-agent`, `@frontend-agent` (implementation, full access); `@e2e-agent` (**read-write on test files only, no MCP**); `@ux-agent` (spec/critique/review, read-only on the codebase in review mode); `@qa-agent` (read-only). `@reviewer-agent` for code review.
- **From `04`** — every functional finding carries a root cause from a fixed taxonomy (`missing-implementation`, `contract-mismatch`, `selector-drift`, `spec-defect`, `data-seed`, `env-boot`, `regression`), and finding types are `ux | functional | a11y | spec-gap`.

## Context & Motivation

The QA report is the handoff artefact between judging and fixing, and today the handoff loses almost everything. `/add.build qa` receives severity and axis, then re-diagnoses each finding from scratch to decide who should touch what. The `fix hint` field is free text, so it cannot be dispatched on.

The owner stated the requirement directly: the generated document must carry **notes on which agents to use to perform the fixes**, so `/add.build` applies the adjustments.

`04` supplies the missing input. Once a functional finding is classified `contract-mismatch` rather than "test failed", the responsible agent is derivable rather than guessable. Routing is the thin layer that turns a classification into a dispatch.

## Problem / Opportunity

| Problem | Effect |
|---|---|
| `fix hint` is free text | Not machine-actionable; `/add.build qa` cannot dispatch on it |
| Findings are grouped by severity and axis only | Grouping does not answer "who fixes this" |
| No dependency ordering across findings | A frontend fix may be applied before the backend contract it depends on |
| Nothing validates that a routed agent *can* write the target | `@e2e-agent` is test-files-only; `@ux-agent` never touches application code |
| A `spec-gap` finding has no fix target at all | It is not a code defect — it means the contract was incomplete |

## Proposed Solution

Add a routing field to each finding, a routing section to the report, and consumption rules to the `add.build` QA-Fix fragment. Routing is derived from `type` plus the `04` root cause — it is a lookup, not a new judgement.

### The routing field

Each finding gains `route`: the responsible agent(s) and the fix target class. Multiple agents are allowed and are ordered — `contract-mismatch` genuinely needs backend before frontend.

```
- **Route:** @backend-agent → @frontend-agent · target: api-contract
```

**The coordinator derives `route`, not the judges.** The earlier draft said both — Alternatives rejected per-judge routing because it needs the merged, deduped set and global ordering, while Scope and Ecosystem Impact had the judges emitting it. Coordinator-only, in STEP 5, after the merge.

**No `confidence` field.** If routing is a deterministic lookup on `type` + root cause, there is no confidence axis; it would be `high` everywhere and the "present, don't dispatch" valve would never fire. The genuine ambiguity is elsewhere and is handled below.

**The one place routing is a judgement, not a lookup:** the `ux` split between *implementation deviates from the contract* (`@frontend-agent`) and *the contract itself is wrong* (`@ux-agent`). `04`'s root-cause taxonomy covers functional findings only, so this distinction has no signature — and the cheap answer is always "implementation deviates", billing spec defects to the frontend agent. It needs its own two-value classification with an evidence requirement, mirroring the functional taxonomy: `contract-violated` (the rendered value contradicts a declared dimension) versus `contract-inadequate` (the contract declares nothing that covers the observed problem). A `ux` finding whose route is `@ux-agent` must cite the missing or wrong contract line.

### Routing rules

| `type` | Root cause | Route | Target class |
|---|---|---|---|
| functional | `missing-implementation` (backend/data) | `@backend-agent` (+ `@database-agent` if schema) | api, schema |
| functional | `missing-implementation` (UI) | `@frontend-agent` | component |
| functional | `contract-mismatch` | `@backend-agent` → `@frontend-agent` | api-contract |
| functional | `selector-drift` | `@e2e-agent` | test-file |
| functional | `spec-defect` | `@e2e-agent` | test-file |
| functional | `data-seed` | **user** (manual) | env-config |
| functional | `env-boot` | **user** (manual) | env-config |
| functional | `regression` | route by the underlying cause, flagged `regression` | varies |
| ux | implementation deviates from the contract | `@frontend-agent` | component |
| ux | the contract itself is wrong | `@ux-agent` | design-spec |
| a11y | markup/semantics/heading order | `@frontend-agent` | component |
| a11y | contrast/token violation | `@frontend-agent` (usage) or `@ux-agent` (contract) | component, design-spec |
| spec-gap | — | `@ux-agent` | design-spec |
| coverage blocker | screen declared, no evidence | `@e2e-agent` | test-file |

**Capability validation.** A route is invalid if the agent cannot write the target class: `@e2e-agent` may only be routed to `test-file`, `@ux-agent` only to `design-spec`, `@qa-agent` never (read-only). An invalid route is a schema violation, not a warning.

**Manual routes are first-class.** `data-seed` and `env-boot` are not code defects; routing them to an implementation agent would produce speculative code changes. They go to the user with the `config.json` field to fix (`authSeed`, `bootHint`).

**`spec-gap` routes to `@ux-agent` and to the design spec, never to application code.** The fix is completing the contract, after which the next `/add.qa` run can judge what it could not judge before.

**Contract amendments must be recorded, or the audit trail self-heals.** Routing `spec-gap` and `contract-inadequate` to `@ux-agent`/`design-spec` means `/add.build qa` edits `design.md` and the next `/add.qa` measures against the amended contract — red becomes green with no code change and nothing says why. Two guards, both required:

- Every fix-wave amendment appends to `design.md` `## Design Review` with the originating `run-NNN` and finding ID. Amending during a fix wave is the one path that bypasses the `add.plan` critique pass, so it must leave a trace.
- `qa-validation-NNN.md` frontmatter records the `design.md` provenance hash it judged against. When the next run's hash differs, the report states *"contract amended since run-NNN"* and lists the amended dimensions. A criterion that flipped to green under an amended contract is never reported as a fix.

This makes concrete a semantics the umbrella currently defers (*"`design.md` drift — no guidance on what happens when it is edited mid-feature"*). That deferral cannot stand while three topics depend on the contract's stability; `03` derives `screens.json`'s `expect` from it and `04` judges everything against it.

### The `## Fix Routing` report section

A new section grouping findings by responsible agent, with an ordered dispatch plan. Dependency order is fixed by layer — `@database-agent` → `@backend-agent` → `@frontend-agent` → `@e2e-agent` — because a test asserting a contract should be corrected after the contract, and a component consuming an API after the API.

| Order | Agent | Findings | Target class | Blocked by |
|---|---|---|---|---|
| 1 | `@database-agent` | F03 | schema | — |
| 2 | `@backend-agent` | F03, F07 | api-contract | 1 |
| 3 | `@frontend-agent` | F01, F02, F07 | component | 2 |
| 4 | `@e2e-agent` | F05 | test-file | 3 |
| — | `@ux-agent` | F09 (`spec-gap`) | design-spec | — |
| — | **user** | F08 (`data-seed`) | env-config | — |

A finding may appear under more than one agent when its route is a chain; each agent's slice states which part it owns.

`add.qa` STEP 6 gains one line to its console summary: counts per responsible agent, so the route is visible without opening the report.

### `/add.build qa` consumption

The existing fragment keeps its shape and its guarantees. Three changes:

1. Read `## Fix Routing` and group by agent rather than re-deriving from severity and axis. Severity grouping is retained for **presentation** — the user still sees blocker→polish — but dispatch is by agent.
2. After the existing mandatory confirmation, dispatch each agent in the table's order, respecting `Blocked by`. Sequential across layers; parallel within one agent's slice is permitted when its findings are independent.
3. Surface as user decisions — and do **not** dispatch — (a) manual routes (`data-seed`, `env-boot`), (b) any route that fails capability validation, and (c) any `ux` finding routed to `@ux-agent` whose required contract-line citation is missing.

Everything else is unchanged: explicit `/add.build qa` trigger only, outside the §4.2 mode ladder, CORRECTION MODE (C2) discipline, `add-ux-design` loaded for frontend work, 100% compile, non-blocking, and the suggestion to re-run `/add.qa` for the next `run-NNN`. The confirmation gate stays mandatory — routing decides *who*, never *whether*.

### Alternatives considered

| Option | Verdict |
|---|---|
| Keep free-text `fix hint` and let `/add.build qa` infer the agent | **Rejected.** That is exactly today's behaviour, and it re-diagnoses every finding |
| A separate routing document beside the report | **Rejected.** Splits the finding from its route; two artefacts drift, and the report is already the handoff |
| Let each judge write its own routing section | **Rejected.** Routing needs the merged, deduped finding set and global dependency ordering — coordinator work by definition |
| One agent per finding, no chains | **Rejected.** `contract-mismatch` genuinely spans backend and frontend; forcing one owner produces a half-fix |
| Auto-dispatch without confirmation when all findings are minor/polish | **Rejected.** The confirmation gate is an existing guarantee of the QA-Fix flow; routing must not weaken it |
| Route `data-seed` / `env-boot` to `@backend-agent` | **Rejected.** Environmental failures are not code defects; this would generate speculative changes |

## Type of Artefact

Schema and skill changes plus a fragment modification. No new agents, no new commands.

## Scope

### Includes

- `qa-validation` schema: `route` required on every finding; `## Fix Routing` section added; hard ban on a finding without a route and on a route whose agent cannot write the target class
- `add-qa` skill: routing rules table, capability-validation rule, dependency ordering, `## Fix Routing` template
- `add.qa` STEP 5: coordinator derives routes and writes the section; STEP 6 summary gains per-agent counts
- `fragments/qa-pipeline/add.build.md`: read `## Fix Routing`, dispatch by agent in dependency order, surface manual and citation-missing routes
- `@ux-agent` / `@qa-agent`: emit the route per finding (a lookup from `type` + root cause)

### Does NOT Include

- Weakening or removing the `/add.build qa` confirmation gate
- Auto-dispatch of manual or citation-missing routes
- Verifying that a dispatched fix worked — that is the next `/add.qa` run
- Changing severity taxonomy or the root-cause taxonomy from `04`
- Routing for non-QA commands (`add.review`, `add.audit`)
- Cross-run fix tracking or a "resolved in run-NNN" ledger

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| `route` is a required field on every finding | Optional metadata would be omitted, and `/add.build qa` would fall back to guessing | ✅ |
| Routing derives from `type` + root cause, not fresh judgement | `04` already classified the failure; routing is a lookup and stays deterministic | ✅ |
| Multiple ordered agents per finding allowed | `contract-mismatch` spans layers; one owner produces a half-fix | ✅ |
| Capability validation: agent must be able to write the target class | `@e2e-agent` is test-files-only and `@ux-agent` never touches application code; an invalid route is a schema violation | ✅ |
| `data-seed` and `env-boot` route to the user, not an agent | Environmental failures are not code defects; agent dispatch would produce speculative changes | ✅ |
| `spec-gap` routes to `@ux-agent`/`design-spec` only | The fix is completing the contract, not changing code | ✅ |
| Coverage blockers route to `@e2e-agent` | A declared screen with no evidence is a capture gap in the spec | ✅ |
| Dependency order fixed by layer: database → backend → frontend → e2e | A test asserting a contract is corrected after the contract; a component after its API | ✅ |
| Routes lacking their required evidence citation are presented, not dispatched | Better a user decision than a confident wrong dispatch; replaces a `confidence` field that would be `high` everywhere | ✅ |
| The `/add.build qa` confirmation gate is untouched | Routing decides who, never whether | ✅ |
| Severity grouping retained for presentation, agent grouping used for dispatch | The user still reads blocker→polish; the machine dispatches by owner | ✅ |
| `add.qa` STEP 6 reports per-agent counts | Makes the route visible without opening the report | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `add-doc-schemas` (`references/review.md`) | `qa-validation` gains `route`, the `## Fix Routing` section, hard bans, and the judged-contract provenance hash in frontmatter; framework version bump at release | Modify |
| `add-qa` skill | Routing rules, the `ux` two-value classification, capability validation, ordering, template | Modify |
| `add.qa` | STEP 5 derives and writes routes (**coordinator-only**); STEP 6 summary extended | Modify |
| `fragments/qa-pipeline/add.build.md` | Dispatch by agent in dependency order; manual routes surfaced; **a Named Agent Mapping + soft-degrade table**, which the fragment currently lacks entirely | Modify |
| **`add.build`** | Its Named Agent Mapping covers only `@database-agent`/`@backend-agent`/`@frontend-agent`. Routing adds `@e2e-agent` and `@ux-agent` as dispatch targets — both need mapping rows and fallbacks | **Modify (was "None")** |
| `ux-agent`, `qa-agent` | Emit `type` + root cause; they do **not** emit `route` | Modify |
| `add-ecosystem` skill | `add.qa → add.build` routing row; Agents table "Dispatched by" column for `@e2e-agent` (currently `add.test` only) and `@ux-agent`; Dependency Index | Modify |
| `cli/src/plugins.json` | `playwright.agents[]` lists only `qa-agent`. If `@ux-agent` is on the live-driving path per `04`, it needs a catalog row and a drive fragment | **Verify/Modify (was missing)** |
| `database-agent`, `backend-agent`, `frontend-agent`, `e2e-agent` | Receive dispatches with a finding slice — no definition change | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A report that is directly dispatchable | Coupling between the report format and the agent roster |
| Layer-correct fix ordering | A longer, more structured report |
| Environmental problems stop generating speculative code changes | Some findings resolve to "user must act", which can read as unhelpful |
| No re-diagnosis in `/add.build qa` | `add.build`'s QA-Fix flow now depends on a section that must be present |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The agent roster changes and routing rules go stale | Med | Rules live in the `add-qa` skill, not in the command; `add-framework--sync` surfaces roster drift |
| A wrong route dispatches an agent that cannot fix the finding | Med | Capability validation is a schema hard ban; the confirmation gate remains; a route without its required evidence citation is never dispatched |
| Dependency ordering serialises work that could be parallel | Med | Order is enforced across layers only; within one agent's slice, independent findings may run in parallel |
| Reading `## Fix Routing` breaks on a legacy report that lacks it | High | `/add.build qa` falls back to the existing severity/axis grouping when the section is absent — old reports still work |
| Routing chains produce partial fixes when a later agent is skipped | Med | Each agent's slice states what it owns; a skipped link is reported as unresolved, and the next `/add.qa` run catches it |
| Findings appearing under multiple agents are double-counted in the summary | Low | Count distinct findings; per-agent counts are labelled as involvement, not ownership |
| `route` becomes a rubber-stamp field filled with the most common agent | Med | Route must be consistent with the finding's root cause; a mismatch between root cause and route is invalid per the rules table |

## Next Steps

Run: `/add-framework--plan implement docs/brainstorming/2026-07-26-05-qa-fix-routing.md`
