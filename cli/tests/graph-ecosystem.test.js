import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Ecosystem map emitter (ticket 0068B, F13).
 *
 * `scripts/graph.js ecosystem` turns the build sidecar into the Cytoscape
 * elements the docs "Ecosystem Map" draws, so the map is generated instead of a
 * hand-written literal that drifted to 29 skills and 17 agents against a
 * shipped 42 and 22. The verb is CLI-only, beside `mermaid`: the MCP's verbs
 * answer questions, and this one renders a file.
 */

const require = createRequire(import.meta.url);
const { toEcosystem, loadGraph, ECOSYSTEM_FILE } = require('../../scripts/graph.js');
const { collectInventory } = require('../../scripts/inventory.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const node = (layer, kind, name, extra = {}) => ({
  id: `${layer}/${kind}/${name}`, kind, layer, name,
  path: extra.path || `framwork/.codeadd/${kind}s/${name}.md`,
  registered: true, providers: [], declares: true,
});
const edge = (from, to, type) => ({ from: from.id, to: to.id, type, origin: 'declared', modifier: null });

const CMD = node('product', 'command', 'add-plan');
const CMD2 = node('product', 'command', 'add-build');
const SK = node('product', 'skill', 'add--doc-schemas');
const SK2 = node('product', 'skill', 'add--deep');
const AG = node('product', 'agent', 'qa-agent');
const PLUGIN_SK = node('product', 'skill', 'add--gitnexus', { path: 'framwork/.codeadd/plugins/gitnexus/skills/add--gitnexus/SKILL.md' });
const INTERNAL = node('internal', 'command', 'add-framework--sync', { path: 'workbench/commands/add-framework--sync.md' });
const SCRIPT = node('product', 'script', 'done.cjs');

const FIXTURE = {
  nodes: [CMD, CMD2, SK, SK2, AG, PLUGIN_SK, INTERNAL, SCRIPT],
  edges: [
    edge(CMD, SK, 'USES_SKILL'),
    edge(AG, SK, 'USES_SKILL'),
    edge(SK, SK2, 'USES_SKILL'),
    edge(CMD, AG, 'DISPATCHES'),
    // dropped: wrong type, wrong pair, or touching a node outside the set
    edge(CMD, CMD2, 'HANDS_OFF_TO'),
    edge(CMD, SK2, 'MENTIONS'),
    edge(CMD, SCRIPT, 'RUNS_SCRIPT'),
    edge(SK, AG, 'DISPATCHES'),
    edge(CMD, PLUGIN_SK, 'USES_SKILL'),
    edge(INTERNAL, SK, 'USES_SKILL'),
  ],
};

describe('toEcosystem', () => {
  it('emits Cytoscape elements: nodes with id, label and type, edges with id, source, target and type', () => {
    const eco = toEcosystem(FIXTURE);
    expect(Object.keys(eco).sort()).toEqual(['edges', 'nodes']);
    const byId = Object.fromEntries(eco.nodes.map((n) => [n.data.id, n.data]));
    expect(byId['add-plan']).toEqual({ id: 'add-plan', label: 'add-plan', type: 'command' });
    expect(byId['add--doc-schemas']).toEqual({ id: 'add--doc-schemas', label: 'doc-schemas', type: 'skill' });
    expect(byId['qa-agent']).toEqual({ id: 'qa-agent', label: 'qa', type: 'agent' });
    for (const e of eco.edges) {
      expect(Object.keys(e.data).sort()).toEqual(['id', 'source', 'target', 'type']);
    }
  });

  it('keeps only the four edge shapes and names them loads, uses and dispatches', () => {
    const edges = toEcosystem(FIXTURE).edges.map((e) => `${e.data.source}>${e.data.target}:${e.data.type}`).sort();
    expect(edges).toEqual([
      'add--doc-schemas>add--deep:uses',
      'add-plan>add--doc-schemas:loads',
      'add-plan>qa-agent:dispatches',
      'qa-agent>add--doc-schemas:uses',
    ].sort());
  });

  it('leaves out internal nodes, plugin-bundled skills and every edge touching them', () => {
    const eco = toEcosystem(FIXTURE);
    const ids = eco.nodes.map((n) => n.data.id);
    expect(ids).not.toContain('add-framework--sync');
    expect(ids).not.toContain('add--gitnexus');
    expect(ids).not.toContain('done.cjs');
    for (const e of eco.edges) {
      expect(ids).toContain(e.data.source);
      expect(ids).toContain(e.data.target);
    }
  });

  it('is deterministic whatever order the graph lists its nodes and edges in', () => {
    const shuffled = { nodes: [...FIXTURE.nodes].reverse(), edges: [...FIXTURE.edges].reverse() };
    expect(toEcosystem(shuffled)).toEqual(toEcosystem(FIXTURE));
  });
});

describe('the checked-in ecosystem map', () => {
  it('is current with the emitted graph', () => {
    expect(fs.existsSync(ECOSYSTEM_FILE), 'run `node scripts/graph.js ecosystem --write`').toBe(true);
    expect(JSON.parse(fs.readFileSync(ECOSYSTEM_FILE, 'utf8'))).toEqual(toEcosystem(loadGraph()));
  });

  it('lists exactly the artefacts the shipped inventory lists, and no internal node', () => {
    const eco = JSON.parse(fs.readFileSync(ECOSYSTEM_FILE, 'utf8'));
    const inv = collectInventory(path.join(ROOT, 'framwork', '.codeadd'));
    const of = (type) => eco.nodes.filter((n) => n.data.type === type).map((n) => n.data.id);
    expect(of('command').sort()).toEqual([...inv.commands].sort());
    expect(of('skill').sort()).toEqual([...inv.skills].sort());
    expect(of('agent').map((id) => id.replace(/-agent$/, '')).sort()).toEqual([...inv.agents].sort());
    expect(JSON.stringify(eco)).not.toContain('add-framework--');
  });
});
