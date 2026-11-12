'use strict';
// =============================================================================
// scripts/changelog-promote.cjs — F16 (red → green), repository cases for F19 and F20
// =============================================================================
// `node scripts/changelog-promote.cjs <version> [--date YYYY-MM-DD]` moves the body of
// `## [Unreleased]` under a new `## [<version>] - <date>` placed right after it.
//   exit 0 promoted           CHANGELOG_PROMOTED=<version>
//   exit 0 nothing to do      CHANGELOG_PROMOTED=already   ([<version>] exists, Unreleased empty)
//   exit 1                    Unreleased empty and no version section, no [Unreleased],
//                             an invalid version, or Unreleased filled while [<version>] exists
//
// Fixtures are disposable temp directories; the script reads CHANGELOG.md from its cwd.
// The repository cases at the bottom read this repository's own CHANGELOG.md.
//
// Run: node --test scripts/tests/changelog-promote.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'changelog-promote.cjs');

function fixture(t, text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-promote-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (text !== null) fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), text);
  return dir;
}

function promote(dir, args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });
  return { status: res.status, out: `${res.stdout}${res.stderr}`, file: path.join(dir, 'CHANGELOG.md') };
}

const FILLED = [
  '# Changelog', '', 'Intro line.', '',
  '## [Unreleased]', '',
  '### Added', '- the new thing', '', '### Fixed', '- the old bug', '',
  '## [1.8.1] - 2026-10-30', '', '### Fixed', '- earlier', '',
  '## [1.8.0] - 2026-10-30', '', '- oldest', '',
].join('\n');

test('changelog-promote#001 — the body of Unreleased moves under the new version, Unreleased is left empty, other sections are byte-identical', (t) => {
  const dir = fixture(t, FILLED);
  const res = promote(dir, ['1.9.2', '--date', '2026-11-12']);
  assert.equal(res.status, 0, res.out);
  assert.match(res.out, /CHANGELOG_PROMOTED=1\.9\.2/);
  const text = fs.readFileSync(res.file, 'utf8');
  const unreleased = text.slice(text.indexOf('## [Unreleased]'), text.indexOf('## [1.9.2]'));
  assert.equal(unreleased.trim(), '## [Unreleased]');
  const promoted = text.slice(text.indexOf('## [1.9.2]'), text.indexOf('## [1.8.1]'));
  assert.match(promoted, /^## \[1\.9\.2\] - 2026-11-12\n/);
  assert.ok(promoted.includes('- the new thing') && promoted.includes('- the old bug'));
  const tail = FILLED.slice(FILLED.indexOf('## [1.8.1]'));
  assert.equal(text.slice(text.indexOf('## [1.8.1]')), tail);
  assert.equal(text.slice(0, text.indexOf('## [Unreleased]')), FILLED.slice(0, FILLED.indexOf('## [Unreleased]')));
});

test('changelog-promote#002 — a second run is a no-op: [version] exists and Unreleased is empty', (t) => {
  const dir = fixture(t, FILLED);
  assert.equal(promote(dir, ['1.9.2', '--date', '2026-11-12']).status, 0);
  const before = fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8');
  const again = promote(dir, ['1.9.2']);
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /CHANGELOG_PROMOTED=already/);
  assert.equal(fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8'), before);
});

test('changelog-promote#003 — exit 1 when Unreleased is empty and no section for the version exists', (t) => {
  const dir = fixture(t, '# Changelog\n\n## [Unreleased]\n\n## [1.8.1] - 2026-10-30\n\n- x\n');
  const res = promote(dir, ['1.9.2']);
  assert.equal(res.status, 1, res.out);
  assert.match(res.out, /Unreleased/);
  assert.equal(fs.readFileSync(res.file, 'utf8'), '# Changelog\n\n## [Unreleased]\n\n## [1.8.1] - 2026-10-30\n\n- x\n');
});

test('changelog-promote#004 — exit 1 when the file has no [Unreleased] heading, or no file, or a bad version', (t) => {
  assert.equal(promote(fixture(t, '# Changelog\n\n## [1.8.1] - 2026-10-30\n'), ['1.9.2']).status, 1);
  assert.equal(promote(fixture(t, null), ['1.9.2']).status, 1);
  assert.equal(promote(fixture(t, FILLED), ['not-a-version']).status, 1);
  assert.equal(promote(fixture(t, FILLED), []).status, 1);
});

test('changelog-promote#005 — Unreleased filled while the version section already exists is refused, never merged', (t) => {
  const dir = fixture(t, FILLED.replace('## [1.8.1]', '## [1.9.2] - 2026-11-01\n\n- already\n\n## [1.8.1]'));
  const before = fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8');
  const res = promote(dir, ['1.9.2']);
  assert.equal(res.status, 1, res.out);
  assert.equal(fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8'), before);
});

test('changelog-promote#006 — a final section with no trailing newline survives, and a v prefix on the version is accepted', (t) => {
  const dir = fixture(t, '# Changelog\n\n## [Unreleased]\n\n- a\n\n## [1.0.0] - 2026-01-01\n\n- last');
  const res = promote(dir, ['v1.1.0', '--date', '2026-02-02']);
  assert.equal(res.status, 0, res.out);
  const text = fs.readFileSync(res.file, 'utf8');
  assert.ok(text.endsWith('- last'));
  assert.ok(text.includes('## [1.1.0] - 2026-02-02'));
});

// ─── The repository's own CHANGELOG.md (F19, F20) ────────────────────────────────────────────

const repoChangelog = () => fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');

test('changelog-promote#007 — CHANGELOG.md carries a 1.9.0 and a 1.9.1 section (F19)', () => {
  const text = repoChangelog();
  assert.match(text, /^## \[1\.9\.0\] - 2026-11-11$/m);
  assert.match(text, /^## \[1\.9\.1\] - 2026-11-11$/m);
  assert.ok(text.indexOf('## [1.9.1]') < text.indexOf('## [1.9.0]'), 'newest first');
  const v190 = text.slice(text.indexOf('## [1.9.0]'), text.indexOf('## [1.8.1]'));
  assert.match(v190, /docs branch/i);
  const v191 = text.slice(text.indexOf('## [1.9.1]'), text.indexOf('## [1.9.0]'));
  assert.match(v191, /release/i);
});
test('changelog-promote#008 — [Unreleased] is non-empty, opens with Security, and names authSeed and rotation (F20)', () => {
  const text = repoChangelog();
  const start = text.indexOf('## [Unreleased]');
  const body = text.slice(start + '## [Unreleased]'.length, text.indexOf('## [1.9.1]'));
  assert.ok(body.trim().length > 0, 'Unreleased is empty');
  assert.match(body.trimStart(), /^### Security/);
  assert.match(body, /authSeed/);
  assert.match(body, /rotat/i);
  assert.match(body, /### Fixed/);
  assert.match(body, /### Changed/);
});
