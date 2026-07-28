# add-ux-design — Design Contract & Layout Notation

How a screen is specified (layout tree + component composition) and what a feature may commit to in its `## Design Contract`. Loaded by `@ux-layout-agent` when authoring, and read by the QA judges to know which dimensions are deterministic.

## Layout Tree Notation

Screens are specified as a **layout tree**, not an ASCII wireframe — the layout tree replaces wireframes entirely. One minified JSON object per screen:

```json
{"screen":"<id>","regions":[{"role":"header","order":1,"span":{"mobile":"full","desktop":"full"},"component":"<real component name>","contains":["..."],"primaryCta":"<action id, on the region that holds it>"}]}
```

- **Fields only:** region `role`, `order`, `span` (per breakpoint), `component` (real name — shadcn path or a `new` component already specced), `contains` (child element/content labels), `primaryCta` (the action id, placed on whichever region holds it).
- **No leaf-level styling.** No CSS, no `px`, no Tailwind classes, no color/spacing values inside the tree — those live in code, not the design doc. A region declares role and composition, never appearance.

**Example** (mobile-first, two regions):

```json
{"screen":"notifications-list","regions":[{"role":"header","order":1,"span":{"mobile":"full","desktop":"full"},"component":"PageHeader","contains":["title","filter-menu"]},{"role":"content","order":2,"span":{"mobile":"full","desktop":"8col"},"component":"NotificationList","contains":["NotificationCard"],"primaryCta":"mark-all-read"}]}
```

## Component Composition

Every component in the design's inventory states what it renders inside itself:

- **Notation:** `name — source — props/states — composed-of: [child component names]`.
- Child names resolve to the real inventory — existing library components (shadcn/etc.) or other `new` components already specced in the same doc. Never a fabricated library or an invented primitive.
- A leaf component (renders no children) states `composed-of: []` rather than omitting the field.

## Design Contract Dimensions

A feature's `## Design Contract` section (see `{{skill:add-doc-schemas/references/new-feature.md}}`, `feature-design` schema) is a markdown table, columns `Dimension | Declares | Verified by | Method`. These are the dimensions and how each is verified:

| Dimension | Declares | Verified by | Method |
|---|---|---|---|
| Spacing scale | Permitted step set | Computed style | Captured gap/margin/padding vs step set |
| Token allowlist | Colour/type tokens permitted | Computed style | Resolved custom-property names (never sampled pixels) |
| Typographic scale | Sizes/weights per role | Computed style | Captured font-size/font-weight |
| Grid/container | Max width, gutters, columns per breakpoint | Computed style | Captured container width + column count |
| Minimum tap target | e.g. 44px | axe-core (`target-size`) | Deterministic rule |
| Contrast target | WCAG level | axe-core (`color-contrast`) | Deterministic rule |
| Breakpoint behaviour | Declared reflow per screen/viewport | Screenshot | Agent judgement |
| Required states | Which of empty/loading/error/success must exist per screen | Evidence set | Set comparison of captured state files |
| Primary CTA count | Normally 1 per screen | Screenshot | Agent judgement |
| Visual hierarchy | Intended reading order | Screenshot | Agent judgement |
| Optical alignment | Baselines, icon/label pairing | Screenshot | Agent judgement |

**Verifiability rule.** A line belongs in the contract only if it names a verification method from this table. "Uses TanStack Query" is a plan concern, not a contract line — it names no verification method here.

**Inherit, don't invent.** Values are inherited from `design-context.md`; the feature's `Design Contract` section restates only this feature's commitments and justified deviations. A project dimension left undefined is written `unknown — <why>`, never invented.
