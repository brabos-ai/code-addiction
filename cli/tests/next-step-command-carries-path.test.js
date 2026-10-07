import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-10-07T144204 -- next-step command carries the path.
 *
 * The L1 matrix of the plan's Validation Matrix. Authored RED, before F2, and
 * driven GREEN across F2-F10.
 *
 * This is a static text suite over `workbench/` and nothing else. It reads the
 * internal-layer sources and never touches `framwork/`. It asserts three kinds
 * of fact: INTERFACE (the section and the strings the closings point at),
 * NEGATIVE (the `[slug]` / `[idea]` placeholders and the dropped `@` are gone),
 * and PRESERVATION (the STOP bullets, the build's no-handoff sentence and the
 * commands that print no continuation line are untouched).
 *
 * It asserts NOTHING about how a model behaves at a closing. That the printed
 * path exists on disk is the `test -f` instruction here plus L3 of the plan.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, 'workbench', rel), 'utf8');

const FINAL_REPORT = 'skills/add-final-report/SKILL.md';
const AUTHORING = 'skills/add-plan-authoring/SKILL.md';
const TEMPLATE = 'skills/add-plan-authoring/references/plan-template.md';
const BRAINSTORM = 'skills/add-framework--brainstorm/SKILL.md';
const PLAN = 'skills/add-framework--plan/SKILL.md';
const BUILD = 'skills/add-framework--build/SKILL.md';
const DONE = 'skills/add-framework--done/SKILL.md';

/** Text of the H2 section starting at `heading`, up to the next H2 (or the end). */
const section = (text, heading) => {
  const start = text.indexOf(heading);
  if (start === -1) return '';
  const rest = text.slice(start + heading.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
};

const PLACEHOLDER = /\/add-framework--\w+ \[(slug|idea)\]/;

describe('L1.1 -- add-final-report owns The Continuation Line', () => {
  const text = read(FINAL_REPORT);

  it('has the section, the format, the on-disk check and the position', () => {
    expect(text).toContain('## The Continuation Line');
    expect(text).toContain('<relative path>');
    expect(text).toContain('test -f');
    expect(text).toMatch(/last line of the metadata/);
  });
});

describe('L1.2 -- the three closings point at the rule', () => {
  it.each([BRAINSTORM, PLAN, BUILD])('%s names The Continuation Line', (file) => {
    expect(read(file)).toContain('The Continuation Line');
  });
});

describe('L1.3 -- no placeholder argument in a closing or a Next Steps line', () => {
  it('brainstorm carries none', () => {
    expect(read(BRAINSTORM)).not.toMatch(PLACEHOLDER);
  });

  it('the plan template carries none', () => {
    expect(read(TEMPLATE)).not.toMatch(PLACEHOLDER);
  });

  it('plan carries none outside its Operation Mode', () => {
    const text = read(PLAN);
    const mode = section(text, '## Operation Mode');
    expect(mode).not.toBe('');
    expect(text.replace(mode, '')).not.toMatch(PLACEHOLDER);
  });
});

describe('L1.4 -- Argument Resolution normalises a path and keeps its STOPs', () => {
  const resolution = section(read(AUTHORING), '## Argument Resolution');

  it('strips the directory part and the trailing .md before the match', () => {
    expect(resolution).toMatch(/directory part/);
    expect(resolution).toMatch(/trailing `\.md`/);
    expect(resolution).toMatch(/before the match/i);
  });

  it('keeps both STOP bullets verbatim', () => {
    expect(resolution).toContain('- **More than one** → ⛔ STOP. Print every candidate basename and ask which. **NEVER guess.**');
    expect(resolution).toContain('- **No match** → list `docs/plans/` and STOP.');
  });
});

describe('L1.5 -- the Operation Mode blocks show a plain path', () => {
  it('plan shows a path under docs/', () => {
    expect(section(read(PLAN), '## Operation Mode')).toContain('/add-framework--plan docs/');
  });

  it('build shows a plan path', () => {
    expect(section(read(BUILD), '## Operation Mode')).toContain('/add-framework--build docs/plans/');
  });

  it('done shows a plan path', () => {
    expect(section(read(DONE), '## Operation Mode')).toContain('/add-framework--done docs/plans/');
  });
});

describe('L1.6 -- build closes on the done line and still never hands off', () => {
  const text = read(BUILD);

  it('STEP 10 prints the done command', () => {
    expect(section(text, '## STEP 10: Completion')).toContain('/add-framework--done <');
  });

  it('keeps the no-handoff sentence', () => {
    expect(text).toContain('Neither state hands off to `/add-framework--done`.');
  });
});

describe('L1.7 -- commands that close without a next stage print no continuation line', () => {
  it.each(['add-framework--backlog.md', 'add-framework--release.md', 'add-framework--sync.md'])(
    '%s',
    (file) => {
      const text = read(`commands/${file}`);
      expect(text).not.toContain('The Continuation Line');
      expect(text).not.toMatch(/\/add-framework--\w+ docs\//);
    },
  );
});

describe('L1.8 -- plan routes a non-plan path before it resolves the argument', () => {
  // Line breaks in the source are wrapping, not content: compare on collapsed whitespace.
  const mode = section(read(PLAN), '## Operation Mode').replace(/\s+/g, ' ');

  it('states the docs/plans/ distinction', () => {
    expect(mode).toMatch(/outside `docs\/plans\/`/);
  });

  it('states it before the resolve-first sentence', () => {
    const rule = mode.search(/outside `docs\/plans\/`/);
    const resolveFirst = mode.indexOf('resolve the argument BEFORE reading anything else');
    expect(resolveFirst).toBeGreaterThan(-1);
    expect(rule).toBeGreaterThan(-1);
    expect(rule).toBeLessThan(resolveFirst);
  });
});

describe('L1.9 -- the dedupe in add-final-report removes repetition and no rule', () => {
  const text = read(FINAL_REPORT);
  const rules = section(text, '## Rules');

  it('Rules no longer repeats the Deleted row, and keeps the sibling rule', () => {
    expect(rules).not.toContain('Write the Deleted row even when it reads');
    expect(rules).toContain('Merge this skill with its product sibling');
  });

  it('each dropped rule is still stated in the body', () => {
    expect(text).toContain('Deleted');
    expect(text).toContain('write "none" when none');
    expect(text).toMatch(/name the \*\*host and the exact step\*\*/);
    expect(text).toContain('Emit the report BEFORE any metadata');
    expect(text).toContain('in its own shape, whole');
    expect(text).toMatch(/Load this at the closing step/);
  });
});

describe('L1.10 -- no @ prefix on a path anywhere the change touches', () => {
  it.each([FINAL_REPORT, AUTHORING, TEMPLATE, BRAINSTORM, PLAN, BUILD, DONE])('%s', (file) => {
    const text = read(file);
    expect(text).not.toMatch(/\/add-framework--\w+ @/);
    expect(text).not.toMatch(/\s@docs\//);
  });
});
