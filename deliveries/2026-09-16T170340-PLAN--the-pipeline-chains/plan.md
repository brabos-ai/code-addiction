# Plan: The pipeline chains — four skills, one approval, and a merge that keeps its history

> **Status:** implemented
> **Layers:** internal and product
> **Type:** cross-cutting
> **Created:** 2026-09-16

---

## Objective

**A small adjustment to an internal `add-framework--*` artefact should not have to pay the full
brainstorm → plan → build → done ceremony.** The four stages become skills that hand off to each
other; the approval collapses into one three-way choice at the brainstorm, one of which runs
unattended to an open PR; the merge preserves the per-F-block history the build produced instead of
flattening it; and the operator sees what a stage is about to produce **before** it produces it —
approving it on the manual path, reading it on the automatic one.

*Copied verbatim from `…-000-umbrella.md`.*

**When this build is done:** typing `/add-framework--brainstorm` once can carry an idea through
design, plan, build and an open PR without the operator invoking three more commands — and the merge
that lands it leaves every F-block commit readable on `main`.

## Context

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-16T083054-internal-fast-path-000-umbrella.md` | The objective, the two-member Decomposition Map, and why the product layer is deferred |
| `docs/brainstorming/2026-09-16T083054-internal-fast-path-002-merge-not-squash.md` | The five flag sites, the recovery-path diff that a merge commit breaks, and the accepted cost of imposing one history policy on installed users |
| `docs/brainstorming/2026-09-16T083054-internal-fast-path-003-commands-as-skills-and-chain.md` | The conversion, the declaration keyword, the three-option approval, and the stopping rule per gate kind |
| `docs/brainstorming/2026-09-16T083054-internal-fast-path-intent.md` | The set-level decisions. ⛔ **Neither member wrote an intent file of its own**, though that document says each would. The decisions are in the two designs; nothing is lost, but the contract it declared was not met |

**This plan carries BOTH members of the set.** Splitting them was considered and rejected: subtopic
002 edits three lines of `add-framework--done.md`, which 003 **relocates** to `.claude/skills/`. In two
plans that file is edited and then moved. In one, the execution order puts the edit before the move,
in one ledger. **The reason is ordering, not size.**

**The audit at 3.4 ran on three artefacts and returned `fix-then-ok` on each**, with ten failed ruler
items between them — two of them `high`. Each becomes an F-block naming its item number.

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 and emits no warning absent from the baseline
  (CLAUDE.md, Pipeline). **Baseline to measure at the branch point, before F1**
- An internal-only F-block proves it stayed in its lane with `git status --porcelain framwork/`
  returning empty (`add-framework-internal-layer`, Validation)
- Every `[product]` F-block runs `cd cli && npx vitest run --no-file-parallelism` and reads the result
  — *"Serial is not a preference"*, *"a mental test is NOT evidence"* (`add-framework-product-layer`)
- **Every modified `.md` artefact passes all eight ruler items FOR ITS TYPE**
  (`add-framework-internal-layer`, Coherence). ⛔ **The type changes from `command` to `skill` in this
  delivery**, which is why the ruler fixes are not deferrable: shipping a converted skill that fails
  its own layer's gate is not an option the layer skill leaves open
- A removal or rename fixes **every** dependent in the SAME F-block, or `build.js` fails on a dangling
  declaration (`add-framework-internal-layer`, Before a Removal or a Rename)
- `gh pr merge` run non-interactively **errors without a method flag** — `--merge, --rebase, or
  --squash required when not running interactively`. The flag is never simply dropped (design 002)

## Problem

1. **The chain is modeled for three of its four links and stops before delivery.** `HANDS_OFF_TO` runs
   brainstorm → plan → build; `add-framework--build` declares `mention: /add-framework--done`, so the
   graph carries `MENTIONS` and the pipeline cannot reach the close-out even on paper.
2. **Four approvals sit between a brainstorm and a merge, and when every gate is green all four decide
   nothing.** Four round-trips, and four commands the operator retypes in order.
3. **The kinds are mixed.** Four pipeline stages are commands; the eight artefacts each one loads are
   skills.
4. **Every close-out squashes.** One commit per F-block, each carrying what was validated and what was
   ruled, collapses to a single line on `main`.
5. **Ten ruler items fail across the three audited stages**, two of them `high` — and both `high` ones
   are in `add-framework--plan`'s STEP 4.0, the step the chain's second stage stops at.

## Proposal

Four phases, in the order the Execution Order gives.

**The merge keeps its history first**, because it edits three lines of a file the conversion later
relocates, and editing before a move is cheaper than after.

**Then the conversion.** Every `- command:` declaration naming one of the four becomes `- skill:`, or
the build fails on a dangling reference — that half is forced. The other half is a declaration keyword
carrying `HANDS_OFF_TO` so a skill can hand off to a skill, **and it is a prerequisite of the build →
done link this delivery creates, not an optional extra.** What is optional is the *outcome*: drop the
keyword and the pipeline flattens into `USES_SKILL`, which is a coherent delivery with a different
end state — and taking it means editing F8 and L2.3 in the same run, never skipping a block.

⛔ **The runtime handoff needs nothing from the graph, and an earlier reading of this said otherwise.**
A stage hands off by the agent loading the next skill and continuing; that is identical for a command
and a skill. Measured: `graph.js:42` and `mcp/engine.mjs:43` put `HANDS_OFF_TO` in the same
`DEPENDENCY_TYPES` Set as `USES_SKILL`, and the only test asserting the type is on a product pair this
change never touches. **What is lost without the keyword is an edge label, not a capability.**

**Then the approval**, collapsed into three options at the brainstorm, with every `[STOP]` in the four
stages classified — and the classification is **by state, not by marker**, because at least one is
both kinds depending on the state it runs in.

**Then the ruler**, on the artefacts' final paths.

## Current State

| Artefact | Dependants at depth 1 | Risk | Today |
|---|---|---|---|
| `add.done` **product** | **11** — `add`, `add.build`, `add.plan`, `add.plan-to-ready`, `add.pull-request`, `add.review`, two fragments by `INJECTS_INTO`, `fragments/qa-pipeline/add.review.md`, `add-doc-schemas`, `add-qa` | **HIGH** | `--squash` at two sites; recovery path assumes a squash commit |
| `add-framework--build` | **3** — `add-framework--done`, `--plan`, `building-commands` | **HIGH** | A command; `mention:` to done, no hand-off; two `[STOP]`s, one of them two kinds |
| `add-framework--plan` | **2** — `add-framework--brainstorm`, `--build` | **MEDIUM** | A command; STEP 4.0's second row names one section of five |
| `add-framework--brainstorm` | **0** — entry point | **LOW** | A command; STEP 7 ends with a text-only handoff and no approval options |
| `add-framework--done` | **0** — entry point | **LOW** | A command; `--squash` at three sites; `## Rules` has one ALWAYS and no NEVER |
| `scripts/build.js`, `CLAUDE.md` | **not graph nodes** | — | The walk, `INTERNAL_COMMAND_NS`, `USES_EDGE_TYPES`; the namespace documentation |

**Delivery index.** Internal: `--brainstorm` one `live` (`objective-as-anchor`), `--build` two `live`,
`--done` three `live` and one `changed`, `--plan` none. Product: `add.done` one `live`
(`product-close-out-parity`). ⛔ **Nothing `gone` or `superseded` anywhere** — no prior attempt at a
command→skill conversion or a merge-method change was tried and dropped.

⛔ **The two fragments injecting into `add.done` were queried separately**, as the fragment rule
requires: `docs-pruning` declares no target of its own and `gitnexus` declares only `add-gitnexus`.
Neither touches the merge step.

## Scope

### Includes

#### Phase 1 — the merge keeps its history

- **F1** [internal] — `.claude/commands/add-framework--done.md`: `--squash` → `--merge` at lines 39,
  466 and 468, each with a line saying the method is deliberate. It must NOT touch `done.sh`.
  - **Produces:** the internal close-out merges without squashing
- **F2** [product] — `framwork/.codeadd/commands/add.done.md`: the same at lines 879 and 882.
  ⛔ **This imposes merge commits on every installed user**, including those whose repository policy is
  squash-only. The cost was stated and accepted in design 002; the alternative — a `mergeMethod` field
  in the manifest — was rejected as more machinery than the change is worth.
- **F3** [internal] — `.claude/commands/add-framework--done.md` `2.4`: the recovery path reconstructs an
  out-of-band delivery's file list with `git show --name-status <merge-commit>` and states *"the squash
  IS the delivery"*. ⛔ **True only of a squash commit.** A merge commit has two parents, so `git show`
  on it produces a combined diff — frequently smaller, sometimes empty — and the recovery path would
  write a wrong or empty file list into the index and the changelog, silently. Becomes a first-parent
  diff, and line 446's *"rides the squash merge to `main`"* is rewritten.
  - **Consumes:** the internal close-out merges without squashing (F1)
- **F4** [product] — `framwork/.codeadd/commands/add.done.md` lines 207-216: the same recovery fix.
  - **Consumes:** the internal close-out merges without squashing (F1)
- **F5** [product] — `cli/tests/product-close-out-parity.test.js:371`: the ordered-token array pins the
  literal `'gh pr merge --squash'` and goes red on F2. Update it, and **grep `cli/tests/` and
  `framwork/.codeadd/scripts/tests/` for any other pinned occurrence** rather than trusting one line
  number — the graph does not model test files, and the last delivery found five sites where a plan
  named two.

- **F23** [product] — **`framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md`: the
  delivery-commit derivation justifies itself with the squash, and F2 removes the squash.**
  ⛔ **Found by the plan review, not by this plan, and the guard that should have caught it cannot.**
  Two paragraphs go false:
  - *"the merge squashes that branch, so the commit that introduced an entry's line IS the commit that
    delivered it — by construction"*. Under `--merge` the branch commit reaches `main` with its own
    SHA, so the pickaxe returns **the branch commit**, not the merge commit. The mechanism still
    answers; the stated reason no longer holds.
  - *"`commits` … holds the BRANCH shas, and a squash makes every one of them unreachable from the
    default branch. Measured … intersect `git log` on `main` at **zero**, for every delivery already
    merged."* Under `--merge` that intersection stops being zero and the measurement becomes false.
  - ⛔ **`cli/tests/impact-question-touched-by.test.js` L60-67 asserts a match on `unreachable|discard`
    — it greps for the word and stays GREEN whatever the paragraph claims.** It is false confidence,
    not a guard, and L4.1 would never have gone RED on this.
  - **Rewrite both paragraphs for the asymmetry F2 creates**: the PR route merges and `done.sh`'s local
    route still squashes, so the contract must state the derivation for both rather than assuming one.
    **And replace the word-grep assertion with one that exercises the derivation** — L4.6.
  - **Consumes:** the internal close-out merges without squashing (F1)
  - ⛔ **Numbered F23 and executed in Phase 1.** It was added after the other twenty-two were numbered;
    renumbering twenty-two blocks for contiguity would rewrite every coverage-map row and every
    execution-order entry for a cosmetic gain. **The Execution Order below is authoritative, not the
    numeric order.**

#### Phase 2 — the conversion

- **F6** [internal] — `scripts/build.js`: the `.claude/commands` walk (L980) and how
  `INTERNAL_COMMAND_NS` (L1262) resolves — the regex shape stays, what it resolves to moves from a
  command node to a skill node. ⛔ **A single dash silently disables that gate**, so the double dash is
  kept. This block is a no-op until F8 moves the files, and that is intentional.
  - **Produces:** the build discovers the four pipeline stages as skills
- **F7** [internal] — `scripts/build.js` `USES_EDGE_TYPES` (L549-554) and `usesTargetId` (L672): a
  declaration keyword whose edge type is `HANDS_OFF_TO` and whose target resolves by the target's own
  kind, so a skill can hand off to a skill.
  - ⛔ **It is a hard prerequisite of the hand-off F8 creates, and an earlier draft of this plan called
    it "optional" while F8 depended on it.** Without F7 no declaration produces `HANDS_OFF_TO` between
    two skills, so F8 cannot declare the build → done hand-off and L2.3 stays permanently RED. **The
    plan review caught the contradiction; it is recorded rather than quietly corrected.**
  - **What IS optional is the outcome, and dropping it is a stated fallback.** Skip F7 and the delivery
    is still coherent: F8 declares `- skill:` everywhere, the pipeline flattens into `USES_SKILL`, the
    graph stops being able to say which out-edge is the next stage, **and L2.3 changes to assert a
    `USES_SKILL` edge from `add-framework--build` to `add-framework--done` where none exists today.**
    ⛔ **Taking that fallback means editing F8's text and L2.3 in the same run, never silently skipping
    a block** — the runtime chain is unaffected either way, which is the whole reason this is a
    fallback rather than a failure.
  - **Produces:** a skill can declare a hand-off to another skill
- **F8** [internal] — **the move, and every reference to it, in ONE block.** The four go to
  `.claude/skills/add-framework--<stage>/SKILL.md`, double dash kept, each gaining authored
  frontmatter (`name` and `description` — no command file carries any today, and the `description` is
  the string the Skill-tool picker shows, so four derived from an H1 would ship four entries nobody can
  tell apart). **Every `- command:` declaration naming one of the four becomes `- skill:`, and every
  prose reference follows, across all twenty files.** `add-framework--build` declares the hand-off to
  `add-framework--done` for the first time.
  - ⛔ **This cannot be split into four blocks.** `add-framework-internal-layer` requires every
    dependent of a rename to be fixed in the SAME F-block, or `build.js` fails on a dangling
    declaration. Moving one stage at a time leaves the other three declaring a node that no longer
    exists. The block is large because the gate makes it so.
  - **Consumes:** the build discovers the four pipeline stages as skills (F6)
  - **Consumes:** a skill can declare a hand-off to another skill (F7)
- **F9** [internal] — `CLAUDE.md`: the internal-command namespace table and every prose pointer.
  ⛔ **Not a graph node, so no gate inspects it** — this is a by-hand grep sweep, and
  `add-framework-internal-layer` already requires one after any rename. It must NOT touch the generated
  inventory block.

#### Phase 3 — one approval, and every stop classified

- **F10** [internal] — the brainstorm's STEP 7: the three-option approval, presented through the
  provider's structured-question tool.
  | Option | What happens |
  |---|---|
  | Approve, I confirm each stage | Today's behaviour |
  | Approve, deliver automatically | Every stage hands off without waiting, **up to and including the build**. `add-framework--build` STEP 9 then asks whether to open the PR — **that is the terminus** |
  | Keep discussing | No handoff |
  - ⛔ **The close-out is never reached unattended.** The merge is approved on every path.
- **F11** [internal] — the stopping rule, with every `[STOP]` in the four stages classified in the
  artefact that carries it. ⛔ **Classified by STATE, not by marker — the audit proved one marker is
  both kinds.** `add-framework--build` STEP 9 is *deciding* on the first push to a branch with no PR,
  and *confirming* once a PR already exists, and the text names only the hard-stop framing.
  - **Consumes:** the three-option approval and the automatic path it starts (F10)
- **F12** [internal] — the NO-INVOKE gate in the brainstorm (lines 37, 42-43, 648): it bans a stage
  invoking the next **on its own initiative**. A chain the user authorised at F10's approval is not
  initiative. The gate gains that sentence. It must NOT be deleted — it still correctly bans a stage
  deciding on its own to run the next one.
- **F13** [internal] — **the preview before the plan is written — the objective's FOURTH clause.**
  ⛔ **The plan review found this block traceable to no clause and the objective was widened rather
  than the block dropped** — the same second reading `8.1` names, and the second time this set has
  taken it. `add-plan-authoring` gains the
  shape; `/add-framework--plan` emits it at the END of STEP 4, inside the stop that already exists.
  - ⛔ **It adds no second stop.** STEP 4 already stops. Adding another to a delivery whose objective
    is removing round-trips would contradict the delivery.
  - ⛔ **It is not the plan in miniature.** It carries the objective in one line, the phases and what
    each includes, the order and **why it is that order**, risk per artefact, and what is excluded. It
    does not carry files, validation levels or F-block detail — if it did, someone would read it
    instead of the plan.
  - ⛔ **It runs no new analysis.** It is composed from what STEP 3 already produced — the graph, the
    index, the audits. A second analysis pass would pay twice for one answer.
- **F14** [internal] — **"pass through" means not waiting, never not printing.** A `[STOP]` classified
  as confirming still emits its content on the automatic path. ⛔ Without this, F13's preview is
  silently skipped in exactly the mode where the operator most needs to see what is being decided
  without them.
  - **Consumes:** the preview shape and the step that emits it (F13)

#### Phase 4 — the ruler items from the 3.4 audit

⛔ **Every line number below is audit-time evidence, not a coordinate. LOCATE BY THE QUOTED TEXT.** By
the time Phase 4 runs, F8 has moved these files to `.claude/skills/` and added frontmatter at the top
of each, shifting every line by an offset — and Phase 3 has already rewritten several of the exact
sections cited here (F11 edits `add-framework--build`'s STEP 9, which F18 is about). **F5 already
carries this instruction for its own reason; these eight need it for a different one.**


- **F15** [internal] — **item 5, Single owner.** `add-framework--build` (L155-161) and
  `add-framework--done` (L120-124) both restate `add-plan-authoring`'s Argument Resolution almost
  verbatim; `--done` additionally points at `--build`, a fellow duplicator, instead of at the owner.
  `/add-framework--plan` already delegates correctly for the identical mechanism. **One F-block, both
  sites** — fixing one copy leaves the pattern standing.
- **F16** [internal] — **item 5, Single owner.** `### Agent Dispatch Rules` exists three times:
  `add-framework--plan` (3 items, no Complexity), `--build` (5) and `--brainstorm` (5). **They have
  already drifted.** Delegate to one owner — `building-commands/references/agent-dispatch.md` or
  `add-plan-authoring`'s Review Dispatch — instead of keeping a third independent copy.
- **F17** [internal] — **item 4, Contract with the neighbours.** `add-framework--build` L468 writes a
  `GRAPH:` line into the ledger, but `add-build-ledger` enumerates only three line shapes —
  `F<n>: complete`, `F<n>: Ruling:` and `REVIEW: complete`. The owning skill's format does not know
  about what the command writes. Add the fourth shape to the owner.
- **F18** [internal] — **item 6, No ambiguity.** `add-framework--build` L557 frames STEP 9 as
  *"one of the four hard stops. ASK"*; L582-583 instructs skipping the ask once a PR exists. The two
  framings are never reconciled. State both behaviours at the gate declaration.
- **F19** [internal] — **item 6, No ambiguity.** `add-framework--done` L476 reads *"Run only if… STEP
  7's merge succeeded"*, but 2.4's table (L245) says STEP 7 is *"Skipped. Already merged"* on the
  recovery path. The file already carries the correct carve-out for the analogous case at L74-76 —
  *"the condition is the entry's existence, never which STEP wrote it"* — and nothing equivalent here.
- **F20** [internal] — **items 6 and 8, `high`.** `add-framework--plan` STEP 4.0's table: the
  `Reads None` row states what happens to all five sections; the `Lists items` row states only what
  happens to section 3. **A reader holding only this file cannot execute that branch** — it cannot tell
  whether sections 1, 2, 4 and 5 run in full, run as a confirmation screen, or are skipped.
  ⛔ **Two items, one fix, one block:** the audit found the same gap under both numbers, and splitting
  it would produce two commits editing one table row.
- **F21** [internal] — **item 3, Mandatory form.** `add-framework--done`'s `## Rules` carries one
  `ALWAYS:` bullet and **no `NEVER:` heading at all**. Every sibling has both: `--build` 9/5,
  `--brainstorm` 12/13, `--plan` 2/7, `--release` 6/8, `--roadmap` 7/5, `--sync` 8/7. Populate from the
  business knowledge the command carries outside its STEP order, and **only that** — a rule derivable
  from the STEPs is the redundancy `building-commands` tells you to remove.
- **F22** [internal] — **item 7, No filler.** `add-framework--plan`'s `## Rules` L458, L461 and L464
  duplicate prohibitions already stated at L209, L60-62 and L43-44. None sits at a fresh decision
  point. Remove them.

### Does NOT Include (important!)

- **The product-layer pipeline.** `add.brainstorm` → `add.new` → `add.plan` → `add.build`, with the
  same three-option approval, plus `## Objective` in the product doc schemas. Deferred by the owner to
  its own planning, **after this set ships**, so the product version is designed against a chain that
  has run. The one product work here is `add.done`'s merge flag and its recovery path.
- `framwork/.codeadd/scripts/done.sh` lines 598-602. `git merge --squash` there is a local branch merge
  with no PR and no flag to flip. ⛔ **This leaves the product close-out asymmetric and says so:** on any
  install where the PR route is not taken, `add.done` still squashes the history this change exists to
  preserve.
- `--sync`, `--release`, `--roadmap`. Not pipeline stages.
- Subtopic 001, the planless close-out. Parked: it serves no clause of the objective.
- Changing which merge methods the GitHub repository allows — it already permits all three.
- Changing what any stage **does**, beyond the `[STOP]` classifications, the NO-INVOKE sentence, F13's
  preview and the ruler fixes.
- The generated inventory block in `CLAUDE.md`.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| One plan or two? | **One** | 002 edits three lines of a file 003 relocates. Two plans edit then move. Ordering, not size |
| Does the conversion break the handoff? | **No** | The runtime handoff is the agent loading the next skill. Measured: no query distinguishes `HANDS_OFF_TO` from `USES_SKILL` — both sit in one `Set` at `graph.js:42` and `engine.mjs:43` |
| Is the declaration keyword required? | **No — optional, and marked** | What is lost without it is the edge label saying which out-edge is the next stage. Ten lines. Worth it in a repo whose graph is its own documentation; not worth blocking on |
| Single dash or double? | **Double** | `build.js:1262` matches `add-framework--[a-z0-9-]+` to detect prose mentions for the graph gate. A single dash disables that check **silently** |
| Where does the automatic path stop? | **The build's STEP 9 question about opening the PR** | The owner settled it: *"na ultima etapa do build perguntar… o trabalho já está feito."* The merge is never automatic |
| How is a `[STOP]` classified? | **By state, not by marker** | The 3.4 audit proved `add-framework--build` STEP 9 is deciding on the first push and confirming once a PR exists. A per-marker classification cannot express that |
| Can the four be moved one at a time? | **No** | `add-framework-internal-layer` requires every dependent of a rename fixed in the same F-block. One at a time leaves three dangling declarations |
| Are the ruler fixes deferrable? | **No** | The layer skill requires every modified artefact to pass all eight items **for its type**, and the type becomes `skill` here. Deferring ships converted skills that fail their own gate |
| Does the preview add a stop? | **No** | STEP 4 already stops. A second stop in a delivery about removing round-trips would contradict it |
| `add.done`'s flag now or with the product work? | **Now** | It is one line in each of two places and the design already settled it. The cost — merge commits become every installed user's default — was stated and accepted |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One typed command can carry an idea to an open PR | The chance to change course at a stage boundary on the automatic path |
| Per-F-block history survives on `main`, rulings attributable per commit | A linear `main` and a shorter log |
| One artefact kind across the pipeline | The kind distinction that currently marks which artefacts are entry points |
| Ten failing ruler items stop failing | The largest single diff of this effort, in F8, which the rename gate forces |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| F8 is too large to review | **Certain, and forced** | The rename gate requires it. Its diff is mechanical — a move plus a declaration keyword swap — and L2.2 asserts the end state by node kind rather than by reading the diff |
| A single-dash rename slips in and disables the `build.js:1262` gate | Medium | The decision is recorded with the regex quoted. L3.1 asserts the double dash survives in all four paths |
| The automatic mode merges something the operator would have stopped | **Eliminated, not mitigated** | It cannot reach a merge. It terminates at the build's STEP 9 question |
| A `[STOP]` is classified confirming when it presents a decision | **High — this is the load-bearing judgement** | Each is classified in its own artefact with a stated reason, **by state**. When in doubt the fall is toward stopping. L4.3 traces every classified stop |
| F13's preview is skipped silently on the automatic path | **Certain without F14** | F14 states that passing through means not waiting, never not printing. L3.9 asserts it |
| The reference sweep misses `CLAUDE.md` or a `scripts/` file | **High** | None is a graph node, so no gate catches it. F9 is its own block and L3.6 greps the old namespace to zero |
| `--merge` surprises an installed user whose repository disallows merge commits | Medium | `gh pr merge --merge` fails loudly at the close-out rather than silently choosing another method |
| The recovery path writes a wrong file list after the flag changes | **Certain if F3/F4 are skipped** | A merge commit's `git show` is a combined diff. Both are in scope, in the same phase as the flag |
| A test pins the old flag beyond the one line named | **Likely — it happened last delivery** | F5 greps both test directories rather than trusting the line number |
| `add.done` has 11 dependants and F2/F4 edit it | **HIGH by the threshold** | Neither changes its interface: the flag and the diff command are internal to the close-out. The serial vitest suite is the guard |
| **A document justifies itself with the squash and nobody notices** | **Already happened once** | `delivery-index.md` was missed by this plan and found by its review; its only test greps for a word and stays green. F23 fixes both, and L4.6 exercises the derivation. ⛔ **A second such document may exist** — the Reviewer Handoff asks for a sweep |
| F7 is skipped as "optional" and F8 silently cannot do what its text says | **Certain under the earlier wording** | F7 is now a stated prerequisite, with a fallback that edits F8 and L2.3 in the same run rather than skipping a block |
| A ruler fix is applied without its criterion being re-proved | Medium | F15-F22 each name their item number in their own validation, which is what lets the build send `mode: confirm` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `.claude/commands/add-framework--done.md` → `.claude/skills/add-framework--done/SKILL.md` | internal | modify, then **rename** | F1, F3, F8, F15, F19, F21 |
| `.claude/commands/add-framework--build.md` → `.claude/skills/add-framework--build/SKILL.md` | internal | **rename** | F8, F15, F16, F17, F18 |
| `.claude/commands/add-framework--plan.md` → `.claude/skills/add-framework--plan/SKILL.md` | internal | **rename** | F8, F13, F16, F20, F22 |
| `.claude/commands/add-framework--brainstorm.md` → `.claude/skills/add-framework--brainstorm/SKILL.md` | internal | **rename** | F8, F10, F11, F12, F16 |
| `scripts/build.js` | internal | modify | F6, F7 |
| `CLAUDE.md` | internal | modify | F9 |
| `.claude/skills/add-plan-authoring/SKILL.md` | internal | modify | F13 |
| `.claude/skills/add-build-ledger/SKILL.md` | internal | modify | F17 |
| `.claude/skills/building-commands/references/agent-dispatch.md` | internal | modify | F16 |
| ~16 further `.claude/` files naming the four | internal | modify | F8 |
| `framwork/.codeadd/commands/add.done.md` | **product** | modify | F2, F4 |
| `cli/tests/product-close-out-parity.test.js` | **product** | modify | F5 |
| `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md` | **product** | modify | F23 |
| `cli/tests/impact-question-touched-by.test.js` | **product** | modify | F23 |

⛔ **`CLAUDE.md` is modified by F9 and by nothing else.** Its generated inventory block is untouched;
`node scripts/inventory.js` owns it and the close-out keeps it current.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify it fails against the
current tree.

⛔ **Run every prose assertion wrap-tolerant.** A plain `grep` on a sentence that wraps across two
lines returns a false RED that reads as a missing edit — that happened twice in the last delivery.
Collapse newlines first, and **count occurrences with `grep -o | wc -l`, never `grep -c`**, which
counts matching lines.

⛔ **Regression guards, GREEN today, must never go RED:** L1.1, L1.2, L2.1 and L3.10.

### L1 — Build side

1. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 with no warning absent from the baseline.
   *GREEN today — regression guard, and the gate F8 is most likely to trip.*
2. `git status --porcelain framwork/` is empty after every `[internal]` F-block. *GREEN today.*

### L2 — Graph

1. Node count and edge count are reported after F8 and compared against the baseline. **A drop in edges
   means a declaration was lost in the sweep.** *Measured, not asserted equal — the conversion changes
   node kinds and may legitimately change the count.*
2. **All four resolve as `internal/skill/*` and none as `internal/command/*`.** *RED today. This is the
   end-state assertion for F8, and it is what makes the large block reviewable without reading its
   diff.*
3. `impact add-framework--done --depth 1` includes `add-framework--build` with a hand-off edge, not
   `MENTIONS`. *RED today — the link does not exist.*
4. No dangling declaration after F8. *GREEN today — the build already gates this.*

### L3 — Document assertions

1. All four skill paths carry the **double** dash. *RED today — they are commands.*
2. Each of the four `SKILL.md` files opens with frontmatter carrying `name` and `description`, and the
   four descriptions are distinct. *RED today.*
3. `--squash` appears at zero sites in `add-framework--done` and `add.done`; `--merge` at five, each
   with a line saying the method is deliberate. *RED today.* ⛔ `done.sh` is excluded from this count.
4. Both close-outs' recovery paths take a first-parent diff and neither says "the squash IS the
   delivery". *RED today, two files.*
5. The brainstorm's STEP 7 presents three options, the middle one naming the build's STEP 9 question as
   its terminus. *RED today.*
6. `grep -rn "add-framework--[a-z]*\.md" .claude/ CLAUDE.md scripts/` returns zero old-namespace
   pointers. *RED today.* ⛔ This is the sweep's real proof — `CLAUDE.md` is not a graph node.
7. Every `[STOP]` in the four stages carries an explicit classification, and `add-framework--build`
   STEP 9's names **both** of its states. *RED today.*
8. `add-plan-authoring` carries the preview shape, and `/add-framework--plan` emits it at the end of
   STEP 4 — **inside the existing stop, with no second `[STOP]` marker added to that step.** *RED on
   the first half; the second half is a guard that must never go RED.*
9. The stopping rule states that a confirming stop still emits its content. *RED today.*
10. The NO-INVOKE gate still bans a stage invoking the next on its own initiative, **verbatim**, and
    adds the authorised-chain sentence. *First half GREEN — regression guard. Second half RED.*
11. **Item 5:** neither `add-framework--build` nor `add-framework--done` restates Argument Resolution;
    both delegate to `add-plan-authoring` by name. *RED today, two sites.*
12. **Item 5:** `### Agent Dispatch Rules` appears in one owner, and the three stages delegate to it.
    *RED today, three sites.*
13. **Item 4:** `add-build-ledger` documents the `GRAPH:` line shape. *RED today.*
14. **Item 6:** `add-framework--build`'s STEP 9 gate line states both behaviours. *RED today.*
15. **Item 6:** `add-framework--done`'s cleanup gate states the condition is the delivery being on
    `main`, not which STEP merged it. *RED today.*
16. **Items 6 and 8:** STEP 4.0's `Lists items` row states what happens to **all five** sections.
    *RED today.*
17. **Item 3:** `add-framework--done`'s `## Rules` has a `NEVER:` heading with at least one item, and
    no item derivable from its STEP order. *RED today.*
18. **Item 7:** `add-framework--plan`'s three duplicated Rules items are gone, and the prohibitions
    they duplicated survive at their original sites. *RED on the first half, GREEN on the second.*
19. `delivery-index.md` no longer justifies the derivation with "the merge squashes that branch", and
    states the rule for **both** routes — the PR route that now merges and `done.sh`'s local route that
    still squashes. *RED today.*

### L4 — Behavioural acceptance

1. `cd cli && npx vitest run --no-file-parallelism` passes. **Serial. Read, not assumed.**
2. **Trace the chain end to end on paper**: brainstorm → plan → build → PR question. Name the artefact
   and the step at each hop, and confirm the last hop stops.
3. **Trace every classified `[STOP]` on the automatic path** and confirm each either waits or prints.
   A stop that does neither is the defect F14 exists to prevent.
4. **The four are still invocable as `/<name>`** after conversion. ⛔ **Reconfirm this operationally
   before F8 closes** — the claim that internal commands are Skill-tool dispatchable is an observation
   about the harness that nothing in this repository asserts, and it is the fact the conversion's
   remaining rationale rests on.
5. **A `bounded` idea reaches the planner and produces a short plan**, unchanged by this delivery.
6. **Exercise the delivery-commit derivation on a real merged delivery, both ways.** Run the contract's
   own pickaxe — `git log --format=%h -S'"id":"<id>"' -- docs/delivered.jsonl | tail -1` — against an entry
   merged by a squash and against one merged by a merge commit, and confirm the stated rule returns the
   right commit in both. ⛔ **A grep for the word "squash" is not this check** — that is precisely the
   assertion that stayed GREEN through the defect.

**Coverage map:**

| F-block | Covered by |
|---|---|
| F1 | L3.3 |
| F2 | L3.3, L4.1 |
| F3 | L3.4 |
| F4 | L3.4, L4.1 |
| F5 | L4.1 |
| F6 | L2.2 |
| F7 | L2.3 |
| F8 | L1.1, L2.1, L2.2, L2.4, L3.1, L3.2, L4.4 |
| F9 | L3.6 |
| F10 | L3.5, L4.2 |
| F11 | L3.7, L4.3 |
| F12 | L3.10 |
| F13 | L3.8 |
| F14 | L3.9, L4.3 |
| F15 | L3.11 |
| F16 | L3.12 |
| F17 | L3.13 |
| F18 | L3.14 |
| F19 | L3.15 |
| F20 | L3.16, L4.5 |
| F21 | L3.17 |
| F22 | L3.18 |
| F23 | L3.19, L4.6 |

---

## Execution Order

F1 → F2 → F3 → F4 → **F23** → F5 → F6 → F7 → F8 → F9 → F10 → F11 → F12 → F13 → F14 → F15 → F16 →
F17 → F18 → F19 → F20 → F21 → F22

- **F23 inside Phase 1, before F5** — it is the contract F2 invalidates, and leaving it for later
  means the index documents a derivation the close-out no longer performs.
- **Phase 1 before Phase 2** — F1 and F3 edit a file F8 relocates. Editing before the move is one diff;
  after it is two.
- **F6 and F7 before F8** — the build must be able to discover and resolve skills before the files
  become skills. Both are no-ops until F8 lands, which is why they are safe to commit first.
- **F9 after F8** — the sweep proves what the move left behind.
- **Phase 3 after Phase 2** — the approval and the classifications land on the artefacts' final paths.
- **Phase 4 last** — the ruler fixes edit the converted skills, so they are written once, at their
  final location, and audited there by STEP 7.

**Working-state boundaries**, for a build that must stop:

- After **F5** — the merge preserves history everywhere and the derivation contract matches it.
  Complete and independent. **Safe.**
- After **F9** — the conversion has landed and every reference follows. **Safe.**
- After **F14** — the chain and its approval work. **Safe.**
- After **F22** — the ruler is clear. **Safe.**

⛔ Stopping **between F6 and F8** leaves a build configured for skills that do not exist yet. It is a
no-op rather than a breakage, but it is not a delivery boundary.
⛔ Stopping **inside F8** is not possible — it is one commit by construction.
⛔ Stopping **between F13 and F14** ships a preview that the automatic path skips in silence.

**Per-F-block validation beyond the layer default:**

- **F2, F4, F5** run the serial vitest suite — they are `[product]`.
- **F8** runs L2.2 immediately after its edit, before anything else. It is the only assertion that
  proves a twenty-file block landed correctly without reading twenty diffs.
- **F13** runs L3.8's second half immediately — the guard that no second stop was added.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file: what changed with the F-block id, which
validation levels cover it and their pass state, and any decision deferred or altered with the section
it departs from.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. **Whether F8 lost a declaration.** The edge count is the canary. A silent drop reads as a
   successful build.
3. **Whether any `[STOP]` was classified by marker instead of by state.** The audit proved at least
   one is both kinds; a table with one row per marker has already lost that.
4. **Whether F13's preview grew into the plan in miniature.** If it carries files, validation levels or
   F-block detail, someone will read it instead of the plan.
5. **Whether the old namespace survives anywhere.** `CLAUDE.md` and `scripts/` produce no graph nodes,
   so the gates cannot see them.
6. **Whether `done.sh` was touched.** It is excluded, and the exclusion is what keeps the product
   close-out's asymmetry honest rather than half-fixed.
7. **Whether any OTHER document justifies itself with the squash.** `delivery-index.md` was found by
   the plan review, not by the plan. Grep both layers for prose tying a rule to squashing before
   accepting that F23 caught them all.
8. **Whether Phase 4 located its targets by quoted text rather than by the cited line numbers.**
9. **Whether each of F15-F22 names its ruler item number** in its own validation.
10. **Whether the double dash survived** in all four paths, all four frontmatter names, and
    `build.js:1262`.

## References

- Design set: `…-000-umbrella.md` (objective, map, deferral), `…-002-merge-not-squash.md`,
  `…-003-commands-as-skills-and-chain.md`
- Prior art: `2026-09-16T144210-PLAN--objective-as-anchor` — shipped the `## Objective` this plan
  carries, and the `Objective fit` dimension that will review it
- Prior art: `2026-09-11T014333-PLAN--product-close-out-parity` — the four close-out invariants
- Prior art: `2026-09-10T203053-PLAN--close-out-hardening` — the precedent that ceremony is cut from
  operational evidence, which is why the product chain waits for this one to run

---

## Next Steps

/add-framework--build the-pipeline-chains

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-16 | Initial creation |
| 2026-09-16 | Implemented on feat/the-pipeline-chains, commits e7850e4..e4d8ce8 — F1-F23 plus build-added F7b, F8b, F8c, F15b, F24; see the ledger |
