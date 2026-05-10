---
name: add-delivery-validation
description: Product validation: Requirements 100% implemented, prerequisites exist, acceptance criteria pass.
---

# Delivery Validation

Skill for PRODUCT validation — checks whether requirements were 100% implemented.

**Use for:** Validating feature delivery, checking fulfilled requirements, identifying functional gaps.
**Don't use for:** Validating technical code (use code-review), planning, discovery.

**Difference from code-review:**

| code-review (Technical) | delivery-validation (Product) |
|-------------------------|-------------------------------|
| IoC, SOLID, security | RF/RN implemented? |
| Type contracts | Acceptance criteria passing? |
| Build compiles? | Functionality works end-to-end? |
| Technical patterns | Implicit dependencies created? |

---

## When to Use

- Before `/add-done` (final gate)
- After `/review` (complementary)
- When the feature appears ready

### When NOT to Use

- During development
- To validate code (use `code-review` instead)
- Without a defined `about.md`

---

## Workflow

### Phase 1: Load Requirements

```bash
# Identify current feature
FEATURE_ID=$(bash .codeadd/scripts/status.sh)

# Load specification
cat docs/features/${FEATURE_ID}/about.md
cat docs/features/${FEATURE_ID}/plan.md 2>/dev/null  # Contracts (prose)
cat docs/features/${FEATURE_ID}/tasks.md 2>/dev/null # Tick state (## Acceptance Checklist)
```

**Extract from about.md:**
- **RF (Functional Requirements):** What the system MUST do
- **RN (Business Rules):** Conditions and behaviors
- **Acceptance Criteria:** Testable checks
- **Included Scope:** What IS part of the delivery

**Extract contracts from plan.md (prose) + tick state from tasks.md → ## Acceptance Checklist:**

From `plan.md` (prose): routes, services, DTOs, guards, migrations, queues — as defined in the plan.
From `tasks.md → ## Acceptance Checklist`: a checklist where each item ends with `(RFNN/RNNN)` reference and carries `[ ]`/`[x]`/`[!]` tick state set by `add.build`/`add.autopilot` validators.

Map each `## Acceptance Checklist` item to the corresponding RF/RN from `about.md`. Use `## Requirements Coverage` from `tasks.md` as a derived index — every RF/RN must have coverage by ≥1 item from `## Acceptance Checklist`.

IF `tasks.md` or `## Acceptance Checklist` does NOT exist (legacy feature, pre-PRD0014):
- BLOCK validation. The feature was not planned with the current schema; there is no automatic fallback.
- Warn: "tasks.md missing or has no ## Acceptance Checklist — feature must be replanned via /add.plan."

### Phase 2: Build Validation Checklist

**For EACH requirement, create a verifiable item:**

```markdown
## Requirements Checklist

### Functional Requirements
- [ ] **RF01:** [description] → [how to verify]
- [ ] **RF02:** [description] → [how to verify]

### Business Rules
- [ ] **RN01:** [condition] → [expected result]
- [ ] **RN02:** [condition] → [expected result]

### Acceptance Criteria
- [ ] [criterion 1] → [how to test]
- [ ] [criterion 2] → [how to test]
```

### Phase 3: Verify Prerequisites (CRITICAL)

**For EACH requirement, analyze implicit dependencies:**

```markdown
## Prerequisites Analysis

### RF01: "Check product tier before allowing download"
**Dependency analysis:**
1. Does Product need a `tier` field? → [VERIFY in model]
2. Is there a flow to assign tier? → [VERIFY endpoints]
3. Is tier already populated? → [VERIFY data]

**Status:**
- [ ] tier field exists on Product → ✅/❌
- [ ] Assignment flow exists → ✅/❌
- [ ] Data is consistent → ✅/❌
```

**Key questions for each requirement:**
- "What MUST exist for this to work?"
- "What data/fields are needed?"
- "What dependent flows are needed?"
- "What integrations are needed?"

### Phase 3.5: Validate Acceptance Checklist (tasks.md → ## Acceptance Checklist)

**For EACH item in ## Acceptance Checklist:**

```markdown
### Acceptance Checklist Validation

| Item (with RF/RN ref) | Tick state | Expected (from plan.md) | Found | Status |
|-----------------------|------------|-------------------------|-------|--------|
| Route POST /billing/webhook/:provider returns 200 (RF02) | [x] | WebhookController.handleWebhook() | POST /webhook (fixed) | ⚠️ DIVERGENT |
| Service WebhookNormalizerService is provider-agnostic (RF02) | [!] | generic, provider-agnostic | StripeWebhookService | ❌ MISSING |
| DTO WebhookEventDto exposes {provider, payload, signature} (RF02) | [ ] | {provider, payload, signature} | WebhookDto {payload} | ⚠️ DIVERGENT |
```

**Status per item (cross-check tick state vs reality):**
- ✅ **COMPLIANT:** tick `[x]` AND implementation matches plan.md prose
- ⚠️ **DIVERGENT:** tick `[x]` but implementation differs from plan.md (validator was wrong OR drift after tick)
- ❌ **MISSING/FAILED:** tick `[!]` (validator already marked failure) OR tick `[ ]` still pending
- 🚨 **STALE TICK:** tick `[x]` but code does not exist — blocks delivery; reopen tick

**Mandatory cross-reference:** Do all RF/RN from `## Requirements Coverage` (tasks.md §1) have a corresponding item in `## Acceptance Checklist` (tasks.md §4)?
- IF yes → validation is deterministic (checklist-driven)
- IF gap → document which RF/RN are uncovered — architect failure when generating tasks.md, requires regenerating via /add.plan

---

### Phase 4: Validate Implementation

**For EACH checklist item (about.md + tasks.md → ## Acceptance Checklist):**

1. **Locate code that implements it**
   ```bash
   # Search the requirement's implementation
   grep -r "[key-term]" apps/ libs/ --include="*.ts"
   ```

2. **Verify the logic is correct**
   - RN conditions implemented?
   - Edge cases handled?
   - Full end-to-end flow?

3. **Mark status:**
   - ✅ **Implemented:** Code exists and is correct
   - ⚠️ **Partial:** Implemented but incomplete
   - ❌ **Not implemented:** Completely missing
   - 🔗 **Missing prerequisite:** Dependency does not exist

### Phase 5: Test Scenarios (if possible)

**For each acceptance criterion:**

```markdown
### Test: [Criterion]

**Scenario:** [description]
**Given:** [precondition]
**When:** [action]
**Then:** [expected result]

**Result:** ✅ Passed / ❌ Failed / ⚠️ Not testable
```

### Phase 6: Generate Report

**Output: validation-report.md**

```markdown
# Delivery Validation: [Feature]

**Date:** [date] | **Status:** ✅ APPROVED / ❌ BLOCKED

## Summary

{"total_requirements":N,"implemented":N,"partial":N,"missing":N,"prerequisites_ok":true/false}

---

## Functional Requirements

| ID | Requirement | Status | Note |
|----|-------------|--------|------|
| RF01 | [desc] | ✅ | Implemented at `path:line` |
| RF02 | [desc] | ❌ | Not found |

---

## Business Rules

| ID | Rule | Status | Note |
|----|------|--------|------|
| RN01 | [cond] → [result] | ✅ | Logic correct |
| RN02 | [cond] → [result] | ⚠️ | Missing edge case X |

---

## Prerequisites Analysis

| Requirement | Prerequisite | Status | Required Action |
|-------------|--------------|--------|-----------------|
| RF01 | tier field on Product | ❌ | Create field |
| RF01 | Assignment flow | ❌ | Create endpoint |

---

## Acceptance Criteria

- [x] [Criterion 1] - Passed
- [ ] [Criterion 2] - Failed: [reason]

---

## Identified Gaps

### Gap 1: [Title]
**Requirement:** RF01
**Problem:** [gap description]
**Impact:** [what does not work]
**Action:** [what needs to be done]

---

## Decision

**Status:** ✅ APPROVED / ⚠️ NEEDS WORK / ❌ BLOCKED

**If BLOCKED:**
- [ ] Implement [gap 1]
- [ ] Implement [gap 2]

**If APPROVED:**
Feature ready to merge.
```

---

## Severities

| Severity | Meaning |
|----------|---------|
| ✅ Implemented | Requirement 100% met |
| ⚠️ Partial | Implemented but incomplete — may merge with caveat |
| ❌ Missing | Not implemented — BLOCKS merge |
| 🔗 Prerequisite Missing | Dependency does not exist — BLOCKS merge |

---

## Blocking Rules

**Blocking (do NOT deliver):**

| Condition | Reason |
|-----------|--------|
| ❌ Missing RF | Feature incomplete |
| 🔗 Prerequisite Missing | Cannot work without it |
| ❌ Missing critical RN | Incorrect behavior |

**Non-blocking (may merge):**

| Condition | Action |
|-----------|--------|
| ⚠️ Partial RF | May merge if documented |
| ⚠️ Missing non-critical RN | May merge with TODO |

---

## Integration with Other Commands

### Use in /review
```markdown
## Final Phase: Product Validation

After technical code review, run delivery-validation:
1. Load skill: `cat {{skill:add-delivery-validation/SKILL.md}}`
2. Run product validation
3. Approve only if both code-review AND delivery-validation pass
```

### Use in /add-done
```markdown
## Final Gate

BEFORE merging:
1. code-review passed? → ✅
2. delivery-validation passed? → ✅
3. Both ✅ → may merge
```

---

## Checklist

- [ ] Does about.md exist and is it complete?
- [ ] All RF listed?
- [ ] All RN listed?
- [ ] Acceptance criteria defined?
- [ ] Prerequisites analyzed for each RF?
- [ ] Each requirement has implementation verified?
- [ ] Gaps documented with required action?
- [ ] Final status defined (APPROVED/BLOCKED)?

---

## Rules

**Do:**
- Read about.md FIRST
- Analyze prerequisites for EACH requirement
- Verify implementation against code (do not assume)
- Document gaps with concrete actions
- Block if a prerequisite is missing

**Don't:**
- Approve without checking prerequisites
- Assume "looks implemented" is enough
- Ignore business rules
- Approve an incomplete feature
- Confuse with code-review (technical)

---

## Practical Example

**Scenario:** Feature "Template download with tier verification"

**about.md says:**
```
RF01: Check product tier before allowing download
RN01: Product without tier → block download
```

**Prerequisites Analysis:**
```
RF01: Check product tier
  └─ Prerequisite: Does Product HAVE a tier field?
     └─ Verify: SELECT * FROM products LIMIT 1;
     └─ Result: ❌ tier field DOES NOT EXIST

  └─ Prerequisite: Is there an assignment flow?
     └─ Verify: grep -r "tier" apps/backend/src/
     └─ Result: ❌ No assignment endpoint
```

**Decision:** ❌ BLOCKED
- Prerequisite "tier field" does not exist
- Prerequisite "assignment flow" does not exist
- Feature cannot work without these prerequisites

**Action:** Implement prerequisites before considering the feature ready.
