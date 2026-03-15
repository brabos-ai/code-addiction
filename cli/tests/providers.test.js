import { describe, it, expect } from 'vitest';
import { PROVIDERS, PROVIDER_PRIORITY, resolveSelected } from '../src/providers.js';

describe('PROVIDERS', () => {
  it('contains all expected provider keys', () => {
    for (const k of ['claude', 'codex', 'antigrav', 'opencode', 'kilocode',
      'gemini', 'cursor', 'windsurf', 'copilot', 'auggie', 'roo', 'kiro', 'qwen', 'shai', 'bob']) {
      expect(PROVIDERS, `missing provider: ${k}`).toHaveProperty(k);
    }
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
  it('lists claude, codex, antigrav, opencode in that order', () => {
    expect(PROVIDER_PRIORITY).toEqual(['claude', 'codex', 'antigrav', 'opencode']);
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
    const result = resolveSelected(['claude', 'kilocode']);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.key)).toEqual(['claude', 'kilocode']);
  });
});
