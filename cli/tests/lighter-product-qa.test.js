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
