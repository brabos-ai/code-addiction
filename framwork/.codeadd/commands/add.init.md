# ADD Init - Project Onboarding

Collects owner profile in 1 minute (3 direct questions) and optionally creates product blueprint.

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules).

---

## STEPS IN ORDER

```
STEP 1: Check context              → owner.md exists? product.md exists?
STEP 2: 3 Direct questions         → name, level, language
STEP 3: Create docs/product/owner.md → schema owner, id OWNER
STEP 4: Commit owner.md            → automatic
STEP 5: Validation gate (owner)    → run gate block
STEP 6: Ask about product.md       → optional
STEP 7: If yes → product flow      → load skill product-discovery
STEP 8: Validation gate (product)  → run gate block (skip if no product.md)
STEP 9: Onboarding Complete        → suggest /add.new
```

**PROHIBITIONS:**

- NEVER write docs/product/owner.md before checking context (STEP 1)
- NEVER write docs/product/owner.md before all 3 questions are answered (STEP 2)
- NEVER start product flow before owner.md is created and validated (STEP 5)
- NEVER skip the validation gate for any generated doc

---

## STEP 1: Check Context

### 1.1 Check owner.md

Check if `docs/product/owner.md` exists and read it.

**IF EXISTS:**
Show the current profile (name, level, language) and ask: update or keep?
- If keep: skip to STEP 6
- If update: continue to STEP 2

### 1.2 Check product.md

Check if `docs/product/product.md` exists and read it.

Store whether it exists (used in STEP 6).

---

## STEP 2: 3 Direct Questions

Ask the user these three questions (name, technical level, preferred language). Collect all three before proceeding.

**Response mapping:**

| Question | a | b | c |
|----------|---|---|---|
| Level | iniciante | intermediario | avancado |
| Language | pt-br | en-us | [specified] |

---

## STEP 3: Create docs/product/owner.md

EXECUTE schema `owner` from `{{skill:add-doc-schemas/SKILL.md}}`.

**Fixed ID:** `OWNER` (per schema; no next-id lookup).

Write per `owner` schema. Fixed ID: `OWNER`. Extractive only.

---

## STEP 4: Commit owner.md

```bash
git add docs/product/owner.md && git commit -m "docs: create owner profile

Created by /add.init"
```

---

## STEP 5: Validation Gate — owner

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `owner`.

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP 6: Ask About product.md

**IF product.md ALREADY EXISTS:** Skip to STEP 9.

**IF NOT:** Ask if the user wants to create a product blueprint (recommended for new projects).

- If yes: go to STEP 7
- If no: go to STEP 9

---

## STEP 7: Product Flow (OPTIONAL)

### 7.1 Load Skill

```bash
Read skill add-product-discovery
```

### 7.2 Follow Phase2_ProductBlueprint from Skill

- Open question: "What do you want to build?"
- Infer based on market patterns
- Validate with user

### 7.3 Write docs/product/product.md

EXECUTE schema `product` from `{{skill:add-doc-schemas/SKILL.md}}`.

**Fixed ID:** `PRODUCT` (per schema; no next-id lookup).

Write per `product` schema. Fixed ID: `PRODUCT`. Extractive only.

### 7.4 Commit product.md

```bash
git add docs/product/product.md && git commit -m "docs: create product blueprint

Created by /add.init"
```

---

## STEP 8: Validation Gate — product

Run ONLY if product.md was created in STEP 7. Otherwise skip to STEP 9.

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `product`.

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP 9: Onboarding Complete

Summarize what was created (owner.md, and product.md if applicable). Inform the user that communication is now adapted to their level and language. Suggest `/add.new` to create their first feature.

---

## Rules

**ALWAYS:**
- Check existing docs FIRST
- Ask exactly 3 questions (name, level, language)
- Load schemas from add-doc-schemas instead of inlining templates
- Use fixed IDs OWNER and PRODUCT per schema
- Run the validation gate after every generated doc
- Automatic commit after each doc
- Ask about product.md (do not force)
- Suggest /add.new at the end
- Adapt language to owner's choice

**NEVER:**
- Inline doc templates — ALWAYS load from add-doc-schemas
- Use abstractive summarization to fit word caps
- Load skill product-discovery before needed
- Force product.md on legacy projects
- Ask more than 3 questions for profile
- Infer level without asking directly
- Skip automatic commit
- Skip the validation gate
