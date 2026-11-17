# Feature — with GitNexus on, one pass says what a change affects and which deliveries touched that area

**Date:** 2026-11-16 · **Type:** feature · **Plan:** `2026-11-16T205432-PLAN--gitnexus-integration` · **Release:** minor (v1.10.0) · **Backlog:** 0082F

## Summary
With the `gitnexus` plugin on, `add-plan`, `add-hotfix`, `add-diagnose` and now `add-review` check the graph with `gitnexus status --json` and re-index with `gitnexus analyze --skip-agents-md` when it is stale. The files the graph says a change affects go to the delivery-history question, so the deliveries that touched that area arrive with the impact. `add-review` runs `detect_changes` once over the diff and hands the result to every reviewer as `GRAPH_IMPACT`.

## Why
The code graph and the delivery index never met, the graph was queried stale, and our setup guidance (`gitnexus setup`, plain `analyze`) wrote hooks and `AGENTS.md`/`CLAUDE.md` blocks. The PolyForm Noncommercial license was shown nowhere.

## What changed
- `add--gitnexus`: Freshness and Small answers sections; `detect_changes` scope rule; only the six native skills `analyze --skip-agents-md` installs.
- Fragments for `add-plan`, `add-hotfix`, `add-diagnose`: new `graph-fresh` section, paged `impact`, the bridge. New `add-review` fragment (`graph-fresh`, `graph-review`). The reviewer fragment uses `GRAPH_IMPACT` or `detect_changes` with `compare`, and never runs `analyze` or `status`. `add-done` re-index uses `--skip-agents-md`.
- Command slots: `gitnexus.graph-fresh` in four commands, `gitnexus.graph-review` in `add-review`; `injects` gains `add-review`.
- Hints and `/add-setup`: manual MCP registration, no `gitnexus setup`, the license line. Docs site in EN and PT-BR.
- Tests: `gitnexus-plugin` L1.1–L1.10 (red first: 23 failing), L3 matrix in the round-trip suite, frozen counts and the slot-membership fixture updated.

## Decisions worth knowing
- The native `gitnexus-*` skills are kept (no hooks, no `AGENTS.md` block): `analyze --skip-agents-md` installs them.
- Fragments repeat the exact freshness commands rather than delegating to the skill — the plan requires it, and a prompt review suggested otherwise (rejected).
- `add-build`, `add-new`, `add-wiki` get no freshness check; the skill says "freshness unknown" there.
