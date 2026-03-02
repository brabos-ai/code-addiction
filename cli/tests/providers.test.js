import { describe, it, expect } from 'vitest';
import { PROVIDERS, resolveSelected } from '../src/providers.js';

describe('PROVIDERS', () => {
  it('has exactly 5 providers', () => {
    expect(Object.keys(PROVIDERS)).toHaveLength(5);
  });

  it('contains expected keys', () => {
    expect(PROVIDERS).toHaveProperty('claude');
    expect(PROVIDERS).toHaveProperty('codex');
    expect(PROVIDERS).toHaveProperty('antigrav');
    expect(PROVIDERS).toHaveProperty('kilocode');
    expect(PROVIDERS).toHaveProperty('opencode');
  });

  it('each provider has src, dest, label, hint', () => {
    for (const [key, p] of Object.entries(PROVIDERS)) {
      expect(p, `provider ${key}`).toMatchObject({
        label: expect.any(String),
        hint: expect.any(String),
        src: expect.stringContaining('framwork/'),
        dest: expect.stringMatching(/^\./),
      });
    }
  });
});

describe('resolveSelected', () => {
  it('returns empty array for empty input', () => {
    expect(resolveSelected([])).toEqual([]);
  });

  it('maps claude key correctly', () => {
    const result = resolveSelected(['claude']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: 'claude',
      src: 'framwork/.claude',
      dest: '.claude',
    });
  });

  it('maps multiple keys', () => {
    const result = resolveSelected(['claude', 'kilocode']);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.key)).toEqual(['claude', 'kilocode']);
  });
});
