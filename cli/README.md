# add

CLI installer for [Code Addiction (ADD)](https://github.com/brabos-ai/code-addiction).

## Install and run

```bash
# interactive install
npx codeadd install

# install from main branch
npx codeadd install --version main

# install from a specific tag
npx codeadd install --version v2.0.1

# update installed files to latest release
npx codeadd update

# environment checks
npx codeadd doctor

# integrity checks
npx codeadd validate

# repair integrity issues by restoring from release
npx codeadd validate --repair

# remove installed files
npx codeadd uninstall
npx codeadd uninstall --force
```

## Commands

- `install`: install core and selected provider files
- `install --version main`: install from GitHub `main` branch
- `install --version <tag>`: install from a specific GitHub tag
- `update`: update installed files to latest GitHub release
- `uninstall`: remove files installed by ADD from current project
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

- Repository: https://github.com/brabos-ai/code-addiction
- Issues: https://github.com/brabos-ai/code-addiction/issues
