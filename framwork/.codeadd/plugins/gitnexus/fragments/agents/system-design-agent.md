<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph -->

**Ground the design in the real system via the graph before proposing:** load skill `add-gitnexus` (resolving the intent there: **what are the entry points, the key flows and the integration seams this design must extend**) and trace entry points, key flows, and integration seams so the design extends reality, not an assumed shape. Structural/relational → graph; literal text → grep. Claiming a component is unused or enumerating what calls into a seam is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

<!-- /section:graph -->
