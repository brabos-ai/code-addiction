---
name: add-product-discovery
description: Use when starting new project - discovers founder profile and product blueprint through guided questionnaire, creates docs/owner.md and docs/product.md
---

# Product Discovery

Runs a quick founder + product discovery in 5–10 minutes, creating a communication profile and a development blueprint.

**Principle:** Speed over completeness. Infer based on market patterns. Simplify for MVP. Don't overload.

---

## When to Use

- Starting a new project
- First-time setup
- Need a founder profile
- Need a product blueprint
- `docs/owner.md` does not exist
- `docs/product.md` does not exist

---

## Phase 1: Founder Profile

**Goal:** Identify technical level + communication preferences.
**Duration:** 2–3 min.
**Output:** `docs/owner.md`.

**Questions:**
1. Development experience (4 options)
2. Explanation preference (3 styles)
3. Role in the project (4 options)

### Technical Level Inference

- IF `Q1 = a` AND `Q3 ∈ {a, b}` → **leigo** (non-technical)
- IF `Q1 = b` AND `Q3 ∈ {a, b}` → **basic**
- IF `Q1 = c` AND `Q3 ∈ {a, b}` → **intermediate**
- IF `Q1 = d` OR `Q3 = c` → **technical**

### Communication Style Inference

- IF `Q2 = a` → **simplified**
- IF `Q2 = b` → **balanced**
- IF `Q2 = c` → **technical**

---

## Phase 2: Product Blueprint

**Goal:** Understand the product idea and create an MVP blueprint.
**Duration:** 5–10 min.
**Output:** `docs/product.md`.

**Opening:** single open question — "what do you want to build?"

### Depth Evaluation

| Response depth | Action |
|----------------|--------|
| Shallow (<20 words) | Ask 3 follow-up questions |
| Medium (20–100 words) | Proceed with targeted questions |
| Rich (100+ words) | Proceed to inference |

### Inference Based On
- Market patterns (how 80% of similar products work)
- MVP mentality (minimum to validate)
- User context (what they emphasized)
- Common sense (first-time user expectations)

### Infer
- Product description
- Target audience
- Main problem solved
- MVP features (4–6 max)
- Cut features (for later)
- User types (admin/client/team)
- Integrations needed (Stripe/Calendar/WhatsApp)
- Roadmap phases (core/essential/nice-to-have)

**Validate:** show inference, iterate until user approves.

---

## Market Patterns

{"scheduling":"2 users (admin+client), calendar integration","ecommerce":"2 users (admin+client), payments mandatory","saas-b2b":"multi-tenant, 3 users (owner,admin,member)","marketplace":"3 users (admin,seller,buyer), payments","internal-management":"1-2 users (admin,team?), no integration","courses":"2-3 users (admin,instructor?,student), payments","delivery":"3 users (admin,courier,client), geolocation"}

---

## Documentation Format

{"pre-checkpoint":"load {{skill:add-doc-schemas/SKILL.md}}","format":"hybrid (human-readable + token-efficient)","sections":{"owner.md":["identification","technical level","communication preferences","project context"],"product.md":["what it is","for whom","problem solved","MVP features","cut features","user types","integrations","roadmap phases"]}}

---

## Commit

{"owner":"git commit -m 'docs: create founder profile...'","product":"git commit -m 'docs: create product blueprint for MVP...'"}

---

## Next Steps

Suggest `/brainstorm` or `/feature` for the first roadmap item.

---

## Critical Rules

**Do:**
- Be QUICK (5–10 min total)
- INFER from market patterns
- ASK for more details if response is shallow (<20 words)
- Simplify for MVP (max 6 features)
- Validate before documenting
- Use simple, non-technical language
- Load the documentation-style skill before writing

**Don't:**
- Ask about tech/stack/architecture
- Include >6 features in MVP
- Create long question lists
- Document before user validates
- Use technical jargon
- Infer without enough context
- Make the process feel like a form

---

## Workflow

### Founder Profile (2–3 min)
1. Check if it exists: read `docs/owner.md`
2. If it exists: ask whether to update or skip
3. If new: ask the 3 questions
4. Infer technical level + communication style
5. Document in `docs/owner.md`
6. Commit

### Product Blueprint (5–10 min)
1. Check if it exists: read `docs/product.md`
2. If it exists: ask whether to update or restart
3. Ask the single open question: "what do you want to build?"
4. Evaluate depth: shallow/medium/rich
5. If shallow: ask 3 follow-up questions
6. Infer EVERYTHING using market patterns
7. Present validation: product/audience/problem/features/users/integrations/roadmap
8. Iterate until user approves
9. Load the documentation-style skill
10. Document in `docs/product.md`
11. Commit
12. Suggest next steps (`/add-feature`)

---

## Example Inference

User: "I want an app to schedule appointments for a hair salon"

**Inferred:**
- Product: Salon scheduling system
- Audience: Salon owners + end clients
- Problem: Losing clients due to disorganization, time spent on manual scheduling
- MVP Features: (1) Register services/hours (2) Clients book online (3) WhatsApp notifications (4) Admin panel to view agenda
- Cut: Online payment, multiple branches, advanced reports
- Users: 2 types (salon admin, end client)
- Integrations: WhatsApp (notifications), Google Calendar (optional)
- Roadmap: Phase 1 (basic agenda), Phase 2 (notifications), Phase 3 (reports)

**Present for validation, iterate if needed.**
