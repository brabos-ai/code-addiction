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
    expect(read(file)).toMatch(/^---
name: add--notion
/);
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
