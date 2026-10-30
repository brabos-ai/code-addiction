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

describe('F4 — add--settings records notion in the setup section', () => {
  const setupSection = () => sectionOf(read(skillPath('add--settings')), '## Section `setup`');

  it('L1.8 the setup.offered.<item> row names notion beside qa-setup, wiki and version-record', () => {
    const row = setupSection().split('\n').find((l) => l.startsWith('| `setup.offered.<item>`'));
    expect(row, 'the offered row exists').toBeTruthy();
    expect(row).toContain('plus `qa-setup`, `wiki`, `version-record` and `notion`');
  });

  it('L1.8 the example offered object carries a "notion" key', () => {
    const example = setupSection().match(/```json\n([\s\S]*?)```/)[1];
    expect(JSON.parse(example).setup.offered).toHaveProperty('notion');
  });
});

describe('F5 — /add-setup offers and runs notion', () => {
  const setupSrc = () => read(path.join(SOURCE, 'commands', 'add-setup.md'));
  const stepSection = (src, id) => {
    const start = src.indexOf(`## STEP ${id}:`);
    expect(start, `STEP ${id} exists`).toBeGreaterThan(-1);
    const next = src.indexOf('\n## ', start + 5);
    return src.slice(start, next === -1 ? undefined : next);
  };

  it('L1.9 declares the setup skill in uses:', () => {
    expect(setupSrc()).toMatch(/<!-- uses:[\s\S]*?\n- skill: add--notion-setup\n[\s\S]*?-->/);
  });

  it('L1.9 names notion in the item list and says it is only ever new or decided', () => {
    const src = setupSrc();
    expect(src).toContain('and `qa-setup`, `wiki`, `version-record` and `notion`');
    expect(src).toMatch(/`notion` has no manifest key[^\n]*\*\*new\*\* or \*\*decided\*\*[^\n]*never \*\*on\*\* or \*\*drift\*\*/);
  });

  it('L1.9 has a Recommendations row for notion that follows agent-mode', () => {
    const row = setupSrc().split('\n').find((l) => l.startsWith('| `notion`'));
    expect(row, 'the notion row exists').toBeTruthy();
    expect(row).toContain('agent-mode');
  });

  it('L1.9 asks the notion values in the one batch', () => {
    const src = setupSrc();
    const start = src.indexOf('### Values the sub-commands would ask');
    expect(start, 'the values section exists').toBeGreaterThan(-1);
    const values = src.slice(start, src.indexOf('### The reply'));
    for (const word of ['notion', 'parent page', 'database name', 'columns', 'labels']) expect(values).toContain(word);
  });

  it('L1.9 the STEP list names notion in the batch line and the Notion setup in the execute line', () => {
    const src = setupSrc();
    const batch = src.split('\n').find((l) => l.startsWith('STEP add-setup.batch:'));
    const exec = src.split('\n').find((l) => l.startsWith('STEP add-setup.execute:'));
    expect(batch).toContain('version-record, notion');
    expect(exec).toContain('Notion setup');
  });

  it('L1.9 a failed Notion MCP marks the item failed, keeps the run going and names revisit notion', () => {
    const exec = stepSection(setupSrc(), 'add-setup.execute');
    expect(exec).toContain('add--notion-setup/SKILL.md');
    expect(exec).toContain('`failed`');
    expect(exec).toContain('`revisit notion`');
    expect(exec).toContain('configure the Notion MCP, restart the session, run again');
  });

  it('L1.9 the MCP checkpoint stop follows the renumbering', () => {
    const src = setupSrc();
    expect(src).toContain('STOP after step 5');
    expect(src).not.toContain('STOP after step 4');
  });

  it('L1.5 the add-setup Commands row of add--ecosystem lists add--notion-setup', () => {
    const [row] = tableRows(sectionOf(read(ECOSYSTEM), '## Commands')).filter((cells) => cells[0] === 'add-setup');
    expect(row?.[2]).toContain('add--notion-setup');
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
