<!-- section:graph -->

**Read the real topology from the graph before reasoning about structure:** load skill `add-gitnexus` (→ `gitnexus-exploring` for shape, `gitnexus-impact-analysis` for dependency reach) and check the actual module/dependency graph and the blast-radius of any boundary you propose to move — not just apparent imports. Structural/relational → graph; literal text → grep. Claiming a module is unused or enumerating what depends on a boundary is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

<!-- /section:graph -->
