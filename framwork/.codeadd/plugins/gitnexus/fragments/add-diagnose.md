<!-- uses:
- skill: add--gitnexus
- skill: add--knowledge-discovery
-->

<!-- section:graph-fresh -->

**Check the graph once, before the first GitNexus call of this run:** run `gitnexus status --json` from the repo root. `status: "up-to-date"` → query. `status: "stale"` → run `gitnexus analyze --skip-agents-md` from the repo root, then query. An `error` key, output that is not JSON, or no `status` → follow `add--gitnexus § Freshness`; never block on it.  The check is yours, once — a dispatched agent never runs `status` or `analyze`.

<!-- /section:graph-fresh -->

<!-- section:graph-trace -->

**Before hypothesizing a cause, trace the call paths in the graph:** load skill `add--gitnexus` and follow refs / blast-radius from the symptom to its source instead of guessing; call `impact` with `summaryOnly` first, then page with `limit`/`offset` (`add--gitnexus § Small answers`). Grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of where a symptom originates. If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block.

**Bridge to delivery history:** the files of the symbols the trace reached go to `add--knowledge-discovery`'s GRAPH step as one **GRAPH question** — *which delivered work items touch these files?* Resolve it in that skill's action table; name no action here. The hits join `RELATED_WORK`, deduplicated against what STEP add-diagnose.knowledge-base already asked.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph-trace -->
