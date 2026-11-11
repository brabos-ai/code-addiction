# Update — QA Fix Routing (plan 0060)

**Date:** 2026-07-27 · **Type:** update · **Plan:** `docs/plans/0060-PLAN--qa-fix-routing.md` · **Umbrella topic:** 05 (closes the umbrella)

## Summary

The QA report now carries routing metadata, turning the judging→fixing handoff from re-diagnosis into dispatch. Every finding gets a `route` (a deterministic lookup on `type` + root cause — **no confidence field**); the report gains a `## Fix Routing` dispatch plan; `/add.build qa` dispatches by route in dependency order.

## Changed

### Schema
- `add-doc-schemas` `qa-validation` — required `route` field per finding; `## Fix Routing` section; `judged-contract` frontmatter hash; hard bans for a missing/capability-invalid route.

### Skills
- `add-qa` — routing-rules table, the `ux` two-value classification (contract-violated → @frontend-agent / contract-inadequate → @ux-agent, citation-or-not-dispatched), capability validation, fixed layer ordering (@database → @backend → @frontend → @e2e), `## Fix Routing` template, contract-amendment trail. Report template + checklist updated.
- `add-ecosystem` — `add.qa → add.build qa` routed handoff; `@e2e-agent` + `@ux-agent` gain `add.build qa` dispatch in the Agents table + Dependency Index.

### Commands
- `add.qa` — STEP 5.5 derives routes (coordinator, never the judges), citation gate, capability validation (fail loud), writes `## Fix Routing` + `judged-contract`; STEP 6 reports per responsible agent.
- `add.build` — Named Agent Mapping gains `@e2e-agent` (test files only, no MCP) and `@ux-agent` (design spec only) rows.

### Fragments
- `qa-pipeline/add.build.md` (qa-fix) — dispatch by route (Order + Blocked by), severity for presentation only, mandatory confirmation, present-not-dispatch for manual/capability-invalid/citation-missing routes, amendment trail.

### Breaking (plan 0060 amendment A1)
- A `qa-validation` report without a `## Fix Routing` section is **no longer consumable**: `/add.build qa` STOPs and tells the user to re-run `/add.qa <feature-id> [SFxx]`. The originally planned severity/axis fallback was withdrawn — a fallback would dispatch findings whose owner was never derived. **Migration:** regenerate any report written before this release by re-running `/add.qa`. Low blast radius: `qa-pipeline` is disabled by default and no released version wrote routed reports.

### Not changed (recorded decision)
- `cli/src/plugins.json` — `playwright.agents` stays `[qa-agent]`; `@ux-agent` judges from persisted PNGs and never live-drives (no drive fragment exists).

### Tests
- `cli/tests/qa-reachability.smoke.test.js` — scenario 8 (+6, 29 total).

## Verification
- Build clean (635 files, 35 injection points); smoke 29/29; full vitest 470/470 (LF checkout).

## ⚠ Release obligation
Changes the `qa-validation` doc schema. `add-framework--release` must **bump the framework version** when cutting the release that ships this.

## Umbrella
Closes the QA/UX umbrella (topics 01–05 → plans 0056–0060). Deferred follow-ups recorded in `docs/brainstorming/2026-07-26-00-qa-ux-umbrella.md`.
