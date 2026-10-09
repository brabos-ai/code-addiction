import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-10-08T211926 — lighter add-build (ticket 0034B).
 *
 * The plan's Validation Matrix, L1 (text/structure assertions), one describe
 * per F-block. Written RED against the pre-plan tree: add-build.md dispatched a
 * readback and a validator per task, re-reviewed every fix round, and named
 * /add-review as an optional next step; add-review.md always ran the spec
 * audit and the OWASP pass. Guards (GREEN today, must stay GREEN) are marked.
 *
 * L2 lives in scripts/tests/converge-gates.test.cjs, L3 and L4 run in the build.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const P = {
  build: path.join(CODEADD, 'commands', 'add-build.md'),
  review: path.join(CODEADD, 'commands', 'add-review.md'),
  hotfix: path.join(CODEADD, 'commands', 'add-hotfix.md'),
  router: path.join(CODEADD, 'commands', 'add.md'),
  discipline: path.join(CODEADD, 'skills', 'add--review-discipline', 'SKILL.md'),
  sdd: path.join(CODEADD, 'skills', 'add--subagent-driven-development', 'SKILL.md'),
  ecosystem: path.join(CODEADD, 'skills', 'add--ecosystem', 'SKILL.md'),
  qaBuildFragment: path.join(CODEADD, 'fragments', 'qa-pipeline', 'add-build.md'),
};

const read = (p) => fs.readFileSync(p, 'utf8');

/**
 * The body of a `#{2,4} <title>` section, up to the next heading at the same
 * level or shallower. Located by title so a renumbering cannot silently move it.
 */
function section(text, title) {
  const m = text.match(new RegExp(`^(#{2,4}) ${title}`, 'm'));
  if (!m) return null;
  const level = m[1].length;
  const rest = text.slice(m.index + m[0].length).search(new RegExp(`^#{1,${level}} `, 'm'));
  return rest < 0 ? text.slice(m.index) : text.slice(m.index, m.index + m[0].length + rest);
}

describe('F1 — add-build no longer dispatches a readback', () => {
  it('L1.1 add-build.md has no readback dispatch, ledger line or step', () => {
    const t = read(P.build);
    expect(t).not.toContain('@readback-agent');
    expect(t).not.toContain('agent: readback-agent');
    expect(t).not.toContain('Readback:');
    expect(t).not.toContain('read-plan-cold');
  });

  it('L1.2 the ledger example in add--subagent-driven-development has no Readback line', () => {
    expect(read(P.sdd)).not.toMatch(/^Readback: /m);
  });

  it('L1.3 add--review-discipline does not name /add-build as a readback site', () => {
    const t = read(P.discipline);
    expect(t).not.toContain('10.0.4');
    expect(t).not.toMatch(/add-build's readback/);
    expect(t).not.toMatch(/`\/add-build`'s readback/);
  });

  it('L1.4 add--ecosystem does not give add-build a readback', () => {
    expect(read(P.ecosystem)).not.toContain('add-build (cold readback');
  });

  it('guard: add-plan still dispatches the readback', () => {
    expect(read(path.join(CODEADD, 'commands', 'add-plan.md'))).toContain('@readback-agent');
  });
});

describe('F2 — the TASKS MODE validator runs once per area', () => {
  const tasksMode = () => section(read(P.build), 'TASKS MODE \\(when tasks.md exists\\)');

  it('L1.5 TASKS MODE validates once per area, after the area\'s last task', () => {
    const s = tasksMode();
    expect(s).not.toBeNull();
    expect(s).toMatch(/once per area/i);
    expect(s).toContain('AREA_BASE');
  });

  it('L1.6 the COMMIT CONTRACT gates a TASKS MODE commit on the build, and keeps the validator gate elsewhere', () => {
    const t = read(P.build);
    expect(t).toContain('In TASKS MODE the commit gate is the build');
    expect(t).toMatch(/DEVELOPMENT and CORRECTION MODE[^\n]*area validator/);
  });

  it('L1.7 the area-end ledger line and its resume rule are specified', () => {
    const t = read(P.build);
    expect(t).toContain('<area>: validated (commits AREA_BASE..HEAD');
    expect(t).toContain('resumes at its validator');
  });

  it('L1.8 the TASKS MODE prompt addition carries one brief per dispatch', () => {
    expect(read(P.build)).not.toContain('Execute ALL tasks in order');
  });

  it('L1.9 add--subagent-driven-development steps 5 and 6 name the per-area variant', () => {
    const t = read(P.sdd);
    expect(section(t, '5\\. Review Subagent')).toMatch(/once per area/i);
    expect(section(t, '6\\. Commit and Record')).toMatch(/TASKS MODE/);
  });
});

