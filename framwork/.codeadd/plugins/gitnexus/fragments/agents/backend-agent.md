<!-- section:graph -->

**Check blast-radius in the graph before editing a function or signature:** load skill `add-gitnexus` (→ `gitnexus-impact-analysis` for blast-radius, `gitnexus-refactoring` for safe restructuring) and enumerate every caller and dependent so changes stay safe and refactors run against real references, not text matches. Structural/relational → graph; literal text → grep. Claiming a symbol is unused or enumerating its callers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

<!-- /section:graph -->
