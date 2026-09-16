# The document model — reference

**This file is the source of truth for what a document is to the MCP.** The
implementation answers to it, not the other way round.

⛔ **The two tables below are GENERATED from `mcp/types.mjs`.** Run
`node mcp/generate-reference.mjs` after changing the registry. Do not hand-edit
between the `<!-- generated:… -->` markers — `cli/tests/mcp-document-model.test.js`
L4.1 fails when they differ, so a forgotten regeneration is caught in CI rather
than shipped.

⛔ **A change to this model updates this file in the SAME F-block.**
`.claude/skills/add-framework-product-layer/SKILL.md` states that rule. A
reference that lags the code is what hid the `touched_by` gap for weeks: a
retirement note claimed a file list "lives now" in the index, and it was the
note, not the code, that everyone believed.

---

## 1. The frontmatter contract

```yaml
---
id: 0001F        # required on every document, pages included
type: feature    # required, always — the only always-required key
---
```

Everything else is per type and the registry declares it.

**`type` is the only always-required key.** That is [Open Knowledge
Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)'s
rule and it is this project's rule.

**`id` is declared, never derived.** OKF derives a concept id from its file path.
This project does not, for the reason the delivery index already states about an
item's `at`: a path is a hint, an id is identity. Move a file and a derived id
changes, so every relation pointing at it breaks with nothing to show for it.

## 2. The three kinds

| `kind` | What it is | What it answers |
|---|---|---|
| `work-item` | A thing you look up — a feature, a hotfix, a PRD, a report | **What was done** |
| `page` | A wiki page, one of the four Diátaxis types | **How this area works now** |
| `attachment` | An annex of a work item — a plan, a changelog, a review | Nothing on its own |

⛔ **An attachment is never returned alone.** It is listed on the work item that
owns it and it is not a search hit. An agent that searches for an attachment,
finds nothing, and reports that it does not exist has read a silence as evidence.

**These are the values the engine emits as `kind` and accepts as the `kind`
filter on `search` and `orphans`.** They were previously inferred from whether
the type string ended in `-about`: the engine said `kind` on the way out while
guessing it on the way in.

## 3. The type registry

<!-- generated:TYPES -->
| `type:` | `kind` | owner mode | root | required frontmatter |
|---|---|---|---|---|
| `audit-report` | `work-item` | — | — | `id` |
| `brainstorm` | `work-item` | — | — | `id` |
| `brainstorm-intent` | `work-item` | — | — | `id` |
| `diagnose-report` | `work-item` | — | — | `id` |
| `feature` | `work-item` | — | — | `id`, `slug`, `status` |
| `hotfix` | `work-item` | — | — | `id`, `severity` |
| `prd` | `work-item` | — | — | `id` |
| `setup-receipt` | `work-item` | — | — | `id` |
| `explanation` | `page` | — | `.codeadd/wiki` | `id` |
| `how-to` | `page` | — | `.codeadd/wiki` | `id` |
| `reference` | `page` | — | `.codeadd/wiki` | `id` |
| `tutorial` | `page` | — | `.codeadd/wiki` | `id` |
| `changelog` | `attachment` | `related` | — | `id` |
| `epic` | `attachment` | `dir` | — | `id` |
| `feature-design` | `attachment` | `dir` | — | `id` |
| `feature-plan` | `attachment` | `dir` | — | `id` |
| `qa-validation` | `attachment` | `dir` | — | `id` |
| `review` | `attachment` | `dir` | — | `id` |
<!-- /generated:TYPES -->

⛔ **A type absent from this table is REPORTED, never demoted.** A document may
declare `kind:` in its own frontmatter and it then counts, whatever its type —
OKF again: a consumer "MUST NOT reject a bundle because of … unknown `type`
values", because a project names its own document types. A type in neither place
is named in the skip record, so a reader sees *which* type went unrecognised.

**Owner modes**, for attachments only:

| mode | resolves to |
|---|---|
| `dir` | the work item whose document sits in the same directory |
| `related` | the first id in `## Relations` or `related:` that resolves to a work item |

One declared mode per type, resolved by name. Never three tried in sequence: the
loader used to try the directory, then a `part_of` line, then `related:`, and
answered `attachment resolves to no work item` for all three failures, so a
reader could not tell which had happened.

## 4. Page types are Diátaxis

The four page types are [Diátaxis](https://diataxis.fr/) — tutorial, how-to,
reference, explanation — the documentation framework Django, Canonical and
Cloudflare document with, and the one `add.wiki` already followed in three of its
four types. The fourth is declared even though no analyzer writes one: shipping
three of four is the defect this model was built to fix.

## 5. Relations

The grammar is fixed: `- <type> [[<id>]]`, optionally followed by ` — <why>`.

<!-- generated:RELATIONS -->
| codeadd | DCMI term | meaning |
|---|---|---|
| `caused_by` | **none** | local extension; nearest published term is `prov:wasInfluencedBy` |
| `depends_on` | `dcterms:requires` | the described resource requires the referenced one to function |
| `part_of` | `dcterms:isPartOf` | a related resource in which the described resource is included |
| `links_to` | `dcterms:references` | the described resource points to the referenced one |
| `superseded_by` | `dcterms:isReplacedBy` | a related resource that supplants or supersedes this one |
<!-- /generated:RELATIONS -->

Four of the five are [DCMI Metadata
Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) with
the same meaning. **The names are not renamed to the DCMI spellings.** Renaming
rewrites every document already written to buy interoperability with a consumer
that does not exist, and replaces names an agent reads well with names from
library science. Declaring the mapping is what makes the graph exportable without
a migration.

## 6. Where this diverges from OKF, on purpose

Two divergences, recorded so a later reader does not "fix" them.

**Relations are typed.** OKF expresses them as ordinary markdown links and states
that "consumers treat all links as untyped directed edges. The specific
relationship kind is conveyed by surrounding prose." A relation whose kind lives
in the text around it is not a field, and nothing mechanical can follow it.

**Identity is declared.** OKF derives it from the file path; § 1 says why this
project does not.

## 7. When the index cannot answer

⛔ **index → git → nothing**, in that order, each rung reported as what it is.

| Rung | When | What it gives |
|---|---|---|
| **index** | a project that has run a close-out | The delivered work, its relations and its anchors |
| **git** | no index, or an index that answers empty | `git log --follow <path>`, with no index and no plugin |
| **nothing** | no repository either | `NOT VERIFIED`, with the reason |

**An empty answer and a missing route are different outcomes.** An empty answer
is a finding: nothing in this project relates to the question. A missing route is
not: the question went unasked. A result carrying `unavailable` is the second,
never the first.

## 8. The corpus rules

A corpus is one declarative row in `mcp/corpora.mjs`. The **docs** corpus, the one this
model describes, declares:

| Rule | Value | What it decides |
|---|---|---|
| `roots` | `docs`, `.codeadd/wiki` | Which directories are walked for `.md` files |
| `probe` | `docs` | Whether the corpus is PRESENT at all |
| `membership` | the type registry, or a declared `kind:` | Which of those files are in the graph |
| `nodeRule` | the `id:` value, on every kind | What a node is called |
| `edgeSources` | `## Relations`, `{{doc:ID}}`, `related:`, `superseded_by`, `sources` globs | Where an edge can come from |
| `index` | `.codeadd/docs-index.json` | Where the built index is cached |

⛔ **An absent corpus is an ERROR naming its reason, never a silent empty result.** An
empty graph and a missing one look identical to a caller and mean opposite things.

⛔ **`probe` and `roots` are not the same list, and the gap is real.** The probe is
`docs` alone, so a project that ran `/add.wiki` and never `/add.new` has pages under a
declared root and the corpus still refuses to open: `corpus "docs" is not present here`.
Measured 2026-09-15. That is the behaviour today, recorded here rather than left for the
next reader to rediscover — widening the probe is a behaviour change nobody has decided.

## 9. Migrating a project written before this model

`cli/src/migrations.js` migration `0003-retire-about-suffix` rewrites the retired
type names and writes each wiki page the id it already answered by. It is a
targeted line substitution on `type:` and `id:`, never a YAML round-trip — a
round-trip leaves every body byte-identical while reordering keys, dropping
comments and renormalising quotes on every other field.

That map of retired names is the only place a retired type survives, and it
survives as migration input, never as something a reader consults.
