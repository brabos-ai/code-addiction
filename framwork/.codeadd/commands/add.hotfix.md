# Hotfix - Rapid Bug Fix Workflow

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).
> **ARCHITECTURE REFERENCE:** Use `CLAUDE.md` as source of patterns.
> **ID FORMAT:** Global sequential with type suffix (e.g., `0001H`, `0002H`)
> **STRUCTURE:** Docs in `docs/features/[NNNN]H-[slug]/` with `related.md` for relationships

---

## Spec

```json
{"schemas":["hotfix-about","hotfix-related"]}
```

---

## Required Skills

Load `{{skill:add-documentation-style/SKILL.md}}` (hub) before STEP 1. It delegates to `add-doc-schemas` (schemas: `hotfix-about`, `hotfix-related`), `add-doc-ref-convention`, and `add-token-efficiency`.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1:  Run status.sh             → FIRST COMMAND
STEP 2:  Check branch              → IF main: STOP (step 3 required)
STEP 3:  Allocate ID + branch      → status.sh next-id H, branch, skeleton about.md
STEP 4:  Identify related features → Analyze RECENT_CHANGELOGS
STEP 5:  Read documentation        → Changelogs, about.md of related features
STEP 6:  Investigate code          → ONLY AFTER steps 1-5
STEP 7:  Confirm root cause        → BEFORE implementing
STEP 8:  Implement fix             → ONLY AFTER step 7
STEP 9:  Write hotfix about.md     → schema hotfix-about, extractive
STEP 10: Write related.md          → schema hotfix-related
STEP 11: Validation gate — about   → run gate block
STEP 12: Validation gate — related → run gate block
STEP 13: Log iteration             → MANDATORY BEFORE informing user
STEP 14: Completion                → Inform user, awaiting /add.done
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF BRANCH = main:
  ⛔ DO NOT USE: Grep on .ts/.tsx/.js files
  ⛔ DO NOT USE: Read on code files
  ⛔ DO NOT: Code investigation
  ⛔ DO NOT: Implementation
  ✅ DO: STEP 3-4 (template + branch creation)

IF SCHEMA NOT LOADED:
  ⛔ DO NOT USE: Write to create hotfix docs
  ✅ DO: Load `hotfix-about` and `hotfix-related` sections from {{skill:add-doc-schemas/SKILL.md}} FIRST

IF BRANCH NOT CREATED:
  ⛔ DO NOT: Proceed to investigation
  ✅ DO: Create hotfix/[NNNN]H-[slug] branch and docs/features/[NNNN]H-[slug]/

IF CHANGELOGS NOT READ:
  ⛔ DO NOT USE: Grep on code
  ⛔ DO NOT USE: Read on code
  ✅ DO: Read changelogs of related features first

IF ROOT CAUSE NOT CONFIRMED:
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO NOT: Implementation
  ✅ DO: Present root cause to user and WAIT for confirmation
```

---

## STEP 1: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

**AFTER EXECUTION, CHECK OUTPUT:**
- `BRANCH`: Current branch (main/hotfix/feature/other)
- `RECENT_CHANGELOGS`: Last 5 completed items (identify related features)

---

## STEP 2: Branch Check (HARD STOP)

**Look at script output. What is the BRANCH value?**

### IF `BRANCH:main` or `BRANCH:master`:

⛔ **TOTAL STOP** - You are on main branch.

**MANDATORY ACTION:** Execute STEP 3 NOW.
**DO NOT:** Grep, Read code, investigation, nothing.

### IF `BRANCH:hotfix/*`:

✅ Branch OK. Skip to STEP 4.

---

## STEP 3: Allocate Hotfix ID + Create Branch

⛔ **GATE:** Branch must be created BEFORE investigation.

### 3.1 Allocate Next Hotfix ID

```bash
bash .codeadd/scripts/status.sh next-id H
```

Output: Next global hotfix ID in the form `H[NNNN]` (e.g., `H0001`). Store for frontmatter writes in STEP 9 and STEP 10.

### 3.2 Create Branch

```bash
git checkout -b hotfix/H[NNNN]-[hotfix-slug]
```

**[hotfix-slug]:** kebab-case descriptive (ex: `screenshot-delete-error`, `login-timeout`)

### 3.3 Create Doc Directory

```
docs/hotfixes/<slug>/
├── about.md    (schema: hotfix-about — written in STEP 9)
├── related.md  (schema: hotfix-related — written in STEP 10)
└── iterations.jsonl
```

DO NOT write doc contents yet — schemas are loaded and applied in STEP 9/10.

**⛔ CONFIRM:** Execute `git branch --show-current` and verify you're on `hotfix/*`

---

## STEP 4: Identify Related Features

### 4.1 Analyze RECENT_CHANGELOGS

From `status.sh` output:
- Which features mention the affected area/component?
- Is the bug likely related to recent changes?

### 4.2 Interview User (if applicable)

**If RECENT_CHANGELOGS suggests related features**, present them and ask:
- Yes → inform which
- No → standalone fix
- Multiple related → list them

**Store feature relationships for STEP 10.**

---

## STEP 5: Read Documentation (BEFORE code)

**MANDATORY ORDER - DO NOT SKIP.**

For each related feature identified in STEP 4, read its `changelog.md` and `about.md`.

**Understand:**
- Recent changes in affected area
- Architecture decisions that might relate to bug
- Dependencies and flow

---

## STEP 6: Investigation (ONLY AFTER STEPS 1-5)

**PREREQUISITES VERIFIED:**
- [ ] Branch `hotfix/*` active (NOT main)
- [ ] Changelogs of related features READ
- [ ] Documentation of related features READ

**NOW you can investigate code:**

Use Grep/Read to confirm what documentation indicated:
1. Entry point (controller, component)
2. Business logic (service, handler)
3. Data layer (repository, database)

### 6.1 Escalate to add-investigation skill (when root cause unclear)

⛔ **IF the bug symptom is vague, intermittent, crosses multiple layers, or the first 2-3 grep/read attempts do NOT converge on a clear cause:**

LOAD {{skill:add-investigation/SKILL.md}} and apply Phases 1-3 (Root Cause Investigation, Pattern Analysis, Differential Diagnosis) before proposing a root cause in STEP 7.

**Why:** Hotfixes that ship without rigorous RCA tend to fix symptoms instead of causes, causing the same bug to return. The Iron Law from add-investigation applies: NO FIX WITHOUT ROOT CAUSE.

**Skip this sub-step ONLY when:** the bug has a clear error message + stack trace + obvious cause within the first investigation pass.

---

## STEP 7: Confirm Root Cause (BEFORE implementing)

⛔ **GATE CHECK:** DO NOT implement without user confirmation.

**Present to user:**
- **Root Cause:** 1-2 sentences explaining the cause
- **Solution:** 1-2 sentences describing the fix
- **Files:** list of files to modify

**WAIT for explicit confirmation before proceeding.**

---

## STEP 8: Implement Fix

**PREREQUISITES:**
- [ ] Root cause confirmed by user
- [ ] On branch `hotfix/*`

### 8.1 Check Project Patterns

**If PROJECT_PATTERNS > 0 (from script output):** Read project patterns and follow them in implementation.

### 8.2 Implement

**DO:**
- Fix root cause (not symptom)
- Minimal and focused changes
- Follow existing patterns
- Test locally if possible

**FRONTEND FIXES:**
If bug in frontend:
1. READ skill `add-ux-design`
2. Follow patterns (mobile-first, shadcn, Tailwind v3)

**DO NOT:**
- Refactor unrelated code
- Add features
- Over-engineer

### 8.3 Verify Build

Verify build passes for affected apps (backend, frontend, or both).

---

## STEP 9: Write Hotfix about.md (schema: hotfix-about)

EXECUTE schema `hotfix-about` from `{{skill:add-doc-schemas/SKILL.md}}`.

**Path:** `docs/hotfixes/<slug>/about.md`

**ID:** `H[NNNN]` from STEP 3. Write per `hotfix-about` schema. Extractive only.

---

## STEP 10: Write related.md (schema: hotfix-related)

EXECUTE schema `hotfix-related` from `{{skill:add-doc-schemas/SKILL.md}}`.

**Path:** `docs/hotfixes/<slug>/related.md`

**ID:** `H[NNNN]-related`. Write per `hotfix-related` schema. Lists only, no prose. Use `{{doc:<ID>}}` for impacted docs. Include features identified in STEP 4.

**Cross-update:** For each related feature doc, if its `related.md` exists, append the hotfix `{{doc:H[NNNN]}}` reference; otherwise create a minimal related.md referencing this hotfix.

---

## STEP 11-12: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for each doc written:
1. `hotfix-about` — `docs/hotfixes/<slug>/about.md`
2. `hotfix-related` — `docs/hotfixes/<slug>/related.md`

⛔ DO NOT skip. DO NOT mark the command complete until both gates return `PASS`.

---

## STEP 13: Log Iteration (MANDATORY — PRD0031)

**BEFORE informing user, append entry to iterations.jsonl:**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/hotfixes/<slug>/iterations.jsonl" "fix" "/hotfix" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**Parameters:**
- `slug`: kebab-case identifier (ex: modal-confirm-btn, null-check-user)
- `what`: Brief description max 60 chars
- `files`: Array of affected file paths

---

## STEP 14: Ready for Review

⛔ **DO NOT commit** - leave for `/add.done`

Inform user of completion including: hotfix ID, branch, problem, root cause, solution, modified files, build status. Suggest next step: `/add.done`.

**Next Steps:** Reference skill `add-ecosystem` Main Flows section for context-aware next command suggestion.

---

## Rules

**ALWAYS:**
- Use `status.sh next-id H` to allocate hotfix ID
- Create hotfix branch and docs in `docs/hotfixes/<slug>/`
- Load `hotfix-about` and `hotfix-related` schemas from add-doc-schemas before writing
- Read changelogs and about.md before investigating code
- Confirm root cause with user before implementing
- Fix root cause, not symptoms
- Keep changes minimal and focused
- Run the validation gate for BOTH docs before completing
- Log iteration entry before informing user
- Verify build passes after implementing fix

**NEVER:**
- Investigate code while on main branch
- Inline any doc template — ALWAYS load from add-doc-schemas
- Use abstractive summarization to fit word caps
- Grep or read code before reading changelogs
- Implement fix without user confirming root cause
- Refactor unrelated code during hotfix
- Add new features inside a hotfix
- Commit changes (leave for /add.done)
- Skip either validation gate

---

## Example Flow

```
# User: "Screenshot validation bugada!"

# STEP 1-2: status.sh → BRANCH:main → STOP
# STEP 3: status.sh next-id H → H0001
#   git checkout -b hotfix/H0001-screenshot-delete-error
#   mkdir docs/hotfixes/screenshot-delete-error/
# STEP 4: Related to F0036 ai-screenshot-validation (from RECENT_CHANGELOGS)
# STEP 5: Read F0036 changelog + about
# STEP 6: Investigate code
# STEP 7: Confirm root cause with user
# STEP 8: Implement fix + verify build
# STEP 9: Write about.md via hotfix-about schema
# STEP 10: Write related.md via hotfix-related schema
# STEP 11: Validation gate — hotfix-about
# STEP 12: Validation gate — hotfix-related
# STEP 13: Log iteration
# STEP 14: Completion → suggest /add.done
```
