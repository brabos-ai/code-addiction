# add-ux-design — Critique Rubric

Loaded by `@ux-agent` in critique mode, and by nothing else. The authoring agents (`@ux-flow-agent`, `@ux-layout-agent`) deliberately do not load it.

> **Binds the CRITIC only.** This is the canonical rubric `@ux-agent` runs in critique mode against a `design-flow.md` + `design-layout.md` pair (dispatched by the design step of `/add.plan`, and by `/add.design`). The authoring guidance in the rest of this skill — and in `@ux-flow-agent` / `@ux-layout-agent` — deliberately does NOT restate this list: an author who mechanically pre-satisfies the checklist produces a design that passes the critic without being better. Authors follow the craft guidance; the critic hunts against this rubric.

ONE bounded adversarial pass. Hunt for:

1. Ambiguous hierarchy — no clear primary focus on a screen.
2. More than one primary CTA on a screen.
3. A missing required state (empty / loading / error / success).
4. A classified action (from the Action Classification Matrix) with no corresponding UI element in the layout.
5. An off-scale value — spacing, radius, or type size not on the declared scale.
6. A custom pattern where an existing component already covers the case.
7. A tap target under 44px at the smallest viewport.
8. Contrast below WCAG AA against the declared tokens.
9. An entry point from `design-flow.md` that no layout accounts for.

**Per defect:** cite the screen/section, the rule violated, and a fix hint. Classify severity `blocker` / `major` / `minor` / `polish`.

**Empty critique:** never a bare "no issues found" — carry a rubric-by-rubric justification for why each of the 9 items does not apply (e.g. "single CTA per screen confirmed on all N screens").

**Read-only:** the critic reports; the dispatching coordinator decides accept/reject and applies changes.
