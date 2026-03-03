# Copy Generator

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Documents in user's language.
> **SKILL:** Load `saas-copy` for frameworks and templates

Generates structured copy for SaaS landing pages based on project analysis.

---

## Spec

```json
{"gates":["skill_loaded","context_extracted","user_validated"],"workflow":["detect_number","analyze","validate","generate"],"output":"docs/copy/CXXXX-[objective]/","files":["brief.md","copy.md"]}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load skill                  → READ saas-copy FIRST
STEP 2: Detect number               → LIST existing docs/copy/C*/
STEP 3: Automatic analysis          → READ README, docs/, package.json
STEP 4: User validation             → ASK pain points, differentials, objections
STEP 5: Generate output             → WRITE brief.md + copy.md
STEP 6: Suggest next step           → INFORM how to use the output
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF SKILL NOT LOADED:
  ⛔ DO NOT USE: Write in docs/copy/
  ⛔ DO NOT: Generate copy
  ✅ DO: cat .add/skills/saas-copy/SKILL.md

IF CONTEXT NOT EXTRACTED:
  ⛔ DO NOT USE: Write in docs/copy/
  ⛔ DO NOT: Validate with user
  ✅ DO: Read README.md, docs/, package.json

IF USER NOT VALIDATED:
  ⛔ DO NOT USE: Write in docs/copy/
  ⛔ DO NOT: Generate files
  ✅ DO: Present inferences and ask
```

---

## Operation Mode

```bash
/add-copy [objective]           # Generate copy for specific objective
/add-copy                       # Ask for objective
```

**Required argument:** `[objective]` in kebab-case (e.g., `product-launch`, `feature-x-promo`)

---

## STEP 1: Load Skill

**EXECUTE:**

```bash
cat .add/skills/saas-copy/SKILL.md
cat .add/skills/saas-copy/formulas.md
cat .add/skills/saas-copy/examples.md
```

**⛔ IF NOT LOADED:** Do not proceed to analysis.

---

## STEP 2: Detect Next Number

**EXECUTE:**

```bash
ls docs/copy/ 2>/dev/null | grep "^C[0-9]" | sort -r | head -1
```

**Logic:**
- If `docs/copy/` doesn't exist: create with C0001
- If C0003 exists as last: use C0004
- Always increment +1

**Expected output:**

```markdown
**Next number:** C[XXXX]
**Output folder:** docs/copy/C[XXXX]-[objective]/
```

---

## STEP 3: Automatic Analysis

**EXECUTE:** Read project sources.

### 3.1 Sources (in priority order)

```bash
# 1. README
cat README.md

# 2. Product docs (if exists)
cat docs/product.md 2>/dev/null

# 3. Features (if exists)
ls docs/features/ 2>/dev/null

# 4. Package.json
cat package.json | jq '{name, description, keywords}'
```

### 3.2 Extract Information

| Field | Source | Fallback |
|-------|--------|----------|
| Product name | package.json > README | Ask |
| Description | README > docs/product.md | Ask |
| Features | features/ > README | Ask |
| Stack | package.json dependencies | Infer |
| Inferred audience | README > docs | Ask |

### 3.3 Present Extracted Context

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

## STEP 4: User Validation

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

**⛔ DO NOT PROCEED** until having answers for at least:
- 3 specific pain points
- 2 differentials
- 2 objections
- Some social proof (or "don't have yet")

---

## STEP 5: Generate Output

**EXECUTE:** Create files in `docs/copy/C[XXXX]-[objective]/`

### 5.1 Create brief.md

```markdown
# Copy Brief - [Product Name]

> **Objective:** [objective informed by user]
> **Generated on:** [date]
> **Code:** C[XXXX]

---

## Value Proposition

[1 sentence that summarizes what's uniquely delivered - extracted + validated]

---

## Target Audience

- **Buyer:** [who decides the purchase]
- **User:** [who uses day-to-day]
- **Company:** [size, segment]

---

## Pain Points (Before)

1. **[Pain 1]** → [consequence]
2. **[Pain 2]** → [consequence]
3. **[Pain 3]** → [consequence]

---

## Benefits (After)

1. [Transformation 1 - not a feature]
2. [Transformation 2 - not a feature]
3. [Transformation 3 - not a feature]

---

## Differentials

| vs | Our differential |
|----|------------------|
| [Competitor 1] | [what we have that they don't] |
| [Competitor 2] | [what we have that they don't] |
| "Do nothing" | [cost of not solving] |

---

## Mapped Objections

| Objection | Response |
|-----------|----------|
| "[objection 1]" | [response that removes friction] |
| "[objection 2]" | [response that removes friction] |

---

## Social Proof

- **Stats:** [real numbers]
- **Clients:** [logos or names]
- **Results:** [success case]
```

### 5.2 Create copy.md

```markdown
# Suggested Copy - [Product Name]

> **Brief:** [link to brief.md]
> **Code:** C[XXXX]

---

## Headlines

### Option 1 (PAS - Problem Agitate Solution)
> "[Main pain] is costing [consequence]. [Product] solves in [time/way]."

### Option 2 (BAB - Before After Bridge)
> "From [before situation] to [after situation]. [Product] is the bridge."

### Option 3 (Direct)
> "[Main benefit] without [main objection]."

---

## Subtitles

1. "[Product] helps [audience] to [benefit] using [unique method]."

2. "[Benefit 1], [benefit 2], and [benefit 3] — all in one place."

3. "No [objection 1]. No [objection 2]. Just [result]."

---

## CTAs

| Type | Option A | Option B |
|------|----------|----------|
| **Primary** | "Start free" | "Try for 14 days" |
| **Secondary** | "See how it works" | "Talk to sales" |

---

## Formatted Stats

- **[Number]+** [metric] (e.g., "500+ companies")
- **[Percentage]%** [result] (e.g., "99.9% uptime")
- **[Time]** [action] (e.g., "5-min setup")

---

## Testimonial Framework

> "[Specific result with number] after using [Product]. [Emotional benefit that brought]."
> — **[Name]**, [Title] at [Company]

---

## Feature → Benefit → Outcome

| Feature | Benefit | Outcome |
|---------|---------|---------|
| [Technical feature 1] | [What it means] | [Result in life] |
| [Technical feature 2] | [What it means] | [Result in life] |
| [Technical feature 3] | [What it means] | [Result in life] |

---

## 4Us Validation

| Headline | Urgent | Unique | Ultra-specific | Useful |
|----------|--------|--------|----------------|--------|
| Option 1 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Option 2 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Option 3 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
```

---

## STEP 6: Suggest Next Step

**EXECUTE:** Inform result and next steps.

```markdown
## ✅ Copy Generated!

**Code:** C[XXXX]
**Folder:** docs/copy/C[XXXX]-[objective]/

### Files created:
- `brief.md` - Structured copy brief
- `copy.md` - Headlines, CTAs, stats, testimonials

### Next steps:

1. **Review the brief** - Adjust information if needed

2. **Choose headlines** - Select options that resonate most

3. **Create landing page** - Use the brief with `/add-landing`:
   ```
   /add-landing

   Product: [value proposition from brief]
   Audience: [target audience from brief]
   Aesthetic: [Minimal | Tech | Enterprise | Bold]
   ```

4. **Validate copy** - Use the 4Us table to ensure sharp headlines
```

---

## Usage Examples

```bash
# Generate copy for product launch
/add-copy product-launch

# Generate copy for feature promotion
/add-copy feature-api-promo

# Generate copy for campaign
/add-copy black-friday-2025
```

---

## Rules

ALWAYS:
- Load saas-copy skill before any other action
- Detect next sequential number from existing docs
- Extract context automatically before asking user
- Validate inferences with user before generating output
- Apply PAS, BAB, and 4Us frameworks to copy
- Generate complete brief.md and copy.md files

NEVER:
- Generate copy without loading saas-copy skill
- Skip automatic project analysis step
- Generate output without user validation
- Use generic or lukewarm copy language
- Omit next step suggestions after generation
