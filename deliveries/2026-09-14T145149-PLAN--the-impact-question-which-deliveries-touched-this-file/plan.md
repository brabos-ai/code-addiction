# Plan: The impact question — which deliveries touched this file

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-09-14

---

## Context

"Who has already changed this file?" has no working answer in a project on the current document
format. `touched_by` answers it by matching the query's paths against a work item's `files` set, and
in the docs corpus exactly one thing ever fills that set: an attachment of a schema that was retired
and that nothing writes any more. Its wiki-page half still answers; its work-item half returns an
empty list in every greenfield project.

`2026-09-14T102848-PLAN--product-knowledge-discovery-answers-the-question` made two commands state
that question out loud — `add.review` STEP 2.2 and `add.hotfix` STEP 9.1 — which is how the gap
surfaced. Neither command caused it and neither is a regression: the same query landed in the same
half-empty place before, without saying so.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-12T075635-delivered-work-relationships-000-umbrella.md` | Its defect 2 is this item; its subtopic 003 reserved a design that was never written. Decision 8 (one derived relationship, computed at read time and never written) and decision 24 (nothing may depend on gitnexus; git is the always-available floor) are carried forward. Its stale-`at` objection is answered under Validated Decisions rather than inherited |

## Global Constraints

- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception, always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- HTML comments (`<!-- -->`) are stripped at build; injection markers and `<!-- uses: -->` blocks rely on this (CLAUDE.md, Pipeline)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- `delivered.sh` stays the only writer of `docs/delivered.jsonl` (`delivery-index.md`, hard ban 6)
- **Never rewrite or delete a line. Corrections are new lines** (`delivery-index.md`, hard ban 6)
- **`done.sh` owns every LOCAL git write on both routes** (`add.done.md:65`, `:468`, `:768`)
- Nothing may depend on gitnexus: it is a plugin, disabled by default, installed by the user (brainstorm umbrella, decision 24)
- `mcp/` takes no dependency at all, `yaml` included, because `--corpus=artefacts` runs from the repository root where the CLI's `node_modules` is off the resolution path (CLAUDE.md, Product Layer — `mcp/`)
- Each script documents its own usage and exit codes in its header (CLAUDE.md, Key files)

## Problem

1. **A work item's file set has exactly one producer, and it is retired.** `mcp/corpora.mjs:352`
   initialises `files: []` on every node; `:389-393` is the only code that ever pushes into it, and it
   fires for `attachment.type === 'hotfix-related'`. That schema is marked `### hotfix-related
   (retired)` at `add-doc-schemas/references/fix.md:52`, and no command or template writes it. **So
   `touched_by --corpus=docs` returns `workItems: []` in any project on the current format.**

2. **The retirement note says the capability exists, and that is what hid the gap.** `fix.md:63-68`
   claims three things and all three are false: that `## Impacted Files` "lives now" in *"the node's
   file set in the graph index"* — true only while the legacy `related.md` is on disk; that this set is
   *"what `touched_by` crosses against a wiki reference page's `sources` globs"* — `mcp/engine.mjs`
   crosses the QUERY's paths against `node.files` and, in a separate branch, the QUERY's paths against
   a page's globs, never one against the other; and that *"the migration reads both filled sections,
   harvests them into the new format"* — true for `## Follow-ups`, false for `## Impacted Files`, where
   `cli/src/migrations.js:312` does `harvest.impactedFiles += 1` and writes nothing.

3. **The index stores commits the merge throws away.** Every entry carries `commits`, the branch shas.
   Merges are squash, so those shas are unreachable from `main`. Measured 2026-09-14:
   `git merge-base --is-ancestor 147086c main` answers no, and `git log --format=%h --
   framwork/.codeadd/scripts/delivered.sh` returns `5911c5c 48eb87d 33da91d` while the entry stores
   `147086c 95cb808 1d8e45b`. **Zero intersection, for every delivery already merged.**

4. **The delivery's real commit is recoverable and nobody recovers it.** `git show --name-only
   5911c5c` lists 34 files: the complete delivery. The sha is not stored, but it does not need to be —
   see the Proposal.

5. **Two shipped commands ask and receive half an answer.** `add.review` STEP 2.2 hands its judges
   "the deliveries that last changed these files" and hands them wiki pages only; `add.hotfix` STEP
   9.1 asks the same of the fix's own diff.

## Proposal

**The delivery's commit is derived, never stored.** The index line is committed on the branch at the
close-out's archive step and the merge squashes that branch, so **the commit that introduced an
entry's line IS the commit that delivered it** — by construction, on both layers, with no field to add
and no second write.

```bash
git log --format=%h -S'"id":"<id>"' -- docs/delivered.jsonl | tail -1
```

Measured 2026-09-14 over this repository's 20 unique entries: **20 of 20 resolve**, 17 to a commit
carrying a code diff and 3 to a `docs/`-only commit. Those three are index lines recorded outside the
normal flow — their messages read `chore(delivery-index): record the … delivery` — and the
`docs/`-only shape is what detects them. One derivation costs 0.34s; walking every commit that touched
the index costs 0.29s.

Three topics:

**T1 gives `delivered.sh` the answer.** A path-query mode, returning two labelled layers: the
**complete** set, from the derived commit's own diff, and the **curated** set, from `items[].at` with
each item's verified status attached. An entry whose derived commit touches only `docs/` answers from
the curated layer and is counted as such.

**T2 wires it and deletes the legacy reader.** `touched_by`'s work-item half delegates to
`delivered.sh`, exactly as the `history` action already does — `mcp/engine.mjs:503` states the rule in
its own words: *"THE READ IS DELEGATED, NEVER REIMPLEMENTED."* The `hotfix-related` branch,
`parseImpactedFiles`, the migration's count-and-point and the retired schema section all come out.

**T3 places gitnexus.** The index says which deliveries touched a path and whether each anchor is
still live. gitnexus, when the user has it, says what is around that path now. It enriches and is
never the base, so the answer keeps its shape with the plugin off.

## Current State

| Artefact | Direct callers (depth 1) | What it does today |
|---|---|---|
| `add-doc-schemas` | 23 | `references/delivery-index.md` owns the record; `references/fix.md:52-73` carries the retired schema and its three false claims |
| `add.review` | 17 | STEP 2.2 asks the path question, receives pages only |
| `add.done` | 11 | Commits the entry at its archive step, merges after. `done.sh` owns every local git write |
| `add-knowledge-discovery` | 8 | `SKILL.md:113` is the only product artefact that reaches `touched_by` |
| `add.hotfix` | 8 | STEP 9.1 asks the path question, receives pages only |
| `delivered.sh` | 3 | `read`, `write`, `verify`. No file-query mode |
| `add-wiki-maintenance` | 3 | STEP 3 computes `changed files ∩ page sources globs` and discards the mapping |
| `mcp/engine.mjs`, `mcp/corpora.mjs`, `cli/src/migrations.js` | not graph nodes | Where the defect lives |

`CLAUDE.md` names none of these except the `mcp/` row at line 97, which describes the server's shape
and does not change.

## Scope

### Includes

#### T1 — the index answers the file question

- **F1** [product] — `framwork/.codeadd/scripts/delivered.sh`: a mode that answers **which deliveries
  touched these paths**. It derives each entry's delivery commit with the pickaxe above, then returns
  two labelled layers, never merged into one list: **complete**, from the derived commit's own
  `--name-only` diff; and **curated**, from `items[].at`, each carrying the status `verify` computes.
  An entry whose derived commit touches only `docs/` answers from the curated layer alone and is
  counted in a reported total. Its header documents the mode, its two layers and its exit codes. Must
  NOT lose: `read`, `write`, `verify` and `--repair` behaviour, the nine hard bans, the `REFUSED=`
  vocabulary, the corpus rule, and that `write` stays the only writer.
  - **Produces:** `delivered.sh` answers a path query with a COMPLETE block from the derived commit and a CURATED block from `items[].at`, each labelled, plus a count of entries that could answer only from the curated layer
- **F2** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md`: documents
  the derivation — the pickaxe, why it is correct by construction (the line is committed on the branch
  before the merge squashes it), and the one case where it is not: an entry recorded outside the normal
  flow resolves to a `docs/`-only commit. States plainly that `commits` holds branch shas a squash
  makes unreachable, and that nothing is stored to fix that. Must NOT lose: hard ban 6, reading rule 2,
  the four statuses, the `origin` rule.
  - **Consumes:** `delivered.sh` answers a path query with a COMPLETE block from the derived commit and a CURATED block from `items[].at`, each labelled, plus a count of entries that could answer only from the curated layer (F1)

#### T2 — `touched_by` answers, and the legacy reader is deleted

- **F3** [product] — `mcp/engine.mjs`: `touched_by`'s work-item half delegates to `delivered.sh`,
  mirroring the `history` delegation at `:503`. Its page half is untouched. Must NOT lose: the engine's
  zero-dependency rule, the `unavailable` shape the existing delegation uses for a missing script, and
  the assertion that both surfaces answer identically.
  - **Consumes:** `delivered.sh` answers a path query with a COMPLETE block from the derived commit and a CURATED block from `items[].at`, each labelled, plus a count of entries that could answer only from the curated layer (F1)
- **F4** [product] — `mcp/corpora.mjs`: **delete** the `attachment.type === 'hotfix-related'` branch at
  `:389-393` and the then-uncalled `parseImpactedFiles` at `:201`. **No compatibility branch, no flag,
  no `files ?? []` left standing as a courtesy.** The docs corpus's `files` field goes with them unless
  something still reads it; the artefacts corpus sets `files` from a node's own path at `:512` and is
  untouched. Must NOT lose: `touched_by`'s page half, which reads `sources` and not `files`.
- **F5** [product] — `cli/src/migrations.js`: migration 0002 stops counting `Impacted Files` and stops
  pointing at the indexer. It reports, once, how many legacy lists it found and that they do not enter
  the new format — the file stays on disk as history. Must NOT lose: the additive-only rule, that it
  never deletes and never commits, and the unresolved-id report.
- **F6** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/fix.md`: **delete** the
  `### hotfix-related (retired)` section at `:52-73` in full. Its measured baseline — 18 of 19 hotfixes
  carried a real `## Impacted Files` list — is recorded in this delivery's changelog instead, so the
  evidence survives without a schema section propping up a dead format.
- **F7** [product] — `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md`: the action table row
  at `:113` states what the question now returns — a complete layer and a curated one — and names
  gitnexus as additive enrichment for "what is around this now", never as part of the answer. Must NOT
  lose: the eleven rows, the empty-answer versus missing-route split, the `NOT VERIFIED` label, the
  one-shot CLI form, and both steps' STANDALONE property.
  - **Consumes:** `delivered.sh` answers a path query with a COMPLETE block from the derived commit and a CURATED block from `items[].at`, each labelled, plus a count of entries that could answer only from the curated layer (F1)

#### T3 — coverage

- **F8** [product] — `framwork/.codeadd/scripts/tests/delivered.bats`: RED-first cases for the path
  query, per L1. Must NOT lose: the existing `read`, `write`, `verify` and `--repair` cases.
- **F9** [product] — `cli/tests/`: RED-first cases for the delegation, the deletions and the end-state
  assertions, per L2 and L3. The cli suite runs serially.

### Does NOT Include (important!)

- **Storing the delivery's commit in the record.** The first draft of this plan did, as a second index
  line written after the merge. The review found two blockers and both were real: the second line has
  no route to `main` (neither close-out checks out `main` on the normal path, and `add.done.md:65`,
  `:468` and `:768` each state that `done.sh` owns every local git write), and hard ban 1 forces the
  second line to restate `items`, which `doWrite` re-validates against the post-merge corpus and can
  refuse outright. The derivation removes the need for the line, so both blockers dissolve rather than
  being answered.
- **Changing the merge strategy.** Squash stays. The squash commit already carries the complete
  delivery — measured, 34 files in `5911c5c`.
- **Converting the legacy `## Impacted Files` lists.** With the derived commit as the complete source,
  a hand-written list is strictly worse than the commit's own diff.
- **Any dependency on gitnexus.** It enriches. Every leg answers with the plugin off.
- **`add-wiki-maintenance`'s discarded join.** It is the umbrella's subtopic 004 and a separate item.
- **A twelfth MCP action.** `touched_by` keeps its name and signature.
- **Making `items[].at` searchable by `delivered.sh read`.** That exclusion is about TEXT SEARCH and
  its reason holds; this plan reads `at` as a typed field, which is a different operation.
- **Repairing the three `docs/`-only entries.** They are detected and reported, not rewritten — hard
  ban 6 forbids rewriting a line and nothing here needs them repaired.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Where does a delivery's complete file set come from? | The commit that introduced its index line | Correct by construction: the close-out commits the line on the branch and the merge squashes that branch. Measured: 20 of 20 entries resolve, against 13 of 20 for a derivation keyed on `origin` |
| Stored or derived? | **Derived** | The first draft stored it and the review blocked on two consequences of that choice, both verified. Deriving needs no field, no second write, no route to `main`, and no re-validation that can refuse |
| Is the merge strategy changed? | No | The user offered. Not needed: the squash commit already carries the complete diff, so nothing about the history had to change |
| What does `items[].at` become? | The curated layer, kept beside the complete one | It is the only file pointer that self-heals — `verify --repair` reappoints it against the current tree — and it carries a per-item live/dead status a diff cannot. It is capped at 5, so it is a sample, and the answer labels which layer each result came from |
| Does the stale-`at` objection carry? | No, not to this | `delivered.sh` records it about TEXT SEARCH — a query hitting a stale pointer. Reading `at` as a typed field, after `verify`, is a different operation |
| What about an entry whose derived commit is `docs/`-only? | Detected, reported, answered from the curated layer | Three of twenty, all index lines recorded outside the normal flow. The `docs/`-only shape is the detector; no repair is needed and hard ban 6 forbids one |
| Where does gitnexus sit? | Additive enrichment, never the base | Umbrella decision 24: every leg degrades to a working answer without it |
| What happens to the legacy lists? | Not converted. Reported once, left on disk | With the derived commit as the complete source there is no destination that would not be worse than the commit's own diff |
| Does the retired schema section survive? | **No — deleted in full** | The user's call, against this plan's initial recommendation, and consistent with the stated requirement: no internal path kept alive for something that no longer works. Its measured baseline moves to the changelog |
| Who answers `touched_by`'s work-item half? | `delivered.sh`, by delegation | `mcp/engine.mjs:503` already states the rule for `history` and already shells out. A second reader of one index is what the read contract's no-re-ranking rule exists to prevent |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A complete, exact file-to-delivery answer for all 20 existing entries and every future one, with no migration | Each query costs a git pickaxe walk — measured at 0.34s here, and growing with the index's history |
| A curated layer that says which anchors are still live, which a diff cannot | An answer with two blocks, and a caller that must read which is which |
| The legacy reader gone, with no branch kept for a dead schema | The 18 legacy lists stop feeding anything |
| No change to either close-out, and no write to `main` | Three entries answer from the curated layer only, until they are superseded by a normally-recorded one |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| The two blocks are read as one, and the curated sample is taken for the complete set | High | F1 labels each block and counts curated-only entries; L2.4 asserts both labels and the count are present |
| The pickaxe walk gets slow as the index's history grows | Medium | L2.5 records the measured time against a fixture with 100 entries rather than asserting a guessed threshold, so the number is in the test output when it starts to matter |
| A shallow clone has no history for the pickaxe to walk | Medium | F1 treats an empty derivation exactly as it treats a `docs/`-only one — curated layer, counted, reported. L1.7 asserts it on a fixture with a truncated history |
| Deleting `parseImpactedFiles` breaks the brownfield fixture | Medium | F5 and F9 change the fixture and its assertions together; L3.1 asserts no `hotfix-related` reference survives in `mcp/` or `cli/src/` |
| The deletion leaves a courtesy fallback that quietly restores the old path | Medium | F4 names the shapes explicitly; L3.1 greps the name and the Reviewer Handoff asks for the diff to be read for the shape |
| `touched_by`'s page half breaks with `files` gone | Medium | F4 names it as must-not-lose; L2.6 asserts a wiki page is still returned for a path its `sources` globs cover |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/scripts/delivered.sh` | product | modify | The path-query mode (F1) |
| `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md` | product | modify | Documents the derivation and its one exception (F2) |
| `framwork/.codeadd/skills/add-doc-schemas/references/fix.md` | product | modify | The retired section is deleted (F6) |
| `mcp/engine.mjs` | product | modify | `touched_by`'s work-item half delegates (F3) |
| `mcp/corpora.mjs` | product | modify | The `hotfix-related` branch and `parseImpactedFiles` are deleted (F4) |
| `cli/src/migrations.js` | product | modify | Counting becomes reporting (F5) |
| `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md` | product | modify | The action table row, and gitnexus as enrichment (F7) |
| `framwork/.codeadd/scripts/tests/delivered.bats` | product | modify | L1 (F8) |
| `cli/tests/helpers/brownfield-fixture.js` | product | modify | The `hotfix-related` document it builds (F5, F9) |
| `cli/tests/migrations.test.js` | product | modify | The harvest report changes shape (F9) |
| `cli/tests/docs-knowledge-graph.test.js` | product | modify | Assertions on the retired schema and on `files` (F9) |
| `cli/tests/mcp-engine.test.js` | product | modify | `touched_by`'s contract changes (F9) |
| `cli/tests/` (new suite) | product | create | End-state assertions for T1 and T2 (F9) |
| `.claude/commands/add-framework--done.md` | internal | **no change** | The first draft changed it. The derivation needs nothing from either close-out |
| `framwork/.codeadd/commands/add.done.md` | product | **no change** | Same. `done.sh` keeps its monopoly on local git writes, untouched |
| `add.review`, `add.hotfix` | product | **no change** | Both already state the path question and name a destination. They receive work items once F3 lands. Verified against both files, not assumed |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN.

This change touches no feature or plugin injection anchor, so the map is unchanged and L2.7 asserts
`injection-points.json` still carries the same gitnexus section names and count.

### L1 — `delivered.bats`, over a fixture repository with real commits (RED → GREEN)

1. The path query returns a delivery whose derived commit's diff contains the queried path, in a block
   labelled complete. *RED today: no such mode.*
2. The same query returns a delivery whose `items[].at` names the path but whose derived commit does
   not, in a block labelled curated, carrying that item's verified status. *RED today.*
3. The derivation resolves to the commit that INTRODUCED the entry's line, not to a later commit that
   appended a correction line for the same id. *RED today.*
4. An entry whose derived commit touches only `docs/` is answered from the curated layer and counted
   as such. *RED today.*
5. The reported curated-only count equals the number of such entries, over a fixture mixing both
   kinds. *RED today.*
6. A path no delivery touched returns both blocks empty, and that is distinct from the index being
   absent. *RED today.*
7. A fixture whose history does not reach the entry's line — a shallow clone — is treated as the
   `docs/`-only case: curated layer, counted, reported. Never an error. *RED today.*
8. `read`, `verify` and `--repair` behave exactly as before. *Regression guard, GREEN today.*

### L2 — `cli/tests/`, over the built tree

1. `delivered.sh`'s header documents the path-query mode, its two layers and its exit codes.
2. `delivery-index.md` documents the derivation, states why it is correct by construction, and names
   the `docs/`-only exception.
3. `touched_by --corpus=docs` returns work items for a path in a fixture project written entirely in
   the current format, with no `hotfix-related` document anywhere. *RED today: it returns `[]`.*
4. The answer labels its complete and curated blocks and carries the curated-only count.
5. The path query runs against a 100-entry fixture and its wall time is **recorded in the test
   output**, not asserted against a guessed threshold.
6. `touched_by` still returns a wiki page for a path that page's `sources` globs cover. *GUARD — F4
   deletes `files`, not `sources`.*
7. `injection-points.json` carries the same gitnexus section names and count as before. *GUARD.*
8. `node scripts/build.js` exits 0 with no new warning and no new lint finding.

### L3 — Behavioural acceptance

1. `grep -rn "hotfix-related" mcp/ cli/src/` returns nothing; `parseImpactedFiles` is absent from
   `mcp/`; `fix.md` carries no `hotfix-related` section. *RED today: `mcp/corpora.mjs:389`.*
2. Migration 0002 reports the count of legacy lists it found and states they do not enter the new
   format; it writes no file list and still never deletes and never commits. *RED today: it counts
   silently.*
3. `add-knowledge-discovery`'s action table row states both layers of the answer and names gitnexus as
   enrichment, not as part of it. *RED today.*
4. Both MCP surfaces answer `touched_by` identically for the work-item half, asserted the way
   `mcp-engine.test.js` already asserts the shared verbs. *RED today.*
5. With gitnexus absent, every assertion above still passes. *GUARD — the plugin is disabled by
   default, so this is the default run.*
6. Neither close-out changed: `.claude/commands/add-framework--done.md` and
   `framwork/.codeadd/commands/add.done.md` are byte-identical to their pre-change state. *GUARD —
   this is what the derivation bought, and a build that reaches for them has taken the stored design
   by mistake.*

**RED expectations:** L1.1–L1.7, L2.1–L2.5, L3.1–L3.4 fail today. L1.8, L2.6, L2.7, L3.5, L3.6 are
guards.
**GREEN = all levels pass after F1–F9.**

## Execution Order

```
F8 ─┐ (RED suites first)
F9 ─┘
     └─> F1 ──> F2                    [T1, the answer]
             └─> F3 ──> F7            [T2, the wiring]
                 F4 ──> F5 ──> F6     [T2, the deletion]
```

- **F8 and F9 first**, because RED-first is the discipline.
- **F1 before F2**, because a contract documents what exists, never what is about to.
- **F1 before F3**, because the delegation calls what F1 builds.
- **F3 before F7**, because the skill describes what the action returns.
- **F4 before F5 before F6** — the reader goes, then the migration that fed it, then the schema section
  that documented it. Reversing this leaves a live reader pointing at a deleted schema.
- **The two arms of T2 are independent** and may interleave.

**Working-state boundaries** — the repo is consistent and the build passes at each:

- After **F2**: the index answers the file question and its contract says how. Nothing reads it yet.
- After **F7**: `touched_by` answers. The legacy reader is still present and harmless.
- After **F6**: the legacy path is gone. The whole plan.

A build that must stop should stop on one of those three, never between F1 and F2 (the contract would
lag the script), and never between F4 and F6 (a schema section documenting a reader that no longer
exists).

**Per-F-block validation beyond the layer default:** F1 and F8 run `npm run test:scripts`. With the
Docker daemon up it uses the container runner and takes about a minute; `npm run test:scripts --
<file>` runs one file. Clear `NODE_OPTIONS` first — an injected debugger writes its banner onto stdout
ahead of the script's `KEY=VALUE` output.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file: what changed with the F-block id, which
validation levels cover it and their pass state, and any decision deferred or altered with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. **A compatibility branch surviving the deletion.** The requirement is that no internal path is kept
   for the retired schema. A `files ?? []` left standing, a flag, a conditional — any of them
   reintroduces what F4 removes. L3.1 greps the name; read the F4 diff for the shape.
3. **The two answer blocks collapsing into one list.** The whole value of the curated layer is that a
   reader can tell it from the complete one.
4. **gitnexus becoming load-bearing.** L3.5 runs with the plugin off; confirm no text makes the answer
   conditional on it.
5. **Either close-out being touched.** L3.6 asserts both are byte-identical. A build that edits one has
   reached for the stored design this plan rejected, and the two blockers come back with it.
6. **The derivation quietly repairing an entry.** Hard ban 6 forbids rewriting a line. The three
   `docs/`-only entries are reported, never fixed.

## References

- Design: `docs/brainstorming/2026-09-12T075635-delivered-work-relationships-000-umbrella.md` —
  defect 2, subtopic 003, decisions 8 and 24
- Prior art: `2026-09-14T102848-PLAN--product-knowledge-discovery-answers-the-question` made the path
  question explicit, which is how this gap surfaced
- Prior art: `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` built `touched_by` and the docs corpus
- Roadmap item this closes: 1.3

---

## Next Steps

/add-framework--build the-impact-question-which-deliveries-touched-this-file

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-14 | Initial creation |
| 2026-09-14 | The delivery's commit is derived, not stored. The review blocked the stored design on two verified consequences — the second index line has no route to `main`, and `doWrite`'s re-validation can refuse it — and both dissolve rather than needing an answer. Removes the `merge` field and both close-out changes; 12 F-blocks become 9, all `[product]`. Measured: the derivation resolves 20 of 20 entries against 13 of 20 for the `origin`-keyed alternative |
| 2026-09-14 | Implemented. Corrections the build and the review found: L2.3, L2.4 and L2.5 were never written and the delegation was proven only by degradation; `doTouched` cost 10.3s per query and was rewritten to 2.65s; `CURATED_ONLY` counted the index rather than the answer; an empty answer was indistinguishable from an absent index; the skill taught no reading for `unavailable`; `matched` carried two undocumented shapes; L1.7 tested an absent index rather than the shallow history it named; L3.4 is unsatisfiable because `scripts/graph.js` has no `touched_by`; and `gitnexus` was named in STEP 2 while STEP 7 of the same file forbids naming any graph plugin |
| 2026-09-14 | The delivery's commit is derived, not stored. The review blocked the stored design on two verified consequences — the second index line has no route to `main`, and `doWrite`'s re-validation can refuse it — and both dissolve rather than needing an answer. Removes the `merge` field and both close-out changes; 12 F-blocks become 9, all `[product]`. Measured: the derivation resolves 20 of 20 entries against 13 of 20 for the `origin`-keyed alternative |
