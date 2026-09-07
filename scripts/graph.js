#!/usr/bin/env node
/**
 * graph.js — query the build-emitted artefact graph.
 *
 * Usage:
 *   node scripts/graph.js impact       <node-id> [--depth N] [--json]
 *   node scripts/graph.js dependencies <node-id> [--depth N] [--json]
 *   node scripts/graph.js neighbors    <node-id> [--json]
 *   node scripts/graph.js path         <from-id> <to-id> [--json]
 *   node scripts/graph.js orphans      [--json]
 *   node scripts/graph.js stats        [--json]
 *
 * A node id is `<layer>/<kind>/<name>`, e.g. product/skill/add-doc-schemas.
 * A bare name is resolved when it is unambiguous.
 *
 * Why a CLI and not only an MCP server: the callers are this framework's own
 * commands, running on five providers. Every one of them can shell out; only
 * some have MCP configured. scripts/artefact-graph-mcp.js wraps this same
 * module, so both surfaces answer identically by construction.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_GRAPH = path.join(ROOT, 'framwork', '.codeadd', 'artefact-graph.json');

/**
 * Edge types that mean "this would break if that changed".
 *
 * MENTIONS is deliberately absent. It records that one doc names another while
 * pointing AWAY from it ("use X instead"); counting it would inflate every
 * blast radius with relationships that cannot break anything.
 */
const DEPENDENCY_TYPES = new Set(['USES_SKILL', 'DISPATCHES', 'HANDS_OFF_TO', 'RUNS_SCRIPT', 'INJECTS_INTO']);

/**
 * Kinds nothing is expected to depend on, so absence of dependants is normal.
 *
 * Commands are invoked by people. Fragments are the SOURCE of every
 * INJECTS_INTO edge and never its target, so they are orphans by construction —
 * reporting all 23 buries the findings that matter. Everything else earns its
 * place in the graph by being depended on, and a reference file or script that
 * nothing reaches is genuinely dead weight worth surfacing.
 */
const ENTRY_POINT_KINDS = new Set(['command', 'fragment']);

function loadGraph(file = DEFAULT_GRAPH) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `No artefact graph at ${path.relative(ROOT, file)}. Run \`node scripts/build.js\` first.`,
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Resolve a node id, accepting a bare name when it is unambiguous.
 * Ambiguity is an error, not a guess: `add-commit` is both a product and an
 * internal skill, and silently picking one would answer the wrong question.
 */
function resolve(graph, ref) {
  if (graph.nodes.some((n) => n.id === ref)) return ref;

  const matches = graph.nodes.filter((n) => n.name === ref || n.id.endsWith(`/${ref}`));
  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1) {
    throw new Error(
      `"${ref}" is ambiguous — it matches ${matches.length} nodes:\n  ` +
        matches.map((m) => m.id).join('\n  '),
    );
  }
  throw new Error(`No node matches "${ref}".`);
}

/** Adjacency in one direction, dependency edges only unless told otherwise. */
function adjacency(graph, { reverse = false, all = false } = {}) {
  const adj = new Map();
  for (const e of graph.edges) {
    if (!all && !DEPENDENCY_TYPES.has(e.type)) continue;
    const [from, to] = reverse ? [e.to, e.from] : [e.from, e.to];
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push({ id: to, type: e.type, modifier: e.modifier });
  }
  return adj;
}

/**
 * Breadth-first walk returning every reachable node with its distance.
 * `seen` is what makes a dependency cycle terminate instead of hanging.
 */
function walk(graph, startId, { reverse, depth = Infinity }) {
  const adj = adjacency(graph, { reverse });
  const seen = new Set([startId]);
  const out = [];
  let frontier = [startId];

  for (let d = 1; d <= depth && frontier.length; d++) {
    const next = [];
    for (const id of frontier) {
      for (const edge of adj.get(id) || []) {
        if (seen.has(edge.id)) continue;
        seen.add(edge.id);
        out.push({ id: edge.id, depth: d, via: edge.type });
        next.push(edge.id);
      }
    }
    frontier = next;
  }
  return out;
}

/** Everything that transitively depends on `ref` — the blast radius. */
function impact(graph, ref, opts = {}) {
  return walk(graph, resolve(graph, ref), { reverse: true, depth: opts.depth });
}

/** Everything `ref` transitively depends on. */
function dependencies(graph, ref, opts = {}) {
  return walk(graph, resolve(graph, ref), { reverse: false, depth: opts.depth });
}

/** Immediate edges either way, MENTIONS included — a listing is not a radius. */
function neighbors(graph, ref) {
  const id = resolve(graph, ref);
  return {
    in: graph.edges.filter((e) => e.to === id),
    out: graph.edges.filter((e) => e.from === id),
  };
}

/**
 * Artefacts nothing depends on.
 *
 * Commands are excluded: people invoke them, so all 24 would otherwise be
 * reported and drown the findings that matter.
 */
function orphans(graph) {
  const depended = new Set(
    graph.edges.filter((e) => DEPENDENCY_TYPES.has(e.type)).map((e) => e.to),
  );
  return graph.nodes.filter((n) => !ENTRY_POINT_KINDS.has(n.kind) && !depended.has(n.id));
}

/** Shortest dependency chain from → to, or null. */
function pathBetween(graph, fromRef, toRef) {
  const from = resolve(graph, fromRef);
  const to = resolve(graph, toRef);
  if (from === to) return [from];

  const adj = adjacency(graph);
  const prev = new Map([[from, null]]);
  let frontier = [from];

  while (frontier.length) {
    const next = [];
    for (const id of frontier) {
      for (const edge of adj.get(id) || []) {
        if (prev.has(edge.id)) continue;
        prev.set(edge.id, id);
        if (edge.id === to) {
          const chain = [to];
          for (let at = id; at !== null; at = prev.get(at)) chain.unshift(at);
          return chain;
        }
        next.push(edge.id);
      }
    }
    frontier = next;
  }
  return null;
}

function stats(graph) {
  const byKind = {};
  const byEdge = {};
  const byLayer = {};
  for (const n of graph.nodes) {
    byKind[n.kind] = (byKind[n.kind] || 0) + 1;
    byLayer[n.layer] = (byLayer[n.layer] || 0) + 1;
  }
  for (const e of graph.edges) byEdge[e.type] = (byEdge[e.type] || 0) + 1;

  const inbound = {};
  for (const e of graph.edges) {
    if (DEPENDENCY_TYPES.has(e.type)) inbound[e.to] = (inbound[e.to] || 0) + 1;
  }
  const hubs = Object.entries(inbound)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, dependents: count }));

  return { nodes: graph.nodes.length, edges: graph.edges.length, byKind, byEdge, byLayer, hubs };
}

// ---------------------------------------------------------------------------
// Mermaid emission
// ---------------------------------------------------------------------------

/** Node shape per kind, so the diagram reads without a legend lookup. */
const MERMAID_SHAPE = {
  command: (id, label) => `${id}(["${label}"])`,
  skill: (id, label) => `${id}["${label}"]`,
  agent: (id, label) => `${id}[/"${label}"/]`,
  script: (id, label) => `${id}[("${label}")]`,
  reference: (id, label) => `${id}>"${label}"]`,
  fragment: (id, label) => `${id}{{"${label}"}}`,
};

/**
 * Mermaid identifiers allow only word characters, but a node id is
 * `product/command/add.plan`. Emitted raw it produces a diagram that silently
 * fails to render — no error, just a blank panel on the docs site.
 */
function mermaidId(nodeId) {
  return `n_${nodeId.replace(/[^A-Za-z0-9]/g, '_')}`;
}

/**
 * Render a SCOPED slice of the graph as a mermaid flowchart.
 *
 * Scoping is the design, not a limitation: 202 nodes and 625 edges rendered at
 * once is an unreadable hairball that tells a reader nothing.
 *
 * @param {object} graph
 * @param {{root?: string, depth?: number, kinds?: string[], direction?: string}} opts
 *   root  — centre the diagram on one artefact and walk out from it
 *   kinds — otherwise, include only these node kinds
 */
function toMermaid(graph, opts = {}) {
  const { depth = 2, direction = 'LR' } = opts;
  let keep;

  if (opts.root) {
    const rootId = resolve(graph, opts.root);
    keep = new Set([rootId, ...walk(graph, rootId, { reverse: false, depth }).map((r) => r.id)]);
    // MENTIONS is excluded from the walk (it is not a dependency) but belongs
    // in a picture: a reader wants to see the pointer, drawn so it cannot be
    // mistaken for one.
    for (const e of graph.edges) {
      if (e.type === 'MENTIONS' && keep.has(e.from)) keep.add(e.to);
    }
  } else {
    const kinds = new Set(opts.kinds || ['command', 'skill', 'agent']);
    keep = new Set(graph.nodes.filter((n) => kinds.has(n.kind)).map((n) => n.id));
  }

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const lines = [`flowchart ${direction}`];

  for (const id of [...keep].sort()) {
    const n = byId.get(id);
    if (!n) continue;
    const shape = MERMAID_SHAPE[n.kind] || MERMAID_SHAPE.skill;
    lines.push(`    ${shape(mermaidId(id), n.name)}`);
  }

  const drawn = new Set();
  for (const e of graph.edges) {
    if (!keep.has(e.from) || !keep.has(e.to)) continue;
    const key = `${e.from}|${e.type}|${e.to}`;
    if (drawn.has(key)) continue;
    drawn.add(key);
    // A dotted link for MENTIONS — the picture must not let a "use X instead"
    // pointer read as a dependency.
    const link = e.type === 'MENTIONS' ? '-.->' : '-->';
    lines.push(`    ${mermaidId(e.from)} ${link} ${mermaidId(e.to)}`);
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  loadGraph, resolve, impact, dependencies, neighbors, orphans, pathBetween, stats,
  toMermaid, mermaidId,
  DEPENDENCY_TYPES, DEFAULT_GRAPH,
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv) {
  const json = argv.includes('--json');
  const depthAt = argv.indexOf('--depth');
  const depth = depthAt >= 0 ? Number(argv[depthAt + 1]) : undefined;
  const args = argv.filter((a, i) =>
    !a.startsWith('--') && !(depthAt >= 0 && i === depthAt + 1));

  const [cmd, a, b] = args;
  const graph = loadGraph();
  const emit = (v, text) => console.log(json ? JSON.stringify(v, null, 2) : text(v));

  const list = (rows) => rows.length
    ? rows.map((r) => `  ${String(r.depth).padStart(2)}  ${r.id}  (${r.via})`).join('\n')
    : '  (none)';

  switch (cmd) {
    case 'impact':
      return emit(impact(graph, a, { depth }), (r) =>
        `${r.length} artefact(s) depend on ${resolve(graph, a)}:\n${list(r)}`);
    case 'dependencies':
      return emit(dependencies(graph, a, { depth }), (r) =>
        `${resolve(graph, a)} depends on ${r.length} artefact(s):\n${list(r)}`);
    case 'neighbors':
      return emit(neighbors(graph, a), (n) =>
        `in (${n.in.length}):\n` +
        (n.in.map((e) => `  ${e.from}  (${e.type})`).join('\n') || '  (none)') +
        `\nout (${n.out.length}):\n` +
        (n.out.map((e) => `  ${e.to}  (${e.type})`).join('\n') || '  (none)'));
    case 'path': {
      const p = pathBetween(graph, a, b);
      return emit(p, (r) => (r ? r.join('\n  -> ') : 'no dependency path'));
    }
    case 'orphans':
      return emit(orphans(graph), (r) =>
        `${r.length} artefact(s) nothing depends on:\n` +
        (r.map((n) => `  ${n.id}`).join('\n') || '  (none)'));
    case 'mermaid': {
      const kindsAt = argv.indexOf('--kinds');
      const out = toMermaid(graph, {
        root: a,
        depth,
        kinds: kindsAt >= 0 ? argv[kindsAt + 1].split(',') : undefined,
      });
      if (argv.includes('--write')) {
        const dest = path.join(ROOT, 'web', 'public', 'artefact-graph.mmd');
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, out, 'utf8');
        return console.log(`wrote ${path.relative(ROOT, dest)}`);
      }
      return console.log(out);
    }
    case 'stats':
      return emit(stats(graph), (s) =>
        `nodes ${s.nodes} | edges ${s.edges}\n` +
        `kinds  ${JSON.stringify(s.byKind)}\n` +
        `edges  ${JSON.stringify(s.byEdge)}\n` +
        `layers ${JSON.stringify(s.byLayer)}\n` +
        'top hubs (most depended on):\n' +
        s.hubs.map((h) => `  ${String(h.dependents).padStart(3)}  ${h.id}`).join('\n'));
    default:
      console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 18).join('\n')
        .replace(/^ \* ?/gm, ''));
      process.exitCode = 2;
  }
}

if (require.main === module) main(process.argv.slice(2));
