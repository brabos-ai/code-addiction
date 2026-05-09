---
name: add-feature-specification
description: Use when documenting feature requirements - creates/updates about.md with business rules, acceptance criteria, scope and decisions using Business Style
---

# Feature Specification

Skill for documenting feature specifications. Creates/updates `about.md` with requirements, business rules, scope and decisions.

**Principle:** Document WHAT and WHY, not HOW.

---

## Spec

{"trigger":"document feature requirements","output":"docs/features/[ID]/about.md","schema":"add-doc-schemas/references/new-feature.md","focus":"business rules, scope, decisions","required":["token-efficiency","add-doc-schemas"]}

---

## When to Use

- New feature → create `about.md` via questionnaire
- `about.md` exists but incomplete → fill missing sections
- Requirements changed → update affected sections
- Scope expanded → add new requirements, update scope

### When NOT to Use

- For technical analysis (use `add-feature-discovery` instead)

---

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

---

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

---

### 2. Business Rules

**2.1 Validations:**
→ **[INFERRED]:** [list]

**2.2 Limits/quotas:**
- a) No limits
- b) Per user
- c) Per workspace/plan
→ **[LIKELY: a]**

---

### 3. Scope

**3.1 Included:**
→ **[INFERRED]:** [list]

**3.2 Excluded:**
→ **[INFERRED]:** [list]

---

✅ Reply "Ok" or list corrections.
```

### Phase 3: Structure Documentation

**Template about.md (Business Style):**

```markdown
# Feature: [Name]

## Summary
{"status":"discovery|planning|dev|review|done","scope":["item1","item2"],"decisions":["key decision"],"blockers":[],"next":"next action"}

---

## Goal

**Problem:** [description of the current problem]
**Solution:** [how the feature solves it]
**Value:** [measurable benefit]

---

## Requirements

### Functional
- **[RF01]:** [description ~15 words]
- **[RF02]:** [description ~15 words]

### Non-Functional
- **[RNF01]:** [performance/security/etc]

---

## Business Rules

- **[RN01]:** [condition] → [result]
- **[RN02]:** [condition] → [result]

---

## Scope

### Required Layers (based on questionnaire)

| Validated with User | Layer | Included? |
|---------------------|-------|-----------|
| [questionnaire item] | Frontend/Backend/DB | ✅ |

**⚠️ If a layer is required for the user to USE the feature → MANDATORY.**

### Included
- [Item that IS part of scope]

### Excluded (ONLY if it does not impact usability)
- [Item NOT part of scope] — [reason] — **Impacts use?** No

**Rule:** MUST NOT exclude a layer that makes the feature unusable.

---

## Decisions

| Decision | Reason | Rejected alternative |
|----------|--------|---------------------|
| [Choice A] | [Why A] | [B — why not] |

---

## Edge Cases

- **[Case]:** [defined handling]

---

## Acceptance Criteria

- [ ] [Verifiable and testable criterion]
- [ ] [Verifiable and testable criterion]

---

## Spec

{"feature":"[id]","type":"[new/enhancement/fix]","priority":"[high/medium/low]","users":["type1"],"deps":["feature/system"]}

---

## Updates
[{"date":"YYYY-MM-DD","change":"short description of change"}]

---

## Metadata
{"updated":"YYYY-MM-DD","sessions":N,"by":"[subagent]"}
```

**IMPORTANT:** Always update `## Summary` and `## Updates` when there are changes.

### Phase 4: Validate and Persist

**Checklist before saving:**
- [ ] Requirements have IDs (RF/RNF/RN)
- [ ] Scope has both included AND excluded
- [ ] Decisions include rejected alternatives
- [ ] Criteria are verifiable
- [ ] Metadata updated

---

## Requirement Notation

### Functional (RF)
```
- **[RF01]:** [Action] [object] [condition] (~15-20 words)
```

**Examples:**
```
- **RF01:** User can mark notification as read with one click
- **RF02:** System groups notifications of the same type within 24h
```

### Non-Functional (RNF)
```
- **[RNF01]:** [Metric] [value] [context]
```

**Examples:**
```
- **RNF01:** List loads in under 200ms for up to 100 items
- **RNF02:** Supports 1000 requests/minute per tenant
```

### Business Rules (RN)
```
- **[RN01]:** [condition] → [result]
```

**Examples:**
```
- **RN01:** Notification unread after 30 days → auto-archive
- **RN02:** User on Free plan → maximum 50 notifications stored
```

---

## Rules

**Do:**
- Use IDs for all requirements
- Include rejected alternatives in decisions
- Define handling for each edge case
- Verifiable and testable criteria
- Update metadata
- Fill in Required Layers
- Validate that scope allows USING the feature

**Don't:**
- Mix what with how (technical goes in discovery)
- Vague requirements ("system must be fast")
- Decisions without justification
- Edge cases without defined handling
- Exclude a layer that makes the feature unusable
- Exclude frontend if questionnaire validated UI

---

## ADD Integration

When ADD dispatches a subagent for specification:

```markdown
**Skills:**
```bash
cat {{skill:add-feature-specification/SKILL.md}}
cat {{skill:add-doc-schemas/business.md}}
```

**Context:**
- Feature: [ID]
- Initial description: [from user]

**Instructions:**
1. Check existing about.md
2. If empty → strategic questionnaire
3. If incomplete → complete sections
4. Update metadata
```

---

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
- [ ] Metadata updated?
