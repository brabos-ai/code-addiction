# Plan: Modify Installation — add/remove providers and toggle features/plugins without losing state

> **Status:** implemented
> **Layers:** product
> **Type:** product
> **Created:** 2026-10-07
> **Delivery:** confirm

---

## Objective

Anyone with codeadd already installed can change the installation — add or remove a provider, enable
or disable a feature or plugin — through one simple path, without losing what was already enabled.
Everything enabled is applied to every newly added provider at once. And `install` never again resets
that state without warning.

**When this build is done:** the CLI has `codeadd providers list|add|remove` and an interactive
`codeadd modify`, both driving one core that diffs desired state against the manifest and applies only
the difference; `codeadd install` over an existing installation offers Modify / Update / Reinstall /
Cancel instead of silently resetting; and every path is covered by tests that were RED first.

## Context

Today `install` adds providers but writes `features: <defaults>` and `plugins: {}` unconditionally and
prunes every previously installed provider the user did not re-tick; `update` preserves state but only
iterates `manifest.providers` and returns early when current. No path adds a provider safely.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-07T092243-modify-installation-providers.md` | The full contract: the two doors, the install menu, the three core paths and their ordering, ownership rule, MCP unregister contract, global-scope rules, not-detected plugin wording, alternatives rejected |
| `docs/brainstorming/2026-10-07T092243-modify-installation-providers-intent.md` | Path `architectural`, 13 closed decisions, `## Open` = None |

## Global Constraints

- `PRESERVE_PATTERNS` stays the single definition of "never delete this" for install AND update — "updater.js imports it rather than keeping a copy" (`cli/src/installer.js`, header of `PRESERVE_PATTERNS`)
- MCP registration "NEVER THROWS. A provider whose config cannot be written degrades to a printed line and the rest still register" — the unregister follows the same contract (`cli/src/mcp-registration.js`, `writeMcpRegistration`)
- A config that cannot be read "is NOT overwritten" (`cli/src/mcp-registration.js`, `readJson`)
- Core ordering: copy → prune → write manifest → `captureBaselines` → features → plugins → MCP → `.gitignore` (design, "How the core applies a change")
- Nothing outside the manifest `files` list is deleted by a provider removal, except the removed provider's plugin skills and baselines (design, "Which files a removal deletes")
- `scripts/run-tests.js` "owns supported test dispatch" — tests run through it, never `npx vitest` inside `cli/` (AGENTS.md, Key files)

## Problem

1. **Re-install destroys state** — `install()` resets enabled features and plugins and deletes the files of any provider not re-selected (the prompt preselects only `claude`).
2. **Update cannot add a provider** — it only iterates the manifest's providers.
3. **No single view of an installation** — providers have no subcommand, and nothing shows the whole installation as something editable.
4. **Silent plugin skip** — `applyEnabledPlugins` drops a plugin whose tool is not detected without a word.

## Proposal

Build bottom-up: shared helpers first (copy/prune, file ownership, MCP unregister, plugin reporting),
then the core `applyDesiredState`, then the three doors that call it (`providers`, `modify`, the
`install` menu). The contract for every behaviour is the design document; the F-blocks below name
where it lands.

## Current State

| Artefact | Today | Callers (from code; `cli/src/` has no graph node — NOT VERIFIED by the graph) |
|---|---|---|
| `installer.js` `install()` | Prompts scope, confirms overwrite, prompts providers, copies, prunes, resets features/plugins | `cli.js` |
| `updater.js` `update()` | Keeps state, manifest providers only, early return when current | `cli.js` |
| `plugins.js` `applyEnabledPlugins` | Returns a count; skips not-detected silently | `installer.js`, `updater.js` |
| `mcp-registration.js` | `registerProvider` / `writeMcpRegistration`; no unregister | `installer.js`, `updater.js` |
| `injection-core.js` `captureBaselines` | Snapshots current files of every manifest provider | `installer.js`, `updater.js` |

## Scope

### Includes

#### Phase 1 — Base helpers

- **F1** [product] — `cli/src/release-copy.js` (new), `cli/src/installer.js`, `cli/src/updater.js`:
  extract the zip copy pass (core + each provider + `agentsSrc` second pass) and the obsolete-file
  prune into `release-copy.js`, a leaf module importing only `providers.js`. `PRESERVE_PATTERNS` and
  `shouldPreserve` move with them and stay re-exported from `installer.js`, so their importers do not
  change and the single-definition rule holds. `install()` and `update()` call the helpers. **Must not lose:** install copies without the
  preserve filter while update copies with it — the helper takes that as an option and both keep their
  current behaviour; `update()`'s legacy plugin-skill removal stays in `update()`.
  - **Produces:** `copyRelease(zip, targetDir, providers, { skipPreserved })` returning written paths; `pruneObsolete(targetDir, priorFiles, writtenFiles)` returning the removed count
- **F2** [product] — `cli/src/providers.js`: add `ownedRoots(p)` taking a `resolveSelected(keys,
  scope)` entry (so `dest` is already the scope's root) and returning `[p.dest, agentDest(p)]` via the
  existing `agentDest`, and `exclusiveFiles(files, removedProviders, remainingProviders)` — the files under a removed
  provider's roots and under no remaining provider's root. Design, "Which files a removal deletes".
  - **Produces:** `exclusiveFiles`, `ownedRoots`
- **F3** [product] — `cli/src/mcp-registration.js`: add `unregisterProvider(cwd, key)` — JSON formats
  delete only `SERVER_NAME` and keep every other server and field; `toml` and absent providers return
  a printed manual line; an unreadable file is untouched. Returns status `removed|absent|print|unreadable`.
  Never throws. Design, "MCP on removal — the unregister contract".
  - **Produces:** `unregisterProvider`
- **F4** [product] — `cli/src/plugins.js`: (a) `applyEnabledPluginsDetailed(cwd)` returning
  `{ modified, notDetected: string[] }`; `applyEnabledPlugins` keeps returning the number (thin
  wrapper) so its callers do not change shape. (b) `removePluginSkillsFor(cwd, removedProviders,
  remainingProviders)` deleting each enabled plugin's catalog skills under a removed provider's
  `skillsSubdir`, skipping any directory a remaining provider also uses (codex and zcode share
  `.agents/skills`). **Must not lose:** `deactivateSkills` stays all-providers for `plugins disable`.
  - **Produces:** `applyEnabledPluginsDetailed`, `removePluginSkillsFor`
- **F5** [product] — `cli/src/installer.js`, `cli/src/updater.js`: both report `notDetected` plugins
  with the wording "plugin X is enabled but not applied to any provider (tool not detected)".
  - **Consumes:** `applyEnabledPluginsDetailed` (F4)

#### Phase 2 — The core

- **F6** [product] — `cli/src/modify.js` (new): `diffState(manifest, desired)` and
  `applyDesiredState(targetDir, desired, { force })`. Three paths exactly as the design states:
  **add** (download the manifest `releaseTag`, `copyRelease` for `.codeadd/` and ALL desired
  providers, `pruneObsolete`, write manifest preserving `features`, `plugins`, `migrations`, `channel`,
  `scope`, `gitignore`, `source`, `ref`, then `captureBaselines`, features, plugins, MCP register for
  added providers and unregister for removed ones, `.gitignore` sync); **remove-only** (no download, no
  `captureBaselines`: delete `exclusiveFiles`, `removePluginSkillsFor`, delete the removed providers'
  `.codeadd/baselines/<key>/` and their `baselineHashes` entries, unregister MCP, write manifest,
  `.gitignore` sync); **features/plugins-only** (no download; `enableFeature` / `disableFeature` /
  `enablePlugin` / `disablePlugin`).
  **Manifest writes.** The add path writes with `writeManifest`, carrying over every field it does not
  set (`features`, `plugins`, `migrations`, `channel`, `scope`, `gitignore`, `source`, `ref`), then
  `captureBaselines` rewrites `baselineHashes`. The remove-only path does NOT call `writeManifest` (it
  would drop `baselineHashes` and reset `installedAt`): it mutates the object from `readManifest` —
  `providers`, the deleted paths removed from `files` and `hashes`, the removed providers' keys removed
  from `baselineHashes` — and saves it with `saveManifest`.
  **Provider and feature/plugin changes in one call** (a `modify` run doing both): the provider change
  runs first with the manifest's current `features`/`plugins`; then each toggled feature or plugin goes
  through `enableFeature`/`disableFeature`/`enablePlugin`/`disablePlugin`, so a disabled plugin's
  skills are removed by the function that already owns that.
  **`.gitignore`** syncs only when `scope === 'project'` and `manifest.gitignore === true`, with
  `getInstalledDirs` over the new provider set — the rule `update()` already applies.
  **Confirmation.** A removal asks through `promptConfirm` unless `force`; a decline surfaces as the
  existing `USER_CANCEL` and writes nothing. **Removing the last provider** is allowed and logs a
  warning that only `.codeadd/` remains. A failed download touches no file. Global-scope rule: a
  non-`globalCapable` provider in `desired` errors. Design, "How the core applies a change" and
  "Global scope".
  - **Consumes:** `copyRelease`, `pruneObsolete` (F1); `exclusiveFiles`, `ownedRoots` (F2); `unregisterProvider` (F3); `applyEnabledPluginsDetailed`, `removePluginSkillsFor` (F4)
  - **Produces:** `applyDesiredState`, `diffState`

#### Phase 3 — The doors

- **F7** [product] — `cli/src/prompt.js`: add `promptExistingInstall(state)` → `modify|update|reinstall|cancel`
  (prints version, scope, providers, features, plugins first); `promptModify(current, scope)` → desired
  state via three multiselects pre-filled from the manifest, providers filtered by `globalCapable` in
  global scope; `promptApplyDiff(diff)` → boolean after printing `+`/`-` lines.
  - **Produces:** `promptExistingInstall`, `promptModify`, `promptApplyDiff`
- **F8** [product] — `cli/src/modify.js`: entry points `providers(cwd, args, scope)` for
  `list|add <name>|remove <name> [--force]` and `modify(cwd, args, scope)`. `modify` asks once —
  `promptApplyDiff` — and then calls `applyDesiredState` with `force: true`, so a removal is never
  confirmed twice; `providers remove` passes its own `--force`. Errors: no manifest →
  point at `install`; unknown provider; `remove` of a provider not installed. `add` of an installed
  provider → "nothing to change", no download.
  - **Consumes:** `applyDesiredState`, `diffState` (F6); `promptModify`, `promptApplyDiff` (F7)
  - **Produces:** `providers`, `modify` entry points
- **F9** [product] — `cli/src/installer.js` `install()`: after scope is resolved,
  `readManifest(targetDir)`; when present, `promptExistingInstall` routes to `modify` (manifest scope
  authoritative; `--version`/`--channel` ignored with an info line), `update(targetDir, { version,
  channel }, manifest.scope)`, the existing reinstall flow behind its existing overwrite confirmation,
  or a no-write cancel. No manifest → unchanged.
  - **Consumes:** `promptExistingInstall` (F7); `modify` entry point (F8)
- **F10** [product] — `cli/src/cli.js`: route `providers` and `modify` (scope from `resolveTarget`),
  add both to `USAGE` and its examples.
  - **Consumes:** `providers`, `modify` entry points (F8)
- **F11** [product] — `cli/tests/install.e2e.test.js` and every other suite that mocks
  `../src/prompt.js` (`features`, `updater`, `uninstaller`, `uninstall-scope`): add the three new
  prompt functions to the mock factory; the re-install tests (orphan prune L2.1*, migration ledger
  L2.8*) mock `promptExistingInstall` → `reinstall` so they still prove what they proved.
  - **Consumes:** `promptExistingInstall`, `promptModify`, `promptApplyDiff` (F7)

### Does NOT Include (important!)

- A non-interactive `install --providers a,b` for CI
- MCP cleanup in `uninstall` (backlog ticket, reusing F3)
- Version changes through `modify` — that is `update`
- README and web docs — `add-framework--sync` before release
- Any behaviour change to `codeadd features` / `codeadd plugins`
- `AGENTS.md` — its Feature Injection text stays accurate

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Surface | `providers` subcommands + `modify`, one core | design, Key Decisions |
| `install` over an existing install | Modify / Update / Reinstall / Cancel menu after scope | design, Proposed Solution 4 |
| Version a new provider gets | manifest `releaseTag` | design, Key Decisions |
| Name | `codeadd modify` | design, Key Decisions |
| Add path | recopy all desired providers before `captureBaselines` | design, "How the core applies a change" |
| Remove path | no download, no `captureBaselines` | design, same section |
| File ownership | root prefix (`dest`, `agentDest`) — computable without the zip | this plan, analysis of shared `.agents/` |
| Plugin skills on removal | per provider, skipping a dir a remaining provider shares | this plan, analysis of shared `.agents/skills` |
| `applyEnabledPlugins` shape | unchanged; detailed sibling added | keeps installer/updater call sites stable |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Pristine baselines on every add | Adding a provider re-downloads the whole release |
| One core for three doors | One more module (`modify.js`) |
| `install` cannot reset silently | One extra question on an existing project |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Baselines captured from composed files → double injection | Medium | F6 ordering; L2.1 and L2.3 assert single injection and byte-identical baselines |
| Removing codex deletes zcode's `.agents/` (or the reverse) | Medium | F2 + F4(b); L1.1, L1.3 both directions |
| MCP unregister damages a shared config | Medium | F3; L1.2 one case per format |
| Releasing tag cannot download | Low | F6 fails before writing; L2.8 |
| Existing install suites break on the new menu | High (certain without F11) | F11; L3.1 runs the unchanged assertions |
| Copy/prune refactor changes install/update behaviour | Medium | F1 is behaviour-neutral; L3.1 existing suites green before and after |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/src/release-copy.js` | product | create | F1 |
| `cli/src/installer.js` | product | modify | F1, F5, F9 |
| `cli/src/updater.js` | product | modify | F1, F5 |
| `cli/src/providers.js` | product | modify | F2 |
| `cli/src/mcp-registration.js` | product | modify | F3 |
| `cli/src/plugins.js` | product | modify | F4 |
| `cli/src/modify.js` | product | create | F6, F8 |
| `cli/src/prompt.js` | product | modify | F7 |
| `cli/src/cli.js` | product | modify | F10 |
| `cli/tests/install.e2e.test.js` | product | modify | F11 + new install-menu cases |
| `cli/tests/features.test.js`, `updater.test.js`, `uninstaller.test.js`, `uninstall-scope.test.js` | product | modify | F11 (mock factory only) |
| `cli/tests/modify.test.js` | product | create | L2.1–L2.12, L3.2, L3.4 |
| `cli/tests/providers.test.js` | product | modify | L1.1 |
| `cli/tests/mcp-registration.test.js` | product | modify | L1.2 |
| `cli/tests/plugins.test.js` | product | modify | L1.3, L1.4 |
| `cli/tests/prompt.test.js` | product | modify | L1.5 |
| `cli/tests/updater.test.js` | product | modify | L2.10 (plus F11 mock additions) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify it fails against the
current tree. Fixtures reuse the zip builders already in `install.e2e.test.js` / `updater.test.js` and
a v2 injection sidecar fixture as `features.test.js` uses.

**Expected end-state map (injection):** with `tdd-pipeline` enabled and one plugin enabled, after
`providers add <p>` every slot the sidecar declares for `<p>` holds each enabled member exactly once,
and every pre-existing provider's composed files are byte-identical to before the add.

### L1 — Unit (RED → GREEN)

1. `exclusiveFiles`: remove `codex` with `zcode` remaining → `.codex/**` returned, `.agents/**` not; remove `zcode` with `codex` remaining → `.zcode/**` only; remove `cursor` → all `.cursor/**`; in global scope, removing `opencode` returns `.config/opencode/**`, not `.opencode/**`. *RED: function does not exist.*
2. `unregisterProvider`: `mcpServers` (`.mcp.json` with a second server kept), `mcp.servers` (zcode), `opencode` — only `codeadd-docs` removed, other keys byte-preserved; `toml` → `print`, file untouched; unparseable JSON → `unreadable`, file untouched; no entry → `absent`. *RED: no export.*
3. `removePluginSkillsFor`: removing `codex` with `zcode` remaining keeps `.agents/skills/<plugin-skill>`; removing `cursor` deletes `.cursor/skills/<plugin-skill>`. *RED: no export.*
4. `applyEnabledPluginsDetailed`: an enabled plugin whose validator fails appears in `notDetected`; `applyEnabledPlugins` still returns a number. *RED: no export.*
5. `promptModify` in global scope offers no `cursor`/`antigrav`; `promptExistingInstall` offers exactly the four choices. *RED: no export.*

### L2 — Integration (core and doors)

1. **Add** `cursor` to a `claude` install with `tdd-pipeline` + a plugin enabled: download called with the manifest `releaseTag`, `getLatestTag` not called; the end-state map above holds; every baseline equals the zip's pristine bytes. *RED.*
2. **Add** preserves `features`, `plugins`, `migrations`, `channel`, `scope`, `gitignore` byte-equal in the manifest. *RED.*
3. **Remove-only** `codex` from `claude+codex+zcode` with a feature enabled: download not called; `.codex/**` and `.codeadd/baselines/codex/**` gone; manifest `files`/`hashes` hold no `.codex/` path; `baselineHashes` has no `codex` key while the `claude`/`zcode` entries and `installedAt` are unchanged; `.agents/**`, `.zcode/**` and `.codex/config.toml` (pre-seeded, not in manifest) remain; remaining baselines byte-identical before/after; with `gitignore: true` the block no longer lists `.codex`, with `gitignore: false` no `.gitignore` is written. *RED.*
4. **Features/plugins-only** change through `applyDesiredState`: download not called; result equals `features enable` of the same feature. *RED.*
5. **Errors:** `modify`/`providers` with no manifest; `providers remove` of a non-installed provider; `providers add cursor --global` — each exits with its message and writes nothing; `providers add claude` on a claude install → "nothing to change", no download. *RED.*
6. **Install menu:** with a manifest present — `modify` keeps state; `update` calls the update flow with the flags; `reinstall` (after confirm) reproduces today's reset; `cancel` leaves every file and the manifest byte-equal; without a manifest the menu is never called. *RED.*
7. **Remove confirmation:** declined → `USER_CANCEL`, nothing written; `--force` → prompt not called; `modify` removing a provider calls `promptApplyDiff` once and `promptConfirm` never. *RED.*
8. **Failed download on add:** manifest and every file byte-equal to before. *RED.*
9. **Not-detected plugin on add:** the warning names the plugin; manifest still shows it enabled. *RED.*
10. **Not-detected plugin on `update` and on `install` → reinstall:** each prints "plugin X is enabled but not applied to any provider (tool not detected)". *RED.*
11. **Add + toggle in one `modify` run:** add `cursor` and enable `qa-pipeline` → every provider including `cursor` carries both features' members exactly once; manifest `features.qa-pipeline === true`. *RED.*
12. **Remove the last provider:** succeeds, warns, manifest `providers` is `[]`, `.codeadd/` intact. *RED.*

### L3 — Behavioural acceptance

1. The existing `installer`, `install.e2e`, `updater`, `features`, `plugins`, `mcp-registration`, `uninstaller` suites pass with only the F11 mock additions — no assertion edited. *GREEN today; must stay GREEN after F1 (behaviour-neutral refactor).*
2. Round trip: on `claude` with features and a plugin, `providers add opencode` then `providers remove opencode` → manifest `providers/features/plugins` equal to the start and every `.claude/**` file byte-identical to the start; `opencode.json` has no `mcp.codeadd-docs` key (an empty `mcp` object is acceptable). *RED.*
3. `node bin` help output lists `providers` and `modify`. *RED.*
4. Import order: a fresh process importing `installer.js` first, and another importing `modify.js` first, both load without error and expose their exports (guards the function-only `installer` ↔ `modify` and `installer` ↔ `updater` import cycles F6 and F9 create). *RED: `modify.js` does not exist.*

**RED expectations against the current tree:** L1, L2 and L3.2–3.4 fail (missing exports, commands
and menu). L3.1 is green and is the regression net for F1 and F11.
**GREEN = all levels pass after F1–F11**, run through `scripts/run-tests.js`.

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11

- **F1 first** — behaviour-neutral refactor proven by L3.1 before anything depends on it.
- **F2–F4** are independent helpers; each lands with its L1 case.
- **F5** right after F4 so `install`/`update` report not-detected before the core reuses the wording.
- **F6** needs F1–F4. **F7** before F8 because the entry points call the prompts.
- **F9** needs F7 and F8. **F11 lands together with F9 in practice** — F9 is the change that makes the old re-install tests hit the menu; the build may commit F11 immediately after F9 but must not leave the tree with F9 and without F11 at a checkpoint.
- Working-state boundaries: after F5 (helpers only, no behaviour change except the warning), after F8 (new commands reachable from code, `install` untouched), after F11 (all done).

## Reviewer Handoff

For each F-block the build leaves, in the ledger: files touched, the validation levels covering it
with pass state, and any departure from the design with its section.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. `applyDesiredState` calling `captureBaselines` on the remove-only path, or before the manifest write on the add path.
3. A removal that deletes by `dest` alone and forgets `agentDest`, or deletes a path a remaining provider owns.
4. F11 editing an assertion instead of only adding mock functions and the `reinstall` answer.
5. `unregisterProvider` writing a JSON file it could not parse.

## References

- Design set: `docs/brainstorming/2026-10-07T092243-modify-installation-providers.md`, `...-intent.md`
- Prior art: `2026-09-24T004540-PLAN--zcode-sixth-provider` (shared `.agents/` tree); `2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids` (baselines + deterministic composition)

---

## Next Steps

/add-framework--build modify-installation-providers

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-07 | Initial creation |
| 2026-10-07 | Review fix-then-ok applied: remove-only saves the mutated manifest (keeps `baselineHashes`, `installedAt`; drops deleted `files`/`hashes`); provider change runs before feature/plugin toggles; `modify` confirms once and passes `force`; `ownedRoots` takes a scope-resolved entry; `.gitignore` rule stated; last-provider warning; copy/prune moved to leaf `release-copy.js`; L1.1 global case, L2.3 and L2.7 extended, L2.10–L2.12 and L3.4 added; one test home per case |
| 2026-10-07 | Implemented in 12 commits f6ab2f4..704f961 (F1-F11 and the review fixes); changelog docs/changelog/2026-10-07T115416-add-modify-installation-providers.md |
