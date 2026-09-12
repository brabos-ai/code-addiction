import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * The artefact corpus, served over MCP stdio.
 *
 * RETARGETED by plan 2026-09-12T104012 (F9) from `scripts/artefact-graph-mcp.js`
 * to `mcp/server.mjs --corpus=artefacts`. Every assertion the retired server
 * carried moved here unchanged in intent: the protocol version, the one-object-
 * per-line framing, the tool schemas, the impact parity against the CLI module,
 * the tool-error-not-a-crash rule, the unknown-method code, the notification
 * silence, the malformed-line tolerance, and both history levels.
 *
 * THE SERVER UNDER TEST IS THE ONE SHIPPED TO USERS. That is the whole point of
 * the replacement: this repository's own 76 gate-guarded artefacts are the test
 * corpus for the binary a user runs over their documents.
 *
 * These levels drive the real process over real pipes. A unit test of the
 * handler would not catch a framing bug, and framing is most of what a stdio
 * transport is.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SERVER = path.join(ROOT, 'mcp', 'server.mjs');

/** Every action the server exposes on either corpus. */
const TOOL_NAMES = [
  'dependencies',
  'get',
  'history',
  'impact',
  'neighbors',
  'orphans',
  'path',
  'reindex',
  'search',
  'stats',
  'touched_by',
];

/**
 * Send requests to a fresh server and collect the responses.
 * @param {(object|string)[]} requests JSON-RPC request objects, or a raw line
 * @returns {Promise<{frames: object[], err: string}>}
 */
function rpc(requests) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER, '--corpus=artefacts', `--root=${ROOT}`], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_OPTIONS: '' },
    });

    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', reject);
    child.on('close', () => {
      const frames = out.split('\n').filter((l) => l.trim()).map((l) => {
        try { return JSON.parse(l); } catch { return { parseError: l }; }
      });
      resolve({ frames, err });
    });

    // A raw string is written verbatim, so a test can send a line that is not
    // JSON at all. JSON.stringify would turn "NOT JSON" into valid JSON and the
    // malformed-input level would prove nothing.
    for (const r of requests) child.stdin.write(`${typeof r === 'string' ? r : JSON.stringify(r)}\n`);
    child.stdin.end();
  });
}

const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } };

const graphModule = () =>
  import(`file://${path.join(ROOT, 'scripts', 'graph.js')}`).then((m) => m.default ?? m);

describe('artefact-graph MCP server', () => {
  it('responds to initialize with a protocol version and server info', async () => {
    const { frames } = await rpc([init]);
    const res = frames.find((f) => f.id === 1);

    expect(res.jsonrpc).toBe('2.0');
    expect(res.result.protocolVersion).toBeTruthy();
    // The name carries the corpus, so two registrations of one binary are
    // distinguishable in a client that lists both.
    expect(res.result.serverInfo.name).toMatch(/artefacts/);
    expect(res.result.capabilities.tools).toBeTruthy();
  });

  it('one JSON object per line, and nothing else on stdout', async () => {
    // Framing is most of what a stdio transport is. A stray console.log — a
    // debug line, a warning — corrupts the stream and the client sees garbage,
    // not an error. This is why these levels drive a real process.
    const { frames } = await rpc([init]);
    expect(frames.every((f) => !f.parseError)).toBe(true);
  });

  it('lists tools with input schemas', async () => {
    const { frames } = await rpc([init, { jsonrpc: '2.0', id: 2, method: 'tools/list' }]);
    const tools = frames.find((f) => f.id === 2).result.tools;

    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    for (const t of tools) {
      expect(t.description, `${t.name} has no description`).toBeTruthy();
      expect(t.inputSchema.type).toBe('object');
    }
  });

  it('answers impact with the same numbers the CLI module gives', async () => {
    const { frames } = await rpc([init, {
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'impact', arguments: { node: 'add-doc-schemas' } },
    }]);

    const payload = JSON.parse(frames.find((f) => f.id === 3).result.content[0].text);
    const { impact, loadGraph } = await graphModule();

    expect(payload.dependents.length).toBe(impact(loadGraph(), 'add-doc-schemas').length);
    expect(payload.dependents.length).toBeGreaterThan(10);
  });

  it('still accepts the `node` argument the retired server took', async () => {
    // The new schemas name the argument `id`. A client configured against the
    // old server must keep working, so both names resolve.
    const { frames } = await rpc([init, {
      jsonrpc: '2.0', id: 11, method: 'tools/call',
      params: { name: 'impact', arguments: { id: 'add-doc-schemas' } },
    }, {
      jsonrpc: '2.0', id: 12, method: 'tools/call',
      params: { name: 'impact', arguments: { node: 'add-doc-schemas' } },
    }]);

    const byId = JSON.parse(frames.find((f) => f.id === 11).result.content[0].text);
    const byNode = JSON.parse(frames.find((f) => f.id === 12).result.content[0].text);
    expect(byId).toEqual(byNode);
  });

  it('reports a bad node as a tool error, not a crash', async () => {
    // A protocol-level throw kills the session; an isError result lets the
    // caller see what it got wrong and try again.
    const { frames } = await rpc([init, {
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'impact', arguments: { node: 'no-such-artefact' } },
    }]);

    const res = frames.find((f) => f.id === 4);
    expect(res.result.isError).toBe(true);
    expect(res.result.content[0].text).toMatch(/no-such-artefact/);
  });

  it('reports an unknown method as a JSON-RPC error', async () => {
    const { frames } = await rpc([init, { jsonrpc: '2.0', id: 5, method: 'nope/nope' }]);
    const res = frames.find((f) => f.id === 5);

    expect(res.error.code).toBe(-32601);
  });

  it('ignores notifications, which carry no id and must get no reply', async () => {
    // Replying to a notification is a protocol violation that some clients
    // treat as a fatal desync.
    const { frames } = await rpc([init, { jsonrpc: '2.0', method: 'notifications/initialized' }]);
    expect(frames).toHaveLength(1);
    expect(frames[0].id).toBe(1);
  });

  it('survives a malformed line without dying', async () => {
    const { frames } = await rpc([init, 'NOT JSON', { jsonrpc: '2.0', id: 7, method: 'tools/list' }]);
    expect(frames.find((f) => f.id === 7)?.result.tools).toBeTruthy();
  });

  it('exposes history, and answers it identically to the CLI module', async () => {
    // The rule asserted rather than trusted: the two surfaces answer the same
    // question with the same numbers. A divergence here means one of them grew
    // its own logic.
    const { frames } = await rpc([init, {
      jsonrpc: '2.0', id: 8, method: 'tools/call',
      params: { name: 'history', arguments: { node: 'add-doc-schemas' } },
    }]);

    const payload = JSON.parse(frames.find((f) => f.id === 8).result.content[0].text);
    const { history, loadGraph } = await graphModule();
    const theirs = JSON.parse(JSON.stringify(history(loadGraph(), 'add-doc-schemas')));

    expect(payload.node).toBe('product/skill/add-doc-schemas');
    expect(payload.name).toBe(theirs.name);
    expect(payload.matched).toBe(theirs.matched);
    expect(payload.entries).toEqual(theirs.entries);
    expect(payload.keys).toEqual(theirs.keys);
    expect(payload.unavailable).toBeNull();
  });

  it('keeps serving after a history call, whatever the index is doing', async () => {
    // history is the only action that spawns a subprocess. If it ever threw
    // instead of reporting, this long-lived process would die and every later
    // query with it — which is why the function reports and never throws.
    const { frames } = await rpc([init, {
      jsonrpc: '2.0', id: 9, method: 'tools/call',
      params: { name: 'history', arguments: { node: 'add-doc-schemas' } },
    }, { jsonrpc: '2.0', id: 10, method: 'tools/list' }]);

    expect(frames.find((f) => f.id === 9).result.isError).toBeUndefined();
    expect(frames.find((f) => f.id === 10).result.tools).toHaveLength(TOOL_NAMES.length);
  });
});
