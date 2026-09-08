# Brainstorm: `/add.plan-to-ready` — The Bounded Convergence Loop

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-08-24
> **Type:** command
> **Umbrella:** `2026-08-24-development-loop-consolidation-000-umbrella.md` (topic 05 of 05)

## Discovery

- `add.autopilot.md` (677 lines) already occupies this role and is linear: STEP 5 planning agent, STEP 6 development agents, STEP 8 review agent, STEP 9–10 gates, STEP 11 report. It **never reaches `add.done`** — its completion report merely suggests it.
- Its dispatch pattern is the depth-2 defect: it dispatches `@architecture-agent` with *"Read `{{cmd:add.plan}}` — PRIMARY reference"*, and `add.plan` then instructs that agent to dispatch area subagents. Subagents are leaf-only, so the dispatched agent must degrade to inline execution and loses the parallel fan-out.
- It carries genuinely good machinery worth preserving: a **Decision Log** propagated to every agent instead of raw context, per-step **idempotency guards** keyed on `iterations.jsonl`, a coordinator-only write rule for `tasks.md` ticks, and an explicit "coordinator answers add.plan's clarification questions itself, a dispatched add.plan has no human addressee" rule.
- `add.review` STEP 8.3 is the manual version of the loop: four branches evaluated top-to-bottom, including the `/add.qa` to `/add.build qa` cycle and the explicit *"NEVER route directly to `/add.done`."*
- `add.done` STEP 4.0/4.1/4.2 are the delivery gates: `review.md` exists with `Overall = PASSED`; the `> QA baseline:` line present (**never inferred**); `epic.md` has no pending subfeature; `plan.md` `## Cobertura de Requisitos` shows zero uncovered.
- `add.done` has **zero loop semantics** — every gate failure stops with a pointer to another command. It is the clean terminal node.
- `tasks.md` is already the execution state machine: 5 sections, `[ ]` / `[x]` / `[!]` ticks, `### Known Issues`, and a `RESUME_MODE = resume | rerun_all` procedure that makes re-invocation resumable.
- `iterations.jsonl` and `decisions.jsonl` already record per-iteration history via `log-jsonl.sh`.
- `build-setup.sh` owns branch setup and must exit 0 before any implementation; `status.sh` emits `FEATURE_ID`, `HAS_PLAN`, `HAS_TASKS`, `HAS_EPIC`, `EPIC_CURRENT_SF`, `LAST_CHECKPOINT`, `WIKI:present`, `SETUP_QA:*`.
- **Plan 0069** established the bounded review shape: gate, dispatch, verdict (`ok` / `fix-then-ok` / `blocked`), one re-dispatch, then stop for the user.

## Context & Motivation

The delivery loop exists today as prose the user executes by hand. `add.review` STEP 8.3 describes it precisely enough to be machine-actionable, and `add.done` re-validates freshness because it cannot trust that the user followed it.

Topics 01 through 04 make an executable version tractable: three commands to coordinate instead of five, every heavy unit owning a named leaf agent dispatchable at depth 1, and a judge that no longer moves what it judges. This topic spends that groundwork.

The user keeps the parts that need human judgement — `/add.brainstorm` to explore, `/add.new` to write `about.md` and `discovery.md` — and hands off the mechanical remainder. The merge stays human too: the command converges and returns control.

## Problem / Opportunity

**1. `add.autopilot` cannot be fixed in place.** Its contract (linear, terminates before `done`, dispatches commands as agents) differs from the new one on every axis. Refactoring it would mean keeping a name whose documented behaviour is wrong during the entire transition, while it also references `add.test` and `add.qa`, which topics 03 and 04 delete.

**2. "100% validated" needs one definition, not two.** If the loop invents its own stop condition, it can converge on something `add.done` then rejects — reproducing by hand exactly the friction the command exists to remove.

**3. An unbounded loop is an unsupervised token furnace.** A finding the agent cannot fix loops forever with no human in the circuit.

**4. Re-planning must not be destructive.** Running `add.plan` every cycle keeps the plan current, but a naive re-run would overwrite a plan the user reviewed and approved.

**5. The loop must not invent state.** Every signal it needs already exists on disk. A new state file would be a second source of truth that drifts from `tasks.md`.

## Proposed Solution

**Recommended — a main-loop coordinator that dispatches named leaf agents, converges against the `add.done` gates in dry-run, and stops.**

**Shape.** `/add.plan-to-ready [F[NNNN]]` runs at depth 0. It never dispatches "a command"; it dispatches the same named agents that `add.plan`, `add.build` and `add.review` dispatch, using the agent lists those commands expose. Every dispatch is depth 1. Fan-out is preserved, and the coordinator receives reports rather than transcripts.

This applies to **all three legs, plan included**. `add.plan` is itself a coordinator over a named roster (`@discovery-agent`, `@ux-flow-agent`, `@ux-layout-agent`, `@ux-agent`, `@database-agent`, `@backend-agent`, `@frontend-agent`, `@architecture-agent`). `/add.plan-to-ready` takes over that coordinator role for the invocation and dispatches the roster itself. It must **not** dispatch one subagent told to "read `{{cmd:add.plan}}` and execute it" — that is precisely `add.autopilot`'s depth-2 defect.

**Flow.**

1. **Bootstrap** — `status.sh`; validate `about.md` and `discovery.md` exist (stop otherwise, pointing at `/add.new`); `build-setup.sh` must exit 0. **Initialize the Decision Log here**, seeded from `status.sh` output (feature id, mode, `HAS_PLAN`/`HAS_DESIGN`/`HAS_EPIC`), the scope read from `about.md`, and the last 20 `pivot` entries from `.codeadd/project/decisions.jsonl`. Every dispatched agent receives the accumulated log; none receives raw transcripts.
2. **Plan** — always run, under the mutator cache rule: read the existing `plan.md` and `about.md`, preserve valid content, complement, bump `updated:`; `id:` / `created:` / `type:` are immutable. The coordinator answers any clarification questions itself from the Decision Log.
3. **Loop, at most 3 iterations:**
   - **Build leg** — implementation and validation agents per area; with `tdd-pipeline` on, test generation and the RED gate; with `qa-pipeline` on, `@e2e-agent` spec authoring. From iteration 2 onward the build leg is a **correction leg**: `@fix-agent` consumes the previous iteration's `## Fix Routing` table. **The coordinator then performs the resolution write-back itself** — appending what was corrected, per routed row, into the previous round's `review-NNN.md` and marking it finalized. Topic 04 assigns that write to `add.build`'s coordinator level, not to a dispatched agent, and this command takes over `add.build`'s coordinator role for the invocation; without this the loop's intermediate rounds would produce review documents that never close, diverging from the same rounds run manually.
   - **Review leg** — read-only. Code review, spec compliance, and with `qa-pipeline` on the absorbed preflight / evidence / judgement sections. Emits `review-NNN.md` and a `## Fix Routing` table.
   - **Convergence check** — evaluate the `add.done` gates in dry-run (STEP 4.0–4.2 only; those are pure reads. STEP 5's `qa-evidence.sh promote` has side effects and must never run here). Converged, or continue.
   - **No-progress check** — if this iteration's `## Fix Routing` findings match the previous iteration's by `(area, file, symptom)`, stop early and report the resistant findings.
4. **Report** — name the outcome as exactly one of three states, never softened into one another:
   - **CONVERGED** — every dry-run gate passed. On a subfeature-scoped run this means that subfeature is ready and the report names the remaining ones. Next command: `/add.done`, or `/add.plan-to-ready` for the next subfeature.
   - **CAP_REACHED** — 3 iterations spent with gates still failing. Next command: `/add.build` for the open `## Fix Routing` rows, or re-invoke after triage.
   - **BLOCKED** — no-progress detected, or a gate failed for a reason the loop cannot act on (missing `about.md`, `build-setup.sh` non-zero, stale QA setup). The next command names the specific remedy.

   Alongside the state: the iteration count, the resistant findings if any, and the path to the highest `review-NNN.md`.

**The 3-iteration cap is per invocation, not cumulative.** Re-invoking after CAP_REACHED grants a fresh budget — deliberately, because re-invocation is a human act and that human is the circuit breaker Problem 3 asks for. The report states the cumulative round count read from `iterations.jsonl` so that human sees the true total.

**Convergence is the `add.done` gate set, evaluated without side effects:** highest `review-NNN.md` exists with `Overall = PASSED`; its `> QA baseline:` line is present and valid; `epic.md` has no pending subfeature (evaluated only when `epic.md` exists — a simple feature does not require one); `plan.md` `## Cobertura de Requisitos` shows zero uncovered. One definition of "ready", shared by the loop and by the step that consumes it.

**Epic scoping.** `add.done` STEP 4.1 requires every subfeature to be `done`, which an invocation targeting a single non-final subfeature can never satisfy — it would report non-convergence for a reason unrelated to any finding. For a subfeature-scoped invocation that one gate is replaced by its subfeature-scoped equivalent: the targeted subfeature's own `tasks.md` acceptance checklist complete, and its `epic.md` row ready to move to `done`. The other three gates are evaluated unchanged. CONVERGED then means "this subfeature is ready", and the report names the remaining subfeatures so it is never read as "the epic is ready".

**State comes from disk, not from memory.** `tasks.md` for execution state and `RESUME_MODE`, `review-NNN.md` for verdicts and findings, `qa-evidence.sh working-baseline` for the QA baseline, `iterations.jsonl` for round history. This is also what makes the command safely re-invocable after an interruption.

**Preserved from `add.autopilot`:** the Decision Log, the per-step idempotency guards, the coordinator-only `tasks.md` write rule, and the "coordinator answers `add.plan`'s questions itself" rule.

**Alternative A — Shape A, inline command execution at depth 0.** Rejected: build, review and QA accumulate in one context across three iterations, and mid-loop compaction would silently drop the convergence evidence. It is also the shape `add.autopilot` already is.

**Alternative B — refactor `add.autopilot` in place.** Rejected: every axis of its contract changes, and the name would document wrong behaviour throughout the transition.

**Alternative C — unbounded loop.** Rejected: no human in the circuit to interrupt a finding the agent cannot fix.

## Type of Artefact

command

## Scope

### Includes

- `commands/add.plan-to-ready.md` — new, with frontmatter and `argument-hint`
- Deleting `commands/add.autopilot.md` and its `provider-map.json` entry
- Registering `add.plan-to-ready` in `provider-map.json` (all 5 providers)
- The bounded loop: 3 iterations maximum, plus early exit on no-progress
- Convergence evaluated as the `add.done` gates in dry-run
- Correction-leg semantics: from iteration 2, the build leg consumes `## Fix Routing`
- Per-iteration logging via `log-jsonl.sh` into `iterations.jsonl`
- Feature-aware legs: `tdd-pipeline` and `qa-pipeline` each change what the legs do, honouring self-detection
- Re-invocation safety via `tasks.md` `RESUME_MODE` and the existing idempotency guards
- Acceptance checks for the loop's own behaviour: the no-progress detector fires on two identical rounds and not on one; the CAP_REACHED path reports the correct state; the dry-run convergence check produces no filesystem side effects; `add.plan`'s `id:` / `created:` / `type:` survive the mutator leg unchanged
- Rerouting every `/add.autopilot` reference (`add.md` suggestion table, `add-ecosystem`, README, web, SVGs)
- Running `/add-framework--sync` after the change to regenerate docs and diagrams

### Does NOT Include

- Running `add.done` or merging — the command stops at convergence and returns control
- Absorbing `add.new` or `add.brainstorm` — discovery stays human
- Changing `add.plan`, `add.build`, `add.review` or `add.done` beyond what topics 01–04 already change
- A new state file, a new receipt, or a new schema
- A configurable iteration cap in v1 (3 is fixed; make it configurable only if evidence demands it)
- Epic-wide execution: v1 targets one feature or one subfeature per invocation, matching `add.build`'s current scoping

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Named `/add.plan-to-ready` | States the scope and the boundary honestly; sorts beside `/add.plan`, where the flow starts | ✅ |
| Stops at convergence; `add.done` stays with the user | The merge decision stays human, and the name does not promise a step the command does not take | ✅ |
| Shape B — dispatches named leaf agents, not commands | Depth 1 is Claude's budget; dispatching commands reproduces `add.autopilot`'s defect | ✅ |
| `add.plan` always runs, under the mutator cache rule | Keeps the plan current before each cycle without overwriting a reviewed plan | ✅ |
| Convergence equals the `add.done` gates in dry-run | One definition of "ready"; impossible to converge on something the next step rejects | ✅ |
| Cap of 3 iterations | Covers criticals, majors and most mids/lows; after 3 rounds the agent finalises and reports | ✅ |
| Early exit on no-progress, keyed on `(area, file, symptom)` | Stops the loop burning tokens on a correction that is not landing; only ever saves rounds | ✅ |
| From iteration 2, the build leg is a correction leg over `## Fix Routing` | The universal contract from topic 04 is what the loop exchanges | ✅ |
| No new state file | `tasks.md`, `review-NNN.md`, `iterations.jsonl` and `qa-evidence.sh` already carry every signal; a new file would be a second source of truth | ✅ |
| `add.autopilot` deleted, not refactored | Its contract differs on every axis and it references two commands that topics 03 and 04 delete | ✅ |
| Decision Log, idempotency guards and coordinator-only `tasks.md` writes are carried over | They are the parts of `add.autopilot` that were right | ✅ |
| v1 scopes to one feature or subfeature per invocation | Matches `add.build`'s existing scoping; epic-wide iteration is a separate decision | ✅ |
| Blocked convergence reports rather than escalating | Plan 0069's precedent: remaining blockers stop for the user | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `commands/add.plan-to-ready.md` | New | The loop coordinator |
| `commands/add.autopilot.md` | Deleted | Remove file plus its `provider-map.json` entry |
| `framwork/provider-map.json` | One entry removed, one added | Registry |
| `commands/add.plan.md` | Consumed as a mutator; unchanged | Verify the cache rule holds when the caller is not human |
| `commands/add.build.md` | Consumed via its agent list (topic 02) | No change in this topic |
| `commands/add.review.md` | Consumed via its agent list; supplies `review-NNN.md` and `## Fix Routing` (topic 04) | No change in this topic |
| `commands/add.done.md` | Its gates are read in dry-run by the loop | Gate semantics must be expressible without side effects |
| `commands/add.md` | Suggestion table names `/add.autopilot` | Update |
| `.claude/commands/add-framework--sync.md:160` | Main-flow command list names `add.autopilot` (and `add.test`) | Internal layer — companion self-plan |
| `.claude/skills/add-framework-development/SKILL.md:206` | Documents `--yolo` as "supported ONLY by `add.review` and `add.autopilot` (which forwards it)" | Internal layer — companion self-plan. `/add.plan-to-ready` does **not** inherit `--yolo`: it is autonomous by contract, and with a read-only `add.review` the flag's auto-correct half no longer exists |
| `skills/add-ecosystem/SKILL.md` | Command table plus the whole routing graph | Regenerate |
| `README.md`, `web/src/pages/docs.astro`, `web/public/*.svg` | Command cards, flows and the Cytoscape graph | `/add-framework--sync` |
| `CLAUDE.md` | Command count (18 becomes 16) | Update |
| `cli/tests/*` | Command inventory assertions | Update |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| An executable delivery loop instead of a documented one | An orchestrator that also merges (what `add.autopilot` promised and never delivered) |
| One shared definition of "ready" across the loop and `add.done` | The `/add.autopilot` name and its muscle memory |
| Bounded, observable iteration with a per-round audit trail | A fixed cap that some features will legitimately exceed |
| Fan-out preserved at depth 1 on all five providers | — |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The loop converges on iteration 3 with real findings still open and the user reads it as done | Medium | The report must distinguish CONVERGED from CAP_REACHED and BLOCKED explicitly, and never present the last two as success |
| `add.done`'s gates cannot be evaluated without side effects | Medium | Verify early: STEP 4.0–4.2 are pure reads, but STEP 5 (`qa-evidence.sh promote`) is not — the dry-run must stop before it |
| No-progress detection produces false positives and stops too early | Medium | Key on `(area, file, symptom)`, not on free text; require two consecutive identical rounds, not one |
| Coordinator context still overflows across 3 iterations | Medium | Reports only, never transcripts; convergence read from files each round rather than remembered |
| The loop re-runs `add.plan` and mutates a plan the user approved | Medium | The cache rule is the mitigation and it already exists; make immutability of `id:` / `created:` / `type:` an acceptance test |
| Deleting `add.autopilot` breaks a user's workflow with no migration path | Medium | The completion notice for the removed command should name `/add.plan-to-ready`; document the mapping in the release notes |
| The command ships before topics 01–04 land and silently half-works | High if sequenced wrong | It is last for this reason; it is the only topic that cannot ship partially |

## Next Steps

Run: `/add-framework--plan create add.plan-to-ready, the bounded convergence loop, and remove add.autopilot`

Then, as a companion for the internal layer:

Run: `/add-framework--self-plan drop add.autopilot from add-framework--sync and from the --yolo note, and update CLAUDE.md command counts`
