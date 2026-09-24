// The scheme is resolved twice: inline in index.html before the first paint,
// and in src/lib/theme.ts after. Two copies of one rule drift, so this holds
// them to the same key and the same answers.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { DENSITY_KEY } from '@/lib/density';
import { THEME_KEY, resolveScheme, type ThemeChoice } from '@/lib/theme';
import { cn } from '@/lib/utils';

const HTML = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const INLINE = /<script>([\s\S]*?)<\/script>/.exec(HTML)?.[1] ?? '';

/** Runs the inline script with stored values and an OS scheme, and returns what it set. */
function run(store: Record<string, string>, systemDark: boolean): Record<string, string> {
  const dataset: Record<string, string> = {};
  runInNewContext(INLINE, {
    localStorage: { getItem: (k: string) => store[k] ?? null },
    matchMedia: () => ({ matches: systemDark }),
    document: { documentElement: { dataset } },
  });
  return dataset;
}

function inline(stored: string | null, systemDark: boolean): string | undefined {
  return run(stored === null ? {} : { [THEME_KEY]: stored }, systemDark).theme;
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

describe('the inline script sets the density with lib/density.ts\'s key', () => {
  it('reads the same storage key', () => {
    expect(INLINE).toContain(`'${DENSITY_KEY}'`);
  });
  it('is compact only when compact was saved', () => {
    expect(run({ [DENSITY_KEY]: 'compact' }, false).density).toBe('compact');
    expect(run({}, false).density).toBe('comfortable');
    expect(run({ [DENSITY_KEY]: 'junk' }, false).density).toBe('comfortable');
  });
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
