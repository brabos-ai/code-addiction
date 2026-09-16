# Brainstorm: Where the Graph Gate Belongs in `add-framework--brainstorm`

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-13
> **Type:** command
> **Layer:** internal — `.claude/`

## Discovery

**This design has an observed failure behind it, not a hypothesis.** In the session that produced
`2026-09-13T112232-test-agent-terminal-states-sequential-dispatch`, the coordinator enumerated the
artefacts a change would touch by reading files and grepping. It missed
`commands/add.plan-to-ready.md`, a depth-1 `DISPATCHES` caller of both agents being changed. The
adversarial reviewer caught that one. Running `node scripts/graph.js impact` afterwards returned it
as the **second line** of the answer, and returned two further callers that neither the coordinator
nor the reviewer had found.

**The instruction already exists and is not the problem.** `add-framework--brainstorm.md:119-122`
carries it: *"A RELATIONSHIP question is a different question, and `add-artefact-graph` owns it. (…)
Load the skill before reaching for grep."* The `uses:` block declares the skill. The skill itself is
thorough — eleven verbs, both interfaces, and a `What the Graph Cannot See` table that is its most
valuable section.

Two facts explain the miss, and only the second is worth fixing:

1. The session was invoked with a snapshot of the command taken **before** those lines landed. Its
   `uses:` block has no `skill: add-artefact-graph` and its STEP 1.2 ends before line 119. This is a
   timing artefact of one session and needs no change.
2. Even on the current text, the guidance would very likely not have fired. That is what this design
   addresses.

**Graph state at the time of writing.** `impact add-artefact-graph` reports thirteen dependants,
eight of them `USES_SKILL` at depth 1, including all three of `add-framework--plan`,
`--build` and `--brainstorm`. The wiring is complete. The placement is not.

## Context & Motivation

Three internal commands ask the graph. Two do it as a gated step with named calls; the third does it
as advice inside a step about something else.

| Command | Location | Shape |
|---|---|---|
| `add-framework--plan` | STEP 3.2, its own numbered sub-step, titled *"Ask the Graph. Do Not Grep For It."* | Four concrete `graph.js` calls, introduced by *"For every artefact the change touches"* |
| `add-framework--build` | STEP 7.2, *"Ask the Graph What the Subagents Cannot See"* | Two calls (`impact --depth 1`, `history --layer`), run **after** the last F-block, to catch what the auditors could not see. A post-hoc check, not a pre-implementation caller lookup |
| `add-framework--brainstorm` | Inside STEP 1.2, whose heading reads *"Ask the Delivery Index, Then Dispatch Framework Discovery (SILENT)"* | Narrative guidance. No call, no output, no gate |

## Problem / Opportunity

### 1. Guidance without a named output is judgement, and judgement loses

`plan` names four commands to run. `brainstorm` says to load a skill when a relationship question
arises. The first is executed because a step with a call and an output is checkable; the second
requires the coordinator to notice the moment, mid-conversation, with no prompt.

### 2. It sits under a heading about a different question

STEP 1.2 is the delivery-index step. The graph paragraph is an aside within it. A reader scanning
step headings for "where do I ask about relationships" finds nothing.

### 3. The timing is wrong, and this is the decisive one

At STEP 1.2 the coordinator holds a **topic**, not a list of artefacts. The list of artefacts a
change touches is discovered during STEP 4's exploration and first written down in STEP 5's
`## Ecosystem Impact` table. That is the moment `impact` answers a question the coordinator can
actually ask — and there is no instruction there at all.

`plan`'s placement works for exactly the inverse reason: STEP 3.2 sits in critical analysis, after
the touched artefacts are known. The same sentence, moved to the wrong point in `brainstorm`'s flow,
cannot fire.

This is also why the failure survived the reviewer's design review: the reviewer reads the document,
and a caller absent from the Ecosystem Impact table is absent from the document too. Only the graph
had it.

## Proposed Solution

### Alternatives considered

| Option | Approach | Verdict |
|---|---|---|
| **A** | Expand `add-artefact-graph/SKILL.md` with more on when to query | **Rejected.** The skill already has `When to Use` and `When NOT to Use`, both correct. A skill cannot fire itself; the command has to reach it at the right moment |
| **B** | Strengthen the wording at STEP 1.2 — add a ⛔ block | **Rejected.** Keeps the paragraph at the point where the artefact list does not yet exist. A louder instruction at the wrong time is still at the wrong time |
| **C** | Give `@framework-discovery-agent` graph access so discovery returns callers | **Rejected.** Its allowlist is `Glob, Read` and the command states *"The agent parses nothing"* deliberately. Querying needs `Bash`, and the roster keeps read-only agents free of it |
| **D** | Add a gated graph step at the point the artefact list exists, mirroring `plan` STEP 3.2 | **Recommended** |

### Recommended — option D

A new gated sub-step that runs **over the artefacts the exploration identified** rather than over the
topic, carrying the two calls that answer the caller question. Its output is the `## Ecosystem
Impact` table's caller column, so the step has a product and an absent product is visible.

**Two calls, not `plan`'s four.** `plan` STEP 3.2 lists `impact --depth 1`, `impact` unbounded,
`dependencies` and `path <a> <b>`. Only the first two belong in a per-artefact loop here: the
unbounded run is context rather than an answer, and `path` takes two artefact names, so it has no
place in a loop over one. The step names the two it uses and points at the skill for the rest,
exactly as `plan` and `build` both already do.

**It runs on two of the three effort paths.** The `architectural` path runs it at the end of STEP 4,
before STEP 5 writes the document. The `bounded` path runs the same two calls before it presents its
in-chat short design — see the Key Decisions below for why that path is not optional.

The shape follows `plan`'s, which is already proven in this repo:

```
FOR EVERY ARTEFACT THE DESIGN WOULD CHANGE:
  ⛔ DO NOT: Build the Ecosystem Impact table from reading and grep
  ✅ DO: node scripts/graph.js impact <name> --depth 1    ← the caller list
  ✅ DO: node scripts/graph.js dependencies <name>        ← what it needs
  ✅ DO: Name the callers the answer returns, or state the table is NOT VERIFIED
```

STEP 1.2's existing paragraph stays. It answers a real and different question — a relationship that
comes up during discovery, before any artefact list exists. The two are not duplicates: one is
opportunistic, the new one is mandatory and has an output.

Two details the step must carry, both already documented in `add-artefact-graph` and both
load-bearing here:

- **Depth 1 for the caller list.** The unbounded run saturates — `impact test-agent` returned 89
  dependants, of which the four that mattered were the depth-1 `DISPATCHES` rows.
- **A fragment's edges need a second query.** The skill's `What the Graph Cannot See` table says a
  fragment's `DISPATCHES` originates at the fragment node, so `impact <command>` reaches the fragment
  but never shows what it dispatches. In a design that touches fragments — as the companion design
  does — the step is two queries, not one.

## Type of Artefact

Command — a step added to an existing internal command. No new artefact.

## Scope

### Includes

| Id | Change | Artefact |
|---|---|---|
| G1 | New gated graph sub-step with **two** calls (`impact <name> --depth 1`, `dependencies <name>`), scoped to the artefacts exploration identified. Runs at the end of STEP 4 on the `architectural` path, and before the in-chat short design on the `bounded` path | `.claude/commands/add-framework--brainstorm.md` |
| G2 | STEP 5.2's `## Ecosystem Impact` template gains a caller column fed by G1, so the output is visible in the document | `.claude/commands/add-framework--brainstorm.md` |
| G3 | STEP 4.4's validation checklist gains one item: the Ecosystem Impact table is graph-derived, or explicitly marked NOT VERIFIED | `.claude/commands/add-framework--brainstorm.md` |
| G4 | The `Rules` section gains the ALWAYS line, so it survives a future rewrite of the step | `.claude/commands/add-framework--brainstorm.md` |
| G5 | STEP 3's routing table gains the graph step on the `bounded` row, whose STEP 4 entry already promises *"which artefacts change"* | `.claude/commands/add-framework--brainstorm.md` |

### Does NOT Include

- `add-artefact-graph/SKILL.md` — its content is correct and complete for the question it owns.
  Nothing here changes what the skill says.
- `add-framework--plan` STEP 3.2, which is the model being copied.
- `add-framework--build` STEP 7.2. **No change is needed and none is proposed.** It asks a different
  question at a different time — two calls after the last F-block, to catch what the auditors could
  not see — where this design's step asks for a caller list before anything is written. The two are
  complementary by design, not two copies of one idea that drifted.
- The `spike` path. It produces no artefact list: it answers a feasibility question and its output is
  labelled throwaway. A gate with no input to run over is process for its own sake.
- `@framework-discovery-agent`'s allowlist (option C).
- The MCP interface itself. Both interfaces answer the seven shared verbs identically, so the step
  names `graph.js` calls and any agent with MCP may use it instead.

## Key Decisions

| Decision | Rationale | Validated |
|---|---|---|
| The gate goes where the artefact list exists, not at discovery | At STEP 1.2 the coordinator holds a topic; the artefact list is built in STEP 4 and written in STEP 5. `plan` STEP 3.2 works because it sits after the artefacts are known | ✅ |
| The `bounded` path is covered, not only `architectural` | `bounded` is defined as *"a change to a command, skill, agent or script that already exists"* — the exact shape that produced the observed `add.plan-to-ready` miss — and its STEP 4 entry already promises to state *"which artefacts change"*. Covering only `architectural` would leave the cited failure category open on the path where it is most likely. The cost is two shell calls over a list that is short by definition | ✅ |
| The `spike` path is **not** covered | It produces no artefact list and its output is labelled throwaway. A gate with nothing to run over is process for its own sake | ✅ |
| `add-framework--build` needs no change | Its STEP 7.2 asks a different question at a different time. Naming it as something to *"confirm and align"* was a false premise in an earlier draft of this document | ✅ |
| STEP 1.2's paragraph is kept, not moved | It answers the opportunistic case — a relationship question during discovery. Different question, different moment | ✅ |
| The skill is not changed | A skill cannot fire itself. `When to Use` is already right; the defect is that nothing reaches it at the right time | ✅ |
| The step must have an output | A step whose product is the Ecosystem Impact caller column is checkable. Guidance with no product is not | ✅ |
| The calls are named in the command, not delegated to the skill | `plan` and `build` both name them inline and point at the skill for the rest. Consistency across the three commands, and a named call is executed | ✅ |
| `--depth 1` for the caller list | The unbounded run saturates: 89 dependants for `test-agent`, of which 4 depth-1 rows carried the answer | ✅ |

## Ecosystem Impact

Every artefact below is **internal layer** (`.claude/`), so every F-block tags `[internal]`.

Caller list from `node scripts/graph.js impact add-artefact-graph` — thirteen dependants, eight
`USES_SKILL` at depth 1.

| Component | Impact | Action |
|---|---|---|
| `.claude/commands/add-framework--brainstorm.md` | New gated step on two of three paths, template column, checklist item, routing-table row, rule line | G1, G2, G3, G4, G5 |
| `.claude/commands/add-framework--build.md` | None — STEP 7.2 is a different question at a different time | none |
| `.claude/skills/add-artefact-graph/SKILL.md` | None — content is correct | none |
| `.claude/commands/add-framework--plan.md` | None — it is the model | none |
| `.claude/agents/framework-discovery-agent.md` | None — allowlist unchanged by decision | none |
| `CLAUDE.md` | Not a graph node. Its `Where the details live` row for the graph already points at `add-artefact-graph` and needs no edit, but must be checked by hand, since no gate covers it | verify |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| The caller list in a design comes from the graph, not from grep | Two to four shell calls per affected artefact, before the document is written |
| A missing query is visible, because the step has a product | |
| The three internal commands ask the graph the same way | |

| Risk | Probability | Mitigation |
|---|---|---|
| The step is skipped anyway, like the STEP 1.2 paragraph was | Medium | It has an output the document shows, and G3 puts it in the STEP 4.4 checklist that already gates document generation. That is the difference from the paragraph it supplements |
| A graph answer is treated as complete when it is not | Medium | The step carries the fragment two-query rule explicitly, and the skill's `What the Graph Cannot See` table is the named authority |
| More process on a command whose value is conversation | Low | Four calls at one point, after exploration is already done. It replaces grep, it does not add a phase |
| `add.plan-to-ready`-class misses recur in the product layer | Low | `/add.plan` has its own graph step; this design covers the internal commands only, which is where the observed failure happened |

## Next Steps

Run: `/add-framework--plan graph gate placement in add-framework--brainstorm`
