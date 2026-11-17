# Plan: docs-search-precision (0080F) — the delivery-index `read` and the MCP `search` rank by whole-word BM25 and return a small, scored, relevance-cut list

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-11-16
> **Delivery:** confirm
> **Backlog ID:** 0080F · **Release:** v1.10.0 · **Card:** https://app.notion.com/p/41ae0000aeae815897e9f85deb43a596

---

## Objective

[from the card body — the intent file has no design document; copied verbatim, translated only in
the line below]

> O agente acha a entrega certa entre os primeiros resultados, em pt-BR ou em inglês, com uma resposta
> pequena, ordenada pela relevância e com a pontuação visível. A resposta fica pequena porque só os
> melhores resultados vêm, nunca porque o texto foi cortado no meio.

(The agent finds the right delivery among the first results, in pt-BR or English, with a small
response, ordered by relevance and with the score visible. The response is small because only the
best results come back, never because text was cut in the middle.)

**When this build is done:** `delivered.cjs read` and the MCP `search` tool (both corpora) share one
ranking algorithm — whole-word or word-prefix matching with pt+en stopwords dropped, BM25 scoring,
a score normalised to the first hit, a ~200-character snippet of the matched field, a relevance cut
and a ~2,000-token budget that drops whole rows only. Each search row is lean (id, kind, status,
title, score, snippet, path); the full record comes from a `get` by id that has its own size limit
and says when it trimmed. A supersession chain returns one row. A 20-query bilingual suite in CI
proves the improvement against a recorded "before" baseline. No delivery-index `origin` still points
at the pre-`.codeadd/` `docs/...` path.

## Context

On this repository's own index, `read "delivery index read search rank mcp"` ranks a board-palette
delivery first and reports `MATCHED_LIVE=35`. `read "economia de tokens"` prints 13,217 bytes. Matching
is per-term substring (`delivery-index-core.cjs` `performRead`, and `mcp/engine.mjs` `scoreNode`), so
`de` hits almost every entry; each row ships its full `commits` and `items`; nothing says how well a
row matched.

**Every decision here was taken in the card. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `.codeadd/docs/brainstorming/docs-search-precision-intent.md` (the card body; also `/home/codeaddiction/terminals/intents/docs-search-precision-intent.md`) | Problem, objective, done-criteria, decisions 1–13, `Em aberto: Nenhum` |

The intent file carries no `path:` and no `delivery:` frontmatter. Per `add-plan-authoring`, that means
the full plan shape and `Delivery: confirm`.

## Global Constraints

- Match on a whole word or a word prefix, never on a loose fragment; terms under 3 letters and pt/en stopwords are ignored (card, Decision 1)
- BM25 in plain JS, no new dependency, for both `read` and the MCP `search` (card, Decision 2)
- Every row carries a score normalised 0–1 against the 1st, and a ~200-character snippet of the matched field (card, Decision 3)
- Default 5 results, max 20; relevance cut on a sharp drop or below ~30% of the 1st; ~2,000-token budget that drops whole results from the end and never cuts a result or the JSON mid-way; the response says how many matched, how many returned, why it stopped, with `offset` (card, Decision 4 and 10)
- The search returns id, kind, status, title, score, snippet, path; commits and full items only in `get` by id, which has a size limit and says when it cut (card, Decision 5)
- One row per supersession chain; the old version appears as `superseded→ID`, never as a repeated result (card, Decision 6)
- No concise/detailed parameter; no MMR; no embeddings, vector store, LLM re-rank, GraphRAG or time decay (card, Decisions 11–12 and "Fora do escopo")
- `mcp/` takes no dependency at all and stays `.mjs` (AGENTS.md, Product Layer — `mcp/`)
- Bug fixes and new tested behaviour are written strict TDD: the test is written first and seen RED against the tree before the change, then GREEN (operator rule for this plan)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **Fragment matching floods the result.** `de`, `da`, `para` are substrings of nearly every entry; in 5 of 8 real queries every one of the 85 live entries came back.
2. **No term weighting.** A common term counts the same as a rare one, so "economia de tokens" put the wrong delivery first.
3. **Oversized rows.** Each read is 10–13 KB (~3k tokens), mostly commit lists — the discovery step pays for detail it does not read.
4. **No confidence signal.** No score, no snippet: the agent cannot tell a strong match from a weak one.
5. **Legacy paths.** 143 index lines still carry `origin: "docs/..."`, a path the docs-branch move retired.

## Proposal

One ranking algorithm, written twice — a CommonJS core beside the delivery reader and an ESM module
in `mcp/` — with one parity test feeding both the same inputs. That is the repository's established
pattern for its two query surfaces (AGENTS.md: "asserted identical rather than sharing code"), and it
keeps `mcp/` free of a runtime dependency on an installed script for a verb (`search`) that works on
the artefact corpus without one today.

Sequencing: build the ranking core and its twin first; move graph `history` off `performRead` before
`performRead` changes shape (history needs full records and the status-bucket contract, and it is
an exact-node question, not a text search); then rewrite `read`, add `get`, rewrite the MCP `search`
and bound the MCP `get`; then repair `origin`; then the documents that teach agents the new output.

## Current State

| Artefact | Today | Depth-1 dependants (graph) |
|---|---|---|
| `framwork/.codeadd/scripts/delivered.cjs` | `read` prints six bucket keys + full JSONL records | `add-done`, `add-hotfix`, `add--knowledge-discovery` — 3 → **HIGH** |
| `framwork/.codeadd/scripts/delivery-index-core.cjs` | `performRead`: substring per term, score = distinct terms hit, status-first sort, 5 live + 2 dead buckets | 0 in the graph → LOW (the graph does not model `require`; real readers: `delivered.cjs`, `scripts/graph.js`, `mcp/engine.mjs`) |
| `mcp/engine.mjs` | `search`: weighted substring `scoreNode`, fat hits (relations, tags, attachments); `history` calls `performRead` | NOT VERIFIED — `mcp/` is not a graph node (not registered in `provider-map.json`); readers are the two MCP servers and every skill that queries them |
| `scripts/graph.js` | `history` calls `performRead` with the bare name | not a graph node — NOT VERIFIED; consumers: `add-artefact-graph`, the internal plan stage |
| `add--knowledge-discovery` | Step 1 teaches the six bucket keys; Step 2 says hits carry the TL;DR first sentence and typed relations | 8 → **HIGH** |
| `add--doc-schemas` (+ `references/delivery-index.md`) | Reading rules 3–6 define substring matching and buckets | 27 → **HIGH** |
| `add-hotfix` | Reads `MATCHED_LIVE`/`MATCHED_DEAD`/`RETURNED_*` | 11 → **HIGH** |
| `workbench/skills/add-artefact-graph` | `get` row describes the full node | 12 → **HIGH** |

Delivery index, filtered per layer: no `gone` or `superseded` entry for a ranked search. Prior art that
shipped and is live: `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` (the MCP over two corpora),
`2026-09-14T215936-PLAN--the-document-model-the-mcp-reads`, `2026-09-07T162415-SELF-PLAN--delivery-index-internal`
(graph `history`). Superseded: `2026-09-14T102848-PLAN--product-knowledge-discovery-answers-the-question`.

`AGENTS.md` changes only through the generated inventory (one new script, F1). No hand edit.

## Scope

### Includes

**Layer tags follow the artefact, and each test file follows the rules of the layer whose file it
tests.** Product F-blocks write `scripts/tests/*.test.cjs` (the native suite for product scripts) and F1
regenerates the `AGENTS.md` inventory with `node scripts/inventory.js`; internal F4 edits
`cli/tests/graph-query.test.js`. Those are internal/product paths inside the other tag on purpose —
the Impact table records the real layer of every file.

#### T1 — The ranking algorithm (Decisions 1–4, 10)

- **F1** [product] — `framwork/.codeadd/scripts/search-rank-core.cjs` (new, side-effect free) + `scripts/tests/search-rank-core.test.cjs` (new): tokenizer (lowercase, diacritics folded via NFD so `relevância` meets `relevancia`, split on non-alphanumerics so `add-framework--done` → `add framework done`), the pt+en stopword list, `MIN_TERM_LEN=3`; field-weighted BM25 (`k1=1.2`, `b=0.75`) where a query term matches a document token that equals it or starts with it (`auth` still reaches `authgooglehandler`, which is what reading rule 3 kept substring for); normalisation to the first row; snippet of ~200 chars from the highest-weight field holding a match, cut on word boundaries; the cut (`DEFAULT_LIMIT=5`, `MAX_LIMIT=20`, `FLOOR=0.30` of the 1st, `DROP_RATIO=0.5` against the previous row, both checked from the second row of a page so `offset` always advances); the budget (`BUDGET_TOKENS=2000`, `CHARS_PER_TOKEN=4`, whole rows dropped from the end, at least one row always kept); the chain collapse over a `superseded_by` map. Every constant is a named, exported tunable. A query whose every term is dropped matches NOTHING (`STOP=no-terms`) — never everything.
  - **TDD:** each behaviour above is a named failing test first (module absent = RED), then GREEN.
  - **Produces:** `search-rank-core.cjs` exports `tokenize`, `rank`, `cut`, `snippet`, `collapseChains` and the tunables; `STOP` reasons `drop|floor|limit|budget|end|no-terms`
  - Then `node scripts/inventory.js` regenerates the AGENTS.md inventory (new script).
- **F2** [product] — `mcp/rank.mjs` (new, ESM, no dependency) + `cli/tests/search-rank-parity.test.js` (new): the same algorithm and tunables in ESM. The parity test imports both and asserts, over a shared table of inputs (pt and en, hyphenated ids, diacritics, stopword-only, ties, budget overflow, chains), identical tokens, scores within 1e-9, orderings, cut positions and `STOP` reasons.
  - **TDD:** the parity test is written first and fails on the missing module.
  - **Consumes:** `search-rank-core.cjs` exports `tokenize`, `rank`, `cut`, `snippet`, `collapseChains` and the tunables (F1)
  - **Produces:** `mcp/rank.mjs` exports the same names

#### T2 — Graph `history` leaves the text search (prerequisite)

- **F3** [product] — `delivery-index-core.cjs`: add `performHistoryRead(ctx, {node, layer, limit})` — entries whose `node` equals the full node id or any item's `node` does, then today's verification, status-first order, live/dead buckets and six keys, unchanged. It must NOT go through the text ranker: history asks about one artefact, and a relevance cut could drop the very entry carrying the node. Tests in `scripts/tests/delivered.test.cjs`.
  - **TDD:** a test proving an entry carrying the node but no matching text is returned is RED today (the bare-name text prefilter is what reaches it now), then GREEN.
  - **Produces:** `performHistoryRead`
- **F4** [internal] — `scripts/graph.js` `history`: call `performHistoryRead` with the full node id; `deliveryIndex()`'s required-method list (line ~262) gains `performHistoryRead`; the `carriesNode` post-filter, the keys and the rendering stay. `cli/tests/graph-query.test.js` changes only where it asserts which core method is called.
  - **Consumes:** `performHistoryRead` (F3)
- **F5** [product] — `mcp/engine.mjs` `history`: the same switch; `loadDeliveryCore`'s required-method list gains `performHistoryRead`. In `cli/tests/mcp-engine.test.js`, the test "native history overrides select the same implementation in graph and MCP" builds an alternate reader that overrides `performRead`; after F4/F5 that override is bypassed and the test goes RED. Its override moves to `performHistoryRead`. This is a moved assertion, not a removed test, so it needs no `Test-Removed:` trailer. Every other graph↔MCP history parity assertion stays green.
  - **Consumes:** `performHistoryRead` (F3)

#### T3 — The delivery-index `read` and `get` (Decisions 3–7, 10, 13)

- **F6** [product] — `delivery-index-core.cjs` `performRead` rewritten over `search-rank-core.cjs`; new `performGet`; `delivered.cjs` argv and output; the eval suite.
  - `read <query> [--layer] [--limit N≤20] [--offset N] [--no-verify]`: `--limit` above 20 or a non-whole `--offset` is a usage error, exit 2. Fields searched and weights: `id` 3, `name` 3, `words` 2, `node` 2, `items[].what` 1, `items[].find` 1 — never `items[].at`. Order: score, then today's status rank, then recency, then id. Verification runs on the RETURNED rows only, after the cut. Output keys `MATCHED=`, `COLLAPSED=`, `RETURNED=`, `OFFSET=`, `NEXT_OFFSET=` (empty when none), `STOP=`, `SKIPPED_LINES=`, then one JSON row each: `id`, `kind:"delivery"`, `layer`, `status`, `superseded_by` (only when superseded), `replaces` (ids collapsed into this row), `title` (= `name`), `score`, `snippet`, `path` (= `origin`). The six bucket keys and the full records leave `read`.
  - `get <id> [--no-verify]`: `FOUND=0|1`, the full latest record as one JSON line, bounded at 4,000 tokens by dropping `commits` then `items` from the tail, with `TRUNCATED=commits:N,items:M` when it did. The JSON line always parses.
  - Eval suite (Decisions 7, 13): `cli/tests/evals/search-precision/delivered.jsonl` — a versioned snapshot of the index at `/home/codeaddiction/projects/code-addiction/.codeadd/docs/delivered.jsonl` (the `codeadd-docs` worktree; a feature worktree's `.codeadd/docs/` holds no index), live entries plus the superseded chains — and `queries.json`, 20 discovery questions, 10 pt-BR and 10 English, each with its expected id; `cli/tests/search-precision.test.js` runs them through `delivered.cjs read` against that fixture. Placed under `cli/tests/evals/` so a later command-evals card shares the directory (the card's "junto do command-evals"; no command-evals exists in the tree yet).
  - **Who writes what, and when (anti-over-fit):** the build agent writes the 20 queries from the questions discovery steps actually ask — phrased the way `/add-plan`, `/add-hotfix`, `/add-diagnose` and `/add-review` ask "did we do something like this?" / "did this break before?" — and fixes each expected id by reading the entry. It also adds pt-BR terms to the fixture entries' `words`, as Decision 8 now requires of new entries. **Queries, expected ids and fixture `words` are committed BEFORE any ranking code exists, and are not edited afterwards** except by a ledger ruling that names the query and why. The "Does NOT Include" line about rewriting `words` covers the live index only, never this fixture.
  - **TDD / Decision 7:** write the suite and the `read`/`get` tests first. The new-key assertions are RED against the F5 tree by construction. The "before" baseline is a separate measurement: a small harness in the same test file, skipped in CI, that runs the OLD `read` over the 20 queries and records top-3 hits out of 20, bytes per query, and which stopword queries return everything. Its numbers go into the ledger. Then implement to GREEN and record the "after" numbers beside them.
  - **Consumes:** `search-rank-core.cjs` exports `tokenize`, `rank`, `cut`, `snippet`, `collapseChains` and the tunables (F1)
  - **Produces:** `read` keys `MATCHED`, `COLLAPSED`, `RETURNED`, `OFFSET`, `NEXT_OFFSET`, `STOP` and the lean row shape; `get` with `FOUND` and `TRUNCATED`

#### T4 — The MCP `search` and `get` (Decisions 2–6, 11)

- **F7** [product] — `mcp/engine.mjs`, `mcp/server.mjs`, `mcp/reference.md`: `search` ranks with `mcp/rank.mjs` using today's field weights as BM25 field weights (id 8, slug 6, name 6, tags 5, area 4, summary 3, tldr 2, observations 1); `kind`/`status`/`tag` filters still narrow before ranking; `limit` default 5, max 20, new `offset`; the result is `{matched, collapsed, returned, offset, next_offset, stop, hits}` and each hit `{id, kind, status, superseded_by?, replaces?, title, score, snippet, path}` — `relations`, `tags`, `area`, `attachments` move to `get` only. Chains collapse over the corpus's `superseded_by` edges. Empty `terms` keeps its enumeration meaning (sorted by id, no score, no relevance cut, budget still applies); a non-empty `terms` whose words are all dropped returns zero hits with `stop:"no-terms"`. `get` is bounded at 4,000 tokens by dropping `observations`, then `files`, then `inbound` from the tail (`inbound` is last because a hub page can have many inbound edges but they are the relations the caller came to `get` for), with `truncated: {field: count}`. Tool descriptions and the input schema in `server.mjs` say all of this; `mcp/reference.md` is regenerated by `mcp/generate-reference.mjs`, never hand-edited.
  - **TDD:** in `cli/tests/mcp-engine.test.js` and `cli/tests/mcp-server.test.js`, write first: a stopword-only query returns zero hits; `de` never returns the whole fixture corpus; a rare term outranks a common one; every hit has `score` in [0,1] with the first at 1 and a `snippet` ≤ ~200 chars; a chain returns one hit; a `get` over budget reports `truncated` and parses. All RED today, then GREEN. Existing assertions that read the old fat-hit fields are moved to `get`, never deleted (`scripts/test-loss-guard.cjs` runs; a renamed test carries a `Test-Removed:` trailer).
  - **Consumes:** `mcp/rank.mjs` exports the same names (F2)

#### T5 — No legacy path in the index (Decision 9)

- **F8** [product] — `delivery-index-core.cjs` + `delivered.cjs`: `verify --repair` also rewrites an `origin` starting `docs/` to `.codeadd/docs/...`, appended as a new line like every repair, with `ORIGIN_REPAIRED=<n>` and `ORIGIN_UNRESOLVED=<id>` for a rewritten origin whose target file is absent; `write` refuses an origin starting `docs/` with `REFUSED=origin-legacy-path` (exit 2); `read` and `get` print the current path even for an unrepaired line, so no result surfaces the legacy form. Tests in `scripts/tests/delivered.test.cjs`, RED first.
  - **Produces:** `ORIGIN_REPAIRED`, `ORIGIN_UNRESOLVED`, `REFUSED=origin-legacy-path`
  - After F8 the build runs the branch's `framwork/.codeadd/scripts/delivered.cjs verify --repair` with its working directory at the docs worktree `/home/codeaddiction/projects/code-addiction/.codeadd/docs` (branch `codeadd-docs`; the feature worktree's `.codeadd/docs/` has no index) and leaves the appended lines uncommitted there; `/add-framework--done` STEP 6 commits them with this delivery's entry. The build reports `ORIGIN_REPAIRED` and every `ORIGIN_UNRESOLVED` (7 expected — early `docs/plans/` origins with no archived copy).

#### T6 — Documents that teach the new output (Decisions 5, 8)

- **F9** [product] — `framwork/.codeadd/skills/add--doc-schemas/references/delivery-index.md`: reading rules 3–6 replaced (tokenizer, BM25, order, cut, budget, collapse, keys) with every tunable listed as declared; `words` row: written in English AND the team's language (the language the project's docs are written in); `get` mode; `REFUSED=origin-legacy-path`; the origin repair. `add--doc-schemas/SKILL.md` line describing "first sentence with every hit" now says a snippet of the matched field. `cli/tests/doc-schema-coverage.test.js` or the nearest existing doc test asserts the new keys are named and the six bucket keys are not, RED first.
  - **Consumes:** `read` keys `MATCHED`, `COLLAPSED`, `RETURNED`, `OFFSET`, `NEXT_OFFSET`, `STOP` and the lean row shape; `get` with `FOUND` and `TRUNCATED` (F6)
  - **Consumes:** `ORIGIN_REPAIRED`, `ORIGIN_UNRESOLVED`, `REFUSED=origin-legacy-path` (F8)
- **F10** [product] — `framwork/.codeadd/skills/add--knowledge-discovery/SKILL.md`: Step 1 reads the new keys and `score`; re-run the read once in the other language (English ↔ the team's) only when the result is weak — `RETURNED=0`, or no returned snippet names the task's subject; fetch the detail with `delivered.cjs get <id>`. Step 2: hits carry a snippet, not the TL;DR's first sentence; typed relations come from `get` on a surviving hit. `framwork/.codeadd/commands/add-hotfix.md`: the paragraph reading the bucket keys reads `MATCHED`/`RETURNED`/`STOP`. `cli/tests/knowledge-discovery-question-first.test.js` updated RED first.
  - **Consumes:** `read` keys `MATCHED`, `COLLAPSED`, `RETURNED`, `OFFSET`, `NEXT_OFFSET`, `STOP` and the lean row shape; `get` with `FOUND` and `TRUNCATED` (F6)
- **F11** [internal] — `workbench/skills/add-artefact-graph/SKILL.md`: the `search` description says hits are lean and scored, `get` carries relations/tags/attachments and may report `truncated`. Rebuild with `node scripts/build-workbench.js`.

### Does NOT Include (important!)

- Embeddings, vector store, LLM re-ranking, GraphRAG, time decay (card, "Fora do escopo")
- Ordering by validity — card search-validity-rank. This plan keeps status as a tie-break only, in one ordering function that card can replace
- GitNexus integration — card gitnexus-integration
- A concise/detailed switch (Decision 11) and MMR diversity (Decision 12)
- Changing graph `history`'s output contract — F3–F5 only move its source of entries
- Rewriting `words` on existing index entries; Decision 8 binds new entries (the eval fixture is the only bilingual corpus this plan writes)
- `scripts/graph.js` gaining a `search` verb — it has none today
- Web docs / README — `add-framework--sync` before release

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| One shared module or two implementations? | Two (`search-rank-core.cjs`, `mcp/rank.mjs`) plus a parity test | AGENTS.md: the two query surfaces are "asserted identical rather than sharing code"; `mcp/` has no dependency and serves the artefact corpus without the delivery script |
| Example in the card shows a superseded row beside its successor; Decision 6 forbids that | Decision 6 wins: one row per chain. If the head matched, the row is the head with `replaces`; if only an older member matched, that member is the row with `status:"superseded"` and `superseded_by` (rendered `superseded→ID`) | The example is labelled "dado fictício"; the decision is the rule |
| What happens to the live/dead buckets in `read`? | Gone from `read`; relevance decides, status breaks ties. They stay in `history` (F3) | Card Decisions 4/6 define the size control; the buckets existed because a status-first sort pushed dead entries past the cut — relevance ordering removes that cause. Validity ordering is search-validity-rank's |
| `get` for the delivery index — "already exists"? | The MCP `get` exists; `delivered.cjs` gains a `get <id>` mode | Decision 5 moves commits/items out of `read`; without a `get` there is no route to them |
| Where does the eval suite live? | `cli/tests/evals/search-precision/` + `cli/tests/search-precision.test.js` | Decision 13 says beside command-evals over a versioned corpus; no command-evals exists yet, `evals/` is the shared home |
| Weak result for the language retry | `RETURNED=0`, or no returned snippet names the subject | Decision 8 says "only when weak"; both checks need no new key |
| Paging past a relevance cut | `offset` continues the ranked list; the cut rules apply from a page's second row | The card's example offers `offset=3` after `corte: queda de relevância` |
| Budget estimate | 4 characters per token, over the emitted rows | Plain JS, no tokenizer dependency (Decision 2) |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Results ranked by meaning-bearing terms, ~2k tokens | `read` no longer returns full records; one extra `get` call when detail is needed |
| `de`/`para` stop matching | A two-letter domain term (`qa`, `ui`) is ignored in a query; `qa-setup` is still found through `setup` and its id |
| Dead entries compete on relevance | No reserved slots for `gone`; a weakly relevant `gone` entry can fall below the cut |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| `performRead` shape change silently breaks graph/MCP `history` | High if unordered | F3–F5 land before F6; existing history parity tests stay green at F5 |
| The two implementations drift | Medium | F2 parity test over a shared input table; F7 consumes only `mcp/rank.mjs` |
| A test fixture that copies the delivery scripts lacks the new core and fails with `Cannot find module` | Medium | F1 adds `search-rank-core.cjs` to every fixture list that copies `delivery-index-core.cjs` (`impact-question-touched-by.test.js` `SHIPPED`, `knowledge-discovery-question-first.test.js`, `install.e2e.test.js`), and checks `cli/tests/build.test.js` (its stub `delivery-index-core.cjs`, line ~986) and `done.cjs` (which names the core in its header) still pass — F6 runs both suites |
| Eval suite passes by over-fitting tunables to 20 queries | Medium | Queries, expected ids and fixture `words` are committed before ranking code (F6). A tunable from F1 (`FLOOR`, `DROP_RATIO`, `BUDGET_TOKENS`, field weights, `k1`, `b`) may change from the value in this plan ONLY through a ledger ruling that records the before/after suite numbers; the final values are what F9 lists. F1 unit tests pin the behaviours independent of the suite |
| Origin repair rewrites to a path that does not exist | Low | `ORIGIN_UNRESOLVED` reports each one; the prefix is still the current docs root (Decision 9) |
| Agents keep reading the six bucket keys | Medium | F9/F10 rewrite every reader that names them (the grep list in Impact); F9/F10 tests assert the old keys are no longer named |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/search-rank-core.cjs` | product | create | F1 |
| `scripts/tests/search-rank-core.test.cjs` | internal (test of a product script) | create | F1 |
| `AGENTS.md` inventory block | internal | regenerate via `node scripts/inventory.js` | F1 — new script |
| `mcp/rank.mjs` | product | create | F2 |
| `cli/tests/search-rank-parity.test.js` | product | create | F2 |
| `framwork/.codeadd/scripts/delivery-index-core.cjs` | product | modify | F3, F6, F8 |
| `framwork/.codeadd/scripts/delivered.cjs` | product | modify | F6, F8 — usage, header, `get` mode, keys |
| `scripts/tests/delivered.test.cjs`, `scripts/tests/native-script-cases.json` | internal | modify | F3, F6, F8 |
| `scripts/graph.js` | internal | modify | F4 |
| `cli/tests/graph-query.test.js` | product | modify | F4 |
| `mcp/engine.mjs` | product | modify | F5, F7 |
| `mcp/server.mjs`, `mcp/reference.md` (regenerated) | product | modify | F7 |
| `cli/tests/mcp-engine.test.js`, `cli/tests/mcp-server.test.js`, `cli/tests/graph-mcp.test.js` | product | modify | F5, F7 |
| `cli/tests/evals/search-precision/delivered.jsonl`, `queries.json` | product | create | F6 |
| `cli/tests/search-precision.test.js` | product | create | F6 |
| `cli/tests/delivery-index.test.js` | product | modify | F6 |
| `cli/tests/impact-question-touched-by.test.js`, `cli/tests/install.e2e.test.js` | product | modify | F1 risk — fixture copies the new core |
| `framwork/.codeadd/skills/add--doc-schemas/references/delivery-index.md`, `add--doc-schemas/SKILL.md` | product | modify | F9 |
| `framwork/.codeadd/skills/add--knowledge-discovery/SKILL.md` | product | modify | F10 |
| `framwork/.codeadd/commands/add-hotfix.md` | product | modify | F10 |
| `cli/tests/knowledge-discovery-question-first.test.js`, `cli/tests/doc-schema-coverage.test.js` | product | modify | F9, F10 |
| `workbench/skills/add-artefact-graph/SKILL.md` | internal | modify | F11 |
| `.codeadd/docs/delivered.jsonl` (docs worktree) | — | appended by `verify --repair` | F8 run; committed by `/add-framework--done` |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below is written before its F-block's code and seen failing
against the tree, recorded in the ledger, then driven GREEN.

### L1 — Ranking core, both twins (F1, F2)

1. `tokenize("Economia de tokens para o QA")` → `["economia","tokens"]`. *RED: module absent.*
2. `relevância` and `relevancia` produce the same token; `add-framework--done` yields `add`, `framework`, `done`.
3. Prefix matches, fragment does not: `auth` matches `authGoogleHandler`; `ken` does not match `tokens`.
4. On a corpus where `seed` is rare and `qa` / `setup` common, the doc holding `seed` ranks first for `qa seed setup`.
5. Scores: the first row is exactly 1, every row in [0,1], non-increasing.
6. Cut: a row under 0.30, or under half the previous row, stops the page with `STOP=floor` / `STOP=drop`; the first row of a page with `offset>0` is always returned.
7. Budget: a page whose rows exceed 8,000 characters drops whole rows from the end, keeps at least one, `STOP=budget`; every emitted row parses as JSON.
8. Stopword-only query → zero rows, `STOP=no-terms`.
9. Chain `A ←superseded_by— B ←— C`: head matched → one row (head, `replaces:[B,C]`); only `B` matched → one row `B`, `superseded_by` = head.
10. Parity: every case 1–9 returns identical tokens, scores (±1e-9), order, cut and `STOP` from `search-rank-core.cjs` and `mcp/rank.mjs`. *RED: `mcp/rank.mjs` absent.*

### L2 — Delivery reader (F3, F6, F8)

1. `performHistoryRead` returns an entry whose `node` equals the id even when no text field contains the bare name; buckets and six keys unchanged. *RED: function absent.*
2. `read` emits `MATCHED`, `COLLAPSED`, `RETURNED`, `OFFSET`, `NEXT_OFFSET`, `STOP`, `SKIPPED_LINES` and lean rows only — no `commits`, no `items`; `--limit 21` exits 2. *RED: today's six keys and full records.*
3. `get <id>` returns the full record; an oversized fixture record yields `TRUNCATED=` and a parseable line; unknown id → `FOUND=0`, exit 0.
4. `write` with `origin:"docs/x.md"` → `REFUSED=origin-legacy-path`, exit 2; `verify --repair` appends a corrected line and reports `ORIGIN_REPAIRED` / `ORIGIN_UNRESOLVED`; `read` prints `.codeadd/docs/...` for an unrepaired line.

### L3 — MCP surfaces (F5, F7)

1. MCP `history` and `graph.js history` return the same answer for the same node. The existing parity tests stay green after F5, except the alternate-reader override test, whose override moves from `performRead` to `performHistoryRead` (F5) — RED after F4/F5 until moved.
2. `search` over the docs fixture: stopword-only → 0 hits; `de` does not return the whole corpus; hits carry only `id, kind, status, title, score, snippet, path` (+ `superseded_by`/`replaces` when set). *RED: fat hits, substring scoring.*
3. Empty `terms` with `kind: page` still enumerates by id (existing test).
4. `get` past 4,000 tokens carries `truncated` and remains valid JSON.
5. `server.mjs` tool list: `search` declares `offset`, describes score and snippet.

### L4 — Behavioural acceptance: the card's done-criteria (F6)

1. Over the 20-query suite, the expected id is in the top 3 for **≥ 18 of 20**. *RED: recorded "before" count from the F5 tree.*
2. No query containing `de`, `da` or `para` returns every entry of the fixture.
3. Every query's `read` output is ≤ 8,000 characters (~2,000 tokens), and every row parses.
4. Every row carries `score`, `status` and a non-empty `snippet`.

### L5 — Documents (F9, F10, F11)

1. `delivery-index.md`, `add--knowledge-discovery` and `add-hotfix` name `MATCHED`/`RETURNED`/`STOP` and no longer name `MATCHED_LIVE`, `RETURNED_DEAD`, `LIVE_CAP`, `DEAD_CAP` (outside the `history` section). *RED: they name them today.*
2. `delivery-index.md` lists every tunable from F1 with its value.
3. `node scripts/build.js` and `node scripts/build-workbench.js` exit 0 with no new warning; `node scripts/graph.js orphans` reports no new orphan.

**RED expectations against the current tree:** L1 (modules absent), L2.1–L2.4, L3.2, L3.4, L3.5, L4.1–L4.4, L5.1–L5.2 fail today. L3.1 and L3.3 are green today and must stay green.
**GREEN = all levels pass after F1–F11, and `node scripts/run-tests.js all` passes, `scripts/test-loss-guard.cjs` clean.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [internal] → F5 [product] → F6 [product] → F7 [product] → F8 [product] → F9 [product] → F10 [product] → F11 [internal]

- **F1, F2 first** — everything ranks through them.
- **F3–F5 before F6** — `history` must stop reading `performRead` before `performRead` changes shape. After F5 the tree is green and nothing user-visible has changed: a safe stopping point, and the moment the F6 "before" baseline is recorded.
- **F6, F7** — each leaves the tree green on its own.
- **F8** — then run `verify --repair` in the docs worktree (see F8).
- **F9–F11 last** — they describe the output F6/F7 produce.

Per F-block beyond the layer default: F1, F3, F6, F8 run `node scripts/run-tests.js` for the native suite; F2, F4–F7, F9, F10 run the cli suite; F11 runs `node scripts/build-workbench.js`.

## Reviewer Handoff

For each F-block the ledger records: files touched, the RED run (command + failing assertion), the GREEN run, and any ruling.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation was never RED — a test written after the code proves nothing.
2. The "before" numbers for L4 missing from the ledger — Decision 7 requires before AND after.
3. A divergence between `search-rank-core.cjs` and `mcp/rank.mjs` that the parity table does not exercise (a tunable present in one only).
4. Any `read` path that still emits `commits` or `items`, or any surface that cuts a row or the JSON mid-way.
5. A `history` call left on `performRead`.
6. An old-shape assertion deleted rather than moved to `get` without a `Test-Removed:` trailer.

## References

- Card and intent: see Context.
- Prior art: `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` (the MCP), `2026-09-07T162415-SELF-PLAN--delivery-index-internal` (graph `history`), `2026-10-05T152826-PLAN--native-node-framework-scripts` (the CJS core split).
- Anthropic, *Writing effective tools for agents*; Weaviate autocut; ai-memory ARCHITECTURE.md — cited in the card.

---

## Next Steps

/add-framework--build .codeadd/docs/plans/2026-11-16T203957-PLAN--docs-search-precision.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-11-16 | Initial creation |
| 2026-11-16 | Review fix-then-ok: F4 extends `deliveryIndex()`'s method list; F5 moves the alternate-reader override test to `performHistoryRead`; absolute docs-worktree path for the fixture snapshot and the origin repair; query/fixture authorship and freeze before ranking code; tunable-change rule; layer-tag note for test files; F8 Produces / F9 Consumes; `build.test.js` and `done.cjs` in the fixture risk; `.codeadd/docs/` paths |
| 2026-11-16 | Built: implemented in commits a5f9d2ca..HEAD on feat/docs-search-precision; status draft → implemented |
