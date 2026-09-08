# Brainstorm: Query Surface and Internal Consumers

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--self-plan`
> **Date:** 2026-09-07
> **Type:** architecture
> **Set:** `2026-09-07T123919` — **08 of 08**, subtopic 3 of `2026-09-07T123919-delivery-index-05-internal-umbrella.md`
> **Consumes:** the schema, `delivered.sh` from the product `write-verify` subtopic, and the `node` join from `entry-join`

## Discovery

- **`scripts/graph.js`** — the engine. `main(argv)` switches over six verbs: `impact`, `dependencies`, `neighbors`, `path`, `orphans`, `mermaid`, plus `stats`. Pure query; it never writes.
- **`scripts/artefact-graph-mcp.js`** — wraps the same functions as MCP tools over stdio, hand-rolled JSON-RPC. CLAUDE.md's stated reason: *"every provider can shell out, only some have MCP configured, and both call the same module so they cannot drift."*
- **`@framework-discovery-agent`** — `tools: Glob, Read`. **No shell.** It globs `docs/plans/*.md`, scores slugs, deep-reads the top five.
- **Existing dispatch practice** — commands resolve context first and pass results *into* an agent's dispatch payload. `/add.plan` STEP 3 carries "selected page paths + one-line reasons + freshness verdicts forward into STEP 8's subagent bootstrap block."
- **Plan 0075's subject** — several consumers of one structure disagreeing, fixed by migrating them all to one resolution rule.
- **CLAUDE.md's `docs/` policy** — force-adds specific plan sets, for one stated reason: *"a plan whose changelog or review is untracked reads as unimplemented from a fresh clone, which is the failure this policy exists to prevent."*

## Context & Motivation

The index has a writer and a format. Without a reader it is a file nobody opens.

The umbrella settled that the query is a **new verb on `graph.js`, not a new script**, for the reason CLAUDE.md already gives about the MCP wrapper: two engines over one dataset drift. Refining that exposed a second, sharper instance of the same risk that the umbrella did not see.

## Problem / Opportunity

**The drift the umbrella missed.** The product layer reads the index through `delivered.sh read` — shell, shipped to users. If `graph.js history` parses the index independently in JavaScript, there are **two implementations of last-line-wins, corrupt-line tolerance, and status ordering** over one format. That is plan 0075's subject exactly, created fresh, inside the design that cites 0075 as a lesson.

**The agent cannot shell out.** `@framework-discovery-agent` has `Glob, Read` only. It could `Read` the JSONL directly — and that would be a *third* parser, in an agent's head, where last-line-wins is guesswork.

**The policy retirement needs a mechanism, not a reminder.** The umbrella made it a hard ordering rule; something must actually check the trigger.

## Proposed Solution

### 1. `graph.js history` delegates the read; it does not reimplement it

```
node scripts/graph.js history <name>
```

It shells out to `delivered.sh read`, then enriches each returned item that carries a `node` with the graph's own answer — a dependant count, and the id in the form `graph.js impact` will accept.

**Two mechanics that cannot be left to a builder's guess:**

- **The invocation is `bash <path-to-delivered.sh>`, never direct execution.** `graph.js` does no subprocess work today — it is pure `fs` and `JSON.parse` — and this is the first. On Windows, which is this repo's primary development platform, a bash-shebang file cannot be executed directly by process creation; the interpreter must be named. The same call runs from the long-lived MCP server process, where a missing `bash` must be reported rather than thrown.
- **The query string is the resolved node's bare name**, and results are then **filtered to items whose `node` equals the resolved id.** `delivered.sh read` matches free text against `name`, `words`, `id`, `items[].what` and `items[].find` — **never `node`** — so a bare name would also return incidental prose hits. The filter is what makes `history <name>` an answer about *that artefact* rather than about the word.

**One parser. One last-line-wins. One status ordering.** The verb owns the join and nothing else.

This makes the internal layer a consumer of the product's script, which is not a layering violation but the repo's habit: `graph.js` already walks `framwork/.codeadd/`, and `delivered.sh` is the format's reference implementation. The internal layer running the same code users get is dogfooding, and it is the only arrangement where the two layers cannot disagree about what a line means.

The verb never writes — no `--repair` passthrough. `delivered.sh verify --repair` remains the single writing path, and `graph.js`'s query-only character, recorded in plan 0077, survives intact.

### 2. The MCP tool follows for free

A seventh tool in `artefact-graph-mcp.js`, wrapping the same function. CLAUDE.md's rule applies unchanged: the CLI is the engine, MCP the wrapper, and both call the same module.

### 3. Agents receive resolved results; they never parse the index

`@framework-discovery-agent` gets **no new tool and no new file to read.** The dispatching command runs `graph.js history`, and the resolved, ordered, status-labelled entries go into the dispatch payload — exactly how selected wiki pages already travel into subagent bootstrap blocks.

This is the third-parser problem answered by not creating one. It also keeps the agent's `Glob, Read` allowlist untouched, which matters: this repo treats a read-only allowlist as a method boundary, not a convenience.

### 4. Where each internal consumer reads it

| Consumer | Where | What it asks |
|---|---|---|
| `add-framework--shared-brainstorm` | STEP 1.2, before dispatching discovery | *Has this been built before? Was it dropped?* The command most likely to re-invent something |
| `add-framework--self-plan` | STEP 2.1/2.2, where `graph.js impact` / `dependencies` are **already** called | *What did the last delivery here replace?* Time beside structure. No new step |
| `add-framework--plan` | STEP 2 — **a genuinely new step** | It calls no graph command today; CLAUDE.md's own Consumers paragraph names only `--self-plan`. It operates on the product layer, so its lookup is `--layer product` |
| `add-framework--shared-review` | STEP 3.1b, the blast-radius coverage check | *Did this plan touch something a previous delivery superseded?* |
| `@framework-discovery-agent` | Its dispatch payload | Ranked candidates, resolved by the command |

Four commands, one verb, no agent change. **Three of the four already have a step that resolves context; `add-framework--plan` does not, and its edit is a genuinely new step** — an earlier draft claimed otherwise and was wrong.

### 5. Retiring force-add — the trigger, checked and not remembered

The trigger from the `done-command` subtopic is *at least one entry written by a real `/add-framework--done` run exists on `main`*. Made checkable:

```
git show main:docs/delivered.jsonl | grep '"layer":"internal"' | grep '"by":"done"'
```

Non-empty → the trigger has fired. That is the whole mechanism; it needs no script.

**The `layer` filter is the whole point of that line, and omitting it inverts the mechanism.** One index file serves both layers, `layer` is what separates them, and the product's `/add.done` writes `"by":"done"` too — from subtopics sequenced to close *before* these. A grep without the filter fires on the first **product** entry, retiring force-add long before any internal close-out has run: precisely the premature retirement the umbrella lists as its High-probability risk, caused by the check meant to prevent it. Both substrings must appear **on the same line**; two greps in a pipeline achieve that, two independent searches over the file do not.

**What changes in CLAUDE.md when it fires, and what does not:**

| Changes | Stays |
|---|---|
| New plans are no longer force-added — `docs/*` ignored, as `.gitignore` already says | Every set CLAUDE.md's `docs/` policy currently enumerates stays tracked — re-derived from that paragraph at edit time, never copied here, because an earlier draft copied it and got it wrong in both directions |
| The stated reason is replaced: shipping is proven by a tracked `docs/delivered.jsonl` entry, not by a tracked plan | The `docs/` ignore rule itself, unchanged |
| The `!docs/delivered.jsonl` negation is documented as the single deliberate exception | The policy's explanatory role — a future reader still learns why the older sets are tracked |

The existing sets stay because the index does not cover their period and, by the umbrella's no-backfill decision, nothing else will. Untracking them would destroy the only record of that window in the name of tidiness.

**This edit is not part of this delivery.** It is a follow-up whose precondition is a passing trigger check, recorded here so it is executed deliberately rather than remembered vaguely.

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **`graph.js history` parses the index in JavaScript** | A second implementation of last-line-wins over one format — plan 0075's subject, recreated inside a design that cites 0075 |
| **A standalone `history.js` plus its own MCP server** | The umbrella already rejected this; two engines drift, and CLAUDE.md's one-engine rule covers it |
| **Give `@framework-discovery-agent` a Bash tool** | Breaks a read-only allowlist this repo treats as a method boundary, to save passing a payload the dispatch already carries |
| **Let the agent `Read` the JSONL itself** | A third parser, in an agent's head, where last-line-wins is guesswork |
| **Merge index data into `artefact-graph.json`** | The graph is rebuilt every build; history would be erased. The join is one-directional for this reason |
| **A script that checks the retirement trigger** | One `git show … | grep` needs no script, and a script would be one more thing to keep honest |
| **Retire force-add in the same delivery** | Destroys the record during the window when nothing else covers it. The umbrella made this a hard ordering rule |

## Type of Artefact

Architecture — one `graph.js` verb, one MCP tool, four command edits, and one deferred CLAUDE.md follow-up.

## Scope

### Includes

- `graph.js history <name>`, delegating the read and owning only the join
- The seventh MCP tool
- The four internal consumers and their positions
- How agents receive resolved results without parsing anything
- The checkable retirement trigger, and exactly what the CLAUDE.md edit changes and preserves

### Does NOT Include

- The record shape, the writer, or the verify pass — earlier subtopics
- The CLAUDE.md edit itself — gated behind the trigger
- Retroactive untracking of existing force-added sets
- Any change to `artefact-graph.json`, `collectNodes()`, or the six existing verbs
- Product-layer consumers — the product's `consumption` subtopic
- A tool change for `@framework-discovery-agent`

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| **`graph.js history` shells out to `delivered.sh read` instead of parsing the index** | Otherwise two implementations of last-line-wins over one format — plan 0075's subject, recreated inside a design that cites it. The umbrella spotted the two-engines risk between scripts and missed it between layers | ✅ |
| **The internal layer consuming a product script is dogfooding, not a layering breach** | `graph.js` already walks `framwork/.codeadd/`. It is the only arrangement where the layers cannot disagree about what a line means | ✅ |
| **The verb owns the join and nothing else** | A verb that also filtered or repaired would be a second reader wearing a thin disguise | ✅ |
| **`history` never writes; no `--repair` passthrough** | `graph.js` is query-only by plan 0077's recorded decision. `delivered.sh verify --repair` stays the single writing path | ✅ |
| **The MCP tool wraps the same function** | CLAUDE.md's stated rule: CLI is the engine, MCP the wrapper, both call one module | ✅ |
| **Agents receive resolved results in their dispatch payload; they parse nothing** | Avoids a third parser in an agent's head, and leaves `Glob, Read` untouched — a boundary this repo treats as method, not convenience | ✅ |
| **Four consumers; three land on a step that already resolves context, one gets a new step** | `--shared-brainstorm`, `--self-plan` and `--shared-review` each already resolve context before dispatching. **`add-framework--plan` calls no graph command at all today** — CLAUDE.md's Consumers paragraph names only `--self-plan` — so its edit is a new step, scoped as such rather than smuggled in as "no new step anywhere" | ✅ |
| **The retirement trigger filters on `layer`** | One index serves both layers and the product's `/add.done` also writes `"by":"done"`, from subtopics that close first. Without the filter the check fires on a product entry and causes the premature retirement it exists to prevent | ✅ |
| **`graph.js` invokes `bash <path>` explicitly and reports a missing interpreter** | Its first subprocess ever, on a Windows-primary repo where shebang execution does not work, called from a long-lived MCP process where a throw is fatal | ✅ |
| **`history` filters results to items whose `node` matches the resolved id** | `delivered.sh read` never matches on `node`, so a bare name would return incidental prose hits. The filter is what makes the verb an answer about the artefact rather than about the word | ✅ |
| **The retirement trigger is a `git show … \| grep`, not a script** | One command answers it. A script would be one more thing to keep honest | ✅ |
| **Already-force-added sets are never untracked** | The index does not cover their period and there is no backfill. Untracking destroys the only record of that window | ✅ |
| **The CLAUDE.md edit is a gated follow-up, outside this delivery** | Reversing the order deletes the record during the window when nothing else covers it | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `scripts/graph.js` | Seventh verb, `history` | Add the case; delegate the read |
| `scripts/artefact-graph-mcp.js` | Seventh MCP tool | Wrap the same function |
| `framwork/.codeadd/scripts/delivered.sh` | Gains an internal caller | **None** — `read` already has the right contract |
| `add-framework--shared-brainstorm` | STEP 1.2 gains the lookup | Edit + `.opencode/` mirror |
| `add-framework--self-plan` | STEP 2.1/2.2 gain the time axis beside the graph calls already there | Edit + mirror |
| `add-framework--plan` | **A new STEP 2 lookup** — it calls no graph command today | Edit + mirror; scope it as new work, not an extension |
| `add-framework--shared-review` | STEP 3.1b gains supersession awareness | Edit + mirror |
| `@framework-discovery-agent` | Payload only | **None** — no tool, no file, no allowlist change |
| `artefact-graph.json`, `collectNodes()` | Untouched | None |
| `CLAUDE.md` | Query table gains a row now; the `docs/` policy changes later, behind the trigger | Add the row; policy is separate work |
| `web/public/artefact-graph.mmd` | Unaffected — no graph shape change | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| One parser for one format across both layers | An internal script that shells out to a product one |
| Four commands that can ask "was this built?" | Four command edits plus their `.opencode/` mirrors |
| A retirement trigger anyone can check in one command | A follow-up that must actually be done |
| Agents unchanged, allowlists intact | Slightly larger dispatch payloads |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Someone "simplifies" `history` by inlining the parse in JS | **High over time** | The likeliest future regression, because inlining looks cleaner. The reason is recorded as a Key Decision naming plan 0075, not as a code comment |
| The `.opencode/` mirrors drift from the four edited commands | Med | CLAUDE.md already records this drift as ungated. Four edits is four chances; the plan must list the mirrors as their own tasks |
| The retirement follow-up is never done, and force-add continues by inertia | Med | Harmless — the current policy stays correct, just heavier than needed. Strictly better than doing it early |
| `delivered.sh` being absent breaks `graph.js history` in a repo without the product layer | Low | Only this repo runs internal commands, and it contains the product layer by definition. `history` reports the absence rather than crashing |
| **`bash` is unavailable or off `PATH`** — `graph.js` has never spawned a subprocess, and this is its first | Med | Windows is this repo's primary platform, so the interpreter is named explicitly (`bash <path>`) rather than relying on shebang execution. A missing interpreter is **reported like a missing file**, never thrown — and the MCP server is the case that matters, since a throw there kills a long-lived process rather than one command |
| The retirement trigger is written without the `layer` filter and fires on a product entry | **High** | The single most dangerous line in this document, because the check exists to prevent exactly the failure a wrong version causes. RED tests 9–11 pin all three cases |
| Larger dispatch payloads crowd out other context | Low | Bounded to the entries actually returned, which is a handful |

## RED Test Matrix

| # | Setup | Expected |
|---|---|---|
| 1 | `graph.js history <known-name>` | Entries returned, `live` first, `gone` last |
| 2 | Items carrying `node` | Enriched with dependant counts from the graph |
| 3 | Items without `node` (a script, `CLAUDE.md`) | Returned unenriched, never with a fabricated id |
| 4 | Index absent | Reports absence, exit 0, never a crash |
| 5 | `history` invoked with `--repair` or any writing flag | Rejected — the verb has no write path |
| 6 | Same query through the CLI and through MCP | Byte-identical results |
| 7 | A drifted index | `history` reflects current status without modifying the file |
| 8 | `delivered.sh` missing | Reported clearly, not a stack trace |
| 9 | Trigger check before any `/add-framework--done` run | Empty — force-add policy stays |
| 10 | Trigger check when the index holds **product** entries with `"by":"done"` and no internal ones | **Empty.** The `layer` filter is doing its job; this is the test that fails without it |
| 11 | Trigger check after one real internal run | Non-empty — the follow-up is unblocked |
| 12 | `bash` absent from `PATH`, via CLI and via the MCP server | Reported as unavailable; the MCP process stays alive |
| 13 | `history <name>` where the name also appears as prose in an unrelated entry's `words` | Only entries whose item `node` matches are returned |
| 14 | `add-framework--plan` after the edit | Its new lookup passes `--layer product` |

## Next Steps

**The set is complete — all eight documents are written and reviewed.** Nothing remains to refine.

It awaits the owner's approval of the handoff summary, which carries two decisions that reverse or narrow earlier ones: `plan.md` and `iterations.*` are kept rather than pruned (04), and the internal cleanup is retiring force-add rather than deleting (06).

On approval, both layers are plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```
