import fs from 'node:fs';
import path from 'node:path';
import { intro, outro, log } from '@clack/prompts';
import { promptFeatures } from './prompt.js';
import {
  parseFragmentSections,
  loadInjectionPoints,
  resolveResourceFiles,
  applyInjectionToContent,
  removeInjectionFromContent,
  readManifest,
  saveManifest,
  recalculateHashes,
} from './injection-core.js';

/**
 * Emit an actionable, loud warning when an anchor cannot be located (the user
 * rewrote the adjacent prose, or the sidecar drifted). Never a silent no-op.
 * @param {string} namespace
 * @param {string} name
 * @param {string} resourceName
 * @param {Array<{sections:string[], anchor:object}>} missed
 */
function warnMissed(namespace, name, resourceName, missed) {
  for (const m of missed) {
    log.warn(
      `Could not inject ${namespace}:${name} [${m.sections.join(', ')}] into ${resourceName}: ` +
        `anchor not found ("${m.anchor.text}" #${m.anchor.ordinal}). The adjacent text may have been edited.`,
    );
  }
}

/**
 * Feature registry — each optional feature that can be toggled.
 *
 * The key doubles as the fragment directory name (see getFragments), so a key
 * rename is also a directory rename. `aliases` carries retired keys so a
 * manifest written before the rename still resolves to the user's choice
 * instead of silently falling back to `default`.
 */
export const FEATURES = {
  'tdd-pipeline': {
    description: 'TDD pipeline (test-first ordering + unit/integration generation)',
    default: true,
    aliases: ['tdd'],
    commands: ['add.plan', 'add.build', 'add.review', 'add.hotfix'],
  },
  'qa-pipeline': {
    description: 'QA pipeline (E2E authoring + agent QA validation)',
    default: false,
    commands: ['add.plan', 'add.build'],
  },
};

/**
 * Resolve a user-supplied feature name to its canonical registry key.
 * Accepts the canonical key or any retired alias.
 * @param {string} name
 * @returns {{ key: string, alias: string|null } | null}
 */
export function resolveFeatureName(name) {
  if (FEATURES[name]) return { key: name, alias: null };
  for (const [key, meta] of Object.entries(FEATURES)) {
    if (meta.aliases?.includes(name)) return { key, alias: name };
  }
  return null;
}

/**
 * Resolve one feature's enabled state from a manifest's `features` map.
 *
 * Order is load-bearing: explicit canonical key, THEN any alias key, THEN
 * `meta.default`. Reaching the default before consulting aliases is what
 * silently re-enables a feature the user explicitly disabled under its old key.
 *
 * @param {Record<string, boolean>} featureStates
 * @param {string} key      canonical registry key
 * @param {object} meta     registry entry
 * @returns {{ enabled: boolean, legacyKey: string|null }}
 */
function resolveFeatureState(featureStates, key, meta) {
  if (Object.prototype.hasOwnProperty.call(featureStates, key)) {
    return { enabled: featureStates[key], legacyKey: null };
  }
  for (const alias of meta.aliases ?? []) {
    if (Object.prototype.hasOwnProperty.call(featureStates, alias)) {
      return { enabled: featureStates[alias], legacyKey: alias };
    }
  }
  return { enabled: meta.default, legacyKey: null };
}

/**
 * Rewrite a manifest's `features` map with canonical keys, dropping any alias
 * key that was resolved into one. Pure — returns a new map plus whether the
 * rewrite changed anything.
 *
 * @param {Record<string, boolean>} featureStates
 * @returns {{ states: Record<string, boolean>, changed: boolean }}
 */
export function normalizeFeatureStates(featureStates) {
  const states = { ...featureStates };
  let changed = false;

  for (const [key, meta] of Object.entries(FEATURES)) {
    for (const alias of meta.aliases ?? []) {
      if (!Object.prototype.hasOwnProperty.call(states, alias)) continue;
      if (!Object.prototype.hasOwnProperty.call(states, key)) {
        states[key] = states[alias];
      }
      delete states[alias];
      changed = true;
    }
  }

  return { states, changed };
}

/**
 * Get fragment files for a feature.
 * @param {string} cwd
 * @param {string} featureName
 * @returns {Array<{commandName: string, content: string}>}
 */
function getFragments(cwd, featureName) {
  const fragmentDir = path.join(cwd, '.codeadd', 'fragments', featureName);
  if (!fs.existsSync(fragmentDir)) return [];

  const fragments = [];
  for (const entry of fs.readdirSync(fragmentDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const commandName = entry.name.replace('.md', '');
    const content = fs.readFileSync(path.join(fragmentDir, entry.name), 'utf8');
    fragments.push({ commandName, content });
  }
  return fragments;
}

/**
 * Enable a feature — inject fragment content into command markers.
 * @param {string} cwd
 * @param {string} featureName
 * @returns {{modified: number}}
 */
export function enableFeature(cwd, featureName) {
  const fragments = getFragments(cwd, featureName);
  const points = loadInjectionPoints(cwd).filter(
    (p) => p.namespace === 'feature' && p.name === featureName && p.resource.kind === 'command',
  );
  const modifiedPaths = [];

  for (const { commandName, content: fragmentContent } of fragments) {
    const sections = parseFragmentSections(fragmentContent);
    const cmdPoints = points.filter((p) => p.resource.name === commandName);
    if (cmdPoints.length === 0) continue;

    for (const cmdPath of resolveResourceFiles(cwd, { name: commandName, kind: 'command' })) {
      const original = fs.readFileSync(cmdPath, 'utf8');
      const { content: updated, missed } = applyInjectionToContent(original, cmdPoints, sections);
      if (missed.length) warnMissed('feature', featureName, commandName, missed);
      if (updated !== original) {
        fs.writeFileSync(cmdPath, updated, 'utf8');
        modifiedPaths.push(cmdPath);
      }
    }
  }

  const manifest = readManifest(cwd);
  if (manifest) {
    if (!manifest.features) manifest.features = {};
    manifest.features[featureName] = true;
    manifest.features = normalizeFeatureStates(manifest.features).states;
    recalculateHashes(cwd, manifest, modifiedPaths);
    saveManifest(cwd, manifest);
  }

  return { modified: modifiedPaths.length };
}

/**
 * Disable a feature — remove content between command markers.
 * @param {string} cwd
 * @param {string} featureName
 * @returns {{modified: number}}
 */
export function disableFeature(cwd, featureName) {
  const fragments = getFragments(cwd, featureName);
  const points = loadInjectionPoints(cwd).filter(
    (p) => p.namespace === 'feature' && p.name === featureName && p.resource.kind === 'command',
  );
  const modifiedPaths = [];

  for (const { commandName, content: fragmentContent } of fragments) {
    const sections = parseFragmentSections(fragmentContent);
    const cmdPoints = points.filter((p) => p.resource.name === commandName);
    if (cmdPoints.length === 0) continue;

    for (const cmdPath of resolveResourceFiles(cwd, { name: commandName, kind: 'command' })) {
      const original = fs.readFileSync(cmdPath, 'utf8');
      const updated = removeInjectionFromContent(original, cmdPoints, sections);
      if (updated !== original) {
        fs.writeFileSync(cmdPath, updated, 'utf8');
        modifiedPaths.push(cmdPath);
      }
    }
  }

  const manifest = readManifest(cwd);
  if (manifest) {
    if (!manifest.features) manifest.features = {};
    manifest.features[featureName] = false;
    manifest.features = normalizeFeatureStates(manifest.features).states;
    recalculateHashes(cwd, manifest, modifiedPaths);
    saveManifest(cwd, manifest);
  }

  return { modified: modifiedPaths.length };
}

/**
 * Apply all enabled features after install/update.
 * @param {string} cwd
 */
export function applyEnabledFeatures(cwd) {
  const manifest = readManifest(cwd);
  if (!manifest) return;

  const featureStates = manifest.features ?? {};
  let totalModified = 0;

  for (const [name, meta] of Object.entries(FEATURES)) {
    const { enabled } = resolveFeatureState(featureStates, name, meta);
    if (enabled) {
      const { modified } = enableFeature(cwd, name);
      totalModified += modified;
    }
  }

  // Unconditional normalisation. enableFeature reaches saveManifest only for a
  // feature that resolves ENABLED, so a manifest holding a disabled legacy key
  // — the exact motivating case — would otherwise never be rewritten and the
  // orphaned key would linger as dead data forever.
  const current = readManifest(cwd);
  if (current) {
    const { states, changed } = normalizeFeatureStates(current.features ?? {});
    if (changed) {
      current.features = states;
      saveManifest(cwd, current);
    }
  }

  return totalModified;
}

/**
 * Get current feature states.
 * @param {string} cwd
 * @returns {Array<{name: string, description: string, enabled: boolean}>}
 */
export function getFeatureStates(cwd) {
  const manifest = readManifest(cwd);
  const featureStates = manifest?.features ?? {};

  return Object.entries(FEATURES).map(([name, meta]) => {
    const { enabled, legacyKey } = resolveFeatureState(featureStates, name, meta);
    return { name, description: meta.description, enabled, legacyKey };
  });
}

/**
 * CLI entry point for `codeadd features` subcommand.
 * Scope flows through manifest.scope (read by resolveResourceFiles); the param
 * exists so bin can pass it positionally and is the fallback when absent.
 * @param {string} cwd
 * @param {string[]} args
 * @param {'project'|'global'} [scope]
 */
export async function features(cwd, args, scope = 'project') {
  void scope;
  const action = args[0];
  const featureName = args[1];

  if (!action || action === 'list') {
    intro('ADD CLI - Features');

    const states = getFeatureStates(cwd);
    const currentlyEnabled = states.filter((f) => f.enabled).map((f) => f.name);

    for (const { name, legacyKey } of states) {
      if (legacyKey) {
        log.warn(`Manifest still carries the retired key "${legacyKey}". It resolves to "${name}" and is normalised on the next update.`);
      }
    }

    const selected = await promptFeatures(currentlyEnabled);

    let totalModified = 0;
    for (const { name } of states) {
      const wasEnabled = currentlyEnabled.includes(name);
      const nowEnabled = selected.includes(name);
      if (nowEnabled && !wasEnabled) {
        const { modified } = enableFeature(cwd, name);
        totalModified += modified;
        log.success(`Feature "${name}" enabled. ${modified} file(s) modified.`);
      } else if (!nowEnabled && wasEnabled) {
        const { modified } = disableFeature(cwd, name);
        totalModified += modified;
        log.success(`Feature "${name}" disabled. ${modified} file(s) modified.`);
      }
    }

    if (totalModified === 0) {
      log.info('No changes.');
    }

    outro('Done.');
    return;
  }

  if (action === 'enable' || action === 'disable') {
    if (!featureName) {
      outro(`ERROR: Missing feature name. Usage: codeadd features ${action} <name>`);
      process.exit(1);
    }
    const resolved = resolveFeatureName(featureName);
    if (!resolved) {
      outro(`ERROR: Unknown feature "${featureName}". Available: ${Object.keys(FEATURES).join(', ')}`);
      process.exit(1);
    }

    intro(`ADD CLI - Features ${action}`);

    // An alias is honoured, never rejected: somebody's setup script calls
    // `features disable tdd`, and failing it turns a rename into an outage.
    if (resolved.alias) {
      log.warn(`"${resolved.alias}" is deprecated and now means "${resolved.key}". Update your scripts.`);
    }

    const canonical = resolved.key;
    if (action === 'enable') {
      const { modified } = enableFeature(cwd, canonical);
      log.success(`Feature "${canonical}" enabled. ${modified} file(s) modified.`);
    } else {
      const { modified } = disableFeature(cwd, canonical);
      log.success(`Feature "${canonical}" disabled. ${modified} file(s) modified.`);
    }

    outro('Done.');
    return;
  }

  log.error(`Unknown action "${action}". Use: list, enable, disable`);
  process.exit(1);
}
