# Plan: Delivery Index — Internal Layer

> **Status:** draft
> **Scope:** cross-cutting
> **Created:** 2026-09-07

---

## Context

The internal layer has no close-out. Work ends as a commit on `main`, a hand-written `docs/changelog/` entry and a merged PR — three signals, none authoritative, none machine-readable. Nothing records when an artefact arrived, which plan brought it, or what it replaced.

The failure is live in this repository. `doc-reviewer-agent` and the `add-doc-reviewer` skill were both deleted, yet **74 occurrences across 13 files** survive — including `ecosystem.md` and the published `web/dist/docs/index.html`. An agent searching for "doc-reviewer" finds all of it and no signal that the thing was killed on 2026-09-06 and replaced.

**Every decision here was taken and reviewed in the design set below, and approved by the owner on 2026-09-07. This plan does not re-derive them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-07T123919-delivery-index-05-internal-umbrella.md` | Why the internal layer needs the index; what the graph covers and what it does not; the force-add retirement opportunity |
| `docs/brainstorming/2026-09-07T123919-delivery-index-06-internal-done-command.md` | `/add-framework--done`: the eight steps, the gate set and why it is CI's four, the cleanup and what is deliberately not cleaned |
| `docs/brainstorming/2026-09-07T123919-delivery-index-07-internal-entry-join.md` | The internal field deltas, the three item kinds, how `superseded` is proposed, the `node` join boundary |
| `docs/brainstorming/2026-09-07T123919-delivery-index-08-internal-query.md` | `graph.js history` delegating its read, the four consumers, the retirement trigger |

The **record itself** is owned by `2026-09-07T123919-delivery-index-02-product-schema.md` and consumed here verbatim.

## Global Constraints

- **This plan is blocked on the product plan.** `delivered.sh` is created by `docs/plans/2026-09-07T160328-PLAN--delivery-index.md` F3. `graph.js history` delegates its read to it and `/add-framework--done` calls its `write` mode — **nothing here can be built or tested before that script exists**
- All **8** internal commands have an `.opencode/` adapter today, with no exceptions. The adapter's frontmatter carries `description:` only, and its body matches the canonical **except for one line every adapter has and no canonical has**: `> **INPUT:** $ARGUMENTS` (verified 8/8 in `.opencode/commands/`, 0/8 in `.claude/commands/`). "Identical body" is wrong and would make the new adapter the only one of nine missing it
- **`graph.js` is never a `<!-- uses: -->` target.** Root `scripts/` is not walked by `collectNodes()`, so it is not a graph node, and a declaration naming it would fail the build as "a declaration names something that does not exist" (`scripts/build.js:1059`). This binds items 8–11, none of which adds one
- Drift between a canonical `.claude/` command and its OpenCode copy is **currently ungated** — `.opencode/` is not walked by `collectNodes()` (CLAUDE.md, Build Transform Details). Nothing in CI catches a missing mirror
- The internal layer is not built by `scripts/build.js` and is not distributed to users (CLAUDE.md, Project Anatomy)
- `collectNodes()` pushes internal artefacts with `registered = true` because "provider-map.json registers the PRODUCT layer only. Internal artefacts are never distributed, so `registered` is true by definition — marking them otherwise would fire the unregistered gate on 17 correct files" (`scripts/build.js:862`)
- **Root `scripts/` is not walked by `collectNodes()`** — it walks `.claude/commands`, `.claude/skills/*/SKILL.md` and `.claude/agents` only. `graph.js` and `artefact-graph-mcp.js` produce **no graph nodes**, so `graph.js impact` returns nothing for them and cannot grade their risk
- `scripts/graph.js` imports **only** `node:fs` and `node:path` and spawns **no subprocess** today. The `history` verb introduces the first one
- CI runs four commands across two jobs with different working directories: `node scripts/build.js` and `npm run test:scripts` at the root, `npm test` and `npm run test:package` under `cli/` (`.github/workflows/ci.yml`)
- `add-framework--shared-review` emits exactly `PASS | GAPS_FOUND | BLOCKED`

## Current State

| Artefact | Today | `impact --depth 1` | Risk |
|---|---|---|---|
| `.claude/commands/add-framework--self-plan.md` | Derives impact from `graph.js`; no time axis | **4** (`--build`, `--plan`, `--self-build`, `--shared-brainstorm`) | **HIGH** |
| `.claude/commands/add-framework--plan.md` | **Calls no graph command at all** | **3** (`--build`, `--self-plan`, `--shared-brainstorm`) | **HIGH** |
| `.claude/commands/add-framework--shared-brainstorm.md` | Dispatches `@framework-discovery-agent`, which globs `docs/plans/*.md`. **Calls no graph command** — zero `graph.js` occurrences | **0** | LOW |
| `.claude/commands/add-framework--shared-review.md` | Blast-radius coverage check via `graph.js impact --depth 1` (line 143) | **0** | LOW |
| `scripts/graph.js` | Six verbs + `stats`; pure `fs`/`path`; no subprocess | **not a node** | graded by hand: **HIGH** — every internal planning command shells out to it |
| `scripts/artefact-graph-mcp.js` | Six tools in a `TOOLS` array, auto-dispatched | **not a node** | graded by hand: MEDIUM — additive only |
| `.gitignore` | `docs/*` at line 141, with a negation chain for `.opencode/` as precedent | **not a node** | LOW |
| `CLAUDE.md` | Internal command table lists 8; the graph query table lists 5 questions | **not modelled by the graph** | **HIGH** — it is the instruction set every session loads |
| `/add-framework--done` | **Does not exist.** No prior self-plan has ever created an internal command | — | — |

**Only `--plan` and `--self-plan` carry real risk.** `--shared-brainstorm` and `--shared-review` appear in the graph only as edge *sources*: nothing depends on them, so both are LOW. The two HIGH artefacts are the same four commands cross-referencing each other through `HANDS_OFF_TO` — editing `--plan` and `--self-plan` touches what `--build`, `--self-build` and `--shared-brainstorm` all point at.

## Proposed Changes

### Stage 1 — Make the index tracked

1. **`.gitignore`** — add `!docs/delivered.jsonl` immediately after `docs/*` (line 141). One line suffices because the file is flat directly under `docs/`; the `.opencode/` chain at lines 143–148 is the counter-example for a nested path and is **not** the model here. **Force-add is forbidden** — it is the mechanism that resurrected seven deleted plans, and using it for this fix would be using the disease as the cure.
   - **Produces:** `docs/delivered.jsonl is tracked` — the path git will keep

### Stage 2 — The close-out command

2. **`.claude/commands/add-framework--done.md`** (**new**) — the eight steps in order: collect context and probe `gh auth status`; gates; author the entry; changelog; preview; commit on the branch and push; `gh pr create` + `gh pr merge --squash`; cleanup. **The gate set is CI's own four with their working directories attached** — `npm --prefix cli run test:package`, because `test:package` exists only in `cli/package.json` and running it from the root yields "Missing script", a *false* gate. Before those four, **every F-block in the plan's build ledger must read `complete`** — unwritten code breaks no test. Review verdict must be `PASS`; `GAPS_FOUND` and `BLOCKED` both HARD STOP. Cleanup runs worktree → branch → `docs/evidence/`, in that order, non-fatal, and **deletes nothing under `docs/plans/`, `docs/brainstorming/` or `docs/changelog/`**. **Re-run idempotency, inlined because it is easy to lose:** running the command twice on the same branch must stop at the gates — `gh pr view` reports the PR already merged, so there is nothing to close out and no second entry is written.
   ⛔ **Before authoring STEP 7's merge logic, read `docs/brainstorming/2026-09-07T123919-delivery-index-06-internal-done-command.md` in full, including its 16-row RED Test Matrix.** `/add-framework--self-build` STEP 1.2 extracts artefacts, order and decisions from the plan — it does not follow a plan's design references on its own, so this instruction is the only thing that makes the matrix reach the builder.
   - **Consumes:** `docs/delivered.jsonl is tracked` (1); `delivered.sh write` (**product plan `2026-09-07T160328` F3** — external)
   - **Produces:** `internal entry` — a `docs/delivered.jsonl` line carrying `"layer":"internal"` and `"by":"done"`; and `the canonical body` — the command file the adapter mirrors
3. **`.opencode/commands/add-framework--done.md`** (**new**) — the adapter: `description:` frontmatter only, body identical to the canonical. Nothing in CI catches its absence, so it lands in the same commit as the canonical.
   - **Consumes:** the canonical body (2)

### Stage 3 — The query surface

4. **`scripts/graph.js`** — a seventh verb, `history <name>`. Add the `case 'history'` to the switch at line 332, the usage line to the comment block at the top, and an exported `history()` beside the other query functions. It **shells out to `bash <path>/delivered.sh read <name>`** and then filters the returned entries to those whose item `node` equals the resolved id, enriching each with the graph's dependant count. **`bash` is named explicitly, never direct execution** — Windows is this repo's primary platform and a shebang file is not executable by process creation there. A missing `bash` or a missing `delivered.sh` is **reported, never thrown**: the same function runs inside the long-lived MCP process, where a throw kills more than one query. It **never writes** — no `--repair` passthrough. Contract: design doc `08` §1.
   - **Consumes:** `delivered.sh read` (**product plan F3** — external)
   - **Produces:** `G.history(graph, name)` — an exported query function returning ordered, status-labelled entries with graph enrichment
5. **`scripts/artefact-graph-mcp.js`** — a seventh entry in the `TOOLS` array (lines 40–87) with `name: 'history'`, a `description`, an `inputSchema`, and `run: (g, a) => G.history(g, a.node)`. The dispatcher discovers it automatically; `handle()` needs no change.
   - **Consumes:** `G.history(graph, name)` (4)
   - **Produces:** `the seventh TOOLS entry`
6. **`cli/tests/graph-query.test.js`** — cover `history()`: ordering, the `node` filter, `delivered.sh` absent, `bash` absent.
   - **Consumes:** `G.history(graph, name)` (4)
7. **`cli/tests/graph-mcp.test.js`** — cover the seventh tool over JSON-RPC, and assert CLI and MCP return identical results for one query.
   - **Consumes:** the seventh `TOOLS` entry (5)

### Stage 4 — The consumers

8. **`.claude/commands/add-framework--shared-brainstorm.md`** + **`.opencode/` mirror** — **a genuinely new step at STEP 1.2**, before `@framework-discovery-agent` is dispatched; the resolved entries go into its payload. This command calls **no** graph command today (verified: zero `graph.js` occurrences), so this is new work, not an extension of an existing lookup. **The agent gets no new tool and no new file to read** — its `Glob, Read` allowlist is untouched, deliberately.
   **No `<!-- uses: -->` entry is added for `graph.js`, here or in items 9–11.** Root `scripts/` is not walked by `collectNodes()`, so `graph.js` is not a graph node and cannot be a declaration target. An executor must not invent one to "be consistent" with how product scripts are declared — the build would fail on a declaration naming an artefact that does not exist (`scripts/build.js:1059`).
   - **Consumes:** `G.history(graph, name)` (4)
9. **`.claude/commands/add-framework--self-plan.md`** + **`.opencode/` mirror** — STEP 2.1/2.2 gain the time axis beside the four `graph.js` calls already there (lines 112, 113, 137, 138). **An extension, not a new step.**
   - **Consumes:** `G.history(graph, name)` (4)
10. **`.claude/commands/add-framework--plan.md`** + **`.opencode/` mirror** — the lookup is **new work, added as a sub-step inside the existing `### 2.2 Investigate Framework Ecosystem`**, which is already where this command looks for prior art. It operates on the product layer, so the lookup passes `--layer product`.
    ⛔ **Do NOT insert a new top-level STEP 2.** `## STEP 2: Critical Analysis (MANDATORY)` already exists at line 150, STEPs 3–6 follow it with 16 internal cross-references to those numbers, and `.claude/skills/add-framework-development/SKILL.md:16` cites "`add-framework--plan` analyzing if a proposal is technically viable (STEP 0 and STEP 2)" **from outside the file**. A renumber would break all of it. Nesting inside 2.2 costs nothing and breaks nothing.
    - **Consumes:** `G.history(graph, name)` (4)
11. **`.claude/commands/add-framework--shared-review.md`** + **`.opencode/` mirror** — STEP 3.1b's blast-radius check gains "and this is what it superseded", beside the `graph.js impact --depth 1` call already at line 143. **An extension, not a new step.**
    - **Consumes:** `G.history(graph, name)` (4)

### Stage 5 — The map

12. **`CLAUDE.md`** — **four** edits, all describing what this plan lands, none speculative:
    - a row for `add-framework--done` in the internal commands table (`Internal commands (all under add-framework-- namespace)`). **Sub-prefix: framework default** — it carries no `self-` in its name, and unlike `self-plan`/`self-build` it is not paired with a product twin. **Purpose: "Close-out — gates, `gh` merge, index entry, cleanup".** Stated so the builder does not have to guess from the bare name;
    - a row in **Command scope by layer** (line 55), reading **"Git branches, PRs, `docs/delivered.jsonl`"** — this is the first internal command to operate on branches and PRs, so it sits beside `add-framework--release` rather than under the plan/build pairs;
    - a row for `history` in the graph query table;
    - the **Consumers.** paragraph (line 121), which today names `--self-plan`, `--sync` and `--shared-review`. Items 8 and 10 make `--shared-brainstorm` (STEP 1.2) and `--plan` (inside STEP 2.2, `--layer product`) consumers too. **Leaving it means CLAUDE.md ships saying the graph has three consumers while the tree has five** — the same doc-vs-code drift this whole delivery exists to catch, in the file that describes it.

    **The `docs/` tracking-policy paragraph is NOT touched** — see Validated Decisions.
    - **Consumes:** `the canonical body` (2); `G.history(graph, name)` (4)

## Impact

| Artefact | Action | Reason |
|----------|--------|--------|
| `.gitignore` | modify | One negation so the index is tracked without force-add (1) |
| `.claude/commands/add-framework--done.md` | **create** | The close-out the internal layer has never had (2) |
| `.opencode/commands/add-framework--done.md` | **create** | Adapter; its absence is ungated drift (3) |
| `scripts/graph.js` | modify | Seventh verb, and the file's first subprocess (4) |
| `scripts/artefact-graph-mcp.js` | modify | Seventh tool, additive (5) |
| `cli/tests/graph-query.test.js` | modify | Cover `history()` (6) |
| `cli/tests/graph-mcp.test.js` | modify | Cover the seventh tool and CLI↔MCP parity (7) |
| `.claude/commands/add-framework--shared-brainstorm.md` | modify | **New** STEP 1.2 lookup — no existing graph call to extend (8) |
| `.opencode/commands/add-framework--shared-brainstorm.md` | modify | Mirror (8) |
| `.claude/commands/add-framework--self-plan.md` | modify | STEP 2.1/2.2 time axis (9) |
| `.opencode/commands/add-framework--self-plan.md` | modify | Mirror (9) |
| `.claude/commands/add-framework--plan.md` | modify | New STEP 2 lookup (10) |
| `.opencode/commands/add-framework--plan.md` | modify | Mirror (10) |
| `.claude/commands/add-framework--shared-review.md` | modify | STEP 3.1b supersession awareness (11) |
| `.opencode/commands/add-framework--shared-review.md` | modify | Mirror (11) |
| `CLAUDE.md` | modify | Internal-commands row, Command-scope-by-layer row, graph-query row, and the **Consumers.** paragraph; `docs/` policy paragraph untouched (12) |
| `.claude/skills/add-framework-development/SKILL.md` | **none** | Its "(STEP 0 and STEP 2)" citation of `add-framework--plan` stays valid **only because** item 10 nests inside STEP 2.2 instead of renumbering. Listed here so the dependency is visible, not silent |
| `docs/plans/`, `docs/brainstorming/`, `docs/changelog/` | **none** | Read by `@framework-discovery-agent` and seven commands; deleting them blinds the discovery path |
| `framwork/.codeadd/**` | **none** | Product layer — owned by plan `2026-09-07T160328` |

## Execution Order

**0. The product plan's F3 (`delivered.sh`) must exist and be green first.** Every stage below either calls it or tests something that calls it. Starting here without it produces a command that cannot run and a verb that cannot be tested.

1. **Stage 1** — `.gitignore`. One line, no dependencies. Verify with `git check-ignore -v docs/delivered.jsonl` returning nothing.
2. **Stage 2** — the command and its adapter, **in the same commit**. Nothing in CI catches a missing mirror, so splitting them is how drift starts.
3. **Stage 3** — `graph.js` verb, then the MCP tool, then both test files. The tool cannot be written before the function it calls exists.
4. **Stage 4** — the four consumers, **each with its mirror in the same commit**. `--plan` and `--self-plan` are the HIGH-risk pair (depth-1 of 3 and 4); run `node scripts/build.js` after each to confirm no declaration broke. Two of the four (`--plan`, `--shared-brainstorm`) are new steps rather than extensions and cost more than the other two.
5. **Stage 5** — `CLAUDE.md`, last, describing what actually landed. Four edits; verify the Consumers paragraph names five consumers, not three.

**Safe stopping points.** Coherent at the end of **Stage 1** (a gitignore line, inert), **Stage 3** (a verb nobody calls yet) and **Stage 4**. **Not** coherent mid-Stage 2: a canonical command without its adapter is silent drift.

**Verification after every stage:** `node scripts/build.js` && `npm test` && `npm --prefix cli run test:package` && `npm run test:scripts`.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| What gates `/add-framework--done`? | CI's own four commands, with working directories attached, plus a complete build ledger and a `PASS` review verdict | A green gate and a green PR become the same statement. `converge-gates.sh` is a category error — it needs `epic.md`, `review-NNN.md` and a root `manifest.json` the internal layer does not have |
| Is `GAPS_FOUND` a pass? | **No.** HARD STOP | Its definition is unresolved high-severity findings; merging over them indexes them as delivered |
| Does `graph.js history` parse the index itself? | **No** — it shells out to `delivered.sh read` | Otherwise two implementations of last-line-wins over one format: plan 0075's subject, recreated inside a design that cites it |
| How is `delivered.sh` invoked from Node? | `bash <path>`, explicitly, never direct execution | Windows is the primary platform; a shebang file is not executable by process creation there. `graph.js` has never spawned a subprocess, so there is no existing pattern to copy |
| What does the agent read? | Nothing new — resolved results travel in its dispatch payload | Avoids a third parser in an agent's head and leaves the `Glob, Read` allowlist intact, which this repo treats as a method boundary |
| Which consumers get a new step and which get an extension? | **New step: `--plan` and `--shared-brainstorm`** (zero `graph.js` calls each). **Extension: `--self-plan`** (four calls) and **`--shared-review`** (one, at line 143) | Measured, not assumed. Scoping the two new ones as extensions would under-budget half the consumer work |
| What does the close-out delete? | The worktree, the branch, and `docs/evidence/` — nothing else | `docs/plans/` is read by `@framework-discovery-agent` and seven commands. The internal relief is retiring force-add, not deleting |
| Does `CLAUDE.md`'s `docs/` policy change here? | **No.** Only the three table rows and the Consumers paragraph | The policy may change only after `git show main:docs/delivered.jsonl \| grep '"layer":"internal"' \| grep '"by":"done"'` returns something. Reversing that order deletes the record of the window when nothing else records it |
| Is the index tracked by force-add? | **No** — one `.gitignore` negation | Force-add is the mechanism that resurrected seven deleted plans |
| Is `0001`–`0078` backfilled? | **No** | A partially-populated index makes absence mean two things |

---

## Next Steps

/add-framework--self-build delivery-index-internal

⛔ **Blocked until `/add-framework--build delivery-index` has landed `delivered.sh`** — see Execution Order step 0.
