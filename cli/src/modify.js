import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { log } from '@clack/prompts';
import { PROVIDERS, resolveSelected, exclusiveFiles, ownedRoots, globalCapable } from './providers.js';
import { copyRelease, pruneObsolete, shouldPreserve } from './release-copy.js';
import { downloadReleaseAsset } from './github.js';
import { fixLineEndings, writeManifest, reportMcpRegistration, reportNotDetectedPlugins } from './installer.js';
import { readManifest, saveManifest, captureBaselines } from './injection-core.js';
import {
  FEATURES,
  resolveFeatureName,
  normalizeFeatureStates,
  applyEnabledFeatures,
  enableFeature,
  disableFeature,
} from './features.js';
import {
  loadCatalog,
  enablePlugin,
  disablePlugin,
  applyEnabledPluginsDetailed,
  removePluginSkillsFor,
} from './plugins.js';
import { writeMcpRegistration, unregisterProvider } from './mcp-registration.js';
import { getInstalledDirs, writeGitignoreBlock } from './gitignore.js';
import { promptConfirm } from './prompt.js';

/**
 * The core every way of changing an installation goes through.
 *
 * `desired` is `{ providers?: string[], features?: {name: boolean}, plugins?: {name: boolean} }`.
 * A key left out means "unchanged", so a caller states only what it wants to move.
 * `diffState` compares it with the manifest and `applyDesiredState` applies only
 * the difference. Nothing else in the CLI re-implements this, so the doors on top
 * of it (`providers`, `modify`, the install menu) cannot drift apart.
 *
 * THE ORDER INSIDE THE ADD PATH IS A CONSTRAINT, NOT A DETAIL:
 * copy -> prune -> write manifest -> captureBaselines -> features -> plugins ->
 * MCP -> .gitignore. `captureBaselines` and both apply functions resolve their
 * targets from the manifest's providers, so the manifest must already carry the
 * new set when they run. And the recopy covers EVERY desired provider, not just
 * the new one: `captureBaselines` snapshots whatever is on disk, so a provider
 * left composed would be baselined as pristine and injected twice.
 */

const BASELINE_ROOT = '.codeadd/baselines';

function currentFeature(manifest, name) {
  const states = normalizeFeatureStates(manifest.features ?? {}).states;
  return states[name] ?? FEATURES[name]?.default ?? false;
}

function currentPlugin(manifest, name) {
  return manifest.plugins?.[name]?.enabled === true;
}

/**
 * What would change if `desired` were applied to this manifest.
 *
 * @param {object} manifest
 * @param {{providers?: string[], features?: Record<string, boolean>, plugins?: Record<string, boolean>}} desired
 * @returns {{
 *   providers: {add: string[], remove: string[]},
 *   features: {enable: string[], disable: string[]},
 *   plugins: {enable: string[], disable: string[]},
 *   isEmpty: boolean
 * }}
 */
export function diffState(manifest, desired) {
  const current = manifest.providers ?? [];
  const wanted = desired.providers ?? current;

  const toggles = (wantedStates = {}, isOn) => {
    const entries = Object.entries(wantedStates);
    return {
      enable: entries.filter(([name, on]) => on && !isOn(name)).map(([name]) => name),
      disable: entries.filter(([name, on]) => !on && isOn(name)).map(([name]) => name),
    };
  };

  const diff = {
    providers: {
      add: wanted.filter((key) => !current.includes(key)),
      remove: current.filter((key) => !wanted.includes(key)),
    },
    features: toggles(desired.features, (name) => currentFeature(manifest, name)),
    plugins: toggles(desired.plugins, (name) => currentPlugin(manifest, name)),
  };
  diff.isEmpty = [
    diff.providers.add,
    diff.providers.remove,
    diff.features.enable,
    diff.features.disable,
    diff.plugins.enable,
    diff.plugins.disable,
  ].every((list) => list.length === 0);
  return diff;
}

/**
 * Refuse a request that cannot be applied, BEFORE anything is touched. Returns
 * `desired` with feature names resolved to their canonical keys.
 */
function validate(desired, scope) {
  for (const key of desired.providers ?? []) {
    if (!PROVIDERS[key]) {
      throw new Error(`Unknown provider "${key}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
    }
    if (scope === 'global' && !globalCapable(key)) {
      throw new Error(`Provider "${key}" cannot be installed globally: it has no user-level destination.`);
    }
  }

  const features = {};
  for (const [name, on] of Object.entries(desired.features ?? {})) {
    const resolved = resolveFeatureName(name);
    if (!resolved) throw new Error(`Unknown feature "${name}". Available: ${Object.keys(FEATURES).join(', ')}`);
    features[resolved.key] = on;
  }

  const catalog = loadCatalog();
  for (const name of Object.keys(desired.plugins ?? {})) {
    if (!catalog[name]) {
      throw new Error(`Unknown plugin "${name}". Available: ${Object.keys(catalog).join(', ') || 'none'}`);
    }
  }

  return { ...desired, features };
}

/** Delete empty directories under `root`, bottom-up, then `root` itself if it ends up empty. */
function pruneEmptyDirs(root) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmptyDirs(path.join(root, entry.name));
  }
  if (fs.readdirSync(root).length === 0) fs.rmdirSync(root);
}

/**
 * Tidy the roots of providers that were removed, except the ones a remaining
 * provider still owns (codex and zcode share `.agents`).
 */
function pruneRemovedRoots(targetDir, removedEntries, remainingEntries) {
  const kept = new Set(remainingEntries.flatMap(ownedRoots));
  for (const root of removedEntries.flatMap(ownedRoots)) {
    if (!kept.has(root)) pruneEmptyDirs(path.join(targetDir, root));
  }
}

function removeBaselineDirs(targetDir, removedKeys) {
  for (const key of removedKeys) {
    fs.rmSync(path.join(targetDir, BASELINE_ROOT, key), { recursive: true, force: true });
  }
}

/** Report what the unregister did — the same voice `reportMcpRegistration` uses. */
function reportMcpRemoval(results) {
  const removed = results.filter((r) => r.status === 'removed').length;
  if (removed > 0) log.success(`Knowledge-graph MCP unregistered for ${removed} provider(s).`);
  for (const r of results) {
    if (r.status === 'print') {
      log.info(`${r.provider}: ${r.line}`);
    } else if (r.status === 'unreadable') {
      log.warn(`${r.provider}: ${r.file} could not be read and was left untouched — ${r.line}`);
    }
  }
}

function syncGitignore(targetDir, manifest, scope, providerKeys) {
  // Project scope only, and only when the install opted in — the rule `update` applies.
  if (scope === 'project' && manifest.gitignore === true) {
    writeGitignoreBlock(targetDir, getInstalledDirs(providerKeys));
    log.success('.gitignore synced.');
  }
}

/**
 * A provider was added (with or without removals in the same change): recopy
 * `.codeadd/` and EVERY desired provider from the release the installation is
 * already on, then rebuild everything that depends on pristine files.
 */
async function applyAdd(targetDir, manifest, scope, wanted, diff) {
  const tag = manifest.releaseTag ?? `v${manifest.version}`;
  const wantedEntries = resolveSelected(wanted.providers, scope);
  const removedEntries = resolveSelected(diff.providers.remove, scope);
  const addedEntries = resolveSelected(diff.providers.add, scope);

  // Download FIRST. A tag that no longer downloads must leave every file as it was.
  let buffer;
  try {
    buffer = await downloadReleaseAsset(tag);
  } catch (err) {
    throw new Error(
      `Could not download the installed release ${tag}: ${err.message}. Nothing was changed. ` +
        'Run `codeadd update` to move to a release that can be downloaded.',
    );
  }

  const written = copyRelease(new AdmZip(buffer), targetDir, wantedEntries, { skipPreserved: true });
  fixLineEndings(path.join(targetDir, '.codeadd', 'scripts'));
  const pruned = pruneObsolete(targetDir, manifest.files ?? [], written);
  if (pruned > 0) log.success(`Removed ${pruned} obsolete file(s).`);

  removePluginSkillsFor(targetDir, removedEntries, wantedEntries);
  removeBaselineDirs(targetDir, diff.providers.remove);
  pruneRemovedRoots(targetDir, removedEntries, wantedEntries);

  // Everything the manifest carried that writeManifest does not set itself travels
  // through verbatim; `baselineHashes` is rebuilt by captureBaselines just below.
  const SET_BY_WRITE = new Set(['version', 'releaseTag', 'installedAt', 'providers', 'files', 'hashes', 'baselineHashes']);
  const carried = Object.fromEntries(Object.entries(manifest).filter(([key]) => !SET_BY_WRITE.has(key)));
  writeManifest(targetDir, manifest.version, wanted.providers, written, manifest.releaseTag ?? tag, carried);

  const baselines = captureBaselines(targetDir);
  for (const w of baselines.warnings) log.warn(`${w.resource} ${w.slot} ${w.member}: ${w.reason}`);

  const features = applyEnabledFeatures(targetDir);
  if (features > 0) log.success(`Re-applied ${features} feature injection(s).`);

  const plugins = applyEnabledPluginsDetailed(targetDir);
  if (plugins.modified > 0) log.success(`Re-applied ${plugins.modified} plugin injection(s).`);
  reportNotDetectedPlugins(plugins.notDetected);

  if (addedEntries.length > 0) reportMcpRegistration(writeMcpRegistration(targetDir, addedEntries, manifest.version));
  if (diff.providers.remove.length > 0) {
    reportMcpRemoval(diff.providers.remove.map((key) => unregisterProvider(targetDir, key)));
  }
}

/**
 * Providers were only removed: no download, and NO `captureBaselines`. The
 * remaining providers' files are already composed, so snapshotting them now
 * would record composed text as pristine and the next composition would inject
 * twice. The manifest is edited in place rather than rewritten, because
 * `writeManifest` would drop `baselineHashes` and reset `installedAt`.
 */
function applyRemove(targetDir, manifest, scope, wanted, diff) {
  const removedEntries = resolveSelected(diff.providers.remove, scope);
  const remainingEntries = resolveSelected(wanted.providers, scope);

  const files = manifest.files ?? [];
  // exclusiveFiles reads the manifest list, so nothing outside it is ever deleted;
  // shouldPreserve is the one definition of "never delete this" on top of that.
  const doomed = new Set(exclusiveFiles(files, removedEntries, remainingEntries).filter((f) => !shouldPreserve(f)));
  for (const file of doomed) {
    try {
      fs.rmSync(path.join(targetDir, file), { force: true });
    } catch {
      // A file that cannot be removed is not worth failing the change over.
    }
  }

  removePluginSkillsFor(targetDir, removedEntries, remainingEntries);
  removeBaselineDirs(targetDir, diff.providers.remove);
  pruneRemovedRoots(targetDir, removedEntries, remainingEntries);

  const prefixes = diff.providers.remove.map((key) => `${BASELINE_ROOT}/${key}/`);
  const next = { ...manifest, providers: wanted.providers };
  next.files = files.filter((f) => !doomed.has(f));
  next.hashes = Object.fromEntries(Object.entries(manifest.hashes ?? {}).filter(([f]) => !doomed.has(f)));
  if (manifest.baselineHashes) {
    next.baselineHashes = Object.fromEntries(
      Object.entries(manifest.baselineHashes).filter(([f]) => !prefixes.some((p) => f.startsWith(p))),
    );
  }
  saveManifest(targetDir, next);

  reportMcpRemoval(diff.providers.remove.map((key) => unregisterProvider(targetDir, key)));
}

/**
 * Apply `desired` to the installation under `targetDir`.
 *
 * @param {string} targetDir  the scope-resolved install root
 * @param {{providers?: string[], features?: Record<string, boolean>, plugins?: Record<string, boolean>}} desired
 * @param {{force?: boolean}} [options]  `force` skips the removal confirmation
 * @returns {Promise<ReturnType<typeof diffState>>} what was applied
 */
export async function applyDesiredState(targetDir, desired, { force = false } = {}) {
  const manifest = readManifest(targetDir);
  if (!manifest) throw new Error('No ADD installation found. Run `npx codeadd install` first.');
  const scope = manifest.scope ?? 'project';

  const checked = validate(desired, scope);
  const wanted = { ...checked, providers: checked.providers ?? manifest.providers ?? [] };
  const diff = diffState(manifest, wanted);
  if (diff.isEmpty) {
    log.info('Nothing to change.');
    return diff;
  }

  if (diff.providers.remove.length > 0) {
    if (!force) {
      // promptConfirm throws USER_CANCEL on a decline, which `runCli` already treats as a clean exit.
      await promptConfirm(`Remove ${diff.providers.remove.join(', ')}? Its files are deleted from this project.`);
    }
    if (wanted.providers.length === 0) {
      log.warn('No providers left: only .codeadd/ remains.');
    }
  }

  if (diff.providers.add.length > 0) {
    await applyAdd(targetDir, manifest, scope, wanted, diff);
  } else if (diff.providers.remove.length > 0) {
    applyRemove(targetDir, manifest, scope, wanted, diff);
  }

  // Feature and plugin toggles run AFTER the provider change, through the same
  // functions the `features` and `plugins` subcommands call.
  for (const name of diff.features.enable) enableFeature(targetDir, name);
  for (const name of diff.features.disable) disableFeature(targetDir, name);
  for (const name of diff.plugins.enable) {
    const result = enablePlugin(targetDir, name);
    if (!result.ok) {
      const entry = loadCatalog()[name];
      log.warn(`plugin ${name} was not enabled: its tool was not detected.${entry?.installHint ? ` ${entry.installHint}` : ''}`);
    }
  }
  for (const name of diff.plugins.disable) disablePlugin(targetDir, name);

  if (diff.providers.add.length > 0 || diff.providers.remove.length > 0) {
    syncGitignore(targetDir, manifest, scope, wanted.providers);
  }

  return diff;
}
