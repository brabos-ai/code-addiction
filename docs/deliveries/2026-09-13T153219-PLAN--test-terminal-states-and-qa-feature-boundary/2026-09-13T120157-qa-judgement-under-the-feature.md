# Brainstorm: QA Judgement Belongs Under the `qa-pipeline` Feature

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-13
> **Type:** architecture
> **Layer:** product — `framwork/.codeadd/` and `cli/`

## Discovery

**Delivery index.** No entry for `add.review`, `add.qa-setup` or the `qa-pipeline` feature. The
removal of the standalone `/add.qa` command predates the index; `cli/tests/loop-consolidation-0070.test.js`
carries `REMOVED = ['add.test', 'add.qa', 'add.autopilot']` and asserts it stays removed.

**Where QA lives today.** `/add.qa` was absorbed into `add.review` as STEP 8 (QA Preflight), STEP 9
(QA Evidence) and STEP 10 (QA Judgement). `add.review.md:636` declares those steps **base body, not
feature-gated**, self-gating on the `/add.qa-setup` receipt, and states the split in one sentence:

> *"`qa-pipeline` gates **authoring** (`add.plan`'s QA spec, `@e2e-agent`) and **correction**, never
> judgement."*

**The mechanism for gating them already exists and is in use.** `cli/src/features.js` registers
`tdd-pipeline` with `commands: ['add.plan', 'add.build', 'add.review', 'add.hotfix']`, and
`framwork/.codeadd/fragments/tdd-pipeline/add.review.md` exists on disk. A feature gating content
inside `add.review` is a shipped, exercised path. `qa-pipeline` simply does not declare it:
`commands: ['add.plan', 'add.build']`, and `fragments/qa-pipeline/` holds only `add.plan.md` and
`add.build.md`.

## Context & Motivation

The sentence at line 640 is true about the **steps** and false about their **input**. The evidence
the judges read is authored by `@e2e-agent`, which the feature gates. Ungating the judgement without
ungating its input does not produce a working judgement — it produces a judgement with nothing to
judge, and the command walks into that state rather than stopping at it.

## Problem / Opportunity

### The chain, with `qa-pipeline` disabled

| Step | Text on disk | Result |
|---|---|---|
| STEP 8, preflight row 1 | `qa-pipeline` feature enabled → severity **degrade** | The command continues |
| STEP 9.3, first bullet | *"`qa-pipeline` OFF → specs were never authored. Tell the user: …"* | **No fallback.** The live-drive stopgap in the second bullet belongs to the `qa-pipeline` **ON** branch only |
| STEP 9.4 | *"a reachable, in-contract screen with no evidence is a `blocker` titled `coverage: <screen> not captured` — **not a note**"* | Every in-contract screen becomes a blocker |
| STEP 10.1 | Dispatches `@ux-agent` ∥ `@qa-agent` per scope | Two judges, an empty `screenshots/`, and a reconciliation table that is all blockers |

So the promise at line 638 — *"A project that ran `/add.qa-setup` and declined the `qa-pipeline`
feature keeps its QA judgement"* — is contradicted 140 lines later by the command's own text. That
project does not keep its judgement. It gets a coverage blocker per screen and two agents reading an
empty directory.

### Why it is shaped this way

It is residue. `/add.qa` was a standalone command: you pointed it at whatever evidence existed, and
"ungated" was meaningful because there was no feature in the picture. When the body moved into
`add.review`, the ungated property moved with it, and nothing re-asked whether it still held once the
evidence producer sat behind a feature flag.

### The severity is wrong too

Preflight grades the missing feature as **degrade**, which means "proceed with less". There is no
lesser mode to proceed into on the OFF branch — 9.3 has no fallback there. `degrade` is the grade
that carries the command into the broken state.

## Proposed Solution

Move judgement under `qa-pipeline`, so the feature governs the whole QA flow — authoring, judgement
and correction — rather than two thirds of it.

`qa-pipeline` declares `add.review` in its command list, a `fragments/qa-pipeline/add.review.md`
carries STEPs 8 to 10, and `add.review` gains the injection markers. Post-install, a project with the
feature off has a command with no QA steps in it at all, instead of QA steps that cannot work.

### One constraint decides the fragment's shape

**The extraction cannot be one marker pair around STEPs 8 to 10.** Two facts combine:

- `scripts/build.js` runs `assertEmptyMarkerPairs` over the command source before stripping, and
  throws `Non-empty injection pair … marker pairs must be empty`. A marker pair in the source holds
  no content; the content lives in the fragment.
- `add.review.md:840-841` already carries a live plugin pair, `<!-- plugin:playwright:drive -->`,
  inside STEP 10.1. The graph records it (`plugins/playwright/fragments/add.review.md` `INJECTS_INTO`
  `add.review`) and `cli/tests/loop-consolidation-0070.test.js` pins it in `EXPECTED_MAP`.

One feature pair spanning STEPs 8 to 10 would enclose that plugin pair, and the build refuses to ship
it. So the fragment is **several section pairs, with the playwright anchor left unwrapped and in
place in the base source** — at least one section before it and one after. A thin scaffold around the
anchor therefore stays in the ungated body, and the design must say which scaffold that is rather
than discover it at build time.

### Alternatives considered

| Option | Approach | Verdict |
|---|---|---|
| **A** | Keep judgement ungated; make the OFF branch degrade honestly — 9.3 skips STEP 10, 9.4 emits no coverage blockers when nothing was ever authored | **Rejected by decision.** It preserves the written split, but keeps a QA path that only functions with the `playwright` plugin installed, and the OFF branch does not offer even that today |
| **B** | Turn preflight row 1 from `degrade` into `block` | **Rejected.** Smallest patch, worst outcome: it makes the feature mandatory in practice without saying so anywhere, and leaves the contradicting sentence at line 640 in the file |
| **C** | Gate judgement on `qa-pipeline` | **Chosen** |

### Two gates, and they answer different questions

Moving judgement under the feature does not retire the `/add.qa-setup` receipt. The two gates stack,
and the design is only coherent if each keeps its own question:

| Gate | Question | When it applies |
|---|---|---|
| `qa-pipeline` feature | Is QA part of this project's flow at all? | Install time — it decides whether the steps exist in the installed command |
| `/add.qa-setup` receipt | Is QA configured here — `config.json`, `baseUrl`, reachability? | Run time — it decides whether the steps that exist can run |

## Type of Artefact

Architecture — a feature boundary moves. No new command, one new fragment.

## Scope

### Includes

| Id | Change | Artefact |
|---|---|---|
| Q1 | `qa-pipeline.commands` gains `add.review` | `cli/src/features.js` |
| Q2 | New fragment carrying STEPs 8, 9 and 10 as **several section pairs**, split so the `plugin:playwright:drive` anchor at `add.review.md:840` is never enclosed. Names the thin scaffold that stays in the ungated body around that anchor | `framwork/.codeadd/fragments/qa-pipeline/add.review.md` |
| Q3 | Matching `<!-- feature:qa-pipeline:… -->` pairs, each empty, none spanning the playwright anchor | `framwork/.codeadd/commands/add.review.md` |
| Q4 | The line-636 to line-641 statement is rewritten: the feature governs authoring, judgement **and** correction; the receipt governs configuration | `framwork/.codeadd/commands/add.review.md` |
| Q5 | Preflight row 1 is removed — a feature-gated step cannot probe for its own feature. Row 14 (`<surface>.qa.spec` persisted) keeps its `degrade`, which is now a true degrade: the feature is on and the specs are merely not generated yet | `framwork/.codeadd/commands/add.review.md` |
| Q6 | STEP 9.3 loses its `qa-pipeline` OFF bullet, which becomes unreachable | `framwork/.codeadd/commands/add.review.md` |
| Q7 | The feature table's `qa-pipeline` row gains `add.review`; the sentence on what the feature governs is re-synced | `framwork/.codeadd/skills/add-ecosystem/SKILL.md` |
| Q8 | The Feature Injection System table's `qa-pipeline` row gains `add.review` | `CLAUDE.md` |
| Q9 | STEP 2's feature-off sentence (line ~217) names only *"add.plan authors no QA spec and add.build dispatches no @e2e-agent"*. A judgement clause is appended — with the feature off, `add.review` dispatches no judge either | `framwork/.codeadd/commands/add.qa-setup.md` |
| Q10 | The canonical *"Feature vs plugin"* statement (line ~28) names authoring and correction only. A judgement clause is added. **This one is load-bearing:** the file states that every consumer references this statement instead of restating it, so leaving it would recreate this design's own contradiction in a second place | `framwork/.codeadd/skills/add-qa/SKILL.md` |
| Q11 | STEP 11's Quality Gate Report row (line ~906) reads `⊘ NOT SET UP … when the receipt gate (rows 9–10) is unmet`. STEP 11 stays in the ungated body, so it must also name the feature-off case, which becomes the common one | `framwork/.codeadd/commands/add.review.md` |
| Q12 | The `add.review` row in the command table (line ~123) says *"self-gating on the `/add.qa-setup` receipt"* — receipt only. It gains the feature. This is a different row from Q7's Features table row | `framwork/.codeadd/skills/add-ecosystem/SKILL.md` |
| Q13 | The pinned node total moves — a new fragment file is a new node. The count and one ledger comment naming this plan are updated, in the running ledger the file already keeps | `cli/tests/build-artefact-graph.test.js` |
| Q14 | `@qa-agent` is read-only, and this gate walks `DISPATCHES` edges into read-only agents looking for a file `Output:`. Moving STEP 10.1's dispatch block into a fragment moves that edge's origin from the command node to the fragment node. Confirm the gate still reaches it; extend its walk if not | `cli/tests/agent-capability.test.js` |

### Does NOT Include

- The judge rubric, the severity taxonomy, the dual-judge method or the report schema — all owned by
  `add-qa` and untouched. **What** the judges do does not change; **whether** they are dispatched
  does.
- `qa-validation-NNN.md`'s schema, and `qa-evidence.sh` / `converge-gates.sh`, which consume it.
- The `playwright` plugin split. *"Enabling the plugin does not enable the pipeline"* stays true and
  gets cleaner: the plugin adds live driving to a judge the feature decides exists.
- `@qa-agent` and `@ux-agent` definitions.
- The correction leg in `add.build` STEP 12, already feature-gated.

## Key Decisions

| Decision | Rationale | Validated |
|---|---|---|
| Judgement moves under `qa-pipeline` | Its input is authored by `@e2e-agent`, which the feature gates. Ungated judgement over gated evidence is not a capability, it is a broken state the command walks into | ✅ |
| The `/add.qa-setup` receipt is kept, not replaced | It answers configuration, which the feature flag cannot: `baseUrl`, `config.json`, reachability. Two gates, two questions | ✅ |
| Preflight row 1 is deleted rather than re-graded | A step that only exists when the feature is on cannot usefully probe whether the feature is on | ✅ |
| A project with the receipt and the feature off loses QA judgement | This is the real behaviour change, and it is the point. Today that project nominally "keeps its judgement" and actually receives a coverage blocker per screen | ✅ |
| No new mechanism is introduced | `tdd-pipeline` already declares `add.review` and ships `fragments/tdd-pipeline/add.review.md`. This is a missing registration, not a new capability | ✅ |
| Option A is recorded as viable and not taken | It would also remove the contradiction, at lower cost, by making the OFF branch skip judgement. It was rejected on the grounds that the resulting path only works with the plugin installed | ✅ |

## Ecosystem Impact

Product layer throughout, so every F-block tags `[product]` — `cli/` included, per the layer rule in
`CLAUDE.md`.

| Component | Impact | Action |
|---|---|---|
| `cli/src/features.js` | `qa-pipeline.commands` gains a fourth consumer | Q1 |
| `fragments/qa-pipeline/add.review.md` | New file | Q2 |
| `commands/add.review.md` | Several empty marker pairs, none spanning the playwright anchor; the governing statement; preflight row 1; STEP 9.3's OFF bullet; STEP 11's Quality Gate Report row, which stays ungated | Q3, Q4, Q5, Q6, Q11 |
| `skills/add-ecosystem/SKILL.md` | Two separate rows: the Features table row, and the `add.review` command-table row that names only the receipt | Q7, Q12 |
| `CLAUDE.md` | Feature Injection System table. **Not a graph node** — no gate covers it, so it is checked by hand | Q8 |
| `commands/add.qa-setup.md` | STEP 2's feature-off sentence is silent on `add.review` | Q9 |
| `skills/add-qa/SKILL.md` | Owns the canonical "Feature vs plugin" statement that every consumer references instead of restating | Q10 |
| `plugins/playwright/fragments/add.review.md` | None — but its anchor at `add.review.md:840` constrains Q2's shape and must stay unwrapped | none (constraint) |
| `cli/tests/loop-consolidation-0070.test.js` | Asserts `qa-pipeline` gates *"plan and build only"* — that assertion becomes false and must move with the change. Its `EXPECTED_MAP` also pins the playwright injection point Q2 must leave intact | Q1 (consequential) |
| `cli/tests/build-artefact-graph.test.js` | Pins the node total against a running ledger of every artefact ever added or removed. A new fragment moves it | Q13 |
| `cli/tests/agent-capability.test.js` | Walks `DISPATCHES` edges into read-only agents; `@qa-agent` is one, and its edge origin moves to the fragment | Q14 |

**Caller list derived from the graph**, not from search — `impact` over the touched artefacts, per
the gate this session's companion design proposes for exactly this step.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| The feature governs the whole QA flow, so on/off means one thing | The nominal ability to judge QA with the pipeline disabled — which did not work |
| A project with the feature off gets a command with no QA steps, instead of QA steps that cannot run | |
| Preflight stops carrying the command into a state with no fallback | |
| The line-640 sentence stops contradicting the command's own STEP 9 | |

| Risk | Probability | Mitigation |
|---|---|---|
| A project today running `add.review` with the receipt and the feature off loses QA on upgrade | **High — this is the intended change, not a side effect** | It loses a path that produced a coverage blocker per screen. The remedy is one command, `codeadd features enable qa-pipeline`, and Q4's rewritten statement is where a reader finds it |
| `loop-consolidation-0070.test.js` fails | Certain | Named in Ecosystem Impact as consequential to Q1. Its assertion is the old boundary and moves with it |
| STEPs 8-10 are large; extracting them into a fragment risks losing content, or producing a marker pair the build refuses | Medium | The precedent for a multi-section extraction is `fragments/tdd-pipeline/add.build.md`, which carries **eight** section pairs. It is NOT `fragments/tdd-pipeline/add.review.md` — that one is two pairs and purely additive, a new STEP 3.5 that never existed in the base body, so it never had to migrate content around a pre-existing nested marker. `assertEmptyMarkerPairs` in `scripts/build.js` is what catches a mistake here, at build time, loudly |
| `CLAUDE.md` drifts | Medium | It is not a graph node and no gate covers it. Q8 is an explicit item for that reason |
| Option A turns out to have been the better call | Low | Recorded above with its rationale, so reversing is a documented decision rather than an excavation |

## Next Steps

Run: `/add-framework--plan qa judgement under the qa-pipeline feature`
