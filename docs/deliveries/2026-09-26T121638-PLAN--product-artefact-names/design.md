# Brainstorm: Product command and skill names

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-26
> **Type:** architecture
> **Ticket:** 0010B

## Objective

Make product command and skill names visibly distinct and valid across the supported providers: commands use `add-<name>` and skills use `add--<name>`, with no compatibility aliases. Preserve the existing root command `add` and internal workbench names.

## Discovery

- `framwork/provider-map.json` currently registers dotted product commands and single-hyphen skills. Codex, Antigravity and ZCode emit commands under skill-shaped paths; the resource kind, not the output directory, must determine the name.
- `framwork/.codeadd/skills/add-resource-path-convention/SKILL.md` documents `{{cmd:}}` and `{{skill:}}`; `scripts/build.js` resolves both, while the CLI separately resolves injected fragment placeholders.
- The artefact graph confirms direct callers and fragment injection for central commands. For example, `add.plan` is called by `add`, `add.build`, `add.diagnose`, `add.new`, `add.review` and injected into by board, QA, TDD and GitNexus fragments. `add-doc-schemas` has direct consumers across commands, fragments, agents and skills. Plugin skill `add-gitnexus` is consumed by command and agent fragments.
- The delivered ZCode provider plan deliberately deferred framework-wide renaming. The delivered product-pipeline-parity plan records a no-alias removal precedent. Delivery-index history was unavailable (`delivered.sh` exited 127); these plan findings come from archived plan documents, not the index.

## Context & Motivation

Ticket 0010B began with the dot in command names, which ZCode does not accept as a native command name. The chosen convention also makes the distinction between entry-point commands and auxiliary skills visible when a provider renders both as skills. Agents will need a repeatable and inspectable rename operation for this delivery and later product artefact renames.

## Problem / Opportunity

The current product registry, source names, frontmatter, relationships, feature/plugin wiring, build output, installation and user documentation all depend on the existing names. Replacing only filenames would strand references and undermine future graph impact queries. Manual file-by-file edits make a broad rename easy to miss.

## Proposed Solution

Use a product-wide, no-alias rename. Map every registered non-root command `add.<suffix>` to `add-<suffix>`, and every product skill `add-<suffix>` to `add--<suffix>`; include plugin-bundled skills such as `add-gitnexus`. Keep `add`, agent names, script names, feature/plugin identifiers, internal command/skill identities and historical records unchanged. A command emitted as a `SKILL.md` for a provider retains its **command** name (`add-new`, never `add--new`). Update the product source tree, registry, frontmatter, typed `uses:` declarations, placeholders, handoffs, fragments and their filenames, plugin/feature catalog entries, build/CLI matching logic, installer migration, tests and current public docs. Rebuild the graph so its new node IDs and relationships describe the new names.

Create a reusable **internal** bulk-rename utility and a companion internal skill before running this migration. The utility derives candidate mappings from the product registry and plugin skill catalog, accepts an explicit override map, and accepts only the explicit command/skill rename scope. It first produces a deterministic dry-run preview as JSONL to stdout or a chosen file; each record states operation kind (file move or occurrence edit), path, old/new names, and a small before/after excerpt where applicable. In stream mode JSONL alone goes to stdout and the summary goes to stderr; in file mode JSONL goes to the chosen file and the summary goes to stdout. The summary reports record count, affected-file count and JSONL byte size (and the output path when written), so an agent can choose selective reads instead of loading a huge preview. Apply accepts that exact JSONL via a file path or stdin, verifies complete and unaltered preview records, source hashes and destination conflicts across the whole batch before the first write, and aborts without writes on failed preflight. No user review is required between preview and apply: the agent reads and validates the report. Limit automated replacements to explicitly named active paths and structured contexts; do not mutate archived deliveries, backlog history or unrelated substrings.

Alternatives considered:

| Option | Benefit | Cost | Choice |
|---|---|---|---|
| Keep dotted product commands and use provider-local mapping | Small migration | Preserves an inconsistent public naming contract | Reject |
| Rename commands only | Addresses ZCode's dot restriction | Does not distinguish commands from skills in skill-only providers | Reject |
| Rename both namespaces using the internal preview/apply utility | Consistent identity and repeatable migration | Larger coordinated build and installer change | Choose |

## Type of Artefact

Architecture change across product commands, skills and distribution, plus one internal utility and its usage skill.

## Scope

### Includes

- Product command/skill source and registry names, including plugin skills; internal artefacts retain their identities.
- All active relationships (`uses:`), runtime references, fragments, plugin/feature registration, provider build output, CLI installation and current user-facing docs that depend on the names.
- An internal utility and skill, built first and used for this delivery; the utility may change both product sources and the active internal tooling/docs that *refer to* product names, but must not rename internal artefact identities.
- TDD red/green for the utility contract (deterministic JSONL, exact-preview apply, stale-hash and destination-conflict rejection, zero writes on failed preflight), naming, build, installation/update, feature/plugin injection, placeholder resolution and the generated artefact graph. A failing test must be observed before making the implementation pass.
- Regression checks that enforce the command/skill namespaces for future registrations, including command-as-skill provider output; tests adjust to the new names.

### Does NOT Include

- Aliases or parallel legacy command/skill copies in a new install.
- Renaming the workbench commands/skills, agents, scripts, feature/plugin IDs, historical changelogs, archived plans, backlog entries or previously authored project documents.
- General-purpose code refactoring beyond named product command/skill renames in the first utility version.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Commands use one hyphen, skills two, and `add` remains | visibly distinct identities | Consistent even when a provider represents a command as a skill | ✅ |
| No aliases; clean old installed artefact paths, including plugin-activated skill copies, during upgrades | one canonical public name | Prevents ambiguous invocation and stale entries outside the install manifest | ✅ |
| Keep internal artefact identities as-is | bounded migration of published names | Internal workflow is not the product namespace | ✅ |
| Build and use an internal rename utility and internal usage skill in this delivery | reliable repeatable product renames | One checked transformation rather than manual per-file edits | ✅ |
| Registry-derived map with explicit overrides, JSONL dry-run and stale-input checks on apply | agent-verifiable bulk changes | Preview can be read selectively and cannot silently drift before apply | ✅ |
| Test red then green, including emitted graph relationships | future graph impact fidelity | Naming and relationships stay enforced rather than depending on memory | ✅ |

## Ecosystem Impact

The `Called by` entries below come from direct `impact --depth 1` graph queries; the table groups files changed under one contract rather than asserting that one sample lists every consumer. The migration's generated preview must enumerate every renamed member and the plan must query each affected node before implementation. The graph cannot see registry/build/CLI code, README/web, `AGENTS.md` or tests: inspect those as active text and verify with targeted tests. For injected commands, inspect each `INJECTS_INTO` fragment separately and query that fragment's dependencies; a command's dependency query alone misses them.

| Component (layer) | Called by (graph, direct) | Impact | Action |
|-------------------|---------------------------|--------|--------|
| Product commands `add.plan`, `add.build` | `add.plan`: `add`, `add.build`, `add.diagnose`, `add.new`, `add.review`, board/QA/TDD/GitNexus fragments, agents and skills; `add.build`: `add`, `add.done`, `add.new`, `add.plan`, `add.qa-setup`, `add.review`, board/QA/TDD/GitNexus fragments, agents and skills | Central handoffs, injections and public invocation change | Update all direct callers and fragment filenames/targets; inspect fragment dependencies |
| Other product commands (`add.audit`, `add.brainstorm`, `add.diagnose`, `add.done`, `add.hotfix`, `add.new`, `add.pull-request`, `add.qa-setup`, `add.review`, `add.ux`, `add.wiki`) | Verified with direct graph queries: command/agent/skill handoffs and fragments where present; `add.ux` has no direct graph dependant | Names, source paths and references change | Use per-node impact plus fragment query in the migration preview; update referenced active paths |
| Product skills `add-doc-schemas`, `add-final-report`, `add-commit`, `add-id-convention`, `add-qa`, `add-tdd` | `add-doc-schemas`: commands, agent, fragment and skills; `add-final-report`: commands and skills; `add-commit`: `add.build`, `add.pull-request`, `add.review`, `add-subagent-driven-development`; `add-tdd`: TDD fragments and `add-test-specification`; remaining direct callers verified by graph | Preloaded skills and runtime paths change | Update frontmatter, declarations, agent skills and resolved paths |
| Other registered product skills, including `add-resource-path-convention`, `add-ecosystem` | Direct callers queried from the graph; some skills have none; `add-resource-path-convention` is called by `add-doc-schemas` | Skill IDs, examples and documentation change | Apply registry-derived mapping and check each node's direct callers |
| Plugin skill `add-gitnexus` (product) | GitNexus command and agent fragments; plugin container via `CONTAINS` | Plugin activation and injected skill name change | Map plugin registry/catalog, bundled path and consumers explicitly |
| Root `add` (product) | No direct graph dependant | Its own name stays; its outgoing handoffs change | Update handoffs only |
| New internal rename utility and skill | Not yet nodes; NOT VERIFIED before implementation | They are new internal tooling, not distributed | Register/build in workbench, document invocation and preview/apply contract |
| `framwork/provider-map.json`, `scripts/build.js`, `cli/src/`, current docs and tests | NOT VERIFIED — non-artefact files have no graph nodes | Distribution and update behavior must follow new names | Scan active files and run build, CLI and documentation checks |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Cross-provider stable names and a visible command/skill distinction | Existing invocations and external automation using old names need updating |
| Repeatable, inspectable bulk renaming | The tool and its tests add internal maintenance |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| An installed update retains an obsolete named file | Med | Test old-manifest → new-manifest update: old paths removed and new paths present; remove old plugin-activated skill directories before plugin reactivation even when absent from the manifest, and test an old install with GitNexus enabled |
| Feature/plugin injection still targets dotted filenames | High | Rename fragment filenames/catalog keys and test enabled/disabled installations across providers |
| Text replacement corrupts history or partial name matches | Med | Restrict active paths and exact resource tokens; preview excerpts and hash-checked apply; test collision/ambiguous-name cases |
| New graph IDs lose direct relationships | Med | Rebuild graph and test old IDs absent, new IDs present, handoffs, skill edges and fragment dependencies preserved |
| Preview too large for agent context | Med | JSONL file output, record count and byte size, selective reading by path/offset |

## Next Steps

Run: `/add-framework--plan product command and skill naming migration (ticket 0010B)`
