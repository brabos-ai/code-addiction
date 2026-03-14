import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { intro, outro, log } from '@clack/prompts';
import { promptFeatures } from './prompt.js';
import { resolveSelected } from './providers.js';

/**
 * Feature registry — each optional feature that can be toggled.
 */
export const FEATURES = {
  tdd: {
    description: 'TDD Pipeline (test-first development)',
    default: true,
    commands: ['add-plan', 'add-dev'],
  },
  'startup-test': {
    description: 'Application Startup Test (IoC/DI validation)',
    default: true,
    commands: ['add-dev', 'add-review'],
  },
};

/**
 * Read .codeadd/manifest.json
 * @param {string} cwd
 * @returns {object | null}
 */
function readManifest(cwd) {
  const manifestPath = path.join(cwd, '.codeadd', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Write manifest back to disk.
 * @param {string} cwd
 * @param {object} manifest
 */
function saveManifest(cwd, manifest) {
  const manifestPath = path.join(cwd, '.codeadd', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

/**
 * Calculate SHA-256 hash of a file.
 * @param {string} filePath
 * @returns {string | null}
 */
function calculateHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Parse fragment file into sections.
 * Sections are delimited by <!-- section:NAME --> and <!-- /section:NAME --> markers.
 * @param {string} fragmentContent
 * @returns {Map<string, string>} sectionName → content
 */
function parseFragmentSections(fragmentContent) {
  const sections = new Map();
  const regex = /<!-- section:(\S+) -->\n([\s\S]*?)<!-- \/section:\1 -->/g;
  let match;
  while ((match = regex.exec(fragmentContent)) !== null) {
    sections.set(match[1], match[2]);
  }
  return sections;
}

/**
 * Inject fragment sections into command markers.
 * Markers: <!-- feature:FEATURE:SECTION --> ... <!-- /feature:FEATURE:SECTION -->
 * @param {string} commandContent
 * @param {string} featureName
 * @param {Map<string, string>} sections
 * @returns {string}
 */
function injectSections(commandContent, featureName, sections) {
  let result = commandContent;
  for (const [sectionName, sectionContent] of sections) {
    const marker = `feature:${featureName}:${sectionName}`;
    const regex = new RegExp(
      `(<!-- ${escapeRegex(marker)} -->)\\n?[\\s\\S]*?(<!-- \\/${escapeRegex(marker)} -->)`,
      'g'
    );
    result = result.replace(regex, `$1\n${sectionContent}$2`);
  }
  return result;
}

/**
 * Remove content between feature markers (keep markers empty).
 * @param {string} commandContent
 * @param {string} featureName
 * @returns {string}
 */
function removeSections(commandContent, featureName) {
  const regex = new RegExp(
    `(<!-- feature:${escapeRegex(featureName)}:\\S+ -->)\\n?[\\s\\S]*?(<!-- \\/feature:${escapeRegex(featureName)}:\\S+ -->)`,
    'g'
  );
  return commandContent.replace(regex, '$1\n$2');
}

/**
 * Escape string for use in regex.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get all installed command file paths that have markers for a feature.
 * Searches provider command directories based on manifest.providers.
 * @param {string} cwd
 * @param {string} featureName
 * @returns {string[]} absolute paths
 */
function findCommandsWithMarkers(cwd, featureName) {
  const manifest = readManifest(cwd);
  const providerKeys = manifest?.providers ?? [];
  const providers = resolveSelected(providerKeys);

  const commandDirs = providers
    .filter((p) => p.commandsSubdir)
    .map((p) => path.join(cwd, p.dest, p.commandsSubdir));

  const files = [];
  const marker = `feature:${featureName}:`;

  for (const dir of commandDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const fullPath = path.join(dir, entry.name);
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(marker)) {
        files.push(fullPath);
      }
    }
  }

  return files;
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
 * Recalculate hashes for modified command files in manifest.
 * @param {string} cwd
 * @param {object} manifest
 * @param {string[]} modifiedPaths absolute paths of modified files
 */
function recalculateHashes(cwd, manifest, modifiedPaths) {
  if (!manifest.hashes) manifest.hashes = {};
  for (const absPath of modifiedPaths) {
    const relPath = path.relative(cwd, absPath).replace(/\\/g, '/');
    const hash = calculateHash(absPath);
    if (hash) manifest.hashes[relPath] = hash;
  }
}

/**
 * Enable a feature — inject fragment content into command markers.
 * @param {string} cwd
 * @param {string} featureName
 * @returns {{modified: number}}
 */
export function enableFeature(cwd, featureName) {
  const fragments = getFragments(cwd, featureName);
  const modifiedPaths = [];

  for (const { commandName, content: fragmentContent } of fragments) {
    const sections = parseFragmentSections(fragmentContent);
    const commandFiles = findCommandsWithMarkers(cwd, featureName)
      .filter((f) => path.basename(f, '.md') === commandName);

    for (const cmdPath of commandFiles) {
      const original = fs.readFileSync(cmdPath, 'utf8');
      const updated = injectSections(original, featureName, sections);
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
  const commandFiles = findCommandsWithMarkers(cwd, featureName);
  const modifiedPaths = [];

  for (const cmdPath of commandFiles) {
    const original = fs.readFileSync(cmdPath, 'utf8');
    const updated = removeSections(original, featureName);
    if (updated !== original) {
      fs.writeFileSync(cmdPath, updated, 'utf8');
      modifiedPaths.push(cmdPath);
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
 * @param {string} cwd
 * @param {string[]} args
 */
export async function features(cwd, args) {
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
