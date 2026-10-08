# Code Addiction (ADD)
 
[![CI](https://github.com/brabos-ai/code-addiction/actions/workflows/ci.yml/badge.svg)](https://github.com/brabos-ai/code-addiction/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codeadd.svg)](https://www.npmjs.com/package/codeadd)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

AI-powered development workflows that make you addicted to shipping code. Production-ready commands, scripts, and skills for AI coding assistants, with a single CLI installer.

**Official Framework Site**: [code.brabos.ai](https://code.brabos.ai) — your complete development workflow guide and documentation.

## Why this project exists

Most AI coding setups are fragmented across custom prompts, scripts, and editor-specific conventions.

Code Addiction standardizes this with:
- A shared core in `.codeadd/` (commands, scripts, skills, templates)
- Provider-specific integrations (Claude, Codex, Antigravity, Cursor, OpenCode, ZCode)
- A versioned installer (`codeadd`) with `install`, `update`, `modify`, `providers`, `uninstall`, `doctor`, and `validate`

## Quickstart

```bash
# install latest release
npx codeadd install

# install a specific version (e.g., v0.2.20)
npx codeadd install --version v0.2.20

# install from a release channel
npx codeadd install --channel beta

# install at user level (home directory)
npx codeadd install --global

# running install over an existing installation offers Modify / Update / Reinstall / Cancel
# instead of resetting it

# check environment health
npx codeadd doctor

# validate file integrity via SHA-256 hashes
npx codeadd validate

# repair missing or corrupted files
npx codeadd validate --repair

# update to latest release
npx codeadd update

# update to a specific version
npx codeadd update --version v0.2.14

# switch release channels while updating
npx codeadd update --channel stable

# edit providers, features and plugins in one interactive screen
npx codeadd modify

# list, add or remove providers (--global / --user apply here and to modify)
npx codeadd providers list
npx codeadd providers add cursor
npx codeadd providers remove cursor --force

# remove Code Addiction files from your project
npx codeadd uninstall

# list optional features
npx codeadd features list

# list available plugins (see docs for per-plugin setup)
npx codeadd plugins list

# serve the knowledge graph over MCP stdio (docs | artefacts)
npx codeadd mcp --corpus=docs

# show installation configuration
npx codeadd config show
```

## Plugins

Plugins integrate external MCP tools into ADD commands — extending discovery, planning, and diagnosis with structural code navigation, and adding live browser driving to QA validation (which works out of the box without any plugin). Plugins are **disabled by default** — enable only after installing the external tool.

See [code.brabos.ai/docs#plugins](https://code.brabos.ai/docs#plugins) for the full plugin catalog with install prerequisites and step-by-step setup.

## How it works

Code Addiction turns complex development into a guided, repeatable flow. Instead of figuring out *how* to build, you just follow the next command. The AI does the heavy lifting — you stay in control.

### The Development Trail

Every feature follows a clear path from idea to delivery. Pick the trail that fits your task:

```
Step        Command             What happens                        Output
───────────────────────────────────────────────────────────────────────────────
0. Explore  /add-brainstorm     Brainstorm ideas (read-only)        Initial concept
1. Discover /add-new            AI-guided feature discovery          about.md
2. Plan     /add-plan           Technical planning + UX contract     plan.md + design.md
3. Code     /add-build          Subagent-driven implementation       Working code
4. Review   /add-review         Code review + spec audit (+QA)       review-NNN.md
5. Done     /add-done           QA evidence, changelog, docs, merge  Merged branch
```

Steps 1-4 can also run unattended: approve `/add-brainstorm` with "deliver automatically" and each stage hands off to the next until `/add-build` runs its own final review and asks whether to open the PR. `/add-done` always waits for you.

### Choose your flow

Pick the shortest path that fits. Less ceremony, same quality.

```
COMPLETE  (complex features with UI)
  brainstorm --> new --> plan --> build --> review --> done
                         (design is produced inside /add-plan STEP add-plan.ux-design)

STANDARD  (features without complex UI)
  new --> plan --> build --> review --> done

LEAN      (small changes, quick tasks)
  new --> build --> done

AUTOMATIC  (one approval, no further interaction)
  brainstorm --> new --> plan --> build --> publish question
          (chosen at brainstorm's approval; build runs its own final review, then asks to publish)

EXPLORATION  (don't know where to start?)
  brainstorm --> new --> ...pick your flow above

EMERGENCY  (critical bug in production)
  hotfix --> done

TRIAGE  (ambiguous symptoms, unclear path)
  diagnose --> hotfix @report --> done
           (diagnose can also route to new, or stop at no-action)

ANALYSIS  (understand existing codebase)
  wiki / audit
```

> **That's it.** No config files to tweak, no boilerplate to write, no decision fatigue.
> Type the command, follow the AI, ship the feature. Repeat.

### Why teams get addicted

- **Zero ramp-up** — new devs ship on day one by following the flow
- **10x fewer decisions** — the framework already made the boring ones for you
- **Consistent output** — every feature gets discovery, planning, review, and docs automatically
- **Works with your stack** — NestJS, React, any database, any provider

## What gets installed

- Core: `.codeadd/`
- Optional providers:
  - Claude Code -> `.claude/`
  - Codex (OpenAI) -> `.codex/`
  - Google Antigravity -> `.agent/`
  - Cursor -> `.cursor/`
  - OpenCode -> `.opencode/`
  - ZCode (Z.ai) -> `.codex/` (commands/skills, shared with Codex; agents go to `.zcode/`)

Commands and skills install to every provider you select. Subagents install to Claude Code, Cursor, OpenCode, Codex and ZCode (Antigravity is not yet supported for agents).

## Repository structure

- `AGENTS.md`: project instructions read by AI coding assistants (replaces `CLAUDE.md` at the repo root)
- `cli/`: installer CLI published as `codeadd`
- `mcp/`: the knowledge-graph MCP server (two corpora, selected by `--corpus`), shipped in the npm package
- `board/`: the read-only backlog board over `docs/backlog.jsonl` — a React/TypeScript app plus a zero-dependency Node server; built by `npm run build:board`, run by `npm run board`. Not carried by the npm package or the main release ZIP
- `framwork/`: framework payload copied into target projects by the installer
  - `framwork/.codeadd/plugins/`: plugin asset source tree (fragments and skills per plugin)
- `workbench/`: internal-layer source for the framework's own commands, skills and agents, with its own build pipeline (compiles to `.claude/`, `.opencode/`, `.agents/` and `.codex/` at the repo root, gitignored)
- `docs/deliveries/`: durable delivery history — closed-out plan archives
- `docs/delivered.jsonl`: the delivery index every close-out appends to
- `docs/backlog.jsonl`: the backlog ticket ledger the board reads — one JSON line per ticket

## Compatibility

- Node.js >=22.19.0 (Node 24 LTS recommended) — the floor the shipped runtime and locked dependencies require
- GitHub-hosted releases for distribution
- Works on Windows, macOS, Linux (native Node runtime — no Bash required)

## Development

Requires Node.js >=22.19.0; Node 24 LTS is recommended. The suites run on
Node's own runtime — no Bash, no Docker.

```bash
npm ci                              # root tooling (pins the lock)
npm --prefix cli ci                 # CLI dependencies (vitest)
node scripts/build.js               # compile product provider files + sidecars
node scripts/build-workbench.js     # compile this repo's own pipeline

npm test                            # CLI suite (vitest) through scripts/run-tests.js
npm run test:scripts                # root native script suite (node --test)
npm run test:all                    # both, vitest first
npm --prefix cli run test:package   # pack + install + execute the CLI bin

npm run release                     # maintainers: tag, GitHub release, CLI publish
```

`npm test` and `npm run test:scripts` both go through `scripts/run-tests.js`,
work on a copy of the checkout rather than the tree you are standing in, and run
natively on Windows, macOS and Linux.

## Contributing

Contributions are welcome. Start here:
- [Contributing guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)

## Official Pages

- **Framework**: [code.brabos.ai](https://code.brabos.ai)
- **Repository**: [github.com/brabos-ai/code-addiction](https://github.com/brabos-ai/code-addiction)
- **NPM Package**: [@codeadd](https://www.npmjs.com/package/codeadd)

## Support

- Official site: [code.brabos.ai](https://code.brabos.ai)
- Open a [GitHub Issue](https://github.com/brabos-ai/code-addiction/issues)
- See [SUPPORT.md](./SUPPORT.md)
