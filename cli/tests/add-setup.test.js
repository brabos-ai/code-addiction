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

const setupPath = path.join(codeadd, 'commands/add-setup.md');
const setupSrc = () => read(setupPath).replace(/\r\n/g, '\n');
const stepSection = (src, id) => {
  const start = src.indexOf(`\n## STEP ${id}`);
  expect(start, `STEP ${id} exists`).toBeGreaterThan(-1);
  const next = src.indexOf('\n## ', start + 5);
  return src.slice(start, next === -1 ? undefined : next);
};

describe('F4 — the add-setup command', () => {
  it('L1.5 exists and names its sources', () => {
    expect(fs.existsSync(setupPath)).toBe(true);
    const src = setupSrc();
    for (const s of ['status.cjs', 'manifest.json', 'gitnexus --version', 'codeadd modify', 'add--dev-environment-setup', 'add--delivery-mode', '## Setup answers', 'Benefit']) {
      expect(src, `add-setup.md names ${s}`).toContain(s);
    }
  });

  it('L1.6 asks per item, runs only accepted items, in the fixed order, with the MCP checkpoint', () => {
    const src = setupSrc();
    expect(src).toContain('yes/no');
    expect(src).toMatch(/only (the )?accepted items/i);
    expect(src).toMatch(/MCP checkpoint/);
    const exec = stepSection(src, 'add-setup.execute');
    const order = ['Install the external tools', 'codeadd modify', 'gitnexus setup', 'cmd:add-qa-setup', 'cmd:add-wiki'].map((s) => exec.indexOf(s));
    for (const i of order) expect(i).toBeGreaterThan(-1);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(exec).toContain('MCP checkpoint');
  });

  it('L1.7 carries no dispatch word, no agent-mode slot, no contract block, no git staging or commit', () => {
    const src = setupSrc();
    expect(src).not.toMatch(/\bDISPATCH\b/);
    expect(src).not.toContain('<!-- slot:agent-mode');
    expect(src).not.toContain('## Materializes');
    expect(src).not.toContain('git add');
    expect(src).not.toContain('git commit');
  });

  it('keeps benefit text and the greenfield rule out of the command', () => {
    const src = setupSrc();
    const bt = (h) => tableRows(sectionOf(eco(), h));
    for (const t of [bt('## Features'), bt('## Plugins')]) {
      const col = t.header.indexOf('Benefit');
      for (const r of t.rows) expect(src, `${r[0]} benefit is not copied`).not.toContain(r[col]);
    }
    expect(src).toContain('cmd:add-brainstorm');
    expect(src).not.toContain('git ls-files --cached --others');
  });

  it('L1.8 writes the setup record, merges only setup and handles re-runs', () => {
    const src = setupSrc();
    for (const s of ['.codeadd/settings.json', '`setup`', 'setup-shape', '"none"', 'framework-version', 'offered', 'log']) {
      expect(src, `record names ${s}`).toContain(s);
    }
    expect(src).toMatch(/one `log` entry per (decided )?item/);
    expect(src).toMatch(/absent from `offered`/);
    expect(src).toMatch(/declined[^\n]*(unless|until)[^\n]*revisit/i);
    expect(src).toMatch(/only the `setup` section/);
    expect(src).toMatch(/does not parse[^\n]*(STOP|stop)/);
    expect(src).toMatch(/no longer offered/);
  });

  it('L1.9 offers version-record, recommended yes, and on no appends the line after # END ADD', () => {
    const src = setupSrc();
    expect(src).toContain('version-record');
    expect(src).toMatch(/version-record[^\n]*recommended[^\n]*yes/i);
    expect(src).toContain('# END ADD');
  });

  it('L1.10 is registered and is not an agent-mode command', async () => {
    const map = JSON.parse(read(path.join(root, 'framwork/provider-map.json')));
    expect(Object.keys(map.commands)).toContain('add-setup');
    expect(FEATURES['agent-mode'].commands).not.toContain('add-setup');
  });

  it('F1/F2/F3 deferred edges: the graph names add-setup from the contracts it reads', () => {
    expect(read(settingsPath)).toContain('- command: /add-setup');
    expect(eco()).toContain('- mention: /add-setup');
    for (const name of ['add-qa-setup', 'add-wiki']) {
      expect(read(path.join(codeadd, `commands/${name}.md`))).toContain('{{cmd:add-setup}}');
    }
  });
});

describe('F5 — add-help points a new user at add-setup', () => {
  const help = () => read(path.join(codeadd, 'commands/add-help.md')).replace(/\r\n/g, '\n');

  it('L1.11 names /add-setup in uses and in the Suggestion Table, and keeps the --help-only rule', () => {
    const src = help();
    expect(src.slice(0, src.indexOf('-->'))).toContain('- command: /add-setup');
    expect(src).toMatch(/\| codeadd just installed[^\n]*`\/add-setup`[^\n]*Guided onboarding/);
    expect(src).toContain('The only `codeadd` command this command runs is `codeadd --help`');
    expect(src).toContain('Run a `codeadd` command other than `--help`');
    expect(src).toContain('For a plugin, add nothing about installing the external tool.');
  });

  it('Type G tells the user to run /add-setup to set several up at once', () => {
    const src = help();
    const typeG = src.slice(src.indexOf('### Type G'), src.indexOf('### Type H'));
    expect(typeG).toMatch(/several[^\n]*`\/add-setup`/);
  });
});

describe('F6 — the CLI outros and the plugin catalog wording', () => {
  const cli = (f) => read(path.join(root, 'cli/src', f));

  it('L1.12 the install outro points at /add-setup then /add-help', () => {
    const src = cli('installer.js');
    expect(src).toContain('run: /add-setup');
    expect(src).toContain('run: /add-help');
    expect(src.indexOf('run: /add-setup')).toBeLessThan(src.indexOf('run: /add-help'));
    expect(src).toContain('ADD installed successfully!');
  });

  it('L1.12 the update outro points at /add-setup', () => {
    const src = cli('updater.js');
    expect(src).toContain('ADD updated successfully!');
    expect(src).toMatch(/run\s+\/add-setup to review what is new in this version/);
  });

  it('L1.12 the plugin catalog says the setup commands may install a tool after the user confirms', () => {
    const doc = JSON.parse(cli('plugins.json'))['$schema-doc'].description;
    expect(doc).toContain('may install a tool after the user confirms');
    expect(doc).toContain('The CLI owns utilization, never installation');
  });
});

describe('F7 — AGENTS.md, README and the web docs', () => {
  it('L1.13 the Plugin System paragraph names /add-setup, the README and docs.astro list it', () => {
    const agents = read(path.join(root, 'AGENTS.md'));
    const pluginPara = agents.slice(agents.indexOf('## Plugin System'), agents.indexOf('## Setup Contracts'));
    expect(pluginPara).toContain('/add-setup');
    expect(pluginPara).toContain('after the user confirms');
    expect(read(path.join(root, 'README.md'))).toContain('/add-setup');
    const docsPage = read(path.join(root, 'web/src/pages/docs.astro'));
    const enPath = path.join(root, 'web/src/i18n/en.ts');
    const docs = docsPage + (fs.existsSync(enPath) ? read(enPath) : '');
    expect(docs).toMatch(/<code[^>]*>\/add-setup<\/code>|\{ name: "\/add-setup"/);
  });
});

describe('review fixes — re-run edges of the command', () => {
  it('asks tdd-pipeline on a first run, re-offers a stale QA setup and a board that became available', () => {
    const src = setupSrc();
    expect(src).toMatch(/`tdd-pipeline` is on by default, but on a first run[^\n]*still asked/);
    expect(src).toMatch(/`qa-setup` with `SETUP_QA_STALE:yes` counts as \*\*drift\*\*/);
    expect(src).toMatch(/`board` recorded `unavailable` counts as \*\*drift\*\* once `\.codeadd\/board\.json` exists/);
  });

  it('the record step names the STOPs that skip it, and add--settings keeps the ban for a section with a contract', () => {
    expect(setupSrc()).toMatch(/no manifest[^\n]*does not parse[^\n]*skip it/);
    expect(read(settingsPath)).toMatch(/not a bare `sha256:` \+ 16 hex in a section whose command has a contract/);
  });
});
