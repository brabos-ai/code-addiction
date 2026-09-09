import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-09-09T061636 — plan-review-agent speed.
 * Red-Green Validation Matrix, levels L1 through L4.
 *
 * Every level here was written RED against the pre-plan tree: the agent still
 * carried `tools:` and `disallowedTools:`, its method was five loose steps with
 * a numeric read cap, and its report had one shape for three verdicts. A level
 * that passes before its F-block lands is a level that does not bite.
 *
 * Six assertions pass on the pre-plan tree by design, and they are marked. They
 * guard properties the plan must PRESERVE — the READ-ONLY statement, the eight
 * dimensions, the four verdict rules, the `blocked` path in the callers. A
 * matrix that is RED everywhere has no guard against collateral damage.
 *
 * L5 is behavioural (tool-call count before and after) and cannot live here. It
 * is recorded in the build ledger.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const AGENT = path.join(ROOT, '.claude', 'agents', 'plan-review-agent.md');
const AUTHORING = path.join(ROOT, '.claude', 'skills', 'add-plan-authoring', 'SKILL.md');
const BRAINSTORM = path.join(ROOT, '.claude', 'commands', 'add-framework--brainstorm.md');
const PLAN_CMD = path.join(ROOT, '.claude', 'commands', 'add-framework--plan.md');

const read = (p) => fs.readFileSync(p, 'utf8');

/** The frontmatter block only — the agent body also contains `tools` as prose. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error('no frontmatter');
  return m[1];
}

/** Everything after the frontmatter. */
function body(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
}

const CALLERS = [
  ['add-plan-authoring/SKILL.md', AUTHORING],
  ['add-framework--brainstorm.md', BRAINSTORM],
  ['add-framework--plan.md', PLAN_CMD],
];

/**
 * Only two of the three callers carry a verdict table. `add-framework--plan.md`
 * delegates verdict handling to `add-plan-authoring` entirely and names neither
 * `blocked` nor the report fields, so its own guard is that the delegation
 * survives — see L4.3.
 */
const VERDICT_TABLE_CALLERS = CALLERS.filter(([, file]) => file !== PLAN_CMD);

const DIMENSIONS = [
  'Scope',
  'Hidden assumptions',
  'Contradictions',
  'Dependencies',
  'Executability',
  'Testability',
  'Risks',
  'Gold-plating',
];

describe('L1 — tool access (F2)', () => {
  it('L1.1 the frontmatter declares no tools allowlist', () => {
    expect(frontmatter(read(AGENT))).not.toMatch(/^tools:/m);
  });

  it('L1.2 the frontmatter declares no disallowedTools list', () => {
    expect(frontmatter(read(AGENT))).not.toMatch(/^disallowedTools:/m);
  });

  // Green pre-plan by design: F2 removes the gate, never the rule.
  it('L1.3 the READ-ONLY statement survives verbatim', () => {
    expect(read(AGENT)).toContain('You are READ-ONLY. You NEVER modify files');
  });

  // Green pre-plan by design: guards the rest of the frontmatter.
  it('L1.4 name, description, model and memory survive', () => {
    const fm = frontmatter(read(AGENT));
    expect(fm).toMatch(/^name: plan-review-agent$/m);
    expect(fm).toMatch(/^description: /m);
    expect(fm).toMatch(/^model: sonnet$/m);
    expect(fm).toMatch(/^memory: project$/m);
  });
});

describe('L2 — work phases (F3)', () => {
  it('L2.1 How You Work is built from four named phases', () => {
    const text = read(AGENT);
    const section = text.split('## How You Work')[1] ?? '';
    const phases = section.match(/^### Phase \d+ — /gm) ?? [];
    expect(phases).toHaveLength(4);
  });

  it('L2.2 independent checks are instructed to go out in one message', () => {
    expect(read(AGENT)).toMatch(/in ONE message/);
  });

  it('L2.3 graph.js is named as the way to answer a claimed relationship', () => {
    expect(read(AGENT)).toContain('scripts/graph.js');
  });

  it('L2.4 no phase carries a numeric call budget', () => {
    const text = read(AGENT);
    expect(text).not.toContain('Cap extra file reads at 8');
    expect(text).not.toMatch(/budget[^.\n]*\d/i);
  });

  // Green pre-plan on both halves by design: guards the eight dimensions and
  // guards against reintroducing the classification the user rejected.
  it('L2.5 all eight dimensions survive and carry no tool-requirement column', () => {
    const text = read(AGENT);
    const section = text.split('## Dimensions')[1]?.split('\n## ')[0] ?? '';
    for (const d of DIMENSIONS) expect(section).toContain(d);
    expect(section).not.toMatch(/\|\s*(Needs a tool|Tool|Requires tool)\s*\|/i);
  });

  it('L2.6 the shell prohibition is gone, the leaf and no-dispatch rules stay', () => {
    const text = read(AGENT);
    expect(text).not.toContain('Do NOT run shell commands');
    // Green pre-plan by design: the two rules that survive the edit.
    expect(text).toContain('You are a leaf');
    expect(text).toContain('Do NOT dispatch other agents');
  });

  it('L2.7 the node-id note names layer as the prefix and covers `both`', () => {
    const text = read(AGENT);
    expect(text).toMatch(/<layer>\/<kind>\/<name>/);
    expect(text).toMatch(/`both`/);
  });
});

describe('L3 — report shape (F4)', () => {
  it('L3.1 the output format is stated per verdict, and blocked emits blockers only', () => {
    const section = read(AGENT).split('## Output Format')[1] ?? '';
    expect(section).toMatch(/blockers only/i);
  });

  it('L3.2 four shapes are given, one of them for ok with nits present', () => {
    const section = read(AGENT).split('## Output Format')[1] ?? '';
    const shapes = section.match(/^### Verdict `[a-z-]+`/gm) ?? [];
    expect(shapes).toHaveLength(4);
    expect(section).toMatch(/nits present/i);
  });

  it('L3.3 Do not change is emitted on fix-then-ok only', () => {
    const section = read(AGENT).split('## Output Format')[1] ?? '';
    expect(section).toMatch(/`Do not change`[^\n]*`fix-then-ok` only|`fix-then-ok` only[^\n]*`Do not change`/);
  });

  it('L3.4 the nit cap is three', () => {
    const text = read(AGENT);
    expect(text).toMatch(/8 blockers, 8 attention, 3 nits/);
  });

  it('L3.5 the header carries the verdict first and echoes neither path nor kind', () => {
    const section = read(AGENT).split('## Output Format')[1] ?? '';
    expect(section).not.toContain('**Path:**');
    expect(section).not.toContain('**Kind:**');
    expect(section.trimStart()).toMatch(/^```\r?\nVerdict:/);
  });

  it('L3.6 finding tables carry Where, and neither Section nor Evidence', () => {
    const section = read(AGENT).split('## Output Format')[1] ?? '';
    expect(section).toMatch(/\|\s*Where\s*\|/);
    expect(section).not.toMatch(/\|\s*Section\s*\|/);
    expect(section).not.toMatch(/\|\s*Evidence\s*\|/);
  });

  // Green pre-plan by design: F4 reshapes the output, never the verdict rules.
  it('L3.7 the four verdict rules survive in order', () => {
    const section = read(AGENT).split('## Verdict')[1]?.split('\n## ')[0] ?? '';
    expect(section).toMatch(/^1\. .*`blocked`/m);
    expect(section).toMatch(/^2\. .*`fix-then-ok`/m);
    expect(section).toMatch(/^3\. .*`ok`/m);
    expect(section).toMatch(/^4\. .*`ok`/m);
  });
});

describe('L4 — the second review pass is gone (F5)', () => {
  it.each(CALLERS)('L4.1 %s instructs no re-dispatch', (_label, file) => {
    expect(read(file)).not.toMatch(/re-dispatch/i);
  });

  // Green pre-plan by design: F5 removes the second pass, not the contract.
  it.each(VERDICT_TABLE_CALLERS)(
    'L4.2 %s keeps the blocked path and the report fields it reads',
    (_label, file) => {
      const text = read(file);
      expect(text).toContain('blocked');
      expect(text).toContain('Required fix');
      expect(text).toContain('Do not change');
    },
  );

  // Green pre-plan by design: guards against collateral deletion.
  it('L4.3 the two prohibitions and the plan command\'s delegation survive', () => {
    const authoring = read(AUTHORING);
    expect(authoring).toContain('DO NOT invent decisions to clear blockers');
    expect(authoring).toContain('DO NOT skip review in Continue Mode');

    const planCmd = read(PLAN_CMD);
    expect(planCmd).toContain('Apply its verdict table');
    expect(planCmd).toContain('DO NOT invent decisions to clear blockers');
  });
});
