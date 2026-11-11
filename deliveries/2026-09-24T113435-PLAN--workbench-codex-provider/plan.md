# Plan: Workbench Codex Provider — the internal mirror builds for a third provider, and Codex drives the internal pipeline

> **Status:** implemented
> **Layers:** internal
> **Type:** architecture
> **Created:** 2026-09-24
> **Delivery:** automatic

---

## Objective

When `npm run setup` runs, the internal workbench also builds for codex — the same tree of skills,
commands and agents that claude and opencode receive — and the internal pipeline (brainstorm → plan
→ build → done) can be driven from Codex in this repository, with nothing maintained by hand. The
artefact-graph MCP is registered for codex at project level, so the graph verbs answer from there
too.

**When this build is done:** a maintainer opens this repository in Codex, finds the full internal
pipeline as skills (commands included — codex has no slash commands), dispatches the eight internal
agents as TOML subagents, and calls an artefact-graph verb over the project-level MCP. `npm run
setup` and CI produce the third tree as a side effect of the provider-generic build, with no script
change.

## Context

The workbench mirror covers claude and opencode only. The umbrella that created it
(`2026-09-20T110912-PLAN--workbench-layer`) named codex, cursor and antigrav as the rows that would
come later; this plan delivers the first of them. The product layer already solved the codex shape
(`framwork/provider-map.json`, the `zcode-sixth-provider` delivery), the codex agent dialect already
exists in `scripts/build.js`, and the workbench build imports it — the machinery is provider-generic
today. What is missing is the registry row, the gitignore rule for a second output root, a
pattern-aware test, the project-level MCP config, and the prose that still names two providers.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-24T111012-workbench-codex-provider.md` | The validated design: output shape, the codex row contract, the MCP registration, trade-offs and risks, the rejected alternative |
| `docs/brainstorming/2026-09-24T111012-workbench-codex-provider-intent.md` | The classified path (`architectural`), the closed decisions, `delivery: automatic`, nothing open |

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning, `ADD_GRAPH_WARNINGS=1` set (workbench skill `add-framework-internal-layer` § Validation — binds internal F-blocks even though the internal layer is not built)
- `git status --porcelain framwork/` must be empty after every internal F-block (`add-framework-internal-layer` § Validation)
- Edit the SOURCE, never the built copy: no Write/Edit under the emitted subtrees —
  `.claude/{commands,skills,agents}/`, `.opencode/{commands,skills,agents}/`, `.agents/skills/`,
  `.codex/agents/`. Authored root files are outside the ban: `.claude/settings.json` and
  `.codex/config.toml` stay tracked (the convention `.gitignore`'s leading-slash subdirectory lines
  already record) (AGENTS.md, Internal Layer)
- `workbench/provider-map.json` is the only registry a workbench artefact is registered in — NEVER `framwork/provider-map.json` (AGENTS.md, Internal Layer table)
- `cli/tests/build-workbench.test.js` is the only file under `cli/` this plan touches; it is the workbench build's own suite (design § Type of Artefact; the workbench-layer delivery created it as an internal-layer item)

## Problem

1. **The internal pipeline cannot be driven from Codex** — no mirror tree, no agents, and the artefact-graph MCP is unreachable from it, so every graph-gated skill runs NOT VERIFIED there.

## Proposal

Add the `codex` provider row to `workbench/provider-map.json`; the generic strategies in
`scripts/build-workbench.js` emit the third tree as a consequence, with no script change. Then make
the test suite pattern-aware, author the project-level MCP config, and update the prose that still
names two providers. Sequencing: registry first (it turns the machinery on), test second (proves the
third tree), config and text last (they describe a state that then exists).

## Current State

| Artefact | Dependants | Note |
|---|---|---|
| `workbench/provider-map.json` | NOT VERIFIED — not a graph node; read by `scripts/build-workbench.js` `readMap()` | targets claude + opencode |
| `internal/skill/add-framework-internal-layer` | `internal/skill/add-framework--build` (graph, USES_SKILL, depth 1) → risk **MEDIUM** | its mirror table names two providers |
| `internal/skill/add-framework-development` | `add-framework--build`, `add-framework-internal-layer`, `add-framework-product-layer` (graph, USES_SKILL, depth 1) → risk **HIGH** | line 559 names the two-provider output; the change is one line of text |
| `.codex/` at the repo root | — | does not exist yet |

Delivery index, layer-filtered: `workbench` [internal] → 1 live entry (the layer itself);
`codex` [internal] → 0 matches. Nothing shipped and dropped; this is the continuation the umbrella
recorded, not a re-invention.

## Scope

### Includes

- **F1** [internal] — `workbench/provider-map.json` + `.gitignore`: add the `codex` provider row
  mirroring the product codex entry verbatim — `dir: ".agents"`, `agentsDir: ".codex"`,
  `commands: "skills/{name}/SKILL.md"`, `skills: "skills/{name}/SKILL.md"`,
  `agents: "agents/{name}.toml"`, `hooks: true`, the `docs` array, capabilities
  `agentDispatch: true`, `mcp: true`, `nativeFormat: "md"`, `slashCommands: false`,
  `structuredQuestions: false` (design § Proposed Solution); and add `/.codex/agents/` to
  `.gitignore` — leading slash, subdirectory-only, the convention that keeps authored files tracked;
  `.agents/*` already covers the skills output, no second line (design § Scope). The registry row
  must NOT lose the registry/tree parity — `assertRegistryMatchesTree` reads the same three kind
  keys and needs no change. One block, one commit: it turns the tree on with its ignore rule in
  place.
  - **Produces:** the provider key `codex` in `workbench/provider-map.json` (the third output tree exists after the build)
- **F2** [internal] — `cli/tests/build-workbench.test.js`: `L1.2` drops the two-provider pin for
  `['claude', 'codex', 'opencode']`; `L2.1`, `L2.3` and `L3.3` stop assuming a uniform
  `commands/*.md` / `agents/*.md` layout and resolve each provider's own patterns — for codex,
  commands and skills land at `.agents/skills/<name>/SKILL.md` and agents at
  `.codex/agents/<name>.toml`; `L2.5` gains the codex skill-pointer assertion
  (`.agents/skills/add-build-ledger/SKILL.md` resolved for the provider reading it). The
  opencode-dialect assertions in `L3.1`/`L3.2` keep reading `.opencode/` and stay unchanged. RED
  first against the current tree (design § Scope → Includes, test item).
  - **Consumes:** the provider key `codex` in `workbench/provider-map.json` (F1)
- **F3** [internal] — `.codex/config.toml` (new, authored, tracked): register the artefact-graph MCP
  — `[mcp_servers.artefact-graph]`, `command = "node"`, `args = ["../mcp/server.mjs",
  "--corpus=artefacts"]`, the relative path resolving against the `.codex/` folder per the Codex
  config docs. A header comment names the trust prerequisite (project config loads only for trusted
  projects) and the fallback — the same registration in the user's `~/.codex/config.toml`
  (design § Proposed Solution, MCP row).
- **F4** [internal] — prose that still names two providers, in the same commit as nothing else:
  `workbench/skills/add-framework-internal-layer/SKILL.md` (the mirror table row and the
  edit-the-source warning gain codex), `workbench/skills/add-framework-development/SKILL.md` line
  559 (the output list gains `.codex/` and `.agents/`), `scripts/build-workbench.js` header comment
  (`workbench/… → .claude/… .opencode/… .agents/… .codex/…`), and `AGENTS.md` — the Internal Layer
  section (lines 69, 73, 80: "compiles it into .claude/ and .opencode/", the edit prohibition, the
  registry row "targeting claude and opencode"), the pipeline diagram (line 130, "(gitignored; 2
  providers)" → 3). `AGENTS.md` is not a graph node — the sweep is grep by hand
  (`add-framework-internal-layer` § The sweep). `workbench/skills/add-framework--brainstorm/SKILL.md`
  line 434 needs no change: its claim (the registry targets more than one provider, one lacking
  structured questions) stays true.
  **Departs from design § Scope's same-F-block packaging** — there the prose updates "in the same
  F-block as the registry row"; here prose lands last so it names a tree that exists. Recorded here
  as an altered decision, not a re-derivation.

### Does NOT Include (important!)

- The product layer — `framwork/`, `cli/src/`, `release.yml`, installer, uninstaller,
  `providers.js`, `mcp-registration.js`. Nothing a user installs changes; the codex install path
  already exists there.
- ZCode, cursor or antigrav rows in the workbench registry — the umbrella anticipated all three,
  but this delivery does what its user asked for: codex.
- Tool enforcement inside the codex agent dialect — the TOML dialect carries no tool fields;
  forking it to add tool semantics would fork the shared dialect the product build owns. Read-only
  internal agents stay instruction-enforced on codex.
- Slash-command ergonomics — codex has none; commands build as skills, which is the product shape.
- The docs-corpus MCP registration — the two existing root configs (`.mcp.json`, `opencode.json`)
  register only artefact-graph; this follows suit.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| How does codex join the mirror? | A full provider row; the generic build does the rest | `build-workbench.js` iterates `Object.keys(map.providers)`; machinery already provider-generic — design § Proposed Solution |
| Which output shape? | The product-proven one: skills+commands in `.agents/skills/`, agents in `.codex/agents/*.toml` | Shipped and tested by the product build (`framwork/provider-map.json` codex entry, `zcode-sixth-provider` delivery) |
| MCP for codex in scope? | Yes, in an authored `.codex/config.toml` at the repo root | User decision at the brainstorm; without it every graph answer from codex is NOT VERIFIED |
| What if the project is untrusted? | Documented prerequisite, not worked around | Codex loads project config only for trusted projects (OpenAI docs, config-advanced/config-reference, verified 2026-09-24); trust is one user-level line |
| Read-only enforcement on codex? | Instruction-enforced, no engine enforcement | The TOML dialect drops tool fields; accepted at product layer already |
| Uniform-layout test assumptions | Pattern-aware assertions, RED first | A two-provider pin is what would silently break on the next row |
| Hand-authored codex tree? | Rejected | The root `.opencode/` adapter tree was exactly this and was deleted by `unify-dev-commands`; the generic build is the lesson recorded |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| The internal pipeline drivable from Codex | Nothing product-side: the product layer is untouched |
| Graph verbs answering from codex over the project MCP | Tool-level read-only enforcement on codex (instruction-enforced only) |
| A third provider with no new build machinery | One more authored root config file to keep in step with the other two |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Codex silently ignores `.codex/config.toml` because the project is untrusted | Medium | Header note in the config file (F3); acceptance is a real graph call from codex (L3), not a file listing |
| Relative-path resolution for the MCP server differs from the documented `.codex/`-folder rule | Low | The config states its intent (`../mcp/server.mjs` against the `.codex/` folder, F3); the same L3 acceptance catches a wrong resolution immediately |
| The codex TOML dialect cannot express `readonly` tool enforcement | Certain (accepted) | Documented as an inherited product trade-off (Scope → Does NOT Include) |
| Codex skills discovery reads `.agents/skills/` only in specific versions | Low | The product layer already ships this exact tree to codex users; L3 covers it end to end |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `workbench/provider-map.json` | internal | modify | The codex provider row (F1) |
| `.gitignore` | internal | modify | `/.codex/agents/` for the new agents output root (F1) |
| `cli/tests/build-workbench.test.js` | internal | modify | Pattern-aware assertions; provider pin drops to three (F2) |
| `.codex/config.toml` | internal | create | Authored project-level MCP registration for the artefact graph (F3) |
| `workbench/skills/add-framework-internal-layer/SKILL.md` | internal | modify | Mirror table and edit-the-source warning name three providers (F4) |
| `workbench/skills/add-framework-development/SKILL.md` | internal | modify | Line 559's output list gains codex's two roots (F4) |
| `scripts/build-workbench.js` | internal | modify | Header comment only — the pipeline map it draws gains two trees (F4) |
| `AGENTS.md` | internal | modify | Internal Layer section and pipeline diagram name three providers (F4) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### L1 — Unit / build-side (RED → GREEN)

1. `workbench/provider-map.json` carries a `codex` provider whose `dir`, `commands`, `skills`,
   `agents` and `agentsDir` fields match the product codex entry's values (translated to repo-root
   paths) — *RED today: no codex row exists.*
2. `cli/tests/build-workbench.test.js` `L1.2` asserts
   `PROVIDERS.sort()).toEqual(['claude', 'codex', 'opencode'])` — *RED today: the pin expects two.*
3. The suite's output-map assertions resolve each provider's own command/skill/agent pattern and
   pass for all three providers — *RED today: they hardcode `commands/*.md` / `agents/*.md`.*
4. `.gitignore` carries `/.codex/agents/` — *RED today: the line is absent.*

### L2 — Integration

1. `node scripts/build-workbench.js` exits 0 and emits `.agents/skills/<name>/SKILL.md` for all 14
   skills and all 3 commands, and `.codex/agents/<name>.toml` for all 8 agents, with skill sibling
   files (`references/`, `evals/`) travelling along.
2. `assertRegistryMatchesTree` still passes — the registry and the workbench tree agree, both
   directions.
3. The stale-output prune leaves the two existing provider trees untouched after the build.
4. `npm run setup` runs the identical build with no script change (`build:workbench` half).

### L3 — Behavioural acceptance

1. From Codex: the artefact-graph MCP answers one verb over the project-level config — the trust
   prerequisite met by the operator. A file listing is NOT acceptance.
2. One internal skill (e.g. `add-artefact-graph`) loads and runs from codex, resolving its
   `{{skill:}}` pointers to `.agents/skills/...`.

**RED expectations against the current tree:** L1 items 1–4 fail (no codex row, two-provider pin,
uniform-layout assumptions, no ignore line). L2/L3 fail (no third tree, no config file).
**GREEN = all levels pass after F1–F4.**

---

## Execution Order

- **F1 first** because every later block reads the registry's third provider or the tree it emits.
- **F2 second** — the suite builds against the registry F1 just changed; its RED was taken before F1.
- **F3 third** — the config describes the tree F1 emits and the MCP the graph engine already serves.
- **F4 last** — prose describes a state that then exists; nothing reads it mid-build.

Every boundary leaves the repo working: F1 turns the tree on for the next build, F2's suite gates it,
F3/F4 are additive. Per-F-block validation beyond the layer default: F2 runs
`npm test -- tests/build-workbench.test.js` through `scripts/run-tests.js` (the suite is the
workbench build's own gate); F4 runs the AGENTS.md grep sweep after its edits.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- Any decision deferred or altered, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. The `[internal]` tag on the `cli/tests/build-workbench.test.js` F-block — it sits under `cli/`,
   which reads product. Its layer is internal: it is the workbench build's own suite, created by the
   workbench-layer delivery as an internal item, and the design's Type section carries this
   distinction (design § Type of Artefact).
3. `AGENTS.md` is not a graph node — the F4 sweep must be grep over the file, not a graph query, and
   the prose it names (lines 69, 73, 80, 130) must all land in one block.
4. The codex `commands` pattern equals the `skills` pattern, so `buildResources` writes the same
   path twice per name pair — safe only because the command and skill name sets are disjoint. A
   reviewer should confirm the plan adds no artefact that shares a name across the two kinds.

## References

- Design set: `docs/brainstorming/2026-09-24T111012-workbench-codex-provider.md` +
  `2026-09-24T111012-workbench-codex-provider-intent.md`
- Prior art this plan builds on: `2026-09-20T110912-PLAN--workbench-layer` (the layer, its build,
  its registry, its test suite) · `2026-09-24T004540-PLAN--zcode-sixth-provider` (the provider-row
  pattern and the codex shape, product side) · `unify-dev-commands` (the rejection evidence for a
  hand-authored tree)

---

## Next Steps

/add-framework--build workbench-codex-provider

One command executes every F-block, whichever layer each is tagged. Do NOT route part of the plan to
a second command.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-24 | Initial creation |
| 2026-09-24 | Review fix-then-ok applied: Global Constraints item 3 reworded to ban only the emitted subtrees, keeping authored root files (`.claude/settings.json`, `.codex/config.toml`) outside the ban (B1); F4 records its departure from the design's same-F-block packaging, prose lands last (A1); the two F1 bullets merged into one block with one Produces line (N1); the two "review fix A1" citations replaced by the design section they carried (N2) |
| 2026-09-24 | Implemented on `feat/workbench-codex-provider`, commits `cafebdf..a9dfb6b`: F1 `ea9a26c`, F2 `43f9ffd`, F3 `2e7c2b4`, F4 `7f26670`, review-pass fixes `a9dfb6b`. One departure from the F4 file list (scripts/build.js comment extension) is a ledger ruling; the delivery audit applied 3 findings and rejected 5 — both in the ledger. Changelog: `2026-09-24T121829-add-workbench-codex-provider.md` |
