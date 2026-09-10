# Plan: Prompt Quality Ruler — an eight-item ruler with examples, a reviewer that ticks it with evidence, and a path from audit to plan

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-10

---

## Context

The internal layer's quality rules live in a checklist nobody ticks, copied into the build command,
with no example of a pass or a fail. Nothing checks ambiguity inside one artefact, nothing checks the
contract a STEP has with the agent it dispatches, and an audit of an existing command has no path
into a plan the build can execute.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-10T163952-prompt-quality-ruler.md` | The eight ruler items and their pass conditions (§ Part 1); the agent's input contract, method, output shape and verdict table (§ Part 2); the two dispatch points and the third reader's count (§ Part 3); the "3 + N" report-count rule; the rejected alternatives; the risks |

Three decisions were taken in the planning questionnaire and are not in the design:

| Question | Decision |
|---|---|
| When does `/add-framework--plan` dispatch the audit? | Only when an internal artefact is the **subject** of the request — the thing being analysed, adjusted or refactored — never for an artefact the change touches in passing |
| The two "max 10 words per description" bullets in `add-framework-development` | Removed in this plan. The build loads that skill and `building-commands` in the same F-block; from the merge on, the author would hold two contradicting rules |
| Ruler item 1, "no phantom edge", when the MCP exposes no build warnings | The agent compares the `neighbors` output with the artefact's body: every outgoing edge's target is named in the body, every artefact named in the body has an edge. The build's own STEP 6 keeps emitting the real warning |

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` — exit 0, no new warning (`add-framework--build` STEP 6)
- "No item measures size. Not characters, not lines, not words." (design § Part 1)
- "The adversarial reviewer runs exactly once per subject." (`add-review-discipline` § The Counts)
- "Neither dispatch writes a file, and neither may be asked to." (`add-review-discipline` § Nothing Reaches Disk)
- `uses:` targets resolve inside the declaring artefact's own layer (`add-framework-development`, "Declaring Relationships — the `<!-- uses: -->` Block") — the agent file lands before any `uses:` declares it
- The build keeps ten STEPs numbered 1..10 with no gap, and keeps the text "exactly once" (`cli/tests/review-no-loops.test.js` L2.7, L2.4) — this plan adds sub-steps, never a STEP
- The cli suite runs serially: `cd cli && npx vitest run --no-file-parallelism` — "Never accept a green parallel run as proof." (`add-framework-product-layer`, the cli suite). Every pre-existing suite stays green
- "The dispatch works" for a newly created agent is validation **after the merge**, not of the build that creates it (project memory, observed on `plan-readback-agent`, 2026-09-09)

## Problem

1. **The quality rules cannot be ticked** — `building-commands` § Validation Checklist is prose with no pass/fail example; two readers apply it two ways; no reader shows evidence.
2. **Two owners of one list** — `add-framework--build` STEP 3 carries a partial copy of that checklist; the skill and the command drift independently.
3. **Nothing checks ambiguity inside one artefact** — duplicate headings (`add-framework-development` has two `## 8.`), STEP-to-STEP contradiction, a rule with two owners. Every existing gate is cross-artefact.
4. **Nothing checks the contract with the neighbours** — the graph proves the edge; nothing proves a STEP sends what the agent's Input Contract names, or expects back the shape the agent returns.
5. **The reviewer role exists without a rubric** — `add-framework--build` STEP 7.1 auditor 4 "Quality" is a generic subagent handed a skill name.
6. **An audit has no path into a plan** — a finding on an existing command is a chat message; the build has nothing to execute, the review nothing to confirm.
7. **Two skills loaded together will contradict each other the day the ruler ships** — `add-framework-development` lines 210 and 654 impose a word limit; the ruler forbids any size criterion.

## Proposal

Deliver the mechanism, in this order: the tests first and RED, then the ruler, then the agent, then
everything that names the agent. The agent file must exist before a `uses:` block declares it or
`build.js` fails on a dangling reference; the ruler must exist before any neighbour points at
`## The Ruler` by name.

The mechanism's three parts are the design's Part 1, Part 2 and Part 3. What this plan adds is the
sequencing, the proof, and the four one-line edits the design's Ecosystem Impact table names in
neighbouring skills.

## Current State

| Artefact | Role today | Direct dependants (`impact --depth 1`) |
|---|---|---|
| `.claude/skills/building-commands/SKILL.md` | Holds the Validation Checklist (lines 395-441) and a Refactoring Workflow whose STEP 2 says "Run the Validation Checklist below" (line 380) | `add-framework--build`, `add-framework-development`, `add-framework-internal-layer`, `add-framework-product-layer` — 4, HIGH |
| `.claude/commands/add-framework--build.md` | STEP 3 copies the checklist (lines 217-234); STEP 7.1 dispatches four generic auditors and names the literal count in its heading, its dispatch line, its wait gate and four times in its Agent Dispatch Rules | `add-framework--done`, `add-framework--plan`, `building-commands` — 3, HIGH |
| `.claude/commands/add-framework--plan.md` | STEP 3 asks the graph and the delivery index; no audit of the artefact the idea names | `add-framework--brainstorm`, `add-framework--build` — 2, MEDIUM |
| `.claude/skills/add-review-discipline/SKILL.md` | Reader table with two rows under a heading "Two Readers, Two Different Questions"; `uses:` declares two agents | `add-framework--brainstorm`, `add-framework--build`, `add-framework--plan`, `add-plan-authoring` — 4, HIGH |
| `.claude/skills/add-framework-internal-layer/SKILL.md` | Line 99: "passes the `building-commands` checklist" | `add-framework--build` — 1, MEDIUM |
| `.claude/skills/add-framework-product-layer/SKILL.md` | Line 87: "DO NOT: Apply the building-commands checklist to JavaScript" | `add-framework--build` — 1, MEDIUM |
| `.claude/skills/add-framework-development/SKILL.md` | Lines 210 and 654: "max 10 words per description" | `add-framework--build`, `add-framework-internal-layer`, `add-framework-product-layer` — 3, HIGH |
| `.claude/agents/plan-review-agent.md` | The mould: `model: sonnet`, `memory: project`, no tool restriction, READ-ONLY by rule | not edited |
| `CLAUDE.md` | "Where the details live" table; not a graph node | not edited by any gate |

## Scope

### Includes

- **F1** [product] — `cli/tests/prompt-quality-ruler.test.js`: the RED matrix, levels L1 to L3 below,
  written before any other F-block and observed failing. Tagged `product` because `cli/` is the
  product layer; `add-framework-product-layer` loads on this block and its serial-suite rule governs
  every run of the matrix. Copy the idiom of
  `cli/tests/review-no-loops.test.js`: one `P = { ... }` object of literal paths keyed by role, the
  frontmatter/body regex split, `read()` guarded by `exists()` for the file that does not exist yet.
  Mark every assertion that passes on the pre-plan tree as a guard.

- **F2** [internal] — `.claude/skills/building-commands/SKILL.md`: replace `## Validation Checklist`
  with `## The Ruler` — the eight items, in two families, each with one **Expected** and one **Not
  expected** snippet quoted verbatim from a repository file at the time of writing, with no
  `file:line` pointer (design § Part 1). Rewrite the Refactoring Workflow's STEP 2 (line 380) to
  "tick the ruler yourself". Must NOT lose: every line of the old checklist folds into item 2, 3 or 4,
  or is dropped with a ruling in the ledger saying why; the Command Structure, gate format, Rules
  format, "No `## Spec`" section, Common Mistakes table and the closing-step rule stay as they are.
  Must NOT contain: any numeric limit on words, lines or characters.
  - **Produces:** `## The Ruler` — the heading, and items numbered 1 to 8

- **F3** [internal] — `.claude/agents/prompt-review-agent.md`: create, from the `plan-review-agent`
  mould — `model: sonnet`, `memory: project`, no `tools:` and no `disallowedTools:` key, READ-ONLY
  stated in the body. Body: the input contract, the method, the output shape, the verdict table, the
  "MCP unavailable" rule and the never-grep rule, exactly as design § Part 2, plus the item-1
  comparison rule from this plan's Context table. Its `uses:` declares `skill: building-commands` (it
  loads the ruler) and a `mention:` for every command it names in prose. Must NOT: write any file,
  dispatch any agent, read a neighbour deeper than depth 1.
  - **Consumes:** `## The Ruler` (F2)
  - **Produces:** `@prompt-review-agent` — input `node` + `mode: audit | delivery`; output the ticked
    ruler with per-item evidence, findings with `high | medium | low`, verdict `ok | fix-then-ok |
    blocked`

- **F4** [internal] — `.claude/skills/add-review-discipline/SKILL.md`: a third row in the reader
  table for `@prompt-review-agent` ("Does this artefact say one thing, once, where it belongs, and
  does it match its neighbours?" → a ticked ruler and a verdict); the section heading "Two Readers,
  Two Different Questions" renamed so it no longer states a count that is wrong; The Counts gains the
  rule "once per revision of the artefact — the `audit` read in the plan and the `delivery` read in
  the build are two revisions of one file; a second `delivery` read over the same build's fixes is
  not"; the `IF A REPORT HAS ALREADY COME BACK FOR THIS SUBJECT` block covers the new reader; `uses:`
  gains `agent: prompt-review-agent`. Must NOT lose: the two existing counts, the Nothing Reaches Disk
  section, the Common Rationalizations table.
  - **Consumes:** `@prompt-review-agent` (F3)

- **F5** [internal] — `.claude/commands/add-framework--build.md`: (a) STEP 3 — the table row for
  `building-commands` reads "ANY F-block writing a `.md` command, skill **or agent**", and the
  `### building-commands Checklist` block (lines 217-234) is replaced by one line: load
  `building-commands`, apply `## The Ruler` to every `.md` the block writes. (b) STEP 7.1 — auditor 4
  becomes a named dispatch of `@prompt-review-agent`, `mode: delivery`, one call per `.md` command,
  `SKILL.md` or agent in the build's diff, in parallel with auditors 1-3; the report count becomes
  **3 + N**; the coordinator lists every dispatch before waiting; the gate reads `IF ANY DISPATCHED
  AUDITOR HAS NOT REPORTED`; when N is zero auditor 4 is not dispatched; every literal "four" / "4
  AGENTS" / "all four" in STEP 7 and its Agent Dispatch Rules goes (design § Part 3, "The report
  count stops being four"). (c) `uses:` gains `agent: prompt-review-agent`. (d) In THIS plan's own
  build, if the engine cannot address the new agent by name, dispatch a generic read-only subagent
  carrying the agent file's body as its prompt and record a ruling — the named dispatch is proven
  after the merge (Global Constraints). Must NOT lose: the text "exactly once"; ten STEPs numbered
  1..10; 7.2, 7.3 and 7.4 unchanged; the top-of-file gate `IF building-commands NOT LOADED`.
  - **Consumes:** `## The Ruler` (F2); `@prompt-review-agent` (F3)

- **F6** [internal] — `.claude/commands/add-framework--plan.md`: (a) STEP 3 gains sub-step 3.4 —
  when the idea's **subject** is an internal command, skill or agent (the thing being analysed,
  adjusted or refactored — not an artefact the change touches in passing), dispatch
  `@prompt-review-agent`, `mode: audit`, on it; an artefact named only in passing is not audited.
  (b) STEP 4 "What already exists" shows the ticked ruler when one came back. (c) STEP 5 gains the
  rule: every `❌` item becomes an F-block carrying the item number, the evidence and the fix, and that
  F-block's per-block validation names the item; an `ok` is reported and yields no F-block. (d)
  `uses:` gains `agent: prompt-review-agent`. Must NOT lose: STEP 3.2 and 3.3 as written; the seven
  STEPs; the STOP at STEP 4.
  - **Consumes:** `@prompt-review-agent` (F3)

- **F7** [internal] — two one-line edits pointing at the new name:
  `.claude/skills/add-framework-internal-layer/SKILL.md` line 99 ("passes the `building-commands`
  checklist" → "passes `## The Ruler` of `building-commands`") and
  `.claude/skills/add-framework-product-layer/SKILL.md` line 87 ("the building-commands checklist" →
  "`building-commands`' ruler"). Nothing else in either file changes.
  - **Consumes:** `## The Ruler` (F2)

- **F8** [internal] — `.claude/skills/add-framework-development/SKILL.md`: remove the word limit in
  two places — line 210 becomes "JSON minified, no decorative formatting"; the bullet at line 654
  ("Max 10 words per description in technical specs") is deleted. Nothing else in the file changes;
  the duplicate `## 8.` headings stay for the first audit of this skill to find.

- **F9** [internal] — `CLAUDE.md`: one row in "Where the details live": "The prompt quality ruler —
  eight items, and the reviewer that ticks them" → `building-commands`. No other line changes; the
  generated inventory block is not touched by hand.

- **F10** [product] — `cli/tests/build-artefact-graph.test.js`: the node inventory snapshot moves
  with F3 — agent 29 → 30, nodes 215 → 216, declares 103 → 104 — with a comment naming this plan.
  **Opened during the build, not planned.** F3 creates an agent, and that tripwire counts agents; it
  is a `[product]` path so it cannot ride in F9's `[internal]` commit. Nothing else in the file
  changes.
  - **Consumes:** `@prompt-review-agent` (F3)

### Does NOT Include (important!)

- The distributed artefacts in `framwork/.codeadd/`. A port of the ruler to the product layer is its
  own plan, after this mechanism has run for real. The one `[product]` block here, F1, is a test file
  under `cli/tests/`, not a distributed artefact.
- Fixing the existing internal artefacts. Each becomes its own plan through F6's audit dispatch. F8
  is the one exception, because the contradiction is created by this plan, not found by it.
- Any numeric limit on any artefact.
- Changes to `scripts/build.js` gates or to the MCP server. Family A consumes what exists.
- Cross-layer edges.
- Changes to `plan-readback-agent` or `plan-review-agent`.
- The stale `.fnd/scripts/log-iteration.sh` path at `building-commands` line 361, and that skill's
  description naming `/add.build` — both are the first audit's to find, not this plan's to fix.
- Proving the named dispatch of the new agent inside this build (Global Constraints).

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Who ticks, and when | Author writes against the ruler; the reviewer ticks it once, as STEP 7.1 auditor 4 | design § Key Decisions rows 1-2, 9 |
| Per-F-block gate or once after the last F-block | Once, after the last F-block | design § Alternatives considered |
| Where the audit-to-plan path lives | `/add-framework--plan` STEP 3, not a new command | design § Alternatives considered |
| When the plan dispatches the audit | Only when the artefact is the subject of the request | this plan, Context table |
| Family A source | The MCP; an unavailable MCP is reported, never replaced by grep | design § Key Decisions row 3 |
| Item 1 without build warnings | `neighbors` output compared against the body | this plan, Context table |
| Examples | Quoted snippets, never `file:line` | design § Key Decisions row 4 |
| Verdict semantics | `blocked` only for item 4 / item 6 needing a human decision | design § Key Decisions row 6 |
| Reader count | Once per revision; `audit` and `delivery` are two revisions | design § Key Decisions row 7 |
| STEP 7 report count | 3 + N, gated on the dispatch list | design § Key Decisions row 8 |
| The word limit in `add-framework-development` | Removed here | this plan, Context table |
| Ruler section name and the references to it | `## The Ruler`; three one-line references follow | questionnaire § 3 |
| N counts what | Commands, `SKILL.md` files and agents; a `references/*.md` is read with its owning skill | questionnaire § 3 |
| Agent frontmatter | `model: sonnet`, `memory: project`, no tool restriction, READ-ONLY by rule | design § Part 2, mould `plan-review-agent` |
| Named dispatch proof | After the merge | project memory, `plan-readback-agent` 2026-09-09 |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A rubric two readers apply the same way, with evidence | Calling prose "quality" without showing where it fails |
| A path from "this command is inconsistent" to a plan the build executes | Ad-hoc chat audits |
| One owner for the checklist | Seeing the list inside the build command |
| Earlier catching, at plan time, for refactors | Same-commit fixes for new artefacts; STEP 7 lands them in the review commit |
| A reviewer that reads the neighbourhood | Tokens per review; bounded at depth 1 |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Item 7 is subjective; the reviewer marks reinforcement as repetition | Medium | F2's quoted pair for item 7 and its reinforcement rule; F5 keeps 7.3, where the caller judges before applying |
| The named agent is not addressable in the build that creates it | High | F5 (d): generic read-only dispatch carrying the agent body, ruling recorded; L4.2 proves the name after the merge |
| A literal "four" survives somewhere in STEP 7 and the gate waits forever on N > 0 | Medium | L3.7 asserts no literal count remains; L3.8 asserts "exactly once" and ten STEPs survive |
| The agent's `uses:` names a command the build resolves as dangling | Low | L1.1 — `build.js` exit 0; F3 declares `mention:` for every command it names |
| The gate cries wolf and gets disabled | Low | F3's verdict table: `blocked` for item 4 / 6 decisions only |
| The MCP is not connected in a session | Low | F3's "not verified — MCP unavailable" rule; verdict cannot be `ok`; L3.5 asserts the rule is in the body |
| An old checklist line is silently dropped | Medium | F2's "fold or rule" requirement; L3.2 asserts the old items' subjects (LANG header, `## Spec`, STEP not Phase, ALWAYS/NEVER, `{{cmd:}}`, intent-based dispatch) still appear inside `## The Ruler` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/prompt-quality-ruler.test.js` | product | create | the RED matrix (F1) — `cli/` is the product layer |
| `cli/tests/build-artefact-graph.test.js` | product | modify | the node inventory snapshot moves with the new agent (F10) |
| `.claude/skills/building-commands/SKILL.md` | internal | modify | the ruler replaces the checklist; Refactoring Workflow STEP 2 (F2) |
| `.claude/agents/prompt-review-agent.md` | internal | create | the reviewer (F3) |
| `.claude/skills/add-review-discipline/SKILL.md` | internal | modify | third reader, count, heading, `uses:` (F4) |
| `.claude/commands/add-framework--build.md` | internal | modify | STEP 3 delegation, STEP 7.1 named auditor, 3 + N gate, `uses:` (F5) |
| `.claude/commands/add-framework--plan.md` | internal | modify | STEP 3.4 audit dispatch, STEP 4 and 5 rules, `uses:` (F6) |
| `.claude/skills/add-framework-internal-layer/SKILL.md` | internal | modify | one line, the reference name (F7) |
| `.claude/skills/add-framework-product-layer/SKILL.md` | internal | modify | one line, the reference name (F7) |
| `.claude/skills/add-framework-development/SKILL.md` | internal | modify | two lines, the word limit removed (F8) |
| `CLAUDE.md` | internal | modify | one row in "Where the details live" (F9) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 writes every level below before any other F-block lands and verifies
each fails against the current tree. Then F2-F9 drive them GREEN.

### L1 — Build-side (RED → GREEN)

1. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 with no new warning after every F-block,
   measured against the baseline taken before F1. *RED between F3 and F5/F6 is expected if a
   dispatcher's `uses:` lands before the agent file — the execution order prevents it.*
2. `cd cli && npx vitest run --no-file-parallelism` is green: every pre-existing suite plus
   `prompt-quality-ruler.test.js`. Serial, never the parallel `npm test`.

### L2 — Graph

1. `node scripts/graph.js impact internal/agent/prompt-review-agent --depth 1` returns exactly
   `internal/command/add-framework--build`, `internal/command/add-framework--plan` and
   `internal/skill/add-review-discipline`. *RED today: no such node.*
2. `node scripts/graph.js dependencies internal/agent/prompt-review-agent --depth 1` includes
   `internal/skill/building-commands` via `USES_SKILL`. *RED today: no such node.*
3. `node scripts/graph.js orphans` lists no internal artefact after F9 that it did not list before F1.

### L3 — Content assertions (`cli/tests/prompt-quality-ruler.test.js`)

1. `building-commands` has a `## The Ruler` heading and no `## Validation Checklist` heading; the
   section carries items 1 to 8 in order, and each item carries both an "Expected" and a "Not
   expected" marker. *RED today: the heading is absent and the old one is present.*
2. Inside `## The Ruler`, the subjects of the old checklist survive: LANG header, `## Spec`, STEP not
   Phase, ALWAYS/NEVER, `{{cmd:`, intent-based dispatch. *RED today: the section is absent.*
3. No line of `building-commands` matches a size limit — a number followed by `words`, `lines`,
   `chars` or `characters`, in any case, outside a code fence. *Guard: passes today; must survive F2.*
4. The Refactoring Workflow's STEP 2 names the ruler and no longer says "Validation Checklist". *RED
   today.*
5. `.claude/agents/prompt-review-agent.md` exists; its frontmatter carries `model: sonnet` and
   `memory: project` and carries neither a `tools:` nor a `disallowedTools:` key; its body contains
   `READ-ONLY`, names `neighbors`, `dependencies` and `impact`, states both modes `audit` and
   `delivery`, carries the three verdicts `ok`, `fix-then-ok`, `blocked`, contains the phrase `not
   verified` for the MCP-unavailable case, and contains no instruction to use `Write` or `Edit`. *RED
   today: the file does not exist.*
6. The agent's `uses:` block declares `- skill: building-commands`. *RED today.*
7. `add-framework--build`: the STEP 3 body has no `### building-commands Checklist` heading and its
   table row names `agent`; the STEP 7 body contains `@prompt-review-agent` and `delivery`; neither
   the STEP 7 body nor its Agent Dispatch Rules contain `FOUR`, `4 AGENTS`, `all four` or `four
   reports` in any case; the `uses:` block declares `- agent: prompt-review-agent`. *RED today on
   every clause.*
8. `add-framework--build` still contains `exactly once` and its STEP map still numbers 1..10 with
   every heading present. *Guard: passes today; must survive F5.*
9. `add-framework--plan`: a `### 3.4` heading exists in STEP 3 whose body contains
   `@prompt-review-agent` and `audit` and the word `subject`; STEP 5 mentions `❌` and `F-block` on
   one line; the `uses:` block declares `- agent: prompt-review-agent`. *RED today.*
10. `add-review-discipline`: the reader table has three rows and one names `@prompt-review-agent`; no
    heading contains `Two Readers`; The Counts contains `per revision`; the `uses:` block declares
    `- agent: prompt-review-agent`. *RED today on every clause.*
11. `add-review-discipline` still states the two existing counts ("exactly once per subject", "at most
    twice per subject"). *Guard: passes today; must survive F4.*
12. `add-framework-internal-layer` line-level: the Coherence checklist names `The Ruler`;
    `add-framework-product-layer`: the `cli/` gate names the ruler and no longer says
    `building-commands checklist`. *RED today.*
13. `add-framework-development` contains no `max 10 words` in any case. *RED today: two hits.*
14. `CLAUDE.md`: the "Where the details live" table has a row naming `building-commands` and
    containing `ruler`. *RED today.*
15. `plan-readback-agent.md` still carries `tools: Glob, Read` and no `memory:` key;
    `plan-review-agent.md` still carries `memory: project`. *Guard: passes today; this plan must not
    touch either.*

### L4 — Behavioural acceptance

1. **In this build, STEP 7:** auditor 4 runs in `delivery` mode over every `.md` this plan writes —
   `building-commands`, the agent itself, `add-review-discipline`, `add-framework--build`,
   `add-framework--plan`, the two one-line skills, `add-framework-development` — by name if the
   engine addresses it, otherwise as a generic read-only subagent carrying the agent body. The ledger
   records, per artefact, the verdict and the count of ticked items, and a ruling naming which
   mechanism dispatched it. A `blocked` on item 4 or 6 stops for the user like any other decision.
2. **After the merge, first real use:** `/add-framework--plan` with an internal artefact as its subject
   (the design names `.claude/commands/add-framework--build.md`) dispatches `@prompt-review-agent`
   **by name** and produces a plan whose F-blocks cite ruler items with evidence. This is the
   acceptance of the mechanism, recorded in that plan's own ledger. It is not a gate on this
   delivery's close-out.

**RED expectations against the current tree:** L2.1, L2.2 and every L3 item not marked *Guard* fail
today. L3.3, L3.8, L3.11 and L3.15 pass today and exist to catch collateral damage.
**GREEN = all levels pass after F1–F10, with L4.2 deferred to after the merge.**

---

## Execution Order

1. **F1** [product] — the test matrix, RED against the current tree. The only product-tagged block;
   it loads `add-framework-product-layer` and nothing else in the plan does.
2. **F2** [internal] — the ruler. First because every later F-block names `## The Ruler`.
3. **F3** [internal] — the agent. Before any `uses:` declares it, or `build.js` fails on a dangling
   reference. The agent is an orphan at this point; that is expected.
4. **F4** [internal] — the discipline. First dispatcher-side change; the agent stops being an orphan.
5. **F5** [internal] — the build command.
6. **F6** [internal] — the plan command.
7. **F7** [internal] — the two one-line references.
8. **F8** [internal] — the word limit.
9. **F9** [internal] — `CLAUDE.md`.
10. **F10** [product] — the node inventory snapshot. Opened during the build; it could have ridden
    with F3, which is what broke it, and landing it here cost one extra commit.

**Working-state boundaries:** after F2 (a skill with a new section, no dependant yet pointing at it
by the new name — the old references still read "checklist", which is a stale name, not a broken
build); after F3 (an orphan agent, build clean); after F6 (the mechanism is wired end to end); after
F9 (complete). A build that must stop stops after F3 or after F6.

**Per-F-block validation beyond the layer default:** F2 — L3.1 to L3.4; F3 — L3.5, L3.6, L2.2; F4 —
L3.10, L3.11; F5 — L3.7, L3.8; F6 — L3.9; F7 — L3.12; F8 — L3.13; F9 — L3.14. L2.1 and L2.3 after
F6 and again after F9. L3.15 after every block.

## Reviewer Handoff

For each F-block the build must leave, in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A line of the old Validation Checklist that vanished without a ruling naming it (F2).
3. A literal count left in STEP 7 of the build — "four", "4", "all four" — in a sentence the L3.7
   regex did not anticipate (F5).
4. A ruler item carrying a number that reads as a limit (F2, L3.3 is a regex and regexes miss things).
5. The agent body instructing a read of a neighbour deeper than depth 1, or a grep fallback (F3).
6. The plan command's 3.4 phrased so that every named artefact triggers the audit, not only the
   subject (F6).

## References

- Design set: `docs/brainstorming/2026-09-10T163952-prompt-quality-ruler.md`
- Prior art this plan builds on: `2026-09-09T163448-PLAN--final-report-shape` — the four-level
  validation matrix over prose; `2026-09-09T090201-PLAN--review-no-loops` — the reader table, the
  counts, the test idiom; `2026-09-09T061636-PLAN--plan-review-agent-speed` — the agent mould.

---

## Next Steps

/add-framework--build prompt-quality-ruler

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-10 | Initial creation |
| 2026-09-10 | Build: F10 added — `cli/tests/build-artefact-graph.test.js`, the node inventory snapshot, which F3 broke by creating an agent. A `[product]` path cannot ride in F9's `[internal]` commit |
| 2026-09-10 | Implemented in commits ae81d3e..5c3d2db on `feat/prompt-quality-ruler`. STEP 7 applied eight audit findings as F11 (the reviewer's own four) and F12 (two dead paths); four were rejected and are recorded in the ledger as the follow-up plan's candidates |
| 2026-09-10 | Review (fix-then-ok): F1 retagged `[product]` — `cli/` is the product layer — and Layers set to `both`; cli suite cited as the serial run `npx vitest run --no-file-parallelism`; `uses:` constraint cites the heading text instead of an ambiguous "§ 8"; STEP 7 count description corrected |
