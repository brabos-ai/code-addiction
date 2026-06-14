import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveSelected } from './providers.js';

/**
 * injection-core — shared pure helpers + manifest IO for the two additive
 * injection systems: `features` (internal behaviour toggles) and `plugins`
 * (external-tool integrations). Both inject fragment sections into command
 * markers; they differ only by marker namespace (`feature` | `plugin`).
 */

// ---------------------------------------------------------------------------
// Pure string ops
// ---------------------------------------------------------------------------

/**
 * Escape string for use in regex.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse fragment file into sections.
 * Sections are delimited by <!-- section:NAME --> and <!-- /section:NAME --> markers.
 * @param {string} fragmentContent
 * @returns {Map<string, string>} sectionName → content
 */
export function parseFragmentSections(fragmentContent) {
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
 * Markers: <!-- {namespace}:{name}:SECTION --> ... <!-- /{namespace}:{name}:SECTION -->
 * @param {string} commandContent
 * @param {string} namespace  'feature' | 'plugin'
 * @param {string} name       feature or plugin name
 * @param {Map<string, string>} sections
 * @returns {string}
 */
export function injectSections(commandContent, namespace, name, sections) {
  let result = commandContent;
  for (const [sectionName, sectionContent] of sections) {
    const marker = `${namespace}:${name}:${sectionName}`;
    const regex = new RegExp(
      `(<!-- ${escapeRegex(marker)} -->)\\n?[\\s\\S]*?(<!-- \\/${escapeRegex(marker)} -->)`,
      'g'
    );
    result = result.replace(regex, `$1\n${sectionContent}$2`);
  }
  return result;
}

/**
 * Remove content between markers (keep markers empty).
 * @param {string} commandContent
 * @param {string} namespace  'feature' | 'plugin'
 * @param {string} name       feature or plugin name
 * @returns {string}
 */
export function removeSections(commandContent, namespace, name) {
  const regex = new RegExp(
    `(<!-- ${escapeRegex(namespace)}:${escapeRegex(name)}:\\S+ -->)\\n?[\\s\\S]*?(<!-- \\/${escapeRegex(namespace)}:${escapeRegex(name)}:\\S+ -->)`,
    'g'
  );
  return commandContent.replace(regex, '$1\n$2');
}

// ---------------------------------------------------------------------------
// Manifest / hash IO
// ---------------------------------------------------------------------------

/**
 * Read .codeadd/manifest.json
 * @param {string} cwd
 * @returns {object | null}
 */
export function readManifest(cwd) {
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
export function saveManifest(cwd, manifest) {
  const manifestPath = path.join(cwd, '.codeadd', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

/**
 * Calculate SHA-256 hash of a file.
 * @param {string} filePath
 * @returns {string | null}
 */
export function calculateHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recalculate hashes for modified files in manifest.
 * @param {string} cwd
 * @param {object} manifest
 * @param {string[]} modifiedPaths absolute paths of modified files
 */
export function recalculateHashes(cwd, manifest, modifiedPaths) {
  if (!manifest.hashes) manifest.hashes = {};
  for (const absPath of modifiedPaths) {
    const relPath = path.relative(cwd, absPath).replace(/\\/g, '/');
    const hash = calculateHash(absPath);
    if (hash) manifest.hashes[relPath] = hash;
  }
}

// ---------------------------------------------------------------------------
// Agent injection (per-agent plugin fragments)
//
// Plugins reach beyond command bodies into agent definitions: a per-agent
// fragment travels with the agent into every command that dispatches it. Same
// section-marker model as command injection — only the source location (the
// agents/ subtree) and the target files (provider agent dirs) differ.
// ---------------------------------------------------------------------------

/**
 * Resolve installed agent directories from manifest providers.
 * Only providers with an agentsSubdir (currently Claude) hold agent files.
 * @param {string} cwd
 * @returns {string[]} absolute agent directory paths
 */
function agentDirs(cwd) {
  const manifest = readManifest(cwd);
  const providers = resolveSelected(manifest?.providers ?? []);
  return providers
    .filter((p) => p.agentsSubdir)
    .map((p) => path.join(cwd, p.dest, p.agentsSubdir));
}

/**
 * Read per-agent fragments from .codeadd/plugins/{name}/fragments/agents/{agent}.md
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {Array<{agentName: string, content: string}>}
 */
export function getAgentFragments(cwd, pluginName) {
  const dir = path.join(cwd, '.codeadd', 'plugins', pluginName, 'fragments', 'agents');
  if (!fs.existsSync(dir)) return [];

  const fragments = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const agentName = entry.name.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
    fragments.push({ agentName, content });
  }
  return fragments;
}

/**
 * Inject plugin sections into each target agent file across installed providers.
 * Driven by fragments-on-disk + markers-in-files (mirrors command injection):
 * a fragment with no matching installed agent file is silently skipped.
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {string[]} absolute paths of modified agent files
 */
export function injectAgentFragments(cwd, pluginName) {
  const fragments = getAgentFragments(cwd, pluginName);
  const dirs = agentDirs(cwd);
  const modified = [];

  for (const { agentName, content } of fragments) {
    const sections = parseFragmentSections(content);
    for (const dir of dirs) {
      const file = path.join(dir, `${agentName}.md`);
      if (!fs.existsSync(file)) continue;
      const original = fs.readFileSync(file, 'utf8');
      const updated = injectSections(original, 'plugin', pluginName, sections);
      if (updated !== original) {
        fs.writeFileSync(file, updated, 'utf8');
        modified.push(file);
      }
    }
  }
  return modified;
}

/**
 * Remove plugin sections from any installed agent file carrying the plugin
 * marker (keeps markers, mirrors removeSections for commands).
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {string[]} absolute paths of modified agent files
 */
export function removeAgentFragments(cwd, pluginName) {
  const dirs = agentDirs(cwd);
  const marker = `plugin:${pluginName}:`;
  const modified = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const file = path.join(dir, entry.name);
      const original = fs.readFileSync(file, 'utf8');
      if (!original.includes(marker)) continue;
      const updated = removeSections(original, 'plugin', pluginName);
      if (updated !== original) {
        fs.writeFileSync(file, updated, 'utf8');
        modified.push(file);
      }
    }
  }
  return modified;
}
