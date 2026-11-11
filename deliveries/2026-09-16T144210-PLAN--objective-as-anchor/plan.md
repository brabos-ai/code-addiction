# Plan: The objective anchors the work — elicited, carried, and checked against

> **Status:** implemented
> **Layers:** internal, with one `[product]` F-block
> **Type:** cross-cutting
> **Created:** 2026-09-16

---

## Objective

**The brainstorm works out what the user is actually trying to achieve, helps them say it, and then
uses it as the anchor for everything that follows — the questions it asks, the market practice it
brings in, and every decision it records. That objective travels into the plan, where it states what
the build must deliver. The reviewer checks the scope against it.**

⛔ **This plan states its own objective under the rule it proposes, before that rule exists.** It is
the first document written this way on purpose: a template nobody has exercised is a template whose
gaps are still theoretical.

## Context

This came out of a session that went wrong in a way nothing caught.

A brainstorm produced an umbrella and three subtopics. Subtopic 001 was refined, planned, reviewed,
blocked, fixed and reworked — and then read side by side with the umbrella and found not to serve the
objective at all. It solved a real gap in a different feature. The umbrella had asserted a dependency
on it that, measured, did not exist.

**Every quality gate in the repository passed on that work.** The design had validated decisions, the
plan had a full impact table and a validation matrix, the reviewer returned findings and they were
fixed. Nothing was wrong except that it was not the work the user asked for.

| Document | Carries |
|---|---|
| — | ⛔ **No design document and no intent file.** The design for this change was explored and approved in chat on the `bounded` path, and this plan is the only written record of it. That is the gap `add-plan-authoring`'s Delivered Home warns about, and it is stated here rather than left for the close-out to discover |

**The audit at 3.4 returned `fix-then-ok` with three failed ruler items** on
`add-framework--brainstorm`. Each becomes its own F-block, naming the item number in its validation.

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 and emits no warning absent from the baseline
  (CLAUDE.md, Pipeline). **Baseline measured on `main` at `3fa1332`: exit 0, zero warnings, 225 nodes,
  867 edges**
- An internal-only F-block proves it stayed in its lane with `git status --porcelain framwork/`
  returning empty (`add-framework-internal-layer`, Validation)
- The `[product]` F-block runs `cd cli && npx vitest run --no-file-parallelism` and reads the result —
  *"Serial is not a preference"* and *"a mental test is NOT evidence"* (`add-framework-product-layer`)
- Every `.md` artefact this plan modifies passes all eight ruler items **for its type**
  (`add-framework-internal-layer`, Coherence)
- `CLAUDE.md` is not written by this plan. No command, skill or agent is created or removed, so the
  generated inventory block is unchanged

## Problem

1. **The brainstorm never asks what the user is trying to achieve.** STEP 2.1 asks purpose, users,
   success criteria, constraints and dependencies (L146-154) — five good questions, none of which
   produces a statement of the objective. The design template (L437-483) goes `Discovery` →
   `Context & Motivation` → `Problem / Opportunity`. **No field in either layer holds an objective.**
2. **The user may not be able to state it cold.** Asking "what is your objective?" and waiting hands
   the work back — the same failure the command already fixed for options, where L322-324 requires
   every question to carry a recommendation.
3. **Recommendations are grounded in this repository only.** L322-324 says *"in concrete terms drawn
   from this repository — what already exists, what it would break, what a neighbouring artefact
   already does."* That is a floor, and read as a ceiling it excludes what the user cannot derive from
   the tree: what comparable products and frameworks already settled.
4. **A decision records why it is sound, never what it serves.** The Key Decisions table (L483) is
   `Decision | Rationale | Validated`. A decision can be correct, validated, and irrelevant.
5. **A SET member inherits nothing.** STEP 8.1 is two lines — *"Read the referenced umbrella spec
   file"*. Nothing says what a subtopic takes from the umbrella, so nothing catches a member that does
   not serve it.
6. **The plan never states what the build must deliver as an outcome.** It has `Problem`, `Proposal`,
   `Scope`, `Impact` and a `Validation Matrix` — files, blocks and mechanical assertions. Nothing says
   what is true when the build is done.
7. **None of the reviewer's eight dimensions asks whether the work serves the goal.** `Scope`,
   `Hidden assumptions`, `Contradictions`, `Dependencies`, `Executability`, `Testability`, `Risks`,
   `Gold-plating` (`plan-review-agent.md:78-85`). The 001 plan passed all eight.
8. **Three ruler items fail on `add-framework--brainstorm`**, independently of this feature, and two of
   the three land in STEP 8 — the same under-specified Continue Mode that problem 5 is about.

## Proposal

The objective becomes a first-class field. **Six changes make it real, and each one has something that proves it.**

**Elicited, not demanded.** STEP 2.1 gains a first question that proposes a draft objective built from
what the user already said, for them to correct. The command does the drafting; the user does the
correcting. This is the same move L322-324 already makes for options.

**The anchor for exploration.** L322-324's recommendation rule gains a second source — what comparable
products and frameworks already do — and a hard rule that the source is **named**. Insight travels
with its attribution or it does not travel.

**Recorded per decision.** The Key Decisions table gains a `Serves` column naming which part of the
objective each decision advances. A row that cannot fill it is the signal.

**Inherited by a SET member, verbatim.** STEP 8.1 copies the umbrella's objective into the subtopic
and requires one line saying how the subtopic serves it. **A member that cannot write that line is not
a member of the set** — that is the gate that would have caught 001.

**Carried into the plan, framed as the build's output.** `plan-template.md` gains `## Objective`
directly under the header, copied verbatim from the design, plus what is true once the build is done.

**Checked by the reviewer.** `plan-review-agent` gains a ninth dimension, `Objective fit`.

Then the three audit items, each independent.

## Current State

| Artefact | Dependants at depth 1 | Risk | Today |
|---|---|---|---|
| `add-framework--brainstorm` | **0** — entry point | **LOW** | No objective field; 2.1 asks five questions that do not produce one; 8.1 is two lines |
| `add-plan-authoring` | **3** — `add-framework--build`, `--done`, `--plan` | **HIGH** | Owns the plan template and the review dispatch; template has `## Context` but no `## Objective` |
| `plan-review-agent` | **4** — `add-framework--brainstorm`, `--plan`, `add-plan-authoring`, `add-review-discipline` | **HIGH** | Eight dimensions, none about objective fit |
| `cli/tests/plan-review-agent-speed.test.js` | **not a graph node** | — | L59 defines `DIMENSIONS`; L121 iterates it by name and asserts no count |
| `cli/tests/review-no-loops.test.js` | **not a graph node** | — | **A second hard-coded copy.** L195's `L1.9` inlines the same eight names and asserts `toContain` on each. **Checked directly: a ninth does not break it** — but its title says *"keeps its eight dimensions"*, which goes stale the moment F8 lands |

**Delivery index, internal layer.** `add-framework--brainstorm`: no delivery recorded.
`add-plan-authoring`: no delivery recorded. `plan-review-agent`: **one `live` entry**,
`2026-09-09T061636-PLAN--plan-review-agent-speed`, which is where the eight dimensions and the
24-assertion test come from. **Nothing `gone` or `superseded` anywhere** — no prior attempt at an
objective field was tried and dropped.

## Scope

### Includes

#### The objective exists and is elicited

- **F1** [internal] — `.claude/commands/add-framework--brainstorm.md` **STEP 2.1** (L146-154): a first
  question that **proposes a draft objective** assembled from the user's own words so far, and asks
  them to correct it. It must NOT ask the user to produce one cold, and must NOT remove the five
  existing questions — they refine what the draft states.
  - **Produces:** a stated, user-corrected objective, before 2.2 classifies anything
- **F2** [internal] — same file, **STEP 5.2 template** (L437-483): `## Objective` as the first section,
  **above `## Discovery`**, one or two sentences in the user's own terms answering *what will be true
  when this is done that is not true today*. It must NOT restate the problem, and must NOT displace
  `## Context & Motivation`, which answers a different question.
  - **Consumes:** a stated, user-corrected objective (F1)
  - **Produces:** `## Objective` as the design document's first section
- **F3** [internal] — same file, **STEP 8.1** (two lines today): a SET member copies the umbrella's
  `## Objective` **verbatim** and writes one line — *how this subtopic serves it*. ⛔ **A member that
  cannot write that line is not a member of the set**, and the step says so as a gate, not as advice.
  It must NOT let a subtopic author its own objective.
  - **Consumes:** `## Objective` as the design document's first section (F2)

#### The objective anchors the exploration

- **F4** [internal] — same file, **L322-324**: the recommendation rule gains a second source — what
  comparable products, frameworks and conventions already do on this subject — **and the rule that the
  source is named.** ⛔ *"Widely adopted"* with no name is not evidence; *"superpowers' brainstorming
  does X"* is, because the user can check it. Repository grounding is not replaced and **wins where
  the two conflict** — this repo's own conventions are not overridden by outside practice. It must NOT
  make the command depend on network access.
- **F5** [internal] — same file, **L483**: the Key Decisions table becomes
  `Decision | Serves | Rationale | Validated`. `Serves` names the part of the objective the decision
  advances. It must NOT drop `Validated` — soundness and relevance are different questions.
  - **Consumes:** `## Objective` as the design document's first section (F2)

#### The objective travels to the plan

- **F6** [internal] — `.claude/skills/add-plan-authoring/references/plan-template.md`: `## Objective`
  directly under the `> **Created:**` header and **above `## Context`**, carrying the design's
  objective verbatim plus one line stating **what is true once the build is done**. It must NOT
  duplicate `## Problem` and must NOT become a second scope list.
  - **Consumes:** `## Objective` as the design document's first section (F2)
  - **Produces:** the plan's `## Objective`, and the rule that it is copied rather than re-derived
- **F7** [internal] — `.claude/skills/add-plan-authoring/SKILL.md` **Authoring Rules**: the objective is
  **copied verbatim from the design, never re-derived**, and **a plan with no design document still
  states one**, drawn from the conversation and marked as such. It must NOT weaken the existing
  "reference, do not restate" rule for design docs.
  - **Consumes:** the plan's `## Objective`, and the rule that it is copied rather than re-derived (F6)

#### The reviewer checks it

- **F8** [internal] — `.claude/agents/plan-review-agent.md` **Dimensions table** (L76-85): a ninth row,
  `Objective fit` — *fails when a scope item, F-block or artefact cannot be traced to the stated
  objective, or when the plan states no objective at all.* ⛔ **A ninth row, not an extension of
  `Gold-plating`.** Gold-plating fails on *"scope not backed by a validated decision"*, and the work
  that prompted this plan had validated decisions for everything — a check hidden inside a dimension
  named for another failure is a check the next reader does not know to look for. It must NOT remove or
  reword any of the eight.
  - **Consumes:** the plan's `## Objective`, and the rule that it is copied rather than re-derived (F6)
- **F9** [product] — **two test files, not one.** `Objective fit` joins
  `cli/tests/plan-review-agent-speed.test.js`'s `DIMENSIONS` array (L59) and its L2.5 title changes from
  *"all eight dimensions"* to nine; `cli/tests/review-no-loops.test.js` L195 gains the same name in its
  **inline** copy of the list and its `L1.9` title changes the same way.
  - ⛔ **The second file was found by the plan review, not by this plan.** Neither is a graph node, so
    nothing reports them as dependants. Both were then checked directly: each asserts `toContain` per
    name with no count assertion, so **a ninth dimension breaks neither** — the edit is to keep the two
    titles from saying *eight* next to an agent that has nine.
  - ⛔ **Two hard-coded copies of one list is a `Single owner` defect, and this plan does NOT fix it.**
    Extracting a shared fixture is a separate change on product-layer test infrastructure that nobody
    has asked for. It is recorded here so the next reader finds it stated rather than by grep.
  - ⛔ **These files are `[product]` although they assert on an internal agent** — `cli/tests/` is
    product by the anatomy in `CLAUDE.md`, so this block loads `add-framework-product-layer` and runs
    the suite serially.
  - **Consumes:** the ninth dimension `Objective fit` (F8)

#### Ruler items from the 3.4 audit — one F-block per item

- **F10** [internal] — **ruler item 3, Mandatory form.** L127-130 and L677-679 dispatch
  `@framework-discovery-agent` as plain text, with no `**DISPATCH AGENT:**` header and no
  `**Capability:**` / `**Complexity:**`, though `building-commands/references/agent-dispatch.md:88`
  says the block is mandatory. `/add-framework--plan` STEP 1.3 dispatches the same agent correctly —
  mirror it at both sites.
- **F11** [internal] — **ruler item 4, Contract with the neighbours.** L130 sends
  `prior_deliveries: … — or "none"`. `framework-discovery-agent.md:36-37` declares the field
  **optional** and states *"Absent means the caller resolved none"*; its branches at L45 and L54 have
  no case for the literal string. **Omit the field when nothing resolved**, matching the contract the
  receiver already publishes.
- **F12** [internal] — **ruler item 6, No ambiguity between STEPs.** L107 requires the delivery index to
  be asked **before** dispatching the agent, but STEP 8 jumps from 1.0 (L91) straight past 1.1-1.3, and
  8.2 (L675-681) dispatches with no lookup and no `prior_deliveries`. Give 8.2 the same lookup, or state
  that the omission is deliberate for Continue Mode — **not both, and not silence.**

### Does NOT Include (important!)

- **The product layer.** `add.brainstorm`, `add.new`, `add.plan` and the `add-doc-schemas` schemas have
  the same gap. The user deferred it explicitly: *"no framework será trabalhado em add.new, mas não
  agora, no próximo planejamento que irei criar baseado neste trabalho interno."* The one `[product]`
  F-block here is a test file, not a distributed artefact.
- Converting the four internal commands to skills — that is the umbrella's subtopic 003.
- `--squash` → `--merge` — subtopic 002.
- Changing what `## Context & Motivation` or `## Problem / Opportunity` are for. The objective sits
  above them and answers a different question.
- Any network dependency. F4 requires attribution, never a search.
- `CLAUDE.md`.
- The other five dimensions-adjacent rules in `plan-review-agent` — severity levels, report shapes, the
  nit cap. F8 adds a row and touches nothing else.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Is the objective demanded or drafted? | **Drafted by the command, corrected by the user** | *"pode ser que o usuário não saiba como explicar"*. The command already does this for options at L322-324 — asking and waiting hands the work back |
| A ninth dimension, or extend `Gold-plating`? | **A ninth, named `Objective fit`** | Gold-plating fails on scope with no *validated decision*; the work that prompted this had validated decisions throughout. A check hidden under another name is one the next reader does not look for |
| Does a ninth dimension break the pinned tests? | **No — and there are TWO of them** | `plan-review-agent-speed.test.js:121` runs `for (const d of DIMENSIONS) expect(section).toContain(d)`; `review-no-loops.test.js:195` inlines the eight names and asserts `toContain` on each. Neither asserts a count. **The second was found by the plan review — this plan had applied its own "measured, not assumed" standard to one matching file and not both** |
| Where does market insight come from? | **The model's knowledge, with the source named** | An unnamed *"widely adopted"* claim is not checkable and is exactly the confident-wrong failure this repo guards against elsewhere. A named example — a product, a framework, a convention — is something the user can verify. **Cost if wrong:** a named source may be out of date; the user sees the name and can say so, which an unnamed claim never allows |
| Does market practice override repository convention? | **No — the repo wins on conflict** | This repo has settled conventions for reasons recorded in its own documents. "The market does X" is an input, never an authority |
| Does the objective replace `Context & Motivation`? | **No** | One says what we are trying to achieve; the other says why it matters now. Collapsing them loses the second |
| Where does a SET member's objective come from? | **Verbatim from the umbrella** | A member that authors its own objective can drift from the set and nothing notices — which is what happened |
| What does a plan with no design document do? | **States an objective anyway**, drawn from the conversation and marked as such | Otherwise the `bounded` path — the one this whole fast-path effort targets — is the one path with no objective |
| Which layer is the test file? | **`[product]`** | `CLAUDE.md`'s anatomy puts `cli/tests/` under the product layer. The subject of the assertion does not decide the layer; the path does |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A subtopic that does not serve the objective cannot be written without the gap being visible | One more mandatory field in two templates |
| Every decision says what it advances, not only that it is sound | A wider Key Decisions table |
| Recommendations reach past what the tree can show | The obligation to name a source every time, which is slower than asserting one |
| The reviewer can ask the question that the eight dimensions miss | A ninth dimension to keep correct, and one product-layer test to keep in step |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| `## Objective` becomes a restatement of `## Problem` | **High — this is the likely failure** | F2 defines it by its question — *what will be true that is not true today* — and F6 adds the build-output half. L3.2 and L3.8 assert the defining sentence is present in both templates |
| The `Serves` column is filled with the objective's own words, saying nothing | Medium | F5 requires it to name **a part** of the objective, not the whole. The ninth dimension is what catches a table where every row serves everything |
| A named market source is invented or stale | Medium | The name is what makes it checkable — that is the whole mechanism. The cost clause is recorded in Validated Decisions rather than mitigated away |
| F4 is read as permission to replace repo grounding with outside practice | Medium | F4 states the repo wins on conflict, and L3.4 asserts that clause is present |
| `add-plan-authoring` has 3 dependants and F6/F7 edit it | **HIGH by the threshold** | Both add; neither weakens an existing rule. L3.9 asserts the "reference, do not restate" rule survives verbatim |
| `plan-review-agent` has 4 dependants and F8 edits it | **HIGH by the threshold** | F8 adds a row. L3.10 asserts all eight original dimension names still appear, unchanged |
| F9 is tagged internal because its subject is an internal agent | Medium | The path decides the layer. F9's own scope says so, and its validation runs the serial vitest gate that only a product block requires |
| F3, F10 and F12 all edit STEP 8 | Medium | They run in that order, each validating its own assertion immediately. F12's edit is adjacent to F10's and both are adjacent to F3's |
| **The L4.2 replay confirms a conclusion rather than testing one** | **High, and structural** | The umbrella was corrected post-mortem to say 001 is parked, and `docs/brainstorming/` is gitignored so the original is gone. L4.2 answers this with a control group — 002 and 003 were not rewritten — and reports the result as *consistent with* the design, never as proof |
| A second pinned test is missed the way the first nearly was | **Already happened once** | The plan review found `review-no-loops.test.js`. F9 now names both files, and the Reviewer Handoff asks whether a third exists — neither is a graph node, so nothing automated will say |
| A ruler fix is applied without its criterion being re-proved | Medium | F10, F11 and F12 each name their item number in their own validation, which is the signal the build reads to send `mode: confirm` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `.claude/commands/add-framework--brainstorm.md` | internal | modify | F1, F2, F3, F4, F5, F10, F11, F12 |
| `.claude/skills/add-plan-authoring/references/plan-template.md` | internal | modify | F6 |
| `.claude/skills/add-plan-authoring/SKILL.md` | internal | modify | F7 |
| `.claude/agents/plan-review-agent.md` | internal | modify | F8 |
| `cli/tests/plan-review-agent-speed.test.js` | **product** | modify | F9 |
| `cli/tests/review-no-loops.test.js` | **product** | modify | F9 |

No file is created, renamed or removed. `CLAUDE.md` is unchanged.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify it fails against the
current tree.

⛔ **Four checks are regression guards that are GREEN today and must never go RED: L1.1, L1.2, L2.1 and
L3.10.** They are written and run like any other; only the expected starting colour differs.

### L1 — Build side

1. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 with no warning absent from the baseline.
   *GREEN today — regression guard.*
2. `git status --porcelain framwork/` is empty after every `[internal]` F-block. *GREEN today —
   regression guard, and the proof an internal block stayed in its lane.*

### L2 — Graph

1. **The graph is unchanged: 225 nodes and 867 edges, the same as the baseline.** No artefact is
   created or removed and no `uses:` declaration changes, so any movement here is an accident. *GREEN
   today — regression guard. The named products in F4 are not graph nodes and must not become
   `mention:` declarations.*

### L3 — Document assertions (mechanical string checks)

1. STEP 2.1 opens with a question that **proposes** a draft objective from the user's own words, and
   the five existing questions are still present. *RED on the first half, GREEN on the second.*
2. The STEP 5.2 template's first section is `## Objective`, it sits **above `## Discovery`**, and it
   carries the defining sentence — *what will be true when this is done that is not true today*.
   *RED today.*
3. STEP 8.1 states that a SET member copies the umbrella's objective **verbatim** and writes how it
   serves it, **and that a member which cannot write that line is not a member.** *RED today — 8.1 is
   two lines.*
4. L322-324's recommendation rule names **both** sources — this repository and comparable products or
   frameworks — **requires the outside source to be named**, and states the repository wins on
   conflict. *RED today, three clauses.*
5. The design template's Key Decisions header reads `Decision | Serves | Rationale | Validated`.
   *RED today.*
6. Nothing in the changed text requires a network call, a URL fetch or a web search. *GREEN today —
   regression guard against F4 growing a dependency.*
7. `plan-template.md` carries `## Objective` between the `> **Created:**` header and `## Context`.
   *RED today.*
8. That section states both halves: the design's objective verbatim, and what is true once the build
   is done. *RED today.*
9. `add-plan-authoring`'s Authoring Rules state the objective is copied verbatim and never re-derived,
   **and** that a plan with no design document still states one — **and the existing "references it and
   does not restate it" sentence survives verbatim.** *RED on the first two, GREEN on the third.*
10. `plan-review-agent.md`'s Dimensions table contains all eight original names — `Scope`,
    `Hidden assumptions`, `Contradictions`, `Dependencies`, `Executability`, `Testability`, `Risks`,
    `Gold-plating` — **plus** `Objective fit`. *First half GREEN — a regression guard that must never go
    RED. Second half RED.*
11. `Objective fit`'s fail condition names both cases: scope not traceable to the objective, and no
    objective stated at all. *RED today.*
12. **Ruler item 3:** both `@framework-discovery-agent` dispatches carry `**DISPATCH AGENT:**` and
    `**Capability:** read-only`. *RED today, two sites.*
13. **Ruler item 4:** `prior_deliveries` is omitted when nothing resolved; the literal `"none"` is gone.
    *RED today.*
14. **Ruler item 6:** STEP 8.2 either asks the delivery index before dispatching, or states that the
    omission is deliberate for Continue Mode — exactly one of the two. *RED today.*

### L4 — Behavioural acceptance

1. `cd cli && npx vitest run --no-file-parallelism` passes, with
   `plan-review-agent-speed.test.js` green and its L2.5 now covering nine names.
2. **Replay F3's gate against the document set that produced it — and against a control.**

   ⛔ **This replay is weaker than it first looks.** Two reasons, both named rather than worked around.
   The four `2026-09-16T083054-internal-fast-path-*` documents predate `## Objective`, so there is no
   such section to copy — **the stand-in is the objective statement in the umbrella's
   `## Context & Motivation`.** And the umbrella has already been corrected post-mortem to say 001 is
   parked and does not serve the objective, so replaying 001 alone confirms a conclusion the document
   was edited to contain. `docs/brainstorming/` is gitignored, so the pre-correction text cannot be
   recovered from git.

   **The control group is what makes it discriminating.** Run the serves-line test on **002 and 003 as
   well** — neither was rewritten to say anything about serving the objective:

   | Subtopic | Expected | Where the answer comes from |
   |---|---|---|
   | 001 planless close-out | **Cannot** write the line | 001's own Scope, plus the brainstorm's routing at 2.2.2 and STEP 7 — the chain always produces a plan. **Not** from the umbrella's post-mortem verdict |
   | 002 merge not squash | **Can** | Preserved per-F-block history is part of what a completed fast delivery leaves behind |
   | 003 commands as skills and chain | **Can** | It is the objective |

   **A gate that rejects all three is a wall; one that accepts all three is decorative. Only the
   1-of-3 split supports F3.** Report the result as *consistent with* the design, never as proof — the
   record it is read against is the corrected one.
3. **A plan written with no design document still states an objective.** Trace F7's rule through
   `add-framework--plan` STEP 5 on the `bounded` path.
4. The ninth dimension is reachable by the reviewer: `add-plan-authoring`'s Review Dispatch sends
   `path`, and the agent reads the plan file, so a plan carrying `## Objective` needs no new input
   field. **Confirm no dispatch contract changed** — if one did, `add-framework--plan`,
   `--build` and `--done` all send it and all three would need editing.

**RED expectations:** L3.2, L3.3, L3.5, L3.7, L3.8, L3.11, L3.12, L3.13 and L3.14 fail today, as do
the first half of L3.1, L3.4, the first two clauses of L3.9, and the second half of L3.10.

**Coverage map:**

| F-block | Covered by |
|---|---|
| F1 | L3.1 |
| F2 | L3.2 |
| F3 | L3.3, L4.2 |
| F4 | L3.4, L3.6 |
| F5 | L3.5 |
| F6 | L3.7, L3.8, L4.4 |
| F7 | L3.9, L4.3 |
| F8 | L3.10, L3.11 |
| F9 | L4.1 |
| F10 | L3.12 |
| F11 | L3.13 |
| F12 | L3.14 |

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11 → F12

- **F1 before F2** — the elicited objective is what the template section holds. Reversed, the template
  declares a field nothing produces.
- **F2 before F3 and F5** — both reference the section F2 creates.
- **F6 before F7 and F8** — the skill's rule and the reviewer's dimension both act on a plan section
  that must exist first.
- **F8 before F9** — the test asserts the dimension.
- **F10 → F12 last** — each is independent of the feature and of the others.

⛔ **F3, F10 and F12 all edit STEP 8, in that order.** None conflicts with the others, but each
validates its own assertion immediately after its edit rather than at the end.

**Working-state boundaries**, for a build that must stop:

- After **F5** — the brainstorm produces and uses an objective. The plan does not yet carry it.
  Incomplete but coherent.
- After **F7** — the objective travels end to end, unchecked by the reviewer. Safe.
- After **F9** — the feature is complete. Safe.
- After **F12** — the ruler items are clear. Safe.

⛔ Stopping between **F8 and F9** leaves a ninth dimension the test does not know about. Not a
delivery boundary.

**Per-F-block validation beyond the layer default:**

- **F3** runs L4.2 immediately — the replay is the only check that the gate has teeth, and it is cheap.
- **F8** runs L3.10's first half immediately — it is the guard that a row was added rather than the
  table rewritten.
- **F9** runs the serial vitest suite, per `add-framework-product-layer`. A mental test is not evidence.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. **Whether `## Objective` reads as a restatement of `## Problem`** in either template. This is the
   named likely failure, and a mechanical string check cannot see it.
3. **Whether the replay at L4.2 was actually run**, and what it concluded. A gate that cannot reject
   the document it was designed from is decorative.
4. **Whether `Serves` can be filled with the whole objective.** If every row serves everything, the
   column records nothing.
5. **Whether a THIRD file hard-codes the dimension list.** Two were found — one by this plan, one by
   its review. `cli/tests/` holds no graph nodes, so nothing automated reports them. Grep before
   trusting the count.
6. **Whether F4 acquired a network dependency** — a URL, a fetch, a search instruction. L3.6 asserts
   it did not.
7. **Whether any of the eight original dimensions was reworded.** F8 adds; it does not edit.
8. **Whether F9 was built under the product-layer rules** — serial vitest, read, not assumed.
9. **Whether each of F10-F12 names its ruler item number** in its own validation.

## References

- The failure this plan exists to prevent: `docs/brainstorming/2026-09-16T083054-internal-fast-path-000-umbrella.md`
  and its `-001-planless-close-out.md` member, now marked `parked`
- Prior art: `2026-09-09T061636-PLAN--plan-review-agent-speed` — where the eight dimensions and the
  24-assertion test come from
- Prior art: `2026-09-15T224612-PLAN--pipeline-ceremony-rebalance` — introduced the intent file and the
  confirmation screen that F1's drafting move mirrors
- Contract read at 3.4: `building-commands/references/agent-dispatch.md:42-50, 88` (F10) and
  `.claude/agents/framework-discovery-agent.md:36-37, 45, 54` (F11)

---

## Next Steps

/add-framework--build objective-as-anchor

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-16 | Initial creation |
| 2026-09-16 | Implemented on `feat/objective-as-anchor`, commits `3fa1332..cb2f96c` (14). STEP 7 dispatched six auditors — three scopes plus one ruler pass per `.md` artefact — returning 9 findings: 6 applied, 3 rejected with rulings. The `high` was mine: F1 split `2.1` into `2.1.1`/`2.1.2` and left `8.3` saying "this is `2.1` only", which sent Continue Mode to author an objective `8.1` had just forbidden it to author; three auditors found it independently. F9 turned out to have five stale sites, not the four this ledger claimed — a truncated grep made me write a false completion line, corrected in place |
| 2026-09-16 | Review returned `fix-then-ok`; all three findings applied. **A1** — L4.2's replay was circular: the umbrella was corrected post-mortem to say 001 is parked, and the four documents predate `## Objective` so there is nothing to copy verbatim. Rewritten to name the stand-in text, add 002 and 003 as a control group, and report the result as *consistent with* rather than proof. A structural risk row records it. **A2** — `cli/tests/review-no-loops.test.js:195` holds a second hard-coded copy of the eight dimension names, absent from every table here; verified directly as safe for a ninth, and F9 now covers both files plus the `Single owner` defect it leaves unfixed. **N1** — the Proposal said "three jobs" above six changes |
