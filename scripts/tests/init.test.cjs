'use strict';
// =============================================================================
// init.test.cjs — native port of framwork/.codeadd/scripts/tests/init.bats
// (17 cases, init#001…#017). Target entry: framwork/.codeadd/scripts/init.cjs.
//
// init prints a compact project snapshot (GIT/FEATURES/CURRENT/ARCH/STACK/REC…)
// and must be read-only with respect to git.
//
// Run: node --test scripts/tests/init.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const h = require('./helpers.cjs');
const { DOCS_ROOT, DOCS_LAYOUT } = require(path.join(h.SCRIPTS_DIR, 'docs-root.cjs'));

const DOCS_REL = path.join(...DOCS_ROOT.split('/'));

function has(res, needle) {
  assert.ok(
    res.output.includes(needle),
    `expected output to include ${JSON.stringify(needle)}\n--- status ${res.status} ---\n${res.output}`,
  );
}

function hasNot(res, needle) {
  assert.ok(
    !res.output.includes(needle),
    `expected output NOT to include ${JSON.stringify(needle)}\n--- status ${res.status} ---\n${res.output}`,
  );
}

function repo(t, { docsRoot = true } = {}) {
  const r = h.makeRepo({ prefix: 'codeadd-init-' });
  t.after(r.cleanup);
  // The docs root is a plain directory here — the cheap stand-in for a prepared worktree.
  if (docsRoot) fs.mkdirSync(path.join(r.repo, DOCS_REL), { recursive: true });
  return r;
}

const init = (r) => h.runScript('init', [], { cwd: r.repo });
const writeIn = (r, rel, content) => h.write(path.join(r.repo, rel), content);
const mkdirIn = (r, rel) => fs.mkdirSync(path.join(r.repo, rel), { recursive: true });
const featurePath = (...parts) => path.join(DOCS_REL, DOCS_LAYOUT.features, ...parts);

// ─── Git info ────────────────────────────────────────────────────────

test('init#001 detects main branch and type=main', (t) => {
  const r = repo(t);
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'GIT:branch=main type=main');
});

test('init#002 detects feature branch and type=feature', (t) => {
  const r = repo(t);
  r.git('checkout', '-b', 'feature/0001F-test', '-q');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'type=feature');
});

test('init#003 detects hotfix branch and type=hotfix', (t) => {
  const r = repo(t);
  r.git('checkout', '-b', 'hotfix/0001H-urgent', '-q');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'type=hotfix');
});

// ─── Features discovery ─────────────────────────────────────────────

test('init#004 creates the features folder if missing and returns count=0 next=0001F', (t) => {
  const r = repo(t);
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'FEATURES:count=0 next=0001F');
  assert.ok(fs.existsSync(path.join(r.repo, featurePath())), 'features folder created in the docs root');
});

test('init#005 counts existing features and calculates next correctly', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-login'));
  mkdirIn(r, featurePath('0002F-signup'));
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'FEATURES:count=2 next=0003F');
});

test('init#006 detects current feature when on feature branch', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'about.md'), '# About\n');
  writeIn(r, featurePath('0001F-test', 'plan.md'), '# Plan\n');
  r.git('checkout', '-b', 'feature/0001F-test', '-q');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'CURRENT:0001F-test docs=[about.md,plan.md]');
});

// ─── Architecture detection ─────────────────────────────────────────

test('init#007 detects AGENTS.md when it exists', (t) => {
  const r = repo(t);
  writeIn(r, 'AGENTS.md', '# Agents\n');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'ARCH:AGENTS.md');
});

test('init#008 reports ARCH:none when AGENTS.md does not exist', (t) => {
  const r = repo(t);
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'ARCH:none');
});

test('init#009 a CLAUDE.md alone is not the context file: ARCH:none plus LEGACY_CONTEXT', (t) => {
  const r = repo(t);
  writeIn(r, 'CLAUDE.md', '# Claude\n');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'ARCH:none');
  has(res, 'LEGACY_CONTEXT:CLAUDE.md');
});

test('init#010 LEGACY_CONTEXT lists every legacy file present, in order', (t) => {
  const r = repo(t);
  writeIn(r, 'CLAUDE.md', 'a\n');
  writeIn(r, '.claude/CLAUDE.md', 'b\n');
  writeIn(r, 'GEMINI.md', 'c\n');
  writeIn(r, 'AGENTS.md', 'd\n');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'ARCH:AGENTS.md');
  has(res, 'LEGACY_CONTEXT:CLAUDE.md,.claude/CLAUDE.md,GEMINI.md');
});

test('init#011 no legacy file means no LEGACY_CONTEXT line at all', (t) => {
  const r = repo(t);
  writeIn(r, 'AGENTS.md', '# Agents\n');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'ARCH:AGENTS.md');
  hasNot(res, 'LEGACY_CONTEXT');
});

// ─── Stack detection ────────────────────────────────────────────────

test('init#012 detects stack from package.json', (t) => {
  const r = repo(t);
  writeIn(
    r,
    'package.json',
    '{\n  "dependencies": {\n    "@nestjs/core": "^10.0.0",\n    "express": "^4.0.0"\n  }\n}\n',
  );
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'STACK:');
  has(res, 'nestjs');
  has(res, 'express');
});

// ─── Recommendation ─────────────────────────────────────────────────

test('init#013 recommends /add-feature when on main', (t) => {
  const r = repo(t);
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'REC:create feature branch with /add-feature');
});

test('init#014 recommends continue work when on feature branch with docs', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'about.md'), '# About\n');
  r.git('checkout', '-b', 'feature/0001F-test', '-q');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'REC:continue work on 0001F-test');
});

// ─── Detached HEAD ──────────────────────────────────────────────────

test('init#015 handles detached HEAD without failing', (t) => {
  const r = repo(t);
  r.git('checkout', '--detach', '-q');
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'GIT:branch=(detached)');
});

// ─── RECENT_CHANGELOGS ──────────────────────────────────────────────

test('init#016 shows RECENT_CHANGELOGS when there are features with changelog.md', (t) => {
  const r = repo(t);
  writeIn(
    r,
    featurePath('0001F-done', 'changelog.md'),
    '# 0001F\n\n## Resumo\nFeature completed successfully\n',
  );
  writeIn(
    r,
    featurePath('0002F-done', 'changelog.md'),
    '# 0002F\n\n## Resumo\nSecond feature completed\n',
  );
  const res = init(r);
  assert.equal(res.status, 0);
  has(res, 'RECENT_CHANGELOGS:');
  has(res, '0001F-done');
});

// ─── Read-only invariant ────────────────────────────────────────────

test('init#017 performs no git write operations (branch/HEAD/refs/tree unchanged)', (t) => {
  const r = repo(t);
  const headBefore = r.git('rev-parse', 'HEAD').stdout.trim();
  const branchBefore = r.git('branch', '--show-current').stdout.trim();
  const refsBefore = r.git('show-ref').stdout.split('\n').sort().join('\n');
  const statusBefore = r.git('status', '--porcelain').stdout;

  const res = init(r);
  assert.equal(res.status, 0);

  assert.equal(r.git('rev-parse', 'HEAD').stdout.trim(), headBefore);
  assert.equal(r.git('branch', '--show-current').stdout.trim(), branchBefore);
  assert.equal(r.git('show-ref').stdout.split('\n').sort().join('\n'), refsBefore);
  assert.equal(r.git('status', '--porcelain').stdout, statusBefore);
});

// ─── 0078F — the docs root ──────────────────────────────────────────

test('init#018 an absent docs root fails with DOCS_ROOT_MISSING and exit 1, creating nothing', (t) => {
  const r = repo(t, { docsRoot: false });
  const res = init(r);
  assert.equal(res.status, 1, res.output);
  assert.match(res.stderr, /DOCS_ROOT_MISSING/);
  assert.equal(fs.existsSync(path.join(r.repo, DOCS_REL)), false, 'the root is never created by init');
});

test('init#019 allocates from the docs root features folder only', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0002F-real'));
  mkdirIn(r, path.join('elsewhere', 'features', '0090F-stray'));
  const res = init(r);
  assert.equal(res.status, 0, res.output);
  has(res, 'FEATURES:count=1 next=0003F');
});

test('init#020 the changelog path an agent is told to read is under the docs root', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-done', 'changelog.md'), '# Changelog\n\n## Summary\n\nShipped it.\n');
  const res = init(r);
  assert.equal(res.status, 0, res.output);
  has(res, `CHANGELOGS_PATH:${DOCS_ROOT}/${DOCS_LAYOUT.features}/{[0-9][0-9][0-9][0-9][A-Z]-*}/changelog.md`);
});
