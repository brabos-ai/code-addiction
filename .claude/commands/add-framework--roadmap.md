# ADD Roadmap — Durable Capture

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Records what the user wants to do next into `docs/roadmap/index.md`, then commits and pushes it to
`main`. Adds an item, updates one, or removes one. Grounds every entry in a bounded read of the
project so it still means something weeks later.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Read the roadmap        → create it if absent
STEP 2: Resolve the operation   → add | update | remove, and its target
STEP 3: Check the project       → BOUNDED to what the request names
STEP 4: Apply the edit          → surgical; no other item changes
STEP 5: Commit                  → docs/roadmap/index.md alone
STEP 6: Reconcile with origin   → fetch, rebase if behind, abort on conflict
STEP 7: Report what else goes up
STEP 8: Push to main
STEP 9: Report operation, item, sha
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
ALWAYS — THIS COMMAND OWNS ONE FILE:
  ⛔ DO NOT USE: Write or Edit on any path but docs/roadmap/index.md
  ⛔ DO NOT: Create a branch, open a PR, or merge
  ⛔ DO NOT: Regenerate docs/roadmap/index.md — rewriting the whole file to apply one
             change is the defect this command exists to avoid
  ⛔ DO NOT: Touch any item but the one the request targets

IF THE OPERATION OR ITS TARGET IS NOT RESOLVED (STEP 2 incomplete):
  ⛔ DO NOT USE: Write or Edit on docs/roadmap/index.md
  ⛔ DO NOT: Guess which item the user meant
  ⛔ DO NOT: Fall back to adding a new item when an update or a removal was asked for
  ✅ DO: Name the candidates, or say the item was not found, and STOP

IF EXECUTING STEP 3 (the project check):
  ⛔ DO NOT USE: Agent or any subagent dispatch
  ⛔ DO NOT USE: scripts/graph.js, or read docs/plans/, docs/brainstorming/, docs/delivered.jsonl
  ⛔ DO NOT: Read a file the request did not name and no grep of its own terms surfaced
  ✅ DO: Record intent. Planning the work is what the roadmap points at, not what it is

IF THE REBASE IN STEP 6 CONFLICTS:
  ⛔ DO NOT: Resolve the conflict
  ⛔ DO NOT USE: Bash to run git push
  ✅ DO: git rebase --abort, then report the conflict and the local commit sha

IF ASKED TO CONFIRM BEFORE WRITING:
  ⛔ DO NOT: Add a confirmation prompt, a preview-and-wait, or an approval gate
  ✅ DO: Apply the change and report it — STEP 9's sha is the undo
```

---

## Operation Mode

```
/add-framework--roadmap <free text>   → add, update or remove, decided from the text
```

There is no subcommand grammar. The text carries the operation, the target and, when the user says
so, the position.

---

## STEP 1: Read the Roadmap

READ `docs/roadmap/index.md` in full. Its structure is the contract for every later STEP:

- `## N. <theme>` — a numbered theme, in priority order.
- `### N.M — <title>` — an item inside that theme, in priority order.
- `**Scope:** internal | product | both` — the layer(s) the item touches, first line of the body.
- `**TLDR:** <one line>` — what the item delivers, extractive, readable with no other context.
- Body bullets under an item, ending in a `**Done when:**` line.

An item written before this contract may carry neither line — that is not a defect to fix in
passing. Add Scope/TLDR to an old item only when the request itself is about that item.

IF the file does not exist → CREATE it with a title and a one-line statement that the number is the
priority, then continue. Say in STEP 9 that the file was created.

---

## STEP 2: Resolve the Operation and Its Target

Classify the request as exactly one of:

| Operation | Signal |
|---|---|
| **add** | Describes something to do that no existing item covers |
| **update** | Names an existing item and changes what it says |
| **remove** | Names an existing item and says it is done, dropped, or no longer wanted |

**Resolve the target the way the user addressed it** — by number (`o 1.2`), or by subject (`aquele
item do review adversarial`). A subject match must be unambiguous against the item titles and bodies.

```
IF THE TEXT NAMES AN ITEM THAT DOES NOT EXIST:
  ⛔ DO NOT: Create it instead
  ✅ DO: Say so, list the items that exist, and STOP

IF MORE THAN ONE ITEM MATCHES:
  ⛔ DO NOT: Pick the closest
  ✅ DO: Name every candidate and STOP
```

For an **add**, resolve the position too: the theme and the slot the text implies, or the end of the
matching theme when it implies none. A request matching no existing theme opens the next `## N.`.

---

## STEP 3: Check the Project (BOUNDED)

**Purpose: the entry must name real things.** An item reading "fix the review thing" is worthless in
three weeks; one naming the four files and the grep that proves it is done is worth the trip.

READ, and nothing else:

1. The files, directories and artefacts the request names.
2. Whatever a grep of the request's own terms surfaces in `.claude/` and `framwork/.codeadd/`.

Use what that returns to write a concrete body: the real paths the work touches, and a
`**Done when:**` line that names a check someone can actually run.

**Resolve Scope from the same read** — never from assumption. Paths under `.claude/` (or the repo
root, `docs/`) make it `internal`; paths under `framwork/.codeadd/` or `cli/` make it `product`;
touching both makes it `both`. When the user states the scope outright ("tanto interno quanto do
framework"), that statement wins over what the grep alone would imply.

```
IF THE REQUEST NAMES NOTHING CHECKABLE:
  ⛔ DO NOT: Invent a path, a file or a target to make the entry look concrete
  ✅ DO: Record the item as the user stated it, and say in STEP 9 that it is ungrounded
  ✅ DO: Still record a Scope from whatever the user's own words name, even ungrounded
```

**This STEP is capped by design.** It informs one roadmap entry. A command that dispatches an agent,
opens the artefact graph or reads a plan here has stopped recording intent and started doing the
work.

---

## STEP 4: Apply the Edit

**GATE CHECK:** Is the operation resolved, and its target unique? IF NO → return to STEP 2.

| Operation | Write |
|---|---|
| **add** | Insert the new item at the resolved position |
| **update** | Rewrite only the target item's lines |
| **remove** | Delete exactly the target item's lines |

**An add's item always opens with Scope and TLDR, in this order:**

```
### N.M — <title>

**Scope:** internal | product | both
**TLDR:** <one line, plain language — what this delivers, not how>

- <bullet>
- <bullet>
- **Done when:** <a check someone can run>
```

TLDR is one line, not a restatement of the bullets that follow — if it needs a second line, it is
carrying detail that belongs in a bullet instead.

⛔ **On a remove, DO NOT renumber the surviving items.** Their numbers are how the user, the git
history and every earlier conversation refer to them. A gap in the sequence costs nothing; a silent
renumber invalidates every reference to the items below it.

⛔ **No item other than the target may differ afterwards, by a single byte.**

⛔ **PRESERVE THE FILE'S EXISTING LINE ENDINGS.** On Windows the working copy is normally CRLF.
Writing LF back turns every line into a change, so `git diff` reports a full-file rewrite for a
one-line edit — the exact failure this STEP forbids, arriving through the back door. Detect what the
file already uses and write that back. Verify with a diff before STEP 5: more lines changed than the
edit touched means the endings were rewritten.

Match the surrounding voice: the file is prose the user reads, not a database.

---

## STEP 5: Commit

Stage `docs/roadmap/index.md` by path and commit it alone. Conventional Commits, scope `roadmap`.

⛔ **DO NOT stage with `-A` or `.`** — the working tree may carry unrelated work, and this command
publishes to `main`.

---

## STEP 6: Reconcile with the Remote

Fetch `origin main` and rebase onto it if the local branch is behind.

**A bare push against a `main` that moved is rejected non-fast-forward**, which is why this STEP is
not optional. The commit from STEP 5 is already safe locally, so a failure here delays the write; it
never loses it.

---

## STEP 7: Report What Else Goes Up

List every commit on the local branch that this invocation did not create and that the push will
carry to `main`.

**Informative only. It never blocks.** Publishing someone else's work by accident is worth one line
of warning; refusing to capture a roadmap item because the branch carries unrelated commits is not.

---

## STEP 8: Push to Main

Push to `main`. No branch, no PR — this command's whole durability guarantee is that the write
reaches the remote in the same invocation that made it.

---

## STEP 9: Report

State, in the user's language:

- The operation and the item it hit, by number and title.
- On an add, the Scope recorded.
- The commit sha. **This is what makes the change reversible without a confirmation gate**, so it is
  never omitted.
- Whether the entry is grounded in real paths, or was recorded as stated.
- Anything STEP 7 listed, and whether the file was created by STEP 1.

---

## Rules

ALWAYS:
- Address an item by the number and title the user will recognise
- Open a new item with `**Scope:**` and `**TLDR:**`, in that order, before the bullets
- Resolve Scope from what STEP 3 actually read, or from what the user stated outright
- Keep surviving item numbers stable across a removal
- Write back the line endings the file already uses
- Stage `docs/roadmap/index.md` by path, never the whole tree
- Report the commit sha — it is the only undo this command offers

NEVER:
- Write any file but `docs/roadmap/index.md`
- Rewrite the whole file to apply one change
- Resolve a rebase conflict
- Invent a path to make an entry look concrete
- Backfill Scope/TLDR onto an old item the request did not target
