# Brainstorm: Superpowers Adoption 002 — Durable Executor

> **Status:** final (ready for `/add-framework--self-plan` + `/add-framework--plan`)
> **Date:** 2026-09-07
> **Type:** architecture
> **Umbrella:** `docs/brainstorming/2026-09-07T005046-superpowers-adoption-000-umbrella.md`
> **Depends on:** topic 001 (the plan contract this executor reads)

## Discovery

Measured against the live repo at `58e916d`:

- **`add.build.md:82`** — `GIT CLEAN: Leave files unstaged. Never git add/commit/stage`.
  `add.build.md:661-675` then spends 15 lines explaining why the `checkpoint/*` tag cannot be created there
  ("the tag has always been a lie"). `add.done.md:400` repeats the claim.
- **`add.plan-to-ready.md:428`** — *"A subfeature that did not converge produces NO row flip and NO commit;
  the absence of a commit is itself the signal, never a separate flag to check."* This sentence is only true
  while `/add.build` never commits.
- **The checkpoint staging sequence** (`add.plan-to-ready.md:399-410`) is
  `git add -A -- . ':(exclude)docs/features/*'` followed by one guarded `git add` per feature path, and a
  `git diff --cached` guard that refuses to commit when `epic.md` is not staged. It stages whatever is
  pending — it does not assume the tree is dirty.
- **22 agents ship**, each with `model:` in frontmatter (`fix-agent.md` declares `model: sonnet`) and a
  `<!-- uses: -->` declaration block that the artefact-graph gate reads. A new agent must be registered in
  `provider-map.json` or `scripts/build.js:1011` fails the build as an unregistered artefact.
- **`@fix-agent`** already takes `ATTEMPT` / `MAX_ATTEMPTS` from the caller and reports `ROWS_RESOLVED`,
  `ROWS_FAILED`, `NOT_MINE`, `DISPUTED`, `NEW_FINDINGS`. What happens after it returns is a build re-run —
  **never a re-review of the fix diff**.
- **14 scripts** live in `framwork/.codeadd/scripts/`. `log-jsonl.sh` is the generic append helper;
  `converge-gates.sh` is the precedent for a read-only probe with a `KEY=STATUS` contract.
- **State that exists but does not resume:** `decisions.jsonl` (pivots only), `iterations.jsonl`
  (one line per `/add.build` run), and the in-context `### DECISION LOG`. None answers "which task is done".
- **The internal builders execute inline.** `add-framework--self-build.md:141` is
  *"Wait for checkpoint approval before next item"* — a human gate between every item.
  `add-framework--build.md:384` (STEP 6.3) mandates syncing `CLAUDE.md` counts, while
  `add-framework--plan.md:395` tells the reader `/add-framework--build` "reaches neither `CLAUDE.md` nor
  `.claude/`". One of the two is wrong.

## Context & Motivation

Topic 001 makes the plan declare what each task produces and consumes, and what binds the whole plan. This
topic makes the executor use it — and survive long enough to finish.

Every mechanic here exists to fix one class of failure: **the coordinator forgets, and nothing on disk
reminds it.** After a compaction it cannot say which tasks completed, what a reviewer found, or what it
decided when a finding conflicted with the plan. It re-dispatches finished work, or it stops and asks a human
a question it already answered.

## Problem / Opportunity

Seven gaps, each with a concrete failure:

1. **No ledger on disk.** The Decision Log is conversation. Compaction erases the answer to "is task 4 done?"
2. **No commit, so no hash, so no delivery marker.** Without `BASE`, `BASE..HEAD` does not exist. There is no
   scoped diff to hand a reviewer, and the `checkpoint/*` tag is documented as a lie.
3. **Everything travels through context.** Pasted briefs and inline reports stay resident and are re-read
   every turn.
4. **A fix is never re-reviewed.** `@fix-agent` returns, the build runs, the loop moves on. A fix that
   compiles and misses the finding passes.
5. **The cap stops the session.** `MAX_ATTEMPTS` exhausted means "report and STOP". Every unresolved finding
   becomes a human question, including the ones the coordinator could settle.
6. **No escalation on model.** Attempt 3 runs the same model that failed attempts 1 and 2.
7. **No pre-flight scan.** Task 1 is dispatched without anyone checking whether Task 4 contradicts it.

## Proposal

### Part 1 — The build ledger

**Path:** `docs/features/${FEATURE_ID}/build-ledger.md`, or `${SF_DIR}/build-ledger.md` on an epic.

**Tracked, not scratch.** `docs/features/` is already the feature's record and already carries
`iterations.jsonl` and `decisions.jsonl`. A git-ignored workspace would be a new concept, and `git clean -fdx`
destroys it. Tracked also means the reviewer and the pull request see the rulings — which is the point of
recording them.

**Shape** — append-only, one line per event, identity on the first line:

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

**It is the recovery map.** After a compaction the coordinator trusts the ledger and `git log` over its own
recollection. A task with a `complete` line is never re-dispatched.

### Part 2 — Commit per task, and the hash bracket

`GIT CLEAN` is retired from `add.build.md:82` and replaced by:

- **TASKS MODE** — one commit per `tasks.md` task (`T01`, `T02`, …). Tasks are already service-scoped and
  capped at 3 files, so a task is the right commit.
- **DEVELOPMENT / CORRECTION MODE** — one commit per area dispatch, since there are no task IDs.

Message follows `add-commit`'s conventions, with the task id and feature id as trailers so the ledger, the
commit and `tasks.md` can be joined later.

**The bracket:** the coordinator records `BASE = git rev-parse HEAD` **before** dispatching, and `HEAD` after
the agent's commits land. Both go in the ledger line. `BASE..HEAD` is what makes the scoped diff and the
honest tag possible.

**Tag ownership does not move.** `/add.plan-to-ready` remains the only creator of `checkpoint/*`. What
changes is that the tag now lands on top of real commits instead of on the state before the subfeature.
`add.build.md:661-675` is rewritten: the reason is no longer "there is no commit", it is "one tag owner".

**One consequence must be fixed, not inherited.** `add.plan-to-ready.md:428` treats "no commit" as the signal
that a subfeature did not converge. With per-task commits that signal is gone — commits exist either way. The
signal becomes **the absence of the checkpoint tag**, which only the converged path creates.

### Part 3 — Handoff by path

Three new scripts under `framwork/.codeadd/scripts/`, each following the `converge-gates.sh` contract
(read-only where it can be, `KEY=VALUE` on stdout, prints the path it wrote):

| script | does |
|---|---|
| `task-brief.sh TASKS_FILE TASK_ID OUT` | extracts one task's full block from `tasks.md` into its own file |
| `review-package.sh BASE HEAD OUT` | writes `git log --oneline`, `git diff --stat` and `git diff -U10` for the range into one file |
| `build-ledger.sh LEDGER_FILE LINE` | appends one line, creating the file with its identity header when absent |

**Scratch lives in `${FEATURE_DIR}/_build/`, which ignores itself.** The directory is created with a
`.gitignore` containing `*` — briefs, reports and diff packages never reach a commit, and the installer needs
no change to make that true.

**The dispatch contract changes shape.** The coordinator hands the agent *paths*, not content: the brief
path, the report-file path, the interfaces the brief cannot know, and the `## Global Constraints` block
verbatim from `plan.md`. The agent writes its full report to the report file and returns only status,
commits, a one-line test summary and concerns.

### Part 4 — The scoped re-review

After `@fix-agent` returns, the coordinator runs `review-package.sh FIX_BASE HEAD` and dispatches
`@reviewer-agent` again with `MODE: re-review`.

**A new mode on the existing agent, not a 23rd agent.** The re-reviewer verdicts each open finding
`ADDRESSED` or `NOT ADDRESSED`, and flags new breakage **in the fix diff only**. Out-of-scope observations go
to the ledger as deferred minors; they never extend the loop.

`@reviewer-agent` gains a `MODE: task | re-review` input and a matching report shape. Its `task` behaviour is
unchanged.

### Part 5 — Escalation and the breaker

`MAX_ATTEMPTS` stays **3** — the framework's number. Superpowers uses 5; there is no evidence our loop needs
more rounds, and changing it would be change for its own sake.

- **Rounds 1-2** — `@fix-agent` on its declared model.
- **Round 3** — the coordinator passes an explicit `MODEL` one tier above the agent's declared model. A loop
  that survives two rounds usually means the agent cannot see its own problem.
- **At the cap** — the coordinator stops dispatching and **adjudicates each open finding**, writing a
  `Ruling:` line for every one, then continues. It does not stop the session.

**Four things still stop the session, and only these:** an irreversible or destructive operation; a
security-sensitive action; a side effect outside the working tree that norms say you ask about first (a merge,
a push to a shared branch, a publish); and a plan so broken that every path forward is a guess.

**Every ruling reaches the human.** STEP 17 (Completion) collects every `Ruling:` line from the ledger into a
"Rulings I made" section, in the order they were made, each with what it costs if wrong. A ruling that stays
in the ledger and never surfaces is a decision made in secret.

### Part 6 — The pre-flight scan

Before dispatching Task 1, the coordinator reads `tasks.md` once and writes a table to the ledger:

- one row per pair of tasks sharing a file or an interface — what one `Produces` against what the other
  `Consumes`, and what was found;
- one row per task — whether its own text agrees with itself.

**The output is a table, not a verdict.** "The scan is clean" without the rows is not a scan that ran. Every
conflict it finds is ruled on before Task 1 is dispatched, with the ruling recorded beside its row.

This is the mechanic that consumes topic 001 directly. Without declared `Consumes` / `Produces` pairs, there
is nothing to put in the rows.

### Part 7 — The internal layer

`add-framework--build` and `add-framework--self-build` get the same three mechanics that make sense for them:

- **A ledger** at `docs/plans/<plan-basename>--ledger.md`, same shape, one line per F-block.
- **A commit per F-block**, with `BASE..HEAD` recorded in the ledger.
- **Rulings instead of per-item stalls.** `add-framework--self-build.md:141`'s *"Wait for checkpoint approval
  before next item"* is replaced by a ruling recorded in the ledger and surfaced at completion. The
  **plan-level** approval gate at STEP 2 (`Design [STOP]`) stays — that is the human's real decision point.

They do **not** get subagent dispatch, the review loop, or the pre-flight scan. Internal builds are
single-artefact edits validated by `node scripts/build.js` and the test suite; a per-F-block review seat would
cost more than it catches.

**The `CLAUDE.md` ownership contradiction gets settled here** rather than left to a future reader:
`/add-framework--build` owns `CLAUDE.md`'s derived counts and the prose describing what it changed (STEP 6.3,
6.4); `add-framework--plan.md:395`'s claim that it "reaches neither `CLAUDE.md` nor `.claude/`" is wrong about
`CLAUDE.md` and right about `.claude/`, and is corrected to say exactly that.

## Scope

### Includes

- The build ledger, its script, and the resume rule that reads it.
- Retiring `GIT CLEAN`; commit per task or per area; `BASE`/`HEAD` recorded in the ledger.
- Fixing the "absence of a commit is the signal" sentence in `add.plan-to-ready.md`.
- Rewriting `add.build.md:661-675` and `add.done.md:400` for the new reason.
- `task-brief.sh`, `review-package.sh`, `build-ledger.sh`, and the self-ignoring `_build/` directory.
- `MODE: re-review` on `@reviewer-agent` and the scoped re-review step.
- Model escalation at round 3; the breaker; rulings; the "Rulings I made" completion section.
- The pre-flight scan.
- Ledger, per-F-block commits and rulings in the two internal builders; correcting the `CLAUDE.md`
  ownership claim.

### Does NOT Include

- Changing `MAX_ATTEMPTS` from 3 — the framework's number stands.
- Adding any new agent — the re-review is a mode on `@reviewer-agent`.
- Moving `checkpoint/*` tag creation out of `/add.plan-to-ready`.
- Parallel implementation dispatch changes — the existing area-parallel model (Backend ∥ Frontend on
  different files) is deliberate and stays.
- Subagent dispatch or a review loop in the internal builders.
- Anything in topic 001 or 003.

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| Ledger tracked under `docs/features/`, not git-ignored scratch | It is already the feature's record; `git clean -fdx` cannot destroy it; the reviewer and the PR see the rulings | A `.codeadd/sdd/<plan>/` workspace deleted at the end — superpowers' shape, but it hides the rulings and invents a second state location |
| Commit per task in TASKS MODE, per area otherwise | Tasks are already service-scoped and capped at 3 files; other modes have no task IDs to commit against | One commit per area always — loses the per-task diff the review needs |
| `/add.plan-to-ready` keeps the tag; the "no commit" signal becomes "no tag" | One tag owner; and the old signal is factually broken by per-task commits | Leaving the sentence alone — a subfeature that failed would read as converged |
| `_build/` ignores itself with a `.gitignore` containing `*` | Briefs, reports and diffs never reach a commit, and the installer needs no change | Adding entries to the user's root `.gitignore` at install time |
| Re-review is a `MODE` on `@reviewer-agent` | One fewer artefact to register, build and keep in the graph; the inputs are 90% shared | A dedicated `@re-reviewer-agent` |
| `MAX_ATTEMPTS` stays 3 | No evidence our loop needs more; superpowers' 5 is their number, not a finding | Adopting 5 for parity |
| Model escalates at round 3, not round 2 | Two rounds on the declared model is a fair trial; escalating at 2 pays for capability we usually do not need | Escalating at every round |
| At the cap the coordinator rules and continues | A session parked on a question costs a day; a wrong ruling costs rework the human can see and undo | Reporting and stopping, as today |
| Internal builders get ledger + commits + rulings, not the review loop | Internal builds are single-artefact edits already gated by `build.js` and the test suite | Full parity with `/add.build` — a review seat per F-block costs more than it catches |
| The plan-level `Design [STOP]` gate stays in both internal builders | That is the human's real decision point; the per-item checkpoint is what wastes their time | Removing all human gates |

## Accepted Trade-offs

- **The ledger appears in the pull request.** Accepted: it carries the rulings, and a reviewer who cannot see
  what was decided on their behalf cannot review it.
- **The human loses "review everything before anything is committed".** Accepted, and it was the explicit
  call — the commits are on a feature branch, and per-task commits are what make per-task review possible.
- **Three new scripts to maintain.** Accepted: each is small, and each replaces content that currently
  travels through the model's context on every turn.
- **`add.build` grows a git surface it never had.** Accepted, with the mitigation that every git operation is
  in one named place (the commit step), not scattered across modes.

## Risks and Mitigations

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| A commit lands with a failing build, because the commit step runs before validation | Medium | High | The commit happens after the area validator returns and the build passes — the order is fixed in the plan, and the ledger line records `BUILD_STATUS` |
| The ledger and `git log` disagree after a crash mid-task | Medium | Medium | The ledger records `BASE..HEAD` per line; on resume the coordinator reconciles against `git log` and trusts git for what exists |
| Rulings become a way to silently override the plan | Medium | High | Every ruling carries what it costs if wrong, and all of them are printed at completion; a ruling that is not in the final report is a defect |
| `_build/` scratch is committed anyway on a provider that ignores nested `.gitignore` | Low | Low | All 5 providers run git; nested `.gitignore` is a git feature, not a provider feature |
| The scoped re-review is skipped because "the fix was small" | Medium | Medium | The completion gate refuses a task whose ledger has a fix round with no re-review line |
| Per-task commits break `done.sh --merge`'s assumptions | Low | High | `done.sh` squash/merge behaviour is verified against a branch carrying per-task commits before the change lands |

## Ecosystem Impact

**Product layer:**

- `framwork/.codeadd/commands/add.build.md` — invariant 54, STEP 10 dispatch shape, STEP 11 commit step,
  STEP 12 re-review, STEP 16 ledger, STEP 17 rulings, and the rewritten 631-645 note
- `framwork/.codeadd/commands/add.plan-to-ready.md` — the "no commit is the signal" sentence
- `framwork/.codeadd/commands/add.done.md:400` — the `/add.build` claim
- `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` — ledger, path handoff, re-review,
  breaker, rulings, pre-flight scan; the in-context Decision Log is replaced
- `framwork/.codeadd/agents/reviewer-agent.md` — `MODE` input and re-review report shape
- `framwork/.codeadd/scripts/` — `task-brief.sh`, `review-package.sh`, `build-ledger.sh`
- `framwork/provider-map.json` — three scripts ship under `scripts/`, which is already a shipped subdir

**Internal layer:**

- `.claude/commands/add-framework--build.md` — ledger, per-F-block commit, rulings
- `.claude/commands/add-framework--self-build.md` — same, and the per-item checkpoint is replaced
- `.claude/commands/add-framework--plan.md:395` — the `CLAUDE.md` ownership claim
- `.opencode/` — the mirrored adapters
- `CLAUDE.md` — the pipeline section gains the three scripts

**Not touched:** `cli/`, `scripts/build.js`, `done.sh`, `converge-gates.sh`, `qa-*`.

## Next Steps

1. Land topic 001 first — the pre-flight scan and the constraints block have nothing to read without it.
2. `/add-framework--plan` for the product half.
3. `/add-framework--self-plan` for the internal half.
