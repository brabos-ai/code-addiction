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
 */
export const FEATURES = {
  tdd: {
    description: 'TDD Pipeline (test-first development)',
    default: true,
    commands: ['add.plan', 'add.build', 'add.review'],
  },
  'qa-pipeline': {
    description: 'QA pipeline (E2E authoring + agent QA validation)',
    default: false,
    commands: ['add.plan', 'add.test', 'add.build'],
  },
};

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
    const enabled = featureStates[name] ?? meta.default;
    if (enabled) {
      const { modified } = enableFeature(cwd, name);
      totalModified += modified;
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

  return Object.entries(FEATURES).map(([name, meta]) => ({
    name,
    description: meta.description,
    enabled: featureStates[name] ?? meta.default,
  }));
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
    if (!FEATURES[featureName]) {
      outro(`ERROR: Unknown feature "${featureName}". Available: ${Object.keys(FEATURES).join(', ')}`);
      process.exit(1);
    }

    intro(`ADD CLI - Features ${action}`);

    if (action === 'enable') {
      const { modified } = enableFeature(cwd, featureName);
      log.success(`Feature "${featureName}" enabled. ${modified} file(s) modified.`);
    } else {
      const { modified } = disableFeature(cwd, featureName);
      log.success(`Feature "${featureName}" disabled. ${modified} file(s) modified.`);
    }

    outro('Done.');
    return;
  }

  log.error(`Unknown action "${action}". Use: list, enable, disable`);
  process.exit(1);
}
