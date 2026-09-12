import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { makeDocsCorpus, makeEmptyTree, removeTree } from './helpers/docs-corpus-fixture.js';
import { TOOLS, handle, parseArgv } from '../../mcp/server.mjs';
import fs from 'node:fs';
import { ACTIONS } from '../../mcp/engine.mjs';

/**
 * Plan 2026-09-12T104012 — F8, the stdio JSON-RPC server.
 *
 * Half of this drives the exported handler directly and half spawns the real
 * process and speaks the protocol to it over a pipe. Both halves are needed:
 * the handler half names which frame is wrong when something breaks, and the
 * spawned half is the only thing that proves the stdout discipline, the CLI
 * argument parsing and the shebang actually hold in the shape a provider runs.
 *
 * Written RED against a tree with no `mcp/server.mjs`.
 */

const REPO = path.resolve(import.meta.dirname, '..', '..');
const SERVER = path.join(REPO, 'mcp', 'server.mjs');
const readSource = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');

let docsTree;
let emptyTree;

beforeAll(() => {
  docsTree = makeDocsCorpus();
  emptyTree = makeEmptyTree();
});

afterAll(() => {
  removeTree(docsTree);
  removeTree(emptyTree);
});

/**
 * Speak a list of frames to a freshly spawned server and collect what comes
 * back. Resolves with stdout parsed frame by frame, plus raw stderr.
 */
function talk(frames, { corpus = 'docs', root = docsTree, timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER, `--corpus=${corpus}`, `--root=${root}`], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`server did not answer in ${timeout}ms; stderr: ${err}`));
    }, timeout);

    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stderr.on('data', (d) => {
      err += d;
    });
    child.on('error', reject);
    child.on('close', () => {
      clearTimeout(timer);
      const lines = out.split('\n').filter((l) => l.trim());
      let parsed;
      try {
        parsed = lines.map((l) => JSON.parse(l));
      } catch (e) {
        reject(new Error(`stdout was not one JSON object per line: ${e.message}\n${out}`));
        return;
      }
      resolve({ frames: parsed, stderr: err, raw: out });
    });

    for (const frame of frames) child.stdin.write(`${JSON.stringify(frame)}\n`);
    child.stdin.end();
  });
}

const call = (id, name, args = {}) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

const payload = (frame) => JSON.parse(frame.result.content[0].text);

// ---------------------------------------------------------------------------
// The declared surface
// ---------------------------------------------------------------------------

describe('F8 — the tool surface', () => {
  it('declares one tool per action, and no action without a tool', () => {
    expect(TOOLS.map((t) => t.name).sort()).toEqual([...ACTIONS].sort());
  });

  it('carries history, which the server this replaces exposed', () => {
    // F9's contract: no assertion the retired server carried may be dropped.
    expect(TOOLS.map((t) => t.name)).toContain('history');
  });

  it('every tool carries a description and an input schema', () => {
    for (const tool of TOOLS) {
      expect(tool.description.length, tool.name).toBeGreaterThan(40);
      expect(tool.inputSchema.type, tool.name).toBe('object');
      expect(tool.inputSchema.properties, tool.name).toBeTypeOf('object');
    }
  });

  it('does NOT diverge the surface between corpora', () => {
    // One TOOLS list serves both. A per-corpus list is how two surfaces drift.
    const forDocs = handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { corpus: 'docs', root: docsTree });
    const forArtefacts = handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { corpus: 'artefacts', root: REPO });
    expect(forDocs.result.tools).toEqual(forArtefacts.result.tools);
  });

  it('names the corpus in serverInfo so two registrations are distinguishable', () => {
    const docs = handle({ jsonrpc: '2.0', id: 1, method: 'initialize' }, { corpus: 'docs', root: docsTree });
    const art = handle({ jsonrpc: '2.0', id: 1, method: 'initialize' }, { corpus: 'artefacts', root: REPO });
    expect(docs.result.serverInfo.name).not.toBe(art.result.serverInfo.name);
  });
});

// ---------------------------------------------------------------------------
// The protocol, spoken to a real process
// ---------------------------------------------------------------------------

describe('F8 — the protocol over a pipe', () => {
  it('answers initialize with a protocol version and server info', async () => {
    const { frames } = await talk([{ jsonrpc: '2.0', id: 1, method: 'initialize' }]);
    expect(frames).toHaveLength(1);
    expect(frames[0].result.protocolVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(frames[0].result.serverInfo.name).toContain('docs');
    expect(frames[0].result.capabilities.tools).toBeTypeOf('object');
  });

  it('puts one JSON object per line on stdout, and nothing else', async () => {
    const { raw, frames } = await talk([
      { jsonrpc: '2.0', id: 1, method: 'initialize' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      call(3, 'stats'),
    ]);
    expect(frames).toHaveLength(3);
    for (const line of raw.split('\n').filter((l) => l.trim())) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
    expect(frames.map((f) => f.id)).toEqual([1, 2, 3]);
  });

  it('lists every tool with its input schema', async () => {
    const { frames } = await talk([{ jsonrpc: '2.0', id: 1, method: 'tools/list' }]);
    expect(frames[0].result.tools.map((t) => t.name).sort()).toEqual([...ACTIONS].sort());
  });

  it('answers ping, because a -32601 there makes a healthy server look dead', async () => {
    const { frames } = await talk([{ jsonrpc: '2.0', id: 1, method: 'ping' }]);
    expect(frames[0].result).toEqual({});
  });

  it('ignores a notification, which carries no id and must get no reply', async () => {
    const { frames } = await talk([
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 7, method: 'ping' },
    ]);
    expect(frames).toHaveLength(1);
    expect(frames[0].id).toBe(7);
  });

  it('survives a malformed line and keeps serving', async () => {
    const child = spawn(process.execPath, [SERVER, '--corpus=docs', `--root=${docsTree}`], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stdin.write('{ this is not json\n');
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'ping' })}\n`);
    child.stdin.end();
    await new Promise((r) => child.on('close', r));
    const frames = out.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
    expect(frames).toHaveLength(1);
    expect(frames[0].id).toBe(9);
  });

  it('reports an unknown method as a JSON-RPC error, not a crash', async () => {
    const { frames } = await talk([{ jsonrpc: '2.0', id: 1, method: 'resources/list' }]);
    expect(frames[0].error.code).toBe(-32601);
  });

  it('reports an unknown tool as a JSON-RPC error naming it', async () => {
    const { frames } = await talk([call(1, 'summarise')]);
    expect(frames[0].error.code).toBe(-32602);
    expect(frames[0].error.message).toContain('summarise');
  });

  it('reports a bad id as a tool error, and keeps the session alive', async () => {
    const { frames } = await talk([call(1, 'get', { id: '0404F' }), { jsonrpc: '2.0', id: 2, method: 'ping' }]);
    expect(frames[0].result.isError).toBe(true);
    expect(frames[0].result.content[0].text).toContain('No node matches');
    expect(frames[1].result).toEqual({});
  });

  it('reports an absent corpus as a tool error naming the probe', async () => {
    const { frames } = await talk([call(1, 'stats')], { corpus: 'artefacts', root: emptyTree });
    expect(frames[0].result.isError).toBe(true);
    expect(frames[0].result.content[0].text).toContain('provider-map.json');
  });
});

// ---------------------------------------------------------------------------
// The ten actions, over the pipe, in the shape an agent asks them
// ---------------------------------------------------------------------------

describe('F8 — every action answers over the wire', () => {
  it('search then get: reject on the first sentence, then read the rest', async () => {
    const { frames } = await talk([
      call(1, 'search', { terms: 'refresh expiry' }),
      call(2, 'get', { id: '0051H' }),
    ]);
    const hits = payload(frames[0]).hits;
    expect(hits[0].id).toBe('0051H');
    expect(hits[0].summary).toMatch(/^The refresh shipped without an expiry test/);

    const full = payload(frames[1]);
    expect(full.tldr).toContain('every session past one hour dropped');
    expect(full.observations[0]).toMatchObject({ category: 'cause', tags: ['auth'] });
    expect(full.relations.find((r) => r.type === 'caused_by').to).toBe('0042F');
    expect(full.files).toEqual(['src/auth/refresh.ts', 'src/auth/session.ts']);
    expect(full.attachments.map((a) => a.type).sort()).toEqual(['changelog', 'hotfix-related']);
  });

  it('impact, dependencies, neighbors and path all answer over the wire', async () => {
    const { frames } = await talk([
      call(1, 'impact', { id: '0009F', depth: 1 }),
      call(2, 'dependencies', { id: '0051H' }),
      call(3, 'neighbors', { id: '0042F' }),
      call(4, 'path', { from: '0051H', to: '0009F' }),
    ]);
    expect(payload(frames[0]).dependents.map((d) => d.id)).toEqual(['0042F']);
    expect(payload(frames[1]).dependsOn.map((d) => d.id)).toEqual(['0042F', '0009F']);
    expect(payload(frames[2]).in.length + payload(frames[2]).out.length).toBeGreaterThan(1);
    expect(payload(frames[3]).path).toEqual(['0051H', '0042F', '0009F']);
  });

  it('touched_by joins a file to its work item and its reference page', async () => {
    const { frames } = await talk([call(1, 'touched_by', { files: ['src/auth/refresh.ts'] })]);
    const result = payload(frames[0]);
    expect(result.workItems.map((w) => w.id)).toEqual(['0051H']);
    expect(result.pages.map((p) => p.id)).toEqual(['wiki/backend']);
  });

  it('orphans, stats and reindex answer over the wire', async () => {
    const { frames } = await talk([
      call(1, 'orphans'),
      call(2, 'stats'),
      call(3, 'reindex'),
    ]);
    expect(Array.isArray(payload(frames[0]).orphans)).toBe(true);
    expect(payload(frames[1]).nodes).toBe(4);
    expect(payload(frames[2]).rebuilt).toBe(true);
  });

  it('serves the artefact corpus from this repository with the same tools', async () => {
    const { frames } = await talk([call(1, 'impact', { id: 'add-doc-schemas', depth: 1 })], {
      corpus: 'artefacts',
      root: REPO,
    });
    expect(payload(frames[0]).dependents.length).toBe(22);
  });

  it('a write between two calls in ONE session is visible to the second', async () => {
    // The failure this whole change exists to prevent: a server started before
    // a write answering from a stale graph for the rest of the session.
    const tree = makeDocsCorpus();
    try {
      const child = spawn(process.execPath, [SERVER, '--corpus=docs', `--root=${tree}`], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let out = '';
      child.stdout.on('data', (d) => {
        out += d;
      });

      child.stdin.write(`${JSON.stringify(call(1, 'stats'))}\n`);
      await new Promise((r) => setTimeout(r, 400));

      const added = path.join(tree, 'docs/features/0091F-late/about.md');
      fs.mkdirSync(path.dirname(added), { recursive: true });
      fs.writeFileSync(
        added,
        '---\nid: 0091F\ntype: feature-about\nrelated: []\n---\n\n## TL;DR\nWritten after the server started.\n\n## Relations\n- part_of [[0042F]]\n',
        'utf8',
      );

      child.stdin.write(`${JSON.stringify(call(2, 'stats'))}\n`);
      child.stdin.end();
      await new Promise((r) => child.on('close', r));

      const frames = out.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
      expect(payload(frames[0]).nodes).toBe(4);
      expect(payload(frames[1]).nodes).toBe(5);
    } finally {
      removeTree(tree);
    }
  }, 30000);
});

// ---------------------------------------------------------------------------
// One-shot mode — the verbs answer with no MCP configured
// ---------------------------------------------------------------------------

describe('F8 — the one-shot CLI form', () => {
  const once = (args, opts = {}) =>
    spawnSync(process.execPath, [SERVER, ...args], { encoding: 'utf8', ...opts });

  it('prints one action result as JSON and exits', () => {
    const run = once(['--corpus=docs', `--root=${docsTree}`, '--action=stats']);
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout).nodes).toBe(4);
  });

  it('takes arguments as JSON', () => {
    const run = once([
      '--corpus=docs',
      `--root=${docsTree}`,
      '--action=search',
      '--args={"terms":"itemised"}',
    ]);
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout).hits[0].id).toBe('0042F');
  });

  it('accepts the space-separated flag form too', () => {
    const run = once(['--corpus', 'docs', '--root', docsTree, '--action', 'stats']);
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout).nodes).toBe(4);
  });

  it('rebuilds the index for a close-out, which is why the form exists', () => {
    const tree = makeDocsCorpus();
    try {
      const run = once(['--corpus=docs', `--root=${tree}`, '--action=reindex']);
      expect(run.status).toBe(0);
      expect(JSON.parse(run.stdout).rebuilt).toBe(true);
    } finally {
      removeTree(tree);
    }
  });

  it('refuses an unknown corpus on stderr with a non-zero exit', () => {
    const run = once(['--corpus=everything', '--action=stats']);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain('Unknown corpus');
    expect(run.stdout).toBe('');
  });

  it('refuses an unknown action on stderr with a non-zero exit', () => {
    const run = once(['--corpus=docs', `--root=${docsTree}`, '--action=summarise']);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain('Unknown action');
  });

  it('reports an absent corpus on stderr rather than printing an empty result', () => {
    const run = once(['--corpus=artefacts', `--root=${emptyTree}`, '--action=stats']);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('provider-map.json');
    expect(run.stdout).toBe('');
  });

  it('defaults to the docs corpus, which is what a user project has', () => {
    expect(parseArgv([]).corpus).toBe('docs');
    expect(parseArgv(['--corpus=artefacts']).corpus).toBe('artefacts');
  });
});

// ---------------------------------------------------------------------------
// The CLI entry point — `codeadd mcp --corpus=<name>`
// ---------------------------------------------------------------------------

describe('F8 — the codeadd mcp subcommand', () => {
  it('is registered in the dispatch AND in the help text', async () => {
    const { USAGE } = await import('../src/cli.js');
    expect(USAGE).toContain('mcp --corpus=<name>');
    expect(USAGE).toContain('npx codeadd mcp --corpus=docs');
    const source = readSource('cli/src/cli.js');
    expect(source).toMatch(/subcommand === 'mcp'/);
  });

  it('is routed before the try/catch, so no prompt library reaches stdout', () => {
    const source = readSource('cli/src/cli.js');
    const branch = source.indexOf("subcommand === 'mcp'");
    const tryBlock = source.indexOf('  try {', source.indexOf('export async function runCli'));
    expect(branch).toBeGreaterThan(-1);
    expect(branch).toBeLessThan(tryBlock);
  });

  it('the bridge module writes only to stderr and imports nothing that prompts', () => {
    const source = readSource('cli/src/mcp.js');
    // Match the import statements, not the word: the file explains in a comment
    // why it does not use the prompt library, and a naive search hits that.
    const imports = [...source.matchAll(/^import .*? from '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports).not.toContain('@clack/prompts');
    for (const spec of imports) expect(spec.startsWith('node:'), spec).toBe(true);
    expect(source).not.toMatch(/process\.stdout\.write/);
  });

  it('reports a clear error when the server is not packaged yet', async () => {
    const { mcp: bridge } = await import('../src/mcp.js');
    const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-nomcp-'));
    const written = [];
    const original = process.stderr.write;
    process.stderr.write = (chunk) => {
      written.push(String(chunk));
      return true;
    };
    try {
      expect(await bridge([], bare)).toBe(2);
    } finally {
      process.stderr.write = original;
      fs.rmSync(bare, { recursive: true, force: true });
    }
    expect(written.join('')).toContain('not packaged');
    expect(written.join('')).toContain('node scripts/build.js');
  });

  it('finds the packaged server the build generated', async () => {
    const { isPackaged, serverPath } = await import('../src/mcp.js');
    expect(isPackaged()).toBe(true);
    expect(fs.existsSync(serverPath())).toBe(true);
    expect(path.basename(serverPath())).toBe('server.mjs');
  });
});
