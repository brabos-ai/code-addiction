import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { intro, outro, log } from '@clack/prompts';
import { resolveSelected } from './providers.js';
import {
  parseFragmentSections,
  loadInjectionPoints,
  resolveResourceFiles,
  applyInjectionToContent,
  removeInjectionFromContent,
  readManifest,
  saveManifest,
  recalculateHashes,
  injectAgentFragments,
  removeAgentFragments,
} from './injection-core.js';

/**
 * Loud, actionable warning when a plugin anchor can't be located (drift / edit).
 */
function warnMissed(pluginName, resourceName, missed) {
  for (const m of missed) {
    log.warn(
      `Could not inject plugin:${pluginName} [${m.sections.join(', ')}] into ${resourceName}: ` +
        `anchor not found ("${m.anchor.text}" #${m.anchor.ordinal}). The adjacent text may have been edited.`,
    );
  }
}

const CATALOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'plugins.json');

/**
 * Resolve the catalog file path. Honours CODEADD_PLUGINS_CATALOG (used by tests
 * to point at a controlled catalog); falls back to the baked-in CLI catalog.
 * @returns {string}
 */
function catalogPath() {
  return process.env.CODEADD_PLUGINS_CATALOG || CATALOG_PATH;
}

/**
 * Load the plugin catalog (travels with the npm CLI).
 * The `$schema-doc` key documents the schema and is not a plugin.
 * @returns {Record<string, object>}
 */
export function loadCatalog() {
  try {
    const raw = JSON.parse(fs.readFileSync(catalogPath(), 'utf8'));
    const { '$schema-doc': _doc, ...plugins } = raw;
    return plugins;
  } catch {
    return {};
  }
}

/**
 * Validate that a plugin's external tool is present (hard gate).
 * Runs the `detect` shell probe — exit-0 means present.
 * @param {object} entry catalog entry
 * @returns {boolean}
 */
export function validate(entry) {
  if (!entry.detect) return false;
  try {
    execSync(entry.detect, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get fragment files for a plugin from .codeadd/plugins/{name}/fragments/.
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {Array<{commandName: string, content: string}>}
 */
function getFragments(cwd, pluginName) {
  const fragmentDir = path.join(cwd, '.codeadd', 'plugins', pluginName, 'fragments');
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
 * Copy plugin-bound skills into every installed provider's skills dir.
 * Source: .codeadd/plugins/{name}/skills/{skill}/SKILL.md
 * Dest:   {provider.dest}/{provider.skillsSubdir}/{skill}/SKILL.md
 * @param {string} cwd
 * @param {string} pluginName
 * @param {string[]} skills
 * @returns {number} skills activated (provider × skill)
 */
function activateSkills(cwd, pluginName, skills) {
  if (!skills || skills.length === 0) return 0;
  const manifest = readManifest(cwd);
  const providers = resolveSelected(manifest?.providers ?? []).filter((p) => p.skillsSubdir);

  let activated = 0;
  for (const skill of skills) {
    const srcFile = path.join(cwd, '.codeadd', 'plugins', pluginName, 'skills', skill, 'SKILL.md');
    if (!fs.existsSync(srcFile)) continue;
    const content = fs.readFileSync(srcFile, 'utf8');
    for (const provider of providers) {
      const destDir = path.join(cwd, provider.dest, provider.skillsSubdir, skill);
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(path.join(destDir, 'SKILL.md'), content, 'utf8');
      activated++;
    }
  }
  return activated;
}

/**
 * Remove plugin-bound skill dirs from every installed provider's skills dir.
 * @param {string} cwd
 * @param {string[]} skills
 * @returns {number} skill dirs removed
 */
function deactivateSkills(cwd, skills) {
  if (!skills || skills.length === 0) return 0;
  const manifest = readManifest(cwd);
  const providers = resolveSelected(manifest?.providers ?? []).filter((p) => p.skillsSubdir);

  let removed = 0;
  for (const skill of skills) {
    for (const provider of providers) {
      const destDir = path.join(cwd, provider.dest, provider.skillsSubdir, skill);
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
        removed++;
      }
    }
  }
  return removed;
}

/**
 * Enable a plugin — validate (hard gate) → inject command + agent fragments →
 * activate skills → hint.
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {{ ok: boolean, modified: number, agents: number, skills: number, reason?: string }}
 */
export function enablePlugin(cwd, pluginName) {
  const catalog = loadCatalog();
  const entry = catalog[pluginName];
  if (!entry) return { ok: false, modified: 0, agents: 0, skills: 0, reason: 'unknown' };

  if (!validate(entry)) {
    return { ok: false, modified: 0, agents: 0, skills: 0, reason: 'not-detected' };
  }

  // Inject command fragments
  const fragments = getFragments(cwd, pluginName);
  const points = loadInjectionPoints(cwd).filter(
    (p) => p.namespace === 'plugin' && p.name === pluginName && p.resource.kind === 'command',
  );
  const modifiedPaths = [];
  for (const { commandName, content: fragmentContent } of fragments) {
    const sections = parseFragmentSections(fragmentContent);
    const cmdPoints = points.filter((p) => p.resource.name === commandName);
    if (cmdPoints.length === 0) continue;

    for (const cmdPath of resolveResourceFiles(cwd, { name: commandName, kind: 'command' })) {
      const original = fs.readFileSync(cmdPath, 'utf8');
      const { content: updated, missed } = applyInjectionToContent(original, cmdPoints, sections);
      if (missed.length) warnMissed(pluginName, commandName, missed);
      if (updated !== original) {
        fs.writeFileSync(cmdPath, updated, 'utf8');
        modifiedPaths.push(cmdPath);
      }
    }
  }

  // Inject agent fragments (carry the capability across the dispatch boundary)
  const agentPaths = injectAgentFragments(cwd, pluginName);

  // Activate skills
  const skills = activateSkills(cwd, pluginName, entry.skills);

  const manifest = readManifest(cwd);
  if (manifest) {
    if (!manifest.plugins) manifest.plugins = {};
    manifest.plugins[pluginName] = { enabled: true };
    recalculateHashes(cwd, manifest, [...modifiedPaths, ...agentPaths]);
    saveManifest(cwd, manifest);
  }

  return { ok: true, modified: modifiedPaths.length, agents: agentPaths.length, skills };
}

/**
 * Disable a plugin — remove injected command + agent sections, remove activated skills.
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {{ modified: number, agents: number, skills: number }}
 */
export function disablePlugin(cwd, pluginName) {
  const catalog = loadCatalog();
  const entry = catalog[pluginName] ?? {};

  const fragments = getFragments(cwd, pluginName);
  const points = loadInjectionPoints(cwd).filter(
    (p) => p.namespace === 'plugin' && p.name === pluginName && p.resource.kind === 'command',
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

  // Remove agent injections (symmetric with enable)
  const agentPaths = removeAgentFragments(cwd, pluginName);

  const skills = deactivateSkills(cwd, entry.skills);

  const manifest = readManifest(cwd);
  if (manifest) {
    if (!manifest.plugins) manifest.plugins = {};
    manifest.plugins[pluginName] = { enabled: false };
    recalculateHashes(cwd, manifest, [...modifiedPaths, ...agentPaths]);
    saveManifest(cwd, manifest);
  }

  return { modified: modifiedPaths.length, agents: agentPaths.length, skills };
}

/**
 * Re-apply enabled plugins after install/update (parallel to applyEnabledFeatures).
 * Skips validation failures silently — the tool may not be present in CI/headless.
 * @param {string} cwd
 * @returns {number} total command files modified
 */
export function applyEnabledPlugins(cwd) {
  const manifest = readManifest(cwd);
  if (!manifest) return 0;

  const pluginStates = manifest.plugins ?? {};
  let totalModified = 0;

  for (const [name, state] of Object.entries(pluginStates)) {
    if (state?.enabled) {
      const { modified } = enablePlugin(cwd, name);
      totalModified += modified;
    }
  }

  return totalModified;
}

/**
 * Get current plugin states (catalog × manifest, enabled defaults to false).
 * @param {string} cwd
 * @returns {Array<{name: string, description: string, enabled: boolean}>}
 */
export function getPluginStates(cwd) {
  const catalog = loadCatalog();
  const manifest = readManifest(cwd);
  const states = manifest?.plugins ?? {};

  return Object.entries(catalog).map(([name, entry]) => ({
    name,
    description: entry.description ?? '',
    enabled: states[name]?.enabled ?? false,
  }));
}

/**
 * CLI entry point for `codeadd plugins` subcommand.
 * @param {string} cwd
 * @param {string[]} args
 */
export async function plugins(cwd, args) {
  const action = args[0];
  const pluginName = args[1];
  const catalog = loadCatalog();

  if (!action || action === 'list') {
    intro('ADD CLI - Plugins');
    const states = getPluginStates(cwd);
    if (states.length === 0) {
      log.info('No plugins available.');
    } else {
      for (const s of states) {
        log.message(`${s.enabled ? '●' : '○'} ${s.name} — ${s.description}`);
      }
    }
    outro('Toggle with: codeadd plugins enable|disable <name>');
    return;
  }

  if (action === 'enable' || action === 'disable') {
    if (!pluginName) {
      outro(`ERROR: Missing plugin name. Usage: codeadd plugins ${action} <name>`);
      process.exit(1);
    }
    const entry = catalog[pluginName];
    if (!entry) {
      outro(`ERROR: Unknown plugin "${pluginName}". Available: ${Object.keys(catalog).join(', ') || 'none'}`);
      process.exit(1);
    }

    intro(`ADD CLI - Plugins ${action}`);

    if (action === 'enable') {
      const result = enablePlugin(cwd, pluginName);
      if (!result.ok) {
        if (result.reason === 'not-detected') {
          log.error(`Plugin "${pluginName}" requires an external tool that was not found.`);
          if (entry.homepage) log.info(`Homepage: ${entry.homepage}`);
          if (entry.installHint) log.info(entry.installHint);
        } else {
          log.error(`Could not enable "${pluginName}".`);
        }
        outro('Not enabled.');
        process.exit(1);
      }
      log.success(`Plugin "${pluginName}" enabled. ${result.modified} command(s), ${result.agents} agent(s), ${result.skills} skill(s) activated.`);
      if (entry.postEnableHint) log.info(entry.postEnableHint);
    } else {
      const result = disablePlugin(cwd, pluginName);
      log.success(`Plugin "${pluginName}" disabled. ${result.modified} command(s), ${result.agents} agent(s), ${result.skills} skill(s) removed.`);
    }

    outro('Done.');
    return;
  }

  log.error(`Unknown action "${action}". Use: list, enable, disable`);
  process.exit(1);
}
