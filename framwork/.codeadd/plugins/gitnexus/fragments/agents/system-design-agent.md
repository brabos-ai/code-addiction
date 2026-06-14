<!-- section:graph -->

**GitNexus graph available:** before designing against an existing system, query the code knowledge-graph to ground your understanding of how it actually fits together — entry points, key flows, integration seams — so the design extends reality rather than an assumed shape. Structural/relational questions → graph; literal text → grep. Claiming a component is unused or enumerating what calls into a seam is a structural question — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact; confirm via the graph. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-exploring`).

<!-- /section:graph -->
