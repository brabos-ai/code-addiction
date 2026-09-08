# Brainstorm: Absorb `add.qa` into `add.review`

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-08-24
> **Type:** command
> **Umbrella:** `2026-08-24-development-loop-consolidation-000-umbrella.md` (topic 04 of 05)

## Discovery

- `add.qa.md` (260 lines) is **three responsibilities with different costs**: STEP 1–2 preflight and scope (cheap, deterministic, `qa-preflight.sh a` and `b`), STEP 4.1–4.4 spec execution and evidence capture (expensive, deterministic), STEP 4.5–5 dual-judge and merge (expensive, judgement). It carries **no `feature:` marker** — it ships unconditionally.
- It hosts `plugin:playwright:drive` at L213-214. `cli/src/plugins.json:44` declares `"injects": ["add.qa"]`.
- It writes `SCOPE_DIR/_tests/run-NNN/qa-validation-NNN.md`, resolving `run-NNN` once via `qa-evidence.sh next` before writing anything, and reads the prior report via `qa-evidence.sh previous`.
- It is scoped **per subfeature** (`/add.qa 0001F SF02`); `add.review` is scoped per feature/branch.
- `add.review.md` (657 lines) opens with an **AUTO-CORRECTION RULE**; its two parallel `@reviewer-agent` dispatches are read-write and report "Files Modified".
- `add.review` STEP 2.2 item 4b resolves `QA_BASELINE` via `qa-evidence.sh working-baseline` — **per scope**, resolved fresh from the filesystem every run, with an explicit anti-pattern warning against copying it from a prior `review.md`.
- STEP 2.2 item 4c and STEP 7.4 compute `REVIEW_TREE_BEFORE` / `REVIEW_TREE_AFTER` fingerprints to derive `QA_BASELINE_INVALIDATED` — the framework already models the exact staleness this topic removes at the source.
- `add.review` Gates 1–7 (L39-156) are declared to "replace all conditional blocks throughout the document" — the canonical hard-stop registry.
- `add.done` STEP 4.0 reads `review.md`'s `| **Overall** |` row and its `> **QA baseline:**` line, and blocks if either is absent. **It never infers the baseline.**
- `add.review` already resolves `design.md` per subfeature (SF-level first, feature-level fallback) — the same Location rule `add.qa` uses.
- **Plan 0059** owns the dual-judge axis split and coordinator merge rules; `add-qa/references/coordinator.md` states it is *"loaded by `/add.qa` at the merge step, and by nothing else."*
- `add-ecosystem/SKILL.md` carries ~22 lines naming `add.qa` / `add.qa-setup` across its command, skill, agent and plugin tables plus the routing graph.

## Context & Motivation

`add.qa` judges the rendered result of code `add.build` just wrote, and the only consumers of its report are `add.build qa` and `add.review`. It is the QA half of a review that already exists.

More importantly, the loop in topic 05 needs a judge that does not move the thing it judges. Today `add.review` auto-corrects: the `@reviewer-agent` pair applies fixes, which changes the tree after QA captured evidence, which sets `QA_BASELINE_INVALIDATED`, which routes back to QA, which routes back to review. That is an oscillation the framework currently absorbs by making the user drive it. Automated, it would consume the loop's three-iteration budget without a single real finding being fixed.

`add.qa` already got this right: *"This is an audit, not a gate — it documents, it never fixes."* This topic extends that stance to the whole review.

## Problem / Opportunity

**1. The judge mutates the object it judges.** This is the single largest obstacle to convergence, and it is a property of `add.review`, not of the loop.

**2. Absorbing all three of `add.qa`'s responsibilities as one block makes the loop pay for all three every iteration.** Preflight is cheap. Spec execution must re-run whenever code changed. Judging only needs to re-run when the *evidence* changed. Merging them into one opaque step throws away a distinction the framework already computes.

**3. Scope shapes differ — but the reconciliation already exists.** `qa-evidence.sh` is per-scope; `add.review` already resolves `design.md` per subfeature. The absorbed QA is a loop over the in-scope `SCOPE_DIR`s, not a single step.

**4. `review.md` is overwritten, so the loop has no history.** Today a rerun backs up to `review.md.prev` — one level. Across three iterations the loop needs to answer "are these the same findings as last round?" to detect no-progress, and a single overwritten file cannot answer it.

**5. Removing `add.qa` breaks the `playwright` plugin.** `plugins.json` names it as an injection target; the anchor moves with the content.

## Proposed Solution

**Recommended — absorb `add.qa` into `add.review`'s base body, split by cost, self-gating on the setup receipt rather than on a feature flag, with the review made read-only and its output versioned.**

**Absorption shape.** `add.review`'s **base body** gains `add.qa`'s content as three distinct sections. This is not a fragment and not feature-gated: `add.qa` ships unconditionally today and self-gates on the `add.qa-setup` receipt, and the absorbed sections keep exactly that contract. A project that ran `/add.qa-setup` and declined the `qa-pipeline` feature keeps its QA judgement, as it does today. `qa-pipeline` continues to gate **authoring** (`add.plan`'s QA-spec, `@e2e-agent`) and **correction**, never judgement.

The three sections split by cost, so the loop can skip what has not changed:

- *preflight* — `qa-preflight.sh a` and `b`, the 14 rows, the consolidated diagnosis, and the hard `block` on the `add.qa-setup` contract rows 9–10. Runs once per review invocation.
- *evidence* — per in-scope `SCOPE_DIR`: resolve `run-NNN` via `qa-evidence.sh next`, run the persisted `<surface>.qa.spec`, capture screenshots, computed styles and axe results. Re-runs when the tree fingerprint changed since the last run; skipped when it did not.
- *judgement* — the `@ux-agent` ∥ `@qa-agent` dual dispatch, coordinator coverage reconciliation, merge under `add-qa/references/coordinator.md`, and the report. Re-runs when the evidence changed.

**The skip predicate needs one persisted value.** `REVIEW_TREE_BEFORE` / `REVIEW_TREE_AFTER` exist today but are compared **within a single invocation**, to catch self-inflicted drift; nothing survives to the next run, and `qa-evidence.sh` stores no content hash. So **`qa-validation-NNN.md`** gains a `judged-tree` frontmatter field beside the `judged-contract` provenance hash that schema already carries: the fingerprint of the tree that produced the evidence. The next round compares its current fingerprint against that field and decides. This is one field on an artefact that is already versioned per run and already has frontmatter — not a new file and not a new kind of state. (`review-NNN.md` is a separate artefact and carries no such field; the skip predicate is about evidence, not about the review aggregate.)

Separately, with the review read-only, `REVIEW_TREE_AFTER` equals `REVIEW_TREE_BEFORE` by construction, so `QA_BASELINE_INVALIDATED` becomes structurally unreachable — the category disappears rather than being handled.

**Read-only conversion.** The AUTO-CORRECTION RULE is removed. `@reviewer-agent` becomes read-only. **This reaches one gate, and reformats another.** Gate 5 is the real conversion: its "review build errors, fix automatically, repeat until passing" is the last place `add.review` mutates code, and it becomes a routed finding instead. Gate 6 already refuses to auto-fix today (`TOUCHED_FAILURES` downgrades the tick, marks the review BLOCKED and reports to the user) — nothing about its read-only stance changes; only its output format does, folding into the same `## Fix Routing` rows. A failing build and a red validation gate are findings like any other, routed to the build leg. Every finding — code, spec compliance, UX, functional, a11y, build failures, red validation gates — is emitted into a single `## Fix Routing` table keyed by area on `review-NNN.md`, which becomes the universal review-to-build correction contract.

**How that one table is assembled.** The `qa-validation` schema already mandates a `## Fix Routing` section on every per-scope report, and those per-scope tables stay exactly as they are. `review-NNN.md`'s table is their **union**, plus the code-review, build and validation-gate findings. No dedup rule is needed: every row carries its originating scope, so two subfeatures reporting the same symptom are genuinely two rows with two fix sites. Rows are ordered by the existing severity precedence, then by the database-backend-frontend-e2e area order the `qa-fix` fragment already uses. `@fix-agent` (topic 02) consumes it inside `add.build`, and the `/add.build qa` argument mode is retired: there is one correction path, not two.

**Two reports coexist; nothing about QA evidence changes.** The *judgement* section keeps writing its per-scope `SCOPE_DIR/_tests/run-NNN/qa-validation-NNN.md` exactly as `add.qa` does today — same schema, same 11 required sections, same frontmatter. This is load-bearing: `qa-evidence.sh validate` (L198-228) hard-fails without that file, `working-baseline` and `previous` (L440-465) require the immediate predecessor's report, and `add.done.md:195,197` calls `validate` and `promote` on that exact contract. All of it is in this design's Does NOT Include and stays untouched.

**Versioned output.** On top of that, `review.md` becomes `review-NNN.md`, written **flat at the feature-directory root** with one sequence per feature — the feature-level aggregate that `add.done` STEP 4.0 gates on. It is a different artefact from the per-scope QA reports, not a replacement for them: one review document per round covering every in-scope subfeature, so it needs no `_tests/run-NNN/` subtree and STEP 4.0 stays a single-path read of the highest-numbered file rather than becoming a loop over scopes. The `review.md` / `review.md.prev` idempotency-backup rule in Gate 7 is removed — superseded by numbering.

**`add.build` closes the round in the same document.** The review states the findings and the `## Fix Routing` table; the build appends what it actually corrected, per routed row, and marks the document finalized. Each `review-NNN.md` therefore becomes the complete record of one iteration — what was wrong and what was done about it — which is also the cleanest input for the loop's no-progress comparison. Read-only applies to the review's treatment of **code**; the build writing its resolution annex into the review document is the intended closure.

**Plugin retarget.** `plugins.json` `playwright.injects` moves from `add.qa` to `add.review`, and the `plugin:playwright:drive` anchor moves with the *judgement* section.

**Alternative A — absorb as one opaque block.** Simpler to write, and it is what "merge the command" literally means. Rejected: it makes every loop iteration pay full QA cost even when nothing rendered changed, which is the difference between a loop that is affordable and one that is not.

**Alternative B — keep `review.md` as a singleton.** Rejected: no-progress detection needs to compare rounds, and a single overwritten file plus one `.prev` cannot support three.

**Alternative C — read-only only inside the loop, auto-correct when invoked manually.** Offered and rejected in exploration: two behaviours in one command is the classic source of "the wrong mode was active" bugs, and the manual user benefits from the same non-oscillating contract.

## Type of Artefact

command (plus agents, schemas, the plugin registry, and an edit to the existing `fragments/qa-pipeline/add.build.md` — the absorbed QA sections themselves need no fragment file)

## Scope

### Includes

- Deleting `commands/add.qa.md` and its `provider-map.json` entry
- Three new sections in `commands/add.review.md`'s base body (preflight, evidence, judgement), ungated and self-gating on the `add.qa-setup` receipt
- A `judged-tree` fingerprint field in the **`qa-validation`** schema's frontmatter, and the skip predicate that reads it
- Removing the AUTO-CORRECTION RULE; making `@reviewer-agent` read-only
- Rewriting Gate 5's "auto-fix, re-run" build-failure text to route findings instead of mutating code, and reformatting Gate 6's existing report-to-user output (already non-mutating) into the same `## Fix Routing` rows
- A unified `## Fix Routing` table covering every finding class, replacing both correction paths
- Retiring the `/add.build qa` argument mode and its pre-check
- `review.md` becomes `review-NNN.md`, flat at the feature-directory root, one sequence per feature; `add.done` reads the highest-numbered one
- Removing the `review.md` / `review.md.prev` idempotency-backup rule from Gate 7
- The `add.build` write-back: a resolution annex per routed row, and marking the document finalized
- **Creating** a `review` schema entry in `add-doc-schemas/references/review.md` — none exists today (the file defines `audit-report`, `diagnose-report` and `qa-validation` only, and `review.md`'s shape is currently ad hoc inline in `add.review` STEP 8). The new entry defines the numbered filename and location, frontmatter (`id`, `type: review`, `status: open|finalized`), the Quality Gate table, the mandatory `> QA baseline:` line, the `## Fix Routing` table and the build's resolution annex
- Extending the existing `qa-validation` schema entry with `judged-tree`; that entry is otherwise retained unchanged, since it still governs the per-scope evidence reports
- Retargeting `plugins.json` `playwright.injects` and moving the `plugin:playwright:drive` anchor
- Correcting `add-qa/references/coordinator.md`'s "loaded by /add.qa and by nothing else" line
- Retargeting `@e2e-agent`'s boot-failure deferral from `/add.qa` to `/add.review`
- Rerouting every `/add.qa` reference across commands, skills, agents, scripts, README and web
- Re-anchoring `qa-reachability.smoke.test.js`, `qa-pipeline-umbrella.test.js`, and the `review.md` assertions in `done.bats`

### Does NOT Include

- Changing the dual-judge rubric, axis ownership, severity taxonomy or merge rules (Plan 0059 stands)
- Changing `add.qa-setup`, its `## Materializes` contract, its receipt or the `setup-shape` mechanism (Plan 0068 stands)
- Renaming `add.qa-setup` — its name is load-bearing for the contract and the receipt path
- Changing `qa-evidence.sh` promotion semantics or the `_tests/final/` rules
- Changing `add.done`'s gates beyond "read the highest `review-NNN.md`"
- Making `qa-pipeline` enabled by default

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| `add.review` becomes read-only; the build corrects | A judge that mutates the object it judges cannot converge; it also makes the review deterministic and safely re-runnable. Read-only refers to **code**; the build's resolution annex on `review-NNN.md` is deliberate | ✅ |
| The absorbed QA is split into preflight / evidence / judgement | Different costs and different re-run triggers; merging them makes every loop iteration pay full price | ✅ |
| Re-run decisions key off the existing tree fingerprint | `REVIEW_TREE_BEFORE`/`AFTER` already exist for exactly this comparison; no new state | ✅ |
| `QA_BASELINE_INVALIDATED` becomes structurally unreachable | With a read-only review the fingerprints are equal by construction — the category is removed, not handled | ✅ |
| One `## Fix Routing` table for every finding class | Gives the loop a single exchange format and retires the second correction path | ✅ |
| `/add.build qa` argument mode is retired | Nobody types it inside an automated loop, and keeping it alive means maintaining and testing a second entry point | ✅ |
| `review.md` becomes `review-NNN.md`, flat at the feature-directory root | The loop needs round-over-round comparison for no-progress detection; `.prev` gives one level. One sequence per feature keeps `add.done`'s gate a single-path read | ✅ |
| Numbering is per feature, not per scope | Unlike QA evidence, a review round produces one consolidated document covering every in-scope subfeature. Mirroring `qa-validation-NNN.md`'s per-scope sequences would force `add.done` STEP 4.0 into a loop and leave "the highest" undefined across independent sequences | ✅ |
| `add.build` annotates and finalizes `review-NNN.md` | Each round's document becomes the full record: findings plus resolutions. Read-only constrains the review's treatment of code, not the build's right to close the round in the same artefact | ✅ |
| The skip predicate is a `judged-tree` field on the versioned report | The existing fingerprints are within-invocation only. A frontmatter field on an already-versioned artefact is the smallest thing that makes cross-round comparison possible without inventing a state file | ✅ |
| `add.done` reads the highest-numbered `review-NNN.md` | Single-line change; keeps `add.done`'s gates and its refusal to infer the QA baseline intact | ✅ |
| The QA section is **not** feature-gated; it self-gates on the `add.qa-setup` receipt | This is exactly how `add.qa` behaves today. Gating it would remove QA judgement from every project on the default (disabled) flag — including those that ran `/add.qa-setup` and declined the feature, which works today | ✅ |
| The absorbed QA loops over in-scope `SCOPE_DIR`s | Reconciles the subfeature-vs-feature mismatch using the per-scope resolution both files already do | ✅ |
| `add.qa-setup` keeps its name and its hard-gate semantics | The `contracts.json` shape and the `docs/qa/qa-setup.md` receipt are keyed on it; the asymmetric interpretation of preflight rows 9–10 moves to `add.review` unchanged | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `commands/add.qa.md` | Deleted | Remove file plus `provider-map.json:80` |
| `commands/add.review.md` | Read-only; 3 new base-body sections; `review-NNN.md` output; Gates 1–7 revised, including removal of Gate 7's `.prev` backup rule | Largest single edit in the umbrella |
| `commands/add.build.md` | `/add.build qa` pre-check (L150) removed; `qa-fix` fragment becomes `@fix-agent` over `## Fix Routing` | Coordinate with topics 02 and 03 |
| `commands/add.done.md` | STEP 4.0 reads the highest `review-NNN.md`; L355 prose (inside STEP 7 Preview) names `/add.qa` | Two edits |
| `commands/add.review.md` base body | Gains 3 ungated sections carrying the absorbed body | No fragment file needed — the sections self-gate on the receipt |
| `commands/add.md:106` | "document availability" list names `review.md` | Retarget to the highest `review-NNN.md` |
| `fragments/qa-pipeline/add.build.md` | `qa-fix` section rewritten around `@fix-agent` and the unified table | Coordinate with topic 03 |
| `agents/reviewer-agent.md` | Read-write becomes read-only | Contract change |
| `agents/qa-agent.md`, `agents/ux-agent.md` | Frontmatter/prose name `/add.qa` as the dispatcher | Retarget to `/add.review` |
| `agents/e2e-agent.md:31` | Defers boot failure to `/add.qa` | Retarget to `/add.review` |
| `skills/add-qa/SKILL.md` | ~15 references to `/add.qa` as the consumer | Retarget |
| `skills/add-qa/references/coordinator.md:3` | "loaded by /add.qa and by nothing else" | Correct |
| `skills/add-doc-schemas/references/review.md` | A `review` schema entry is **created** (none exists); the `qa-validation` entry gains `judged-tree` and is otherwise retained | Schema change |
| `skills/add-ecosystem/SKILL.md` | ~22 lines across 4 tables plus the routing graph | Regenerate |
| `cli/src/plugins.json:42-44` | `injects: ["add.qa"]`, plus hints naming `/add.qa` | Retarget |
| `scripts/status.sh` | `HAS_REVIEW` detection keyed on `review.md` | Verify against the new filename |
| `scripts/qa-preflight.sh:4` | Header comment "shared by /add.qa and /add.qa-setup" | Update |
| `cli/tests/qa-reachability.smoke.test.js` | ~26 references asserting built `add.qa` behaviour | Largest test rewrite |
| `cli/tests/qa-pipeline-umbrella.test.js:120-121` | Asserts the `playwright:drive` anchor lives in `add.qa.md` | Re-anchor |
| `scripts/tests/done.bats` | `review.md` fixtures | Re-anchor to `review-NNN.md` |
| `web/src/pages/docs.astro` | Command card plus Cytoscape edges `['add.qa','qa-agent','dispatches']`, `['add.qa','add-qa','loads']` | Regenerate via sync |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A judge that cannot invalidate its own evidence | The ability to run a cheap standalone QA pass without entering `add.review` |
| Each round's document records both the findings and their resolutions | The single well-known `review.md` filename (given up once, paid for by both gains above) |
| An entire staleness category removed rather than handled | The AUTO-CORRECTION convenience for manual single-pass reviews |
| One correction contract instead of two | The `/add.build qa` entry point |
| An auditable per-iteration review history | — |
| The highest-numbered `review-NNN.md` as the single delivery receipt for `add.done` | — |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Read-only review leaves trivial fixes unapplied, making the loop slower for small issues | Medium | `@fix-agent` is dispatched from `add.build` in the same iteration; the round trip is one build leg, not one user hand-off |
| `review-NNN.md` rename breaks a consumer nobody enumerated | Medium | `add.done` STEP 4.0, `status.sh` `HAS_REVIEW`, `add.md:106` and its suggestion table, `add-ecosystem`, Gate 7's `.prev` rule and `done.bats` are the known set; grep for `review.md` as an explicit plan item |
| Two writers on `review-NNN.md` (review creates, build annotates) race or clobber | Medium | They never run concurrently: the build's annex is written after the review completes and before the next round opens a new `NNN`. Make append-only annex behaviour and the finalized marker an acceptance check |
| The three-way split re-runs judgement when it should skip, or skips when it should re-run | Medium | The skip predicate is exactly the existing fingerprint comparison; make both directions an acceptance test |
| Absorbing 260 lines pushes `add.review` past 900 | High, accepted | Topic 02's thin-coordinator restructuring lands first for this reason |
| `qa-reachability.smoke.test.js` rewrite is underestimated | High | It asserts exact STEP numbers and table content across `add.qa`, `add.qa-setup` and `add.test`; scope it as its own plan task, not a cleanup step |
| Manual users lose auto-correction and perceive a regression | Medium | The console summary must state that findings are routed rather than applied, and name `/add.build` as the next step |

## Next Steps

Run: `/add-framework--plan absorb add.qa into add.review, make the review read-only, and version its output`
