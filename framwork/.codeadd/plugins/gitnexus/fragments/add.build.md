<!-- uses:
- skill: add-gitnexus
-->

<!-- section:graph-build -->

**Before editing a function or signature — or grading how risky a task is — ask the graph who calls it:** load skill `add-gitnexus` and enumerate every caller and dependent of the symbols this task changes, so the change and any dispatch brief run against real references, not text matches. **Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails. If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block.

<!-- /section:graph-build -->
