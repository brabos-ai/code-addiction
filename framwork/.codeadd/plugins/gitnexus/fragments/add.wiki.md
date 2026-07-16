<!-- section:graph-classify -->

**Before classifying apps, read the real topology from the graph:** load skill `add-gitnexus` and use community detection for functional areas, `route_map`/`tool_map` for entry points, and module/dependency edges for app boundaries — classify against actual structure, not only folder names and `package.json` deps. In a monorepo, `group_*` exposes cross-app dependencies the file tree hides. If the graph is empty or unindexed, say so explicitly and fall back to deps/folder signals — do not block.

<!-- /section:graph-classify -->

<!-- section:graph-dispatch-common -->

**Every analyzer dispatched below MUST run graph-first.** Append to each analyzer's dispatch prompt: load skill `add-gitnexus`, and base every structural claim (callers, dead-code, coupling, flows) on the graph — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance. Each analyzer's specific graph focus is in its own sub-section below. The graph grounds analysis and evidence gathering, but structural facts stay OUT of the written wiki page (§4 no-structural-facts rule) — cite the graph as *how* a claim was verified, never as content to enumerate (no caller lists, no import inventories). If the graph is empty or unindexed, the analyzer must say so and fall back to grep — do not block.

<!-- /section:graph-dispatch-common -->

<!-- section:graph-specialist -->

**Graph focus for app specialists — fold into the dispatch prompt by [TYPE]:** backend → trace request flows with `route_map`/`Process` (route → controller → service → repository) and document the real API surface and call paths; frontend → trace the component graph and render/data flow with `query` — composition, where hooks and state originate, what feeds props. Document patterns from the traced structure, not from file-name guesses, but write the *why* and the entry points into `domains/[TYPE].md` — leave the caller/dependency enumeration itself to the live graph.

<!-- /section:graph-specialist -->

<!-- section:graph-database -->

**Graph focus for the database analyzer — fold into its dispatch prompt:** for each entity, model, and repository, run `impact` to enumerate every consumer (queries, callers, services, migrations) so `domains/database.md` documents real data-layer coupling and what a schema change would break — not the schema in isolation. Record the coupling *pattern* (e.g. "repositories are the only writers; services never touch the ORM directly") in the page; point to `impact` for the current, exact consumer list rather than freezing it in prose.

<!-- /section:graph-database -->

<!-- section:graph-quality -->

**Graph focus for the code-quality analyzer — fold into its dispatch prompt:** use the graph for the checks grep cannot do — dead code (symbols with zero inbound callers via `impact`), circular dependencies (`cypher` cycle query over module imports), and god-objects / high coupling (outsized fan-in/fan-out). Report these in `docs/code-quality-review.md` with graph evidence (symbol + caller count), not heuristics. This report stays outside the wiki, so its structural findings are exempt from the wiki's no-structural-facts rule.

<!-- /section:graph-quality -->

<!-- section:graph-contract -->

**Derive the Architecture Contract from the graph, not assumptions:** before dispatching the context-files updater, query the real dependency edges (`cypher` over module IMPORTS) to establish the actual layer hierarchy and import rules, and flag any existing imports that violate them. The `## Architecture Contract` must reflect how the code actually depends, not the intended design. If the graph is empty or unindexed, say so and derive from imports via grep — do not block.

<!-- /section:graph-contract -->
