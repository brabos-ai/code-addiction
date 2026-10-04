---
name: add--final-report
description: "Use at a command's closing step — the seven blocks every finishing command reports in, the optional fresh-context continuation handoff and its two-response contract, the banned phrasings, and the self-check. Load at the last step, not at the first."
---

# Final Report — The Closing Shape

<!-- uses:
- mention: /add-build
- mention: add--delivery-mode
- mention: add--doc-schemas
-->

<!--
A sibling skill of the same name lives in this repository's internal development
layer, which is never distributed. The duplication is DELIBERATE: that layer's
directory does not exist in a user's project, so nothing here can reference it.
The two files carry the same seven blocks and different vocabulary — this one
speaks feature ID, task and requirement; the other speaks F-block and ledger.
DO NOT merge them, and DO NOT add a check that keeps them byte-identical.
Divergence is the intended outcome, not the failure mode.
-->

Owns the LAST thing a command says. Not what it wrote to disk — that belongs to whichever skill owns
the document. This is the message the user actually reads, and for most runs it is the only part of
the work they will ever see.

**Load this at the closing step, not at STEP 1.** A shape carried through fifteen steps is a shape the
agent no longer has when it matters. This skill is small on purpose so a late load costs nothing.

## When to Use

- A command has finished its work and is about to write its closing message.
- Writing or revising that closing step.

## When NOT to Use

- A command that finishes no work. A router that suggests a next command, or one that rewrites an
  instruction, has nothing to report and a report would be noise.
- A document written to disk. This is the chat message, never an artefact, and no schema gate runs
  over it.

---

## The Rule That Comes First

**Emit the report BEFORE any metadata.** Feature IDs, paths, verdicts, PR numbers and next-step
commands come after it, never in front of it and never instead of it.

A closing that names a file, a verdict and a next command has said the work exists. It has not said
what the work is. If the user has to ask "but what actually happened, and how does it work?", the
report failed, whatever facts it listed.

Plain language, the user's language. **Skip a block only when it is genuinely empty. Never pad one.**

## The Seven Blocks

**1. `TL;DR`** — one line naming what the user now has that they did not have before. Not what the
command did, not what file moved. A reader who stops here knows the outcome.

**2. `What was delivered`** — one line per unit of work, grouped by area. Each pairs the concrete
change with the file it lands in. **A command that proposes rather than executes titles this block
`What will be done` and writes it in the future tense.** Nothing else about the block changes.

**3. `How it works`** — the mechanism behind what was just delivered, readable by someone who did not
watch the run: what triggers it, what it reads, what it produces. This is the block that answers the
question every closing used to leave open.

**4. `Files touched`** — split by verb, because the risks differ:

| Action | Files |
|--------|-------|
| Created / Modified / Renamed | ... |
| **Deleted** | ... (write "none" when none — never omit the row) |

**5. `Where it plugs in`** — name the **host and the exact step**. "Changes the review flow" is not an
answer. "`/add-build` STEP 5, after the area dispatch" is. For a feature, the host is the route, the
screen or the caller the change reaches.

**6. `Not included`** — the scope boundaries the user must know.

**7. `⚠️ Needs your attention`** — only genuinely consequential: anything deleted, anything
irreversible, anything touching auth, billing or a migration, anything changing how an existing flow
behaves mid-run, and the one or two places the work is most likely to have gone wrong. Omit the block
entirely when there is nothing real; never manufacture a warning.

### Then, and only then

**Command-specific material comes AFTER the seven blocks and before the metadata.** A command that
owes the user a structured artefact of its own — a rulings table, a per-area file count, a quality
gate matrix, a requirement coverage table — prints it there, in its own shape, whole. It does not get
compressed into a bullet, and it does not get skipped because the seven blocks are done.

Plain facts are different: they belong inside block 2 or block 4, wherever they already fit.

Metadata is last: feature ID, document paths, verdicts, next-step commands.

## The Second Response — `chat-continuation-output-v1`

A manual run is usually where the session ends. The user opens a new one to keep going, and that new
session knows nothing about the decisions this run settled. This section owns what the command offers
them and what it hands over when they accept.

**It owns the SHAPE. Whether the offer is made at all belongs to `add--delivery-mode` — load it there
for that.** Two owners would drift, and the drift would be invisible until one closing printed an
invocation the other had ruled out.

### Two responses, never one

| Response | When | What it carries |
|---|---|---|
| The report | The completion itself | All seven blocks, the command's own mandatory artefact, then its metadata |
| The instructions | Only after the user accepts the pending offer | Exactly one fenced plain-text block, and nothing else |

**They are two turns.** Folding them into one message is the failure this contract exists to prevent:
a reader who pastes the block carries the report's findings along with it, and a fresh session spends
its first act re-reading a verdict it was about to be handed.

The first response ends with one localized yes/no question — whether to receive instructions for a
fresh context — and then stops. It may name the next activity in ordinary prose; the full invocation
waits for the answer.

```
IF THE USER ACCEPTS THE PENDING OFFER:
  ✅ DO: Respond with exactly one fenced plain-text block and nothing around it
  ⛔ DO NOT USE: Write on any file — the handoff is chat text, never a generated document
  ⛔ DO NOT: Run the next command, follow its file, or treat acceptance as consent to anything

IF THE USER DECLINES, OR THE REPLY IS AMBIGUOUS:
  ⛔ DO NOT: Produce the block, run anything, or ask again
  ✅ DO: End the handoff there
```

⛔ **Acceptance authorizes text, nothing else.** It is not approval to execute, to stage, to publish
or to merge, and an earlier approval of any of those is never an acceptance of this offer. Scope the
answer to the last explicit pending offer.

⛔ **The accepted response is exempt from the seven blocks, the mandatory-artefact rule and the
metadata.** It is one block of instructions. Every rule above this section governs the OTHER response.

### What the block contains

**Complete for its activity, not a transcript.** It is what the next session needs to start, not what
this session said.

| Include | Never |
|---|---|
| The complete next-command invocation, with its arguments, feature id or subfeature scope | An invented file, target feature, patch or approval |
| The objective or action, in a line | A summary of the run that produced it |
| The actual official document paths that govern the activity, each with its role | A path you have not seen resolve |
| Only the confirmed decisions and restrictions needed to act | Settled questions the reader would otherwise re-ask |
| The provider-correct spelling of the invocation | A canonical command name rewritten to fit one provider |

**References stay authoritative.** Point at the official document and describe the activity; never
restate a specification into the block, because a second copy of a rule is a second thing to drift.

**On a review correction**, name the current review and its `## Fix Routing`, and carry the finding
identities and the supersession decisions with it. Keep other sessions' work and evidence intact, and
tell the recipient to check current state before reapplying anything — a fix already applied is
re-applied twice when the block does not say so.

**Use the project's real relative paths**, and keep whatever path semantics the command already had.
There is no universal `@file` handoff syntax, and the diagnosis-to-hotfix `@report` interface is
untouched by this.

**Spell the invocation the way the provider invokes it** — command-as-skill where slash commands are
unavailable — without changing which command it is.

### Who never offers

⛔ **This contract is for a top-level finishing command only.**

```
IF THIS RUN IS A WORKER, A SUBAGENT, OR A STEP NESTED INSIDE ANOTHER COMMAND:
  ⛔ DO NOT: Offer continuation, ask a question, or open a competing conversation
  ✅ DO: Report as the owning command's step told you to, and return
```

A worker that loads this skill to close out its own area is not the user's next stop, and a question
from one leaves the user two threads to choose between. A backlog operation nested inside another
command is the same case. A top-level backlog operation offers only when its host selected an actual
next development activity; otherwise it ends normally.

## How It Reads

The seven blocks decide what the report says. This decides how it reads — and a report nobody can
scan at speed fails whatever it contains.

**Write it plainly. Three rules:**

1. **One idea per sentence.** Two ideas are two sentences. The failure this catches is a sentence
   that is correct, factual and still needs a second pass — a chain of clauses hung off one verb.
2. **Use the everyday word** whenever it is as exact as the rare one. "Ask", not "interrogate".
   "Check", not "ascertain". Where only the precise word is right, keep the precise word: this
   trades ornament for clarity, never accuracy for simplicity.
3. **Explain a technical term in one line the first time it appears**, then use it freely. The user
   reading this may not have followed the run. Keep the term; add the line.

⛔ **This is not a list of words to avoid**, and MUST NOT be turned into one. The reason is the one
`add--doc-schemas` gives for the same prohibition: a word list holds in one language only, and this
report is written in the user's. Test the sentence — can it be read once and understood?

**It is not a length limit either.** A long report of short plain sentences passes. One sentence with
four clauses does not.

### What the Report Never Covers

⛔ **The report never narrates your own mistakes, and never how a reviewer corrected them.** Not a
retry, not a wrong turn taken and backed out of, not the story of a fix a review verdict asked for.

That record already exists — the plan changelog carries it, and it is where someone auditing the run
goes looking. Repeating it here costs the reader the space an open item would have used.

✅ **This binds the seven blocks. It does not touch the metadata a command demands after them.** A
command that requires a review verdict and a one-line list of applied fixes still prints exactly
that, in its metadata, where it is a fact rather than a story. The self-check below already rules on
which wins: the command's own mandatory facts are all present, none traded for the shape. The ban is
about narrating in the report, never about suppressing a line a command mandates.

**The closing message answers three things: what was decided, what is still open, and what needs
watching.** A line grading your own performance answers none of them, and a reader scanning for the
second and third has to skip past it to get there.

## Banned

| Banned | Use instead |
|--------|-------------|
| Narrating your own error, a retry, or the story of a fix a reviewer asked for | Nothing in the blocks. A verdict and a one-line fixes list a command mandates still print, in the metadata — see What the Report Never Covers |
| `T03`, `RF01`, `RN02` carrying the meaning | State the change; the id goes in parentheses at most |
| Describing the artefact instead of the change ("the plan gains a section on X") | "X is added to `path/file`" |
| "Improves consistency", "more robust" | The concrete change and what it causes |
| Restating the problem the command was given | What was done about it |
| Skipping a deletion as "just cleanup" | Name every deleted file, always |
| Naming a category ("the auth endpoints") | Name each file and each step |

## Self-check before sending

```
[ ] The TL;DR names an outcome, not an activity
[ ] The "how it works" digest stands on its own with the surrounding context removed
[ ] A reader who watched none of the run knows what changed
[ ] Every deleted file is named; the Deleted row is present even when empty
[ ] Every integration point names its host AND its step
[ ] No task or requirement id is load-bearing — remove them all and the report still reads
[ ] It describes the WORK, never the document
[ ] Every unit of work appears somewhere in blocks 2-5
[ ] The command's own mandatory facts are all present, none traded for the shape
[ ] Every sentence carries one idea, and reads correctly the first time
[ ] No sentence narrates a mistake of yours or a correction a reviewer asked for
[ ] If a handoff was offered, it came after the metadata and asked once
[ ] If instructions were accepted, they are one block, carry no report, and executed nothing
[ ] If this run is a worker or a nested step, no offer was made
```

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "The path and the next command say it all" | That is a receipt. The user cannot act on it |
| "How it works is obvious from what changed" | It is obvious to you. You watched the run |
| "Nothing was deleted, I'll drop the row" | Write "none". An absent row is a question |
| "This command's report is too small for seven blocks" | Then some are genuinely empty. Skip those, do not flatten the rest |
| "The coverage table is long, I'll summarise it" | It prints whole, after the blocks. Exhaustive, not representative |
| "I'll paste the block into this same message to save a turn" | Then the reader carries the findings too. Two turns is the contract |
| "I'll write the handoff to a file so it survives" | The user chose chat-only. A file is a second authority to keep in step |
| "They said yes, so I'll go ahead and run it" | Acceptance authorized text. Running anything is a separate decision |
| "This subagent finished its area, I'll offer to continue" | A worker is not the user's next stop. Return to the command that dispatched you |

## Rules

ALWAYS:
- Emit the report before any feature ID, path, verdict or next-step command
- Write the Deleted row even when it reads "none"
- Name the host and the step for every integration point
- Print a command's own mandatory artefact whole, after the seven blocks
- Offer the continuation handoff once, after the metadata, at a top-level finishing command
- Answer an accepted offer with one block carrying the invocation, the activity and its official documents

NEVER:
- Load this skill at the start of a command — it is needed at the end
- Trade a mandatory fact for the shape
- Write a handoff file, or name a directory as where the continuation is kept
- Execute, stage, publish or merge on an accepted offer
- Offer from a worker, a subagent or a step nested inside another command
