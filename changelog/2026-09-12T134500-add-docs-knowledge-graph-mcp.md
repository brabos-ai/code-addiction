# Docs knowledge graph MCP — the product layer gets a typed graph over its own documents

**Date:** 2026-09-12
**Plan:** `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp`
**Layer:** both (15 product blocks, 5 internal, plus 3 cross-layer repairs)

codeadd's knowledge layer was write-as-you-go. `docs/delivered.jsonl` gained its first
line at the first `/add.done` after install, so a project with history already behind
it started blind and stayed blind. Half the bootstrap existed: `/add.wiki` generates
code knowledge from the repository on day one, and the delivered-work half had no
equivalent.

The measurement that reframed the work: a real installation of 32 work items already
carried close to four hundred relationship edges, written by real runs and read by
nothing.

## Why

**The relationships were already on disk and nothing could walk them.** 255 `{{doc:ID}}`
body references across 28 of 32 documents, 134 ids in `related:` frontmatter, 15 of 19
`related.md` files carrying an explained relationship, 18 of 19 carrying a real file
list. Between two delivered documents there were zero edges a program could follow.

**`related.md` was not about relationships.** The `hotfix-related` schema was TL;DR,
Impacted Files, Impacted Docs and Follow-ups. `/add.hotfix` gathered a human-confirmed
set of related features, carried it across seven steps, and filed it in a document
whose schema is a file list.

**The internal layer already had what the product layer wanted.** `artefact-graph.json`
plus `scripts/graph.js` plus an MCP server over both. That asymmetry is the motivation,
and closing it meant this repository could start running the exact binary it ships.

## What changed

### The document format

A relationship lives in the document body as a typed wikilink, in the plain-markdown
convention the wider ecosystem parses. `## Relations` carries `- <type> [[<id>]]` over
a closed four-value vocabulary: `caused_by`, `depends_on`, `part_of`, and `links_to`
for an edge recovered mechanically whose intent nobody recorded. `## Observations`
carries `- [<category>] <text>` lines. `tags:` joins the universal frontmatter.

`related:` is untouched and gains one role: migration input. No document already on
disk becomes invalid.

The `hotfix-related` schema retires and `templates/related.md` is deleted. Both of
`related.md`'s filled sections were harvested rather than discarded — Follow-ups into
`## Relations`, Impacted Files into the node's file set, which is what answers "what
touched this file" on the day a project upgrades rather than from its first new
delivery.

### The reader

`mcp/` at the repository root: a corpus registry, two parsers, a query engine and a
stdio JSON-RPC server, with no dependency at all. One binary serves two corpora
selected by `--corpus`, so `scripts/artefact-graph-mcp.js` is retired rather than left
standing beside a second implementation.

Eleven actions: `search`, `get`, `impact`, `dependencies`, `neighbors`, `path`,
`touched_by`, `orphans`, `stats`, `reindex` and `history`. The design named ten;
`history` is the eleventh because the retired server exposed it and deleting that
server without it would have taken a working capability away.

Membership is decided by the `type:` frontmatter key and never by a path glob. A real
`docs/` holds the user's own material beside codeadd's, and a glob needs an exclusion
list somebody maintains forever.

### Distribution

The server travels inside the existing `codeadd` npm package and runs through `npx`, so
nothing lands in the user's tree and nothing enters their lint run. `scripts/build.js`
mirrors `mcp/` into the package, the release workflow's publish gate covers it, and
both `install` and `update` write the MCP registration into each selected provider's
own configuration in that provider's own shape.

### Migration

One mechanical, additive-only entry in the CLI migration registry harvests the edges
already on disk. It never deletes, never rewrites a line the user wrote, does not
commit, and skips any file carrying no `type:` key. Ids resolve against the documents
on disk rather than through a reordering rule; one that resolves to nothing produces no
line and is reported.

`/add.done` refuses to close a delivery whose document carries an empty TL;DR or no
relation. Without that gate the format decays into an optional section nobody fills,
which is exactly what happened to the template it replaces.

## Breaking

- **`## Relations` is new and every reader depends on it.** `related:` stays readable
  and the migration is additive, so no existing document becomes invalid — but a
  document written before this delivery carries no typed relation until `codeadd update`
  runs.
- **`related.md` is no longer written by anything.** Existing files are left on disk
  untouched and are still read for their Impacted Files. The `hotfix-related` schema is
  retired and `templates/related.md` is deleted.
- **`/add.hotfix` runs 14 steps, not 16.** STEP 12 wrote `related.md`; its cross-update
  wrote by hand an edge the graph now derives. The two validation gates fold into one.
- **`add-knowledge-discovery` runs 9 steps, not 8.** GRAPH enters at position 2 and
  steps 2 through 8 became 3 through 9.

## Migration

1. `npx codeadd update` — it writes the MCP registration, runs the harvest and reports
   what it found, including every id that resolved to no document.
2. Review the diff. The migration does not commit: reviewing it is the judgement the
   CLI cannot make.
3. `npx codeadd mcp --corpus=docs --action=orphans` lists what the harvest could not
   reach — a work item with no relation, or with no TL;DR to reject it by. That is the
   work queue, and `/add.done` keeps it from growing.

Rollback: the migration only ever added lines. Reverting the diff restores the previous
state exactly, and removing the MCP entry from a provider's configuration disables the
server without touching any document.
