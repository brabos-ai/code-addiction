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
  router: path.join(CODEADD, 'commands', 'add-help.md'),
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

  it('L1.4 add--ecosystem does not give add-build a readback or the retired 10.0.4 site', () => {
    const t = read(P.ecosystem);
    expect(t).not.toContain('add-build (cold readback');
    expect(t).not.toContain('10.0.4');
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

  it('L1.9a the SDD checklist and the tdd fragment carry the TASKS MODE variant', () => {
    expect(read(P.sdd)).toMatch(/Code review dispatched after every implementation task — in `\/add-build` TASKS MODE/);
    const fragment = read(path.join(CODEADD, 'fragments', 'tdd-pipeline', 'add-build.md'));
    expect(fragment).toContain('In TASKS MODE the unit of this order is the area');
  });
});

describe('F3 — a build-only fix round gets no re-review', () => {
  it('L1.10 add-build specifies the build-only round, its ledger shape and that it is not re-reviewed', () => {
    const t = read(P.build);
    expect(t).toMatch(/fix round \d\/3 \(build-only/);
    expect(t).toMatch(/gets no re-review/);
  });

  it('L1.11 the Compliance Gate accepts a build-only round and still refuses other unverified rounds', () => {
    const s = section(read(P.build), 'STEP add-build.comply');
    expect(s).toMatch(/build-only[\s\S]*other fix\s+round[\s\S]*unverified/);
  });

  it('L1.11a the STEP list no longer says every fix is re-reviewed', () => {
    expect(read(P.build)).not.toContain('re-review every fix;');
  });

  it('L1.12 the exception is scoped to /add-build, and add-hotfix keeps its snapshot re-review', () => {
    const s = section(read(P.sdd), '7\\. Fix Loop');
    expect(s).toContain('build-only');
    expect(s).toContain('/add-build');
    expect(read(P.hotfix)).toContain('MODE: re-review');
  });

  it('L1.12a the CORRECTION branch of Final Review names both triggers for the normal review', () => {
    const s = section(read(P.build), 'Final Review');
    expect(s).toContain('last fix round was build-only');
    expect(s).toMatch(/no round was\s+re-reviewed/);
  });

  it('L1.13 (guard) fix attempts stay at 3', () => {
    const t = read(P.build);
    expect(t).toContain('MAX_ATTEMPTS = 3');
    expect(t).not.toMatch(/MAX_ATTEMPTS = (2|4|5)/);
  });
});

describe('F4 — add-review does not repeat the build\'s Final Review', () => {
  it('L1.14 the Final review head line is named by add--review-discipline and add-build', () => {
    expect(read(P.discipline)).toContain('Final review head:');
    expect(read(P.build)).toContain('Final review head:');
  });

  it('L1.15 add-build no longer names /add-review as an optional next step', () => {
    const s = section(read(P.build), 'STEP add-build.next-command');
    expect(s).not.toBeNull();
    expect(s).not.toMatch(/named\s+as optional/);
  });

  it('L1.16 the qa-pipeline build fragment no longer calls re-running add-review optional', () => {
    expect(read(P.qaBuildFragment)).not.toMatch(/Re-running[^\n]*add-review[^\n]*optional/);
  });

  it('L1.17 add-review specifies the skip: flag, conditions, record and OWASP', () => {
    const t = read(P.review);
    expect(t).toContain('BUILD_REVIEW_COVERS');
    expect(t).toContain('Final review head:');
    expect(t).toContain('Spec audit: SKIPPED');
    expect(t).toMatch(/OWASP[^\n]*skipp|skipp[^\n]*OWASP/i);
    expect(t).toContain('reads `passed` or `ruled N`');
    expect(t).toContain('git diff --name-only <sha>..HEAD');
    expect(t).toContain('git status --porcelain');
  });

  it('L1.17a the ledger table lists the final review and its head line', () => {
    expect(read(P.build)).toMatch(/\| final review \| `Final review: <verdict>/);
  });

  it('L1.18 (guard) add-review still runs the test-spec slot and the area reviewers', () => {
    const t = read(P.review);
    expect(t).toContain('slot:tdd-pipeline.spec-audit');
    expect(t).toContain('STEP add-review.dispatch-strategy');
  });

  it('L1.19 (guard) the router still calls /add-review optional', () => {
    expect(read(P.router)).toMatch(/\/add-review[^\n]*optional|optional[^\n]*\/add-review/i);
  });
});
