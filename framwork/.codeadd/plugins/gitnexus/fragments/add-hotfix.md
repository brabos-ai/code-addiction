<!-- uses:
- skill: add--gitnexus
- skill: add--knowledge-discovery
-->

<!-- section:graph-fresh -->

**Check the graph once, before the first GitNexus call of this run:** run `gitnexus status --json` from the repo root. `status: "up-to-date"` → query. `status: "stale"` → run `gitnexus analyze --skip-agents-md` from the repo root, then query. An `error` key, output that is not JSON, or no `status` → follow `add--gitnexus § Freshness`; never block on it. This slot sits in STEP add-hotfix.context, the one step both the normal path and the resume at the review pass through, so the reviewer a resumed run dispatches also queries a checked graph. The check is yours, once — a dispatched agent never runs `status` or `analyze`.

<!-- /section:graph-fresh -->

<!-- section:graph-impact -->

**Before editing, map the blast-radius of every symbol you will change:** load skill `add--gitnexus`, run `impact` — `summaryOnly` first, then paged with `limit`/`offset` (`add--gitnexus § Small answers`) — to enumerate callers and dependents, and keep the fix minimal to what the graph shows is reachable — a hotfix shipped without this is incomplete. Grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block.

**Bridge to delivery history:** the files of the symbols `impact` returned go to `add--knowledge-discovery`'s GRAPH step as one **GRAPH question** — *which delivered work items touch these files?* Resolve it in that skill's action table; name no action here. Deduplicate against what STEP add-hotfix.delivery-index already asked. Carry the hits from STEP add-hotfix.implement to the blast radius that STEP add-hotfix.review-input assembles.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph-impact -->
