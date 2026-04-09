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
