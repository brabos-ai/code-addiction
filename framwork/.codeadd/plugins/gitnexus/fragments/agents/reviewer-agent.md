<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph -->

**Pull the blast-radius from the graph before judging a change:** load skill `add-gitnexus` (resolving two intents there: **what is the merge risk of this change**, and **what depends on what it touches**) and enumerate every caller and dependent of what the change touches to assess merge risk and spot consumers (and missing test coverage) the diff alone hides. Structural/relational ("what depends on this change", "what else calls this") → graph; literal text → grep. Claiming a symbol is unused or enumerating its callers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

<!-- /section:graph -->
