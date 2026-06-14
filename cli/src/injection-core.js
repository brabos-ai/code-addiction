import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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
