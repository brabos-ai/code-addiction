# Refactor — QA/UX Umbrella review v01 fix wave

**Date:** 2026-07-27 · **Type:** refactor · **Source:** `docs/plans/HANDOFF-qa-ux-umbrella--review-v01.md` (verdict BLOCKED) · **Scope:** plans 0056–0060

## Summary

The umbrella's plan conformance was near-total; what was BLOCKED were three architectural seams the plans never covered, plus one code change that had outrun its plan. All four blockers are cleared, along with every medium and low finding except the public web-docs refresh, which belongs to `/add-framework--sync`.

## Blockers cleared

### Agents
- `@ux-agent` gains **Fix Mode** — the `design-spec` route that `add-qa`'s routing table and `add.build`'s Named Agent Mapping dispatch had nowhere to land. It authorizes the minimal `design.md` amendment plus the mandatory `## Design Review` trail row carrying the originating `run-NNN` + finding ID, and bans re-judging, widening a dimension to make a failing screen pass, and touching anything but `design.md`. Its `description` now names all three modes; review mode still refuses fixes in-dispatch and says why (the fix wave is a separate, user-confirmed dispatch).

### Commands
- `add.review` — resolves `design.md` at subfeature scope. It previously read only `docs/features/${FEATURE_ID}/*`, so on an epic it concluded "no design.md", loaded `add-ux-design` as if nothing were specified, and the "design specs are MANDATORY" rule never fired. The Design Contract was being skipped at the review gate.
- `add.autopilot` — same SF-blindness fixed at prerequisite validation, `TASK_DOCUMENTS` assembly, the `@frontend-agent` dispatch and the final doc check; the dangling `/design` reference now points at `/add.design`.

### Plans
- **Plan 0060 amendment A1** — commit `a7eeb52` dropped the legacy severity/axis fallback for un-routed reports while three plan sites still mandated it. The decision is now recorded rather than reverted: `qa-pipeline` ships disabled by default, no released version wrote routed reports, and a fallback would dispatch findings whose owner was never derived. `/add.build qa` STOPs with the re-run remedy. Evidence file and the 0060 changelog reconciled.

## Medium

- `add.qa` resolves `DESIGN_FILE` once (SF-level, feature-level fallback) and every downstream step consumes it — preflight row 10, spec reading, the judge dispatch, the `judged-contract` hash. STEP 6 now routes the user to `/add.build qa`, the only mode that reads `## Fix Routing`.
- **Reference-don't-repeat.** Merge rules + Fix Routing moved out of `add-qa/SKILL.md` (which both judges preload, and which explicitly tells them not to emit routes) into `add-qa/references/coordinator.md`, loaded by `/add.qa` alone. The layout/contract notation and the critique rubric moved out of the 595-line `add-ux-design/SKILL.md` into `design-contract.md` + `critique-rubric.md`. `@qa-agent` cites the root-cause taxonomy instead of restating it; the qa-pipeline `add.plan` fragment points at the skill's read-merge-write section instead of restating five rules; the UX dispatch prompts in `add.plan`/`add.design` shrank to scope + paths + agent name, and the shared frontmatter/consolidation shape moved into the `feature-design` schema so the two callers cannot drift.
- `@qa-agent` gains `disallowedTools: Write, Edit, NotebookEdit` — read-only was asserted in prose only, and `add.qa` detected violations *after* the write. `@ux-agent`'s write scope is stated per mode instead.
- `add.plan`'s `## GATES` table gains the `design_gate` (8.1.0) and `design_validated` (8.1.5) rows it already referenced.
- `qa-preflight.sh` accepts the Docker bridge (`172.16.0.0/12`, `172.16`–`172.31` only) and `host.docker.internal`; a legitimate containerised local env no longer hard-blocks the run.
- Missing changelogs written for 0057 (T5.5) and 0058 (T4.4 — already cited by the plan before it existed).
- `HANDOFF-qa-ux-umbrella.md` retired, with its stale branch name, the "docs is never in commits" claim, the Windows CRLF baseline and the answered anchor question all corrected in place.

## Low

Agent/command/skill counts in `CLAUDE.md` corrected (19 / 39 / 15) and the `docs/` force-add exception documented as policy; `--yolo` dropped as a general convention from the internal `add-framework-development` skill; `provider-map.json` ux-agent description rewritten; each memory-free agent states its role-scoped rationale inline; `qa-preflight.sh` is now mode 755 with `set -u` and `local` declarations; hard-coded step coordinates removed from agent definitions (they drifted during this very umbrella); `add.qa-setup` hand-off list renumbered; the SF-fallback wording single-sourced to the `feature-design` **Location** rule at all 9 sites; the `feature:tdd:step9` injection anchor re-anchored from a bare code fence at ordinal 23 to unique prose at ordinal 1.

## Tests

- `qa-preflight.bats` +4: Docker bridge accepted, `host.docker.internal` accepted, `172.32.*` still refused (it is public, not the bridge), malformed manifest degrades to `unset` at exit 0. The runner-absent test now pins its environment instead of passing because `mktemp -d` happened to land outside a JS project.
- `qa-reachability.smoke.test.js` +8 (scenario 9 + relocated assertions): Fix Mode with its amendment trail, review mode still refusing, SF-scoped `design.md` in all four consumers, `/add.design` reference, the two new GATES rows, the step9 anchor, and the canonical-location assertions for the coordinator and design-contract reference files.

```
node scripts/build.js   →  650 files, 35 injection points, clean
npx vitest run          →  479 passed (479)
npx bats framwork/.codeadd/scripts/tests/*.bats  →  180 passed
```

## Deferred

`web/src/pages/docs.astro` still describes the retired dual-axis QA model, omits `@ux-flow-agent`/`@ux-layout-agent` from the ecosystem graph, and misses the new dispatch edges (review findings S4–S6). That file is owned by `/add-framework--sync`, which regenerates it from the ecosystem map before a release.
