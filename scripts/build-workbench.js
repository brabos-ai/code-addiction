#!/usr/bin/env node
/**
 * build-workbench.js — compile the workbench layer from `workbench/` into the
 * repository-root provider directories.
 *
 * The workbench is the framework's OWN development pipeline: the four stages
 * (brainstorm → plan → build → done), the skills that support them, the
 * internal commands and the agents they dispatch. It ships to no user. What it
 * gained here is a source/output split, so the same artefacts can be read by
 * more than one provider inside this repository.
 *
 *   workbench/{commands,skills,agents}/  →  .claude/…  .opencode/…
 *
 * ⛔ THIS FILE OWNS NO TRANSFORMATION. Every line of it is registry, strategy
 *    and wiring; `scripts/build.js` does the work and is imported, never
 *    copied. The repository already carries the cost of the other choice —
 *    ENTRY_POINT_KINDS, DEPENDENCY_TYPES and ORPHAN_DEPENDENCY_TYPES exist in
 *    both scripts/graph.js and mcp/engine.mjs, which cannot import each other,
 *    and only cli/tests/mcp-engine.test.js holds them together. Here the
 *    import is available, so isolation is free.
 *
 * ⛔ ITS OUTPUT IS OUT OF THE RELEASE PATH. `release.yml` runs
 *    `node scripts/build.js` and packages `framwork/`; nothing here is
 *    published. `cli/tests/build-workbench.test.js` does run this file, into a
 *    temp copy, so a break here fails `npm test` in every workflow, release
 *    included — main is already red by then, since `ci.yml` runs the same test.
 *
 * Usage: node scripts/build-workbench.js
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  buildResources,
  pruneStaleOutputs,
  stripHtmlComments,
  resolveResourcePaths,
  lintResourcePaths,
  copyDirRecursive,
  splitFrontmatter,
  TRANSFORMERS,
  AGENT_DIALECTS,
} = require('./build.js');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'workbench');

/** Read a file as utf8. `build.js` keeps its own copy of this private. */
function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function readMap() {
  return JSON.parse(readFile(path.join(SRC, 'provider-map.json')));
}

// ---------------------------------------------------------------------------
// Strategies — the ONLY thing that differs from the product build
//
// `buildResources(map, strategy)` reads no module-level path constant: the
// product strategies hardcode `path.join(ROOT, 'framwork', '.codeadd', …)`
// inside their own `sourcePath`. That is why a second source root needs three
// new strategy objects and no edit to `build.js` at all.
// ---------------------------------------------------------------------------

const commandStrategy = {
  entries: (map) => Object.entries(map.commands),
  sourcePath: (name) => path.join(SRC, 'commands', `${name}.md`),
  providerPattern: (provider) => provider.commands || null,
  resolveProviders: (entry, map) => entry.providers ?? Object.keys(map.providers),
  // No injectionKind: feature and plugin fragments inject into PRODUCT commands
  // only. A workbench command carries no marker and has no contract to collect.
  meta: (name, entry, resolvedPattern) => ({
    name,
    description: entry.description,
    skillFormat: resolvedPattern.includes('SKILL.md'),
  }),
};

const skillStrategy = {
  entries: (map) => Object.entries(map.skills),
  sourcePath: (name) => path.join(SRC, 'skills', name, 'SKILL.md'),
  providerPattern: (provider) => provider.skills || null,
  resolveProviders: (entry, map) => entry.providers ?? Object.keys(map.providers),
  meta: (name) => ({ name }),

  /** Passthrough — SKILL.md carries its own frontmatter, as in the product build. */
  transform: (content) => content,

  /** Copy everything beside SKILL.md: `references/`, `evals/`, whatever a skill holds. */
  postWrite(name, _entry, provider, outDir) {
    const sourceDir = path.join(SRC, 'skills', name);
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
          fs.writeFileSync(destEntry, resolveResourcePaths(stripHtmlComments(raw), provider), 'utf8');
        } else {
          fs.copyFileSync(srcEntry, destEntry);
        }
        extra++;
      }
    }
    return extra;
  },
};

const agentStrategy = {
  entries: (map) => Object.entries(map.agents || {}),
  sourcePath: (name) => path.join(SRC, 'agents', `${name}.md`),
  providerPattern: (provider) => provider.agents || null,
  resolveProviders: (entry, map) => entry.providers ?? Object.keys(map.providers),
  /** A registered agent with no source must fail loud, as in the product build. */
  requireSource: true,
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
          `with the wrong header silently never loads — add a dialect to scripts/build.js, or ` +
          `drop that provider's agents pattern from workbench/provider-map.json.`,
      );
    }
    return dialect({ fields, blocks }, body, { ...meta, readonly: fields.readonly === 'true' });
  },
};

// ---------------------------------------------------------------------------
// Registry / tree agreement
//
// The product build warns and skips a registered resource with no source. Here
// both directions are a hard failure: the workbench registry and the workbench
// tree are edited by the same person in the same commit, so a mismatch is a
// mistake rather than a distribution decision.
// ---------------------------------------------------------------------------

function assertRegistryMatchesTree(map) {
  const problems = [];

  const onDisk = {
    commands: fs.existsSync(path.join(SRC, 'commands'))
      ? fs.readdirSync(path.join(SRC, 'commands')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
      : [],
    skills: fs.existsSync(path.join(SRC, 'skills'))
      ? fs.readdirSync(path.join(SRC, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
      : [],
    agents: fs.existsSync(path.join(SRC, 'agents'))
      ? fs.readdirSync(path.join(SRC, 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
      : [],
  };

  for (const kind of ['commands', 'skills', 'agents']) {
    const registered = new Set(Object.keys(map[kind] || {}));
    for (const name of onDisk[kind]) {
      if (!registered.has(name)) problems.push(`workbench/${kind}/${name}: on disk, not in workbench/provider-map.json`);
    }
    for (const name of registered) {
      if (!onDisk[kind].includes(name)) problems.push(`${kind}.${name}: in workbench/provider-map.json, not on disk`);
    }
  }

  if (problems.length) {
    throw new Error(`workbench registry does not match the tree:\n  ${problems.join('\n  ')}`);
  }
}

function main() {
  console.log('Building workbench files...\n');

  const map = readMap();
  assertRegistryMatchesTree(map);

  const commands = buildResources(map, commandStrategy);
  const skills = buildResources(map, skillStrategy);
  const agents = buildResources(map, agentStrategy);
  const removed = pruneStaleOutputs(map);

  console.log('\nWorkbench build complete:');
  console.log(`  Commands : ${Object.keys(map.commands).length} × ${Object.keys(map.providers).length} providers → ${commands} files`);
  console.log(`  Skills   : ${Object.keys(map.skills).length} skills  → ${skills} files`);
  console.log(`  Agents   : ${Object.keys(map.agents).length} agents  → ${agents} files`);
  if (removed) console.log(`  Pruned   : ${removed} stale file(s)`);
  console.log(`  Total    : ${commands + skills + agents} files generated`);
  console.log(`  Providers: ${Object.keys(map.providers).join(', ')}`);
}

module.exports = { commandStrategy, skillStrategy, agentStrategy, assertRegistryMatchesTree, readMap, SRC };

if (require.main === module) {
  main();
}
