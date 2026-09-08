import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Artefact-graph query engine (plan 0077, wave 3).
 *
 * The graph is only worth emitting if something can answer questions with it.
 * This is that engine: blast radius, dependencies, orphans, shortest path.
 *
 * It is a plain module with a CLI front end rather than an MCP server, because
 * the callers are the framework's own commands running on five different
 * providers. Every one of them can shell out; only some have MCP wired. The MCP
 * server in scripts/artefact-graph-mcp.js is a thin wrapper over this same
 * module, so both surfaces answer identically by construction.
 */

const require = createRequire(import.meta.url);
const {
  impact,
  dependencies,
  neighbors,
  orphans,
  pathBetween,
  stats,
  history,
  loadGraph,
} = require('../../scripts/graph.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 *   cmdA ──uses──> skillX ──uses──> skillY
 *   cmdB ──uses──> skillX
 *   cmdA ──mentions──> skillZ        (NOT a dependency)
 *   skillOrphan                       (nothing points at it)
 */
const G = {
  nodes: [
    { id: 'product/command/cmdA', kind: 'command', layer: 'product', name: 'cmdA', path: 'a.md', registered: true, providers: [], declares: true },
    { id: 'product/command/cmdB', kind: 'command', layer: 'product', name: 'cmdB', path: 'b.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/skillX', kind: 'skill', layer: 'product', name: 'skillX', path: 'x.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/skillY', kind: 'skill', layer: 'product', name: 'skillY', path: 'y.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/skillZ', kind: 'skill', layer: 'product', name: 'skillZ', path: 'z.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/skillOrphan', kind: 'skill', layer: 'product', name: 'skillOrphan', path: 'o.md', registered: true, providers: [], declares: true },
  ],
  edges: [
    { from: 'product/command/cmdA', to: 'product/skill/skillX', type: 'USES_SKILL', origin: 'declared', modifier: null },
    { from: 'product/command/cmdB', to: 'product/skill/skillX', type: 'USES_SKILL', origin: 'declared', modifier: null },
    { from: 'product/skill/skillX', to: 'product/skill/skillY', type: 'USES_SKILL', origin: 'declared', modifier: null },
    { from: 'product/command/cmdA', to: 'product/skill/skillZ', type: 'MENTIONS', origin: 'declared', modifier: null },
  ],
};

describe('impact — what breaks if I change this', () => {
  it('finds direct dependents', () => {
    const ids = impact(G, 'product/skill/skillX').map((r) => r.id);
    expect(ids.sort()).toEqual(['product/command/cmdA', 'product/command/cmdB']);
  });

  it('is TRANSITIVE — the whole point of a graph over a grep', () => {
    // skillY is used by skillX, which is used by both commands. A one-hop
    // answer would report only skillX and understate the blast radius, which is
    // the failure mode this tool exists to prevent.
    const ids = impact(G, 'product/skill/skillY').map((r) => r.id);
    expect(ids.sort()).toEqual([
      'product/command/cmdA',
      'product/command/cmdB',
      'product/skill/skillX',
    ]);
  });

  it('reports the distance to each dependent', () => {
    const byId = new Map(impact(G, 'product/skill/skillY').map((r) => [r.id, r.depth]));
    expect(byId.get('product/skill/skillX')).toBe(1);
    expect(byId.get('product/command/cmdA')).toBe(2);
  });

  it('honours a depth limit', () => {
    const ids = impact(G, 'product/skill/skillY', { depth: 1 }).map((r) => r.id);
    expect(ids).toEqual(['product/skill/skillX']);
  });

  it('does NOT count a MENTIONS edge as impact', () => {
    // The entire reason MENTIONS is a distinct type. cmdA names skillZ only to
    // point away from it; changing skillZ cannot break cmdA, and reporting it
    // would make every blast radius quietly too large.
    expect(impact(G, 'product/skill/skillZ')).toEqual([]);
  });

  it('returns nothing for a node nobody depends on', () => {
    expect(impact(G, 'product/skill/skillOrphan')).toEqual([]);
  });

  it('throws on an unknown node rather than returning an empty result', () => {
    // Silence here reads exactly like "nothing depends on it" — the most
    // dangerous possible answer to give someone about to delete a file.
    expect(() => impact(G, 'product/skill/typo')).toThrow(/typo/);
  });

  it('terminates on a dependency cycle', () => {
    const cyclic = {
      nodes: G.nodes,
      edges: [
        { from: 'product/skill/skillX', to: 'product/skill/skillY', type: 'USES_SKILL', origin: 'declared', modifier: null },
        { from: 'product/skill/skillY', to: 'product/skill/skillX', type: 'USES_SKILL', origin: 'declared', modifier: null },
      ],
    };
    expect(impact(cyclic, 'product/skill/skillX').map((r) => r.id)).toEqual(['product/skill/skillY']);
  });
});

describe('dependencies — what this needs', () => {
  it('walks forward, transitively', () => {
    const ids = dependencies(G, 'product/command/cmdA').map((r) => r.id);
    expect(ids.sort()).toEqual(['product/skill/skillX', 'product/skill/skillY']);
  });

  it('excludes MENTIONS, like impact does', () => {
    expect(dependencies(G, 'product/command/cmdA').map((r) => r.id))
      .not.toContain('product/skill/skillZ');
  });
});

describe('neighbors', () => {
  it('separates inbound from outbound and keeps the edge type', () => {
    const n = neighbors(G, 'product/skill/skillX');
    expect(n.in.map((e) => e.from)).toEqual(['product/command/cmdA', 'product/command/cmdB']);
    expect(n.out.map((e) => e.to)).toEqual(['product/skill/skillY']);
    expect(n.out[0].type).toBe('USES_SKILL');
  });

  it('includes MENTIONS, because a neighbour listing is not a blast radius', () => {
    const n = neighbors(G, 'product/command/cmdA');
    expect(n.out.map((e) => e.to)).toContain('product/skill/skillZ');
  });
});

describe('orphans', () => {
  it('finds artefacts nothing depends on', () => {
    expect(orphans(G).map((n) => n.id)).toContain('product/skill/skillOrphan');
  });

  it('does not count a MENTIONS edge as a dependant', () => {
    // skillZ is named by cmdA but depended on by nobody: still an orphan.
    expect(orphans(G).map((n) => n.id)).toContain('product/skill/skillZ');
  });

  it('does not report entry points as orphans', () => {
    // Commands are invoked by people, not by other artefacts. Reporting all 24
    // as orphans would drown the finding that matters.
    expect(orphans(G).map((n) => n.id)).not.toContain('product/command/cmdA');
  });

  it('does not report fragments as orphans', () => {
    // A fragment is the SOURCE of every INJECTS_INTO edge and never its target,
    // so it is an orphan by construction. All 23 of them showed up in the first
    // real run and buried the reference files and scripts that are the actual
    // finding.
    const withFragment = {
      nodes: [...G.nodes, {
        id: 'product/fragment/fragments/tdd-pipeline/add.build.md', kind: 'fragment',
        layer: 'product', name: 'fragments/tdd-pipeline/add.build.md', path: 'f.md',
        registered: true, providers: [], declares: false,
      }],
      edges: [...G.edges, {
        from: 'product/fragment/fragments/tdd-pipeline/add.build.md',
        to: 'product/command/cmdA', type: 'INJECTS_INTO', origin: 'sidecar', modifier: null,
      }],
    };

    expect(orphans(withFragment).map((n) => n.kind)).not.toContain('fragment');
  });
});

describe('pathBetween', () => {
  it('finds the shortest chain', () => {
    expect(pathBetween(G, 'product/command/cmdA', 'product/skill/skillY'))
      .toEqual(['product/command/cmdA', 'product/skill/skillX', 'product/skill/skillY']);
  });

  it('returns null when no chain exists', () => {
    expect(pathBetween(G, 'product/skill/skillY', 'product/command/cmdA')).toBeNull();
  });
});

describe('the real emitted graph', () => {
  // Loaded lazily. Calling loadGraph() in the describe body errors the WHOLE
  // file at collection when the sidecar is missing, swallowing the "run
  // node scripts/build.js" message the loader exists to give.
  let real;
  beforeAll(() => { real = loadGraph(path.join(ROOT, 'framwork', '.codeadd', 'artefact-graph.json')); });

  it('loads and answers against what the build actually wrote', () => {
    expect(real.nodes.length).toBeGreaterThan(100);
    expect(real.edges.length).toBeGreaterThan(100);
  });

  it('add-doc-schemas is a hub — its blast radius is large and transitive', () => {
    const hit = impact(real, 'product/skill/add-doc-schemas');
    expect(hit.length).toBeGreaterThan(10);
    expect(hit.some((r) => r.depth > 1)).toBe(true);
  });

  it('a catalogue skill declares no dependencies — impact stays discriminating', () => {
    // add-ecosystem is a MAP of the ecosystem: its body is ## Commands,
    // ## Skills, ## Agents, ## Dependency Index. It consumes none of it.
    //
    // Its 81 rows were first generated as real dependency edges, and because
    // eight commands load this skill, every artefact it lists inherited ~83
    // transitive dependants. `impact add-stripe` — a leaf nothing uses —
    // returned 84, one MORE than add-doc-schemas, the actual hub. The headline
    // query had become a constant.
    //
    // If a --sync regeneration turns these rows back into skill:/agent:/
    // command:/script:, that happens again and nothing else would notice.
    const eco = real.edges.filter((e) => e.from === 'product/skill/add-ecosystem');

    expect(eco.length).toBeGreaterThan(50);
    expect(eco.every((e) => e.type === 'MENTIONS'), 'add-ecosystem must catalogue, not depend').toBe(true);
  });

  it('impact --depth 1 tells a leaf from a hub', () => {
    // The property C1 destroyed and the wave-5 consumers grade on. The
    // unbounded closure saturates over a densely cross-referencing command
    // layer, so depth 1 is what carries signal.
    const leaf = impact(real, 'product/skill/add-stripe', { depth: 1 }).length;
    const hub = impact(real, 'product/skill/add-doc-schemas', { depth: 1 }).length;

    expect(leaf).toBe(0);
    expect(hub).toBeGreaterThan(15);
  });

  it('stats agree with the graph they came from', () => {
    const s = stats(real);
    expect(s.nodes).toBe(real.nodes.length);
    expect(s.edges).toBe(real.edges.length);
    expect(Object.values(s.byKind).reduce((a, b) => a + b, 0)).toBe(real.nodes.length);
  });
});

/**
 * history — the time axis, delegated.
 *
 * The levels drive the REAL delivered.sh against a real temporary git repo
 * rather than a stubbed reader. That is the point of the verb: it owns the join
 * and delegates the read, so a test that mocked the read would assert the one
 * thing the design forbids reimplementing here.
 */
describe('history — when this arrived, and what it replaced', () => {
  const DELIVERED_SH = path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'delivered.sh');
  let repo;

  const line = (o) => `${JSON.stringify(o)}\n`;

  beforeAll(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-history-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });

    // The corpus delivered.sh verifies against: `git ls-files --cached --others
    // --exclude-standard`, so files on disk count without a commit.
    fs.writeFileSync(path.join(repo, 'x.md'), 'contains skillX_marker here\n');
    fs.writeFileSync(path.join(repo, 'y.md'), 'contains skillY_marker here\n');
    fs.writeFileSync(path.join(repo, 's.sh'), '# contains script_marker here\n');

    fs.mkdirSync(path.join(repo, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(repo, 'docs', 'delivered.jsonl'),
      // Written gone-first on purpose: if the verb preserved insertion order
      // instead of delivered.sh's status ordering, this file would pass a
      // "live comes first" assertion by accident.
      line({
        v: 1, ts: '2026-01-01T00:00:00Z', id: 'E-gone', layer: 'internal', by: 'done',
        status: 'live', name: 'the old skillX', words: 'skillx old',
        commits: ['aaaaaaa'], origin: 'docs/plans/E-gone.md',
        items: [{ what: 'skillX (old)', at: 'x.md', find: 'skillX_vanished', node: 'product/skill/skillX' }],
      }) +
      line({
        v: 1, ts: '2026-02-01T00:00:00Z', id: 'E-live', layer: 'internal', by: 'done',
        status: 'live', name: 'the current skillX', words: 'skillx current',
        commits: ['bbbbbbb'], origin: 'docs/plans/E-live.md',
        items: [
          { what: 'skillX', at: 'x.md', find: 'skillX_marker', node: 'product/skill/skillX' },
          // No `node`: a top-level script is not a graph node.
          { what: 'a script', at: 's.sh', find: 'script_marker' },
        ],
      }) +
      line({
        v: 1, ts: '2026-03-01T00:00:00Z', id: 'E-prose', layer: 'internal', by: 'done',
        status: 'live', name: 'mentions skillX in prose only', words: 'skillX incidental',
        commits: ['ccccccc'], origin: 'docs/plans/E-prose.md',
        items: [{ what: 'skillY', at: 'y.md', find: 'skillY_marker', node: 'product/skill/skillY' }],
      }),
    );
  });

  const run = (ref, opts = {}) => history(G, ref, { script: DELIVERED_SH, cwd: repo, ...opts });

  it('returns entries for the artefact, live before gone', () => {
    const r = run('product/skill/skillX');

    expect(r.node).toBe('product/skill/skillX');
    expect(r.entries.map((e) => e.id)).toEqual(['E-live', 'E-gone']);
    expect(r.entries[0].status).toBe('live');
    // Stored `live`, verified `gone`: its anchor is absent from the corpus.
    expect(r.entries[1].status).toBe('gone');
  });

  it('filters on the item node, not on the word', () => {
    // E-prose carries "skillX" in `words`, so delivered.sh returns it for the
    // free-text query. It has no item whose node is skillX, so the verb drops
    // it — which is the whole difference between an answer about the ARTEFACT
    // and an answer about the string.
    const r = run('product/skill/skillX');
    expect(r.entries.some((e) => e.id === 'E-prose')).toBe(false);

    const y = run('product/skill/skillY');
    expect(y.entries.map((e) => e.id)).toEqual(['E-prose']);
  });

  it('enriches items that carry a node, and leaves the others alone', () => {
    const live = run('product/skill/skillX').entries.find((e) => e.id === 'E-live');
    const [withNode, withoutNode] = live.items;

    // cmdA and cmdB both use skillX.
    expect(withNode.dependents).toBe(2);
    // Never a fabricated id, and never an invented count.
    expect(withoutNode.node).toBeUndefined();
    expect(withoutNode.dependents).toBeUndefined();
  });

  it('reports a missing delivered.sh instead of throwing', () => {
    const r = run('product/skill/skillX', { script: path.join(repo, 'no-such-script.sh') });

    expect(r.unavailable.reason).toBe('script-missing');
    expect(r.entries).toEqual([]);
  });

  it('reports a missing bash instead of throwing', () => {
    // The case that matters is the long-lived MCP server: a throw there kills
    // every later query, not just this one.
    const r = run('product/skill/skillX', { bash: 'definitely-not-a-real-interpreter-xyz' });

    expect(r.unavailable.reason).toBe('bash-missing');
    expect(r.entries).toEqual([]);
  });

  it('reports an absent index as an empty answer, never an error', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-history-empty-'));
    execFileSync('git', ['init', '-q'], { cwd: empty });

    const r = run('product/skill/skillX', { cwd: empty });

    expect(r.unavailable).toBeNull();
    expect(r.entries).toEqual([]);
  });

  it('passes --layer straight through to delivered.sh', () => {
    // add-framework--plan asks a PRODUCT-layer question. The filter narrows
    // what delivered.sh reads; it is never re-implemented as a filter here.
    expect(run('product/skill/skillX', { layer: 'product' }).entries).toEqual([]);
    expect(run('product/skill/skillX', { layer: 'internal' }).entries.map((e) => e.id))
      .toEqual(['E-live', 'E-gone']);
  });

  it('matches an ENTRY-level node, which is the shape delivered.sh actually writes', () => {
    // The shape delivered.sh actually emits, and the one that matters.
    // The schema puts `node` on the RECORD and defines an item as exactly
    // {what, at, find}, so a node inside an item is normalised away on write —
    // correct behaviour, pinned from the other side in delivered.bats. A reader
    // matching on items ALONE would therefore match nothing any writer ever
    // produced, and the hand-written fixtures above hide that completely
    // because they emit JSONL no writer would.
    const repo2 = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-history-entry-'));
    execFileSync('git', ['init', '-q'], { cwd: repo2 });
    fs.writeFileSync(path.join(repo2, 'x.md'), 'contains skillX_marker here');
    fs.mkdirSync(path.join(repo2, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(repo2, 'docs', 'delivered.jsonl'),
      line({
        v: 1, ts: '2026-04-01T00:00:00Z', id: 'E-entry-node', layer: 'internal', by: 'done',
        status: 'live', name: 'entry-level node', words: 'entry level',
        commits: ['ddddddd'], origin: 'docs/plans/E-entry-node.md',
        node: 'product/skill/skillX',
        // Exactly what serialize() emits: no `node` anywhere in the items.
        items: [{ what: 'skillX', at: 'x.md', find: 'skillX_marker' }],
      }),
    );

    const r = run('product/skill/skillX', { cwd: repo2 });

    expect(r.entries.map((e) => e.id)).toEqual(['E-entry-node']);
    expect(r.entries[0].dependents).toBe(2);
    // The item stays untouched — no node on it means no fabricated one.
    expect(r.entries[0].items[0].dependents).toBeUndefined();
  });

  it('never writes — the index is byte-identical after a read', () => {
    const index = path.join(repo, 'docs', 'delivered.jsonl');
    const before = fs.readFileSync(index);

    run('product/skill/skillX');

    expect(fs.readFileSync(index).equals(before)).toBe(true);
  });
});
