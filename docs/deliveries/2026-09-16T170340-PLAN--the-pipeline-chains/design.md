# Brainstorm: A fast path through the internal pipeline

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-16
> **Type:** workflow
> **Layer:** internal, with one product-layer item in subtopic 002

## Objective

**A small adjustment to an internal `add-framework--*` artefact should not have to pay the full
brainstorm → plan → build → done ceremony.** The four stages become skills that hand off to each
other; the approval collapses into one three-way choice at the brainstorm, one of which runs
unattended to an open PR; the merge preserves the per-F-block history the build produced instead of
flattening it; and the operator sees what a stage is about to produce **before** it produces it —
approving it on the manual path, reading it on the automatic one.

⛔ **This section is wider than the one it replaces, and the widening was forced by evidence.** The
earlier text covered only the ceremony and the chain. Run against it, `8.1`'s serves-line test failed
subtopic **002** — and this document's own wording admitted why, introducing that topic with the word
*"Separately"*. The owner then restated the objective with the merge as its third clause. That is the
second of the two readings `8.1` names: **the objective was written narrower than the goal, so the
objective is what changed.** 002 is a member again, on the record rather than by assumption.


## Discovery

- **The classification already travels.** `2026-09-15T224612-PLAN--pipeline-ceremony-rebalance` (live) gave both layers an intent file carrying the brainstorm's `spike` / `bounded` / `architectural` decision into the planner, which now sizes the work at its `2.3` and makes its questionnaire conditional. The sizing this umbrella was going to ask for **already exists** — what is missing is that it stops at the planner.
- **`/add-framework--build` already has a fast path.** Its direct mode takes `[type] [name]` with no plan, no ledger and no F-blocks.
- **`/add-framework--done` has none.** Its ledger gate, its index entry and its archive are all keyed on a plan basename. A direct build cannot be closed out, which was hit in practice closing PR #69 on 2026-09-16.
- **The chain is modeled for three of its four links, and the fourth does not exist.** `HANDS_OFF_TO` runs brainstorm → plan → build. **There is no build → done edge**: `add-framework--build` declares `mention: /add-framework--done`, and the graph carries it as `MENTIONS`. The only edge between that pair runs backwards, `done` → `build`. The product side has the real edge (`add.build` → `add.done`), which makes the internal gap visible rather than excusing it. Two back-edges also exist (build → plan, done → build), so "the framework models what comes next" is true up to the build and false after it.
- **The NO-INVOKE gate exists in exactly one artefact.** `add-framework--brainstorm` carries it (lines 37, 42-43, 648). `add-framework--plan`, `--build` and `--done` are silent on invocation. There is no framework-wide prohibition to overturn.
- **The four internal commands appear to be invocable through the Skill tool**, which the harness lists alongside skills. ⛔ **Nothing in this repository asserts or governs that.** Internal commands are absent from `provider-map.json` by design, and no file in the tree declares which artefacts the Skill tool accepts — this is an observation about the harness, not a fact the graph or the build can confirm. It is load-bearing, because it is the single fact that withdrew the mechanical argument for conversion and left coherence as 003's only rationale. **003 reconfirms it by dispatching one of the four before treating it as settled.**
- **Ceremony in this repo has always been cut from operational evidence.** `close-out-hardening` states it was hardened only after being exercised end to end and failing in four ways found "by running the command, not by reading it". `post-merge-checks-five-where-one-would-do` cut a check only where "a successful merge cannot exist without" the thing it re-proved.

## Context & Motivation

⛔ **The objective is stated once, in `## Objective` above, and this section does not restate it.** An
earlier draft carried a second, narrower copy here — written before that section existed — and the two
then disagreed about whether the merge was part of the goal. One document, two objectives, is how a
set loses track of what it is for.

⛔ **The sizing is NOT the missing piece, and that was the first hypothesis.** `add-framework--brainstorm`
STEP 2.2.2 already classifies `spike` / `bounded` / `architectural`, announces it in one line and stops
so the user can override it; `pipeline-ceremony-rebalance` carried that into the planner. The sizing is
there and the ceremony is still there — **because what costs is not the size of the document, it is that
every stage is a separate command the operator types, with its own approval.**

⛔ **The automatic mode stops at the build's last step, which asks whether to open the PR.** The owner
settled it: *"na ultima etapa do build perguntar para o usuario se deseja abrir ou não o PR.. isso é o
de menos.. o trabalho já está feito."* So `add-framework--build` STEP 9 `Publish [STOP]` **stays a
stop** on the automatic path — it is the terminus, not a confirmation to pass through. Everything
before it runs unattended; the close-out is then invoked with its own approval. **The merge is never
automatic, on any path.**

**Why that stop is cheap and the earlier ones are not:** by STEP 9 the work is written, validated and
committed. The question costs nothing and decides something real — whether this goes out now. The four
approvals this objective removes are the ones asked *before* the work exists, where the answer is
always "yes, carry on".

**What makes this urgent rather than merely nice:** every close-out squashes today, so the per-F-block
history the build was careful to produce — one commit per block, each carrying what was validated and
what was ruled — reaches `main` as a single line. That is the objective's third clause, and an earlier
draft of this document introduced it with the word *"Separately"*, which is exactly why the
serves-line test failed subtopic 002 against the narrower text.

## Problem / Opportunity

1. **Each stage waits on a human for a confirmation that carries no new information.** When every gate
   returns green, the four approvals between brainstorm and merge are four round-trips that decide
   nothing — and four commands the operator has to remember to type in order.
2. **The chain is modeled for three of its four links, and the last one does not exist.** `HANDS_OFF_TO`
   runs brainstorm → plan → build and then stops: `add-framework--build` declares
   `mention: /add-framework--done`. So the pipeline cannot reach delivery even in the graph.
3. **Squash discards the history the build produced.** One commit per F-block, with rulings recorded
   against each, collapses to a single line on `main`.

⛔ **"A close-out that accepts work with no plan" is NOT one of these, and an earlier draft of this
document had it as the first.** See Dependencies & Relationships — the chain always produces a plan.

## Proposed Solution

Two separable changes, in the order the Decomposition Map gives.

**A merge that preserves history**, by replacing the hardcoded `--squash` in both close-out commands.
Small, independent, and it lands on a file the other change later moves — so it is cheaper first.

**The four internal commands become skills, and chain**, with the approval collapsed into a three-way
choice at the brainstorm's own approval moment, and the automatic option terminating at PR open.

**A third design exists and is parked**: a close-out that accepts work with no plan. It is a real gap
— `/add-framework--build`'s direct mode dead-ends at the close-out, which was hit closing PR #69 — but
it is not on this objective's path, because the chain never produces planless work.

*Alternatives considered:* a fifth `framework--quick` command doing investigate → branch → adjust →
merge on its own — rejected because it duplicates the build's direct mode and the close-out, producing
two places that merge and two that index, which then diverge. Extracting each command's core into a
skill while keeping the command as the entry point (the shape shipped for `add.new` in the
pipeline-ceremony-rebalance delivery) — rejected by the user in favour of full conversion, after the
mechanical argument for it was withdrawn. Fixing the sizing at the brainstorm and stopping there —
rejected on measurement: it is already there.

## Type of Artefact

Workflow. Four artefacts change kind, one product command changes one flag, and the close-out gains a second entry path.

## Scope

### Includes

- A planless close-out path in `add-framework--done`: what replaces the ledger gate, what the index entry's `id` becomes, and what the archive holds when there is no plan, no ledger and no design document.
- `--squash` → `--merge` in `.claude/commands/add-framework--done.md` and `framwork/.codeadd/commands/add.done.md`.
- Converting `add-framework--brainstorm`, `--plan`, `--build` and `--done` from commands to skills, and every declaration and prose reference that names them.
- The handoff chain between the four, and the three-way approval that starts it.
- The automatic mode's stopping rule.

### Does NOT Include

- The other three internal commands — `--sync`, `--release`, `--roadmap`. They are not in the pipeline.
- ⛔ **The product-layer pipeline — deferred, not dropped, and this is where that is recorded.** The
  same shape is wanted for `add.brainstorm` → `add.new` → `add.plan` → `add.build`, with the same
  three-option approval, in the owner's words: *"no framework será trabalhado em add.new, mas não
  agora, no próximo planejamento que irei criar baseado neste trabalho interno."* **It waits on this
  set shipping first**, so the product version is designed against a chain that has run rather than
  one that was reasoned about — the same order this repository used for the close-out, which was
  hardened from four failures found by running it.
  - ⛔ **A second item rides with it:** `## Objective` exists in the internal design and plan templates
    and **not** in the product schemas (`add-doc-schemas`, `add.brainstorm`, `add.new`). That was
    deferred by the same decision, in the same words, and belongs to the same follow-up.
  - ⛔ **The exception is `add.done`'s merge flag**, which subtopic 002 changes now. It is product, it
    is deliberate, and its cost — every installed user gets merge commits by default — was stated and
    accepted rather than discovered.
- `done.sh`'s local `git merge --squash`, which is a different operation in the product layer.
- Changing which merge methods the GitHub repository allows: it already permits `merge`, `squash` and `rebase`.
- The `[STOP]` convention itself. A skill may carry it; nothing about the kind change removes it.

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| The automatic mode is a third option at the brainstorm's approval, not a flag | A flag is a mode you forget you enabled; an option at the approval moment is informed consent, taken once, knowing what is being approved | ✅ |
| The automatic mode runs while every **verdict-bearing** gate returns `ok` or `fix-then-ok`, and **stops on `blocked` or a hard stop** | Not a weaker approval model — the same gates, with the routine confirmations removed. In the session that produced this design, that rule would have stopped four times, and stopping was right each time | ✅ |
| The rule above covers only the gates that emit a verdict. **003 states how the rest participate** | Several stages emit no verdict at all: `add-framework--build` STEP 2 `Design [STOP]` and STEP 9 `Publish [STOP]` are approvals, `add-framework--done` STEP 2 is a boolean gate, and on the `bounded` and `spike` paths — the ones this fast path targets — `add-framework--brainstorm` never runs its reviewer, so its entry stage produces no verdict to gate on. A rule written only in verdict vocabulary would pass straight through every one of them | ✅ |
| The four commands become skills | Chosen with the mechanical argument withdrawn: they were already loadable, so conversion buys no capability. The user took it for coherence, knowing that | ✅ |
| Skills keep slash invocation | The Skill tool accepts `/<name>`, so nothing about the conversion removes how these are typed today | ✅ |
| `--squash` → `--merge` in **both** close-out commands | The user's preference for preserved history, applied to the product command too, accepting that it becomes every installed user's default | ✅ |
| The GitHub repository needs no change | All three merge methods are already allowed; only the commands force one | ✅ |
| Three subtopics, refined in the Decomposition Map's order | The close-out gap is what makes a fast adjustment completable; conversion is decided after the fast path has been used, per this repo's own precedent that ceremony is cut from operational evidence | ✅ |
| `add.done` gets the flag changed rather than a configurable merge method | Simpler, one line each. The cost — imposing one history policy on every installed user — was stated and accepted | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add-framework--brainstorm` | none — entry point, zero dependants | Becomes a skill; gains the three-way approval and the chain's first handoff; its NO-INVOKE gate is the only one that has to be reconciled | 003 |
| `add-framework--plan` | `add-framework--brainstorm`, `add-framework--build` (both `HANDS_OFF_TO`) | Becomes a skill; both edges change kind | 003 |
| `add-framework--build` | `add-framework--done`, `add-framework--plan`, `building-commands` (all `HANDS_OFF_TO`) | Becomes a skill; three edges change kind | 003 |
| `add-framework--done` | none — entry point, zero dependants | Gains the planless path (001), the merge flag (002), becomes a skill (003) | 001, 002, 003 |
| `add.done` (product) | `add`, `add.build`, `add.plan`, `add.plan-to-ready`, `add.pull-request`, `add.review`, `fragments/docs-pruning/add.done.md` (INJECTS_INTO), `fragments/qa-pipeline/add.review.md`, `plugins/gitnexus/fragments/add.done.md` (INJECTS_INTO), `add-doc-schemas`, `add-qa` | One flag changes | 002 |
| `add-plan-authoring` | `add-framework--build`, `add-framework--done`, `add-framework--plan` | Owns The Delivered Home, which a planless close-out has to answer for | 001 |
| `add-build-ledger` | `add-framework--build`, `add-framework--done` | Owns the ledger the close-out's first gate reads; a planless delivery has none | 001 |

Every `Called by` cell is a depth-1 graph answer. The two fragments that inject into `add.done` were queried separately, as the fragment rule requires: `docs-pruning` declares no target of its own and `gitnexus` declares only `add-gitnexus`, so neither adds a dispatch this design must account for.

⛔ **What the graph cannot answer here:** `CLAUDE.md` is not a node, and it documents the internal layer's command namespace. The conversion in 003 changes that namespace, so `CLAUDE.md` must be swept by hand — the graph gates will not catch a stale pointer there.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A small adjustment reaches `main` instead of dead-ending at the close-out | A second close-out entry path to keep correct |
| Four routine approvals collapse into one informed choice | The chance to change your mind at a stage boundary, on the automatic path |
| Per-F-block history survives on `main` | A linear `main`, and a longer log |
| One artefact kind for the whole pipeline | The command/skill distinction that currently marks which artefacts are pipeline entry points |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The planless close-out writes a weaker index entry than a planned one | High | 001 decides the `id` source and the archive members explicitly; `product-close-out-parity`'s invariants are the floor it must clear, and 001 reconciles the plan's count with its umbrella's before using them |
| The automatic mode merges something the user would have stopped | Medium | It stops on `blocked` and on every hard stop. ⛔ `add-build-ledger`'s four hard stops are scoped by its own frontmatter to executing a plan's F-blocks, so they do not reach the brainstorm's or the close-out's approvals — 003 states what stops there, and the boolean `[STOP]` gates are the largest part of that gap |
| Conversion leaves a stale reference somewhere the graph cannot see | High | `CLAUDE.md` is not a node, and neither is any top-level `scripts/` file. 003 carries a by-hand grep sweep, which `add-framework-internal-layer` already requires after any rename |
| `--merge` surprises an installed user whose repository disallows merge commits | Medium | `gh pr merge --merge` fails loudly rather than silently choosing another method, so the failure is visible at the close-out rather than in the history |
| Converting four artefacts at once is the largest diff of the three subtopics | Certain | It is last in the order, after the fast path has been used and the conversion can be judged against real experience |

## Decomposition Map

| Order | Subtopic | Design Path | Serves the objective by | Purpose |
|---|----------|-------------|-------------------------|---------|
| **1** | Merge without squash | the SET form's `-002-merge-not-squash.md` member | **the third clause** — the merge preserves the per-F-block history instead of flattening it | `--squash` → `--merge` in both close-out commands, plus the recovery-path diff that a merge commit breaks. First because it is small, independent, and lands on a file 003 later moves |
| **2** | Commands become skills, and chain | the SET form's `-003-commands-as-skills-and-chain.md` member | **clauses one, two and four** — the four stages become skills that hand off; the approval collapses into one three-way choice with an unattended route to an open PR; and the operator sees what a stage is about to produce before it produces it | The kind conversion, the handoff chain including the missing last link, the three-way approval, and the automatic mode terminating at the build's PR question |
| **parked** | Close-out without a plan | the SET form's `-001-planless-close-out.md` member | ⛔ **nothing — and that is why it is parked.** The chain always produces a plan, so a close-out that accepts planless work advances no clause of the objective. It fixes a real gap in `/add-framework--build`'s direct mode, which this objective does not reach | Refined and planned already; the plan was deleted at its own close-out and the design stays for whoever needs the direct mode |

Every row reuses the umbrella's timestamp verbatim — that is what keeps the set grouped in the directory.

⛔ **001 was first in an earlier draft of this map, on a dependency that does not exist.** The reasoning
below replaces it. Its design and its plan are still correct about their own subject; only their
position in this set was wrong.


## Dependencies & Relationships

**002 and 003 are independent of each other.** Either ships alone. 002 is ordered first only because it
edits three lines of a file 003 relocates, and editing before the move is cheaper than after.

⛔ **003 does NOT depend on 001, and an earlier draft of this document asserted that it did.** The
claim was that *"creating [the build → done hand-off] before 001 lands produces a chain whose final
stage refuses the work the chain was built to carry."* **Measured, that is false — the chain always
produces a plan:**

| Path at the brainstorm's 2.2.2 | What reaches the close-out |
|---|---|
| `architectural` | A design document, then a full plan. Planned work |
| `bounded` | No design document, but STEP 7 **still routes to `/add-framework--plan`** and writes the intent file. A short plan. Planned work |
| `spike` | **Never enters the chain.** STEP 7 refuses to route it, and 2.2.3 calls a spike's follow-up a new request with its own classification |

So every delivery the chain carries has a plan basename, a ledger and an Execution Order — exactly
what `/add-framework--done` already accepts. **The planless gap belongs to `/add-framework--build`'s
direct mode, which the chain does not use.**

**That fabricated dependency is what put 001 first**, and it cost a full refinement, a plan, a review
cycle and a rework before anyone read the two documents side by side. It is recorded here rather than
quietly deleted, because the failure was in the reasoning, not in 001.

**003 carries two questions this umbrella deliberately leaves to it:** what the converted skills are
named — `add-framework--plan` keeps its double dash or becomes `add-framework-plan`, matching the
existing internal skills — and how the NO-INVOKE gate in the brainstorm is reconciled with a chain that
loads the next stage. Both are subtopic-level decisions, not gaps in this document.


## Next Steps

This is an umbrella. It does not go to the planner — its subtopics do, one at a time.

**002 is already refined** (`Status: final`). Run it:

`/add-framework--plan merge not squash`

**003 is refined and needs one correction first** — its automatic mode must terminate at PR open, and
its header still declares a dependency on 001. Both are noted in that document.
