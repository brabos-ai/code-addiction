# pff

CLI installer for [Product Flow Factory (PFF)](https://github.com/xmaiconx/fnd-commands-scripts).

## Install and run

```bash
# interactive install
npx pff install

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
- `update`: update installed files to latest GitHub release
- `doctor`: verify Node, Git, and PFF installation health
- `validate`: verify file hashes from `.fnd/manifest.json`
- `validate --repair`: restore missing or modified files
- `config show`: print current PFF installation config
- `config show --verbose`: config + release update check

## What gets installed

- Core (`.fnd/`): always installed
- Provider integration (optional, selected interactively):
  - Claude Code -> `.claude/`
  - Codex (OpenAI) -> `.agent/`
  - Google Antigravity -> `.agents/`
  - KiloCode -> `.kilocode/`
  - OpenCode -> `.opencode/`

## Requirements

- Node.js >= 18.0.0

## Links

- Repository: https://github.com/xmaiconx/fnd-commands-scripts
- Issues: https://github.com/xmaiconx/fnd-commands-scripts/issues
