import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

import { FEATURES } from '../src/features.js';

/**
 * Delivery index — the validation matrix for plan
 * `docs/plans/2026-09-07T160328-PLAN--delivery-index.md`.
 *
 * RED FIRST. This file is authored and confirmed FAILING against the tree
 * before F1 lands, and stays red until F14. That is the plan's own discipline
 * ("every level written and confirmed failing BEFORE any F-block lands") and
 * its Reviewer Handoff item 1 — a test written after the fix proves nothing.
 *
 * It is the home the plan's Ecosystem Impact table names for L2, L3 and L4's
 * assertions. Two things are deliberately NOT here:
 *
 *   - L1 lives in `framwork/.codeadd/scripts/tests/delivered.bats`. The script
 *     contract is bash, and bats is where every other script in this framework
 *     is proven.
 *   - L4.1-L4.5 (toggle states, shared-anchor non-collision, partial disable,
 *     order independence, full round-trip) are covered by
 *     `injection-exclusivity.integration.test.js` and
 *     `injection-roundtrip.integration.test.js`, both of which already iterate
 *     GENERICALLY over `FEATURES` and the sidecar. Registering `docs-pruning`
 *     enrols it in both. Writing them again here would be a second copy that
 *     drifts.
 *
 * The baselines below are ABSOLUTE, measured on the tree before this plan:
 * 39 injection points, of which exactly 1 on `add.done` (`plugin:gitnexus:
 * graph-reindex`), and 1 contract. "No NEW warnings" is not the bar — the
 * measured `ADD_GRAPH_WARNINGS=1` count is zero, so any warning is this plan's.
 */

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const exists = (...p) => fs.existsSync(path.join(...p));

const SIDECAR = () => JSON.parse(read(CODEADD, 'injection-points.json'));
const GRAPH = () => JSON.parse(read(CODEADD, 'artefact-graph.json'));
const CONTRACTS = () => JSON.parse(read(CODEADD, 'contracts.json'));

const REFERENCE = path.join(CODEADD, 'skills', 'add-doc-schemas', 'references', 'delivery-index.md');
const SCRIPT = path.join(CODEADD, 'scripts', 'delivered.sh');
const BATS = path.join(CODEADD, 'scripts', 'tests', 'delivered.bats');
const FRAGMENT = path.join(CODEADD, 'fragments', 'docs-pruning', 'add.done.md');

const cmd = (name) => read(CODEADD, 'commands', `${name}.md`);
const skill = (name) => read(CODEADD, 'skills', name, 'SKILL.md');

/** The `<!-- uses: -->` block, read from raw source the way build.js reads it. */
function usesBlock(content) {
  const m = content.match(/<!--\s*uses:\s*([\s\S]*?)-->/);
  return m ? m[1] : '';
}

/** Graph edges excluding MENTIONS, which `dependencies` also excludes. */
function dependencyTargets(graph, fromName) {
  const from = graph.nodes.find((n) => n.name === fromName && n.layer === 'product');
  if (!from) return [];
  return graph.edges
    .filter((e) => e.from === from.id && e.type !== 'MENTIONS')
    .map((e) => graph.nodes.find((n) => n.id === e.to)?.name)
    .filter(Boolean);
}

describe('L2 — build integrity', () => {
  // ─── L2.2 — the graph gains three nodes and four dependency edges ──────────
  //
  // Asserted POSITIVELY, per the plan: the build is the primary gate (naming
  // `delivered.sh` in prose without declaring it fails at build.js:1117), so
  // this level proves the declarations landed CORRECTLY, not merely that
  // something landed.

  it('L2.2: artefact-graph carries the new script node', () => {
    const g = GRAPH();
    const node = g.nodes.find((n) => n.id === 'product/script/delivered.sh');
    expect(node, 'delivered.sh missing from the artefact graph').toBeTruthy();
    expect(node.kind).toBe('script');
    // Scripts are pushed with registered = true hardcoded (build.js:845) —
    // they are NOT in provider-map.json and must never be added to it.
    expect(node.registered).toBe(true);
  });

  it('L2.2: artefact-graph carries the new reference node', () => {
    const g = GRAPH();
    const node = g.nodes.find(
      (n) => n.id === 'product/reference/add-doc-schemas/references/delivery-index.md',
    );
    expect(node, 'delivery-index.md missing from the artefact graph').toBeTruthy();
    expect(node.kind).toBe('reference');
  });

  it('L2.2: artefact-graph carries the new fragment node', () => {
    const g = GRAPH();
    const node = g.nodes.find((n) => n.kind === 'fragment' && n.name.includes('docs-pruning'));
    expect(node, 'docs-pruning fragment missing from the artefact graph').toBeTruthy();
  });

  it('L2.2: the four consumers each declare delivered.sh as a dependency', () => {
    const g = GRAPH();
    for (const consumer of ['add.done', 'add.hotfix', 'add-knowledge-discovery']) {
      expect(
        dependencyTargets(g, consumer),
        `${consumer} does not depend on delivered.sh`,
      ).toContain('delivered.sh');
    }
    // add.brainstorm reaches the index through the skill, not the script —
    // F11 declares `- skill: add-knowledge-discovery`, which is the fourth edge.
    expect(
      dependencyTargets(g, 'add.brainstorm'),
      'add.brainstorm does not depend on add-knowledge-discovery',
    ).toContain('add-knowledge-discovery');
  });

  it('L2.2: add-doc-schemas depends on the new reference', () => {
    const g = GRAPH();
    expect(dependencyTargets(g, 'add-doc-schemas')).toContain(
      'add-doc-schemas/references/delivery-index.md',
    );
  });

  // ─── L2.3 — injection surface: baseline + 1, and gitnexus still resolves ───

  it('L2.3: the injection-point total is the absolute baseline 39 + 1', () => {
    expect(SIDECAR().points).toHaveLength(40);
  });

  it('L2.3: add.done carries exactly two injection points — gitnexus and docs-pruning', () => {
    const onDone = SIDECAR().points.filter(
      (p) => p.resource.kind === 'command' && p.resource.name === 'add.done',
    );
    expect(onDone).toHaveLength(2);

    const gitnexus = onDone.find((p) => p.namespace === 'plugin' && p.name === 'gitnexus');
    expect(gitnexus, 'the pre-existing gitnexus point on add.done was lost').toBeTruthy();
    expect(gitnexus.section).toBe('graph-reindex');

    const pruning = onDone.find((p) => p.namespace === 'feature' && p.name === 'docs-pruning');
    expect(pruning, 'docs-pruning has no injection point on add.done').toBeTruthy();
  });

  it('L2.3: every add.done anchor still resolves in the built command', () => {
    // An anchor whose text no longer exists is the exact failure three edits to
    // one file invite. Resolve each against the BUILT Claude command, which is
    // what the installer injects into.
    const built = read(ROOT, 'framwork', '.claude', 'commands', 'add.done.md');
    const onDone = SIDECAR().points.filter(
      (p) => p.resource.kind === 'command' && p.resource.name === 'add.done',
    );
    for (const p of onDone) {
      const hits = built.split('\n').filter((l) => l.trim() === p.anchor.text.trim()).length;
      expect(hits, `anchor "${p.anchor.text}" does not resolve in the built add.done`)
        .toBeGreaterThanOrEqual(p.anchor.ordinal);
      if (p.anchor.next) {
        expect(built, `drift hint "${p.anchor.next}" is gone from add.done`).toContain(
          p.anchor.next,
        );
      }
    }
  });

  it('L2.3: docs-pruning injects AFTER the entry write, never before it', () => {
    // F13's second refusal — never prune when no entry was written this run —
    // is only structurally satisfiable if the block lands after STEP 6 wrote it.
    const source = cmd('add.done');
    const pruning = SIDECAR().points.find(
      (p) => p.namespace === 'feature' && p.name === 'docs-pruning',
    );
    expect(pruning.anchor.position).toBe('after');
    const anchorAt = source.indexOf(pruning.anchor.text);
    const writeAt = source.indexOf('delivered.sh write');
    expect(anchorAt, 'the docs-pruning anchor is not in add.done source').toBeGreaterThan(-1);
    expect(writeAt, 'STEP 6 never calls `delivered.sh write`').toBeGreaterThan(-1);
    expect(anchorAt, 'the pruning anchor sits above the entry write').toBeGreaterThan(writeAt);
  });

  // ─── L2.4 — contracts.json untouched ──────────────────────────────────────

  it('L2.4: contracts.json is unchanged — this plan materializes nothing', () => {
    const c = CONTRACTS();
    const names = Object.keys(c).filter((k) => k !== 'version');
    expect(names).toHaveLength(1);
    expect(JSON.stringify(c)).not.toContain('delivered');
    expect(JSON.stringify(c)).not.toContain('docs-pruning');
  });

  // ─── L2.4b — F2 and F12, which no other level covers ───────────────────────

  it('L2.4b: F2 — add-doc-schemas registers the reference in its uses block', () => {
    expect(usesBlock(skill('add-doc-schemas'))).toContain(
      '- skill: add-doc-schemas/references/delivery-index.md',
    );
  });

  it('L2.4b: F2 — the skill lists the reference WITHOUT reclassifying it as a doc schema', () => {
    const s = skill('add-doc-schemas');
    expect(s, 'no row names references/delivery-index.md').toMatch(
      /references\/delivery-index\.md/,
    );
    // The Schema Index by Category table is the doc-schema registry. A row for
    // this reference inside it would declare a minified machine log to be a
    // markdown doc an agent authors — the exact miscategorisation F1 forbids.
    // Slice to the NEXT H2, not to a named one: anything else between them is
    // a section of its own and not part of the index.
    const head = s.indexOf('## Schema Index by Category');
    const rest = s.slice(head + 3);
    const next = rest.search(/^## /m);
    const indexSection = next === -1 ? rest : rest.slice(0, next);
    expect(indexSection, 'delivery-index was filed as a doc schema').not.toContain(
      'delivery-index',
    );
    // …and it IS listed, under a heading that says what it is instead.
    expect(s, 'no section separates format references from doc schemas').toMatch(
      /^## Format References/m,
    );
  });

  it('L2.4b: F12 — features.js registers docs-pruning, disabled by default', () => {
    expect(FEATURES['docs-pruning'], 'docs-pruning is not in the FEATURES registry').toBeTruthy();
    expect(FEATURES['docs-pruning'].default).toBe(false);
    expect(FEATURES['docs-pruning'].commands).toEqual(['add.done']);
  });

  // ─── L2.5 — packaging, and the per-provider script directory that must not
  //             be invented ─────────────────────────────────────────────────

  it('L2.5: delivered.sh sits under .codeadd/scripts and release.yml packages it', () => {
    expect(exists(SCRIPT)).toBe(true);
    const yml = read(ROOT, '.github', 'workflows', 'release.yml');
    expect(yml).toContain('.codeadd/scripts');
  });

  it('L2.5: no provider has its own scripts directory', () => {
    // CLAUDE.md's Resource Path Variables table: scripts are "Always
    // .codeadd/scripts/ (no variable needed)". A framwork/<provider>/scripts/
    // would be an invented second home.
    const framwork = path.join(ROOT, 'framwork');
    const providerDirs = fs
      .readdirSync(framwork, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('.') && d.name !== '.codeadd');
    for (const d of providerDirs) {
      expect(
        exists(framwork, d.name, 'scripts'),
        `framwork/${d.name}/scripts exists — scripts have no per-provider directory`,
      ).toBe(false);
    }
  });
});

describe('L3 — command integration', () => {
  it('L3.1: add.done STEP 6 writes the entry and commits nothing itself', () => {
    const c = cmd('add.done');
    expect(c).toContain('delivered.sh write');
    const step6 = c.slice(c.indexOf('## STEP 6'), c.indexOf('## STEP 7'));
    expect(step6, 'STEP 6 does not author the index entry').toContain('delivered.sh');
    expect(step6, 'STEP 6 must leave the entry in the working tree').toMatch(
      /DO NOT USE: Bash for git|working tree/,
    );
  });

  it('L3.2: add.done STEP 7 renders the entry and stays informative', () => {
    const c = cmd('add.done');
    const step7 = c.slice(c.indexOf('## STEP 7'), c.indexOf('## STEP 8'));
    expect(step7, 'STEP 7 does not preview the entry').toMatch(/entry|delivered/i);
    expect(step7, 'STEP 7 must render every item with its find string').toContain('find');
    expect(step7).toContain('DO NOT ask for confirmation');
  });

  it('L3.3: done.sh selects its merge mode by a pre-check, never by a conflict', () => {
    const done = read(CODEADD, 'scripts', 'done.sh');
    expect(done, 'no deterministic pre-check for the PR path').toContain('main...');
    expect(done, 'the direct-commit mode is missing').toMatch(/MERGE_MODE/);
    // FIX-14's empty-diff handling must survive.
    expect(done).toContain('MERGE_COMMIT=SKIPPED');
  });

  it('L3.4: add.pull-request names the owed entry', () => {
    const c = cmd('add.pull-request');
    const step8 = c.slice(c.indexOf('## STEP 8'));
    expect(step8, 'the post-merge guidance never mentions the owed index entry').toMatch(
      /delivery index|index entry/i,
    );
  });

  it('L3.5: add.hotfix STEP 4 reads the index with --no-verify and loads no wiki', () => {
    const c = cmd('add.hotfix');
    const step4 = c.slice(c.indexOf('## STEP 4'), c.indexOf('## STEP 5'));
    expect(step4, 'STEP 4 does not read the index').toContain('delivered.sh read');
    expect(step4, '--no-verify is the whole reason this is allowed at STEP 4').toContain(
      '--no-verify',
    );
    expect(step4, 'STEP 4 must load no wiki page').not.toMatch(/wiki\/(index|domains|conventions)/);
    expect(usesBlock(c)).toContain('- script: delivered.sh');
  });

  it('L3.5: add-knowledge-discovery lands all THREE pieces, never two', () => {
    const s = skill('add-knowledge-discovery');
    // 1. the INDEX procedure, standalone-loadable
    expect(s, 'no INDEX step').toMatch(/INDEX/);
    expect(s, 'the INDEX step is not marked standalone-loadable').toMatch(/standalone/i);
    // 2. the When NOT to Use amendment — wiki stays out of hotfix 4-6, index does not
    const notToUse = s.slice(s.indexOf('## When NOT to Use'), s.indexOf('## The 7-Step'));
    expect(notToUse, 'the wiki-blind bullet was not amended for the index').toMatch(/index/i);
    // 3. the When to Use addition for F10's entry point
    const toUse = s.slice(s.indexOf('## When to Use'), s.indexOf('## When NOT to Use'));
    expect(toUse, 'STEP 4 is documented as unreachable — the entry point is missing').toMatch(
      /STEP 4|--no-verify/,
    );
    expect(usesBlock(s)).toContain('- script: delivered.sh');
  });

  it('L3.6: add.brainstorm STEP 1 swaps the unranked sweep for the ranked lookup', () => {
    const c = cmd('add.brainstorm');
    const step1 = c.slice(c.indexOf('## STEP 1:'), c.indexOf('## STEP 1.5'));
    expect(step1, 'the skill is not loaded at STEP 1').toContain('add-knowledge-discovery');
    expect(step1, 'about.md is not deep-read for matched entries').toContain('about.md');
    expect(
      step1,
      'the unranked docs/features/ sweep is still there — the index REPLACES it',
    ).not.toMatch(/implemented features from `?docs\/features\//);
    expect(usesBlock(c)).toContain('- skill: add-knowledge-discovery');
  });

  it('L3.7: an absent index is a no-op with a note, inside the INDEX step itself', () => {
    // Scoped to the INDEX sub-procedure. A repo-wide grep for "absent" passes
    // on the pre-existing `WIKI:absent` line and proves nothing about the index.
    const s = skill('add-knowledge-discovery');
    const start = s.search(/^#+ .*INDEX/m);
    expect(start, 'there is no INDEX section to scope to').toBeGreaterThan(-1);
    // Slice past the heading LINE, not past its first character: `^` matches at
    // index 0 under /m, so slicing at start+1 makes the next-heading search
    // return 0 and the section collapse to the empty string.
    const rest = s.slice(s.indexOf('\n', start) + 1);
    const end = rest.search(/^#+ /m);
    const indexStep = end === -1 ? rest : rest.slice(0, end);
    expect(indexStep, 'the INDEX step never says what happens without an index').toMatch(
      /absent|missing|no index|does not exist/i,
    );
    expect(indexStep, 'index absence must be a no-op with a note, never an error').toMatch(
      /no-op|note|proceed/i,
    );
  });
});

describe('L4 — docs-pruning, the parts the generic injection suites do not cover', () => {
  // L4.1-L4.5 are covered by injection-exclusivity + injection-roundtrip, both
  // generic over FEATURES. What follows is the fragment's own content contract.

  it('L4.6: the fragment deletes exactly the four files, and names the kept set', () => {
    const f = read(FRAGMENT);
    for (const pruned of ['discovery.md', 'tasks.md', 'epic.md', 'review-']) {
      expect(f, `the fragment does not prune ${pruned}`).toContain(pruned);
    }
    // The kept list is the plan's correction of the umbrella's level-2 list.
    // A fragment that deletes plan.md or iterations.* degrades /add.hotfix,
    // /add.diagnose and /add.new — the commands this design exists to serve.
    for (const kept of ['plan.md', 'about.md', 'design.md', 'changelog.md', 'decisions.jsonl', 'iterations']) {
      expect(f, `${kept} is not named in the kept list`).toContain(kept);
    }
    expect(f, 'the fragment deletes the whole feature folder — level 3 was rejected').not.toMatch(
      /rm -rf\s+"?\$\{?DIR/,
    );
  });

  it('L4.7: both hard refusals are in the fragment', () => {
    const f = read(FRAGMENT);
    expect(f, 'refusal 1 — never delete an untracked file — is missing').toMatch(
      /untracked/i,
    );
    expect(f, 'refusal 2 — never prune when no entry was written — is missing').toMatch(
      /no entry|entry was (not )?written|write failed/i,
    );
  });

  it('L4.8: the fragment is section-wrapped so the injector can find it', () => {
    const f = read(FRAGMENT);
    const open = f.match(/<!--\s*section:([\w-]+)\s*-->/);
    expect(open, 'no <!-- section:NAME --> marker').toBeTruthy();
    expect(f).toContain(`<!-- /section:${open[1]} -->`);
  });
});

describe('L5.7 — every F-block landed', () => {
  const LANDED = [
    ['F1  reference', () => exists(REFERENCE)],
    ['F2  skill registration', () => usesBlock(skill('add-doc-schemas')).includes('delivery-index.md')],
    ['F3  delivered.sh', () => exists(SCRIPT)],
    ['F4  delivered.bats', () => exists(BATS)],
    ['F5  add.done STEP 6 write', () => cmd('add.done').includes('delivered.sh write')],
    // Scoped to the STEP 7 slice. An unscoped /STEP 7[\s\S]*find/ matches the
    // word "find" anywhere below STEP 7 and is green before F6 lands.
    ['F6  add.done STEP 7 preview', () => {
      const c = cmd('add.done');
      const step7 = c.slice(c.indexOf('## STEP 7'), c.indexOf('## STEP 8'));
      return /delivered|index entry/i.test(step7) && step7.includes('find');
    }],
    ['F7  done.sh pre-check', () => read(CODEADD, 'scripts', 'done.sh').includes('MERGE_MODE')],
    ['F8  add.pull-request notice', () => /index entry|delivery index/i.test(cmd('add.pull-request'))],
    ['F9  knowledge-discovery INDEX', () => skill('add-knowledge-discovery').includes('delivered.sh')],
    ['F10 hotfix STEP 4', () => cmd('add.hotfix').includes('--no-verify')],
    ['F11 brainstorm STEP 1', () => cmd('add.brainstorm').includes('add-knowledge-discovery')],
    ['F12 features registry', () => Boolean(FEATURES['docs-pruning'])],
    ['F13 fragment', () => exists(FRAGMENT)],
    ['F14 injection marker', () =>
      SIDECAR().points.some((p) => p.namespace === 'feature' && p.name === 'docs-pruning')],
  ];

  it.each(LANDED)('%s', (_label, probe) => {
    expect(probe()).toBe(true);
  });
});
