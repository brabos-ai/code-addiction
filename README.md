# Product Flow Factory (PFF)

[![CI](https://github.com/xmaiconx/pff-commands-scripts/actions/workflows/ci.yml/badge.svg)](https://github.com/xmaiconx/pff-commands-scripts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/pff.svg)](https://www.npmjs.com/package/pff)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Production-ready commands, scripts, and skills for AI coding assistants, with a single CLI installer.

## Why this project exists

Most AI coding setups are fragmented across custom prompts, scripts, and editor-specific conventions.

PFF standardizes this with:
- A shared core in `.pff/` (commands, scripts, skills, templates)
- Provider-specific integrations (Claude, Codex, Antigravity, KiloCode, OpenCode)
- A versioned installer (`pff`) with `install`, `update`, `doctor`, and `validate`

## Quickstart

```bash
# install PFF in your current project
npx pff install

# install from main branch
npx pff install --version main

# install from a specific tag
npx pff install --version v2.0.1

# check environment health
npx pff doctor

# validate integrity
npx pff validate
```

## What gets installed

- Core: `.pff/`
- Optional providers:
  - Claude Code -> `.claude/`
  - Codex (OpenAI) -> `.agent/`
  - Google Antigravity -> `.agents/`
  - KiloCode -> `.kilocode/`
  - OpenCode -> `.opencode/`

## Repository structure

- `cli/`: installer CLI published as `pff`
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

- Open a [GitHub Issue](https://github.com/xmaiconx/pff-commands-scripts/issues)
- See [SUPPORT.md](./SUPPORT.md)
