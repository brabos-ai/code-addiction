# Brainstorm: A knowledge graph over delivered documents, served by one MCP over two corpora, with a two-vehicle brownfield migration

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-12
> **Type:** architecture
> **Layer:** product for every shipped artefact; internal for the build step, the release packaging and the retirement of `scripts/artefact-graph-mcp.js`

## Supersession

This document **replaces subtopics 002 and 006** of
`2026-09-12T075635-delivered-work-relationships-000-umbrella.md`. Neither was ever written, so
nothing on disk is invalidated.

The premise changed, which is why they are replaced rather than refined:

| Umbrella's premise | This document's premise |
|---|---|
| A relationship is a `rel` array inside the `delivered.jsonl` record, drafted in `related:` frontmatter | A relationship is a typed wikilink in the body of the markdown document, in a format the wider ecosystem already parses |
| The reader is a `.js` engine over the index, with an MCP wrapper | The reader is an MCP server over the documents, with the index demoted to a rebuildable cache |
| Migration is one opt-in command | Migration is two vehicles: a mechanical CLI migration, then an opt-in command |

Four umbrella decisions are directly affected. Each is named rather than left to inference:

| Umbrella decision | Treatment here |
|---|---|
| 3 — frontmatter drafts, index publishes, promotion runs one way at close-out | **Retired.** The document body is both draft and published record. There is no promotion step and therefore no divergence to arbitrate |
| 4 — a work item that has not closed does not appear in search | **Retired.** It was stated as "the honest price of decision 3", and decision 3 is gone. See decision 9 below: in-flight documents are visible and carry their `status` |
| 13 — the field is named `rel` on both surfaces | **Retired.** There is no `rel` field. The relationship is a `## Relations` section, and `related:` frontmatter stays readable only as migration input |
| 22 — the engine ships as `.js` with an MCP wrapper | **Kept, and widened.** Still `.js`, still a wrapper, and now one server over two corpora rather than two servers |
| 25 — vector search gets two reservations and nothing else | **Kept.** Its requirements are restated against this format in decision 22 below |

Subtopics 001, 003 and 005 of that umbrella are **unaffected and still stand**. 001 (the dead
changelog path) remains a prerequisite of this work for the reason it always was: an investigation
step that reads a file nothing writes cannot be the place a relationship is born.

Subtopic 004 (the wiki leg) is **narrowed, not retired**. Indexing the wiki as a second node kind
makes the delivery-to-page join derivable at read time from `sources` globs both sides already
carry, which puts 004's "record the join on both sides" half in question. Its "what a page then
carries" half stands untouched. This document does not settle that split, and nothing here blocks
004 from settling it.

## Discovery

Six facts from this repository decide most of what follows.

| What exists | Where | Why it decides something here |
|---|---|---|
| `artefact-graph.json`, built by `scripts/build.js` from `<!-- uses: -->` blocks | internal only | A working typed graph. Five edge kinds come from `uses:` blocks (`USES_SKILL`, `DISPATCHES`, `HANDS_OFF_TO`, `RUNS_SCRIPT`, `MENTIONS`); a sixth, `INJECTS_INTO`, comes from feature and plugin injection and is out of scope here. It is the shape to copy, and the product layer has no counterpart |
| `scripts/artefact-graph-mcp.js` | internal | A zero-dependency, no-SDK, stdio JSON-RPC MCP server in one file. Its header records the reason: the official SDK pulls 89 transitive packages to wrap seven small functions |
| The three graph gates in `build.js` | internal | Dangling target fails. A name in the text with no declared edge fails. Declared but never named warns. This asymmetry is why that graph does not rot |
| `cli/src/migrations.js` | CLI | An ordered, idempotent migration registry with a per-project ledger in `manifest.json`, `--list`, `--dry-run`, and a never-throws guarantee. Its one existing migration only ever walks roots the CLI itself installed |
| `related:` in the universal frontmatter of every doc schema | product | An untyped edge set **already written** in every existing user project. Free input for a mechanical migration |
| `cli/src/gitignore.js` and the `postEnableHint` of both plugins | CLI | `.codeadd/` is already inside a managed `.gitignore` block. And the CLI has never registered an MCP server: gitnexus and playwright both delegate that to the user |

Prior deliveries consulted through the index: only `add-doc-schemas` returns an entry
(`2026-09-08T121115-PLAN--plain-language-rule`, `live`), and it concerns voice rules, not
relationships. No `gone` or `superseded` entry exists in this area, so nothing here rebuilds
something the project already abandoned.

Third-party tools were surveyed rather than assumed. The survey is in **Proposed Solution**.

## Context & Motivation

A user installs codeadd into a project that already has history. They open `/add.new`,
`/add.plan`, `/add.hotfix` or `/add.brainstorm` with a demand. Before anything touches the code,
the agent should be able to answer one question cheaply: **what has already been built near this,
and what did it touch?**

Today that question has no cheap answer, and for a brownfield project it has no answer at all.

The knowledge layer codeadd ships is **write-as-you-go**. `docs/delivered.jsonl` gains its first
line at the first `/add.done` after install. A greenfield project fills it naturally over months.
A project with two hundred features already delivered starts blind and stays blind until it
re-delivers everything through the framework, which never happens.

Half the bootstrap already exists and works: `/add.wiki` generates code knowledge from the
repository itself, from zero, on day one. The delivered-work half has no equivalent.

**A human is not a search index.** They will not remember whether a feature exists, and they will
certainly not remember its id. That principle, carried over from the umbrella, is what sets the
bar: the agent collects and relates; the human steers.

## Problem / Opportunity

Five defects, each verified against the source.

1. **No graph exists over the documents the agents write.** `/add.done` writes four things: the
   changelog, the consolidated `decisions.jsonl`, surgical wiki edits, and one line in
   `delivered.jsonl`. None of them is a graph. The index is a flat list searched by keyword over
   its `words` field. The only pointer from one entry to another is `superseded_by`, which is part
   of the status, not a relationship. Between two delivered documents there are zero edges.

2. **A brownfield project gets an empty knowledge layer and no way to fill it.** The entry point is
   built: `add-knowledge-discovery` defines the procedure and six commands load it. Its INDEX step
   runs, finds nothing, notes "no delivery index yet", and every command falls through to a text
   sweep of `docs/`.

3. **Three relationship signals already exist, all untyped and all unread.** A real installation of
   32 work items carries 255 `{{doc:ID}}` references in document bodies, 134 ids in `related:`
   frontmatter lists, and one `superseded_by`. That is close to four hundred edges already written
   by real runs. No command reads any of them as a graph, and nothing distinguishes "depends on"
   from "mentions in passing". The graph is effectively drawn and nobody looks at it.

4. **`templates/related.md` is an orphan.** It is the only artefact in the repository shaped like a
   relationship table, and no command reads it. The graph does not model templates as nodes, so
   nothing even reports it as unused.

5. **Discovery cost scales with the size of the project.** To triage one symptom,
   `feature-history-agent` reads the first 30 to 50 lines of every `about.md`, then reads the full
   `about.md`, `changelog.md` and `plan.md` of the top ten. On a forty-feature project that is
   forty partial reads plus thirty full reads, and one of the three files it deep-reads does not
   exist at the path it looks for.

## Proposed Solution

Four parts: a document format, a reader, a distribution route, and a migration in two vehicles.

### Part 1 — The document format

The market has converged on a plain-markdown convention for exactly this, and codeadd adopts it
rather than inventing one. Every element below is ordinary markdown that renders correctly in any
viewer and parses with no library.

```markdown
---
id: 0053H
type: hotfix-about
slug: token-refresh
status: live
related: [0051F]
tags: [auth, token]
---

## TL;DR
The refresh shipped without an expiry test, so every session past one hour dropped.
(…the existing section keeps its current length; nothing about it changes.)

## Observations
- [cause] refresh shipped with no expiry test #auth
- [impact] every session past 1h dropped #auth

## Relations
- caused_by [[0051F]]
- part_of [[Authentication]]
```

**Two sections and one syntax construct are new:** `## Observations`, `## Relations`, and the
wikilink. Everything else already exists on disk today. `id`, `type`, `slug`, `status` and
`related:` are in the schemas and populated in every real installation inspected. `## TL;DR` is
already a required section, so this format does not introduce it; it only starts reading it. `tags`
is the one new frontmatter key.

**There is no `permalink`.** An earlier draft added one; the measured installation already carries
`id: 0012F` and `slug: compra-detalhada-itemizada`, so a third identifier would duplicate what
exists. `id` is the stable identity, and it is what decision 22 reserves for vector search.

**The TL;DR is the rejection surface, and `search` returns its first sentence.** The umbrella's
decision 14 established that an edge's `why` lets an agent discard a candidate *without opening the
document*; the TL;DR does that job for the node. It is not one line, though: across 29 measured
documents the section runs 41 words at the shortest, 107 at the median and 173 at the longest.
Returning it whole for ten hits costs roughly 1,500 tokens. So `search` returns the **first
sentence**, which is where the thesis sits, and the full section is available on a follow-up call.
No new field and no model is needed to produce it.

**What is indexed is decided by the frontmatter, never by the path.** Measured against a real
installation (`organize-my-finances`, 32 work items on a current framework version), `docs/` holds
codeadd's output and the user's own documents side by side: `brainstorm/`, `diagnose/`, `features/`
and `qa/` next to `chat-gpt/`, `images/`, `critical-findings.md` and
`telegram-assistant-prompts.md`. A path glob cannot separate them and would need an exclusion list
somebody has to maintain.

Every document codeadd writes carries a `type:` frontmatter key whose value is a schema name. That
same installation carries twenty distinct values, led by `feature-about` (32), `changelog` (28),
`hotfix-related` (19), `feature-review` (18) and `hotfix-about` (10). **A document with no `type:`
key is not indexed**, which is exactly what a user's own file looks like.

| Rule | Effect |
|---|---|
| `type:` ends in `-about` | **node, kind `work item`.** One per delivered work item |
| `type: reference` under `.codeadd/wiki/` | **node, kind `reference page`.** One per domain or spine page |
| any other recognised `type:` | attachment of the node in its directory, listed in every hit |
| no `type:` key | skipped, and reported once. The wiki's `index.md` lands here, correctly: it is a hub of links with no content of its own |

**The two corpora are separated declaratively, and the separation is safe because of one fact: the
`uses:` block is stripped at build.** A user's installed `.claude/commands/*.md` carries no edges at
all, so the artefact corpus exists only where the source does.

| | `artefacts` | `docs` |
|---|---|---|
| roots | `framwork/.codeadd/`, `.claude/` | `docs/`, `.codeadd/wiki/` |
| present when | `framwork/provider-map.json` exists | `docs/` exists |
| membership | registered in the provider map, or carries a `uses:` block | frontmatter carries a recognised `type:` |
| node id | `<layer>/<kind>/<name>` | the `id:` value |
| edges | the `uses:` block, five kinds | `## Relations`, `{{doc:ID}}`, `related:`, `superseded_by`, `sources` globs |
| index | the build's `artefact-graph.json` | `.codeadd/docs-index.json` |

Three rules govern it:

- **Two indexes, never merged.** The id namespaces do not collide and the questions differ:
  `product/command/add.done` and `0053H` do not belong in one graph
- **The flag selects, the probe validates.** `--corpus=artefacts` where `provider-map.json` is
  absent is an error naming the reason, never a silent empty result
- **An installed `.claude/` is never the artefact corpus.** The probe on `provider-map.json` is what
  prevents that, and it works because that file is not in the release ZIP. Without it the server
  would index dozens of edge-free commands and report an empty graph, which is worse than reporting
  that the corpus is absent

A third corpus later is a row in that table, not a redesign.

**The internal layer gets the artefact corpus and no docs corpus.** Its own working documents
(`docs/plans/`, `docs/deliveries/`) carry no YAML frontmatter at all: they use a blockquote metadata
block (`> **Status:** implemented`), so the membership rule skips every one of them. That is left
as is. The internal layer already answers "what was built near this" with `docs/delivered.jsonl`
plus `graph.js history`, and giving its plans frontmatter is a separate decision that changes a
deliberate house style. The asymmetry is recorded rather than hidden: the product layer gets a graph
over its work documents and the internal layer does not, and the fix, if it is ever wanted, is a row
in the corpus table.

**The wiki enters through the same rule, and brings three fields that were going to have to be
invented.** A measured domain page carries:

```yaml
type: reference
area: backend
description: How the @ofm/api Cloudflare Worker is built — Hono two-surface app...
sources: [apps/api/src/app.ts, apps/api/src/features/**, apps/api/wrangler.toml]
commit: a0c8873
tags: [hono, drizzle, multi-tenancy, ...]
```

- `description` is already a one-line summary, so a reference page needs no first-sentence
  derivation: decision 29 applies to work items only
- `area` is the grouping roadmap item 1.2 left open as "app, group or category". It is already
  written, so no taxonomy has to be invented
- `sources` is a list of code globs, which is the join to files

**The graph therefore carries two node kinds, and the edge between them is derived, never declared.**
Crossing a delivery's touched files against a page's `sources` globs yields the work-item-to-page
edge at read time. Both sides already hold their half on disk.

That has a consequence for umbrella subtopic 004, which exists to **record** the delivery-to-page
join that `add-wiki-maintenance` STEP 3 already computes and discards. If the join is derivable from
data both sides already carry, recording it is redundant. 004 is **narrowed rather than retired**:
its "what a page then carries" half stands; its "record the join on both sides" half is now open to
question. This document does not settle that, and computing the join does not block it.

**This brings the never-used-codeadd project back into scope.** A project with no `docs/features/`
has nothing for Vehicle 1 to convert, but `/add.wiki` generates the wiki from code in any
repository, and the wiki is in the graph. That user has a populated MCP on day one with no delivery
recorded at all.

**One work item is one node, anchored on its `*-about` document.** Its siblings are attachments. If
each file became a node, one feature would return as eighteen hits the consumer has to deduplicate,
and a `caused_by [[0051F]]` edge would have no single target: relations point at work items, never at
files. Attachments still travel in the result, so the agent knows what it may open next without a
second query.

**Both changelog layouts exist in the wild and both are read.** The measured installation writes
`changelog.md` inside each feature directory; `/add.done` writes `docs/changelog/CHG[NNNN].md`. The
indexer resolves either, and umbrella subtopic 001 owns reconciling which one is canonical.

**Ids are not only `[NNNN][L]`.** The same installation references
`BRN-compra-detalhada-itemizada` from a `related:` list. Decision 20's rule covers this without
change: an id resolves against the documents on disk or it produces no edge.

**Two brownfield cases, and only one is in scope.** A project that ran an earlier codeadd version has
`docs/features/` populated in the old shape, and that is what Vehicle 1 converts. A project that
never ran codeadd has no `docs/features/` at all, so there is nothing to convert: its bootstrap is
`/add.wiki` over the code, and the graph fills from the first delivery onward. Nothing here pretends
to reconstruct work items from git history.

**What each command must start writing, and how little that is.** Only two commands write a node
(`*-about`): `/add.new` and `/add.hotfix`. `/add.plan` reads `about.md` and writes `plan.md`, which
is an attachment. Everything else either consumes the graph or already writes what is needed.

| Command | Change | Size |
|---|---|---|
| `/add.hotfix` | the candidate set already confirmed at STEP 5.2 becomes `## Relations` in the `about.md`, typed `caused_by`. STEP 12 stops writing `related.md`; the `hotfix-related` schema retires | small; the data is already in hand |
| `/add.new` | the discovery step's index result becomes `## Relations`, typed `depends_on` or `part_of`, plus `tags:` | small |
| `/add.done` | the close-out gate and the index rebuild | medium |
| `/add.wiki` | nothing. `description`, `area` and `sources` already come out right | none |
| `/add.plan`, `/add.diagnose`, `/add.review`, `/add.brainstorm` | consume the graph only; they write no node | none on the authoring side |

**The relationship data already exists at the moment it is needed; it is simply not written down.**
`/add.hotfix` STEP 5.2 presents the candidate features with their ids, asks the user to confirm, and
states that it stores the confirmed set for STEP 12 and STEP 9. STEP 12 then writes `related.md`,
whose `hotfix-related` schema is TL;DR, Impacted Files, Impacted Docs and Follow-ups: a file list.
A human-confirmed relationship is gathered, carried across seven steps, and filed in a document that
is not about relationships. The change is routing, not new authoring work.

This keeps umbrella decision 12 intact: no relationship is born from human memory. The command runs
the query itself and writes what it found. Nobody is asked which feature a change depends on.

### Part 2 — The reader: one server, two corpora

An MCP server owned by codeadd, built on the shape that already works in this repository:
`scripts/graph.js` as the engine and `scripts/artefact-graph-mcp.js` as the transport. Same split,
same no-SDK rule, same reason.

**It serves both graphs, with the corpus selected by configuration.** The two graphs differ in
every dimension that matters, and share all of their machinery:

| | Artefact corpus (`--corpus=artefacts`) | Docs corpus (`--corpus=docs`) |
|---|---|---|
| Nodes | commands, skills, agents, scripts | delivered work items |
| Source | `framwork/.codeadd/` and `.claude/` | the user's `docs/` |
| Edge origin | the `<!-- uses: -->` HTML comment | the typed wikilink in `## Relations` |
| Question | what breaks if I change this artefact | what was already built near this |
| Who runs it | whoever develops the framework | whoever uses it |

A user has no commands to map. They consume built artefacts, not source, and the `uses:` block is
stripped at build and never reaches them. So the artefact corpus is meaningless in their project,
and the docs corpus is meaningless in this repository's own tooling. What is identical is
everything in between: parse a corpus, build a typed node and edge map, answer the same verbs over
stdio JSON-RPC.

One server over two parsers therefore **retires `scripts/artefact-graph-mcp.js`**, which becomes a
duplicate. The payoff is larger than the deletion: this repository starts running the exact binary
it ships, and the 76 artefacts already carrying declared edges, already guarded by three build
gates, become the best test corpus available, exercised on every build.

The cost is stated honestly: the artefact parser travels inside the published package as code no
user will run, and this touches internal tooling that works today.

**Third-party tools were surveyed against the constraints below, and none clears them.**

| Constraint | Where it comes from |
|---|---|
| Runtime `node >= 18`, nothing new | `delivered.sh` and `qa-preflight.sh` already declare node a hard dependency |
| No external server | The umbrella's HIGH risk: an MCP in a user's project needs setup the user must perform |
| No LLM API key | The user has a coding agent, not necessarily a raw API key, and per-ingestion cost is not acceptable for a default |
| Markdown in git stays the source of truth | The documents are the deliverable; an index that owns them inverts that |
| Never required | Decision 24 of the umbrella: every leg degrades |

| Tool | Runtime | Server | LLM key | Graph | Licence | Stars | Verdict |
|---|---|---|---|---|---|---|---|
| Basic Memory | Python | none | no | yes, typed relations in markdown | AGPL-3.0 | 3.9k | Wrong runtime, copyleft. **Its format is adopted; the tool is not** |
| Cognee | Python | none, file-based | **required** | yes | Apache-2.0 | 30.6k | Per-ingestion LLM cost |
| Graphiti | Python | FalkorDB or Neo4j | **required** | yes, bi-temporal | Apache-2.0 | 30.8k | Server plus key |
| DocGraph | Node | none, SQLite | no | yes | MIT | **0** | Exactly the right shape. Created 2026-07-04, never touched again |
| qmd | Node 22 | none | no, ~2GB local models | **none** | MIT | 17 | Search only, no graph |
| knowledge-mcp | Python | none | required | yes | MIT | 58 | Stale since 2026-02 |

Adopting Basic Memory's **convention** while writing our own reader is what keeps both doors open.
The documents stay readable by Basic Memory, by Obsidian and by anything else that parses wikilinks;
codeadd answers offline with zero dependencies. Writing into a tool's private format would reverse
that and lock the project in.

**The verbs.** Seven of them carry the same meaning on both corpora, which is what makes one server
over two parsers worth doing. `search`, `touched_by` and `reindex` are new to the docs corpus and
are no-ops or trivially satisfied on the artefact corpus.

| Action | Input | Returns | In `graph.js` today |
|---|---|---|---|
| `search` | terms, limit, filters on kind and status | hits carrying id, kind, status, title, first sentence, relations, path, attachments | no, new |
| `get` | id, optional section list | the full TL;DR, observations, relations and attachments | no, new |
| `impact` | id, depth | who points at this, transitively | yes |
| `dependencies` | id, depth | what this points at, transitively | yes |
| `neighbors` | id | one hop, direction-blind | yes |
| `path` | from, to | how the two connect | yes |
| `touched_by` | a list of files | the deliveries that touched them **and** the wiki pages whose `sources` cover them | no, new |
| `orphans` | optional kind | nodes with no relation or no TL;DR, which is the migration's work queue | yes |
| `stats` | none | index health, counts per kind, unresolved ids | yes |
| `reindex` | optional scope | rebuild the cache | no, new |

`get` exists because of decision 29: `search` returns the first sentence, so there has to be a way
to ask for the rest without opening the file by path.

`impact`, `dependencies` and `neighbors` are one function behind two parameters. They stay three
actions because `artefact-graph-mcp.js` already exposes them that way, and decision 5 rests on the
two corpora answering identically. Collapsing them here would diverge the two surfaces for no gain.

`touched_by` is the only action spanning both node kinds: for one file list it returns the work
items that changed those files and the reference pages that document them. It is what joins "what
was already built here" to "what this module is".

`touched_by` is deliberately not called `impact`. In `graph.js`, `impact` means transitive
dependants; the file-overlap question is a different one, and reusing the name across two meanings
is how two consumers come to disagree about one answer.

**The index is a JSON cache, gitignored, rebuilt from scratch.** Not SQLite: the floor is node 18
and `node:sqlite` arrives in node 22. The truth lives in the markdown. This is the same arrangement
that keeps `artefact-graph.json` from ever being stale, applied to a second corpus.

**In-flight documents are visible, and every hit carries its `status`.** The umbrella accepted the
opposite as the price of its draft-then-publish split; with that split gone, the price is gone too.
Two features in flight that touch the same area are exactly the pair that most needs to see each
other. Filtering by status is a consumer's choice, made against a field that is always returned,
never a silent exclusion made by the reader.

**Vector search is reserved, not built.** The umbrella's decision 25 fixed two requirements: a
stable id per document, which `permalink` will provide once it ships, and no vector inside the
record. Since the index is already a rebuildable sidecar, adding an embeddings file later changes
nothing structural. For a corpus of a few hundred documents, keyword plus typed edges plus a TL;DR
already delivers the cost win decision 23 measures. The vector leg gets built when a measurement
asks for it.

### Part 3 — Distribution

Source lives in `mcp/` at the repository root, a sibling of `cli/` and `framwork/`. A build step
copies it into the CLI package before publish, so it ships inside the existing `codeadd` npm
package and is invoked as a subcommand.

**Nothing is installed into the user's project.** Provider registration is the standard MCP form:

```json
{ "command": "npx", "args": ["-y", "codeadd@<version>", "mcp", "--corpus=docs"] }
```

Three routes were considered:

| Route | Why not / why yes |
|---|---|
| A — a real single-file executable | Node's Single Executable embeds the runtime: roughly 80 to 110 MB per platform, times three platforms, times two architectures, plus macOS codesigning or Gatekeeper blocks it. `pkg` is unmaintained. A large distribution problem solved in exchange for a lint problem |
| B — ship the source into `.codeadd/mcp/` in the user's project | The `.sh` scripts already ship this way and are fine, because JS tooling does not glob them. A `.js` file is picked up by ESLint, Prettier, `tsconfig` include patterns, coverage and bundlers. It puts code the user never wrote into their lint run |
| **C — run from the npm package via `npx`** | **Chosen.** Zero files in the user's tree, so the lint problem does not exist rather than being worked around. No platform matrix, no signing. The package is already in the npx cache from `npx codeadd install` |

One thing still has to live in the user's project: **the index**, because it is a cache of their own
documents. It goes in `.codeadd/`, which `cli/src/gitignore.js` already keeps inside a managed
`.gitignore` block. That is data, not code, and no linter is configured against it.

**The release workflow gates the npm publish on a diff of `cli/` alone.** Its "Check for CLI
changes" step runs `git diff --name-only "$PREV_TAG"..HEAD -- cli/`, while the framework ZIP step is
unconditional. A release touching only `mcp/` would therefore ship a new ZIP and skip the publish,
producing exactly the version skew this route is supposed to make impossible. The gate must include
`mcp/` before this ships. Version alignment is a property of that gate, not of the workflow as it
stands today.

**Registration runs on install and on update, and rewrites the pinned version.** These are three
distinct requirements and each has a failure mode if missed:

- registration only in `install` leaves every existing project with the migration applied and no
  server configured
- a pin of `codeadd@1.0.0` that is never rewritten leaves the server on 1.0.0 after the user moves
  to 1.1.0
- registration that is not idempotent duplicates the entry on every update

Where a provider's configuration cannot be written, registration degrades to printing the exact
line for the user to paste. That is the `postEnableHint` behaviour of both existing plugins, kept
as the floor rather than as the default.

### Part 4 — Migration, in two vehicles

The work splits by **who can do it**, not by how many passes it takes.

**Vehicle 1 — an entry in the existing CLI migration registry.** Everything requiring no
understanding:

- harvest **three** edge sources that are already written and currently unread
- add the `## Observations` and `## Relations` skeletons where absent
- add `tags` to frontmatter
- build the first index

**The three sources, measured on a real installation of 32 work items:**

| Source | Present | Becomes |
|---|---|---|
| `{{doc:ID}}` references in the body | 255, across 28 of 32 documents | `- links_to [[ID]]`, with the sentence around the reference kept as the edge's context line |
| `related:` in frontmatter | 134 ids | `- links_to [[ID]]` |
| `related.md` → `## Follow-ups` | filled in 15 of 19 | `## Relations` in the `about.md`, with the sentence as the `why` |
| `related.md` → `## Impacted Files` | filled in 18 of 19 | the node's file set in the index, which is what `touched_by` crosses |
| `superseded_by` in frontmatter | 1 | the status edge it already is; not duplicated into `## Relations` |

Nearly four hundred edges over thirty-two items, and the graph is effectively already drawn with
nothing reading it. Two of these were missed by earlier drafts and each changes something:

- the body reference is the richest source. Because `{{doc:ID}}` sits inline, the text around it is
  the `why` decision 14 requires, recovered without a model
- `related.md` is not dead weight. A real Follow-up reads *"{{doc:0003H}} fixed a production bug in
  the auth password hashing designed by this feature's SF02 subfeature"*: a typed edge with its
  reason written out. **Retiring the `hotfix-related` schema is a harvest, not a deletion** — both
  of its filled sections move into the `about.md`

**`Impacted Files` settles where a brownfield project's file list comes from.** An earlier draft left
that open and assumed git would have to answer. It does not: 18 of 19 documents already carry the
list, so `touched_by` and the wiki `sources` join both work on day one, before any new delivery.

It does **not** add an empty `## TL;DR` heading. An empty skeleton would satisfy decision 21's gate
without carrying any information, and the whole point of that gate is that the TL;DR is the
rejection surface. A document with no TL;DR keeps having none and is reported by `orphans`.

**What it scans, and how it tells one document from another.** It walks `docs/` and reads only the
frontmatter of each `.md`, applying the same rule the indexer applies: a recognised `type:` key
decides what the file is, and no `type:` key means the file belongs to the user and is skipped and
reported. That is the rule that survives a `docs/` tree holding the user's own material beside
codeadd's, which is what every real installation looks like. Nothing reads or interprets
`add-doc-schemas` itself: that skill is written for a model to follow, not for deterministic code
to branch on.

**How an id becomes a wikilink, with nothing guessed.** The legacy `related:` lists carry mixed
forms: work items appear as `F0042` while `add-id-convention` specifies `0042F`, and other
namespaces such as `PRD` and `CHG` have no suffix form at all. Rather than encode a reordering rule,
the migration **resolves each id against the documents on disk** and writes the wikilink using the
target's own id as found there. An id that resolves to no document produces no line and is reported
as unresolved. The filesystem answers the question, so there is no rule to get wrong.

**Frontmatter is parsed with a real YAML parser.** `cli/src` has none today, and the CLI's direct
dependencies are only `@clack/prompts` and `adm-zip`. `yaml` is already present transitively and is
promoted to a direct dependency. A hand-rolled reader over user-authored YAML is the kind of
shortcut that mangles someone's multi-line value, and this migration runs unattended.

**The mechanical migration only ever adds.** It never deletes and never rewrites a line the user
wrote. That single rule makes a partial failure harmless, makes idempotency trivial, and makes it
safe to run unattended inside `codeadd update`. Without it, the registry's never-throws guarantee
turns into a defect: deleting one orphaned file codeadd itself shipped is one thing, leaving a
user's `docs/` tree half-rewritten in silence is another.

It does not commit. It leaves the working tree dirty and reports the file count. Reviewing that diff
is the judgement the CLI cannot make.

**This is the registry's first migration to touch user-authored files.** The one migration on the
books walks only `.codeadd/` and each provider's destination, roots the CLI installed and owns.
Reaching into `docs/` is a new scope for that mechanism, which is why the glob, the type detection
and the additive-only rule are stated as requirements rather than left to the implementer.

**Vehicle 2 — an opt-in command.** Everything requiring reading:

- write the TL;DR where the document has none
- promote a `links_to` edge to `caused_by`, `depends_on` or `part_of`
- propose an edge nobody declared

This cannot live in the CLI for a hard reason: the CLI is plain Node with no model. It cannot read a
hotfix and know that feature `0051F` caused it.

**Why the split beats either half alone.** The mechanical pass leaves every document valid and
preserves every edge that already existed, so nothing is ever half-migrated. `orphans` becomes the
work queue, so the command can run over ten documents today and forty next week. And a project that
never runs the command still works: it has `links_to` edges and keyword search. Degraded, not
broken, which is decision 24's shape applied to migration.

The honest cost: `links_to` carries no intent. A project that runs only the mechanical migration
knows two documents reference each other and does not know why.

### The anti-rot gate

The framework's own graph does not rot because the build refuses to pass. The equivalent here:
`/add.done` refuses to close a delivery whose document carries a non-empty TL;DR and at least one
relation, and `orphans` reports what is outstanding at any moment. An empty heading does not
satisfy either half.

Without this, the format decays into an optional section nobody fills, which is precisely what
happened to `templates/related.md`.

## Type of Artefact

Mixed. The plan needs blocks of each kind.

- **script (new, product)** — the parser pair, the index builder and the query engine under `mcp/`
- **script (new, product)** — the stdio MCP server over that engine, no SDK, corpus by flag
- **script (retired, internal)** — `scripts/artefact-graph-mcp.js`, replaced by the above
- **schema** — the document format across `add-doc-schemas`: the two sections, the wikilink, the
  closed vocabulary, `permalink` and its stability rule
- **command (new, product)** — the opt-in semantic migration command
- **command (existing, product)** — `/add.new`, `/add.plan`, `/add.hotfix`, `/add.brainstorm`,
  `/add.diagnose`, `/add.review`, `/add.done`
- **skill** — `add-knowledge-discovery` gains the graph step
- **cli** — the migration registry entry, the MCP registration writer on both install and update,
  the `yaml` dependency, the build step that copies `mcp/` into the package
- **internal** — `scripts/build.js` and `.github/workflows/release.yml` for packaging and the
  publish gate
- **template** — `templates/related.md` is deleted; this format replaces it

## Scope

### Includes

- A markdown document format carrying a TL;DR, typed wikilink relations and categorised observations
- One MCP server owned by codeadd, zero dependencies, no SDK, serving two corpora by flag,
  distributed through the existing npm package and never installed into the user's tree
- Retirement of `scripts/artefact-graph-mcp.js`
- A rebuildable JSON index, gitignored, with the markdown as sole source of truth
- Nine query verbs, seven of which carry the same meaning on both corpora
- Two node kinds in the docs corpus: work items from `*-about`, reference pages from the wiki, with the edge between them derived at read time
- A mechanical, additive-only CLI migration that converts the `related:` frontmatter already on disk
- An opt-in command that writes TL;DRs and promotes untyped edges to typed ones
- MCP registration written by the installer on install and on update, with the pinned version kept current
- The close-out gate that keeps the format filled
- Deletion of `templates/related.md`
- The release workflow's publish gate extended to `mcp/`

### Does NOT Include

- **Vector search.** Reserved by decision 22's two requirements and built later, on a measurement
- **A third-party MCP dependency.** The survey found none that clears the constraints
- **SQLite.** The floor is node 18
- **Any dependency on gitnexus.** It enriches; it is never required
- **Rewriting index lines.** Hard ban 6 of the delivery-index format stands
- **The `INJECTS_INTO` edge kind.** Feature and plugin injection keeps its own mechanism
- **Subtopics 001, 003 and 005 of the umbrella.** They stand as written; 001 remains a
  prerequisite. 004 is narrowed, not taken over: recording the join stays its question
- **`migrate-ids.sh`.** Deleted as part of 1.0 rather than carried; it is not a tool of this
  migration

## Key Decisions

| # | Decision | Rationale | Validated |
|---|---|---|---|
| 1 | The relationship lives in the document body as a typed wikilink, not in a `rel` array in the index | The body is what the ecosystem parses. It exists from the document's first minute, and it survives any change to the index format | ✅ |
| 2 | Adopt Basic Memory's markdown convention; do not adopt Basic Memory | The convention is plain markdown and costs nothing. The tool is Python and AGPL-3.0. Adopting a convention keeps every door open; adopting a private format locks one in | ✅ |
| 3 | Build the MCP server rather than depend on one | Six candidates surveyed. The mature ones need an LLM key or a graph server; the ones matching the runtime have 0 and 17 stars | ✅ |
| 4 | No MCP SDK, no dependencies in the server | `artefact-graph-mcp.js` already made and justified this call: 89 transitive packages to wrap a small, fully specified surface | ✅ |
| 5 | One server, two corpora selected by flag, retiring `artefact-graph-mcp.js` | The two graphs share every piece of machinery and differ only in the parser. Sharing means this repository runs the exact binary it ships, with 76 gate-guarded artefacts as the test corpus on every build | ✅ |
| 6 | The index is a rebuildable JSON cache, gitignored | The markdown is the truth. This is why the internal graph cannot go stale, applied to a second corpus | ✅ |
| 7 | Not SQLite | `node:sqlite` lands in node 22; the declared floor is node 18. Shipping a native dependency to reach it costs more than the JSON scan saves at this corpus size | ✅ |
| 8 | The TL;DR is returned verbatim by every search hit | It is the rejection surface for the node, the same role decision 14 of the umbrella gave `why` for the edge | ✅ |
| 9 | In-flight documents are visible, and every hit carries its `status` | Umbrella decision 4 excluded them as the price of its draft-then-publish split. That split is retired, so the price is too. Two features in flight are the pair that most needs to see each other, and filtering is the consumer's choice against a returned field | ✅ |
| 10 | The vocabulary stays closed: `caused_by`, `depends_on`, `part_of`, plus `links_to` from migration | Unchanged from the umbrella's decisions 5 and 6. `links_to` is the honest label for an untyped edge recovered mechanically | ✅ |
| 11 | No `permalink` field. `id` is the stable identity and `slug` already exists | Both are populated in every real installation inspected. A third identifier would duplicate what is there and invent a stability rule nobody needs | ✅ |
| 12 | `touched_by` is a separate verb from `impact` | `impact` means transitive dependants in `graph.js`. Reusing the name for file overlap is how two consumers come to disagree about one answer | ✅ |
| 13 | Nothing is installed into the user's project except the index | Source `.js` in their tree enters ESLint, Prettier, `tsconfig`, coverage and bundlers. A real binary costs a six-way platform matrix plus codesigning | ✅ |
| 14 | Distribution is `npx` over the existing `codeadd` package | One publish, one version, already cached from install | ✅ |
| 15 | The release workflow's publish gate must include `mcp/` | It diffs `cli/` alone today while the ZIP step is unconditional, so an `mcp/`-only release would ship a ZIP and skip the publish. Version alignment is a property of that gate, not of the workflow as it stands | ✅ |
| 16 | Source lives in `mcp/`, a sibling of `cli/` and `framwork/` | Separation at the source; a build step handles packaging. Two concerns do not have to share a directory to share a release | ✅ |
| 17 | The installer writes MCP registration on install and on update, idempotently, rewriting the pinned version | Install-only leaves existing projects unserved; a stale pin freezes the server at an old version; non-idempotent registration duplicates on every update | ✅ |
| 18 | Migration splits into a mechanical CLI vehicle and a semantic command vehicle | The CLI has no model and cannot infer intent. The command cannot run unattended inside an update. Neither can do the other's half | ✅ |
| 19 | The mechanical migration is additive only, does not commit, and skips any file without a `type:` key | Makes partial failure harmless and idempotency trivial. It is the registry's first migration to touch user-authored files, so its scope is stated rather than inferred | ✅ |
| 20 | Ids resolve against the documents on disk rather than through a reordering rule | The legacy lists mix `F0042` with `PRD0009`, and only work-type letters have a suffix form. Resolving against the filesystem removes the rule, and an unresolved id produces no line and a report | ✅ |
| 21 | `/add.done` refuses to close a delivery whose document lacks a non-empty TL;DR or any relation | The framework's own graph stays complete because the build fails. Without an equivalent gate the format decays into an optional section, which is what happened to `templates/related.md`. An empty heading satisfies neither half | ✅ |
| 22 | Vector search is reserved, not built | Its requirements are a stable id, which `id` already provides on disk, and no vector in the record, which the sidecar arrangement already guarantees | ✅ |
| 23 | `yaml` is promoted from a transitive to a direct CLI dependency | `cli/src` has no frontmatter parser and the migration runs unattended over user-authored YAML. A hand-rolled reader is the shortcut that mangles a multi-line value | ✅ |
| 24 | `templates/related.md` is deleted, not adopted | This format replaces it. The umbrella left the choice open; it is now made | ✅ |
| 25 | This document supersedes umbrella subtopics 002 and 006, retiring its decisions 3, 4 and 13; 001, 003, 004 and 005 stand | The premise changed on both, and neither was ever written. 001 remains a prerequisite | ✅ |
| 26 | Membership is decided by the `type:` frontmatter key, never by a path glob | A real `docs/` holds the user's own files beside codeadd's. No `type:` key means the file is the user's and is skipped. A glob would need an exclusion list somebody maintains forever | ✅ |
| 27 | One work item is one node, anchored on its `*-about` document; every other recognised type is an attachment returned with every hit | A measured installation carries twenty distinct `type:` values. Making each a node returns eighteen hits for one feature, and a `caused_by` edge would have no single target | ✅ |
| 28 | Vehicle 1 harvests three edge sources, not one: `{{doc:ID}}` body references, `related:` frontmatter and `superseded_by` | Measured at 255, 134 and 1 edges over 32 work items. The body reference is the largest source and carries its own `why` in the surrounding sentence, recovered with no model | ✅ |
| 29 | `search` returns the first sentence of the TL;DR; the full section comes on a follow-up call | The section runs 41 to 173 words, median 107. Returning it whole for ten hits costs about 1,500 tokens, and the first sentence is where the thesis sits | ✅ |
| 30 | Both changelog layouts are read: `<feature-dir>/changelog.md` and `docs/changelog/CHG[NNNN].md` | The measured installation uses the first; `/add.done` writes the second. Umbrella subtopic 001 owns deciding which is canonical, and the indexer must work before that lands | ✅ |
| 31 | Only a project that ran an earlier codeadd version is in **migration** scope. Every project is in **graph** scope | A project that never ran codeadd has no `docs/features/` for Vehicle 1 to convert, but `/add.wiki` generates reference pages from code in any repository and those are nodes. Reconstructing work items from git history is a different problem and is not attempted | ✅ |
| 32 | The wiki is indexed by the same `type:` rule, as a second node kind | `type: reference` is already on every page. No separate corpus, no second membership rule, and `index.md` self-excludes by carrying no frontmatter | ✅ |
| 33 | A reference page's `description` is its summary; `area` is its grouping; `sources` is its file join | All three are already written by `/add.wiki`. Decision 29's first-sentence derivation applies to work items only, and roadmap item 1.2's open "app, group or category" question is answered by a field that exists | ✅ |
| 34 | The work-item-to-page edge is derived at read time from touched files crossed against `sources` globs, never declared | Both sides already hold their half. This narrows umbrella subtopic 004 rather than retiring it: its "what a page carries" half stands, its "record the join" half is open to question and is not settled here | ✅ |
| 35 | The `hotfix-related` schema retires and `related.md` stops being written; both filled sections move into the `about.md` | Measured at 15 of 19 with an explained relationship in Follow-ups and 18 of 19 with a real Impacted Files list. Deleting it would throw away the richest relationship content in the corpus | ✅ |
| 36 | A brownfield project's per-node file list comes from `related.md`'s Impacted Files, not from git | 18 of 19 already carry it, so `touched_by` and the wiki `sources` join answer on day one rather than from the first new delivery onward | ✅ |
| 37 | The two corpora are declared in one table and never share an index; the flag selects and a presence probe validates | An installed `.claude/` has its `uses:` blocks stripped at build, so indexing it as the artefact corpus yields dozens of edge-free nodes and an empty graph. The probe on `framwork/provider-map.json`, which is absent from the release ZIP, is what makes the mistake impossible | ✅ |
| 38 | The internal layer gets the artefact corpus only, with no docs corpus | Its plans and deliveries carry a blockquote metadata block rather than YAML frontmatter, so the membership rule skips them. It already answers the same question with `delivered.jsonl` plus `graph.js history`, and changing that house style is a separate decision | ✅ |

## Ecosystem Impact

| Component | Layer | Impact | Action |
|---|---|---|---|
| `mcp/` | product source | New directory at the repository root | Create: two parsers, index builder, query engine, stdio server |
| `scripts/artefact-graph-mcp.js` | internal | Becomes a duplicate of the new server's artefact corpus | Delete; update every reference to it |
| `scripts/graph.js` | internal | Its verbs become the shared surface | Confirm the CLI keeps working against the shared engine |
| `add-doc-schemas` | product | The format changes across `new-feature.md`, `fix.md`, `history.md` and the universal frontmatter | Add the two sections, the wikilink syntax, `permalink` and its stability rule; keep `related:` readable during the transition |
| `add-knowledge-discovery` | product | The INDEX step gains a graph step, and its result needs a named destination in all six loading commands | Extend the procedure |
| `/add.new`, `/add.plan`, `/add.hotfix`, `/add.brainstorm`, `/add.diagnose`, `/add.review` | product | All six load the discovery skill. The first four write relations found during investigation; all six consume the graph at their context step | Edit each |
| `/add.done` | product | The close-out gate; the index rebuild | Extend |
| New opt-in command | product | The semantic half of the migration | Create |
| `templates/related.md` | product | Replaced by the format | Delete |
| `cli/src/migrations.js` | cli | One new registry entry, additive only, and the registry's first reach into user-authored files | Extend |
| `cli/src/updater.js` | cli | Runs migrations already. Two gaps: it logs every change as `Migration removed`, which an additive migration makes wrong, and it does not register MCP | Fix the log wording; add registration |
| `cli/src/installer.js` | cli | Writes MCP registration per selected provider | New capability |
| `cli/package.json` | cli | Gains `yaml` as a direct dependency and carries the packaged MCP; `files` may need an entry | Verify the whitelist packs a generated directory before relying on it |
| `scripts/build.js` | internal | Copies `mcp/` into the CLI package | New step |
| `.github/workflows/release.yml` | internal | The publish gate diffs `cli/` alone; the ZIP step is unconditional | Extend the gate to `mcp/`; add `mcp/` to the packaging route |
| `provider-map.json` | product | Every provider already declares `mcp: true` | No change expected; confirm the per-provider config path |
| `cli/tests/` | cli | Parser, index, migration, registration and the publish gate all need coverage | New suites; the suite runs serially |
| `feature-history-agent` | product | Reads a dead path and cannot reach the index | Umbrella subtopic 005 owns its fate; unchanged here |

## Trade-offs & Risks

| We gain | We give up |
|---|---|
| One index read replaces a sweep of every feature document | A new artefact and an MCP surface to maintain in the product layer |
| Relationships a keyword search cannot find | Authoring work in the two commands that write a node |
| Documents readable by Obsidian, Basic Memory and any wikilink parser | Freedom to invent a format that fits codeadd exactly |
| A brownfield project gets a filled graph on the day it upgrades | A document format change, which is a breaking change for 1.0 |
| Nothing in the user's lint run | A network round trip on the very first `npx` if the cache was cleared |
| This repository runs the binary it ships | The artefact parser travels in the package as code no user runs, and working internal tooling is touched |

| Risk | Probability | Mitigation |
|---|---|---|
| The mechanical migration damages user documents | Medium | Additive only, never commits, skips files with no `type:`, `--dry-run` already exists in the registry, and the diff is reviewed |
| The format decays into an unfilled optional section | High | Decision 21's close-out gate, plus `orphans` reporting the outstanding set |
| Retiring `artefact-graph-mcp.js` breaks the internal graph's own tooling | Medium | It is internal, fully covered by the build's three gates, and `scripts/graph.js` keeps the CLI surface. Land the shared engine before the deletion, never in the same block |
| An `mcp/`-only release ships a ZIP and skips the publish | High until fixed | Decision 15. The gate is a named deliverable, not an assumption |
| `npx` fails offline on first use | Low | The package is already cached from `npx codeadd install`. The verbs also answer from the CLI with no MCP configured |
| The npm `files` whitelist does not pack a generated directory | Medium | Named as a verification item before planning, not an assumption |
| A JSON index scan is too slow at a large corpus | Low | Measure before optimising. The index is a rebuildable sidecar, so its storage can change without touching the format |
| Providers disagree on where MCP registration is written | Medium | All five declare `mcp: true`; the per-provider config path is a planning input, and registration degrades to a printed line |
| Scope is large for one plan | High | The four parts are independently deliverable in order: format, reader, distribution, migration |

## Next Steps

Run: `/add-framework--plan a knowledge graph over delivered markdown documents — typed wikilink relations and a required TL;DR in the document body, one owned zero-dependency MCP server over two corpora distributed through npx, and a brownfield migration split between the CLI migration registry and an opt-in command`
