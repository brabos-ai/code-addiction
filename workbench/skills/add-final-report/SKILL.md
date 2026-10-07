---
name: add-final-report
description: "Use at a command's closing step, in the internal layer — the seven blocks every finishing command reports in, the banned phrasings, and the self-check. Load at the last step, not at the first."
---

# Final Report — The Closing Shape

<!-- uses:
- mention: add-framework--build
- mention: add-framework--plan
- mention: add-framework--done
- mention: add-build-ledger
- skill: add-final-report/references/result-block.md
-->

Owns the LAST thing a command says. Not what it wrote to disk — that belongs to whichever skill owns
the document. This is the message the user actually reads, and for most runs it is the only part of
the work they will ever see.

```
IF THE COMMAND IS NOT AT ITS CLOSING STEP:
  ⛔ DO NOT: Load this skill at STEP 1 or at any step before the last
  ✅ DO: Load this at the closing step, where the report is written
  ✅ DO: Load it earlier only at a STOP that ends the run or waits on the user — The Result Block below
```

A shape carried through fifteen steps is a shape the agent no longer has when it matters. This skill
is small on purpose so a late load costs nothing.

## When to Use

- A command has finished its work and is about to write its closing message.
- Writing or revising that closing step.

## When NOT to Use

- A command that finishes no work. A router that suggests a next command, or one that rewrites an
  instruction, has nothing to report and a report would be noise.
- A document written to disk. This is the chat message, never an artefact.
- The product layer. See below.

## The Sibling in the Product Layer

**A skill of the same name lives in the product layer, and the duplication is deliberate.** That
layer is distributed to users' projects, where this directory does not exist, so it cannot reference
anything here. The two files carry the same seven blocks and different vocabulary: this one speaks
F-block, ledger and layer; the product one speaks feature ID, task and requirement.

⛔ **Do not merge them, and do not add a check that keeps them byte-identical.** Divergence is the
intended outcome, not the failure mode.

---

## The Rule That Comes First

**Emit the report BEFORE any metadata.** Paths, commit ranges, verdicts, PR numbers and next-step
commands come after it, never in front of it and never instead of it.

A closing that names a file, a verdict and a next command has said the work exists. It has not said
what the work is. If the user has to ask "but what actually happened, and how does it work?", the
report failed, whatever facts it listed.

Plain language, the user's language. **Skip a block only when it is genuinely empty. Never pad one.**

## The Seven Blocks

**1. `TL;DR`** — one line naming what the user now has that they did not have before. Not what the
command did, not what file moved. A reader who stops here knows the outcome.

**2. `What was delivered`** — one line per unit of work, grouped by stage. Each pairs the concrete
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
answer. "`/add-framework--build` STEP 3, before the skill load" is.

**6. `Not included`** — the scope boundaries the user must know.

**7. `⚠️ Needs your attention`** — only genuinely consequential: anything deleted, anything
irreversible, any `AGENTS.md` edit (it rewrites what every future session loads), anything changing
how an existing command behaves mid-flow, and the one or two places the work is most likely to have
gone wrong. Omit the block entirely when there is nothing real; never manufacture a warning.

### Then, and only then

**Command-specific material comes AFTER the seven blocks and before the metadata.** A command that
owes the user a structured artefact of its own — a rulings table, a per-file edit count, a gate
matrix — prints it there, in its own shape, whole. It does not get compressed into a bullet, and it
does not get skipped because the seven blocks are done.

Plain facts are different: they belong inside block 2 or block 4, wherever they already fit.

Metadata is last: paths, commit ranges, verdicts, and the next-step command — which is printed as
**The Continuation Line**, below.

## The Continuation Line

**The next-step command is one paste-ready line carrying the path of the file the next stage
reads — one this closing just wrote, or the plan it resolved.** This section owns the rule. Brainstorm, plan and build each point here from their closing
step; none of them restates it.

**Format:** `/<command> <relative path>` — the plain path from the repository root, with no `@` in
front of it. The next stage receives the path as a literal argument, and its own Operation Mode
decides how it is routed.

```
IF A CHAT CLOSING IS ABOUT TO PRINT A CONTINUATION LINE:
  ⛔ DO NOT: Rebuild the path from a slug or a timestamp — print the path of the file the step wrote
             or resolved
  ⛔ DO NOT: Print the line before checking that the file is on disk
  ✅ DO: Run `test -f` on that path, and print the line only when it exists
```

**A missing file means no line, not a stop.** There is nothing to continue with, so the closing prints
its report without one.

**The check binds a chat closing only.** A document's own `## Next Steps` names its own path without
`test -f`, because that file is still being composed when the line is written.

**Spelling follows the provider's `slashCommands` capability** in `workbench/provider-map.json`:

| `slashCommands` | Provider | Line |
|---|---|---|
| `true` | claude, opencode | `/<name> <relative path>` |
| `false` | codex, which loads a command as a skill by its name | `<name> <relative path>` |

The path is identical in all three.

**Position:** it is the **last line of the metadata**, and so the last line of the closing. Other
command lines — for example `/add-framework--plan <relative path>` to revise a plan — may come before
it and use the same plain-path form. In `both` mode the result block follows it and is the
last thing printed; in `json` mode the line is not printed and travels as `next_step`.

**Plan set:** one line per plan that has F-blocks, in set order.

**Automatic delivery:** the same line is printed before the next stage is loaded.

**Who never prints one:** a closing that wrote no file the next stage reads — backlog, release, sync,
done, a direct build and a brainstorm spike. `/add-framework--done` is the terminal stage, and the
build prints its line but never loads it.

## The Result Block

**An agent driving a command through `claude -p` can read the outcome from one fenced JSON block
instead of parsing the report.** It is opt-in. `references/result-block.md` owns the shape; this
section owns when the block is due and what each mode prints. Do not restate the field table anywhere
else.

**When it is due:** at the closing step, and at every STOP that ends the run early or waits on the
user. Each `add-framework--*` artefact carries this one line in its prohibitions block, and this is its
only statement:

> On any STOP, load `add-final-report` and run `node scripts/output-mode.js`; when the mode is not `prose`, emit the result block with `status` and `reason` set.

**The resolver runs once, at that point — never at STEP 1.** Run `node scripts/output-mode.js` from the
repository root and read its `OUTPUT_MODE=` line. A resolver that cannot run — denied, missing, a
non-zero exit — falls to `prose`: the fall is always toward today's report.

| Mode | The closing prints |
|---|---|
| `prose` | Exactly today's report. No resolver output is shown and nothing else changes |
| `json` | Only the fenced block. The seven blocks, the metadata and the Continuation Line are not printed |
| `both` | Today's report in full, then the fenced block as the last thing printed |

**`OUTPUT_MODE_WARNING=<source>:<value>` is shown as one metadata line in `both`, and nowhere else.**
`prose` shows no resolver output, and `json` prints only the block, so a warning is not shown in either.
A mistyped value therefore gives no sign of itself there: the run falls to the next source's mode, or to
`prose`, in silence.

**In `json` mode the seven blocks, the command-specific facts (rulings, gate matrices) and the self-check below do not apply** — there is no report to
check. The block is checked against `references/result-block.md` instead.

**Fill every field from facts the run already holds.** `next_step` is the Continuation Line verbatim,
after its own `test -f` rule, and `null` where the closing prints none; for a plan set, the first line. A field the run did not read is
`null`, never a guess. `status` is `done` at a normal closing, `stopped` at a gate or hard stop,
`needs-approval` at a stop that waits on the user, and `failed` for an error the command did not plan
for.

## How It Reads

The seven blocks fix what goes in the report. This fixes the register it is written in. A build
report is read once, quickly, by someone deciding whether to merge — so the writing has to survive
one pass.

**Three rules:**

1. **Short sentences, one idea in each.** A second idea starts a new sentence. What this catches is
   the sentence that is accurate and still unreadable: several clauses stacked behind one verb.
2. **The common word beats the rare one** wherever both are exact. "Goes away", not "is elided".
   "Checks", not "asserts", unless the assertion is literally what ran. Precision always wins over
   plainness where the two actually conflict — that is rarer than it feels while writing.
3. **A technical term gets one line of explanation the first time it shows up**, then it is used
   without ceremony. The reader may have dispatched this build and watched none of it.

<!--
`add-doc-schemas` is named in the paragraph below and is deliberately NOT
declared. It is a PRODUCT skill, and `uses:` targets resolve inside the declaring
artefact's own layer (scripts/build.js) — `- mention: add-doc-schemas` from here
would resolve to `internal/skill/add-doc-schemas`, which does not exist, and the
dangling gate would fail the build. The prose sniff skips cross-layer names,
which is why this citation passes without a declaration. The product sibling of
THIS skill declares the same target, because there they share a layer.
-->

⛔ **DO NOT turn this into a list of banned words.** `add-doc-schemas` states why for the product
layer and the reason carries here unchanged: a word list binds one language, and this report is
written in whichever one the user used. Test the sentence, not the vocabulary.

**Register is not length**, and this adds no budget. A long report made of short plain sentences is
fine. One sentence with four subordinate clauses is not.

### What the Report Never Covers

⛔ **The report never narrates your own mistakes, nor how a reviewer corrected them.** Not the story
of a ruling you reversed, not an account of an F-block you re-did, not a retelling of a finding the
audit stage raised against your own work.

The plan changelog already carries that record, and the ledger carries the rulings — both survive
this session, and both are where an auditor looks. A second telling here buys nothing and costs the
reader the lines an open item needed.

✅ **This binds the seven blocks, and nothing after them.** `add-build-ledger` requires every
`Ruling:` line to reach the report, exhaustively, with its cost clause — and those come after the
blocks, as the command's own mandatory facts. A ruling stated as a decision and its cost is a fact.
The same ruling retold as what you got wrong and how you found out is the narration this bans. State
the decision; drop the story.

**The closing message answers three things: what was decided, what is still open, and what needs
watching.** A sentence grading your own performance answers none of the three. A reader scanning for
the last two has to read past it first.

## Banned

| Banned | Use instead |
|--------|-------------|
| Narrating your own error, or retelling how the audit corrected you | Nothing in the blocks. The rulings list still prints after them, exhaustively — see What the Report Never Covers |
| `F7`, `T3`, `L2.9` carrying the meaning | State the change; the id goes in parentheses at most |
| Describing the artefact instead of the change ("the skill gains a section on X") | "X is added to `path/file`" |
| "Improves consistency", "more robust" | The concrete change and what it causes |
| Restating the problem the command was given | What was done about it |
| Skipping a deletion as "just cleanup" | Name every deleted file, always |
| Naming a category ("the review commands") | Name each file and each step |

## Self-check before sending

```
[ ] The TL;DR names an outcome, not an activity
[ ] The "how it works" digest stands on its own with the surrounding context removed
[ ] A reader who watched none of the run knows what changed
[ ] Every deleted file is named; the Deleted row is present even when empty
[ ] Every integration point names its host AND its step
[ ] No F/T/L id is load-bearing — remove them all and the report still reads
[ ] It describes the WORK, never the document
[ ] Every unit of work appears somewhere in blocks 2-5
[ ] The command's own mandatory facts are all present, none traded for the shape
[ ] Each sentence carries one idea and lands on the first reading
[ ] Nothing in it narrates a mistake of yours or a correction the audit asked for
```

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "The path and the next command say it all" | That is a receipt. The user cannot act on it |
| "How it works is obvious from what changed" | It is obvious to you. You watched the run |
| "Nothing was deleted, I'll drop the row" | Write "none". An absent row is a question |
| "This command's report is too small for seven blocks" | Then some are genuinely empty. Skip those, do not flatten the rest |
| "The rulings table is long, I'll summarise it" | It prints whole, after the blocks. Exhaustive, not representative |

## Rules

NEVER:
- Trade a mandatory fact for the shape
- Merge this skill with its product sibling
