---
name: add-feature-specification
description: Document feature requirements - creates/updates about.md with business rules, scope, decisions
---

# Feature Specification

Skill for documenting feature specifications. Creates/updates `about.md` with requirements, business rules, scope and decisions.

**Principle:** Document WHAT and WHY, not HOW.

## When to Use

- New feature → create `about.md` via questionnaire
- `about.md` exists but incomplete → fill missing sections
- Requirements changed → update affected sections
- Scope expanded → add new requirements, update scope

### When NOT to Use

- For technical analysis (use `add-feature-discovery` instead)
- For technical implementation planning (use `add-planning` instead)
- For product blueprint / founder discovery (use `add-product-discovery` instead)
- For code-level architecture decisions (belongs in discovery/plan, not about.md)

## Workflow

**REQUIRED:** Apply before writing:
- `token-efficiency` — minified JSON, tables, no decoration
- `documentation-style/cache` — Read → Preserve → Complement → Metadata

### Phase 1: Check State (Documental Cache)

```bash
cat docs/features/[FEATURE_ID]/about.md
```

| State | Action |
|---|---|
| Does not exist / empty | Phase 2 (questionnaire) |
| Partially filled | Phase 3 (complete) |
| Complete | Check if update needed |

### Phase 2: Strategic Questionnaire

**Goal:** Extract requirements via structured questions.

**Technique:** Infer answers + validate quickly.

```markdown
## Quick Validation - [Feature]

I analyzed the context and inferred the answers below.
**Reply "Ok" if correct, or just the corrections.**

### 1. Scope & Goal

**1.1 Main goal:**
→ **[INFERRED]:** [description based on context]

**1.2 Users:**
- a) Authenticated end users
- b) Administrators
- c) External systems (API)
→ **[LIKELY: ?]**

**1.3 Problem solved:**
→ **[INFERRED]:** [description]

### 2. Business Rules

**2.1 Validations:**
→ **[INFERRED]:** [list]

**2.2 Limits/quotas:**
- a) No limits
- b) Per user
- c) Per workspace/plan
→ **[LIKELY: a]**

### 3. Scope

**3.1 Included:**
→ **[INFERRED]:** [list]

**3.2 Excluded:**
→ **[INFERRED]:** [list]

✅ Reply "Ok" or list corrections.
```

### Phase 3: Structure Documentation

**Template about.md (Business Style — WHAT/WHY only, no HOW):**

```markdown
# Feature: [Name]

## Summary
{"status":"discovery|planning|dev|review|done","scope":["item1","item2"],"decisions":["key decision"],"blockers":[],"next":"next action"}

## Goal

**Problem:** [description of the current problem]
**Solution:** [how the feature solves it]
**Value:** [measurable benefit]

## Requirements

<!-- IDs required (RF/RNF). Format: [Action] [object] [condition] (~15-20 words). No vague terms ("fast", "easy"). -->

### Functional
- **RF01:** User can mark notification as read with one click
- **RF02:** System groups notifications of the same type within 24h

### Non-Functional
<!-- Format: [Metric] [value] [context] -->
- **RNF01:** List loads in under 200ms for up to 100 items
- **RNF02:** Supports 1000 requests/minute per tenant

## Business Rules

<!-- Format: [condition] → [result] -->
- **RN01:** Notification unread after 30 days → auto-archive
- **RN02:** User on Free plan → maximum 50 notifications stored

## Scope

### Required Layers (based on questionnaire)

| Validated with User | Layer | Included? |
|---------------------|-------|-----------|
| [questionnaire item] | Frontend/Backend/DB | ✅ |

**⚠️ CRITICAL: If a layer is required for the user to USE the feature → MANDATORY. MUST NOT exclude a layer that makes the feature unusable (e.g., do not exclude frontend if questionnaire validated UI).**

### Included
- [Item that IS part of scope]

### Excluded (ONLY if it does not impact usability)
- [Item NOT part of scope] — [reason] — **Impacts use?** No

## Decisions

<!-- Always include rejected alternative + reason. No decisions without justification. -->

| Decision | Reason | Rejected alternative |
|----------|--------|---------------------|
| [Choice A] | [Why A] | [B — why not] |

## Edge Cases

<!-- Each case MUST have defined handling. -->
- **[Case]:** [defined handling]

## Acceptance Criteria

<!-- Verifiable and testable. -->
- [ ] [Verifiable and testable criterion]
- [ ] [Verifiable and testable criterion]

## Spec

{"feature":"[id]","type":"[new/enhancement/fix]","priority":"[high/medium/low]","users":["type1"],"deps":["feature/system"]}

## Updates
[{"date":"YYYY-MM-DD","change":"short description of change"}]

## Metadata
{"updated":"YYYY-MM-DD","sessions":N,"by":"[subagent]"}
```

**IMPORTANT:** Always update `## Summary` and `## Updates` when there are changes.

### Phase 4: Validate and Persist

See Checklist below before saving.

## Checklist

- [ ] Problem clearly defined?
- [ ] Requirements with IDs (RF/RNF)?
- [ ] Business rules with IDs (RN)?
- [ ] **Required Layers filled in?** (CRITICAL)
- [ ] **No required layer was excluded?** (CRITICAL)
- [ ] Scope: included AND excluded?
- [ ] Decisions with rejected alternatives?
- [ ] Edge cases with handling?
- [ ] Verifiable criteria?
- [ ] Spec JSON at the end?
- [ ] Summary + Updates + Metadata updated?
- [ ] No mixing of WHAT with HOW (technical → discovery)?
