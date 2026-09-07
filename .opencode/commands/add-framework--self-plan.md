---
description: Plans structural changes to the OpenCode internal development layer.
---

# ADD Self-Plan — Internal Infrastructure Planner

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **INPUT:** $ARGUMENTS

Plans structural changes to the internal development layer (`.opencode/`, `scripts/`, `CLAUDE.md`). Generates documented plan for execution by `/add-framework--self-build`.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 0: Load context              → CLAUDE.md + affected artefacts + dispatch discovery agent
STEP 1: Understand the demand     → classify type and scope
STEP 2: Impact analysis           → map dependencies between internal artefacts
STEP 3: Consultative questions    → [STOP] present analysis, wait for answers
STEP 4: Generate plan             → write draft plan document
STEP 5: Review plan               → @plan-review-agent before any delivery
STEP 6: Completion                → [HARD STOP] show path + next steps

**⛔ ABSOLUTE PROHIBITIONS:**

IF CONTEXT NOT LOADED (STEP 0 not complete):
  ⛔ DO NOT USE: Write on any file
  ⛔ DO NOT USE: Edit on any file
  ⛔ DO NOT: Propose changes without understanding current state
  ✅ DO: Read CLAUDE.md and affected artefacts first

ALWAYS:
  ⛔ DO NOT USE: Write on framwork/.codeadd/
  ⛔ DO NOT USE: Edit on framwork/.codeadd/
  ⛔ DO NOT USE: Write on framwork/ provider directories
  ⛔ DO NOT: Implement any change — that is /add-framework--self-build's job
  ⛔ DO NOT: Write outside docs/plans/
  ⛔ DO NOT: Create branches, commits, or PRs

IF PLAN FILE NOT YET REVIEWED BY @plan-review-agent:
  ⛔ DO NOT: Present the plan path, summary, or next-step commands as delivered
  ✅ DO: Run STEP 5

---

## STEP 0: Load Context

### 0.1 Read Structural Map

Read `CLAUDE.md` at project root. This provides the full project anatomy.

### 0.2 Read Affected Artefacts

Based on user's request, identify and read the internal artefacts that will be affected:

- `.opencode/commands/*.md` — if changing commands
- `.opencode/skills/*/SKILL.md` — if changing skills
- `.opencode/agents/*.md` — if changing agents
- `scripts/*.js` — if changing build/support scripts
- `CLAUDE.md` — if changing the structural map itself

### 0.3 Read Skills

Load the `add-framework-development` skill with the Skill tool for the artefact type decision framework.

### 0.4 Dispatch Discovery Agent (SILENT)

IF no idea in invocation args → skip this sub-step, proceed to STEP 1.

IF an idea was provided in invocation args, dispatch `@framework-discovery-agent` with:
- `topic`: [idea from invocation]
- `scope`: `internal`

DO NOT show the agent's raw report verbatim. Use the report to inform the "Current State" and "Open Questions" sections of the STEP 3 consultation — surfaces related internal artefacts and prior self-plans before the conversation opens.

---

## STEP 1: Understand the Demand

### 1.1 Classify Scope

| Scope | Target | Example |
|-------|--------|---------|
| **COMMAND** | `.opencode/commands/*.md` | "improve add-framework--build gates" |
| **SKILL** | `.opencode/skills/*/SKILL.md` | "add new skill for testing patterns" |
| **AGENT** | `.opencode/agents/*.md` | "create agent for code analysis" |
| **SCRIPT** | `scripts/*` | "improve build.js error handling" |
| **MAP** | `CLAUDE.md` | "update structural map with new dirs" |
| **CROSS-CUTTING** | Multiple targets | "restructure command loading flow" |

### 1.2 Extract Intent

Identify: what needs to change, the problem motivating it, and the expected outcome.

Internal classification only — DO NOT produce artefacts.

---

## STEP 2: Impact Analysis

### 2.1 Map Dependencies

**Ask the graph. Do not answer these by grepping.**

For each artefact the change touches:

```bash
node scripts/graph.js impact <artefact-name>
```

It returns every dependant **transitively**, with the number of hops. That
number is the answer to "which commands load this skill, which commands
reference this command, which agents do they dispatch" — all three at once, and
one level deeper than a grep reaches.

Two things the output already accounts for, so do not re-reason about them:

- `MENTIONS` edges are excluded. A doc that names an artefact only to point away
  from it ("use X instead") cannot break when it changes.
- A name is matched exactly. `add-qa` does not match inside `add-qa-migration`,
  and `/add` does not match inside `/add.plan` — both mistakes produced wrong
  counts before the graph existed.

Then check what the change would break in the other direction:

```bash
node scripts/graph.js dependencies <artefact-name>   # what it needs
node scripts/graph.js path <from> <to>               # how two artefacts connect
```

Still answer by hand: **does this change affect `CLAUDE.md`?** The graph does not
model it.

If the graph is missing or stale, run `node scripts/build.js` — it is emitted on
every build.

### 2.2 Assess Risk

Use the dependant count from 2.1, not an estimate.

| Risk Level | Criteria |
|-----------|----------|
| **LOW** | Single artefact, `impact` returns nothing |
| **MEDIUM** | `impact` returns 1-2 dependants, all at depth 1 |
| **HIGH** | `impact` returns 3+ dependants, **or any dependant at depth 2+** |

A dependant at depth 2 or more is what makes a change cross-cutting: something
depends on this through an intermediary that nobody editing the file will think
to open.

---

## STEP 3: Consultative Questions [STOP]

Present analysis with these sections:

1. **Understanding** — restate what needs to change and why
2. **Current State** — table of artefacts affected with their role and dependents
3. **Impact Assessment** — risk level with justification
4. **Open Questions** — 2-4 key decisions with options table (option, description, trade-offs)
5. **Recommendations** — what to include, what to defer, risks to mitigate

**STOP AND WAIT** for user responses.

After user responds → summarize confirmed decisions, then ask to proceed to plan generation.

---

## STEP 4: Generate Plan

Write the draft file. DO NOT present the path or next steps — proceed immediately to STEP 5.

### 4.1 Path and Naming

Find next available plan in `docs/plans/`. If directory doesn't exist, create it.

**Path:** `docs/plans/[NNNN]-SELF-PLAN--[slug].md`

### 4.2 Plan Structure

Write the plan document:

```
# Plan: [Name]

> **Status:** draft | approved | implemented
> **Scope:** command | skill | agent | script | map | cross-cutting
> **Created:** YYYY-MM-DD

---

## Context
[Why this change is needed — connect with current pain point]

## Current State
[What exists today and how it works]

## Proposed Changes
[Ordered list of changes with exact file paths and what changes in each]

## Impact
| Artefact | Action | Reason |
|----------|--------|--------|
| [file] | modify/create/remove | [why] |

## Execution Order
[Numbered steps for add-framework--self-build to follow]

## Validated Decisions
| Question | Decision | Rationale |
|----------|----------|-----------|
| [from STEP 3] | [choice] | [why] |

---

## Next Steps
/add-framework--self-build [NNNN]-SELF-PLAN--[slug]
```

---

## STEP 5: Review Plan (BEFORE ANY DELIVERY)

**GATE CHECK:** Plan file from STEP 4 exists? IF NO → return to STEP 4. DO NOT proceed.

DO NOT show the plan path, summary, or next-step commands until this STEP completes with a deliverable verdict.

**DISPATCH AGENT:** `@plan-review-agent`
- **Capability:** read-only
- **Complexity:** standard
- **Input:**
  - `path`: plan file written in STEP 4
  - `kind`: `self-plan`
  - `layer`: `internal`

**WAIT:** Agent report received. ⛔ DO NOT proceed without it.

### 5.1 Act on Verdict

| Verdict | Action |
|---------|--------|
| `ok` | Proceed to STEP 6 |
| `fix-then-ok` | Apply every **Required fix** that does not invent a user decision. Respect **Do not change**. Re-dispatch `@plan-review-agent` ONCE. After re-review: `ok` or only nits → STEP 6. Remaining blockers → 5.2 |
| `blocked` | Go to 5.2 |

### 5.2 User decisions required [STOP]

Present only the blockers that need a user decision. DO NOT present the plan as delivered. WAIT. After answers: apply, re-enter STEP 5.

⛔ DO NOT invent decisions to clear blockers.
⛔ DO NOT skip this STEP in Continue Mode.

### Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only)
2. Read the **Complexity** hint (`standard`)
3. Choose the best available agent/task mechanism that satisfies the capability
4. Prefer `@plan-review-agent` when the engine can address it by name
5. Verify the report is received before acting on the verdict

---

## STEP 6: Completion [HARD STOP]

**The user did NOT read the plan.** They read this summary and decide from it. A completion that names the file, the verdict and the next command tells them the plan exists — not what is about to happen to their tooling. If the user has to ask "but what will actually be done?", this STEP failed.

### 6.1 Executive Summary [MANDATORY — emit FIRST, before any metadata]

Bullet points, plain language, in the user's language. Someone who has never opened the plan must finish this section knowing what will change, what will not, and what to be careful about.

⛔ **BANNED in this section:**

| Banned | Why | Use instead |
|--------|-----|-------------|
| `F7`, `T3`, `L2.9` carrying the meaning | Internal ids say nothing to a non-reader | State the change; the id goes in parentheses at most |
| "The plan adds a section on X" | Describes the document, not the work | "X is added to `path/file`" |
| "Improves consistency", "makes the flow more robust" | Says nothing checkable | The concrete change and what it causes |
| Restating the Problem section | They already agreed there is a problem | What we are going to DO about it |
| Skipping a deletion because it is "just cleanup" | A deletion is the scariest line in any plan | Name every deleted file, always |
| Naming a category ("the internal commands") | Unverifiable | Name each file and each step |

Emit the blocks below. Skip one only when it is genuinely empty — never pad it with filler.

**1. What will be done** — one line per unit of work, grouped by stage when the plan has stages. Each line pairs the concrete change with the file it lands in.

**2. Files touched** — a table split by verb, because the three carry very different risk:

| Action | Files |
|--------|-------|
| Created | ... |
| Modified | ... |
| **Deleted** | ... (write "none" when none — never omit the row) |

**3. Where it plugs in** — for anything wired into an existing command, skill, agent or script: name the **host and the exact step**. "Changes the review flow" is not an answer. "`add-framework--build` STEP 3, before the skill load" is.

**4. Canonical ↔ adapter pairs** — this layer keeps `.claude/` canonical and `.opencode/` as its adapter. For every file in the table above that has a counterpart, say whether the counterpart changes too. A `.claude/` edit landing alone is silent drift that nothing in CI catches. Write "no paired file" when none applies — never omit the block.

**5. What is explicitly NOT included** — the scope boundaries the user must know, including work routed to a companion command (product-layer work belongs to `/add-framework--plan`).

**6. ⚠️ Needs your attention** — only genuinely consequential items: anything deleted, anything irreversible, any `CLAUDE.md` edit (it rewrites the instructions every future session loads), anything that changes how an existing command behaves mid-flow, anything a companion command has to finish, and the one or two places the plan is most likely to be built wrong. Omit the whole block when there is nothing real — never manufacture a warning.

### 6.2 Plan metadata [AFTER the summary]

Then, and only then: plan file path, status (`draft`), review verdict, fixes applied (one line each, if any), and the two next-step commands:
- `/add-framework--self-build [NNNN]-SELF-PLAN--[slug]` to implement
- `/add-framework--self-plan [NNNN]-SELF-PLAN--[slug]` to revise

### 6.3 Self-check before sending

```
[ ] A reader who never opened the plan knows what will change
[ ] Every deleted file is named; the Deleted row is present even when empty
[ ] Every integration point names its host AND its step
[ ] Every canonical file with an adapter says whether the adapter moves too
[ ] No F/T/L id is load-bearing — remove them all and the summary still reads
[ ] It describes the WORK, never the document
[ ] Nothing in scope is missing: every F-block appears somewhere in blocks 1-3
```

⛔ DO NOT proceed with implementation. DO NOT edit code. DO NOT create branches.
add-framework--self-plan ends here. Execution is `/add-framework--self-build`'s responsibility.

---

## Continue Mode (existing plan)

If `/add-framework--self-plan [NNNN]-SELF-PLAN--[slug]`:

1. Load existing plan
2. Show summary of what was already decided
3. Ask: "What do you want to adjust?"
4. Update plan with changelog entry
5. Execute STEP 5 (Review), then STEP 6 (Completion). DO NOT treat the update as delivered before review.

---

## List Mode

If `/add-framework--self-plan` without arguments:

1. List plans in `docs/plans/`
2. Show status of each
3. Ask which to work on

---

## Rules

ALWAYS:
- Read CLAUDE.md before analyzing any change
- Map dependencies between internal artefacts before proposing changes
- Identify risk level for every proposed change
- Generate complete, actionable plan with exact file paths
- Consider impact on all dependent artefacts
- Present analysis and wait for user validation before writing plan
- Dispatch `@plan-review-agent` before any plan delivery, including Continue Mode
- Close with STEP 6.1's executive summary — the user decides from it, not from the plan file

NEVER:
- Write outside `docs/plans/`
- Implement changes — that is `/add-framework--self-build`'s job
- Modify any file in `framwork/.codeadd/`
- Skip impact analysis
- Generate plan without user validation of decisions
- Present an unreviewed plan as delivered
- Close with only a file path, a verdict and a next command — that is a receipt, not a summary
- Let an F/T/L id, or a category like "the internal commands", stand in for a named file or step
- Leave a canonical `.claude/` change unpaired in the summary when an `.opencode/` adapter exists
- Invent decisions to clear review blockers
- Create branches or commits
