// board/server.mjs — the zero-dependency server behind the board.
// (plan docs/plans/2026-09-21T145331-PLAN--backlog-board-002-board-app.md, F2, L1.)
// RED-FIRST: written before server.mjs exists.
//
// Every test runs the REAL server against a temporary project and the REAL
// framwork/.codeadd/scripts/backlog.sh — the point of the design is that the
// server never parses the JSONL itself, and only the real script proves that.
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { createServer } from 'node:net';
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

async function start(root: string, extra: string[] = []): Promise<Running> {
  const proc = spawn(
    process.execPath,
    [join(BOARD, 'server.mjs'), '--root', root, '--scripts', SCRIPTS, '--dist', fakeDist(), '--no-open', ...extra],
    { env: { ...process.env, NODE_OPTIONS: '' } },
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

afterEach(() => {
  for (const r of running.splice(0)) r.proc.kill();
  for (const t of temps.splice(0)) rmSync(t, { recursive: true, force: true });
});

describe('L1 — /api/board', () => {
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

  it('L1.4 answers { error: "script-missing" } as JSON when the scripts directory is wrong', async () => {
    const r = await start(project([ticket('0001B', 'one')]), ['--scripts', join(tmpdir(), 'no-such-scripts-dir')]);
    const { status, body } = await board(r);
    expect(status).toBe(200);
    expect(body.error).toBe('script-missing');
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

  it('L1.6b moves to the next port when the first is taken', async () => {
    const blocker = createServer();
    await new Promise<void>((ok) => blocker.listen(0, '127.0.0.1', ok));
    const busy = (blocker.address() as { port: number }).port;
    try {
      const r = await start(project(null), ['--port', String(busy)]);
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
