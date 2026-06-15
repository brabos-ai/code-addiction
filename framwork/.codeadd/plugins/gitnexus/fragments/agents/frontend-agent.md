<!-- section:graph -->

**Trace the component graph before building or changing UI:** load skill `add-gitnexus` (→ `gitnexus-exploring`, frontend-scoped) and follow render/data flow — which components compose, where hooks and state originate, what feeds props — so reuse and changes follow the real structure. Structural/relational → graph; literal text → grep. Claiming a component or hook is unused or enumerating its consumers is structural — grep alone misses barrels/reexports, dynamic imports, and indirect composition, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

<!-- /section:graph -->
