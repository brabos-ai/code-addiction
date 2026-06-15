<!-- section:graph-map -->

**Before forming the questionnaire, map the feature's terrain via the graph:** load skill `add-gitnexus` and surface the modules, key call paths, and entry points it touches — do not open the questionnaire on a grep-only picture. Structural/relational questions ("what calls X", "how does this flow reach the handler") → graph; literal text → grep. Claiming a symbol is unused or enumerating its callers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence. If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block.

<!-- /section:graph-map -->
