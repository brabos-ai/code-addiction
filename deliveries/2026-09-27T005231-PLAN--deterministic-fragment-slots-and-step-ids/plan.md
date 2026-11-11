# Plan: Deterministic fragment slots and stable STEP IDs — assemble product prompts from desired state

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-09-27
> **Delivery:** confirm
> **Ticket:** 0007B
> **Related ticket:** 0014B

---

## Objective

An installed ADD prompt is assembled deterministically from the framework's source and the enabled features and plugins, regardless of the order in which they were enabled. Every injection location has an explicit fallback, and optional workflow steps have stable, readable IDs instead of position-dependent numbers.

**When this build is done:** Every supported provider gets the same prompt bytes for the same release and toggle state, even across different enable orders and update; invalid optional members warn and resolve to the appropriate group result; product workflow references use stable STEP IDs. Implementation takes place in one isolated git worktree and ends with a reviewed PR, not a merge.

**Ticket done when:** Enabling tdd-pipeline and qa-pipeline in either order produces a byte-identical add.plan with the tdd step before the qa step, and a test asserts byte equality between the two orders rather than only that every block landed.

**Related ticket 0014B done when:** Um grupo de features/plugins com todos os membros desligados faz o comando instalado receber o fragmento de fallback no anchor; ligar qualquer membro do grupo suprime o fallback; fallback vazio deixa o anchor intacto, sem linha em branco; e um teste em cli/tests cobre os tres casos.

The historical `add.plan` spelling in 0007B is part of the ticket's original acceptance text; the current source and installed command are `add-plan`. Do not reintroduce the old command name.

## Context

The reviewed design joins tickets 0007B and 0014B. The former identifies an order-dependent shared anchor; the latter needs an explicit group fallback. A single composition engine is smaller and safer than separate patches to insertion order and empty anchors. The intent fixes `delivery: confirm` and the boundary between product migration and internal authoring guidance.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-27T004331-deterministic-fragment-slots-and-step-ids.md` | Slot/baseline/fallback/STEP-ID contracts, alternatives, scope and validated decisions |
| `docs/brainstorming/2026-09-27T004331-deterministic-fragment-slots-and-step-ids-intent.md` | Architectural path, confirmed delivery, ticket 0007B and closed choices including related ticket 0014B |

Precedents: `docs/deliveries/2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary/plan.md` separated QA judgment from the Playwright anchor; `docs/deliveries/2026-09-26T121638-PLAN--product-artefact-names/plan.md` intentionally excluded 0007B and proved that renames, fragments and upgrade checks must move together. Existing `add-review` order checks do not prove `add-plan` byte equality.

## Global Constraints

- "HTML comments (`<!-- -->`) are stripped at build." (AGENTS.md, Pipeline)
- "Never write a raw `.codeadd/` path. Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; `lintResourcePaths()` warns otherwise. Scripts are the exception — always `.codeadd/scripts/`." (AGENTS.md, Pipeline)
- "Agents only to providers declaring an `agents` pattern." (AGENTS.md, Providers)
- "Edit the source, never the built copy." (AGENTS.md, Internal Layer)
- "Only commit, amend, push, or create PRs when explicitly requested." (developer instruction; this request asks for the eventual PR, and the build's first-push gate still waits)
- "Develop in a worktree and prepare a PR at the end." (user request in this conversation)
- All product commands and agents with injection markers migrate in this delivery; internal workbench commands keep their numbered STEPs. (reviewed design, Scope)
- The build keeps one commit per F-block, its ledger and its ordinary gates; this plan requires no exception. (AGENTS.md, internal pipeline; add-build-ledger)

## Problem

1. **Order-dependent prompt bytes:** `applyInjectionToContent` inserts a newly activated member directly after an anchor. `add-plan` has QA before TDD in source, and activation history changes the installed order.
2. **Unspecified empty location:** no point or manifest field declares which fallback belongs to the resource when no valid member contributes.
3. **Unremovable stale fragment:** current removal derives old bytes from a fragment file; a missing old fragment cannot be removed by replaying only the currently available files.
4. **Positional step references:** optional fragment STEPs and fixed command STEPs use numbers in overviews, headings and cross-references; composition changes can make them ambiguous.
5. **Authorship gap:** the existing internal development skill teaches marker pairs, but no internal skill owns the new slot, fallback and STEP-ID rules.

## Proposal

Work in a dedicated branch and linked worktree, then deliver one staged migration. First capture failing RED observations in temporary local tests, but commit only a passing inventory and dormant expectation fixtures. Next add build-side slot extraction while the current marker-only sources still emit the old sidecar; prepare authored fallbacks and baselines; then add a new renderer alongside the temporary old path. Switch to the new path only when all product source markers have been migrated in one passing commit. Migrate STEP IDs, then remove the temporary old path in the final product/internal validation blocks. The worktree carries all commits and the ignored plan/ledger; main and the original worktree are not the editing target.

## Current State

The source has **70 opening feature/plugin markers in 19 target resources**: 60 markers in nine product commands and 10 in ten product agents. This is the pre-migration expected member map, not a guess based on the number of fragment files. Any additional current marker discovered by a fresh inventory must be accounted for before F3. The expected end-state has exactly the same 70 `(namespace, name, section, resource)` memberships, grouped into explicit slots; every slot has one fallback declaration, including empty ones. No marker may remain outside a slot. Do not assert a fixed slot count before grouping adjacent source markers: the count is derived and frozen in the F1 test fixture.

| Command | Opening markers | Direct graph dependants | Risk |
|---|---:|---|---|
| `add-brainstorm` | 6 | `add`, `add-new`, board fragment | HIGH (3) |
| `add-build` | 15 | 19: commands/agents/skills and board, qa, tdd, gitnexus fragments | HIGH |
| `add-diagnose` | 1 | `add`, `add-brainstorm`, `add-hotfix`, gitnexus fragment, investigation skill | HIGH |
| `add-done` | 5 | 12: commands/skills and board, docs-pruning, gitnexus fragments | HIGH |
| `add-hotfix` | 6 | 9: commands/skills and board, tdd, gitnexus fragments | HIGH |
| `add-new` | 5 | 13: commands/skills and board/gitnexus fragments | HIGH |
| `add-plan` | 8 | 22: commands, agents, skills, board/qa/tdd/gitnexus fragments | HIGH |
| `add-review` | 8 | 16: commands, agents, skills, qa/tdd/playwright fragments | HIGH |
| `add-wiki` | 6 | 15: commands, agent, skills and gitnexus fragment | HIGH |

Agent marker targets: `architecture-agent` (6 direct graph dependants), `backend-agent` (6), `database-agent` (6), `discovery-agent` (3), `frontend-agent` (6), `qa-agent` (10), `reviewer-agent` (10), `system-design-agent` (1), `ux-agent` (12), `ux-flow-agent` (3). `system-design-agent` is MEDIUM; the other nine are HIGH. Their callers include dispatches from commands/skills plus incoming plugin fragments; the exact node lists were queried at depth 1 during planning. New internal `add-framework-injection` has no callers yet (LOW); `add-framework-development` (3), `add-framework--plan` (2), and `add-framework--build` (3) have respectively HIGH, MEDIUM and HIGH direct impact.

Graph blind spot: injected dispatches originate on the fragment node. For example `qa-pipeline/add-build.md` dispatches backend, database, e2e, fix, frontend and ux agents, and `qa-pipeline/add-review.md` dispatches e2e, qa and ux agents and runs qa-preflight/qa-evidence. `qa-pipeline/add-plan.md` uses `add--qa-spec`; `tdd-pipeline/add-plan.md` uses `add--test-specification`; Playwright's `add-review` fragment dispatches `qa-agent`. F1's inventory must query dependencies of each incoming fragment separately, then keep the source/sidecar map in tests. `scripts/`, CLI and generated sidecars are not graph nodes; inspect their consumers in code/tests. Neither `AGENTS.md` nor the tracked docs have a graph node.

Layer-filtered delivery-index queries returned no `gone`/`superseded` entry for the sampled product command/fragment or internal development/plan skills. The two archived plans above are the relevant shipped decisions, not replaced proposals.

## Scope

### Includes

- **F1** [product] — `cli/tests/build-injection-points.test.js`, `cli/tests/injection-exclusivity.integration.test.js` and an expected-map fixture under `cli/tests/`: inventory all 70 memberships, incoming fragment dependencies and active STEP references; freeze each slot's expected member order and fallback: ONLY the shared `add-plan` step-list slot has the exact nonempty sentence approved in the design, all other slots reference an intentionally empty file. Run temporary RED checks to prove current order/fallback failures, record their output in the worktree's ignored ledger/evidence, then restore a passing checked-in suite before committing F1. Assertions about future behavior remain dormant until the block that implements them and must be activated and proved GREEN there. **Produces:** `slot membership map v2` (resource, ordered namespace/name/section members, expected fallback and per-provider targets).
- **F2** [internal] — `scripts/build.js` ONLY: add and export strict slot extraction/validation, including ordered members, stable anchors and fallback bytes; reject missing/unsafe paths, nonempty member pairs, orphan/nested/duplicate slots, unknown sections and ambiguous anchors. **Transition contract:** with the existing marker-only source, emit the SAME v1 `points` sidecar (same keys/bytes) so current CLI install/update stays operational; with fully slotted product sources, emit v2 slots with fallback bytes; refuse a mixed source. Test the parser on disposable synthetic slot sources via exported builder helpers without editing product files in F2, and run current full build/tests. **Consumes:** `slot membership map v2` (F1). **Produces:** `dual-mode slot extractor` (v1 for current source; v2 with ordered slots once all declarations land).
- **F3** [product] — `framwork/.codeadd/fallbacks/{empty,plan-specs}.md`, `cli/src/injection-core.js`, `cli/src/installer.js`, `cli/src/updater.js`, manifest/hash handling and `cli/tests/{build-injection-points,injection-core}.test.js` plus install/update tests: create an intentionally zero-byte `empty.md` and `plan-specs.md` containing EXACTLY `No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.`; test the F2 parser with disposable fixture sources; capture/prune pristine provider baselines after ZIP copy and before composition and implement baseline-based v2 rendering. Until F5 migrates source markers, F2 emits v1 and the CLI keeps using the existing per-feature path, so this block must leave existing install/update behavior working. Leave resources unchanged and warn when a required baseline is absent. **Consumes:** `dual-mode slot extractor` (F2). **Produces:** `approved fallback sources` (one nonempty, one intentionally empty); `baseline resource renderer` (saved pristine resources and v2 render operation).
- **F4** [product] — `cli/src/features.js`, `cli/src/plugins.js`, `cli/src/injection-core.js`, `cli/src/installer.js`, `cli/src/updater.js` and CLI tests: for v2 resources unify feature/plugin state, re-render both types together and compose all valid members in source order, falling back only if zero contribute. Check missing file/section/bad payload from sidecar membership; warn with resource/slot/member and retain enabled manifest intent. Preserve plugin tool-detection gates and skills. For v1 resources until F5, continue the existing path and prove the pre-migration install/update tests pass at this commit. **Consumes:** `dual-mode slot extractor` (F2); `approved fallback sources` (F3); `baseline resource renderer` (F3). **Produces:** `unified feature/plugin reconciliation` (v2 desired-state renderer with a temporary v1 route).
- **F5** [product] — `framwork/.codeadd/commands/{add-brainstorm,add-build,add-diagnose,add-done,add-hotfix,add-new,add-plan,add-review,add-wiki}.md`; `framwork/.codeadd/agents/{architecture,backend,database,discovery,frontend,qa,reviewer,system-design,ux,ux-flow}-agent.md`; relevant fragment sources under `framwork/.codeadd/fragments/{board,docs-pruning,qa-pipeline,tdd-pipeline}/` and `framwork/.codeadd/plugins/{gitnexus,playwright}/fragments/`; build/provider tests: wrap ALL 70 source markers in explicit slots **within this one F-block**, using F3 fallbacks: only `add-plan` shared step-list gets the nonempty fallback, all other slots use `empty.md`. Move `add-plan` tdd marker before qa and retain the add-review QA/Playwright boundary. **In this same block**, rename the fixed `add-plan` consolidation heading/overview and its active references to `STEP add-plan.consolidate`, so the newly visible fallback never references an undefined STEP; F6 migrates the remaining IDs. Do not commit a partially slotted tree: F2 switches sidecar to v2 only when all markers are wrapped, and F4 already handles v2. Assert install/update work on the SAME commit. **Consumes:** `slot membership map v2` (F1); `dual-mode slot extractor` (F2); `approved fallback sources` (F3); `unified feature/plugin reconciliation` (F4). **Produces:** `product slot declarations` (complete source-backed v2 70-member map).
- **F6** [product] — all distributed command sources under `framwork/.codeadd/commands/*.md`, affected fragment bodies under F5 directories, affected product skill/agent/reference text with active numeric STEP cross-references and CLI STEP-ID tests: migrate headings, overviews and references to readable owner-qualified IDs; keep section names (`step-list`, `step9`) distinct. Update `add-plan`'s existing QA self-check: absent QA section does NOT imply qa-pipeline is disabled when manifest still requests it but runtime warned; do not contradict the approved fallback. Validate assembled combinations and provider output without changing workflow behavior. **Consumes:** `product slot declarations` (F5). **Produces:** `stable product STEP IDs` (complete source/fragment/reference mapping).
- **F7** [internal] — new `workbench/skills/add-framework-injection/SKILL.md`, `workbench/provider-map.json`, `workbench/skills/add-framework-development/SKILL.md` and entry guidance in `workbench/skills/add-framework--plan/SKILL.md` and `workbench/skills/add-framework--build/SKILL.md`: register/load the internal authoring skill when planning/building injection changes; teach marker order, fallback files, baseline rendering and STEP IDs. Keep built provider directories out of edits. **Consumes:** `dual-mode slot extractor` (F2); `stable product STEP IDs` (F6). **Produces:** `internal injection authoring contract` (registered skill and conditional load points).
- **F8** [product] — `cli/tests/{injection-exclusivity.integration.test.js,board-feature.test.js,build-injection-points.test.js,injection-core.test.js}` and installer/updater/plugin/provider/release-asset tests, plus `cli/src/{features,plugins,injection-core}.js` as needed: close the RED matrix for toggles/providers including exact final examples in the design, byte equality of reversed enable orders, missing-old-fragment disable and install/update parity. Remove the board-feature test's fixed-order workaround and the temporary v1 CLI route after proving current sources all emit v2. **Consumes:** `unified feature/plugin reconciliation` (F4); `product slot declarations` (F5); `stable product STEP IDs` (F6). **Produces:** `verified product combination matrix` (passing L1–L4 with captured counts).
- **F9** [internal] — `scripts/build.js` (remove the now-unused temporary v1 sidecar emission), `AGENTS.md` generated inventory block only if a refresh through `node scripts/inventory.js` requires it, plus workbench-build verification: finish with v2-only build and v2-only CLI while keeping every intermediate commit passing. Run full repo gates and check workbench registration/build. **Consumes:** `dual-mode slot extractor` (F2); `internal injection authoring contract` (F7); `verified product combination matrix` (F8). **Produces:** `release-ready worktree` (validated branch, ledger and review package for the build's PR question).

### Does NOT Include

- Numeric STEP migration in `workbench/` commands/skills/agents; only the internal authoring rule changes.
- Shipping two CLI sidecar schemas in the finished delivery, or migrating old installed prompt bodies in place: transitional v1 support exists only between F2 and F9; update copies the current release and refreshes baselines.
- Opening a PR during planning, automatically merging a PR, or executing `/add-framework--done` unattended.
- Changing plugin external-tool availability checks, board behavior, or product dispatch flows beyond required STEP references.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| What controls composition order? | Member marker order in product source | Design, Key Decisions; `add-plan` source markers must be reordered |
| Where is metadata? | Slot markers in source, generated sidecar JSON | Design, Proposed Solution |
| What if nothing contributes? | Source-relative separate fallback file, possibly shared or empty | Design, Proposed Solution; related ticket 0014B |
| Which fallbacks contain text? | Only the `add-plan` shared step-list slot; every other slot uses the explicitly empty `fallbacks/empty.md` | Design, Approved fallback mapping and assembled examples; user approval |
| What if an enabled member is bad at runtime? | Warn, skip member, keep manifest enabled, fallback only if no valid member remains | Design, Key Decisions |
| What removes old text if a fragment is gone? | Render from release-specific pristine provider baseline | Reviewed design, Proposed Solution |
| What gets new STEP IDs? | All distributed product commands and optional fragments; no internal STEP renumbering | Design, Scope |
| How is work delivered? | One plan with checkpoints, developed in a worktree, user-confirmed first push and PR at build end | User request; build STEP 9 |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Deterministic installed bytes for one manifest state | Simple per-feature append/remove logic |
| Explicit missing-member behavior and clean update | Additional pristine provider-resource storage in an installation |
| Stable, readable product STEP references | Short numeric labels; a wider source migration in one delivery |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Old payload remains after a fragment disappears | High | F3 renders only from saved baseline; L2 removes missing old member |
| One feature toggle deletes a sibling/plugin | High | F4 composes both registries; L3 compares sibling bytes and both toggle orders |
| Empty fallback creates whitespace or broken steps | Medium | F3 authors zero-byte fallback; F8 checks empty/no-extra-line and provider output |
| STEP rename leaves active references dangling | High | F6 inventories all distributed references; L1 static checks and L3 assembled combinations |
| Broad migration changes command behavior accidentally | High | F5/F6 preserve semantic bodies; F8 end-state and full existing suite; reviewer checks dispatch contracts |
| Missing baseline or broken member silently degrades | Medium | F3/F4 emit resource-specific warning and leave intact when baseline unavailable; L2 tests both failures |
| Local plan/ledger inaccessible after entering a worktree | Medium | Execution setup copies ignored plan, design and intent to the isolated worktree before editing; build verifies byte equality and ledger there |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `scripts/build.js` | internal | modify | F2 build-time slot extraction and validation |
| `framwork/.codeadd/fallbacks/{empty,plan-specs}.md` | product | create | F3 approved fallback sources (build inputs, not release asset inputs) |
| `framwork/.codeadd/commands/{add-brainstorm,add-build,add-diagnose,add-done,add-hotfix,add-new,add-plan,add-review,add-wiki}.md` | product | modify | F5 slots and F6 STEP IDs |
| `framwork/.codeadd/commands/*.md` (remaining active STEP references) | product | modify as found | F6 complete product command STEP migration |
| `framwork/.codeadd/agents/{architecture,backend,database,discovery,frontend,qa,reviewer,system-design,ux,ux-flow}-agent.md` | product | modify | F5 agent slots; F6 only if an active STEP reference changes |
| `framwork/.codeadd/fragments/{board,docs-pruning,qa-pipeline,tdd-pipeline}/*.md` | product | modify where referenced | F5 point/section matching and F6 STEP references |
| `framwork/.codeadd/plugins/{gitnexus,playwright}/fragments/**/*.md` | product | modify where referenced | F5 agent/command slots and F6 STEP references |
| `framwork/.codeadd/skills/**` and product agent reference text | product | modify only where active STEP references require | F6 no dangling cross-file names |
| `framwork/.codeadd/injection-points.json` | product | generated, not edited | F2 sidecar v2 embedded fallback bytes |
| `cli/src/{injection-core,features,plugins,installer,updater}.js` and manifest helper as needed | product | modify | F3/F4/F8 saved baseline, unified reconciliation and final v2-only route |
| `cli/tests/build-injection-points.test.js`, `injection-core.test.js`, `injection-exclusivity.integration.test.js`, `board-feature.test.js`, and existing install/update/plugin/provider/release tests | product | modify | F1/F3/F4/F8 expected end-state map and regressions |
| `cli/tests/` expected-map fixture | product | create | F1 freezes 70 memberships and slot end-state |
| `workbench/skills/add-framework-injection/SKILL.md` | internal | create | F7 authoring contract |
| `workbench/provider-map.json`, `workbench/skills/{add-framework-development,add-framework--plan,add-framework--build}/SKILL.md` | internal | modify | F7 registration and conditional loads |
| `AGENTS.md` inventory block | internal | generated when required | F9 keep inventory current; never hand-edit |

## Expected Installed Prompt Examples

The source marker region, the fallback file's literal contents, and **five exact assembled states** are in the design's `Approved fallback mapping and assembled examples` section. Treat that table as an output contract, not illustrative copy. F3 authors those fallback bytes; F5 declares the slots; F6 converts fixed and optional STEP IDs; F8 checks the complete installed file for each state.

| State of the `add-plan` shared slot | Installed lines between the same fixed base lines |
|---|---|
| tdd off, qa off | `STEP add-plan.analyze-scope` → `No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.` → `STEP add-plan.consolidate` |
| tdd on, qa off | `STEP add-plan.analyze-scope` → `STEP tdd-pipeline.test-spec` → `STEP add-plan.consolidate` |
| tdd off, qa on | `STEP add-plan.analyze-scope` → `STEP qa-pipeline.qa-spec` → `STEP add-plan.consolidate` |
| both on, in either activation order | `STEP add-plan.analyze-scope` → `STEP tdd-pipeline.test-spec` → `STEP qa-pipeline.qa-spec` → `STEP add-plan.consolidate`; compare entire installed file bytes between the two orders |
| both requested, qa section unavailable | Same as tdd-only; CLI warns about qa, retains both enabled flags and retries on update |

Illustrative authored command region (not a file to copy into implementation):

```md
STEP add-plan.analyze-scope: Analyze scope
<!-- slot:plan-specs fallback="fallbacks/plan-specs.md" -->
<!-- feature:tdd-pipeline:step-list -->
<!-- /feature:tdd-pipeline:step-list -->
<!-- feature:qa-pipeline:step-list -->
<!-- /feature:qa-pipeline:step-list -->
<!-- /slot:plan-specs -->
STEP add-plan.consolidate: Consolidate the plan
```

The **final installed command** has no markers. With both off, it reads:

```md
STEP add-plan.analyze-scope: Analyze scope
No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.
STEP add-plan.consolidate: Consolidate the plan
```

With TDD only: `STEP add-plan.analyze-scope` → `STEP tdd-pipeline.test-spec` → `STEP add-plan.consolidate`. With QA only: `STEP add-plan.analyze-scope` → `STEP qa-pipeline.qa-spec` → `STEP add-plan.consolidate`. With both enabled **in either order**, the final installed command reads:

```md
STEP add-plan.analyze-scope: Analyze scope
STEP tdd-pipeline.test-spec: Generate contract test cases
STEP qa-pipeline.qa-spec: Generate the QA specification
STEP add-plan.consolidate: Consolidate the plan
```

If QA is requested but its section is unavailable, the final command reads the **TDD-only** variant above; the CLI warns, does not show fallback, and keeps QA requested in the manifest. With GitNexus off, the `backend-agent` empty fallback inserts **zero bytes** between its fixed surrounding lines; with GitNexus on, it inserts its graph fragment once. The design contains the five-case table and the agent example as the detailed contract.

Product **skills** are not injection targets in the existing system: their active textual STEP references still migrate where relevant. No plan step adds a new skill-injection target.

No source change is planned for the generated provider output, installer-consumed sidecar or archived prior deliveries. The exact file list for the conditional wildcard rows is frozen from the F1 active-reference inventory before F5/F6 begins, recorded with the ledger and reflected here by ruling if it expands beyond the named scopes.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first, passing commits always.** F1 captures observed RED runs in a temporary, noncommitted test invocation and checks in only passing inventory/dormant expectations. Activate each expectation and prove it GREEN in its corresponding implementation F-block before that block commits. No F-block commits a failing suite. The worktree ledger records the RED command/output and the GREEN command/output for each level.

**Expected end-state map:** 9 product commands with 60 feature/plugin member points and 10 product agents with 10 plugin member points (70 total), classified by `(namespace, name, section, resource)`. Every member belongs to exactly one explicit named slot. Slot order is source marker order, including `add-plan` tdd before qa at the shared step-list slot. Exactly one slot points at `fallbacks/plan-specs.md` with the approved nonempty line; all remaining slots point at `fallbacks/empty.md` with zero bytes. No unregistered injection point, leftover old-format marker outside a slot, duplicate section or conditional STEP ID. F1 freezes the complete per-resource/per-namespace/per-section fixture and derived slot count; F3 proves parser fixtures and F5 asserts emitted v2 map equals fixture across supporting providers. `node scripts/build.js` must emit no new warning.

### L1 — Build and static unit checks (F1, F2, F3, F5, F6, F7, F9; RED → GREEN)

1. All 70 memberships and declared fallbacks validate; duplicate/nested/orphan slots, unsafe paths, missing/empty-vs-absent file distinctions, unregistered/malformed sections and unstable anchors fail the build. F2 proves parser behavior with disposable fixture; F3 activates product parser tests; F5 proves v2 source; F9 proves the v1 branch is gone. *RED today: slot/fallback grammar and sidecar are absent.*
2. Base and optional STEP headings, overview items and active references share unique readable IDs per assembled command; numeric positional identifiers are absent from active product workflow references. *RED today: add-plan has STEP 8/9.0 and other product commands use positional numbering.*
3. `workbench/provider-map.json` registers the internal authoring skill; internal plan/build loads are conditional; `node scripts/build-workbench.js` emits the skill, with no product registration. *RED today: no such skill exists.*

### L2 — Renderer, manifest and packaging integration (F1, F3, F4, F5, F8; RED → GREEN)

1. Install/update save pristine provider-resource baselines before composition, update replaces them, toggles re-render from them; deleting an old fragment file then disabling its feature leaves no stale text. *RED today: disable iterates available fragment files and derives removal bytes from them.*
2. A missing file, section or malformed enabled payload warns with slot/member/resource, leaves manifest enabled, preserves valid sibling contributions or uses fallback, and succeeds on a later update with the repaired member. A missing baseline warns and leaves the installed resource intact. *RED today: no slot membership-based warning/retry.*
3. Plugin tool detection and skills remain correct; an agent receives injections only on supported providers, with same placeholder resolution. Release ZIP includes the v2 sidecar with fallback content and an installed CLI renders fallback with no fallback source directory. *RED today: no packaged fallback content.*

### L3 — Combination and byte-equality matrix (F1, F4, F5, F6, F8; RED → GREEN)

1. Run all five cases from Expected Installed Prompt Examples, including both enable orders and the invalid-qa warning. Compare complete installed `add-plan` bytes from independent clean installations; assert tdd before qa exactly once and absence of the fallback when any member contributes. *RED today: reversed enable order differs and existing test only checks presence.*
2. Each shared slot renders all valid members once, source order intact, independent of toggle history; disabling one leaves the sibling byte-identical. All-off renders nonempty fallback once; empty fallback inserts zero bytes and no extra newline. Round-trip returns the **all-off assembled baseline (including nonempty fallback)**, not the unrendered pristine provider file. *RED today: shared fallback absent.*
3. Feature/plugin combinations for `add-review` preserve QA judge head/tail around Playwright; agents preserve their plugin capability when enabled; board-feature test reverses other feature order without changing its board assertions. *RED today: board test fixes other features' order.*

### L4 — Full gates and release handoff (F7, F8, F9; RED → GREEN)

1. Run `node scripts/build.js`, the appropriate CLI suite (`npm test` / `npm run test:all` per platform) and `node scripts/build-workbench.js` in the isolated worktree. Compare provider files and release packaging from the built product, not source alone.
2. Execute the build's graph gate, ledger checks, final adversarial audit and AGENTS inventory refresh. Each F-block has its passing level and no unrelated diff.
3. After validation, review `git status`, diff and history, stage only intended changes, commit per F-block through the build's ledger, and at STEP 9 **ask before the first push**. On yes, push the worktree branch and open a PR with `gh pr create`; report the URL and stop before merge. No PR or push occurs during planning.

## Execution Order

**Worktree setup BEFORE F1:** On the build run, inspect root status/remote and choose a fresh named branch based on current main. Create a linked worktree outside the repo working directory (an approved location), verify `git worktree list`, then copy the local gitignored plan, design and intent into that worktree's matching `docs/plans/` and `docs/brainstorming/` paths; compare their bytes with originals. Run `/add-framework--build` from the worktree and create its ledger there. Do not switch a shared worktree in place or edit ignored built provider copies. A worktree/branch collision is a deciding stop; do not overwrite someone else's branch. The gitignored local documents are archived by close-out, not committed as implementation files during the F-blocks.

1. **F1 [product]** records temporary RED evidence; commits only passing membership/ref fixtures and approved fallback mapping.
2. **F2 [internal]** adds builder slot parsing; because source is still old markers, builds continue emitting byte-identical v1 sidecar. Focused exported-parser fixture check plus unchanged build/install/update is this block's proof.
3. **F3 [product]** creates approved fallbacks, proves parser via product tests, saves baselines and stages the v2 resource renderer; current source still emits v1 and install/update remains unchanged.
4. **F4 [product]** unifies feature/plugin composition and warning policy; plugin gate and manifest state stay correct.
5. **F5 [product]** migrates all 70 memberships across commands/agents AT ONCE; source, sidecar v2 and prepared CLI switch together, so no partial migration is committed.
6. **F6 [product]** migrates STEP IDs and references together, including all active cross-file users.
7. **F7 [internal]** registers authoring skill and updates only internal source guidance; validate build-workbench and product graph with no product source edits from this block.
8. **F8 [product]** closes combinations, upgrade and asset coverage, removes board workaround and temporary v1 CLI route.
9. **F9 [internal]** removes temporary v1 builder emission, refreshes inventory and completes gates before reviewer/PR question.

One passing commit per F-block. The temporary v1 path is explicit and local to the transition: F2 builds v1 for legacy-only source, F3/F4 run old CLI behavior on v1 and stage v2 handling, F5 atomically moves all sources to v2, F8 removes old CLI behavior, F9 removes old builder behavior. Every intermediate commit passes its build and install/update checks. `node scripts/build.js` runs per block in both layers. Internal-only blocks cannot edit product tracked paths; generated graph sidecars are ignored.

## Reviewer Handoff

The review command can audit from the plan and evidence without reconstructing the brainstorm conversation. For each F-block, record changed files, which validation levels ran and passed, and every ruling departing from the design with its reason and cost if wrong. Check these specific leaks:

1. An F-block marked complete whose test was never RED before implementation.
2. One of the 70 members absent, added twice or delivered in a different order; a feature-only toggle drops an active plugin (or the reverse).
3. Runtime fallback hiding a valid sibling or resetting manifest intent after a warned failure.
4. Obsolete positional STEP references or duplicate semantic IDs in an assembled provider command.
5. A build input fallback absent from sidecar/release asset; any provider agent installed despite no supported agents directory.
6. A worktree mismatch: plan/ledger not local to the build worktree, unrelated user changes staged, or PR requested before gates.

## References

- Design and intent: the two `docs/brainstorming/2026-09-27T004331-deterministic-fragment-slots-and-step-ids*.md` files named in Context.
- Tickets 0007B and 0014B in `docs/backlog.jsonl`; `add-plan` renamed since ticket 0007B was recorded.
- Prior QA boundary: `docs/deliveries/2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary/plan.md`.
- Prior product rename and 0007B exclusion: `docs/deliveries/2026-09-26T121638-PLAN--product-artefact-names/plan.md`.

---

## Next Steps

Run `/add-framework--build deterministic-fragment-slots-and-step-ids` after approving this reviewed plan. The build prepares and works in the requested worktree, validates all F-blocks, then asks before pushing/opening the PR; it never merges at this stage.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-27 | Initial creation from the reviewed design and confirmed intent |
| 2026-09-27 | Review blockers resolved: split build/product layers, passing RED evidence, approved fallback mapping and explicit v1-to-v2 transition; added final prompt examples |
| 2026-09-29 | Implemented in commits `36bec6e`..`a14d23e` (17 commits); delivery audit applied 10 findings and rejected 1 with a ruling |
