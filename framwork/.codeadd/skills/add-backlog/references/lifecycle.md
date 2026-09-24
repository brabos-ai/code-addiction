# The Ticket Lifecycle — How a Ticket Moves Through the Pipeline

**The procedure six commands share.** `add.brainstorm`, `add.new`, `add.plan`, `add.build`, `add.done`
and `add.hotfix` each carry their ticket instructions in the `board` feature's fragments, and every one of
those instructions points at its own row here. None restates any of it: six copies of one procedure is six
places for it to drift.

**This file is the procedure — who writes which status, at which step, and when a write is skipped.** What
each status MEANS, and how nine of them fit in seven columns, is
`{{skill:add-backlog/references/phases.md}}`. A reader who only wants to know what a column means reads
that file and never this one.

A ticket that nobody picks up is a thought that died more slowly. This is what picks it up, carries it
through the pipeline, and closes it when the work lands.

---

## The Rule That Comes First — Declared, Never Inferred

**A command acts on a ticket only because a document or the invocation names its id.**

```
IF WORK MIGHT HAVE COME FROM A TICKET:
  ⛔ DO NOT: Search the board for a ticket whose title resembles the work
  ⛔ DO NOT: Match by keyword, by path overlap, or by similarity of any kind
  ⛔ DO NOT: Close, move or comment on a ticket nobody named
  ✅ DO: Act on the id a `ticket:` field declares, or the invocation carries, and on nothing else
```

**A wrong inferred match moves someone else's ticket, and nothing downstream can detect it.** The board
would then say work was done that never was, and the ticket that WAS done would stay where it was forever.
A missed link costs one manual update; a wrong one costs the board's credibility.

**No command ever creates a ticket.** A ticket exists because the user asked for one, through the
`add-backlog` skill. A command that captured tickets on its own would fill the board with work nobody
decided to do.

---

## The `ticket:` Field

**One field, declared once, carried by the documents that already travel the pipeline.** It takes exactly
the road `branch:` already takes — written by one command, acted on by a later one.

| Document | Carries `ticket:` | Written by |
|---|---|---|
| The brainstorm document | in its frontmatter | `add.brainstorm`, architectural path only |
| The brainstorm intent file | in its frontmatter | `add.brainstorm`, bounded and architectural |
| A feature's `about.md` | in its frontmatter, **optional** | `add.new` |
| A hotfix's `about.md` | in its frontmatter, **optional** | `add.hotfix`, from its own invocation |

**The value is a ticket id, `[NNNN]B`** — four digits and the letter `B`, from the shared global counter.
The letter is what distinguishes a ticket id from a feature id (`F`) or a hotfix id (`H`);
`add-id-convention` owns the shape.

**It is optional in `about.md` because most work never comes from a ticket.** A required field would fail
the validation gate on every hand-written `about.md` in a project that has never used the board.

**After `add.new` or `add.hotfix`, `about.md` is the only carrier.** The intent file is consumed once, so
every later command reads `ticket:` from `about.md` and never from the intent file again.

---

## Reading One Ticket

`backlog.sh` has no mode that returns a single ticket by id — `search` matches title, tldr and notes, never
the id. Read the whole board and keep the one line:

```bash
bash .codeadd/scripts/backlog.sh list --all | grep '"id":"<the ticket id>"'
```

**This is stable, not a workaround.** The record format writes `id` first on every line and never omits it,
precisely so a ticket stays recoverable from its raw text. No output line means the id is not on the board.

---

## Where a Board Write Goes

Every write in this file is one call:

```bash
printf '%s' '<the fields that change>' | bash .codeadd/scripts/backlog-commit.sh update <ticket id>
```

**The script writes to the BASE branch, never to the caller's.** On the base branch it commits directly;
anywhere else it writes through a detached, locked worktree of its own, so the ticket reaches the base
branch without touching the tree or the branch the command is working in.

**That is why a command that makes no git writes of its own can still move a ticket.** `add.new` and
`add.plan` promise to leave the repository's tree untouched, and they do: the board write lands on another
branch, through another tree.

---

## The Two Rules That Decide Whether a Write Happens

**Every phase has an entry status (someone is in it) and, where a person can leave it parked, an exit
status (it finished and nobody picked up the next one).** `phases.md` has the pairs. Two rules then decide,
before each write, whether it happens at all. **Neither compares order** — `order` is a sort key and never
a position in the flow.

### The phase check — for an entry write

**The entry write is skipped when the ticket already reads that phase's entry **or** exit status.** Two
string comparisons against the two names of one phase; no other status is consulted, and no status is
"after" another.

It is what keeps `add.new` from dragging a ticket back from `shaped` to `refining` after `add.brainstorm`
already shaped it: both commands belong to the shaping phase, and the second finds the ticket already in it.

### The `work_id` stop — for every write before the build

**Once the ticket's `work_id` equals this run's work id, ONLY `in-review` AND `done` may still be written.**
One equality test. `refining`, `shaped`, `planning`, `planned` and `doing` are all skipped.

**`work_id` is set in the same write as `doing`, and it is the whole work item's id — an epic's, not a
subfeature's.** An epic runs `add.plan` and `add.build` once per subfeature; without this stop the second
subfeature's `add.plan` would write `planning` over a ticket the first already carried to `in-review`, and
the board would run backwards on work that is further along. The same stop covers `add.plan` re-run after a
build started, `add.build` resumed, and `add.done`'s Resume route.

**An exit write keeps the plain rule:** written unless the ticket already reads it. Only an entry write can
move a ticket backwards, so only the entry write needs the phase check.

---

## Per Command

| Command | Writes | Where | Carries |
|---|---|---|---|
| `add.brainstorm` | `refining` | once the effort path is stated — never on `spike` | `status` |
| `add.brainstorm` | `shaped` | once the intent file is written and passed its gate — never on `spike` | `status` |
| `add.new` | `refining` and `feature` | STEP 2, once the skeleton `about.md` exists | `status`, `feature` |
| `add.new` | `shaped` | its completion, before the report — once the validation gate passed | `status` |
| `add.plan` | `planning` | STEP 4, where it reads the ticket | `status` |
| `add.plan` | `planned` | its completion, before the report — the plan is written and reviewed | `status` |
| `add.build` | `doing` and `work_id` | right after `build-setup.sh` returns | `status`, `work_id` |
| `add.build` | `in-review` | its completion report, reading the `Publish:` outcome it recorded — **only** `pr-opened` or `pr-updated` | `status` |
| `add.done` | `done` | after the merge | `status` |
| `add.hotfix` | `doing` and `work_id` | once its branch is confirmed | `status`, `work_id` |

**Every row is subject to the two rules above.** The table says where a write stands; the rules say whether
it fires.

### `add.brainstorm` — resolve, read, record, and two writes

**Resolve.** Match the literal pattern `[0-9]{4}B` anywhere in the invocation. No flag, no prefix word. When
it matches, read that ticket and use its `title`, `tldr`, `notes`, `paths` and `done_when` as input to the
exploration — the user already wrote them down once.

**Record `ticket:` only where the path already writes something:**

| Path | The document | The intent file | Board writes |
|---|---|---|---|
| `architectural` | `ticket:` in its frontmatter | `ticket:` in its frontmatter | `refining`, then `shaped` |
| `bounded` | — no document exists | `ticket:` in its frontmatter | `refining`, then `shaped` |
| `spike` | — | — | **none** |

```
IF THE PATH IS spike:
  ⛔ DO NOT USE: Bash to run backlog-commit.sh
  ⛔ DO NOT USE: Write on docs/brainstorm/ to carry the ticket forward
  ✅ DO: Name the ticket in the final report, and write nothing anywhere
```

**The entry write waits for the path, and that is why.** A spike's recommendation is not permission to
build, and a ticket moved to `refining` by a spike that ends in "no" would stay there with nothing behind
it. The follow-up request declares the ticket again.

**`shaped` follows the intent file, not the report.** This command reports before it asks for approval, and
it writes the intent file only after the approval — so a report-time write would assert a file that does not
exist yet. A write that did not land is one line in the handoff that follows.

### `add.new` — carry it forward, and point at the feature

**STEP 1.1:** read `ticket:` from the intent file, alongside `delivery:` and `## Objective`.

**STEP 2:** write `ticket: <id>` into the skeleton `about.md` frontmatter, on the line after `branch:`. Then
ONE board write, carrying `feature` — the feature id just allocated — and `refining`:

```bash
printf '%s' '{"status":"refining","feature":"<FEATURE_ID>"}' | bash .codeadd/scripts/backlog-commit.sh update <ticket id>
```

**When the phase check skips `refining`, the write still carries `feature`.** The pointer is never skipped —
only the status is. When the ticket already reads that `feature` too, nothing is written at all.

**`feature` and `work_id` are two fields.** `feature` says which feature carries the ticket; `work_id` says
the build started.

```
IF A ticket: WAS FOUND:
  ⛔ DO NOT: Set work_id here, though the feature id is in hand
  ✅ DO: Write feature (and refining, unless the phase check skips it) — and leave work_id to add.build
```

**Why `work_id` waits, stated so the ban outlives the next reader:** `work_id` is what the `work_id` stop
reads. Set it here and the stop fires from `shaped` onward — `add.plan` would never write `planning`, and
the planning phase would vanish from the board.

**Completion:** once the validation gate passed, write `shaped`, before the report is printed. It sits at
completion rather than beside the gate on purpose: Continue Mode skips the gate step when it already passed,
and a write anchored there would be lost by a resume.

### `add.plan` — read it as input, and two writes

Read `ticket:` from `about.md`, then the ticket. Carry its `done_when`, `notes` and `paths` into planning as
input — `done_when` is a check someone already wrote as the definition of finished, and a plan that ignores
it re-derives something the user already decided.

At the step that reads the ticket, write `planning`. At completion, before the report, write `planned` —
the plan is written and has passed its review. **An epic plans once per subfeature, and the `work_id` stop
is what makes the second pass write nothing** once the first subfeature's build has started.

### `add.build` — `doing` and `work_id` in one write, then `in-review`

**`doing`, immediately after `build-setup.sh` returns**, and not before: until then the run can still stop on
a dirty tree or a bad `branch:`, and a ticket marked `doing` for a build that never started is a lie the
board cannot correct by itself.

```bash
printf '%s' '{"status":"doing","work_id":"<FEATURE_ID>"}' | bash .codeadd/scripts/backlog-commit.sh update <ticket id>
```

**One write, not two**, so the two fields can never disagree about whether the work started. Skipped when
the ticket already reads both.

**`in-review`, in the completion report, reading the `Publish:` line this build recorded in its ledger.**
Only two outcomes write it:

| `Publish:` | Writes `in-review`? |
|---|---|
| `pr-opened <url>` | **yes** |
| `pr-updated <url>` | **yes** — skipped by the plain rule when the ticket already reads it |
| `on-main`, `no-gh — pushed`, `no-gh — local`, `declined — local merge` | **no.** There is no PR to review, and the ticket stays `doing` — which is true |

**It reads the recorded outcome rather than sitting beside the publish question** because the report is
reached on every path, and the write then sits next to the line that has to report it.

### `add.done` — `done`, after the merge

**After the merge**, and not before. Before it, the ticket would read `done` for work that has not landed,
and a failed merge would leave it lying. Skipped when the ticket already reads `done` — the Resume route
reaches this step again.

```bash
printf '%s' '{"status":"done"}' | bash .codeadd/scripts/backlog-commit.sh update <ticket id>
```

### `add.hotfix` — the jump

**A hotfix runs no `add.new`, so nothing hands it a `ticket:` — it resolves the id from its own invocation**,
by the same literal pattern `add.brainstorm` uses.

| What | Where |
|---|---|
| Resolve the ticket id | at the start, from the invocation |
| `doing` and `work_id` = the hotfix id, one write | once its branch is confirmed — the hotfix equivalent of `build-setup.sh` returning |
| `ticket: <id>` into the hotfix `about.md` | the step that writes that file, **before** it is fingerprinted — nothing may change after |
| `done` | `add.done`, which reads `ticket:` from that `about.md` |

**A hotfix never writes `in-review`.** It opens no PR; it hands off to `add.done`, which merges. So a hotfix
ticket goes `open` → `doing` → `done`, skipping four statuses — and nothing refuses that, because nothing
validates transitions.

```
IF A HOTFIX TICKET IS AT open AND THE NEXT WRITE IS doing:
  ⛔ DO NOT: Write the skipped statuses first to "catch up" the board
  ✅ DO: Write doing. The board shows where the work is, not how it got there
```

**One gap is accepted, and named.** The id lives only in memory between the branch confirmation and the step
that writes `about.md`. A run that dies in between leaves a ticket at `doing` with no document naming it — the
same class of gap `add.build` accepts by writing early. Writing later would leave the ticket at `open` while
the fix is being built, which is worse.

---

## Read First, Skip When Already There

**Every write reads the ticket's current state first and does nothing when it already holds the target.**
That makes all of them idempotent by construction, and it is what lets a resumed close-out, a re-run build or
a second planning pass run without a guard of its own.

---

## The Status Names

**The nine names a command writes:** `open`, `refining`, `shaped`, `planning`, `planned`, `doing`,
`in-review`, `done` and `dropped`. What each means, and which column holds it, is `phases.md`.

**The vocabulary belongs to the user, and they are entitled to rename any of the nine.** Nothing enforces
them: the names are a contract this file and the record format both state, not a mechanism.

**When a name has been renamed or removed, the write is refused with `REFUSED=unknown-status`.** Report it
and continue. With nine names in play a single rename can produce **several** refusals in one run — one per
write that names it — and each gets its own line.

```
IF A STATUS WRITE IS REFUSED WITH unknown-status:
  ⛔ DO NOT: Read the definitions file and pick a status by its `order` field
  ⛔ DO NOT: Add the missing status to the definitions file, reserved or not
  ⛔ DO NOT: Report only the last refusal when a run made several
  ✅ DO: Report which status was refused, once per refusal, and continue the command
```

```
⛔ NOTHING DERIVES A PHASE OR A NEXT STEP FROM order:
  ⛔ DO NOT: Treat `order: 6` as "further along" than `order: 4`
  ⛔ DO NOT: Compare two statuses by order to decide whether a write moves forward
  ✅ DO: Compare a status by its NAME — the moment someone reorders their statuses, any rule built
         on `order` is wrong and nothing reports it
```

---

## Degradations — None of Them Is a Stop

**The board is a side-record.** A build that fails because a ticket could not be moved has inverted the
relationship between the work and the note about the work.

| State | What the command does |
|---|---|
| No `ticket:` in the document, no id in the invocation | Nothing. Most work never came from a ticket |
| `docs/backlog.jsonl` absent (`BACKLOG_PRESENT=no`) | Nothing, silently |
| The id is not on the board | Report it, and continue with no ticket |
| A write is refused (`REFUSED=unknown-status`) | Report which status, and continue |
| `backlog-commit.sh` reports a `DEGRADED=` write | Report what did not happen, and continue |

```
IF ANY WRITE IN THIS FILE FAILS:
  ⛔ DO NOT: Stop the command, fail the build, or refuse the merge
  ⛔ DO NOT: Retry the push or resolve a rebase on the user's behalf
  ⛔ DO NOT: Report only the last one when a run made several
  ✅ DO: Put one line in the command's final report for EACH write that did not land, and continue
```

**One line per write, not per command.** `add.plan` makes two writes; a report naming one of them hides the
other. **Every degradation reaches the user through that final report and nowhere else** — a ticket that
silently falls a column behind is the failure this whole reference exists to prevent.
