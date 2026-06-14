<!-- section:graph -->

**GitNexus graph available:** before proposing UX changes, query the code knowledge-graph to trace the real frontend flows — screens, navigation paths, and the components a user journey actually traverses — so recommendations map to how the interface is built. Structural/relational questions → graph; literal text → grep. Claiming a screen or component is unused or enumerating what a journey traverses is a structural question — grep alone misses barrels/reexports, dynamic imports, and indirect composition, so it is not sufficient evidence of reach; confirm via the graph. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-exploring`, frontend-scoped).

<!-- /section:graph -->
