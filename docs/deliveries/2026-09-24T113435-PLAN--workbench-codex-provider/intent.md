---
path: architectural
topic: workbench-codex-provider
doc: docs/brainstorming/2026-09-24T111012-workbench-codex-provider.md
delivery: automatic
---

## Decided
- Codex joins the workbench mirror as a full provider row — the build machinery is provider-generic; no script change. `npm run setup` and CI emit the third tree automatically.
- Same product-proven shape: `dir: ".agents"` (skills, commands included as skills — codex has no slash commands), `agentsDir: ".codex"` (agents as `.toml` via the imported `AGENT_DIALECTS.codex`), row mirrors the product codex entry verbatim.
- artefact-graph MCP registered in a new authored `.codex/config.toml` at the repository root (`[mcp_servers.artefact-graph]`, `command = "node"`, `args = ["../mcp/server.mjs", "--corpus=artefacts"]` — relative path resolves against the `.codex/` folder) — user confirmed in scope.
- Trust prerequisite documented, not worked around: Codex loads project config only for trusted projects; one user-level `trust_level` line, not a build concern. Header note in the config file.
- Read-only internal agents stay instruction-enforced on codex — the TOML dialect carries no tool fields; inherited product trade-off, documented.
- Test suite becomes pattern-aware: `L1.2` drops the two-provider pin, `L2.1`/`L2.3`/`L3.3` stop assuming a uniform `commands/*.md`/`agents/*.md` layout, `L2.5` gains the codex skill-pointer assertion.
- Prose naming the two-provider mirror updated in the same F-block as the registry row: `add-framework-internal-layer` (mirror table), `add-framework-development:559`, `scripts/build-workbench.js` header, `AGENTS.md` (not a graph node — grep sweep). `add-framework--brainstorm:434` needs no change (its claim stays true).
- Product layer untouched: no `framwork/`, `cli/src/`, `release.yml`, installer or `mcp-registration.js` change. `cli/tests/build-workbench.test.js` is the workbench build's own suite — the only file under `cli/`.
- Acceptance is a real run: pipeline invoked from Codex, one artefact-graph verb answering over the project MCP — a file listing is not acceptance.

## Open
None
