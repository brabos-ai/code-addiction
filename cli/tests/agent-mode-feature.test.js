/**
 * agent-mode feature -- plan 2026-10-09T184411-PLAN--agent-mode-feature (0038B).
 *
 * L1 levels of the plan's Validation Matrix. Each describe block is the level
 * that goes green in the F-block named in its title; the file grows with the
 * build, one RED-first assertion per F-block.
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { PROVIDERS } from '../src/providers.js';
import { FEATURES, enableFeature } from '../src/features.js';
import { treeFixture } from './helpers/tree-fixture.js';
import { composeSlot, resolvePlaceholders, parseFragmentSections } from '../src/injection-core.js';

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
// `stopped` is a status value only when written as one: the plain word appears in the human text the fallbacks keep verbatim.
const CONTRACT_WORDS = [/needs-approval/i, /`stopped`/, /status\W+(?:is\W+)?stopped/i, /next_step/, /structured_output/, /json-schema/i, /result block/i];

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

// ---------------------------------------------------------------------------
// Phase C -- one F-block per command. AGENT_SLOTS grows by one entry per F-block
// (the plan's end-state map); every test below is parameterised over it.
// ---------------------------------------------------------------------------
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const AGENT_SLOTS = {
  'add-brainstorm': ['interaction', 'output-cap', 'cap-scope', 'objective-draft', 'cadence', 'structured-ask', 'approval-ask', 'offer', 'rules-cadence'],
  'add-new': ['interaction', 'output-cap', 'confirm-wait', 'closing-route', 'offer'],
  'add-plan': ['interaction', 'stop-kinds', 'preview-wait', 'closing-route', 'offer'],
  'add-build': ['interaction', 'checkpoint-route', 'offer'],
  'add-review': ['interaction', 'staging-consent', 'offer'],
  'add-done': ['interaction', 'ci-watch', 'offer'],
  'add-diagnose': ['interaction', 'offer'],
  'add-hotfix': ['interaction', 'offer'],
  'add-qa-setup': ['interaction', 'install-confirm', 'config-values', 'offer'],
  'add-pull-request': ['interaction', 'offer'],
  'add-audit': ['interaction', 'offer'],
  'add-wiki': ['interaction', 'offer'],
};
const SIDECAR = () => JSON.parse(fs.readFileSync(path.join(CODEADD, 'injection-points.json'), 'utf8'));
const agentSlotsOf = (command) => SIDECAR().slots.filter((s) => s.resource.kind === 'command' && s.resource.name === command && s.id.startsWith('agent-mode.'));

function memberBody(command, section) {
  const raw = readNorm(path.join(CODEADD, 'fragments', 'agent-mode', `${command}.md`));
  return parseFragmentSections(raw).get(section);
}

describe('L1.2 (F3/F10-F21) -- agent-mode is registered, off by default, and lists only commands that carry slots', () => {
  it('has an entry that is disabled by default', () => {
    const meta = FEATURES['agent-mode'];
    expect(meta).toBeTruthy();
    expect(meta.default).toBe(false);
    expect(typeof meta.description).toBe('string');
  });

  it('lists the twelve commands of the plan (F21 closes the set)', () => {
    expect([...FEATURES['agent-mode'].commands].sort()).toEqual([
      'add-audit', 'add-brainstorm', 'add-build', 'add-diagnose', 'add-done', 'add-hotfix',
      'add-new', 'add-plan', 'add-pull-request', 'add-qa-setup', 'add-review', 'add-wiki',
    ]);
  });

  it('lists exactly the commands whose F-block has landed', () => {
    expect([...FEATURES['agent-mode'].commands].sort()).toEqual(Object.keys(AGENT_SLOTS).sort());
  });
});

describe.each(Object.keys(AGENT_SLOTS))('L1.3 -- %s carries its agent-mode slots', (command) => {
  it('the sidecar holds exactly the planned slots, one agent-mode member each, with a safe fallback path', () => {
    const slots = agentSlotsOf(command);
    expect(slots.map((s) => s.id.slice('agent-mode.'.length)).sort()).toEqual([...AGENT_SLOTS[command]].sort());
    for (const s of slots) {
      const section = s.id.slice('agent-mode.'.length);
      expect(s.members, s.id).toEqual([{ namespace: 'feature', name: 'agent-mode', section }]);
      expect(s.fallbackPath, s.id).toMatch(/^fallbacks\/agent-mode\.[A-Za-z0-9._-]+\.md$/);
      expect(s.fallback.length, s.id).toBeGreaterThan(0);
    }
  });

  it('the fragment holds one non-empty section per slot and nothing else', () => {
    const raw = readNorm(path.join(CODEADD, 'fragments', 'agent-mode', `${command}.md`));
    const sections = parseFragmentSections(raw);
    expect([...sections.keys()].sort()).toEqual([...AGENT_SLOTS[command]].sort());
    for (const [name, body] of sections) expect(body.trim().length, name).toBeGreaterThan(0);
  });
});

describe('L1.6 / L1.7 -- the installed render, feature on and off', () => {
  const fixtureAM = treeFixture({
    prefix: 'agent-mode-',
    copy: [
      ...Object.values(PROVIDERS).map((meta) => ({ src: meta.src, dest: meta.dest, optional: true })),
      { src: 'framwork/.codeadd', dest: '.codeadd' },
    ],
    manifest: {
      at: '.codeadd/manifest.json',
      data: { version: '0.0.0', providers: Object.keys(PROVIDERS), features: {}, plugins: {}, hashes: {} },
    },
    normalize: true,
  });
  let tmp;
  beforeEach(() => { tmp = fixtureAM.root(); });
  afterEach(() => fixtureAM.cleanup());
  afterAll(() => fixtureAM.dispose());

  const installed = (key, command) => {
    const file = path.join(tmp, PROVIDERS[key].dest, PROVIDERS[key].commandsSubdir, `${command}.md`);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  const cases = Object.keys(AGENT_SLOTS).flatMap((command) => CMD_PROVIDERS.map((key) => [command, key]));

  it.each(cases)('%s on %s: with agent-mode OFF every fallback renders and no member text does', (command, key) => {
    const text = installed(key, command);
    if (text === null) return;
    expect(agentSlotsOf(command)).toHaveLength(AGENT_SLOTS[command].length);
    for (const s of agentSlotsOf(command)) {
      const section = s.id.slice('agent-mode.'.length);
      expect(text, `${s.id} fallback`).toContain(resolvePlaceholders(s.fallback, PROVIDERS[key]).trim());
      expect(text, `${s.id} member`).not.toContain(resolvePlaceholders(memberBody(command, section), PROVIDERS[key]).trim());
    }
  });

  it.each(cases)('%s on %s: with agent-mode ON every member renders and no fallback text does', (command, key) => {
    enableFeature(tmp, 'agent-mode');
    const text = installed(key, command);
    if (text === null) return;
    expect(agentSlotsOf(command)).toHaveLength(AGENT_SLOTS[command].length);
    for (const s of agentSlotsOf(command)) {
      const section = s.id.slice('agent-mode.'.length);
      expect(text, `${s.id} member`).toContain(resolvePlaceholders(memberBody(command, section), PROVIDERS[key]).trim());
      expect(text, `${s.id} fallback`).not.toContain(resolvePlaceholders(s.fallback, PROVIDERS[key]).trim());
    }
  });
});

describe('L1.4(b) (F5-F7) -- the moved sections are gone from their old owners', () => {
  const BY_OWNER = {
    'add--delivery-mode': MOVED.filter((m) => m.from === 'add--delivery-mode').map((m) => m.name),
    'add--final-report': MOVED.filter((m) => m.from === 'add--final-report').map((m) => m.name),
    'add--feature-specification': MOVED.filter((m) => m.from === 'add--feature-specification').map((m) => m.name),
  };

  it.each(Object.entries(BY_OWNER).flatMap(([owner, names]) => names.map((n) => [owner, n])))(
    '%s no longer holds %s',
    (owner, name) => {
      expect(readNorm(path.join(SKILLS, owner, 'SKILL.md'))).not.toContain(fixture(name));
    },
  );

  it('add--delivery-mode points at the interaction skill instead, and names no offer rule', () => {
    const text = readNorm(path.join(SKILLS, 'add--delivery-mode', 'SKILL.md'));
    expect(text).toContain('the interaction skill the command loaded');
    expect(text).toContain('`{{skill:add--human-interaction/SKILL.md}}`');
    expect(text).not.toContain('ask ONCE whether');
  });
});

describe('L1.4(c) (F23) -- nothing names the old owners for the continuation contracts', () => {
  const walkMd = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walkMd(p);
    return e.name.endsWith('.md') ? [p] : [];
  });

  it('no product artefact or fallback ties a chat-continuation id to add--delivery-mode or add--final-report', () => {
    // Within one paragraph and one table cell: a table row that merely says "as add--delivery-mode
    // describes" is not an owner claim.
    const id = /chat-continuation-(?:eligibility|output)-v1/.source;
    const old = /(?:add--delivery-mode|add--final-report)/.source;
    const gap = /(?:(?!\n\n|\|)[\s\S]){0,260}?/.source;
    const owner = new RegExp(`${id}${gap}${old}|${old}${gap}${id}`);
    const bad = walkMd(CODEADD)
      .filter((f) => !f.includes(`${path.sep}add--human-interaction${path.sep}`))
      .filter((f) => owner.test(readNorm(f)))
      .map((f) => path.relative(ROOT, f));
    expect(bad).toEqual([]);
  });
});

describe('F22 -- the bot guide says how to turn the mode on and how to answer', () => {
  const guide = () => readNorm(path.join(CODEADD, 'agent-mode', 'README.md'));

  it('tells how to enable the feature on install and on modify', () => {
    const text = guide();
    expect(text).toContain('--enable-feature agent-mode');
    expect(text).toMatch(/npx codeadd install[^\n]*--enable-feature agent-mode/);
    expect(text).toMatch(/npx codeadd modify[^\n]*--enable-feature agent-mode/);
  });

  it('documents the answer format: 1a, 2b, recommended, and free text per number', () => {
    const text = guide();
    expect(text).toContain('`1a, 2b`');
    expect(text).toContain('`recommended`');
    expect(text).toMatch(/free text/i);
  });

  it('no longer claims /add-done stops before the merge, and says it merges after its gates', () => {
    const text = guide();
    expect(text).not.toMatch(/always stops before the merge/);
    expect(text).toMatch(/\/add-done[^\n]*merges automatically/);
    expect(text).toMatch(/pending/i);
  });

  it('says an automatic delivery can run several stages in one call and that stage names the last', () => {
    const text = guide();
    expect(text).toMatch(/automatic/);
    expect(text).toMatch(/several stages in one call/);
    expect(text).toMatch(/`stage`/);
  });
});

// ---------------------------------------------------------------------------
// Phase E -- the internal pipeline asks in one numbered batch, always (no feature)
// ---------------------------------------------------------------------------
const WORKBENCH = path.join(ROOT, 'workbench');
const wb = (...parts) => readNorm(path.join(WORKBENCH, ...parts));

describe('F25 -- add-interaction is the one internal rule for a stop that asks', () => {
  it('exists, registered in the workbench provider map only', () => {
    expect(wb('skills', 'add-interaction', 'SKILL.md')).toMatch(/^---\nname: add-interaction\ndescription: ".+"\n---\n/);
    const own = JSON.parse(fs.readFileSync(path.join(WORKBENCH, 'provider-map.json'), 'utf8'));
    expect(own.skills).toHaveProperty('add-interaction');
    const product = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8'));
    expect(product.skills).not.toHaveProperty('add-interaction');
  });

  it('states the batch: all questions at once, numbered, each with a recommendation and why', () => {
    const text = wb('skills', 'add-interaction', 'SKILL.md');
    expect(text).toMatch(/all (?:its )?questions? at once|every question[^\n]*one message/i);
    expect(text).toContain('### 1.');
    expect(text).toContain('RECOMMENDED');
    expect(text).toContain('`1a, 2b`');
    expect(text).toContain('`recommended`');
    expect(text).toMatch(/free text/i);
    expect(text).toMatch(/only what is left|only the questions (?:that )?(?:are )?left/i);
  });

  it('names the one exception: brainstorm 8.1 gives no recommendation, and says why', () => {
    const text = wb('skills', 'add-interaction', 'SKILL.md');
    expect(text).toMatch(/8\.1/);
    expect(text).toMatch(/no recommendation|does not pick|does not recommend/i);
  });

  it('keeps the single free-text question a single question', () => {
    expect(wb('skills', 'add-interaction', 'SKILL.md')).toMatch(/What do you want to explore/);
  });

  it('calls no structured-question tool and no separate option table', () => {
    const text = wb('skills', 'add-interaction', 'SKILL.md');
    expect(text).toMatch(/no structured-question tool|never call a structured-question tool/i);
  });
});

describe('F26 -- the internal brainstorm asks in batches', () => {
  const text = () => wb('skills', 'add-framework--brainstorm', 'SKILL.md');

  it('points at add-interaction and declares it', () => {
    expect(text()).toContain('`add-interaction`');
    expect(text()).toMatch(/<!-- uses:[\s\S]*?- skill: add-interaction[\s\S]*?-->/);
  });

  it('no longer asks one at a time or through a structured-question tool', () => {
    const t = text();
    expect(t).not.toMatch(/Ask questions one per message/);
    expect(t).not.toMatch(/Ask ONE clarifying question/);
    expect(t).not.toMatch(/Ask one question at a time/);
    expect(t).not.toMatch(/Ask through the provider.s structured-question tool/);
    expect(t).not.toMatch(/Present it through the provider's\s+structured-question tool/);
    expect(t).not.toMatch(/The workbench no longer ships to one provider/);
  });

  it('8.1 stays without a recommendation and says so', () => {
    const t = text();
    const at = t.indexOf('\n### 8.1 ');
    expect(at).toBeGreaterThan(-1);
    const slice = t.slice(at, at + 5000);
    expect(slice).toMatch(/no RECOMMENDED line, on purpose/);
  });
});

describe('F27 -- the internal plan asks its questionnaire as one recommended batch', () => {
  const text = () => wb('skills', 'add-framework--plan', 'SKILL.md');

  it('routes STEP 4 through add-interaction and declares it', () => {
    expect(text()).toContain('`add-interaction`');
    expect(text()).toMatch(/<!-- uses:[\s\S]*?- skill: add-interaction[\s\S]*?-->/);
  });

  it('makes the recommendation mandatory, not conditional on a clearly better option', () => {
    const t = text();
    expect(t).not.toMatch(/Mark the probable option when one is clearly better/);
    expect(t).toMatch(/Every question carries a RECOMMENDED option/);
  });
});

describe('F28 -- the internal build asks its approval, finding and push as numbered items', () => {
  const text = () => wb('skills', 'add-framework--build', 'SKILL.md');

  it('routes through add-interaction and declares it', () => {
    expect(text()).toContain('`add-interaction`');
    expect(text()).toMatch(/<!-- uses:[\s\S]*?- skill: add-interaction[\s\S]*?-->/);
  });

  it('collects the decision findings into one batch instead of presenting each alone', () => {
    const t = text();
    expect(t).not.toMatch(/Present that finding alone and WAIT/);
    expect(t).toMatch(/Present every such finding together, in one numbered batch/);
  });
});

describe('F29 -- the internal done asks its plan pick and its deletions as one batch', () => {
  const text = () => wb('skills', 'add-framework--done', 'SKILL.md');

  it('routes through add-interaction and declares it', () => {
    expect(text()).toContain('`add-interaction`');
    expect(text()).toMatch(/<!-- uses:[\s\S]*?- skill: add-interaction[\s\S]*?-->/);
  });

  it('asks every deletion in one batch, not per deletion', () => {
    const t = text();
    expect(t).not.toMatch(/Ask the user, per deletion/);
    expect(t).toMatch(/for every deletion in ONE numbered batch/);
  });
});
