import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * docs-no-legacy — the zero-legacy guard (plan 0078F-docs-branch, L0).
 *
 * Every Code Addiction output lives under the docs root on the docs branch. No
 * tracked file may name the previous location, except the migrate command, its
 * test and its fixtures. This file is the one implementation of that rule;
 * there is no shell equivalent.
 *
 * ⛔ ITS PATTERNS ARE ASSEMBLED FROM FRAGMENTS so the file never matches itself,
 *    and it is not on the exemption list.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');

// ---- the exemption: exactly three paths (plan Global Constraints) ----------
const EXEMPT = [
  /^cli\/src\/docs-migrate\.js$/,
  /^cli\/tests\/docs-migrate\.test\.js$/,
  /^cli\/tests\/fixtures\/docs-migrate\//,
];

// ---- pattern fragments ------------------------------------------------------
const D = 'do' + 'cs';
const DOT_CODEADD = '\\.code' + 'add';
const OLD_DECISIONS = `${DOT_CODEADD}/project/decisions\\.jsonl`;

// L0 patterns. A hit on any one fails.
const PATTERNS = {
  // 1. slash form, any file — never `.codeadd/docs/`
  slash: new RegExp(`(?<![A-Za-z0-9_.-])(?<!${DOT_CODEADD}/)${D}/`, 'g'),
  // 2. the old decisions log, any file
  decisions: new RegExp(OLD_DECISIONS, 'g'),
  // 3. string-literal path element, code files only (applied below)
  literal: new RegExp(`['"]${D}['"]`, 'g'),
  // 4. pathspec form, any file
  pathspec: new RegExp(`exclude\\)${D}\\b`, 'g'),
};
const CODE_FILE = /\.(js|cjs|mjs|ts|json)$/;

// Closed normalisations (nothing may be added without a plan revision).
const URL_TOKEN = /https?:\/\/\S+/g;
// A: site routes — `/docs/` or `/pt-br/docs/` at a token start.
const SITE_ROUTE = new RegExp(`(?<=^|[\\s"'(\`])(/pt-br)?/${D}/`, 'gm');
// B: git branch-type prefix — the docs type letter + slash + [NNNN]D- | NNNND- | four digits and D-
const BRANCH_PREFIX = new RegExp(`${D}/(\\[NNNN\\]D-|NNNND-|[0-9]{4}D-)`, 'g');

// Explicit {file, regex} exclusions for the MCP corpus NAME and the rename
// tool's scope name (pattern 3 only). An exclusion that matches nothing fails.
// A line is about the MCP corpus NAME when it says so: a corpus, a CORPORA entry, a --corpus flag.
// Anything else on the line carrying a quoted path element still counts as a hit.
const CORPUS_LINE = new RegExp(`(corpus|CORPORA|--corpus|loadCorpus|resolveCorpus|serverInfo|probe\\()[^\\n]*['"]${D}['"]|['"]${D}['"][^\\n]*(corpus|CORPORA)|\\bname:\\s*['"]${D}['"]`, 'i');
const LITERAL_EXCLUSIONS = [
  { file: /^mcp\/(corpora|engine|server)\.mjs$/, regex: CORPUS_LINE },
  { file: /^cli\/src\/mcp-registration\.js$/, regex: CORPUS_LINE },
  { file: /^cli\/tests\/mcp-[a-z-]+\.test\.js$/, regex: CORPUS_LINE },
  { file: /^cli\/tests\/install\.e2e\.test\.js$/, regex: new RegExp(`loadCorpus\\(['"]${D}['"]`) },
  { file: /^scripts\/rename-product-artefacts\.js$/, regex: new RegExp(`['"]${D}['"]`) },
];

function normalise(text) {
  return text
    .replace(URL_TOKEN, (m) => ' '.repeat(m.length))
    .replace(SITE_ROUTE, (m) => ' '.repeat(m.length))
    .replace(BRANCH_PREFIX, (m) => ' '.repeat(m.length));
}

/** Scan one file's text. Returns [{ line, rule }] — `file` is attached by the caller. */
export function scanText(file, text, usedExclusions = new Set()) {
  const clean = normalise(text);
  const hits = [];
  const lineOf = (idx) => clean.slice(0, idx).split('\n').length;
  for (const [rule, re] of Object.entries(PATTERNS)) {
    if (rule === 'literal' && !CODE_FILE.test(file)) continue;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(clean)) !== null) {
      if (rule === 'literal') {
        const lineStart = clean.lastIndexOf('\n', m.index) + 1;
        const lineEnd = clean.indexOf('\n', m.index);
        const lineText = clean.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
        const idx = LITERAL_EXCLUSIONS.findIndex((e) => e.file.test(file) && e.regex.test(lineText));
        if (idx !== -1) {
          usedExclusions.add(idx);
          continue;
        }
      }
      hits.push({ line: lineOf(m.index), rule });
    }
  }
  return hits;
}

function trackedFiles() {
  const out = execFileSync('git', ['-c', 'safe.directory=*', 'ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\0').filter(Boolean);
}

function isText(buf) {
  return !buf.subarray(0, 8000).includes(0);
}

function scanTree(files, readFile) {
  const used = new Set();
  const hits = [];
  for (const file of files) {
    if (EXEMPT.some((re) => re.test(file))) continue;
    let buf;
    try {
      buf = readFile(file);
    } catch {
      continue;
    }
    if (!isText(buf)) continue;
    for (const h of scanText(file, buf.toString('utf8'), used)) hits.push(`${file}:${h.line} [${h.rule}]`);
  }
  return { hits, used };
}

describe('docs-no-legacy — tracked files', () => {
  it('no tracked file outside the three exempt paths names the previous docs location', () => {
    const files = trackedFiles();
    const { hits, used } = scanTree(files, (f) => fs.readFileSync(path.join(ROOT, f)));
    // Every code-file exclusion must still match something, so the list cannot go stale.
    const unused = LITERAL_EXCLUSIONS.map((e, i) => [e, i]).filter(([, i]) => !used.has(i));
    // Exclusions are only enforced once the tree is clean; before that the
    // hit list itself is the failure and is what the ledger counts (R10).
    if (hits.length === 0) {
      expect(unused.map(([e]) => String(e.file)), 'an exclusion matched nothing').toEqual([]);
    }
    expect(hits, `${hits.length} legacy docs-path hit(s):\n${hits.join('\n')}`).toEqual([]);
  });
});

describe('docs-no-legacy — built provider trees', () => {
  const TREES = [
    'framwork/.claude', 'framwork/.agents', 'framwork/.agent', 'framwork/.cursor', 'framwork/.opencode', 'framwork/.codex', 'framwork/.zcode',
    '.claude/commands', '.claude/skills', '.claude/agents', '.opencode', '.agents', '.codex',
  ];
  it('built output carries no previous docs location', () => {
    const files = [];
    const walk = (dir, rel) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        const r = `${rel}/${e.name}`;
        if (e.isDirectory()) walk(p, r);
        else if (/\.(md|toml|json|mdc|txt)$/.test(e.name)) files.push(r);
      }
    };
    for (const t of TREES) {
      const abs = path.join(ROOT, t);
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) walk(abs, t);
    }
    // Provider-tree files are never exempt and never code-file literal scans of corpus names.
    const { hits } = scanTree(files, (f) => fs.readFileSync(path.join(ROOT, f)));
    expect(hits, `${hits.length} legacy hit(s) in built trees:\n${hits.join('\n')}`).toEqual([]);
  });
});

describe('docs-no-legacy — self-check', () => {
  const plant = (name, body) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nolegacy-'));
    fs.writeFileSync(path.join(dir, name), body);
    const out = scanTree([name], (f) => fs.readFileSync(path.join(dir, f)));
    fs.rmSync(dir, { recursive: true, force: true });
    return out.hits;
  };

  it('reports a planted hit of each pattern', () => {
    expect(plant('a.md', `see ${D}/features/x\n`)).toHaveLength(1);
    expect(plant('b.md', `./${D}/x and \${root}/${D}/y\n`)).toHaveLength(2);
    expect(plant('c.md', `read ${'.codeadd/project/' + 'decisions.jsonl'}\n`)).toHaveLength(1);
    expect(plant('d.js', `path.join(root,\n  '${D}',\n  'x')\n`)).toHaveLength(1);
    expect(plant('e.md', `git ls-files ':(exclude)${D}'\n`)).toHaveLength(1);
  });

  it('does not report the docs root, URLs, site routes or the branch prefix', () => {
    expect(plant('f.md', `.codeadd/${D}/features/x\n`)).toEqual([]);
    expect(plant('g.md', `https://example.com/${D}/page\n`)).toEqual([]);
    expect(plant('h.md', `(/${D}/) and "/pt-br/${D}/x"\n`)).toEqual([]);
    expect(plant('i.md', `branch ${D}/0078D-name or ${D}/[NNNN]D-slug\n`)).toEqual([]);
  });

  it('a string literal in a non-code file is not pattern 3', () => {
    expect(plant('j.md', `the "${D}" corpus\n`)).toEqual([]);
  });

  it('a hit inside an exempt path is not reported', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nolegacy-'));
    fs.mkdirSync(path.join(dir, 'cli', 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'cli', 'src', 'docs-migrate.js'), `const x = '${D}/features';\n`);
    const { hits } = scanTree(['cli/src/docs-migrate.js'], (f) => fs.readFileSync(path.join(dir, f)));
    fs.rmSync(dir, { recursive: true, force: true });
    expect(hits).toEqual([]);
  });
});
