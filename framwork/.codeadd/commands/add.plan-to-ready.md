---
description: Bounded convergence loop — plans, then loops build ⇄ review at most 3 times against the /add.done gates evaluated in dry-run, dispatching named leaf agents at depth 1. On an epic target given with no SFxx, runs every pending subfeature in dependency order, checkpointing (commit + tag + push) between each. Every subfeature that converges is checkpointed — epic run or SFxx-scoped run alike. Converges and returns control; the merge stays human
argument-hint: "[F[NNNN]] [SFxx]  (e.g. /add.plan-to-ready F0042  ·  /add.plan-to-ready F0042 SF03  ·  /add.plan-to-ready F0042 alone on an epic runs every pending subfeature)"
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
STEP 3: Plan leg             → dispatch the planning roster; mutator cache rule; checks plan.md (+ design.md) exist; @plan-reviewer-agent verdict gate
STEP 4: Build leg            → implementation roster; from iteration 2 a correction leg; checks the resolution annex landed
STEP 5: Review leg           → read-only; produces review-NNN.md + ## Fix Routing; checks outputs exist on disk
STEP 6: Convergence check    → converge-gates.sh; all four gates ok, not-probed never counts as a pass
STEP 7: No-progress check    → two consecutive identical finding sets
STEP 8: Loop or exit         → back to STEP 4, or out with one of three states
STEP 9: Report               → CONVERGED | CAP_REACHED | BLOCKED, never softened
```

**Epic target (no `SFxx`, `HAS_EPIC=true`):** STEP 3 through STEP 8 repeat once
per pending subfeature, in dependency order — see "Epic Mode: The Outer Loop"
below STEP 2. STEP 9 still fires exactly ONCE, after the last subfeature or a
halt — never once per subfeature.

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
  ✅ DO: Any read-only probe — the boundary is side effects, not a step number

IF ITERATION COUNT WOULD EXCEED 3:
  ⛔ DO NOT: Start another build leg
  ⛔ DO NOT: Report the outcome as success
  ✅ DO: Exit reporting CAP_REACHED with the open rows

IF STAGING A CHECKPOINT COMMIT:
  ⛔ DO NOT USE: One `git add` carrying several pathspecs — one non-match aborts it and stages NOTHING
  ⛔ DO NOT: Commit before confirming `epic.md` is in the index
  ✅ DO: Run "The Checkpoint Sequence" path by path, every `git add` guarded
```

**ABSOLUTE INVARIANTS:**

- **DEPTH 1 ONLY:** every dispatch is a named leaf agent. Subagents are leaf-only; an agent told to run a command must dispatch further and silently degrades to inline execution, losing the fan-out.
- **CAP IS 3 PER SUBFEATURE, RESET AT EACH SUBFEATURE BOUNDARY.** Supersedes the old "3 per invocation" wording now that one invocation can cover a whole epic (see "Epic Mode: The Outer Loop"). A `3 × N_SF` global backstop and re-invocation's fresh budget remain the outer circuit breakers beyond that.
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
| Plan | `@discovery-agent`, `@ux-flow-agent`, `@ux-layout-agent`, `@ux-agent` (critique), `@database-agent`, `@backend-agent`, `@frontend-agent`, `@architecture-agent`, `@plan-reviewer-agent` (verdict gate, after consolidation) |
| Build | `@database-agent`, `@backend-agent`, `@frontend-agent`, `@test-agent` (with `tdd-pipeline`), `@e2e-agent` (with `qa-pipeline`), `@reviewer-agent` (area validation), `@fix-agent` (correction) |
| Review | `@reviewer-agent` (frontend ∥ backend, read-only), `@ux-agent` (review mode) ∥ `@qa-agent` (with the QA receipt present) |

⛔ Dispatching one agent told to "read `{{cmd:add.plan}}` and execute it" is the
depth-2 defect this command exists to avoid. Dispatch the roster.

---

## STEP 1: Bootstrap

1. Run `bash .codeadd/scripts/status.sh`. Parse `FEATURE_ID`, `HAS_PLAN`, `HAS_DESIGN`, `HAS_EPIC`, `EPIC_PROGRESS`, `EPIC_CURRENT_SF`, `HAS_TASKS`, `LAST_CHECKPOINT`, `WIKI:`, `SETUP_QA:`.
2. Resolve the target: explicit `F[NNNN]` arg > `FEATURE_ID` from the branch. **With `SFxx` given → the scope is that one subfeature** — it runs STEP 3 through STEP 8 exactly as today, and on CONVERGED it also runs "The Checkpoint Sequence" below (see that section's recorded departure from F23). **With no `SFxx` and `HAS_EPIC=true` → the scope is the whole epic** (see Epic Scope Resolution below). With no `SFxx` and `HAS_EPIC=false`, the scope is the whole feature, as today.
3. Validate `about.md` and `discovery.md` exist for the scope. If either is missing → report BLOCKED naming `{{cmd:add.new}}` and STOP.
4. Run `bash .codeadd/scripts/build-setup.sh <FEATURE_ID>`. It MUST exit 0 before any implementation. On non-zero: show stderr verbatim, report BLOCKED, STOP — never auto-resolve.
5. Re-run `status.sh` on the feature branch.

**Epic scope resolution (target has no `SFxx` and `HAS_EPIC=true`).** Read
`epic.md`'s Subfeatures table per the `epic` schema in
`{{skill:add-doc-schemas/references/new-feature.md}}` — resolve every column
**by header name**, never by position. Build the pending roster from the
`status` column: `pending` and `in_progress` rows are in scope; `done` rows are
skipped, and the skip is recorded in the Decision Log. Order the roster by the
`dependencies` column when populated, by the legacy `Order` section otherwise —
never by raw table row order alone.

**Why the `status` column is trustworthy here.** Elsewhere in the ecosystem
this row flip is written by `/add.build` STEP 16 block 14.3, or by
`/add.done`. This command calls neither: it dispatches the build roster
directly (see Agent Rosters) and never runs `/add.build`, and it never runs
`/add.done` either. **"The Checkpoint Sequence" below is what writes the
row** — on a subfeature reaching CONVERGED, in epic mode and on a
`SFxx`-scoped run alike, this command flips its own `epic.md` row to `done`
(and fills that row's `checkpoint` cell) before it commits. Without that
write, the `status` column would never change, and every re-invocation would
restart at SF01 regardless of how much of the epic already shipped.

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

## Epic Mode: The Outer Loop

Applies only when STEP 1 resolved the scope to a whole epic (no `SFxx` given,
`HAS_EPIC=true`). **On a single-subfeature or single-feature target, skip this
entire section** — proceed from STEP 2 straight into STEP 3, unchanged.
`## The Checkpoint Sequence` is a SEPARATE section and is NOT skipped with
this one: a `SFxx`-scoped run still checkpoints when it converges.

Throughout this section, `EPIC_CURRENT_SF` names whichever subfeature the
outer loop is currently processing — re-resolved from `epic.md`'s next
pending row at each subfeature boundary, not frozen at STEP 1's initial
parse. `status.sh` and `{{cmd:add.build}}` use the same name for the same
concept.

**The loop.** For each subfeature in the pending roster STEP 1 resolved, in
dependency order: run STEP 3 through STEP 8 scoped to that one subfeature,
exactly as a single-subfeature invocation runs them. The inner loop's three
exit states (CONVERGED, CAP_REACHED, BLOCKED) and its no-progress rule are
UNCHANGED by this wrapper — it reuses them, it does not rewrite them.

**STEP 9 fires once, at epic end.** Each subfeature's own STEP 8 exit is read
back internally by this loop; it is never printed as its own report.
Accumulate outcomes across every subfeature and report exactly once, when the
outer loop itself ends — converged, halted on a subfeature, or halted on the
backstop.

**Budget and halt.**
- **Per-subfeature cap:** 3 iterations — the same number STEP 8 already
  enforces — reset to 0 every time a new subfeature's STEP 3 begins. This
  supersedes the old "3 per invocation" framing (see ABSOLUTE INVARIANTS):
  one invocation now spans several subfeatures, so "per invocation" and "per
  subfeature" are no longer the same thing.
- **Global backstop:** `3 × N_SF` **iterations**, where `N_SF` = the total
  subfeature rows in `epic.md` (the denominator of `status.sh`'s
  `EPIC_PROGRESS`, or a fresh count of `^| SFxx` rows). Count this in
  **iterations only, never in legs** — per-leg logging below records a
  finer-grained unit than an iteration, and a backstop measured in legs would
  trip inside the first subfeature and stop meaning what its name says.
  Before starting each subfeature's STEP 3, sum every `"leg":"decision"`
  entry in `iterations.jsonl` for `FEATURE_ID` — across this invocation and
  any earlier one against the same epic, since a resumed subfeature's own
  counter resets (see Resume below) but the file's cumulative record does
  not. If the sum has already reached `3 × N_SF`, halt without starting the
  next subfeature.
- **Halt on the first subfeature whose STEP 8 exits non-CONVERGED**
  (`CAP_REACHED` or `BLOCKED`). Do not start the next subfeature. Skipping a
  blocked subfeature to reach a later one is NOT implemented — the
  dependency graph is trusted for ordering here, not for proving
  independence.
- **Precedence.** Evaluate the per-subfeature halt FIRST. If it fires, name
  that subfeature and stop — the global backstop is reported only when
  nothing else already stopped the run.

**Checkpoint on CONVERGED — MANDATORY, before advancing to the next
subfeature.** When a subfeature's STEP 8 exits CONVERGED, run the
`## The Checkpoint Sequence` section below, in its exact order. It is defined
ONCE and shared with the `SFxx`-scoped invocation; there is no epic-only
second copy of it to drift.

**Decision Log compaction.** Immediately after the checkpoint above (or
immediately after a halt, so the halted state stays legible), compact the
Decision Log: replace everything accumulated for the finished (or halted)
subfeature with ONE summary line, and drop the rest. This is what keeps the
coordinator's working memory alive across several subfeatures instead of
exhausting it by the third or fourth.

**Resume.** On re-invocation of an epic target, resume at the last checkpoint
commit (`LAST_CHECKPOINT` from `status.sh`, or the highest
`checkpoint/${FEATURE_ID}-*-done` tag): subfeatures whose `epic.md` row
already reads `done` are skipped, and the in-flight subfeature — the first
`pending` or `in_progress` row — starts over. "Starts over" means only its
**iteration counter** resets to 0; STEP 3's mutator cache rule and STEP 4's
idempotency guards STILL APPLY exactly as on any other invocation — a
`plan.md` already current for that subfeature is still skipped, area files
from a completed round are still reused. The guards are what make a restart
cheap; bypassing them would throw away correct work to prove a point.

**Log at every leg boundary, not once per iteration.** STEP 3, STEP 4, STEP
5 and STEP 6 each log their own boundary to `iterations.jsonl` before
advancing — see each STEP for the exact call — carrying `"leg"` and
`"sf":"${EPIC_CURRENT_SF}"`. STEP 8's existing per-iteration call also gains
these two fields. A crash mid-iteration used to leave no entry at all;
now the last logged leg pins exactly how far it got. **None of this applies
outside epic mode** — a single-subfeature or non-epic run keeps today's one
call, in STEP 8 only, unchanged.

**Epic-wide gate 3 — RUN IT, exactly once, at epic end.** After the LAST
subfeature's checkpoint has landed and BEFORE STEP 9, run the script again
with NO `SFxx` argument:
```bash
bash .codeadd/scripts/converge-gates.sh "docs/features/${FEATURE_ID}"
```
Require `GATE_EPIC=ok`. This is the EPIC-WIDE gate-3 form STEP 6 describes,
and this line is the only place it is ever evaluated — every STEP 6 inside a
subfeature's own legs ran the SCOPED form. It becomes reachable only now,
because the checkpoints are what flipped the rows: each one flipped exactly
one, so after the last checkpoint every row must read `done`.

```
IF GATE_EPIC IS NOT ok:
  ⛔ DO NOT: Report the epic as CONVERGED
  ⛔ DO NOT: Flip the missing row now to make the gate pass
  ✅ DO: Exit BLOCKED naming every id in EPIC_PENDING, and STOP
```

A row still not `done` here means that subfeature's checkpoint row flip never
landed — the epic is NOT ready. That is a BLOCKED exit naming the rows, never
a soft note appended beneath a CONVERGED report.

**Cross-subfeature judge — DELTA pass (epic end only).** **BEFORE** the LAST
subfeature's checkpoint (or immediately before reporting a halt),
dispatch `@consistency-agent` once more with `mode: DELTA`, the full resolved
subfeature roster, `HAS_DESIGN`, and the last `FULL`-pass verdict recorded
for each subfeature. It re-checks only the dimensions whose inputs changed
since their last verdict, and states which it skipped and why. Route its
findings into the highest `review-NNN.md`'s `## Fix Routing` table using
`{{skill:add-cross-sf-consistency/SKILL.md}}`'s Routing Hints — this is the
ONLY place a consistency finding is ever written into a review document; the
plan-time `FULL` pass (STEP 3) never touches `## Fix Routing`.
`informational` findings are noted in that document's notes, never routed as
a blocking row.

⛔ **The ordering is the mechanism, and it is why this pass runs before the
checkpoint rather than after it.** A judgement that runs after the thing it
judges has been committed, tagged and pushed cannot gate anything, whatever
severity it assigns — and its findings would land in a `review-NNN.md` that no
later step ever commits, because the loop makes no further commit. Running it
first puts its rows in the version of the document the checkpoint stages, and
lets the checkpoint's own pre-check (step 0 below) refuse to proceed. Moving
this pass back after the checkpoint silently makes `blocker` decorative again.

It judges the already-converged siblings plus the one in flight — a superset
of what an after-the-fact pass could see, not a subset.

---

## The Checkpoint Sequence

**ONE definition, TWO callers.** STEP 8 runs this every time a subfeature exits
CONVERGED — under the epic outer loop above AND on a `SFxx`-scoped invocation.
It is NOT part of "Epic Mode: The Outer Loop" and is NOT skipped along with it.

**Departure from F23 — recorded here, not hidden.** F23 specified that with
`SFxx` given the behaviour is UNCHANGED; that constraint was written before it
was known that the `epic.md` row flip has no other writer in this command (STEP
1, "Why the `status` column is trustworthy here"), and honouring it literally
would leave the schema's `status` column dead for every user who drives an epic
one subfeature at a time.

**Not for a non-epic feature target.** With no `epic.md` there is no row to flip
and no subfeature tag to name — skip this section entirely; `/add.done` owns
that feature's commit. `EPIC_CURRENT_SF` below is the outer loop's current
subfeature in epic mode, and the `SFxx` argument itself on a scoped run.

0. **Pre-check — no unresolved `blocker` stands.** Read the highest
   `review-NNN.md` for this scope and scan its `## Fix Routing` table. If any
   row carries `blocker` severity and is not marked resolved, **do not
   proceed**: no row flip, no commit, no tag, no push.

   ```
   IF AN UNRESOLVED blocker ROW STANDS IN ## Fix Routing:
     ⛔ DO NOT USE: Bash for git add, git commit, git tag or git push
     ⛔ DO NOT: Edit epic.md to flip the row
     ✅ DO: Exit BLOCKED naming the subfeature and every blocker row, and STOP
   ```

   This is what gives the cross-subfeature judge's `blocker` severity teeth.
   Without it the severity is a word in a rubric that no step reads, and the
   DELTA pass's placement above buys nothing.

1. **Flip the row AND write the `checkpoint` cell — ONE edit.** In `epic.md`'s
   Subfeatures table, set this subfeature's `status` cell to `done` and its
   `checkpoint` cell to `${FEATURE_ID}-${EPIC_CURRENT_SF}-done` — step 4's tag
   name minus its `checkpoint/` prefix, the exact shape the `epic` schema
   specifies (`{{skill:add-doc-schemas/references/new-feature.md}}`). Resolve
   both columns **by header name**; add a `checkpoint` column to the header when
   the document carries none yet. This command is that cell's named owner in the
   schema — `{{cmd:add.build}}` never commits, so it is forbidden to write it,
   and nothing else in this run writes it either. Both writes are the
   coordinator's own, the same ownership it already claims for `tasks.md` and
   the review resolution annex.

2. **Stage path by path, each one guarded — NEVER one multi-pathspec `git
   add`.** `add-commit`'s Staging Rules (`{{skill:add-commit/SKILL.md}}`)
   exclude all of `docs/features/*`, then re-include ONE path,
   `${FEATURE_DIR}`. Neither reading works for a subfeature checkpoint:
   re-including only `${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*` leaves
   `epic.md` out — it lives at `${FEATURE_DIR}/epic.md`, a SIBLING of
   `subfeatures/`, not inside it — so step 1's row flip would never reach the
   commit; re-including the whole `${FEATURE_DIR}` sweeps in a later,
   still-pending subfeature's half-written files. `add-commit` has no
   subfeature-scoped re-include today, so it is spelled out here:
   ```bash
   git add -A -- . ':(exclude)docs/features/*'
   for p in "${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}"-* \
            "${FEATURE_DIR}/epic.md" \
            "${FEATURE_DIR}/review-NNN.md"; do
     [ -e "$p" ] || continue        # absent path → SKIP it, never abort the run
     git add -A -- "$p" || exit 1   # an add that fails on a path that EXISTS is fatal
   done
   git diff --cached --name-only -- "${FEATURE_DIR}/epic.md" | grep -q . \
     || { echo "epic.md not staged — refusing to checkpoint"; exit 1; }
   ```
   ⛔ **One `git add` per path, and the `[ -e ]` guard is mandatory.** `git add`
   aborts the WHOLE invocation on the first pathspec matching nothing (`fatal:
   pathspec ... did not match any files`, exit 128, nothing staged) — and the
   `':(exclude)docs/features/*'` add above it already succeeded, so a
   coordinator that does not check the exit status commits the code files and
   silently loses step 1's row flip, then tags THAT commit as the checkpoint.
   One non-matching pathspec must never cost you the row flip. The guard is what
   turns an absent path into a skip instead of an abort.

   **QA evidence lives under the SUBFEATURE, not the feature root.** On an epic
   it is `${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*/_tests/run-NNN/` —
   already swept in by the first path above — and with `qa-pipeline` disabled it
   exists nowhere at all. `${FEATURE_DIR}/_tests/run-NNN/` is NOT a path to
   stage here; it is precisely the non-matching pathspec that aborts the run.
   (`review-NNN.md` is this round's highest-numbered one, at `${FEATURE_DIR}`,
   where STEP 5 writes it and `converge-gates.sh` reads it.)

   **Verify the index before committing.** The `git diff --cached` line is not
   optional: `epic.md` is the one file whose absence from the index is both
   invisible and fatal — the commit still succeeds, the tag still lands, and the
   epic silently never progresses. Empty output → report BLOCKED and do NOT
   commit.

3. **Commit — gated.** Commit here ONLY when STEP 8 exited CONVERGED. A
   subfeature that did not converge produces NO row flip and NO commit; the
   absence of a commit is itself the signal, never a separate flag to check.
   Follow `add-commit`'s type and message conventions for the body.
   **Gate lines:** the commit carries **the five gate lines** — `GATE_REVIEW`,
   `GATE_QA_BASELINE`, `GATE_EPIC`, `GATE_COVERAGE`, `GATES_OK` — **copied
   verbatim from `converge-gates.sh`'s output** in STEP 6, as **body lines**
   beneath the Conventional Commits body, NOT as git trailers: `GATE_REVIEW=ok`
   carries no `Key: value` colon, so `git interpret-trailers` never sees it as a
   trailer, and calling it one invites someone to "fix" it into a shape
   `git log --grep=GATES_OK` no longer finds. The script prints more keys than
   these five (`REVIEW_PATH=`, `BASELINE=`, `EPIC_PENDING=`,
   `COVERAGE_UNCOVERED=`, `QA_FEATURE_STATE=`, plus any `*_DETAIL=`) — copy the
   five, and only the five.
   ⛔ DO NOT reformat, summarise, re-word or author these lines. They are
   copied, not written — `git log --grep=GATES_OK` reconstructs which
   subfeatures converged and on what evidence, and a reformatted line is
   indistinguishable from an invented one. Do not invent a second format.

4. **Tag — ANNOTATED, not lightweight.** Create
   `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done` ON the commit just made,
   with `git tag -a <name> -m <message>`. `{{cmd:add.build}}` no longer creates
   this tag; this is the first point in the loop where it would point at real,
   committed work.

   ⛔ **A lightweight tag (`git tag <name>`, no `-a`) is NOT acceptable here,
   and the reason is step 5.** `git push --follow-tags` pushes **annotated tags
   only** — it silently skips lightweight ones. A checkpoint tag that never
   leaves the machine is invisible to the fresh-clone and other-engine resume
   this whole sequence exists to serve, and nothing reports the omission.

5. **Push, naming the branch AND the tag explicitly.**

   ```bash
   git push origin "${BRANCH_NAME}" "checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done"
   ```

   `--follow-tags` alone is not enough on its own: it covers annotated tags
   only, so it depends on step 4 having used `-a` and fails silently if that
   ever regresses. Naming the tag works either way. Verify it landed:

   ```bash
   git ls-remote --tags origin | grep "${FEATURE_ID}-${EPIC_CURRENT_SF}-done"
   ```

   Empty output → the tag is local-only. Report BLOCKED; do not advance to the
   next subfeature on a checkpoint the remote cannot see.

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

**Output check (MANDATORY, before advancing).** Stat `plan.md` at
`docs/features/${FEATURE_ID}/plan.md` and, when the feature touches UI,
`design.md` at the Location resolved above — the filesystem, never the roster's
own report that it wrote either. Missing → report BLOCKED naming the exact path,
and do not advance to STEP 4.

**Plan review (MANDATORY, after the output check passes).** This is new
behaviour beyond "applying `/add.plan`'s own consolidation rules" above — the
`feature-plan` schema gate is `/add.plan` STEP 12, a separate step this loop
never runs, so nothing else here re-validates `plan.md` after a fix is applied.

1. **DISPATCH** `@plan-reviewer-agent` with `path` = the `plan.md` just
   confirmed on disk, `kind: feature-plan`.
2. **Act on the verdict:**
   - `ok` → advance to STEP 4.
   - `fix-then-ok` → apply only the Required fixes that do not invent a user
     decision — answer any clarification from the Decision Log, exactly as the
     roster's own clarification questions are answered above; never stop for
     the user. **Re-run the `feature-plan` validation gate**
     (`{{skill:add-doc-schemas/SKILL.md}}`) against the fixed `plan.md` before
     re-review — this re-run is the step `/add.plan` STEP 12 would otherwise
     have owned. Re-dispatch `@plan-reviewer-agent` **once**. After that single
     re-dispatch, advance to STEP 4 unless the verdict is still `blocked` or
     blockers remain.
   - `blocked`, or blockers still standing after the one re-dispatch →
     **BLOCKED exit for this subfeature.** Report the blockers verbatim, and do
     NOT advance to STEP 4.
3. ⛔ Never stop to ask the user during this exchange — the loop is autonomous
   by contract, same as the clarification-questions rule above.

**Epic mode only — cross-subfeature judge, FULL pass.** When STEP 1 resolved
an epic scope, run this immediately after the plan review verdict above
resolves to advance (`ok`, or `fix-then-ok` resolved within its one
re-dispatch) — never before STEP 3's own plan review gate. On a
single-subfeature or non-epic target, skip this dispatch entirely: with
fewer than two subfeatures in scope there is nothing to compare against.

**Skip it too when no sibling has converged yet.** Dispatch ONLY when at
least one other row in `epic.md` already reads `done` — on the epic's FIRST
subfeature the already-converged set is empty, and
`{{skill:add-cross-sf-consistency/SKILL.md}}`'s rubric "only fires when there
are two or more subfeatures to compare". Record the skip in the Decision Log.

1. **DISPATCH** `@consistency-agent` with `mode: FULL`, this subfeature's
   `plan.md` (+ `about.md`, `design.md` if present), `epic.md`'s resolved
   roster, `HAS_DESIGN`, and the same three documents for every
   already-converged sibling.
2. **Act on its findings** — routed differently from the DELTA pass, because
   `review-NNN.md` does not exist yet at this point in a subfeature's life:
   - Apply each finding as a concrete edit to THIS subfeature's `plan.md`
     only — never to an already-converged sibling's `plan.md`, those are
     frozen.
   - **Re-run the `feature-plan` validation gate**
     (`{{skill:add-doc-schemas/SKILL.md}}`) against the fixed `plan.md`.
   - Re-dispatch `@consistency-agent` **once** to confirm the conflict is
     resolved.
   - Still unresolved after that single re-dispatch, or the conflict needs a
     product decision no edit can make unilaterally → `blocked`, a hard exit
     for the WHOLE epic run, naming the subfeature and the dimension.
   - `informational` findings are noted in the Decision Log, never applied
     as a `plan.md` edit.

This is the same apply → re-gate → one-re-dispatch → hard-exit shape
`@plan-reviewer-agent`'s `fix-then-ok`/`blocked` loop above already uses —
reused here, not reinvented.

**Epic mode only — log the plan-leg boundary.** Before advancing to STEP 4:
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "loop" "/add.plan-to-ready" '"leg":"plan","state":"<verdict>","sf":"${EPIC_CURRENT_SF}"'
```
This entry does not fire outside epic mode — a single-subfeature or
non-epic run keeps today's one entry per iteration, logged in STEP 8 only.
It exists so a crash between the plan leg and the first build leg of an
epic subfeature still leaves a record; today none does.

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

**Output check (MANDATORY, before advancing, iteration 2+).** Stat the previous
round's `review-NNN.md` and confirm its `## Resolution Annex` now carries a row
per routed ID from this iteration — the write just performed, verified on disk,
not assumed because it was dispatched. Missing → report BLOCKED naming the exact
`review-NNN.md` path, and do not advance to STEP 5.

**Epic mode only — log the build-leg boundary.** Before advancing to STEP 5,
every iteration:
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "loop" "/add.plan-to-ready" '"leg":"build","iteration":N,"sf":"${EPIC_CURRENT_SF}"'
```
Does not fire outside epic mode. A crash mid-build-leg — several areas
dispatched, only some validated — currently leaves no trace of how far the
leg got; this boundary is that trace.

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

**Output check (MANDATORY, before advancing).** Stat `review-NNN.md` at
`docs/features/${FEATURE_ID}/review-NNN.md` and confirm it contains a `## Fix
Routing` table — the filesystem, never the roster's own report that it wrote
either. Determine whether QA validation output is required from the
`/add.qa-setup` receipt (`SETUP_QA:` from `status.sh`) together with
`QA_FEATURE_STATE`, read from
`bash .codeadd/scripts/converge-gates.sh docs/features/${FEATURE_ID}` — never
from a hardcoded default.

**Then resolve it.** The script returns the RAW manifest value by contract
(`true | false | unset | no-manifest`); the defaults registry lives in
`cli/src/features.js` and a shell script duplicating it is how the two drift.
Resolve `unset` / `no-manifest` by the feature's own default: **`qa-pipeline`
defaults to disabled** — the same rule `{{cmd:add.review}}` and
`{{cmd:add.qa-setup}}` already apply to the same value.

The two rules are compatible, not in tension: read the STATE from the script
rather than assuming one, then apply the registry's DEFAULT to the two values
that mean "the manifest did not say". Inventing a state is banned; resolving an
absent one is required. When both confirm QA applies, confirm one
`_tests/run-NNN/qa-validation-NNN.md` exists per in-scope `SCOPE_DIR`. Missing →
report BLOCKED naming the exact path, and do not advance to STEP 6. This is the
check that would have caught the skipped dual-judge panel in the `0028F`
incident.

**Epic mode only — log the review-leg boundary.** Before advancing to STEP 6:
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "loop" "/add.plan-to-ready" '"leg":"review","iteration":N,"findings":N,"sf":"${EPIC_CURRENT_SF}"'
```
Does not fire outside epic mode. `findings` is the `## Fix Routing` row
count just confirmed on disk above.

---

## STEP 6: Convergence Check (DRY-RUN)

Convergence **is** `/add.done`'s gate set, evaluated without side effects. One
definition of "ready", shared by this loop and by the step that consumes it — so
it is impossible to converge on something `/add.done` then rejects.

Run the script and read its output. Do not evaluate the gates yourself by
re-reading `review-NNN.md`, the QA baseline, `epic.md` or `plan.md` and
reasoning about them — the coordinator's own judgement of these same files is
exactly what this script exists to replace:

```bash
# Epic or simple feature — no second argument:
bash .codeadd/scripts/converge-gates.sh "docs/features/${FEATURE_ID}"

# Subfeature-scoped — pass the SF id. It is validated against ^SF[0-9][0-9]$;
# an empty or malformed second argument is CLI misuse (exit 2), never a silent
# fall-through to the epic-wide rule.
bash .codeadd/scripts/converge-gates.sh "docs/features/${FEATURE_ID}" "${EPIC_CURRENT_SF}"
```

Parse its `KEY=VALUE` lines. The table below documents what each gate probes —
it is documentation of the script's contract, not the evaluation itself:

| # | Gate | Key | What it probes |
|---|------|-----|----------------|
| 1 | Review verdict | `GATE_REVIEW` | The highest `review-NNN.md` exists and its `\| **Overall** \|` row reads PASSED |
| 2 | QA baseline | `GATE_QA_BASELINE` | Its `> **QA baseline:**` line is present and valid, checked against `qa-evidence.sh validate` |
| 3 | Epic completeness | `GATE_EPIC` | `epic.md` has no pending subfeature — evaluated **only when `epic.md` exists**; a simple feature does not require one |
| 4 | Requirements coverage | `GATE_COVERAGE` | `plan.md`'s coverage table shows zero uncovered. Two shapes are read: `/add.plan` STEP 11's `Covered?` column (resolved by header name) and the legacy `## Cobertura de Requisitos` section. On an epic the SF-level `plan.md` is read. **No coverage table at all is `ok`** — `/add.plan` STEP 11 is itself a coverage gate at plan time, and making absence blocking would mean no feature could ever converge |

**CONVERGED requires all four gates `ok`.** `missing`, `broken` and `not-probed`
are each non-convergence — `not-probed` NEVER counts as a pass, even on a gate
that emits it in no case today. Read `GATES_OK=N/4` alongside the individual
keys as the single pass/fail summary; anything short of `4/4` blocks.

**Subfeature-scoped invocation.** Gate 3 can never be satisfied by a run
targeting one non-final subfeature, and would report non-convergence for a reason
unrelated to any finding. Pass the target `SFxx` as the script's second
argument — it applies the scoped rule in gate 3's place: the targeted
subfeature's own `tasks.md` acceptance checklist is complete. The scoped branch
never opens `epic.md`. Gates 1, 2 and 4 are evaluated unchanged.

CONVERGED then means "**this subfeature** is ready" — and STEP 9 MUST name the
remaining subfeatures so it is never read as "the epic is ready".

**Which gate-3 form applies where (epic mode).** Every subfeature the outer
loop runs — including the LAST one — is evaluated with the SCOPED rule above
while STEP 6 is inside that subfeature's own STEP 3–8 legs; pass its `SFxx`
every time, with no exception for "this is the final one." The EPIC-WIDE
form — `epic.md` has no row still pending — is evaluated exactly ONCE, after
the final subfeature's checkpoint (row flip + commit) has landed, as the
condition for the epic-level CONVERGED that STEP 9 reports. **No pass of this
STEP runs it: "Epic-wide gate 3" in "Epic Mode: The Outer Loop" is the line
that does**, and a specification with no invocation is a gate that never
fires. The checkpoint is
what writes the rows, so the epic-wide form only becomes reachable once it
has run at least once — which is exactly why the scoped form is used instead
while the loop is still inside a subfeature.

**Epic mode only — log the convergence-leg boundary.** Before advancing to
STEP 7:
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "loop" "/add.plan-to-ready" '"leg":"convergence","iteration":N,"state":"<GATES_OK>","sf":"${EPIC_CURRENT_SF}"'
```
Does not fire outside epic mode.

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

IF epic mode is active (the outer loop above is driving this run), add
`"leg":"decision","sf":"${EPIC_CURRENT_SF}"` to the fields — this call is
then just one of several leg-boundary entries this iteration produced (see
"Log at every leg boundary" in "Epic Mode: The Outer Loop"). Outside epic
mode this remains the single entry per iteration, exactly as before.

**On CONVERGED, do not fall through to STEP 9 yet.** Run "The Checkpoint
Sequence" (above STEP 3) FIRST — in epic mode AND on a `SFxx`-scoped
invocation alike; it is one shared definition, not an epic-only step. Then:

- **Epic mode** → return to STEP 3 for the next pending subfeature. When none
  remain, run "Epic-wide gate 3" in "Epic Mode: The Outer Loop" and only then
  continue to STEP 9.
- **`SFxx`-scoped run** → continue to STEP 9. Do NOT run the epic-wide gate-3
  pass: this invocation converged one subfeature, not the epic.
- **Non-epic feature target** → no `epic.md`, so no row, no checkpoint and no
  tag; continue to STEP 9 exactly as before.

On CAP_REACHED or BLOCKED, halt the outer loop per the precedence rule in
"Epic Mode: The Outer Loop" and go straight to STEP 9 — no checkpoint, no
epic-wide gate-3 pass, no next subfeature.

---

## STEP 9: Report

**Fires exactly once.** On a single-subfeature or single-feature run, once
per invocation, as before. On an epic run, once after the outer loop above
completes or halts — never once per subfeature; per-subfeature outcomes were
already read from each subfeature's own STEP 8 internally and are not
printed as separate reports.

Report exactly ONE of three states. They are distinct outcomes and NEVER softened
into one another:

| State | Meaning | Next command |
|-------|---------|--------------|
| **CONVERGED** | All four `converge-gates.sh` gates read `ok` (`GATES_OK=4/4`) — and, on an epic run, the epic-wide gate-3 pass at epic end also read `GATE_EPIC=ok` | `{{cmd:add.done}}` once every subfeature is done — or `/add.plan-to-ready` to continue an epic that halted, or for the next subfeature outside epic mode |
| **CAP_REACHED** | 3 iterations spent on the subfeature (or feature) that halted the run, gates still failing | `{{cmd:add.build}}` for the open `## Fix Routing` rows, or re-invoke after triage |
| **BLOCKED** | No progress detected, a gate failed for a reason the loop cannot act on (missing `about.md`, `build-setup.sh` non-zero, stale QA setup, `@plan-reviewer-agent` or `@consistency-agent` verdict `blocked` or blockers standing after its one re-dispatch), or — epic mode only — the global backstop fired | The specific remedy, named |

⛔ NEVER word CAP_REACHED or BLOCKED as success, and NEVER present either as
"done with minor issues". A run that spent its budget with gates still red did
not deliver a ready feature, and reporting it as if it did is the failure this
three-state split exists to prevent.

⛔ DO NOT print the state word alone. The state line MUST be immediately followed
by `converge-gates.sh`'s own output from STEP 6, one line per gate —
`GATE_REVIEW=`, `GATE_QA_BASELINE=`, `GATE_EPIC=`, `GATE_COVERAGE=`,
`GATES_OK=`. A state costs nothing to produce; printing one without the script's
own lines beneath it is BANNED.

Alongside the state, report:
- iterations spent — per subfeature under an epic run (e.g. `SF01: 2/3, SF02: 1/3`), or the single count for a single-subfeature/feature run — and the **cumulative** round count read from `iterations.jsonl`, since a per-subfeature counter resets at every boundary and only the cumulative figure shows the true total;
- on a halt, name what stopped the run: the specific subfeature (per-subfeature halt) or the global `3 × N_SF` backstop, per the precedence rule in "Epic Mode: The Outer Loop";
- resistant findings, if any;
- rows returned `NOT_MINE` or presented-not-dispatched, as user decisions;
- the path to the highest `review-NNN.md`;
- on a subfeature-scoped CONVERGED run (not a full epic), the remaining subfeatures; on an epic-run CONVERGED, the epic-wide pass's `GATE_EPIC=ok` as the evidence that none remain.

---

## Rules

ALWAYS:
- Dispatch named leaf agents at depth 1, passing the Decision Log
- Re-derive convergence each round from `converge-gates.sh`'s output, not memory
- Verify each leg's declared outputs exist on disk before advancing to the next STEP
- Write the resolution annex into the previous round's review document yourself
- Answer the plan roster's clarification questions from the Decision Log
- State the cumulative round count alongside each subfeature's own iteration count
- Gate every checkpoint commit on CONVERGED only, and push its tag explicitly
- Confirm `epic.md` is in the index before making a checkpoint commit
- Halt the epic outer loop on the first subfeature that exits non-CONVERGED

NEVER:
- Run `/add.done`, merge, or promote QA evidence
- Dispatch an agent that must dispatch another agent
- Invent a state file — every signal already exists on disk
- Accept a leg's own report of what it wrote as proof the file exists
- Print a state without the script's own gate-by-gate output beneath it
- Stop to ask the user mid-loop; this command is autonomous by contract
- Accept `--yolo`; it is autonomous already, and the review it drives has no auto-correct half to unlock
- Commit, tag, or push a subfeature's checkpoint when it did not converge
- Skip a blocked subfeature to reach a later one in the epic
- Re-include the whole `${FEATURE_DIR}` when staging a checkpoint — it sweeps in a later subfeature's half-written files
- Pass several pathspecs to one `git add` — one non-match aborts the whole invocation and stages nothing
