# Workbench codex provider — the internal mirror builds for a third provider

## Summary

The internal workbench layer now compiles for codex alongside claude and
opencode. `npm run setup` emits three provider trees: `.claude/`, `.opencode/`,
and codex's split pair — skills and commands at `.agents/skills/` (codex has no
slash commands, so its three internal commands build as skills), agents as TOML
at `.codex/agents/`. A new authored `.codex/config.toml` at the repository root
registers the artefact-graph MCP at project level, so the graph verbs answer
from Codex once the project is trusted. No script change: the workbench build
was already provider-generic, and the codex agent dialect was imported from
`scripts/build.js` all along.

## Changes

- `workbench/provider-map.json` — the `codex` provider row, mirroring the
  product codex entry verbatim (`dir: ".agents"`, `agentsDir: ".codex"`,
  `commands`/`skills: "skills/{name}/SKILL.md"`, `agents: "agents/{name}.toml"`,
  capabilities with `slashCommands: false` / `structuredQuestions: false`).
- `.gitignore` — `/.codex/agents/`; the skills output rides the existing
  `.agents/*` line, and the block comment now says so.
- `cli/tests/build-workbench.test.js` — the suite drops its two-provider pin and
  its uniform-layout assumption: command, skill and agent paths resolve from
  each provider's own registry pattern, and codex asserts its own skill pointer.
  RED was taken before the registry row landed: the old pin and layout
  assumptions failed against the three-provider registry.
- `.codex/config.toml` (new) — `[mcp_servers.artefact-graph]` with
  `command = "node"`, `args = ["../mcp/server.mjs", "--corpus=artefacts"]` (the
  relative path resolves against the `.codex/` folder per the Codex project
  config docs). The header documents the trust prerequisite — Codex loads
  project config only for trusted projects — and the user-level fallback.
- Prose naming the mirror: `add-framework-internal-layer` (mirror table,
  edit-the-source warning, its NEVER rule now qualifies the registry it bans),
  `add-framework-development:559`, the `build-workbench.js` header, `AGENTS.md`
  (Internal Layer section, pipeline diagram, fresh-clone sentence) and the
  cross-layer gate comment in `scripts/build.js` — a sweep-dependent the plan's
  file list missed, carried by a ledger ruling.

## Acceptance

Real-run acceptance is defined in the plan: the pipeline invoked from Codex,
with one artefact-graph verb answering over the project MCP — a file listing is
not acceptance. The mechanical half (TOML shape, server answering `stats` with
242 nodes from the repository root, one-shot mode over the same command shape
the config registers) landed with the build. Driving Codex live — trusting the
project, launching it, running one verb — is the operator's step, by design.

## Commits

`cafebdf..a9dfb6b` on `feat/workbench-codex-provider` — F1 `ea9a26c`, F2
`43f9ffd`, F3 `2e7c2b4`, F4 `7f26670`, review fixes `a9dfb6b`.

## Records

Plan: `docs/plans/2026-09-24T113435-PLAN--workbench-codex-provider.md`
(delivery `automatic`, reviewed `fix-then-ok`, 4 review fixes). Design:
`docs/brainstorming/2026-09-24T111012-workbench-codex-provider.md`. Rulings and
the review pass: the plan's `--ledger.md` companion, archived at close-out.
