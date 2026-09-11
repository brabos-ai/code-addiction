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
  convergeGates: path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'converge-gates.sh'),
  convergeBats: path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'tests', 'converge-gates.bats'),
  done: path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.done.md'),
  planToReady: path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.plan-to-ready.md'),
  commit: path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add-commit', 'SKILL.md'),
  build: path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.build.md'),
};

/** The six artefacts F2 sweeps. Its two false positives are NOT in this list. */
const GATE_SWEEP = ['convergeGates', 'convergeBats', 'planToReady', 'commit', 'ecosystem'];
// add.done is swept by F3, not F2: its parse list and its gate-count sentence
// are what STEP 4.3 reads, and a block that names a sub-step it does not create
// leaves a pointer resolving to nothing.

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

describe('L2 — GATE_LEDGER, the content sweep (F2, F3)', () => {
  // The behavioural half of L2 — what the gate RETURNS on each tree shape —
  // lives in framwork/.codeadd/scripts/tests/converge-gates.bats. A script's
  // behaviour is testable where the script runs; only its prose is testable
  // here.

  it('L2.6a: no swept artefact still states the old gate count', () => {
    const offenders = [];
    for (const key of GATE_SWEEP) {
      const text = read(P[key]);
      for (const phrase of ['GATES_OK=4/4', 'four gates', 'FOUR gates', 'five gate lines']) {
        // The two false positives are excluded by file, not by phrase: the
        // phrase is identical and only the file tells them apart.
        if (text.includes(phrase)) offenders.push(`${key}: ${phrase}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('L2.6b: every gate-key list names six keys including GATE_LEDGER', () => {
    for (const key of ['planToReady', 'commit']) {
      const text = read(P[key]);
      expect(text, `${key} must name the six gate lines`).toMatch(/six gate lines/);
      expect(text, `${key} must list GATE_LEDGER`).toContain('GATE_LEDGER');
    }
  });

  it('L2.6c: the summary line and the script header state five', () => {
    const sh = read(P.convergeGates);
    expect(sh).toContain('GATES_OK=$GATES_OK/5');
    expect(sh).toMatch(/five .*convergence gates/i);
  });

  // guard — these three lines match the swept phrases and must NOT change. A
  // tree-wide replace takes all three silently, and nothing else in this matrix
  // would notice.
  it('L2.7: the three false-positive matches are byte-unchanged', () => {
    expect(read(P.build)).toContain(
      'Run the four gates below **in this order**, and only reach step 4 if 1, 2 and 3 all held:',
    );
    const bats = read(P.convergeBats);
    expect(bats).toContain('| Spec Compliance | ✅ PASSED | 4/4 items compliant |');
    expect(bats).toContain('| Product Validation | ✅ PASSED | RF: 4/4, RN: 2/2 |');
  });

  it('L2.8: both git log --grep=GATES_OK passages survive', () => {
    expect(read(P.planToReady)).toContain('git log --grep=GATES_OK');
    expect(read(P.commit)).toContain('git log --grep=GATES_OK');
  });
});
