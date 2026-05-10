# ADD Init - Project Onboarding

Collects owner profile in 1 minute (3 direct questions) and optionally creates product blueprint.

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).

---

## STEP 1: Load Skills & Check Context

### 1.1 Load Skills (once per invocation)

Load before proceeding:
- `{{skill:add-doc-schemas/SKILL.md}}` (schemas, IDs, universal rules, validation gate)
- `{{skill:add-product-discovery/SKILL.md}}` (conditional; load if product flow needed)

### 1.2 Check owner.md

Check if `docs/product/owner.md` exists and read it.

**IF EXISTS:**
Show the current profile (name, level, language) and ask: update or keep?
- If keep: store decision `owner_update=no` and skip to STEP 6
- If update: store decision `owner_update=yes` and continue to STEP 2

### 1.3 Check product.md

Check if `docs/product/product.md` exists and read it.

Store whether it exists (used in STEP 6).

---

## STEP 2: 3 Direct Questions (only if owner_update=yes or owner.md not found)

**IF owner_update=no:** skip to STEP 6.

Ask these three questions. Collect all three before proceeding.

**Questions:**
1. Name?
2. Technical level? (beginner / intermediate / advanced)
3. Preferred language? (pt-br / en-us / [specified])

---

## STEP 3: Create docs/product/owner.md

**Execution rule for all doc writes (STEP 3, STEP 7.3):**

1. Execute schema `owner` from `{{skill:add-doc-schemas/SKILL.md}}` (Section "Schema Index by Category" → product category)
2. Fixed ID: `OWNER` (per schema; no next-id lookup)
3. Extractive only — no narrative bio or personal opinions
4. Populate: name, level, language from answers above
5. Write with frontmatter: `id: OWNER`, `type: owner`, `created: <today>`, `updated: <today>`, `related: [PRODUCT]`

---

## STEP 4: Commit owner.md

```bash
git add docs/product/owner.md && git commit -m "docs: create owner profile

Created by /add.init"
```

---

## STEP 5: Validation Gate — owner

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `owner`:

1. Frontmatter presence (id, type, created, updated, related)
2. TL;DR complete (what, why, headline)
3. TOC rule (if >3 H2 sections)
4. Depth floors met (per schema: Founder, Skills, Constraints, Goals)
5. Non-redundancy and density
6. Doc refs resolve
7. Hard bans absent
8. Metadata footer (updated: matches today)

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP 6: Ask About product.md

**IF product.md ALREADY EXISTS:** Skip to STEP 9.

**IF NOT:** Ask if the user wants to create a product blueprint (recommended for new projects).

- If yes and user answers: go to STEP 7
- If no: go to STEP 9
- If already answered before: skip this step (idempotency)

---

## STEP 7: Product Flow (OPTIONAL)

**Prerequisite:** Only execute if user approved product creation in STEP 6.

### 7.1 Discover Product via add-product-discovery

Follow the skill's Phase 1 (founder, already done via owner.md) and Phase 2 (product blueprint):

- Open question: "What do you want to build?"
- Evaluate response depth (shallow → follow-ups; medium/rich → proceed)
- Infer based on market patterns (per skill: scheduling, ecommerce, saas-b2b, marketplace, etc.)
- Validate inferences with user until approved

### 7.2 Write docs/product/product.md

Execute schema `product` from `{{skill:add-doc-schemas/SKILL.md}}`:

1. Fixed ID: `PRODUCT` (per schema; no next-id lookup)
2. Extractive only — no marketing fluff or unverified claims
3. Populate: Vision, ICP, Core Value, Differentiators, Business Model from user answers + inferences
4. Write with frontmatter: `id: PRODUCT`, `type: product`, `created: <today>`, `updated: <today>`, `related: [OWNER]`

### 7.3 Commit product.md

```bash
git add docs/product/product.md && git commit -m "docs: create product blueprint

Created by /add.init"
```

---

## STEP 8: Validation Gate — product

Run ONLY if product.md was created in STEP 7. Otherwise skip to STEP 9.

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `product`:

1. Frontmatter presence (id, type, created, updated, related)
2. TL;DR complete (what, why, headline)
3. TOC rule (if >3 H2 sections)
4. Depth floors met (per schema: Vision, ICP, Core Value, Differentiators, Business Model)
5. Non-redundancy and density
6. Doc refs resolve
7. Hard bans absent
8. Metadata footer (updated: matches today)

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP 9: Onboarding Complete

Summarize what was created:
- owner.md ✓ (always)
- product.md ✓ (if approved in STEP 6)

Inform the user that communication is now adapted to their level and language (per owner.md settings). Suggest `/add.new` to create their first feature.

---

## Execution Rules

**Idempotency (re-invocation safety):**
- STEP 1.2: If owner.md exists, ask "update or keep?" and store decision (`owner_update=yes|no`)
- STEP 2: Skip if `owner_update=no`
- STEP 6: If already answered before, skip re-asking (check for prior decision)
- STEP 7: Only execute if user approved product creation; skip if product.md already exists

**Skill loading (STEP 1.1):**
- Load `add-doc-schemas` immediately (always needed)
- Load `add-product-discovery` conditionally (only if STEP 7 will execute)

**Doc writing (STEP 3, STEP 7.2):**
- Never inline templates — always reference `add-doc-schemas` schema
- Extractive only (no narrative, no abstraction, no marketing copy)
- Fixed IDs per schema: OWNER and PRODUCT (no next-id lookup)
- Frontmatter always includes: id, type, created, updated, related

**Validation (STEP 5, STEP 8):**
- Non-negotiable: every doc must pass the gate before command completes
- Gate checks: frontmatter, TL;DR, TOC rule, depth floors, density, refs, hard bans, metadata
- Warnings (orphan refs) are logged but do not block PASS

**Prohibitions:**
- NEVER write owner.md before STEP 1.2 checks what exists
- NEVER write owner.md before all 3 questions answered (STEP 2)
- NEVER start product flow before owner.md is validated (STEP 5)
- NEVER force product.md creation — ask and honor the user's answer
- NEVER ask more than 3 profile questions
- NEVER inline schema templates instead of loading from add-doc-schemas
- NEVER skip validation gates
- NEVER skip automatic commits
