# Brainstorm: The seven writes

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-23
> **Type:** architecture
> **Ticket:** 0005B
> **Set:** `2026-09-23T164422-board-pipeline-phase-statuses-000-umbrella.md`, subtopic 003

## Objective

Today the board can only say whether a ticket was decided, is in progress, or is finished. When this is
done, a ticket's status says **which pipeline phase it is in and which command takes it out of there** —
and every pipeline command writes its own phase, without any of them stopping because of the board.

**Serves the objective by** making every command write its own phase, and keeping the board from stopping
any of them. Subtopic 001 makes the phase expressible and 004 makes it visible; this is the only subtopic
that makes a ticket actually move.

## Discovery

- **`add-backlog/references/lifecycle.md`** — "the one procedure five commands share". Its per-command table
  says `no` for `add.brainstorm`, `add.new` and `add.plan`, and `yes` for `add.build` (`doing` + `work_id`,
  one write) and `add.done` (`done`). Its **Degradations** table makes every failure one line in a final
  report. It uses the word **"hook"** for "integration point inside a command", which has already been
  misread as a platform hook.
- **`add.build.md:1424`, STEP 17 Publish [STOP]** — a five-outcome table: `on-main`, `no-gh — pushed`,
  `pr-updated <url>`, `pr-opened <url>`, `declined — local merge`. Only two of the five mean a PR exists.
- **`add.done.md:993-1008`, `### 8.3 Close the Ticket`** — after the merge, on either route, read-first.
- **`add.plan.md:211-217`** — STEP 4 reads the ticket as planning input; the command writes nothing.
  Its last step is **STEP 13: Completion** (`:847`).
- **`add.new.md:122`, STEP 2** — allocates the feature id, creates the structure, writes the skeleton
  `about.md` with `ticket:`. Its validation gate is **STEP 7** (`:376`). `lifecycle.md` bans setting
  `work_id` here.
- **`add.hotfix.md`** — **opens no PR.** `STEP 14: Completion → Inform user, awaiting /add.done` (`:57`,
  `:608`). STEP 3 allocates the id and the branch and creates only the **directory**
  (`:191` — "about.md … written in STEP 12"); the `about.md` itself lands at **STEP 12** (`:488`). It carries
  no ticket instruction today, confirmed in the graph — it has no `add-backlog` edge at all.
- **`workbench/skills/add-plan-authoring/SKILL.md` § The Ticket** (`:179-264`) — the internal equivalent.
  Two writes: `doing` + `work_id` at `add-framework--build` STEP 5.1, `done` at `add-framework--done` STEP 8.
  **`work_id` is the plan basename** there, not a feature id.
- **`workbench/skills/add-framework--build/SKILL.md:571`, STEP 9 Publish [STOP]** — the internal build does
  open a PR, so the internal flow has a real `in-review`.
- **Subtopic 002** — the `board` feature exists, `default: false`, with five fragments carrying every ticket
  instruction that existed before this set. This subtopic adds to those fragments rather than to the command
  bodies, and adds `add.hotfix` as the sixth.
- **Subtopic 001** — the nine reserved statuses ship in `DEFAULT_DEFS`, so a fresh install defines all of
  them. An existing definitions file is **never written**, so a user who renamed one still gets
  `REFUSED=unknown-status` on every write that names it.
- **Delivery index (`history`)** — nothing `gone`, nothing `superseded`.

## Context & Motivation

This is where the objective's value lands. Everything else is a format, a flag and a rendering. Two writes
become seven, in two pipelines, and a command that promised to touch nothing starts moving state.

It is also the subtopic that decides whether the board can be trusted. Seven writes triggered by an agent
reading a step will sometimes not happen. The design's answer has to be good enough that a missed write
leaves the board coarse rather than lying.

## Problem / Opportunity

1. **Only two of five commands write**, and the reason `lifecycle.md` gives — a board write commits and
   pushes — turns out to be narrower than it reads: `backlog-commit.sh` reaches the **base** branch, through
   a detached locked worktree, never the caller's branch.
2. **`add.hotfix` has no route to a ticket at all.** No `ticket:` in its `about.md`, no instruction, no
   graph edge. It also opens no PR, so it cannot reach `in-review`.
3. **The exit write needs a place to stand** in commands whose last step is a report, not an event.
4. **`work_id`'s ban in `add.new` was justified by a promise this subtopic breaks.** The ban is right; its
   stated reason stops being true the moment `add.new` writes the board.
5. **A skipped write is invisible.** Nothing in the pipeline notices that a ticket is a column behind.

## Proposed Solution

### The phase pair

```
phase      entry      exit        the exit means
---------  ---------  ----------  ----------------------------------------
shaping    refining   shaped      about.md or the intent file exists
planning   planning   planned     the plan is written and approved
building   doing      in-review   a PR is open
done       —          done        merged
```

**The phase check** — the entry write is skipped when the ticket is already in that phase's **entry or
exit**. The exit write keeps the existing single-field rule: written unless the ticket already reads it.
Only the entry write needed widening, because only the entry write can move a ticket backwards.

### The `work_id` stop — what makes an epic safe

⛔ **The phase check alone is not enough, and an epic is where it breaks.** `add.plan` and `add.build` run
**once per subfeature**: `add.build`'s `## Loop End` closes one subfeature, and its STEP 18.2 names
`/add.plan ${FEATURE_ID}` as the next command for the next one. So subfeature 2's `add.plan` would write
`planning` onto a ticket subfeature 1 already carried to `in-review`, and subfeature 2's `add.build` would
write `doing` over it. The board would run backwards on work that is further along — the one outcome this
whole set must not produce.

**The rule, and it needs no notion of ordering:**

```
ONCE THE TICKET'S work_id EQUALS THIS RUN'S WORK ID,
ONLY in-review AND done MAY STILL BE WRITTEN.
refining, shaped, planning, planned and doing are all skipped.
```

**`work_id` is already the marker for "this work started".** It is set in the same write as `doing`, it is
the existing skip condition for that write, and it is the epic's id — not the subfeature's — so every
subfeature cycle reads the same value. Nothing new is introduced; one existing field is asked one more
question.

Walked through a three-subfeature epic:

| Run | `work_id` on the ticket | Writes |
|---|---|---|
| `add.new` | unset | `refining`, then `shaped` |
| SF1 `add.plan` | unset | `planning`, then `planned` |
| SF1 `add.build` | set here, with `doing` | `doing`, then `in-review` |
| SF2 `add.plan` | matches | **nothing** — the `work_id` stop |
| SF2 `add.build` | matches | `doing` skipped; `in-review` already read, so skipped |
| SF3, same | matches | nothing |
| `add.done` | matches | `done` |

**It covers three more cases for free**, each of which the phase check alone left open: `add.plan` re-run
after a build started, `add.build` resumed, and `add.done`'s Resume route.

⛔ **The epic ticket tracks the epic, not the subfeature.** That is not a simplification — `work_id` is the
epic's `FEATURE_ID`, so the format already says one ticket means one unit of work. A board that showed each
subfeature's phase would need one ticket per subfeature, which is a different request.

### Every exit write sits in the command's final report step

⛔ **An exit write anchored to a mid-command gate is lost by a resume.** `add.new`'s Continue Mode skips
STEP 7 outright when a logged state says the validation gate already passed — so a run that passed the gate
and died before the board write would never revisit it, and `shaped` would be lost with no way back.

**So every exit write sits in the step that emits the command's final report**, and reads the outcome the
command already recorded there:

| Exit write | Step | Reads |
|---|---|---|
| `shaped` (`add.brainstorm`) | its report step | that the intent file was written |
| `shaped` (`add.new`) | its report step — **not STEP 7** | that the validation gate passed |
| `planned` (`add.plan`) | STEP 13 Completion | that the plan is written and reviewed |
| `in-review` (`add.build`) | **STEP 18 — not STEP 17** | the `Publish:` outcome STEP 17 recorded |

**Three things fall out of this, and all three are improvements.** Every path and every resume reaches the
report step. The write sits next to the report line that must mention it, so a missed write and a missing
line cannot diverge. And `in-review` stops being anchored inside a five-row table — STEP 18 reads the
recorded outcome instead of re-deriving it.

**Entry writes stay where the event is**, because an entry write marks a beginning and a report step is an
ending.

### The product pipeline — where each write stands

| Write | Command | Exactly where | Not earlier, because |
|---|---|---|---|
| `refining` | `add.brainstorm` | after the effort path is classified | the path decides whether anything happens at all — a `spike` writes nothing |
| `shaped` | `add.brainstorm` | STEP 5.3, after the intent file is written | on `bounded` and `architectural` only; the intent file is what `shaped` asserts exists |
| `refining` | `add.new` | STEP 2, once the structure and the skeleton `about.md` exist | until then the run can still stop on a bad branch. **Skipped by the phase check when the brainstorm already wrote `refining` or `shaped`** |
| `shaped` | `add.new` | **its final report step**, reading that the validation gate passed | STEP 7 is skipped by Continue Mode, so a write anchored there is lost by a resume |
| `planning` | `add.plan` | STEP 4, where it already reads the ticket | it is the step that has the ticket in hand |
| `planned` | `add.plan` | STEP 13 Completion | the plan is not approved until the command is |
| `doing` + `work_id` | `add.build` | STEP 2, after `build-setup.sh` returns — **unchanged** | the existing reason stands verbatim |
| `in-review` | `add.build` | **STEP 18**, reading the `Publish:` outcome STEP 17 recorded, and only on `pr-opened` or `pr-updated` | the write belongs next to the line that reports it, and STEP 18 is reached on every path |
| `done` | `add.done` | STEP 8.3, after the merge — **unchanged** | the existing reason stands verbatim |

⛔ **STEP 17's other three outcomes write nothing.** `on-main`, `no-gh — pushed` and
`declined — local merge` all leave the ticket at `doing`, which is true: there is no PR to review. A write
of `in-review` there would be the board lying, which is the one thing this set must not introduce.

⛔ **Every one of these is additionally subject to the `work_id` stop above.** The table says where a write
stands; the stop says whether it fires at all.

### `add.hotfix` — the jump

Hotfix is the case the ticket asked for, and it needs no new mechanism because **there is no transition
validation anywhere.**

| What | Where |
|---|---|
| Resolve the ticket id from the **invocation**, the literal `[0-9]{4}B`, exactly as `add.brainstorm` does | STEP 1 |
| Write `doing` + `work_id` = the hotfix id | STEP 3, after `git branch --show-current` confirms the branch |
| Persist `ticket: <id>` into the hotfix `about.md` frontmatter | STEP 12, the step that writes that file |
| `done` | `add.done` STEP 8.3, which already reads `ticket:` from `${DIR}/about.md` |

So a hotfix ticket goes `open` → `doing` → `done`, skipping four phases. **`in-review` is never written by
a hotfix**, because `add.hotfix` opens no PR — it hands off to `/add.done`.

```
IF A HOTFIX TICKET IS AT open AND THE NEXT WRITE IS doing:
  ⛔ DO NOT: Write the skipped phases first to "catch up" the board
  ⛔ DO NOT: Refuse the write because refining, shaped, planning and planned never happened
  ✅ DO: Write doing. The board shows where the work is, not how it got there
```

⛔ **The gap between STEP 3 and STEP 12 is real and accepted.** The id lives only in memory until STEP 12,
so a run that dies between them leaves a ticket at `doing` with no document naming it. That is the same
class of gap `add.build` already accepts by writing at STEP 2, and the board is a side-record. Writing at
STEP 12 instead would leave the ticket at `open` while the fix is being built, which is worse.

### The internal pipeline — the same seven, ungated

`add-plan-authoring` § **The Ticket** grows from two write rows to seven. The phases map one to one, with one
correction to what the umbrella assumed: **`add-framework--build` STEP 9 opens a PR only when the user says
yes.** On "no" it defers, and `/add-framework--done` pushes and opens the PR when it runs.

So the internal side needs its own outcome rule, the counterpart of STEP 17's five-row table:

| STEP 9's answer | `in-review` |
|---|---|
| Yes — `gh pr create` ran | written at the build's report step |
| No — deferred to the close-out | **never written.** The ticket goes `doing` → `done` |

⛔ **`add-framework--done` does not write `in-review` on the deferred path**, even though it is the stage
that opens the PR there. It opens the PR and merges in the same run, so a ticket moved to `in-review` would
be moved to `done` seconds later — two commits describing a state nobody could have looked at. The jump is
the honest record, and it is the same jump a hotfix makes.

| Write | Stage | Where |
|---|---|---|
| `refining` | `add-framework--brainstorm` | after `2.2.2` classifies the path; nothing on `spike` |
| `shaped` | `add-framework--brainstorm` | `7.3`, after the intent file is written |
| `planning` | `add-framework--plan` | STEP 1.2, where it reads `ticket:` today |
| `planned` | `add-framework--plan` | after the plan document is written and reviewed, at its report step |
| `doing` + `work_id` | `add-framework--build` | STEP 5.1 — **unchanged** |
| `in-review` | `add-framework--build` | its report step, reading STEP 9's answer — **only on yes** |
| `done` | `add-framework--done` | STEP 8 — **unchanged** |

✅ **RESOLVED BY THE PLAN'S SHAPE, 2026-09-23.** This design recorded the plan-set limitation below as
accepted. The delivery is **one plan with four checkpoints on one branch**, so there is one `work_id` for
the whole set and the stop holds end to end. The text below is kept because the limitation is real for ANY
future ticket that does span a plan set — it just is not this delivery.

⛔ **The `work_id` stop does NOT bridge a plan set, when one is used.** The internal `work_id` is the **plan basename**, so four plans over one ticket carry
four different values. Subtopic 002's plan would therefore write `planning` onto a ticket subtopic 001's
close-out already moved to `done`, and the stop cannot see it.

**This set was nearly its own example: ticket `0005B` was first filed as four plans, and the plan was
consolidated into one for exactly this reason.**

| Why it is not fixed here | |
|---|---|
| **It already happens today** | `add-framework--done` writes `done` after the first plan of a set merges. That is delivered behaviour, not something these seven writes introduce |
| **The fix changes a delivered field's meaning** | It would mean `work_id` becoming the set's shared timestamp instead of the plan basename — read by the ledger, the delivery index and `docs/deliveries/` |
| **The cost is bounded** | The ticket bounces between phases across a set and lands on `done` at the last close-out. Coarse and noisy, never a wrong final state |

⛔ **A ticket spanning a plan set needs its own decision, and it is a different request.** Recording it here
is what stops the next reader assuming the `work_id` stop covers a case it cannot see.

⛔ **No feature gate here.** `workbench/` has no feature system, and this repository's own
`docs/backlog.definitions.json` is hand-edited for this flow. The asymmetry with the product layer is a
decision on this page, not a discovery later.

### `work_id` travels with `doing`, in both layers

Five writes now happen before `doing`, and none carries `work_id`.

⛔ **`lifecycle.md`'s ban on setting `work_id` in `add.new` stays, and its reason is replaced TWICE — the
second time because the first replacement was also weak.**

| Reason | Why it fails |
|---|---|
| The original: "this command makes NO git writes" | Stops being true the moment `add.new` writes the board |
| This design's first replacement: "until the build runs there is no work to name" | Also weak. After `add.new` there IS work — a feature directory and an `about.md` |
| **The real one: `work_id` is what the `work_id` stop reads.** Set it at `add.new` and the stop fires from `shaped` onward, suppressing `add.plan`'s `planning` write. The planning phase would vanish from the board | It is load-bearing, and a test can prove it |

**So the ticket needs a SECOND field for the link, and it gets one.** `add.new` STEP 2 writes
`{"status":"refining","feature":"<FEATURE_ID>"}` — one write, because the feature id is allocated in that
same step. Two fields, two jobs:

| Field | Means | Written by |
|---|---|---|
| `feature` | which feature carries this ticket | `add.new` STEP 2 |
| `work_id` | the build started | `add.build` STEP 2 |

**It holds the id, never a path.** `docs/features/0042F-<slug>/` carries a renameable slug; `0042F` does not,
and one glob resolves the path wherever someone needs it. Without this field, a ticket sits in `shaped` with
`Work: Not picked up` while its feature directory already exists — the board showing a phase it cannot
attribute.

### The degradation table, extended

Every row of `lifecycle.md`'s existing table still holds. Two change:

| Row | Before | After |
|---|---|---|
| `REFUSED=unknown-status` | "the user renamed `doing` or `done`" | **Still fully reachable**, and now for nine names instead of two. Subtopic 001 ships them in `DEFAULT_DEFS` but never writes an existing file, so a user who renamed one gets seven refusals — one per write, each a reported line |
| "one line in the command's final report" | covers two writes | covers **seven**, each named, in the report of whichever command made it |

```
IF A WRITE WAS REFUSED, DEGRADED OR SKIPPED:
  ⛔ DO NOT: Stop the command, fail the build, or refuse the merge
  ⛔ DO NOT: Report only the last one when several happened in one run
  ✅ DO: One line per write that did not land, in that command's final report
```

**This is where a missed write becomes visible or does not.** `add.plan` makes two writes; a report naming
one of them hides the other.

### The word "hook"

Every use of "hook" in `lifecycle.md` is replaced. It means "integration point inside a command" there, and
it has already made a reader ask whether `settings.json` was involved. Nothing in this design is a platform
hook.

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Entry write only** | Halves the writes and destroys the objective's second half. "Planning" that cannot distinguish running from parked is the coarseness this set exists to remove |
| **Write `in-review` on every STEP 17 outcome** | Three of five mean no PR. The board would say a review is open when none is |
| **Catch a hotfix up through the skipped phases** | Four writes describing a history that did not happen, and the board's job is where the work is |
| **Write hotfix's `doing` at STEP 12, when `about.md` exists** | The ticket would read `open` through the whole fix. The STEP 3/STEP 12 gap is the cheaper cost |
| **Move `work_id` earlier, now that `add.new` writes anyway** | `work_id` is read by the ledger, the delivery index and `docs/deliveries/`. Setting it before a build exists gives it a value nothing can resolve |
| **Give the internal layer its own reserved set** | Two lists in one script to keep equal. The seven map onto both flows |
| **Add a `status.sh` signal for a ticket that fell behind** | The right idea and the wrong subtopic. Named as out of scope so it is a decision, not an omission |

## Type of Artefact

architecture — two references, six product commands, one internal skill, and this repository's own
definitions file.

## Scope

### Includes

- **`add-backlog/references/phases.md` — NEW.** The phase MODEL: the nine statuses, the seven columns, what
  each phase means, and the entry/exit pairs. Split out of `lifecycle.md` so the question "what does
  `in-review` mean" has an owner separate from "who writes it".
- `add-backlog/references/lifecycle.md` rewritten to the PROCEDURE only: the phase check, the `work_id`
  stop, the seven writes with their exact steps, the extended degradation table, the replaced `work_id`
  reason, and the word "hook" removed. It points at `phases.md` for the model rather than restating it.
- **Every `board` fragment section carries an anchor and a pointer, never a procedure.** A section names the
  step and the write, then points at the row in `lifecycle.md` that owns it. Six fragments restating the
  procedure is six copies drifting — which is what `lifecycle.md` exists to prevent.
- The five new writes added to the `fragments/board/{command}.md` files subtopic 002 created.
- `add.hotfix` joins the `board` feature: `fragments/board/add.hotfix.md`, the registry's `commands` list
  grows from five to six, and the substitution-count literal in
  `cli/tests/injection-exclusivity.integration.test.js` bumps again, in both places.
- `add.hotfix`: the ticket id resolved from its invocation at STEP 1, `doing` at STEP 3, `ticket:` persisted
  into `about.md` at STEP 12.
- `add.build` STEP 17: `in-review` on `pr-opened` and `pr-updated` only.
- `workbench/skills/add-plan-authoring/SKILL.md` § The Ticket: seven write rows and the four stages' steps.
- This repository's own `docs/backlog.definitions.json`, hand-edited for the internal flow — **after
  confirming nothing else consumes it**, CI included.
- Each affected command's final-report step: one line per write that did not land, **and the exit write
  itself**, which now lives there.
- The `work_id` stop, stated in both references — `lifecycle.md` and `add-plan-authoring` § The Ticket.
- The internal two-outcome rule for `in-review`, keyed on `add-framework--build` STEP 9's answer.

### Does NOT Include

- **Any new status name or any change to the format.** Subtopic 001 owns all nine.
- Any change to `backlog.sh`, `backlog-commit.sh` or `backlog.bats`.
- Any change to `board/`. Subtopic 004.
- Creating the `board` feature or moving the instructions that existed before this set. Subtopic 002.
- **Transition validation of any kind.** It is what lets the hotfix jump.
- Moving `work_id` earlier than `doing`.
- **A drift signal in `status.sh`** for a write that never happened. Right idea, wrong subtopic.
- **A ticket that spans a plan set.** The `work_id` stop cannot bridge it, `add-framework--done` already
  closes on the first plan of a set today, and fixing it means redefining `work_id`. Its own request.
- **One ticket per subfeature.** An epic's ticket tracks the epic; showing each subfeature's phase is a
  different data model.
- Batching the writes. Seven writes, seven commits on the base branch.
- Any write from `add.review`, `add.pull-request`, `add.audit` or `add.diagnose`.
- A feature gate on the internal layer. It has no feature system.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| Entry and exit per phase, seven writes | the "next command is visible" half | A column that cannot tell running from parked does not answer the question the board is read for | ✅ |
| The entry write is skipped on entry **or** exit of the same phase; the exit write keeps the single-field rule | the "next command is visible" half | Stops `add.new` dragging a ticket back from `shaped`, with no ordering the format withheld | ✅ |
| **The `work_id` stop:** once the ticket's `work_id` equals this run's, only `in-review` and `done` may still be written | the "the board never runs backwards" part of the phase being visible | An epic runs plan→build once per subfeature, so the phase check alone lets SF2 write `planning` over SF1's `in-review`. `work_id` is already the "this work started" marker and it is the epic's id, not the subfeature's | ✅ |
| It covers `add.plan` re-run, `add.build` resumed and `add.done`'s Resume route for free | the same part | Four cases, one rule, one field that already exists | ✅ |
| The `work_id` stop does not bridge a plan set, and that is recorded as a limitation | the "one decision, one place" half | The internal `work_id` is the plan basename. Fixing it means redefining a field the ledger and the delivery index read — a different request, and the bad final state it could cause does not exist | ✅ |
| **Every exit write sits in the command's final report step**, reading the outcome the command recorded | the "the board never stops a command" half | `add.new`'s Continue Mode skips STEP 7 outright, so a write anchored there is lost by a resume with no way back. It also puts each write next to the line that must report it | ✅ |
| `in-review` moves from STEP 17 to STEP 18, reading the recorded `Publish:` outcome | the same half | STEP 18 is reached on every path, and the write stops living inside a five-row table | ✅ |
| Internally, `in-review` is written only when `add-framework--build` STEP 9 opens the PR | the "the board never lies" part | STEP 9 is a question. On "no" the close-out opens and merges in one run, so `in-review` would exist for seconds | ✅ |
| `in-review` on `pr-opened` and `pr-updated` only | the "the board never lies" part of the phase being visible | Three of STEP 17's five outcomes mean no PR exists | ✅ |
| `add.hotfix` resolves its ticket from the invocation, writes `doing` at STEP 3, persists `ticket:` at STEP 12 | the "every command writes its own phase" half | It runs no `add.new`, so there is no `about.md` to read at the start, and STEP 12 is the step that writes one | ✅ |
| A hotfix never writes `in-review` | the same half | `add.hotfix` opens no PR; it hands off to `/add.done` | ✅ |
| No catch-up writes for skipped phases | the "phase is visible" half | The board shows where the work is, not how it got there | ✅ |
| The STEP 3 / STEP 12 gap in hotfix is accepted | the "the board never stops a command" half | Writing later leaves the ticket at `open` through the whole fix, which is worse than a gap the board can be corrected from | ✅ |
| The internal layer gets the same seven, ungated | the "every command writes its own phase" half | No feature system in `workbench/`, and `add-framework--build` STEP 9 gives it a real `in-review` | ✅ |
| `work_id` stays with `doing`, and its ban in `add.new` gets a new reason | the "every command writes its own phase" half | The old reason — "makes no git writes" — stops being true here, and a ban on a false premise gets deleted by the next reader | ✅ |
| One report line **per write** that did not land | the "the board never stops a command" half | `add.plan` makes two; a report naming one hides the other | ✅ |
| Every "hook" in `lifecycle.md` is replaced | the "one decision, one place" half | It means integration point and has already been read as a platform hook | ✅ |

## Ecosystem Impact

`Called by` is from `impact --depth 1`. The fragments subtopic 002 created now carry these writes, so the
fragment rule applies: each fragment `INJECTS_INTO` its command and `USES_SKILL` `add-backlog`.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `add-backlog/references/lifecycle.md` | `add.brainstorm`, `add.build`, `add.done`, `add.new`, `add.plan`, `add-backlog` (USES_SKILL) — **and, after 002, the six `board` fragments** | Rewritten. The largest single edit in the set | required |
| `add-backlog` | `add.brainstorm`, `add.build`, `add.done`, `add.new`, `add.plan` (USES_SKILL) | Owns both references | required |
| `add-backlog/references/phases.md` | new — the six `board` fragments, `add-plan-authoring` | The phase model, split out of `lifecycle.md` | new |
| `fragments/board/add.brainstorm.md` | `add.brainstorm` (INJECTS_INTO) | Gains `refining` and `shaped` | required |
| `fragments/board/add.new.md` | `add.new` (INJECTS_INTO) | Gains `refining` and `shaped`, and the `work_id` ban's new reason | required |
| `fragments/board/add.plan.md` | `add.plan` (INJECTS_INTO) | Gains `planning` and `planned` | required |
| `fragments/board/add.build.md` | `add.build` (INJECTS_INTO) | Gains `in-review`, guarded by STEP 17's outcome | required |
| `fragments/board/add.done.md` | `add.done` (INJECTS_INTO) | Unchanged — `done` already moved in 002 | none |
| `fragments/board/add.hotfix.md` | new — `add.hotfix` (INJECTS_INTO) | The whole hotfix route | new |
| `add.hotfix` | `add`, `add.brainstorm`, `add.diagnose`, `add.done`, `fragments/tdd-pipeline/add.hotfix.md` and `plugins/gitnexus/fragments/add.hotfix.md` (INJECTS_INTO), `add-doc-schemas`, `add-investigation` | Its first board relation ever: STEP 1, STEP 3 and STEP 12 | required |
| `add.brainstorm` | `add`, `add.new` (HANDS_OFF_TO) | Two anchors added | required |
| `add.new` | 11 artefacts (HANDS_OFF_TO); `plugins/gitnexus/fragments/add.new.md` (INJECTS_INTO) | Two anchors added, one at STEP 7 | required |
| `add.plan` | 21 artefacts — 9 commands/agents, 4 fragments (3 INJECTS_INTO), 8 skills | Two anchors added, one at STEP 13 | required |
| `add.build` | 20 artefacts — 8 commands/agents, 4 fragments (3 INJECTS_INTO), 8 skills | One anchor at STEP 17, inside the outcome table's handling | required |
| `add.done` | `add`, `add.build`, `add.plan`, `add.pull-request`, `add.review`, 2 fragments (INJECTS_INTO), `add-doc-schemas`, `add-qa` | None. 8.3 already does its one write | none |
| `add-plan-authoring` | `add-framework--brainstorm`, `--build`, `--done`, `--plan` (USES_SKILL) | § The Ticket: two write rows become seven | required |
| `add-framework--brainstorm` | `add-plan-authoring` neighbour (USES_SKILL) | Two writes, after `2.2.2` and at `7.3` | required |
| `add-framework--plan` | same | Two writes, at STEP 1.2 and after the plan is reviewed | required |
| `add-framework--build` | same | `in-review` at STEP 9; `doing` at 5.1 unchanged | required |
| `add-framework--done` | same | None. STEP 8 unchanged | none |
| `cli/src/features.js` | **NOT VERIFIED** (no graph node) | `commands` grows to six | required |
| `cli/tests/injection-exclusivity.integration.test.js` | not a node | The count literal, twice, plus a changelog line | required |
| `docs/backlog.definitions.json` | **NOT VERIFIED** (no graph node) — `backlog.sh`, `board/server.mjs` | Hand-edited for the internal flow, after confirming no other consumer | required |
| `scripts/backlog.sh`, `backlog-commit.sh` | `add-backlog` (RUNS_SCRIPT) | None. Both already do everything this needs | none |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A ticket that moves through every phase as the pipeline runs | Two commits per ticket becomes seven, on the base branch |
| `add.hotfix` on the board for the first time | — |
| The internal and product flows moving in step, from one reserved set | A gated product layer and an ungated internal one, reading differently |
| One place to read what a phase means, for commands, agents and a human | A second reference file to keep in step with the first |
| A `work_id` ban that survives its own justification | — |

| Risk | Probability | Mitigation |
|---|---|---|
| **A skipped write leaves the ticket a column behind and nobody is told** | **High. It is the cost of a trigger that is a step an agent reads** | The board goes coarse, never wrong — which is why P4 is right. One report line per write is what makes a miss visible in the run it happened in. The `status.sh` drift signal is the real fix and is named as out of scope |
| **`in-review` is written on an outcome that has no PR** | Medium — the anchor sits inside a five-row table | The two qualifying outcomes are named in this document and in the fragment. An assertion over the fragment's text that both guards are present |
| The phase check is implemented as an ordering comparison | Medium | It compares against two named statuses of one phase, and the format withheld ordering deliberately. The reference states the two names per phase rather than a direction |
| **The `work_id` stop is implemented as an ordering comparison too** | Medium | It is one equality test against a field on the ticket. The reference states it as "`work_id` equals this run's", never "this phase is later than that one" |
| **The `work_id` stop is forgotten on one of the five writes it guards** | Medium | It guards `refining`, `shaped`, `planning`, `planned` and `doing` — five of the seven. Stated once as a rule over the set, not repeated per row, and the epic walkthrough is the test case |
| **An exit write is left at its old mid-command anchor** | Medium | Three of the four move. A resumed `add.new` that skips STEP 7 is the case that proves it, and it is the assertion to write |
| `add.plan`'s report names one write and hides the other | Medium | The degradation rule is per write, not per command, and it is stated that way |
| The hotfix run dies between STEP 3 and STEP 12 | Medium | Accepted and written down. The ticket reads `doing` with no document naming it, and a human corrects it |
| **The internal and product phase maps drift**, being two files | Medium | Both are written in this one plan, deliberately, so the map is decided once. The two documents cite each other |
| **A fragment section restates the procedure instead of pointing at it** | Medium — it is the easy thing to do when a section looks short | The rule is stated in Scope and in the umbrella. A section that repeats a `lifecycle.md` row is the review finding to look for |
| **`phases.md` and `lifecycle.md` both end up describing the writes** | Medium | The split is by question, not by size: `phases.md` answers what a phase means, `lifecycle.md` answers who writes it and where. A write table in `phases.md` is the sign the split failed |
| Hand-editing this repository's `docs/backlog.definitions.json` breaks something that reads it | Medium | It is tracked in git and is the live file this repository's board reads. The plan confirms no other consumer, CI included, before editing |
| The `46`-style count literal is missed again | Medium | It bumped in 002 and bumps again here. Both line numbers are carried in 002's document |
| Seven writes make the base branch's history unreadable | Low | Each is a one-line JSONL change. Batching is out of scope and named |

## Next Steps

Run: `/add-framework--plan [idea]`
