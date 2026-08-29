# ADD Build - Command, Skill & Script Executor

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **SKILL:** Apply `building-commands` to ALL outputs

Executor that transforms plans into functional artefacts (commands, skills, scripts) within the code-addiction framework (`framwork/`).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load plan/context         → READ FIRST
STEP 2: Design approved?         → IF NO: STOP AND PRESENT
STEP 3: Load skills              → building-commands + ecosystem-map
STEP 4: Implement                → ONLY AFTER 1-3 (in framwork/)
STEP 5: Test                     → ONLY AFTER implementing
STEP 6: Document                 → ONLY AFTER tests pass
STEP 7: Completion               → Final summary
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF PLAN/CONTEXT NOT LOADED:
  ⛔ DO NOT USE: Write in framwork/
  ⛔ DO NOT: Implement any artefact
  ✅ DO: Load plan or ask for description

IF DESIGN NOT APPROVED:
  ⛔ DO NOT USE: Write to create artefacts in framwork/
  ⛔ DO NOT USE: Edit on existing artefacts in framwork/
  ⛔ DO NOT: Implement
  ✅ DO: Present design and wait for approval

IF building-commands SKILL NOT LOADED:
  ⛔ DO NOT USE: Write on commands
  ⛔ DO NOT: Create command structure
  ✅ DO: Read .claude/skills/building-commands/SKILL.md
```

---

## Operation Mode

```
/add-framework--build [NNNN]-PLAN--[slug]                 → Execute specific plan
/add-framework--build [type] [name]             → Direct build (no plan, for simple artefacts)
```

**Examples:**
```
/add-framework--build 0042-PLAN--hotfix-optimization
/add-framework--build command add-diagnose
/add-framework--build skill skill-creator
/add-framework--build cli migrations
```

**Valid types:** `command` | `skill` | `script` | `workflow` | `cli`

> To optimize an existing artefact: use `/add-framework--build [type] [name]` → the design phase detects the artefact already exists and presents analysis vs building-commands before editing.

**Source of truth paths:**

| Type | Path | Built by `build.js`? |
|------|------|----------------------|
| Command | `framwork/.codeadd/commands/*.md` | Yes — provider files generated |
| Skill | `framwork/.codeadd/skills/*/SKILL.md` | Yes — provider files generated |
| Script | `framwork/.codeadd/scripts/*` | No — shipped verbatim |
| CLI source | `cli/src/*.js` + `cli/tests/*.test.js` | No — published as the npm package |
| Claude Command | `.claude/commands/*.md` | No — internal layer |

---

## STEP 1: Load Context (MANDATORY)

### 1.0 Verify Framework Structure

Verify `framwork/` exists and list its provider directories.

### 1.1 If plan specified

Read `docs/plans/[NNNN]-PLAN--[slug].md`.

**Extract from plan:**
- Artefact type (command/skill/script/workflow)
- Scope (includes/excludes)
- Validated decisions
- Accepted trade-offs

### 1.2 If direct build (no plan)

**Only for SIMPLE builds.** Collect:

```markdown
**Type:** [command|skill|script|workflow]
**Name:** [kebab-case]
**Purpose:** [1 line]
**Scope:** [what it does / what it does NOT]
**Providers:** all (default) or specific list from provider-map.json
```

**If complex:** Recommend `/add-framework--plan` first.

### 1.3 Worktree for Risky Builds

```
IF build involves multiple artefacts OR modifies existing commands/skills:
  → RECOMMEND user create branch + worktree before implementing
  → Reason: clean isolation, easy discard if something goes wrong
  → On problems: discard worktree (no manual rollback)
  → After implementing: /add-framework--sync to validate ecosystem consistency
```

---

## STEP 2: Design [STOP]

**⛔ GATE:** Do not implement without design approval.

### 2.1 Present Design

Present a design document showing: artefact type, path, proposed structure, planned gates (if command), and building-commands checklist.

### 2.2 Wait for Approval

**STOP AND WAIT.** Only proceed after explicit approval or requested adjustments.

---

## STEP 3: Load Skills (MANDATORY)

**BEFORE implementing, READ:**

```
.claude/skills/building-commands/SKILL.md                     # ALWAYS
.claude/skills/add-resource-path-convention/SKILL.md          # ALWAYS (path references)
framwork/.codeadd/skills/add-ecosystem/SKILL.md               # ALWAYS (ecosystem overview)
framwork/.codeadd/skills/add-token-efficiency/SKILL.md        # ALWAYS
framwork/.codeadd/skills/add-documentation-style/SKILL.md     # If generating docs
framwork/.codeadd/skills/add-skill-creator/SKILL.md           # IF type=skill
framwork/.codeadd/skills/                                      # Reference of existing skills
```

### building-commands Checklist (APPLY)

```
[ ] Top-of-file blocking section (prohibitions BEFORE instructions)
[ ] Uses STEP (imperative) instead of Phase (documentary)
[ ] Sequential INTEGER numbering (1, 2, 3... NEVER 2.5, 6.5)
[ ] Imperative language (EXECUTE, DO NOT, CONFIRM)
[ ] Gates use TOOL-SPECIFIC prohibitions
[ ] Condition blocks: IF [condition]: ⛔ DO NOT USE [tool]
[ ] Mandatory explicit order
[ ] Checklists with checkboxes (not timelines)
[ ] No `## Spec` section (prohibited — see building-commands "No `## Spec` Section")
[ ] Bash blocks only where non-obvious or learned from errors
[ ] No fixed display/error message templates
[ ] Rules: ALWAYS/NEVER markdown, no duplication of STEP order
```

**⛔ FRACTIONAL NUMBERING PROHIBITED:**
```
❌ WRONG: STEP 6, STEP 6.5, STEP 7
✅ RIGHT: STEP 6, STEP 7, STEP 8  (renumber the sequence)
```

---

## STEP 4: Implement

### 4.1 By Artefact Type

#### Command (framwork/.claude/commands/*.md + framwork/.codeadd/commands/*.md)

**Register in `framwork/provider-map.json` (MANDATORY for new commands):**

```json
"commands": {
  "[name]": { "description": "[description from command frontmatter]" }
}
```

Default providers = all (claude, codex, antigrav, cursor, opencode). Omit `providers` field to use all.

**Mandatory command structure:**

```markdown
# [Command Name]

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

[1-line description]

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
[numbered list]

**⛔ ABSOLUTE PROHIBITIONS:**
[condition blocks with tools]

---

## STEP 1: ...
## STEP 2: ...

---

## Rules

ALWAYS:
- [verb] ...

NEVER:
- [verb] ...
```

**NOTE:** Create ONLY in source of truth (`framwork/.codeadd/commands/`). Provider files are generated by `build.js` via `provider-map.json`.

#### Skill (framwork/.codeadd/skills/*/SKILL.md)

**Register in `framwork/provider-map.json` (MANDATORY for new skills):**

```json
"skills": {
  "[name]": { "providers": ["claude", "antigrav", "cursor", "opencode"] }
}
```

Use `["antigrav"]` for internal skills (not exposed to end user).

**Mandatory structure:**

```markdown
---
name: [kebab-case]
description: [when to use - max 20 words]
---

# [Name]

## Overview
[2-3 lines]

## When to Use
[list]

## When NOT to Use
[list]

## Core [specific sections]

## Validation Checklist
[checkboxes]
```

#### Script (framwork/.codeadd/scripts/*)

**Mandatory structure:**

```bash
#!/bin/bash
# ============================================
# [SCRIPT NAME]
# [1-line description]
# ============================================
# Usage: bash framwork/.codeadd/scripts/[name].sh [args]
# Dependencies: [list]
# ============================================

# --- Detection ---
[detect context]

# --- Execution ---
[main logic]

# --- Output ---
[structured output]
```

#### CLI Source (cli/src/*.js + cli/tests/*.test.js)

The npm package that installs the framework into a user's project. It is NOT an artefact of the product layer.

```
⛔ DO NOT: Register anything in framwork/provider-map.json — cli/ is not in the registry
⛔ DO NOT: Run node scripts/build.js expecting it to emit cli/ output — it never touches cli/
⛔ DO NOT: Apply the building-commands checklist to JavaScript — it governs .md artefacts only
⛔ DO NOT: Bump the version in cli/package.json — that is /add-framework--release's job
✅ DO: Edit cli/src/ and cli/tests/ directly; they ship as written
```

**Module convention:** one concern per module, owning its registry, its state helpers and its `export async function <name>(cwd, args, scope)` command entry. Follow `cli/src/features.js` and `cli/src/plugins.js`.

**A new subcommand is not reachable until it is registered.** Add it to the dispatch AND the help text in `cli/src/cli.js`.

**TESTS ARE MANDATORY, NOT OPTIONAL.** Every changed module needs coverage in `cli/tests/`. When the plan specifies a RED-first matrix, write each assertion and CONFIRM IT FAILS before writing the implementation — a test authored after the fix proves nothing.

Run tests serially. Parallel workers race on shared fixtures and produce failures unrelated to the change:

```bash
cd cli && npx vitest run --no-file-parallelism
```

CRITICAL: a parallel `npx vitest run` reports failures that vanish serially. Never diagnose a failure without re-running serially first, and never accept a green parallel run as proof.

If node output is polluted by `Debugger listening on ws://...`, an editor injected `NODE_OPTIONS`. Clear it (`unset NODE_OPTIONS VSCODE_INSPECTOR_OPTIONS`) before trusting any assertion on stdout/stderr.

**Before claiming done:** compare failures against a baseline on a clean tree (`git stash`), because this suite has pre-existing flakiness. Report the delta, never the raw count.

### 4.2 Validate During Implementation

At each section written, verify:

```
[ ] Imperative language? (not informative)
[ ] Gates have tool-specific prohibitions?
[ ] Order is mandatory? (not suggested)
[ ] Checkboxes? (not timelines)
```

---

## STEP 5: Test

### 5.1 Mental Test (MANDATORY for command | skill | script | workflow)

Simulate artefact execution with 3 scenarios: happy path, gate violation, edge case.

### 5.2 Validate vs building-commands (command | skill | script | workflow)

```
[ ] Can the agent skip gates? (must be impossible)
[ ] Are prohibitions specific? (tools, not generic)
[ ] Is the order bypassable? (must not be)
```

### 5.3 Execute the Test Suite (MANDATORY if type=cli)

A mental test is NOT evidence for JavaScript. Run it.

```
IF type=cli AND the suite has not been run serially:
  ⛔ DO NOT: Report the build as complete
  ⛔ DO NOT: Update the plan status in STEP 6
  ⛔ DO NOT: Claim a validation level passed
  ✅ DO: Run `cd cli && npx vitest run --no-file-parallelism` and read the result

IF any test fails:
  ⛔ DO NOT: Attribute it to flakiness without evidence
  ✅ DO: Re-run serially, then baseline against a clean tree, then report the delta
```

Verify every RED-first assertion the plan specified was observed failing BEFORE its implementation landed. An assertion that was never RED is an untested F-block regardless of its current colour.

**If fails:** Go back to STEP 4 and fix.

---

## STEP 6: Document

### 6.1 Changelog (MANDATORY if new/major)

```
docs/changelog/YYYY-MM-DD-[action]-[what].md
```

**Actions:** `add` | `update` | `refactor` | `remove`

### 6.2 Update plan (if exists)

Set plan status: `draft` → `implemented`, and append a changelog row naming the commit it landed in.

### 6.3 Sync the Project Anatomy counts in CLAUDE.md (MANDATORY)

`CLAUDE.md` is loaded into every session. A stale count there misinforms every
future session, not just the one that forgot to update it. The counts are
**derived facts** — compute them, never carry a number over by hand:

```bash
ls framwork/.codeadd/commands/*.md | wc -l          # Commands
ls framwork/.codeadd/skills/*/SKILL.md | wc -l      # Skills
ls framwork/.codeadd/agents/*-agent.md | wc -l      # Agents
```

Those are the same globs the Project Anatomy table itself documents. Write the
results into it. If a number already matches, leave the line untouched.

**Cross-check against the registry, and report a mismatch as a defect.** Every
count above MUST equal its entry count in `framwork/provider-map.json`. An
artefact on disk but unregistered does not ship to any provider, and an entry
registered without a file breaks the build — either way the disagreement is a
real bug in what you just built, not a documentation nit. Report it; never
paper over it by writing whichever number is larger.

```
IF THE FILESYSTEM COUNT AND provider-map.json DISAGREE:
  ⛔ DO NOT: Write either number into CLAUDE.md
  ⛔ DO NOT: Report the build as complete
  ✅ DO: Name the artefacts in the difference and fix the registration
```

### 6.4 Update the rest of CLAUDE.md for what THIS build changed (MANDATORY)

Counts are not the only thing that goes stale. A build that adds a feature
flag, a plugin, a command, or changes the pipeline leaves `CLAUDE.md`
describing a framework that no longer exists. Update it here — this command
finishes the job, it does not hand a chore to another one.

Walk the sections `CLAUDE.md` actually has and update every one this build
touched:

| If this build… | Update |
|---|---|
| added or removed a command | the internal/product command table, and its row's purpose |
| added or removed a skill or agent | the cross-reference table, and any "used by" column naming it |
| changed the build pipeline or a transform | the Pipeline section and its transform table |
| added or changed a feature flag | the Feature Injection System table |
| added or changed a plugin, fragment or injection point | the Plugin System section |
| added a schema, contract or sidecar | the section that documents that mechanism |
| force-added something under `docs/` | the tracking-policy paragraph — **and say WHY**, which that paragraph explicitly requires |

**Discipline: edit what this build changed, nothing else.**

```
IF A CLAUDE.md SECTION IS UNRELATED TO WHAT YOU BUILT:
  ⛔ DO NOT USE: Edit to reword, reorganise or "improve" it
  ✅ DO: Leave it byte-identical
```

A build that rewrites the plugin section because it added a skill produces a
diff nobody can review. Touch the rows your own work invalidated.

Read `framwork/.codeadd/skills/add-claude-md-style/SKILL.md` before writing — it owns what belongs in
`CLAUDE.md` versus what belongs in a skill, the format rules, and the line
budget. A build that grows `CLAUDE.md` past its budget has traded one problem
for another.

**Why 6.3 and 6.4 are here at all:** neither a derived number nor a table row
describing what you just shipped ever needed its own plan-and-build cycle.
`/add-framework--self-plan` is for *designing* the internal layer — changing
how these commands work — not for bookkeeping the product layer's own facts.

---

## STEP 7: Completion

Show summary: artefact path, type, plan link, files created/updated, validations passed, usage instructions.

**Also report, always:**

- the Project Anatomy counts as 6.3 computed them, and whether any changed;
- every `CLAUDE.md` section 6.4 updated, and why. If nothing beyond the counts needed changing, say so — silence is indistinguishable from not having looked.

Do NOT name `/add-framework--self-plan` for anything 6.3 or 6.4 already did. Name it only when this build revealed that the internal layer's own **design** needs to change — a command whose steps are now wrong, a skill that needs rewriting.

---

## Rules

ALWAYS:
- Load building-commands skill before creating any command
- Apply ALL patterns from the skill
- Test mentally before finalizing
- Document changes and update ecosystem map
- Use sequential INTEGER numbering (1,2,3)
- Renumber steps when inserting new ones
- Register new command/skill in framwork/provider-map.json
- Compute the CLAUDE.md Project Anatomy counts from the filesystem and cross-check them against provider-map.json
- Update every CLAUDE.md section this build invalidated, and load add-claude-md-style before writing it
- Create source file in framwork/.codeadd/ (source of truth)
- Run the cli/ suite serially before reporting any result from it
- Baseline a failing cli/ test against a clean tree before blaming the change

NEVER:
- Register cli/ artefacts in provider-map.json — cli/ is outside the build registry
- Bump cli/package.json version — that belongs to /add-framework--release
- Report a cli/ build complete on a mental test alone
- Implement without plan/context loaded
- Skip design approval
- Use informative language in commands ("it's recommended")
- Create generic gates (without tool-specific prohibitions)
- Use Phase instead of STEP
- Use fractional numbering (2.5, 6.5)
- Insert steps without renumbering
- Carry a CLAUDE.md count over by hand instead of computing it
- Reword a CLAUDE.md section this build did not invalidate
- Defer CLAUDE.md to a separate command — this build finishes it
- Create provider files manually (use framwork/.codeadd/ + provider-map.json)
- Add a `## Spec` section to commands or skills (prohibited)
