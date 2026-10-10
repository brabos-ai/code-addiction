/**
 * backlog-publication.test.js — the native publication and recovery matrix (L3).
 *
 * Every write runs against DISPOSABLE repositories and remotes: a temp bare
 * remote holding the `board` branch, a temp code repository whose committed
 * `.codeadd/board.json` points at it, and a temp CODEADD_BOARD_DIR for the
 * clone. The real repository and the real ~/.codeadd/ are never opened. The
 * honest injections:
 *   - a failing pre-commit hook in the clone for the commit failure;
 *   - an unreachable origin for the fetch failure;
 *   - a pre-push hook that moves the remote underneath the run, for the
 *     rebase conflict and the clean reconciliation;
 *   - a pre-receive hook on the remote for the push refusal;
 *   - a post-commit hook that pre-creates the recovery ref, proving a
 *     pre-existing matching ref is protective but never owned;
 *   - a mutated recovery ref for the moved-ref case, at component level,
 *     because no hook fires between the creation and the deletion.
 *
 * The old route (base discovery, direct route, locked .worktrees/backlog,
 * caller-tree degradation, base advance) no longer exists and has no case.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS = path.join(ROOT, 'framwork', '.codeadd', 'scripts');
const PUB = path.join(SCRIPTS, 'backlog-commit.cjs');
const Git = require(path.join(SCRIPTS, 'backlog-git.cjs'));

const ROOTS = [];

afterEach(() => {
  for (const dir of ROOTS.splice(0)) {
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch { /* a retained tree is content, not a failure */ }
  }
});

const tempBase = () => {
  const dir = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-pub-')));
  ROOTS.push(dir);
  return dir;
};

const read = (file) => fs.readFileSync(file, 'utf8');

const gitR = (args, cwd, opts = {}) => Git.run(args, cwd, { allowFailure: true, ...opts });

const gitOut = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

// Seed content ------------------------------------------------------------
const ticket = (title) => JSON.stringify({
  title, theme: 'general', labels: [], tldr: title, notes: [], done_when: 'it works',
  paths: [], grounded: false, status: 'open',
});

const row = (id, title) =>
  `{"id":"${id}","title":"${title}","theme":"general","labels":[],"tldr":"${title}","notes":[],"done_when":"it works","paths":[],"grounded":false,"status":"open","created_at":"2026-09-20T00:00:00Z","updated_at":"2026-09-20T00:00:00Z","comments":[],"feature":null,"work_id":null}`;

const DEFS = '{\n  "statuses": [\n    { "name": "open", "order": 1, "means": "decided, nobody picked it up" }\n  ]\n}\n';

const identify = (cwd) => {
  gitR(['config', 'user.email', 'test@example.com'], cwd);
  gitR(['config', 'user.name', 'Test'], cwd);
  gitR(['config', 'commit.gpgsign', 'false'], cwd);
};

/**
 * A board fixture: the bare remote with `board` seeded with one ticket, the
 * code repository on `main` carrying the committed config, and the clone path.
 */
function board(tag, { seedBoard = true } = {}) {
  const space = tempBase();
  const bare = path.join(space, 'remote.git');
  gitR(['init', '--bare', '-q', '-b', 'main', bare], space);

  const seed = path.join(space, 'seed');
  fs.mkdirSync(seed);
  gitR(['init', '-q', '-b', 'board'], seed);
  identify(seed);
  fs.mkdirSync(path.join(seed, 'docs'));
  fs.writeFileSync(path.join(seed, 'docs', 'backlog.jsonl'), seedBoard ? row('0001B', 'first') + '\n' : '');
  fs.writeFileSync(path.join(seed, 'docs', 'backlog.definitions.json'), DEFS);
  gitR(['add', '--all'], seed);
  gitR(['commit', '-q', '-m', 'seed board'], seed);
  gitR(['push', '-q', bare, 'board'], seed);

  const main = path.join(space, tag);
  fs.mkdirSync(main, { recursive: true });
  gitR(['init', '-q', '-b', 'main'], main);
  identify(main);
  fs.mkdirSync(path.join(main, '.codeadd'));
  fs.writeFileSync(path.join(main, '.codeadd', 'board.json'), JSON.stringify({ remote: bare, branch: 'board' }));
  gitR(['add', '-f', '.codeadd/board.json'], main);
  gitR(['commit', '-q', '-m', 'init'], main);

  const boardDir = path.join(space, 'board-clone');
  const env = { ...process.env, NODE_OPTIONS: '', CODEADD_BOARD_DIR: boardDir, HOME: space, USERPROFILE: space };
  return { space, bare, main, boardDir, env };
}

// The publication call ----------------------------------------------------
const pub = (cwd, args, opts = {}) => {
  const r = spawnSync(process.execPath, [PUB, ...args], {
    cwd, encoding: 'utf8', input: opts.input !== undefined ? opts.input : '',
    env: opts.env || process.env,
  });
  return { status: r.status ?? 0, stdout: r.stdout || '', stderr: r.stderr || '' };
};

const pubAsync = (cwd, args, opts) => new Promise((resolve) => {
  const child = spawn(process.execPath, [PUB, ...args], { cwd, env: opts.env });
  let stdout = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.on('close', (status) => resolve({ status, stdout }));
  child.stdin.end(opts.input || '');
});

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

/** A record written OUTSIDE every working tree the run touches. */
const recordOutside = (space, title, name = 'ticket.json') => {
  fs.mkdirSync(path.join(space, 'records'), { recursive: true });
  const file = path.join(space, 'records', name);
  fs.writeFileSync(file, ticket(title));
  return file;
};

/** The board file as it stands on the remote's `board` branch. */
const remoteBoard = (b) => gitOut(['show', 'board:docs/backlog.jsonl'], b.bare);
const remoteIds = (b) => [...remoteBoard(b).matchAll(/"id":"(\d{4}B)"/g)].map((m) => m[1]);

/** Another machine: its own clone of the board, able to push. */
function otherMachine(b, name = 'other') {
  const dir = path.join(b.space, name);
  gitR(['clone', '-q', '--branch', 'board', b.bare, dir], b.space);
  identify(dir);
  return dir;
}

/** Make the first write, so the clone exists and later steps can hook into it. */
function warm(b) {
  const record = recordOutside(b.space, 'warm', 'warm.json');
  const result = pub(b.main, ['add', '--record-file', record], { env: b.env });
  expect(result.status).toBe(0);
  return parseReport(result.stdout).keys;
}

// ─── The one route ─────────────────────────────────────────────────────────

describe('L2 — the one write route: every branch and worktree writes the board branch', () => {
  it('a write from a feature branch lands only on origin/board', () => {
    const b = board('feature-branch-');
    gitR(['checkout', '-q', '-b', 'feat/x'], b.main);
    fs.writeFileSync(path.join(b.main, 'code.txt'), 'wip\n');
    gitR(['add', 'code.txt'], b.main);
    gitR(['commit', '-q', '-m', 'wip'], b.main);
    const featureHead = gitOut(['rev-parse', 'HEAD'], b.main);

    writeRecord(b.main, 'from a feature branch');
    const result = pub(b.main, ['add', '--record-file', 'ticket.json'], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('board');
    expect(r.keys.BOARD_DIR).toBe(b.boardDir);
    expect(r.keys.BASE_BRANCH).toBeUndefined();
    expect(r.keys.PUSHED).toBe('yes');
    expect(r.keys.DEGRADED).toBeUndefined();
    expect(remoteIds(b)).toEqual(['0001B', r.keys.TICKET_ID]);
    // Nothing else moved: the branch, its tree and the remote's other branches.
    expect(gitOut(['rev-parse', 'feat/x'], b.main)).toBe(featureHead);
    expect(fs.existsSync(path.join(b.main, '.worktrees'))).toBe(false);
    expect(fs.existsSync(path.join(b.main, 'docs', 'backlog.jsonl'))).toBe(false);
    expect(gitOut(['ls-remote', '--heads', b.bare], b.main)).not.toContain('refs/heads/main');
  });

  it('a write from a linked worktree lands only on origin/board', () => {
    const b = board('linked-worktree-');
    const linked = path.join(b.space, 'linked');
    gitR(['worktree', 'add', '-q', '-b', 'feat/y', linked], b.main);

    const record = recordOutside(b.space, 'from a linked worktree');
    const result = pub(linked, ['add', '--record-file', record], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('board');
    expect(r.keys.BOARD_DIR).toBe(b.boardDir);
    expect(remoteIds(b)).toEqual(['0001B', r.keys.TICKET_ID]);
    expect(gitOut(['status', '--porcelain'], linked)).toBe('');
    expect(gitOut(['status', '--porcelain'], b.main)).toBe('');
  });

  it('two writers serialise on the lock: different ids, both land', async () => {
    const b = board('two-writers-');
    warm(b);
    const opts = (title) => ({ env: b.env, input: ticket(title) });
    const [x, y] = await Promise.all([
      pubAsync(b.main, ['add'], opts('writer x')),
      pubAsync(b.main, ['add'], opts('writer y')),
    ]);
    expect(x.status).toBe(0);
    expect(y.status).toBe(0);
    const ids = [parseReport(x.stdout).keys.TICKET_ID, parseReport(y.stdout).keys.TICKET_ID];
    expect(ids[0]).not.toBe(ids[1]);
    for (const id of ids) expect(remoteIds(b)).toContain(id);
    expect(new Set(remoteIds(b)).size).toBe(4);
  });

  it('add allocates after the fast-forward, past a ticket another machine pushed', () => {
    const b = board('allocate-after-ff-');
    warm(b);
    const other = otherMachine(b);
    const file = path.join(other, 'docs', 'backlog.jsonl');
    fs.appendFileSync(file, row('0003B', 'pushed elsewhere') + '\n');
    gitR(['commit', '-q', '-am', 'other machine'], other);
    gitR(['push', '-q', 'origin', 'board'], other);

    const record = recordOutside(b.space, 'mine');
    const result = pub(b.main, ['add', '--record-file', record], { env: b.env });
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.TICKET_ID).toBe('0004B');
    expect(remoteIds(b)).toContain('0003B');
    expect(remoteIds(b)).toContain('0004B');
  });

  it('a project with no usable board stops before any write', () => {
    const b = board('no-board-');
    fs.writeFileSync(path.join(b.main, '.codeadd', 'board.json'), JSON.stringify({ remote: b.bare, branch: 'missing' }));
    const result = pub(b.main, ['add'], { env: b.env, input: ticket('nothing') });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('ERROR=board-branch-missing');
    expect(fs.existsSync(b.boardDir)).toBe(false);
    expect(remoteIds(b)).toEqual(['0001B']);
  });
});

// ─── A failing fetch is never a rebase or push trigger ───────────────────────

describe('L3 — a failing fetch is never a rebase or push trigger', () => {
  it('unreachable origin: fetch-failed, nothing pushed, the commit ref-protected', () => {
    const b = board('fetch-fail-');
    warm(b);
    gitR(['remote', 'set-url', 'origin', path.join(b.space, 'vanished.git')], b.boardDir);

    writeRecord(b.main, 'fetch will fail');
    const result = pub(b.main, ['add', '--record-file', 'ticket.json'], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.ROUTE).toBe('board');
    expect(r.keys.DEGRADED).toBe('fetch-failed');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.SHA).toMatch(/^[0-9a-f]{40}$/);
    // The durable ref names the reported sha, inside the clone.
    expect(gitOut(['rev-parse', Git.RECOVERY_NS + '/' + r.keys.SHA], b.boardDir)).toBe(r.keys.SHA);
    expect(r.keys.RECOVERY_REF).toBe(Git.RECOVERY_NS + '/' + r.keys.SHA);
  });
});

// ─── Rebase: the remote moves between the fetch and the push ───────────────

describe('L3 — reconciliation: the remote moves underneath the run', () => {
  /** A pre-push hook in the clone that, once, pushes `file` from another machine first. */
  const moveRemoteOnPush = (b, other, file, body) => {
    const marker = path.join(b.space, 'moved.once');
    const script = [
      '#!/bin/sh',
      `[ -e "${marker.replace(/\\/g, '/')}" ] && exit 0`,
      `touch "${marker.replace(/\\/g, '/')}"`,
      `cd "${other.replace(/\\/g, '/')}" || exit 1`,
      'git fetch -q origin board && git reset -q --hard origin/board',
      body,
      `git add ${file}`,
      'git commit -q -m "remote moved"',
      'git push -q origin HEAD:refs/heads/board',
      'exit 0',
      '',
    ].join('\n');
    const hook = path.join(b.boardDir, '.git', 'hooks', 'pre-push');
    fs.writeFileSync(hook, script);
    fs.chmodSync(hook, 0o755);
  };

  it('a conflicting remote: abort verified, commit retained, exit 0', () => {
    const b = board('conflict-');
    warm(b);
    const other = otherMachine(b);
    moveRemoteOnPush(b, other, 'docs/backlog.jsonl',
      `printf '%s\\n' '${row('0001B', 'CONFLICTLY rewritten on the remote')}' > docs/backlog.jsonl`);

    const record = recordOutside(b.space, 'conflicts on rebase');
    const result = pub(b.main, ['add', '--record-file', record], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.DEGRADED).toBe('rebase-conflict');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.SHA).toMatch(/^[0-9a-f]{40}$/);
    // Abort VERIFIED: nothing mid-rebase remains in the clone.
    expect(fs.existsSync(path.join(b.boardDir, '.git', 'REBASE_HEAD'))).toBe(false);
    expect(fs.existsSync(path.join(b.boardDir, '.git', 'rebase-merge'))).toBe(false);
    expect(gitOut(['status', '--porcelain'], b.boardDir)).toBe('');
    // The commit survives in the clone, unpushed and ref-protected.
    expect(gitOut(['rev-parse', 'HEAD'], b.boardDir)).toBe(r.keys.SHA);
    expect(gitOut(['rev-parse', Git.RECOVERY_NS + '/' + r.keys.SHA], b.boardDir)).toBe(r.keys.SHA);
  });

  it('a clean reconciliation: rebase succeeds and pushes', () => {
    const b = board('rebase-clean-');
    warm(b);
    const other = otherMachine(b);
    moveRemoteOnPush(b, other, 'docs/harmless.txt', "printf 'a harmless remote note\\n' > docs/harmless.txt");

    const record = recordOutside(b.space, 'rebase cleanly');
    const result = pub(b.main, ['add', '--record-file', record], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PUSHED=yes');
    expect(r.keys.COMMITTED).toBe('yes');
    expect(r.keys.DEGRADED).toBeUndefined();
    expect(gitOut(['rev-parse', 'HEAD'], b.boardDir)).toBe(r.keys.SHA);
    expect(gitOut(['rev-parse', 'board'], b.bare)).toBe(r.keys.SHA);
    expect(remoteIds(b)).toContain(r.keys.TICKET_ID);
  });
});

// ─── Push refusals and durable recovery refs ─────────────────────────────

describe('L3 — unpushed commits survive cleanup and gc through their ref', () => {
  it('push refused: the recovery ref is reported, the commit outlives gc', () => {
    const b = board('push-refused-');
    warm(b);
    fs.writeFileSync(path.join(b.bare, 'hooks', 'pre-receive'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });

    writeRecord(b.main, 'push refuser');
    const result = pub(b.main, ['add', '--record-file', 'ticket.json'], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.DEGRADED).toBe('push-refused');
    expect(r.keys.PUSHED).toBe('no');
    expect(r.keys.RECOVERY_REF).toBe(Git.RECOVERY_NS + '/' + r.keys.SHA);

    const refSha = gitOut(['rev-parse', r.keys.RECOVERY_REF], b.boardDir);
    expect(refSha).toBe(r.keys.SHA);
    gitR(['gc', '--prune=now'], b.boardDir);
    expect(gitOut(['cat-file', '-t', r.keys.SHA], b.boardDir)).toBe('commit');
  });

  it('the next write pushes what a refused one left behind', () => {
    const b = board('push-retry-');
    warm(b);
    const hook = path.join(b.bare, 'hooks', 'pre-receive');
    fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    const refused = parseReport(pub(b.main, ['add'], { env: b.env, input: ticket('refused') }).stdout);
    expect(refused.keys.PUSHED).toBe('no');

    fs.rmSync(hook);
    const next = parseReport(pub(b.main, ['add'], { env: b.env, input: ticket('next') }).stdout);
    expect(next.keys.PUSHED).toBe('yes');
    expect(remoteIds(b)).toContain(refused.keys.TICKET_ID);
    expect(remoteIds(b)).toContain(next.keys.TICKET_ID);
  });

  it('a pre-existing matching recovery ref protects but is NEVER owned', () => {
    const b = board('preexist-');
    warm(b);
    // A post-commit hook pre-creates the recovery ref the moment the commit
    // exists, so the invocation FINDS a matching ref it never created.
    const hook = path.join(b.boardDir, '.git', 'hooks', 'post-commit');
    fs.writeFileSync(
      hook,
      '#!/bin/sh\nSHA=$(git rev-parse HEAD)\ngit update-ref ' + Git.RECOVERY_NS + '/$SHA $SHA\n',
    );
    fs.chmodSync(hook, 0o755);

    writeRecord(b.main, 'pre-existing owner test');
    const result = pub(b.main, ['add', '--record-file', 'ticket.json'], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(0);
    expect(r.keys.PUSHED).toBe('yes');
    // A ref this run did not create survives the verified push.
    expect(gitOut(['rev-parse', Git.RECOVERY_NS + '/' + r.keys.SHA], b.boardDir)).toBe(r.keys.SHA);
  });

  it('a recovery ref whose value moved before deletion STAYS and is reported', () => {
    const b = board('ref-move-');
    warm(b);
    const clone = b.boardDir;
    identify(clone);
    const sha = gitOut(['rev-parse', 'HEAD'], clone);
    const ref = Git.RECOVERY_NS + '/testref';
    expect(gitR(['update-ref', ref, sha, '0'.repeat(40)], clone).status).toBe(0);

    fs.writeFileSync(path.join(clone, 'other.md'), 'd\n');
    gitR(['add', 'other.md'], clone);
    gitR(['commit', '-q', '-m', 'other'], clone);
    const movedSha = gitOut(['rev-parse', 'HEAD'], clone);
    gitR(['update-ref', ref, movedSha, sha], clone);

    const released = Git.releaseOwnedRef(clone, ref, sha);
    expect(released.ok).toBe(true);
    expect(released.deleted).toBe(false);
    expect(released.moved).toBe(true);
    expect(released.reason).toBe('recovery-ref-moved');
    expect(gitOut(['rev-parse', ref], clone)).toBe(movedSha);

    const ownedRelease = Git.releaseOwnedRef(clone, ref, movedSha);
    expect(ownedRelease.deleted).toBe(true);
  });
});

// ─── A failed commit keeps the data and reports where ────────────────────

describe('L3 — a failed commit keeps the data and reports where', () => {
  it('pre-commit-hook failure: exit 1, tree retained and unlocked, data readable', () => {
    const b = board('commit-fail-');
    warm(b);
    const hook = path.join(b.boardDir, '.git', 'hooks', 'pre-commit');
    fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n');
    fs.chmodSync(hook, 0o755);

    writeRecord(b.main, 'commit will fail');
    const result = pub(b.main, ['add', '--record-file', 'ticket.json'], { env: b.env });
    const r = parseReport(result.stdout);

    expect(result.status).toBe(1);
    expect(r.errors).toContain('ERROR=commit-failed');
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('no');
    expect(r.keys.RECOVERY_PATH).toBe(b.boardDir);
    // The bytes are in the clone's working tree, and the lock is released.
    expect(read(path.join(b.boardDir, 'docs', 'backlog.jsonl'))).toContain(r.keys.TICKET_ID);
    expect(fs.existsSync(path.join(b.boardDir, '.git', 'codeadd-board.lock'))).toBe(false);
  });
});

// ─── The entry contract ──────────────────────────────────────────────────

describe('L3 — the publication entry contract against the wrapper', () => {
  it('a READ mode is refused by name, before any git happens', () => {
    const b = board('read-refusal-');
    for (const mode of ['list', 'search', 'get']) {
      const result = pub(b.main, [mode], { env: b.env });
      expect(result.status).toBe(2);
      expect(result.stdout).toContain('ERROR=read-mode');
      expect(result.stderr).toContain('USAGE');
    }
    expect(fs.existsSync(b.boardDir)).toBe(false);
  });

  it('get is refused even with an invalid id or a record-file spelling, before the file is read', () => {
    const b = board('get-refusal-');
    expect(pub(b.main, ['get', '0001B'], { env: b.env }).stdout).toContain('ERROR=read-mode');
    expect(pub(b.main, ['get'], { env: b.env }).stdout).toContain('ERROR=read-mode');
    expect(pub(b.main, ['get', '--record-file', 'missing.json'], { env: b.env }).stdout).toContain('ERROR=read-mode');
    expect(fs.existsSync(path.join(b.main, 'missing.json'))).toBe(false);
    expect(gitOut(['status', '--porcelain'], b.main)).toBe('');
  });

  it('a no-op write reports COMMITTED=no with the existing HEAD as SHA', () => {
    const b = board('noop-');
    // move --top on the single ticket writes identical bytes.
    const result = pub(b.main, ['move', '0001B', '--top'], { env: b.env });
    const r = parseReport(result.stdout);
    expect(result.status).toBe(0);
    expect(r.keys.PERSISTED).toBe('yes');
    expect(r.keys.COMMITTED).toBe('no');
    expect(r.keys.SHA).toBe(gitOut(['rev-parse', 'HEAD'], b.boardDir));
  });

  it('the whole local grammar survives through the publication entry', () => {
    const b = board('grammar-parity-');
    const r1 = recordOutside(b.space, 'second one');
    expect(pub(b.main, ['add', '--record-file', r1], { env: b.env }).status).toBe(0);
    const r2 = recordOutside(b.space, 'third one', 'third.json');
    expect(pub(b.main, ['add', '--record-file', r2], { env: b.env }).status).toBe(0);

    const moved = pub(b.main, ['move', '0003B', '--top'], { env: b.env });
    expect(moved.status).toBe(0);
    const rows = remoteBoard(b).trim().split('\n');
    expect(JSON.parse(rows[0]).id).toBe('0003B');
    expect(JSON.parse(rows[1]).id).toBe('0001B');
    expect(JSON.parse(rows[2]).id).toBe('0002B');

    expect(pub(b.main, ['remove', '0002B'], { env: b.env }).status).toBe(0);
    const after = remoteBoard(b).trim().split('\n');
    expect(JSON.parse(after[0]).title).toBe('third one');
  });

  it('a domain refusal prints REFUSED= with the CLI exit code and nothing else', () => {
    const b = board('domain-refusal-');
    fs.writeFileSync(path.join(b.main, 'patch.json'), JSON.stringify({ title: 'nowhere' }));
    const result = pub(b.main, ['update', '0404B', '--record-file', 'patch.json'], { env: b.env });
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('REFUSED=unknown-id\n');
  });

  it('a record-file failure exits 1 before anything is routed', () => {
    const b = board('pub-read-fail-');
    gitR(['checkout', '-q', '-b', 'feat/x'], b.main);
    const result = pub(b.main, ['add', '--record-file', 'missing.json'], { env: b.env });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('ERROR=record-read-failed');
    expect(fs.existsSync(b.boardDir)).toBe(false);
    expect(fs.existsSync(path.join(b.main, '.worktrees'))).toBe(false);
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
