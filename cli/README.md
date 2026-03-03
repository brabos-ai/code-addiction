# pff

CLI installer for [Product Flow Factory (PFF)](https://github.com/xmaiconx/product-flow-factory).

## Install and run

```bash
# interactive install
npx pff install

# install from main branch
npx pff install --version main

# install from a specific tag
npx pff install --version v2.0.1

# update installed files to latest release
npx pff update

# environment checks
npx pff doctor

# integrity checks
npx pff validate

# repair integrity issues by restoring from release
npx pff validate --repair

# remove installed files
npx pff uninstall
npx pff uninstall --force
```

## Commands

- `install`: install core and selected provider files
- `install --version main`: install from GitHub `main` branch
- `install --version <tag>`: install from a specific GitHub tag
- `update`: update installed files to latest GitHub release
- `doctor`: verify Node, Git, and PFF installation health
- `validate`: verify file hashes from `.pff/manifest.json`
- `validate --repair`: restore missing or modified files
- `config show`: print current PFF installation config
- `config show --verbose`: config + release update check

## What gets installed

- Core (`.pff/`): always installed
- Provider integration (optional, selected interactively):
  - Claude Code -> `.claude/`
  - Codex (OpenAI) -> `.agent/`
  - Google Antigravity -> `.agents/`
  - KiloCode -> `.kilocode/`
  - OpenCode -> `.opencode/`

## Requirements

- Node.js >= 18.0.0

## Links

- Repository: https://github.com/xmaiconx/product-flow-factory
- Issues: https://github.com/xmaiconx/product-flow-factory/issues
