# Self-Build Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `add.self-plan` and `add.self-build` commands for evolving internal development infrastructure (`.claude/`, `scripts/`, `CLAUDE.md`), rename `add.strategy` → `add.plan` and `add.make` → `add.build`, and add a structural map to CLAUDE.md that all commands consume.

**Architecture:** Two new commands mirror the existing `plan`/`build` pair but target the internal layer exclusively. CLAUDE.md becomes the shared context map describing project anatomy, pipeline, and web/docs structure. All internal references are updated to use the new names.

**Tech Stack:** Markdown command files, Claude Code conventions, `building-commands` skill patterns

---

### Task 1: Rename `add.strategy` → `add.plan`

**Files:**
- Rename: `.claude/commands/add.strategy.md` → `.claude/commands/add.plan.md`
- Modify: `.claude/commands/add.plan.md` (update self-references)

- [ ] **Step 1: Rename the file**

```bash
cd /home/fnd/workspace/gh/personal/code-addiction
git mv .claude/commands/add.strategy.md .claude/commands/add.plan.md
```

- [ ] **Step 2: Update self-references inside the renamed file**

In `.claude/commands/add.plan.md`, replace all occurrences of the old name with the new name. These are the exact replacements needed:

Line 7 — command description reference to make:
```
old: Generates PRD (Product Requirements Document) for execution via `/add.make`.
new: Generates PRD (Product Requirements Document) for execution via `/add.build`.
```

Line 14 — spec JSON modes:
```
old: {"output":"docs/prd/PRD[NNNN]-[slug].md","modes":{"new":"/add.strategy [idea] → STEP 0-5","continue":"/add.strategy PRD[NNNN] → load + adjust","list":"/add.strategy → list drafts"}}
new: {"output":"docs/prd/PRD[NNNN]-[slug].md","modes":{"new":"/add.plan [idea] → STEP 0-5","continue":"/add.plan PRD[NNNN] → load + adjust","list":"/add.plan → list drafts"}}
```

Line 64 — prohibition header:
```
old: **add.strategy ANALYZES and DOCUMENTS. Execution belongs to `/add.make`.**
new: **add.plan ANALYZES and DOCUMENTS. Execution belongs to `/add.build`.**
```

Line 74 — prohibition text:
```
old: ⛔ DO NOT: Implement ANYTHING discussed — that is /add.make's job
new: ⛔ DO NOT: Implement ANYTHING discussed — that is /add.build's job
```

Line 77 — tempted-to-implement:
```
old:   → STOP. Write it in the PRD. User decides when/how to execute via /add.make.
new:   → STOP. Write it in the PRD. User decides when/how to execute via /add.build.
```

Lines 85-87 — operation mode:
```
old:
/add.strategy [idea]        → New strategic analysis (STEP 0-5)
/add.strategy PRD[NNNN]     → Continue existing PRD
/add.strategy               → List PRDs in draft

new:
/add.plan [idea]        → New strategic analysis (STEP 0-5)
/add.plan PRD[NNNN]     → Continue existing PRD
/add.plan               → List PRDs in draft
```

Line 283 — next steps:
```
old: /add.make PRD[NNNN]-[slug]
new: /add.build PRD[NNNN]-[slug]
```

Line 298 — completion text:
```
old: Show: PRD file path, status (draft), and the two next-step commands (`/add.make PRD[NNNN]-[slug]` to implement, `/add.strategy PRD[NNNN]` to revise).
new: Show: PRD file path, status (draft), and the two next-step commands (`/add.build PRD[NNNN]-[slug]` to implement, `/add.plan PRD[NNNN]` to revise).
```

Line 301 — hard stop:
```
old: add.strategy ends here. Execution is `/add.make`'s responsibility.
new: add.plan ends here. Execution is `/add.build`'s responsibility.
```

Line 307 — continue mode:
```
old: If `/add.strategy PRD[NNNN]`:
new: If `/add.plan PRD[NNNN]`:
```

Line 318 — list mode:
```
old: If `/add.strategy` without arguments:
new: If `/add.plan` without arguments:
```

Line 345 — rules never:
```
old: - Implement anything — that is `/add.make`'s job
new: - Implement anything — that is `/add.build`'s job
```

- [ ] **Step 3: Verify no remaining old references**

```bash
grep -n "add\.strategy\|add\.make" .claude/commands/add.plan.md
```

Expected: No matches (all references updated).

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/add.plan.md
git commit -m "refactor: rename add.strategy → add.plan"
```

---

### Task 2: Rename `add.make` → `add.build`

**Files:**
- Rename: `.claude/commands/add.make.md` → `.claude/commands/add.build.md`
- Modify: `.claude/commands/add.build.md` (update self-references)

- [ ] **Step 1: Rename the file**

```bash
cd /home/fnd/workspace/gh/personal/code-addiction
git mv .claude/commands/add.make.md .claude/commands/add.build.md
```

- [ ] **Step 2: Update self-references inside the renamed file**

In `.claude/commands/add.build.md`, replace all occurrences:

Lines 56-57 — operation mode:
```
old:
/add.make PRD-[slug]                 → Execute specific PRD
/add.make [type] [name]             → Direct build (no PRD, for simple artefacts)

new:
/add.build PRD-[slug]                 → Execute specific PRD
/add.build [type] [name]             → Direct build (no PRD, for simple artefacts)
```

Lines 62-64 — examples:
```
old:
/add.make PRD-hotfix-optimization
/add.make command add-diagnose
/add.make skill skill-creator

new:
/add.build PRD-hotfix-optimization
/add.build command add-diagnose
/add.build skill skill-creator
```

Line 69 — optimize note:
```
old: > To optimize an existing artefact: use `/add.make [type] [name]` → the design phase detects the artefact already exists and presents analysis vs building-commands before editing.
new: > To optimize an existing artefact: use `/add.build [type] [name]` → the design phase detects the artefact already exists and presents analysis vs building-commands before editing.
```

Line 110 — complex recommendation:
```
old: **If complex:** Recommend `/add.strategy` first.
new: **If complex:** Recommend `/add.plan` first.
```

- [ ] **Step 3: Verify no remaining old references**

```bash
grep -n "add\.strategy\|add\.make" .claude/commands/add.build.md
```

Expected: No matches.

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/add.build.md
git commit -m "refactor: rename add.make → add.build"
```

---

### Task 3: Update internal references in skills

**Files:**
- Modify: `.claude/skills/add-framework-development/SKILL.md`
- Modify: `.claude/skills/building-commands/SKILL.md`

- [ ] **Step 1: Update `add-framework-development/SKILL.md`**

Replace these occurrences in `.claude/skills/add-framework-development/SKILL.md`:

Line 3 — description:
```
old: description: "Internal skill for developing ADD framework artefacts (commands, skills, agents, scripts). Use when add.strategy analyzes viability of new framework features, when add.make implements framework artefacts, or when creating/modifying commands, skills, or agents. Always use this skill before proposing or implementing changes to the framework itself."
new: description: "Internal skill for developing ADD framework artefacts (commands, skills, agents, scripts). Use when add.plan analyzes viability of new framework features, when add.build implements framework artefacts, or when creating/modifying commands, skills, or agents. Always use this skill before proposing or implementing changes to the framework itself."
```

Line 8 — overview:
```
old: Operational knowledge for creating and modifying ADD framework artefacts. NOT distributed to users — exists so add.strategy assesses viability and add.make implements correctly.
new: Operational knowledge for creating and modifying ADD framework artefacts. NOT distributed to users — exists so add.plan assesses viability and add.build implements correctly.
```

Line 11 — when to use:
```
old: - `add.strategy` analyzing if a proposal is technically viable (STEP 0 and STEP 2)
new: - `add.plan` analyzing if a proposal is technically viable (STEP 0 and STEP 2)
```

Line 12:
```
old: - `add.make` implementing a new command, skill, agent, or script
new: - `add.build` implementing a new command, skill, agent, or script
```

Line 27:
```
old: This is the FIRST question `add.strategy` must answer. Wrong artefact type = wasted effort.
new: This is the FIRST question `add.plan` must answer. Wrong artefact type = wasted effort.
```

- [ ] **Step 2: Update `building-commands/SKILL.md`**

Check line 3 for references:
```
old: ...when /add.make needs to generate a command...
new: ...when /add.build needs to generate a command...
```

Also update any other `add.strategy` or `add.make` references in the file (check with grep first).

- [ ] **Step 3: Verify no remaining old references in skills**

```bash
grep -rn "add\.strategy\|add\.make" .claude/skills/
```

Expected: No matches.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/
git commit -m "refactor: update skill references from strategy/make to plan/build"
```

---

### Task 4: Create CLAUDE.md structural map

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md with project structural map**

Write `CLAUDE.md` at project root with this content:

```markdown
# Code-Addiction (ADD Framework)

Open-source framework that distributes AI-assisted development commands, skills, and agents to 15+ providers (Claude Code, Codex, Gemini, Copilot, Cursor, Kiro, etc.).

## Project Anatomy

Two layers with distinct purposes:

### Product Layer — `framwork/.codeadd/`

Source of truth for distributed artefacts. Users consume these via CLI install.

| Type | Path | Count |
|------|------|-------|
| Commands | `framwork/.codeadd/commands/*.md` | ~20 |
| Skills | `framwork/.codeadd/skills/*/SKILL.md` | ~34 |
| Agents | `framwork/.codeadd/agents/*-agent.md` | ~8 |
| Scripts | `framwork/.codeadd/scripts/*` | variable |

### Internal Layer — `.claude/`

Development tools that build and maintain the framework itself. NOT distributed to users.

| Type | Path |
|------|------|
| Commands | `.claude/commands/*.md` (`add.plan`, `add.build`, `add.self-plan`, `add.self-build`, `add.sync`, `add.release`) |
| Skills | `.claude/skills/` (`building-commands`, `add-framework-development`, `add-commit`) |
| Agents | `.claude/agents/` (`readme-analyzer`, `svg-analyzer`, `web-docs-analyzer`, `web-index-analyzer`) |

## Pipeline

```
framwork/.codeadd/  (source of truth)
  ↓
node scripts/build.js  (reads framwork/provider-map.json)
  ↓  per provider: lint → strip comments → resolve paths → transform format → write
framwork/.claude/, framwork/.agents/, framwork/.gemini/, ...  (15 provider dirs)
  ↓
cli/src/installer.js  (downloads release ZIP, installs to user's project)
```

- `framwork/provider-map.json` — single registry of all commands, skills, agents and their provider distribution
- `scripts/build.js` — compiles `.codeadd/` source → provider-specific output dirs
- `scripts/release.sh` — release automation helpers
- `cli/` — npm CLI package (`npx code-addiction`) that installs the framework

### Resource Path Variables (build-time)

| Variable | Resolves to (per provider) |
|----------|---------------------------|
| `{{cmd:NAME}}` | Provider-specific command path |
| `{{skill:NAME/FILE}}` | Provider-specific skill path |
| Scripts | Always `.codeadd/scripts/` (no variable needed) |

## Web / Documentation

| File | Purpose |
|------|---------|
| `web/src/pages/index.astro` | Landing page |
| `web/src/pages/docs.astro` | Documentation page |
| `web/public/commands.svg` | Visual command map |
| `web/public/flows.svg` | Workflow flows diagram |
| `web/public/flowchart.svg` | Architecture flowchart |
| `README.md` | Repository documentation |

Documentation is auto-updated by `add.sync` before releases (dispatches 4 analyzer agents in parallel).

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | Push/PR | Tests and validation |
| `.github/workflows/release.yml` | Tag push (`v*`) | Build + create GitHub release |
| `.github/workflows/deploy-web.yml` | Push/PR | Deploy web documentation |
```

- [ ] **Step 2: Verify CLAUDE.md reads correctly**

```bash
head -20 CLAUDE.md
```

Expected: Title and first sections visible.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md structural map for all commands to consume"
```

---

### Task 5: Create `add.self-plan` command

**Files:**
- Create: `.claude/commands/add.self-plan.md`

- [ ] **Step 1: Read `building-commands` skill for patterns**

```bash
# Already read — patterns: LANG header, STEP structure, tool-specific prohibitions,
# imperative language, ALWAYS/NEVER rules, condition blocks
```

- [ ] **Step 2: Create the command file**

Write `.claude/commands/add.self-plan.md` with the following content:

```markdown
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
```

- [ ] **Step 3: Verify the file was created correctly**

```bash
head -5 .claude/commands/add.self-plan.md
```

Expected: Title line and LANG header visible.

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/add.self-plan.md
git commit -m "feat: add add.self-plan command for internal infrastructure planning"
```

---

### Task 6: Create `add.self-build` command

**Files:**
- Create: `.claude/commands/add.self-build.md`

- [ ] **Step 1: Create the command file**

Write `.claude/commands/add.self-build.md` with the following content:

```markdown
# ADD Self-Build — Internal Infrastructure Builder

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **SKILL:** Apply `building-commands` to ALL command/skill outputs

Evolves artefacts in the internal development layer (`.claude/`, `scripts/`, `CLAUDE.md`). Operates in two modes: pontual (quick changes) or planned (from `/add.self-plan` document).

---

## Spec

{"outputs":{"command":".claude/commands/*.md","skill":".claude/skills/*/SKILL.md","agent":".claude/agents/*.md","script":"scripts/*","map":"CLAUDE.md"},"modes":{"planned":"/add.self-build PLAN-[slug] → execute plan","pontual":"/add.self-build [target] [description] → quick change"}}

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: Load context              → CLAUDE.md + plan or target artefact
STEP 2: Design approved?          → IF NO: present proposal and WAIT
STEP 3: Load skills               → building-commands (if modifying commands/skills)
STEP 4: Implement                 → ONLY AFTER 1-3
STEP 5: Validate                  → verify artefact coherence
STEP 6: Completion                → summary of changes

**⛔ ABSOLUTE PROHIBITIONS:**

IF CONTEXT NOT LOADED (STEP 1 not complete):
  ⛔ DO NOT USE: Write on .claude/
  ⛔ DO NOT USE: Edit on .claude/
  ⛔ DO NOT USE: Write on scripts/
  ⛔ DO NOT USE: Edit on scripts/
  ⛔ DO NOT: Implement any change
  ✅ DO: Read CLAUDE.md and target artefacts first

IF DESIGN NOT APPROVED (STEP 2 not complete):
  ⛔ DO NOT USE: Write to create artefacts in .claude/
  ⛔ DO NOT USE: Edit on existing artefacts in .claude/
  ⛔ DO NOT USE: Write on scripts/
  ⛔ DO NOT: Implement
  ✅ DO: Present proposal and wait for approval

IF building-commands SKILL NOT LOADED (STEP 3, when modifying commands/skills):
  ⛔ DO NOT USE: Write on .claude/commands/
  ⛔ DO NOT USE: Write on .claude/skills/
  ⛔ DO NOT: Create or modify command/skill structure
  ✅ DO: Read .claude/skills/building-commands/SKILL.md

ALWAYS:
  ⛔ DO NOT USE: Write on framwork/.codeadd/
  ⛔ DO NOT USE: Edit on framwork/.codeadd/
  ⛔ DO NOT USE: Write on framwork/ provider directories
  ⛔ DO NOT: Modify product layer artefacts — that is /add.build's job
  ⛔ DO NOT: Run node scripts/build.js — only modifies internal layer

---

## Operation Mode

/add.self-build PLAN-[slug]                → Execute plan from add.self-plan
/add.self-build [target] [description]     → Pontual change (no plan required)

**Examples:**
/add.self-build PLAN-refactor-gates
/add.self-build add.sync "add retry logic for failed agent dispatches"
/add.self-build building-commands "add section about agent memory patterns"
/add.self-build CLAUDE.md "update pipeline section with new provider"

**Valid targets:** command name (`add.plan`, `add.sync`), skill name (`building-commands`), agent name (`readme-analyzer`), script name (`build.js`), or `CLAUDE.md`.

---

## STEP 1: Load Context (MANDATORY)

### 1.1 Read Structural Map

Read `CLAUDE.md` at project root.

### 1.2 If Plan specified

Read `docs/self-plan/PLAN-[slug].md`.

**Extract from plan:**
- Artefacts to modify/create/remove
- Execution order
- Validated decisions

### 1.3 If Pontual change (no plan)

Read the target artefact. Collect:

**Target:** [file path resolved from target name]
**Change:** [user's description]
**Impact:** [quick assessment — which other artefacts depend on this?]

**If change is complex (3+ artefacts, cross-cutting, or high risk):** Recommend `/add.self-plan` first.

---

## STEP 2: Design [STOP]

### 2.1 Present Proposal

**For planned mode:** Summarize the plan and confirm execution order. Show which files will be created/modified/removed.

**For pontual mode:** Present a concise proposal showing: what changes, why, impact on dependents.

### 2.2 Wait for Approval

**STOP AND WAIT.** Only proceed after explicit approval or requested adjustments.

---

## STEP 3: Load Skills

**IF modifying commands or skills, READ:**

.claude/skills/building-commands/SKILL.md                     # ALWAYS for commands/skills
.claude/skills/add-framework-development/SKILL.md             # For artefact type decisions

### building-commands Checklist (APPLY when creating/modifying commands or skills)

- [ ] Top-of-file blocking section (prohibitions BEFORE instructions)
- [ ] Uses STEP (imperative) instead of Phase (documentary)
- [ ] Sequential INTEGER numbering (1, 2, 3... NEVER 2.5, 6.5)
- [ ] Imperative language (EXECUTE, DO NOT, CONFIRM)
- [ ] Gates use TOOL-SPECIFIC prohibitions
- [ ] Condition blocks: IF [condition]: ⛔ DO NOT USE [tool]
- [ ] LANG header present (English command, user-language responses)
- [ ] Rules: ALWAYS/NEVER markdown, no duplication of STEP order
- [ ] No fixed display/error message templates
- [ ] Bash blocks only where non-obvious or learned from errors

**IF modifying scripts or CLAUDE.md:** Skip this step, proceed to STEP 4.

---

## STEP 4: Implement

### 4.1 Planned Mode — Sequential Execution

For each item in the plan's execution order:

1. Read the target artefact (or confirm path for new artefact)
2. Apply the change
3. Show what changed to user
4. Wait for checkpoint approval before next item

### 4.2 Pontual Mode — Direct Change

1. Apply the change to the target artefact
2. Show what changed

### 4.3 Lifecycle Actions

| Action | How |
|--------|-----|
| **Create** | Write new file at correct path, following artefact conventions |
| **Modify** | Edit existing file, preserve structure and business logic |
| **Deprecate** | Add deprecation notice at top of file, update dependents to reference replacement |
| **Remove** | Delete file, update all dependents that referenced it |

### 4.4 Update CLAUDE.md (if artefact list changed)

If a command, skill, or agent was created or removed, update the Internal Layer table in CLAUDE.md to reflect the change.

---

## STEP 5: Validate

### 5.1 Coherence Check

For each modified artefact:

- [ ] File is well-formed (valid markdown, correct structure)
- [ ] No broken references to other internal artefacts
- [ ] If command/skill: passes building-commands validation checklist
- [ ] CLAUDE.md reflects current state (if artefact list changed)

### 5.2 Dependency Check

- [ ] No command references a removed skill
- [ ] No command dispatches a removed agent
- [ ] All new artefacts are referenced where needed

**If validation fails:** Fix the issue, do not proceed to completion until valid.

---

## STEP 6: Completion

Show summary:

- Artefacts created/modified/removed (with paths)
- Plan reference (if planned mode)
- Validation status
- If plan exists: update plan status to `implemented`

---

## Rules

ALWAYS:
- Read CLAUDE.md before any change
- Load building-commands skill before creating/modifying commands or skills
- Present proposal and wait for approval before implementing
- Validate artefact coherence after every change
- Update CLAUDE.md internal layer table when creating or removing artefacts
- Check dependencies when removing or renaming artefacts

NEVER:
- Write to framwork/.codeadd/ — that is /add.build's job
- Write to framwork/ provider directories
- Run node scripts/build.js
- Implement without loading context first
- Skip design approval
- Modify product layer artefacts
- Use informative language in commands ("it's recommended")
- Create generic gates (without tool-specific prohibitions)
```

- [ ] **Step 2: Verify the file was created correctly**

```bash
head -5 .claude/commands/add.self-build.md
```

Expected: Title line and LANG header visible.

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/add.self-build.md
git commit -m "feat: add add.self-build command for internal infrastructure evolution"
```

---

### Task 7: Update `add.sync` and `add.release` references

**Files:**
- Modify: `.claude/commands/add.sync.md` (if any `add.strategy`/`add.make` references)
- Modify: `.claude/commands/add.release.md` (if any `add.strategy`/`add.make` references)

- [ ] **Step 1: Check for references in sync and release**

```bash
grep -n "add\.strategy\|add\.make" .claude/commands/add.sync.md .claude/commands/add.release.md
```

Expected: No matches (these commands don't reference strategy/make). If matches found, update them.

- [ ] **Step 2: Verify all .claude/ references are clean**

```bash
grep -rn "add\.strategy\|add\.make" .claude/
```

Expected: No matches anywhere in `.claude/`.

- [ ] **Step 3: Commit (only if changes were needed)**

```bash
git add .claude/commands/add.sync.md .claude/commands/add.release.md
git commit -m "refactor: update remaining references from strategy/make to plan/build"
```

---

### Task 8: Final verification

- [ ] **Step 1: Verify all 6 command files exist**

```bash
ls -la .claude/commands/
```

Expected: `add.plan.md`, `add.build.md`, `add.self-plan.md`, `add.self-build.md`, `add.sync.md`, `add.release.md`

- [ ] **Step 2: Verify no old filenames remain**

```bash
ls .claude/commands/add.strategy.md .claude/commands/add.make.md 2>&1
```

Expected: "No such file or directory" for both.

- [ ] **Step 3: Verify no stale references across the project**

```bash
grep -rn "add\.strategy\|add\.make" .claude/ docs/
```

Expected: No matches (except possibly in the design spec doc, which is historical).

- [ ] **Step 4: Verify CLAUDE.md exists and lists all commands**

```bash
grep "add\." CLAUDE.md
```

Expected: Shows `add.plan`, `add.build`, `add.self-plan`, `add.self-build`, `add.sync`, `add.release`.
