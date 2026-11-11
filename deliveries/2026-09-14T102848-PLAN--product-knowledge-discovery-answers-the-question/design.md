# Brainstorm: Delivered-Work Relationships (Umbrella)

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-12
> **Type:** architecture
> **Layer:** product (every affected artefact; the internal layer is untouched)

## Discovery

The internal layer already has what this umbrella wants for the product layer, and it works. That
asymmetry is the whole motivation.

| What exists | Where | Why it matters here |
|---|---|---|
| `artefact-graph.json` + `scripts/graph.js` + `scripts/artefact-graph-mcp.js` | internal only | A typed relationship map with seven query verbs, exposed to the model as MCP tools. The product layer has no counterpart |
| `docs/delivered.jsonl` + `.codeadd/scripts/delivered.sh` | product | Keyword search over one file, four statuses, anchored items. Written only by `/add.done`. Answers *whether* something shipped, never *what it relates to* |
| `add-knowledge-discovery` | product skill | The one procedure for consulting the index and the wiki. Loaded by six commands |
| `feature-history-agent` | product agent | Reads `docs/features/*/about.md`, `changelog.md` and `plan.md`, scores overlap, returns ranked candidates. Tools are `Glob, Read`; `Bash` and `Grep` are on `disallowedTools` |
| Wiki: `index.md` hub, `domains/<area>.md`, `architecture.md`, `conventions.md`, `workflows.md` | product | Page frontmatter carries `sources` (up to 8 code globs) and `commit`. The `Related` footer links only to other wiki pages |
| `add-wiki-maintenance` STEP 3 | product skill | Computes candidate pages as *changed files ∩ page `sources` globs*. Runs inside `/add.done` STEP 6.7 with `CHANGED_FILES` in hand |
| `gitnexus` | plugin (disabled by default) | Code knowledge graph over calls and refs. Injects into 6 commands and 9 agents. External tool the user installs; codeadd owns utilization only |
| `framwork/.codeadd/templates/related.md` | product template | A relationship table with Features, Hotfixes, Refactors and PR columns. No command reads it. The graph does not model templates as nodes |

Prior deliveries consulted through `graph.js history`:

- `2026-09-07T162415-SELF-PLAN--delivery-index-internal` (`changed`) — created the index, the `history`
  verb and its MCP tool
- `2026-09-09T112557-PLAN--durable-delivery-history` (`live`) — the Delivered Home convention and the
  `origin` change from a file to a directory
- `2026-09-10T203053-PLAN--close-out-hardening` (`live`) — put `node` into the read haystack, fixed
  changelog filename sorting

`2026-09-11T014333-PLAN--product-close-out-parity` is in flight and does **not** overlap: its only two
occurrences of "related" concern preserving the `related:` frontmatter key when complementing a
changelog. Verified by reading the plan, against a discovery report that claimed otherwise.

## Context & Motivation

The framework has to run as autonomously as it can. The human enters a command with a demand and
steers; the agent is what collects, relates and reports what already exists and where the change
lands. **A human is not a search index.** They will not remember whether a feature exists, and they
will certainly not remember its id.

That principle sets the bar for this work. The tools here exist to make "what already exists, and what
does this touch" cheap and precise for a model — few false positives, few tokens, no grep sweep of the
whole `docs/` tree.

Today the product layer answers that question the expensive way. To triage one symptom,
`feature-history-agent` reads the first 30 to 50 lines of **every** `about.md`, then reads the full
`about.md`, `changelog.md` and `plan.md` of the top ten. On a forty-feature project that is forty
partial reads plus thirty full reads, and one of the three files it deep-reads does not exist at the
path it looks for.

## Problem / Opportunity

Eight defects, each verified against the source in this repository.

1. **No edge between two work items.** The record has `superseded_by` and nothing else pointing at
   another entry. A hotfix cannot record that it was caused by feature `0051F`. The relationship exists
   in the head of whoever ran the command and dies there.

2. **The impact question has no verb.** Every entry carries `items[].at`, the files that delivery
   touched — exactly what a new feature's file set would be crossed against. `doRead` deliberately
   excludes `at` from its haystack, and the reason recorded in the code is sound: `--repair` rewrites
   `at` on every anchor move, so matching it would return an entry on the strength of a stale pointer.
   The consequence is that "who has already touched this file" has no answer.

3. **`related.md` is not about relationships.** The `hotfix-related` schema defines TL;DR, Impacted
   Files, Impacted Docs and Follow-ups — a list of files a fix touched. The template that *is* a
   relationship table, `templates/related.md`, is read by nothing.

4. **The investigation input is a dead path.** `init.sh` builds `RECENT_CHANGELOGS` from
   `docs/features/<ID>/changelog.md`. `/add.done` writes `docs/changelog/CHG[NNNN].md`. The two never
   meet. `past-features.md` in `/add.new` and `/add.plan` is built on that dead signal, `/add.hotfix`
   consumes the same signal to "identify related features", and `feature-history-agent` deep-reads the
   same non-existent file.

5. **Four of six commands load the discovery skill and exercise only its wiki half.** `/add.hotfix` and
   `/add.brainstorm` name the index step and say what to do with the result. `/add.plan`, `/add.new`,
   `/add.diagnose` and `/add.review` say "run its procedure" and then carry forward wiki pages only.
   The index result has no named destination in those four.

6. **The single limit already drops dead entries, contradicting two written contracts.** `doRead` sorts
   by `RANK = { live: 0, changed: 1, superseded: 2, gone: 3 }` and then applies `slice(0, limit)` with a
   default limit of 10. Dead sorts last and the cut takes from the end. `delivery-index.md` says "Dead
   entries are returned, never filtered"; the comment three lines above the slice says "Dead entries
   rank last and are NEVER dropped". Both are false for any query matching more than ten entries.

7. **The wiki links only to itself, and the join is computed then discarded.** No feature id appears
   anywhere in the wiki, and no feature document names the domain it lives in. Yet
   `add-wiki-maintenance` STEP 3 already computes *changed files ∩ page `sources` globs* — a
   deterministic mapping from a delivery to the wiki pages it touched — inside `/add.done` STEP 6.7. It
   uses the set to decide what to edit and throws the mapping away.

8. **The one agent built for this cannot reach the index.** `feature-history-agent` has
   `tools: Glob, Read` and lists `Bash` and `Grep` under `disallowedTools`, so it cannot run
   `delivered.sh`. Its input contract is a symptom predicate (`WHEN / THEN / BUT CURRENTLY`), which fits
   `/add.hotfix` and fits neither `/add.new` nor `/add.plan`. It is not among the nine agents that
   receive gitnexus injection.

## Proposed Solution

Four sources of truth about a project, read through one engine, with one rule about who may write what.

**The four sources.** Delivered work answers *what was built and whether it is still there* — that is
the index. The wiki answers *what the modules and patterns are*. The gitnexus plugin answers *what
calls what*, in detail, when the user has installed and indexed it. Git answers *who touched this file
and when*, always, with no plugin. The fourth is the always-available floor under the third.

**Three shapes were considered for how a relationship is recorded**, and the fork governs everything
below it:

| Shape | What it buys | Why it was not enough alone |
|---|---|---|
| A — derived only | Free, never stale. A script crosses two deliveries' file sets and emits the overlap | Blind to intent. It can never know that one feature *replaced* another; to it they merely touch the same files |
| B — declared only | Carries intent, with a type: replaced, depends on, broke | Rots. Nobody returns to a January feature in March to record that it was superseded. The cross-update chain `/add.hotfix` STEP 12 already prescribes is the part that breaks first |
| **C — both, separated by field and by owner** | Derived is computed and discarded; declared is written and append-only. A reader always knows which is which | Chosen |

**Two shapes were considered for where a declared edge lives:**

| Shape | Why not / why yes |
|---|---|
| A — index only | One read, cheap back-reference. But the index line is born at close-out, and an edge discovered during investigation has nowhere to go until then |
| B — frontmatter only | Exists from the document's first minute. But reading relationships means opening N files, and a back-reference means editing a feature closed months ago |
| **C — frontmatter drafts, index publishes** | Chosen, with a one-way rule that removes the duplication objection: investigation reads **only** the index, and the frontmatter has exactly one reader — `/add.done`, composing the line. With one reader there is no divergence to arbitrate |

**Three shapes were considered for the engine:**

| Shape | Verdict |
|---|---|
| A — grow `delivered.sh` | The script is 452 lines of argument-parsing bash that ends in `node -e "$NODE_PROG"`. Reverse traversal, pairwise file overlap and the wiki glob join are set operations over parsed JSON; in bash they become more node inside a string |
| B — a sibling shell script | Two readers of one index is exactly what the read contract's no-re-ranking rule exists to prevent |
| **C — a `.js` engine plus an MCP wrapper** | Chosen. Node is already a hard dependency — `delivered.sh` aborts with `ERROR=node-missing`. An MCP tool has a typed schema the model calls directly instead of recalling a bash invocation with the right flags. Vector search, the declared next phase, does not fit in bash at all |

### What a record looks like

The file stays one minified JSON object per line; this is broken for reading. `rel` is the new field.

```json
{"v":1,"ts":"2026-06-04T18:07:55Z","id":"0053H","layer":"product","by":"done",
 "status":"live","name":"token não renova depois de 1h","words":"token expira refresh 401",
 "commits":["c7d8e9f"],"origin":"docs/features/0053H-token-refresh/",
 "rel":[{"to":"0051F","type":"caused_by","why":"o refresh entrou sem teste de expiração"}],
 "items":[{"what":"correção do refresh","at":"src/auth/token.ts","find":"refreshToken"}]}
```

No entry records a reverse edge. `loadIndex()` already reads the whole file into a Map on every call,
so "who points at me" is a scan of data that is in memory regardless. The only cost is a four-row table
that inverts the label for display.

A read returns stored edges and computed overlap in separate blocks, so a consumer never has to guess
whether a relationship was asserted by a person or deduced by a machine:

```
MATCHED_LIVE=3   MATCHED_DEAD=0   RETURNED_LIVE=3   RETURNED_DEAD=0
REL=0053H:caused_by:0051F:o refresh entrou sem teste de expiração
OVERLAP=0042F:0053H:src/auth/token.ts
```

The overlap block is where the derived edge earns its place. Nobody declared any link between `0042F`
and `0053H` — whoever opened the hotfix believed the fault was in the SAML flow. The shared
`src/auth/token.ts` is the only signal that touching it reaches all three deliveries.

## Type of Artefact

Mixed, and the plan will need blocks of each kind:

- **script** — a new `.js` engine under `framwork/.codeadd/scripts/`, the first there
- **script** — an MCP wrapper over that engine, mirroring `artefact-graph-mcp.js`
- **script** — repairs to `delivered.sh` (two-bucket limit) and `init.sh` (changelog path)
- **schema** — `rel` in `add-doc-schemas`; the changelog path owned in one place
- **skill** — `add-knowledge-discovery` gains the relationship step; `add-wiki-maintenance` records its join
- **command** — `/add.new`, `/add.plan`, `/add.hotfix`, `/add.brainstorm`, `/add.done`
- **agent** — the survey agent, and the disposition of `feature-history-agent`
- **template** — the orphan `templates/related.md` is adopted or deleted

## Scope

### Includes

- A closed relationship vocabulary, stored forward-only, plus one derived relationship never stored
- A read contract that ranks and cuts with two buckets and a score floor, and reports counts per bucket
- A `.js` engine and an MCP wrapper shipped to the product layer
- The file-to-delivery impact lookup, with an answer to the stale-`at` objection that blocks it today
- The wiki leg: recording the delivery-to-page join that close-out already computes
- A survey agent that reads the four sources and returns one structural picture to other agents
- Repair of the dead changelog path and everything downstream of it
- Repair of the limit that already drops dead entries
- A migration path for projects whose deliveries predate the format

### Does NOT Include

- **Vector search.** The declared next phase. This umbrella reserves what it needs and builds none of it
- **The internal layer.** It has its graph and its MCP and they work
- **Any dependency on gitnexus.** It is a plugin, disabled by default, installed by the user. It enriches; it is never required
- **Rewriting index lines.** Hard ban 6 stands: corrections are new lines
- **Making `items[].at` searchable by `delivered.sh read`.** The exclusion is deliberate and its reason holds

## Key Decisions

| # | Decision | Rationale | Validated |
|---|---|---|---|
| 1 | Derived and declared relationships coexist, separated by field and by owner | Derived is free and blind to intent; declared carries intent and rots. Mixing them in one field destroys the reader's ability to weigh either | ✅ |
| 2 | Reading a relationship must never require reading the whole document | Rules out any design where the relationship sits in a section of body text — which is where `related.md` puts it today | ✅ |
| 3 | Frontmatter is the draft; the index is the published record; promotion runs one way at close-out | Investigation reads **only** the index, so the frontmatter has exactly one reader and there is no divergence to arbitrate | ✅ |
| 4 | A work item that has not closed does not appear in search | The honest price of decision 3. Two features in flight cannot see each other. "Not closed, not indexed" is true and misleads nobody | ✅ |
| 5 | The relationship vocabulary is closed | Same discipline as the four statuses, which `delivery-index.md` already forbids extending. A closed list lets a script branch on the value without guessing | ✅ |
| 6 | The stored types are `caused_by`, `depends_on`, `part_of`, all pointing forward | Each changes what a reader does next. A type that leads to the same action as another is not a separate type | ✅ |
| 7 | `superseded_by` stays where it is and does not enter `rel` | It is part of the status, not an edge — the format already forbids `superseded` without it. Putting it in both places is the duplication decision 3 exists to prevent | ✅ |
| 8 | One derived relationship: file overlap between two deliveries. Computed at read time, never written | It finds links nobody declared, which is precisely what a declared-only design cannot do | ✅ |
| 9 | Reverse edges are traversed at read time, never written | `loadIndex()` already parses the entire index into memory on every call. Writing the reverse side buys nothing and reintroduces the cross-update chain that breaks first | ✅ |
| 10 | `supersedes` is a declaration in the draft, consumed at close-out | It becomes a new line for the **older** entry carrying `status: superseded` and `superseded_by`. It is never stored on the declaring entry. `/add.done` already writes new lines for other entries when a diff touches their items — this is the same operation | ✅ |
| 11 | A line written from a supersession declaration carries `by: human` | The field separates "a machine repaired this" from "a person declared this". A person asserted it, in a document, at spec time; the command only carried it | ✅ |
| 12 | **No relationship is ever born from human memory** | The user will not recall whether a feature exists, let alone its id. Every edge comes from an index query the command itself ran, written into the document at the investigation step. `/add.done` asks nothing — it promotes what the document already carries | ✅ |
| 13 | The field is named `rel` on both surfaces | `related:` already exists across the schemas as a list of bare ids. Reusing the name with a typed shape would silently change the meaning of every document already on disk | ✅ |
| 14 | `why` is required on every declared edge and gets a shape rule | It is the rejection surface: what lets an agent discard a candidate **without opening the document**. Its exact rule belongs to subtopic 002, for the reason `find` has one | ✅ |
| 15 | Ranking lives inside the read contract, never in the consumer | The existing rule holds: several consumers each sorting one shared result is how two of them come to disagree | ✅ |
| 16 | Deterministic scoring in the engine; an LLM judge is an agent dispatch | The engine is bash and node with no network and no model. The judge is subtopic 005 | ✅ |
| 17 | Two independent caps: 5 live plus up to 2 dead | One cap is what produces defect 6. Dead entries answer "we tried this and dropped it", which is the most valuable answer the index gives | ✅ |
| 18 | A reserved slot is not a free pass — a dead entry must clear the same score floor | Otherwise two slots are reserved and filled with noise | ✅ |
| 19 | No backfill: unused dead slots do not go to live entries | Backfilling makes the live cut depend on unrelated data, so one query returns different live sets depending on whether a dead entry happened to match | ✅ |
| 20 | The cap numbers are a declared tunable, not a discovery | Same treatment `delivery-index.md` already gives its over-match thresholds: changing them requires evidence and an updated line | ✅ |
| 21 | Counts are reported per bucket | `MATCHED 40 RETURNED 7` does not say whether a dead entry was cut. An agent told only the seven concludes there are seven | ✅ |
| 22 | The engine ships as `.js` with an MCP wrapper | Node is already a hard dependency. An MCP tool carries a typed schema the model calls directly. Vector search does not fit in bash | ✅ |
| 23 | Success is measured as cost, not tidiness | The claim to prove is that the triage phase drops from N partial reads plus M full reads to one file read | ✅ |
| 24 | Nothing may depend on gitnexus | It is a plugin: external, user-installed, disabled by default. Every leg must degrade to a working answer without it, with git as the always-available floor | ✅ |
| 25 | Vector search gets two reservations and nothing else | A stable id per document, which exists; and no vector inside the index line. Vectors live in a separate gitignored, rebuildable sidecar, like the three the build already emits | ✅ |
| 26 | The dead changelog path is repaired inside this work, not after it | An investigation step that reads a file nothing writes cannot be the place a relationship is born | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|---|---|---|
| `docs/delivered.jsonl` (format) | Gains `rel` | Extend `delivery-index.md`: the field, the closed vocabulary, the `why` shape rule, the two-bucket read contract |
| `.codeadd/scripts/delivered.sh` | Two-bucket limit; per-bucket counts; promotion of a `supersedes` declaration into a line for the older entry | Repair `doRead`; extend `write` |
| `.codeadd/scripts/` (new `.js` engine) | New artefact — first `.js` in the product scripts directory | Register in `provider-map.json`; decide the build's treatment of a non-`.md` product artefact |
| MCP wrapper | New artefact | Mirror `artefact-graph-mcp.js`; document the setup path for a user's project |
| `.codeadd/scripts/init.sh` | `RECENT_CHANGELOGS` reads a path nothing writes | Repair against the path `/add.done` actually writes |
| `add-doc-schemas` (`history.md`, `fix.md`, `new-feature.md`, `delivery-index.md`) | `rel` in frontmatter; the changelog path owned in exactly one place | Schema edits |
| `add-knowledge-discovery` | The INDEX step gains relationships and impact | New step, and a named destination for the result in all six commands |
| `add-wiki-maintenance` | STEP 3 already computes the delivery-to-page join and discards it | Record it on both sides |
| `/add.new`, `/add.plan` | `past-features.md` is built on a dead signal | Repair, then write `rel` from the index result |
| `/add.hotfix` | STEP 5.2 already shows candidates with ids; STEP 12 writes the wrong kind of `related.md` | Write `rel` at 5.2; settle what STEP 12 produces |
| `/add.brainstorm` | Already runs the ranked lookup | Give the result a destination |
| `/add.done` | Promotes `rel` from documents; consumes `supersedes`; records the wiki join | Extend STEP 6.7 and 6.8 |
| `feature-history-agent` | Cannot reach the index; reads a dead path; symptom-only input contract | Subtopic 005 decides: extend or retire |
| `templates/related.md` | Orphan, and the only artefact shaped like what this work needs | Adopt or delete |
| `cli/tests/` | Every mechanism above needs coverage | New suites; the suite runs serially |
| Wiki page frontmatter | Gains the delivery join | Additive; existing pages stay valid |

## Trade-offs & Risks

| We gain | We give up |
|---|---|
| One file read replaces a sweep of every feature document | A new `.js` artefact and an MCP surface to maintain in the product layer |
| Relationships a keyword search cannot find, declared and derived | Work at authoring time in five commands |
| A reader that always knows whether a link was asserted or deduced | Two blocks in the output instead of one flat list |
| Dead entries stop being silently dropped | Slightly smaller live result sets at the default cap |
| Ground prepared for vector search | A sidecar to build and keep out of git |

| Risk | Probability | Mitigation |
|---|---|---|
| The `.js` engine drifts from `delivered.sh` and the two answer differently | Medium | The engine reads the index; it never writes it. `delivered.sh` stays the only writer, exactly as it is the only writer today |
| Agents write low-value `rel` entries because the field is required | Medium | The `why` shape rule and the score floor. An edge that cannot state why in one line is not an edge |
| File overlap produces noise in projects with a few very large files | Medium | The same over-match discipline the index already applies to `find`, with the threshold declared and evidence-backed |
| The build has no path for a non-`.md` product artefact | Medium | Verify before planning. Shell scripts already ship verbatim; a `.js` may follow the same route or may not |
| An MCP server in a user's project needs setup the user must perform | High | Same shape as the gitnexus `postEnableHint`. The engine must answer from the CLI with no MCP configured |
| Repairing the changelog path breaks projects already on the old layout | Medium | Subtopic 001 owns the compatibility question. Reading both paths during a transition is cheaper than a migration |
| Scope: six subtopics is a large plan | High | The decomposition below is ordered by dependency, and each subtopic is independently deliverable |

## Decomposition Map

| Subtopic | Design path | Purpose |
|---|---|---|
| 001 — Changelog path repair | `2026-09-12T075635-delivered-work-relationships-001-changelog-path.md` | Repair the dead `RECENT_CHANGELOGS` input and everything reading it, so the investigation step is real before a relationship is hung on it |
| 002 — The relationship index | `2026-09-12T075635-delivered-work-relationships-002-relationship-index.md` | `rel` in the record and the frontmatter, the closed vocabulary, the `why` shape rule, reverse traversal, the two-bucket read contract, the limit repair |
| 003 — The impact question | `2026-09-12T075635-delivered-work-relationships-003-impact-lookup.md` | File to delivery. The derived overlap edge, and an answer to the stale-`at` objection that keeps `at` out of the haystack today |
| 004 — The wiki leg | `2026-09-12T075635-delivered-work-relationships-004-wiki-leg.md` | Record the delivery-to-page join `/add.done` already computes, on both sides, and what a page then carries |
| 005 — The survey agent | `2026-09-12T075635-delivered-work-relationships-005-survey-agent.md` | One agent reading all four sources, returning what exists, what is touched and the blast radius. Settles `feature-history-agent`'s fate and where the LLM judge runs |
| 006 — Legacy migration | `2026-09-12T075635-delivered-work-relationships-006-legacy-migration.md` | An opt-in command that builds the initial relationship structure over deliveries that predate the format. Roadmap item 1.2 |

The engine and the MCP wrapper are not a subtopic. They are the vehicle 002 introduces and 003, 004 and
005 extend — splitting them out would put one artefact under four owners.

## Dependencies & Relationships

Refine in order. The dependencies are real, not preferences.

```
001 changelog path
  └─> 002 relationship index      (needs a live investigation step to write into)
        ├─> 003 impact lookup     (needs the record shape and the read contract)
        ├─> 004 wiki leg          (needs somewhere to record the join)
        │     └─> 005 survey agent (reads 002, 003, 004 and git; gitnexus optional)
        └─> 006 legacy migration  (needs the format it migrates into)
```

`003` and `004` are independent of each other and can be refined in either order. `005` is the
consumer that makes the rest worth building and must be refined last among the mechanisms. `006` is the
roadmap's item 1.2 and may be deferred without weakening anything above it.

**Roadmap alignment.** `docs/roadmap/index.md` item 1.1 is subtopics 001 through 005; item 1.2 is
subtopic 006 and already declares its dependency on 1.1.

## Next Steps

Run: `/add-framework--plan delivered-work relationships — the product layer gets a relationship index over delivered documents, an impact lookup, a wiki join, and one survey agent, on a repaired investigation input`
