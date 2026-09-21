# ADD Backlog — Durable Capture

<!-- uses:
- skill: add-final-report
- mention: add-framework--done
-->

<!--
`backlog.sh`, `backlog-commit.sh` and `add-doc-schemas/references/backlog.md`
are PRODUCT nodes, named in prose below on purpose and deliberately NOT
declared: `uses:` targets resolve inside the declaring artefact's own layer
(scripts/build.js), so `- script: backlog.sh` from here would resolve to
`internal/script/backlog.sh`, which does not exist. This repository is those
scripts' source, so it calls them by their repository path — the same way
add-framework--done calls delivered.sh.
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Records what the user wants to do next as a ticket on this repository's board, `docs/backlog.jsonl`, and
gets it to `main` in the same run. Adds a ticket, updates, comments on, reprioritises or closes one.
Grounds every new ticket in a bounded read of the project so it still means something weeks later.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Read the board          → through backlog.sh, never by opening the file
STEP 2: Resolve the operation   → add | update | comment | move | close | remove, and its target
STEP 3: Check the project       → add and update only; BOUNDED to what the request names
STEP 4: Write                   → ONE backlog-commit.sh call: write, commit, rebase, push
STEP 5: Report                  → operation, ticket, route, sha
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
ALWAYS — THE SCRIPTS OWN THE BOARD:
  ⛔ DO NOT USE: Write or Edit on docs/backlog.jsonl or docs/backlog.definitions.json
  ⛔ DO NOT USE: Bash to run git add, git commit, git rebase or git push for a board write —
                 backlog-commit.sh does all four and aborts a conflicting rebase itself
  ⛔ DO NOT: Supply an id, created_at or updated_at in a record — the script generates them
  ✅ DO: Read with backlog.sh, write with backlog-commit.sh

IF THE OPERATION OR ITS TARGET IS NOT RESOLVED (STEP 2 incomplete):
  ⛔ DO NOT USE: Bash to run backlog-commit.sh
  ⛔ DO NOT: Guess which ticket the user meant
  ⛔ DO NOT: Fall back to adding a new ticket when an update, a close or a move was asked for
  ✅ DO: Name the candidates, or say the ticket was not found, and STOP

IF EXECUTING STEP 3 (the project check):
  ⛔ DO NOT USE: Agent or any subagent dispatch
  ⛔ DO NOT USE: scripts/graph.js, or read docs/plans/, docs/brainstorming/, docs/delivered.jsonl
  ⛔ DO NOT: Read a file the request did not name and no grep of its own terms surfaced
  ✅ DO: Record intent. Planning the work is what the ticket points at, not what it is

IF ASKED TO CONFIRM BEFORE WRITING:
  ⛔ DO NOT: Add a confirmation prompt, a preview-and-wait, or an approval gate
  ✅ DO: Write the change and report it — STEP 5's sha is the undo
```

---

## Operation Mode

```
/add-framework--backlog <free text>   → decided from the text
```

There is no subcommand grammar. The text carries the operation, the target and, when the user says
so, the position.

---

## STEP 1: Read the Board

Run, from the repository root:

```bash
bash framwork/.codeadd/scripts/backlog.sh list --all
```

Its output is `KEY=VALUE` lines, then one ticket per line starting with `{`. Line order is the
priority: the first ticket is the highest. `add-doc-schemas/references/backlog.md` owns the fields
and the keys.

- `BACKLOG_PRESENT=no` → the board does not exist yet. That is a result, not an error: the first add
  creates it. Say so in STEP 5.
- `DAMAGED_LINE=<n>` or `UNDEFINED_STATUS=<name>` → carry each into STEP 5's report. Neither stops
  the run.

---

## STEP 2: Resolve the Operation and Its Target

Classify the request as exactly one of:

| Operation | Signal | The write in STEP 4 |
|---|---|---|
| **add** | Describes something to do that no existing ticket covers | `add` |
| **update** | Names a ticket and changes what it says | `update <id>` |
| **comment** | Names a ticket and adds something learnt since it was written | `comment <id>` |
| **move** | Names a ticket and changes its priority | `move <id> --top` \| `--after <id>` \| `--bottom` |
| **close** | Names a ticket and says it is done, delivered, dropped or no longer wanted | `update <id>` with `status` `done` or `dropped` |
| **remove** | Names a ticket and says it was written by mistake | `remove <id>` |

**A ticket leaves the queue by closing, not by removal.** A closed ticket stays on the board with its
history; `remove` erases it. Use `remove` only when the user says the ticket should never have
existed.

**Resolve the target the way the user addressed it:**

- By id — `0003B`.
- By an old number — `o 1.2`. Tickets migrated from the markdown board carry
  `Formerly item N.M of docs/backlog/index.md.` as their first note; match that note exactly.
- By subject — `aquele item do review adversarial`. The match must be unambiguous against the titles,
  tldrs and notes. `bash framwork/.codeadd/scripts/backlog.sh search <terms>` narrows it.

```
IF THE TEXT NAMES A TICKET THAT DOES NOT EXIST:
  ⛔ DO NOT: Create it instead
  ✅ DO: Say so, list the open tickets by id and title, and STOP

IF MORE THAN ONE TICKET MATCHES:
  ⛔ DO NOT: Pick the closest
  ✅ DO: Name every candidate and STOP
```

For a **move**, resolve the position too: the top, the bottom, or directly after a ticket the text
names. For an **add**, there is no position — a new ticket lands last. When the text also asks for a
position, run the add, then a move, as two writes.

---

## STEP 3: Check the Project (BOUNDED)

**Only for add, and for an update that changes what the ticket says.** Comment, move, close and
remove skip to STEP 4.

**Purpose: the ticket must name real things.** One reading "fix the review thing" is worthless in
three weeks; one naming the four files and the check that proves it done is worth the trip.

READ, and nothing else:

1. The files, directories and artefacts the request names.
2. Whatever a grep of the request's own terms surfaces in `workbench/` and `framwork/.codeadd/`.

Use what that returns to fill the record:

| Field | From |
|---|---|
| `title` | One line, what the ticket is |
| `tldr` | One line, plain language — what it delivers, not how |
| `notes` | One string per point worth keeping |
| `done_when` | A check someone can actually run |
| `paths` | The real paths the read found — only paths that exist |
| `grounded` | `true` when the read found real things, `false` when the ticket is recorded as stated |
| `theme` | A grouping, when the request or an existing ticket's theme implies one |
| `labels` | **Exactly one** of `product`, `internal`, `both` — the layer |

**Resolve the layer from the same read** — never from assumption. Paths under `workbench/`, `scripts/`,
`docs/` or the repository root make it `internal`; paths under `framwork/.codeadd/`, `cli/` or `mcp/`
make it `product`; touching both makes it `both`. When the user states the layer outright ("tanto
interno quanto do framework"), that statement wins over what the grep alone implies.

```
IF THE REQUEST NAMES NOTHING CHECKABLE:
  ⛔ DO NOT: Invent a path, a file or a target to make the ticket look concrete
  ✅ DO: Record it as the user stated it, with `grounded: false` and `paths: []`
  ✅ DO: Still record a layer from whatever the user's own words name
```

**This STEP is capped by design.** It informs one ticket. A command that dispatches an agent, opens
the artefact graph or reads a plan here has stopped recording intent and started doing the work.

---

## STEP 4: Write

**GATE CHECK:** Is the operation resolved, and its target unique? IF NO → return to STEP 2.

Run the write STEP 2's table names, once, from the repository root. A record goes on stdin as one
JSON object:

```bash
printf '%s' '<record>' | bash framwork/.codeadd/scripts/backlog-commit.sh <mode> [<id>] [<position>]
```

| Operation | stdin |
|---|---|
| add | the full record from STEP 3 |
| update | only the fields that change |
| comment | `{"content":"<what was learnt>"}` |
| close | `{"status":"done"}` or `{"status":"dropped"}` |
| move, remove | none |

**The script picks the route itself.** On `main` it commits directly; on any other branch it writes
through a locked worktree, so the ticket reaches `main` without touching the current branch. Either
way it rebases onto `origin` and pushes, and a conflicting rebase is aborted, never resolved.

Read its output keys: `ROUTE`, `BASE_BRANCH`, `TICKET_ID`, `SHA`, `PUSHED`, and `DEGRADED` when one
applies.

```
IF THE OUTPUT CARRIES REFUSED=<name>:
  ⛔ DO NOT: Retry with the field removed or the value changed on your own
  ✅ DO: Report the refusal by name — add-doc-schemas/references/backlog.md says what each means —
         and STOP

IF THE OUTPUT CARRIES DEGRADED=<reason>:
  ⛔ DO NOT: Re-run the write — the ticket is already on disk
  ⛔ DO NOT USE: Bash to push or rebase by hand
  ✅ DO: Report the reason and the local SHA, and say what did not happen
```

---

## STEP 5: Report

**LOAD `add-final-report`.** It owns the seven blocks, the banned phrasings and the self-check. Emit
the report FIRST — the sha and the rest of the facts come after it.

This command writes one ticket and pushes it, so most blocks are genuinely small. Fill `What was
delivered` with the ticket as it now reads, `How it works` with what that ticket commits whoever picks
it up to, and `⚠️ Needs your attention` with the push to `main`, because it already happened.

Then, after the seven blocks, state:

- The operation and the ticket it hit, by id and title.
- On an add, the layer label recorded.
- `ROUTE` and `PUSHED`, and the `SHA`. **The sha is what makes the change reversible without a
  confirmation gate**, so it is never omitted.
- Whether the ticket is grounded in real paths, or was recorded as stated.
- Any `DEGRADED`, `DAMAGED_LINE` or `UNDEFINED_STATUS`, and whether this run created the board.

---

## Rules

ALWAYS:
- Address a ticket by the id and title the user will recognise
- Resolve the layer from what STEP 3 actually read, or from what the user stated outright

NEVER:
- Remove a ticket that was delivered or dropped — close it
- Reorder tickets as a side effect of an update, a comment or a close
