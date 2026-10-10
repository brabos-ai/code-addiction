'use strict';
// =============================================================================
// next-id.test.cjs — characterization of framwork/.codeadd/scripts/next-id.sh.
// Target entry: framwork/.codeadd/scripts/next-id.cjs. (No Bats suite exists;
// the case map records next-id with hasDedicatedSuite=false, so these are the
// behaviours the shell documents in its own header, turned into a gate.)
//
// Contract:
//   * exactly one argument, a single uppercase A–Z letter; anything else exits 1
//   * one global counter over docs/features/[NNNN][L]-*/ AND docs/backlog.jsonl
//   * the backlog is read by anchored raw-text grep ('"id":"NNNNL"'), never
//     parsed, so a damaged JSON line still yields its id
//   * the match is on a directory's basename, never a parent path
//   * output is %04d + letter (e.g. 0001F)
//
// Run: node --test scripts/tests/next-id.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const h = require('./helpers.cjs');

/**
 * The board is read from a clone, never from the checkout. These fixtures make
 * the temp directory both the code repository and the clone: CODEADD_BOARD_DIR
 * points at it.
 */
const run = (name, args, opts = {}) =>
  h.runScript(name, args, { ...opts, env: { CODEADD_BOARD_DIR: opts.cwd, ...(opts.env || {}) } });

test('next-id preserves the public five-digit output at the four-digit boundary', (t) => {
  const dir = h.mkTmp('codeadd-overflow-');
  t.after(() => h.rmrf(dir));
  h.git(dir, ['init', '-q']);
  h.write(path.join(dir, 'docs', 'backlog.jsonl'), '{"id":"9999B"}\n');
  for (const [name, args] of [['next-id', ['F']], ['status', ['next-id', 'F']]]) {
    const result = run(name, args, { cwd: dir });
    assert.equal(result.status, 0, result.output);
    assert.equal(result.stdout.trim(), '10000F');
  }
});

/** A temp cwd for one test. */
function tmpDir(t, prefix = 'codeadd-nextid-') {
  const dir = h.mkTmp(prefix);
  t.after(() => h.rmrf(dir));
  h.git(dir, ['init', '-q']);
  return dir;
}

function featureDir(dir, name) {
  h.write(path.join(dir, 'docs', 'features', name, 'about.md'), '# about\n');
}

function backlog(dir, lines) {
  h.write(path.join(dir, 'docs', 'backlog.jsonl'), lines.join('\n') + '\n');
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

// ─── Counter over docs/features ──────────────────────────────────────

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

// ─── Counter over docs/backlog.jsonl (raw-text grep) ─────────────────

test('next-id: ids on the backlog board advance the counter', (t) => {
  const dir = tmpDir(t);
  backlog(dir, ['{"id":"0007R","title":"ticket"}']);
  const res = run('next-id', ['R'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0008R');
});

test('next-id: the counter is the max over features AND the backlog together', (t) => {
  const dir = tmpDir(t);
  featureDir(dir, '0002F-docs');
  backlog(dir, ['{"id":"0005B","title":"board"}']);
  const res = run('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0006F');
});

test('next-id: a line with damaged JSON still yields its id', (t) => {
  const dir = tmpDir(t);
  backlog(dir, ['{"id":"0005B" this is not valid JSON']);
  const res = run('next-id', ['B'], { cwd: dir });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0006B');
});

test('next-id: an id quoted in prose is not counted (anchored on "id")', (t) => {
  const dir = tmpDir(t);
  backlog(dir, ['{"id":"0001F","title":"see 0099Z someday"}']);
  const res = run('next-id', ['Z'], { cwd: dir });
  assert.equal(res.status, 0);
  // 0099Z lives only in a title; counting it would burn a hundred ids.
  assert.equal(res.stdout.trim(), '0002Z');
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
