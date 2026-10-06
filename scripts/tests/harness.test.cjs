'use strict';
// =============================================================================
// HARNESS SELF-TESTS (F1)
// =============================================================================
// F1's passing gate. It proves the harness works and the case map is intact —
// NOT that the migration is complete. The intentionally-Red end-state
// assertions live in migration-acceptance.test.cjs and are recorded as Red in
// the ledger; a green run here never claims final-state acceptance.
//
// Run: node --test scripts/tests/harness.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

test('cleanEnv clears the injected NODE_OPTIONS and locks git', () => {
  const env = h.cleanEnv({ EXTRA: '1' });
  assert.equal(env.NODE_OPTIONS, '');
  assert.equal(env.GIT_OPTIONAL_LOCKS, '0');
  assert.equal(env.EXTRA, '1');
});

test('mkTmp creates a directory and rmrf removes it', () => {
  const dir = h.mkTmp('codeadd-harness-');
  assert.ok(fs.statSync(dir).isDirectory());
  h.rmrf(dir);
  assert.equal(fs.existsSync(dir), false);
});

test('makeRepo creates a clean main repository with one commit', () => {
  const { repo, git, cleanup } = h.makeRepo();
  try {
    const branch = git('branch', '--show-current');
    assert.equal(branch.status, 0);
    assert.equal(branch.stdout.trim(), 'main');
    const count = git('rev-list', '--count', 'HEAD');
    assert.equal(count.stdout.trim(), '1');
    const dirty = git('status', '--porcelain');
    assert.equal(dirty.stdout.trim(), '');
  } finally {
    cleanup();
  }
});

test('runNode executes a Node entry without a shell and records the exit', () => {
  const ok = h.runNode(['-e', "process.stdout.write('hello')"]);
  assert.equal(ok.error, null);
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout, 'hello');

  const bad = h.runNode(['-e', "process.stderr.write('boom'); process.exit(3)"]);
  assert.equal(bad.status, 3);
  assert.equal(bad.stderr, 'boom');
});

test('runNode gives the child a clean environment', () => {
  // The harness sets NODE_OPTIONS to the empty string, so the injected
  // debugger bootloader cannot print onto a child's stdout.
  const res = h.runNode(['-e', 'process.stdout.write(String(process.env.NODE_OPTIONS))']);
  assert.equal(res.stdout, '');
});

test('runNode runs with an explicit cwd', () => {
  const dir = h.mkTmp('codeadd-cwd-');
  try {
    const res = h.runNode(['-e', 'process.stdout.write(process.cwd())'], { cwd: dir });
    // Windows may return the 8.3 form; compare real paths.
    assert.equal(fs.realpathSync(res.stdout.trim()), fs.realpathSync(dir));
  } finally {
    h.rmrf(dir);
  }
});

test('parseKV reads KEY=VALUE lines, ignores JSONL, last occurrence wins', () => {
  const out = h.parseKV('A=1\r\n{"id":"x"}\nB=two\nA=3\nnot a kv line\n');
  assert.deepEqual(out, { A: '3', B: 'two' });
});

test('stripAnsi removes colour codes', () => {
  assert.equal(h.stripAnsi('\u001b[0;32mOK\u001b[0m'), 'OK');
});

test('readJsonl parses objects and tolerates an absent file', () => {
  const dir = h.mkTmp('codeadd-jsonl-');
  try {
    const p = path.join(dir, 'a.jsonl');
    h.write(p, '{"a":1}\n\n{"b":2}\n');
    assert.deepEqual(h.readJsonl(p), [{ a: 1 }, { b: 2 }]);
    assert.deepEqual(h.readJsonl(path.join(dir, 'missing.jsonl')), []);
  } finally {
    h.rmrf(dir);
  }
});

test('the case map has the expected shape', () => {
  const map = h.loadCaseMap();
  assert.equal(map.version, 1);
  assert.equal(map.baseline.shippedShellEntries, 19);
  assert.equal(map.baseline.rootShellEntries, 3);
  assert.equal(map.baseline.batsSuites, 19);
  assert.equal(map.scripts.length, 24);
  for (const s of map.scripts) {
    assert.equal(typeof s.name, 'string', 'script name');
    assert.equal(typeof s.source, 'string', `${s.name} source`);
    assert.ok(['product', 'internal'].includes(s.layer), `${s.name} layer`);
    assert.equal(typeof s.nativeTest, 'string', `${s.name} nativeTest`);
    assert.ok(Array.isArray(s.cases), `${s.name} cases`);
  }
});

test('every case from every suite is accounted for exactly once', () => {
  const map = h.loadCaseMap();
  const ids = h.allCaseIds();
  assert.equal(ids.length, map.baseline.batsCases);
  assert.equal(new Set(ids).size, ids.length, 'case ids are unique');
  const withCases = map.scripts.filter((s) => s.hasDedicatedSuite).length;
  assert.equal(withCases, map.baseline.batsSuites);
});

test('scripts with no dedicated suite are named, not implied', () => {
  assert.deepEqual(h.missingSuiteNames().sort(), [
    'create-release-tag',
    'migrate-ids',
    'next-id',
    'release',
    'smoke-test',
  ]);
  // Two of them are the uncertain-standalone candidates the plan defers.
  assert.equal(h.scriptEntry('log-iteration').disposition, 'audit-deferred');
  assert.equal(h.scriptEntry('migrate-ids').disposition, 'audit-deferred');
});

test('the case map is internally consistent about suites and cases', () => {
  const map = h.loadCaseMap();
  for (const s of map.scripts) {
    if (s.hasDedicatedSuite) {
      assert.ok(s.suite, `${s.name} names its suite`);
      assert.ok(s.cases.length > 0, `${s.name} has cases`);
    } else {
      assert.equal(s.cases.length, 0, `${s.name} has no suite and therefore no cases`);
    }
  }
});

test('every changed case is observed and every skip names why', () => {
  // JSON-schema-level guard over the per-case disposition refinement (F27). A
  // case may leave `transfer` only when it records what changed, and a case
  // marked `skipped` must say why — so a substitution or a platform skip can
  // never be recorded as an unexplained default.
  const map = h.loadCaseMap();
  const dispositions = new Set(['transfer', 'substituted', 'retired']);
  for (const s of map.scripts) {
    for (const c of s.cases) {
      assert.ok(dispositions.has(c.disposition), `${c.id} disposition is unknown: ${c.disposition}`);
      if (c.disposition !== 'transfer') {
        assert.ok(
          typeof c.observation === 'string' && c.observation.trim() !== '',
          `${c.id} is ${c.disposition} but carries no observation`,
        );
      }
      if (c.skipped !== undefined) {
        assert.equal(c.skipped, true, `${c.id} skipped marker is not true`);
        assert.ok(
          typeof c.observation === 'string' && c.observation.trim() !== '',
          `${c.id} is skipped but names no reason`,
        );
      }
    }
  }
});
