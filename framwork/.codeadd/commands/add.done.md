# Branch Completion & Merge

<!-- uses:
- skill: add-doc-schemas
- skill: add-doc-schemas/references/delivery-index.md
- skill: add-ecosystem
- skill: add-final-report
- skill: add-id-convention
- skill: add-wiki-maintenance
- command: /add.build
- command: /add.hotfix
- command: /add.plan-to-ready
- command: /add.review
- command: /add.wiki
- script: converge-gates.sh
- script: delivered.sh
- script: done.sh
- script: qa-evidence.sh
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Coordinator for branch finalization. Generates the changelog from changeset analysis and auto-merges to main. Same flow for all branch types (feature, hotfix, refactor, chore, docs) — review gate applies to features only.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: done.sh                 -> RUN FIRST (collect context)
STEP 2: Detect BRANCH_TYPE      -> Validate, capture FEATURE_ID, then route on the probe (2.1, 2.2)
STEP 3: Resolve directory       -> From CHANGED_FILES paths
STEP 4: Validate delivery       -> Review + epic + requirements + build-ledger gates (feature only)
STEP 5: Promote QA evidence     -> Exact review baseline -> immutable final snapshots (feature only)
STEP 6: Generate documentation -> Changelog + decisions + wiki + delivery index entry
STEP 7: Preview                 -> INFORMATIVE ONLY (NO confirmation)
STEP 8: Execute merge           -> AUTOMATIC after preview
STEP 9: Completion              -> report the close-out in the shared shape
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

IF BRANCH_TYPE = feature AND QA promotion is unresolved or failed:
  ⛔ DO NOT USE: Write to create changelog.md
  ⛔ DO NOT USE: Bash for done.sh --merge
  ✅ DO: Report the qa-evidence.sh validation/promotion failure and stop

ALWAYS:
  ⛔ DO NOT USE: Bash for git add/commit/push (done.sh --merge handles everything)
  ⛔ DO NOT USE: Bash for git branch -m (NEVER rename branches)
  ⛔ DO NOT: Ask user for merge confirmation (merge is automatic after validations)
  ⛔ DO NOT: Suggest renaming branches to fix unknown type errors -- the branch prefix is intentional
```

---

## Required Skills

- `{{skill:add-doc-schemas/SKILL.md}}` — schemas, IDs, validation gate
- `{{skill:add-id-convention/SKILL.md}}` — branch/ID format

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

All recognized types proceed to STEP 4. Quality gates apply to `feature` only — other types skip STEP 5 and continue to STEP 6.


### 2.1 Cross the Two Facts, Then Route

`done.sh`'s `ROUTE` block already emitted both. **Read them; compute neither.**
Two readers of one tree that derive the same fact separately are two readers that
can disagree, which is the whole reason `converge-gates.sh` exists.

```
IF ROUTING THIS RUN:
  ⛔ DO NOT USE: Bash for gh pr view — PR_STATE, PR_URL and PR_MERGE_COMMIT are already parsed
  ⛔ DO NOT USE: Read on docs/delivered.jsonl to decide whether an entry exists — INDEX_ENTRY says
  ✅ DO: Route on the probe's values
```

**`MERGED`** is `PR_STATE=merged` when a PR exists, and `MERGED_ON_MAIN=yes`
otherwise. `MERGED_ON_MAIN=unknown` is NOT a merge: it means `origin/<main>`
could not be read, and a route that deletes branches never runs on a guess.

| MERGED | INDEX_ENTRY | Route | What runs |
|---|---|---|---|
| no | `absent` or `no-index` | **Normal** | Everything, as written below |
| no | **`present`** | **Resume** | Every gate runs. STEP 5's promotion, 6.3, 6.7 and 6.8 are SKIPPED. The merge is the only work left |
| yes | `present` | **Closed out** | Report it and STOP. There is nothing to do |
| yes | **`absent`** | **Recovery** | Runs on `main`. Writes the entry and the changelog. Never merges |

**The Resume row is what a refused merge leaves behind, and it is not rare.** A
review thread left unresolved, an approval dismissed by a push, a required check
that went red on the docs commit. Falling through to Normal writes a **second**
entry for one delivery — the exact defect this cross exists to stop.

**The Closed out row is what makes a second run on the same branch safe.** Every
gate below would still pass, and without the row the command would write that
second entry itself.

### 2.2 Which Merge Route, and Why the Record Exists

Truth on the forge outranks the record. The record's only job is telling
*declined* apart from *never asked* — two states that both look like "no PR".

| `PR_STATE` | `PUBLISH_RECORD` | Route |
|---|---|---|
| `open` | anything | **PR route.** A PR that exists IS the route, whatever the ledger says |
| `none` | `declined` | **Local route.** The operator chose it |
| `none` | `on-main` or `no-gh` | **Local route.** No PR was ever possible |
| `none` | `none` | **ASK.** Nobody was asked, so ask now |
| `none` | `pr-opened` or `pr-updated` | **ASK**, and report it — the PR was closed or deleted after the build recorded it |
| `closed` | anything | **ASK**, and report that the PR was closed unmerged |
| `no-gh` | anything | **Local route**, and say in the report that `gh` was unavailable |

```
IF PR_STATE IS no-gh:
  ⛔ DO NOT: Take the PR route in any combination
  ⛔ DO NOT: Report the absence of gh as a failure — it is a probe value
  ✅ DO: Take the local route and name the reason in the final report
```

### 2.3 The Resume Route — written, pushed, merge refused

Reached from 2.1's second row. **Every gate below still applies in full** — a
delivery is not exempt from grading because someone tried to merge it once. What
changes is that four STEPs already ran and must not run again:

| STEP | Normal | Resume |
|---|---|---|
| 4 | The gates | **Unchanged.** They all still run |
| 5 | Validate and promote QA evidence | **Skipped.** The promotion already ran |
| 6.3 | Generate the changelog | **Skipped.** Committed by STEP 6's commit |
| 6.7 | Update the wiki | **Skipped.** Same commit |
| 6.8 | Write the index entry | **Skipped.** The entry is on the branch |
| 8 | Merge | The only work left |

⛔ **STEP 5 is skipped rather than re-run, and that is not caution.** Promotion is
idempotent, so a second run is safe — and therefore indistinguishable from a
first. A reported skip is evidence that the step already happened; a silent safe
re-run is not.

**What is left to find out is why the merge was refused.** The branch state is
correct and nothing here repairs it. Report the reason from
`gh pr view --json mergeStateStatus,mergeable` in STEP 9, alongside which STEPs
this run skipped.

### 2.4 The Recovery Route — merged, never indexed

Reached from 2.1's bottom row. Work reached `main` and left no record. Stopping
there would make the index quietly wrong about a delivery that shipped — the same
lie as indexing work that never landed, in the other direction.

This route runs **on `main`**, so `done.sh` cannot be used at all: its context
mode needs a `[NNNN][L]` in the branch name and its merge mode refuses to run on
`main`.

1. **Resolve the feature from the merge commit's own diff**, matching
   `docs/features/[NNNN][L]-*/`. This is the resolution STEP 3 already applies to
   `CHANGED_FILES`, pointed at a commit instead of a branch.
2. **Take the delivery facts from the merge commit**, not from a branch diff:

```bash
git show --name-status <merge-commit>
```

   The squash IS the delivery.
3. Write the entry and the changelog, commit them on `main`, and push.

```
IF THE DIFF NAMES MORE THAN ONE docs/features/[NNNN][L]-*/ DIRECTORY:
  ⛔ DO NOT: Pick one and continue
  ⛔ DO NOT: Write an entry for the first match
  ✅ DO: Print every candidate and ask which delivery this is, then STOP
```

   An epic merge touches several subfeature directories at once. Every other
   resolver in this repository stops on ambiguity rather than guessing, and this
   one decides which feature a delivery is filed under.

```
IF THE MERGE COMMIT CANNOT BE RESOLVED:
  ⛔ DO NOT USE: Bash for delivered.sh write
  ⛔ DO NOT: Reconstruct the diff from plan.md instead of from git
  ✅ DO: Report it and STOP — an entry derived from a plan records intent, not delivery
```

⛔ **Recovery NEVER merges.** It runs `done.sh --merge` on nothing and calls
`gh pr merge` on nothing: the merge already happened, which is the condition that
put this run here.

**Report in STEP 9 that the run took the recovery route, and why the entry landed
after the merge rather than before it.** An entry whose commit sits after the
delivery it describes is fine; one that hides how it got there is not.

---

## STEP 3: Resolve Directory from CHANGED_FILES

**DO NOT USE Glob first.** Extract directory from CHANGED_FILES paths:

- **feature / hotfix / refactor / chore / docs:** Find path matching `docs/features/[NNNN][L]-*/` in CHANGED_FILES. Extract the directory part.
  - Example: `docs/features/0007F-calendar-view/iterations.md` -> DIR = `docs/features/0007F-calendar-view`

**Fallback ONLY if no docs path found in CHANGED_FILES:** Use Glob `docs/features/[0-9][0-9][0-9][0-9][A-Z]-*/`.

**IF directory not resolved:** Show error. DO NOT proceed to merge.

---

## STEP 4: Validate Delivery

**Preflight (FEATURE BRANCHES ONLY) — run once, before 4.0–4.2:**

```bash
bash .codeadd/scripts/converge-gates.sh "${DIR}"
```

**SKIP this call entirely if `BRANCH_TYPE` ≠ `feature`.** Parse `GATE_REVIEW`, `GATE_QA_BASELINE`, `GATE_EPIC`, `GATE_COVERAGE`, `GATE_LEDGER`, `REVIEW_PATH`, `BASELINE`, `EPIC_PENDING`, `COVERAGE_UNCOVERED`, `GATE_REVIEW_DETAIL`, `GATE_QA_BASELINE_DETAIL`, `GATE_EPIC_DETAIL`, `GATE_COVERAGE_DETAIL`, and `GATE_LEDGER_DETAIL` from its output. **These fields are the sole source of truth for whether 4.0, 4.1, 4.2 and 4.3 pass.** The script computes FIVE gates; every one of them is read below. DO NOT re-derive a verdict by reading `review-NNN.md`, `epic.md`, `plan.md` or `build-ledger.md` and counting/parsing them yourself — that restates the gate the script exists to own.

### 4.0: Quality Gate Verification (FEATURE BRANCHES ONLY)

**SKIP this substep entirely if `BRANCH_TYPE` ≠ `feature`.** Hotfix/refactor/chore/docs branches do not require `/add.review`.

**GATE CHECK (feature only): `GATE_REVIEW` must be `ok` AND `GATE_QA_BASELINE` must be `ok`.** Both are read here; neither substitutes for the other.

1. `REVIEW_PATH` from the preflight names the **highest-numbered** `docs/features/${FEATURE_ID}/review-NNN.md`. That one is the delivery receipt; earlier rounds are history and are never read here.
2. IF `GATE_REVIEW=missing`: "Review not executed. Run /add.review before /add.done." -> BLOCKED
3. IF `GATE_REVIEW=broken` or `not-probed`: Show `GATE_REVIEW_DETAIL` (the table of BLOCKED gates it names) -> BLOCKED
4. IF `GATE_REVIEW=ok`: Take `BASELINE` from the preflight output verbatim and store it as `QA_BASELINE` for STEP 5.
5. IF `GATE_QA_BASELINE` is `missing`, `broken`, or `not-probed`: Show `GATE_QA_BASELINE_DETAIL` -> BLOCKED. `missing` means the review carries no `> **QA baseline:**` line to read; `broken` means `qa-evidence.sh validate` rejected the one it does carry. Both send the user back to `/add.review` — never author, repair, or guess a baseline here.
6. IF `GATE_QA_BASELINE=ok`: Proceed.

⛔ **Reading `GATE_QA_BASELINE` is MANDATORY.** The preflight emits it and it is the gate whose silent loss let a feature whose evidence no longer matched its review reach the merge. Ignoring a computed gate is worse than never computing it.

**This is the EARLY, read-only check, NOT a replacement for STEP 5.** The preflight's own `qa-evidence.sh validate` runs read-only and proves nothing about promotion; STEP 5 STILL runs `qa-evidence.sh validate` again immediately before `promote`, and that second run remains the one that gates finalization.

`QA_BASELINE` **ABSENT, `GATE_REVIEW` not `ok`, or `GATE_QA_BASELINE` not `ok`** → **BLOCKED**. Re-run `/add.review`; never infer a baseline or compare dates. STEP 5 performs the exact filesystem equality and promotion checks through `qa-evidence.sh`.

**IF BLOCKED:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show blocked gates and instructions to re-run /add.review

**NOTE:** Done does NOT re-run product validations. It reads `converge-gates.sh`'s verdict on the passed review and lets the deterministic lifecycle script prove its QA baseline still matches the working evidence.

---

### 4.1: Validate Epic.md (FEATURE BRANCHES ONLY)

**SKIP if `BRANCH_TYPE` ≠ `feature`.**

**GATE CHECK (feature only): `GATE_EPIC` must be `ok`.** `ok` covers both "every subfeature done" and "no `epic.md` at all" — a feature with no epic is not an incomplete one.

**IF `GATE_EPIC` is `missing`, `broken`, or `not-probed`:**

```
Incomplete Epic!
${GATE_EPIC_DETAIL}

Pending: ${EPIC_PENDING}

Run /add.build to implement the next subfeature.
```

`GATE_EPIC_DETAIL` is already a full sentence (`Subfeature(s) not done: SF02`) — print it as one, never under a second label. `EPIC_PENDING` is the bare comma-separated id list.

**IF INCOMPLETE:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show pending subfeatures and STOP

**IF `GATE_EPIC=ok`:** Proceed normally.

---

### 4.2: Validate Requirements Coverage (FEATURE BRANCHES ONLY)

**SKIP if `BRANCH_TYPE` ≠ `feature`.**

**GATE CHECK (feature only): `GATE_COVERAGE` must be `ok`.**

**IF `GATE_COVERAGE` is `missing`, `broken`, or `not-probed`:**

```
Uncovered Requirements!

${COVERAGE_UNCOVERED} requirement(s) without coverage.
Which ones: see the coverage table in ${DIR}/plan.md — every row whose
Covered? cell is not YES / EXCLUDED / N/A.

Options:
1. Implement missing: /add.build
2. Exclude from scope: edit plan.md
```

`COVERAGE_UNCOVERED` is a COUNT, not a list of RF/RN ids. Never print it where ids are expected; `plan.md`'s coverage table is the only place the ids exist. **IF `GATE_COVERAGE=missing`** the count is meaningless — show `GATE_COVERAGE_DETAIL` instead (there is no `plan.md` to point the user at) and still BLOCK.

**IF UNCOVERED:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show uncovered requirements and STOP

**IF `GATE_COVERAGE=ok`:** Proceed normally.

---

### 4.3: Validate the Build Ledger (FEATURE BRANCHES ONLY)

**SKIP if `BRANCH_TYPE` ≠ `feature`.**

**GATE CHECK (feature only): `GATE_LEDGER` must be `ok`.**

This is the only gate that asks whether the build **happened**. 4.0 asks whether
the delivery was graded, 4.2 reads a table written at plan time, and 4.1 returns
`ok` unconditionally on a feature with no `epic.md`. **Unwritten code breaks no
test**, so a `/add.build` run that stopped halfway passes every check above and
merges as fully delivered.

**IF `GATE_LEDGER` is `missing`, `broken`, or `not-probed`:**

```
Build Not Finished!

${GATE_LEDGER_DETAIL}

Run /add.build to finish the remaining task(s).
```

`GATE_LEDGER_DETAIL` already names the task ids with no `complete` line, capped
at ten plus a `+N more` overflow — print it as it comes. `missing` means the
scope declares Execution tasks and carries no `build-ledger.md` at all, and its
detail names the path it looked for.

**IF BLOCKED:**
- ⛔ DO NOT USE: Write to create changelog.md
- ⛔ DO NOT USE: Bash for done.sh --merge
- ✅ DO: Show the unfinished tasks and STOP

```
IF GATE_LEDGER IS NOT ok:
  ⛔ DO NOT USE: Read on build-ledger.md to count the `complete` lines yourself
  ⛔ DO NOT USE: Read on tasks.md to decide which tasks were owed
  ✅ DO: Print GATE_LEDGER_DETAIL and STOP — re-deriving the verdict restates
         the gate `converge-gates.sh` exists to own, and the two answers can
         disagree
```

**A feature with no `tasks.md` in scope reports `ok`**, with its reason in the
detail. That is not a hole: outside TASKS MODE the ledger's lines are keyed by
area name rather than task id, so there is nothing to cross-reference. It is the
same rule 4.2 applies to an absent coverage table.

**IF `GATE_LEDGER=ok`:** Proceed normally.

---

## STEP 5: Validate and Promote Reviewed QA Evidence

**SKIP this STEP entirely if `BRANCH_TYPE` is not `feature`.** Set `QA_PROMOTION_STATUS=skipped` and continue to STEP 6.

For a feature branch, `QA_BASELINE` from STEP 4 is the only promotion manifest. Run in this exact order:

1. Execute `bash .codeadd/scripts/qa-evidence.sh validate "${DIR}" "${QA_BASELINE}"`.
2. Require exact per-scope equality between the review baseline and the current highest working runs. A newer run, missing scope, malformed ID, incomplete source, report-number mismatch, or schema-invalid report blocks finalization.
3. Execute `bash .codeadd/scripts/qa-evidence.sh promote "${DIR}" "${QA_BASELINE}"` only after validation succeeds.
4. Parse every `ACTION`, `SCOPE`, `FINAL`, and `FINAL_REPORT` line for STEP 6 and STEP 7.
5. Set `QA_PROMOTION_STATUS=passed`. `BASELINE=none` with no working runs is a valid no-op.

Promotion copies each complete working run to `_tests/final/run-NNN/` through a temporary sibling and rename. Existing byte-identical snapshots are no-ops; different content at the same final run ID is an immutable conflict. Findings and severity are preserved verbatim — `final` means reviewed delivery evidence, not clean QA.

**IF either script call fails:**
- ⛔ DO NOT USE: Write to create `changelog.md`
- ⛔ DO NOT USE: Bash for `done.sh --merge`
- ✅ DO: Surface the exact script error. For baseline drift, require `/add.review`; for incomplete/conflicting evidence, require correction before retrying `/add.done`

Do NOT stage, commit, push, move, or delete evidence here. `done.sh --merge` remains the sole git owner and promotion remains retry-safe.

---

## STEP 6: Generate Changelog and Documentation

### 6.1: Load Feature Context (BEFORE analyzing files)

**Read `${DIR}/about.md`.** Extract: Objective, Scope (Included/Excluded), Business Rules, Technical Decisions, Acceptance Criteria.

**Read `${DIR}/iterations.jsonl`.** Parse JSONL format: Each line is `{"ts":"...","agent":"...","type":"...","slug":"...","what":"...","files":["..."]}`.

**Build:**
- `HISTORY_FILES` = union of all `files` arrays across JSONL entries
- `ITERATION_MAP` = {entry1: {slug, type, what, files}, entry2: ...} (ordered by `ts`)

---

### 6.2: Intelligent File Analysis

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

### 6.3: Generate Changelog (schema: changelog)

**Path:** `${DIR}/changelog.md`

**Idempotency guard (RUN FIRST).** If `${DIR}/changelog.md` already exists, **SKIP** schema execution, ID allocation, and Quick Ref generation, but DO NOT skip the QA trail below. Existing changelogs must receive the same permanent evidence references before STEP 6.4.

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

**QA trail (IF STEP 5 emitted any `FINAL_REPORT`, for new AND existing changelogs):** upsert one `## QA Evidence` section citing every promoted per-scope final snapshot — scope, `run-NNN`, permanent `_tests/final/run-NNN/` path, report date, and severity counts. Replace that section on rerun rather than appending a duplicate. Extractive only: consume the metadata emitted by `qa-evidence.sh promote` and preserve open findings as audit history.

---

### 6.4: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `changelog`.

⛔ DO NOT skip. DO NOT proceed until gate returns `PASS`.

---

### 6.5: Update about.md (IF out-of-scope detected)

IF out-of-scope detected, append to about.md:

```markdown
---

## Addendum: Additional Deliveries

| Delivery | Description | Justification |
|----------|-------------|---------------|

**Impact:** [1 line]
```

---

### 6.6: Consolidate decisions.jsonl

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

### 6.7 Update Project Wiki (best-effort, non-blocking)

**IF `.codeadd/wiki/index.md` exists:**

Load skill `{{skill:add-wiki-maintenance/SKILL.md}}` and execute its update discipline. Evidence = `CHANGED_FILES` from `done.sh` (STEP 1) + the feature context already loaded in this session (about.md from 6.1, the changelog just generated in 6.3).

Wiki edits stay in the working tree — do NOT commit them here. `done.sh --merge` (STEP 8) commits wiki edits together with the changelog. Report pages touched (or explicit no-op "wiki already current") in the final summary after merge.

**ELSE:** Skip silently — no wiki step runs. Add ONE line to the final summary after merge: "Project wiki not found — run /add.wiki to generate the knowledge base."

**NEVER block the close flow on wiki failures.** If the update fails or is inconclusive, note it in the final summary and continue to STEP 7.

⛔ DO NOT USE: Bash for git operations in this substep — wiki edits are plain file edits; `done.sh --merge` owns the commit.

---

### 6.8 Write the Delivery Index Entry

Record what this branch delivered in `docs/delivered.jsonl`, the per-project delivery index. `delivered.sh` is its only writer; nothing here edits the file directly. The entry is authored HERE and **left in the working tree** — the same path the changelog and the wiki edits already take. `done.sh --merge` (STEP 8) commits it with everything else.

Load `{{skill:add-doc-schemas/references/delivery-index.md}}` for the record shape, the `{what, at, find}` anchor and the hard bans. Do not restate them here; the reference is the contract.

```
IF BRANCH_TYPE = docs:
  ⛔ DO NOT USE: Bash for delivered.sh write
  ✅ DO: Skip 6.8 entirely, set INDEX_ENTRY=none, continue to STEP 7

IF THE ENTRY HAS NOT BEEN WRITTEN OR EXPLICITLY SKIPPED:
  ⛔ DO NOT: Proceed to STEP 7
  ✅ DO: Complete 6.8, or record why it wrote nothing
```

**6.8.1 — Resolve which entry this branch belongs to.**

| BRANCH_TYPE | Entry |
|---|---|
| `feature` | A new entry under this branch's `FEATURE_ID` |
| `hotfix` / `refactor` / `chore` | Resolved by the match below — never by asking |
| `docs` | None. No source surface changed |

For hotfix, refactor and chore, run the report-only verify FIRST, then match:

```bash
bash .codeadd/scripts/delivered.sh verify
```

Verify first because an item that has already moved carries a stale `at`; a branch touching its *current* location would intersect nothing and silently get no line. Then, for every existing entry, match an item when **the branch's diff touches a hunk containing that item's `find` string** — not merely when it touches the same file — **or** when the branch renames the item's `at` file by path. Both clauses exist, for opposite failure modes: hunk-matching alone misses a pure rename (`R100`, zero hunks), and path-matching alone attributes every change in a shared routes or schema file to every entry with an item in it.

Every entry with at least one matched item gets a new line carrying this branch's commit. **No match anywhere** means the branch created new surface rather than changing existing surface, so it gets its own entry under its own `[NNNN][L]` id.

**6.8.2 — Select the items. This is a shape filter, not a judgement.** Two runs over one diff must produce one list. Derive from the HIGH-priority files already described in 6.2, plus `tasks.md` when it exists — its absence is routine on hotfix, refactor and chore branches, and items then come from the diff plus `about.md` and the commit messages.

| Include | Exclude |
|---|---|
| A route or endpoint path | A file that only gained an import or an export line |
| A table, collection or migration name | A config key, env var or dependency bump |
| A screen, route or exported component | An internal helper, type or private function |
| A CLI command, flag or feature name | A test file |
| A public function others call across a module boundary | Anything whose name does not appear outside its own file |

The last exclusion is the general rule the others are instances of: **if nothing outside the defining file names it, no document will cite it**, and it does not belong in an index built to stop miscitation.

**More than five survive the filter:** keep the five whose `find` strings are most specific and record how many were dropped, for STEP 7 to show. Never truncate silently — the overflow is exactly the signal that the feature was too big.

**6.8.3 — Take each `find` from the item's own identifier**, never from a description: `oauth_tokens`, `/auth/google`, `LoginGoogle`. One contiguous token, byte-exact. `POST /auth/google` is a `what`, not a `find`.

**6.8.4 — Write it.** Compose the record and pass it on stdin. The script generates `v` and `ts`; supply everything else. `commits` comes from a read-only `git log --format=%h` over the branch's own commits.

```bash
bash .codeadd/scripts/delivered.sh write < "$RECORD_FILE"
```

Parse `ENTRY`, `CREATED`, `LINES` and every `LOOSE` line for STEP 7. Set `INDEX_ENTRY` to the composed record so STEP 7 can render it in full.

```
IF delivered.sh EXITS 2 WITH REFUSED=find-absent OR REFUSED=find-over-matched:
  ⛔ DO NOT: Retry with the same find string
  ⛔ DO NOT: Drop the item to make the write pass
  ✅ DO: Pick a more specific identifier for that item and write again

IF delivered.sh EXITS 2 WITH ANY OTHER REFUSED= VALUE:
  ⛔ DO NOT USE: Bash for done.sh --merge
  ✅ DO: Show the REFUSED value and the record, and stop — the record breaks a hard ban

IF delivered.sh EXITS 1:
  ⛔ DO NOT USE: Bash for done.sh --merge
  ✅ DO: Show the write error and stop — the filesystem refused the entry
```

⛔ DO NOT USE: Bash for git add/commit/push in this substep. `done.sh --merge` remains the sole git owner, exactly as it is for the changelog and the wiki.

<!-- feature:docs-pruning:prune -->
<!-- /feature:docs-pruning:prune -->

---

## STEP 7: Preview (INFORMATIVE ONLY)

Show a preview with: branch type, ID, summary, file count, top HIGH priority files, out-of-scope indicator (if any), and each permanent final snapshot emitted by STEP 5 with its scope, path, and severity counts (`run-NNN · Blocker N / Major N / Minor N / Polish N`) read from its `## Summary`. Extractive only: the QA judgement is an audit, so unresolved findings are DISPLAYED, never gated on and never re-judged here.

**Render the delivery index entry from 6.8 (`INDEX_ENTRY`) IN FULL** — its `name`, its `words`, and **every** item with its `what`, its `at` and its `find` string. Not a count, not a summary: the user is seeing this list for the only time before it is committed, and a `find` they can read is a `find` they can notice is wrong. Add, when 6.8 emitted them: every `LOOSE` string, labelled as loosely anchored, and how many items the five-item cap dropped.

`INDEX_ENTRY=none` (a `docs` branch) prints one line saying no entry was owed. A refused write never reaches here — 6.8 stops.

```
IF RENDERING THE ENTRY:
  ⛔ DO NOT: Ask the user to approve, confirm or edit the item list
  ⛔ DO NOT: Re-select items or rewrite a find string here
  ✅ DO: Print it and continue — a wrong entry is corrected by appending a new line, which is what the format is for
```

**DO NOT ask for confirmation. Proceed directly to STEP 8.**

---

## STEP 8: Execute Merge (AUTOMATIC)

**Execute immediately after STEP 7, on the route 2.2 chose.**

### 8.1 The PR Route

Taken when `PR_STATE=open`. The forge owns the merge, so its rules — required
reviews, required checks, protected branches — are the ones that apply.

```bash
bash .codeadd/scripts/done.sh --commit-push
```

STEP 6's documents land on the branch and CI is re-triggered on the new commit.
**That commit has not been tested yet**, which is the whole reason the next two
items exist.

```bash
gh pr checks --watch --fail-fast
```

Then, **before reading the verdict**, compare the SHA:

```bash
gh pr view --json headRefOid --jq .headRefOid    # must equal:
git rev-parse HEAD
```

⛔ **REFUSE a verdict from any other SHA.** A green check is evidence only for
the commit it ran on. Without this the command reads yesterday's green run and
calls today's untested code gated — the same class of lie as a gate that invokes
a script that does not exist, and harder to see, because the output says pass.

⛔ **Only `success` is a pass.** A `skipped`, `queued`, `neutral` or `cancelled`
required check is the absence of evidence, and this gate treats absence exactly
as it treats failure.

**No required check configured at all → merge, and say so in the report.** A
project with no workflows is not a project with a failing gate, and inventing a
block there would make the PR route unusable.

```bash
gh pr merge --squash
```

Where the repository has auto-merge enabled, `gh pr merge --squash --auto` is the
same guarantee without holding the session open.

```bash
bash .codeadd/scripts/done.sh --cleanup "$(gh pr view --json mergeCommit --jq .mergeCommit.oid)"
```

The sha is passed because a squash creates a NEW commit: the branch tip is not
an ancestor of `main`, so nothing can derive it locally.

```
IF THE MERGE IS REFUSED:
  ⛔ DO NOT USE: Bash for done.sh --cleanup
  ⛔ DO NOT: Retry the merge with a different flag to get past the refusal
  ✅ DO: Report the refusal reason from `gh pr view --json mergeStateStatus,mergeable` and STOP
```

The entry and the changelog then stay on the branch, absent from `main`, which is
the honest state — and 2.1 routes the next run to **Resume**, which skips the
three STEPs that already ran rather than writing their output twice.

### 8.2 The Local Route

Taken when 2.2 chose it: `PR_STATE` is `none` with a `declined`, `on-main` or
`no-gh` record, or `gh` is unavailable.

```bash
bash .codeadd/scripts/done.sh --merge
```

`done.sh --merge` handles everything: commit, push, merge to main, checkpoint cleanup, branch cleanup. It also deletes all `checkpoint/*` tags for the feature (local + remote) — `/add.plan-to-ready` creates each one on the checkpoint commit at a subfeature boundary. `/add.build` never creates a checkpoint tag. It does commit — one per `tasks.md` task, or one per area dispatch outside TASKS MODE — so the branch reaching this step normally carries a history, not a single dirty tree; `done.sh --merge` commits whatever is still pending on top of it. Tag ownership is what `/add.build` lacks, not commits.

⛔ DO NOT USE Bash for git add/commit/push manually. **`done.sh` owns every
LOCAL git write on both routes** — the PR route calls its `--commit-push` and
`--cleanup` modes rather than doing that work itself. `gh pr merge` is not a
local git write: it asks the forge to merge, and touches no ref here. That is
why it is the one call this command makes directly.

**After merge, carry this into STEP 9 — do NOT print it here:**
- Wiki result from 6.7 — pages touched, explicit no-op, or the "wiki not found" suggestion.
- **Which evidence the gate accepted, and why** — the PR's checks on a named SHA, or the local route with the reason no PR was available.

**Resolve the next command here, state it at STEP 9:**
READ skill `add-ecosystem` Main Flows section. Based on current context (branch type, epic status), identify the appropriate next step. ⛔ DO NOT print it at this step — the report comes first and STEP 9 owns it.

<!-- plugin:gitnexus:graph-reindex -->
<!-- /plugin:gitnexus:graph-reindex -->

---

## STEP 9: Completion

**LOAD `{{skill:add-final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the paths and the next command come after it.

The merge already happened, so this is a past-tense report. Fill `What was delivered` with the
feature that is now on the main branch, and `How it works` with what that feature does for the user,
for a reader who never opened `about.md`. `Files touched` names what the merge carried, and the
Deleted row is written even when it reads "none".

Then, after the seven blocks, state:

- The wiki result from 6.7 — pages touched, an explicit no-op, or the "wiki not found" suggestion.
- The delivery index entry that `delivered.sh` wrote, and the changelog path.
- **Which evidence the merge gate accepted, and why.** On the PR route: the
  checks that concluded and the SHA they ran on, or that the repository had no
  required check configured. On the local route: that no PR existed, and which
  `PUBLISH_RECORD` value said so. A gate that quietly changes which evidence it
  accepts is worse than a slow one.
- **Which route 2.1 and 2.2 chose**, and on a Resume run, the STEPs it skipped
  and the refusal reason `gh pr view --json mergeStateStatus,mergeable` reports.
- The next command, from the `add-ecosystem` Main Flows section, chosen for the current branch type
  and epic status.

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
