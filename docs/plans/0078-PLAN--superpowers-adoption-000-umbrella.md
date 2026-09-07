# Plan: Superpowers Adoption — Umbrella

> **Status:** implemented
> **Type:** cross-cutting (6 topic plans: 3 product + 3 internal)
> **Created:** 2026-09-07
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

The owner asked to bring the intelligence of four `superpowers` skills — `brainstorming`, `writing-plans`,
`subagent-driven-development`, `systematic-debugging` — into both layers of this framework, and to remove
whatever our own artefacts carry that the port replaces.

The design set that answers it lives at `docs/brainstorming/2026-09-07T005046-superpowers-adoption-*`:
an umbrella plus three topic designs. **This plan does not restate them.** It sequences the six topic plans
they produce and names the boundaries where the framework is left coherent.

## Problem

A skill-by-skill comparison (umbrella design, "Context & Motivation") found the overlap is uneven:
`systematic-debugging` is already ported and ours is stronger; `brainstorming` and `writing-plans` each
contribute one or two mechanics; `subagent-driven-development` is the real gap, at seven.

Ten mechanics across two layers, touching `add.build`, `add.plan`, `add.plan-to-ready`, `add.brainstorm`,
`add.done`, four skills, two agents, three new scripts, all eight `add-framework--*` commands and their
OpenCode adapters. **One plan for all of it would be a plan nobody executes correctly** — and
`@plan-reviewer-agent` would be right to block it on scope.

## Proposal

Six topic plans in three pairs. Each pair is one topic split by the layer boundary that
`/add-framework--build` and `/add-framework--self-build` already enforce.

| plan | layer | design doc |
|---|---|---|
| `0078-PLAN--…-001-plan-contract` | product | `…-001-plan-contract.md` |
| `0078-SELF-PLAN--…-001-plan-contract` | internal | same |
| `0078-PLAN--…-002-durable-executor` | product | `…-002-durable-executor.md` |
| `0078-SELF-PLAN--…-002-durable-executor` | internal | same |
| `0078-PLAN--…-003-brainstorm-classification` | product | `…-003-brainstorm-classification.md` |
| `0078-SELF-PLAN--…-003-brainstorm-classification` | internal | same |

**These plans keep the current `NNNN-PLAN--slug` naming even though topic 001 replaces it.** The two builders
resolve `[NNNN]-PLAN--[slug]` today; naming this set in the format 001 introduces would make the set
unexecutable by the very command that has to execute it. The new convention applies to the first plan written
**after** 001 lands.

## Scope

### Includes

- The execution order across the six plans, and which boundaries leave the framework coherent.
- The three cross-topic facts that no single topic plan owns (below).

### Does NOT Include (important!)

- Any F-block. Every change belongs to a topic plan; this one sequences them.
- Restating the design docs. `/add-framework--plan`'s authoring rule is explicit: the plan points at the
  design and does not repeat it.

## Shared files

Five files are edited by **two plans each**, for different reasons. None is a conflict — but each is a place
where landing out of order, or landing one editor and forgetting the other, leaves a half-changed file:

| file | first editor | second editor |
|---|---|---|
| `add.brainstorm.md` | `PLAN--001` F5 — brainstorm path gains the time component | `PLAN--003` F1-F4 — path classification |
| `add-framework--plan.md` | `SELF-PLAN--001` S1, S2 — contract + timestamped naming | `SELF-PLAN--002` S4 — the `CLAUDE.md` ownership fix |
| `add-framework--shared-brainstorm.md` | `SELF-PLAN--001` S2.6 — brainstorm path | `SELF-PLAN--003` S1-S3 — path classification |
| `add-framework--build.md` | `SELF-PLAN--001` S2.8 — slug resolution | `SELF-PLAN--002` S1-S3 — ledger, commits, rulings |
| `add-framework--self-build.md` | `SELF-PLAN--001` S2.8 — slug resolution | `SELF-PLAN--002` S1-S3 — ledger, commits, rulings |

The execution order below already puts the first editor before the second in every row. **The risk is not
ordering, it is omission** — a second editor that opens a file already changed by the first and treats it as
finished.

## Cross-topic facts

Three findings surfaced during design that no single topic owns. Each is assigned here so none is orphaned:

1. **`add-planning` is orphaned and self-contradictory** — registered at `provider-map.json:106`, loaded by
   no command, and prescribing "one semantic commit per batch" which `add.build.md:82` forbids.
   **Owned by `0078-PLAN--…-001`** (deletion), with its salvageable content moved into `…-002`.
2. **The internal `CLAUDE.md` ownership claim is wrong.** `add-framework--build.md` STEP 6.3 (line 390) mandates syncing
   `CLAUDE.md`; `add-framework--plan.md:429` said the same command "reaches neither `CLAUDE.md` nor
   `.claude/`". **Owned by `0078-SELF-PLAN--…-002`**, which edits that file anyway.
3. **A live sentence breaks the moment `/add.build` commits.** `add.plan-to-ready.md:428` treats the absence
   of a commit as proof a subfeature did not converge. **Owned by `0078-PLAN--…-002`**, and it is a hard
   requirement of that plan, not an observation.

## Standing rule for every plan in this set

Two checked-in artefacts are derived from the graph, and **neither is regenerated by the build**. Both are
CI failures, not warnings, and no plan in this set named either file. Together they went red three times.

**1. Any F-block that adds or deletes an artefact** — command, skill, agent, script, reference or fragment —
**must update `cli/tests/build-artefact-graph.test.js`'s node-inventory snapshot in the same commit.**
The test hardcodes a per-kind count, a node total and a declaring-node total. Its own comment provides for
the change ("a moved count is FINE when it is intended… update the numbers here and say so in the commit").
Red when `PLAN--001` deleted `add-planning` (45→44 skills) and again when `PLAN--002` added three scripts
(14→17, 201→204 nodes). CONFLICT 2 and CONFLICT 7.

**2. Any F-block that adds or removes a `command:` entry in a command's `<!-- uses: -->` block must
re-run `node scripts/graph.js mermaid --write`** and commit `web/public/artefact-graph.mmd`.
The checked-in diagram's profile is `{"kinds":["command"],"depth":1}`, so **command→command edges change it
and nothing else does** — which is why deleting a skill in `PLAN--001` left it untouched and why adding
`command: /add.plan-to-ready` to `add.build`'s uses block in `PLAN--002` broke it. A rule written only
against artefact counts does not catch this. CONFLICT 8.

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| Six plans, paired by layer | The two builders own different trees and cannot execute each other's work | One plan per topic — `/add-framework--build` reaches neither `.claude/` nor `CLAUDE.md` prose |
| Order 001 → 002 → 003 | 002's pre-flight scan and constraints block read what 001 writes; 003 depends on neither | 002 first — its scan would ship with nothing to scan and need rewriting |
| This set keeps `NNNN-PLAN--slug` | The builders cannot resolve the new format until 001 lands | Dogfooding the new name — the set would be unexecutable |
| Vendor, never depend on superpowers at runtime | One vocabulary per job; four of five providers have no `superpowers:` namespace | An optional plugin — the catalog only accepts `type: mcp`, and it would bind to Claude only |

## Accepted Trade-offs

- **Six plans is a lot of documents.** Accepted: each is executable alone and reviewable alone, which one
  large plan would not be.
- **Topic 003 could have landed first, being independent.** Accepted: it is the smallest and the cheapest to
  defer, and shipping the executor work in order matters more.

## Risks and Mitigations

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| A pair's two halves land far apart, leaving the layers describing different rules | Medium | High | Each pair's product plan names its internal twin in Next Steps; the pair boundary is a safe stop, mid-pair is not |
| 002 starts before 001 lands, and the pre-flight scan is built against no contract | Medium | High | 002's Execution Order opens with a gate: `tasks.md` must already carry `Consumes` / `Produces` |
| The `NNNN` naming of this set reads as a mistake after 001 lands | Low | Low | Stated in Proposal, and repeated in 001's own plan |

## Ecosystem Impact

None directly — this plan creates no artefact. Its six children touch, in total: **5 product commands**
(`add.plan`, `add.brainstorm`, `add.build`, `add.plan-to-ready`, `add.done`), **7 product skills** —
`add-doc-schemas`, `add-tasks-checklist`, `add-subagent-driven-development`, `add-code-review`,
`add-feature-specification`, `add-ecosystem` modified and `add-planning` **deleted** — **1 product agent**
(`reviewer-agent`), **3 new product scripts**, `provider-map.json`, **8 internal commands**, **1 internal
agent** (`framework-discovery-agent`), the **9 OpenCode adapters** (8 commands + 1 agent), and `CLAUDE.md`.

Product skill count falls 42 → 41. Command and agent counts are unchanged.

## Red-Green Validation Matrix (spec for the build phase)

This plan ships no code, so it carries one level: the coherence of the set itself.

### L1 — Set coherence (RED → GREEN)

1. Every one of the six topic plans exists in `docs/plans/` under the `0078-` prefix.
   *RED today: none of them are executed.*
2. Every topic plan names its design doc, and every design doc named exists on disk. The product plans carry
   it under `## References`; the self-plans, whose template has no such section, carry it in `## Context`.
3. Every cross-topic fact above appears as an F-block (or a numbered change, in a self-plan) in the plan
   named as its owner. A fact owned by nobody is the failure this section exists to prevent.
4. **Every file in the Shared files table is claimed by exactly the two plans named there, for exactly the
   two different changes named there.** A third claimant, or two claimants making the same change, is a
   defect. Verify by grepping the six plans for each filename and reading what each says it does to it.

**GREEN = all four hold after the six plans are written and before any is executed.**

## Execution Order

`001 pair → 002 pair → 003 pair`, and inside each pair the **product plan first, then the internal one**.

- **001 before 002** because 002's pre-flight scan consumes the `Consumes` / `Produces` pairs 001 introduces,
  and its reviewer lens consumes the `## Global Constraints` block 001 introduces. Building the scan first
  means building it twice.
- **Product before internal, inside a pair**, because the product layer is what ships; an internal-only
  landing improves nobody's project.
- **003 last** although it depends on nothing. It is the smallest, and moving it earlier would delay the work
  the owner actually asked for.

**Safe stopping points:** after either half of the **001** pair (the schema gains a section nothing yet
requires — additive and harmless); after the **001** pair complete; after the **002** product plan (the
executor is durable, the internal builders are not — a capability gap, not a break); after the **002** pair;
after either half of **003**.

**Not a safe stop:** mid-`0078-PLAN--…-002`. That plan retires `GIT CLEAN` and rewrites the sentence at
`add.plan-to-ready.md:428` in the same breath. Landing the commits without the sentence fix leaves a
subfeature that failed converging reading as converged.

## Reviewer Handoff

`/add-framework--shared-review` audits each topic plan on its own. For this umbrella, the reviewer checks one
thing only: **that every cross-topic fact above landed in the plan named as its owner.** Those three are the
findings most likely to fall between plans, because none of them belongs to the topic that discovered them.

## References

- Design set: `docs/brainstorming/2026-09-07T005046-superpowers-adoption-000-umbrella.md` and its three topics
- Prior art: plan set **0074** — the umbrella-with-topics shape this set follows
- Upstream: [`obra/superpowers`](https://github.com/obra/superpowers) v6.3.0 (MIT, Jesse Vincent)

## Next Steps

/add-framework--build 0078-PLAN--superpowers-adoption-001-plan-contract

Then, in order: the `001` SELF-PLAN, the `002` pair, the `003` pair.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation |
| 2026-09-07 | Implemented in `b436e2d..e00939b (whole set)` on branch `feat/superpowers-adoption` (PR #34) |
