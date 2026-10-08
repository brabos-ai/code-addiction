# Brainstorm: Modify an Existing Installation (Providers, Features, Plugins)

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-07
> **Type:** product (CLI)

## Objective

Anyone with codeadd already installed can change the installation — add or remove a provider, enable
or disable a feature or plugin — through one simple path, without losing what was already enabled.
Everything enabled is applied to every newly added provider at once. And `install` never again resets
that state without warning.

## Discovery

- `cli/src/installer.js` `install()` — the only path that adds a provider today. It writes
  `features: <registry defaults>` and `plugins: {}` unconditionally (lines ~333-341), so a re-install
  silently drops every feature and plugin the user enabled. The provider prompt (`prompt.js`
  `promptProviders`) preselects only `claude`, and the post-copy prune deletes every file of a
  previously installed provider the user did not re-tick.
- `cli/src/updater.js` `update()` — preserves `features`, `plugins` and `migrations`, but iterates
  `manifest.providers` only, so it cannot add a provider; and it returns early when the version is
  already current, before copying anything.
- `cli/src/features.js` `applyEnabledFeatures` / `cli/src/plugins.js` `applyEnabledPlugins` — both
  drive off `manifest.providers` through `resolveResourceTargets`. Once a provider is in the manifest
  with pristine files, they already compose it correctly.
- `cli/src/injection-core.js` `captureBaselines` — copies the CURRENT file of every resource target of
  every manifest provider into `.codeadd/baselines/`. Run after copying only one new provider, it
  would snapshot the already-composed files of the old providers as "pristine", and the next
  composition would inject twice.
- `cli/src/plugins.js` `applyEnabledPlugins` — skips a plugin whose tool is not detected
  (`reason: 'not-detected'`) without telling the user.
- `cli/src/mcp-registration.js` — exports `registerProvider` / `writeMcpRegistration`; there is no
  unregister. `cli/src/uninstaller.js` does not remove MCP entries either.
- Plan `2026-09-24T004540-PLAN--zcode-sixth-provider` (delivered) — closest precedent for provider
  work. ZCode reuses codex's `dest` (`.agents`), so two providers can write the same paths.
- Plan `2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids` (delivered) — made
  composition deterministic from a pristine baseline plus manifest intent. This design relies on it.
- No backlog ticket, plan or brainstorm covers changing an existing installation.

## Context & Motivation

A user who installed codeadd for Claude Code and later adopts Cursor has no safe route. Running
`install` again resets their features and plugins and, if they forget to re-tick Claude Code, deletes
it. Running `update` ignores the new provider. The user has to know this, and nothing tells them.

## Problem / Opportunity

Install and update split the job badly: install can add a provider but destroys state; update keeps
state but cannot add a provider. Feature and plugin toggles already have their own subcommands, but
providers do not, and there is no single view of "what my installation is" that can be edited.

## Proposed Solution

**Two doors over one core**, following the pattern of established CLIs: noun-verb subcommands for
scripts and precise users (`claude mcp add/remove/list`, `gh extension install/remove`,
`rustup component add/remove` — and codeadd's own `features` / `plugins`), plus one interactive
screen that shows current state and lets it be edited (Claude Code's `/config`, the Visual Studio
Installer's **Modify** button).

1. **Core — apply desired state.** One function takes the desired providers, features and plugins,
   diffs them against the manifest and applies only the difference. Every entry point below calls it;
   none re-implements it.
2. **`codeadd providers list|add <name>|remove <name>`** — mirrors `features` and `plugins`.
3. **`codeadd modify`** — interactive. Three multiselects (providers, features, plugins) pre-filled
   with the current manifest state, then a summary of the diff (`+ cursor`, `- codex`,
   `+ qa-pipeline`) and one confirmation, then the core applies it.
4. **`codeadd install` on an existing installation** — scope is resolved first, as today (the
   `--global` flag, or the scope prompt), because the manifest lives under the scope's target
   directory. Then, before any other prompt, `readManifest(targetDir)` is checked; when it exists the
   CLI prints the current state (version, scope, providers, features, plugins) and asks:
   **Modify (keep everything)** → runs the `modify` flow; **Update to the latest version (keep
   everything)** → runs the `update` flow; **Reinstall from scratch (loses features and plugins)** →
   today's install, behind its own confirmation; **Cancel**. The Modify and Update branches take
   `manifest.scope` as authoritative, as `update()` does. `--version` / `--channel` pass through to
   Update and Reinstall exactly as those commands take them; Modify ignores them and says so, since
   Modify never changes version. A target with no manifest installs exactly as today.

### How the core applies a change

**Ordering is a constraint of the core, not a detail:** copy → prune → **write the manifest** →
`captureBaselines` → features → plugins → MCP registration → `.gitignore`. `captureBaselines` and
both apply functions resolve their targets from `readManifest(cwd).providers`, so the manifest must
already carry the new provider set when they run — this is the order `installer.js` and `updater.js`
already use.

- **A provider was added (with or without removals in the same change)** → download the release
  named by the manifest's `releaseTag` (the installed version, never the latest), recopy `.codeadd/`
  and ALL desired providers from it, prune, write the manifest preserving `features`, `plugins`,
  `migrations`, `channel`, `scope` and `gitignore`, then `captureBaselines`, then re-apply enabled
  features and plugins (`applyEnabledPlugins` → `enablePlugin`, which also runs `activateSkills`, so
  plugin skills land in the new provider). Recopying every provider is what keeps `captureBaselines`
  honest: every baseline is taken from a pristine file.
- **Providers were only removed** → no download. The remaining providers' files are already
  composed, so `captureBaselines` is NOT run (it would snapshot composed files as pristine). Instead:
  delete the removed provider's files, delete its baseline files under `.codeadd/baselines/` and
  their `baselineHashes` entries, write the manifest. Nothing is re-applied — the remaining
  providers did not change.
- **Only features or plugins changed** → no download; enable/disable through the existing
  `features.js` / `plugins.js` functions, exactly as the subcommands do today.
- **Which files a removal deletes.** The set is the manifest `files` list minus every path a
  remaining provider owns — on the add path, minus the paths the recopy wrote, the same prune
  `install` and `update` already run; on the remove-only path, minus the paths the remaining
  providers' copy sets resolve to. This keeps shared roots safe in both directions (codex and zcode
  share `.agents/`). **Nothing outside the manifest `files` list is deleted** — `.codex/config.toml`,
  `.mcp.json`, `opencode.json` and every other authored file stay.
- **Plugin skills on removal.** They sit outside the manifest `files`, so the prune does not reach
  them. For each enabled plugin, delete its catalog skills under the removed provider's
  `skillsSubdir` only — not through `deactivateSkills`, which acts on every provider.
- **MCP on removal — the unregister contract.** For a JSON config (`.mcp.json` `mcpServers`,
  `opencode.json` `mcp`, and the other JSON formats `MCP_CONFIG` declares), delete only codeadd's own
  server key and keep every other server and field. For a TOML config (codex) or an unreadable file,
  edit nothing and print the manual removal line — the mirror of `registerProvider`, which prints
  rather than writes in those same cases.
- **Removal asks for confirmation**; `--force` skips it, as `uninstall --force` does.
- **Removing every provider** is allowed — install already supports "none (core only)" — with a
  warning.
- **Global scope.** `providers add <name>` of a provider with no `globalDest` (cursor today) fails
  with an error instead of reporting success — `resolveSelected` would otherwise drop it silently.
  `modify` in global scope offers only `globalCapable` providers, as `promptProviders(scope)` already
  does.
- **A plugin whose tool is not detected** stays enabled in the manifest and the CLI says so instead
  of skipping it silently. On the add path the recopy erases its old injections too, so the message
  is "plugin X is enabled but not applied to any provider (tool not detected)", not a claim about the
  new provider alone.

### Alternatives considered

| Alternative | Why not |
|---|---|
| `modify` only, with flags for scripts | One door, but scripting needs a flag per action; diverges from the existing `features`/`plugins` shape |
| `providers add/remove` only | Smallest change, but the user still needs three commands to see and change one installation |
| `install` silently merges | Changes what `install` means and removes the explicit "start from scratch" option |
| Bare `codeadd config` as the editor | Matches Claude Code's `/config`, but mixes read (`config show`) and write in one noun |
| New provider on the latest version | Bundles an update the user did not ask for and lets providers drift from `.codeadd/` |

## Type of Artefact

product — CLI source under `cli/src/` (not a command, skill or agent; no `provider-map.json` entry).

## Scope

### Includes
- A shared "apply desired state" core in `cli/src/`
- `codeadd providers list|add|remove` with `--force` on remove and `--global` honoured
- `codeadd modify` interactive flow with a diff summary and one confirmation
- `install` detecting an existing manifest and offering Modify / Update / Reinstall / Cancel
- An MCP unregister for a single provider, used by provider removal
- Reporting a not-detected plugin instead of skipping it silently
- `USAGE` text in `cli/src/cli.js` and tests under `cli/tests/` for every new path

### Does NOT Include
- A non-interactive `install --providers a,b` for CI
- Removing MCP entries in `uninstall` (same gap, different command — record as a backlog ticket)
- Changing version through `modify` (that is `update`)
- README and web docs (the `add-framework--sync` job before release)
- Any change to the `features` / `plugins` subcommands' behaviour

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Two doors (`providers` subcommands + `modify`) over one core | "one simple path" | Subcommands keep scripts and the existing noun-verb shape; `modify` gives one editable view. One core keeps them from diverging | ✅ |
| `install` on an existing install opens a Modify / Update / Reinstall / Cancel menu | "`install` never resets state without warning" | The user sees what they would lose and picks the safe path without leaving the command (Visual Studio Installer pattern) | ✅ |
| A new provider gets the manifest's `releaseTag`, not the latest | "without losing what was already enabled" | Keeps every provider and `.codeadd/` on one version; an upgrade stays an explicit `update` (rustup's `component add` uses the installed toolchain) | ✅ |
| Command name `codeadd modify` | "one simple path" | Matches the install menu's "Modify" label; keeps `config show` read-only | ✅ |
| A provider change recopies ALL desired providers before recapturing baselines | "applied to every newly added provider" | `captureBaselines` snapshots current files; copying only the new provider would baseline composed files and double-inject | ✅ |
| Removal deletes only paths no remaining provider produces | "remove a provider … without losing" | codex and zcode share `.agents/`; a naive delete breaks the provider that stays | ✅ |
| Remove asks for confirmation, `--force` skips | "never resets state without warning" | Same contract as `uninstall` | ✅ |
| Feature/plugin-only changes download nothing | "one simple path" | The existing enable/disable functions already compose in place | ✅ |
| Not-detected plugin stays enabled and is reported | "everything enabled is applied" | The user learns why a plugin did not reach the new provider instead of assuming it did | ✅ |

## Ecosystem Impact

The artefact graph has no node for `cli/src/` (it covers `framwork/.codeadd/` and `workbench/`), so
no `Called by` cell below is a graph answer. Code callers listed are from reading the source.

| Component | Layer | Called by | Impact | Action |
|-----------|-------|-----------|--------|--------|
| `cli/src/installer.js` `install()` | product | NOT VERIFIED (not a graph node); in code: `cli/src/cli.js` | Gains existing-install detection and the four-way menu; the fresh-install path is unchanged | Modify |
| `cli/src/updater.js` `update()` | product | NOT VERIFIED (not a graph node); in code: `cli/src/cli.js` | Becomes reachable from the install menu; its copy/prune steps are candidates to share with the core | Modify / refactor |
| `cli/src/cli.js` `runCli` + `USAGE` | product | NOT VERIFIED (not a graph node); the bin entry | Routes `providers` and `modify` | Modify |
| `cli/src/prompt.js` | product | NOT VERIFIED (not a graph node); in code: `installer.js` | New prompts: existing-install menu, pre-filled multiselects, diff confirmation | Modify |
| `cli/src/features.js`, `cli/src/plugins.js` | product | NOT VERIFIED (not a graph node); in code: `installer.js`, `updater.js`, `cli.js` | Reused by the core; plugin apply reports not-detected | Modify (plugins), reuse (features) |
| `cli/src/injection-core.js` `captureBaselines` | product | NOT VERIFIED (not a graph node); in code: `installer.js`, `updater.js` | Called after every provider change | None |
| `cli/src/mcp-registration.js` | product | NOT VERIFIED (not a graph node); in code: `installer.js`, `updater.js` | Needs a per-provider unregister | Modify |
| `cli/src/gitignore.js` | product | NOT VERIFIED (not a graph node); in code: `installer.js`, `updater.js` | Block re-synced on provider change | Reuse |
| `cli/src/providers.js` | product | NOT VERIFIED (not a graph node) | Source of which providers share a `dest` | None |
| Product commands and skills naming `codeadd features|plugins|install|update` in text (`add-build`, `add-plan`, `add-review`, `add-hotfix`, `add-qa-setup`, `add--qa`, `add--ecosystem`, `add--doc-schemas`, `add--knowledge-discovery`) | product | Text mentions found by grep — not graph edges | The commands they name keep their behaviour | None |
| `README.md`, `web/src/pages/docs.astro`, `web/src/pages/index.astro` | — | Text mentions found by grep | New commands undocumented until the next sync | `add-framework--sync` before release |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A safe, discoverable way to change an installation | Two more top-level commands to maintain |
| `install` stops destroying state | `install` on an existing project asks one more question |
| Every provider stays on one version and one baseline | Adding a provider downloads the whole release again |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Baselines captured from composed files → double injection | Med | Recopy every desired provider before `captureBaselines`; a test that adds a provider with a feature enabled and asserts one injection per slot in every provider |
| Removing codex deletes zcode's `.agents/` files (or the reverse) | Med | Delete only paths absent from every remaining provider's copy set; a test for each direction |
| Adding a provider when the installed `releaseTag` no longer downloads (deleted tag, offline) | Low | Fail before touching any file, with a message pointing at `update`. Removal never downloads, so it is not exposed |
| Remove-only path recaptures baselines from composed files | Med | The core skips `captureBaselines` on that path and deletes the removed provider's baselines directly; a test removes a provider with a feature enabled and asserts the remaining baselines are byte-identical before and after |
| MCP unregister damages a shared config (`.mcp.json`, `opencode.json`) | Med | Delete only codeadd's key; one test per config format, including an unreadable file and the TOML print path |
| Core and `update` diverge on copy/prune rules | Med | `update` and the core share the copy/prune helpers, as `PRESERVE_PATTERNS` is already shared |
| User edits to provider files are overwritten by the recopy | Low | Same contract as `update` today; the diff summary says which providers are rewritten |

## Next Steps

Run: `/add-framework--plan modify-installation-providers`

Also open a backlog ticket (via `/add-framework--backlog`) for the excluded gap: `uninstall` does not
remove codeadd's MCP entries. It can reuse the unregister this design adds.
