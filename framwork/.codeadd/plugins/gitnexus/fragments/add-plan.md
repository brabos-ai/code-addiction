<!-- uses:
- skill: add--gitnexus
- skill: add--knowledge-discovery
-->

<!-- section:graph-fresh -->

**Check the graph once, before the first GitNexus call of this run:** run `gitnexus status --json` from the repo root. `status: "up-to-date"` → query. `status: "stale"` → run `gitnexus analyze --skip-agents-md` from the repo root, then query. An `error` key, output that is not JSON, or no `status` → follow `add--gitnexus § Freshness`; never block on it. `status` and `analyze` index the repo and put no code in any agent's context, so this does not break the no-code-before-history rule. The check is yours, once — a dispatched agent never runs `status` or `analyze`.

<!-- /section:graph-fresh -->

<!-- section:graph-plan -->

**Before dispatching planning subagents, establish the blast-radius via the graph:** load skill `add--gitnexus` and confirm the callers, dependents, and dead-code of the entities and modules this plan touches, so the plan sizes the real change surface — not a grep approximation. Call `impact` with `summaryOnly` first, then page the depths you need with `limit`/`offset` (`add--gitnexus § Small answers`). Finding reference files to reuse → grep is fine; establishing what a change breaks (callers / dead-code / impact) → the graph is required, because grep misses DI-by-token, barrels/reexports, dynamic refs, and inheritance. If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block.

**Bridge to delivery history:** the files of the symbols `impact` returned go to `add--knowledge-discovery`'s GRAPH step as one **GRAPH question** — *which delivered work items touch these files?* Resolve it in that skill's action table; name no action here. The hits join `RELATED_WORK`, deduplicated against what STEP add-plan.recent already asked.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph-plan -->
