import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Ticket 0048B — Hotfix objective review.
 * Contract levels L3.1 through L3.5. L3.6 is cli/tests/hotfix-review-0073.test.js,
 * which runs unchanged. The gate and the done.cjs hints are covered by the native
 * suites under scripts/tests/.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const read = (...p) => fs.readFileSync(path.join(CODEADD, ...p), 'utf8');

/** Body of a `##` section, up to the next heading of the same or higher level. */
function section(text, heading, level = 2) {
  const marks = '#'.repeat(level);
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`${marks} ${heading}`));
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && new RegExp(`^#{1,${level}} `).test(l));
  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

const hotfix = () => read('commands', 'add-hotfix.md');

describe('0048B L3 — hotfix objective review contract', () => {
  it('L3.1 review-input names OBJECTIVE and says the review covers the diff against it', () => {
    const body = section(hotfix(), 'STEP add-hotfix.review-input', 3);
    expect(body).not.toBeNull();
    expect(body).toContain('OBJECTIVE');
    expect(body).toMatch(/diff against `?OBJECTIVE`?/);
  });

  it('L3.2 resume-review is a ### sub-step of branch-check, outside the STEPS list', () => {
    const text = hotfix();
    const branchCheck = section(text, 'STEP add-hotfix.branch-check');
    const resume = section(branchCheck, 'STEP add-hotfix.resume-review', 3);
    expect(resume).not.toBeNull();
    expect(resume).toContain('STEP add-hotfix.review');
    expect(resume).toContain('## Root Cause');
    expect(resume).toContain('## Fix');
    expect(text).not.toMatch(/^STEP add-hotfix\.resume-review:/m);
  });

  it('L3.3 branch-check STOPs on a branch that is neither main nor a hotfix branch, naming the shape', () => {
    const body = section(hotfix(), 'STEP add-hotfix.branch-check');
    expect(body).toContain('hotfix/[NNNN]H-');
    expect(body).toMatch(/STOP/);
    expect(body).not.toMatch(/IF `BRANCH:hotfix\/\*`/);
  });

  it('L3.4 reviewer-agent carries the objective rule in Constraints', () => {
    const body = section(read('agents', 'reviewer-agent.md'), 'Constraints');
    expect(body).not.toBeNull();
    expect(body).toContain('Judge the change by its objective');
    expect(body).toMatch(/removal the objective asks for/i);
    expect(body).toMatch(/not a finding/i);
  });

  it('L3.5 add-done sends a stale receipt to /add-hotfix on the same branch', () => {
    const body = section(read('commands', 'add-done.md'), 'STEP add-done.hotfix-review-receipt', 3);
    expect(body).not.toBeNull();
    const row = body.split('\n').find((l) => /stale/.test(l) && /blocked/.test(l) && l.startsWith('|'));
    expect(row).toBeDefined();
    expect(row).toMatch(/same branch/i);
    expect(row).toContain('add-hotfix.resume-review');
  });
});
