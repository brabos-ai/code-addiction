# Brainstorm: Prompt Quality Ruler

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-10
> **Type:** architecture — one skill section, one new agent, three command/skill edits (internal layer)

## Discovery

- **`building-commands` § Validation Checklist** (`.claude/skills/building-commands/SKILL.md:395-441`)
  — the only place that lists what a good command looks like. Every item is prose; nothing runs it,
  nothing ticks it. It carries no example of a passing or failing snippet.
- **`add-framework--build` STEP 3** (`add-framework--build.md:217-234`) — carries a partial copy of
  that checklist under the heading "building-commands Checklist". Two owners of one list.
- **`add-framework--build` STEP 7.1, auditor 4 "Quality"** — a generic read-only subagent that reviews
  "the `.md` artefacts against `building-commands`", once, after the last F-block, in parallel with
  three other auditors. The reviewer role already exists; it has no rubric with examples, no graph
  neighbourhood, and no ticked output.
- **`add-framework-internal-layer` § Coherence** — delegates correctly: "passes the
  `building-commands` checklist". The right shape, pointing at the wrong-shaped target.
- **`add-review-discipline`** — owns how many times each reader runs (adversarial reviewer once per
  subject, cold reader at most twice), that neither writes a file, and that a finding is judged
  before applied. Its reader table has two rows. A third reader must be registered there or the
  discipline has an undeclared exception.
- **`plan-readback-agent`** — already accepts "a command, a skill" as input, but no command dispatches
  it over a prompt artefact. It answers a different question (what would a cold reader build) and
  stays untouched.
- **`scripts/build.js` `checkArtefactGraph`** — already FAILS on a dangling `uses:` reference, an
  unregistered artefact, a name in prose with no declared relationship, and a distributed artefact
  naming an internal command. WARNS on a declared-but-never-named edge. Structural coherence between
  artefacts is a build gate today.
- **Artefact-graph MCP** (`.mcp.json` → `scripts/artefact-graph-mcp.js`) — `neighbors`,
  `dependencies`, `impact`, `path`, `orphans`, `stats`, `history` answer by node id or unambiguous
  bare name. Verified in this session on `internal/command/add-framework--brainstorm`: six declared
  edges with types, dependencies to depth 4, impact of a skill listing its dependants. Constraint:
  every `uses:` target resolves inside the declaring artefact's own layer; there is no cross-layer
  edge.
- **`add-doc-schemas` Output Length Doctrine** — numeric advisories in rules that constrain agent
  output are prohibited. The `final-report-shape` delivery turned "is this artefact good" into a
  four-level validation matrix (build clean / `graph.js impact` with a named expected set / grep
  content assertions / one live run). That is the shape "measurable" takes in this repository.
- **Delivery index** — `graph.js history` records deliveries for `add-review-discipline`
  (review-no-loops), `plan-review-agent` (plan-review-agent-speed) and `add-framework--build`
  (claude-md-inventory-block). None for `building-commands`, `add-framework-development`,
  `add-plan-authoring`, `plan-readback-agent` or `add-framework--brainstorm`. No prior attempt at a
  prompt-quality gate is on record.
- **Live findings that motivate the ruler:** `add-framework-development/SKILL.md` has two `## 8.`
  headings (lines 649 and 684); the checklist duplication above. Both would be caught by the ruler
  and neither is caught by anything today.

## Context & Motivation

The internal layer is 7 commands, 9 skills and 7 agents, and the three largest files are 756, 581 and
565 lines. Every one of them is a prompt that another model executes. When a STEP is ambiguous the
executor picks a reading; when two STEPs claim the same decision the executor picks one; when a
command describes a neighbour's contract wrongly the executor trusts the description. None of that
fails a build. It fails a session, later, in a way that looks like the model's fault.

The repository already has the deterministic half: `build.js` proves the `uses:` block matches the
prose, and the graph answers who depends on whom. What it lacks is the critical half — does the text
say one thing, once, in the place that owns it, and does it match what its neighbours actually do —
written down as criteria a reviewer can tick with evidence.

## Problem / Opportunity

1. **The quality rules exist but cannot be ticked.** The `building-commands` checklist has no
   example of a pass or a fail, so two readers apply it differently, and no reader is asked to show
   evidence.
2. **Nothing checks ambiguity inside one artefact** — STEP-to-STEP contradiction, duplicate
   numbering, a rule with two owners. Every existing gate is cross-artefact (graph) or cross-run
   (setup contract).
3. **Nothing checks the contract with the neighbours.** The graph proves the edge exists; nothing
   proves the STEP sends what the agent says it receives, or expects back what the agent returns.
4. **The reviewer role exists without a rubric.** STEP 7.1 auditor 4 is dispatched with the skill
   name and nothing else.
5. **An audit of an existing artefact has no path into a plan.** A finding today is a chat message;
   the build has nothing to execute and the review nothing to confirm.

## Proposed Solution

One mechanism in three parts, delivered together.

### Part 1 — The ruler, in `building-commands`

A new section replacing the current Validation Checklist. Eight items in two families. Each item
carries one **expected** and one **not expected** snippet, quoted verbatim from the repository at the
time of writing, never as a `file:line` pointer (pointers rot when the file changes; a quote stays
true to what it illustrates).

**Family A — deterministic.** The answer is yes or no, with no judgement.

| # | Item | Passes when |
|---|------|-------------|
| 1 | Graph closed | `neighbors` on the artefact lists every dispatched agent, loaded skill, handed-off command and script; the build emits no phantom-edge warning for it; nothing named in prose is undeclared |
| 2 | References resolve | Every "return to STEP X.Y", "load skill Z", `references/foo.md` and heading number points at something that exists; every heading and STEP number is unique in the file |
| 3 | Mandatory form | STEP not Phase; `[HARD STOP]` marked where the flow stops; `## Rules` as ALWAYS/NEVER; no `## Spec`; no raw `.codeadd/` path; LANG header; sequential integer STEP numbers |

**Family B — critical.** The reviewer reads and judges; every failure carries a line and a quoted
snippet.

| # | Item | Passes when |
|---|------|-------------|
| 4 | Contract with neighbours | What a STEP sends to an agent is what the agent's Input Contract names; what the STEP expects back is the shape the agent returns; what the artefact says about a neighbour is what the neighbour does. Scope: every direct DISPATCHES, USES_SKILL and HANDS_OFF_TO edge |
| 5 | Single owner | Each rule lives in one place; a second place that needs it delegates by name ("X owns this, load X") instead of restating it |
| 6 | No ambiguity between STEPs | The execution order has one reading; no STEP contradicts another; no decision has two owners |
| 7 | No filler | Every passage changes what the executor does. Verbose and repeated text fails here. Reinforcement passes: a `⛔` restated at the exact point where skipping is tempting, and only there |
| 8 | Cold-executable | Each STEP states what it does, with which input, producing what, and where that goes. A reader with no context can execute without asking |

Illustrative pairs the build will source (the build writes all eight; these fix the register):

- Item 2, not expected: two `## 8.` headings in one skill. Expected: the same two sections numbered
  `## 8.` and `## 9.`.
- Item 5, not expected: a command STEP that copies eleven checklist lines from a skill. Expected:
  the STEP line "Load `building-commands`; apply its ruler to every `.md` this block writes".
- Item 7, not expected: a rule restated in prose in the STEP body after already appearing in the
  top-of-file `⛔` block and again in `## Rules`. Expected: the top-of-file block, plus one `⛔`
  inside the STEP where the shortcut is tempting, and nothing in `## Rules` that restates STEP
  order.

**No item measures size.** Not characters, not lines, not words. The one question is whether a
passage exists for a reason.

### Part 2 — `prompt-review-agent`

A new agent at `.claude/agents/prompt-review-agent.md`, cut from the `plan-review-agent` mould:
`model: sonnet`, no tool restriction in frontmatter, READ-ONLY by rule, `memory: project`. It gets
the artefact-graph MCP tools because it inherits the unrestricted tool set; that is the whole reason
the allowlist stays open.

**Input contract.** One node id (`internal/<kind>/<name>`) or an unambiguous bare name, and the
kind of run: `audit` (the artefact as it is on disk) or `delivery` (the artefact as a build just
wrote it). Nothing else — no plan text, no conversation.

**Method.** Query `neighbors`, `dependencies --depth 1` and `impact --depth 1` on the MCP. Read the
artefact. Read every direct neighbour reached by DISPATCHES, USES_SKILL or HANDS_OFF_TO; MENTIONS
targets are not read. Deeper dependencies enter the report only as the MCP returned them. Tick the
eight items.

**Output.** The ruler, one line per item, `✅` or `❌`, each with its evidence: the MCP result for
family A, a line number and quoted snippet for family B. Then the findings, each with a severity
on the three levels STEP 7 already uses (high / medium / low), the item it fails, and the fix. Then
one verdict, in the vocabulary the repository already has:

| Verdict | Means |
|---------|-------|
| `ok` | All eight ticked |
| `fix-then-ok` | Failures whose fix is mechanical — a dangling reference, a duplicate heading, a copied rule, a passage that can go |
| `blocked` | An item 4 or item 6 failure that needs a human decision: which side of a mismatched contract is right, which of two STEPs owns the decision |

**When the MCP does not answer,** family A is reported as `not verified — MCP unavailable`, in
those words, and the verdict cannot be `ok`. The agent never greps the tree to substitute for the
graph; a grep answer to a graph question is the false-positive source the graph was built to remove.

**It writes nothing.** `add-review-discipline` owns that rule and this agent is subject to it.

### Part 3 — Two dispatch points and one registration

**`add-framework--build`.** STEP 7.1 auditor 4 ("Quality") becomes a named dispatch of
`@prompt-review-agent` in `delivery` mode, one call per `.md` command, skill or agent the build
wrote or modified, in parallel with the other three auditors, once, after the last F-block. Its
findings enter 7.3 like any other auditor's: judged, applied or discarded with a reason, recorded as
a ruling. STEP 3 drops the inline "building-commands Checklist" and keeps one line: load
`building-commands`, apply its ruler to every `.md` the block writes. The author writes against the
ruler; the auditor ticks it.

**The report count stops being four.** STEP 7.1 today hardcodes "DISPATCH 4 AGENTS", "all four
reports" and the gate "IF FEWER THAN FOUR REPORTS HAVE COME BACK". With one prompt review per
artefact the count is **3 + N**, where N is the number of `.md` command, skill or agent files in
the build's diff. The coordinator lists every dispatch before waiting, and the gate is rewritten to
read on that list: `IF ANY DISPATCHED AUDITOR HAS NOT REPORTED: ⛔ DO NOT: Proceed to 7.2`. When N
is zero — a build that touched scripts, tests or `CLAUDE.md` only — auditor 4 is not dispatched and
the gate waits on three. Every literal "four" in STEP 7 goes with this change.

**`add-framework--plan`.** A new sub-step in STEP 3 (Critical Analysis): when the idea names an
internal command, skill or agent, dispatch `@prompt-review-agent` in `audit` mode on it. Every `❌`
becomes an F-block in the plan, carrying the item number, the evidence and the fix. The plan's own
per-F-block validation names the item, so the build's STEP 7 confirms the same criterion that found
the problem. An `ok` is reported to the user and produces no F-block.

**`add-review-discipline`.** A third row in the reader table: `@prompt-review-agent` asks "Does this
artefact say one thing, once, where it belongs, and does it match its neighbours?" and returns a
ticked ruler and a verdict. Its count: **once per revision of the artefact**. The `audit` read in the
plan and the `delivery` read in the build are two revisions of one file, so both are allowed; a
second `delivery` read over the same build's fixes is not.

**`CLAUDE.md`.** One row in "Where the details live": the prompt-quality ruler → `building-commands`.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Author-only checklist (no reviewer) | The writer grades their own work; the current checklist is exactly this and catches nothing |
| Reviewer as a per-F-block gate | Catches earlier and lands the fix in the same commit, but adds one dispatch per block, contradicts STEP 5.2 ("no per-block approval stall") and creates a second review point the discipline forbids |
| A new `add-framework--audit` command that writes the fix plan | `/add-framework--plan` already reads the artefacts the idea names, asks the graph, consults the delivery index and writes plans in the authored shape. A second command would be a second owner of plan-writing |
| Word or line budgets as the leanness criterion | Prohibited by doctrine, and observed to make the writer contort text to fit rather than remove what has no reason to exist |

## Type of Artefact

architecture — one skill section (`building-commands`), one new agent (`prompt-review-agent`),
edits to two commands (`add-framework--build`, `add-framework--plan`), one skill
(`add-review-discipline`) and `CLAUDE.md`. All internal layer.

## Scope

### Includes
- The eight-item ruler with an expected / not expected quoted pair per item, replacing the
  `building-commands` Validation Checklist
- `prompt-review-agent` with the input contract, method, output and verdict table above
- `add-framework--build`: STEP 7.1 auditor 4 named; STEP 3 inline checklist replaced by delegation
- `add-framework--plan`: STEP 3 audit dispatch; `❌` items become F-blocks
- `add-review-discipline`: third reader row and its count
- `CLAUDE.md`: one "Where the details live" row
- A RED-first vitest matrix in `cli/tests/` in the shape of `review-no-loops.test.js`
- One live proof: `/add-framework--plan` over `.claude/commands/add-framework--build.md` yields a
  plan whose F-blocks cite ruler items

### Does NOT Include
- The product layer (`framwork/.codeadd/`). A port is its own plan, after this one has run for real
- Fixing the existing internal artefacts. Each becomes its own plan through the audit dispatch
- Any numeric limit on any artefact
- Changes to `build.js` gates. Family A consumes what the build already enforces plus the MCP verbs
- Cross-layer edges in the graph
- Changes to `plan-readback-agent` or `plan-review-agent`

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| The ruler has one owner, `building-commands`; build STEP 3 and `add-framework-internal-layer` delegate by name | The copied checklist in build STEP 3 is item 5 failing inside the mechanism that defines item 5 | ✅ |
| The reviewer is STEP 7.1 auditor 4, once, after the last F-block — not a per-F-block gate | Keeps the "review runs once" rule and adds no dispatch point; the plan already turned audit findings into F-blocks, so STEP 7 confirms rather than discovers | ✅ |
| Family A is answered by the MCP; an unavailable MCP is reported, never replaced by grep | Grep over prose was measured at 11/13 false positives when the graph was designed | ✅ |
| Examples are quoted snippets, not `file:line` pointers | A pointer is stale the day the file changes; a quote keeps illustrating the same thing | ✅ |
| Plan-time findings become F-blocks; build-time findings follow STEP 7.3 | The build has something to execute and the review has the same criterion to confirm | ✅ |
| `blocked` only for item 4 or item 6 needing a human decision; everything else `fix-then-ok` | A gate that blocks on mechanical fixes gets disabled | ✅ |
| Count: once per revision; `audit` and `delivery` reads are different revisions | Fits `add-review-discipline` per-subject counting without an exception | ✅ |
| STEP 7 waits on 3 + N reports, gated on the dispatch list, not on a literal four | One prompt review per artefact keeps the agent's one-id contract; a hardcoded count would be wrong on every build | ✅ |
| No size criterion of any kind | Doctrine, and the user's explicit constraint | ✅ |
| Author guides, reviewer gates | The current author-only checklist demonstrates that self-grading catches nothing | ✅ |

## Ecosystem Impact

| Component | Layer | Impact | Action |
|-----------|-------|--------|--------|
| `building-commands` | internal | Validation Checklist replaced by the ruler with examples | rewrite the section; keep everything else |
| `prompt-review-agent` | internal | new | create; declare `uses:` on every dispatcher |
| `add-framework--build` | internal | STEP 7.1 auditor 4 named; STEP 3 inline checklist → delegation | edit two STEPs; add the agent to `uses:` |
| `add-framework--plan` | internal | STEP 3 gains the audit dispatch; STEP 5 gains "`❌` → F-block" | edit; add the agent to `uses:` |
| `add-review-discipline` | internal | third reader and its count | edit the reader table and The Counts; declare `agent: prompt-review-agent` in `uses:` |
| `add-framework-internal-layer` | internal | "passes the `building-commands` checklist" → "passes the `building-commands` ruler" | one-line edit |
| `CLAUDE.md` | internal | one row in "Where the details live" | edit |
| `cli/tests/` | internal | new RED matrix | create |
| `plan-readback-agent`, `plan-review-agent` | internal | none | none |
| `framwork/.codeadd/` (product) | product | none in this delivery | none |

Expected `graph.js impact prompt-review-agent --depth 1` after the build: exactly
`add-framework--build`, `add-framework--plan` and `add-review-discipline`.

## Validation Matrix

| Level | Proves | How |
|---|---|---|
| L1 | Graph closed | `node scripts/build.js` exits clean with the new agent declared in every dispatcher's `uses:` |
| L2 | Wiring | `graph.js impact prompt-review-agent --depth 1` returns the three names above and nothing else |
| L3 | Content | vitest: the ruler has eight items, each with an expected and a not-expected snippet; build STEP 3 no longer contains the eleven-line checklist; build 7.1 names the agent and STEP 7 carries no literal "four" in its gates; plan STEP 3 dispatches it; the discipline's reader table has three rows; the agent frontmatter carries `model: sonnet` and no `Write` |
| L4 | Behaviour | `/add-framework--plan` over `.claude/commands/add-framework--build.md` produces a plan whose F-blocks cite ruler items with evidence; recorded in the build ledger, not in a file |

L4 runs from the branch checked out in the main working tree, not in a worktree — an agent created
inside a worktree is not dispatchable until it is merged.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A rubric two readers apply the same way, with evidence | The freedom to call any prose "quality" without showing where it fails |
| A path from "this command is inconsistent" to a plan the build executes | Ad-hoc chat audits |
| One owner for the checklist | The convenience of seeing the list inside the build command |
| Earlier catching, at plan time, for refactors | Same-commit fixes for new artefacts (STEP 7 lands them in the review commit) |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Item 7 is subjective; the reviewer marks reinforcement as repetition | Med | The quoted pair, the reinforcement rule ("a `⛔` at the point of temptation, only there"), and the caller judging before applying |
| Reading the whole neighbourhood costs tokens | Med | Depth 1 only for reading; deeper levels enter as MCP output |
| The gate cries wolf and gets disabled | Low | `blocked` reserved for item 4 / item 6 decisions; everything else `fix-then-ok` |
| A new agent inside a worktree cannot be dispatched for L4 | High | L4 runs on the branch in the main working tree, or becomes the first real use after merge |
| MCP not connected in a session | Low | Family A reported as not verified; verdict cannot be `ok`; no grep fallback |

## Next Steps

Run: `/add-framework--plan prompt quality ruler — ref: docs/brainstorming/2026-09-10T163952-prompt-quality-ruler.md`
