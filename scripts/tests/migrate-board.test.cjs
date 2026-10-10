'use strict';
// =============================================================================
// migrate-board — the internal one-time migration to the `board` branch
// =============================================================================
// Target entry: scripts/migrations/migrate-board.cjs (internal, never shipped).
// Every fixture is a temp bare remote, a temp project on a feature branch and a
// temp CODEADD_BOARD_DIR. Nothing touches the real ~/.codeadd/ or this checkout.
//
// Run: node --test scripts/tests/migrate-board.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const ENTRY = 'scripts/migrations/migrate-board.cjs';
const BACKLOG = 'docs/backlog.jsonl';
const DEFS = 'docs/backlog.definitions.json';
const DEFS_TEXT = '{\n  "statuses": [\n    { "name": "open", "order": 1, "means": "decided, nobody picked it up" }\n  ]\n}\n';

const row = (id, title) => JSON.stringify({
  id, title, theme: 'general', tldr: title, notes: [], done_when: 'it works', paths: [], grounded: false,
  status: 'open', created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z', comments: [], work_id: null,
});
const BOARD_TEXT = row('0001B', 'first') + '\n' + row('0002B', 'second') + '\n';

const commitAll = (cwd, message) => {
  h.git(cwd, ['add', '-A']);
  const res = h.git(cwd, ['commit', '-q', '-m', message]);
  assert.equal(res.status, 0, res.output);
};

/**
 * A project whose `main` still carries the board, on a feature branch, with a
 * bare `origin`. `ignore` is the .gitignore text; `origin: false` leaves it out.
 */
function project(t, { ignore = '.codeadd/\n', origin = true, board = true } = {}) {
  const base = h.mkTmp('codeadd-migrate-');
  t.after(() => h.rmrf(base));
  const bare = path.join(base, 'remote.git');
  h.git(base, ['init', '--bare', '-q', '--initial-branch=main', bare]);
  const repo = path.join(base, 'proj');
  fs.mkdirSync(repo);
  h.git(repo, ['init', '-q', '--initial-branch=main']);
  h.git(repo, ['config', 'user.email', 'test@test.com']);
  h.git(repo, ['config', 'user.name', 'Test']);
  h.git(repo, ['config', 'commit.gpgsign', 'false']);
  h.write(path.join(repo, '.gitignore'), ignore);
  if (board) {
    h.write(path.join(repo, BACKLOG), BOARD_TEXT);
    h.write(path.join(repo, DEFS), DEFS_TEXT);
  }
  h.write(path.join(repo, 'code.txt'), 'code\n');
  commitAll(repo, 'seed');
  if (origin) {
    h.git(repo, ['remote', 'add', 'origin', bare]);
    h.git(repo, ['push', '-q', 'origin', 'main']);
    h.git(repo, ['remote', 'set-head', 'origin', 'main']);
  }
  h.git(repo, ['checkout', '-q', '-b', 'feat/x']);
  const boardDir = path.join(base, 'clone');
  const env = { CODEADD_BOARD_DIR: boardDir, HOME: base, USERPROFILE: base };
  return { base, bare, repo, boardDir, env };
}

const migrate = (p, args = [], opts = {}) => h.runFile(ENTRY, args, { cwd: p.repo, env: p.env, ...opts });
const kv = (res) => h.parseKV(res.stdout);
const staged = (p) => h.git(p.repo, ['diff', '--cached', '--name-status']).stdout.trim().split('\n').filter(Boolean).sort();
const remoteBoard = (p, file = BACKLOG) => h.git(p.bare, ['show', `board:${file}`]).stdout;

/** Another machine pushing to `main` through the old route. */
function pushToMain(p, fn, message = 'old route write') {
  const other = path.join(p.base, 'other-' + Math.random().toString(36).slice(2));
  h.git(p.base, ['clone', '-q', '--branch', 'main', p.bare, other]);
  h.git(other, ['config', 'user.email', 'o@o.com']);
  h.git(other, ['config', 'user.name', 'O']);
  h.git(other, ['config', 'commit.gpgsign', 'false']);
  fn(other);
  commitAll(other, message);
  h.git(other, ['push', '-q', 'origin', 'main']);
}

test('migrate-board#001 — L2.8: a fresh run creates the board branch, the clone and the config, stages the code side, commits nothing', (t) => {
  const p = project(t);
  const head = h.git(p.repo, ['rev-parse', 'HEAD']).stdout;
  const res = migrate(p);
  assert.equal(res.status, 0, res.output);
  const out = kv(res);
  assert.equal(out.MIGRATED, 'done');
  assert.equal(out.BOARD_BRANCH_CREATED, 'yes');
  assert.equal(out.BOARD_DIR, p.boardDir);
  assert.equal(out.BASE_BRANCH, 'main');
  assert.equal(out.CODE_CHANGES, 'staged');
  assert.match(res.stdout, /FREEZE=/);

  // The board branch: same files as main's committed board, trailers on the root.
  assert.equal(remoteBoard(p), BOARD_TEXT);
  assert.equal(remoteBoard(p, DEFS), DEFS_TEXT);
  const baseSha = h.git(p.bare, ['rev-parse', 'main']).stdout.trim();
  const rootSha = h.git(p.bare, ['rev-list', '--max-parents=0', 'board']).stdout.trim();
  const message = h.git(p.bare, ['log', '-1', '--format=%B', rootSha]).stdout;
  assert.match(message, new RegExp('Migrated-From: ' + baseSha));
  assert.match(message, /Backlog-Blob: [0-9a-f]{40}/);

  // The clone and the config.
  assert.equal(fs.existsSync(path.join(p.boardDir, '.git')), true);
  assert.equal(fs.readFileSync(path.join(p.boardDir, BACKLOG), 'utf8'), BOARD_TEXT);
  const config = JSON.parse(fs.readFileSync(path.join(p.repo, '.codeadd', 'board.json'), 'utf8'));
  assert.deepEqual(config, { remote: p.bare, branch: 'board' });

  // The code side: staged, never committed.
  assert.equal(h.git(p.repo, ['rev-parse', 'HEAD']).stdout, head);
  assert.deepEqual(staged(p), [
    'A\t.codeadd/board.json',
    'D\tdocs/backlog.definitions.json',
    'D\tdocs/backlog.jsonl',
    'M\t.gitignore',
  ].sort());
  const ignore = fs.readFileSync(path.join(p.repo, '.gitignore'), 'utf8').split('\n');
  assert.deepEqual(ignore.filter((l) => l.startsWith('.codeadd') || l.startsWith('!.codeadd')), ['.codeadd/*', '!.codeadd/board.json']);
  assert.equal(fs.existsSync(path.join(p.repo, BACKLOG)), false);
});

test('migrate-board#002 — L2.8: a re-run reports MIGRATED=already and changes nothing', (t) => {
  const p = project(t);
  assert.equal(migrate(p).status, 0);
  const before = staged(p);
  const again = migrate(p);
  assert.equal(again.status, 0, again.output);
  assert.equal(kv(again).MIGRATED, 'already');
  assert.equal(kv(again).CODE_CHANGES, undefined);
  assert.deepEqual(staged(p), before);
});

test('migrate-board#003 — L2.8: an ignore file that already holds the pair is not touched or staged', (t) => {
  const p = project(t, { ignore: '/.codeadd/*\n!/.codeadd/board.json\nnode_modules/\n' });
  const res = migrate(p);
  assert.equal(res.status, 0, res.output);
  assert.equal(fs.readFileSync(path.join(p.repo, '.gitignore'), 'utf8'), '/.codeadd/*\n!/.codeadd/board.json\nnode_modules/\n');
  assert.equal(staged(p).some((l) => l.endsWith('.gitignore')), false);
});

test('migrate-board#004 — L2.8: a base-only change after the run is board-diverged, and --reimport applies it', (t) => {
  const p = project(t);
  assert.equal(migrate(p).status, 0);
  pushToMain(p, (dir) => {
    h.write(path.join(dir, BACKLOG), row('0001B', 'first') + '\n' + row('0002B', 'second EDITED') + '\n' + row('0003B', 'third') + '\n');
  });

  const refused = migrate(p);
  assert.equal(refused.status, 1, refused.output);
  assert.equal(kv(refused).ERROR, 'board-diverged');
  assert.deepEqual(kv(refused).BASE_ONLY.split(',').sort(), ['0002B', '0003B']);
  assert.equal(kv(refused).BOTH, '');
  assert.equal(remoteBoard(p), BOARD_TEXT, 'nothing was applied without --reimport');

  const done = migrate(p, ['--reimport']);
  assert.equal(done.status, 0, done.output);
  assert.equal(kv(done).REIMPORTED, '2');
  const lines = remoteBoard(p).trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(lines.map((l) => l.id), ['0001B', '0002B', '0003B']);
  assert.equal(lines[1].title, 'second EDITED');
  const tip = h.git(p.bare, ['log', '-1', '--format=%B', 'board']).stdout;
  assert.match(tip, /Reimported-From: [0-9a-f]{40}:[0-9a-f]{40}/);

  // The recorded blob moved forward: the next run is clean.
  assert.equal(kv(migrate(p)).MIGRATED, 'already');
});

test('migrate-board#005 — L2.8: a change on both sides is never merged, even with --reimport', (t) => {
  const p = project(t);
  assert.equal(migrate(p).status, 0);
  // The board moves: 0001B edited through the one route.
  const record = h.write(path.join(p.base, 'patch.json'), '{"title":"first (board side)"}');
  const write = h.runScript('backlog-commit', ['update', '0001B', '--record-file', record], { cwd: p.repo, env: p.env });
  assert.equal(write.status, 0, write.output);
  // And the base moves too: the same ticket edited through the old route.
  pushToMain(p, (dir) => {
    h.write(path.join(dir, BACKLOG), row('0001B', 'first (base side)') + '\n' + row('0002B', 'second') + '\n');
  });

  for (const args of [[], ['--reimport']]) {
    const res = migrate(p, args);
    assert.equal(res.status, 1, res.output);
    assert.equal(kv(res).ERROR, 'board-diverged');
    assert.equal(kv(res).BOTH, '0001B');
  }
  assert.match(remoteBoard(p), /first \(board side\)/);
  assert.doesNotMatch(remoteBoard(p), /base side/);
});

test('migrate-board#006 — L2.8: a board branch not made by this script is board-unrecognised, nothing changed', (t) => {
  const p = project(t);
  // Someone created `board` by hand.
  const seed = path.join(p.base, 'seed');
  fs.mkdirSync(seed);
  h.git(seed, ['init', '-q', '--initial-branch=board']);
  h.git(seed, ['config', 'user.email', 'a@a.com']);
  h.git(seed, ['config', 'user.name', 'A']);
  h.git(seed, ['config', 'commit.gpgsign', 'false']);
  h.write(path.join(seed, BACKLOG), '');
  commitAll(seed, 'hand made');
  h.git(seed, ['push', '-q', p.bare, 'board']);

  const res = migrate(p);
  assert.equal(res.status, 1, res.output);
  assert.equal(kv(res).ERROR, 'board-unrecognised');
  assert.equal(fs.existsSync(path.join(p.repo, '.codeadd', 'board.json')), false, 'the config was not left behind');
  assert.deepEqual(staged(p), []);
  assert.equal(fs.existsSync(path.join(p.repo, BACKLOG)), true, 'the old file is untouched');
});

test('migrate-board#007 — L2.8: no origin is ERROR=no-remote, exit 1, nothing changed', (t) => {
  const p = project(t, { origin: false });
  const res = migrate(p);
  assert.equal(res.status, 1, res.output);
  assert.equal(kv(res).ERROR, 'no-remote');
  assert.deepEqual(staged(p), []);
  assert.equal(fs.existsSync(path.join(p.repo, '.codeadd')), false);
});

test('migrate-board#008 — L2.8: a clean leftover .worktrees/backlog is removed; recovery refs are counted and kept', (t) => {
  const p = project(t);
  const leftover = path.join(p.repo, '.worktrees', 'backlog');
  h.git(p.repo, ['worktree', 'add', '-q', '--detach', leftover, 'main']);
  const sha = h.git(p.repo, ['rev-parse', 'main']).stdout.trim();
  h.git(p.repo, ['update-ref', 'refs/codeadd/backlog-recovery/' + sha, sha]);

  const res = migrate(p);
  assert.equal(res.status, 0, res.output);
  assert.equal(kv(res).LEFTOVER, 'removed');
  assert.equal(fs.existsSync(leftover), false);
  assert.equal(kv(res).RECOVERY_REFS, '1');
  assert.equal(h.git(p.repo, ['rev-parse', '--verify', '-q', 'refs/codeadd/backlog-recovery/' + sha]).status, 0);
});

test('migrate-board#009 — L2.8: a leftover worktree with unsaved work is reported and left alone', (t) => {
  const p = project(t);
  const leftover = path.join(p.repo, '.worktrees', 'backlog');
  h.git(p.repo, ['worktree', 'add', '-q', '--detach', leftover, 'main']);
  h.write(path.join(leftover, 'unsaved.txt'), 'work\n');

  const res = migrate(p);
  assert.equal(res.status, 0, res.output);
  assert.equal(kv(res).LEFTOVER, 'kept');
  assert.equal(kv(res).RECOVERY_PATH, leftover);
  assert.equal(fs.existsSync(path.join(leftover, 'unsaved.txt')), true);
});

test('migrate-board#010 — a base with no board migrates to an empty one', (t) => {
  const p = project(t, { board: false });
  const res = migrate(p);
  assert.equal(res.status, 0, res.output);
  assert.equal(remoteBoard(p), '');
  assert.equal(kv(res).MIGRATED, 'done');
  assert.deepEqual(staged(p).filter((l) => l.includes('docs/')), []);
});

test('migrate-board#011 — an unknown argument and a directory outside git are caller errors, exit 2', (t) => {
  const p = project(t);
  const bad = migrate(p, ['--force']);
  assert.equal(bad.status, 2, bad.output);
  assert.equal(kv(bad).ERROR, 'bad-argument');

  const plain = h.mkTmp('codeadd-plain-');
  t.after(() => h.rmrf(plain));
  const outside = h.runFile(ENTRY, [], { cwd: plain, env: p.env });
  assert.equal(outside.status, 2, outside.output);
  assert.equal(kv(outside).ERROR, 'not-a-git-repository');
});

test('migrate-board#012 — the script is internal: it ships in no registry, package or inventory', () => {
  const root = h.REPO_ROOT;
  for (const rel of ['framwork/provider-map.json', 'AGENTS.md', 'framwork/.codeadd/skills/add--ecosystem/SKILL.md',
    'framwork/.codeadd/skills/add--resource-path-convention/SKILL.md', '.github/workflows/release.yml', 'cli/package.json']) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    assert.equal(text.includes('migrate-board'), false, rel);
  }
  assert.equal(fs.existsSync(path.join(root, 'framwork', '.codeadd', 'scripts', 'migrate-board.cjs')), false);
});

// ─── Standalone run: the script alone, the project's own installed modules ───

const FRAMEWORK_SCRIPTS = path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'scripts');

/** The migration copied ALONE into a temp dir — no clone around it. */
function loneScript(t) {
  const dir = h.mkTmp('codeadd-lone-');
  t.after(() => h.rmrf(dir));
  const file = path.join(dir, 'migrate-board.cjs');
  fs.copyFileSync(path.join(h.REPO_ROOT, ENTRY), file);
  return file;
}

/** Give the project the scripts a codeadd 1.5+ install puts in .codeadd/scripts/. */
function installScripts(p) {
  fs.cpSync(FRAMEWORK_SCRIPTS, path.join(p.repo, '.codeadd', 'scripts'), { recursive: true });
}

const runLone = (file, p, args = []) => h.runNode([file, ...args], { cwd: p.repo, env: p.env });
const sameDir = (a, b) => fs.realpathSync(a) === fs.realpathSync(b);
const ignored = (p) => h.git(p.repo, ['check-ignore', '-q', '.codeadd/board.json']).status === 0;

test('migrate-board#013 — L1.6: the script downloaded ALONE runs with the project\'s own .codeadd/scripts', (t) => {
  const p = project(t);
  installScripts(p);
  const res = runLone(loneScript(t), p);
  assert.equal(res.status, 0, res.output);
  const out = kv(res);
  assert.equal(out.MIGRATED, 'done');
  assert.ok(sameDir(out.MODULES, path.join(p.repo, '.codeadd', 'scripts')), 'MODULES names the project copy: ' + out.MODULES);
  assert.equal(remoteBoard(p), BOARD_TEXT);
});

test('migrate-board#014 — L1.7: no modules in the project, or one export missing, is ERROR=board-modules-missing before any change', (t) => {
  const lone = loneScript(t);

  const bare = project(t);
  const none = runLone(lone, bare);
  assert.equal(none.status, 1, none.output);
  assert.equal(kv(none).ERROR, 'board-modules-missing');
  assert.match(none.stdout, /1\.5\.0/);
  assert.equal(fs.existsSync(path.join(bare.repo, '.codeadd', 'board.json')), false);
  assert.deepEqual(staged(bare), []);
  assert.equal(h.git(bare.bare, ['ls-remote', '--heads', bare.bare, 'board']).stdout, '', 'no board branch was made');

  const old = project(t);
  installScripts(old);
  const boardFile = path.join(old.repo, '.codeadd', 'scripts', 'backlog-board.cjs');
  fs.renameSync(boardFile, boardFile.replace('.cjs', '-real.cjs'));
  h.write(boardFile, "const { readConfig, ...rest } = require('./backlog-board-real.cjs');\nmodule.exports = rest;\n");
  const missing = runLone(lone, old);
  assert.equal(missing.status, 1, missing.output);
  assert.equal(kv(missing).ERROR, 'board-modules-missing');
  assert.match(missing.stdout, /readConfig/);
  assert.equal(fs.existsSync(path.join(old.repo, '.codeadd', 'board.json')), false);
  assert.deepEqual(staged(old), []);
});

for (const [i, form] of ['.codeadd/*', '/.codeadd/*', '.codeadd/**', '.codeadd', '/.codeadd'].entries()) {
  test(`migrate-board#0${15 + i} — L1.8: an ignore line ${form} leaves .codeadd/board.json tracked`, (t) => {
    const p = project(t, { ignore: `node_modules/\n${form}\n` });
    const res = migrate(p);
    assert.equal(res.status, 0, res.output);
    assert.equal(ignored(p), false, fs.readFileSync(path.join(p.repo, '.gitignore'), 'utf8'));
    assert.ok(staged(p).some((l) => l.endsWith('.gitignore')), '.gitignore is staged');
    assert.equal(kv(res).IGNORE_WARNING, undefined);
  });
}

test('migrate-board#020 — L1.9: a rule the script does not recognise gets IGNORE_WARNING, the migration still finishes', (t) => {
  const p = project(t, { ignore: 'node_modules/\n' });
  h.write(path.join(p.repo, '.git', 'info', 'exclude'), '.codeadd/\n');
  const res = migrate(p);
  assert.equal(res.status, 0, res.output);
  assert.equal(kv(res).MIGRATED, 'done');
  assert.equal(kv(res).IGNORE_WARNING, 'board-json-ignored');
  assert.match(res.stdout, /exclude/);
});

test('migrate-board#021 — L2.4: after the standalone run, backlog-commit add from the project writes to the new board branch', (t) => {
  const p = project(t);
  installScripts(p);
  const res = runLone(loneScript(t), p);
  assert.equal(res.status, 0, res.output);
  const record = h.write(path.join(p.base, 'new.json'), JSON.stringify({ title: 'after the move', tldr: 't', done_when: 'it works' }));
  const written = h.runNode([path.join(p.repo, '.codeadd', 'scripts', 'backlog-commit.cjs'), 'add', '--record-file', record], { cwd: p.repo, env: p.env });
  assert.equal(written.status, 0, written.output);
  assert.match(remoteBoard(p), /after the move/);
});
