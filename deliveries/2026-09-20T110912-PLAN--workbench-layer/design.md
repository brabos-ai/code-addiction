# Brainstorm: The workbench layer — the framework's own pipeline, built for more than one provider

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-20
> **Type:** architecture

## Objective

Today the framework's own development pipeline exists only as `.claude/` at the repository root,
written in the one format Claude Code reads. When this is done those artefacts will have a source root
of their own, a build of their own, and the development of code-addiction will be workable from
OpenCode — inside this repository.

## Discovery

- **`add-framework-internal-layer`** — states the rule this whole set revises: internal artefacts are
  "NOT distributed to users", never registered in `provider-map.json`, "no provider mirror". It is the
  decision node, and it has to be rewritten rather than merely extended.
- **`add-framework-development`** and the comment at `scripts/build.js:983` say the same thing
  independently. Three separate statements of one invariant — this was a deliberate design, not an
  offhand choice, and the set must say why it changes.
- **`scripts/build.js`'s cross-layer gate (lines 1232–1285)** fails the build when a distributed
  artefact names an `add-framework--` command. Its stated reason is "it ships to nobody". The reason
  survives this change — the workbench still ships to nobody — but the gate's wording assumes the
  internal layer has no provider output, and that assumption stops being true.
- **`2026-09-17T124433-PLAN--build-end-to-end-non-claude` [live]** fixed three concrete breaks running
  the pipeline outside Claude Code: a PowerShell-only shell policy, Claude-only `model:` names shipped
  to other dialects, and a dirty-tree false halt. All product layer. The same class of break is what
  topic 002 exists to find in the workbench.
- **`2026-09-17T132658-PLAN--opencode-dispatch-and-gitnexus-repo` [live]** fixed OpenCode subagent
  dispatch. Direct precedent, product layer only.
- **`2026-09-13T100745-PLAN--readonly-agent-dispatch-capability` [live]** established `AGENT_DIALECTS`
  in `scripts/build.js` — per-provider translation of `readonly:` (OpenCode `permission: edit: deny`,
  Cursor `readonly: true`, Claude verbatim). It runs only over `provider-map.json`-registered product
  agents. The internal agents carry hand-written dialect comments with no build-time translation.
- **The delivery index holds nothing `gone` or `superseded` in this direction.** Nobody has tried to
  relocate `.claude/` or to give the internal layer a provider mirror. Novel territory.

## Context & Motivation

The repository maintains two layers with one set of tools. The product layer is compiled to fifteen
provider directories by `scripts/build.js`; the internal layer is hand-written Claude Code markdown at
the root and compiled to nothing. That asymmetry was correct while the internal layer had exactly one
reader.

It stopped being correct when the author began working in OpenCode. The framework distributes to five
MCP-capable providers and asserts they are interchangeable — but the work of *building* it is locked
to one of them. Every skill in the pipeline (`add-framework--brainstorm` through `--done`), every
support skill (`add-build-ledger`, `add-plan-authoring`, `add-artefact-graph`, `building-commands`) and
every internal agent is reachable only from Claude Code.

The cost is not theoretical. `add-framework--brainstorm` instructs the agent to "ask through the
provider's structured-question tool" and justifies having no fallback with the sentence *"the internal
layer ships to one provider, so there is no capability flag to check and no markdown fallback to keep."*
That sentence is load-bearing, and it is exactly what this set invalidates.

## Problem / Opportunity

Three things are wrong today, and they are the three topics.

1. **There is no source/output split in the internal layer.** `.claude/` is simultaneously the source
   of truth, the Claude Code runtime directory, and the home of `settings.json` and `agent-memory/`.
   Nothing can be generated into it because nothing distinguishes what is authored from what is built.
2. **The artefacts assume Claude Code in their text.** Structured questions, the `Skill` tool by name,
   `model:` values, `readonly:` frontmatter, slash-command invocation. Generating an `.opencode/` copy
   of a skill that says "ask through the provider's structured-question tool" produces a file that
   exists and does not work.
3. **A second build path has no gates.** `scripts/build.js` is covered by the `cli/` suite and runs in
   CI on every push. A new `build-workbench.js` would start with none of that, and its output is
   gitignored — the failure mode the repository already names: invisible locally, invisible in review.

The opportunity is narrower than it looks, and that is what makes it tractable: **the target is this
repository only.** Nothing has to be generic. `add-framework--sync` may keep hardcoding `web/` and
`add-framework--release` may keep hardcoding `cli/package.json`, because the only project that will
ever install the workbench is the one those paths are true in.

## Proposed Solution

A `workbench/` source root, a dedicated build script that reuses `scripts/build.js` rather than
copying it, and provider outputs written straight into the repository root.

```
workbench/
  provider-map.json      <- its own registry: claude -> .claude, opencode -> .opencode
  commands/              <- source, tracked
  skills/
  agents/

scripts/build-workbench.js   <- requires ./build.js, ~150 lines, no duplicated transformation

repository root/
  .claude/commands|skills|agents/      <- generated, gitignored
  .opencode/commands|skills|agents/    <- generated, gitignored
  .claude/settings.json                <- authored, still tracked
  opencode.json                        <- authored, still tracked
```

### Why a separate script rather than extending `build.js`

`scripts/build.js` is 2161 lines, ends with `if (require.main === module) main()`, and already exports
`buildResources`, `resolveResourcePaths`, `stripHtmlComments`, `TRANSFORMERS`, `METADATA`,
`AGENT_DIALECTS`, `pruneStaleOutputs` and `readMap`. The entire build is driven by a `map` — a
`provider-map.json`. A second entry point supplying its own map and its own source strategies therefore
reuses every transformation verbatim while staying out of the release path.

⛔ **`buildResources` needs no change to `scripts/build.js` at all, and topic 001 must not go looking
for one.** `buildResources(map, strategy)` takes an arbitrary strategy object and reads no
module-level path constant. The existing `commandStrategy` (line 1672), `skillStrategy` (1685) and
`agentStrategy` (1848) each hardcode `path.join(ROOT, 'framwork', '.codeadd', …)` inside their own
`sourcePath` — none of them reads the `CODEADD_DIR` constant. `CODEADD_DIR` (line 331) is a default
argument on the graph-building functions only: `collectNodes`, `buildArtefactGraph`, `collectContract`
and `assertNoLintableSources`.

So `build-workbench.js` authors its own `workbenchCommandStrategy`, `workbenchSkillStrategy` and
`workbenchAgentStrategy` — new `sourcePath` functions pointing at `workbench/` — and calls the
imported, unmodified `buildResources`. The only `CODEADD_DIR`-adjacent work in this set is
`collectNodes` / `buildArtefactGraph`'s already-parameterised `codeaddDir` and `internalDir`
arguments, and that is the graph root, which belongs to **topic 003**, not 001.

This is the distinction that makes the choice safe. A separate script that **duplicated** the
transformation would recreate the drift the repository already documents: `ENTRY_POINT_KINDS`,
`DEPENDENCY_TYPES` and `ORPHAN_DEPENDENCY_TYPES` exist in both `scripts/graph.js` and `mcp/engine.mjs`,
which cannot import each other, and only `cli/tests/mcp-engine.test.js` holds them together. Here the
import is available, so isolation costs nothing.

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Extend `scripts/build.js` to walk `workbench/` too** | Puts a second layer's failure inside the release path. A bug in workbench compilation would fail `node scripts/build.js` in `release.yml` and block a product release that has nothing to do with it. |
| **Mirror `framwork/`: source in `workbench/.codeadd/`, output in `workbench/.claude/`, an installer copies to root** | Symmetric and defensible, but it adds a copy step and a second place for the same file to go stale — for no gain, since the only consumer is this checkout. Rejected by the author. |
| **`--workbench` flag on `npx codeadd install`** | The author's original framing. Rejected on a concrete ground: `npx codeadd install` downloads a **release ZIP from GitHub**. Using it here would tie the internal development cycle to the release cycle — edit an internal skill, cut a tag to see it run. |
| **Point providers at `workbench/.opencode/` in place** | Depends on each provider accepting a non-default config root. Most do not. |

## Type of Artefact

architecture — a new source root, a new build entry point, a new registry, and a revision of the rules
that three existing skills state.

## Scope

### Includes

- A `workbench/` source root holding the current contents of `.claude/{commands,skills,agents}/`.
- `workbench/provider-map.json` — its own registry, targeting **claude and opencode**.
- `scripts/build-workbench.js`, importing `scripts/build.js` and supplying its own three source
  strategies. **It requires no edit to `scripts/build.js`** — see the note under Proposed Solution.
- Porting the artefacts themselves off Claude-only mechanisms — structured questions, `Skill` tool by
  name, `model:` values, `readonly:` translation, slash-command invocation.
- The literal `.claude/` references inside the artefacts: **50 occurrences on 48 lines across 13
  files**, counted with `grep -rno "\.claude/" .claude/{commands,skills,agents} --include=*.md`. The
  heaviest are `add-framework--build`, `add-framework-development` and `add-framework-internal-layer`
  at 9 lines each. 001 turns this into a migration checklist and recounts before starting, because the
  set will have shifted by then.
- `scripts/build.js`'s three root-`.claude/` read sites, and `mcp/corpora.mjs:572`.
- `.gitignore`, `CLAUDE.md`, and the `cli/tests/` fixtures that build a graph from a `.claude` tree.
- The one-way transition: `.claude/` stops being tracked source and becomes generated output.
- CI coverage for the new build path.

### Does NOT Include

- **Any provider beyond claude and opencode.** cursor, codex and antigrav become rows in
  `workbench/provider-map.json` later. Codex has no slash commands and takes TOML agents; antigrav
  receives no agents at all — both are real work and neither is wanted now.
- **Installing the workbench into any other repository.** The target is this checkout. No ZIP
  packaging, no `npx` flag, no manifest entry, no `cli/src/` change.
- **Making the artefacts generic.** `add-framework--sync` keeps `web/`; `add-framework--release` keeps
  `cli/package.json`; the four `*-analyzer` agents keep their hardcoded paths. Under a
  this-repository-only target, repo-specific is correct, not a defect.
- **Renaming `framwork/`.** The typo is deliberate and out of scope.
- **Moving `mcp/`.** It is product-layer source at the root and stays there.
- **Changing the product layer's build, registry or distribution in any way** beyond exporting or
  parameterising what `build-workbench.js` needs.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| The target is this repository only, not other projects | the "workable from OpenCode" half | Removes the generic/repo-specific split entirely. `add-framework--sync` hardcoding `web/` is correct when the only installer is the repo `web/` lives in | ✅ |
| The source root is named `workbench/` | the "source root of its own" half | Names what the directory is — where the tool is worked on, not the tool. `management/` reads as project management; `internal/` says nothing about the contents. Pairs legibly: `framwork/` produces, `workbench/` builds | ✅ |
| Source in `workbench/{commands,skills,agents}/`, output straight into the root provider directories | the "source root of its own" half | One level, no copy step. The only consumer is this checkout, so an intermediate output directory would be a second place to go stale | ✅ |
| A separate `scripts/build-workbench.js` that **imports** `scripts/build.js` | the "a build of its own" half | Isolation from the release path without duplicating the transformation. `build.js` already guards `require.main === module` and already exports what is needed, so the import is free and the drift hazard does not arise | ✅ |
| The workbench gets its own `workbench/provider-map.json` | the "a build of its own" half | The build is registry-driven. A second registry is what lets a second source root reuse `buildResources` unchanged, and it keeps product distribution untouched | ✅ |
| No `npx` flag, no release packaging — the build **is** the install | the "workable from OpenCode" half | `npx codeadd install` downloads a release ZIP. Routing internal development through it would mean tagging a release to test a one-line skill edit | ✅ |
| claude and opencode only, for now | the "workable from OpenCode" half | Porting is per-provider work, and OpenCode already has a delivered dispatch precedent. Three more providers is cost against providers the author does not open | ✅ |
| `.gitignore` ignores `commands/`, `skills/` and `agents/` inside each provider directory — never the directory itself | the "source root of its own" half | `.claude/settings.json` is authored and tracked, and `opencode.json` already shows the correct shape by living outside `.opencode/`. Ignoring the whole directory would untrack real configuration | ✅ |
| The set is three topics, refined separately | both halves | 001 makes the outputs exist; 002 makes them work; 003 keeps them correct. 001 → 002 and 001 → 003 are hard dependencies | ✅ |

## Decomposition Map

| Subtopic | Design Path | Serves the objective by | Purpose |
|----------|-------------|-------------------------|---------|
| The source root and the build | `2026-09-20T105430-workbench-layer-001-source-root-and-build.md` | giving the artefacts a source root of their own and making the per-provider outputs exist — without it no other provider has anything to read | `workbench/` layout, `workbench/provider-map.json`, `scripts/build-workbench.js` and its three own source strategies (no edit to `build.js`), the 50 literal `.claude/` occurrences, `.gitignore`, and the one-way transition of `.claude/` from tracked source to generated output |
| Portability of the artefacts | `2026-09-20T105430-workbench-layer-002-provider-portability.md` | making what was generated actually run outside Claude Code, which is the half of the objective a file that merely exists does not satisfy | Structured questions where `structuredQuestions: false`, the `Skill` tool named in text, `model:` values, `readonly:` translation through `AGENT_DIALECTS`, subagent dispatch, and slash-command invocation |
| The update cycle and the gates | `2026-09-20T105430-workbench-layer-003-cycle-and-gates.md` | keeping the new path correct after it lands, so a build nobody runs and a gate nobody wrote do not quietly undo the first two | When the workbench build runs, what CI asserts about it, `scripts/build.js`'s three root-`.claude/` read sites, `mcp/corpora.mjs:572`, `CLAUDE.md`, the `cli/tests/` fixtures, and the cross-layer gate's wording |

**This third topic changed shape during exploration.** It entered as "the `--management` flag on `npx
codeadd install`" and left as the update cycle, because the installer was ruled out on the ground that
it downloads a release ZIP. What remains once there is no installer is the honest question: with the
build as the only install step, what makes sure it is run and stays right.

## Dependencies & Relationships

**Order: 001 → 002 → 003.** Both dependencies run out of 001.

- **001 → 002.** There is nothing to port until a non-Claude output exists to port into. Attempting 002
  first would be editing Claude markdown against a provider that has no copy of it.
- **001 → 003.** The gates in 003 assert over a build path and an output tree that 001 creates.
- **002 and 003 are independent of each other** and could be planned in either order, but 002 is the one
  that decides whether the objective is met at all. A `.opencode/` tree that exists and does not work is
  the failure this set is most likely to ship, so it is refined second, not last.

One relationship crosses out of the set: **`scripts/build.js` is touched by both 001 and 003**, for
different reasons — 001 needs it to export or parameterise its source root, 003 needs its three
root-`.claude/` read sites moved. Whichever is planned first must say so, or the second will find the
file already changed and read that as a conflict.

## Ecosystem Impact

Every internal artefact moves, so the table below records what **depends on** them. The graph answered
for all of them, and the answer has one shape: **every dependant of every internal artefact is itself
internal.** Nothing in the product layer depends on any of them — which the cross-layer gate at
`scripts/build.js:1232` is what enforces. The layer is a closed set, so relocating it as a whole breaks
no product artefact.

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add-framework--brainstorm` (skill) | nothing — entry point | Moves; its structured-question approval gate is the sharpest portability case in the set | 001 + 002 |
| `add-framework--plan` (skill) | `add-framework--brainstorm` (HANDS_OFF_TO), `add-framework--build` | Moves; ports | 001 + 002 |
| `add-framework--build` (skill) | `add-framework--done`, `add-framework--plan` (HANDS_OFF_TO), `building-commands` | Moves; ports. Its layer tags must learn `[workbench]` alongside `[internal]`/`[product]` | 001 + 002 |
| `add-framework--done` (skill) | `add-framework--build` (HANDS_OFF_TO) | Moves; ports | 001 + 002 |
| `add-artefact-graph` (skill) | 11 internal artefacts — the hub of the layer | Moves; the graph it describes changes root | 001 + 003 |
| `add-final-report` (skill, internal) | 9 internal artefacts | Moves; ports | 001 + 002 |
| `building-commands` (skill) | `prompt-review-agent`, `add-framework--build`, `add-framework-development`, `add-framework-internal-layer`, `add-framework-product-layer` | Moves; owns the dispatch rules 002 revises | 001 + 002 |
| `add-review-discipline` (skill, internal) | `add-framework--brainstorm`, `--build`, `--plan`, `add-plan-authoring` | Moves | 001 |
| `add-plan-authoring` (skill) | `add-framework--build`, `--done`, `--plan` | Moves | 001 |
| `add-build-ledger` (skill) | `add-framework--build`, `--done` | Moves | 001 |
| `add-framework-development` (skill) | `add-framework--build`, `add-framework-internal-layer`, `add-framework-product-layer` | Moves; **states the "NOT distributed" rule that this set revises** | 001 |
| `add-framework-internal-layer` (skill) | `add-framework--build` | Moves; **is the decision node for "no provider mirror" and must be rewritten** | 001 |
| `add-framework-product-layer` (skill) | `add-framework--build` | Moves; unchanged in substance | 001 |
| `add-commit` (skill, internal) | `add-build-ledger`, `add-framework--done`, `add-framework-development` | Moves | 001 |
| `add-framework--sync` (command) | `add-framework--build` (HANDS_OFF_TO) | Moves; keeps its `web/` and `README.md` paths | 001 |
| `add-framework--release` (command) | `add-framework--sync` (HANDS_OFF_TO) | Moves; keeps `cli/package.json` and the `main → production` model | 001 |
| `add-framework--roadmap` (command) | nothing — entry point | Moves | 001 |
| `framework-discovery-agent` | `add-framework--brainstorm`, `--plan` (DISPATCHES) | Moves; needs `AGENT_DIALECTS` translation it has never had | 001 + 002 |
| `plan-review-agent` | `add-framework--brainstorm`, `--plan`, `add-plan-authoring`, `add-review-discipline` (DISPATCHES) | Moves; hand-written dialect comments become build-time translation | 001 + 002 |
| `plan-readback-agent` | `add-framework--build`, `add-review-discipline` (DISPATCHES) | Same | 001 + 002 |
| `prompt-review-agent` | `add-framework--build`, `--plan`, `add-review-discipline` (DISPATCHES) | Same | 001 + 002 |
| `readme-analyzer`, `svg-analyzer`, `web-docs-analyzer`, `web-index-analyzer` | `add-framework--sync` (DISPATCHES) | Move; keep their hardcoded repo paths | 001 |

### What the graph cannot see, asked by hand

Per `add-artefact-graph`'s standing list, four categories of consumer produce no node. Each was read
directly:

| Consumer | Where | Impact |
|---|---|---|
| `scripts/build.js` | `collectNodes` (798, 983) and `buildArtefactGraph` (1054) read `path.join(ROOT, '.claude')` | The graph's internal corpus must point at `workbench/` |
| `mcp/corpora.mjs` | line 572, `roots: ['framwork/.codeadd', '.claude']` | The docs corpus stops indexing the internal layer unless changed |
| `CLAUDE.md` | the Internal Layer anatomy table | Not a node; nothing gates it. Must be edited by hand |
| `.gitignore` | `.claude/agent-memory/`, and the new provider-output rules | Must be rewritten for the source/output split |
| `cli/tests/` | `build-artefact-graph.test.js`, `helpers/tree-fixture.js` and others build a graph from a `.claude` tree | Fixtures follow the corpus root |
| The artefacts themselves | 50 literal `.claude/` occurrences on 48 lines across 13 files | Each is either a path that moves or a path that was always about the generated output |

**Fragments were checked and do not apply.** Feature and plugin fragments inject into product commands
only; no fragment targets an internal command, so the second query `add-artefact-graph` requires for
fragment-injected commands returns nothing here.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| The framework's own pipeline runs in OpenCode, so the tool is no longer built only in the one provider it claims not to privilege | A build step between editing an internal skill and running it. Today the file *is* the runtime; afterwards it is compiled |
| A real source/output split in the internal layer, which is what makes any further provider a row in a JSON file | A second build path to keep correct, with its own gates and its own CI cost |
| The internal artefacts get `AGENT_DIALECTS`-grade frontmatter translation they have never had | The hand-written dialect comments in the four internal agents become dead text that must be removed, not left to contradict the generated output |
| Dogfooding: the framework's distribution machinery finally runs over the framework's own tools | Three skills that state "the internal layer is not distributed" must be rewritten, and that invariant was stated three times on purpose |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| `.claude/` moving from tracked source to generated output needs `git rm -r --cached` and is not reversible by accident. A half-done transition leaves files both tracked and regenerated, and git will not ignore an already-tracked path | High | 001 owns the transition as an explicit, ordered step with the `git rm -r --cached` named. The repository has been bitten by exactly this class of `.gitignore` subtlety before — the `/.codeadd/` leading-slash comment records it |
| A generated `.opencode/` tree that exists and does not work. The skills instruct the agent to use a structured-question tool OpenCode does not have, and `add-framework--brainstorm` explicitly justifies having no fallback | High | 002 is the whole topic, and it is refined second rather than last for this reason. Its acceptance is a real run of the pipeline from OpenCode, not a file listing |
| The new build path has no CI and its output is gitignored — invisible locally and invisible in review, which is the failure `pruneStaleOutputs`' own comment names | Medium | 003 owns the gates. At minimum `build-workbench.js` runs in `ci.yml` and the `cli/` suite covers it the way it covers `build.js` |
| `mcp/corpora.mjs:572` silently stops indexing the internal layer, degrading every discovery query in the pipeline without an error | Medium | Listed in 003's scope explicitly; it produces no node, so nothing else will catch it |
| The cross-layer gate at `build.js:1232` reads as contradicted. Its reason — the internal layer ships to nobody — still holds, but its wording assumes no provider output exists | Medium | 003 revises the wording and keeps the gate. It is not removed: the workbench still ships to no user |
| Scope creep back toward "install into any repo". The generic/repo-specific split is seductive and was explicitly ruled out | Medium | The Does NOT Include section names it. Any F-block that makes an internal artefact generic is out of scope by this document |
| `scripts/build.js` is touched by both 001 and 003 | Low | Stated in Dependencies & Relationships. Whichever plans first declares the change |

## Next Steps

Run: `/add-framework--plan the workbench layer`
