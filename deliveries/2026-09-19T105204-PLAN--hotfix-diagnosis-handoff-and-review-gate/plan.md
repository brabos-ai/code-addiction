# Plan: Hotfix Diagnosis Handoff and Review Gate — reuse accepted diagnosis and gate close-out on a current hotfix receipt

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-19
> **Delivery:** automatic

---

## Objective

A hotfix that starts from an accepted `/add.diagnose` report will reuse that investigation instead of
repeating history discovery and root-cause analysis. Every hotfix will finish with its own current,
verifiable review receipt, proceed directly to `/add.done`, and never require or recommend
`/add.review`.

**When this build is done:** an accepted diagnosis can be handed to `/add.hotfix` by relative path,
the hotfix checks only post-diagnosis drift, and `/add.done` accepts it only while its internal review
receipt still matches the delivered tree.

## Context

`add.diagnose` already reconstructs history, compares hypotheses, and identifies the causal path, but
its output is optional session context. `add.hotfix` repeats that work and then uses a review model
different from `add.build`. `add.done` skips the feature review gate for hotfixes without positively
checking the hotfix's own review. The design closes those three boundaries as one workflow.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-19T102437-hotfix-diagnosis-handoff-and-review-gate.md` | Handoff shape, drift algorithm, review receipt, close-out routes, alternatives and risks |
| `docs/brainstorming/2026-09-19T102437-hotfix-diagnosis-handoff-and-review-gate-intent.md` | Architectural path, automatic delivery, closed decisions, no open questions |

## Global Constraints

- Persist every diagnosis the user accepts; never persist a rejected diagnosis (intent, Decided).
- Print `/add.hotfix @<relative-report-path>` for a hotfix route; never invoke it automatically (intent, Decided).
- Validate only commits and pending changes after the diagnosis; unrelated drift does not block (intent, Decided).
- Keep the hotfix review receipt in `about.md`; do not create `review-NNN.md` or a QA baseline (intent, Decided).
- Run exactly one hotfix correction wave with `ATTEMPT=1` and `MAX_ATTEMPTS=1` (design, Proposed Solution 3).
- Preserve the one `feature:tdd-pipeline:red-gate` injection point and the existing GitNexus anchors byte-for-byte (design, Scope and Risks).
- Keep `converge-gates.sh` and every feature-only close-out gate unchanged (design, Does NOT Include).
- Keep `security-agent`, `conformance-agent`, and `failure-analysis-agent` registered; remove only their `add.hotfix` dispatch edges (design, Ecosystem Impact).
- Use no new runtime dependency for `hotfix-gates.sh`; it must run through `bash .codeadd/scripts/` on every provider (CLAUDE.md, Pipeline).
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline).

## Problem

1. **The diagnosis handoff is not durable** — a new session cannot prove which root cause, commit, pending changes, findings, or relations the user accepted.
2. **The hotfix repeats accepted investigation** — its normal history and RCA path runs even when `add.diagnose` already completed it.
3. **Hotfix review has a second mechanism** — three always-on judges diverge from the bounded reviewer/fix/re-review contract used by `add.build`.
4. **Close-out has exemption without evidence** — `add.done` knows hotfix does not need `/add.review`, but cannot prove the internal review passed on the current tree.
5. **Routing is branch-blind** — `status.sh` can recommend feature discovery/review commands for an active hotfix.

## Proposal

Build the deterministic state surface first, then the document contracts, then the producer and
consumer commands. Wire close-out only after `about.md` has an exact receipt schema. Finish by updating
the ecosystem map, graph declarations, generated provider outputs, and the root inventory.

The normal no-report hotfix path remains intact. The report-backed path validates the report and
post-diagnosis delta before branch creation, skips only the investigation already completed, then
joins the same implementation, verification, review, receipt, and completion path.

### `hotfix-gates.sh` CLI contract

All modes use exit `0` for a completed passing/read operation, `1` for an operational git/filesystem
failure, and `2` for usage or malformed input. `diagnosis-check` additionally uses `3` only when the
diagnosed commit is unavailable. `diff-wave` uses `3` for an empty correction package.
`review-validate` uses `3` for a deterministic delivery-gate failure.

| Mode | Arguments | Required stdout |
|---|---|---|
| `diagnosis-baseline` | none | `DIAGNOSED_BRANCH=`, `DIAGNOSED_COMMIT=`, then `BASELINE_BEGIN` / tab-separated baseline lines / `BASELINE_END`; a clean tree contains one `clean` line |
| `diagnosis-check` | `<report>` | `DIAGNOSIS=unchanged|delta`, `OVERLAP=none|present`, `DELTA_BEGIN` / `<source>\t<state>\t<path-hex>` / `DELTA_END`, then `DETAIL=` |
| `snapshot-wave` | `<path-hex-file>` | `SNAPSHOT=<absolute temporary path>` and `SNAPSHOT_PATHS=<count>` |
| `diff-wave` | `<snapshot> <package>` | `PACKAGE=<path>` and `CHANGED=<count>`; package contains only changes since the snapshot |
| `review-manifest` | `<hotfix-dir> [--tree <commit>]` | `PATHS_BEGIN` / `<present|deleted>\t<mode>\t<sha256-or-dash>\t<path-hex>` / `PATHS_END` |
| `review-fingerprint` | `<hotfix-dir> [--tree <commit>]` | `REVIEWED_TREE=sha256:<64 lowercase hex>` after proving the receipt manifest equals the recomputed required path set; normalize only `reviewed-tree` and `about.md`'s own manifest hash to `<SELF>` |
| `review-validate` | `<hotfix-dir> [--tree <commit>]` | `HOTFIX_REVIEW=ok|missing|blocked|stale|malformed`, `RECORDED=`, `CURRENT=`, and `DETAIL=` |

Diagnosis baseline states are `staged`, `unstaged`, `deleted`, and `untracked`. A path may have both
staged and unstaged rows; deletion in either layer uses state `deleted`, mode from the tracked side,
and hash `-`. Renames are represented as old-path deletion plus new-path content. Review manifests use
only `present` and `deleted`, with the same rename rule.

For Normal and Resume, the required review path set is recomputed from the branch delivery diff plus
staged, unstaged, deleted, and nonignored untracked paths. For Recovery it is recomputed from the
merge commit's first-parent diff. Add the hotfix `about.md` and `iterations.jsonl` explicitly. Exclude
only `docs/delivered.jsonl`, the hotfix `changelog.md`, `.codeadd/wiki/**`,
`.codeadd/project/decisions.jsonl`, and the script's OS-temp correction snapshot. The manifest must be
set-equal to that recomputed set. A new delivered file outside the receipt, a receipt path removed
from the delivery, or either side of a rename missing is `stale`. The close-out addendum is normalized
inside `about.md` as the design specifies; it is not a path-set exclusion.

## Current State

| Artefact | Direct dependants | Risk | Current contract |
|---|---:|---|---|
| `add.diagnose` | 4 | HIGH | Optional persistence; no repository-state handoff |
| `add.hotfix` | 8 plus two injected fragments | HIGH | 14 contiguous steps; three judges; one corrective pass |
| `add.done` | 10 plus injected fragments | HIGH | Five feature gates; no positive hotfix review gate |
| `status.sh` | 19 | HIGH | Recommendation does not route on hotfix branch type |
| `reviewer-agent` | 9 plus one injected fragment | HIGH | Re-review accepts a commit-range fix diff only |
| `add-subagent-driven-development` | 11 | HIGH | Defines re-review around `review-package.sh BASE..HEAD` |
| `add-ecosystem` | 6 | HIGH | Maps the old diagnose/hotfix agents and emergency flow |
| `review.md` schema reference | 2 | MEDIUM | Diagnose report has no SHA/baseline/handoff |
| `fix.md` schema reference | 1 | MEDIUM | Hotfix Review records three axes, not a receipt |
| TDD hotfix fragment | feature-owned only | MEDIUM | One fixed anchor and stale-prone STEP references |
| `hotfix-gates.sh` | new | LOW | No deterministic owner exists yet |

The graph confirms direct `add.diagnose -> add.hotfix` handoff and an indirect
`add.hotfix -> add-doc-schemas -> add.done` path. The graph cannot see CLI/Bats tests,
`provider-map.json`, root `CLAUDE.md`, or generated-file equality; those are listed explicitly below.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/hotfix-gates.sh` and `framwork/.codeadd/scripts/tests/hotfix-gates.bats`: create the dependency-free deterministic owner for diagnosis baseline/delta, correction-wave snapshot/diff, reviewed manifest/fingerprint, and receipt validation. Implement the exact mode table below and document it in the script header. Cover raw-byte hashing, path hex encoding, dirty baseline comparison, tree-object validation, and self-field normalization from the design.
  - **Produces:** `diagnosis-baseline/check stdout and exit contract`
  - **Produces:** `snapshot-wave/diff-wave package contract`
  - **Produces:** `review-manifest/fingerprint/validate stdout and exit contract`
- **F2** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/review.md`, `framwork/.codeadd/skills/add-doc-schemas/references/fix.md`, `framwork/.codeadd/agents/reviewer-agent.md`, `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md`, and `cli/tests/hotfix-diagnosis-review-contract.test.js`: add the exact diagnose handoff and hotfix receipt shapes; allow re-review to consume the correction-only snapshot package without changing its verdict; keep commit-range packages valid. Do not modify `fix-agent.md`; its existing whole-wave contract already accepts the hotfix inputs.
  - **Consumes:** `snapshot-wave/diff-wave package contract` (F1)
  - **Consumes:** `review-manifest/fingerprint/validate stdout and exit contract` (F1)
  - **Produces:** `diagnose-report Hotfix Handoff contract`
  - **Produces:** `hotfix about.md Review receipt contract`
  - **Produces:** `reviewer-agent snapshot re-review contract`
- **F3** [product] — `framwork/.codeadd/commands/add.diagnose.md` and `cli/tests/hotfix-diagnosis-review-contract.test.js`: add `hotfix-gates.sh` to `uses:`, call `diagnosis-baseline` after investigation, make user agreement the persistence decision for every route, remove the no-action write ban, validate the report, and print `/add.hotfix @<relative-path>` only for an accepted hotfix route. Preserve the read-only code boundary while allowing this deterministic read-only script call and the existing write under `docs/diagnose/`.
  - **Consumes:** `diagnosis-baseline/check stdout and exit contract` (F1)
  - **Consumes:** `diagnose-report Hotfix Handoff contract` (F2)
  - **Produces:** `accepted diagnose report with repository baseline and optional hotfix handoff`
- **F4** [product] — `framwork/.codeadd/commands/add.hotfix.md`, `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md`, `cli/tests/hotfix-review-0073.test.js`, and `cli/tests/hotfix-diagnosis-review-contract.test.js`: add `hotfix-gates.sh` to `uses:`; parse optional `@docs/diagnose/*.md`; validate it and post-diagnosis drift before branch creation; preserve the normal history path; route a valid report past STEPS 4-6 and only the second root-cause confirmation inside STEP 7, while still running STEP 7's TDD RED injection; replace the three judge dispatches with general reviewer plus conditional OWASP, one whole-wave fix, snapshot re-review, and inline fallbacks. Keep 14 contiguous top-level steps and current injection anchors. Run, but do not edit, `docs-knowledge-graph.test.js`, `delivery-index.test.js`, and `knowledge-discovery-question-first.test.js` as guards for the unchanged normal-path questions.
  - **Consumes:** `accepted diagnose report with repository baseline and optional hotfix handoff` (F3)
  - **Consumes:** `hotfix about.md Review receipt contract` (F2)
  - **Consumes:** `reviewer-agent snapshot re-review contract` (F2)
  - **Consumes:** `diagnosis-baseline/check stdout and exit contract` (F1)
  - **Consumes:** `snapshot-wave/diff-wave package contract` (F1)
  - **Consumes:** `review-manifest/fingerprint/validate stdout and exit contract` (F1)
  - **Produces:** `passed current hotfix Review receipt`
  - **Final STEP ownership:** STEP 9 performs general review plus conditional OWASP and citation verification. STEP 10 performs the one correction wave, correction-only re-review, and final build/pinned-test verification. STEP 11 appends `iterations.jsonl`. STEP 12 writes the complete `about.md` with `reviewed-tree: sha256:<PENDING>`, inserts the recomputed Reviewed Paths manifest, calculates the fingerprint, and replaces `<PENDING>`. STEP 13 runs the hotfix schema gate and `review-validate`. STEP 14 reports completion. No hotfix-owned file changes after STEP 12's final replacement.
- **F5** [product] — `framwork/.codeadd/commands/add.done.md`, `framwork/.codeadd/scripts/status.sh`, `framwork/.codeadd/scripts/tests/status.bats`, `cli/tests/product-close-out-parity.test.js`, and `cli/tests/hotfix-diagnosis-review-contract.test.js`: add `hotfix-gates.sh` to `add.done`'s `uses:`; add the hotfix-only receipt gate for Normal and Resume; validate Recovery against its merge commit tree; keep Closed out as an early stop; make hotfix recommendations point to `/add.done`. Preserve the five feature gates, ASK row, first-parent Recovery diff, and `fix/*` behavior. Run broader close-out suites as guards without editing unrelated internal close-out tests.
  - **Consumes:** `passed current hotfix Review receipt` (F4)
  - **Consumes:** `review-manifest/fingerprint/validate stdout and exit contract` (F1)
  - **Produces:** `hotfix close-out gate verdict`
- **F6** [product] — `framwork/.codeadd/skills/add-ecosystem/SKILL.md` and `cli/tests/build-artefact-graph.test.js`: map `diagnose -> hotfix @report -> done`; move the hotfix dispatcher relationship from the three retained judges to reviewer/fix-agent; assert the three command-owned `hotfix-gates.sh` edges from F3-F5; update graph node expectations from the emitted end state. Run `loop-consolidation-0070.test.js`, `dispatch-rules.test.js`, and `build.test.js` as guards without editing them unless an assertion explicitly changed by this plan fails. Run `node scripts/build.js` to regenerate provider outputs and sidecars; do not edit generated files by hand.
  - **Consumes:** `hotfix close-out gate verdict` (F5)
- **F7** [internal] — `CLAUDE.md`: run `node scripts/inventory.js` after F6 so the generated scripts inventory includes `hotfix-gates.sh`. Do not hand-edit the inventory block. Run the full repository validation selected below after the generated inventory lands.

### Does NOT Include (important!)

- A hotfix `review-NNN.md`, QA baseline, or `qa-pipeline` injection; `about.md` remains the only hotfix receipt.
- Changes to feature `/add.review`, its two-round delivery loop, or `converge-gates.sh`.
- Automatic invocation of `/add.hotfix` from `/add.diagnose`; the output is copy-ready text only.
- A conversational fast path with no report file; a persisted contract is required.
- A second hotfix correction wave or model escalation.
- Removal or modification of `security-agent`, `conformance-agent`, or `failure-analysis-agent` outside their old hotfix edges.
- Changes to `fix-agent.md`; the caller supplies its existing required fields.
- Compatibility parsing for pre-handoff diagnose reports; they fail with a rerun instruction.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| When is diagnose persisted? | Every accepted diagnosis, including no-action | Design §1; intent Decided |
| How does hotfix receive it? | `/add.hotfix @docs/diagnose/<file>.md` | Design §1-2 |
| How is freshness checked? | Full SHA plus exact dirty baseline, then only post-diagnosis delta | Design §1-2 |
| What invalidates the diagnosis? | Delta touching a finding's path, symbol, cited hunk, or causal chain | Design §2 |
| What review model applies? | General reviewer, conditional OWASP, one fix wave, scoped re-review | Design §3 |
| What happens without subagents? | Inline review/correction with route disclosed | Design §3 |
| Where is review stored? | Exact `about.md ## Review` receipt | Design §4 |
| How does done prove freshness? | `hotfix-gates.sh` validates status, open severities, manifest, and fingerprint | Design §5-6 |
| What happens on Recovery? | Validate receipt against the merge commit tree | Design §6 |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| No repeated investigation after an accepted diagnosis | Diagnose reports become stricter and always persist on acceptance |
| One bounded review model across build and hotfix | Three specialized axes no longer run on every hotfix |
| Deterministic close-out proof | A new shipped shell script and Bats surface |
| Fast SHA/delta validation | The coordinator still judges semantic relevance of an overlapping hunk |
| Provider portability through inline fallback | Inline review is less independent and must be disclosed |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Dirty state already inspected by diagnose is treated as later drift | Medium | F1 stores per-state mode/content/path baseline; L1 tests original dirty state versus later edits |
| `about.md` self-hash can be bypassed or never converge | High | F1 normalizes only `reviewed-tree`, the about.md row's own content hash, and close-out addendum; L1 tests tampering of every other receipt field |
| Close-out output stales Resume or validates today's main in Recovery | Medium | F5 uses reviewed manifest exclusions and `--tree <merge-commit>`; L4 exercises Normal/Resume/Recovery |
| Shared re-review contracts drift | Medium | F2 updates both reviewer-agent and add-subagent-driven-development; L2 asserts both package forms |
| `status.sh` change regresses 19 consumers | Medium | F5 limits the branch condition to `hotfix` and runs all status Bats tests |
| Existing anchor or injection count moves | High | F4 preserves marker/anchor bytes; L3 and build tests assert the complete injection map |
| Graph declarations retain removed judge edges | Medium | F4 changes `uses:` and F6 verifies exact direct edges after build |
| A partial automatic build leaves commands against an absent script/schema | Medium | F1 and F2 land first; every boundary runs its focused tests before the next consumer lands |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/scripts/hotfix-gates.sh` | product | create | Deterministic owner for both freshness gates and correction snapshot (F1) |
| `framwork/.codeadd/scripts/tests/hotfix-gates.bats` | product | create | Script contract and edge-case coverage (F1) |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | product | modify | Diagnose handoff schema (F2) |
| `framwork/.codeadd/skills/add-doc-schemas/references/fix.md` | product | modify | Hotfix receipt schema (F2) |
| `framwork/.codeadd/agents/reviewer-agent.md` | product | modify | Snapshot package accepted in re-review (F2) |
| `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` | product | modify | Shared re-review contract stays aligned (F2) |
| `cli/tests/hotfix-diagnosis-review-contract.test.js` | product | create | Schema, agent, diagnose, hotfix, and done contract assertions (F2-F5) |
| `framwork/.codeadd/commands/add.diagnose.md` | product | modify | Accepted report producer and copy-ready handoff (F3) |
| `framwork/.codeadd/commands/add.hotfix.md` | product | modify | Fast path, bounded review, current receipt (F4) |
| `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md` | product | modify | Retarget Review/iteration STEP references without moving anchors (F4) |
| `cli/tests/hotfix-review-0073.test.js` | product | modify | New dispatch and receipt expectations; keep 14-step/anchor assertions (F4) |
| `framwork/.codeadd/commands/add.done.md` | product | modify | Hotfix gate across Normal/Resume/Recovery (F5) |
| `framwork/.codeadd/scripts/status.sh` | product | modify | Branch-aware hotfix recommendation (F5) |
| `framwork/.codeadd/scripts/tests/status.bats` | product | modify | Hotfix/feature/fix recommendation matrix (F5) |
| `cli/tests/product-close-out-parity.test.js` | product | modify | Positive hotfix gate without changing five feature gates (F5) |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | product | modify | New flow, dispatch ownership, script map (F6) |
| `cli/tests/build-artefact-graph.test.js` | product | modify | New script node and exact edges/counts (F6) |
| generated provider outputs and sidecars | product | regenerate | Product build distributes changed artefacts and graph (F6) |
| `CLAUDE.md` | internal | regenerate | Generated inventory lists the new shipped script (F7) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Add each new assertion before its F-block implementation and verify it
fails against the current tree. Then drive it GREEN. Existing suites named as guards are expected to
stay GREEN before and after the F-block; they are not claimed as RED evidence.

### L1 — Script contract and byte-stable state (RED → GREEN)

1. `hotfix-gates.bats` proves `diagnosis-baseline` emits full SHA/branch and distinguishes clean,
   staged, unstaged, staged+unstaged, deleted, untracked, symlink, executable, empty, CRLF, rename,
   unusual-name, and pre-existing-dirty states. *RED today: the script does not exist.*
2. `diagnosis-check` accepts identical state, reports unrelated versus overlapping delta paths, and
   rejects missing commits or malformed/duplicate handoff fields with documented exit codes.
3. Snapshot/diff-wave emits only correction-wave changes without requiring commits.
4. Review fingerprint is stable under path order, normalizes only `reviewed-tree`, the about.md row's
   own content hash, and the close-out addendum, changes on any other `about.md` edit, and validates
   both working tree and `--tree` commit.
   The manifest is set-equal to the recomputed required path set, including both sides of a rename and
   explicit deleted entries; an omitted, extra, or state-mismatched path is stale.

### L2 — Schema and shared review contracts (RED → GREEN)

1. Diagnose-report requires the exact scalar order, findings shape, confirmed relations, and working
   baseline; accepted non-hotfix routes remain valid without `## Hotfix Handoff`.
2. Hotfix Review requires exact receipt scalars, Reviewed Paths, Findings, and the passed/blocked
   truth table.
3. Reviewer-agent accepts commit-range and snapshot re-review packages; its verdict fields do not
   change. add-subagent-driven-development names both forms.
4. Fix-agent remains unchanged and receives one whole wave with `ATTEMPT=1`, `MAX_ATTEMPTS=1`.

### L3 — Command handoff and hotfix review (RED → GREEN)

1. Accepted diagnose routes `hotfix`, `feature`, `extend`, and `no-action` persist; rejected diagnosis
   does not. Only hotfix prints `/add.hotfix @docs/diagnose/...`.
2. Report-backed hotfix validation happens before branch creation, skips STEPS 4-6 and only the
   second root-cause confirmation inside STEP 7. It still runs STEP 7's injected TDD RED gate plus
   implementation, build verification, review, logging, receipt validation, and completion. Old
   reports and relevant drift block; unrelated drift passes.
3. Normal hotfix still runs the existing index/history/GRAPH/RCA path.
4. Hotfix dispatches reviewer-agent plus conditional OWASP, then at most one fix-agent wave and one
   snapshot re-review. The three retained judges have no direct hotfix edge.
5. Exactly 14 top-level steps remain. The TDD point count stays one. The GitNexus anchor remains
   `- [ ] On branch hotfix/*` followed by `### 8.1 Consult Knowledge Base` at position `after`.

### L4 — Close-out and routing acceptance

1. `add.done` Normal and Resume accept only a passed current hotfix receipt; missing, blocked, open
   blocker/major, malformed, and stale fingerprints stop before any close-out write.
2. Recovery validates the merge commit tree; Closed out keeps its existing early stop.
3. Feature branches still read exactly the five `converge-gates.sh` gates and keep QA promotion.
4. `status.sh` recommends `/add.done` on hotfix, preserves feature recommendations, and preserves
   `fix/*` behavior.

### L5 — Build, graph, and distribution

1. End-state edges: `add.diagnose`, `add.hotfix`, and `add.done` run `hotfix-gates.sh`; `add.hotfix`
   dispatches reviewer-agent and fix-agent, and no longer dispatches the three retained judges.
2. New graph script count is 18 and total node count is 228; declaration count remains 131 unless the
   build output proves another existing declaring artefact changed.
3. Injection points remain 46, all feature/plugin anchors round-trip, and every built provider copy is
   marker-free.
4. `node scripts/build.js` passes with graph warnings visible and no new warning. `node
   scripts/inventory.js` updates only the generated inventory entry for the new script.
5. `npm test` and `npm run test:scripts` pass.

**RED expectations against the current tree:** the new L1 tests have no script; the new L2 contract
assertions lack both document contracts and snapshot re-review; the new L3 assertions find optional
diagnose persistence and three judges; the new L4 assertions find no positive hotfix gate and wrong
routing; the new L5 graph assertions lack the script node and new edges. Existing injection,
question-first, delivery-index, dispatch, build, and close-out suites are guards and stay GREEN.

**GREEN = all levels pass after F1-F7.**

---

## Execution Order

F1 [product] -> F2 [product] -> F3 [product] -> F4 [product] -> F5 [product] -> F6 [product] -> F7 [internal]

- **F1 first** because every new command edge would dangle until the script exists.
- **F2 second** because both command writers need stable handoff/receipt/re-review contracts.
- **F3 before F4** because the producer must exist before the hotfix can consume it.
- **F4 before F5** because close-out can gate only a receipt the hotfix actually produces.
- **F6 follows behavior** so ecosystem and graph expectations describe the final relationships.
- **F7 is last** because inventory is generated from the final product tree.

Working boundaries: F1 is standalone and tested. F2 leaves existing commands unchanged. F3 adds a
producer without a consumer path yet but remains valid. F4 joins producer and hotfix. F5 closes the
delivery gate. F6/F7 synchronize descriptions and generated metadata.

Per F-block validation: run the focused tests named by its validation level before committing. Run
`node scripts/build.js` at F6 with `ADD_GRAPH_WARNINGS=1`. Run the full suites at F7.

## Reviewer Handoff

The build evidence must name each F-block's changed files, validation levels, RED result, GREEN result,
and any design departure.

Gaps the reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A diagnose report whose accepted dirty state is mistaken for post-diagnosis drift.
3. A report-backed hotfix that skips implementation/review rather than only duplicated investigation.
4. A receipt hash that ignores `status`, findings, dispositions, build result, or arbitrary about.md text.
5. A Resume invalidated by close-out-owned files, or Recovery validated against current main.
6. A hidden second correction dispatch or severity downgrade.
7. A stale judge edge, moved injection anchor, changed injection count, or generated file edited by hand.

## References

- Design: `docs/brainstorming/2026-09-19T102437-hotfix-diagnosis-handoff-and-review-gate.md`
- Intent: `docs/brainstorming/2026-09-19T102437-hotfix-diagnosis-handoff-and-review-gate-intent.md`
- Prior delivery: `2026-09-17T153506-PLAN--cut-review-and-build-loop-cost` — one review and one correction wave
- Prior delivery: `2026-09-11T014333-PLAN--product-close-out-parity` — current close-out route model

---

## Next Steps

/add-framework--build hotfix-diagnosis-handoff-and-review-gate

## Plan Changelog

| Date | Change |
|---|---|
| 2026-09-19 | Initial creation |
| 2026-09-19 | Applied the reviewer’s `fix-then-ok` findings: preserved the STEP 7 RED gate, fixed the script CLI/state contracts, made receipt path equality explicit, separated F-block interfaces and graph ownership, fixed final STEP ownership, and separated changed tests from guard suites. |
| 2026-09-19 | Resolved the build-time self-hash blocker: normalize both autorreferential values, and no other receipt content. |
| 2026-09-19 | Implemented F1–F7. Commits f08c6fb..6874882. |
