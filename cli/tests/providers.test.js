import { describe, it, expect } from 'vitest';
import { PROVIDERS, PROVIDER_PRIORITY, resolveSelected, globalCapable, agentDest, ownedRoots, exclusiveFiles } from '../src/providers.js';

describe('PROVIDERS', () => {
  it('contains exactly the 6 MCP-capable provider keys', () => {
    for (const k of ['claude', 'codex', 'cursor', 'antigrav', 'opencode', 'zcode']) {
      expect(PROVIDERS, `missing provider: ${k}`).toHaveProperty(k);
    }
    expect(Object.keys(PROVIDERS).sort()).toEqual(['antigrav', 'claude', 'codex', 'cursor', 'opencode', 'zcode']);
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
  it('lists claude, codex, cursor, antigrav, opencode, zcode in that order', () => {
    expect(PROVIDER_PRIORITY).toEqual(['claude', 'codex', 'cursor', 'antigrav', 'opencode', 'zcode']);
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
    expect(PROVIDERS.zcode.globalDest).toBe('.agents');
  });
});

describe('zcode', () => {
  it('reuses codex\'s src/dest for commands and skills, and has its own agents dest', () => {
    expect(PROVIDERS.zcode.src).toBe(PROVIDERS.codex.src);
    expect(PROVIDERS.zcode.dest).toBe(PROVIDERS.codex.dest);
    expect(PROVIDERS.zcode.commandsSubdir).toBeNull();
    expect(PROVIDERS.zcode.skillsSubdir).toBe('skills');
    expect(PROVIDERS.zcode.agentsSrc).toBe('framwork/.zcode');
    expect(PROVIDERS.zcode.agentsDest).toBe('.zcode');
    expect(agentDest(resolveSelected(['zcode'])[0])).toBe('.zcode');
  });

  it('installing codex and zcode together writes to exactly one commands/skills destination', () => {
    const result = resolveSelected(['codex', 'zcode']);
    expect(result.map((r) => r.dest)).toEqual(['.agents', '.agents']);
    expect(result.map((r) => r.src)).toEqual(['framwork/.agents', 'framwork/.agents']);
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
    expect(globalCapable('zcode')).toBe(true);
    expect(globalCapable('cursor')).toBe(false);
    expect(globalCapable('antigrav')).toBe(false);
  });

  it('is false for unknown keys', () => {
    expect(globalCapable('nope')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ownedRoots / exclusiveFiles — which files a provider removal may delete (L1.1)
// ---------------------------------------------------------------------------
describe('ownedRoots', () => {
  it('returns dest and the agent root, without repeating a shared one', () => {
    expect(ownedRoots(resolveSelected(['claude'])[0])).toEqual(['.claude']);
    expect(ownedRoots(resolveSelected(['codex'])[0])).toEqual(['.agents', '.codex']);
    expect(ownedRoots(resolveSelected(['zcode'])[0])).toEqual(['.agents', '.zcode']);
  });

  it('uses the scope-resolved dest in global scope', () => {
    expect(ownedRoots(resolveSelected(['opencode'], 'global')[0])).toEqual(['.config/opencode']);
  });
});

describe('exclusiveFiles (L1.1)', () => {
  const files = [
    '.codeadd/core.md',
    '.claude/commands/a.md',
    '.agents/skills/x/SKILL.md',
    '.codex/agents/a.toml',
    '.zcode/agents/a.md',
    '.cursor/commands/a.md',
    '.cursor/skills/x/SKILL.md',
    '.opencode/commands/a.md',
    '.config/opencode/commands/a.md',
  ];
  const sel = (keys, scope) => resolveSelected(keys, scope);

  it('removing codex with zcode remaining returns .codex/** and not the shared .agents/**', () => {
    expect(exclusiveFiles(files, sel(['codex']), sel(['claude', 'zcode']))).toEqual(['.codex/agents/a.toml']);
  });

  it('removing zcode with codex remaining returns .zcode/** only', () => {
    expect(exclusiveFiles(files, sel(['zcode']), sel(['claude', 'codex']))).toEqual(['.zcode/agents/a.md']);
  });

  it('removing codex with nobody sharing .agents returns .agents/** too', () => {
    expect(exclusiveFiles(files, sel(['codex']), sel(['claude'])).sort()).toEqual([
      '.agents/skills/x/SKILL.md',
      '.codex/agents/a.toml',
    ]);
  });

  it('removing cursor returns every .cursor/** file and nothing else', () => {
    expect(exclusiveFiles(files, sel(['cursor']), sel(['claude']))).toEqual([
      '.cursor/commands/a.md',
      '.cursor/skills/x/SKILL.md',
    ]);
  });

  it('does not match a sibling directory that only shares a name prefix', () => {
    expect(exclusiveFiles(['.claude-extra/a.md', '.claude/a.md'], sel(['claude']), [])).toEqual(['.claude/a.md']);
  });

  it('in global scope removing opencode returns .config/opencode/**, not .opencode/**', () => {
    expect(exclusiveFiles(files, sel(['opencode'], 'global'), sel(['claude'], 'global'))).toEqual([
      '.config/opencode/commands/a.md',
    ]);
  });
});
