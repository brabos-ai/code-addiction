'use strict';
// =============================================================================
// hotfix-gates — native port of framwork/.codeadd/scripts/tests/hotfix-gates.bats
// =============================================================================
// Target: framwork/.codeadd/scripts/hotfix-gates.cjs (F27; intentionally Red
// until the native entry lands).
//
// Modes: diagnosis-baseline, diagnosis-check, snapshot-wave, diff-wave,
// review-manifest, review-fingerprint, review-validate. Exit: 0 ok; 1 git/fs
// failure; 2 misuse/malformed; 3 a documented non-current/unavailable verdict.
// All runs use the repository under test as the child's cwd.
//
// Run: node --test scripts/tests/hotfix-gates.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

/** Forward-slash a path fragment so Windows output still matches POSIX shapes. */
const slash = (s) => String(s).replace(/\\/g, '/');

function writeHandoff(fixture, relPath, baseline, citation = 'src/fault.txt:1') {
  const branch = fixture.git('branch', '--show-current').stdout.trim();
  const commit = fixture.git('rev-parse', 'HEAD').stdout.trim();
  const text = [
    '---',
    'id: DIAG-test',
    'type: diagnose-report',
    'created: 2026-09-19',
    'updated: 2026-09-19',
    'related: []',
    'tags: [test]',
    '---',
    '## Hotfix Handoff',
    'route: hotfix',
    'accepted: true',
    `diagnosed-branch: ${branch}`,
    `diagnosed-commit: ${commit}`,
    'predicate: WHEN test THEN fixed BUT CURRENTLY broken',
    'root-cause: test cause',
    '### Findings',
    '| ID | Severity | Area | Citation | Symbol | Finding | Required change |',
    '|---|---|---|---|---|---|---|',
    `| DIAG-F001 | major | test | ${citation} |  | broken | fix |`,
    '### Confirmed Relations',
    'None',
    '### Working Tree Baseline',
    '```text',
    baseline,
    '```',
    '',
  ].join('\n');
  h.write(path.join(fixture.repo, relPath), text);
}

/** The about.md shape the review modes read; manifest block is verbatim. */
function aboutText(manifestBlock) {
  return [
    '## Review',
    'status: passed',
    'reviewer: inline',
    'reviewed-at: 2026-09-19T00:00:00Z',
    'reviewed-tree: sha256:<PENDING>',
    'build: passed',
    'pinned-test: none:not-applicable',
    '### Reviewed Paths',
    '```text',
    manifestBlock,
    '```',
    '### Findings',
    '| ID | Severity | Confidence | Citation | Route | Disposition | Re-review | Detail |',
    '|---|---|---|---|---|---|---|---|',
    '',
  ].join('\n');
}

function between(text, begin, end) {
  const lines = text.split('\n');
  const out = [];
  let on = false;
  for (const line of lines) {
    if (line === begin) { on = true; continue; }
    if (line === end) break;
    if (on) out.push(line);
  }
  return out.join('\n');
}

// ─── hotfix-gates#001 — usage ────────────────────────────────────────────────

test('hotfix-gates#001 — usage errors exit 2', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  const none = h.runScript('hotfix-gates', [], { cwd: r.repo });
  assert.equal(none.status, 2, none.output);
  const unknown = h.runScript('hotfix-gates', ['unknown'], { cwd: r.repo });
  assert.equal(unknown.status, 2, unknown.output);
});

// ─── hotfix-gates#002..#004 — diagnosis-baseline ─────────────────────────────

test('hotfix-gates#002 — diagnosis-baseline emits full identity and clean state', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  const head = r.git('rev-parse', 'HEAD').stdout.trim();
  const res = h.runScript('hotfix-gates', ['diagnosis-baseline'], { cwd: r.repo });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /DIAGNOSED_BRANCH=main/);
  assert.match(res.output, new RegExp(`DIAGNOSED_COMMIT=${head}`));
  assert.match(res.output, /BASELINE_BEGIN\nclean\nBASELINE_END/);
});

test('hotfix-gates#003 — diagnosis-baseline preserves staged unstaged deleted and untracked state', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  h.write(path.join(r.repo, 'tracked.txt'), 'base\n');
  h.write(path.join(r.repo, 'deleted.txt'), 'gone\n');
  r.git('add', 'tracked.txt', 'deleted.txt');
  r.git('commit', '-m', 'fixture', '-q');
  h.write(path.join(r.repo, 'tracked.txt'), 'staged\n');
  r.git('add', 'tracked.txt');
  h.write(path.join(r.repo, 'tracked.txt'), 'unstaged\r\n');
  fs.rmSync(path.join(r.repo, 'deleted.txt'));
  h.write(path.join(r.repo, 'empty.txt'), '');

  const res = h.runScript('hotfix-gates', ['diagnosis-baseline'], { cwd: r.repo });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /staged\t100644\t[^\n]*\t747261636b65642e747874/);
  assert.match(res.output, /unstaged\t100644\t[^\n]*\t747261636b65642e747874/);
  assert.match(res.output, /deleted\t100644\t-\t64656c657465642e747874/);
  assert.match(res.output, /untracked\t100644\te3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\t656d7074792e747874/);
});

test('hotfix-gates#004 — diagnosis-baseline distinguishes symlinks executables renames and unusual names', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  h.write(path.join(r.repo, 'old.txt'), 'old\n');
  r.git('add', 'old.txt');
  r.git('commit', '-m', 'old', '-q');
  r.git('mv', 'old.txt', 'new.txt');
  h.write(path.join(r.repo, 'executable.sh'), '#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(r.repo, 'executable.sh'), 0o755);
  try {
    fs.symlinkSync('new.txt', path.join(r.repo, 'link.txt'));
  } catch {
    return t.skip('native symlinks unavailable');
  }
  const unusual = path.join(r.repo, 'odd\tname\n.txt');
  h.write(unusual, 'odd\n');

  const res = h.runScript('hotfix-gates', ['diagnosis-baseline'], { cwd: r.repo });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /deleted\t100644\t-\t6f6c642e747874/);
  assert.match(res.output, /staged\t100644\t[^\n]*\t6e65772e747874/);
  assert.match(res.output, /untracked\t100755\t[^\n]*\t65786563757461626c652e7368/);
  assert.match(res.output, /untracked\t120000\t[^\n]*\t6c696e6b2e747874/);
  assert.match(res.output, /\t6f6464096e616d650a2e747874/);
});

// ─── hotfix-gates#005..#006 — diagnosis-check ────────────────────────────────

test('hotfix-gates#005 — diagnosis-check distinguishes unchanged unrelated and overlapping drift', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  fs.mkdirSync(path.join(r.repo, 'src'), { recursive: true });
  h.write(path.join(r.repo, 'src', 'fault.txt'), 'fault\n');
  r.git('add', 'src/fault.txt');
  r.git('commit', '-m', 'fault', '-q');
  writeHandoff(r, path.join('docs', 'diagnose', 'report.md'), 'clean');

  const unchanged = h.runScript('hotfix-gates', ['diagnosis-check', 'docs/diagnose/report.md'], { cwd: r.repo });
  assert.equal(unchanged.status, 0, unchanged.output);
  assert.match(unchanged.output, /DIAGNOSIS=unchanged/);
  assert.match(unchanged.output, /OVERLAP=none/);

  h.write(path.join(r.repo, 'notes.txt'), 'notes\n');
  const unrelated = h.runScript('hotfix-gates', ['diagnosis-check', 'docs/diagnose/report.md'], { cwd: r.repo });
  assert.equal(unrelated.status, 0, unrelated.output);
  assert.match(unrelated.output, /DIAGNOSIS=delta/);
  assert.match(unrelated.output, /OVERLAP=none/);

  h.write(path.join(r.repo, 'src', 'fault.txt'), 'changed\n');
  const overlapping = h.runScript('hotfix-gates', ['diagnosis-check', 'docs/diagnose/report.md'], { cwd: r.repo });
  assert.equal(overlapping.status, 0, overlapping.output);
  assert.match(overlapping.output, /OVERLAP=present/);
});

test('hotfix-gates#006 — diagnosis-check rejects a missing diagnosed commit', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  writeHandoff(r, path.join('docs', 'diagnose', 'report.md'), 'clean');
  const report = path.join(r.repo, 'docs', 'diagnose', 'report.md');
  h.write(
    report,
    h.read(report).replace(
      /^diagnosed-commit:.*$/m,
      'diagnosed-commit: 0000000000000000000000000000000000000000',
    ),
  );
  const res = h.runScript('hotfix-gates', ['diagnosis-check', 'docs/diagnose/report.md'], { cwd: r.repo });
  assert.equal(res.status, 3, res.output);
});

// ─── hotfix-gates#007 — snapshot-wave + diff-wave ────────────────────────────

test('hotfix-gates#007 — snapshot-wave and diff-wave isolate adds changes modes and deletes', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  h.write(path.join(r.repo, 'one.txt'), 'before\n');
  h.write(path.join(r.repo, 'two.txt'), 'delete\n');
  h.write(path.join(r.repo, 'paths.hex'), '6f6e652e747874\n74776f2e747874\n6e65772e747874\n');

  const snapshotRes = h.runScript('hotfix-gates', ['snapshot-wave', 'paths.hex'], { cwd: r.repo });
  assert.equal(snapshotRes.status, 0, snapshotRes.output);
  const snapshot = (snapshotRes.stdout.match(/^SNAPSHOT=(.+)$/m) || [])[1];
  assert.ok(snapshot, 'snapshot path reported');

  h.write(path.join(r.repo, 'one.txt'), 'after\n');
  fs.rmSync(path.join(r.repo, 'two.txt'));
  h.write(path.join(r.repo, 'new.txt'), 'new\n');
  const packagePath = path.join(r.base, 'wave.txt');

  const diffRes = h.runScript('hotfix-gates', ['diff-wave', snapshot, packagePath], { cwd: r.repo });
  assert.equal(diffRes.status, 0, diffRes.output);
  assert.match(diffRes.output, /CHANGED=3/);
  const pkg = h.read(packagePath);
  assert.notEqual(pkg.trim(), '');
  assert.match(pkg, /^HOTFIX_CORRECTION_PACKAGE v1$/m);
  assert.match(pkg, /6f6e652e747874/);
  assert.match(pkg, /74776f2e747874/);
  assert.match(pkg, /6e65772e747874/);
});

// ─── hotfix-gates#008 — review fingerprint ───────────────────────────────────

test('hotfix-gates#008 — review fingerprint validates exact paths and detects receipt tampering', (t) => {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  r.git('switch', '-c', 'hotfix/0001H-test', '-q');
  const hf = path.join(r.repo, 'docs', 'features', '0001H-test');
  fs.mkdirSync(path.join(r.repo, 'src'), { recursive: true });
  h.write(path.join(r.repo, 'src', 'fault.txt'), 'fixed\n');
  h.write(path.join(hf, 'iterations.jsonl'), '{}\n');
  const placeholder =
    'present\t100644\t0000000000000000000000000000000000000000000000000000000000000000\t646f63732f66656174757265732f30303031482d746573742f61626f75742e6d64';
  const aboutPath = path.join(hf, 'about.md');
  h.write(aboutPath, aboutText(placeholder));

  const manifestRes = h.runScript('hotfix-gates', ['review-manifest', 'docs/features/0001H-test'], { cwd: r.repo });
  assert.equal(manifestRes.status, 0, manifestRes.output);
  const manifest = between(manifestRes.output, 'PATHS_BEGIN', 'PATHS_END');
  assert.notEqual(manifest, '');
  h.write(aboutPath, aboutText(manifest));

  const fingerprintRes = h.runScript('hotfix-gates', ['review-fingerprint', 'docs/features/0001H-test'], { cwd: r.repo });
  assert.equal(fingerprintRes.status, 0, fingerprintRes.output);
  const fingerprint = (fingerprintRes.stdout.match(/^REVIEWED_TREE=(.+)$/m) || [])[1];
  assert.ok(fingerprint, 'fingerprint reported');
  h.write(aboutPath, h.read(aboutPath).replace('sha256:<PENDING>', fingerprint));

  const ok = h.runScript('hotfix-gates', ['review-validate', 'docs/features/0001H-test'], { cwd: r.repo });
  assert.equal(ok.status, 0, ok.output);
  assert.match(ok.output, /HOTFIX_REVIEW=ok/);

  r.git('add', 'src/fault.txt', 'docs/features/0001H-test/about.md', 'docs/features/0001H-test/iterations.jsonl');
  r.git('commit', '-m', 'reviewed', '-q');
  const treeOk = h.runScript('hotfix-gates', ['review-validate', 'docs/features/0001H-test', '--tree', 'HEAD'], { cwd: r.repo });
  assert.equal(treeOk.status, 0, treeOk.output);
  assert.match(treeOk.output, /HOTFIX_REVIEW=ok/);

  h.write(path.join(r.repo, 'src', 'later.txt'), 'late\n');
  const stale = h.runScript('hotfix-gates', ['review-validate', 'docs/features/0001H-test'], { cwd: r.repo });
  assert.equal(stale.status, 3, stale.output);
  assert.match(stale.output, /HOTFIX_REVIEW=stale/);
  fs.rmSync(path.join(r.repo, 'src', 'later.txt'));

  h.write(aboutPath, h.read(aboutPath).replace(/^status: passed$/m, 'status: blocked'));
  const blocked = h.runScript('hotfix-gates', ['review-validate', 'docs/features/0001H-test'], { cwd: r.repo });
  assert.equal(blocked.status, 3, blocked.output);
  assert.match(blocked.output, /HOTFIX_REVIEW=blocked/);
  h.write(aboutPath, h.read(aboutPath).replace(/^status: blocked$/m, 'status: passed'));

  fs.appendFileSync(aboutPath, '\ntampered\n');
  const tampered = h.runScript('hotfix-gates', ['review-validate', 'docs/features/0001H-test'], { cwd: r.repo });
  assert.equal(tampered.status, 3, tampered.output);
  assert.match(tampered.output, /HOTFIX_REVIEW=stale/);
});
