# Brainstorm: Internal Entry Deltas and the Graph Join

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--self-plan`
> **Date:** 2026-09-07
> **Type:** architecture
> **Set:** `2026-09-07T123919` — **07 of 08**, subtopic 2 of `2026-09-07T123919-delivery-index-05-internal-umbrella.md`
> **Consumes:** the record shape from `2026-09-07T123919-delivery-index-02-product-schema.md`. **This document adds no field the schema does not already define.**

## Discovery

- **`artefact-graph.json`** — 204 nodes, 682 edges, 18 internal and 186 product. Node id is `<layer>/<kind>/<name>`. Rebuilt from scratch on every build and gitignored, so it holds **no history**.
- **`collectNodes()` covers three internal roots only** — `.claude/commands`, `.claude/skills/*/SKILL.md` (plus reference sub-files) and `.claude/agents`. Top-level `scripts/*.js`, `CLAUDE.md`, `.gitignore` and `.opencode/` produce no nodes.
- **The schema already carries the two fields this layer needs** — `layer` (`product` | `internal`) and an optional, internal-only `node`. Nothing new is required.
- **The schema fixed the internal `id`** — the plan file's basename without extension, verbatim.
- **Internal plans are frequently modification-only.** Plan `0075` aligned existing consumers and created nothing — it is the pure case. Plan `0078`'s **command edits** are the same shape, though the plan as a whole also created scripts and deleted a skill. Neither is fully described by "artefacts created".
- **Plan `0076` is the shape that matters** — it deleted `doc-reviewer-agent` and introduced `readback-agent` in one delivery. Exactly one supersession, and the motivating example for this whole design.

## Context & Motivation

The umbrella promised the internal layer would consume the product schema verbatim and record only deltas. This document is that delta list, and its most useful result is how short it is.

The real work here is not the record — it is the **derivation**: what an internal item *is*, given that the artefact graph knows every command, skill and agent but has no time axis and covers only three of the internal layer's roots.

## Problem / Opportunity

| Question | Why it is not obvious |
|---|---|
| What is an internal item? | "Artefacts created" gives **zero** items for a modification-only plan, and the schema requires at least one |
| Where do items come from? | The graph has no history to diff against, so the diff must come from git and the graph can only classify |
| How is `superseded` declared? | The umbrella called it the one status a human must declare — but internally the diff already proves a deletion |
| What does the `node` join buy? | It must be worth a field, and it must not turn the index into a code map |

## Proposed Solution

### 1. The delta list, in full

| Field | Internal behaviour |
|---|---|
| `layer` | `"internal"` |
| `id` | The plan's basename without extension, e.g. `0079-SELF-PLAN--delivery-index` |
| `origin` | The plan path — `docs/plans/<id>.md` |
| `node` | Present on an item **when, and only when, that item is a graph node**. Absent for scripts, `CLAUDE.md`, `.gitignore` and `.opencode/` |
| every other field | Unchanged |

Nothing is dropped, nothing is added. `node` is the schema's own optional field being used as intended, and the layer split follows `artefact-graph.json`'s own reason for layer-scoping ids: `add-commit` exists in both layers.

### 2. What an internal item is — three kinds, one rule

The product rule is *"public surface — what other documents cite."* Internally that resolves to three shapes:

| Kind | Example item | `at` | `find` | `node` |
|---|---|---|---|---|
| **Artefact created** | `readback-agent` | `framwork/.codeadd/agents/readback-agent.md` | `readback-agent` | yes |
| **Artefact removed** | `doc-reviewer-agent` | — | — | recorded as a `superseded` line on *its own* entry, not as an item here |
| **Named behaviour introduced into an existing artefact** | `converge-gates.sh`'s `GATE_QA_BASELINE` | `framwork/.codeadd/scripts/converge-gates.sh` | `GATE_QA_BASELINE` | no — scripts are not nodes |

The third kind is what makes modification-only plans representable, and it is not a loosening of the rule. A behaviour worth an index entry has a **name in the source** — a key, a flag, a function, a marker — and that name is exactly what other documents cite and what goes stale. A change with no nameable surface delivered nothing citable and belongs in the changelog, not the index.

The 1–5 limit is unchanged. A plan that cannot name five things is fine; a plan that needs more than five was two plans.

### 3. Deriving items: git supplies the diff, the graph classifies it

The graph is rebuilt from scratch every build and is gitignored, so **there is no prior graph to diff against.** The derivation runs the other way:

1. `git diff --name-status <base>..<head>` gives added, modified and deleted paths.
2. Each path is looked up in the **current** `artefact-graph.json`.
   - Added **and** a node → an item, `node` filled in.
   - Added and not a node (a new script, a `.opencode/` adapter) → an item, `node` omitted.
   - Deleted and it matches an existing entry's item → drives a supersession, see below.
   - **Renamed (`R###`)** → **never** a deletion. It is a `changed` item on the existing entry; `--repair` fixes the `at` and nothing is superseded.
   - Modified → **not** an item on its own. The author names the introduced behaviour, or the file contributes nothing.
3. `/add-framework--done` proposes the result; STEP 5's preview shows it.

Git is the source of change; the graph is a classifier. Stating it that way keeps a future reader from trying to snapshot the graph per delivery, which would be a second history mechanism competing with this one.

### 4. `superseded` is proposed by the diff, confirmed by a human

The umbrella called `superseded` the one status no script can derive, and that stands as a general rule — *"this approach replaced that one"* is a judgement. But internally, one half of it **is** provable:

> A deleted artefact that matches an existing entry's item is a **deletion, proven by git**. What a script cannot know is whether the new delivery *replaces* it or merely removes it.

**The match key, stated precisely, because a path is not one.** The product layer already learned this in `write-verify`: an item's `at` is a hint that goes stale, so matching on it produces false negatives. Internally the same rule applies, with one advantage:

1. **Resolve first.** Run `delivered.sh verify` (report-only) so every existing entry's item carries its current location before anything is compared.
2. **Match by `node` id when the item has one** — a graph node id is stable across file moves and is exact.
3. **Match by `find` presence when it does not** — scripts, `CLAUDE.md`, `.opencode/` items have no `node`, so the anchor is the key, as everywhere else.

**`git diff --name-status` also emits `R###` rename lines**, and the three-bucket rule above has no bucket for them. It needs one, and the answer is not "treat a rename as a deletion": a renamed artefact is not gone, and recording it as `superseded` would be a lie the verification would then have to unpick. **A rename is a `changed` item on the existing entry — its `at` is repaired, nothing is superseded** — which is exactly what `--repair` already does, so the rename case needs no new machinery, only the instruction not to mistake it for a deletion.

So `/add-framework--done` proposes: *"`doc-reviewer-agent` was deleted and appears in entry `0076-…`. Mark it `superseded_by` this delivery, or `gone`?"* The proposal is derived; only the replaces-versus-removes distinction is answered by a person, and it is the one thing a person genuinely knows.

Same intersection mechanism as the product layer's hotfix routing — one rule, both layers.

### 5. The join, and the line it must not cross

An item's `node` is an `artefact-graph.json` id, so an index hit hands directly to `graph.js`:

```
index → what existed, when it arrived, what it replaced   (time)
graph → what depends on it today                          (structure)
```

**The join is one-directional and by id only.** History never enters `artefact-graph.json`; the graph never grows a time axis; neither embeds the other's data. If a reader ever wants both, they call both — which is what `graph.js history` exists for and what the `query` subtopic specifies.

`node` is absent for scripts, `CLAUDE.md`, `.gitignore` and `.opencode/`. That is a real coverage gap, already recorded in the umbrella, and it is **not** worked around by inventing synthetic node ids for non-nodes: a fabricated id would resolve to nothing in `graph.js` and would be worse than an honestly absent field.

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **A separate internal schema** | The umbrella's single-owner rule. Two schemas become two incompatible indexes within a release |
| **Snapshot the graph per delivery to diff against** | A second history mechanism competing with this one, and `artefact-graph.json` is gitignored and rebuilt, so the snapshots would have to be stored somewhere new |
| **Items are only created artefacts** | Zero items for a modification-only plan, which the schema forbids. Plans `0075` and `0078` are both this shape |
| **Every modified file becomes an item** | The product layer's rejected "everything the diff touched" — noise, and `0078` touched dozens of files |
| **Derive `superseded` fully automatically from a deletion** | A deletion proves removal, never replacement. Automating the judgement half would put an invented decision into the record |
| **Synthesise node ids for scripts and `CLAUDE.md`** | They would resolve to nothing in `graph.js`. An absent field is honest; a dangling one is a trap |
| **Extend `collectNodes()` to cover scripts and `CLAUDE.md`** | Genuinely tempting, and out of scope: it changes what the build gates over, which is a separate decision with its own blast radius |

## Type of Artefact

Architecture — a derivation rule and a field-usage contract. No new file format, no new script.

## Scope

### Includes

- The complete internal delta list against the product schema
- The three item kinds and the rule that unifies them
- The derivation: git diffs, the graph classifies
- How `superseded` is proposed and what a human actually answers
- The `node` join and its one-directional boundary
- What is deliberately left uncovered by `node`, and why it is not faked

### Does NOT Include

- The record shape — the product schema owns it
- When the entry is written — the `done-command` subtopic
- `graph.js history` and its consumers — the `query` subtopic
- Any change to `collectNodes()` or to what the build gates over
- Backfill for plans `0001`–`0078`

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| **The delta list is three fields, all already in the schema** | The umbrella's single-owner rule holds literally. A delta list that needed new fields would mean the schema failed to own both layers | ✅ |
| **An internal item is a created artefact, or a named behaviour introduced into an existing one** | "Created artefacts" alone yields zero items for a modification-only plan — `0075` is exactly that, and `0078`'s command edits are the same shape. A behaviour worth indexing has a name in the source, which is the same public-surface test the product layer applies | ✅ |
| **A removal is recorded on the removed thing's own entry, never as an item on the remover's** | An item is something this delivery *has*. A deletion is a fact about a different entry, and the schema's `superseded` already carries it | ✅ |
| **Git supplies the diff; the graph only classifies** | The graph is gitignored and rebuilt every build, so no prior graph exists to compare against. Saying so prevents someone building a per-delivery graph snapshot | ✅ |
| **`superseded` is proposed by the diff, decided by a human** | A deletion proves removal; only a person knows whether the new thing *replaces* it. Automating that half would put an invented decision into the record | ✅ |
| **The supersession match runs `verify` first, then keys on `node`, falling back to `find`** | An item's `at` is a hint that goes stale — matching on it produces the same false negative `write-verify` already solved for hotfix routing. A `node` id survives file moves; where there is none, the anchor is the key, as everywhere else | ✅ |
| **A rename is never a deletion** | `git diff --name-status` emits `R###`, which the added/deleted/modified buckets do not cover. A renamed artefact is not gone, and recording it as `superseded` would be a lie the verification would then have to unpick. It is a `changed` item, which `--repair` already handles | ✅ |
| **Misattributed items are acknowledged as mechanically undetectable** | The hard bans refuse absent, malformed and over-matching anchors — not a well-formed anchor pointing at a pre-existing identifier in a merely-touched file. Claiming otherwise would be the loophole hiding behind a check that does not cover it | ✅ |
| **The join is one-directional, by id only** | Keeps the index out of code-mapping, which the umbrella put out of scope, and keeps a time axis out of the graph | ✅ |
| **`node` is omitted, never faked, for non-nodes** | A synthesised id resolves to nothing in `graph.js`. An absent field is honest; a dangling one is a trap | ✅ |
| **`collectNodes()` is not extended here** | Tempting and out of scope: it changes what the build gates over, with its own blast radius and its own decision | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `docs/delivered.jsonl` (internal) | Carries `layer: "internal"` entries | None — the schema already allows it |
| `add-doc-schemas/references/delivery-index.md` | Documents the internal field usage | Add a short section; no new fields |
| `/add-framework--done` STEP 3 | Implements this derivation | Specified here, built there |
| `artefact-graph.json` / `scripts/build.js` | **Unchanged.** Read for classification only | None |
| `scripts/graph.js` | Consumes `node` for the join | `query` subtopic |
| `provider-map.json` | Untouched | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| One schema that genuinely serves both layers | Internal items are not fully automatic — modification-only plans need an authored name |
| Time and structure joinable by one id | A field that is empty for scripts, `CLAUDE.md` and `.opencode/` |
| Supersession proposed rather than remembered | One question per deletion at close-out |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Modification-only plans get lazy items — a file path instead of a named behaviour | **High** | The likeliest quality failure, and **the mechanical checks only go halfway.** The schema's hard bans refuse an anchor that is absent, malformed, or over-matching — so a *vague* item cannot be written. They cannot refuse a **well-formed but misattributed** one: an author can satisfy every ban by citing a pre-existing identifier that sits in a file this delivery merely touched. Nothing detects that automatically. `/add-framework--shared-review`, which audits a plan against its implementation, is the only thing positioned to catch it, and only if a reviewer reads the entry as part of the delivery |
| Someone extends `collectNodes()` to close the `node` gap without noticing it changes the build gates | Med | Recorded here as explicitly out of scope, with the reason, not merely omitted |
| The `superseded` question is answered carelessly at close-out | Med | Both answers are truthful records — `gone` and `superseded` differ only in whether a pointer is set. A wrong answer is corrected by appending a line |
| A future reader tries to snapshot the graph per delivery | Low | The derivation's direction is stated explicitly, with the gitignored-and-rebuilt reason |

## RED Test Matrix

| # | Setup | Expected |
|---|---|---|
| 1 | A delivery adding one agent | One item, `node` filled with `<layer>/agent/<name>` |
| 2 | A delivery adding one top-level script | One item, `node` **absent** |
| 3 | A modification-only delivery | Items are authored named behaviours; each `find` resolves in the source |
| 4 | A delivery deleting an artefact present in an existing entry | A supersession is **proposed** against that entry, not written silently |
| 5 | Answering that proposal "replaced" | The old entry gains `superseded` + `superseded_by`; the new entry is unaffected |
| 6 | Answering it "removed" | The old entry gains `gone`, no `superseded_by` |
| 7 | A delivery touching only `CLAUDE.md` | An item with no `node`, anchored on a real string in the file |
| 8 | An item whose `node` names a non-existent graph node | Refused at write — a dangling join is worse than an absent one |
| 9 | A delivery with no nameable surface | Write refused (schema requires ≥1 item); the work belongs in the changelog |
| 10 | A delivery **renaming** an artefact that an existing entry indexes (`R100`) | The old entry's item becomes `changed` and `--repair` fixes its `at`. **No supersession is proposed** |
| 11 | A delivery deleting an artefact whose entry carries a **stale** `at` | The supersession is still proposed — `verify` ran first, and the match keyed on `node` |
| 12 | A delivery deleting a **script** (no `node`) that an entry indexes | Matched by `find`; supersession proposed |

## Next Steps

**The set is complete — all eight documents are written and reviewed.** Nothing remains to refine.

It awaits the owner's approval of the handoff summary, which carries two decisions that reverse or narrow earlier ones: `plan.md` and `iterations.*` are kept rather than pruned (04), and the internal cleanup is retiring force-add rather than deleting (06).

On approval, both layers are plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```
