#!/usr/bin/env node
/**
 * server.mjs — MCP stdio server over either corpus, selected by flag.
 *
 * Invoked as `codeadd mcp --corpus=<name>` from a provider's configuration, and
 * as `node mcp/server.mjs --corpus=artefacts` from this repository's own
 * `.mcp.json`. THIS REPOSITORY RUNS THE BINARY IT SHIPS: the 76 artefacts
 * already carrying declared edges, already guarded by three build gates, are
 * the test corpus, exercised on every build.
 *
 * Speaks JSON-RPC 2.0 in newline-delimited frames and implements the four
 * methods a tools-only server needs: initialize, tools/list, tools/call, ping.
 *
 * No SDK, deliberately. The official one pulls 89 transitive packages to wrap a
 * small, fully specified surface — the same call the server this replaces made
 * and justified first.
 *
 * NOTHING may write to stdout except a response frame. A stray console.log
 * corrupts the stream and the client sees garbage rather than an error.
 * Diagnostics go to stderr. The one-shot mode below is the single exception and
 * it exits before any frame could follow.
 */

import readline from 'node:readline';
import process from 'node:process';
import { ACTIONS, actions, loadCorpus } from './engine.mjs';
import { CORPORA } from './corpora.mjs';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_VERSION = '1.0.0';

const NODE_ARG = {
  type: 'string',
  description:
    'A node id, or an unambiguous bare name. For the docs corpus that is the ' +
    "document's `id:` value (0042F, CHG0001) or `wiki/<page>`; for the " +
    'artefact corpus it is <layer>/<kind>/<name>. An ambiguous name is an ' +
    'error, never a guess.',
};

/**
 * The tools, identical on both corpora.
 *
 * Decision 5 rests on the two corpora answering the same verbs, so a tool that
 * existed on one only would make the retirement of the old server a narrowing
 * rather than a replacement.
 */
export const TOOLS = [
  {
    name: 'search',
    description:
      'Find work items and reference pages by keyword. Every hit carries its id, kind, status, ' +
      'tags, path, relations, attachments and the FIRST SENTENCE of its TL;DR — enough to reject ' +
      'a candidate without opening the file. In-flight items are returned with their status; ' +
      'filtering is yours to do against that field.',
    inputSchema: {
      type: 'object',
      properties: {
        terms: { type: 'string', description: 'Space-separated keywords. Empty returns everything.' },
        limit: { type: 'number', description: 'Maximum hits. Defaults to 10.' },
        kind: { type: 'string', description: 'Restrict to one node kind.' },
        status: { type: 'string', description: 'Restrict to one status value.' },
        tag: { type: 'string', description: 'Restrict to nodes carrying this tag.' },
      },
    },
  },
  {
    name: 'get',
    description:
      'One node in full: the whole TL;DR, its observations, its relations both ways, its file ' +
      'set and its attachments. Use it after `search`, which returns only the first sentence.',
    inputSchema: {
      type: 'object',
      properties: {
        id: NODE_ARG,
        sections: { type: 'array', items: { type: 'string' }, description: 'Return only these fields.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'impact',
    description:
      'What breaks if this changes. Walks dependants TRANSITIVELY and returns each with its ' +
      'distance. Excludes the weak edge kind — MENTIONS on artefacts, links_to on docs — which ' +
      'records a connection with no claim that anything depends on anything.',
    inputSchema: {
      type: 'object',
      properties: { id: NODE_ARG, depth: { type: 'number' } },
      required: ['id'],
    },
  },
  {
    name: 'dependencies',
    description: 'What this needs, transitively. The inverse of impact.',
    inputSchema: {
      type: 'object',
      properties: { id: NODE_ARG, depth: { type: 'number' } },
      required: ['id'],
    },
  },
  {
    name: 'neighbors',
    description:
      'Immediate inbound and outbound edges with their types, weak edges included — a neighbour ' +
      'listing describes the node, it is not a blast radius.',
    inputSchema: { type: 'object', properties: { id: NODE_ARG }, required: ['id'] },
  },
  {
    name: 'path',
    description: 'Shortest dependency chain between two nodes, or null when none exists.',
    inputSchema: {
      type: 'object',
      properties: { from: NODE_ARG, to: NODE_ARG },
      required: ['from', 'to'],
    },
  },
  {
    name: 'touched_by',
    description:
      'For a list of files: the work items that changed them, and the reference pages whose ' +
      '`sources` globs cover them. The join between "what was already built here" and "what this ' +
      'module is". NOT the same question as impact, which means transitive dependants.',
    inputSchema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string' } } },
      required: ['files'],
    },
  },
  {
    name: 'orphans',
    description:
      'On docs: every work item with no relation or no TL;DR — the migration work queue, with a ' +
      'reason per node. On artefacts: every artefact nothing depends on, commands and fragments ' +
      'excluded.',
    inputSchema: { type: 'object', properties: { kind: { type: 'string' } } },
  },
  {
    name: 'stats',
    description: 'Index health: counts per kind and edge type, the hubs, what was skipped, and every unresolved id.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'history',
    description:
      'When this node was delivered, and what it replaced. Reads the delivery index through ' +
      'delivered.sh — never its own parser — and joins each entry to the graph, so an item that ' +
      'carries a node id also carries its current dependant count. Query-only: it never writes, ' +
      'and an unavailable index is reported rather than thrown.',
    inputSchema: {
      type: 'object',
      properties: {
        id: NODE_ARG,
        limit: { type: 'number', description: 'Maximum entries to read. Defaults to 50.' },
        layer: { type: 'string', description: 'Passed straight through to delivered.sh.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'reindex',
    description:
      'Rebuild the docs index from the markdown and report the counts. A no-op on the artefact ' +
      'corpus, whose sidecar `node scripts/build.js` owns.',
    inputSchema: { type: 'object', properties: { scope: { type: 'string' } } },
  },
];

/** One frame out. The ONLY function permitted to touch stdout in server mode. */
function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

export function handle(req, context) {
  // A notification carries no id and must receive no reply — answering one is a
  // protocol violation some clients treat as a fatal desync.
  if (req.id === undefined || req.id === null) return null;

  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: `codeadd-${context.corpus}`, version: SERVER_VERSION },
        },
      };

    case 'tools/list':
      return { jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } };

    // Part of the base protocol: a client may ping to check liveness, and
    // answering -32601 makes a healthy server look dead.
    case 'ping':
      return { jsonrpc: '2.0', id: req.id, result: {} };

    case 'tools/call': {
      const name = req.params?.name;
      if (!ACTIONS.includes(name)) {
        return {
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32602, message: `Unknown tool: ${name}` },
        };
      }
      try {
        // Re-read per call, deliberately. The markdown is the truth and a
        // server started before a write would otherwise answer from a stale
        // graph for the rest of the session.
        const data = loadCorpus(context.corpus, context.root);
        const result = actions[name](data, req.params.arguments || {}, { root: context.root });
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
        };
      } catch (e) {
        // A bad id or an absent corpus is the caller's situation, not a broken
        // session: report it as a tool error so they can see it and retry. A
        // protocol-level throw would kill the connection instead.
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: e.message }], isError: true },
        };
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: `Method not found: ${req.method}` },
      };
  }
}

export function parseArgv(argv) {
  const out = { corpus: 'docs', root: process.cwd(), action: null, args: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const take = (inline, flag) => (arg.startsWith(inline) ? arg.slice(inline.length) : argv[++i]);
    if (arg.startsWith('--corpus')) out.corpus = take('--corpus=');
    else if (arg.startsWith('--root')) out.root = take('--root=');
    else if (arg.startsWith('--action')) out.action = take('--action=');
    else if (arg.startsWith('--args')) out.args = JSON.parse(take('--args=') || '{}');
  }
  if (!CORPORA[out.corpus]) {
    throw new Error(
      `Unknown corpus "${out.corpus}". Available: ${Object.keys(CORPORA).join(', ')}.`,
    );
  }
  return out;
}

/**
 * One-shot mode — the same verbs, without a client.
 *
 * Every provider can shell out; only some have MCP configured. A command that
 * needs one answer (`/add.done` rebuilding the index at close-out) should not
 * have to speak JSON-RPC to a subprocess it spawned for one call.
 */
export function runOnce(context) {
  const data = loadCorpus(context.corpus, context.root);
  return actions[context.action](data, context.args, { root: context.root });
}

export function main(argv = process.argv.slice(2)) {
  let context;
  try {
    context = parseArgv(argv);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exitCode = 2;
    return;
  }

  if (context.action) {
    if (!ACTIONS.includes(context.action)) {
      process.stderr.write(`Unknown action "${context.action}". Available: ${ACTIONS.join(', ')}.\n`);
      process.exitCode = 2;
      return;
    }
    try {
      process.stdout.write(`${JSON.stringify(runOnce(context), null, 2)}\n`);
    } catch (e) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    }
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

  rl.on('line', (line) => {
    if (!line.trim()) return;

    let req;
    try {
      req = JSON.parse(line);
    } catch {
      // One malformed line must not end the session. Without an id there is
      // nobody to answer, so log to stderr and carry on.
      process.stderr.write('codeadd-mcp: ignoring unparseable line\n');
      return;
    }

    const res = handle(req, context);
    if (res) send(res);
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.mjs')) {
  main();
}
