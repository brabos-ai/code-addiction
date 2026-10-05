'use strict';
// =============================================================================
// qa-evidence — native port of framwork/.codeadd/scripts/tests/qa-evidence.bats
// =============================================================================
// Target: framwork/.codeadd/scripts/qa-evidence.cjs (F27; does not exist yet —
// these tests are intentionally Red until the native entry lands).
//
// Every old @test maps to one test() keeping its case id (qa-evidence#NNN).
// The fixtures mirror the Bats make_run(): a feature dir on disk, a
// schema-complete qa-validation report, and a screenshot. Containment and
// symlink rejection, promotion gates, receipt/probe output and exit
// distinctions are all preserved.
//
// Run: node --test scripts/tests/qa-evidence.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

/** Forward-slash a path fragment so Windows output still matches POSIX shapes. */
const slash = (s) => String(s).replace(/\\/g, '/');

/** A fresh feature fixture under a throwaway base; cleaned via t.after. */
function feature(t, id = '0001F-evidence') {
  const base = h.mkTmp('codeadd-qa-evidence-');
  t.after(() => h.rmrf(base));
  const dir = path.join(base, 'docs', 'features', id);
  fs.mkdirSync(dir, { recursive: true });
  return { base, dir };
}

function reportText(nnn, scopeValue) {
  return [
    '---',
    `id: 0001F-qa-validation-${nnn}`,
    'type: qa-validation',
    'created: 2026-08-17',
    'feature: 0001F',
    `scope: ${scopeValue}`,
    'method: read-png',
    'specs: { about: about.md, design: design.md }',
    'viewports: [desktop]',
    'judged-contract: sha256:0123456789abcdef',
    '---',
    `# QA Validation ${nnn}`,
    '## TOC',
    '- Summary',
    '## TL;DR',
    'Evidence retained.',
    '## Summary',
    '| Severity | Count |',
    '|---|---|',
    '| Blocker | 1 |',
    '| Major | 2 |',
    '| Minor | 3 |',
    '| Polish | 4 |',
    '## Coverage (contract-anchored, vs design.md)',
    'covered',
    '## Functional delivery (vs about.md)',
    'delivered',
    '## Findings',
    'Open finding retained.',
    '## Responsiveness (per viewport)',
    'clean',
    '## Accessibility (axe-core + visual)',
    'clean',
    '## Fix Routing',
    'none',
    '## Clean screens',
    'home',
    '## Not covered / caveats',
    'none',
    '',
  ].join('\n');
}

/** make_run() from the Bats suite. `store` is 'working' or 'final'. */
function makeRun(scopeDir, run, store = 'working') {
  const nnn = run.slice('run-'.length);
  const scopeValue = /^SF[0-9][0-9]-/.test(path.basename(scopeDir))
    ? `[${path.basename(scopeDir).slice(0, 4)}]`
    : '[]';
  const root = store === 'final'
    ? path.join(scopeDir, '_tests', 'final', run)
    : path.join(scopeDir, '_tests', run);
  fs.mkdirSync(path.join(root, 'screenshots'), { recursive: true });
  h.write(path.join(root, `qa-validation-${nnn}.md`), reportText(nnn, scopeValue));
  h.write(path.join(root, 'screenshots', 'home.png'), `png-${run}\n`);
}

function reportPath(scopeDir, run, store = 'working') {
  const nnn = run.slice('run-'.length);
  const root = store === 'final'
    ? path.join(scopeDir, '_tests', 'final', run)
    : path.join(scopeDir, '_tests', run);
  return path.join(root, `qa-validation-${nnn}.md`);
}

// ─── qa-evidence#001..#004 — allocation and baseline counters ────────────────

test('qa-evidence#001 — next starts at run-001 with no evidence', (t) => {
  const { base, dir } = feature(t);
  const res = h.runScript('qa-evidence', ['next', dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.equal(h.parseKV(res.stdout).RUN_ID, 'run-001');
});

test('qa-evidence#002 — next uses the union of working and final evidence', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-003');
  makeRun(dir, 'run-007', 'final');
  const res = h.runScript('qa-evidence', ['next', dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.equal(h.parseKV(res.stdout).RUN_ID, 'run-008');
});

test('qa-evidence#003 — previous resolves the immediate numeric predecessor across both stores', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-002', 'final');
  makeRun(dir, 'run-004', 'final');
  makeRun(dir, 'run-005');
  const res = h.runScript('qa-evidence', ['previous', dir, 'run-005'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  const kv = h.parseKV(res.stdout);
  assert.equal(kv.PREVIOUS, 'run-004');
  assert.match(slash(kv.PREVIOUS_REPORT), /_tests\/final\/run-004\/qa-validation-004\.md$/);
});

test('qa-evidence#004 — working baseline keeps feature and subfeature counters independent', (t) => {
  const { base, dir } = feature(t);
  const sf1 = path.join(dir, 'subfeatures', 'SF01-first');
  const sf2 = path.join(dir, 'subfeatures', 'SF02-second');
  fs.mkdirSync(sf1, { recursive: true });
  fs.mkdirSync(sf2, { recursive: true });
  makeRun(sf1, 'run-003');
  makeRun(sf2, 'run-001');
  const res = h.runScript('qa-evidence', ['working-baseline', dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.equal(h.parseKV(res.stdout).BASELINE, 'SF01:run-003,SF02:run-001');
});

// ─── qa-evidence#005..#010 — validate ────────────────────────────────────────

test('qa-evidence#005 — mixed feature and subfeature baselines compare as canonical sets', (t) => {
  const { base, dir } = feature(t);
  const sf1 = path.join(dir, 'subfeatures', 'SF01-first');
  fs.mkdirSync(sf1, { recursive: true });
  makeRun(dir, 'run-002');
  makeRun(sf1, 'run-003');

  const validate = h.runScript(
    'qa-evidence',
    ['validate', dir, 'feature:run-002 · SF01:run-003'],
    { cwd: base },
  );
  assert.equal(validate.status, 0, validate.output);
  assert.match(validate.output, /SF01:run-003/);
  assert.match(validate.output, /feature:run-002/);

  const promote = h.runScript(
    'qa-evidence',
    ['promote', dir, 'feature:run-002,SF01:run-003'],
    { cwd: base },
  );
  assert.equal(promote.status, 0, promote.output);
  assert.equal(fs.existsSync(path.join(dir, '_tests', 'final', 'run-002', 'qa-validation-002.md')), true);
  assert.equal(fs.existsSync(path.join(sf1, '_tests', 'final', 'run-003', 'qa-validation-003.md')), true);
});

test('qa-evidence#006 — validate rejects a stale review baseline', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-003');
  const res = h.runScript('qa-evidence', ['validate', dir, 'feature:run-002'], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /differs from current working evidence/);
});

test('qa-evidence#007 — validate accepts valid frontmatter larger than a pipe buffer', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-001');
  const report = reportPath(dir, 'run-001');
  const lines = h.read(report).split('\n');
  lines.splice(2, 0, `context: ${'x'.repeat(131072)}`);
  h.write(report, lines.join('\n'));

  const res = h.runScript('qa-evidence', ['validate', dir, 'feature:run-001'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /STATUS=OK/);
});

test('qa-evidence#008 — validate rejects duplicate scope keys and malformed IDs', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-003');

  const dup = h.runScript(
    'qa-evidence',
    ['validate', dir, 'feature:run-003,feature:run-003'],
    { cwd: base },
  );
  assert.equal(dup.status, 1, dup.output);
  assert.match(dup.output, /Duplicate baseline scope/);

  const malformed = h.runScript('qa-evidence', ['validate', dir, 'feature:run-3'], { cwd: base });
  assert.equal(malformed.status, 1, malformed.output);
  assert.match(malformed.output, /Malformed baseline entry/);
});

test('qa-evidence#009 — validate rejects report number mismatches', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-003');
  const report = reportPath(dir, 'run-003');
  h.write(report, h.read(report).replace(/qa-validation-003/g, 'qa-validation-002'));
  const res = h.runScript('qa-evidence', ['validate', dir, 'feature:run-003'], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /number mismatch/);
});

test('qa-evidence#010 — validate rejects a schema-incomplete report', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-003');
  const report = reportPath(dir, 'run-003');
  h.write(
    report,
    h.read(report).split('\n').filter((l) => !/^judged-contract:/.test(l)).join('\n'),
  );
  const res = h.runScript('qa-evidence', ['validate', dir, 'feature:run-003'], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /field judged-contract/);
});

// ─── qa-evidence#011..#014 — promote ─────────────────────────────────────────

test('qa-evidence#011 — promote copies the complete run and retry is an idempotent no-op', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-003');

  const first = h.runScript('qa-evidence', ['promote', dir, 'feature:run-003'], { cwd: base });
  assert.equal(first.status, 0, first.output);
  const kv = h.parseKV(first.stdout);
  assert.equal(kv.ACTION, 'promoted');
  assert.equal(kv.REPORT_CREATED, '2026-08-17');
  assert.equal(kv.BLOCKER_COUNT, '1');
  assert.equal(fs.existsSync(path.join(dir, '_tests', 'final', 'run-003', 'screenshots', 'home.png')), true);
  assert.match(h.read(path.join(dir, '_tests', 'final', 'run-003', 'qa-validation-003.md')), /Open finding retained/);
  assert.equal(fs.existsSync(path.join(dir, '_tests', 'run-003', 'screenshots', 'home.png')), true);

  const second = h.runScript('qa-evidence', ['promote', dir, 'feature:run-003'], { cwd: base });
  assert.equal(second.status, 0, second.output);
  assert.equal(h.parseKV(second.stdout).ACTION, 'noop');
});

test('qa-evidence#012 — promote blocks an immutable destination conflict', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-003');
  makeRun(dir, 'run-003', 'final');
  h.write(path.join(dir, '_tests', 'final', 'run-003', 'screenshots', 'home.png'), 'different\n');
  const res = h.runScript('qa-evidence', ['promote', dir, 'feature:run-003'], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /Immutable final snapshot conflict/);
});

test('qa-evidence#013 — promote detects every immutable conflict before copying any scope', (t) => {
  const { base, dir } = feature(t);
  const sf1 = path.join(dir, 'subfeatures', 'SF01-first');
  const sf2 = path.join(dir, 'subfeatures', 'SF02-second');
  fs.mkdirSync(sf1, { recursive: true });
  fs.mkdirSync(sf2, { recursive: true });
  makeRun(sf1, 'run-001');
  makeRun(sf2, 'run-001');
  makeRun(sf2, 'run-001', 'final');
  h.write(path.join(sf2, '_tests', 'final', 'run-001', 'screenshots', 'home.png'), 'different\n');

  const res = h.runScript('qa-evidence', ['promote', dir, 'SF01:run-001,SF02:run-001'], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /Immutable final snapshot conflict/);
  assert.equal(fs.existsSync(path.join(sf1, '_tests', 'final', 'run-001')), false);
});

test('qa-evidence#014 — none baseline succeeds only when no working run exists', (t) => {
  const { base, dir } = feature(t);
  const none = h.runScript('qa-evidence', ['promote', dir, 'none'], { cwd: base });
  assert.equal(none.status, 0, none.output);
  assert.equal(h.parseKV(none.stdout).BASELINE, 'none');

  makeRun(dir, 'run-001');
  const withRun = h.runScript('qa-evidence', ['promote', dir, 'none'], { cwd: base });
  assert.equal(withRun.status, 1, withRun.output);
});

// ─── qa-evidence#015..#018 — limits, duplicates, containment ────────────────

test('qa-evidence#015 — next fails clearly at the supported run-999 limit', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-999', 'final');
  const res = h.runScript('qa-evidence', ['next', dir], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /run limit reached at run-999/);
});

test('qa-evidence#016 — duplicate normalized subfeature scopes fail loud', (t) => {
  const { base, dir } = feature(t);
  fs.mkdirSync(path.join(dir, 'subfeatures', 'SF01-first'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'subfeatures', 'SF01-duplicate'), { recursive: true });
  const res = h.runScript('qa-evidence', ['scopes', dir], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /Duplicate QA scope key/);
});

test('qa-evidence#017 — previous fails when the immediate predecessor directory has no report', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-001');
  fs.mkdirSync(path.join(dir, '_tests', 'run-002'), { recursive: true });
  const res = h.runScript('qa-evidence', ['previous', dir, 'run-003'], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /has no report/);
});

test('qa-evidence#018 — validate rejects a symlinked baseline source', (t) => {
  const { base, dir } = feature(t);
  makeRun(dir, 'run-001');
  const testsDir = path.join(dir, '_tests');
  fs.renameSync(path.join(testsDir, 'run-001'), path.join(testsDir, 'outside-run'));
  try {
    fs.symlinkSync(path.join(testsDir, 'outside-run'), path.join(testsDir, 'run-001'), 'dir');
  } catch {
    return t.skip('native symlinks unavailable');
  }
  if (!fs.lstatSync(path.join(testsDir, 'run-001')).isSymbolicLink()) {
    return t.skip('native symlinks unavailable');
  }
  const res = h.runScript('qa-evidence', ['validate', dir, 'feature:run-001'], { cwd: base });
  assert.equal(res.status, 1, res.output);
  assert.match(res.output, /must not be a symlink/);
});

// ─── qa-evidence#019 — ensure-ignore ─────────────────────────────────────────

test('qa-evidence#019 — ensure-ignore creates, normalizes, and reruns byte-identically', (t) => {
  const { base } = feature(t);
  const gitignore = path.join(base, '.gitignore');
  h.write(gitignore, 'node_modules/\n# ADD - managed by code-addiction\n.codeadd/\n# END ADD\n');

  const firstRun = h.runScript('qa-evidence', ['ensure-ignore', base], { cwd: base });
  assert.equal(firstRun.status, 0, firstRun.output);
  const first = h.read(gitignore);
  assert.match(first, /docs\/features\/\*\*\/_tests\/run-\*\//);
  assert.match(first, /# ADD - managed by code-addiction/);

  const secondRun = h.runScript('qa-evidence', ['ensure-ignore', base], { cwd: base });
  assert.equal(secondRun.status, 0, secondRun.output);
  assert.equal(h.read(gitignore), first);

  h.write(
    gitignore,
    `${first}\n# ADD QA evidence - managed by add.qa-setup\nwrong/\n# END ADD QA evidence\n`,
  );
  const thirdRun = h.runScript('qa-evidence', ['ensure-ignore', base], { cwd: base });
  assert.equal(thirdRun.status, 0, thirdRun.output);
  const normalized = h.read(gitignore);
  const starts = normalized.split('\n').filter((l) => l === '# ADD QA evidence - managed by add-qa-setup').length;
  assert.equal(starts, 1);
  assert.equal(normalized.includes('# ADD QA evidence - managed by add.qa-setup'), false);
  assert.equal(normalized.includes('wrong/'), false);
});
