import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-09-11T014333 — product close-out parity.
 *
 * The content matrix for the plan's Validation Matrix. It is written one level
 * at a time, each level RED against the tree immediately before the F-block it
 * covers lands — a level authored after its fix proves nothing.
 *
 * Two classes of level are deliberately NOT here, and the plan's per-F-block
 * validation runs them instead, recording the result in the build ledger:
 *
 *   - Graph queries (`node scripts/graph.js orphans`, `impact`, `history`).
 *     The artefact graph is a gitignored sidecar, so a CI checkout has no graph
 *     to query until `build.js` has run. The sibling suite for the close-out
 *     hardening plan states the same exclusion for the same reason.
 *   - `CLAUDE.md`'s generated inventory block. It lists every script by name,
 *     so it names `feature-pr.sh` until `node scripts/inventory.js` regenerates
 *     it at the build's STEP 8. F1 is tagged `[product]` and is forbidden from
 *     writing `CLAUDE.md` at all, so an assertion over that block would demand
 *     a layer violation to go green.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const P = {
  pullRequest: path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.pull-request.md'),
  featurePrScript: path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'feature-pr.sh'),
  featurePrBats: path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'tests', 'feature-pr.bats'),
  ecosystem: path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add-ecosystem', 'SKILL.md'),
};

const exists = (p) => fs.existsSync(p);
const read = (p) => (exists(p) ? fs.readFileSync(p, 'utf8') : '');

/** The `<!-- uses: -->` block, or '' when the artefact declares none. */
function uses(text) {
  return text.match(/<!--\s*uses:[\s\S]*?-->/)?.[0] ?? '';
}

/**
 * Every tracked source file that could name a script, excluding the two places
 * the header explains: the gitignored graph sidecar and `CLAUDE.md`'s generated
 * inventory block.
 */
function sourceFiles() {
  const roots = [
    path.join(ROOT, 'framwork', '.codeadd'),
    path.join(ROOT, '.claude'),
    path.join(ROOT, 'cli', 'src'),
  ];
  const out = [];
  const walk = (dir) => {
    if (!exists(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'worktrees') continue;
        walk(full);
      } else if (/\.(md|sh|js|json|bats)$/.test(entry.name)) {
        out.push(full);
      }
    }
  };
  roots.forEach(walk);
  return out;
}

describe('L1 — the deletion (F1)', () => {
  it('L1.1: feature-pr.sh and its bats suite are absent', () => {
    expect(exists(P.featurePrScript)).toBe(false);
    expect(exists(P.featurePrBats)).toBe(false);
  });

  it('L1.2: no source file names feature-pr.sh', () => {
    const offenders = sourceFiles()
      .filter((f) => read(f).includes('feature-pr.sh'))
      .map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("L1.2b: add.pull-request's uses block no longer declares the script", () => {
    expect(uses(read(P.pullRequest))).not.toContain('feature-pr.sh');
  });

  // guard — this assertion PASSES on the pre-F1 tree. The prohibition at line 83
  // forbids two scripts and only the `feature-pr.sh` half is false, so a fix that
  // deletes the whole line removes a rule that is still true and still needed:
  // `/add.pull-request` genuinely must not call `done.sh`.
  it('L1.3 (guard): add.pull-request still forbids calling done.sh', () => {
    const text = read(P.pullRequest);
    const line = text
      .split('\n')
      .find((l) => l.includes('DO NOT USE') && l.includes('done.sh'));
    expect(line, 'the done.sh prohibition must survive F1').toBeTruthy();
  });

  // guard — add-ecosystem has no row for feature-pr.sh today, so F1's sweep there
  // is empty. This pins that the block did not invent one on the way past.
  it('L1.4 (guard): add-ecosystem names no feature-pr.sh row', () => {
    expect(read(P.ecosystem)).not.toContain('feature-pr.sh');
  });
});
