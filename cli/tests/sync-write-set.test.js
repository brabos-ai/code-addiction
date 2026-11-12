import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Static assertions over two internal commands (plan docs-branch-fixes, F9 and F18).
 * The prose they check must not name the previous docs location in its slash form, and neither
 * does this file: the zero-legacy guard scans both.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('F9 — add-framework--sync declares a write-set and guards it', () => {
  const src = () => read('workbench/commands/add-framework--sync.md');

  it('declares its write-set, with any document output only under the docs root', () => {
    const text = src();
    expect(text).toMatch(/write-set/i);
    for (const item of ['README.md', 'web/', 'ecosystem.md', 'add--ecosystem', '.tmp/sync/']) expect(text).toContain(item);
    expect(text).toContain('.codeadd/docs/');
  });

  it('opens with a STEP 0 listed in the ordered steps, that stops on a tracked top-level docs folder and snapshots the status', () => {
    const text = src();
    const order = text.slice(text.indexOf('STEPS IN ORDER'), text.indexOf('ABSOLUTE PROHIBITIONS'));
    expect(order).toMatch(/STEP 0:/);
    const step0 = text.slice(text.indexOf('## STEP 0'), text.indexOf('## STEP 1'));
    expect(step0).toContain('git ls-files -- docs');
    expect(step0).toMatch(/STOP/);
    expect(step0).toContain('git status --porcelain');
  });

  it('STEP 6 re-checks that no top-level docs path is tracked and that nothing new sits outside the write-set', () => {
    const text = src();
    const step6 = text.slice(text.indexOf('## STEP 6'));
    expect(step6).toContain('git ls-files -- docs');
    expect(step6).toContain('git status --porcelain');
    expect(step6).toMatch(/snapshot/i);
  });

  it('bans broad staging after a sync and still leaves changes uncommitted', () => {
    const text = src();
    expect(text).toContain('git add -A');
    expect(text).toContain('git add .');
    expect(text).toMatch(/stage[^\n]*by name/i);
    expect(text).toMatch(/uncommitted/i);
  });

  it('never writes the previous docs location in its slash form', () => {
    const slash = new RegExp('(?<![A-Za-z0-9_.-])(?<!\\.codeadd/)' + 'do' + 'cs/');
    expect(src().split('\n').filter((l) => slash.test(l))).toEqual([]);
  });
});

describe('F18 — add-framework--release promotes the changelog in the bump commit', () => {
  const src = () => read('workbench/commands/add-framework--release.md');
  const section = (text, from, to) => text.slice(text.indexOf(from), text.indexOf(to));

  it('STEP 4 runs changelog-promote on a stable release and commits CHANGELOG.md with the two package files', () => {
    const step4 = section(src(), '## STEP 4', '## STEP 5');
    expect(step4).toContain('node scripts/changelog-promote.cjs');
    expect(step4).toMatch(/stable/i);
    expect(step4).toContain('CHANGELOG.md');
    expect(step4).toMatch(/cli\/package\.json/);
    expect(step4).toMatch(/cli\/package-lock\.json|BOTH files|three files|both package files/i);
    expect(step4).toMatch(/bump commit|chore: bump version/);
  });

  it('STEP 6 builds the release notes from the promoted section and lets commits and deliveries enrich it', () => {
    const step6 = section(src(), '## STEP 6', '## STEP 7');
    expect(step6).toMatch(/promoted section/i);
    expect(step6).toMatch(/enrich/i);
    expect(step6).toContain('CHANGELOG.md');
  });

  it('STEP 7 names the changelog gate of the tag script', () => {
    const step7 = section(src(), '## STEP 7', '## STEP 8');
    expect(step7).toMatch(/CHANGELOG\.md/);
    expect(step7).toMatch(/changelog-promote\.cjs|changelog gate/i);
  });

  it('the NEVER list no longer bans the file, and bans only a second changelog file', () => {
    const text = src();
    const never = text.slice(text.lastIndexOf('NEVER:'));
    expect(never).not.toMatch(/Create `CHANGELOG\.md` files/);
    expect(never).toMatch(/second changelog file/i);
  });

  it('never writes the previous docs location in its slash form', () => {
    const slash = new RegExp('(?<![A-Za-z0-9_.-])(?<!\\.codeadd/)' + 'do' + 'cs/');
    expect(src().split('\n').filter((l) => slash.test(l))).toEqual([]);
  });
});
