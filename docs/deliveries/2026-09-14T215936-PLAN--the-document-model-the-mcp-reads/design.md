# Brainstorm: The document model the MCP reads, and the reference that owns it

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-14
> **Type:** architecture

## Discovery

- **`mcp/corpora.mjs`** — `classify()` at `:267` decides what a document becomes. **`mcp/engine.mjs`** holds the eleven actions. Neither is a graph node: `add-artefact-graph`'s standing list covers every file that is not an artefact, so no dependant answer exists for them and none was invented.
- **`add-doc-schemas`** (product skill) — **23 direct dependants**, the highest count in the ecosystem. It declares every document schema and is what a command reads before writing anything.
- **`add-knowledge-discovery`** (product skill) — **8 direct dependants**. The consumption half: which question reaches which action, and how to read the result.
- **`add.wiki`** (product command) — **16 direct dependants**. It writes the wiki pages, and its frontmatter contract is where the Diátaxis types entered the framework.
- **`2026-09-12T104012-PLAN--docs-knowledge-graph-mcp`** — shipped the typed `## Relations` section, the closed four-value vocabulary and the docs corpus itself. This design extends that delivery, it does not replace it.
- **`2026-09-14T145149-PLAN--the-impact-question-...`** — shipped `touched_by`'s delegation and **deleted the last reader that tolerated an old document shape**. That deletion is what turns silence into a defect: from here a document is either in the current format or it is invisible, and the two look identical from the caller's side.
- **Roadmap 1.4 (the doctor)** — this design is its missing half. A doctor that reports which documents are fit needs a declared rule set to measure against, and there is none today.

## Context & Motivation

The operator wants to publish a release and use the framework in real projects. That was checked first, because it decides whether any of this is urgent: **nothing breaks with an empty MCP.** Both product callers are non-blocking by their own text — `add.done.md:675` (*"NON-BLOCKING... Never block a merge on a cache"*) and `add-knowledge-discovery/SKILL.md:185` (*"Graph absent → no-op... No project is broken by not having one"*) — and an unanswerable question comes back carrying `unavailable` with a reason, so an agent cannot mistake it for "nothing touched this".

The problem is not safety. It is **reach**: the MCP answers about very little, and the reason is that membership in the graph is decided by a string suffix instead of by a declared model.

## Problem — measured, not inferred

Four findings, each produced by building a fixture and running the shipped indexer against it.

### 1. Two thirds of every wiki is invisible

`add.wiki.md:257` instructs every wiki-writing analyzer to emit `type: reference | how-to | explanation`. `classify()` at `corpora.mjs:272` accepts exactly one:

```js
if (type === 'reference' && relPath.includes('.codeadd/wiki/')) return { kind: 'reference page', type };
```

Fixture — one page of each of the three declared types:

```
nodes: 1   skipped: 2
→ only wiki/backend/reference-page entered, kind "reference page"
```

A `how-to` and an `explanation` fall through to attachment, find no work item under `.codeadd/wiki/`, and are dropped as `attachment resolves to no work item`. **This is not the command being wrong.** It is the command following a published standard and the indexer knowing a quarter of it.

### 2. Node-or-not is a string suffix

```js
if (String(type).endsWith('-about')) return { kind: 'work item', type };
```

There is no list of valid types anywhere in the repository. Consequences, all silent: a typo (`feature-abuot`) becomes an attachment; any document whose role is "a thing you look up" but whose name does not end in `-about` is demoted; and the suffix itself is a data structure leaking into a name — it exists so `endsWith` has something to match.

### 3. Owner resolution is implicit, so a drop names no cause

An attachment finds its owner by trying the directory, then a `part_of` relation, then `related:`. The order is implicit and the failure is one message for three different causes. Fixture — one document per shipped schema:

```
nodes: 1   edges: 0   skipped: 4
resolved as attachments: feature-plan, changelog, review   (all three by directory)
dropped: "attachment resolves to no work item"  × 4
```

A reader of that output cannot tell "this type has no owner rule" from "this document's owner is missing".

### 4. The corpus registry describes itself too loosely

`corpora.mjs:531` states membership as *"frontmatter carries a `type:` key"*. That is not the rule — the rule is `-about`, or `reference` under the wiki root. The loose sentence is what a doctor built from the registry would validate against, and it would pass files the indexer silently drops.

## What the outside world already standardised

There is **no single standard** for a document knowledge graph, and no convention specific to MCP — MCP is a transport and tool protocol and says nothing about document schemas. There are three mature bodies of work, each covering a different layer. The right move is to adopt each where it fits and to state plainly where we diverge.

| Standard | Layer it covers | Status |
|---|---|---|
| **Diátaxis** (Daniele Procida, 2020) | Documentation page types | Used by Django, Canonical, Cloudflare, Gatsby. `add.wiki` already follows it |
| **DCMI Metadata Terms** (Dublin Core, ISO 15836) | Relationship vocabulary between resources | The most widely adopted document metadata standard there is |
| **Open Knowledge Format v0.2** (Google Cloud Platform) | Bundle shape — markdown + YAML frontmatter | Young (v0.2), not widely adopted. Closest prior art to what this is |

### Diátaxis — adopted in full

Four types, from the intersection of two axes (action vs knowledge, study vs work): **tutorial**, **how-to**, **reference**, **explanation**. `add.wiki` already emits three. The registry takes all four, `tutorial` included even though nothing writes one yet — leaving it out would repeat the exact defect being fixed.

### DCMI — adopted as a declared mapping, not as a rename

Four of the five relation types are DCMI terms with the same semantics:

| codeadd | DCMI term | DCMI definition |
|---|---|---|
| `part_of` | `dcterms:isPartOf` | a related resource in which the described resource is included |
| `depends_on` | `dcterms:requires` | the described resource requires the referenced one to function |
| `links_to` | `dcterms:references` | the described resource points to the referenced one |
| `superseded_by` | `dcterms:isReplacedBy` | a related resource that supplants or supersedes this one |
| `caused_by` | **none** | local extension; the nearest published term is `prov:wasInfluencedBy` |

The vocabulary is kept as written. Renaming buys interoperability with an external consumer that does not exist, costs a rewrite of every document already written, and replaces names an agent reads well with names from library science.

### OKF — its minimalism adopted, its relation model rejected

Its core rule is already this project's rule: *"`type` is the only always-required key; a concept carrying just `type` is fully conformant."* Its `sources`, `generated`, `status` and `tags` families already have counterparts in the wiki frontmatter.

Two deliberate divergences, recorded so a later reader does not "fix" them:

- **Relations.** OKF expresses them as ordinary markdown links and states that *"consumers treat all links as untyped directed edges. The specific relationship kind is conveyed by surrounding prose."* That is strictly worse than a typed closed vocabulary: a relation whose kind lives in the surrounding text is not a field, and nothing mechanical can follow it. The typed `- <type> [[<id>]]` grammar stays.
- **Identity.** OKF derives a concept id from its file path. This project declares `id:` in frontmatter, because an id survives a move and a path does not — the same reason `delivered.sh` treats `at` as a hint and never as identity.

One OKF rule **is** adopted verbatim, and it is the escape hatch: *"consumers MUST NOT reject a bundle because of... unknown `type` values"*. A project defines types this framework never heard of, and dropping them silently is the failure being removed.

## Proposed Solution

### Layer 1 — The frontmatter contract

```yaml
---
id: 0001F        # required on every document, pages included
type: feature    # required, always — the only always-required key
---
```

Everything else is per-type and declared by the registry.

### Layer 2 — The type registry: `type` → `kind`

One declared table in `mcp/`, replacing `endsWith('-about')`. Three kinds, and they are **the words the engine already emits today** — `"kind": "work item"` and `"kind": "reference page"` appear in every result, and `stats` returns a `kinds` breakdown. The concept exists on the way out and is guessed on the way in; this declares it.

```js
// mcp/types.mjs — illustrative; the plan derives the real list from add-doc-schemas
feature:          { kind: 'work-item',  requires: ['id', 'slug', 'status'] },
hotfix:           { kind: 'work-item',  requires: ['id', 'severity']       },
'setup-receipt':  { kind: 'work-item',  requires: ['id']                   },

'feature-plan':   { kind: 'attachment', owner: 'dir'     },
'feature-design': { kind: 'attachment', owner: 'dir'     },
epic:             { kind: 'attachment', owner: 'dir'     },
review:           { kind: 'attachment', owner: 'dir'     },
'qa-validation':  { kind: 'attachment', owner: 'dir'     },
changelog:        { kind: 'attachment', owner: 'related' },
brainstorm:       { kind: 'attachment', owner: 'related' },

reference:        { kind: 'page', root: '.codeadd/wiki/**' },
'how-to':         { kind: 'page', root: '.codeadd/wiki/**' },
explanation:      { kind: 'page', root: '.codeadd/wiki/**' },
tutorial:         { kind: 'page', root: '.codeadd/wiki/**' },
```

**The owner mode is declared per type**, not attempted in an implicit order, so a dropped attachment reports which rule failed.

**`setup-receipt` becomes a work item.** It was an attachment that could never have an owner, so it always vanished. It is a document about the project, not an annex of a feature — and that answer only becomes available once a human decides per type instead of deriving from a suffix.

**The escape hatch:** a document may declare `kind:` itself, and it then counts even with a `type` the registry does not know. A type that is neither in the registry nor carries an explicit `kind` is a **doctor finding**, never a silent drop.

### Layer 3 — Relations

Grammar unchanged: `- <type> [[<id>]] — <why>`. The reference carries the DCMI mapping table above, so the graph is exportable and the vocabulary is defensible without a migration.

### Layer 4 — Consumption

Three rules that decide whether the MCP is useful, and that are written nowhere today:

1. **An attachment is never returned on its own.** It is not a search hit; it comes back listed on its owner. An agent that queries for an attachment directly, finds nothing, and concludes the document does not exist is the failure this rule prevents.
2. **Each kind answers a different question.** `work-item` answers *what was done*; `page` answers *how this area works*. Asking a reference page for history returns a legitimate empty that reads like a defect.
3. **Empty and unavailable never merge, and degradation is a declared ladder:** index → git → nothing. The `unavailable` key with its reason already exists in the code; the reference states that it is contract, not implementation detail.

### Layer 5 — The doctor (roadmap 1.4)

The registry **is** the doctor's rule set: type known, `requires` present, `## Relations` lines well-formed and resolving, owner resolvable by the declared mode. Each failure names the field. This is why the registry and the doctor are one piece of work and not two — without the first, the second has nothing to measure.

## Type of Artefact

architecture

## Scope

### Includes

- `mcp/reference.md` — **the source of truth for the document model**, carrying: the frontmatter contract, the type registry table, the three kinds, the owner modes, the relation grammar with its DCMI mapping, the identity rules, the consumption rules, and the recorded divergences from OKF.
- `mcp/types.mjs` (or equivalent data file) — the declared registry, read by the parser. The reference's table is **generated from it**, so the two cannot drift.
- `classify()` rewritten to read the registry instead of testing a string suffix.
- Owner resolution driven by the declared mode, reporting which mode failed.
- Diátaxis complete: all four page types index.
- The `-about` suffix dropped from type names (`feature-about` → `feature`), with a migration that rewrites the frontmatter of existing documents.
- Pages get a declared `id:` instead of a path-derived one.
- `add-doc-schemas` aligned to the registry — it is the authoring side of the same table.
- `corpora.mjs:531`'s membership sentence corrected to state the real rule.
- An internal-layer rule binding any `mcp/` architecture change to a `mcp/reference.md` update, hosted in `add-framework-product-layer`.

### Does NOT Include

- **Renaming the relation vocabulary to DCMI names.** The mapping is declared; the authoring surface stays.
- **Adopting OKF's untyped-link relation model.** Recorded as a deliberate divergence with its reason.
- **The doctor itself (roadmap 1.4).** This design supplies the rule set the doctor needs and stops there.
- **The `1.2` migration for projects that declared no relationships at all.** Unchanged and still downstream.
- **Anything about `add.init`, `product.md` or `owner.md`.** Their removal is handled in a separate planning session; this design does not list them in the registry and takes no position beyond that.

## Key Decisions

| Decision | Rationale | Validated |
|---|---|---|
| The registry is a data file in `mcp/`; the reference's table is generated from it | Parser and doctor read one source. A markdown table parsed as a schema is fragile; a hand-kept copy drifts — twice in one session a description was found looser than the code it described | ✅ |
| Relation names stay; the DCMI mapping is declared | Four of five are DCMI terms already. Renaming rewrites every written document to buy interoperability with a consumer that does not exist | ✅ |
| `kind` is derived from `type` via the registry, not declared per document | Two declarations of the same fact drift. One `type:` in the document, one mapping in the registry | ✅ |
| A document may still declare `kind:` explicitly | OKF: a consumer must not reject unknown types. It is how a project defines its own types without this framework maintaining an eternal list | ✅ |
| All four Diátaxis types index, `tutorial` included | Shipping three of four is the current defect. Leaving the fourth out because nothing writes it yet repeats it | ✅ |
| The `-about` suffix is dropped from type names | It exists only so `endsWith` has something to match. With a registry it has no function, and it is a data structure inside a name | ✅ |
| Pages get a declared `id:` | Path-derived identity breaks on a move. Same reasoning the index already applies to `at` | ✅ |
| `mcp/reference.md` is the source of truth and evolves with the MCP | A reference that lags the code is what hid the `touched_by` gap: a retirement note claimed a file list "lives now" in the index, and it was the note, not the code, that everyone believed | ✅ |
| The reference lands **with** the code, never before it | A specification written ahead of its implementation reads as a description of what exists. That is the precise failure above | ✅ |

## The reference as source of truth, and the rule that keeps it true

`mcp/reference.md` is not documentation produced after the fact. It is the **declaration the implementation answers to**, and the registry it describes is machine-read, so the two are checkable against each other rather than consistent by good intentions.

A source of truth that nothing enforces decays. The enforcement is an internal-layer rule, and it has a natural host: **`.claude/skills/add-framework-product-layer/`** already declares `mcp/` inside its scope (`SKILL.md:21`), and already owns a `## Validation` section and a `## Two Rules That Bind Every Source Edit` section.

The rule to add, in that skill:

```
IF AN F-BLOCK CHANGES THE DOCUMENT MODEL, THE TYPE REGISTRY, THE RELATION
VOCABULARY, THE CORPUS RULES OR ANY ACTION'S RESULT SHAPE UNDER mcp/:
  ⛔ DO NOT: Commit the block without mcp/reference.md in the same diff
  ⛔ DO NOT: Leave the reference describing the previous model "until the next pass"
  ✅ DO: Update mcp/reference.md in the SAME F-block, and say what changed in it
```

Same-block, not same-delivery, for the reason the ledger already gives for dependents: a rename that updates its callers in a later block leaves the tree inconsistent at a commit boundary. **A change that only adds an action or fixes a bug without touching the model does not trigger it** — a rule that fires on every edit is one people learn to ignore.

Whether the check is also mechanical (a gate in `build.js` comparing the registry's generated table against the reference) is left to the plan. The declared rule comes first; a gate with no declared rule behind it is a tripwire nobody can read.

## Ecosystem Impact

| Component | Called by (graph, depth 1) | Impact | Action |
|---|---|---|---|
| `mcp/corpora.mjs` | no node — not an artefact (`add-artefact-graph` standing list) | `classify()` and owner resolution rewritten against the registry | Rewrite |
| `mcp/engine.mjs` | no node — not an artefact | Reads `kind` as declared rather than inferred | Adjust |
| `mcp/reference.md` | new | The source of truth | Create |
| `mcp/types.mjs` | new | The declared registry | Create |
| `add-doc-schemas` | **23 dependants** — `add.new`, `add.plan`, `add.build`, `add.done`, `add.hotfix`, `add.review`, `add.audit`, `add.brainstorm`, `add.diagnose`, `add.plan-to-ready`, `add.pull-request`, `add.qa-setup`, `plan-reviewer-agent`, among others | Every `type:` value it declares changes when `-about` is dropped. **Highest-risk artefact in the change** | Align to the registry; the rename touches every schema block |
| `add-knowledge-discovery` | 8 — `add.new`, `add.plan`, `add.hotfix`, `add.review`, `add.brainstorm`, `add.diagnose`, `add-feature-discovery`, `conformance-agent` | Gains the three consumption rules; the attachment rule is new information for every caller | Update |
| `add.wiki` | 16 | Its frontmatter contract becomes the Diátaxis four, and pages gain a declared `id:` | Update |
| `cli/src/migrations.js` | no node — not an artefact | A migration rewrites `feature-about` → `feature` in existing documents | Add migration |
| `add-framework-product-layer` (internal) | internal skill | Hosts the reference-update rule | Update |
| `cli/tests/mcp-*.test.js` | no node — not an artefact | Every membership assertion changes | Update |

## Open Questions for the Plan

1. **The `-about` migration touches user content, not internal dead code.** It rewrites frontmatter in the user's own documents. Additive-only is not available here — the old value must go, or both index. The plan decides whether the migration runs automatically on `codeadd update` or is opt-in, and what it does with a document it cannot parse.
2. **Do pages keep answering by path id during the transition?** A declared `id:` on a wiki page is new; existing pages have none, and `add.wiki` regenerates pages, which may make the question moot.
3. **Is reference/registry consistency also a build gate**, or only a declared rule? Deliberately deferred here.
4. **Where does `epic` sit** — attachment by directory, or a work item of its own? It carries an `id:` equal to its feature's, which is the shape of an attachment, but it describes a body of work, which is the shape of a node.

## References

- Diátaxis — https://diataxis.fr/ and https://diataxis.fr/start-here/
- DCMI Metadata Terms — https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
- DCMI `isPartOf` — https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/isPartOf/
- DCMI `isReplacedBy` — https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/isReplacedBy/
- Open Knowledge Format v0.2 (Google Cloud Platform) — https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
- IWE, a markdown knowledge graph with per-type schema validation and OKF conformance — https://github.com/iwe-org/iwe
