# Code-Addiction (ADD Framework)

Open-source framework that distributes AI-assisted development commands, skills, and agents to 5 MCP-capable providers (Claude Code, Codex, Cursor, Antigravity, OpenCode).

## Project Anatomy

Two layers with distinct purposes:

### Product Layer — `framwork/.codeadd/`

Source of truth for distributed artefacts. Users consume these via CLI install.

| Type | Path | Count |
|------|------|-------|
| Commands | `framwork/.codeadd/commands/*.md` | ~20 |
| Skills | `framwork/.codeadd/skills/*/SKILL.md` | ~34 |
| Agents | `framwork/.codeadd/agents/*-agent.md` | ~8 |
| Scripts | `framwork/.codeadd/scripts/*` | variable |

### Internal Layer — `.claude/`

Development tools that build and maintain the framework itself. NOT distributed to users.

| Type | Path |
|------|------|
| Commands | `.claude/commands/*.md` — namespace `add-framework--*`. Sub-prefixes: framework default (implicit), `self-` (internal infrastructure), `shared-` (usable in both contexts) |
| Skills | `.claude/skills/` (`building-commands`, `add-framework-development`, `add-commit`) |
| Agents | `.claude/agents/` (`readme-analyzer`, `svg-analyzer`, `web-docs-analyzer`, `web-index-analyzer`, `framework-discovery-agent`). Agents with tool restrictions use full product-layer frontmatter (`tools`, `disallowedTools`, `memory`). Agents that inherit all tools use minimal frontmatter (`name`, `description`, `model` only). |
| Plans | `docs/plans/NNNN-PLAN--slug.md` (framework) or `docs/plans/NNNN-SELF-PLAN--slug.md` (internal). Review files: `...--review-vNN.md` |

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
- `cli/` — npm CLI package (`npx code-addiction`) that installs the framework

### Build Transform Details

Three strategies with different behaviors:

| Strategy | Metadata | Transform | Post-write |
|----------|----------|-----------|------------|
| Commands | YAML frontmatter (description) | MD or TOML | — |
| Skills | YAML frontmatter (name + description) | MD or TOML | Copies extra files (subdirs, siblings) |
| Agents | Passthrough (keeps original frontmatter) | None | — |

Key mechanics: HTML comments (`<!-- -->`) are stripped at build time uniformly (use for source-only dev notes), **including** `feature:`/`plugin:` injection markers. Those markers are not shipped — `extractInjectionPoints()` consumes each one into a build-emitted **content-anchored sidecar** (`framwork/.codeadd/injection-points.json`) keyed by adjacent prose text, and the built provider files ship **marker-free**. `lintResourcePaths()` warns if raw `.codeadd/` paths appear — use `{{cmd:}}` / `{{skill:}}` variables instead. All providers use markdown (the build is markdown-only).

### Resource Path Variables (build-time)

| Variable | Resolves to (per provider) |
|----------|---------------------------|
| `{{cmd:NAME}}` | Provider-specific command path |
| `{{skill:NAME/FILE}}` | Provider-specific skill path |
| Scripts | Always `.codeadd/scripts/` (no variable needed) |

### Provider Capabilities

The 5 supported providers (claude, codex, cursor, antigrav, opencode) are all MCP-capable and markdown-native. Minor differences remain: antigrav has no hooks; codex has no slashCommands. All support `agentDispatch` and `mcp`. Per-provider capability flags live in `provider-map.json` → `providers.{name}.capabilities`.

Distribution rules: all commands/skills build to all 5 providers by default. Skills can restrict via `"providers": [...]` in `provider-map.json`. Agents only build for providers with an `agents` pattern (currently only claude).

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
| `tdd` | enabled | add.plan, add.build, add.review |
| `startup-test` | enabled | add.build, add.review |

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

**Agent injection** carries plugin capability across the command→subagent dispatch boundary: a per-agent fragment travels with the agent into *every* command that dispatches it (no per-command duplication). Agent injection only targets providers with an `agentsSubdir` (currently Claude). Exclusion is enforced by *not* placing a marker in an agent's source — MCP-blocked allowlist agents (e.g. `feature-history-agent`, `git-history-agent`) and non-code-graph agents (e.g. `doc-reviewer-agent`) carry no marker, so the build emits no sidecar entry for them and they are never injected. `injectAgentFragments` / `removeAgentFragments` in `injection-core.js` drive agent injection from the same sidecar + anchor mechanism as commands.

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
