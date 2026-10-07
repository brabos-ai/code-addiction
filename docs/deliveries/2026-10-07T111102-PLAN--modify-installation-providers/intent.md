---
path: architectural
topic: modify-installation-providers
doc: docs/brainstorming/2026-10-07T092243-modify-installation-providers.md
delivery: confirm
---

## Decided
- Two doors over one core: `codeadd providers list|add|remove` plus interactive `codeadd modify`, both calling one "apply desired state" core — subcommands for scripts, one editable view for humans.
- `install` on an existing manifest (after scope is resolved) prints current state and offers Modify / Update / Reinstall from scratch / Cancel — never resets features and plugins without warning.
- A new provider gets the manifest's `releaseTag`, never the latest — upgrades stay an explicit `update`.
- Command name is `codeadd modify`; `config show` stays read-only.
- Adding a provider recopies `.codeadd/` and all desired providers, then: write manifest → `captureBaselines` → features → plugins → MCP → `.gitignore` — every baseline from a pristine file.
- Removing only: no download, no `captureBaselines`; delete the provider's manifest-listed files not owned by a remaining provider, its baselines and `baselineHashes`, its plugin skills under its `skillsSubdir`; nothing outside manifest `files` is deleted.
- MCP unregister: JSON configs lose only codeadd's key; TOML (codex) or unreadable prints the manual line.
- Remove confirms; `--force` skips. Removing every provider is allowed with a warning.
- Global scope: `add` of a non-`globalCapable` provider errors; `modify` lists only `globalCapable` providers.
- Not-detected plugin stays enabled and is reported as "enabled but not applied to any provider".
- `--version`/`--channel` on `install` pass to Update and Reinstall; Modify ignores them and says so.
- Layer: all `[product]` (`cli/src/`, `cli/tests/`).
- Out of scope: `install --providers` for CI, MCP cleanup in `uninstall` (backlog ticket), version change via `modify`, README/web docs (sync).

## Open
None
