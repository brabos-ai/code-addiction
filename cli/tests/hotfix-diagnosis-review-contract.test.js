import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const read = (...parts) => fs.readFileSync(path.join(CODEADD, ...parts), 'utf8');

describe('hotfix diagnosis and review contracts', () => {
  it('defines the exact diagnose hotfix handoff and working-tree baseline', () => {
    const schema = read('skills', 'add-doc-schemas', 'references', 'review.md');
    expect(schema).toMatch(/route: hotfix[\s\S]*accepted: true[\s\S]*diagnosed-branch:[\s\S]*diagnosed-commit:[\s\S]*predicate:[\s\S]*root-cause:/);
    expect(schema).toContain('ID | Severity | Area | Citation | Symbol | Finding | Required change');
    expect(schema).toContain('### Confirmed Relations');
    expect(schema).toContain('### Working Tree Baseline');
    expect(schema).toContain('<state>\\t<mode>\\t<content-sha256-or-dash>\\t<path-hex>');
    expect(schema).toMatch(/staged.*unstaged.*deleted.*untracked/s);
    expect(schema).toMatch(/duplicate state\/path.*fail/i);
  });

  it('defines a hotfix-local receipt with exact scalars, paths and findings', () => {
    const schema = read('skills', 'add-doc-schemas', 'references', 'fix.md');
    expect(schema).toMatch(/status: passed \| blocked[\s\S]*reviewer: named \| generic \| inline[\s\S]*reviewed-at:[\s\S]*reviewed-tree: sha256:[\s\S]*build: passed \| blocked[\s\S]*pinned-test:/);
    expect(schema).toContain('### Reviewed Paths');
    expect(schema).toContain('ID | Severity | Confidence | Citation | Route | Disposition | Re-review | Detail');
    expect(schema).toMatch(/blocker.*major.*fixed.*addressed.*accepted/s);
    expect(schema).toMatch(/minor.*polish.*open/s);
    expect(schema).toMatch(/creating a hotfix `review-NNN\.md`/);
  });

  it('lets re-review consume either a commit-range or correction snapshot package', () => {
    const agent = read('agents', 'reviewer-agent.md');
    const skill = read('skills', 'add-subagent-driven-development', 'SKILL.md');
    for (const source of [agent, skill]) {
      expect(source).toMatch(/commit-range/i);
      expect(source).toMatch(/snapshot package/i);
      expect(source).toMatch(/correction-only/i);
    }
    expect(agent).toContain('ADDRESSED | NOT ADDRESSED');
    expect(agent).toMatch(/VERDICT: \[n addressed, n open\]/);
  });

  it('persists every accepted diagnose route and prints the hotfix handoff command only for hotfix', () => {
    const cmd = read('commands', 'add.diagnose.md');
    expect(cmd).toMatch(/script: hotfix-gates\.sh/);
    expect(cmd).toContain('bash .codeadd/scripts/hotfix-gates.sh diagnosis-baseline');
    expect(cmd).toMatch(/hotfix\/feature\/extend\/no-action/);
    expect(cmd).toMatch(/rejected diagnosis is not written/i);
    expect(cmd).not.toMatch(/route = no-action \| Write \| Conversational response only/);
    expect(cmd).not.toMatch(/Persist a report when the route is no-action/);
    expect(cmd).toContain('/add.hotfix @docs/diagnose/');
    expect(cmd).toMatch(/only for an accepted hotfix route|only when the accepted route is hotfix/i);
    expect(cmd).toMatch(/never invoke/i);
  });

  it('hotfix reuses a valid diagnose report and reviews with one correction wave', () => {
    const cmd = read('commands', 'add.hotfix.md');
    expect(cmd).toMatch(/script: hotfix-gates\.sh/);
    expect(cmd).toContain('@docs/diagnose/');
    expect(cmd).toContain('diagnosis-check');
    expect(cmd).toMatch(/STEPS 4-6/);
    expect(cmd).toMatch(/second root-cause confirmation/i);
    expect(cmd).toContain('<!-- feature:tdd-pipeline:red-gate -->');
    expect(cmd).toContain('@reviewer-agent');
    expect(cmd).toMatch(/MODE: owasp/);
    expect(cmd).toContain('@fix-agent');
    expect(cmd).toMatch(/ATTEMPT=1/);
    expect(cmd).toMatch(/MAX_ATTEMPTS=1/);
    expect(cmd).toContain('snapshot-wave');
    expect(cmd).toContain('diff-wave');
    expect(cmd).toContain('review-fingerprint');
    expect(cmd).toContain('review-validate');
    expect(cmd).not.toContain('@security-agent');
    expect(cmd).not.toContain('@conformance-agent');
    expect(cmd).not.toContain('@failure-analysis-agent');
  });
});
