# Brainstorm: Absorb `add.test` into `add.build`

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-08-24
> **Type:** command
> **Umbrella:** `2026-08-24-development-loop-consolidation-000-umbrella.md` (topic 03 of 05)

## Discovery

- `add.test.md` is **289 lines with no frontmatter** — unique among the commands. Its description in `provider-map.json:77` is authored independently of the file.
- Its body is feature-agnostic: STEP 1 framework detection and auto-configure, STEP 2 scope resolution (diff / feature N / `F[NNNN]`) plus contract-test awareness, STEP 3 parallel area generators, STEP 4 coverage (informational, no enforced threshold), STEP 5 report plus `log-iteration.sh`.
- Its **only** injection is `feature:qa-pipeline:e2e-dispatch` at L210-211, anchored after the "Ready | Proceed to STEP 4" table row. The fragment dispatches `@e2e-agent` per surface, in parallel with the area generators, WAIT-ALL before STEP 4.
- STEP 3's area generators are **anonymous** — `[full-access, standard]` plus a skill name. Topic 02 promotes them to `@test-agent`.
- STEP 3.3 carries the self-detection self-check: if the E2E section is absent the command names the remedy (`codeadd features enable qa-pipeline`, `/add.qa-setup`) and **explicitly does not stop** — unit generation proceeds.
- `add.test.md` uses `{{addpath:}}` but never `{{cmd:}}` or `{{skill:}}` — inconsistent with every other command.
- `add.build.md` already hosts 6 markers and has a documented QA-Fix section anchored below STEP 5.
- `cli/tests/qa-pipeline-umbrella.test.js:103-104` asserts the `e2e-dispatch` anchor exists in `commands/add.test.md`.
- **Plan 0056** created the self-detection pattern this command uses; `add.build` is cited in that plan as the model.

## Context & Motivation

`add.test` produces test artefacts for code `add.build` just wrote. It is a phase of its neighbour that was given its own command file. Removing it cuts the orchestrator's coordination surface and removes a hand-off where a user can simply forget to generate tests.

The file splits cleanly along an existing seam: its base body belongs to test generation (topic 01's `tdd-pipeline`), and its injected section belongs to E2E authoring (`qa-pipeline`). Both halves land in `add.build`, which already hosts markers for both features — so this is a merge of injection sites, not a new mechanism.

This topic runs before topic 04 because `add.build` is the simpler absorption: two independent injections into one host, no read-only conversion, no schema change. It validates the pattern that topic 04 then applies to the harder case.

## Problem / Opportunity

**1. The base body is not owned by any feature, which makes the merge ambiguous.** Today unit and integration generation runs unconditionally. Folded into `add.build` it must sit under some gate, and the umbrella decided that gate is `tdd-pipeline` — which is a real product change: with the feature off there is no test generation at all.

**2. Two halves, two owners, one host.** The E2E half is `qa-pipeline`'s and must remain independently toggleable. A project can run `tdd-pipeline` on and `qa-pipeline` off (the common case: `qa-pipeline` defaults to false), or the reverse. `add.build` must host both injections without either depending on the other.

**3. Timing is a real constraint, and it favours this host.** `@e2e-agent` explicitly *"runs after implementation, when the components and stable selectors already exist."* It cannot run before `add.build`. Hosting it there is the only placement that does not require a reconciliation pass.

**4. Test generation and the TDD RED gate overlap but are not the same thing.** The `tdd` fragment already injects a test-first ordering, a RED-confirmation gate and a STEP 12 verification loop into `add.build`. Adding generation to the same feature means the fragment now carries both the discipline and the production of the artefacts the discipline operates on — which needs an explicit ordering decision, not an accidental one.

## Proposed Solution

**Recommended — fold each half into `add.build` as an independent injected section, under its own feature.**

**`tdd-pipeline` half.** The `fragments/tdd-pipeline/add.build.md` fragment gains new sections carrying `add.test`'s STEP 1 (framework detection and auto-configure), STEP 2.2 (existing contract-test awareness), STEP 3 (now `@test-agent` per area) and STEP 4 (coverage, informational).

**These fire in all four `add.build` modes**, not only TASKS MODE. Today `/add.test` runs independently of mode, and confining generation to TASKS MODE would silently drop it for DEVELOPMENT, CORRECTION and FEATURE even with the feature on. The existing `tasks-flow` / `gate` / `verify-red` / `awareness` sections stay TASKS-scoped as they are today; the new generation sections attach at mode-independent points: framework detection once during context setup, `@test-agent` dispatch alongside each area's implementation, coverage inside the existing STEP 12 verification section.

**CORRECTION mode gets the red-green cycle, not a regeneration sweep.** A fix path must not rewrite passing tests. Instead `@test-agent` asks the narrower question the discipline is for: does this fix need a new failing test first, so the bug cannot recur? It writes that test RED, the fix turns it GREEN, and existing tests are left alone unless the fix genuinely changed their contract.

**`qa-pipeline` half.** `fragments/qa-pipeline/add.test.md` is deleted and its `e2e-dispatch` section moves into `fragments/qa-pipeline/add.build.md`, joining the existing `qa-fix` section. It anchors **after implementation completes and after the area validators return** — the point where components and stable selectors exist and the WAIT-ALL semantics it needs are already in place.

**Self-detection survives the move.** `add.test` STEP 3.3's non-blocking self-check migrates with the section: if the E2E block is absent, `add.build` names the remedy and continues. The equivalent check for the `tdd-pipeline` half is new: with the feature off, `add.build` says once that test generation is disabled and how to enable it, rather than silently producing no tests.

**Both self-checks must live in `add.build`'s ungated base body, never inside the fragment they describe.** This is why `add.test.md`'s existing E2E self-check sits at line 213, *outside* the `e2e-dispatch` markers: a notice nested inside the block it reports on cannot render when that block was not injected, which reproduces exactly the silent loss it exists to prevent.

**Alternative A — keep unit generation unconditional in `add.build`'s base body, gate only the discipline.** This was offered and rejected: it preserves today's capability for users with TDD off, but leaves the feature meaning "ordering", which contradicts renaming it to `tdd-pipeline`. Recorded because it is the reversible half of the decision if the product change proves unpopular.

**Alternative B — E2E authoring into `add.review` with the rest of QA.** Rejected: it would make the review write test code, breaking the read-only conversion topic 04 depends on.

**Alternative C — E2E authoring into `add.plan` beside `screens.json`.** Rejected: no UI exists at plan time, so the spec would be authored without real selectors and need a reconciliation pass later.

## Type of Artefact

command (plus fragments and the provider registry)

## Scope

### Includes

- Deleting `commands/add.test.md` and its `provider-map.json` entry
- Deleting `fragments/qa-pipeline/add.test.md`
- New sections in `fragments/tdd-pipeline/add.build.md` for framework detection, contract-test awareness, `@test-agent` dispatch and coverage reporting
- Moving `e2e-dispatch` into `fragments/qa-pipeline/add.build.md`
- New anchors in `commands/add.build.md` for both halves, honouring the empty-marker build gate
- Migrating the non-blocking self-detection check for the E2E half; adding its counterpart for the generation half
- Routing every reference to `/add.test` to `/add.build`: `add.build.md:575` (its own STEP 15 "After development" line, which would otherwise ship pointing at a deleted command), `add.qa.md:156-158` (STEP 4 §4.3, superseded by topic 04), `add-ecosystem`, `.claude/commands/add-framework--sync.md:160` (internal layer — companion self-plan), web. `README.md` carries no `add.test` reference today and is regenerated by `/add-framework--sync` rather than hand-edited
- Re-anchoring `cli/tests/qa-pipeline-umbrella.test.js`, `qa-reachability.smoke.test.js`, `build.test.js`

### Does NOT Include

- Changing what `@e2e-agent` does or its contract with `screens.json`
- Changing coverage semantics (stays informational, no enforced threshold)
- Creating `@test-agent` — that is topic 02
- The `tdd` to `tdd-pipeline` rename itself — that is topic 01
- The `## Fix Routing` universal contract — that is topic 04
- Adding an app-boot dependency to `add.build`: `@e2e-agent`'s existing "boot fails, defer the first run" behaviour is preserved, now deferring to `add.review`

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| The two halves become two independent injections into one host | They have different owners and different toggles; a project may run either without the other | ✅ |
| Generation fires in all four `add.build` modes | `/add.test` is mode-independent today; TASKS-only would be a second, undeclared capability loss on top of the accepted feature gate | ✅ |
| CORRECTION mode runs red-green rather than regenerating | Writing a failing test for the bug before fixing it is what stops the bug recurring; regenerating a whole area's tests inside a fix path would churn passing tests, and iteration 2+ of the loop is exactly that path | ✅ |
| Unit and integration generation sits under `tdd-pipeline` | Makes the feature mean the pipeline, not just the ordering. Accepted product change | ✅ |
| E2E authoring stays under `qa-pipeline` and moves host only | It is `qa-pipeline`'s content; only its anchor changes | ✅ |
| E2E anchors after implementation and after area validators | `@e2e-agent` requires existing components and stable selectors; the WAIT-ALL it needs is already there | ✅ |
| Generation sections integrate with the existing `tdd-pipeline` fragment sections, not beside them | Framework detection must precede any test work; coverage belongs with the existing verification gate. Appending would produce two disjoint test flows in one command | ✅ |
| Self-detection is preserved for the E2E half and added for the generation half | Silence at the moment it matters is the failure Plan 0056 exists to prevent | ✅ |
| `add.test`'s inconsistent `{{addpath:}}`-only usage is corrected on the way in | The migrated content must follow `add-resource-path-convention` like everything else in `add.build` | ✅ |
| `add.build` may grow past 900 lines | It is the accepted cost of the consolidation; topic 02's thin-coordinator restructuring is what keeps it navigable | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `commands/add.test.md` | Deleted | Remove file plus `provider-map.json:77` |
| `fragments/qa-pipeline/add.test.md` | Deleted | Section moves to `add.build.md` fragment |
| `fragments/tdd-pipeline/add.build.md` | Gains 3–4 sections | Framework detection, contract awareness, `@test-agent` dispatch, coverage |
| `fragments/qa-pipeline/add.build.md` | Gains `e2e-dispatch` beside existing `qa-fix` | Two sections, one file |
| `commands/add.build.md` | New anchors for both halves | Must satisfy the empty-marker build gate and anchor uniqueness validation |
| `commands/add.build.md:575` | Its own STEP 15 names `/add.test` as a next step | Reroute — self-reference inside the file this topic edits |
| `commands/add.qa.md:156-158` | STEP 4 §4.3 routes to `/add.test` for E2E authoring | Retarget to `/add.build`; superseded outright by topic 04 |
| `agents/e2e-agent.md:31` | "defer the first run to `/add.qa`" | Becomes "defer to `/add.review`" — coordinate with topic 04 |
| `cli/src/features.js` | `qa-pipeline.commands` array lists `add.test` | Update (documentation-only field) |
| `skills/add-ecosystem/SKILL.md` | Command table plus routing graph name `add.test` | Update |
| `.claude/commands/add-framework--sync.md:160` | Lists `add.test` in the main feature flow | Update |
| `cli/tests/qa-pipeline-umbrella.test.js:103-104` | Asserts the anchor lives in `add.test.md` | Re-anchor to `add.build.md` |
| `cli/tests/qa-reachability.smoke.test.js` | Asserts built `add.test` behaviour | Re-anchor |
| `cli/tests/build.test.js:115-121` | Uses the literal name `add.test` as a fixture | Rename fixture |
| `web/src/pages/docs.astro` | Command card plus Cytoscape edge `['add.test','e2e-agent','dispatches']` | Regenerate via sync |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| One fewer hand-off where tests can simply be forgotten | A standalone command for regenerating tests without running a build |
| Test artefacts produced where the code was just written | `add.build` grows past 900 lines |
| A feature name that matches what the feature does | Unit test generation for projects running with TDD off |
| `add.test`'s resource-path inconsistency closed on the way in | — |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Users with `tdd-pipeline` disabled silently lose test generation | High | The new self-detection notice must say it explicitly, once, at the moment it matters |
| Generation sections attach only at TASKS-MODE integration points, silently dropping 3 of 4 modes | Medium | The existing `tasks-flow`/`gate`/`verify-red` sections are TASKS-scoped; the new sections must anchor at mode-independent points instead. Make "generates in DEVELOPMENT and FEATURE mode" an acceptance check, not an assumption |
| The generation sections are appended rather than integrated, producing two disjoint test flows | Medium | The fragment's existing `tasks-flow` and `verification` sections are the integration points; treat interleaving as an acceptance criterion, not a detail |
| Anchor uniqueness validation fails: `add.build` gains many markers in a file that already has 6 | Medium | The build already validates anchor uniqueness and variable-adjacency and fails loud; run it early rather than at the end |
| E2E dispatch anchors too early and `@e2e-agent` finds no selectors | Medium | Anchor after the area validators return, not after implementation dispatch |
| `@e2e-agent`'s boot-failure deferral points at a command that no longer exists | Certain if unhandled | Retarget to `/add.review` in coordination with topic 04 |

## Next Steps

Run: `/add-framework--plan absorb add.test into add.build as two independent feature-gated sections`

Then, as a companion for the internal layer (`/add-framework--build` does not reach `.claude/`):

Run: `/add-framework--self-plan drop add.test from the main feature flow list in add-framework--sync`
