<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph -->

**Read the real topology from the graph before reasoning about structure:** load skill `add-gitnexus` (resolving two intents there: **what shape does this area actually have**, and **what reaches across a boundary I propose to move**) and check the actual module/dependency graph and the blast-radius of any boundary you propose to move — not just apparent imports. Structural/relational → graph; literal text → grep. Claiming a module is unused or enumerating what depends on a boundary is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph -->
