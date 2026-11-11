# Update — Dual-Judge QA Validation (plan 0059)

**Date:** 2026-07-27 · **Type:** update · **Plan:** `docs/plans/0059-PLAN--dual-judge-qa-validation.md` · **Umbrella topic:** 04

## Summary

`/add.qa` STEP 4 now dispatches **two specialist judges per subfeature, in parallel**, replacing the single 4-axis generalist:

- `@ux-agent` (review mode) — the judgement axes: UX quality, judgement conformance (hierarchy, optical alignment, primary-CTA reading, declared reflow), responsiveness. Emits `type: ux | spec-gap`.
- `@qa-agent` — functional delivery vs `about.md`, deterministic Design Contract conformance from measured computed styles, ALL accessibility (axe-core), and root-caused failure forensics. Emits `type: functional | a11y | ux` (conformance).

The coordinator reconciles coverage once (shared to both judges) and merges the two finding sets (dedupe / domain precedence / higher-severity-wins / contradiction-at-lower-severity-with-both-positions).

## Changed

### Commands
- `add.qa` — STEP 4 restructured (run-NNN resolved first; coordinator coverage reconciliation; parallel dual dispatch, WAIT-ALL); STEP 5 merge rules; read-only guard names both judges. *(Tasks 1, committed earlier: `3ecf880`, `6ef8d41`.)*

### Agents
- `ux-agent` — review mode added (approval rubric, `## Design Review` as context-not-immunity, `spec-gap`, grounding rule). *(Task 2: `38c01e1`.)*
- `qa-agent` — rewritten as the deterministic + forensic half; `memory: project` removed (role-scoped); UX axis + old coverage step dropped; deterministic conformance + 7-row root-cause taxonomy added. *(Task 3: `8fdb63d`.)*

### Skills / Schema
- `add-doc-schemas` `qa-validation` schema — `type` gains `spec-gap`; `root cause` required on functional findings; `unverifiable` check outcome; `Responsiveness` + `Accessibility` added to the Sections list; `## TOC` required.
- `add-qa` — axis-ownership table, review-mode rubric summary, root-cause taxonomy, merge rules, judge-split docs; report template gains TOC + per-judge counts + root-cause line.
- `add-ecosystem` — `add.qa` row, `ux-agent`/`qa-agent` rows, Dependency Index updated to the dual-judge split.
- `add-qa-migration` — "dual-axis" → "dual-judge".

### Plugins
- `playwright` fragments (`add.qa`, `agents/qa-agent`) — reframed off single-judge wording; only `@qa-agent` live-drives, `@ux-agent` judges from persisted PNGs.

### Tests
- `cli/tests/qa-reachability.smoke.test.js` — scenario 7 (+6 tests, 23 total), including a pinned-anchor guard for `plugin:playwright:drive` on `add.qa` and `qa-agent`.

## Verification
- Build clean (635 files, 35 injection points); smoke 23/23; full vitest 464/464 (LF checkout, no CRLF failures).

## ⚠ Release obligation
This changes the `qa-validation` doc schema. `add-framework--release` must **bump the framework version** when cutting the release that ships this.
