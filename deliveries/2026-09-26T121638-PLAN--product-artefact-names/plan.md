# Plan: Product artefact names — commands with one hyphen, skills with two

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-26
> **Delivery:** automatic
> **Ticket:** 0010B

---

## Objective

Make product command and skill names visibly distinct and valid across the supported providers: commands use `add-<name>` and skills use `add--<name>`, with no compatibility aliases. Preserve the existing root command `add` and internal workbench names.

**When this build is done:** Fresh and upgraded installations expose only the canonical product names; the graph resolves those identities and relationships; an internal rename tool can safely preview and apply future product renames.

**Ticket done when:** A brainstorm exists deciding whether to rename product commands off the dot, and to what shape, or explicitly closes as not-worth-it.

## Context

Ticket 0010B arose when ZCode could not accept dotted native command names. The approved design extends the solution to product skill naming so commands and auxiliary skills stay distinct in providers where both are emitted as skills. The ZCode plan deferred the general rename. The archived workbench-layer plan records separate registries and builds sharing transformation code. Delivery-index history queries were unavailable (`delivered.sh` exited 127).

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-26T112831-product-artefact-names.md` | Naming, no-alias migration, tool preview/apply contract, installer/plugin cleanup, validation |
| `docs/brainstorming/2026-09-26T112831-product-artefact-names-intent.md` | Architectural path, automatic delivery, ticket and closed decisions |

## Global Constraints

- Keep `add`, agent names, script names, feature/plugin identifiers, internal command/skill identities and historical records unchanged. (design, Proposed Solution)
- A command emitted as a `SKILL.md` for a provider retains its **command** name (`add-new`, never `add--new`). (design, Proposed Solution)
- A failing test must be observed before making the implementation pass. (design, Scope / Includes)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. Dotted command names cannot be used natively by every provider, and single-hyphen skill names cannot be distinguished from proposed command names in a shared skills directory.
2. Renaming only files leaves handoffs, plugin/feature injection, resolver paths, installed upgrades and graph relationships pointing at stale names.
3. Manual per-file renaming offers no reusable preview or stale-input guard.

## Proposal

First create and test the internal rename utility and skill. Then drive the namespace migration from a checked JSONL preview, changing only active references and product identities. Finally update installation cleanup and public documentation, rebuild the graph and prove the six-provider output plus upgrades. Follow the design's rejected alternatives; do not reintroduce aliases.

## Current State

| Subject | Graph dependants (depth 1) | Risk |
|---|---|---|
| `product/command/add.plan` | `add`, `add.build`, `add.diagnose`, `add.new`, `add.review`, agents, skills and four injected fragments | HIGH |
| `product/command/add.build` | Six commands, agents, skills and board/QA/TDD/GitNexus fragments | HIGH |
| `product/skill/add-doc-schemas` | Commands, agent, fragment and skills | HIGH |
| `product/skill/add-gitnexus` | GitNexus command and agent fragments, plugin container | HIGH |
| `product/skill/add-resource-path-convention` | `add-doc-schemas` | MEDIUM |
| `product/command/add.ux` | none (not a reason to skip the rename) | LOW |
| `product/command/add` | none; outbound handoffs change | LOW |

Dependencies were queried for `add.plan`, `add-doc-schemas`, plugin skill `add-gitnexus` and the QA injection fragment. `add.plan → add-doc-schemas` is a direct path. Each renamed identity requires a direct depth-1 impact and dependencies check at build time; command fragments also need their own dependency query. The graph cannot answer for `scripts/build.js`, `AGENTS.md`, README/web, CLI or tests, which require active-text inspection and validation.

## Scope

### Includes

- **F1** [internal] — `scripts/rename-product-artefacts.js`, focused tests in `scripts/tests/rename-product-artefacts.test.js` (run with `node --test scripts/tests/rename-product-artefacts.test.js`): implement a reusable command/skill-only map, deterministic JSONL preview, stream/file summary separation, exact-preview apply and whole-batch stale/collision preflight; first run its own tests RED, then GREEN. Do not rename anything in this block. See design, Proposed Solution and Scope.
  - **Produces:** `rename-product-artefacts.js` deterministic preview JSONL and hash-checked apply
- **F2** [internal] — `workbench/skills/add-product-artefact-renaming/SKILL.md`, `workbench/provider-map.json`, `workbench/skills/add-framework-development/SKILL.md`, and `workbench/skills/add-framework-product-layer/SKILL.md`: document the tool's exact preview, selective reading, application and graph-check procedure; register/build the skill and make it the internal rule for product command/skill renames. Keep existing internal artefact identities. See design, Scope.
  - **Consumes:** `rename-product-artefacts.js` deterministic preview JSONL and hash-checked apply (F1)
- **F3** [product] — `framwork/provider-map.json`, `framwork/.codeadd/commands/add.*.md`, `framwork/.codeadd/skills/add-*/**`, `framwork/.codeadd/plugins/gitnexus/skills/add-gitnexus/**`, all active product command/skill/agent/fragment/template sources and `cli/src/plugins.json`: first add and run RED namespace, graph-ID, graph-edge and six-provider-output tests against the old tree; then use F1 through F2's preview/apply procedure to rename product identities and active exact references. Keep `commands/add.md`, agent/script identities and historical data. Update skill YAML name, `uses:` declarations, skill loads, `{{cmd:}}`/`{{skill:}}`, command handoffs and fragment basenames. Include the plugin catalog in the map rather than assuming every skill is in `provider-map.json`. See design, Proposed Solution.
  - **Consumes:** `rename-product-artefacts.js` deterministic preview JSONL and hash-checked apply (F1)
  - **Produces:** canonical product registry, source identities and active references
- **F4** [internal] — `scripts/build.js` and its focused tests: enforce product-only command/skill registry naming at build time and preserve graph extraction of the new identities; leave workbench identity rules unchanged. F3's generic build must pass before this block, and the new build-side regression must be observed RED before implementation. See design, Proposed Solution and Scope.
  - **Consumes:** canonical product registry, source identities and active references (F3)
  - **Produces:** six-provider build and emitted graph with canonical product identities
- **F5** [product] — `cli/src/features.js`, `cli/src/plugins.js`, `cli/src/injection-core.js`, `cli/src/installer.js`, `cli/src/updater.js` and affected `cli/tests/`: consume F3/F4's new names in build/placeholder/injection and upgrade flows. In `updater.js`, remove obsolete plugin-activated `add-gitnexus` directories even when absent from the old manifest, **before `applyEnabledPlugins`**, then reactivate `add--gitnexus`; do not delete unrelated user files. Prove plugin enabled/disabled and legacy update behavior. See design, Trade-offs & Risks.
  - **Consumes:** canonical product registry, source identities and active references (F3)
  - **Produces:** installed canonical command and skill paths
- **F6** [internal] — `README.md`, `AGENTS.md` (generated inventory via `node scripts/inventory.js`), `web/src/pages/index.astro`, `web/src/pages/docs.astro` and relevant `web/public/*.svg`: update current user-facing names and runtime references with the approved migration map, respecting the generated inventory and preserving historical records. Also update any active internal examples referencing the product namespace, without renaming internal artefacts. See design, Scope.
  - **Consumes:** canonical product registry, source identities and active references (F3)
- **F7** [product] — `cli/tests/` and graph-focused tests written RED in F3, alongside `framwork/.codeadd/artefact-graph.json` (build-emitted): rebuild and prove GREEN registry naming, six-provider outputs (including command-as-skill distinction), placeholder/injection parity, fresh install and upgrade, graph old IDs absent/new IDs present and handoff/skill/fragment edges maintained. Use the recorded RED evidence from F3; add a new test only after observing it RED against the pre-fix fixture. See design, Scope.
  - **Consumes:** installed canonical command and skill paths (F5)
  - **Consumes:** six-provider build and emitted graph with canonical product identities (F4)

### Does NOT Include

- Runtime aliases or preserved old files in new installs; historical delivery archives, backlog records and pre-existing user project docs remain intact.
- Renaming workbench identities, script/agent names, feature IDs or plugin IDs.
- General symbol refactoring or a universal content-replacement engine beyond product command/skill names.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| What are the namespaces? | Command `add-<name>`, skill `add--<name>`, root `add` unchanged | Design, Key Decisions |
| How do skill-only providers name entry points? | Command names stay single hyphen | Design, Proposed Solution |
| How are names migrated? | Internal preview/apply utility used in this migration | Design, Proposed Solution |
| Who validates preview? | Agent, with no extra human review; exact JSONL checked before write | Design, Proposed Solution |
| Should old names survive? | No aliases; remove stale paths on update, including plugin skill copy | Design, Key Decisions |

## Accepted Trade-offs

| We gain | We give up |
|---------|-----------|
| Clear cross-provider names and future safe rename tooling | Existing external scripts invoking old names need manual updates |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Preview corrupts history or applies stale changes | Medium | F1 tests exact token/path match, hashes, complete preview, collision, and no write on failed preflight |
| Existing GitNexus-enabled installs retain old plugin skill | High | F4 upgrade test with enabled GitNexus; remove only old plugin directory before reactivation |
| Fragment target renamed but content still references old skill | High | F3 migration plus F4/F6 tests across board, QA, TDD and plugin injection |
| Graph loses relationships | Medium | F6 graph assertions for direct dependencies, handoffs, plugin and injected fragments |
| Public docs and generated inventory drift | Medium | F5 inventory regeneration and active-reference scan; avoid archived paths |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `scripts/rename-product-artefacts.js`, `scripts/tests/rename-product-artefacts.test.js` | internal | create | F1 repeatable checked rename; run the dedicated Node test command |
| `workbench/skills/add-product-artefact-renaming/SKILL.md`, `workbench/provider-map.json`, development/product-layer skills | internal | create/modify | F2 teach and register internal use |
| `framwork/provider-map.json`, `framwork/.codeadd/commands/add.*.md` | product | rename/modify | F3 canonical commands |
| `framwork/.codeadd/skills/add-*/**`, `framwork/.codeadd/plugins/gitnexus/skills/add-gitnexus/**` | product | rename/modify | F3 canonical skills and references |
| `framwork/.codeadd/{agents,fragments,plugins,templates}/**` (active name-bearing files only), `cli/src/plugins.json` | product | rename/modify | F3 live uses/markers/catal­ogs |
| `scripts/build.js`, its focused tests | internal | modify | F4 product-only namespace enforcement and graph emission |
| `cli/src/{features,plugins,injection-core,installer,updater}.js`, `cli/tests/**` | product | modify | F3/F5/F7 install and compatibility verification |
| `README.md`, `AGENTS.md`, `web/src/pages/{index,docs}.astro`, `web/public/*.svg` | internal | modify if active names present | F6 user-facing references and generated inventory |
| `framwork/.codeadd/artefact-graph.json` | product | regenerate (gitignored sidecar) | F7 queryable post-rename graph |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level before the corresponding implementation and record a failing run; then drive it GREEN.

**Expected naming:** 14 product command registry entries: root `add` and 13 `add-<name>` entries; 44 registered product skills (verify count from registry at build time, not hardcode), all `add--<name>`; plugin `add--gitnexus`. All six providers output the same resource identities; skill-only providers emit command-as-skill `add-new`, skill `add--commit` in distinct directories. No old-name output, including plugin-activated copies after upgrade.

**Injection end-state map:** board feature injects into six commands (`add-brainstorm`, `add-new`, `add-plan`, `add-build`, `add-hotfix`, `add-done`); TDD into four (`add-plan`, `add-build`, `add-review`, `add-hotfix`); QA into three (`add-plan`, `add-build`, `add-review`); docs-pruning into `add-done`; GitNexus into seven (`add-new`, `add-plan`, `add-build`, `add-diagnose`, `add-hotfix`, `add-done`, `add-wiki`); Playwright into `add-review`. Keep original section counts from the emitted injection-points map and assert each target/section exactly once; do not hardcode an unverified section count.

### L1 — Unit and tool contract (RED → GREEN)

1. Utility preview emits deterministic JSONL to stdout with only summary on stderr; file mode writes JSONL to named path and stdout summary reports records, files and byte count. `apply --preview <file>` and `apply --preview -` consume exact preview; malformed/missing/changed records, stale hashes, destination collisions or out-of-scope paths fail with zero writes. Run `node --test scripts/tests/rename-product-artefacts.test.js`. *RED today: no utility exists.*
2. Registry identities, filenames and skill frontmatter follow the product naming rule, while workbench identities and root `add` remain unchanged. *RED today: dotted commands and single-hyphen skills.*
3. `{{cmd:}}`, `{{skill:}}`, agent preloads and plugin catalog resolve to new paths. *RED today: references carry old names.*

### L2 — Build, install and graph (RED → GREEN)

1. Product build emits all six provider trees and `artefact-graph.json` with new IDs, no old IDs and preserved typed relationships. Workbench build leaves its existing identities intact.
2. Fresh install carries only canonical paths. Old-manifest upgrade removes obsolete command/skill copies. A pre-upgrade GitNexus-enabled install removes its old plugin skill even if absent from the manifest; `updater.js` clears it before `applyEnabledPlugins` reactivates `add--gitnexus`.
3. Feature and plugin injected sections land on new command paths; injected placeholders resolve, disabling removes only their sections and leaves pristine command bytes. Test shared-anchor order and enable/disable round-trip.

### L3 — Combination matrix

Across the six providers and each supported feature/plugin state: assert all expected sections once, no unexpected sections, shared-anchor non-collision, partial disable preserving siblings, enable-order independence (where the implementation guarantees it), and complete enable/disable round-trip to baseline. Preserve existing unrelated behavior rather than turning the separate feature-order ticket 0007B into this delivery.

### L4 — Behavioural acceptance

1. Graph `impact` and `dependencies` answer for new IDs, including a renamed command, shared skill and plugin skill; fragments keep their `INJECTS_INTO`/`USES_SKILL` edges. Active docs and sources have no stale names except explicitly marked historical citations.
2. Utility preview is used for this very migration and saved locally only when output size requires; agent validates record count/paths before `apply`.

**RED expectations against the current tree:** L1 namespace/tool tests and L2 graph/installer tests fail; existing old-name tests may remain GREEN until retargeted. **GREEN = all levels pass after F1–F7.**

---

## Execution Order

1. F1 [internal] — RED/GREEN utility tests and implementation, no product changes.
2. F2 [internal] — register/write skill and internal usage rules; build workbench.
3. F3 [product] — record RED naming, graph and provider-output tests; preview and apply product migration.
4. F4 [internal] — add product-only naming gate to shared build and verify graph after F3.
5. F5 [product] — record RED update/injection tests, then distribution and cleanup changes.
6. F6 [internal] — user docs, active internal references and generated inventory.
7. F7 [product] — GREEN graph and end-to-end verification over rebuilt output.

F1 and F2 leave the product unchanged; F3 includes its registry, source and references together and must pass the generic build check. F4 enforces the canonical product names in the shared builder; F5 restores upgrade compatibility; F6 documents the final namespace; F7 is the final validation boundary. Each block has L1, L2, L3 or L4 proof above. Do not silently broaden 0007B's feature-order behavior.

## Reviewer Handoff

For each F-block the build leaves in its evidence file: files touched, validation levels and states, and any deferred/altered decision with the design section it departs from. Hunt for: RED tests recorded only after implementation; a plugin skill that survives an upgrade; a command-as-skill accidentally renamed like a normal skill; a fragment edge missing in the graph; history or internal artefact identities unintentionally rewritten.

## References

- `docs/brainstorming/2026-09-26T112831-product-artefact-names.md`
- `docs/deliveries/2026-09-24T004540-PLAN--zcode-sixth-provider/plan.md` — deferred ticket 0010B and shared Codex/ZCode output.
- `docs/deliveries/2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename/plan.md` — previous rename preserving historical records.

---

## Next Steps

/add-framework--build product-artefact-names

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-26 | Initial creation |
| 2026-09-26 | Separated the internal build block, named updater cleanup, moved graph/provider RED checks before migration, and specified the standalone Node test runner for the internal utility |
| 2026-09-26 | Made F4 a testable product-only naming gate instead of a validation-only commit |
