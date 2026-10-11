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
  const unusualName = process.platform === 'win32' ? 'odd name ü.txt' : 'odd\tname\n.txt';
  const unusual = path.join(r.repo, unusualName);
  h.write(unusual, 'odd\n');

  const res = h.runScript('hotfix-gates', ['diagnosis-baseline'], { cwd: r.repo });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /deleted\t100644\t-\t6f6c642e747874/);
  assert.match(res.output, /staged\t100644\t[^\n]*\t6e65772e747874/);
  const executableMode = fs.statSync(path.join(r.repo, 'executable.sh')).mode & 0o111 ? '100755' : '100644';
  assert.match(res.output, new RegExp(`untracked\\t${executableMode}\\t[^\\n]*\\t65786563757461626c652e7368`));
  assert.match(res.output, /untracked\t120000\t[^\n]*\t6c696e6b2e747874/);
  assert.ok(res.output.includes('\t' + Buffer.from(unusualName).toString('hex')));
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

// ─── hotfix-gates#009-015 — the covered-deletion rule (ticket 0048B) ─────────

const HF_SLUG = '0043H-remove-turnstile';
const HF_REL = `docs/features/${HF_SLUG}`;
const SPEC = 'tests/verify-turnstile.spec.ts';
const SELF_ROW =
  'present\t100644\t0000000000000000000000000000000000000000000000000000000000000000\t' +
  Buffer.from(`${HF_REL}/about.md`, 'utf8').toString('hex');

/** A repo on main carrying `mainFiles`, with the hotfix branch checked out. */
function hotfixRepo(t, mainFiles) {
  const r = h.makeRepo();
  t.after(() => r.cleanup());
  for (const [rel, content] of Object.entries(mainFiles)) h.write(path.join(r.repo, rel), content);
  r.git('add', '-A');
  r.git('commit', '-m', 'base', '-q');
  r.git('switch', '-c', `hotfix/${HF_SLUG}`, '-q');
  h.write(path.join(r.repo, HF_REL, 'iterations.jsonl'), '{}\n');
  return r;
}

/** Re-derive the about.md self-row hash for a hand-edited manifest block, as an old receipt carried it. */
function withSelfHash(block) {
  const zeros = '0'.repeat(64);
  const selfHex = Buffer.from(`${HF_REL}/about.md`, 'utf8').toString('hex');
  const rows = block.split('\n');
  const at = rows.findIndex((row) => row.endsWith('\t' + selfHex));
  const cells = rows[at].split('\t');
  cells[2] = zeros;
  rows[at] = cells.join('\t');
  const normalized = aboutText(rows.join('\n'))
    .replace(/^reviewed-tree:.*$/m, 'reviewed-tree: <SELF>')
    .split('\t' + zeros + '\t' + selfHex).join('\t<SELF>\t' + selfHex);
  cells[2] = require('node:crypto').createHash('sha256').update(normalized).digest('hex');
  rows[at] = cells.join('\t');
  return rows.join('\n');
}

/** Seal a receipt exactly as /add-hotfix does: manifest, then fingerprint. `rewrite` edits the manifest text. */
function sealReceipt(r, rewrite = (m) => m) {
  const aboutPath = path.join(r.repo, HF_REL, 'about.md');
  h.write(aboutPath, aboutText(SELF_ROW));
  const m = h.runScript('hotfix-gates', ['review-manifest', HF_REL], { cwd: r.repo });
  assert.equal(m.status, 0, m.output);
  const raw = between(m.output, 'PATHS_BEGIN', 'PATHS_END');
  const block = rewrite(raw);
  h.write(aboutPath, aboutText(block === raw ? raw : withSelfHash(block)));
  const f = h.runScript('hotfix-gates', ['review-fingerprint', HF_REL], { cwd: r.repo });
  assert.equal(f.status, 0, f.output);
  const fingerprint = (f.stdout.match(/^REVIEWED_TREE=(.+)$/m) || [])[1];
  assert.ok(fingerprint, 'fingerprint reported');
  h.write(aboutPath, h.read(aboutPath).replace('sha256:<PENDING>', fingerprint));
  return aboutPath;
}

function validate(r, ...extra) {
  return h.runScript('hotfix-gates', ['review-validate', HF_REL, ...extra], { cwd: r.repo });
}

function assertOk(res) {
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /HOTFIX_REVIEW=ok/);
}

function assertStale(res) {
  assert.equal(res.status, 3, res.output);
  assert.match(res.output, /HOTFIX_REVIEW=stale/);
}

test('hotfix-gates#009 — a reviewed file deleted and committed stays covered', (t) => {
  const r = hotfixRepo(t, { [SPEC]: 'original\n' });
  h.write(path.join(r.repo, SPEC), 'edited by the hotfix\n');
  sealReceipt(r);
  assertOk(validate(r));

  r.git('rm', '-qf', SPEC);
  r.git('add', '-A');
  r.git('commit', '-m', 'remove turnstile', '-q');
  assertOk(validate(r));
});

test('hotfix-gates#010 — a deletion unstaged at review time stays covered once committed', (t) => {
  const r = hotfixRepo(t, { [SPEC]: 'original\n' });
  fs.rmSync(path.join(r.repo, SPEC));
  sealReceipt(r);
  assertOk(validate(r));

  r.git('add', '-A');
  r.git('commit', '-m', 'remove turnstile', '-q');
  assertOk(validate(r));
});

test('hotfix-gates#011 — an old-style receipt row (deleted 100644) stays covered', (t) => {
  const r = hotfixRepo(t, { [SPEC]: 'original\n' });
  fs.rmSync(path.join(r.repo, SPEC));
  sealReceipt(r, (m) => m.replace(/^deleted\t000000\t/gm, 'deleted\t100644\t'));
  assert.match(h.read(path.join(r.repo, HF_REL, 'about.md')), /^deleted\t100644\t-\t/m);
  r.git('add', '-A');
  r.git('commit', '-m', 'remove turnstile', '-q');
  assertOk(validate(r));
});

test('hotfix-gates#012 — a file added, reviewed, then deleted stays covered', (t) => {
  const r = hotfixRepo(t, { 'README.md': 'x\n' });
  h.write(path.join(r.repo, 'tests', 'temp.spec.ts'), 'temporary\n');
  sealReceipt(r);
  assertOk(validate(r));

  fs.rmSync(path.join(r.repo, 'tests', 'temp.spec.ts'));
  assertOk(validate(r));
});

test('hotfix-gates#013 — the covered deletion survives the merge, validated with --tree', (t) => {
  const r = hotfixRepo(t, { [SPEC]: 'original\n' });
  h.write(path.join(r.repo, SPEC), 'edited by the hotfix\n');
  sealReceipt(r);
  r.git('rm', '-qf', SPEC);
  r.git('add', '-A');
  r.git('commit', '-m', 'remove turnstile', '-q');

  r.git('switch', 'main', '-q');
  h.write(path.join(r.repo, 'other.txt'), 'main moved on\n');
  r.git('add', '-A');
  r.git('commit', '-m', 'main moves', '-q');
  const merge = r.git('merge', '--no-ff', `hotfix/${HF_SLUG}`, '-m', 'merge hotfix', '-q');
  assert.equal(merge.status, 0, merge.output);
  const sha = r.git('rev-parse', 'HEAD').stdout.trim();
  assertOk(validate(r, '--tree', sha));
});

test('hotfix-gates#014 — an edit, an addition or a directory in place of a file still goes stale', (t) => {
  const setup = () => {
    const r = hotfixRepo(t, { 'src/fault.txt': 'original\n' });
    h.write(path.join(r.repo, 'src', 'fault.txt'), 'fixed\n');
    sealReceipt(r);
    assertOk(validate(r));
    return r;
  };

  const edited = setup();
  h.write(path.join(edited.repo, 'src', 'fault.txt'), 'changed after the review\n');
  assertStale(validate(edited));

  const added = setup();
  h.write(path.join(added.repo, 'src', 'later.txt'), 'late\n');
  assertStale(validate(added));

  const dir = setup();
  fs.rmSync(path.join(dir.repo, 'src', 'fault.txt'));
  h.write(path.join(dir.repo, 'src', 'fault.txt', 'inner.txt'), 'now a directory\n');
  assertStale(validate(dir));
});

test('hotfix-gates#015 — review-manifest writes a deletion as 000000 even while the path is still in the index', (t) => {
  const r = hotfixRepo(t, { [SPEC]: 'original\n' });
  fs.rmSync(path.join(r.repo, SPEC));
  h.write(path.join(r.repo, HF_REL, 'about.md'), aboutText(SELF_ROW));
  const m = h.runScript('hotfix-gates', ['review-manifest', HF_REL], { cwd: r.repo });
  assert.equal(m.status, 0, m.output);
  const hex = Buffer.from(SPEC, 'utf8').toString('hex');
  assert.match(m.output, new RegExp(`^deleted\t000000\t-\t${hex}$`, 'm'));
});
