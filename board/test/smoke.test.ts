import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('scaffold', () => {
  it('merges class names, the later Tailwind utility winning', () => {
    expect(cn('p-2', false && 'hidden', 'p-4')).toBe('p-4');
  });
});
