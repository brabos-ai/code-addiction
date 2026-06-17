import { describe, it, expect } from 'vitest';
import { PROVIDERS, PROVIDER_PRIORITY, resolveSelected, globalCapable } from '../src/providers.js';

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

describe('globalDest', () => {
  it('maps each provider to its documented global destination root', () => {
    expect(PROVIDERS.claude.globalDest).toBe('.claude');
    expect(PROVIDERS.codex.globalDest).toBe('.agents');
    expect(PROVIDERS.cursor.globalDest).toBeNull();
    expect(PROVIDERS.antigrav.globalDest).toBeNull();
    expect(PROVIDERS.opencode.globalDest).toBe('.config/opencode');
  });
});

describe('resolveSelected (scope-aware)', () => {
  it('defaults to project scope (unchanged behavior)', () => {
    const result = resolveSelected(['claude', 'opencode']);
    expect(result.map((r) => r.dest)).toEqual(['.claude', '.opencode']);
  });

  it('returns global dests for scope "global"', () => {
    const result = resolveSelected(['claude', 'opencode'], 'global');
    expect(result.map((r) => r.key)).toEqual(['claude', 'opencode']);
    expect(result.map((r) => r.dest)).toEqual(['.claude', '.config/opencode']);
  });

  it('drops providers without a global dest in global scope', () => {
    expect(resolveSelected(['cursor'], 'global')).toEqual([]);
    expect(resolveSelected(['antigrav'], 'global')).toEqual([]);
    const mixed = resolveSelected(['claude', 'cursor', 'antigrav', 'codex'], 'global');
    expect(mixed.map((r) => r.key)).toEqual(['claude', 'codex']);
  });
});

describe('globalCapable', () => {
  it('is true only for providers with a global dest', () => {
    expect(globalCapable('claude')).toBe(true);
    expect(globalCapable('codex')).toBe(true);
    expect(globalCapable('opencode')).toBe(true);
    expect(globalCapable('cursor')).toBe(false);
    expect(globalCapable('antigrav')).toBe(false);
  });

  it('is false for unknown keys', () => {
    expect(globalCapable('nope')).toBe(false);
  });
});
