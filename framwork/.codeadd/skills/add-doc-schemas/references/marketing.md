# Marketing Category — Schemas & Voice

Category file for marketing docs (saas copy, landing-page specs). Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns marketing-specific schemas.

**Schemas in this category:** `saas-copy`, `landing-page`.

## Shared Notation

### Persuasive Voice (scoped exception)

Marketing schemas are the **only** place in the framework where persuasive copy is explicitly allowed. Even here, claims must be grounded:

- **Headlines, subheadlines, CTAs** — exact quoted copy ready to paste. No placeholder text, no lorem ipsum.
- **Value props** — every prop pairs a benefit (what the user gets) with a mechanism (how the product delivers it). Both required. A benefit without a mechanism is wishful copy.
- **Proof** — concrete items only: specific metrics, named testimonials, identified logos, linked case studies. "Trusted by many" / "thousands of users" are banned unless the number is verified.

Voice principles from `{{skill:add-doc-schemas/SKILL.md}}` still apply to the *structure* of the doc — the schema is filled extractively, even though the copy fields themselves contain persuasive language.

## Schemas

### saas-copy

For `/add.copy` (creates `docs/copy/<slug>.md`).

- **Frontmatter:** `id: COPY-<slug>`, `type: saas-copy`, `related: [PRODUCT]`
- **Sections:** TL;DR · Headline · Subheadline · Value Props · CTA · Proof
- **Depth floor:**
  - **Headline / Subheadline / CTA** — exact quoted copy, ready to paste.
  - **Value Props** — per prop: benefit (what the user gets) + mechanism (how the product delivers it). Both required per Persuasive Voice above.
  - **Proof** — concrete items: metric, testimonial, logo, case study. No "trusted by many".
- **Compression:** Value Props = bullets `benefit — mechanism`. Proof = bullets `type: concrete item`.
- **Hard bans:** lorem ipsum, placeholder text, vague social proof, unverified numerical claims.
- **Avoid unless load-bearing:** multiple variants in one doc (pick one canonical; variants live in separate docs if needed).

### landing-page

For `/add.landing` (creates `docs/landing/<slug>.md`).

- **Frontmatter:** `id: LAND-<slug>`, `type: landing-page`, `related: [COPY-<slug>, PRODUCT]`
- **Sections:** TL;DR · Sections · Components · Copy Refs · Assets
- **Depth floor:**
  - **Sections** — per section: order, name, purpose, component that renders it.
  - **Components** — per component: name, source (shadcn / new), props if new.
  - **Copy Refs** — `{{doc:COPY-<slug>}}` anchors mapping each copy block to its section.
  - **Assets** — every image, video, or asset path.
- **Compression:** Sections = table `order | section | purpose | component`. Components = bullets.
- **Hard bans:** inline HTML, actual copy strings (reference `saas-copy` doc instead).
