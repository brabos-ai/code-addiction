'use strict';
// =============================================================================
// docs-branch.test.cjs — the git side of the docs root (plan 0078F, F3).
// Target: framwork/.codeadd/scripts/docs-branch.cjs
// Every case runs against a REAL separate bare remote — never one temp dir as
// both ends (the board lesson).
// Run: node --test scripts/tests/docs-branch.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const h = require('./helpers.cjs');

const { DOCS_ROOT, DOCS_BRANCH } = require(path.join(h.SCRIPTS_DIR, 'docs-root.cjs'));
const run = (args, cwd, env) => h.runScript('docs-branch', args, { cwd, env });
const rootOf = (repo) => path.join(repo, ...DOCS_ROOT.split('/'));
const lines = (r) => r.stdout.trim().split('\n').filter(Boolean);

function project(t, opts) {
  const p = h.makeProject({ prepared: false, ...opts });
  t.after(() => p.cleanup());
  return p;
}

// ─── prepare: the five outcomes ───────────────────────────────────────────────

test('prepare creates the orphan branch, pushes it, and leaves the code branch clean', (t) => {
  const p = project(t);
  const r = run(['prepare'], p.repo);
  assert.equal(r.status, 0, r.output);
  assert.deepEqual(lines(r), ['DOCS=created']);
  assert.ok(fs.existsSync(path.join(rootOf(p.repo), '.git')));
  // the remote holds the branch, one root commit, with the two files
  const heads = h.git(p.bare, ['rev-parse', '--verify', DOCS_BRANCH]);
  assert.equal(heads.status, 0, heads.output);
  const count = h.git(p.bare, ['rev-list', '--count', DOCS_BRANCH]).stdout.trim();
  assert.equal(count, '1');
  const files = h.git(p.bare, ['ls-tree', '--name-only', DOCS_BRANCH]).stdout.trim().split('\n');
  assert.ok(files.includes('.gitattributes') && files.includes('.gitignore'), files.join(','));
  assert.match(h.git(p.bare, ['show', `${DOCS_BRANCH}:.gitattributes`]).stdout, /^\* text=auto eol=lf$/m);
  assert.match(h.git(p.bare, ['show', `${DOCS_BRANCH}:.gitignore`]).stdout, /features\/\*\*\/_tests\/run-\*\//);
  // the code branch sees nothing, and the branch is orphan (no shared history with main)
  assert.equal(h.git(p.repo, ['status', '--porcelain']).stdout.trim(), '');
  assert.notEqual(h.git(p.repo, ['merge-base', 'main', DOCS_BRANCH]).status, 0);
});

test('prepare on a present worktree answers ready and changes nothing', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  const before = h.git(p.bare, ['rev-parse', DOCS_BRANCH]).stdout;
  const r = run(['prepare'], p.repo);
  assert.deepEqual(lines(r), ['DOCS=ready']);
  assert.equal(h.git(p.bare, ['rev-parse', DOCS_BRANCH]).stdout, before);
});

test('prepare from a subdirectory finds the project root', (t) => {
  const p = project(t);
  fs.mkdirSync(path.join(p.repo, 'src', 'deep'), { recursive: true });
  assert.deepEqual(lines(run(['prepare'], path.join(p.repo, 'src', 'deep'))), ['DOCS=created']);
  assert.ok(fs.existsSync(rootOf(p.repo)));
});

test('a fresh clone with only the remote branch fetches it and answers ready', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  h.write(path.join(rootOf(p.repo), 'features', '0001F-x', 'about.md'), '# x\n');
  assert.deepEqual(lines(run(['commit', 'docs: x'], p.repo)), ['DOCS_COMMIT=committed']);
  assert.deepEqual(lines(run(['push'], p.repo)), ['DOCS_PUSH=pushed']);

  const clone = path.join(p.base, 'clone');
  assert.equal(h.git(p.base, ['clone', '-q', p.bare, clone]).status, 0);
  h.git(clone, ['config', 'user.email', 'a@b.c']);
  h.git(clone, ['config', 'user.name', 'T']);
  const r = run(['prepare'], clone);
  assert.deepEqual(lines(r), ['DOCS=ready'], r.output);
  assert.equal(h.read(path.join(rootOf(clone), 'features', '0001F-x', 'about.md')), '# x\n');
});

test('a code worktree gets a link to the primary docs worktree', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  const wt = path.join(p.repo, '.worktrees', '0001F-x');
  assert.equal(h.git(p.repo, ['worktree', 'add', '-q', '-b', 'feat/x', wt]).status, 0);
  const r = run(['prepare'], wt);
  assert.deepEqual(lines(r), ['DOCS=linked'], r.output);
  assert.ok(fs.lstatSync(rootOf(wt)).isSymbolicLink());
  h.write(path.join(rootOf(wt), 'brainstorm', 'a.md'), 'via link\n');
  assert.equal(h.read(path.join(rootOf(p.repo), 'brainstorm', 'a.md')), 'via link\n');
  assert.deepEqual(lines(run(['prepare'], wt)), ['DOCS=linked']);
  assert.equal(h.git(wt, ['status', '--porcelain']).stdout.trim(), '');
});

test('a code worktree prepares the primary first when it has no docs worktree yet', (t) => {
  const p = project(t);
  const wt = path.join(p.repo, '.worktrees', '0002F-y');
  h.git(p.repo, ['worktree', 'add', '-q', '-b', 'feat/y', wt]);
  const r = run(['prepare'], wt);
  assert.deepEqual(lines(r), ['DOCS=linked'], r.output);
  assert.ok(fs.existsSync(path.join(rootOf(p.repo), '.git')));
});

test('no remote answers missing with a reason and exits 0', (t) => {
  const p = project(t, { remote: false });
  const r = run(['prepare'], p.repo);
  assert.equal(r.status, 0);
  assert.equal(lines(r)[0], 'DOCS=missing');
  assert.match(lines(r)[1], /^DOCS_REASON=.*remote/);
  assert.equal(fs.existsSync(rootOf(p.repo)), false);
});

test('an unreachable remote answers missing', (t) => {
  const p = project(t);
  h.git(p.repo, ['remote', 'set-url', 'origin', path.join(p.base, 'nowhere.git')]);
  const r = run(['prepare'], p.repo);
  assert.equal(lines(r)[0], 'DOCS=missing');
  assert.match(lines(r)[1], /unreachable/);
});

test('outside a git repository prepare answers missing', (t) => {
  const dir = h.mkTmp('codeadd-nogit-');
  t.after(() => h.rmrf(dir));
  assert.equal(lines(run(['prepare'], dir))[0], 'DOCS=missing');
});

test('a non-empty directory at the docs root is never clobbered', (t) => {
  const p = project(t);
  h.write(path.join(rootOf(p.repo), 'mine.txt'), 'keep\n');
  const r = run(['prepare'], p.repo);
  assert.equal(lines(r)[0], 'DOCS=missing');
  assert.equal(h.read(path.join(rootOf(p.repo), 'mine.txt')), 'keep\n');
});

// ─── commit ───────────────────────────────────────────────────────────────────

test('commit answers committed, then clean', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  h.write(path.join(rootOf(p.repo), 'delivered.jsonl'), '{"v":1}\n');
  assert.deepEqual(lines(run(['commit', 'docs:', 'add', 'index'], p.repo)), ['DOCS_COMMIT=committed']);
  assert.equal(h.git(rootOf(p.repo), ['log', '-1', '--format=%s']).stdout.trim(), 'docs: add index');
  assert.deepEqual(lines(run(['commit', 'again'], p.repo)), ['DOCS_COMMIT=clean']);
});

test('commit without a docs worktree answers failed with the explicit error', (t) => {
  const p = project(t, { remote: false });
  const r = run(['commit', 'x'], p.repo);
  assert.equal(r.status, 1);
  assert.equal(lines(r)[0], 'DOCS_COMMIT=failed');
  assert.match(r.stdout, /DOCS_ROOT_MISSING/);
});

test('commit falls back to a fixed identity when git has none', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  h.git(p.repo, ['config', '--unset', 'user.email']);
  h.git(p.repo, ['config', '--unset', 'user.name']);
  const empty = h.write(path.join(p.base, 'empty-gitconfig'), '');
  const env = { GIT_CONFIG_GLOBAL: empty, GIT_CONFIG_NOSYSTEM: '1', HOME: p.base, USERPROFILE: p.base };
  h.write(path.join(rootOf(p.repo), 'a.md'), 'a\n');
  const r = run(['commit', 'docs: a'], p.repo, env);
  assert.deepEqual(lines(r), ['DOCS_COMMIT=committed'], r.output);
  assert.match(h.git(rootOf(p.repo), ['log', '-1', '--format=%an']).stdout, /Code Addiction/);
});

test('commit retries while index.lock is held, then succeeds', async (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  h.write(path.join(rootOf(p.repo), 'a.md'), 'a\n');
  const lock = path.resolve(rootOf(p.repo), h.git(rootOf(p.repo), ['rev-parse', '--git-path', 'index.lock']).stdout.trim());
  fs.writeFileSync(lock, '');
  setTimeout(() => fs.rmSync(lock, { force: true }), 700);
  const out = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(h.SCRIPTS_DIR, 'docs-branch.cjs'), 'commit', 'docs: locked'], {
      cwd: p.repo,
      env: h.cleanEnv(),
    });
    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.on('close', (code) => resolve({ code, stdout }));
  });
  assert.equal(out.code, 0, out.stdout);
  assert.match(out.stdout, /DOCS_COMMIT=committed/);
});

test('commit never rewrites line endings (autocrlf off on the docs worktree)', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  h.git(p.repo, ['config', 'core.autocrlf', 'true']);
  fs.writeFileSync(path.join(rootOf(p.repo), 'crlf.md'), 'a\r\nb\r\n');
  run(['commit', 'docs: crlf'], p.repo);
  const blob = h.git(rootOf(p.repo), ['show', 'HEAD:crlf.md']).stdout;
  assert.equal(blob.includes('\r'), false, 'eol=lf is normalised by the branch attributes');
});

// ─── push ─────────────────────────────────────────────────────────────────────

test('push answers pushed and the remote carries the commit', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  h.write(path.join(rootOf(p.repo), 'a.md'), 'a\n');
  run(['commit', 'docs: a'], p.repo);
  assert.deepEqual(lines(run(['push'], p.repo)), ['DOCS_PUSH=pushed']);
  assert.equal(h.git(p.bare, ['log', '-1', '--format=%s', DOCS_BRANCH]).stdout.trim(), 'docs: a');
});

test('push fetches and rebases once when the remote moved', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  // another machine pushes first
  const other = path.join(p.base, 'other');
  h.git(p.base, ['clone', '-q', '-b', DOCS_BRANCH, p.bare, other]);
  h.git(other, ['config', 'user.email', 'o@o.o']);
  h.git(other, ['config', 'user.name', 'O']);
  h.write(path.join(other, 'theirs.md'), 't\n');
  h.git(other, ['add', '-A']);
  h.git(other, ['commit', '-q', '-m', 'docs: theirs']);
  h.git(other, ['push', '-q', 'origin', DOCS_BRANCH]);
  // we commit a different file and push
  h.write(path.join(rootOf(p.repo), 'mine.md'), 'm\n');
  run(['commit', 'docs: mine'], p.repo);
  const r = run(['push'], p.repo);
  assert.deepEqual(lines(r), ['DOCS_PUSH=pushed'], r.output);
  const tree = h.git(p.bare, ['ls-tree', '--name-only', DOCS_BRANCH]).stdout;
  assert.ok(tree.includes('theirs.md') && tree.includes('mine.md'), tree);
});

test('a ruleset rejection keeps the local commit and says so', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  const hook = path.join(p.bare, 'hooks', 'pre-receive');
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  fs.writeFileSync(hook, '#!/bin/sh\necho "protected branch rule: no" >&2\nexit 1\n', { mode: 0o755 });
  h.write(path.join(rootOf(p.repo), 'a.md'), 'a\n');
  run(['commit', 'docs: kept'], p.repo);
  const r = run(['push'], p.repo);
  assert.equal(r.status, 1);
  assert.equal(lines(r)[0], 'DOCS_PUSH=rejected', r.output);
  assert.match(r.stdout, /DOCS_PUSH_NOTE=.*local commit is kept/);
  assert.equal(h.git(rootOf(p.repo), ['log', '-1', '--format=%s']).stdout.trim(), 'docs: kept');
});

test('an unreachable remote answers offline, quickly and without prompting', (t) => {
  const p = project(t);
  run(['prepare'], p.repo);
  h.write(path.join(rootOf(p.repo), 'a.md'), 'a\n');
  run(['commit', 'docs: a'], p.repo);
  h.git(p.repo, ['remote', 'set-url', 'origin', 'http://127.0.0.1:1/never.git']);
  const started = Date.now();
  const r = run(['push'], p.repo, { CODEADD_DOCS_NET_TIMEOUT_MS: '5000' });
  assert.equal(lines(r)[0], 'DOCS_PUSH=offline', r.output);
  assert.ok(Date.now() - started < 20000);
});

test('the network calls are non-interactive and bounded in source', () => {
  const src = fs.readFileSync(path.join(h.SCRIPTS_DIR, 'docs-branch.cjs'), 'utf8');
  assert.match(src, /GIT_TERMINAL_PROMPT: '0'/);
  assert.match(src, /CODEADD_DOCS_NET_TIMEOUT_MS/);
});

test('usage error exits 2', () => {
  assert.equal(run(['bogus'], h.mkTmp('codeadd-usage-')).status, 2);
});
