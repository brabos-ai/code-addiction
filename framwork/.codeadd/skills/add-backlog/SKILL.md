---
name: add-backlog
description: "Use when something should be done later but not now — record it as a ticket on the project backlog, or read, reprioritise, comment on and close what is already there. Works mid-flow, inside another command's run, without derailing it. Triggers: backlog, ticket, anota isso pra depois, note this for later, record for later, not now, todo, fica pra depois, what's on the backlog, list the backlog, search the backlog, prioritise, drop this ticket."
---

# Add Backlog — Capture Work That Is Decided But Not Started

<!-- uses:
- script: backlog.sh
- script: backlog-commit.sh
- skill: add-final-report
- skill: add-doc-schemas
- skill: add-doc-schemas/references/backlog.md
- skill: add-backlog/references/lifecycle.md
- mention: add-commit
-->

The project has a pipeline for work that is **about to start** and an index for work that is
**finished**. This is the middle: a ticket board the repository carries, in `docs/backlog.jsonl`.

**Vocabulary, fixed:** the **backlog** is the file. One entry is a **ticket**.

## When to Use

- Mid-build, the user notices something that should be done later and says so.
- The user asks what is on the backlog, or to find a ticket.
- A ticket needs reprioritising, a comment, a status change, or removing.

## When NOT to Use

- **The work starts now** → `{{cmd:add.new}}`. A ticket is for what is NOT being started.
- **The idea needs exploring before it is even a ticket** → `{{cmd:add.brainstorm}}`.
- **Committing unrelated code** → `{{skill:add-commit/SKILL.md}}`. This skill commits two files and nothing else.
- **A bug happening now** → `{{cmd:add.hotfix}}`.

---

## ⛔ The Two Entry Points

**Which script runs is decided by whether anything is committed, and by nothing else.**

| Intent | Script | Why |
|---|---|---|
| **read** — list, search | `bash .codeadd/scripts/backlog.sh <mode>` | A read commits nothing. It also works in a directory that is not a git repository, which the write path cannot |
| **write** — add, update, comment, move, remove | `bash .codeadd/scripts/backlog-commit.sh <mode>` | The ticket has to reach the **base branch**, or it dies with the branch it was written on |

```
IF THE INTENT IS add, update, comment, move OR remove:
  ⛔ DO NOT USE: Bash to run backlog.sh directly — the ticket would land on whatever
                 branch the user happens to be standing on
  ⛔ DO NOT USE: Bash to run git add, git commit, git push or git worktree yourself
  ✅ DO: Run backlog-commit.sh, which owns the whole git route and cleans up after itself

IF THE INTENT IS list OR search:
  ⛔ DO NOT USE: Bash to run backlog-commit.sh — it refuses a read with ERROR=read-mode
  ✅ DO: Run backlog.sh directly
```

**The format is not defined here.** The two files, the ticket fields, the status vocabulary
and the `REFUSED=` names live in `{{skill:add-doc-schemas/references/backlog.md}}`. Read it before
composing a record.

## References

| File | Owns | Read by |
|---|---|---|
| `{{skill:add-backlog/references/lifecycle.md}}` | How work comes back out: the `ticket:` field, what each of the five pipeline commands does with it, the two status transitions, and why none of it ever stops a command | `add.brainstorm`, `add.new`, `add.plan`, `add.build`, `add.done` — each at its own row |

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

### 1.1 Resolve the target, for every mode but `add` and `list`

Match what the user said against the board — an id if they gave one, otherwise `search`.

```
IF MORE THAN ONE TICKET MATCHES:
  ⛔ DO NOT: Pick the closest, or the newest
  ⛔ DO NOT USE: Bash to run backlog-commit.sh
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

Compose the record per `{{skill:add-doc-schemas/references/backlog.md}}` and pipe it in:

```bash
echo '<the record as one JSON object>' | bash .codeadd/scripts/backlog-commit.sh add
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
bash .codeadd/scripts/backlog.sh list
bash .codeadd/scripts/backlog.sh search "<terms>"
```

Output is `KEY=VALUE` lines, then raw JSONL. **Board order is priority order and it survives every
filter** — present the tickets in the order they came back, never re-sorted.

`BACKLOG_PRESENT=no` means no ticket has ever been written. Say that; it is not an error.

---

## STEP 4: Report

**LOAD `{{skill:add-final-report/SKILL.md}}`.** It owns the seven blocks and the banned phrasings.
Emit the report FIRST — the facts below come after it.

Then state, from `backlog-commit.sh`'s own output:

- **`TICKET_ID`** — on an `add` the id did not exist before the write, so this is the only way the
  user learns what to call their ticket. **Never omit it.**
- **`SHA`** — the commit. This is the whole undo, which is why there was no gate.
- **`ROUTE`** and **`BASE_BRANCH`** — whether it went direct or through a worktree, and where it landed.
- **`PUSHED`**, and **`DEGRADED`** when there is one. Say plainly what did not happen:

| `DEGRADED=` | Say |
|---|---|
| `not-a-git-repo` | the ticket is in the working tree and nothing was committed — this is not a git repository |
| `no-base-branch` | same, and no `main` or `master` was found to commit to |
| `no-remote` | the commit is on the local base branch; there is no remote to push to |
| `push-refused` | the commit is on the local base branch; the push was refused — a protected branch, a ruleset, or auth |
| `rebase-conflict` | the commit is on the local base branch; the remote moved and the rebase was aborted rather than resolved |
| `base-checked-out-elsewhere` | the commit exists by sha only — the push failed and the base branch is checked out in another worktree |
| `worktree-failed` | the ticket is in the working tree, uncommitted — the temporary worktree could not be created |

- Whether the ticket is **grounded**, or was recorded as stated.

```
IF THE SCRIPT REPORTED A DEGRADED WRITE:
  ⛔ DO NOT: Report the capture as clean
  ⛔ DO NOT: Retry the push, or resolve a rebase, on the user's behalf
  ✅ DO: Say what landed, where it landed, and what did not
```

**A degraded write is still a write.** The ticket exists in every one of those rows, which is the
promise the script is built around — say what happened, and do not dress it up either way.

---

## Validation Checklist

```
[ ] The intent resolved to exactly one mode, with no subcommand asked of the user
[ ] A write went through backlog-commit.sh; a read went through backlog.sh
[ ] The project check read only what the request named, plus one git grep
[ ] No subagent, no graph query, no plan read
[ ] title, tldr and done_when are all present and non-empty
[ ] grounded says what actually happened
[ ] An ambiguous target was asked about, never guessed
[ ] TICKET_ID and SHA are both in the report
[ ] A DEGRADED= write was reported as degraded
```

## Rules

ALWAYS:
- Route a write through `backlog-commit.sh` and a read through `backlog.sh`
- Resolve the mode from what the user said, never from a flag they must know
- Cap the project check at what the request names plus one `git grep`
- Report `TICKET_ID` — on an `add` nothing else tells the user what they created
- Report the sha, because it is the only undo this skill offers
- Say `grounded: false` out loud when the check found nothing

NEVER:
- Run `git add`, `git commit`, `git push` or `git worktree` yourself
- Write `docs/backlog.jsonl` or `docs/backlog.definitions.json` with Write or Edit
- Send `id`, `created_at` or `updated_at` in a record
- Invent a path to make a ticket look concrete
- Guess between two matching tickets
- Ask for confirmation before a write — the sha is the undo
- Re-sort the tickets a read returned — board order is priority order
