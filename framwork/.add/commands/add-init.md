# ADD Init - Project Onboarding

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Documents in user's language.
> **MODEL:** Use `haiku` model

Collects founder profile and product blueprint in 5-10 minutes, creating initial documentation for personalized communication. Applies product-discovery throughout the entire flow.

---

## Spec

```json
{"gates":["skill_loaded","phase1_complete"],"order":["load_skill","phase1_founder","commit_owner","phase2_product","commit_product","suggest_next"],"creates":["docs/owner.md","docs/product.md"]}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load skill product-discovery      → FIRST
STEP 2: Check existing docs               → Ask whether to update
STEP 3: Phase1 - Founder Profile           → 3 questions → docs/owner.md
STEP 4: Commit owner.md                    → Automatic
STEP 5: Phase2 - Product Blueprint         → Open question + inference → docs/product.md
STEP 6: Commit product.md                  → Automatic
STEP 7: Suggest next step                  → /add-feature
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF SKILL product-discovery NOT LOADED:
  ⛔ DO NOT USE: Write to docs/owner.md
  ⛔ DO NOT USE: Write to docs/product.md
  ⛔ DO NOT: Run questionnaire questions
  ✅ DO: Load .add/skills/product-discovery/SKILL.md

IF PHASE1 NOT COMPLETE (docs/owner.md not created):
  ⛔ DO NOT USE: Write to docs/product.md
  ⛔ DO NOT: Start Phase2
  ⛔ DO NOT: Ask about product
  ✅ DO: Complete Phase1 first

IF USER HAS NOT VALIDATED INFERENCE:
  ⛔ DO NOT USE: Write to docs/product.md
  ⛔ DO NOT: Commit product.md
  ✅ DO: Present inference and iterate until approval
```

---

## STEP 1: Load Skill (MANDATORY)

**RUN FIRST:**

```bash
cat .add/skills/product-discovery/SKILL.md
```

**Extract from skill:**
- Phase1_FounderProfile questions
- Technical level inference rules
- Phase2_ProductBlueprint structure
- Market patterns for inference
- Documentation format

---

## STEP 2: Check Existing Docs

### 2.1 Check owner.md

```bash
cat docs/owner.md 2>/dev/null
```

**IF EXISTS:**
```markdown
Found an existing founder profile:
- Name: [extract]
- Level: [extract]

Do you want to update or keep the current one?
```

### 2.2 Check product.md

```bash
cat docs/product.md 2>/dev/null
```

**IF EXISTS:**
```markdown
Found an existing product blueprint:
- Product: [extract]
- MVP Features: [extract count]

Do you want to update or keep the current one?
```

---

## STEP 3: Phase1 - Founder Profile (2-3 min)

**FOLLOW skill product-discovery Phase1_FounderProfile.**

### 3.1 Ask 3 Questions

**Question 1 - Experience:**
```markdown
What is your experience with software development?

a) None - I'm a complete beginner
b) Basic - I understand concepts but don't code
c) Intermediate - I code or have coded before
d) Advanced - I'm a professional developer
```

**Question 2 - Explanation Preference:**
```markdown
How do you prefer I explain things?

a) Simplified - no technical terms, everyday analogies
b) Balanced - technical terms when needed, with explanation
c) Technical - you can use jargon, I understand the language
```

**Question 3 - Role in Project:**
```markdown
What will be your main role in this project?

a) Ideator - I have the idea, others will implement
b) Manager - I will coordinate development
c) Developer - I will code alongside
d) Solo - I will do everything myself
```

### 3.2 Infer Technical Level

**Use skill rules:**
- `beginner`: Q1=a AND Q3=a,b
- `basic`: Q1=b AND Q3=a,b
- `intermediate`: Q1=c AND Q3=a,b
- `technical`: Q1=d OR Q3=c,d

### 3.3 Create docs/owner.md

**Load documentation-style:**
```bash
cat .add/skills/documentation-style/SKILL.md
```

**Structure:**
```markdown
# Founder Profile

## Identification
- **Name:** [ask if unknown]
- **Role:** [Q3]

## Technical Level
- **Classification:** [inferred]
- **Base:** [Q1]

## Communication Preferences
- **Style:** [Q2]
- **Detail Level:** [simplified|balanced|technical]

## Context
- **Date:** [YYYY-MM-DD]
- **Created by:** /add-init
```

---

## STEP 4: Commit owner.md

**RUN IMMEDIATELY after creating owner.md:**

```bash
git add docs/owner.md && git commit -m "docs: create founder profile

- Technical level: [level]
- Communication style: [style]
- Role: [role]

Created by /add-init"
```

---

## STEP 5: Phase2 - Product Blueprint (5-10 min)

**FOLLOW skill product-discovery Phase2_ProductBlueprint.**

### 5.1 Open Question

```markdown
Now let's talk about your product.

**What do you want to build?**

(Feel free to describe in detail - the more details, the better the inference)
```

### 5.2 Assess Depth

| Depth | Criteria | Action |
|-------|----------|--------|
| Shallow | < 20 words | Ask 3 follow-up questions |
| Medium | 20-100 words | Targeted questions |
| Rich | > 100 words | Go to inference |

**If shallow, ask:**
1. Who will use it? (target audience)
2. What problem does it solve?
3. What differentiates it from competitors?

### 5.3 Infer Using Market Patterns

**Consult skill for patterns:**
- scheduling → 2 users, calendar
- ecommerce → 2 users, payments
- saas-b2b → multi-tenant, 3 users
- marketplace → 3 users, payments
- internal-management → 1-2 users
- courses → 2-3 users, payments
- delivery → 3 users, geolocation

**Infer EVERYTHING:**
- Product description
- Target audience
- Problem it solves
- MVP Features (max 6)
- Cut features (for later)
- User types
- Required integrations
- Roadmap phases

### 5.4 Validate with User

```markdown
## Blueprint Validation

Based on what you described, I inferred:

**Product:** [1-line description]

**For whom:** [target audience]

**Problem:** [pain point it solves]

**MVP Features:**
1. [feature 1]
2. [feature 2]
3. [feature 3]
4. [feature 4]

**Cut (for later):**
- [cut feature 1]
- [cut feature 2]

**User Types:**
- [user type 1]: [what they do]
- [user type 2]: [what they do]

**Integrations:**
- [integration 1]: [purpose]

**Roadmap:**
- Phase 1: [core]
- Phase 2: [essential]
- Phase 3: [nice-to-have]

---

Is this correct? Do you want to adjust anything?
```

**⛔ DO NOT PROCEED without user approval.**

### 5.5 Create docs/product.md

**Structure:**
```markdown
# Product Blueprint

## What It Is
[validated description]

## For Whom
[target audience]

## Problem It Solves
[main pain point]

## MVP Features
1. [feature 1]
2. [feature 2]
3. [feature 3]
4. [feature 4]

## Cut Features (Post-MVP)
- [cut feature 1]
- [cut feature 2]

## User Types
| Type | Description | Permissions |
|------|-------------|------------|
| [type 1] | [desc] | [permissions] |
| [type 2] | [desc] | [permissions] |

## Integrations
| Service | Purpose | Priority |
|---------|---------|----------|
| [service] | [purpose] | MVP/Post-MVP |

## Roadmap
### Phase 1: Core
- [item 1]

### Phase 2: Essential
- [item 2]

### Phase 3: Nice-to-have
- [item 3]

---

**Created by:** /add-init
**Date:** [YYYY-MM-DD]
```

---

## STEP 6: Commit product.md

**RUN IMMEDIATELY after creating product.md:**

```bash
git add docs/product.md && git commit -m "docs: create product blueprint for MVP

- Product: [short name]
- MVP Features: [count]
- User Types: [count]
- Target: [summarized audience]

Created by /add-init"
```

---

## STEP 7: Suggest Next Step

```markdown
## Onboarding Complete!

Created:
- `docs/owner.md` - Your communication profile
- `docs/product.md` - Product blueprint

From now on, I will adapt my communication to your level ([level]) and style ([style]).

---

### Next Step

Now that we have the blueprint, you can:

**`/add-feature`** → Create the first MVP feature

Which feature from the roadmap do you want to start with?
```

---

## Rules

ALWAYS:
- Load skill FIRST before any action
- Ask 3 questions in Phase1
- Use open question in Phase2
- Infer based on market patterns
- Validate BEFORE documenting
- Commit automatically after each doc
- Suggest /add-feature at the end
- Adapt language to user's level

NEVER:
- Skip skill loading step
- Ask more than 3 questions in Phase1
- Include more than 6 features in MVP
- Document without user validation
- Use technical jargon with beginners
- Forget automatic commits
- Ask about stack or architecture
