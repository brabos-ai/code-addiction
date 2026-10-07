'use strict';
// =============================================================================
// get-branch-metadata.test.cjs — native port of framwork/.codeadd/scripts/
// tests/get-branch-metadata.bats (13 cases, get-branch-metadata#001…#013).
// Target entry: framwork/.codeadd/scripts/get-branch-metadata.cjs.
//
// Contract: emits BRANCH_NAME, BRANCH_PREFIX, BRANCH_TYPE, COMMIT_TYPE,
// FEATURE_ID, FEATURE_SLUG, DOCS_DIR as KEY=VALUE lines; always exit 0.
//
// Run: node --test scripts/tests/get-branch-metadata.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers.cjs');

/** Run with a branch argument in a throwaway cwd; return the parsed KV map. */
function run(arg, t) {
  const dir = h.mkTmp('codeadd-gbm-');
  t.after(() => h.rmrf(dir));
  const res = h.runScript('get-branch-metadata', arg === undefined ? [] : [arg], { cwd: dir });
  assert.equal(res.status, 0, `expected exit 0\n${res.output}`);
  return h.parseKV(res.stdout);
}

// ─── Standard branch types ───────────────────────────────────────────

test('get-branch-metadata#001 feature/0001F-test → feature, feat, slug, docs_dir', (t) => {
  const kv = run('feature/0001F-test', t);
  assert.equal(kv.BRANCH_NAME, 'feature/0001F-test');
  assert.equal(kv.BRANCH_PREFIX, 'feature');
  assert.equal(kv.BRANCH_TYPE, 'feature');
  assert.equal(kv.COMMIT_TYPE, 'feat');
  assert.equal(kv.FEATURE_ID, '0001F');
  assert.equal(kv.FEATURE_SLUG, '0001F-test');
  assert.equal(kv.DOCS_DIR, 'docs/features/0001F-test');
});

test('get-branch-metadata#002 fix/0001H-bugfix → fix, fix', (t) => {
  const kv = run('fix/0001H-bugfix', t);
  assert.equal(kv.BRANCH_PREFIX, 'fix');
  assert.equal(kv.BRANCH_TYPE, 'fix');
  assert.equal(kv.COMMIT_TYPE, 'fix');
  assert.equal(kv.FEATURE_ID, '0001H');
  assert.equal(kv.FEATURE_SLUG, '0001H-bugfix');
  assert.equal(kv.DOCS_DIR, 'docs/features/0001H-bugfix');
});

test('get-branch-metadata#003 hotfix/0002H-urgent → hotfix, hotfix', (t) => {
  const kv = run('hotfix/0002H-urgent', t);
  assert.equal(kv.BRANCH_TYPE, 'hotfix');
  // hotfix has no dedicated commit case, so COMMIT_TYPE mirrors the prefix.
  assert.equal(kv.COMMIT_TYPE, 'hotfix');
  assert.equal(kv.FEATURE_ID, '0002H');
  assert.equal(kv.FEATURE_SLUG, '0002H-urgent');
  assert.equal(kv.DOCS_DIR, 'docs/features/0002H-urgent');
});

// ─── Generic prefixes ────────────────────────────────────────────────

test('get-branch-metadata#004 refactor/0002R-cleanup → refactor, refactor', (t) => {
  const kv = run('refactor/0002R-cleanup', t);
  assert.equal(kv.BRANCH_TYPE, 'refactor');
  assert.equal(kv.COMMIT_TYPE, 'refactor');
  assert.equal(kv.FEATURE_ID, '0002R');
  assert.equal(kv.FEATURE_SLUG, '0002R-cleanup');
  assert.equal(kv.DOCS_DIR, 'docs/features/0002R-cleanup');
});

test('get-branch-metadata#005 chore/0003C-deps → chore, chore', (t) => {
  const kv = run('chore/0003C-deps', t);
  assert.equal(kv.BRANCH_TYPE, 'chore');
  assert.equal(kv.COMMIT_TYPE, 'chore');
  assert.equal(kv.FEATURE_ID, '0003C');
  assert.equal(kv.FEATURE_SLUG, '0003C-deps');
  assert.equal(kv.DOCS_DIR, 'docs/features/0003C-deps');
});

test('get-branch-metadata#006 docs/0004D-readme → docs, docs', (t) => {
  const kv = run('docs/0004D-readme', t);
  assert.equal(kv.BRANCH_TYPE, 'docs');
  assert.equal(kv.COMMIT_TYPE, 'docs');
  assert.equal(kv.FEATURE_ID, '0004D');
  assert.equal(kv.FEATURE_SLUG, '0004D-readme');
  assert.equal(kv.DOCS_DIR, 'docs/features/0004D-readme');
});

test('get-branch-metadata#007 perf/0005F-optimize → perf, perf', (t) => {
  const kv = run('perf/0005F-optimize', t);
  assert.equal(kv.BRANCH_TYPE, 'perf');
  assert.equal(kv.COMMIT_TYPE, 'perf');
  assert.equal(kv.FEATURE_ID, '0005F');
  assert.equal(kv.FEATURE_SLUG, '0005F-optimize');
  assert.equal(kv.DOCS_DIR, 'docs/features/0005F-optimize');
});

test('get-branch-metadata#008 test/0006F-coverage → test, test', (t) => {
  const kv = run('test/0006F-coverage', t);
  assert.equal(kv.BRANCH_TYPE, 'test');
  assert.equal(kv.COMMIT_TYPE, 'test');
  assert.equal(kv.FEATURE_ID, '0006F');
  assert.equal(kv.FEATURE_SLUG, '0006F-coverage');
  assert.equal(kv.DOCS_DIR, 'docs/features/0006F-coverage');
});

test('get-branch-metadata#009 custom/0007F-whatever → custom (generic fallback)', (t) => {
  const kv = run('custom/0007F-whatever', t);
  assert.equal(kv.BRANCH_PREFIX, 'custom');
  assert.equal(kv.BRANCH_TYPE, 'custom');
  assert.equal(kv.COMMIT_TYPE, 'custom');
  assert.equal(kv.FEATURE_ID, '0007F');
  assert.equal(kv.FEATURE_SLUG, '0007F-whatever');
  assert.equal(kv.DOCS_DIR, 'docs/features/0007F-whatever');
});

// ─── Branches without ID (exit 0, empty fields) ─────────────────────

test('get-branch-metadata#010 main → BRANCH_TYPE=main, empty ID/slug/docs', (t) => {
  const kv = run('main', t);
  assert.equal(kv.BRANCH_NAME, 'main');
  assert.equal(kv.BRANCH_PREFIX, 'main');
  assert.equal(kv.BRANCH_TYPE, 'main');
  assert.equal(kv.COMMIT_TYPE, '');
  assert.equal(kv.FEATURE_ID, '');
  assert.equal(kv.FEATURE_SLUG, '');
  assert.equal(kv.DOCS_DIR, '');
});

test('get-branch-metadata#011 master → BRANCH_TYPE=main', (t) => {
  const kv = run('master', t);
  assert.equal(kv.BRANCH_TYPE, 'main');
  assert.equal(kv.FEATURE_ID, '');
});

test('get-branch-metadata#012 random-branch → BRANCH_TYPE=other', (t) => {
  const kv = run('random-branch', t);
  assert.equal(kv.BRANCH_PREFIX, 'random-branch');
  assert.equal(kv.BRANCH_TYPE, 'other');
  // "other" opts into the commit-type case, which falls through to the prefix.
  assert.equal(kv.COMMIT_TYPE, 'random-branch');
  assert.equal(kv.FEATURE_ID, '');
  assert.equal(kv.FEATURE_SLUG, '');
  assert.equal(kv.DOCS_DIR, '');
});

// ─── Detached HEAD ───────────────────────────────────────────────────

test('get-branch-metadata#013 detached HEAD → exit 0, all empty', (t) => {
  const r = h.makeRepo({ prefix: 'codeadd-gbm-det-' });
  t.after(r.cleanup);
  assert.equal(r.git('checkout', '--detach', '-q').status, 0);
  const res = h.runScript('get-branch-metadata', [], { cwd: r.repo });
  assert.equal(res.status, 0);
  const kv = h.parseKV(res.stdout);
  assert.equal(kv.BRANCH_NAME, "'(detached)'");
  assert.equal(kv.BRANCH_TYPE, 'detached');
  assert.equal(kv.COMMIT_TYPE, '');
  assert.equal(kv.FEATURE_ID, '');
  assert.equal(kv.FEATURE_SLUG, '');
  assert.equal(kv.DOCS_DIR, '');
});
