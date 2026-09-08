# Brainstorm: Delivery Index — Internal Layer (Umbrella)

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--self-plan`
> **Date:** 2026-09-07
> **Type:** architecture
> **Set:** `2026-09-07T123919` — **05 of 08**, the internal root. Consumes the schema owned by 02, under the product umbrella (01)

## Where this sits in the set

This is **05 of 08**. The full reading order lives in `…-01-product-umbrella.md`; what matters here is what must already be read:

| Read first | Why |
|---|---|
| **01** — product umbrella | Establishes what the index is, the four states, and the merge-proven write rule this layer inherits |
| **02** — product schema | **Owns the record for both layers.** This umbrella adds no field; it consumes that one |

Then this document's own three subtopics, in order: **06** (`/add-framework--done`), **07** (entry deltas and the graph join), **08** (query surface). Of those, **08 also depends on 03** — `delivered.sh`, which it delegates its read to rather than reimplementing.

## Discovery

- **`scripts/graph.js` + `framwork/.codeadd/artefact-graph.json`** — 204 nodes, 682 edges, 18 internal and 186 product. Commands, skills and agents are already enumerated, already typed, and already validated by a build gate that **fails** when a declaration names something that does not exist. That covers *part* of the internal layer's items — `collectNodes()` walks `.claude/commands`, `.claude/skills/*/SKILL.md` and `.claude/agents` and nothing else, so top-level `scripts/*.js`, `CLAUDE.md`, `.gitignore` and `.opencode/` produce no nodes. See Proposed Solution §2 for what that costs.
- **`scripts/artefact-graph-mcp.js`** — wraps the same six query functions as MCP tools. CLAUDE.md's stated reason matters here: *"the CLI is the engine and MCP the wrapper, not the reverse … both call the same module so they cannot drift."*
- **`docs/changelog/`** — 14 entries, `YYYY-MM-DD-<verb>-<slug>.md`. The closest thing the internal layer has to a delivery record today, written by hand and read by nobody automatically.
- **`docs/plans/`** — the internal unit of work, ids `0056`–`0078`. Twenty files on disk against twenty-seven in `HEAD`.
- **`.gitignore` line 141: `docs/*`** — the mechanism behind half the pain. An ignored file survives a branch's death, so a plan from an abandoned branch stays on disk forever.
- **CLAUDE.md's `docs/` tracking policy** — several plan sets are deliberately force-added because *"a plan whose changelog or review is untracked reads as unimplemented from a fresh clone, which is the failure this policy exists to prevent."*
- **Plan 0076** — deleted `doc-reviewer-agent` and rewrote twelve references to it. The deletion is recorded in a changelog nothing reads programmatically.
- **`/add.done` + `done.sh --merge`** — the product-layer close-out the internal layer has no equivalent of.

## Context & Motivation

The internal layer has no "done". A change closes as a commit on `main`, plus a hand-written changelog file, plus a merged PR — three signals, none authoritative, none machine-readable. Consequently nothing records **when an artefact arrived, which plan brought it, or what it replaced.**

**The failure is live in this repository right now.** `doc-reviewer-agent` was deleted and the `add-doc-reviewer` skill was deleted with it — gone from `framwork/.codeadd/skills/`, scoring zero in `provider-map.json`. **Seventy-four occurrences across thirteen files nevertheless survive** (measured repo-wide, excluding `node_modules` and `.git`): plans `0074`, `0076` and `0077`; an evidence file; a changelog; a CLI test; three stale build copies under `framwork/.claude/`, `framwork/.cursor/` and `framwork/.opencode/` — build output, *not* the tracked repo-root `.opencode/` adapter mirror, which is clean; and **`ecosystem.md`, `web/src/pages/docs.astro`, and the built `web/dist/docs/index.html`**.

The deleted skill is listed in the ecosystem map and published on the documentation website. On top of that, the very session that produced this document was handed `add-doc-reviewer` in its own available-skills listing.

An agent searching for "doc-reviewer" today finds all seventy-four and **no signal whatsoever** that the thing was killed deliberately on 2026-09-06 and replaced by the readback agent. It will cite it. That is *generated documentation citing a discarded feature* — word for word the complaint this design answers, occurring inside the framework that is meant to solve it.

## Problem / Opportunity

Three distinct gaps, all downstream of the same absence:

1. **No close-out.** Nothing marks the moment an internal change lands, so nothing can be written at that moment.
2. **No time axis.** `artefact-graph.json` answers *what depends on what today* with precision. It cannot answer *when did this arrive* or *what did it replace*, and it never should — those are different questions about different things.
3. **No disposal.** Plans, brainstorms and evidence accumulate. Worse, the current policy actively **force-adds** some of them, because a tracked plan is the only available proof that a change shipped.

That third point is the opportunity worth naming: **the index can retire the force-add practice.** CLAUDE.md force-adds plan sets specifically so a fresh clone can tell that a change was implemented. An index entry states that fact directly, in one line, machine-readably. Once the entry exists, the plan no longer has to be tracked to prove its own execution — the reason for the exception disappears.

## Proposed Solution

Three pieces, each small because the graph already carries the heavy part.

### 1. `/add-framework--done` — the missing close-out

A new internal command that owns the whole finalization:

In execution order:

1. Writes the index entry **on the branch, as the last commit before the PR merges**
2. Merges via `gh` (remote, not a local merge — `gh` is a hard dependency, acceptable because the internal layer has exactly one operator who always has it)
3. Cleans up: the worktree, the branch, and `docs/evidence/` — **the only internal docs class with no post-merge reader.** `docs/plans/`, `docs/brainstorming/` and `docs/changelog/` all survive; the `done-command` subtopic measured this and the internal relief is retiring force-add, not deleting. Do not read "level 2" here — that is the product layer's list

The index entry riding the branch is what gives the guarantee. If the PR never merges, the entry dies with the branch and `main` never sees it. States "branch died" and "plan never executed" become impossible rather than modelled. The property preserved is the product umbrella's — **no extra index-only commit on `main`** — but the mechanism is not: `done.sh --merge`'s no-PR path merges locally, whereas `/add-framework--done` always goes through a real `gh` PR. Do not model this command's merge on `done.sh --merge`.

**The internal layer inherits the same fifth state the product umbrella names: shipped but unindexed.** Nothing forces `/add-framework--done`; merging a PR by hand on GitHub bypasses it entirely and leaves no entry. Internally this is a smaller risk — one operator, one declared close-out — but it is the same failure, and absence in the index must be read as *no close-out ran*, never as *never shipped*.

### 2. Entries that join the graph by id

An internal entry's items are artefact-graph node ids (`readback-agent`, `converge-gates.sh`, `add-doc-schemas`) — the same identifiers, not a parallel naming scheme. So the two artefacts divide the work cleanly and neither grows into the other:

```
index  →  what existed, when it arrived, what it replaced      (time)
graph  →  what depends on it today                             (structure)
```

`node scripts/graph.js impact readback-agent` answers what breaks. The index answers where it came from and what it killed. One id joins them.

Two consequences follow — **partially**, and the boundary matters more than the benefit:

- **Item enumeration is assisted, not automatic.** Where a delivered artefact is a graph node, the entry can name it without judgement. But `collectNodes()` walks only `.claude/commands`, `.claude/skills/*/SKILL.md` and `.claude/agents` — **18 internal nodes**. It does *not* walk top-level `scripts/*.js`, `CLAUDE.md`, `.gitignore`, or `.opencode/`. This design's own deliverables — the `graph.js history` verb, its MCP tool, the `.gitignore` negation — would produce **zero** items from the graph. Those still need a human-authored item, exactly as the product layer does.
- **`live` / `gone` is cheap for nodes, unbuilt for the rest.** The build fails loud (`assertArtefactGraph`) when a declaration names a missing artefact, so a deleted command or skill cannot pass unnoticed. Nothing equivalent covers a deleted script or a reverted `CLAUDE.md` section; those need the product layer's anchor check.

There is also no history to diff against. `framwork/.codeadd/artefact-graph.json` is gitignored and rebuilt from scratch on every build, so "derive the entry from the diff against the graph" has no prior graph to compare with. The diff must come from **git**, with the graph used only to classify what the diff touched.

### 3. `graph.js history <name>` — a new verb, not a new engine

Query the index through the existing engine rather than a second script, for the reason CLAUDE.md already gives for the MCP wrapper: two engines drift. The MCP surface gains the tool for free.

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **Derive the internal history from `git log` on demand** | Commit messages do not say what an artefact *replaced*, and squash-merges flatten the detail. Retrieval would also be slow and unbounded at exactly the moment it is needed — discovery |
| **Store history inside `artefact-graph.json`** | The graph is build-emitted and regenerated from the current tree. History is precisely the part that is not in the current tree; a regeneration would erase it |
| **A separate `history.js` script and its own MCP server** | Two engines over one dataset drift. The CLAUDE.md rule about `graph.js` and its MCP wrapper applies unchanged |
| **Keep force-adding plans as the proof of shipping** | It is the current practice and it is the source of the complaint: seven plans the owner deleted locally are still resurrected by a fresh clone |

## Type of Artefact

Architecture — one new command, one new `graph.js` verb, one index file, one `.gitignore` change, and edits to the internal commands that perform discovery.

## Scope

### Includes

- `/add-framework--done`: index write on the branch, `gh` merge, cleanup of docs, worktree and branch
- The internal index at **`docs/delivered.jsonl`** — flat, directly under `docs/`, tracked via a single `.gitignore` negation and **no force-add**
- Reusing the product schema verbatim, recording only the internal deltas
- The id join between index entries and `artefact-graph.json` nodes
- `graph.js history <name>` plus its MCP tool
- Wiring the index into `add-framework--shared-brainstorm`, `--plan`, `--self-plan` and `--shared-review` discovery
- Recording the **trigger condition** for a later CLAUDE.md `docs/` policy change — explicitly **not** the change itself, which is out of scope for this delivery (see the sequencing rule below)

### Does NOT Include

- Any change to how `artefact-graph.json` is built or what it contains
- A `.opencode/` adapter mirror check — that drift is ungated today and stays ungated here
- Backfilling history for changes delivered before the index exists (`0001`–`0078` stay unindexed; a partial backfill would be a partially-lying index, which is worse than an empty one that starts honest)
- Retiring `docs/changelog/` — a human-readable narrative and a machine-readable index are different products
- Making the `gh` dependency optional

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Schema is owned by the product umbrella; internal records deltas only | Two independently-authored schemas become two incompatible indexes within a release, and neither layer can read the other's history | ✅ |
| `/add-framework--done` is a new command, not a step inside `--build` | A build that runs and is then discarded would index something that never shipped. The write belongs to the close-out, not to the construction | ✅ |
| Merge happens via `gh`, remotely | The internal layer has one operator who always has `gh` installed. A hard dependency is honest here and would not be in the product layer | ✅ |
| The entry is committed **on the branch**, before the PR merges | Same guarantee as a post-merge write, without the extra `chore: index` commit on `main`. If the PR dies, the entry dies with it | ✅ |
| Internal items are artefact-graph node ids | The join is the whole value. A parallel naming scheme would need its own validation and would drift from the graph within one release | ✅ |
| Query is a new **verb on `graph.js`**, not a new script | CLAUDE.md's stated reason for the MCP wrapper — one engine, no drift — applies unchanged. The MCP tool comes for free | ✅ |
| The index is tracked via a `.gitignore` negation, never force-add | Force-add is the mechanism that resurrected seven deleted plans. Using it for the fix would be using the disease as the cure | ✅ |
| Internal cleanup is part of the command, not an opt-in feature | `docs-pruning` is opt-in in the product layer because deleting a *user's* documentation is their call. Internally there is no third party to protect | ✅ |
| No backfill of `0001`–`0078` | A partially-populated index is a lying index: absence would mean both "never shipped" and "shipped before we started recording". Starting empty keeps absence meaningful | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `/add-framework--done` | Does not exist | Create — `gh` merge, index write, cleanup |
| `.gitignore` | `docs/*` (line 141) would swallow the index | Add `!docs/delivered.jsonl`. **One line suffices only because the index is flat, directly under `docs/`.** A nested path would need the directory-negation chain this repo already uses for `.opencode/` (`!.opencode/`, `!.opencode/commands/`, `!.opencode/commands/**`) — a reason to keep it flat |
| `scripts/graph.js` | New `history` verb | Extend the existing engine |
| `scripts/artefact-graph-mcp.js` | Seventh MCP tool | Extend |
| `artefact-graph.json` | None. The join is by id, one direction only | None |
| `add-framework--shared-brainstorm` | STEP 1.2 discovery gains the index as its first stop | Add read step |
| `add-framework--plan` / `--self-plan` | STEP 2.1/2.2 impact analysis gains the time axis | Add read step |
| `add-framework--shared-review` | STEP 3.1b blast-radius check gains "and this is what it replaced" | Add read step |
| `@framework-discovery-agent` | Reads the index before scanning plans | Update dispatch input |
| `CLAUDE.md` | The `docs/` tracking policy's rationale weakens once entries prove shipping | Revisit after the index lands, not before |
| `docs/changelog/` | Unchanged. Narrative and index serve different readers | None |
| `cli/tests/release-packaging.test.js` | Only if the internal index ever ships — it does not | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A first stop for "have we tried this?" that costs one grep | A new command to maintain, and a `gh` dependency |
| Deleted artefacts stop being offered as live | An index that must itself be kept honest |
| The force-add exception can retire, and `docs/` can finally be disposable | Nothing, once entries exist — but the two must not be sequenced backwards |
| Time and structure answered by one engine, joined by one id | A `graph.js` that now serves two datasets rather than one |
| Commands, skills and agents name themselves from the graph | Scripts, `CLAUDE.md` and `.opencode/` are not graph nodes, so their items are hand-authored — the same 3–5 item confirmation the product layer pays, for part of each entry |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| CLAUDE.md's `docs/` policy is relaxed before the index actually proves shipping, and the record is lost in between | **High** | Concrete trigger, not a reminder: **the policy may change only after at least one entry written by a real `/add-framework--done` run exists on `main`.** Until that line exists, the force-add practice stays exactly as CLAUDE.md describes it. The `internal-query` subtopic owns turning this into a checkable condition |
| `graph.js` accumulates unrelated responsibilities and becomes the thing it was meant to prevent | Med | The join is one-directional and by id only. History never enters `artefact-graph.json`; the graph never grows a time axis |
| `/add-framework--done` merges something that failed review | Med | **The internal gate mechanism is undecided and deferred to the `internal-done-command` subtopic**, which already owns "which gates run before it." `converge-gates.sh` is *not* the answer and must not be reached for: it requires a `FEATURE_DIR` containing `epic.md`, `review-NNN.md` and a `plan.md` with a coverage table, plus a repo-root `.codeadd/manifest.json`. The internal layer has none of those — `docs/plans/` is flat files with `--review-vNN.md` companions. Invoked as-is it either fails on its directory check or reports every gate `ok` vacuously, which is worse than having no gate |
| The empty-until-first-use index is judged useless and abandoned | Med | Expected and correct. Its value is cumulative; the alternative is a backfill that lies |
| Cleanup deletes a plan that is genuinely the spec of record | Med | The index entry must carry what the plan proved before the plan is removed — this is a topic-1 gate, not a hope |

## Decomposition Map

| Subtopic | Design Path | Purpose |
|----------|-------------|---------|
| The `/add-framework--done` command | `2026-09-07T123919-delivery-index-06-internal-done-command.md` | Steps and order; the `gh` merge; which gates run before it; what is deleted and what survives; how the entry rides the branch |
| Internal entry deltas and the graph join | `2026-09-07T123919-delivery-index-07-internal-entry-join.md` | What the internal entry adds to and drops from the product schema; how items are derived from the diff against the graph; how `superseded` is declared |
| Query surface and internal consumers | `2026-09-07T123919-delivery-index-08-internal-query.md` | `graph.js history` and its MCP tool; where each internal command reads it; and the sequenced retirement of the `docs/` force-add policy |

## Dependencies & Relationships

**This umbrella depends on the product umbrella's schema topic.** Refine that one first; the entry-deltas topic here is undefined without it.

Internally, refine in the order listed. The command topic settles when an entry is written and what may be deleted, and both are inputs to the entry topic. The query topic comes last because it is the only one that can be built against a schema that is already closed.

**One hard sequencing rule crosses all three:** the `docs/` tracking policy in CLAUDE.md changes **only after** the index carries real entries. Reversing that order deletes the record of what shipped during the window when nothing else records it.

## Next Steps

**The set is complete and APPROVED by the owner on 2026-09-07.** All eight documents are written and reviewed; nothing remains to refine.

The approval explicitly covers five decisions the owner was asked to confirm, two of which reverse or narrow an earlier one:

1. `plan.md` and `iterations.*` are **kept**, not pruned — reversing part of the umbrella's original level-2 list (04)
2. `changed` means **moved**, not modified (02)
3. The internal cleanup is **retiring force-add**, not deleting files (06)
4. The index is **exempt from `/add.hotfix`'s wiki-blind rule**, read with `--no-verify` at STEP 4 (04)
5. **Nobody confirms** the item list; STEP 7 previews it (03)

Both layers are now plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```
