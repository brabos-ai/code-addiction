<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph -->

**Trace every consumer in the graph before changing an entity, schema, or repository:** load skill `add-gitnexus` (resolving the intent there: **what reads this entity, and what breaks if its shape changes**) and enumerate the repositories, queries, callers, and migrations that touch it so a column or model change does not silently break consumers. Structural/relational ("what reads this entity", "who calls this repository") → graph; literal text → grep. Claiming a column or repository method is unused or enumerating its consumers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph -->
