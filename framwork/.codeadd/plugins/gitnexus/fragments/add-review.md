<!-- uses:
- skill: add--gitnexus
- skill: add--knowledge-discovery
- script: get-main-branch.cjs
- agent: reviewer-agent
-->

<!-- section:graph-fresh -->

**Check the graph once, before the first GitNexus call of this review:** run `gitnexus status --json` from the repo root. `status: "up-to-date"` → query. `status: "stale"` → run `gitnexus analyze --skip-agents-md` from the repo root, then query. An `error` key, output that is not JSON, or no `status` → follow `add--gitnexus § Freshness`; never block on it. The check is the command's, once, before any reviewer is dispatched — a dispatched agent never runs `status` or `analyze`.

<!-- /section:graph-fresh -->

<!-- section:graph-review -->

**Ask the graph what the whole diff affects, once, before dispatching reviewers:** load skill `add--gitnexus` and run `detect_changes` with `scope: "compare"` and `base_ref` set to the main branch printed by `node .codeadd/scripts/get-main-branch.cjs` (exit 0). On exit 1 or 2, skip `detect_changes`, say why, and keep the path-based GRAPH step above as the only graph input. `compare` runs `git diff <base_ref>`, so it covers committed, staged and unstaged changes to tracked files in one call; untracked files are outside it — when `FILES_TO_REVIEW` has any, they stay covered only by the path-based GRAPH step, and the block below says so. Never use `scope: "all"` alone: it returns nothing on a clean tree.

1. Run `impact` with `summaryOnly` only on the symbols `detect_changes` ranks high risk; page deeper answers with `limit`/`offset` (`add--gitnexus § Small answers`).
2. Send the files of the changed and impacted symbols that the path-based GRAPH step did not already ask about to the same **GRAPH question** — *which delivered work items last changed these files?* — resolved in `add--knowledge-discovery`'s action table. Name no action here.
3. Print one block in chat: (a) the affected symbols and processes with the risk summary, (b) the deliveries that touched those files — `none` or `NOT VERIFIED` plus the reason, as that skill reports it — and (c) one freshness line from the check above.
4. Pass that block as `GRAPH_IMPACT` in every `@reviewer-agent` dispatch payload of STEP add-review.dispatch. Do not write it into `review-NNN.md`.

If the graph is empty or unindexed, say so explicitly and fall back to grep — do not block. Do not enumerate callers symbol by symbol.

**Repo first:** if more than one repository is indexed, call `list_repos` once, pick this project's entry, and pass it as `repo` on every GitNexus call — a call without `repo` fails.

<!-- /section:graph-review -->
