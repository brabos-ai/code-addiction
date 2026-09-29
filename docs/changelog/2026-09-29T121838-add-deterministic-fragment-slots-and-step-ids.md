# Deterministic fragment slots and stable STEP ids

> **Date:** 2026-09-29
> **Plan:** 2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids
> **Layers:** product, internal

## Delivered

- The installed prompt is now a function of the manifest, not of the order features were switched on. `scripts/build.js` reads an explicit `slot:` marker around every feature/plugin marker pair, records the members in source order, and embeds each slot's fallback bytes in `injection-points.json`. The sidecar is version 2 only; a marker left outside a slot fails the build.
- `cli/src/injection-core.js` composes an affected resource from a saved pristine baseline instead of editing the installed text. `captureBaselines` copies each slotted provider file before any injection; `reconcileSlots` re-renders the whole resource from that copy plus the current manifest state. Enabling, disabling, install and update all take the same path, so a toggle never depends on what a previous toggle wrote.
- A slot with no valid contributor renders its fallback. One sentence — `No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.` — lives in `fallbacks/plan-specs.md` for the shared `add-plan` step-list slot. Every other slot points at a zero-byte file. An empty fallback adds no bytes and no blank line.
- A missing fragment file, a missing section or a malformed payload warns with the resource, slot and member, skips that member, and leaves the requested flag on so a later update retries. A missing baseline leaves the installed file untouched and warns.
- Every distributed product command carries stable, owner-qualified STEP ids — `STEP add-plan.consolidate`, `STEP tdd-pipeline.test-spec`, `STEP qa-pipeline.qa-spec` — in its overview, its headings and its live cross-references. `STEP tdd-pipeline.test-spec` reads before `STEP qa-pipeline.qa-spec` in `add-plan` whatever the enable order, because the order is the marker order in the source. Section names such as `step-list` stay section names.
- `cli/src/uninstaller.js` treats `.codeadd/baselines/` as framework-generated and removes it, in project and global scope, while leaving user files alone.
- `workbench/skills/add-framework-injection/` is the internal authoring skill: how to declare a slot, choose a fallback file, and name a STEP id. `add-framework-development`, `building-commands`, `add-framework--plan` and `add-framework--build` load it when a change touches injection.

## Validation

- `cli/tests/injection-exclusivity.integration.test.js` compares the bytes of an installed `add-plan` from two clean installations that enabled tdd-pipeline and qa-pipeline in opposite orders, and asserts tdd reads before qa. `cli/tests/board-feature.test.js` reverses board, tdd, qa and docs-pruning together and expects identical files.
- `cli/tests/build-injection-points.test.js` freezes the 70 memberships in 63 slots, proves the one nonempty fallback is the only one, rejects a mixed marker outside a slot, rejects content inside a slot that is not a member marker, rejects numeric STEP headings, and resolves every overview id to a heading. `cli/tests/injection-core.test.js` covers the empty fallback, a contributing member suppressing it, a warned member with no sibling falling back, a missing baseline, and a malformed fragment.
- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 with no warning line — 244 nodes, 972 edges, 63 slots. `node scripts/build-workbench.js` exits 0.
- Full `npm test` through `scripts/run-tests.js` in the Linux container: 71 files, 1648 tests, all passing.
- CI on `a14d23e` passed every check: CLI on Node 20 and 22, the shell suite, board, both CodeQL analyses and the aggregate CodeQL check. These are the close-out gate's evidence.
- The delivery audit found eleven supported issues across plan conformance, diff completeness, side effects and the prompt quality ruler. Ten were applied; one was rejected with a ruling recorded in the ledger.

## Decisions recorded

- Slot member order is the marker order in the source, and it is the installed order. The build refuses a marker pair that is not inside a slot.
- A slot's fallback lives in its own source file, may be shared by several slots, and may be empty. Only the shared `add-plan` step-list slot carries text.
- A runtime failure skips the member and keeps the manifest intent, so an update retries it. The fallback appears only when nothing valid contributes.
- Bounded and architectural paths share one composition engine: tickets 0007B and 0014B shipped as one plan.

Implementation commits: `36bec6e`, `7ba3ddd`, `62f4e1b`, `55291b2`, `5bd0220`, `5910652`, `0e5efd4`, `2c96abf`, `742b36f`, `1771da7`, `3f8c682`, `ccc10ad`, `a8a666b`, `f3e06b5`, `80ae979`, `16191fc`, `a14d23e`.

## Close-out

- The build's STEP 8 did not run, so this changelog and the plan's changelog row with the commits were written here rather than by the build.
- The delivery index records six named behaviors. The plan and its append-only ledger are archived byte-for-byte under `docs/deliveries/2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids/`, together with the design document and the intent file the plan cites.
- The generated inventory block was already current; no commit was needed for it. Ticket 0007B is closed by this delivery.
