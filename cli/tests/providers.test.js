import { describe, it, expect } from 'vitest';
import { PROVIDERS, PROVIDER_PRIORITY, resolveSelected } from '../src/providers.js';

describe('PROVIDERS', () => {
  it('contains exactly the 5 MCP-capable provider keys', () => {
    for (const k of ['claude', 'codex', 'cursor', 'antigrav', 'opencode']) {
      expect(PROVIDERS, `missing provider: ${k}`).toHaveProperty(k);
    }
    expect(Object.keys(PROVIDERS).sort()).toEqual(['antigrav', 'claude', 'codex', 'cursor', 'opencode']);
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
  it('lists claude, codex, cursor, antigrav, opencode in that order', () => {
    expect(PROVIDER_PRIORITY).toEqual(['claude', 'codex', 'cursor', 'antigrav', 'opencode']);
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

  it('skips keys not in PROVIDERS (removed providers in an old manifest)', () => {
    // An install made before provider reduction may list dropped providers.
    // resolveSelected MUST drop them, not emit entries with undefined dest/src
    // (which would crash path.join during update/install).
    const result = resolveSelected(['claude', 'kilocode', 'gemini', 'cursor']);
    expect(result.map((r) => r.key)).toEqual(['claude', 'cursor']);
    for (const r of result) {
      expect(typeof r.dest).toBe('string');
      expect(typeof r.src).toBe('string');
    }
  });
});
