<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph -->

**Trace the real frontend flows in the graph before proposing UX changes:** load skill `add-gitnexus` (resolving the intent there, frontend-scoped: **which screens, navigation paths and components does this journey traverse**) and follow the screens, navigation paths, and components a user journey actually traverses so recommendations map to how the interface is built. Structural/relational → graph; literal text → grep. Claiming a screen or component is unused or enumerating what a journey traverses is structural — grep alone misses barrels/reexports, dynamic imports, and indirect composition, so it is not sufficient evidence of reach. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph -->
