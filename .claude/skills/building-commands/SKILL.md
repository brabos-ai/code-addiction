---
name: building-commands
description: Use when designing command workflows or refactoring existing commands — applies prompting best practices to ensure agents execute intended logic instead of skipping steps or rationalizing. Use this skill whenever creating new commands, reviewing why a command skipped steps or executed out of order, fixing agent compliance issues, converting Phase-based commands to STEP-based, or when /add.make needs to generate a command. Also use when the user mentions "o agente pulou", "agent skipped", "command não funciona", or asks to improve prompt quality of any .md command file.
---

# Building Commands

## Overview

**Commands fail not from unclear logic but from unclear PRESSURE POINTS.** Agents skip steps when gates are implicit, execute wrong order when sequence isn't mandatory, and rationalize when checklists are vague timelines instead of checkboxes.

**Core principles:**
1. **Imperative > Informative** — Commands are ORDERS, not documentation
2. **Tool-specific prohibitions** — "DO NOT USE Grep" instead of "STOP"
3. **Gates block** — Execution path impossible to get wrong
4. **Checklists verify** — Checkboxes, not timelines

---

## When to Use

**Symptoms you need this skill:**
- Commands have optional "recommendations" agents skip
- Investigations jump to code before reading docs
- Agents skip branch creation / environment setup steps
- Build/test failures reveal missing validation points
- Post-command status doesn't match what was supposed to happen

**Apply when designing/refactoring commands:** hotfix, dev, done, feature, plan, etc.

**NOT for:** Single-line commands, emergency fixes (use quick judgment)

---

## Command Structure

The high-level flow every command follows: load context → gate check → investigate → execute → complete. Prohibitions sit at the top so the agent processes them before any action.

```
1. LANG header (MANDATORY)
2. Spec JSON (OPTIONAL — data only, see Spec JSON section)
3. ⛔ Blocking section — prohibitions BEFORE instructions
4. STEP 1: Load context
5. STEP 2: Validate/discover (gate check)
6. STEP 3: Investigate (docs → code)
7. STEP N: Execute
8. STEP N+1: Complete (inform user)
9. Rules — ALWAYS/NEVER markdown
```

### Template

```markdown
# Command Name

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

[1-line description]

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: [action]            → [constraint]
STEP 2: [action]            → [constraint]

**⛔ ABSOLUTE PROHIBITIONS:**

IF [condition]:
  ⛔ DO NOT USE: [specific tool]
  ✅ DO: [correct action]

---

## STEP 1: ...

---

## Rules

ALWAYS:
- [verb] ...

NEVER:
- [verb] ...
```

---

## Language Rule (MANDATORY)

**ALL commands MUST be written 100% in English.** Commands are consumed by multiple providers and contributors across languages — English is the common denominator. User interaction language is handled by the LANG header.

**MANDATORY first line after title:**
```markdown
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
```

This ensures:
- Command logic, headers, rules, gates → **English**
- Agent responses to user → **user's detected language**
- Git commits, branches, code → **English**

**DO NOT create "detect language" blocks.** The LANG header is sufficient. Modern models detect language automatically from user input. Blocks like "FIRST ACTION: DETECT RESPONSE LANGUAGE → 1. Read user's message → 2. Set RESPONSE_LANG..." waste tokens and add zero behavioral value.

---

## Imperative Language (FUNDAMENTAL)

Commands are ORDERS, not documentation. Agents treat informative text as optional context. Imperative text is processed as mandatory instruction.

```
❌ "It's recommended to create the branch before editing code"
✅ "CREATE the branch. DO NOT edit code on main."

❌ Phase 1: Quick Discovery
✅ STEP 1: Run Context Mapper (FIRST COMMAND)

❌ "The suggested order is: docs → code → implementation"
✅ "MANDATORY ORDER: 1) READ docs 2) INVESTIGATE code 3) IMPLEMENT"
```

Use `STEP N:` for sequential mandatory actions, `N.1`/`N.2` for sub-actions. Add imperative context: `(FIRST COMMAND)`, `(MANDATORY if main)`, `(BEFORE code)`.

---

## Gate Implementation

**NOT:** "Recommended: Check X"
**YES:** "⛔ GATE: If X not true → STOP, do Y first"

Agents respect explicit blockers more than recommendations. The reason generic gates fail is that saying "STOP" doesn't prevent the agent from using Grep/Read — you need to **prohibit specific tools**.

```
❌ WEAK (agent ignores):
⛔ GATE: Branch must be fix/F*
   If main → create branch first

✅ STRONG (agent obeys):
IF BRANCH = main:
  ⛔ DO NOT USE: Grep on code files
  ⛔ DO NOT USE: Read on code files
  ⛔ DO NOT: Code investigation or implementation
  ✅ DO: Create branch IMMEDIATELY
```

**Why it works:** "STOP" is vague. "DO NOT USE Grep" is specific and verifiable.

### Condition Block Format

Prohibitions must be **tied to specific conditions**:

```
IF [condition]:
  ⛔ DO NOT USE: [specific tool]
  ⛔ DO NOT: [specific action]
  ✅ DO: [correct action]
```

### Top-of-File Placement

Prohibitions must come BEFORE instructions. If they're in the middle or end, the agent has already started executing wrong. Agent reads top-down — prohibitions at the top are processed before any action.

---

## Checklists, Not Timelines

Checkboxes are verifiable — either done or not. Timelines are estimates the agent ignores because there's no verification mechanism.

```
❌ BAD:
Phase 2: Rapid Investigation (5-10 minutes)
- Analyze flow
- Find root cause

✅ GOOD:
### PRE-INVESTIGATION
- [ ] Script executed
- [ ] RECENT_CHANGELOGS analyzed
- [ ] Feature docs read

### DURING
- [ ] Root cause identified
- [ ] Confirmed with user
```

---

## Investigation Order (MANDATORY)

```
1. Parse script output → identify related features
2. READ docs (changelog, about.md) → understand WHAT changed + WHY
3. NOW search code → understand HOW (with context from docs)
```

Most bugs relate to recent changes. Script output points directly to the relevant context. Jumping to code without reading docs means investigating blind.

---

## Spec JSON (OPTIONAL — Data Only)

Spec JSON is OPTIONAL. Use it ONLY for data the LLM needs to look up — paths, outputs, modes, routing tables. **DO NOT use it to duplicate behavioral instructions** that already exist in STEPs or prohibitions.

Structured data does not orient behavior. The LLM does not "consult" a JSON to decide its next step — it follows natural language instructions. Putting gates/order in JSON just wastes tokens repeating what the STEPs already say.

```
✅ GOOD — data the LLM consults:
{"outputs":{"command":"framwork/.codeadd/commands/*.md"},"modes":{"create":"STEP 0-8","list":"STEP 0 + STEP 9"}}

❌ BAD — behavioral duplication:
{"gates":["gh_authenticated","branch_is_main"],"order":["prerequisites","branch_check","merge"]}
```

**Rule of thumb:** If removing the Spec JSON would cause the LLM to miss information not available elsewhere in the command → keep it. If everything is restated in STEPs/prohibitions → remove it.

---

## Bash Blocks: Intent Over Script

**DO NOT prescribe bash commands for operations the LLM already knows.** `git branch --show-current`, `cat file | grep`, `git checkout && git merge` — these waste tokens stating the obvious.

**Use explicit bash ONLY when:**
- A past error proved the LLM gets it wrong without guidance (e.g., `git fetch --tags` before listing tags)
- The exact command matters and is non-obvious (e.g., specific flags, pipe chains)
- The command has side effects that must be precise (e.g., `sed` with exact regex)

```
❌ BAD (obvious):
Execute: git branch --show-current
If not main, display error and stop.

✅ GOOD (intent):
Verify current branch is `main`. If not → show current branch, instruct to switch, STOP.

✅ GOOD (non-obvious, learned from error):
Execute:
  git fetch --tags
  git tag --sort=-v:refname
CRITICAL: Without fetch, remote tags are invisible locally.
```

---

## Display Templates: Let the LLM Generate

**DO NOT prescribe fixed message templates.** The LLM generates better contextual messages than hardcoded templates. Templates waste tokens for worse output.

**Exception:** Output format templates that define downstream structure (changelog format, report format) ARE useful — they define what the output looks like, not what the error message says.

```
❌ BAD (fixed error message):
If NOT_FOUND, display:
  "GitHub CLI (gh) not found. Install: ..."

✅ GOOD (intent):
If gh not found → show install instructions for user's platform and STOP.

✅ GOOD (output format template):
Format changelog (omit empty sections):
  ## Commands
  - Added: [list]
  - Modified: [list]
```

---

## Rules Section Format

Commands end with a `## Rules` section using ALWAYS/NEVER markdown. This format uses ~30% fewer tokens than JSON for flat lists, has higher compliance with native imperative language, and aligns with condition blocks already used in commands.

```markdown
## Rules

ALWAYS:
- Complete STEP 3 inspection before ANY layout proposal
- Load relevant skill BEFORE implementing
- Log iteration BEFORE informing user

NEVER:
- Commit or stage any code
- Skip discovery phase
- Proceed without response to [STOP]
```

**Conventions:**
- Each item starts with a verb in infinitive form
- No numbering (permanent rules, not sequence)
- Maximum ~15 words per item
- Rules MUST contain ONLY information NOT derivable from STEP order or condition blocks

**Test each rule:** "If I remove this rule, would the LLM behave differently given the STEPs and prohibitions?" If NO → redundant, remove it.

```
❌ REDUNDANT (already in STEP order):
ALWAYS: Merge main into production before creating tag  ← STEP 6 before STEP 8

✅ NOT REDUNDANT (business knowledge outside STEPs):
NEVER: Run node scripts/build.js — pipeline's job
```

---

## Log Iteration (Mandatory Completion Step)

Every command that modifies code MUST log iteration before user notification. Iteration tracking enables pattern discovery across runs — without it, the same mistakes repeat because there's no history to learn from.

```bash
bash .fnd/scripts/log-iteration.sh "type" "slug" "what" "files"
```

**Types:** fix, enhance, refactor, add, remove, config

---

## Agent Dispatch

Commands that orchestrate multiple subagents MUST use intent-based dispatch for portability across agent engines. Read `references/agent-dispatch.md` for the full pattern (capability levels, complexity hints, dispatch/wait blocks).

---

## Refactoring Workflow

When refactoring an existing command using this skill:

**STEP 1: Read** — Read the target command completely.

**STEP 2: Audit** — Run the Validation Checklist below. List every violation found.

**STEP 3: Classify** — For each section of the command, assign one action:

| Action | When |
|--------|------|
| **KEEP** | Business logic, domain knowledge, learned-from-error rules |
| **REMOVE** | Spec JSON duplicating STEPs, detect-language blocks, obvious bash, fixed display templates, redundant rules |
| **SIMPLIFY** | Verbose STEPs → intent-only (remove bash/templates, keep what the step must achieve) |
| **REFORMAT** | Rules JSON → ALWAYS/NEVER markdown, PT-BR → English, Phase → STEP |

**STEP 4: Rewrite** — Rewrite the command preserving all business logic. Verify no domain knowledge was lost by comparing KEEP items against the new version.

---

## Validation Checklist

Before deploying command:

### Structure
- [ ] **LANG header present** (first line after title) — no "detect language" blocks
- [ ] **Written 100% in English** (command logic, headers, rules, gates)
- [ ] Spec JSON contains only consultable data (paths, outputs, modes) — or is absent
- [ ] Top-of-file blocking section (prohibitions BEFORE instructions)
- [ ] Uses STEP (imperative) instead of Phase (documentary)
- [ ] Imperative language throughout (EXECUTE, DO NOT, CONFIRM)
- [ ] Bash blocks only where non-obvious or learned from past errors
- [ ] No fixed display/error message templates (let LLM generate)

### Gates & Prohibitions
- [ ] 3+ gates explicitly block wrong actions
- [ ] Gates use TOOL-SPECIFIC prohibitions (not just "STOP")
- [ ] Condition blocks tie prohibitions to specific states
- [ ] Format: `IF [condition]: ⛔ DO NOT USE [tool]`

### Order & Verification
- [ ] Investigation order mandatory (docs → code)
- [ ] Checklists have verification items (not timeline)
- [ ] Script output parsed as data (table of actions)

### Resource Path References
- [ ] References to other commands use `{{cmd:NAME}}` (never `.codeadd/commands/`)
- [ ] References to skills use `{{skill:NAME/FILE}}` (never `.codeadd/skills/`)
- [ ] References to scripts use `.codeadd/scripts/` (fixed path, no variable)
- [ ] See `add-resource-path-convention` skill for details

### Rules Section
- [ ] Uses ALWAYS/NEVER markdown (NOT JSON `{"do":[],"dont":[]}`)
- [ ] Each rule starts with verb in infinitive form
- [ ] No numbered items (rules are permanent, not sequential)
- [ ] No rules that merely restate STEP order or condition blocks

### Completion
- [ ] Iteration logging in completion phase
- [ ] No "recommendations" (use gates instead)

### Agent Dispatch (if command uses subagents)
- [ ] Uses intent-based dispatch (see `references/agent-dispatch.md`)
- [ ] No hardcoded `subagent_type`, `model`, `Task()`, or `TaskOutput` references

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Informative language ("it's recommended") | Imperative ("EXECUTE", "DO NOT") |
| Generic gate ("STOP, create branch") | Tool prohibition: "DO NOT USE Grep if BRANCH=main" |
| Prohibitions in middle of file | Move to TOP-OF-FILE before instructions |
| Using "Phase" (documentary) | Use "STEP" (imperative) |
| Command written in PT-BR or mixed | Command 100% in English + LANG header |
| Spec JSON with gates/order duplicating STEPs | Remove or keep only data (paths, outputs, modes) |
| Bash blocks for obvious operations | Use intent: "Verify branch is main. If not → STOP" |
| Fixed display/error message templates | Let the LLM generate contextual messages |
| Rules that restate STEP order | Remove — STEP sequence already enforces this |
| "DETECT LANGUAGE" blocks after LANG header | Remove — LANG header is sufficient |
| `{"do":[...],"dont":[...]}` for rules | Use ALWAYS/NEVER markdown |
