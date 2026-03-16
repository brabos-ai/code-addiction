# Feature PR & Changelog Generator

> **MODEL:** Use `haiku` model
> **LANG:** Follow `OWNER:name|level|language` from status.sh or owner.md. Default: intermediario, en-us.

Coordinator for PR creation with intelligent changelog generation. Analyzes files, filters POCOs/DTOs, detects out-of-scope implementations, feeds root CHANGELOG.md.

---

## Spec

```json
{"outputs":{"feature_changelog":"docs/features/${FEATURE_ID}/changelog.md","about_addendum":"docs/features/${FEATURE_ID}/about.md","root_changelog":"CHANGELOG.md"}}
```

---

## STEPS IN ORDER

```
STEP 0: Check gh CLI         -> VERIFY FIRST
STEP 1: feature-pr.sh        -> RUN SECOND
STEP 2: Classify files        -> BY priority
STEP 3: Analyze HIGH files    -> READ before describe
STEP 4: Detect out-of-scope   -> COMPARE with about.md
STEP 5: Generate changelog    -> FEATURE directory
STEP 6: Update about.md       -> ONLY IF out-of-scope
STEP 7: Preview               -> REQUIRES user confirmation
STEP 8: Write files           -> BEFORE --create-pr script
STEP 9: Execute script        -> CREATES PR automatically
```

**PROHIBITIONS:**

```
IF gh CLI NOT INSTALLED:
  NEVER proceed to any step
  ✅ DO: Show install guidance and STOP

IF gh NOT AUTHENTICATED:
  NEVER proceed to any step
  ✅ DO: Show auth guidance and STOP

IF STATUS=ERROR FROM SCRIPT:
  NEVER write changelog or run git operations
  ✅ DO: Show error and STOP

IF FILES NOT ANALYZED:
  NEVER write changelog.md or generate preview
  ✅ DO: Classify and analyze files FIRST

IF USER NOT CONFIRMED:
  NEVER write files or run --create-pr
  ✅ DO: Wait for explicit confirmation

IF CHANGELOG NOT WRITTEN:
  NEVER run --create-pr
  ✅ DO: Write all files FIRST

ALWAYS:
  NEVER use Bash for git add/commit/push manually (script --create-pr handles everything)
  NEVER describe POCOs/DTOs/entities in detail
  NEVER proceed without gh CLI installed and authenticated
```

---

## STEP 0: Check Prerequisites (VERIFY FIRST)

### 0.1 Verify gh CLI is installed

If gh CLI is NOT installed: show platform-appropriate installation instructions and STOP.

### 0.2 Check gh Authentication

If gh CLI is installed:

```bash
gh auth status
```

If NOT authenticated: instruct user to run `gh auth login` and STOP.

If authenticated: proceed to STEP 1.

---

## STEP 1: Collect Data (RUN SECOND)

```bash
bash .codeadd/scripts/feature-pr.sh
```

**Output:** `FEATURE_ID`, `FEATURE_DIR`, `CHANGED_FILES`, `PENDING_CHANGES`

**IF STATUS=ERROR:** Show error and stop.

---

## STEP 2: Classify Files by Priority

**Classification patterns:**

```json
{"high":{"patterns":["services","usecases","handlers","controllers","endpoints","repositories","hooks","stores","contexts","validators","rules","pages","components"],"action":"include with description ~10 words"},"medium":{"patterns":["types","interfaces","utils","helpers","config","*.test.*","*.spec.*"],"action":"include without detailed description"},"low":{"patterns":["models","entities","dtos","requests","responses","migrations","*.css","*.scss","constants","enums"],"action":"count only"}}
```

**For each file in CHANGED_FILES:**

| Priority | Patterns | Action |
|----------|----------|--------|
| HIGH | services, usecases, handlers, controllers, endpoints, repositories, hooks, stores, contexts, validators, rules, pages, components | READ + describe ~10 words + list main methods |
| MEDIUM | types, interfaces, utils, helpers, config, tests | Include in list without detailed description |
| LOW | models, entities, dtos, requests, responses, migrations, styles, constants, enums | Count only (do not describe) |

---

## STEP 3: Analyze HIGH Priority Files (READ before describe)

**For each HIGH file:**

1. **READ file content**
2. **Generate description:** ~10 words
3. **List main methods/functions**

**Format:**

```
src/services/PaymentService.ts
   Desc: Orchestrates payment with validation and Stripe integration
   Impl: processPayment(), refundPayment()
```

---

## STEP 4: Detect Out-of-Scope Implementations (COMPARE with about.md)

### 4.1 Load Feature Context

```bash
cat docs/features/${FEATURE_ID}/about.md
```

**Extract:** Objective, Scope (Included/Excluded), Business Rules, Technical Decisions

### 4.2 Compare Scope vs Implementations

**Mark as OUT-OF-SCOPE if:**
- Different domain than defined
- Functionality not mentioned in scope
- Integration not planned
- Refactor not related to feature

**Register reason:** dependency | improvement | discovery | refactor

---

## STEP 5: Generate Feature Changelog

**Path:** `docs/features/${FEATURE_ID}/changelog.md`

**Template:**

```markdown
# Changelog: ${FEATURE_ID}
> **Date:** ${TODAY} | **Branch:** ${BRANCH_NAME}

## Summary
[2-3 sentence synthesis]

## Main Files

### Core & Business Logic
| File | Description |
|------|-------------|
| `path/file.ts` | [~10 words] |

**Implementations:** `File`: method1(), method2()

### Types & Utils
[simple list]

### Statistics
Total: X | High: Y | Medium: Z | Low: W

## Out of Original Scope
| Item | File | Reason |
|------|------|--------|
| [desc] | `path` | [reason] |

_Generated by /pr on ${TODAY}_
```

---

## STEP 6: Update about.md (ONLY IF out-of-scope detected)

**IF out-of-scope detected, append to about.md:**

```markdown
---

## Addendum: Additional Deliveries
> Updated on ${TODAY}

| Delivery | Description | Justification |
|----------|-------------|---------------|
| [Name] | [What] | [Why] |

**Impact:** [brief]
```

---

## STEP 7: Preview & Confirmation (REQUIRES user confirmation)

Generate a preview showing: feature ID, summary, top 5 files, stats, out-of-scope items, and the list of actions to execute. Ask for explicit confirmation before proceeding.

**IF USER NOT CONFIRMED:** wait. Do not write files or run script.

**IF CONFIRMED:** Proceed to STEP 8.

---

## STEP 8: Write Files (BEFORE --create-pr script)

**MANDATORY ORDER:**

1. Write `docs/features/${FEATURE_ID}/changelog.md`
2. Write `docs/features/${FEATURE_ID}/about.md` addendum (if out-of-scope detected)
3. Write `CHANGELOG.md` root

### 8.1 Feature Changelog

Already generated in STEP 5.

### 8.2 About.md Addendum

Already generated in STEP 6 (if applicable).

### 8.3 CHANGELOG.md Root

**Path:** `CHANGELOG.md`

**IF file not exists:** Create with header `# Changelog\nFeature history.`

**APPEND AT TOP (after header):**

```markdown
## [${TODAY}] ${FEATURE_ID}

### Summary
[2-4 sentences]

### Main Deliveries
| Component | Description |
|-----------|-------------|
| `Name` | [~15 words] |

### Out of Original Scope *(only if exists)*
| Item | Justification |
|------|---------------|
| [Item] | [Reason] |

### Statistics
Business: X | Support: Y | Total: Z
```

---

## STEP 9: Execute Script (CREATES PR automatically)

**Execute immediately after STEP 8:**

```bash
bash .codeadd/scripts/feature-pr.sh --create-pr
```

**Script actions:**
1. Commit pending changes
2. Append file list to changelog
3. Commit changelog
4. Push to origin
5. Create PR via `gh pr create`

Report the PR URL, feature ID, and target branch to the user.

---

## STEP 10: Confirm Merge (AFTER PR merged)

**Execute when PR is merged:**

```bash
bash .codeadd/scripts/feature-pr.sh --confirm-merge
```

**Script actions:**
1. Checkout main
2. Pull latest
3. Delete local branch

---

## Rules

ALWAYS:
- Read HIGH priority files before describing them
- Compare implementations with about.md to detect out-of-scope
- Keep file descriptions to approximately ten words
- Document all out-of-scope items with justification
- Write all files before executing --create-pr script
- Append CHANGELOG.md entries at top after header
- Wait for explicit user confirmation before STEP 8

NEVER:
- Proceed without gh CLI installed and authenticated
- Describe POCOs, DTOs, or entities in detail
- Assume scope without reading about.md first
- Execute --create-pr without user confirmation
- Execute --confirm-merge without PR being merged
- Delete remote branches manually
- Use Bash for git operations manually (script handles everything)

---

## Error Handling

| Error | Action |
|-------|--------|
| gh CLI not found | Show installation guidance + STOP |
| gh not authenticated | Show gh auth login guidance + STOP |
| about.md not found | Degrade: changelog without scope comparison |
| File unreadable | Mark as 'not analyzed' |
| >50 files | Analyze top 20 HIGH only + count rest |
| PR creation failed | Verify gh auth status |
| CHANGELOG.md not exists | Create with header |
