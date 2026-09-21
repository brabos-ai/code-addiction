# The Ticket Lifecycle — How Work Comes Back Out of the Backlog

**The one procedure five commands share.** Each of `add.brainstorm`, `add.new`, `add.plan`,
`add.build` and `add.done` carries one line pointing here, at its own row. None of them restates any
of it: five copies of one procedure is five places for it to drift.

A ticket that nobody picks up is a thought that died more slowly. This is what picks it up, carries
it through the pipeline, and closes it when the work lands.

---

## The Rule That Comes First — Declared, Never Inferred

**A command acts on a ticket only because a document names its id.**

```
IF WORK MIGHT HAVE COME FROM A TICKET:
  ⛔ DO NOT: Search the board for a ticket whose title resembles the work
  ⛔ DO NOT: Match by keyword, by path overlap, or by similarity of any kind
  ⛔ DO NOT: Close, move or comment on a ticket nobody named
  ✅ DO: Act on the id a `ticket:` field declares, and on nothing else
```

**A wrong inferred match closes someone else's ticket, and nothing downstream can detect it.** The
board would then say work was done that never was, and the ticket that WAS done would stay open
forever. A missed link costs one manual update; a wrong one costs the board's credibility.

**No command ever creates a ticket.** A ticket exists because the user asked for one, through the
`add-backlog` skill. A command that captured tickets on its own would fill the board with work nobody
decided to do.

---

## The `ticket:` Field

**One field, declared once, carried by the documents that already travel the pipeline.** It takes
exactly the road `branch:` already takes — written by one command, acted on by a later one.

| Document | Carries `ticket:` | Written by |
|---|---|---|
| The brainstorm document | in its frontmatter | `add.brainstorm`, architectural path only |
| The brainstorm intent file | in its frontmatter | `add.brainstorm`, bounded and architectural |
| `about.md` | in its frontmatter, **optional** | `add.new` |

**The value is a ticket id, `[NNNN]B`** — four digits and the letter `B`, from the shared global
counter. The letter is what distinguishes a ticket id from a feature id (`F`) or a hotfix id (`H`);
`add-id-convention` owns the shape.

**It is optional in `about.md` because most work never comes from a ticket.** A required field would
fail the validation gate on every hand-written `about.md` in a project that has never used the board.

**After `add.new`, `about.md` is the only carrier.** The intent file is consumed once — the rule
`add.new` already applies to it — so every later command reads `ticket:` from `about.md` and never
from the intent file again.

---

## Reading One Ticket

`backlog.sh` has no mode that returns a single ticket by id — `search` matches title, tldr and notes,
never the id. Read the whole board and keep the one line:

```bash
bash .codeadd/scripts/backlog.sh list --all | grep '"id":"<the ticket id>"'
```

**This is stable, not a workaround.** The record format writes `id` first on every line and never
omits it, precisely so a ticket stays recoverable from its raw text. No output line means the id is
not on the board.

---

## Per Command

| Command | Where | Reads | Writes the board? |
|---|---|---|---|
| `add.brainstorm` | STEP 1 resolves; STEP 3 and STEP 5.3 record | the ticket, as exploration input | **no** |
| `add.new` | STEP 1.1 reads; STEP 2 records | `ticket:` from the intent file | **no** |
| `add.plan` | STEP 4 | `ticket:` from `about.md`, then the ticket | **no** |
| `add.build` | STEP 2, after `build-setup.sh` returns | `ticket:` from `about.md`, then the ticket | **yes — `work_id` and `doing`, one write** |
| `add.done` | STEP 8, after the merge | `ticket:` from `about.md`, then the ticket | **yes — `done`** |

**Only two of the five write, and both already do git writes.** That is the constraint this table was
built to satisfy. A board write travels through `backlog-commit.sh`, which commits and pushes; putting
one in a command that promises no git writes would break that command's own contract.

### `add.brainstorm` — resolve, read, record

**Resolve.** Match the literal pattern `[0-9]{4}B` anywhere in the invocation. No flag, no prefix
word. When it matches, read that ticket (see **Reading One Ticket**) and use its `title`, `tldr`,
`notes`, `paths` and `done_when` as input to the exploration — the user already wrote them down once.

**Record `ticket:` only where the path already writes something:**

| Path | The document | The intent file |
|---|---|---|
| `architectural` | `ticket:` in its frontmatter | `ticket:` in its frontmatter |
| `bounded` | — no document exists | `ticket:` in its frontmatter |
| `spike` | — | — **nothing is written** |

```
IF THE PATH IS spike:
  ⛔ DO NOT USE: Write on docs/brainstorm/ to carry the ticket forward
  ✅ DO: Name the ticket in the final report, and write nothing
```

A spike writes no file, and the hook must not be the first thing in the command to break its own path
table. A spike's recommendation is not permission to build; the follow-up request declares the ticket
again.

### `add.new` — carry it forward

**STEP 1.1:** read `ticket:` from the intent file, alongside `delivery:` and `## Objective`.

**STEP 2:** write `ticket: <id>` into the skeleton `about.md` frontmatter, on the same line as
`branch:`. That is a document write the command already makes.

```
IF A ticket: WAS FOUND:
  ⛔ DO NOT USE: Bash to run backlog-commit.sh — add.new makes NO git writes, and says so twice
  ⛔ DO NOT: Set work_id here, though the feature id is in hand — that write belongs to add.build
  ✅ DO: Copy the id into about.md, and stop there
```

### `add.plan` — read it as input

Read `ticket:` from `about.md`, then the ticket. Carry its `done_when`, `notes` and `paths` into
planning as input — `done_when` is a check someone already wrote as the definition of finished, and a
plan that ignores it re-derives something the user already decided.

**Read-only.** Planning changes no state on the board.

### `add.build` — `work_id` and `doing`, one write

**Immediately after `build-setup.sh` returns**, and not before: until then the run can still stop on a
dirty tree or a bad `branch:`, and a ticket marked `doing` for a build that never started is a lie the
board cannot correct by itself.

1. Read the ticket.
2. **If it already reads `status: doing` and `work_id: <this FEATURE_ID>`, write nothing.**
3. Otherwise, one write carrying both fields:

```bash
echo '{"status":"doing","work_id":"<FEATURE_ID>"}' | bash .codeadd/scripts/backlog-commit.sh update <ticket id>
```

**One write, not two**, so the two fields can never disagree about whether the work started, and so a
build opens one worktree instead of two.

### `add.done` — `done`, after the merge

**After the merge**, and not before. Before it, the ticket would read `done` for work that has not
landed, and a failed merge would leave it lying.

1. Read the ticket.
2. **If it already reads `status: done`, write nothing.**
3. Otherwise:

```bash
echo '{"status":"done"}' | bash .codeadd/scripts/backlog-commit.sh update <ticket id>
```

---

## Read First, Skip When Already There

**Both writes check the ticket's current state first and do nothing when it already holds the
target.** That makes them idempotent by construction.

**Why it matters here:** `add.done` has a Resume route, and its sub-steps carry explicit guards against
running twice. Without the read, a retried close-out would write `done` a second time — a second
commit and a bumped `updated_at` for no change. Reading first is cheaper than a sixth guard someone
has to remember, and it covers a re-run `add.build` for free.

---

## The Status Names

The hooks write the **shipped default names**: `doing` and `done`. The status vocabulary belongs to
the user, though, in `docs/backlog.definitions.json`, and they are entitled to rename either.

**When they have, the write is refused with `REFUSED=unknown-status`.** Report it and continue.

```
IF A HOOK'S STATUS WRITE IS REFUSED WITH unknown-status:
  ⛔ DO NOT: Read the definitions file and pick a status by its `order` field
  ⛔ DO NOT: Add the missing status to the definitions file
  ✅ DO: Report which status was refused, and continue the command
```

**`order` is not a meaning.** It is the sort order `list` groups by, and the record format says so in
as many words. Treating `order: 2` as "in progress" would invent a semantic the format deliberately
withheld — and it would be wrong the first time someone reorders their statuses.

---

## Degradations — None of Them Is a Stop

**The board is a side-record.** A build that fails because a ticket could not be moved has inverted
the relationship between the work and the note about the work.

| State | What the hook does |
|---|---|
| No `ticket:` in the document | Nothing. Most work never came from a ticket |
| `docs/backlog.jsonl` absent (`BACKLOG_PRESENT=no`) | Nothing, silently |
| `ticket:` names an id not on the board | Report it, and continue with no ticket |
| The status write is refused (`REFUSED=unknown-status`) | Report which status, and continue |
| `backlog-commit.sh` reports a `DEGRADED=` write | Report what did not happen, and continue |

```
IF ANY LIFECYCLE STEP FAILS:
  ⛔ DO NOT: Stop the command, fail the build, or refuse the merge
  ⛔ DO NOT: Retry the push or resolve a rebase on the user's behalf
  ✅ DO: Put one line in the command's final report saying what did not happen, and continue
```

**Every degradation reaches the user through that final report and nowhere else.** A ticket that
silently stays `open` after its work shipped is the failure this whole reference exists to prevent,
so a report that leaves the line out has failed even though the command succeeded.
