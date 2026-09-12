/**
 * engine.mjs — the index builder and the query actions, over the corpus registry.
 *
 * Most of them carry the same meaning on both corpora, which is what makes one
 * server over two parsers worth doing. `search`, `touched_by` and `reindex` are
 * new to the docs corpus and answer trivially on the artefact one.
 *
 * `history` is the eleventh and is here because the server it replaces exposed
 * it. The design's verb table lists ten and omits it; deleting
 * `scripts/artefact-graph-mcp.js` without it would take a working capability
 * away, which F9's own contract forbids.
 *
 * `impact`, `dependencies` and `neighbors` are one walk behind two parameters.
 * They stay three actions because `scripts/artefact-graph-mcp.js` exposes them
 * that way and the parity level asserts both surfaces answer identically.
 * Collapsing them here would diverge the two surfaces for no gain.
 *
 * THE MARKDOWN IS THE TRUTH AND THE INDEX IS A CACHE. A docs query re-scans
 * before answering, for the same reason `artefact-graph-mcp.js` re-reads its
 * sidecar per call: a server started before a write would otherwise answer from
 * a stale graph for the rest of the session, which is the failure this whole
 * change exists to prevent. The cache is written as a by-product so other
 * consumers have a file to read; nothing here reads it back.
 *
 * No network, no model, no native dependency.
 */

import fs from 'node:fs';
import path from 'node:path';
// The file's only subprocess. See `history` for why it is `bash <path>`.
import { spawnSync } from 'node:child_process';
import { CORPORA, resolveCorpus, probe } from './corpora.mjs';

/**
 * Edge kinds that mean "this would break if that changed", per corpus.
 *
 * MENTIONS is absent from the artefact set for the reason `scripts/graph.js`
 * records: it marks one doc naming another while pointing AWAY from it, so
 * counting it inflates every blast radius with relationships that cannot break.
 * `links_to` is the docs corpus's exact equivalent — an edge recovered
 * mechanically, carrying no claim that anything depends on anything.
 */
const DEPENDENCY_TYPES = {
  artefacts: new Set(['USES_SKILL', 'DISPATCHES', 'HANDS_OFF_TO', 'RUNS_SCRIPT', 'INJECTS_INTO']),
  docs: new Set(['caused_by', 'depends_on', 'part_of']),
};

/** Kinds nothing is expected to depend on, so absence of dependants is normal. */
const ENTRY_POINT_KINDS = {
  artefacts: new Set(['command', 'fragment']),
  docs: new Set(),
};

const ACTIONS = [
  'search',
  'get',
  'impact',
  'dependencies',
  'neighbors',
  'path',
  'touched_by',
  'orphans',
  'stats',
  'reindex',
  'history',
];

export { ACTIONS, DEPENDENCY_TYPES };

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Read a corpus, failing loudly when it is not present.
 *
 * An absent corpus is an error naming the probe, never an empty result set:
 * "no matches" and "this corpus is not here" look identical to a caller and
 * mean opposite things.
 */
export function loadCorpus(corpusName, root) {
  const corpus = resolveCorpus(corpusName);
  const presence = probe(corpus, root);
  if (!presence.present) throw new Error(presence.reason);

  const data = corpus.load(root);

  // The generated corpus already has its file on disk, written by the build.
  // Writing our own copy of it would create the second source of truth the
  // whole arrangement exists to avoid.
  if (!corpus.generated) writeIndex(corpus, root, data);

  return data;
}

function writeIndex(corpus, root, data) {
  const target = path.join(root, corpus.index);
  const payload = {
    version: 1,
    corpus: corpus.name,
    builtAt: new Date().toISOString(),
    nodes: data.nodes,
    edges: data.edges,
    skipped: data.skipped,
    unresolved: data.unresolved,
  };
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch {
    // A read-only tree still answers every query. The cache is a convenience
    // for other consumers, never the read path, so failing to write one must
    // not fail the query that triggered it.
  }
}

// ---------------------------------------------------------------------------
// Resolution and walking — the semantics scripts/graph.js already fixed
// ---------------------------------------------------------------------------

/**
 * Resolve a node id, accepting a bare name when it is unambiguous.
 * Ambiguity is an error, not a guess.
 */
export function resolve(data, ref) {
  if (data.nodes.some((n) => n.id === ref)) return ref;

  const matches = data.nodes.filter(
    (n) => n.name === ref || n.slug === ref || n.id.endsWith(`/${ref}`),
  );
  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1) {
    throw new Error(
      `"${ref}" is ambiguous — it matches ${matches.length} nodes:\n  ` +
        matches.map((m) => m.id).join('\n  '),
    );
  }
  throw new Error(`No node matches "${ref}".`);
}

function adjacency(data, { reverse = false, all = false } = {}) {
  const deps = DEPENDENCY_TYPES[data.corpus];
  const adj = new Map();
  for (const e of data.edges) {
    if (!all && !deps.has(e.type)) continue;
    const [from, to] = reverse ? [e.to, e.from] : [e.from, e.to];
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push({ id: to, type: e.type });
  }
  return adj;
}

/** Breadth-first, with `seen` so a relation cycle terminates instead of hanging. */
function walk(data, startId, { reverse, depth = Infinity }) {
  const adj = adjacency(data, { reverse });
  const seen = new Set([startId]);
  const out = [];
  let frontier = [startId];

  for (let d = 1; d <= depth && frontier.length; d += 1) {
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

// ---------------------------------------------------------------------------
// Globs, for the work-item-to-page join
// ---------------------------------------------------------------------------

/**
 * A `sources` glob to a regex: `**` crosses directory separators, `*` does not.
 *
 * Deliberately small. These globs come from `/add.wiki`'s own `sources` lists,
 * which use the two wildcards and nothing else, and a full glob implementation
 * would be a dependency this server does not take.
 */
export function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === '*') {
      if (glob[i + 1] === '*') {
        out += '.*';
        i += 1;
        if (glob[i + 1] === '/') i += 1;
      } else {
        out += '[^/]*';
      }
    } else if (char === '?') {
      out += '[^/]';
    } else {
      out += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`);
}

const normalise = (p) => String(p).replace(/\\/g, '/').replace(/^\.\//, '');

// ---------------------------------------------------------------------------
// The actions
// ---------------------------------------------------------------------------

function scoreNode(node, terms) {
  const haystacks = [
    [node.id, 8],
    [node.slug ?? '', 6],
    [node.name ?? '', 6],
    [(node.tags ?? []).join(' '), 5],
    [node.area ?? '', 4],
    [node.summary ?? '', 3],
    [node.tldr ?? '', 2],
    [(node.observations ?? []).map((o) => o.text).join(' '), 1],
  ];
  let score = 0;
  for (const term of terms) {
    const needle = term.toLowerCase();
    for (const [text, weight] of haystacks) {
      if (String(text).toLowerCase().includes(needle)) score += weight;
    }
  }
  return score;
}

/** A search hit — every field a consumer needs to reject it without a follow-up. */
function toHit(data, node) {
  return {
    id: node.id,
    kind: node.kind,
    status: node.status ?? null,
    title: node.slug ?? node.name ?? node.id,
    summary: node.summary ?? '',
    path: node.path ?? null,
    tags: node.tags ?? [],
    area: node.area ?? null,
    relations: data.edges
      .filter((e) => e.from === node.id)
      .map((e) => ({ type: e.type, to: e.to, why: e.why ?? null })),
    attachments: node.attachments ?? [],
  };
}

export const actions = {
  /**
   * Keyword search over ids, slugs, tags, area, TL;DR and observations.
   *
   * Every hit carries its `status`, in-flight included. Two work items in
   * flight that touch the same area are exactly the pair that most needs to see
   * each other; filtering is the consumer's choice against a returned field,
   * never a silent exclusion made here.
   */
  search(data, { terms = '', limit = 10, kind = null, status = null, tag = null } = {}) {
    const words = String(terms).split(/\s+/).filter(Boolean);
    let candidates = data.nodes;
    if (kind) candidates = candidates.filter((n) => n.kind === kind);
    if (status) candidates = candidates.filter((n) => n.status === status);
    if (tag) candidates = candidates.filter((n) => (n.tags ?? []).includes(tag));

    const scored = words.length
      ? candidates
          .map((n) => ({ node: n, score: scoreNode(n, words) }))
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id))
      : candidates.map((n) => ({ node: n, score: 0 })).sort((a, b) => a.node.id.localeCompare(b.node.id));

    return {
      total: scored.length,
      hits: scored.slice(0, limit).map((s) => toHit(data, s.node)),
    };
  },

  /**
   * One node in full, because `search` returns only the first sentence.
   *
   * Without this there is no way to ask for the rest of a TL;DR short of
   * opening the file by path, which is what the index exists to avoid.
   */
  get(data, { id, node: nodeRef, sections = null } = {}) {
    const resolved = resolve(data, id ?? nodeRef);
    const node = data.nodes.find((n) => n.id === resolved);
    const full = {
      ...toHit(data, node),
      tldr: node.tldr ?? '',
      observations: node.observations ?? [],
      files: node.files ?? [],
      sources: node.sources ?? [],
      inbound: data.edges
        .filter((e) => e.to === node.id)
        .map((e) => ({ type: e.type, from: e.from, why: e.why ?? null })),
    };
    if (!sections) return full;
    return Object.fromEntries(
      Object.entries(full).filter(([key]) => key === 'id' || sections.includes(key)),
    );
  },

  /** What breaks if this changes — dependants, transitively. */
  impact(data, { id, node, depth } = {}) {
    const resolved = resolve(data, id ?? node);
    return { node: resolved, dependents: walk(data, resolved, { reverse: true, depth }) };
  },

  /** What this needs, transitively. The inverse of impact. */
  dependencies(data, { id, node, depth } = {}) {
    const resolved = resolve(data, id ?? node);
    return { node: resolved, dependsOn: walk(data, resolved, { reverse: false, depth }) };
  },

  /** One hop either way, direction-blind and including the weak edge kind. */
  neighbors(data, { id, node } = {}) {
    const resolved = resolve(data, id ?? node);
    return {
      node: resolved,
      in: data.edges.filter((e) => e.to === resolved),
      out: data.edges.filter((e) => e.from === resolved),
    };
  },

  /** Shortest dependency chain between two nodes, or null when none exists. */
  path(data, { from, to } = {}) {
    const start = resolve(data, from);
    const end = resolve(data, to);
    if (start === end) return { path: [start] };

    const adj = adjacency(data);
    const prev = new Map([[start, null]]);
    let frontier = [start];

    while (frontier.length) {
      const next = [];
      for (const id of frontier) {
        for (const edge of adj.get(id) || []) {
          if (prev.has(edge.id)) continue;
          prev.set(edge.id, id);
          if (edge.id === end) {
            const chain = [end];
            for (let at = id; at !== null; at = prev.get(at)) chain.unshift(at);
            return { path: chain };
          }
          next.push(edge.id);
        }
      }
      frontier = next;
    }
    return { path: null };
  },

  /**
   * The only action spanning both node kinds.
   *
   * For one file list it returns the work items that changed those files and
   * the reference pages whose `sources` globs cover them. It is what joins
   * "what was already built here" to "what this module is".
   *
   * Deliberately NOT called `impact`: in `scripts/graph.js` that name means
   * transitive dependants, and reusing it for file overlap is how two consumers
   * come to disagree about one answer.
   */
  touched_by(data, { files = [] } = {}) {
    const wanted = (Array.isArray(files) ? files : [files]).map(normalise);
    const workItems = [];
    const pages = [];

    for (const node of data.nodes) {
      const owned = (node.files ?? []).map(normalise);
      const hits = wanted.filter((f) => owned.some((o) => o === f || f.endsWith(`/${o}`) || o.endsWith(`/${f}`)));
      if (hits.length) {
        workItems.push({ id: node.id, kind: node.kind, summary: node.summary, matched: hits });
        continue;
      }
      const globs = (node.sources ?? []).map((g) => [g, globToRegExp(normalise(g))]);
      const covered = wanted.filter((f) => globs.some(([, re]) => re.test(f)));
      if (covered.length) {
        pages.push({
          id: node.id,
          kind: node.kind,
          area: node.area,
          summary: node.summary,
          matched: covered,
        });
      }
    }

    return { files: wanted, workItems, pages };
  },

  /**
   * The migration's work queue.
   *
   * The two corpora ask genuinely different questions here and the rule is per
   * corpus, not shared. In the artefact graph an orphan is something nothing
   * depends on. In the docs graph it is a node the format has not reached yet:
   * no relation, or no TL;DR to reject it by. Forcing one rule on both would
   * answer the wrong question in one of them.
   */
  orphans(data, { kind = null } = {}) {
    const nodes = kind ? data.nodes.filter((n) => n.kind === kind) : data.nodes;

    if (data.corpus === 'artefacts') {
      const deps = DEPENDENCY_TYPES.artefacts;
      const depended = new Set(data.edges.filter((e) => deps.has(e.type)).map((e) => e.to));
      return {
        orphans: nodes.filter(
          (n) => !ENTRY_POINT_KINDS.artefacts.has(n.kind) && !depended.has(n.id),
        ),
      };
    }

    const related = new Set(data.edges.flatMap((e) => [e.from, e.to]));
    const out = [];
    for (const node of nodes) {
      const reasons = [];
      if (!related.has(node.id)) reasons.push('no relation');
      if (!String(node.tldr ?? '').trim()) reasons.push('no TL;DR');
      if (reasons.length) out.push({ id: node.id, kind: node.kind, path: node.path, reasons });
    }
    return { orphans: out };
  },

  /** Index health: counts per kind, per edge type, the hubs, and what was skipped. */
  stats(data) {
    const byKind = {};
    const byEdge = {};
    const byLayer = {};
    for (const n of data.nodes) {
      byKind[n.kind] = (byKind[n.kind] || 0) + 1;
      if (n.layer) byLayer[n.layer] = (byLayer[n.layer] || 0) + 1;
    }
    for (const e of data.edges) byEdge[e.type] = (byEdge[e.type] || 0) + 1;

    const deps = DEPENDENCY_TYPES[data.corpus];
    const inbound = {};
    for (const e of data.edges) {
      if (deps.has(e.type)) inbound[e.to] = (inbound[e.to] || 0) + 1;
    }
    const hubs = Object.entries(inbound)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, dependents: count }));

    return {
      corpus: data.corpus,
      nodes: data.nodes.length,
      edges: data.edges.length,
      byKind,
      byEdge,
      byLayer,
      hubs,
      skipped: data.skipped.length,
      unresolved: data.unresolved,
    };
  },

  /**
   * When this arrived, and what it replaced — the time axis.
   *
   * THE READ IS DELEGATED, NEVER REIMPLEMENTED. `delivered.sh read` owns
   * last-line-wins, corrupt-line tolerance and status ordering. Parsing the
   * JSONL here would be a SECOND implementation of one format, which is the
   * failure `scripts/graph.js` records at this exact function.
   *
   * This verb owns the JOIN and nothing else:
   *   index -> what existed, when it arrived, what it replaced   (time)
   *   graph -> what depends on it today                          (structure)
   *
   * It NEVER writes, and an unavailable index is REPORTED rather than thrown:
   * the same function runs inside the long-lived server, where a throw kills
   * every later query rather than the one that failed.
   */
  history(data, { id, node: nodeRef, limit = 50, layer = null } = {}, context = {}) {
    const node = resolve(data, id ?? nodeRef);
    const name = node.slice(node.lastIndexOf('/') + 1);
    const corpus = CORPORA[data.corpus];
    const root = context.root ?? process.cwd();

    const unavailable = (reason, detail) => ({
      node, name, entries: [], matched: 0, unavailable: { reason, detail },
    });

    const script = context.script ?? path.join(root, corpus.deliveredScript);
    const bash = context.bash ?? 'bash';
    if (!fs.existsSync(script)) {
      return unavailable('script-missing', `${script} does not exist`);
    }

    // `--layer` is passed STRAIGHT THROUGH, never reimplemented as a filter
    // here: it narrows which entries are read at all.
    const args = [script, 'read', name, '--limit', String(limit)];
    if (layer) args.push('--layer', layer);

    // `bash <path>`, never direct execution. Windows is this repository's
    // primary platform and a shebang file is not executable by process
    // creation there.
    const res = spawnSync(bash, args, { cwd: root, encoding: 'utf8', windowsHide: true });

    if (res.error) {
      // ENOENT means the interpreter OR the working directory was not found,
      // and the two read identically. Naming the cwd separates them.
      const reason = res.error.code === 'ENOENT' ? 'bash-missing' : 'spawn-failed';
      return unavailable(reason, `${res.error.message} (bash=${bash}, cwd=${root})`);
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
        // One unparseable line is skipped, never fatal.
        try { entries.push(JSON.parse(l)); } catch { /* skipped */ }
      } else {
        const eq = l.indexOf('=');
        if (eq > 0) keys[l.slice(0, eq)] = l.slice(eq + 1);
      }
    }

    const dependentsOf = (nodeId) => {
      try { return walk(data, nodeId, { reverse: true, depth: 1 }).length; } catch { return null; }
    };

    // `node` is read at BOTH levels and the entry level is the one that
    // matters: the schema puts `node` on the record, and delivered.sh
    // normalises an item-level one away on write. The item level is read
    // anyway because `read` returns whatever a line carries and a human may
    // hand-write one.
    const carriesNode = (e) =>
      e.node === node || (Array.isArray(e.items) && e.items.some((it) => it && it.node === node));

    // Ordering is delivered.sh's contract (live -> changed -> superseded ->
    // gone) and is preserved exactly. Re-sorting here would be a consumer
    // re-ranking one shared structure.
    const matched = entries.filter(carriesNode).map((e) => {
      const out = {
        ...e,
        items: (Array.isArray(e.items) ? e.items : []).map((it) => (it && it.node
          // Enriched only where the record already carries a node. An item
          // without one is returned untouched, never with a fabricated id.
          ? { ...it, dependents: dependentsOf(it.node) }
          : it)),
      };
      if (e.node) out.dependents = dependentsOf(e.node);
      return out;
    });

    // The return shape is `scripts/graph.js`'s, field for field. Two surfaces
    // answering one question must be swappable by a caller, and a renamed key
    // is a divergence a type checker would not catch here.
    return { node, name, entries: matched, matched: matched.length, keys, unavailable: null };
  },

  /**
   * Rebuild the cache from the markdown and report what changed.
   *
   * A no-op on the generated corpus, which `node scripts/build.js` owns. Saying
   * so is the answer; silently rebuilding a file the build owns would give this
   * repository two writers for one sidecar.
   */
  reindex(data, _args, context = {}) {
    const corpus = CORPORA[data.corpus];
    if (corpus.generated) {
      return {
        corpus: data.corpus,
        rebuilt: false,
        reason: `${corpus.index} is written by \`node scripts/build.js\`, which owns it`,
      };
    }
    writeIndex(corpus, context.root ?? process.cwd(), data);
    return {
      corpus: data.corpus,
      rebuilt: true,
      index: corpus.index,
      nodes: data.nodes.length,
      edges: data.edges.length,
      skipped: data.skipped.length,
      unresolved: data.unresolved.length,
    };
  },
};

/**
 * Run one action against one corpus, re-reading before answering.
 *
 * @param {string} name    one of ACTIONS
 * @param {object} args    that action's arguments
 * @param {{corpus: string, root: string}} context
 */
export function run(name, args = {}, context = {}) {
  if (!ACTIONS.includes(name)) {
    throw new Error(`Unknown action "${name}". Available: ${ACTIONS.join(', ')}.`);
  }
  const root = context.root ?? process.cwd();
  const data = loadCorpus(context.corpus ?? 'docs', root);
  return actions[name](data, args, { root });
}
