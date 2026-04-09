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

## Pipeline

```
framwork/.codeadd/  (source of truth)
  ↓
node scripts/build.js  (reads framwork/provider-map.json)
  ↓  per provider: lint → strip comments → resolve paths → transform format → write
framwork/.claude/, framwork/.agents/, framwork/.gemini/, ...  (15 provider dirs)
  ↓
cli/src/installer.js  (downloads release ZIP, installs to user's project)
```

- `framwork/provider-map.json` — single registry of all commands, skills, agents and their provider distribution
- `scripts/build.js` — compiles `.codeadd/` source → provider-specific output dirs
- `scripts/release.sh` — release automation helpers
- `cli/` — npm CLI package (`npx code-addiction`) that installs the framework

### Resource Path Variables (build-time)

| Variable | Resolves to (per provider) |
|----------|---------------------------|
| `{{cmd:NAME}}` | Provider-specific command path |
| `{{skill:NAME/FILE}}` | Provider-specific skill path |
| Scripts | Always `.codeadd/scripts/` (no variable needed) |

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
