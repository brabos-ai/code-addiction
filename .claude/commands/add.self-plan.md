# ADD Self-Plan — Internal Infrastructure Planner

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Plans structural changes to the internal development layer (`.claude/`, `scripts/`, `CLAUDE.md`). Generates documented plan for execution by `/add.self-build`.

---

## Spec

{"output":"docs/self-plan/PLAN-[slug].md","modes":{"new":"/add.self-plan [idea] → STEP 0-5","continue":"/add.self-plan PLAN-[slug] → load + adjust","list":"/add.self-plan → list plans"}}

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 0: Load context              → CLAUDE.md + affected artefacts
STEP 1: Understand the demand     → classify type and scope
STEP 2: Impact analysis           → map dependencies between internal artefacts
STEP 3: Consultative questions    → [STOP] present analysis, wait for answers
STEP 4: Generate plan             → write plan document
STEP 5: Completion                → [HARD STOP] show path + next steps

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
  ⛔ DO NOT: Implement any change — that is /add.self-build's job
  ⛔ DO NOT: Write outside docs/self-plan/
  ⛔ DO NOT: Create branches, commits, or PRs

---

## STEP 0: Load Context

### 0.1 Read Structural Map

Read `CLAUDE.md` at project root. This provides the full project anatomy.

### 0.2 Read Affected Artefacts

Based on user's request, identify and read the internal artefacts that will be affected:

- `.claude/commands/*.md` — if changing commands
- `.claude/skills/*/SKILL.md` — if changing skills
- `.claude/agents/*.md` — if changing agents
- `scripts/*.js` — if changing build/support scripts
- `CLAUDE.md` — if changing the structural map itself

### 0.3 Read Skills

Read `.claude/skills/add-framework-development/SKILL.md` for artefact type decision framework.

---

## STEP 1: Understand the Demand

### 1.1 Classify Scope

| Scope | Target | Example |
|-------|--------|---------|
| **COMMAND** | `.claude/commands/*.md` | "improve add.build gates" |
| **SKILL** | `.claude/skills/*/SKILL.md` | "add new skill for testing patterns" |
| **AGENT** | `.claude/agents/*.md` | "create agent for code analysis" |
| **SCRIPT** | `scripts/*` | "improve build.js error handling" |
| **MAP** | `CLAUDE.md` | "update structural map with new dirs" |
| **CROSS-CUTTING** | Multiple targets | "restructure command loading flow" |

### 1.2 Extract Intent

Identify: what needs to change, the problem motivating it, and the expected outcome.

Internal classification only — DO NOT produce artefacts.

---

## STEP 2: Impact Analysis

### 2.1 Map Dependencies

For each artefact affected, identify:

- Which commands load this skill?
- Which commands reference this command?
- Which agents are dispatched by affected commands?
- Does this change affect `CLAUDE.md`?

### 2.2 Assess Risk

| Risk Level | Criteria |
|-----------|----------|
| **LOW** | Single artefact, no dependents |
| **MEDIUM** | Multiple artefacts, or artefact with 1-2 dependents |
| **HIGH** | Cross-cutting change, or artefact with 3+ dependents |

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

### 4.1 Path and Naming

Find next available plan in `docs/self-plan/`. If directory doesn't exist, create it.

**Path:** `docs/self-plan/PLAN-[slug].md`

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
[Numbered steps for add.self-build to follow]

## Validated Decisions
| Question | Decision | Rationale |
|----------|----------|-----------|
| [from STEP 3] | [choice] | [why] |

---

## Next Steps
/add.self-build PLAN-[slug]
```

---

## STEP 5: Completion [HARD STOP]

Show: plan file path, status (draft), and two next-step commands:
- `/add.self-build PLAN-[slug]` to implement
- `/add.self-plan PLAN-[slug]` to revise

⛔ DO NOT proceed with implementation. DO NOT edit code. DO NOT create branches.
add.self-plan ends here. Execution is `/add.self-build`'s responsibility.

---

## Continue Mode (existing plan)

If `/add.self-plan PLAN-[slug]`:

1. Load existing plan
2. Show summary of what was already decided
3. Ask: "What do you want to adjust?"
4. Update plan with changelog entry

---

## List Mode

If `/add.self-plan` without arguments:

1. List plans in `docs/self-plan/`
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

NEVER:
- Write outside `docs/self-plan/`
- Implement changes — that is `/add.self-build`'s job
- Modify any file in `framwork/.codeadd/`
- Skip impact analysis
- Generate plan without user validation of decisions
- Create branches or commits
