---
name: add-subagent-driven-development
description: Use when executing implementation plans via dispatched subagents with code review between tasks.
---

# Subagent-Driven Development

Execute a plan by dispatching named specialist agents per task, with code review after each.

**Core principle:** Named agent per task + review between tasks = high quality, fast iteration.

> **Provider-Agnostic:** This skill describes WHAT to dispatch (intent + prompt), not HOW. Use your platform's subagent mechanism (Task tool, sub-process, agent call, etc.).

---

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

## When NOT to Use

- **Plan needs review first** — use `executing-plans` (separate session) so the human can vet the plan before any code is written.
- **Tasks are tightly coupled** — manual execution avoids the conflict risk of resetting context between dependent steps.
- **Plan needs revision** — brainstorm/refine first; dispatching subagents over a shaky plan compounds rework.
- **Single trivial task** — dispatch overhead (TASK_DOCUMENTS, decision log, review) outweighs benefit; just do it inline.
- **Exploratory / spike work** — no spec to anchor TASK_DOCUMENTS; use a discovery agent instead.

---

## Named Agent Mapping

When dispatching, prefer named agents over generic subagents. Named agents have skills preloaded, model optimized, and tool restrictions enforced.

| Area | Named Agent | Type |
|------|-------------|------|
| Database | `@database-agent` | Implementation (read-write) |
| Backend | `@backend-agent` | Implementation (read-write) |
| Frontend | `@frontend-agent` | Implementation (read-write) |
| Review | `@reviewer-agent` | Validation (read-only) |
| Discovery | `@discovery-agent` | Exploration (read-only) |
| Architecture | `@architecture-agent` | Advisory (read-only) |

**Fallback:** If a named agent is not available, dispatch a generic subagent with the appropriate skill loaded in the prompt.

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
- docs/features/0005F-media-library/about.md
- docs/features/0005F-media-library/plan.md
```

**Example — epic with subfeatures:**
```
## TASK_DOCUMENTS (read ALL before starting — source of truth)
- docs/features/0005F-media-library/about.md
- docs/features/0005F-media-library/discovery.md
- docs/features/0005F-media-library/subfeatures/SF01-chunked-analysis/about.md
- docs/features/0005F-media-library/subfeatures/SF01-chunked-analysis/plan.md
```

The coordinator already knows if it's a simple feature or epic, which subfeature is current, and which docs exist. It assembles the correct list. The subagent has zero conditional logic — just reads what it receives.

---

## Subagent Prompt Template

All subagent prompts include these fields, in order:

- **ROLE** — `You are the [AREA] [agent type] for task [N].`
- **TASK_DOCUMENTS** — file paths the subagent must read first (source of truth).
- **DECISION LOG** — accumulated decisions from previous tasks.
- **SKILLS** — `MANDATORY:` (always for this area) + `ADDITIONAL:` (detected from context).
- **COORDINATOR NOTES** — decisions, warnings, patterns to follow/avoid.
- **TASK** — specific deliverables for this subagent.
- **REPORT FORMAT** — what to return to the coordinator.

---

## Decision Log (Canonical Format)

The coordinator maintains a single decision log throughout the session, appending after each task.

```markdown
### DECISION LOG
<!-- Coordinator maintains, updates after each task -->

#### Session Info
- Plan: [plan-file location]
- Started: [timestamp]
- Working Directory: [path]
- Tasks: [count]

#### Task N: [task name]
- Status: completed | in_progress | failed
- Depends On: [Task IDs, or -]
- Files Created: [list]
- Files Modified: [list]
- Decisions: [from subagent report]
- Review Score: [X/10]

#### Accumulated Decisions
- [Decision 1 from Task 1]
- [Decision 2 from Task 2]
```

This block is the only canonical decision-log shape — every dispatch (implementer, reviewer, fix) receives an excerpt of it under a `## DECISION LOG` heading.

---

## The Process

### 1. Load Plan + Initialize Decision Log

Read the plan file, create TodoWrite with all tasks, write the `Session Info` block of the Decision Log (see canonical format above).

### 2. Pre-Dispatch Preparation (Coordinator's Job)

Before dispatching ANY subagent:

1. **Assemble TASK_DOCUMENTS** — list all doc paths the subagent needs (epic-aware)
2. **Identify Reference Files** — find similar files in codebase via Glob/Grep
3. **Compose Skills** — determine mandatory + additional skills for this area
4. **Write Coordinator Notes** — specific guidance, warnings, patterns from previous tasks

### 3. Execute Task with Subagent

Dispatch `@${AREA}-agent` (see Named Agent Mapping) with a prompt that fills every field of the Subagent Prompt Template, plus this mandatory first step:

```
## MANDATORY: Load Context (FIRST STEP)
1. Run: bash .codeadd/scripts/status.sh
2. Read ALL files listed in TASK_DOCUMENTS above
3. Read your area's skill file (see SKILLS section)

## REPORT FORMAT
Return:
1. FILES_CREATED: [list]
2. FILES_MODIFIED: [list]
3. BUILD_STATUS: [pass/fail]
4. DECISIONS_MADE: [list]
5. ISSUES_ENCOUNTERED: [if any]
```

### 4. Update Decision Log

After the subagent returns, append a `#### Task N` block to the Decision Log using the canonical format.

### 5. Review Subagent's Work

Dispatch `@reviewer-agent` with the same prompt template. Review-specific deltas:

```diff
  ## TASK_DOCUMENTS  (same docs as the implementation subagent received)
+ ## FILES TO REVIEW  (FILES_CREATED + FILES_MODIFIED from Task N report)
  ## SKILLS
- - [implementation skill]
+ - {{skill:add-code-review/SKILL.md}}
  ## TASK
- [Specific deliverables from plan]
+ 1. Read all files from TASK_DOCUMENTS (spec)
+ 2. Read all changed files (implementation)
+ 3. Validate implementation against spec
+ 4. Check skill patterns
+ 5. AUTO-FIX issues found
+ 6. Report findings
  ## REPORT FORMAT
- 1. FILES_CREATED / FILES_MODIFIED / BUILD_STATUS / DECISIONS_MADE / ISSUES_ENCOUNTERED
+ 1. ISSUES_FOUND: [list with severity]
+ 2. ISSUES_FIXED: [list]
+ 3. BUILD_STATUS: [pass/fail]
+ 4. SCORE: [X/10]
```

### 6. Apply Review Feedback

- **Critical** issues → dispatch fix subagent immediately.
- **Important** issues → fix before next task.
- **Minor** issues → note in Decision Log, defer.

Fix-subagent prompts add an `## ISSUES TO FIX` section (from the review report) and a `COORDINATOR NOTES` line stating priority. Everything else mirrors the implementation prompt.

### 7. Mark Complete, Next Task

- Mark task as completed in TodoWrite
- Update Decision Log with final status
- Move to next task; repeat steps 3–6

### 8. Coordinator Compliance Gate

After ALL tasks complete and BEFORE reporting completion, the coordinator verifies the implementation matches the specification. This is not a review — it's a cross-reference check.

**Why this exists:** Subagents may complete their tasks and pass code review yet still miss requirements from the spec. The coordinator is the only actor with both the full spec and the full Decision Log.

**Steps:**

1. **Re-read TASK_DOCUMENTS** (about.md, plan.md) to extract RF/RN list
2. **Cross-reference** each RF/RN against FILES_CREATED/FILES_MODIFIED from the Decision Log
3. **Quick-read** relevant implementation files to confirm the requirement exists in code
4. **If any RF/RN has no corresponding implementation:** list missing items, dispatch fix subagent with the missing requirements + TASK_DOCUMENTS, re-run this gate after the fix
5. **If ALL RF/RN are covered:** proceed to Final Review

```
DO NOT report completion without executing this gate.
DO NOT skip quick-read — file existence alone does not confirm implementation.
```

### 9. Final Review

After the Compliance Gate passes, dispatch the final reviewer with the COMPLETE Decision Log + all TASK_DOCUMENTS + the plan's verification checklist. Task: review entire implementation against TASK_DOCUMENTS, verify all plan requirements met, check overall architecture, run final build verification.

---

## Example Workflow

```
Coordinator: load plan, init TodoWrite + Decision Log.

Task 1 — Hook installation script
  Dispatch implementer → FILES_CREATED: scripts/install-hook.sh, BUILD: pass
  Dispatch reviewer    → Score 9/10, no issues
  Update Decision Log, mark complete.

Task 2 — Recovery modes
  Dispatch implementer → FILES_CREATED: src/recovery.ts, BUILD: pass
  Dispatch reviewer    → Important: missing progress reporting
  Dispatch fix         → progress every 100 items
  Update Decision Log, mark complete.

Compliance Gate
  Re-read about.md + plan.md → 8 RF extracted
  Cross-reference Decision Log → all 8 covered
  Quick-read key files → confirmed. PASS.

Final Review
  Dispatch reviewer with full log + TASK_DOCUMENTS → ready to merge.
```

---

## Validation Checklist

Coordinator must confirm before reporting completion:

- [ ] TASK_DOCUMENTS assembled (epic-aware) for every dispatch
- [ ] No subagent received summaries — only file paths
- [ ] Decision Log updated after every task (implementer + reviewer + fix)
- [ ] Code review dispatched after every implementation task
- [ ] Critical review issues fixed before advancing
- [ ] Only one implementation subagent in flight at a time
- [ ] Compliance Gate executed: each RF/RN cross-referenced + quick-read
- [ ] Final Review dispatched with COMPLETE Decision Log
- [ ] Build status `pass` on final task
- [ ] TodoWrite reflects real state (no stale `in_progress`)

---

## Integration

**Required patterns:**
- **TASK_DOCUMENTS** — coordinator assembles doc paths, subagent reads originals
- **Decision Log** — maintained throughout session
- **Coordinator Compliance Gate** — cross-reference spec vs implementation before completion

**Reference scripts:**
- `bash .codeadd/scripts/status.sh` — get feature context
- `bash .codeadd/scripts/architecture-discover.sh` — codebase structure overview

**Skills to compose:**
- Backend: `{{skill:add-backend-development/SKILL.md}}`
- Database: `{{skill:add-database-development/SKILL.md}}`
- Frontend: `{{skill:add-frontend-development/SKILL.md}}` + `{{skill:add-ux-design/SKILL.md}}`
- Review: `{{skill:add-code-review/SKILL.md}}`

**Extended references:**
- Persistent decision logging (`decisions.jsonl`) and the Architect subagent pattern (`tasks.md`) live in `references/persistent-logging-and-tasks.md`. Load on demand when a feature uses persistent logs or tasks-mode execution.

---

## If a Subagent Fails

- Append failure to Decision Log (status: `failed`, error excerpt)
- Dispatch a fix subagent with full context — never patch manually (context pollution)
- Re-run review after the fix
