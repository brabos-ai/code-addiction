import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { intro, outro, log } from '@clack/prompts';
import { resolveSelected } from './providers.js';
import {
  resolveResourceTargets,
  readManifest,
  saveManifest,
  reconcileSlots,
} from './injection-core.js';

/**
 * Loud, actionable warning when a plugin anchor can't be located (drift / edit).
 */
function logSlotWarnings(warnings) {
  for (const w of warnings || []) log.warn(`${w.resource} slot ${w.slot} member ${w.member}: ${w.reason}`);
}

function reconcilePluginSlots(cwd) {
  const result = reconcileSlots(cwd, { pluginActive: isPluginDetected });
  if (!result) {
    log.warn('Plugin prompts were not updated: this installation has no v2 injection sidecar. Run `codeadd update`.');
    return { modified: [], warnings: [] };
  }
  logSlotWarnings(result.warnings);
  return result;
}

/** Skills older releases copied for a plugin and no catalog entry lists any more. */
export const LEGACY_PLUGIN_SKILLS = {
  gitnexus: ['add-gitnexus'],
};

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

export function isPluginDetected(name) {
  const entry = loadCatalog()[name];
  return !!entry && validate(entry);
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
  const providers = resolveSelected(manifest?.providers ?? [], manifest?.scope ?? 'project').filter((p) => p.skillsSubdir);

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
  const providers = resolveSelected(manifest?.providers ?? [], manifest?.scope ?? 'project').filter((p) => p.skillsSubdir);

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

  const skills = activateSkills(cwd, pluginName, entry.skills);
  const manifest = readManifest(cwd);
  if (manifest) {
    if (!manifest.plugins) manifest.plugins = {};
    manifest.plugins[pluginName] = { enabled: true };
    saveManifest(cwd, manifest);
  }
  const result = reconcilePluginSlots(cwd);
  const agents = result.modified.filter((f) => f.includes(`${path.sep}agents${path.sep}`)).length;
  return { ok: true, modified: result.modified.length - agents, agents, skills };
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

  const skills = deactivateSkills(cwd, entry.skills);
  const manifest = readManifest(cwd);
  if (manifest) {
    if (!manifest.plugins) manifest.plugins = {};
    manifest.plugins[pluginName] = { enabled: false };
    saveManifest(cwd, manifest);
  }
  const result = reconcilePluginSlots(cwd);
  const agents = result.modified.filter((f) => f.includes(`${path.sep}agents${path.sep}`)).length;
  return { modified: result.modified.length - agents, agents, skills };
}

/**
 * Delete the activated skills of every enabled plugin from the providers being
 * removed — and only from those.
 *
 * Plugin skills sit outside the manifest `files`, so the obsolete-file prune
 * never reaches them. `deactivateSkills` is not the tool: it acts on every
 * installed provider, which is right for `plugins disable` and wrong here.
 *
 * A removed provider's skills directory is skipped when a remaining provider
 * resolves to the same one — codex and zcode both use `.agents/skills`, and
 * deleting it for one breaks the other.
 *
 * @param {string} cwd
 * @param {{dest: string, skillsSubdir: string|null}[]} removedProviders    resolveSelected() entries
 * @param {{dest: string, skillsSubdir: string|null}[]} remainingProviders  resolveSelected() entries
 * @returns {number} skill dirs removed
 */
export function removePluginSkillsFor(cwd, removedProviders, remainingProviders) {
  const manifest = readManifest(cwd);
  if (!manifest) return 0;

  const skillsRoot = (p) => path.join(p.dest, p.skillsSubdir);
  const kept = new Set(remainingProviders.filter((p) => p.skillsSubdir).map(skillsRoot));
  const targets = removedProviders.filter((p) => p.skillsSubdir && !kept.has(skillsRoot(p)));

  const catalog = loadCatalog();
  let removed = 0;
  for (const [name, state] of Object.entries(manifest.plugins ?? {})) {
    if (!state?.enabled) continue;
    for (const skill of [...(catalog[name]?.skills ?? []), ...(LEGACY_PLUGIN_SKILLS[name] ?? [])]) {
      for (const provider of targets) {
        const destDir = path.join(cwd, skillsRoot(provider), skill);
        if (fs.existsSync(destDir)) {
          fs.rmSync(destDir, { recursive: true, force: true });
          removed++;
        }
      }
    }
  }
  return removed;
}

/**
 * Re-apply enabled plugins after install/update, and say which ones it could
 * not apply.
 *
 * A plugin whose external tool is not detected stays enabled in the manifest
 * and lands in `notDetected`. The tool may be absent in CI/headless, so this
 * does not fail — but it no longer skips in silence either.
 *
 * @param {string} cwd
 * @returns {{ modified: number, notDetected: string[] }}
 */
export function applyEnabledPluginsDetailed(cwd) {
  const manifest = readManifest(cwd);
  if (!manifest) return { modified: 0, notDetected: [] };
  let modified = 0;
  const notDetected = [];
  for (const [name, state] of Object.entries(manifest.plugins ?? {})) {
    if (state?.enabled) {
      const result = enablePlugin(cwd, name);
      if (result.ok) modified += result.modified;
      else if (result.reason === 'not-detected') notDetected.push(name);
    }
  }
  return { modified, notDetected };
}

/**
 * Re-apply enabled plugins after install/update (parallel to applyEnabledFeatures).
 * Thin wrapper over `applyEnabledPluginsDetailed` for callers that only want the
 * count; use the detailed form when the not-detected plugins must be reported.
 * @param {string} cwd
 * @returns {number} total command files modified
 */
export function applyEnabledPlugins(cwd) {
  return applyEnabledPluginsDetailed(cwd).modified;
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
 * Scope flows through manifest.scope (read by resolveResourceTargets and skill
 * activation); the param exists so bin can pass it positionally.
 * @param {string} cwd
 * @param {string[]} args
 * @param {'project'|'global'} [scope]
 */
export async function plugins(cwd, args, scope = 'project') {
  void scope;
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
