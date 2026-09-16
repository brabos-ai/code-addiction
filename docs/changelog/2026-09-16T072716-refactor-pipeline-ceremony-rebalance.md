# Pipeline ceremony rebalance — the classification travels, and review scales with it

Both planning pipelines re-asked what the stage before them had already decided, and both paid a review cost nobody had summed. A product feature walking `add.brainstorm → add.new → add.plan` cost six document-level agent dispatches before a line of code existed. The internal pipeline ran a five-section questionnaire unconditionally, even when the brainstorm it had just read guarantees zero open questions.

The cause was the same on both sides: the brainstorm settled decisions, wrote them down, and the command after it could not see them. `brainstorm` appeared in zero lines of `add.new.md` and `add.plan.md`.

## What changed

**An intent file now carries the classification and the decisions across the handoff**, in both layers. It names the path the brainstorm classified, every decision it closed with its rationale, whatever it could not close, the prior art it found, and the directions it rejected. `## Open` reads the literal `None` in the normal case.

**`add-feature-specification` became the single writer of `about.md`**, reached from two entry points: `/add.new`, and `/add.brainstorm` when the user accepts its new offer to continue straight into authoring. Both produce the same document from the same rules. The command keeps orchestration — id allocation, `init.sh`, the directory, the `[STOP]`, the schema gate, the reviewer, the discovery dispatches.

**Ceremony is measured rather than keyword-matched.** The `SIMPLE`/`STANDARD` word list is gone. The intent file's `path:` decides; with no intent file, three facts do — intent gaps, irreversible actions, footprint.

**Both brainstorms now recommend.** Every set of candidate directions carries a concrete reason for the one it would take. A command whose job is to help someone decide, and which refuses to say what it would do, has handed the work back.

**Review scales with the path.** `add.brainstorm` lost both dispatches; `add.new` keeps its reviewer only on the full path and lost its readback; `add.plan` keeps both and runs the only readback in the flow, over a folder that already contains `about.md`. Six dispatches become three on a large feature and zero on a small one.

**Internally**, `add-framework--plan` reads the intent file, makes its questionnaire conditional on `## Open`, sizes the work at 2.3, and falls back to the full questionnaire whenever the file is missing or malformed. `add-framework--brainstorm` stops routing `spike` to the planner — a spike's terminal state is its recommendation.

## Accepted risk

On the `bounded` path `about.md` receives no verdict-bearing review. The schema gate still runs, the confirmation screen catches extraction errors, and the three-fact test already excludes irreversible actions and large footprints from that path. A weak document still surfaces at `/add.plan`.

## Also in this delivery

`brainstorm-intent` schema with an explicitly declared narrowing, registered in the MCP type registry as a `work-item`. A `structuredQuestions` capability per provider, `true` only where the tool was verified. The `nit` tier and the `brainstorm` kind removed from `add-plan-review` and from the agent that implements it. Six artefacts that still described the old topology — including `add-ecosystem`, which `/add` loads as source of truth — brought current.

## What the review caught

Thirteen auditors over the finished work returned around thirty findings, four of them high. Two were functional: the `## Relations`/`tags:` rules had stayed in the command, so the new offer-to-continue path could not populate two mandatory schema sections; and the conditional questionnaire silently dropped a `blocked` audit item that needed a person. Seven test guards pinned the old topology and were brought to the new one — one of them caught a real defect rather than drift, and that was fixed in the command.
