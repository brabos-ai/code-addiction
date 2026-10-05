'use strict';
// =============================================================================
// converge-gates — native port of framwork/.codeadd/scripts/tests/converge-gates.bats
// =============================================================================
// Target: framwork/.codeadd/scripts/converge-gates.cjs (F27; intentionally Red
// until the native entry lands).
//
// Contract: five /add-done convergence gates. Statuses ok|missing|broken|
// not-probed, plus `skipped` on gate 2 only (a pass). REVIEW_SOURCE=build|
// review|none. Always exit 0; exit 2 only on CLI misuse. Read-only: never
// writes and never promotes.
//
// Run: node --test scripts/tests/converge-gates.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

/** Forward-slash a path fragment so Windows output still matches POSIX shapes. */
const slash = (s) => String(s).replace(/\\/g, '/');

function project(t) {
  const base = h.mkTmp('codeadd-converge-');
  t.after(() => h.rmrf(base));
  return base;
}

function replaceIn(file, from, to) {
  h.write(file, h.read(file).split(from).join(to));
}

function writeManifest(base, content) {
  h.write(path.join(base, '.codeadd', 'manifest.json'), content);
}

// ─── Fixtures mirrored from the Bats suite ───────────────────────────────────

function writeReview(dir, nnn, overall, baselineLine) {
  const lines = [
    `# Review ${nnn}: ${path.basename(dir)}`,
    '',
    `> **Date:** 2026-08-27 | **Branch:** feature/${path.basename(dir)}`,
  ];
  if (baselineLine) lines.push(baselineLine);
  lines.push(
    '',
    '## Quality Gate Report',
    '',
    '| Gate | Status | Details |',
    '|------|--------|---------|',
    '| Build | ✅ PASSED | build — 0 errors |',
    '| Spec Compliance | ✅ PASSED | 4/4 items compliant |',
    '| Code Review Score | ✅ PASSED | 9.0/10 |',
    '| Product Validation | ✅ PASSED | RF: 4/4, RN: 2/2 |',
    '| Validation Gates | ✅ PASSED | lint → exit 0 |',
    '| QA Judgement | ✅ PASSED | feature: run-001, 0 blockers |',
    `| **Overall** | **${overall}** | **Ready for merge** |`,
    '',
    '## Spec Compliance Audit',
    'All items compliant.',
    '',
    '## Code Review Summary',
    'No issues.',
    '',
    '## Product Validation',
    'RF01: met. RN01: met.',
    '',
    '## QA Judgement',
    'feature: run-001 — 0 blocker, 0 major, 0 minor, 0 polish.',
    '',
    '## Fix Routing',
    'none',
    '',
    '## Resolution Annex',
    '',
  );
  h.write(path.join(dir, `review-${nnn}.md`), lines.join('\n'));
}

function writePlanCoverage(dir, mode) {
  if (mode === 'absent-file') {
    fs.rmSync(path.join(dir, 'plan.md'), { force: true });
    return;
  }
  const lines = ['# Plan: Feature', ''];
  if (mode === 'absent-section') {
    lines.push('## Architecture Decisions', 'nothing coverage-related in this plan');
  } else {
    lines.push(
      '## Cobertura de Requisitos',
      '',
      '| Requisito | Coberto |',
      '|-----------|---------|',
      '| RF01 | ✅ |',
      mode === 'uncovered' ? '| RF02 | X |' : '| RF02 | ✅ |',
    );
  }
  h.write(path.join(dir, 'plan.md'), `${lines.join('\n')}\n`);
}

function writeEpic(dir, mode) {
  fs.mkdirSync(dir, { recursive: true });
  const lines = [
    '# Epic',
    '',
    '| SF | Name | Status | Notes |',
    '|----|------|--------|-------|',
    '| SF01 | Alpha | done | — |',
    mode === 'pending' ? '| SF02 | Beta | pending | — |' : '| SF02 | Beta | done | — |',
  ];
  h.write(path.join(dir, 'epic.md'), `${lines.join('\n')}\n`);
}

function writeSfTasks(dir, mode) {
  fs.mkdirSync(dir, { recursive: true });
  const lines = [
    '# Tasks: Subfeature',
    '',
    '## Metadata',
    '',
    '## Requirements Coverage',
    '- [x] RF01 — thing',
    '',
    '## TDD',
    '',
    '## Execution',
    '',
    '## Acceptance Checklist',
    '- [x] Route works (RF01)',
    mode === 'complete' ? '- [x] Service enforces rule (RF01)' : '- [ ] Service enforces rule (RF01)',
  ];
  h.write(path.join(dir, 'tasks.md'), `${lines.join('\n')}\n`);
}

function makeQaRun(scope, featureId, run) {
  const nnn = run.slice('run-'.length);
  const scopeValue = /^SF[0-9][0-9]-/.test(path.basename(scope))
    ? `[${path.basename(scope).slice(0, 4)}]`
    : '[]';
  const root = path.join(scope, '_tests', run);
  fs.mkdirSync(path.join(root, 'screenshots'), { recursive: true });
  const lines = [
    '---',
    `id: ${featureId}-qa-validation-${nnn}`,
    'type: qa-validation',
    'created: 2026-08-27',
    `feature: ${featureId}`,
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
    '| Blocker | 0 |',
    '| Major | 0 |',
    '| Minor | 0 |',
    '| Polish | 0 |',
    '## Coverage (contract-anchored, vs design.md)',
    'covered',
    '## Functional delivery (vs about.md)',
    'delivered',
    '## Findings',
    'none',
    '## Responsiveness',
    'clean',
    '## Accessibility',
    'clean',
    '## Fix Routing',
    'none',
    '## Clean screens',
    'home',
    '## Not covered / caveats',
    'none',
    '',
  ].join('\n');
  h.write(path.join(root, `qa-validation-${nnn}.md`), lines);
  h.write(path.join(root, 'screenshots', 'home.png'), `png-${run}\n`);
}

/** A fully well-formed feature directory; returns its repo-relative path. */
function buildOkTree(base, id) {
  const rel = path.join('docs', 'features', id);
  const abs = path.join(base, rel);
  fs.mkdirSync(abs, { recursive: true });
  makeQaRun(abs, id.split('-')[0], 'run-001');
  writeReview(abs, '001', '✅ PASSED', '> **QA baseline:** feature:run-001');
  writePlanCoverage(abs, 'covered');
  writeEpic(abs, 'all-done');
  return rel;
}

function writeReviewDetail(dir, nnn, overall, baseline, details) {
  const lines = ['# Review ' + nnn, ''];
  if (baseline) lines.push(baseline);
  lines.push(
    '',
    '| Gate | Status | Details |',
    '|------|--------|---------|',
    `| **Overall** | **${overall}** | ${details} |`,
    '',
    '## Fix Routing',
    '',
  );
  h.write(path.join(dir, `review-${nnn}.md`), lines.join('\n'));
}

function writeEpicBlindspot(dir, mode) {
  fs.mkdirSync(dir, { recursive: true });
  const lines = [
    '# Epic',
    '',
    '| SF | Name | Status | Notes |',
    '|----|------|--------|-------|',
    '| SF01 | Alpha | done | — |',
    mode === 'notes-done' ? '| SF02 | Beta | pending | done |' : '| SF02 | done | pending | — |',
  ];
  h.write(path.join(dir, 'epic.md'), `${lines.join('\n')}\n`);
}

function writeExecTasks(dir, ids) {
  fs.mkdirSync(dir, { recursive: true });
  const lines = [
    '# Tasks',
    '',
    '## Metadata',
    '',
    '## Requirements Coverage',
    '- [x] RF01 — thing',
    '',
    '## TDD',
    '- [ ] T-TEST-01 a test id that is NOT an Execution task',
    '',
    '## Execution',
  ];
  for (const id of ids) {
    lines.push(
      `- [ ] ${id} does a thing`,
      '  - Service: backend',
      '  - Files: `src/a.ts`',
      '  - Deps: -',
      '  - Consumes: -',
      '  - Produces: -',
      '  - Verify: tests pass',
    );
  }
  lines.push('', '## Acceptance Checklist', '- [x] Route works (RF01)', '', '## Quality Gates');
  h.write(path.join(dir, 'tasks.md'), `${lines.join('\n')}\n`);
}

function writeLedger(dir, ids) {
  fs.mkdirSync(dir, { recursive: true });
  const lines = [`# Build ledger — feature: ${path.basename(dir)} — plan: plan.md`, ''];
  for (const id of ids) lines.push(`${id}: complete (commits a1b2c3d..b4c5d6e, review clean)`);
  h.write(path.join(dir, 'build-ledger.md'), `${lines.join('\n')}\n`);
}

function writeFinalReview(dir, verdict, suggestions = []) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'build-ledger.md');
  let prefix = '';
  if (!fs.existsSync(file)) prefix = `# Build ledger — feature: ${path.basename(dir)}\n`;
  let body = `Final review: ${verdict}\n`;
  for (const s of suggestions) body += `Blocker suggestion: ${s}\n`;
  fs.appendFileSync(file, prefix + body);
}

function snapshotTree(root) {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else out[slash(path.relative(root, full))] = fs.readFileSync(full).toString('binary');
    }
  };
  walk(root);
  return out;
}

// ─── Gate 1 — review verdict ─────────────────────────────────────────────────

test('converge-gates#001 — gate 1: no review file at all → GATE_REVIEW=missing', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0020F-noreview');
  fs.mkdirSync(path.join(base, dir), { recursive: true });
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=missing/);
});

test('converge-gates#002 — gate 1: review exists but Overall is BLOCKED → GATE_REVIEW=broken', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0021F-blocked');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReview(abs, '001', '❌ BLOCKED', '> **QA baseline:** none');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
  assert.match(res.output, /GATE_REVIEW_DETAIL=/);
});

test('converge-gates#003 — gate 1: review exists and Overall is PASSED → GATE_REVIEW=ok', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0022F-passed');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(slash(res.output), /REVIEW_PATH=.*review-001\.md/);
});

test('converge-gates#004 — gate 1: the highest-numbered review is the one evaluated', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0023F-highest');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReview(abs, '001', '❌ BLOCKED', '> **QA baseline:** none');
  writeReview(abs, '002', '✅ PASSED', '> **QA baseline:** none');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(slash(res.output), /REVIEW_PATH=.*review-002\.md/);
});

// ─── Gate 2 — QA baseline ────────────────────────────────────────────────────

test('converge-gates#005 — L2: canonical feature:run-001 baseline with a schema-valid report → GATE_QA_BASELINE=ok', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0012F-canonical');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
  assert.match(res.output, /BASELINE=feature:run-001/);
});

test('converge-gates#006 — L2: path-form baseline is rejected and translated to broken', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0010F-pathform');
  const abs = path.join(base, dir);

  const direct = h.runScript('qa-evidence', ['validate', abs, '_tests/run-001'], { cwd: base });
  assert.notEqual(direct.status, 0, direct.output);
  assert.match(direct.output, /STATUS=ERROR/);
  assert.match(direct.output, /Malformed baseline entry/);

  replaceIn(path.join(abs, 'review-001.md'), 'feature:run-001', '_tests/run-001');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_QA_BASELINE=broken/);
  assert.match(res.output, /GATE_QA_BASELINE_DETAIL=.*Malformed baseline entry/);
});

test('converge-gates#007 — L2: baseline correct but report absent, translated to broken', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0011F-noreport');
  const abs = path.join(base, dir);
  fs.mkdirSync(path.join(abs, '_tests', 'run-001'), { recursive: true });
  writeReview(abs, '001', '✅ PASSED', '> **QA baseline:** feature:run-001');

  const direct = h.runScript('qa-evidence', ['validate', abs, 'feature:run-001'], { cwd: base });
  assert.notEqual(direct.status, 0, direct.output);
  assert.match(direct.output, /STATUS=ERROR/);
  assert.match(direct.output, /Missing source report/);

  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_QA_BASELINE=broken/);
  assert.match(res.output, /GATE_QA_BASELINE_DETAIL=.*Missing source report/);
});

test('converge-gates#008 — L2: none baseline with qa-pipeline disabled → ok, not broken', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0013F-nobaseline');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReview(abs, '001', '✅ PASSED', '> **QA baseline:** none');
  writeManifest(base, '{"features":{"qa-pipeline":false}}');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
  assert.match(res.output, /BASELINE=none/);
  assert.match(res.output, /QA_FEATURE_STATE=false/);
});

test('converge-gates#009 — L2: report present but schema-invalid → broken, naming the missing section', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0014F-badschema');
  const abs = path.join(base, dir);
  const report = path.join(abs, '_tests', 'run-001', 'qa-validation-001.md');
  replaceIn(report, '## Accessibility\n', '');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_QA_BASELINE=broken/);
  assert.match(res.output, /GATE_QA_BASELINE_DETAIL=.*Accessibility/);
});

test('converge-gates#010 — L2: review with no QA baseline line at all → GATE_QA_BASELINE=missing', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0015F-nolineatall');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReview(abs, '001', '✅ PASSED', '');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_QA_BASELINE=missing/);
});

// ─── Gate 3 — epic completeness ──────────────────────────────────────────────

test('converge-gates#011 — gate 3: no epic.md at all → GATE_EPIC=ok', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0030F-noepic');
  fs.mkdirSync(path.join(base, dir), { recursive: true });
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=ok/);
  assert.doesNotMatch(res.output, /GATE_EPIC=not-probed/);
  assert.doesNotMatch(res.output, /GATE_EPIC=broken/);
});

test('converge-gates#012 — gate 3: epic.md with every subfeature done → GATE_EPIC=ok', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0031F-alldone');
  writeEpic(path.join(base, dir), 'all-done');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=ok/);
});

test('converge-gates#013 — gate 3: epic.md with a pending subfeature → broken, naming it', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0032F-pending');
  writeEpic(path.join(base, dir), 'pending');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=broken/);
  assert.match(res.output, /EPIC_PENDING=.*SF02/);
});

test('converge-gates#014 — gate 3 scoped: SFxx tasks complete overrides epic pending row → ok', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0033F-scopedok');
  const abs = path.join(base, dir);
  writeEpic(abs, 'pending');
  writeSfTasks(path.join(abs, 'subfeatures', 'SF02-beta'), 'complete');
  const res = h.runScript('converge-gates', [dir, 'SF02'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=ok/);
});

test('converge-gates#015 — gate 3 scoped: SFxx tasks incomplete → broken even if epic says done', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0034F-scopedbroken');
  const abs = path.join(base, dir);
  writeEpic(abs, 'all-done');
  writeSfTasks(path.join(abs, 'subfeatures', 'SF02-beta'), 'incomplete');
  const res = h.runScript('converge-gates', [dir, 'SF02'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=broken/);
});

// ─── Adversarial round ───────────────────────────────────────────────────────

test('converge-gates#016 — C1: BLOCKED verdict whose Details says PASSED must not pass gate 1', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0040F-c1');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReviewDetail(abs, '001', '❌ BLOCKED', '> **QA baseline:** none', '5/6 gates PASSED — Code Review BLOCKED');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
});

test('converge-gates#017 — C1b: NOT PASSED must not pass gate 1', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0041F-c1b');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReviewDetail(abs, '001', '❌ NOT PASSED', '> **QA baseline:** none', 'blocked on review');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_REVIEW=broken/);
});

test('converge-gates#018 — C2: a prose line mentioning Overall must not be read as the verdict row', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0042F-c2');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  h.write(
    path.join(abs, 'review-001.md'),
    [
      '# Review 001',
      '> **QA baseline:** none',
      '',
      '**Overall** the build PASSED but product validation did not.',
      '',
      '| Gate | Status | Details |',
      '|------|--------|---------|',
      '| **Overall** | **❌ BLOCKED** | product validation failed |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_REVIEW=broken/);
});

test('converge-gates#019 — C3: plan.md in add.plan STEP 10 shape must not block gate 4', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0043F-c3');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  h.write(
    path.join(abs, 'plan.md'),
    [
      '# Plan',
      '',
      '## Tasks',
      '',
      '| ID | Requirement | Covered? | Feature/Area | Tasks |',
      '|----|-------------|----------|--------------|-------|',
      '| RF01 | User creates account | YES | Backend | 1.1 |',
      '| RF05 | Admin toggle RLS | EXCLUDED | - | Out of scope |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_COVERAGE=ok/);
  assert.doesNotMatch(res.output, /GATE_COVERAGE=missing/);
});

test('converge-gates#020 — C3b: plan.md with NO coverage table must not block', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0044F-c3b');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  h.write(path.join(abs, 'plan.md'), '# Plan\n\n## Architecture Decisions\nnothing coverage-related\n');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_COVERAGE=ok/);
});

test('converge-gates#021 — C4: NO and ❌ in the Covered? column count as uncovered', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0045F-c4');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  h.write(
    path.join(abs, 'plan.md'),
    [
      '| ID | Requirement | Covered? | Feature/Area | Tasks |',
      '|----|-------------|----------|--------------|-------|',
      '| RF01 | ok one | YES | Backend | 1.1 |',
      '| RF05 | Admin toggle RLS | NO | - | none |',
      '| RF06 | Bulk export | ❌ | - | none |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_COVERAGE=broken/);
  assert.match(res.output, /COVERAGE_UNCOVERED=2/);
});

test('converge-gates#022 — C5: a tasks.md with no Acceptance Checklist is not a silent pass', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0046F-c5');
  const abs = path.join(base, dir);
  writeEpic(abs, 'pending');
  h.write(path.join(abs, 'subfeatures', 'SF02-beta', 'tasks.md'), '# Tasks\n\n## Execution\nnothing here\n');
  const res = h.runScript('converge-gates', [dir, 'SF02'], { cwd: base });
  assert.match(res.output, /GATE_EPIC=broken/);
});

test('converge-gates#023 — C5b: star bullets and indented boxes are still counted', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0047F-c5b');
  const abs = path.join(base, dir);
  writeEpic(abs, 'pending');
  h.write(
    path.join(abs, 'subfeatures', 'SF02-beta', 'tasks.md'),
    '# Tasks\n\n## Acceptance Checklist\n* [x] one\n  - [ ] nested unchecked\n',
  );
  const res = h.runScript('converge-gates', [dir, 'SF02'], { cwd: base });
  assert.match(res.output, /GATE_EPIC=broken/);
});

test('converge-gates#024 — C6a: a second table below the Subfeatures table must not poison gate 3', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0048F-c6a');
  h.write(
    path.join(base, dir, 'epic.md'),
    [
      '## Subfeatures',
      '| SF | Name | Status |',
      '|----|------|--------|',
      '| SF01 | Alpha | done |',
      '| SF02 | Beta | done |',
      '',
      '## Notes',
      '| SF | Depends on |',
      '|----|------------|',
      '| SF02 | SF01 |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_EPIC=ok/);
});

test('converge-gates#025 — C6b: an unrelated earlier Status column must not hijack the header index', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0049F-c6b');
  h.write(
    path.join(base, dir, 'epic.md'),
    [
      '## Environments',
      '| Env | Status |',
      '|-----|--------|',
      '| staging | up |',
      '',
      '## Subfeatures',
      '| SF | Name | Status |',
      '|----|------|--------|',
      '| SF01 | Alpha | done |',
      '| SF02 | Beta | pending |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_EPIC=broken/);
  assert.match(res.output, /EPIC_PENDING=SF02/);
  assert.doesNotMatch(res.output, /EPIC_PENDING=SF01/);
});

test('converge-gates#026 — C6c: the id column is resolved by header, not assumed first', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0050F-c6c');
  h.write(
    path.join(base, dir, 'epic.md'),
    [
      '| Name | SF | Status |',
      '|------|----|--------|',
      '| Alpha | SF01 | done |',
      '| Beta | SF02 | pending |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_EPIC=broken/);
  assert.match(res.output, /SF02/);
});

test('converge-gates#027 — C7: gate 4 is fence-aware — a fenced example is not a real uncovered row', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0051F-c7');
  h.write(
    path.join(base, dir, 'plan.md'),
    [
      '## Cobertura de Requisitos',
      '| Requisito | Coberto |',
      '|-----------|---------|',
      '| RF01 | ✅ |',
      '',
      '```markdown',
      '| RF99 | X |',
      '```',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_COVERAGE=ok/);
});

test('converge-gates#028 — S1: an epic-wide run aggregates the SUBFEATURE plans for coverage', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0054F-s1');
  const abs = path.join(base, dir);
  writeEpic(abs, 'all-done');
  h.write(
    path.join(abs, 'subfeatures', 'SF01-alpha', 'plan.md'),
    '| ID | Requirement | Covered? |\n|----|---|---|\n| RF01 | a | YES |\n',
  );
  h.write(
    path.join(abs, 'subfeatures', 'SF02-beta', 'plan.md'),
    '| ID | Requirement | Covered? |\n|----|---|---|\n| RF02 | b | YES |\n',
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_COVERAGE=ok/);
  assert.doesNotMatch(res.output, /GATE_COVERAGE=missing/);
});

test('converge-gates#029 — S2: an epic-wide run reports an uncovered requirement from ANY subfeature plan', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0055F-s2');
  const abs = path.join(base, dir);
  writeEpic(abs, 'all-done');
  h.write(
    path.join(abs, 'subfeatures', 'SF01-alpha', 'plan.md'),
    '| ID | Requirement | Covered? |\n|----|---|---|\n| RF01 | a | YES |\n',
  );
  h.write(
    path.join(abs, 'subfeatures', 'SF02-beta', 'plan.md'),
    '| ID | Requirement | Covered? |\n|----|---|---|\n| RF02 | b | NO |\n',
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.match(res.output, /GATE_COVERAGE=broken/);
  assert.match(res.output, /COVERAGE_UNCOVERED=1/);
});

test('converge-gates#030 — C8: a subfeature-scoped run reads the SUBFEATURE plan.md', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0053F-c8');
  const abs = path.join(base, dir);
  writeEpic(abs, 'pending');
  writeSfTasks(path.join(abs, 'subfeatures', 'SF02-beta'), 'complete');
  h.write(
    path.join(abs, 'subfeatures', 'SF02-beta', 'plan.md'),
    '| ID | Requirement | Covered? |\n|----|-------------|----------|\n| RF01 | thing | YES |\n',
  );
  const res = h.runScript('converge-gates', [dir, 'SF02'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_COVERAGE=ok/);
  assert.doesNotMatch(res.output, /GATE_COVERAGE=missing/);
});

test('converge-gates#031 — M2: an empty SF argument is CLI misuse, exit 2', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0052F-m2');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeEpic(abs, 'all-done');
  const res = h.runScript('converge-gates', [dir, ''], { cwd: base });
  assert.equal(res.status, 2, res.output);
});

// ─── Gate 3 (F19) — status by header, not by string —────────────────────────

test('converge-gates#032 — F19 blind spot 1: a Notes cell reading done must not pass a pending row', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0035F-notesdone');
  writeEpicBlindspot(path.join(base, dir), 'notes-done');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=broken/);
  assert.match(res.output, /EPIC_PENDING=.*SF02/);
});

test('converge-gates#033 — F19 blind spot 2: a subfeature NAMED done must not pass while pending', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0036F-namedone');
  writeEpicBlindspot(path.join(base, dir), 'name-done');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=broken/);
  assert.match(res.output, /EPIC_PENDING=.*SF02/);
});

test('converge-gates#034 — F19: status resolved by header name, not by column position', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0037F-reordered');
  h.write(
    path.join(base, dir, 'epic.md'),
    [
      '# Epic',
      '',
      '| SF | Status | Name | Objective |',
      '|----|--------|------|-----------|',
      '| SF01 | done | Alpha | build alpha |',
      '| SF02 | pending | Beta | build beta |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=broken/);
  assert.match(res.output, /EPIC_PENDING=.*SF02/);
});

test('converge-gates#035 — F19 legacy: a done row carrying the extra checkpoint cell still reads done', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0038F-legacycheckpoint');
  h.write(
    path.join(base, dir, 'epic.md'),
    [
      '# Epic',
      '',
      '| SF | Name | Objective | Status |',
      '|----|------|-----------|--------|',
      '| SF01 | Alpha | build alpha | done | 0038F-SF01-done |',
      '| SF02 | Beta | build beta | done | 0038F-SF02-done |',
      '',
    ].join('\n'),
  );
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_EPIC=ok/);
});

// ─── Gate 4 — requirements coverage ──────────────────────────────────────────

test('converge-gates#036 — gate 4: Cobertura with zero uncovered rows → ok', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0040F-covered');
  writePlanCoverage(path.join(base, dir), 'covered');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_COVERAGE=ok/);
  assert.match(res.output, /COVERAGE_UNCOVERED=0/);
});

test('converge-gates#037 — gate 4: Cobertura with an uncovered row → broken', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0041F-uncovered');
  writePlanCoverage(path.join(base, dir), 'uncovered');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_COVERAGE=broken/);
  assert.match(res.output, /COVERAGE_UNCOVERED=1/);
});

test('converge-gates#038 — gate 4: plan.md with no coverage table is ok, not missing', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0026F-nosection');
  writePlanCoverage(path.join(base, dir), 'absent-section');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_COVERAGE=ok/);
  assert.doesNotMatch(res.output, /GATE_COVERAGE=missing/);
});

test('converge-gates#039 — gate 4: no plan.md at all → GATE_COVERAGE=missing', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0043F-noplan');
  fs.mkdirSync(path.join(base, dir), { recursive: true });
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_COVERAGE=missing/);
});

// ─── Well-formed tree + gate isolation ───────────────────────────────────────

test('converge-gates#040 — L1: a well-formed tree passes all five gates, GATES_OK=5/5', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0050F-wellformed');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
  assert.match(res.output, /GATE_EPIC=ok/);
  assert.match(res.output, /GATE_COVERAGE=ok/);
  assert.match(res.output, /GATE_LEDGER=ok/);
  assert.match(res.output, /GATES_OK=5\/5/);
});

test('converge-gates#041 — isolation: damaging only the review gate flips GATE_REVIEW', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0051F-isoreview');
  replaceIn(path.join(base, dir, 'review-001.md'), '**✅ PASSED**', '**❌ BLOCKED**');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
  assert.match(res.output, /GATE_EPIC=ok/);
  assert.match(res.output, /GATE_COVERAGE=ok/);
});

test('converge-gates#042 — isolation: damaging only the baseline gate flips GATE_QA_BASELINE', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0052F-isobaseline');
  replaceIn(path.join(base, dir, 'review-001.md'), 'feature:run-001', '_tests/run-001');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(res.output, /GATE_QA_BASELINE=broken/);
  assert.match(res.output, /GATE_EPIC=ok/);
  assert.match(res.output, /GATE_COVERAGE=ok/);
});

test('converge-gates#043 — isolation: damaging only the epic gate flips GATE_EPIC', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0053F-isoepic');
  replaceIn(path.join(base, dir, 'epic.md'), 'Beta | done', 'Beta | pending');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
  assert.match(res.output, /GATE_EPIC=broken/);
  assert.match(res.output, /GATE_COVERAGE=ok/);
});

test('converge-gates#044 — isolation: damaging only the coverage gate flips GATE_COVERAGE', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0054F-isocoverage');
  replaceIn(path.join(base, dir, 'plan.md'), '| RF02 | ✅ |', '| RF02 | X |');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
  assert.match(res.output, /GATE_EPIC=ok/);
  assert.match(res.output, /GATE_COVERAGE=broken/);
});

test('converge-gates#045 — GATES_OK reflects a partial pass count on a mixed tree', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0081F-summarypartial');
  replaceIn(path.join(base, dir, 'review-001.md'), '**✅ PASSED**', '**❌ BLOCKED**');
  replaceIn(path.join(base, dir, 'epic.md'), 'Beta | done', 'Beta | pending');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATES_OK=3\/5/);
});

// ─── not-probed vocabulary + total failure ───────────────────────────────────

test('converge-gates#046 — no gate ever returns not-probed, even on a completely empty feature dir', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0060F-empty');
  fs.mkdirSync(path.join(base, dir), { recursive: true });
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.doesNotMatch(res.output, /=not-probed/);
  assert.match(res.output, /GATE_REVIEW=missing/);
  assert.match(res.output, /GATE_QA_BASELINE=missing/);
  assert.match(res.output, /GATE_EPIC=ok/);
  assert.match(res.output, /GATE_COVERAGE=missing/);
});

test('converge-gates#047 — exit 0 on total failure — diagnosis is never a gate', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0061F-totalfail');
  fs.mkdirSync(path.join(base, dir), { recursive: true });
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATES_OK=\d\/5/);
});

// ─── QA_FEATURE_STATE — raw manifest passthrough ─────────────────────────────

test('converge-gates#048 — QA_FEATURE_STATE=no-manifest when manifest is absent', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0070F-nomanifest');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=no-manifest/);
});

test('converge-gates#049 — QA_FEATURE_STATE is the raw manifest value and never influences a gate', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0071F-truestate');
  writeManifest(base, '{"features":{"qa-pipeline":true}}');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=true/);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
});

test('converge-gates#050 — QA_FEATURE_STATE=unset when manifest has no qa-pipeline key', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0072F-unsetstate');
  writeManifest(base, '{"version":"0.0.0","providers":["claude"]}');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=unset/);
});

// ─── CLI contract ────────────────────────────────────────────────────────────

test('converge-gates#051 — CLI misuse: no arguments → exit 2 with usage', (t) => {
  const base = project(t);
  const res = h.runScript('converge-gates', [], { cwd: base });
  assert.equal(res.status, 2, res.output);
  assert.match(res.output, /Usage/);
});

test('converge-gates#052 — CLI misuse: non-existent FEATURE_DIR → exit 2 with usage', (t) => {
  const base = project(t);
  const res = h.runScript('converge-gates', ['docs/features/9999Z-does-not-exist'], { cwd: base });
  assert.equal(res.status, 2, res.output);
  assert.match(res.output, /Usage/);
});

// ─── No writes, ever ─────────────────────────────────────────────────────────

test('converge-gates#053 — performs no writes: the tree is byte-identical before and after', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0090F-nowrite');
  const abs = path.join(base, dir);
  replaceIn(path.join(abs, 'review-001.md'), '**✅ PASSED**', '**❌ BLOCKED**');
  const before = snapshotTree(abs);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.deepEqual(snapshotTree(abs), before);
});

test('converge-gates#054 — never leaks promote output and never creates _tests/final', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0091F-nopromote');
  const abs = path.join(base, dir);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.doesNotMatch(res.output, /ACTION=promoted/);
  assert.doesNotMatch(res.output, /ACTION=noop/);
  assert.equal(fs.existsSync(path.join(abs, '_tests', 'final')), false);
});

// ─── Gate 5 — build ledger ───────────────────────────────────────────────────

test('converge-gates#055 — gate 5: no tasks.md in scope → GATE_LEDGER=ok, reason stated', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0060F-noledgertasks');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_LEDGER=ok/);
  assert.match(res.output, /GATE_LEDGER_DETAIL=.*tasks\.md/);
});

test('converge-gates#056 — gate 5: tasks.md present, no ledger → missing, naming the path', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0061F-noledger');
  writeExecTasks(path.join(base, dir), ['T01', 'T02']);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_LEDGER=missing/);
  assert.match(res.output, /build-ledger\.md/);
});

test('converge-gates#057 — gate 5: every Execution task carries a complete line → ok', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0062F-ledgerok');
  writeExecTasks(path.join(base, dir), ['T01', 'T02']);
  writeLedger(path.join(base, dir), ['T01', 'T02']);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_LEDGER=ok/);
});

test('converge-gates#058 — gate 5: a task with no complete line → broken, naming that id', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0063F-ledgerbroken');
  writeExecTasks(path.join(base, dir), ['T01', 'T02', 'T03']);
  writeLedger(path.join(base, dir), ['T01', 'T03']);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_LEDGER=broken/);
  assert.match(res.output, /T02/);
});

test('converge-gates#059 — gate 5: a TDD id is never mistaken for an Execution task', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0064F-tddid');
  writeExecTasks(path.join(base, dir), ['T01']);
  writeLedger(path.join(base, dir), ['T01']);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_LEDGER=ok/);
});

test('converge-gates#060 — gate 5 scoped: SFxx given → the SF-level ledger is the one read', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0065F-sfledger');
  const sfdir = path.join(base, dir, 'subfeatures', 'SF01-thing');
  writeExecTasks(sfdir, ['T01']);
  writeLedger(path.join(base, dir), ['T01']);
  const res = h.runScript('converge-gates', [dir, 'SF01'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_LEDGER=missing/);
});

test('converge-gates#061 — gate 5: the summary counts five gates', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0066F-five');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATES_OK=5\/5/);
});

// ─── Gate 1 — the build's own final review ───────────────────────────────────

test('converge-gates#062 — final review L1.1: passed line, no review → ok, source build, baseline skipped', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0070F-buildpassed');
  const abs = path.join(base, dir);
  writeFinalReview(abs, 'passed (after review-000)');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(res.output, /REVIEW_SOURCE=build/);
  assert.match(res.output, /GATE_QA_BASELINE=skipped/);
  assert.match(res.output, /(^|\n)BASELINE=none/);
});

test('converge-gates#063 — final review L1.2: ruled N counts as ok', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0071F-buildruled');
  writeFinalReview(path.join(base, dir), 'ruled 2 (after review-000)');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(res.output, /REVIEW_SOURCE=build/);
});

test('converge-gates#064 — final review L1.2: blocked N → broken, detail carries verdict and suggestions', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0072F-buildblocked');
  writeFinalReview(path.join(base, dir), 'blocked 1 (after review-000)', ['F-B1 — /add.build F0072F']);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
  assert.match(res.output, /REVIEW_SOURCE=build/);
  assert.match(res.output, /GATE_REVIEW_DETAIL=.*blocked 1.*F-B1 — \/add\.build F0072F/);
});

test('converge-gates#065 — final review L1.3: line names review-002 and review-002 is BLOCKED → build decides', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0073F-buildnewer');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReview(abs, '002', '❌ BLOCKED', '> **QA baseline:** none');
  writeFinalReview(abs, 'passed (after review-002)');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
  assert.match(res.output, /REVIEW_SOURCE=build/);
});

test('converge-gates#066 — final review L1.4: a review numbered above the line decides', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0074F-reviewnewer');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeFinalReview(abs, 'passed (after review-002)');
  writeReview(abs, '003', '❌ BLOCKED', '> **QA baseline:** none');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
  assert.match(res.output, /REVIEW_SOURCE=review/);
  assert.match(slash(res.output), /REVIEW_PATH=.*review-003\.md/);
  assert.doesNotMatch(res.output, /GATE_QA_BASELINE=skipped/);
});

test('converge-gates#067 — final review L1.5: no line and no review → missing, source none', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0075F-nothing');
  fs.mkdirSync(path.join(base, dir), { recursive: true });
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=missing/);
  assert.match(res.output, /REVIEW_SOURCE=none/);
});

test('converge-gates#068 — final review L1.5b: a review and no line → REVIEW_SOURCE=review', (t) => {
  const base = project(t);
  const dir = buildOkTree(base, '0076F-reviewonly');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /REVIEW_SOURCE=review/);
  assert.match(res.output, /GATE_QA_BASELINE=ok/);
});

test('converge-gates#069 — final review L1.6: SFxx scope reads the subfeature ledger', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0077F-sfscope');
  const abs = path.join(base, dir);
  fs.mkdirSync(path.join(abs, 'subfeatures', 'SF01-thing'), { recursive: true });
  writeFinalReview(abs, 'passed (after review-000)');
  writeFinalReview(path.join(abs, 'subfeatures', 'SF01-thing'), 'blocked 1 (after review-000)', ['X — /add.build F0077F']);
  const res = h.runScript('converge-gates', [dir, 'SF01'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
  assert.match(res.output, /REVIEW_SOURCE=build/);
});

test('converge-gates#070 — final review: the LAST Final review line is operative', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0078F-lastline');
  const abs = path.join(base, dir);
  writeFinalReview(abs, 'blocked 1 (after review-000)', ['X — /add.build F0078F']);
  writeFinalReview(abs, 'passed (after review-000)');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=ok/);
});

test('converge-gates#071 — final review: a build-verdict tree with other gates ok reaches GATES_OK=5/5', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0079F-fivebuild');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writePlanCoverage(abs, 'covered');
  writeFinalReview(abs, 'ruled 1 (after review-000)');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATES_OK=5\/5/);
});

test('converge-gates#072 — final review: a line with no (after review-NNN) is broken, never ok', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0080F-malformed');
  h.write(path.join(base, dir, 'build-ledger.md'), '# L\nFinal review: passed\n');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
  assert.match(res.output, /GATE_REVIEW_DETAIL=Malformed/);
});

test('converge-gates#073 — final review: an unknown verdict word is broken, never ok', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0081F-badword');
  writeFinalReview(path.join(base, dir), 'approved (after review-000)');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW=broken/);
});

test('converge-gates#074 — final review: only the last blocked verdict suggestions reach the detail', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0082F-manysugg');
  const abs = path.join(base, dir);
  writeFinalReview(abs, 'blocked 1 (after review-000)', ['OLD-1 — /add.build F0082F']);
  writeFinalReview(abs, 'blocked 2 (after review-000)', ['FR-1 — /add.build F0082F', 'FR-2 — /add.plan F0082F']);
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /GATE_REVIEW_DETAIL=.*FR-1 — \/add\.build F0082F.*FR-2 — \/add\.plan F0082F/);
  assert.doesNotMatch(res.output, /OLD-1/);
});

test('converge-gates#075 — final review: review-008 is compared in base ten, not octal', (t) => {
  const base = project(t);
  const dir = path.join('docs', 'features', '0083F-octal');
  const abs = path.join(base, dir);
  fs.mkdirSync(abs, { recursive: true });
  writeReview(abs, '009', '❌ BLOCKED', '> **QA baseline:** none');
  writeFinalReview(abs, 'passed (after review-008)');
  const res = h.runScript('converge-gates', [dir], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /REVIEW_SOURCE=review/);
});
