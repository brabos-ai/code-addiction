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

const ECOSYSTEM = path.join(SOURCE, 'skills', 'add--ecosystem', 'SKILL.md');

/** Rows of an ecosystem table whose FIRST cell equals `name` exactly — never a prefix. */
const ecosystemRows = (heading, name) => tableRows(sectionOf(read(ECOSYSTEM), heading)).filter((cells) => cells[0] === name);

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

describe('F5 — the guide and the role files point at add--agent-notion (0077F)', () => {
  // Built by concatenation so the acceptance scan for the retired ids does not match this file.
  const RETIRED_SKILL = 'add--' + 'notion';
  const guide = () => read(path.join(AGENT_MODE, 'README.md'));
  const section10 = () => {
    const src = guide();
    const start = src.indexOf('## 10. Track work in Notion (optional)');
    expect(start, 'the guide has section 10').toBeGreaterThan(-1);
    return src.slice(start);
  };

  it('L1.9 section 10 names the skill, the page, the three old-board places and says the branch goes last', () => {
    const section = section10();
    const anchors = ['add--agent-notion', 'How it works', 'board.json', '~/.codeadd/<key>/board/', '`board` branch', 'the branch last', 'section 9'];
    for (const anchor of anchors) expect(section, `section 10 names ${anchor}`).toContain(anchor);
  });

  it('L1.9 section 10 names no /add-setup, no retired page title, no retired skill id and no token', () => {
    const section = section10();
    expect(section).not.toContain('/add-setup');
    expect(section).not.toContain('Como funciona');
    expect(section).not.toContain(RETIRED_SKILL + '`');
    expect(section).not.toMatch(new RegExp(RETIRED_SKILL + '(?!-)\b'));
    for (const re of TOKEN_LIKE) expect(section).not.toMatch(re);
  });

  it.each(ROLES)('L1.11 roles/%s.md names add--agent-notion, the page and the no-Notion handoff', (name) => {
    const text = roleText(name);
    expect(text).toContain('add--agent-notion');
    expect(text).toContain('How it works');
    expect(text).toContain('otherwise the handoff is the intent');
    expect(text).not.toMatch(new RegExp(RETIRED_SKILL + '(?!-)\b'));
    expect(text).not.toContain('Como funciona');
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

describe('F6 — no retired Notion skill is left in the source (0077F)', () => {
  // Built by concatenation so this scan does not match this file.
  const RETIRED = 'add--' + 'notion';
  const REPO_FILES = ['framwork/provider-map.json'];
  const REPO_DIRS = ['framwork/.codeadd', 'cli/src', 'cli/tests', 'mcp', 'scripts', 'workbench'];
  // Build sidecars are regenerated from the source on every build; they follow it.
  const SIDECARS = new Set(['artefact-graph.json', 'injection-points.json', 'contracts.json']);

  function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || SIDECARS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(full);
      else yield full;
    }
  }

  it('L1.10 no source file names a retired Notion skill, and no such skill folder exists', () => {
    const hits = [];
    const check = (file) => {
      if (/.(png|jpg|gif|zip)$/i.test(file)) return;
      if (read(file).includes(RETIRED)) hits.push(path.relative(ROOT, file));
    };
    for (const file of REPO_FILES) check(path.join(ROOT, file));
    for (const dir of REPO_DIRS) {
      if (fs.existsSync(path.join(ROOT, dir))) for (const file of walk(path.join(ROOT, dir))) check(file);
    }
    expect(hits).toEqual([]);
    for (const name of [RETIRED, RETIRED + '-setup']) {
      expect(fs.existsSync(path.join(SOURCE, 'skills', name)), `skills/${name} is gone`).toBe(false);
    }
  });

  it('L1.10b the generated inventory and ecosystem map list the new skill and neither retired id', () => {
    for (const file of ['AGENTS.md', 'web/public/ecosystem.json']) {
      const text = read(path.join(ROOT, file));
      expect(text, `${file} names the new skill`).toContain('add--agent-notion');
      expect(text, `${file} names no retired skill`).not.toContain(RETIRED);
    }
  });
});
