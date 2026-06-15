<!-- section:graph-impact -->

**Before editing, map the blast-radius of every symbol you will change:** load skill `add-gitnexus`, run `impact` to enumerate callers and dependents, and keep the fix minimal to what the graph shows is reachable — a hotfix shipped without this is incomplete. Grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block.

<!-- /section:graph-impact -->
