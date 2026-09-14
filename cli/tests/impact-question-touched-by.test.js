import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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

  it('says why the derivation is correct by construction', () => {
    // The line is committed on the branch and the merge squashes that branch.
    expect(contract()).toMatch(/squash/i);
  });

  it('names the one case where it does not hold', () => {
    // An index line recorded outside the normal flow resolves to a docs/-only
    // commit. Documenting the exception is what keeps the rule honest.
    expect(contract()).toMatch(/docs\/-only|only `docs\/`|only docs\//i);
  });

  it('records that `commits` holds branch shas a squash makes unreachable', () => {
    expect(contract()).toMatch(/unreachable|discard/i);
  });
});

// ─── L3 — behavioural acceptance ─────────────────────────────────────────────

describe('L3.1 — the legacy reader is gone, with no branch left standing', () => {
  it('no `hotfix-related` reference survives in mcp/ or cli/src/', () => {
    const hits = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(mjs|js|json)$/.test(e.name) && /hotfix-related/.test(fs.readFileSync(full, 'utf8'))) {
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

describe('L3.2 — the migration reports the loss instead of counting a harvest', () => {
  const migrations = () => readRepo('cli', 'src', 'migrations.js');

  it('no longer counts Impacted Files into the harvest map', () => {
    expect(migrations()).not.toMatch(/harvest\.impactedFiles/);
  });

  it('says the legacy lists do not enter the new format', () => {
    expect(migrations()).toMatch(/do not enter|not carried|left on disk/i);
  });

  it('a real brownfield run says the legacy list was found and not carried', async () => {
    // BEHAVIOUR, not text. The two assertions above read the source, which
    // proves the code was edited and not that the note ever reaches a user.
    // This runs migration 0002 over the brownfield fixture — which carries a
    // `hotfix-related` document with a filled `## Impacted Files` — and reads
    // what it reports.
    const { makeBrownfield, removeTree } = await import('./helpers/brownfield-fixture.js');
    const { MIGRATIONS } = await import('../src/migrations.js');
    const cwd = makeBrownfield();
    try {
      const outcome = MIGRATIONS.find((m) => m.id === '0002-harvest-relations').run({ cwd, providers: [] });
      const notes = (outcome.notes ?? []).join('\n');
      expect(notes).toMatch(/legacy `## Impacted Files` list/);
      expect(notes).toMatch(/do not enter the new format/);
      // And it is NOT filed under "harvested", which is the claim that hid the
      // gap for as long as it did.
      expect(notes).not.toMatch(/harvested[^\n]*impactedFiles/);
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

  it('names gitnexus as enrichment, never as part of the answer', () => {
    const s = skill();
    expect(s).toMatch(/gitnexus/i);
    // The word that matters: it ADDS. An answer conditional on a plugin the
    // user may not have installed is what umbrella decision 24 forbids.
    expect(s).toMatch(/enrich|additive|on top/i);
  });

  it('keeps the eleven-row table and the NOT VERIFIED label', () => {
    // GUARD. F7 edits one row; the rest of the step is not its business.
    const s = skill();
    expect(s).toContain('NOT VERIFIED');
    expect(s).toMatch(/### Which Action Answers Which Question/);
  });
});

describe('L3.6 — neither close-out was touched', () => {
  // GUARD, and the sharpest one here. The first draft of this plan stored the
  // delivery's sha and needed both close-outs to write it; the review blocked
  // that on two verified consequences. A build that edits either file has
  // reached for the design this plan rejected, and the blockers come back with
  // it. `done.sh` owns every local git write and keeps that monopoly.
  //
  // Asserted byte-for-byte against the branch point, not by looking for words:
  // a word check hit `PR_MERGE_COMMIT`, a variable add.done already parses.
  const unchanged = (rel) => {
    const onMain = execFileSync('git', ['show', `main:${rel}`], {
      cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    });
    const here = fs.readFileSync(path.join(REPO, rel), 'utf8');
    return { onMain, here };
  };

  it.each([
    'framwork/.codeadd/commands/add.done.md',
    '.claude/commands/add-framework--done.md',
    'framwork/.codeadd/scripts/done.sh',
  ])('%s is byte-identical to the branch point', (rel) => {
    const { onMain, here } = unchanged(rel);
    expect(here, `${rel} was edited — see L3.6's comment`).toBe(onMain);
  });
});
