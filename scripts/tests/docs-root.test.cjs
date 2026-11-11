'use strict';
// =============================================================================
// docs-root.test.cjs — the single owner of the docs root (plan 0078F, F2).
// Target: framwork/.codeadd/scripts/docs-root.cjs
// Run: node --test scripts/tests/docs-root.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const h = require('./helpers.cjs');

const mod = require(path.join(h.SCRIPTS_DIR, 'docs-root.cjs'));

function repo(t) {
  const dir = fs.realpathSync(h.mkTmp('codeadd-docsroot-'));
  t.after(() => h.rmrf(dir));
  h.git(dir, ['init', '-q']);
  return dir;
}

test('constants are the literals the plan fixes', () => {
  assert.equal(mod.DOCS_ROOT, '.codeadd/docs');
  assert.equal(mod.DOCS_BRANCH, 'codeadd-docs');
  assert.equal(mod.DOC_SCHEMA_VERSION, 1);
  assert.equal(mod.DOCS_LAYOUT.delivered, 'delivered.jsonl');
  assert.equal(mod.DOCS_LAYOUT.decisions, 'decisions.jsonl');
  assert.equal(mod.DOCS_LAYOUT.features, 'features');
});

test('docsPath resolves under <toplevel>/.codeadd/docs from a subdirectory', (t) => {
  const dir = repo(t);
  fs.mkdirSync(path.join(dir, ...mod.DOCS_ROOT.split('/')), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src', 'deep'), { recursive: true });
  assert.equal(mod.docsPath(path.join(dir, 'src', 'deep'), 'features'), path.join(dir, ...mod.DOCS_ROOT.split('/'), 'features'));
  assert.equal(mod.docsPath(dir), path.join(dir, ...mod.DOCS_ROOT.split('/')));
});

test('docsPath resolves through a linked code worktree', (t) => {
  const dir = repo(t);
  h.git(dir, ['-c', 'user.email=a@b.c', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'x']);
  const wt = path.join(dir, '.worktrees', 'feat');
  h.git(dir, ['worktree', 'add', '-q', '-b', 'feat/x', wt]);
  fs.mkdirSync(path.join(wt, ...mod.DOCS_ROOT.split('/')), { recursive: true });
  assert.equal(mod.docsPath(wt, 'features'), path.join(fs.realpathSync(wt), ...mod.DOCS_ROOT.split('/'), 'features'));
});

test('an absent root throws DOCS_ROOT_MISSING and never names another location', (t) => {
  const dir = repo(t);
  assert.throws(
    () => mod.docsPath(dir, 'features'),
    (err) => err.code === 'DOCS_ROOT_MISSING' && /DOCS_ROOT_MISSING: run \.codeadd\/scripts\/docs-branch\.cjs prepare/.test(err.message),
  );
});

test('Windows separators in segments resolve the same as posix ones', (t) => {
  const dir = repo(t);
  fs.mkdirSync(path.join(dir, ...mod.DOCS_ROOT.split('/')), { recursive: true });
  assert.equal(mod.docsPath(dir, 'features\\0001F-x\\about.md'), mod.docsPath(dir, 'features', '0001F-x', 'about.md'));
  assert.equal(mod.toPosix('.codeadd\\docs\\features'), '.codeadd/docs/features');
});

test('docSchemaOf: 1 for schema: 1; 0 for none, missing key and non-integer', () => {
  assert.equal(mod.docSchemaOf('---\nid: a\nschema: 1\n---\n# x\n'), 1);
  assert.equal(mod.docSchemaOf('---\r\nid: a\r\nschema: 2\r\n---\r\n'), 2);
  assert.equal(mod.docSchemaOf('---\nschema: "3"\n---\n'), 3);
  assert.equal(mod.docSchemaOf('# no frontmatter\nschema: 1\n'), 0);
  assert.equal(mod.docSchemaOf('---\nid: a\n---\n# x\n'), 0);
  assert.equal(mod.docSchemaOf('---\nschema: one\n---\n'), 0);
  assert.equal(mod.docSchemaOf('---\nschema: 1.5\n---\n'), 0);
  assert.equal(mod.docSchemaOf(''), 0);
  assert.equal(mod.docSchemaOf(undefined), 0);
});

test('every layout type maps to a sub-path or null', () => {
  for (const [type, sub] of Object.entries(mod.DOCS_LAYOUT.types)) {
    assert.ok(sub === null || typeof sub === 'string', type);
  }
});
