# Plan: Test Terminal States and the QA Feature Boundary — two declared boundaries are made to match what the code does

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-13

---

## Context

Two boundaries in the framework are stated in one place and contradicted in another.

`@test-agent` is told to iterate until tests pass, forbidden from touching application source, and
forbidden from softening an assertion. When a test is red because production code is wrong, those
three have no joint solution, and every outcome still available to the agent reports success. The
2026-09-12 delivery closed the sibling-agent case with `KNOWN_FAILURES`, `CONCERNS` and a git-safety
section. It did not close the case where the agent's own correct test catches a real bug — which is
the frequent one, because `@test-agent` runs alongside the implementer and the source is unfinished
by construction.

`add.review` states that `qa-pipeline` gates authoring and correction, "never judgement". Its STEP
9.3 has no fallback on the feature-off branch, and its STEP 9.4 turns every uncaptured in-contract
screen into a blocker. A project that declined the feature does not keep its judgement; it gets a
coverage blocker per screen and two judges reading an empty directory.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-13T112232-test-agent-terminal-states-sequential-dispatch.md` | The `BLOCKED` contract, why a cap must come from the caller, why the fix dispatch merges, the four external systems compared, and the rejected alternatives |
| `docs/brainstorming/2026-09-13T120157-qa-judgement-under-the-feature.md` | The feature-off chain with its line evidence, the two-gate model, the marker-nesting constraint, and why option A (keep ungated, degrade honestly) was recorded and not taken |

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Marker pairs in a command source must be empty — `assertEmptyMarkerPairs` throws `Non-empty injection pair ... marker pairs must be empty` (`scripts/build.js:148`)
- Never write a raw `.codeadd/` path; use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`. Scripts are the exception — always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- HTML comments are stripped at build; injection markers and `<!-- uses: -->` rely on it (CLAUDE.md, Pipeline)
- `MAX_ATTEMPTS = 3` (`commands/add.build.md`, Correction Dispatch)
- A fragment declares what it dispatches, and the undeclared-reference gate reaches it (`fragment` is in `DECLARING_KINDS`, delivery 2026-09-12T221117)

## Problem

1. **A red test the agent owns has no authorised ending** — `iterate until they pass` plus two
   prohibitions, and `TESTS_PASSING: false` is only produced by giving up, which nothing authorises.
   The coordinator's one-fix-iteration cap triggers on `false` and therefore rarely fires.
2. **The agent reads a moving target** — it is told to read the source completely and identify every
   testable export, while the implementer is still writing the file.
3. **No iteration cap exists** — `@fix-agent` receives one from its caller with the reason written
   down; `@test-agent` receives none.
4. **Per-area fix dispatch discards the routing table's order** — the table sorts severity first,
   then area, and carries `Blocked by`; concurrent per-area slices can honour neither.
5. **Several writers share one tree** — parallel implementers, one `@test-agent` per area, and one
   `@fix-agent` per area, each re-running the full build.
6. **QA judgement promises what it cannot deliver** — the feature-off branch has no fallback, and the
   steps proceed into a state where every screen is a blocker.

## Proposal

One plan, two halves, sharing one closing F-block.

The test half gives the agent a third answer (`BLOCKED`), a cap that comes from outside it, and one
writer on the tree at a time. The QA half moves judgement under the feature that already owns its
input. Both halves edit `skills/add-ecosystem/SKILL.md`, which is why they are one plan: a single
F-block at the end consumes both, instead of two F-blocks editing one file where the second reads a
state the first changed.

Sequencing logic: agent contracts first, then the commands that dispatch against them, then the
tests that pin the result, then the two documentation surfaces that describe all of it.

## Current State

| Artefact | Dependants (`impact --depth 1`) | Today |
|---|---|---|
| `commands/add.build.md` | 16 | Backend + Frontend parallel; `@test-agent` alongside each implementer; `@fix-agent` one per area, parallel across areas |
| `commands/add.review.md` | 16 | STEPs 8, 9, 10 in the ungated base body, self-gating on the `/add.qa-setup` receipt |
| `commands/add.plan-to-ready.md` | 9 | A depth-1 orchestrator dispatching both changed agents directly |
| `skills/add-ecosystem/SKILL.md` | 8 | Three stale statements: `@test-agent` "runs them until green", `add.review` "self-gating on the `/add.qa-setup` receipt", and the Features table row giving `qa-pipeline` only `add.plan, add.build` |
| `commands/add.qa-setup.md` | 6 | Its feature-off sentence names `add.plan` and `add.build`, not `add.review` |
| `agents/test-agent.md` | 4 | `CONCERNS` for a sibling's red test; nothing for its own |
| `agents/fix-agent.md` | 4 | `AREA` singular, `ROUTED_ROWS` pre-sliced by the caller |
| `skills/add-qa/SKILL.md` | 4 | Owns the canonical "Feature vs plugin" statement every consumer references |

Four artefacts were checked during planning and need **no change**, recorded here so the build does
not reopen them: `fragments/qa-pipeline/add.build.md` references the Correction Dispatch contract by
name rather than by shape; `skills/add-subagent-driven-development/SKILL.md` dispatches `@fix-agent`
at capability level and names no `AREA`; `skills/add-qa/references/coordinator.md` orders QA routes to
implementation agents, not fix-agent areas; and `cli/tests/agent-capability.test.js`'s
`writeDispatches` filters on `edge.type` and the destination agent only, never on the origin node's
kind, so a `DISPATCHES` edge originating at a fragment is still walked.

## Scope

### Includes

#### T1 — Test-agent terminal states and sequential dispatch (ref: `2026-09-13T112232-test-agent-terminal-states-sequential-dispatch.md`)

- **F1** [product] — `framwork/.codeadd/agents/test-agent.md`: adds `BLOCKED` as a successful
  completion for a red test the agent owns and cannot fix, naming the assertion and the source
  symbol. Must NOT collapse into `CONCERNS`, which answers the different question of a sibling's
  test. `BLOCKED` does **not** consume an attempt.
  - **Produces:** `@test-agent returns BLOCKED naming the assertion and the source symbol`
- **F2** [product] — `framwork/.codeadd/agents/test-agent.md`: accepts `ATTEMPT` and `MAX_ATTEMPTS`
  from the caller and replaces `iterate until they pass`. Must NOT move the cap inside the agent.
  - **Produces:** `@test-agent accepts ATTEMPT and MAX_ATTEMPTS in its dispatch`
- **F3** [product] — `framwork/.codeadd/agents/test-agent.md`: declares `KNOWN_FAILURES` in
  `## Inputs`, where it is used at line 66 and undeclared.
- **F4** [product] — `framwork/.codeadd/agents/test-agent.md`: records a known-real red with
  `xfail(strict=True)` / `test.failing()` / `test.fails()` per the detected runner, never `skip`.
  - **Consumes:** `@test-agent returns BLOCKED naming the assertion and the source symbol` (F1)
- **F5** [product] — `framwork/.codeadd/agents/test-agent.md`: frontmatter `description` and the body
  line that still read "iterates until green" / "iterate until they pass" are synchronised with the
  terminal states. These two are the headline text other readers see first.
  - **Consumes:** `@test-agent accepts ATTEMPT and MAX_ATTEMPTS in its dispatch` (F2)
- **F6** [product] — `framwork/.codeadd/agents/fix-agent.md`: `AREA` becomes `AREAS`, one `ATTEMPT`
  per wave, skills loaded per area **present in the rows**, and an explicit `Blocked by` deferral —
  on reaching a row whose predecessor is unresolved, defer it, continue, return when it lands. Must
  NOT lose `NOT_MINE`, `DISPUTED` or `ROWS_FAILED`.
  - **Produces:** `@fix-agent accepts AREAS and one ATTEMPT for the whole wave`
- **F7** [product] — `framwork/.codeadd/commands/add.build.md`: STEP 12.1 and the Correction Dispatch
  contract dispatch one whole-wave `@fix-agent`; STEP 11.3's commit batch is one cross-area commit for
  that wave, and STEP 12.2 keeps packaging `FIX_BASE..HEAD`. The Agent Roster row is updated.
  - **Consumes:** `@fix-agent accepts AREAS and one ATTEMPT for the whole wave` (F6)
- **F8** [product] — `framwork/.codeadd/commands/add.build.md`: implementers run sequentially —
  STEP 10.1's dependency-order rule, STEP 10.5's Coordination Flow example, and the
  `>4 areas detected | Split into maximum parallel groups` row.
  - **Produces:** `add.build dispatches one implementation agent at a time`
- **F9** [product] — `framwork/.codeadd/fragments/tdd-pipeline/add.build.md`: `@test-agent` is
  dispatched **after** each area's implementer and interleaved per area —
  `DB → test:DB → Backend → test:Backend → Frontend → test:Frontend`. The dispatch carries `ATTEMPT`
  and `MAX_ATTEMPTS`. At `WAIT-ALL` the coordinator runs `TEST_COMMAND` itself rather than reading
  `TESTS_PASSING` off the reports. Must NOT lose `KNOWN_FAILURES` or the CORRECTION-mode branch.
  - **Consumes:** `@test-agent accepts ATTEMPT and MAX_ATTEMPTS in its dispatch` (F2)
  - **Consumes:** `add.build dispatches one implementation agent at a time` (F8)
  - **Produces:** `the coordinator runs TEST_COMMAND itself at the build WAIT-ALL`
- **F10** [product] — `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md`: the CORRECTION-mode
  dispatch carries `ATTEMPT` and `MAX_ATTEMPTS`. Its coordinator-side RED confirmation already exists
  and must NOT be duplicated.
  - **Consumes:** `@test-agent accepts ATTEMPT and MAX_ATTEMPTS in its dispatch` (F2)
- **F11** [product] — `framwork/.codeadd/commands/add.build.md`: a `BLOCKED` report becomes a routed
  row in the same run, by the path STEP 11.2 already uses to synthesise `ROUTED_ROWS` from validator
  output and build errors. No review document is involved and none is created.
  - **Consumes:** `@test-agent returns BLOCKED naming the assertion and the source symbol` (F1)
- **F12** [product] — `framwork/.codeadd/commands/add.plan-to-ready.md`: the third caller. Its STEP 4
  correction leg passes `AREAS`; its Build-stage `@test-agent` dispatch passes `ATTEMPT`,
  `MAX_ATTEMPTS` and `KNOWN_FAILURES`.
  - **Consumes:** `@fix-agent accepts AREAS and one ATTEMPT for the whole wave` (F6)
  - **Consumes:** `@test-agent accepts ATTEMPT and MAX_ATTEMPTS in its dispatch` (F2)
- **F13** [product] — `framwork/.codeadd/agents/test-agent.md` and both `tdd-pipeline` fragments: the
  final attempt carries an explicit `MODEL` one tier above the agent's declared model, matching
  `@fix-agent`'s round-3 escalation.
  - **Consumes:** `@test-agent accepts ATTEMPT and MAX_ATTEMPTS in its dispatch` (F2)

#### T2 — QA judgement under the feature (ref: `2026-09-13T120157-qa-judgement-under-the-feature.md`)

- **F14** [product] — `cli/src/features.js`: `qa-pipeline.commands` gains `add.review`, giving it the
  same four-command shape `tdd-pipeline` already has.
  - **Produces:** `qa-pipeline.commands includes add.review`
- **F15** [product] — `framwork/.codeadd/fragments/qa-pipeline/add.review.md`: new file carrying the
  QA steps as **five** section pairs — `step-list`, `preflight`, `evidence`, `judge-head`,
  `judge-tail`. The split at `judge-head` / `judge-tail` exists so the `plugin:playwright:drive` pair
  at `add.review.md:840` is never enclosed by a feature pair. Must NOT wrap that anchor.
  **The fragment is authored with the corrected wording already in it** — the governing statement
  carries no *"never judgement"* framing, preflight row 1 is absent, and STEP 9.3 has no feature-off
  branch. Those three edits live here and nowhere else: once this content leaves the base command,
  there is no later F-block that could reach it.
  - **Consumes:** `qa-pipeline.commands includes add.review` (F14)
  - **Produces:** `fragments/qa-pipeline/add.review.md declares five sections: step-list, preflight, evidence, judge-head, judge-tail`
- **F16** [product] — `framwork/.codeadd/commands/add.review.md`: five empty
  `<!-- feature:qa-pipeline:… -->` pairs at the matching anchors. **The pairs REPLACE the literal QA
  content, they do not sit beside it** — STEP 8, 9 and 10 with their headers, and the three plain
  `STEP 8: …` / `STEP 9: …` / `STEP 10: …` lines in the STEP-order block, all leave the base command.
  A pair left with content between its comments is what `assertEmptyMarkerPairs` refuses. The
  `step-list` pair sits beside the existing `feature:tdd-pipeline:step-list` pair, which is the worked
  precedent for gating that block.
  - **Consumes:** `fragments/qa-pipeline/add.review.md declares five sections: step-list, preflight, evidence, judge-head, judge-tail` (F15)
- **F17** [product] — `framwork/.codeadd/commands/add.review.md`: the two pieces of ungated text that
  genuinely stay in the base command and still describe the old boundary. The one-line command
  description that reads *"judges the rendered result through the absorbed QA sections"*, and STEP
  11's Quality Gate Report row, which stays ungated and must name the feature-off case beside the
  receipt-unmet case. Everything else that once read as the old boundary moved into F15's fragment.
- **F18** [product] — `framwork/.codeadd/commands/add.qa-setup.md`: its feature-off sentence names
  `add.plan` and `add.build` only; a judgement clause is appended.
- **F19** [product] — `framwork/.codeadd/skills/add-qa/SKILL.md`: the canonical *"Feature vs plugin"*
  statement gains a judgement clause. Load-bearing — the file states every consumer references this
  instead of restating it, so leaving it recreates the contradiction elsewhere.
- **F20** [product] — `cli/tests/loop-consolidation-0070.test.js`: the assertion that `qa-pipeline`
  gates "plan and build only" is the old boundary and moves with it. `EXPECTED_MAP` gains the
  `qa-pipeline` / `add.review` row and the total moves from 40 to 45. Its `playwright` / `add.review`
  row must remain at 1.
  - **Consumes:** `fragments/qa-pipeline/add.review.md declares five sections: step-list, preflight, evidence, judge-head, judge-tail` (F15)
- **F21** [product] — `cli/tests/build-artefact-graph.test.js`: the pinned node total moves by one —
  a new fragment is a new node — with one ledger comment naming this plan, in the running ledger the
  file already keeps.
  - **Consumes:** `fragments/qa-pipeline/add.review.md declares five sections: step-list, preflight, evidence, judge-head, judge-tail` (F15)
- **F22** [internal] — `CLAUDE.md`: the Feature Injection System table's `qa-pipeline` row gains
  `add.review`. Not a graph node, so no gate covers this file — it is checked by hand.

#### T3 — The shared surface

- **F23** [product] — `framwork/.codeadd/skills/add-ecosystem/SKILL.md`: **one F-block, three lines,
  both halves.** The `test-agent` row that says it "runs them until green"; the `add.review` command
  row that says "self-gating on the `/add.qa-setup` receipt"; the Features table row for
  `qa-pipeline`. It is last because it describes what F1-F22 leave behind.
  - **Consumes:** `@test-agent returns BLOCKED naming the assertion and the source symbol` (F1)
  - **Consumes:** `@test-agent accepts ATTEMPT and MAX_ATTEMPTS in its dispatch` (F2)
  - **Consumes:** `qa-pipeline.commands includes add.review` (F14)

### Does NOT Include (important!)

- **One git worktree per agent.** `build-setup.sh --worktree` already gives one per build; one per
  agent rewrites the dispatch model, and sequential dispatch removes the condition it would address.
- **`add.review`'s authoring of `## Fix Routing`.** The table's schema and ordering do not change;
  the per-area slicing F7 removes lives in `add.build`.
- **`add-framework--build` and the internal graph gate.** A separate plan covers
  `docs/brainstorming/2026-09-13T114957-brainstorm-graph-gate-placement.md`.
- **The judge rubric, the severity taxonomy, the `qa-validation` schema**, and the scripts that
  consume it. What the judges do does not change; whether they are dispatched does.
- **The `playwright` plugin split.** "Enabling the plugin does not enable the pipeline" stays true.
- **`task-brief.sh`.** The retry cap follows `@fix-agent`'s route — the dispatch — so the script needs
  no fifth argument.
- **The four artefacts resolved during planning** and listed under Current State.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Does `BLOCKED` consume an attempt? | No — it returns immediately | It means the agent established the red is not its to fix. Retrying does not change that; the counter is for "still fixing my own test" |
| Where does `@test-agent` sit in the sequential order? | **Interleaved per area** — `DB → test:DB → Backend → test:Backend → Frontend → test:Frontend` | User decision. Keeps the feedback loop short and the failure near its cause |
| What catches a test broken later by another area? | The coordinator's own `TEST_COMMAND` run at `WAIT-ALL` (F9) | Interleaving admits this class; F9 is what closes it, which makes F9 load-bearing for the chosen order rather than an improvement |
| `MAX_ATTEMPTS` value and route | 3, carried in the dispatch | Matches `@fix-agent` in this repo; `KNOWN_FAILURES` travels by brief and the cap by dispatch, and one field with one meaning must not have two routes |
| Merge `@fix-agent`, or serialise N of them? | Merge | A per-area agent cannot see the row that blocks its own. Merging is the precondition for `Blocked by`; F6's deferral instruction completes it |
| Merge `@test-agent` the same way? | No | It has no cross-area ordering to preserve, and full coverage for four areas in one context is the wrong trade |
| Gate QA judgement on the feature, or make the off-branch degrade honestly? | Gate it | Its input is authored by `@e2e-agent`, which the feature already gates. The alternative is recorded in the design with its rationale |
| Keep the `/add.qa-setup` receipt? | Yes — two gates, two questions | The feature decides whether the steps exist; the receipt decides whether they can run |
| Does the plan split by layer? | No | `CLAUDE.md` is the one `[internal]` F-block; the tag carries it |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Every red test has an authorised, reported ending | Build wall-clock — implementers and test agents no longer overlap |
| Coverage generated against finished source | The short loop where the agent fixes its own test while the implementer still works |
| Cross-area severity order and `Blocked by` honoured | `@fix-agent`'s single-area context guarantee |
| One writer on the tree, one full build run per wave | |
| `TESTS_PASSING` becomes trustworthy, so the existing cap can fire | |
| The feature flag means one thing for the whole QA flow | The nominal ability to judge QA with the pipeline disabled — which did not work |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| A large fix wave overloads the merged `@fix-agent`'s context — and the 2026-09-13 read-only delivery moved the validator's corrections onto it | Medium | F6 loads skills only for areas present in the rows; `MAX_ATTEMPTS` 3 with round-3 escalation already exists. L4.2 exercises a wave spanning three areas |
| `BLOCKED` is used to avoid work the agent could do | Medium | F1 requires naming the assertion and the source symbol; F9 has the coordinator run `TEST_COMMAND` itself, so the claim is checkable. L4.1 covers it |
| A feature marker pair encloses the playwright anchor and the build refuses to ship | Medium | F15's five-section split exists for this; `assertEmptyMarkerPairs` catches a mistake at build time. L1.3 asserts the anchor is unwrapped and L1.2 asserts the map |
| Serialising implementers slows every build, including for projects with `tdd-pipeline` off | High | Accepted by decision. F8 touches `add.build`'s ungated body, which is where the multi-writer tree lives |
| `CLAUDE.md` drifts — no gate covers it | Medium | F22 is an explicit F-block for that reason, and the Reviewer Handoff names it as a hunt target |
| A project with the receipt and the feature off loses QA judgement on upgrade | High — intended | It loses a path that produced a coverage blocker per screen. F15's rewritten governing statement, F18's `add.qa-setup` clause and F19's canonical statement are the three places a reader finds the remedy |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/agents/test-agent.md` | product | modify | Terminal state, cap, declared input, declared red, headline text (F1-F5, F13) |
| `framwork/.codeadd/agents/fix-agent.md` | product | modify | `AREAS`, one `ATTEMPT`, `Blocked by` deferral (F6) |
| `framwork/.codeadd/commands/add.build.md` | product | modify | Whole-wave fix dispatch and commit batch (F7); sequential implementers (F8); `BLOCKED` routed in flight (F11) |
| `framwork/.codeadd/fragments/tdd-pipeline/add.build.md` | product | modify | Interleaved post-implementation dispatch, cap, coordinator-side test run (F9) |
| `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md` | product | modify | Cap carried (F10, F13) |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | product | modify | Third caller of both agents (F12) |
| `cli/src/features.js` | product | modify | `qa-pipeline` gains `add.review` (F14) |
| `framwork/.codeadd/fragments/qa-pipeline/add.review.md` | product | **create** | Five section pairs carrying STEPs 8-10 (F15) |
| `framwork/.codeadd/commands/add.review.md` | product | modify | Five empty marker pairs (F16); the ungated text describing the old boundary (F17) |
| `framwork/.codeadd/commands/add.qa-setup.md` | product | modify | Judgement clause (F18) |
| `framwork/.codeadd/skills/add-qa/SKILL.md` | product | modify | Canonical Feature-vs-plugin statement (F19) |
| `cli/tests/loop-consolidation-0070.test.js` | product | modify | Boundary assertion and `EXPECTED_MAP` (F20) |
| `cli/tests/build-artefact-graph.test.js` | product | modify | Pinned node total and ledger line (F21) |
| `CLAUDE.md` | internal | modify | Feature Injection System table (F22) |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | product | modify | Three lines, both halves, one F-block (F23) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### Expected end-state injection map

The build must ASSERT this whole map, not only the changed row.

| Namespace | Name | Resource | Count |
|---|---|---|---|
| feature | tdd-pipeline | add.plan | 2 |
| feature | tdd-pipeline | add.build | 8 |
| feature | tdd-pipeline | add.review | 2 |
| feature | tdd-pipeline | add.hotfix | 1 |
| feature | qa-pipeline | add.plan | 2 |
| feature | qa-pipeline | add.build | 2 |
| **feature** | **qa-pipeline** | **add.review** | **5** ← new |
| plugin | playwright | add.review | 1 |
| plugin | playwright | qa-agent | 1 |

**Total: 40 → 45.** If the build lands a different split around the playwright anchor, it updates the
row and the total in the same F-block — never one without the other.

### L1 — Build-side unit (RED → GREEN)

1. `sidecarPoints()` has length 45. *RED today: 40.*
2. The per-resource breakdown matches the map above, `qa-pipeline`/`add.review` at 5 and
   `playwright`/`add.review` still at 1. *RED today: the qa row is absent.*
3. `add.review.md`'s `plugin:playwright:drive` pair is not enclosed by any `feature:` pair, and
   `node scripts/build.js` exits 0. *RED today: trivially green — this level exists to stay green and
   must be written before F16 so it can catch the mistake F15 is shaped to avoid.*
4. The pinned node total in `build-artefact-graph.test.js` matches the emitted graph. *RED after F15
   lands and before F21.*
5. `FEATURES['qa-pipeline'].commands` equals `['add.plan', 'add.build', 'add.review']`. *RED today.*

### L2 — Integration

1. With `qa-pipeline` disabled, the installed `add.review` contains none of STEPs 8, 9 or 10, and its
   STEP-order block lists none of them. *RED today: they are in the base body unconditionally.*
2. With `qa-pipeline` enabled, all five sections land exactly once each, and the playwright anchor
   still resolves.
3. `add.review`'s STEP 11 is present in both states. *RED today: it is already ungated, so this level
   guards against F17 moving it by accident.*
4. No file under `framwork/.codeadd/` still describes `@test-agent` as iterating until green, and none
   describes `@fix-agent` as taking a singular `AREA`. *RED today.*
5. `test-agent.md`'s `## Inputs` section lists `KNOWN_FAILURES`. *RED today: the field is used at line
   66 and declared nowhere.* Covers F3, which no other level reaches.
6. `add.qa-setup.md`'s feature-off sentence names `add.review` alongside `add.plan` and `add.build`.
   *RED today.* Covers F18.
7. `add-qa/SKILL.md`'s *"Feature vs plugin"* statement says judgement is gated by the feature.
   *RED today: it names authoring and correction only.* Covers F19.

### L3 — Combination matrix

Assert the END STATE of every combination, not merely that a change happened:

1. **All toggle states** — `tdd-pipeline` × `qa-pipeline` × `docs-pruning`, every expected section
   exactly once and every unexpected one absent.
2. **Shared-anchor non-collision** — `feature:tdd-pipeline:step-list` and
   `feature:qa-pipeline:step-list` both land in the STEP-order block, deterministically ordered.
3. **Partial disable** — disabling `qa-pipeline` leaves every `tdd-pipeline` section in `add.review`
   byte-untouched.
4. **Order independence** — enabling qa then tdd produces bytes identical to tdd then qa.
5. **Full round-trip** — enable everything, disable everything, bytes equal the pristine baseline.

### L4 — Behavioural acceptance

1. Given a test the agent wrote that fails because production code is wrong, the agent returns
   `BLOCKED` naming the assertion and the source symbol, does not edit source, does not soften the
   assertion, does not run any `git` command that removes work from the tree, and does not consume an
   attempt.
2. Given routed rows spanning three areas with a `Blocked by` pointing from a frontend row to a
   backend row, one `@fix-agent` dispatch works them in table order and defers the blocked row until
   its predecessor lands.
3. Given `qa-pipeline` disabled, `add.review` completes without dispatching `@ux-agent` or
   `@qa-agent`, and emits no `coverage: <screen> not captured` blocker.
4. Given a build in DEVELOPMENT mode, dispatch order is `DB → test:DB → Backend → test:Backend →
   Frontend → test:Frontend`, with no two agents in flight at once.

**RED expectations against the current tree:** L1.1, L1.2, L1.5, L2.1, L2.4, L2.5, L2.6, L2.7 and all
of L4 fail today. L1.3 and L2.3 are written green and exist as guards — they are never claimed as
RED→GREEN. L1.4 goes red between F15 and F21 by design.
**GREEN = all levels pass after F1-F23.**

**Every F-block has a level.** F1/F4 → L4.1; F2/F13 → L4.1 and L4.4; F3 → L2.5; F5 → L2.4;
F6 → L4.2; F7/F11 → L4.2; F8/F9/F10/F12 → L4.4; F14 → L1.5; F15/F16 → L1.1, L1.2, L1.3, L2.1, L2.2;
F17 → L2.3 and L2.1; F18 → L2.6; F19 → L2.7; F20 → L1.2; F21 → L1.4; F23 → L2.4.
**F22 (`CLAUDE.md`) is the sole exception and is disclosed as such** — it is not a graph node, no gate
covers it, and a reviewer reads it.

---

## Execution Order

```
F1 → F2 → F3 → F4 → F5          [product]  agents/test-agent.md — contract first
F6                              [product]  agents/fix-agent.md — contract first
F8 → F7 → F11                   [product]  add.build: serialise, then merge the wave, then route BLOCKED
F9 → F10 → F13                  [product]  the two tdd-pipeline fragments
F12                             [product]  add.plan-to-ready, the third caller
─────────── working state ───────────
F14 → F15 → F16 → F17           [product]  features.js, the fragment, the markers, the ungated text
F18 → F19                       [product]  add.qa-setup, add-qa
F20 → F21                       [product]  the two pinned test suites
F22                             [internal] CLAUDE.md
─────────── working state ───────────
F23                             [product]  add-ecosystem — both halves, last
```

- **F1 and F2 first** because F4, F5, F9, F10, F11, F12, F13 and F23 all consume what they produce.
- **F6 before F7 and F12** — both dispatch against the new `AREAS` contract.
- **F8 before F7.** Serialising the implementers first means the whole-wave fix dispatch lands into a
  command that already has one writer at a time, rather than the reverse.
- **F14 before F15 before F16.** The registration, then the fragment that the markers must match by
  section name, then the markers.
- **F20 and F21 after F15**, because both pin values the new fragment changes.
- **F23 last.** It describes the end state of both halves; written earlier it describes a tree that
  does not exist yet.

**Working-state boundaries.** After F12 the test half is complete and the repo builds and passes: a
build that must stop there has delivered T1 whole. After F22 the QA half is complete. F23 alone is a
documentation-only F-block and stopping before it leaves the code correct and one skill stale — the
only boundary where stopping costs accuracy rather than function.

**Per-F-block validation beyond the layer default.** F15, F16, F20 and F21 each run
`node scripts/build.js` and the L1 levels, because all four move the injection map or the node count.
F22 has no gate — a reviewer reads it.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves
   nothing. L1.3 and L2.3 are deliberately green from the start and must be labelled as guards, not
   claimed as RED→GREEN.
2. **The five-section split around the playwright anchor.** The count is a plan assumption, not a
   measurement. If the build landed a different number, the map row, the total and `EXPECTED_MAP` must
   all have moved together.
3. **`CLAUDE.md` (F22).** No gate covers it. Confirm the Feature Injection System table names
   `add.review` under `qa-pipeline`.
4. **`add-ecosystem` (F23) describing the end state, not the midpoint.** Three lines change; a review
   that finds two has found a leak.
5. **Text still describing the old shape.** L2.4 scans for it, but a scan matches strings, not
   meaning — check the four artefacts recorded as needing no change have genuinely not drifted.

## References

- Design set: `docs/brainstorming/2026-09-13T112232-test-agent-terminal-states-sequential-dispatch.md`,
  `docs/brainstorming/2026-09-13T120157-qa-judgement-under-the-feature.md`
- Prior art: `2026-09-12T221117-PLAN--agent-git-safety-and-dynamic-artefact-indexing` established
  `KNOWN_FAILURES`, `CONCERNS` and test-agent's git-safety section, and indexed fragments as graph
  nodes. `2026-09-13T100745-PLAN--readonly-agent-dispatch-capability` established that agents return
  their products and the coordinator writes, and moved the per-area validator's corrections onto
  `@fix-agent`.

---

## Next Steps

/add-framework--build test-terminal-states-and-qa-feature-boundary

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-13 | Initial creation |
| 2026-09-13 | Review `fix-then-ok` applied. The three edits that relocate with the QA content moved from F17 into F15, which now authors the fragment with corrected wording; F16 states the marker pairs replace the literal content rather than sitting beside it; F17 shrank to the two edits that stay in the base command. Added L2.5, L2.6 and L2.7 so F3, F18 and F19 each have a level, plus an explicit F-block→level map naming F22 as the sole disclosed exception. Current State now names all three stale `add-ecosystem` statements |
| 2026-09-14 | Implemented. F1-F23 as planned (F3 a no-op, premise already satisfied). F24-F29 opened for regressions the plan did not foresee: two more stale add-ecosystem rows, L2.4's false-positive scan, an ungated pointer into the moved steps, and three pinned suites. The STEP 7 review then found 33 findings; F30-F41 applied 26 of them — chief among them that provider-map.json is what ships an agent description, that eleven more ungated pointers were still live, and that four validation levels could not fail. Commits 44035ef..06f75c8 |
