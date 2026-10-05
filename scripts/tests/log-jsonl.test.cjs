'use strict';
// =============================================================================
// NATIVE PORT — log-jsonl (F27, target F12's framwork/.codeadd/scripts/log-jsonl.cjs)
// =============================================================================
// Ported from framwork/.codeadd/scripts/tests/log-jsonl.bats (7 cases). The
// native entry takes <file> <type> <agent> '<raw-extra-fields>', appends exactly
// one JSON line, creates intermediate directories and preserves the
// `ERROR:<slug>` exit-1 validation contract.
//
// ⛔ RED IS EXPECTED: log-jsonl.cjs does not exist yet.
//
// Run: node --test scripts/tests/log-jsonl.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const h = require('./helpers.cjs');

const abs = (repo, rel) => path.join(repo, rel);

test('log-jsonl#001 creates JSONL file with correct fields', () => {
  const dir = h.mkTmp('codeadd-logjsonl-');
  try {
    const res = h.runScript('log-jsonl', ['output.jsonl', 'fix', '/dev', '"slug":"test","what":"test fix"'], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('LOGGED:'));
    const rows = h.readJsonl(abs(dir, 'output.jsonl'));
    assert.equal(rows.length, 1);
    const entry = rows[0];
    assert.equal(entry.type, 'fix');
    assert.equal(entry.agent, '/dev');
    // Raw extra fields are injected verbatim, not nested or re-quoted.
    assert.equal(entry.slug, 'test');
    assert.equal(entry.what, 'test fix');
    // Timestamp precision: UTC ISO-8601 to the second, with a literal Z.
    assert.match(entry.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  } finally {
    h.rmrf(dir);
  }
});

test('log-jsonl#002 creates intermediate directory if it does not exist', () => {
  const dir = h.mkTmp('codeadd-logjsonl-');
  try {
    const res = h.runScript(
      'log-jsonl',
      ['deep/nested/dir/output.jsonl', 'add', 'backend', '"slug":"s1","what":"w1"'],
      { cwd: dir },
    );
    assert.equal(res.status, 0, res.output);
    const rows = h.readJsonl(abs(dir, 'deep/nested/dir/output.jsonl'));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].type, 'add');
  } finally {
    h.rmrf(dir);
  }
});

test('log-jsonl#003 appends multiple entries in the same file', () => {
  const dir = h.mkTmp('codeadd-logjsonl-');
  try {
    const first = h.runScript('log-jsonl', ['multi.jsonl', 'fix', '/dev', '"slug":"a","what":"first"'], { cwd: dir });
    assert.equal(first.status, 0, first.output);
    const second = h.runScript(
      'log-jsonl',
      ['multi.jsonl', 'add', '/dev', '"slug":"b","what":"second","files":["src/a.ts","src/b.ts"]'],
      { cwd: dir },
    );
    assert.equal(second.status, 0, second.output);
    const rows = h.readJsonl(abs(dir, 'multi.jsonl'));
    assert.equal(rows.length, 2, 'each call appends exactly one line');
    assert.deepEqual(rows.map((r) => r.type), ['fix', 'add'], 'append order is preserved');
    assert.deepEqual(rows[1].files, ['src/a.ts', 'src/b.ts'], 'raw nested extra fields survive');
  } finally {
    h.rmrf(dir);
  }
});

test('log-jsonl#004 fails without arguments', () => {
  const dir = h.mkTmp('codeadd-logjsonl-');
  try {
    const res = h.runScript('log-jsonl', [], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:missing_args'));
  } finally {
    h.rmrf(dir);
  }
});

test('log-jsonl#005 fails with only 3 arguments', () => {
  const dir = h.mkTmp('codeadd-logjsonl-');
  try {
    const res = h.runScript('log-jsonl', ['file.jsonl', 'fix', 'agent'], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    // Fewer than four args is the same misuse as none: the missing-args
    // contract, not merely a non-zero exit.
    assert.ok(res.output.includes('ERROR:missing_args'));
    assert.ok(res.output.includes('USAGE:'));
  } finally {
    h.rmrf(dir);
  }
});

test('log-jsonl#006 fails with empty file argument', () => {
  const dir = h.mkTmp('codeadd-logjsonl-');
  try {
    const res = h.runScript('log-jsonl', ['', 'fix', 'agent', '"x":"y"'], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:empty_file'));
  } finally {
    h.rmrf(dir);
  }
});

test('log-jsonl#007 fails with empty type argument', () => {
  const dir = h.mkTmp('codeadd-logjsonl-');
  try {
    const res = h.runScript('log-jsonl', ['f.jsonl', '', 'agent', '"x":"y"'], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:empty_type'));
  } finally {
    h.rmrf(dir);
  }
});
