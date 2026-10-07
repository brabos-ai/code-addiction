#!/usr/bin/env node
'use strict';

// Product command/skill renames only. Preview is the complete input to apply.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');
const posix = (name) => name.split(path.sep).join('/');
const extensions = new Set(['.md', '.json', '.js', '.cjs', '.mjs', '.sh', '.astro', '.svg', '.yml', '.yaml', '.toml']);

function options(argv) {
  const [mode, ...rest] = argv;
  if (!['preview', 'apply'].includes(mode)) throw new Error('Usage: preview [--output file] | apply --preview file|- [--root dir] [--map file]');
  const opts = { mode, root: process.cwd(), output: null, preview: null, map: null, scope: 'product' };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    if (!['--root', '--output', '--preview', '--map', '--scope'].includes(key) || !rest[i + 1]) throw new Error(`Unknown or missing argument: ${key}`);
    opts[key.slice(2)] = rest[i + 1];
  }
  if (mode === 'apply' && !opts.preview) throw new Error('apply requires --preview file|-');
  if (mode === 'preview' && opts.preview) throw new Error('preview cannot take --preview');
  opts.root = path.resolve(opts.root);
  if (!['product', 'docs', 'all'].includes(opts.scope)) throw new Error('Invalid scope');
  return opts;
}

function mapping(root, override) {
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'framwork/provider-map.json'), 'utf8'));
  const pluginsFile = path.join(root, 'cli/src/plugins.json');
  const plugins = fs.existsSync(pluginsFile) ? JSON.parse(fs.readFileSync(pluginsFile, 'utf8')) : {};
  const commands = Object.fromEntries(Object.keys(registry.commands || {}).filter((n) => /^add\.[a-z0-9-]+$/.test(n)).map((n) => [n, n.replace('add.', 'add-')]));
  const legacySkill = (n) => /^add-(?!-)[a-z0-9-]+$/.test(n);
  const skills = Object.fromEntries(Object.keys(registry.skills || {}).filter(legacySkill).map((n) => [n, n.replace(/^add-/, 'add--')]));
  for (const plugin of Object.values(plugins)) {
    if (!plugin || !Array.isArray(plugin.skills)) continue;
    for (const name of plugin.skills) if (legacySkill(name)) skills[name] = name.replace(/^add-/, 'add--');
  }
  if (override) {
    const extra = JSON.parse(fs.readFileSync(path.resolve(override), 'utf8'));
    for (const kind of ['commands', 'skills']) {
      for (const [oldName, newName] of Object.entries(extra[kind] || {})) {
        if (!(oldName in registry[kind]) && !(kind === 'skills' && Object.values(plugins).some((p) => p?.skills?.includes(oldName)))) {
          throw new Error(`Override does not name an active ${kind}: ${oldName}`);
        }
        (kind === 'commands' ? commands : skills)[oldName] = newName;
      }
    }
  }
  for (const [oldName, newName] of Object.entries(commands)) {
    if (!/^add\.[a-z0-9-]+$/.test(oldName) || !/^add-[a-z0-9-]+$/.test(newName)) throw new Error(`Invalid command mapping: ${oldName} -> ${newName}`);
  }
  for (const [oldName, newName] of Object.entries(skills)) {
    if (!/^add-[a-z0-9-]+$/.test(oldName) || !/^add--[a-z0-9-]+$/.test(newName)) throw new Error(`Invalid skill mapping: ${oldName} -> ${newName}`);
  }
  const names = [ ...Object.values(commands), ...Object.values(skills), 'add' ];
  if (new Set(names).size !== names.length) throw new Error('Destination name collision');
  return { commands, skills };
}

function files(root, scope) {
  const result = [];
  function visit(relative) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const name = posix(path.join(relative, entry.name));
      if (entry.isSymbolicLink()) throw new Error(`Symlink in rename scope: ${name}`);
      if (entry.isDirectory()) visit(name);
      else if (entry.isFile() && extensions.has(path.extname(entry.name)) && !['artefact-graph.json', 'contracts.json', 'injection-points.json'].includes(entry.name)) result.push(name);
    }
  }
  if (scope !== 'docs') {
    visit('framwork/.codeadd');
    for (const name of ['framwork/provider-map.json', 'cli/src/plugins.json']) {
      if (fs.existsSync(path.join(root, name))) result.push(name);
    }
  }
  if (scope !== 'product') {
    for (const name of ['README.md', 'AGENTS.md']) if (fs.existsSync(path.join(root, name))) result.push(name);
    visit('web/src/pages');
    visit('web/public');
    visit('workbench');
  }
  return result.sort();
}

function movedPath(file, map) {
  if (!file.startsWith('framwork/.codeadd/')) return file;
  let target = file;
  for (const [oldName, newName] of Object.entries(map.commands)) {
    target = target.replace(`framwork/.codeadd/commands/${oldName}.md`, `framwork/.codeadd/commands/${newName}.md`);
    // Only command fragment basenames; plugin agent fragments retain their agent names.
    target = target.replace(new RegExp(`(\\/fragments\\/(?:[^/]+\\/)?(?:fragments\\/)?)(?:${oldName.replace('.', '\\.')})(\\.md)$`), `$1${newName}$2`);
  }
  for (const [oldName, newName] of Object.entries(map.skills)) {
    target = target.replace(`/skills/${oldName}/`, `/skills/${newName}/`);
  }
  return target;
}

function changeText(text, map) {
  // Longest first, and match whole resource names only. A suffix is not an alias.
  const entries = [...Object.entries(map.skills), ...Object.entries(map.commands)]
    .sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0]));
  const keys = entries.map(([oldName]) => oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!keys.length) return { text, edits: [] };
  const re = new RegExp(`(?<![a-zA-Z0-9_.-])(?:${keys.join('|')})(?![a-zA-Z0-9_-])`, 'g');
  const lookup = Object.fromEntries(entries);
  const edits = [];
  const updated = text.replace(re, (oldName, offset) => {
    const newName = lookup[oldName];
    edits.push({ old: oldName, new: newName, offset, before: text.slice(Math.max(0, offset - 45), offset + oldName.length + 45), after: text.slice(Math.max(0, offset - 45), offset) + newName + text.slice(offset + oldName.length, offset + oldName.length + 45) });
    return newName;
  });
  return { text: updated, edits };
}

function makePreview(root, map, scope) {
  const ops = [];
  const targets = new Set();
  for (const file of files(root, scope)) {
    const original = fs.readFileSync(path.join(root, file));
    const target = movedPath(file, map);
    const { text, edits } = changeText(original.toString('utf8'), map);
    if (target === file && !edits.length) continue;
    if (targets.has(target)) throw new Error(`Duplicate destination: ${target}`);
    targets.add(target);
    if (target !== file && fs.existsSync(path.join(root, target))) throw new Error(`Destination exists: ${target}`);
    ops.push({ type: 'file', path: file, target, sourceHash: sha(original), resultHash: sha(text), edits });
  }
  const rows = [{ type: 'header', version: 1, map, scope }, ...ops.flatMap(({ path: file, target, sourceHash, resultHash, edits }) => [
    ...(file === target ? [] : [{ type: 'move', path: file, target, sourceHash, resultHash }]),
    ...edits.map(({ old, new: next, offset, before, after }) => ({ type: 'edit', path: file, target, sourceHash, resultHash, old, new: next, offset, before, after })),
  ])];
  const body = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const preview = body + JSON.stringify({ type: 'footer', records: rows.length + 1, files: ops.length, digest: sha(body) }) + '\n';
  return { preview, ops, records: rows.length + 1, files: ops.length, bytes: Buffer.byteLength(preview) };
}

function main() {
  const opts = options(process.argv.slice(2));
  const map = mapping(opts.root, opts.map);
  const generated = makePreview(opts.root, map, opts.scope);
  if (opts.mode === 'preview') {
    const summary = `records=${generated.records} files=${generated.files} bytes=${generated.bytes}${opts.output ? ` output=${opts.output}` : ''}\n`;
    if (opts.output) {
      fs.writeFileSync(path.resolve(opts.output), generated.preview);
      process.stdout.write(summary);
    } else {
      process.stdout.write(generated.preview);
      process.stderr.write(summary);
    }
    return;
  }
  const preview = opts.preview === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.resolve(opts.preview), 'utf8');
  if (preview !== generated.preview) throw new Error('Preview is incomplete, modified or stale; run preview again');
  // Whole-batch preflight before first write; makePreview checked all destination conflicts.
  const updates = generated.ops.map(({ path: file, target, sourceHash, resultHash }) => {
    const original = fs.readFileSync(path.join(opts.root, file));
    if (sha(original) !== sourceHash) throw new Error(`Stale source: ${file}`);
    const text = changeText(original.toString('utf8'), map).text;
    if (sha(text) !== resultHash) throw new Error(`Preview result mismatch: ${file}`);
    return { file, target, text };
  });
  for (const { file, target, text } of updates) {
    const dest = path.join(opts.root, target);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
    if (target !== file) fs.unlinkSync(path.join(opts.root, file));
  }
  process.stdout.write(`applied=${updates.length}\n`);
}

try { main(); } catch (err) { console.error(`rename-product-artefacts: ${err.message}`); process.exitCode = 1; }
