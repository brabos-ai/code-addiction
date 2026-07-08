---
name: add-delivery-validation
description: 'Product validation: Requirements 100% implemented, prerequisites exist, acceptance criteria pass.'
---

# Delivery Validation

Skill for PRODUCT validation — checks whether requirements were 100% implemented.

## When to Use

- Before `/add-done` (final gate)
- After `/review` (complementary)
- When the feature appears ready

**Difference from code-review:**

| code-review (Technical) | delivery-validation (Product) |
|-------------------------|-------------------------------|
| IoC, SOLID, security | RF/RN implemented? |
| Type contracts | Acceptance criteria passing? |
| Build compiles? | Functionality works end-to-end? |
| Technical patterns | Implicit dependencies created? |

**Runtime arm — `/add.qa`:** this skill validates delivery **statically** (reads the code/docs, checks the RF/RN checklist). `/add.qa` (the `playwright` plugin, opt-in) is the **runtime** arm of the same goal — it drives the running app to prove functional delivery against `about.md` acceptance criteria (and UX fidelity vs `design.md`), producing a `_tests/run-NNN/qa-validation-NNN.md` audit. Use them together when the feature has UI: this skill confirms the requirements exist in code; `/add.qa` confirms they actually work in the browser.

### When NOT to Use

- During development (run only when feature appears ready)
- To validate code quality (use `code-review` instead)
- Without a defined `about.md`
- For planning or discovery work

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

**For EACH item in ## Acceptance Checklist, cross-check tick state vs reality:**

| Item (with RF/RN ref) | Tick state | Expected (from plan.md) | Found | Status |
|-----------------------|------------|-------------------------|-------|--------|
| Route POST /billing/webhook/:provider returns 200 (RF02) | [x] | WebhookController.handleWebhook() | POST /webhook (fixed) | ⚠️ DIVERGENT |
| Service WebhookNormalizerService is provider-agnostic (RF02) | [!] | generic, provider-agnostic | StripeWebhookService | ❌ MISSING |
| DTO WebhookEventDto exposes {provider, payload, signature} (RF02) | [ ] | {provider, payload, signature} | WebhookDto {payload} | ⚠️ DIVERGENT |

**Status per item:**
- ✅ **COMPLIANT:** tick `[x]` AND implementation matches plan.md prose
- ⚠️ **DIVERGENT:** tick `[x]` but implementation differs from plan.md (validator was wrong OR drift after tick)
- ❌ **MISSING/FAILED:** tick `[!]` (validator already marked failure) OR tick `[ ]` still pending
- 🚨 **STALE TICK:** tick `[x]` but code does not exist — blocks delivery; reopen tick

**Mandatory cross-reference:** Do all RF/RN from `## Requirements Coverage` (tasks.md §1) have a corresponding item in `## Acceptance Checklist` (tasks.md §4)?
- IF yes → validation is deterministic (checklist-driven)
- IF gap → document which RF/RN are uncovered — architect failure when generating tasks.md, requires regenerating via /add.plan

### Phase 4: Validate Implementation

**For EACH checklist item (about.md + tasks.md → ## Acceptance Checklist):**

1. **Locate code that implements it** (`grep -r "[key-term]" apps/ libs/ --include="*.ts"`)
2. **Verify the logic is correct** — RN conditions implemented? Edge cases handled? Full end-to-end flow?
3. **Mark status:**
   - ✅ **Implemented:** Code exists and is correct
   - ⚠️ **Partial:** Implemented but incomplete
   - ❌ **Not implemented:** Completely missing
   - 🔗 **Missing prerequisite:** Dependency does not exist

### Phase 6: Generate Report

**Output: validation-report.md**

```markdown
# Delivery Validation: [Feature]

**Date:** [date] | **Status:** ✅ APPROVED / ❌ BLOCKED

## Summary

| Total | Implemented | Partial | Missing | Prerequisites OK |
|-------|-------------|---------|---------|------------------|
| N | N | N | N | true/false |

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

## Severities & Blocking Rules

| Severity | Meaning | Blocks merge? |
|----------|---------|---------------|
| ✅ Implemented | Requirement 100% met | No |
| ⚠️ Partial | Implemented but incomplete | No — may merge if documented (TODO for non-critical RN) |
| ❌ Missing | RF or critical RN not implemented | **Yes** — feature incomplete / incorrect behavior |
| 🔗 Prerequisite Missing | Dependency does not exist | **Yes** — cannot work without it |

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
