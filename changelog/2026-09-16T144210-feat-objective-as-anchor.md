# The objective anchors the work

**2026-09-16** · internal layer, with one product-layer test change
· plan `2026-09-16T144210-PLAN--objective-as-anchor`

## Why

A brainstorm produced an umbrella and three subtopics. One of them was refined, planned, reviewed,
blocked, fixed and reworked — and then read beside the umbrella and found not to serve the objective
at all. It solved a real gap in a different feature.

**Every quality gate in this repository passed on that work.** The design had validated decisions, the
plan had a full impact table and a validation matrix, the reviewer returned findings and they were
fixed. Nothing was wrong except that it was not the work that had been asked for.

The reviewer had eight dimensions — scope, hidden assumptions, contradictions, dependencies,
executability, testability, risks, gold-plating — and **none of them asks what the work is for.**
Neither did any template: the design document went `Discovery` → `Context & Motivation` → `Problem`,
and the plan went `Problem` → `Proposal` → `Scope` → `Impact`. The objective lived only in a chat
transcript nobody could re-read.

## What changed

**The brainstorm works out the objective and uses it as the anchor.**

- `2.1` splits. `2.1.1` **drafts** an objective from what the user already said and asks them to
  correct it; `2.1.2` keeps the five original questions as what refines it. Asking someone to state
  their objective cold hands the work back to the person who came for help.
- The design template opens on `## Objective`, above `## Discovery`.
- `4.2`'s recommendation rule gains a second source — what comparable products, frameworks and
  conventions already settled — with the hard requirement that **the thing is named**. "Widely
  adopted" cannot be argued with, which is why it is worthless; "superpowers' brainstorming does X"
  can be looked at and contradicted. No network: a named recollection the user can check beats a link
  they will not open. Where the two sources conflict, **this repository wins**.
- The Key Decisions table becomes `Decision | Serves | Rationale | Validated`. Rationale says why a
  choice is sound; `Serves` says what it is for. A decision can be correct, validated and irrelevant.
- **A SET member inherits the umbrella's objective verbatim and states how it serves it.** A subtopic
  that cannot write that line is not a member, and `8.1` STOPs naming two readings without picking
  between them: either the subtopic belongs elsewhere, or the umbrella's objective was written too
  narrowly. Both have been true at once here, which is why neither is assumed.
- The Decomposition Map asks the same question one step earlier, where subtopics are first named.

**The objective travels to the plan.**

- `plan-template.md` gains `## Objective` between the header and `## Context`, carrying the design's
  objective plus one line on what is true once the build is done. The Impact table names the files;
  this names what they add up to.
- `add-plan-authoring` makes it the one section that is **copied rather than referenced** — the
  reviewer reads the plan, and `docs/brainstorming/` is gitignored. A plan with no design document
  still states one, marked `[from conversation, no design document]`.

**The reviewer checks it.** `plan-review-agent` gains a ninth dimension, `Objective fit`, failing when
a scope item, F-block or artefact cannot be traced to the stated objective — or when the plan states
none. It is not `Gold-plating` renamed: gold-plating asks whether a decision was made, this asks what
the decision was for.

**Three ruler items** found by a plan-time audit also landed: both `@framework-discovery-agent`
dispatches gained the mandatory block; `prior_deliveries` is omitted rather than sent as the literal
string `"none"` the agent has no branch for; and Continue Mode, which jumps past `1.1-1.3`, now asks
the delivery index before dispatching.

## What it cost to find out

The build's own gate was run against the document set that produced it, with a control group — and
**found more than the plan predicted.** Of the three subtopics, only one can state how it serves the
objective. Subtopic 001 cannot, as expected. **Subtopic 002 cannot either**, and the umbrella admits
it in its own text, introducing that topic with the word *"Separately"*. A second mis-membered item
nobody had noticed. It is reported, not silently corrected — which of the two readings applies is
exactly the decision the new gate refuses to take alone.

## Not included

The product layer. `add.brainstorm`, `add.new`, `add.plan` and the `add-doc-schemas` schemas carry the
same gap, deferred deliberately to its own planning. The one product-layer change here is two test
files that pin the reviewer's dimension list.
