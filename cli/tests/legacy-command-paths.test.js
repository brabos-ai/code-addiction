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
});
