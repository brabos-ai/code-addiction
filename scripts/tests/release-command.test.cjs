'use strict';
// =============================================================================
// scripts/tests/release-command.test.cjs — the v1.10.0 release lessons (red → green)
// =============================================================================
// v1.10.0 was tagged but never published:
//   1. the release agent's first changelog write went to `.codeadd/.temp/`, which did not
//      exist, so the bump and the first production merge shipped without the changelog;
//   2. the changelog it added afterwards named the legacy docs location, and only the
//      tag pipeline's `docs-no-legacy` test caught it — after the tag was pushed.
// The release command must create `.codeadd/.temp/` before any temp-file write and must run
// the docs-no-legacy check after the changelog promote, before the bump commit, the
// production merge and the tag.
//
// Run: node --test scripts/tests/release-command.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CMD = fs.readFileSync(path.join(ROOT, 'workbench', 'commands', 'add-framework--release.md'), 'utf8');
const CHECK = 'node scripts/run-tests.js cli tests/docs-no-legacy.test.js';

const step = (n) => {
  const start = CMD.indexOf(`## STEP ${n}:`);
  assert.ok(start !== -1, `no STEP ${n}`);
  const end = CMD.indexOf('\n## ', start + 1);
  return CMD.slice(start, end === -1 ? undefined : end);
};

test('release-command#001 — `.codeadd/.temp/` is created before any temp-file write', () => {
  assert.match(CMD, /create `\.codeadd\/\.temp\/` (first )?when it is missing/i);
  const createAt = CMD.search(/create `\.codeadd\/\.temp\/`/i);
  assert.ok(createAt < CMD.indexOf('## STEP 4:'), 'the create rule sits before STEP 4, the first write');
});

test('release-command#002 — STEP 4 runs the docs-no-legacy check after the promote and before the bump commit', () => {
  const s4 = step(4);
  const promote = s4.indexOf('node scripts/changelog-promote.cjs');
  const check = s4.indexOf(CHECK);
  const commit = s4.indexOf('chore: bump version to');
  assert.ok(promote !== -1 && check !== -1 && commit !== -1, 'promote, check and commit all named in STEP 4');
  assert.ok(promote < check && check < commit, 'order: promote, check, commit');
  assert.match(s4.slice(check), /STOP/);
});

test('release-command#003 — STEP 7 re-runs the docs-no-legacy check before the tag script', () => {
  const s7 = step(7);
  const check = s7.indexOf(CHECK);
  const tag = s7.indexOf('node scripts/create-release-tag.cjs');
  assert.ok(check !== -1 && tag !== -1 && check < tag, 'the check runs before the tag script');
});

test('release-command#004 — a prohibition blocks tagging while the docs-no-legacy check fails', () => {
  const prohibitions = CMD.slice(CMD.indexOf('ABSOLUTE PROHIBITIONS'), CMD.indexOf('## STEP 0:'));
  assert.match(prohibitions, /IF the docs-no-legacy check fails/);
});
