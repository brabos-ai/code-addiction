#!/usr/bin/env node
// ============================================
// BOARD SERVER
// Serves the board app and a read-only JSON view of the project backlog.
// ============================================
// Usage: node server.mjs [--root <dir>] [--scripts <dir>] [--port <n>] [--no-open]
//
//   --root     the project whose docs/ holds the board. Default: the cwd.
//   --scripts  where backlog.sh lives. Default: <root>/.codeadd/scripts.
//   --port     first port to try. Default 4317; a busy port moves to the next,
//              up to +10. All eleven busy -> one line and exit 1.
//   --no-open  do not open a browser.
//   --dist     the built app. Default: ./dist next to this file. Tests use it.
//
// Output: `BOARD_URL=<url>` on stdout once listening — the one line a caller
//         or a test waits for.
//
// ZERO DEPENDENCIES, NODE >= 18. This file ships to a user's .codeadd/board/,
// where no node_modules sits on the resolution path — the same reason mcp/
// takes none.
//
// THE SERVER NEVER PARSES docs/backlog.jsonl. Tickets come from
// `backlog.sh list --all`, which owns the damaged-line and undefined-status
// rules; a second parser would drift from them. The status vocabulary,
// docs/backlog.definitions.json, is read directly: `list` falls back to its
// default vocabulary without saying the file is absent, and the board must
// know that to derive its columns.
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
import { existsSync, readFileSync, statSync, watch, createReadStream } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const PORT_SPAN = 10;

// --- Arguments ------------------------------------------------------------

function parseArgs(argv) {
  const opts = { root: process.cwd(), scripts: null, port: 4317, open: true, dist: join(HERE, 'dist') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--root') opts.root = next();
    else if (a === '--scripts') opts.scripts = next();
    else if (a === '--port') opts.port = Number(next());
    else if (a === '--dist') opts.dist = next();
    else if (a === '--no-open') opts.open = false;
    else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }
  opts.root = resolve(opts.root);
  opts.scripts = resolve(opts.scripts ?? join(opts.root, '.codeadd', 'scripts'));
  opts.dist = resolve(opts.dist);
  if (!Number.isInteger(opts.port) || opts.port < 1 || opts.port > 65535) {
    console.error('--port must be an integer between 1 and 65535');
    process.exit(2);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const DOCS = join(opts.root, 'docs');
const BOARD_FILE = 'backlog.jsonl';
const DEFS_FILE = 'backlog.definitions.json';

// --- Reading the board ----------------------------------------------------

/** Runs `backlog.sh list --all` and splits its KEY=VALUE lines from its tickets. */
function runList() {
  const script = join(opts.scripts, 'backlog.sh');
  if (!existsSync(script)) return Promise.resolve({ error: 'script-missing', detail: script });

  return new Promise((done) => {
    let out = '';
    let err = '';
    let proc;
    try {
      proc = spawn('bash', [script, 'list', '--all'], { cwd: opts.root, env: { ...process.env, NODE_OPTIONS: '' } });
    } catch (e) {
      done({ error: 'bash-missing', detail: String(e) });
      return;
    }
    proc.on('error', (e) => done({ error: e.code === 'ENOENT' ? 'bash-missing' : 'script-failed', detail: String(e) }));
    proc.stdout.on('data', (d) => { out += d; });
    proc.stderr.on('data', (d) => { err += d; });
    proc.on('close', (code) => {
      if (code !== 0) {
        done({ error: 'script-failed', detail: (err || out).trim().slice(0, 2000) });
        return;
      }
      const keys = {};
      const multi = { DAMAGED_LINE: [], UNDEFINED_STATUS: [] };
      const tickets = [];
      for (const line of out.split(/\r?\n/)) {
        if (!line) continue;
        if (line.startsWith('{')) {
          try { tickets.push(JSON.parse(line)); } catch { /* the script emitted it; a bad one is its bug, not ours to hide */ }
          continue;
        }
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const k = line.slice(0, eq);
        const v = line.slice(eq + 1);
        if (k in multi) multi[k].push(v);
        else keys[k] = v;
      }
      done({ keys, multi, tickets });
    });
  });
}

/** The definitions file, or null when absent or unreadable. */
function readDefs() {
  const path = join(DOCS, DEFS_FILE);
  if (!existsSync(path)) return null;
  try {
    const d = JSON.parse(readFileSync(path, 'utf8'));
    if (!d || !Array.isArray(d.statuses)) return null;
    return d.statuses
      .filter((s) => s && typeof s.name === 'string')
      .map((s, i) => ({ name: s.name, order: Number.isFinite(s.order) ? s.order : i + 1, means: typeof s.means === 'string' ? s.means : '' }))
      .sort((a, b) => a.order - b.order);
  } catch {
    return null;
  }
}

async function boardPayload() {
  const listed = await runList();
  if (listed.error) return { error: listed.error, detail: listed.detail };

  const defs = readDefs();
  const boardPresent = listed.keys.BACKLOG_PRESENT === 'yes';
  let statuses = defs;
  if (!statuses) {
    const seen = [];
    for (const t of listed.tickets) if (typeof t.status === 'string' && !seen.includes(t.status)) seen.push(t.status);
    statuses = seen.map((name, i) => ({ name, order: i + 1, means: '' }));
  }

  return {
    present: boardPresent || defs !== null,
    tickets: listed.tickets,
    statuses,
    damagedLines: listed.multi.DAMAGED_LINE.map(Number).filter(Number.isFinite),
    // Without a definitions file the columns come from the statuses in use, so
    // nothing can be undefined — the script's own report compares against its
    // default vocabulary, which this board is not using.
    undefinedStatuses: defs ? listed.multi.UNDEFINED_STATUS : [],
    readAt: new Date().toISOString(),
  };
}

// --- Live updates ---------------------------------------------------------

const clients = new Set();

function broadcast(event) {
  for (const res of clients) {
    // A client that went away between its close event and this write must not
    // take the server down for every other open tab.
    try { res.write(`event: ${event}\ndata: {}\n\n`); } catch { clients.delete(res); }
  }
}

let debounce = null;
function changed() {
  clearTimeout(debounce);
  debounce = setTimeout(() => broadcast('board-changed'), 150);
}

let docsWatcher = null;
function watchDocs() {
  if (docsWatcher || !existsSync(DOCS)) return;
  try {
    docsWatcher = watch(DOCS, (_type, name) => {
      if (!name || name === BOARD_FILE || name === DEFS_FILE) changed();
    });
    docsWatcher.on('error', () => { docsWatcher = null; });
  } catch {
    docsWatcher = null;
  }
}

// docs/ may not exist yet — the first ticket creates it. Watch the root for it.
try {
  watch(opts.root, (_type, name) => {
    if (name === 'docs') { watchDocs(); changed(); }
  }).on('error', () => {});
} catch { /* a root that cannot be watched still serves; the client refetches on focus */ }
watchDocs();

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
    // Vite fingerprints everything under assets/, so it never changes in place.
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
  // A path with an extension is a missing asset, not an app route.
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
