'use strict';
// =============================================================================
// next-id.test.cjs — characterization of framwork/.codeadd/scripts/next-id.sh.
// Target entry: framwork/.codeadd/scripts/next-id.cjs. (No Bats suite exists;
// the case map records next-id with hasDedicatedSuite=false, so these are the
// behaviours the shell documents in its own header, turned into a gate.)
//
// Contract:
//   * exactly one argument, a single uppercase A–Z letter; anything else exits 1
//   * one global counter over the docs root's features folder only; a backlog file
//     is never read
//   * the match is on a directory's basename, never a parent path
//   * output is %04d + letter (e.g. 0001F)
//
// Run: node --test scripts/tests/next-id.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const h = require('./helpers.cjs');
const { DOCS_ROOT, DOCS_LAYOUT } = require(path.join(h.SCRIPTS_DIR, 'docs-root.cjs'));

// The docs root and its features folder, built from the one module that owns them.
const rootOf = (dir) => path.join(dir, ...DOCS_ROOT.split('/'));
const featuresOf = (dir) => path.join(rootOf(dir), DOCS_LAYOUT.features);

const run = (name, args, opts = {}) => h.runScript(name, args, opts);

test('next-id preserves the public five-digit output at the four-digit boundary', (t) => {
  const dir = tmpDir(t, 'codeadd-overflow-');
  featureDir(dir, '9999F-last');
  for (const [name, args] of [['next-id', ['F']], ['status', ['next-id', 'F']]]) {
    const result = run(name, args, { cwd: dir });
    assert.equal(result.status, 0, result.output);
    assert.equal(result.stdout.trim(), '10000F');
  }
});

/** A temp cwd for one test. */
function tmpDir(t, prefix = 'codeadd-nextid-', { docsRoot = true } = {}) {
  const dir = h.mkTmp(prefix);
  t.after(() => h.rmrf(dir));
  h.git(dir, ['init', '-q']);
  if (docsRoot) fs.mkdirSync(rootOf(dir), { recursive: true });
  return dir;
}

function featureDir(dir, name) {
  h.write(path.join(featuresOf(dir), name, 'about.md'), '# about\n');
}

function backlog(dir, lines) {
  h.write(path.join(rootOf(dir), 'backlog.jsonl'), lines.join('\n') + '\n');
}

// ─── Argument validation ─────────────────────────────────────────────

test('next-id: no argument exits 1 with a required-argument error', (t) => {
  const dir = tmpDir(t);
  const res = run('next-id', [], { cwd: dir });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /TYPE_LETTER required/);
});

test('next-id: a lowercase letter is rejected as not a single uppercase letter', (t) => {
  const dir = tmpDir(t);
  const res = run('next-id', ['f'], { cwd: dir });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /single uppercase letter/);
});

test('next-id: a multi-letter type is rejected', (t) => {
  const dir = tmpDir(t);
  const res = run('next-id', ['FF'], { cwd: dir });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /single uppercase letter/);
});

test('next-id: a digit type is rejected', (t) => {
  const dir = tmpDir(t);
  const res = run('next-id', ['1'], { cwd: dir });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /single uppercase letter/);
});

// ─── Counter over the features folder ──────────────────────────────────────

test('next-id: an empty tree starts at 0001 for the requested letter', (t) => {
  const dir = tmpDir(t);
  const res = run('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0001F');
});

test('next-id: the number is global across letters (max over every dir)', (t) => {
  const dir = tmpDir(t);
  featureDir(dir, '0001F-a');
  featureDir(dir, '0003H-b');
  const res = run('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0004F');
});

test('next-id: a non-ID directory does not advance the counter', (t) => {
  const dir = tmpDir(t);
  featureDir(dir, 'not-an-id');
  featureDir(dir, '0002F-real');
  const res = run('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0003F');
});

// ─── The backlog file is never read ──────────────────────────────────

test('next-id: ids on a backlog.jsonl in the docs root do not advance the counter', (t) => {
  const dir = tmpDir(t);
  featureDir(dir, '0002F-docs');
  backlog(dir, ['{"id":"0050F","title":"ticket"}']);
  const res = run('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0003F');
});

test('next-id: B is still accepted as a plain letter', (t) => {
  const dir = tmpDir(t);
  featureDir(dir, '0004F-x');
  const res = run('next-id', ['B'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0005B');
});

test('next-id: four digits in a parent path do not pose as an id', (t) => {
  // The basename rule: the temp dir itself carries 9999X, but the only real
  // feature dir is 0001F-a, so the next id is 0002F — not 10000F.
  const dir = tmpDir(t, 'codeadd-nextid-9999X-');
  featureDir(dir, '0001F-a');
  const res = run('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0002F');
});

// ─── The docs root (L1.7) ────────────────────────────────────────────

test('next-id: ids outside the docs root features folder never count', (t) => {
  const dir = tmpDir(t);
  featureDir(dir, '0002F-real');
  // A same-shaped folder next to the root, and one at the repository top.
  h.write(path.join(dir, 'elsewhere', 'features', '0090F-stray', 'about.md'), '# x\n');
  h.write(path.join(rootOf(dir), 'brainstorm', '0095F-stray', 'about.md'), '# x\n');
  for (const [name, args] of [['next-id', ['F']], ['status', ['next-id', 'F']]]) {
    const res = run(name, args, { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.equal(res.stdout.trim(), '0003F');
  }
});

test('next-id: a docs root without a features folder starts at 0001', (t) => {
  const dir = tmpDir(t);
  const res = run('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0, res.output);
  assert.equal(res.stdout.trim(), '0001F');
});

test('next-id: an absent docs root fails with DOCS_ROOT_MISSING and exit 1', (t) => {
  const dir = tmpDir(t, 'codeadd-nextid-', { docsRoot: false });
  for (const [name, args] of [['next-id', ['F']], ['status', ['next-id', 'F']]]) {
    const res = run(name, args, { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.match(res.stderr, /DOCS_ROOT_MISSING/);
    assert.equal(res.stdout.trim(), '');
  }
});
