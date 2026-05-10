---
name: add-product-discovery
description: Use when starting a new project — discovers founder profile and product blueprint, writes docs/owner.md + docs/product.md
---

# Product Discovery

Runs a quick founder + product discovery in 5–10 minutes, creating a communication profile and a development blueprint.

**Principle:** Speed over completeness. Infer based on market patterns. Simplify for MVP. Don't overload.

---

## When to Use

- Starting a new project / first-time setup
- Need a founder profile or product blueprint
- `docs/owner.md` or `docs/product.md` does not exist

## When NOT to Use

- Existing project with `docs/owner.md` + `docs/product.md` already populated
- Refactor or feature work (use `/add.brainstorm` or `/add.new` instead)
- Bug fixes / hotfixes (use `/add.hotfix`)

---

## Phase 1: Founder Profile (2–3 min)

**Output:** `docs/owner.md`. **Goal:** identify technical level + communication preferences.

**Workflow:**
1. Read `docs/owner.md` — if exists, ask whether to update or skip
2. Ask 3 questions: (Q1) development experience [4 options], (Q2) explanation preference [3 styles], (Q3) role in project [4 options]
3. Infer technical level + communication style (rules below)
4. Document in `docs/owner.md` and commit: `docs: create founder profile...`

**Technical Level Inference:**
- IF `Q1 = a` AND `Q3 ∈ {a, b}` → **leigo** (non-technical)
- IF `Q1 = b` AND `Q3 ∈ {a, b}` → **basic**
- IF `Q1 = c` AND `Q3 ∈ {a, b}` → **intermediate**
- IF `Q1 = d` OR `Q3 = c` → **technical**

**Communication Style Inference:**
- IF `Q2 = a` → **simplified**
- IF `Q2 = b` → **balanced**
- IF `Q2 = c` → **technical**

---

## Phase 2: Product Blueprint (5–10 min)

**Output:** `docs/product.md`. **Goal:** understand the product idea and create an MVP blueprint.

**Workflow:**
1. Read `docs/product.md` — if exists, ask whether to update or restart
2. Ask the single open question: "what do you want to build?"
3. Evaluate depth and act:

| Response depth | Action |
|----------------|--------|
| Shallow (<20 words) | Ask 3 follow-up questions |
| Medium (20–100 words) | Proceed with targeted questions |
| Rich (100+ words) | Proceed to inference |

4. Infer EVERYTHING using market patterns: product description, target audience, main problem, MVP features (4–6 max), cut features, user types (admin/client/team), integrations (Stripe/Calendar/WhatsApp), roadmap phases (core/essential/nice-to-have)
5. Present validation, iterate until user approves
6. Load `{{skill:add-doc-schemas/SKILL.md}}` before writing
7. Document in `docs/product.md` and commit: `docs: create product blueprint for MVP...`
8. Suggest next step: `/add.brainstorm` or `/add.new` for the first roadmap item

**Inference based on:** market patterns (how 80% of similar products work), MVP mentality (minimum to validate), user context (what they emphasized), common sense (first-time user expectations).

---

## Market Patterns

| Vertical | Pattern |
|----------|---------|
| scheduling | 2 users (admin+client), calendar integration |
| ecommerce | 2 users (admin+client), payments mandatory |
| saas-b2b | multi-tenant, 3 users (owner, admin, member) |
| marketplace | 3 users (admin, seller, buyer), payments |
| internal-management | 1–2 users (admin, team?), no integration |
| courses | 2–3 users (admin, instructor?, student), payments |
| delivery | 3 users (admin, courier, client), geolocation |

---

## Documentation Format

Hybrid (human-readable + token-efficient). Load `{{skill:add-doc-schemas/SKILL.md}}` before writing.

| File | Sections |
|------|----------|
| `owner.md` | identification, technical level, communication preferences, project context |
| `product.md` | what it is, for whom, problem solved, MVP features, cut features, user types, integrations, roadmap phases |

---

## Guardrails

- Be quick (5–10 min total) and never make it feel like a form — no long question lists, no tech/stack/architecture questions
- Infer from market patterns; ask follow-ups only when response is shallow (<20 words) or context is insufficient
- Cap MVP at 6 features; use simple, non-technical language
- Always validate inference with the user before documenting
- Load the documentation-style skill before writing any doc

---

## Example Inference

User: "I want an app to schedule appointments for a hair salon"

- Product: Salon scheduling system; Audience: salon owners + end clients
- Problem: lost clients from disorganization, manual scheduling overhead
- MVP: (1) register services/hours (2) online booking (3) WhatsApp notifications (4) admin agenda
- Cut: online payment, multiple branches, advanced reports
- Users: 2 (salon admin, end client); Integrations: WhatsApp, Google Calendar (optional)
- Roadmap: Phase 1 (basic agenda) → Phase 2 (notifications) → Phase 3 (reports)
- Present for validation, iterate if needed
