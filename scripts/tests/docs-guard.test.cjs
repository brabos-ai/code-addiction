'use strict';
// docs-guard.cjs — moves misplaced Code Addiction outputs into the docs root.
// Built-ins only; every fixture is a temp git repository; nothing runs a shell.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeRepo, runScript, write, read, SCRIPTS_DIR, REPO_ROOT } = require('./helpers.cjs');

const { DOCS_ROOT, DOCS_LAYOUT } = require(path.join(SCRIPTS_DIR, 'docs-root.cjs'));
const ROOT_PARTS = DOCS_ROOT.split('/');

function fixture() {
  const r = makeRepo();
  fs.mkdirSync(path.join(r.repo, ...ROOT_PARTS), { recursive: true });
  return r;
}
const inRoot = (r, ...p) => path.join(r.repo, ...ROOT_PARTS, ...p);
const inCode = (r, ...p) => path.join(r.repo, ...p);
const guard = (r) => runScript('docs-guard', [], { cwd: r.repo });
const typed = (type, extra = '') => `---\ntype: ${type}\n${extra}---\n\n# Title\n`;

test('every typed doc with a sub-path lands in the place of its type', () => {
  const r = fixture();
  try {
    const entries = Object.entries(DOCS_LAYOUT.types).filter(([, sub]) => sub !== null);
    for (const [type] of entries) write(inCode(r, 'somewhere', `${type}.md`), typed(type));
    const out = guard(r);
    assert.equal(out.status, 0);
    assert.equal(out.stdout.trim(), `DOCS_GUARD=moved:${entries.length}`);
    for (const [type, sub] of entries) {
      assert.ok(fs.existsSync(inRoot(r, ...sub.split('/'), `${type}.md`)), type);
      assert.ok(!fs.existsSync(inCode(r, 'somewhere', `${type}.md`)), type);
    }
  } finally { r.cleanup(); }
});

test('types mapped to null (wiki pages) stay put', () => {
  const r = fixture();
  try {
    write(inCode(r, 'wiki', 'a.md'), typed('tutorial'));
    assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=clean');
    assert.ok(fs.existsSync(inCode(r, 'wiki', 'a.md')));
  } finally { r.cleanup(); }
});

for (const stamped of [false, true]) {
  test(`feature-folder tasks.md and iterations.md move (frontmatter: ${stamped})`, () => {
    const r = fixture();
    try {
      const fm = (t) => (stamped ? `---\ntype: ${t}\nschema: 1\n---\n\n` : '');
      const dir = path.join('x', '0042F-thing');
      write(inCode(r, dir, 'tasks.md'), `${fm('tasks')}# Tasks: thing\n- [ ] a\n`);
      write(inCode(r, dir, 'iterations.md'), `${fm('iterations')}# Iterations\n`);
      write(inCode(r, dir, 'build-ledger.md'), 'ledger\n');
      const out = guard(r);
      assert.equal(out.stdout.trim(), 'DOCS_GUARD=moved:3');
      for (const f of ['tasks.md', 'iterations.md', 'build-ledger.md']) {
        assert.ok(fs.existsSync(inRoot(r, 'features', '0042F-thing', f)), f);
        assert.ok(!fs.existsSync(inCode(r, dir, f)), f);
      }
    } finally { r.cleanup(); }
  });
}

test('tasks.md or iterations.md with another header outside a feature folder stay', () => {
  const r = fixture();
  try {
    write(inCode(r, 'notes', 'tasks.md'), '# My todo\n');
    write(inCode(r, 'notes', 'iterations.md'), '# Iterations\n');
    assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=clean');
    assert.ok(fs.existsSync(inCode(r, 'notes', 'tasks.md')));
  } finally { r.cleanup(); }
});

test('delivered.jsonl line moves to its root name, with and without v', () => {
  for (const v of ['"v":1,', '']) {
    const r = fixture();
    try {
      write(inCode(r, 'old', 'delivered.jsonl'), `{${v}"ts":"2026-01-01T00:00:00Z","id":"0001F","by":"me"}\n`);
      assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=moved:1');
      assert.match(read(inRoot(r, DOCS_LAYOUT.delivered)), /"id":"0001F"/);
      assert.ok(!fs.existsSync(inCode(r, 'old', 'delivered.jsonl')));
    } finally { r.cleanup(); }
  }
});

test('an oddly named JSONL with the delivered signature merges into delivered.jsonl', () => {
  for (const v of ['"v":1,', '']) {
    const r = fixture();
    try {
      write(inCode(r, 'idx.jsonl'), `{${v}"ts":"t","id":"0002F","by":"me"}\n`);
      assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=moved:1');
      assert.match(read(inRoot(r, DOCS_LAYOUT.delivered)), /0002F/);
    } finally { r.cleanup(); }
  }
});

test('decisions.jsonl moves to its root name; log-jsonl signature moves too', () => {
  const r = fixture();
  try {
    write(inCode(r, 'a', 'decisions.jsonl'), '{"d":1}\n');
    write(inCode(r, 'a', 'log.jsonl'), '{"ts":"t","agent":"x","type":"y"}\n');
    assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=moved:2');
    assert.ok(fs.existsSync(inRoot(r, DOCS_LAYOUT.decisions)));
    assert.ok(fs.existsSync(inRoot(r, 'log.jsonl')));
  } finally { r.cleanup(); }
});

test('timestamped names move; intent goes with brainstorm', () => {
  const r = fixture();
  try {
    write(inCode(r, 'p', '2026-11-11T121728-thing-intent.md'), 'x\n');
    assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=moved:1');
    assert.ok(fs.existsSync(inRoot(r, DOCS_LAYOUT.brainstorm, '2026-11-11T121728-thing-intent.md')));
  } finally { r.cleanup(); }
});

test('a user doc with no type stays, and so does a file already under the docs root', () => {
  const r = fixture();
  try {
    write(inCode(r, 'guide.md'), '# Guide\n');
    write(inCode(r, 'data.jsonl'), '{"a":1}\n');
    write(inRoot(r, 'features', '0001F-x', 'tasks.md'), '# Tasks: x\n');
    const out = guard(r);
    assert.equal(out.stdout.trim(), 'DOCS_GUARD=clean');
    assert.ok(fs.existsSync(inCode(r, 'guide.md')));
    assert.ok(fs.existsSync(inCode(r, 'data.jsonl')));
    assert.ok(fs.existsSync(inRoot(r, 'features', '0001F-x', 'tasks.md')));
  } finally { r.cleanup(); }
});

test('idempotent, silent, and the code index forgets a moved tracked file', () => {
  const r = fixture();
  try {
    r.git('checkout', '-q', '-b', 'feat/y');
    write(inCode(r, 'f', 'feat.md'), typed('feature'));
    r.git('add', 'f/feat.md');
    r.git('commit', '-q', '-m', 'add');
    const first = guard(r);
    assert.equal(first.stdout, 'DOCS_GUARD=moved:1\n');
    assert.equal(first.stderr, '');
    assert.equal(r.git('ls-files', 'f/feat.md').stdout.trim(), '');
    assert.ok(fs.existsSync(inRoot(r, 'features', 'feat.md')));
    const second = guard(r);
    assert.equal(second.stdout, 'DOCS_GUARD=clean\n');
    assert.equal(second.stderr, '');
  } finally { r.cleanup(); }
});

test('files committed on a branch since the merge base are found', () => {
  const r = fixture();
  try {
    r.git('checkout', '-q', '-b', 'feat/x');
    write(inCode(r, 'feat.md'), typed('prd'));
    r.git('add', 'feat.md');
    r.git('commit', '-q', '-m', 'add');
    assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=moved:1');
    assert.ok(fs.existsSync(inRoot(r, 'features', 'feat.md')));
  } finally { r.cleanup(); }
});

test('absent docs root with a hit is an explicit error; without a hit it is clean', () => {
  const r = makeRepo();
  try {
    assert.equal(guard(r).stdout.trim(), 'DOCS_GUARD=clean');
    write(inCode(r, 'a.md'), typed('feature'));
    const out = guard(r);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /DOCS_ROOT_MISSING/);
    assert.ok(fs.existsSync(inCode(r, 'a.md')));
  } finally { r.cleanup(); }
});

test('DOCS_LAYOUT.types keys equal the type names registered in mcp/types.mjs', () => {
  const src = read(path.join(REPO_ROOT, 'mcp', 'types.mjs'));
  const start = src.indexOf('export const TYPES = {');
  assert.ok(start >= 0);
  const rest = src.slice(start + 'export const TYPES = {'.length);
  const body = rest.slice(0, rest.search(/^\};/m));
  const keys = [];
  // a top-level key sits at two-space indent and opens an object literal
  for (const m of body.matchAll(/^ {2}(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:\s*\{/gm)) {
    keys.push(m[1] || m[2] || m[3]);
  }
  assert.ok(keys.length > 0);
  assert.deepEqual([...keys].sort(), Object.keys(DOCS_LAYOUT.types).sort());
});

test('the guard source never names a legacy docs directory', () => {
  const src = read(path.join(SCRIPTS_DIR, 'docs-guard.cjs'));
  assert.ok(!/['"`]docs['"`]/.test(src));
  assert.ok(!/docs\/(features|delivered|plans)/.test(src));
});
