# Plan: Convergence Consumer Coherence — the siblings 0074 left behind

> **Status:** implemented
> **Type:** script + command + agent boundary
> **Created:** 2026-08-29
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

Plan set 0074 migrated the convergence machinery: `epic.md` gained a schema, three commands were converted to resolve columns by header name, a deterministic gate script replaced prose, and `/add.plan-to-ready` gained an epic loop with gated checkpoints.

Its adversarial round found nine defects, all fixed. **This plan carries the residue** — four places where 0074 changed one consumer and left a sibling on the old rule, or created an ownership question it did not answer. None is a regression 0074 introduced; each is a coherence gap 0074 made visible.

Two of the four needed an owner decision; both were taken on 2026-08-29 and both went to option (a). All four topics are buildable.

## Problem

1. **`status.sh` is the only `epic.md` consumer still matching by string.** The `epic` schema names it a consumer and says *"consumers resolve columns by header name"*. `converge-gates.sh` implements that; `/add.build` block 14.3, `/add.done` 4.1 and `/add.plan` STEP 8.0 were converted. `status.sh:278,283-291` still greps. So on `| SF02 | Beta | pending | done |` — a Notes cell reading `done` — the gate says pending and `EPIC_PROGRESS` says done. Its suite is green because the case was never written there: `status.bats` has zero tests touching a Notes cell or a header row.

2. **Two agents own cross-subfeature consistency, with no boundary between them.** `/add.plan` 10.5 dispatches `@architecture-agent` to *fix in place* across SF plans (schema↔consumer alignment, shared-resource centralization, handoff contracts, fallback/degradation, DI registration). `@consistency-agent`, added by 0074, is *read-only* and judges five dimensions (API contracts, data schema, requirements, design tokens, auth model). They overlap on schema and contracts and diverge everywhere else, and neither file mentions the other.

3. **`/add.plan-to-ready` reads `QA_FEATURE_STATE` and never says how to resolve it.** It correctly forbids hardcoding a value instead of reading the script, but the script returns the RAW manifest state by contract (`true|false|unset|no-manifest`) and the command gives no rule for `unset`/`no-manifest`. `/add.review:640` and `/add.qa-setup:206` both carry that rule (`qa-pipeline` defaults to **disabled**). This is an incomplete instruction, not a contradiction.

4. **A `blocker` from the cross-SF DELTA pass cannot block anything.** `add-cross-sf-consistency` defines `blocker` as *"halts convergence until resolved"*. The DELTA pass runs after the final subfeature's checkpoint has been committed, tagged and pushed. Nothing re-runs the convergence gate afterwards, `GATE_REVIEW` only reads the `| **Overall** |` row, and the findings land in a `review-NNN.md` that is never committed — the loop makes no further commit. The severity is real in the rubric and inert in the loop.

## Proposal

Four topics, independent of one another. T1 and T3 are determinate. T2 and T4 need a decision recorded before their F-blocks can be written.

**T1** migrates `status.sh` to header-name resolution with the same string fallback `converge-gates.sh` uses for pre-schema documents, and writes the two blind-spot tests `status.bats` never had.

**T2** draws the boundary between `/add.plan` 10.5 and `@consistency-agent`, and makes each file name the other.

**T3** completes `/add.plan-to-ready`'s `QA_FEATURE_STATE` instruction with the same default-resolution rule its two sibling commands already carry.

**T4** makes a DELTA `blocker` actually block.

## Scope

### Includes

#### T1 — `status.sh` reads `epic.md` by header name

- **F1** — `framwork/.codeadd/scripts/status.sh`: resolve the `status` and id columns by header name for `EPIC_PROGRESS`, `DONE_SF`/`TOTAL_SF` and `EPIC_CURRENT_SF`. Fall back to today's string rule when no header names its columns, exactly as `converge-gates.sh` does — every pre-schema `epic.md` depends on that path. The output contract (`HAS_EPIC`, `EPIC_PROGRESS`, `EPIC_CURRENT_SF`) does not change; only how the values are derived.

  **`converge-gates.sh` is only a PARTIAL model, and F1 must not assume otherwise.** Its awk reduces the status cell to a boolean (`if (st != "done")`) because a gate needs only done-vs-not-done. `EPIC_CURRENT_SF` needs three states — `status.sh:283-291` picks `in_progress` first, then the first `pending`. F1 must read the header-resolved cell's **literal value**, not a boolean, and reproduce that ordering. Nothing in the cited reference models this half.
- **F2** — `framwork/.codeadd/scripts/tests/status.bats`: the two blind-spot tests the file has never had — a Notes cell reading `done` on a `pending` row, and a subfeature literally named `done`. Both RED first. Plus a header-resolution test with the id column not first, and a legacy no-header regression guard.

#### T2 — cross-SF ownership boundary

- **F3** — `framwork/.codeadd/commands/add.plan.md` 10.5 and `framwork/.codeadd/agents/consistency-agent.md` + `framwork/.codeadd/skills/add-cross-sf-consistency/SKILL.md`: whichever split the decision picks, each artefact must name the other and state what it does NOT own. Two agents silently covering the same ground is how a finding gets fixed by one and re-raised by the other forever.
- **F4** — `framwork/.codeadd/skills/add-ecosystem/SKILL.md`: reflect the boundary in both rows.

#### T3 — complete the `QA_FEATURE_STATE` instruction

- **F5** — `framwork/.codeadd/commands/add.plan-to-ready.md` STEP 5's output check: after reading `QA_FEATURE_STATE` from the script, resolve `unset` / `no-manifest` by the feature default (`qa-pipeline` defaults to **disabled**), wording it as `/add.review:640` and `/add.qa-setup:206` already do. Keep the existing ban on hardcoding a value in place of reading the script — the two rules are compatible and the file should say so.

#### T4 — a DELTA `blocker` actually blocks

- **F6** — `framwork/.codeadd/commands/add.plan-to-ready.md` and `framwork/.codeadd/skills/add-cross-sf-consistency/SKILL.md`: implement whichever option the decision picks, and make the severity table's `blocker` row describe what actually happens.

### Does NOT Include

- Re-litigating anything 0074 decided. The gate script's contract, the `epic` schema's shape, the checkpoint sequence and the five-dimension cap all stand.
- Any change to `converge-gates.sh`. T1 makes `status.sh` agree with it; it does not touch the gate.
- `CLAUDE.md` — `/add-framework--build` STEP 6.3/6.4 now owns it.
- New cross-SF dimensions. The five-dimension cap is a validated decision from 0074 and T2 must not be used to widen it by the back door.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Migrate `status.sh` or leave it | **Migrate** | The schema names it a consumer of header-name resolution. Leaving one consumer on the old rule means two commands disagree about whether an epic is done, and the disagreement is silent |
| Keep the string fallback in `status.sh` | **Yes** | Every pre-schema `epic.md` has no header. `converge-gates.sh` already sets this precedent; diverging would strand old projects |
| `QA_FEATURE_STATE` resolution owner | **The command resolves; the script stays raw** | The defaults registry lives in `cli/src/features.js`. A shell script duplicating it is how the two drift — `qa-preflight.sh` established this and `converge-gates.sh` follows it. `/add.plan-to-ready` is simply missing the sentence its siblings have |
| **T2 — cross-SF boundary** | **Option (a)** — `@consistency-agent` owns detection on the five dimensions; 10.5 keeps the three completeness checks (shared-resource centralization, fallback/degradation, DI registration) and consumes the agent's findings instead of re-deriving schema and contract checks | Splits on a real line: divergence between plans goes to the read-only judge, completeness of one plan stays with the in-place fixer. Decided by the owner, 2026-08-29 |
| **T4 — DELTA blocker** | **Option (a)** — run the DELTA pass BEFORE the final subfeature's checkpoint, AND give the checkpoint sequence a pre-check that refuses to commit while an unresolved `blocker`-severity row stands in that `review-NNN.md`'s `## Fix Routing` | Moving the pass alone blocks nothing; the pre-check is the mechanism. Decided by the owner, 2026-08-29 |

### T2 options

| Option | Shape | Trade-off |
|---|---|---|
| **a** *(recommended)* | `@consistency-agent` owns **detection** on all cross-SF dimensions. 10.5 keeps only what is genuinely outside the five — DI/worker registration and fallback/degradation — and consumes the agent's findings instead of re-deriving schema and contract checks | One detector, one rubric. Costs a rewrite of 10.5's check list |
| **b** | 10.5 stays whole for `/add.plan`'s own runs; `@consistency-agent` serves only `/add.plan-to-ready`. Each names the other as the sibling path | No rewrite. Two rubrics drift apart over time, and a plan reviewed by both gets contradictory findings |
| **c** | Delete 10.5; the agent is the only cross-SF check anywhere | Simplest. Loses DI-registration and fallback checks entirely unless they become a sixth dimension — which the five-dimension cap forbids |

**Where each of 10.5's five checks lands.** The boundary is only decidable once every check has a destination, and the check that decides it is #2:

| 10.5 check | Under (a) | Why |
|---|---|---|
| 1. Schema ↔ Consumer Alignment | to the agent, dimension 2 (data schema) | Same question in different words: do two subfeatures declare the same thing differently |
| 2. **Shared Resource Centralization** (enum/config added ONCE in the earliest SF) | **stays in 10.5** | The check that forces the boundary. Every agent dimension asks *do two declarations disagree?*; this asks *is one declaration duplicated?* — a different question whose answer is a plan edit, not a verdict. Folding it in would need a sixth dimension, which the cap forbids |
| 3. Cross-SF Handoff Contracts | to the agent, dimension 1 (API contracts) | A handoff edge IS a declared contract between two subfeatures |
| 4. Fallback & Degradation | stays in 10.5 | Completeness of one plan against a not-yet-built sibling, not divergence between two |
| 5. Worker/DI Registration | stays in 10.5 | Completeness of one plan; no sibling involved |

Under **(b)** all five stay in 10.5 and the agent duplicates 1 and 3. Under **(c)** checks 2, 4 and 5 have no home at all unless the cap grows — which is why (c) is tempting and wrong.

**Why (a).** It splits on a real line: divergence between plans goes to the read-only judge, completeness of one plan stays with the in-place fixer. Each artefact ends up with a job a maintainer can state in one sentence.

### T4 options

| Option | Shape | Trade-off |
|---|---|---|
| **a** *(recommended)* | Run the DELTA pass **before** the final subfeature's checkpoint, AND give the checkpoint sequence an explicit pre-check: **no unresolved `blocker`-severity row in that `review-NNN.md`'s `## Fix Routing` table**. Findings then land in the version of `review-NNN.md` the checkpoint stages | Smallest change, and it removes the uncommitted-rows problem for free. **The pre-check is the mechanism** — moving the pass alone blocks nothing; something must read the rows |
| **b** | Keep the pass where it is; add a post-delta convergence re-check and, if it passes, a second commit | Honest but adds a commit whose only content is the delta's own findings, and a second gate evaluation whose failure mode is unclear |
| **c** | Demote DELTA findings to non-blocking and say so in the severity table | Zero implementation. Admits the end-of-epic pass is advisory, which weakens the "100% consistency" guarantee the epic loop was asked for |

**Why (a).** The current placement is the bug. A judgment that runs after the thing it judges has been committed, tagged and pushed cannot gate anything, and no amount of severity vocabulary fixes that.

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| One rule for reading `epic.md` across every consumer | A second script to maintain against the schema |
| A cross-SF boundary a maintainer can state in one sentence | A rewrite of 10.5's check list (under option a) |
| A `blocker` severity that means what it says | The delta pass moves earlier and judges one subfeature in flight rather than a fully-settled epic (under option a) |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| `status.sh` migration breaks five commands that parse its output | Medium | F1 changes derivation only, never the emitted keys. F2's regression guards cover the legacy path, and `status.bats`'s existing epic tests must pass unchanged |
| T2 option (a) drops a check while rewriting 10.5 | Medium | F3 must enumerate 10.5's five current checks and state where each one went. A check with no destination is a dropped check |
| Moving the DELTA pass changes what it can see | Medium | Under option (a) it judges the in-flight subfeature too, which is a superset of today's inputs, not a subset |
| The five-dimension cap grows during T2 | Low | Named in Does NOT Include. Any sixth dimension is a separate decision |

## Ecosystem Impact

| Component | Necessary action | F |
|---|---|---|
| `framwork/.codeadd/scripts/status.sh` | Header-name resolution + string fallback | F1 |
| `framwork/.codeadd/scripts/tests/status.bats` | Four new tests, two RED first | F2 |
| `framwork/.codeadd/commands/add.plan.md` | 10.5 boundary | F3 |
| `framwork/.codeadd/agents/consistency-agent.md` | Names its counterpart and its exclusions | F3 |
| `framwork/.codeadd/skills/add-cross-sf-consistency/SKILL.md` | Same, plus the `blocker` severity row | F3, F6 |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Both rows reflect the boundary | F4 |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | `QA_FEATURE_STATE` resolution; DELTA pass placement | F5, F6 |

---

## Red-Green Validation Matrix

**Discipline: RED first.** Every level is written and shown failing before its F-block lands.

### L1 — `status.sh` blind spots (F1, F2)

1. A Notes cell reading `done` on a row whose `status` is `pending` → that subfeature counts as pending in `EPIC_PROGRESS` and is returned by `EPIC_CURRENT_SF`. *RED today: counted done.*
2. A subfeature literally **named** `done`, status `pending` → same. *RED today.*
3. `status` resolved by header name with the id column not first. *RED today: rows are found positionally.*
4. **Legacy guard:** a pre-schema `epic.md` with no header row still produces today's `EPIC_PROGRESS` and `EPIC_CURRENT_SF`. Passes today and must keep passing.
5. The emitted keys are unchanged: `HAS_EPIC`, `EPIC_PROGRESS`, `EPIC_CURRENT_SF`, `LAST_CHECKPOINT`. Byte-compare the full `status.sh` output on a well-formed epic before and after F1.

### L2 — the two readers agree (F1)

1. For each of the four `epic.md` shapes in L1, the two readers agree. They emit different shapes — `status.sh` a count, `converge-gates.sh` an id list — so state the bridge rather than leaving a builder to invent it:
   - `TOTAL_SF` minus the number of comma-separated ids in `EPIC_PENDING` equals `DONE_SF`;
   - when `EPIC_CURRENT_SF` is non-empty it is one of `EPIC_PENDING`'s ids;
   - `GATE_EPIC=ok` if and only if `EPIC_PENDING` is empty and `DONE_SF` equals `TOTAL_SF`.

   *This is the level the whole topic exists for — today they disagree on L1.1 and L1.2.*

### L3 — cross-SF boundary (F3, F4)

1. Every one of 10.5's five current checks has a stated destination — kept, moved to the agent, or explicitly retired. **A check with no destination fails this level.**
2. `add.plan.md` 10.5 names `@consistency-agent` and states what 10.5 does NOT own; the agent and its skill name 10.5 and state the same in reverse.
3. The rubric is still exactly five dimensions. *Regression guard against the cap growing during the rewrite.*
4. `add-ecosystem` describes the boundary in both rows.

### L4 — `QA_FEATURE_STATE` (F5)

1. `unset` and `no-manifest` resolve to disabled, and the file says so in the same words as `/add.review:640` and `/add.qa-setup:206`.
2. The existing ban on hardcoding a value in place of reading the script survives, and the file states that the two rules are compatible.

### L5 — DELTA blocks (F6)

1. A DELTA `blocker` prevents the epic from reporting CONVERGED. *RED today: it cannot, whatever its severity.*
2. Its findings land in a `review-NNN.md` that is committed. *RED today: they stay uncommitted; the loop never commits again.*
3. The severity table's `blocker` row describes what the loop actually does with it.

### L6 — build and injection integrity

1. `node scripts/build.js` clean, and the injection-point total equals the recorded baseline after every file. **Only `add.plan.md` carries markers** among the seven targets — five points, at L58, L60, L200, L496 and L502. The other six carry none. **F3's edit region (10.5, ~L557) is ~357 lines from the nearest marker** (`gitnexus:graph-plan`, L200) — comfortable, unlike 0074's F16, which edited four lines below an anchor candidate. Run the check anyway; the cost is one command.

**RED expectations:** L1.1–L1.3, L2.1, L3.1–L3.2, L5.1–L5.2 all fail today. L1.4, L1.5 and L3.3 pass today and are regression guards. **GREEN = all levels pass after F1–F6.**

---

## Execution Order

`T1 → T3 → T2 → T4`, one commit per topic.

- **T1 first** — it is determinate, self-contained, and closes a live disagreement between two readers of the same file.
- **T3 next** — one sentence, no dependency on anything.
- **T2 and T4 last** — both are blocked on an owner decision and neither can be written until it is recorded here.

T1 and T3 leave the framework working on their own; T2 and T4 must not be started before their decision rows are filled in.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file: files touched with the F-block id, which levels cover it and their pass state, the injection-point total after each file, and any decision altered with the row it departs from.

Gaps to hunt:

1. **A `status.sh` test written to pass rather than bite.** L1.1 and L1.2 must use the exact shapes `converge-gates.bats` uses for the same blind spots, so the two suites are comparable.
2. **A dropped 10.5 check.** L3.1 is the level, and the failure mode is a check that quietly disappears during the rewrite because nobody enumerated it first.
3. **A `blocker` that blocks in prose only.** L5.1 must be demonstrated, not asserted — the current defect is exactly a severity word with no mechanism.
4. **The five-dimension cap grown to six.** L3.3 is a regression guard, and T2 is the topic most likely to breach it.

## References

- Plan set `0074-PLAN--autonomous-epic-convergence-*` and its four evidence files — what was migrated, and the adversarial round that surfaced this residue.
- `framwork/.codeadd/scripts/status.sh:270-300` — the string rule F1 replaces; `:318-325` — `LAST_CHECKPOINT`, unchanged.
- `framwork/.codeadd/scripts/converge-gates.sh` gate 3 — the header-name reader plus string fallback F1 mirrors.
- `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` — the `epic` schema and its "resolve by header name" rule.
- `framwork/.codeadd/commands/add.plan.md` 10.5 — the five checks T2 must account for.
- `framwork/.codeadd/commands/add.review.md:640`, `add.qa-setup.md:206` — the wording F5 copies.

---

## Next Steps

All decisions are recorded. Build in execution order:

```
/add-framework--build 0075-PLAN--convergence-consumer-coherence
```

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-29 | Initial creation. T1 and T3 decided; T2 and T4 carry recorded options awaiting the owner's call |
| 2026-08-29 | Owner took both pending decisions: T2 option (a), T4 option (a). All four topics buildable |
| 2026-08-29 | Review v01: all five of 10.5's checks now have a stated destination — #2 had none under any option, the exact failure the plan's own Reviewer Handoff names as top risk (B1). L6's injection claim corrected (A1). L2.1 gained the count-vs-list bridge (A2). F1 states that converge-gates.sh models only the done/not-done half (A3). T4 option (a) names the pre-check that blocks (A4). status.sh line reference (N1) |
| 2026-08-29 | Implemented. T1 `02ebf05` (status.bats 57/57, three levels RED first, L2 shown DISAGREE before and AGREE after), T3 `a18c3a6`, T2 `ca58f16`, T4 in the following commit. Status -> implemented |
