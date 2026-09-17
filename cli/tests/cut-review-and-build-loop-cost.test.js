import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-09-17T153506 — cut review and build loop cost.
 *
 * The plan's own Validation Matrix, L1 (text/structure assertions), one item
 * per F-block. Written RED against the pre-plan tree: reviewer-agent.md had
 * two MODE values and no Confidence field, add-subagent-driven-development's
 * §7 routed by severity alone, prompt-review-agent.md took a single `node`
 * only, add-framework--build STEP 7.1 dispatched one call per `.md` file,
 * add.review.md had no OWASP trigger, add-tasks-checklist's architect prompt
 * never read the wiki, the tdd-pipeline fragment's gate/verification/
 * awareness sections had no tier distinction, and add-tdd's GREEN step had no
 * CI-tier caveat.
 *
 * L2 (Consumes/Produces string matches, `build.js` clean) and L3 (behavioural
 * acceptance — actual dispatch counts and routing at runtime) are run by the
 * build per F-block and recorded in the ledger, or verified by the STEP 7
 * auditors against the live diff. Neither can live here as a static
 * assertion over file text.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const P = {
  reviewerAgent: path.join(ROOT, 'framwork', '.codeadd', 'agents', 'reviewer-agent.md'),
  subagentDriven: path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add-subagent-driven-development', 'SKILL.md'),
  promptReviewAgent: path.join(ROOT, '.claude', 'agents', 'prompt-review-agent.md'),
  build: path.join(ROOT, '.claude', 'skills', 'add-framework--build', 'SKILL.md'),
  addReview: path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.review.md'),
  tasksChecklist: path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add-tasks-checklist', 'SKILL.md'),
  tddFragment: path.join(ROOT, 'framwork', '.codeadd', 'fragments', 'tdd-pipeline', 'add.build.md'),
  addTdd: path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add-tdd', 'SKILL.md'),
};

const read = (p) => fs.readFileSync(p, 'utf8');

/**
 * The body of a `#{2,3} <title>` section (## or ###), up to the next heading
 * at the same level or shallower. Located by title so a renumbering cannot
 * silently move it, and level-agnostic so a `###` subsection heading works
 * the same as a `##` one.
 */
function section(text, title) {
  const m = text.match(new RegExp(`^(#{2,3}) ${title}`, 'm'));
  if (!m) return null;
  const level = m[1].length;
  const start = m.index;
  const rest = text.slice(start + m[0].length).search(new RegExp(`^#{1,${level}} `, 'm'));
  return rest < 0 ? text.slice(start) : text.slice(start, start + m[0].length + rest);
}

describe('F1 — reviewer-agent.md carries a Confidence field', () => {
  it('L1.1 Report Format documents Confidence with both allowed values', () => {
    const text = read(P.reviewerAgent);
    expect(text).toMatch(/\*\*Confidence:\*\* `confirmed` \| `needs-verification`/);
    expect(text).toMatch(/`confirmed`/);
    expect(text).toMatch(/`needs-verification`/);
  });
});

describe('F2 — add-subagent-driven-development routes by confidence before severity', () => {
  it('L1.2 §7 names a confidence-based branch before the severity dispatch table', () => {
    const text = read(P.subagentDriven);
    const s7 = section(text, '7\\. Fix Loop, Escalation and the Scoped Re-Review');
    expect(s7).not.toBeNull();
    expect(s7).toMatch(/Confidence gate, before severity routing/i);
    expect(s7).toMatch(/needs-verification/);
    // The confidence gate paragraph must sit BEFORE the severity table, not after.
    const gateIdx = s7.search(/Confidence gate, before severity routing/i);
    const severityIdx = s7.search(/\*\*Critical\*\* issues/);
    expect(gateIdx).toBeGreaterThan(-1);
    expect(severityIdx).toBeGreaterThan(-1);
    expect(gateIdx).toBeLessThan(severityIdx);
  });
});

describe('F3 — prompt-review-agent.md accepts a batched multi-artefact input', () => {
  it('L1.3 Input Contract documents the batched form alongside the single-node form', () => {
    const text = read(P.promptReviewAgent);
    expect(text).toMatch(/\*\*Single form/);
    expect(text).toMatch(/\*\*Batched form/);
    expect(text).toMatch(/`nodes`:/);
    expect(text).toMatch(/never both `node` and `nodes`/i);
  });
});

describe('F4 — add-framework--build STEP 7.1 is one batched call, not one per file', () => {
  it('L1.4 scope 4 reads "one batched call", never "one per .md artefact"', () => {
    const text = read(P.build);
    const s7 = section(text, 'STEP 7: Review \\(ONCE, AFTER THE LAST F-BLOCK\\)');
    expect(s7).not.toBeNull();
    expect(s7).toMatch(/3 \+ 1/);
    expect(s7).toMatch(/one batched\s+(dispatch|call)/i);
    expect(s7).not.toMatch(/one dispatch per\b.*\.md/i);
  });
});

describe('F5 — reviewer-agent.md gains MODE: owasp', () => {
  it('L1.5 Input: MODE table lists owasp as a third value', () => {
    const text = read(P.reviewerAgent);
    const modeSection = section(text, 'Input: MODE');
    expect(modeSection).not.toBeNull();
    expect(modeSection).toMatch(/\|\s*`owasp`\s*\|/);
    expect(text).toMatch(/## OWASP Mode/);
  });
});

describe('F6 — add.review.md dispatches OWASP conditionally', () => {
  it('L1.6 STEP 4.1 names the trigger, STEP 4.2 names the conditional third dispatch', () => {
    const text = read(P.addReview);
    const s41 = section(text, '4\\.1 Detect Scope');
    expect(s41).not.toBeNull();
    expect(s41).toMatch(/owasp/i);
    expect(s41).toMatch(/auth.*payment.*upload/is);

    const s42 = section(text, '4\\.2 Dispatch Strategy');
    expect(s42).not.toBeNull();
    expect(s42).toMatch(/owasp trigger fired/i);
    expect(s42).toMatch(/never\s+instead of them/i);
  });
});

describe('F7 — add-tasks-checklist reads the wiki before writing Verify:', () => {
  it('L1.7 CONTEXT lists wiki/workflows.md, RULES states the CI-tier scoping rule', () => {
    const text = read(P.tasksChecklist);
    expect(text).toMatch(/wiki\/workflows\.md/);
    expect(text).toMatch(/Test Workflow/);
    expect(text).toMatch(/`Verify:` tier rule/);
    expect(text).toMatch(/CI-tier/);
  });
});

describe('F8 — tdd-pipeline/add.build.md gate is tier-aware', () => {
  it('L1.8 sections gate, awareness and verification each name the local/CI-tier distinction', () => {
    const text = read(P.tddFragment);
    const gate = text.match(/<!-- section:gate -->([\s\S]*?)<!-- \/section:gate -->/)?.[1] ?? '';
    const awareness = text.match(/<!-- section:awareness -->([\s\S]*?)<!-- \/section:awareness -->/)?.[1] ?? '';
    const verification = text.match(/<!-- section:verification -->([\s\S]*?)<!-- \/section:verification -->/)?.[1] ?? '';

    expect(gate).toMatch(/CI-tier/);
    expect(awareness).toMatch(/CI-tier/);
    expect(verification).toMatch(/CI-tier/);
  });
});

describe('F9 — add-tdd GREEN step names the CI-tier caveat', () => {
  it('L1.9 GREEN step 3 names CI-tier and stays inert with no Verify: line', () => {
    const text = read(P.addTdd);
    const green = section(text, 'GREEN — minimal code to pass');
    expect(green).not.toBeNull();
    expect(green).toMatch(/CI-tier is CI's job/i);
    expect(green).toMatch(/Inert wherever no `Verify:` line exists/i);
  });
});

describe('F10 — per-task review is narrower than the end-of-feature one', () => {
  it("L1.10 step 5's dispatch drops add-code-review and reports no SCORE", () => {
    const text = read(P.subagentDriven);
    const s5 = section(text, '5\\. Review Subagent\'s Work');
    expect(s5).not.toBeNull();
    expect(s5).not.toMatch(/\{\{skill:add-code-review\/SKILL\.md\}\}/);
    expect(s5).not.toMatch(/SCORE:/);
    // The rubric narrows; the attention must not.
    expect(s5).toMatch(/Narrower rubric, same care/i);
  });

  it('L1.11 step 5 keeps the four checks whose cost of discovering late is highest', () => {
    const text = read(P.subagentDriven);
    const s5 = section(text, '5\\. Review Subagent\'s Work');

    // Architecture Contract — mechanical, and the defect that contaminates later tasks.
    expect(s5).toMatch(/Architecture Contract, FIRST/);
    expect(s5).toMatch(/identify its layer\/package/);
    // Guarded: no section in CLAUDE.md means no check, never invented rules.
    expect(s5).toMatch(/IF the section is absent, SKIP this check/);
    expect(s5).toMatch(/reviews a project that does not exist/);

    // The task's own inter-task interface.
    expect(s5).toMatch(/Consumes\/Produces contract/);

    // SPEC_STATUS is gated on at step 6, so its derivation must be named here.
    expect(s5).toMatch(/Derive SPEC_STATUS/);
    expect(s5).toMatch(/Tick Application Procedure/);
    expect(s5).toMatch(/\{\{skill:add-tasks-checklist\/SKILL\.md\}\}/);

    // Wiki conventions, conditioned on the page existing — not just on a wiki existing.
    expect(s5).toMatch(/the area's page exists/);
    expect(s5).toMatch(/wiki\/domains\/\$\{AREA\}\.md/);
  });

  it('L1.12 step 6 still gates the commit on the SPEC_STATUS step 5 now derives', () => {
    const text = read(P.subagentDriven);
    const s6 = section(text, '6\\. Commit and Record');
    expect(s6).not.toBeNull();
    expect(s6).toMatch(/`SPEC_STATUS` is not `INCOMPLETE`/);
  });
});
