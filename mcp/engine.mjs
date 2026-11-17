/**
 * engine.mjs — the index builder and the query actions, over the corpus registry.
 *
 * Most of them carry the same meaning on both corpora, which is what makes one
 * server over two parsers worth doing. `search`, `touched_by` and `reindex` are
 * new to the docs corpus and answer trivially on the artefact one.
 *
 * `history` is the eleventh and is here because the server this replaces exposed
 * it. The design's verb table lists ten and omits it; retiring that server
 * without it would have taken a working capability away.
 *
 * `impact`, `dependencies` and `neighbors` are one walk behind two parameters.
 * They stay three actions because the server this replaces exposed them that
 * way and the parity level asserts both surfaces answer identically.
 * Collapsing them here would diverge the two surfaces for no gain.
 *
 * THE MARKDOWN IS THE TRUTH AND THE INDEX IS A CACHE. A docs query re-scans
 * before answering, for the same reason the retired server re-read its sidecar
 * per call: a server started before a write would otherwise answer from
 * a stale graph for the rest of the session, which is the failure this whole
 * change exists to prevent. The cache is written as a by-product so other
 * consumers have a file to read; nothing here reads it back.
 *
 * No network, no model, no native dependency.
 */

import fs from 'node:fs';
import path from 'node:path';
// The delivery reader is a shipped `.cjs` and this module is ESM. It is LOADED
// through `createRequire`, never spawned: no shell, no interpreter lookup, and
// the same call reaches the reader on Windows, macOS and Linux alike.
import { createRequire } from 'node:module';
import { CORPORA, resolveCorpus, probe } from './corpora.mjs';
import * as rank from './rank.mjs';

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
  artefacts: new Set(['USES_SKILL', 'DISPATCHES', 'HANDS_OFF_TO', 'RUNS_SCRIPT', 'INJECTS_INTO', 'CONTAINS']),
  docs: new Set(['caused_by', 'depends_on', 'part_of']),
};

/**
 * The same map with `CONTAINS` removed, and `orphans()` reads THIS one.
 *
 * ⛔ DO NOT collapse the two. A feature or a plugin contains every file in its
 * directory, so counting CONTAINS as a dependency here would give each of those
 * files a permanent inbound edge — and NOTHING under `fragments/` or
 * `plugins/` could ever be reported as an orphan again. Dead weight would
 * become invisible by directory placement alone, which is the one failure
 * `orphans` exists to prevent.
 *
 * `CONTAINS` stays in DEPENDENCY_TYPES above because `dependencies` on a
 * feature node SHOULD list its members. The two sets differ because the two
 * questions differ.
 *
 * ⛔ SECOND COPY of ORPHAN_DEPENDENCY_TYPES in `scripts/graph.js`. Neither can
 * import the other — `mcp/` takes no dependency at all — so only
 * `cli/tests/mcp-engine.test.js` holds them equal.
 */
const ORPHAN_DEPENDENCY_TYPES = {
  artefacts: new Set([...DEPENDENCY_TYPES.artefacts].filter((t) => t !== 'CONTAINS')),
  docs: new Set(DEPENDENCY_TYPES.docs),
};

/**
 * Kinds nothing is expected to depend on, so absence of dependants is normal.
 *
 * ⛔ THE `artefacts` SET IS THE SECOND COPY of ENTRY_POINT_KINDS in
 * `scripts/graph.js`. It is duplicated rather than imported because `mcp/`
 * takes NO dependency at all — it runs from the repository root, where the
 * CLI's `node_modules` is off the resolution path — so neither copy can read
 * the other. `cli/tests/mcp-engine.test.js` is the only thing holding them
 * equal. Change one and change the other in the same delivery, or the two
 * surfaces answer `orphans` differently and nothing says so out loud.
 *
 * A user enables a feature or a plugin and nothing declares one, so they are
 * entry points the same way commands and fragments are. `template` is
 * deliberately absent: nothing names the four shipped templates, and their
 * showing up as orphans IS the finding.
 */
const ENTRY_POINT_KINDS = {
  artefacts: new Set(['command', 'fragment', 'feature', 'plugin']),
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

export { ACTIONS, DEPENDENCY_TYPES, ORPHAN_DEPENDENCY_TYPES, ENTRY_POINT_KINDS };

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
 * Deliberately small. These globs come from `/add-wiki`'s own `sources` lists,
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
// The delivery reader — loaded, never spawned
// ---------------------------------------------------------------------------

/**
 * Load CommonJS from an absolute path. `mcp/` is ESM and takes no dependency,
 * and the shipped reader is `.cjs`, so `createRequire` is the only ESM-native
 * way to reach it. This is a MODULE LOAD: no process is created, so a reader
 * that exists is reached even where no shell or interpreter is on PATH.
 */
const loadCjs = createRequire(import.meta.url);

/**
 * Where the reader lives, per corpus, installed first.
 *
 * The same source ships two ways: a user's project has `.codeadd/scripts/`,
 * while this repository keeps the shipped tree under `framwork/.codeadd/`.
 * Both are listed so a repository root AND an installed root resolve the
 * reader, and neither depends on a path absent from the npm/release output.
 */
function readerCandidates(corpus, root, override) {
  if (override) return [path.isAbsolute(override) ? override : path.join(root, override)];
  return corpus.delivered.map((rel) => path.join(root, rel));
}

/** The first candidate that exists, plus the path to name when none does. */
function resolveReader(corpus, root, override) {
  const candidates = readerCandidates(corpus, root, override);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { path: candidate, expected: candidate };
  }
  return { path: null, expected: candidates[0] };
}

/**
 * A native override selects the module itself: a core's exports or an entry's
 * exported `core`. This matches scripts/graph.js and honors alternate readers
 * without spawning a shell or silently falling back to a different module.
 */
function loadDeliveryCore(readerPath) {
  const loaded = loadCjs(readerPath);
  const core = loaded?.core ?? loaded;
  for (const method of ['resolveRoot', 'createContext', 'performRead', 'performHistoryRead', 'performTouched']) {
    if (typeof core?.[method] !== 'function') throw new Error(`Native delivery reader lacks ${method}`);
  }
  return core;
}

/**
 * A context rooted where git says the repository is, or a reported error.
 *
 * The reader entry resolves the repository root before every operation, so a
 * caller handed a non-repository gets its `ERROR=not-a-git-repository`, never a
 * silent empty answer — an empty index and a missing one mean opposite things.
 */
function readerContext(core, root) {
  try {
    const resolved = core.resolveRoot(root);
    if (!resolved.ok) return { ok: false, detail: `ERROR=${resolved.error}` };
    return { ok: true, ctx: core.createContext({ root: resolved.root }) };
  } catch (error) {
    return { ok: false, detail: error.message };
  }
}

/**
 * The two read arguments the reader entry validated at its argv boundary.
 * Calling the core directly would skip that validation, so it is repeated
 * here: an invalid layer or limit is a `read-failed`, never a silent change.
 */
function readArgsError(layer, limit) {
  if (layer && layer !== 'product' && layer !== 'internal') {
    return 'read refused: --layer must be product or internal';
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    return 'read refused: --limit must be a positive whole number';
  }
  return null;
}

// ---------------------------------------------------------------------------
// The actions
// ---------------------------------------------------------------------------

// Today's field weights, kept as BM25 field weights.
const SEARCH_WEIGHTS = { id: 8, slug: 6, name: 6, tags: 5, area: 4, summary: 3, tldr: 2, observations: 1 };

function searchFields(node) {
  return {
    id: node.id,
    slug: node.slug ?? '',
    name: node.name ?? '',
    tags: (node.tags ?? []).join(' '),
    area: node.area ?? '',
    summary: node.summary ?? '',
    tldr: node.tldr ?? '',
    observations: (node.observations ?? []).map((o) => o.text).join(' '),
  };
}

/**
 * A lean search hit: enough to pick a candidate, nothing to read twice. The
 * relations, tags, area and attachments live in `get`.
 */
function toHit(node, score, snippet) {
  const hit = {
    id: node.id,
    kind: node.kind,
    status: node.status ?? null,
    title: node.slug ?? node.name ?? node.id,
  };
  if (score !== null) hit.score = Math.round(score * 1000) / 1000;
  hit.snippet = snippet;
  hit.path = node.path ?? null;
  return hit;
}

/** The fat node, for `get`: every field `search` no longer carries. */
function toDetail(data, node) {
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

// `get` is bounded like a search is. A node past it drops observations, then
// files, then inbound from the tail — inbound last, because a hub page can have
// many inbound edges but they are the relations the caller came to `get` for —
// and `truncated` says how many of each went.
const GET_BUDGET_TOKENS = 4000;
const GET_DROP_ORDER = ['observations', 'files', 'inbound'];

function boundGet(full) {
  const budget = GET_BUDGET_TOKENS * rank.CHARS_PER_TOKEN;
  const truncated = {};
  for (const field of GET_DROP_ORDER) {
    while (Array.isArray(full[field]) && full[field].length > 0 && JSON.stringify(full).length > budget) {
      full[field].pop();
      truncated[field] = (truncated[field] ?? 0) + 1;
    }
  }
  if (Object.keys(truncated).length) full.truncated = truncated;
  return full;
}

export const actions = {
  /**
   * Ranked keyword search: whole words or word prefixes, pt+en stopwords dropped,
   * BM25 over weighted fields (mcp/rank.mjs — the twin of the delivery reader's),
   * one hit per supersession chain, a relevance cut and a ~2,000-token budget that
   * drops whole hits. The answer says how many matched, how many came back and
   * why it stopped; `offset` pages on.
   *
   * Every hit carries its `status`, in-flight included. Two work items in
   * flight that touch the same area are exactly the pair that most needs to see
   * each other; filtering is the consumer's choice against a returned field,
   * never a silent exclusion made here.
   *
   * Empty `terms` enumerates: sorted by id, no score, no relevance cut — the
   * budget still applies. Terms that are ALL dropped match nothing (`no-terms`).
   */
  search(data, { terms = '', limit = rank.DEFAULT_LIMIT, offset = 0, kind = null, status = null, tag = null } = {}) {
    let candidates = data.nodes;
    if (kind) candidates = candidates.filter((n) => n.kind === kind);
    if (status) candidates = candidates.filter((n) => n.status === status);
    if (tag) candidates = candidates.filter((n) => (n.tags ?? []).includes(tag));

    const query = String(terms ?? '').trim();
    const reserve = 200;
    const empty = (stop) => ({ matched: 0, collapsed: 0, returned: 0, offset: Math.max(0, Math.trunc(offset) || 0), next_offset: null, stop, hits: [] });

    if (!query) {
      const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
      const rows = sorted.map((n) => ({ id: n.id, score: 1, hit: toHit(n, null, rank.snippet(n.summary ?? '', []))}));
      const page = rank.cut(rows, { limit, offset, relevance: false, serialize: (r) => JSON.stringify(r.hit), reserve });
      return {
        matched: rows.length,
        collapsed: 0,
        returned: page.rows.length,
        offset: Math.max(0, Math.trunc(offset) || 0),
        next_offset: page.nextOffset,
        stop: page.stop,
        hits: page.rows.map((r) => r.hit),
      };
    }

    const ranked = rank.rank(
      candidates.map((n) => ({ id: n.id, fields: searchFields(n), node: n })),
      query,
      { weights: SEARCH_WEIGHTS, compare: (a, b) => a.id.localeCompare(b.id) },
    );
    if (ranked.stop === 'no-terms') return empty('no-terms');

    const supersededBy = new Map();
    for (const e of data.edges) if (e.type === 'superseded_by') supersededBy.set(e.from, e.to);

    const rows = ranked.rows.map((r) => ({ id: r.doc.id, score: r.score, node: r.doc.node, snippet: r.snippet }));
    const collapsed = rank.collapseChains(rows, supersededBy);
    const emit = (r) => {
      const hit = toHit(r.node, r.score, r.snippet);
      if (r.superseded_by) hit.superseded_by = r.superseded_by;
      if (r.replaces) hit.replaces = r.replaces;
      return hit;
    };
    const page = rank.cut(collapsed, { limit, offset, serialize: (r) => JSON.stringify(emit(r)), reserve });
    return {
      matched: collapsed.length,
      collapsed: rows.length - collapsed.length,
      returned: page.rows.length,
      offset: Math.max(0, Math.trunc(offset) || 0),
      next_offset: page.nextOffset,
      stop: page.stop,
      hits: page.rows.map(emit),
    };
  },

  /**
   * One node in full, because `search` returns only a score and a snippet.
   *
   * Without this there is no way to ask for the rest of a TL;DR short of
   * opening the file by path, which is what the index exists to avoid.
   */
  get(data, { id, node: nodeRef, sections = null } = {}) {
    const resolved = resolve(data, id ?? nodeRef);
    const node = data.nodes.find((n) => n.id === resolved);
    const full = {
      ...toDetail(data, node),
      tldr: node.tldr ?? '',
      observations: node.observations ?? [],
      files: node.files ?? [],
      sources: node.sources ?? [],
      inbound: data.edges
        .filter((e) => e.to === node.id)
        .map((e) => ({ type: e.type, from: e.from, why: e.why ?? null })),
    };
    if (!sections) return boundGet(full);
    return boundGet(Object.fromEntries(
      Object.entries(full).filter(([key]) => key === 'id' || sections.includes(key)),
    ));
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
   * Which deliveries and which reference pages cover these paths.
   *
   * Deliberately NOT called `impact`: in `scripts/graph.js` that name means
   * transitive dependants, and reusing it for file overlap is how two consumers
   * come to disagree about one answer.
   *
   * TWO CORPORA ASK DIFFERENT QUESTIONS HERE, and only one of them delegates.
   *
   * On `artefacts`, a node's `files` is its own path — "which artefact owns this
   * file" is answered by the sidecar and needs nothing else. That half stays
   * local and is untouched.
   *
   * On `docs`, the question is "which DELIVERY changed this file", which lives
   * in the index and not in any document. It is DELEGATED, NEVER REIMPLEMENTED
   * — the same rule the `history` action states below, for the same reason:
   * the shipped delivery reader owns the index, and a second reader of one
   * index is what the read contract's no-re-ranking rule exists to prevent. It
   * derives each delivery's commit and answers in two labelled layers, passed
   * through here untouched.
   *
   * The PAGE half is local in both. A reference page declares `sources` globs in
   * its own frontmatter, so the corpus already holds that answer.
   */
  touched_by(data, { files = [] } = {}, context = {}) {
    const wanted = (Array.isArray(files) ? files : [files]).map(normalise);
    const pages = [];

    for (const node of data.nodes) {
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

    // The artefacts corpus answers locally: `files` is the node's own path.
    if ((data.corpus ?? 'docs') !== 'docs') {
      const workItems = [];
      for (const node of data.nodes) {
        const owned = (node.files ?? []).map(normalise);
        const hits = wanted.filter((f) => owned.some((o) => o === f || f.endsWith(`/${o}`) || o.endsWith(`/${f}`)));
        if (hits.length) workItems.push({ id: node.id, kind: node.kind, summary: node.summary, matched: hits });
      }
      return { files: wanted, workItems, pages };
    }

    const root = context.root ?? process.cwd();
    const corpus = resolveCorpus(data.corpus ?? 'docs');

    // An unavailable reader is reported, never thrown: the page half already
    // has an answer and withholding it because the other half could not run
    // would be the less useful of the two failures.
    const degraded = (reason, detail) => ({
      files: wanted, workItems: [], pages, unavailable: { reason, detail },
    });

    if (!wanted.length) return { files: wanted, workItems: [], pages, curatedOnly: 0 };

    const found = resolveReader(corpus, root, context.script);
    if (!found.path) return degraded('script-missing', `${found.expected} does not exist`);

    let core;
    try {
      core = loadDeliveryCore(found.path);
    } catch (e) {
      return degraded('read-failed', e.message);
    }

    const bound = readerContext(core, root);
    if (!bound.ok) return degraded('read-failed', bound.detail);

    let result;
    try {
      result = core.performTouched(bound.ctx, { paths: wanted });
    } catch (e) {
      return degraded('read-failed', e.message);
    }

    // The shape the shell's JSONL contract produced, field for field. Two
    // surfaces over one reader must be swappable by a caller.
    const workItems = [...result.complete, ...result.curated].map((e) => ({
      id: e.id,
      kind: 'delivery',
      answer: e.answer,
      status: e.status,
      commit: e.commit ?? null,
      summary: e.name,
      matched: e.matched,
    }));

    return {
      files: wanted,
      workItems,
      pages,
      curatedOnly: result.curatedOnly,
    };
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
      const deps = ORPHAN_DEPENDENCY_TYPES.artefacts;
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
   * THE READ IS DELEGATED, NEVER REIMPLEMENTED. The shipped delivery reader
   * owns last-line-wins, corrupt-line tolerance and status ordering. Parsing
   * the JSONL here would be a SECOND implementation of one format, which is the
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

    const found = resolveReader(corpus, root, context.script);
    if (!found.path) return unavailable('script-missing', `${found.expected} does not exist`);

    let core;
    try {
      core = loadDeliveryCore(found.path);
    } catch (e) {
      return unavailable('read-failed', e.message);
    }

    // `--layer` and `--limit` reached the shell's argv boundary, which validated
    // them before the read. Calling the core directly skips that boundary, so
    // its checks are repeated rather than silently relaxed.
    const invalid = readArgsError(layer, limit);
    if (invalid) return unavailable('read-failed', invalid);

    const bound = readerContext(core, root);
    if (!bound.ok) return unavailable('read-failed', bound.detail);

    // `--layer` is passed STRAIGHT THROUGH, never reimplemented as a filter
    // here: it narrows which entries are read at all.
    let read;
    try {
      read = core.performHistoryRead(bound.ctx, { node, layer: layer || '', limit });
    } catch (e) {
      return unavailable('read-failed', e.message);
    }

    // The counts the shell printed as KEY=VALUE, rebuilt from the same result.
    // `scripts/graph.js` renders the dead-cap note from MATCHED_DEAD vs
    // RETURNED_DEAD, so both must reach the caller unchanged.
    const keys = {
      MATCHED_LIVE: String(read.matchedLive),
      MATCHED_DEAD: String(read.matchedDead),
      RETURNED_LIVE: String(read.returnedLive),
      RETURNED_DEAD: String(read.returnedDead),
      LIVE_CAP: String(read.liveCap),
      DEAD_CAP: String(read.deadCap),
      SKIPPED_LINES: read.skipped.join(','),
    };

    const dependentsOf = (nodeId) => {
      try { return walk(data, nodeId, { reverse: true, depth: 1 }).length; } catch { return null; }
    };

    // `node` is read at BOTH levels and the entry level is the one that
    // matters: the schema puts `node` on the record, and the reader normalises
    // an item-level one away on write. The item level is read anyway because
    // `read` returns whatever a record carries and a human may hand-write one.
    const carriesNode = (e) =>
      e.node === node || (Array.isArray(e.items) && e.items.some((it) => it && it.node === node));

    // Ordering is the reader's contract (live -> changed -> superseded -> gone)
    // and is preserved exactly. Re-sorting here would be a consumer re-ranking
    // one shared structure.
    const matched = read.entries.filter(carriesNode).map((e) => {
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
