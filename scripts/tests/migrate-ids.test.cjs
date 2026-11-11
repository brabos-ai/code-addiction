'use strict';
// =============================================================================
// NATIVE CHARACTERIZATION — migrate-ids (F27, target F17's
// framwork/.codeadd/scripts/migrate-ids.cjs)
// =============================================================================
// migrate-ids.sh has NO dedicated Bats suite: F1 recorded it as a missing-suite
// `audit-deferred` candidate and the plan requires mode characterization, "not
// an exemption". These tests characterize the public contract read from the
// shell source: default dry-run, --apply, --validate, and the use/missing-input
// exits. F17 resolves the final disposition; the useful cases must survive on
// whichever entry it selects.
//
// Old → new path mapping, under the docs root (never spelled in this file):
//   <type>/<L><NNNN>-slug → features/<NNNN><L>-slug
//   features/F0001-auth  -> features/0001F-auth
//   hotfixes/H0002-crash -> features/0002H-crash
//
// The docs root is built from the resolver module; an absent root is an explicit
// DOCS_ROOT_MISSING failure and the root is never created by the script.
//
// Run: node --test scripts/tests/migrate-ids.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');
const { DOCS_ROOT } = require(path.join(h.SCRIPTS_DIR, 'docs-root.cjs'));

/** A path under the docs root, POSIX, relative to the project. */
const D = (sub) => `${DOCS_ROOT}/${sub}`;

const abs = (dir, rel) => path.join(dir, rel);
const out = (res) => h.stripAnsi(res.output);

function withDocs() {
  const dir = h.mkTmp('codeadd-ids-');
  fs.mkdirSync(abs(dir, D('features')), { recursive: true });
  return dir;
}

test('migrate-ids#c01 default mode is a dry-run: it reports the move but renames nothing', () => {
  const dir = withDocs();
  try {
    h.write(abs(dir, D('features/F0001-auth/plan.md')), '# F0001-auth\n');
    const res = h.runScript('migrate-ids', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    const text = out(res);
    assert.ok(text.includes('DRY-RUN'), 'the default mode announces dry-run');
    assert.ok(text.includes(D('features/F0001-auth')), 'the source is named');
    assert.ok(text.includes(D('features/0001F-auth')), 'the destination is named');
    assert.ok(text.includes('->'), 'the move is shown');
    assert.equal(fs.existsSync(abs(dir, D('features/F0001-auth'))), true, 'dry-run does not rename');
    assert.equal(fs.existsSync(abs(dir, D('features/0001F-auth'))), false);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c02 --apply renames the old-format directory and its files', () => {
  const dir = withDocs();
  try {
    h.write(abs(dir, D('features/F0001-auth/plan.md')), '# F0001-auth\n');
    const res = h.runScript('migrate-ids', ['--apply'], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    const text = out(res);
    assert.ok(text.includes('Renamed:'), 'the rename is reported');
    assert.ok(text.includes('Migration complete'), 'the summary is reported');
    assert.equal(fs.existsSync(abs(dir, D('features/F0001-auth'))), false, 'old path is gone');
    assert.equal(fs.existsSync(abs(dir, D('features/0001F-auth/plan.md'))), true, 'the tree moved intact');
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c03 --apply rewrites references from the old id to the new id', () => {
  const dir = withDocs();
  try {
    h.write(abs(dir, D('features/F0001-auth/plan.md')), 'See F0001-auth for the plan.\n');
    h.write(abs(dir, D('features/F0001-auth/notes.md')), 'Ref: F0001-auth\n');
    const res = h.runScript('migrate-ids', ['--apply'], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    const moved = h.read(abs(dir, D('features/0001F-auth/notes.md')));
    assert.ok(moved.includes('0001F-auth'), 'the reference now uses the new id');
    assert.equal(moved.includes('F0001-auth'), false, 'no dangling old-id reference is left behind');
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c04 --apply maps a hotfix dir to the features folder and removes the empty type dir', () => {
  const dir = withDocs();
  try {
    h.write(abs(dir, D('hotfixes/H0002-crash/fix.md')), '# H0002-crash\n');
    const res = h.runScript('migrate-ids', ['--apply'], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.equal(fs.existsSync(abs(dir, D('features/0002H-crash/fix.md'))), true);
    assert.equal(fs.existsSync(abs(dir, D('hotfixes'))), false, 'the emptied hotfixes/ dir is removed');
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c05 --validate passes on a migrated tree', () => {
  const dir = withDocs();
  try {
    h.write(abs(dir, D('features/F0001-auth/plan.md')), '# F0001-auth\n');
    assert.equal(h.runScript('migrate-ids', ['--apply'], { cwd: dir }).status, 0);
    const res = h.runScript('migrate-ids', ['--validate'], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(out(res).includes('Validation passed!'));
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c06 --validate fails while an old-format directory remains', () => {
  const dir = withDocs();
  try {
    h.write(abs(dir, D('features/F0001-auth/plan.md')), '# F0001-auth\n');
    const res = h.runScript('migrate-ids', ['--validate'], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.ok(out(res).includes('Old-format directories still exist'));
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c07 nothing to migrate reports cleanly and exits 0', () => {
  const dir = withDocs();
  try {
    h.write(abs(dir, D('features/0001F-current/plan.md')), '# already native\n');
    const res = h.runScript('migrate-ids', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(out(res).includes('No old-format directories found'));
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c08 an absent docs root is DOCS_ROOT_MISSING, exit 1, and nothing is created', () => {
  const dir = h.mkTmp('codeadd-ids-');
  try {
    const res = h.runScript('migrate-ids', [], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.ok(out(res).includes('DOCS_ROOT_MISSING'));
    assert.equal(fs.existsSync(abs(dir, DOCS_ROOT)), false, 'the root is never created');
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c09 an unknown mode prints usage and exits 1', () => {
  const dir = withDocs();
  try {
    const res = h.runScript('migrate-ids', ['--bogus'], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.ok(out(res).includes('Usage:'));
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-ids#c10 --validate with no features folder exits 1', () => {
  const dir = h.mkTmp('codeadd-ids-');
  try {
    fs.mkdirSync(abs(dir, DOCS_ROOT), { recursive: true });
    const res = h.runScript('migrate-ids', ['--validate'], { cwd: dir });
    assert.equal(res.status, 1, res.output);
    assert.ok(out(res).includes(`${D('features')} not found`));
  } finally {
    h.rmrf(dir);
  }
});
