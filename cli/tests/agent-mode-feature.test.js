/**
 * agent-mode feature -- plan 2026-10-09T184411-PLAN--agent-mode-feature (0038B).
 *
 * L1 levels of the plan's Validation Matrix. Each describe block is the level
 * that goes green in the F-block named in its title; the file grows with the
 * build, one RED-first assertion per F-block.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { PROVIDERS } from '../src/providers.js';
import { composeSlot, resolvePlaceholders } from '../src/injection-core.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const require = createRequire(import.meta.url);
const { resolveResourcePaths } = require(path.join(ROOT, 'scripts', 'build.js'));
const PROVIDER_MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8')).providers;
const CMD_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.commandsSubdir).map(([k]) => k);

describe('L1.1 (F1) -- a fallback resolves its placeholders per provider', () => {
  const TEXT = 'load {{skill:add--human-interaction/SKILL.md}}, then {{cmd:add-plan}} ({{addpath:scripts/x.cjs}})';
  const slot = (fallback) => ({
    id: 'agent-mode.interaction',
    resource: { name: 'add-plan', kind: 'command' },
    fallback,
    members: [{ namespace: 'feature', name: 'agent-mode', section: 'interaction' }],
  });

  it.each(CMD_PROVIDERS)('%s: the fallback equals what the build resolves for the same text', (key) => {
    const composed = composeSlot(slot(TEXT), [{ contribute: false }], PROVIDERS[key]);
    expect(composed.usedFallback).toBe(true);
    expect(composed.text).toBe(resolveResourcePaths(TEXT, PROVIDER_MAP[key]));
    expect(composed.text).toBe(resolvePlaceholders(TEXT, PROVIDERS[key]));
    expect(composed.text).not.toMatch(/\{\{(skill|cmd|addpath):/);
  });

  it('a contributing member still wins over the fallback', () => {
    const composed = composeSlot(slot(TEXT), [{ contribute: true, text: 'member\n' }], PROVIDERS.claude);
    expect(composed.usedFallback).toBe(false);
    expect(composed.text).toBe('member\n');
  });

  it('an empty fallback stays zero bytes', () => {
    expect(composeSlot(slot(''), [{ contribute: false }], PROVIDERS.claude).text).toBe('');
  });

  it('with no provider the fallback is returned as authored (the old call shape)', () => {
    expect(composeSlot(slot(TEXT), [{ contribute: false }]).text).toBe(TEXT);
  });
});

describe('L1.8 (F2) -- a fallback holding a raw .codeadd/ path warns at build', () => {
  const build = require(path.join(ROOT, 'scripts', 'build.js'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fallback-lint-'));
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
  beforeEach(() => build._resetLintCache());

  it('warns for a raw .codeadd/skills/ reference and returns the bytes unchanged', () => {
    const file = path.join(tmp, 'agent-mode.raw.md');
    fs.writeFileSync(file, 'read .codeadd/skills/add--human-interaction/SKILL.md first\n');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(build.readFallbackFile(file)).toBe('read .codeadd/skills/add--human-interaction/SKILL.md first');
      expect(warn.mock.calls.map((c) => c.join(' ')).join('\n')).toMatch(/LINT .*raw \.codeadd\/skills\/ reference/);
    } finally {
      warn.mockRestore();
    }
  });

  it('is silent for a fallback that uses a placeholder', () => {
    const file = path.join(tmp, 'agent-mode.clean.md');
    fs.writeFileSync(file, 'read {{skill:add--human-interaction/SKILL.md}} first\n');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      build.readFallbackFile(file);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
