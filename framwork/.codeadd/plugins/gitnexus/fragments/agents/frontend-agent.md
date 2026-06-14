<!-- section:graph -->

**GitNexus graph available:** when planning, building, or changing UI, query the code knowledge-graph to trace the component graph and render/data flow — which components compose, where hooks and state originate, what feeds props — so reuse and changes follow the real structure. Structural/relational questions → graph; literal text → grep. Claiming a component or hook is unused or enumerating its consumers is a structural question — grep alone misses barrels/reexports, dynamic imports, and indirect composition, so it is not sufficient evidence of impact; confirm via the graph. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-exploring`, frontend-scoped).

<!-- /section:graph -->
