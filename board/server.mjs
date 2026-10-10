#!/usr/bin/env node
// ============================================
// BOARD SERVER
// Serves the board app and a read-only JSON view of the project board.
// ============================================
// Usage: node server.mjs [--root <dir>] [--scripts <dir>] [--port <n>] [--no-open] [--layers]
//
//   --root     the CODE project whose board to show. The board itself is read from
//              its clone (one per project, on the `board` branch), never from this
//              project's docs/. Default: the cwd.
//   --scripts  legacy argument, ignored. The board no longer needs shell scripts.
//   --port     first port to try. Default 4317; a busy port moves to the next,
//              up to +10. All eleven busy -> one line and exit 1.
//   --no-open  do not open a browser.
//   --layers   enable the fixed product/internal/both layer filter. Off by default.
//   --dist     the built app. Default: ./dist next to this file. Tests use it.
//
// Output: `BOARD_URL=<url>` on stdout once listening — the one line a caller
//         or a test waits for.
//
// ZERO DEPENDENCIES, NODE >= 18. This file ships to a user's .codeadd/board/,
// where no node_modules sits on the resolution path — the same reason mcp/
// takes none.
//
// THE SERVER IMPORTS THE GENERATED RUNTIME MODULES under runtime/ and nothing
// else but Node built-ins: backlog-board.cjs resolves, locks and syncs the
// clone (and answers `changes`); backlog-core.cjs reads it and owns the
// damaged-line and undefined-status rules; backlog-storage.cjs and
// backlog-git.cjs sit under them. The board maps the core's results through
// its existing allowlist/sort presentation adapter.
//
// THE BOARD IS A CLONE, KEPT FRESH. /api/board runs the same throttled read sync
// the CLI runs (at most once per 30 s), which is what a window-focus refetch
// triggers; a 60 s timer syncs under the clone's lock WITHOUT waiting and skips
// the tick when a writer holds it. The server never writes the board: GET only.
//
// ROUTES: GET /api/board, GET /api/changes?since=<sha> (the ticket ids added,
// updated and removed since a sha, with HEAD = the remote tip as the next
// cursor), GET /api/events (server-sent `board-changed`). A board that is not
// `ready` (no config, migration needed, branch or clone missing) is answered as a
// JSON error naming the state.
//
// 127.0.0.1 ONLY, AND THE HOST HEADER IS CHECKED. Nothing here writes today,
// but the /api namespace is where writes and agent runs will land, and a page
// on another origin must never reach them — not over the network, not by DNS
// rebinding.
//
// RESERVED, NOT IMPLEMENTED: /api/runs, /api/runs/:id, /api/tickets/:id/refine.
// Every /api path this file does not answer is a 404 JSON.
// ============================================

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, statSync, watch, createReadStream } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const PORT_SPAN = 10;

// --- Arguments ------------------------------------------------------------

function parseArgs(argv) {
  const opts = { root: process.cwd(), scripts: null, port: 4317, open: true, layers: false, dist: join(HERE, 'dist') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--root') opts.root = next();
    else if (a === '--scripts') next(); // legacy, ignored
    else if (a === '--port') opts.port = Number(next());
    else if (a === '--dist') opts.dist = next();
    else if (a === '--no-open') opts.open = false;
    else if (a === '--layers') opts.layers = true;
    else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }
  opts.root = resolve(opts.root);
  opts.dist = resolve(opts.dist);
  if (!Number.isInteger(opts.port) || opts.port < 1 || opts.port > 65535) {
    console.error('--port must be an integer between 1 and 65535');
    process.exit(2);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const BOARD_FILE = 'backlog.jsonl';
const DEFS_FILE = 'backlog.definitions.json';
const TIMER_MS = Number(process.env.CODEADD_BOARD_TIMER_MS) > 0 ? Number(process.env.CODEADD_BOARD_TIMER_MS) : 60000;

// --- Reading the board ----------------------------------------------------

// Import the generated runtime modules directly — no subprocess, no stdout parser.
const require = createRequire(import.meta.url);
const { executeBacklog } = require(join(HERE, 'runtime', 'backlog-core.cjs'));
const board = require(join(HERE, 'runtime', 'backlog-board.cjs'));

/**
 * The board for this request: resolved from the code project, synced (throttled)
 * when ready. A state other than `ready` comes back as the JSON error to send.
 */
function resolveBoard({ sync = true } = {}) {
  let res;
  try {
    res = board.resolve(opts.root);
  } catch (e) {
    return { error: { error: 'board-unavailable', state: 'unavailable', detail: String(e).slice(0, 2000) } };
  }
  if (res.state !== 'ready') {
    return { error: { error: `board-${res.state}`, state: res.state, detail: `The board is not ready: ${res.state}.` } };
  }
  const synced = sync ? board.sync(res) : { sync: 'fresh' };
  return { res, synced };
}

/**
 * Run list --all through the generated core and return the board payload.
 * The core owns damaged-line and undefined-status rules.
 */
async function boardPayload() {
  const got = resolveBoard();
  if (got.error) return got.error;
  let result;
  try {
    result = executeBacklog({ root: got.res.boardDir, mode: 'list', filter: '*' });
  } catch (e) {
    return { error: 'backlog-read-failed', detail: String(e).slice(0, 2000) };
  }

  if (!result.ok) {
    return { error: 'backlog-read-failed', detail: result.refusal };
  }

  // Map usable definitions from the core result
  const defsStatus = result.defsStatus;
  const boardPresent = result.present || defsStatus === 'usable';

  // Use definitions from the core result for presentation
  let statuses = null;
  let columns = null;
  if (result.defs) {
    const defs = result.defs;
    statuses = Array.isArray(defs.statuses)
      ? defs.statuses
          .filter((s) => s && typeof s.name === 'string')
          .map((s, i) => ({
            name: s.name,
            order: Number.isFinite(s.order) ? s.order : i + 1,
            means: typeof s.means === 'string' ? s.means : '',
            ...(typeof s.column === 'string' ? { column: s.column } : {}),
            ...(typeof s.label === 'string' ? { label: s.label } : {}),
          }))
          .sort((a, b) => a.order - b.order)
      : null;
    columns = Array.isArray(defs.columns)
      ? defs.columns
          .filter((c) => c && typeof c.name === 'string')
          .map((c, i) => ({
            name: c.name,
            order: Number.isFinite(c.order) ? c.order : i + 1,
            ...(typeof c.label === 'string' ? { label: c.label } : {}),
            ...(c.hidden === true ? { hidden: true } : {}),
          }))
          .sort((a, b) => a.order - b.order)
      : null;
  }

  // Derive statuses from tickets when definitions are not usable
  if (!statuses) {
    const seen = [];
    for (const row of result.rows) {
      try {
        const t = JSON.parse(row);
        if (typeof t.status === 'string' && !seen.includes(t.status)) seen.push(t.status);
      } catch { /* damaged row — the core already reported it */ }
    }
    statuses = seen.map((name, i) => ({ name, order: i + 1, means: '' }));
  }

  // Derive columns from statuses when definitions are not usable
  if (!columns) {
    const names = [];
    for (const s of statuses) {
      const name = s.column ?? s.name;
      if (!names.includes(name)) names.push(name);
    }
    columns = names.map((name, i) => ({ name, order: i + 1 }));
  }

  return {
    present: boardPresent,
    tickets: result.rows.map((row) => {
      try { return JSON.parse(row); } catch { return null; }
    }).filter(Boolean),
    ...(opts.layers ? { layerFilter: { name: 'Layer', values: ['product', 'internal', 'both'] } } : {}),
    statuses,
    columns,
    damagedLines: result.damaged,
    undefinedStatuses: result.defs ? result.undefinedStatuses : [],
    readAt: new Date().toISOString(),
  };
}

// --- Live updates ---------------------------------------------------------

const clients = new Set();

function broadcast(event) {
  for (const res of clients) {
    try { res.write(`event: ${event}\ndata: {}\n\n`); } catch { clients.delete(res); }
  }
}

let debounce = null;
function changed() {
  clearTimeout(debounce);
  debounce = setTimeout(() => broadcast('board-changed'), 150);
}

// The watcher follows the clone's docs/, wherever the resolver put it. The clone
// may not exist yet (first use, migration pending), so the 60 s timer below
// retries until it does.
let docsWatcher = null;
let watchedDir = null;
function watchDocs() {
  let res;
  try { res = board.resolve(opts.root); } catch { return; }
  if (res.state !== 'ready') return;
  const dir = join(res.boardDir, 'docs');
  if (docsWatcher && watchedDir === dir) return;
  if (docsWatcher) { try { docsWatcher.close(); } catch { /* already closed */ } docsWatcher = null; }
  if (!existsSync(dir)) return;
  try {
    docsWatcher = watch(dir, (_type, name) => {
      if (!name || name === BOARD_FILE || name === DEFS_FILE) changed();
    });
    watchedDir = dir;
    docsWatcher.on('error', () => { docsWatcher = null; });
  } catch {
    docsWatcher = null;
  }
}
watchDocs();

// The timer: bring the clone level with the remote every minute. It takes the
// clone's lock WITHOUT waiting, so a writer is never delayed by it, and skips the
// tick when the lock is held. A tick that moved the clone announces itself.
function tick() {
  try {
    watchDocs();
    const res = board.resolve(opts.root);
    if (res.state !== 'ready') return;
    const before = board.changes(res);
    const result = board.sync(res, { force: true });
    if (result.sync === 'synced') {
      const after = board.changes(res);
      if (before.ok && after.ok && before.head !== after.head) changed();
    }
  } catch { /* a failed tick is retried by the next one */ }
}
setInterval(tick, TIMER_MS).unref();

// --- Static files ---------------------------------------------------------

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function sendFile(res, path) {
  const ext = extname(path);
  res.writeHead(200, {
    'content-type': TYPES[ext] ?? 'application/octet-stream',
    'cache-control': path.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(path).pipe(res);
}

function serveStatic(res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { rel = '/'; }
  const target = normalize(join(opts.dist, rel));
  const inside = target === opts.dist || target.startsWith(opts.dist + sep);
  if (inside && existsSync(target) && statSync(target).isFile()) return sendFile(res, target);
  if (inside && extname(rel)) return json(res, 404, { error: 'not-found' });
  const index = join(opts.dist, 'index.html');
  if (existsSync(index)) return sendFile(res, index);
  res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('The board app is not built. Run `npm run build` in board/.');
}

// --- HTTP -----------------------------------------------------------------

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function hostAllowed(host, port) {
  return host === `${HOST}:${port}` || host === `localhost:${port}`;
}

function handler(port) {
  return async (req, res) => {
    res.setHeader('x-content-type-options', 'nosniff');
    if (!hostAllowed(req.headers.host, port)) return json(res, 403, { error: 'host-not-allowed' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method-not-allowed' });

    const { pathname } = new URL(req.url ?? '/', `http://${HOST}`);

    if (pathname === '/api/board') return json(res, 200, await boardPayload());

    if (pathname === '/api/changes') {
      const got = resolveBoard();
      if (got.error) return json(res, 200, got.error);
      const since = new URL(req.url ?? '/', `http://${HOST}`).searchParams.get('since') ?? undefined;
      const diff = board.changes(got.res, since);
      if (!diff.ok) return json(res, 400, { error: diff.reason });
      const { ok, ...payload } = diff;
      return json(res, 200, payload);
    }

    if (pathname === '/api/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      res.on('error', () => clients.delete(res));
      const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* the close handler cleans up */ } }, 25000);
      req.on('close', () => { clearInterval(ping); clients.delete(res); });
      return;
    }

    if (pathname === '/api' || pathname.startsWith('/api/')) return json(res, 404, { error: 'not-found' });

    return serveStatic(res, pathname);
  };
}

function listen(port, last) {
  return new Promise((ok, fail) => {
    const server = createServer(handler(port));
    server.once('error', (e) => {
      if (e.code === 'EADDRINUSE' && port < last) ok(listen(port + 1, last));
      else fail(e);
    });
    server.listen(port, HOST, () => ok({ server, port }));
  });
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).unref(); } catch { /* the URL is printed either way */ }
}

try {
  const { port } = await listen(opts.port, opts.port + PORT_SPAN);
  const url = `http://${HOST}:${port}`;
  console.log(`BOARD_URL=${url}`);
  if (opts.open) openBrowser(url);
} catch (e) {
  if (e && e.code === 'EADDRINUSE') {
    console.error(`every port from ${opts.port} to ${opts.port + PORT_SPAN} is in use — pass --port to pick another range`);
  } else {
    console.error(String(e));
  }
  process.exit(1);
}
