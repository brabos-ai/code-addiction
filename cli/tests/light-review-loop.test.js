import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-10-11T124512 — light review loop (ticket 0047B).
 *
 * The plan's Validation Matrix, L2 (text contracts), numbered by the matrix list.
 * Written RED against the pre-plan tree, one describe per concern. The guards at
 * the end (L2 #8) are GREEN today and must stay GREEN.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const P = {
  done: path.join(CODEADD, 'commands', 'add-done.md'),
  review: path.join(CODEADD, 'commands', 'add-review.md'),
  build: path.join(CODEADD, 'commands', 'add-build.md'),
  reviewSchema: path.join(CODEADD, 'skills', 'add--doc-schemas', 'references', 'review.md'),
  reviewerAgent: path.join(CODEADD, 'agents', 'reviewer-agent.md'),
  boardBuild: path.join(CODEADD, 'fragments', 'board', 'add-build.md'),
  qaBuild: path.join(CODEADD, 'fragments', 'qa-pipeline', 'add-build.md'),
};

const read = (p) => fs.readFileSync(p, 'utf8');

/** Text from the first `from` to the next `to` (or end of file). */
function between(text, from, to) {
  const a = text.indexOf(from);
  if (a < 0) return null;
  const b = to ? text.indexOf(to, a + from.length) : -1;
  return b < 0 ? text.slice(a) : text.slice(a, b);
}

/** A fragment section body, by name. */
function frag(text, name) {
  return between(text, `<!-- section:${name} -->`, `<!-- /section:${name} -->`);
}

describe('L2 #1 — add-done reads the newest working run as the QA gate', () => {
  it('branch 5 fires only when no working QA run exists', () => {
    const s = between(read(P.done), '5. IF `GATE_QA_BASELINE=skipped`', '6. IF `GATE_QA_BASELINE`');
    expect(s).not.toBeNull();
    expect(s).toMatch(/no working QA run/i);
  });

  it('branch 6 says an advanced baseline is not a block', () => {
    const s = between(read(P.done), '6. IF `GATE_QA_BASELINE`', '⛔ **Reading `GATE_QA_BASELINE`');
    expect(s).not.toBeNull();
    expect(s).toMatch(/advanced/i);
    expect(s).toMatch(/not a block|NOT `broken`/);
  });
});

describe('L2 #2/#3 — add-review routes red lint/format as minor, nothing else changes', () => {
  const t = () => read(P.review);

  it('a red lint or format gate on touched files is minor, KNOWN ISSUES, route formatter for format', () => {
    const s = between(t(), '### STEP add-review.re-run-procedure', '### STEP add-review.hard-requirements') || t();
    expect(s).toMatch(/`lint` or `format`/);
    expect(s).toContain('formatter');
    expect(s).toMatch(/⚠️ KNOWN ISSUES/);
    expect(s).toMatch(/`minor`/);
  });

  it('the other red gates on touched files still carry the blocker rule', () => {
    expect(t()).toMatch(/every other red gate[^\n]*`blocker`/i);
  });

  it('no line ties a lint or format failure to BLOCKED without excluding it', () => {
    const bad = t()
      .split('\n')
      .filter((l) => /(lint|format)/i.test(l) && /BLOCKED/.test(l) && /TOUCHED|touched/.test(l))
      .filter((l) => !/(other|not|never)/i.test(l));
    expect(bad).toEqual([]);
  });
});

describe('L2 #4 — the review schema annex carries evidence and a deferred outcome', () => {
  it('annex header and outcomes', () => {
    const s = read(P.reviewSchema);
    expect(s).toContain('ID | Route | Outcome | Evidence | Test | Files | Note');
    expect(s).toContain('deferred');
    expect(s).toContain('formatter');
  });
});

describe('L2 #5 — the re-review line carries the test that covers the finding', () => {
  it('ADDRESSED evidence has file:line and test:', () => {
    expect(read(P.reviewerAgent)).toMatch(/evidence: file:line; test:/);
  });
});

describe('L2 #6 — the build defers small findings, runs the formatter, checks scope', () => {
  const consume = () => between(read(P.build), '### STEP add-build.consume', '### STEP add-build.re-review');
  const finalReview = () => between(read(P.build), '## Final Review', null);

  it('consume defers minor/polish/lint rows and names the formatter map', () => {
    const s = consume();
    expect(s).not.toBeNull();
    expect(s).toMatch(/minor \(deferred\)/);
    for (const cmd of ['prettier --write', 'ruff format', 'gofmt -w', 'dotnet format', 'npm run']) {
      expect(s).toContain(cmd);
    }
  });

  it('the routed correction runs the Validation Gates Procedure after its last round', () => {
    expect(read(P.build)).toMatch(/last round[^\n]*Validation Gates Procedure|Validation Gates Procedure[^\n]*last round/i);
  });

  it('the Final Review scope check names the 300-line limit and the test-path exclusion', () => {
    const s = finalReview();
    expect(s).not.toBeNull();
    expect(s).toContain('300 changed lines');
    expect(s).toMatch(/`test`, `spec` or `__tests__`/);
  });

  it('6b. a run with no @fix-agent round writes passed with no reviewer dispatch', () => {
    const s = finalReview();
    expect(s).toMatch(/No `@fix-agent` round ran/);
    expect(s).toContain('Final review: passed (after review-NNN)');
  });
});

describe('L2 #7 — the board ticket for deferred minors and the QA next command', () => {
  it('the board fragment has a deferred-minors section', () => {
    expect(frag(read(P.boardBuild), 'deferred-minors')).not.toBeNull();
  });

  it('add-build.md carries the widened slot and the member pair', () => {
    const t = read(P.build);
    expect(t).toContain('slot:board.ticket-in-review+board.deferred-minors');
    expect(t).toMatch(/<!-- feature:board:deferred-minors -->\s*<!-- \/feature:board:deferred-minors -->/);
  });

  it('next-command names the routed-CORRECTION exception and working-baseline', () => {
    const s = frag(read(P.qaBuild), 'next-command');
    expect(s).not.toBeNull();
    expect(s).toMatch(/CORRECTION/);
    expect(s).toContain('working-baseline');
    expect(s).toContain('{{cmd:add-done}}');
  });
});

describe('L2 #8 — guards: what the F-blocks must not lose', () => {
  it('add-build keeps MAX_ATTEMPTS = 3 and the Final review head line', () => {
    const t = read(P.build);
    expect(t).toContain('MAX_ATTEMPTS = 3');
    expect(t).toContain('Final review head:');
  });

  it('add-done keeps QA_PROMOTION_STATUS=skipped', () => {
    expect(read(P.done)).toContain('QA_PROMOTION_STATUS=skipped');
  });

  it('the review schema keeps status: finalized exactly once', () => {
    const n = read(P.reviewSchema).split('status: finalized').length - 1;
    expect(n).toBe(1);
  });
});
