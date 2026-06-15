<!-- section:graph -->

**Trace every consumer in the graph before changing an entity, schema, or repository:** load skill `add-gitnexus` (→ `gitnexus-impact-analysis`) and enumerate the repositories, queries, callers, and migrations that touch it so a column or model change does not silently break consumers. Structural/relational ("what reads this entity", "who calls this repository") → graph; literal text → grep. Claiming a column or repository method is unused or enumerating its consumers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

<!-- /section:graph -->
