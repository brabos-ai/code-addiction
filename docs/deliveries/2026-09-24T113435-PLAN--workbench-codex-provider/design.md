# Brainstorm: workbench codex provider

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-24
> **Type:** architecture (internal-layer build infrastructure)

## Objective

When `npm run setup` runs, the internal workbench also builds for codex — the same tree of skills,
commands and agents that claude and opencode receive — and the internal pipeline (brainstorm → plan
→ build → done) can be driven from Codex in this repository, with nothing maintained by hand. The
artefact-graph MCP is registered for codex at project level, so the graph verbs answer from there
too.

## Discovery

- `workbench/provider-map.json` targets **claude and opencode only**. The umbrella
  `2026-09-20T105430-workbench-layer` stated this explicitly: "Any provider beyond claude and
  opencode — cursor, codex and antigrav become rows in the registry." This idea is the continuation
  that delivery anticipated, not new territory.
- The delivery index holds **no** prior internal-codex delivery — nothing was built and dropped.
- The build machinery already supports codex: `scripts/build-workbench.js` imports
  `AGENT_DIALECTS` from `scripts/build.js`, where the `codex` dialect (agent TOML:
  `name`, `description`, `developer_instructions`) has existed since the product build adopted it.
- The product layer already solved codex's tree shape (`framwork/provider-map.json`, the
  `zcode-sixth-provider` delivery): skills land in `.agents/skills/<name>/SKILL.md`, agents in
  `.codex/agents/<name>.toml` via the separate `agentsDir`, commands carry no slash-command surface
  and build as skills.
- `cli/tests/build-workbench.test.js` pins the two-provider list (`L1.2`) and assumes a uniform
  `commands/*.md` + `agents/*.md` layout across providers (`L2.1`, `L2.3`, `L3.3`) — both assumptions
  break with codex and the test must become pattern-aware.
- The internal skill prose names the two-provider mirror in three files
  (`add-framework-internal-layer`, `add-framework-development:559`,
  `add-framework--brainstorm:434`) plus `AGENTS.md` and the `build-workbench.js` header.

## Context & Motivation

The framework's own development pipeline is source at `workbench/` and compiles to the
repository-root provider directories. Two of the three providers the maintainers actually open the
repository with have a mirror; Codex does not. A maintainer working from Codex has no internal
pipeline, no internal agents to dispatch, and — without an MCP registration — no route to the
artefact graph, which the internal skills gate on.

## Problem / Opportunity

The internal pipeline cannot be run from Codex today. `npm run setup` builds a two-provider mirror
and stops; the artefact-graph MCP is registered for Claude Code (`.mcp.json`) and OpenCode
(`opencode.json`) but not for Codex. The gap closes by adding a provider row — the generic build
does the rest — and one authored config file.

## Proposed Solution

Add a `codex` provider row to `workbench/provider-map.json` and let the generic strategies emit the
third tree. `npm run setup` (which runs `node scripts/build-workbench.js`) widens to three providers
with no script change. Register the artefact-graph MCP in a new authored `.codex/config.toml` at
the repository root.

Output shape (the product-proven codex layout, mirrored at the repository root):

| What | Where | How it is produced |
|------|-------|--------------------|
| Internal commands (sync, release, backlog) | `.agents/skills/<name>/SKILL.md` | The codex `commands` pattern is `skills/{name}/SKILL.md` — codex has no slash commands, so commands are skills |
| Internal skills (14) | `.agents/skills/<name>/SKILL.md` + `references/` + `evals/` | Passthrough; sibling files copied along by `postWrite` |
| Internal agents (8) | `.codex/agents/<name>.toml` | `AGENT_DIALECTS.codex` converts the markdown agent frontmatter; `agentsDir` places them outside the skills root |
| artefact-graph MCP | `.codex/config.toml` (project-level, authored) | `[mcp_servers.artefact-graph]` with `command = "node"`, `args = ["../mcp/server.mjs", "--corpus=artefacts"]` — Codex docs: a relative path inside a project config resolves against the `.codex/` folder containing the `config.toml` |

**Alternative considered and rejected — a hand-authored codex tree.** The root `.opencode/` adapter
tree existed in exactly this form and was deleted by the `unify-dev-commands` delivery, replaced by
the workbench build. The generic strategies already exist; authoring a third tree by hand repeats
the mistake that delivery removed.

## Type of Artefact

Internal-layer build infrastructure: a registry row, build output, one authored provider config
file, a gitignore rule and test coverage. No new command, skill, agent or script. The product layer
is untouched — `framwork/`, `cli/src/`, `release.yml` and the install path see no change;
`cli/tests/build-workbench.test.js` is the workbench build's own test suite and is the only file
under `cli/`.

## Scope

### Includes

- `workbench/provider-map.json`: the `codex` provider row — `dir: ".agents"`, `agentsDir: ".codex"`,
  `commands: "skills/{name}/SKILL.md"`, `skills: "skills/{name}/SKILL.md"`, `agents:
  "agents/{name}.toml"`. The row mirrors the product codex entry verbatim, including `hooks: true`
  and the `docs` array, with capabilities `agentDispatch: true`, `mcp: true`, `nativeFormat: "md"`,
  `slashCommands: false`, `structuredQuestions: false`.
- `.gitignore`: the `/.codex/agents/` line, leading slash, subdirectory-only — the established
  convention that keeps `.claude/settings.json` tracked. `.agents/*` already covers the skills
  output; no line is added for it.
- `cli/tests/build-workbench.test.js`: `L1.2` drops the two-provider pin in favour of
  `['claude', 'codex', 'opencode']`; `L2.1`, `L2.3` and `L3.3` stop assuming a uniform
  `commands/*.md` / `agents/*.md` layout and resolve each provider's own patterns (codex commands
  and agents live under different roots and extensions); `L2.5` gains the codex skill-pointer
  assertion (`.agents/skills/...` resolved for the provider reading it).
- `.codex/config.toml`, authored and tracked at the repository root: the artefact-graph MCP
  registration plus a header note naming the trust prerequisite (below) and the degraded fallback —
  the same registration as a `[mcp_servers]` entry in the user's `~/.codex/config.toml`.
- Prose naming the two-provider mirror, updated in the same F-block as the registry row:
  `workbench/skills/add-framework-internal-layer/SKILL.md` (the mirror table and the
  edit-the-source warning), `workbench/skills/add-framework-development/SKILL.md:559`, the
  `scripts/build-workbench.js` header comment, and `AGENTS.md` (lines 69, 73, 80, 130 — AGENTS.md
  is not a graph node; the sweep is grep by hand).
- Real-run acceptance: the pipeline invoked from Codex — a file listing is NOT acceptance — with
  one artefact-graph verb answering over the MCP and one internal skill loading.

### Does NOT Include

- The product layer: `framwork/`, `cli/src/`, `release.yml`, the installer, uninstaller,
  `providers.js`, `mcp-registration.js` — nothing a user installs changes.
- ZCode, cursor or antigrav rows in the workbench registry.
- Tool enforcement inside the codex agent dialect: the TOML dialect drops tool lists, so read-only
  agents become instruction-enforced, not engine-enforced. Accepted at the product layer already;
  the design inherits the same trade-off and documents it.
- Slash-command ergonomics for codex (the provider has none).
- The docs-corpus MCP registration — the two existing root configs register only artefact-graph;
  this follows suit.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Reuse the product-proven codex shape (`dir` + `agentsDir` + TOML dialect) | the "same tree as the other providers" half | The shape is tested and shipped in the product build; the workbench build is provider-generic and needs no new machinery | ✅ |
| Register the artefact-graph MCP in an authored `.codex/config.toml` | the "graph verbs answer from codex" half | Without it every graph answer from codex is NOT VERIFIED; the user confirmed this is in scope | ✅ |
| Codex loads project config only for trusted projects — documented, not worked around | the "runs from codex" half | Verified against OpenAI docs (`config-advanced`, `config-reference`): untrusted projects skip the whole project `.codex/` layer. Trust is one user-level line, not a build concern | ✅ |
| The internal read-only agents stay instruction-enforced on codex | the "no new machinery" half | The codex TOML dialect carries no tool fields; adding tool semantics to it would fork the shared dialect the product build owns | ✅ |
| Test assertions become pattern-aware instead of pinning two providers | the "nothing maintained by hand" half | A uniform-layout assumption is what would silently break on the next provider row | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `workbench/provider-map.json` | NOT VERIFIED — not a graph node (registry config; the graph holds no node for it) | Gains the codex provider row | Add the row |
| `scripts/build-workbench.js` | NOT VERIFIED — top-level script, produces no node | Header comment only; no code change | Update the comment |
| `.gitignore` | NOT VERIFIED — not a graph node | Gains `/.codex/agents/` | Add the line |
| `cli/tests/build-workbench.test.js` | NOT VERIFIED — not a graph node | Provider pin and layout assumptions break | Rework the assertions |
| `.codex/config.toml` | NOT VERIFIED — new file, not a graph node | New | Author it |
| `internal/skill/add-framework-internal-layer` | `internal/skill/add-framework--build` (graph, USES_SKILL, depth 1) | Its prose says the mirror is two providers | Update the text |
| `internal/skill/add-framework-development` | `add-framework--build`, `add-framework-internal-layer`, `add-framework-product-layer` (graph, USES_SKILL, depth 1 each) | Line 559 names the two-provider output | Update the line |
| `AGENTS.md` | NOT VERIFIED — not a graph node (documented blind spot; grep it by hand) | Names `.claude/` and `.opencode/` as the mirror, "2 providers" | Update those lines |
| `internal/skill/add-framework--brainstorm` | (unchanged) | Line 434's claim — the registry targets more than one provider, one of which lacks structured questions — stays true with codex added | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| The internal pipeline drivable from Codex, same source, same build | Nothing product-side: the product layer is untouched |
| Graph verbs answering from codex over the project-level MCP | Tool-level read-only enforcement on codex agents (instruction-enforced only) |
| A third provider with no new build machinery | One more authored root config file to keep in step with the other two |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Codex silently ignores `.codex/config.toml` because the project is untrusted | Medium | Header note in the config file names the trust prerequisite; acceptance is a real graph call from codex, not a file listing |
| Relative-path resolution for the MCP server differs from the documented `.codex/`-folder rule | Low | The config states its intent (`../mcp/server.mjs` against the `.codex/` folder); the same real-MCP acceptance catches a wrong resolution immediately |
| The codex TOML dialect cannot express `readonly` tool enforcement | Certain (accepted) | Documented as an inherited product trade-off; the agents remain read-only by instruction |
| Codex skills discovery reads `.agents/skills/` only in specific versions | Low | The product layer already ships this exact tree to codex users; acceptance covers it end to end |

## Next Steps

Run: `/add-framework--plan workbench codex provider`
