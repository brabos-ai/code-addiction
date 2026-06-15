<!-- section:graph-trace -->

**Before hypothesizing a cause, trace the call paths in the graph:** load skill `add-gitnexus` and follow refs / blast-radius from the symptom to its source instead of guessing. Grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of where a symptom originates. If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block.

<!-- /section:graph-trace -->
