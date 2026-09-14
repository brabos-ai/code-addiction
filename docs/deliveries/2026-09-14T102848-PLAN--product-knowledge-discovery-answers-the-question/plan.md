# Plan: Product Knowledge Discovery — the INDEX step stops lying and the GRAPH step stops being pinned

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-09-14

---

## Context

Six product commands consult the delivery index and the docs knowledge graph through one skill,
`add-knowledge-discovery`, at the step where they decide whether the work in front of them has
already been done. Both halves of that consultation are broken, in ways that produce a confident
empty answer rather than an error.

The INDEX step tells the agent to pass `"<terms from the task>"` — plural — to a matcher that tests
one contiguous substring. The GRAPH step names two of the eleven actions the docs corpus implements,
and an agent runs what is written and stops.

Roadmap item 4.1 describes the second half. The first half is what is left of roadmap item 1 after
`2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` delivered the relationship format: item 1.1's two
"Done when" clauses both hold today, and the defect that survived is in the neighbouring step of the
same skill.

**A design set exists for part of this work and was superseded in flight.** The umbrella below
proposed a `rel` field inside `docs/delivered.jsonl` plus a new `.js` engine; what actually shipped on
2026-09-12 was typed `## Relations` in the documents themselves, served by the docs-corpus MCP. Its
six subtopic designs (001–006) were never written. This plan takes from it only the two-bucket read
contract, which the shipped design left untouched, and departs from its score-floor decision for the
reason recorded under Validated Decisions.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-12T075635-delivered-work-relationships-000-umbrella.md` | Decisions 17–21: two independent caps, no backfill, per-bucket counts, the caps as a declared tunable. Its decision 18 (score floor) and its `rel`/`.js`-engine shape are NOT carried forward |

## Global Constraints

- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception, always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- HTML comments (`<!-- -->`) are stripped at build; injection markers and `<!-- uses: -->` blocks rely on this (CLAUDE.md, Pipeline)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- `delivered.sh` stays the only writer of `docs/delivered.jsonl` (`delivery-index.md`, hard ban 6: corrections are new lines, never rewrites)
- `items[].at` stays out of the read haystack — `--repair` rewrites it on every anchor move (`delivered.sh:355-360`)
- Nothing may depend on gitnexus: it is a plugin, disabled by default, installed by the user (brainstorm umbrella, decision 24)
- Each script documents its own usage and exit codes in its header (CLAUDE.md, Key files)

## Problem

1. **`delivered.sh read` matches one contiguous substring, so a multi-term query returns nothing.**
   `delivered.sh:362-372` joins the haystack and tests `hay.indexOf(q) !== -1` (`:371`) against the whole query
   lowercased. Measured against this repository's own index on 2026-09-14:
   `read "knowledge graph"` → `MATCHED=1`; `read "graph knowledge"` → `MATCHED=0`;
   `read "hotfix relations"` → `MATCHED=0`. Meanwhile
   `add-knowledge-discovery/SKILL.md:44` instructs the agent to pass `"<terms from the task>"`. An
   agent that follows the skill gets `MATCHED=0` and concludes nothing shipped before — which is the
   exact failure the INDEX step exists to prevent.

2. **The single limit drops dead entries, contradicting three texts that promise it never does.**
   `delivered.sh:398` runs `list.slice(0, limit)` with a default limit of 10, after sorting
   `live → changed → superseded → gone`. Whenever `MATCHED > LIMIT` the cut takes from the `gone` end.
   Three places assert the opposite: `delivered.sh:387` ("Dead entries rank last and are NEVER
   dropped"), `delivery-index.md:178` ("Dead entries are returned, never filtered"), and
   `add-knowledge-discovery/SKILL.md:56` ("they are never hidden"). A `gone` entry is the answer that
   says this was tried and abandoned.

3. **The GRAPH step pins two of eleven actions.** `add-knowledge-discovery/SKILL.md:69` and `:75`
   carry literal `--action=search` and `--action=touched_by` invocations. `mcp/engine.mjs:91-102`
   implements eleven: `search`, `get`, `impact`, `dependencies`, `neighbors`, `path`, `touched_by`,
   `orphans`, `stats`, `reindex`, `history`. Counting `add.done.md:649` (`reindex`) and `:659`
   (`stats`), **four are reachable from a product artefact and seven are not** — `get`, `impact`,
   `dependencies`, `neighbors`, `path`, `orphans`, `history`.

4. **No product artefact owns question-to-call resolution.** `add-knowledge-discovery` covers when to
   consult, never which call answers which question. The internal layer split that role into
   `add-artefact-graph` on 2026-09-13; the product layer has no counterpart.

5. **`add-gitnexus` pins one native skill per command.**
   `plugins/gitnexus/skills/add-gitnexus/SKILL.md:47` opens `## Command-intent resolution`, which maps
   `add.new` → `gitnexus-exploring`, `add.plan` → `gitnexus-impact-analysis`, `add.hotfix` →
   `gitnexus-impact-analysis`, `add.done` → `gitnexus-cli`, and gives `add.diagnose` two. A planning
   run that needs to trace an error has the mapping pointing the other way.

6. **All nine gitnexus AGENT fragments carry a pinned native skill into the agent.** Each writes the
   pin inline, e.g. `agents/reviewer-agent.md`: "load skill `add-gitnexus` (→ `gitnexus-pr-review` and
   `gitnexus-impact-analysis`)". **The six COMMAND fragments carry no pin** — they state the intent and
   stop, which is already the target shape. Roadmap item 4.1 claims all fifteen carry the mapping; that
   is wrong, and fixing the six would remove correct text.

## Proposal

One plan, one subject: **the product layer's knowledge discovery answers the question it was asked.**

Three topics, sequenced by dependency. Topic A repairs the script the INDEX step reads, because a
read contract cannot be documented before the script honours it. Topic B rewrites the skill and its
six callers against the repaired script and the eleven actions. Topic C does the same for the gitnexus
plugin, whose corpus is optional and whose owner is therefore separate.

The question-to-call resolution lands as a **section inside `add-knowledge-discovery`**, not as a new
skill. The six commands do not query the graph directly — they run this skill's procedure — so a
separate skill would add a load hop with no new reader, and the product layer pays that token cost on
every user run.

## Current State

| Artefact | Direct callers (depth 1) | What it does today |
|---|---|---|
| `add-knowledge-discovery` (skill) | 8 — `add.brainstorm`, `add.diagnose`, `add.hotfix`, `add.new`, `add.plan`, `add.review`, `conformance-agent`, `add-feature-discovery` | 9-step procedure. Step 1 INDEX shells `delivered.sh read`; step 2 GRAPH names two actions |
| `add-gitnexus` (plugin skill) | 16 — 6 command fragments, 9 agent fragments, the `gitnexus` plugin (`CONTAINS`) | Intent → native skill table, then a per-command override table |
| `delivered.sh` | 3 — `add.done` (`verify` at `:711`, `write` at `:737`), `add.hotfix` (`read` at `:190`), `add-knowledge-discovery` (`read` at `:44`) | `doRead` substring-matches, ranks by status then `ts`, cuts with one `slice`. **Only two callers read `doRead`'s output: `add.hotfix` and the skill.** `add.done` never calls `read` |
| `add-doc-schemas` | 23 | `references/delivery-index.md` states the read contract |
| `add.done` | 11 | Calls `--action=reindex` and `--action=stats` — operations, not questions |
| 9 gitnexus agent fragments | 1 each (`INJECTS_INTO`) | Each pins a native skill inline |
| 6 gitnexus command fragments | 1 each (`INJECTS_INTO`) | State intent, pin nothing — already correct |

`CLAUDE.md` names none of these artefacts, so no hand-grep sweep of it is owed.

## Scope

### Includes

#### T1 — The INDEX step tells the truth (`delivered.sh`)

- **F1** [product] — `framwork/.codeadd/scripts/delivered.sh`: `doRead` splits the query on whitespace
  and matches per term against the existing haystack, scoring an entry by how many distinct terms hit
  it. An entry matching zero terms does not match. Must NOT lose: the `items[].at` exclusion and its
  recorded reason, `node` in the haystack, the `--no-verify` path that opens no source file, the
  `--layer` filter, and the existing `live → changed → superseded → gone` rank as the tie-break above
  `ts`. The script header's usage block gains the scoring rule.
  - **Produces:** `doRead` per-entry `score` = count of distinct query terms hit, and the sort `(rank, score desc, ts desc, id)`
- **F2** [product] — `framwork/.codeadd/scripts/delivered.sh`: `doRead` replaces the single
  `slice(0, limit)` with two independent caps — **5 live** (`live`, `changed`) and **up to 2 dead**
  (`superseded`, `gone`) — with **no backfill**: unused dead slots do not go to live entries. The caps
  are declared constants with a comment naming them a tunable that requires evidence to change.
  `--limit N` continues to be accepted and sets the live cap, leaving the dead cap fixed. The inline
  comment at `delivered.sh:387` ("Dead entries rank last and are NEVER dropped") is corrected in the
  same edit: with a dead cap of 2, a matching dead set larger than 2 IS cut, and the comment must say
  so or it becomes the fourth text promising what the script does not do.
  - **Consumes:** `doRead` per-entry `score` = count of distinct query terms hit, and the sort `(rank, score desc, ts desc, id)` (F1)
  - **Produces:** `delivered.sh read` emits `MATCHED_LIVE`, `MATCHED_DEAD`, `RETURNED_LIVE`, `RETURNED_DEAD` in place of `MATCHED` and `RETURNED`
- **F3** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md`: the read
  contract describes per-term matching and the two-bucket cut, and its line 178 stops promising
  something the script did not do. Must NOT lose: hard ban 6 (corrections are new lines), and the
  four-status vocabulary.
  - **Consumes:** `delivered.sh read` emits `MATCHED_LIVE`, `MATCHED_DEAD`, `RETURNED_LIVE`, `RETURNED_DEAD` in place of `MATCHED` and `RETURNED` (F2)

#### T2 — The GRAPH step asks by question

- **F4** [product] — `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md`: step 2 GRAPH stops
  carrying two literal invocations and gains a **question → action** table covering all eleven actions
  in `mcp/engine.mjs`, in the shape `.claude/skills/add-artefact-graph/SKILL.md` established for the
  internal layer. It carries three things that skill proved necessary: an **empty answer is a finding
  and a missing route is not**, stated as two distinct outcomes; a **`NOT VERIFIED` label** for the
  no-route case; and the **one-shot CLI form** for a provider with no MCP configured. Step 1 INDEX is
  updated to the new output keys and its false "never hidden" sentence is corrected. Must NOT lose:
  both steps' STANDALONE property, the `--no-verify` exemption for `/add.hotfix` STEP 4 and its
  recorded rationale, the "index answers *whether*, never *how*" rule, and the graph-absent no-op.
  - **Consumes:** `delivered.sh read` emits `MATCHED_LIVE`, `MATCHED_DEAD`, `RETURNED_LIVE`, `RETURNED_DEAD` in place of `MATCHED` and `RETURNED` (F2)
  - **Produces:** the GRAPH step's contract — a command states its question, points at this table, and gates on a filled `RELATED_WORK`
- **F5** [product] — the six commands that load the skill —
  `framwork/.codeadd/commands/add.plan.md`, `add.new.md`, `add.hotfix.md`, `add.brainstorm.md`,
  `add.diagnose.md`, `add.review.md`: each states the question it must answer at its GRAPH step and
  points at F4's table instead of naming or implying an action, and each keeps a gate on a filled
  answer. Must NOT lose: every existing `RELATED_WORK` destination sentence — `add.plan.md:166` and
  `:359`, `add.new.md:118`, `add.hotfix.md:183`, `add.brainstorm.md:84`, `add.diagnose.md:91` and
  `:141`, `add.review.md:305` — and `add.review`'s note that STEP 10 arrives with `qa-pipeline`.
  **`add.hotfix.md` carries one edit beyond the GRAPH step:** its direct `delivered.sh read` call at
  `:190` is the only command-level read of `doRead`'s output, so the text around it names the
  per-bucket counts. A triage run told only how many entries came back concludes that is how many
  matched — which is the reading umbrella decision 21 exists to prevent.
  - **Consumes:** the GRAPH step's contract — a command states its question, points at this table, and gates on a filled `RELATED_WORK` (F4)
  - **Consumes:** `delivered.sh read` emits `MATCHED_LIVE`, `MATCHED_DEAD`, `RETURNED_LIVE`, `RETURNED_DEAD` in place of `MATCHED` and `RETURNED` (F2)
- **F6** [product] — `framwork/.codeadd/commands/add.done.md`: the `--action=reindex` call at `:649`
  and `--action=stats` at `:659` **stay as written**, with one line recording that an operation names
  its call because it is not a question. This F-block exists so the build does not "fix" them and so a
  later reader does not.

#### T3 — gitnexus resolves by intent

- **F7** [product] — `framwork/.codeadd/plugins/gitnexus/skills/add-gitnexus/SKILL.md`: the
  `## Command-intent resolution` section at `:47` is replaced by resolution from the **intent in hand**,
  keeping the `## Intent → native skill` table at `:35` as the single mapping. A command name no longer
  selects a native skill. Must NOT lose: the `grep vs graph` split, the unindexed-graph fallback ("say
  so explicitly, then proceed with grep; do not block"), and the freshness note that re-indexing is
  `add.done`'s job.
  - **Produces:** `add-gitnexus` resolves from intent only; no section maps a command name to a native skill
- **F8** [product] — the nine agent fragments under
  `framwork/.codeadd/plugins/gitnexus/fragments/agents/` — `architecture-agent.md`, `backend-agent.md`,
  `database-agent.md`, `discovery-agent.md`, `frontend-agent.md`, `reviewer-agent.md`,
  `system-design-agent.md`, `ux-agent.md`, `ux-flow-agent.md`: each drops its inline
  `(→ gitnexus-<skill>)` pin and states the question that agent asks. Must NOT lose: each fragment's
  `<!-- section:graph -->` markers, its `<!-- uses: -->` block, its agent-specific framing (frontend
  and ux fragments say "frontend-scoped"), and the per-fragment grep-insufficiency sentence.
  - **Consumes:** `add-gitnexus` resolves from intent only; no section maps a command name to a native skill (F7)

#### T4 — Coverage

- **F9** [product] — `framwork/.codeadd/scripts/tests/delivered.bats`: RED-first cases for per-term
  matching and the two-bucket cut, per L1 below. Must NOT lose: the suite's existing cases for
  `write`, `verify` and `--repair`.
- **F10** [product] — `cli/tests/` — extend `delivery-index.test.js` for the new output keys and add a
  suite asserting the end-state counts of T2 and T3 per L2 below. The cli suite runs serially.

### Does NOT Include (important!)

- **Roadmap item 1.2.** The migration for old installs. `cli/src/migrations.js` migration 0002
  (`harvestRelations`) already harvests relations a brownfield project wrote; what is left — an initial
  structure grouped by app/group/category for a project that wrote none — has no design, and the
  roadmap itself says "tree or graph: the shape is still open". Planning it here would stop this plan
  to design it.
- **A `rel` field in `docs/delivered.jsonl`, and a new `.js` engine under
  `framwork/.codeadd/scripts/`.** The umbrella's shape, superseded by what shipped on 2026-09-12:
  relationships live as typed `## Relations` in the documents, served by `mcp/engine.mjs`. Building
  both would give one fact two homes.
- **A relevance score beyond term hits.** F1 scores by how many query terms an entry matched. No IDF,
  no field weighting, no fuzzy matching.
- **The six gitnexus COMMAND fragments.** They already state intent and pin nothing. Changing them
  removes correct text.
- **`add.done`'s two `--action=` calls.** Operations, not questions — F6 records why rather than
  changing them.
- **Making `items[].at` searchable.** The exclusion is deliberate and its reason holds.
- **Any new MCP action.** The eleven in `mcp/engine.mjs` are the surface; this plan makes seven of
  them reachable and adds none.
- **The roadmap document.** `docs/roadmap/index.md` needs item 1.1 removed, item 1.2 rewritten against
  migration 0002, and item 4.1's two wrong bullets corrected. That is `/add-framework--roadmap`'s job
  and it commits straight to `main`; it is not an F-block here.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Is roadmap item 1.1 done? | Yes | Both "Done when" clauses hold: the GRAPH step reaches a delivery's related docs through the graph (`add.plan.md:166`, `add.new.md:118`), and `/add.hotfix` writes typed `caused_by` into its own about.md (`add.hotfix.md:426`, `fix.md:46`). Delivered by `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp`, layer `product` |
| Does this plan absorb item 1.2? | No | It has no design and the roadmap says its shape is open. Merging would stall this plan on a decision nobody has taken |
| Which item-1 defect survives into this plan? | The INDEX step's two: per-term matching and the two-bucket cut | Both live in `doRead`, one step above the GRAPH step item 4.1 fixes, read by the same skill in the same run |
| Which is fixed first? | Per-term matching (F1) before the cut (F2) | A cut only bites when `MATCHED > LIMIT`; today a multi-term query yields 0, so fixing the cut first fixes nothing observable |
| Does a dead entry need to clear a score floor? | **No — departs from umbrella decision 18** | That decision assumed a ranked engine. `doRead` matched binary and after F1 scores by term hits; a dead entry that matched the same terms is as qualified as a live one. A floor would be a second threshold with no evidence behind it, and umbrella decision 20 forbids undeclared thresholds |
| Where does question-to-call resolution live for the docs corpus? | A section inside `add-knowledge-discovery` | The six commands run this skill's procedure rather than querying directly, so a separate skill adds a load hop with no new reader, and the product layer pays that cost on every user run |
| Why is gitnexus a second owner? | Two corpora, two reach profiles | The docs corpus always ships; gitnexus is a plugin the user installs, disabled by default. One owner would make the optional half unavoidable reading |
| Are the six gitnexus command fragments in scope? | No | Verified 2026-09-14: none contains a `gitnexus-` native skill name. All nine agent fragments do. Roadmap 4.1's "6 command fragments and 9 agent fragments" is wrong |
| Do `add.done`'s two `--action=` calls change? | No | `reindex` and `stats` are operations with exactly one call each, not questions with several candidate answers |
| Is item 4.1's "Done when" grep usable as the plan's assertion? | No | `grep -rn "action=\|Command-intent resolution" framwork/.codeadd/` also matches `qa-evidence.sh:329`, `:340` and JSX in `add-stripe/` and `add-ux-design/`. L3.1, L3.4, L3.5 and L3.6 below state the real end-state instead |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A multi-term query returns the entries it should | `MATCHED` changes meaning: it counts entries hitting at least one term, so a loose query now matches more than it did |
| `gone` entries survive the cut, so "we tried this and dropped it" reaches the reader | Two output keys replace one, and three consumers of `delivered.sh read` must be checked against the new keys |
| Seven MCP actions become reachable from the product layer | The GRAPH step grows an eleven-row table where it carried two commands |
| A gitnexus intent that does not match its command's pin reaches the right native skill | Nine agent fragments change, each injected into a different agent |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Replacing a fixed call with a question makes the agent call nothing | High | F4 carries the gate on a filled `RELATED_WORK` and F5 keeps one in each of the six commands; L3.1 asserts every command's GRAPH step names both a question and a gate |
| "Empty answer" and "no route" collapse into one outcome, so a configuration gap reads as a finding | Medium | F4 states them as two distinct outcomes with the `NOT VERIFIED` label on the second; L3.2 asserts both appear |
| Per-term matching makes a loose query match nearly everything | Medium | F1 sorts by score, so the best-matching entries occupy the five live slots; L1.3 asserts a 3-term query ranks a 3-hit entry above a 1-hit entry |
| The two-bucket keys reach only some readers of `doRead`'s output | Medium | There are exactly two: `add-knowledge-discovery/SKILL.md` (F4) and `add.hotfix.md:190` (F5). F3 documents the change; L2.3 asserts both name the new keys and that no third reader exists |
| Rewriting nine agent fragments loses a fragment's agent-specific framing | Medium | F8 names what each must not lose; L2.4 asserts each fragment keeps its markers, its `uses:` block and its scoping words |
| `--limit N` silently means something narrower than before | Low | F2 keeps the flag setting the live cap and the script header records it; L1.5 asserts `--limit 1` returns 1 live and still up to 2 dead |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/scripts/delivered.sh` | product | modify | Per-term matching and scoring (F1); two-bucket cut and new output keys (F2) |
| `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md` | product | modify | The read contract describes what the script does (F3) |
| `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md` | product | modify | GRAPH step gains the question→action table; INDEX step gains the new keys (F4) |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | States its question, gates on a filled answer (F5) |
| `framwork/.codeadd/commands/add.new.md` | product | modify | Same (F5) |
| `framwork/.codeadd/commands/add.hotfix.md` | product | modify | Same, plus the per-bucket counts at its direct `delivered.sh read` call `:190` (F5) |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | Same (F5) |
| `framwork/.codeadd/commands/add.diagnose.md` | product | modify | Same (F5) |
| `framwork/.codeadd/commands/add.review.md` | product | modify | Same (F5) |
| `framwork/.codeadd/commands/add.done.md` | product | modify | One line recording why an operation names its call (F6) |
| `framwork/.codeadd/plugins/gitnexus/skills/add-gitnexus/SKILL.md` | product | modify | Command-intent pins removed (F7) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/architecture-agent.md` | product | modify | Pin removed, question stated (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/backend-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/database-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/discovery-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/frontend-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/reviewer-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/system-design-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/ux-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/ux-flow-agent.md` | product | modify | Same (F8) |
| `framwork/.codeadd/scripts/tests/delivered.bats` | product | modify | RED-first coverage for F1 and F2 (F9) |
| `cli/tests/delivery-index.test.js` | product | modify | New output keys (F10) |
| `cli/tests/` (new suite) | product | create | End-state assertions for T2 and T3 (F10) |
| `conformance-agent`, `add-feature-discovery` | product | **no change** | Both load `add-knowledge-discovery` and use only its wiki half — `conformance-agent.md:33` reads the hub and selects pages, `add-feature-discovery/SKILL.md:127` receives page paths. Neither names the INDEX step, the GRAPH step, an output key or an MCP action, so the rewrite does not reach them. Verified, not assumed |

No artefact is created, renamed or removed except the one new cli suite, so no
`provider-map.json` registration changes and no rename sweep is owed.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

This change touches no feature or plugin injection ANCHOR — F8 edits fragment bodies inside existing
`<!-- section:graph -->` markers and adds, removes or renames no section. L2.5 asserts the injection
map is byte-identical, which is the end-state map this plan owes.

### L1 — `delivered.bats`, over a fixture index (RED → GREEN)

1. A two-term query whose terms appear in the entry in the **opposite order** matches it.
   *RED today: `hay.indexOf(q)` tests one contiguous substring (`delivered.sh:371`) — measured
   `read "graph knowledge"` → `MATCHED=0` against the real index on 2026-09-14.*
2. A two-term query whose terms appear in **different fields** (`name` and `words`) matches.
   *RED today: same cause — measured `read "hotfix relations"` → `MATCHED=0`.*
3. Given a 3-term query, an entry hitting all three sorts above an entry hitting one, **within the
   same status rank**. *RED today: no score exists; ties break on `ts` (`delivered.sh:393`).*
4. With 12 `live` and 3 `gone` entries all matching, the read returns **5 live and 2 dead**, and emits
   `MATCHED_LIVE=12 MATCHED_DEAD=3 RETURNED_LIVE=5 RETURNED_DEAD=2`.
   *RED today: `slice(0, 10)` returns 10 live and 0 dead, and emits `MATCHED`/`RETURNED`.*
5. With 12 `live` and 3 `gone` matching and `--limit 1`, the read returns **1 live and 2 dead**.
   *RED today: returns 1 live and 0 dead.*
6. With 12 `live` and **0** dead matching, the read returns **5 live** — the two dead slots are not
   backfilled. *RED today: returns 10 live.*
7. An entry matching **zero** query terms does not appear in either bucket.
8. `--no-verify` opens no source file, and `--layer product` still excludes internal entries — both
   under the new cut. *Regression guard, GREEN today.*
9. `items[].at` still does not match: a query for a path present only in `at` returns
   `MATCHED_LIVE=0 MATCHED_DEAD=0`. *Regression guard, GREEN today.*

### L2 — `cli/tests/`, over the built tree

1. `delivered.sh`'s header usage block names the two caps and the scoring rule.
2. `delivery-index.md` states per-term matching and the two-bucket cut, and contains no sentence
   promising dead entries are never filtered without naming the dead cap. *RED today: `:178` promises
   exactly that.*
3. Both readers of `doRead`'s output — `add-knowledge-discovery/SKILL.md` (F4) and `add.hotfix.md`
   (F5) — reference `MATCHED_LIVE`/`MATCHED_DEAD`/`RETURNED_LIVE`/`RETURNED_DEAD`, and no third
   reader exists: `delivered.sh read` is invoked from exactly those two files across
   `framwork/.codeadd/`. *RED today: neither names any output key, and `MATCHED`/`RETURNED` appear in
   no product artefact.* ⛔ `add.done.md` is NOT asserted here — it calls `delivered.sh verify`
   (`:711`) and `write` (`:737`) and never `read`, so it has no output key to carry.
4. Each of the nine gitnexus agent fragments keeps its `<!-- section:graph -->` open and close markers,
   its `<!-- uses: -->` block naming `add-gitnexus`, and — for `frontend-agent`, `ux-agent`,
   `ux-flow-agent` — the word `frontend-scoped`.
5. `injection-points.json` for the `gitnexus` plugin is **byte-identical** to the pre-change build:
   same anchors, same section names, same target resources, same count. *GREEN today and must stay so
   — F8 changes fragment bodies only.*
6. `node scripts/build.js` exits 0 with no new warning, and `lintResourcePaths()` reports no new
   finding.

### L3 — Behavioural acceptance, over the built tree

1. Each of the six commands loading `add-knowledge-discovery` names, at its GRAPH step, **a question
   it must answer** and **a gate on a filled answer**, and names no MCP action. *RED today: the six
   inherit two pinned actions from the skill.*
2. `add-knowledge-discovery`'s GRAPH step states **an empty answer** and **no route** as two distinct
   outcomes, and carries the `NOT VERIFIED` label on the second. *RED today: the step has one no-op
   branch covering both.*
3. `add-knowledge-discovery`'s GRAPH step resolves **all eleven** actions in `mcp/engine.mjs:91-102`,
   asserted by reading the action list from the engine rather than from a hardcoded copy. *RED today:
   two.*
4. `add-gitnexus/SKILL.md` contains **no section mapping a codeadd command name to a native skill**,
   and still contains the `## Intent → native skill` table and the unindexed-graph fallback sentence.
   *RED today: `:47`.*
5. No gitnexus **agent** fragment names a `gitnexus-*` native skill. The six **command** fragments are
   unchanged, asserted byte-for-byte. *RED today: nine agent fragments name one.*
6. `add.done.md` still calls `--action=reindex` and `--action=stats`, and carries the line saying why.
   *RED today: the calls are there, the line is not.* This level exists so a build reading L3.5 does
   not generalise the rule to operations.

**RED expectations against the current tree:** L1.1–L1.7, L2.2, L2.3, L3.1–L3.6 all fail today.
L1.8, L1.9, L2.5 pass today and are regression guards.
**GREEN = all levels pass after F1–F10.**

---

## Execution Order

```
F9 ─┐ (RED suites first)
F10─┘
     └─> F1 ──> F2 ──> F3        [T1]
                  └──> F4 ──> F5 ──> F6   [T2]
                       F7 ──> F8          [T3]
```

- **F9 and F10 first** because RED-first is the discipline: the suites must fail against the current
  tree before any fix lands.
- **F1 before F2** because the cut is scored on what F1 produces, and because a cut has nothing to bite
  on while a multi-term query returns zero.
- **F2 before F3** because a contract documents what the script does, never what it is about to do.
- **F2 before F4** because the skill's INDEX step quotes the output keys F2 emits.
- **F4 before F5** because each command points at the table F4 writes.
- **F7 before F8** because each fragment points at the skill F7 rewrites.
- **F6 is independent** of T1 and T3 and may land any time after **F5**, which is what the diagram shows. Not after F4: the "After F6" boundary below claims T2 is complete, and that is false while F5 is pending.
- **T3 (F7, F8) is independent of T1 and T2** and may interleave.

**Working-state boundaries** — the repo is consistent and the build passes at each of these:

- After **F3**: T1 complete. The script, its tests and its contract agree. T2 and T3 untouched.
- After **F6**: T2 complete. The docs-corpus half asks by question.
- After **F8**: T3 complete, and the whole plan.

A build that must stop should stop on one of those three, never between F1 and F3 (the contract would
describe a script that no longer behaves that way) and never between F7 and F8 (nine fragments would
point at a section that no longer exists).

**Per-F-block validation beyond the layer default:** F1, F2 and F9 run `npm run test:scripts`. With the
Docker daemon up it uses the container runner and takes about a minute; the 75 minutes quoted from
memory is the native Windows path, which only applies with no daemon. `npm run test:scripts -- <file>`
runs one file. Clear `NODE_OPTIONS` first: an injected debugger writes its banner onto stdout
ahead of the script's `KEY=VALUE` output and the parse reads as a failed query.

## Reviewer Handoff

The review command must be able to audit this without re-reading the design doc. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the section above it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves
   nothing. L1.1–L1.7 and L3.1–L3.6 must each have a recorded RED run against the pre-change tree.
2. **F5 rewritten into a restatement of F4.** The risk is six commands each growing their own copy of
   the eleven-row table. Each command should name ONE question and point; a command carrying an action
   name or a verb list has re-pinned what F4 unpinned.
3. **F8 losing a fragment's agent-specific framing** while removing its pin. The nine fragments read
   alike and are not interchangeable; L2.4 checks three of the distinguishing words and a reviewer
   should read the other six diffs by eye.
4. **A `RELATED_WORK` destination sentence dropped in F5.** Eight exist across the six commands and
   every one of them is load-bearing — `add-knowledge-discovery` states that none may leave
   `RELATED_WORK` unused.
5. **The two-bucket keys reaching only one of the two readers.** L2.3 names `add-knowledge-discovery`
   and `add.hotfix.md:190`. `add.done.md` is deliberately excluded — it calls `verify` and `write`, not
   `read`. A reviewer should confirm no third reader appeared, and should NOT read `add.done.md`'s
   absence as an omission.

## References

- Design set: `docs/brainstorming/2026-09-12T075635-delivered-work-relationships-000-umbrella.md`
  (decisions 17–21 only; its `rel` and `.js`-engine shape were superseded in flight)
- Prior art — the pattern this plan ports across the layer boundary:
  `2026-09-13T212629-PLAN--graph-question-first-and-plain-voice` (internal) established
  `.claude/skills/add-artefact-graph/SKILL.md` as the single owner of question-to-verb resolution, the
  `NOT VERIFIED` label, and the split between an empty answer and a missing route
- Prior art — what delivered roadmap item 1.1 and made it unnecessary here:
  `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` (product) established typed `## Relations`, the
  closed vocabulary, the docs corpus and `mcp/engine.mjs`'s eleven actions
- Roadmap items this plan closes: 4.1 in full; item 1's surviving defect. `docs/roadmap/index.md`
  needs a separate `/add-framework--roadmap` run — 1.1 removed, 1.2 rewritten against
  `cli/src/migrations.js` migration 0002, and 4.1's fragment-count and grep bullets corrected

---

## Next Steps

/add-framework--build product-knowledge-discovery-answers-the-question

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-14 | Initial creation |
| 2026-09-14 | Implemented. Corrections the build found: the bats cost is ~1 min with Docker up, not 75; `add.done` and `add-doc-schemas` have 11 and 23 dependants, not 10 and 22 — the plan's numbers came from a stale gitignored `artefact-graph.json` in the main checkout; the Impact table gains the row ruling 11 promised |
| 2026-09-14 | Review fixes: `add.done.md` dropped from the `delivered.sh read` consumer set (it calls `verify` and `write` only) — Current State, the risk row, L2.3 and Reviewer Handoff gap 5 corrected; F5 gains `add.hotfix.md:190`'s per-bucket counts and a second `Consumes`; F2 gains the `delivered.sh:387` inline-comment correction; F6's ordering freedom moved from "after F4" to "after F5" to match the working-state boundary; the item-4.1 grep row now cites L3.1/L3.4/L3.5/L3.6 instead of L2 |
