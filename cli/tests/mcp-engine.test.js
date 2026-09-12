import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { makeDocsCorpus, makeEmptyTree, removeTree } from './helpers/docs-corpus-fixture.js';
import { CORPORA } from '../../mcp/corpora.mjs';
import { ACTIONS, actions, loadCorpus, run, resolve, globToRegExp } from '../../mcp/engine.mjs';

/**
 * Plan 2026-09-12T104012 — F7, the index builder and the query engine.
 *
 * Validation Matrix levels L2.2, L2.3, L2.4, L2.7 and the usage scenarios the
 * ten actions are actually invoked in. L2.4 is the one that gates F11: SIX
 * verbs must answer identically to `scripts/graph.js` over the artefact corpus,
 * all six and not most, because the old server is deleted on the strength of it.
 *
 * Written RED against a tree with no `mcp/engine.mjs`.
 */

const REPO = path.resolve(import.meta.dirname, '..', '..');
const require = createRequire(import.meta.url);
const G = require(path.join(REPO, 'scripts', 'graph.js'));

let docsTree;
let emptyTree;
let docs;
let artefacts;

beforeAll(() => {
  docsTree = makeDocsCorpus();
  emptyTree = makeEmptyTree();
  docs = loadCorpus('docs', docsTree);
  artefacts = loadCorpus('artefacts', REPO);
});

afterAll(() => {
  removeTree(docsTree);
  removeTree(emptyTree);
});

// ---------------------------------------------------------------------------
// The surface
// ---------------------------------------------------------------------------

describe('F7 — the action surface', () => {
  it('exposes exactly the ten actions the design names', () => {
    expect([...ACTIONS].sort()).toEqual(
      [
        'dependencies',
        'get',
        'impact',
        'neighbors',
        'orphans',
        'path',
        'reindex',
        'search',
        'stats',
        'touched_by',
      ].sort(),
    );
    for (const name of ACTIONS) expect(actions[name]).toBeTypeOf('function');
  });

  it('does NOT diverge the surface between corpora', () => {
    // Decision 5 rests on both corpora answering the same verbs. An action that
    // existed on one only would make the retirement of the old server a
    // narrowing rather than a replacement.
    for (const name of ACTIONS) {
      expect(() => actions[name](docs, {}, { root: docsTree })).not.toThrow(/Unknown action/);
    }
  });

  it('rejects an action nobody defined, naming the ten that exist', () => {
    expect(() => run('summarise', {}, { corpus: 'docs', root: docsTree })).toThrow(/Unknown action/);
  });

  it('L2.5 refuses a corpus that is not present rather than answering empty', () => {
    expect(() => loadCorpus('artefacts', emptyTree)).toThrow(/provider-map\.json/);
    expect(() => loadCorpus('docs', emptyTree)).toThrow(/docs/);
  });
});

// ---------------------------------------------------------------------------
// L2.4 — the parity level that gates F11
// ---------------------------------------------------------------------------

describe('L2.4 — both corpora answer identically to scripts/graph.js', () => {
  const graph = () => G.loadGraph();
  const PROBES = ['product/skill/add-doc-schemas', 'product/command/add.done', 'add-knowledge-discovery'];

  it('impact matches, for every probe and at every depth', () => {
    for (const probe of PROBES) {
      for (const depth of [1, 2, undefined]) {
        const mine = actions.impact(artefacts, { id: probe, depth }).dependents;
        const theirs = G.impact(graph(), probe, { depth });
        expect(mine, `${probe} @ ${depth}`).toEqual(theirs);
      }
    }
  });

  it('dependencies matches, for every probe and at every depth', () => {
    for (const probe of PROBES) {
      for (const depth of [1, 2, undefined]) {
        const mine = actions.dependencies(artefacts, { id: probe, depth }).dependsOn;
        const theirs = G.dependencies(graph(), probe, { depth });
        expect(mine, `${probe} @ ${depth}`).toEqual(theirs);
      }
    }
  });

  it('neighbors matches, edge for edge, MENTIONS included', () => {
    const triples = (edges) => edges.map((e) => `${e.from}->${e.to}:${e.type}`).sort();
    for (const probe of PROBES) {
      const mine = actions.neighbors(artefacts, { id: probe });
      const theirs = G.neighbors(graph(), probe);
      expect(triples(mine.in), `${probe} in`).toEqual(triples(theirs.in));
      expect(triples(mine.out), `${probe} out`).toEqual(triples(theirs.out));
    }
  });

  it('path matches, both when one exists and when none does', () => {
    const pairs = [
      ['product/command/add.done', 'product/skill/add-doc-schemas'],
      ['product/skill/add-doc-schemas', 'product/command/add.done'],
    ];
    for (const [from, to] of pairs) {
      const mine = actions.path(artefacts, { from, to }).path;
      const theirs = G.pathBetween(graph(), from, to);
      expect(mine, `${from} -> ${to}`).toEqual(theirs);
    }
  });

  it('orphans matches, node for node', () => {
    const mine = actions.orphans(artefacts).orphans.map((n) => n.id).sort();
    const theirs = G.orphans(graph()).map((n) => n.id).sort();
    expect(mine).toEqual(theirs);
  });

  it('stats matches on every field graph.js reports', () => {
    const mine = actions.stats(artefacts);
    const theirs = G.stats(graph());
    expect(mine.nodes).toBe(theirs.nodes);
    expect(mine.edges).toBe(theirs.edges);
    expect(mine.byKind).toEqual(theirs.byKind);
    expect(mine.byEdge).toEqual(theirs.byEdge);
    expect(mine.byLayer).toEqual(theirs.byLayer);
    expect(mine.hubs).toEqual(theirs.hubs);
  });

  it('resolves a bare name the same way, and refuses an ambiguous one the same way', () => {
    expect(resolve(artefacts, 'add-doc-schemas')).toBe(G.resolve(G.loadGraph(), 'add-doc-schemas'));
    expect(() => resolve(artefacts, 'no-such-artefact')).toThrow(/No node matches/);
    expect(() => G.resolve(G.loadGraph(), 'no-such-artefact')).toThrow(/No node matches/);
  });
});

// ---------------------------------------------------------------------------
// Usage scenarios — what an agent actually asks the server
// ---------------------------------------------------------------------------

describe('scenario — "what was already built near this"', () => {
  it('L2.2 search returns one hit per *-about, and none for a user file', () => {
    const all = actions.search(docs, { terms: '', limit: 50 });
    expect(all.hits.map((h) => h.id).sort()).toEqual(['0009F', '0042F', '0051H', 'wiki/backend']);
    expect(actions.search(docs, { terms: 'transcript' }).hits).toEqual([]);
    expect(actions.search(docs, { terms: 'critical findings' }).hits).toEqual([]);
  });

  it('L2.7 search returns the first sentence, and get returns the whole section', () => {
    const hit = actions.search(docs, { terms: 'itemised' }).hits[0];
    expect(hit.id).toBe('0042F');
    expect(hit.summary).toBe('A purchase can be split into itemised lines.');
    expect(hit.summary).not.toContain('one row per item');

    const full = actions.get(docs, { id: '0042F' });
    expect(full.tldr).toContain('A purchase can be split into itemised lines.');
    expect(full.tldr).toContain('one row per item');
  });

  it('every hit carries the fields needed to reject it without opening the file', () => {
    const hit = actions.search(docs, { terms: 'refresh' }).hits[0];
    expect(hit).toMatchObject({ id: '0051H', kind: 'work item', status: 'live' });
    expect(hit.tags).toEqual(['auth']);
    expect(hit.path).toContain('0051H-token-refresh/about.md');
    expect(hit.relations.some((r) => r.type === 'caused_by' && r.to === '0042F')).toBe(true);
    expect(hit.attachments.length).toBeGreaterThan(0);
  });

  it('an in-flight work item is visible, and filtering is the consumer choice', () => {
    const inFlight = makeDocsCorpus({
      'docs/features/0077F-draft/about.md': `---
id: 0077F
type: feature-about
status: in_progress
related: []
tags: [auth]
---

## TL;DR
A draft that has not shipped. It touches auth, which is why it must be visible.

## Relations
- depends_on [[0051H]]
`,
    });
    try {
      const data = loadCorpus('docs', inFlight);
      expect(actions.search(data, { terms: 'auth' }).hits.map((h) => h.id)).toContain('0077F');
      const live = actions.search(data, { terms: 'auth', status: 'live' });
      expect(live.hits.map((h) => h.id)).not.toContain('0077F');
    } finally {
      removeTree(inFlight);
    }
  });

  it('search filters by kind and by tag', () => {
    expect(actions.search(docs, { terms: '', kind: 'reference page' }).hits.map((h) => h.id)).toEqual([
      'wiki/backend',
    ]);
    expect(actions.search(docs, { terms: '', tag: 'ledger' }).hits.map((h) => h.id).sort()).toEqual([
      '0009F',
      '0042F',
    ]);
  });

  it('search honours limit while reporting the true total', () => {
    const capped = actions.search(docs, { terms: '', limit: 2 });
    expect(capped.hits).toHaveLength(2);
    expect(capped.total).toBe(4);
  });
});

describe('scenario — "what breaks if I change this"', () => {
  it('impact walks dependants and excludes the untyped edge kind', () => {
    // 0051H -> 0009F exists and is links_to: recovered mechanically, carrying no
    // claim that anything depends on anything. At depth 1 it must not appear.
    expect(actions.impact(docs, { id: '0009F', depth: 1 }).dependents.map((d) => d.id)).toEqual([
      '0042F',
    ]);
    // Transitively it does, by the other route: 0051H caused_by 0042F, and
    // 0042F depends_on 0009F. Two hops of real dependency, not the weak edge.
    const deep = actions.impact(docs, { id: '0009F' }).dependents;
    expect(deep.find((d) => d.id === '0051H')).toMatchObject({ depth: 2, via: 'caused_by' });
  });

  it('dependencies is the inverse, and depth bounds the walk', () => {
    expect(actions.dependencies(docs, { id: '0051H' }).dependsOn.map((d) => d.id)).toEqual(['0042F', '0009F']);
    expect(actions.dependencies(docs, { id: '0051H', depth: 1 }).dependsOn.map((d) => d.id)).toEqual(['0042F']);
  });

  it('neighbors is direction-blind and keeps the weak edges a radius drops', () => {
    const n = actions.neighbors(docs, { id: '0009F' });
    expect(n.in.map((e) => `${e.from}:${e.type}`).sort()).toEqual(['0042F:depends_on', '0051H:links_to']);
    expect(n.out).toEqual([]);
  });

  it('path finds the chain, and reports null rather than throwing when none exists', () => {
    expect(actions.path(docs, { from: '0051H', to: '0009F' }).path).toEqual(['0051H', '0042F', '0009F']);
    expect(actions.path(docs, { from: '0009F', to: '0051H' }).path).toBeNull();
    expect(actions.path(docs, { from: '0009F', to: '0009F' }).path).toEqual(['0009F']);
  });

  it('a relation cycle terminates instead of hanging', () => {
    const cyclic = makeDocsCorpus({
      'docs/features/0001F-a/about.md':
        '---\nid: 0001F\ntype: feature-about\nrelated: []\n---\n\n## TL;DR\nA.\n\n## Relations\n- depends_on [[0002F]]\n',
      'docs/features/0002F-b/about.md':
        '---\nid: 0002F\ntype: feature-about\nrelated: []\n---\n\n## TL;DR\nB.\n\n## Relations\n- depends_on [[0001F]]\n',
    });
    try {
      const data = loadCorpus('docs', cyclic);
      expect(actions.dependencies(data, { id: '0001F' }).dependsOn.map((d) => d.id)).toEqual(['0002F']);
    } finally {
      removeTree(cyclic);
    }
  });

  it('a bad id is a reportable error naming what was asked for', () => {
    expect(() => actions.impact(docs, { id: '0404F' })).toThrow(/No node matches "0404F"/);
  });
});

describe('scenario — "what do these files belong to"', () => {
  it('L2.3 touched_by returns the work items AND the pages covering the same file', () => {
    const result = actions.touched_by(docs, { files: ['src/auth/refresh.ts'] });
    expect(result.workItems.map((w) => w.id)).toEqual(['0051H']);
    expect(result.pages.map((p) => p.id)).toEqual(['wiki/backend']);
  });

  it('L2.3 a glob with ** crosses directories and a * does not', () => {
    expect(globToRegExp('src/api/features/**').test('src/api/features/x/y.ts')).toBe(true);
    expect(globToRegExp('src/auth/*.ts').test('src/auth/session.ts')).toBe(true);
    expect(globToRegExp('src/auth/*.ts').test('src/auth/deep/session.ts')).toBe(false);
  });

  it('a file nothing recorded returns empty on both halves, never an error', () => {
    const result = actions.touched_by(docs, { files: ['src/unknown/module.ts'] });
    expect(result.workItems).toEqual([]);
    expect(result.pages).toEqual([]);
  });

  it('answers for several files at once and says which matched', () => {
    const result = actions.touched_by(docs, {
      files: ['src/auth/refresh.ts', 'src/auth/session.ts', 'README.md'],
    });
    expect(result.workItems[0].matched.sort()).toEqual(['src/auth/refresh.ts', 'src/auth/session.ts']);
  });
});

describe('scenario — "what is the migration still missing"', () => {
  it('orphans reports a node with no relation and one with no TL;DR, with the reason', () => {
    const gappy = makeDocsCorpus({
      'docs/features/0080F-lonely/about.md':
        '---\nid: 0080F\ntype: feature-about\nrelated: []\n---\n\n## TL;DR\nStands alone.\n',
      'docs/features/0081F-empty/about.md':
        '---\nid: 0081F\ntype: feature-about\nrelated: []\n---\n\n## TL;DR\n\n## Relations\n- links_to [[0009F]]\n',
    });
    try {
      const data = loadCorpus('docs', gappy);
      const found = Object.fromEntries(
        actions.orphans(data).orphans.map((o) => [o.id, o.reasons]),
      );
      expect(found['0080F']).toEqual(['no relation']);
      expect(found['0081F']).toEqual(['no TL;DR']);
      expect(found['0042F']).toBeUndefined();
    } finally {
      removeTree(gappy);
    }
  });

  it('an empty TL;DR heading satisfies nothing', () => {
    // Decision 21: the gate's whole point is that the TL;DR is the rejection
    // surface, and a heading with nothing under it rejects nothing.
    const blank = makeDocsCorpus({
      'docs/features/0082F-blank/about.md':
        '---\nid: 0082F\ntype: feature-about\nrelated: []\n---\n\n## TL;DR\n\n## Relations\n- part_of [[0042F]]\n',
    });
    try {
      const data = loadCorpus('docs', blank);
      const ids = actions.orphans(data).orphans.map((o) => o.id);
      expect(ids).toContain('0082F');
    } finally {
      removeTree(blank);
    }
  });

  it('stats reports health, the hubs and every unresolved id', () => {
    const s = actions.stats(docs);
    expect(s.corpus).toBe('docs');
    expect(s.nodes).toBe(4);
    expect(s.byKind).toEqual({ 'work item': 3, 'reference page': 1 });
    expect(s.skipped).toBe(3);
    expect(s.unresolved).toContainEqual({ from: '0051H', to: '0099F' });
    // A changelog's part_of points at the work item it sits with, so it is a
    // self-edge and never inflates a hub count.
    expect(s.hubs.map((h) => h.id).sort()).toEqual(['0009F', '0042F']);
    expect(s.hubs.every((h) => h.dependents === 1)).toBe(true);
  });
});

describe('scenario — the index is a cache and the markdown is the truth', () => {
  it('writes the docs index to the path the registry declares', () => {
    const indexPath = path.join(docsTree, CORPORA.docs.index);
    expect(fs.existsSync(indexPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    expect(written.corpus).toBe('docs');
    expect(written.nodes).toHaveLength(4);
  });

  it('a write between two queries is visible to the second, with no reindex call', () => {
    const live = makeDocsCorpus();
    try {
      expect(run('search', { terms: 'brand new' }, { corpus: 'docs', root: live }).hits).toEqual([]);
      const added = path.join(live, 'docs/features/0090F-new/about.md');
      fs.mkdirSync(path.dirname(added), { recursive: true });
      fs.writeFileSync(
        added,
        '---\nid: 0090F\ntype: feature-about\nrelated: []\n---\n\n## TL;DR\nA brand new feature.\n\n## Relations\n- part_of [[0042F]]\n',
        'utf8',
      );
      const after = run('search', { terms: 'brand new' }, { corpus: 'docs', root: live });
      expect(after.hits.map((h) => h.id)).toEqual(['0090F']);
    } finally {
      removeTree(live);
    }
  });

  it('reindex rebuilds the docs cache and reports the counts', () => {
    const tree = makeDocsCorpus();
    try {
      const result = run('reindex', {}, { corpus: 'docs', root: tree });
      expect(result.rebuilt).toBe(true);
      expect(result.nodes).toBe(4);
      expect(result.unresolved).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(tree, CORPORA.docs.index))).toBe(true);
    } finally {
      removeTree(tree);
    }
  });

  it('reindex refuses the generated corpus rather than becoming its second writer', () => {
    const result = actions.reindex(artefacts, {}, { root: REPO });
    expect(result.rebuilt).toBe(false);
    expect(result.reason).toContain('scripts/build.js');
  });

  it('answers a read-only tree without failing on the cache write', () => {
    const tree = makeDocsCorpus();
    try {
      fs.rmSync(path.join(tree, '.codeadd'), { recursive: true, force: true });
      fs.mkdirSync(path.join(tree, '.codeadd'), { recursive: true });
      fs.writeFileSync(path.join(tree, '.codeadd', 'docs-index.json'), '{}', { mode: 0o444 });
      expect(() => run('stats', {}, { corpus: 'docs', root: tree })).not.toThrow();
    } finally {
      removeTree(tree);
    }
  });

  it('requires no network, no model and no native dependency', () => {
    const source = fs.readFileSync(path.join(REPO, 'mcp', 'engine.mjs'), 'utf8')
      + fs.readFileSync(path.join(REPO, 'mcp', 'corpora.mjs'), 'utf8');
    const imports = [...source.matchAll(/^import .*? from '([^']+)';$/gm)].map((m) => m[1]);
    for (const spec of imports) {
      expect(spec.startsWith('node:') || spec.startsWith('./'), spec).toBe(true);
    }
    expect(source).not.toMatch(/require\('(?!node:)/);
    expect(source).not.toMatch(/\bfetch\(|https?:\/\/[a-z]+\.[a-z]+\/v1/);
  });
});
