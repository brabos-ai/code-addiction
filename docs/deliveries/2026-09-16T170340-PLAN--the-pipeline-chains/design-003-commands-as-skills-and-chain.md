# Brainstorm: The four pipeline commands become skills, and chain

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-16
> **Type:** architecture
> **Layer:** internal
> **Part of:** `2026-09-16T083054-internal-fast-path-000-umbrella.md`
> **Depends on:** nothing. ⛔ An earlier draft declared a dependency on subtopic 001; it does not exist — the chain always produces a plan. The umbrella's Dependencies section carries the measurement.

## Objective

**A small adjustment to an internal `add-framework--*` artefact should not have to pay the full
brainstorm → plan → build → done ceremony.** The four stages become skills that hand off to each
other; the approval collapses into one three-way choice at the brainstorm, one of which runs
unattended to an open PR; the merge preserves the per-F-block history the build produced instead of
flattening it; and the operator sees what a stage is about to produce **before** it produces it —
approving it on the manual path, reading it on the automatic one.

*Copied verbatim from `…-000-umbrella.md`. A SET member does not author its own.*

**Serves the objective by** delivering clauses one, two and four: the four stages become skills that
hand off to each other; the four approvals collapse into one three-way choice at the brainstorm, whose
unattended option runs to an open PR and stops there; and each stage shows what it is about to produce
before it produces it.


## Discovery

- **The double dash is load-bearing in the build.** `scripts/build.js:1262` carries `INTERNAL_COMMAND_NS = /(?<![\w.-])add-framework--[a-z0-9-]+/gi`. That regex is how the build detects a prose mention of an internal command and feeds the graph's undeclared-reference gate. **Renaming to a single dash silently disables that gate** — no error, no warning, just a check that stops finding things.
- **Every existing internal skill uses a single dash**: `add-framework-development`, `add-framework-internal-layer`, `add-framework-product-layer`. Those are knowledge skills. The `--` marks a pipeline stage.
- **The build discovers internal commands by directory.** `scripts/build.js:980` walks `.claude/commands` for `.md`. Moving the four to `.claude/skills/` takes them out of that walk and into the skills one, which changes their graph node kind from `internal/command/*` to `internal/skill/*`.
- **Twenty files name the four**, including `scripts/build.js`, `scripts/graph.js`, `CLAUDE.md`, three agents, seven skills and the four commands themselves.
- **The chain has three of four links.** `HANDS_OFF_TO` runs brainstorm → plan → build. There is **no** build → done edge: `add-framework--build` declares `mention: /add-framework--done`. The product side has the real edge, which shows the gap rather than excusing it.
- **The NO-INVOKE gate lives in one artefact.** `add-framework--brainstorm` lines 37, 42-43 and 648. The other three say nothing about invocation.
- **The claim that the four are already Skill-tool invocable is not repo-verifiable.** The harness lists them; nothing in the tree asserts it. It is the fact that withdrew the mechanical argument for this conversion, so this subtopic reconfirms it before relying on it.

## Context & Motivation

Four approvals sit between a brainstorm and a merge. When every gate comes back green, all four decide nothing — they are round-trips that confirm what the previous stage already established. The user asked for a mode that collapses them into one informed choice, taken at the moment they are already being asked to approve.

Converting the four to skills was chosen for coherence: one artefact kind for the whole pipeline. The mechanical argument for it was withdrawn once the four turned out to be loadable already.

## Problem / Opportunity

1. **The chain stops at the build.** Nothing hands off to the close-out — `add-framework--build` declares `mention: /add-framework--done`, so the graph carries `MENTIONS` and the pipeline cannot reach delivery even on paper. This subtopic creates that link.
2. **Four routine approvals, no new information.** Each stage waits on a human to confirm what its own gates already proved.
3. **The kinds are mixed.** Four pipeline stages are commands; everything else they use is a skill.
4. **The stopping rule written in the umbrella covers only half the gates.** Several stages emit no verdict at all, and on the `bounded` and `spike` paths — the ones this whole umbrella targets — the brainstorm never runs its reviewer, so its entry stage produces nothing to gate on.

## Proposed Solution

**The four become skills at `.claude/skills/add-framework--<stage>/SKILL.md`, keeping the double dash.** The name shape is not cosmetic: it is what `build.js:1262` matches, and it is what separates a pipeline stage from a knowledge skill in a namespace that already holds three of the latter.

**The chain gains its missing link — and the graph gains a way to express one between skills.**

**The runtime handoff needs nothing from the graph.** A stage hands off by the agent loading the next
skill and continuing. That works identically whether the four are commands or skills, and no part of
this conversion touches it. ⛔ **An earlier draft of this document said converting "destroys
`HANDS_OFF_TO`" and left that reading unqualified — it is false about the chain and true only about a
label.**

**What the conversion does force, mechanically:** `scripts/build.js:549-554` maps the declaration
keyword to the edge type, and `usesTargetId` resolves `command:` to `command/<name>` at line 672. Once
the four are skills, a surviving `- command: /add-framework--plan` points at a node that no longer
exists and **fails the build on a dangling reference.** Every such declaration becomes `- skill:`.
That is not optional and it is the whole mechanical consequence.

**What is then lost is a label, and the loss was measured rather than asserted:**

| Consumer | What it does with the type |
|---|---|
| `scripts/build.js:553` | Produces it from a `command:` declaration |
| `scripts/graph.js:42` | Puts it in `DEPENDENCY_TYPES`, **the same Set as `USES_SKILL`, `DISPATCHES`, `RUNS_SCRIPT`, `INJECTS_INTO` and `CONTAINS`** |
| `mcp/engine.mjs:43` | The same Set, same lumping |
| `cli/tests/build-artefact-graph.test.js:102` | One assertion, on a **product** command pair the conversion never touches — it stays green |

**No query distinguishes `HANDS_OFF_TO` from `USES_SKILL`.** Both traverse identically. The distinction
survives only as the edge label a reader sees in `neighbors` output. So after conversion, reading
`neighbors add-framework--brainstorm` would show nine `USES_SKILL` out-edges with no way to tell which
one is the next stage.

**The keyword is therefore a nice-to-have, not a requirement, and this subtopic keeps it on that
footing.** Roughly ten lines: one entry in `USES_EDGE_TYPES` whose edge type is `HANDS_OFF_TO`, and
its resolution in `usesTargetId` by the target's own kind, so a skill can hand off to a skill. The
argument for it is not mechanism — it is that this repository's graph exists to record what relates to
what, and flattening its one pipeline into the same edge type as "loads this for knowledge" gives up
the only thing that says what comes next. `add-framework--build` then declares the hand-off to
`add-framework--done` for the first time.

⛔ **Drop it and nothing breaks.** If the build runs short, declare `- skill:` everywhere, note that the
pipeline is no longer identifiable in the graph, and ship. Nothing downstream is waiting on the label.

**The approval collapses into three options**, presented at the brainstorm's own approval moment:

| Option | What happens |
|---|---|
| Approve, I'll confirm each stage | Today's behaviour. Each stage stops for its own approval |
| Approve, deliver automatically | Every stage hands off without waiting, up to and including the build. **`add-framework--build` STEP 9 then asks whether to open the PR — that is the terminus.** The close-out is invoked separately, with its own approval |
| Keep discussing | No handoff |

**The stopping rule, stated for every kind of gate — this is what the umbrella left to this subtopic:**

| Gate kind | Where | On the automatic path |
|---|---|---|
| Verdict-bearing | `@plan-review-agent`, `@prompt-review-agent` | Continue on `ok` and `fix-then-ok`. **Stop on `blocked`** |
| The four hard stops | Owned by `add-build-ledger`, scoped to executing F-blocks | **Always stop.** None is relaxed |
| A `[STOP]` that only confirms | `add-framework--build` STEP 2 `Design` | **Pass through.** The three-way approval already answered it, and that is the whole point of choosing it |
| **The `[STOP]` that ends the automatic path** | `add-framework--build` STEP 9 `Publish` | ⛔ **Stop. It is the terminus, not a confirmation.** By then the work is written, validated and committed, so the question costs nothing and decides something real — whether this goes out now. The owner settled it: *"na ultima etapa do build perguntar para o usuario se deseja abrir ou não o PR.. o trabalho já está feito"* |
| A `[STOP]` that presents a decision | `add-framework--brainstorm` 6.2 `User decisions required`; `add-framework--plan` STEP 4 **when `## Open` lists items** | **Stop.** A confirmation and a decision are different questions wearing the same marker |
| The `[STOP]` that starts the chain | `add-framework--brainstorm` STEP 7 `Completion & Next Steps` | **This is where the three-way approval is presented.** It is the last thing the brainstorm does and the point a chain would begin, so the choice belongs here rather than at 6.2, which is about blockers |
| `add-framework--plan` STEP 4 **when `## Open` reads `None`** | The confirmation screen the ceremony-rebalance delivery introduced | **Pass through.** It restates extracted decisions and invites a correction, which is the definition of a confirming stop |
| A completion `[HARD STOP]` that only reports | `add-framework--plan` STEP 7 | **Pass through.** It reports and hands off; there is nothing to decide |
| A boolean gate | `add-framework--done` STEP 2 — ledger complete, CI green | **Stop on failure.** A failed boolean is already a stop; the automatic path does not soften it |
| No gate at all | The `bounded` path, where the brainstorm never runs a reviewer | **The three-way approval IS the gate**, chosen with the short design visible. The chain starts from an approval rather than from a verdict |

⛔ **The distinction between a confirming `[STOP]` and a deciding one is the load-bearing judgement here.** Marked wrong in either direction the mode either stops constantly or merges something nobody approved. Each `[STOP]` in the four stages is classified explicitly, in the artefact that carries it, rather than inferred at runtime.

**A stage shows its work before doing it, and that is the fourth clause.** The pattern is already
proven in this repository: `/add-framework--plan`'s STEP 4 stops and presents its analysis, and a
session that ran it found the missing half — the analysis says *what was understood*, and never *what
is about to be written*. So each stage gains a **preview**: the objective in one line, the phases and
what each holds, the order and why it is that order, the risk per artefact, and what is excluded.

⛔ **It adds no second stop.** The stops already exist; the preview becomes what they present. A
delivery whose objective is removing round-trips cannot add one.

⛔ **It is not the artefact in miniature.** It carries strategy and order, never files, validation
levels or F-block detail. Carry those and someone reads the preview instead of the document, and then
it has to be right about things it does not hold.

⛔ **It runs no new analysis.** It is composed from what the stage already produced. A second pass pays
twice for one answer.

⛔ **On the automatic path it prints without waiting — and "pass through" must be written to mean
exactly that.** A confirming stop that passes through still emits its content. Read as "skip", the
preview vanishes in the one mode where the operator has no other window into what is being decided
without them. This is the clause that makes the unattended option legible rather than blind.

**The NO-INVOKE gate is reconciled, not deleted.** It bans a stage invoking the next *on its own initiative*. A chain the user authorised at the three-way approval is not initiative — it is the thing they asked for. The gate gains that sentence, the way it already gained "loading a skill is not invoking a command".

*Alternatives considered:* a single dash to match the other internal skills — rejected, it disables the `build.js:1262` gate. Deleting the NO-INVOKE gate — rejected, it still correctly bans a stage deciding on its own to run the next one. Leaving the four as commands and chaining anyway — this is what the umbrella's withdrawn argument would have supported, and the user chose conversion knowing that.

## Type of Artefact

Architecture. Four artefacts change kind and location, one build script changes how it discovers and resolves them, and twenty files carry references that must follow.

## Scope

### Includes

- Moving the four to `.claude/skills/add-framework--<stage>/SKILL.md`, double dash kept.
- **Authoring the frontmatter each one needs.** No command file carries any — they open on an H1 and a `<!-- uses: -->` block — and every internal `SKILL.md` opens with `name` and `description`. The `description` is the string the Skill-tool picker shows, so it is written deliberately rather than derived from the H1.
- `scripts/build.js`: the `.claude/commands` walk; how `INTERNAL_COMMAND_NS` resolves — the regex shape stays, what it resolves to moves from a command node to a skill node; **and a new declaration keyword in `USES_EDGE_TYPES` carrying `HANDS_OFF_TO`, with its resolution in `usesTargetId`.** Without it the conversion either fails the build on dangling `command:` declarations or silently flattens the pipeline into `USES_SKILL`.
- Creating the `add-framework--build` → `add-framework--done` hand-off.
- The three-option approval at the brainstorm, and the chain it starts.
- **The preview each stage emits before it writes**, and the rule that a confirming stop prints even
  when it does not wait. `add-plan-authoring` owns the shape for the planner's own preview, since it
  already owns that document's structure. **The automatic option's terminus is `add-framework--build` STEP 9's question about opening the PR** — the close-out is never reached unattended.
- The stopping rule above, with every `[STOP]` in the four stages classified as confirming or deciding.
- The NO-INVOKE reconciliation sentence.
- The reference sweep across all twenty files, **`CLAUDE.md` by hand** — it is not a graph node and no gate inspects it.
- Reconfirming, operationally, that the four are Skill-tool dispatchable before relying on it.

### Does NOT Include

- `--sync`, `--release`, `--roadmap`. Not pipeline stages.
- ⛔ **Any product-layer artefact — deferred to its own planning, not dropped.** The same chain and the
  same three-option approval are wanted for `add.brainstorm` → `add.new` → `add.plan` → `add.build`,
  after this set ships, so the product version is designed against a chain that has run. The umbrella's
  Does NOT Include carries the owner's own wording and the second item that rides with it.
- The planless close-out — subtopic 001, **parked and not a dependency.** The chain always produces a plan, so the close-out it reaches is the planned one that already works.
- The merge flag — subtopic 002.
- Changing what any stage **does**. The steps, gates and prohibitions inside each stage are untouched except where a `[STOP]` is classified, the NO-INVOKE sentence lands, or frontmatter is added at the top. ⛔ **Frontmatter is an addition to the file, not a change to the stage** — but it is still a change to the file, and `add-framework-internal-layer` requires every modified artefact to pass all eight ruler items for **its type**, which is now `skill`.
- Removing any hard stop.

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| The skills keep the double dash | `build.js:1262` matches `add-framework--[a-z0-9-]+` to detect prose mentions for the graph gate. A single dash disables that check silently. It also separates a pipeline stage from the three knowledge skills already in `add-framework-*` | ✅ |
| `build.js` changes how it resolves, not what it matches | The regex shape is the contract; only the node kind it resolves to moves | ✅ |
| The automatic path's terminus is the build's `Publish [STOP]` | The merge is never automatic. By STEP 9 the work exists, so the question is cheap and real; the approvals removed are the ones asked before the work exists, where the answer is always "carry on" | ✅ |
| The build → done hand-off is created, not assumed | It does not exist — `mention:` only. The chain cannot end at the close-out until it does | ✅ |
| A confirming `[STOP]` passes through; a deciding one stops | Both carry the same marker today, and the automatic mode is only safe if they are told apart. Each is classified in its own artefact, never inferred | ✅ |
| A stage previews what it is about to produce | The analysis a stage already presents says what was understood, never what is about to be written. The second is what a reader needs to catch wrong scope before it costs a build | ✅ |
| "Pass through" means not waiting, never not printing | Read as "skip", the preview disappears on the automatic path — the mode where the operator has no other view of what is being decided without them | ✅ |
| The NO-INVOKE gate is amended, not removed | It still correctly bans a stage deciding on its own to run the next. What changes is that a user-authorised chain is not that | ✅ |
| Only `bounded` and `architectural` can start the chain | `bounded` runs no reviewer, so the three-way approval is the gate there. ⛔ **`spike` never enters the chain at all** — `add-framework--brainstorm` STEP 7 already refuses to route a spike anywhere, and `2.2.3` calls a spike's follow-up a new request with its own classification. Carrying a spike onward would override a live prohibition this subtopic's own Scope forbids touching | ✅ |
| The Skill-tool claim is reconfirmed before it is relied on | It is not verifiable from the tree and it is the fact this conversion's rationale rests on | ✅ |
| `CLAUDE.md` is swept by hand | It is not a graph node; `add-framework-internal-layer` already requires a grep sweep after any rename | ✅ |
| The graph gains a declaration keyword — **a nice-to-have, measured as such** | No query distinguishes `HANDS_OFF_TO` from `USES_SKILL`: `graph.js:42` and `engine.mjs:43` lump them in one Set, and the only test asserting the type is on an untouched product pair. What is lost without it is the **edge label** that says which out-edge is the next stage. Worth ten lines in a repository whose graph is its own documentation; **not worth blocking on** | ✅ |
| Each converted file gains authored frontmatter | A skill without `name` and `description` is not a skill, and the `description` is what the picker shows — deriving four of them from an H1 would ship four entries nobody can tell apart | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add-framework--brainstorm` | none — entry point | Becomes a skill; gains the three-option approval, the chain start, the NO-INVOKE sentence | Rewrite |
| `add-framework--plan` | `add-framework--brainstorm`, `add-framework--build` (both `HANDS_OFF_TO` today) | Becomes a skill; both in-edges re-declared with the new keyword or they dangle | Rewrite |
| `add-framework--build` | `add-framework--done`, `add-framework--plan`, `building-commands` (all `HANDS_OFF_TO` today) | Becomes a skill; three in-edges re-declared; **creates** the out-edge to done; its `[STOP]`s classified | Rewrite |
| `add-framework--done` | none — entry point | Becomes a skill; its boolean gate is classified | Rewrite |
| `scripts/build.js` | **not a graph node** — top-level `scripts/` produces none | The `.claude/commands` walk and the `INTERNAL_COMMAND_NS` resolution | Edit |
| `CLAUDE.md` | **not a graph node** | Documents the internal command namespace this change moves | Sweep by hand |
| `plan-review-agent`, `plan-readback-agent`, `prompt-review-agent` | dispatched by the four | Each names at least one of the four in prose | Sweep |
| `add-build-ledger`, `add-plan-authoring`, `add-review-discipline`, `add-final-report`, `building-commands`, `add-framework-development`, `add-framework-internal-layer`, `add-framework-product-layer` | various | Each names at least one of the four in prose or in `uses:` | Sweep |

Every `Called by` cell for a graph node is a depth-1 answer. No fragment injects into any internal artefact — the injection system is product-layer only.

⛔ **What the graph cannot answer, and it matters more here than anywhere:** `scripts/build.js`, `scripts/graph.js` and `CLAUDE.md` produce no nodes, so nothing reports them as dependants of the four. All three name them. A rename validated only by the graph gates would leave all three stale and pass.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| One artefact kind across the pipeline | The kind distinction that currently marks which artefacts are entry points |
| A chain that reaches the close-out | A stage boundary where a human necessarily pauses |
| Four routine approvals become one informed choice | The chance to change your mind mid-flight on the automatic path |
| Every `[STOP]` says what kind it is | Four artefacts rewritten at once, the largest diff of the three subtopics |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A single-dash rename slips in and disables the `build.js:1262` gate | Medium | The decision is recorded with its reason, and the regex is quoted in this design so the next reader sees what depends on the shape |
| A `[STOP]` is classified as confirming when it presents a real decision | Medium | Each is classified in its own artefact with a stated reason, so the classification is reviewable rather than implicit. When in doubt it is a deciding stop — the safe fall is toward stopping |
| The reference sweep misses `CLAUDE.md` or a `scripts/` file | High | None is a graph node, so the gates cannot catch it. The sweep is explicit scope, and `add-framework-internal-layer` already requires a grep after any rename |
| The Skill-tool premise turns out false and the chain cannot run | Low | Reconfirmed operationally before anything else in this subtopic is built. If it fails, the chain needs a different mechanism and the conversion loses its remaining rationale |
| The automatic mode merges something the user would have stopped | **Eliminated, not mitigated** | It cannot reach a merge. It terminates at the build's STEP 9 question, and the close-out is a separate, approved invocation |
| ~~Built before 001, the chain stalls at the close-out~~ | **Withdrawn — measured false** | The chain always produces a plan: `architectural` writes one, `bounded` still routes to the planner and writes an intent file, and `spike` never enters the chain. The close-out it reaches is the planned one that works today |

## Next Steps

Run: `/add-framework--plan commands as skills and chain`

Subtopic 002 (`merge not squash`) is ordered first in the umbrella — it edits three lines of a file this subtopic relocates, and editing before the move is cheaper than after.
