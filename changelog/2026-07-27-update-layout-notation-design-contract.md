# Update — Layout Notation & Measurable Design Contract (plan 0058)

**Date:** 2026-07-27 · **Type:** update · **Plan:** `docs/plans/0058-PLAN--layout-notation-design-contract.md` · **Umbrella topic:** 03

## Summary

ASCII wireframes are retired and replaced by a **layout tree** — one minified JSON object per screen declaring regions, roles, spans and composition, with no leaf-level styling. On top of it, `design.md` gains a `## Design Contract`: 11 dimensions, each stating what it declares AND the method that verifies it. A line that names no verification method is not a contract line. This is the input 0059's deterministic conformance judging depends on.

## Changed

### Schema
- `add-doc-schemas` (`feature-design`) — `## Design Contract` added to the Sections list as a markdown table (`Dimension | Declares | Verified by | Method`), positioned after Tokens and before References; the exact heading is pre-referenced by `add.build`'s domain-scoped priority rule. Screens carry the layout tree. Hard bans gain: ASCII wireframes, per-element styling inside the tree.

### Skills
- `add-ux-design` — Layout Tree Notation, Component Composition, and the 11-dimension Design Contract Dimensions table (spacing scale, token allowlist, typographic scale, grid/container, minimum tap target, contrast target, breakpoint behaviour, required states, primary CTA count, visual hierarchy, optical alignment) with the verifiability rule and the inherit-don't-invent rule.
- `add-qa-spec` — `screens.json` `expect` now derives from the screen's Design Contract rows plus its layout tree, never freehand.

### Agents
- `@ux-layout-agent`, `@ux-agent` — ASCII notation removed from the authoring path; both reference the canonical notation instead of restating it.
- `@e2e-agent` — `<surface>.qa.spec` now captures computed styles to `_tests/run-NNN/computed-styles/<screen>.<viewport>.json`, the deterministic input the QA judge measures the contract against.

### Commands
- `add.qa-setup` — scaffolds the computed-style capture path.

## Breaking

Existing `design.md` files written before this change carry no `## Design Contract`. `/add.qa`'s UX axis then reports `spec-gap` findings rather than failing: re-run `/add.plan` (or `/add.design`) to regenerate the design with a contract.

## Notes

Written retroactively (2026-07-27) — plan 0058 Task 4.4 required this file and cited it at `0058-PLAN…:84` before it existed; recorded during the umbrella review v01 fix wave.
