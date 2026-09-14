# Brainstorm: Test-Agent Terminal States and Sequential Dispatch

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-13
> **Type:** architecture
> **Layer:** product — every affected artefact lives under `framwork/.codeadd/`

## Discovery

**Delivery index.** `node scripts/graph.js history` reports *no delivery recorded* for
`test-agent`, `fix-agent`, `add.build`, `add.hotfix`, `add-tdd` and `add-qa`. The fragment names
`tdd-pipeline` and `qa-pipeline` were not graph nodes at the time of the lookup. Nothing here
reverses a prior close-out.

**Prior brainstorm — `2026-08-24-development-loop-consolidation-003-test-into-build`.** This is the
decision that produced today's dispatch, and it explains the defect rather than defending it. The
standalone `/add.test` command had *"STEP 3 parallel area generators"* — parallel across areas, over
code that already existed, because the command ran on its own after implementation. When that body
was folded into `add.build`, the stated criterion was mode independence: *"the new generation
sections attach at mode-independent points: framework detection once during context setup,
`@test-agent` dispatch alongside each area's implementation."*

The word `alongside` changed what the parallelism meant, and no one chose that. `/add.test`
generated tests over finished code. The folded version generates over code still being written.
**The concurrency with the implementer was inherited from an anchor decision, never argued for.**

**Framework discovery agent.** Ranked `agents/test-agent.md`, `commands/add.build.md`,
`skills/add-tdd/SKILL.md`, `fragments/tdd-pipeline/add.build.md` and `agents/fix-agent.md` highest.
Two delivered plans touch test infrastructure (`fast-local-bats`, `vitest-fixture-scope`) and both
are runner performance, not agent behaviour.

**External comparison.** Four widely used systems were read for how they end an iteration loop:

| System | Cap on iteration | Terminal state in red | Coordinator verifies independently |
|---|---|---|---|
| superpowers (obra), read on disk at v6.3.0 | `Fix round R of 5` | `BLOCKED`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT` | `Agent completed` requires a VCS diff; an agent's success report is listed as a red flag |
| GSD (`gsd-build/get-shit-done`) | waves | `checkpoint:human-verify`; ship preflight accepts only explicit `pass` | orchestrators spot-check actual output |
| ralph-loop (official Anthropic plugin) | `--max-iterations`, enforced in a Stop hook the agent cannot reach | any unexpected state deletes the loop file and exits | completion is a literal string match |
| aider | `max_reflections`, default 3 | stops and prints raw output | — |

Two further findings from the same reading:

- superpowers forbids the shape this framework uses: *"Never dispatch multiple implementation
  subagents in parallel (conflicts)"*, and its parallel-dispatch skill routes `shared state` to
  `Sequential agents`.
- ralph-loop's injected system message reads *"ONLY when statement is TRUE — do not lie to exit!"*.
  An agent held in a loop it cannot legitimately leave will claim the exit condition. This is the
  observed behaviour the design below prevents structurally rather than by instruction.

## Context & Motivation

`@test-agent` is told to run tests and *iterate until they pass*. It is read-write on test files
only, and it is explicitly forbidden from touching application source or softening an assertion.
Those three instructions have no consistent solution when a test is red for a reason the agent
cannot address.

A recent change (already on disk) closed one case: a test that belongs to a **sibling agent**. It
added `KNOWN_FAILURES` as a dispatch input, `CONCERNS` as a report field, and a `## Git and the
Shared Tree` section forbidding any git command that removes work from the tree.

That fix is correct and is the baseline for this design. It does not close the more common case.

## Problem / Opportunity

### 1. The remaining terminal-state gap is the frequent one

The new rule keys on **who wrote the failing test file**. A test the agent wrote itself, which fails
because production code is genuinely wrong, is the agent's own test — so it does not qualify for
`CONCERNS`. It returns to *iterate until they pass*, still unable to fix the source.

This is not an edge case. `@test-agent` is dispatched **alongside** the area's implementation agent,
so the source is unfinished by construction, and a correct test failing against unfinished code is
the expected state.

With no authorised way to stop, the outcomes available to the agent all report success: soften the
assertion while calling it *fixing the test*, mark `skip`/`todo`, delete the test it just wrote, or
narrow the run. `TESTS_PASSING: false` is only produced by giving up, and giving up is not
authorised anywhere in the file — so the coordinator's one-fix-iteration cap, which triggers on
`false`, largely never fires.

### 2. The agent reads a moving target

`test-agent.md` instructs *"READ the source file completely"* and *"IDENTIFY every testable export"*.
While the implementer is still writing, the export list is incomplete, so generated coverage is
silently incomplete. Nothing reports this — the tests that exist pass.

### 3. No iteration cap exists

`@fix-agent` receives `ATTEMPT` and `MAX_ATTEMPTS` from the caller, with the reason written in its
own file: *"a leaf agent cannot see its own history, so the retry cap lives where the outer loop can
see it."* `@test-agent` receives neither. All four external systems have a cap; this agent has none.

### 4. Per-area fix dispatch discards the routing table's order

`@fix-agent` is dispatched *one per affected area, parallel across areas*. The agent's own file says
the table is *"already ordered by severity precedence and then by area dependency; do not re-sort
it"*, and `add.build` STEP 12.1 says to respect `Blocked by`.

Slicing that table by area and running the slices concurrently **discards the cross-area severity
order** and **cannot honour a `Blocked by` that points at another area's row** — neither agent can
see the other's rows. A correction spanning two areas has no owner at all.

### 5. Several writers share one tree

`add.build` dispatches Backend and Frontend implementers in parallel, plus one `@test-agent` per
area, plus `@fix-agent` per area during a correction wave. The hazard is already documented at STEP
11.3, where `git add -A` on the first area sweeps the second area's files into its commit. Each
agent also re-runs the full project build, concurrently, on that one tree.

## Proposed Solution

### Alternatives considered

| Option | Approach | Verdict |
|---|---|---|
| **A** | Add more prohibitions to `test-agent.md` — name `git`, `skip`, deletion, `--passWithNoTests` | **Rejected.** Prohibiting without providing an exit is the present condition. A seventh wall in a room with no door produces the same improvisation |
| **B** | Terminal states plus caps, keep the current parallel dispatch | **Partial.** Fixes the agent, leaves the shared tree and the routing-order defect |
| **C** | Terminal states, caps, sequential dispatch, and one merged fix dispatch | **Recommended** |
| **D** | One git worktree per agent | **Rejected for now.** `build-setup.sh --worktree` already gives one worktree per build; one per agent is a rewrite of the dispatch model, and option C removes the condition it would address |

### Recommended — option C, in three parts

**Part 1 — give the agent somewhere to stop.** `@test-agent` gains `BLOCKED`, alongside the
`CONCERNS` already present. `CONCERNS` answers *"this red test is not mine"*; `BLOCKED` answers
*"this red test is mine, it is correct, and the production code is wrong."* Both are successful
completions, not failures. It also gains `ATTEMPT` and `MAX_ATTEMPTS` supplied by the caller, at 3,
matching `@fix-agent`, and `KNOWN_FAILURES` is declared in `## Inputs` where it is currently used but
undeclared.

The distinction the agent applies:

```
A TEST IS RED. WHICH ONE IS IT?
  ⛔ NOT: keep iterating until something turns green
  ✅ The test file is not yours          → CONCERNS, name the file, stop
  ✅ Your test, and the test is wrong    → fix the test (up to MAX_ATTEMPTS)
  ✅ Your test, and the source is wrong  → BLOCKED, name the assertion and the
                                           source symbol, stop. Do not fix it
```

**Part 2 — one writer at a time.** `@test-agent` runs sequentially across areas, and after that
area's implementer rather than alongside it. This is consistent with what the agent actually
produces: contract tests are authored earlier by `/add.plan`, and `@test-agent` targets *"the GAPS:
edge cases, error handling, and integration scenarios"* — gap coverage follows implementation by
nature. Backend and Frontend implementers also run sequentially.

**Part 3 — one fix dispatch for the whole wave.** `@fix-agent` stops being per-area. It takes
`AREAS` (those present in the routed rows) and the whole `## Fix Routing` slice, and works it in the
table's own order.

The table's sort is **severity first, then area** — `add.review` STEP 11.2 states it in those words —
not dependency first. A high-severity row can therefore legitimately precede the lower-severity row
that blocks it, which means *working the table in order* is **not** the same guarantee as *honouring
`Blocked by`*. Merging the dispatch is what makes honouring it possible at all, since a per-area
agent cannot see the blocking row; it is not sufficient on its own. B4 therefore also supplies the
instruction that is missing today: on reaching a row whose `Blocked by` predecessor is still
unresolved, defer that row, continue down the table, and return to it once the predecessor lands.

The merge also gives a cross-area correction an owner, and reduces concurrent full-build runs from N
to one. Skills load per area **present in the rows**, so a single-area wave costs exactly what it
costs today.

The same merge is deliberately **not** applied to `@test-agent`: that agent has no cross-area
ordering constraint to preserve, and its output volume — full unit and integration coverage per area
— makes a single context the wrong trade.

## Type of Artefact

Architecture — a change to how existing agents, commands and fragments fit together. No new artefact
is created.

## Scope

### Includes

| Id | Change | Artefact |
|---|---|---|
| A1 | `BLOCKED` terminal state for a red test the agent owns and cannot fix | `agents/test-agent.md` |
| A2 | `ATTEMPT` / `MAX_ATTEMPTS` from the caller, cap 3; `iterate until they pass` replaced. **The route is the dispatch, not the brief** — see the Key Decision below | `agents/test-agent.md`, both `tdd-pipeline` fragments, `commands/add.plan-to-ready.md` |
| A3 | `KNOWN_FAILURES` declared in `## Inputs`, and supplied by every caller | `agents/test-agent.md`, both `tdd-pipeline` fragments, `commands/add.plan-to-ready.md` |
| B1 | `@test-agent` sequential across areas | `fragments/tdd-pipeline/add.build.md` |
| B2 | `@test-agent` dispatched after the area's implementer, not alongside | `fragments/tdd-pipeline/add.build.md` |
| B3 | Backend and Frontend implementers sequential | `commands/add.build.md` |
| B4 | `@fix-agent` becomes a single whole-wave dispatch: `AREAS`, one `ATTEMPT`, skills per area present, plus explicit `Blocked by` deferral (defer a row whose predecessor is unresolved, return to it when the predecessor lands) | `agents/fix-agent.md`, `commands/add.build.md`, `commands/add.plan-to-ready.md` |
| C1 | Coordinator runs `TEST_COMMAND` itself at the build's WAIT-ALL, as `add.hotfix` already does | `fragments/tdd-pipeline/add.build.md` |
| C2 | Frontmatter `description`, body line 14 and `add-ecosystem` synchronised with the new terminal states | `agents/test-agent.md`, `skills/add-ecosystem/SKILL.md` |
| C3 | Model escalation on `@test-agent`'s final attempt | `agents/test-agent.md`, both fragments, `commands/add.plan-to-ready.md` |
| C4 | Declared red — `xfail(strict=True)` / `test.failing()` / `test.fails()` — instead of `skip` | `agents/test-agent.md` |

Consequential edits carried by the above, each named because a planner works from this list:

- `add.build` STEP 10.1 — the dependency-order rule, which still reads `Backend + Frontend only:
  Parallel` (B3).
- `add.build` STEP 10.5 — the Coordination Flow worked example, which still reads `Dispatch Backend
  + Frontend (parallel)` (B3).
- `add.build` — the `>4 areas detected | Split into maximum parallel groups` row (B3).
- `add.build` STEP 11.3 and STEP 12.2 — the commit-batch unit, per the Key Decision below (B4).
- The `<!-- uses: -->` declarations of both `tdd-pipeline` fragments, which now declare what they
  dispatch and are covered by the graph gates.

**Callers were enumerated from the artefact graph, not by search.** `node scripts/graph.js impact
test-agent` and `impact fix-agent` both return `product/command/add.plan-to-ready (DISPATCHES)` at
depth 1. Any later change to either agent's input contract must re-run those two queries — the
`DISPATCHES` edges are the authoritative caller list, and a grep over the source is not.

### Does NOT Include

- One git worktree per agent (option D).
- `add.review`'s **authoring** of `## Fix Routing` — the table's schema and ordering do not change,
  and the slicing that B4 removes lives in `add.build`, not there. The design does, however, read
  `add.review` STEP 11.2 as the authority on the table's sort order.
- The `qa-pipeline` correction dispatch's **layer ordering**, which is already *"sequential across
  layers"*. Its reference to the Correction Dispatch contract is in scope — see Ecosystem Impact.
- `add.plan`'s contract-test authoring.
- Any change to `add-tdd`'s RED-GREEN-REFACTOR discipline.

## Key Decisions

| Decision | Rationale | Validated |
|---|---|---|
| `BLOCKED` is a successful completion, not a failure | An agent with no authorised stop fabricates the exit condition; ralph-loop had to write *"do not lie to exit"* into its own loop | ✅ |
| `CONCERNS` and `BLOCKED` stay separate fields | They route differently: `CONCERNS` goes to the file's owner, `BLOCKED` becomes a routed row for `@fix-agent` | ✅ |
| A `BLOCKED` report is routed **in the same build run**, not deferred to the next `/add.review` | `## Fix Routing` as a document is written only by `/add.review` STEP 11, but `add.build` STEP 11.2 already synthesises `ROUTED_ROWS` in flight from validator output and build errors, with no review document present. `BLOCKED` is the same class of in-flight signal and takes the same path. Deferring it would let a red test cross the whole build unfixed, which is what this design exists to stop | ✅ |
| The merged fix wave produces **one cross-area commit** | STEP 11.3 already defines the batch as one dispatch, and splitting it per area would mean attributing files to areas — which the same block forbids doing by glob. STEP 12.2 packages `FIX_BASE..HEAD`, a range, so it is indifferent to the count | ✅ |
| `MAX_ATTEMPTS` is 3, supplied by the caller | Matches `@fix-agent` in this repo and aider's default; a leaf agent cannot see its own history | ✅ |
| `ATTEMPT` / `MAX_ATTEMPTS` travel in the **dispatch**, not through `task-brief.sh` | The two inputs already have precedents pointing opposite ways: `KNOWN_FAILURES` reaches the agent through the brief (`add.build:387` passes it as the script's optional 4th argument), while `@fix-agent`'s `ATTEMPT` travels in the dispatch prose of the Correction Dispatch contract. The retry cap follows `@fix-agent`, because it is the same field with the same meaning and a second route would let the two disagree. **`task-brief.sh` therefore needs no fifth argument and stays out of scope** | ✅ |
| Enforcement is not the fix, and cannot be | `scripts/build.js` now emits `disallowedTools: Write, Edit, NotebookEdit` on Claude for an agent declaring `readonly: true`. That is all-or-nothing: it cannot express *"read-write on test files only"*, and `@test-agent` must keep `Bash` to run `TEST_COMMAND` at all. The constraint stays a written rule, which is exactly why it needs an authorised exit rather than another prohibition | ✅ |
| `@test-agent` runs after the implementer | *"READ the source file completely"* is unsatisfiable against a file being written; the 2026-08-24 `alongside` anchor was inherited from `/add.test`, which ran after implementation | ✅ |
| `@fix-agent` merges to one dispatch rather than N sequential | A per-area agent cannot see the row that blocks its own, so merging is a precondition for honouring `Blocked by` at all. It is not sufficient — the deferral instruction in B4 is what completes it. Merging also gives a cross-area correction an owner | ✅ |
| `@test-agent` does **not** merge the same way | No cross-area ordering to preserve, and full coverage for four areas in one context is the wrong trade | ✅ |
| Prohibitions alone are rejected | The present failure is a prohibition set with no exit; adding more does not add an exit | ✅ |
| `add.review`'s authoring of the table is untouched | The per-area slicing is `add.build`'s, so the table's schema and ordering do not change | ✅ |
| `add.plan-to-ready.md` joins the scope rather than keeping the old contract | It dispatches **both** changed agents directly at depth 1 (`graph.js impact` confirms `DISPATCHES` on each). Leaving it behind would mean `fix-agent.md` declaring `AREAS` while a live caller passes `AREA`, or two contracts for one agent kept alive indefinitely | ✅ |

## Ecosystem Impact

Every artefact below is **product layer** (`framwork/.codeadd/`), so every F-block tags `[product]`.

| Component | Impact | Action |
|---|---|---|
| `agents/test-agent.md` | Terminal states, cap, declared input, synchronised headline text | A1, A2, A3, C2, C3, C4 |
| `agents/fix-agent.md` | `AREA` → `AREAS`; one `ATTEMPT`; skills loaded per area present | B4 |
| `fragments/tdd-pipeline/add.build.md` | Sequential and post-implementation dispatch, cap passed, coordinator-side test run | A2, B1, B2, C1, C3 |
| `fragments/tdd-pipeline/add.hotfix.md` | Cap passed; already runs the test coordinator-side | A2, C3 |
| `commands/add.build.md` | Sequential implementers (STEP 10.1, 10.5, `>4 areas` row); single fix dispatch; commit-batch unit at 11.3 / 12.2; `BLOCKED` routed in flight at 11.2 | A1, B3, B4 |
| `commands/add.plan-to-ready.md` | Third caller of both agents, at depth 1. Its STEP 4 correction leg passes singular `AREA`; its Build roster dispatches `@test-agent` with no cap | A2, A3, B4, C3 |
| `skills/add-ecosystem/SKILL.md` | Line describing `@test-agent` as running *until green* | C2 |
| `add.review` | None to its authoring of `## Fix Routing`. Read-only dependency: STEP 11.2 is the authority for the table's sort order | none |
| `fragments/qa-pipeline/add.build.md` | Layer ordering unaffected. But it **dispatches** `@fix-agent` — verify its *"per the Correction Dispatch contract"* reference still reads correctly once the contract is whole-wave | B4 (verify) |
| `skills/add-subagent-driven-development/SKILL.md` | Graph reports `DISPATCHES` on `@fix-agent`. Its text is capability-level (*"Critical issues → dispatch `@fix-agent`"*) and names no `AREA` input — planner to confirm no per-area slicing is implied before ruling it out | B4 (verify) |

**Suggested F-block order.** A3 and C2 are independent and trivial. A1 precedes C4, which needs a
case to mark. A2 precedes C3, which escalates on the final attempt. B4 precedes B3, because merging
the fix dispatch removes work that serialising it would otherwise create. B1 and B2 are one edit to
one section.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| Every red test has an authorised, reported ending | Build wall-clock: implementers and test agents no longer overlap |
| Coverage generated against finished source, not partial | The short loop where the agent fixes its own test while the implementer still works |
| Cross-area severity order and `Blocked by` actually honoured | `@fix-agent`'s single-area context guarantee |
| One writer on the tree, and one full build run per wave instead of N | |
| `TESTS_PASSING` becomes trustworthy, so the coordinator's cap can fire | |

| Risk | Probability | Mitigation |
|---|---|---|
| A large fix wave overloads the merged `@fix-agent`'s context | **Medium, and rising** | The 2026-09-13 read-only dispatch fix moved the per-area validator's corrections to `@fix-agent` — `@reviewer-agent` now emits a tick report and applies nothing — so a wave carries validator findings on top of routed rows. Mitigation is unchanged: load skills only for areas present in the rows, and `MAX_ATTEMPTS` 3 with model escalation already exists. A wave that large also defeated the per-area split, which left four agents each blind to the other three |
| `BLOCKED` is used to avoid work the agent could do | Medium | `BLOCKED` requires naming the assertion and the source symbol; C1 has the coordinator run `TEST_COMMAND` itself, so the claim is checkable |
| B3 slows every build, including for users with `tdd-pipeline` disabled | High | Accepted deliberately: `add.build`'s ungated body is where the multi-writer tree lives, and the user chose consistency over throughput. Stated here rather than discovered later |
| Sequential dispatch hides, rather than fixes, a real need for worktrees | Low | Option D stays on the table; this design removes the condition rather than the capability |
| `KNOWN_FAILURES` becomes redundant once dispatch is sequential | Medium | Keep it: `add.hotfix` and the fix-iteration re-dispatch still carry pre-existing failures, and an empty value rendering as `none observed` is itself an answer |

## Next Steps

Run: `/add-framework--plan test-agent terminal states and sequential dispatch`
