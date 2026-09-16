import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { run } from '../../mcp/engine.mjs';

/**
 * Plan 2026-09-14T145149 — the impact question: which deliveries touched this
 * file.
 *
 * Validation Matrix levels L2 and L3. L1 lives in
 * `framwork/.codeadd/scripts/tests/delivered.bats`, because the contract it
 * proves is bash.
 *
 * RED FIRST for the assertions that carry the change; each was confirmed
 * failing before F1 landed. Assertions that pass today are labelled GUARD at
 * the assertion — they are what stops the delivery from breaking something it
 * was not aiming at, and L3.6 is the sharpest of them.
 */

const REPO = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(REPO, 'framwork', '.codeadd');

const read = (...p) => fs.readFileSync(path.join(CODEADD, ...p), 'utf8');
const readRepo = (...p) => fs.readFileSync(path.join(REPO, ...p), 'utf8');

const SCRIPT = ['scripts', 'delivered.sh'];
const CONTRACT = ['skills', 'add-doc-schemas', 'references', 'delivery-index.md'];
const FIX = ['skills', 'add-doc-schemas', 'references', 'fix.md'];
const SKILL = ['skills', 'add-knowledge-discovery', 'SKILL.md'];

// ─── L2 — the written contracts describe what the code does ──────────────────

describe('L2.1 — the script header carries the new mode', () => {
  it('documents `touched`, its two layers and its exit codes', () => {
    const header = read(...SCRIPT).split('set -u')[0];
    expect(header).toMatch(/touched/);
    expect(header).toMatch(/complete/i);
    expect(header).toMatch(/curated/i);
  });
});

describe('L2.2 — the read contract documents the derivation', () => {
  const contract = () => read(...CONTRACT);

  it('states how a delivery commit is derived', () => {
    // Scoped to the pickaxe itself. A bare /derive/ matched an unrelated
    // sentence already in the file — "which no script can derive" — so the
    // assertion names the mechanism, not the word.
    expect(contract()).toMatch(/git log[^\n]*-S/);
  });

  it('states the derivation along the first parent, for both merge routes', () => {
    // Replaced a grep for the word "squash", which stayed green whatever the
    // paragraph claimed. The pickaxe must walk the first parent with -m, or a
    // PR merged with --merge resolves to its docs-only branch commit. The
    // behaviour itself is exercised in L2.3b below.
    const c = contract();
    expect(c).toMatch(/git log --first-parent -m [^\n]*-S/);
    expect(c).toMatch(/gh pr merge --merge/);
    expect(c).toMatch(/git merge --squash/);
    expect(c).not.toMatch(/the merge squashes that branch/);
  });

  it('names the one case where it does not hold', () => {
    // An index line recorded outside the normal flow resolves to a docs/-only
    // commit. Documenting the exception is what keeps the rule honest.
    expect(contract()).toMatch(/docs\/-only|only `docs\/`|only docs\//i);
  });

  it('records that `commits` holds branch shas, and why that is not the delivery on either route', () => {
    const c = contract();
    expect(c).toMatch(/holds the BRANCH shas/);
    expect(c).not.toMatch(/intersect `git log` on `main` at \*\*zero\*\*/);
  });
});

// ─── L3 — behavioural acceptance ─────────────────────────────────────────────

describe('L3.1 — the legacy reader is gone, with no branch left standing', () => {
  it('no trace of the retired schema survives in mcp/ or cli/src/', () => {
    // WIDENED after the narrow version let one through. It grepped only
    // `hotfix-related` and passed while `migrations.js` still read
    // `## Impacted Files` — the section name is knowledge of the dead schema
    // just as much as the type name is, and a guard that checks one and not the
    // other reports clean on a path that is still there.
    const hits = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(mjs|js|json)$/.test(e.name)
          && /hotfix-related|Impacted Files|parseImpactedFiles/.test(fs.readFileSync(full, 'utf8'))) {
          hits.push(path.relative(REPO, full).replace(/\\/g, '/'));
        }
      }
    };
    walk(path.join(REPO, 'mcp'));
    walk(path.join(REPO, 'cli', 'src'));
    expect(hits, `still referenced in: ${hits.join(', ')}`).toEqual([]);
  });

  it('parseImpactedFiles is absent from mcp/', () => {
    const corpora = readRepo('mcp', 'corpora.mjs');
    expect(corpora).not.toMatch(/parseImpactedFiles/);
  });

  it('fix.md carries no hotfix-related section', () => {
    expect(read(...FIX)).not.toMatch(/hotfix-related/);
  });
});

describe('L3.2 — the migration knows nothing of the retired schema', () => {
  const migrations = () => readRepo('cli', 'src', 'migrations.js');

  it('knows nothing about the retired schema at all', () => {
    // NOT "reports it differently" — knows nothing. The migration used to count
    // `## Impacted Files` into the harvest map, which claimed a harvest that
    // never happened. A first fix replaced the count with a note saying the
    // lists were found and not carried, which was still a live read of a dead
    // schema's section name.
    //
    // It is gone because those files were never hand-written: `/add.hotfix`
    // STEP 12 wrote them, so there is no author to inform and no content to
    // preserve. "Nothing of the dead format survives" is one grep; "everything
    // except a report line" is an exception the next author widens.
    const m = migrations();
    expect(m).not.toMatch(/impactedFiles/i);
    expect(m).not.toMatch(/Impacted Files/);
    expect(m).not.toMatch(/hotfix-related/);
  });

  it('a real brownfield run reports no legacy file list at all', async () => {
    // BEHAVIOUR, not text. Runs migration 0002 over the brownfield fixture —
    // which still carries a `hotfix-related` document with a filled
    // `## Impacted Files` — and proves the migration neither counts it, nor
    // mentions it, nor touches it.
    const { makeBrownfield, removeTree } = await import('./helpers/brownfield-fixture.js');
    const { MIGRATIONS } = await import('../src/migrations.js');
    const cwd = makeBrownfield();
    try {
      const outcome = MIGRATIONS.find((m) => m.id === '0002-harvest-relations').run({ cwd, providers: [] });
      const notes = (outcome.notes ?? []).join('\n');
      expect(notes).not.toMatch(/Impacted Files/i);
      expect(outcome.harvest).not.toHaveProperty('impactedFiles');
      // The legacy file itself is a user's and is never touched — the additive
      // rule this migration has always had.
      expect(fs.existsSync(path.join(cwd, 'docs/features/0051H-token-refresh/related.md'))).toBe(true);
    } finally {
      removeTree(cwd);
    }
  });

  it('still never deletes and never commits', () => {
    // GUARD. The additive-only rule is what makes the migration safe to run
    // unattended inside `codeadd update`, and this F-block must not weaken it.
    const m = migrations();
    expect(m).toMatch(/never deletes|additive/i);
  });
});

describe('L3.3 — the skill describes the two-layer answer', () => {
  const skill = () => read(...SKILL);

  it('the action table row states both layers', () => {
    const s = skill();
    expect(s).toMatch(/complete/i);
    expect(s).toMatch(/curated/i);
  });

  it('frames the structural question as enrichment, and names no plugin', () => {
    const s = skill();
    // TOOL-NEUTRAL, and this assertion was inverted after the ruler caught the
    // contradiction: STEP 7 of this same file states "no hard reference to any
    // specific graph plugin — mastery of a specific tool arrives via its own
    // plugin injection". Naming one in STEP 2 while forbidding it in STEP 7 is
    // the file disagreeing with itself, so the name came out and this checks it
    // stays out.
    expect(s).not.toMatch(/gitnexus/i);
    // What must survive is the FRAMING: the structural question adds to an
    // answer this step already produced in full, and never gates it. An answer
    // conditional on a plugin the user may not have installed is what umbrella
    // decision 24 forbids.
    expect(s).toMatch(/enrich|additive|adds? to/i);
    expect(s).toMatch(/works with no such plugin|plugin absent|default/i);
  });

  it('keeps the eleven-row table and the NOT VERIFIED label', () => {
    // GUARD. F7 edits one row; the rest of the step is not its business.
    const s = skill();
    expect(s).toContain('NOT VERIFIED');
    expect(s).toMatch(/### Which Action Answers Which Question/);
  });
});

describe('L3.6 — the rejected design did not come back', () => {
  // The first draft of this plan stored the delivery's sha and needed both
  // close-outs to write it after the merge. The review blocked that on two
  // verified consequences: the second index line has no route to `main`, and
  // `doWrite`'s re-validation can refuse it. A build that reaches for that
  // design brings both blockers with it.
  //
  // NARROWED DELIBERATELY, TWICE. A byte-identity check against `git show
  // main:<path>` throws in CI — actions/checkout defaults to fetch-depth 1 on a
  // detached merge ref, so `main` resolves to nothing — and it also went red on
  // any future legitimate edit to those files, which is a trap and not a guard.
  // A shape-matching regex then false-positived on `PR_MERGE_COMMIT`, a variable
  // add.done already parses, and again across lines.
  //
  // What is left is the one signal that cannot mean anything else: a flag or a
  // record field that carries a merge sha into the index. A guard that cries
  // wolf gets loosened until it means nothing, so this one asserts less and
  // means it.
  const REJECTED = /--record-merge|--merge-sha|"merge"\s*:/;

  it.each([
    'framwork/.codeadd/commands/add.done.md',
    'framwork/.codeadd/scripts/done.sh',
    '.claude/skills/add-framework--done/SKILL.md',
    'framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md',
  ])('%s carries no stored merge sha', (rel) => {
    const body = fs.readFileSync(path.join(REPO, rel), 'utf8');
    expect(REJECTED.test(body), `${rel} looks like it stores the delivery's commit — see this block's comment`).toBe(false);
  });
});

// ─── L2.3 / L2.4 — the delegation, exercised rather than degraded ────────────

describe('L2.3 — touched_by answers from a real project in the current format', () => {
  // THE HEADLINE LEVEL, and it was missing. Every other docs-corpus assertion
  // in this repository exercises the DEGRADED path — a bare fixture with no
  // script and no history — which left the engine's whole parsing block (the
  // JSONL/KEY=VALUE split, the answer/commit/matched mapping, curatedOnly) run
  // by no test at all. Two independent auditors called the delivery "green by
  // degradation" and they were right.
  //
  // This builds a project in the CURRENT format: a work item with typed
  // frontmatter, no `hotfix-related` document anywhere, the shipped script at
  // the path a real install uses, and one squash commit carrying both the code
  // and the index line.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'touched-by-e2e-'));

  beforeAll(() => {
    const run = (args) => execFileSync('git', args, { cwd: tmp, stdio: 'ignore' });
    run(['init', '-q']);
    run(['config', 'user.email', 'test@example.com']);
    run(['config', 'user.name', 'test']);

    fs.mkdirSync(path.join(tmp, '.codeadd', 'scripts'), { recursive: true });
    fs.copyFileSync(
      path.join(REPO, 'framwork', '.codeadd', 'scripts', 'delivered.sh'),
      path.join(tmp, '.codeadd', 'scripts', 'delivered.sh'),
    );

    fs.mkdirSync(path.join(tmp, 'src', 'auth'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'src', 'auth', 'token.ts'), 'export function refreshToken() { return 1; }\n');
    fs.writeFileSync(path.join(tmp, 'src', 'auth', 'login.ts'), 'export function loginHandler() { return 1; }\n');

    fs.mkdirSync(path.join(tmp, 'docs', 'features', '0051F-refresh'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'docs', 'features', '0051F-refresh', 'about.md'),
      '---\nid: 0051F\ntype: feature\n---\n# Refresh\n## TL;DR\nRenews the token before it expires.\n## Relations\nNone\n',
    );

    const entry = {
      v: 1, ts: '2026-09-01T00:00:00Z', id: '0051F', layer: 'product', by: 'done',
      status: 'live', name: 'token refresh', words: 'token refresh expiry',
      commits: ['aaaaaaa'], origin: 'docs/features/0051F-refresh/',
      items: [{ what: 'the refresh', at: 'src/auth/token.ts', find: 'refreshToken' }],
    };
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs', 'delivered.jsonl'), `${JSON.stringify(entry)}\n`);

    // ONE commit: code and index line together, which is what a squashed branch
    // looks like on the default branch. The merge-commit shape the PR route
    // now produces is L2.3b.
    run(['add', '-A']);
    run(['commit', '-q', '-m', 'squash: token refresh']);
  });

  afterAll(() => {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* windows file locks */ }
  });

  it('returns the delivery, in the complete layer, with its commit', () => {
    const result = run('touched_by', { files: ['src/auth/token.ts'] }, { root: tmp, corpus: 'docs' });
    expect(result.unavailable).toBeUndefined();
    expect(result.workItems).toHaveLength(1);
    const hit = result.workItems[0];
    expect(hit.id).toBe('0051F');
    expect(hit.answer).toBe('complete');
    expect(hit.commit).toMatch(/^[0-9a-f]{7,}$/);
    expect(hit.matched).toEqual(['src/auth/token.ts']);
  });

  it('answers for a file the delivery changed but never anchored', () => {
    // `login.ts` is in the commit and in no `items[].at`. The complete layer is
    // the whole diff, so it answers — which is the difference between the two
    // layers stated as a test rather than as a sentence.
    const result = run('touched_by', { files: ['src/auth/login.ts'] }, { root: tmp, corpus: 'docs' });
    expect(result.workItems.map((w) => w.answer)).toEqual(['complete']);
    expect(result.workItems[0].matched).toEqual(['src/auth/login.ts']);
  });

  it('a path no delivery touched comes back empty, and is not an error', () => {
    const result = run('touched_by', { files: ['src/nowhere.ts'] }, { root: tmp, corpus: 'docs' });
    expect(result.workItems).toEqual([]);
    expect(result.unavailable).toBeUndefined();
  });

  it('L2.4 the answer carries the curated-only count', () => {
    // The plan named this level the mitigation for its one High-probability
    // risk — the two layers read as one. Nothing asserted it at engine level.
    const result = run('touched_by', { files: ['src/auth/token.ts'] }, { root: tmp, corpus: 'docs' });
    expect(result).toHaveProperty('curatedOnly');
    expect(Number.isNaN(result.curatedOnly)).toBe(false);
    expect(result.curatedOnly).toBe(0);
  });

  it('L2.5 records what one query costs, rather than asserting a guessed threshold', () => {
    const started = Date.now();
    run('touched_by', { files: ['src/auth/token.ts'] }, { root: tmp, corpus: 'docs' });
    const ms = Date.now() - started;
    // Printed, not asserted. The plan asked for the number in the output so it
    // is visible when it starts to matter; an earlier design cost 10.3s per
    // query on this repository's own index and nothing would have said so.
    // eslint-disable-next-line no-console
    console.log(`    [L2.5] touched_by over a 1-entry index: ${ms}ms`);
    expect(ms).toBeLessThan(60_000);
  });
});

// ─── L2.3b — the derivation, exercised on BOTH merge routes ──────────────────

describe('L2.3b — the delivery commit is derived correctly after a merge AND after a squash', () => {
  // Plan 2026-09-16T170340 L4.6. The contract's reason used to be "the merge
  // squashes that branch", and its only test grepped for the word — green
  // whatever the paragraph said. The PR route now merges with --merge, which
  // lands the code and the index line in separate branch commits. This builds
  // both shapes with real git and asks the engine, so the derivation is what
  // is proven, not a sentence.
  const make = (shape) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `touched-by-${shape}-`));
    const g = (args) => execFileSync('git', args, { cwd: tmp, encoding: 'utf8' }).trim();
    g(['init', '-q']);
    g(['config', 'user.email', 'test@example.com']);
    g(['config', 'user.name', 'test']);
    fs.mkdirSync(path.join(tmp, '.codeadd', 'scripts'), { recursive: true });
    fs.copyFileSync(
      path.join(REPO, 'framwork', '.codeadd', 'scripts', 'delivered.sh'),
      path.join(tmp, '.codeadd', 'scripts', 'delivered.sh'),
    );
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'README.md'), 'base\n');
    g(['add', '-A']);
    g(['commit', '-q', '-m', 'base']);
    const trunk = g(['rev-parse', '--abbrev-ref', 'HEAD']);

    g(['checkout', '-q', '-b', 'feat']);
    fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'src', 'pay.ts'), 'export const chargeCard = 1;\n');
    g(['add', '-A']);
    g(['commit', '-q', '-m', 'F1: code']);
    const entry = {
      v: 1, ts: '2026-09-16T00:00:00Z', id: 'PAY', layer: 'product', by: 'done',
      status: 'live', name: 'payments', words: 'payments charge',
      commits: ['aaaaaaa'], origin: 'docs/features/PAY/',
      items: [{ what: 'the charge', at: 'src/pay.ts', find: 'chargeCard' }],
    };
    fs.writeFileSync(path.join(tmp, 'docs', 'delivered.jsonl'), `${JSON.stringify(entry)}\n`);
    g(['add', '-A']);
    g(['commit', '-q', '-m', 'docs: index entry']);
    g(['checkout', '-q', trunk]);
    if (shape === 'merge') {
      g(['merge', '-q', '--no-ff', 'feat', '-m', 'Merge pull request']);
    } else {
      g(['merge', '-q', '--squash', 'feat']);
      g(['commit', '-q', '-m', 'squash: payments']);
    }
    return { tmp, head: g(['rev-parse', '--short', 'HEAD']) };
  };

  it.each(['merge', 'squash'])('%s: answers complete, with the commit that landed on the default branch', (shape) => {
    const { tmp, head } = make(shape);
    try {
      const result = run('touched_by', { files: ['src/pay.ts'] }, { root: tmp, corpus: 'docs' });
      expect(result.workItems).toHaveLength(1);
      const hit = result.workItems[0];
      expect(hit.answer).toBe('complete');
      expect(head.startsWith(hit.commit) || hit.commit.startsWith(head)).toBe(true);
      expect(result.curatedOnly).toBe(0);
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* windows file locks */ }
    }
  // Six git subprocesses plus the script: measured at ~5.5s on Windows, past
  // the 5000ms default. The budget is the fixture, not the query.
  }, 60_000);
});
