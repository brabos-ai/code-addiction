# add

CLI installer for [Product Flow Factory (ADD)](https://github.com/brabos-ai/product-flow-factory).

## Install and run

```bash
# interactive install
npx add install

# install from main branch
npx add install --version main

# install from a specific tag
npx add install --version v2.0.1

# update installed files to latest release
npx add update

# environment checks
npx add doctor

# integrity checks
npx add validate

# repair integrity issues by restoring from release
npx add validate --repair

# remove installed files
npx add uninstall
npx add uninstall --force
```

## Commands

- `install`: install core and selected provider files
- `install --version main`: install from GitHub `main` branch
- `install --version <tag>`: install from a specific GitHub tag
- `update`: update installed files to latest GitHub release
- `doctor`: verify Node, Git, and ADD installation health
- `validate`: verify file hashes from `.add/manifest.json`
- `validate --repair`: restore missing or modified files
- `config show`: print current ADD installation config
- `config show --verbose`: config + release update check

## What gets installed

- Core (`.add/`): always installed
- Provider integration (optional, selected interactively):
  - Claude Code -> `.claude/`
  - Codex (OpenAI) -> `.agent/`
  - Google Antigravity -> `.agents/`
  - KiloCode -> `.kilocode/`
  - OpenCode -> `.opencode/`

## Requirements

- Node.js >= 18.0.0

## Links

- Repository: https://github.com/brabos-ai/product-flow-factory
- Issues: https://github.com/brabos-ai/product-flow-factory/issues
