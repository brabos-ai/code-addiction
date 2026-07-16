# Branch Completion & Merge

> **MODEL:** Use `haiku` model
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Coordinator for branch finalization. Generates the changelog from changeset analysis and auto-merges to main. Same flow for all branch types (feature, hotfix, refactor, chore, docs) — review gate applies to features only.

---

## Required Skills

- `{{skill:add-doc-schemas/SKILL.md}}` — schemas, IDs, validation gate
- `{{skill:add-id-convention/SKILL.md}}` — branch/ID format

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: done.sh                 -> RUN FIRST (collect context)
STEP 2: Detect BRANCH_TYPE      -> Validate, capture FEATURE_ID
STEP 3: Resolve directory       -> From CHANGED_FILES paths
STEP 4: Validate + changelog    -> Quality gates (feature only) + changelog generation
STEP 5: Preview                 -> INFORMATIVE ONLY (NO confirmation)
STEP 6: Execute merge           -> AUTOMATIC after preview
```

**ABSOLUTE PROHIBITIONS (invariants — per-step gates live in their steps):**

```
IF STATUS=ERROR from script:
  ⛔ DO NOT USE: Write to create any docs
  ⛔ DO NOT USE: Bash for git operations
  ✅ DO: Show error and stop

IF BRANCH_TYPE = unknown:
  ⛔ DO NOT USE: Write to create any docs
  ⛔ DO NOT USE: Bash for git operations
  ✅ DO: Show error and stop

ALWAYS:
  ⛔ DO NOT USE: Bash for git add/commit/push (done.sh --merge handles everything)
  ⛔ DO NOT USE: Bash for git branch -m (NEVER rename branches)
  ⛔ DO NOT: Ask user for merge confirmation (merge is automatic after validations)
  ⛔ DO NOT: Suggest renaming branches to fix unknown type errors -- the branch prefix is intentional
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

| BRANCH_TYPE | Description |
|-------------|-------------|
| `feature` | Branch: feature/[NNNN]F-* |
| `hotfix` | Branch: hotfix/[NNNN]H-* |
| `refactor` | Branch: refactor/[NNNN]R-* |
| `chore` | Branch: chore/[NNNN]C-* |
| `docs` | Branch: docs/[NNNN]D-* |
| no ID found | STOP — branch has no `[NNNN][L]` ID, show error, NEVER rename |

All recognized types proceed to STEP 4. Quality gates (4.0-4.2) apply to `feature` only — other types skip directly to changelog generation.

---

## STEP 3: Resolve Directory from CHANGED_FILES

**DO NOT USE Glob first.** Extract directory from CHANGED_FILES paths:

- **feature / hotfix / refactor / chore / docs:** Find path matching `docs/features/[NNNN][L]-*/` in CHANGED_FILES. Extract the directory part.
  - Example: `docs/features/0007F-calendar-view/iterations.md` -> DIR = `docs/features/0007F-calendar-view`

**Fallback ONLY if no docs path found in CHANGED_FILES:** Use Glob `docs/features/[0-9][0-9][0-9][0-9][A-Z]-*/`.

**IF directory not resolved:** Show error. DO NOT proceed to merge.

---

## STEP 4: Validate & Generate Changelog

### 4.0: Quality Gate Verification (FEATURE BRANCHES ONLY)

**SKIP this substep entirely if `BRANCH_TYPE` ≠ `feature`.** Hotfix/refactor/chore/docs branches do not require `/add.review`.

**GATE CHECK (feature only): review.md must exist and PASSED before merge.**

1. CHECK if `docs/features/${FEATURE_ID}/review.md` exists
2. IF NOT EXISTS: "Review not executed. Run /add.review before /add.done." -> BLOCKED
3. IF EXISTS: READ review.md, find "| **Overall**" row
4. IF Overall = PASSED: Proceed to 4.1
5. IF Overall = BLOCKED: Show table of BLOCKED gates -> BLOCKED

**IF BLOCKED:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show blocked gates and instructions to re-run /add.review

**NOTE:** Done does NOT re-run validations. It only reads the existing review.md report.

---

### 4.1: Validate Epic.md (FEATURE BRANCHES ONLY)

**SKIP if `BRANCH_TYPE` ≠ `feature`.**

IF `docs/features/${FEATURE_ID}/epic.md` exists:
- READ epic.md, COUNT total subfeatures (rows in table), COUNT done subfeatures (rows with "done")

**IF epic.md AND not all subfeatures done:**

```
Incomplete Epic!
Subfeatures: ${DONE_SF}/${TOTAL_SF} complete

Pending:
- ${SF_ID}: [name] (status: pending)

Run /add.build to implement the next subfeature.
```

**IF INCOMPLETE:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show pending subfeatures and STOP

**IF epic.md AND all subfeatures done:** Proceed normally.

---

### 4.2: Validate Requirements Coverage (FEATURE BRANCHES ONLY)

**SKIP if `BRANCH_TYPE` ≠ `feature`.**

**IF plan.md has `## Cobertura de Requisitos` section:**

Count rows matching `| .* | X |` (uncovered) in plan.md.

**IF coverage < 100% (UNCOVERED > 0):**

```
Uncovered Requirements!

Requirements without coverage:
- [List of RF/RN with X]

Options:
1. Implement missing: /add.build
2. Exclude from scope: edit plan.md
```

**IF UNCOVERED:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show uncovered requirements and STOP

---

### 4.3: Load Feature Context (BEFORE analyzing files)

**Read `${DIR}/about.md`.** Extract: Objective, Scope (Included/Excluded), Business Rules, Technical Decisions, Acceptance Criteria.

**Read `${DIR}/iterations.jsonl`.** Parse JSONL format: Each line is `{"ts":"...","agent":"...","type":"...","slug":"...","what":"...","files":["..."]}`.

**Build:**
- `HISTORY_FILES` = union of all `files` arrays across JSONL entries
- `ITERATION_MAP` = {entry1: {slug, type, what, files}, entry2: ...} (ordered by `ts`)

---

### 4.4: Intelligent File Analysis

**Classify each file in CHANGED_FILES:**

| Check | Action |
|-------|--------|
| In `HISTORY_FILES`? | Expected -- identify which iteration |
| NOT in `HISTORY_FILES`? | Potential out-of-scope |

**Priority classification:**
- **HIGH** — services, usecases, handlers, controllers, repositories, hooks, stores, validators, pages, components
- **MEDIUM** — types, interfaces, utils, helpers, config, tests
- **LOW** — models, entities, dtos, migrations, constants, enums, styles

**For each HIGH priority file:** describe (~10 words), map to iteration (I{n} or "out-of-scope"), list main methods/functions.

**Detect out-of-scope:** HIGH/MEDIUM files NOT in HISTORY_FILES and NOT in original scope -> register reason (dependency | improvement | discovery) -> include in "Out of Scope" changelog section.

---

### 4.5: Generate Changelog (schema: changelog)

**Path:** `${DIR}/changelog.md`

**Idempotency guard (RUN FIRST).** If `${DIR}/changelog.md` already exists, **SKIP** schema execution, ID allocation, and Quick Ref generation. Proceed directly to STEP 4.6 (validation still runs against the existing file).

```bash
[ -f "${DIR}/changelog.md" ] && echo "CHANGELOG_EXISTS — skipping generation"
```

**If changelog does NOT exist:**

EXECUTE schema `changelog` from `{{skill:add-doc-schemas/SKILL.md}}`.

**Allocate changelog ID:**

```bash
bash .codeadd/scripts/status.sh next-id CHG
```

Output: `CHG[NNNN]`. Use in frontmatter. `related:` MUST reference the closed `[NNNN]F` or `[NNNN]H`. Extractive only.

**AFTER writing the changelog, generate Quick Ref** (metadata, appended as extractive JSON block, not inline doc structure):

1. Read about.md → extract domain (1-3 words) + keywords (3-7 words)
2. Read iterations.jsonl → extract touched directories (unique parent dirs)
3. Read discovery.md section "Identified Patterns" → extract patterns
4. Replace placeholders in the "## Quick Ref" block with real data

**Quick Ref rules:**
- `id`: Feature ID (e.g., `F0012`)
- `domain`: 1-3 words inferred from about.md
- `touched`: Unique parent dirs (e.g., `["src/metrics/","src/events/"]`)
- `patterns`: Architectural patterns (e.g., `["event-driven","decorator"]`)
- `keywords`: 3-7 domain keywords

**IF discovery.md has no "Identified Patterns" section:** infer patterns from the narrative changelog.

---

### 4.6: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `changelog`.

⛔ DO NOT skip. DO NOT proceed until gate returns `PASS`.

---

### 4.7: Update about.md (IF out-of-scope detected)

IF out-of-scope detected, append to about.md:

```markdown
---

## Addendum: Additional Deliveries

| Delivery | Description | Justification |
|----------|-------------|---------------|

**Impact:** [1 line]
```

---

### 4.8: Consolidate decisions.jsonl

Append feature-level `decisions.jsonl` entries into the project-central `.codeadd/project/decisions.jsonl`, deduplicating by `ts`.

```bash
FEAT_DECISIONS="${DIR}/decisions.jsonl"
CENTRAL=".codeadd/project/decisions.jsonl"

if [ -f "$FEAT_DECISIONS" ]; then
  mkdir -p "$(dirname "$CENTRAL")"
  if [ -f "$CENTRAL" ]; then
    while IFS= read -r line; do
      ts=$(echo "$line" | grep -o '"ts":"[^"]*"' | head -1)
      grep -q "$ts" "$CENTRAL" 2>/dev/null || echo "$line" >> "$CENTRAL"
    done < "$FEAT_DECISIONS"
  else
    cp "$FEAT_DECISIONS" "$CENTRAL"
  fi
  echo "DECISIONS_CONSOLIDATED: $(wc -l < "$FEAT_DECISIONS") entries -> $CENTRAL"
fi
```

---

### 4.9 Update Project Wiki (best-effort, non-blocking)

**IF `.codeadd/wiki/index.md` exists:**

Load skill `{{skill:add-wiki-maintenance/SKILL.md}}` and execute its update discipline. Evidence = `CHANGED_FILES` from `done.sh` (STEP 1) + the feature context already loaded in this session (about.md from 4.3, the changelog just generated in 4.5).

Wiki edits stay in the working tree — do NOT commit them here. `done.sh --merge` (STEP 6) commits wiki edits together with the changelog. Report pages touched (or explicit no-op "wiki already current") in the final summary after merge.

**ELSE:** Skip silently — no wiki step runs. Add ONE line to the final summary after merge: "Project wiki not found — run /add.wiki to generate the knowledge base."

**NEVER block the close flow on wiki failures.** If the update fails or is inconclusive, note it in the final summary and continue to STEP 5.

⛔ DO NOT USE: Bash for git operations in this substep — wiki edits are plain file edits; `done.sh --merge` owns the commit.

---

## STEP 5: Preview (INFORMATIVE ONLY)

Show a preview with: branch type, ID, summary, file count, top HIGH priority files, out-of-scope indicator (if any).

**DO NOT ask for confirmation. Proceed directly to STEP 6.**

---

## STEP 6: Execute Merge (AUTOMATIC)

**Execute immediately after STEP 5.**

```bash
bash .codeadd/scripts/done.sh --merge
```

`done.sh --merge` handles everything: commit, push, merge to main, checkpoint cleanup, branch cleanup. It also deletes all `checkpoint/*` tags for the feature (local + remote) created by `/add.build` during implementation.

⛔ DO NOT USE Bash for git add/commit/push manually — the script owns the full sequence.

**After merge, include in the final summary:**
- Wiki result from 4.9 — pages touched, explicit no-op, or the "wiki not found" suggestion.

**After merge, MUST suggest next command from ecosystem map:**
READ skill `add-ecosystem` Main Flows section. Based on current context (branch type, epic status), identify and suggest the appropriate next step.

<!-- plugin:gitnexus:graph-reindex -->
<!-- /plugin:gitnexus:graph-reindex -->

---

## Rules

NEVER:
- Rename branches (git branch -m) to fix type errors — the prefix is intentional
- Use Glob before checking CHANGED_FILES paths

---

## Error Handling

| Error | Action |
|-------|--------|
| No `[NNNN][L]` ID in branch | Show error: branch must contain a valid feature/hotfix ID. NEVER suggest renaming |
| about.md not found | Degrade: changelog without scope context |
| iterations.jsonl not found | Degrade: use only about.md |
| Dir not in CHANGED_FILES | Fallback: Glob `docs/features/${FEATURE_NUMBER}-*/` |
| >50 files | Analyze top 20 HIGH + count rest |
| Merge conflict | Abort, suggest /add.hotfix |
