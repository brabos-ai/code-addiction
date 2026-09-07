# Code-Addiction (ADD Framework)

Open-source framework that distributes AI-assisted development commands, skills, and agents to 5 MCP-capable providers (Claude Code, Codex, Cursor, Antigravity, OpenCode).

## Project Anatomy

Two layers with distinct purposes:

### Product Layer — `framwork/.codeadd/`

Source of truth for distributed artefacts. Users consume these via CLI install.

| Type | Path | Count |
|------|------|-------|
| Commands | `framwork/.codeadd/commands/*.md` | 16 |
| Skills | `framwork/.codeadd/skills/*/SKILL.md` | 41 |
| Agents | `framwork/.codeadd/agents/*-agent.md` | 22 |
| Scripts | `framwork/.codeadd/scripts/*` | variable |

### Internal Layer — `.claude/` and `.opencode/`

Development tools that build and maintain the framework itself. `.claude/` is the canonical source and `.opencode/` contains OpenCode adapters. NOT distributed to users.

| Type | Path |
|------|------|
| Commands | `.claude/commands/*.md` (canonical) and `.opencode/commands/*.md` (OpenCode adapters) — namespace `add-framework--*`. Sub-prefixes: framework default (implicit), `self-` (internal infrastructure), `shared-` (usable in both contexts) |
| Skills | `.claude/skills/` (canonical and natively discovered by OpenCode): `building-commands`, `add-framework-development`, `add-commit` |
| Agents | `.claude/agents/` (canonical) and `.opencode/agents/` (OpenCode adapters): `readme-analyzer`, `svg-analyzer`, `web-docs-analyzer`, `web-index-analyzer`, `framework-discovery-agent`, `plan-review-agent`. OpenCode agents use `mode: subagent` and `permission` frontmatter. |
| Plans | New plans: `docs/plans/YYYY-MM-DDTHHMMSS-PLAN--slug.md` (framework) or `docs/plans/YYYY-MM-DDTHHMMSS-SELF-PLAN--slug.md` (internal) — local time, no separators inside `HHMMSS` (Windows forbids `:`), and a plan **set** reuses the umbrella's timestamp verbatim. Pre-existing plans keep their legacy `docs/plans/NNNN-PLAN--slug.md` / `NNNN-SELF-PLAN--slug.md` names; both forms coexist and every command that takes a plan argument resolves either, by full basename or by unique slug substring. Companion files: `...--review-vNN.md`, `...--evidence-vNN.md` |

**`docs/` tracking policy.** `.gitignore` ignores `docs/*`: plans, evidence, changelogs and brainstorms are working artefacts and stay local by default. The QA/UX umbrella set (topics 01–05, plans 0056–0060) is a **deliberate force-added exception** (`git add -f`, commits `b49352e` + the review-v02 fix wave) because those artefacts are the spec of record for a shipped schema change and had to survive the branch. The exception covers the umbrella's **plans, evidence files, reviews (`HANDOFF-*--review-vNN.md`) and changelogs** — a plan whose changelog or review is untracked reads as unimplemented from a fresh clone, which is the failure this policy exists to prevent. Plan set **0074** (umbrella + topics 001–004, their four evidence files) is force-added on the same grounds: it is the spec of record for a shipped convergence-gate change spanning a script, a schema, five commands and two new agents, and its evidence files carry the adversarial round that found the gate shipped four of the defects it existed to kill. Plan **0069** is tracked because the 0074 set **executed** it (T3/F20 shipped its agent and skill), so it is the spec of record for artefacts now in the product layer. Plan **0075** joins them on the same grounds: it carries the residue 0074 made visible — the consumers it migrated one side of, and the ownership questions it opened — and its Validated Decisions record two owner calls that a future reader would otherwise have to re-derive. Plan set **0078** (umbrella + three topics, each split product/internal into six plans, plus their four design docs, the build ledger and three evidence files) is force-added on the same grounds: it is the spec of record for a shipped change spanning three new scripts, a deleted skill, five product commands, three internal commands, two agents and both OpenCode adapter sets — and its ledger records **eight** conflicts between plan and tree, each with the ruling that settled it, which a future reader would otherwise have to re-derive from the diff. Plans 0001–0055 remain untracked by design — a fresh clone showing no earlier plans is expected, not drift. Do NOT "fix" this by un-ignoring `docs/`; to make another artefact durable, force-add it and say why here.

Internal commands (all under `add-framework--` namespace):

| Command | Sub-prefix | Purpose |
|---------|-----------|---------|
| `add-framework--plan` | framework default | Strategic consultant; generates framework plans |
| `add-framework--build` | framework default | Executes framework plans (operates on product layer) |
| `add-framework--release` | framework default | Release manager (tags, GitHub releases, CLI) |
| `add-framework--sync` | framework default | Regenerates ecosystem.md, README.md, web docs |
| `add-framework--self-plan` | self | Plans changes to the internal layer itself |
| `add-framework--self-build` | self | Executes self-plans (operates on `.claude/`, `scripts/`, `CLAUDE.md`) |
| `add-framework--shared-brainstorm` | shared | Collaborative ideation; precedes either `--plan` or `--self-plan` |
| `add-framework--shared-review` | shared | Audits a plan vs implementation via 4 parallel read-only subagents |

### Internal ↔ Product Cross-Reference

Internal skills loaded by internal commands (these skills live in `.claude/skills/` and are referenced from the `add-framework--*` workflow):

| Internal Skill | Used by Internal Commands |
|----------------|---------------------------|
| `building-commands` | `add-framework--build` (STEP 3), `add-framework--self-build` (STEP 3) |
| `add-framework-development` | `add-framework--plan` (STEP 0), `add-framework--build` (STEP 3) |

Command scope by layer:

| Command | Operates on |
|---------|-------------|
| `add-framework--plan`, `add-framework--build` | Product layer (`framwork/.codeadd/`) |
| `add-framework--self-plan`, `add-framework--self-build` | Internal layer (`.claude/`, `scripts/`, `CLAUDE.md`) |
| `add-framework--shared-brainstorm` | Either context (precedes plan or self-plan) |
| `add-framework--shared-review` | Either context (audits a plan in `docs/plans/`) |
| `add-framework--sync` | Documentation (`README.md`, `web/`, SVGs) |
| `add-framework--release` | Git tags, GitHub releases, `cli/` |

## Pipeline

```
framwork/.codeadd/  (source of truth)
  ↓
node scripts/build.js  (reads framwork/provider-map.json)
  ↓  lintResourcePaths → stripHtmlComments → resolveResourcePaths → TRANSFORMER[format] → write
framwork/.claude/, framwork/.agents/, framwork/.gemini/, ...  (15 provider dirs)
  ↓
cli/src/installer.js  (downloads release ZIP, installs to user's project)
  ↓  applyEnabledFeatures (injects feature fragments post-install)
user's project (.claude/, .gemini/, .cursor/, ...)
```

- `framwork/provider-map.json` — single registry of all commands, skills, agents and their provider distribution
- `scripts/build.js` — compiles `.codeadd/` source → provider-specific output dirs
- `scripts/release.sh` — release automation helpers
- `framwork/.codeadd/scripts/converge-gates.sh` — read-only probe for the four `/add.done` delivery gates (review verdict, QA baseline, epic completeness, requirements coverage). `KEY=STATUS` lines, always exit 0, exit 2 only on CLI misuse — the `qa-preflight.sh` contract. **One script backs both `/add.plan-to-ready` STEP 6 and `/add.done` STEP 4**, so the two cannot drift into disagreeing about what "ready" means. Gate 2 wraps `qa-evidence.sh validate` and translates its `set -e` exit rather than propagating it
- `framwork/.codeadd/scripts/build-ledger.sh` — appends one line to a feature's build ledger, creating it with its identity header when absent. **A log, not a set**: the same line twice appends twice, because de-duplicating would erase `fix round 1` followed by `fix round 2` of the same finding. Prints `LEDGER=` / `CREATED=` / `LINES=`
- `framwork/.codeadd/scripts/task-brief.sh` — extracts ONE `tasks.md` execution task with all six sub-bullets to its own file, so an implementer reads its own requirements instead of the whole plan. Exit 2 when the task is absent — an empty brief is how an agent gets dispatched against nothing
- `framwork/.codeadd/scripts/review-package.sh` — `git log --oneline` + `diff --stat` + `diff -U10` for a `BASE..HEAD` range in one file, so a reviewer reads one path instead of re-deriving the diff. **Exit 2 on an empty range**, for the same reason
- `cli/` — npm CLI package (`npx code-addiction`) that installs the framework

### Build Transform Details

Three strategies with different behaviors:

| Strategy | Metadata | Transform | Post-write |
|----------|----------|-----------|------------|
| Commands | YAML frontmatter (description) | MD or TOML | — |
| Skills | YAML frontmatter (name + description) | MD or TOML | Copies extra files (subdirs, siblings) |
| Agents | Per-provider frontmatter dialect | MD or TOML (Codex) | — |

Key mechanics: HTML comments (`<!-- -->`) are stripped at build time uniformly (use for source-only dev notes), **including** `feature:`/`plugin:` injection markers. Those markers are not shipped — `extractInjectionPoints()` consumes each one into a build-emitted **content-anchored sidecar** (`framwork/.codeadd/injection-points.json`) keyed by adjacent prose text, and the built provider files ship **marker-free**. `lintResourcePaths()` warns if raw `.codeadd/` paths appear — use `{{cmd:}}` / `{{skill:}}` variables instead. Commands and skills are markdown on every provider. Agents carry a per-provider frontmatter dialect (`AGENT_DIALECTS` in `scripts/build.js`); Codex emits TOML with the body in `developer_instructions`.

The build emits a **third sidecar**: `framwork/.codeadd/artefact-graph.json` — the typed relationship map over `framwork/.codeadd/` and `.claude/`. (`.opencode/`, the adapter mirror, is **not** walked: drift between a canonical `.claude/` command and its OpenCode copy is currently ungated.) An artefact may declare what it uses in a source-only `<!-- uses: -->` HTML comment (`- <kind>: <target>` with an optional `(modifier)`). Five kinds: `skill`, `agent`, `command`, `script`, and **`mention:`** — an acknowledged reference that is deliberately *not* a dependency, for prose that names an artefact while pointing away from it ("use X instead"). It emits a `MENTIONS` edge, so the target is still validated, but `impact` and `dependencies` exclude it. `extractUses()` reads it from raw content *before* `stripHtmlComments()`, so the block ships to nobody — unlike `## Materializes`, which is an instruction the runtime agent needs, this is build metadata it does not. `collectNodes()` builds the inventory; **node identity is what the build can transform, never directory position** — a skill is a directory *containing* `SKILL.md`, and a node id is `<layer>/<kind>/<name>` because `add-commit` exists in both layers. `INJECTS_INTO` edges are derived from `injection-points.json`, never re-extracted.

**Three gates fail the build, one warns.** A declaration naming an artefact that does not exist; an artefact on disk absent from `provider-map.json` (therefore built for no provider — the shape commit `49422ad` shipped); and a name appearing in prose with no declared relationship to it. The fourth — declared but never named in prose — **warns**, because that direction is sometimes a real load that simply is not greppable and `(conditional)`, its waiver, has no field use yet. `ADD_GRAPH_WARNINGS=1` lists warnings instead of summarising them.

**A catalogue is not a consumer.** `add-ecosystem` maps the ecosystem and consumes none of it, so every row in its block is `mention:`. Declaring them as dependencies is not cosmetic: eight commands load that skill, so everything it lists inherits ~82 transitive dependants and `impact` degrades into a constant — `add-stripe`, which nothing uses, once reported 84. Grade risk on `impact --depth 1`; the unbounded number is context, not a score.

A new sidecar has **four** consumers — the build, `framwork/.gitignore`, `release.yml`, and this file. `SIDECARS` in `scripts/build.js` is the single list they are all checked against by `cli/tests/release-packaging.test.js`; a test that enumerates sidecar names instead is the bug commit `56bc22d` fixed, rewritten.

**Querying the graph.** `scripts/graph.js` is the engine — `impact` (transitive blast radius), `dependencies`, `neighbors`, `path`, `orphans`, `stats`, `mermaid`. `scripts/artefact-graph-mcp.js` exposes the same six as MCP tools over stdio (hand-rolled JSON-RPC; the official SDK costs 89 transitive packages to wrap six pure functions). The CLI is the engine and MCP the wrapper, not the reverse: every provider can shell out, only some have MCP configured, and both call the same module so they cannot drift.

| Question | Command |
|---|---|
| What breaks if I change this? | `node scripts/graph.js impact <name>` |
| What does this need? | `node scripts/graph.js dependencies <name>` |
| How do these two connect? | `node scripts/graph.js path <a> <b>` |
| What does nothing depend on? | `node scripts/graph.js orphans` |
| Regenerate the docs diagram | `node scripts/graph.js mermaid --write` |

`impact` and `dependencies` exclude `MENTIONS` edges — a doc that names another only to point away from it cannot break when it changes. `orphans` excludes commands (people invoke those) and fragments (the source of every injection edge, never its target).

**Consumers.** `add-framework--self-plan` STEP 2.1/2.2 derives impact and risk from it; `add-framework--sync` STEP 2 takes the ecosystem map's relationship columns from `neighbors`; `add-framework--shared-review` STEP 3.1b runs a blast-radius coverage check no single subagent can make. The docs page renders `web/public/artefact-graph.mmd`, which a test holds current against the emitted graph via the shared `DOCS_PROFILE`.

**Two knowingly-accepted costs**, both worth stating so neither reads as an oversight:

- The ~190 KB sidecar installs into every user project and **nothing there reads it**, unlike `injection-points.json` (read by `features.js`) and `contracts.json` (read by `status.sh`). Its only consumers are internal `.claude/` commands users never receive. It ships for inspectability — a user can query their own installed framework with `graph.js` — not because anything requires it.
- Internal-layer `<!-- uses: -->` blocks **do** reach the runtime agent. `.claude/commands/*.md` are read verbatim, not built, so the block that ships to nobody in the product layer sits in the prompt in the internal one. Small, and the alternative is a second declaration mechanism for seventeen files.

The build emits a **second sidecar**: `framwork/.codeadd/contracts.json`. A command that materializes state into the user's project declares a `## Materializes` H2 that is the single source of every shape it writes; `extractContract()` derives `{ contract, shape, paths }` from it. Two gates fail the build loud: a resource-path variable inside the block (it would resolve per provider), and a declared `shape` that does not match the computed one (the forgotten-bump guard — the build prints the value to paste). Like `injection-points.json` it is gitignored and packaged explicitly by `release.yml`.

### Resource Path Variables (build-time)

| Variable | Resolves to (per provider) |
|----------|---------------------------|
| `{{cmd:NAME}}` | Provider-specific command path |
| `{{skill:NAME/FILE}}` | Provider-specific skill path |
| Scripts | Always `.codeadd/scripts/` (no variable needed) |

### Provider Capabilities

The 5 supported providers (claude, codex, cursor, antigrav, opencode) are all MCP-capable and markdown-native. Minor differences remain: antigrav has no hooks; codex has no slashCommands. All support `agentDispatch` and `mcp`. Per-provider capability flags live in `provider-map.json` → `providers.{name}.capabilities`.

Distribution rules: all commands/skills build to all 5 providers by default. Skills can restrict via `"providers": [...]` in `provider-map.json`. Agents build for providers with an `agents` pattern: claude, cursor and opencode as markdown, codex as TOML. A provider whose agents live outside its main root declares `agentsDir` (codex: skills under `.agents/`, agents under `.codex/agents/`). Antigravity is deliberately deferred — its native `.agents/agents/` collides with the Codex skills root. Plugin agent-fragment injection is separately gated on `agentInjection` in `cli/src/providers.js` and remains Claude-only.

## Feature Injection System

Optional features inject content into commands post-install (not at build time), enabling dynamic toggling via `codeadd features enable|disable <name>`.

| Component | Path |
|-----------|------|
| Fragment source | `framwork/.codeadd/fragments/{feature}/{command}.md` |
| Feature registry | `cli/src/features.js` |
| Injection sidecar | `framwork/.codeadd/injection-points.json` (build-emitted; installs to `.codeadd/`) |
| Manifest state | `.codeadd/manifest.json` → `features` field |

Fragments use `<!-- section:NAME -->` markers. Command **source** carries `<!-- feature:FEATURE:SECTION -->` injection markers, but those are **stripped at build** — the build records each one as a **content anchor** in `injection-points.json`. Post-install, `features.js` locates the anchor by adjacent prose text and inserts the fragment section there (no markers in installed files); disable re-derives the exact block from the fragment and removes it (byte-identical round-trip). A rewritten anchor line fails loud (no silent no-op).

Each sidecar `anchor` is `{ text, ordinal, position, next }`: `text` + `ordinal` (occurrence index) pin the line; `position` is `after` (default) or `before`; `next` is an optional drift hint — the trimmed line that should still exist *below* the anchor (it must remain present somewhere below, not necessarily immediately, so a sibling feature/plugin injecting at the **same** anchor is not mistaken for prose drift). When two enabled features/plugins share one anchor on a file, each enables independently and both blocks land after the anchor; each disable removes only its own re-derived block.

**Pre-sidecar installs:** a project installed before this mechanism still carries old `<!-- feature/plugin -->` marker-wrapped blocks. `loadInjectionPoints` returns `[]` when the sidecar is absent, so enable/disable become safe no-ops — but `disable` cannot strip those old blocks. Re-install (or `codeadd update`) to ship the marker-free files + sidecar.

Current features:

| Feature | Default | Affected commands |
|---------|---------|-------------------|
| `tdd-pipeline` | enabled | add.plan, add.build, add.review, add.hotfix |
| `qa-pipeline` | disabled | add.plan, add.build |

## Setup Contracts

Commands that materialize state into a user's project record what they wrote in a **receipt**, and the framework ships the **shape** that state was written under, so a later release can compute whether the project is current.

| Component | Path |
|---|---|
| Contract declaration | `## Materializes` H2 in the command source |
| Contract sidecar | `framwork/.codeadd/contracts.json` (build-emitted, gitignored, packaged at release) |
| Receipt schema | `add-doc-schemas/references/receipt.md` (`setup-receipt`) |
| Receipt (in user project) | `docs/qa/qa-setup.md` |
| Comparison procedure | `add-setup-contract` skill |
| Signal | `SETUP_QA:` / `SETUP_QA_STALE:` from `status.sh` |

Identity is the `shape` hash of the `## Materializes` block. The receipt stores it as `setup-shape`. Equal to the sidecar → current. Anything else → stale → `/add.qa-setup` (hard gate in `/add.review`'s QA preflight). There is no version integer and no recipe chain. Hashes in the receipt are `owner`-scoped: only paths this command solely owns carry one, because a hash on a shared file (`screens.json`, content owned by `add.plan` STEP 10.0) would report drift on every healthy project.

The `## Materializes` block boundary is **fence-aware**: it embeds a fenced template carrying its own H2s, and a naive `^## ` scan would truncate it — silently excusing everything below from both the shape hash and the variable ban. The contract variable ban targets *resolvable* references (`{{cmd:NAME}}`); the empty forms (`{{cmd:}}`) resolve to nothing, ship identically to every provider, and are how the block documents the ban itself.

Current consumer: `add.qa-setup` only. `add.wiki` keeps its git-based `.meta.json` staleness — the two mechanisms coexist deliberately (contract-based for materialized state, git-based for corpus-derived docs).

## Plugin System

A first-class `plugin` concept (distinct from `features`) integrates **external MCP tools**. codeadd owns utilization, never installation: it validates the tool is present, injects additive guidance into commands **and agent definitions**, activates plugin-bound skills, and points the user at the tool's own installer. Plugins are **disabled by default**.

| Component | Path |
|-----------|------|
| Catalog (baked into CLI) | `cli/src/plugins.json` |
| Command fragment source | `framwork/.codeadd/plugins/{plugin}/fragments/{command}.md` |
| Agent fragment source | `framwork/.codeadd/plugins/{plugin}/fragments/agents/{agent}.md` |
| Skill source | `framwork/.codeadd/plugins/{plugin}/skills/{skill}/SKILL.md` |
| Plugin module | `cli/src/plugins.js` |
| Shared injection helpers | `cli/src/injection-core.js` (imported by `features.js` + `plugins.js`) |
| Manifest state | `.codeadd/manifest.json` → `plugins` field |

Fragments use `<!-- section:NAME -->` markers. Command **and agent** source carry `<!-- plugin:PLUGIN:SECTION -->` injection markers (parallel to the `feature:` namespace); like features, these are stripped at build into the content-anchored sidecar and injected post-install by text-anchor — installed files are marker-free. Catalog entry schema: `type` (`mcp`\|`script`\|`http`; only `mcp` in v1), `description`, `detect`, `homepage`, `installHint`, `postEnableHint`, `injects` (array), `skills` (array), `agents` (array of `{ agent, sections }`).

**Agent injection** carries plugin capability across the command→subagent dispatch boundary: a per-agent fragment travels with the agent into *every* command that dispatches it (no per-command duplication). Agent injection only targets providers with an `agentsSubdir` (currently Claude). Exclusion is enforced by *not* placing a marker in an agent's source — MCP-blocked allowlist agents (`feature-history-agent`, `git-history-agent`, `readback-agent`) carry no marker, so the build emits no sidecar entry for them and they are never injected. `readback-agent`'s exclusion is the strictest of the three: its `tools: Glob, Read` allowlist IS the doc-set boundary its whole method rests on, so a code-graph tool would let it repair a gap from outside the docs and report a comprehension the document never delivered. `injectAgentFragments` / `removeAgentFragments` in `injection-core.js` drive agent injection from the same sidecar + anchor mechanism as commands.

Lifecycle (`codeadd plugins enable|disable|list <name>`): **validate** (hard-gate `detect` shell probe — exit-0 = present) → **inject** command fragments (anchor-based) → **inject** agent fragments (anchor-based) → **activate skills** (copy `plugins/{plugin}/skills/{name}/SKILL.md` into every installed provider's `skills/` dir) → print `postEnableHint`. Disable re-derives and removes injected command + agent blocks (marker-free) and copied skill dirs.

The build-emitted sidecar is **anchor uniqueness/variable validated**: a marker whose nearest adjacent line carries a `{{cmd:}}`/`{{skill:}}`/`{{addpath:}}` variable is walked past (variables resolve per-provider so cannot anchor one shared map); if no variable-free adjacent line exists the build fails loud. Markers embedded in prose (shown as documentation) are ignored — only standalone-line markers are injection points.

## Web / Documentation

| File | Purpose |
|------|---------|
| `web/src/pages/index.astro` | Landing page |
| `web/src/pages/docs.astro` | Documentation page |
| `web/public/commands.svg` | Visual command map |
| `web/public/flows.svg` | Workflow flows diagram |
| `web/public/flowchart.svg` | Architecture flowchart |
| `README.md` | Repository documentation |

Documentation is auto-updated by `add-framework--sync` before releases (dispatches 4 analyzer agents in parallel).

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | Push/PR | Tests and validation |
| `.github/workflows/release.yml` | Tag push (`v*`) | Build + create GitHub release |
| `.github/workflows/deploy-web.yml` | Push/PR | Deploy web documentation |
