import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Artefact-graph MCP server (plan 0077, wave 3).
 *
 * A stdio MCP server over scripts/graph.js. It speaks JSON-RPC 2.0 in
 * newline-delimited frames and implements exactly three methods — initialize,
 * tools/list, tools/call — with no SDK.
 *
 * That is a deliberate call. The official SDK pulls 89 transitive packages into
 * this repo for a server that wraps six pure functions, and the surface it
 * needs is small and fully specified. Everything it answers comes from
 * scripts/graph.js, so the CLI and the MCP tools cannot drift apart.
 *
 * These levels drive the real process over real pipes. A unit test of the
 * handler would not catch a framing bug, and framing is most of what a stdio
 * transport is.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SERVER = path.join(ROOT, 'scripts', 'artefact-graph-mcp.js');

/**
 * Send requests to a fresh server and collect the responses.
 * @param {object[]} requests JSON-RPC request objects
 * @returns {Promise<object[]>}
 */
function rpc(requests) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER], {
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

describe('artefact-graph MCP server', () => {
  it('responds to initialize with a protocol version and server info', async () => {
    const { frames } = await rpc([init]);
    const res = frames.find((f) => f.id === 1);

    expect(res.jsonrpc).toBe('2.0');
    expect(res.result.protocolVersion).toBeTruthy();
    expect(res.result.serverInfo.name).toMatch(/artefact-graph/);
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

    expect(tools.map((t) => t.name).sort())
      .toEqual(['dependencies', 'impact', 'neighbors', 'orphans', 'path', 'stats']);
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
    const { impact, loadGraph } = await import(`file://${path.join(ROOT, 'scripts', 'graph.js')}`)
      .then((m) => m.default ?? m);

    expect(payload.dependents.length).toBe(impact(loadGraph(), 'add-doc-schemas').length);
    expect(payload.dependents.length).toBeGreaterThan(10);
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
});
