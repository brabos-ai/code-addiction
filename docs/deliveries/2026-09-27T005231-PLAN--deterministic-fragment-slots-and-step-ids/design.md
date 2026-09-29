# Brainstorm: Deterministic fragment slots and stable STEP IDs

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-27
> **Type:** architecture
> **Tickets:** 0007B, 0014B

## Objective

An installed ADD prompt is assembled deterministically from the framework's source and the enabled features and plugins, regardless of the order in which they were enabled. Every injection location has an explicit fallback, and optional workflow steps have stable, readable IDs instead of position-dependent numbers.

## Discovery

- `cli/src/injection-core.js` groups points sharing an anchor only within one injection call. `insertBlockAfterAnchor` inserts the next feature immediately after the anchor, so activating features in reverse order reverses their blocks. Ticket 0007B records the observable `add-plan` failure.
- `scripts/build.js` extracts marker locations and emits `injection-points.json`. Markers disappear from provider output; the sidecar currently contains points, not explicit slots or fallback data.
- `cli/src/features.js`, `cli/src/plugins.js`, `cli/src/installer.js`, and `cli/src/updater.js` inject incrementally. Update overwrites shipped prompts and then reapplies enabled features and plugins from the manifest; it can therefore use the new representation without converting old installed prompt bodies.
- Product commands and agents carry feature/plugin markers. The graph confirms injected fragments for `add-plan` from tdd-pipeline, qa-pipeline, board and gitnexus, and plugin fragments for agents including `backend-agent` and `qa-agent`. Ticket 0014B records the missing group fallback.
- `workbench/skills/add-framework-development/SKILL.md` already teaches marker authorship. An additional internal skill can own slot/fallback/STEP-ID authoring and validation; `workbench/provider-map.json` registers it for the internal providers.
- The `add-plan` source currently lists the qa marker before the tdd marker at the shared step-list anchor. The migration must reverse them to place test-spec before qa-spec when source marker order becomes authoritative.

## Context & Motivation

The framework alone authors distributed prompts. Each release supplies a complete new source and generated provider output; users do not manually edit those prompts. The current incremental insertion algorithm makes the bytes of a prompt depend on toggle history and leaves an empty anchor when no member contributes. Numbered optional steps also force renumbering and can produce confusing cross-references when fragments are combined.

## Problem / Opportunity

An anchor identifies where text can be inserted, but not which ordered set of contributors owns that location or what should appear when none contributes. Fragment sections with positional STEP numbers are coupled to an optional composition order. An absent or invalid enabled fragment should warn and degrade gracefully, without preventing the rest of the framework from working.

## Proposed Solution

Declare a named slot around every existing product-layer feature/plugin marker pair in command and agent sources. One source example (illustrative syntax; the parser and skill settle its exact grammar):

```markdown
STEP add-plan.analyze-scope: Analyze scope
<!-- slot:plan-specs fallback="fallbacks/plan-specs.md" -->
<!-- feature:tdd-pipeline:step-list -->
<!-- /feature:tdd-pipeline:step-list -->
<!-- feature:qa-pipeline:step-list -->
<!-- /feature:qa-pipeline:step-list -->
<!-- /slot:plan-specs -->
STEP add-plan.consolidate: Consolidate the plan
```

The slot ID is unique within its target resource. Its opening and closing markers delimit **the replaceable source region**; only member marker pairs may appear between them. Member order inside the region is canonical. The preceding stable line is the insertion anchor (the existing build extractor's anchor rule); the following stable line is the drift hint. The build rejects ambiguous, nested or overlapping slots and absent/mismatched marker pairs. The generated sidecar names resource, slot ID, ordered `(namespace, name, section)` members, source anchor and drift hint, and fallback content. Because the installed output has no markers, runtime reconciliation does **not** attempt to rediscover an old span in it: it starts from a saved pristine provider resource for that release, inserts each resolved slot at its recorded anchor in reverse resource order, and writes the complete newly assembled resource. The builder verifies uniqueness and reference validity in the resulting supported combinations. Relative fallback paths resolve from the product source `.codeadd/` root; file bytes may be empty and a file may serve several slots.

Fallback source files are **build inputs only**, not extra installed files: the builder embeds their contents in `injection-points.json`, which is already a packaged sidecar. The release asset test must demonstrate that an installed CLI can render fallback without access to the source directory. No new source-directory packaging contract is needed.

### Approved fallback mapping and assembled examples

The shared `add-plan` step-list slot is the only nonempty fallback in this delivery. Its source file contains exactly one instructional line: `No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.` Every other migrated slot declares an explicit **empty** fallback file; empty files may be shared. This line describes the optional *step list*, not the overall plan: the base command still runs its area subagents and consolidates the plan. In `add-plan`, the existing QA self-check near the consolidation heading must stop inferring that qa-pipeline is disabled solely from an absent QA-spec heading: an enabled but invalid member also leaves that heading absent and triggers a CLI warning. Make the self-check distinguish disabled state from failed activation, and do not claim a disabled QA axis when the manifest still requests it.

The source example above renders the following **complete slot region**. The fixed lines before and after it are shown to make the result unambiguous. The test-spec and qa-spec labels below are the contents of their `step-list` fragment sections after the STEP-ID migration:

| Manifest and runtime state | Installed command excerpt between the same fixed lines |
|---|---|
| tdd off, qa off | `STEP add-plan.analyze-scope: Analyze scope`<br>`No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.`<br>`STEP add-plan.consolidate: Consolidate the plan` |
| tdd on, qa off | `STEP add-plan.analyze-scope: Analyze scope`<br>`STEP tdd-pipeline.test-spec: Generate contract test cases`<br>`STEP add-plan.consolidate: Consolidate the plan` |
| tdd off, qa on | `STEP add-plan.analyze-scope: Analyze scope`<br>`STEP qa-pipeline.qa-spec: Generate the QA specification`<br>`STEP add-plan.consolidate: Consolidate the plan` |
| tdd on, qa on (enabled in **either** order) | `STEP add-plan.analyze-scope: Analyze scope`<br>`STEP tdd-pipeline.test-spec: Generate contract test cases`<br>`STEP qa-pipeline.qa-spec: Generate the QA specification`<br>`STEP add-plan.consolidate: Consolidate the plan` |
| tdd on, qa on but qa payload unavailable | The same excerpt as **tdd on, qa off**, plus a CLI warning naming qa, resource and slot; both manifest flags stay on so the next update can retry. |

For an agent, the existing `backend-agent` GitNexus marker becomes a single-member slot with `fallback="fallbacks/empty.md"`. With GitNexus off, its built agent body reads `Before the slot\nAfter the slot` — **no extra blank line or plugin guidance**. With GitNexus on and valid, it reads `Before the slot\n<GitNexus graph section>\nAfter the slot`; this target is rendered only for providers supporting agents. That illustrates the intentionally empty case. `fallbacks/empty.md` can serve every slot whose no-member result is nothing. Product skills are not injection targets in the present system; their active references to command STEPs still migrate when applicable.

The installer and updater save pristine copies of each newly copied provider resource that owns slots under an ADD-managed baseline store. They capture those copies **before** applying any features or plugins. Update replaces both the installed provider resource and its saved baseline with the release's new version. Enable/disable and install/update always render the *entire affected resource* from that saved baseline plus the current desired manifest state, never from previously injected text; they do not need old fragment bytes to remove an old member. Baselines are ADD-owned generated files, not user edits; the installer/updater track and prune them with the installed resource set. If a required baseline is missing or unreadable, warn and leave that resource unchanged rather than guessing which bytes to erase; update restores it from the new release. The CLI resolves each slot's complete desired content from the enabled feature/plugin state, valid fragment sections and fallback. It composes every valid enabled member in marker order; when none can contribute, it renders the fallback (including the valid empty fallback). A runtime member is invalid when its declared fragment file is missing, its named section is missing or malformed, or its payload cannot be resolved; the CLI checks every enabled sidecar member even when a fragment directory contains no file. It warns with member, slot and resource, skips only that member, and retains the requested enabled state in the manifest so a later update retries it. If another member contributes, that member remains. This warning policy applies to slot composition, not to the separate plugin external-tool detection/activation gate, whose existing behavior remains. The source/build fail hard for invalid authored declarations; the installed CLI's runtime warning policy is deliberately different.

Every distributed product command migrates its workflow STEP labels and in-prompt references to stable readable IDs: `STEP add-plan.analyze-scope` for a base step, `STEP tdd-pipeline.test-spec` and `STEP qa-pipeline.qa-spec` for injected steps, and `STEP gitnexus.check-impact` for a plugin step. The owner prefix identifies the command, feature or plugin; the subject identifies the action. A step has the same ID in its overview and detailed body, distinct from section names such as `step-list` and `step9`. The build validates uniqueness in each assembled command and checks references across supported feature/plugin combinations. Source order and explicit instructions still determine execution order; IDs never encode position. The migration covers any distributed product text that refers to the changed STEP labels. Internal workbench commands keep their existing numbering.

An internal `add-framework-injection` skill teaches authors to declare slots, choose fallbacks and STEP IDs, update fragment sections, and verify combinations. Internal plan/build guidance loads it when a change touches feature/plugin injection. The skill does not ship to users.

### Alternatives considered

| Approach | Benefit | Why not chosen |
|----------|---------|----------------|
| Sort blocks alphabetically while keeping incremental insertion | Small CLI change | Alphabetical order cannot express workflow order; it does not define fallback or a complete desired state. |
| Hand-maintained JSON registry of groups and order | Structured metadata | Splits the composition contract from the command/agent markers and makes drift easy. JSON remains a generated sidecar. |
| Inline fallback body in each command or agent | No separate source file | Duplicates fallback text and prevents deliberate reuse across slots. |
| Short hashes or numerical STEP IDs | Compact labels | They convey less task meaning to an LLM and make authoring and cross-references harder to inspect. |

## Type of Artefact

Architecture: product build and CLI composition, distributed command/agent/fragment migration, and an internal authoring skill.

## Scope

### Includes

- Migrate **all** feature and plugin injection points in distributed product commands and agents to explicit slots, including single-member locations. Each slot has an explicit fallback file, which may be empty or shared.
- Define the slot/fallback grammar in source, validate it at build, and emit deterministic sidecar data with embedded fallback content; package the sidecar and test fallback from a release asset without source files.
- Save a pristine per-provider baseline of every slot-bearing resource on install/update; render the whole affected resource from that baseline on toggles, so removing a member never depends on finding its old payload.
- Reconcile slot contents from enabled state on install, update, enable and disable, without insertion-order effects; preserve manifest intent on a warned runtime failure.
- Migrate STEP labels and references in every distributed product command, injected fragment, and affected distributed reference to owner-qualified readable IDs. Validate duplicate and dangling IDs across supported combinations.
- Add the internal `add-framework-injection` skill and hook it into the internal planning/build authoring path.
- Cover feature/plugin combinations, both toggle orders, shared slots, partial disable, re-enable, empty and shared fallbacks, warnings, provider output, install/update parity and complete round-trip to the expected baseline.

### Does NOT Include

- Renumbering or changing STEP IDs in internal `workbench/` commands.
- Keeping an old slot/marker format or converting old prompt bodies in place after update replaces them.
- Changes to the board's business behavior or unrelated command semantics.
- Silently treating a missing/invalid enabled member as a successful injection.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Reconcile each slot from the desired enabled state | history-independent installed bytes | One composition rule covers install, update and toggles | ✅ |
| Order all valid enabled members by source marker order | deterministic optional step execution | Workflow order is visible where the slot is authored | ✅ |
| Put group/slot metadata beside member markers; generate JSON | one source of truth | Authored metadata and injection order cannot drift into separate registries | ✅ |
| Use a separate `fallback="fallbacks/<file>.md"` source file, shareable and possibly empty | explicit no-member result | Reusable fallback is distinguishable from an absent fragment | ✅ |
| Embed fallback text in the packaged sidecar and persist pristine provider baselines on install/update | removal even when old fragment files are missing | Every toggle re-renders from known clean bytes; no old installed span has to be located | ✅ |
| Warn at runtime, skip invalid member, keep manifest state, use fallback only when no valid member remains | usable framework with retryable activation | A broken optional fragment cannot block the rest of the installation | ✅ |
| Fail the framework build for invalid authored slot declarations | known-good releases | Authoring errors are caught before they reach users | ✅ |
| Migrate every product command STEP label to owner-qualified semantic IDs | stable optional workflow references | IDs identify tasks rather than positions; internal commands remain out of scope | ✅ |
| Migrate every product command and agent injection location in this delivery | one consistent composition path | No stranded agent-only incremental injection logic | ✅ |
| Add an internal authoring skill | future fragment consistency | Authors have one place for declaration, ordering and verification rules | ✅ |

## Ecosystem Impact

| Component (layer) | Called by / dependants | Impact | Action |
|-------------------|------------------------|--------|--------|
| `product/command/add-plan` | Graph direct dependants: `add`, `add-build`, `add-diagnose`, `add-new`, `add-review`, several agents and skills; injected by board, qa-pipeline, tdd-pipeline and gitnexus fragments | Its shared step-list is the concrete ordering defect; numbered references also spread through its body | Reorder tdd before qa markers, convert slots and STEP IDs; verify the graph's full direct list in planning |
| Other distributed product commands with injection markers (`add-brainstorm`, `add-build`, `add-done`, `add-hotfix`, `add-new`, `add-review`, `add-wiki`, `add-diagnose`) | Graph lists direct callers per command and incoming injecting fragments; full per-command graph roster is a plan input, NOT VERIFIED in this design | Slot/STEP migration and cross-references | Inventory each marker, fragment and direct caller in the plan; migrate together |
| Product agents with plugin markers (`architecture-agent`, `backend-agent`, `database-agent`, `discovery-agent`, `frontend-agent`, `qa-agent`, `reviewer-agent`, `system-design-agent`, `ux-agent`, `ux-flow-agent`) | For `backend-agent`, graph direct callers include `add-build`, `add-plan`, qa-pipeline add-build, cross-sf-consistency and subagent-driven-development; remaining per-agent rosters NOT VERIFIED | Plugin injection must use the same slot mechanism | Convert each agent marker and its plugin fragment; record each direct caller in the plan |
| Product fragment sources under `fragments/` and `plugins/*/fragments/` | Inject into the commands/agents named by their markers; graph confirms these `INJECTS_INTO` edges | STEP IDs, section matching and ordered composition | Update fragments and references while keeping existing dispatch contracts |
| `scripts/build.js`, `framwork/.codeadd/injection-points.json` (product build and generated sidecar) | Read downstream by CLI injection; non-artefact files have no artefact-graph caller inventory | Slot extraction, validation and embedded fallback data | Extend build and emitted schema; validate expected end-state map and release asset |
| `cli/src/injection-core.js`, `features.js`, `plugins.js`, `installer.js`, `updater.js` (product) | Install, update and toggles; CLI files have no artefact-graph caller inventory | Replace per-feature append semantics with baseline-based desired-state composition | Persist/prune baselines, preserve manifest intent; exercise every entry path |
| Internal skill `add-framework-injection` and internal plan/build guidance | New skill has no callers until registered and loaded by internal workflow; current direct callers NOT VERIFIED | Teach source, fragment and test conventions | Add source, register with workbench, build the workbench |

Graph scope note: fragment-injected behavior cannot be inferred from a command's outgoing dependency query alone. Query each incoming fragment's dependencies when mapping dispatches. The artefact graph does not enumerate CLI files, sidecar fields or generated provider outputs; inspect those directly during planning.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|------------|
| Byte-stable prompt assembly and explicit fallbacks | Small incremental injection changes in isolation; each change now reconciles affected slots |
| Human/LLM-readable step identifiers | Short numeric headings and their familiar visual order |
| One authored representation for commands and agents | A wider one-time source/build/CLI/fragment migration |

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A previously injected member persists after a toggle or update | Med | Render from pristine provider baseline rather than installed bytes; test disabling a member whose fragment file has since gone missing, plus full disable/re-enable and install/update equality |
| A broken enabled member is reported as active but supplies no prompt text | Med | Warn with resource, slot and member; retain manifest intent and use fallback only if no other valid contributor exists |
| A STEP reference outside a command still names the old number | High | Inventory product command, fragment and reference text; validate IDs and run combination tests on generated providers |
| A sidecar/source mismatch or missing fallback ships | Med | Build-time grammar, source-path and end-state-map validation; fail the build |
| All-combinations checks become expensive | Med | Check structural invariants for every slot and meaningful toggle combinations for every affected provider; require reversed-order byte equality for shared slots |

## Next Steps

After review and explicit approval, formalize tickets 0007B and 0014B as one coordinated plan using this design. The plan MUST record direct graph dependants for every affected product artefact, then inspect the dependencies of each incoming injecting fragment separately to capture fragment-origin dispatches. It must inventory all injection points and STEP references and assert the complete expected end-state map across namespaces, resources and sections. Do not implement during brainstorm.
