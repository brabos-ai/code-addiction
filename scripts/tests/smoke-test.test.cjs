'use strict';
// =============================================================================
// scripts/smoke-test.cjs — seam characterization (F27 red → F30 green)
// =============================================================================
// Ports every scenario of `scripts/smoke-test.sh` (read in full). The shell
// file exists because 54 green unit tests missed three SEAM defects that one run
// against a throwaway git repo found. Each scenario is named for the defect it
// guards, and that naming is preserved here:
//
//   S1  a multi-pathspec `git add` aborts on the first absent path, losing the
//       epic.md row flip; the guarded per-path loop skips absent, stages present
//   S2  `git push --follow-tags` silently skips a LIGHTWEIGHT tag; an annotated
//       tag pushed by name reaches the remote
//   S3  the epic.md row flip lives INSIDE the commit the checkpoint tag points at
//   S4  converge-gates finds the SUBFEATURE plan.md on a scoped run
//   S5  an epic-wide run aggregates coverage from the subfeature plans
//   S6  status and converge-gates agree about the same epic.md, even when a
//       Notes cell happens to read `done`
//
// S1–S3 are git mechanics and run today. S4–S6 and the end-to-end smoke runner
// consume the NATIVE `status`/`converge-gates` entries — they are the mapped
// seam and are Red until F8/F14/F30 land. That is the point: the seam is a test,
// not a promise.
//
// ⛔ NO REAL REMOTE. Every fixture is a disposable repository; the S2 remote is
//    a local bare directory.
//
// Run: node --test scripts/tests/smoke-test.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

// --- fixtures (mirror build_epic / new_repo in smoke-test.sh) ----------------

function coverageTable(id, requirement, covered) {
  return [
    '| ID | Requirement | Covered? |',
    '|----|-------------|----------|',
    `| ${id} | ${requirement} | ${covered} |`,
    '',
  ].join('\n');
}

/**
 * A realistic epic tree, where /add-plan really puts things: epic.md at the
 * feature root, plan.md and tasks.md inside each subfeature.
 */
function buildEpic(repo, id, sfStatus, covered) {
  const fd = `docs/features/${id}`;
  const abs = (...parts) => path.join(repo, ...parts);
  h.write(abs(fd, 'epic.md'), [
    '# Epic',
    '',
    '| SF | Name | Objective | Status | checkpoint |',
    '|----|------|-----------|--------|-----------|',
    `| SF01 | Alpha | a | done | ${id}-SF01-done |`,
    `| SF02 | Beta | b | ${sfStatus} | |`,
    '',
  ].join('\n'));
  h.write(abs(fd, 'subfeatures', 'SF01-alpha', 'plan.md'), coverageTable('RF01', 'alpha thing', 'YES'));
  h.write(abs(fd, 'subfeatures', 'SF02-beta', 'plan.md'), coverageTable('RF02', 'beta thing', covered));
  h.write(
    abs(fd, 'subfeatures', 'SF02-beta', 'tasks.md'),
    '# Tasks\n\n## Acceptance Checklist\n- [x] one\n* [x] two\n',
  );
  h.write(abs(fd, 'review-001.md'), [
    '# Review',
    '',
    '> **QA baseline:** none',
    '',
    '| Gate | Status | Details |',
    '|---|---|---|',
    '| **Overall** | **PASSED** | 6/6 gates PASSED |',
    '',
    '## Fix Routing',
    'none',
    '',
  ].join('\n'));
  return fd;
}

function stagedCount(r, rel) {
  return r
    .git('diff', '--cached', '--name-only', '--', rel)
    .stdout.split('\n')
    .map((s) => s.trim())
    .filter(Boolean).length;
}

/** The ref names a bare remote advertises. */
function remoteRefs(remote) {
  const res = h.git(path.dirname(remote), ['ls-remote', remote]);
  return res.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t')[1]);
}

/** Resolve a single-trailing-`*` path against a real directory listing. */
function resolveGlob(repo, rel) {
  if (!rel.includes('*')) return fs.existsSync(path.join(repo, rel)) ? [rel] : [];
  const dir = path.dirname(rel);
  const prefix = path.basename(rel).replace('*', '');
  const abs = path.join(repo, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((name) => name.startsWith(prefix))
    .map((name) => path.join(dir, name));
}

function flipSf02ToDone(repo, fd) {
  const file = path.join(repo, fd, 'epic.md');
  h.write(file, h.read(file).replace('| SF02 | Beta | b | pending |', '| SF02 | Beta | b | done |'));
}

// --- S1 ---------------------------------------------------------------------

test('S1: the guarded per-path add stages epic.md where the single-add form loses it', () => {
  const r = h.makeRepo();
  try {
    const fd = buildEpic(r.repo, '0099F-smoke', 'pending', 'YES');
    r.git('add', '-A');
    r.git('commit', '-qm', 'seed');

    // The BROKEN form: one add, four pathspecs, one of them absent on an epic.
    r.git('add', '-A', '--', '.', ':(exclude)docs/features/*');
    const broken = r.git(
      'add', '-A', '--',
      `${fd}/subfeatures/SF02-*`,
      `${fd}/epic.md`,
      `${fd}/review-001.md`,
      `${fd}/_tests/run-001/`,
    );
    assert.notEqual(broken.status, 0, 'a non-matching pathspec aborts the whole add');
    assert.equal(stagedCount(r, `${fd}/epic.md`), 0, 'the broken form loses epic.md');
    r.git('reset', '-q');

    // The FIXED form: one add per path, absent skipped, present staged.
    flipSf02ToDone(r.repo, fd);
    r.git('add', '-A', '--', '.', ':(exclude)docs/features/*');
    let rc = 0;
    for (const rel of [
      `${fd}/subfeatures/SF02-*`,
      `${fd}/epic.md`,
      `${fd}/review-001.md`,
      `${fd}/_tests/run-001/`,
    ]) {
      for (const p of resolveGlob(r.repo, rel)) {
        if (r.git('add', '-A', '--', p).status !== 0) rc = 1;
      }
    }
    assert.equal(rc, 0, 'the guarded loop never fails on a path that exists');
    assert.equal(stagedCount(r, `${fd}/epic.md`), 1, 'the guarded loop stages epic.md');
  } finally {
    r.cleanup();
  }
});

// --- S2 ---------------------------------------------------------------------

test('S2: --follow-tags skips a lightweight tag, an annotated tag pushed by name reaches the remote', () => {
  const r = h.makeRepo();
  try {
    const fd = buildEpic(r.repo, '0099F-smoke', 'pending', 'YES');
    r.git('add', '-A');
    r.git('commit', '-qm', 'seed');

    const remote = path.join(r.base, 's1-remote.git');
    h.git(r.base, ['init', '--bare', '--initial-branch=main', '-q', remote]);
    r.git('remote', 'add', 'origin', remote);
    r.git('push', '-q', '-u', 'origin', 'main');

    r.git('tag', 'checkpoint/lightweight-probe');
    r.git('push', '-q', 'origin', 'main', '--follow-tags');
    assert.equal(
      remoteRefs(remote).some((ref) => ref.includes('lightweight-probe')),
      false,
      '--follow-tags must still skip a lightweight tag',
    );

    r.git('tag', '-a', 'checkpoint/0099F-smoke-SF02-done', '-m', 'checkpoint');
    r.git('push', '-q', 'origin', 'main', 'checkpoint/0099F-smoke-SF02-done');
    assert.ok(
      remoteRefs(remote).some((ref) => ref.includes('SF02-done')),
      'the annotated checkpoint tag reaches the remote',
    );
  } finally {
    r.cleanup();
  }
});

// --- S3 ---------------------------------------------------------------------

test('S3: the epic.md row flip is inside the commit the checkpoint tag points at', () => {
  const r = h.makeRepo();
  try {
    const fd = buildEpic(r.repo, '0099F-smoke', 'pending', 'YES');
    flipSf02ToDone(r.repo, fd);
    r.git('add', '-A');
    r.git('commit', '-q', '-m', [
      'feat(0099F-smoke-SF02): checkpoint',
      '',
      'GATE_REVIEW=ok',
      'GATE_QA_BASELINE=ok',
      'GATE_EPIC=ok',
      'GATE_COVERAGE=ok',
      'GATE_LEDGER=ok',
      'GATES_OK=5/5',
    ].join('\n'));

    assert.match(r.git('show', '--stat', '--name-only', 'HEAD').stdout, /epic\.md/);
    assert.match(
      r.git('show', `HEAD:${fd}/epic.md`).stdout,
      /\| SF02 \| Beta \| b \| done \|/,
      'the row reads done in the commit tree, not only in the working tree',
    );
    assert.ok(
      r.git('log', '--grep=GATES_OK', '--oneline').stdout.trim().split('\n').filter(Boolean).length >= 1,
      'git log --grep=GATES_OK reconstructs the checkpoint',
    );
  } finally {
    r.cleanup();
  }
});

// --- S4 ---------------------------------------------------------------------

test('S4: converge-gates finds the SUBFEATURE plan.md and accepts a complete scoped checklist', () => {
  const r = h.makeRepo();
  try {
    const fd = buildEpic(r.repo, '0098F-scoped', 'done', 'YES');
    r.git('add', '-A');
    r.git('commit', '-qm', 'seed');

    const out = h.runScript('converge-gates', [fd, 'SF02'], { cwd: r.repo });
    const kv = h.parseKV(out.stdout);
    assert.equal(kv.GATE_COVERAGE, 'ok', `gate 4 must find the subfeature plan (${out.output})`);
    assert.equal(kv.GATE_EPIC, 'ok', 'gate 3 accepts a complete scoped subfeature');
  } finally {
    r.cleanup();
  }
});

// --- S5 ---------------------------------------------------------------------

test('S5: an epic-wide run aggregates coverage from the subfeature plans', () => {
  const r = h.makeRepo();
  try {
    const fd = buildEpic(r.repo, '0097F-epic', 'done', 'YES');
    r.git('add', '-A');
    r.git('commit', '-qm', 'seed');

    const out = h.runScript('converge-gates', [fd], { cwd: r.repo });
    assert.equal(h.parseKV(out.stdout).GATE_COVERAGE, 'ok', `epic-wide coverage did not aggregate (${out.output})`);
  } finally {
    r.cleanup();
  }
});

test('S5b: an uncovered requirement in ANY subfeature plan is reported', () => {
  const r = h.makeRepo();
  try {
    const fd = buildEpic(r.repo, '0097F-uncov', 'done', 'NO');
    r.git('add', '-A');
    r.git('commit', '-qm', 'seed');

    const out = h.runScript('converge-gates', [fd], { cwd: r.repo });
    assert.equal(h.parseKV(out.stdout).GATE_COVERAGE, 'broken', 'an uncovered requirement must be reported');
  } finally {
    r.cleanup();
  }
});

// --- S6 ---------------------------------------------------------------------

test('S6: status and converge-gates agree about the same epic.md despite a misleading Notes cell', () => {
  const r = h.makeRepo();
  try {
    const fd = buildEpic(r.repo, '0096F-agree', 'pending', 'YES');
    // Poison the row the way only a string matcher would fall for.
    const file = path.join(r.repo, fd, 'epic.md');
    h.write(file, h.read(file).replace('| SF02 | Beta | b | pending | |', '| SF02 | Beta | b | pending | done |'));
    r.git('add', '-A');
    r.git('commit', '-qm', 'seed');
    r.git('checkout', '-q', '-b', 'feature/0096F-agree');

    const st = h.runScript('status', [], { cwd: r.repo });
    const cg = h.runScript('converge-gates', [fd], { cwd: r.repo });
    const prog = (st.stdout.match(/EPIC_PROGRESS:[0-9]+\/[0-9]+/) || [])[0];
    const pend = (cg.stdout.match(/EPIC_PENDING=.*/) || [])[0] || '';
    assert.equal(prog, 'EPIC_PROGRESS:1/2', `status must call SF02 pending (${st.output})`);
    assert.match(pend, /SF02/, 'converge-gates must call SF02 pending');
  } finally {
    r.cleanup();
  }
});

// --- the end-to-end runner --------------------------------------------------

test('the native smoke runner reports every scenario green', () => {
  const res = h.runRootScript('smoke-test', [], { cwd: h.REPO_ROOT, timeout: 300000 });
  const out = h.stripAnsi(res.output);
  assert.equal(res.status, 0, out.split('\n').filter((l) => /FAIL/.test(l)).join('\n') || out);
  assert.match(out, /smoke-test:\s*\d+ passed,\s*0 failed/);
});
