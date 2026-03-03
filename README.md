# Code Addiction (ADD)

[![CI](https://github.com/brabos-ai/code-addiction/actions/workflows/ci.yml/badge.svg)](https://github.com/brabos-ai/code-addiction/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codeadd.svg)](https://www.npmjs.com/package/codeadd)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

AI-powered development workflows that make you addicted to shipping code. Production-ready commands, scripts, and skills for AI coding assistants, with a single CLI installer.

## Why this project exists

Most AI coding setups are fragmented across custom prompts, scripts, and editor-specific conventions.

Code Addiction standardizes this with:
- A shared core in `.add/` (commands, scripts, skills, templates)
- Provider-specific integrations (Claude, Codex, Antigravity, KiloCode, OpenCode)
- A versioned installer (`codeadd`) with `install`, `update`, `uninstall`, `doctor`, and `validate`

## Quickstart

```bash
# install Code Addiction in your current project
npx codeadd install

# install from main branch
npx codeadd install --version main

# install from a specific tag
npx codeadd install --version v2.0.1

# check environment health
npx codeadd doctor

# validate integrity
npx codeadd validate

# uninstall Code Addiction files from your project
npx codeadd uninstall
```

## What gets installed

- Core: `.add/`
- Optional providers:
  - Claude Code -> `.claude/`
  - Codex (OpenAI) -> `.agent/`
  - Google Antigravity -> `.agents/`
  - KiloCode -> `.kilocode/`
  - OpenCode -> `.opencode/`

## Repository structure

- `cli/`: installer CLI published as `codeadd`
- `framwork/`: framework payload copied into target projects by the installer
- `docs/`: internal product and feature docs

## Compatibility

- Node.js 18+
- GitHub-hosted releases for distribution
- Works on Windows, macOS, Linux (via Node runtime)

## Contributing

Contributions are welcome. Start here:
- [Contributing guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)

## Roadmap

- Better zero-config onboarding by project type
- More provider adapters
- Stronger validation and automated repair flows

## Support

- Open a [GitHub Issue](https://github.com/brabos-ai/code-addiction/issues)
- See [SUPPORT.md](./SUPPORT.md)
