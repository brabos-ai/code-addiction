# The document model the MCP reads

The MCP decided whether a document was an indexable thing by testing whether its
`type` string ended in `-about`. A naming convention was doing a type system's
job, and there was no list of valid types anywhere in the repository. Four
defects were measured against fixtures built for the purpose; all four turned out
to be that one defect wearing different clothes.

## What the suffix cost, measured

**Two thirds of every wiki was invisible.** `add.wiki` instructs every analyzer to
write `type: reference | how-to | explanation` — three of the four
[Diátaxis](https://diataxis.fr/) types, the framework Django, Canonical and
Cloudflare document with. `classify()` accepted one. A fixture holding one page of
each declared type indexed **1 node and skipped 2**. The command was right and the
reader knew a quarter of the standard.

**Four document kinds were demoted for their names.** `prd`, `brainstorm`,
`audit-report` and `diagnose-report` each carry their own id, live in their own
directory with no `*-about` sibling, and declare a `related:` that is routinely
empty. As attachments they resolved to no owner and were dropped. `setup-receipt`
the same. A fixture of one document per shipped schema indexed **1 node and
skipped 4**.

**A drop named no cause.** An attachment tried the directory, then a `part_of`
line, then `related:`, in an order written nowhere, and answered `attachment
resolves to no work item` for all three failures. A reader could not tell "this
type has no owner rule" from "this document's owner is missing".

**The corpus registry described itself too loosely.** It said membership was
"frontmatter carries a `type:` key". It was never that.

## The registry

`mcp/types.mjs` declares, for every type, its `kind`, its required frontmatter
keys and — for attachments — the single mode by which it finds its owner.

`kind` is not a new word. The engine already emitted it in every result and broke
`stats` down by it, while inferring it on the way in from a string suffix. This
declares on the way in what it already said on the way out.

Owner modes are declared per type and resolved by name, so a failure says which
mode failed. A type absent from the registry is **reported by name**, never
demoted — and a document may declare `kind:` itself, which is OKF's rule that a
consumer "MUST NOT reject a bundle because of … unknown `type` values", because a
project names its own document types.

## `mcp/reference.md` is the source of truth

The model written down once: the frontmatter contract, the three kinds, the
registry, the owner modes, the corpus rules, the Diátaxis page types, the relation
grammar with its DCMI mapping, the degradation ladder, and two recorded
divergences from OKF.

**Its tables are generated, not copied.** `mcp/generate-reference.mjs` emits them
from the registry between markers, and a test asserts byte-equality in CI — so a
forgotten regeneration fails a run instead of shipping a reference that disagrees
with the registry it describes.

`.claude/skills/add-framework-product-layer/SKILL.md` gained a third binding rule:
a change to the model updates the reference **in the same F-block**. The trigger is
narrow on purpose — a bug fix or a new action does not fire it, because a rule that
fires on every edit is one people learn to ignore.

## What the standards decided, and what they did not

| Standard | Adopted | Rejected |
|---|---|---|
| **Diátaxis** | All four page types, `tutorial` included | — |
| **DCMI (Dublin Core)** | The mapping, declared term by term | The spellings — `depends_on` stays, not `dcterms:requires` |
| **OKF v0.2** | `type` as the only always-required key; unknown types reported, not rejected | Untyped links; path-derived identity |

Four of the five relation types are DCMI terms with the same meaning. The names
are not renamed: that rewrites every document already written to buy
interoperability with a consumer that does not exist. OKF expresses relations as
plain markdown links whose kind "is conveyed by surrounding prose" — a relation
whose kind lives in the text around it is not a field, and nothing mechanical can
follow it.

## Breaking

- **The emitted `kind` values changed.** `work item` → `work-item`,
  `reference page` → `page`. `kind` is both a result field and the filter argument
  on `search` and `orphans`. The second rename is forced: with four Diátaxis types
  indexing, calling a `tutorial` a "reference page" is false.
- **Type names lost the `-about` suffix.** `feature-about` → `feature`,
  `hotfix-about` → `hotfix`. Migration `0003-retire-about-suffix` rewrites them in
  a brownfield project.
- **A page's id is declared, not derived.** A page without `id:` is reported rather
  than indexed under a name derived from its path. The migration writes each page
  the id it already answered by, so no query result changes on the day it lands.
- **Migration 0003 edits the user's own documents.** Targeted line substitution on
  `type:` and `id:` only — never a YAML round-trip, which would leave every body
  byte-identical while reordering keys, dropping comments and renormalising quotes
  on every other field. A test asserts every other frontmatter line survives byte
  for byte.

## Also fixed

**`.gitignore` ignored the entire product source.** The previous delivery added
`.codeadd/` to ignore a cache at the repository root; written bare, git matches
that at any depth, so `framwork/.codeadd/` was ignored too. Nothing broke and CI
stayed green — .gitignore does not reach a tracked file and all 216 were tracked.
What broke was every file added afterwards: a new command, skill or reference was
invisible to `git add` and `git status`, with no error anywhere. Found when this
build's own `git add` was refused.

**A second suffix test nobody could see.** `cli/src/migrations.js` tested
`endsWith('-about')` inside the already-shipped `0002-harvest-relations`. The
artefact graph never surfaced it — that file is not an artefact and has no node —
and it survived the rename: against renamed documents it matched nothing and the
harvest became a permanent silent no-op.

## What the review caught

Seven auditors, thirteen findings. Three are worth recording because each is the
delivery reproducing, inside itself, the defect it exists to remove.

**`id:` reached the contract and none of the six places that run it.**
`add.wiki.md` declared it mandatory and gated it, while the four dispatch prompts
a cold subagent receives listed seven fields without it, and two gates checked
that same seven-field list. A page written without `id:` passed both gates and
failed later at indexing.

**Four analyzer subdocs restated the contract, each missing `id:`.** The
contract's owner claims "Analyzer-specific sections below reference this one, they
never restate it". It was false for all four. `add.wiki`'s self-bootstrap hands a
specialist one file, so a cold dispatch of any of them wrote a page the indexer
drops.

**A guard the rename hollowed out.** A test pinned that `add.new` dispatches with
`kind: feature-about`; the blind substitution left it asserting the bare word
`feature`, which appears throughout that file whatever the command does.

## Not included

- **Collapsing `add.wiki.md`'s own copy of the frontmatter contract.** Three
  statements became two. The third is in the command a user invokes, and removing
  it is a structural change across 16 dependants that this plan never scoped.
- **Making root `CLAUDE.md` delegate its two editing rules to the skill that owns
  them.** The duplication predates this delivery, and the fix edits `CLAUDE.md`,
  which a product F-block may not touch.
- **Widening the corpus probe.** The docs corpus declares `roots: ['docs',
  '.codeadd/wiki']` and `probe: 'docs'`, so a project that ran `/add.wiki` and never
  `/add.new` has pages under a declared root and is still refused. Recorded in the
  reference rather than changed — widening a probe is a behaviour change nobody has
  decided.

## Cost

Four enumerating levels exist because four hand-written lists each came back
incomplete, and each missed a different subset: the plan's Impact table, the plan
review, the rename sweep, and one fix applied after the sixth audit. The levels
sweep the tree instead of naming files, and each was proved to bite before it was
trusted.
