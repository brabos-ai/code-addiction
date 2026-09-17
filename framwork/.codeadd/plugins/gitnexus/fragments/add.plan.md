<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph-plan -->

**Before dispatching planning subagents, establish the blast-radius via the graph:** load skill `add-gitnexus` and confirm the callers, dependents, and dead-code of the entities and modules this plan touches, so the plan sizes the real change surface — not a grep approximation. Finding reference files to reuse → grep is fine; establishing what a change breaks (callers / dead-code / impact) → the graph is required, because grep misses DI-by-token, barrels/reexports, dynamic refs, and inheritance. If the graph is stale, re-analyze first; if it is empty or unindexed, say so explicitly and fall back to grep — do not block.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph-plan -->
