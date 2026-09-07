#!/usr/bin/env node
/**
 * artefact-graph-mcp.js — MCP stdio server over the artefact graph.
 *
 * Register it with any MCP-capable provider, e.g. Claude Code:
 *   claude mcp add artefact-graph -- node scripts/artefact-graph-mcp.js
 *
 * Speaks JSON-RPC 2.0 in newline-delimited frames and implements the three
 * methods a tools-only server needs: initialize, tools/list, tools/call.
 *
 * No SDK, deliberately. The official one pulls 89 transitive packages into this
 * repo to wrap six pure functions, and the surface needed here is small and
 * fully specified. Every answer comes from scripts/graph.js — the same module
 * the CLI uses — so the two surfaces cannot drift apart.
 *
 * NOTHING may write to stdout except a response frame. A stray console.log
 * corrupts the stream, and the client sees garbage rather than an error.
 * Diagnostics go to stderr.
 */

const readline = require('node:readline');
const G = require('./graph.js');

const PROTOCOL_VERSION = '2024-11-05';

const NODE_ARG = {
  type: 'object',
  properties: {
    node: {
      type: 'string',
      description:
        'Node id (<layer>/<kind>/<name>, e.g. product/skill/add-doc-schemas) or an ' +
        'unambiguous bare name. An ambiguous name is an error, never a guess.',
    },
    depth: { type: 'number', description: 'Maximum hops to walk. Omit for unlimited.' },
  },
  required: ['node'],
};

const TOOLS = [
  {
    name: 'impact',
    description:
      'What breaks if this artefact changes. Walks dependants TRANSITIVELY and returns each ' +
      'with its distance. Excludes MENTIONS edges, which record a doc naming another while ' +
      'pointing away from it and therefore cannot break.',
    inputSchema: NODE_ARG,
    run: (g, a) => ({ node: G.resolve(g, a.node), dependents: G.impact(g, a.node, { depth: a.depth }) }),
  },
  {
    name: 'dependencies',
    description: 'What this artefact needs, transitively. The inverse of impact.',
    inputSchema: NODE_ARG,
    run: (g, a) => ({ node: G.resolve(g, a.node), dependsOn: G.dependencies(g, a.node, { depth: a.depth }) }),
  },
  {
    name: 'neighbors',
    description:
      'Immediate inbound and outbound edges with their types. Includes MENTIONS — a neighbour ' +
      'listing describes the artefact, it is not a blast radius.',
    inputSchema: { type: 'object', properties: { node: NODE_ARG.properties.node }, required: ['node'] },
    run: (g, a) => ({ node: G.resolve(g, a.node), ...G.neighbors(g, a.node) }),
  },
  {
    name: 'path',
    description: 'Shortest dependency chain between two artefacts, or null when none exists.',
    inputSchema: {
      type: 'object',
      properties: { from: { type: 'string' }, to: { type: 'string' } },
      required: ['from', 'to'],
    },
    run: (g, a) => ({ path: G.pathBetween(g, a.from, a.to) }),
  },
  {
    name: 'orphans',
    description:
      'Artefacts nothing depends on. Excludes commands (people invoke those) and fragments ' +
      '(the source of every injection edge and never its target).',
    inputSchema: { type: 'object', properties: {} },
    run: (g) => ({ orphans: G.orphans(g) }),
  },
  {
    name: 'stats',
    description: 'Node and edge counts by kind, layer and type, plus the most depended-on hubs.',
    inputSchema: { type: 'object', properties: {} },
    run: (g) => G.stats(g),
  },
];

/** One frame out. The ONLY function permitted to touch stdout. */
function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function handle(req) {
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
          serverInfo: { name: 'artefact-graph', version: '1.0.0' },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
        },
      };

    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === req.params?.name);
      if (!tool) {
        return { jsonrpc: '2.0', id: req.id, error: { code: -32602, message: `Unknown tool: ${req.params?.name}` } };
      }
      try {
        const result = tool.run(G.loadGraph(), req.params.arguments || {});
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
        };
      } catch (e) {
        // A bad node name is the caller's mistake, not a broken session: report
        // it as a tool error so they can see it and retry. A protocol-level
        // throw would kill the connection instead.
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: e.message }], isError: true },
        };
      }
    }

    default:
      return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Method not found: ${req.method}` } };
  }
}

function main() {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

  rl.on('line', (line) => {
    if (!line.trim()) return;

    let req;
    try {
      req = JSON.parse(line);
    } catch {
      // One malformed line must not end the session. Without an id there is
      // nobody to answer, so log and carry on.
      process.stderr.write(`artefact-graph-mcp: ignoring unparseable line\n`);
      return;
    }

    const res = handle(req);
    if (res) send(res);
  });
}

module.exports = { handle, TOOLS, PROTOCOL_VERSION };

if (require.main === module) main();
