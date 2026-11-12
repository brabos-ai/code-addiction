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
