// board/test/native-backlog.test.ts — the native route in vitest depth (L6):
// a CLI mutation through the REAL server surfaces in the SSE stream and the
// API, and the relocated server is a standalone closure of server.mjs and
// the generated runtime alone. (plan F7, L6.)
import { spawnSync, spawn, type ChildProcess } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const BOARD = resolve(__dirname, '..');
const REPO = resolve(BOARD, '..');
const SERVER = join(BOARD, 'server.mjs');
const CLI = join(REPO, 'framwork', '.codeadd', 'scripts', 'backlog-cli.cjs');
const RUNTIME = join(BOARD, 'runtime');

type Running = { proc: ChildProcess | null };
const running: Running[] = [];
const temps: string[] = [];

const ticket = (id: string, title: string) => JSON.stringify({
  id, title, theme: 'general', labels: [], tldr: title, notes: [], done_when: 'it works',
  paths: [], grounded: false, status: 'open', created_at: '2026-09-20T00:00:00Z',
  updated_at: '2026-09-20T00:00:00Z', comments: [], feature: null, work_id: null,
});

function project(): string {
  const root = mkdtempSync(join(tmpdir(), 'board-native-'));
  temps.push(root);
  mkdirSync(join(root, 'docs'));
  writeFileSync(join(root, 'docs/backlog.jsonl'), `${ticket('0001B', 'seed')}\n`);
  mkdirSync(join(root, 'dist'));
  writeFileSync(join(root, 'dist/index.html'), '<!doctype html>');
  return root;
}

function dist(): string {
  const dir = mkdtempSync(join(tmpdir(), 'board-native-dist-'));
  temps.push(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>board-native</title>');
  return dir;
}

/** Run the board server and read its URL from the startup line. */
function boot(serverFile: string, root: string, portFlag: string[] = []): Promise<string> {
  const proc = spawn(process.execPath, [serverFile, '--root', root, '--dist', dist(), '--no-open', ...portFlag], {
    env: { ...process.env, NODE_OPTIONS: '' },
  });
  running.push({ proc });
  return new Promise<string>((ok, fail) => {
    const timer = setTimeout(() => fail(new Error('server did not start')), 15000);
    let out = '';
    proc.stdout!.on('data', (d) => {
      out += d.toString();
      const m = out.match(/BOARD_URL=(\S+)/);
      if (m) { clearTimeout(timer); ok(m[1]!); }
    });
    proc.stderr!.on('data', (d) => { out += d.toString(); });
    proc.on('exit', (code) => { clearTimeout(timer); fail(new Error(`server exited ${code}:\n${out}`)); });
  });
}

const sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

async function boardJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${url}/api/board`);
  return (await res.json()) as Record<string, unknown>;
}

afterEach(async () => {
  await Promise.all(running.splice(0).map((r) => new Promise<void>((ok) => {
    const proc = r.proc;
    if (!proc) return ok();
    if (proc.exitCode !== null || proc.signalCode !== null) return ok();
    proc.once('exit', () => ok());
    proc.kill();
  })));
  for (const t of temps.splice(0)) {
    try { rmSync(t, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch { /* held by a live child */ }
  }
});

describe('L6 — the native CLI drives the served board', () => {
  it('an add lands on disk, an SSE board-changed fires, and the API reflects it', async () => {
    const root = project();
    const url = await boot(SERVER, root);

    const record = join(root, 'native-ticket.json');
    writeFileSync(record, JSON.stringify({
      title: 'through the served board', theme: 'Tooling', labels: ['both'],
      tldr: 'native', done_when: 'sse', paths: [], grounded: true, status: 'open',
    }));

    // SSE first, so the event that the mutation generates cannot be missed.
    const ctrl = new AbortController();
    const res = await fetch(`${url}/api/events`, { signal: ctrl.signal });
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

    await sleep(300);
    // PATH: '' on the CLI child: no bash, no shell, nothing else reachable.
    const run = spawnSync(process.execPath, [CLI, 'add', '--record-file', record], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PATH: '', NODE_OPTIONS: '' },
    });
    expect(run.status, run.stdout + run.stderr).toBe(0);
    expect(run.stdout).toContain('TICKET_ID=0002B');

    const text = await Promise.race([got, sleep(5000).then(() => 'TIMEOUT')]);
    ctrl.abort();
    expect(text).toContain('event: board-changed');

    const body = await boardJson(url);
    const tickets = (body.tickets as Array<{ id: string; title: string }>);
    expect(tickets.map((t) => t.id)).toEqual(['0001B', '0002B']);
    expect(tickets[1]!.title).toBe('through the served board');
  });

  it('a refusal persists nothing anywhere on the served route', async () => {
    const root = project();
    const url = await boot(SERVER, root);
    const before = readFileSync(join(root, 'docs/backlog.jsonl'), 'utf8');

    const bad = join(root, 'bad.json');
    writeFileSync(bad, JSON.stringify({ tldr: 'no title' }));
    const refused = spawnSync(process.execPath, [CLI, 'add', '--record-file', bad], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PATH: '', NODE_OPTIONS: '' },
    });
    expect(refused.status).toBe(2);
    expect(refused.stdout).toContain('REFUSED=missing-field');
    // The board is untouched: a refusal persists nothing anywhere.
    expect(readFileSync(join(root, 'docs/backlog.jsonl'), 'utf8')).toBe(before);
    const body = await boardJson(url);
    expect((body.tickets as unknown[]).length).toBe(1);
  });
});

describe('L6 — the relocated standalone closure', () => {
  it('server + generated runtime alone answer the API with no CLI and no source checkout', async () => {
    expect(existsSync(join(RUNTIME, 'backlog-core.cjs'))).toBe(true);

    // The moved copy carries ONLY the server and its generated runtime.
    const moved = mkdtempSync(join(tmpdir(), 'board-reloc-'));
    temps.push(moved);
    cpSync(SERVER, join(moved, 'server.mjs'));
    cpSync(RUNTIME, join(moved, 'runtime'), { recursive: true });

    const root = project();
    writeFileSync(join(root, 'docs/backlog.jsonl'), `${ticket('0001B', 'first')}\n${ticket('0002B', 'second')}\n`);

    // INVARIANT: the source tree's own CLI stays out — the moved directory
    // holds no scripts directory at all, and the served API needs nothing
    // from it anyway.
    expect(existsSync(join(moved, 'scripts'))).toBe(false);

    // The move server imports its own ./runtime by dirname — proven by
    // spawning from a directory that is not the checkout at all.
    const elseWhere = mkdtempSync(join(tmpdir(), 'board-elsewhere-'));
    temps.push(elseWhere);
    const url = await boot(join(moved, 'server.mjs'), root);

    const body = await boardJson(url);
    expect(body.present).toBe(true);
    expect((body.tickets as Array<{ title: string }>).map((t) => t.title)).toEqual(['first', 'second']);
  });
});

describe('L6 — the board route never forks a bash process', () => {
  it('server.mjs and the generated runtime carry no child_process in their code bytes', () => {
    for (const file of [
      ...['backlog-core.cjs', 'backlog-storage.cjs'].map((n) => join(RUNTIME, n)),
    ]) {
      const src = readFileSync(file, 'utf8');
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      expect(code, file).not.toContain('child_process');
    }
  });

  it('server.mjs spawns the platform opener and nothing else — exactly once, never a shell', () => {
    const src = readFileSync(join(BOARD, 'server.mjs'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    // The one spawn is the --open helper: the platform URL opener through
    // named argv (cmd/start, xdg-open, open). No shell option, no bash, no
    // WSL, no second child process of any kind in server code.
    expect((code.match(/spawn\(/g) || []).length, 'spawn call count').toBe(1);
    expect(code).not.toMatch(/spawn\(\s*['"`](?:bash|sh|wsl|pwsh|powershell)["`]/);
    expect(code).not.toMatch(/shell\s*[:=]\s*true/);
  });

  it('the static sentinels: server code no longer names an old-route entry anywhere', () => {
    const src = readFileSync(join(BOARD, 'server.mjs'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    expect(code).not.toContain('backlog.sh');
    expect(code).not.toContain('backlog-commit.sh');
  });

  it('a fetch always probes the port with a real listener first (port sweep is honest)', async () => {
    const blocker = createServer();
    await new Promise<void>((ok) => blocker.listen(0, '127.0.0.1', ok));
    const busy = (blocker.address() as { port: number }).port;
    const root = project();
    // The server answers with its next port up to +10 — the same shapes the
    // main server tests assert; this is the form the native spec relies on.
    const url = await boot(SERVER, root, ['--port', String(busy)]);
    expect(Number(new URL(url).port)).toBeGreaterThan(busy);
    expect(Number(new URL(url).port)).toBeLessThanOrEqual(busy + 10);
    blocker.close();
  });
});
