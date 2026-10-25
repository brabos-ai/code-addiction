import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEATURES } from '../src/features.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const codeadd = path.join(root, 'framwork', '.codeadd');
const read = (p) => fs.readFileSync(p, 'utf8');
const settingsPath = path.join(codeadd, 'skills/add--settings/SKILL.md');

describe('F1 — add--settings documents the setup section', () => {
  const text = () => read(settingsPath);
  const section = () => {
    const src = text();
    const start = src.indexOf('## Section `setup`');
    expect(start, 'add--settings has a setup section').toBeGreaterThan(-1);
    const next = src.indexOf('\n## ', start + 5);
    return src.slice(start, next === -1 ? undefined : next);
  };

  it('L1.1 names the setup-shape, the offered vocabulary and the log', () => {
    const s = section();
    for (const word of ['setup-shape', '"none"', 'offered', 'enabled', 'already-on', 'declined', 'unavailable', 'failed', 'log']) {
      expect(s, `setup section names ${word}`).toContain(word);
    }
    expect(s).toMatch(/\{ date, item, decision, reason \}/);
  });

  it('L1.1 the hard ban admits "none" only for a section with no contract', () => {
    const src = text();
    expect(src).toMatch(/neither a bare `sha256:` \+ 16 hex nor `"none"` in a section whose command has no contract/);
    expect(src).toMatch(/carries no `shape` key/);
    expect(src).toContain('`/add-setup` writes `setup`.');
  });

  it('keeps every qa rule', () => {
    const src = text();
    expect(src).toContain('MUST be `null` for `owner: shared`');
    expect(src).toContain('## Section `qa`');
  });
});

const ecoPath = path.join(codeadd, 'skills/add--ecosystem/SKILL.md');
const eco = () => read(ecoPath);
const sectionOf = (src, heading) => {
  src = src.replace(/\r\n/g, '\n');
  const start = src.indexOf(`\n${heading}\n`) + 1 || -1;
  expect(start, `${heading} exists`).toBeGreaterThan(-1);
  const next = src.indexOf('\n## ', start + heading.length);
  return src.slice(start, next === -1 ? undefined : next);
};
const lines = (src) => src.split(/\r?\n/);
const tableRows = (sec) => {
  const rows = lines(sec).filter((l) => l.startsWith('|'));
  const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
  return { header: cells(rows[0]), rows: rows.slice(2).map(cells) };
};

describe('F2 — add--ecosystem carries the Benefit column and the routing rows', () => {
  it('L1.2 every Features and Plugins row has a Benefit cell, one to one with the catalogs', () => {
    const features = tableRows(sectionOf(eco(), '## Features'));
    const plugins = tableRows(sectionOf(eco(), '## Plugins'));
    for (const t of [features, plugins]) {
      expect(t.header[t.header.length - 1]).toBe('Benefit');
      for (const r of t.rows) expect(r[t.header.indexOf('Benefit')], `${r[0]} has a Benefit`).toBeTruthy();
    }
    expect(features.rows.map((r) => r[0]).sort()).toEqual(Object.keys(FEATURES).sort());
    const catalog = JSON.parse(read(path.join(root, 'cli/src/plugins.json')));
    delete catalog['$schema-doc'];
    expect(plugins.rows.map((r) => r[0]).sort()).toEqual(Object.keys(catalog).sort());
  });

  it('L1.3 routing: one codeadd update row, an install row and the three add-setup rows', () => {
    const rows = lines(sectionOf(eco(), '## Command Next-Steps Routing'));
    const updateRows = rows.filter((l) => /^\|\s*`?codeadd update`?\s*\|/.test(l));
    expect(updateRows).toHaveLength(1);
    expect(updateRows[0]).toContain('/add-setup');
    expect(updateRows[0]).toMatch(/\.codeadd\/wiki\/[^\n]*\|[^\n]*`\/add-wiki update`/);
    const row = (cmd, cond) => rows.find((l) => new RegExp(`^\\|\\s*${cmd}\\s*\\|\\s*${cond}`).test(l));
    expect(row('codeadd install', 'always')).toContain('/add-setup');
    expect(row('add-setup', 'greenfield')).toContain('`/add-brainstorm`');
    expect(row('add-setup', 'stopped at the MCP checkpoint')).toContain('`/add-setup`');
    expect(row('add-setup', 'done')).toContain('`/add-new`');
  });

  it('lists add-setup in Commands and in the Used By cells', () => {
    const src = eco();
    expect(sectionOf(src, '## Commands')).toMatch(/^\| add-setup \| Guided onboarding/m);
    for (const skill of ['add--delivery-mode', 'add--dev-environment-setup', 'add--ecosystem', 'add--final-report', 'add--settings']) {
      const rows = lines(src).filter((l) => l.startsWith(`| ${skill} |`));
      expect(rows.length, `${skill} rows`).toBeGreaterThanOrEqual(2);
      for (const r of rows) expect(r, `${skill} row names add-setup`).toContain('add-setup');
    }
    expect(lines(src).find((l) => l.startsWith('| status.cjs |'))).toContain('add-setup');
  });
});

describe('F3 — the two inline commands honor a Setup answers block', () => {
  for (const name of ['add-qa-setup', 'add-wiki']) {
    it(`L1.4 ${name} carries the paragraph between the slot and Required Skills`, () => {
      const src = read(path.join(codeadd, `commands/${name}.md`)).replace(/\r\n/g, '\n');
      const slotEnd = src.indexOf('<!-- /slot:agent-mode.interaction -->');
      const para = src.indexOf('`## Setup answers`');
      const skills = src.indexOf('\n## Required Skills');
      expect(slotEnd).toBeGreaterThan(-1);
      expect(para).toBeGreaterThan(slotEnd);
      expect(skills).toBeGreaterThan(para);
    });
  }

  it('L1.4 the add-qa-setup contract shape did not move', () => {
    const src = read(path.join(codeadd, 'commands/add-qa-setup.md'));
    expect(src).toContain('shape: sha256:5a8b5405851bf4d8');
  });
});
