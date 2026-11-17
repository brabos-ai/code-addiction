# Feature — the delivery-index `read` and the MCP `search` rank by whole-word BM25 and return a small, scored list

**Date:** 2026-11-16 · **Type:** feature · **Plan:** `2026-11-16T203957-PLAN--docs-search-precision` · **Release:** minor (v1.10.0) · **Backlog:** 0080F

## Summary
`delivered.cjs read` and the MCP `search` now share one ranking algorithm: whole-word or word-prefix matching with pt and en stopwords dropped, BM25, scores normalised to the first row, a ~200-character snippet, a relevance cut and a ~2,000-token budget that drops whole rows. A row is lean; the full record comes from `delivered.cjs get <id>` or the MCP `get`, each with its own size limit.

## Why
Matching was per-term substring, so `de` hit nearly every entry; each read cost 10–13 KB; nothing said how well a row matched.

## What changed
- **`search-rank-core.cjs`** and its ESM twin `mcp/rank.mjs`, held identical by a parity test.
- **`read`** prints `MATCHED`, `COLLAPSED`, `RETURNED`, `OFFSET`, `NEXT_OFFSET`, `STOP`; the six bucket keys and the full records are gone. **`get <id>`** is new. One row per supersession chain.
- **MCP `search`** returns `{matched, collapsed, returned, offset, next_offset, stop, hits}` with lean hits; `get` carries the rest and is bounded.
- **History** (graph and MCP) reads through `performHistoryRead`, an exact-node question off the text ranker.
- **`origin`**: `write` refuses the retired top-level folder; `verify --repair` rewrites it; `read`/`get` show the current path.
- Docs: `delivery-index.md` lists every tunable; `add--knowledge-discovery`, `add-hotfix` and the workbench graph skill read the new output.
- **Eval suite**: 20 bilingual queries over a versioned index snapshot — top-3 18/20 → 20/20, mean 14,159 → ~1,000 bytes per query, 12 → 0 flooding queries.

## Decisions worth knowing
- `MATCHED` counts after chain collapse; `cut()` gained a `reserve` option so the key lines stay inside the budget.
- The 8 cli failures seen locally: 5 are docker-environment (the container copy is not a git repo) and reproduce at the branch point; 3 were regressions fixed in the last commit.
