# Plan: Durable Executor — a ledger on disk, a hash per delivery, and a loop that rules instead of stalling

> **Status:** implemented
> **Type:** product (3 new scripts + 1 skill + 1 agent + 3 commands)
> **Created:** 2026-09-07
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

Design doc: `docs/brainstorming/2026-09-07T005046-superpowers-adoption-002-durable-executor.md`. It carries
the ledger shape, the script contracts, the rejected alternatives and the four hard stops; this plan names
files and order and does not repeat them.

**Depends on `0078-PLAN--…-001`.** The pre-flight scan reads the `Consumes` / `Produces` pairs that plan
introduces, and the reviewer's attention lens is the `## Global Constraints` block it introduces. Building
this first means building both twice.

## Problem

Seven gaps, one shape: **the coordinator forgets, and nothing on disk reminds it.**

The Decision Log is conversation, so a compaction erases the answer to "is task 4 done?" — and a coordinator
that lost its place re-dispatches finished work. `add.build.md:82` forbids committing, so `BASE..HEAD` does
not exist, so there is no scoped diff to hand a reviewer and the `checkpoint/*` tag is documented at
`add.build.md:661-675` as a lie. `@fix-agent` returns and the build runs, but the **fix diff is never
reviewed** — a fix that compiles and misses the finding passes. And when `MAX_ATTEMPTS` runs out the command
reports and stops, turning every unresolved finding into a human question including the ones it could settle
itself.

## Proposal

Five batches: the scripts that make handoff-by-path possible; the skill that defines the loop; the agent mode
the loop needs; the command that runs it; and the two consumers whose text becomes false.

## Scope

### Includes

#### T1 — Scripts and scratch

- **F1** — `framwork/.codeadd/scripts/build-ledger.sh LEDGER_FILE LINE`: appends one line, creating the file
  with its identity header (`# Build ledger — feature: <ID> — plan: <path>`) when absent. Exit 0 always
  except on CLI misuse (exit 2) — the `qa-preflight.sh` contract that `converge-gates.sh` already follows.
  Prints `LEDGER=<path>`.
- **F2** — `framwork/.codeadd/scripts/task-brief.sh TASKS_FILE TASK_ID OUT_DIR`: extracts one `## Execution`
  task's full block — description plus all six sub-bullets — into its own file and prints `BRIEF=<path>`.
  Creates `OUT_DIR` and, when absent, a `.gitignore` inside it containing `*`.
- **F3** — `framwork/.codeadd/scripts/review-package.sh BASE HEAD OUT_DIR`: writes `git log --oneline`,
  `git diff --stat` and `git diff -U10` for `BASE..HEAD` into one file and prints `PACKAGE=<path>`. Same
  directory creation and self-ignore. **Refuses an empty range** (exit 2) — an empty review package is how a
  reviewer gets dispatched against nothing and returns "looks fine".
- **F4** — The scratch directory is `${FEATURE_DIR}/_build/`, or `${SF_DIR}/_build/` on an epic, and it
  **ignores itself** through the `.gitignore` F2 and F3 write. Briefs, reports and diff packages never reach
  a commit, and the installer needs no change to make that true. The **ledger is not scratch** — it lives at
  `${FEATURE_DIR}/build-ledger.md` (or `${SF_DIR}/`) and is tracked, because it carries the rulings.

#### T2 — The loop

- **F5** — `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md`: the in-context
  `### DECISION LOG` block is **replaced** by the ledger — its canonical format, its identity first line, the
  resume rule (a task with a `complete` line is never re-dispatched; a task whose last line is a fix round
  resumes at the next round), and the instruction to trust the ledger and `git log` over recollection after a
  compaction. Add: the **pre-flight scan** (one row per task pair sharing a file or an interface, one row per
  task for self-consistency, written to the ledger, ruled on before Task 1 — "the scan is clean" without the
  rows is not a scan that ran); **handoff by path** (the dispatch carries brief path, report path, interfaces
  from earlier tasks, and the `## Global Constraints` block verbatim; the agent returns only status, commits,
  a one-line test summary and concerns); the **scoped re-review**; **model escalation at round 3**; the
  **breaker** and `Ruling:` format; and the **four hard stops**. Fold in the salvage from the deleted
  `add-planning`: the S/M/L sizing table and "one semantic commit per batch", which becomes the commit rule.
  **Must NOT lose:** `TASK_DOCUMENTS` and its telephone-game rationale, the Named Agent Mapping, the
  Coordinator Compliance Gate, the Final Review, and the "never patch manually" rule.

#### T3 — The agent

- **F6** — `framwork/.codeadd/agents/reviewer-agent.md`: add a `MODE: task | re-review` input. In
  `re-review`, the agent verdicts **each open finding** `ADDRESSED` or `NOT ADDRESSED` and flags new breakage
  **in the fix diff only**; out-of-scope observations are reported as deferred minors and never extend the
  loop. `MODE: task` behaviour is byte-unchanged and is the default when the caller omits `MODE`.
  Update the `<!-- uses: -->` block if the mode pulls in anything new. **No new agent** — the artefact-graph
  gate counts agents, and the inputs are 90% shared.

#### T4 — The command

- **F7** — `framwork/.codeadd/commands/add.build.md:82`: `GIT CLEAN` is **retired** and replaced by the
  commit contract — one commit per `tasks.md` task in TASKS MODE, one per area dispatch in DEVELOPMENT and
  CORRECTION MODE, message per `add-commit`, with the task id and feature id as trailers.
- **F8** — Same file, STEP 11: after the area validator returns **and the build passes**, record
  `BASE`/`HEAD` and commit. The order is the requirement: a commit that lands before validation is a commit
  of unvalidated code.
- **F9** — Same file, STEP 10: the dispatch template hands paths, not pasted content — brief path, report
  path, and the `## Global Constraints` block copied verbatim from `plan.md`.
- **F10** — Same file, STEP 12: after `@fix-agent` returns, run `review-package.sh FIX_BASE HEAD` and
  dispatch `@reviewer-agent` with `MODE: re-review`. Rounds 1-2 use the agent's declared model; **round 3
  passes an explicit `MODEL` one tier above it**. `MAX_ATTEMPTS` stays **3**.
- **F11** — Same file, STEPS 1 and 5: before mode detection, read the ledger if it exists and resume from the
  first task with no `complete` line. STEP 16 writes the ledger line for every task, fix round, deferred
  minor, parked finding and ruling.
- **F12** — Same file, the note at 631-645: rewritten. The reason the `checkpoint/*` tag is not created here
  is no longer "there is no commit" — it is **one tag owner**. `/add.plan-to-ready` keeps creating it, now on
  top of real commits. The prohibition on writing `epic.md`'s `checkpoint` column stays; its justification
  changes.
- **F13** — Same file, STEP 17: a **"Rulings I made"** section collecting every `Ruling:` line from the
  ledger, in the order made, each with what it costs if wrong. Exhaustive — if the ledger holds a ruling, the
  report holds it. A ruling that never surfaces is a decision made in secret.
- **F14** — Same file, before the first dispatch in STEP 10: run the pre-flight scan from F5 and write its
  table to the ledger.

#### T5 — The consumers whose text becomes false

- **F15** — `framwork/.codeadd/commands/add.plan-to-ready.md:428`: *"the absence of a commit is itself the
  signal"* is **factually broken** by F7 — commits now exist whether or not the subfeature converged. The
  signal becomes **the absence of the checkpoint tag**, which only the converged path creates. This is a hard
  requirement of this plan, not a cleanup: left alone, a subfeature that failed reads as converged.
- **F16** — `framwork/.codeadd/commands/add.done.md:400`: *"`/add.build` never creates a checkpoint tag"* is
  still true and stays; the surrounding sentence implying `/add.build` makes no commits is corrected.
- **F17** — Sweep the product layer for every surviving claim that `/add.build` leaves the tree unstaged or
  makes no commit. The three known sites are a floor; L5.1's grep is what proves the sweep finished.

### Does NOT Include (important!)

- **Changing `MAX_ATTEMPTS` from 3.** Superpowers uses 5; that is their number, not a finding about our loop.
- **Any new agent.** The re-review is a mode on `@reviewer-agent`.
- **Moving `checkpoint/*` tag creation out of `/add.plan-to-ready`.** One tag owner, unchanged.
- **Changing the area-parallel dispatch model.** Backend ∥ Frontend on different files is deliberate and
  stays; superpowers' "never dispatch implementers in parallel" is a rule for a single-file-space executor.
- **Subagent dispatch, a review loop or a pre-flight scan in the internal builders.**
  `0078-SELF-PLAN--…-002` gives them the ledger, the commits and the rulings, and explicitly not the rest.
- **`done.sh`, `converge-gates.sh`, `qa-*`, `cli/`, `scripts/build.js`.**

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| The ledger is tracked under `docs/features/`, not git-ignored scratch | It carries the rulings, and a reviewer who cannot see what was decided on their behalf cannot review it; `git clean -fdx` cannot destroy it | A `.codeadd/sdd/<plan>/` workspace deleted at the end — superpowers' shape, but it hides the rulings and invents a second state location |
| Scratch lives in a self-ignoring `_build/` | Briefs, reports and diffs never reach a commit, with no installer change | Adding entries to the user's root `.gitignore` at install time |
| Commit after validation, never before | A commit of unvalidated code is worse than no commit | Committing on the agent's report alone |
| Re-review is a `MODE` on `@reviewer-agent` | One fewer artefact in the registry and the graph; the inputs are 90% shared | A dedicated `@re-reviewer-agent` |
| Model escalates at round 3, not round 2 | Two rounds on the declared model is a fair trial | Escalating every round |
| At the cap, rule and continue | A session parked on a question costs a day; a wrong ruling costs rework the human can see and undo | Reporting and stopping, as today |
| `review-package.sh` refuses an empty range | An empty package is how a reviewer gets dispatched against nothing and returns "looks fine" | Emitting an empty file |
| F15 is a requirement, not a cleanup | Per-task commits break the sentence outright | Filing it as follow-up work |

## Accepted Trade-offs

- **The ledger appears in the pull request.** Accepted: it carries the rulings.
- **The human loses "review everything before anything is committed".** Accepted — it was the explicit call.
  The commits are on a feature branch, and per-task commits are what make per-task review possible.
- **Three new scripts to maintain.** Accepted: each replaces content that currently travels through the
  model's context on every turn.
- **`add.build` grows a git surface it never had.** Accepted, with the mitigation that every git operation
  lives in one named step rather than scattered across modes.

## Risks and Mitigations

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| A commit lands with a failing build | Medium | High | F8 fixes the order; L4.3 asserts the commit step is downstream of the validator and the build gate; the ledger line records `BUILD_STATUS` |
| Ledger and `git log` disagree after a crash mid-task | Medium | Medium | Every line records `BASE..HEAD`; on resume the coordinator reconciles against `git log` and trusts git for what exists |
| Rulings become a silent override of the plan | Medium | High | Every ruling carries its cost-if-wrong, and F13 prints all of them; a ruling missing from the report is a defect L6.4 checks for |
| The scoped re-review is skipped because "the fix was small" | Medium | Medium | The completion gate refuses a task whose ledger has a fix round with no re-review line (L4.5) |
| Per-task commits break `done.sh --merge` | Low | High | L2.4 runs `done.sh --merge` against a branch carrying per-task commits **before** F7 lands |
| `_build/` scratch is committed on some provider | Low | Low | Nested `.gitignore` is a git feature, not a provider feature; L1.4 asserts it after a real run |
| F17's sweep misses a site and a command still claims the tree is left unstaged | Medium | Medium | L5.1 greps the whole product layer, not the three known lines |

## Ecosystem Impact

| Artefact | Action | Reason |
|---|---|---|
| `scripts/build-ledger.sh`, `task-brief.sh`, `review-package.sh` | create | handoff by path and durable state |
| `add-subagent-driven-development/SKILL.md` | modify | the loop is redefined |
| `agents/reviewer-agent.md` | modify | `MODE: re-review` |
| `commands/add.build.md` | modify | 8 F-blocks — the command is the loop |
| `commands/add.plan-to-ready.md` | modify | the converged signal |
| `commands/add.done.md` | modify | the `/add.build` claim |

`framwork/provider-map.json` needs **no entry**: `scripts` is one of `SHIPPED_SUBDIRS` in
`scripts/build.js:660` and is copied wholesale. `.sh` is not a lintable extension, so
`assertNoLintableSources` does not fire.

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level is written and confirmed failing before F1 lands.

### L1 — Build-side (RED → GREEN)

1. `node scripts/build.js` exits 0 and the artefact graph gains exactly three `script` nodes.
   *RED today: the scripts do not exist.*

   > **Plan correction, 2026-09-07.** This level originally read "appear in every provider's
   > `scripts/` output". No provider has a `scripts/` output — `SHIPPED_SUBDIRS` is not a copy list, it
   > is only read by the lint gate at `build.js:1327`. Scripts ship **once**, zipped verbatim from
   > `.codeadd/scripts` by `release.yml:102`. The Ecosystem Impact section already said this
   > correctly; only this level was wrong. Recorded as CONFLICT 6.
2. `bash -n` parses each new script.
3. `checkArtefactGraph` emits no new warning against a pre-F1 baseline.
4. After a real build run, `git status --porcelain` shows nothing under `${FEATURE_DIR}/_build/`.
   *RED today: the directory does not exist.*

### L2 — Script contracts (RED → GREEN)

1. `build-ledger.sh` on a missing file creates it with the identity header; on an existing one appends only.
   Called twice with the same line, it appends twice — it is a log, not a set.
2. `task-brief.sh` on a task with six sub-bullets writes all six, and writes `.gitignore` containing `*`.
3. `review-package.sh BASE HEAD` writes a file containing all three sections, and **exits 2 on an empty
   range**.
4. `done.sh --merge` succeeds against a scratch branch carrying three per-task commits.
   *This runs before F7 — if it fails, the plan stops here.*

### L3 — Skill content (RED → GREEN)

1. `add-subagent-driven-development/SKILL.md` contains no `### DECISION LOG` block and does contain the
   ledger format, the resume rule, the pre-flight scan, the re-review, the breaker, the `Ruling:` format and
   the four hard stops. *RED today on all seven.*
2. `TASK_DOCUMENTS`, the Named Agent Mapping, the Compliance Gate and the Final Review survive byte-for-byte
   in substance. *A preservation guard, green throughout.*

### L4 — Command integration (RED → GREEN)

1. `grep -c 'GIT CLEAN' add.build.md` returns 0, and the commit contract is present. *RED today: 3 hits.*
2. STEP 10's dispatch template passes brief and report **paths**, and the constraints block verbatim.
3. The commit step is textually downstream of the validator return and the build gate.
4. STEP 12 dispatches `@reviewer-agent` with `MODE: re-review` after every fix round, and round 3 carries an
   explicit `MODEL`.
5. STEP 17 refuses completion when the ledger holds a fix round with no matching re-review line.
6. STEP 17 emits "Rulings I made".

### L5 — Consumer coherence (RED → GREEN)

1. `grep -rn 'never git add\|leave files unstaged\|absence of a commit' framwork/.codeadd/commands/` returns
   only sentences that are still true. *RED today: `add.plan-to-ready.md:428` and `add.build.md:82`.*
2. `add.plan-to-ready.md` states the checkpoint **tag**, not the commit, as the converged signal.

### L6 — Behavioural acceptance (dogfood, manual)

1. Run `/add.build` on a scratch feature with two tasks. `git log` shows two commits; the ledger holds two
   `complete` lines whose hash ranges match them.
2. Force a review finding on task 2. The ledger shows `fix round 1/3`, a re-review line, then `complete`.
3. Kill the session after task 1 and re-run. Task 1 is **not** re-dispatched; execution resumes at task 2.
4. Force three failed rounds. The command **does not stop** — it writes a `Ruling:` line per open finding and
   continues, and STEP 17's "Rulings I made" lists every one of them.

**RED expectations against the current tree:** L1.1, L1.4, L2.1–L2.3, L3.1, L4.1–L4.6, L5.1, L5.2 and all of
L6 fail today. **GREEN = every level passes after F1–F17.**

## Execution Order

`T1 → T2 → T3 → T4 → T5`, with the whole matrix written and confirmed RED before F1, and **L2.4 run before
anything else**.

- **L2.4 first, before any F-block.** If `done.sh --merge` cannot handle a branch with per-task commits, the
  whole plan changes shape. Finding that out after F7 means unwinding the command.
- **T1 before T2** because the skill references the scripts by name and contract; a skill describing scripts
  that do not exist is a dangling reference in prose.
- **T2 before T4** because `add.build` implements the loop the skill defines. Writing the command first means
  writing the loop twice and reconciling them.
- **T3 before T4** because F10 dispatches a mode the agent must already accept.
- **T5 immediately after F7, in the same landing.** F7 and F15 are one change seen from two files: the moment
  commits exist, `add.plan-to-ready.md:428` is false.

**Safe stopping points:** after **T1** (three unused scripts — additive, nothing reads them);
after **T3** (the agent accepts a mode nobody sends — additive).

**Not a safe stop:** between **F7 and F15**, which is the one place this plan can leave the framework
actively lying about whether a subfeature converged. Also not mid-**T4**: a command that commits but does not
write the ledger has traded a recoverable state for an unrecoverable one.

## Reviewer Handoff

`/add-framework--shared-review` must audit this without re-reading the design doc. For each F-block, the
evidence file carries:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, separating RED-then-GREEN from the preservation guards (L1.2, L1.3,
  L3.2).
- **L2.4's output verbatim**, with its timestamp, proving it ran **before** F7.
- **The L6 dogfood transcript** — the ledger file itself, not a summary of it. L6.3 and L6.4 are the two
  levels a build is most likely to claim rather than run.

Specific gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — especially L4.5 and L6.4, where a check
   written after the fact proves nothing.
2. **F15 landed as a wording change rather than a semantic one.** The sentence must now name the tag. A
   reviewer that reads only the diff's shape will miss a rewrite that kept the old meaning.
3. **The commit step drifting upstream of the build gate** during F8. The order is the entire safety
   property; a reviewer must read the final STEP 11 top to bottom, not trust the F-block description.
4. F13's list being *representative* rather than exhaustive. Every `Ruling:` in the ledger appears in the
   report, or the mechanism is decorative.

## References

- Design doc: `docs/brainstorming/2026-09-07T005046-superpowers-adoption-002-durable-executor.md`
- Umbrella: `docs/plans/0078-PLAN--superpowers-adoption-000-umbrella.md`
- Depends on: `docs/plans/0078-PLAN--superpowers-adoption-001-plan-contract.md`
- Internal twin: `docs/plans/0078-SELF-PLAN--superpowers-adoption-002-durable-executor.md`
- Upstream: `superpowers@6.3.0` `subagent-driven-development` (MIT, Jesse Vincent)
- Prior art: `converge-gates.sh` — the `KEY=STATUS`, always-exit-0, exit-2-on-misuse script contract

## Next Steps

/add-framework--build 0078-PLAN--superpowers-adoption-002-durable-executor

Then, for the internal layer:

- `/add-framework--self-build 0078-SELF-PLAN--superpowers-adoption-002-durable-executor`

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation |
| 2026-09-07 | Implemented in `a8e7f98 + 79050c3 + 3ba7fe4` on branch `feat/superpowers-adoption` (PR #34) |
