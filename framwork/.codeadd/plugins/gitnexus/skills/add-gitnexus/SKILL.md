---
name: add-gitnexus
description: Use when a task needs structural/relational code navigation — call graph, references, blast-radius, trace flows, safe refactors — and the GitNexus plugin is enabled. Routes intent to the native gitnexus-* skills.
---

# add-gitnexus

## Overview

GitNexus exposes a code knowledge-graph (calls, refs, blast-radius) over MCP, with native `gitnexus-*` skills that already document *how* to use each tool. This skill is a **thin dispatcher**: it maps the current intent to the right native skill. It does not reimplement MCP tools and has no fallback branch — when an intent matches, load the native skill and follow it.

## Resolve the repo first (multiple indexed repos)

GitNexus indexes repositories **by name** and serves them all from one MCP instance. When **more than one** repo is indexed, every tool (`query`, `context`, `impact`, `route_map`, …) requires a `repo` parameter — omitting it fails with:
`Error: Multiple repositories indexed. Specify which one with the "repo" parameter. Available: ...`

**Before the first gitnexus MCP call in a task, resolve the repo once:**

1. Call `list_repos`.
2. **One repo** → omit `repo` (single-repo calls need no disambiguation).
3. **Multiple repos** → select the entry for *this* project, in order:
   a. `path` equals the current repo root (`git rev-parse --show-toplevel`);
   b. else the `path` basename equals the repo-root basename (handles WSL/Windows path mismatch, e.g. `/mnt/c/...` vs `C:\...`);
   c. else the repo-root basename matches the git remote slug (`git remote get-url origin`);
   d. else **ask the user** which of the listed names to use — do not guess.
4. Pass the chosen `name` as `repo` on every gitnexus tool call for the rest of the task.

**Zero repos** → the project is unindexed: say so explicitly and fall back to grep (see Operating note).

## grep vs graph

- **Structural / relational** ("what calls X", "what breaks if I change X", trace a flow, map architecture) → **graph** (the native skills below).
- **Literal text** (find a string, a TODO, a config key) → **grep**. The graph is additive; grep keeps working unchanged.

## Intent → native skill

| Agent intent | Load native skill |
|--------------|-------------------|
| Map architecture, "how does X work", "what calls X", trace flow | `gitnexus-exploring` |
| Blast-radius, "what breaks if I change X", safe-to-edit | `gitnexus-impact-analysis` |
| Trace an error, "why does X fail" | `gitnexus-debugging` |
| Rename / extract / split / move safely | `gitnexus-refactoring` |
| Review a PR, assess merge risk | `gitnexus-pr-review` |
| Run GitNexus CLI (index / status / wiki) | `gitnexus-cli` |
| Graph schema / available tools | `gitnexus-guide` |

## Resolving an intent

**State what you must find out, then match it against the left column above.** The row you land on names the native skill to load.

```
⛔ A COMMAND NAME IS NOT AN INTENT:
  ⛔ DO NOT: Pick a native skill because of which codeadd command you were reached from
  ⛔ DO NOT: Stop at one native skill when the intent has two halves — blast-radius AND a
              trace to the source are two rows, and a triage run often needs both
  ✅ DO: Say the intent in one sentence, match it, and load what that row names
```

**This used to be a table keyed by command name**, pinning `add.plan` to blast-radius and `add.new` to exploration. It read as a shortcut and behaved as a ceiling: a planning run that needed to trace an error had the mapping pointing the other way, and the run followed the mapping. The intent a command arrives with varies per invocation; the command's name does not.

**A codeadd command still narrows what is USEFUL, and that is worth saying without pinning anything.** A discovery step usually arrives with "map this area"; a pre-edit step usually arrives with "what calls this symbol". Usually is not always, and the intent in hand wins over the tendency every time.

## Operating note

This skill assumes an **indexed graph**. Freshness is handled at `add.done` (re-index after significant changes), not here. If the graph returns nothing, the repo may be unindexed — **say so explicitly**, then proceed with grep; do not block.
