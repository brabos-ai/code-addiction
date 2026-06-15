<!-- section:graph -->

**Query the graph before mapping terrain with grep:** load skill `add-gitnexus` (→ `gitnexus-exploring`) and surface modules, key call paths, and entry points first. Structural/relational questions ("what calls X", "how does this flow reach the handler") → graph; literal text → grep. Claiming a symbol is unused or enumerating its callers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

<!-- /section:graph -->
