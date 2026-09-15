import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Plan 2026-09-14T215936 — F1, the RED matrix for the document model.
 *
 * Levels L1, L2, L3, L4, L4b and L5 of that plan's Validation Matrix.
 *
 * Written RED against a tree whose `classify()` still tests
 * `String(type).endsWith('-about')` and where `mcp/types.mjs` does not exist.
 *
 * ⛔ EVERY LEVEL HERE EXERCISES THE REAL PATH, NEVER THE DEGRADED ONE.
 * The previous delivery in this area shipped a feature whose docs-corpus tests
 * all asserted the `unavailable` branch, so the code under test ran in no test
 * at all — "green by degradation". Each fixture below is a real project on
 * disk, indexed by the real loader.
 *
 * Imports are dynamic so a level fails with its own reason instead of the whole
 * file failing once at the top on a module that does not exist yet.
 */

const REPO = path.resolve(import.meta.dirname, '..', '..');

// ---------------------------------------------------------------------------
// A project on disk, built per test. No shared fixture: F6 and F9 rewrite the
// shared one, and a level that moves when an unrelated block edits a helper is
// a level that stops meaning anything.
// ---------------------------------------------------------------------------

const trees = [];

function makeTree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-docmodel-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
  }
  trees.push(root);
  return root;
}

afterEach(() => {
  while (trees.length) {
    try {
      fs.rmSync(trees.pop(), { recursive: true, force: true });
    } catch {
      /* a Windows handle still open is not a test failure */
    }
  }
});

const fm = (obj, body = '\n## TL;DR\nOne line.\n') =>
  `---\n${Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n---\n${body}`;

const load = async (root) => {
  const { resolveCorpus } = await import('../../mcp/corpora.mjs');
  return resolveCorpus('docs').load(root);
};

const skipReason = (data, relPath) =>
  (data.skipped.find((s) => s.path.replace(/\\/g, '/') === relPath) || {}).reason;

// ---------------------------------------------------------------------------

describe('L1 — the type registry decides, the suffix does not', () => {
  it('L1.1 every declared type resolves to its declared kind', async () => {
    const { TYPES } = await import('../../mcp/types.mjs');
    expect(Object.keys(TYPES).length).toBeGreaterThan(0);
    for (const [type, entry] of Object.entries(TYPES)) {
      expect(['work-item', 'page', 'attachment'], `${type} declares an unknown kind`).toContain(
        entry.kind,
      );
    }
  });

  it('L1.2 an unknown type that declares `kind:` itself is honoured', async () => {
    const root = makeTree({
      'docs/custom/thing.md': fm({ id: 'X-1', type: 'their-own-type', kind: 'work-item' }),
    });
    const data = await load(root);
    expect(data.nodes.map((n) => n.id)).toContain('X-1');
  });

  it('L1.3 an unknown type declaring no `kind:` is reported by name, never dropped silently', async () => {
    const root = makeTree({
      'docs/custom/thing.md': fm({ id: 'X-2', type: 'their-own-type' }),
    });
    const data = await load(root);
    const reason = skipReason(data, 'docs/custom/thing.md');
    expect(reason, 'the skip must exist').toBeTruthy();
    expect(reason).toMatch(/their-own-type/);
    expect(reason, 'naming the wrong cause is the defect').not.toMatch(/resolves to no work item/);
  });

  it('L1.4 the registry imports nothing — it loads with cli/node_modules off the path', async () => {
    const source = fs.readFileSync(path.join(REPO, 'mcp', 'types.mjs'), 'utf8');
    const specs = [...source.matchAll(/^import .*? from '([^']+)';$/gm)].map((m) => m[1]);
    expect(specs.filter((s) => !s.startsWith('.') && !s.startsWith('node:'))).toEqual([]);
  });

  it('L1.5 no registry entry carries the retired `-about` suffix', async () => {
    const { TYPES } = await import('../../mcp/types.mjs');
    expect(Object.keys(TYPES).filter((t) => t.endsWith('-about'))).toEqual([]);
  });
});

describe('L2 — the corpus indexes what the registry declares', () => {
  it('L2.1 all four Diátaxis page types index — 4 nodes, 0 skipped', async () => {
    const files = {};
    for (const t of ['tutorial', 'how-to', 'reference', 'explanation']) {
      files[`.codeadd/wiki/backend/${t}-page.md`] = fm({
        id: `wiki/backend/${t}-page`,
        type: t,
        area: 'backend',
        description: `a ${t} page`,
      });
    }
    const data = await load(makeTree(files));
    expect(data.nodes.length, 'measured before this plan: nodes 1, skipped 2').toBe(4);
    expect(data.skipped).toEqual([]);
    expect(new Set(data.nodes.map((n) => n.kind))).toEqual(new Set(['page']));
  });

  it('L2.2 one document per registry type indexes, with zero owner failures', async () => {
    const { TYPES } = await import('../../mcp/types.mjs');
    const files = {
      'docs/features/0001F-login/about.md': fm({ id: '0001F', type: 'feature', slug: 'login', status: 'done' }),
    };
    for (const [type, entry] of Object.entries(TYPES)) {
      if (entry.kind === 'page' || type === 'feature') continue;
      const dir = entry.kind === 'attachment' && entry.owner === 'dir' ? 'docs/features/0001F-login' : `docs/${type}`;
      const front = { id: `ID-${type}`, type };
      if (entry.kind === 'attachment' && entry.owner === 'related') front.related = '[0001F]';
      files[`${dir}/${type}-doc.md`] = fm(front);
    }
    const data = await load(makeTree(files));
    const ownerFailures = data.skipped.filter((s) => /owner/i.test(s.reason));
    expect(ownerFailures, 'measured before this plan: 4 of these').toEqual([]);
  });

  it('L2.3 setup-receipt indexes as a work item', async () => {
    const root = makeTree({ 'docs/qa/qa-setup.md': fm({ id: 'QA-SETUP', type: 'setup-receipt' }) });
    const data = await load(root);
    const node = data.nodes.find((n) => n.id === 'QA-SETUP');
    expect(node, 'measured before this plan: skipped').toBeTruthy();
    expect(node.kind).toBe('work-item');
  });

  it('L2.3b a page with no declared id is reported, never indexed by a derived one', async () => {
    const root = makeTree({
      '.codeadd/wiki/backend/orphan.md': fm({ type: 'reference', area: 'backend', description: 'x' }),
    });
    const data = await load(root);
    expect(data.nodes.map((n) => n.id)).not.toContain('wiki/backend/orphan');
    expect(skipReason(data, '.codeadd/wiki/backend/orphan.md')).toMatch(/id/i);
  });

  it('L2.4 no file in the repository names a retired type literal', () => {
    const RETIRED = /feature-about|hotfix-about/;
    const ROOTS = ['framwork/.codeadd', 'mcp', 'cli/src', 'cli/tests', '.claude'];
    const hits = [];
    const walk = (dir) => {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (['node_modules', '.git', 'worktrees'].includes(e.name)) continue;
          walk(full);
          continue;
        }
        if (RETIRED.test(e.name)) hits.push(path.relative(REPO, full).replace(/\\/g, '/') + ' (filename)');
        if (!/\.(md|mjs|js|json)$/.test(e.name)) continue;
        if (full.includes(`${path.sep}mcp-document-model.test.js`)) continue;
        if (RETIRED.test(fs.readFileSync(full, 'utf8'))) {
          hits.push(path.relative(REPO, full).replace(/\\/g, '/'));
        }
      }
    };
    for (const r of ROOTS) walk(path.join(REPO, r));
    expect(hits, 'this sweep is the edit boundary — the plan Impact table is not').toEqual([]);
  });

  it('L2.5 an attachment whose declared owner mode fails names the mode', async () => {
    const root = makeTree({
      'docs/changelog/CHG0001.md': fm({ id: 'CHG0001', type: 'changelog', related: '[]' }),
    });
    const data = await load(root);
    const reason = skipReason(data, 'docs/changelog/CHG0001.md');
    expect(reason).toMatch(/related/);
  });

  it('L2.6 the corpus registry describes the rule classify() actually applies', async () => {
    const { CORPORA } = await import('../../mcp/corpora.mjs');
    expect(CORPORA.docs.membership, 'it said "frontmatter carries a type: key", which is looser than the rule')
      .toMatch(/registry/i);
  });
});

describe('L3 — migration 0003 over a user\'s own documents', () => {
  const ID = '0003-retire-about-suffix';

  const brownfield = () =>
    makeTree({
      'docs/features/0001F-login/about.md': fm(
        { id: '0001F', type: 'feature-about', slug: 'login', status: 'done', tags: '[auth]' },
        "\n## TL;DR\nBody text with 'quotes' and a # hash.\n",
      ),
      '.codeadd/wiki/backend/api.md': fm({ type: 'reference', area: 'backend', description: 'x' }),
      'docs/features/0001F-login/notes.md': '# no frontmatter\n\nnot codeadd\'s file.\n',
    });

  const run = async (cwd) => {
    const { MIGRATIONS } = await import('../src/migrations.js');
    const m = MIGRATIONS.find((x) => x.id === ID);
    expect(m, `migration ${ID} must exist`).toBeTruthy();
    return m.run({ cwd, providers: [] });
  };

  it('L3.1 a retired type name is rewritten and the document then indexes', async () => {
    const cwd = brownfield();
    await run(cwd);
    const after = fs.readFileSync(path.join(cwd, 'docs/features/0001F-login/about.md'), 'utf8');
    expect(after).toMatch(/^type: feature$/m);
    const data = await load(cwd);
    expect(data.nodes.find((n) => n.id === '0001F').type).toBe('feature');
  });

  it('L3.2 a wiki page gains the id it already answered by, so no query result changes', async () => {
    const cwd = brownfield();
    await run(cwd);
    const after = fs.readFileSync(path.join(cwd, '.codeadd/wiki/backend/api.md'), 'utf8');
    expect(after, 'wiki/ plus the path under the wiki root, .md stripped — the id every page already answered by').toMatch(
      /^id: wiki\/backend\/api$/m,
    );
  });

  it('L3.3 every document body is byte-identical', async () => {
    const cwd = brownfield();
    const p = path.join(cwd, 'docs/features/0001F-login/about.md');
    const bodyBefore = fs.readFileSync(p, 'utf8').split(/^---$/m)[2];
    await run(cwd);
    expect(fs.readFileSync(p, 'utf8').split(/^---$/m)[2]).toBe(bodyBefore);
  });

  it('L3.3b every other frontmatter key is byte-identical — order, quoting, spacing', async () => {
    const cwd = brownfield();
    const p = path.join(cwd, 'docs/features/0001F-login/about.md');
    const before = fs.readFileSync(p, 'utf8').split(/^---$/m)[1].split('\n');
    await run(cwd);
    const after = fs.readFileSync(p, 'utf8').split(/^---$/m)[1].split('\n');
    expect(after.length, 'a YAML re-serialise passes L3.3 and fails here').toBe(before.length);
    for (let i = 0; i < before.length; i += 1) {
      if (before[i].startsWith('type:')) continue;
      expect(after[i]).toBe(before[i]);
    }
  });

  it('L3.4 a document it cannot parse is reported by path, not skipped silently', async () => {
    const cwd = brownfield();
    fs.writeFileSync(path.join(cwd, 'docs/features/0001F-login/broken.md'), '---\ntype: [unclosed\n', 'utf8');
    const outcome = await run(cwd);
    expect(JSON.stringify(outcome)).toMatch(/broken\.md/);
  });

  it('L3.5 it never deletes and never commits', async () => {
    const cwd = brownfield();
    const before = fs.readdirSync(path.join(cwd, 'docs/features/0001F-login')).sort();
    await run(cwd);
    expect(fs.readdirSync(path.join(cwd, 'docs/features/0001F-login')).sort()).toEqual(before);
    expect(fs.existsSync(path.join(cwd, '.git'))).toBe(false);
  });

  it('L3.6 0002 still harvests after the rename — the second suffix test is gone', async () => {
    const source = fs.readFileSync(path.join(REPO, 'cli', 'src', 'migrations.js'), 'utf8');
    expect(source, 'migrations.js:233 was a second endsWith(-about), invisible to the graph').not.toMatch(
      /endsWith\(['"]-about['"]\)/,
    );
  });
});

describe('L4 — the reference is generated, not hand-copied', () => {
  it('L4.1 the table in mcp/reference.md is byte-equal to the generator output', async () => {
    const { renderTypeTable } = await import('../../mcp/types.mjs');
    const ref = fs.readFileSync(path.join(REPO, 'mcp', 'reference.md'), 'utf8');
    expect(ref).toContain(renderTypeTable());
  });

  it('L4.2 the reference states the model it owns', () => {
    const ref = fs.readFileSync(path.join(REPO, 'mcp', 'reference.md'), 'utf8');
    for (const s of ['work-item', 'page', 'attachment', 'tutorial', 'how-to', 'explanation']) {
      expect(ref, `the reference must name ${s}`).toContain(s);
    }
    for (const s of ['caused_by', 'depends_on', 'part_of', 'links_to', 'superseded_by']) {
      expect(ref, `the reference must map ${s} to DCMI`).toContain(s);
    }
    expect(ref).toMatch(/dcterms:isPartOf/);
    expect(ref, 'both OKF divergences, with their reasons').toMatch(/Open Knowledge Format|OKF/);
  });

  it('L4.3 the product-layer skill binds a model change to a reference update', () => {
    const skill = fs.readFileSync(
      path.join(REPO, '.claude', 'skills', 'add-framework-product-layer', 'SKILL.md'),
      'utf8',
    );
    expect(skill).toMatch(/mcp\/reference\.md/);
    expect(skill, 'scoped to model changes, not to every mcp/ edit').toMatch(/same F-block/i);
  });
});

describe('L4b — the consumption rules reach the caller', () => {
  const skill = () =>
    fs.readFileSync(
      path.join(REPO, 'framwork', '.codeadd', 'skills', 'add-knowledge-discovery', 'SKILL.md'),
      'utf8',
    );

  it('L4b.1 an attachment is never returned on its own', () => {
    expect(skill()).toMatch(/attachment/i);
  });

  it('L4b.2 each kind answers a different question', () => {
    const s = skill();
    expect(s).toMatch(/work-item/);
    expect(s).toMatch(/\bpage\b/);
  });

  it('L4b.3 the degradation ladder is stated as one ordered sequence', () => {
    expect(skill()).toMatch(/index\s*→\s*git\s*→\s*nothing/);
  });

  it('L4b.4 the empty-vs-unavailable distinction survives the edit', () => {
    const s = skill();
    expect(s, 'regression guard on text F8 must not weaken').toMatch(/NOT VERIFIED/);
    expect(s).toMatch(/unavailable/);
  });
});

describe('L5 — the four measured defects are gone', () => {
  it('L5.1 a how-to page written exactly as add.wiki instructs is returned by search', async () => {
    const root = makeTree({
      // `docs/` is here because the corpus PROBE requires it, even though the
      // page lives under the wiki root. A wiki-only project is refused by a
      // corpus whose roots include the wiki — real, pre-existing, and outside
      // this plan; the ledger records it.
      'docs/features/0001F-x/about.md': fm({ id: '0001F', type: 'feature', slug: 'x', status: 'done' }),
      '.codeadd/wiki/backend/deploy.md': fm({
        id: 'wiki/backend/deploy',
        type: 'how-to',
        area: 'backend',
        description: 'how to deploy the service',
        tags: '[deploy]',
      }),
    });
    // The engine is what a caller actually reaches. Asserting only the corpus
    // would prove the page parsed, not that anyone can find it.
    const { run } = await import('../../mcp/engine.mjs');
    const hits = run('search', { terms: 'deploy' }, { corpus: 'docs', root }).hits;
    expect(hits.map((h) => h.id)).toContain('wiki/backend/deploy');
    expect(hits.find((h) => h.id === 'wiki/backend/deploy').kind).toBe('page');
  });

  it('L5.2 a typo in a type name is reported as unknown, not demoted to an attachment', async () => {
    const root = makeTree({
      'docs/features/0002F-x/about.md': fm({ id: '0002F', type: 'featrue', slug: 'x', status: 'done' }),
    });
    const data = await load(root);
    expect(skipReason(data, 'docs/features/0002F-x/about.md')).toMatch(/featrue/);
  });

  it('L5.3 a dropped attachment names which owner mode failed', async () => {
    const root = makeTree({
      'docs/changelog/CHG9999.md': fm({ id: 'CHG9999', type: 'changelog', related: '[]' }),
    });
    const data = await load(root);
    expect(skipReason(data, 'docs/changelog/CHG9999.md')).toMatch(/related|owner mode/);
  });

  it('L5.4 a reader of the registry classifies what the indexer classifies', async () => {
    const { CORPORA } = await import('../../mcp/corpora.mjs');
    const { TYPES } = await import('../../mcp/types.mjs');
    expect(CORPORA.docs.membership).toMatch(/registry/i);
    expect(CORPORA.docs.nodeRule, 'the node rule must not still say `-about`').not.toMatch(/-about/);
    expect(Object.keys(TYPES).some((t) => TYPES[t].kind === 'work-item')).toBe(true);
  });
});
