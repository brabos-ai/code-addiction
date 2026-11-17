<!-- uses:
- skill: add--gitnexus
- script: get-main-branch.cjs
-->

<!-- section:graph -->

**Get the blast-radius from the graph before judging a change:** load skill `add--gitnexus` (intents: **what is the merge risk of this change**, **what depends on what it touches**). When the dispatch carries `GRAPH_IMPACT`, start from it and do not re-query what it answers. Otherwise run `detect_changes` once with `scope: "compare"` and `base_ref` set to the base the dispatcher gave, else the main branch printed by `node .codeadd/scripts/get-main-branch.cjs` (on exit 1 or 2, skip `detect_changes`, say why, and fall back to grep) — never `all` alone, because a build commits once per F-block and its final audit sees a clean working tree, where `all` returns nothing. `detect_changes` replaces enumerating callers symbol by symbol; use `impact` with `summaryOnly` only to drill into a symbol it flagged (`add--gitnexus § Small answers`). Use the result to assess merge risk and to spot consumers and missing test coverage the diff alone hides. Never run `gitnexus analyze` or `gitnexus status` — freshness is the dispatching command's job. Structural/relational → graph; literal text → grep. Claiming a symbol is unused or listing its callers is structural — grep alone misses DI-by-token, barrels/reexports, dynamic refs, and inheritance, so it is not sufficient evidence of impact. If the graph returns nothing or is unindexed, say so and fall back to grep — do not block.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph -->
