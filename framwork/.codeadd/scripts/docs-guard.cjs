#!/usr/bin/env node
/**
 * docs-guard.cjs — files Code Addiction outputs found OUTSIDE the docs root.
 *
 * A command writes its outputs under the docs root. When one lands somewhere
 * else (an older habit, a hand copy, a tool that does not know the layout) this
 * guard moves it to its place under the root and drops it from the code index.
 * It is silent: no warning, no block. Its rules are location-agnostic — they
 * match at ANY path outside the docs root and name no former location.
 *
 * Usage:
 *   node .codeadd/scripts/docs-guard.cjs          (run from inside the repository)
 *
 * Output — exactly one line on stdout:
 *   DOCS_GUARD=clean         nothing was misplaced
 *   DOCS_GUARD=moved:<n>     n files were moved
 *
 * Exit codes:
 *   0 — always, once the line is printed
 *   1 — there is something to move and the docs root is absent: the one explicit
 *       DOCS_ROOT_MISSING error from the resolver goes to stderr, nothing moves
 *
 * Scope: files changed since the merge base with the main branch (origin/main,
 * main, master — all tracked and untracked files when none exists) plus pending
 * files (staged, unstaged, untracked). Anything already under the docs root is
 * never read.
 *
 * Detection (a file is a hit when any rule matches):
 *   a. a markdown file whose frontmatter `type:` is a key of DOCS_LAYOUT.types
 *      with a non-null sub-path (null = a wiki page, which stays in the code)
 *   b. layout and name patterns: a folder named NNNNX-<slug> holding Code
 *      Addiction files (the whole folder moves, as features/<folder>);
 *      iterations.md (first heading after optional frontmatter is `# Iterations`),
 *      build-ledger.md and tasks.md (first heading starts `# Tasks:`) inside
 *      such a folder; delivered.jsonl; decisions.jsonl; and names shaped
 *      YYYY-MM-DDTHHMMSS-<slug>.md or YYYY-MM-DDTHHMMSS-<slug>-intent.md
 *   c. JSONL whose lines carry a known key signature — ts/id/by (the delivery
 *      index, with or without `v`) or ts/agent/type (the iteration logs)
 * A file matching nothing is never touched. The run is idempotent.
 *
 * Placement: typed docs go to the sub-path of their type, feature folders to
 * features/<folder>, the delivery index and the decisions log to their root
 * names. A JSONL moving onto an existing JSONL is appended; any other name
 * collision keeps both files (the newcomer gets a numeric suffix).
 *
 * Exports: runDocsGuard(cwd, opts) -> { moved: number, files: string[] }
 *   opts.main — override the main branch ref used for the merge base
 *
 * Dependencies: Node built-ins and git (argv arrays, no shell).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { DOCS_ROOT, DOCS_LAYOUT, docsPath, repoTop, toPosix } = require('./docs-root.cjs');

const FEATURE_DIR_RE = /^[0-9]{4}[A-Z]-[A-Za-z0-9][A-Za-z0-9._-]*$/;
// The framework's own files are never outputs: its installed tooling (`.codeadd/` — only the old
// project folder holding a decisions log is looked into), every provider directory, dependencies,
// and test fixtures. A template or a skill that carries a `type:` line is not a misplaced document.
const OWN_TOP_DIRS = new Set([
  '.codeadd', '.claude', '.agents', '.agent', '.codex', '.cursor', '.opencode', '.gemini', '.zcode',
  '.github', '.augment', '.bob', '.kilocode', '.kiro', '.qwen', '.roo', '.shai', '.windsurf', 'node_modules',
]);
const OWN_ANYWHERE = new Set(['node_modules', 'fixtures', '.git']);
function isOwnFile(rel) {
  const parts = rel.split('/');
  if (parts.some((seg) => OWN_ANYWHERE.has(seg))) return true;
  if (parts[0] === '.codeadd') return parts[1] !== 'project';
  return OWN_TOP_DIRS.has(parts[0]);
}

// Types whose minimal frontmatter is type + schema; every other output document carries an `id:`,
// and a file with a registered `type:` but no `id:` (a template, an example) is not one.
const ID_LESS_TYPES = new Set(['iterations', 'build-ledger', 'tasks', 'health-check', 'design-system', 'code-quality-review']);
function hasFrontmatterId(text) {
  const m = FRONTMATTER_RE.exec(text);
  return !!m && /^id:[ \t]*\S/m.test(m[1]);
}

const FOLDER_FILE_TYPES = new Set(['iterations', 'build-ledger', 'tasks']);
const STAMPED_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}-.+?(-intent)?\.md$/;
const FRONTMATTER_RE = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

function git(cwd, args) {
  const res = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  });
  return {
    status: res.status === null || res.status === undefined ? 1 : res.status,
    stdout: res.stdout || '',
  };
}

function lines(out) {
  return out.split('\0').filter(Boolean).map(toPosix);
}

function mergeBase(top, main) {
  const refs = main
    ? [main]
    : ['refs/remotes/origin/main', 'refs/heads/main', 'refs/remotes/origin/master', 'refs/heads/master'];
  for (const ref of refs) {
    const res = git(top, ['merge-base', 'HEAD', ref]);
    const sha = res.stdout.trim();
    if (res.status === 0 && sha) return sha;
  }
  return null;
}

/** Repo-relative posix paths in scope, outside the docs root, that exist. */
function candidates(top, main) {
  const found = new Set();
  const add = (out) => lines(out).forEach((p) => found.add(p));
  const base = mergeBase(top, main);
  const hasHead = git(top, ['rev-parse', '--verify', '-q', 'HEAD']).status === 0;
  if (base) add(git(top, ['diff', '-z', '--name-only', '--diff-filter=ACMR', `${base}..HEAD`]).stdout);
  else add(git(top, ['ls-files', '-z']).stdout);
  if (hasHead) add(git(top, ['diff', '-z', '--name-only', '--diff-filter=ACMR', 'HEAD']).stdout);
  add(git(top, ['diff', '-z', '--name-only', '--cached', '--diff-filter=ACMR']).stdout);
  add(git(top, ['ls-files', '-z', '-o', '--exclude-standard']).stdout);
  const prefix = DOCS_ROOT + '/';
  return [...found].filter((p) => p !== DOCS_ROOT && !p.startsWith(prefix) && !isOwnFile(p) && fs.existsSync(path.join(top, ...p.split('/'))));
}

function readText(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

function frontmatterType(text) {
  const m = FRONTMATTER_RE.exec(text);
  if (!m) return null;
  const line = /^type:[ \t]*(.*?)[ \t]*\r?$/m.exec(m[1]);
  return line ? line[1].replace(/^(['"])(.*)\1$/, '$2') : null;
}

function firstHeading(text) {
  const body = text.replace(FRONTMATTER_RE, '');
  for (const l of body.split(/\r?\n/)) {
    if (l.trim() === '') continue;
    return l.trim();
  }
  return '';
}

function jsonlKind(text) {
  const rows = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (rows.length === 0) return null;
  let delivered = true;
  let log = true;
  for (const row of rows) {
    let o;
    try {
      o = JSON.parse(row);
    } catch {
      return null;
    }
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    if (!('ts' in o && 'id' in o && 'by' in o)) delivered = false;
    if (!('ts' in o && 'agent' in o && 'type' in o)) log = false;
    if (!delivered && !log) return null;
  }
  return delivered ? 'delivered' : 'log';
}

function featureFolderOf(rel) {
  const parts = rel.split('/');
  for (let i = 0; i < parts.length - 1; i++) if (FEATURE_DIR_RE.test(parts[i])) return i;
  return -1;
}

/**
 * Classify one file: null (leave it) or { kind, dest } with dest a posix path
 * relative to the docs root. Feature-folder members are decided by the caller.
 */
function classify(top, rel) {
  const base = rel.split('/').pop();
  const inFolder = featureFolderOf(rel) >= 0;
  if (base === 'delivered.jsonl') return { dest: DOCS_LAYOUT.delivered, jsonl: true };
  if (base === 'decisions.jsonl') return { dest: DOCS_LAYOUT.decisions, jsonl: true };
  const abs = path.join(top, ...rel.split('/'));
  if (base.endsWith('.jsonl')) {
    const text = readText(abs);
    const kind = text === null ? null : jsonlKind(text);
    if (!kind) return null;
    return { dest: kind === 'delivered' ? DOCS_LAYOUT.delivered : base, jsonl: true, inFolderOk: kind === 'log' };
  }
  if (!base.endsWith('.md')) return inFolder ? { dest: base, weak: true } : null;
  const text = readText(abs);
  if (text === null) return null;
  const type = frontmatterType(text);
  if (type && Object.prototype.hasOwnProperty.call(DOCS_LAYOUT.types, type) && (ID_LESS_TYPES.has(type) || hasFrontmatterId(text))) {
    const sub = DOCS_LAYOUT.types[type];
    if (sub !== null) return { dest: sub.endsWith('.md') ? sub : `${sub}/${base}` };
    // A feature-folder file (iterations, build-ledger, tasks) has no place of its own; its type
    // and its name together make it a Code Addiction file when it sits inside a feature folder.
    if (inFolder && base === `${type}.md` && FOLDER_FILE_TYPES.has(type)) return { dest: base };
    return inFolder ? { dest: base, weak: true } : null;
  }
  if (inFolder) {
    const head = firstHeading(text);
    if (base === 'build-ledger.md') return { dest: base };
    if (base === 'iterations.md' && head === '# Iterations') return { dest: base };
    if (base === 'tasks.md' && head.startsWith('# Tasks:')) return { dest: base };
  }
  const m = STAMPED_RE.exec(base);
  if (m) return { dest: `${m[1] ? DOCS_LAYOUT.brainstorm : DOCS_LAYOUT.features}/${base}` };
  return inFolder ? { dest: base, weak: true } : null;
}

function walk(absDir, out) {
  for (const e of fs.readdirSync(absDir, { withFileTypes: true })) {
    const p = path.join(absDir, e.name);
    if (e.isDirectory()) {
      if (e.name !== '.git' && e.name !== 'node_modules') walk(p, out);
    } else if (e.isFile()) out.push(p);
  }
}

function freeName(abs) {
  const ext = path.extname(abs);
  const stem = abs.slice(0, abs.length - ext.length);
  for (let i = 1; ; i++) {
    const next = `${stem}.${i}${ext}`;
    if (!fs.existsSync(next)) return next;
  }
}

function place(srcAbs, destAbs, jsonl) {
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  if (fs.existsSync(destAbs)) {
    const incoming = fs.readFileSync(srcAbs);
    if (jsonl) {
      const current = fs.readFileSync(destAbs, 'utf8');
      const sep = current === '' || current.endsWith('\n') ? '' : '\n';
      fs.appendFileSync(destAbs, sep + incoming.toString('utf8'));
    } else if (!incoming.equals(fs.readFileSync(destAbs))) {
      fs.copyFileSync(srcAbs, freeName(destAbs));
    }
  } else {
    fs.copyFileSync(srcAbs, destAbs);
  }
  fs.rmSync(srcAbs, { force: true });
}

function runDocsGuard(cwd, opts = {}) {
  const top = repoTop(cwd);
  const files = candidates(top, opts.main);

  // Phase 1: classify. Feature folders are decided as a unit.
  const moves = new Map(); // rel -> { dest, jsonl }
  const folders = new Map(); // folder rel -> qualifies
  for (const rel of files) {
    const c = classify(top, rel);
    const idx = featureFolderOf(rel);
    if (idx >= 0) {
      const folder = rel.split('/').slice(0, idx + 1).join('/');
      if (c && !c.weak) folders.set(folder, true);
      else if (!folders.has(folder)) folders.set(folder, false);
    } else if (c) {
      moves.set(rel, { dest: c.dest, jsonl: !!c.jsonl });
    }
  }
  for (const [folder, qualifies] of folders) {
    if (!qualifies) continue;
    const name = folder.split('/').pop();
    const all = [];
    walk(path.join(top, ...folder.split('/')), all);
    for (const abs of all) {
      const rel = toPosix(path.relative(top, abs));
      const inner = toPosix(path.relative(path.join(top, ...folder.split('/')), abs));
      const isJsonl = rel.endsWith('.jsonl');
      moves.set(rel, { dest: `${DOCS_LAYOUT.featureFolder}/${name}/${inner}`, jsonl: isJsonl });
    }
  }
  // Nested feature folders: an outer decision already moved the inner file.
  if (moves.size === 0) return { moved: 0, files: [] };

  const root = docsPath(top); // throws DOCS_ROOT_MISSING when the root is absent
  const moved = [];
  for (const [rel, m] of moves) {
    const srcAbs = path.join(top, ...rel.split('/'));
    if (!fs.existsSync(srcAbs)) continue;
    const tracked = git(top, ['ls-files', '-z', '--', rel]).stdout !== '';
    place(srcAbs, path.join(root, ...m.dest.split('/')), m.jsonl);
    if (tracked) git(top, ['rm', '--cached', '-q', '--ignore-unmatch', '--', rel]);
    moved.push(rel);
  }
  // Drop folders the move emptied (never the repository itself).
  for (const folder of folders.keys()) {
    const abs = path.join(top, ...folder.split('/'));
    try {
      pruneEmpty(abs);
    } catch {
      // a folder that still holds user files stays
    }
  }
  return { moved: moved.length, files: moved };
}

function pruneEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) pruneEmpty(path.join(dir, e.name));
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

if (require.main === module) {
  try {
    const res = runDocsGuard(process.cwd());
    process.stdout.write(res.moved > 0 ? `DOCS_GUARD=moved:${res.moved}\n` : 'DOCS_GUARD=clean\n');
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : err}\n`);
    process.exit(1);
  }
}

module.exports = { runDocsGuard };
