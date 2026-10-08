#!/usr/bin/env node
/**
 * test-loss-guard.cjs — Fail when a test name disappears from the branch without a note.
 *
 * Compares the test names of every tracked test file at a base ref and at a head ref, statically:
 * no test is run, nothing is read from the network, no file is written. Only committed trees are
 * read, so an uncommitted deletion in the working tree is invisible to it.
 *
 * Usage:
 *   node scripts/test-loss-guard.cjs [--base <ref>] [--head <ref>]
 *
 *   --base   default: `git merge-base origin/main HEAD`, or `main` when origin/main is absent.
 *            An explicit --base is used as given, not reduced to a merge-base.
 *   --head   default: HEAD.
 *
 * ⛔ THE SCRIPT NEVER FETCHES. A stale `origin/main` can make a test that `main` itself deleted read
 *    as lost. Callers run `git fetch origin main` first.
 *
 * What counts as a test: tracked files matching *.test.{cjs,js,mjs,ts,tsx} or *.spec.{js,ts},
 * outside node_modules. A name is the first argument of describe / it / test and of their .skip,
 * .only, .todo, .concurrent, .sequential and .failing forms. For `.each(TABLE)('name', fn)` it is the
 * first argument of the SECOND call. A string or template literal is compared by its inner text, so
 * a quote-style change is not a loss; any other expression is compared by its source text with
 * whitespace collapsed. Names are compared per file as a multiset: a duplicated name losing one copy
 * counts. A name is reported with the path it had at the base ref.
 *
 * A renamed file (git diff -M) carries its names to the new path. A name gone from one file that
 * appears, new, in another file at head is MOVED, not lost.
 *
 * The note is a commit trailer on any commit in base..head:
 *   Test-Removed: <path>::<name> — <reason>      one name
 *   Test-Removed: <path>::*                      a whole deleted file
 * `<name>` is the normalised name this script prints; the reason starts after the LAST ` — `.
 *
 * Output (KEY=VALUE, one per line), then one line per unnoted and per noted loss:
 *   GUARD=pass|fail  BASE=<sha>  TESTS_BASE=<n>  TESTS_HEAD=<n>  LOST=<n>  NOTED=<n>  MOVED=<n>
 *   LOST_TEST=<path>::<name>
 *   NOTED_TEST=<path>::<name>
 *
 * Exit codes:
 *   0 — pass
 *   1 — fail (at least one unnoted loss)
 *   2 — caller error (bad ref, not a git repository)
 *
 * Known limit: cases generated in a loop from data (for example scripts/tests/native-script-cases.json)
 * are invisible to a static read.
 *
 * Dependencies: Node built-ins and git. No shell.
 */
'use strict';
const { spawnSync } = require('node:child_process');

const TEST_FILE = /(?:\.test\.(?:cjs|js|mjs|ts|tsx)|\.spec\.(?:js|ts))$/;
const KEYWORDS = new Set(['describe', 'it', 'test']);
const MODIFIERS = new Set(['skip', 'only', 'todo', 'concurrent', 'sequential', 'failing']);
const CLOSER = { '(': ')', '[': ']', '{': '}' };

class CallerError extends Error {}

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8', shell: false, maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw new CallerError(`cannot run git: ${r.error.message}`);
  return r;
}
function gitOut(args, what) {
  const r = git(args);
  if (r.status !== 0) throw new CallerError(`${what}: ${(r.stderr || '').trim() || `git ${args[0]} exited ${r.status}`}`);
  return r.stdout;
}

// ---------------------------------------------------------------------------------------------
// Name extraction — a small scanner, not a parser. It understands comments, strings, template
// literals and regex literals well enough not to read a `test(` inside any of them.
// ---------------------------------------------------------------------------------------------
const isIdent = c => /[A-Za-z0-9_$]/.test(c);

function skipLine(s, i) { const e = s.indexOf('\n', i); return e < 0 ? s.length : e; }
function skipBlock(s, i) { const e = s.indexOf('*/', i + 2); return e < 0 ? s.length : e + 2; }
function skipQuoted(s, i) {
  const q = s[i];
  for (i++; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === q || s[i] === '\n') return i + 1;
  }
  return s.length;
}
function skipTemplate(s, i) {
  for (i++; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === '`') return i + 1;
    else if (s[i] === '$' && s[i + 1] === '{') i = scan(s, i + 2, '}');
  }
  return s.length;
}
function regexAllowed(s, i) {
  let j = i - 1;
  while (j >= 0 && /\s/.test(s[j])) j--;
  return j < 0 || '(,=:[!&|?{};+-*%<>~^'.includes(s[j]);
}
function skipRegex(s, i) {
  let inClass = false;
  for (i++; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') i++;
    else if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if ((c === '/' && !inClass) || c === '\n') return i + 1;
  }
  return s.length;
}
// Walk code from `i` until a character in `stops` at nesting depth 0. Returns its index (not
// consumed), or s.length. A bracket opened inside is skipped through its closer.
function scan(s, i, stops) {
  while (i < s.length) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') i = skipLine(s, i);
    else if (c === '/' && s[i + 1] === '*') i = skipBlock(s, i);
    else if (c === '"' || c === "'") i = skipQuoted(s, i);
    else if (c === '`') i = skipTemplate(s, i);
    else if (c === '/' && regexAllowed(s, i)) i = skipRegex(s, i);
    else if (CLOSER[c] && !stops.includes(c)) i = scan(s, i + 1, CLOSER[c]) + 1;
    else if (stops.includes(c)) return i;
    else i++;
  }
  return s.length;
}
function skipSpace(s, i) {
  for (;;) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s[i] === '/' && s[i + 1] === '/') i = skipLine(s, i);
    else if (s[i] === '/' && s[i + 1] === '*') i = skipBlock(s, i);
    else return i;
  }
}
function normalise(argText) {
  const t = argText.trim();
  const q = t[0];
  if ((q === "'" || q === '"' || q === '`') && t.length >= 2 && t[t.length - 1] === q) {
    const end = q === '`' ? skipTemplate(t, 0) : skipQuoted(t, 0);
    if (end === t.length) return t.slice(1, -1).replace(/\\(['"`])/g, '$1');
  }
  return t.replace(/\s+/g, ' ');
}

function extractNames(s) {
  const names = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') { i = skipLine(s, i); continue; }
    if (c === '/' && s[i + 1] === '*') { i = skipBlock(s, i); continue; }
    if (c === '"' || c === "'") { i = skipQuoted(s, i); continue; }
    if (c === '`') { i = skipTemplate(s, i); continue; }
    if (c === '/' && regexAllowed(s, i)) { i = skipRegex(s, i); continue; }
    if (!/[A-Za-z_$]/.test(c)) { i++; continue; }
    let e = i;
    while (e < s.length && isIdent(s[e])) e++;
    const word = s.slice(i, e);
    let prev = i - 1;
    while (prev >= 0 && /\s/.test(s[prev])) prev--;
    const member = prev >= 0 && s[prev] === '.';
    const start = i;
    i = e;
    if (member || !KEYWORDS.has(word)) continue;
    let j = skipSpace(s, e);
    let each = false;
    while (s[j] === '.') {
      let k = skipSpace(s, j + 1);
      let m = k;
      while (m < s.length && isIdent(s[m])) m++;
      const part = s.slice(k, m);
      if (part === 'each') each = true;
      else if (!MODIFIERS.has(part)) { j = -1; break; }
      j = skipSpace(s, m);
      if (each) break;
    }
    if (j < 0) continue;
    if (each) {
      if (s[j] === '(') j = skipSpace(s, scan(s, j + 1, ')') + 1);
      else if (s[j] === '`') j = skipSpace(s, skipTemplate(s, j));
      else continue;
    }
    if (s[j] !== '(') continue;
    const argStart = j + 1;
    const argEnd = scan(s, argStart, ',)');
    names.push(normalise(s.slice(argStart, argEnd)));
    i = Math.max(i, start + word.length);
  }
  return names;
}

// ---------------------------------------------------------------------------------------------
// Git side
// ---------------------------------------------------------------------------------------------
function revParse(ref, label) {
  const r = git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  if (r.status !== 0) throw new CallerError(`${label} ref does not resolve: ${ref}`);
  return r.stdout.trim();
}
function hasRef(ref) { return git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status === 0; }

function testFilesAt(sha) {
  return gitOut(['ls-tree', '-r', '--name-only', sha], 'ls-tree').split('\n')
    .filter(p => p && TEST_FILE.test(p) && !p.split('/').includes('node_modules'));
}
function namesOf(sha, file) {
  const r = git(['show', `${sha}:${file}`]);
  if (r.status !== 0) return new Map();
  const map = new Map();
  for (const name of extractNames(r.stdout)) map.set(name, (map.get(name) || 0) + 1);
  return map;
}
const total = maps => [...maps.values()].reduce((a, m) => a + [...m.values()].reduce((x, y) => x + y, 0), 0);

function parseArgs(argv) {
  const opts = { base: null, head: 'HEAD' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base' || argv[i] === '--head') {
      if (!argv[i + 1]) throw new CallerError(`${argv[i]} needs a ref`);
      opts[argv[i].slice(2)] = argv[++i];
    } else throw new CallerError(`unknown argument: ${argv[i]}`);
  }
  return opts;
}

function run(argv) {
  const opts = parseArgs(argv);
  if (git(['rev-parse', '--git-dir']).status !== 0) throw new CallerError('not a git repository');
  const head = revParse(opts.head, 'head');
  let base;
  if (opts.base) base = revParse(opts.base, 'base');
  else {
    const main = ['origin/main', 'main'].find(hasRef);
    if (!main) throw new CallerError('neither origin/main nor main exists; pass --base');
    base = gitOut(['merge-base', main, head], 'merge-base').trim();
  }

  // path at base -> path at head, for renames
  const renamed = new Map();
  for (const line of gitOut(['diff', '-M', '--name-status', base, head], 'diff').split('\n')) {
    const [status, from, to] = line.split('\t');
    if (status && status[0] === 'R' && to) renamed.set(from, to);
  }

  const baseFiles = testFilesAt(base);
  const headFiles = testFilesAt(head);
  const baseNames = new Map(baseFiles.map(f => [f, namesOf(base, f)]));
  const headNames = new Map(headFiles.map(f => [f, namesOf(head, f)]));

  const lost = [];                    // { file, name } one entry per lost instance
  const counterpart = new Set();      // head files that have a base counterpart
  for (const [file, names] of baseNames) {
    const target = renamed.get(file) || file;
    counterpart.add(target);
    const now = headNames.get(target) || new Map();
    for (const [name, count] of names) {
      for (let k = now.get(name) || 0; k < count; k++) lost.push({ file, name });
    }
  }

  // Names that are new at head, anywhere: the pool a lost name can have moved into.
  const gained = new Map();
  for (const [file, names] of headNames) {
    const sourceFile = [...renamed].find(([, to]) => to === file)?.[0] ?? file;
    const before = baseNames.get(sourceFile) || new Map();
    for (const [name, count] of names) {
      const extra = count - (before.get(name) || 0);
      if (extra > 0) gained.set(name, (gained.get(name) || 0) + extra);
    }
  }
  let moved = 0;
  const unmoved = [];
  for (const entry of lost) {
    const pool = gained.get(entry.name) || 0;
    if (pool > 0) { gained.set(entry.name, pool - 1); moved++; } else unmoved.push(entry);
  }

  const trailers = gitOut(['log', `${base}..${head}`, '--format=%(trailers:key=Test-Removed,valueonly)'], 'log')
    .split('\n').map(l => l.trim()).filter(Boolean)
    .map(v => { const cut = v.lastIndexOf(' — '); return cut < 0 ? v : v.slice(0, cut); });
  const covered = ({ file, name }) => trailers.includes(`${file}::${name}`) || trailers.includes(`${file}::*`);

  const unnoted = unmoved.filter(e => !covered(e));
  const noted = unmoved.filter(covered);
  const out = [
    `GUARD=${unnoted.length ? 'fail' : 'pass'}`,
    `BASE=${base}`,
    `TESTS_BASE=${total(baseNames)}`,
    `TESTS_HEAD=${total(headNames)}`,
    `LOST=${unnoted.length}`,
    `NOTED=${noted.length}`,
    `MOVED=${moved}`,
    ...unnoted.map(e => `LOST_TEST=${e.file}::${e.name}`),
    ...noted.map(e => `NOTED_TEST=${e.file}::${e.name}`),
  ];
  console.log(out.join('\n'));
  return unnoted.length ? 1 : 0;
}

module.exports = { extractNames, run };

if (require.main === module) {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof CallerError)) throw error;
    console.error(`test-loss-guard: ${error.message}`);
    process.exitCode = 2;
  }
}
