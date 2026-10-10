import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const read = (name) =>
  fs.readFileSync(path.join(ROOT, 'framwork', '.codeadd', 'commands', `${name}.md`), 'utf8');

/** Bugs found in the 0038B review, already wrong on main (ticket 0040B). */
describe('legacy command document paths', () => {
  it('add-review points the next step at the directory it writes review-NNN.md to', () => {
    const src = read('add-review');
    expect(src).not.toContain('docs/reviews/');
    expect(src).toContain('| `docs/features/${FEATURE_ID}/review-NNN.md` |');
  });

  it('add-hotfix does not offer a fix-report.md no step writes', () => {
    expect(read('add-hotfix')).not.toContain('fix-report.md');
  });

  it('add-new writes discovery.md on the bounded path, which /add-plan requires', () => {
    const src = read('add-new');
    const row = src.split('\n').find((l) => l.startsWith('| `bounded`, or clean on all three facts | **Skipped.** Run the INDEX'));
    expect(row).toContain('discovery.md');
  });

  it('add-new re-entry with a validated about.md lands on decompose in both places', () => {
    const lines = read('add-new').split('\n');
    const entry = lines.find((l) => l.startsWith('- [CONTINUE MODE]'));
    const skip = lines.find((l) => l.startsWith('- If `about.md` exists AND carries its validated decisions'));
    expect(entry).toContain('proceed to STEP add-new.decompose');
    expect(entry).not.toContain('proceed to STEP add-new.confirm');
    expect(skip).toContain('proceed to STEP add-new.decompose');
  });
});
