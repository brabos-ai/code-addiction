<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/commands/add-done.md -->
---
description: Branch completion and merge - finalize feature/hotfix branches with changelog and documentation
---

# Branch Completion & Merge

> **MODEL:** Use `haiku` model

Coordinator for branch finalization. Supports features (full changelog flow), feature hotfixes, and standalone hotfixes. Analyzes context, generates documentation, and auto-merges to main.

---

## Spec

```json
{"gates":["branch_valid","dir_resolved","quality_gate_passed_or_force","changelog_written_if_feature","epic_complete_or_force","requirements_covered_or_force"],"order":["script_context","detect_branch_type","resolve_dir","branch_flow","preview","execute_merge"],"outputs":{"changelog":"docs/[0-9][0-9][0-9][0-9][A-Z]-*/changelog.md","about_addendum":"docs/[0-9][0-9][0-9][0-9][A-Z]-*/about.md"}}
```

---

## OWNER Context

**From `OWNER:name|level|language` (status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

---

## Yolo Mode

If argument contains `--yolo`:
- Skip ALL [STOP] points
- Accept --force automatically for incomplete epics/requirements
- Do NOT ask for confirmation at any gate
- Execute to completion without human interaction
- Log all auto-decisions in console output

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: done.sh                 → RUN FIRST (collect context)
STEP 2: Detect BRANCH_TYPE      → Route to correct flow
STEP 3: Resolve directory       → From CHANGED_FILES paths
STEP 4: Branch-specific flow    → Feature: full | Hotfix: simplified
STEP 5: Preview                 → INFORMATIVE ONLY (NO confirmation)
STEP 6: Execute merge           → AUTOMATIC after preview
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF STATUS=ERROR from script:
  ⛔ DO NOT USE: Write to create any docs
  ⛔ DO NOT USE: Bash for git operations
  ⛔ DO: Show error and stop

IF BRANCH_TYPE = unknown:
  ⛔ DO NOT USE: Write to create any docs
  ⛔ DO NOT USE: Bash for git operations
  ⛔ DO: Show error and stop

IF BRANCH_TYPE = feature AND REVIEW_MD NOT FOUND AND NOT --force:
  ⛔ DO NOT USE: Write to create changelog.md
  ⛔ DO NOT USE: Bash for done.sh --merge
  ⛔ DO: Inform user to run /add-review first

IF BRANCH_TYPE = feature AND REVIEW_MD OVERALL = BLOCKED AND NOT --force:
  ⛔ DO NOT USE: Write to create changelog.md
  ⛔ DO NOT USE: Bash for done.sh --merge
  ⛔ DO: Show blocked gates and request /add-review re-run

IF BRANCH_TYPE = feature AND EPIC INCOMPLETE:
  ⛔ DO NOT USE: Write to create changelog.md
  ⛔ DO NOT USE: Bash for done.sh --merge
  ⛔ DO: Show warning and wait for user decision

IF BRANCH_TYPE = feature AND REQUIREMENTS UNCOVERED:
  ⛔ DO NOT USE: Write to create changelog.md
  ⛔ DO NOT USE: Bash for done.sh --merge
  ⛔ DO: Show warning and wait for user decision

IF BRANCH_TYPE = feature AND CHANGELOG NOT WRITTEN:
  ⛔ DO NOT USE: Bash for done.sh --merge
  ⛔ DO: Write changelog FIRST

ALWAYS:
  ⛔ DO NOT USE: Bash for git add/commit/push (done.sh --merge handles everything)
  ⛔ DO NOT: Ask user for merge confirmation (merge is automatic after validations)
  ⛔ DO NOT USE: Bash for git branch -m (NEVER rename branches)
  ⛔ DO NOT: Suggest renaming branches to fix unknown type errors — the branch prefix is intentional
```

---

## STEP 1: Collect Context (RUN FIRST)

```bash
bash .codeadd/scripts/done.sh
```

**Parse output fields:**

| Field | Mandatory Action |
|-------|-----------------|
| `BRANCH_TYPE` | Route to correct flow (STEP 2) |
| `FEATURE_NUMBER` | Use for directory resolution |
| `HAS_UNCOMMITTED` | Inform in preview |
| `CHANGED_FILES` | Resolve directory + analyze files |
| `CHANGED_COUNT` | Inform in preview |

**IF STATUS=ERROR:** Show error and stop.

---

## STEP 2: Detect Branch Type and Route

**Parse `BRANCH_TYPE` from script output:**

| BRANCH_TYPE | Flow | Description |
|-------------|------|-------------|
| `feature` | Full (STEP 4A) | New: [prefix]/[NNNN][L]- where L ∈ {F,R,C,D}. Legacy: F[XXXX] |
| `hotfix` | Simplified (STEP 4B) | New: hotfix/[NNNN]H-*. Legacy: fix/H[XXXX]-* |
| `refactor` | Full (STEP 4A) | New: refactor/[NNNN]R-* |
| `chore` | Full (STEP 4A) | New: chore/[NNNN]C-* |
| `docs` | Full (STEP 4A) | New: docs/[NNNN]D-* |
| no ID found | ⛔ STOP | Branch has no [NNNN][L] or legacy F[XXXX]/H[XXXX] — show error, NEVER rename |

---

## STEP 3: Resolve Directory from CHANGED_FILES

**DO NOT USE Glob first.** Extract directory from CHANGED_FILES paths:

- **feature / hotfix / refactor / chore / docs:** Find path matching `docs/[NNNN][L]-*/` in CHANGED_FILES. Extract the directory part.
  - Example: CHANGED_FILES contains `docs/0007F-calendar-view/iterations.md` → DIR = `docs/0007F-calendar-view`
  - Legacy example: CHANGED_FILES contains `docs/features/F0007-calendar-view/iterations.md` → DIR = `docs/features/F0007-calendar-view`

**Fallback ONLY if no docs path found in CHANGED_FILES:** Use Glob `docs/[0-9][0-9][0-9][0-9][A-Z]-*/`

**⛔ IF directory not resolved:** Show error. DO NOT proceed to merge.

---

## STEP 4A: Feature Flow (BRANCH_TYPE = feature)

### 4A.0: Quality Gate Verification (PRD0034 — BEFORE all other checks)

**GATE CHECK: review.md must exist and PASSED before merge.**

```
1. CHECK if docs/${FEATURE_ID}/review.md exists (new flat structure: docs/[NNNN][L]-*/review.md)
2. IF NOT EXISTS:
   → "⛔ Review not executed. Run /add-review before /add-done."
   → BLOCKED
   → IF --force: proceed to 4A.1, register in changelog:
     "⚠️ Quality Gate bypassed via --force (review.md not found)"
3. IF EXISTS: READ review.md, find "| **Overall**" row
4. IF Overall = ✅ PASSED:
   → Proceed to 4A.1
5. IF Overall = ❌ BLOCKED:
   → Show table of BLOCKED gates from review.md
   → "⛔ Review found problems. Fix and re-run /add-review."
   → BLOCKED
   → IF --force: proceed to 4A.1, register in changelog:
     "⚠️ Quality Gate bypassed via --force. Gates BLOCKED: [list]"
```

**⛔ IF BLOCKED AND NOT --force:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show blocked gates and instructions

**NOTE:** Done does NOT re-run validations. It only reads the existing review.md report.

---

### 4A.1: Validate Epic.md (PRD0032 — new epic structure)

**Check for epic.md FIRST:**

```
IF docs/${FEATURE_ID}/epic.md exists (new flat: docs/[NNNN]F-*/epic.md):
  READ epic.md
  COUNT total subfeatures (rows in table)
  COUNT done subfeatures (rows with "done")
```

**IF epic.md AND not all subfeatures done:**

```
⚠️ Incomplete Epic! (epic.md structure)

Subfeatures: ${DONE_SF}/${TOTAL_SF} complete

Pending:
- ${SF_ID}: [name] (status: pending)
...

Options:
1. Continue: /add-dev (implements next subfeature)
2. Force merge anyway: /add-done --force
```

**⛔ IF INCOMPLETE:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for merge operations
- ⛔ DO: Show warning and wait for user decision

**IF --force with incomplete subfeatures:**
- Register warning in changelog: `⚠️ Epic merged with incomplete subfeatures (${DONE_SF}/${TOTAL_SF})`
- Proceed to 4A.1

**IF epic.md AND all subfeatures done:** Proceed to 4A.1 normally.

### 4A.2: Validate Epic (Legacy — IF plan.md is Epic)

**Check if Feature is Legacy Epic:**

```
Grep for "^## Features" in ${DIR}/plan.md
```

**IF NO Features section (simple feature):** Skip to 4A.2.

**Count Features:**

```
TOTAL_FEATURES = count of "^### Feature [0-9]+:" in plan.md
COMPLETED_FEATURES = count of entries with "slug":"feature-N-complete" in iterations.jsonl
  (fallback: count distinct "slug":"feature-N" entries with "type":"add")
```

**IF all complete (COMPLETED >= TOTAL):** Proceed to 4A.2.

**IF incomplete:**

```
⚠️ Incomplete Epic!

Features in plan.md: ${TOTAL_FEATURES}
Completed: ${COMPLETED_FEATURES}

Missing:
- Feature ${NEXT}: [feature name]
...

Options:
1. Continue development: /add-dev feature ${NEXT}
2. Force merge anyway: /add-done --force
```

**⛔ IF INCOMPLETE:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for merge operations
- ⛔ DO: Show warning and wait for user decision

**IF --force with incomplete features:**
- Register warning in changelog: `⚠️ Epic merged with incomplete features (${COMPLETED}/${TOTAL})`
- Proceed to 4A.2

### 4A.3: Validate Requirements Coverage

**IF plan.md has `## Cobertura de Requisitos` section:**

```
UNCOVERED = count of "^\| .* \| ❌" in plan.md
```

**IF coverage < 100% (UNCOVERED > 0):**

```
⚠️ Uncovered Requirements!

Requirements without coverage:
- [List of RF/RN with ❌]

Options:
1. Implement missing: /dev
2. Exclude from scope: edit plan.md
3. Force merge anyway: /add-done --force
```

**⛔ IF UNCOVERED:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for merge operations
- ⛔ DO: Show warning and wait for user decision

**IF --force with incomplete coverage:**
- Register warning in changelog: `⚠️ Merged with ${UNCOVERED} uncovered requirements`

### 4A.4: Load Feature Context (BEFORE analyzing files)

**Read about.md:**
```
Read ${DIR}/about.md
```

**Extract:** Objective, Scope (Included/Excluded), Business Rules, Technical Decisions, Acceptance Criteria

**Read iterations.jsonl:**
```
Read ${DIR}/iterations.jsonl
```

**Parse JSONL format:** Each line is `{"ts":"...","agent":"...","type":"...","slug":"...","what":"...","files":["..."]}`

**Build:**
- `HISTORY_FILES` = union of all `files` arrays across JSONL entries
- `ITERATION_MAP` = {entry1: {slug, type, what, files}, entry2: ...} (ordered by `ts`)

### 4A.5: Intelligent File Analysis

**Classify by Priority + Validate Context:**

For each file in `CHANGED_FILES`:

| Check | Action |
|-------|--------|
| In `HISTORY_FILES`? | ✅ Expected → which I{n}? |
| NOT in `HISTORY_FILES`? | ⚠️ Potential out-of-scope |

**Priorities:**
```json
{"high":["services","usecases","handlers","controllers","repositories","hooks","stores","validators","pages","components"],"medium":["types","interfaces","utils","helpers","config","tests"],"low":["models","entities","dtos","migrations","constants","enums","styles"]}
```

**Read HIGH Priority files:**

For each 🔴 HIGH file:
- **Description:** ~10 words
- **Iteration:** I{n} or "out-of-scope"
- **Implementations:** main methods/functions

**Detect Out-of-Scope:**

```
File HIGH/MEDIUM + NOT in HISTORY_FILES + NOT in SCOPE_ORIGINAL
  → Register reason: dependency | improvement | discovery
  → Include in "Out of Scope" changelog section
```

### 4A.6: Generate Changelog

**Path:** `${DIR}/changelog.md`

### Template
```markdown
# Changelog: ${FEATURE_NUMBER}
> **Date:** ${TODAY} | **Branch:** ${BRANCH_NAME}

## Summary
[2-3 sentence synthesis]

---

## By Iteration

### I1 - ${SLUG} (${TYPE})
**Files:**
| File | Description |
|------|-------------|

**Implementations:**
- `File::method()`: [1 line]

### I2 - ...

---

## Core Files

### 🔴 Core
| File | I{n} | Description |

### 🟡 Support
[simple list]

### 📊 Statistics
- Total: X | High: Y | Medium: Z | Low: W

---

## Out of Original Scope
| Item | File | Reason |

---

## Acceptance Criteria Validation
- ✅ AC01: [status]
- ✅ AC02: [status]

## Epic/Features (if applicable)
| Feature | Status | Iterations |
|---------|--------|------------|
| Feature 1: [name] | ✅ Complete | I1, I2 |
| Feature 2: [name] | ⚠️ Partial (--force) | - |

## Requirements Coverage
| Total | Covered | Status |
|-------|---------|--------|
| X RFs + Y RNs | Z | ✅ 100% |

## Quick Ref
{"id":"${FEATURE_NUMBER}","domain":"[1-3 palavras do domínio]","touched":["src/path/"],"patterns":["pattern1"],"keywords":["keyword1","keyword2"]}

_Generated by /add-done_
```

**APÓS escrever o changelog narrativo, gerar Quick Ref:**

```
1. Ler about.md → extrair domain (1-3 palavras) + keywords (3-7 palavras)
2. Ler iterations.jsonl → extrair touched directories (unique parent dirs de todos os files)
3. Ler discovery.md seção "Padrões Identificados" → extrair patterns
4. Substituir placeholders no bloco "## Quick Ref" com dados reais
```

**Regras do Quick Ref:**
- `id`: Feature ID (ex: `F0012`)
- `domain`: 1-3 palavras do domínio de negócio (inferido do about.md)
- `touched`: Diretórios únicos tocados — agrupar files por diretório pai (ex: `["src/metrics/","src/events/"]`)
- `patterns`: Padrões arquiteturais (ex: `["event-driven","decorator"]`)
- `keywords`: 3-7 keywords do domínio (ex: `["tracking","analytics"]`)

**SE discovery.md não tiver "Padrões Identificados":** inferir patterns do changelog narrativo.

### 4A.7: Update about.md (IF out-of-scope detected)

IF out-of-scope detected, append to about.md:

```markdown
---

## Addendum: Additional Deliveries

| Delivery | Description | Justification |
|----------|-------------|---------------|

**Impact:** [1 line]
```

### 4A.8: Consolidate decisions.jsonl (PRD0031 — MANDATORY)

**Consolidate feature decisions into project-level central file:**

```
FEATURE_DECISIONS = docs/features/${FEATURE_NUMBER}-*/decisions.jsonl
CENTRAL_DECISIONS = .codeadd/project/decisions.jsonl

IF FEATURE_DECISIONS exists:
  1. READ FEATURE_DECISIONS (all JSONL lines)
  2. READ CENTRAL_DECISIONS (if exists)
  3. MERGE: append feature entries to central
  4. DEDUPLICAR: remove entries where ts+agent+decision already in central
  5. WRITE .codeadd/project/decisions.jsonl (updated)
```

**Bash implementation:**
```bash
FEAT_DECISIONS="docs/features/${FEATURE_NUMBER}-$(ls docs/features | grep "^${FEATURE_NUMBER}")/decisions.jsonl"
CENTRAL=".codeadd/project/decisions.jsonl"

if [ -f "$FEAT_DECISIONS" ]; then
  if [ -f "$CENTRAL" ]; then
    # Append feature entries not already in central (deduplicate by ts)
    while IFS= read -r line; do
      ts=$(echo "$line" | grep -o '"ts":"[^"]*"' | head -1)
      if ! grep -q "$ts" "$CENTRAL" 2>/dev/null; then
        echo "$line" >> "$CENTRAL"
      fi
    done < "$FEAT_DECISIONS"
  else
    cp "$FEAT_DECISIONS" "$CENTRAL"
  fi
  echo "DECISIONS_CONSOLIDATED: $(wc -l < "$FEAT_DECISIONS") entries → $CENTRAL"
fi
```

---

## STEP 4B: Feature Hotfix Flow (BRANCH_TYPE = hotfix_feature)

### 4B.1: Load Hotfix Documentation

**Find hotfix doc in feature directory:**
```
Look for hotfix-*.md in ${DIR} (from CHANGED_FILES)
```

**Read the hotfix doc.** Extract: Problem, Root Cause, Files Modified, Verification status.

### 4B.2: Skip Changelog

**DO NOT generate changelog.** The hotfix document IS the record of what was done.

---

## STEP 4C: Standalone Hotfix Flow (BRANCH_TYPE = hotfix_standalone)

### 4C.1: Load Hotfix Documentation

**Find hotfix doc:**
```
Look for hotfix-*.md in docs/hotfixes/ (from CHANGED_FILES)
```

**Read the hotfix doc.** Extract: Problem, Root Cause, Files Modified, Verification status.

### 4C.2: Skip Changelog

**DO NOT generate changelog.** The hotfix document IS the record of what was done.

---

## STEP 5: Preview (INFORMATIVE ONLY)

### IF feature:
```
📋 Feature: ${FEATURE_NUMBER}

Summary: [2-3 sentences from changelog]
Iterations: ${count} (I1...I{n})
High Priority: [top 5 with I{n}]
Out of Scope: [Yes/No + list]

✅ Status: READY — Executing automatic merge...
```

### IF hotfix_feature:
```
📋 Hotfix (Feature): ${FEATURE_NUMBER}

Problem: [from hotfix doc]
Fix: [from hotfix doc]
Files: [count from CHANGED_FILES]
Related Feature: [feature directory name]

✅ Status: READY — Executing automatic merge...
```

### IF hotfix_standalone:
```
📋 Hotfix (Standalone): ${FEATURE_NUMBER}

Problem: [from hotfix doc]
Fix: [from hotfix doc]
Files: [count from CHANGED_FILES]

✅ Status: READY — Executing automatic merge...
```

**⛔ DO NOT ask for confirmation. Proceed directly to STEP 6.**

---

## STEP 6: Execute Merge (AUTOMATIC)

**Execute immediately after STEP 5.**

### 6.1: Detect Merge Strategy

**Check if repo requires Pull Request:**

```bash
# Check if branch protection exists on default branch (requires gh CLI)
command -v gh >/dev/null 2>&1 && gh api repos/{owner}/{repo}/branches/main/protection --silent 2>/dev/null && echo "PR_REQUIRED" || echo "DIRECT_MERGE"
```

**Routing:**

| Result | Action |
|--------|--------|
| `PR_REQUIRED` (branch protection active) | Route to PR flow (6.2A) |
| `DIRECT_MERGE` (no protection or gh not installed) | Route to direct merge (6.2B) |

### 6.2A: PR Flow (branch protection detected)

**Inform and execute PR creation:**

```
🔀 Branch protection detected — creating Pull Request instead of direct merge.
```

1. Read `.codeadd/commands/add-pr.md` as reference for PR creation flow
2. Follow add-pr STEPs 7-9 (Preview, Write files, Execute --create-pr)
3. Use `bash .codeadd/scripts/feature-pr.sh --create-pr` for PR creation

**After PR created, inform:**
```
✅ PR Created! Merge via GitHub when approved.
After merge, run: /add-done (will detect merged PR and cleanup)
```

### 6.2B: Direct Merge (default)

```bash
bash .codeadd/scripts/done.sh --merge
```

**⛔ DO NOT USE: Bash for git add/commit/push manually. done.sh --merge handles everything (commit, push, merge, checkpoint cleanup, branch cleanup).**

**NOTE:** done.sh --merge automatically deletes all `checkpoint/*` tags for the feature (local + remote). These temporary tags were created by `/add-dev` during implementation and are no longer needed after merge.

**After merge, suggest next command (from ecosystem map):**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
- Feature complete → `/add-release` (when ready for release)
- More features to implement → `/add-feature`

---

## Rules

ALWAYS:
- Run done.sh context mode FIRST
- Resolve directory from CHANGED_FILES (not Glob)
- Read about.md + iterations.jsonl BEFORE analyzing (feature only)
- Validate files against HISTORY_FILES (feature only)
- Write changelog BEFORE --merge (feature only)
- Execute --merge automatically after validations pass
- Load hotfix doc for hotfix types

NEVER:
- Analyze without loaded context
- Generate changelog for hotfix types
- Use Glob before checking CHANGED_FILES
- Execute --merge without changelog written (feature only)
- Use Bash for git add/commit/push manually
- Ask user for merge confirmation
- Rename branches (git branch -m) to fix type errors
- Suggest renaming a branch — the prefix is intentional

---

## Error Handling

| Error | Action |
|-------|--------|
| No F/H ID in branch | Show error: branch must contain F[XXXX] or H[XXXX]. NEVER suggest renaming |
| about.md not found | Degrade: changelog without scope context |
| iterations.md not found | Degrade: use only about.md |
| Hotfix doc not found | Warn: no hotfix documentation found, proceed with merge |
| Dir not in CHANGED_FILES | Fallback: Glob `docs/features/${FEATURE_NUMBER}-*/` |
| >50 files | Analyze top 20 HIGH + count rest |
| Merge conflict | Abort, suggest /hotfix |
