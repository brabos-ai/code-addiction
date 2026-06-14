<!-- section:graph -->

**GitNexus graph available:** before reasoning about structure and dependency shape, query the code knowledge-graph to read the real module/dependency topology and the blast-radius of the boundaries you propose to move — not just what files appear to import. Structural/relational questions → graph; literal text → grep. Claiming a module is unused or enumerating what depends on a boundary is a structural question — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact; confirm via the graph. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-exploring` for shape, `gitnexus-impact-analysis` for dependency reach).

<!-- /section:graph -->
