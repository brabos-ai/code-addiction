#!/usr/bin/env node
/**
 * build.js - Compile provider files from .codeadd/ + framwork/provider-map.json
 * Usage: node scripts/build.js
 *
 * Architecture:
 *   readMap()          → loads provider-map.json (single source of truth)
 *   stripHtmlComments  → pure fn, removes <!-- --> + collapses blank lines
 *   TRANSFORMERS       → registry of format converters (md, toml, ...)
 *   METADATA           → registry of metadata generators (frontmatter, toml header, ...)
 *   buildResources()   → generic loop for any resource type (commands, skills)
 *   resourceStrategies → per-type config (source path, resolve output, post-process)
 *
 * Transform references: framwork/.codeadd/transforms/{provider}/{resource}.md
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// I/O helpers (thin wrappers — keep logic out of here)
// ---------------------------------------------------------------------------

function readMap() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8'));
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function copyDirRecursive(src, dest, provider = null) {
  let count = 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath, provider);
    } else {
      // When a provider is supplied, transform markdown files (resolve {{cmd:}}, {{skill:}}, {{addpath:}}).
      // Used for skill sibling files; null provider preserves verbatim copy semantics for other callers.
      if (provider && entry.name.endsWith('.md')) {
        const raw = readFile(srcPath);
        lintResourcePaths(raw, srcPath);
        const cleaned = stripHtmlComments(raw);
        const resolved = resolveResourcePaths(cleaned, provider);
        writeFile(destPath, resolved);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Pure transforms (no I/O, fully testable)
// ---------------------------------------------------------------------------

/**
 * Remove HTML comments and collapse excess blank lines (saves tokens).
 *
 * ALL comments strip uniformly — including `feature:`/`plugin:` injection
 * markers. The markers are consumed at build time by extractInjectionPoints()
 * into the content-anchored sidecar (injection-points.json); the built provider
 * files ship marker-free and post-install injection locates anchors by text.
 */
function stripHtmlComments(content) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Injection-point extraction (marker → content-anchor sidecar)
//
// Source files keep `<!-- feature/plugin:NAME:SECTION -->` markers for authoring
// ergonomics + exclusion-by-omission. At build time each OPEN marker is recorded
// as an injection point anchored to the nearest surviving non-blank line above it
// (identified by text + occurrence ordinal, so it survives per-provider frontmatter
// offsets, line shifts, and most user edits). The markers are then stripped.
// ---------------------------------------------------------------------------

// Matches an OPEN injection marker (closers start with `/`).
const OPEN_MARKER_RE = /^\s*(feature|plugin):([^:\s]+):(\S+?)\s*$/;
const CLOSE_MARKER_RE = /^\s*\/(feature|plugin):([^:\s]+):(\S+?)\s*$/;
// Resource-path variables that resolve differently per provider — illegal in an anchor.
const ANCHOR_VARIABLE_RE = /\{\{(?:cmd|skill|addpath):/;

/**
 * A real injection marker stands alone on its line. A marker embedded in prose
 * (e.g. a `<!-- feature:x:y -->` shown inside a table cell or code span as
 * documentation) is NOT an injection point — only a comment to be stripped.
 * @param {string} raw  full source
 * @param {number} start  comment start index
 * @param {number} end    comment end index (exclusive)
 * @returns {boolean}
 */
function isStandaloneMarker(raw, start, end) {
  const lineStart = raw.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = raw.indexOf('\n', end);
  const before = raw.slice(lineStart, start);
  const after = raw.slice(end, lineEnd === -1 ? raw.length : lineEnd);
  return before.trim() === '' && after.trim() === '';
}

/**
 * Split text into trimmed lines, dropping leading/trailing blank-only lines so
 * "nearest non-blank" math matches the post-strip installed body.
 * @param {string} text
 * @returns {string[]} non-empty trimmed lines, in order
 */
function nonBlankLines(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

/**
 * Parse a resource body, returning one injection point per OPEN marker.
 * Anchors are computed against the comment-stripped (but not blank-collapsed)
 * body, so ordinals match what the CLI counts in the installed file.
 *
 * @param {string} rawContent
 * @param {string} resourceName  logical name (e.g. "add.build", "backend-agent")
 * @param {'command'|'agent'} resourceKind
 * @returns {Array<{namespace,name,section,resource:{name,kind},anchor:{text,ordinal,position,next}}>}
 * @throws if a chosen anchor line carries a {{cmd:}}/{{skill:}}/{{addpath:}} variable
 */
/**
 * Standalone feature/plugin pairs must be empty and balanced. Non-empty
 * content between markers ships in every provider baseline; an open without
 * a close is authoring drift. Prose-embedded markers are ignored.
 * @param {string} rawContent
 * @param {string} resourceName
 */
function assertEmptyMarkerPairs(rawContent, resourceName) {
  const commentRe = /<!--([\s\S]*?)-->/g;
  const markers = [];
  let m;
  while ((m = commentRe.exec(rawContent)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    if (!isStandaloneMarker(rawContent, start, end)) continue;
    const line = rawContent.slice(0, start).split('\n').length;
    const open = m[1].match(OPEN_MARKER_RE);
    const close = m[1].match(CLOSE_MARKER_RE);
    if (open) {
      markers.push({ kind: 'open', ns: open[1], name: open[2], section: open[3], start, end, line });
    } else if (close) {
      markers.push({ kind: 'close', ns: close[1], name: close[2], section: close[3], start, end, line });
    }
  }

  for (let i = 0; i < markers.length; i++) {
    const mk = markers[i];
    if (mk.kind !== 'open') continue;
    const key = `${mk.ns}:${mk.name}:${mk.section}`;
    const close = markers.slice(i + 1).find((c) => c.kind === 'close' && `${c.ns}:${c.name}:${c.section}` === key);
    if (!close) {
      throw new Error(
        `Unbalanced injection marker ${key} in ${resourceName}:${mk.line} — open has no close`,
      );
    }
    if (rawContent.slice(mk.end, close.start).trim().length > 0) {
      throw new Error(
        `Non-empty injection pair ${key} in ${resourceName}:${mk.line} — marker pairs must be empty`,
      );
    }
  }
}

function extractInjectionPoints(rawContent, resourceName, resourceKind) {
  assertEmptyMarkerPairs(rawContent, resourceName);

  const commentRe = /<!--([\s\S]*?)-->/g;
  let surviving = '';
  let lastIndex = 0;
  let m;
  const pending = []; // { namespace, name, section, survivingPos }

  while ((m = commentRe.exec(rawContent)) !== null) {
    surviving += rawContent.slice(lastIndex, m.index);
    lastIndex = m.index + m[0].length;
    const open = m[1].match(OPEN_MARKER_RE);
    if (open && isStandaloneMarker(rawContent, m.index, lastIndex)) {
      pending.push({
        namespace: open[1],
        name: open[2],
        section: open[3],
        survivingPos: surviving.length, // marker location in the stripped body
      });
    }
  }
  surviving += rawContent.slice(lastIndex);

  const points = [];
  for (const p of pending) {
    const above = nonBlankLines(surviving.slice(0, p.survivingPos));
    const below = nonBlankLines(surviving.slice(p.survivingPos));

    let text = null;
    let position;
    let ordinal;
    let next = null;

    // Prefer the nearest variable-free non-blank line ABOVE (walk past lines
    // carrying a {{cmd:}}/{{skill:}}/{{addpath:}} variable — they resolve
    // differently per provider and cannot serve as a single shared anchor).
    let aboveIdx = -1;
    for (let k = above.length - 1; k >= 0; k--) {
      if (!ANCHOR_VARIABLE_RE.test(above[k])) { aboveIdx = k; break; }
    }

    if (aboveIdx !== -1) {
      text = above[aboveIdx];
      position = 'after';
      ordinal = above.slice(0, aboveIdx + 1).filter((l) => l === text).length;
      // Drift hint only when the anchor is the line immediately above the marker
      // and the following line is itself variable-free (else it resolves per provider).
      const walked = aboveIdx !== above.length - 1;
      next = !walked && below.length > 0 && !ANCHOR_VARIABLE_RE.test(below[0]) ? below[0] : null;
    } else {
      // No variable-free line above → anchor before the nearest variable-free line below.
      const belowIdx = below.findIndex((l) => !ANCHOR_VARIABLE_RE.test(l));
      if (belowIdx !== -1) {
        text = below[belowIdx];
        position = 'before';
        ordinal = above.filter((l) => l === text).length
          + below.slice(0, belowIdx + 1).filter((l) => l === text).length;
      }
    }

    if (text == null) {
      throw new Error(
        `No variable-free anchor for ${p.namespace}:${p.name}:${p.section} in ${resourceName} — ` +
          `every adjacent line resolves a resource-path variable. Add a stable plain line next to the marker.`,
      );
    }

    points.push({
      namespace: p.namespace,
      name: p.name,
      section: p.section,
      resource: { name: resourceName, kind: resourceKind },
      anchor: { text, ordinal, position, next },
    });
  }
  return points;
}

// Build-run accumulator (reset per build).
let INJECTION_POINTS = [];

/**
 * Extract + accumulate injection points for one resource body.
 * @param {string} rawContent
 * @param {string} resourceName
 * @param {'command'|'agent'} resourceKind
 */
function collectInjectionPoints(rawContent, resourceName, resourceKind) {
  INJECTION_POINTS.push(...extractInjectionPoints(rawContent, resourceName, resourceKind));
}

/** @returns {Array} the points accumulated so far this build */
function getInjectionPoints() {
  return INJECTION_POINTS;
}

/**
 * Write the sidecar map. Stable sort by (kind, name) for clean diffs while
 * preserving source-encounter order within a resource (needed for clustered
 * markers that share an anchor).
 * @param {string} outPath
 * @returns {number} number of points written
 */
function writeInjectionPoints(outPath) {
  const points = INJECTION_POINTS
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const ak = a.p.resource.kind, bk = b.p.resource.kind;
      if (ak !== bk) return ak < bk ? -1 : 1;
      const an = a.p.resource.name, bn = b.p.resource.name;
      if (an !== bn) return an < bn ? -1 : 1;
      return a.i - b.i; // stable: keep source order within a resource
    })
    .map(({ p }) => p);
  writeFile(outPath, JSON.stringify({ version: 1, points }, null, 2) + '\n');
  return points.length;
}

// ---------------------------------------------------------------------------
// Setup contracts (source-declared → build-extracted sidecar)
//
// A command that materializes state into the user's project declares a
// "## Materializes" H2. That block is the SINGLE source of every shape the
// command writes; `shape` is a hand-declared hash of it, recomputed here so a
// changed shape cannot ship silently. The build has no previous shape to diff
// against — the declared value IS the baseline. Identity is the hash: there
// is no version integer and no recipe chain.
// ---------------------------------------------------------------------------

const CONTRACT_HEADING_RE = /^## Materializes[ \t]*$/m;
// A RESOLVABLE resource-path variable — anything resolveResourcePaths() would
// substitute. Its three patterns each require [^}]+, so this mirrors them exactly:
// one or more characters after the colon. The ONLY tolerated form is the exactly
// empty `{{cmd:}}` / `{{skill:}}` / `{{addpath:}}`, which matches no resolver,
// ships identically to every provider, and is how the block's own prose documents
// this ban — banning it would leave the declaration unable to describe itself.
// Do NOT relax this to [^}\s]+: `{{cmd: add.plan}}` DOES resolve (to a path with a
// leading space) and must stay banned.
const CONTRACT_VARIABLE_RE = /\{\{(?:cmd|skill|addpath):[^}]+\}\}/;
const SHAPE_LINE_RE = /^shape:[ \t]*\S+[ \t]*$/;
const FENCE_RE = /^[ \t]*(`{3,})/;

/** Default `.codeadd` root; overridable so tests can supply a throwaway tree. */
const CODEADD_DIR = path.join(ROOT, 'framwork', '.codeadd');

/**
 * Slice the "## Materializes" block: everything after the heading up to the next
 * H2 that lies OUTSIDE every fenced code block, with HTML comments removed.
 *
 * Fence-awareness is load-bearing, not tidiness. The declaration embeds a fenced
 * markdown template carrying its own H2s (`## Conventions`, `## Managed App
 * Lifecycle`, `## Auth / Seed`). A naive `^## ` scan ends the block at the first
 * of them, and everything below silently stops participating in BOTH the shape
 * hash (drift ships green) and the resource-path-variable ban.
 *
 * @returns {string|null} the block, or null when the command declares none
 */
function sliceContractBlock(rawContent) {
  const m = CONTRACT_HEADING_RE.exec(rawContent);
  if (!m) return null;

  const lines = rawContent.slice(m.index + m[0].length).split('\n');
  let openFence = 0; // backtick count of the open fence; 0 when none is open
  let end = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const fence = FENCE_RE.exec(lines[i]);
    if (fence) {
      // Standard markdown: a fence closes on a run at least as long as the one
      // that opened it. So an embedded template must open with MORE backticks
      // than any fence it contains — a 3-backtick inner fence closes a
      // 3-backtick outer one, which would truncate the block here.
      if (openFence === 0) openFence = fence[1].length;
      else if (fence[1].length >= openFence) openFence = 0;
      continue;
    }
    if (openFence === 0 && /^## /.test(lines[i])) {
      end = i;
      break;
    }
  }

  return stripHtmlComments(lines.slice(0, end).join('\n'));
}

/**
 * Canonical form hashed by `shape`: the block minus its own `shape:` line, with
 * per-line trailing whitespace removed. Changing any declared character —
 * including inside a fence — must move the hash.
 *
 * Blank-line normalization is NOT repeated here: sliceContractBlock already runs
 * stripHtmlComments, which collapses 3+ newlines and trims. A duplicate trim on
 * this side was unreachable (contractShape is only ever fed sliced output) and
 * read as the enforcing code while a test could not isolate it.
 */
function canonicalContractBody(block) {
  // Drop only the FIRST `shape:` line — the declaration's own. A `shape:` line
  // at column 0 inside an embedded template is declared content: excluding it
  // would make it invisible to drift detection.
  let shapeDropped = false;
  return block
    .split('\n')
    .filter((l) => {
      if (!shapeDropped && SHAPE_LINE_RE.test(l)) { shapeDropped = true; return false; }
      return true;
    })
    .map((l) => l.replace(/[ \t\r]+$/, ''))
    .join('\n');
}

/** sha256:<first 16 hex chars> — short enough to hand-paste, unique enough to gate. */
function contractShape(block) {
  const hex = crypto.createHash('sha256').update(canonicalContractBody(block), 'utf8').digest('hex');
  return `sha256:${hex.slice(0, 16)}`;
}

/**
 * Read the YAML preamble of a "## Materializes" block. Deliberately a hand-rolled
 * reader over the flat, fixed shape this contract declares — the build has no
 * YAML dependency and must not acquire one.
 */
function parseContractDeclaration(block) {
  const fence = block.match(/```yaml\r?\n([\s\S]*?)\r?\n```/);
  if (!fence) return null;

  const out = { paths: [] };
  let current = null;
  for (const raw of fence[1].split('\n')) {
    const line = raw.replace(/[ \t\r]+$/, '');
    if (!line.trim()) continue;

    const top = line.match(/^([a-z-]+):[ \t]*(.*)$/);
    if (top) {
      if (top[1] === 'paths') { current = null; continue; }
      out[top[1]] = top[2];
      continue;
    }
    const item = line.match(/^[ \t]*-[ \t]*([a-z-]+):[ \t]*(.*)$/);
    if (item) { current = { [item[1]]: item[2] }; out.paths.push(current); continue; }
    const field = line.match(/^[ \t]+([a-z-]+):[ \t]*(.*)$/);
    if (field && current) current[field[1]] = field[2];
  }
  return out;
}

/**
 * Extract + validate one command's contract.
 * @param {string} rawContent   command source (pre-strip, markers intact)
 * @param {string} resourceName logical command name (e.g. "add.qa-setup")
 * @param {string} [_codeaddDir] unused; kept so existing call sites that pass a
 *        throwaway `.codeadd` root keep working
 * @returns {object|null} { contract, shape, paths } or null
 * @throws on a resource-path variable in the block, a shape mismatch, or a missing field
 */
function extractContract(rawContent, resourceName, _codeaddDir = CODEADD_DIR) {
  const block = sliceContractBlock(rawContent);
  if (block === null) return null;

  if (CONTRACT_VARIABLE_RE.test(block)) {
    throw new Error(
      `Contract block in ${resourceName} carries a resource-path variable — ` +
        `{{cmd:}}/{{skill:}}/{{addpath:}} resolve per provider and would produce a different shape ` +
        `per build target. Write the literal path inside "## Materializes".`,
    );
  }

  const decl = parseContractDeclaration(block);
  if (!decl || !decl.contract || !decl.shape) {
    throw new Error(
      `Contract block in ${resourceName} is missing a required field — ` +
        `"contract" and "shape" are mandatory.`,
    );
  }
  if (decl.contract !== resourceName) {
    throw new Error(
      `Contract block in ${resourceName} declares contract: ${decl.contract}. ` +
        `The sidecar is keyed by this value and both status.sh and add-setup-contract ` +
        `look it up by command name — a mismatch keys the contract under a name nothing ` +
        `ever finds, leaving every project's staleness check silently blind.`,
    );
  }
  for (const p of decl.paths) {
    if (!p.path || (p.owner !== 'setup' && p.owner !== 'shared')) {
      throw new Error(
        `Contract block in ${resourceName} declares a path without a "path" or with an ` +
          `owner outside {setup, shared}: ${JSON.stringify(p)}. A partially extracted ` +
          `contract is worse than none — it would ship as authoritative.`,
      );
    }
  }

  const computed = contractShape(block);
  if (decl.shape !== computed) {
    throw new Error(
      `Contract shape changed in ${resourceName}.\n` +
        `  declared: ${decl.shape}\n  computed: ${computed}\n` +
        `Set shape: ${computed}. Every installed project will need /add.qa-setup.`,
    );
  }

  return {
    contract: decl.contract,
    shape: decl.shape,
    paths: decl.paths,
  };
}

// Build-run accumulator (reset per build).
let CONTRACTS = {};

/**
 * Extract + accumulate one command's contract. Throws before anything is
 * accumulated, so a firing gate can never leave a half-built sidecar.
 */
function collectContract(rawContent, resourceName, codeaddDir = CODEADD_DIR) {
  const c = extractContract(rawContent, resourceName, codeaddDir);
  if (c) {
    // Unreachable by construction during a real build: the name gate above forces
    // c.contract to equal the provider-map.json key, and JSON keys are unique.
    // Kept as defence-in-depth for direct callers (and tests) — a silent overwrite
    // would ship a sidecar describing only one of two commands.
    if (Object.prototype.hasOwnProperty.call(CONTRACTS, c.contract)) {
      throw new Error(
        `Duplicate contract "${c.contract}" — two commands declare it. The second would ` +
          `silently overwrite the first, so the sidecar would describe only one of them.`,
      );
    }
    CONTRACTS[c.contract] = {
      shape: c.shape,
      paths: c.paths,
    };
  }
}

/**
 * Write the contracts sidecar. Keys sorted for clean diffs + byte-identical
 * rebuilds from unchanged sources.
 * @returns {number} number of contracts written
 */
function writeContracts(outPath) {
  const sorted = {};
  for (const k of Object.keys(CONTRACTS).sort()) sorted[k] = CONTRACTS[k];
  writeFile(outPath, JSON.stringify({ version: 1, contracts: sorted }, null, 2) + '\n');
  return Object.keys(sorted).length;
}

// ---------------------------------------------------------------------------
// Metadata generators (format-specific wrappers around content)
// ---------------------------------------------------------------------------

const METADATA = {
  /** YAML frontmatter for markdown-based providers */
  mdFrontmatter(meta) {
    return meta.skillFormat
      ? `---\nname: ${meta.name}\ndescription: ${meta.description}\n---\n\n`
      : `---\ndescription: ${meta.description}\n---\n\n`;
  },
};

// ---------------------------------------------------------------------------
// Transformer registry — keyed by nativeFormat from provider capabilities
//
// Each transformer: (content, meta) → final file content
// Reference docs: framwork/.codeadd/transforms/{provider}/{resource}.md
// ---------------------------------------------------------------------------

const TRANSFORMERS = {
  /** Identity + frontmatter — all providers accept markdown as-is */
  md(content, meta) {
    return METADATA.mdFrontmatter(meta) + content;
  },
};

// ---------------------------------------------------------------------------
// Resource path resolution (build-time variable substitution)
// ---------------------------------------------------------------------------

/**
 * Resolve {{cmd:NAME}}, {{skill:NAME/FILE}}, {{addpath:X}} variables for a specific provider.
 * Scripts (.codeadd/scripts/) are fixed paths — no substitution needed.
 *
 * {{addpath:X}} resolves to literal `.codeadd/X` regardless of provider — used for
 * runtime paths that exist in the user's installed project (e.g. the wiki generated
 * by /add.wiki, manifest.json, runtime-only artefacts).
 *
 * @param {string} content   raw content with variables
 * @param {object} provider  provider config from provider-map.json
 * @returns {string}
 */
function resolveResourcePaths(content, provider) {
  const base = provider.dir.replace(/^framwork\//, '');

  // {{cmd:NAME}} → full command path for this provider
  content = content.replace(/\{\{cmd:([^}]+)\}\}/g, (_, name) => {
    const resolved = provider.commands.replace('{name}', name);
    return `${base}/${resolved}`;
  });

  // {{skill:NAME/FILE}} → full skill file path for this provider
  content = content.replace(/\{\{skill:([^/}]+)\/([^}]+)\}\}/g, (_, name, file) => {
    const skillDir = path.dirname(provider.skills.replace('{name}', name));
    return `${base}/${skillDir}/${file}`;
  });

  // {{addpath:X}} → literal .codeadd/X (provider-agnostic runtime path)
  content = content.replace(/\{\{addpath:([^}]+)\}\}/g, (_, sub) => `.codeadd/${sub}`);

  return content;
}

/**
 * Warn if source content contains raw .codeadd/commands/ or .codeadd/skills/ paths.
 * These should use {{cmd:}}, {{skill:}}, or {{addpath:}} variables instead.
 * Skips lines inside fenced code blocks (``` ... ```).
 *
 * @param {string} content   source file content
 * @param {string} srcPath   path for warning messages
 */
const LINTED_PATHS = new Set();

function lintResourcePaths(content, srcPath) {
  const relPath = path.relative(ROOT, srcPath);

  // Skip the resource-path-convention skill itself (it documents the patterns)
  if (relPath.includes('add-resource-path-convention')) return;

  // Lint each source file at most once per build (postWrite invokes per provider)
  if (LINTED_PATHS.has(relPath)) return;
  LINTED_PATHS.add(relPath);

  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (/\.codeadd\/commands\//.test(line)) {
      console.warn(`  LINT ${relPath}:${i + 1}: raw .codeadd/commands/ reference — use {{cmd:NAME}} or {{addpath:commands/NAME.md}}`);
    }
    if (/\.codeadd\/skills\//.test(line)) {
      console.warn(`  LINT ${relPath}:${i + 1}: raw .codeadd/skills/ reference — use {{skill:NAME/FILE}} or {{addpath:skills/NAME/...}}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Shipped-surface source guard
//
// Everything under the trees below lands verbatim in a consumer's repository:
// release.yml packages .codeadd/{scripts,fragments,templates,plugins} plus every
// provider dir, and the installer unpacks them into the project root. A file the
// consumer's toolchain recognises as source therefore becomes their CI failure,
// and we control neither their ruleset nor their formatter config — so silencing
// today's warnings only postpones the next one. Ship prose, shell and data.
//
// Regression this exists to prevent: v0.7.1 shipped
// skills/add-skill-creator/render-graphs.js (an unreferenced upstream orphan),
// which reddened `biome lint` and `biome format` repo-wide for every installer.
// ---------------------------------------------------------------------------

const LINTABLE_EXTENSIONS = new Set([
  '.js', '.jsx', '.mjs', '.cjs',
  '.ts', '.tsx', '.mts', '.cts',
  '.css', '.scss', '.sass', '.less',
  '.vue', '.svelte',
]);

// .json is deliberately absent: contracts.json and injection-points.json are
// shipped by design, and JSON only ever trips a formatter's indent preference,
// never a lint rule.
const SHIPPED_SUBDIRS = ['scripts', 'fragments', 'templates', 'plugins'];

function collectLintableSources(dir, offenders = []) {
  if (!fs.existsSync(dir)) return offenders;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectLintableSources(entryPath, offenders);
    } else if (LINTABLE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      offenders.push(path.relative(ROOT, entryPath).split(path.sep).join('/'));
    }
  }
  return offenders;
}

/**
 * Fail the build when a shipped tree carries a linter-visible source file.
 *
 * Skills are walked per registry entry rather than by listing the skills dir:
 * an unregistered directory is never built and never reaches a user, so
 * flagging it would block the build over a file nobody receives.
 */
function assertNoLintableSources(map, codeaddDir = CODEADD_DIR) {
  const offenders = [];

  for (const subdir of SHIPPED_SUBDIRS) {
    collectLintableSources(path.join(codeaddDir, subdir), offenders);
  }
  for (const name of Object.keys(map.skills || {})) {
    collectLintableSources(path.join(codeaddDir, 'skills', name), offenders);
  }

  if (offenders.length === 0) return;

  const list = offenders.sort().map((f) => `  ${f}`).join('\n');
  throw new Error(
    `Shipped tree carries linter-visible source file(s):\n${list}\n\n` +
      `These install into the consumer's repository and break their lint/format run.\n` +
      `Delete the file, or move the logic into a .sh script under .codeadd/scripts/.`,
  );
}

// ---------------------------------------------------------------------------
// Generic resource builder
// ---------------------------------------------------------------------------

/**
 * Build all resources of a given type using a strategy object.
 *
 * Strategy shape:
 *   entries(map)                → Object.entries of the resource map
 *   sourcePath(name)           → absolute path to source file
 *   providerPattern(provider)  → pattern string from provider config (or null to skip)
 *   resolveProviders(entry,map)→ array of provider keys
 *   meta(name, entry, pattern) → metadata object for the transformer
 *   getTransformer(format)     → optional, returns format-specific transformer fn
 *   postWrite(name, entry, provider, outDir) → optional, returns extra file count
 */
function buildResources(map, strategy) {
  let count = 0;

  for (const [name, entry] of strategy.entries(map)) {
    const srcPath = strategy.sourcePath(name);

    if (!fs.existsSync(srcPath)) {
      // A registered resource with no source is a registry/tree mismatch. For
      // agents that must fail loud: a silently missing agent file degrades every
      // named dispatch to a generic subagent with no signal that it happened.
      if (strategy.requireSource) {
        throw new Error(
          `Registered ${strategy.injectionKind || 'resource'} "${name}" has no source at ` +
            `${path.relative(ROOT, srcPath)}. Remove it from provider-map.json or add the file.`,
        );
      }
      console.warn(`  SKIP (not found): ${path.relative(ROOT, srcPath)}`);
      continue;
    }

    // Read + clean once per resource (not per provider)
    const raw = readFile(srcPath);
    lintResourcePaths(raw, srcPath);
    if (strategy.injectionKind) collectInjectionPoints(raw, name, strategy.injectionKind);
    // Commands only — skills and agents materialize nothing into a user's project.
    if (strategy.injectionKind === 'command') collectContract(raw, name);
    const cleaned = stripHtmlComments(raw);
    const providers = strategy.resolveProviders(entry, map);

    for (const key of providers) {
      const provider = map.providers[key];
      const patternStr = strategy.providerPattern(provider);
      if (!patternStr) continue;

      const format = provider.capabilities?.nativeFormat || 'md';
      const transformer = strategy.transform || TRANSFORMERS[format];
      if (!transformer) {
        console.warn(`  SKIP (unknown format "${format}"): ${key}`);
        continue;
      }

      // Resolve {{cmd:}}, {{skill:}} variables per provider
      const withPaths = resolveResourcePaths(cleaned, provider);

      const resolved = patternStr.replace('{name}', name);
      const outRoot = strategy.outRoot ? strategy.outRoot(provider) : provider.dir;
      const outPath = path.join(ROOT, outRoot, resolved);
      const meta = strategy.meta(name, entry, resolved, key, provider);
      const output = transformer(withPaths, meta);

      writeFile(outPath, output);
      count++;

      // Post-write hook (e.g. copy skill extra files)
      if (strategy.postWrite) {
        count += strategy.postWrite(name, entry, provider, path.dirname(outPath));
      }
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Resource strategies
// ---------------------------------------------------------------------------

const commandStrategy = {
  entries: (map) => Object.entries(map.commands),
  sourcePath: (name) => path.join(ROOT, 'framwork', '.codeadd', 'commands', `${name}.md`),
  providerPattern: (provider) => provider.commands || null,
  resolveProviders: (entry, map) => entry.providers ?? Object.keys(map.providers),
  injectionKind: 'command',
  meta: (name, entry, resolvedPattern) => ({
    name,
    description: entry.description,
    skillFormat: resolvedPattern.includes('SKILL.md'),
  }),
};

const skillStrategy = {
  entries: (map) => Object.entries(map.skills),
  sourcePath: (name) => path.join(ROOT, 'framwork', '.codeadd', 'skills', name, 'SKILL.md'),
  providerPattern: (provider) => provider.skills || null,
  resolveProviders: (entry, map) => entry.providers ?? Object.keys(map.providers),
  meta: (name) => ({ name }),

  /**
   * Skills always use passthrough — SKILL.md already has its own YAML frontmatter.
   * nativeFormat (toml) applies to commands only; all providers output skills as .md.
   */
  transform: (content) => content,

  /**
   * Copy extra files/subdirs from skill source (everything except SKILL.md).
   * Markdown files are passed through stripHtmlComments + resolveResourcePaths
   * so {{cmd:}}, {{skill:}}, {{addpath:}} variables resolve per provider, matching
   * SKILL.md's pipeline. Non-markdown files are copied verbatim.
   */
  postWrite(name, _entry, provider, outDir) {
    const sourceDir = path.join(ROOT, 'framwork', '.codeadd', 'skills', name);
    let extra = 0;
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
      if (entry.name === 'SKILL.md') continue;
      const srcEntry = path.join(sourceDir, entry.name);
      const destEntry = path.join(outDir, entry.name);
      if (entry.isDirectory()) {
        extra += copyDirRecursive(srcEntry, destEntry, provider);
      } else {
        fs.mkdirSync(outDir, { recursive: true });
        if (entry.name.endsWith('.md')) {
          const raw = readFile(srcEntry);
          lintResourcePaths(raw, srcEntry);
          const cleaned = stripHtmlComments(raw);
          const resolved = resolveResourcePaths(cleaned, provider);
          writeFile(destEntry, resolved);
        } else {
          fs.copyFileSync(srcEntry, destEntry);
        }
        extra++;
      }
    }
    return extra;
  },
};

// ---------------------------------------------------------------------------
// Agent frontmatter dialects
//
// Every provider reads a different agent frontmatter. The BODY is identical
// everywhere; only the header changes. Reference: brainstorm 002 Discovery
// table (verified 2026-08-24).
//
//   claude    .claude/agents/<name>.md      name, description, model, tools
//   opencode  .opencode/agents/<name>.md    description, mode: subagent, model, permission
//   cursor    .cursor/agents/<name>.md      name, description, model, readonly
//   codex     .codex/agents/<name>.toml     name, description, developer_instructions, model
//
// antigrav is deliberately absent: its native agents live at .agents/agents/,
// which collides with this repo's Codex skills root, and resolving that means
// relocating installed projects. Deferred with the decision recorded, not
// guessed. It carries no `agents` pattern, so buildResources skips it.
// ---------------------------------------------------------------------------

/**
 * Split `---\nkey: value\n---\n\nbody` into its frontmatter and body.
 *
 * Returns both a scalar map (`fields`) and the verbatim source text per key
 * (`blocks`). The verbatim form matters: `skills:` is a multi-line YAML list,
 * and re-serialising it from a scalar would silently drop every entry.
 *
 * @returns {{fields: Record<string,string>, blocks: Record<string,string>, body: string}}
 */
function splitFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(content);
  if (!match) return { fields: {}, blocks: {}, body: content.trim() };

  const fields = {};
  const blocks = {};
  const lines = match[1].split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    const kv = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (kv) {
      current = kv[1];
      fields[current] = kv[2].trim();
      blocks[current] = line;
    } else if (current !== null && line.trim() !== '') {
      // Continuation of the previous key (list item / block scalar).
      blocks[current] += `\n${line}`;
    }
  }

  return { fields, blocks, body: content.slice(match[0].length).trim() };
}

/** Quote a value for single-line YAML when it carries YAML-significant chars. */
function yamlScalar(value) {
  const safe = /^[^"'\n]*$/.test(value) && !/^[&*!|>%@`-]/.test(value) && !/:\s/.test(value) && !/\s#/.test(value);
  return safe ? value : `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** TOML basic string (single line). */
function tomlString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`;
}

/**
 * TOML multi-line basic string. Escapes backslashes, then any `"""` that would
 * close the literal early, then a trailing quote adjacent to the delimiter.
 */
function tomlMultiline(value) {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
  return `"""\n${escaped.replace(/"$/, '\\"')}\n"""`;
}

const AGENT_DIALECTS = {
  claude({ blocks }, body, meta) {
    const out = [`name: ${meta.name}`, `description: ${yamlScalar(meta.description)}`];
    // Verbatim passthrough — `skills:` and `tools:` are multi-line YAML lists,
    // so re-serialising them from a scalar would silently drop every entry.
    for (const key of ['model', 'tools', 'disallowedTools', 'skills', 'memory']) {
      if (blocks[key]) out.push(blocks[key]);
    }
    return `---\n${out.join('\n')}\n---\n\n${body}\n`;
  },

  opencode({ fields }, body, meta) {
    const out = [`description: ${yamlScalar(meta.description)}`, 'mode: subagent'];
    if (fields.model) out.push(`model: ${fields.model}`);
    // A read-only agent gets its constraint enforced by the engine, not merely
    // stated in prose. OpenCode's permission map is the only dialect that can.
    if (meta.readonly) out.push('permission:', '  edit: deny', '  bash: deny', '  webfetch: allow');
    return `---\n${out.join('\n')}\n---\n\n${body}\n`;
  },

  cursor({ fields }, body, meta) {
    const out = [`name: ${meta.name}`, `description: ${yamlScalar(meta.description)}`];
    if (fields.model) out.push(`model: ${fields.model}`);
    if (meta.readonly) out.push('readonly: true');
    return `---\n${out.join('\n')}\n---\n\n${body}\n`;
  },

  codex({ fields }, body, meta) {
    const out = [`name = ${tomlString(meta.name)}`, `description = ${tomlString(meta.description)}`];
    if (fields.model) out.push(`model = ${tomlString(fields.model)}`);
    out.push(`developer_instructions = ${tomlMultiline(body)}`);
    return `${out.join('\n')}\n`;
  },
};

const agentStrategy = {
  entries: (map) => Object.entries(map.agents || {}),
  sourcePath: (name) => path.join(ROOT, 'framwork', '.codeadd', 'agents', `${name}.md`),
  providerPattern: (provider) => provider.agents || null,
  resolveProviders: (entry, map) => entry.providers ?? Object.keys(map.providers),
  injectionKind: 'agent',
  /** A registered agent with no source file must fail the build, never warn-and-skip. */
  requireSource: true,
  /** Codex agents live outside its skills root — see the agentsDir note in provider-map.json. */
  outRoot: (provider) => provider.agentsDir || provider.dir,
  meta: (name, entry, _resolved, providerKey) => ({
    name,
    description: entry.description,
    providerKey,
  }),

  transform(content, meta) {
    const { fields, blocks, body } = splitFrontmatter(content);
    const dialect = AGENT_DIALECTS[meta.providerKey];
    if (!dialect) {
      throw new Error(
        `No agent frontmatter dialect for provider "${meta.providerKey}". An agent emitted ` +
          `with the wrong header silently never loads — add a dialect, or drop that provider's ` +
          `"agents" pattern from provider-map.json.`,
      );
    }
    // `readonly: true` in the source frontmatter is the single declaration of a
    // read-only agent; each dialect renders it however that engine expresses it.
    return dialect({ fields, blocks }, body, { ...meta, readonly: fields.readonly === 'true' });
  },
};

// ---------------------------------------------------------------------------
// Façade functions (preserve public API for tests + external callers)
// ---------------------------------------------------------------------------

function buildCommands(map) {
  return buildResources(map, commandStrategy);
}

function buildSkills(map) {
  return buildResources(map, skillStrategy);
}

function buildAgents(map) {
  return buildResources(map, agentStrategy);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Delete provider output files for resources the registry no longer declares.
 *
 * The build writes but never deletes, so a removed command kept shipping its
 * stale output forever — invisible locally because provider dirs are gitignored,
 * and invisible in CI because CI always builds from a clean checkout. Pruning
 * makes a local build byte-match a CI build, which is what makes the removal
 * tests trustworthy wherever they run.
 *
 * Scoped to commands and agents: both are registry-declared with a
 * one-file-per-name pattern. Skills own arbitrary sibling files, so pruning them
 * would need a manifest this build does not keep.
 *
 * @param {object} map  provider-map.json
 * @returns {number} files removed
 */
function pruneStaleOutputs(map) {
  let removed = 0;

  for (const [key, provider] of Object.entries(map.providers)) {
    for (const [kind, registry] of [['commands', map.commands], ['agents', map.agents || {}]]) {
      const pattern = provider[kind];
      if (!pattern) continue;

      const root = kind === 'agents' ? provider.agentsDir || provider.dir : provider.dir;

      // Flat layout: "<dir>/{name}.<ext>" → prune stale files.
      const flat = /^([^/]+)\/\{name\}(\.[A-Za-z0-9]+)$/.exec(pattern);
      if (flat) {
        const [, subdir, ext] = flat;
        const outDir = path.join(ROOT, root, subdir);
        if (!fs.existsSync(outDir)) continue;

        const declared = new Set(Object.keys(registry).map((n) => `${n}${ext}`));
        for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
          if (!entry.isFile() || !entry.name.endsWith(ext)) continue;
          if (declared.has(entry.name)) continue;
          fs.rmSync(path.join(outDir, entry.name));
          console.log(`  PRUNED (not in registry): ${key}/${subdir}/${entry.name}`);
          removed++;
        }
        continue;
      }

      // Directory layout: "<dir>/{name}/<file>" — Codex and Antigravity emit
      // commands as skills. Prune only a directory whose name is not declared
      // in EITHER registry: commands and skills share this tree, so a name
      // absent from `commands` may still be a legitimate skill.
      const nested = /^([^/]+)\/\{name\}\//.exec(pattern);
      if (!nested) continue;

      const [, subdir] = nested;
      const outDir = path.join(ROOT, root, subdir);
      if (!fs.existsSync(outDir)) continue;

      const declared = new Set([...Object.keys(map.commands), ...Object.keys(map.skills)]);
      for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || declared.has(entry.name)) continue;
        fs.rmSync(path.join(outDir, entry.name), { recursive: true });
        console.log(`  PRUNED (not in registry): ${key}/${subdir}/${entry.name}/`);
        removed++;
      }
    }
  }

  return removed;
}

function main() {
  console.log('Building provider files...\n');

  INJECTION_POINTS = [];
  CONTRACTS = {};

  // Clear the sidecar BEFORE building. A gate firing mid-build aborts before
  // writeContracts(), and a leftover file from an earlier run would let status.sh
  // read a stale `version` and report a behind project as current — the exact
  // outcome I8 exists to prevent.
  const contractsPath = path.join(ROOT, 'framwork', '.codeadd', 'contracts.json');
  fs.rmSync(contractsPath, { force: true });

  const map = readMap();
  assertNoLintableSources(map);
  const prunedCount = pruneStaleOutputs(map);
  const commandCount = buildCommands(map);
  const skillCount = buildSkills(map);
  const agentCount = buildAgents(map);

  const sidecarPath = path.join(ROOT, 'framwork', '.codeadd', 'injection-points.json');
  const pointCount = writeInjectionPoints(sidecarPath);

  const contractCount = writeContracts(contractsPath);

  const total = commandCount + skillCount + agentCount;
  console.log(`\nBuild complete:`);
  console.log(`  Commands : ${Object.keys(map.commands).length} × providers → ${commandCount} files`);
  console.log(`  Skills   : ${Object.keys(map.skills).length} skills  → ${skillCount} files`);
  console.log(`  Agents   : ${Object.keys(map.agents || {}).length} agents  → ${agentCount} files`);
  if (prunedCount) console.log(`  Pruned   : ${prunedCount} stale output file(s)`);
  console.log(`  Injection points : ${pointCount} → ${path.relative(ROOT, sidecarPath)}`);
  console.log(`  Contracts        : ${contractCount} → ${path.relative(ROOT, contractsPath)}`);
  console.log(`  Total    : ${total} files generated`);
}

// Export for testing
module.exports = {
  stripHtmlComments,
  extractInjectionPoints,
  collectInjectionPoints,
  getInjectionPoints,
  writeInjectionPoints,
  _resetInjectionPoints: () => { INJECTION_POINTS = []; },
  sliceContractBlock,
  contractShape,
  CONTRACT_VARIABLE_RE,
  extractContract,
  collectContract,
  writeContracts,
  _resetContracts: () => { CONTRACTS = {}; },
  resolveResourcePaths,
  lintResourcePaths,
  collectLintableSources,
  assertNoLintableSources,
  LINTABLE_EXTENSIONS,
  copyDirRecursive,
  _resetLintCache: () => LINTED_PATHS.clear(),
  TRANSFORMERS,
  METADATA,
  buildCommands,
  buildSkills,
  buildAgents,
  buildResources,
  pruneStaleOutputs,
  splitFrontmatter,
  tomlString,
  tomlMultiline,
  AGENT_DIALECTS,
  readMap,
};

// Only run when executed directly
if (require.main === module) {
  main();
}
