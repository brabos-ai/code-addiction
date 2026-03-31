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

const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// I/O helpers (thin wrappers — keep logic out of here)
// ---------------------------------------------------------------------------

function readMap() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8'));
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function copyDirRecursive(src, dest) {
  let count = 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Pure transforms (no I/O, fully testable)
// ---------------------------------------------------------------------------

/**
 * Remove ALL HTML comments and collapse excess blank lines.
 * Saves tokens when content is sent to the model.
 */
function stripHtmlComments(content) {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Escape a string for use as a TOML basic string value (double-quoted).
 */
function escapeTomlString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
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

  /** TOML header comment for traceability */
  tomlHeader(meta) {
    return `# AUTO-GENERATED - source: framwork/.codeadd/commands/${meta.name}.md\n`;
  },
};

// ---------------------------------------------------------------------------
// Transformer registry — keyed by nativeFormat from provider capabilities
//
// Each transformer: (content, meta) → final file content
// Reference docs: framwork/.codeadd/transforms/{provider}/{resource}.md
// ---------------------------------------------------------------------------

const TRANSFORMERS = {
  /** Identity + frontmatter — most providers accept markdown as-is */
  md(content, meta) {
    return METADATA.mdFrontmatter(meta) + content;
  },

  /**
   * TOML wrapper for Gemini CLI.
   * See: framwork/.codeadd/transforms/gemini/commands.md
   */
  toml(content, meta) {
    return [
      METADATA.tomlHeader(meta),
      `description = "${escapeTomlString(meta.description)}"`,
      'prompt = """',
      content,
      '"""',
    ].join('\n');
  },
};

// ---------------------------------------------------------------------------
// Resource path resolution (build-time variable substitution)
// ---------------------------------------------------------------------------

/**
 * Resolve {{cmd:NAME}}, {{skill:NAME/FILE}} variables for a specific provider.
 * Scripts (.codeadd/scripts/) are fixed paths — no substitution needed.
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

  return content;
}

/**
 * Warn if source content contains raw .codeadd/commands/ or .codeadd/skills/ paths.
 * These should use {{cmd:}} or {{skill:}} variables instead.
 * Skips lines inside fenced code blocks (``` ... ```).
 *
 * @param {string} content   source file content
 * @param {string} srcPath   path for warning messages
 */
function lintResourcePaths(content, srcPath) {
  const relPath = path.relative(ROOT, srcPath);

  // Skip the resource-path-convention skill itself (it documents the patterns)
  if (relPath.includes('add-resource-path-convention')) return;

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
      console.warn(`  LINT ${relPath}:${i + 1}: raw .codeadd/commands/ reference — use {{cmd:NAME}}`);
    }
    if (/\.codeadd\/skills\//.test(line)) {
      console.warn(`  LINT ${relPath}:${i + 1}: raw .codeadd/skills/ reference — use {{skill:NAME/FILE}}`);
    }
  }
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
 *   postWrite(name, entry, provider, outDir) → optional, returns extra file count
 */
function buildResources(map, strategy) {
  let count = 0;

  for (const [name, entry] of strategy.entries(map)) {
    const srcPath = strategy.sourcePath(name);

    if (!fs.existsSync(srcPath)) {
      console.warn(`  SKIP (not found): ${path.relative(ROOT, srcPath)}`);
      continue;
    }

    // Read + clean once per resource (not per provider)
    const raw = readFile(srcPath);
    lintResourcePaths(raw, srcPath);
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
      const outPath = path.join(ROOT, provider.dir, resolved);
      const meta = strategy.meta(name, entry, resolved);
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
  meta: (name) => ({ name, description: '', skillFormat: false }),

  /** Copy extra files/subdirs from skill source (everything except SKILL.md) */
  postWrite(name, _entry, _provider, outDir) {
    const sourceDir = path.join(ROOT, 'framwork', '.codeadd', 'skills', name);
    let extra = 0;
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
      if (entry.name === 'SKILL.md') continue;
      const srcEntry = path.join(sourceDir, entry.name);
      const destEntry = path.join(outDir, entry.name);
      if (entry.isDirectory()) {
        extra += copyDirRecursive(srcEntry, destEntry);
      } else {
        fs.mkdirSync(outDir, { recursive: true });
        fs.copyFileSync(srcEntry, destEntry);
        extra++;
      }
    }
    return extra;
  },
};

const agentStrategy = {
  entries: (map) => Object.entries(map.agents || {}),
  sourcePath: (name) => path.join(ROOT, 'framwork', '.codeadd', 'agents', `${name}.md`),
  providerPattern: (provider) => provider.agents || null,
  resolveProviders: (entry, map) => entry.providers ?? Object.keys(map.providers),
  meta: (name, entry) => ({ name, description: entry.description }),
  /** Passthrough — agents keep their own frontmatter (name, model, tools, skills, memory) */
  transform: (content) => content,
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

function main() {
  console.log('Building provider files...\n');

  const map = readMap();
  const commandCount = buildCommands(map);
  const skillCount = buildSkills(map);
  const agentCount = buildAgents(map);

  const total = commandCount + skillCount + agentCount;
  console.log(`\nBuild complete:`);
  console.log(`  Commands : ${Object.keys(map.commands).length} × providers → ${commandCount} files`);
  console.log(`  Skills   : ${Object.keys(map.skills).length} skills  → ${skillCount} files`);
  console.log(`  Agents   : ${Object.keys(map.agents || {}).length} agents  → ${agentCount} files`);
  console.log(`  Total    : ${total} files generated`);
}

// Export for testing
module.exports = {
  stripHtmlComments,
  escapeTomlString,
  resolveResourcePaths,
  lintResourcePaths,
  TRANSFORMERS,
  METADATA,
  buildCommands,
  buildSkills,
  buildAgents,
  buildResources,
  readMap,
};

// Only run when executed directly
if (require.main === module) {
  main();
}
