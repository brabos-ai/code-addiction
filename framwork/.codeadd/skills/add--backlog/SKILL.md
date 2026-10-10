---
name: add--backlog
description: "Use when something should be done later but not now — record it as a ticket on the project backlog, or read, reprioritise, comment on and close what is already there. Works mid-flow, inside another command's run, without derailing it. Triggers: backlog, ticket, anota isso pra depois, note this for later, record for later, not now, todo, fica pra depois, what's on the backlog, list the backlog, search the backlog, prioritise, drop this ticket."
---

# Add Backlog — Capture Work That Is Decided But Not Started

<!-- uses:
- script: backlog-cli.cjs
- script: backlog-commit.cjs
- skill: add--final-report
- skill: add--doc-schemas
- skill: add--doc-schemas/references/backlog.md
- skill: add--backlog/references/lifecycle.md
- skill: add--backlog/references/phases.md
- mention: add--commit
-->

The project has a pipeline for work that is **about to start** and an index for work that is
**finished**. This is the middle: a ticket board the project keeps on its own `board` branch, outside
every code branch and worktree.

**Vocabulary, fixed:** the **backlog** is the board file (`docs/backlog.jsonl` inside the board clone).
One entry is a **ticket**.

## When to Use

- Mid-build, the user notices something that should be done later and says so.
- The user asks what is on the backlog, or to find a ticket.
- A ticket needs reprioritising, a comment, a status change, or removing.

## When NOT to Use

- **The work starts now** → `{{cmd:add-new}}`. A ticket is for what is NOT being started.
- **The idea needs exploring before it is even a ticket** → `{{cmd:add-brainstorm}}`.
- **Committing unrelated code** → `{{skill:add--commit/SKILL.md}}`. This skill commits two files and nothing else.
- **A bug happening now** → `{{cmd:add-hotfix}}`.

---

## ⛔ The Two Entry Points

**Which entry runs is decided by whether anything is committed, and by nothing else.**
Both are Native Node — Node and Git are the only runtimes the backlog needs, on any platform
and without bash or WSL.

| Intent | Entry | Why |
|---|---|---|
| **read** — list, search, get | `node .codeadd/scripts/backlog-cli.cjs <mode>` | A read commits nothing. It syncs the project's board clone (at most once per 30 s) and reads the clone, never the checkout, so it is never stale because of the branch it ran on |
| **write** — add, update, comment, move, remove | `node .codeadd/scripts/backlog-commit.cjs <mode>` | The ONE write route: it commits to the clone and pushes the `board` branch, from any branch or worktree. The CLI refuses a write with `ERROR=write-mode` and names this entry |

```
IF THE INTENT IS add, update, comment, move OR remove:
  ⛔ DO NOT USE: the shell tool to run backlog-cli.cjs for a write — it only reads and
                 refuses with ERROR=write-mode, exit 2
  ⛔ DO NOT USE: the shell tool to run git add, git commit, git push or git worktree yourself
  ⛔ DO NOT: Write docs/backlog.jsonl or docs/backlog.definitions.json with Write or Edit, in the
             checkout or in the clone — the board is read and written only through the two entries
  ✅ DO: Run the publication entry with the record on a file, which owns the whole
         git route and cleans up after itself

IF THE INTENT IS list, search OR get:
  ⛔ DO NOT USE: the shell tool to run the publication entry — it refuses a read with ERROR=read-mode
  ✅ DO: Run the local CLI directly
```

**Records travel on files, not on pipes.** For a record mode, write the record to a scratch file
in the project (one JSON object, nothing else) and pass `--record-file <path>`. The publication
entry reads the file in the caller's cwd BEFORE any routing, allocation or persistence: a failed
read exits 1 with `ERROR=record-read-failed`, and nothing else happens. The Node entries also
accept stdin when `--record-file` is absent; agents use the file recipe above.

**The format is not defined here.** The two files, the ticket fields, the status vocabulary
and the `REFUSED=` names live in `{{skill:add--doc-schemas/references/backlog.md}}`. Read it before
composing a record.

## References

| File | Owns | Read by |
|---|---|---|
| `{{skill:add--backlog/references/phases.md}}` | The model: the nine statuses, the seven columns, and what each one means to a person reading the board. Nothing about who writes a status | Anyone reading the board, and the lifecycle reference, which points here instead of restating it |
| `{{skill:add--backlog/references/lifecycle.md}}` | The procedure: the `ticket:` field, the two rules that decide whether a write happens, the seven writes and the exact step each one stands at, and why none of it ever stops a command | The `board` feature's fragments for `add-brainstorm`, `add-new`, `add-plan`, `add-build`, `add-done` and `add-hotfix` — each at its own row |

**This skill captures and reads; the reference carries a ticket through the pipeline.** A user reaches
the first by asking. The commands reach the second on their own, when a document names a ticket.

---

## STEP 1: Resolve the Intent — No Flag Grammar

The user says what they want in their own words. Resolve it to one mode. **DO NOT ask them for a
subcommand** — a user mid-build does not stop to look one up.

| They said, in substance | Mode |
|---|---|
| record this / note it for later / not now | `add` |
| what is on the backlog / show me the tickets | `list` |
| find the one about X | `search` |
| this one is done / drop it / it is in progress | `update` (a `status` change) |
| I learnt something about that ticket | `comment` |
| this is more urgent / do this one first | `move` |
| delete that ticket | `remove` |

**`list` defaults to open tickets.** `--all` returns every one, `--status <name>` filters to one.
**To resolve a target, search every status** — `search` runs on all statuses by default, so a match
already started under another phase is never hidden behind the open filter; ambiguity is still a stop,
never resolved by the filter. Search also answers a known ticket id exactly.

### 1.1 Resolve the target, for every mode but `add` and `list`

Match what the user said against the board: a declared ticket id goes straight to `get`; an id from
an old plan or a subject goes to `search`; a number cited by its old `Formerly item` note is searched
by that note's text and then confirmed by `get` before selecting.

```
IF MORE THAN ONE TICKET MATCHES:
  ⛔ DO NOT: Pick the closest, or the newest
  ⛔ DO NOT USE: Bash to run the publication entry
  ✅ DO: List the candidates by id and title, and ASK which

IF NOTHING MATCHES:
  ⛔ DO NOT: Create a ticket instead
  ✅ DO: Say so, show what `list` returns, and STOP
```

**This is the only stop this skill makes.** Writing a comment onto the wrong ticket is worse than one
question. Everything else is decided and reported.

---

## STEP 2: Check the Project (BOUNDED) — `add` and `update` Only

**Purpose: the ticket must name real things.** One reading "fix the review thing" is worthless in
three weeks; one naming the real paths and a check someone can run is worth the trip.

READ, and nothing else:

1. The files and directories the request names.
2. `git grep` of the request's own terms. **`git grep` and not `grep`** — it searches tracked files
   only, so `node_modules/`, build output and everything else `.gitignore` covers fall out for free,
   with no exclusion list to maintain per ecosystem.

```
IF CHECKING THE PROJECT FOR A TICKET:
  ⛔ DO NOT USE: Agent or any subagent dispatch
  ⛔ DO NOT USE: The artefact-graph MCP tools, or Bash to run any graph query
  ⛔ DO NOT USE: Read on a plan, a feature document or a wiki page
  ✅ DO: Read what the request names, run one git grep, and stop
```

**This STEP is capped by design.** It informs one ticket. A capture that opens the graph or reads a
plan has stopped recording intent and started doing the work — which costs the user the turn that
capture exists to save.

Fill from what that returned:

| Field | From |
|---|---|
| `paths` | the real paths the work touches |
| `done_when` | a check someone can actually run — a command, or a named file and what must be true of it |
| `grounded` | `true` when the check found real things, `false` when it did not |

```
IF THE REQUEST NAMES NOTHING CHECKABLE:
  ⛔ DO NOT: Invent a path or a target to make the ticket look concrete
  ✅ DO: Record it as the user stated it, with `grounded: false`, and say so in the report
```

**`grounded: false` is a valid outcome, not a failure.** An unchecked thought still beats a lost one,
and the field is required precisely so a reader can tell the two apart.

---

## STEP 3: Write, or Read

### 3.1 Write

Compose the record per `{{skill:add--doc-schemas/references/backlog.md}}` and run the publication
entry with it on a scratch file this run creates and deletes in the same step:

```bash
# scratch-ticket.json — written by Write/Edit in this step, one JSON object,
# removed right after the call below lands.
node .codeadd/scripts/backlog-commit.cjs add --record-file scratch-ticket.json
```

```
IF COMPOSING A RECORD:
  ⛔ DO NOT: Send id, created_at or updated_at — the script generates all three and refuses a
             record carrying any of them (REFUSED=reserved-field)
  ⛔ DO NOT: Send a status the project's docs/backlog.definitions.json does not define
             (REFUSED=unknown-status)
  ✅ DO: Send title, tldr and done_when — all three are required and non-empty
```

**There is no confirmation gate, and that is deliberate.** The commit sha is the undo. Asking first
would cost the turn the mid-flow capture was supposed to save, so this skill writes and then reports.

### 3.2 Read

```bash
node .codeadd/scripts/backlog-cli.cjs list [--all | --status <name>] [--full | --ids]
node .codeadd/scripts/backlog-cli.cjs search "<terms>" [--full]
node .codeadd/scripts/backlog-cli.cjs get <id>
```

Output is `KEY=VALUE` metadata, then payload lines. **Board order is priority order and it survives
every filter** — present the tickets in the order they came back, never re-sorted.

**`list` and `search` print a seven-field summary: `id, status, title, tldr, theme, labels,
updated_at`.** The `tldr` is a preview cut at 120 code points (`…` when cut), and search runs on the
complete text — a match beyond the preview still returns the ticket. **The summary is for choosing;
it is never evidence.** Before using `notes`, `paths`, `done_when` or `work_id`, read the whole ticket
with `get <id>` — an exact, case-sensitive read that returns the raw row and accepts no filter. `--full`
restores the raw rows on any read; `--ids` emits just the identities. `get` takes exactly one argument.

Metadata on every read: `BOARD_DIR` is the clone it read, and `SYNC=fresh|synced|skipped|degraded`
says how current it is (`SYNC_REASON=fetch-failed|push-refused|rebase-conflict` on `degraded`, and
`LOCK_RECLAIMED=<pid>` when a dead lock was taken over). A `degraded` or `skipped` sync still answers
from the clone — say that the answer may be a little behind. `READ_VIEW=summary|full|ids` names the
projection, `STATUS_COUNTS` counts the whole board before any filter, and `BACKLOG_PRESENT=no` means
this project has no board, or no ticket has ever been written — say that; it is not an error.

**The board states.** The entries resolve the board before anything else:

| State | A read | A write | Say |
|---|---|---|---|
| no board (no config, no board file) | `BACKLOG_PRESENT=no`, exit 0 | `REFUSED=board-not-configured`, exit 2 | this project has no board |
| `ERROR=board-migration-required` | exit 1 | exit 1 | the old file is still in the checkout and no config says where the board moved — the framework maintainer must migrate the project |
| `ERROR=board-branch-missing` | exit 1 | exit 1 | the config names a branch the remote does not have |
| `ERROR=board-checkout-missing` | exit 1 | exit 1 | the board clone is not on this machine and the remote could not be reached |
| `ERROR=board-locked` | — | exit 1, nothing written | another process held the clone for 30 s; retry |

None of these is fixed by hand: do not create the branch, the clone or the config yourself.

---

## STEP 4: Report

**LOAD `{{skill:add--final-report/SKILL.md}}`.** It owns the seven blocks and the banned phrasings.
Emit the report FIRST — the facts below come after it.

Then state, from the publication entry's own output:

- **`TICKET_ID`** — on an `add` the id did not exist before the write, so this is the only way the
  user learns what to call their ticket. **Never omit it.**
- **`SHA`** — the commit. This is the whole undo, which is why there was no gate.
- **`ROUTE`** (always `board`) and **`BOARD_DIR`** — the one route, and the clone the ticket was written in.
- **`PUSHED`** and **`PERSISTED`**/**`COMMITTED`**, plus **`RECOVERY_PATH`**/**`RECOVERY_REF`** when the
  entry reports one, and **`DEGRADED`** when there is one. Say plainly what did not happen:

| `DEGRADED=` | Say |
|---|---|
| `push-refused` | the push was refused — a protected branch, a ruleset, or auth; the commit is in the clone and ref-protected, and the next write pushes it |
| `fetch-failed` | the remote could not be fetched, so no rebase or push used stale state; the commit is in the clone and ref-protected, and the next write pushes it |
| `rebase-conflict` | the remote moved and the rebase conflicted; the rebase was aborted, the commit is in the clone and ref-protected |
| `recovery-ref-failed` / `recovery-ref-moved` / `recovery-ref-delete-failed` | protection could not be created, was moved, or could not be released; report only the RECOVERY_REF actually printed |

- Whether the ticket is **grounded**, or was recorded as stated.

```
IF THE SCRIPT REPORTED A DEGRADED WRITE:
  ⛔ DO NOT: Report the capture as clean
  ⛔ DO NOT: Retry the push, or resolve a rebase, on the user's behalf
  ✅ DO: Say what landed, where it landed, and what did not
```

**A degraded write is still a write.** The ticket exists in every one of those rows, which is the
promise the script is built around — say what happened, and do not dress it up either way.

A committed SHA is on the `board` branch of the clone; `PUSHED=yes` means it is on the remote too.
`PUSHED=no` means the commit is retained in the clone, protected by `RECOVERY_REF`, and goes out with
the next write. `COMMITTED=no` with `PERSISTED=yes` and `RECOVERY_PATH` means the bytes are in the
clone's working tree and the commit failed.

---

## Validation Checklist

```
[ ] The intent resolved to exactly one mode, with no subcommand asked of the user
[ ] A write went through the publication entry; a read went through the local CLI, which only reads
[ ] A declared id was read with `get`; body fields came from `get`, never from a summary
[ ] A record travelled on a file; stdin was never used for a native call
[ ] The project check read only what the request named, plus one git grep
[ ] No subagent, no graph query, no plan read
[ ] title, tldr and done_when are all present and non-empty
[ ] grounded says what actually happened
[ ] An ambiguous target was asked about, never guessed
[ ] TICKET_ID and SHA are both in the report
[ ] A DEGRADED= write was reported as degraded, with its RECOVERY_* keys when present
```

## Rules

ALWAYS:
- Report `TICKET_ID` — on an `add` nothing else tells the user what they created
- Report the sha, because it is the only undo this skill offers
- Say `grounded: false` out loud when the check found nothing

NEVER:
- Ask for confirmation before a write — the sha is the undo
