import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-09-19T122048 — optional review, build final review.
 * Validation Matrix, levels L2 (text contract), L3 (build prompt) and L4
 * (wording sweep). L1 lives in framwork/.codeadd/scripts/tests/converge-gates.bats.
 *
 * Written RED against the pre-plan tree: /add.done blocks on a missing review,
 * /add.build hands every automatic delivery to /add.review, and nothing in the
 * build reviews the whole diff at once.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const cmd = (name) => path.join(CODEADD, 'commands', `${name}.md`);
const skill = (name) => path.join(CODEADD, 'skills', name, 'SKILL.md');

const P = {
  reviewer: path.join(CODEADD, 'agents', 'reviewer-agent.md'),
  discipline: skill('add-review-discipline'),
  mode: skill('add-delivery-mode'),
  ecosystem: skill('add-ecosystem'),
  build: cmd('add.build'),
  done: cmd('add.done'),
  review: cmd('add.review'),
  router: cmd('add'),
  qaSetup: cmd('add.qa-setup'),
  qaBuild: path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.build.md'),
};

/** The body of the `## <heading>` section, up to the next H2. */
function section(text, heading) {
  const start = text.indexOf(`\n## ${heading}`);
  expect(start, `section "${heading}" exists`).toBeGreaterThan(-1);
  const next = text.indexOf('\n## ', start + 4);
  return text.slice(start, next === -1 ? undefined : next);
}

/** Every .md file under dir, recursively. */
function mdFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// The line count of add.build.md on main at 34731b0, when this plan branched.
const BUILD_LINE_BUDGET = 1609;

describe('L2 — text contract', () => {
  it('L2.1 reviewer-agent documents MODE: feature and keeps task as the default', () => {
    const t = read(P.reviewer);
    expect(t).toMatch(/\| `feature` \|/);
    expect(t).toMatch(/## Feature Mode/);
    expect(t).toMatch(/`task` is the default whenever the caller omits/);
  });

  it("L2.2 add-review-discipline owns the build's final review, verbatim grammar included", () => {
    const s = section(read(P.discipline), "The Build's Final Review");
    expect(s).toContain('Final review: passed (after review-NNN)');
    expect(s).toContain('Final review: ruled N (after review-NNN)');
    expect(s).toContain('Final review: blocked N (after review-NNN)');
    expect(s).toContain('Blocker suggestion:');
    expect(s).toMatch(/MODE: feature/);
    expect(s).toMatch(/MODE: owasp/);
    expect(s).toMatch(/one `?@fix-agent`? wave/i);
    expect(s).toMatch(/never[^\n]*`Ruling:`|`Ruling:`[^\n]*never/i);
  });

  it('L2.3 add.done parses REVIEW_SOURCE, accepts skipped and asks before closing out without QA', () => {
    const t = read(P.done);
    expect(t).toContain('REVIEW_SOURCE');
    expect(t).toMatch(/GATE_QA_BASELINE[^\n]*skipped|skipped[^\n]*GATE_QA_BASELINE/);
    expect(t).toMatch(/qa-pipeline[\s\S]{0,600}REVIEW_SOURCE=build|REVIEW_SOURCE=build[\s\S]{0,600}qa-pipeline/);
    expect(t).toMatch(/deciding/);
  });

  it('L2.4 add.done prints GATE_REVIEW_DETAIL for the build verdict and never reads the ledger itself', () => {
    const t = read(P.done);
    expect(t).toMatch(/REVIEW_SOURCE=build[\s\S]{0,400}GATE_REVIEW_DETAIL/);
    expect(t).not.toContain('Review not executed. Run /add.review before /add.done.');
  });

  it('L2.5 add.review has no automatic hand-back and no "LAST gate"', () => {
    const t = read(P.review);
    expect(t).not.toMatch(/### 11\.5/);
    expect(t).not.toMatch(/LAST gate/);
    expect(t).not.toMatch(/third review round/i);
  });

  it('L2.6 add-delivery-mode no longer carries the two-round review loop', () => {
    const t = read(P.mode);
    expect(t).not.toMatch(/Two Rounds/);
    expect(t).not.toMatch(/third review round/i);
    expect(t).not.toMatch(/review-round baseline|Count review rounds/i);
  });
});

describe('L3 — the build prompt', () => {
  it('L3.1 add.build.md is no longer than it was at branch start', () => {
    const lines = read(P.build).split('\n').length - 1;
    expect(lines).toBeLessThanOrEqual(BUILD_LINE_BUDGET);
  });

  it('L3.2 the final review points at add-review-discipline; the loop is gone', () => {
    const t = read(P.build);
    const s = section(t, 'Final Review');
    expect(s).toMatch(/add-review-discipline/);
    expect(t).not.toMatch(/review baseline <NNN>/);
    expect(t).not.toMatch(/continuing to \/add\.review/);
  });

  it('L3.3 Loop End is entered after the final review or a correction run, not from /add.review', () => {
    const s = section(read(P.build), 'Loop End');
    expect(s).not.toMatch(/from `\/add\.review` on an automatic delivery/);
    expect(s).toMatch(/final review/i);
    expect(s).toMatch(/correction/i);
  });

  it('L3.4 Checkpoint step 0 reads REVIEW_SOURCE', () => {
    const s = section(read(P.build), 'The Checkpoint Sequence');
    expect(s).toContain('REVIEW_SOURCE');
  });

  it('L3.4b STEP 17 prints the build verdict and its blocker suggestions before asking', () => {
    const s = section(read(P.build), 'STEP 17: Publish');
    expect(s).toContain('Final review:');
    expect(s).toContain('Blocker suggestion:');
  });

  it('L3.4c the final-review heading is unnumbered and STEPs 13-18 keep their numbers', () => {
    const t = read(P.build);
    expect(t).toMatch(/\n## Final Review/);
    for (const n of [13, 14, 15, 16, 17, 18]) expect(t).toMatch(new RegExp(`\\n## STEP ${n}:`));
  });
});

describe('L4 — wording sweep', () => {
  it('L4.1 no product artefact still makes /add.review mandatory or runs review rounds', () => {
    const offenders = [];
    for (const f of mdFiles(CODEADD)) {
      const t = read(f);
      if (/Run \/add\.review before \/add\.done|two review rounds|LAST gate/.test(t)) {
        offenders.push(path.relative(ROOT, f));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("L4.2 add-ecosystem's reviewer-agent row names MODE: feature", () => {
    const row = read(P.ecosystem).split('\n').find((l) => l.startsWith('| reviewer-agent'));
    expect(row).toBeDefined();
    expect(row).toMatch(/MODE: feature/);
  });

  it('L4.3 the router sends a built feature to /add.done and calls /add.review optional', () => {
    const t = read(P.router);
    expect(t).not.toMatch(/Feature implemented, no review[^\n]*\/add\.review/);
    expect(t).toMatch(/\/add\.review[^\n]*optional|optional[^\n]*\/add\.review/i);
  });
});
