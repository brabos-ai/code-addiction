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

// ---------------------------------------------------------------------------
// L1.4 -- the human-only sections move, byte for byte, into add--human-interaction
// ---------------------------------------------------------------------------
const SKILLS = path.join(ROOT, 'framwork', '.codeadd', 'skills');
const MOVED_DIR = path.join(import.meta.dirname, 'fixtures', 'agent-mode-moved');
const readNorm = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const fixture = (name) => readNorm(path.join(MOVED_DIR, `${name}.md`)).replace(/\n$/, '');

// Each fixture is the text at the base commit (a14dd45), taken by line range.
// Where the passage lives afterwards: `from` is the skill it leaves (F5-F7).
const MOVED = [
  { name: 'dm-confirm-row', from: 'add--delivery-mode' },
  { name: 'dm-no-invocation', from: 'add--delivery-mode' },
  { name: 'dm-offer-gate', from: 'add--delivery-mode' },
  { name: 'dm-real-activity', from: 'add--delivery-mode' },
  { name: 'dm-deciding-not-replaced', from: 'add--delivery-mode' },
  { name: 'dm-semi-automatic', from: 'add--delivery-mode' },
  { name: 'dm-rule-offer-once', from: 'add--delivery-mode' },
  { name: 'dm-rule-no-invocation', from: 'add--delivery-mode' },
  { name: 'dm-rule-no-real-activity', from: 'add--delivery-mode' },
  { name: 'dm-rule-no-substitute', from: 'add--delivery-mode' },
  { name: 'fr-second-response-body', from: 'add--final-report' },
  { name: 'fs-structured-tool', from: 'add--feature-specification' },
];

describe('L1.4(a) (F4) -- add--human-interaction holds every moved section byte for byte', () => {
  const human = () => readNorm(path.join(SKILLS, 'add--human-interaction', 'SKILL.md'));

  it('exists with a name and description in its frontmatter', () => {
    const text = human();
    expect(text).toMatch(/^---\nname: add--human-interaction\ndescription: ".+"\n---\n/);
  });

  it.each(MOVED.map((m) => m.name))('holds %s verbatim', (name) => {
    expect(human()).toContain(fixture(name));
  });

  it('owns both continuation contract ids', () => {
    const text = human();
    expect(text).toContain('chat-continuation-eligibility-v1');
    expect(text).toContain('chat-continuation-output-v1');
  });

  it('is registered in the product provider map', () => {
    const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8'));
    expect(map.skills).toHaveProperty('add--human-interaction');
  });
});

// ---------------------------------------------------------------------------
// L1.5 -- the bot text describes behaviour, never the result contract
// ---------------------------------------------------------------------------
// Words a result contract owns. The schema's own description carries them; no
// prompt may (docs/deliveries/2026-10-08T193103-PLAN--product-agent-mode-claude-code).
const CONTRACT_WORDS = [/needs-approval/i, /\bstopped\b/, /next_step/, /structured_output/, /json-schema/i, /result block/i];

function agentModeTexts() {
  const files = [path.join(SKILLS, 'add--agent-interaction', 'SKILL.md')];
  for (const dir of [path.join(ROOT, 'framwork', '.codeadd', 'fragments', 'agent-mode')]) {
    if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) files.push(path.join(dir, f));
  }
  const fallbacks = path.join(ROOT, 'framwork', '.codeadd', 'fallbacks');
  for (const f of fs.readdirSync(fallbacks)) if (f.startsWith('agent-mode.')) files.push(path.join(fallbacks, f));
  return files.filter((f) => fs.existsSync(f)).map((f) => ({ file: path.relative(ROOT, f), text: readNorm(f) }));
}

describe('L1.5 (F8) -- add--agent-interaction exists and speaks behaviour only', () => {
  const agent = () => readNorm(path.join(SKILLS, 'add--agent-interaction', 'SKILL.md'));

  it('exists with frontmatter, registered in the product provider map', () => {
    expect(agent()).toMatch(/^---\nname: add--agent-interaction\ndescription: ".+"\n---\n/);
    const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8'));
    expect(map.skills).toHaveProperty('add--agent-interaction');
  });

  it('has one section per kind of pause', () => {
    const text = agent();
    for (const h of ['## Questions', '## Approval and deciding stops', '## Confirming stops', '## Error stops', '## Closing']) {
      expect(text, h).toContain(h);
    }
  });

  it('states the question format and the accepted answers', () => {
    const text = agent();
    expect(text).toContain('### 1.');
    expect(text).toContain('RECOMMENDED');
    expect(text).toContain('`1a, 2b`');
    expect(text).toContain('`recommended`');
    expect(text).toMatch(/never call a structured-question tool/i);
  });

  it('closes with the next command and offers no continuation', () => {
    const text = agent();
    expect(text).toMatch(/next command[^\n]*last line|last line[^\n]*next command/i);
    expect(text).toMatch(/no continuation offer/i);
  });

  it('the human skill names it as the bot counterpart', () => {
    expect(readNorm(path.join(SKILLS, 'add--human-interaction', 'SKILL.md'))).toContain('`add--agent-interaction`');
  });

  it('no agent-mode text names a result field, a status or the schema flag', () => {
    const texts = agentModeTexts();
    expect(texts.length).toBeGreaterThan(0);
    for (const { file, text } of texts) {
      for (const re of CONTRACT_WORDS) expect(text, `${file} matches ${re}`).not.toMatch(re);
    }
  });
});
