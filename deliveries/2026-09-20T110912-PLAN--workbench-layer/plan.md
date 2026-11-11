# Plan: The workbench layer — the framework's own pipeline, built for more than one provider

> **Status:** draft
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-09-20
> **Delivery:** automatic

---

## Objective

Today the framework's own development pipeline exists only as `.claude/` at the repository root,
written in the one format Claude Code reads. When this is done those artefacts will have a source root
of their own, a build of their own, and the development of code-addiction will be workable from
OpenCode — inside this repository.

**When this build is done:** the 25 internal artefacts live in `workbench/` as source, `node
scripts/build-workbench.js` compiles them into `.claude/` and `.opencode/` at the repository root, and
the pipeline can be driven from OpenCode with the graph reachable and the read-only agents still
read-only. The two skills that assert the internal layer is never distributed say what is now true
instead.

## Context

The repository distributes to five MCP-capable providers and asserts they are interchangeable, but the
work of *building* it is locked to Claude Code. Every pipeline skill, every support skill and every
internal agent is reachable only there. The author works in OpenCode.

The cost is concrete, not theoretical. `add-framework--brainstorm` instructs the agent to "ask through
the provider's structured-question tool" and justifies having no fallback with the sentence *"the
internal layer ships to one provider, so there is no capability flag to check and no markdown fallback
to keep."* That sentence is load-bearing and this plan invalidates it.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-20T105430-workbench-layer-000-umbrella.md` | The `workbench/` name and layout, the separate-script decision and its rationale, the four rejected alternatives, the three-topic decomposition with its dependency order, the full ecosystem-impact table and the risk register |
| `docs/brainstorming/2026-09-20T105430-workbench-layer-intent.md` | `path: architectural`, `delivery: automatic`, the ten closed decisions, `## Open: None`, and the isolated-worktree instruction |

## Global Constraints

- **Deliver in an isolated git worktree** (intent file, `## Decided`) — already created at
  `.claude/worktrees/feat+workbench-layer`
- **claude and opencode only.** cursor, codex and antigrav are out (umbrella, Key Decisions)
- **`mcp/` is at the repository root and is PRODUCT** (`add-plan-authoring`, Layer Tags)
- **"HTML comments (`<!-- -->`) are stripped at build.** Use them for source-only notes. Injection
  markers and `<!-- uses: -->` blocks rely on this." (`CLAUDE.md`, Pipeline)
- **"Never write a raw `.codeadd/` path.** Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`;
  `lintResourcePaths()` warns otherwise. Scripts are the exception — always `.codeadd/scripts/`."
  (`CLAUDE.md`, Pipeline)
- **`node scripts/build.js` exits 0 and emits no new warning** (`CLAUDE.md`, Pipeline)
- **The product layer's build, registry and distribution do not change** beyond what F13, F18 and F19
  touch for the graph root and the gate wording (umbrella, Does NOT Include)

## Problem

1. **No source/output split in the internal layer** — `.claude/` is at once the source of truth, the
   Claude Code runtime directory, and the home of `settings.json` and `agent-memory/`. Nothing can be
   generated into it because nothing separates what is authored from what is built.
2. **The artefacts name Claude Code in their own text** — structured questions, the `Skill` tool,
   `model:` values, `readonly:` frontmatter, slash-command invocation, and 50 literal `.claude/`
   paths. A generated `.opencode/` copy would exist and not work.
3. **A second build path would start with no gates** — `scripts/build.js` is covered by the `cli/`
   suite and runs in CI on every push. Its output is gitignored, which the repository already names as
   the failure mode: invisible locally, invisible in review.
4. **On OpenCode the graph would be unreachable** — `opencode.json` carries no `mcp` block, and the
   opencode agent dialect translates `readonly: true` into `permission: bash: deny`.
   `framework-discovery-agent` declares `Bash` deliberately, as its route to `node scripts/graph.js`
   when MCP is absent. Both routes closed at once is what `add-artefact-graph` calls being *"blind to
   all eleven"* verbs.

## Proposal

A `workbench/` source root, a dedicated build entry point that imports `scripts/build.js` rather than
copying it, provider output written straight into the repository root, and the artefacts themselves
ported off Claude-only mechanisms.

Three phases, in the umbrella's dependency order: **001 makes the output exist, 002 makes it work, 003
keeps it correct.** The repository is in a working state at each phase boundary.

**The transformation machinery is reused verbatim and measured, not assumed.** `resolveResourcePaths`
was executed against a workbench-shaped registry during analysis and resolved `{{cmd:add-framework--sync}}`
to `.claude/commands/add-framework--sync.md` and `.opencode/commands/add-framework--sync.md` with no
change to `scripts/build.js`. That is why F4 converts the 50 literals into the existing
`{{cmd:}}`/`{{skill:}}` convention instead of rewriting paths by hand.

## Current State

| Artefact | Today | Direct dependants (graph, depth 1) |
|---|---|---|
| `.claude/skills/` — 14 skills | Hand-written Claude markdown, compiled to nothing | all internal; `add-artefact-graph` has 11, `add-final-report` 9, `building-commands` 5 |
| `.claude/commands/` — 3 commands | **No frontmatter at all** — they start at `# Title` | `add-framework--sync` ← `--build`; `--release` ← `--sync`; `--roadmap` ← nothing |
| `.claude/agents/` — 8 agents | Rich Claude frontmatter: `model:`, `memory: project`, `tools:` with `mcp__artefact-graph__*`, `disallowedTools`, `readonly:` | all internal, via `DISPATCHES` |
| `scripts/build.js` | 2161 lines; guards `require.main === module`; exports `buildResources`, `resolveResourcePaths`, `TRANSFORMERS`, `METADATA`, `AGENT_DIALECTS`, `pruneStaleOutputs`, `readMap` | produces no node — nothing reports what depends on it |
| `.mcp.json` | Registers `artefact-graph` for Claude only | — |
| `opencode.json` | `permission` block only. **No `mcp` block** | — |

**Every dependant of every internal artefact is itself internal.** Nothing in the product layer depends
on any of them, which the cross-layer gate at `scripts/build.js:1232` enforces. The layer is a closed
set, so relocating it whole breaks no product artefact. **Risk grade for the move itself: LOW per
artefact, and the blast radius does not leave the layer.**

**What the registry must carry, measured per strategy:**

| Kind | Registry entry | Why |
|---|---|---|
| Commands | `description` required for all 3 | `commandStrategy.meta` reads `entry.description`, and the sources carry no frontmatter for the build to pass through |
| Skills | the key alone, `{}` | `skillStrategy.transform` is passthrough and `meta` is `{name}`. All 14 already carry `name:` and `description:` |
| Agents | `description` required for all 8 | `agentStrategy.meta` reads `entry.description`. `readonly` comes from the source frontmatter (`build.js:1876`), not the registry |

## Scope

### Includes

#### T1 — The source root and the build (ref: umbrella, Proposed Solution)

- **F1** [internal] — `workbench/{commands,skills,agents}/`: create the source root and `git mv` the
  25 artefacts out of `.claude/`. Skill subdirectories move whole, `references/` included. Must NOT
  move `.claude/settings.json`, `.claude/agent-memory/` or `.claude/worktrees/` — they are authored or
  runtime state, not artefacts.
  - **Produces:** `workbench/{commands,skills,agents}/` holding 3 commands, 14 skill directories and 8 agents
- **F2** [internal] — `workbench/provider-map.json`: create the registry. `providers.claude.dir =
  ".claude"`, `providers.opencode.dir = ".opencode"`, both with `commands: "commands/{name}.md"`,
  `skills: "skills/{name}/SKILL.md"`, `agents: "agents/{name}.md"` and the capability blocks copied
  from `framwork/provider-map.json`. 3 command entries with `description`, 14 skill keys as `{}`, 8
  agent entries with `description`. Must NOT register any artefact in `framwork/provider-map.json`.
  - **Consumes:** `workbench/{commands,skills,agents}/` holding 3 commands, 14 skill directories and 8 agents (F1)
  - **Produces:** `workbench/provider-map.json` with `providers.claude.dir = ".claude"` and `providers.opencode.dir = ".opencode"`
- **F3** [internal] — `scripts/build-workbench.js`: create the entry point. `require('./build.js')`,
  author `workbenchCommandStrategy`, `workbenchSkillStrategy` and `workbenchAgentStrategy` whose
  `sourcePath` points at `workbench/`, call the imported `buildResources` and `pruneStaleOutputs`.
  Must NOT duplicate any transformation logic and must NOT edit `scripts/build.js`.
  - **Consumes:** `workbench/provider-map.json` with `providers.claude.dir = ".claude"` and `providers.opencode.dir = ".opencode"` (F2)
  - **Produces:** `node scripts/build-workbench.js` writes `.claude/{commands,skills,agents}/` and `.opencode/{commands,skills,agents}/`
- **F13** [internal] — `scripts/build.js`, the `.claude` construction at `collectNodes` **line 983**
  (`path.join(internalDir, '.claude')`): point the internal corpus at `workbench/`. That is the single
  functional site — line 798 is a JSDoc `@param` whose text goes stale and should be corrected with
  it, and `buildArtefactGraph` (1054) only forwards `internalDir`, holding no `.claude` literal at
  all. Must NOT change the `codeaddDir` default or anything about the product corpus.
  - **Consumes:** `workbench/{commands,skills,agents}/` holding 3 commands, 14 skill directories and 8 agents (F1)
  - **Produces:** the artefact graph's `internal/*` nodes resolve to paths under `workbench/`

  ⛔ **This lands BEFORE the first `build-workbench.js` run, and that ordering is load-bearing.**
  `buildResources` calls `stripHtmlComments` unconditionally (`build.js:1631`), so every generated
  copy has its `<!-- uses: -->` block erased. Until this F-block lands, `collectNodes` still reads the
  physical `.claude/` — which the first build turns into output with no `uses:` blocks left.
  `extractUses` returns `[]` on a missing block with no error and no warning, so the whole internal
  half of the graph would silently lose every declared edge, on `scripts/graph.js` and the MCP alike.
  Both read the same emitted sidecar, so there is no second opinion to catch it. **A build that ran
  F3 without F13 would grade every later F-block's blast radius against an empty graph.**

- **F4** [internal] — the 50 literal `.claude/` occurrences across 13 files under `workbench/`:
  convert each to `{{cmd:NAME}}` or `{{skill:NAME/FILE}}`. Must NOT convert an occurrence that is
  about the generated output as a path on disk rather than a reference to an artefact — recount and
  classify each before editing. `workbench/skills/add-artefact-graph/SKILL.md` is the case to watch:
  it documents paths rather than referencing them.
  - **Consumes:** `workbench/{commands,skills,agents}/` holding 3 commands, 14 skill directories and 8 agents (F1)
- **F5** [internal] — `.gitignore`: add `/.claude/commands/`, `/.claude/skills/`, `/.claude/agents/`,
  `/.opencode/commands/`, `/.opencode/skills/`, `/.opencode/agents/`, then `git rm -r --cached` the
  tree F1 moved. Must NOT ignore `.claude/` or `.opencode/` as whole directories — `.claude/settings.json`
  is authored and tracked, and `opencode.json` already shows the correct shape by sitting outside
  `.opencode/`. **Leading slashes are load-bearing**, for the reason the existing `/.codeadd/` comment
  in this same file records.
  - **Consumes:** `node scripts/build-workbench.js` writes `.claude/{commands,skills,agents}/` and `.opencode/{commands,skills,agents}/` (F3)
- **F6** [internal] — `package.json`: add `"build:workbench": "node scripts/build-workbench.js"`.
  Must NOT change the existing `build` script.

#### T2 — Portability of the artefacts (ref: umbrella, Problem 2)

- **F7** [internal] — `opencode.json`: add an `mcp` block registering `artefact-graph` as
  `node mcp/server.mjs --corpus=artefacts`, matching `.mcp.json`. Must NOT remove the existing
  `permission` block.
  - **Produces:** `opencode.json` carries an `mcp` entry named `artefact-graph`
- **F8** [internal] — `scripts/build.js`, `AGENT_DIALECTS.opencode`: stop emitting `bash: deny` when
  the agent's source frontmatter declares `Bash` in `tools:`. `edit: deny` is unconditional and stays
  — it is what makes read-only hold. Must NOT change the claude, cursor or codex dialects, and must
  NOT change what any currently-registered product agent emits unless that agent declares `Bash`.
  - **Produces:** `AGENT_DIALECTS.opencode` omits `bash: deny` for a source declaring `Bash` in `tools:`
- **F9** [internal] — `workbench/skills/add-framework--brainstorm/SKILL.md`: replace the
  structured-question assumption at `### 4.2` and `### 7.3`. The sentence "the internal layer ships to
  one provider, so there is no capability flag to check and no markdown fallback to keep" is false
  after F1–F3 and must go. Add the capability check and the markdown fallback, on the pattern the
  product layer already uses. Must NOT weaken the rule that every question carries a recommendation,
  nor the three-option approval at 7.3.
- **F10** [internal] — `workbench/skills/` where `Skill tool` and slash invocation are named by their
  Claude names — `add-framework--brainstorm`, `--plan`, `--build`, `--done`: state the action rather
  than the Claude tool. Must NOT weaken any `⛔ DO NOT invoke` gate; the prohibition stays, only the
  vocabulary becomes provider-neutral.
- **F11** [internal] — `workbench/skills/add-framework-internal-layer/SKILL.md` and
  `workbench/skills/add-framework-development/SKILL.md`: rewrite the "NOT distributed to users / no
  provider mirror" rule. The layer now has a provider mirror and still ships to no user — both halves
  must be stated, because collapsing them is what would make the cross-layer gate look wrong.
  - **Consumes:** `node scripts/build-workbench.js` writes `.claude/{commands,skills,agents}/` and `.opencode/{commands,skills,agents}/` (F3)
- **F12** [internal] — `workbench/agents/` — the four agents carrying hand-written provider-dialect
  comments in their frontmatter: remove the comments now that `AGENT_DIALECTS` translates for real.
  Must NOT remove `readonly:`, `tools:` or `disallowedTools:` — those are the declarations the dialect
  reads.

  ⛔ **These comments are not inert in the meantime.** `splitFrontmatter` appends any line that is not
  `key:`-shaped to the PREVIOUS key's block, so each agent's trailing `#` paragraph is swallowed into
  `blocks.memory`, and `AGENT_DIALECTS.claude()` pushes that block verbatim. Between F3 and F12 the
  generated `.claude/agents/*.md` therefore carries the comment paragraph glued onto the `memory:`
  field. Harmless — a YAML reader still treats a leading `#` as a comment — but anyone diffing the F6
  boundary will see it, and the working-state note below says so rather than letting it read as a bug.
  - **Consumes:** `AGENT_DIALECTS.opencode` omits `bash: deny` for a source declaring `Bash` in `tools:` (F8)

#### T3 — The update cycle and the gates (ref: umbrella, Problem 3)

⛔ **F13 is listed under T1, not here.** Its id follows the umbrella's topic decomposition, where the
graph root belongs to topic 003; its execution position is in T1, for the reason the note beside it
gives. **Execution Order below is authoritative — the ids are labels, not sequence.**

- **F14** [product] — `mcp/corpora.mjs:572`, `roots: ['framwork/.codeadd', '.claude']`: replace
  `'.claude'` with `'workbench'`. Must NOT change the product root in the same array.
  - **Consumes:** `workbench/{commands,skills,agents}/` holding 3 commands, 14 skill directories and 8 agents (F1)
- **F15** [product] — `cli/tests/` fixtures that build a graph from a `.claude` tree —
  `build-artefact-graph.test.js`, `helpers/tree-fixture.js` and any other the sweep finds: follow the
  new corpus root. Must NOT weaken an existing assertion to make it pass.
  - **Consumes:** the artefact graph's `internal/*` nodes resolve to paths under `workbench/` (F13)
- **F16** [internal] — `.github/workflows/ci.yml`: run `node scripts/build-workbench.js` and require
  exit 0. Must NOT add it to `release.yml` — the workbench is deliberately out of the release path.
  - **Consumes:** `node scripts/build-workbench.js` writes `.claude/{commands,skills,agents}/` and `.opencode/{commands,skills,agents}/` (F3)
- **F17** [internal] — `CLAUDE.md`: rewrite the Internal Layer anatomy table for `workbench/`, and add
  the workbench build to the Pipeline section. Must NOT hand-edit the generated inventory block.
- **F18** [internal] — `scripts/build.js:1232-1285`, the cross-layer gate: revise the wording so it
  states the reason that still holds — a distributed artefact must not name a workbench artefact
  because the *user* never receives one. Must NOT weaken or remove the gate; only its stated reason
  changes, and the failure it produces is identical.
- **F19** [product] — `cli/tests/build-workbench.test.js`: create the suite covering the new entry
  point. Must NOT duplicate assertions the existing `build.test.js` already makes about the shared
  transformation.
  - **Consumes:** `node scripts/build-workbench.js` writes `.claude/{commands,skills,agents}/` and `.opencode/{commands,skills,agents}/` (F3)
- **F20** [internal] — **ruler item 2**, from a `@prompt-review-agent` audit of
  `add-framework-internal-layer` run after this plan was written:
  `workbench/skills/add-framework-development/SKILL.md` carries two headings both numbered `## 8.`
  (`Patterns to Enforce` at 669, `Declaring Relationships` at 703), so the two citations of "§ 8" do
  not land on one unambiguous target. Renumber the second to `## 9.` and update both citers —
  `workbench/skills/add-framework-internal-layer/SKILL.md` and `CLAUDE.md`. Both already mean that
  section, so they move together. Must NOT renumber `## 8. Patterns to Enforce`, which nothing cites.
  **Its validation names ruler item 2.**

### Does NOT Include (important!)

- **cursor, codex and antigrav.** Codex has no slash commands and takes TOML agents; antigrav receives
  no agents at all. Each becomes a row in `workbench/provider-map.json` later.
- **Installing the workbench into any other repository.** No ZIP packaging, no `npx` flag, no manifest
  entry, no change under `cli/src/`. `npx codeadd install` downloads a release ZIP, so routing internal
  development through it would mean tagging a release to test a one-line skill edit.
- **Making the internal artefacts generic.** `add-framework--sync` keeps `web/`, `--release` keeps
  `cli/package.json`, the four `*-analyzer` agents keep their hardcoded paths. The target is this
  repository, so repo-specific is correct.
- **Renaming `framwork/`.** The typo is deliberate.
- **Moving `mcp/`.** It is product-layer source at the root and stays there.
- **Changing what `buildResources`, `resolveResourcePaths` or `TRANSFORMERS` do.** F8, F13 and F18 edit
  `scripts/build.js` for the opencode dialect, the graph root and the gate's wording — none of them
  touches the transformation path F3 imports.
- **`model:` stripping for opencode.** Already handled: the opencode dialect emits `description` and
  `mode: subagent` and drops `model:` by construction.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Who installs the workbench? | This repository only | Removes the generic/repo-specific split. Umbrella, Key Decisions |
| What is the directory called? | `workbench/` | Names what it is: where the tool is worked on. `framwork/` produces, `workbench/` builds |
| Source layout | `workbench/{commands,skills,agents}/`, output straight to the root provider directories | One level, no copy step. The only consumer is this checkout |
| Extend `build.js` or add a script? | A separate `scripts/build-workbench.js` that imports it | Isolation from the release path with no duplicated transformation. `build.js` guards `require.main === module` and exports what is needed |
| Does `buildResources` need `build.js` changed? | No | `buildResources(map, strategy)` reads no module-level path constant; the existing strategies hardcode their own `sourcePath` |
| One registry or two? | Two — `workbench/provider-map.json` | The build is registry-driven, which is what makes a second source root free and leaves product distribution untouched |
| Install through `npx`? | No. The build is the install | `npx codeadd install` downloads a release ZIP |
| Which providers? | claude and opencode | Porting is per-provider work, and opencode has a delivered dispatch precedent |
| How do the 50 `.claude/` literals move? | They become `{{cmd:}}` / `{{skill:}}` | Measured during analysis: `resolveResourcePaths` already resolves both correctly for a workbench-shaped registry |
| What does `.gitignore` ignore? | The three subdirectories inside each provider directory, never the directory | `.claude/settings.json` is authored and tracked |
| How does opencode reach the graph? | `opencode.json` gains an `mcp` block, and the opencode dialect stops denying bash to a `Bash`-declaring agent | Both routes closed at once leaves `framework-discovery-agent` blind to all eleven verbs |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| The framework's own pipeline runs in OpenCode | A build step between editing an internal skill and running it. Today the file *is* the runtime |
| A real source/output split, which makes any further provider a row in a JSON file | A second build path to keep correct, with its own gates and CI cost |
| The internal agents get build-time frontmatter translation they have never had | The hand-written dialect comments become dead text and must be removed, not left to contradict the generated output |
| The distribution machinery finally runs over the framework's own tools | Two skills asserting the internal layer is not distributed must be rewritten, and that invariant was stated three times on purpose |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| `.claude/` moving from tracked source to generated output needs `git rm -r --cached`; a half-done transition leaves files both tracked and regenerated, and git does not ignore an already-tracked path | High | F5 owns it as one ordered step. **L2.3** asserts `git ls-files .claude/` returns only `settings.json` |
| A generated `.opencode/` tree that exists and does not work | High | F9, F10, F12 and **L4.1–L4.3** — acceptance is a real dispatch from OpenCode, not a file listing |
| The new build path has no CI and its output is gitignored — invisible locally, invisible in review | Medium | F16 and F19. **L1.1–L1.5** assert expected end-state counts, not that a change happened |
| `mcp/corpora.mjs:572` silently stops indexing the internal layer, with no error | Medium | F14, proven by **L2.4** |
| F4 converts an occurrence that was about a path on disk, not an artefact reference, and the text stops being true | Medium | F4 requires classifying each occurrence before editing and names `add-artefact-graph` as the case to watch. **L1.4** asserts no `{{` survives the build and **L2.2** asserts no `.claude/` literal survives in `.opencode/` output |
| F8 changes what an already-registered product agent emits | Medium | F8 is conditional on the source declaring `Bash`. **L1.6** asserts every current product agent's opencode output is byte-identical before and after |
| The cross-layer gate looks contradicted and a later reader weakens it | Medium | F18 revises the wording and keeps the failure identical. **L2.6** asserts the gate still fails on a product artefact naming a workbench artefact |
| Scope creep back toward "install into any repo" | Medium | Does NOT Include names it. Any F-block making an internal artefact generic is out of scope by this plan |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `workbench/commands/` — 3 files | internal | create (moved) | F1 |
| `workbench/skills/` — 14 directories | internal | create (moved) | F1 |
| `workbench/agents/` — 8 files | internal | create (moved) | F1 |
| `.claude/commands/`, `.claude/skills/`, `.claude/agents/` | internal | remove from source, become build output | F1, F5 |
| `workbench/provider-map.json` | internal | create | F2 |
| `scripts/build-workbench.js` | internal | create | F3 |
| 13 files under `workbench/` carrying `.claude/` literals | internal | modify | F4 |
| `.gitignore` | internal | modify | F5 |
| `package.json` | internal | modify | F6 |
| `opencode.json` | internal | modify | F7 |
| `scripts/build.js` | internal | modify | F8 (opencode dialect), F13 (graph root), F18 (gate wording) |
| `workbench/skills/add-framework--brainstorm/SKILL.md` | internal | modify | F9, F10 |
| `workbench/skills/add-framework--plan/SKILL.md`, `--build`, `--done` | internal | modify | F10 |
| `workbench/skills/add-framework-internal-layer/SKILL.md` | internal | modify | F11 |
| `workbench/skills/add-framework-development/SKILL.md` | internal | modify | F11 |
| `workbench/agents/` — the 4 carrying dialect comments | internal | modify | F12 |
| `mcp/corpora.mjs` | **product** | modify | F14 |
| `cli/tests/build-artefact-graph.test.js`, `cli/tests/helpers/tree-fixture.js` and others the sweep finds | **product** | modify | F15 |
| `.github/workflows/ci.yml` | internal | modify | F16 |
| `CLAUDE.md` | internal | modify | F17 |
| `cli/tests/build-workbench.test.js` | **product** | create | F19 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### L1 — Build-side unit, in `cli/tests/build-workbench.test.js` (RED → GREEN)

1. **Expected end-state file map.** `node scripts/build-workbench.js` emits exactly **6 command files**
   (3 × 2 providers), **16 agent files** (8 × 2), and a `SKILL.md` for each of the 14 skills under both `.claude/skills/` and
   `.opencode/skills/`. Assert the exact set of paths, not a count alone. *RED today: the script does
   not exist.*
2. **Registry completeness.** Every entry in `workbench/provider-map.json` has a source file, and every
   file under `workbench/{commands,skills,agents}/` has a registry entry. Neither direction may have an
   orphan. *RED today: no registry.*
3. **Commands acquire frontmatter.** Each emitted command file starts with YAML frontmatter carrying
   the `description` from the registry, because the sources carry none. *RED today: no output.*
4. **No variable survives.** No emitted file contains the literal `{{cmd:` or `{{skill:`. *RED today:
   no output.*
5. **Skills pass through.** Each emitted `SKILL.md` keeps the source's own `name:` and `description:`
   frontmatter byte-for-byte, and every `references/` file travels with it. *RED today: no output.*
6. **F8 changes nothing already shipping.** For every agent currently in `framwork/provider-map.json`,
   the opencode output is byte-identical before and after F8, except for any that declares `Bash` in
   `tools:`. Assert the exception set explicitly rather than asserting "no change". *RED today: F8 not
   applied, so the comparison is vacuous — the test must be written to fail if the exception set is
   empty when it should not be.*

### L2 — Integration

1. **`scripts/build.js` is untouched by the workbench path.** `node scripts/build.js` exits 0, emits no
   new warning, and produces the same product output as before this plan. *RED today: passes — this is
   a regression guard, and it must be shown to fail against a deliberately broken `build.js` before it
   counts.*
2. **No `.claude/` literal reaches opencode output.** `grep -rn "\.claude/" .opencode/` returns nothing
   outside fenced code blocks. *RED today: no `.opencode/` tree exists.*
3. **The source/output split holds in git.** `git ls-files .claude/` returns `.claude/settings.json`
   and nothing else. `git ls-files workbench/` returns the 25 artefacts. *RED today: `git ls-files
   .claude/` returns the whole artefact tree.*
4. **The graph and the MCP corpus both read `workbench/`.** `node scripts/graph.js impact
   internal/skill/add-artefact-graph --depth 1` returns its 11 dependants, and every `internal/*` node's
   `path` starts with `workbench/`. The MCP **artefacts** corpus — the `roots` array F14 edits at `mcp/corpora.mjs:572` — indexes `workbench/`. The `docs` corpus is a separate object with its own roots and no F-block touches it; do not assert over it. *RED today: nodes resolve to
   `.claude/`.*
5. **F10 landed on all four skills.** No file under `workbench/skills/add-framework--{brainstorm,plan,build,done}/`
   names a Claude-specific invocation — `Skill tool`, or a bare slash command presented as the way to
   invoke — outside a fenced block or a quoted example. Assert over all four, by grep. *RED today:
   every one of the four names at least one.* **This is F10's only coverage: L4.1 exercises
   `add-framework--brainstorm` alone, so without it three of F10's four targets are proven by nobody.*
6. **The cross-layer gate still bites.** A product artefact naming a workbench artefact still fails
   `node scripts/build.js` with the same exit code and the same failure class. Prove it by introducing
   the naming deliberately in a throwaway tree, not by reading the code. *RED today: passes — same
   regression-guard rule as L2.1.*

### L3 — Behavioural acceptance, Claude Code

1. The full pipeline runs from Claude Code exactly as before: `/add-framework--brainstorm` reaches its
   three-option approval, `/add-framework--plan` writes a plan, and each dispatches its agents.
2. The four read-only agents still decline writes.

### L4 — Behavioural acceptance, OpenCode

1. **A skill loads and runs.** `add-framework--brainstorm` loads from `.opencode/skills/`, reaches its
   approval question, and presents the three options — through the markdown fallback F9 adds, since
   opencode declares `structuredQuestions: false`.
2. **An agent dispatches and is still read-only.** `framework-discovery-agent` is dispatched, returns a
   report, and its emitted frontmatter carries `permission: edit: deny` **without** `bash: deny`.
3. **The graph is reachable.** That same agent answers a relationship question from the graph — by the
   MCP route F7 opens, or by `node scripts/graph.js` over the bash route F8 keeps. Assert which route
   answered; "it returned something" is not the assertion.

**RED expectations against the current tree:** L1.1–L1.5 fail because nothing emits a workbench tree.
L1.6 requires its exception set asserted rather than an absence. L2.2–L2.4 fail on the current roots.
L2.1 and L2.6 pass today and are regression guards — each must be shown to fail against a deliberately
broken tree before it counts as proof.
**GREEN = all levels pass after F1–F19.**

---

## Execution Order

**F1 → F2 → F3 → F13 → F4 → F5 → F6  →  F7 → F8 → F9 → F10 → F11 → F12  →  F14 → F15 → F16 → F17 → F18 → F19.**

⛔ **F13 executes inside T1, between F3 and F4**, although its id belongs to T3's topic. The ids follow the umbrella's decomposition; this order governs the build.

- **F1 first** because every other F-block in T1 reads the tree it creates.
- **F2 before F3** because `build-workbench.js` consumes the registry's provider directories.
- **F3 before F5** because `.gitignore` must ignore paths the build actually writes; ignoring a
  guessed path leaves a tracked file regenerated on every build.
- **F4 after F1 and before the T1 boundary** so the first build emits resolved paths rather than
  literals that would then need a second pass.
- **F7 and F8 before F12** because F12 removes the hand-written dialect comments only once the dialect
  does the work for real.
- **F13 before F4, and before any `build-workbench.js` run**, because the first build strips every `<!-- uses: -->` block out of the generated `.claude/` tree that `collectNodes` still reads as source. See the note on F13.
- **F13 before F15** because the fixtures follow the corpus root, not the other way around.
- **F19 last in T3** because it asserts the finished entry point.

**Working-state boundaries:**

- **After F6** the workbench builds and both provider trees exist, and the graph already reads
  `workbench/` because F13 landed inside this phase. Claude Code still works. **Two differences from
  source are expected in the generated `.claude/` tree and are not defects:** every `<!-- uses: -->`
  block is stripped, because `stripHtmlComments` runs on everything; and the four agents' trailing
  `#` comment paragraphs are glued onto their `memory:` field until F12. A build that must stop stops
  here cleanly.
- **After F12** the OpenCode path works: the graph is reachable there, the read-only agents are still
  read-only, and the generated frontmatter no longer carries the hand-written dialect comments.
- **After F19** everything holds.

⛔ **F5 is the irreversible step.** It is the one F-block whose ledger entry must record the exact
command run, because `git rm -r --cached` cannot be inferred back from the diff.

**Per-F-block validation beyond the layer default:** F8 runs L1.6 before its commit, not after — it is
the only F-block that can silently change what an already-shipping artefact emits.

## Reviewer Handoff

The review command must be able to audit this without re-reading the design docs. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves
   nothing. L2.1 and L2.6 are the two at risk, because both pass against the current tree.
2. **F4 occurrences converted without classification.** A `.claude/` string that described a path on
   disk, turned into `{{skill:}}`, produces text that resolves cleanly and says something false. The
   diff looks identical to a correct conversion.
3. **F5 half-applied.** `.gitignore` updated without `git rm -r --cached`, or the reverse. Both leave a
   tree that builds and is wrong, and neither shows up as a failure.
4. **F8 widened.** A dialect change that drops `bash: deny` unconditionally rather than for
   `Bash`-declaring sources would pass every level except L1.6.
5. **F11 collapsing the two halves.** "The layer is distributed now" is as wrong as the sentence it
   replaces. It has a provider mirror *and* ships to no user.

## References

- Design set: `docs/brainstorming/2026-09-20T105430-workbench-layer-000-umbrella.md`,
  `docs/brainstorming/2026-09-20T105430-workbench-layer-intent.md`
- `2026-09-17T124433-PLAN--build-end-to-end-non-claude` — established the class of break running the
  pipeline outside Claude Code produces
- `2026-09-17T132658-PLAN--opencode-dispatch-and-gitnexus-repo` — opencode subagent dispatch
- `2026-09-13T100745-PLAN--readonly-agent-dispatch-capability` — established `AGENT_DIALECTS` and the
  per-provider `readonly:` translation F8 extends

---

## Next Steps

/add-framework--build workbench-layer

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-20 | Initial creation |
| 2026-09-20 | Review fixes: F13 resequenced into T1 before any `build-workbench.js` run, because `stripHtmlComments` erases the `<!-- uses: -->` blocks the graph reads; F13 corrected to name one construction site (983) instead of three; L2.4 names the artefacts corpus rather than the docs corpus; L2.5 added, covering F10 on all four skills by grep; F12 notes that the dialect comments propagate into the built `memory:` field until it lands; `Consumes` strings on F2/F4/F13/F14 made verbatim |
