# Plan: The document model the MCP reads — a declared registry, and the reference that owns it

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-09-14

---

## Context

The MCP decides what a document *is* by testing a string suffix — `type.endsWith('-about')`. There is
no list of valid types anywhere in the repository, so a document whose role is "a thing you look up"
is demoted silently whenever its type name does not end in `-about`, and a typo produces the same
silence. Four defects were measured against fixtures built for the purpose; all four are the same
defect wearing different clothes.

The operator wants to publish a release and use the framework in real projects. That was checked
first and it is not blocked: nothing breaks with an empty MCP, because both product callers are
non-blocking by their own text and an unanswerable question comes back carrying `unavailable` with a
reason. What is missing is **reach** — the MCP answers about very little — and reach is what a
declared model buys.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-14T215235-mcp-document-model-and-its-reference.md` | The four measured defects with their fixture output; the three external standards (Diátaxis, DCMI, OKF) with what is adopted and what is rejected and why; the five-layer model; the registry shape; the three consumption rules; the nine validated decisions; the reference-as-source-of-truth rule and its host |

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- `mcp/` takes **no dependency at all, `yaml` included**, because `--corpus=artefacts` runs from the
  repository root where the CLI's `node_modules` is off the resolution path (CLAUDE.md, Product Layer — `mcp/`)
- `mcp/` files are `.mjs`, because the root is CommonJS and `cli/` is ESM and one source has to read
  the same way in both (CLAUDE.md, Product Layer — `mcp/`)
- **No backward compatibility and no second path.** A legacy document is migrated, never read forever
  (operator decision, carried from the delivered roadmap item 1.3)
- Never write a raw `.codeadd/` path in an artefact — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`;
  scripts are the exception, always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- `mcp/` is **product** despite sitting at the repository root, because `scripts/build.js` copies it
  into the npm package (CLAUDE.md, Product Layer — `mcp/`)

## Problem

1. **Two thirds of every wiki is invisible.** `add.wiki.md:257` instructs every analyzer to write
   `type: reference | how-to | explanation`. `corpora.mjs:272` accepts only `reference`. Measured on a
   fixture holding one page of each: `nodes: 1, skipped: 2`. The command follows a published standard
   and the indexer knows a quarter of it.
2. **Node-or-not is a string suffix.** `corpora.mjs:271` tests `endsWith('-about')`. No list of valid
   types exists, so a typo is an attachment and the suffix is a data structure leaking into a name.
3. **Owner resolution is implicit, so a drop names no cause.** An attachment tries directory, then
   `part_of`, then `related:`, in an order written nowhere. One message covers three different
   failures. Measured on a fixture of one document per shipped schema: `skipped: 4`, all four reading
   `attachment resolves to no work item`.
4. **The corpus registry describes itself too loosely.** `corpora.mjs:531` states membership as
   *"frontmatter carries a `type:` key"*. The real rule is `-about`, or `reference` under the wiki
   root. A doctor built from that sentence would pass files the indexer drops.

## Proposal

Replace the suffix test with **one declared registry** in `mcp/`, mapping each `type` to its `kind`
(`work-item` | `page` | `attachment`), its required frontmatter keys, and — for attachments — the
**declared** mode by which it finds its owner. `kind` is not a new word: the engine already emits it
in every result and in `stats`; this declares on the way in what it already says on the way out.

`mcp/reference.md` becomes the source of truth for the model, with its registry table **generated
from the data file** so the two cannot drift, and an internal-layer rule binds any future change to
the model to a reference update in the same F-block.

Work runs in four stages: the model in `mcp/`, the authoring side in `framwork/.codeadd/`, the
migration in `cli/`, then the reference and the rule that keeps it true. The reference is written
last on purpose — a specification written ahead of its implementation reads as a description of what
exists, which is the exact failure that hid the `touched_by` gap.

## Current State

| Artefact | Dependants (graph, depth 1) | Risk | Today |
|---|---|---|---|
| `mcp/corpora.mjs` | no node — not an artefact (`add-artefact-graph` standing list) | — | `classify()` tests a suffix; owner resolution implicit |
| `mcp/engine.mjs` | no node — not an artefact | — | Emits `kind` it inferred |
| `add-doc-schemas` | **23** | **HIGH** | Declares every `type:`, all work-item types carrying `-about` |
| `add.wiki` | **16** | **HIGH** | Writes three Diátaxis types; pages carry no `id:` |
| `add-knowledge-discovery` | **8** | **HIGH** | Teaches the result shapes; says nothing about attachments or kinds |
| `cli/src/migrations.js` | no node — not an artefact | — | 0001 prunes orphans, 0002 harvests relations |
| `add-framework-product-layer` (internal) | internal skill | LOW | Owns product-layer build checks; already scopes `mcp/` at `SKILL.md:21` |

Delivery index, `--layer product`: `MATCHED_LIVE=7`, **no `gone` and no `superseded` entry**. Nothing
in this area was tried and dropped. The three live deliveries that bear on it are
`2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` (shipped the typed relations and the docs corpus),
`2026-09-14T145149-PLAN--the-impact-question-...` (deleted the last reader tolerating an old shape) and
`2026-09-14T102848-PLAN--product-knowledge-discovery-...` (made the eleven actions reachable by question).

**`CLAUDE.md` is edited by nothing here, and its generated inventory block changes anyway.** F6
renames `templates/feature-about-template.md`, and `node scripts/inventory.js` rewrites the block from
disk. That is a sync, not a hand edit — `/add-framework--done` STEP 2.3 runs it — and no F-block may
edit the block by hand.

## Scope

### Includes

#### T0 — RED first (ref: design § Problem)

- **F1** [product] — `cli/tests/mcp-document-model.test.js`: the full validation matrix below, written
  and verified failing against the current tree before any other block lands. It must NOT assert the
  degraded path as a substitute for the real one — the previous delivery shipped a whole feature whose
  tests only proved its failure mode.
  - **Produces:** `RED matrix for the document model`

#### T1 — The model (ref: design § Layer 2)

- **F2** [product] — `mcp/types.mjs`: the declared registry. One entry per `type`, carrying `kind`,
  `requires` (frontmatter keys), and for attachments the `owner` mode. Zero dependencies, `.mjs`. The
  type list is derived from `add-doc-schemas`, not invented here. It must NOT carry `product`, `owner`
  or `prd` — their removal is a separate planning session's scope.
  - **Consumes:** `RED matrix for the document model` (F1)
  - **Produces:** `the type registry module`
- **F3** [product] — `mcp/corpora.mjs`: `classify()` reads the registry instead of testing a suffix;
  a `type` absent from the registry is honoured when the document declares `kind:` itself, and is
  **reported as a finding** otherwise, never dropped silently. The membership sentence at `:531` is
  corrected to state the real rule. It must NOT keep the `endsWith` branch as a fallback.
  - **Consumes:** `the type registry module` (F2)
  - **Produces:** `registry-driven classification`
- **F4** [product] — `mcp/corpora.mjs`: owner resolution runs the mode the registry declares for that
  type instead of trying three in an implicit order, and a failure names the mode that failed. It must
  NOT lose the `part_of`/`related:` resolution that `docs/changelog/` depends on — that layout has no
  `*-about` sibling and only the relation resolves it.
  - **Consumes:** `registry-driven classification` (F3)
  - **Produces:** `declared owner modes`
- **F5** [product] — `mcp/corpora.mjs`: a page's identity is its declared `id:`; the path-derived id
  is gone. A page with no `id:` is a finding, not a silent skip.
  - **Consumes:** `registry-driven classification` (F3)
  - **Produces:** `declared page identity`

#### T2 — The authoring side (ref: design § Layer 1, § Diátaxis)

- **F6** [product] — `framwork/.codeadd/skills/add-doc-schemas/`: every `type:` value aligned to the
  registry, with the `-about` suffix dropped (`feature-about` → `feature`, `hotfix-about` → `hotfix`).
  **The edit boundary is every artefact under `framwork/.codeadd/` that names a retired type literal,
  the 23 dependants included — not the dependant list.** The graph answers "who USES this skill"; it
  does not answer "who quotes this string", and the two sets differ: `add-plan-review/SKILL.md:42` and
  `:59` name `feature-about` while the `USES_SKILL` edge runs the other way, so it is outside the
  dependant list and inside the rename. `templates/feature-about-template.md` is renamed with them —
  a plan that retires a name and leaves it in a filename is the half-measure this repository keeps
  finding. **L2.4 is the boundary's only reliable enumerator; a hand-written file list is not**, and
  two independent hand-written lists were already incomplete before this plan was reviewed.
  It must NOT change any schema's sections, depth floors or hard bans; only the type name.
  - **Consumes:** `the type registry module` (F2)
- **F7** [product] — `framwork/.codeadd/commands/add.wiki.md`: the mandatory page frontmatter becomes
  the Diátaxis four (`tutorial | how-to | reference | explanation`) and gains a required `id:`. It must
  NOT drop `area`, `description`, `sources`, `commit`, `generated` or `tags` — the wiki's SELECT path
  reads `sources` globs.
  - **Consumes:** `the type registry module` (F2)
- **F8** [product] — `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md`: the three consumption
  rules — an attachment never returns on its own, each `kind` answers a different question, and the
  index → git → nothing ladder. It must NOT weaken the empty-vs-unavailable distinction already there.

#### T3 — The migration (ref: design § Open Questions 1)

- **F9** [product] — `cli/src/migrations.js`: migration `0003`, rewriting the retired type names in a
  brownfield project's frontmatter and writing each wiki page's `id:` from the path it already answers
  by. **The rewrite is a targeted line substitution on `type:` and `id:` only**, matching `0002`'s
  `appendRelations` pattern — never a YAML parse-and-restringify, which leaves the body untouched while
  reordering keys, dropping comments and renormalising quotes on every other field. It must NOT touch a
  document body, and must report every file it could not parse rather than skipping it silently.
  **The same block fixes `migrations.js:233`** — `const isWorkItem = (r) => String(r.frontmatter.type).endsWith('-about')`,
  a second suffix test inside the already-shipped `0002-harvest-relations`, invisible to the graph
  because `migrations.js` is not an artefact. Left alone, a project whose migration ledger is lost or
  corrupted — a case that file's own code handles explicitly — re-runs `0002` against renamed documents,
  matches nothing, and the harvest becomes a permanent silent no-op. It reads the registry's work-item
  list instead of the literal suffix. That is the plan's own Global Constraint: no second path.
  - **Consumes:** `the type registry module` (F2)

#### T4 — The reference and the rule that keeps it true (ref: design § The reference as source of truth)

- **F10** [product] — `mcp/reference.md` plus its generator: the source of truth for the model. It
  carries the frontmatter contract, the registry table **generated from F2**, the three kinds, the
  owner modes, the relation grammar with its DCMI mapping, the identity rules, the consumption rules,
  and the two recorded divergences from OKF with their reasons. It must NOT hand-copy the registry
  table — a hand-kept copy is the drift this plan exists to remove.
  - **Consumes:** `the type registry module` (F2), `registry-driven classification` (F3), `declared owner modes` (F4), `declared page identity` (F5)
- **F11** [internal] — `.claude/skills/add-framework-product-layer/SKILL.md`: the rule binding any
  change to the document model, the type registry, the relation vocabulary, the corpus rules or an
  action's result shape under `mcp/` to a `mcp/reference.md` update **in the same F-block**. It must
  NOT fire on a bug fix or a new action that leaves the model untouched — a rule that fires on every
  edit is one people learn to ignore.

### Does NOT Include (important!)

- **Renaming the relation vocabulary to DCMI names.** The mapping is declared in the reference; the
  authoring surface stays `caused_by | depends_on | part_of | links_to`. Renaming rewrites every
  document already written to buy interoperability with a consumer that does not exist.
- **Adopting OKF's untyped-link relation model.** Recorded as a deliberate divergence, with its reason,
  so a later reader does not "fix" it.
- **The doctor (roadmap 1.4).** This plan supplies the rule set the doctor validates against and stops
  there.
- **Roadmap 1.2's migration** for projects that declared no relationships at all. Unchanged, still
  downstream.
- **`add.init`, `product.md`, `owner.md` and `add-product-discovery`.** Their removal is a separate
  planning session. F2 must not list their types; nothing else here takes a position on them.
- **A build gate comparing the reference against the registry.** F10's generator makes the table
  derived; whether a gate also enforces it is left open deliberately — see Risks.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Where does the type registry live? | A data file in `mcp/`; the reference's table is generated from it | Parser and doctor read one source. A markdown table parsed as a schema is fragile; a hand-kept copy drifts — two descriptions were found looser than their code in one session (design § Key Decisions) |
| Rename relations to DCMI terms? | No. Keep the names, declare the mapping | Four of five are DCMI terms already; renaming costs every written document (design § DCMI) |
| Is `kind` declared per document? | No — derived from `type` via the registry | Two declarations of one fact drift (design § Layer 2) |
| Can a project use a type the registry does not know? | Yes, by declaring `kind:` itself | OKF: *"consumers MUST NOT reject a bundle because of... unknown `type` values"*. Unknown and undeclared is a finding, never a silent drop |
| How many Diátaxis types index? | All four, `tutorial` included | Shipping three of four is the current defect; leaving the fourth out repeats it |
| Does `-about` stay in type names? | No | It exists only so `endsWith` has something to match. Operator decision, 2026-09-14 |
| Do pages get a declared `id:`? | Yes | Path-derived identity breaks on a move — the reasoning the index already applies to `at`. Operator decision, 2026-09-14 |
| What is `setup-receipt`? | A `work-item` | It was an attachment that could never have an owner, so it always vanished. It is a document about the project |
| When is `mcp/reference.md` written? | Last, with the code, never before | A specification ahead of its implementation reads as a description of what exists — the failure that hid the `touched_by` gap |
| Where does `epic` sit — work item or attachment? | Unchanged: attachment, owner mode `dir` | F2 derives the type list from `add-doc-schemas` rather than inventing it, so a type this plan does not discuss keeps the role it has. Design § Open Questions 4 raised it; the answer is "not this plan's to change" |
| Where does the reference-update rule live? | `add-framework-product-layer` | It already scopes `mcp/` (`SKILL.md:21`) and owns the product-layer validation section |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A declared model a doctor can validate against | A registry someone must extend when a new document type is added — the cost of having a list at all |
| Every wiki page indexes, whatever its Diátaxis type | Nothing |
| A drop that names its cause | A slightly longer skip record |
| Type names free of a data-structure suffix | A migration over the user's own documents — content, not internal dead code |
| Pages identified stably across a move | A required `id:` in a frontmatter block that did not have one |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| The `-about` rename misses a `type:` literal in one of `add-doc-schemas`' 23 dependants, and a command writes a type the registry rejects | **High** | F6 updates every dependant in its own block, as the removal rule requires. L2.4 asserts that no artefact under `framwork/.codeadd/` names a retired type name |
| Migration 0003 corrupts a user's document | Medium | F9 touches frontmatter only, never a body, and reports unparseable files instead of skipping them. L3 runs it against a brownfield fixture and asserts bodies are byte-identical afterwards |
| The reference and the registry drift anyway | Medium | F10 generates the table rather than copying it; L4 asserts the generated table equals the registry. F11 makes the update a stated rule for future changes |
| A test asserts the degraded path and the real one never runs | Medium | Named in F1 explicitly. L5 is behavioural: it asserts each of the four measured defects is gone, against a fixture, not against a mock |
| `mcp/` gains a dependency through the registry module | Low | Global Constraint states it; L1 loads `mcp/types.mjs` from the repository root where `node_modules` is off the resolution path |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `mcp/types.mjs` | product | create | The declared registry (F2) |
| `mcp/reference.md` | product | create | The source of truth for the model (F10) |
| `mcp/corpora.mjs` | product | modify | `classify()`, owner resolution, page identity, the membership sentence (F3, F4, F5) |
| `mcp/engine.mjs` | product | modify | Reads `kind` as declared rather than inferred (F3) |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | Type names aligned to the registry (F6) |
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | product | modify | `feature-about` → `feature`, `feature-plan`, `feature-design`, `epic`, `brainstorm` (F6) |
| `framwork/.codeadd/skills/add-doc-schemas/references/fix.md` | product | modify | `hotfix-about` → `hotfix` (F6) |
| `framwork/.codeadd/skills/add-doc-schemas/references/history.md` | product | modify | `changelog` and its owner mode (F6) |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | product | modify | `review`, `qa-validation`, `audit-report`, `diagnose-report` (F6) |
| `framwork/.codeadd/skills/add-doc-schemas/references/receipt.md` | product | modify | `setup-receipt` becomes a work item (F6) |
| `framwork/.codeadd/skills/add-doc-schemas/references/strategy.md` | product | modify | `prd` type name only — its existence is out of scope (F6) |
| Every one of `add-doc-schemas`' **23 dependants** that names a `type:` literal | product | modify | The rename must not leave a caller writing a retired name (F6) |
| `framwork/.codeadd/commands/add.wiki.md` | product | modify | Diátaxis four plus required `id:` (F7) |
| `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md` | product | modify | The three consumption rules (F8) |
| `framwork/.codeadd/skills/add-plan-review/SKILL.md` | product | modify | `:42` and `:59` name `feature-about`; it is a dependency of `add-doc-schemas`, not a dependant, so the graph never surfaced it (F6) |
| `framwork/.codeadd/templates/feature-about-template.md` | product | rename | The retired name survives in a filename otherwise (F6) |
| `cli/src/migrations.js` | product | modify | Migration 0003, **and `:233`'s second `-about` suffix test inside the shipped 0002** (F9) |
| `cli/tests/mcp-document-model.test.js` | product | create | The RED matrix (F1) |
| `cli/tests/mcp-corpora.test.js` | product | modify | Every membership assertion changes (F3, F4, F5) |
| `cli/tests/mcp-engine.test.js` | product | modify | `kind` assertions (F3) |
| `cli/tests/mcp-migration.test.js` | product | modify | 0003 joins the migration list (F9) |
| `cli/tests/docs-knowledge-graph.test.js` | product | modify | Fixtures carry the new type names (F6, F9) |
| `cli/tests/helpers/brownfield-fixture.js` | product | modify | The fixture needs a retired-name document for F9 to migrate |
| `cli/tests/helpers/docs-corpus-fixture.js` | product | modify | Three `type: feature-about` fixtures (F6) |
| `cli/tests/impact-question-touched-by.test.js` | product | modify | `:255` carries `type: feature-about` (F6) |
| `cli/tests/mcp-server.test.js` | product | modify | `:306` carries `type: feature-about` (F6) |
| `cli/tests/product-close-out-parity.test.js` | product | modify | `:770` asserts `add.new.md` contains `feature-about`, a string F6 removes |
| `cli/tests/graph-query.test.js` | product | modify | `:327` asserts the template name `feature-about-template`, which F6 renames |
| **Any other file the L2.4 sweep reports** | — | modify | ⛔ The rows above are what two hand-written passes found; **L2.4 is the authority**, not this table |
| `.claude/skills/add-framework-product-layer/SKILL.md` | internal | modify | Hosts the reference-update rule (F11) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below is written in F1 and verified failing against the current
tree before any other block lands.

### L1 — Registry and classification (RED → GREEN)

1. Every `type` the registry declares resolves to its declared `kind`. *RED today: no registry exists.*
2. A document whose `type` is absent from the registry but which declares `kind:` is classified by
   that declaration. *RED today: it is classified as an attachment.*
3. A document whose `type` is absent and which declares no `kind:` appears in the skip record **with a
   reason naming the unknown type**. *RED today: the reason is `attachment resolves to no work item`,
   which names the wrong cause.*
4. `mcp/types.mjs` loads from the repository root with `node_modules` off the resolution path, and
   imports nothing. *RED today: the file does not exist.*
5. A `type` carrying the retired `-about` suffix is **not** in the registry. *RED today: `-about` is
   the rule.*

### L2 — Corpus integration

1. A fixture holding one wiki page of each of the four Diátaxis types indexes **4 page nodes, 0
   skipped**. *RED today: `nodes: 1, skipped: 2`, measured.*
2. A fixture holding one document per registry type indexes each as its declared kind, with **zero**
   `attachment resolves to no work item`. *RED today: `nodes: 1, skipped: 4`, measured.*
3. `setup-receipt` indexes as a work item and is returned by `search`. *RED today: it is skipped.*
3b. A wiki page carrying no declared `id:` appears in the skip record **with a reason naming the
   missing id**, and is never indexed under a path-derived one. *RED today: every page is indexed by a
   path-derived id, so the case cannot arise.*
4. **No file anywhere in the repository names a retired type literal** — `feature-about`,
   `hotfix-about`, or the `feature-about-template` filename — outside `docs/` and the delivery index.
   The sweep covers `framwork/.codeadd/`, `mcp/`, `cli/src/` and `cli/tests/` in one pass. *RED today:
   `add-doc-schemas` and its dependants, `add-plan-review/SKILL.md:42` and `:59`, `migrations.js:233`,
   and at least five test files do.*
   ⛔ **This item is the edit boundary's only reliable enumerator.** Two independent hand-written file
   lists — the plan's first draft and its review — were each incomplete, missing different files. A
   builder that satisfies the Impact table's rows and not this sweep has not finished F6.
5. An attachment whose declared owner mode fails is skipped **with the mode named** — `owner mode
   'related' found no work item`, not a generic sentence. *RED today: one message covers three causes.*
6. `corpora.mjs`'s membership description and `classify()` agree: the sentence names the registry.
   *RED today: it says "frontmatter carries a `type:` key".*

### L3 — Migration

1. A brownfield fixture whose documents carry `feature-about` runs 0003 and afterwards indexes with
   `type: feature`. *RED today: 0003 does not exist.*
2. A wiki page with no `id:` gains one equal to the id it answered by before the migration, so no
   query result changes. *RED today: the id is derived, never written.*
3. Every document **body** is byte-identical before and after 0003. *RED today: no migration to test.*
3b. Every frontmatter key **other than `type:` and `id:`** is byte-identical before and after — same
   order, same quoting, same comments, same blank lines. *RED today: no migration to test.* This is
   what forces the targeted line substitution: a YAML parse-and-restringify passes L3.3 and fails here.
4. A document 0003 cannot parse is **reported by path**, not skipped silently. *RED today: n/a.*
5. 0003 never deletes and never commits — the rule 0002 already holds.
6. **`0002-harvest-relations` still harvests after the rename.** Run 0002 against a fixture whose
   documents already carry the new type names, with no migration ledger — the lost-ledger case that
   file handles explicitly — and assert it harvests the same relations it harvests today. *RED today:
   `isWorkItem` at `migrations.js:233` tests the `-about` suffix, so it would match none of them and
   return a silent no-op.*

### L4 — The reference

1. The registry table inside `mcp/reference.md` is byte-equal to the table its generator emits from
   `mcp/types.mjs`. *RED today: neither file exists.*
2. `mcp/reference.md` names all three kinds, all four Diátaxis types, all five relation types with
   their DCMI mapping, and both recorded OKF divergences. *RED today: the file does not exist.*
3. `.claude/skills/add-framework-product-layer/SKILL.md` carries the reference-update rule and scopes
   it to model changes rather than to every `mcp/` edit. *RED today: no such rule.*

### L4b — Consumption rules (F8)

1. `add-knowledge-discovery/SKILL.md` states that an attachment is never returned on its own and comes
   back listed on its owner. *RED today: the skill says nothing about attachments.*
2. It states which question each `kind` answers — `work-item` for what was done, `page` for how an area
   works. *RED today: `kind` is not mentioned as a reading instruction.*
3. It states the degradation ladder index → git → nothing as one ordered sequence. *RED today: the
   index and the git floor are described in separate places and never as a ladder.*
4. The empty-vs-unavailable distinction already in the skill survives the edit, word for word. *Not
   RED — this is a regression guard on text F8 must not weaken.*

### L5 — Behavioural acceptance

Each of the four defects measured in the design is gone, proved against a fixture rather than a mock:

1. A `how-to` page written exactly as `add.wiki.md` instructs is returned by `search`.
2. A type name with a typo is reported as an unknown type, not demoted to an attachment.
3. A dropped attachment's skip record names which owner mode failed.
4. A doctor built by reading `corpora.mjs`'s own membership sentence would classify the same files the
   indexer does — asserted by comparing the sentence's rule against `classify()`'s behaviour on the
   L2.2 fixture.

**RED expectations against the current tree:** L1 entirely (no registry), L2.1–L2.6, L3 entirely
(no migration), L4 entirely (no reference), L5 entirely.
**GREEN = all levels pass after F1–F11.**

---

## Execution Order

```
F1  (RED matrix)
 └─> F2  (the registry)
      ├─> F3 ──┬─> F4 ─┐       [T1, the model]
      │        └─> F5 ─┤
      ├─> F6           │       [T2, the schemas]
      ├─> F7           │       [T2, the wiki contract]
      └─> F9           │       [T3, the migration]
                       └─> F10 ──> F11    [T4, the reference and its rule]
 F8                            [T2, consumption — independent of the chain]
```

- **F1 first**, because RED-first is the discipline and the previous delivery shipped a feature whose
  tests only proved its failure mode.
- **F2 before everything**, because it is what F3, F6, F7, F9 and F10 all read.
- **F3 before F4 and F5**, because both change code paths that run after classification.
- **F6 before F9 is NOT required** — the migration reads the registry, not the schemas.
- **F10 after F3, F4 AND F5.** The reference carries the owner modes and the identity rules, and F4
  and F5 are what implement them. Sequencing it on F3 alone lets a builder write it describing
  behaviour that does not exist yet — the precise failure this plan cites as the reason the reference
  is written last. F4 and F5 declare `Produces` for that reason.
- **F11 last**, because its rule is about keeping F10 true, and writing it earlier gives it nothing to
  point at.
- **F8 is independent** of the whole chain and may land anywhere after F1.

**Working-state boundaries** — the repo is consistent and the build passes at each:

- After **F5**: the model is registry-driven and every Diátaxis page indexes. The schemas still write
  the old names, which the registry does not know — so those documents report as unknown types rather
  than indexing. **This boundary is loud, not silent, which is the point, but it is not shippable.**
- After **F7**: authoring and model agree. A brownfield project's existing documents still carry the
  retired names.
- After **F9**: the whole change except its documentation.
- After **F11**: the whole plan.

A build that must stop should stop on **F7, F9 or F11** — never between F2 and F6, which is the window
where the schemas and the registry disagree.

**Per-F-block validation beyond the layer default:** F2, F3, F4, F5 and F9 run
`npm --prefix cli test -- mcp-document-model` before their commit. F6 and F7 run the full serial cli
suite, because 23 and 16 dependants respectively put them past the point where one file's suite proves
anything. Clear `NODE_OPTIONS` first — an injected debugger writes its banner onto stdout and breaks
JSON parsing.

## Reviewer Handoff

The three things most likely to be wrong here:

1. **F6's blast radius.** `add-doc-schemas` has 23 direct dependants and the rename touches a literal
   string that any of them may quote. The Impact table names the six reference files explicitly and
   then names the dependants as a class — that class is the row a reviewer should push on.
2. **F9 is a migration over user content.** Every other "no backward compatibility" decision in this
   repository has been about internal dead code. This one rewrites documents the user owns. The plan
   asserts bodies are untouched and unparseable files are reported; whether that is enough is a
   judgement worth a second opinion.
3. **The F2–F6 window.** Between the registry landing and the schemas being renamed, the tree is
   internally inconsistent by design. The Execution Order names it as a forbidden stopping point, but
   a build that hard-stops there leaves a repo that indexes nothing.

---

## Revision log

| Date | What |
|---|---|
| 2026-09-14 | Drafted; review verdict fix-then-ok, 9 findings applied, 3 widened beyond what the review proposed |
| 2026-09-15 | **Implemented.** 15 commits, `cc6c852..c3e9bda`. Changelog: `docs/changelog/2026-09-15T192742-refactor-the-document-model-the-mcp-reads.md`. Departures from this document, each with a ruling in the ledger: `prd` entered the registry (the sibling plan puts it out of ITS scope); `templates/feature-about-template.md` was not renamed (it names the `about.md` document, not the type); `mcp/engine.mjs` carries no diff (this plan's premise about it was wrong — it only ever read `kind`, never inferred it); four `add-doc-schemas/references/*.md` rows needed no edit (they carried no retired literal); and F0 was added for a `.gitignore` defect this build uncovered. Review: 7 auditors, 13 findings, 9 applied, 2 rejected, 2 noted |
