# Copy Generator

> **SKILL:** Load `saas-copy` for frameworks and templates

Generates structured copy for SaaS landing pages based on project analysis.

---

## Spec

```json
{"output":"docs/copy/COPY-<slug>.md","schema":"saas-copy"}
```

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules).

**Fixed ID:** `add.copy` uses the fixed ID `COPY-<slug>` where `<slug>` is derived from the `[objective]` argument (kebab-case). No counter allocation. `related: [PRODUCT]`.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load skill                  → READ saas-copy FIRST
STEP 2: Automatic analysis          → READ README, docs/, package.json
STEP 3: User validation             → ASK pain points, differentials, objections
STEP 4: Generate output             → WRITE docs/copy/COPY-<slug>.md via saas-copy schema
STEP 5: Validation Gate             → saas-copy schema gate
STEP 6: Suggest next step           → INFORM how to use the output
```

**ABSOLUTE PROHIBITIONS:**

```
IF SKILL NOT LOADED:
  ⛔ DO NOT: Write in docs/copy/ or generate copy
  ✅ DO: Load skill first

IF CONTEXT NOT EXTRACTED:
  ⛔ DO NOT: Write in docs/copy/ or validate with user
  ✅ DO: Read project sources first

IF USER NOT VALIDATED:
  ⛔ DO NOT: Write in docs/copy/ or generate files
  ✅ DO: Present inferences and ask
```

---

## Operation Mode

```bash
/add.copy [objective]           # Generate copy for specific objective
/add.copy                       # Ask for objective
```

**Required argument:** `[objective]` in kebab-case (e.g., `product-launch`, `feature-x-promo`)

---

## STEP 1: Load Skill

Read skill `add-saas-copy` files: `SKILL.md`, `formulas.md`, `examples.md`.

**IF NOT LOADED:** Do not proceed to analysis.

---

## STEP 2: Automatic Analysis

Read project sources: README.md, docs/product.md, docs/features/, package.json.

### 3.1 Extract Information

| Field | Source | Fallback |
|-------|--------|----------|
| Product name | package.json > README | Ask |
| Description | README > docs/product.md | Ask |
| Features | features/ > README | Ask |
| Stack | package.json dependencies | Infer |
| Inferred audience | README > docs | Ask |

### 3.2 Present Extracted Context

```markdown
## Extracted Context

**Product:** [extracted name]
**Description:** [extracted description]
**Features:**
- [feature 1]
- [feature 2]
- [feature 3]
**Inferred audience:** [who seems to be the target]
**Stack:** [identified technologies]

Is this correct? Adjust what's needed before continuing.
```

---

## STEP 3: User Validation

**EXECUTE:** Ask targeted questions.

### 4.1 Mandatory Questions

```markdown
## Market Information

I need some information that I can't extract from code:

### 1. Audience pain points
> What hurts your customer BEFORE using your product?
> (E.g., wastes time with spreadsheets, forgets follow-ups, no funnel visibility)

### 2. Real differentials
> Why would they choose YOU and not the competitor?
> (E.g., 5-min setup, no training needed, affordable pricing)

### 3. Common objections
> What prevents people from buying?
> (E.g., "seems complex", "already use Excel", "my team won't adopt it")

### 4. Social proof
> What numbers/results do you have?
> (E.g., X users, Y% satisfaction, Z companies using)
```

### 4.2 Wait for Response

**DO NOT PROCEED** until having answers for at least:
- 3 specific pain points
- 2 differentials
- 2 objections
- Some social proof (or "don't have yet")

---

## STEP 4: Generate Output (schema: saas-copy)

**Schema load (MANDATORY).** EXECUTE schema `saas-copy` from `{{skill:add-doc-schemas/SKILL.md}}`.

**Path:** `docs/copy/COPY-<slug>.md` (slug derived from `[objective]` argument). Fixed ID: `COPY-<slug>`. `related: [PRODUCT]`. Write per schema — extractive only. Pick ONE canonical copy.

---

## STEP 5: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `saas-copy`.

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP 6: Suggest Next Step

Inform the user what was generated (code, folder, files) and suggest reviewing the brief, choosing headlines, using `/add.landing` with the brief, and validating copy with the 4Us table.

**Next Steps:** Reference skill `add-ecosystem` Main Flows section for context-aware next command suggestion.

---

## Usage

`/add.copy product-launch` or `/add.copy black-friday-2025`

---

## Rules

ALWAYS:
- Apply PAS, BAB, and 4Us frameworks to copy
- Generate complete brief.md and copy.md files

NEVER:
- Generate copy without loading saas-copy skill
- Skip automatic project analysis step
- Generate output without user validation
- Use generic or lukewarm copy language
