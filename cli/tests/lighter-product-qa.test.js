import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-10-09T114527 — lighter product QA (ticket 0035B).
 *
 * The plan's Validation Matrix, L1 (text/structure assertions), one describe per
 * F-block, numbered by the matrix list. Written RED against the pre-plan tree:
 * add-done validated `none` against a leftover run, add-build dispatched one
 * @e2e-agent per surface and left specs uncommitted, add-qa-setup ran a nested
 * smoke review, and STEP add-build.order did not exist. Guards (GREEN today,
 * must stay GREEN) are marked.
 *
 * L2 lives in the build's injection checks; L3 and L4 run in the build.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const P = {
  done: path.join(CODEADD, 'commands', 'add-done.md'),
  build: path.join(CODEADD, 'commands', 'add-build.md'),
  setup: path.join(CODEADD, 'commands', 'add-qa-setup.md'),
  e2eAgent: path.join(CODEADD, 'agents', 'e2e-agent.md'),
  qaBuild: path.join(CODEADD, 'fragments', 'qa-pipeline', 'add-build.md'),
  qaPlan: path.join(CODEADD, 'fragments', 'qa-pipeline', 'add-plan.md'),
  qaReview: path.join(CODEADD, 'fragments', 'qa-pipeline', 'add-review.md'),
  discipline: path.join(CODEADD, 'skills', 'add--review-discipline', 'SKILL.md'),
  setupContract: path.join(CODEADD, 'skills', 'add--setup-contract', 'SKILL.md'),
  qaMigration: path.join(CODEADD, 'skills', 'add--qa-migration', 'SKILL.md'),
  umbrella: path.join(ROOT, 'cli', 'tests', 'qa-pipeline-umbrella.test.js'),
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

/** Every .md under a directory. */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

describe('F1 — close-out without a QA judgement skips promotion', () => {
  const branch5 = () => between(read(P.done), '5. IF `GATE_QA_BASELINE=skipped`', '6. IF `GATE_QA_BASELINE`');

  it('1. branch 5 sets QA_PROMOTION_STATUS=skipped on every path that proceeds', () => {
    const s = branch5();
    expect(s).not.toBeNull();
    expect(s).toMatch(/QA_PROMOTION_STATUS=skipped/);
  });

  it('2. the branch-5 question says working QA evidence will not be promoted', () => {
    expect(branch5()).toMatch(/not be promoted/i);
  });

  it('3. STEP add-done.promote-qa carries the branch-5 skip before step 1; heading unchanged', () => {
    const t = read(P.done);
    expect(t).toContain('## STEP add-done.promote-qa: Validate and Promote Reviewed QA Evidence');
    const head = between(t, '## STEP add-done.promote-qa:', '1. Execute `node .codeadd/scripts/qa-evidence.cjs validate');
    expect(head).toContain('GATE_QA_BASELINE=skipped');
  });
});

describe('F2 — the build names /add-review as next step only with qa-pipeline on', () => {
  const next = () => between(read(P.build), '### STEP add-build.next-command', '### STEP add-build.handoff');

  it('4. next-command holds the qa-pipeline.next-command slot with the empty fallback and an empty member pair', () => {
    const s = next();
    expect(s).toContain('<!-- slot:qa-pipeline.next-command fallback="fallbacks/empty.md" -->');
    expect(s).toMatch(/<!-- feature:qa-pipeline:next-command -->\s*<!-- \/feature:qa-pipeline:next-command -->/);
  });

  it('5. the fragment section next-command names add-review and does not call it optional', () => {
    const s = frag(read(P.qaBuild), 'next-command');
    expect(s).not.toBeNull();
    expect(s).toContain('{{cmd:add-review}}');
    expect(s).not.toMatch(/optional/i);
  });

  it('6. guard: add-build.md itself gained no add-review command reference in next-command', () => {
    expect(next()).not.toContain('{{cmd:add-review}}');
  });
});

describe('F3 — the plan-side QA step', () => {
  const spec = () => frag(read(P.qaPlan), 'qa-spec');

  it('7. qa-spec runs only when design.md declares at least one screen', () => {
    const s = spec();
    expect(s).not.toMatch(/ALWAYS when qa-pipeline is enabled/);
    expect(s).toMatch(/design\.md[^\n]*declar[^\n]*screen/i);
    expect(s).toMatch(/QA spec skipped/);
  });

  it('8. it reads SETUP_QA and warns toward add-qa-setup without stopping', () => {
    const s = spec();
    expect(s).toContain('SETUP_QA');
    expect(s).toContain('{{cmd:add-qa-setup}}');
    expect(s).toMatch(/never a stop|not a stop|do not stop/i);
  });

  it('9. guard: the step id and the step-list section are unchanged', () => {
    const t = read(P.qaPlan);
    expect(t).toContain('STEP qa-pipeline.qa-spec: Generate the QA specification');
    expect(frag(t, 'step-list')).toContain('STEP qa-pipeline.qa-spec');
  });
});

describe('F4 — one @e2e-agent per delivery', () => {
  const e2e = () => frag(read(P.qaBuild), 'e2e-dispatch');

  it('10. the dispatch is ONE @e2e-agent per delivery, not one per surface', () => {
    const s = e2e();
    expect(s).toMatch(/ONE `?@e2e-agent`?/);
    expect(s).not.toMatch(/one per surface/i);
    expect(s).not.toContain('per in-scope surface');
  });

  it('11. it names the epic last-subfeature condition, per-surface pass/fail and the no-rows skip', () => {
    const s = e2e();
    expect(s).toMatch(/last subfeature/i);
    expect(s).toMatch(/pass\/fail per surface/i);
    expect(s).toMatch(/no `?## QA\/E2E Specification`? rows/i);
  });

  it('12. Correction Dispatch lists failing e2e assertions as a build-only source; MAX_ATTEMPTS stays 3', () => {
    const t = read(P.build);
    const s = between(t, '**A build-only round gets no re-review.**', 'IF `ATTEMPT` would exceed');
    expect(s).toMatch(/e2e/i);
    expect(s).toMatch(/specs? re-?run/i);
    expect(t).toContain('MAX_ATTEMPTS = 3');
  });

  it('13. guard: add--review-discipline still counts re-review per fix round with a reviewer-sourced row', () => {
    expect(read(P.discipline)).toMatch(/per fix round that carries a\s+reviewer-sourced row/);
  });

  it('14. e2e-agent accepts one or more surfaces; a build-time run leaves no run-NNN; the build never allocates one', () => {
    const a = read(P.e2eAgent);
    expect(a).toMatch(/one or more surfaces/i);
    expect(a).toMatch(/build-time run/i);
    expect(e2e()).toMatch(/never calls `qa-evidence\.cjs next`/);
  });
});

describe('F5 — the e2e specs enter a build commit', () => {
  it('15. the e2e batch commits through STEP add-build.commit with Feature-Id', () => {
    const s = frag(read(P.qaBuild), 'e2e-dispatch');
    expect(s).toContain('add-build.commit');
    expect(s).toContain('Feature-Id');
  });

  it('16. the ledger table carries the e2e line with its commit range', () => {
    expect(read(P.build)).toContain('e2e: complete (N surfaces, P passing; commits');
  });

  it('16a. the e2e batch has no Task-Id, and STEP add-build.commit names it with its gate', () => {
    const s = frag(read(P.qaBuild), 'e2e-dispatch');
    expect(s).toMatch(/no `?Task-Id`?/i);
    const c = between(read(P.build), '### STEP add-build.commit', '### STEP add-build.validation-gates');
    expect(c).toMatch(/e2e batch/i);
  });
});
