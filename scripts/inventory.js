#!/usr/bin/env node
/**
 * inventory.js — write the product-layer inventory block into CLAUDE.md.
 *
 * Usage:
 *   node scripts/inventory.js                 write the block, report whether it changed
 *   node scripts/inventory.js --check         verify without writing; exit 2 if stale
 *   node scripts/inventory.js [...] --root D  operate on D instead of the repo root
 *
 * Exit codes: 0 current or written, 2 stale, malformed, or bad arguments.
 * 2 rather than 1 throughout, matching scripts/graph.js.
 *
 * Why a block in CLAUDE.md and not a fourth sidecar: CLAUDE.md is loaded into
 * every session with no action taken. A sidecar answers the same question only
 * to whoever remembers to open it, which is the failure mode this replaces.
 *
 * Architecture:
 *   GROUPS           → one collector per key; the identity rule lives beside it
 *   collectInventory → the nine groups, each sorted by NAME
 *   renderBlock      → five lines of minified JSON, one object per line
 *   spliceBlock      → replace between the markers; never append, never no-op
 *   writeBlock       → collect, render, splice, write; reports `changed`
 *   checkBlock       → the same comparison, without writing
 */

const fs = require('fs');
const path = require('path');
const { SIDECARS } = require('./build.js');

const MARK_START = '[//]: # (codeadd-inventory:start)';
const MARK_END = '[//]: # (codeadd-inventory:end)';

const REPO_ROOT = path.resolve(__dirname, '..');

/** Directory entries that are themselves directories. */
function subdirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/** Files directly inside `dir` whose name ends with `suffix`. */
function filesWith(dir, suffix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(suffix))
    .map((e) => e.name);
}

/**
 * The nine groups, in block order. Each collector returns identities, never
 * paths — the block answers "what can I invoke", and a name is how you invoke it.
 *
 * `fragments` and `plugins` list the OWNING DIRECTORY and never its files.
 * `add.plan.md` exists under fragments/qa-pipeline/, fragments/tdd-pipeline/ and
 * plugins/gitnexus/fragments/ at once; a flat filename array collides on it.
 *
 * `sidecars` is read from the SIDECARS constant, never globbed. All three files
 * are gitignored, so a glob finds nothing on a fresh checkout and would report
 * staleness that does not exist.
 */
const GROUPS = {
  commands: (d) => filesWith(path.join(d, 'commands'), '.md').map((f) => f.slice(0, -3)),
  skills: (d) => subdirs(path.join(d, 'skills'))
    .filter((n) => fs.existsSync(path.join(d, 'skills', n, 'SKILL.md'))),
  agents: (d) => filesWith(path.join(d, 'agents'), '-agent.md').map((f) => f.slice(0, -9)),
  scripts: (d) => filesWith(path.join(d, 'scripts'), '.sh'),
  templates: (d) => filesWith(path.join(d, 'templates'), '.md').map((f) => f.slice(0, -3)),
  fragments: (d) => subdirs(path.join(d, 'fragments')),
  plugins: (d) => subdirs(path.join(d, 'plugins')).filter((n) => !n.startsWith('$')),
  transforms: (d) => subdirs(path.join(d, 'transforms'))
    .flatMap((p) => filesWith(path.join(d, 'transforms', p), '.md').map((f) => `${p}/${f}`)),
  sidecars: () => [...SIDECARS],
};

/**
 * Sorted by NAME, never by filename. Sorting `commands/*.md` puts `add.md` after
 * `add.init.md` and `add.plan-to-ready.md` before `add.plan.md`, because '-' (45)
 * sorts before '.' (46) and the extension shifts the comparison. Both read as
 * mistakes and both move the diff for no reason.
 */
function collectInventory(codeaddDir) {
  const out = {};
  for (const [key, collect] of Object.entries(GROUPS)) {
    out[key] = [...new Set(collect(codeaddDir))].sort();
  }
  return out;
}

/** Five lines of minified JSON — data the agent looks up, per add-token-efficiency § 2. */
function renderBlock(inv) {
  return [
    JSON.stringify({ commands: inv.commands }),
    JSON.stringify({ skills: inv.skills }),
    JSON.stringify({ agents: inv.agents }),
    JSON.stringify({ scripts: inv.scripts }),
    JSON.stringify({
      templates: inv.templates,
      fragments: inv.fragments,
      plugins: inv.plugins,
      transforms: inv.transforms,
      sidecars: inv.sidecars,
    }),
  ].join('\n');
}

/**
 * Replace what sits between the markers. Replace-only by design: the product
 * layer's managed blocks append because a user's CLAUDE.md is arbitrary, but this
 * file is ours and the block belongs inside `## Project Anatomy`. Appending would
 * put it somewhere else and still look like success.
 */
function spliceBlock(markdown, body) {
  const start = markdown.indexOf(MARK_START);
  const end = markdown.indexOf(MARK_END);
  if (start === -1) throw new Error(`marker not found: ${MARK_START}`);
  if (end === -1) throw new Error(`marker not found: ${MARK_END}`);
  if (end < start) throw new Error(`${MARK_END} precedes ${MARK_START}`);
  const head = markdown.slice(0, start + MARK_START.length);
  const tail = markdown.slice(end);
  return `${head}\n${body}\n${tail}`;
}

function paths(root) {
  return {
    claudeMd: path.join(root, 'CLAUDE.md'),
    codeadd: path.join(root, 'framwork', '.codeadd'),
  };
}

function writeBlock(claudeMdPath, codeaddDir) {
  const before = fs.readFileSync(claudeMdPath, 'utf8');
  const after = spliceBlock(before, renderBlock(collectInventory(codeaddDir)));
  if (after === before) return { changed: false };
  fs.writeFileSync(claudeMdPath, after);
  return { changed: true };
}

function checkBlock(claudeMdPath, codeaddDir) {
  const before = fs.readFileSync(claudeMdPath, 'utf8');
  const after = spliceBlock(before, renderBlock(collectInventory(codeaddDir)));
  return after === before
    ? { current: true, reason: null }
    : { current: false, reason: 'the block does not match framwork/.codeadd/' };
}

function main(argv) {
  const valued = new Set(['--root']);
  const valueIndexes = new Set();
  argv.forEach((a, i) => { if (valued.has(a)) valueIndexes.add(i + 1); });
  const flags = argv.filter((a, i) => a.startsWith('--') && !valueIndexes.has(i));
  const valueOf = (flag) => argv[argv.indexOf(flag) + 1];

  const unknown = flags.filter((f) => f !== '--check' && f !== '--root');
  if (unknown.length) {
    console.error(`inventory.js: unknown flag ${unknown[0]}`);
    process.exitCode = 2;
    return;
  }

  const root = flags.includes('--root') ? path.resolve(valueOf('--root')) : REPO_ROOT;
  const { claudeMd, codeadd } = paths(root);

  try {
    if (flags.includes('--check')) {
      const { current, reason } = checkBlock(claudeMd, codeadd);
      if (current) {
        console.log('inventory block is current');
        return;
      }
      console.error(`inventory block is STALE — ${reason}\n  fix: node scripts/inventory.js`);
      process.exitCode = 2;
      return;
    }
    const { changed } = writeBlock(claudeMd, codeadd);
    console.log(changed ? `inventory block updated in ${claudeMd}` : 'inventory block already current');
  } catch (err) {
    console.error(`inventory.js: ${err.message}`);
    process.exitCode = 2;
  }
}

if (require.main === module) main(process.argv.slice(2));

module.exports = {
  MARK_START,
  MARK_END,
  GROUPS,
  collectInventory,
  renderBlock,
  spliceBlock,
  writeBlock,
  checkBlock,
  main,
};
