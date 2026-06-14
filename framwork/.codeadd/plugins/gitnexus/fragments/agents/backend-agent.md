<!-- section:graph -->

**GitNexus graph available:** when planning a change, assessing impact, or before editing a function or signature, query the code knowledge-graph for its blast-radius — every caller and dependent — so changes stay safe, and use it to plan refactors against real references rather than text matches. Structural/relational questions → graph; literal text → grep. Claiming a symbol is unused or enumerating its callers is a structural question — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact; confirm via the graph. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-impact-analysis` for blast-radius, `gitnexus-refactoring` for safe restructuring).

<!-- /section:graph -->
