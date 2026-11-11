# ZCode as sixth provider — reusing codex's output tree

> **Date:** 2026-09-24
> **Plan:** `docs/plans/2026-09-24T004540-PLAN--zcode-sixth-provider.md`
> **Layer:** both
> **Ticket:** 0006B

A user running ZCode (Z.ai's agentic desktop IDE) now gets the same commands, skills and agents as
any of the other five supported providers. ZCode's commands and skills are never built as a second
tree: its provider entry names the exact same `dir`, `commands` and `skills` values codex's already
does, so the two share one output on disk — no duplicate file, no skill ever listed twice for a
project with both installed. Only its agents are its own, in a dialect close to Claude's rather than
codex's TOML.

## Added

- **The `zcode` provider entry** (`framwork/provider-map.json`) — `dir`/`commands`/`skills` identical
  to codex's, its own `agentsDir` (`framwork/.zcode`) and `agents` pattern, capabilities matching what
  ZCode's docs and open-source repo document (`hooks: false` — project hooks do not run there yet).
- **`AGENT_DIALECTS.zcode`** (`scripts/build.js`) — the `claude` dialect's shape (name, description,
  `tools`/`disallowedTools`/`skills` passthrough, the same read-only tool-denial fallback), minus
  `model`, which names nothing on ZCode.
- **`PROVIDERS.zcode`** (`cli/src/providers.js`) — `src`/`dest` point at codex's `.agents`, so
  installing zcode alone or alongside codex writes to the one shared tree; `agentsSrc`/`agentsDest`
  point at its own `.zcode`. Appended to `PROVIDER_PRIORITY`.
- **The `mcp.servers` MCP format** (`cli/src/mcp-registration.js`) — ZCode's `.zcode/config.json`
  nests the server entry one level under `mcp.servers`, the same `{command, args}` shape every other
  writable provider gets.
- **`.zcode` on uninstall** (`cli/src/uninstaller.js`) — added to `ADD_DIRS` and `GLOBAL_ADD_DIRS`;
  its shared `.agents` tree was already covered by codex's existing entry.
- **The reuse pattern, documented** (`workbench/skills/add-framework-product-layer/SKILL.md`) — a
  provider entry may point its `dir`/`commands`/`skills` at another provider's exact values instead of
  building its own tree. First use, recorded for the next one.
- **A regression test tying the release ZIP's packaging list to `provider-map.json`**
  (`cli/tests/release-packaging.test.js`) — found during this delivery's own review: the packaging
  loop in `.github/workflows/release.yml` had no entry for `.zcode`, so a release would have shipped
  with no ZCode agent files. Fixed, and the new test derives the required subdirs from every
  provider's `dir`/`agentsDir` generically, rather than hardcoding one more name.

## Changed

- **`AGENTS.md`** — both provider-count mentions (the opening paragraph and the § Providers list) now
  say 6, naming zcode and its reuse of codex's tree.

## Not included

- No rename of the framework's `add.<verb>` command-naming convention — ZCode's own command loader
  rejects a dot in a command name, but reusing codex's already-shipped output sidesteps the question
  for this provider. Whether to rename the convention itself, for ZCode or any future provider, is
  ticket **0010B**.
- No verification that ZCode's skill `name:` field actually accepts a dot (`add.plan`, exactly what
  codex's — and now zcode's — commands-as-skills already carry). No ZCode install was available to
  test against; the ledger records this as NOT VERIFIED rather than assumed.
- No change to plugin agent-fragment injection, which stays Claude-only.
- `README.md` and `web/` still read "5 providers" — `/add-framework--sync` regenerates both before the
  next release, as it always has for a provider addition.
