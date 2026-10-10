# Brainstorm: Lighter, clearer product QA flow

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-09
> **Type:** workflow
> **Ticket:** 0035B

## Objective

With `qa-pipeline` on, a feature goes from plan to merge paying for each QA check once, and the user always knows the next QA step — no dead end at close-out, no server to start by hand, no setup run that re-runs the whole pipeline.

## Discovery

- `docs/deliveries/2026-10-08T211926-PLAN--lighter-add-build/` (0034B) — the model: cut the repeat, keep the check, one F-block and one commit per cut. It did not touch QA, and its F4 removed the build's `/add-review` suggestion.
- `docs/deliveries/2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary/` — `qa-pipeline` gates authoring and correction, not judgement.
- `docs/brainstorming/2026-08-24-development-loop-consolidation-004-qa-into-review.md` — QA in review split by cost: preflight always, evidence when the tree changed, judgement when the evidence changed.
- `2026-07-27-update-dual-judge-qa-validation` changelog — the `@ux-agent` / `@qa-agent` split is deliberate and stays.
- Delivery index: no QA artefact was ever delivered and dropped (`history` empty for all of them).

## Context & Motivation

Ticket 0035B asks for a review of the product QA flow in the spirit of 0034B. The mapping (below) found dispatches that repeat, one user-facing dead end, and setup cost far above what setup needs.

## Problem / Opportunity — the review the ticket asks for

| Part | What it does | Cost today | What weighs or confuses |
|---|---|---|---|
| `qa-pipeline` in `add-plan` | One dispatch writes `plan-qa-spec.md` and `_tests/screens.json` from `design.md` | 1 dispatch per plan run | Runs on features with no screen and produces an empty table. No warning when QA setup was never run |
| `qa-pipeline` in `add-build` — e2e | One `@e2e-agent` per surface at the end of validate: authors `<surface>.qa.spec`, boots the app, runs it | 1 dispatch per surface (per SF on an epic) | Specs written after the task commits stay uncommitted, so `/add-review`'s `BUILD_REVIEW_COVERS` (0034B) is false whenever QA is on. The run leaves a `_tests/run-NNN/` with no report. No ledger line, so a resume cannot tell whether it ran. Parallel agents write one `screens.json` |
| `qa-pipeline` in `add-build` — qa-fix | Routed correction of QA rows from `review-NNN.md` | `@fix-agent` + re-review per round, up to 3 | Points at a step that does not exist (`STEP add-build.order`), sits in STEP load-docs instead of STEP correct, and does not say which agent takes which route |
| QA in `add-review` | Preflight (script) → evidence capture (spec run) → `@ux-agent` ∥ `@qa-agent` per SF → `qa-validation-NNN.md` | 2 dispatches per SF per review run | Preflight row 3 blocks when `baseUrl` is down, although the managed lifecycle can boot the app. Maintainer notes sit inside the prompt the agent reads |
| `add-qa-setup` | Installs, config, catalog, gitignore, receipt, then a smoke `/add-review` with up to 3 `/add-build` corrections | 0–1 nested review; worst case 4 reviews + 3 builds | The smoke runs on the empty catalog the same run just created. Stale references in `add--setup-contract` (STEP numbers) and `add--qa-migration` (first-run-only wording vs always-scan) |
| promote-qa in `add-done` | `qa-evidence.cjs validate` then `promote` to `_tests/final/` | 0 dispatches, scripts only | **Dead end:** after review (run-001) → fix build, `converge-gates.cjs` reports `REVIEW_SOURCE=build`, `BASELINE=none`; the user answers "close without QA", and `validate none` fails against `run-001`, forbidding the merge with no hint. After 0034B the build no longer suggests `/add-review` either |

Clean path today: ~5 QA-only dispatches on top of the base pipeline; one QA correction loop takes it to ~11–13.

## Proposed Solution

Nine cuts, each local to one artefact, each its own F-block and commit — the 0034B shape.

| # | Cut | Gain | Loss |
|---|---|---|---|
| C1 | `add-done`: answering "close without a QA judgement" skips STEP promote-qa instead of validating `none` against existing working runs | The dead end is gone | Unjudged working evidence is not promoted to `_tests/final/` — it was never judged, so nothing of value is lost |
| C2 | `add-build`: when `qa-pipeline` is on, the closing next step suggests `/add-review` (QA judgement lives only there) | The user knows QA is still owed | None |
| C3 | `add-build`: the e2e spec files enter a build commit | `BUILD_REVIEW_COVERS` works with QA on; the Final Review package sees the specs | None |
| C4 | `add-plan`: the qa-spec step runs only when `design.md` declares at least one screen — the same condition the UX step uses | −1 dispatch on non-UI work | None |
| C5 | `add-build`: the screen test runs ONCE per delivery — see below | −(surfaces − 1) dispatches per SF, and −(SFs − 1) on an epic; no concurrent writers on `screens.json` | No parallel authoring |
| C6 | `add-review`: preflight row 3 (`baseUrl` unreachable) tries the configured boot (`bootHint`, the managed lifecycle) and blocks only if boot fails | No server started by hand | None |
| C7 | `add-qa-setup`: remove the smoke review and its correction loop; setup's proof becomes preflight `a` and `b` green | Removes up to 4 nested reviews + 3 builds | Setup no longer proves QA end to end; the first real `/add-review` does |
| C8 | `add-plan`: read `SETUP_QA` (already emitted by `status.cjs`) and warn once when `qa-pipeline` is on but setup is absent or stale | Found at plan time, not at the end of the review | None |
| C9 | Cleanup: fix `STEP add-build.order`, move qa-fix to STEP correct and state which agent takes which route, move maintainer notes in `fragments/qa-pipeline/add-review.md` into HTML comments (stripped at build), fix stale references in `add--setup-contract` and `add--qa-migration` | Shorter, unambiguous prompts | None |

### C5 — the screen test runs once per delivery

- **When:** after every area of the delivery is implemented and validated, before the Final Review. On an epic, on the build of the **last subfeature** — the same point the DELTA pass runs — covering every SF's screens.
- **Who:** ONE `@e2e-agent` for the whole delivery. It authors the spec for every surface in the plan's `## QA/E2E Specification` (every SF's, on an epic), finalizes `screens.json`, runs the specs through the managed lifecycle and reports pass/fail per surface.
- **Failures:** each failing assertion becomes a row of a normal fix wave in STEP correct — one `@fix-agent`, under the existing `MAX_ATTEMPTS = 3`. The gate of such a round is the spec re-run going green, run by the coordinator as a command, **not** a reviewer re-review and **not** a second `@e2e-agent` dispatch — the same rule 0034B set for build-error and `BLOCKED` rounds. The Final Review reads the fix diff.
- **Evidence:** the build's run leaves no `_tests/run-NNN/` behind; allocating runs stays with `/add-review` through `qa-evidence.cjs next`.
- **Resume:** the e2e dispatch writes a ledger line, so a resumed build does not re-dispatch it.
- **Judgement stays in `/add-review`.** The build only proves the specs pass; UX and conformance are judged by the review's two judges.

### Alternatives considered

- **One `@e2e-agent` per SF** — rejected by the user: still repeats per SF on an epic.
- **Drop the build run and let the review run the specs** — rejected: a broken spec would surface at review, the most expensive point.
- **Single judge in review** (`@qa-agent` only when there is no `## Design Contract`) — rejected: small gain against a decision recorded in 2026-07.

## Type of Artefact

workflow — changes to existing product commands, fragments, skills and one script read.

## Scope

### Includes
- C1–C9 as described, all in the product layer.
- Updating `add--review-discipline` where it states per-command dispatch counts for build or review, so it matches.

### Does NOT Include
- Merging the two review judges.
- The duplicated receipt check in `status.cjs` and `qa-preflight.cjs`, and the double `validate` in `add-done` (scripts, cheap).
- Renaming QA terms (spec, evidence, baseline, receipt).
- `add--qa-migration` behaviour (only its stale wording).
- The playwright plugin.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| "Close without QA" skips promotion | no dead end at close-out | The user already chose to close without a judgement; blocking contradicts the answer | ✅ |
| Build suggests `/add-review` only when `qa-pipeline` is on | the user always knows the next QA step | QA judgement exists only in the review; 0034B's cut stays for everyone else | ✅ |
| One `@e2e-agent` per delivery, after all areas and SFs | each QA check paid once | User decision; removes per-surface and per-SF repeats | ✅ |
| e2e failures go through a normal fix wave, gated by the spec re-run | each QA check paid once | Same rule 0034B set for build-error rounds; `MAX_ATTEMPTS` stays 3 | ✅ |
| Review boots the app before blocking | no server to start by hand | The managed lifecycle already exists in the e2e path | ✅ |
| Setup drops the smoke and its correction loop | no setup run that re-runs the pipeline | Largest single cost; the first real review proves the pipeline | ✅ |
| Both review judges stay | out of scope by choice | Recorded decision; small gain | ✅ |
| One plan, one F-block and commit per cut | — (delivery shape) | 0034B precedent; one ticket → one plan (`add-plan-authoring`, The Ticket) | ✅ |

## Ecosystem Impact

All artefacts are **[product]** layer.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `commands/add-done.md` | add-build, add-help, add-plan, add-pull-request, add-review, `fragments/qa-pipeline/add-review.md`, add--delivery-validation, add--doc-schemas, add--qa (hand-offs); fragments board, docs-pruning, gitnexus inject into it | Gate reading branch 5 and STEP promote-qa | C1 |
| `commands/add-build.md` | add-done, add-help, add-new, add-plan, add-qa-setup, add-review, consistency-agent, ux-agent, `fragments/qa-pipeline/add-review.md`, 9 skills (hand-offs); fragments board, qa-pipeline, tdd-pipeline, gitnexus inject into it | Next-step block, commit step, ledger line for the e2e dispatch | C2, C3, C5 |
| `fragments/qa-pipeline/add-build.md` | injects into add-build (graph: `INJECTS_INTO`) | e2e-dispatch rewritten to once per delivery; qa-fix moved and clarified | C3, C5, C9 |
| `commands/add-plan.md` / `fragments/qa-pipeline/add-plan.md` | add-plan: add-build, add-diagnose, add-help, add-new, add-review and others (hand-offs); the fragment injects into add-plan | qa-spec gated on screens; `SETUP_QA` warning | C4, C8 |
| `fragments/qa-pipeline/add-review.md` | injects into add-review | Row 3 boots before blocking; maintainer notes to HTML comments | C6, C9 |
| `scripts/qa-preflight.cjs` | add-review fragment, add-qa-setup (`RUNS_SCRIPT`, per discovery) | Possibly none — row 3's block/degrade is decided by the caller ("callers decide block vs work") | Plan confirms |
| `commands/add-qa-setup.md` | add-build, add-review, `fragments/qa-pipeline/add-review.md`, add--qa, add--qa-migration, add--setup-contract (hand-offs) | Smoke step and correction loop removed; hand-off list updated | C7 |
| `agents/e2e-agent.md` | add-build, add-qa-setup, test-agent, `fragments/qa-pipeline/add-build.md`, `fragments/qa-pipeline/add-review.md`, add--qa-spec (`DISPATCHES`) | Input becomes every surface of the delivery; no `run-NNN` left behind | C5 |
| `skills/add--setup-contract`, `skills/add--qa-migration` | add-qa-setup (`USES_SKILL`) | Stale wording only | C9 |
| `skills/add--review-discipline` | NOT VERIFIED — not queried; plan resolves | Dispatch counts kept consistent | Follow-up of C5 |
| `scripts/converge-gates.cjs` | add-build, add-done, add--commit (`RUNS_SCRIPT`) | None expected — C1 changes how add-done acts on `BASELINE=none`, not the script | none |

Not visible to the graph: tests under `cli/tests/` and `scripts/tests/` asserting QA wording or the smoke step — the plan greps them; any removed test needs a `Test-Removed:` trailer.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| ~1 + (surfaces − 1) + (SFs − 1) fewer dispatches per delivery, and up to 7 nested command runs fewer at setup | Parallel spec authoring; end-to-end proof at setup time |
| No dead end at close-out, no manual server start | — |

| Risk | Probability | Mitigation |
|---|---|---|
| One `@e2e-agent` over many surfaces on a large epic runs long or loses track | Med | The plan's `## QA/E2E Specification` is its checklist; it reports pass/fail per surface |
| Skipping promotion hides QA work the user wanted kept | Low | The question text says evidence will not be promoted |
| Auto-boot in review starts a process the user did not expect | Low | Same managed lifecycle as e2e: tear down only what it booted |
| Removing the smoke lets a broken setup reach the first review | Med | Preflight `a`+`b` still runs at setup and at every review |

## Next Steps

Run: `/add-framework--plan docs/brainstorming/2026-10-09T113824-lighter-product-qa-intent.md`
