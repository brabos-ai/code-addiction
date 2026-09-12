# Plan: Docs Knowledge Graph MCP — the product layer gets a typed graph over its own documents, served by one MCP over two corpora, with a two-vehicle brownfield migration

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-12

---

## Context

codeadd's knowledge layer is write-as-you-go. `docs/delivered.jsonl` gains its first line at the
first `/add.done` after install, so a project with history already behind it starts blind and stays
blind. Half the bootstrap exists: `/add.wiki` generates code knowledge from the repository on day
one. The delivered-work half has no equivalent.

Meanwhile the internal layer already has what the product layer wants, and it works:
`artefact-graph.json` plus `scripts/graph.js` plus `scripts/artefact-graph-mcp.js`. That asymmetry
is the motivation.

The measurement that reframes the work: a real installation
(`organize-my-finances`, 32 work items, current framework version) already carries close to four
hundred relationship edges, written by real runs, read by nothing.

**Every decision here was taken and reviewed in the design below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-12T092440-docs-knowledge-graph-mcp.md` | All 38 decisions: the document format, the two-corpus reader and its ten actions, the `npx` distribution route, the two migration vehicles, the third-party survey, and the supersession of umbrella subtopics 002 and 006 |
| `docs/brainstorming/2026-09-12T075635-delivered-work-relationships-000-umbrella.md` | The decisions this design keeps: the closed vocabulary (5, 6), the rejection surface (14), no relationship from human memory (12), never depend on gitnexus (24), vector search reserved (25). Subtopics 001, 003, 005 stand; 004 is narrowed |

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 and emits no warning absent from the baseline
  measured before the first F-block (`add-framework-internal-layer`, Validation)
- `ADD_GRAPH_WARNINGS=1` on every warning measurement — without it `build.js` prints only the count
  and the claim "no new warning" does not hold (`add-framework-internal-layer`, Validation)
- A name appearing in prose with no declared relationship **fails** the build; declared and never
  named in prose **warns** (`CLAUDE.md`, Pipeline; `scripts/build.js` `checkArtefactGraph`)
- Every remove or rename updates each dependant **in the same F-block**
  (`/add-framework--build` STEP 4.4, Lifecycle Actions). **One stated exception in this plan:** when
  a removal's dependants span both layers, one F-block cannot carry them, because its single layer
  tag selects the build's rule set. F9 through F11 are that case and resolve it by **updating every
  dependant first and deleting last**, so no commit in the sequence leaves a reference pointing at a
  file that is gone.
- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the
  exception, always `.codeadd/scripts/` (`CLAUDE.md`, Pipeline)
- HTML comments (`<!-- -->`) are stripped at build (`CLAUDE.md`, Pipeline)
- `"node": ">=18.0.0"` (`cli/package.json` → `engines`)
- The cli vitest suite runs serially: `fileParallelism: false`
  (`cli/vitest.config.js`; `add-framework-product-layer`)
- Agents build only for a provider declaring an `agents` pattern
  (`framwork/provider-map.json` → `providers`)

## Problem

1. **No graph exists over the documents the agents write.** `/add.done` writes a changelog, a
   consolidated `decisions.jsonl`, surgical wiki edits and one `delivered.jsonl` line. None is a
   graph. Between two delivered documents there are zero edges.

2. **Four hundred edges are already written and unread.** Measured on a real installation: 255
   `{{doc:ID}}` body references across 28 of 32 documents, 134 ids in `related:` frontmatter, 15 of
   19 `related.md` files carrying an explained relationship in `## Follow-ups`, and 18 of 19
   carrying a real `## Impacted Files` list. Nothing reads any of it as a graph.

3. **A brownfield project gets an empty knowledge layer and no way to fill it.**
   `add-knowledge-discovery` runs, finds nothing, and six commands fall through to a text sweep of
   `docs/`.

4. **`related.md` is not about relationships.** The `hotfix-related` schema is TL;DR, Impacted
   Files, Impacted Docs and Follow-ups. `/add.hotfix` STEP 5.2 gathers human-confirmed
   relationships, carries them seven steps, and files them in a document whose schema is a file
   list.

5. **`templates/related.md` is an orphan.** The only artefact shaped like a relationship table, read
   by no command.

## Proposal

Four stages, strictly ordered, each leaving the repository in a working state.

**T1 — the format.** The document body becomes the source of truth for a relationship: a typed
wikilink in a `## Relations` section, in the plain-markdown convention the wider ecosystem parses.
The `hotfix-related` schema retires and its two filled sections move into the `about.md`.

**T2 — the reader.** One zero-dependency MCP server over two corpora selected by flag, replacing
`scripts/artefact-graph-mcp.js` rather than sitting beside it. This repository starts running the
binary it ships.

**T3 — distribution.** The server travels inside the existing `codeadd` npm package and runs through
`npx`, so nothing lands in the user's tree and nothing enters their lint run. The installer gains a
capability the CLI has never had: writing MCP registration.

**T4 — migration.** One mechanical, additive-only CLI migration harvests the four hundred edges
already on disk. There is no second, semantic vehicle: see Does NOT Include.

The sequencing is not a preference. T2 has nothing to read until T1 defines it, T3 has nothing to
ship until T2 exists, and T4 has no format to migrate into until T1 lands.

## Closed Questions — do not reopen

**Read this before proposing anything the plan appears to be missing.** Each row was argued to a
conclusion during the design session. A builder who reaches a different answer is re-running a
settled discussion, not finding a gap. The right-hand column names the evidence that would have to
change for the question to be worth reopening.

| Question | Settled answer | What would have to change |
|---|---|---|
| Should a new command build the initial relationship structure, as roadmap item 1.2 asks? | **No. There is no new command in this plan, and none is needed.** After the mechanical harvest its three jobs come to almost nothing: 0 of 29 measured documents lack a TL;DR; proposing an undeclared edge is `touched_by`, computed at read time by F7; and 270 of the 389 harvested edges already arrive carrying a `why`. It was also never designed — the design set lists it under Type of Artefact and gives it no steps, no gates and no contract | `orphans` reporting, on a real project, a large set of untyped edges that measurably cost an investigation. Then it returns as its own brainstorm with a real design |
| Then how does a brownfield project get migrated? | **`codeadd update` does it.** F18 is an entry in the existing CLI migration registry: it runs automatically after the new files land and before the manifest is written, exactly where `pruneLegacyOrphans` already runs. The user types nothing beyond the update | Nothing. This is the whole migration vehicle |
| And how does the MCP get installed? | **The same `codeadd update` does it.** F14 adds the registration writer, F15 makes the updater call it and keep the pinned version current. Install and update both register; neither leaves a project migrated but unserved | Nothing |
| Is roadmap item 1.2 fully delivered by this plan? | **No, and knowingly.** Its "Done when" names a command producing the structure. This plan produces the structure without one. The outcome the item wanted is delivered; the mechanism it named is not | A decision to keep the item's wording literal, which is the user's call and would require designing the command first |
| Two MCP servers, one per corpus? | **No. One server, corpus selected by flag.** `--corpus=artefacts` here, `--corpus=docs` in a user's project. F9 to F11 retire `scripts/artefact-graph-mcp.js` rather than leaving a second implementation beside it. The payoff is that this repository runs the exact binary it ships, with its own 76 gate-guarded artefacts as the test corpus | L2.4 failing to go green — in which case the server is wrong, not the decision |
| Does the artefact corpus work in a user's project? | **No, and that is correct.** The `uses:` block is stripped at build, so an installed `.claude/` carries zero edges. The probe on `framwork/provider-map.json`, absent from the release ZIP, makes the server say the corpus is absent instead of reporting an empty graph | Nothing |
| Should anything be installed into the user's project? | **Only the index.** Source `.js` in their tree enters ESLint, Prettier, `tsconfig`, coverage and bundlers. A real single-file executable costs a six-way platform matrix plus macOS codesigning. `npx` over the already-cached package avoids both | Nothing |
| Should we depend on an existing MCP instead of building one? | **No.** Six were surveyed in the design. The mature ones (Cognee, Graphiti) require an LLM API key per ingestion or a graph server; the ones matching the node runtime have 0 and 17 GitHub stars | A maintained, Node-native, server-free, key-free graph-over-markdown MCP appearing |
| Is the document format change avoidable for 1.0? | **No. It is the breaking change.** `related:` stays readable as migration input, and the migration is additive, so no existing document becomes invalid. But `## Relations` is new and is what every reader depends on | Nothing |

## Current State

| Artefact | Layer | Dependants at depth 1 | Risk |
|---|---|---|---|
| `add-doc-schemas` | product | 22 | HIGH |
| `add.wiki` | product | 16 | HIGH |
| `add.new` | product | 13 | HIGH |
| `add.done` | product | 10 | HIGH |
| `add.hotfix` | product | 8 | HIGH |
| `add-knowledge-discovery` | product | 8 | HIGH |
| `delivered.sh` | product | 3 | HIGH |
| `scripts/artefact-graph-mcp.js` | internal | not a graph node | referenced by `.mcp.json`, `CLAUDE.md`, `prompt-review-agent`, and two cli test files |

The delivery index reports one relevant prior delivery: `2026-09-11T014333-PLAN--product-close-out-parity`
(`live`) for `add.done`, which established the close-out's four-state routing and the fifth converge
gate. This plan extends that close-out; it does not revisit it.

`docs/strategy/` does not exist in this repository, so the ecosystem strategy documents named by the
planning command were unavailable. `CLAUDE.md` and `add-ecosystem` carried the map instead.

## Scope

### Includes

#### T1 — The document format (ref: design, Part 1)

- **F1** [product] — `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` and its `references/`: adds
  the `## Relations` and `## Observations` sections, the `[[wikilink]]` target syntax, the closed
  vocabulary (`caused_by`, `depends_on`, `part_of`, `links_to`) and the `tags:` frontmatter key to
  the work-item schemas. Must NOT introduce a `permalink` key — `id` and `slug` already exist
  (design decision 11) — and must NOT alter `related:`, which stays readable as migration input
  (design, Supersession row 13).
  - **Produces:** the `## Relations` line grammar `- <type> [[<id>]]` and the recognised `type:`
    value set

- **F2** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/fix.md`: retires the
  `hotfix-related` schema and states where its two filled sections now live — Follow-ups into
  `## Relations`, Impacted Files into the node's file set. Must NOT delete the schema without
  recording the harvest, because 18 of 19 real documents carry a file list nothing else supplies
  (design decisions 35, 36).
  - **Consumes:** the `## Relations` line grammar (F1)

- **F3** [product] — `framwork/.codeadd/commands/add.new.md`: writes `## Relations` and `tags:` into
  the `about.md` it creates, sourced from the index result its discovery step already obtains. Must
  NOT ask the user which feature the work depends on (umbrella decision 12).
  - **Consumes:** the `## Relations` line grammar (F1)

- **F4** [product] — `framwork/.codeadd/commands/add.hotfix.md`: routes the candidate set already
  confirmed at STEP 5.2 into the `about.md`'s `## Relations`, typed `caused_by`; STEP 12 stops
  writing `related.md`. Must NOT lose the blast radius STEP 5.2 retains for STEP 9 — the same set
  serves both, and STEP 9's use is unchanged.
  - **Consumes:** the `## Relations` line grammar (F1)

- **F5** [product] — `framwork/.codeadd/templates/related.md`: deleted. This format replaces it
  (design decision 24). Its dependants are product-layer only, so the same-F-block sweep applies
  with no exception.

#### T2 — The reader (ref: design, Part 2)

- **F6** [product] — `mcp/` (new directory at the repository root, sibling of `cli/` and
  `framwork/`): the corpus registry and the two parsers. One declarative table with two rows
  carrying roots, presence probe, membership rule, node rule, edge sources and index path. Must NOT
  let the two corpora share an index or a node namespace (design decision 37).
  - **Produces:** `CORPORA` — the corpus registry with entries `artefacts` and `docs`
  - **Produces:** the docs index schema written to `.codeadd/docs-index.json`

- **F7** [product] — `mcp/`: the index builder and query engine over that registry. Node kinds are
  `work item` (a `type:` ending in `-about`) and `reference page` (`type: reference` under
  `.codeadd/wiki/`); every other recognised `type:` is an attachment; a file with no `type:` is
  skipped and reported. Edge sources per the design's Vehicle 1 table. Must NOT require a network, a
  model or a native dependency.
  - **Consumes:** `CORPORA` (F6)
  - **Consumes:** the docs index schema written to `.codeadd/docs-index.json` (F6)
  - **Produces:** the ten actions `search`, `get`, `impact`, `dependencies`, `neighbors`, `path`,
    `touched_by`, `orphans`, `stats`, `reindex`

- **F8** [product] — `mcp/`: the stdio JSON-RPC server exposing those ten actions, with no SDK, for
  the reason `scripts/artefact-graph-mcp.js` already records in its header. Nothing may write to
  stdout except a response frame. Must NOT diverge the action surface between corpora.
  - **Consumes:** the ten actions (F7)
  - **Produces:** the server entry point invoked as `codeadd mcp --corpus=<name>`

- **F9** [product] — `cli/tests/graph-mcp.test.js` and `cli/tests/graph-query.test.js`: retargeted at
  the new server. **First of the three-block removal sweep, and it updates rather than deletes**, so
  the suite is green at every commit. Must NOT drop an assertion the retired server carried; each
  one moves.
  - **Consumes:** the server entry point (F8)

- **F10** [internal] — `CLAUDE.md` and `.claude/agents/prompt-review-agent.md`: both stop naming
  `scripts/artefact-graph-mcp.js` and name the new server instead; `CLAUDE.md` additionally gains
  `mcp/` in the Project Anatomy and in the internal-versus-product layer table. That row is
  load-bearing: `mcp/` sits at the repository root, which the layer table otherwise reads as
  internal, while every F-block here tags it `[product]` because it is distributed.
  - **Consumes:** the server entry point (F8)

- **F11** [internal] — `.mcp.json` retargeted and `scripts/artefact-graph-mcp.js` deleted. **Last of
  the sweep**, so nothing in the repository references the file when it goes. Must NOT land before
  L2.4 is green — the design grades the replacement a medium risk and states this ordering.
  - **Consumes:** the server entry point (F8)

#### T3 — Distribution (ref: design, Part 3)

- **F12** [internal] — `scripts/build.js`: copies `mcp/` into the CLI package before publish. Must
  NOT require a bundler — zero dependencies means the source is the bundle.
  - **Produces:** `cli/src/mcp/` populated at build time

- **F13** [internal] — `.github/workflows/release.yml`: the "Check for CLI changes" step diffs
  `cli/` alone while the framework ZIP step is unconditional, so a release touching only `mcp/`
  would ship a ZIP and skip `npm publish`. The gate is extended to cover `mcp/`. Must NOT be treated
  as a nicety: version alignment is a property of this gate (design decision 15).
  - **Consumes:** `cli/src/mcp/` (F12)

- **F14** [product] — `cli/src/installer.js`: writes the MCP registration into each selected
  provider's configuration, in the form
  `{"command":"npx","args":["-y","codeadd@<version>","mcp","--corpus=docs"]}`. Where a provider's
  config cannot be written it degrades to printing the exact line, which is the `postEnableHint`
  floor both plugins already use. Must NOT duplicate an existing entry.
  - **Consumes:** the server entry point (F8)
  - **Produces:** `writeMcpRegistration(cwd, providers, version)`

- **F15** [product] — `cli/src/updater.js`: calls the same registration writer and rewrites the
  pinned version. Registration only in `install` leaves every existing project with the migration
  applied and no server; a pin never rewritten freezes the server at an old version.
  - **Consumes:** `writeMcpRegistration(cwd, providers, version)` (F14)

- **F16** [product] — `cli/src/updater.js`: the migration report logs every change as
  `Migration removed ${change}`, hardcoded because the only migration on the books deletes files. An
  additive migration reports "removed" for files it created. The wording becomes neutral.

#### T4 — Migration (ref: design, Part 4)

- **F17** [product] — `cli/package.json`: promotes `yaml` from a transitive to a direct dependency.
  `cli/src` has no frontmatter parser and the direct dependencies are only `@clack/prompts` and
  `adm-zip`. A hand-rolled reader over user-authored YAML is what mangles a multi-line value, and
  this migration runs unattended.
  - **Produces:** `yaml` available to `cli/src`

- **F18** [product] — `cli/src/migrations.js`: one registry entry that walks `docs/`, reads only
  frontmatter, and harvests five sources into the new format — `{{doc:ID}}` body references with
  their surrounding sentence, `related:` ids, `related.md` Follow-ups, `related.md` Impacted Files,
  and `superseded_by`. **Additive only**: it never deletes and never rewrites a line the user wrote,
  it does not commit, and it skips any file with no `type:` key. Ids resolve against the documents
  on disk rather than through a reordering rule; an unresolved id produces no line and is reported.
  This is the registry's first migration to touch user-authored files, so the glob, the type
  detection and the additive rule are requirements, not implementer choices.
  - **Consumes:** `yaml` available to `cli/src` (F17)
  - **Consumes:** the `## Relations` line grammar (F1)

  It reports counts per source and the unresolved id list to the user. That report is output, not an
  interface: no F-block reads it, and the diff it points at is what the user reviews before committing.

- **F19** [product] — `framwork/.codeadd/commands/add.done.md`: refuses to close a delivery whose
  document lacks a non-empty TL;DR or any relation, and rebuilds the docs index. Must NOT duplicate
  the index entry on a resume — the four-state routing that
  `2026-09-11T014333-PLAN--product-close-out-parity` established stands unchanged.
  - **Consumes:** the ten actions (F7)

- **F20** [product] — `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md` plus the six
  commands that load it (`add.new`, `add.plan`, `add.hotfix`, `add.brainstorm`, `add.diagnose`,
  `add.review`): the INDEX step gains a graph step, and its result gets a named destination in all
  six. Four of the six name the index step today and then carry forward wiki pages only.
  - **Consumes:** the ten actions (F7)

### Does NOT Include (important!)

- **Vector search.** Reserved by design decision 22: a stable id, which `id` already provides, and
  no vector inside the record. Built later on a measurement, not on a hunch.
- **A third-party MCP dependency.** Six candidates were surveyed in the design and each was rejected
  for a stated reason.
- **SQLite.** `node:sqlite` lands in node 22 and the declared floor is `>=18.0.0`.
- **A docs corpus for the internal layer.** `docs/plans/` and `docs/deliveries/` carry a blockquote
  metadata block rather than YAML frontmatter, so the membership rule skips them. The internal layer
  already answers the same question with `delivered.jsonl` plus `graph.js history` (design decision 38).
- **Reconstructing work items from git history.** A project that never ran codeadd has nothing for
  F18 to convert; its bootstrap is `/add.wiki`, whose pages are nodes (design decision 31).
- **Recording the delivery-to-page join.** Umbrella subtopic 004 keeps that question. This plan
  computes the join at read time and does not write it.
- **Umbrella subtopics 001, 003 and 005.** They stand as written. 001 remains a prerequisite of the
  investigation step this work hangs relationships on.
- **A semantic backfill command.** The design's Type of Artefact listed one and never designed it:
  no steps, no gates, no contract. Measured against a real installation its three jobs come to
  almost nothing. Writing a TL;DR where one is missing: 0 of 29 documents lack one. Proposing an
  undeclared edge: that is `touched_by`, computed at read time. Typing a `links_to`: real, but 270
  of the 389 harvested edges already arrive with a `why` sentence, and the type earns its keep on
  new work, which F3 and F4 write. A permanent public command in five providers for a one-shot job
  is not paid for. If the gap turns out to matter, `orphans` will have measured it and it returns
  with its own design.
- **`migrate-ids.sh`.** Its deletion belongs to the 1.0 breaking-change pass, not to this plan.
- **The `INJECTS_INTO` edge kind.** Feature and plugin injection keeps its own mechanism.

## Validated Decisions

The design carries 38 decisions with their rationale. The table below records only what this plan
decided on top of it, because the planning questionnaire was waived by explicit instruction.

| Question | Decision | Rationale / Ref |
|---|---|---|
| One plan or a plan set? | One plan, four topic groups | The four stages share one contract and are strictly sequential. A set would land the format with nothing reading it. `add-plan-authoring` supports `#### T[N]` grouping inside one plan |
| Which layer is `mcp/`? | `[product]`, despite sitting at the repository root | It is distributed inside the npm package. F10 records this in `CLAUDE.md` so the root-means-internal rule does not mislead a later reader |
| Does `artefact-graph-mcp.js` die in the same F-block as the new server? | No. The removal is a three-block sweep, F9 to F11, ordered dependants-first | A single F-block carries one layer tag, and its dependants span both layers. Updating first and deleting last keeps every intermediate commit consistent |
| Keep the opt-in semantic command the roadmap asked for? | **No. Dropped.** | Measured against a real installation its three jobs come to almost nothing: 0 of 29 documents lack a TL;DR, proposing an undeclared edge is `touched_by` computed at read time, and 270 of the 389 harvested edges already carry a `why`. It was also never designed — no steps, no gates, no contract. It returns with its own design if `orphans` shows the gap is real |
| Does the questionnaire run? | Waived | The user instructed the command to decide autonomously and report the decisions for correction. Every decision is recorded here or in the design |
| Is the file list for a brownfield node taken from git? | No, from `related.md` Impacted Files | 18 of 19 measured documents already carry it, so `touched_by` answers on day one rather than from the first new delivery |
| Does `related.md` get deleted or harvested? | Harvested, then its schema retires | 15 of 19 carry an explained relationship and 18 of 19 a file list. Deleting would discard the richest relationship content in the corpus |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| One index read replaces a sweep of every feature document | A new artefact and an MCP surface to maintain in the product layer |
| Four hundred already-written edges become queryable | A document format change, which is a breaking change for 1.0 |
| Documents readable by Obsidian, Basic Memory and any wikilink parser | Freedom to invent a format that fits codeadd exactly |
| Nothing in the user's lint run | A network round trip on the very first `npx` if the cache was cleared |
| This repository runs the binary it ships | The artefact parser travels in the package as code no user runs, and working internal tooling is touched |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| F11 deletes the internal MCP and the replacement is wrong | Medium | L2.4 asserts both corpora answer identically and gates F11; the sweep is ordered F9 → F10 → F11 so nothing references the file when it goes |
| F18 damages user documents | Medium | Additive-only and non-committing by F18's own contract; L3.1 asserts a second run is byte-identical and L3.2 asserts the diff adds only; the registry's `--dry-run` already exists |
| The format decays into an unfilled optional section | High | F19's close-out gate, and `orphans` from F7 reporting the outstanding set |
| An `mcp/`-only release ships a ZIP and skips the publish | High until F13 | F13 is a named deliverable; L1.6 asserts the gate fires on an `mcp/`-only diff |
| The npm `files` whitelist does not pack a generated directory | Medium | L1.5 asserts the packed tarball contains `src/mcp/`, read from the real `npm pack` listing and never from the `files` array |
| `add-doc-schemas` has 22 dependants and F1 changes it | High | L2.1 asserts every dependant still resolves; the build's graph gates fail on any dangling reference |
| F4 loses the blast radius STEP 9 depends on | Medium | F4's contract states STEP 9's use is unchanged; L4.2 asserts the set reaches both destinations |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | F1 — the two sections, the wikilink, the vocabulary, `tags:` |
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | product | modify | F1 — the work-item schemas |
| `framwork/.codeadd/skills/add-doc-schemas/references/history.md` | product | modify | F1 — the changelog schema's relation carrier |
| `framwork/.codeadd/skills/add-doc-schemas/references/fix.md` | product | modify | F2 — `hotfix-related` retires |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add.hotfix.md` | product | modify | F4 |
| `framwork/.codeadd/templates/related.md` | product | remove | F5 |
| `mcp/` | product | create | F6, F7, F8 |
| `cli/tests/graph-mcp.test.js` | product | modify | F9 |
| `cli/tests/graph-query.test.js` | product | modify | F9 |
| `CLAUDE.md` | internal | modify | F10 — retargets the server reference, adds `mcp/` to the anatomy and the layer table |
| `.claude/agents/prompt-review-agent.md` | internal | modify | F10 — names the retired script |
| `.mcp.json` | internal | modify | F11 — points at the new server |
| `scripts/artefact-graph-mcp.js` | internal | remove | F11 |
| `scripts/build.js` | internal | modify | F12 — copies `mcp/` into the package |
| `.github/workflows/release.yml` | internal | modify | F13 — the publish gate and the packaging route |
| `cli/src/installer.js` | product | modify | F14 |
| `cli/src/updater.js` | product | modify | F15, F16 |
| `cli/package.json` | product | modify | F17 — `yaml` direct |
| `cli/src/migrations.js` | product | modify | F18 |
| `framwork/.codeadd/commands/add.done.md` | product | modify | F19 |
| `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md` | product | modify | F20 |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F20 — destination for the graph result |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | F20 |
| `framwork/.codeadd/commands/add.diagnose.md` | product | modify | F20 |
| `framwork/.codeadd/commands/add.review.md` | product | modify | F20 |
| `cli/tests/` (new suites) | product | create | F7, F14, F18 coverage |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level is written BEFORE its F-block lands and is verified to fail
against the current tree. A test written after the fix proves nothing.

### L1 — Build and packaging (RED → GREEN)

1. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 and emits no warning absent from the
   baseline captured before F1. Covers F1–F5, F20. *RED today: the baseline is not yet
   captured.*
2. The build fails when a `## Relations` line names an id that resolves to no document, and passes
   when every id resolves. Covers F1, F2. *RED today: nothing parses that section.*
3. `framwork/.codeadd/templates/related.md` is absent from the tree and from every provider output
   directory. Covers F5. *RED today: it is present.*
4. `node scripts/build.js` leaves `cli/src/mcp/` populated with the contents of `mcp/`. Covers F12.
   *RED today: neither directory exists.*
5. `npm pack` in `cli/` produces a tarball whose file list contains `src/mcp/`, asserted against the
   real tarball listing and never against the `files` array. Covers F12. *RED today: the directory
   does not exist.*
6. The release workflow's CLI-change gate reports changed for a diff touching only `mcp/`. Covers
   F13. *RED today: the gate diffs `cli/` alone.*

### L2 — The reader (integration)

1. Every one of the 22 dependants of `add-doc-schemas` still resolves after F1, and the graph's
   dangling gate reports nothing. Covers F1. *RED today: F1 has not landed.*
2. Over a fixture tree, `search` returns one hit per `*-about` document and zero hits for a file
   carrying no `type:` key. Covers F6, F7.
3. `touched_by` returns both the work items whose file set contains the queried path and the
   reference pages whose `sources` globs cover it. Covers F7.
4. **Both corpora answer identically.** For the artefact corpus, `impact`, `dependencies`,
   `neighbors`, `path`, `orphans` and `stats` each return the same result as `scripts/graph.js` for
   the same input. All six, not most. Covers F7, F8, and **gates F11**.
5. `--corpus=artefacts` in a tree with no `framwork/provider-map.json` exits with an error naming
   the absent probe, and never returns an empty result set. Covers F6.
6. The two indexes are separate files and no node id appears in both. Covers F6.
7. `search` returns the first sentence of the TL;DR; `get` returns the whole section. Covers F7, F8.
8. The cli suite is green after F9 and again after F11, with no assertion lost between them. Covers
   F9, F10, F11.

### L3 — The migration

1. **Idempotency.** Running the migration twice over the same fixture leaves the second run's output
   byte-identical to the first. Covers F18.
2. **Additive only.** Every line present before the run is present after it, unchanged, asserted by
   showing the diff rather than summarising it. Covers F18.
3. Over a fixture derived from the measured installation, the harvest recovers a relation for every
   `{{doc:ID}}` body reference, every `related:` id, every `related.md` Follow-up carrying a
   `{{doc:}}`, and every non-empty Impacted Files list. Per edge, not by total. Covers F17, F18.
4. An id resolving to no document produces no `## Relations` line and appears in the unresolved
   report. Covers F18.
5. The migration writes no commit and leaves the working tree dirty. Covers F18.
6. A file with no `type:` frontmatter key is untouched and counted as skipped. Covers F18.

### L4 — Behavioural acceptance

1. On a fixture project with pre-format deliveries, `codeadd update` leaves every work item carrying
   a `## Relations` section, and `orphans` lists exactly those with no TL;DR. Covers F15, F18, F19.
2. `/add.hotfix`'s confirmed candidate set reaches both the `about.md` `## Relations` and STEP 9's
   blast radius. Neither destination loses it. Covers F4.
3. `/add.done` refuses to close a delivery whose document has an empty TL;DR heading, and accepts one
   whose TL;DR has content and at least one relation. Covers F19.
4. After a fresh `install` and after an `update`, each selected provider's configuration contains
   exactly one MCP registration and its pinned version matches the installed version. Covers F14,
   F15.
5. A user's own markdown file placed in `docs/` is not indexed, is not modified by the migration, and
   does not appear in any action's result. Covers F7, F18.
6. Each of the six commands loading `add-knowledge-discovery` names a destination for the graph
   result. Covers F20.
7. The migration report's wording is correct for an additive migration. Covers F16.
8. `/add.new` writes `## Relations` from its own index result with no question put to the user.
   Covers F3.

**RED expectations against the current tree:** every L1 and L2 level fails today because neither the
format nor the reader exists. L3 and L4 cannot run at all until F1 and F7 land.
**GREEN = all levels pass after F1–F20.**

---

## Execution Order

```
T1  F1 → F2 → F3 → F4 → F5                  [product ×5]
T2  F6 → F7 → F8 → F9 → F10 → F11           [product ×4, internal ×2]
T3  F12 → F13 → F14 → F15 → F16             [internal ×2, product ×3]
T4  F17 → F18 → F19 → F20                   [product ×4]
```

- **F1 first** because every other F-block in T1 consumes its line grammar, and F18 consumes it
  across a topic boundary. F1 is in T1 and F18 in T4, so the order guarantees it.
- **F7 before F8** because the server exposes what the engine produces.
- **F9 → F10 → F11 is the removal sweep, and its direction is the point.** Dependants are retargeted
  while the old file still exists, and the file is deleted last. No commit in between references
  something that is gone.
- **F11 is gated on L2.4**, not merely preceded by it.
- **F12 before F13** because the gate has nothing to detect until the build emits `cli/src/mcp/`.
- **F14 before F15** because the updater calls the writer the installer introduces.
- **F17 before F18** because the migration cannot parse frontmatter without it.

**Working-state boundaries.** A build that must stop should stop at the end of a topic:

| After | The repository is |
|---|---|
| T1 | Consistent. The schemas and two commands write the new sections; nothing reads them yet and nothing breaks |
| T2 | Consistent. The MCP answers both corpora locally; the internal tooling has moved to it |
| T3 | Consistent. Users receive the server and the registration on install or update |
| T4 | Complete. Brownfield projects are filled and the close-out gate keeps them filled |

Stopping **inside** T2 between F9 and F11 is safe by construction: the old server is still on disk
and still registered until F11 runs.

**Per-F-block validation beyond the layer default.** F1 runs L2.1 before anything else in T1 may
proceed, because 22 dependants is the largest blast radius in this plan. F11 runs L2.4 as a gate,
not as a report.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED.
2. **F18 claimed additive without a diff.** "It only adds" is an assertion about every line of every
   user file. L3.2 must show the diff, not a summary of it.
3. **F11 landed on L2.4 partially green.** The level names six verbs and all six must match.
4. **L1.5 asserted against the `files` array instead of the tarball.** The npm whitelist gotcha is
   the exact thing this level exists to catch, and reading `package.json` back does not catch it.
5. **The harvest counted rather than verified.** L3.3 asserts a relation exists per source edge, not
   that the totals happen to match.
6. **A `Consumes` satisfied by a name that drifted.** The line grammar from F1 is consumed by F2, F3,
   F4 and F18; a rename in F1 after those are written breaks them silently.
7. **The removal sweep reordered.** F9 to F11 must land in that order. A build that deletes first and
   retargets after leaves a commit whose test suite cannot pass.
8. **A Closed Question reopened as a finding.** `Closed Questions — do not reopen` records nine
   settled decisions with the evidence behind each. A review that proposes a new command, a second
   MCP server, or files in the user's tree is re-running a finished discussion; check that section
   before writing the finding.

## References

- Design set: `docs/brainstorming/2026-09-12T092440-docs-knowledge-graph-mcp.md`,
  `docs/brainstorming/2026-09-12T075635-delivered-work-relationships-000-umbrella.md`
- Prior art this plan builds on: `2026-09-11T014333-PLAN--product-close-out-parity` — the close-out's
  four-state routing and the fifth converge gate, which F19 extends rather than revisits
- Roadmap: `docs/roadmap/index.md` items 1.1 and 1.2

---

## Next Steps

/add-framework--build docs-knowledge-graph-mcp

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-12 | Initial creation |
| 2026-09-12 | `Closed Questions — do not reopen` added after Proposal: nine settled decisions with the evidence behind each and what would have to change to revisit them. Written for a builder reading the plan cold, so the command question and the one-server question do not come back as findings |
| 2026-09-12 | Review `blocked` resolved. B2: the removal of `scripts/artefact-graph-mcp.js` split into the three-block dependants-first sweep F9–F11, so no F-block writes outside its layer tag; a cross-layer exception added to Global Constraints. B1: rather than name the unnamed command, the command itself was dropped — it was never designed and the measurement showed almost no work left for it after the mechanical harvest. Plan drops from 21 F-blocks to 20 |
| 2026-09-12 | **Implemented.** 20 F-blocks plus F5b, F11b and F19b, in commits cc74e6f..b4294e9 on `feat/docs-knowledge-graph-mcp`. The adversarial pass then applied 23 findings across four commits, 7b2bf3e..326a321. Nine files changed that the Impact table does not list — `add-ecosystem`, `scripts/graph.js`, `web/public/artefact-graph.mmd`, `.gitignore`, `cli/src/cli.js`, `cli/src/mcp.js`, `cli/src/mcp-registration.js`, `cli/package-lock.json` and `cli/tests/hotfix-review-0073.test.js` — each ruled in the ledger with its cost |
