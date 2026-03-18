# Hotfix - Rapid Bug Fix Workflow

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).
> **ARCHITECTURE REFERENCE:** Use `CLAUDE.md` as source of patterns.
> **ID FORMAT:** Global sequential with type suffix (e.g., `0001H`, `0002H`)
> **STRUCTURE:** Flat docs in `docs/[NNNN]H-[slug]/` with `related.md` for relationships

---

## Spec

```json
{"template":".codeadd/templates/hotfix.md"}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Run status.sh              → FIRST COMMAND
STEP 2: Check branch               → IF main: STOP (steps 3-4 required)
STEP 3: Load template              → Read hotfix.md template
STEP 4: Create branch + docs       → Branch hotfix/[NNNN]H-[slug], create hotfix.md
STEP 5: Identify related features  → Analyze RECENT_CHANGELOGS
STEP 6: Read documentation         → Changelogs, about.md of related features
STEP 7: Investigate code           → ONLY AFTER steps 1-6
STEP 8: Confirm root cause         → BEFORE implementing
STEP 9: Implement fix              → ONLY AFTER step 8
STEP 10: Update hotfix doc         → Fill root cause + solution sections
STEP 11: Create related.md         → Document feature relationships
STEP 12: Log iteration             → MANDATORY BEFORE informing user
STEP 13: Completion                → Inform user, awaiting /add.done
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF BRANCH = main:
  ⛔ DO NOT USE: Grep on .ts/.tsx/.js files
  ⛔ DO NOT USE: Read on code files
  ⛔ DO NOT: Code investigation
  ⛔ DO NOT: Implementation
  ✅ DO: STEP 3-4 (template + branch creation)

IF TEMPLATE NOT READ:
  ⛔ DO NOT USE: Write to create hotfix doc
  ✅ DO: Read .codeadd/templates/hotfix.md FIRST

IF BRANCH NOT CREATED:
  ⛔ DO NOT: Proceed to investigation
  ✅ DO: Create hotfix/[NNNN]H-[slug] branch and docs/[NNNN]H-[slug]/

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

**MANDATORY ACTION:** Execute STEP 3 and STEP 4 NOW.
**DO NOT:** Grep, Read code, investigation, nothing.

### IF `BRANCH:hotfix/*`:

✅ Branch OK. Skip to STEP 5.

---

## STEP 3: Load Template (MANDATORY)

Read the hotfix template from the path in Spec.

**Placeholders to understand:**
- `{{HOTFIX_ID}}` - Global ID (e.g., `0001H`)
- `{{BRANCH_NAME}}` - Branch created in STEP 4
- `{{TITLE}}` - Hotfix title
- `{{DATETIME}}` - Current date/time (YYYY-MM-DD HH:MM)
- `{{PRIORITY}}` - High/Medium/Low

---

## STEP 4: Create Branch + Docs

⛔ **GATE:** Branch must be created BEFORE investigation.

### 4.1 Calculate Next Hotfix ID

```bash
bash .codeadd/scripts/next-id.sh H
```

Output: Next global ID with H suffix (e.g., `0001H`)

### 4.2 Create Branch

```bash
git checkout -b hotfix/[NNNN]H-[hotfix-slug]
```

**[hotfix-slug]:** kebab-case descriptive (ex: `screenshot-delete-error`, `login-timeout`)

### 4.3 Create Hotfix Documentation Structure

Create directory and hotfix.md using the template from STEP 3:

```
docs/[NNNN]H-[hotfix-slug]/
├── hotfix.md (main document)
├── iterations.jsonl (auto-created if needed)
└── related.md (created in STEP 11)
```

**⛔ CONFIRM:** Execute `git branch --show-current` and verify you're on `hotfix/*`

---

## STEP 5: Identify Related Features

### 5.1 Analyze RECENT_CHANGELOGS

From `status.sh` output:
- Which features mention the affected area/component?
- Is the bug likely related to recent changes?

### 5.2 Interview User (if applicable)

**If RECENT_CHANGELOGS suggests related features**, present them and ask:
- Yes → inform which
- No → standalone fix
- Multiple related → list them

**Store feature relationships for STEP 11.**

---

## STEP 6: Read Documentation (BEFORE code)

**MANDATORY ORDER - DO NOT SKIP.**

For each related feature identified in STEP 5, read its `changelog.md` and `about.md`.

**Understand:**
- Recent changes in affected area
- Architecture decisions that might relate to bug
- Dependencies and flow

---

## STEP 7: Investigation (ONLY AFTER STEPS 1-6)

**PREREQUISITES VERIFIED:**
- [ ] Branch `hotfix/*` active (NOT main)
- [ ] Changelogs of related features READ
- [ ] Documentation of related features READ

**NOW you can investigate code:**

Use Grep/Read to confirm what documentation indicated:
1. Entry point (controller, component)
2. Business logic (service, handler)
3. Data layer (repository, database)

---

## STEP 8: Confirm Root Cause (BEFORE implementing)

⛔ **GATE CHECK:** DO NOT implement without user confirmation.

**Present to user:**
- **Root Cause:** 1-2 sentences explaining the cause
- **Solution:** 1-2 sentences describing the fix
- **Files:** list of files to modify

**WAIT for explicit confirmation before proceeding.**

---

## STEP 9: Implement Fix

**PREREQUISITES:**
- [ ] Root cause confirmed by user
- [ ] On branch `hotfix/*`

### 9.1 Check Project Patterns

**If PROJECT_PATTERNS > 0 (from script output):** Read project patterns and follow them in implementation.

### 9.2 Implement

**DO:**
- Fix root cause (not symptom)
- Minimal and focused changes
- Follow existing patterns
- Test locally if possible

**FRONTEND FIXES:**
If bug in frontend:
1. READ `.codeadd/skills/add-ux-design/SKILL.md`
2. Follow patterns (mobile-first, shadcn, Tailwind v3)

**DO NOT:**
- Refactor unrelated code
- Add features
- Over-engineer

### 9.3 Verify Build

Verify build passes for affected apps (backend, frontend, or both).

---

## STEP 10: Update Documentation

**Update hotfix doc created in STEP 4** (`docs/[NNNN]H-[slug]/hotfix.md`).

Fill sections that had placeholders:
- **Root Cause Analysis** — why the bug was happening (from STEP 8)
- **Approach** — what was done to fix it
- **Files Modified** — path + what changed
- **Verification** — bug no longer reproduces, build passes, related functionality OK

---

## STEP 11: Create Related References

### 11.1 Identify Related Items

From STEP 5 analysis, list all features/items related to this hotfix.

### 11.2 Create related.md

Create `docs/[NNNN]H-[slug]/related.md` containing:
- Which features were affected by this hotfix
- Which PRs or issues are related
- Dependencies or blocking relationships

### 11.3 Update Feature Documents (if applicable)

For each related feature `docs/[NNNN][L]-[slug]/`:
- If `related.md` exists → ADD hotfix reference to "Hotfixes" section
- If `related.md` does NOT exist → CREATE it and ADD hotfix reference

---

## STEP 12: Log Iteration (MANDATORY — PRD0031)

**BEFORE informing user, append entry to iterations.jsonl:**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/[NNNN]H-[slug]/iterations.jsonl" "fix" "/hotfix" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**Parameters:**
- `slug`: kebab-case identifier (ex: modal-confirm-btn, null-check-user)
- `what`: Brief description max 60 chars
- `files`: Array of affected file paths

---

## STEP 13: Ready for Review

⛔ **DO NOT commit** - leave for `/add.done`

Inform user of completion including: hotfix ID, branch, problem, root cause, solution, modified files, build status. Suggest next step: `/add.done`.

**Next Steps:** Reference `.codeadd/skills/add-ecosystem/SKILL.md` Main Flows section for context-aware next command suggestion.

---

## Rules

**ALWAYS:**
- Use next-id.sh to calculate hotfix ID (global sequential with H suffix)
- Create hotfix branch and docs in flat structure (`docs/[NNNN]H-[slug]/`)
- Read hotfix template before creating hotfix.md
- Read changelogs and about.md before investigating code
- Identify related features and document in related.md
- Confirm root cause with user before implementing
- Fix root cause, not symptoms
- Keep changes minimal and focused
- Update related.md in both hotfix and affected features
- Log iteration entry before informing user
- Verify build passes after implementing fix

**NEVER:**
- Investigate code while on main branch
- Write hotfix.md without reading template first
- Grep or read code before reading changelogs
- Implement fix without user confirming root cause
- Refactor unrelated code during hotfix
- Add new features inside a hotfix
- Commit changes (leave for /add.done)
- Use bifurcated Path A/Path B logic (always use unified H[NNNN] flow)

---

## Example Flow

```
# User: "Screenshot validation bugada!"

# STEP 1-2: status.sh → BRANCH:main → STOP
# STEP 3: Read hotfix template
# STEP 4: next-id.sh H → 0001H
#   git checkout -b hotfix/0001H-screenshot-delete-error
#   Write docs/0001H-screenshot-delete-error/hotfix.md
# STEP 5: Related to 0036F-ai-screenshot-validation (from RECENT_CHANGELOGS)
# STEP 6: Read docs/0036F-ai-screenshot-validation/{changelog,about}.md
# STEP 7: Investigate code
# STEP 8: Confirm root cause with user
# STEP 9: Implement fix + verify build
# STEP 10: Update hotfix.md
# STEP 11: Create related.md (link 0001H ↔ 0036F)
# STEP 12: Log iteration
# STEP 13: Completion → suggest /add.done
```
