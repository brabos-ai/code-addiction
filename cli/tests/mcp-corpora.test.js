import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  makeDocsCorpus,
  makeEmptyTree,
  removeTree,
  EXPECTED_NODES,
  EXPECTED_SKIPPED,
} from './helpers/docs-corpus-fixture.js';
import { CORPORA, resolveCorpus, probe, parseFrontmatter } from '../../mcp/corpora.mjs';

/**
 * Plan 2026-09-12T104012 — F6, the corpus registry and the two parsers.
 * Validation Matrix levels L2.2, L2.5, L2.6, plus the membership rules the
 * design states as requirements rather than implementer choices.
 *
 * Written RED against a tree with no `mcp/` directory: the import above was the
 * first thing to fail.
 */

const REPO = path.resolve(import.meta.dirname, '..', '..');

let docsTree;
let emptyTree;

beforeAll(() => {
  docsTree = makeDocsCorpus();
  emptyTree = makeEmptyTree();
});

afterAll(() => {
  removeTree(docsTree);
  removeTree(emptyTree);
});

describe('F6 — the registry is one declarative table with two rows', () => {
  it('carries exactly the two corpora, each with every column the design names', () => {
    expect(Object.keys(CORPORA).sort()).toEqual(['artefacts', 'docs']);
    for (const corpus of Object.values(CORPORA)) {
      expect(corpus.name).toBeTypeOf('string');
      expect(Array.isArray(corpus.roots)).toBe(true);
      expect(corpus.roots.length).toBeGreaterThan(0);
      expect(corpus.probe).toBeTypeOf('string');
      expect(corpus.index).toBeTypeOf('string');
      expect(corpus.load).toBeTypeOf('function');
    }
  });

  it('L2.6 the two indexes are separate files', () => {
    expect(CORPORA.artefacts.index).not.toBe(CORPORA.docs.index);
  });

  it('the artefact probe is the file absent from the release ZIP', () => {
    // Without this exact probe an installed `.claude/` — whose `uses:` blocks
    // the build stripped — would index as dozens of edge-free nodes.
    expect(CORPORA.artefacts.probe).toBe('framwork/provider-map.json');
  });

  it('rejects a corpus name that is not in the table, naming what is', () => {
    expect(() => resolveCorpus('everything')).toThrow(/artefacts.*docs|docs.*artefacts/);
  });
});

describe('F6 — the probe validates what the flag selects', () => {
  it('L2.5 an absent artefact corpus is an error naming the probe, never an empty result', () => {
    const result = probe(CORPORA.artefacts, emptyTree);
    expect(result.present).toBe(false);
    expect(result.reason).toContain('framwork/provider-map.json');
  });

  it('L2.5 the docs corpus is absent when docs/ is', () => {
    expect(probe(CORPORA.docs, emptyTree).present).toBe(false);
    expect(probe(CORPORA.docs, docsTree).present).toBe(true);
  });

  it('the artefact corpus is present in this repository', () => {
    expect(probe(CORPORA.artefacts, REPO).present).toBe(true);
  });
});

describe('F6 — the frontmatter reader', () => {
  it('reads scalars, flow sequences and block sequences', () => {
    const fm = parseFrontmatter(`---
id: 0042F
type: feature-about
related: [0009F, 0011F]
tags:
  - purchases
  - ledger
description: How the API worker is built — routing, persistence and tenancy.
---

## TL;DR
body
`);
    expect(fm.id).toBe('0042F');
    expect(fm.type).toBe('feature-about');
    expect(fm.related).toEqual(['0009F', '0011F']);
    expect(fm.tags).toEqual(['purchases', 'ledger']);
    expect(fm.description).toContain('routing, persistence and tenancy');
  });

  it('strips quotes without eating an inner colon', () => {
    const fm = parseFrontmatter('---\ndescription: "a: b"\nslug: \'x-y\'\n---\n');
    expect(fm.description).toBe('a: b');
    expect(fm.slug).toBe('x-y');
  });

  it('returns null when there is no frontmatter block at all', () => {
    expect(parseFrontmatter('# Just a heading\n')).toBeNull();
    expect(parseFrontmatter('')).toBeNull();
  });

  it('returns an object with no type when frontmatter exists but omits it', () => {
    const fm = parseFrontmatter('---\nauthor: someone\n---\n# x\n');
    expect(fm).not.toBeNull();
    expect(fm.type).toBeUndefined();
  });
});

describe('F6 — the docs parser decides membership by type:, never by path', () => {
  let corpus;

  beforeAll(() => {
    corpus = CORPORA.docs.load(docsTree);
  });

  it('L2.2 one node per *-about document, plus the wiki page', () => {
    const kinds = Object.fromEntries(corpus.nodes.map((n) => [n.id, n.kind]));
    expect(kinds).toEqual(EXPECTED_NODES);
  });

  it("L2.2 the user's own files are skipped, and reported once each", () => {
    const skipped = corpus.skipped.map((s) => s.path).sort();
    expect(skipped).toEqual([...EXPECTED_SKIPPED].sort());
    for (const entry of corpus.skipped) expect(entry.reason).toBeTypeOf('string');
  });

  it('a recognised type that is not *-about becomes an attachment of its work item', () => {
    const feature = corpus.nodes.find((n) => n.id === '0042F');
    const names = feature.attachments.map((a) => path.basename(a.path)).sort();
    expect(names).toEqual(['changelog.md', 'discovery.md', 'plan.md']);
    expect(feature.attachments.every((a) => a.type)).toBe(true);
  });

  it('a changelog in docs/changelog/ attaches through its part_of relation', () => {
    // Decision 30: both layouts exist in the wild and both are read. This one
    // has no *-about sibling, so the directory rule cannot resolve it.
    const hotfix = corpus.nodes.find((n) => n.id === '0051H');
    const names = hotfix.attachments.map((a) => path.basename(a.path)).sort();
    expect(names).toEqual(['CHG0002.md', 'related.md']);
  });

  it('carries status, tags and the first sentence of the TL;DR on every work item', () => {
    const feature = corpus.nodes.find((n) => n.id === '0042F');
    expect(feature.status).toBe('live');
    expect(feature.tags).toEqual(['purchases', 'ledger']);
    expect(feature.summary).toBe(
      'A purchase can be split into itemised lines.',
    );
    expect(feature.tldr).toContain('one row per item');
  });

  it("a reference page's description is its summary, with area and sources", () => {
    const page = corpus.nodes.find((n) => n.kind === 'reference page');
    expect(page.area).toBe('backend');
    expect(page.summary).toContain('How the API worker is built');
    expect(page.sources).toEqual(['src/api/app.ts', 'src/api/features/**', 'src/auth/*.ts']);
  });

  it("takes a brownfield node's file set from related.md Impacted Files", () => {
    // Decision 36: 18 of 19 measured documents already carry the list, so
    // `touched_by` answers on day one rather than from the first new delivery.
    const hotfix = corpus.nodes.find((n) => n.id === '0051H');
    expect(hotfix.files).toEqual(['src/auth/refresh.ts', 'src/auth/session.ts']);
  });
});

describe('F6 — the docs parser reads every edge source the design names', () => {
  let corpus;
  let edgesFrom;

  beforeAll(() => {
    corpus = CORPORA.docs.load(docsTree);
    edgesFrom = (id) => corpus.edges.filter((e) => e.from === id);
  });

  it('reads a typed ## Relations line, with its why', () => {
    const edge = edgesFrom('0051H').find((e) => e.type === 'caused_by');
    expect(edge.to).toBe('0042F');
    expect(edge.why).toContain('the purchase split added the call');
  });

  it('lets an explicit ## Relations type win over the same id in related:', () => {
    // 0042F carries `related: [0009F]` AND `depends_on [[0009F]]`. The typed
    // line is authored; the frontmatter one is migration input. One edge, typed.
    const toLedger = edgesFrom('0042F').filter((e) => e.to === '0009F');
    expect(toLedger).toHaveLength(1);
    expect(toLedger[0].type).toBe('depends_on');
  });

  it('reads a related: id nothing else declares as links_to', () => {
    const edge = edgesFrom('0051H').find((e) => e.to === '0042F' && e.type === 'caused_by');
    expect(edge).toBeTruthy();
    // 0051H's `related: [0042F]` must not add a second, untyped edge beside it.
    expect(edgesFrom('0051H').filter((e) => e.to === '0042F')).toHaveLength(1);
  });

  it('drops a relation naming an id that resolves to nothing, and reports it', () => {
    expect(edgesFrom('0051H').some((e) => e.to === '0099F')).toBe(false);
    expect(corpus.unresolved).toContainEqual({ from: '0051H', to: '0099F' });
  });

  it('never points an edge at an attachment', () => {
    const nodeIds = new Set(corpus.nodes.map((n) => n.id));
    for (const edge of corpus.edges) {
      expect(nodeIds.has(edge.to), `${edge.from} -> ${edge.to}`).toBe(true);
    }
  });

  it('harvests a {{doc:ID}} body reference as links_to, with its sentence', () => {
    // 0051H's Symptom names {{doc:0009F}} inline. The sentence around it is the
    // `why` — the reason recovered with no model, which is what makes the body
    // reference the richest source in a brownfield corpus.
    const edge = edgesFrom('0051H').find((e) => e.to === '0009F');
    expect(edge).toBeTruthy();
    expect(edge.type).toBe('links_to');
    expect(edge.why).toContain('records the gap');
  });

  it('drops a body reference pointing at the document it sits in', () => {
    // CHG0001 lives in 0042F's directory and its Changes bullet names
    // {{doc:0042F}}. Attributed to its owner that is a self-edge.
    expect(corpus.edges.some((e) => e.from === e.to)).toBe(false);
  });
});

describe('F6 — the artefact parser adapts the build sidecar', () => {
  let corpus;

  beforeAll(() => {
    corpus = CORPORA.artefacts.load(REPO);
  });

  it('reads the sidecar the build already writes rather than re-parsing sources', () => {
    // The parity level L2.4 holds by construction only if both surfaces read the
    // same file. Re-deriving the graph here is what makes two answers possible.
    expect(fs.existsSync(path.join(REPO, CORPORA.artefacts.index))).toBe(true);
    expect(corpus.nodes.length).toBeGreaterThan(100);
  });

  it('keeps the <layer>/<kind>/<name> node id', () => {
    expect(corpus.nodes.some((n) => n.id === 'product/skill/add-doc-schemas')).toBe(true);
  });

  it('L2.6 no node id appears in both corpora', () => {
    const docsIds = new Set(CORPORA.docs.load(docsTree).nodes.map((n) => n.id));
    const shared = corpus.nodes.filter((n) => docsIds.has(n.id));
    expect(shared).toEqual([]);
  });
});

describe('F6 — decision 30: BOTH changelog layouts contribute edges', () => {
  let corpus;

  beforeAll(() => {
    corpus = CORPORA.docs.load(docsTree);
  });

  it('an in-feature changelog contributes its body references to its work item', () => {
    // CHG0001 sits beside 0042F's about.md and names {{doc:0042F}} — a self
    // reference, correctly dropped. What matters is that it was READ at all.
    const feature = corpus.nodes.find((n) => n.id === '0042F');
    expect(feature.attachments.map((a) => a.type)).toContain('changelog');
  });

  it('a docs/changelog/ changelog contributes its body references too', () => {
    // THE GAP THIS CLOSES: the edge pass used to attribute attachment content
    // by DIRECTORY only. CHG0002 has no *-about sibling — it resolves to 0051H
    // through its own part_of line — so its Changes bullet reached nothing.
    // 0012F is named by NOTHING else in the fixture, so an edge reaching it can
    // only have come from CHG0002's body. Asserting on a target the work item
    // also references would pass without the fix, which is how the first draft
    // of this level did.
    const edge = corpus.edges.find((e) => e.from === '0051H' && e.to === '0012F');
    expect(edge, 'the out-of-directory changelog contributed no edge').toBeTruthy();
    expect(edge.type).toBe('links_to');
    expect(edge.why).toContain('session store');
  });

  it('neither layout can make a work item point at itself', () => {
    expect(corpus.edges.filter((e) => e.from === e.to)).toEqual([]);
  });
});
