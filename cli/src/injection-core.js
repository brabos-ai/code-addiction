import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveSelected, agentDest } from './providers.js';

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
  const markers = [...fragmentContent.matchAll(/<!--\s*(\/?)section:([^\s>]+)\s*-->/g)];
  let open = null;
  const names = new Set();
  for (const marker of markers) {
    const [, close, name] = marker;
    if (close) {
      if (open !== name) throw new Error(`Malformed fragment section: unexpected close ${name}`);
      open = null;
    } else {
      if (open !== null || names.has(name)) throw new Error(`Malformed fragment section: duplicate or nested ${name}`);
      names.add(name);
      open = name;
    }
  }
  if (open !== null) throw new Error(`Malformed fragment section: unclosed ${open}`);
  const regex = /<!-- section:(\S+) -->\r?\n([\s\S]*?)<!-- \/section:\1 -->/g;
  let match;
  while ((match = regex.exec(fragmentContent)) !== null) {
    sections.set(match[1], match[2]);
  }
  if (sections.size !== names.size) throw new Error('Malformed fragment section markers');
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
/**
 * Resolve the resource-path placeholders a fragment section carries, for ONE
 * provider -- the same rule scripts/build.js resolveResourcePaths() applies when
 * it writes a command. A fragment is never built: release.yml packs
 * .codeadd/fragments as authored, so without this the literal `{{skill:...}}`
 * lands in the installed command. The CLI cannot import build.js at runtime, so
 * this is a second copy of the rule; cli/tests/fragment-placeholders.test.js P1
 * holds the two equal, provider by provider, against the build's own function.
 *
 * The base is the provider's SOURCE directory, never its install destination:
 * a global install puts OpenCode under .config/opencode, yet the built command
 * it receives still says `.opencode/skills/...`, and the injected block must
 * say the same thing the rest of the file does.
 * @param {string} text
 * @param {{src: string, commandsSubdir: string|null, skillsSubdir: string|null}} provider
 * @returns {string}
 */
export function resolvePlaceholders(text, provider) {
  const base = provider.src.replace(/^framwork\//, '');
  return text
    .replace(/\{\{cmd:([^}]+)\}\}/g, (m, name) =>
      provider.commandsSubdir ? `${base}/${provider.commandsSubdir}/${name}.md` : m)
    .replace(/\{\{skill:([^/}]+)\/([^}]+)\}\}/g, (m, name, file) =>
      provider.skillsSubdir ? `${base}/${provider.skillsSubdir}/${name}/${file}` : m)
    .replace(/\{\{addpath:([^}]+)\}\}/g, (_, sub) => `.codeadd/${sub}`);
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
  return resolveResourceTargets(cwd, resource).map((t) => t.file);
}

/**
 * Like resolveResourceFiles, with the provider each file belongs to -- which
 * injection needs, because a placeholder resolves differently per provider.
 * @param {string} cwd
 * @param {{name: string, kind: 'command'|'agent'}} resource
 * @returns {Array<{file: string, provider: object}>}
 */
export function resolveResourceTargets(cwd, resource) {
  const manifest = readManifest(cwd);
  // Scope-aware: a global install resolves provider dests under the home dir
  // (e.g. OpenCode .config/opencode, not .opencode). manifest.scope is authoritative.
  const providers = resolveSelected(manifest?.providers ?? [], manifest?.scope ?? 'project');
  if (resource.kind === 'agent') {
    // Injection is pinned to providers declaring agentInjection (Claude today).
    // Others receive agent FILES without receiving plugin agent fragments —
    // see the agentInjection note in providers.js.
    return providers
      .filter((p) => p.agentInjection && p.agentsSubdir)
      .map((p) => ({ file: path.join(cwd, agentDest(p), p.agentsSubdir, `${resource.name}.md`), provider: p }))
      .filter((t) => fs.existsSync(t.file));
  }
  return providers
    .filter((p) => p.commandsSubdir)
    .map((p) => ({ file: path.join(cwd, p.dest, p.commandsSubdir, `${resource.name}.md`), provider: p }))
    .filter((t) => fs.existsSync(t.file));
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

const BASELINE_ROOT = '.codeadd/baselines';

export function loadInjectionSidecar(cwd) {
  const p = path.join(cwd, '.codeadd', 'injection-points.json');
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export function baselineRel(providerKey, resource) {
  const kind = resource.kind === 'agent' ? 'agents' : 'commands';
  return `${BASELINE_ROOT}/${providerKey}/${kind}/${resource.name}.md`;
}

function regionByNext(lines, anchor) {
  if (anchor.next == null) return null;
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === anchor.next) hits.push(i);
  if (hits.length !== 1) return null;
  const end = hits[0];
  let start = end;
  while (start > 0 && lines[start - 1].trim() === '') start -= 1;
  if (start === 0 || lines[start - 1].trim() !== anchor.text) return null;
  return { start, end };
}

export function renderSlotRegion(content, anchor, text) {
  const lines = content.split('\n');
  let start;
  let end;
  const byNext = regionByNext(lines, anchor);
  if (byNext) {
    start = byNext.start;
    end = byNext.end;
  } else {
    const idx = findAnchorLine(lines, anchor);
    if (idx === -1) return null;
    start = anchor.position === 'before' ? idx : idx + 1;
    end = start;
    if (anchor.next != null) {
      const nextIdx = lines.findIndex((l, i) => i >= start && l.trim() === anchor.next);
      if (nextIdx === -1) return null;
      end = nextIdx;
      if (lines.slice(start, end).some((l) => l.trim() !== '')) return null;
    }
  }
  const insert = text ? toBlockLines(text.endsWith('\n') ? text : `${text}\n`) : [];
  lines.splice(start, end - start, ...insert);
  return lines.join('\n');
}

/**
 * Compose one slot: the contributing members in source order, or the fallback
 * when none contributes. A member body arrives already resolved (memberState).
 * The fallback is authored text, so it is resolved here, per provider, by the
 * same rule -- a fallback may carry {{skill:}} or {{cmd:}} like any member.
 * Without a provider the fallback is returned as authored.
 * @param {object} slot
 * @param {Array<object>} memberStates
 * @param {object} [provider]  the provider the text is rendered for
 */
export function composeSlot(slot, memberStates, provider) {
  const warnings = [];
  const parts = [];
  for (let i = 0; i < slot.members.length; i++) {
    const state = memberStates[i] || {};
    const member = slot.members[i];
    if (state.warning) {
      warnings.push({
        resource: slot.resource.name,
        slot: slot.id,
        member: `${member.namespace}:${member.name}:${member.section}`,
        reason: state.warning,
      });
    }
    if (state.contribute && state.text) parts.push(state.text.endsWith('\n') ? state.text : `${state.text}\n`);
  }
  return {
    text: parts.length ? parts.join('') : resolveFallback(slot.fallback || '', provider),
    usedFallback: parts.length === 0,
    warnings,
  };
}

function resolveFallback(text, provider) {
  return provider && text ? resolvePlaceholders(text, provider) : text;
}

export function renderSlots(baseline, slots) {
  let content = baseline;
  const missed = [];
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i];
    const next = renderSlotRegion(content, slot.anchor, slot.text || '');
    if (next === null) {
      missed.push(slot.id);
      continue;
    }
    content = next;
  }
  return { content, missed };
}

export function captureBaselines(cwd) {
  const sidecar = loadInjectionSidecar(cwd);
  const slots = Array.isArray(sidecar?.slots) ? sidecar.slots : [];
  if (sidecar?.version !== 2 || slots.length === 0) return { captured: [], pruned: [], warnings: [] };

  const expected = new Set();
  const captured = [];
  const seen = new Set();
  for (const slot of slots) {
    const key = `${slot.resource.kind}:${slot.resource.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const target of resolveResourceTargets(cwd, slot.resource)) {
      const rel = baselineRel(target.provider.key, slot.resource);
      expected.add(rel);
      const dest = path.join(cwd, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(target.file, dest);
      captured.push(rel);
    }
  }

  const pruned = [];
  const root = path.join(cwd, BASELINE_ROOT);
  if (fs.existsSync(root)) {
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else {
          const rel = path.relative(cwd, full).split(path.sep).join('/');
          if (!expected.has(rel)) {
            fs.unlinkSync(full);
            pruned.push(rel);
          }
        }
      }
    };
    walk(root);
  }

  const manifest = readManifest(cwd);
  if (manifest) {
    manifest.baselineHashes = Object.fromEntries(captured.map((rel) => [rel, calculateHash(path.join(cwd, rel))]));
    saveManifest(cwd, manifest);
  }
  return { captured, pruned, warnings: [] };
}

export function renderInstalledResource(cwd, resource, slots, providerKey) {
  const rel = baselineRel(providerKey, resource);
  const basePath = path.join(cwd, rel);
  const target = resolveResourceTargets(cwd, resource).find((t) => t.provider.key === providerKey);
  if (!target) return { written: false, warnings: [] };
  if (!fs.existsSync(basePath)) {
    return {
      written: false,
      warnings: [{ resource: resource.name, slot: slots[0]?.id || '-', member: '-', reason: 'missing baseline' }],
    };
  }
  const baseline = fs.readFileSync(basePath, 'utf8');
  const prepared = slots.map((slot) => {
    const composed = composeSlot(slot, slot.memberStates || [], target.provider);
    return { ...slot, text: composed.text, warnings: composed.warnings };
  });
  const rendered = renderSlots(baseline, prepared);
  if (rendered.missed.length) {
    return {
      written: false,
      warnings: rendered.missed.map((id) => ({ resource: resource.name, slot: id, member: '-', reason: 'anchor missed' })),
    };
  }
  const warnings = prepared.flatMap((s) => s.warnings || []);
  if (rendered.content !== fs.readFileSync(target.file, 'utf8')) {
    fs.writeFileSync(target.file, rendered.content, 'utf8');
    return { written: true, warnings };
  }
  return { written: false, warnings };
}

function fragmentFile(cwd, member, resource) {
  if (member.namespace === 'feature') {
    return path.join(cwd, '.codeadd', 'fragments', member.name, `${resource.name}.md`);
  }
  if (resource.kind === 'agent') {
    return path.join(cwd, '.codeadd', 'plugins', member.name, 'fragments', 'agents', `${resource.name}.md`);
  }
  return path.join(cwd, '.codeadd', 'plugins', member.name, 'fragments', `${resource.name}.md`);
}

function memberState(cwd, member, resource, manifest, provider, pluginActive) {
  const enabled = member.namespace === 'feature'
    ? manifest.features?.[member.name] === true
    : manifest.plugins?.[member.name]?.enabled === true && (!pluginActive || pluginActive(member.name));
  if (!enabled) return { contribute: false };
  const file = fragmentFile(cwd, member, resource);
  if (!fs.existsSync(file)) return { contribute: false, warning: 'file missing' };
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return { contribute: false, warning: 'bad payload' };
  }
  let sections;
  try {
    sections = parseFragmentSections(raw);
  } catch {
    return { contribute: false, warning: 'bad payload' };
  }
  if (!sections.has(member.section)) return { contribute: false, warning: 'section missing' };
  const body = sections.get(member.section);
  if (typeof body !== 'string' || body.length === 0) return { contribute: false, warning: 'bad payload' };
  return { contribute: true, text: provider ? resolvePlaceholders(body, provider) : body };
}

export function reconcileSlots(cwd, options = {}) {
  const sidecar = loadInjectionSidecar(cwd);
  if (!sidecar || sidecar.version !== 2) return null;
  const manifest = readManifest(cwd);
  if (!manifest) return { modified: [], warnings: [] };

  const groups = new Map();
  for (const slot of sidecar.slots || []) {
    const key = `${slot.resource.kind}:${slot.resource.name}`;
    if (!groups.has(key)) groups.set(key, { resource: slot.resource, slots: [] });
    groups.get(key).slots.push(slot);
  }

  const modified = [];
  const warnings = [];
  for (const group of groups.values()) {
    for (const target of resolveResourceTargets(cwd, group.resource)) {
      const prepared = group.slots.map((slot) => {
        const states = slot.members.map((m) => memberState(cwd, m, group.resource, manifest, target.provider, options.pluginActive));
        const composed = composeSlot(slot, states, target.provider);
        warnings.push(...composed.warnings);
        return { ...slot, text: composed.text };
      });
      const basePath = path.join(cwd, baselineRel(target.provider.key, group.resource));
      if (!fs.existsSync(basePath)) {
        warnings.push({ resource: group.resource.name, slot: group.slots[0].id, member: '-', reason: 'missing baseline' });
        continue;
      }
      const rendered = renderSlots(fs.readFileSync(basePath, 'utf8'), prepared);
      if (rendered.missed.length) {
        for (const id of rendered.missed) {
          warnings.push({ resource: group.resource.name, slot: id, member: '-', reason: 'anchor missed' });
        }
        continue;
      }
      if (rendered.content !== fs.readFileSync(target.file, 'utf8')) {
        fs.writeFileSync(target.file, rendered.content, 'utf8');
        modified.push(target.file);
      }
    }
  }
  if (modified.length) {
    const current = readManifest(cwd);
    recalculateHashes(cwd, current, modified);
    saveManifest(cwd, current);
  }
  return { modified, warnings };
}
