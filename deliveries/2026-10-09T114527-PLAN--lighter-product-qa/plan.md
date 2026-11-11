# Plan: Lighter product QA — each QA check paid once, no dead end, no manual server start

> **Status:** implemented
> **Layers:** product
> **Type:** workflow
> **Created:** 2026-10-09
> **Delivery:** confirm
> **Ticket:** 0035B

---

## Objective

With `qa-pipeline` on, a feature goes from plan to merge paying for each QA check once, and the user always knows the next QA step — no dead end at close-out, no server to start by hand, no setup run that re-runs the whole pipeline.

**When this build is done:** `/add-done` no longer refuses a merge after the user chose to close without
a QA judgement; `/add-build` names `/add-review` as the next step only when `qa-pipeline` is on, commits
the e2e specs it authored, and dispatches ONE `@e2e-agent` per delivery (the last SF on an epic) whose
failures go through a normal build-only fix round; `/add-plan` skips the QA spec when no screen exists
and warns once when QA setup is absent or stale; `/add-review` boots the app instead of blocking when
`baseUrl` is down; `/add-qa-setup` no longer runs a nested review and build loop; and the dangling
step references and maintainer notes are cleaned up.

**Ticket done when:** A written review exists that lists, per QA part, what it does, its cost and what is confusing, with a concrete simplification proposal for each, ready to become a plan.

## Context

Ticket 0035B asked for a review of the product QA flow in the spirit of 0034B (lighter add-build). The
review exists in the design document below; it found repeated dispatches, one user-facing dead end in
`/add-done`, and a setup that re-runs the whole pipeline. This plan turns its nine cuts into F-blocks.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-09T113824-lighter-product-qa.md` | The per-part review (what it does, cost, what confuses), cuts C1–C9 with gain and loss, the C5 contract, rejected alternatives, risks |
| `docs/brainstorming/2026-10-09T113824-lighter-product-qa-intent.md` | `path: architectural`, the closed decisions C1–C9, both judges stay, one F-block and commit per cut; `## Open` reads `None` |

Two scope extensions were confirmed at this plan's STEP 4 (P1-A, P2-A) — see Validated Decisions.

## Global Constraints

- `## Materializes` in `commands/add-qa-setup.md` is not edited — "changing anything below moves `shape` and every installed project will need `/add-qa-setup`" (`add-qa-setup.md`, `## Materializes`)
- `MAX_ATTEMPTS = 3` for `@fix-agent`, unchanged (intent, C5)
- Both review judges, `@ux-agent` and `@qa-agent`, stay (intent, "Both review judges stay")
- `framwork/.codeadd/scripts/qa-preflight.cjs`, `qa-evidence.cjs` and `converge-gates.cjs` are not edited — "Diagnosis only — callers decide block vs work" (`qa-preflight.cjs:314`)
- The build-only ledger line keeps its shape `T0N: fix round N/3 (build-only — build green, tests green; commits FIX_BASE..HEAD)` (`add-build.md:1224`)
- `cli/tests/lighter-add-build.test.js` stays green unchanged — L1.15 (no `/add-review` in `add-build.md`'s next-command outside `Blocker suggestion`) and L1.16 (the qa-pipeline build fragment does not say re-running add-review is optional)
- Every slot follows `add-framework-injection`: each marker pair in exactly one slot, `fallbacks/empty.md` for every new slot, reversed enable order gives identical installed bytes
- `cli/tests/qa-reachability.smoke.test.js` stays green unchanged — it pins `E2E Spec Authoring`, `QA-Routed Correction`, `DISPATCH by ROUTE`, `STOP with the remedy`, `do NOT fall back to severity grouping` in the qa-pipeline build fragment (`:118-119`, `:438-450`)
- A removed or renamed test name needs a `Test-Removed:` commit trailer (AGENTS.md, `scripts/test-loss-guard.cjs`)
- Never write a raw `.codeadd/` path in an artefact; use `{{cmd:}}` / `{{skill:}}` — scripts excepted (AGENTS.md, Pipeline)
- `node scripts/build.js` exits 0 with no new warning and the graph gate passes (AGENTS.md, Pipeline)
- Tests run through `node scripts/run-tests.js` in the container, never `npx vitest` in `cli/` (project memory)

## Problem

The full per-part review lives in the design's "Problem / Opportunity" table. In short:

1. **Dead end at close-out** — after a review then a fix build, `REVIEW_SOURCE=build`, `BASELINE=none`;
   the user answers "close without a QA judgement", and `qa-evidence.cjs validate … none` fails against
   the existing `run-001` (`add-done.md:293-297`, `:512`). Nothing tells the user what to do.
2. **No next QA step** — 0034B removed `/add-review` from the build's next step, which is right without
   QA and wrong with it: QA judgement lives only in `/add-review`.
3. **Specs not committed** — the e2e specs are written after the task commits, so 0034B's
   `BUILD_REVIEW_COVERS` is always `no` with QA on.
4. **Repeated dispatches** — one `@e2e-agent` per surface per SF; a QA-spec dispatch on features with no screen.
5. **Manual steps** — `/add-review` blocks when `baseUrl` is down although the managed lifecycle can boot;
   setup runs a nested `/add-review` plus up to 3 `/add-build` on the catalog it just created; the build
   leaves a `_tests/run-NNN/` with no report, which is a second route into problem 1.
6. **Confusing prompts** — `STEP add-build.order` does not exist (qa-pipeline and tdd-pipeline build
   fragments), qa-fix sits in STEP load-docs, maintainer notes sit inside the review fragment, stale STEP
   numbers in `add--setup-contract` and first-run-only wording in `add--qa-migration`.

## Proposal

Nine cuts, each local to one artefact group, one F-block and one commit each — the 0034B shape. Each cut
removes a repeat or a dead end and keeps the check itself: the e2e specs still run in the build, the two
judges still judge in the review, setup still proves its prerequisites through the preflight.

## Scope

### Includes

- **F1** [product] — C1, close-out without a QA judgement skips promotion.
  - `framwork/.codeadd/commands/add-done.md`, STEP `add-done.validate` branch 5 (`GATE_QA_BASELINE=skipped`):
    whenever the branch proceeds — feature disabled, or enabled and the user answered "yes" — set
    `QA_PROMOTION_STATUS=skipped` and mark promotion as skipped for this run. The question on the enabled
    path states that working QA evidence will not be promoted to `_tests/final/` (design, risk "Skipping
    promotion hides QA work"). The "no" answer still prints `/add-review ${FEATURE_ID}` and stops.
  - STEP `add-done.promote-qa`: a skip line at the top, next to the non-feature skip — when branch 5
    marked promotion skipped, do not call `validate` or `promote`; continue to STEP `add-done.document`.
    The heading `## STEP add-done.promote-qa` stays byte-identical (`product-close-out-parity.test.js`
    and `mcp-migration.test.js` slice on it).
  - Must NOT lose: branches 6 and 7, and the double `validate` on the `GATE_QA_BASELINE=ok` path (design, Does NOT Include).
  - `cli/tests/lighter-product-qa.test.js` (new), describe `F1`: L1.1–L1.3.
- **F2** [product] — C2, the build names `/add-review` as next step only with `qa-pipeline` on.
  - `framwork/.codeadd/commands/add-build.md`, STEP `add-build.next-command`: a new slot
    `qa-pipeline.next-command` (fallback `fallbacks/empty.md`) holding one empty `qa-pipeline:next-command`
    member pair. No `/add-review` text enters `add-build.md` itself.
  - `framwork/.codeadd/fragments/qa-pipeline/add-build.md`: new section `next-command` — after `## Loop End`
    and before `/add-done`, name `{{cmd:add-review}}` as the step that judges QA for this feature or
    subfeature. On `automatic` the build still never runs `/add-review` itself (`add-build.md`, next-command).
    Add `- command: /add-review` to its `uses:` block if the graph gate requires it.
  - Regenerate `cli/tests/fixtures/slot-membership-map-v2.json` and update the injection-count pins
    (`build-artefact-graph.test.js`, `delivery-index.test.js`) to the new total.
  - `cli/tests/lighter-product-qa.test.js`, describe `F2`: L1.4–L1.6.
  - **Produces:** slot `qa-pipeline.next-command` in `add-build.md`
- **F3** [product] — C4 and C8, the plan-side QA step.
  - `framwork/.codeadd/fragments/qa-pipeline/add-plan.md`, section `qa-spec`:
    - C8: first, extract `SETUP_QA` / `SETUP_QA_STALE` / `SETUP_QA_HINT` from the `node .codeadd/scripts/status.cjs`
      output STEP `add-plan.recent` already ran (`add-plan.md:118`) — `add-plan` parses none of the three today,
      so the fragment names the extraction itself (`status.cjs:817-836` emits them; `SETUP_QA` is
      `present` | `stale` | `absent`). When `SETUP_QA` is `absent` or `stale`, or `SETUP_QA_STALE:yes`,
      print one warning naming `{{cmd:add-qa-setup}}` and continue — never a stop.
    - C4: "When to run" becomes: when qa-pipeline is enabled AND the resolved `design.md` (the same
      `feature-design` Location rule the dispatch prompt already uses) exists and declares at least one
      screen. Otherwise state "no screen declared — QA spec skipped" and write neither `plan-qa-spec.md`
      nor `screens.json`. The warning in C8 runs on both branches.
    - The `step-list` section and `STEP qa-pipeline.qa-spec` id stay unchanged (`qa-pipeline-umbrella.test.js:191-193`;
      `add-framework-injection`, STEP IDs).
  - `cli/tests/lighter-product-qa.test.js`, describe `F3`: L1.7–L1.9.
- **F4** [product] — C5, one `@e2e-agent` per delivery.
  - `framwork/.codeadd/fragments/qa-pipeline/add-build.md`, section `e2e-dispatch` (contract: design § "C5"):
    - ONE `@e2e-agent` for the delivery, after every area is implemented and validated, before `## Final Review`.
      Normal feature: on this build. Epic: only on the build of the last subfeature — the same condition the
      DELTA pass uses — covering every SF's `## QA/E2E Specification` rows. Earlier SFs: state "e2e deferred
      to the last subfeature" and dispatch nothing.
    - No `## QA/E2E Specification` rows anywhere in scope → dispatch nothing and say so.
    - Its inputs: every surface of the delivery, `screens.json`, the built component paths, `docs/qa/config.json`.
      It reports pass/fail per surface.
    - Captures from the build's run go to a scratch directory that is removed after the run; the build never
      calls `qa-evidence.cjs next` and leaves no `_tests/run-NNN/` behind.
    - Failing assertions become rows of a normal wave in STEP `add-build.correct` (one `@fix-agent`,
      `MAX_ATTEMPTS = 3`). The round's gate is build green, tests green and the coordinator re-running the
      specs green — no re-review, no second `@e2e-agent`.
    - A ledger line written after the dispatch returns: `e2e: complete (N surfaces, P passing)`; a resumed
      build that finds a line starting with the prefix `e2e: complete` does not re-dispatch. The resume
      check matches the prefix only, so F5 adding the commit range does not break it.
    - The heading keeps the literal `E2E Spec Authoring` (pinned by `qa-reachability.smoke.test.js:118`);
      only its "per in-scope surface" tail changes.
  - `framwork/.codeadd/commands/add-build.md`, Correction Dispatch (`:596`): the build-only sources become
    build errors, test-agent `BLOCKED` entries, and failing e2e spec assertions (qa-pipeline); its gate adds
    "and the specs re-run green when the round carries e2e rows". The ledger line shape is unchanged
    (Global Constraints). Agent Roster row for `@e2e-agent`: inputs read "every surface of the delivery".
    STEP `add-build.log`'s ledger table gains the `e2e: complete` row.
  - `framwork/.codeadd/agents/e2e-agent.md`: inputs and description say one or more surfaces, one spec per
    surface; step 5 says a build-time run writes no `_tests/run-NNN/`. Must NOT lose: the review's
    "specs absent" dispatch in `fragments/qa-pipeline/add-review.md` still works with one surface.
  - `framwork/.codeadd/skills/add--review-discipline/SKILL.md`: not edited — its `:99` sentence names
    build-only rounds without listing their sources, so it stays true (guard L1.13).
  - `cli/tests/lighter-product-qa.test.js`, describe `F4`: L1.10–L1.14.
  - **Produces:** ledger line `e2e: complete (N surfaces, P passing)`
- **F5** [product] — C3, the e2e specs enter a build commit.
  - `framwork/.codeadd/fragments/qa-pipeline/add-build.md`, section `e2e-dispatch`: once the e2e dispatch
    returns, the authored spec files and `screens.json` are committed as ONE extra batch through STEP
    `add-build.commit` (the only place the build commits), following that step's DEVELOPMENT/CORRECTION
    rules: no `Task-Id` trailer, a `Feature-Id: ${FEATURE_ID}` trailer, gated by the build green and the
    specs green instead of an area validator (the area validators already returned before this slot,
    `add-build.md:1016`). `BASE` is recorded before the dispatch. The `e2e: complete` line carries that commit range:
    `e2e: complete (N surfaces, P passing; commits BASE..HEAD)`. Fix rounds for e2e rows commit as any round does.
  - `framwork/.codeadd/commands/add-build.md`, STEP `add-build.log`'s ledger table: the row from F4 gains the range.
  - `framwork/.codeadd/commands/add-build.md`, STEP `add-build.commit`: one sentence naming the e2e batch as
    the one commit outside an area dispatch, with its gate.
  - `cli/tests/lighter-product-qa.test.js`, describe `F5`: L1.15–L1.16a.
  - **Consumes:** ledger line `e2e: complete (N surfaces, P passing)` (F4)
- **F6** [product] — C6, review boots the app instead of blocking.
  - `framwork/.codeadd/fragments/qa-pipeline/add-review.md`, section `preflight`, Phase A row 3
    (`QA_BASEURL_REACHABLE`): when not `ok`, boot through the `qa-project` Managed App Lifecycle (`bootHint`,
    wait-ready) and re-probe; block — surfacing `bootHint` — only when boot fails. An app the preflight
    booted stays up through capture and the judges, and is torn down at the end of the QA steps
    (`judge-tail`) — only if the preflight booted it. Capture's own lifecycle then finds it up and does not boot again.
  - `qa-preflight.cjs` is not edited (Global Constraints).
  - `cli/tests/lighter-product-qa.test.js`, describe `F6`: L1.17–L1.18.
- **F7** [product] — C7, setup drops the smoke review and its correction loop.
  - `framwork/.codeadd/commands/add-qa-setup.md`: delete STEP `add-qa-setup.smoke` with
    `smoke-test` and `correction-loop-max`, their overview line (`:57`) and their two rows in the gates
    table (`:82-83`). Setup's proof becomes: `qa-preflight.cjs a` green, plus `qa-preflight.cjs b
    <FEATURE_DIR>` green when a feature with `screens.json` exists. The hand-off says the first real
    `{{cmd:add-review}}` proves QA end to end. Frontmatter `description` and the intro paragraph drop the
    smoke test. The `uses:` block drops entries only the smoke used, as the graph gate reports.
    The `:351` sentence drops "or smoke testing".
  - Must NOT lose: `## Materializes` byte-identical (Global Constraints); the receipt and validate steps.
  - `cli/tests/qa-pipeline-umbrella.test.js`: remove "no-screens deferral still writes and validates the
    receipt" (`:238-246`); rename "materializes a dedicated QA ignore block before migration and smoke
    testing" and drop its `smoke` assertion. The commit carries one `Test-Removed:` trailer per removed or renamed name.
  - Sweep: grep `framwork/.codeadd/` and `cli/tests/` for `add-qa-setup.smoke`, `correction-loop-max`,
    "smoke test" and "smoke testing" tied to QA setup (`add-help`, `add--qa`, `add--ecosystem`, the graph
    and reachability tests); fix each hit in this commit and list them in the ledger.
  - `cli/tests/lighter-product-qa.test.js`, describe `F7`: L1.19–L1.21.
- **F8** [product] — C9, cleanup.
  - `framwork/.codeadd/fragments/qa-pipeline/add-build.md:34` and `framwork/.codeadd/fragments/tdd-pipeline/add-build.md:113`, `:137`:
    `STEP add-build.order` → `STEP add-build.dependency-order` (P2-A).
  - `framwork/.codeadd/commands/add-build.md`: move the slot `qa-pipeline.qa-fix` from STEP
    `add-build.load-docs` (`:293-296`) into STEP `add-build.correct`, right after STEP `add-build.consume`.
    Section `qa-fix` in the fragment: drop the now-redundant cross-references and state the route → agent
    map explicitly (code rows → `@fix-agent` per Correction Dispatch; `design-spec` → `@ux-agent` in FIX
    MODE; `data-seed` / `env-boot` / capability-invalid / uncited `@ux-agent` → presented, not dispatched).
  - `framwork/.codeadd/fragments/qa-pipeline/add-review.md`: maintainer-only notes become HTML comments
    (stripped at build) — the five-sections note already is one; the asymmetry and "there must not be one"
    rationale lines that address framework maintainers rather than the running agent move into comments.
    Agent-facing instructions stay.
  - `framwork/.codeadd/skills/add--setup-contract/SKILL.md`: `STEP 1.5` / `STEP 12` → `STEP add-qa-setup.classify-receipt` / `STEP add-qa-setup.validate`.
  - `framwork/.codeadd/skills/add--qa-migration/SKILL.md:37`: wording matches the command's fingerprint-gated
    scan on every run instead of "first run only" (behaviour unchanged — design, Does NOT Include).
  - Regenerate `slot-membership-map-v2.json` for the moved slot.
  - `cli/tests/qa-pipeline-umbrella.test.js:120` ("add-build carries qa-fix anchored on the separator above
    the wiki step") pins the old anchor; rewrite it for the new anchor inside STEP `add-build.correct`. Its
    name changes, so the commit carries a `Test-Removed:` trailer for the old name.
  - The `qa-fix` rewrite keeps verbatim the strings `qa-reachability.smoke.test.js:438-450` pins
    (`DISPATCH by ROUTE`, `STOP with the remedy`, `do NOT fall back to severity grouping`, no `Legacy fallback`)
    and the heading `QA-Routed Correction` (`:119`).
  - `cli/tests/lighter-product-qa.test.js`, describe `F8`: L1.22–L1.26.

### Does NOT Include (important!)

- Merging the two review judges (intent).
- The duplicated receipt check in `status.cjs` / `qa-preflight.cjs` and the double `validate` in `add-done` (design).
- Renaming QA terms; `add--qa-migration` behaviour; the playwright plugin (design).
- Any script under `framwork/.codeadd/scripts/` (Global Constraints).
- Merging `judge-head` and `judge-tail` (the fragment's own note says only in a delivery already moving those pins for that reason).
- `README.md` / `web/` — `/add-framework--sync` regenerates them before a release.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| C1–C9, both judges stay, one F-block per cut | As in the intent | Intent `## Decided` |
| P1 — C1 also with the feature disabled | Yes: branch 5 skips promotion whenever it proceeds | Same `BASELINE=none` against a left-over run is the same dead end. User, 2026-10-09 |
| P2 — fix `STEP add-build.order` in tdd-pipeline too | Yes, in F8 | Same string, same defect. User, 2026-10-09 |
| C2's form | A new `qa-pipeline.next-command` slot, text in the fragment | Keeps L1.15 of 0034B green and keeps feature text out of the base command |
| e2e fix rounds | Classified build-only, gate adds the spec re-run | No Compliance Gate change; `add--review-discipline:99` stays true; design § C5 |
| Build-time captures | Scratch directory, removed; no `run-NNN` | Design § C5 "Evidence"; also closes a second route into the C1 dead end |
| C6 boot timing | Preflight boots, app stays up through the judges, torn down iff preflight booted it | Live-driving judges need the app up; one boot per review |
| C7 proof | Preflight `a`, plus `b` when a feature with `screens.json` exists | `b` needs a feature directory |
| Order C5 before C3 | F4 before F5 | F5 adds the commit to the dispatch F4 rewrites |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| One `@e2e-agent` over many surfaces on a large epic loses track | Medium | F4: the plan's `## QA/E2E Specification` is its checklist and it reports pass/fail per surface (L1.11) |
| Skipping promotion hides QA work the user wanted kept | Low | F1: the question says evidence will not be promoted (L1.2) |
| Auto-boot starts a process the user did not expect | Low | F6: teardown only of what the preflight booted (L1.18) |
| A broken setup reaches the first review | Medium | F7: preflight `a`/`b` at setup; preflight still runs at every review (L1.20) |
| Moving or adding a slot changes installed bytes in a way that depends on enable order | Medium | F2, F8: L2.1–L2.3 |
| `## Materializes` moves by accident and every project goes stale | Low | L1.21 guard on the `shape` value |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/commands/add-done.md` | product | modify | F1 |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F2 (slot), F4, F5 (ledger table, Correction Dispatch, roster), F8 (slot move) |
| `framwork/.codeadd/fragments/qa-pipeline/add-build.md` | product | modify | F2, F4, F5, F8 |
| `framwork/.codeadd/fragments/qa-pipeline/add-plan.md` | product | modify | F3 |
| `framwork/.codeadd/fragments/qa-pipeline/add-review.md` | product | modify | F6, F8 |
| `framwork/.codeadd/fragments/tdd-pipeline/add-build.md` | product | modify | F8 |
| `framwork/.codeadd/agents/e2e-agent.md` | product | modify | F4 |
| `framwork/.codeadd/commands/add-qa-setup.md` | product | modify | F7 |
| `framwork/.codeadd/skills/add--setup-contract/SKILL.md` | product | modify | F8 |
| `framwork/.codeadd/skills/add--qa-migration/SKILL.md` | product | modify | F8 |
| `cli/tests/lighter-product-qa.test.js` | product | create | F1–F8 |
| `cli/tests/qa-pipeline-umbrella.test.js` | product | modify (remove/rename) | F7 (smoke tests), F8 (qa-fix anchor test) |
| `cli/tests/fixtures/slot-membership-map-v2.json` | product | regenerate | F2, F8 |
| `cli/tests/build-artefact-graph.test.js`, `cli/tests/delivery-index.test.js` | product | modify pins if the totals move | F2 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Before F1, write every level in the working tree and run it once against the
current tree; record RED/guard per item as a ledger line. Each F-block's commit carries only its own
describe block, so every commit is green.

**Expected injection end-state:** qa-pipeline injects into `add-build` the sections `qa-fix` (now inside
STEP `add-build.correct`), `e2e-dispatch` and `next-command` — three, one more than today; into `add-plan`
`step-list` and `qa-spec`; into `add-review` `step-list`, `preflight`, `evidence`, `judge-head`,
`judge-tail`. tdd-pipeline, board and gitnexus injections are unchanged. The build asserts this map.

### L1 — Text contract, `cli/tests/lighter-product-qa.test.js` (RED → GREEN)

F1:
1. `add-done.md` branch 5 sets `QA_PROMOTION_STATUS=skipped` on both proceed paths. *RED.*
2. The branch-5 question says working QA evidence will not be promoted. *RED.*
3. STEP `add-done.promote-qa` carries the branch-5 skip before step 1; its heading is unchanged. *RED for the skip.*

F2:
4. `add-build.md` STEP `add-build.next-command` holds the `qa-pipeline.next-command` slot with `fallbacks/empty.md`. *RED.*
5. The fragment section `next-command` names `{{cmd:add-review}}` and does not say "optional". *RED.*
6. `lighter-add-build.test.js` L1.15 and L1.16 still pass. *Guard.*

F3:
7. The `qa-spec` section's run condition requires a `design.md` that declares a screen. *RED: "ALWAYS when qa-pipeline is enabled".*
8. The section reads `SETUP_QA` and names `{{cmd:add-qa-setup}}` in a non-stopping warning. *RED.*
9. `STEP qa-pipeline.qa-spec` id and the `step-list` section unchanged. *Guard.*

F4:
10. The `e2e-dispatch` section dispatches ONE `@e2e-agent` per delivery and no longer says "one per surface". *RED: line 72.*
11. It names the epic last-subfeature condition, per-surface pass/fail, and the no-spec-rows skip. *RED.*
12. `add-build.md` Correction Dispatch lists failing e2e assertions as a build-only source and adds the spec re-run to the gate; `MAX_ATTEMPTS = 3` present. *RED for the first half.*
13. `add--review-discipline` still says `MODE: re-review` is counted per fix round carrying a reviewer-sourced row. *Guard.*
14. `e2e-agent.md` accepts one or more surfaces and says a build-time run leaves no `_tests/run-NNN/`; the fragment says the build never calls `qa-evidence.cjs next`. *RED.*

F5:
15. The `e2e-dispatch` section commits specs and `screens.json` through STEP `add-build.commit`. *RED.*
16. `add-build.md`'s ledger table carries `e2e: complete (N surfaces, P passing; commits`. *RED.*
16a. The e2e batch commit names no `Task-Id`, carries `Feature-Id`, and its gate is build green + specs green; STEP `add-build.commit` names it. *RED.*

F6:
17. Preflight row 3 boots through the Managed App Lifecycle and blocks only when boot fails. *RED: "block — surface the config `bootHint`".*
18. The fragment tears down at the end of the QA steps only an app the preflight booted. *RED.*

F7:
19. `add-qa-setup.md` has no `STEP add-qa-setup.smoke`, no `correction-loop-max`, and no dispatch of `/add-build`. *RED.*
20. Setup's proof names `qa-preflight.cjs a` and `b`; the hand-off names the first `/add-review`. *RED.*
21. The `## Materializes` `shape:` value equals `sha256:2326519b34fdd1fe`. *Guard.*

F8:
22. No `STEP add-build.order` in `framwork/.codeadd/`. *RED: three hits.*
23. The `qa-pipeline.qa-fix` slot sits inside STEP `add-build.correct`, not STEP `add-build.load-docs`. *RED.*
24. The `qa-fix` section states the route → agent map. *RED.*
25. `add--setup-contract` names no `STEP 1.5` / `STEP 12`. *RED.*
26. `add--qa-migration` no longer says migration detection is first-run only. *RED.*
27. The rewritten umbrella test asserts the `qa-fix` anchor sits inside STEP `add-build.correct`; `qa-reachability.smoke.test.js` passes unchanged. *RED for the first half; guard for the second.*

### L2 — Injection (combination)

1. All toggle states of `qa-pipeline` × `tdd-pipeline` give each expected section exactly once in `add-build`, `add-plan`, `add-review`; none with the feature off.
2. Reversed enable order gives identical installed bytes for `add-build`.
3. Enable all then disable all returns `add-build` to its pristine baseline bytes.

### L3 — Build and suite

1. `node scripts/build.js` exits 0, no new warning, graph gate passes.
2. `node scripts/run-tests.js` (container) green, including the existing suites named in Global Constraints.
3. `scripts/test-loss-guard.cjs` passes with the F7 trailers.

### L4 — Behavioural acceptance (read-through, recorded in the ledger)

1. Walk the C1 scenario on the installed `add-done`: review run-001 → fix build → `REVIEW_SOURCE=build`, `BASELINE=none` → "yes" → no `validate` call, merge allowed.
2. Walk an epic with two SFs on the installed `add-build` with qa-pipeline on: SF01 dispatches no `@e2e-agent`; SF02 dispatches one covering both.

**RED expectations against the current tree:** all L1 items not marked guard fail today.
**GREEN = all levels pass after F1–F8.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8, all [product].

- **F1, F2 first** — ordered by user impact: the dead end and the missing next step.
- **F4 before F5** — F5 adds the commit and range to the dispatch F4 rewrites (Consumes).
- **F8 last** — it moves the `qa-fix` slot inside STEP `add-build.correct` and edits the fragment F2/F4/F5 already touched; F2 and F8 both regenerate the slot fixture, F8 last.
- Every boundary leaves the repo green: each commit carries its own describe block and passes L3.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the L1 items covering it and their
pass state, and any departure from the design with the section it departs from.

Gaps a reviewer must hunt:

1. An F-block marked done whose L1 items were never RED.
2. `## Materializes` changed by a nearby edit in F7 (L1.21).
3. An `@e2e-agent` dispatch left inside a per-surface or per-SF loop anywhere in the qa-pipeline build fragment.
4. A new `/add-review` string landing in `add-build.md` itself instead of the fragment (L1.6).

## References

- Design set: `docs/brainstorming/2026-10-09T113824-lighter-product-qa.md`, `…-intent.md`
- Prior art: `2026-10-08T211926-PLAN--lighter-add-build` (0034B) — the one-cut-one-commit shape, the build-only round, `BUILD_REVIEW_COVERS`
- `2026-09-19T122048-PLAN--optional-review-build-final-review` — `REVIEW_SOURCE`, `GATE_QA_BASELINE skipped`

---

## Next Steps

/add-framework--build docs/plans/2026-10-09T114527-PLAN--lighter-product-qa.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-09 | Initial creation |
| 2026-10-09 | Review fix-then-ok: F3 names the `SETUP_QA` extraction (add-plan parses none today); F4 resume matches the `e2e: complete` prefix and keeps the pinned heading; F5 states the e2e batch commit mode, trailers and gate (L1.16a); F7 adds a smoke-reference sweep; F8 rewrites the qa-fix anchor test and keeps the reachability-pinned strings (L1.27); Global Constraints pin `qa-reachability.smoke.test.js`. N1 not applied — `Ticket done when` is copied verbatim by rule |
| 2026-10-09 | Implemented on feat/lighter-product-qa — commits ccbd123..fae639b; changelog docs/changelog/2026-10-09T122131-update-lighter-product-qa.md |
