<!-- section:graph -->

**GitNexus graph available:** when planning or changing an entity, schema, or repository, query the code knowledge-graph for everything that touches it — repositories, queries, callers, migrations — so a column or model change does not silently break consumers. Structural/relational questions ("what reads this entity", "who calls this repository") → graph; literal text → grep. Claiming a column or repository method is unused or enumerating its consumers is a structural question — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact; confirm via the graph. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-impact-analysis`).

<!-- /section:graph -->
