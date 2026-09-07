import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Mermaid emitter (plan 0077, wave 4).
 *
 * Turns the artefact graph into a diagram the docs can render. The whole graph
 * is 202 nodes and 625 edges — rendered at once it is an unreadable hairball,
 * so every emission is SCOPED and the scoping is the design.
 */

const require = createRequire(import.meta.url);
const { toMermaid, loadGraph } = require('../../scripts/graph.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const G = {
  nodes: [
    { id: 'product/command/add.plan', kind: 'command', layer: 'product', name: 'add.plan', path: 'a.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/add-planning', kind: 'skill', layer: 'product', name: 'add-planning', path: 'b.md', registered: true, providers: [], declares: true },
    { id: 'product/agent/plan-reviewer-agent', kind: 'agent', layer: 'product', name: 'plan-reviewer-agent', path: 'c.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/add-deep', kind: 'skill', layer: 'product', name: 'add-deep', path: 'd.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/add-elsewhere', kind: 'skill', layer: 'product', name: 'add-elsewhere', path: 'e.md', registered: true, providers: [], declares: true },
    { id: 'product/skill/add-avoided', kind: 'skill', layer: 'product', name: 'add-avoided', path: 'f.md', registered: true, providers: [], declares: true },
  ],
  edges: [
    { from: 'product/command/add.plan', to: 'product/skill/add-planning', type: 'USES_SKILL', origin: 'declared', modifier: null },
    { from: 'product/command/add.plan', to: 'product/agent/plan-reviewer-agent', type: 'DISPATCHES', origin: 'declared', modifier: null },
    { from: 'product/skill/add-planning', to: 'product/skill/add-deep', type: 'USES_SKILL', origin: 'declared', modifier: null },
    { from: 'product/command/add.plan', to: 'product/skill/add-avoided', type: 'MENTIONS', origin: 'declared', modifier: null },
  ],
};

describe('toMermaid', () => {
  it('emits a flowchart with a node per artefact reached', () => {
    const out = toMermaid(G, { root: 'product/command/add.plan' });

    expect(out).toMatch(/^flowchart /m);
    expect(out).toContain('add.plan');
    expect(out).toContain('add-planning');
    expect(out).toContain('plan-reviewer-agent');
  });

  it('SCOPES to the root — an unrelated artefact is absent', () => {
    // The whole graph is an unreadable hairball. Scoping is the feature, not a
    // limitation of it.
    expect(toMermaid(G, { root: 'product/command/add.plan' })).not.toContain('add-elsewhere');
  });

  it('honours depth', () => {
    const shallow = toMermaid(G, { root: 'product/command/add.plan', depth: 1 });
    expect(shallow).toContain('add-planning');
    expect(shallow).not.toContain('add-deep');

    expect(toMermaid(G, { root: 'product/command/add.plan', depth: 2 })).toContain('add-deep');
  });

  it('draws a MENTIONS edge dashed, so it cannot be misread as a dependency', () => {
    const out = toMermaid(G, { root: 'product/command/add.plan' });
    expect(out).toContain('add-avoided');
    expect(out).toMatch(/-\.->/); // mermaid dotted link
  });

  it('shapes a node by kind, so the diagram is readable without a legend lookup', () => {
    const out = toMermaid(G, { root: 'product/command/add.plan' });
    expect(out).toMatch(/\(\[.*add\.plan.*\]\)/);   // command: stadium
    expect(out).toMatch(/\[\/.*plan-reviewer-agent.*\/\]/); // agent: parallelogram
  });

  it('produces identifiers mermaid can parse — no dots or slashes bare', () => {
    // `product/command/add.plan` is not a legal mermaid id. Emitting it raw
    // yields a diagram that silently fails to render in the docs.
    const out = toMermaid(G, { root: 'product/command/add.plan' });
    for (const line of out.split('\n')) {
      const id = /^\s{4}([A-Za-z0-9_]+)[[(]/.exec(line);
      if (id) expect(id[1]).toMatch(/^[A-Za-z0-9_]+$/);
    }
    expect(out).not.toMatch(/^\s+product\/command/m);
  });

  it('is deterministic', () => {
    expect(toMermaid(G, { root: 'product/command/add.plan' }))
      .toBe(toMermaid(G, { root: 'product/command/add.plan' }));
  });

  it('emits the whole command layer when given no root', () => {
    const out = toMermaid(G, { kinds: ['command', 'skill', 'agent'] });
    expect(out).toContain('add.plan');
    expect(out).toContain('add-elsewhere');
  });

  it('throws on an unknown root rather than emitting an empty diagram', () => {
    expect(() => toMermaid(G, { root: 'product/command/nope' })).toThrow(/nope/);
  });
});

describe('the checked-in diagram', () => {
  const file = path.join(ROOT, 'web', 'public', 'artefact-graph.mmd');

  it('exists and is current with the emitted graph', () => {
    // The diagram is generated, so a stale one is drift that ships to the docs
    // site. Regenerate with: node scripts/graph.js mermaid --write
    expect(fs.existsSync(file), 'run `node scripts/graph.js mermaid --write`').toBe(true);

    const expected = toMermaid(loadGraph(), { kinds: ['command'], depth: 1 });
    expect(fs.readFileSync(file, 'utf8').trim()).toBe(expected.trim());
  });
});
