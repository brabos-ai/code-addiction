# Plan: T4 — Epic loop and cross-SF judge

> **Status:** implemented
> **Type:** command + agent + skill
> **Created:** 2026-08-27
> **Author:** Maicon + Claude (ADD Strategy)
> **Umbrella:** `0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Checkpoint:** ends at **C4** · **Depends on C3**

---

## Context

T1 made convergence provable, T2 made the epic readable, T3 made each plan reviewable. T4 is the thing that was actually asked for: point `/add.plan-to-ready` at an epic and have it deliver every subfeature, unattended, committing between each one.

Plan 0070 L117 and brainstorm 005 L109/L126 deferred this on purpose: *"v1 targets one feature or one subfeature per invocation."* T4 reverses that deferral, and the three earlier topics are the reason it is now safe to.

## Problem (T4 scope only)

1. The loop runs one subfeature per invocation. An epic means re-invoking by hand, once per subfeature.
2. The command's safety brake is that re-invocation is a human act. Running a whole epic removes that human, and nothing replaces it.
3. `/add.build` never commits, so a finished subfeature sits in a dirty tree with no restore point. T2 dropped the fake tag rather than fix it, precisely because only this topic can make it true.
3b. **Nothing in the loop writes `epic.md`.** The row-flip lives in `/add.build` block 14.3 and in `/add.done`, and the loop calls neither — it dispatches rosters. So progress is invisible to `status.sh` and to the next invocation.
4. The coordinator's Decision Log is working memory. It will not survive several subfeatures times three iterations each.
5. If the run dies — crash, interrupt, or a handoff to a different model on a different engine — position has to be worked out from artefacts scattered across the tree. `iterations.jsonl` is written once per iteration, at the end, so a crash mid-iteration leaves no trace of it.
6. Nothing checks consistency **between** subfeatures. `${CROSS_SF_CONTEXT}` injects sibling context into prompts at plan time and never verifies the result.

## Scope

### Includes

- **F23** — `framwork/.codeadd/commands/add.plan-to-ready.md` frontmatter and args: accept an epic target with no `SFxx`. `argument-hint` updated. With `SFxx` given, behaviour is unchanged — the single-subfeature path stays exactly as it is.
- **F24** — same file, STEP 1: on an epic target, resolve the subfeature list, their order and their dependencies from `epic.md` through the T2 schema. **Done-ness is read from `epic.md`'s status column, and F27 is what makes that column true.** The loop dispatches the build *roster* directly and never runs `/add.build`, so `add.build`'s block 14.3 row-flip never fires here; `/add.done` is not called either. Without F27 writing the row, `epic.md` would never change and every re-invocation would restart from SF01. `status.sh:274-293` derives `EPIC_PROGRESS` and `EPIC_CURRENT_SF` from that same column, so writing it is also what keeps `status.sh` truthful mid-epic.
- **F25** — same file: the outer loop. For each pending subfeature in order, run the existing STEP 3–8 legs scoped to it. The inner loop's three exit states and its no-progress rule are unchanged — F25 wraps them, it does not rewrite them. Two things it **must** restate, because leaving them implicit is how a wrapper quietly becomes a rewrite:

  - **STEP 9 fires once, at epic end.** Per-subfeature outcomes are read from STEP 8 internally and never printed as their own report. The three-state vocabulary is unchanged; what changes is that the report now covers an epic.
  - **The `CAP IS 3 PER INVOCATION` invariant is superseded, and the command text must say so.** It becomes *3 per subfeature, reset at each subfeature boundary*. Today invocation and subfeature happen to coincide, which is why the old wording worked; under the outer loop they do not. Leaving the old sentence in place would contradict F26 on the face of the file.
- **F26** — same file: budget and halt. **3 iterations per subfeature** — the same number as today's per-invocation cap, now reset at each subfeature boundary — plus a global backstop of **`3 × N_SF` iterations** (`N_SF` = total subfeatures in `epic.md`), **counted in iterations and never in legs**. F30 makes a leg finer-grained than an iteration, so a backstop measured in legs would fire inside the first subfeature and never mean what it says.

  **Halt on the first subfeature that exits non-CONVERGED.** When both conditions could fire, **the per-subfeature check is evaluated first** and names the subfeature; the global backstop only reports when nothing else stopped the run. Skipping ahead is not implemented; see Does NOT Include.
- **F27** — same file: on a subfeature reaching CONVERGED, **flip its `epic.md` row to done, then stage, commit, tag and push — in that order**, so the status flip and the work land in the same object.

  - **The row flip is the coordinator's write.** Same ownership the command already claims for `tasks.md` and for the review resolution annex. It closes the gap F24 names.
  - **The commit is gated.** A subfeature that did not converge produces no row flip and no commit. The absence of a commit is itself the signal.
  - **Staging names three targets, not one.** `add-commit`'s Staging Rules (`add-commit/SKILL.md:62-73`) exclude all of `docs/features/*` and then re-include **one** path, `${FEATURE_DIR}`. Neither reading of that rule works here as-is:
    - Re-including only the subfeature directory would leave `epic.md` out — it lives at `${FEATURE_DIR}/epic.md`, a **sibling** of `subfeatures/`, not inside it (`status.sh:270`). The row flip would never reach the commit, breaking F27's own claim and L2.4b. `review-NNN.md` and `_tests/run-NNN/` sit at the feature root too.
    - Re-including the whole `${FEATURE_DIR}` would sweep in a later subfeature's half-written files, which is exactly what the Staging Rules exist to prevent.

    So F27 re-includes **exactly three paths**: `${FEATURE_DIR}/subfeatures/${SF}-*`, `${FEATURE_DIR}/epic.md`, and this round's `${FEATURE_DIR}/review-NNN.md` together with its `_tests/run-NNN/` evidence. **`add-commit` has no subfeature-scoped re-include today** and F35's edit to that skill covers only the trailer, so this staging path is stated here, in the command.
  - **The tag comes back here, and it is pushed.** T2's F13 dropped `checkpoint/${FEATURE_ID}-${SF}-done` from `/add.build` because it pointed at work-free history. F27 re-creates it **on the commit it just made**, which is the first time it is true. `status.sh:322` reads it again from that point on. **The push carries the tag explicitly** (`--follow-tags`, or naming branch and tag) — plain `git push` leaves it local, and a local-only tag is invisible to the fresh-clone and other-engine resume L4.2 exists to prove.
  - **The trailer is `converge-gates.sh`'s stdout verbatim** — the same `KEY=STATUS` lines, one per gate, appended as trailer lines under the Conventional Commits body. No second format is invented: F35 documents this shape in the skill, it does not design one.
- **F28** — same file: at each subfeature boundary, compact the Decision Log to one line for the finished subfeature and drop the rest. This is what keeps the coordinator alive across several subfeatures.
- **F29** — same file: resume rules. On re-invocation, resume at the last checkpoint commit; the in-flight subfeature starts over. Gated commits mean an in-flight subfeature has no commit, so there is no partial state worth trusting. **"Starts over" means its iteration counter resets while STEP 3's and STEP 4's existing idempotency guards still apply** — a `plan.md` already current for that subfeature is still skipped, area files from a completed round are still reused. The guards are what make a restart cheap; bypassing them would throw away correct work to prove a point.
- **F30** — same file: log to `iterations.jsonl` at every **leg** boundary, not once per iteration, carrying the `sf` field the schema already defines. This is what lets a cold coordinator read one line instead of inferring position from scattered files.
- **F31** — same file: dispatch the cross-subfeature judge. Full pass after each subfeature's plan is consolidated and reviewed; delta-only pass at the end of the epic, re-checking only dimensions whose inputs changed since the last verdict. **The two passes route differently, because the review document does not exist yet at plan time.** The plan-time pass applies its findings to that subfeature's `plan.md` through the same shape T3's plan reviewer uses — apply, re-run the `feature-plan` schema gate, one re-dispatch, `blocked` is a BLOCKED exit. Only the end-of-epic delta pass writes into the review document's `## Fix Routing` table, where a review document exists to carry it.
- **F32** — `framwork/.codeadd/agents/consistency-agent.md` (new): read-only judge comparing declared contracts across subfeatures. Never edits. Reports findings with the evidence rule the `review` schema already enforces.
- **F33** — `framwork/.codeadd/skills/add-cross-sf-consistency/SKILL.md` (new): the rubric. Five dimensions and nothing else — API contracts, data schema, requirements, design tokens (only when `HAS_DESIGN`), auth/permission model. Anything outside them is informational and never blocks. Also carries the dedupe and severity rules, modelled on the dual-judge merge rules plan 0059 established.
- **F34** — `framwork/provider-map.json`: register `consistency-agent` and `add-cross-sf-consistency`.
- **F35** — `framwork/.codeadd/skills/add-commit/SKILL.md`: the commit trailer format for the gate results. This skill already owns commit message shape, so the format belongs here and not in the command.
- **F36** — `framwork/.codeadd/skills/add-ecosystem/SKILL.md`: register the agent, the skill, and the command's new epic scope.

### Does NOT Include

- **Skipping a blocked subfeature.** The loop halts. Skipping needs the dependency graph to prove independence; T2 only just made that graph trustworthy, and turning the policy on is a separate decision with its own failure modes.
- **A new feature flag.** The epic path is already opt-in by invocation. See Validated Decisions.
- **Merging.** The loop converges and hands control back. `/add.done` stays the only merge path.
- **A written checklist artefact.** Rejected in the umbrella. F4 (leg output checks), F27 (commit receipt) and F30 (per-leg logging) cover what it was meant to solve.
- **Changing the inner loop.** Its cap, its no-progress rule and its three exit states are untouched.

## Injection Surface (read before editing)

**`add.plan-to-ready.md` carries zero injection markers.** F23–F31 are the largest edits in the whole set and they carry no anchor risk at all. That is the reason T4 is last and not first — everything risky was already paid for in T2 and T3.

| File | Markers | Risk |
|---|---|---|
| `add.plan-to-ready.md` | **none** | **None** |
| `add-commit/SKILL.md` | none — plugins activate skills wholesale, they do not inject into them | None |
| `add-ecosystem/SKILL.md` | none | None |
| `agents/consistency-agent.md` (new) | **deliberately none** — see below | None |
| `provider-map.json` | n/a | None |

**The new agent carries no plugin marker, on purpose.** Plugin agent injection is opt-in by placing a marker in the agent's source; leaving it out is how the framework excludes an agent. `gitnexus` injects a `graph` section into nine agents, all of which read code. `consistency-agent` compares contracts declared across plan documents — document against document. Giving it the code graph would turn it into a code auditor, which is `@reviewer-agent`'s job, and `@reviewer-agent` already carries the marker. **Record this as a decision in the evidence file**, because a missing marker is indistinguishable from a forgotten one.

**Still run the build at this checkpoint.** T4 adds an agent, which changes what the build emits. The injection total must still match the umbrella's L0.1 baseline — a new agent with no markers adds no injection points, and if the total moves, something else did.

## Validated Decisions (T4)

| Question | Decision | Rationale |
|---|---|---|
| New feature flag for the epic loop | **No** | It is already opt-in by invocation. A flag would need a fragment, the command's first-ever marker, a CLI registry entry and a new injection point — cost with no gain |
| Who commits | `/add.plan-to-ready`, not `/add.build` | The clean-tree rule exists so a human sees the diff. An autonomous loop has no such human |
| Commit gating | Only on CONVERGED | A checkpoint on non-converging code is a restore point to broken code. The absence of a commit is itself the signal |
| Where the receipt lives | The commit message trailer | Keeps `NO NEW STATE` — a commit message is not a file — and makes it greppable with `git log --grep` |
| Halt vs skip on a blocked subfeature | Halt | Skipping needs a dependency graph you can trust, which T2 has only just created |
| Resume granularity | Last checkpoint commit; in-flight subfeature restarts | A gated commit means an in-flight subfeature has no trustworthy partial state. Damage is limited to one subfeature |
| `iterations.jsonl` granularity | Per leg, with `sf` | A crash mid-iteration leaves no entry today. Per-leg logging is what makes a cold restart read one line instead of guessing |
| Cross-SF judge timing | Full after each plan, delta at the end | Plan-time catches divergence before it becomes code; the end pass is bounded to what changed |
| Cross-SF rubric size | Exactly five dimensions | An open-ended consistency judge produces endless findings and the loop never converges |
| Plugin marker on the new agent | None | It judges documents, not code. Code-level checking is `@reviewer-agent`'s job and that agent already has the graph |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| A wrong halt policy strands a long epic halfway | Medium | F27's gated commit means every converged subfeature is already pushed; F29 restarts only the in-flight one |
| The loop pushes broken work to a shared branch | Medium | F27 gates the commit on all four gates `ok`; L2.2 checks a non-converged subfeature produces no commit |
| The coordinator runs out of context mid-epic | Medium | F28 compaction + F30 per-leg logging + F29 resume. L4 exercises all three together |
| The cross-SF judge never converges | Medium | F33's five fixed dimensions; anything else is informational. L3.4 checks an out-of-rubric finding does not block |
| Findings from the judge collide with review findings | Medium | F31 routes into the existing `## Fix Routing` contract, with plan 0059's dedupe and precedence rules |
| The global backstop never fires and hides a runaway | Low | L2.5 forces it in a synthetic epic and checks the run reports it rather than continuing quietly |
| The receipt trailer is written but wrong | Medium | L2.3 diffs the trailer against a fresh run of `converge-gates.sh` at that commit |
| A new agent silently loses plugin capability someone expected | Low | The deliberate-exclusion note above, recorded in the evidence file |

## Ecosystem Impact

| Component | Necessary action | F |
|---|---|---|
| `framwork/.codeadd/commands/add.plan-to-ready.md` | Epic args; outer loop; budget/halt; gated commit + push; Decision Log compaction; resume; per-leg logging; cross-SF dispatch | F23–F31 |
| `framwork/.codeadd/agents/consistency-agent.md` | New, no plugin marker | F32 |
| `framwork/.codeadd/skills/add-cross-sf-consistency/SKILL.md` | New, five-dimension rubric | F33 |
| `framwork/provider-map.json` | Register agent + skill | F34 |
| `framwork/.codeadd/skills/add-commit/SKILL.md` | Commit trailer format | F35 |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Register agent, skill, new command scope | F36 |

---

## Red-Green Validation Matrix (T4)

**RED first**, against the post-C3 tree. Levels run on a synthetic epic of at least three subfeatures with a real dependency between two of them.

### L1 — Scoping and order

1. An epic target with no `SFxx` runs every pending subfeature. *RED: today it targets one.*
2. A target **with** `SFxx` behaves exactly as before. Byte-compare the resulting artefacts against a pre-T4 run of the same input.
3. Order follows `epic.md`'s dependency graph, not table order. Reorder the rows so the two disagree and confirm the graph wins.
4. Subfeatures already `done` are skipped, and the skip is recorded.

**Which gate-3 form applies where.** Every subfeature, including the last, is evaluated with STEP 6's **scoped** gate-3 rule while the loop is inside it. The **epic-wide** form — no row still pending — is evaluated once, after the final subfeature's F27 row flip and commit, as the condition for the epic-level CONVERGED that STEP 9 reports. Because F27 writes the rows, that form is now reachable; without it, it never would have been.

### L2 — Checkpoint and budget

1. Each converged subfeature produces exactly **one** commit, pushed, on the feature branch. Not one per iteration.
2. **A non-converged subfeature produces no commit.** This is the level the whole gating decision rests on.
3. **The trailer tells the truth.** For each checkpoint commit, run `converge-gates.sh` against that commit's tree and diff against the trailer. They match.
4. `git log --grep` over the branch reconstructs which subfeatures converged and with what gate results, using nothing else.
4b. **The row flip is inside the commit.** For each checkpoint commit, `git show --stat` includes `epic.md`, and the row for that subfeature reads done in that commit's tree — not in a later one, and not only in the working tree.
4c. **`status.sh` stays truthful mid-epic.** After each checkpoint, `EPIC_PROGRESS` reports the real count and `EPIC_CURRENT_SF` names the next pending subfeature. *RED today: the loop never writes the column, so both would be frozen at the start.*
4d. **The tag points at real work.** `checkpoint/${FEATURE_ID}-${SF}-done` resolves to the commit F27 just made, and `LAST_CHECKPOINT` reports it. *RED after T2, which dropped tag creation on purpose.*
5. The global `3 × N_SF` backstop fires on a synthetic epic built to exceed it, and the run reports it instead of continuing.
6. Halt on the first non-CONVERGED subfeature: later subfeatures are not started, and the report names them as not attempted.

### L2b — The command text stops contradicting itself

1. **No stale per-invocation wording survives.** Grep the built `add.plan-to-ready.md` for `PER INVOCATION, NOT CUMULATIVE`, `3 iterations spent`, and every other per-invocation framing. The live file repeats it in at least four places (~L67, L260, L280, L289 today), not only in the ABSOLUTE INVARIANTS block. Each surviving occurrence must be qualified for the epic case or removed. *RED today: all four read as if invocation and subfeature were the same thing.*
2. **STEP 9 fires exactly once** across a multi-subfeature run. Count the report blocks in a three-subfeature run: one, not three.
3. The report states both the per-subfeature iteration counts and the cumulative figure, as STEP 9 already requires.

### L3 — Cross-SF judge

1. Two subfeatures declaring the same endpoint with different shapes → a finding, on the API-contract dimension. *RED: nothing detects it.*
2. Same for each remaining dimension: a schema conflict, a contradictory requirement, a design-token divergence (only when `HAS_DESIGN`), and an auth-model divergence.
3. Design tokens are **not** checked when `HAS_DESIGN=false` — no false finding on a backend-only epic.
4. A divergence outside the five dimensions is reported as informational and does not block convergence.
5. The end-of-epic pass re-checks only dimensions whose inputs changed since the last verdict, and says which it skipped and why.
6. Findings route through `## Fix Routing` with plan 0059's dedupe and precedence rules; a finding raised by both the judge and the review leg appears once.
7. The judge modifies nothing: filesystem snapshot before and after, byte-equal.
8. **The routing split holds.** Force a finding that only the plan-time pass can see. It is applied to that subfeature's `plan.md`, triggers the `feature-plan` schema re-gate, respects the one-re-dispatch cap, and **does not appear** in any review document's `## Fix Routing` table. Then force an end-of-epic-only finding and confirm the opposite. *This mechanism is new in this topic and is otherwise untested.*

### L4 — Interruption and cold restart

1. Kill the run mid-subfeature and re-invoke. It resumes at the last checkpoint commit and restarts the in-flight subfeature. Final tree and commit graph match an uninterrupted run, except for the restarted subfeature's intermediate files.
2. **Cold restart with no conversation history.** Working only from `epic.md`, the checkpoint commits and `iterations.jsonl`, the coordinator names the correct next subfeature and the correct leg. No file this set did not already ship is consulted.
3. `iterations.jsonl` has an entry at every leg boundary with the right `sf`. Kill the run mid-iteration and confirm the last leg is still on record. *RED today: entries are written once per iteration, at the end.*
4. Decision Log compaction: after subfeature N, the log holds one line for it and no leg-level detail. The coordinator still answers the plan leg's clarification questions correctly on subfeature N+1.

### L5 — Feature and plugin interaction

1. With `qa-pipeline` off, the epic run converges and gate 2 does not fail. A project without QA is not a failing project.
2. With `tdd-pipeline` off, the build leg skips test generation and says so once, per the existing self-detection notice.
3. `qa-pipeline/add.plan.md`'s assumption that a plan run is scoped to one subfeature still holds under the outer loop — the per-subfeature plan leg does not rewrite a sibling's plan.
4. Enable/disable round-trip for both features and both plugins on a post-T4 install: byte-identical.
5. Build succeeds and the injection total equals the umbrella's L0.1 baseline. A new agent with no markers adds no points.
6. **Registration.** `consistency-agent` and `add-cross-sf-consistency` appear in `provider-map.json` and build into every expected provider output directory, in that provider's agent dialect. *This is the only check covering F34.*
7. **Ecosystem registry.** `add-ecosystem/SKILL.md` lists `consistency-agent`, `add-cross-sf-consistency`, and `/add.plan-to-ready`'s new epic scope. *This is the only check covering F36 — L5.6 never opens this file.*

### L6 — Acceptance

1. A three-subfeature epic runs end to end unattended: three plans reviewed, three subfeatures built and reviewed, three checkpoint commits pushed with truthful trailers, one cross-SF verdict per plan plus a delta pass at the end, and a final CONVERGED naming no remaining subfeatures.
2. The same epic with a deliberate cross-subfeature contract break halts, names the subfeature and the dimension, and leaves the earlier subfeatures committed and pushed.

**RED expectations:** L1.1, L2 entirely, L3 entirely, L4.2 and L4.3, L6 entirely. **GREEN = all levels pass after F23–F36.**

---

## Reviewer Handoff

Beyond the umbrella's list:

1. **Does a non-converged subfeature really produce no commit?** L2.2 is the level the entire checkpoint design rests on, and the easiest to break by committing "so the work is not lost".
2. **Is the trailer generated from a real run,** or reconstructed from what the coordinator remembers? L2.3 must diff against a fresh run.
3. **Was L4.2 done cold,** with no conversation history, or by a coordinator that still had the context? Only the cold version proves anything.
4. **Did the single-subfeature path change?** L1.2 is a regression check for every existing user of this command, and it must be a byte comparison.
5. **Is the rubric still five dimensions,** or has it grown during implementation? Growth here is how the loop stops converging.
6. **Was the missing plugin marker on `consistency-agent` recorded as a decision?** An unrecorded absence reads as an oversight to the next maintainer.
7. **Does the outer loop reach into the inner loop's cap or exit states?** F25 wraps them. Rewriting them would invalidate every guarantee plan 0070 established.

## Next Steps

This topic is built as part of the 0074 set; the full invocation order is in the umbrella's Next Steps. T4 is the fourth and last build and ends at checkpoint **C4**. It requires **C3**. F27 completes the checkpoint-tag fix that T2's F13 began, so the two must not be split across a release.

## References

- Plan 0070 L117 and `docs/brainstorming/2026-08-24-development-loop-consolidation-005-plan-to-ready-orchestrator.md` L109, L126 — the deferral this topic reverses, and the reasoning behind it.
- `framwork/.codeadd/commands/add.plan-to-ready.md` — the invariants F25 must not break: depth-1 dispatch, cap per invocation, `NO NEW STATE`, coordinator as sole `tasks.md` writer, the merge stays human.
- Plan 0059 — the dual-judge dedupe, precedence and root-cause rules F33 copies.
- `framwork/.codeadd/commands/add.build.md`, block `**14.1 Log Iteration**` under heading STEP 16 (~L617–628 today) — the `iterations.jsonl` entry shape and its existing `sf` field. Cited by block label rather than line, because T1–T3 shift the line numbers.
- `framwork/.codeadd/skills/add-commit/SKILL.md:62-70` — the Staging Rules F27 reuses, and the message shape F35 extends.
- `framwork/.codeadd/scripts/status.sh:274-293` — the `EPIC_PROGRESS` / `EPIC_CURRENT_SF` derivation that F27's row flip keeps truthful.
- `cli/src/plugins.json` — the nine agents `gitnexus` injects into, and why `consistency-agent` is not among them.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-27 | Initial creation |
| 2026-08-27 | Review v02: F27's staging rewritten to name three re-include paths — `epic.md` and `review-NNN.md` live at the feature root, so a subfeature-scoped re-include would have left the row flip out of the commit and silently reopened round-1's B1 (B1, found independently by two reviewers). L5.7 added; L5.6 no longer claims to cover F36 (B2). New L2b greps the shipped file for stale per-invocation wording and counts STEP 9's report blocks (A1). New L3.8 proves the plan-time vs end-of-epic routing split (A2). Push now carries the tag explicitly (A3). Staging citation widened, `N_SF` defined (N1, N2) |
| 2026-08-27 | Review v01: F27 now flips the `epic.md` row inside the checkpoint commit — nothing else in the loop writes it, so resume had no source of truth (B1). Trailer pinned to `converge-gates.sh` stdout verbatim (B2). F25 states STEP 9 fires once per epic and that the per-invocation cap invariant is superseded (B3). Backstop restated in iterations, not legs, with halt precedence (B4). F29 reconciled with the existing idempotency guards (A1); F27 points at `add-commit`'s Staging Rules (A2); L5.6 covers F34/F36 (A3); gate-3 form per subfeature stated (A4); halt precedence (A5). F13's dropped tag re-created here. F31 splits plan-time and end-of-epic routing. References cited by block label (N1, N2) |
| 2026-08-29 | Implemented at C4 (eb6f472). Four grave defects fixed in 4b8cd62: the checkpoint staged nothing, the epic-wide gate never ran, /add.done ignored gate 2, and a scoped run made no checkpoint. Status -> implemented |
