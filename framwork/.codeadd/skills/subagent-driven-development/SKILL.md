---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session - dispatches fresh subagent for each task with code review between tasks, enabling fast iteration with quality gates
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with code review after each.

**Core principle:** Fresh subagent per task + review between tasks = high quality, fast iteration

**NEW (v2):** Uses Prompt Builder pattern - coordinator processes context and delivers digested information to subagents.

> **Provider-Agnostic:** This skill describes WHAT to dispatch (intent + prompt), not HOW. Use your platform's subagent mechanism (Task tool, sub-process, agent call, etc.).

## Overview

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Code review after each task (catch issues early)
- Faster iteration (no human-in-loop between tasks)

**When to use:**
- Staying in this session
- Tasks are mostly independent
- Want continuous progress with quality gates

**When NOT to use:**
- Need to review plan first (use executing-plans)
- Tasks are tightly coupled (manual execution better)
- Plan needs revision (brainstorm first)

---

## The Prompt Builder Pattern

**CRITICAL:** All subagent prompts MUST follow this structure:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBAGENT PROMPT TEMPLATE                     │
├─────────────────────────────────────────────────────────────────┤
│  ## ROLE                                                        │
│  You are the [AREA] [agent type] for task [N].                  │
│                                                                 │
│  ## CONTEXT DIGEST (pre-processed by coordinator)               │
│  [Compact summary - NO file reading needed]                     │
│                                                                 │
│  ## DECISION LOG (from previous tasks)                          │
│  [Accumulated decisions from earlier subagents]                 │
│                                                                 │
│  ## SKILLS                                                      │
│  MANDATORY: [always for this area]                              │
│  ADDITIONAL: [detected from context]                            │
│                                                                 │
│  ## REFERENCE FILES (pre-identified)                            │
│  [Table with exact paths and lines]                             │
│                                                                 │
│  ## COORDINATOR NOTES                                           │
│  [Decisions, warnings, patterns to follow/avoid]                │
│                                                                 │
│  ## TASK                                                        │
│  [Specific deliverables for this subagent]                      │
│                                                                 │
│  ## REPORT FORMAT                                               │
│  [What to return to coordinator]                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Process

### 1. Load Plan + Initialize Decision Log

Read plan file, create TodoWrite with all tasks, initialize decision log:

```markdown
### DECISION LOG
<!-- Coordinator maintains, updates after each task -->

#### Session Start
- Plan: [plan-file location]
- Tasks: [count]
- Working directory: [path]
```

### 2. Pre-Process Context (Coordinator's Job)

Before dispatching ANY subagent, the coordinator MUST:

1. **Create Context Digest** - Summary of plan/requirements (~30-50 lines)
2. **Identify References** - Find similar files in codebase
3. **Compose Skills** - Determine mandatory + additional skills
4. **Write Coordinator Notes** - Specific guidance for this task

**Reference Discovery:**
- `Glob` - find files by pattern (*.service.ts, *.controller.ts)
- `Grep` - search for string/pattern matches

### 3. Execute Task with Subagent

For each task, dispatch with PROCESSED context:

```
Dispatch implementation subagent with this prompt:

    ## ROLE
    You are implementing Task N from [plan-file].

    ## CONTEXT DIGEST (DO NOT re-read files)
    [Pre-processed summary created by coordinator]

    ## DECISION LOG (from previous tasks)
    [Accumulated decisions - what was already done]

    ## SKILLS
    MANDATORY:
    - [skill for this area]

    ADDITIONAL (detected):
    - [extra skills if needed]

    ## REFERENCE FILES
    | Pattern | Path | Notes |
    |---------|------|-------|
    | [type] | [path] | [why useful] |

    ## COORDINATOR NOTES
    - [Specific guidance]
    - [Warnings/patterns to avoid]
    - [Dependencies from previous tasks]

    ## TASK
    [Specific deliverables from plan]

    ## REPORT FORMAT
    Return:
    1. FILES_CREATED: [list]
    2. FILES_MODIFIED: [list]
    3. BUILD_STATUS: [pass/fail]
    4. DECISIONS_MADE: [list]
    5. ISSUES_ENCOUNTERED: [if any]
```

### 4. Update Decision Log

**After subagent returns**, update the decision log:

```markdown
#### Task N: [task name]
- FILES_CREATED: [list]
- FILES_MODIFIED: [list]
- DECISIONS_MADE: [from subagent report]
- STATUS: completed
```

### 5. Review Subagent's Work

**Dispatch code-reviewer subagent with accumulated context:**

```
Dispatch review subagent with this prompt:

    ## ROLE
    You are reviewing Task N implementation.

    ## DECISION LOG (full)
    [All decisions up to this point]

    ## FILES TO REVIEW
    [From task N report - FILES_CREATED + FILES_MODIFIED]

    ## SKILLS
    - .codeadd/skills/code-review/SKILL.md

    ## COORDINATOR NOTES
    - Verify implementation matches plan specifications
    - Check for IoC registration (providers, exports)
    - Validate multi-tenancy patterns

    ## TASK
    1. Read all changed files
    2. Validate against plan
    3. Check skill patterns
    4. AUTO-FIX issues found
    5. Report findings

    ## REPORT FORMAT
    Return:
    1. ISSUES_FOUND: [list with severity]
    2. ISSUES_FIXED: [list]
    3. BUILD_STATUS: [pass/fail]
    4. SCORE: [X/10]
```

### 6. Apply Review Feedback

**If issues found:**
- Fix Critical issues immediately (dispatch fix subagent)
- Fix Important issues before next task
- Note Minor issues in decision log

**Fix subagent prompt includes:**
```
## DECISION LOG
[Full log including review findings]

## ISSUES TO FIX
[From review report]

## COORDINATOR NOTES
- Review found [N] issues
- Priority: [Critical first]
```

### 7. Mark Complete, Next Task

- Mark task as completed in TodoWrite
- Update Decision Log with final status
- Move to next task
- Repeat steps 3-6

### 8. Final Review

After all tasks complete, dispatch final code-reviewer with COMPLETE decision log:

```
## FULL DECISION LOG
[All tasks, all decisions, all files]

## VERIFICATION CHECKLIST
[From plan - what should exist]

## TASK
- Review entire implementation
- Verify all plan requirements met
- Check overall architecture
- Final build verification
```

---

## Example Workflow

```
You: I'm using Subagent-Driven Development with Prompt Builder pattern.

[Load plan, create TodoWrite, initialize Decision Log]

=== Task 1: Hook installation script ===

[Pre-process: create context digest, find references]

[Dispatch subagent with processed context]
Subagent:
  FILES_CREATED: [scripts/install-hook.sh]
  DECISIONS_MADE: [Used POSIX sh for compatibility]
  BUILD_STATUS: pass

[Update Decision Log with Task 1 results]

[Dispatch review subagent with full decision log]
Reviewer: Strengths: Good coverage. Issues: None. Score: 9/10

[Mark Task 1 complete]

=== Task 2: Recovery modes ===

[Pre-process with updated decision log]

[Dispatch subagent - receives Task 1 decisions]
Subagent:
  FILES_CREATED: [src/recovery.ts]
  DECISIONS_MADE: [Added verify/repair modes]
  BUILD_STATUS: pass

[Dispatch review subagent]
Reviewer: Issues (Important): Missing progress reporting

[Dispatch fix subagent with review findings]
Fix subagent: Added progress every 100 items

[Update Decision Log, mark Task 2 complete]

...

[After all tasks - Final review with complete decision log]
Final reviewer: All requirements met, ready to merge

Done!
```

---

## Context Digest Template

When creating context digest for subagents:

```markdown
### CONTEXT DIGEST

#### Plan Summary
- Feature: [name/ID]
- Goal: [2-3 sentences]
- Total Tasks: [N]
- Current Task: [N of M]

#### Task Details
[Relevant section from plan for this specific task]

#### Dependencies
- Requires: [what must exist before this task]
- Provides: [what this task creates for later tasks]

#### Technical Constraints
- [From plan/architecture]
```

---

## Decision Log Structure

Maintain throughout session:

```markdown
### DECISION LOG

#### Session Info
- Plan: [location]
- Started: [timestamp]
- Working Directory: [path]

#### Task 1: [name]
- Status: completed
- Files Created: [list]
- Files Modified: [list]
- Decisions: [list]
- Review Score: [X/10]

#### Task 2: [name]
- Status: in_progress
- Depends On: Task 1 (entities created)
- ...

#### Accumulated Decisions
- [Decision 1 from Task 1]
- [Decision 2 from Task 2]
- ...
```

---

## Advantages

**vs. Manual execution:**
- Subagents receive processed context (no re-discovery)
- Decision log propagates knowledge
- Reference files pre-identified
- Coordinator notes provide intelligent guidance

**vs. Old Pattern (file paths):**
- Subagents don't waste time reading docs
- Coordinator can inject specific warnings
- Better skill composition (detects what's needed)
- References are exact (not "find similar")

**Cost:**
- Coordinator does more upfront work
- But subagents are faster and more accurate

---

## Red Flags

**Never:**
- Skip pre-processing context
- Pass file paths instead of content digest
- Forget to update decision log
- Skip code review between tasks
- Proceed with unfixed Critical issues
- Dispatch multiple implementation subagents in parallel (conflicts)

**If subagent fails task:**
- Add failure to decision log
- Dispatch fix subagent with full context
- Don't try to fix manually (context pollution)

---

## Integration

**Required patterns:**
- **Prompt Builder** - All prompts use modular structure
- **Decision Log** - Maintained throughout session
- **Context Digest** - Pre-processed for every subagent

**Reference scripts:**
- `bash .codeadd/scripts/status.sh` - Get feature context
- `bash .codeadd/scripts/architecture-discover.sh` - Codebase structure overview

**Skills to compose:**
- Backend: `.codeadd/skills/backend-development/SKILL.md`
- Database: `.codeadd/skills/database-development/SKILL.md`
- Frontend: `.codeadd/skills/frontend-development/SKILL.md` + `.codeadd/skills/ux-design/SKILL.md`
- Review: `.codeadd/skills/code-review/SKILL.md`

See also: `.claude/commands/autopilot.md` for full autonomous workflow

---

## PRD0031 — Persistent Decision Logging

**decisions.jsonl** is the persistent record of implementation decisions per feature.
Located at: `docs/features/${FEATURE_ID}/decisions.jsonl`

### When to Log

Log **only pivots** — when a subagent changes approach during implementation. `choice` and `result` were removed (no consumer reads them, only pivots are filtered by context mapping).

| Moment | type | Required Fields | Optional |
|--------|------|-----------------|----------|
| When pivoting to different approach | `pivot` | ts, agent, type, decision, reason, from | attempt, error |

### Log Format (JSONL — one JSON per line)

```jsonl
{"ts":"2026-02-18T14:45:00Z","agent":"backend","type":"pivot","from":"Prisma","decision":"Switch to Drizzle","reason":"Prisma migration failed with Supabase edge functions","attempt":1,"error":"Migration timeout on edge runtime"}
```

### Append Command

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/decisions.jsonl" "<type>" "<agent>" '"decision":"[what]","reason":"[why]"'
```

### Central File (consolidated by /add-done)

`.codeadd/project/decisions.jsonl` — all project decisions, consolidated at feature completion.
Used by context mapping at start of new features (read last 20 pivots as warnings).

---

## PRD0032 — Architect Subagent Pattern (tasks.md)

**tasks.md** is the structured execution plan generated after plan.md is created.
Located at: `docs/features/${FEATURE_ID}/tasks.md` (or subfeature dir)

### When to Dispatch Architect Subagent

After plan.md is created and validated (STEP 9.4 of /add-plan).

### Architect Subagent Dispatch

**Capability:** read-write | **Complexity:** standard

**Prompt:**
```
Read plan.md + about.md + discovery.md.
Generate tasks.md with atomic subtasks:
- 1 service per task (database | backend | frontend | test | infra)
- Maximum 3 files per task
- Explicit deps (task IDs, or "-")
- Verify: command/curl/browser check per task
- Order: database → backend → frontend → test
- Complexity: SIMPLE (≤5), STANDARD (6-12), COMPLEX (13+, warn)
```

### tasks.md Format

```markdown
# Tasks: [feature or subfeature name]

## Metadata
| Campo | Valor |
|-------|-------|
| Complexity | STANDARD |
| Total tasks | 8 |
| Services | database, backend, frontend |

## Tasks
| ID | Description | Service | Files | Deps | Verify |
|----|-------------|---------|-------|------|--------|
| 1.1 | Create users table migration | database | `migrations/001.ts` | - | `npm run migrate` |
| 2.1 | Create signup endpoint | backend | `api/controller.ts`, `api/dto.ts` | 1.1 | `curl POST /api/signup` |
| 3.1 | Create SignupForm component | frontend | `components/SignupForm.tsx` | 2.1 | browser: form renders |
```

### TASKS MODE in /add-dev

When `HAS_TASKS=true`, /add-dev executes by tasks:
1. READ tasks.md → group by service
2. Execute database group first
3. AFTER each group: run verify commands
4. IF verify fails: fix before advancing
5. Pass relevant tasks to each subagent (not "all of plan.md")
