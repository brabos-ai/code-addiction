<!-- section:graph -->

**GitNexus graph available:** before judging a change, query the code knowledge-graph for the blast-radius of what it touches — every caller and dependent — to assess merge risk and spot consumers (and missing test coverage) the diff alone hides. Structural/relational questions ("what depends on this change", "what else calls this") → graph; literal text → grep. Mechanics: load skill `add-gitnexus` (routes to `gitnexus-pr-review` and `gitnexus-impact-analysis`).

<!-- /section:graph -->
