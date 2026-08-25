---
description: Bounded convergence loop — plans, then loops build ⇄ review at most 3 times against the /add.done gates evaluated in dry-run, dispatching named leaf agents at depth 1. Converges and returns control; the merge stays human
argument-hint: "[F[NNNN]] [SFxx]  (e.g. /add.plan-to-ready F0042  ·  /add.plan-to-ready F0042 SF03)"
---

# Plan-to-Ready — Bounded Convergence Loop

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).

Runs the delivery loop that is otherwise prose the user executes by hand: plan,
then `build ⇄ review` until the feature satisfies the same gates `/add.done`
enforces. It **converges and returns control** — it never merges.

You are the coordinator, at depth 0. You dispatch **named leaf agents at depth 1**
and receive their reports. You never dispatch a command.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Bootstrap            → status.sh, validate prerequisites, build-setup.sh
STEP 2: Initialize Decision Log → seeded from status.sh + about.md + decisions.jsonl
STEP 3: Plan leg             → dispatch the planning roster; mutator cache rule
STEP 4: Build leg            → implementation roster; from iteration 2 a correction leg
STEP 5: Review leg           → read-only; produces review-NNN.md + ## Fix Routing
STEP 6: Convergence check    → /add.done STEP 4.0–4.2 in dry-run (pure reads)
STEP 7: No-progress check    → two consecutive identical finding sets
STEP 8: Loop or exit         → back to STEP 4, or out with one of three states
STEP 9: Report               → CONVERGED | CAP_REACHED | BLOCKED, never softened
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF about.md OR discovery.md IS MISSING:
  ⛔ DO NOT USE: Write on any source file
  ⛔ DO NOT: Dispatch any agent
  ✅ DO: Report BLOCKED naming /add.new, and STOP

IF build-setup.sh EXITED NON-ZERO:
  ⛔ DO NOT USE: Write or Edit on any source file
  ⛔ DO NOT: Enter the loop
  ✅ DO: Show its stderr verbatim, report BLOCKED, and STOP

IF DISPATCHING ANY AGENT:
  ⛔ DO NOT: Instruct it to read a command file and execute it
  ⛔ DO NOT: Instruct it to dispatch another agent
  ✅ DO: Dispatch a named leaf agent from the roster with its own inputs

DURING THE CONVERGENCE CHECK (STEP 6):
  ⛔ DO NOT USE: Bash to run `qa-evidence.sh promote`
  ⛔ DO NOT USE: Write, Edit, or any filesystem mutation
  ✅ DO: Read only — /add.done STEP 4.0 through 4.2 and nothing beyond

IF ITERATION COUNT WOULD EXCEED 3:
  ⛔ DO NOT: Start another build leg
  ⛔ DO NOT: Report the outcome as success
  ✅ DO: Exit reporting CAP_REACHED with the open rows
```

**ABSOLUTE INVARIANTS:**

- **DEPTH 1 ONLY:** every dispatch is a named leaf agent. Subagents are leaf-only; an agent told to run a command must dispatch further and silently degrades to inline execution, losing the fan-out.
- **CAP IS 3 PER INVOCATION, NOT CUMULATIVE.** Re-invoking grants a fresh budget deliberately — re-invocation is a human act, and that human is the circuit breaker.
- **NO NEW STATE.** `tasks.md`, `review-NNN.md`, `iterations.jsonl` and `qa-evidence.sh` already carry every signal. A new state file would be a second source of truth that drifts.
- **REPORTS, NEVER TRANSCRIPTS.** Agents return reports; convergence is re-read from files each round rather than remembered.
- **COORDINATOR IS THE SOLE `tasks.md` WRITER.** Validators emit tick reports; this command merges and writes.
- **THE MERGE STAYS HUMAN.** This command never runs `/add.done` and never merges.
- **IMMUTABILITY:** never allocate a new `[NNNN]F`. `id:`, `created:` and `type:` are immutable; every mutation bumps `updated:`.

---

## Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only, read-write, full-access)
2. Read the **Complexity** hint (light, standard, heavy)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. If your engine supports parallel dispatch and mode is `parallel`, dispatch all simultaneously
5. Verify output exists before proceeding past any WAIT or GATE CHECK

You are the coordinator. You know your engine's capabilities. Map the intent to
the best available mechanism. If a named agent is not installed, dispatch a
generic subagent at the same capability plus the named skill — every dispatch
directive here is self-sufficient inline.

---

## Agent Rosters

This command takes over the coordinator role of `/add.plan`, `/add.build` and
`/add.review` for the invocation, and dispatches **their** rosters directly.

| Leg | Roster |
|-----|--------|
| Plan | `@discovery-agent`, `@ux-flow-agent`, `@ux-layout-agent`, `@ux-agent` (critique), `@database-agent`, `@backend-agent`, `@frontend-agent`, `@architecture-agent` |
| Build | `@database-agent`, `@backend-agent`, `@frontend-agent`, `@test-agent` (with `tdd-pipeline`), `@e2e-agent` (with `qa-pipeline`), `@reviewer-agent` (area validation), `@fix-agent` (correction) |
| Review | `@reviewer-agent` (frontend ∥ backend, read-only), `@ux-agent` (review mode) ∥ `@qa-agent` (with the QA receipt present) |

⛔ Dispatching one agent told to "read `{{cmd:add.plan}}` and execute it" is the
depth-2 defect this command exists to avoid. Dispatch the roster.

---

## STEP 1: Bootstrap

1. Run `bash .codeadd/scripts/status.sh`. Parse `FEATURE_ID`, `HAS_PLAN`, `HAS_DESIGN`, `HAS_EPIC`, `EPIC_CURRENT_SF`, `HAS_TASKS`, `LAST_CHECKPOINT`, `WIKI:`, `SETUP_QA:`.
2. Resolve the target: explicit `F[NNNN]` arg > `FEATURE_ID` from the branch. With `SFxx` given, or `HAS_EPIC=true`, the scope is that one subfeature.
3. Validate `about.md` and `discovery.md` exist for the scope. If either is missing → report BLOCKED naming `{{cmd:add.new}}` and STOP.
4. Run `bash .codeadd/scripts/build-setup.sh <FEATURE_ID>`. It MUST exit 0 before any implementation. On non-zero: show stderr verbatim, report BLOCKED, STOP — never auto-resolve.
5. Re-run `status.sh` on the feature branch.

**Feature flags.** Read the enabled features once; they change what the legs do:
`tdd-pipeline` on → test generation and the RED gate are part of the build leg;
`qa-pipeline` on → `@e2e-agent` authors specs in the build leg. Honour the
self-detection notices — a disabled feature is stated once, never silently skipped.

---

## STEP 2: Initialize the Decision Log

Every dispatched agent receives the accumulated Decision Log. **None receives a
raw transcript** — that is what keeps this coordinator's context survivable across
three iterations.

Seed it from:
- `status.sh` output — feature id, mode, `HAS_PLAN` / `HAS_DESIGN` / `HAS_EPIC`;
- the scope read from `about.md`;
- the last 20 `"type":"pivot"` entries from `.codeadd/project/decisions.jsonl`, formatted `[agent] pivoted from "[from]" → "[decision]": [reason]`.

Append to it after every leg. It is working memory, not a persisted artefact.

---

## STEP 3: Plan Leg (always runs, once)

Dispatch the **plan roster** and consolidate their outputs into `plan.md` (and
`design.md` when the feature touches UI), applying `/add.plan`'s own consolidation
rules.

Resolve `design.md` per the `feature-design` **Location** rule in
`{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first,
feature-level fallback) — the same rule every other leg uses. On an epic the
feature-level path is normally empty, so warning from it alone is a false alarm.

**Mutator cache rule (MANDATORY).** Read the existing `plan.md` and `about.md`
first, preserve valid content, complement with new information, bump `updated:`
to today.

⛔ `id:`, `created:` and `type:` are **immutable**. A plan leg that rewrites any
of them has corrupted a document the user approved.

**Clarification questions.** `/add.plan`'s roster has no human addressee here.
Answer any clarification from the Decision Log yourself. Do NOT stop to ask the
user — that is what makes this loop autonomous.

**Idempotency guard:** on re-invocation with `plan.md` already current for the
scope (no new requirements in `about.md` since its `updated:`), skip the roster
and record the skip in the Decision Log.

---

## STEP 4: Build Leg

**Iteration 1 — implementation.** Dispatch the build roster per area, following
the dependency order (contract tests → database → backend → parallel workers +
frontend). Dispatch the area validator immediately after each area agent returns.

**Iteration 2 and later — correction leg.** The build leg consumes the previous
round's `## Fix Routing` table from `review-NNN.md`:

1. Dispatch `@fix-agent` per affected area, in the table's order, respecting `Blocked by`. Pass `AREA`, that area's `ROUTED_ROWS`, `ATTEMPT`, `MAX_ATTEMPTS = 3`, and `BUILD_ERRORS` where relevant.
2. Rows returned `NOT_MINE` (`data-seed`, `env-boot`, capability-invalid, `@ux-agent` design-spec without a citation) are collected for the report as user decisions — never silently re-dispatched.
3. **Write the resolution annex yourself.** Append one row per routed ID into the **previous round's** `review-NNN.md` `## Resolution Annex`, append-only, then set that document's `status: finalized` exactly once.

⛔ The annex write is the COORDINATOR's, not a dispatched agent's. `/add.build`
assigns it to its coordinator level, and this command holds that role for the
invocation. Without it the loop's intermediate rounds leave review documents that
never close — diverging from the same rounds run by hand.

**Idempotency guards (carried from the previous orchestrator):** before
dispatching an area agent, check for existing area files from this round; before
re-validating, check `iterations.jsonl` for a validator entry from this round.

**Coordinator-only `tasks.md` writes.** Validators emit tick reports; merge them
and perform the single write.

---

## STEP 5: Review Leg (read-only)

Dispatch the review roster. The review is **read-only on code** — it produces
findings, never fixes.

It emits, for the scope:
- `docs/features/${FEATURE_ID}/review-NNN.md`, including the unified `## Fix Routing` table;
- one `_tests/run-NNN/qa-validation-NNN.md` per in-scope `SCOPE_DIR`, when the `/add.qa-setup` receipt is present.

⛔ If the review leg reports that it modified any file under `git diff --name-only`,
treat it as a contract violation: STOP the loop and report BLOCKED naming the
paths. A judge that moves what it judges cannot converge.

---

## STEP 6: Convergence Check (DRY-RUN)

Convergence **is** `/add.done`'s gate set, evaluated without side effects. One
definition of "ready", shared by this loop and by the step that consumes it — so
it is impossible to converge on something `/add.done` then rejects.

Evaluate `/add.done` **STEP 4.0 through 4.2 only**. Those are pure reads.

| # | Gate | Pass condition |
|---|------|----------------|
| 1 | Review verdict | The highest `review-NNN.md` exists and its `\| **Overall** \|` row reads PASSED |
| 2 | QA baseline | Its `> **QA baseline:**` line is present and valid. NEVER inferred |
| 3 | Epic completeness | `epic.md` has no pending subfeature — evaluated **only when `epic.md` exists**; a simple feature does not require one |
| 4 | Requirements coverage | `plan.md` `## Cobertura de Requisitos` shows zero uncovered |

⛔ DO NOT evaluate `/add.done` STEP 5 or beyond. `qa-evidence.sh promote` has
side effects and must never run here — promotion belongs to `/add.done` alone.

**Subfeature-scoped invocation.** Gate 3 can never be satisfied by a run
targeting one non-final subfeature, and would report non-convergence for a reason
unrelated to any finding. For a subfeature-scoped run, replace **gate 3 only**
with its scoped equivalent: the targeted subfeature's own `tasks.md` acceptance
checklist is complete and its `epic.md` row is ready to move to `done`. Gates 1,
2 and 4 are evaluated unchanged.

CONVERGED then means "**this subfeature** is ready" — and STEP 9 MUST name the
remaining subfeatures so it is never read as "the epic is ready".

---

## STEP 7: No-Progress Check

Compare this iteration's `## Fix Routing` findings against the previous
iteration's, keyed on **`(area, file, symptom)`** — never on free text.

| Condition | Action |
|-----------|--------|
| Fewer than 2 completed iterations | Do not evaluate; continue |
| Sets differ | Progress. Continue |
| **Two consecutive identical sets** | Stop early. Exit BLOCKED, naming the resistant findings |

⛔ One identical round is NOT enough to fire. Requiring two consecutive is what
keeps a slow-but-real correction from being cut off.

---

## STEP 8: Loop or Exit

```
IF all convergence gates passed        → exit CONVERGED
IF no-progress fired                   → exit BLOCKED (resistant findings)
IF a gate failed for a reason the loop cannot act on → exit BLOCKED (specific remedy)
IF iteration count = 3                 → exit CAP_REACHED
ELSE                                   → iteration += 1, return to STEP 4
```

Log each iteration before continuing:

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "loop" "/add.plan-to-ready" '"iteration":N,"state":"<state>","findings":N'
```

---

## STEP 9: Report

Report exactly ONE of three states. They are distinct outcomes and NEVER softened
into one another:

| State | Meaning | Next command |
|-------|---------|--------------|
| **CONVERGED** | Every dry-run gate passed | `{{cmd:add.done}}` — or `/add.plan-to-ready` for the next subfeature |
| **CAP_REACHED** | 3 iterations spent, gates still failing | `{{cmd:add.build}}` for the open `## Fix Routing` rows, or re-invoke after triage |
| **BLOCKED** | No progress detected, or a gate failed for a reason the loop cannot act on (missing `about.md`, `build-setup.sh` non-zero, stale QA setup) | The specific remedy, named |

⛔ NEVER word CAP_REACHED or BLOCKED as success, and NEVER present either as
"done with minor issues". A run that spent its budget with gates still red did
not deliver a ready feature, and reporting it as if it did is the failure this
three-state split exists to prevent.

Alongside the state, report:
- iterations spent this invocation, and the **cumulative** round count read from `iterations.jsonl` — the cap is per invocation, so only the cumulative figure shows the true total;
- resistant findings, if any;
- rows returned `NOT_MINE` or presented-not-dispatched, as user decisions;
- the path to the highest `review-NNN.md`;
- on a subfeature-scoped CONVERGED run, the remaining subfeatures.

---

## Rules

ALWAYS:
- Dispatch named leaf agents at depth 1, passing the Decision Log
- Re-read convergence signals from disk each round rather than remembering them
- Write the resolution annex into the previous round's review document yourself
- Answer the plan roster's clarification questions from the Decision Log
- State the cumulative round count alongside the per-invocation count

NEVER:
- Run `/add.done`, merge, or promote QA evidence
- Dispatch an agent that must dispatch another agent
- Invent a state file — every signal already exists on disk
- Stop to ask the user mid-loop; this command is autonomous by contract
- Accept `--yolo`; it is autonomous already, and the review it drives has no auto-correct half to unlock
