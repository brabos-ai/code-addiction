<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/commands/add-init.md -->
---
name: add-init
description: Project onboarding - collect founder profile and generate product blueprint
---

# ADD Init - Project Onboarding

Collects owner profile in 1 minute (3 direct questions) and optionally creates product blueprint.

---

## Spec

```json
{"gates":["context_checked","questions_answered","owner_created"],"order":["check_context","ask_3_questions","create_owner","ask_product","optional_product","suggest_next"],"creates":["docs/owner.md","docs/product.md (opt)"]}
```

---

## OWNER Context

**From `OWNER:name|level|language` (status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Check context              → owner.md exists? product.md exists?
STEP 2: 3 Direct questions         → name, level, language
STEP 3: Create docs/owner.md       → flat key-value format
STEP 4: Commit owner.md            → automatic
STEP 5: Ask about product.md       → optional
STEP 6: If yes → product flow      → load skill product-discovery
STEP 7: Onboarding Complete        → suggest /add-feature
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF CONTEXT NOT CHECKED:
  ⛔ DO NOT USE: Write to docs/owner.md
  ⛔ DO NOT: Ask questions before checking existing docs
  ✅ DO: Check docs/owner.md and docs/product.md

IF 3 QUESTIONS NOT ANSWERED:
  ⛔ DO NOT USE: Write to docs/owner.md
  ⛔ DO NOT: Create owner without complete answers
  ✅ DO: Collect name, level and language

IF OWNER NOT CREATED:
  ⛔ DO NOT USE: Write to docs/product.md
  ⛔ DO NOT: Start product flow
  ✅ DO: Create owner.md first
```

---

## STEP 1: Check Context

### 1.1 Check owner.md

```bash
cat docs/owner.md 2>/dev/null
```

**IF EXISTS:**
```markdown
Found an existing profile:
- Name: [extract]
- Level: [extract]
- Language: [extract]

Do you want to update or keep the current one?
```
- If keep: skip to STEP 5
- If update: continue to STEP 2

### 1.2 Check product.md

```bash
cat docs/product.md 2>/dev/null
```

Store whether it exists (used in STEP 5).

---

## STEP 2: 3 Direct Questions

**Question 1 - Name:**
```markdown
What is your name?
```

**Question 2 - Technical level:**
```markdown
What is your technical level?

a) Beginner - I'm just starting out
b) Intermediate - I have some experience
c) Advanced - I'm a professional developer
```

**Question 3 - Preferred language:**
```markdown
What is your preferred language?

a) Portugues (pt-br)
b) English (en-us)
c) Other (specify)
```

**Response mapping:**

| Question | a | b | c |
|----------|---|---|---|
| Level | iniciante | intermediario | avancado |
| Language | pt-br | en-us | [specified] |

---

## STEP 3: Create docs/owner.md

**Flat key-value format (MANDATORY):**

```
Nome: [name]
Nivel: [iniciante|intermediario|avancado]
Idioma: [pt-br|en-us|other]
Data: [YYYY-MM-DD]
Criado por: /add-init
```

**⛔ NO markdown headers. NO sections. Pure key-value.**

---

## STEP 4: Commit owner.md

```bash
git add docs/owner.md && git commit -m "docs: create owner profile

- Name: [name]
- Level: [level]
- Language: [language]

Created by /add-init"
```

---

## STEP 5: Ask About product.md

**IF product.md ALREADY EXISTS:** Skip to STEP 7.

**IF NOT:**
```markdown
Do you want to create a product blueprint? (recommended for new projects)

a) Yes - let's create it
b) No - skip
```

- If yes: go to STEP 6
- If no: go to STEP 7

---

## STEP 6: Product Flow (OPTIONAL)

### 6.1 Load Skill

```bash
cat .codeadd/skills/product-discovery/SKILL.md
```

### 6.2 Follow Phase2_ProductBlueprint from Skill

- Open question: "What do you want to build?"
- Infer based on market patterns
- Validate with user
- Create docs/product.md
- Automatic commit

### 6.3 Commit product.md

```bash
git add docs/product.md && git commit -m "docs: create product blueprint

- Product: [short name]
- MVP Features: [count]

Created by /add-init"
```

---

## STEP 7: Onboarding Complete

```markdown
## Onboarding Complete!

Created:
- `docs/owner.md` - Your communication profile

[IF product.md created:]
- `docs/product.md` - Product blueprint

From now on, I will adapt my communication to your level ([level]) and language ([language]).

---

### Next Step

**`/add-feature`** → Create your first feature

Which feature do you want to start with?
```

---

## Rules

```json
{"do":["Check existing docs FIRST","Ask exactly 3 questions (name, level, language)","Use flat key-value format for owner.md","Automatic commit after each doc","Ask about product.md (do not force)","Suggest /add-feature at the end","Adapt language to owner's choice"],"dont":["Load skill product-discovery before needed","Force product.md on legacy projects","Ask more than 3 questions for profile","Use markdown headers in owner.md","Infer level (ask directly)","Skip automatic commit"]}
```
