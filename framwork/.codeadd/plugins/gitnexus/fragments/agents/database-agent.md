<!-- section:graph -->

**GitNexus graph available:** before changing an entity, schema, or repository, query the code knowledge-graph for everything that touches it — repositories, queries, callers, migrations — so a column or model change does not silently break consumers. Structural/relational questions ("what reads this entity", "who calls this repository") → graph; literal text → grep. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-impact-analysis`).

<!-- /section:graph -->
