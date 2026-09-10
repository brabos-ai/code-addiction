# 2026-09-10 — A ruler for prompts, and a reviewer that ticks it

Implements `docs/plans/2026-09-10T173216-PLAN--prompt-quality-ruler.md`. Thirteen commits plus this
changelog, both layers, one agent created and no artefact removed.

## Why

The internal layer's quality rules lived in a checklist nobody ticked. `building-commands` carried it
as prose with no example of a pass or a fail, so two readers applied it two ways and neither was asked
for evidence. `add-framework--build` STEP 3 carried a partial copy, which is how a skill and a command
drift apart without anyone noticing.

Underneath that sat two things no gate looked at. **Nothing checked ambiguity inside one artefact** —
a duplicate heading, a step contradicting an earlier one, a rule with two owners. Every existing gate
compares artefacts to each other, and `build.js` already does that well. **Nothing checked the
contract with the neighbours** either: the graph proves an edge exists, and proves nothing about
whether a step sends what the agent it dispatches says it takes.

And an audit had no way out of the chat. A finding about an existing command was a message; the build
had nothing to execute and the review nothing to confirm.

## What replaced it

**One mechanism in three parts, and the third is the one that makes the other two useful.**

`building-commands` § `## The Ruler` holds eight items in two families. Family A — graph closed,
references resolve, mandatory form — is answered by a tool. Family B — contract with the neighbours,
single owner, no ambiguity between steps, no filler, cold-executable — is read and judged, and every
failure carries a line number and the quoted passage. Each item shows one **Expected** and one **Not
expected** example, quoted from this repository rather than invented.

`@prompt-review-agent` ticks it. It takes one node id and a mode, asks the artefact graph for the
neighbourhood, reads the artefact and its depth-1 dispatch/load/handoff neighbours, and returns the
eight items with evidence plus a verdict. It writes nothing, dispatches nothing, and cannot run
`build.js` — so item 1 is ticked by comparing the neighbour list against the body in both directions.

**Two dispatch points, and they are different questions.** `/add-framework--build` STEP 7.1 dispatches
it once per `.md` artefact in the diff, in `delivery` mode, as the scope that used to be a generic
"Quality" subagent handed a skill name. `/add-framework--plan` STEP 3.4 dispatches it in `audit` mode
on the artefact a request is *about*, and every failed item becomes an F-block carrying the evidence
and the fix. The build then proves the same criterion that found the defect.

**The author still ticks it first.** STEP 3 of the build loads the skill and says so; the reviewer is
not the author's own pass repeated.

## No size criterion, anywhere

The one thing the ruler refuses to measure is length. A budget makes a writer contort text to fit
rather than remove what has no reason to exist, and the two failures look nothing alike.

Enforcing that cost three lines elsewhere. `add-framework-development` set a word cap on descriptions
in two places, and the build loads that skill and `building-commands` on the same F-block — from the
merge on, an author would have held one rule setting a budget and another forbidding any. Both are
gone. `building-commands` itself carried "Maximum ~15 words per item", which is the same defect inside
the skill that now forbids it. The RED matrix was written expecting that assertion to pass as a guard;
it came back red, and the line went with the checklist it sat beside.

The gate count went the same way. "3+ gates explicitly block wrong actions" keeps the property and
loses the number: a minimum count is a threshold an author satisfies, not a property an artefact holds.

## The report count stops being four

STEP 7.1 hardcoded "four" in eight places — a heading, a dispatch line, a wait gate and five mentions
in its dispatch rules. One prompt review per artefact makes the count `3 + N`, and the gate now reads
the dispatch list the coordinator writes before waiting. When N is zero — a build touching only
scripts, tests or `CLAUDE.md` — nothing is dispatched for that scope and the gate waits on three.

## What the pass found in its own delivery

Eleven auditors ran: three over the whole delivery, eight ticking the ruler over every `.md` artefact
this delivery wrote. Fourteen findings, eight applied. Four are worth naming.

**The reviewer forbade the only tool that could answer its own questions.** It banned Bash outright
when the MCP is silent — but `scripts/artefact-graph-mcp.js` wraps `scripts/graph.js`, and both read
one sidecar. The CLI is the same engine, not a fallback. Every one of the nine ruler dispatches in
this build needed an ad-hoc substitution to route around the contradiction, which is as clear a
demonstration as the finding could ask for. `not verified` now requires both to fail. Grep stays
forbidden, because grep is the one thing that is *not* the engine.

**The agent declared three edges its prose never named.** `build.js` reported three phantom-edge
warnings against a zero baseline, and the build had been validated by grepping for the failure text
and never for the warning text. This is precisely the class of defect ruler item 1 exists to catch,
in the file that implements the check.

**`building-commands` told every command to run a script at a path that does not exist.**
`.fnd/scripts/log-iteration.sh` — no `.fnd/` directory is anywhere in this repository. The plan had
excluded that line as pre-existing, and the exclusion was reversed: the same delivery added a ruler
item mandating the literal `.codeadd/scripts/` in that exact file, so leaving it would have been a
contradiction this work created rather than one it found. A second dead pointer went with it —
`add-framework-product-layer` sent product builds to read `add-doc-schemas` under a name it lost.

**The verdict rationale was written twice**, once in the ruler and once in the agent, by two F-blocks
of the same plan. Item 5, in the delivery that defines item 5.

## The second prompt pass confirms, it does not re-review

The mechanism shipped with the prompt reviewer able to tick all eight items twice over one artefact in
one delivery: once at plan time in `audit` mode, once at build time in `delivery` mode. The second read
graded fixes the first read had asked for, which is precisely the confirmation pass
`add-review-discipline` forbids the adversarial reviewer. One reader was held to the rule and the other
was not.

The second pass stays and becomes narrow. `confirm` takes the ruler item numbers and answers two
questions: is each named item actually fixed, and did the fix break anything. It re-ticks those items
plus 1 and 2, because an edit that adds a name or moves a section is the edit that most often breaks
graph-closed and references-resolve, and both are answered by a tool it already called. A pre-existing
defect is out of scope there — it was present for the full tick, and raising it in a confirmation turns
it back into a second opinion.

The build picks the mode from the F-block. One citing a ruler item gets `confirm` with those numbers;
one citing none gets `delivery`. That signal already existed, because the plan names the item in every
F-block an audit produced, and STEP 5 now says that is what it is for.

Two passes, never three. The adversarial reviewer gets no confirmation pass of any kind, because it
reads a document that was never executed and so has nothing to confirm.

**A test from the previous delivery caught the first attempt.** `review-no-loops.test.js` L4.3 asserts
that the cap formulation belongs to `add-review-discipline` alone, and the agent had restated it. It
points at the owner now. Item 5, found by a guard rather than a reviewer.

## Four findings were rejected, and they have no owner yet

Three are real item-5 and item-2 failures in artefacts this delivery only brushed: the layer-paths
table in `/add-framework--plan` STEP 2.2 duplicating `add-plan-authoring`, and two defects in
`add-framework-development` — the two sections both numbered `## 8.`, and a compressed restatement of
`building-commands`' gate and rules format sitting beside a line that already delegates.

The line drawn was mechanical against structural. A dead pointer costs the next reader a wrong path
and its fix invents no decision, so it landed here. A duplication is a decision about who owns a rule,
so it gets its own plan. **The duplicate heading has a trap attached:** the ruler's own item-2 example
quotes it as present, so whichever plan fixes the heading must fix the example in the same commit.

## Files

| Action | Files |
|---|---|
| Created | `.claude/agents/prompt-review-agent.md`, `cli/tests/prompt-quality-ruler.test.js` |
| Modified | `building-commands/SKILL.md`, `add-review-discipline/SKILL.md`, `add-framework--build.md`, `add-framework--plan.md`, `add-framework-internal-layer/SKILL.md`, `add-framework-product-layer/SKILL.md`, `add-framework-development/SKILL.md`, `CLAUDE.md`, `cli/tests/build-artefact-graph.test.js` |
| **Deleted** | none |

## Left undone, on purpose

**The named dispatch is unproven.** `@prompt-review-agent` answered "Agent type not found" for the
whole of this build — the harness resolves its agent registry at session start, so a file created
mid-build is not addressable. The eight ruler reviews ran as generic read-only subagents told to read
the agent file and follow it, which is the fallback STEP 7.1 now carries a gate for. The definition is
pinned by six assertions; the name is not. The first real exercise is the next planned build.

**The product layer keeps its own quality flow.** `add-skill-creator` and the product-layer review
artefacts are untouched. A port of the ruler is its own plan, after this mechanism has run for real.

**One F-block was opened during the build.** The node inventory tripwire in
`cli/tests/build-artefact-graph.test.js` counts agents, so F3 broke it. It could not ride in F9's
commit — `cli/` is the product layer and `CLAUDE.md` the internal one — so it became F10, and the plan
was amended to say so. It broke three blocks before it was noticed, because the ruler matrix ran per
block and the full suite ran once. The lane proof both the plan and the build command specify,
`git status --porcelain framwork/` empty, still cannot see a write under `cli/` at all. That blind
spot is unchanged and any future plan inherits it.
