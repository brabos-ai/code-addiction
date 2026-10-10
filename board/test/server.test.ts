// board/server.mjs — the zero-dependency server behind the board.
// (plan docs/plans/2026-09-21T145331-PLAN--backlog-board-002-board-app.md, F2, L1.)
// RED-FIRST: written before server.mjs exists.
//
// Every test runs the REAL server against a temporary project. Since the
// node-only-board delivery the server imports the canonical core directly
// and reads no script at all; the native-backlog suite (native-backlog.test.ts)
// proves in the same depth that a shipped CLI mutation surfaces through the
// SSE stream and the API. The --scripts flag is accepted and ignored.
//
// The board is read from a CLONE, never from the project's docs/: project()
// makes the temp directory both the code repository and the clone
// (git init, and start() points CODEADD_BOARD_DIR at it). The tests of the
// board branch itself — a separate remote, /api/changes, the timer — use
// boardFixture() below.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { get } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const BOARD = resolve(__dirname, '..');
const SCRIPTS = resolve(BOARD, '../framwork/.codeadd/scripts');

type Running = { url: string; proc: ChildProcess; out: string };
const running: Running[] = [];
const temps: string[] = [];

function ticket(id: string, title: string, status = 'open') {
  return JSON.stringify({
    id, title, theme: 'general', labels: [], tldr: title, notes: [], done_when: 'it works', paths: [],
    grounded: false, status, created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z',
    comments: [], work_id: null,
  });
}

function project(lines: string[] | null, defs?: object): string {
  const root = mkdtempSync(join(tmpdir(), 'board-test-'));
  temps.push(root);
  mkdirSync(join(root, 'docs'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  if (lines) writeFileSync(join(root, 'docs/backlog.jsonl'), lines.map((l) => `${l}\n`).join(''));
  if (defs) writeFileSync(join(root, 'docs/backlog.definitions.json'), JSON.stringify(defs));
  return root;
}

function fakeDist(): string {
  const dir = mkdtempSync(join(tmpdir(), 'board-dist-'));
  temps.push(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>board-fixture</title>');
  return dir;
}

async function start(root: string, extra: string[] = [], env: Record<string, string> = { CODEADD_BOARD_DIR: root }): Promise<Running> {
  const proc = spawn(
    process.execPath,
    [join(BOARD, 'server.mjs'), '--root', root, '--scripts', SCRIPTS, '--dist', fakeDist(), '--no-open', ...extra],
    { env: { ...process.env, NODE_OPTIONS: '', ...env } },
  );
  const r: Running = { url: '', proc, out: '' };
  running.push(r);
  await new Promise<void>((ok, fail) => {
    const timer = setTimeout(() => fail(new Error(`server did not start:\n${r.out}`)), 15000);
    const onData = (d: Buffer) => {
      r.out += d.toString();
      const m = r.out.match(/BOARD_URL=(\S+)/);
      if (m) { r.url = m[1]!; clearTimeout(timer); ok(); }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', (d: Buffer) => { r.out += d.toString(); });
    proc.on('exit', (code) => { clearTimeout(timer); if (!r.url) fail(new Error(`server exited ${code}:\n${r.out}`)); });
  });
  return r;
}

async function board(r: Running) {
  const res = await fetch(`${r.url}/api/board`);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

// Wait for each server to EXIT before removing its project. On Windows a
// process still in docs/ — the server's own watcher — holds the directory,
// and an rmSync right after kill() fails with EPERM,
// intermittently, on whichever test ran last. Removal retries, and a directory
// still held after that is left in the OS temp dir: a failed cleanup says
// nothing about the server, so it must not fail the test.
afterEach(async () => {
  await Promise.all(running.splice(0).map((r) => new Promise<void>((ok) => {
    if (r.proc.exitCode !== null || r.proc.signalCode !== null) return ok();
    r.proc.once('exit', () => ok());
    r.proc.kill();
  })));
  for (const t of temps.splice(0)) {
    try { rmSync(t, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch { /* see above */ }
  }
});

describe('L1 — /api/board', () => {
  it.each([false, true])('layer opt-in %s preserves the board and advertises only when enabled', async (layers) => {
    const original = { ...JSON.parse(ticket('0001B', 'layered')), labels: ['product', 'internal', 'both', 'quality'] };
    const defs = {
      statuses: [{ name: 'open', order: 1, means: 'ready', column: 'backlog' }],
      columns: [{ name: 'backlog', order: 1 }],
    };
    const r = await start(project([JSON.stringify(original)], defs), layers ? ['--layers'] : []);
    const { status, body } = await board(r);
    expect(status).toBe(200);
    expect(body.tickets).toEqual([original]);
    expect(body.statuses).toEqual(defs.statuses);
    expect(body.columns).toEqual(defs.columns);
    if (layers) expect(body.layerFilter).toEqual({ name: 'Layer', values: ['product', 'internal', 'both'] });
    else expect(body).not.toHaveProperty('layerFilter');
    expect(new URL(r.url).hostname).toBe('127.0.0.1');
    const denied = await new Promise<number | undefined>((ok, fail) => {
      get(`${r.url}/api/board`, { headers: { host: 'untrusted.example' } }, (res) => {
        res.resume();
        ok(res.statusCode);
      }).on('error', fail);
    });
    expect(denied).toBe(403);
  });

  it('layer opt-in preserves error responses', async () => {
    const root = project(null);
    mkdirSync(join(root, 'docs', 'backlog.jsonl'), { recursive: true });
    const r = await start(root, ['--layers']);
    const { body } = await board(r);
    expect(body.error).toBe('backlog-read-failed');
    expect(body).not.toHaveProperty('layerFilter');
  });

  it('L1.1 returns the tickets in line order with present: true', async () => {
    const r = await start(project([ticket('0003B', 'third first'), ticket('0001B', 'one'), ticket('0002B', 'two')]));
    const { status, body } = await board(r);
    expect(status).toBe(200);
    expect(body.present).toBe(true);
    expect((body.tickets as { id: string }[]).map((t) => t.id)).toEqual(['0003B', '0001B', '0002B']);
    expect(typeof body.readAt).toBe('string');
  });

  it('L1.2 reports a damaged line by number and still returns the others', async () => {
    const r = await start(project([ticket('0001B', 'one'), '{not json', ticket('0002B', 'two')]));
    const { body } = await board(r);
    expect(body.damagedLines).toEqual([2]);
    expect((body.tickets as unknown[]).length).toBe(2);
  });

  it('L1.3 takes statuses from the definitions file, sorted by order', async () => {
    const defs = { statuses: [{ name: 'later', order: 2, means: 'b' }, { name: 'now', order: 1, means: 'a' }] };
    const r = await start(project([ticket('0001B', 'one', 'now')], defs));
    const { body } = await board(r);
    expect((body.statuses as { name: string }[]).map((s) => s.name)).toEqual(['now', 'later']);
  });

  it('L1.3b derives statuses in first-seen order when the definitions file is absent', async () => {
    const r = await start(project([ticket('0001B', 'a', 'doing'), ticket('0002B', 'b', 'open'), ticket('0003B', 'c', 'doing')]));
    const { body } = await board(r);
    expect((body.statuses as { name: string }[]).map((s) => s.name)).toEqual(['doing', 'open']);
  });

  it('L1.3c answers present: false when neither file exists', async () => {
    const r = await start(project(null));
    const { status, body } = await board(r);
    expect(status).toBe(200);
    expect(body.present).toBe(false);
    expect(body.tickets).toEqual([]);
  });

  it('L1.3d reports a status the definitions no longer define', async () => {
    const defs = { statuses: [{ name: 'open', order: 1, means: 'a' }] };
    const r = await start(project([ticket('0001B', 'one', 'ghost')], defs));
    const { body } = await board(r);
    expect(body.undefinedStatuses).toEqual(['ghost']);
  });

  it('L1.4 ignores a missing legacy scripts directory', async () => {
    const r = await start(project([ticket('0001B', 'one')]), ['--scripts', join(tmpdir(), 'no-such-scripts-dir')]);
    const { status, body } = await board(r);
    expect(status).toBe(200);
    expect(body.error).toBeUndefined();
    expect((body.tickets as unknown[]).length).toBe(1);
  });
});

// Plan 2026-09-23T193550-PLAN--board-pipeline-phase-statuses, F37 / L13. RED-FIRST.
describe('L13 — columns in /api/board', () => {
  const nine = {
    columns: [
      { name: 'backlog', order: 1, label: 'Backlog' },
      { name: 'dropped', order: 3, label: 'Dropped', hidden: true },
      { name: 'building', order: 2, label: 'Building' },
    ],
    statuses: [
      { name: 'open', order: 1, column: 'backlog', label: 'Open', means: 'a' },
      { name: 'doing', order: 2, column: 'building', label: 'Doing', means: 'b' },
      { name: 'dropped', order: 3, column: 'dropped', label: 'Dropped', means: 'c' },
    ],
  };
  type S = { name: string; column?: string; label?: string };
  type C = { name: string; order: number; label?: string; hidden?: boolean };

  it('L13.1a a status keeps its column', async () => {
    const { body } = await board(await start(project([ticket('0001B', 'one')], nine)));
    expect((body.statuses as S[]).find((s) => s.name === 'doing')!.column).toBe('building');
  });
  it('L13.1b a status keeps its label', async () => {
    const { body } = await board(await start(project([ticket('0001B', 'one')], nine)));
    expect((body.statuses as S[]).find((s) => s.name === 'doing')!.label).toBe('Doing');
  });
  it('L13.1c a column keeps its label', async () => {
    const { body } = await board(await start(project([ticket('0001B', 'one')], nine)));
    expect((body.columns as C[]).find((c) => c.name === 'building')!.label).toBe('Building');
  });
  it('L13.1d a column keeps hidden', async () => {
    const { body } = await board(await start(project([ticket('0001B', 'one')], nine)));
    expect((body.columns as C[]).find((c) => c.name === 'dropped')!.hidden).toBe(true);
  });

  it('L13.2 columns present in the file are used as written, sorted by order', async () => {
    const { body } = await board(await start(project([ticket('0001B', 'one')], nine)));
    expect((body.columns as C[]).map((c) => c.name)).toEqual(['backlog', 'building', 'dropped']);
  });

  it('L13.3 columns absent derive one per distinct status column, in status order', async () => {
    const defs = {
      statuses: [
        { name: 'shaped', order: 3, column: 'shaping', means: '' },
        { name: 'open', order: 1, column: 'backlog', means: '' },
        { name: 'refining', order: 2, column: 'shaping', means: '' },
      ],
    };
    const { body } = await board(await start(project([ticket('0001B', 'one')], defs)));
    expect((body.columns as C[]).map((c) => c.name)).toEqual(['backlog', 'shaping']);
  });

  it('L13.4 with no definitions file each status in use is its own column', async () => {
    const { body } = await board(await start(project([ticket('0001B', 'a', 'doing'), ticket('0002B', 'b', 'open')])));
    expect((body.statuses as S[]).map((s) => s.name)).toEqual(['doing', 'open']);
    expect((body.columns as C[]).map((c) => c.name)).toEqual(['doing', 'open']);
  });
});

describe('L1 — routing', () => {
  it('L1.5 answers 404 JSON for a reserved /api namespace', async () => {
    const r = await start(project(null));
    const res = await fetch(`${r.url}/api/runs`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('L1.5b serves index.html for an app route (SPA fallback)', async () => {
    const r = await start(project(null));
    const res = await fetch(`${r.url}/board/0001B`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('board-fixture');
  });

  it('L1.5c refuses a path that climbs out of dist/', async () => {
    const r = await start(project(null));
    const res = await fetch(`${r.url}/..%2f..%2fpackage.json`);
    expect(await res.text()).not.toContain('"dependencies"');
  });
});

describe('L1 — network', () => {
  it('L1.6 listens on 127.0.0.1 only', async () => {
    const r = await start(project(null));
    expect(new URL(r.url).hostname).toBe('127.0.0.1');
  });

  it.each([false, true])('L1.6b moves to the next port when the first is taken (layers: %s)', async (layers) => {
    const blocker = createServer();
    await new Promise<void>((ok) => blocker.listen(0, '127.0.0.1', ok));
    const busy = (blocker.address() as { port: number }).port;
    try {
      const r = await start(project(null), ['--port', String(busy), ...(layers ? ['--layers'] : [])]);
      expect(Number(new URL(r.url).port)).toBeGreaterThan(busy);
      expect(Number(new URL(r.url).port)).toBeLessThanOrEqual(busy + 10);
    } finally {
      blocker.close();
    }
  });
});

describe('L1 — live updates', () => {
  it('L1.7 emits board-changed on /api/events when the board file changes', async () => {
    const root = project([ticket('0001B', 'one')]);
    const r = await start(root);
    const ctrl = new AbortController();
    const res = await fetch(`${r.url}/api/events`, { signal: ctrl.signal });
    expect(res.headers.get('content-type')).toMatch(/text\/event-stream/);
    const reader = res.body!.getReader();
    const got = (async () => {
      let text = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return text;
        text += new TextDecoder().decode(value);
        if (text.includes('board-changed')) return text;
      }
    })();
    await new Promise((ok) => setTimeout(ok, 300));
    appendFileSync(join(root, 'docs/backlog.jsonl'), `${ticket('0002B', 'two')}\n`);
    const text = await Promise.race([got, new Promise<string>((ok) => setTimeout(() => ok('TIMEOUT'), 5000))]);
    ctrl.abort();
    expect(text).toContain('event: board-changed');
  });
});

// ─── L3 — the board branch: the clone, /api/changes, the timer ──────────────────

const GIT_ENV = {
  GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@test.com',
};
const g = (cwd: string, args: string[]) =>
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', env: { ...process.env, ...GIT_ENV } }).trim();

type Fixture = { base: string; bare: string; repo: string; clone: string; env: Record<string, string> };

/** A bare remote holding the `board` branch, a code repo whose config points at it, and the clone path. */
function boardFixture(lines: string[], extraEnv: Record<string, string> = {}): Fixture {
  const base = mkdtempSync(join(tmpdir(), 'board-fx-'));
  temps.push(base);
  const bare = join(base, 'remote.git');
  g(base, ['init', '--bare', '-q', '--initial-branch=main', bare]);
  const seed = join(base, 'seed');
  mkdirSync(join(seed, 'docs'), { recursive: true });
  g(seed, ['init', '-q', '--initial-branch=board']);
  writeFileSync(join(seed, 'docs/backlog.jsonl'), lines.map((l) => `${l}\n`).join(''));
  g(seed, ['add', '.']);
  g(seed, ['commit', '-q', '-m', 'seed board']);
  g(seed, ['push', '-q', bare, 'board']);
  const repo = join(base, 'code');
  mkdirSync(join(repo, '.codeadd'), { recursive: true });
  g(repo, ['init', '-q', '--initial-branch=main']);
  writeFileSync(join(repo, '.codeadd/board.json'), JSON.stringify({ remote: bare, branch: 'board' }));
  g(repo, ['add', '-f', '.codeadd/board.json']);
  g(repo, ['commit', '-q', '-m', 'init']);
  const clone = join(base, 'clone');
  // TTL 0: every /api/board call syncs, so a test sees another machine's push at once.
  return { base, bare, repo, clone, env: { CODEADD_BOARD_DIR: clone, HOME: base, USERPROFILE: base, CODEADD_BOARD_SYNC_TTL_MS: '0', ...extraEnv } };
}

/** Another machine pushes one more line to the board branch. */
function pushLine(fx: Fixture, line: string, name = 'other') {
  const dir = join(fx.base, name);
  if (!existsSync(dir)) g(fx.base, ['clone', '-q', '--branch', 'board', fx.bare, dir]);
  appendFileSync(join(dir, 'docs/backlog.jsonl'), `${line}\n`);
  g(dir, ['commit', '-q', '-am', 'other machine']);
  g(dir, ['push', '-q', 'origin', 'board']);
  return g(dir, ['rev-parse', 'HEAD']);
}

const changes = async (r: Running, since?: string) => {
  const res = await fetch(`${r.url}/api/changes${since === undefined ? '' : `?since=${since}`}`);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

describe('L3 — the server reads the board clone', () => {
  it('L3.1 /api/board reads the clone, not <root>/docs/', async () => {
    const fx = boardFixture([ticket('0002B', 'on the board branch')]);
    // The code checkout carries a stale copy of the board: it must never be read.
    mkdirSync(join(fx.repo, 'docs'));
    writeFileSync(join(fx.repo, 'docs/backlog.jsonl'), `${ticket('0001B', 'stale in the checkout')}\n`);
    const r = await start(fx.repo, [], fx.env);
    const { body } = await board(r);
    expect((body.tickets as { id: string }[]).map((t) => t.id)).toEqual(['0002B']);
  });

  it('L3.1b a read syncs the clone first: another machine\'s push shows on the next call', async () => {
    const fx = boardFixture([ticket('0001B', 'one')]);
    const r = await start(fx.repo, [], fx.env);
    expect(((await board(r)).body.tickets as unknown[]).length).toBe(1);
    pushLine(fx, ticket('0002B', 'two'));
    expect(((await board(r)).body.tickets as unknown[]).length).toBe(2);
  });

  it('L3.2 /api/changes?since=<sha> answers the ids added, updated and removed, with HEAD as the next cursor', async () => {
    const fx = boardFixture([ticket('0001B', 'one')]);
    const r = await start(fx.repo, [], fx.env);

    const first = await changes(r);
    expect(first.status).toBe(200);
    expect(first.body.added).toEqual(['0001B']);
    expect(first.body.updated).toEqual([]);
    expect(first.body.removed).toEqual([]);
    expect(first.body.unpushed).toBe(0);
    const cursor = first.body.head as string;
    expect(cursor).toMatch(/^[0-9a-f]{40}$/);

    const tip = pushLine(fx, ticket('0002B', 'two'));
    const next = await changes(r, cursor);
    expect(next.body.added).toEqual(['0002B']);
    expect(next.body.head).toBe(tip);

    const foreign = await changes(r, 'f'.repeat(40));
    expect(foreign.status).toBe(400);
    expect(foreign.body.error).toBe('cursor-unknown');
  });

  it('L3.3 a board that is not ready is a JSON error naming the state, on both routes', async () => {
    const none = project(null);
    const bare = await start(none, [], { CODEADD_BOARD_DIR: '', HOME: none, USERPROFILE: none });
    for (const path of ['/api/board', '/api/changes']) {
      const res = await fetch(`${bare.url}${path}`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('board-none');
      expect(body.state).toBe('none');
    }

    const old = project([ticket('0001B', 'still in the checkout')]);
    const migrating = await start(old, [], { CODEADD_BOARD_DIR: '', HOME: old, USERPROFILE: old });
    const { body } = await board(migrating);
    expect(body.error).toBe('board-migration-required');
    expect(body.state).toBe('migration-required');
  });

  it('L3.3b the timer syncs the clone, and skips the tick while a writer holds the lock', async () => {
    const fx = boardFixture([ticket('0001B', 'one')], { CODEADD_BOARD_TIMER_MS: '200', CODEADD_BOARD_SYNC_TTL_MS: '30000' });
    const r = await start(fx.repo, [], fx.env);
    await board(r); // the clone exists and has been synced once
    const file = join(fx.clone, 'docs/backlog.jsonl');
    const lock = join(fx.clone, '.git/codeadd-board.lock');

    // A live holder (this process) owns the lock: the tick skips and the clone stays behind.
    writeFileSync(lock, JSON.stringify({ pid: process.pid, ts: Date.now() }));
    pushLine(fx, ticket('0002B', 'two'));
    await new Promise((ok) => setTimeout(ok, 1200));
    expect(readFileSync(file, 'utf8')).not.toContain('0002B');
    expect(existsSync(lock)).toBe(true);

    // Released, the next tick brings the clone level.
    rmSync(lock);
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !readFileSync(file, 'utf8').includes('0002B')) {
      await new Promise((ok) => setTimeout(ok, 200));
    }
    expect(readFileSync(file, 'utf8')).toContain('0002B');
  });

  it('L3.3c the server is GET only: a POST to any route is 405, and a foreign Host is 403', async () => {
    const fx = boardFixture([ticket('0001B', 'one')]);
    const r = await start(fx.repo, [], fx.env);
    for (const path of ['/api/board', '/api/changes', '/api/events']) {
      const res = await fetch(`${r.url}${path}`, { method: 'POST', body: '{}' });
      expect(res.status).toBe(405);
    }
    const denied = await new Promise<number | undefined>((ok, fail) => {
      get(`${r.url}/api/changes`, { headers: { host: 'untrusted.example' } }, (res) => { res.resume(); ok(res.statusCode); }).on('error', fail);
    });
    expect(denied).toBe(403);
  });
});
