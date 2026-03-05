# Hotfix - Rapid Bug Fix Workflow (Dual Mode)

> **ARCHITECTURE REFERENCE:** Use `CLAUDE.md` as source of patterns.

---

## Spec
```json
{"gates":["path_decided","template_read","branch_created","docs_read","root_cause_confirmed"],"investigate":{"order":["RECENT_CHANGELOGS","docs/features/*/changelog.md","docs/features/*/about.md","code"]},"patterns":{"if_exists":".codeadd/projects/*-patterns.md","action":"READ before fix"},"modes":{"feature_fix":"fix/F[XXXX]-[name]","standalone":"fix/H[XXXX]-[name]"},"template":".codeadd/templates/hotfix-template.md"}
```

---

## OWNER Context

**From `OWNER:name|level|language` (feature-status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**EXECUTE THESE STEPS IN ORDER. DO NOT SKIP ANY.**

```
STEP 1:  feature-status.sh      → RUN FIRST
STEP 2:  BRANCH = main?         → IF YES: STEPS 3-4. IF NO: SKIP TO 5
STEP 3:  Infer + Ask            → ANALYZE CHANGELOGS AND ASK (Path A or B)
STEP 4:  Create branch + doc    → READ TEMPLATE, CREATE BRANCH, WRITE DOC
STEP 5:  READ changelogs        → BEFORE any Grep/Read on code
STEP 6:  Investigate code       → ONLY AFTER steps 1-5 complete
STEP 7:  Confirm root cause     → BEFORE implementing
STEP 8:  Implement fix          → ONLY AFTER step 7
STEP 9:  Update hotfix doc      → AFTER implementing
STEP 10: Log iteration          → MANDATORY BEFORE informing user
STEP 11: Inform user            → AWAITING /add-done
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF BRANCH = main:
  ⛔ DO NOT USE: Grep on .ts/.tsx/.js files
  ⛔ DO NOT USE: Read on code files
  ⛔ DO NOT: Code investigation
  ⛔ DO NOT: Implementation
  ✅ DO: STEP 3 (Infer + Ask) and STEP 4 (create branch + doc)

IF PATH NOT DECIDED (STEP 3 not complete):
  ⛔ DO NOT USE: Bash to create branch
  ⛔ DO NOT USE: Write to create hotfix doc
  ✅ DO: Analyze RECENT_CHANGELOGS and ask user

IF TEMPLATE NOT READ:
  ⛔ DO NOT USE: Write to create hotfix doc
  ✅ DO: Read .codeadd/templates/hotfix-template.md FIRST

IF CHANGELOGS NOT READ:
  ⛔ DO NOT USE: Grep on code
  ⛔ DO NOT USE: Read on code
  ✅ DO: Read docs/features/F[XXXX]-*/changelog.md
  ✅ DO: Read docs/features/F[XXXX]-*/about.md

IF ROOT CAUSE NOT CONFIRMED:
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO NOT: Implementation
  ✅ DO: Present root cause to user and WAIT for confirmation
```

---

## STEP 1: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/feature-status.sh
```

**AFTER EXECUTION, CHECK OUTPUT:**

---

## STEP 2: Branch Check (HARD STOP)

**Look at script output. What is the BRANCH value?**

### IF `BRANCH:main` or `BRANCH:master`:

⛔ **TOTAL STOP** - You are on main branch.

**MANDATORY ACTION:** Execute STEP 3 and STEP 4 NOW.
**DO NOT:** Grep, Read code, investigation, nothing.

### IF `BRANCH:fix/F*` or `BRANCH:fix/H*`:

✅ Branch OK. Skip to STEP 5.

---

## STEP 3: Infer + Ask (MANDATORY if main)

⛔ **GATE:** DO NOT create branch or doc before completing this step.

### 3.1 Analyze RECENT_CHANGELOGS

From `feature-status.sh` output, analyze `RECENT_CHANGELOGS`:
- Which features mention the affected area/component?
- Is the bug likely related to recent changes?

### 3.2 Present to User

**ASK user with options:**

```
Analyzed recent changelogs.

Likely feature: F[XXXX]-[feature-name]
(Mentioned: [relevant context from changelog])

Is this bug related to this feature?
  a) Yes → Fix in F[XXXX] (lightweight, docs in existing feature)
  b) No, it's standalone hotfix → Create H[XXXX] (independent tracking)
  c) No, it's in another feature → [inform F[XXXX]]
```

**IF no feature seems related:**

```
Did not find feature directly related to the problem.

Options:
  a) Relate to specific feature → [inform F[XXXX]]
  b) Create standalone hotfix → H[XXXX] (independent tracking)
```

### 3.3 Register Decision

**AFTER user response:**
- **a) Yes** → PATH = feature_fix, FEATURE_ID = F[XXXX]
- **b) Standalone** → PATH = standalone
- **c) Another feature** → PATH = feature_fix, FEATURE_ID = [informed by user]

---

## STEP 4: Create Branch + Doc (DUAL MODE)

⛔ **GATE:** READ `.codeadd/templates/hotfix-template.md` BEFORE creating doc.

### 4.1 Read Template (MANDATORY)

```
Read .codeadd/templates/hotfix-template.md
```

### 4.2 Create Branch

**IF Path A (Feature Fix):**
```bash
git checkout -b fix/F[XXXX]-[hotfix-name]
```

**IF Path B (Standalone):**

FIRST discover next H[XXXX]:
```bash
git branch -a | grep -oE 'H[0-9]{4}' | sort -r | head -1
```
- If no result → use H0001
- If found H[NNNN] → increment to H[NNNN+1]

```bash
git checkout -b fix/H[XXXX]-[hotfix-name]
```

**[hotfix-name]:** kebab-case descriptive (ex: `screenshot-delete-error`, `login-timeout`)

### 4.3 Create Hotfix Doc

**IF Path A (Feature Fix):**
- Locate feature dir: `Glob docs/features/F[XXXX]-*`
- Doc path: `docs/features/F[XXXX]-[slug]/hotfix-YYYYMMDD-HHMM-[hotfix-name].md`
- Fill placeholders:
  - `{{HOTFIX_TYPE}}` = `Feature Fix`
  - `{{RELATED_FEATURE}}` = `F[XXXX]-[feature-name]`

**IF Path B (Standalone):**
- Create directory if needed: `mkdir docs/hotfixes` (via Bash)
- Doc path: `docs/hotfixes/hotfix-YYYYMMDD-HHMM-[hotfix-name].md`
- Fill placeholders:
  - `{{HOTFIX_TYPE}}` = `Standalone`
  - `{{RELATED_FEATURE}}` = `N/A`

**Common placeholders:**
- `{{TITLE}}` = descriptive bug title
- `{{BRANCH_NAME}}` = branch created in 4.2
- `{{DATETIME}}` = current date/time (YYYY-MM-DD HH:MM)
- `{{PRIORITY}}` = High

**⛔ CONFIRM:** Execute `git branch --show-current` and verify you're on `fix/*`

---

## STEP 5: Read Documentation FIRST (BEFORE code)

**MANDATORY ORDER - DO NOT SKIP:**

### 5.1 Identify Related Features

From `feature-status.sh` output, analyze `RECENT_CHANGELOGS`:
- Which features mention the affected area/component?
- Is the bug likely related to recent changes?

### 5.2 READ Documentation (MANDATORY)

For each related feature:
```
Read docs/features/F[XXXX]-*/changelog.md
Read docs/features/F[XXXX]-*/about.md
```

### 5.3 Discovery via Skill (Past Features Agent)

**Dispatch Past Features Discovery Agent** (feature-discovery/SKILL.md Phase 1.5):

```
Input: about.md da feature relacionada ao hotfix + RECENT_CHANGELOGS (já disponível do Step 1)
Skill: .codeadd/skills/feature-discovery/SKILL.md Phase 1.5
Output: docs/features/${FEATURE_ID}/past-features.md
```

**Prompt do agente:**
```
Read .codeadd/skills/feature-discovery/SKILL.md Phase 1.5.
Feature context: about.md de F[XXXX] (feature relacionada ao bug).
RECENT_CHANGELOGS: [output do Step 1].
Execute análise de features passadas para identificar dependências e histórico relevante ao bug.
Write output to docs/features/${FEATURE_ID}/past-features.md.
```

**SE hotfix não tem feature associada (standalone):**
- Usar keywords do bug description como input no lugar do about.md
- Output: `docs/hotfixes/past-features-[slug].md` (temporário)

**Usar output para:**
- Identificar quais arquivos foram tocados por features relacionadas (alta probabilidade de ser local do bug)
- Entender sequência de implementação (mudanças recentes = maior probabilidade de regressão)
- Verificar pivots em `decisions.jsonl` de features relacionadas (áreas pivotadas = maior risco)
- Narring de escopo: começar pelos arquivos das iterações mais recentes

**⛔ ONLY AFTER READING DOCUMENTATION + past-features.md you can use Grep/Read on code.**

---

## STEP 6: Investigation (ONLY AFTER STEPS 1-5)

**PREREQUISITES VERIFIED:**
- [ ] Branch `fix/*` active (NOT main)
- [ ] Changelogs of related features READ
- [ ] about.md of related features READ

**NOW you can investigate code:**

```bash
# Entry point (controller, component)
# Business logic (service, handler)
# Data layer (repository, database)
```

Use Grep/Read to confirm what documentation indicated.

---

## STEP 7: Confirm Root Cause (BEFORE implementing)

⛔ **GATE CHECK:** DO NOT implement without user confirmation.

**Present to user:**
```
Found the problem:

**Root Cause:** [1-2 sentences explaining the cause]
**Solution:** [1-2 sentences describing the fix]
**Files:** [list of files to modify]

Confirm? (yes/no)
```

**WAIT for explicit confirmation before proceeding.**

---

## STEP 8: Implement Fix

**PREREQUISITES:**
- [ ] Root cause confirmed by user
- [ ] On branch `fix/*`

### 8.1 Check Project Patterns

**If PROJECT_PATTERNS > 0 (from script output):**
```bash
cat .codeadd/projects/*-patterns.md
```
→ Follow documented patterns in implementation

### 8.2 Implement

**DO:**
- Fix root cause (not symptom)
- Minimal and focused changes
- Follow existing patterns

**FRONTEND FIXES:**
If bug in frontend:
1. READ `.codeadd/skills/ux-design/SKILL.md`
2. Follow patterns (mobile-first, shadcn, Tailwind v3)
3. Consult specific docs if needed

**DO NOT:**
- Refactor unrelated code
- Add features
- Over-engineer

### 8.3 Verify Build
```bash
# Backend
cd apps/backend && npm run build

# Frontend (if applicable)
cd apps/frontend && npm run build
```

---

## STEP 9: Update Documentation

**Update hotfix doc created in STEP 4** (you know the path because you created the file).

Fill sections that had placeholders:

```markdown
### Root Cause Analysis
[Why the bug was happening]

### Approach
[What was done to fix it]

### Files Modified
- `[path]` - [change]

### Verification
- [x] Bug no longer reproduces
- [x] Build passes (backend + frontend)
- [x] Related functionality OK
```

---

## STEP 10: Log Iteration (MANDATORY — PRD0031)

**BEFORE informing user, append entry to iterations.jsonl:**

**Feature hotfix (PATH A):**
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/iterations.jsonl" "fix" "/hotfix" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**Standalone hotfix (PATH B):**
```bash
bash .codeadd/scripts/log-jsonl.sh "docs/hotfixes/iterations.jsonl" "fix" "/hotfix" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**Parameters:**
- `slug`: kebab-case identifier (ex: modal-confirm-btn, null-check-user)
- `what`: Brief description max 60 chars
- `files`: Array of affected file paths (full paths)

---

## STEP 11: Ready for Review

⛔ **DO NOT commit** - leave for `/add-done`

**Output to user:**
```
✅ Hotfix Implemented!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Hotfix: [F|H][XXXX]-[name]
🌿 Branch: fix/[F|H][XXXX]-[name]
📋 Type: [Feature Fix | Standalone]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Problem:** [what was broken]
**Root Cause:** [why it was broken]
**Solution:** [what was fixed]

**Modified Files:**
- [file 1]
- [file 2]

**Build:** ✅ OK

**Documentation:** ✓ hotfix doc updated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Changes NOT committed (awaiting review)

**Next steps:**
1. Review changes
2. Test fix
3. Execute `/add-done` to finalize

**Suggested next command (from ecosystem map):**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
- Hotfix complete → `/add-done`
```

---

## Sequential Execution Checklist

**MARK EACH ITEM IN ORDER - DO NOT SKIP:**

### STEPS 1-5 (MANDATORY BEFORE CODE)
- [ ] STEP 1: `feature-status.sh` executed
- [ ] STEP 2: BRANCH verified
- [ ] STEP 3: Path decided (Feature Fix or Standalone) with user confirmation
- [ ] STEP 4: Template read + branch created + hotfix doc written
- [ ] STEP 5: Changelogs, about.md of related features READ + Past Features Agent dispatched (5.3) + past-features.md gerado

### STEPS 6-7 (INVESTIGATION)
- [ ] STEP 6: Code investigated (ONLY after STEP 5)
- [ ] STEP 7: Root cause CONFIRMED with user

### STEPS 8-11 (IMPLEMENTATION)
- [ ] STEP 8: Fix implemented + build OK
- [ ] STEP 9: Hotfix doc updated with root cause + solution
- [ ] STEP 10: `iterations.jsonl` entry appended
- [ ] STEP 11: User informed, awaiting `/add-done`

---

## Rules

ALWAYS:
- Run feature-status.sh as the very first command
- Create fix branch before any code investigation
- Read hotfix template before creating hotfix doc
- Read changelogs and about.md before investigating code
- Confirm root cause with user before implementing
- Fix root cause, not symptoms
- Keep changes minimal and focused
- Log iteration entry before informing user
- Verify build passes after implementing fix

NEVER:
- Investigate code while on main branch
- Create branch before deciding fix path with user
- Write hotfix doc without reading template first
- Grep or read code before reading changelogs
- Implement fix without user confirming root cause
- Refactor unrelated code during hotfix
- Add new features inside a hotfix
- Commit changes (leave for /add-done)

---

## Example Flow: Feature Fix (Path A)

```
# User: "Screenshot validation bugada!"

# STEP 1: First command ALWAYS
bash .codeadd/scripts/feature-status.sh
# Output: BRANCH:main  ← ALERT!
# Output: RECENT_CHANGELOGS: F0036-ai-screenshot-validation...

# STEP 2: BRANCH = main → STOP

# STEP 3: Infer + Ask
# "Likely feature: F0036-ai-screenshot-validation"
# User: "Yes" → PATH = feature_fix, FEATURE_ID = F0036

# STEP 4: Create branch + doc
Read .codeadd/templates/hotfix-template.md
git checkout -b fix/F0036-screenshot-delete-error
Glob docs/features/F0036-*  → docs/features/F0036-ai-screenshot-validation/
Write docs/features/F0036-ai-screenshot-validation/hotfix-20260206-1341-screenshot-delete-error.md
# (template filled with placeholders)

# STEP 5: READ documentation BEFORE code
Read docs/features/F0036-ai-screenshot-validation/changelog.md
Read docs/features/F0036-ai-screenshot-validation/about.md

# STEP 6: Investigate code
# STEP 7: Confirm root cause with user
# STEPS 8-11: Implement, document, log iteration
```

## Example Flow: Standalone Hotfix (Path B)

```
# User: "Critical XSS in login!"

# STEP 1-2: feature-status.sh → BRANCH:main → STOP

# STEP 3: Infer + Ask
# No related feature → User: "Standalone"

# STEP 4: Create branch + doc
Read .codeadd/templates/hotfix-template.md
git branch -a | grep -oE 'H[0-9]{4}'  → no result → H0001
mkdir docs/hotfixes
git checkout -b fix/H0001-critical-xss
Write docs/hotfixes/hotfix-20260206-1341-critical-xss.md
# (template filled with HOTFIX_TYPE=Standalone, RELATED_FEATURE=N/A)

# STEPS 5-11: Continue normal workflow
```
