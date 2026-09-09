# 2026-09-09 — Review, reshaped: one pass, no loops

Implements `docs/plans/2026-09-09T090201-PLAN--review-no-loops.md` (roadmap item 1, sub-items 1.0
through 1.5). Twenty commits, both layers, one command deleted and two artefacts created.

## Why

Review was a loop, in four places at once. `/add-framework--review` versioned itself
(`--review-v01`, `--review-v02`, …) and never overwrote. `/add-framework--done` refused to close
until it found a favourable verdict file on disk. The `blocked` path sent the document back for
another reading. Continue Mode did the same. Every one of them was an invitation to grade the same
work twice, and none of them could tell a second opinion from progress.

Underneath that sat a second problem nobody was asking about: whether a document survives the handoff
to a reader who was not in the conversation that produced it. The adversarial reviewer asks "can this
be executed?". Nothing asked "would someone with a clean context build the right thing?" — and a
document can satisfy every rubric and still steer the reader somewhere else.

## What replaced it

**Two dispatches, both inside `/add-framework--build`, neither writing a file.**

STEP 4 dispatches `@plan-readback-agent` over the plan before the first F-block. It says back what it
understood must be built and marks every gap it filled in on its own, each with what it would build
wrong if the assumption is wrong. It issues no verdict and asks no question — a questionnaire hands
the work back, a readback shows what the work would have produced. It is deliberately **not a gate**:
the stop that matters already happened at the design approval, and a reader that answers its own
questions out loud marks assumptions constantly, which is the format working rather than a defect to
escalate.

STEP 7 dispatches four read-only auditors in one parallel pass after the last F-block, then asks the
artefact graph what the four cannot see — neither the plan nor the diff shows what depends on a file
nobody opened. Findings are judged before they are applied, and every rejected one gets a ruling
saying why. A ledger where everything was applied is indistinguishable from a coordinator that never
read the reports.

**`/add-framework--review` is deleted, not deprecated.** Its versioned verdict file, its `vNN`
sequence and its PASS/GAPS_FOUND/BLOCKED table went with it.

**The close-out stops grading.** Eight places in `/add-framework--done` assumed a verdict on disk.
The ledger gate stays, and its rationale now says why it is the survivor: the two gates were never
asking the same question — one asked whether the delivery had been graded, this one asks whether it
happened at all.

**`add-review-discipline` is the single owner.** The counts, the no-file rule and what a caller owes
a report all live in one skill, and the three commands that dispatch point at it. The rule used to be
restated in each of them, which is exactly how the second pass survived in some and died in others.

## The asymmetry, and why it is deliberate

The adversarial reviewer runs **exactly once** per subject. The cold reader runs **at most twice**.

A rewrite changes what the cold reader reads, so a second reading answers a genuinely different
question. Running the adversarial reviewer again over lightly edited work does not — it produces new
opinions, and new opinions are indistinguishable from progress while costing another full read.

The cap is per subject, not per run. No command reads a document twice in one invocation; the second
reading is the next build of a revised plan, in a different session.

## A distributed artefact was naming an internal command

`add-plan-review` shipped to five providers telling users not to confuse its review with
`add-framework--review` — a command only this repository has. It got there because the prose gate
compares same-layer only, for a good reason: `add-commit` exists in both layers, so a product
artefact naming it means the product one. That skip left one direction unwatched, and it was the one
that ships.

`scripts/build.js` gained a gate for it, and the gate itself needed three rounds of correction before
it worked:

- It walked internal command **nodes**, so re-introducing the exact string that motivated it passed
  clean — that command had just been deleted. It matches the namespace now.
- It sat behind the `declares` guard, skipping scripts and reference subdocs, which ship verbatim.
- It **warned**, and `assertArtefactGraph` prints warnings as a bare count unless
  `ADD_GRAPH_WARNINGS` is set. Nothing in CI sets it, so the gate was a number there. It fails now.
- It read a helper that keeps HTML comments and drops fenced blocks — inverted on both halves. HTML
  comments are stripped at build and never ship; fenced blocks ship verbatim, and an example
  invocation is the likeliest place to write a command name.

The reverse direction stays open on purpose. `/add-framework--done` names `delivered.sh` because a
cross-layer `uses:` target would resolve inside its own layer and dangle.

## What the review pass found in its own delivery

Twenty-one findings, seventeen applied. Three are worth naming because they were invisible to every
other check:

**A rule was deleted where the plan said twice to rewrite it.** The close-out's "a command grading its
own delivery" prohibition went with the gate it explained. The narrowed assertion could not catch it,
because it only forbade the review sense of the word.

**Five assertions could not fail for the reason they were written.** The worst went green three blocks
before its condition was true: it looked for a literal pair of phrases while all three callers stated
the same rule in different words.

**"Runs exactly once" was unauditable on a clean pass.** It wrote no file by design and no ledger line
by omission, so a resumed session would see no evidence it had run and start a second one. STEP 7.4
now records it, and `add-build-ledger` — the ledger's owner — knows the line.

## Files

| Action | Files |
|---|---|
| Created | `.claude/skills/add-review-discipline/SKILL.md`, `.claude/agents/plan-readback-agent.md`, `cli/tests/review-no-loops.test.js` |
| Modified | `add-framework--build.md`, `add-framework--done.md`, `add-framework--plan.md`, `add-framework--brainstorm.md`, `add-framework--sync.md`, `plan-review-agent.md`, `add-plan-authoring/SKILL.md`, `add-build-ledger/SKILL.md`, `CLAUDE.md`, `scripts/build.js`, `framwork/.codeadd/skills/add-plan-review/SKILL.md`, `cli/tests/inventory.test.js`, `cli/tests/build-artefact-graph.test.js`, `cli/tests/plan-review-agent-speed.test.js`, `web/public/artefact-graph.mmd` |
| **Deleted** | `.claude/commands/add-framework--review.md` |

## Left undone, on purpose

**The readback dispatch is unproven.** The build ran under the eight-step command loaded at
invocation, and the harness resolves its agent registry at session start, so an agent file created
mid-build is not addressable by name. The definition is pinned by three assertions; the dispatch is
not. The first real exercise is the next planned build in a fresh session.

**The product layer keeps its own review flow.** `/add.review`, `add-plan-review`,
`plan-reviewer-agent` and `readback-agent` are untouched beyond one line. That is the roadmap's
declared scope for this item.

**One commit mixes layers.** F4 is tagged internal and carries a test file under `cli/`, which is a
product path. The deeper finding is that the lane proof both the plan and the build command specify —
`git status --porcelain framwork/` empty — cannot see a write under `cli/` at all. Any future plan
inherits that blind spot.
