import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Plan 2026-09-12T104012 — F17 and F18, the brownfield migration.
 *
 * Validation Matrix level L3, plus L4.1 and L4.5. The levels the plan's
 * Reviewer Handoff singles out are here in the shape it asks for: L3.2 SHOWS
 * the diff rather than summarising it, and L3.3 asserts a relation per source
 * EDGE rather than comparing totals.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli', 'package.json'), 'utf8'));

describe('F17 — yaml is a direct CLI dependency', () => {
  it('is declared, not relied on transitively', () => {
    // The plan assumed it was already present transitively. It was not:
    // `npm ls yaml` reported empty and an import threw ERR_MODULE_NOT_FOUND.
    expect(PKG.dependencies.yaml).toBeTypeOf('string');
  });

  it('is ranged like its neighbours, not pinned against them', () => {
    const ranges = Object.values(PKG.dependencies);
    expect(ranges.every((r) => r.startsWith('^')), JSON.stringify(PKG.dependencies)).toBe(true);
  });

  it('is in the lockfile, so a CI install gets the same one', () => {
    const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli', 'package-lock.json'), 'utf8'));
    expect(lock.packages['node_modules/yaml']).toBeTruthy();
    expect(lock.packages[''].dependencies.yaml).toBe(PKG.dependencies.yaml);
  });

  it('resolves from cli/src at runtime', async () => {
    const yaml = await import('yaml');
    expect(yaml.parse('a: 1\nb: [x, y]\n')).toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('a hand-rolled reader is what it replaces — a multi-line value survives', async () => {
    const yaml = await import('yaml');
    const parsed = yaml.parse('description: >\n  one line\n  and another\nid: 0042F\n');
    expect(parsed.id).toBe('0042F');
    expect(parsed.description).toContain('one line and another');
  });

  it('the MCP server still takes no dependency, yaml included', () => {
    for (const file of fs.readdirSync(path.join(ROOT, 'mcp'))) {
      const source = fs.readFileSync(path.join(ROOT, 'mcp', file), 'utf8');
      const specs = [...source.matchAll(/^import .*? from '([^']+)';$/gm)].map((m) => m[1]);
      for (const spec of specs) {
        expect(spec.startsWith('node:') || spec.startsWith('./'), `${file}: ${spec}`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// F18 — the mechanical harvest
// ---------------------------------------------------------------------------

describe('F18 — the registry entry', () => {
  it('is registered once, after the prune, where the updater already runs them', async () => {
    const { MIGRATIONS } = await import('../src/migrations.js');
    const ids = MIGRATIONS.map((m) => m.id);
    expect(ids).toContain('0002-harvest-relations');
    expect(ids.indexOf('0002-harvest-relations')).toBe(ids.length - 1);
    expect([...ids].sort()).toEqual(ids);
  });

  it('every registry entry still declares an id, a description and a run', async () => {
    const { MIGRATIONS } = await import('../src/migrations.js');
    for (const m of MIGRATIONS) {
      expect(m.id).toMatch(/^\d{4}-[a-z-]+$/);
      expect(m.description.length).toBeGreaterThan(10);
      expect(m.run).toBeTypeOf('function');
    }
  });
});

describe('F18 — L3 the harvest over a brownfield tree', () => {
  let cwd;
  let before;
  let outcome;

  beforeEach(async () => {
    const { makeBrownfield, snapshot } = await import('./helpers/brownfield-fixture.js');
    const { MIGRATIONS } = await import('../src/migrations.js');
    cwd = makeBrownfield();
    before = snapshot(cwd);
    outcome = MIGRATIONS.find((m) => m.id === '0002-harvest-relations').run({ cwd, providers: [] });
  });

  afterEach(async () => {
    const { removeTree } = await import('./helpers/brownfield-fixture.js');
    removeTree(cwd);
  });

  it('L3.2 ADDITIVE ONLY — the diff removes nothing, shown line by line', async () => {
    const { snapshot, diff } = await import('./helpers/brownfield-fixture.js');
    const { removed, added } = diff(before, snapshot(cwd));

    // Shown, not summarised: every removed line, per file, is named here.
    expect(removed).toEqual({});
    expect(Object.keys(added).length).toBeGreaterThan(0);
    for (const [file, lines] of Object.entries(added)) {
      for (const line of lines) {
        // The closed vocabulary and nothing else. `superseded_by` is absent on
        // purpose: it stays in frontmatter and is never written as a line.
        expect(line, `${file}: ${line}`).toMatch(/^(## Relations|- (caused_by|depends_on|part_of|links_to) \[\[)/);
      }
    }
  });

  it('L3.1 IDEMPOTENT — a second run leaves every byte identical', async () => {
    const { snapshot } = await import('./helpers/brownfield-fixture.js');
    const { MIGRATIONS } = await import('../src/migrations.js');
    const afterFirst = snapshot(cwd);
    MIGRATIONS.find((m) => m.id === '0002-harvest-relations').run({ cwd, providers: [] });
    expect(snapshot(cwd)).toEqual(afterFirst);
  });

  /** Every wikilink target in a document's `## Relations` section. */
  const targetsIn = (rel) => {
    const doc = fs.readFileSync(path.join(cwd, rel), 'utf8');
    const section = doc.slice(doc.indexOf('## Relations'));
    return [...section.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]);
  };

  it('L3.3 recovers a relation for EVERY {{doc:ID}} body reference that resolves', () => {
    // PER EDGE, NOT PER TOTAL. The plan's Reviewer Handoff names the totals
    // shortcut as the likeliest way this level leaks, and the first draft took
    // it: one literal expected line plus `docRefs > 0`. The fixture's 0042F
    // body now names three resolving documents, and all three must appear.
    const targets = targetsIn('docs/features/0042F-itemised-purchase/about.md');
    for (const id of ['0009F', '0003F', '0012F']) {
      expect(targets, `no relation recovered for {{doc:${id}}}`).toContain(id);
    }
  });

  it('L3.3 each recovered reference carries ITS OWN sentence as the why', () => {
    // A boundary matching only '. ' swallows every earlier sentence of a
    // wrapped paragraph, so the second and third reference end up carrying a
    // reason that names the first document. Found by thickening the fixture,
    // not by reading the code.
    const doc = fs.readFileSync(path.join(cwd, 'docs/features/0042F-itemised-purchase/about.md'), 'utf8');
    const byTarget = Object.fromEntries(
      doc.split('\n')
        .filter((l) => l.startsWith('- links_to'))
        .map((l) => [l.match(/\[\[([^\]]+)\]\]/)[1], l]),
    );
    expect(byTarget['0009F']).toContain('owns the row shape');
    expect(byTarget['0009F']).not.toContain('It also replaces');
    expect(byTarget['0003F']).toContain('It also replaces the import path');
    expect(byTarget['0003F']).not.toContain('owns the row shape');
  });

  it('L3.3 recovers a relation for EVERY related: id that resolves', () => {
    // 0051H carries `related: [0042F, 0012F]`. Both, not the first.
    const targets = targetsIn('docs/features/0051H-token-refresh/about.md');
    expect(targets).toContain('0042F');
    expect(targets).toContain('0012F');
  });

  it("L3.3 recovers every related.md Follow-up carrying a {{doc:}}", () => {
    // The fixture's related.md carries TWO Follow-ups, and each one's sentence
    // is the `why` — recovered with no model.
    const hotfix = fs.readFileSync(path.join(cwd, 'docs/features/0051H-token-refresh/about.md'), 'utf8');
    expect(hotfix).toContain('introduced the second refresh call');
    expect(hotfix).toContain('still logs the gap as a silent write failure');
    expect(outcome.harvest.followUps).toBe(2);
  });

  it('L3.3 counts superseded_by and writes NO line for it', () => {
    // The design is explicit: it is the status edge it already is, in
    // frontmatter, and is not duplicated into ## Relations. Writing it there
    // would put a type outside the closed vocabulary into a section the schema
    // gate rejects as malformed.
    const old = fs.readFileSync(path.join(cwd, 'docs/features/0003F-old-import/about.md'), 'utf8');
    expect(old).not.toContain('superseded_by [[');
    expect(old).toContain('superseded_by: 0042F');
    expect(outcome.harvest.superseded).toBe(1);
  });

  it('the indexer reads that edge from the frontmatter it was left in', async () => {
    const { CORPORA } = await import('../../mcp/corpora.mjs');
    const corpus = CORPORA.docs.load(cwd);
    const edge = corpus.edges.find((e) => e.from === '0003F' && e.to === '0042F');
    expect(edge.type).toBe('superseded_by');
  });

  it('L3.3 reports every non-empty Impacted Files list', () => {
    expect(outcome.harvest.impactedFiles).toBe(1);
  });

  it('L3.4 an id resolving to nothing produces NO line and is reported', () => {
    const about = fs.readFileSync(path.join(cwd, 'docs/features/0042F-itemised-purchase/about.md'), 'utf8');
    expect(about).not.toContain('[[0099F]]');
    expect(outcome.unresolved).toContainEqual({ from: '0042F', id: '0099F' });
  });

  it('L3.5 it writes no commit and leaves the working tree dirty', () => {
    expect(fs.existsSync(path.join(cwd, '.git'))).toBe(false);
    expect(outcome.changes.length).toBeGreaterThan(0);
    for (const change of outcome.changes) expect(change).toMatch(/^updated /);
  });

  it('L3.6 and L4.5 a file with no type: is untouched and counted as skipped', async () => {
    const { snapshot } = await import('./helpers/brownfield-fixture.js');
    const after = snapshot(cwd);
    expect(after['docs/chat-gpt/transcript.md']).toBe(before['docs/chat-gpt/transcript.md']);
    expect(after['docs/critical-findings.md']).toBe(before['docs/critical-findings.md']);
    expect(outcome.skipped).toBe(2);
  });

  it("L4.5 a user file's related: and {{doc:}} produce no edge anywhere", () => {
    // critical-findings.md carries `related: [0042F]` and the transcript names
    // {{doc:0042F}}. Neither is codeadd's, so neither becomes an edge.
    const about = fs.readFileSync(path.join(cwd, 'docs/features/0042F-itemised-purchase/about.md'), 'utf8');
    const inbound = about.split('\n').filter((l) => l.startsWith('- '));
    expect(inbound.every((l) => !l.includes('critical-findings'))).toBe(true);
    expect(outcome.harvest.docRefs + outcome.harvest.related).toBeLessThan(10);
  });

  it('does NOT invent a TL;DR where the document has none', () => {
    // Decision 21: an empty skeleton satisfies the close-out gate while
    // carrying nothing, and the TL;DR is the rejection surface.
    const blank = fs.readFileSync(path.join(cwd, 'docs/features/0060F-blank/about.md'), 'utf8');
    const tldr = blank.slice(blank.indexOf('## TL;DR') + 8, blank.indexOf('## Problem'));
    expect(tldr.trim()).toBe('');
  });

  it('touches no attachment — a relation belongs to the work item', () => {
    const changelog = path.join(cwd, 'docs/features/0042F-itemised-purchase/changelog.md');
    expect(fs.readFileSync(changelog, 'utf8')).toBe(before['docs/features/0042F-itemised-purchase/changelog.md']);
  });

  it('never throws, and reports what it could not do', () => {
    expect(outcome.failed ?? []).toEqual([]);
  });
});

describe('F18 — L4.1 what the graph says after the harvest', () => {
  let cwd;
  let corpus;

  beforeEach(async () => {
    const { makeBrownfield } = await import('./helpers/brownfield-fixture.js');
    const { MIGRATIONS } = await import('../src/migrations.js');
    const { CORPORA } = await import('../../mcp/corpora.mjs');
    cwd = makeBrownfield();
    MIGRATIONS.find((m) => m.id === '0002-harvest-relations').run({ cwd, providers: [] });
    corpus = CORPORA.docs.load(cwd);
  });

  afterEach(async () => {
    const { removeTree } = await import('./helpers/brownfield-fixture.js');
    removeTree(cwd);
  });

  it('every harvested line parses back as a real edge', async () => {
    expect(corpus.malformed).toEqual([]);
    const edges = corpus.edges.map((e) => `${e.from}-${e.type}->${e.to}`);
    expect(edges).toContain('0042F-links_to->0009F');
    expect(edges).toContain('0051H-links_to->0042F');
    expect(edges).toContain('0003F-superseded_by->0042F');
  });

  it('L4.1 orphans lists exactly the documents the harvest could not reach', async () => {
    const { actions } = await import('../../mcp/engine.mjs');
    const found = Object.fromEntries(actions.orphans(corpus).orphans.map((o) => [o.id, o.reasons]));
    // 0060F has an empty TL;DR heading and no edge: both reasons, and it is the
    // one document the migration deliberately left alone.
    expect(found['0060F']).toEqual(['no relation', 'no TL;DR']);
    // Everything the harvest reached is off the queue.
    expect(found['0042F']).toBeUndefined();
    expect(found['0051H']).toBeUndefined();
    expect(found['0003F']).toBeUndefined();
  });

  it("L3.3 touched_by answers from the related.md list on day one", async () => {
    const { actions } = await import('../../mcp/engine.mjs');
    // Decision 36: the file set comes from Impacted Files, not from git, so
    // this answers before the project's first new delivery.
    const result = actions.touched_by(corpus, { files: ['src/auth/refresh.ts'] });
    expect(result.workItems.map((w) => w.id)).toEqual(['0051H']);
  });

  it('L4.5 a user file is absent from every action result', async () => {
    const { actions } = await import('../../mcp/engine.mjs');
    const ids = actions.search(corpus, { terms: '', limit: 50 }).hits.map((h) => h.id);
    expect(ids).not.toContain('critical-findings');
    expect(actions.search(corpus, { terms: 'transcript' }).hits).toEqual([]);
    expect(actions.search(corpus, { terms: 'Findings' }).hits).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// F19 — the close-out gate, and the index rebuild
// ---------------------------------------------------------------------------

describe('F19 — /add.done keeps the format from decaying', () => {
  const DONE = fs.readFileSync(
    path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.done.md'),
    'utf8',
  );

  const gate = () => DONE.slice(DONE.indexOf('### 4.4'), DONE.indexOf('## STEP 5'));

  it('L4.3 gate 4.4 exists and blocks on either half', () => {
    expect(DONE).toMatch(/^### 4\.4/m);
    const body = gate();
    expect(body).toContain('TL;DR');
    expect(body).toContain('## Relations');
    expect(body).toMatch(/BLOCKED/);
  });

  it('L4.3 an empty TL;DR heading satisfies nothing', () => {
    // Decision 21: the whole point of the gate is that the TL;DR is the
    // rejection surface, and a heading with nothing under it rejects nothing.
    expect(gate()).toMatch(/empty/i);
  });

  it('L4.3 the gate names the tool it forbids, per building-commands', () => {
    expect(gate()).toMatch(/⛔ DO NOT USE:/);
  });

  it('the gate runs before the merge, not after it', () => {
    expect(DONE.indexOf('### 4.4')).toBeLessThan(DONE.indexOf('## STEP 8'));
  });

  it('rebuilds the docs index, through the shipped one-shot form', () => {
    // `/add.done` runs in a user's project, where the server lives in the npm
    // package and nothing is installed locally. It asks the CLI for one answer
    // rather than speaking JSON-RPC to a subprocess it spawned for one call.
    expect(DONE).toMatch(/codeadd mcp --corpus=docs --action=reindex/);
  });

  it('the rebuild runs AFTER the changelog, so the new document is in it', () => {
    expect(DONE.indexOf('--action=reindex')).toBeGreaterThan(DONE.indexOf('### 6.3'));
  });

  it('the rebuild is best-effort and never blocks a merge', () => {
    const rebuild = DONE.slice(DONE.indexOf('--action=reindex') - 1200, DONE.indexOf('--action=reindex') + 900);
    expect(rebuild).toMatch(/non-blocking|best-effort|never block/i);
  });

  it('leaves the delivery-index routing alone', () => {
    // The four-state routing product-close-out-parity established stands
    // unchanged: this plan extends the close-out, it does not revisit it.
    expect(DONE).toContain('### 6.8 Write the Delivery Index Entry');
  });
});

describe('F18 — the report reaches the driver, not just the return value', () => {
  it('runMigrations carries notes out of the migration', async () => {
    const { makeBrownfield, removeTree } = await import('./helpers/brownfield-fixture.js');
    const { runMigrations, MIGRATIONS } = await import('../src/migrations.js');
    const tree = makeBrownfield();
    try {
      const result = runMigrations({ cwd: tree, providers: [] }, ['0001-prune-legacy-orphans'], {
        registry: MIGRATIONS,
      });
      // The level this joins used to read `outcome.unresolved` straight off the
      // migration, which passed while the driver dropped it on the floor.
      expect(result.notes.some((n) => n.includes('0099F'))).toBe(true);
      expect(result.notes.some((n) => n.startsWith('harvested'))).toBe(true);
      expect(result.notes.some((n) => n.includes('skipped 2 file(s)'))).toBe(true);
    } finally {
      removeTree(tree);
    }
  });

  it('both drivers print what the migration found, not only what it wrote', () => {
    for (const rel of ['src/updater.js', 'src/migrations.js']) {
      const src = fs.readFileSync(path.join(import.meta.dirname, '..', rel), 'utf8');
      expect(src.includes('.notes ?? []'), rel).toBe(true);
      expect(src.includes('log.info(`Migration: ${note}`)'), rel).toBe(true);
    }
  });
});

describe('F19 — 6.7.1 asks for what the action actually returns', () => {
  const DONE = fs.readFileSync(
    path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.done.md'),
    'utf8',
  );

  it('reindex reports a COUNT, so the step calls stats for the list', async () => {
    const { actions } = await import('../../mcp/engine.mjs');
    const { makeDocsCorpus, removeTree } = await import('./helpers/docs-corpus-fixture.js');
    const { loadCorpus } = await import('../../mcp/engine.mjs');
    const tree = makeDocsCorpus();
    try {
      const data = loadCorpus('docs', tree);
      // The contract the step has to be written against.
      expect(typeof actions.reindex(data, {}, { root: tree }).unresolved).toBe('number');
      expect(Array.isArray(actions.stats(data).unresolved)).toBe(true);
    } finally {
      removeTree(tree);
    }
    const step = DONE.slice(DONE.indexOf('### 6.7.1'), DONE.indexOf('### 6.8'));
    expect(step).toContain('--action=stats');
    expect(step).toMatch(/only `stats` returns the ids/);
  });

  it('the rebuild runs on the Resume route, where the changelog does not', () => {
    const table = DONE.slice(DONE.indexOf('| STEP | Normal | Resume |'), DONE.indexOf('| 8 | Merge'));
    expect(table).toContain('| 6.7.1 |');
    expect(table).toMatch(/6\.7\.1 \| Rebuild the docs index \| \*\*Runs\.\*\*/);
  });

  it('STEP 9 carries the rebuild outcome to the user', () => {
    const report = DONE.slice(DONE.indexOf('## STEP 9'));
    expect(report).toContain('docs index rebuild from 6.7.1');
  });

  it('the top STEP list no longer scopes STEP 4 to feature branches alone', () => {
    const line = DONE.split('\n').find((l) => l.startsWith('STEP 4: Validate delivery'));
    expect(line).toMatch(/feature AND hotfix/);
  });
});
