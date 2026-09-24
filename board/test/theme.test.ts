// The scheme is resolved twice: inline in index.html before the first paint,
// and in src/lib/theme.ts after. Two copies of one rule drift, so this holds
// them to the same key and the same answers.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { THEME_KEY, resolveScheme, type ThemeChoice } from '@/lib/theme';
import { cn } from '@/lib/utils';

const HTML = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const INLINE = /<script>([\s\S]*?)<\/script>/.exec(HTML)?.[1] ?? '';

/** Runs the inline script with a stored choice and an OS scheme, and returns what it set. */
function inline(stored: string | null, systemDark: boolean): string | undefined {
  const dataset: Record<string, string> = {};
  runInNewContext(INLINE, {
    localStorage: { getItem: (k: string) => (k === THEME_KEY ? stored : null) },
    matchMedia: () => ({ matches: systemDark }),
    document: { documentElement: { dataset } },
  });
  return dataset.theme;
}

describe('the inline scheme script agrees with lib/theme.ts', () => {
  it('reads the same storage key', () => {
    expect(INLINE).toContain(`'${THEME_KEY}'`);
  });

  const cases: [string | null, ThemeChoice][] = [[null, 'system'], ['light', 'light'], ['dark', 'dark'], ['junk', 'system']];
  for (const [stored, choice] of cases) {
    for (const systemDark of [false, true]) {
      it(`stored ${stored}, OS ${systemDark ? 'dark' : 'light'}`, () => {
        expect(inline(stored, systemDark)).toBe(resolveScheme(choice, systemDark));
      });
    }
  }
});

describe('cn keeps a named type size beside a colour', () => {
  // tailwind-merge read text-meta as a colour and dropped it when text-muted
  // followed, so filter buttons and the view switch rendered at 16px.
  it('keeps text-meta next to text-muted', () => {
    expect(cn('text-meta', 'text-muted')).toBe('text-meta text-muted');
  });

  it('still lets a later size win', () => {
    expect(cn('text-meta', 'text-body')).toBe('text-body');
  });
});
