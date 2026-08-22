import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveSelected } from './providers.js';

/**
 * injection-core — shared helpers + manifest IO for the two additive injection
 * systems: `features` (internal behaviour toggles) and `plugins` (external-tool
 * integrations). Both insert fragment sections into installed command/agent
 * files at **content anchors** recorded in the build-emitted sidecar
 * (`.codeadd/injection-points.json`); they differ only by marker namespace
 * (`feature` | `plugin`). Distributed files ship marker-free — anchors are
 * located by adjacent prose text, not HTML markers or line numbers.
 */

// ---------------------------------------------------------------------------
// Pure string ops
// ---------------------------------------------------------------------------

/**
 * Parse fragment file into sections.
 * Sections are delimited by <!-- section:NAME --> and <!-- /section:NAME --> markers.
 * @param {string} fragmentContent
 * @returns {Map<string, string>} sectionName → content (ends with newline)
 */
export function parseFragmentSections(fragmentContent) {
  const sections = new Map();
  const regex = /<!-- section:(\S+) -->\r?\n([\s\S]*?)<!-- \/section:\1 -->/g;
  let match;
  while ((match = regex.exec(fragmentContent)) !== null) {
    sections.set(match[1], match[2]);
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Content-anchor primitives (marker-free insert/remove)
// ---------------------------------------------------------------------------

/**
 * Split a fragment block into lines, dropping the single trailing empty element
 * produced by a block ending in "\n" — so insert/remove are exact inverses.
 * @param {string} blockText
 * @returns {string[]}
 */
function toBlockLines(blockText) {
  const lines = blockText.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * Index of the first contiguous match of `sub` in `lines` at/after `from`.
 * @returns {number} -1 if not found
 */
function findSubsequence(lines, sub, from) {
  if (sub.length === 0) return -1;
  for (let i = from; i + sub.length <= lines.length; i++) {
    let ok = true;
    for (let j = 0; j < sub.length; j++) {
      if (lines[i + j] !== sub[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

/** True if any line at/after `from` has trimmed text === `text`. */
function existsBelow(lines, from, text) {
  for (let i = from; i < lines.length; i++) {
    if (lines[i].trim() === text) return true;
  }
  return false;
}

/**
 * Resolve an anchor to its line index in `lines` by trimmed text + occurrence
 * ordinal (1-based). Position-independent: survives frontmatter offsets and
 * line shifts. Returns -1 if the ordinal-th occurrence does not exist.
 * @param {string[]} lines
 * @param {{text:string, ordinal:number}} anchor
 * @returns {number}
 */
export function findAnchorLine(lines, anchor) {
  let occ = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === anchor.text) {
      occ++;
      if (occ === anchor.ordinal) return i;
    }
  }
  return -1;
}

/**
 * Insert `blockText` at an anchor. Idempotent (returns content unchanged if the
 * block is already present). Returns null on a fail-loud condition: the anchor
 * is not found, or the recorded `next` hint drifted (user rewrote adjacent prose).
 * @param {string} content
 * @param {{text,ordinal,position,next}} anchor
 * @param {string} blockText
 * @returns {string|null}
 */
export function insertBlockAfterAnchor(content, anchor, blockText) {
  const blockLines = toBlockLines(blockText);
  if (blockLines.length === 0) return content;

  const lines = content.split('\n');
  const idx = findAnchorLine(lines, anchor);
  if (idx === -1) return null;

  const insertAt = anchor.position === 'before' ? idx : idx + 1;
  const searchFrom = anchor.position === 'before' ? 0 : insertAt;
  if (findSubsequence(lines, blockLines, searchFrom) !== -1) return content; // already injected

  if (anchor.position === 'after' && anchor.next != null) {
    // Drift guard: the recorded following line must still exist BELOW the anchor.
    // Scan forward (not just the immediate next line) so a sibling injection
    // already inserted at a SHARED anchor by another feature/plugin is not
    // mistaken for prose drift — which would silently drop this insertion.
    if (!existsBelow(lines, insertAt, anchor.next)) return null; // anchor drifted
  }

  lines.splice(insertAt, 0, ...blockLines);
  return lines.join('\n');
}

/**
 * Remove a previously inserted block (re-derived from the fragment). Exact
 * inverse of insertBlockAfterAnchor; leaves content unchanged if absent.
 * NOTE: `anchor.next` is intentionally NOT checked here — removal locates the
 * block by exact content subsequence, so the drift hint is irrelevant.
 * @param {string} content
 * @param {{text,ordinal,position}} anchor
 * @param {string} blockText
 * @returns {string}
 */
export function removeBlockAfterAnchor(content, anchor, blockText) {
  const blockLines = toBlockLines(blockText);
  if (blockLines.length === 0) return content;

  const lines = content.split('\n');
  const idx = findAnchorLine(lines, anchor);
  if (idx === -1) return content;

  const searchFrom = anchor.position === 'before' ? 0 : idx + 1;
  const at = findSubsequence(lines, blockLines, searchFrom);
  if (at === -1) return content;

  lines.splice(at, blockLines.length);
  return lines.join('\n');
}

/**
 * Group a resource's injection points by anchor identity, preserving source
 * order. Clustered markers sharing one anchor merge into a single ordered block.
 * @param {Array} points
 * @returns {Array<{anchor: object, sections: string[]}>}
 */
function groupPointsByAnchor(points) {
  const byKey = new Map();
  const groups = [];
  for (const p of points) {
    const key = `${p.anchor.position}|${p.anchor.ordinal}|${p.anchor.text}`;
    let g = byKey.get(key);
    if (!g) { g = { anchor: p.anchor, sections: [] }; byKey.set(key, g); groups.push(g); }
    g.sections.push(p.section);
  }
  return groups;
}

/**
 * Apply all of one resource's injection points to its file content.
 * Inserts bottom-up so higher anchors' ordinals stay valid across inserts.
 * @param {string} content
 * @param {Array} points  points for ONE resource (already filtered by name/kind)
 * @param {Map<string,string>} sections  fragment sections
 * @returns {{content: string, missed: Array<{sections:string[], anchor:object}>}}
 */
export function applyInjectionToContent(content, points, sections) {
  const groups = groupPointsByAnchor(points.filter((p) => sections.has(p.section)));
  let result = content;
  const missed = [];
  for (const g of [...groups].reverse()) {
    const blockText = g.sections.map((s) => sections.get(s)).join('');
    if (!blockText) continue;
    const next = insertBlockAfterAnchor(result, g.anchor, blockText);
    if (next === null) { missed.push({ sections: g.sections, anchor: g.anchor }); continue; }
    result = next;
  }
  return { content: result, missed };
}

/**
 * Remove all of one resource's injected blocks (re-derived from the fragment).
 * @param {string} content
 * @param {Array} points
 * @param {Map<string,string>} sections
 * @returns {string}
 */
export function removeInjectionFromContent(content, points, sections) {
  const groups = groupPointsByAnchor(points.filter((p) => sections.has(p.section)));
  let result = content;
  // Forward order is safe (unlike applyInjectionToContent's reversed inserts):
  // removal re-resolves the anchor each iteration and removed blocks never
  // contain anchor lines, so earlier removals can't shift later anchors.
  for (const g of groups) {
    const blockText = g.sections.map((s) => sections.get(s)).join('');
    if (blockText) result = removeBlockAfterAnchor(result, g.anchor, blockText);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sidecar map + resource resolution
// ---------------------------------------------------------------------------

/**
 * Load the build-emitted injection-point map from the installed project.
 * Returns [] when absent (graceful fallback for installs predating the sidecar).
 * @param {string} cwd
 * @returns {Array}
 */
export function loadInjectionPoints(cwd) {
  const p = path.join(cwd, '.codeadd', 'injection-points.json');
  if (!fs.existsSync(p)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(data?.points) ? data.points : [];
  } catch {
    return [];
  }
}

/**
 * Resolve a logical resource (one sidecar entry serves all providers) to its
 * installed file path in every selected provider that hosts that resource kind.
 * Commands → providers with a commandsSubdir; agents → providers with an
 * agentsSubdir (currently Claude only). Only existing files are returned.
 * @param {string} cwd
 * @param {{name:string, kind:'command'|'agent'}} resource
 * @returns {string[]} absolute paths
 */
export function resolveResourceFiles(cwd, resource) {
  const manifest = readManifest(cwd);
  // Scope-aware: a global install resolves provider dests under the home dir
  // (e.g. OpenCode .config/opencode, not .opencode). manifest.scope is authoritative.
  const providers = resolveSelected(manifest?.providers ?? [], manifest?.scope ?? 'project');
  const subKey = resource.kind === 'agent' ? 'agentsSubdir' : 'commandsSubdir';
  return providers
    .filter((p) => p[subKey])
    .map((p) => path.join(cwd, p.dest, p[subKey], `${resource.name}.md`))
    .filter((f) => fs.existsSync(f));
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
 * SHA-256 of an in-memory string (used to record injected-block fingerprints).
 * @param {string} str
 * @returns {string}
 */
export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
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
// Agent injection (per-agent plugin fragments, sidecar-driven)
//
// Plugins reach beyond command bodies into agent definitions: a per-agent
// fragment travels with the agent into every command that dispatches it. Same
// anchor mechanism as command injection — only the source location (the
// plugins/.../agents/ subtree) and the target files (provider agent dirs) differ.
// ---------------------------------------------------------------------------

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
 * Inject plugin sections into each target agent file across installed providers,
 * driven by the sidecar map (anchors) + per-agent fragments (content). A fragment
 * with no matching sidecar point or no installed agent file is skipped.
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {string[]} absolute paths of modified agent files
 */
export function injectAgentFragments(cwd, pluginName) {
  const fragments = getAgentFragments(cwd, pluginName);
  const points = loadInjectionPoints(cwd).filter(
    (p) => p.namespace === 'plugin' && p.name === pluginName && p.resource.kind === 'agent',
  );
  const modified = [];

  for (const { agentName, content } of fragments) {
    const sections = parseFragmentSections(content);
    const agentPoints = points.filter((p) => p.resource.name === agentName);
    if (agentPoints.length === 0) continue;

    for (const file of resolveResourceFiles(cwd, { name: agentName, kind: 'agent' })) {
      const original = fs.readFileSync(file, 'utf8');
      const { content: updated } = applyInjectionToContent(original, agentPoints, sections);
      if (updated !== original) {
        fs.writeFileSync(file, updated, 'utf8');
        modified.push(file);
      }
    }
  }
  return modified;
}

/**
 * Remove plugin sections from each target agent file (re-derived from fragments).
 * Symmetric with injectAgentFragments.
 * @param {string} cwd
 * @param {string} pluginName
 * @returns {string[]} absolute paths of modified agent files
 */
export function removeAgentFragments(cwd, pluginName) {
  const fragments = getAgentFragments(cwd, pluginName);
  const points = loadInjectionPoints(cwd).filter(
    (p) => p.namespace === 'plugin' && p.name === pluginName && p.resource.kind === 'agent',
  );
  const modified = [];

  for (const { agentName, content } of fragments) {
    const sections = parseFragmentSections(content);
    const agentPoints = points.filter((p) => p.resource.name === agentName);
    if (agentPoints.length === 0) continue;

    for (const file of resolveResourceFiles(cwd, { name: agentName, kind: 'agent' })) {
      const original = fs.readFileSync(file, 'utf8');
      const updated = removeInjectionFromContent(original, agentPoints, sections);
      if (updated !== original) {
        fs.writeFileSync(file, updated, 'utf8');
        modified.push(file);
      }
    }
  }
  return modified;
}
