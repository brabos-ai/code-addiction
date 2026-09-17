<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph -->

**Check blast-radius in the graph before editing a function or signature:** load skill `add-gitnexus` (resolving two intents there: **what breaks if this changes**, and **how do I restructure it safely**) and enumerate every caller and dependent so changes stay safe and refactors run against real references, not text matches. Structural/relational → graph; literal text → grep. Claiming a symbol is unused or enumerating its callers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph -->
