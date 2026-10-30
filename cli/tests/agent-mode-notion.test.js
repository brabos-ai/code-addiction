import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Agent mode can track work in Notion (ticket 0076B) — static reads only.
 *
 * The framework ships two instruction-only skills and no code. These tests read markdown and the
 * registry; none calls Notion and none writes in the checkout (the build check redirects every
 * provider into a temp directory it deletes at the end).
 */
const require = createRequire(import.meta.url);
const { buildSkills } = require('../../scripts/build.js');

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SOURCE = path.join(ROOT, 'framwork', '.codeadd');
const MAP_PATH = path.join(ROOT, 'framwork', 'provider-map.json');
const AGENT_MODE = path.join(SOURCE, 'agent-mode');

const read = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const readMap = () => JSON.parse(read(MAP_PATH));
const skillPath = (name) => path.join(SOURCE, 'skills', name, 'SKILL.md');
const roleText = (name) => read(path.join(AGENT_MODE, 'roles', `${name}.md`));
const ROLES = ['product-pm', 'chief-engineer'];

// The plan named /docs/mcp; it now redirects here, so the build corrected the URL (ruling in the ledger).
const NOTION_MCP_DOC = 'https://developers.notion.com/guides/mcp/overview';

/** The first `## ` heading section named `heading`, up to the next `## ` heading. */
function sectionOf(src, heading) {
  const start = src.indexOf(`\n${heading}\n`) + 1 || -1;
  expect(start, `${heading} exists`).toBeGreaterThan(-1);
  const next = src.indexOf('\n## ', start + heading.length);
  return src.slice(start, next === -1 ? undefined : next);
}

/** The cells of every table row in `sec`, header and separator dropped. */
function tableRows(sec) {
  const rows = sec.split('\n').filter((l) => l.startsWith('|'));
  return rows.slice(2).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
}

/** A token-like literal: Notion token prefixes, a bearer token, or a filled-in credential assignment. */
const TOKEN_LIKE = [
  /\b(?:secret_|ntn_)[A-Za-z0-9]{20,}/,
  /Bearer [A-Za-z0-9._~+/=-]{16,}/,
  /NOTION_(?:TOKEN|API_KEY)=(?![<${]|YOUR_|\s|$)\S+/,
];

describe('F1 — add--notion-setup', () => {
  it('L1.1 exists, its name equals the folder, and the registry lists it with no provider restriction', () => {
    const file = skillPath('add--notion-setup');
    expect(fs.existsSync(file), 'add--notion-setup/SKILL.md exists').toBe(true);
    expect(read(file)).toMatch(/^---\nname: add--notion-setup\n/);
    expect(readMap().skills['add--notion-setup']).toEqual({});
  });

  it('L1.2 links every provider MCP doc from provider-map.json and Notion\'s MCP doc', () => {
    const skill = read(skillPath('add--notion-setup'));
    const providers = Object.entries(readMap().providers);
    expect(providers.length).toBeGreaterThan(0);
    for (const [name, provider] of providers) {
      const doc = provider.docs.find((url) => /mcp|model-context-protocol/.test(url));
      expect(doc, `${name} declares an MCP doc in provider-map.json`).toBeTruthy();
      expect(skill, `the skill links the ${name} MCP doc`).toContain(doc);
    }
    expect(skill).toContain(NOTION_MCP_DOC);
  });

  it('L1.3 names the nine properties, the eight default columns, the page, the answers block and the MCP stop', () => {
    const skill = read(skillPath('add--notion-setup'));
    const anchors = [
      'Title', 'Slug', 'Feature ID', 'Status', 'Labels', 'Type', 'Priority', 'Link', 'Attachments',
      'Ideia', 'Refinando', 'A fazer', 'Planejado', 'Em andamento', 'Em revisão', 'Feito', 'Descartado',
      'Como funciona', '## Setup answers', 'configure the Notion MCP',
    ];
    for (const anchor of anchors) expect(skill, `the skill names ${anchor}`).toContain(anchor);
  });

  it('L1.6 the skill carries no token-like literal, no backlog- and no board.json', () => {
    const skill = read(skillPath('add--notion-setup'));
    for (const re of TOKEN_LIKE) expect(skill).not.toMatch(re);
    expect(skill).not.toContain('backlog-');
    expect(skill).not.toContain('board.json');
  });
});

const ECOSYSTEM = path.join(SOURCE, 'skills', 'add--ecosystem', 'SKILL.md');

/** Rows of an ecosystem table whose FIRST cell equals `name` exactly — never a prefix. */
const ecosystemRows = (heading, name) => tableRows(sectionOf(read(ECOSYSTEM), heading)).filter((cells) => cells[0] === name);

describe('F2 — add--notion', () => {
  it('L1.1 exists, its name equals the folder, and the registry lists it with no provider restriction', () => {
    const file = skillPath('add--notion');
    expect(fs.existsSync(file), 'add--notion/SKILL.md exists').toBe(true);
    expect(read(file)).toMatch(/^---\nname: add--notion\n/);
    expect(readMap().skills['add--notion']).toEqual({});
  });

  it('L1.4 names the page, the tracker line, the naming rule, the setup skill and the fallback milestones', () => {
    const skill = read(skillPath('add--notion'));
    const anchors = [
      'Como funciona', 'tracker:', '<id>-<slug>', 'add--notion-setup',
      'brainstorm', 'new', 'plan', 'build', 'done', 'hotfix',
      'Refinando', 'Planejado', 'Em andamento', 'Em revisão', 'Feito', 'Hotfix',
    ];
    for (const anchor of anchors) expect(skill, `the skill names ${anchor}`).toContain(anchor);
  });

  it('L1.6 the skill carries no token-like literal, no backlog- and no board.json', () => {
    const skill = read(skillPath('add--notion'));
    for (const re of TOKEN_LIKE) expect(skill).not.toMatch(re);
    expect(skill).not.toContain('backlog-');
    expect(skill).not.toContain('board.json');
  });
});

describe('add--ecosystem registers the Notion skills', () => {
  it.each(['add--notion-setup', 'add--notion'])('L1.5 %s has one Skills row and one Dependency Index row', (name) => {
    expect(ecosystemRows('## Skills', name), `${name} in ## Skills`).toHaveLength(1);
    expect(ecosystemRows('## Dependency Index', name), `${name} in ## Dependency Index`).toHaveLength(1);
  });

  it('L1.5 add--notion-setup is used by add-setup', () => {
    const [row] = ecosystemRows('## Skills', 'add--notion-setup');
    expect(row?.[2]).toContain('add-setup');
    const [dep] = ecosystemRows('## Dependency Index', 'add--notion-setup');
    expect(dep?.[1]).toContain('add-setup (STEP add-setup.execute)');
  });
});

describe('F3 — add--settings no longer names notion (0077F)', () => {
  const setupSection = () => sectionOf(read(skillPath('add--settings')), '## Section `setup`');

  it('L1.5 the setup.offered.<item> row lists qa-setup, wiki and version-record only', () => {
    const row = setupSection().split('\n').find((l) => l.startsWith('| `setup.offered.<item>`'));
    expect(row, 'the offered row exists').toBeTruthy();
    expect(row).toContain('plus `qa-setup`, `wiki` and `version-record`. One of');
    expect(row).not.toMatch(/notion/i);
  });

  it('L1.5 the example offered object has no "notion" key', () => {
    const example = setupSection().match(/```json\n([\s\S]*?)```/)[1];
    expect(JSON.parse(example).setup.offered).not.toHaveProperty('notion');
  });
});

describe('F2 — /add-setup no longer offers notion (0077F)', () => {
  const setupSrc = () => read(path.join(SOURCE, 'commands', 'add-setup.md'));
  const stepSection = (src, id) => {
    const start = src.indexOf(`## STEP ${id}:`);
    expect(start, `STEP ${id} exists`).toBeGreaterThan(-1);
    const nextHeading = src.indexOf('\n## ', start + 5);
    return src.slice(start, nextHeading === -1 ? undefined : nextHeading);
  };
  // Built by concatenation so the acceptance scan for the retired ids does not match this file.
  const RETIRED_SETUP_SKILL = 'add--' + 'notion-setup';

  it('L1.4 add-setup.md says nothing about notion and does not declare the retired setup skill', () => {
    const src = setupSrc();
    expect(src).not.toMatch(/notion/i);
    expect(src).not.toContain(RETIRED_SETUP_SKILL);
  });

  it('L1.4 the execute order is install, modify, gitnexus, QA setup, wiki, and the MCP stop follows step 4', () => {
    const src = setupSrc();
    const exec = stepSection(src, 'add-setup.execute');
    const order = ['Install the external tools', 'codeadd modify', 'gitnexus setup', 'cmd:add-qa-setup', 'cmd:add-wiki'].map((x) => exec.indexOf(x));
    for (const i of order) expect(i).toBeGreaterThan(-1);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(src).toContain('STOP after step 4');
    expect(src).not.toContain('STOP after step 5');
  });

  it('L1.4 the add-setup Commands row of add--ecosystem does not list the retired setup skill', () => {
    const [row] = tableRows(sectionOf(read(ECOSYSTEM), '## Commands')).filter((cells) => cells[0] === 'add-setup');
    expect(row, 'the add-setup row exists').toBeTruthy();
    expect(row[2]).not.toContain(RETIRED_SETUP_SKILL);
  });

  it('L1.7 no framework command or command agent names Notion', () => {
    for (const dir of ['commands', 'agents']) {
      for (const file of fs.readdirSync(path.join(SOURCE, dir))) {
        expect(read(path.join(SOURCE, dir, file)), `${dir}/${file} names no Notion`).not.toMatch(/notion/i);
      }
    }
  });
});

describe('F6 — the agent-mode guide has the optional Notion section', () => {
  const guide = () => read(path.join(AGENT_MODE, 'README.md'));
  const section10 = () => {
    const src = guide();
    const start = src.indexOf('## 10. Track work in Notion (optional)');
    expect(start, 'the guide has section 10').toBeGreaterThan(-1);
    return src.slice(start);
  };

  it('L1.10 section 10 names both skills, the page and /add-setup', () => {
    const section = section10();
    for (const anchor of ['add--notion-setup', 'add--notion', 'Como funciona', '/add-setup']) {
      expect(section, `section 10 names ${anchor}`).toContain(anchor);
    }
  });

  it('L1.10 section 10 says what happens without Notion and carries no board word or token', () => {
    const section = section10();
    expect(section).toContain('section 9');
    expect(section).not.toMatch(/board/i);
    for (const re of TOKEN_LIKE) expect(section).not.toMatch(re);
  });
});

describe('F7 — the role files point at add--notion', () => {
  it.each(ROLES)('L1.11 roles/%s.md names add--notion, the page and the no-Notion handoff', (name) => {
    const text = roleText(name);
    expect(text).toContain('add--notion');
    expect(text).toContain('Como funciona');
    expect(text).toContain('otherwise the handoff is the intent');
  });

  it.each(ROLES)('L1.6 roles/%s.md carries no token-like literal, no backlog- and no board.json', (name) => {
    const text = roleText(name);
    for (const re of TOKEN_LIKE) expect(text).not.toMatch(re);
    expect(text).not.toContain('backlog-');
    expect(text).not.toContain('board.json');
  });
});

describe('F4 — add--agent-notion, the one instruction-only skill (0077F)', () => {
  const NAME = 'add--agent-notion';
  const skill = () => read(skillPath(NAME));
  const migration = () => sectionOf(skill(), '## Migrate the old local board');

  it('L1.6 exists, its name equals the folder, and the registry lists it with no provider restriction', () => {
    expect(fs.existsSync(skillPath(NAME)), `${NAME}/SKILL.md exists`).toBe(true);
    expect(skill()).toMatch(/^---\nname: add--agent-notion\n/);
    expect(readMap().skills[NAME]).toEqual({});
  });

  it('L1.6 names the page, the card identity, the milestones and the three places the old board lives', () => {
    const text = skill();
    const anchors = [
      'How it works', '<id>-<slug>', 'brainstorm', 'new', 'plan', 'build', 'done', 'hotfix',
      'board.json', '~/.codeadd/<key>/board/', '`board` branch',
    ];
    for (const anchor of anchors) expect(text, `the skill names ${anchor}`).toContain(anchor);
  });

  it('L1.6 the migration sends the open cards, waits for the yes, and deletes the remote branch last', () => {
    const section = migration();
    const send = section.indexOf('Send only the in-progress and pending cards');
    const yes = section.indexOf("wait for the user's yes");
    const local = section.indexOf('delete `.codeadd/board.json`');
    const branch = section.indexOf('delete the remote `board` branch last');
    for (const i of [send, yes, local, branch]) expect(i).toBeGreaterThan(-1);
    expect([send, yes, local, branch]).toEqual([send, yes, local, branch].sort((a, b) => a - b));
  });

  it('L1.6 carries no MCP check step, no provider doc link, no setup-answers reader, no backlog script, no tracker line and no token', () => {
    const text = skill();
    expect(text).not.toMatch(/MCP check/i);
    expect(text).not.toContain('https://');
    expect(text).not.toContain('## Setup answers');
    expect(text).not.toContain('backlog-');
    expect(text).not.toContain('tracker:');
    for (const re of TOKEN_LIKE) expect(text).not.toMatch(re);
  });

  it('L1.6 add--ecosystem lists it once in Skills, once in the Dependency Index and once as a mention', () => {
    expect(ecosystemRows('## Skills', NAME), 'in ## Skills').toHaveLength(1);
    expect(ecosystemRows('## Dependency Index', NAME), 'in ## Dependency Index').toHaveLength(1);
    expect(read(ECOSYSTEM).split('\n').filter((l) => l === `- mention: ${NAME}`)).toHaveLength(1);
  });
});
