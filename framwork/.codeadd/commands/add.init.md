# ADD Init - Project Onboarding

Collects owner profile in 1 minute (3 direct questions) and optionally creates product blueprint.

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## STEPS IN ORDER

```
STEP 1: Check context              → owner.md exists? product.md exists?
STEP 2: 3 Direct questions         → name, level, language
STEP 3: Create docs/owner.md       → flat key-value format
STEP 4: Commit owner.md            → automatic
STEP 5: Ask about product.md       → optional
STEP 6: If yes → product flow      → load skill product-discovery
STEP 7: Onboarding Complete        → suggest /add.new
```

**PROHIBITIONS:**

- NEVER write docs/owner.md before checking context (STEP 1)
- NEVER write docs/owner.md before all 3 questions are answered (STEP 2)
- NEVER start product flow before owner.md is created (STEP 3)

---

## STEP 1: Check Context

### 1.1 Check owner.md

Check if docs/owner.md exists and read it.

**IF EXISTS:**
Show the current profile (name, level, language) and ask: update or keep?
- If keep: skip to STEP 5
- If update: continue to STEP 2

### 1.2 Check product.md

Check if docs/product.md exists and read it.

Store whether it exists (used in STEP 5).

---

## STEP 2: 3 Direct Questions

Ask the user these three questions (name, technical level, preferred language). Collect all three before proceeding.

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
Criado por: /add.init
```

**NO markdown headers. NO sections. Pure key-value.**

---

## STEP 4: Commit owner.md

```bash
git add docs/owner.md && git commit -m "docs: create owner profile

- Name: [name]
- Level: [level]
- Language: [language]

Created by /add.init"
```

---

## STEP 5: Ask About product.md

**IF product.md ALREADY EXISTS:** Skip to STEP 7.

**IF NOT:** Ask if the user wants to create a product blueprint (recommended for new projects).

- If yes: go to STEP 6
- If no: go to STEP 7

---

## STEP 6: Product Flow (OPTIONAL)

### 6.1 Load Skill

```bash
Read skill add-product-discovery
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

Created by /add.init"
```

---

## STEP 7: Onboarding Complete

Summarize what was created (owner.md, and product.md if applicable). Inform the user that communication is now adapted to their level and language. Suggest `/add.new` to create their first feature.

---

## Rules

**ALWAYS:**
- Check existing docs FIRST
- Ask exactly 3 questions (name, level, language)
- Use flat key-value format for owner.md (no markdown headers)
- Automatic commit after each doc
- Ask about product.md (do not force)
- Suggest /add.new at the end
- Adapt language to owner's choice

**NEVER:**
- Load skill product-discovery before needed
- Force product.md on legacy projects
- Ask more than 3 questions for profile
- Infer level without asking directly
- Skip automatic commit
