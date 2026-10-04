# PR Review: #96 — Deterministic fragment slots and stable STEP IDs

> **Verdict:** REQUEST CHANGES
> **Risk:** HIGH — injection in commands and agents, installed-file lifecycle, and workflow references
> **PR:** https://github.com/brabos-ai/code-addiction/pull/96
> **Reviewed head:** `742b36f22802d3517aa8df69c6140fa75716f1c7`
> **Reviewed base:** `16ca19c26e67031f8cf4d4ed6da9f3a50cd30529` (`main`)
> **Re-reviewed head:** `1771da71023480661f2ad53329e9d3a419a37c12` (see Re-review below)
> **Latest re-reviewed head:** `3f8c68291d0bc7aadcb8778de5a25f6b96cd6b6e` (see Second re-review below)
> **Current checked head:** `ccc10ada57b63d94b685824ae18fe3ad1b4c8a63` (see Third re-review below)
> **Latest checked head:** `a8a666b7ec29329db95c6d0f8103634c555377c1` (see Fourth re-review below)
> **Plan:** `docs/plans/2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids.md`

## Summary

The PR adds explicit source slots, a generated v2 sidecar, an installed baseline and desired-state rendering. The byte-equality test for `add-plan` with tdd and qa enabled in reverse orders is present. Those pieces address the immediate 0007B failure. CI checks reported success at review time, including both CLI jobs, scripts, board and CodeQL.

It does **not** deliver the whole approved plan. Its own PR description excludes the other product STEP IDs, retains both temporary v1 paths, and says the adversarial delivery review was not dispatched. The build ledger records explicit F6, F8 and F9 rulings for these omissions. Passing CI does not validate the omitted plan requirements. The PR body's `npm test` checkbox is stale: `.github/workflows/ci.yml:55–59` runs the full CLI suite and package smoke test, and both CLI jobs passed. GitNexus has no index for this repository; the evidence below comes from the PR diff, code, test files and the plan/ledger. The worktree was clean at review time. Local focused tests could not run because `cli/` lacks a locally available `vitest` executable; use the CI results as the only executed suite evidence.

## Findings and fix routing

### R1 — [P1] Product STEP-ID migration stops after `add-plan` optional steps

**Evidence:** `framwork/.codeadd/commands/add-plan.md:87–109` still lists numeric STEPs 1–7 and 10–13; `framwork/.codeadd/commands/add-build.md:75` and other product commands retain numeric labels. `framwork/.codeadd/fragments/qa-pipeline/add-plan.md:11–13` keeps `### 9.0 QA-Spec` and refers to `STEP 8`. `workbench/skills/add-framework-injection/SKILL.md:46–50` describes owner-qualified IDs, but the shipped prompts do not follow that rule. The PR body explicitly excludes other command headings. Plan F6, L1.2 and the reviewed design require **all distributed product command STEPs and active references** to move, without renumbering workbench commands.

**Impact:** Optional prompts still depend on positional references; the new internal authoring contract disagrees with the shipped prompts. A contributor cannot know which reference form is authoritative.

**Fix:** Finish F6 across product command overviews, headings, substeps, fragment bodies and active cross-file references in commands, skills and agents. Use `STEP <owner>.<subject>` with one ID for each overview/body/reference; keep injection section names separate. Do not mechanically slug free-text arrows into unreadable IDs. Enumerate each command's IDs and choose short subjects by meaning. Leave `workbench/` numeric STEPs intact.

**Proof:** Add checks for unique IDs per assembled command and no active numeric STEP references in distributed product artefacts, including all enabled combinations. Run provider builds and the existing product suite; test that the QA step and the core workflow steps are referenced by their new IDs.

### R2 — [P1] QA setup still probes a STEP label that the PR removed

**Evidence:** `framwork/.codeadd/commands/add-qa-setup.md:233` says to probe the installed plan command for `STEP 9.0` after enabling qa-pipeline, and `:322` calls `add-plan` STEP 9.0 the sole writer of screen-catalog content. The installed `add-plan` step list now says `STEP qa-pipeline.qa-spec` (`framwork/.codeadd/fragments/qa-pipeline/add-plan.md:5–7`); its detailed heading remains `### 9.0`, not `STEP 9.0`. The ecosystem map and `add--qa-spec` also name the old step (`framwork/.codeadd/skills/add--ecosystem/SKILL.md:123,267`, `framwork/.codeadd/skills/add--qa-spec/SKILL.md:21,57`).

**Impact:** The QA setup instruction can misdiagnose a successful injection as missing. Related product docs teach the old identity. The PR's updated smoke tests do not prove this command's probe and handoff with the new ID.

**Fix:** As part of R1, change the QA setup probe and writer reference to `STEP qa-pipeline.qa-spec` and update the active ecosystem/qa-spec references. Keep the existing absence-vs-warn distinction from `add-plan.md:590`: an enabled but invalid QA fragment is not the same as a disabled feature.

**Proof:** Install an instance with qa-pipeline enabled, run the probe specified by `add-qa-setup`, and assert that it resolves the installed QA step under its new ID. Exercise the disabled and warned/unavailable cases separately.

### R3 — [P2] Temporary v1 builder and CLI paths remain in the proposed final delivery

**Evidence:** `scripts/build.js:387–463,484–538` retains old point extraction and `version: 1` emission. `cli/src/features.js:27–29,192–199,239–247,283–296` and `cli/src/plugins.js:25–27,169–191,237–255,297–310` still branch on `isV2` and run the old incremental path for v1. `cli/src/injection-core.js:214–254,261–276,419–472` still exports and uses old injection/removal helpers. The PR body and ledger F8/F9 say these branches were intentionally kept for synthetic fixtures. Plan F8/F9 and the approved decision explicitly retire v1 in this release: update overwrites old prompts and supplies the new v2 sidecar; no old installed format must remain supported.

**Impact:** Two production composition paths stay live. The v1 path still has the order-dependent behavior 0007B exists to remove, if a v1 sidecar is supplied. This is transitional backward compatibility, **not** a designed v3/v4 schema evolution mechanism.

**Fix:** Complete F8/F9. Move synthetic fixtures and tests to v2. Remove the v1 production dispatch, old builder emitter and obsolete helpers after proving no current caller requires them. If an old-format install is updated, verify that the release overwrite plus baseline capture reaches v2 without reading old prompt bodies. Do not create a persistent schema-version ladder for this work.

**Proof:** Static test/grep shows no reachable production v1 branch or `isV2` dispatch; a fresh install and an update from a prior release both emit/render v2 and have byte-identical results for the same toggles. Reverse-order byte equality remains green.

### R4 — [P2] Uninstall treats generated baseline copies as user files and leaves them behind

**Evidence:** `cli/src/injection-core.js:547–593` writes `.codeadd/baselines/...` and records only `manifest.baselineHashes`; it does not add those paths to `manifest.files`. `cli/src/uninstaller.js:140–187` derives `userFiles` from `manifest.files`, warns they will be kept, and deletes only listed files. Thus a normal v2 installation leaves `.codeadd/baselines/` in place after uninstall and may keep `.codeadd/` from being removed. `cli/src/installer.js:23` preserves the baseline directory during overwrite but does not declare it as installer-owned for uninstall.

**Impact:** Uninstall does not clean up framework-generated prompt copies; a later install sees leftovers. This is an installed-file lifecycle regression introduced by the new baseline store.

**Fix:** Give baseline copies one consistent ownership rule across install, update, validate and uninstall. Either include generated baselines in the manifest's owned-file inventory, or teach uninstall to remove exactly `.codeadd/baselines/` generated files (without broadening deletion to user files). Preserve the update overwrite/prune behavior and avoid treating them as release ZIP inputs.

**Proof:** Install a v2 fixture with slots, assert baselines are created, uninstall, and assert both baseline files and their empty directory are gone while a separate user-authored file under an ADD directory remains untouched. Cover project and global scopes.

### R5 — [P2] Required final validation and adversarial review were skipped

**Evidence:** The PR body states that the adversarial review was not dispatched. Its `npm test` checkbox is stale: the two successful CLI CI jobs ran `npm test` and `npm run test:package` (`.github/workflows/ci.yml:55–59`). The ledger ends with F8/F9 rulings rather than completed validation entries; its F6 ruling explicitly accepts that L1.2 still finds numeric STEPs (`...--ledger.md:21–25`). CI proves existing tests pass, but no completed evidence for the **plan-specific full matrix or final review** appears in the PR or ledger. Plan Execution Order, L4 and Reviewer Handoff require those before publish.

**Impact:** The PR was opened before the agreed acceptance boundary, so passing checks alone do not establish that every plan F-block was completed.

**Fix:** After R1–R4, run the plan's full validation matrix, product build, workbench build and final adversarial review. Record commands, results and any rulings in the ledger. Keep the PR open until this evidence and fixes are pushed; do not merge as part of review.

**Proof:** Updated ledger has completed F8/F9, the full matrix result, reviewer findings and their dispositions, and CI passes on the final head. Re-review the changed PR head before requesting merge.

## Fix order

| Order | Findings | Why in this order |
|---|---|---|
| 1 | R1 + R2 | Migrate the STEP identity and its QA consumers together. |
| 2 | R3 | Remove transitional v1 only after all product sources and tests speak v2. |
| 3 | R4 | Close the generated-file lifecycle before final install/update/uninstall acceptance. |
| 4 | R5 | Re-run the complete matrix and review on the final code, then update PR #96. |

## Scope and verification notes

- Reviewed the **PR's committed head** and base, not a speculative local change. `git status --short --branch` was clean in the PR worktree when reviewed.
- The current PR proves the immediate reversed-order `add-plan` case in `cli/tests/injection-exclusivity.integration.test.js:489–507`; do not remove that test while fixing broader coverage.
- The new fallback's sentence references `STEP add-plan.consolidate`, which exists in `add-plan.md:105,584`. The QA self-check at `:590` distinguishes an unavailable enabled member from a disabled one; preserve both when fixing R1/R2.
- No source code or PR review comment was changed by this review document. It maps follow-up edits and verification only.

## Re-review at `1771da71023480661f2ad53329e9d3a419a37c12`

The original evidence and verdict above are retained as the snapshot reviewed at `742b36f`. This section checks the five original findings against the **new PR head**, not against an uncommitted local edit. The worktree is clean and the PR head matches local `HEAD`. A single subsequent fix commit, `1771da71023480661f2ad53329e9d3a419a37c12`, covers the changed code. All seven reported CI/CodeQL checks for this SHA passed, including CLI Node 20/22, scripts and board. The PR body still describes the previous head and says some work is excluded; refresh it after the actual remaining fixes.

| ID | Result at new SHA | Correction evidence (`file:line` at `1771da7`) | Still needed |
|---|---|---|---|
| **R1** | **PARTIAL** | `framwork/.codeadd/commands/add-plan.md:87–109` now uses semantic IDs for its main STEPs; `cli/tests/build-injection-points.test.js:377–394` checks that product files no longer contain the literal pattern `STEP <digit>`. | Numeric **substeps and headings** remain: `add-plan.md:94–98` still lists `7.0–7.4`, `add-brainstorm.md:213` has `### 2.1`, and `fragments/qa-pipeline/add-review.md:73` has `### 8.1`. The test only rejects `/\bSTEP \d/`, so these pass undetected. The approved full STEP-ID migration includes active workflow substeps: migrate their headings, overview references and prose together, or obtain an explicit scope revision before declaring F6 complete. Add checks for **unique and resolvable** semantic IDs in assembled command/fragment combinations, not merely the absence of `STEP 1`. |
| **R2** | **PARTIAL** | `framwork/.codeadd/commands/add-qa-setup.md:233` now probes `STEP qa-pipeline.qa-spec`; `:322`, `framwork/.codeadd/skills/add--ecosystem/SKILL.md:123` and `framwork/.codeadd/skills/add--qa-spec/SKILL.md:21,57` use the new identity. The injected overview and body use it in `framwork/.codeadd/fragments/qa-pipeline/add-plan.md:6,11`. | `add-qa-setup.md:234` still treats **every** missing section as a “silent no-op”. An enabled member with missing/invalid fragment **warns** and remains requested; an absent sidecar is a different failure. Split those cases in the instruction and test the enabled-valid, disabled, warned-invalid and no-sidecar paths. |
| **R3** | **PARTIAL** | `cli/src/features.js:188–224` and `cli/src/plugins.js:165–207` now call `reconcileSlots` directly without `isV2` branching. | `scripts/build.js:387–463,484–545` still has the v1 extractor/emitter, including `{ version: 1, points }` at `:543`; `:493–495` rejects legacy marker-only sources rather than supporting them. `cli/src/features.js:7–10`, `cli/src/plugins.js:9–17` and `cli/src/injection-core.js:214–276,419–472` retain old imports/helpers. Remove dead production code and migrate synthetic fixtures to v2 as F8/F9 required; keep graph-compatible v2 `points` only where they are needed for existing graph edges. Confirm the builder cannot emit a v1 injection sidecar for an empty/no-slot source. |
| **R4** | **FIXED (coverage follow-up)** | `cli/src/uninstaller.js:147–175` classifies `.codeadd/baselines/` as managed and removes those files while keeping other user files; `cli/tests/uninstaller.test.js:232–249` tests baseline deletion, empty-directory cleanup and user-file preservation. | No global-scope baseline test was added. The same removal loop is shared with global scope (`uninstaller.js:87–89,140–175`); add a global case if the full plan's scope-specific matrix is required. The original orphaned-baseline behavior is corrected. |
| **R5** | **OPEN** | CI passed on `1771da7` and validates the currently written tests. | The ignored build ledger still ends at `F8: Ruling` and `F9: Ruling` (`...--ledger.md:24–25`); there is no `F8: complete`, `F9: complete`, `GRAPH:` inventory or `REVIEW: complete`. The PR body still says the final adversarial review was not dispatched. Run and record the plan-specific matrix, complete/repair F8 and F9 with evidence, and perform the agreed once-only delivery audit over the final diff before claiming the delivery finished. The review in this file does not automatically replace that build/ledger procedure. |

**Current verdict: REQUEST CHANGES.** R4's original defect is fixed. R1, R2 and R3 still need bounded follow-up, and R5 still lacks delivery evidence. A green CI run is real evidence for the tests it executes, but cannot prove the omitted STEP-subsection and builder-cleanup requirements. Keep these IDs stable when recording the next fix SHA; append a fresh verification section rather than rewriting this snapshot.

## Second re-review at `3f8c68291d0bc7aadcb8778de5a25f6b96cd6b6e`

The previous two reviews remain as timestamped snapshots of their respective commits. This pass checks the original R1–R5 after fix commit `3f8c68291d0bc7aadcb8778de5a25f6b96cd6b6e`. The PR's remote head and clean local `HEAD` matched. Seven CI/CodeQL checks passed at this SHA, including both full CLI jobs, scripts and board. No local Vitest run was available in this worktree; CI is the executed-test evidence.

| ID | Status at `3f8c682` | What changed and where (`file:line`) | What is still required |
|---|---|---|---|
| **R1** | **PARTIAL — headings fixed, references incomplete** | The prior `7.0–7.4` overview items are now `STEP add-plan.cross-sf` through `STEP add-plan.frontend` (`framwork/.codeadd/commands/add-plan.md:93–98`). A search for numeric Markdown substep headings in product commands and fragments returned none. `cli/tests/build-injection-points.test.js:407–450` now rejects numeric headings and checks that main overview IDs have headings and do not repeat. | Active references with bare old numbers remain. The `add-plan` overview still says `preview (9.0.1)` at `add-plan.md:105`, while the heading is `### STEP add-plan.preview` at `:594`; `:260` says `by 7.4`, and `:697,717,719` still direct execution to `9.5` after that heading was renamed. Replace live references with their IDs and add a check for dangling/bare numbered cross-references. The new test checks only the first 2,500 characters after `STEPS IN ORDER` and listed IDs, not every reference in the assembled prompt. |
| **R2** | **FIXED in the instruction; runtime proof limited** | `framwork/.codeadd/commands/add-qa-setup.md:232–238` now distinguishes section present, feature disabled/declined, enabled v2 member warning, and no-sidecar install. `cli/tests/qa-pipeline-umbrella.test.js:189–200` checks those four instructions, and the existing injection smoke test checks that `STEP qa-pipeline.qa-spec` lands. | The QA branch test inspects instruction text rather than executing the QA setup flow through all four states. The original false “silent no-op” instruction is gone; an end-to-end probe test remains desirable, but does not undo the textual correction. |
| **R3** | **PARTIAL — v1 sidecar emission fixed, obsolete path remains** | `scripts/build.js:511–530` now always writes `{version: 2, slots, points}`; `:493–495` rejects legacy marker-only source. `cli/tests/build-injection-points.test.js:232–249` proves an empty build emits v2 and legacy input is refused. Feature/plugin enable paths directly reconcile v2. | The old `extractInjectionPoints` path still exists at `scripts/build.js:387–463`; the old point-based injection/removal and agent functions still exist at `cli/src/injection-core.js:214–276,419–472`; unused imports remain in `cli/src/features.js:7–10` and `cli/src/plugins.js:9–17`. Check actual callers, then remove dead legacy code and its synthetic v1 tests or document an explicit, user-approved reason to retain it. The current sidecar's v2 `points` may remain if used by the artefact graph; that is not v1 compatibility. |
| **R4** | **FIXED, including both scopes** | `cli/src/uninstaller.js:147–175` removes framework baselines while retaining user files. `cli/tests/uninstaller.test.js:232–249` covers project scope; `:251–268` adds the same proof for global scope. |
| **R5** | **OPEN — delivery not closed under the plan** | CI is green on `3f8c682`. The build ledger still ends at `F8: Ruling` and `F9: Ruling` (`docs/plans/2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids--ledger.md:24–25`); there are no `F8: complete`, `F9: complete`, `GRAPH:` or `REVIEW: complete` entries. | Finish the plan-specific matrix and once-only delivery audit, update the ledger and PR body, and re-check the exact final head. `cli/tests/board-feature.test.js:133–138` still calls tdd/qa order-dependent and deliberately keeps their order fixed: remove this obsolete workaround and test the broader reversed-order scenario promised by F8. The PR body still claims other STEP IDs, v1 cleanup and adversarial review are out of scope and leaves full CLI tests unchecked even though CI passed; reconcile it with the actual finished delivery. |

**Latest verdict: REQUEST CHANGES.** The functional v1 emission defect and both uninstall scopes are corrected. R1 still has live stale references, R3 still carries dead legacy helpers, and R5 has not met the published plan's completion gate. R2's original wrong instruction is fixed. A later verifier should pin the next fix commit SHA, check each remaining row there, and append evidence without overwriting this section.

## Third re-review at `ccc10ada57b63d94b685824ae18fe3ad1b4c8a63`

PR #96 and clean local `HEAD` both resolve to `ccc10ada57b63d94b685824ae18fe3ad1b4c8a63`. This follow-up checks the original R1–R5 after commit `ccc10ad`. All seven CI/CodeQL checks for this head finished successfully (CLI on Node 20/22, scripts, board and CodeQL). The PR body now lists completed code changes and correctly says the once-only audit is still open.

| ID | Status at `ccc10ad` | Verified correction (`file:line` at this SHA) | Remaining action |
|---|---|---|---|
| **R1** | **FIXED for previously identified stale references** | `framwork/.codeadd/commands/add-plan.md:105` now refers to `STEP add-plan.preview`, and a source search found no remaining `by 7.4`, `to 9.5`, numeric STEP headings or numeric substep headings in product commands/fragments. `cli/tests/build-injection-points.test.js:223–244` checks a class of bare-number citations; `:246–289` rejects numeric headings and resolves/uniquifies listed overview IDs. | The citation regex covers named patterns and the overview checker scans 2,500 chars after `STEPS IN ORDER`; it is not a complete parser for every free-form reference. No unresolved instance from R1 was found at this head. Keep this limitation in the final audit rather than claiming exhaustive semantic-reference proof. |
| **R2** | **FIXED (unchanged since previous pass)** | `framwork/.codeadd/commands/add-qa-setup.md:232–238` distinguishes enabled, disabled, warned and no-sidecar outcomes; the new commit did not revert it. | Optional end-to-end QA-setup probe coverage remains a test improvement, not the original broken instruction. |
| **R3** | **FUNCTIONAL FIXED; legacy bookkeeping cleanup remains** | `cli/src/injection-core.js` no longer exports old point-based command/agent injector functions; searches in `cli/src/` found no `loadInjectionPoints`, `applyInjectionToContent`, `removeInjectionFromContent`, `injectAgentFragments`, `removeAgentFragments` or `isV2`. `scripts/build.js:432–451` emits only `{version: 2, slots, points}`, and `cli/tests/board-feature.test.js:133–142` now checks reverse order including board. CI is green. | `scripts/build.js:388–390,405–422,2314–2320` still retains an `INJECTION_POINTS` accumulator and an `INJECTION_MODE === 'v2' ? … : INJECTION_POINTS` graph branch. The old-source arm throws at `:414–415`, so this is **dead transitional code**, not actual runtime v1 compatibility. Remove the unreachable branch and obsolete accumulator, or record an explicit reason to keep them. Retain v2 `points` needed by the artefact graph. |
| **R4** | **FIXED (unchanged since previous pass)** | `cli/src/uninstaller.js:147–175` removes generated baselines; `cli/tests/uninstaller.test.js:232–268` covers project and global scope while preserving user content. |
| **R5** | **OPEN — no verified completion at current SHA** | CI passed on `ccc10ad`, `cli/tests/board-feature.test.js:133–142` now tests the full reverse order, and the PR body no longer misstates R1/R3 as outside scope. | The ignored ledger adds `F8: complete` and `F9: complete` but its F8 line cites earlier `3f8c682` and an unnamed follow-up (`...--ledger.md:27–28`), not this head. Its `GRAPH:` line says the graph check **was not re-run** (`:29`). Its `REVIEW:` line is not the required `REVIEW: complete (<n> findings, <m> applied, <k> rejected)` and expressly treats this external PR review as the delivery audit (`:30`); the build's once-only `3 + 1` auditor pass was not run. Record final graph/validation evidence against `ccc10ad` (or the later final SHA), run the required delivery audit once, decide its findings, and then write the proper ledger entry. Do not infer its verdict from this PR review or green CI. |

**Verdict at `ccc10ad`: REQUEST CHANGES for R5.** The original functional issues R1, R2 and R4 are corrected; R3 no longer runs a v1 sidecar or CLI injection path, but retains a dead build branch worth removing. The binding publish condition is the missing final audit and SHA-matched ledger evidence. Preserve this re-review snapshot; a later fix should record its own commit SHA and append a new result.

## Fourth re-review at `a8a666b7ec29329db95c6d0f8103634c555377c1`

Scope: only changes since `ccc10ada57b63d94b685824ae18fe3ad1b4c8a63` and the remaining R3/R5. Local worktree and PR remote head match `a8a666b7ec29329db95c6d0f8103634c555377c1`; there is no tracked worktree diff. All seven PR checks finished successfully for this head.

| ID | Status | Verified evidence at `a8a666b` | Remaining action |
|---|---|---|---|
| **R3** | **FIXED** | Commit `a8a666b` removes the `INJECTION_POINTS` accumulator, the unused `getInjectionPoints` export and the `INJECTION_MODE === 'v2' ? … : INJECTION_POINTS` graph branch. `scripts/build.js:387–389,426–445` emits v2 from `INJECTION_SLOTS`; `:2309–2313` builds graph edges directly from slot members. `cli/tests/build-injection-points.test.js:41–52` checks zero slots/points without an old accumulator. CI is green. The parser still uses `injectionMode` to **reject** bare legacy markers (`scripts/build.js:404–416`), not to render a v1 sidecar. | No unresolved R3 fix. Preserve the v2 `points` payload for graph consumers. |
| **R5** | **OPEN — auditor pass unavailable, not completed** | The ledger now records F8/F9 completion and a fresh graph build on this SHA (`...--ledger.md:27–30`); the PR body records the same head's local Vitest and successful CI checks. `...--ledger.md:31` records that the once-only `3 + 1` subagent audit was attempted twice and **the provider refused both dispatches**. It explicitly states that no findings were returned. | When the provider works, run the full required audit once over this final diff, judge findings, record graph lines for each affected artefact as required by build STEP 7.2, and then append `REVIEW: complete (<n> findings, <m> applied, <k> rejected)` per `add-build-ledger`. A refused dispatch is not a completed review. If the audit leads to code changes, validate and verify CI again at that later head. Do not mark delivery approved solely because CI passed. |

**Verdict at `a8a666b`: REQUEST CHANGES on R5 only.** The previously identified code fixes are now in place; the outstanding item is a required review pass whose provider was unavailable. This document is an external PR review, not the build STEP 7 `3 + 1` audit, and cannot supply its missing results.
