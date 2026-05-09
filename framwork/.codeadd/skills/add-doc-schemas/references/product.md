# Product Category — Schemas & Voice

Category file for product-level docs (founder/owner profile, product definition). Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns product-specific schemas.

**Schemas in this category:** `owner`, `product`.

## Schemas

### owner

For `/add.init` (creates `docs/product/owner.md`).

- **Frontmatter:** `id: OWNER`, `type: owner`, `related: [PRODUCT]`
- **Sections:** TL;DR · Founder · Skills · Constraints · Goals
- **Depth floor:**
  - **Founder** — name, role, relevant background.
  - **Skills** — actual capabilities that affect what the product can ship.
  - **Constraints** — per constraint: the limit (time, budget, tech, market) and its operational impact.
  - **Goals** — concrete, dated where possible.
- **Compression:** Founder = bullets. Constraints = table `constraint | impact`. Goals = bullets.
- **Hard bans:** narrative bio, personal opinions, marketing copy.

### product

For `/add.init` (creates `docs/product/product.md`).

- **Frontmatter:** `id: PRODUCT`, `type: product`, `related: [OWNER]`
- **Sections:** TL;DR · Vision · ICP · Core Value · Differentiators · Business Model
- **Depth floor:**
  - **Vision** — the end state the product is moving toward.
  - **ICP** — per segment: pain, JTBD, how we reach them.
  - **Core Value** — the one thing the product does better than alternatives, with the evidence or hypothesis behind the claim.
  - **Differentiators** — specific capabilities that are hard to copy. "Better UX" is not a differentiator.
  - **Business Model** — pricing, channels, unit economics if known.
- **Compression:** ICP = table `segment | pain | JTBD | channel`. Differentiators = bullets. Business Model = minified JSON `{"pricing":..., "channels":...}`.
- **Hard bans:** marketing fluff, superlatives, unverified claims.
