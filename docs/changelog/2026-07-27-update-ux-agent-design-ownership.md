# Update — UX Agent Ownership & Always-On Design Contract (plan 0057)

**Date:** 2026-07-27 · **Type:** update · **Plan:** `docs/plans/0057-PLAN--ux-agent-design-ownership.md` · **Umbrella topic:** 02

## Summary

`design.md` stops being an optional, hand-waved artefact. The UX pipeline is split into three specialists — flow, layout, critique — and `/add.plan` runs it automatically (STEP 8.1) behind a three-check gate, consolidating the result into a schema-validated `design.md` at the subfeature scope. `/add.design` becomes a thin manual entry point onto the same pipeline. `--yolo` is removed from `/add.plan`: a design contract that a flag can skip is not a contract.

## Changed

### Agents
- `@ux-flow-agent` (new) — inspects the design system once, then maps screen inventory, action classification, entry points, state transitions. Writes `design-context.md` + `design-flow.md`. Keeps `memory: project` (the design-system inspection is project-wide and stable).
- `@ux-layout-agent` (new) — turns the flow into per-screen layout trees, component composition, states, and the `## Design Contract`. Writes `design-layout.md`.
- `@ux-agent` — promoted to adversarial critic (critique mode) over the flow/layout pair.
- **Memory by role:** `@ux-agent`, `@qa-agent` and `@ux-layout-agent` deliberately carry **no `memory:`** — a judging or spec-authoring agent must re-derive its output from the artefacts of the current dispatch. This is a role-scoped exception to the project-memory convention; the rationale is now stated inline in each agent body.

### Commands
- `add.plan` — STEP 8.1: three-check gate (frontend / scope / provenance-hash idempotency), the three UX dispatches, coordinator consolidation at `SCOPE_DIR`, `feature-design` validation gate, temp cleanup. STEP 8 renumbered to 8.2–8.4. `--yolo` removed; the error gates and STEP 6 it used to bypass are retained.
- `add.design` — refactored to a thin dispatcher onto the same three agents + consolidation; keeps its own SaaS-context precomputation as the deliberate difference from the automatic path.
- `add.build` — domain-scoped precedence: `plan.md` wins on technical contracts, `design.md` on layout/hierarchy/tokens/states and every `## Design Contract` dimension, `about.md` on functional authority.

### Scripts
- `status.sh` — emits `HAS_DESIGN`, subfeature-aware (SF-level `design.md` first, feature-level fallback). Covered by new bats cases.

### Skills
- `add-qa-spec` — `screens.json` ownership inverted: the catalog is authored at `/add.plan` STEP 10.0 by read-merge-write keyed by `sf` + `id`, never rewritten from scratch.
- `add-doc-schemas` (`feature-design`) — design is subfeature-scoped by default; consumers resolve SF-level first, feature-level as fallback.

## Notes

Written retroactively (2026-07-27) — plan 0057 Task 5.5 required this changelog and it was missed at implementation time; recorded during the umbrella review v01 fix wave.
