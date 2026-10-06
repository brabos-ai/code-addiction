'use strict';
// =============================================================================
// NATIVE PORT — build-ledger (F27, target F10's framwork/.codeadd/scripts/build-ledger.cjs)
// =============================================================================
// Ported one-for-one from framwork/.codeadd/scripts/tests/build-ledger.bats (17
// cases). Each `test(...)` keeps its old Bats case id in the title. The native
// entry is invoked with the SAME positional arguments and must preserve the
// KEY=VALUE contract, exit codes and on-disk format (Global Constraints:
// "Preserve public arguments, output fields and meaning, exit codes, persisted
// formats, defaults, and failure behavior").
//
// ⛔ RED IS EXPECTED: build-ledger.cjs does not exist yet. Every assertion below
//    states the contract F10 must satisfy, not merely that a file is missing.
//
// Run: node --test scripts/tests/build-ledger.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const LEDGER = 'docs/features/0003F-signup/build-ledger.md';
const FEATURE_ID = '0003F';
const PLAN_PATH = 'docs/features/0003F-signup/plan.md';
const HEADER = '# Build ledger — feature: 0003F — plan: docs/features/0003F-signup/plan.md';

const abs = (repo, rel) => path.join(repo, rel);
const ledgerLines = (repo) => h.read(abs(repo, LEDGER)).split('\n');

test('build-ledger#001 L2.1: a missing ledger is created with its identity header', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript(
      'build-ledger',
      [LEDGER, 'T01: complete (commits a1b2c3d..a1b2c3d, review clean)', FEATURE_ID, PLAN_PATH],
      { cwd: repo },
    );
    assert.equal(res.status, 0, res.output);
    const kv = h.parseKV(res.stdout);
    assert.equal(kv.LEDGER, LEDGER, 'LEDGER is the path exactly as given');
    assert.equal(kv.CREATED, 'true');
    assert.equal(kv.LINES, '1');
    const lines = ledgerLines(repo);
    assert.equal(lines[0], HEADER, 'line 1 is the identity header');
    assert.equal(lines[1], '', 'line 2 is the blank line under the header');
    assert.equal(lines[2], 'T01: complete (commits a1b2c3d..a1b2c3d, review clean)');
  } finally {
    cleanup();
  }
});

test('build-ledger#002 L2.1: creating reports CREATED=true, appending reports CREATED=false', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const first = h.runScript('build-ledger', [LEDGER, 'first', FEATURE_ID, PLAN_PATH], { cwd: repo });
    assert.equal(first.status, 0, first.output);
    assert.equal(h.parseKV(first.stdout).CREATED, 'true');

    const second = h.runScript('build-ledger', [LEDGER, 'second', FEATURE_ID, PLAN_PATH], { cwd: repo });
    assert.equal(second.status, 0, second.output);
    assert.equal(h.parseKV(second.stdout).CREATED, 'false');
  } finally {
    cleanup();
  }
});

test('build-ledger#003 L2.1: an existing ledger gains only the line — the header is written once', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    h.runScript('build-ledger', [LEDGER, 'T01: complete', FEATURE_ID, PLAN_PATH], { cwd: repo });
    h.runScript('build-ledger', [LEDGER, 'T02: fix round 1/3 (2 addressed, 0 open)', FEATURE_ID, PLAN_PATH], { cwd: repo });
    const res = h.runScript('build-ledger', [LEDGER, 'T02: complete', FEATURE_ID, PLAN_PATH], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const lines = ledgerLines(repo);
    assert.equal(lines.filter((l) => l.startsWith('# Build ledger')).length, 1, 'header written once');
    assert.equal(lines[0], HEADER);
    assert.equal(lines[2], 'T01: complete');
    assert.equal(lines[3], 'T02: fix round 1/3 (2 addressed, 0 open)');
    assert.equal(lines[4], 'T02: complete');
  } finally {
    cleanup();
  }
});

test('build-ledger#004 L2.1: the same line twice appends twice — it is a log, not a set', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const line = 'T02: fix round 1/3 (1 addressed, 1 open)';
    h.runScript('build-ledger', [LEDGER, line, FEATURE_ID, PLAN_PATH], { cwd: repo });
    const res = h.runScript('build-ledger', [LEDGER, line, FEATURE_ID, PLAN_PATH], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const occurrences = ledgerLines(repo).filter((l) => l === line).length;
    assert.equal(occurrences, 2, 'duplicate rows are preserved, not de-duplicated');
    assert.equal(h.parseKV(res.stdout).LINES, '2');
  } finally {
    cleanup();
  }
});

test('build-ledger#005 L2.1: LINES counts entries, not the header or its blank line', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    h.runScript('build-ledger', [LEDGER, 'one', FEATURE_ID, 'p.md'], { cwd: repo });
    const res = h.runScript('build-ledger', [LEDGER, 'two', FEATURE_ID, 'p.md'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(h.parseKV(res.stdout).LINES, '2');
  } finally {
    cleanup();
  }
});

test('build-ledger#006 a line carrying backticks, %s and a leading dash is written verbatim', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const line = 'Preflight: Ruling: T02 wins — 100% of `UserDto.name` uses %s — costs a rename in T05';
    const res = h.runScript('build-ledger', [LEDGER, line, FEATURE_ID, 'p.md'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(ledgerLines(repo)[2], line, 'the line is content, never a format string');
  } finally {
    cleanup();
  }
});

test('build-ledger#007 a line starting with a dash is an entry, not an option', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', [LEDGER, '-n T03: minor (deferred): magic number', FEATURE_ID, 'p.md'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(ledgerLines(repo)[2], '-n T03: minor (deferred): magic number');
  } finally {
    cleanup();
  }
});

test('build-ledger#008 the parent directory is created when absent', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const deep = 'docs/features/0004F-epic/subfeatures/SF02-billing/build-ledger.md';
    const res = h.runScript(
      'build-ledger',
      [deep, 'T01: complete', '0004F', 'docs/features/0004F-epic/subfeatures/SF02-billing/plan.md'],
      { cwd: repo },
    );
    assert.equal(res.status, 0, res.output);
    assert.equal(fs.existsSync(abs(repo, deep)), true, 'the parent directory was created');
  } finally {
    cleanup();
  }
});

test('build-ledger#009 FEATURE_ID and PLAN_PATH omitted: the header is derived from the ledger directory', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', [LEDGER, 'T01: complete'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(
      ledgerLines(repo)[0],
      '# Build ledger — feature: 0003F-signup — plan: docs/features/0003F-signup/plan.md',
    );
  } finally {
    cleanup();
  }
});

test('build-ledger#010 identity arguments are ignored once the ledger exists — the header is never rewritten', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    h.runScript('build-ledger', [LEDGER, 'T01: complete', FEATURE_ID, PLAN_PATH], { cwd: repo });
    const res = h.runScript('build-ledger', [LEDGER, 'T02: complete', 'WRONG', 'wrong/path.md'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const body = h.read(abs(repo, LEDGER));
    assert.equal(body.split('\n')[0], HEADER, 'creation-only identity');
    assert.equal(body.includes('WRONG'), false, 'a later identity argument is ignored');
  } finally {
    cleanup();
  }
});

test('build-ledger#011 misuse: no arguments -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', [], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('build-ledger#012 misuse: one argument -> exit 2 and nothing written', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', [LEDGER], { cwd: repo });
    assert.equal(res.status, 2, res.output);
    assert.equal(fs.existsSync(abs(repo, LEDGER)), false, 'misuse writes no ledger');
  } finally {
    cleanup();
  }
});

test('build-ledger#013 misuse: five arguments -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', [LEDGER, 'line', FEATURE_ID, 'p.md', 'extra'], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('build-ledger#014 misuse: an empty LEDGER_FILE -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', ['', 'T01: complete'], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('build-ledger#015 misuse: an empty LINE -> exit 2, and no blank entry is appended', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    h.runScript('build-ledger', [LEDGER, 'T01: complete', FEATURE_ID, 'p.md'], { cwd: repo });
    const before = (h.read(abs(repo, LEDGER)).match(/\n/g) || []).length;
    const res = h.runScript('build-ledger', [LEDGER, ''], { cwd: repo });
    assert.equal(res.status, 2, res.output);
    const after = (h.read(abs(repo, LEDGER)).match(/\n/g) || []).length;
    assert.equal(after, before, 'a blank row must not enter an append-only log');
  } finally {
    cleanup();
  }
});

test('build-ledger#016 misuse: a LINE carrying a newline -> exit 2 (one line per event)', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', [LEDGER, 'T02: fix round 1/3\nT02: complete', FEATURE_ID, 'p.md'], { cwd: repo });
    assert.equal(res.status, 2, res.output);
    assert.equal(fs.existsSync(abs(repo, LEDGER)), false, 'a multi-line event is refused before any write');
  } finally {
    cleanup();
  }
});

test('build-ledger#017 misuse prints a usage line to stderr, never a LEDGER= line', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('build-ledger', [LEDGER], { cwd: repo });
    assert.equal(res.status, 2, res.output);
    assert.ok(res.stderr.includes('Usage:'), 'usage goes to stderr');
    assert.equal(res.stdout.includes('LEDGER='), false, 'no partial contract on misuse');
  } finally {
    cleanup();
  }
});

// Extra contract case (not a Bats row): F10's header promises "exit 1 only when
// the filesystem refuses the write". Pointing LEDGER_FILE at an existing
// directory makes the create-write fail portably on Windows and POSIX alike.
test('build-ledger:EXTRA a refused write exits 1 with ERROR= and no LEDGER= contract', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    fs.mkdirSync(abs(repo, LEDGER), { recursive: true });
    const res = h.runScript('build-ledger', [LEDGER, 'T01: complete', FEATURE_ID, PLAN_PATH], { cwd: repo });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR='), 'a refused write is loud');
    assert.equal(res.stdout.includes('LEDGER='), false, 'no success contract when the ruling did not land');
  } finally {
    cleanup();
  }
});
