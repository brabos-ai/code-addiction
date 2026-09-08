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
 *   node scripts/graph.js history      <node-id> [--layer product|internal] [--limit N] [--json]
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
// The file's first subprocess ever. See history() for why it is `bash <path>`.
const { spawnSync } = require('node:child_process');

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
// History — the time axis, delegated
// ---------------------------------------------------------------------------

const DELIVERED_SH = path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'delivered.sh');

/** Flags `history` refuses outright. graph.js is query-only, by plan 0077. */
const WRITING_FLAGS = new Set(['--repair', '--write', '--fix']);

/**
 * When this artefact was delivered, and what it replaced.
 *
 * THE READ IS DELEGATED, NEVER REIMPLEMENTED. `delivered.sh read` owns
 * last-line-wins, corrupt-line tolerance and status ordering. Parsing the JSONL
 * here in JavaScript would be a SECOND implementation of one format — plan
 * 0075's whole subject, recreated inside the design that cites it as the
 * lesson. Inlining the parse looks cleaner and is the likeliest future
 * regression; this comment is the reason it must not happen.
 *
 * This verb owns the JOIN and nothing else:
 *   index -> what existed, when it arrived, what it replaced   (time)
 *   graph -> what depends on it today                          (structure)
 *
 * It NEVER writes. There is no `--repair` passthrough: `delivered.sh verify
 * --repair` stays the single writing path.
 *
 * A missing `bash` or a missing script is REPORTED, never thrown. The same
 * function runs inside the long-lived MCP server, where a throw kills every
 * later query rather than the one that failed.
 */
function history(graph, ref, opts = {}) {
  const node = resolve(graph, ref);

  // `delivered.sh read` matches free text against id, name, words, items[].what
  // and items[].find — NEVER against `node`. So the query is the bare name and
  // the `node` filter below is what makes this an answer about the ARTEFACT
  // rather than about the word.
  const name = node.slice(node.lastIndexOf('/') + 1);

  const unavailable = (reason, detail) => ({
    node, name, entries: [], matched: 0, unavailable: { reason, detail },
  });

  // `script`, `cwd` and `bash` default to the real ones and are overridden only
  // by the suite. Two of the four states this function must handle — the script
  // absent, the interpreter absent — cannot be reached otherwise, because both
  // exist in the repo that runs the tests.
  const script = opts.script ?? DELIVERED_SH;
  const cwd = opts.cwd ?? ROOT;
  const bash = opts.bash ?? 'bash';

  if (!fs.existsSync(script)) {
    return unavailable('script-missing', `${script} does not exist`);
  }

  // `--layer` is passed STRAIGHT THROUGH to delivered.sh, never reimplemented
  // as a filter here. It narrows which entries are read at all, which is what
  // /add-framework--plan needs when it asks a product-layer question.
  const args = [script, 'read', name, '--limit', String(opts.limit ?? 50)];
  if (opts.layer) args.push('--layer', opts.layer);

  // `bash <path>`, never direct execution. Windows is this repo's primary
  // platform and a shebang file is not executable by process creation there.
  const res = spawnSync(bash, args, { cwd, encoding: 'utf8', windowsHide: true });

  if (res.error) {
    const reason = res.error.code === 'ENOENT' ? 'bash-missing' : 'spawn-failed';
    return unavailable(reason, res.error.message);
  }

  const stdout = res.stdout || '';
  if (res.status !== 0) {
    const key = (stdout + (res.stderr || '')).split('\n').find((l) => l.startsWith('ERROR=')) || '';
    return unavailable('read-failed', key || `delivered.sh exited ${res.status}`);
  }

  // A line starting with `{` is an entry; anything else is a KEY=VALUE probe
  // result. That split is delivered.sh's documented output contract.
  const entries = [];
  const keys = {};
  for (const line of stdout.split('\n')) {
    const l = line.trim();
    if (!l) continue;
    if (l.startsWith('{')) {
      // One unparseable line is skipped, never fatal — the same tolerance the
      // format reference requires of every reader.
      try { entries.push(JSON.parse(l)); } catch { /* skipped */ }
    } else {
      const eq = l.indexOf('=');
      if (eq > 0) keys[l.slice(0, eq)] = l.slice(eq + 1);
    }
  }

  const dependentsOf = (id) => {
    try { return impact(graph, id, { depth: 1 }).length; } catch { return null; }
  };

  // Ordering is delivered.sh's contract (live -> changed -> superseded -> gone)
  // and is preserved exactly. Re-sorting here would be a consumer re-ranking
  // one shared structure, which is how two readers come to disagree.
  const matched = entries
    .filter((e) => Array.isArray(e.items) && e.items.some((it) => it && it.node === node))
    .map((e) => ({
      ...e,
      items: e.items.map((it) => (it && it.node
        // Enriched only where the record already carries a node. An item
        // without one is returned untouched — never with a fabricated id,
        // which would resolve to nothing and be worse than an absent field.
        ? { ...it, dependents: dependentsOf(it.node) }
        : it)),
    }));

  return { node, name, entries: matched, matched: matched.length, keys, unavailable: null };
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

/**
 * The diagram the docs site ships, as ONE definition.
 *
 * `mermaid --write` renders this and the test asserts the checked-in file
 * matches it. They previously each carried their own options: the documented
 * command emitted 606 lines while the checked-in file was 92, so running the
 * documented command failed the test and replaced the docs diagram with a
 * hairball. Sharing the profile is what makes "regenerate" and "assert current"
 * describe the same picture by construction.
 */
const DOCS_PROFILE = { kinds: ['command'], depth: 1 };
const DOCS_DIAGRAM = path.join(ROOT, 'web', 'public', 'artefact-graph.mmd');

module.exports = {
  loadGraph, resolve, impact, dependencies, neighbors, orphans, pathBetween, stats, history,
  toMermaid, mermaidId,
  DEPENDENCY_TYPES, DEFAULT_GRAPH, DOCS_PROFILE, DOCS_DIAGRAM,
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv) {
  const json = argv.includes('--json');

  // Flags that take a value. Their value must be excluded from the positionals
  // too — `--kinds` was not, so `mermaid --kinds command` put "command" in
  // args[1] and it was read as the root node, failing with `No node matches
  // "command"`. Any future valued flag must be added here or it breaks the same
  // way.
  const VALUED = new Set(['--depth', '--kinds', '--limit', '--layer']);
  const valueIndexes = new Set();
  argv.forEach((a, i) => { if (VALUED.has(a)) valueIndexes.add(i + 1); });

  const valueOf = (flag) => {
    const at = argv.indexOf(flag);
    return at >= 0 ? argv[at + 1] : undefined;
  };

  const rawDepth = valueOf('--depth');
  if (rawDepth !== undefined && !/^\d+$/.test(rawDepth)) {
    console.error(`--depth needs a whole number, got ${JSON.stringify(rawDepth ?? '')}.`);
    process.exitCode = 2;
    return;
  }
  const depth = rawDepth === undefined ? undefined : Number(rawDepth);
  const kinds = valueOf('--kinds')?.split(',');
  const rawLimit = valueOf('--limit');
  const limit = rawLimit === undefined ? undefined : Number(rawLimit);

  const args = argv.filter((a, i) => !a.startsWith('--') && !valueIndexes.has(i));

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
      // --write always renders the shared docs profile, never whatever flags
      // happen to be on the command line. Otherwise `mermaid --write` and the
      // test that holds the file current can describe different diagrams — and
      // they did: 606 lines against 92.
      if (argv.includes('--write')) {
        const out = toMermaid(graph, DOCS_PROFILE);
        fs.mkdirSync(path.dirname(DOCS_DIAGRAM), { recursive: true });
        fs.writeFileSync(DOCS_DIAGRAM, out, 'utf8');
        return console.log(
          `wrote ${path.relative(ROOT, DOCS_DIAGRAM)} ` +
            `(${out.split('\n').length - 1} lines, profile: ${JSON.stringify(DOCS_PROFILE)})`,
        );
      }
      return console.log(toMermaid(graph, { root: a, depth, kinds }));
    }
    case 'stats':
      return emit(stats(graph), (s) =>
        `nodes ${s.nodes} | edges ${s.edges}\n` +
        `kinds  ${JSON.stringify(s.byKind)}\n` +
        `edges  ${JSON.stringify(s.byEdge)}\n` +
        `layers ${JSON.stringify(s.byLayer)}\n` +
        'top hubs (most depended on):\n' +
        s.hubs.map((h) => `  ${String(h.dependents).padStart(3)}  ${h.id}`).join('\n'));
    case 'history': {
      // The verb has NO write path, so a writing flag is rejected rather than
      // ignored. Silently dropping `--repair` would teach a caller that
      // `graph.js` can repair the index, and the next caller would rely on it.
      const writing = argv.filter((f) => WRITING_FLAGS.has(f));
      if (writing.length) {
        console.error(
          `history never writes — ${writing.join(', ')} is not accepted.\n` +
            'Run `bash framwork/.codeadd/scripts/delivered.sh verify --repair` instead.',
        );
        process.exitCode = 2;
        return;
      }
      const h = history(graph, a, { limit, layer: valueOf('--layer') });
      return emit(h, (r) => {
        if (r.unavailable) {
          return `history unavailable for ${r.node}: ${r.unavailable.reason} (${r.unavailable.detail})`;
        }
        if (!r.entries.length) return `no delivery recorded for ${r.node}`;
        return `${r.matched} delivery entr(ies) for ${r.node}:\n` +
          r.entries.map((e) => {
            const items = e.items
              .map((it) => `      ${it.what}  (${it.at})` +
                (it.dependents === null || it.dependents === undefined ? '' : `  [${it.dependents} dependant(s)]`))
              .join('\n');
            return `  ${e.status.padEnd(10)} ${e.ts}  ${e.id}\n` +
              `      ${e.name}` +
              (e.superseded_by ? `\n      superseded by ${e.superseded_by}` : '') +
              `\n${items}`;
          }).join('\n');
      });
    }
    default:
      console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 19).join('\n')
        .replace(/^ \* ?/gm, ''));
      process.exitCode = 2;
  }
}

if (require.main === module) main(process.argv.slice(2));
