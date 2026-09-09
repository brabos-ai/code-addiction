# Refactor: plan-review-agent runs in one pass, with shell

**Date:** 2026-09-09
**Plan:** `docs/plans/2026-09-09T061636-PLAN--plan-review-agent-speed.md`
**Layers:** internal, plus one product-layer test file

## Why

`@plan-review-agent` gates every plan and every architectural brainstorm, and three artefacts dispatch
it. Measured across four runs of the unchanged agent, a review took four to six minutes. The cost was
not the tools it called but how many separate turns it spent calling them: `Bash` sat in
`disallowedTools`, so verifying the sixteen to nineteen file paths a plan cites meant one model turn
per path.

## What changed

**The agent lost its tool restrictions.** Both `tools:` and `disallowedTools:` come off
`.claude/agents/plan-review-agent.md`. One shell call now checks every cited path and queries the
artefact graph together, measured at 334 ms for ten paths plus one graph query.

This trades a mechanical guarantee for a stated one. Nothing but the agent's own READ-ONLY sentence
now stops it writing. That sentence stays verbatim and a test asserts it survived.

**Its method became four phases.** Phase 1 works from the document alone. Phase 2 goes to the
repository in one message. Phase 3 opens a file only where phase 2 left a doubt. Phase 4 emits. Two
rules replace the old per-step prose: independent checks never go out one at a time, and a dependency
question goes to `scripts/graph.js` rather than being rebuilt from prose with grep. No phase carries a
number, and the old cap of eight extra reads is gone.

The trailing sentence "Do NOT run shell commands." went with them; as of the frontmatter change it
contradicted the file three lines above it. "You are a leaf. Do NOT dispatch other agents." stays.

**Its report shape now follows its verdict.** One shape used to serve three verdicts and two of them
discarded most of it. `ok` with nothing found is one line. `ok` with nits carries only the nits.
`blocked` carries only the blockers, which is all the caller presents before halting. `fix-then-ok`
carries everything and is the only verdict that emits `Do not change`. The `Section` and `Evidence`
columns merged into `Where`, the nit cap dropped from five to three, and the header stopped echoing
the `path` and `kind` the caller had just supplied.

**The second review pass is gone.** `fix-then-ok` is defined as fixes that invent no decision, and
confirming one cost a full re-read. The re-dispatch instruction came out of all four places that
carried it. `blocked` is untouched: it still stops and asks the user.

## Files

| Action | File |
|---|---|
| Created | `cli/tests/plan-review-agent-speed.test.js` |
| Modified | `.claude/agents/plan-review-agent.md` |
| Modified | `.claude/skills/add-plan-authoring/SKILL.md` |
| Modified | `.claude/commands/add-framework--brainstorm.md` |
| Modified | `.claude/commands/add-framework--plan.md` |
| Deleted | none |

## How it was proven

Twenty-four assertions across four levels in `cli/tests/plan-review-agent-speed.test.js`, written
before any change and confirmed failing: seventeen RED, seven green by design as guards over what the
change had to preserve. All twenty-four pass now, with the full suite at 910 passed and no failure.

Behaviourally, the same reference plan was reviewed by the agent before and after, with the tool-call
count and wall clock recorded in the build ledger.

## What this gives up

Nothing verifies any more that the fixes from a `fix-then-ok` were actually applied. And the reviewer
can write to the repository; only its prompt says it must not.
