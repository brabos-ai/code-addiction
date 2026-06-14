import { describe, it, expect } from 'vitest';
import { PROVIDERS, PROVIDER_PRIORITY, resolveSelected } from '../src/providers.js';

describe('PROVIDERS', () => {
  it('contains exactly the 4 MCP-capable provider keys', () => {
    for (const k of ['claude', 'codex', 'cursor', 'antigrav']) {
      expect(PROVIDERS, `missing provider: ${k}`).toHaveProperty(k);
    }
    expect(Object.keys(PROVIDERS).sort()).toEqual(['antigrav', 'claude', 'codex', 'cursor']);
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

describe('PROVIDER_PRIORITY', () => {
  it('lists claude, codex, cursor, antigrav in that order', () => {
    expect(PROVIDER_PRIORITY).toEqual(['claude', 'codex', 'cursor', 'antigrav']);
  });

  it('all priority keys exist in PROVIDERS', () => {
    for (const k of PROVIDER_PRIORITY) {
      expect(PROVIDERS).toHaveProperty(k);
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
    const result = resolveSelected(['claude', 'cursor']);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.key)).toEqual(['claude', 'cursor']);
  });
});
