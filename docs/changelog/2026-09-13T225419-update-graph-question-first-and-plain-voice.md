# Ask the graph by question, and speak plainly

Commands stop naming a graph verb and state the question instead, the discovery agent gets a route to
the graph at last, and both layers gain a rule about how the writing reads.

## The defect

Two problems, found by watching one real session fail.

**The graph.** A coordinator built a design's affected-artefact table by reading files and grepping,
and missed a direct caller. The command it was following named one verb: `history`. It ran `history`
and stopped. The instruction did not fail by being weak — it worked, and it held the agent to one
verb. The skill documents eleven verbs, four reachable only over MCP. The commands exposed two to
four, all CLI.

Worse, the agent whose whole job is finding related artefacts could not ask at all.
`framework-discovery-agent` carried `tools: Glob, Read` and a `disallowedTools` that denied `Bash`,
so it answered relationship questions by globbing filenames and scoring keywords. The skill's own
reassurance — that an agent without MCP "is not degraded", because the CLI answers identically —
quietly assumed the agent could shell out. This one could not, and nothing said so.

**The voice.** The same session produced answers that were factual, non-figurative and free of
filler, and still hard to read. The existing rules ban filler, figures of speech, marketing copy and
aspirational language. None of them bans an elaborate register. A sentence can pass every rule on the
books and still be a stack of subordinate clauses.

## What changed

**A question, and a gate on the answer.** `add-artefact-graph` gained a resolution table read from
the question end: a command states what it must answer and points here, and the skill says which verb
answers it, when one query is not enough, and what no query reaches. `--brainstorm`, `--plan` and
`--build` now state questions where they named calls, and each gates on a filled answer — the design
document's new `Called by` column, the plan's Ecosystem Impact row, and a `GRAPH:` line in the build
ledger. An unanswerable question is written `NOT VERIFIED`, never left blank: a blank cell claims
nothing calls the artefact, which is a different statement from nobody having asked.

`--sync` keeps its literal calls. Its STEP 2 is deterministic transcription with no agent deciding
anything, `--json` is the point, and explicit bash is correct exactly there. What changed is only the
pointer, so the step stops implying those two verbs are the whole surface.

**The discovery agent can ask.** Five edits in one file, because changing `tools:` alone would have
shipped a grant the sibling denylist cancels: ten `mcp__artefact-graph__*` identifiers and `Bash`
granted (`reindex` excluded — it rebuilds an index, and this agent investigates), `disallowedTools`
stops denying `Bash` and still denies every write tool, `readonly: true` joins it for the dialects
that read that key instead, the description and body stop claiming the agent runs no shell command,
and a new step 0 asks the graph before any filename scan.

An empty graph answer and a missing route are kept apart. The first is a finding a caller can act on;
the second is not, and merging them would mask a real "nothing depends on this".

**The cost, stated.** With `Bash` granted, no frontmatter key can stop a shell write. The agent's
read-only promise now rests on a prohibition in its own body, written as a gate naming the specific
shell-write shapes. That is weaker than a dialect-enforced denial, and it is recorded rather than
glossed.

**Plain register, in the places that already govern voice.** `add-doc-schemas` states the rule once —
short sentences carrying one idea, the common word wherever both are exact, a technical term
explained in one line at first use. Both `add-final-report` skills apply it to the closing summary in
their own wording, and the `> **LANG:**` line carries it into all 23 commands, 16 product and 7
internal.

It is not a word list, and each surface says so with the reason: a word list holds in one language
only, and these bind output in whatever language the user wrote in. It is not a length limit either —
a long passage of short plain sentences passes, and one four-clause sentence does not.

**One banned subject.** The closing report never narrates the author's own mistakes, nor how a
reviewer corrected them. That record lives in the plan changelog and the ledger, both of which outlive
the session. The ban binds the seven blocks and not the metadata after them: a command that mandates a
review verdict and a one-line fixes list still prints exactly that, and the build's rulings still
reach the report exhaustively. State the decision; drop the story.

**Two contradictions closed in `--brainstorm`.** STEP 3's routing table said `bounded` and `spike`
abbreviate STEP 4 while STEP 4.1 said `DO NOT skip any`; the table is the newer, deliberate design and
STEP 4 now yields to it. The same table claimed three closing sub-steps had nothing to show on those
paths — but `add-final-report` reports the work, not a file, and a spike's recommendation is what its
blocks 2 and 3 carry. All three paths emit the report now; only the document-path metadata line
varies.

**`docs/brainstorming/` is reachable from both ends.** `--plan` reads it, and `--brainstorm`'s handoff
names the file it wrote. The handoff alone would break in Continue Mode, where the directory holds a
whole set sharing one timestamp.

## What the review changed

Thirteen auditors read the finished delivery. Three findings were regressions this work introduced,
and all three are fixed: `--brainstorm` still described the discovery agent's allowlist as
`Glob, Read` and untouched; the command templates in `building-commands` and
`add-framework-development` still printed the pre-change `LANG` line, one of them labelled mandatory;
and the new ban collided with the ledger rule that every ruling reaches the report.

Two more were gates pointing at nothing. `--build` STEP 7.2 blocked on an audit report that STEP 7.3
explicitly never writes, so it now writes a `GRAPH:` line into the ledger instead. And `--done`'s new
pointer sent a reader to a section that did not carry `.gitignore`, so the skill now answers "is this
path a node" in a row of its own.

`add-framework-internal-layer` turned out to carry the same named-verb defect, in a skill loaded on
every internal F-block — a higher-traffic surface than three of the four commands the plan named. It
states its two questions now.

## Why it matters

A named verb is a decision made at authoring time, for a question nobody has asked yet. It reads as
helpful and it is the thing that held a coordinator to one query while a caller went unseen. A stated
question with a gate costs one more lookup and cannot be satisfied by running the wrong tool.

The register rule catches what four existing voice rules let through. None of them says anything about
how a sentence is built, which is why output could satisfy all four and still need a second reading.
