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
  sdd: path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add-subagent-driven-development', 'SKILL.md'),
};

/** The six artefacts F2 sweeps. Its two false positives are NOT in this list. */
const GATE_SWEEP = ['convergeGates', 'convergeBats', 'planToReady', 'commit', 'ecosystem'];
// add.done is swept by F3, not F2: its parse list and its gate-count sentence
// are what STEP 4.3 reads, and a block that names a sub-step it does not create
// leaves a pointer resolving to nothing.

const NL = String.fromCharCode(10);
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

describe('L3 — add.done reads the fifth gate (F3)', () => {
  it('L3.1: the STEP 4 preflight parses GATE_LEDGER and its detail', () => {
    const text = read(P.done);
    expect(text).toContain('GATE_LEDGER');
    expect(text).toContain('GATE_LEDGER_DETAIL');
  });

  it('L3.2: STEP 4 states five gates, and names 4.3 among the sub-steps it gates', () => {
    const text = read(P.done);
    expect(text).not.toContain('computes FOUR gates');
    expect(text).toMatch(/computes FIVE gates/);
    expect(text).toMatch(/4\.0, 4\.1, 4\.2 and 4\.3/);
  });

  it('L3.3: a 4.3 sub-step exists and blocks on anything but ok', () => {
    const text = read(P.done);
    expect(text).toMatch(/^### 4\.3:/m);
    const s43 = text.slice(text.indexOf('### 4.3:'), text.indexOf('## STEP 5'));
    expect(s43).toContain('GATE_LEDGER');
    // The three non-ok statuses each block, named rather than implied.
    for (const status of ['missing', 'broken', 'not-probed']) {
      expect(s43, `4.3 must name ${status}`).toContain(status);
    }
  });

  it('L3.4: 4.3 never re-derives the verdict itself', () => {
    const text = read(P.done);
    const s43 = text.slice(text.indexOf('### 4.3:'), text.indexOf('## STEP 5'));
    // The gate is read from the preflight, not recomputed by opening the ledger
    // or tasks.md — that would restate the gate converge-gates.sh owns.
    expect(s43).toMatch(/DO NOT/);
    expect(s43).toMatch(/build-ledger\.md/);
  });

  it('L3.6: the step summary and the re-derive prohibition both name the ledger', () => {
    const text = read(P.done);
    const summary = text.split('\n').find((l) => l.startsWith('STEP 4: Validate delivery'));
    expect(summary, 'the STEP 4 summary line must exist').toBeTruthy();
    expect(summary).toMatch(/ledger/i);
    // The prohibition lists the files a coordinator must not parse for itself.
    // A gate added without its file here reads as permission to re-derive it.
    expect(text).toMatch(/DO NOT re-derive a verdict by reading[^\n]*build-ledger\.md/);
  });

  it('L3.5: the blocked branch forbids the same two writes its siblings forbid', () => {
    const text = read(P.done);
    const s43 = text.slice(text.indexOf('### 4.3:'), text.indexOf('## STEP 5'));
    expect(s43).toContain('changelog.md');
    expect(s43).toContain('done.sh --merge');
  });
});

describe('L4 — the publish question (F7)', () => {
  const stepHeads = (text) =>
    text.split(NL).filter((l) => /^## STEP \d+/.test(l));

  it('L4.1: STEP 17 is Publish, STEP 18 is Completion, and no number repeats', () => {
    const heads = stepHeads(read(P.build));
    const s17 = heads.find((l) => l.startsWith('## STEP 17'));
    const s18 = heads.find((l) => l.startsWith('## STEP 18'));
    expect(s17, 'a STEP 17 must exist').toBeTruthy();
    expect(s17).toMatch(/Publish/i);
    expect(s18, 'a STEP 18 must exist').toBeTruthy();
    expect(s18).toMatch(/Completion/i);
    const nums = heads.map((l) => l.match(/^## STEP (\d+)/)[1]);
    expect(new Set(nums).size, 'every STEP number is unique').toBe(nums.length);
  });

  it('L4.2: the STEPS IN ORDER block lists both steps', () => {
    const text = read(P.build);
    const block = text.slice(text.indexOf('STEPS IN ORDER'), text.indexOf('**ABSOLUTE INVARIANTS'));
    expect(block).toMatch(/STEP 17:.*Publish/i);
    expect(block).toMatch(/STEP 18:.*Completion/i);
  });

  it('L4.3: the behaviour table names every Publish string it can write', () => {
    const text = read(P.build);
    const step = text.slice(text.indexOf('## STEP 17'), text.indexOf('## STEP 18'));
    for (const record of [
      'Publish: on-main',
      'Publish: no-gh',
      'Publish: pr-updated',
      'Publish: pr-opened',
      'Publish: declined',
    ]) {
      expect(step, `the table must name ${record}`).toContain(record);
    }
  });

  it('L4.4: the step forbids offering on main, pushing unasked, and merging', () => {
    const text = read(P.build);
    const step = text.slice(text.indexOf('## STEP 17'), text.indexOf('## STEP 18'));
    expect(step).toMatch(/main.*master|master.*main/is);
    expect(step).toMatch(/DO NOT USE: Bash for git push/);
    expect(step).toMatch(/never merges|DO NOT.*merge/i);
  });

  it('L4.5: the canonical ledger format carries a Publish row', () => {
    expect(read(P.sdd)).toMatch(/^Publish: /m);
  });

  // guard — measured before the renumber: nothing outside add.build.md cites
  // either step number. A renumber that broke a cross-reference would be
  // invisible to every other level here.
  it('L4.6 (guard): no other artefact cites add.build STEP 17 or STEP 18', () => {
    const offenders = sourceFiles()
      .filter((f) => f !== P.build)
      .filter((f) => {
        // Line-scoped rather than one regex: a cross-file citation is always
        // on one line, and matching per line needs no newline escape.
        return read(f)
          .split(NL)
          .some((l) => l.includes('add.build') && /STEP 1[78]/.test(l));
      })
      .map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });
});

describe('L5 — the close-out routes (F8)', () => {
  const step2 = () => {
    const t = read(P.done);
    return t.slice(t.indexOf('## STEP 2'), t.indexOf('## STEP 3'));
  };

  it('L5.1: the four states are crossed, each naming its route', () => {
    const s2 = step2();
    for (const route of ['Normal', 'Resume', 'Closed out', 'Recovery']) {
      expect(s2, `the cross must name the ${route} route`).toContain(route);
    }
    expect(s2).toContain('INDEX_ENTRY');
    expect(s2).toContain('MERGED_ON_MAIN');
  });

  it('L5.2: the PR_STATE x PUBLISH_RECORD table routes an unasked build to ASK', () => {
    const s2 = step2();
    expect(s2).toContain('PUBLISH_RECORD');
    expect(s2).toContain('PR_STATE');
    // The row the whole record exists for: no PR and no line means nobody was
    // asked, so the close-out asks rather than assuming a local merge.
    expect(s2).toMatch(/ASK/);
  });

  it('L5.3: no-gh never routes to the PR route', () => {
    const s2 = step2();
    expect(s2).toContain('no-gh');
    expect(s2).toMatch(/no-gh[^|]*\|[^|]*[Ll]ocal/);
  });

  it('L5.4: STEP 2 reads the probe and computes neither fact itself', () => {
    const s2 = step2();
    // Both facts come from done.sh's ROUTE block. Recomputing them here is how
    // two readers of one tree end up disagreeing.
    expect(s2).toMatch(/DO NOT/);
    expect(s2).toMatch(/gh pr view|delivered\.jsonl/);
  });

  it('L5.8: add.done carries no model pin', () => {
    expect(read(P.done)).not.toMatch(/^> \*\*MODEL:\*\*/m);
  });
});

describe('L6 — the PR merge route (F9)', () => {
  const step8 = () => {
    const t = read(P.done);
    return t.slice(t.indexOf('## STEP 8'), t.indexOf('## STEP 9'));
  };

  it('L6.1: the PR route runs its seven calls in order', () => {
    const s8 = step8();
    const order = [
      'done.sh --commit-push',
      'gh pr checks',
      'headRefOid',
      'gh pr merge --squash',
      'done.sh --cleanup',
    ];
    let at = -1;
    for (const token of order) {
      const next = s8.indexOf(token);
      expect(next, `${token} must appear in the PR route`).toBeGreaterThan(-1);
      expect(next, `${token} must come after the step before it`).toBeGreaterThan(at);
      at = next;
    }
  });

  it('L6.2: the SHA comparison sits BEFORE the verdict is read', () => {
    const s8 = step8();
    // A green check is evidence only for the commit it ran on. Reading the
    // verdict first and comparing after is the same bug with extra steps.
    expect(s8.indexOf('headRefOid')).toBeLessThan(s8.indexOf('gh pr merge'));
    expect(s8).toMatch(/refuse|REFUSE/);
  });

  it('L6.3: only success passes — the four non-pass conclusions are named', () => {
    const s8 = step8();
    for (const status of ['skipped', 'queued', 'neutral', 'cancelled']) {
      expect(s8, `${status} must be named as not a pass`).toContain(status);
    }
  });

  it('L6.4: no required check configured merges, and says so', () => {
    const s8 = step8();
    expect(s8).toMatch(/no required check/i);
  });

  it('L6.5: a refused merge stops before cleanup and routes the next run to Resume', () => {
    const s8 = step8();
    expect(s8).toMatch(/Resume/);
    expect(s8).toMatch(/DO NOT/);
  });

  it('L6.6: the report names which evidence the gate accepted', () => {
    const t = read(P.done);
    const s9 = t.slice(t.indexOf('## STEP 9'));
    expect(s9).toMatch(/evidence/i);
  });
});
