# Modify an installation: providers, features and plugins

> **Date:** 2026-10-07
> **Plan:** 2026-10-07T111102-PLAN--modify-installation-providers
> **Layers:** product

## Delivered

- `codeadd providers list|add <name>|remove <name> [--force]` and an interactive `codeadd modify`. Both call one core, `applyDesiredState` in `cli/src/modify.js`, which compares the desired providers, features and plugins with the manifest and applies only the difference.
- `codeadd install` over an existing installation no longer resets it. It shows the installation and offers Modify, Update, Reinstall or Cancel. Reinstall still sits behind the old overwrite confirmation. With no manifest, install behaves as before.
- Adding a provider downloads the release the installation is already on, recopies every desired provider, rebuilds the baselines from pristine files and re-applies the enabled features and plugins to all of them, so nothing is injected twice.
- Removing a provider downloads nothing. It deletes only the manifest files no remaining provider owns (codex and zcode keep their shared `.agents/` tree in both directions), the removed provider's plugin skills and baselines, and its MCP entry. It never runs `captureBaselines`.
- An enabled plugin whose tool is not detected is now named in `install` and `update` ("plugin X is enabled but not applied to any provider (tool not detected)"). It stays enabled in the manifest.
- New modules and helpers: `release-copy.js` (the copy and prune passes `install` and `update` shared, `PRESERVE_PATTERNS` still re-exported from `installer.js`), `ownedRoots` and `exclusiveFiles` in `providers.js`, `unregisterProvider` in `mcp-registration.js`, `applyEnabledPluginsDetailed` and `removePluginSkillsFor` in `plugins.js`, three new prompts in `prompt.js`.

## Validation

- Every level of the plan's matrix was written before its code and failed for the right reason first (L1.1 8 failures, L1.2 8, L1.3 and L1.4 8, L2.10 1, L1.5 14, L2.5 and L2.7 16, L2.6 5, L3.3 and routing 5). L2.1 to L2.9, L2.11 and L2.12 and L3.2 and L3.4 landed with the code they cover.
- Whole `cli` suite through `scripts/run-tests.js`: 78 files, 1990 tests, exit 0.
- Two deliberate breaks proved the tests bite: calling `captureBaselines` on the remove-only path made both L2.3 tests fail, and a top-level use of an exported `const` across the `installer` / `modify` / `updater` cycle made the import-order test fail.
- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exited 0 with no warning, before the first block and after every block. `cli/src` is not an artefact node, so the graph could not say what depends on the touched files.

## Decisions recorded

- `desired` is `{ providers?, features?: {name: bool}, plugins?: {name: bool} }`; a key left out means unchanged.
- `baselineHashes` is keyed by baseline file path, so removing a provider drops every entry under `.codeadd/baselines/<key>/`.
- The add path recopies with the preserve filter on, as `update` does.
- The install half of L2.10 cannot be observed: a reinstall resets `plugins` before applying them.
- A removal with `providers remove` asks for confirmation unless `--force`; `modify` shows the diff once and passes `force` to the core so a removal is never confirmed twice.

## Not done

- Non-interactive `install --providers a,b`, MCP cleanup in `uninstall` (a backlog ticket reusing `unregisterProvider`), changing the version through `modify`, and the README and web docs (`add-framework--sync` before release).
- The add path is not atomic: a failure after the download can leave a half-applied tree, and running the same command again recovers it. `update` has the same limit.
