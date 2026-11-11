# Agent git safety, and indexing everything the framework composes

> **Plan:** `docs/plans/2026-09-12T221117-PLAN--agent-git-safety-and-dynamic-artefact-indexing.md`
> **Date:** 2026-09-13
> **Layers:** both

## Why

Framework v1.0.1 was exercised on a live project. Two independently dispatched `@test-agent` runs
executed `git stash` against a working tree shared with sibling agents running in parallel. Nothing
was lost, and neither agent was careless — both needed to tell *a failure I caused* from *a failure
that was already there*, and the framework sanctioned no way to do it.

Investigating why nothing surfaced that exposed a second problem: the artefact graph was blind to
every composable part of the product layer, so the dispatch that caused the incident was invisible to
the tool built to answer "who dispatches this".

## Agents

- **`test-agent`** — new `## Git and the Shared Tree` section. The prohibition is stated by its
  reason ("do not remove work from the tree — sibling agents run in parallel against it") with the
  commands as examples rather than as the rule, the path-scoped substitutes (`git diff -- <path>`,
  `git show HEAD:<path>`), and an exit route: a failing test that is not yours goes to `CONCERNS` and
  stops there. `KNOWN_FAILURES` and `CONCERNS` added to its input and report contracts. Frontmatter
  untouched — it keeps Bash, which it needs to run `TEST_COMMAND`.
- **`plan-review-agent`, `prompt-review-agent`** — each carried a private copy of the graph-query
  rule, and the two disagreed on which interface to use. Both now point at `add-artefact-graph`.

## Skills

- **Added `add-artefact-graph`** (internal) — the single owner of graph querying: all eleven verbs,
  which interface implements each, and a permanent section naming what the graph cannot see.
- **`add-subagent-driven-development`** — the Subagent Prompt Template's git line covered only the
  commands that create history (`add`, `commit`, `tag`) while its own stated reason ("You leave your
  work in the tree") already covered the ones that remove work from it. It now covers both.
- **`add-framework-product-layer`** — stopped telling the framework's own builder to baseline flaky
  tests with `git stash`; it now uses a throwaway worktree, and says why a path-scoped read cannot
  answer "does the whole suite pass on a clean checkout".
- **`add-framework-development`, `building-commands`** — their partial verb tables became pointers.

## Scripts

- **`task-brief.sh`** — optional 4th argument `KNOWN_FAILURES`. Three states stay distinguishable:
  three arguments render `not supplied`, an empty 4th renders `none observed`, a filled one renders
  the failures. An agent that reads "nobody passed the field" as "the tree is clean" stops
  investigating exactly when it should not. No baseline suite run is introduced — the field carries
  only failures the coordinator has already observed.

## The graph

`scripts/build.js` now indexes what it composes, not only what ships unconditionally:

| | Before | After |
|---|---|---|
| Node kinds | 6 | 9 — `template`, `feature`, `plugin` added |
| Nodes | 216 | 227 |
| Edges | 782 | 860 |
| Edge types | 6 | 7 — `CONTAINS` added |
| Fragments declaring | 0 of 24 | 23 of 24 |

- **Fragments declare.** `fragment` joined `DECLARING_KINDS`, so the undeclared-reference gate reaches
  them. `SNIFFABLE_KINDS` deliberately did not — nothing loads a fragment by name.
- **A plugin's bundled skills are indexed.** `add-gitnexus` ships, installs and runs, and no gate,
  search or orphan check had ever seen it.
- **Templates are indexed**, and land in `orphans` because nothing references them. That is the
  finding, not a defect to suppress.
- **A feature and a plugin have a node**, derived from the directory layout rather than from CLI
  source. `dependencies` on one answers what enabling it touches.
- **`CONTAINS` is kept out of the orphans calculation**, in both `scripts/graph.js` and
  `mcp/engine.mjs`. Counting it would give every file under `fragments/` or `plugins/` a permanent
  inbound edge, and nothing there could ever be reported as dead weight again.

## Commands and docs

`add.build` passes `KNOWN_FAILURES`; the four `add-framework--*` commands gained a route to the graph
for a question their inline verb lists could not reach; `CLAUDE.md` records the new owner and stops
naming a partial verb list of its own.

## Not included

The harness permissions artefact; tool restrictions on the other read-write agents (on Claude Code,
13 of 22 have none — `readonly:` is not emitted by that dialect); `transforms/` as a node kind, since
`release.yml` does not package it; and deleting the four templates nothing references.

## What the review pass changed

Fourteen auditors read the finished delivery — three scopes plus the eight-item ruler on every `.md`
command, skill and agent in the diff. 34 findings: 18 applied, 16 rejected with a recorded ruling.

Two were worth the pass on their own:

- **A node snapshot had been red for five commits.** `cli/tests/build-artefact-graph.test.js` pins the
  kind counts, and the suite was last run before the new internal skill landed. The gap is
  structural, not an oversight: an internal F-block's validation is `node scripts/build.js` alone,
  and the suite covering build.js's own output lives in `cli/tests/`.
- **Seven graph warnings, against a zero baseline.** Six were declarations in the new skill its prose
  never names. The seventh had a better cause: `add-framework-development` nests a ```bash fence
  inside a ```markdown one, `fencedSpans` pairs fences sequentially, and the file's count
  desynchronised — so everything from line 716 to EOF was invisible to the prose sniffer, including
  the pointer this delivery had just added at 752. Widening the outer fence fixed the file and the
  warning together. It was a pre-existing bug that had been silently disabling the gate over the tail
  of a 750-line skill.

Two factual errors in the new skill were corrected: it claimed both interfaces answer identically,
which is false for `search`, `get`, `touched_by` and `reindex` — `scripts/graph.js` has no case for
them and exits 2. And its fragment-edge caveat gave a retrieval that does not work: `INJECTS_INTO`
runs fragment → command, so the answer takes two queries, not one.

Five validation levels the build had verified by hand were committed as tests — `L1.4`, `L2.1`,
`L2.2`, `L2.3`, `L2.5`. `L2.1` is the edge this delivery exists for.

## Also

`.claude/agent-memory/` is now gitignored. Subagents dispatched during a review write notes about the
checkout as they work; they accumulate per machine rather than per delivery, so tracking them would
put one agent's learning into another's review diff.
