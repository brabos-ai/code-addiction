# add

CLI installer for [Code Addiction (ADD)](https://github.com/brabos-ai/code-addiction).

## Install and run

```bash
# interactive install
npx codeadd install

# install with no prompts (bots, CI): --providers is required, "none" installs the core only
npx codeadd install --providers claude,codex --enable-feature board

# change an installed project with no prompts
npx codeadd modify --providers claude --force --disable-feature tdd-pipeline

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
- `install --providers <a,b|none>`: choose providers up front; required when stdin is not a terminal
- `install --enable-feature|--disable-feature|--enable-plugin|--disable-plugin <name>`: change features and plugins on top of the defaults (repeat the flag or use commas)
- `install --no-gitignore`: skip the `.gitignore` block
- `install --force`: overwrite an existing `.codeadd/` or provider dir without asking
- `modify --providers <a,b|none>`: set the final provider set with no prompt (removing one needs `--force`)
- `modify --enable-feature|--disable-feature|--enable-plugin|--disable-plugin <name>`: turn features and plugins on or off with no prompt
- `features list`: print the feature states (prints and exits when stdin is not a terminal)
- `install --version main`: install from GitHub `main` branch
- `install --version <tag>`: install from a specific GitHub tag
- `update`: update installed files to latest GitHub release
- `uninstall`: remove files installed by ADD from current project
- `doctor`: verify Node, Git, and ADD installation health
- `validate`: verify file hashes from `.codeadd/manifest.json`
- `validate --repair`: restore missing or modified files
- `config show`: print current ADD installation config
- `config show --verbose`: config + release update check

## Without a terminal

When stdin is not a TTY, nothing is ever asked: the command finishes, or exits 1 with a message
naming the missing flag. `install` needs `--providers`; scope is `project` (`--global` for the home
dir), the `.gitignore` block is written, features take their defaults and no plugins are enabled.
Removing a provider and overwriting existing files need `--force`. A plugin whose tool is not
detected is applied last, after everything else, and the command exits 1 naming it. `update` needs
no flag. See `codeadd --help` for every flag.

## What gets installed

- Core (`.codeadd/`): always installed
- Provider integration (optional, selected interactively):
  - Claude Code -> `.claude/`
  - Codex (OpenAI) -> `.agents/`
  - Google Antigravity -> `.agent/`
  - Cursor -> `.cursor/`
  - OpenCode -> `.opencode/`

## Runtime

Installed framework scripts run on Node — `node .codeadd/scripts/<entry>.cjs` — so no
Bash, WSL or Git-Bash is required on any platform.

## Requirements

- Node.js >= 22.19.0 (Node 24 LTS recommended)
- Windows, macOS or Linux — plain Node, no shell prerequisite

## Development

The framework scripts and their suites run on Node's own runtime — no Bash, no Docker.

```bash
npm ci                    # root tooling
npm --prefix cli ci       # CLI dependencies (vitest)

npm test                  # CLI suite through scripts/run-tests.js
npm run test:scripts      # root native script suite (node --test)
npm run test:all          # both of the above
```

## Links

- Repository: https://github.com/brabos-ai/code-addiction
- Issues: https://github.com/brabos-ai/code-addiction/issues
