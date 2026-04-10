# Code-Addiction (ADD Framework)

Open-source framework that distributes AI-assisted development commands, skills, and agents to 15+ providers (Claude Code, Codex, Gemini, Copilot, Cursor, Kiro, etc.).

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
| Commands | `.claude/commands/*.md` (`add.plan`, `add.build`, `add.self-plan`, `add.self-build`, `add.sync`, `add.release`) |
| Skills | `.claude/skills/` (`building-commands`, `add-framework-development`, `add-commit`) |
| Agents | `.claude/agents/` (`readme-analyzer`, `svg-analyzer`, `web-docs-analyzer`, `web-index-analyzer`) |

### Internal ↔ Product Cross-Reference

Internal skills loaded by product-layer commands (modifying these affects both layers):

| Internal Skill | Used by Product Commands |
|----------------|--------------------------|
| `building-commands` | `add.build` (STEP 3), `add.self-build` (STEP 3) |
| `add-framework-development` | `add.plan` (STEP 0), `add.build` (STEP 3) |

Command scope by layer:

| Command | Operates on |
|---------|-------------|
| `add.plan`, `add.build` | Product layer (`framwork/.codeadd/`) |
| `add.self-plan`, `add.self-build` | Internal layer (`.claude/`, `scripts/`, `CLAUDE.md`) |
| `add.sync` | Documentation (`README.md`, `web/`, SVGs) |
| `add.release` | Git tags, GitHub releases, `cli/` |

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

Key mechanics: HTML comments (`<!-- -->`) are stripped at build time (use for source-only dev notes). `lintResourcePaths()` warns if raw `.codeadd/` paths appear — use `{{cmd:}}` / `{{skill:}}` variables instead. Gemini is the only TOML provider; all others use markdown.

### Resource Path Variables (build-time)

| Variable | Resolves to (per provider) |
|----------|---------------------------|
| `{{cmd:NAME}}` | Provider-specific command path |
| `{{skill:NAME/FILE}}` | Provider-specific skill path |
| Scripts | Always `.codeadd/scripts/` (no variable needed) |

### Provider Capabilities

Not all 15 providers support every feature. Grouped by limitation:

| Limitation | Providers |
|------------|-----------|
| Full capability (hooks + agents + MCP + slashCommands) | claude, codex, cursor, kiro, opencode, auggie, copilot, roo |
| No hooks | antigrav, kilocode, qwen, bob, shai, windsurf |
| No agentDispatch | gemini, shai, windsurf |
| TOML format (not markdown) | gemini |
| No MCP | gemini |
| No slashCommands | codex, bob, copilot, shai |

Distribution rules: all commands/skills build to all providers by default. Skills can restrict via `"providers": [...]` in `provider-map.json`. Agents only build for providers with `agents` pattern (currently only claude).

## Feature Injection System

Optional features inject content into commands post-install (not at build time), enabling dynamic toggling via `codeadd features enable|disable <name>`.

| Component | Path |
|-----------|------|
| Fragment source | `framwork/.codeadd/fragments/{feature}/{command}.md` |
| Feature registry | `cli/src/features.js` |
| Manifest state | `.codeadd/manifest.json` → `features` field |

Fragments use `<!-- section:NAME -->` markers. Commands use `<!-- feature:FEATURE:SECTION -->` markers for injection points.

Current features:

| Feature | Default | Affected commands |
|---------|---------|-------------------|
| `tdd` | enabled | add.plan, add.build, add.review |
| `startup-test` | enabled | add.build, add.review |

## Web / Documentation

| File | Purpose |
|------|---------|
| `web/src/pages/index.astro` | Landing page |
| `web/src/pages/docs.astro` | Documentation page |
| `web/public/commands.svg` | Visual command map |
| `web/public/flows.svg` | Workflow flows diagram |
| `web/public/flowchart.svg` | Architecture flowchart |
| `README.md` | Repository documentation |

Documentation is auto-updated by `add.sync` before releases (dispatches 4 analyzer agents in parallel).

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | Push/PR | Tests and validation |
| `.github/workflows/release.yml` | Tag push (`v*`) | Build + create GitHub release |
| `.github/workflows/deploy-web.yml` | Push/PR | Deploy web documentation |
