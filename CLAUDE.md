# Code-Addiction (ADD Framework)

Open-source framework that distributes AI-assisted development commands, skills, and agents to 5 MCP-capable providers (Claude Code, Codex, Cursor, Antigravity, OpenCode).

**This file is an overview.** It says what exists and where. The mechanics of each thing live in the command or skill that owns it — see **Where the details live** at the bottom.

## Project Anatomy

Two layers with distinct purposes.

### Product Layer — `framwork/.codeadd/`

Source of truth for distributed artefacts. Users consume these via CLI install.

| Type | Path | Count |
|------|------|-------|
| Commands | `framwork/.codeadd/commands/*.md` | 16 |
| Skills | `framwork/.codeadd/skills/*/SKILL.md` | 41 |
| Agents | `framwork/.codeadd/agents/*-agent.md` | 22 |
| Scripts | `framwork/.codeadd/scripts/*` | variable |

### Internal Layer — `.claude/` and `.opencode/`

Development tools that build and maintain the framework itself. `.claude/` is canonical; `.opencode/` holds OpenCode adapters of the same files. NOT distributed to users.

| Type | Path |
|------|------|
| Commands | `.claude/commands/*.md` — namespace `add-framework--*`, sub-prefixes `self-` (internal infrastructure) and `shared-` (either context) |
| Skills | `.claude/skills/` — also discovered natively by OpenCode |
| Agents | `.claude/agents/` — OpenCode adapters use `mode: subagent` and `permission` frontmatter |
| Plans | `docs/plans/` — gitignored working artefacts, local only |

### Internal commands

| Command | Purpose | Operates on |
|---------|---------|-------------|
| `add-framework--plan` | Strategic consultant; generates framework plans | Product layer |
| `add-framework--build` | Executes framework plans | Product layer |
| `add-framework--self-plan` | Plans changes to the internal layer | Internal layer |
| `add-framework--self-build` | Executes self-plans | `.claude/`, `scripts/`, `CLAUDE.md` |
| `add-framework--shared-brainstorm` | Collaborative ideation; precedes either plan command | Either |
| `add-framework--shared-review` | Audits a plan vs implementation via 4 parallel read-only subagents | Either |
| `add-framework--sync` | Regenerates ecosystem map, README, web docs | `README.md`, `web/`, SVGs |
| `add-framework--release` | Tags, GitHub releases, CLI publish | Git tags, `cli/` |
| `add-framework--done` | Close-out — gates, `gh` merge, index entry, cleanup | Branches, PRs, `docs/delivered.jsonl` |

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

Two rules bind anyone editing an artefact:

- **HTML comments (`<!-- -->`) are stripped at build.** Use them for source-only notes. Injection markers and `<!-- uses: -->` blocks rely on this.
- **Never write a raw `.codeadd/` path.** Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; `lintResourcePaths()` warns otherwise. Scripts are the exception — always `.codeadd/scripts/`.

Key files:

| File | Role |
|---|---|
| `framwork/provider-map.json` | Single registry of every command, skill, agent and its provider distribution |
| `scripts/build.js` | Compiles `.codeadd/` source → 15 provider output dirs, and emits the sidecars |
| `scripts/graph.js` | Queries the artefact graph — `impact`, `dependencies`, `path`, `orphans`, `history`, `mermaid` |
| `scripts/artefact-graph-mcp.js` | Exposes seven graph verbs as MCP tools; the CLI is the engine, MCP the wrapper |
| `cli/` | npm package (`npx code-addiction`) that installs the framework |
| `framwork/.codeadd/scripts/*.sh` | Shipped verbatim. Each documents its own usage and exit codes in its header |

### Build-emitted sidecars

All three are gitignored and packaged explicitly by `release.yml`. `SIDECARS` in `scripts/build.js` is the single list every consumer is checked against.

| Sidecar | Carries | Read by |
|---|---|---|
| `injection-points.json` | Content anchors for feature/plugin injection | `cli/src/features.js`, `plugins.js` |
| `contracts.json` | The `shape` of every `## Materializes` block | `status.sh` |
| `artefact-graph.json` | Typed relationship map over `framwork/.codeadd/` and `.claude/` | `scripts/graph.js` only |

### Providers

The 5 supported providers (claude, codex, cursor, antigrav, opencode) are all MCP-capable and markdown-native. Commands and skills build to all 5 by default; agents only to providers declaring an `agents` pattern. Antigravity agents are deliberately deferred — its native `.agents/agents/` collides with the Codex skills root. Per-provider capabilities and distribution overrides live in `provider-map.json` → `providers.{name}`.

## Feature Injection System

Optional features inject content into commands **post-install**, so they can be toggled with `codeadd features enable|disable <name>`. Command source carries `<!-- feature:FEATURE:SECTION -->` markers; the build strips them into `injection-points.json` and installed files ship marker-free.

| Component | Path |
|-----------|------|
| Fragment source | `framwork/.codeadd/fragments/{feature}/{command}.md` |
| Feature registry | `cli/src/features.js` |
| Injection helpers | `cli/src/injection-core.js` |
| Manifest state | `.codeadd/manifest.json` → `features` |

| Feature | Default | Affected commands |
|---------|---------|-------------------|
| `tdd-pipeline` | enabled | add.plan, add.build, add.review, add.hotfix |
| `qa-pipeline` | disabled | add.plan, add.build |
| `docs-pruning` | disabled | add.done |

## Plugin System

A `plugin` integrates an **external MCP tool** — distinct from a feature. codeadd owns utilization, never installation: it validates the tool is present, injects additive guidance into commands **and agent definitions**, activates plugin-bound skills, and points at the tool's own installer. Disabled by default.

| Component | Path |
|-----------|------|
| Catalog (baked into CLI) | `cli/src/plugins.json` |
| Command fragments | `framwork/.codeadd/plugins/{plugin}/fragments/{command}.md` |
| Agent fragments | `framwork/.codeadd/plugins/{plugin}/fragments/agents/{agent}.md` |
| Plugin skills | `framwork/.codeadd/plugins/{plugin}/skills/{skill}/SKILL.md` |
| Plugin module | `cli/src/plugins.js` |
| Manifest state | `.codeadd/manifest.json` → `plugins` |

Agent injection carries plugin capability across the command→subagent boundary, so a fragment travels with the agent into every command that dispatches it. An agent is excluded by carrying no marker — that is how the read-only allowlist agents stay MCP-free.

## Setup Contracts

A command that materializes state into a user's project declares a `## Materializes` H2. The build hashes it into `contracts.json` as a `shape`; the command writes a **receipt** carrying the same hash. Equal → current. Different → stale.

| Component | Path |
|---|---|
| Contract declaration | `## Materializes` H2 in the command source |
| Receipt schema | `add-doc-schemas/references/receipt.md` |
| Receipt in user project | `docs/qa/qa-setup.md` |
| Comparison procedure | `add-setup-contract` skill |
| Signal | `SETUP_QA:` / `SETUP_QA_STALE:` from `status.sh` |

Current consumer: `add.qa-setup` only. `add.wiki` keeps its own git-based `.meta.json` staleness — the two coexist deliberately.

## Web / Documentation

| File | Purpose |
|------|---------|
| `web/src/pages/index.astro` | Landing page |
| `web/src/pages/docs.astro` | Documentation page |
| `web/public/commands.svg` | Visual command map |
| `web/public/flows.svg` | Workflow flows diagram |
| `web/public/flowchart.svg` | Architecture flowchart |
| `README.md` | Repository documentation |

Auto-updated by `add-framework--sync` before releases (4 analyzer agents in parallel).

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | Push/PR | Tests and validation |
| `.github/workflows/release.yml` | Tag push (`v*`) | Build + create GitHub release |
| `.github/workflows/deploy-web.yml` | Push/PR | Deploy web documentation |

## Where the details live

This file deliberately stops at the overview. Load the owner when you need the mechanics.

| Topic | Owner |
|---|---|
| Authoring a command, skill or agent | `building-commands`, `add-framework-development` |
| `<!-- uses: -->` syntax, graph gates, node identity | `add-framework-development` § 8 |
| `{{cmd:}}` / `{{skill:}}` resolution | `add-resource-path-convention` |
| What belongs in a `CLAUDE.md` | `add-claude-md-style` |
| Doc schemas, voice, output length | `add-doc-schemas` |
| Setup-contract comparison | `add-setup-contract` |
| A script's contract and exit codes | that script's own header, plus its `.bats` suite |
| Injection anchor internals | `cli/src/injection-core.js` |
