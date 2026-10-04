/**
 * backlog-publication.test.js — the native publication and recovery matrix (L3).
 *
 * Every route and recovery path runs against DISPOSABLE repositories and
 * remotes; the real repository is never opened by a publication call. The
 * honest injections:
 *   - a failing pre-commit hook for the commit failure;
 *   - an unreachable origin for the fetch failure;
 *   - a conflicting remote commit for the rebase conflict;
 *   - a checked-out non-bare remote for the push refusal;
 *   - a post-commit hook that pre-creates the recovery ref, proving a
 *     pre-existing matching ref is protective but never owned;
 *   - a mutated recovery ref for the moved-ref case, at component level,
 *     because no hook fires between the creation and the deletion.
 *
 * RED-first: the native publication entry did not exist — the ledger
 * records that before this landed.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS = path.join(ROOT, 'framwork', '.codeadd', 'scripts');
const PUB = path.join(SCRIPTS, 'backlog-commit.cjs');
const LOCAL = path.join(SCRIPTS, 'backlog-cli.cjs');
const Git = require(path.join(SCRIPTS, 'backlog-git.cjs'));

const ROOTS = [];

afterEach(() => {
  for (const dir of ROOTS.splice(0)) {
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch { /* a retained tree is content, not a failure */ }
  }
});

const tempBase = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-pub-'));
  ROOTS.push(dir);
  return dir;
};

const read = (file) => fs.readFileSync(file, 'utf8');

const gitR = (args, cwd, opts = {}) => Git.run(args, cwd, { allowFailure: true, ...opts });

const gitOut = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

function repo(tag, { base = 'main', remote = true, seed } = {}) {
  const space = tempBase();
  const origin = remote ? path.join(space, 'origin.git') : null;
  const main = path.join(space, tag);

  fs.mkdirSync(main, { recursive: true });
  gitR(['init', '-b', base, main]);
  gitR(['config', 'user.email', 'test@example.com'], main);
  gitR(['config', 'user.name', 'Test'], main);
  if (seed) seed(main);
  gitR(['add', '--all'], main);
  gitR(['commit', '-m', 'seed'], main);
  if (remote) {
    fs.mkdirSync(origin, { recursive: true });
    gitR(['init', '--bare', '-b', base, origin]);
    gitR(['remote', 'add', 'origin', origin], main);
    gitR(['push', 'origin', `HEAD:refs/heads/${base}`], main);
  }
  return { space, main, origin, base };
}

// Seed content ------------------------------------------------------------
const ticket = (title) => JSON.stringify({
  title, theme: 'general', labels: [], tldr: title, notes: [], done_when: 'it works',
  paths: [], grounded: false, status: 'open',
});

const row = (id, title) =>
  `{"id":"${id}","title":"${title}","theme":"general","labels":[],"tldr":"${title}","notes":[],"done_when":"it works","paths":[],"grounded":false,"status":"open","created_at":"2026-09-20T00:00:00Z","updated_at":"2026-09-20T00:00:00Z","comments":[],"feature":null,"work_id":null}`;

const seed = (main) => {
  fs.mkdirSync(path.join(main, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(main, 'docs', 'backlog.jsonl'), row('0001B', 'first') + '\n');
  fs.writeFileSync(path.join(main, 'docs', 'backlog.definitions.json'),
    '{\n  "statuses": [\n    { "name": "open", "order": 1, "means": "decided, nobody picked it up" }\n  ]\n}\n');
};

// The publication call ----------------------------------------------------
const pub = (cwd, args, opts = {}) => {
  const r = spawnSync(process.execPath, [PUB, ...args], {
    cwd, encoding: 'utf8', input: opts.input !== undefined ? opts.input : '',
    env: opts.env || process.env,
  });
  return { status: r.status ?? 0, stdout: r.stdout || '', stderr: r.stderr || '' };
};

const parseReport = (stdout) => {
  const lines = stdout.split('\n').filter(Boolean);
  const keys = {};
  const rows = [];
  const errors = [];
  for (const line of lines) {
    if (line.startsWith('{')) { rows.push(line); continue; }
    if (line.startsWith('ERROR=') || line.startsWith('REFUSED=')) { errors.push(line); continue; }
    const eq = line.indexOf('=');
    if (eq > 0) keys[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return { keys, rows, errors, lines };
};

const writeRecord = (cwd, title, name = 'ticket.json') => {
  fs.writeFileSync(path.join(cwd, name), ticket(title));
  return name;
};

/** A record written OUTSIDE every working tree the run touches — the shape
 *  the plan's caller-cleanliness probes use. Absolute path in, absolute
 *  path out; the run never sees this file as its own working tree state. */
const recordOutside = (space, title, name = 'ticket.json') => {
  fs.mkdirSync(path.join(space, 'records'), { recursive: true });
  const file = path.join(space, 'records', name);
  fs.writeFileSync(file, ticket(title));
  return file;
};

/** The caller side the run is allowed to carry besides the committed work:
 *  the .worktrees/ convention line in .gitignore, which the old script also
 *  wrote, and nothing else. */
const callerResidue = (main) =>
  gitOut(['status', '--porcelain'], main)
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.endsWith('.gitignore'));

// ─── Discovery -----------------------------------------------------------

describe('L3 — base discovery mirrors get-main-branch.sh', () => {
  it('origin/HEAD, then remote main/master, then the LOCAL base branch', () => {
    const withRemote = repo('mirror-remote-', { seed });
    expect(Git.discoverBase(withRemote.main)).toEqual({ ok: true, branch: 'main' });

    const master = repo('mirror-master-', { seed, base: 'master' });
    expect(Git.discoverBase(master.main)).toEqual({ ok: true, branch: 'master' });

    const local = repo('mirror-local-', { seed, remote: false });
    expect(Git.discoverBase(local.main)).toEqual({ ok: true, branch: 'main' });
  });

  it('not a git repository and no base branch are distinct answers', () => {
    const plain = tempBase();
    expect(Git.discoverBase(plain)).toEqual({ ok: false, reason: 'not-a-git-repo' });

    const bare = path.join(tempBase(), 'nb');
    fs.mkdirSync(bare, { recursive: true });
    gitR(['init', '-b', 'work', bare]);
    gitR(['config', 'user.email', 't@e.com'], bare);
    gitR(['config', 'user.name', 'T'], bare);
    fs.writeFileSync(path.join(bare, 'f'), 'x');
    gitR(['add', '--all'], bare);
    gitR(['commit', '-m', 'x'], bare);
    expect(Git.discoverBase(bare)).toEqual({ ok: false, reason: 'no-base-branch' });
  });
});

// ─── Direct route ────────────────────────────────────────────────────────

describe('L3 — the direct route: path-scoped commit, preserved caller work', () => {
  it('the FIRST write on a fresh repository commits its untracked board file', () => {
    // The plan's L3 fixture list includes "Base checked out, direct base":
    // the deck stops being a seeded斯 fixture the moment the board is
    // untracked — which is also the shape F4's wrapper suite exercises, so
    // the vitest side pins the same path.
    const { main, origin } = repo('first-write-', {
      // No board file — the docs/ dir is born with THIS write. The root
      // fixture still carries a tracked placeholder so the seed commit and
      // its origin/main exist: an unborn branch is invisible to every
      // show-ref probe, and the untracked-board route is what is under test.
      seed: (main) => fs.writeFileSync(path.join(main, 'placeholder.txt'), 'tracked seed\n'),
    });
    // Board only in the write's path: no seed commit carried docs/.
    fs.writeFileSync(path.join(main, 'untracked-caller.txt'), 'caller untracked\n');

    const record = recordOutside(main, 'first ever');
    const result = pub(main, ['add', '--record-file', record]);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('direct');
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.TICKET_ID).toBe('0001B');
    expect(r.keys.PUSHED).toBe('yes');
    const files = gitOut(['show', '--pretty=format:', '--name-only', r.keys.SHA], main);
    expect(files).toContain('docs/backlog.jsonl');
    expect(files).not.toContain('untracked-caller.txt');
    expect(callerResidue(main)).toEqual(['?? records/', '?? untracked-caller.txt']);
    void origin;
  });
  it('commits ONLY the two board paths, pushes, and preserves the caller', () => {
    const { main, origin, space } = repo('direct-', { seed });
    fs.writeFileSync(path.join(main, 'unrelated-staged.txt'), 'staged by caller\n');
    fs.writeFileSync(path.join(main, 'unrelated-dirty.txt'), 'dirty by caller\n');
    gitR(['add', 'unrelated-staged.txt'], main);
    const stagedBefore = gitOut(['diff', '--cached', '--name-only'], main);

    const record = recordOutside(space, 'second');
    const result = pub(main, ['add', '--record-file', record]);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.errors).toEqual([]);
    expect(r.keys.ROUTE).toBe('direct');
    expect(r.keys.BASE_BRANCH).toBe('main');
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.TICKET_ID).toBe('0002B');
    expect(r.keys.PUSHED).toBe('yes');
    expect(r.keys.SHA).toMatch(/^[0-9a-f]{40}$/);

    // Exactly the board paths the write touched: an update/add changes the
    // backlog line; the definitions join the commit only when the write
    // seeded them. Nothing else belongs in this tree, ever.
    const files = gitOut(['show', '--pretty=format:', '--name-only', r.keys.SHA], main).split('\n');
    expect(files).toContain('docs/backlog.jsonl');
    expect(files.filter((f) => f)).toEqual(files.filter((f) => f.startsWith('docs/')));

    // The caller's staged and unstaged work survives untouched: the staged
    // entry is still staged ('A '), the dirty file still untracked.
    expect(gitOut(['diff', '--cached', '--name-only'], main)).toBe(stagedBefore);
    expect(callerResidue(main)).toEqual(['A  unrelated-staged.txt', '?? unrelated-dirty.txt']);

    // The pushed remote state carries the ticket.
    const remoteHead = gitOut(['rev-parse', 'HEAD'], origin);
    expect(remoteHead).toBe(r.keys.SHA);
  });

  it('an update carries the record file and rewrites one line only', () => {
    const { main } = repo('direct-update-', { seed });
    fs.writeFileSync(path.join(main, 'patch.json'), JSON.stringify({ title: 'renamed first' }));

    const result = pub(main, ['update', '0001B', '--record-file', 'patch.json']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.TICKET_ID).toBe('0001B');
    expect(r.keys.ROUTE).toBe('direct');
    const lines = read(path.join(main, 'docs', 'backlog.jsonl')).trim().split('\n');
    expect(JSON.parse(lines[0]).title).toBe('renamed first');
  });
});

// ─── Worktree routes ─────────────────────────────────────────────────────

describe('L3 — the worktree route: feature branch and detached HEAD', () => {
  it('lands the ticket on the REMOTE BASE through a locked worktree', () => {
    const { main, origin, space, base } = repo('worktree-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/somewhere'], main);

    const record = recordOutside(space, 'from feature');
    const result = pub(main, ['add', '--record-file', record]);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('worktree');
    expect(r.keys.BASE_BRANCH).toBe(base);
    expect(r.keys.PUSHED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.TICKET_ID).toBe('0002B');
    expect(r.keys.SHA).toMatch(/^[0-9a-f]{40}$/);

    const remoteHead = gitOut(['rev-parse', 'HEAD'], origin);
    expect(remoteHead).toBe(r.keys.SHA);
    expect(gitOut(['show', '--pretty=format:', '--name-only', remoteHead], origin))
      .toContain('docs/backlog.jsonl');

    // The caller branch never moved; only the .gitignore convention lands.
    expect(callerResidue(main)).toEqual([]);
    expect(gitOut(['rev-parse', '--abbrev-ref', 'HEAD'], main)).toBe('feat/somewhere');
    expect(fs.existsSync(path.join(main, '.worktrees', 'backlog'))).toBe(false);

    // Owned recovery refs release after a verified push.
    expect(gitOut(['for-each-ref', Git.RECOVERY_NS], main)).toBe('');
  });

  it('a caller from a LINKED worktree still captures through the route', () => {
    const { main, origin } = repo('linked-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/in-link', main]);
    const linked = path.join(path.dirname(main), 'linked-work');
    gitR(['worktree', 'add', '--detach', linked, 'main'], main);
    fs.writeFileSync(path.join(linked, 'in-link.txt'), 'link caller file\n');
    gitR(['add', 'in-link.txt'], linked);

    writeRecord(linked, 'from linked worktree');
    const result = pub(linked, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('worktree');
    expect(r.keys.PUSHED).toBe('yes');
    expect(gitOut(['rev-parse', 'HEAD'], origin)).toBe(r.keys.SHA);
  });

  it('a detached HEAD takes the worktree route', () => {
    const { main } = repo('detached-', { seed });
    gitR(['checkout', '-q', '--detach'], main);
    writeRecord(main, 'from detached');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('worktree');
    expect(r.keys.PUSHED).toBe('yes');
  });
});

// ─── Degraded routing ────────────────────────────────────────────────────

describe('L3 — degraded routes keep the write in the caller tree', () => {
  it('not-a-git-repo: persists uncommitted, exits 0, states the recovery path', () => {
    const dir = tempBase();
    writeRecord(dir, 'no repo');
    const result = pub(dir, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('none');
    expect(r.keys.DEGRADED).toBe('not-a-git-repo');
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('no');
    expect(r.keys.TICKET_ID).toBe('0001B');
    expect(path.resolve(r.keys.RECOVERY_PATH)).toBe(path.resolve(dir));
    expect(fs.existsSync(path.join(dir, 'docs', 'backlog.jsonl'))).toBe(true);
  });

  it('no-base-branch: same shape, named reason', () => {
    const { main } = repo('nobase-', { seed, base: 'work', remote: false });
    writeRecord(main, 'no base');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('none');
    expect(r.keys.DEGRADED).toBe('no-base-branch');
    expect(r.keys.PERSISTED).toBe('yes');
  });

  it('worktree creation failure: the caller tree carries the write, named why', () => {
    const { main } = repo('wtfail-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/blocked'], main);
    fs.mkdirSync(path.join(main, '.worktrees'), { recursive: true });
    fs.writeFileSync(path.join(main, '.worktrees', 'backlog'), 'not a tree\n');

    writeRecord(main, 'creation fails');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('none');
    expect(r.keys.DEGRADED).toBe('worktree-failed');
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('no');
    // The blocking file is not the run's to delete.
    expect(read(path.join(main, '.worktrees', 'backlog'))).toBe('not a tree\n');
  });
});

// ─── The sweep ───────────────────────────────────────────────────────────

describe('L3 — the sweep refuses what it must not discard', () => {
  it('a LOCKED registration refuses with instructions and removes NOTHING', () => {
    const { main } = repo('locked-sweep-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/x'], main);
    gitR(['worktree', 'add', '--detach', '.worktrees/backlog', 'main'], main);
    gitR(['worktree', 'lock', '.worktrees/backlog'], main);
    const wtPath = path.join(main, '.worktrees', 'backlog');
    writeRecord(wtPath, 'locked leftovers');

    const before = read(path.join(wtPath, 'docs', 'backlog.jsonl'));
    writeRecord(main, 'never happens');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    expect(result.status).toBe(2);
    expect(result.stdout).toContain('REFUSED=worktree-locked');
    expect(result.stdout).toContain('git worktree unlock');
    expect(read(path.join(wtPath, 'docs', 'backlog.jsonl'))).toBe(before);
    expect(gitOut(['worktree', 'list', '--porcelain'], main)).toContain('locked');
  });

  it('an unlocked DIRTY leftover refuses reuse and keeps every byte', () => {
    const { main } = repo('dirty-sweep-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/x'], main);
    gitR(['worktree', 'add', '--detach', '.worktrees/backlog', 'main'], main);
    const wtPath = path.join(main, '.worktrees', 'backlog');
    writeRecord(wtPath, 'uncommitted leftovers here');

    const before = read(path.join(wtPath, 'docs', 'backlog.jsonl'));
    writeRecord(main, 'should refuse');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    expect(result.status).toBe(2);
    expect(result.stdout).toContain('REFUSED=worktree-recovery-required');
    expect(result.stdout).toContain('git worktree remove');
    expect(read(path.join(wtPath, 'docs', 'backlog.jsonl'))).toBe(before);
  });

  it('an unlocked CLEAN but unprotected detached commit refuses reuse', () => {
    const { main, origin } = repo('clean-sweep-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/x'], main);
    gitR(['worktree', 'add', '--detach', '.worktrees/backlog', 'main'], main);
    fs.writeFileSync(path.join(main, '.worktrees', 'backlog', 'docs', 'note.txt'), 'tracked-clean note\n');
    gitR(['-C', path.join(main, '.worktrees', 'backlog'), 'add', '--all'], main);
    gitR(['-C', path.join(main, '.worktrees', 'backlog'), 'commit', '-m', 'leftover clean-ish'], main);

    const record = recordOutside(main, 'sweep then write');
    const result = pub(main, ['add', '--record-file', record]);
    expect(result.status).toBe(2);
    expect(result.stdout).toContain('REFUSED=worktree-recovery-required');
    expect(read(path.join(main, '.worktrees', 'backlog', 'docs', 'note.txt'))).toBe('tracked-clean note\n');
    void origin;
  });
});

// ─── Commit failure: retained with its bytes ─────────────────────────────

describe('L3 — a failed commit keeps the data and reports where', () => {
  it('pre-commit-hook failure: exit 1, tree retained and unlocked, data readable', () => {
    const { main } = repo('commit-fail-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/failing'], main);
    const hook = path.join(main, '.git', 'hooks', 'pre-commit');
    fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n');
    fs.chmodSync(hook, 0o755);

    writeRecord(main, 'commit should fail');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(1);
    expect(r.errors).toContain('ERROR=commit-failed');
    expect(r.keys.ROUTE).toBe('worktree');
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('no');
    expect(path.resolve(r.keys.RECOVERY_PATH)).toBe(path.join(main, '.worktrees', 'backlog'));

    // The data lives at the reported recovery path, and the local CLI reads
    // it with no git at all.
    const lastLine = read(path.join(r.keys.RECOVERY_PATH, 'docs', 'backlog.jsonl')).trim().split('\n').pop();
    expect(JSON.parse(lastLine).title).toBe('commit should fail');
    const listed = spawnSync(process.execPath, [LOCAL, 'list', '--all'], { cwd: r.keys.RECOVERY_PATH, encoding: 'utf8' });
    expect(listed.stdout).toContain('TICKETS_TOTAL=2');

    // A normal exit releases the active lock, but dirty recovery still refuses reuse.
    const again = pub(main, ['add', '--record-file', 'ticket.json']);
    writeRecord(main, 'second attempt');
    expect(again.status).toBe(2);
    expect(again.stdout).toContain('REFUSED=worktree-recovery-required');
  });
});

describe('review regressions — durable recovery and caller intent', () => {
  it('failed recovery-ref creation blocks rebase and push and retains the tree', () => {
    const { main, origin, space } = repo('review-ref-fail-', { seed });
    gitOut(['checkout', '-b', 'feat/review'], main);
    const oldRemote = gitOut(['rev-parse', 'main'], origin);
    // Block the namespace itself; no knowledge of the future commit SHA is needed.
    fs.writeFileSync(path.join(main, '.git/refs/codeadd'), 'not a directory');
    const result = pub(main, ['add', '--record-file', recordOutside(space, 'protection failed')]);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.DEGRADED).toBe('recovery-ref-failed');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.RECOVERY_PATH).toBe(path.join(main, '.worktrees/backlog'));
    expect(gitOut(['rev-parse', 'main'], origin)).toBe(oldRemote);
    expect(read(path.join(r.keys.RECOVERY_PATH, 'docs/backlog.jsonl'))).toContain('protection failed');
  });

  it('overlapping caller edits degrade without overwriting staged intent', () => {
    const { main, space } = repo('review-overlap-', { seed });
    const file = path.join(main, 'docs/backlog.jsonl');
    fs.writeFileSync(file, read(file).replaceAll('first', 'caller staged'));
    gitOut(['add', 'docs/backlog.jsonl'], main);
    const stagedBefore = gitOut(['diff', '--cached'], main);
    const oldHead = gitOut(['rev-parse', 'HEAD'], main);
    const patch = path.join(space, 'patch.json');
    fs.writeFileSync(patch, JSON.stringify({ title: 'operation overlapping title' }));
    const result = pub(main, ['update', '0001B', '--record-file', patch]);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.DEGRADED).toBe('caller-worktree-dirty');
    expect(r.keys.COMMITTED).toBe('no');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.RECOVERY_PATH).toBe(main);
    expect(gitOut(['rev-parse', 'HEAD'], main)).toBe(oldHead);
    expect(gitOut(['diff', '--cached'], main)).toBe(stagedBefore);
    expect(read(file)).toContain('operation overlapping title');
  });

  it('reports a staging failure after persistence without an uncaught exception', () => {
    const { main, space } = repo('review-stage-', { seed });
    fs.writeFileSync(path.join(main, '.git', 'index.lock'), 'held by another Git process');
    const result = pub(main, ['add', '--record-file', recordOutside(space, 'stage failure')]);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(1);
    expect(r.errors).toContain('ERROR=commit-failed');
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('no');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.RECOVERY_PATH).toBe(main);
    expect(read(path.join(main, '.git', 'index.lock'))).toBe('held by another Git process');
    expect(read(path.join(main, 'docs/backlog.jsonl'))).toContain('stage failure');
    expect(result.stderr).not.toContain('GitError');
  });

  it('publishes only the operation, preserving staged and unstaged definitions', () => {
    const { main, space } = repo('review-index-', { seed });
    const defs = path.join(main, 'docs/backlog.definitions.json');
    const headDefs = gitOut(['show', 'HEAD:docs/backlog.definitions.json'], main);
    fs.writeFileSync(defs, headDefs.replace('decided, nobody picked it up', 'caller staged') + '\n');
    gitOut(['add', 'docs/backlog.definitions.json'], main);
    const stagedBefore = gitOut(['diff', '--cached'], main);
    fs.writeFileSync(defs, headDefs.replace('decided, nobody picked it up', 'caller unstaged') + '\n');
    const workingBefore = read(defs);
    const result = pub(main, ['add', '--record-file', recordOutside(space, 'isolated delta')]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('COMMITTED=yes');
    expect(gitOut(['show', 'HEAD:docs/backlog.definitions.json'], main)).toBe(headDefs);
    expect(gitOut(['diff', '--cached'], main)).toBe(stagedBefore);
    expect(read(defs)).toBe(workingBefore);
    expect(gitOut(['show', '--pretty=format:', '--name-only', 'HEAD'], main)).toBe('docs/backlog.jsonl');
  });

  it('preserves staged backlog edits while committing a disjoint add', () => {
    const { main, space } = repo('review-backlog-index-', { seed: (root) => {
      seed(root);
      fs.writeFileSync(path.join(root, 'docs/backlog.jsonl'), Array.from({ length: 8 }, (_, i) => row(`000${i + 1}B`, `ticket ${i + 1}`)).join('\n') + '\n');
    } });
    const file = path.join(main, 'docs/backlog.jsonl');
    fs.writeFileSync(file, read(file).replaceAll('ticket 1', 'caller staged'));
    gitOut(['add', 'docs/backlog.jsonl'], main);
    fs.writeFileSync(file, read(file).replaceAll('ticket 4', 'caller unstaged'));
    const result = pub(main, ['add', '--record-file', recordOutside(space, 'disjoint addition')]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('COMMITTED=yes');
    const committed = gitOut(['show', 'HEAD:docs/backlog.jsonl'], main);
    expect(committed).toContain('disjoint addition');
    expect(committed).not.toContain('caller');
    const staged = gitOut(['show', ':docs/backlog.jsonl'], main);
    expect(staged).toContain('caller staged');
    expect(staged).not.toContain('caller unstaged');
    expect(staged).toContain('disjoint addition');
    expect(read(file)).toContain('caller unstaged');
    expect(gitOut(['diff', '--cached'], main)).not.toContain('disjoint addition');
  });

  it('a paused clean linked-worktree rebase is unsafe to sweep', () => {
    const { main } = repo('review-rebase-', { seed });
    fs.writeFileSync(path.join(main, 'note.txt'), 'local commit\n');
    gitOut(['add', 'note.txt'], main);
    gitOut(['commit', '-m', 'local'], main);
    gitOut(['checkout', '-b', 'feat/review'], main);
    gitOut(['worktree', 'add', '--detach', '.worktrees/backlog', 'main'], main);
    const wt = path.join(main, '.worktrees/backlog');
    expect(gitR(['rebase', '--exec', 'exit 1', 'HEAD~1'], wt).status).not.toBe(0);
    expect(Git.conditionsAt(wt).rebasing).toBe(true);
    expect(Git.setupWorktree(main, 'main').refusal).toBe('worktree-recovery-required');
    expect(fs.existsSync(wt)).toBe(true);
  });

  it('a clean leftover protected by a recovery ref can be swept', () => {
    const { main, space } = repo('review-protected-', { seed });
    gitOut(['checkout', '-b', 'feat/review'], main);
    gitOut(['worktree', 'add', '--detach', '.worktrees/backlog', 'main'], main);
    const wt = path.join(main, '.worktrees/backlog');
    fs.writeFileSync(path.join(wt, 'note.txt'), 'protected\n');
    gitOut(['add', 'note.txt'], wt);
    gitOut(['commit', '-m', 'protected'], wt);
    const sha = gitOut(['rev-parse', 'HEAD'], wt);
    expect(Git.protectCommit(main, sha).ok).toBe(true);
    expect(pub(main, ['add', '--record-file', recordOutside(space, 'safe sweep')]).status).toBe(0);
    gitOut(['gc', '--prune=now'], main);
    expect(gitOut(['cat-file', '-t', sha], main)).toBe('commit');
  });

  it('reports a divergent local base even after successful rebase and push', () => {
    const { main, origin, space } = repo('review-base-', { seed });
    const other = path.join(space, 'other');
    gitOut(['clone', origin, other], main);
    gitOut(['config', 'user.name', 'Review'], other);
    gitOut(['config', 'user.email', 'review@example.com'], other);
    fs.writeFileSync(path.join(other, 'remote.txt'), 'remote\n');
    gitOut(['add', 'remote.txt'], other);
    gitOut(['commit', '-m', 'remote'], other);
    gitOut(['push', 'origin', 'main'], other);
    fs.writeFileSync(path.join(main, 'local.txt'), 'local\n');
    gitOut(['add', 'local.txt'], main);
    gitOut(['commit', '-m', 'local'], main);
    const old = gitOut(['rev-parse', 'main'], main);
    gitOut(['checkout', '-b', 'feat/review'], main);
    const result = pub(main, ['add', '--record-file', recordOutside(space, 'rebased publication')]);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.PUSHED).toBe('yes');
    expect(r.keys.DEGRADED).toBe('base-advance-failed');
    expect(gitOut(['rev-parse', 'main'], main)).toBe(old);
    expect(gitOut(['rev-parse', 'main'], origin)).toBe(r.keys.SHA);
    expect(gitOut(['rev-parse', r.keys.RECOVERY_REF], main)).toBe(r.keys.SHA);
  });
});

// ─── Fetch ───────────────────────────────────────────────────────────────

describe('L3 — a failing fetch is never a rebase or push trigger', () => {
  it('unreachable origin: fetch-failed, nothing pushed, the commit ref-protected', () => {
    const { main } = repo('fetch-fail-', { seed, remote: false });
    gitR(['checkout', '-q', '-b', 'feat/x'], main);
    gitR(['remote', 'add', 'origin', path.join(tempBase(), 'vanished.git')], main);

    writeRecord(main, 'fetch will fail');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('worktree');
    expect(r.keys.DEGRADED).toBe('fetch-failed');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.SHA).toMatch(/^[0-9a-f]{40}$/);
    // The durable ref names the reported sha.
    expect(gitOut(['rev-parse', Git.RECOVERY_NS + '/' + r.keys.SHA], main)).toBe(r.keys.SHA);
  });
});

// ─── Rebase: conflict aborts, dirty callers degrade ──────────────────────

describe('L3 — reconciliation protects the caller first', () => {
  const moveRemote = ({ main, origin, body }) => {
    const scratch = path.join(path.dirname(main), 'conflicting-clone');
    gitR(['clone', origin, scratch]);
    gitR(['config', 'user.email', 't@e.com'], scratch);
    gitR(['config', 'user.name', 'T'], scratch);
    fs.writeFileSync(path.join(scratch, body), body === 'docs/backlog.jsonl' ? row('0001B', 'CONFLICTLY rewritten on the remote') + '\n' : 'a harmless remote note\n');
    gitR(['add', body], scratch);
    gitR(['commit', '-m', 'remote moved'], scratch);
    gitR(['push', 'origin', 'HEAD:refs/heads/main'], scratch);
  };

  it('a direct-route conflicting remote: abort verified, commit retained, exit 0', () => {
    const { main, origin, space } = repo('direct-conflict-', { seed });
    moveRemote.call(null, { main, origin, body: 'docs/backlog.jsonl' });

    const record = recordOutside(space, 'conflicts on rebase');
    const result = pub(main, ['add', '--record-file', record]);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('direct');
    expect(r.keys.DEGRADED).toBe('rebase-conflict');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.SHA).toMatch(/^[0-9a-f]{40}$/);

    // Abort VERIFIED: nothing mid-rebase remains.
    expect(fs.existsSync(path.join(main, '.git', 'REBASE_HEAD'))).toBe(false);
    expect(fs.existsSync(path.join(main, 'rebase-merge'))).toBe(false);
    expect(gitOut(['status', '--porcelain'], main).replace(/\?\? \.gitignore/g, '').trim()).toBe('');
    // The commit survives on the local base branch, unpushed.
    expect(gitOut(['rev-parse', 'HEAD'], main)).toBe(r.keys.SHA);
  });

  it('a direct-route clean reconciliation: rebase succeeds and pushes', () => {
    const { main, space } = repo('direct-rebase-', { seed });
    moveRemote.call(null, { main, origin: path.join(space, 'origin.git'), body: 'docs/harmless.txt' });

    const record = recordOutside(space, 'rebase cleanly');
    const result = pub(main, ['add', '--record-file', record]);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.PUSHED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(gitOut(['rev-parse', 'HEAD'], main)).toBe(r.keys.SHA);
    const baseHead = gitOut(['rev-parse', 'origin/main'], main);
    expect(baseHead).toBe(r.keys.SHA);
  });

  it('staged and unstaged caller work degrades the rebase, never stashes', () => {
    const { main, origin, space } = repo('caller-dirty-', { seed });
    moveRemote.call(null, { main, origin, body: 'docs/harmless.txt' });

    fs.writeFileSync(path.join(main, 'staged-unrelated.txt'), 'caller staged\n');
    fs.writeFileSync(path.join(main, 'dirty-unrelated.txt'), 'caller dirty\n');
    gitR(['add', 'staged-unrelated.txt'], main);
    const stagedBefore = gitOut(['diff', '--cached', '--name-only'], main);

    const record = recordOutside(space, 'would rebase');
    const result = pub(main, ['add', '--record-file', record]);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.DEGRADED).toBe('caller-worktree-dirty');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.COMMITTED).toBe('yes');

    // The commit is on the local base; caller work exactly where it was.
    expect(gitOut(['rev-parse', 'HEAD'], main)).toBe(r.keys.SHA);
    expect(gitOut(['diff', '--cached', '--name-only'], main)).toBe(stagedBefore);
    expect(read(path.join(main, 'dirty-unrelated.txt'))).toBe('caller dirty\n');
  });
});

// ─── Push refusals and durable recovery refs ─────────────────────────────

describe('L3 — unpushed commits survive cleanup and gc through their ref', () => {
  it('push refused: the recovery ref is reported, the commit outlives gc', () => {
    const { main, origin } = repo('push-refused-', { seed });
    // A checked-out NON-BARE remote refuses the push, honestly.
    const deny = path.join(path.dirname(main), 'deny.git');
    fs.mkdirSync(deny, { recursive: true });
    gitR(['init', '-b', 'main', deny]);
    gitR(['config', 'user.email', 't@e.com'], deny);
    gitR(['config', 'user.name', 'T'], deny);
    fs.writeFileSync(path.join(deny, 'd'), 'd\n');
    gitR(['add', '--all'], deny);
    gitR(['commit', '-m', 'mount'], deny);
    gitR(['remote', 'remove', 'origin'], main);
    gitR(['remote', 'add', 'origin', deny], main);

    gitR(['checkout', '-q', '-b', 'feat/x'], main);
    writeRecord(main, 'push refuser');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.DEGRADED).toBe('push-refused');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.RECOVERY_REF).toBe(Git.RECOVERY_NS + '/' + r.keys.SHA);

    const refSha = gitOut(['rev-parse', r.keys.RECOVERY_REF], main);
    expect(refSha).toBe(r.keys.SHA);
    expect(fs.existsSync(path.join(main, '.worktrees', 'backlog'))).toBe(false);
    gitR(['gc', '--prune=now'], main);
    expect(gitOut(['cat-file', '-t', r.keys.SHA], main)).toBe('commit');
    void origin;
  });

  it('a pre-existing matching recovery ref protects but is NEVER owned', () => {
    const { main } = repo('preexist-', { seed });
    // A post-commit hook pre-creates the recovery ref the moment the commit
    // exists, so the invocation FINDS a matching ref it never created.
    const hook = path.join(main, '.git', 'hooks', 'post-commit');
    fs.writeFileSync(
      hook,
      '#!/bin/sh\nSHA=$(git rev-parse HEAD)\ngit update-ref ' + Git.RECOVERY_NS + '/$SHA $SHA\n',
    );
    fs.chmodSync(hook, 0o755);
    gitR(['checkout', '-q', '-b', 'feat/x'], main);

    writeRecord(main, 'pre-existing owner test');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.PUSHED).toBe('yes');
    // A ref this run did not create survives the verified push.
    expect(gitOut(['rev-parse', Git.RECOVERY_NS + '/' + r.keys.SHA], main))
      .toBe(r.keys.SHA);
  });

  it('a recovery ref whose value moved before deletion STAYS and is reported', () => {
    const { main } = repo('ref-move-', { seed, remote: false });
    const sha = gitOut(['rev-parse', 'HEAD'], main);
    const ref = Git.RECOVERY_NS + '/testref';
    expect(gitR(['update-ref', ref, sha, '0'.repeat(40)], main).status).toBe(0);

    fs.writeFileSync(path.join(main, 'other.md'), 'd\n');
    gitR(['add', 'other.md'], main);
    gitR(['commit', '-m', 'other'], main);
    const movedSha = gitOut(['rev-parse', 'HEAD'], main);
    gitR(['update-ref', ref, movedSha, sha], main);

    const released = Git.releaseOwnedRef(main, ref, sha);
    expect(released.ok).toBe(true);
    expect(released.deleted).toBe(false);
    expect(released.moved).toBe(true);
    expect(released.reason).toBe('recovery-ref-moved');
    expect(gitOut(['rev-parse', ref], main)).toBe(movedSha);

    const ownedRelease = Git.releaseOwnedRef(main, ref, movedSha);
    expect(ownedRelease.deleted).toBe(true);
  });
});

// ─── Base advance: verified fast-forward only ────────────────────────────

describe('L3 — base advance is a verified fast-forward only', () => {
  it('after a push, the UNCHECKED-OUT local base advances to the ticket sha', () => {
    const { main, base } = repo('base-advance-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/advance'], main);
    writeRecord(main, 'advance me');
    const result = pub(main, ['add', '--record-file', 'ticket.json']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.PUSHED).toBe('yes');
    expect(gitOut(['rev-parse', 'refs/heads/' + base], main)).toBe(r.keys.SHA);
    expect(gitOut(['rev-parse', '--abbrev-ref', 'HEAD'], main)).toBe('feat/advance');
  });

  it('a push-refused run keeps the OLD degradation precedence and never advances', () => {
    const { main, base } = repo('base-held-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/x'], main);
    // The base is checked out in a LINKED worktree, not in the caller tree.
    const linked = path.join(path.dirname(main), 'base-holder');
    gitR(['worktree', 'add', linked, base], main);

    // Push fails honestly: origin is a checked-out non-bare remote.
    const deny = path.join(path.dirname(main), 'deny.git');
    fs.mkdirSync(deny, { recursive: true });
    gitR(['init', '-b', 'main', deny]);
    gitR(['config', 'user.email', 't@e.com'], deny);
    gitR(['config', 'user.name', 'T'], deny);
    fs.writeFileSync(path.join(deny, 'd'), 'd\n');
    gitR(['add', '--all'], deny);
    gitR(['commit', '-m', 'mount'], deny);
    gitR(['remote', 'remove', 'origin'], main);
    gitR(['remote', 'add', 'origin', deny], main);

    const record = recordOutside(main, 'base held elsewhere');
    const result = pub(main, ['add', '--record-file', record]);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.PUSHED).toBe('no');
    // The wrapper's rule preserved: the push failure keeps the slot; the
    // NEW safety lives in the base ref, which moved nowhere.
    expect(r.keys.DEGRADED).toBe('push-refused');
    expect(gitOut(['rev-parse', 'refs/heads/' + base], main))
      .not.toBe(r.keys.SHA);
  });
});

// ─── The entry contract ──────────────────────────────────────────────────

describe('L3 — the publication entry contract against the wrapper', () => {
  it('a READ mode is refused by name, before any git happens', () => {
    const { main } = repo('read-refusal-', { seed });
    for (const mode of ['list', 'search', 'get']) {
      const result = pub(main, [mode]);
      expect(result.status).toBe(2);
      expect(result.stdout).toContain('ERROR=read-mode');
      expect(result.stderr).toContain('USAGE');
    }
  });

  it('get is refused even with an invalid id or a record-file spelling, before the file is read', () => {
    const { main } = repo('get-refusal-', { seed });
    expect(pub(main, ['get', '0001B']).stdout).toContain('ERROR=read-mode');
    expect(pub(main, ['get']).stdout).toContain('ERROR=read-mode');
    expect(pub(main, ['get', '--record-file', 'missing.json']).stdout).toContain('ERROR=read-mode');
    // The record file was never touched: the refusal precedes capture.
    expect(fs.existsSync(path.join(main, 'missing.json'))).toBe(false);
    // The repository keeps its head, index, files and refs.
    expect(gitOut(['rev-parse', 'HEAD'], main)).toBe(gitOut(['rev-parse', 'refs/heads/main'], main));
    expect(callerResidue(main)).toEqual([]);
  });

  it('a no-op write reports COMMITTED=no with the existing HEAD as SHA', () => {
    const { main } = repo('noop-', { seed });
    // move --top on the single ticket writes identical bytes.
    const result = pub(main, ['move', '0001B', '--top']);
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('no');
    expect(r.keys.SHA).toBe(gitOut(['rev-parse', 'HEAD'], main));
  });

  it('the whole local grammar survives through the publication entry', () => {
    const { main, space } = repo('grammar-parity-', { seed });
    const r1 = recordOutside(space, 'second one');
    expect(pub(main, ['add', '--record-file', r1]).status).toBe(0);
    const r2 = recordOutside(space, 'third one', 'third.json');
    expect(pub(main, ['add', '--record-file', r2]).status).toBe(0);

    const moved = pub(main, ['move', '0003B', '--top']);
    expect(moved.status).toBe(0);
    const rows = read(path.join(main, 'docs', 'backlog.jsonl')).trim().split('\n');
    expect(JSON.parse(rows[0]).id).toBe('0003B');
    expect(JSON.parse(rows[1]).id).toBe('0001B');
    expect(JSON.parse(rows[2]).id).toBe('0002B');

    expect(pub(main, ['remove', '0002B']).status).toBe(0);
    const after = read(path.join(main, 'docs', 'backlog.jsonl')).trim().split('\n');
    expect(JSON.parse(after[0]).title).toBe('third one');
  });

  it('a domain refusal prints REFUSED= with the CLI exit code and nothing else', () => {
    const { main } = repo('domain-refusal-', { seed });
    fs.writeFileSync(path.join(main, 'patch.json'), JSON.stringify({ title: 'nowhere' }));
    const result = pub(main, ['update', '0404B', '--record-file', 'patch.json']);
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('REFUSED=unknown-id\n');
  });

  it('a record-file failure exits 1 before anything is routed', () => {
    const { main } = repo('pub-read-fail-', { seed });
    gitR(['checkout', '-q', '-b', 'feat/x'], main);
    const result = pub(main, ['add', '--record-file', 'missing.json']);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('ERROR=record-read-failed');
    expect(fs.existsSync(path.join(main, '.worktrees'))).toBe(false);
  });

  it('the runner shape: the git module uses argument arrays, the entry runs nothing', () => {
    {
      const src = fs.readFileSync(path.join(SCRIPTS, 'backlog-git.cjs'), 'utf8');
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      expect(code).toContain("require('node:child_process')");
      expect(code).toMatch(/execFileSync\('git'/);
      expect(code).not.toMatch(/'(bash|sh|wsl)'/);
      expect(code).not.toMatch(/spawn\(/);
    }
    {
      const src = fs.readFileSync(path.join(SCRIPTS, 'backlog-commit.cjs'), 'utf8');
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      // The entry itself runs no process: git belongs to the git module.
      expect(code).not.toContain('child_process');
    }
  });
});
