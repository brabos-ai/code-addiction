<!-- section:graph -->

**GitNexus graph available:** before mapping a new feature's terrain with Glob/Grep, query the code knowledge-graph to surface modules, key call paths, and entry points fast. Structural/relational questions ("what calls X", "how does this flow reach the handler") → graph; literal text search → grep. Claiming a symbol is unused or enumerating its callers is a structural question — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact; confirm via the graph. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-exploring`).

<!-- /section:graph -->
