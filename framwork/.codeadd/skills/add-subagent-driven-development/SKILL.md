---
name: add-subagent-driven-development
description: Use when executing implementation plans via dispatched subagents with code review between tasks.
---

# Subagent-Driven Development

<!-- uses:
- skill: add-backend-development
- skill: add-code-review
- skill: add-commit
- skill: add-database-development
- skill: add-final-report
- skill: add-frontend-development
- skill: add-tasks-checklist
- skill: add-ux-design
- agent: architecture-agent
- agent: backend-agent
- agent: database-agent
- agent: discovery-agent
- agent: fix-agent
- agent: frontend-agent
- agent: reviewer-agent
- script: build-ledger.sh
- script: review-package.sh
- script: status.sh
- script: task-brief.sh
- skill: add-subagent-driven-development/references/persistent-logging-and-tasks.md
-->

Execute a plan by dispatching named specialist agents per task, with code review after each.

**Core principle:** Named agent per task + review between tasks = high quality, fast iteration.

**Second principle, equally load-bearing:** the coordinator forgets. A compaction erases the answer to
"is task 4 done?", and a coordinator that lost its place re-dispatches finished work. Everything that
must survive a compaction lives on disk — in the **build ledger** and in `git log` — never in the
conversation.

> **Provider-Agnostic:** This skill describes WHAT to dispatch (intent + prompt), not HOW. Use your platform's subagent mechanism (Task tool, sub-process, agent call, etc.).

---

## Overview

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Code review after each task (catch issues early)
- Faster iteration (no human-in-loop between tasks)

**When to use:**
- Staying in this session
- Tasks are mostly independent
- Want continuous progress with quality gates

## When NOT to Use

- **Plan needs review first** — use `executing-plans` (separate session) so the human can vet the plan before any code is written.
- **Tasks are tightly coupled** — manual execution avoids the conflict risk of resetting context between dependent steps.
- **Plan needs revision** — brainstorm/refine first; dispatching subagents over a shaky plan compounds rework.
- **Single trivial task** — dispatch overhead (TASK_DOCUMENTS, ledger, brief, review) outweighs benefit; just do it inline.
- **Exploratory / spike work** — no spec to anchor TASK_DOCUMENTS; use a discovery agent instead.

---

## Named Agent Mapping

When dispatching, prefer named agents over generic subagents. Named agents have skills preloaded, model optimized, and tool restrictions enforced.

| Area | Named Agent | Type |
|------|-------------|------|
| Database | `@database-agent` | Implementation (read-write) |
| Backend | `@backend-agent` | Implementation (read-write) |
| Frontend | `@frontend-agent` | Implementation (read-write) |
| Review | `@reviewer-agent` | Validation (read-only) |
| Fix | `@fix-agent` | Remediation (read-write) |
| Discovery | `@discovery-agent` | Exploration (read-only) |
| Architecture | `@architecture-agent` | Advisory (read-only) |

**Fallback:** If a named agent is not available, dispatch a generic subagent with the appropriate skill loaded in the prompt.

---

## TASK_DOCUMENTS Pattern

Subagents must read original documentation — never work from summaries. The coordinator knows which docs are relevant (feature vs subfeature, epic-aware paths) and passes them as an explicit list. The subagent reads them directly.

**Why this matters:** An LLM summarizing docs for another LLM is a telephone game — information loss is guaranteed. The subagent cannot detect what was omitted from a summary. Reading original docs is the only way to guarantee fidelity to the specification.

**How it works:**

1. **Coordinator** determines which docs the subagent needs (about.md, plan.md, discovery.md, tasks.md, etc.)
2. **Coordinator** writes a `TASK_DOCUMENTS` section in the subagent prompt with the exact file paths
3. **Subagent** reads ALL listed files as its first action — these are the source of truth

**Example — simple feature:**
```
## TASK_DOCUMENTS (read ALL before starting — source of truth)
- docs/features/0005F-media-library/about.md
- docs/features/0005F-media-library/plan.md
```

**Example — epic with subfeatures:**
```
## TASK_DOCUMENTS (read ALL before starting — source of truth)
- docs/features/0005F-media-library/about.md
- docs/features/0005F-media-library/discovery.md
- docs/features/0005F-media-library/subfeatures/SF01-chunked-analysis/about.md
- docs/features/0005F-media-library/subfeatures/SF01-chunked-analysis/plan.md
```

The coordinator already knows if it's a simple feature or epic, which subfeature is current, and which docs exist. It assembles the correct list. The subagent has zero conditional logic — just reads what it receives.

---

## The Build Ledger

**Path:** `${FEATURE_DIR}/build-ledger.md`, or `${SF_DIR}/build-ledger.md` on an epic.

**Tracked, not scratch.** It carries the rulings, and a reviewer who cannot see what was decided on their
behalf cannot review it. `git clean -fdx` cannot destroy it. Scratch — briefs, agent reports, diff
packages — lives in `${FEATURE_DIR}/_build/`, which ignores itself and never reaches a commit.

**Append with the script, never by hand:**

```bash
bash .codeadd/scripts/build-ledger.sh "${FEATURE_DIR}/build-ledger.md" "T01: complete (commits a1b2c3d..a1b2c3d, review clean)"
```

It creates the file with its identity header when absent and appends otherwise, printing `LEDGER=`,
`CREATED=` and `LINES=`. It is a **log, not a set** — the same line twice appends twice, because
de-duplicating would erase "fix round 1" followed by "fix round 2" of the same finding.

### Canonical format

Append-only, one line per event, identity on the first line:

```markdown
# Build ledger — feature: F0003 — plan: docs/features/F0003/plan.md

Preflight: 4 pairs checked, 1 conflict — T05 consumes `UserDto.name`, T02 produces `UserDto.fullName`
Preflight: Ruling: T02's name wins (plan.md Architecture Decisions names it) — costs a rename in T05 if wrong
T01: complete (commits a1b2c3d..a1b2c3d, review clean)
T02: fix round 1/3 (2 addressed, 0 open; commits d4e5f6a..b7c8d9e)
T02: complete (commits d4e5f6a..b7c8d9e, review clean)
T03: minor (deferred): magic number in retry backoff
T04: parked — reviewer wants a null guard — Ruling: the caller already guards; costs a crash if wrong
T04: complete (commits c1d2e3f..f9a8b7c, 1 parked)
```

**The identity first line is written once, on creation.** A ledger whose identity changes mid-build is a
ledger that cannot be trusted, so the header is never rewritten.

**Every line that records work records its hash bracket** — `BASE..HEAD`, where `BASE` is
`git rev-parse HEAD` taken *before* the dispatch and `HEAD` is taken *after* the agent's commits land.
That bracket is what makes the scoped diff possible.

### The resume rule

The ledger is the recovery map. On entry — every entry, not only after a crash — read the ledger if it
exists before deciding anything:

- **A task with a `complete` line is NEVER re-dispatched.** Not "probably done", not "let me re-check by
  re-running it". Done.
- **A task whose last line is a fix round resumes at the next round** — a task whose last line is
  `fix round 2/3` resumes at round 3, not at round 1.
- **A task with no line at all is the first task to dispatch.**

**After a compaction, trust the ledger and `git log` over your own recollection.** Your recollection is
the thing that was just erased; the ledger and the commit graph are not. Where the two disagree, git wins
for *what exists* — a commit that is in `git log` happened, whatever the ledger says — and the ledger wins
for *what was decided*, because a ruling leaves no trace in a diff.

---

## The Pre-Flight Scan

**Before dispatching Task 1**, read `tasks.md` once and write a table to the ledger. Tasks carry six
sub-bullets — Service, Files, Deps, Consumes, Produces, Verify (see `add-tasks-checklist`) — and
`Consumes` / `Produces` are what make this scan possible: they are the exact signatures each task calls
and each task provides.

Two kinds of row, and both are required:

1. **One row per pair of tasks sharing a file or an interface** — what one `Produces` against what the
   other `Consumes`, and what was found. A `Consumes` that does not match a `Produces` character for
   character is a conflict, not a nuance.
2. **One row per task, for self-consistency** — whether the task's own text agrees with itself (its
   `Files` cover its `Produces`, its `Deps` cover the tasks its `Consumes` names).

**The output is a table, not a verdict.** Writing "the scan is clean" without the rows is not a scan that
ran — it is a claim that one did. Append the rows to the ledger with `build-ledger.sh`, one line each.

**Every conflict is ruled on before Task 1 is dispatched**, with the `Ruling:` recorded beside its row.
A conflict carried into execution becomes two subagents building against two different names, discovered
at integration, when both are already committed.

---

## Handoff by Path

The coordinator hands the agent **paths, not pasted content**. Pasted briefs and inline reports stay
resident in context and are re-read on every turn for the rest of the session.

**Before the dispatch:**

```bash
bash .codeadd/scripts/task-brief.sh "${TASKS_FILE}" T02 "${FEATURE_DIR}/_build"
```

It writes one task's full block — description plus all six sub-bullets — into its own file and prints
`BRIEF=`, `TASK=` and `SUBBULLETS=`. It **exits 2** when the task id is not an `## Execution` task: an
empty brief is how an agent gets dispatched against nothing and reports success.

**What the dispatch carries:**

| Field | Content |
|---|---|
| `BRIEF` | the path `task-brief.sh` printed — the agent reads it |
| `REPORT_FILE` | the path in `_build/` where the agent writes its full report |
| `INTERFACES` | the exact `Produces` signatures from earlier tasks that this task `Consumes` — the brief cannot know them |
| `GLOBAL CONSTRAINTS` | the plan's `## Global Constraints` block, **copied verbatim** |
| `TASK_DOCUMENTS` | file paths, as always |

`## Global Constraints` travels verbatim because it is the reviewer's attention lens, and it is written
with exact values copied from their sources. "Fast enough" cannot be reviewed; "under 200ms" can.
Paraphrasing it destroys the only property that makes it usable.

**What the agent returns inline:** status, the commits it made (`BASE..HEAD`), a one-line test summary,
and concerns. Nothing else. The full report is on disk at `REPORT_FILE` for whoever needs it.

---

## Subagent Prompt Template

All subagent prompts include these fields, in order:

- **ROLE** — `You are the [AREA] [agent type] for task [N].`
- **TASK_DOCUMENTS** — file paths the subagent must read first (source of truth).
- **BRIEF** — path to the task brief written by `task-brief.sh`.
- **REPORT_FILE** — path where the subagent writes its full report.
- **INTERFACES** — signatures produced by earlier tasks that this task consumes.
- **GLOBAL CONSTRAINTS** — the plan's block, verbatim.
- **SKILLS** — `MANDATORY:` (always for this area) + `ADDITIONAL:` (detected from context).
- **COORDINATOR NOTES** — decisions, warnings, patterns to follow/avoid.
- **TASK** — specific deliverables for this subagent.
- **REPORT FORMAT** — what to return to the coordinator.

---

## Sizing and the Commit Rule

Estimate every task before dispatching it — size is what tells you whether one dispatch is one commit or
whether the task should have been split in planning.

| Size | Criteria |
|------|----------|
| S — Small | 1–2 files, localized change |
| M — Medium | 3–5 files, moderate logic |
| L — Large | 6+ files, complex logic |

**Complexity signals — each adds one size:** a new entity; a migration; an external integration; complex
UI (forms, tables).

**The commit rule: one semantic commit per batch.**

| Mode | A batch is |
|---|---|
| TASKS MODE | one `tasks.md` task (`T01`, `T02`, …) — tasks are already service-scoped and capped at 3 files |
| DEVELOPMENT / CORRECTION MODE | one area dispatch — there are no task IDs to commit against |

Message follows the Conventional Commits logic in `add-commit`, with the task id and the feature id as
trailers so the ledger, the commit and `tasks.md` can be joined later.

**Commit after validation, never before.** The commit happens once the area validator has returned **and
the build passes**. A commit of unvalidated code is worse than no commit: it looks like delivered work
and is not.

---

## The Process

### 1. Load Plan + Read the Ledger

Read the plan file, create TodoWrite with all tasks, then **read the ledger if it exists** and apply the
resume rule. On a fresh build, create it with the first line you append. Reconcile against `git log`
before dispatching anything.

### 2. Pre-Flight Scan

Run the scan, write its rows to the ledger, and rule on every conflict. This happens **before Task 1**,
not before the task where the conflict bites.

### 3. Pre-Dispatch Preparation (Coordinator's Job)

Before dispatching ANY subagent:

1. **Assemble TASK_DOCUMENTS** — list all doc paths the subagent needs (epic-aware)
2. **Write the brief** — `task-brief.sh` for this task id
3. **Identify Reference Files** — find similar files in codebase via Glob/Grep
4. **Compose Skills** — determine mandatory + additional skills for this area
5. **Collect INTERFACES** — the `Produces` signatures this task `Consumes`
6. **Copy `## Global Constraints`** verbatim from the plan
7. **Record `BASE`** — `git rev-parse HEAD`, before anything is dispatched

### 4. Execute Task with Subagent

Dispatch `@${AREA}-agent` (see Named Agent Mapping) with a prompt that fills every field of the Subagent Prompt Template, plus this mandatory first step:

```
## MANDATORY: Load Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Read the file at BRIEF
4. Read your area's skill file (see SKILLS section)

## REPORT FORMAT
Write your full report to REPORT_FILE. Return inline ONLY:
1. STATUS: [complete/blocked]
2. FILES: [created + modified]
3. TESTS: [one line]
4. CONCERNS: [if any]

⛔ DO NOT run git add, git commit or git tag. You leave your work in the tree;
   the coordinator commits it after the validator returns and the build passes.
```

### 5. Review Subagent's Work

**The review runs on the WORKING TREE, before the commit — not on a diff.** Nothing is committed at this
point, so `BASE..HEAD` is still empty and `review-package.sh` would refuse the range with exit 2. The
package belongs to the **re-review** in step 7, after a fix batch has been committed.

Dispatch `@reviewer-agent` with `MODE: task`, the `FILES_CREATED` / `FILES_MODIFIED` lists from the
implementer's report, and the plan's `## Global Constraints` block verbatim. Review-specific deltas:

```diff
  ## TASK_DOCUMENTS  (same docs as the implementation subagent received)
+ ## MODE: task
+ ## FILES TO REVIEW  (FILES_CREATED + FILES_MODIFIED from the report)
+ ## GLOBAL CONSTRAINTS  (verbatim from plan.md — the attention lens)
  ## SKILLS
- - [implementation skill]
+ - {{skill:add-code-review/SKILL.md}}
  ## TASK
- [Specific deliverables from plan]
+ 1. Read all files from TASK_DOCUMENTS (spec)
+ 2. Read every file in FILES TO REVIEW (implementation)
+ 3. Validate implementation against spec
+ 4. Check skill patterns
+ 5. Report findings
  ## REPORT FORMAT
- 1. STATUS / FILES / TESTS / CONCERNS
+ 1. ISSUES_FOUND: [list with severity]
+ 2. BUILD_STATUS: [pass/fail]
+ 3. SPEC_STATUS: [complete/INCOMPLETE]
+ 4. SCORE: [X/10]
```

### 6. Commit and Record

**Only after the review has returned, `SPEC_STATUS` is not `INCOMPLETE`, and the build passes**: commit the
batch, record `HEAD`, and append the ledger line with its `BASE..HEAD` bracket and `BUILD_STATUS`.

That ordering is the whole point of the step. A commit made before the review is a commit of unreviewed
code, and a commit made before the build passes is a commit that does not compile.

**The coordinator commits, never the implementer.** The reviewer is a separate dispatch, so an implementer
that committed its own work would put the commit **upstream of review** — the one ordering this step exists
to prevent. `BASE` is recorded by the coordinator before dispatching and `HEAD` after the commit it makes
itself; the implementer never sees either.

**One commit per unit of work, and the unit is what the dispatch covered.** When several areas run in
parallel, each area's commit stages **that area's files by path** — never `git add -A`, which would sweep a
sibling area's work into the first commit and leave the second with an empty range that
`review-package.sh` then refuses.

### 7. Fix Loop, Escalation and the Scoped Re-Review

- **Critical** issues → dispatch `@fix-agent` immediately.
- **Important** issues → fix before next task.
- **Minor** issues → append a `minor (deferred)` line to the ledger, move on.

Fix-subagent prompts add an `## ISSUES TO FIX` section (from the review report) and a `COORDINATOR NOTES`
line stating priority. Everything else mirrors the implementation prompt.

**Never patch manually — always dispatch a fix subagent.** Patching inline pollutes the coordinator's
context with implementation detail it then carries into every later dispatch.

**Every fix round is re-reviewed.** Record `FIX_BASE` before the fix dispatch, run
`bash .codeadd/scripts/review-package.sh FIX_BASE HEAD "${FEATURE_DIR}/_build"`, and dispatch `@reviewer-agent` again with `MODE: re-review`. In that
mode the reviewer verdicts **each open finding** `ADDRESSED` or `NOT ADDRESSED` and flags new breakage
**in the fix diff only**. Out-of-scope observations come back as deferred minors and go to the ledger;
they never extend the loop. A fix that compiles and misses the finding is exactly what this catches.

**`MAX_ATTEMPTS` is 3.**

| Round | Model |
|---|---|
| 1 | `@fix-agent`'s declared model |
| 2 | `@fix-agent`'s declared model |
| 3 | an explicit `MODEL` **one tier above** the declared model |

Two rounds on the declared model is a fair trial. A loop that survives two rounds usually means the agent
cannot see its own problem, and a third round on the same model buys nothing.

Append one ledger line per round: `T02: fix round 1/3 (2 addressed, 0 open; commits d4e5f6a..b7c8d9e)`.

### 8. The Breaker

**At the cap, rule and continue. Do not stop the session.**

When `MAX_ATTEMPTS` is exhausted with findings still open, stop dispatching and **adjudicate each open
finding yourself**, writing one line per finding to the ledger in this format:

```
Ruling: <what you decided> — <why> — <what it costs if wrong>
```

All three parts are required. The cost clause is what makes a ruling reviewable — a human reading
"the caller already guards" cannot tell whether to check it; a human reading "costs a crash if wrong"
can. Then continue to the next task.

**A red build is not a finding, and the breaker does not cover it.** The cap's rule-and-continue applies
to **review findings** — judgements a reasonable reviewer could be wrong about. A build that does not
compile is not a judgement, and there is nothing to weigh: the `BUILD GATE` still stands, and an
exhausted fix loop over a red build reports the unresolved rows and the last `BUILD_ERRORS`, then STOPS.
Ruling a compile error away would make every other ruling worthless, because the reader could no longer
tell which ones were judgements.

A session parked on a question costs a day. A wrong ruling costs rework the human can see and undo.

**Every ruling reaches the human.** At completion, collect every `Ruling:` line from the ledger into a
"Rulings I made" section, in the order they were made, each with its cost-if-wrong. Exhaustive, not
representative: if the ledger holds a ruling, the report holds it. A ruling that stays in the ledger and
never surfaces is a decision made in secret.

### 9. The Four Hard Stops

Four things still stop the session and ask the human, and **only** these:

1. **An irreversible or destructive operation** — a history rewrite, a data deletion, a dropped table.
2. **A security-sensitive action** — anything touching credentials, auth, permissions or secrets.
3. **A side effect outside this working tree that norms say you ask about first** — a merge, a push to a
   shared branch, a publish.
4. **A plan so broken that every path forward is a guess.** Not "a decision I would rather not make" —
   one where no reading of the plan supports any option over the others.

Everything else is a ruling. "I am not sure" is not a fifth stop.

### 10. Mark Complete, Next Task

- Append the `complete` line to the ledger with its `BASE..HEAD` bracket
- Mark task as completed in TodoWrite
- Move to next task; repeat steps 3–9

### 11. Coordinator Compliance Gate

After ALL tasks complete and BEFORE reporting completion, the coordinator verifies the implementation matches the specification. This is not a review — it's a cross-reference check.

**Why this exists:** Subagents may complete their tasks and pass code review yet still miss requirements from the spec. The coordinator is the only actor with both the full spec and the full ledger.

**Steps:**

1. **Re-read TASK_DOCUMENTS** (about.md, plan.md) to extract RF/RN list
2. **Cross-reference** each RF/RN against the files recorded in the ledger and in `git log`
3. **Quick-read** relevant implementation files to confirm the requirement exists in code
4. **If any RF/RN has no corresponding implementation:** list missing items, dispatch fix subagent with the missing requirements + TASK_DOCUMENTS, re-run this gate after the fix
5. **If ALL RF/RN are covered:** proceed to Final Review

```
DO NOT report completion without executing this gate.
DO NOT skip quick-read — file existence alone does not confirm implementation.
```

**The gate also refuses a task whose ledger holds a fix round with no matching re-review line.** A fix
round that was never re-reviewed is an unverified fix, whatever the build says.

### 12. Final Review

After the Compliance Gate passes, dispatch the final reviewer with the COMPLETE ledger + all TASK_DOCUMENTS + the plan's verification checklist. Task: review entire implementation against TASK_DOCUMENTS, verify all plan requirements met, check overall architecture, run final build verification.

---

## Example Workflow

```
Coordinator: load plan, read ledger (absent → fresh build), init TodoWrite.

Pre-flight scan
  4 pairs checked, 1 conflict → Ruling written to the ledger before Task 1.

Task 1 — Hook installation script
  BASE recorded → brief written → dispatch implementer
  Validator + build pass → commit → ledger: T01: complete (commits …, review clean)
  review-package.sh → dispatch reviewer MODE: task → Score 9/10, no issues

Task 2 — Recovery modes
  BASE recorded → brief written → dispatch implementer
  Validator + build pass → commit
  Dispatch reviewer MODE: task → Important: missing progress reporting
  Dispatch @fix-agent (round 1/3) → progress every 100 items → commit
  review-package.sh FIX_BASE HEAD _build → reviewer MODE: re-review → ADDRESSED
  ledger: T02: fix round 1/3 (…), then T02: complete (…)

Compliance Gate
  Re-read about.md + plan.md → 8 RF extracted
  Cross-reference ledger + git log → all 8 covered
  Every fix round has a re-review line → PASS.

Final Review
  Dispatch reviewer with full ledger + TASK_DOCUMENTS → ready to merge.

Completion
  The seven-block report, then "Rulings I made" — every Ruling: line from the
  ledger, in order, with its cost — then the metadata.
```

---

## Validation Checklist

Coordinator must confirm before reporting completion:

- [ ] Ledger read on entry; no task with a `complete` line was re-dispatched
- [ ] Pre-flight scan wrote its ROWS to the ledger, and every conflict carries a ruling
- [ ] TASK_DOCUMENTS assembled (epic-aware) for every dispatch
- [ ] No subagent received summaries — only file paths
- [ ] `## Global Constraints` travelled verbatim in every dispatch
- [ ] Ledger line appended after every task, fix round, deferred minor, parked finding and ruling
- [ ] Every commit landed AFTER its validator returned and the build passed
- [ ] Code review dispatched after every implementation task
- [ ] Every fix round has a matching `MODE: re-review` line
- [ ] Critical review issues fixed before advancing
- [ ] Only one implementation subagent in flight at a time
- [ ] Compliance Gate executed: each RF/RN cross-referenced + quick-read
- [ ] Final Review dispatched with the COMPLETE ledger
- [ ] The closing report follows `{{skill:add-final-report/SKILL.md}}`, emitted before any metadata
- [ ] "Rulings I made" lists EVERY `Ruling:` line in the ledger
- [ ] Build status `pass` on final task
- [ ] TodoWrite reflects real state (no stale `in_progress`)

---

## Integration

**Required patterns:**
- **TASK_DOCUMENTS** — coordinator assembles doc paths, subagent reads originals
- **Build ledger** — on disk, appended after every event, read on entry
- **Handoff by path** — briefs, reports and diff packages travel as paths
- **Coordinator Compliance Gate** — cross-reference spec vs implementation before completion

**Reference scripts:**
- `bash .codeadd/scripts/status.sh` — get feature context
- `bash .codeadd/scripts/build-ledger.sh` — append one ledger line
- `bash .codeadd/scripts/task-brief.sh` — extract one task's block to its own file
- `bash .codeadd/scripts/review-package.sh` — write the scoped diff for a range

**Skills to compose:**
- Backend: `{{skill:add-backend-development/SKILL.md}}`
- Database: `{{skill:add-database-development/SKILL.md}}`
- Frontend: `{{skill:add-frontend-development/SKILL.md}}` + `{{skill:add-ux-design/SKILL.md}}`
- Review: `{{skill:add-code-review/SKILL.md}}`
- Commits: `{{skill:add-commit/SKILL.md}}`
- Task shape: `{{skill:add-tasks-checklist/SKILL.md}}`

**Extended references:**
- Persistent decision logging (`decisions.jsonl`) and the Architect subagent pattern (`tasks.md`) live in `references/persistent-logging-and-tasks.md`. Load on demand when a feature uses persistent logs or tasks-mode execution.

---

## If a Subagent Fails

- Append the failure to the ledger (`T0N: failed — <error excerpt>`)
- Dispatch a fix subagent with full context — **never patch manually** (context pollution)
- Re-run the review after the fix, and re-review the fix diff with `MODE: re-review`
