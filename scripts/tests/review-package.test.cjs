'use strict';
// =============================================================================
// NATIVE PORT — review-package (F27, target F11's framwork/.codeadd/scripts/review-package.cjs)
// =============================================================================
// Ported from framwork/.codeadd/scripts/tests/review-package.bats (17 cases).
// The native entry preserves PACKAGE=/COMMITS=/FILES=, the -U10 diff, the
// scratch `.gitignore`, exit 2 for misuse — and, crucially, refuses an empty
// range BEFORE writing anything.
//
// ⛔ RED IS EXPECTED: review-package.cjs does not exist yet.
//
// Run: node --test scripts/tests/review-package.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const OUT = 'docs/features/0003F-signup/_build';

const abs = (repo, rel) => path.join(repo, rel);
const sha = (repo, ref) => h.git(repo, ['rev-parse', ref]).stdout.trim();

/** Three commits on top of init; src/wide.ts is 25 lines so -U10 reaches line-05. */
function makeCommits(repo) {
  let body = '';
  for (let i = 1; i <= 25; i += 1) body += `line-${String(i).padStart(2, '0')}\n`;
  h.write(abs(repo, 'src/wide.ts'), body);
  h.git(repo, ['add', '-A']);
  h.git(repo, ['commit', '-qm', 'feat(db): add users table']);

  h.write(abs(repo, 'src/a.ts'), 'export const a = 1;\n');
  h.git(repo, ['add', '-A']);
  h.git(repo, ['commit', '-qm', 'feat(api): add signup endpoint']);

  const wide = abs(repo, 'src/wide.ts');
  h.write(wide, h.read(wide).replace('line-15\n', 'line-15-CHANGED\n'));
  h.git(repo, ['add', '-A']);
  h.git(repo, ['commit', '-qm', 'fix(api): guard null email']);
}

const pkgText = (repo, res) => h.read(abs(repo, h.parseKV(res.stdout).PACKAGE));

test('review-package#001 L2.3: the package carries the log, the stat and the diff', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const base = sha(repo, 'HEAD~2');
    const head = sha(repo, 'HEAD');
    const res = h.runScript('review-package', [base, head, OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const kv = h.parseKV(res.stdout);
    assert.ok(kv.PACKAGE, 'PACKAGE=<path> is emitted');
    const pkg = h.read(abs(repo, kv.PACKAGE));
    assert.ok(pkg.includes('feat(api): add signup endpoint'));
    assert.ok(pkg.includes('fix(api): guard null email'));
    assert.equal(pkg.includes('feat(db): add users table'), false, 'the commit before BASE is excluded');
    assert.match(pkg, /[0-9]+ files? changed/, 'the diff --stat summary line is present');
    assert.ok(pkg.includes('diff --git'));
    assert.ok(pkg.includes('+export const a = 1;'));
    assert.ok(pkg.includes('+line-15-CHANGED'));
  } finally {
    cleanup();
  }
});

test('review-package#002 L2.3: the diff is -U10, not the default -U3', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['HEAD~1', 'HEAD', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    // line-15 changed: -U10 reaches line-05, -U3 would not.
    assert.ok(pkgText(repo, res).includes('line-05'));
  } finally {
    cleanup();
  }
});

test("review-package#003 L2.3: COMMITS and FILES report the range's size", () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', [sha(repo, 'HEAD~2'), sha(repo, 'HEAD'), OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const kv = h.parseKV(res.stdout);
    assert.equal(kv.COMMITS, '2');
    assert.equal(kv.FILES, '2');
  } finally {
    cleanup();
  }
});

test('review-package#004 L2.3: the package names the range it covers', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const base = sha(repo, 'HEAD~2');
    const head = sha(repo, 'HEAD');
    const res = h.runScript('review-package', [base, head, OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const pkg = pkgText(repo, res);
    assert.ok(pkg.includes(h.git(repo, ['rev-parse', '--short', base]).stdout.trim()));
    assert.ok(pkg.includes(h.git(repo, ['rev-parse', '--short', head]).stdout.trim()));
  } finally {
    cleanup();
  }
});

test('review-package#005 L2.3: short refs and symbolic refs both resolve', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['HEAD~2', 'HEAD', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(h.parseKV(res.stdout).COMMITS, '2');
  } finally {
    cleanup();
  }
});

test('review-package#006 L2.3: BASE == HEAD is an empty range -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const head = sha(repo, 'HEAD');
    const res = h.runScript('review-package', [head, head, OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('review-package#007 L2.3: an empty range writes NO package — a reviewer cannot be handed one', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const head = sha(repo, 'HEAD');
    const res = h.runScript('review-package', [head, head, OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
    assert.equal(res.stdout.includes('PACKAGE='), false, 'no success contract on refusal');
    const outAbs = abs(repo, OUT);
    const entries = fs.existsSync(outAbs) ? fs.readdirSync(outAbs) : [];
    assert.equal(entries.filter((f) => f.startsWith('review-package')).length, 0);
  } finally {
    cleanup();
  }
});

test('review-package#008 L2.3: a range whose only commit is empty still packages — the log is content', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const base = sha(repo, 'HEAD');
    h.git(repo, ['commit', '-q', '--allow-empty', '-m', 'chore: empty marker']);
    const res = h.runScript('review-package', [base, 'HEAD', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(pkgText(repo, res).includes('chore: empty marker'));
  } finally {
    cleanup();
  }
});

test('review-package#009 F4: OUT_DIR is created with a .gitignore containing *', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['HEAD~2', 'HEAD', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(h.read(abs(repo, path.join(OUT, '.gitignore'))).trim(), '*');
  } finally {
    cleanup();
  }
});

test('review-package#010 F4: the package never reaches git status', () => {
  const { repo, git, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['HEAD~2', 'HEAD', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(git('status', '--porcelain').stdout.trim(), '');
  } finally {
    cleanup();
  }
});

test('review-package#011 misuse: no arguments -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('review-package', [], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('review-package#012 misuse: two arguments -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['HEAD~1', 'HEAD'], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('review-package#013 misuse: an empty BASE -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['', 'HEAD', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('review-package#014 misuse: an unresolvable BASE -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['deadbeefdeadbeef', 'HEAD', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('review-package#015 misuse: an unresolvable HEAD -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    const res = h.runScript('review-package', ['HEAD~1', 'no-such-branch', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('review-package#016 misuse: outside a git repository -> exit 2', () => {
  const dir = h.mkTmp('codeadd-notgit-');
  try {
    const res = h.runScript('review-package', ['HEAD~1', 'HEAD', OUT], { cwd: dir });
    assert.equal(res.status, 2, res.output);
  } finally {
    h.rmrf(dir);
  }
});

test('review-package#017 misuse prints a usage or error line, never a PACKAGE= line', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('review-package', ['HEAD~1', 'HEAD'], { cwd: repo });
    assert.equal(res.status, 2, res.output);
    assert.ok(res.output.includes('Usage:'));
    assert.equal(res.stdout.includes('PACKAGE='), false);
  } finally {
    cleanup();
  }
});

// Extra contract case (not a Bats row): F11 promises "1 only on a refused
// write". A regular file where the OUT_DIR's parent should be makes the mkdir
// fail portably, after a valid non-empty range has already passed the refusal
// gate.
test('review-package:EXTRA a refused write exits 1 with ERROR= and no PACKAGE= contract', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    makeCommits(repo);
    h.write(abs(repo, 'blocker'), 'not a directory\n');
    const res = h.runScript('review-package', ['HEAD~1', 'HEAD', 'blocker/_build'], { cwd: repo });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR='), 'a refused write is loud');
    assert.equal(res.stdout.includes('PACKAGE='), false);
  } finally {
    cleanup();
  }
});
