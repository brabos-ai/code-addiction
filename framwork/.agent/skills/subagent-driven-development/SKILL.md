<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/subagent-driven-development/SKILL.md -->
---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session - dispatches fresh subagent for each task with code review between tasks, enabling fast iteration with quality gates. Use this skill whenever coordinating multiple subagents for feature implementation, whether from /add-dev, /add-autopilot, or standalone plan execution.
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with code review after each.

**Core principle:** Fresh subagent per task + review between tasks = high quality, fast iteration

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

## TASK_DOCUMENTS Pattern

Subagents must read original documentation — never work from summaries. The coordinator knows which docs are relevant (feature vs subfeature, epic-aware paths) and passes them as an explicit list. The subagent reads them directly.

**Why this matters:** An LLM summarizing docs for another LLM is a telephone game — information loss is guaranteed. The subagent cannot detect what was omitted from a summary. Reading original docs is the only way to guarantee fidelity to the specification.

**How it works:**

1. **Coordinator** determines which docs the subagent needs (about.md, plan.md, discovery.md, tasks.md, etc.)
2. **Coordinator** writes a `TASK_DOCUMENTS` section in the subagent prompt with the exact file paths
3. **Subagent** reads ALL listed files as its first action — these are the source of truth

**Example — simple feature:**
```
## TASK_DOCUMENTS (read ALL before starting — source of truth)
- docs/features/F0005-media-library/about.md
- docs/features/F0005-media-library/plan.md
```

**Example — epic with subfeatures:**
```
## TASK_DOCUMENTS (read ALL before starting — source of truth)
- docs/features/F0005-media-library/about.md
- docs/features/F0005-media-library/discovery.md
- docs/features/F0005-media-library/subfeatures/SF01-chunked-analysis/about.md
- docs/features/F0005-media-library/subfeatures/SF01-chunked-analysis/plan.md
```

The coordinator already knows if it's a simple feature or epic, which subfeature is current, and which docs exist. It assembles the correct list. The subagent has zero conditional logic — just reads what it receives.

---

## Subagent Prompt Template

All subagent prompts follow this structure:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBAGENT PROMPT TEMPLATE                     │
├─────────────────────────────────────────────────────────────────┤
│  ## ROLE                                                        │
│  You are the [AREA] [agent type] for task [N].                  │
│                                                                 │
│  ## TASK_DOCUMENTS (read ALL before starting — source of truth) │
│  [List of file paths — subagent reads these directly]           │
│                                                                 │
│  ## DECISION LOG (from previous tasks)                          │
│  [Accumulated decisions from earlier subagents]                 │
│                                                                 │
│  ## SKILLS                                                      │
│  MANDATORY: [always for this area]                              │
│  ADDITIONAL: [detected from context]                            │
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

### 2. Pre-Dispatch Preparation (Coordinator's Job)

Before dispatching ANY subagent, the coordinator:

1. **Assemble TASK_DOCUMENTS** — list all doc paths the subagent needs (epic-aware)
2. **Identify Reference Files** — find similar files in codebase via Glob/Grep
3. **Compose Skills** — determine mandatory + additional skills for this area
4. **Write Coordinator Notes** — specific guidance, warnings, patterns from previous tasks

### 3. Execute Task with Subagent

For each task, dispatch with TASK_DOCUMENTS:

```
Dispatch implementation subagent with this prompt:

    ## ROLE
    You are implementing Task N from [plan-file].

    ## TASK_DOCUMENTS (read ALL before starting — source of truth)
    - [path/to/about.md]
    - [path/to/plan.md]
    - [path/to/tasks.md]

    ## MANDATORY: Load Context (FIRST STEP)
    1. Run: bash .codeadd/scripts/status.sh
    2. Read ALL files listed in TASK_DOCUMENTS above
    3. Read your area's skill file (see SKILLS section)

    ## DECISION LOG (from previous tasks)
    [Accumulated decisions - what was already done]

    ## SKILLS
    MANDATORY:
    - [skill for this area]

    ADDITIONAL (detected):
    - [extra skills if needed]

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

Dispatch code-reviewer subagent with accumulated context:

```
Dispatch review subagent with this prompt:

    ## ROLE
    You are reviewing Task N implementation.

    ## TASK_DOCUMENTS (read ALL before reviewing — source of truth)
    [Same docs as the implementation subagent received]

    ## DECISION LOG (full)
    [All decisions up to this point]

    ## FILES TO REVIEW
    [From task N report - FILES_CREATED + FILES_MODIFIED]

    ## SKILLS
    - .codeadd/skills/code-review/SKILL.md

    ## COORDINATOR NOTES
    - Verify implementation matches spec from TASK_DOCUMENTS
    - Check for IoC registration (providers, exports)
    - Validate multi-tenancy patterns

    ## TASK
    1. Read all files from TASK_DOCUMENTS (spec)
    2. Read all changed files (implementation)
    3. Validate implementation against spec
    4. Check skill patterns
    5. AUTO-FIX issues found
    6. Report findings

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

### 8. Coordinator Compliance Gate

After ALL tasks complete and BEFORE reporting completion, the coordinator verifies the implementation matches the specification. This is not a review — it's a cross-reference check.

**Why this exists:** Subagents may complete their tasks and pass code review, but still miss requirements from the spec. The coordinator is the only actor who has both the full spec and the full Decision Log. This gate catches gaps before they reach the user.

**Steps:**

1. **Re-read TASK_DOCUMENTS** (about.md, plan.md) to extract RF/RN list
2. **Cross-reference** each RF/RN against FILES_CREATED/FILES_MODIFIED from the Decision Log
3. **Quick-read** relevant implementation files to confirm the requirement exists in code
4. **If any RF/RN has no corresponding implementation:**
   - List missing items
   - Dispatch fix subagent with the missing requirements + TASK_DOCUMENTS
   - Re-run this gate after fix
5. **If ALL RF/RN are covered:** proceed to Final Review

```
⛔ DO NOT report completion without executing this gate.
⛔ DO NOT skip quick-read — file existence alone does not confirm implementation.
```

### 9. Final Review

After Compliance Gate passes, dispatch final code-reviewer with COMPLETE decision log:

```
## FULL DECISION LOG
[All tasks, all decisions, all files]

## TASK_DOCUMENTS
[All feature/subfeature docs]

## VERIFICATION CHECKLIST
[From plan - what should exist]

## TASK
- Review entire implementation against TASK_DOCUMENTS
- Verify all plan requirements met
- Check overall architecture
- Final build verification
```

---

## Example Workflow

```
Coordinator: Loading plan, creating TodoWrite, initializing Decision Log.

=== Task 1: Hook installation script ===

[Assemble TASK_DOCUMENTS, find references, compose skills]

[Dispatch subagent with TASK_DOCUMENTS — subagent reads docs directly]
Subagent:
  FILES_CREATED: [scripts/install-hook.sh]
  DECISIONS_MADE: [Used POSIX sh for compatibility]
  BUILD_STATUS: pass

[Update Decision Log with Task 1 results]

[Dispatch review subagent with same TASK_DOCUMENTS + decision log]
Reviewer: Strengths: Good coverage. Issues: None. Score: 9/10

[Mark Task 1 complete]

=== Task 2: Recovery modes ===

[Assemble TASK_DOCUMENTS with updated decision log]

[Dispatch subagent — reads docs + receives Task 1 decisions]
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

=== Coordinator Compliance Gate ===

[Re-read about.md + plan.md → extract RF/RN]
[Cross-reference against Decision Log → all 8 RF covered]
[Quick-read key files → implementations confirmed]
Gate: PASS

=== Final Review ===

[Dispatch final reviewer with complete decision log + TASK_DOCUMENTS]
Final reviewer: All requirements met, ready to merge

Done!
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

## Red Flags

**Never:**
- Pass summaries/digests instead of file paths — subagents must read original docs
- Skip assembling TASK_DOCUMENTS (coordinator must always provide doc paths)
- Forget to update decision log
- Skip code review between tasks
- Proceed with unfixed Critical issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Skip Coordinator Compliance Gate before reporting completion

**If subagent fails task:**
- Add failure to decision log
- Dispatch fix subagent with full context
- Don't try to fix manually (context pollution)

---

## Integration

**Required patterns:**
- **TASK_DOCUMENTS** - Coordinator assembles doc paths, subagent reads originals
- **Decision Log** - Maintained throughout session
- **Coordinator Compliance Gate** - Cross-reference spec vs implementation before completion

**Reference scripts:**
- `bash .codeadd/scripts/status.sh` - Get feature context
- `bash .codeadd/scripts/architecture-discover.sh` - Codebase structure overview

**Skills to compose:**
- Backend: `.codeadd/skills/backend-development/SKILL.md`
- Database: `.codeadd/skills/database-development/SKILL.md`
- Frontend: `.codeadd/skills/frontend-development/SKILL.md` + `.codeadd/skills/ux-design/SKILL.md`
- Review: `.codeadd/skills/code-review/SKILL.md`

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
